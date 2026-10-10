import React from 'react';
import { X, DollarSign, CheckCircle2, Calendar, CreditCard, Shield, FileText } from 'lucide-react';

interface CheckPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  traffic: any;
  onViewInvoice?: (traffic: any) => void;
}

export const CheckPaymentModal: React.FC<CheckPaymentModalProps> = ({
  isOpen,
  onClose,
  traffic,
  onViewInvoice,
}) => {
  if (!isOpen || !traffic) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-3xl xl:max-w-4xl max-h-[96vh] flex flex-col bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#181E54] text-white flex items-center justify-center shadow-xs">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#181E54]">Check Payment &amp; Financial Clearance</h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                  {traffic.id}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Official verified payment ticket for {traffic.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex-1 min-h-0 overflow-y-auto space-y-3.5 text-xs text-slate-700">
          
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-emerald-900">Payment Request Accepted &amp; Verified</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Client candidate is officially cleared and registered into Paid Client.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-2xs font-mono">
              STATUS: PAID
            </span>
          </div>

          {/* 2-Column Horizontal Layout for Web */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
            {/* Left Card: Client & Service Details */}
            <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-2.5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#D81124] mb-3">
                  Client &amp; Service Package
                </h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                    <span className="text-slate-500 font-medium">Client Full Name:</span>
                    <span className="font-bold text-slate-900">{traffic.name}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                    <span className="text-slate-500 font-medium">Client ID:</span>
                    <span className="font-mono font-bold text-[#181E54]">{traffic.id}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                    <span className="text-slate-500 font-medium">Service Package:</span>
                    <span className="font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                      {traffic.package}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                    <span className="text-slate-500 font-medium">Payment Method:</span>
                    <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {traffic.paymentMethod || 'bKash'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Assigned Officer:</span>
                    <span className="font-semibold text-[#181E54]">{traffic.assignBy || 'MK Official'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 italic">
                * Official receipt stored in system database.
              </div>
            </div>

            {/* Right Card: Financial Settlement Breakdown */}
            <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#D81124] mb-3">
                Financial Breakdown
              </h3>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">Package Standard Price:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {Number(traffic.price || 0).toLocaleString()} BDT
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">Special Discount:</span>
                  <span className="font-mono text-slate-800">
                    {Number(traffic.discount || 0).toLocaleString()} BDT
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/70 bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                  <span className="text-emerald-900 font-bold">Total Paid Amount:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {Number(traffic.paidAmount || 0).toLocaleString()} BDT
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">Remaining Due Balance:</span>
                  <span className={`font-mono font-bold ${Number(traffic.dueAmount || 0) > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                    {Number(traffic.dueAmount || 0).toLocaleString()} BDT
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100">
                  <span className="text-[#181E54] font-bold">After Marriage Fee (AMA):</span>
                  <span className="font-mono font-bold text-[#181E54] text-sm">
                    {Number(traffic.afterMarriageFee || 0).toLocaleString()} BDT
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 sm:px-6 sm:py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          {onViewInvoice ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewInvoice(traffic);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#181E54] hover:bg-[#121642] text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-red-400" />
              <span>View Official Invoice</span>
            </button>
          ) : (
            <div></div>
          )}
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
