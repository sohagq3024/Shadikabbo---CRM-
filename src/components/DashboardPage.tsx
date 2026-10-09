import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Copy,
  Check,
  Crown,
  Sparkles,
  Award,
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

  // Specific Account Owner profiles for luxury dashboard card
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(user?.id || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [leadsRes, trafficRes, paidRes, attRes, dailyRes, accsRes] = await Promise.all([
          fetch('/api/leads', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/traffic', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/paid-traffic', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/attendance/my-status', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/daily-reports', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/accounts', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const leads = leadsRes.ok ? await leadsRes.json() : [];
        const traffic = trafficRes.ok ? await trafficRes.json() : [];
        const paid = paidRes.ok ? await paidRes.json() : [];
        const att = attRes.ok ? await attRes.json() : null;
        const dailyData = dailyRes.ok ? await dailyRes.json() : null;
        const accsData = accsRes.ok ? await accsRes.json() : [];

        setStats({
          leadsCount: Array.isArray(leads) ? leads.length : 0,
          trafficCount: Array.isArray(traffic) ? traffic.length : 0,
          paidCount: Array.isArray(paid) ? paid.length : 0,
          paymentsCount: Array.isArray(paid) ? paid.length : 0,
          todayAttendance: att,
          hasSubmittedDailyReport: !!dailyData?.hasSubmittedToday,
        });

        if (Array.isArray(accsData)) {
          setAccounts(accsData);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  // Specific account owner currently active/selected in the dashboard
  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedAccountId) || accounts.find((a) => a.id === user?.id) || user;
  }, [accounts, selectedAccountId, user]);

  // Quick photo upload directly from dashboard card
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        setIsUploadingPhoto(true);
        const targetId = selectedAccount?.id || user?.id;
        const res = await fetch(`/api/accounts/${targetId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            profilePicture: base64,
          }),
        });

        if (res.ok) {
          setAccounts((prev) =>
            prev.map((a) => (a.id === targetId ? { ...a, profilePicture: base64 } : a))
          );
          if (targetId === user?.id) {
            const cached = localStorage.getItem('shadikabbo_user');
            if (cached) {
              const parsed = JSON.parse(cached);
              parsed.profilePicture = base64;
              localStorage.setItem('shadikabbo_user', JSON.stringify(parsed));
            }
          }
        }
      } catch (err) {
        console.error('Photo upload failed', err);
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopyPhone = () => {
    if (selectedAccount?.phone) {
      navigator.clipboard.writeText(selectedAccount.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

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

          {/* Quick Scanner Action */}
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-white text-[#181E54] hover:bg-slate-100 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-xs cursor-pointer touch-manipulation active:scale-[0.98] w-full sm:w-auto shrink-0"
            >
              <Camera className="w-4 h-4 text-[#D81124]" />
              <span>Daily Attendance Scanner</span>
            </button>
          )}
        </div>
      </div>

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

        {/* Traffic */}
        <div
          onClick={() => onSelectPage('Traffic')}
          className="animate-card-fade-in stagger-2 bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-[#181E54]/30 hover:shadow-xs transition-all cursor-pointer group active:scale-[0.98] touch-manipulation min-h-[110px] sm:min-h-[120px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs sm:text-[13px] font-bold text-slate-600 truncate mr-1">
              {isSuperAdmin ? 'Active Traffic' : 'My Traffic'}
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <GitFork className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#181E54] font-mono leading-none my-1">
            {loading ? '-' : stats.trafficCount}
          </div>
          <div className="mt-1 text-[11px] sm:text-xs text-blue-600 font-bold flex items-center gap-1 group-hover:underline">
            <span>View Traffic</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Paid Traffic / Matchmaking */}
        <div
          onClick={() => onSelectPage(isMK ? 'Matchmaking' : 'Paid Traffic')}
          className="animate-card-fade-in stagger-3 bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-[#181E54]/30 hover:shadow-xs transition-all cursor-pointer group active:scale-[0.98] touch-manipulation min-h-[110px] sm:min-h-[120px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs sm:text-[13px] font-bold text-slate-600 truncate mr-1">
              {isMK ? 'Matchmaking Pool' : isSuperAdmin ? 'Paid Traffic' : 'My Paid Clients'}
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
          className="animate-card-fade-in stagger-4 bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-[#181E54]/30 hover:shadow-xs transition-all cursor-pointer group active:scale-[0.98] touch-manipulation min-h-[110px] sm:min-h-[120px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs sm:text-[13px] font-bold text-slate-600 truncate mr-1">Today Attendance</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-bold text-[#181E54] leading-tight truncate my-1">
            {stats.todayAttendance?.hasCheckedIn ? (
              <span className="text-emerald-700 font-bold truncate">In: {stats.todayAttendance.record?.inTime || 'Present'}</span>
            ) : (
              <span className="text-amber-600 font-bold">Not Checked In</span>
            )}
          </div>
          <div className="mt-1 text-[11px] sm:text-xs text-amber-600 font-bold flex items-center gap-1 group-hover:underline">
            <span>Attendance Log</span>
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

      {/* Quick Navigation and Workflow Hub for Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Core Pipeline Navigation Card */}
        <div className="animate-card-fade-in stagger-6 bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pipeline Flow</h2>
            <span className="text-[10px] font-semibold text-[#181E54] bg-[#181E54]/10 px-2 py-0.5 rounded-full">Matrimonial</span>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onSelectPage('Lead')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/90 transition-colors cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-[#181E54]">Leads Registry</p>
                  <p className="text-[10px] text-slate-500">Initial client registration & qualification</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#181E54] group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => onSelectPage('Traffic')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/90 transition-colors cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-[#181E54]">Traffic Active Pipeline</p>
                  <p className="text-[10px] text-slate-500">Counseling, follow-ups & assignment</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#181E54] group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => onSelectPage('Paid Traffic')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/90 transition-colors cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-[#181E54]">Paid Traffic Candidates</p>
                  <p className="text-[10px] text-slate-500">Subscribed candidates receiving matchmaking</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#181E54] group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

        {/* Office Routine & Reports Card */}
        <div className="animate-card-fade-in stagger-7 bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Office Operations</h2>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Daily</span>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onSelectPage('Attendance')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/90 transition-colors cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-[#181E54]">Staff Attendance</p>
                  <p className="text-[10px] text-slate-500">QR scanning, daily punch & monthly logs</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#181E54] group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => onSelectPage('Daily Report')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/90 transition-colors cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">
                  <ClipboardList className="w-3.5 h-3.5 text-[#D81124]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-[#181E54]">Daily Performance Report</p>
                  <p className="text-[10px] text-slate-500">Daily calling, messaging & collection stats</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#181E54] group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => onSelectPage('Payment')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/90 transition-colors cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-[#181E54]">Payment & Receipts</p>
                  <p className="text-[10px] text-slate-500">Official invoice generation & receipts</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#181E54] group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

        {/* System & Account Details Card (Executive Luxury Account Owner Card) */}
        <div className="animate-card-fade-in stagger-8 bg-gradient-to-br from-white via-[#FCFDFE] to-amber-50/25 rounded-2xl border-2 border-amber-300/70 p-4 sm:p-5 shadow-lg shadow-amber-950/5 ring-1 ring-amber-400/30 col-span-1 md:col-span-2 lg:col-span-1 relative overflow-hidden group">
          {/* Subtle luxury glow accents */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-br from-amber-400/20 via-rose-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-gradient-to-tr from-[#181E54]/10 via-amber-400/10 to-transparent rounded-full blur-lg pointer-events-none" />

          {/* Luxury Executive Top Bar */}
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-amber-200/50 relative z-10">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-xs">
                <Crown className="w-3 h-3 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
                  Executive Account Owner
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                </span>
              </div>
            </div>

            {/* Account Switcher for Super Admin / Luxury Pill */}
            {isSuperAdmin && accounts.length > 1 ? (
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="text-[10.5px] font-extrabold text-[#181E54] bg-white border border-amber-300 rounded-lg px-2 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                title="Switch account owner view"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.role})
                  </option>
                ))}
              </select>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider text-amber-900 bg-amber-100/90 border border-amber-300/80 px-2 py-0.5 rounded-full shadow-2xs">
                <Award className="w-3 h-3 text-amber-700" />
                {selectedAccount?.role || user?.role || 'Staff'}
              </span>
            )}
          </div>

          {/* Interactive Account Owner Selector Chips for Super Admin */}
          {isSuperAdmin && accounts.length > 1 && (
            <div className="mb-3.5 relative z-10 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-bold text-slate-500 shrink-0">Owners:</span>
              {accounts.map((acc) => {
                const isSelected = (selectedAccount?.id || user?.id) === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#181E54] text-white shadow-xs ring-2 ring-amber-400'
                        : 'bg-white/80 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                    title={`View ${acc.name} (${acc.role})`}
                  >
                    <div className="w-4 h-4 rounded-full overflow-hidden bg-slate-200 shrink-0 ring-1 ring-white/50">
                      {acc.profilePicture ? (
                        <img src={acc.profilePicture} alt={acc.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[8px] flex items-center justify-center h-full font-bold">
                          {acc.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="truncate max-w-[75px]">{acc.name.replace(/^(MK|CRO)\s*-\s*/, '')}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Centerpiece: Ultra-Luxury Executive Profile Picture */}
          <div className="flex items-center gap-3.5 mb-3.5 relative z-10">
            <div className="relative group/pic shrink-0">
              {/* Gold Ring Framing for High-End Expensive Look */}
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white ring-4 ring-amber-400/80 ring-offset-2 ring-offset-white shadow-xl bg-gradient-to-tr from-[#181E54] via-[#242D7C] to-[#D81124] flex items-center justify-center text-white font-extrabold text-2xl relative transition-transform group-hover/pic:scale-[1.03]">
                {selectedAccount?.profilePicture ? (
                  <img
                    src={selectedAccount.profilePicture}
                    alt={selectedAccount.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-mono">
                    {(selectedAccount?.name || 'User')
                      .split(' ')
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </span>
                )}

                {/* Quick Photo Upload Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/55 text-white flex flex-col items-center justify-center opacity-0 group-hover/pic:opacity-100 transition-opacity cursor-pointer text-[9px] font-extrabold backdrop-blur-2xs"
                  title="Upload / Change Profile Picture"
                >
                  <Camera className="w-4 h-4 mb-0.5 text-amber-300" />
                  <span>{isUploadingPhoto ? 'Saving...' : 'Update Photo'}</span>
                </button>
              </div>

              {/* Online / Active Verified Badge */}
              <span
                className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 border-2 border-white shadow-md flex items-center justify-center"
                title="Account Status: Active & Online"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </span>
            </div>

            {/* Hidden File Input for quick upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {/* Owner Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-[#181E54] tracking-tight truncate">
                  {selectedAccount?.name || 'Account Officer'}
                </h3>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                  VERIFIED
                </span>
              </div>
              <p className="text-[11px] font-extrabold text-[#D81124] mt-0.5 tracking-wide">
                ★ {selectedAccount?.role === 'Super Admin' ? 'CHIEF EXECUTIVE OFFICER' : selectedAccount?.role || 'Executive Officer'}
              </p>
              <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                Branch: <strong className="text-slate-800 font-bold">{selectedAccount?.branch || 'Uttara HQ'} · Corporate Suite</strong>
              </p>
            </div>
          </div>

          {/* Metadata Specs Rows */}
          <div className="space-y-1.5 text-xs relative z-10">
            <div className="p-2 rounded-xl bg-white/95 border border-amber-200/60 shadow-2xs flex items-center justify-between">
              <span className="text-slate-500 text-[11px] font-medium">Official Phone:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-black text-[#181E54] text-[11.5px]">
                  {selectedAccount?.phone}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="p-1 text-slate-400 hover:text-[#181E54] hover:bg-slate-100 rounded-md cursor-pointer transition-colors"
                  title="Copy official phone"
                >
                  {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white/95 border border-amber-200/60 shadow-2xs flex items-center justify-between">
              <span className="text-slate-500 text-[11px] font-medium">Account Status:</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Verified Executive
              </span>
            </div>

            {selectedAccount?.joiningDate && (
              <div className="p-2 rounded-xl bg-white/95 border border-amber-200/60 shadow-2xs flex items-center justify-between">
                <span className="text-slate-500 text-[11px] font-medium">Official Joining:</span>
                <span className="font-bold text-slate-700 text-[11px]">
                  {selectedAccount.joiningDate}
                </span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => onSelectPage('Account')}
                className="w-full py-2 bg-gradient-to-r from-[#181E54] via-[#1D2569] to-[#252E7D] text-white hover:brightness-110 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer text-center flex items-center justify-center gap-1.5 border border-amber-400/40"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Manage Profile &amp; Photo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
