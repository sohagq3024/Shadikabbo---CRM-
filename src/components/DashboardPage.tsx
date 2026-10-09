import React, { useState, useEffect } from 'react';
import {
  Users2,
  GitFork,
  CheckCircle,
  CreditCard,
  HeartHandshake,
  Clock,
  Camera,
  ArrowRight,
  Shield,
  UserCheck,
  ClipboardList,
} from 'lucide-react';
import { SidebarPage } from './CrmLayout';

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
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto space-y-5 sm:space-y-6 pb-8">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-[#181E54] via-[#1F2768] to-[#252E7D] rounded-3xl p-6 sm:p-7 md:p-8 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold mb-2 sm:mb-2.5">
              <Shield className="w-3.5 h-3.5 text-[#D81124]" />
              <span>Shadikabbo CRM · {user?.role || 'Staff'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-xs sm:text-sm text-white/80 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Official Branch: <strong className="text-white font-semibold">{user?.branch || 'Uttara'}</strong></span>
              <span>·</span>
              <span>Official ID: <strong className="text-white font-mono">{user?.phone}</strong></span>
            </p>
          </div>

          {/* Quick Scanner Action */}
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="flex items-center justify-center gap-2.5 px-5 py-3 sm:px-6 sm:py-3.5 bg-white text-[#181E54] hover:bg-slate-100 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer min-h-[46px] touch-manipulation active:scale-[0.98] w-full sm:w-auto shrink-0"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-[#D81124]" />
              <span>Daily Attendance Scanner</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
        {/* Leads */}
        <div
          onClick={() => onSelectPage('Lead')}
          className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 md:p-6 shadow-xs hover:border-[#181E54]/30 hover:shadow-md transition-all cursor-pointer group active:scale-[0.98] touch-manipulation min-h-[140px] sm:min-h-[155px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-bold text-slate-600 truncate mr-1">
              {isSuperAdmin ? 'Total Leads' : 'My Leads'}
            </span>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Users2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#181E54] font-mono leading-none my-1.5">
            {loading ? '-' : stats.leadsCount}
          </div>
          <div className="mt-2 text-xs sm:text-sm text-purple-600 font-bold flex items-center gap-1.5 group-hover:underline">
            <span>View Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Traffic */}
        <div
          onClick={() => onSelectPage('Traffic')}
          className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 md:p-6 shadow-xs hover:border-[#181E54]/30 hover:shadow-md transition-all cursor-pointer group active:scale-[0.98] touch-manipulation min-h-[140px] sm:min-h-[155px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-bold text-slate-600 truncate mr-1">
              {isSuperAdmin ? 'Active Traffic' : 'My Traffic'}
            </span>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <GitFork className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#181E54] font-mono leading-none my-1.5">
            {loading ? '-' : stats.trafficCount}
          </div>
          <div className="mt-2 text-xs sm:text-sm text-blue-600 font-bold flex items-center gap-1.5 group-hover:underline">
            <span>View Traffic</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Paid Traffic / Matchmaking */}
        <div
          onClick={() => onSelectPage(isMK ? 'Matchmaking' : 'Paid Traffic')}
          className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 md:p-6 shadow-xs hover:border-[#181E54]/30 hover:shadow-md transition-all cursor-pointer group active:scale-[0.98] touch-manipulation min-h-[140px] sm:min-h-[155px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-bold text-slate-600 truncate mr-1">
              {isMK ? 'Matchmaking Pool' : isSuperAdmin ? 'Paid Traffic' : 'My Paid Clients'}
            </span>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              {isMK ? <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5 text-[#D81124]" /> : <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#181E54] font-mono leading-none my-1.5">
            {loading ? '-' : stats.paidCount}
          </div>
          <div className="mt-2 text-xs sm:text-sm text-emerald-600 font-bold flex items-center gap-1.5 group-hover:underline truncate">
            <span>{isMK ? 'Open Pool' : 'View Clients'}</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </div>
        </div>

        {/* Attendance Status */}
        <div
          onClick={() => onSelectPage('Attendance')}
          className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 md:p-6 shadow-xs hover:border-[#181E54]/30 hover:shadow-md transition-all cursor-pointer group active:scale-[0.98] touch-manipulation min-h-[140px] sm:min-h-[155px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-bold text-slate-600 truncate mr-1">Today Attendance</span>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-sm sm:text-base font-bold text-[#181E54] leading-tight truncate my-1.5">
            {stats.todayAttendance?.hasCheckedIn ? (
              <span className="text-emerald-700 font-bold truncate">In: {stats.todayAttendance.record?.inTime || 'Present'}</span>
            ) : (
              <span className="text-amber-600 font-bold">Not Checked In</span>
            )}
          </div>
          <div className="mt-2 text-xs sm:text-sm text-amber-600 font-bold flex items-center gap-1.5 group-hover:underline">
            <span>Attendance Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Daily Report Status */}
        <div
          onClick={() => onSelectPage('Daily Report')}
          className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 md:p-6 shadow-xs hover:border-[#181E54]/30 hover:shadow-md transition-all cursor-pointer group active:scale-[0.98] touch-manipulation min-h-[140px] sm:min-h-[155px] flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-bold text-slate-600 truncate mr-1">Daily Report</span>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-[#D81124]" />
            </div>
          </div>
          <div className="text-sm sm:text-base font-bold leading-tight truncate my-1.5">
            {stats.hasSubmittedDailyReport ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                Submitted
              </span>
            ) : (
              <span className="text-amber-600 font-bold">Pending Today</span>
            )}
          </div>
          <div className="mt-2 text-xs sm:text-sm text-rose-600 font-bold flex items-center gap-1.5 group-hover:underline">
            <span>Open Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
