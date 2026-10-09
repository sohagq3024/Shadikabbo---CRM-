import React, { useState, useEffect, useMemo } from 'react';
import { Search, MoreVertical, Eye, CreditCard, UserCheck, Trash2, User, FileText } from 'lucide-react';
import { TrafficProfileModal } from './TrafficProfileModal';
import { TrafficFormModal } from './TrafficFormModal';
import { CheckPaymentModal } from './CheckPaymentModal';
import { ChangeAssignModal } from './ChangeAssignModal';
import { CountryFlag, detectCountryIso } from './CountryFlag';
import { ActionPortalMenu } from './ActionPortalMenu';
import { InvoiceModal } from './InvoiceModal';
import { ErrorBoundary } from './ErrorBoundary';
import { useCrmFields } from '../context/CrmFieldsContext';

interface PaidTrafficPageProps {
  token: string;
  user?: any;
}

interface PaidTrafficTableRowProps {
  row: any;
  index: number;
  isMenuActive: boolean;
  onViewProfile: (row: any) => void;
  onToggleMenu: (row: any, e: React.MouseEvent<HTMLButtonElement>) => void;
}

const PaidTrafficTableRow = React.memo<PaidTrafficTableRowProps>(
  ({ row, index, isMenuActive, onViewProfile, onToggleMenu }) => {
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
          <div className="text-[10px] text-slate-500">{row.createdAt}</div>
        </td>

        {/* 3. Name with integrated Rounded Profile Picture */}
        <td className="py-2 px-2.5 sm:px-3">
          <div className="flex items-center gap-2.5">
            {/* Rounded Thumbnail */}
            <button
              type="button"
              onClick={() => onViewProfile(row)}
              className="relative shrink-0 group/avatar cursor-pointer focus:outline-none"
              title={`View ${row.name}'s profile and photos`}
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
                <span className="absolute -bottom-0.5 -right-0.5 bg-[#181E54] text-white text-[8px] font-bold px-1 py-0.2 rounded-full border border-white shadow-2xs">
                  +{row.images.length - 1}
                </span>
              )}
            </button>

            {/* Name & Profession */}
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onViewProfile(row)}
                className="font-bold text-slate-900 hover:text-[#D81124] transition-colors truncate block text-left cursor-pointer text-xs"
              >
                {row.name}
              </button>
              <span className="text-[11px] text-slate-500 block truncate">
                {row.profession || 'Professional'}
              </span>
            </div>
          </div>
        </td>

        {/* 4. Created By (Account person who added candidate into CRM) */}
        <td className="py-2 px-2.5 sm:px-3 w-32">
          <div className="font-semibold text-[#181E54] text-xs truncate">
            {row.createdBy || 'Sohag'}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            Role: {row.creatorRole || 'Super Admin'}
          </div>
        </td>

        {/* 5. Assign (Assigned MK Accounts - Supports Multiple Assign) */}
        <td className="py-2 px-2.5 sm:px-3 w-36">
          {Array.isArray(row.assignedMKs) && row.assignedMKs.length > 1 ? (
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-900 text-xs truncate max-w-[100px]">
                  {row.assignedMKs[0].name}
                </span>
                <span className="px-1 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                  +{row.assignedMKs.length - 1}
                </span>
              </div>
              <div
                className="text-[10px] text-emerald-700 font-semibold truncate max-w-[130px] mt-0.5"
                title={row.assignedMKs.map((m: any) => m.name).join(', ')}
              >
                Multi-MK
              </div>
            </div>
          ) : (
            <div>
              <div className="font-semibold text-slate-800 text-xs truncate">
                {row.assignedTo?.name || row.assignBy || 'General MK'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Role: {row.assignedTo?.role || 'MK'}
              </div>
            </div>
          )}
        </td>

        {/* 6. Phone */}
        <td className="py-2 px-2.5 sm:px-3 w-32">
          <div className="flex items-center gap-1 font-mono text-slate-700 text-xs">
            <CountryFlag iso={detectCountryIso(row.phone)} className="w-3.5 h-2.5" />
            <span>{row.phone}</span>
          </div>
        </td>

        {/* 7. Package */}
        <td className="py-2 px-2.5 sm:px-3 w-28">
          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#181E54]/10 text-[#181E54]">
            {row.package || 'Gold Package'}
          </span>
        </td>

        {/* 8. Action (3-dot menu trigger) */}
        <td className="py-2 px-2.5 sm:px-3 text-right w-16 relative">
          <button
            type="button"
            onClick={(e) => onToggleMenu(row, e)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isMenuActive
                ? 'bg-[#181E54] text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title="Actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </td>
      </tr>
    );
  }
);

