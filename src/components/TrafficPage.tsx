import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Calendar,
  User,
  MoreVertical,
  Eye,
  ArrowRightLeft,
  Trash2,
  X,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { TrafficProfileModal } from './TrafficProfileModal';
import { TransferModal } from './TransferModal';
import { AddTrafficModal, AddTrafficModalProps } from './AddTrafficModal';
import { CountryFlag, detectCountryIso } from './CountryFlag';
import { ActionPortalMenu } from './ActionPortalMenu';
export { AddTrafficModal };
export type { AddTrafficModalProps };

interface TrafficPageProps {
  token: string;
}

interface TrafficTableRowProps {
  row: any;
  isMenuActive: boolean;
  onView: (row: any) => void;
  onToggleMenu: (row: any, e: React.MouseEvent<HTMLButtonElement>) => void;
}

const TrafficTableRow = React.memo<TrafficTableRowProps>(
  ({ row, isMenuActive, onView, onToggleMenu }) => {
    return (
      <tr className="hover:bg-slate-50/90 transition-colors group">
        {/* 1. Serial Number */}
        <td className="py-2 px-3.5 font-mono font-semibold text-slate-600 w-16">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono">
            {row.serialNumber}
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

        {/* 3. Name with integrated Rounded Profile Picture */}
        <td className="py-2 px-3.5">
          <div className="flex items-center gap-3">
            {/* Rounded Thumbnail */}
            <button
              type="button"
              onClick={() => onView(row)}
              className="relative shrink-0 group/avatar cursor-pointer focus:outline-none"
              title={`View ${row.name}'s profile and photos`}
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

            {/* Name, Package Badge, and Qualification */}
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                <span
                  onClick={() => onView(row)}
                  className="cursor-pointer hover:text-[#D81124] transition-colors truncate max-w-[140px] sm:max-w-[200px]"
                  title="View Profile"
                >
                  {row.name}
                </span>
                {row.package && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    {row.package}
                  </span>
                )}
              </div>
              {(row.profession || row.qualification) && (
                <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[160px] sm:max-w-xs">
                  {[row.profession, row.qualification].filter(Boolean).join(' • ')}
                </div>
              )}
            </div>
          </div>
        </td>

        {/* 4. Created By (The CRM Account Person who added this candidate) */}
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
            ></span>
            {row.gender || 'Not specified'}
          </span>
        </td>

        {/* 6. Phone */}
        <td className="py-2 px-3.5 w-36">
          <div className="flex items-center gap-1.5 font-mono text-slate-800 text-xs font-medium">
            <CountryFlag iso={detectCountryIso(row.phone)} className="w-4 h-3" />
            <span>{row.phone}</span>
          </div>
        </td>

        {/* 7. Functional 3-dot Action Menu Trigger */}
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

export const TrafficPage: React.FC<TrafficPageProps> = ({ token }) => {
  const [traffics, setTraffics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters required:
  // 1. Manual search option
  // 2. By date filtering option
  // 3. CRO Role Account based filtering option
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [croFilter, setCroFilter] = useState('');

  // CRO accounts list for the filter
  const [croAccounts, setCroAccounts] = useState<any[]>([]);

  // Modals state management
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTraffic, setEditingTraffic] = useState<any | null>(null);
  const [viewingTraffic, setViewingTraffic] = useState<any | null>(null);
  const [transferringTraffic, setTransferringTraffic] = useState<any | null>(null);
  const [removingTraffic, setRemovingTraffic] = useState<any | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [activeMenuRow, setActiveMenuRow] = useState<any | null>(null);
  const [menuTriggerRect, setMenuTriggerRect] = useState<DOMRect | null>(null);
  const [actionToast, setActionToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch Traffics
  const loadTraffics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/traffic', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load traffic records');
      const data = await response.json();
      setTraffics(data);
    } catch (err: any) {
      setError(err.message || 'Error loading traffic');
    } finally {
      setLoading(false);
    }
  };

  // Fetch CRO Accounts
  useEffect(() => {
    fetch('/api/users?role=CRO', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCroAccounts(data);
      })
      .catch((err) => console.error('Failed to load CRO accounts', err));

    loadTraffics();
  }, [token]);

  // Handle Remove traffic (moves to Trash bin)
  const confirmRemoveTraffic = async () => {
    if (!removingTraffic) return;
    setIsRemoving(true);

    try {
      const response = await fetch(`/api/traffic/${removingTraffic.id}/remove`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to move traffic record to Trash bin');

      setActionToast({
        type: 'success',
        message: `Candidate "${removingTraffic.name}" (${removingTraffic.id}) moved to Trash bin.`,
      });
      setRemovingTraffic(null);
      loadTraffics();
    } catch (err: any) {
      setActionToast({
        type: 'error',
        message: err.message || 'Failed to remove candidate',
      });
    } finally {
      setIsRemoving(false);
      setActiveMenuRow(null);
    }
  };

  // Filtered & sequentially ordered records
  const filteredTraffics = useMemo(() => {
    return traffics
      .filter((item) => {
        // 1. Manual search: Name, Phone, ID, Email
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = item.name?.toLowerCase().includes(q);
          const matchPhone = item.phone?.toLowerCase().includes(q);
          const matchId = item.id?.toLowerCase().includes(q);
          const matchEmail = item.email?.toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchId && !matchEmail) return false;
        }

        // 2. By date filtering
        if (dateFilter) {
          if (item.createdAt !== dateFilter) return false;
        }

        // 3. CRO Role Account based filtering
        if (croFilter) {
          const assignedName = item.assignedTo?.name;
          if (assignedName !== croFilter) return false;
        }

        return true;
      })
      .sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0)); // Strictly sequential
  }, [traffics, searchQuery, dateFilter, croFilter]);

  // Memoized action handlers to prevent re-rendering table rows
  const handleViewTraffic = React.useCallback((row: any) => {
    setActiveMenuRow(null);
    setViewingTraffic(row);
  }, []);

  const handleTransferTraffic = React.useCallback((row: any) => {
    setActiveMenuRow(null);
    setTransferringTraffic(row);
  }, []);

  const handleRemoveTraffic = React.useCallback((row: any) => {
    setActiveMenuRow(null);
    setRemovingTraffic(row);
  }, []);

  const handleToggleMenu = React.useCallback(
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
          <h1 className="text-xl sm:text-2xl font-bold text-[#181E54]">Traffic</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage matrimonial client inquiries and traffic registration
          </p>
        </div>

        {/* TOP RIGHT Button: Add Traffic */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#D81124] hover:bg-[#B80E1C] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Traffic</span>
        </button>
      </div>

      {/* FILTER CONTROLS: EXACTLY 3 FILTERS */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* 1. Manual search option */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, email, ID..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
            />
          </div>

          {/* 2. By date filtering option */}
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
            />
          </div>

          {/* 3. CRO Role Account based filtering option */}
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={croFilter}
              onChange={(e) => setCroFilter(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54] appearance-none"
            >
              <option value="">All CRO Accounts</option>
              {croAccounts.map((cro) => (
                <option key={cro.id} value={cro.name}>
                  {cro.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear filters shortcut */}
        {(searchQuery || dateFilter || croFilter) && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">
              Showing filtered results ({filteredTraffics.length} of {traffics.length})
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDateFilter('');
                setCroFilter('');
              }}
              className="text-[#D81124] hover:underline font-medium cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* TRAFFIC TABLE */}
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
                <th className="py-2.5 px-3.5 font-semibold text-right w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#181E54] border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading traffic records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTraffics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <p className="text-sm font-medium text-slate-600">No traffic records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {traffics.length === 0
                        ? 'Click "Add Traffic" above to create your first matrimonial candidate record.'
                        : 'No traffic matches the selected filter criteria.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTraffics.map((row) => (
                  <TrafficTableRow
                    key={row.id}
                    row={row}
                    isMenuActive={activeMenuRow?.id === row.id}
                    onView={handleViewTraffic}
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
        title={activeMenuRow ? `Actions: ${activeMenuRow.name}` : undefined}
        items={[
          {
            label: 'View Profile',
            sublabel: 'View candidate profile and all uploaded photos',
            icon: <Eye className="w-4 h-4 text-[#181E54]" />,
            onClick: () => handleViewTraffic(activeMenuRow),
          },
          {
            label: 'Transfer',
            sublabel: 'Reassign traffic to another CRO account',
            icon: <ArrowRightLeft className="w-4 h-4 text-blue-600" />,
            onClick: () => handleTransferTraffic(activeMenuRow),
          },
          {
            label: 'Remove',
            sublabel: 'Move candidate to Trash bin',
            icon: <Trash2 className="w-4 h-4 text-[#D81124]" />,
            variant: 'danger',
            onClick: () => handleRemoveTraffic(activeMenuRow),
          },
        ]}
      />

      {/* Add Traffic Modal */}
      <AddTrafficModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmitSuccess={loadTraffics}
        token={token}
      />

      {/* Edit Traffic Modal */}
      {editingTraffic && (
        <AddTrafficModal
          isOpen={!!editingTraffic}
          onClose={() => setEditingTraffic(null)}
          onSubmitSuccess={loadTraffics}
          initialData={editingTraffic}
          token={token}
        />
      )}

      {/* View Profile Modal */}
      <TrafficProfileModal
        isOpen={!!viewingTraffic}
        onClose={() => setViewingTraffic(null)}
        traffic={viewingTraffic}
        onEdit={(trafficToEdit) => setEditingTraffic(trafficToEdit)}
      />

      {/* Transfer Modal */}
      <TransferModal
        isOpen={!!transferringTraffic}
        onClose={() => setTransferringTraffic(null)}
        traffic={transferringTraffic}
        token={token}
        onTransferSuccess={loadTraffics}
      />

      {/* Move to Trash Bin Confirmation Modal */}
      {removingTraffic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 transition-opacity duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 bg-red-50 border border-red-200 text-[#D81124] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[#181E54]">Move to Trash Bin</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to remove candidate <strong className="text-slate-800 font-semibold">{removingTraffic.name}</strong> (ID: <span className="font-mono text-[#181E54] font-medium">{removingTraffic.id}</span>)?
            </p>
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5 mt-3 text-left">
              ⚠️ The candidate profile will be moved to the Trash bin and can be restored or managed from the Trash section.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setRemovingTraffic(null)}
                disabled={isRemoving}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveTraffic}
                disabled={isRemoving}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#D81124] hover:bg-[#B80E1C] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isRemoving ? 'Moving to Trash...' : 'Move to Trash Bin'}</span>
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
