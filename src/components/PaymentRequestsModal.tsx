import React from 'react';
import { X, Check, XCircle, DollarSign, Calendar, User, Package } from 'lucide-react';

interface PaymentRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: any[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export const PaymentRequestsModal: React.FC<PaymentRequestsModalProps> = ({
  isOpen,
  onClose,
  requests,
  onAccept,
  onReject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#D81124]" />
            <h2 className="text-lg font-bold text-[#181E54]">
              Pending Payment Requests ({requests.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Requests List */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {requests.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="font-semibold text-slate-600">No pending payment requests</p>
              <p className="text-xs text-slate-400 mt-1">
                New traffic submissions will appear here for verification and approval.
              </p>
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-50 hover:bg-slate-100/80 p-4 rounded-2xl border border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden border border-slate-200 shadow-2xs bg-slate-100 flex items-center justify-center shrink-0">
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
                        <User className="w-5 h-5 opacity-60" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm truncate">{req.trafficName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md shrink-0">
                        {req.trafficId}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                        Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                    <div>
                      <span>Phone: </span>
                      <span className="font-medium text-slate-700">{req.phone}</span>
                    </div>
                    <div>
                      <span>Package: </span>
                      <span className="font-medium text-slate-700">{req.package}</span>
                    </div>
                    <div>
                      <span>Paid: </span>
                      <span className="font-bold text-emerald-600">{Number(req.paidAmount).toLocaleString()} BDT</span>
                    </div>
                    <div>
                      <span>Due: </span>
                      <span className="font-bold text-red-600">{Number(req.dueAmount).toLocaleString()} BDT</span>
                    </div>
                    <div>
                      <span>Method: </span>
                      <span className="font-medium text-slate-700">{req.paymentMethod}</span>
                    </div>
                    <div>
                      <span>Role: </span>
                      <span className="font-medium text-slate-700">{req.role} ({req.assignedBy})</span>
                    </div>
                  </div>
                </div>
                </div>

                {/* EXACTLY 2 ACTIONS: Accept, Reject */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onReject(req.id)}
                    className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-[#D81124] text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAccept(req.id)}
                    className="px-4 py-2 bg-[#181E54] hover:bg-[#121642] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>
                </div>
              </div>
            ))
          )}
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
