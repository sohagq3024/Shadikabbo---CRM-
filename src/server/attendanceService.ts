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
export const STANDARD_START_HOUR = 9;
export const STANDARD_START_MINUTE = 30; // 09:30 AM
export const GRACE_MINUTE = 15; // up to 09:45 AM not penalized; beyond that counted from 09:30
export const STANDARD_END_HOUR = 18;
export const STANDARD_END_MINUTE = 30; // 06:30 PM

// Format 12-hour time
export function formatTime12(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const strMinutes = minutes < 10 ? '0' + minutes : minutes;
  const strHours = hours < 10 ? '0' + hours : hours;
  return `${strHours}:${strMinutes} ${ampm}`;
}

// Format YYYY-MM-DD
export function formatDateYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateLateMinutes(date: Date): number {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentTotal = hours * 60 + minutes;
  const standardStart = STANDARD_START_HOUR * 60 + STANDARD_START_MINUTE; // 570 mins (09:30 AM)
  const graceThreshold = standardStart + GRACE_MINUTE; // 585 mins (09:45 AM)

  if (currentTotal > graceThreshold) {
    return currentTotal - standardStart;
  }
  return 0;
}

export function calculateEarlyOutMinutes(date: Date): number {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentTotal = hours * 60 + minutes;
  const standardEnd = STANDARD_END_HOUR * 60 + STANDARD_END_MINUTE; // 1110 mins (06:30 PM)

  if (currentTotal < standardEnd) {
    return standardEnd - currentTotal;
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
