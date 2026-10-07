import React, { useState, useMemo, useEffect } from 'react';
import {
  Clock,
  ArrowRight,
  User,
  Shield,
  MessageSquare,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  PhoneCall,
  UserCheck,
  PauseCircle,
  FileEdit,
  Trash2,
  Calendar,
  Send,
  Filter,
  Search,
  FileCheck,
  RotateCcw,
} from 'lucide-react';

export interface ActivityUser {
  id?: string;
  name: string;
  role: string;
  phone?: string;
}

export interface ActivityLogItem {
  id: string;
  leadId: string;
  type: 'status_change' | 'created' | 'note' | 'converted' | 'trash';
  previousStatus?: string | null;
  newStatus: string;
  timestamp: number;
  formattedDate: string;
  user: ActivityUser;
  comment?: string;
}

export interface ActivityLogProps {
  lead?: any;
  traffic?: any;
  token: string;
  onStatusUpdated?: (updatedRecord: any) => void;
  compact?: boolean;
}

export const LEAD_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  'wp-connect': {
    label: 'WP Connect',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    icon: PhoneCall,
  },
  'cv-collect': {
    label: 'CV Collect',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-300',
    icon: FileCheck,
  },
  service: {
    label: 'Service',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-300',
    icon: Sparkles,
  },
  'follow-up': {
    label: 'Follow up',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    icon: Clock,
  },
  'payment-ready': {
    label: 'Payment Ready',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-300',
    icon: CheckCircle2,
  },
  blank: {
    label: 'Blank',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
    icon: PauseCircle,
  },
  // Legacy status support
  active: {
    label: 'Active Lead',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: CheckCircle2,
  },
  contacted: {
    label: 'Contacted',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    icon: PhoneCall,
  },
  'in-progress': {
    label: 'In Progress',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: FileEdit,
  },
  qualified: {
    label: 'Qualified',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: UserCheck,
  },
  negotiation: {
    label: 'Negotiation',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: MessageSquare,
  },
  'on-hold': {
    label: 'On Hold',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    icon: PauseCircle,
  },
  converted: {
    label: 'Converted to Traffic',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
    icon: Sparkles,
  },
  trash: {
    label: 'Trash',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: Trash2,
  },
};

export function getStatusMeta(status: string = 'Blank') {
  const raw = String(status || 'Blank').trim();
  const lower = raw.toLowerCase().replace(/[-_]/g, ' ');

  // 1. Dynamic Follow up (e.g. "Follow up 1", "Follow up 2", "Follow up 3")
  const followUpMatch = lower.match(/^follow\s*up\s*(\d+)?$/i);
  if (followUpMatch) {
    const num = followUpMatch[1] ? ` ${followUpMatch[1]}` : '';
    return {
      label: `Follow up${num}`,
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      icon: Clock,
    };
  }

  // 2. WP Connect
  if (lower === 'wp connect' || lower === 'wpconnect' || lower === 'whatsapp connect') {
    return {
      label: 'WP Connect',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-300',
      icon: PhoneCall,
    };
  }

  // 3. CV Collect
  if (lower === 'cv collect' || lower === 'cvcollect' || lower === 'biodata collect') {
    return {
      label: 'CV Collect',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-300',
      icon: FileCheck,
    };
  }

  // 4. Service
  if (lower === 'service' || lower === 'service discussion') {
    return {
      label: 'Service',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-300',
      icon: Sparkles,
    };
  }

  // 5. Payment Ready
  if (lower === 'payment ready' || lower === 'paymentready') {
    return {
      label: 'Payment Ready',
      bg: 'bg-teal-50',
      text: 'text-teal-800',
      border: 'border-teal-300',
      icon: CheckCircle2,
    };
  }

  // 6. Blank
  if (lower === 'blank' || lower === 'none' || lower === '') {
    return {
      label: 'Blank',
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-300',
      icon: PauseCircle,
    };
  }

  const key = lower.replace(/\s+/g, '-');
  return (
    LEAD_STATUS_CONFIG[key] ||
    LEAD_STATUS_CONFIG[lower] || {
      label: raw || 'Blank',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      icon: Clock,
    }
  );
}

