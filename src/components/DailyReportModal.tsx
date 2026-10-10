import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  PhoneCall,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Users,
  GitFork,
  CheckCircle,
  HeartHandshake,
  AlertCircle,
  Save,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  user: any;
  onSuccess: () => void;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  isOpen,
  onClose,
  token,
  user,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Live Auto-Calculated Data from backend
  const [liveData, setLiveData] = useState<any>(null);
  const [existingReport, setExistingReport] = useState<any>(null);

  // Manual Inputs
  const [receivedCalls, setReceivedCalls] = useState<number | string>('');
  const [messagesAssigned, setMessagesAssigned] = useState<number | string>('');
  const [notes, setNotes] = useState<string>('');

  const isMK = user?.role === 'MK' || (user?.role === 'Super Admin' && liveData?.metrics?.matchmaking);
  const isCRO = user?.role === 'CRO';

  const fetchLiveStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/daily-reports/live-stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load real-time daily metrics');
      const json = await res.json();
      setLiveData(json.liveData || {});
      setExistingReport(json.existingReport || null);

      if (json.existingReport) {
        setReceivedCalls(json.existingReport.manualInputs?.receivedCalls ?? '');
        setMessagesAssigned(json.existingReport.manualInputs?.messagesAssigned ?? '');
        setNotes(json.existingReport.manualInputs?.notes ?? '');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading live statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLiveStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        date: liveData?.date || undefined,
        attendance: liveData?.attendance,
        metrics: liveData?.metrics,
        manualInputs: {
          receivedCalls: Number(receivedCalls) || 0,
          messagesAssigned: Number(messagesAssigned) || 0,
          notes,
        },
      };

      const res = await fetch('/api/daily-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to submit daily report');
      }

      setSuccessMsg('Daily Report submitted successfully!');
      setTimeout(() => {
        setSuccessMsg(null);
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Error saving report');
    } finally {
      setSubmitting(false);
    }
  };

  const att = liveData?.attendance || {};
  const metrics = liveData?.metrics || {};
  const leadSources = metrics.leadSources || {};
  const matchmaking = metrics.matchmaking;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#181E54] to-[#2D3A8C] text-white flex items-center justify-center shadow-md">
              <FileText className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#181E54]">Daily Performance Report</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    user?.role === 'CRO'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : user?.role === 'MK'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {user?.role} Format
                </span>
                {existingReport && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Editing Today&apos;s Report
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff: <strong className="text-slate-700">{user?.name}</strong> · Live CRM metrics auto-included for today.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={fetchLiveStats}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Refresh real-time stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="py-4 overflow-y-auto flex-1 space-y-5 scrollbar-thin scrollbar-thumb-slate-300 pr-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-[#181E54] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Aggregating live CRM metrics &amp; attendance...</p>
            </div>
          ) : (
            <form id="daily-report-form" onSubmit={handleSubmit} className="space-y-5">
              {/* SECTION 1: AUTO INCLUDED ATTENDANCE STATUS */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#181E54]" />
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      1. Attendance Status (Auto-Included)
                    </h3>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      att.status?.includes('Late')
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : att.status?.includes('Present')
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : att.status?.includes('Day Off')
                        ? 'bg-purple-50 text-purple-800 border-purple-300'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {att.status || 'Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-sans block uppercase font-semibold">In-Time</span>
                    <span className="font-bold text-emerald-700">{att.inTime || '-'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-sans block uppercase font-semibold">Out-Time</span>
                    <span className="font-bold text-slate-700">{att.outTime || '-'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-sans block uppercase font-semibold">Late Minutes</span>
                    <span className={`font-bold ${att.lateMinutes > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                      {att.lateMinutes > 0 ? `${att.lateMinutes} mins` : '0 (On-time)'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-sans block uppercase font-semibold">Scan Method</span>
                    <span className="font-bold text-slate-700 capitalize font-sans">{att.scanMethod?.replace('_', ' ') || '-'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: AUTOMATICALLY INCLUDED CRM METRICS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#D81124]" />
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    2. Today&apos;s CRM Pipeline Output (Auto-Included)
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Added Leads */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">Added Leads</span>
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="text-xl font-bold text-[#181E54]">
                      {metrics.leadsAddedCount || 0}
                    </div>
                    <div className="text-[10px] text-slate-400">Created today by you</div>
                  </div>

                  {/* Added Clients */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">Add Client</span>
                      <GitFork className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div className="text-xl font-bold text-indigo-900">
                      {metrics.trafficsAddedCount || 0}
                    </div>
                    <div className="text-[10px] text-slate-400">Total clients today</div>
                  </div>

                  {/* Lead to Transfer Client */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">Lead → Client</span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-xl font-bold text-emerald-800">
                      {metrics.leadsTransferredToTrafficCount || 0}
                    </div>
                    <div className="text-[10px] text-slate-400">Transferred from lead</div>
                  </div>

                  {/* Paid Client */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">Paid Client</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-xl font-bold text-emerald-700">
                      {metrics.paidTrafficsCount || 0}
                    </div>
                    <div className="text-[10px] text-slate-400">Converted or added</div>
                  </div>

                  {/* Selling Amount */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-2xs space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-900 uppercase">
                        Selling Amount Collected
                      </span>
                      <DollarSign className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-900 font-mono">
                      ৳ {(metrics.sellingAmount || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-700">
                      Auto-credited from approved payment transactions today
                    </div>
                  </div>
                </div>

                {/* Lead Source Breakdown Chips */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-600 uppercase flex items-center justify-between">
                    <span>Lead Sources Status Breakdown:</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {Object.keys(leadSources).length} active sources today
                    </span>
                  </div>
                  {Object.keys(leadSources).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No new leads created today yet.</p>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      {Object.entries(leadSources).map(([source, count]) => (
                        <span
                          key={source}
                          className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 flex items-center gap-1.5 shadow-2xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span className="font-semibold">{source}:</span>
                          <span className="font-mono font-bold text-[#181E54]">{String(count)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: MK SPECIFIC MATCHMAKING METRICS */}
              {isMK && matchmaking && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/50 to-rose-50/40 border border-amber-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HeartHandshake className="w-4 h-4 text-[#D81124]" />
                      <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                        3. Matchmaking Client Services (MK Auto-Metrics)
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-[#D81124] bg-white px-2 py-0.5 rounded-full border border-rose-200">
                      MK Mandatory Field
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    A single client can be served multiple times. Both total services rendered and unique clients are recorded.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Total Services Rendered */}
                    <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">
                        Total Services Rendered
                      </span>
                      <span className="text-xl font-bold text-[#181E54] font-mono">
                        {matchmaking.totalServicesCount || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Multiple calls / CV sends counted
                      </span>
                    </div>

                    {/* Unique Clients Served */}
                    <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">
                        Unique Clients Served
                      </span>
                      <span className="text-xl font-bold text-emerald-700 font-mono">
                        {matchmaking.uniqueClientsCount || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Individual candidate profiles
                      </span>
                    </div>

                    {/* Services Pending / Due */}
                    <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">
                        Services Pending / Due
                      </span>
                      <span className="text-xl font-bold text-rose-700 font-mono">
                        {matchmaking.pendingServicesCount || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Routine 3-day cycle overdue
                      </span>
                    </div>
                  </div>

                  {/* Service Type Breakdown */}
                  {matchmaking.serviceTypeBreakdown && (
                    <div className="pt-1 flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Service Breakdown:</span>
                      {Object.entries(matchmaking.serviceTypeBreakdown).map(([type, cnt]) => (
                        <span
                          key={type}
                          className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700 flex items-center gap-1"
                        >
                          <span>{type}:</span>
                          <strong className="text-[#181E54]">{String(cnt)}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 4: REQUIRED MANUAL INPUTS */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    {isMK ? '4' : '3'}. Manual Entry Fields (বাধ্যতামূলক ইনপুট)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Total Received Calls */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Total Received Calls (মোট রিসিভ কল) <span className="text-[#D81124]">*</span>
                    </label>
                    <div className="relative">
                      <PhoneCall className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={receivedCalls}
                        onChange={(e) => setReceivedCalls(e.target.value)}
                        placeholder="e.g. 24"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Number of client or candidate phone calls received today
                    </span>
                  </div>

                  {/* Total Messages Assigned */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Total Messages Assigned (মোট মেসেজ অ্যাসাইন / হ্যান্ডেল্ড) <span className="text-[#D81124]">*</span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={messagesAssigned}
                        onChange={(e) => setMessagesAssigned(e.target.value)}
                        placeholder="e.g. 45"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      WhatsApp, Facebook, or CRM messaging threads handled today
                    </span>
                  </div>
                </div>

                {/* Notes & Summary */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Daily Notes &amp; Summary (কাজের বিবরণ বা মন্তব্য - ঐচ্ছিক)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any special remarks, deals closed, or follow-ups for tomorrow..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0 flex-wrap gap-2">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Submitting updates today&apos;s live performance log.</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="daily-report-form"
              disabled={submitting || loading}
              className="px-6 py-2.5 bg-gradient-to-r from-[#181E54] to-[#2D3A8C] hover:shadow-md text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {submitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{existingReport ? 'Update Daily Report' : 'Submit Daily Report'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
