import React, { useState, useEffect, useMemo } from 'react';
import {
  Users2,
  GitFork,
  CheckCircle,
  CheckCircle2,
  CreditCard,
  HeartHandshake,
  Clock,
  Camera,
  ArrowRight,
  Shield,
  ClipboardList,
  AlertTriangle,
  CalendarOff,
  X,
  Sparkles,
} from 'lucide-react';
import { SidebarPage } from './CrmLayout';
import { getBangladeshHoursAndMinutes } from '../utils/bangladeshTime';
import { OfficeTimetableWidget } from './OfficeTimetableWidget';

interface DashboardPageProps {
  user: any;
  token: string;
  onSelectPage: (page: SidebarPage) => void;
  onOpenScanner?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  token,
  onSelectPage,
  onOpenScanner,
}) => {
  const isSuperAdmin = user?.role === 'Super Admin';
  const isCRO = user?.role === 'CRO';
  const isMK = user?.role === 'MK';

  const [stats, setStats] = useState({
    leadsCount: 0,
    trafficCount: 0,
    paidCount: 0,
    paymentsCount: 0,
    todayAttendance: null as any,
    hasSubmittedDailyReport: false,
  });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  // Live timer every 30 seconds to keep attendance alert countdown and BST timetable fresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Compute live visual alert for staff attendance (Check-in approaching / Check-out forgotten)
  // NOTE: Strictly for CRO and MK accounts. Super Admin is exempt and does not require daily attendance.
  const attendanceAlert = useMemo(() => {
    if (isSuperAdmin) return null;
    const att = stats.todayAttendance;
    if (!att) return null;

    // Day Off check
    if (att.isDayOffToday) {
      return {
        type: 'day_off' as const,
        badgeLabel: 'Weekly Day-Off Today',
        badgeStyle: 'purple' as const,
        title: 'Weekly Day-Off (সাপ্তাহিক ছুটি)',
        description: 'Today is your scheduled weekly day-off. Office check-in is not required today.',
        highlightText: 'Enjoy your rest day',
        showScannerButton: false,
        isUrgent: false,
      };
    }

    const { totalMinutes: currentMinutes } = getBangladeshHoursAndMinutes(currentDate);

    const START_MINUTES = 10 * 60; // 10:00 AM (600)
    const GRACE_MINUTES = 10 * 60 + 15; // 10:15 AM (615)
    const END_MINUTES = 18 * 60; // 06:00 PM (1080)
    const CHECKOUT_APPROACHING_MINUTES = 17 * 60 + 30; // 05:30 PM (1050)

    const hasCheckedIn = !!att.hasCheckedIn;
    const hasCheckedOut = !!att.hasCheckedOut;
    const record = att.record;

    // SCENARIO 1: Staff has NOT checked in yet
    if (!hasCheckedIn) {
      // 1.1 Before 08:30 AM
      if (currentMinutes < 510) {
        return {
          type: 'checkin_early' as const,
          badgeLabel: 'Office Starts 10:00 AM',
          badgeStyle: 'blue' as const,
          title: 'Upcoming Morning Shift',
          description: 'Official office hours start at 10:00 AM. 15-minute grace period applies until 10:15 AM.',
          highlightText: 'Check-in window opens before 10:00 AM',
          showScannerButton: true,
          isUrgent: false,
        };
      }

      // 1.2 Check-In Approaching (08:30 AM to 10:00 AM)
      if (currentMinutes < START_MINUTES) {
        const diffMins = START_MINUTES - currentMinutes;
        return {
          type: 'checkin_approaching' as const,
          badgeLabel: `Check-In Approaching · ${diffMins}m Left`,
          badgeStyle: 'amber' as const,
          title: 'Check-In Time Approaching',
          description: `Office shift starts at 10:00 AM (in ${diffMins} minutes). Please scan the office QR code upon arrival to punch in.`,
          highlightText: 'Grace period until 10:15 AM',
          showScannerButton: true,
          isUrgent: true,
        };
      }

      // 1.3 Grace Period Active (10:00 AM to 10:15 AM)
      if (currentMinutes <= GRACE_MINUTES) {
        const graceRemaining = GRACE_MINUTES - currentMinutes;
        return {
          type: 'checkin_grace' as const,
          badgeLabel: `Grace Period Active · ${graceRemaining}m Left`,
          badgeStyle: 'amber' as const,
          title: 'Check-In Window Active',
          description: `Office hours have commenced. You have ${graceRemaining} minutes left in your grace period to record an on-time arrival.`,
          highlightText: 'Scan now before 10:15 AM',
          showScannerButton: true,
          isUrgent: true,
        };
      }

      // 1.4 Check-In Overdue (After 10:15 AM)
      const lateMins = currentMinutes - START_MINUTES;
      return {
        type: 'checkin_overdue' as const,
        badgeLabel: `Check-In Overdue · ${lateMins}m Late`,
        badgeStyle: 'rose' as const,
        title: 'Check-In Overdue — Attendance Not Recorded',
        description: `Your morning check-in is pending! You are ${lateMins} minutes past the standard 10:00 AM start time. Please scan the office QR code immediately to mark attendance.`,
        highlightText: 'Urgent: Punch In Required',
        showScannerButton: true,
        isUrgent: true,
      };
    }

    // SCENARIO 2: Staff HAS checked in, but has NOT checked out yet
    if (!hasCheckedOut) {
      // 2.1 Daytime active shift (before 05:30 PM)
      if (currentMinutes < CHECKOUT_APPROACHING_MINUTES) {
        return {
          type: 'shift_active' as const,
          badgeLabel: `Checked In · ${record?.inTime || 'Present'}`,
          badgeStyle: 'emerald' as const,
          title: 'Shift In Progress · In Office',
          description: `In-time logged at ${record?.inTime || '10:00 AM'}. Official work hours conclude at 06:00 PM.`,
          highlightText: 'Working hours active',
          showScannerButton: false,
          isUrgent: false,
        };
      }

      // 2.2 Check-Out Approaching (05:30 PM to 06:00 PM)
      if (currentMinutes < END_MINUTES) {
        const shiftRemaining = END_MINUTES - currentMinutes;
        return {
          type: 'checkout_approaching' as const,
          badgeLabel: `Shift Ending in ${shiftRemaining}m`,
          badgeStyle: 'amber' as const,
          title: 'Check-Out Approaching (Shift Ending Soon)',
          description: `Office shift concludes at 06:00 PM (in ${shiftRemaining} minutes). Remember to scan the office QR code before departing to log your Out-Time.`,
          highlightText: 'Evening punch-out reminder',
          showScannerButton: true,
          isUrgent: true,
        };
      }

      // 2.3 Forgot to Check-Out / Check-Out Due (After 06:00 PM)
      const overdueMins = currentMinutes - END_MINUTES;
      return {
        type: 'checkout_forgotten' as const,
        badgeLabel: `Forgot to Check-Out? · ${overdueMins}m Overdue`,
        badgeStyle: 'rose' as const,
        title: 'Forgot to Check-Out? Out-Time Pending',
        description: `Office hours concluded at 06:00 PM (${overdueMins} minutes ago). You have not scanned out yet! Please scan the office QR code now to record your departure and finalize your daily work duration.`,
        highlightText: 'Urgent: Punch Out to Complete Shift',
        showScannerButton: true,
        isUrgent: true,
      };
    }

    // SCENARIO 3: Both Check-In and Check-Out completed
    return {
      type: 'shift_complete' as const,
      badgeLabel: `Shift Completed · ${record?.outTime || 'Done'}`,
      badgeStyle: 'emerald' as const,
      title: 'Daily Attendance Complete',
      description: `Today's attendance is fully recorded! In-Time: ${record?.inTime || '-'} · Out-Time: ${record?.outTime || '-'} · Daily work hours logged.`,
      highlightText: 'Shift finalized',
      showScannerButton: false,
      isUrgent: false,
    };
  }, [stats.todayAttendance, currentDate]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [leadsRes, trafficRes, paidRes, attRes, dailyRes] = await Promise.all([
          fetch('/api/leads', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/traffic', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/paid-traffic', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/attendance/my-status', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/daily-reports', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const leads = leadsRes.ok ? await leadsRes.json() : [];
        const traffic = trafficRes.ok ? await trafficRes.json() : [];
        const paid = paidRes.ok ? await paidRes.json() : [];
        const att = attRes.ok ? await attRes.json() : null;
        const dailyData = dailyRes.ok ? await dailyRes.json() : null;

        setStats({
          leadsCount: Array.isArray(leads) ? leads.length : 0,
          trafficCount: Array.isArray(traffic) ? traffic.length : 0,
          paidCount: Array.isArray(paid) ? paid.length : 0,
          paymentsCount: Array.isArray(paid) ? paid.length : 0,
          todayAttendance: att,
          hasSubmittedDailyReport: !!dailyData?.hasSubmittedToday,
        });
      } catch (err) {
        console.error('Error fetching dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto space-y-4 sm:space-y-5 pb-8">
      {/* Welcome Hero Banner with Executive Profile Picture */}
      <div className="animate-card-fade-in stagger-0 bg-gradient-to-r from-[#181E54] via-[#1F2768] to-[#252E7D] rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4.5">
            {/* Account Owner Real Profile Picture */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white/90 ring-2 ring-amber-400/50 shadow-md bg-white/10 flex items-center justify-center text-white font-extrabold text-xl">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-mono">
                    {(user?.name || 'User')
                      .split(' ')
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#181E54] shadow-xs flex items-center justify-center"
                title="Account Status: Online & Active"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </span>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-[11px] font-semibold mb-1">
                <Shield className="w-3 h-3 text-[#D81124]" />
                <span>Shadikabbo CRM · {user?.role || 'Staff'}</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                Welcome back, {user?.name || 'User'}!
              </h1>
              <p className="text-xs sm:text-[13px] text-white/80 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                <span>Official Branch: <strong className="text-white font-semibold">{user?.branch || 'Uttara'}</strong></span>
                <span>·</span>
                <span>Official ID: <strong className="text-white font-mono">{user?.phone}</strong></span>
              </p>
            </div>
          </div>

          {/* Quick Scanner Action & Visual Attendance Status Badge */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
            {/* Visual alert pulsing indicator badge for staff */}
            {attendanceAlert && attendanceAlert.isUrgent && (
              <div
                onClick={onOpenScanner}
                className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  attendanceAlert.badgeStyle === 'rose'
                    ? 'bg-rose-500/25 text-rose-100 border border-rose-400/50 hover:bg-rose-500/35'
                    : 'bg-amber-500/25 text-amber-100 border border-amber-400/50 hover:bg-amber-500/35'
                }`}
                title="Click to open attendance scanner immediately"
              >
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      attendanceAlert.badgeStyle === 'rose' ? 'bg-rose-400' : 'bg-amber-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      attendanceAlert.badgeStyle === 'rose' ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                  />
                </span>
                <span className="truncate">{attendanceAlert.badgeLabel}</span>
              </div>
            )}

            {onOpenScanner && (
              <button
                type="button"
                onClick={onOpenScanner}
                className="flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-white text-[#181E54] hover:bg-slate-100 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-xs cursor-pointer touch-manipulation active:scale-[0.98] shrink-0"
              >
                <Camera className="w-4 h-4 text-[#D81124]" />
                <span>Daily Attendance Scanner</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Visual Alert Banner for Staff Attendance (Check-in Approaching / Grace Window / Overdue / Forgot to Check-Out) - CRO & MK Roles Only */}
      {!isSuperAdmin && attendanceAlert && attendanceAlert.type !== 'shift_complete' && attendanceAlert.type !== 'day_off' && !isAlertDismissed && (
        <div
          className={`animate-card-fade-in rounded-2xl p-4 sm:p-5 border transition-all ${
            attendanceAlert.badgeStyle === 'rose'
              ? 'bg-gradient-to-r from-rose-50 via-rose-50/70 to-white border-rose-200/90 text-rose-950 shadow-xs'
              : attendanceAlert.badgeStyle === 'amber'
              ? 'bg-gradient-to-r from-amber-50 via-amber-50/70 to-white border-amber-200/90 text-amber-950 shadow-xs'
              : attendanceAlert.badgeStyle === 'blue'
              ? 'bg-gradient-to-r from-blue-50 via-blue-50/70 to-white border-blue-200/90 text-blue-950 shadow-xs'
              : 'bg-gradient-to-r from-emerald-50 via-emerald-50/70 to-white border-emerald-200/90 text-emerald-950 shadow-xs'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
            <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
              {/* Alert Icon with Visual Ring */}
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                  attendanceAlert.badgeStyle === 'rose'
                    ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-200'
                    : attendanceAlert.badgeStyle === 'amber'
                    ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-200'
                    : attendanceAlert.badgeStyle === 'blue'
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200'
                    : 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200'
                }`}
              >
                {attendanceAlert.badgeStyle === 'rose' ? (
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : attendanceAlert.badgeStyle === 'amber' ? (
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : attendanceAlert.badgeStyle === 'blue' ? (
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {/* Visual Pulsing Badge Indicator */}
                  <div
                    className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      attendanceAlert.badgeStyle === 'rose'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : attendanceAlert.badgeStyle === 'amber'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : attendanceAlert.badgeStyle === 'blue'
                        ? 'bg-blue-100 text-blue-900 border-blue-300'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}
                  >
                    {attendanceAlert.isUrgent && (
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span
                          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            attendanceAlert.badgeStyle === 'rose' ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                        />
                        <span
                          className={`relative inline-flex rounded-full h-2 w-2 ${
                            attendanceAlert.badgeStyle === 'rose' ? 'bg-rose-600' : 'bg-amber-600'
                          }`}
                        />
                      </span>
                    )}
                    <span>{attendanceAlert.badgeLabel}</span>
                  </div>

                  {attendanceAlert.highlightText && (
                    <span className="text-[11px] font-medium text-slate-500 hidden sm:inline-block">
                      · {attendanceAlert.highlightText}
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  {attendanceAlert.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-600 mt-0.5 leading-relaxed">
                  {attendanceAlert.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center w-full md:w-auto">
              {attendanceAlert.showScannerButton && onOpenScanner && (
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl text-xs sm:text-[13px] font-bold text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer touch-manipulation active:scale-[0.98] ${
                    attendanceAlert.badgeStyle === 'rose'
                      ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800'
                      : 'bg-gradient-to-r from-[#181E54] to-[#252E7D] hover:bg-[#121642]'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Open QR Scanner Now</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsAlertDismissed(true)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Bangladesh Office Timetable & Live Shift Tracker - Visible on CRO & MK Dashboard, integrated into Attendance section for Admin */}
      {!isSuperAdmin && (
        <OfficeTimetableWidget
          user={user}
          attendanceRecord={stats.todayAttendance}
          onOpenScanner={onOpenScanner}
        />
      )}

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
        {/* Leads */}
        <div
          onClick={() => onSelectPage('Lead')}
          className="animate-card-fade-in stagger-1 bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-[#181E54]/30 hover:shadow-xs transition-all cursor-pointer group active:scale-[0.98] touch-manipulation min-h-[110px] sm:min-h-[120px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs sm:text-[13px] font-bold text-slate-600 truncate mr-1">
              {isSuperAdmin ? 'Total Leads' : 'My Leads'}
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#181E54] font-mono leading-none my-1">
            {loading ? '-' : stats.leadsCount}
          </div>
          <div className="mt-1 text-[11px] sm:text-xs text-purple-600 font-bold flex items-center gap-1 group-hover:underline">
            <span>View Leads</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Client */}
        <div
          onClick={() => onSelectPage('Client')}
          className="animate-card-fade-in stagger-2 bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-[#181E54]/30 hover:shadow-xs transition-all cursor-pointer group active:scale-[0.98] touch-manipulation min-h-[110px] sm:min-h-[120px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs sm:text-[13px] font-bold text-slate-600 truncate mr-1">
              {isSuperAdmin ? 'Active Clients' : 'My Clients'}
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <GitFork className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#181E54] font-mono leading-none my-1">
            {loading ? '-' : stats.trafficCount}
          </div>
          <div className="mt-1 text-[11px] sm:text-xs text-blue-600 font-bold flex items-center gap-1 group-hover:underline">
            <span>View Clients</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Paid Client / Matchmaking */}
        <div
          onClick={() => onSelectPage(isMK ? 'Matchmaking' : 'Paid Client')}
          className="animate-card-fade-in stagger-3 bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-[#181E54]/30 hover:shadow-xs transition-all cursor-pointer group active:scale-[0.98] touch-manipulation min-h-[110px] sm:min-h-[120px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs sm:text-[13px] font-bold text-slate-600 truncate mr-1">
              {isMK ? 'Matchmaking Pool' : isSuperAdmin ? 'Paid Client' : 'My Paid Clients'}
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              {isMK ? <HeartHandshake className="w-4 h-4 text-[#D81124]" /> : <CheckCircle className="w-4 h-4" />}
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#181E54] font-mono leading-none my-1">
            {loading ? '-' : stats.paidCount}
          </div>
          <div className="mt-1 text-[11px] sm:text-xs text-emerald-600 font-bold flex items-center gap-1 group-hover:underline truncate">
            <span>{isMK ? 'Open Pool' : 'View Clients'}</span>
            <ArrowRight className="w-3 h-3 shrink-0" />
          </div>
        </div>

        {/* Attendance Status */}
        <div
          onClick={() => onSelectPage('Attendance')}
          className={`animate-card-fade-in stagger-4 bg-white rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group active:scale-[0.98] touch-manipulation min-h-[110px] sm:min-h-[120px] flex flex-col justify-between ${
            !isSuperAdmin && attendanceAlert?.isUrgent
              ? attendanceAlert.badgeStyle === 'rose'
                ? 'border-rose-300 ring-2 ring-rose-100 hover:border-rose-400'
                : 'border-amber-300 ring-2 ring-amber-100 hover:border-amber-400'
              : 'border-slate-200/90 hover:border-[#181E54]/30'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0 mr-1">
              <span className="text-xs sm:text-[13px] font-bold text-slate-600 truncate">
                {isSuperAdmin ? 'Staff Attendance' : 'Today Attendance'}
              </span>
              {!isSuperAdmin && attendanceAlert?.isUrgent && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      attendanceAlert.badgeStyle === 'rose' ? 'bg-rose-400' : 'bg-amber-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      attendanceAlert.badgeStyle === 'rose' ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                  />
                </span>
              )}
            </div>
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 ${
                !isSuperAdmin && attendanceAlert?.badgeStyle === 'rose'
                  ? 'bg-rose-50 text-rose-700'
                  : !isSuperAdmin && attendanceAlert?.badgeStyle === 'amber'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-bold leading-tight truncate my-1">
            {isSuperAdmin ? (
              <span className="text-[#181E54] font-extrabold text-xs sm:text-sm">
                CRO &amp; MK Logs
              </span>
            ) : stats.todayAttendance?.isDayOffToday ? (
              <span className="text-purple-700 font-bold truncate">Weekly Day-Off</span>
            ) : stats.todayAttendance?.hasCheckedIn ? (
              stats.todayAttendance?.hasCheckedOut ? (
                <span className="text-emerald-700 font-bold truncate">
                  Done ({stats.todayAttendance.record?.outTime || 'Out'})
                </span>
              ) : attendanceAlert?.type === 'checkout_forgotten' ? (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <span className="animate-pulse">●</span> Check-Out Due!
                </span>
              ) : attendanceAlert?.type === 'checkout_approaching' ? (
                <span className="text-amber-600 font-bold">Shift Ending Soon</span>
              ) : (
                <span className="text-emerald-700 font-bold truncate">
                  In: {stats.todayAttendance.record?.inTime || 'Present'}
                </span>
              )
            ) : attendanceAlert?.type === 'checkin_overdue' ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <span className="animate-pulse">●</span> Check-In Overdue
              </span>
            ) : attendanceAlert?.type === 'checkin_grace' ? (
              <span className="text-amber-600 font-bold">Grace Window</span>
            ) : attendanceAlert?.type === 'checkin_approaching' ? (
              <span className="text-amber-600 font-bold">Check-In Soon</span>
            ) : (
              <span className="text-amber-600 font-bold">Pending Check-In</span>
            )}
          </div>
          <div className="mt-1 text-[11px] sm:text-xs font-bold flex items-center gap-1 group-hover:underline">
            <span
              className={
                isSuperAdmin
                  ? 'text-emerald-600'
                  : attendanceAlert?.isUrgent
                  ? attendanceAlert.badgeStyle === 'rose'
                    ? 'text-rose-600'
                    : 'text-amber-600'
                  : 'text-emerald-600'
              }
            >
              {isSuperAdmin
                ? 'Manage Staff'
                : attendanceAlert?.isUrgent
                ? 'Scan QR Code'
                : 'Attendance Log'}
            </span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Daily Report Status */}
        <div
          onClick={() => onSelectPage('Daily Report')}
          className="animate-card-fade-in stagger-5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-[#181E54]/30 hover:shadow-xs transition-all cursor-pointer group active:scale-[0.98] touch-manipulation min-h-[110px] sm:min-h-[120px] flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs sm:text-[13px] font-bold text-slate-600 truncate mr-1">Daily Report</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <ClipboardList className="w-4 h-4 text-[#D81124]" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-bold leading-tight truncate my-1">
            {stats.hasSubmittedDailyReport ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Submitted
              </span>
            ) : (
              <span className="text-amber-600 font-bold">Pending Today</span>
            )}
          </div>
          <div className="mt-1 text-[11px] sm:text-xs text-rose-600 font-bold flex items-center gap-1 group-hover:underline">
            <span>Open Report</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Quick Navigation & Operational Workflow Hub (Balanced 50/50 2-Column Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Core Pipeline Navigation Card (Left) */}
        <div className="animate-card-fade-in stagger-6 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 md:p-6 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm">
                <GitFork className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Pipeline Flow</h2>
                <p className="text-[11px] text-slate-400">Core client progression journey</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#181E54] bg-[#181E54]/8 px-2.5 py-1 rounded-full border border-[#181E54]/10">
              Matrimonial Funnel
            </span>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {/* Step 1: Leads */}
            <button
              type="button"
              onClick={() => onSelectPage('Lead')}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50/80 hover:bg-purple-50/40 border border-slate-200/70 hover:border-purple-200 transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-100/90 text-purple-800 flex items-center justify-center font-extrabold text-sm shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  1
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-purple-900 truncate">
                      Leads Registry
                    </p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-mono">
                      {loading ? '...' : `${stats.leadsCount} Leads`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Initial client inquiry registration &amp; qualification stage
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-purple-700 group-hover:border-purple-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2 shadow-2xs">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            {/* Step 2: Clients */}
            <button
              type="button"
              onClick={() => onSelectPage('Client')}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50/80 hover:bg-blue-50/40 border border-slate-200/70 hover:border-blue-200 transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100/90 text-blue-800 flex items-center justify-center font-extrabold text-sm shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  2
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-900 truncate">
                      Client Active Pipeline
                    </p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-mono">
                      {loading ? '...' : `${stats.trafficCount} Active`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Direct counseling, biodata collection &amp; staff assignment
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-blue-700 group-hover:border-blue-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2 shadow-2xs">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            {/* Step 3: Paid Clients */}
            <button
              type="button"
              onClick={() => onSelectPage('Paid Client')}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50/80 hover:bg-emerald-50/40 border border-slate-200/70 hover:border-emerald-200 transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center font-extrabold text-sm shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  3
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-900 truncate">
                      Paid Client Candidates
                    </p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-mono">
                      {loading ? '...' : `${stats.paidCount} Paid`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Verified subscribers receiving premium matchmaking services
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-emerald-700 group-hover:border-emerald-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2 shadow-2xs">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>

        {/* Office Operations Card (Right) */}
        <div className="animate-card-fade-in stagger-7 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 md:p-6 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                <ClipboardList className="w-4 h-4 text-[#D81124]" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Office Operations</h2>
                <p className="text-[11px] text-slate-400">Daily management &amp; office workflow</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Daily Routines
            </span>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {/* Op 1: Staff Attendance */}
            <button
              type="button"
              onClick={() => onSelectPage('Attendance')}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50/80 hover:bg-amber-50/40 border border-slate-200/70 hover:border-amber-200 transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100/90 text-amber-800 flex items-center justify-center font-extrabold shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-900 truncate">
                      Staff Attendance System
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1.5 ${
                        attendanceAlert?.isUrgent
                          ? attendanceAlert.badgeStyle === 'rose'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                          : stats.todayAttendance?.hasCheckedIn
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {attendanceAlert?.isUrgent && (
                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                          <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              attendanceAlert.badgeStyle === 'rose' ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                          />
                          <span
                            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                              attendanceAlert.badgeStyle === 'rose' ? 'bg-rose-600' : 'bg-amber-600'
                            }`}
                          />
                        </span>
                      )}
                      <span>
                        {attendanceAlert?.badgeLabel ||
                          (stats.todayAttendance?.hasCheckedIn ? 'Checked In Today' : 'Pending Check-In')}
                      </span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    QR code scanner, daily punch-in, time records &amp; logs
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-amber-700 group-hover:border-amber-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2 shadow-2xs">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            {/* Op 2: Daily Report */}
            <button
              type="button"
              onClick={() => onSelectPage('Daily Report')}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50/80 hover:bg-rose-50/40 border border-slate-200/70 hover:border-rose-200 transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-100/90 text-rose-800 flex items-center justify-center font-extrabold shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <ClipboardList className="w-4.5 h-4.5 text-[#D81124]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-rose-900 truncate">
                      Daily Performance Report
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      stats.hasSubmittedDailyReport
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {stats.hasSubmittedDailyReport ? 'Report Submitted' : 'Pending Today'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Calling records, messaging summaries &amp; team performance
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-rose-700 group-hover:border-rose-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2 shadow-2xs">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            {/* Op 3: Payment & Receipts */}
            <button
              type="button"
              onClick={() => onSelectPage('Payment')}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50/80 hover:bg-teal-50/40 border border-slate-200/70 hover:border-teal-200 transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-100/90 text-teal-800 flex items-center justify-center font-extrabold shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <CreditCard className="w-4.5 h-4.5 text-teal-700" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-900 truncate">
                      Payment &amp; Receipts
                    </p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                      Accounts Clearance
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Official billing clearance, invoice creation &amp; payment receipts
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-teal-700 group-hover:border-teal-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2 shadow-2xs">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