// Relative time calculator
function getRelativeTimeString(timestamp: number): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  lead,
  traffic,
  token,
  onStatusUpdated,
  compact = false,
}) => {
  const currentItem = traffic || lead;
  const isTraffic = Boolean(traffic || (currentItem?.id && String(currentItem.id).startsWith('SK-')));
  const currentStatus = currentItem?.status || 'WP Connect';
  const activities: ActivityLogItem[] = useMemo(() => {
    return Array.isArray(currentItem?.activityLog) ? currentItem.activityLog : [];
  }, [currentItem?.activityLog]);

  // Form states for status transition
  const [isTransitionFormOpen, setIsTransitionFormOpen] = useState(false);

  // Calculate total previous follow-up sessions across activity log & current status
  const currentFollowUpCount = useMemo(() => {
    let highest = 0;
    let count = 0;
    if (Array.isArray(currentItem?.activityLog)) {
      for (const act of currentItem.activityLog) {
        const match = String(act.newStatus || act.comment || '').match(/follow\s*up\s*(\d+)/i);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > highest) highest = n;
          count++;
        } else if (
          String(act.newStatus || '').toLowerCase().includes('follow up') ||
          String(act.newStatus || '').toLowerCase().includes('follow-up')
        ) {
          count++;
        }
      }
    }
    const currMatch = String(currentItem?.status || '').match(/follow\s*up\s*(\d+)/i);
    if (currMatch) {
      const n = parseInt(currMatch[1], 10);
      if (n > highest) highest = n;
    }
    return Math.max(highest, count);
  }, [currentItem?.activityLog, currentItem?.status]);

  const nextFollowUpNumber = currentFollowUpCount + 1;

  // Selected base status type from the menu: 'WP Connect' | 'CV Collect' | 'Service' | 'Follow up' | 'Payment Ready' | 'Blank'
  const [selectedBaseStatus, setSelectedBaseStatus] = useState<string>(() => {
    const curr = (currentItem?.status || '').toLowerCase();
    if (curr === 'blank' || curr === '') return 'WP Connect';
    if (curr === 'wp connect' || curr === 'wp_connect') return 'CV Collect';
    if (curr === 'cv collect' || curr === 'cv_collect') return 'Service';
    if (curr === 'service') return 'Follow up';
    if (curr.includes('follow up') || curr.includes('follow-up')) return 'Follow up';
    if (curr === 'payment ready' || curr === 'payment_ready') return 'Payment Ready';
    return 'WP Connect';
  });

  // Follow-up amount / round counter (1, 2, 3...)
  const [followUpAmount, setFollowUpAmount] = useState<number>(nextFollowUpNumber);

  useEffect(() => {
    setFollowUpAmount(nextFollowUpNumber);
  }, [nextFollowUpNumber]);

  // Compute final destination status string to be persisted
  const targetDestinationStatus = useMemo(() => {
    if (selectedBaseStatus === 'Follow up') {
      return `Follow up ${followUpAmount || 1}`;
    }
    return selectedBaseStatus;
  }, [selectedBaseStatus, followUpAmount]);

  const [transitionComment, setTransitionComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Search and filter states
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'status_change' | 'created' | 'note'>('all');

  // Filtered activity log
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'status_change' && act.type !== 'status_change' && act.type !== 'converted' && act.type !== 'trash') {
          return false;
        }
        if (typeFilter === 'created' && act.type !== 'created') return false;
        if (typeFilter === 'note' && act.type !== 'note') return false;
      }

      // Keyword search
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        const userMatch = act.user?.name?.toLowerCase().includes(query);
        const roleMatch = act.user?.role?.toLowerCase().includes(query);
        const commentMatch = act.comment?.toLowerCase().includes(query);
        const statusMatch =
          act.previousStatus?.toLowerCase().includes(query) ||
          act.newStatus?.toLowerCase().includes(query);
        return userMatch || roleMatch || commentMatch || statusMatch;
      }

      return true;
    });
  }, [activities, typeFilter, searchFilter]);

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem?.id || !targetDestinationStatus) return;

    if (targetDestinationStatus.toLowerCase() === currentStatus.toLowerCase()) {
      setSubmitError(
        `Record is already in "${getStatusMeta(currentStatus).label}" status. Select a different status or advance the follow-up round to record a transition.`
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setActionSuccess(null);

    const apiPath = isTraffic
      ? `/api/traffic/${currentItem.id}/status`
      : `/api/leads/${currentItem.id}/status`;

    try {
      const response = await fetch(apiPath, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: targetDestinationStatus,
          comment:
            transitionComment.trim() ||
            `Status updated from "${getStatusMeta(currentStatus).label}" to "${targetDestinationStatus}"`,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update status');
      }

      const data = await response.json();
      const updatedEntity = data.traffic || data.lead;
      setActionSuccess(`Status successfully transitioned from "${getStatusMeta(currentStatus).label}" to "${targetDestinationStatus}"!`);
      setTransitionComment('');
      setIsTransitionFormOpen(false);

      if (onStatusUpdated && updatedEntity) {
        onStatusUpdated(updatedEntity);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Error executing status transition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentMeta = getStatusMeta(currentStatus);
  const CurrentIcon = currentMeta.icon;

  return (
    <div className="space-y-4">
      {/* Top Status & Transition Control Card */}
      <div className="bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Current Pipeline Stage
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-[10px] font-mono text-slate-500 font-semibold">{currentItem?.id}</span>
            </div>

            <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${currentMeta.bg} ${currentMeta.text} ${currentMeta.border}`}
              >
                <CurrentIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{currentMeta.label}</span>
              </span>

              <span className="text-xs text-slate-500">
                Candidate: <strong className="text-slate-800 font-semibold">{currentItem?.name}</strong>
              </span>
            </div>
          </div>

          {/* Quick Action Button to Open Transition Form */}
          <button
            type="button"
            onClick={() => {
              setIsTransitionFormOpen(!isTransitionFormOpen);
              setSubmitError(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isTransitionFormOpen
                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                : 'bg-[#181E54] hover:bg-[#121642] text-white ring-2 ring-[#181E54]/20'
            }`}
          >
            <Plus className={`w-4 h-4 transition-transform ${isTransitionFormOpen ? 'rotate-45' : ''}`} />
            <span>{isTransitionFormOpen ? 'Cancel Update' : 'Log Status Transition'}</span>
          </button>
        </div>

        {/* Status Transition Action Form Drawer */}
        {isTransitionFormOpen && (
          <form
            onSubmit={handleStatusSubmit}
            className="mt-4 pt-4 border-t border-slate-200/80 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center gap-2 pb-1">
              <Sparkles className="w-4 h-4 text-[#D81124]" />
              <h4 className="text-xs font-bold text-[#181E54] uppercase tracking-wider">
                Record New Status Transition
              </h4>
            </div>

            {submitError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#D81124]" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Previous Status (Read-only reference) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Previous Status (Source)
                </label>
                <div className="px-3 py-2 bg-slate-100/90 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${currentMeta.text.replace('text-', 'bg-')}`} />
                  <span>{currentMeta.label}</span>
                </div>
              </div>

              {/* Target New Status */}
              <div>
                <label className="block text-[11px] font-bold text-[#181E54] mb-1">
                  New Status (Destination) <span className="text-[#D81124]">*</span>
                </label>
                <select
                  value={selectedBaseStatus}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedBaseStatus(val);
                    if (val === 'Follow up') {
                      setFollowUpAmount(nextFollowUpNumber);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54] cursor-pointer"
                >
                  <option value="WP Connect">WP Connect</option>
                  <option value="CV Collect">CV Collect</option>
                  <option value="Service">Service</option>
                  <option value="Follow up">
                    Follow up {nextFollowUpNumber > 0 ? `(${nextFollowUpNumber})` : ''}
                  </option>
                  <option value="Payment Ready">Payment Ready</option>
                  <option value="Blank">Blank</option>
                </select>
              </div>
            </div>

            {/* Dynamic Follow-up Counter Widget */}
            {selectedBaseStatus === 'Follow up' && (
              <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    #{followUpAmount}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-900">
                      Follow up Session #{followUpAmount}
                    </div>
                    <div className="text-[10px] text-amber-700">
                      Amount increments on every follow-up session (1, 2, 3...)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-[11px] font-bold text-amber-900">
                    Follow-up Round:
                  </span>
                  <div className="flex items-center bg-white border border-amber-300 rounded-lg overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setFollowUpAmount((prev) => Math.max(1, prev - 1))}
                      className="px-2.5 py-1 text-slate-700 hover:bg-amber-100 font-bold text-xs transition-colors cursor-pointer select-none"
                      title="Decrease round (-1)"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={followUpAmount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1) {
                          setFollowUpAmount(val);
                        }
                      }}
                      className="w-12 text-center text-xs font-mono font-bold text-[#181E54] py-1 border-x border-amber-200 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFollowUpAmount((prev) => prev + 1)}
                      className="px-2.5 py-1 text-slate-700 hover:bg-amber-100 font-bold text-xs transition-colors cursor-pointer select-none"
                      title="Increase round (+1)"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Transition Preview Badge */}
            <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 text-[11px] font-medium">Transition Preview:</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border ${currentMeta.bg} ${currentMeta.text} ${currentMeta.border}`}>
                  {currentMeta.label}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D81124]" />
                <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border ${getStatusMeta(targetDestinationStatus).bg} ${getStatusMeta(targetDestinationStatus).text} ${getStatusMeta(targetDestinationStatus).border}`}>
                  {getStatusMeta(targetDestinationStatus).label}
                </span>
              </div>
            </div>

            {/* Transition Note / Comment */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Activity Details &amp; Operational Notes
              </label>
              <textarea
                rows={2}
                value={transitionComment}
                onChange={(e) => setTransitionComment(e.target.value)}
                placeholder="Detail reason for this status change (e.g. Spoke with candidate's father, confirmed age preference 25-28, follow up next week)..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#181E54] resize-none"
              />
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsTransitionFormOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-[#D81124] hover:bg-[#B80E1C] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Recording...' : 'Save Status Transition'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      {/* Filter & Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#181E54]" />
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Activity Timeline &amp; Transition History ({filteredActivities.length})
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search timeline..."
              className="pl-8 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#181E54]"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 text-[10px]">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white text-[#181E54] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('status_change')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                typeFilter === 'status_change'
                  ? 'bg-white text-[#181E54] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transitions
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('created')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                typeFilter === 'created'
                  ? 'bg-white text-[#181E54] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Created
            </button>
          </div>
        </div>
      </div>

      {/* Vertical Timeline Activity Stream */}
      {filteredActivities.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/80 border border-dashed border-slate-200 rounded-2xl space-y-2">
          <Clock className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-700">No activity records match your filter</p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Click &ldquo;Log Status Transition&rdquo; above to record the first workflow status update for this lead.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {filteredActivities.map((act, index) => {
            const isCreated = act.type === 'created';
            const prevMeta = act.previousStatus ? getStatusMeta(act.previousStatus) : null;
            const newMeta = getStatusMeta(act.newStatus);
            const StepIcon = newMeta.icon;
            const relativeTime = getRelativeTimeString(act.timestamp);

            return (
              <div key={act.id || index} className="relative group">
                {/* Timeline Node Point */}
                <div
                  className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 border-white shadow-xs flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isCreated
                      ? 'bg-indigo-600 text-white'
                      : act.newStatus === 'converted'
                      ? 'bg-teal-600 text-white'
                      : act.newStatus === 'trash'
                      ? 'bg-rose-600 text-white'
                      : 'bg-[#181E54] text-white'
                  }`}
                >
                  <StepIcon className="w-2.5 h-2.5" />
                </div>

                {/* Timeline Card */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-shadow space-y-2">
                  {/* Card Header: Transition Pill & Timestamp */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    {/* Status Transition Badge */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isCreated ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Plus className="w-3 h-3 text-indigo-500" />
                          <span>Lead Profile Created</span>
                        </span>
                      ) : prevMeta ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 border border-slate-200 text-slate-700">
                          <span className={`px-1.5 py-0.2 rounded font-bold ${prevMeta.bg} ${prevMeta.text}`}>
                            {prevMeta.label}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className={`px-1.5 py-0.2 rounded font-bold ${newMeta.bg} ${newMeta.text}`}>
                            {newMeta.label}
                          </span>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${newMeta.bg} ${newMeta.text} ${newMeta.border}`}>
                          <StepIcon className="w-3 h-3" />
                          <span>{newMeta.label}</span>
                        </span>
                      )}

                      {act.type === 'converted' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                          Promoted to Traffic
                        </span>
                      )}
                    </div>

                    {/* Timestamp with Relative Time Tag */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{act.formattedDate || '—'}</span>
                      {relativeTime && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-medium">
                          {relativeTime}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comment / Note Box */}
                  {act.comment && (
                    <div className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-100 text-xs text-slate-800 leading-relaxed font-normal">
                      <div className="flex items-start gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="break-words">{act.comment}</span>
                      </div>
                    </div>
                  )}

                  {/* User Attribution Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#181E54]/10 text-[#181E54] flex items-center justify-center font-bold text-[9px]">
                        {act.user?.name ? act.user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-slate-700 font-semibold">
                        {act.user?.name || 'Authorized Staff'}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider uppercase ${
                          act.user?.role === 'Super Admin'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : act.user?.role === 'CRO'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-purple-100 text-purple-800 border border-purple-300'
                        }`}
                      >
                        {act.user?.role || 'Staff'}
                      </span>
                    </div>

                    {act.user?.phone && (
                      <span className="text-slate-400 font-mono text-[10px]">
                        {act.user.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
