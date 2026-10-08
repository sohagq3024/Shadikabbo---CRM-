import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Calendar,
  Users,
  CheckCircle2,
  PhoneCall,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Plus,
  RefreshCw,
  Eye,
  Filter,
  Check,
  Clock,
  HeartHandshake,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Layers,
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
  const [filterDate, setFilterDate] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'CRO' | 'MK'>('all');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [filterStaffId, setFilterStaffId] = useState('all');

  const isSuperAdmin = user?.role === 'Super Admin';
  const isMK = user?.role === 'MK';
  const isCRO = user?.role === 'CRO';

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterDate) params.append('date', filterDate);
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
  }, [token, filterDate, filterRole, filterStaffId]);

  // Aggregate Today's KPI Metrics across all loaded reports or today's reports
  const todayReports = useMemo(() => {
    const curDate = todayStr || new Date().toISOString().substring(0, 10);
    return reports.filter((r) => r.date === curDate);
  }, [reports, todayStr]);

  const aggregateStats = useMemo(() => {
    const targetSet = todayReports.length > 0 ? todayReports : reports;
    let totalLeads = 0;
    let totalTraffics = 0;
    let totalPaid = 0;
    let totalSales = 0;
    let totalCalls = 0;
    let totalMessages = 0;
    let totalServices = 0;

    targetSet.forEach((r) => {
      totalLeads += r.metrics?.leadsAddedCount || 0;
      totalTraffics += r.metrics?.trafficsAddedCount || 0;
      totalPaid += r.metrics?.paidTrafficsCount || 0;
      totalSales += r.metrics?.sellingAmount || 0;
      totalCalls += r.manualInputs?.receivedCalls || 0;
      totalMessages += r.manualInputs?.messagesAssigned || 0;
      if (r.metrics?.matchmaking) {
        totalServices += r.metrics.matchmaking.totalServicesCount || 0;
      }
    });

    return {
      totalLeads,
      totalTraffics,
      totalPaid,
      totalSales,
      totalCalls,
      totalMessages,
      totalServices,
    };
  }, [todayReports, reports]);

  return (
    <div className="space-y-5 pb-16 max-w-full overflow-y-auto">
      {/* =========================================================
          TOP BANNER & RIGHT-TOP CORNER "DAILY REPORT" ACTION BUTTON
          "Page a akta table ar right top corner a thakbe akta button 'Daily Report'"
         ========================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#181E54] text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#181E54]">
                Daily Performance Report
              </h1>
              <span className="text-[11px] text-slate-500 font-medium">
                Real-time activity logs, lead source breakdown &amp; matchmaking tracking
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT TOP CORNER ACTION BUTTONS */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Refresh Table */}
          <button
            type="button"
            onClick={loadReports}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Refresh reports"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* THE MANDATORY RIGHT-TOP CORNER "Daily Report" BUTTON */}
          <button
            type="button"
            onClick={() => setIsFormModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#181E54] via-[#242D73] to-[#181E54] hover:shadow-md text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer active:scale-98"
            title="Open Daily Report Form"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Daily Report</span>
            {hasSubmittedToday && (
              <span className="ml-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-200" title="Today's report already submitted" />
            )}
          </button>
        </div>
      </div>

      {/* TODAY'S LIVE KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Leads */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Today Leads
            </span>
            <Users className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#181E54]">
            {aggregateStats.totalLeads}
          </p>
          <span className="text-[10px] text-slate-400">Added to pipeline</span>
        </div>

        {/* Traffics */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Add Traffic
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-indigo-900">
            {aggregateStats.totalTraffics}
          </p>
          <span className="text-[10px] text-slate-400">Total verified</span>
        </div>

        {/* Paid Traffic */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              Paid Traffic
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-700">
            {aggregateStats.totalPaid}
          </p>
          <span className="text-[10px] text-emerald-600">Converted</span>
        </div>

        {/* Selling Amount */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
              Selling Amount
            </span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-emerald-900 font-mono">
            ৳ {aggregateStats.totalSales.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400">Approved sales</span>
        </div>

        {/* Calls Received */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Calls
            </span>
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {aggregateStats.totalCalls}
          </p>
          <span className="text-[10px] text-slate-400">Incoming calls</span>
        </div>

        {/* Matchmaking Services or Messages */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {isMK ? 'MK Services' : 'Messages'}
            </span>
            {isMK ? (
              <HeartHandshake className="w-3.5 h-3.5 text-[#D81124]" />
            ) : (
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            )}
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#181E54]">
            {isMK ? aggregateStats.totalServices : aggregateStats.totalMessages}
          </p>
          <span className="text-[10px] text-slate-400">
            {isMK ? 'Client interactions' : 'Threads assigned'}
          </span>
        </div>
      </div>

      {/* FILTER & SEARCH ROW */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Date Picker */}
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
            />
          </div>

          {/* Role Filter (Super Admin) */}
          {isSuperAdmin && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setFilterRole('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterRole === 'all'
                    ? 'bg-white text-[#181E54] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Roles
              </button>
              <button
                type="button"
                onClick={() => setFilterRole('CRO')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterRole === 'CRO'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                CRO
              </button>
              <button
                type="button"
                onClick={() => setFilterRole('MK')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterRole === 'MK'
                    ? 'bg-emerald-600 text-white shadow-2xs'
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
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54] cursor-pointer"
            >
              <option value="all">👥 All Staff Members</option>
              {staffList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          )}

          {(filterDate || filterRole !== 'all' || filterStaffId !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setFilterDate('');
                setFilterRole('all');
                setFilterStaffId('all');
              }}
              className="text-xs text-[#D81124] hover:underline font-semibold cursor-pointer px-1"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing <strong>{reports.length}</strong> daily report(s)
        </div>
      </div>

      {/* =========================================================
          MAIN TABLE: DAILY PERFORMANCE REPORTS
         ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs border-b border-red-100 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto overflow-y-auto max-h-[620px] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          <table className="w-full text-left text-xs min-w-[950px] border-collapse">
            <thead className="bg-[#181E54] text-white uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-3 px-4 font-semibold">Date &amp; Staff</th>
                <th className="py-3 px-3.5 font-semibold">Attendance</th>
                <th className="py-3 px-3.5 font-semibold">Leads (Sources)</th>
                <th className="py-3 px-3.5 font-semibold">Traffic / Transfer</th>
                <th className="py-3 px-3.5 font-semibold">Paid Traffic</th>
                <th className="py-3 px-3.5 font-semibold">Selling Amount</th>
                <th className="py-3 px-3.5 font-semibold">Calls / Msgs</th>
                <th className="py-3 px-3.5 font-semibold">MK Services</th>
                <th className="py-3 px-4 font-semibold text-right">Details</th>
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
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-700 mb-1">No daily reports recorded</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Click the &ldquo;Daily Report&rdquo; button in the top right corner to submit today&apos;s performance summary.
                    </p>
                  </td>
                </tr>
              ) : (
                reports.map((row) => {
                  const att = row.attendance || ({} as any);
                  const metrics = row.metrics || ({} as any);
                  const sources = metrics.leadSources || {};
                  const topSources = Object.entries(sources)
                    .slice(0, 2)
                    .map(([src, count]) => `${src}: ${count}`)
                    .join(', ');

                  const isToday = row.date === todayStr;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedReportForDetails(row)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                      title="Click to view full detailed report"
                    >
                      {/* 1. Date & Staff */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 group-hover:text-[#D81124] transition-colors">
                            <span>{row.date}</span>
                            {isToday && (
                              <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-sans font-bold">
                                Today
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <span className="font-semibold">{row.userName}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                                row.userRole === 'CRO'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {row.userRole}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Attendance Status */}
                      <td className="py-3.5 px-3.5">
                        <div className="space-y-0.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              att.status?.includes('Late')
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : att.status?.includes('Present')
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {att.status || 'Present'}
                          </span>
                          <div className="text-[10px] font-mono text-slate-400">
                            In: {att.inTime || '-'} · Out: {att.outTime || '-'}
                          </div>
                        </div>
                      </td>

                      {/* 3. Leads (Sources) */}
                      <td className="py-3.5 px-3.5">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-mono font-bold text-xs border border-blue-200">
                            {metrics.leadsAddedCount || 0}
                          </span>
                          {topSources && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[130px]" title={topSources}>
                              {topSources}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. Traffic / Transfer */}
                      <td className="py-3.5 px-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 font-mono">
                            {metrics.trafficsAddedCount || 0}
                          </span>
                          <div className="text-[10px] text-emerald-600 font-medium">
                            +{metrics.leadsTransferredToTrafficCount || 0} from Lead
                          </div>
                        </div>
                      </td>

                      {/* 5. Paid Traffic */}
                      <td className="py-3.5 px-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {metrics.paidTrafficsCount || 0}
                        </span>
                      </td>

                      {/* 6. Selling Amount */}
                      <td className="py-3.5 px-3.5">
                        <span className="font-mono font-bold text-emerald-800 text-xs">
                          ৳ {(metrics.sellingAmount || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* 7. Calls / Messages */}
                      <td className="py-3.5 px-3.5 font-mono text-xs">
                        <div>
                          <span className="text-slate-800 font-semibold">{row.manualInputs?.receivedCalls || 0}</span>
                          <span className="text-[10px] text-slate-400 ml-1 font-sans">calls</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-sans">
                          {row.manualInputs?.messagesAssigned || 0} msgs
                        </div>
                      </td>

                      {/* 8. MK Services */}
                      <td className="py-3.5 px-3.5">
                        {metrics.matchmaking ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 font-mono">
                              <HeartHandshake className="w-3 h-3 text-[#D81124]" />
                              {metrics.matchmaking.totalServicesCount || 0} Srv
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {metrics.matchmaking.uniqueClientsCount || 0} clients · {metrics.matchmaking.pendingServicesCount || 0} due
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono">-</span>
                        )}
                      </td>

                      {/* 9. Action Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReportForDetails(row);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-[#181E54] text-slate-700 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                          <ChevronRight className="w-3 h-3 opacity-60" />
                        </button>
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

      {/* POPUP 2: READ-ONLY FULL DETAILED REPORT MODAL */}
      <DailyReportDetailsModal
        isOpen={!!selectedReportForDetails}
        onClose={() => setSelectedReportForDetails(null)}
        report={selectedReportForDetails}
      />
    </div>
  );
};
