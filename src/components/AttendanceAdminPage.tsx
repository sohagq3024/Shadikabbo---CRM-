import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  QrCode,
  Search,
  UserCheck,
  ChevronRight,
  Camera,
  RefreshCw,
  Plus,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { AttendanceDailyModal } from './AttendanceDailyModal';
import { AttendanceMonthlyModal } from './AttendanceMonthlyModal';
import { OfficeQrCodeModal } from './OfficeQrCodeModal';
import { ManualAttendanceModal } from './ManualAttendanceModal';

interface AttendanceAdminPageProps {
  token: string;
  onOpenScanner?: () => void;
}

export const AttendanceAdminPage: React.FC<AttendanceAdminPageProps> = ({
  token,
  onOpenScanner,
}) => {
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchDate, setSearchDate] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');

  // Modals state
  const [selectedDateForModal, setSelectedDateForModal] = useState<string | null>(null);
  const [selectedUserForMonthlyModal, setSelectedUserForMonthlyModal] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Real Summary Table (includes today + all actual recorded dates)
      const queryParam = searchDate ? `?date=${encodeURIComponent(searchDate)}` : '';
      const summaryRes = await fetch(`/api/attendance/summary${queryParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!summaryRes.ok) throw new Error('Failed to load attendance summary');
      const summaryJson = await summaryRes.json();
      setSummaryData(summaryJson.summary || []);
      setTotalEmployees(summaryJson.totalEmployees || 0);

      // 2. Fetch Staff List (MK & CRO only)
      const staffRes = await fetch('/api/attendance/staff-list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (staffRes.ok) {
        const staffJson = await staffRes.json();
        setStaffList(staffJson.staff || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, searchDate]);

  // Today's summary stats
  const todayStats = useMemo(() => {
    if (summaryData.length === 0) return null;
    return summaryData[0]; // First item is latest / today
  }, [summaryData]);

  // Filtered Summary Rows
  const filteredRows = useMemo(() => {
    return summaryData.filter((row) => {
      if (searchDate && !row.date.includes(searchDate)) {
        return false;
      }
      return true;
    });
  }, [summaryData, searchDate]);

  const handleSelectEmployee = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedStaffId(id);
    if (id) {
      setSelectedUserForMonthlyModal(id);
    }
  };

  return (
    <div className="space-y-5 pb-16 max-w-full overflow-y-auto">
      {/* TOP BANNER & REAL WORKFLOW ACTION BAR */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#181E54]">
              Staff Attendance Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time QR Attendance · Counting MK &amp; CRO staff ({totalEmployees} Total Staff · Super Admin excluded)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Requirement 5: Specific Person Monthly Report Select Dropdown */}
          <div className="relative min-w-[210px]">
            <select
              value={selectedStaffId}
              onChange={handleSelectEmployee}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-[#181E54] focus:outline-none focus:ring-2 focus:ring-[#181E54] cursor-pointer shadow-2xs hover:bg-slate-100 transition-colors"
            >
              <option value="">👤 Select Employee Monthly Log...</option>
              {staffList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>

          {/* Real HR Action: Manual Attendance / Leave Entry Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            title="Record manual attendance or official leave"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Entry</span>
          </button>

          {/* Office QR Code Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#181E54] text-white rounded-xl text-xs font-bold hover:bg-[#121742] transition-colors cursor-pointer shadow-xs"
            title="Display and print official office QR code"
          >
            <QrCode className="w-4 h-4 text-white" />
            <span>Office QR Code</span>
          </button>

          {/* Test / Open Camera Scanner Button */}
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#D81124] to-[#B50E1D] text-white rounded-xl text-xs font-bold hover:shadow-md transition-all cursor-pointer"
              title="Launch full-screen attendance scanner"
            >
              <Camera className="w-4 h-4 text-white" />
              <span>Open Scanner</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Refresh Attendance Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* REAL KPI CARDS: TODAY'S REAL SNAPSHOT */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Staff (MK & CRO only) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Employees
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#181E54] flex items-center justify-center font-bold text-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#181E54]">{totalEmployees}</p>
          <p className="text-[11px] text-slate-400 mt-1">MK &amp; CRO Accounts only</p>
        </div>

        {/* 2. Present Total (Real Today Scans) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Present Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-900">
            {todayStats?.presentTotal ?? 0}
          </p>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">
            {todayStats?.presentTotal === 0 ? 'No scans recorded yet' : `${todayStats?.presentTotal} verified scan(s)`}
          </p>
        </div>

        {/* 3. Absent Total */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Absent Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-900">
            {todayStats?.absentTotal ?? 0}
          </p>
          <p className="text-[11px] text-rose-700 mt-1 font-medium">
            {todayStats?.isFriday ? 'Friday (Holiday)' : 'Pending attendance scan'}
          </p>
        </div>

        {/* 4. Day Off Total */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Day Off Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {todayStats?.dayOffTotal ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {todayStats?.isFriday ? 'Friday Weekly Holiday' : 'Approved Leave / Off'}
          </p>
        </div>
      </div>

      {/* FILTER CONTROLS FOR DATE SEARCH */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative w-full">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
            />
          </div>
          {searchDate && (
            <button
              type="button"
              onClick={() => setSearchDate('')}
              className="text-xs text-[#D81124] hover:underline font-semibold whitespace-nowrap cursor-pointer px-2"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Click any row to open the daily <strong>Present</strong> &amp; <strong>Absent</strong> employee list.</span>
        </div>
      </div>

      {/* REQUIREMENT 3: ATTENDANCE SUMMARY TABLE WITH DEDICATED SCROLLING SYSTEM */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs border-b border-red-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Table Viewport: Horizontal & Vertical Scrolling system with Sticky Header */}
        <div className="overflow-x-auto overflow-y-auto max-h-[580px] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          <table className="w-full text-left text-xs min-w-[700px] border-collapse">
            <thead className="bg-[#181E54] text-white uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Total Employee</th>
                <th className="py-3 px-4 font-semibold">Present Total</th>
                <th className="py-3 px-4 font-semibold">Absent Total</th>
                <th className="py-3 px-4 font-semibold">Day Off Total</th>
                <th className="py-3 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-7 h-7 border-2 border-[#181E54] border-t-transparent rounded-full animate-spin" />
                      <span>Loading attendance records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-700 mb-1">No attendance logs found</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {searchDate
                        ? 'No records match the chosen date filter.'
                        : 'Attendance records will appear here as staff scan the office QR code or when manual attendance is added.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.date}
                    onClick={() => setSelectedDateForModal(row.date)}
                    className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                    title="Click to view full Present and Absent staff list"
                  >
                    {/* 1. Date */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 font-mono font-bold text-slate-900 group-hover:text-[#D81124] transition-colors">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#D81124]" />
                        <span>{row.date}</span>
                        <span
                          className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full ${
                            row.isFriday
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {row.dayName}
                        </span>
                        {row.date === todayStats?.date && (
                          <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-sans font-bold">
                            Today
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Total Employee (MK and CRO only) */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md bg-slate-100 font-mono font-bold text-slate-800 text-xs">
                        {row.totalEmployees}
                      </span>
                    </td>

                    {/* 3. Present Total */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {row.presentTotal}
                      </span>
                    </td>

                    {/* 4. Absent Total */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                          row.absentTotal > 0
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {row.absentTotal > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                        {row.absentTotal}
                      </span>
                    </td>

                    {/* 5. Day Off Total */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {row.dayOffTotal}
                      </span>
                    </td>

                    {/* 6. Action Button */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateForModal(row.date);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-[#181E54] text-slate-700 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                        <ChevronRight className="w-3 h-3 opacity-60" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REQUIREMENT 4: SPECIFIC DATE POP-UP MODAL */}
      {selectedDateForModal && (
        <AttendanceDailyModal
          isOpen={!!selectedDateForModal}
          onClose={() => setSelectedDateForModal(null)}
          date={selectedDateForModal}
          token={token}
        />
      )}

      {/* REQUIREMENT 5: SPECIFIC PERSON MONTHLY POP-UP MODAL */}
      {selectedUserForMonthlyModal && (
        <AttendanceMonthlyModal
          isOpen={!!selectedUserForMonthlyModal}
          onClose={() => {
            setSelectedUserForMonthlyModal(null);
            setSelectedStaffId('');
          }}
          userId={selectedUserForMonthlyModal}
          token={token}
        />
      )}

      {/* OFFICE QR CODE MODAL */}
      <OfficeQrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        token={token}
      />

      {/* REAL HR WORKFLOW: MANUAL ATTENDANCE ENTRY MODAL */}
      <ManualAttendanceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        staffList={staffList}
        token={token}
        onSuccess={loadData}
      />
    </div>
  );
};
