import React, { useState, useMemo } from 'react';
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
  lead: any;
  token: string;
  onStatusUpdated?: (updatedLead: any) => void;
  compact?: boolean;
}

export const LEAD_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
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
  'follow-up': {
    label: 'Follow-Up',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: Clock,
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

export function getStatusMeta(status: string = 'active') {
  const normalized = (status || 'active').toLowerCase();
  return (
    LEAD_STATUS_CONFIG[normalized] || {
      label: status || 'Active',
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
  token,
  onStatusUpdated,
  compact = false,
}) => {
  const currentStatus = lead?.status || 'active';
  const activities: ActivityLogItem[] = useMemo(() => {
    return Array.isArray(lead?.activityLog) ? lead.activityLog : [];
  }, [lead?.activityLog]);

  // Form states for status transition
  const [isTransitionFormOpen, setIsTransitionFormOpen] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<string>('contacted');
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
    if (!lead?.id || !selectedNewStatus) return;

    if (selectedNewStatus === currentStatus) {
      setSubmitError(`Lead is already in "${getStatusMeta(currentStatus).label}" status. Select a different status to record a transition.`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setActionSuccess(null);

    try {
      const response = await fetch(`/api/leads/${lead.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: selectedNewStatus,
          comment: transitionComment.trim(),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update lead status');
      }

      const data = await response.json();
      setActionSuccess(`Status successfully transitioned from "${currentStatus}" to "${selectedNewStatus}"!`);
      setTransitionComment('');
      setIsTransitionFormOpen(false);

      if (onStatusUpdated && data.lead) {
        onStatusUpdated(data.lead);
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
              <span className="text-[10px] font-mono text-slate-500 font-semibold">{lead?.id}</span>
            </div>

            <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${currentMeta.bg} ${currentMeta.text} ${currentMeta.border}`}
              >
                <CurrentIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{currentMeta.label}</span>
              </span>

              <span className="text-xs text-slate-500">
                Candidate: <strong className="text-slate-800 font-semibold">{lead?.name}</strong>
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
                  value={selectedNewStatus}
                  onChange={(e) => setSelectedNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="active">Active Lead (New Inquiry)</option>
                  <option value="contacted">Contacted (Candidate / Guardian)</option>
                  <option value="in-progress">In Progress (Biodata Review)</option>
                  <option value="qualified">Qualified (Matching Ready)</option>
                  <option value="negotiation">Negotiation (Package & Terms)</option>
                  <option value="follow-up">Follow-Up (Scheduled)</option>
                  <option value="on-hold">On Hold (Postponed by Candidate)</option>
                  <option value="converted">Converted (Transfer to Traffic)</option>
                  <option value="trash">Trash (Disqualified / Removed)</option>
                </select>
              </div>
            </div>

            {/* Transition Preview Badge */}
            <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 text-[11px] font-medium">Transition Preview:</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border ${currentMeta.bg} ${currentMeta.text} ${currentMeta.border}`}>
                  {currentMeta.label}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D81124]" />
                <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border ${getStatusMeta(selectedNewStatus).bg} ${getStatusMeta(selectedNewStatus).text} ${getStatusMeta(selectedNewStatus).border}`}>
                  {getStatusMeta(selectedNewStatus).label}
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
