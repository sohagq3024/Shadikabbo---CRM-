import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Camera,
  RefreshCw,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface StaffAttendancePageProps {
  user: any;
  token: string;
  onOpenScanner?: () => void;
}

export const StaffAttendancePage: React.FC<StaffAttendancePageProps> = ({
  user,
  token,
  onOpenScanner,
}) => {
  const currentMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<any | null>(null);

  const loadMyAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/attendance/employee/${user.id}?month=${selectedMonth}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Failed to load personal attendance records');
      }
      const data = await res.json();
      setAttendanceData(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching attendance logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadMyAttendance();
    }
  }, [user?.id, selectedMonth, token]);

  const summary = attendanceData?.summary || {
    presentCount: 0,
    absentCount: 0,
    dayOffCount: 0,
    totalLateMinutes: 0,
    totalEarlyOutMinutes: 0,
  };

  const dailyLogs = attendanceData?.dailyLogs || [];

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* ==================================================
          PAGE HEADER: Title & Single "Add to Home Scan" Button
          "upore only akta button thakbe add to home scan er jonno"
      ================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#181E54] text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-[#181E54] tracking-tight">
                  My Attendance History
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#181E54]/10 text-[#181E54]">
                  {user?.role} Staff
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Logged in as <span className="font-semibold text-slate-700">{user?.name}</span> ({user?.phone})
              </p>
            </div>
          </div>

          {/* Top Right Actions: Single scanner button and install */}
          <div className="flex items-center gap-2.5">
            <PWAInstallButton />

            {onOpenScanner && (
              <button
                type="button"
                onClick={onOpenScanner}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#181E54] hover:bg-[#121742] text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-sm cursor-pointer"
                title="Scan official office QR code for Daily In-Time or Out-Time"
              >
                <Camera className="w-4 h-4 text-[#D81124]" />
                <span>Open QR Scanner</span>
              </button>
            )}
          </div>
        </div>

        {/* Month Selector & Summary Metrics */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Select Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-[#181E54] focus:outline-none focus:border-[#181E54]"
            />
            <button
              type="button"
              onClick={loadMyAttendance}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              title="Refresh logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Monthly KPI Stats */}
          <div className="flex items-center gap-3 text-xs">
            <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Present: {summary.presentCount} days</span>
            </div>
            {summary.totalLateMinutes > 0 && (
              <div className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Late: {summary.totalLateMinutes} mins</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================
          PERSONAL ATTENDANCE LOG TABLE (Read-Only)
          Columns: Date, Day, In-Time, Out-Time, Late, Early Out, Hours, Status
      ================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-[#181E54] border-t-[#D81124] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Fetching attendance records...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-600 px-4">
            <p className="text-xs font-semibold">{error}</p>
            <button
              onClick={loadMyAttendance}
              className="mt-3 px-3 py-1.5 text-xs bg-[#181E54] text-white rounded-lg font-medium cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : dailyLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 px-4">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-700">No attendance entries for this month</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3.5">Day</th>
                  <th className="py-3 px-3.5">In-Time</th>
                  <th className="py-3 px-3.5">Out-Time</th>
                  <th className="py-3 px-3.5">Late Mins</th>
                  <th className="py-3 px-3.5">Working Duration</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-mono">
                {dailyLogs.map((log: any) => {
                  const isPresent = log.status === 'present';
                  const isDayOff = log.status === 'day_off' || log.isDayOff;
                  const isAbsent = log.status === 'absent';
                  const isFuture = log.status === 'future';

                  return (
                    <tr
                      key={log.date}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isDayOff ? 'bg-slate-50/40 text-slate-400' : ''
                      }`}
                    >
                      {/* 1. Date */}
                      <td className="py-2.5 px-4 font-bold text-slate-800">
                        {log.date}
                      </td>

                      {/* 2. Day Name */}
                      <td className="py-2.5 px-3.5 font-sans font-medium text-slate-600">
                        {log.dayName}
                      </td>

                      {/* 3. In-Time */}
                      <td className="py-2.5 px-3.5 font-semibold">
                        {isPresent ? (
                          <span
                            className={
                              log.lateMinutes > 0 ? 'text-amber-600' : 'text-emerald-700'
                            }
                          >
                            {log.inTime}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* 4. Out-Time */}
                      <td className="py-2.5 px-3.5 font-semibold text-slate-700">
                        {isPresent && log.outTime ? (
                          <span>{log.outTime}</span>
                        ) : isPresent ? (
                          <span className="text-blue-600 font-sans text-[11px] font-semibold">In Office</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* 5. Late Minutes */}
                      <td className="py-2.5 px-3.5">
                        {log.lateMinutes > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                            {log.lateMinutes} m late
                          </span>
                        ) : isPresent ? (
                          <span className="text-emerald-600 text-[10px] font-sans font-bold">On Time</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* 6. Working Duration */}
                      <td className="py-2.5 px-3.5 text-slate-600">
                        {log.workDuration || '-'}
                      </td>

                      {/* 7. Status */}
                      <td className="py-2.5 px-4 text-right font-sans">
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            Present
                          </span>
                        ) : isDayOff ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            Day Off
                          </span>
                        ) : isFuture ? (
                          <span className="text-slate-300 text-[10px] italic">Upcoming</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            <XCircle className="w-3 h-3" />
                            Absent
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
