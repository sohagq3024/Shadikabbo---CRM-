import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Briefcase,
  Phone,
  FileSpreadsheet,
  HardDrive,
} from 'lucide-react';

interface AttendanceMonthlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  token: string;
}

export const AttendanceMonthlyModal: React.FC<AttendanceMonthlyModalProps> = ({
  isOpen,
  onClose,
  userId,
  token,
}) => {
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchMonthlyLog = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/attendance/employee/${userId}?month=${currentMonth}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load employee monthly log');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Error fetching monthly log');
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyLog();
  }, [isOpen, userId, currentMonth, token]);

  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setCurrentMonth(
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    setCurrentMonth(
      `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl xl:max-w-7xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#181E54] text-white flex items-center justify-center font-bold text-base shadow-md">
              {data?.employee?.role || 'EMP'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#181E54]">
                  {data?.employee?.name || 'Staff Member'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Role: {data?.employee?.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{data?.employee?.phone || 'No phone'}</span>
                <span>•</span>
                <span>Employee ID: {data?.employee?.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Month Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white rounded-xl text-slate-600 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-[#181E54] px-2 min-w-[110px] text-center">
                {data?.monthName || currentMonth}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white rounded-xl text-slate-600 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="py-4 overflow-y-auto flex-1 space-y-5">
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-[#181E54] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading monthly logs for {data?.employee?.name}...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
              {error}
            </div>
          ) : (
            <>
              {/* Monthly Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Days in Month</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{data.stats.totalDays}</p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <p className="text-[10px] font-semibold text-emerald-700 uppercase">Present Days</p>
                  <p className="text-lg font-bold text-emerald-900 mt-0.5">{data.stats.presentCount}</p>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                  <p className="text-[10px] font-semibold text-rose-700 uppercase">Absent Days</p>
                  <p className="text-lg font-bold text-rose-900 mt-0.5">{data.stats.absentCount}</p>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                  <p className="text-[10px] font-semibold text-amber-700 uppercase">Day Off</p>
                  <p className="text-lg font-bold text-amber-900 mt-0.5">{data.stats.dayOffCount}</p>
                </div>

                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-center">
                  <p className="text-[10px] font-semibold text-purple-700 uppercase">Total Late</p>
                  <p className="text-lg font-bold text-purple-900 mt-0.5">{data.stats.totalLateMinutes}m</p>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                  <p className="text-[10px] font-semibold text-blue-700 uppercase">Early Out</p>
                  <p className="text-lg font-bold text-blue-900 mt-0.5">{data.stats.totalEarlyOutMinutes}m</p>
                </div>
              </div>

              {/* Monthly Log Table with sticky header and vertical scrolling */}
              <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs bg-white">
                <div className="overflow-x-auto overflow-y-auto max-h-[440px] scrollbar-thin scrollbar-thumb-slate-300">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#181E54] text-white uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-xs">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Date &amp; Day</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                        <th className="py-2.5 px-3 font-semibold">In-Time</th>
                        <th className="py-2.5 px-3 font-semibold">Out-Time</th>
                        <th className="py-2.5 px-3 font-semibold">Late Minutes</th>
                        <th className="py-2.5 px-3 font-semibold">Early Out Minutes</th>
                        <th className="py-2.5 px-3 font-semibold">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {data.dailyLogs.map((log: any) => {
                        const isDayOff = log.status === 'day_off' || log.isDayOff;
                        const isAbsent = log.status === 'absent';
                        const isPresent = log.status === 'present';
                        const isFuture = log.status === 'future';

                        return (
                          <tr
                            key={log.date}
                            className={`hover:bg-slate-50 transition-colors ${
                              isDayOff
                                ? 'bg-slate-50/60'
                                : isAbsent
                                ? 'bg-rose-50/30'
                                : ''
                            }`}
                          >
                            {/* Date & Day */}
                            <td className="py-2 px-3 font-mono font-medium whitespace-nowrap">
                              <span className="font-bold text-slate-800">{log.date}</span>
                              <span
                                className={`ml-2 text-[10px] font-sans font-semibold px-1.5 py-0.2 rounded ${
                                  log.isDayOff
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {log.dayName}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-2 px-3 whitespace-nowrap">
                              {isPresent && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Present
                                </span>
                              )}
                              {isAbsent && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  Absent
                                </span>
                              )}
                              {isDayOff && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                  Day Off ({log.dayOffReason || log.dayName})
                                </span>
                              )}
                              {isFuture && (
                                <span className="text-[10px] text-slate-400 italic font-mono">-</span>
                              )}
                            </td>

                            {/* In-Time */}
                            <td className="py-2 px-3 font-mono font-semibold whitespace-nowrap">
                              {isPresent ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-emerald-700">{log.inTime}</span>
                                  {log.scanMethod === 'offline_synced' && (
                                    <span className="text-[9px] font-sans font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1" title="Synced from offline scan">
                                      <HardDrive className="w-2.5 h-2.5" /> Offline
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">{log.inTime}</span>
                              )}
                            </td>

                            {/* Out-Time */}
                            <td className="py-2 px-3 font-mono font-semibold whitespace-nowrap">
                              {isPresent ? (
                                <span className="text-slate-800">{log.outTime}</span>
                              ) : (
                                <span className="text-slate-400">{log.outTime}</span>
                              )}
                            </td>

                            {/* Late Minutes */}
                            <td className="py-2 px-3 whitespace-nowrap">
                              {isPresent && log.lateMinutes > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  {log.lateMinutes} mins late
                                </span>
                              ) : isPresent ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  0 mins (On Time)
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono">-</span>
                              )}
                            </td>

                            {/* Early Out Minutes */}
                            <td className="py-2 px-3 whitespace-nowrap">
                              {isPresent && log.earlyOutMinutes > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-300">
                                  <TrendingDown className="w-3 h-3 text-purple-600" />
                                  {log.earlyOutMinutes} mins early
                                </span>
                              ) : isPresent ? (
                                <span className="text-[10px] font-medium text-slate-500">0 mins</span>
                              ) : (
                                <span className="text-slate-400 font-mono">-</span>
                              )}
                            </td>

                            {/* Work Duration */}
                            <td className="py-2 px-3 font-mono text-slate-700 whitespace-nowrap">
                              {log.workDuration}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0 flex-wrap gap-2">
          <div className="text-xs text-slate-500">
            Official Work Hours: <strong>10:00 AM to 06:00 PM</strong> · Assigned Weekly Off: <strong>{data.userWeeklyOffDays?.join(', ') || 'Friday'}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#181E54] text-white text-xs font-bold rounded-xl hover:bg-[#121742] transition-colors cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
