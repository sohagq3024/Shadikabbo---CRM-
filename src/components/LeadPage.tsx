import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Calendar,
  User,
  MoreVertical,
  Eye,
  ArrowRight,
  Trash2,
  Star,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Zap,
  Clock,
  X,
} from 'lucide-react';
import { AddLeadModal, PROFESSIONS } from './AddLeadModal';
import { ConvertTrafficModal } from './ConvertTrafficModal';
import { LeadProfileModal } from './LeadProfileModal';
import { CountryFlag, detectCountryIso } from './CountryFlag';
import { ActionPortalMenu } from './ActionPortalMenu';
import { getStatusMeta } from './ActivityLog';
import { useCrmFields } from '../context/CrmFieldsContext';
import { CategoryBadgeSelector, QualityCategory } from './CategoryBadgeSelector';

interface LeadPageProps {
  token: string;
  user?: any;
}

interface LeadTableRowProps {
  row: any;
  index: number;
  isMenuActive: boolean;
  token: string;
  onView: (row: any) => void;
  onViewActivity: (row: any) => void;
  onCategoryChange: (rowId: string, newCategory: QualityCategory) => void;
  onToggleMenu: (row: any, e: React.MouseEvent<HTMLButtonElement>) => void;
}

const renderSourceBadge = (category?: string) => {
  const cat = category || 'FB Message';
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-500';

  if (cat === 'FB Message') {
    badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
    dotColor = 'bg-blue-600';
  } else if (cat === 'FB Call') {
    badgeStyle = 'bg-cyan-50 text-cyan-700 border-cyan-200';
    dotColor = 'bg-cyan-600';
  } else if (cat === 'FB Comment') {
    badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    dotColor = 'bg-indigo-600';
  } else if (cat === 'Call center') {
    badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
    dotColor = 'bg-purple-600';
  } else if (cat === 'Reference') {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-600';
  } else if (cat === 'Others source') {
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-600';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border shadow-2xs ${badgeStyle}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`} />
      <span className="truncate max-w-[105px]">{cat}</span>
    </span>
  );
};

