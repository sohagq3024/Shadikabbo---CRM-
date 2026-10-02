import React, { useState, useEffect } from 'react';
import { X, UserCheck, AlertCircle } from 'lucide-react';

interface ChangeAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  traffic: any;
  token: string;
  onChangeSuccess: () => void;
}

export const ChangeAssignModal: React.FC<ChangeAssignModalProps> = ({
  isOpen,
  onClose,
  traffic,
  token,
  onChangeSuccess,
}) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch CRO and MK role accounts
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

  const handleSave = async () => {
    setError(null);
    const target = accounts.find((a) => a.id === selectedAccountId);
    if (!target) {
      setError('Please select an account.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/paid-traffic/${traffic.id}/change-assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignedId: target.id,
          assignedName: target.name,
          role: target.role,
        }),
      });

      if (!response.ok) throw new Error('Failed to update assignment');
      onChangeSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-[#181E54] font-bold">
            <UserCheck className="w-5 h-5 text-[#D81124]" />
            <span>Change Assign</span>
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
              Paid Client: <span className="text-[#181E54] font-bold">{traffic.name}</span> ({traffic.id})
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
              Select Responsible Account (CRO / MK):
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
                      name="assignAccount"
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
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2 bg-[#181E54] hover:bg-[#121642] text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Update Assignee'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
