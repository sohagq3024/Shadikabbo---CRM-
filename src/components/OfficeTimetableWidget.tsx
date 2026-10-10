import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Camera,
  Coffee,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  getLiveBangladeshTime,
  getShiftTimetableStatus,
  BangladeshTimeInfo,
  ShiftTimetableStatus,
} from '../utils/bangladeshTime';

interface OfficeTimetableWidgetProps {
  user?: any;
  attendanceRecord?: any;
  onOpenScanner?: () => void;
  compact?: boolean;
  isAdminView?: boolean;
}

export const OfficeTimetableWidget: React.FC<OfficeTimetableWidgetProps> = ({
  user,
  attendanceRecord,
  onOpenScanner,
  compact = false,
  isAdminView = false,
}) => {
  const isSuperAdmin = isAdminView || user?.role === 'Super Admin';
  const [timeInfo, setTimeInfo] = useState<BangladeshTimeInfo>(() => getLiveBangladeshTime());
  const [shiftStatus, setShiftStatus] = useState<ShiftTimetableStatus>(() =>
    getShiftTimetableStatus(new Date(), {
      hasCheckedIn: !isSuperAdmin ? !!attendanceRecord?.hasCheckedIn : false,
      hasCheckedOut: !isSuperAdmin ? !!attendanceRecord?.hasCheckedOut : false,
      isDayOffToday: !isSuperAdmin ? !!attendanceRecord?.isDayOffToday : false,
    })
  );

  // Live ticking clock every second in Bangladesh Standard Time (BST, UTC+6)
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTimeInfo(getLiveBangladeshTime(now));
      setShiftStatus(
        getShiftTimetableStatus(now, {
          hasCheckedIn: !isSuperAdmin ? !!attendanceRecord?.hasCheckedIn : false,
          hasCheckedOut: !isSuperAdmin ? !!attendanceRecord?.hasCheckedOut : false,
          isDayOffToday: !isSuperAdmin ? !!attendanceRecord?.isDayOffToday : false,
        })
      );
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [attendanceRecord, isSuperAdmin]);

  const isDayOff = attendanceRecord?.isDayOffToday;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 md:p-6 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden">
      {/* Decorative background ambient gradient */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-[#181E54]/5 via-amber-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* HEADER: Live Bangladesh Time & Timezone Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>Office Timetable &amp; Live Time</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="text-slate-600 font-medium">লাইভ অফিস সময়সূচী</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized with <strong className="text-slate-700 font-semibold">Bangladesh Standard Time (BST, UTC+6 / Asia/Dhaka)</strong>
          </p>
        </div>

        {/* Live BST Digital Clock Display */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto bg-slate-50 border border-slate-200/90 px-3.5 py-1.5 rounded-xl shadow-2xs">
          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="text-left">
            <div className="font-mono font-extrabold text-[#181E54] text-sm sm:text-base leading-none tracking-tight">
              {timeInfo.time12WithSeconds}
            </div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              {timeInfo.dayName} · BST
            </div>
          </div>
        </div>
      </div>

      {/* LIVE SHIFT PROGRESS BAR (10:00 AM to 06:00 PM) */}
      <div className="mt-4 pt-1">
        <div className="flex items-center justify-between text-xs font-bold mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                isDayOff
                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                  : shiftStatus.badgeColor === 'rose'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : shiftStatus.badgeColor === 'amber'
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    shiftStatus.badgeColor === 'rose'
                      ? 'bg-rose-400'
                      : shiftStatus.badgeColor === 'amber'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                    shiftStatus.badgeColor === 'rose'
                      ? 'bg-rose-500'
                      : shiftStatus.badgeColor === 'amber'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
              </span>
              <span>{isDayOff ? 'সাপ্তাহিক ছুটি (Weekly Day-Off)' : shiftStatus.badgeLabel}</span>
            </span>

            <span className="text-[11px] font-semibold text-slate-600 hidden sm:inline-block">
              {isDayOff ? 'No office duty today' : shiftStatus.countdownText}
            </span>
          </div>

          <div className="text-right text-[11px] font-mono font-bold text-slate-500">
            {isDayOff ? 'Rest Day' : `${shiftStatus.progressPercent}% Shift Progress`}
          </div>
        </div>

        {/* Progress bar line */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isDayOff
                ? 'bg-purple-500 w-full'
                : shiftStatus.progressPercent >= 100
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500'
            }`}
            style={{ width: isDayOff ? '100%' : `${shiftStatus.progressPercent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 px-0.5">
          <span>10:00 AM (Start)</span>
          <span className="hidden sm:inline">10:15 AM (Grace)</span>
          <span className="hidden md:inline">01:30 PM (Break)</span>
          <span className="hidden sm:inline">05:30 PM (Pre-Out)</span>
          <span>06:00 PM (Conclude)</span>
        </div>
      </div>

      {/* SCHEDULE BREAKDOWN GRID: 4 Key Official Shift Timetable Blocks */}
      {!compact && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-1">
          {/* Milestone 1: In-Time */}
          <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/70 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                1. Check-In Window
              </span>
              <Clock className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-base font-extrabold text-[#181E54] font-mono leading-none my-1">
              10:00 AM
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              অফিস শুরুর সময় · Official morning entry
            </p>
          </div>

          {/* Milestone 2: Grace Period */}
          <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/70 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                2. Grace Period
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-base font-extrabold text-amber-700 font-mono leading-none my-1">
              10:15 AM
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              ১৫ মিনিট ছাড় · After this marked late
            </p>
          </div>

          {/* Milestone 3: Lunch / Break */}
          <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/70 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                3. Lunch &amp; Prayer
              </span>
              <Coffee className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-base font-extrabold text-purple-700 font-mono leading-none my-1">
              01:30 - 02:30 PM
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              নামাজ ও দুপুরের খাবার বিরতি
            </p>
          </div>

          {/* Milestone 4: Out-Time */}
          <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/70 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                4. Check-Out Time
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-base font-extrabold text-emerald-700 font-mono leading-none my-1">
              06:00 PM
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              ৮ ঘণ্টার শিফট সমাপ্ত · Departure punch
            </p>
          </div>
        </div>
      )}

      {/* QUICK ATTENDANCE ACTION FOOTER */}
      {isSuperAdmin ? (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold text-slate-800">Admin Shift Timetable:</span>
            <span className="text-slate-600">
              Active shift 10:00 AM – 06:00 PM BST · Mandatory for CRO &amp; MK Staff (Super Admin exempt).
            </span>
          </div>

          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 bg-[#181E54] hover:bg-[#121642] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer touch-manipulation active:scale-[0.98] self-stretch sm:self-auto"
            >
              <Camera className="w-3.5 h-3.5 text-[#D81124]" />
              <span>Launch QR Scanner</span>
            </button>
          )}
        </div>
      ) : onOpenScanner && !isDayOff && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-bold text-slate-800">Your Today Status:</span>
            {attendanceRecord?.hasCheckedIn ? (
              attendanceRecord?.hasCheckedOut ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Daily Shift Done (In: {attendanceRecord.record?.inTime} · Out: {attendanceRecord.record?.outTime})
                </span>
              ) : (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Checked In at {attendanceRecord.record?.inTime || '10:00 AM'} · Working in office
                </span>
              )
            ) : (
              <span className="text-amber-700 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                Check-In Pending for Today
              </span>
            )}
          </div>

          {(!attendanceRecord?.hasCheckedIn || !attendanceRecord?.hasCheckedOut) && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#181E54] hover:bg-[#121642] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer touch-manipulation active:scale-[0.98] self-stretch sm:self-auto"
            >
              <Camera className="w-4 h-4 text-[#D81124]" />
              <span>
                {!attendanceRecord?.hasCheckedIn
                  ? 'Scan Office QR (In-Time)'
                  : 'Scan Office QR (Out-Time)'}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
