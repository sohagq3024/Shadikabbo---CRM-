import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  PhoneIncoming,
  PhoneOutgoing,
  Send,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
  Sparkles,
  History,
  FileText,
  HeartHandshake,
  Tag,
  Phone,
} from 'lucide-react';
import { CountryFlag, detectCountryIso } from './CountryFlag';

export type MatchmakingServiceType = 'Incoming Call' | 'Outgoing Call' | 'CV Send' | 'Update';

interface MatchmakingServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: any;
  token: string;
  currentUser: any;
  onServiceRecorded: (updatedTraffic: any) => void;
}

export const SERVICE_TYPES_CONFIG: Array<{
  type: MatchmakingServiceType;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  badgeBg: string;
}> = [
  {
    type: 'Incoming Call',
    label: 'Incoming Call',
    sublabel: 'Client called for match feedback / proposal inquiry',
    icon: PhoneIncoming,
    activeBg: 'bg-emerald-50',
    activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20',
    activeText: 'text-emerald-900',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    type: 'Outgoing Call',
    label: 'Outgoing Call',
    sublabel: 'Called client to discuss prospective proposals',
    icon: PhoneOutgoing,
    activeBg: 'bg-blue-50',
    activeBorder: 'border-blue-500 ring-2 ring-blue-500/20',
    activeText: 'text-blue-900',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    type: 'CV Send',
    label: 'CV Send',
    sublabel: 'Dispatched candidate biodata / CVs to client',
    icon: Send,
    activeBg: 'bg-[#181E54]/10',
    activeBorder: 'border-[#181E54] ring-2 ring-[#181E54]/20',
    activeText: 'text-[#181E54]',
    badgeBg: 'bg-[#181E54]/10 text-[#181E54] border-[#181E54]/30',
  },
  {
    type: 'Update',
    label: 'Update',
    sublabel: 'Updated profile requirements, photos, or criteria',
    icon: RefreshCw,
    activeBg: 'bg-amber-50',
    activeBorder: 'border-amber-500 ring-2 ring-amber-500/20',
    activeText: 'text-amber-900',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
  },
];

