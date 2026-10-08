import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  User,
  HeartHandshake,
  Eye,
  FileText,
  Filter,
  RefreshCw,
  Sparkles,
  MapPin,
  Calendar,
  Briefcase,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  Send,
  Users,
  ShieldCheck,
  Check,
  Tag,
  ChevronDown,
  Plus,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import { CountryFlag, detectCountryIso } from './CountryFlag';
import { TrafficProfileModal } from './TrafficProfileModal';
import { MatchmakingServiceModal } from './MatchmakingServiceModal';
import { useCrmFields } from '../context/CrmFieldsContext';

interface MatchmakingPageProps {
  user: any;
  token: string;
}

export const MatchmakingPage: React.FC<MatchmakingPageProps> = ({ user, token }) => {
  const { fields } = useCrmFields();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceStatusFilter, setServiceStatusFilter] = useState<'all' | 'required' | 'completed'>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Configured Level options (MK users can manage/input custom options)
  const [levelOptions, setLevelOptions] = useState<string[]>([
    'Level 1',
    'Level 2',
    'Level 3',
    'VIP',
    'Urgent',
  ]);
  const [isAddingNewLevel, setIsAddingNewLevel] = useState(false);
  const [newLevelOptionInput, setNewLevelOptionInput] = useState('');

  // Dedicated Level Edit Modal state for candidate
  const [levelModalCandidate, setLevelModalCandidate] = useState<any | null>(null);
  const [levelModalCustomInput, setLevelModalCustomInput] = useState('');

  // Manage all levels modal state
  const [showManageLevelsModal, setShowManageLevelsModal] = useState(false);

  // State for renaming a global level option
  const [editingLevelOptionOldName, setEditingLevelOptionOldName] = useState<string | null>(null);
  const [editingLevelOptionNewText, setEditingLevelOptionNewText] = useState('');

  // Modals
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);
  const [selectedServiceCandidate, setSelectedServiceCandidate] = useState<any | null>(null);

  const loadCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/paid-traffic', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Failed to load matchmaking profiles');
      }
      const data = await res.json();
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Error fetching matchmaking profiles');
    } finally {
      setLoading(false);
    }
  };

  const loadLevelOptions = async () => {
    try {
      const res = await fetch('/api/matchmaking/levels', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.levels) && json.levels.length > 0) {
          setLevelOptions(json.levels);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadCandidates();
    loadLevelOptions();
  }, [token]);

  // Handler: Update candidate level persistently
  const handleUpdateCandidateLevel = async (candidateId: string, newLevel: string) => {
    const clean = newLevel.trim();
    if (!clean) return;

    // Optimistically update candidate in state
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, matchmakingLevel: clean } : c))
    );
    if (!levelOptions.includes(clean)) {
      setLevelOptions((prev) => [...prev, clean]);
    }

    try {
      const res = await fetch(`/api/matchmaking/${candidateId}/level`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ level: clean }),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.levels)) {
          setLevelOptions(json.levels);
        }
      }
    } catch (err) {
      console.error('Failed to save candidate level', err);
    }
  };

  // Handler: Add custom level option for MK team
  const handleAddLevelOption = async (newLevelName: string) => {
    const clean = newLevelName.trim();
    if (!clean) return;
    if (!levelOptions.includes(clean)) {
      setLevelOptions((prev) => [...prev, clean]);
    }

    try {
      const res = await fetch('/api/matchmaking/levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ level: clean }),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.levels)) {
          setLevelOptions(json.levels);
        }
      }
    } catch (err) {
      console.error('Failed to create level option', err);
    }
  };

  // Handler: Rename an existing level option (cascades to all candidates with that level)
  const handleRenameLevelOption = async (oldName: string, newName: string) => {
    const cleanOld = oldName.trim();
    const cleanNew = newName.trim();
    if (!cleanOld || !cleanNew || cleanOld === cleanNew) return;

    // Optimistically update levelOptions and candidates
    setLevelOptions((prev) => prev.map((l) => (l === cleanOld ? cleanNew : l)));
    setCandidates((prev) =>
      prev.map((c) =>
        (c.matchmakingLevel || 'Level 1') === cleanOld
          ? { ...c, matchmakingLevel: cleanNew }
          : c
      )
    );
    if (levelFilter === cleanOld) {
      setLevelFilter(cleanNew);
    }

    try {
      const res = await fetch('/api/matchmaking/levels/rename', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldName: cleanOld, newName: cleanNew }),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.levels)) {
          setLevelOptions(json.levels);
        }
      }
    } catch (err) {
      console.error('Failed to rename level option', err);
    }
  };

  // Handler: Delete a level option
  const handleDeleteLevelOption = async (levelToDelete: string) => {
    setLevelOptions((prev) => prev.filter((l) => l !== levelToDelete));
    if (levelFilter === levelToDelete) {
      setLevelFilter('all');
    }
    try {
      await fetch(`/api/matchmaking/levels/${encodeURIComponent(levelToDelete)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Failed to delete level option', err);
    }
  };

  // Helper for badge color styling
  const getLevelBadgeStyle = (level?: string) => {
    const l = (level || 'Level 1').toLowerCase();
    if (l.includes('vip')) return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    if (l.includes('urgent') || l.includes('priority')) return 'bg-rose-50 text-rose-800 border-rose-300';
    if (l.includes('level 1') || l === '1') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (l.includes('level 2') || l === '2') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (l.includes('level 3') || l === '3') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-teal-50 text-teal-800 border-teal-200';
  };

  // Helper: 3-Day Rule Calculation
  const getCandidateServiceInfo = (row: any) => {
    const now = Date.now();
    const lastTime =
      row.lastServiceAt ||
      row.assignedAt ||
      row.createdTimestamp ||
      (row.createdAt ? new Date(row.createdAt).getTime() : now);
    const diffMs = now - lastTime;
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const hasEverBeenServiced = !!row.lastServiceAt;
    const isOverdue = diffDays >= 3 || !hasEverBeenServiced;
    const daysOverdue = Math.max(1, diffDays - 2);
    const daysRemaining = Math.max(0, 3 - diffDays);

    return {
      isOverdue,
      daysOverdue,
      daysRemaining,
      diffDays,
      hasEverBeenServiced,
      lastServiceType: row.lastServiceType,
      lastServiceAt: row.lastServiceAt,
      lastServiceBy: row.lastServiceBy,
      lastServiceNote: row.lastServiceNote,
      servicesCount: Array.isArray(row.matchmakingServices) ? row.matchmakingServices.length : 0,
    };
  };

  // Metrics calculation across all loaded candidates
  const metrics = useMemo(() => {
    let serviceRequiredCount = 0;
    let serviceCompletedCount = 0;
    let myTotalServices = 0;
    const myServicedClientIds = new Set<string>();

    candidates.forEach((c) => {
      const info = getCandidateServiceInfo(c);
      if (info.isOverdue) {
        serviceRequiredCount++;
      } else {
        serviceCompletedCount++;
      }

      if (Array.isArray(c.matchmakingServices)) {
        c.matchmakingServices.forEach((s: any) => {
          if (
            (user?.id && s.providedBy?.id === user.id) ||
            (user?.name && s.providedBy?.name === user.name)
          ) {
            myTotalServices++;
            myServicedClientIds.add(c.id);
          }
        });
      }
    });

    return {
      totalClients: candidates.length,
      serviceRequiredCount,
      serviceCompletedCount,
      myTotalServices,
      myUniqueClients: myServicedClientIds.size,
    };
  }, [candidates, user]);

  // Client-side filtering
  const filteredCandidates = useMemo(() => {
    return candidates.filter((item) => {
      const serviceInfo = getCandidateServiceInfo(item);

      // 1. Service Status filter
      if (serviceStatusFilter === 'required' && !serviceInfo.isOverdue) {
        return false;
      }
      if (serviceStatusFilter === 'completed' && serviceInfo.isOverdue) {
        return false;
      }

      // 2. Level filter
      if (levelFilter !== 'all') {
        const itemLevel = (item.matchmakingLevel || 'Level 1').trim().toLowerCase();
        if (itemLevel !== levelFilter.trim().toLowerCase()) {
          return false;
        }
      }

      // 3. Top center manual search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchPhone = item.phone?.includes(q);
        const matchId = item.id?.toLowerCase().includes(q);
        const matchProfession = item.profession?.toLowerCase().includes(q);
        const matchCity = item.presentCity?.toLowerCase().includes(q);
        const matchServiceNote = item.lastServiceNote?.toLowerCase().includes(q);
        const matchLevel = (item.matchmakingLevel || '').toLowerCase().includes(q);
        if (
          !matchName &&
          !matchPhone &&
          !matchId &&
          !matchProfession &&
          !matchCity &&
          !matchServiceNote &&
          !matchLevel
        ) {
          return false;
        }
      }

      return true;
    });
  }, [candidates, serviceStatusFilter, levelFilter, searchQuery]);

  // Aggregate candidate counts per level
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    candidates.forEach((c) => {
      const lvl = c.matchmakingLevel || 'Level 1';
      counts[lvl] = (counts[lvl] || 0) + 1;
    });
    return counts;
  }, [candidates]);

  // Calculate age from DOB
  const calculateAge = (dobString?: string) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const handleServiceRecorded = (updatedTraffic: any) => {
    setCandidates((prev) =>
      prev.map((item) => (item.id === updatedTraffic.id ? { ...item, ...updatedTraffic } : item))
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4 max-w-7xl mx-auto pb-8 sm:pb-12">
      {/* ==================================================
          PAGE HEADER
      ================================================== */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3 sm:p-4 md:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#181E54] text-white flex items-center justify-center shadow-xs shrink-0">
              <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5 text-[#D81124]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-bold text-[#181E54] tracking-tight">
                  Matchmaking Portal
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#181E54]/10 text-[#181E54]">
                  MK Workflow &bull; 3-Day Cycle
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Active client matchmaking pool &bull; Routine service required every 3 days
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-end md:self-auto">
            <button
              type="button"
              onClick={loadCandidates}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer min-h-[36px] touch-manipulation active:scale-[0.98]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Pool</span>
            </button>
          </div>
        </div>

        {/* ==================================================
            STAT CARDS / MK METRICS OVERVIEW
        ================================================== */}
        <div className="mt-3 sm:mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
          {/* Card 1: Total Assigned */}
          <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200/90 flex items-center justify-between min-h-[64px] touch-manipulation">
            <div className="min-w-0 pr-1">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                Total Clients
              </span>
              <span className="text-base sm:text-lg font-bold text-[#181E54] leading-tight block mt-0.5">
                {metrics.totalClients}
              </span>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>

          {/* Card 2: Service Required / Overdue (>3 Days) */}
          <div
            onClick={() => setServiceStatusFilter('required')}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border flex items-center justify-between cursor-pointer transition-all min-h-[64px] touch-manipulation active:scale-[0.98] ${
              serviceStatusFilter === 'required'
                ? 'bg-amber-100/70 border-amber-400 ring-2 ring-amber-400/30'
                : 'bg-amber-50/80 border-amber-200 hover:border-amber-300'
            }`}
          >
            <div className="min-w-0 pr-1">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-900 block flex items-center gap-1 truncate">
                <span className="truncate">Service Overdue</span>
                {metrics.serviceRequiredCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block shrink-0" />
                )}
              </span>
              <span className="text-base sm:text-lg font-bold text-amber-900 leading-tight block mt-0.5">
                {metrics.serviceRequiredCount}
              </span>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700" />
            </div>
          </div>

          {/* Card 3: Service Completed (Up to Date) */}
          <div
            onClick={() => setServiceStatusFilter('completed')}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border flex items-center justify-between cursor-pointer transition-all min-h-[64px] touch-manipulation active:scale-[0.98] ${
              serviceStatusFilter === 'completed'
                ? 'bg-emerald-100/70 border-emerald-400 ring-2 ring-emerald-400/30'
                : 'bg-emerald-50/80 border-emerald-200 hover:border-emerald-300'
            }`}
          >
            <div className="min-w-0 pr-1">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-900 block truncate">
                Up to Date (&le;3d)
              </span>
              <span className="text-base sm:text-lg font-bold text-emerald-900 leading-tight block mt-0.5">
                {metrics.serviceCompletedCount}
              </span>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold text-xs shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
            </div>
          </div>

          {/* Card 4: My Services Count (MK Role tracking) */}
          <div className="bg-purple-50/80 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-purple-200/90 flex items-center justify-between min-h-[64px] touch-manipulation">
            <div className="min-w-0 pr-1">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-purple-900 block truncate">
                My Services
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base sm:text-lg font-bold text-purple-900 leading-tight">
                  {metrics.myTotalServices}
                </span>
                <span className="text-[10px] text-purple-700 font-semibold truncate">
                  ({metrics.myUniqueClients} clients)
                </span>
              </div>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-200 text-purple-900 flex items-center justify-center font-bold text-xs shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-700" />
            </div>
          </div>
        </div>

        {/* ==================================================
            TOP CENTER SEARCH BAR (Manual search)
        ================================================== */}
        <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-100 flex flex-col items-center">
          <div className="relative w-full max-w-2xl">
            <Search className="w-4 h-4 text-[#181E54] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate by name, phone, profession, location, level..."
              className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#181E54]/20 focus:border-[#181E54] focus:bg-white transition-all shadow-2xs font-medium min-h-[38px] sm:min-h-[40px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer min-h-[30px] min-w-[30px] flex items-center justify-center touch-manipulation"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ==================================================
            FILTERING SECTION (Service Status & Candidate Level)
        ================================================== */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
          {/* Row 1: Service Status filter */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none pb-0.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="hidden xs:inline">Service Cycle:</span>
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setServiceStatusFilter('all')}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[32px] sm:min-h-[34px] flex items-center touch-manipulation active:scale-[0.98] ${
                    serviceStatusFilter === 'all'
                      ? 'bg-white text-[#181E54] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({metrics.totalClients})
                </button>

                <button
                  type="button"
                  onClick={() => setServiceStatusFilter('required')}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap min-h-[32px] sm:min-h-[34px] touch-manipulation active:scale-[0.98] ${
                    serviceStatusFilter === 'required'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-amber-800 hover:text-amber-950'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Overdue ({metrics.serviceRequiredCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setServiceStatusFilter('completed')}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap min-h-[32px] sm:min-h-[34px] touch-manipulation active:scale-[0.98] ${
                    serviceStatusFilter === 'completed'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-800 hover:text-emerald-950'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>Up to Date ({metrics.serviceCompletedCount})</span>
                </button>
              </div>
            </div>

            {(serviceStatusFilter !== 'all' || levelFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setServiceStatusFilter('all');
                  setLevelFilter('all');
                }}
                className="text-[11px] font-bold text-[#D81124] hover:underline cursor-pointer min-h-[32px] flex items-center px-1 touch-manipulation ml-auto"
              >
                Reset All Filters
              </button>
            )}
          </div>

          {/* Row 2: Candidate Level Filter & Manual Level Creation */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs pt-1 border-t border-slate-100/70">
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none pb-0.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Tag className="w-3 h-3 text-slate-400" />
                <span className="hidden xs:inline">Level:</span>
              </span>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setLevelFilter('all')}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[32px] flex items-center touch-manipulation active:scale-[0.98] ${
                    levelFilter === 'all'
                      ? 'bg-white text-[#181E54] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({metrics.totalClients})
                </button>

                {levelOptions.map((lvl) => {
                  const count = levelCounts[lvl] || 0;
                  const isSelected = levelFilter.toLowerCase() === lvl.toLowerCase();

                  if (editingLevelOptionOldName === lvl) {
                    return (
                      <div
                        key={lvl}
                        className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-[#181E54] shadow-xs shrink-0"
                      >
                        <input
                          type="text"
                          value={editingLevelOptionNewText}
                          onChange={(e) => setEditingLevelOptionNewText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameLevelOption(lvl, editingLevelOptionNewText);
                              setEditingLevelOptionOldName(null);
                            } else if (e.key === 'Escape') {
                              setEditingLevelOptionOldName(null);
                            }
                          }}
                          className="w-20 sm:w-24 px-1 py-0.5 text-xs font-bold text-slate-800 outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            handleRenameLevelOption(lvl, editingLevelOptionNewText);
                            setEditingLevelOptionOldName(null);
                          }}
                          className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer touch-manipulation"
                          title="Save renamed level"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingLevelOptionOldName(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer touch-manipulation"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={lvl} className="inline-flex items-center group/chip bg-transparent shrink-0">
                      <button
                        type="button"
                        onClick={() => setLevelFilter(isSelected ? 'all' : lvl)}
                        className={`px-2 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap min-h-[32px] touch-manipulation active:scale-[0.98] ${
                          isSelected
                            ? 'bg-[#181E54] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>{lvl}</span>
                        <span
                          className={`text-[9px] sm:text-[10px] px-1 py-0.2 rounded-md ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingLevelOptionOldName(lvl);
                          setEditingLevelOptionNewText(lvl);
                        }}
                        className="p-1 min-w-[26px] min-h-[26px] flex items-center justify-center text-slate-400 hover:text-[#181E54] hover:bg-slate-200/60 rounded-md transition-all cursor-pointer opacity-70 group-hover/chip:opacity-100 touch-manipulation"
                        title={`Rename "${lvl}" level`}
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MK User Manual Option: Add New Level Option */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {isAddingNewLevel ? (
                <div className="flex items-center gap-1 animate-in fade-in duration-150">
                  <input
                    type="text"
                    value={newLevelOptionInput}
                    onChange={(e) => setNewLevelOptionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newLevelOptionInput.trim()) {
                        e.preventDefault();
                        handleAddLevelOption(newLevelOptionInput.trim());
                        setNewLevelOptionInput('');
                        setIsAddingNewLevel(false);
                      }
                    }}
                    placeholder="New level..."
                    className="w-28 sm:w-36 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#181E54] focus:bg-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    disabled={!newLevelOptionInput.trim()}
                    onClick={() => {
                      if (newLevelOptionInput.trim()) {
                        handleAddLevelOption(newLevelOptionInput.trim());
                        setNewLevelOptionInput('');
                        setIsAddingNewLevel(false);
                      }
                    }}
                    className="px-2 py-1 bg-[#181E54] hover:bg-[#222b75] text-white rounded-lg text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer touch-manipulation min-h-[30px]"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewLevelOptionInput('');
                      setIsAddingNewLevel(false);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer touch-manipulation"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewLevel(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:text-[#181E54] hover:border-[#181E54] bg-white text-[11px] sm:text-xs font-semibold transition-all cursor-pointer shadow-2xs min-h-[32px] touch-manipulation active:scale-[0.98]"
                    title="Manually create a new Level option for MK team"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add Level</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManageLevelsModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 text-slate-600 hover:text-[#181E54] hover:border-[#181E54] bg-white text-[11px] sm:text-xs font-semibold transition-all cursor-pointer shadow-2xs min-h-[32px] touch-manipulation active:scale-[0.98]"
                    title="Manage and rename configured level names"
                  >
                    <Pencil className="w-2.5 h-2.5 text-[#181E54]" />
                    <span>Manage</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          COMPACT MATCHMAKING TABLE
          - Clean, responsive layout with 0 horizontal bloat
          - Removed: Standalone Package & Level columns (now embedded in Candidate Profile)
          - Compact row spacing & mobile-ready typography
      ================================================== */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 sm:py-16 text-center">
            <div className="w-8 h-8 border-3 border-[#181E54] border-t-[#D81124] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading candidate matchmaking pool...</p>
          </div>
        ) : error ? (
          <div className="py-10 sm:py-12 text-center text-red-600 px-4">
            <p className="text-xs font-semibold">{error}</p>
            <button
              onClick={loadCandidates}
              className="mt-3 px-3 py-1.5 text-xs bg-[#181E54] text-white rounded-lg font-medium cursor-pointer min-h-[34px] touch-manipulation"
            >
              Retry
            </button>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="py-12 sm:py-16 text-center text-slate-500 px-4">
            <HeartHandshake className="w-9 h-9 sm:w-10 sm:h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-700">No matching candidate profiles found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {searchQuery || serviceStatusFilter !== 'all' || levelFilter !== 'all'
                ? 'Try broadening your search query or reset filters'
                : 'Candidates with completed payment will appear here for matchmaking'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/90 text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2 px-2 sm:px-3 w-10 text-center hidden sm:table-cell">#</th>
                  <th className="py-2 px-2 sm:px-3 w-20 sm:w-28">Candidate ID</th>
                  <th className="py-2 px-2 sm:px-3 min-w-[185px] sm:min-w-[210px]">Candidate Profile</th>
                  <th className="py-2 px-2 sm:px-3 whitespace-nowrap">Gender &amp; Age</th>
                  <th className="py-2 px-2 sm:px-3 min-w-[150px] sm:min-w-[170px]">Service Status (3-Day Cycle)</th>
                  <th className="py-2 px-2 sm:px-3 min-w-[100px] sm:min-w-[130px]">Assigned MK</th>
                  <th className="py-2 px-2 sm:px-3 text-right w-24 sm:w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCandidates.map((row, idx) => {
                  const age = calculateAge(row.dateOfBirth);
                  const isFemale = row.gender?.toLowerCase() === 'female';
                  const serviceInfo = getCandidateServiceInfo(row);

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Serial */}
                      <td className="py-2 px-2 sm:px-3 text-center font-mono text-slate-400 font-semibold text-[11px] hidden sm:table-cell">
                        {idx + 1}
                      </td>

                      {/* 2. Candidate ID & Date */}
                      <td className="py-2 px-2 sm:px-3">
                        <div className="font-mono font-bold text-[#181E54] text-xs">{row.id}</div>
                        <div className="text-[10px] text-slate-400">{row.createdAt}</div>
                      </td>

                      {/* 3. Candidate Profile with embedded Package & Level badges */}
                      <td className="py-2 px-2 sm:px-3">
                        <div className="flex items-center gap-2 sm:gap-2.5">
                          <button
                            type="button"
                            onClick={() => setViewingProfile(row)}
                            className="relative shrink-0 cursor-pointer group focus:outline-none touch-manipulation"
                            title={`View ${row.name}'s details`}
                          >
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-slate-200/90 bg-slate-100 flex items-center justify-center shadow-2xs group-hover:ring-2 group-hover:ring-[#181E54]/30 transition-all">
                              {row.images && row.images.length > 0 ? (
                                <img
                                  src={row.images[0]}
                                  alt={row.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div
                                  className={`w-full h-full flex items-center justify-center ${
                                    isFemale ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                                  }`}
                                >
                                  <User className="w-3.5 h-3.5 opacity-70" />
                                </div>
                              )}
                            </div>
                            {row.images && row.images.length > 1 && (
                              <span className="absolute -bottom-0.5 -right-0.5 bg-[#181E54] text-white text-[8px] font-bold px-1 py-0.2 rounded-full border border-white">
                                +{row.images.length - 1}
                              </span>
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setViewingProfile(row)}
                                className="font-bold text-slate-900 hover:text-[#D81124] transition-colors truncate block text-left cursor-pointer text-xs touch-manipulation"
                              >
                                {row.name}
                              </button>

                              {/* Compact Package Tag */}
                              <span className="inline-flex px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#181E54]/10 text-[#181E54] whitespace-nowrap">
                                {row.package || 'Standard'}
                              </span>

                              {/* Compact Editable Level Badge */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLevelModalCandidate(row);
                                  setLevelModalCustomInput(row.matchmakingLevel || 'Level 1');
                                }}
                                className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap hover:shadow-2xs min-h-[24px] sm:min-h-[26px] touch-manipulation active:scale-[0.96] ${getLevelBadgeStyle(
                                  row.matchmakingLevel
                                )}`}
                                title={`Level: ${row.matchmakingLevel || 'Level 1'} (Click to change or edit level)`}
                              >
                                <Tag className="w-2.5 h-2.5 opacity-70 shrink-0" />
                                <span>{row.matchmakingLevel || 'Level 1'}</span>
                                <Pencil className="w-2 h-2 opacity-60 shrink-0" />
                              </button>
                            </div>

                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {row.profession || 'Professional'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 4. Gender & Age */}
                      <td className="py-2 px-2 sm:px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isFemale ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {row.gender || 'N/A'}
                          </span>
                          {age && (
                            <span className="text-[11px] font-mono text-slate-600">
                              {age}y
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. 3-Day Service Status Column */}
                      <td className="py-2 px-2 sm:px-3">
                        {serviceInfo.isOverdue ? (
                          <button
                            type="button"
                            onClick={() => setSelectedServiceCandidate(row)}
                            className="text-left group/status cursor-pointer focus:outline-none p-1 -m-1 rounded-xl touch-manipulation active:scale-[0.98]"
                            title="3-day cycle overdue! Click to record service and reset cycle."
                          >
                            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs group-hover/status:bg-amber-100 group-hover/status:border-amber-400 transition-all">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                              </span>
                              <span>Service Required</span>
                              <span className="text-[9px] bg-amber-200/90 text-amber-950 px-1 py-0.2 rounded font-mono font-bold">
                                {serviceInfo.daysOverdue}d overdue
                              </span>
                            </div>

                            <div className="text-[10px] text-amber-700 font-medium mt-0.5 flex items-center gap-1 pl-1">
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="truncate max-w-[170px]">
                                {serviceInfo.hasEverBeenServiced
                                  ? `Last: ${row.lastServiceType || 'Service'} (${serviceInfo.diffDays}d ago)`
                                  : 'Initial service pending'}
                              </span>
                            </div>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedServiceCandidate(row)}
                            className="text-left group/status cursor-pointer focus:outline-none p-1 -m-1 rounded-xl touch-manipulation active:scale-[0.98]"
                            title="Click to add another service or view service log history."
                          >
                            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs group-hover/status:bg-emerald-100 group-hover/status:border-emerald-400 transition-all">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Service Completed</span>
                              <span className="text-[9px] bg-emerald-200/60 text-emerald-900 px-1 py-0.2 rounded font-mono font-semibold">
                                {serviceInfo.daysRemaining}d left
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1 pl-1 truncate max-w-[170px]">
                              <span className="font-semibold text-emerald-700">
                                {row.lastServiceType || 'Service'}
                              </span>
                              <span>&bull;</span>
                              <span>{serviceInfo.diffDays === 0 ? 'Today' : `${serviceInfo.diffDays}d ago`}</span>
                            </div>
                          </button>
                        )}
                      </td>

                      {/* 6. Assigned MK Account */}
                      <td className="py-2 px-2 sm:px-3">
                        {Array.isArray(row.assignedMKs) && row.assignedMKs.length > 1 ? (
                          <div>
                            <div className="font-bold text-slate-900 text-xs truncate max-w-[130px]">
                              {row.assignedMKs[0].name}
                            </div>
                            <div className="text-[9px] text-emerald-600 font-bold">
                              +{row.assignedMKs.length - 1} Co-Assigned
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-slate-800 text-xs truncate max-w-[130px]">
                              {row.assignedTo?.name || row.assignBy || 'General MK'}
                            </div>
                            <div className="text-[9px] text-slate-400 font-medium">
                              Officer
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 7. Action */}
                      <td className="py-2 px-2 sm:px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedServiceCandidate(row)}
                            className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-emerald-700 hover:text-white hover:bg-emerald-600 transition-colors cursor-pointer touch-manipulation active:scale-[0.93]"
                            title="Record Service (Call, CV, Update)"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewingProfile(row)}
                            className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-slate-600 hover:text-[#181E54] hover:bg-slate-100 transition-colors cursor-pointer touch-manipulation active:scale-[0.93]"
                            title="View Full Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {row.pdf && (row.pdf.dataUrl || row.pdf.url) && (
                            <a
                              href={row.pdf.dataUrl || row.pdf.url}
                              download={row.pdf.name || `${row.name}_biodata.pdf`}
                              className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-slate-600 hover:text-[#D81124] hover:bg-rose-50 transition-colors cursor-pointer touch-manipulation active:scale-[0.93]"
                              title="Download Biodata PDF"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================
          CANDIDATE LEVEL EDIT MODAL
          - Clean, dedicated dialog for MK users to change level
          - Select from configured levels
          - Type new custom level
          - Rename or edit level names directly
      ================================================== */}
      {levelModalCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#181E54]/10 text-[#181E54] rounded-lg">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Candidate Level</h3>
                  <p className="text-[11px] text-slate-500">
                    {levelModalCandidate.name} ({levelModalCandidate.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLevelModalCandidate(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center touch-manipulation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4 overflow-y-auto">
              {/* Current Level display */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-600">Currently Assigned:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getLevelBadgeStyle(
                    levelModalCandidate.matchmakingLevel
                  )}`}
                >
                  <Tag className="w-3 h-3 opacity-70" />
                  {levelModalCandidate.matchmakingLevel || 'Level 1'}
                </span>
              </div>

              {/* Fast 1-Click Level Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Choose Configured Level:
                </label>
                <div className="flex flex-wrap gap-2">
                  {levelOptions.map((opt) => {
                    const isCurrent =
                      (levelModalCandidate.matchmakingLevel || 'Level 1').toLowerCase() ===
                      opt.toLowerCase();
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          handleUpdateCandidateLevel(levelModalCandidate.id, opt);
                          setLevelModalCandidate(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border min-h-[38px] touch-manipulation active:scale-[0.97] ${
                          isCurrent
                            ? 'bg-[#181E54] text-white border-[#181E54] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-[#181E54] hover:bg-slate-50'
                        }`}
                      >
                        <Tag className="w-3 h-3 opacity-60" />
                        <span>{opt}</span>
                        {isCurrent && <Check className="w-3 h-3 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Level Assignment */}
              <div className="pt-3 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Or Type Custom Level Name:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={levelModalCustomInput}
                    onChange={(e) => setLevelModalCustomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && levelModalCustomInput.trim()) {
                        e.preventDefault();
                        handleUpdateCandidateLevel(levelModalCandidate.id, levelModalCustomInput.trim());
                        setLevelModalCandidate(null);
                      }
                    }}
                    placeholder="e.g. VIP Gold, Step 2..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#181E54] focus:bg-white min-h-[40px]"
                  />
                  <button
                    type="button"
                    disabled={!levelModalCustomInput.trim()}
                    onClick={() => {
                      if (levelModalCustomInput.trim()) {
                        handleUpdateCandidateLevel(levelModalCandidate.id, levelModalCustomInput.trim());
                        setLevelModalCandidate(null);
                      }
                    }}
                    className="px-3.5 py-2 bg-[#181E54] hover:bg-[#222b75] text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer min-h-[40px] touch-manipulation active:scale-[0.97]"
                  >
                    Assign Level
                  </button>
                </div>
              </div>

              {/* Quick shortcut to rename global level names */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setLevelModalCandidate(null);
                    setShowManageLevelsModal(true);
                  }}
                  className="text-[11px] font-bold text-[#181E54] hover:underline cursor-pointer inline-flex items-center gap-1 min-h-[32px] touch-manipulation"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Rename / Manage All Level Names</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          MANAGE ALL LEVELS MODAL
          - MK users can rename level names (Editable)
          - Delete unused levels
          - Add new global level options
      ================================================== */}
      {showManageLevelsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#181E54]/10 text-[#181E54] rounded-lg">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Manage &amp; Edit Level Names</h3>
                  <p className="text-[11px] text-slate-500">
                    Rename levels or add new options for the MK team
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManageLevelsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center touch-manipulation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4 overflow-y-auto">
              {/* Level List */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Configured Level Options ({levelOptions.length}):
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {levelOptions.map((lvl) => {
                    const isEditing = editingLevelOptionOldName === lvl;
                    const count = levelCounts[lvl] || 0;

                    if (isEditing) {
                      return (
                        <div
                          key={lvl}
                          className="flex items-center gap-1.5 p-2 bg-slate-50 border border-[#181E54] rounded-xl"
                        >
                          <input
                            type="text"
                            value={editingLevelOptionNewText}
                            onChange={(e) => setEditingLevelOptionNewText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameLevelOption(lvl, editingLevelOptionNewText);
                                setEditingLevelOptionOldName(null);
                              } else if (e.key === 'Escape') {
                                setEditingLevelOptionOldName(null);
                              }
                            }}
                            className="flex-1 px-2 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg outline-none min-h-[34px]"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleRenameLevelOption(lvl, editingLevelOptionNewText);
                              setEditingLevelOptionOldName(null);
                            }}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center touch-manipulation"
                            title="Save renamed level"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingLevelOptionOldName(null)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center touch-manipulation"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={lvl}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/80 group min-h-[42px]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-xs font-bold text-slate-800 truncate">{lvl}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-slate-600 font-mono shrink-0">
                            {count}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Rename Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLevelOptionOldName(lvl);
                              setEditingLevelOptionNewText(lvl);
                            }}
                            className="p-1.5 min-w-[30px] min-h-[30px] flex items-center justify-center text-slate-400 hover:text-[#181E54] hover:bg-white rounded-md transition-colors cursor-pointer touch-manipulation"
                            title={`Rename "${lvl}"`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteLevelOption(lvl)}
                            className="p-1.5 min-w-[30px] min-h-[30px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-white rounded-md transition-colors cursor-pointer touch-manipulation"
                            title={`Delete "${lvl}" option`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add New Level Section */}
              <div className="pt-3 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  + Add New Level Option:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newLevelOptionInput}
                    onChange={(e) => setNewLevelOptionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newLevelOptionInput.trim()) {
                        e.preventDefault();
                        handleAddLevelOption(newLevelOptionInput.trim());
                        setNewLevelOptionInput('');
                      }
                    }}
                    placeholder="Enter new level name..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#181E54] focus:bg-white min-h-[40px]"
                  />
                  <button
                    type="button"
                    disabled={!newLevelOptionInput.trim()}
                    onClick={() => {
                      if (newLevelOptionInput.trim()) {
                        handleAddLevelOption(newLevelOptionInput.trim());
                        setNewLevelOptionInput('');
                      }
                    }}
                    className="px-3.5 py-2 bg-[#181E54] hover:bg-[#222b75] text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer min-h-[40px] touch-manipulation active:scale-[0.97]"
                  >
                    Add Option
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowManageLevelsModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer min-h-[38px] touch-manipulation active:scale-[0.97]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          CANDIDATE PROFILE MODAL (Read-Only for MK)
      ================================================== */}
      {viewingProfile && (
        <TrafficProfileModal
          isOpen={!!viewingProfile}
          onClose={() => setViewingProfile(null)}
          traffic={viewingProfile}
          canEdit={false}
        />
      )}

      {/* ==================================================
          MATCHMAKING SERVICE MODAL
      ================================================== */}
      {selectedServiceCandidate && (
        <MatchmakingServiceModal
          isOpen={!!selectedServiceCandidate}
          onClose={() => setSelectedServiceCandidate(null)}
          candidate={selectedServiceCandidate}
          token={token}
          currentUser={user}
          onServiceRecorded={handleServiceRecorded}
        />
      )}
    </div>
  );
};