const LeadTableRow = React.memo<LeadTableRowProps>(
  ({ row, index, isMenuActive, token, onView, onViewActivity, onCategoryChange, onToggleMenu }) => {
    const completeness = typeof row.completeness === 'number' ? row.completeness : 0;
    const stars = typeof row.stars === 'number' ? row.stars : (completeness < 20 ? 0 : Math.min(5, Math.floor(completeness / 20)));
    const statusMeta = getStatusMeta(row.status || 'active');
    const StatusIcon = statusMeta.icon;
    const activityCount = Array.isArray(row.activityLog) ? row.activityLog.length : 1;

    return (
      <tr className="hover:bg-slate-50/90 transition-colors group">
        {/* 1. Serial Number */}
        <td className="py-2 px-2.5 sm:px-3 font-mono font-semibold text-slate-600 w-14">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono">
            {row.serialNumber || index + 1}
          </span>
        </td>

        {/* 2. ID & Date */}
        <td className="py-2 px-2.5 sm:px-3 w-32">
          <div className="font-mono font-bold text-[#181E54] text-xs">{row.id}</div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 whitespace-nowrap">
            <Calendar className="w-2.5 h-2.5 text-slate-400 shrink-0" />
            <span>{row.createdAt || 'N/A'}</span>
          </div>
        </td>

        {/* 3. Name with Integrated Rounded Profile Picture */}
        <td className="py-2 px-2.5 sm:px-3">
          <div className="flex items-center gap-2.5">
            {/* Rounded Thumbnail */}
            <button
              type="button"
              onClick={() => onView(row)}
              className="relative shrink-0 group/avatar cursor-pointer focus:outline-none"
              title={`View ${row.name}'s lead profile`}
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-slate-200/90 shadow-2xs group-hover/avatar:ring-2 group-hover/avatar:ring-[#181E54]/25 transition-all bg-slate-100 flex items-center justify-center">
                {row.images && row.images.length > 0 ? (
                  <img
                    src={row.images[0]}
                    alt={row.name}
                    className="w-full h-full object-cover group-hover/avatar:scale-105 transition-transform"
                  />
                ) : (
                  <div
                    className={`w-full h-full flex flex-col items-center justify-center ${
                      row.gender?.toLowerCase() === 'female'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    <User className="w-4 h-4 opacity-60" />
                  </div>
                )}
              </div>
              {row.images && row.images.length > 1 && (
                <span className="absolute -bottom-0.5 -right-0.5 bg-[#181E54] text-white text-[8px] font-bold px-1 py-0.5 rounded-full border border-white shadow-2xs">
                  +{row.images.length - 1}
                </span>
              )}
            </button>

            {/* Name & Profession */}
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                <span
                  onClick={() => onView(row)}
                  className="cursor-pointer hover:text-[#D81124] transition-colors truncate max-w-[140px] sm:max-w-[180px]"
                  title="View Profile"
                >
                  {row.name}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[160px] sm:max-w-xs">
                {[row.profession, row.qualification].filter(Boolean).join(' • ') || 'Initial Contact'}
              </div>
            </div>
          </div>
        </td>

        {/* 4. Status with Activity Transition Link */}
        <td className="py-2 px-2.5 sm:px-3 w-32">
          <button
            type="button"
            onClick={() => onViewActivity(row)}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all hover:scale-105 cursor-pointer shadow-2xs ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
            title="Click to view Activity Log & record status transition"
          >
            <StatusIcon className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[90px]">{statusMeta.label}</span>
          </button>
          <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1 pl-1">
            <Clock className="w-2.5 h-2.5 text-slate-400" />
            <span>{activityCount} {activityCount === 1 ? 'activity' : 'activities'}</span>
          </div>
        </td>

        {/* 5. Category (Quality Category selector: Normal, Average, Potential, Very potential) */}
        <td className="py-2 px-2.5 sm:px-3 w-32">
          <CategoryBadgeSelector
            category={row.clientCategory || 'Normal'}
            itemId={row.id}
            type="lead"
            token={token}
            onCategoryChanged={(newCat) => onCategoryChange(row.id, newCat)}
          />
        </td>

        {/* 6. Created By (The CRM Account Person who added this lead) */}
        <td className="py-2 px-2.5 sm:px-3 w-32">
          <div className="font-semibold text-[#181E54] text-xs truncate">
            {row.createdBy || 'Sohag'}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            Role: {row.creatorRole || 'Super Admin'}
          </div>
        </td>

        {/* 7. Source */}
        <td className="py-2 px-2.5 sm:px-3 w-28">
          {renderSourceBadge(row.category)}
        </td>

        {/* 6. Phone */}
        <td className="py-2 px-2.5 sm:px-3 w-32">
          <div className="flex items-center gap-1 font-mono text-slate-800 text-xs font-medium">
            <CountryFlag iso={detectCountryIso(row.phone)} className="w-3.5 h-2.5 rounded-xs" />
            <span>{row.phone}</span>
          </div>
        </td>

        {/* 7. Info Level (5 Stars & Percentage Progress Bar) */}
        <td className="py-2 px-2.5 sm:px-3 w-32">
          <div className="space-y-1">
            {/* Stars & Percentage Badge */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-0.5" title={`Info Score: ${stars}/5 Stars`}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-2.5 h-2.5 ${
                      s <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="px-1 py-0.2 rounded font-mono font-bold text-[9px] bg-slate-100 text-[#181E54] border border-slate-200/80">
                {completeness}%
              </span>
            </div>

            {/* Visual Animated Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 bg-[#181E54]"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        </td>

        {/* 8. Functional 3-dot Action Menu Trigger */}
        <td className="py-2 px-2.5 sm:px-3 text-right w-16 relative">
          <button
            type="button"
            onClick={(e) => onToggleMenu(row, e)}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isMenuActive
                ? 'bg-[#181E54] text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title="Actions"
            aria-label="Actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </td>
      </tr>
    );
  }
);

export const LeadPage: React.FC<LeadPageProps> = ({ token, user }) => {
  const isSuperAdmin = !user || user.role === 'Super Admin';
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters required:
  // 1. Manual search
  // 2. Profession
  // 3. Status filtering
  // 4. Quality Category filtering (Normal, Average, Potential, Very potential)
  // 5. Source filtering
  // 6. Date filtering
  const { fields } = useCrmFields();
  const [searchQuery, setSearchQuery] = useState('');
  const [professionFilter, setProfessionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Menu State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [viewingLead, setViewingLead] = useState<any | null>(null);
  const [profileInitialTab, setProfileInitialTab] = useState<'overview' | 'activity'>('overview');
  const [convertingLead, setConvertingLead] = useState<any | null>(null);
  const [removingLead, setRemovingLead] = useState<any | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [activeMenuRow, setActiveMenuRow] = useState<any | null>(null);
  const [menuTriggerRect, setMenuTriggerRect] = useState<DOMRect | null>(null);
  const [actionToast, setActionToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch Leads
  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/leads', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load matrimonial leads');
      const data = await response.json();
      setLeads(data);
    } catch (err: any) {
      setError(err.message || 'Error loading leads');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Handle lead update (e.g. status transition or edit)
  const handleLeadUpdated = useCallback((updatedLead: any) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? { ...l, ...updatedLead } : l))
    );
    if (viewingLead && viewingLead.id === updatedLead.id) {
      setViewingLead((prev: any) => ({ ...prev, ...updatedLead }));
    }
    setActionToast({
      type: 'success',
      message: `Lead ${updatedLead.id} status updated to "${updatedLead.status}"`,
    });
  }, [viewingLead]);

  // Handle Quality Category direct update
  const handleCategoryChange = useCallback((rowId: string, newCategory: QualityCategory) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === rowId ? { ...l, clientCategory: newCategory } : l))
    );
    if (viewingLead && viewingLead.id === rowId) {
      setViewingLead((prev: any) => ({ ...prev, clientCategory: newCategory }));
    }
    setActionToast({
      type: 'success',
      message: `Candidate Category updated to "${newCategory}"`,
    });
  }, [viewingLead]);

  // Handle Move to Trash
  const confirmRemoveLead = async () => {
    if (!removingLead) return;
    setIsRemoving(true);
    try {
      const response = await fetch(`/api/leads/${removingLead.id}/remove`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to move lead to Trash bin');

      setActionToast({
        type: 'success',
        message: `Lead "${removingLead.name}" (${removingLead.id}) moved to Trash bin.`,
      });
      setRemovingLead(null);
      loadLeads();
    } catch (err: any) {
      setActionToast({
        type: 'error',
        message: err.message || 'Failed to remove lead',
      });
    } finally {
      setIsRemoving(false);
      setActiveMenuRow(null);
    }
  };

  // Filtered & sequentially ordered leads
  const filteredLeads = useMemo(() => {
    return leads
      .filter((item) => {
        // 1. Manual search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = item.name?.toLowerCase().includes(q);
          const matchPhone = item.phone?.toLowerCase().includes(q);
          const matchId = item.id?.toLowerCase().includes(q);
          const matchEmail = item.email?.toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchId && !matchEmail) return false;
        }

        // 2. Profession
        if (professionFilter && item.profession !== professionFilter) {
          return false;
        }

        // 3. Date filtering
        if (dateFilter && item.createdAt !== dateFilter) {
          return false;
        }

        // 4. Quality Category filtering (Normal, Average, Potential, Very potential)
        if (categoryFilter) {
          const itemCat = String(item.clientCategory || 'Normal').toLowerCase();
          if (itemCat !== categoryFilter.toLowerCase()) return false;
        }

        // 5. Source filtering
        if (sourceFilter && (item.category || 'FB Message') !== sourceFilter) {
          return false;
        }

        // 6. Status filtering
        if (statusFilter) {
          const itemStatus = String(item.status || 'Blank').toLowerCase();
          const target = statusFilter.toLowerCase();
          if (target === 'follow up') {
            if (!itemStatus.includes('follow up') && !itemStatus.includes('follow-up')) {
              return false;
            }
          } else if (itemStatus !== target) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0));
  }, [leads, searchQuery, professionFilter, dateFilter, categoryFilter, sourceFilter, statusFilter]);

  // Memoized action handlers
  const handleViewLead = useCallback((row: any) => {
    setActiveMenuRow(null);
    setProfileInitialTab('overview');
    setViewingLead(row);
  }, []);

  const handleOpenActivityLog = useCallback((row: any) => {
    setActiveMenuRow(null);
    setProfileInitialTab('activity');
    setViewingLead(row);
  }, []);

  const handleEditLead = useCallback((row: any) => {
    setActiveMenuRow(null);
    setEditingLead(row);
  }, []);

  const handleConvertLead = useCallback((row: any) => {
    setActiveMenuRow(null);
    setConvertingLead(row);
  }, []);

  const handleRemoveLead = useCallback((row: any) => {
    setActiveMenuRow(null);
    setRemovingLead(row);
  }, []);

  const handleToggleMenu = useCallback(
    (row: any, e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      setActiveMenuRow((prev: any) => {
        if (prev?.id === row.id) {
          setMenuTriggerRect(null);
          return null;
        }
        setMenuTriggerRect(rect);
        return row;
      });
    },
    []
  );

  return (
    <div className="space-y-4">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#181E54]">Lead</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage matrimonial client inquiries and initial lead registration
          </p>
        </div>

        {/* TOP RIGHT Button: Add Lead */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#D81124] hover:bg-[#B80E1C] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Lead</span>
        </button>
      </div>

      {/* FILTER CONTROLS: Manual search, Profession, Status, Gender, Date */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
          {/* 1. Manual search option */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, email, ID..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
            />
          </div>

          {/* 2. Profession filtering */}
          <div>
            <select
              value={professionFilter}
              onChange={(e) => setProfessionFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
            >
              <option value="">All Professions</option>
              {PROFESSIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Pipeline Status filtering */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
            >
              <option value="">All Statuses</option>
              <option value="WP Connect">WP Connect</option>
              <option value="CV Collect">CV Collect</option>
              <option value="Service">Service</option>
              <option value="Follow up">Follow up</option>
              <option value="Payment Ready">Payment Ready</option>
              <option value="Blank">Blank</option>
            </select>
          </div>

          {/* 4. Quality Category filtering (Normal, Average, Potential, Very potential) */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
            >
              <option value="">All Categories</option>
              <option value="Normal">Normal</option>
              <option value="Average">Average</option>
              <option value="Potential">Potential</option>
              <option value="Very potential">Very potential</option>
            </select>
          </div>

          {/* 5. Source filtering */}
          <div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
            >
              <option value="">All Sources</option>
              {(fields.leadCategories || [
                'FB Message',
                'FB Call',
                'FB Comment',
                'Call center',
                'Reference',
                'Others source',
              ]).map((c: string) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Date filtering option */}
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                aria-label="Clear date filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Clear filters shortcut */}
        {(searchQuery || professionFilter || statusFilter || dateFilter || categoryFilter || sourceFilter) && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">
              Showing filtered results ({filteredLeads.length} of {leads.length})
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setProfessionFilter('');
                setStatusFilter('');
                setDateFilter('');
                setCategoryFilter('');
                setSourceFilter('');
              }}
              className="text-[#D81124] hover:underline font-medium cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Leads Table Container (Color & Style matching TrafficPage) */}
      <div className="-mt-1 sm:-mt-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs border-b border-red-100">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1050px]">
            <thead className="bg-[#181E54] text-white uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-2.5 sm:px-3 font-semibold w-14">Serial</th>
                <th className="py-2.5 px-2.5 sm:px-3 font-semibold w-32">ID &amp; Date</th>
                <th className="py-2.5 px-2.5 sm:px-3 font-semibold min-w-[170px]">Name</th>
                <th className="py-2.5 px-2.5 sm:px-3 font-semibold w-32">Status</th>
                <th className="py-2.5 px-2.5 sm:px-3 font-semibold w-32">Category</th>
                <th className="py-2.5 px-2.5 sm:px-3 font-semibold w-32">Created By</th>
                <th className="py-2.5 px-2.5 sm:px-3 font-semibold w-28">Source</th>
                <th className="py-2.5 px-2.5 sm:px-3 font-semibold w-32">Phone</th>
                <th className="py-2.5 px-2.5 sm:px-3 font-semibold w-32">Info Level</th>
                <th className="py-2.5 px-2.5 sm:px-3 font-semibold text-right w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#181E54] border-t-transparent rounded-full animate-spin" />
                      <span>Loading matrimonial leads...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-600 mb-1">No leads found</p>
                    <p className="text-xs text-slate-400">
                      {leads.length === 0
                        ? 'Click "Add Lead" at top right to register your first inquiry.'
                        : 'No leads match your selected filter criteria.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((row, index) => (
                  <LeadTableRow
                    key={row.id}
                    row={row}
                    index={index}
                    isMenuActive={activeMenuRow?.id === row.id}
                    token={token}
                    onView={handleViewLead}
                    onViewActivity={handleOpenActivityLog}
                    onCategoryChange={handleCategoryChange}
                    onToggleMenu={handleToggleMenu}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Smart Portal-based 3-dot Action Popup Menu (never cut off by overflow or other elements) */}
      <ActionPortalMenu
        isOpen={!!activeMenuRow}
        onClose={() => {
          setActiveMenuRow(null);
          setMenuTriggerRect(null);
        }}
        triggerRect={menuTriggerRect}
        title={activeMenuRow ? `Lead: ${activeMenuRow.name}` : undefined}
        items={[
          {
            label: 'View Profile',
            sublabel: 'View bio & details',
            icon: <Eye className="w-4 h-4 text-[#181E54]" />,
            onClick: () => handleViewLead(activeMenuRow),
          },
          {
            label: 'Activity Log',
            sublabel: 'Status transitions & history',
            icon: <Clock className="w-4 h-4 text-indigo-600" />,
            onClick: () => handleOpenActivityLog(activeMenuRow),
          },
          {
            label: 'Convert to Client',
            sublabel: 'Promote lead to full Client candidate',
            icon: <Sparkles className="w-4 h-4 text-amber-600" />,
            onClick: () => handleConvertLead(activeMenuRow),
          },
          ...(isSuperAdmin
            ? [
                {
                  label: 'Move to Trash',
                  sublabel: 'Move lead to Trash bin',
                  icon: <Trash2 className="w-4 h-4 text-[#D81124]" />,
                  variant: 'danger' as const,
                  onClick: () => handleRemoveLead(activeMenuRow),
                },
              ]
            : []),
        ]}
      />

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmitSuccess={loadLeads}
        token={token}
      />

      {/* Edit Lead Modal (Super Admin only) */}
      {isSuperAdmin && editingLead && (
        <AddLeadModal
          isOpen={!!editingLead}
          onClose={() => setEditingLead(null)}
          onSubmitSuccess={loadLeads}
          initialData={editingLead}
          token={token}
        />
      )}

      {/* View Lead Profile Modal with Activity Log Tab Integration */}
      <LeadProfileModal
        isOpen={!!viewingLead}
        onClose={() => setViewingLead(null)}
        lead={viewingLead}
        token={token}
        initialTab={profileInitialTab}
        canEdit={isSuperAdmin}
        onStatusUpdated={handleLeadUpdated}
        onEdit={(leadToEdit) => setEditingLead(leadToEdit)}
        onConvert={(leadToConvert) => setConvertingLead(leadToConvert)}
      />

      {/* Convert to Client Modal */}
      <ConvertTrafficModal
        isOpen={!!convertingLead}
        onClose={() => setConvertingLead(null)}
        lead={convertingLead}
        token={token}
        onConversionSuccess={(newTraffic) => {
          loadLeads();
          setActionToast({
            type: 'success',
            message: `Lead successfully promoted into Client Candidate (${newTraffic.id})!`,
          });
        }}
      />

      {/* Move to Trash Confirmation Modal */}
      {removingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 transition-opacity duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 bg-red-50 border border-red-200 text-[#D81124] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[#181E54]">Move Lead to Trash Bin</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to move lead <strong className="text-slate-800 font-semibold">{removingLead.name}</strong> (ID: <span className="font-mono text-[#181E54] font-medium">{removingLead.id}</span>) to the Trash bin?
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setRemovingLead(null)}
                disabled={isRemoving}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveLead}
                disabled={isRemoving}
                className="px-5 py-2 bg-[#D81124] hover:bg-[#B80E1C] disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isRemoving ? 'Moving...' : 'Yes, Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Toast Notification */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-medium ${
              actionToast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-700'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {actionToast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#D81124] shrink-0" />
            )}
            <span>{actionToast.message}</span>
            <button
              type="button"
              onClick={() => setActionToast(null)}
              className="ml-2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
