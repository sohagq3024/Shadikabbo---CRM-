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
} from 'lucide-react';
import { AddLeadModal, PROFESSIONS } from './AddLeadModal';
import { ConvertTrafficModal } from './ConvertTrafficModal';
import { LeadProfileModal } from './LeadProfileModal';
import { CountryFlag, detectCountryIso } from './CountryFlag';
import { ActionPortalMenu } from './ActionPortalMenu';

interface LeadPageProps {
  token: string;
}

interface LeadTableRowProps {
  row: any;
  index: number;
  isMenuActive: boolean;
  onView: (row: any) => void;
  onToggleMenu: (row: any, e: React.MouseEvent<HTMLButtonElement>) => void;
}

const LeadTableRow = React.memo<LeadTableRowProps>(
  ({ row, index, isMenuActive, onView, onToggleMenu }) => {
    const completeness = typeof row.completeness === 'number' ? row.completeness : 0;
    const stars = typeof row.stars === 'number' ? row.stars : (completeness < 20 ? 0 : Math.min(5, Math.floor(completeness / 20)));

    return (
      <tr className="hover:bg-slate-50/90 transition-colors group">
        {/* 1. Serial Number */}
        <td className="py-2 px-3.5 font-mono font-semibold text-slate-600 w-16">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono">
            {row.serialNumber || index + 1}
          </span>
        </td>

        {/* 2. ID & Date */}
        <td className="py-2 px-3.5 w-36">
          <div className="font-mono font-bold text-[#181E54] text-xs">{row.id}</div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 whitespace-nowrap">
            <Calendar className="w-2.5 h-2.5 text-slate-400 shrink-0" />
            <span>{row.createdAt || 'N/A'}</span>
          </div>
        </td>

        {/* 3. Name with Integrated Rounded Profile Picture */}
        <td className="py-2 px-3.5">
          <div className="flex items-center gap-3">
            {/* Rounded Thumbnail */}
            <button
              type="button"
              onClick={() => onView(row)}
              className="relative shrink-0 group/avatar cursor-pointer focus:outline-none"
              title={`View ${row.name}'s lead profile`}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-slate-200/90 shadow-2xs group-hover/avatar:ring-2 group-hover/avatar:ring-[#181E54]/25 transition-all bg-slate-100 flex items-center justify-center">
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

        {/* 4. Created By (The CRM Account Person who added this lead) */}
        <td className="py-2 px-3.5 w-36">
          <div className="font-semibold text-[#181E54] text-xs truncate">
            {row.createdBy || 'Sohag'}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            Role: {row.creatorRole || 'Super Admin'}
          </div>
        </td>

        {/* 5. Gender */}
        <td className="py-2 px-3.5 w-24">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
              row.gender?.toLowerCase() === 'female'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                row.gender?.toLowerCase() === 'female' ? 'bg-rose-500' : 'bg-blue-500'
              }`}
            />
            {row.gender || 'Pending'}
          </span>
        </td>

        {/* 6. Phone */}
        <td className="py-2 px-3.5 w-36">
          <div className="flex items-center gap-1.5 font-mono text-slate-800 text-xs font-medium">
            <CountryFlag iso={detectCountryIso(row.phone)} className="w-4 h-3 rounded-xs" />
            <span>{row.phone}</span>
          </div>
        </td>

        {/* 7. Info Level (5 Stars & Percentage Progress Bar) */}
        <td className="py-2 px-3.5 w-40">
          <div className="space-y-1">
            {/* Stars & Percentage Badge */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-0.5" title={`Info Score: ${stars}/5 Stars`}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3 h-3 ${
                      s <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="px-1.5 py-0.5 rounded-md font-mono font-bold text-[10px] bg-slate-100 text-[#181E54] border border-slate-200/80">
                {completeness}%
              </span>
            </div>

            {/* Visual Animated Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 bg-[#181E54]"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        </td>

        {/* 8. Functional 3-dot Action Menu Trigger */}
        <td className="py-2 px-3.5 text-right w-20 relative">
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

export const LeadPage: React.FC<LeadPageProps> = ({ token }) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters required:
  // 1. Manual search
  // 2. Profession
  // 3. Date filtering
  // 4. Gender filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [professionFilter, setProfessionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Modals & Menu State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [viewingLead, setViewingLead] = useState<any | null>(null);
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

        // 4. Gender filtering
        if (genderFilter && item.gender !== genderFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0));
  }, [leads, searchQuery, professionFilter, dateFilter, genderFilter]);

  // Memoized action handlers
  const handleViewLead = useCallback((row: any) => {
    setActiveMenuRow(null);
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

      {/* FILTER CONTROLS: Manual search, Profession, Date filtering, Gender filtering */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
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

          {/* 3. Date filtering option */}
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
                className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* 4. Gender filtering */}
          <div>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        {/* Clear filters shortcut */}
        {(searchQuery || professionFilter || dateFilter || genderFilter) && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">
              Showing filtered results ({filteredLeads.length} of {leads.length})
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setProfessionFilter('');
                setDateFilter('');
                setGenderFilter('');
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
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead className="bg-[#181E54] text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold w-16">Serial Number</th>
                <th className="py-2.5 px-3.5 font-semibold w-36">ID &amp; Date</th>
                <th className="py-2.5 px-3.5 font-semibold">Name</th>
                <th className="py-2.5 px-3.5 font-semibold w-36">Created By</th>
                <th className="py-2.5 px-3.5 font-semibold w-24">Gender</th>
                <th className="py-2.5 px-3.5 font-semibold w-36">Phone</th>
                <th className="py-2.5 px-3.5 font-semibold w-40">Info Level</th>
                <th className="py-2.5 px-3.5 font-semibold text-right w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#181E54] border-t-transparent rounded-full animate-spin" />
                      <span>Loading matrimonial leads...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
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
                    onView={handleViewLead}
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
            sublabel: 'View bio & edit details',
            icon: <Eye className="w-4 h-4 text-[#181E54]" />,
            onClick: () => handleViewLead(activeMenuRow),
          },
          {
            label: 'Convert Traffic',
            sublabel: 'Promote lead to full Traffic candidate',
            icon: <Sparkles className="w-4 h-4 text-amber-600" />,
            onClick: () => handleConvertLead(activeMenuRow),
          },
          {
            label: 'Move to Trash',
            sublabel: 'Move lead to Trash bin',
            icon: <Trash2 className="w-4 h-4 text-[#D81124]" />,
            variant: 'danger',
            onClick: () => handleRemoveLead(activeMenuRow),
          },
        ]}
      />

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmitSuccess={loadLeads}
        token={token}
      />

      {/* Edit Lead Modal */}
      {editingLead && (
        <AddLeadModal
          isOpen={!!editingLead}
          onClose={() => setEditingLead(null)}
          onSubmitSuccess={loadLeads}
          initialData={editingLead}
          token={token}
        />
      )}

      {/* View Lead Profile Modal */}
      <LeadProfileModal
        isOpen={!!viewingLead}
        onClose={() => setViewingLead(null)}
        lead={viewingLead}
        onEdit={(leadToEdit) => setEditingLead(leadToEdit)}
        onConvert={(leadToConvert) => setConvertingLead(leadToConvert)}
      />

      {/* Convert to Traffic Modal */}
      <ConvertTrafficModal
        isOpen={!!convertingLead}
        onClose={() => setConvertingLead(null)}
        lead={convertingLead}
        token={token}
        onConversionSuccess={(newTraffic) => {
          loadLeads();
          setActionToast({
            type: 'success',
            message: `Lead successfully promoted into Traffic Candidate (${newTraffic.id})!`,
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
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
