import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, UserCheck, AlertCircle } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  traffic: any;
  token: string;
  onTransferSuccess: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  traffic,
  token,
  onTransferSuccess,
}) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch both CRO and MK role accounts
    Promise.all([
      fetch('/api/users?role=CRO', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/users?role=MK', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([croList, mkList]) => {
        const combined = [
          ...(Array.isArray(croList) ? croList : []),
          ...(Array.isArray(mkList) ? mkList : []),
        ];
        setAccounts(combined);
        if (combined.length > 0) {
          setSelectedAccountId(combined[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch accounts:', err);
      });
  }, [isOpen, token]);

  if (!isOpen || !traffic) return null;

  const handleTransfer = async () => {
    setError(null);
    const targetAccount = accounts.find((a) => a.id === selectedAccountId);
    if (!targetAccount) {
      setError('Please select an account to transfer to.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/traffic/${traffic.id}/transfer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetAccountId: targetAccount.id,
          targetAccountName: targetAccount.name,
          targetRole: targetAccount.role,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to transfer traffic');
      }

      onTransferSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 flex items-center justify-center p-3 transition-opacity duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-[#181E54] font-bold">
            <ArrowRightLeft className="w-5 h-5 text-[#D81124]" />
            <span>Transfer Traffic</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <p className="font-semibold text-slate-800">
              Transferring: <span className="text-[#181E54] font-bold">{traffic.name}</span> ({traffic.id})
            </p>
            <p className="text-slate-500 mt-0.5">
              Current Assignee: <span className="font-medium text-slate-700">{traffic.assignBy || 'Unassigned'}</span>
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#D81124]" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select CRO or MK Role Account:
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto p-1">
              {accounts.map((acc) => (
                <label
                  key={acc.id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedAccountId === acc.id
                      ? 'border-[#181E54] bg-[#181E54]/5 ring-1 ring-[#181E54]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="transferAccount"
                      value={acc.id}
                      checked={selectedAccountId === acc.id}
                      onChange={() => setSelectedAccountId(acc.id)}
                      className="text-[#181E54] focus:ring-[#181E54]"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{acc.name}</p>
                      <p className="text-[11px] text-slate-500">{acc.phone}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      acc.role === 'CRO'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {acc.role}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleTransfer}
            disabled={loading}
            className="px-5 py-2 bg-[#181E54] hover:bg-[#121642] text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>{loading ? 'Transferring...' : 'Confirm Transfer'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