export const MatchmakingServiceModal: React.FC<MatchmakingServiceModalProps> = ({
  isOpen,
  onClose,
  candidate,
  token,
  currentUser,
  onServiceRecorded,
}) => {
  const [selectedType, setSelectedType] = useState<MatchmakingServiceType>('Outgoing Call');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !candidate) return null;

  // 3-Day Rule Calculation
  const now = Date.now();
  const lastTime =
    candidate.lastServiceAt ||
    candidate.assignedAt ||
    candidate.createdTimestamp ||
    (candidate.createdAt ? new Date(candidate.createdAt).getTime() : now);
  const diffMs = now - lastTime;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const isOverdue = diffDays >= 3 || !candidate.lastServiceAt;
  const daysOverdue = Math.max(1, diffDays - 2);
  const daysRemaining = Math.max(0, 3 - diffDays);

  const pastServices: any[] = Array.isArray(candidate.matchmakingServices)
    ? candidate.matchmakingServices
    : [];

  const handleSaveService = async () => {
    setError(null);
    if (!selectedType) {
      setError('Please select a service type.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/matchmaking/${candidate.id}/service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceType: selectedType,
          note: note.trim(),
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to record service');
      }

      const json = await res.json();

      // Trigger pleasant haptic feedback if mobile
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }

      onServiceRecorded(json.traffic);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error recording service');
    } finally {
      setSubmitting(false);
    }
  };

  const quickNotes = [
    'Called client and discussed 2 prospective biodatas.',
    'Dispatched approved groom proposals via WhatsApp.',
    'Client requested updated doctor / engineer biodatas.',
    'Family agreed to proposal meeting next weekend.',
    'Reviewed partner requirements and updated location preference.',
  ];

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* ==================================================
            HEADER
        ================================================== */}
        <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#181E54] text-white flex items-center justify-center shadow-xs shrink-0">
              <HeartHandshake className="w-5 h-5 text-[#D81124]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-[#181E54]">Record Client Service</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#181E54]/10 text-[#181E54] border border-[#181E54]/15">
                  MK Workflow
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Log matchmaking interaction &amp; update 3-day service cycle
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center touch-manipulation"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ==================================================
            MODAL BODY (Scrollable)
        ================================================== */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {/* CLIENT BRIEF & 3-DAY STATUS CARD */}
          <div className="bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white shadow-xs bg-slate-200 flex items-center justify-center shrink-0">
                {candidate.images && candidate.images.length > 0 ? (
                  <img src={candidate.images[0]} alt={candidate.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{candidate.name}</h3>
                  <span className="font-mono text-xs font-semibold text-slate-500">({candidate.id})</span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                    <Tag className="w-3 h-3 opacity-70" />
                    <span>{candidate.matchmakingLevel || 'Level 1'}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap">
                  <span className="font-semibold text-[#181E54]">{candidate.package || 'Standard Package'}</span>
                  <span>&bull;</span>
                  <span>{candidate.profession || 'Professional'}</span>
                  <span>&bull;</span>
                  <div className="flex items-center gap-1 font-mono text-slate-700">
                    <CountryFlag iso={detectCountryIso(candidate.phone)} className="w-3.5 h-2.5" />
                    <span>{candidate.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3-Day Rule Badge */}
            <div className="sm:text-right shrink-0">
              {isOverdue ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span>Service Overdue</span>
                  <span className="bg-amber-200/90 text-amber-950 px-1.5 py-0.2 rounded font-mono font-bold text-[11px]">
                    {daysOverdue}d overdue
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Up to Date</span>
                  <span className="bg-emerald-200/80 text-emerald-950 px-1.5 py-0.2 rounded font-mono font-semibold text-[11px]">
                    {daysRemaining}d left
                  </span>
                </div>
              )}
              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                Cycle: Routine check required every 3 days
              </div>
            </div>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 text-xs sm:text-sm rounded-xl border border-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* SERVICE SELECTION (4 Required Types) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                1. Select Service Delivered:
              </label>
              <span className="text-xs text-slate-500">Choose the action performed</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SERVICE_TYPES_CONFIG.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setSelectedType(item.type)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 min-h-[72px] touch-manipulation active:scale-[0.98] ${
                      isSelected
                        ? `${item.activeBg} ${item.activeBorder} shadow-xs`
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-white shadow-xs' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? item.activeText : 'text-slate-600'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs sm:text-sm font-bold ${isSelected ? item.activeText : 'text-slate-900'}`}>
                          {item.label}
                        </span>
                        {isSelected && (
                          <span className="inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                        {item.sublabel}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* NOTE FIELD (Mandatory Remark) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                2. Service Note &amp; Remarks:
              </label>
              <span className="text-xs text-slate-500">Client response / prospective details</span>
            </div>

            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter details of conversation, biodatas sent, client preferences, or follow-up feedback..."
              className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#181E54]/20 focus:border-[#181E54] focus:bg-white transition-all shadow-2xs font-medium"
            />

            {/* Quick Note Presets */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 font-bold uppercase py-0.5">Quick Presets:</span>
              {quickNotes.map((qn, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNote((prev) => (prev ? `${prev} ${qn}` : qn))}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer touch-manipulation active:scale-[0.98]"
                >
                  {qn}
                </button>
              ))}
            </div>
          </div>

          {/* SERVICE HISTORY LOG */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
                <History className="w-4 h-4 text-[#181E54]" />
                <span>Service History ({pastServices.length})</span>
              </div>
              <span className="text-xs text-slate-500">
                Logged services on this candidate
              </span>
            </div>

            {pastServices.length === 0 ? (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-center text-slate-500 text-xs sm:text-sm">
                No past service interactions logged yet. Submit the first service above!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto p-1">
                {pastServices.map((srv, idx) => {
                  const cfg = SERVICE_TYPES_CONFIG.find((c) => c.type === srv.serviceType);
                  return (
                    <div
                      key={srv.id || idx}
                      className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200 text-xs flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              cfg ? cfg.badgeBg : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {srv.serviceType}
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            by {srv.providedBy?.name || 'MK Officer'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {srv.formattedDate || new Date(srv.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        {srv.note && (
                          <p className="text-slate-700 text-xs font-medium pl-1 leading-relaxed">
                            {srv.note}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            Submitting completes this 3-day service cycle &amp; resets timer
          </div>

          <div className="flex items-center gap-2.5 ml-auto w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer transition-colors min-h-[42px] touch-manipulation active:scale-[0.98]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveService}
              disabled={submitting}
              className="px-5 py-2.5 bg-[#181E54] hover:bg-[#121642] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2 active:scale-98 min-h-[42px] touch-manipulation"
            >
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{submitting ? 'Recording...' : 'Confirm & Complete Service'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

