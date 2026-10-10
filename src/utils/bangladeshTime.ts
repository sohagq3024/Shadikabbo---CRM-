/**
 * Bangladesh Standard Time (BST, UTC+6 / Asia/Dhaka) Utilities & Timetable Engine
 * Ensures all attendance timestamps, live clocks, late/early calculations,
 * shift progress, and day-off schedules strictly adhere to Bangladesh local time across
 * all client and server environments.
 */

export const BANGLADESH_TIMEZONE = 'Asia/Dhaka';

// Official Shadikabbo Office Timetable Schedule (BST)
export const STANDARD_START_HOUR = 10;
export const STANDARD_START_MINUTE = 0; // 10:00 AM
export const GRACE_MINUTE = 15; // 10:15 AM (Grace period threshold)
export const STANDARD_END_HOUR = 18;
export const STANDARD_END_MINUTE = 0; // 06:00 PM (8-hour shift finish)

// Timetable milestones in minutes from midnight (BST)
export const START_MINUTES = STANDARD_START_HOUR * 60 + STANDARD_START_MINUTE; // 600 (10:00 AM)
export const GRACE_THRESHOLD_MINUTES = START_MINUTES + GRACE_MINUTE; // 615 (10:15 AM)
export const EARLY_WINDOW_MINUTES = 8 * 60 + 30; // 510 (08:30 AM early gate open)
export const CHECKIN_ALERT_MINUTES = 9 * 60 + 30; // 570 (09:30 AM check-in alert)
export const LUNCH_START_MINUTES = 13 * 60 + 30; // 810 (01:30 PM Lunch / Prayer break)
export const LUNCH_END_MINUTES = 14 * 60 + 30; // 870 (02:30 PM Resume shift)
export const CHECKOUT_APPROACHING_MINUTES = 17 * 60 + 30; // 1050 (05:30 PM Departure alert)
export const END_MINUTES = STANDARD_END_HOUR * 60 + STANDARD_END_MINUTE; // 1080 (06:00 PM Official Out-Time)

export interface BangladeshTimeInfo {
  hours: number;
  minutes: number;
  seconds: number;
  totalMinutes: number;
  isPM: boolean;
  time12: string;
  time12WithSeconds: string;
  dateYMD: string;
  dateDisplay: string;
  dayName: string;
  dayNameBn: string;
}

export interface ShiftTimetableStatus {
  phase:
    | 'pre_shift'
    | 'checkin_approaching'
    | 'grace_active'
    | 'shift_active'
    | 'lunch_break'
    | 'checkout_approaching'
    | 'shift_over'
    | 'checkout_overdue';
  badgeLabel: string;
  badgeLabelBn: string;
  badgeColor: 'blue' | 'amber' | 'emerald' | 'rose' | 'purple';
  headline: string;
  description: string;
  progressPercent: number; // 0 to 100% of the 10:00 AM to 06:00 PM shift
  countdownText: string;
  isUrgent: boolean;
}

/**
 * Robust extraction of Bangladesh Standard Time parts using Intl.DateTimeFormat
 */
export function getBangladeshHoursAndMinutes(date: Date | number = new Date()): {
  hours: number;
  minutes: number;
  seconds: number;
  totalMinutes: number;
} {
  const d = typeof date === 'number' ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BANGLADESH_TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(d);

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
 * Format date to 12-hour AM/PM string in Bangladesh time (e.g., "10:15 AM", "02:30 PM")
 */
export function formatBangladeshTime12(date: Date | number = new Date()): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: BANGLADESH_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Format date to 12-hour with seconds in Bangladesh time (e.g., "02:30:45 PM")
 */
export function formatBangladeshTimeWithSeconds(date: Date | number = new Date()): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: BANGLADESH_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Format date to YYYY-MM-DD in Bangladesh time
 */
export function formatBangladeshDateYMD(date: Date | number = new Date()): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BANGLADESH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

/**
 * Format date for friendly display in Bangladesh time (e.g. "Saturday, 10 Oct 2026")
 */
export function formatBangladeshDateDisplay(date: Date | number = new Date()): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: BANGLADESH_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Returns weekday name in Bangladesh time (e.g., 'Saturday', 'Sunday', etc.)
 */
export function getBangladeshWeekdayName(date: Date | number = new Date()): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: BANGLADESH_TIMEZONE,
    weekday: 'long',
  }).format(d);
}

const BENGALI_DAYS: Record<string, string> = {
  Saturday: 'শনিবার',
  Sunday: 'রবিবার',
  Monday: 'সোমবার',
  Tuesday: 'মঙ্গলবার',
  Wednesday: 'বুধবার',
  Thursday: 'বৃহস্পতিবার',
  Friday: 'শুক্রবার',
};

