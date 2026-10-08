import React from 'react';
import {
  X,
  FileText,
  Clock,
  PhoneCall,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Users,
  GitFork,
  CheckCircle,
  HeartHandshake,
  Calendar,
  User,
  Shield,
  Layers,
} from 'lucide-react';
import { DailyReportRecord } from '../server/dailyReportRoutes';

interface DailyReportDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DailyReportRecord | null;
}

export const DailyReportDetailsModal: React.FC<DailyReportDetailsModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  if (!isOpen || !report) return null;

  const att = report.attendance || {
    status: 'Pending',
    inTime: '-',
    outTime: '-',
    lateMinutes: 0,
    scanMethod: '-',
    notes: '',
  };
  const metrics = report.metrics || {
    leadsAddedCount: 0,
    leadSources: {},
    leadStatuses: {},
    trafficsAddedCount: 0,
    leadsTransferredToTrafficCount: 0,
    paidTrafficsCount: 0,
    sellingAmount: 0,
  };
  const manual = report.manualInputs || {
    receivedCalls: 0,
    messagesAssigned: 0,
    notes: '',
  };
  const matchmaking = metrics.matchmaking;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
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
                    report.userRole === 'CRO'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {report.userRole}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff: <strong className="text-slate-800">{report.userName}</strong> ({report.userPhone || 'Official'}) · Date: <strong className="font-mono text-slate-800">{report.date}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 overflow-y-auto flex-1 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 pr-1">
          {/* 1. Attendance Snapshot */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#181E54]" />
                Attendance Status:
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {att.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-sans block uppercase">In-Time</span>
                <span className="font-bold text-emerald-700">{att.inTime}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-sans block uppercase">Out-Time</span>
                <span className="font-bold text-slate-700">{att.outTime}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-sans block uppercase">Late Mins</span>
                <span className="font-bold text-slate-700">{att.lateMinutes} mins</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-sans block uppercase">Method</span>
                <span className="font-bold text-slate-700 capitalize font-sans">{att.scanMethod}</span>
              </div>
            </div>
          </div>

          {/* 2. Pipeline Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Leads Added</span>
              <span className="text-2xl font-bold text-[#181E54]">{metrics.leadsAddedCount}</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Traffic Added</span>
              <span className="text-2xl font-bold text-indigo-700">{metrics.trafficsAddedCount}</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Lead → Traffic</span>
              <span className="text-2xl font-bold text-emerald-700">{metrics.leadsTransferredToTrafficCount}</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Paid Traffic</span>
              <span className="text-2xl font-bold text-emerald-600">{metrics.paidTrafficsCount}</span>
            </div>
            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 shadow-2xs sm:col-span-2">
              <span className="text-[10px] text-emerald-800 font-bold block uppercase">Selling Amount</span>
              <span className="text-2xl font-bold text-emerald-900 font-mono">
                ৳ {(metrics.sellingAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Lead Sources Breakdown */}
          {metrics.leadSources && Object.keys(metrics.leadSources).length > 0 && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase">Lead Sources Breakdown:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(metrics.leadSources).map(([src, count]) => (
                  <span
                    key={src}
                    className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <span>{src}:</span>
                    <strong className="text-[#181E54] font-mono">{String(count)}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* MK Matchmaking Details */}
          {matchmaking && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-[#D81124]" />
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  MK Matchmaking Activity
                </h4>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Services</span>
                  <span className="text-xl font-bold text-[#181E54]">{matchmaking.totalServicesCount}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Unique Clients</span>
                  <span className="text-xl font-bold text-emerald-700">{matchmaking.uniqueClientsCount}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Pending Services</span>
                  <span className="text-xl font-bold text-rose-700">{matchmaking.pendingServicesCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. Manual Inputs */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              Manual Phone &amp; Communication Logs
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  Received Calls:
                </span>
                <span className="font-bold font-mono text-base text-slate-900">{manual.receivedCalls}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  Messages Assigned:
                </span>
                <span className="font-bold font-mono text-base text-slate-900">{manual.messagesAssigned}</span>
              </div>
            </div>

            {manual.notes && (
              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-bold block mb-1">Staff Notes:</span>
                <p className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-line">
                  {manual.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Submitted at {new Date(report.submittedAt).toLocaleTimeString()}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#181E54] text-white text-xs font-bold rounded-xl hover:bg-[#121742] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
