import React, { useState, useMemo } from 'react';
import {
  X,
  Check,
  XCircle,
  DollarSign,
  Calendar,
  User,
  Package,
  Search,
  RefreshCw,
  Shield,
  Briefcase,
  Phone,
  Clock,
  UserCheck,
  CreditCard,
  Building2,
  Wallet,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

export interface PaymentRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: any[];
  onAccept: (id: string) => Promise<boolean | void>;
  onReject: (id: string) => Promise<boolean | void>;
  onRefresh?: () => void;
}

export const PaymentRequestsModal: React.FC<PaymentRequestsModalProps> = ({
  isOpen,
  onClose,
  requests,
  onAccept,
  onReject,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'Super Admin' | 'MK' | 'CRO'>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<'accept' | 'reject' | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Compute totals for KPI banner
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

      // 2. Search query (search in Candidate Name, Traffic ID, Phone, Created By Staff Name, or Payment Method)
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

  // Helper for Payment Method Icon
  const renderMethodBadge = (method?: string) => {
    const m = (method || '').toLowerCase();
    if (m.includes('bkash')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-50 border border-pink-200 text-pink-700 font-bold text-[10px]">
          <Smartphone className="w-3 h-3 text-pink-600" />
          bKash
        </span>
      );
    }
    if (m.includes('nagad')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-orange-700 font-bold text-[10px]">
          <Smartphone className="w-3 h-3 text-orange-600" />
          Nagad
        </span>
      );
    }
    if (m.includes('rocket')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 font-bold text-[10px]">
          <Smartphone className="w-3 h-3 text-purple-600" />
          Rocket
        </span>
      );
    }
    if (m.includes('bank')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[10px]">
          <Building2 className="w-3 h-3 text-indigo-600" />
          Bank Transfer
        </span>
      );
    }
    if (m.includes('cash')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]">
          <Wallet className="w-3 h-3 text-emerald-600" />
          Cash at Office
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px]">
        <CreditCard className="w-3 h-3 text-slate-500" />
        {method || 'Standard'}
      </span>
    );
  };

  // Helper for Role Styling
  const renderRoleBadge = (roleName?: string) => {
    const role = (roleName || '').toUpperCase();
    if (role.includes('ADMIN')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 font-bold text-[10px] tracking-wide">
          <Shield className="w-3 h-3 text-purple-700" />
          Super Admin
        </span>
      );
    }
    if (role.includes('MK')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] tracking-wide">
          <Briefcase className="w-3 h-3 text-emerald-700" />
          MK Marketing
        </span>
      );
    }
    if (role.includes('CRO')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200 font-bold text-[10px] tracking-wide">
          <UserCheck className="w-3 h-3 text-sky-700" />
          CRO Counselor
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px]">
        <User className="w-3 h-3 text-slate-500" />
        {roleName || 'Staff'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 transition-opacity duration-150">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D81124]/10 border border-[#D81124]/20 flex items-center justify-center text-[#D81124] shrink-0">
              <DollarSign className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#181E54]">
                  Payment Requests Verification
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#D81124] text-white">
                  {requests.length} Pending
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Review submitted payment tickets, verified creator accounts, and approve candidate invoices.
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
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#181E54]' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* KPI Stats Summary Bar */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-white px-6 py-2.5 shrink-0 text-center sm:text-left">
          <div className="px-2">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Pending Tickets
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 font-mono">
              {requests.length}
            </span>
          </div>
          <div className="px-2">
            <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider block">
              Total Requested Paid
            </span>
            <span className="text-sm sm:text-base font-bold text-emerald-600 font-mono">
              ৳ {totalAmount.toLocaleString()} BDT
            </span>
          </div>
          <div className="px-2">
            <span className="text-[10px] text-red-500 font-semibold uppercase tracking-wider block">
              Outstanding Due
            </span>
            <span className="text-sm sm:text-base font-bold text-red-600 font-mono">
              ৳ {totalDue.toLocaleString()} BDT
            </span>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, phone, ticket ID, or staff sender..."
              className="w-full pl-9 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                roleFilter === 'ALL'
                  ? 'bg-[#181E54] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              All ({requests.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('Super Admin')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                roleFilter === 'Super Admin'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Admin ({roleCounts['Super Admin']})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('MK')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                roleFilter === 'MK'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              MK ({roleCounts.MK})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('CRO')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                roleFilter === 'CRO'
                  ? 'bg-sky-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              CRO ({roleCounts.CRO})
            </button>
          </div>
        </div>

        {/* Requests List Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {filteredRequests.length === 0 ? (
            <div className="py-14 text-center text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-700 text-sm">No pending payment requests</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery || roleFilter !== 'ALL'
                  ? 'No requests match your current search or filter criteria. Try clearing the filter.'
                  : 'All payment tickets have been reviewed and approved! New submissions will appear here.'}
              </p>
              {(searchQuery || roleFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('ALL');
                  }}
                  className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isItemProcessing = processingId === req.id;
              const isAccepting = isItemProcessing && processingAction === 'accept';
              const isRejecting = isItemProcessing && processingAction === 'reject';
              const creatorName = req.createdBy || 'Sohag';
              const creatorRole = req.creatorRole || req.role || 'Super Admin';

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden"
                >
                  {/* TOP BANNER: Real Account Sender / Created By Info */}
                  <div className="bg-slate-50/90 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#181E54] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {creatorName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Request Sent By:
                        </span>
                        <strong className="text-slate-900 font-bold">{creatorName}</strong>
                        {renderRoleBadge(creatorRole)}
                        {req.creatorPhone && (
                          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {req.creatorPhone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold font-mono">
                        {req.id}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        {req.formattedDate || req.date}
                      </span>
                    </div>
                  </div>

                  {/* MAIN CARD BODY */}
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Candidate Identity */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 shadow-2xs bg-slate-100 flex items-center justify-center shrink-0">
                        {req.images && req.images.length > 0 ? (
                          <img
                            src={req.images[0]}
                            alt={req.trafficName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex flex-col items-center justify-center ${
                              req.gender?.toLowerCase() === 'female'
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-blue-50 text-blue-600'
                            }`}
                          >
                            <User className="w-6 h-6 opacity-60" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm truncate">
                            {req.trafficName}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md">
                            {req.trafficId}
                          </span>
                          {renderMethodBadge(req.paymentMethod)}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                          <span>
                            Phone: <strong className="font-mono text-slate-800">{req.phone}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Assigned MK: <strong className="text-slate-800">{req.assignedBy || 'None'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Metrics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-xs">
                      {/* Package */}
                      <div className="px-2">
                        <span className="text-[10px] text-slate-400 block font-semibold">Package</span>
                        <span className="font-bold text-[#181E54] block truncate">
                          {req.package || 'Gold'}
                        </span>
                      </div>

                      {/* Paid Amount */}
                      <div className="px-2">
                        <span className="text-[10px] text-emerald-600 block font-semibold">Paid Now</span>
                        <span className="font-bold font-mono text-emerald-700 block">
                          ৳ {Number(req.paidAmount).toLocaleString()}
                        </span>
                      </div>

                      {/* Due Amount */}
                      <div className="px-2">
                        <span className="text-[10px] text-red-500 block font-semibold">Due Amount</span>
                        <span className="font-bold font-mono text-red-600 block">
                          ৳ {Number(req.dueAmount).toLocaleString()}
                        </span>
                      </div>

                      {/* AMA */}
                      <div className="px-2">
                        <span className="text-[10px] text-slate-400 block font-semibold">After Marriage</span>
                        <span className="font-bold font-mono text-[#181E54] block">
                          ৳ {Number(req.afterMarriageFee || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                      <button
                        type="button"
                        onClick={() => handleAction(req.id, 'reject')}
                        disabled={isItemProcessing}
                        className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-[#D81124] border border-red-200 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isRejecting ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        <span>{isRejecting ? 'Rejecting...' : 'Reject'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAction(req.id, 'accept')}
                        disabled={isItemProcessing}
                        className="px-4 py-2 bg-[#181E54] hover:bg-[#121642] text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isAccepting ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>{isAccepting ? 'Approving...' : 'Accept & Invoice'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Showing {filteredRequests.length} of {requests.length} pending request(s)
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
