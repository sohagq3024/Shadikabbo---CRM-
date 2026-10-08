import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  AlertCircle,
  Users,
  Crown,
  Sparkles,
  Check,
  ShieldCheck,
} from 'lucide-react';

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
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch CRO and MK role accounts
    Promise.all([
      fetch('/api/users?role=CRO', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch('/api/users?role=MK', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([croList, mkList]) => {
        const combined = [
          ...(Array.isArray(croList) ? croList : []),
          ...(Array.isArray(mkList) ? mkList : []),
        ];
        setAccounts(combined);

        // Pre-select existing assignees
        if (Array.isArray(traffic.assignedMKs) && traffic.assignedMKs.length > 0) {
          const ids = traffic.assignedMKs.map((m: any) => m.id).filter(Boolean);
          setSelectedAccountIds(ids);
        } else if (traffic.assignedTo?.id) {
          setSelectedAccountIds([traffic.assignedTo.id]);
        } else {
          // Pre-select first MK account by default if none
          const firstMk = combined.find((a) => a.role === 'MK') || combined[0];
          if (firstMk) setSelectedAccountIds([firstMk.id]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch accounts:', err);
      });
  }, [isOpen, token, traffic]);

  if (!isOpen || !traffic) return null;

  const toggleAccount = (accId: string) => {
    setSelectedAccountIds((prev) => {
      if (prev.includes(accId)) {
        // Prevent deselecting all (keep at least 1)
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== accId);
      } else {
        return [...prev, accId];
      }
    });
  };

  // VIP / Package Quick Presets
  const isVipPackage =
    traffic.package?.toLowerCase().includes('vip') ||
    traffic.package?.toLowerCase().includes('gold') ||
    traffic.package?.toLowerCase().includes('platinum') ||
    traffic.package?.toLowerCase().includes('diamond');

  const selectAllMks = () => {
    const mkIds = accounts.filter((a) => a.role === 'MK').map((a) => a.id);
    if (mkIds.length > 0) {
      setSelectedAccountIds(mkIds);
    }
  };

  const selectSinglePrimary = (id: string) => {
    setSelectedAccountIds([id]);
  };

  const handleSave = async () => {
    setError(null);
    const selectedList = accounts.filter((a) => selectedAccountIds.includes(a.id));
    if (selectedList.length === 0) {
      setError('Please select at least one responsible account.');
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
          assignedMKs: selectedList.map((a) => ({
            id: a.id,
            name: a.name,
            role: a.role,
          })),
          assignedName: selectedList[0].name,
          role: selectedList[0].role,
        }),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Failed to update assignment');
      }

      onChangeSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#181E54] text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5 text-[#D81124]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#181E54]">Client Assignment</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#181E54]/10 text-[#181E54]">
                  Multi-Assign
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Allocate single or multiple MK officers according to package
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Client summary pill */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-800">
                Paid Client: <span className="text-[#181E54] font-bold">{traffic.name}</span>{' '}
                <span className="text-slate-500 font-mono">({traffic.id})</span>
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                <span className="font-semibold text-[#181E54] bg-[#181E54]/10 px-2 py-0.5 rounded-md">
                  {traffic.package || 'Standard Package'}
                </span>
                <span>•</span>
                <span>{traffic.profession || 'Professional'}</span>
              </div>
            </div>

            {isVipPackage && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span>VIP Tier</span>
              </div>
            )}
          </div>

          {/* Quick Package Presets */}
          <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200/80 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[#181E54] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Package Allocation Quick Presets:</span>
              </span>
              <span className="text-[10px] text-slate-500">Manual selection enabled below</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAllMks}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-blue-200 text-slate-800 text-xs font-semibold hover:border-[#181E54] hover:bg-blue-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Users className="w-3.5 h-3.5 text-[#181E54]" />
                <span>Select All MK Officers (VIP / Priority)</span>
              </button>

              {accounts.filter((a) => a.role === 'MK')[0] && (
                <button
                  type="button"
                  onClick={() => selectSinglePrimary(accounts.filter((a) => a.role === 'MK')[0].id)}
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-blue-200 text-slate-800 text-xs font-semibold hover:border-[#181E54] hover:bg-blue-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Single MK (Standard)</span>
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#D81124]" />
              <span>{error}</span>
            </div>
          )}

          {/* Account checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Select Responsible Account(s):
              </label>
              <span className="text-xs font-bold text-[#181E54]">
                {selectedAccountIds.length} Account{selectedAccountIds.length > 1 ? 's' : ''} Selected
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto p-1">
              {accounts.map((acc) => {
                const isSelected = selectedAccountIds.includes(acc.id);
                const isMK = acc.role === 'MK';

                return (
                  <label
                    key={acc.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#181E54] bg-[#181E54]/5 ring-1 ring-[#181E54] shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#181E54] border-[#181E54] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>

                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isSelected}
                        onChange={() => toggleAccount(acc.id)}
                      />

                      <div>
                        <p className="text-xs font-bold text-slate-900">{acc.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{acc.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isMK ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {acc.role}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                          Assigned
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">
            {selectedAccountIds.length > 1
              ? 'Multi-assigned accounts will collaboratively share client matchmaking pool'
              : 'Assigned account will be primary point of contact for this client'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || selectedAccountIds.length === 0}
              className="px-5 py-2 bg-[#181E54] hover:bg-[#121642] text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>{loading ? 'Saving...' : `Save Assignment (${selectedAccountIds.length})`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
