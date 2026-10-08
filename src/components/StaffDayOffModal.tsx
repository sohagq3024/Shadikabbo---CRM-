import React, { useState, useEffect } from 'react';
import {
  X,
  CalendarCheck,
  CalendarOff,
  User,
  Shield,
  Save,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

interface StaffDayOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSuccess?: () => void;
}

interface StaffMember {
  id: string;
  name: string;
  role: 'CRO' | 'MK' | string;
  phone: string;
  weeklyOffDays: string[];
}

const ALL_DAYS = [
  { key: 'Friday', label: 'Friday', labelBn: 'শুক্রবার', short: 'Fri' },
  { key: 'Saturday', label: 'Saturday', labelBn: 'শনিবার', short: 'Sat' },
  { key: 'Sunday', label: 'Sunday', labelBn: 'রবিবার', short: 'Sun' },
  { key: 'Monday', label: 'Monday', labelBn: 'সোমবার', short: 'Mon' },
  { key: 'Tuesday', label: 'Tuesday', labelBn: 'মঙ্গলবার', short: 'Tue' },
  { key: 'Wednesday', label: 'Wednesday', labelBn: 'বুধবার', short: 'Wed' },
  { key: 'Thursday', label: 'Thursday', labelBn: 'বৃহস্পতিবার', short: 'Thu' },
];

export const StaffDayOffModal: React.FC<StaffDayOffModalProps> = ({
  isOpen,
  onClose,
  token,
  onSuccess,
}) => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Local state for edits: mapping userId -> string[] of day names
  const [selectedDays, setSelectedDays] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!isOpen) return;

    const fetchDayOffSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/attendance/day-off-settings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load staff day-off settings');
        const json = await res.json();
        const list: StaffMember[] = json.staff || [];
        setStaffList(list);

        const initialMap: Record<string, string[]> = {};
        list.forEach((s) => {
          initialMap[s.id] = Array.isArray(s.weeklyOffDays) && s.weeklyOffDays.length > 0
            ? [...s.weeklyOffDays]
            : ['Friday'];
        });
        setSelectedDays(initialMap);
      } catch (err: any) {
        setError(err.message || 'Error fetching day-off settings');
      } finally {
        setLoading(false);
      }
    };

    fetchDayOffSettings();
  }, [isOpen, token]);

  if (!isOpen) return null;

  const toggleDay = (userId: string, dayKey: string) => {
    setSelectedDays((prev) => {
      const current = prev[userId] || [];
      const has = current.some((d) => d.toLowerCase() === dayKey.toLowerCase());
      let updated: string[];
      if (has) {
        updated = current.filter((d) => d.toLowerCase() !== dayKey.toLowerCase());
        // Always ensure at least 1 day or empty if they have rotational
      } else {
        updated = [...current, dayKey];
      }
      return { ...prev, [userId]: updated };
    });
  };

  const setSinglePreset = (userId: string, dayKey: string) => {
    setSelectedDays((prev) => ({
      ...prev,
      [userId]: [dayKey],
    }));
  };

  const handleSaveIndividual = async (userId: string) => {
    setSavingId(userId);
    setError(null);
    setSuccessMessage(null);
    try {
      const days = selectedDays[userId] || ['Friday'];
      const res = await fetch('/api/attendance/day-off-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          weeklyOffDays: days,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to update day off');
      }

      setSuccessMessage('Weekly day-off saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error saving day-off');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updates = Object.entries(selectedDays).map(([userId, weeklyOffDays]) => ({
        userId,
        weeklyOffDays: weeklyOffDays.length > 0 ? weeklyOffDays : ['Friday'],
      }));

      const res = await fetch('/api/attendance/day-off-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to update all staff schedules');
      }

      setSuccessMessage('All staff weekly day-off schedules updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3500);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error saving schedules');
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#181E54] to-[#2D3A8C] text-white flex items-center justify-center shadow-md">
              <CalendarOff className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#181E54]">Staff Weekly Day-Off Settings</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  CRO &amp; MK Schedule
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign individual weekly day-off for each staff member. Staff on their day off will not be marked Absent.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Office Time Banner */}
        <div className="my-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Clock className="w-4 h-4 text-[#D81124]" />
            <span>
              Official Office Hours: <strong>10:00 AM – 06:00 PM</strong> (সকাল ১০:০০ টা – বিকাল ০৬:০০ টা)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <span>Click day chips to toggle day-off for each employee</span>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Staff List Body */}
        <div className="py-2 overflow-y-auto flex-1 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 pr-1">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-[#181E54] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading staff day-off configurations...</p>
            </div>
          ) : staffList.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-semibold text-slate-700">No CRO or MK staff found</p>
              <p className="text-xs mt-1">Add staff users to configure attendance schedules.</p>
            </div>
          ) : (
            staffList.map((staff) => {
              const userOffDays = selectedDays[staff.id] || [];
              const isSavingThis = savingId === staff.id;

              return (
                <div
                  key={staff.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#181E54] text-white flex items-center justify-center font-bold text-xs">
                        {staff.role}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{staff.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              staff.role === 'CRO'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {staff.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {staff.phone || 'No phone'} · Current: {userOffDays.join(', ') || 'None'}
                        </p>
                      </div>
                    </div>

                    {/* Quick presets & individual save */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSinglePreset(staff.id, 'Friday')}
                        className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                        title="Set Friday as Day Off"
                      >
                        Fri Only
                      </button>
                      <button
                        type="button"
                        onClick={() => setSinglePreset(staff.id, 'Saturday')}
                        className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                        title="Set Saturday as Day Off"
                      >
                        Sat Only
                      </button>
                      <button
                        type="button"
                        onClick={() => setSinglePreset(staff.id, 'Sunday')}
                        className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                        title="Set Sunday as Day Off"
                      >
                        Sun Only
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveIndividual(staff.id)}
                        disabled={isSavingThis}
                        className="px-3 py-1.5 bg-[#181E54] hover:bg-[#121742] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
                      >
                        {isSavingThis ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Save</span>
                      </button>
                    </div>
                  </div>

                  {/* Day Selection Chips */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">
                      Day Off:
                    </span>
                    {ALL_DAYS.map((day) => {
                      const isSelected = userOffDays.some(
                        (d) => d.toLowerCase() === day.key.toLowerCase()
                      );

                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => toggleDay(staff.id, day.key)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                            isSelected
                              ? 'bg-rose-50 text-[#D81124] border-rose-300 shadow-2xs font-bold ring-1 ring-rose-300'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? (
                            <CalendarOff className="w-3.5 h-3.5 text-[#D81124]" />
                          ) : (
                            <CalendarCheck className="w-3.5 h-3.5 opacity-40" />
                          )}
                          <span>{day.label}</span>
                          <span className="text-[10px] opacity-75 font-normal">({day.labelBn})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0 flex-wrap gap-2">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Changes take effect immediately across summary table and staff scanner.</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={savingAll || loading}
              className="px-5 py-2 bg-gradient-to-r from-[#181E54] to-[#2D3A8C] hover:shadow-md text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {savingAll ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save All Schedules</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
