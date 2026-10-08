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
    <div className="space-y-3 sm:space-y-4 max-w-6xl mx-auto pb-6 sm:pb-8">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-[#181E54] to-[#252E7D] rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-[10px] sm:text-[11px] font-semibold mb-1.5 sm:mb-2">
              <Shield className="w-3 h-3 text-[#D81124]" />
              <span>Shadikabbo CRM · {user?.role || 'Staff'}</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-[11px] sm:text-xs text-white/80 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
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
              className="flex items-center justify-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-white text-[#181E54] hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer min-h-[42px] touch-manipulation active:scale-[0.98] w-full sm:w-auto shrink-0"
            >
              <Camera className="w-4 h-4 text-[#D81124]" />
              <span>Daily Attendance Scanner</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {/* Leads */}
        <div
          onClick={() => onSelectPage('Lead')}
          className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs hover:border-[#181E54]/30 transition-all cursor-pointer group active:scale-[0.98] touch-manipulation min-h-[105px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate mr-1">
              {isSuperAdmin ? 'Total Leads' : 'My Leads'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Users2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#181E54] font-mono leading-none">
            {loading ? '-' : stats.leadsCount}
          </div>
          <div className="mt-2 text-[10px] sm:text-[11px] text-purple-600 font-semibold flex items-center gap-1 group-hover:underline">
            <span>View Leads</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Traffic */}
        <div
          onClick={() => onSelectPage('Traffic')}
          className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs hover:border-[#181E54]/30 transition-all cursor-pointer group active:scale-[0.98] touch-manipulation min-h-[105px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate mr-1">
              {isSuperAdmin ? 'Active Traffic' : 'My Traffic'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <GitFork className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#181E54] font-mono leading-none">
            {loading ? '-' : stats.trafficCount}
          </div>
          <div className="mt-2 text-[10px] sm:text-[11px] text-blue-600 font-semibold flex items-center gap-1 group-hover:underline">
            <span>View Traffic</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Paid Traffic / Matchmaking */}
        <div
          onClick={() => onSelectPage(isMK ? 'Matchmaking' : 'Paid Traffic')}
          className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs hover:border-[#181E54]/30 transition-all cursor-pointer group active:scale-[0.98] touch-manipulation min-h-[105px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate mr-1">
              {isMK ? 'Matchmaking Pool' : isSuperAdmin ? 'Paid Traffic' : 'My Paid Clients'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              {isMK ? <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D81124]" /> : <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#181E54] font-mono leading-none">
            {loading ? '-' : stats.paidCount}
          </div>
          <div className="mt-2 text-[10px] sm:text-[11px] text-emerald-600 font-semibold flex items-center gap-1 group-hover:underline truncate">
            <span>{isMK ? 'Open Pool' : 'View Clients'}</span>
            <ArrowRight className="w-3 h-3 shrink-0" />
          </div>
        </div>

        {/* Attendance Status */}
        <div
          onClick={() => onSelectPage('Attendance')}
          className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs hover:border-[#181E54]/30 transition-all cursor-pointer group active:scale-[0.98] touch-manipulation min-h-[105px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate mr-1">Today Attendance</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-bold text-[#181E54] leading-tight truncate">
            {stats.todayAttendance?.hasCheckedIn ? (
              <span className="text-emerald-700 font-bold truncate">In: {stats.todayAttendance.record?.inTime || 'Present'}</span>
            ) : (
              <span className="text-amber-600 font-bold">Not Checked In</span>
            )}
          </div>
          <div className="mt-2 text-[10px] sm:text-[11px] text-amber-600 font-semibold flex items-center gap-1 group-hover:underline">
            <span>Attendance Log</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Daily Report Status */}
        <div
          onClick={() => onSelectPage('Daily Report')}
          className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs hover:border-[#181E54]/30 transition-all cursor-pointer group active:scale-[0.98] touch-manipulation min-h-[105px] flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate mr-1">Daily Report</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D81124]" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-bold leading-tight truncate">
            {stats.hasSubmittedDailyReport ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Submitted
              </span>
            ) : (
              <span className="text-amber-600 font-bold">Pending Today</span>
            )}
          </div>
          <div className="mt-2 text-[10px] sm:text-[11px] text-rose-600 font-semibold flex items-center gap-1 group-hover:underline">
            <span>Open Report</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
};