/**
 * Get comprehensive live Bangladesh time metadata
 */
export function getLiveBangladeshTime(date: Date | number = new Date()): BangladeshTimeInfo {
  const d = typeof date === 'number' ? new Date(date) : date;
  const { hours, minutes, seconds, totalMinutes } = getBangladeshHoursAndMinutes(d);
  const dayName = getBangladeshWeekdayName(d);

  return {
    hours,
    minutes,
    seconds,
    totalMinutes,
    isPM: hours >= 12,
    time12: formatBangladeshTime12(d),
    time12WithSeconds: formatBangladeshTimeWithSeconds(d),
    dateYMD: formatBangladeshDateYMD(d),
    dateDisplay: formatBangladeshDateDisplay(d),
    dayName,
    dayNameBn: BENGALI_DAYS[dayName] || dayName,
  };
}

/**
 * Calculate late arrival minutes based on Bangladesh Standard Time (10:00 AM start, 15m grace)
 */
export function calculateLateMinutesBST(date: Date | number = new Date()): number {
  const { totalMinutes } = getBangladeshHoursAndMinutes(date);
  if (totalMinutes > GRACE_THRESHOLD_MINUTES) {
    return totalMinutes - START_MINUTES;
  }
  return 0;
}

/**
 * Calculate early departure minutes based on Bangladesh Standard Time (06:00 PM end)
 */
export function calculateEarlyOutMinutesBST(date: Date | number = new Date()): number {
  const { totalMinutes } = getBangladeshHoursAndMinutes(date);
  if (totalMinutes < END_MINUTES) {
    return END_MINUTES - totalMinutes;
  }
  return 0;
}

/**
 * Compute the live shift timetable state and progress for Bangladesh Standard Time
 */
