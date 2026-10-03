import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, Filter, Download, DollarSign, Bell, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { PaymentRequestsModal } from './PaymentRequestsModal';
import { InvoiceModal } from './InvoiceModal';

interface PaymentPageProps {
  token: string;
}

interface PaymentTableRowProps {
  row: any;
  index: number;
  onDownloadInvoice: (row: any) => void;
}

const PaymentTableRow = React.memo<PaymentTableRowProps>(({ row, index, onDownloadInvoice }) => {
  return (
    <tr className="hover:bg-slate-50/90 transition-colors group">
      {/* 1. Serial Number */}
      <td className="py-2 px-3.5 font-mono font-semibold text-slate-600 w-16">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono">
          {row.serialNumber || index + 1}
        </span>
      </td>

      {/* 2. ID and date */}
      <td className="py-2 px-3.5 w-36">
        <div className="font-mono font-bold text-[#181E54] text-xs">{row.id}</div>
        <div className="text-[10px] text-slate-500">{row.date}</div>
      </td>

      {/* 3. Name with Candidate Profile Picture */}
      <td className="py-2 px-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200/90 shadow-2xs bg-slate-100 flex items-center justify-center shrink-0">
            {row.images && row.images.length > 0 ? (
              <img
                src={row.images[0]}
                alt={row.name}
                className="w-full h-full object-cover"
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

          <div className="min-w-0">
            <span className="font-bold text-slate-900 block truncate">{row.name}</span>
            <span className="text-[11px] text-slate-500 font-mono block">
              {row.trafficId || row.phone}
            </span>
          </div>
        </div>
      </td>

      {/* 4. Created By (The CRM Account Person who added this traffic) */}
      <td className="py-2 px-3.5 w-40">
        <div className="font-semibold text-[#181E54] text-xs truncate">
          {row.createdBy || 'Sohag'}
        </div>
        <div className="text-[10px] text-slate-500 font-medium">
          Role: {row.creatorRole || row.createdRole || 'Super Admin'}
        </div>
      </td>

      {/* 5. Paid Amount */}
      <td className="py-2 px-3.5 font-mono font-bold text-emerald-600 w-28">
        {Number(row.paidAmount || 0).toLocaleString()} BDT
      </td>

      {/* 6. Due Amount */}
      <td className="py-2 px-3.5 font-mono font-bold text-red-600 w-28">
        {Number(row.dueAmount || 0).toLocaleString()} BDT
      </td>

      {/* 7. AMA (After Marriage Amount) */}
      <td className="py-2 px-3.5 font-mono font-bold text-[#181E54] w-24">
        {Number(row.afterMarriageAmount || 0).toLocaleString()} BDT
      </td>

      {/* 8. Specific invoice download button */}
      <td className="py-2 px-3.5 text-center w-36">
        <button
          type="button"
          onClick={() => onDownloadInvoice(row)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#181E54]/10 hover:bg-[#181E54] text-[#181E54] hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          title="Download specific invoice"
        >
          <Download className="w-3.5 h-3.5 text-[#D81124]" />
          <span>Download Invoice</span>
        </button>
      </td>
    </tr>
  );
});

export const PaymentPage: React.FC<PaymentPageProps> = ({ token }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters required:
  // 1. Manual search option at top center
  // 2. Date
  // 3. Specific role: CRO, MK
  // (Do not add additional filters)
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CRO' | 'MK'>('ALL');

  // Modals & Feedback
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [selectedInvoicePayment, setSelectedInvoicePayment] = useState<any | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load Payments & Requests
  const loadData = async () => {
    setLoading(true);
    try {
      const [resPayments, resRequests] = await Promise.all([
        fetch('/api/payments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/payments/requests', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (resPayments.ok) {
        const pData = await resPayments.json();
        setPayments(pData);
      }
      if (resRequests.ok) {
        const rData = await resRequests.json();
        setRequests(rData);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading payment records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Handle Accept
  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/payments/requests/${requestId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to accept payment request');
      }
      await loadData();
      setToast({
        type: 'success',
        message: 'Payment request approved successfully! Official invoice generated.',
      });
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to accept payment request',
      });
      setTimeout(() => setToast(null), 4000);
      throw err;
    }
  };

  // Handle Reject
  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/payments/requests/${requestId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to reject payment request');
      }
      await loadData();
      setToast({
        type: 'success',
        message: 'Payment request has been rejected.',
      });
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to reject payment request',
      });
      setTimeout(() => setToast(null), 4000);
      throw err;
    }
  };

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      // 1. Manual search: Name, ID, Traffic ID
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchId = item.id?.toLowerCase().includes(q);
        const matchTrafficId = item.trafficId?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchTrafficId) return false;
      }

      // 2. Date
      if (dateFilter) {
        if (!item.date?.startsWith(dateFilter)) return false;
      }

      // 3. Specific role: CRO, MK
      if (roleFilter !== 'ALL') {
        if (item.assignedRole !== roleFilter) return false;
      }

      return true;
    });
  }, [payments, searchQuery, dateFilter, roleFilter]);

  // Memoized download invoice handler to avoid re-rendering PaymentTableRow
  const handleDownloadInvoice = React.useCallback((row: any) => {
    setSelectedInvoicePayment(row);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#181E54]">Payment</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified financial receipts, payment clearances, and invoices
          </p>
        </div>

        {/* TOP RIGHT: Button for Payment Requests */}
        <button
          type="button"
          onClick={() => setIsRequestsModalOpen(true)}
          className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#181E54] hover:bg-[#121642] text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer shrink-0"
        >
          <Bell className="w-4 h-4 text-[#D81124]" />
          <span>Payment Requests</span>
          {requests.length > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#D81124] text-white rounded-full">
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {/* FILTERS & SEARCH:
          - Manual search option at top center
          - Date
          - Specific role: CRO, MK
          (Do not add additional filters)
      */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Date Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Calendar className="w-4 h-4" />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Manual search option at TOP CENTER */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payments by name, ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
          />
        </div>

        {/* Specific Role Filter: CRO, MK */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setRoleFilter('ALL')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              roleFilter === 'ALL'
                ? 'bg-white text-[#181E54] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Roles
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('CRO')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              roleFilter === 'CRO'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            CRO
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('MK')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              roleFilter === 'MK'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            MK
          </button>
        </div>
      </div>

      {/* PAYMENT TABLE:
          Columns:
          1. ID and date
          2. Name
          3. Paid Amount
          4. Due Amount
          5. After Marriage Amount (AMA)
          6. Specific invoice download button
          (Do not add extra table columns)
      */}
      {/* PAYMENT TABLE */}
      <div className="-mt-1 sm:-mt-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs border-b border-red-100">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-[#181E54] text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold w-16">Serial Number</th>
                <th className="py-2.5 px-3.5 font-semibold w-36">ID and date</th>
                <th className="py-2.5 px-3.5 font-semibold">Name</th>
                <th className="py-2.5 px-3.5 font-semibold w-40">Created By</th>
                <th className="py-2.5 px-3.5 font-semibold font-mono w-28">Paid Amount</th>
                <th className="py-2.5 px-3.5 font-semibold font-mono w-28">Due Amount</th>
                <th className="py-2.5 px-3.5 font-semibold font-mono w-24" title="After Marriage Amount (AMA)">AMA</th>
                <th className="py-2.5 px-3.5 font-semibold text-center w-36">Action / Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#181E54] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-medium">Loading payment records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600 mb-1">No accepted payments yet</p>
                    <p className="text-[11px] text-slate-400">
                      When a Traffic is added, accept its request in &ldquo;Payment Requests&rdquo; to record payments.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((row, index) => (
                  <PaymentTableRow
                    key={row.id}
                    row={row}
                    index={index}
                    onDownloadInvoice={handleDownloadInvoice}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Requests Modal */}
      <PaymentRequestsModal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
        requests={requests}
        onAccept={handleAcceptRequest}
        onReject={handleRejectRequest}
        onRefresh={loadData}
      />

      {/* Invoice Modal for specific invoice view & download */}
      <InvoiceModal
        isOpen={!!selectedInvoicePayment}
        onClose={() => setSelectedInvoicePayment(null)}
        payment={selectedInvoicePayment}
      />

      {/* Floating Action Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-900/90 text-white border-emerald-500/40 backdrop-blur-md'
                : 'bg-rose-900/90 text-white border-rose-500/40 backdrop-blur-md'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 text-white/60 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
