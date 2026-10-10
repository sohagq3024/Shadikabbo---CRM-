import QRCode from 'qrcode';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  userId: string;
  userName: string;
  userRole: 'MK' | 'CRO';
  userPhone: string;
  inTime: string; // e.g. "09:22 AM"
  inTimestamp: number;
  outTime: string | null; // e.g. "06:35 PM"
  outTimestamp: number | null;
  status: 'present' | 'absent' | 'day_off';
  lateMinutes: number;
  earlyOutMinutes: number;
  workDurationMinutes?: number;
  scanMethod: 'qr_scanner' | 'manual' | 'offline_synced';
  notes?: string;
}

export const OFFICE_QR_SECRET = 'SHADIKABBO_OFFICE_ATTENDANCE_QR_2026';
export const STANDARD_START_HOUR = 10;
export const STANDARD_START_MINUTE = 0; // 10:00 AM
export const GRACE_MINUTE = 15; // up to 10:15 AM not penalized; beyond that counted from 10:00 AM
export const STANDARD_END_HOUR = 18;
export const STANDARD_END_MINUTE = 0; // 06:00 PM (18:00)

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type DayName = (typeof DAY_NAMES)[number];

/**
 * Returns list of scheduled weekly off day names for this staff member (e.g. ['Friday'], ['Saturday', 'Sunday']).
 * Default fallback is ['Friday'] if none configured.
 */
export function getStaffDayOffList(user: any): string[] {
  if (Array.isArray(user?.weeklyOffDays) && user.weeklyOffDays.length > 0) {
    return user.weeklyOffDays.map((d: any) => String(d).trim());
  }
  if (typeof user?.weeklyOffDay === 'string' && user.weeklyOffDay.trim()) {
    return [user.weeklyOffDay.trim()];
  }
  return ['Friday']; // Standard Bangladesh business default
}

export const BANGLADESH_TIMEZONE = 'Asia/Dhaka';

/**
 * Returns hours and minutes in Bangladesh Standard Time (UTC+6)
 */
export function getBangladeshHoursAndMinutes(date: Date = new Date()): {
  hours: number;
  minutes: number;
  seconds: number;
  totalMinutes: number;
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BANGLADESH_TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(date);

  let hours = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  if (hours === 24) hours = 0;
  const minutes = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
  const seconds = parseInt(parts.find((p) => p.type === 'second')?.value || '0', 10);
  return {
    hours,
    minutes,
    seconds,
    totalMinutes: hours * 60 + minutes,
  };
}

/**
 * Returns a Date object adjusted to Bangladesh Standard Time (UTC+6)
 */
export function getBangladeshDate(date: Date = new Date()): Date {
  const bstStr = date.toLocaleString('en-US', { timeZone: BANGLADESH_TIMEZONE });
  return new Date(bstStr);
}

/**
 * Returns true if date corresponds to user's assigned weekly day-off in Bangladesh time
 */
export function isStaffDayOff(user: any, date: Date | string): boolean {
  let currentDayName = '';
  if (typeof date === 'string') {
    const parts = date.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD
      const d = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 6, 0, 0));
      currentDayName = new Intl.DateTimeFormat('en-US', {
        timeZone: BANGLADESH_TIMEZONE,
        weekday: 'long',
      }).format(d);
    } else {
      currentDayName = new Intl.DateTimeFormat('en-US', {
        timeZone: BANGLADESH_TIMEZONE,
        weekday: 'long',
      }).format(new Date(date));
    }
  } else {
    currentDayName = new Intl.DateTimeFormat('en-US', {
      timeZone: BANGLADESH_TIMEZONE,
      weekday: 'long',
    }).format(date);
  }

  const offList = getStaffDayOffList(user);
  return offList.some((day) => {
    const str = String(day).trim();
    return str.toLowerCase() === currentDayName.toLowerCase();
  });
}

// Format 12-hour time in Bangladesh Standard Time (Asia/Dhaka)
export function formatTime12(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: BANGLADESH_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

// Format YYYY-MM-DD in Bangladesh Standard Time (Asia/Dhaka)
export function formatDateYMD(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BANGLADESH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

export function calculateLateMinutes(date: Date = new Date()): number {
  const { totalMinutes } = getBangladeshHoursAndMinutes(date);
  const standardStart = STANDARD_START_HOUR * 60 + STANDARD_START_MINUTE; // 600 mins (10:00 AM)
  const graceThreshold = standardStart + GRACE_MINUTE; // 615 mins (10:15 AM)

  if (totalMinutes > graceThreshold) {
    return totalMinutes - standardStart;
  }
  return 0;
}

export function calculateEarlyOutMinutes(date: Date = new Date()): number {
  const { totalMinutes } = getBangladeshHoursAndMinutes(date);
  const standardEnd = STANDARD_END_HOUR * 60 + STANDARD_END_MINUTE; // 1080 mins (06:00 PM)

  if (totalMinutes < standardEnd) {
    return standardEnd - totalMinutes;
  }
  return 0;
}

export function getStaffMembers(db: any) {
  return (db.users || []).filter((u: any) => u.role === 'MK' || u.role === 'CRO');
}

// Ensure attendance array is initialized in db without injecting fake demo records
export function ensureAttendanceInitialized(db: any) {
  if (!db.attendance || !Array.isArray(db.attendance)) {
    db.attendance = [];
  }
}

// Generate Admin QR code data URL
export async function getOfficeQrDataUrl(): Promise<{ secret: string; dataUrl: string }> {
  const secret = OFFICE_QR_SECRET;
  const qrPayload = JSON.stringify({
    type: 'SHADIKABBO_OFFICE_ATTENDANCE',
    secret,
    timestamp: Date.now(),
    agency: 'Shadikabbo Matrimonial Services',
  });

  const dataUrl = await QRCode.toDataURL(qrPayload, {
    width: 380,
    margin: 2,
    color: {
      dark: '#181E54',
      light: '#FFFFFF',
    },
  });

  return { secret, dataUrl };
}
