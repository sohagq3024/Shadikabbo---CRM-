import React, { useState } from 'react';
import { X, UserCheck, Calendar, Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatBangladeshDateYMD } from '../utils/bangladeshTime';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: any[];
  token: string;
  onSuccess: () => void;
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  staffList,
  token,
  onSuccess,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState(staffList[0]?.id || '');
  const [date, setDate] = useState(() => formatBangladeshDateYMD(new Date()));
  const [status, setStatus] = useState<'present' | 'day_off' | 'absent'>('present');
  const [inTime, setInTime] = useState('10:00 AM');
  const [outTime, setOutTime] = useState('06:00 PM');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedStaffId && staffList.length > 0) {
      setSelectedStaffId(staffList[0].id);
    }
  }, [staffList, selectedStaffId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      setError('Please select an employee');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/attendance/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedStaffId,
          date,
          status,
          inTime: status === 'present' ? inTime : undefined,
          outTime: status === 'present' ? outTime : undefined,
          notes: notes.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update attendance');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error recording attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#181E54] text-white flex items-center justify-center shadow-sm">
              <UserCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#181E54]">Manual Attendance Entry</h3>
              <p className="text-xs text-slate-500">Record attendance or official leave for staff members</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            {/* Left Column: Staff & Date & Notes */}
            <div className="space-y-3.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Employee (MK &amp; CRO)
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                  required
                >
                  {staffList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role}) - {emp.phone || 'No phone'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Attendance Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                  required
                />
              </div>

              {/* Notes / Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason / Official Note
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Official outdoor client visit, sick leave"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                />
              </div>
            </div>

            {/* Right Column: Status & Timings */}
            <div className="space-y-3.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
              {/* Status radio tabs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Attendance Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('present')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      status === 'present'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('day_off')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      status === 'day_off'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Day Off
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('absent')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      status === 'absent'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>

              {/* Time fields if Present */}
              {status === 'present' ? (
                <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      In-Time (e.g. 10:00 AM)
                    </label>
                    <input
                      type="text"
                      value={inTime}
                      onChange={(e) => setInTime(e.target.value)}
                      placeholder="10:00 AM"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Out-Time (e.g. 06:00 PM)
                    </label>
                    <input
                      type="text"
                      value={outTime}
                      onChange={(e) => setOutTime(e.target.value)}
                      placeholder="06:00 PM"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs italic">
                  Timings are only required when status is &quot;Present&quot;.
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#181E54] hover:bg-[#121742] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span>Save Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
