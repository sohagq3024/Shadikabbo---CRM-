import React from 'react';
import { X, DollarSign, CheckCircle2, Calendar, CreditCard, Shield } from 'lucide-react';

interface CheckPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  traffic: any;
}

export const CheckPaymentModal: React.FC<CheckPaymentModalProps> = ({
  isOpen,
  onClose,
  traffic,
}) => {
  if (!isOpen || !traffic) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#D81124]" />
            <div>
              <h2 className="text-base font-bold text-[#181E54]">Chack [ayment</h2>
              <p className="text-[11px] text-slate-500">Payment details for {traffic.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-900">Payment Request Accepted</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Traffic is officially cleared and registered into Paid Traffic.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Client Name:</span>
              <span className="font-bold text-slate-900">{traffic.name}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Traffic ID:</span>
              <span className="font-mono font-bold text-[#181E54]">{traffic.id}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Service Package:</span>
              <span className="font-semibold text-slate-800">{traffic.package}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Package Price:</span>
              <span className="font-mono font-semibold text-slate-800">{Number(traffic.price || 0).toLocaleString()} BDT</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Discount Given:</span>
              <span className="font-mono text-slate-800">{Number(traffic.discount || 0).toLocaleString()} BDT</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Paid Amount:</span>
              <span className="font-mono font-bold text-emerald-600">{Number(traffic.paidAmount || 0).toLocaleString()} BDT</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Due Amount:</span>
              <span className="font-mono font-bold text-red-600">{Number(traffic.dueAmount || 0).toLocaleString()} BDT</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-semibold text-slate-800">{traffic.paymentMethod}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-700 font-bold">After Marriage Fee (AMA):</span>
              <span className="font-mono font-bold text-[#181E54]">{Number(traffic.afterMarriageFee || 0).toLocaleString()} BDT</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end">
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
