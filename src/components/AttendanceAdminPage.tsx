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
  CalendarOff,
  Phone,
  User,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { AttendanceDailyModal } from './AttendanceDailyModal';
import { AttendanceMonthlyModal } from './AttendanceMonthlyModal';
import { OfficeQrCodeModal } from './OfficeQrCodeModal';
import { ManualAttendanceModal } from './ManualAttendanceModal';
import { StaffDayOffModal } from './StaffDayOffModal';
import { formatBangladeshDateYMD } from '../utils/bangladeshTime';

interface AttendanceAdminPageProps {
  token: string;
  onOpenScanner?: () => void;
}

export const AttendanceAdminPage: React.FC<AttendanceAdminPageProps> = ({
  token,
  onOpenScanner,
}) => {
  // Navigation View: 'daily' (Daily Summary) vs 'individual' (Individual Employee Attendance with Date Filtering)
  const [activeTab, setActiveTab] = useState<'daily' | 'individual'>('daily');

  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for Daily Summary
  const [searchDate, setSearchDate] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');

  // Individual Employee Attendance State & Filters
  const [individualEmpId, setIndividualEmpId] = useState<string>('');
  const [individualMonth, setIndividualMonth] = useState<string>(() => {
    return formatBangladeshDateYMD(new Date()).substring(0, 7);
  });
  const [individualDateFilter, setIndividualDateFilter] = useState<string>('');
  const [individualData, setIndividualData] = useState<any | null>(null);
  const [individualLoading, setIndividualLoading] = useState<boolean>(false);
  const [individualError, setIndividualError] = useState<string | null>(null);

  // Modals state
  const [selectedDateForModal, setSelectedDateForModal] = useState<string | null>(null);
  const [selectedUserForMonthlyModal, setSelectedUserForMonthlyModal] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isDayOffModalOpen, setIsDayOffModalOpen] = useState(false);

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
        const list = staffJson.staff || [];
        setStaffList(list);
        if (!individualEmpId && list.length > 0) {
          setIndividualEmpId(list[0].id);
        }
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

  // Load individual employee records whenever employee ID or month changes
  const loadIndividualAttendance = async (empId: string, month: string) => {
    if (!empId) {
      setIndividualData(null);
      return;
    }
    setIndividualLoading(true);
    setIndividualError(null);
    try {
      const res = await fetch(`/api/attendance/employee/${empId}?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load employee attendance records');
      const json = await res.json();
      setIndividualData(json);
    } catch (err: any) {
      setIndividualError(err.message || 'Error fetching individual attendance');
    } finally {
      setIndividualLoading(false);
    }
  };

  useEffect(() => {
    if (individualEmpId) {
      loadIndividualAttendance(individualEmpId, individualMonth);
    }
  }, [individualEmpId, individualMonth, token]);

  // Filtered Summary Rows for Daily Tab
  const filteredRows = useMemo(() => {
    return summaryData.filter((row) => {
      if (searchDate && !row.date.includes(searchDate)) {
        return false;
      }
      return true;
    });
  }, [summaryData, searchDate]);

  // Filtered Daily Logs for Individual Employee Tab
  const filteredIndividualLogs = useMemo(() => {
    if (!individualData?.dailyLogs) return [];
    if (!individualDateFilter) return individualData.dailyLogs;
    return individualData.dailyLogs.filter((log: any) => log.date === individualDateFilter);
  }, [individualData, individualDateFilter]);

  const handleSelectEmployee = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedStaffId(id);
    if (id) {
      setIndividualEmpId(id);
      setActiveTab('individual');
    }
  };

  return (
    <div className="space-y-4 pb-16 max-w-full">
      {/* TOP BANNER & ACTION BAR */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-lg sm:text-xl font-bold text-[#181E54]">
              Staff Attendance Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Normal Attendance System · MK &amp; CRO Staff ({totalEmployees} Total Staff · Super Admin exempt)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Select Employee Dropdown */}
          <div className="relative min-w-[200px]">
            <select
              value={individualEmpId}
              onChange={(e) => {
                setIndividualEmpId(e.target.value);
                setSelectedStaffId(e.target.value);
                setActiveTab('individual');
              }}
              className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-[#181E54] focus:outline-none focus:ring-1.5 focus:ring-[#181E54] cursor-pointer shadow-2xs hover:bg-slate-100 transition-colors"
            >
              <option value="">Choose Employee...</option>
              {staffList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>

          {/* Staff Weekly Day-Off Management Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsDayOffModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            title="Manage individual weekly day-off for CRO and MK staff"
          >
            <CalendarOff className="w-3.5 h-3.5 text-amber-400" />
            <span>Staff Day-Off</span>
          </button>

          {/* Real HR Action: Manual Attendance / Leave Entry Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            title="Record manual attendance or official leave"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Entry</span>
          </button>

          {/* Office QR Code Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181E54] text-white rounded-lg text-xs font-bold hover:bg-[#121742] transition-colors cursor-pointer shadow-2xs"
            title="Display and print official office QR code"
          >
            <QrCode className="w-3.5 h-3.5 text-white" />
            <span>Office QR Code</span>
          </button>

          {/* Test / Open Camera Scanner Button */}
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#D81124] to-[#B50E1D] text-white rounded-lg text-xs font-bold hover:shadow-xs transition-all cursor-pointer"
              title="Launch full-screen attendance scanner"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
              <span>Open Scanner</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              loadData();
              if (individualEmpId) loadIndividualAttendance(individualEmpId, individualMonth);
            }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Refresh Attendance Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading || individualLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* VIEW TABS: Clean Navigation between Daily Records and Individual Employee Attendance */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'daily'
              ? 'bg-white text-[#181E54] shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Daily Attendance Summary</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('individual')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'individual'
              ? 'bg-white text-[#181E54] shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-600" />
          <span>Individual Employee Attendance</span>
        </button>
      </div>

      {/* TAB 1: DAILY ATTENDANCE SUMMARY VIEW */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* FILTER CONTROLS FOR DATE SEARCH */}
          <div className="bg-white p-3.5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between flex-wrap gap-3">
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
          </div>

          {/* ATTENDANCE SUMMARY TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            {error && (
              <div className="p-3.5 bg-red-50 text-red-700 text-xs border-b border-red-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="overflow-x-auto overflow-y-auto max-h-[580px] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
              <table className="w-full text-left text-xs min-w-[800px] border-collapse">
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
                            {row.date === formatBangladeshDateYMD(new Date()) && (
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
        </div>
      )}

      {/* TAB 2: INDIVIDUAL EMPLOYEE ATTENDANCE WITH DATE FILTERING SECTION */}
      {activeTab === 'individual' && (
        <div className="space-y-4">
          {/* FILTER TOOLBAR: Select Employee, Month Picker, Specific Date Filter */}
          <div className="bg-white p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {/* Employee Selector */}
                <div className="min-w-[220px]">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Select Employee
                  </label>
                  <select
                    value={individualEmpId}
                    onChange={(e) => setIndividualEmpId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-[#181E54] focus:outline-none focus:ring-2 focus:ring-[#181E54] cursor-pointer"
                  >
                    {staffList.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month Picker */}
                <div className="min-w-[160px]">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Month
                  </label>
                  <input
                    type="month"
                    value={individualMonth}
                    onChange={(e) => setIndividualMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                  />
                </div>

                {/* Specific Date Filter (Date Search inside employee attendance) */}
                <div className="min-w-[180px]">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Date Filter (Optional)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={individualDateFilter}
                      onChange={(e) => setIndividualDateFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                    />
                    {individualDateFilter && (
                      <button
                        type="button"
                        onClick={() => setIndividualDateFilter('')}
                        className="p-2 text-[#D81124] hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Clear date filter to view full month"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Employee Overview Pill */}
              {individualData?.employee && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#181E54] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {individualData.employee.role}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">
                      {individualData.employee.name}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{individualData.employee.phone || 'No phone'}</span>
                      <span>·</span>
                      <span className="text-amber-700 font-medium">
                        Off: {(individualData.employee.weeklyOffDays || ['Friday']).join(', ')}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Monthly Stats Pills for Selected Employee */}
            {individualData?.stats && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2.5 flex-wrap text-xs">
                <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider mr-1">
                  Summary ({individualMonth}):
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Present: {individualData.stats.presentCount} Days
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-rose-50 text-rose-800 border border-rose-200">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  Absent: {individualData.stats.absentCount} Days
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Day Off: {individualData.stats.dayOffCount} Days
                </span>
                {individualData.stats.totalLateMinutes > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Total Late: {individualData.stats.totalLateMinutes} mins
                  </span>
                )}
              </div>
            )}
          </div>

          {/* INDIVIDUAL EMPLOYEE ATTENDANCE RECORDS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            {individualError && (
              <div className="p-3.5 bg-red-50 text-red-700 text-xs border-b border-red-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{individualError}</span>
              </div>
            )}

            <div className="overflow-x-auto overflow-y-auto max-h-[580px] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
              <table className="w-full text-left text-xs min-w-[780px] border-collapse">
                <thead className="bg-[#181E54] text-white uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-xs">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Date &amp; Day</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">In-Time</th>
                    <th className="py-3 px-4 font-semibold">Out-Time</th>
                    <th className="py-3 px-4 font-semibold">Late Minutes</th>
                    <th className="py-3 px-4 font-semibold">Work Duration</th>
                    <th className="py-3 px-4 font-semibold">Method / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {individualLoading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-7 h-7 border-2 border-[#181E54] border-t-transparent rounded-full animate-spin" />
                          <span>Loading employee attendance records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredIndividualLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <p className="text-sm font-semibold text-slate-700 mb-1">
                          No attendance records found
                        </p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          {individualDateFilter
                            ? `No records found for date ${individualDateFilter}. Clear the date filter to see the entire month.`
                            : 'No attendance logs recorded for this employee in the chosen month.'}
                        </p>
                        {individualDateFilter && (
                          <button
                            type="button"
                            onClick={() => setIndividualDateFilter('')}
                            className="mt-3 px-3 py-1.5 bg-[#181E54] text-white rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Clear Date Filter
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredIndividualLogs.map((log: any) => (
                      <tr
                        key={log.date}
                        className={`hover:bg-slate-50/90 transition-colors ${
                          log.status === 'present'
                            ? ''
                            : log.isDayOff
                            ? 'bg-slate-50/40'
                            : 'bg-rose-50/20'
                        }`}
                      >
                        {/* 1. Date & Day */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 font-mono font-bold text-slate-900">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{log.date}</span>
                            <span
                              className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full ${
                                log.isFriday
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {log.dayName}
                            </span>
                            {log.date === formatBangladeshDateYMD(new Date()) && (
                              <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-sans font-bold">
                                Today
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Status Badge */}
                        <td className="py-3 px-4">
                          {log.status === 'present' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Present
                            </span>
                          ) : log.isDayOff ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {log.dayOffReason || 'Weekly Off'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-500" />
                              Absent
                            </span>
                          )}
                        </td>

                        {/* 3. In-Time */}
                        <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                          {log.inTime ? (
                            <span className="text-emerald-700">{log.inTime}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* 4. Out-Time */}
                        <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                          {log.outTime ? (
                            <span className="text-slate-700">{log.outTime}</span>
                          ) : log.status === 'present' ? (
                            <span className="text-blue-600 font-sans text-[11px]">Working...</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* 5. Late Minutes */}
                        <td className="py-3 px-4 font-mono">
                          {log.lateMinutes && log.lateMinutes > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              {log.lateMinutes} mins late
                            </span>
                          ) : log.status === 'present' ? (
                            <span className="text-emerald-700 font-sans text-[11px] font-medium">On Time</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* 6. Work Duration */}
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {log.workDuration || (log.status === 'present' ? 'In progress' : '—')}
                        </td>

                        {/* 7. Scan Method / Notes */}
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {log.scanMethod === 'offline_synced' ? (
                            <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                              Offline Synced
                            </span>
                          ) : log.scanMethod === 'manual_admin' ? (
                            <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-medium">
                              Manual Admin Entry
                            </span>
                          ) : log.status === 'present' ? (
                            <span className="text-slate-600">Office QR Scan</span>
                          ) : log.isDayOff ? (
                            <span className="text-slate-400">Scheduled Day Off</span>
                          ) : (
                            <span className="text-rose-600 font-medium">No record</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
        onSuccess={() => {
          loadData();
          if (individualEmpId) loadIndividualAttendance(individualEmpId, individualMonth);
        }}
      />

      {/* STAFF WEEKLY DAY-OFF MANAGEMENT MODAL */}
      <StaffDayOffModal
        isOpen={isDayOffModalOpen}
        onClose={() => setIsDayOffModalOpen(false)}
        token={token}
        onSuccess={() => {
          loadData();
          if (individualEmpId) loadIndividualAttendance(individualEmpId, individualMonth);
        }}
      />
    </div>
  );
};
