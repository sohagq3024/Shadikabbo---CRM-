import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Calendar,
  Users,
  CheckCircle2,
  RefreshCw,
  Eye,
  HeartHandshake,
  ShieldAlert,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { DailyReportModal } from './DailyReportModal';
import { DailyReportDetailsModal } from './DailyReportDetailsModal';
import { DailyReportRecord } from '../server/dailyReportRoutes';

interface DailyReportPageProps {
  token: string;
  user: any;
}

export const DailyReportPage: React.FC<DailyReportPageProps> = ({ token, user }) => {
  const [reports, setReports] = useState<DailyReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [todayStr, setTodayStr] = useState('');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedReportForDetails, setSelectedReportForDetails] = useState<DailyReportRecord | null>(null);

  // Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'CRO' | 'MK'>('all');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [filterStaffId, setFilterStaffId] = useState('all');
  const [quickDatePreset, setQuickDatePreset] = useState<'all' | 'today' | 'last7' | 'thisMonth' | 'lastMonth' | 'custom'>('all');

  const isSuperAdmin = user?.role === 'Super Admin';
  const isMK = user?.role === 'MK';
  const isCRO = user?.role === 'CRO';

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);
      if (filterRole !== 'all') params.append('role', filterRole);
      if (isSuperAdmin && filterStaffId !== 'all') params.append('userId', filterStaffId);

      const res = await fetch(`/api/daily-reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load daily reports');
      const json = await res.json();
      setReports(json.reports || []);
      setHasSubmittedToday(!!json.hasSubmittedToday);
      setTodayStr(json.todayStr || '');

      // Load staff list for admin dropdown
      if (isSuperAdmin && staffList.length === 0) {
        const staffRes = await fetch('/api/attendance/staff-list', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (staffRes.ok) {
          const sJson = await staffRes.json();
          setStaffList(sJson.staff || []);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [token, filterStartDate, filterEndDate, filterRole, filterStaffId]);

  // Handle Quick Date Presets (e.g. today, this month, last month, last 7 days, all time)
  const handleQuickPreset = (preset: 'all' | 'today' | 'last7' | 'thisMonth' | 'lastMonth') => {
    setQuickDatePreset(preset);
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth(); // 0-based

    if (preset === 'all') {
      setFilterStartDate('');
      setFilterEndDate('');
    } else if (preset === 'today') {
      const t = now.toISOString().substring(0, 10);
      setFilterStartDate(t);
      setFilterEndDate(t);
    } else if (preset === 'last7') {
      const past = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      setFilterStartDate(past.toISOString().substring(0, 10));
      setFilterEndDate(now.toISOString().substring(0, 10));
    } else if (preset === 'thisMonth') {
      const start = new Date(curYear, curMonth, 1);
      const end = new Date(curYear, curMonth + 1, 0);
      setFilterStartDate(start.toISOString().substring(0, 10));
      setFilterEndDate(end.toISOString().substring(0, 10));
    } else if (preset === 'lastMonth') {
      const start = new Date(curYear, curMonth - 1, 1);
      const end = new Date(curYear, curMonth, 0);
      setFilterStartDate(start.toISOString().substring(0, 10));
      setFilterEndDate(end.toISOString().substring(0, 10));
    }
  };

  // Group reports by date for the aggregated Date-Wise sheet view
  const groupedByDate = useMemo(() => {
    const map = new Map<string, DailyReportRecord[]>();
    reports.forEach((r) => {
      const d = r.date || 'Unknown';
      if (!map.has(d)) {
        map.set(d, []);
      }
      map.get(d)!.push(r);
    });

    // Convert map to sorted array of date groups (newest date first)
    const groups: {
      date: string;
      reports: DailyReportRecord[];
      staffCount: number;
      croCount: number;
      mkCount: number;
      attendancePresent: number;
      attendanceLate: number;
      totalLeads: number;
      topLeadSources: string;
      totalTraffics: number;
      transferredTraffics: number;
      totalPaid: number;
      totalSales: number;
      totalCalls: number;
      totalMessages: number;
      totalServices: number;
      uniqueClients: number;
    }[] = [];

    const sortedDates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

    sortedDates.forEach((d) => {
      const dayReports = map.get(d)!;
      let totalLeads = 0;
      let totalTraffics = 0;
      let transferredTraffics = 0;
      let totalPaid = 0;
      let totalSales = 0;
      let totalCalls = 0;
      let totalMessages = 0;
      let totalServices = 0;
      let uniqueClients = 0;
      let attendancePresent = 0;
      let attendanceLate = 0;
      let croCount = 0;
      let mkCount = 0;
      const allSources: Record<string, number> = {};

      dayReports.forEach((r) => {
        if (r.userRole === 'CRO') croCount++;
        if (r.userRole === 'MK') mkCount++;

        const att = r.attendance?.status || '';
        if (att.includes('Late')) {
          attendanceLate++;
        } else if (att.includes('Present')) {
          attendancePresent++;
        }

        totalLeads += r.metrics?.leadsAddedCount || 0;
        totalTraffics += r.metrics?.trafficsAddedCount || 0;
        transferredTraffics += r.metrics?.leadsTransferredToTrafficCount || 0;
        totalPaid += r.metrics?.paidTrafficsCount || 0;
        totalSales += r.metrics?.sellingAmount || 0;
        totalCalls += r.manualInputs?.receivedCalls || 0;
        totalMessages += r.manualInputs?.messagesAssigned || 0;

        if (r.metrics?.leadSources) {
          Object.entries(r.metrics.leadSources).forEach(([src, count]) => {
            allSources[src] = (allSources[src] || 0) + Number(count || 0);
          });
        }

        if (r.metrics?.matchmaking) {
          totalServices += r.metrics.matchmaking.totalServicesCount || 0;
          uniqueClients += r.metrics.matchmaking.uniqueClientsCount || 0;
        }
      });

      const topSources = Object.entries(allSources)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([s, c]) => `${s}: ${c}`)
        .join(', ');

      groups.push({
        date: d,
        reports: dayReports,
        staffCount: dayReports.length,
        croCount,
        mkCount,
        attendancePresent,
        attendanceLate,
        totalLeads,
        topLeadSources: topSources,
        totalTraffics,
        transferredTraffics,
        totalPaid,
        totalSales,
        totalCalls,
        totalMessages,
        totalServices,
        uniqueClients,
      });
    });

    return groups;
  }, [reports]);

  // Fast, lightweight summary statistics derived from grouped data without heavy loops
  const summaryStats = useMemo(() => {
    let totalSales = 0;
    let totalSubmissions = 0;
    for (let i = 0; i < groupedByDate.length; i++) {
      totalSales += groupedByDate[i].totalSales;
      totalSubmissions += groupedByDate[i].staffCount;
    }
    return {
      daysCount: groupedByDate.length,
      totalSales,
      totalSubmissions,
    };
  }, [groupedByDate]);

  return (
    <div className="space-y-5 pb-16 max-w-full overflow-y-auto">
      {/* =========================================================
          TOP BANNER & RIGHT-TOP CORNER "DAILY REPORT" ACTION BUTTON
          "Page a akta table ar right top corner a thakbe akta button 'Daily Report'"
         ========================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#181E54] text-white flex items-center justify-center shadow-xs">
              <FileText className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#181E54] tracking-tight">
                  Daily Performance Report
                </h1>
                {isSuperAdmin && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Super Admin View
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm text-slate-500 font-medium">
                Total daily aggregated sales, leads &amp; matchmaking tracking with instant agent breakdown
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT TOP CORNER ACTION BUTTONS - PROMINENT & COMFORTABLE SIZING */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Refresh Table Button */}
          <button
            type="button"
            onClick={loadReports}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Refresh reports"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* THE MANDATORY RIGHT-TOP CORNER "Daily Report" BUTTON */}
          <button
            type="button"
            onClick={() => setIsFormModalOpen(true)}
            className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-[#181E54] via-[#242D73] to-[#181E54] hover:shadow-lg text-white rounded-2xl text-sm sm:text-base font-bold transition-all shadow-md cursor-pointer active:scale-98"
            title="Open Daily Report Form"
          >
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Daily Report</span>
            {hasSubmittedToday && (
              <span
                className="ml-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-200"
                title="Today's report already submitted"
              />
            )}
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS (SUPER ADMIN UNRESTRICTED DATE RANGES) - CLEAN, SPACIOUS, FAST */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Row 1: Quick Date Presets & Live Summary Strip */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              Presets:
            </span>
            <button
              type="button"
              onClick={() => handleQuickPreset('all')}
              className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-98 ${
                quickDatePreset === 'all'
                  ? 'bg-[#181E54] text-white shadow-sm ring-2 ring-[#181E54]/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('today')}
              className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-98 ${
                quickDatePreset === 'today'
                  ? 'bg-[#181E54] text-white shadow-sm ring-2 ring-[#181E54]/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('last7')}
              className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-98 ${
                quickDatePreset === 'last7'
                  ? 'bg-[#181E54] text-white shadow-sm ring-2 ring-[#181E54]/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('thisMonth')}
              className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-98 ${
                quickDatePreset === 'thisMonth'
                  ? 'bg-[#181E54] text-white shadow-sm ring-2 ring-[#181E54]/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('lastMonth')}
              className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-98 ${
                quickDatePreset === 'lastMonth'
                  ? 'bg-[#181E54] text-white shadow-sm ring-2 ring-[#181E54]/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Last Month
            </button>
          </div>

          {/* Quick Lightweight Live Summary Strip */}
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200/70">
            <span className="text-slate-800 font-bold">{summaryStats.daysCount} Days</span>
            <span className="text-slate-300">•</span>
            <span className="text-blue-700 font-bold">{summaryStats.totalSubmissions} Reports</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-bold font-mono">
              ৳ {summaryStats.totalSales.toLocaleString()}
            </span>
            {groupedByDate.length >= 2 && (() => {
              const diff = groupedByDate[0].totalSales - groupedByDate[1].totalSales;
              if (diff > 0) {
                return (
                  <>
                    <span className="text-slate-300">•</span>
                    <span
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-lg border border-emerald-200"
                      title={`Latest day (${groupedByDate[0].date}) vs previous day: +৳${diff.toLocaleString()}`}
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                      <span>+৳{diff.toLocaleString()}</span>
                    </span>
                  </>
                );
              }
              if (diff < 0) {
                return (
                  <>
                    <span className="text-slate-300">•</span>
                    <span
                      className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-lg border border-rose-200"
                      title={`Latest day (${groupedByDate[0].date}) vs previous day: -৳${Math.abs(diff).toLocaleString()}`}
                    >
                      <TrendingDown className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                      <span>-৳{Math.abs(diff).toLocaleString()}</span>
                    </span>
                  </>
                );
              }
              return (
                <>
                  <span className="text-slate-300">•</span>
                  <span
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded-lg"
                    title={`Same as previous day (${groupedByDate[1].date})`}
                  >
                    <Minus className="w-3.5 h-3.5 text-slate-400" />
                    <span>0% vs prev</span>
                  </span>
                </>
              );
            })()}
          </div>
        </div>

        {/* Row 2: Custom Date Range Pickers & Role / Staff Filters with Large Comfortable Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-3.5">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Start Date */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
              <span className="text-xs text-slate-400 font-bold uppercase">From:</span>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => {
                  setFilterStartDate(e.target.value);
                  setQuickDatePreset('custom');
                }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54] focus:bg-white shadow-2xs"
                placeholder="From date"
              />
            </div>

            {/* End Date */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
              <span className="text-xs text-slate-400 font-bold uppercase">To:</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => {
                  setFilterEndDate(e.target.value);
                  setQuickDatePreset('custom');
                }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54] focus:bg-white shadow-2xs"
                placeholder="To date"
              />
            </div>

            {/* Role Filter (Super Admin) */}
            {isSuperAdmin && (
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs sm:text-sm">
                <button
                  type="button"
                  onClick={() => setFilterRole('all')}
                  className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    filterRole === 'all'
                      ? 'bg-white text-[#181E54] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Roles
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRole('CRO')}
                  className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    filterRole === 'CRO'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  CRO
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRole('MK')}
                  className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    filterRole === 'MK'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  MK
                </button>
              </div>
            )}

            {/* Staff Filter (Super Admin) */}
            {isSuperAdmin && staffList.length > 0 && (
              <select
                value={filterStaffId}
                onChange={(e) => setFilterStaffId(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54] focus:bg-white cursor-pointer shadow-2xs"
              >
                <option value="all">All Staff Members</option>
                {staffList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            )}

            {/* Reset Filter Button */}
            {(filterStartDate || filterEndDate || filterRole !== 'all' || filterStaffId !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setFilterStartDate('');
                  setFilterEndDate('');
                  setFilterRole('all');
                  setFilterStaffId('all');
                  setQuickDatePreset('all');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-[#D81124] bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================
          MAIN SHEET: DATE-WISE TOTAL AGGREGATED DAILY REPORTS
          Columns: Date & Staff | Attendance | Leads (Sources) | Traffic / Transfer | Paid Traffic | Selling Amount | Calls / Msgs | MK Services | Details
         ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs border-b border-red-100 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto overflow-y-auto max-h-[640px] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          <table className="w-full text-left text-xs sm:text-sm min-w-[980px] border-collapse">
            <thead className="bg-[#181E54] text-white uppercase text-[11px] tracking-wider sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-4 px-5 font-bold">Date &amp; Staff</th>
                <th className="py-4 px-4 font-bold">Attendance</th>
                <th className="py-4 px-4 font-bold">Leads (Sources)</th>
                <th className="py-4 px-4 font-bold">Traffic / Transfer</th>
                <th className="py-4 px-4 font-bold">Paid Traffic</th>
                <th className="py-4 px-4 font-bold">Selling Amount &amp; Trend</th>
                <th className="py-4 px-4 font-bold">Calls / Msgs</th>
                <th className="py-4 px-4 font-bold">MK Services</th>
                <th className="py-4 px-5 font-bold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-7 h-7 border-2 border-[#181E54] border-t-transparent rounded-full animate-spin" />
                      <span>Loading daily reports...</span>
                    </div>
                  </td>
                </tr>
              ) : groupedByDate.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-700 mb-1">No daily reports found</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      No reports match the selected date filter. Click the &ldquo;Daily Report&rdquo; button to submit today&apos;s summary.
                    </p>
                  </td>
                </tr>
              ) : (
                groupedByDate.map((group, index) => {
                  const isToday = group.date === todayStr;
                  const prevDay = groupedByDate[index + 1];
                  const diff = prevDay ? group.totalSales - prevDay.totalSales : 0;
                  const percentChange =
                    prevDay && prevDay.totalSales > 0
                      ? (diff / prevDay.totalSales) * 100
                      : group.totalSales > 0
                      ? 100
                      : 0;

                  return (
                    <tr
                      key={group.date}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* 1. Date & Staff */}
                      <td className="py-4 px-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-mono font-bold text-slate-900">
                            <span className="text-sm sm:text-base">{group.date}</span>
                            {isToday && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-sans font-bold">
                                Today
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-slate-700">
                              {group.staffCount} Agent{group.staffCount > 1 ? 's' : ''} Total
                            </span>
                            <div className="flex items-center gap-1 text-[10px] font-bold">
                              {group.croCount > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                  {group.croCount} CRO
                                </span>
                              )}
                              {group.mkCount > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {group.mkCount} MK
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Attendance Status */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {group.attendancePresent + group.attendanceLate} Present
                          </span>
                          {group.attendanceLate > 0 && (
                            <div className="text-[10px] text-amber-700 font-semibold">
                              ({group.attendanceLate} Late)
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. Leads (Sources) */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-mono font-bold text-xs sm:text-sm border border-blue-200">
                            {group.totalLeads}
                          </span>
                          {group.topLeadSources && (
                            <div
                              className="text-[10px] text-slate-400 truncate max-w-[130px]"
                              title={group.topLeadSources}
                            >
                              {group.topLeadSources}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. Traffic / Transfer */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5 font-mono">
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">
                            {group.totalTraffics}
                          </span>
                          <div className="text-[10px] text-emerald-600 font-sans font-semibold">
                            +{group.transferredTraffics} from Lead
                          </div>
                        </div>
                      </td>

                      {/* 5. Paid Traffic */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {group.totalPaid}
                        </span>
                      </td>

                      {/* 6. Selling Amount & Daily Trend Indicator */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-emerald-800 text-sm sm:text-base block">
                            ৳ {group.totalSales.toLocaleString()}
                          </span>
                          {prevDay ? (
                            <div>
                              {diff > 0 ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs font-mono"
                                  title={`Increased by ৳ ${diff.toLocaleString()} compared to previous recorded day (${prevDay.date})`}
                                >
                                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                                  <span>+{diff.toLocaleString()}</span>
                                  {prevDay.totalSales > 0 && (
                                    <span className="text-[10px] font-semibold text-emerald-600">
                                      ({percentChange > 999 ? '>999%' : `+${percentChange.toFixed(0)}%`})
                                    </span>
                                  )}
                                </span>
                              ) : diff < 0 ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/90 shadow-2xs font-mono"
                                  title={`Decreased by ৳ ${Math.abs(diff).toLocaleString()} compared to previous recorded day (${prevDay.date})`}
                                >
                                  <TrendingDown className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                                  <span>-{Math.abs(diff).toLocaleString()}</span>
                                  {prevDay.totalSales > 0 && (
                                    <span className="text-[10px] font-semibold text-rose-600">
                                      ({percentChange.toFixed(0)}%)
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-200 font-mono"
                                  title={`Equal to previous recorded day (${prevDay.date})`}
                                >
                                  <Minus className="w-3 h-3 text-slate-400" />
                                  <span>0% vs prev</span>
                                </span>
                              )}
                            </div>
                          ) : (
                            <span
                              className="text-[10px] text-slate-400 font-medium block"
                              title="Baseline entry (oldest day in current filter)"
                            >
                              Base day
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. Calls / Messages */}
                      <td className="py-4 px-4 font-mono text-xs sm:text-sm">
                        <div>
                          <span className="text-slate-800 font-semibold">{group.totalCalls}</span>
                          <span className="text-[10px] text-slate-400 ml-1 font-sans">calls</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-sans">
                          {group.totalMessages} msgs
                        </div>
                      </td>

                      {/* 8. MK Services */}
                      <td className="py-4 px-4">
                        {group.totalServices > 0 ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 font-mono">
                              <HeartHandshake className="w-3.5 h-3.5 text-[#D81124]" />
                              {group.totalServices} Srv
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {group.uniqueClients} clients
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono">-</span>
                        )}
                      </td>

                      {/* 9. Action Button - Direct in-page Details Modal, no new page */}
                      <td className="py-4 px-5 text-right">
                        {group.reports.length === 1 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedReportForDetails(group.reports[0])}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/90 hover:bg-[#181E54] text-[#181E54] hover:text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="View single submission details"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Details</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {group.reports.map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => setSelectedReportForDetails(r)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-[#181E54] text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                                title={`View report for ${r.userName} (${r.userRole})`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{r.userName}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP 1: THE DAILY REPORT SUBMISSION / EDIT FORM MODAL */}
      <DailyReportModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        token={token}
        user={user}
        onSuccess={loadReports}
      />

      {/* POPUP 2: READ-ONLY FULL DETAILED REPORT MODAL FOR AN INDIVIDUAL AGENT */}
      <DailyReportDetailsModal
        isOpen={!!selectedReportForDetails}
        onClose={() => setSelectedReportForDetails(null)}
        report={selectedReportForDetails}
      />
    </div>
  );
};