export const PaidTrafficPage: React.FC<PaidTrafficPageProps> = ({ token, user }) => {
  const isSuperAdmin = !user || user.role === 'Super Admin';
  const { fields } = useCrmFields();
  const [paidTraffics, setPaidTraffics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters required:
  // 1. TOP CENTER: Manual search option
  // 2. Gender
  // 3. Profession
  // 4. Qualification
  // (Do not add additional filters)
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [professionFilter, setProfessionFilter] = useState('');
  const [qualificationFilter, setQualificationFilter] = useState('');

  // Modals & Menu
  const [activeMenuRow, setActiveMenuRow] = useState<any | null>(null);
  const [menuTriggerRect, setMenuTriggerRect] = useState<DOMRect | null>(null);
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);
  const [editingTraffic, setEditingTraffic] = useState<any | null>(null);
  const [checkingPayment, setCheckingPayment] = useState<any | null>(null);
  const [changingAssign, setChangingAssign] = useState<any | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);

  const loadPaidTraffic = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/paid-traffic', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load paid traffic records');
      const data = await response.json();
      setPaidTraffics(data);
    } catch (err: any) {
      setError(err.message || 'Error loading paid traffic');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaidTraffic();
  }, [token]);

  // Automatically refresh when any payment request is approved across CRM
  useEffect(() => {
    const handlePaymentAccepted = () => {
      loadPaidTraffic();
    };
    window.addEventListener('shadikabbo:payment-accepted', handlePaymentAccepted);
    return () => {
      window.removeEventListener('shadikabbo:payment-accepted', handlePaymentAccepted);
    };
  }, []);

  // Remove from Paid Traffic (moves to Trash Bin)
  const handleRemove = async (id: string) => {
    if (!confirm('Remove this client from Paid Traffic? It will be moved to Trash Bin.')) {
      return;
    }

    try {
      const res = await fetch(`/api/paid-traffic/${id}/remove`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to remove');
      loadPaidTraffic();
    } catch (err: any) {
      alert(err.message || 'Failed to remove');
    } finally {
      setActiveMenuRow(null);
      setMenuTriggerRect(null);
    }
  };

  // Filtered list
  const filteredPaidTraffics = useMemo(() => {
    return paidTraffics.filter((item) => {
      // 1. Manual search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchPhone = item.phone?.toLowerCase().includes(q);
        const matchId = item.id?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchId) return false;
      }

      // 2. Gender
      if (genderFilter && item.gender !== genderFilter) {
        return false;
      }

      // 3. Profession
      if (professionFilter && item.profession !== professionFilter) {
        return false;
      }

      // 4. Qualification
      if (qualificationFilter && item.qualification !== qualificationFilter) {
        return false;
      }

      return true;
    });
  }, [paidTraffics, searchQuery, genderFilter, professionFilter, qualificationFilter]);

  // Memoized action handlers to prevent re-rendering table rows
  const handleViewProfile = React.useCallback((row: any) => {
    setActiveMenuRow(null);
    setViewingProfile(row);
  }, []);

  const handleCheckPayment = React.useCallback((row: any) => {
    setActiveMenuRow(null);
    setCheckingPayment(row);
  }, []);

  const handleChangeAssign = React.useCallback((row: any) => {
    setActiveMenuRow(null);
    setChangingAssign(row);
  }, []);

  const handleRemoveItem = React.useCallback(
    (id: string) => {
      setActiveMenuRow(null);
      handleRemove(id);
    },
    [handleRemove]
  );

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
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#181E54]">Paid Traffic</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Confirmed matrimonial clients with approved payment clearance
          </p>
        </div>

        {/* TOP CENTER: Manual search option */}
        <div className="w-full sm:max-w-xs relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, or ID..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54] shadow-xs"
          />
        </div>
      </div>

      {/* FILTERS:
          - Gender
          - Profession
          - Qualification
          (Do not add additional filters)
      */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Gender Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Gender
          </label>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
          >
            <option value="">All Genders</option>
            {(fields.genders || []).map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Profession Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Profession
          </label>
          <select
            value={professionFilter}
            onChange={(e) => setProfessionFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
          >
            <option value="">All Professions</option>
            {(fields.professions || []).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Qualification Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Qualification
          </label>
          <select
            value={qualificationFilter}
            onChange={(e) => setQualificationFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
          >
            <option value="">All Qualifications</option>
            {(fields.qualifications || []).map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PAID TRAFFIC TABLE:
          Columns:
          1. ID & Date
          2. Name
          3. Phone
          4. Package
          5. Create & Assign
          6. Action
      */}
      {/* PAID TRAFFIC TABLE */}
      <div className="-mt-1 sm:-mt-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs border-b border-red-100">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[960px]">
            <thead className="bg-[#181E54] text-white uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-2.5 sm:px-3 font-semibold w-14">Serial</th>
                <th className="py-2.5 px-2.5 sm:px-3 font-semibold w-32">ID &amp; Date</th>
                <th className="py-2.5 px-2.5 sm:px-3 font-semibold min-w-[170px]">Name</th>
                <th className="py-2.5 px-2.5 sm:px-3 font-semibold w-32">Created By</th>
                <th className="py-2.5 px-2.5 sm:px-3 font-semibold w-36">Assign</th>
                <th className="py-2.5 px-2.5 sm:px-3 font-semibold w-32">Phone</th>
                <th className="py-2.5 px-2.5 sm:px-3 font-semibold w-28">Package</th>
                <th className="py-2.5 px-2.5 sm:px-3 font-semibold text-right w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#181E54] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-medium">Loading paid traffic records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPaidTraffics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600 mb-1">No paid traffic records</p>
                    <p className="text-[11px] text-slate-400">
                      When a Traffic is added, accept its pending request in the &ldquo;Payment&rdquo; section to verify it as Paid Traffic.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPaidTraffics.map((row, index) => (
                  <PaidTrafficTableRow
                    key={row.id}
                    row={row}
                    index={index}
                    isMenuActive={activeMenuRow?.id === row.id}
                    onViewProfile={handleViewProfile}
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
            label: 'View profile',
            sublabel: 'View full client profile & details',
            icon: <Eye className="w-4 h-4 text-[#181E54]" />,
            onClick: () => handleViewProfile(activeMenuRow),
          },
          {
            label: 'Check Payment',
            sublabel: 'Review payment history & receipts',
            icon: <CreditCard className="w-4 h-4 text-emerald-600" />,
            onClick: () => handleCheckPayment(activeMenuRow),
          },
          {
            label: 'Official Invoice',
            sublabel: 'View & download verified payment invoice',
            icon: <FileText className="w-4 h-4 text-[#181E54]" />,
            onClick: () => {
              setViewingInvoice(activeMenuRow);
              setActiveMenuRow(null);
              setMenuTriggerRect(null);
            },
          },
          ...(isSuperAdmin
            ? [
                {
                  label: 'Change Assign',
                  sublabel: 'Reassign client to another MK account',
                  icon: <UserCheck className="w-4 h-4 text-blue-600" />,
                  onClick: () => handleChangeAssign(activeMenuRow),
                },
                {
                  label: 'Remove',
                  sublabel: 'Move client to Trash bin',
                  icon: <Trash2 className="w-4 h-4 text-[#D81124]" />,
                  variant: 'danger' as const,
                  onClick: () => handleRemoveItem(activeMenuRow.id),
                },
              ]
            : []),
        ]}
      />

      {/* View Profile Modal (complete profile with Edit button) */}
      <TrafficProfileModal
        isOpen={!!viewingProfile}
        onClose={() => setViewingProfile(null)}
        traffic={viewingProfile}
        canEdit={isSuperAdmin}
        onEdit={(trafficToEdit) => setEditingTraffic(trafficToEdit)}
      />

      {/* Edit Traffic Modal (Super Admin only) */}
      {isSuperAdmin && editingTraffic && (
        <TrafficFormModal
          isOpen={!!editingTraffic}
          onClose={() => setEditingTraffic(null)}
          onSubmitSuccess={loadPaidTraffic}
          initialData={editingTraffic}
          token={token}
        />
      )}

      {/* Check payment Modal */}
      <CheckPaymentModal
        isOpen={!!checkingPayment}
        onClose={() => setCheckingPayment(null)}
        traffic={checkingPayment}
        onViewInvoice={(t) => setViewingInvoice(t)}
      />

      {/* Change Assign Modal */}
      <ChangeAssignModal
        isOpen={!!changingAssign}
        onClose={() => setChangingAssign(null)}
        traffic={changingAssign}
        token={token}
        onChangeSuccess={loadPaidTraffic}
      />

      {/* Official Invoice Modal */}
      <ErrorBoundary>
        <InvoiceModal
          isOpen={!!viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          payment={viewingInvoice}
        />
      </ErrorBoundary>
    </div>
  );
};
