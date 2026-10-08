import React, { useState, useMemo } from 'react';
import {
  X,
  Check,
  XCircle,
  Search,
  RefreshCw,
  User,
  CreditCard,
  Building2,
  Wallet,
  Smartphone,
  CheckCircle2,
  Clock,
  Phone,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Calendar,
  DollarSign,
  Tag,
  Gem,
  Award,
  Crown,
} from 'lucide-react';
import { CountryFlag, detectCountryIso } from './CountryFlag';
import { ImageLightboxModal } from './ImageLightboxModal';

export interface PaymentRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: any[];
  onAccept: (id: string) => Promise<boolean | void>;
  onReject: (id: string) => Promise<boolean | void>;
  onRefresh?: () => void;
  canApprove?: boolean;
}

export const PaymentRequestsModal: React.FC<PaymentRequestsModalProps> = ({
  isOpen,
  onClose,
  requests,
  onAccept,
  onReject,
  onRefresh,
  canApprove = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'Super Admin' | 'MK' | 'CRO'>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<'accept' | 'reject' | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewLightbox, setPreviewLightbox] = useState<{
    isOpen: boolean;
    images: string[];
    title: string;
    candidateId: string;
  } | null>(null);

  // Compute totals for KPI summary cards
  const totalAmount = useMemo(() => {
    return requests.reduce((sum, r) => sum + (Number(r.paidAmount) || 0), 0);
  }, [requests]);

  const totalDue = useMemo(() => {
    return requests.reduce((sum, r) => sum + (Number(r.dueAmount) || 0), 0);
  }, [requests]);

  // Counts by role
  const roleCounts = useMemo(() => {
    const counts = { 'Super Admin': 0, MK: 0, CRO: 0 };
    requests.forEach((r) => {
      const role = String(r.creatorRole || r.role || '').toUpperCase();
      if (role.includes('ADMIN')) counts['Super Admin']++;
      else if (role.includes('MK')) counts.MK++;
      else if (role.includes('CRO')) counts.CRO++;
    });
    return counts;
  }, [requests]);

  // Filtered requests based on search query and role filter
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // 1. Role filter
      if (roleFilter !== 'ALL') {
        const role = String(r.creatorRole || r.role || '').toUpperCase();
        if (roleFilter === 'Super Admin' && !role.includes('ADMIN')) return false;
        if (roleFilter === 'MK' && !role.includes('MK')) return false;
        if (roleFilter === 'CRO' && !role.includes('CRO')) return false;
      }

      // 2. Search query (search in Candidate Name, Traffic ID, Phone, Staff Name, or Payment Method)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = r.trafficName?.toLowerCase().includes(q);
        const matchId = r.trafficId?.toLowerCase().includes(q) || r.id?.toLowerCase().includes(q);
        const matchPhone = r.phone?.toLowerCase().includes(q);
        const matchCreator = r.createdBy?.toLowerCase().includes(q);
        const matchMethod = r.paymentMethod?.toLowerCase().includes(q);
        const matchPkg = r.package?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchPhone && !matchCreator && !matchMethod && !matchPkg) {
          return false;
        }
      }

      return true;
    });
  }, [requests, searchQuery, roleFilter]);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const handleAction = async (id: string, action: 'accept' | 'reject') => {
    setProcessingId(id);
    setProcessingAction(action);
    try {
      if (action === 'accept') {
        await onAccept(id);
      } else {
        await onReject(id);
      }
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  if (!isOpen) return null;

  // Clean, structured payment method badge
  const renderPaymentMethod = (method?: string) => {
    const m = (method || '').toLowerCase();
    let Icon = CreditCard;
    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';

    if (m.includes('bkash')) {
      Icon = Smartphone;
      colorClass = 'bg-pink-50 text-pink-700 border-pink-200';
    } else if (m.includes('nagad')) {
      Icon = Smartphone;
      colorClass = 'bg-orange-50 text-orange-700 border-orange-200';
    } else if (m.includes('rocket')) {
      Icon = Smartphone;
      colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
    } else if (m.includes('bank')) {
      Icon = Building2;
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (m.includes('cash')) {
      Icon = Wallet;
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${colorClass}`}>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{method || 'bKash'}</span>
      </span>
    );
  };

  // Structured Package badge with subtle distinct style
  const renderPackageBadge = (pkg?: string) => {
    const p = (pkg || 'Standard').toLowerCase();
    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
    let Icon = Tag;

    if (p.includes('platinum')) {
      badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      Icon = Crown;
    } else if (p.includes('diamond')) {
      badgeClass = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      Icon = Gem;
    } else if (p.includes('gold')) {
      badgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
      Icon = Award;
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`}>
        <Icon className="w-3 h-3 opacity-80" />
        <span>{pkg || 'Standard'}</span>
      </span>
    );
  };

  // Formats staff role badge cleanly
  const renderRoleBadge = (roleName?: string) => {
    const role = (roleName || '').toUpperCase();
    let badge = { label: roleName || 'Staff', style: 'bg-slate-100 text-slate-700 border-slate-200' };

    if (role.includes('ADMIN')) {
      badge = { label: 'Super Admin', style: 'bg-rose-50 text-rose-700 border-rose-200' };
    } else if (role.includes('MK')) {
      badge = { label: 'MK Marketing', style: 'bg-blue-50 text-blue-700 border-blue-200' };
    } else if (role.includes('CRO')) {
      badge = { label: 'CRO Counselor', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.style}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 md:p-6 transition-all duration-200">
      <div className="relative w-full max-w-6xl 2xl:max-w-7xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[94vh] max-h-[94vh]">
        
        {/* ============================================================
            1. MODAL TOP HEADER
        ============================================================ */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#181E54] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <FileCheck2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-[#181E54] tracking-tight">
                  Payment Requests Verification
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D81124] text-white font-mono shadow-2xs">
                  {requests.length} Pending
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review candidate payment tickets, accept financial clearance to automatically move candidate to Paid Traffic, and generate official invoice.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh requests"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200/80"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#181E54]' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200/80"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================
            2. STRUCTURED KPI METRICS CARDS
        ============================================================ */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: Pending Tickets */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                  Pending Tickets
                </span>
                <span className="text-xl font-extrabold text-[#181E54] font-mono tabular-nums">
                  {requests.length}{' '}
                  <span className="text-xs font-medium text-slate-400">tickets</span>
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#181E54]">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            {/* Card 2: Total Paid Amount */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                  Requested Payment
                </span>
                <span className="text-xl font-extrabold text-emerald-700 font-mono tabular-nums">
                  ৳ {totalAmount.toLocaleString()}{' '}
                  <span className="text-xs font-medium text-slate-400">BDT</span>
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            {/* Card 3: Total Due Balance */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                  Remaining Due Balance
                </span>
                <span className="text-xl font-extrabold text-red-600 font-mono tabular-nums">
                  ৳ {totalDue.toLocaleString()}{' '}
                  <span className="text-xs font-medium text-slate-400">BDT</span>
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                <Tag className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            3. SEARCH & SEGMENTED FILTER CONTROL BAR
        ============================================================ */}
        <div className="px-5 sm:px-6 py-2.5 border-b border-slate-200 bg-white shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, ID, phone, staff, package..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#181E54] focus:border-[#181E54] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                roleFilter === 'ALL'
                  ? 'bg-[#181E54] text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({requests.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('Super Admin')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                roleFilter === 'Super Admin'
                  ? 'bg-[#181E54] text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Super Admin ({roleCounts['Super Admin']})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('MK')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                roleFilter === 'MK'
                  ? 'bg-[#181E54] text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              MK ({roleCounts.MK})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('CRO')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                roleFilter === 'CRO'
                  ? 'bg-[#181E54] text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CRO ({roleCounts.CRO})
            </button>
          </div>
        </div>

        {/* ============================================================
            4. MAIN BODY: ORGANIZED TABLE WITH DISTINCT BRAND COLOR
        ============================================================ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50/50">
          {filteredRequests.length === 0 ? (
            <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="font-bold text-slate-800 text-sm">No Pending Payment Requests</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery || roleFilter !== 'ALL'
                  ? 'No requests match your current search or filter criteria.'
                  : 'All candidate payment requests have been reviewed and approved.'}
              </p>
              {(searchQuery || roleFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('ALL');
                  }}
                  className="mt-3 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-[#181E54] font-semibold rounded-lg text-xs cursor-pointer shadow-2xs"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW WITH ROYAL NAVY THEMED HEADER */}
              <div className="hidden md:block bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                  {/* DISTINCT THEMED TABLE HEADER: ROYAL NAVY (#181E54) */}
                  <thead className="bg-[#181E54] text-white uppercase text-[10px] tracking-wider sticky top-0 z-10 select-none shadow-xs">
                    <tr>
                      <th className="py-3 px-3.5 font-bold w-28 text-center border-b border-[#252E7D]">
                        Ticket ID
                      </th>
                      <th className="py-3 px-3.5 font-bold w-32 border-b border-[#252E7D]">
                        Date &amp; Time
                      </th>
                      <th className="py-3 px-3.5 font-bold min-w-[220px] border-b border-[#252E7D]">
                        Candidate
                      </th>
                      <th className="py-3 px-3.5 font-bold w-28 text-center border-b border-[#252E7D]">
                        Package
                      </th>
                      <th className="py-3 px-3.5 font-bold w-32 text-center border-b border-[#252E7D]">
                        Method
                      </th>
                      <th className="py-3 px-3.5 font-bold text-right w-32 border-b border-[#252E7D]">
                        Paid (Requested)
                      </th>
                      <th className="py-3 px-3.5 font-bold text-right w-28 border-b border-[#252E7D]">
                        Due Balance
                      </th>
                      <th className="py-3 px-3.5 font-bold w-36 border-b border-[#252E7D]">
                        Submitted By
                      </th>
                      <th className="py-3 px-3.5 font-bold text-center min-w-[200px] border-b border-[#252E7D]">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs bg-white text-slate-700">
                    {filteredRequests.map((req, idx) => {
                      const isItemProcessing = processingId === req.id;
                      const isAccepting = isItemProcessing && processingAction === 'accept';
                      const isRejecting = isItemProcessing && processingAction === 'reject';
                      const creatorName = req.createdBy || 'Sohag';
                      const creatorRole = req.creatorRole || req.role || 'Super Admin';

                      return (
                        <tr
                          key={req.id}
                          className={`hover:bg-indigo-50/40 transition-colors ${
                            idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                          }`}
                        >
                          {/* 1. Ticket ID & Serial Number */}
                          <td className="py-3 px-3.5 align-middle text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[#181E54] text-xs bg-indigo-50/80 border border-indigo-200/80 shadow-2xs">
                              {req.id}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              #{String(idx + 1).padStart(2, '0')}
                            </div>
                          </td>

                          {/* 2. Date & Time */}
                          <td className="py-3 px-3.5 align-middle">
                            <div className="flex items-center gap-1.5 font-mono text-slate-700 font-medium">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{req.date || req.formattedDate?.split(' ')[0]}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                              <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span>{req.formattedDate?.split(' ')[1] || '10:00'}</span>
                            </div>
                          </td>

                          {/* 3. Candidate Information */}
                          <td className="py-3 px-3.5 align-middle">
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (req.images && req.images.length > 0) {
                                    setPreviewLightbox({
                                      isOpen: true,
                                      images: req.images,
                                      title: req.trafficName || 'Candidate',
                                      candidateId: req.trafficId || req.id,
                                    });
                                  }
                                }}
                                title={
                                  req.images && req.images.length > 0
                                    ? 'Click to view photo in full screen & download'
                                    : req.trafficName
                                }
                                className={`w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 shadow-2xs ${
                                  req.images && req.images.length > 0
                                    ? 'cursor-pointer hover:ring-2 hover:ring-[#181E54]/40 hover:scale-105 transition-all'
                                    : ''
                                }`}
                              >
                                {req.images && req.images.length > 0 ? (
                                  <img
                                    src={req.images[0]}
                                    alt={req.trafficName}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                    <User className="w-4 h-4 opacity-60" />
                                  </div>
                                )}
                              </button>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block truncate text-xs hover:text-[#181E54]">
                                  {req.trafficName || 'Candidate'}
                                </span>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1 py-0.2 rounded text-[10px] border border-slate-200/60">
                                    {req.trafficId}
                                  </span>
                                  <span className="text-slate-300">·</span>
                                  <div className="flex items-center gap-1 font-mono text-slate-600">
                                    <CountryFlag iso={detectCountryIso(req.phone)} className="w-3.5 h-2.5" />
                                    <span>{req.phone}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 4. Package */}
                          <td className="py-3 px-3.5 align-middle text-center">
                            {renderPackageBadge(req.package)}
                          </td>

                          {/* 5. Payment Method */}
                          <td className="py-3 px-3.5 align-middle text-center">
                            {renderPaymentMethod(req.paymentMethod)}
                          </td>

                          {/* 6. Paid Amount (Prominently Highlighted) */}
                          <td className="py-3 px-3.5 align-middle text-right">
                            <div className="inline-flex flex-col items-end">
                              <span className="font-mono font-extrabold text-emerald-700 text-sm tabular-nums">
                                ৳ {Number(req.paidAmount || 0).toLocaleString()}
                              </span>
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 mt-0.5">
                                Requested
                              </span>
                            </div>
                          </td>

                          {/* 7. Due Balance & After Marriage Fee */}
                          <td className="py-3 px-3.5 align-middle text-right">
                            <div>
                              <span className="font-mono font-bold text-red-600 text-xs tabular-nums block">
                                {Number(req.dueAmount || 0) > 0 ? (
                                  `৳ ${Number(req.dueAmount).toLocaleString()}`
                                ) : (
                                  <span className="text-slate-400 font-normal">৳ 0</span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-400">Due Balance</span>
                            </div>
                            {Number(req.afterMarriageFee || 0) > 0 && (
                              <div className="mt-1">
                                <span className="font-mono font-semibold text-[#181E54] text-[10px] tabular-nums block">
                                  ৳ {Number(req.afterMarriageFee).toLocaleString()}
                                </span>
                                <span className="text-[9px] text-slate-400">AMA</span>
                              </div>
                            )}
                          </td>

                          {/* 8. Submitted By */}
                          <td className="py-3 px-3.5 align-middle">
                            <div className="font-bold text-[#181E54] text-xs truncate">
                              {creatorName}
                            </div>
                            <div className="mt-0.5">
                              {renderRoleBadge(creatorRole)}
                            </div>
                            {req.creatorPhone && (
                              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span>{req.creatorPhone}</span>
                              </div>
                            )}
                          </td>

                          {/* 9. Action Buttons */}
                          <td className="py-3 px-3.5 align-middle text-center">
                            {canApprove ? (
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Reject Button */}
                                <button
                                  type="button"
                                  onClick={() => handleAction(req.id, 'reject')}
                                  disabled={isItemProcessing}
                                  className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50 shadow-2xs"
                                  title="Reject payment request"
                                >
                                  {isRejecting ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                  )}
                                  <span>{isRejecting ? 'Rejecting...' : 'Reject'}</span>
                                </button>

                                {/* Accept & Move to Paid Button */}
                                <button
                                  type="button"
                                  onClick={() => handleAction(req.id, 'accept')}
                                  disabled={isItemProcessing}
                                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                  title="Approve payment clearance, issue invoice, and automatically move candidate to Paid Traffic"
                                >
                                  {isAccepting ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                  )}
                                  <span>{isAccepting ? 'Approving...' : 'Accept & Move to Paid'}</span>
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                Pending Approval
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD VIEW (below md) */}
              <div className="md:hidden space-y-3">
                {filteredRequests.map((req) => {
                  const isItemProcessing = processingId === req.id;
                  const isAccepting = isItemProcessing && processingAction === 'accept';
                  const isRejecting = isItemProcessing && processingAction === 'reject';
                  const creatorName = req.createdBy || 'Sohag';
                  const creatorRole = req.creatorRole || req.role || 'Super Admin';

                  return (
                    <div
                      key={req.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-mono font-bold text-[#181E54] text-xs bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200/80">
                          {req.id}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {req.formattedDate || req.date}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (req.images && req.images.length > 0) {
                              setPreviewLightbox({
                                isOpen: true,
                                images: req.images,
                                title: req.trafficName || 'Candidate',
                                candidateId: req.trafficId || req.id,
                              });
                            }
                          }}
                          className={`w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 text-left ${
                            req.images && req.images.length > 0
                              ? 'cursor-pointer hover:ring-2 hover:ring-[#181E54]/40'
                              : ''
                          }`}
                        >
                          {req.images && req.images.length > 0 ? (
                            <img
                              src={req.images[0]}
                              alt={req.trafficName}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-900 block text-sm">
                            {req.trafficName}
                          </span>
                          <span className="text-xs text-slate-500 font-mono block">
                            {req.trafficId} · {req.phone}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Requested</span>
                          <span className="font-bold font-mono text-emerald-700">
                            ৳ {Number(req.paidAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Due</span>
                          <span className="font-bold font-mono text-red-600">
                            ৳ {Number(req.dueAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Package</span>
                          <span className="font-medium text-slate-800 truncate block">
                            {req.package || 'Standard'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                        <div>
                          <span>By: </span>
                          <strong className="text-slate-900">{creatorName}</strong>
                          <div className="mt-0.5">{renderRoleBadge(creatorRole)}</div>
                        </div>
                        <div>
                          {renderPaymentMethod(req.paymentMethod)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        {canApprove ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAction(req.id, 'reject')}
                              disabled={isItemProcessing}
                              className="flex-1 py-2 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-red-50 hover:text-red-700 rounded-lg cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                              <span>Reject</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(req.id, 'accept')}
                              disabled={isItemProcessing}
                              className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                              <span>Accept &amp; Move to Paid</span>
                            </button>
                          </>
                        ) : (
                          <div className="w-full text-center py-1">
                            <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              Pending Approval by Super Admin
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ============================================================
            5. MODAL FOOTER
        ============================================================ */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900 font-mono">{filteredRequests.length}</strong> of{' '}
            <strong className="text-slate-900 font-mono">{requests.length}</strong> pending ticket(s)
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* Full-screen Image Lightbox Modal with Zoom, Rotation & Download */}
      {previewLightbox && (
        <ImageLightboxModal
          isOpen={previewLightbox.isOpen}
          onClose={() => setPreviewLightbox(null)}
          images={previewLightbox.images}
          title={previewLightbox.title}
          candidateId={previewLightbox.candidateId}
        />
      )}
    </div>
  );
};
