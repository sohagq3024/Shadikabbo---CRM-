import React from 'react';
import { X, Calendar, Users, CheckCircle2, XCircle, Clock, AlertTriangle, Briefcase, Phone } from 'lucide-react';

interface AttendanceDailyModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  token: string;
}

export const AttendanceDailyModal: React.FC<AttendanceDailyModalProps> = ({
  isOpen,
  onClose,
  date,
  token,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen || !date) return;

    const fetchDailyDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/attendance/date/${date}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load daily attendance');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Error fetching details');
      } finally {
        setLoading(false);
      }
    };

    fetchDailyDetails();
  }, [isOpen, date, token]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#181E54] to-[#2D3A8C] text-white flex items-center justify-center shadow-md">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#181E54]">Daily Attendance Details</h2>
                {data?.isFriday && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Weekly Holiday (Friday)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {data?.dayName || date} · Total Staff (MK & CRO): <strong>{data?.totalEmployees || 0}</strong>
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

        {/* Content Body with smooth scrolling */}
        <div className="py-4 overflow-y-auto flex-1 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 pr-1">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-[#181E54] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading attendance details for {date}...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
              {error}
            </div>
          ) : (
            <>
              {/* Summary Stats Pill Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Present</p>
                    <p className="text-xl font-bold text-emerald-950">{data.presentCount}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">Absent</p>
                    <p className="text-xl font-bold text-rose-950">{data.absentCount}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-600 text-white flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Day Off</p>
                    <p className="text-xl font-bold text-slate-900">{data.dayOffCount}</p>
                  </div>
                </div>
              </div>

              {/* LIST 1: PRESENT EMPLOYEES */}
              <div className="bg-emerald-50/30 rounded-2xl border border-emerald-200/80 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="font-bold text-sm text-emerald-950">
                      Present Staff ({data.presentList?.length || 0})
                    </h3>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Office standard: 09:30 AM – 06:30 PM
                  </span>
                </div>

                {data.presentList?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No staff were marked present on this date.</p>
                ) : (
                  <div className="space-y-2">
                    {data.presentList.map((emp: any) => (
                      <div
                        key={emp.id}
                        className="bg-white p-3 rounded-xl border border-emerald-100 flex items-center justify-between flex-wrap gap-2 shadow-2xs hover:border-emerald-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="w-9 h-9 rounded-xl bg-[#181E54] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.role}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[#181E54] flex items-center gap-1.5">
                              <span>{emp.name}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {emp.role}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-slate-400" />
                              <span>{emp.phone || 'No phone'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Timing & Late details */}
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <div className="text-left">
                            <span className="text-[10px] font-sans text-slate-400 block">In-Time</span>
                            <span className="font-semibold text-emerald-700">{emp.inTime}</span>
                          </div>

                          <div className="text-left">
                            <span className="text-[10px] font-sans text-slate-400 block">Out-Time</span>
                            <span className="font-semibold text-slate-800">{emp.outTime}</span>
                          </div>

                          <div className="text-right flex flex-col items-end gap-0.5">
                            {emp.lateMinutes > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Late: {emp.lateMinutes}m
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                On Time
                              </span>
                            )}
                            {emp.scanMethod === 'offline_synced' && (
                              <span className="text-[9px] font-sans font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200" title="Recorded while offline and synced via Service Worker">
                                💾 Offline Synced
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LIST 2: ABSENT EMPLOYEES */}
              <div className="bg-rose-50/30 rounded-2xl border border-rose-200/80 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <h3 className="font-bold text-sm text-rose-950">
                      Absent Staff ({data.absentList?.length || 0})
                    </h3>
                  </div>
                </div>

                {data.absentList?.length === 0 ? (
                  <p className="text-xs text-emerald-700 font-medium py-1">
                    ✓ 100% Attendance! No staff were absent on this working date.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.absentList.map((emp: any) => (
                      <div
                        key={emp.id}
                        className="bg-white p-3 rounded-xl border border-rose-100 flex items-center justify-between flex-wrap gap-2 shadow-2xs hover:border-rose-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.role}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                              <span>{emp.name}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                {emp.role}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-slate-400" />
                              <span>{emp.phone || 'No phone'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Absent
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LIST 3: DAY OFF (IF ANY) */}
              {data.dayOffList?.length > 0 && (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <h3 className="font-bold text-xs text-slate-700">
                      Day Off / Holiday ({data.dayOffList.length})
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {data.dayOffList.map((emp: any) => (
                      <span
                        key={emp.id}
                        className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{emp.role}:</span>
                        {emp.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#181E54] text-white text-xs font-bold rounded-xl hover:bg-[#121742] transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