export function getShiftTimetableStatus(
  date: Date | number = new Date(),
  attendance?: { hasCheckedIn?: boolean; hasCheckedOut?: boolean; isDayOffToday?: boolean }
): ShiftTimetableStatus {
  const { totalMinutes } = getBangladeshHoursAndMinutes(date);

  // 1. Shift Progress Percentage (10:00 AM = 0%, 06:00 PM = 100%)
  const shiftDuration = END_MINUTES - START_MINUTES; // 480 minutes (8 hours)
  let progressPercent = 0;
  if (totalMinutes >= END_MINUTES) {
    progressPercent = 100;
  } else if (totalMinutes > START_MINUTES) {
    progressPercent = Math.min(100, Math.max(0, Math.round(((totalMinutes - START_MINUTES) / shiftDuration) * 100)));
  }

  // 2. Determine timetable phase
  if (totalMinutes < CHECKIN_ALERT_MINUTES) {
    // Before 09:30 AM
    const diffMins = START_MINUTES - totalMinutes;
    const hoursLeft = Math.floor(diffMins / 60);
    const minsLeft = diffMins % 60;
    const countdown = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m` : `${minsLeft}m`;

    return {
      phase: 'pre_shift',
      badgeLabel: 'Upcoming Shift · 10:00 AM',
      badgeLabelBn: 'আসন্ন শিফট · সকাল ১০:০০',
      badgeColor: 'blue',
      headline: 'Morning Shift Starts at 10:00 AM',
      description: 'Official office timetable begins at 10:00 AM BST. 15-minute grace period applies until 10:15 AM.',
      progressPercent: 0,
      countdownText: `Shift starts in ${countdown}`,
      isUrgent: false,
    };
  }

  if (totalMinutes < START_MINUTES) {
    // 09:30 AM to 10:00 AM
    const diffMins = START_MINUTES - totalMinutes;
    return {
      phase: 'checkin_approaching',
      badgeLabel: `Check-In Approaching · ${diffMins}m Left`,
      badgeLabelBn: `চেক-ইন সময় বাকি · ${diffMins} মি.`,
      badgeColor: 'amber',
      headline: 'Office Hours Starting Soon',
      description: `Shift commences at 10:00 AM. Please scan the official office QR code upon reaching the premises.`,
      progressPercent: 0,
      countdownText: `${diffMins} minutes until 10:00 AM`,
      isUrgent: !attendance?.hasCheckedIn,
    };
  }

  if (totalMinutes <= GRACE_THRESHOLD_MINUTES) {
    // 10:00 AM to 10:15 AM (Grace Period)
    const graceRemaining = GRACE_THRESHOLD_MINUTES - totalMinutes;
    return {
      phase: 'grace_active',
      badgeLabel: `Grace Period · ${graceRemaining}m Left`,
      badgeLabelBn: `গ্রেস পিরিয়ড · ${graceRemaining} মি. বাকি`,
      badgeColor: 'amber',
      headline: 'Attendance Grace Period Active',
      description: `Official hours have begun. You have ${graceRemaining} minutes left to record an on-time check-in.`,
      progressPercent: Math.round(((totalMinutes - START_MINUTES) / shiftDuration) * 100),
      countdownText: `${graceRemaining}m remaining in grace window`,
      isUrgent: !attendance?.hasCheckedIn,
    };
  }

  if (totalMinutes >= LUNCH_START_MINUTES && totalMinutes <= LUNCH_END_MINUTES) {
    // 01:30 PM to 02:30 PM
    const remainingBreak = LUNCH_END_MINUTES - totalMinutes;
    return {
      phase: 'lunch_break',
      badgeLabel: `Lunch / Prayer Break · ${remainingBreak}m`,
      badgeLabelBn: `মধ্যাহ্ন বিরতি · ${remainingBreak} মি.`,
      badgeColor: 'purple',
      headline: 'Mid-day Break & Refreshment Hour',
      description: 'Official schedule allows refreshment and prayer until 02:30 PM BST.',
      progressPercent,
      countdownText: `Break concludes in ${remainingBreak}m`,
      isUrgent: false,
    };
  }

  if (totalMinutes < CHECKOUT_APPROACHING_MINUTES) {
    // 10:15 AM to 05:30 PM (Regular Shift)
    const shiftRemaining = END_MINUTES - totalMinutes;
    const hoursLeft = Math.floor(shiftRemaining / 60);
    const minsLeft = shiftRemaining % 60;
    return {
      phase: 'shift_active',
      badgeLabel: `Shift Active · ${progressPercent}% Done`,
      badgeLabelBn: `শিফট চলমান · ${progressPercent}% সম্পন্ন`,
      badgeColor: 'emerald',
      headline: 'Official Shift In Progress',
      description: `Working hours active. Scheduled conclusion at 06:00 PM BST (${hoursLeft}h ${minsLeft}m remaining).`,
      progressPercent,
      countdownText: `${hoursLeft}h ${minsLeft}m remaining in shift`,
      isUrgent: !attendance?.hasCheckedIn, // Urgent only if forgot to check in
    };
  }

  if (totalMinutes <= END_MINUTES) {
    // 05:30 PM to 06:00 PM (Check-out Approaching)
    const shiftRemaining = END_MINUTES - totalMinutes;
    return {
      phase: 'checkout_approaching',
      badgeLabel: `Shift Ending in ${shiftRemaining}m`,
      badgeLabelBn: `শিফট সমাপ্তি · ${shiftRemaining} মি. বাকি`,
      badgeColor: 'amber',
      headline: 'Office Hours Concluding Soon',
      description: `Official 8-hour shift finishes at 06:00 PM BST. Remember to scan out before leaving the office.`,
      progressPercent,
      countdownText: `${shiftRemaining} minutes until 06:00 PM`,
      isUrgent: !!(attendance?.hasCheckedIn && !attendance?.hasCheckedOut),
    };
  }

  // After 06:00 PM (Shift Over)
  const overdueMins = totalMinutes - END_MINUTES;
  const overdueHours = Math.floor(overdueMins / 60);
  const overdueRemainder = overdueMins % 60;
  const overdueStr = overdueHours > 0 ? `${overdueHours}h ${overdueRemainder}m` : `${overdueRemainder}m`;

  if (attendance?.hasCheckedIn && !attendance?.hasCheckedOut) {
    return {
      phase: 'checkout_overdue',
      badgeLabel: `Check-Out Pending · ${overdueStr} Overdue`,
      badgeLabelBn: `পাঞ্চ আউট বাকি · ${overdueStr} অতিক্রান্ত`,
      badgeColor: 'rose',
      headline: 'Forgot to Check-Out? Out-Time Pending',
      description: `Official shift ended at 06:00 PM BST (${overdueStr} ago). Please scan the QR code to record your departure.`,
      progressPercent: 100,
      countdownText: `Shift ended ${overdueStr} ago`,
      isUrgent: true,
    };
  }

  return {
    phase: 'shift_over',
    badgeLabel: 'Shift Concluded · 06:00 PM',
    badgeLabelBn: 'অফিস সমাপ্ত · সন্ধ্যা ০৬:০০',
    badgeColor: 'emerald',
    headline: 'Official Working Hours Completed',
    description: `Official office hours concluded at 06:00 PM BST. Office resumes tomorrow at 10:00 AM.`,
    progressPercent: 100,
    countdownText: `Office closed · Completed for today`,
    isUrgent: false,
  };
}
