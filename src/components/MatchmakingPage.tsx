import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  User,
  HeartHandshake,
  Eye,
  FileText,
  RefreshCw,
  Sparkles,
  MapPin,
  Calendar,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Check,
  Tag,
  Plus,
  X,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  Phone,
  Shield,
  ArrowRight,
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

  // View mode: 'table' or 'cards'
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

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

  // In-modal confirmation state for deleting a level option (avoids window.confirm in iframe sandbox)
  const [deletingLevelConfirm, setDeletingLevelConfirm] = useState<string | null>(null);

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

  // Handle escape key to dismiss any active modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (levelModalCandidate) setLevelModalCandidate(null);
        if (showManageLevelsModal) {
          setShowManageLevelsModal(false);
          setDeletingLevelConfirm(null);
        }
        if (viewingProfile) setViewingProfile(null);
        if (selectedServiceCandidate) setSelectedServiceCandidate(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [levelModalCandidate, showManageLevelsModal, viewingProfile, selectedServiceCandidate]);

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

  // Handler: Delete a level option safely
  const handleDeleteLevelOption = async (levelToDelete: string) => {
    setLevelOptions((prev) => prev.filter((l) => l !== levelToDelete));
    if (levelFilter === levelToDelete) {
      setLevelFilter('all');
    }
    setDeletingLevelConfirm(null);
    try {
      await fetch(`/api/matchmaking/levels/${encodeURIComponent(levelToDelete)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Failed to delete level option', err);
    }
  };

  // Helper for badge color styling harmonized with ShadiKabbo CRM palette
  const getLevelBadgeStyle = (level?: string) => {
    const l = (level || 'Level 1').toLowerCase();
    if (l.includes('vip')) return 'bg-amber-50 text-amber-900 border-amber-300 font-bold';
    if (l.includes('urgent') || l.includes('priority')) return 'bg-rose-50 text-[#D81124] border-rose-200 font-bold';
    if (l.includes('level 1') || l === '1') return 'bg-[#181E54]/10 text-[#181E54] border-[#181E54]/25 font-bold';
    if (l.includes('level 2') || l === '2') return 'bg-sky-50 text-sky-800 border-sky-200 font-bold';
    if (l.includes('level 3') || l === '3') return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
    return 'bg-slate-100 text-slate-800 border-slate-200 font-bold';
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
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto space-y-3 sm:space-y-3.5 pb-8">
      {/* ==================================================
          PAGE HEADER (Executive Style matching Paid Traffic & Dashboard)
      ================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#181E54] tracking-tight">
              Matchmaking
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#181E54]/10 text-[#181E54] border border-[#181E54]/20 flex items-center gap-1 shadow-2xs">
              <HeartHandshake className="w-3.5 h-3.5 text-[#D81124]" />
              <span>MK Portal · 3-Day Cycle</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Active candidate pool · Routine client follow-up required every 3 days
          </p>
        </div>

        {/* Top Controls: Search + Refresh + Manage Levels */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto w-full sm:w-auto">
          {/* Manual Search Option matching Paid Traffic */}
          <div className="w-full sm:w-64 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, ID, level..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-[#181E54] shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer touch-manipulation"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Refresh Pool */}
          <button
            type="button"
            onClick={loadCandidates}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer min-h-[38px] touch-manipulation active:scale-[0.98]"
            title="Refresh candidate pool"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Refresh</span>
          </button>

          {/* Manage Levels Modal Trigger */}
          <button
            type="button"
            onClick={() => {
              setDeletingLevelConfirm(null);
              setShowManageLevelsModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#181E54] hover:bg-[#121642] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-all cursor-pointer min-h-[38px] touch-manipulation active:scale-[0.98]"
            title="Configure and manage candidate levels"
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Manage Levels</span>
          </button>
        </div>
      </div>

      {/* ==================================================
          COMPACT METRIC CARDS STRIP (Space-Saving & Clean)
          Reduced height & padding so table is immediately visible higher up
      ================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        {/* Card 1: Total Clients */}
        <div className="bg-white px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-2 min-h-[50px]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#181E54]/10 text-[#181E54] flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                Total Clients
              </div>
              <div className="text-[10px] text-slate-400 font-medium truncate hidden sm:block">
                Active Pool
              </div>
            </div>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-[#181E54] font-mono shrink-0">
            {metrics.totalClients}
          </div>
        </div>

        {/* Card 2: Service Required / Overdue (>3 Days) */}
        <div
          onClick={() => setServiceStatusFilter(serviceStatusFilter === 'required' ? 'all' : 'required')}
          className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 min-h-[50px] touch-manipulation active:scale-[0.98] ${
            serviceStatusFilter === 'required'
              ? 'bg-amber-100/95 border-amber-400 ring-2 ring-amber-400/30 shadow-2xs'
              : 'bg-amber-50/70 border-amber-200/80 hover:border-amber-300 shadow-2xs'
          }`}
          title="Click to filter Service Overdue (>3 days)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-800" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900 truncate flex items-center gap-1">
                <span>Overdue</span>
                {metrics.serviceRequiredCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block shrink-0" />
                )}
              </div>
              <div className="text-[10px] text-amber-800 font-medium truncate hidden sm:block">
                &gt;3d Pending
              </div>
            </div>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-amber-900 font-mono shrink-0">
            {metrics.serviceRequiredCount}
          </div>
        </div>

        {/* Card 3: Service Completed (Up to Date <= 3 Days) */}
        <div
          onClick={() => setServiceStatusFilter(serviceStatusFilter === 'completed' ? 'all' : 'completed')}
          className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 min-h-[50px] touch-manipulation active:scale-[0.98] ${
            serviceStatusFilter === 'completed'
              ? 'bg-emerald-100/95 border-emerald-400 ring-2 ring-emerald-400/30 shadow-2xs'
              : 'bg-emerald-50/70 border-emerald-200/80 hover:border-emerald-300 shadow-2xs'
          }`}
          title="Click to filter Up to Date (<=3 days)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-200 text-emerald-900 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-800" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 truncate">
                Up to Date
              </div>
              <div className="text-[10px] text-emerald-800 font-medium truncate hidden sm:block">
                &le;3d Cycle
              </div>
            </div>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-900 font-mono shrink-0">
            {metrics.serviceCompletedCount}
          </div>
        </div>

        {/* Card 4: My Services Count */}
        <div className="bg-gradient-to-br from-amber-50/40 via-white to-slate-50 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-amber-200/80 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-2 min-h-[50px]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#181E54] text-amber-400 flex items-center justify-center shadow-2xs shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 truncate">
                My Services
              </div>
              <div className="text-[10px] text-amber-900 font-medium truncate hidden sm:block">
                {metrics.myUniqueClients} Unique Clients
              </div>
            </div>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-[#181E54] font-mono shrink-0">
            {metrics.myTotalServices}
          </div>
        </div>
      </div>

      {/* ==================================================
          FILTER CONTROLS & VIEW SWITCHER TOOLBAR
      ================================================== */}
      <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
        {/* Row 1: Service Status Filter + View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto scrollbar-none pb-0.5">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Service:</span>
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setServiceStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[32px] flex items-center touch-manipulation active:scale-[0.98] ${
                  serviceStatusFilter === 'all'
                    ? 'bg-[#181E54] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({metrics.totalClients})
              </button>

              <button
                type="button"
                onClick={() => setServiceStatusFilter('required')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap min-h-[32px] touch-manipulation active:scale-[0.98] ${
                  serviceStatusFilter === 'required'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Overdue ({metrics.serviceRequiredCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setServiceStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap min-h-[32px] touch-manipulation active:scale-[0.98] ${
                  serviceStatusFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-800 hover:text-emerald-950'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Up to Date ({metrics.serviceCompletedCount})</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* View Mode Toggle: Table or Cards Grid */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer touch-manipulation ${
                  viewMode === 'table'
                    ? 'bg-white text-[#181E54] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View as table"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer touch-manipulation ${
                  viewMode === 'cards'
                    ? 'bg-white text-[#181E54] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View as cards"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            {/* Reset Filters button */}
            {(serviceStatusFilter !== 'all' || levelFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setServiceStatusFilter('all');
                  setLevelFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-[#D81124] hover:underline cursor-pointer min-h-[30px] flex items-center px-1 touch-manipulation"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Candidate Level Filter & Manual Level Creation */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto scrollbar-none pb-0.5">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Level:</span>
            </span>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setLevelFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[30px] flex items-center touch-manipulation active:scale-[0.98] ${
                  levelFilter === 'all'
                    ? 'bg-[#181E54] text-white shadow-xs'
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
                      className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-xl border border-[#181E54] shadow-xs shrink-0"
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
                        className="w-24 sm:w-32 px-2 py-0.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg outline-none min-h-[28px]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          handleRenameLevelOption(lvl, editingLevelOptionNewText);
                          setEditingLevelOptionOldName(null);
                        }}
                        className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer min-h-[28px] min-w-[28px] flex items-center justify-center touch-manipulation"
                        title="Save renamed level"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingLevelOptionOldName(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer min-h-[28px] min-w-[28px] flex items-center justify-center touch-manipulation"
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
                    className="flex items-center gap-0.5 rounded-lg group/chip shrink-0 hover:bg-white/60 p-0.5 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setLevelFilter(isSelected ? 'all' : lvl)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap min-h-[30px] touch-manipulation active:scale-[0.98] ${
                        isSelected
                          ? 'bg-[#181E54] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{lvl}</span>
                      <span
                        className={`text-[11px] px-1.5 py-0.2 rounded-md font-mono font-semibold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
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
                      className="p-1 min-w-[26px] min-h-[26px] flex items-center justify-center text-slate-400 hover:text-[#181E54] hover:bg-slate-200/80 rounded-md transition-all cursor-pointer opacity-70 group-hover/chip:opacity-100 touch-manipulation"
                      title={`Rename "${lvl}" level`}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Add Level */}
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
                  placeholder="New level name..."
                  className="w-32 sm:w-40 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-[#181E54] focus:bg-white min-h-[32px]"
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
                  className="px-2.5 py-1 bg-[#181E54] hover:bg-[#222b75] text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer touch-manipulation min-h-[32px]"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewLevelOptionInput('');
                    setIsAddingNewLevel(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer touch-manipulation min-h-[32px] min-w-[32px] flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingNewLevel(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-dashed border-slate-300 text-slate-700 hover:text-[#181E54] hover:border-[#181E54] bg-white text-xs font-semibold transition-all cursor-pointer shadow-2xs min-h-[30px] touch-manipulation active:scale-[0.98]"
                title="Create a new Level option"
              >
                <Plus className="w-3.5 h-3.5 text-[#D81124]" />
                <span>+ Level</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================
          CANDIDATE LIST RENDERING (TABLE VIEW OR CARDS VIEW)
      ================================================== */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-14 sm:p-20 text-center shadow-xs">
          <div className="w-10 h-10 border-3 border-[#181E54] border-t-[#D81124] rounded-full animate-spin mx-auto mb-3.5" />
          <p className="text-sm sm:text-base text-slate-600 font-semibold">Loading candidate matchmaking pool...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-red-200 p-12 sm:p-16 text-center text-red-600 shadow-xs">
          <p className="text-sm sm:text-base font-semibold">{error}</p>
          <button
            onClick={loadCandidates}
            className="mt-4 px-5 py-2.5 text-xs sm:text-sm bg-[#181E54] text-white rounded-xl font-semibold cursor-pointer min-h-[42px] touch-manipulation"
          >
            Retry
          </button>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-14 sm:p-20 text-center text-slate-500 shadow-xs">
          <HeartHandshake className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 text-slate-300" />
          <p className="text-base sm:text-lg font-bold text-slate-800">No matching candidate profiles found</p>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery || serviceStatusFilter !== 'all' || levelFilter !== 'all'
              ? 'Try broadening your search query or reset filters to see all candidates'
              : 'Candidates with completed payment will appear here for matchmaking'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        /* ==================================================
           CANDIDATE CARDS GRID VIEW (Prominent, High-Visibility Cards)
        ================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredCandidates.map((row, idx) => {
            const age = calculateAge(row.dateOfBirth);
            const isFemale = row.gender?.toLowerCase() === 'female';
            const serviceInfo = getCandidateServiceInfo(row);

            return (
              <div
                key={row.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all p-5 sm:p-6 flex flex-col justify-between group"
              >
                {/* Top Card Bar: ID, Serial, Package */}
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-mono font-bold text-[#181E54] text-xs sm:text-sm">
                        {row.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#181E54]/10 text-[#181E54]">
                        {row.package || 'Standard'}
                      </span>
                      {row.phone && (
                        <CountryFlag iso={detectCountryIso(row.phone)} className="w-5 h-3.5" />
                      )}
                    </div>
                  </div>

                  {/* Candidate Profile Details */}
                  <div className="flex items-start gap-3.5 sm:gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setViewingProfile(row)}
                      className="relative shrink-0 cursor-pointer group focus:outline-none touch-manipulation"
                      title={`View ${row.name}'s details`}
                    >
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center shadow-xs group-hover:ring-2 group-hover:ring-[#181E54]/30 transition-all">
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
                            <User className="w-6 h-6 opacity-70" />
                          </div>
                        )}
                      </div>
                      {row.images && row.images.length > 1 && (
                        <span className="absolute -bottom-1 -right-1 bg-[#181E54] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                          +{row.images.length - 1}
                        </span>
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => setViewingProfile(row)}
                        className="font-bold text-slate-900 hover:text-[#D81124] transition-colors truncate block text-left text-base sm:text-lg cursor-pointer touch-manipulation"
                      >
                        {row.name}
                      </button>

                      <div className="text-xs sm:text-[13px] text-slate-600 font-medium truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{row.profession || 'Professional'}</span>
                        {row.presentCity && (
                          <>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-slate-500">{row.presentCity}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {/* Gender & Age */}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${
                            isFemale ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {row.gender || 'N/A'}{age ? `, ${age}y` : ''}
                        </span>

                        {/* Level badge */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLevelModalCandidate(row);
                            setLevelModalCustomInput(row.matchmakingLevel || 'Level 1');
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer hover:shadow-2xs active:scale-[0.96] ${getLevelBadgeStyle(
                            row.matchmakingLevel
                          )}`}
                          title="Click to edit candidate level"
                        >
                          <Tag className="w-3.5 h-3.5 opacity-70" />
                          <span>{row.matchmakingLevel || 'Level 1'}</span>
                          <Pencil className="w-3 h-3 opacity-60 ml-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3-Day Service Status Box */}
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Service Cycle:
                      </span>
                      {serviceInfo.isOverdue ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          <span>Overdue ({serviceInfo.daysOverdue}d)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Up to Date ({serviceInfo.daysRemaining}d left)</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 font-medium mt-2 flex items-center justify-between gap-2">
                      <span className="truncate">
                        Last: <strong className="text-slate-800">{row.lastServiceType || 'No service yet'}</strong>
                      </span>
                      <span className="text-slate-400 font-mono text-[11px] shrink-0">
                        {serviceInfo.hasEverBeenServiced
                          ? `${serviceInfo.diffDays === 0 ? 'Today' : `${serviceInfo.diffDays}d ago`}`
                          : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Assigned MK Account */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>Assigned MK:</span>
                    <span className="font-bold text-slate-800">
                      {row.assignedTo?.name || row.assignBy || 'General MK'}
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedServiceCandidate(row)}
                    className="flex-1 py-2.5 px-3 bg-[#181E54] hover:bg-[#121642] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer touch-manipulation active:scale-[0.98] min-h-[42px]"
                  >
                    <HeartHandshake className="w-4 h-4 text-rose-300 shrink-0" />
                    <span>Record Service</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewingProfile(row)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:text-[#181E54] hover:bg-slate-50 transition-colors cursor-pointer touch-manipulation min-h-[42px] min-w-[42px] flex items-center justify-center"
                    title="View Profile"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {row.pdf && (row.pdf.dataUrl || row.pdf.url) && (
                    <a
                      href={row.pdf.dataUrl || row.pdf.url}
                      download={row.pdf.name || `${row.name}_biodata.pdf`}
                      className="p-2.5 rounded-xl border border-rose-200 text-[#D81124] hover:bg-rose-50 transition-colors cursor-pointer touch-manipulation min-h-[42px] min-w-[42px] flex items-center justify-center"
                      title="Download Biodata PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ==================================================
           CANDIDATE TABLE VIEW (Spacious, Clear & High Visibility)
        ================================================== */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-[#181E54] text-white uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="py-4 px-4 font-bold w-16 text-center hidden sm:table-cell">Serial</th>
                  <th className="py-4 px-4 font-bold w-36">ID &amp; Date</th>
                  <th className="py-4 px-4 font-bold min-w-[240px]">Candidate Profile</th>
                  <th className="py-4 px-4 font-bold whitespace-nowrap">Gender &amp; Age</th>
                  <th className="py-4 px-4 font-bold min-w-[210px]">Service Cycle (3-Day)</th>
                  <th className="py-4 px-4 font-bold min-w-[150px]">Assigned MK</th>
                  <th className="py-4 px-4 font-bold text-right w-36">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCandidates.map((row, idx) => {
                  const age = calculateAge(row.dateOfBirth);
                  const isFemale = row.gender?.toLowerCase() === 'female';
                  const serviceInfo = getCandidateServiceInfo(row);

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/90 transition-colors">
                      {/* 1. Serial */}
                      <td className="py-4 px-4 text-center hidden sm:table-cell w-16">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 text-slate-800 text-xs sm:text-sm font-mono font-bold">
                          {idx + 1}
                        </span>
                      </td>

                      {/* 2. Candidate ID & Date */}
                      <td className="py-4 px-4 w-36">
                        <div className="font-mono font-bold text-[#181E54] text-xs sm:text-sm">{row.id}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{row.createdAt || 'N/A'}</span>
                        </div>
                      </td>

                      {/* 3. Candidate Profile with embedded Package & Level badges */}
                      <td className="py-4 px-4 min-w-[240px]">
                        <div className="flex items-center gap-3.5">
                          <button
                            type="button"
                            onClick={() => setViewingProfile(row)}
                            className="relative shrink-0 cursor-pointer group focus:outline-none touch-manipulation"
                            title={`View ${row.name}'s details`}
                          >
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center shadow-xs group-hover:ring-2 group-hover:ring-[#181E54]/30 transition-all">
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
                                  <User className="w-5 h-5 opacity-70" />
                                </div>
                              )}
                            </div>
                            {row.images && row.images.length > 1 && (
                              <span className="absolute -bottom-0.5 -right-0.5 bg-[#181E54] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-white">
                                +{row.images.length - 1}
                              </span>
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setViewingProfile(row)}
                                className="font-bold text-slate-900 hover:text-[#D81124] transition-colors truncate block text-left cursor-pointer text-sm sm:text-base touch-manipulation"
                              >
                                {row.name}
                              </button>

                              {/* Package Tag */}
                              <span className="inline-flex px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#181E54]/10 text-[#181E54] whitespace-nowrap">
                                {row.package || 'Standard'}
                              </span>

                              {/* Editable Level Badge */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLevelModalCandidate(row);
                                  setLevelModalCustomInput(row.matchmakingLevel || 'Level 1');
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap hover:shadow-2xs min-h-[28px] touch-manipulation active:scale-[0.96] ${getLevelBadgeStyle(
                                  row.matchmakingLevel
                                )}`}
                                title={`Level: ${row.matchmakingLevel || 'Level 1'} (Click to change or edit level)`}
                              >
                                <Tag className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                <span>{row.matchmakingLevel || 'Level 1'}</span>
                                <Pencil className="w-3 h-3 opacity-60 shrink-0" />
                              </button>
                            </div>

                            <div className="text-xs sm:text-[13px] text-slate-500 truncate mt-1 flex items-center gap-1.5">
                              <span>{row.profession || 'Professional'}</span>
                              {row.presentCity && (
                                <>
                                  <span className="text-slate-300">&bull;</span>
                                  <span className="text-slate-500">{row.presentCity}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 4. Gender & Age */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                              isFemale ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {row.gender || 'N/A'}
                          </span>
                          {age && (
                            <span className="text-xs sm:text-sm font-mono text-slate-700 font-semibold">
                              {age}y
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. 3-Day Service Status Column */}
                      <td className="py-4 px-4 min-w-[210px]">
                        {serviceInfo.isOverdue ? (
                          <button
                            type="button"
                            onClick={() => setSelectedServiceCandidate(row)}
                            className="text-left group/status cursor-pointer focus:outline-none p-1 -m-1 rounded-xl touch-manipulation active:scale-[0.98]"
                            title="3-day cycle overdue! Click to record service and reset cycle."
                          >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs group-hover/status:bg-amber-100 group-hover/status:border-amber-400 transition-all">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                              </span>
                              <span>Service Required</span>
                              <span className="text-[11px] bg-amber-200/90 text-amber-950 px-2 py-0.5 rounded-md font-mono font-bold">
                                {serviceInfo.daysOverdue}d overdue
                              </span>
                            </div>

                            <div className="text-xs text-amber-800 font-medium mt-1 flex items-center gap-1.5 pl-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="truncate max-w-[200px]">
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
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs group-hover/status:bg-emerald-100 group-hover/status:border-emerald-400 transition-all">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Service Completed</span>
                              <span className="text-[11px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-md font-mono font-bold">
                                {serviceInfo.daysRemaining}d left
                              </span>
                            </div>

                            <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5 pl-1 truncate max-w-[200px]">
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
                      <td className="py-4 px-4 min-w-[150px]">
                        {Array.isArray(row.assignedMKs) && row.assignedMKs.length > 1 ? (
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm truncate max-w-[150px]">
                              {row.assignedMKs[0].name}
                            </div>
                            <div className="text-xs text-emerald-600 font-bold mt-0.5">
                              +{row.assignedMKs.length - 1} Co-Assigned
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-slate-900 text-xs sm:text-sm truncate max-w-[150px]">
                              {row.assignedTo?.name || row.assignBy || 'General MK'}
                            </div>
                            <div className="text-xs text-slate-400 font-medium mt-0.5">
                              Role: {row.assignedTo?.role || 'MK'}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 7. Action with Signature Brand Buttons */}
                      <td className="py-4 px-4 text-right w-36">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedServiceCandidate(row)}
                            className="px-3 py-2 rounded-xl bg-[#181E54] hover:bg-[#121642] text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer touch-manipulation active:scale-95 min-h-[38px]"
                            title="Record Service (Call, CV, Update)"
                          >
                            <HeartHandshake className="w-4 h-4 text-rose-300 shrink-0" />
                            <span>Service</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewingProfile(row)}
                            className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-slate-500 hover:text-[#181E54] hover:bg-slate-100 transition-colors cursor-pointer touch-manipulation active:scale-[0.93]"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {row.pdf && (row.pdf.dataUrl || row.pdf.url) && (
                            <a
                              href={row.pdf.dataUrl || row.pdf.url}
                              download={row.pdf.name || `${row.name}_biodata.pdf`}
                              className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-slate-500 hover:text-[#D81124] hover:bg-rose-50 transition-colors cursor-pointer touch-manipulation active:scale-[0.93]"
                              title="Download Biodata PDF"
                            >
                              <FileText className="w-4 h-4" />
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
        </div>
      )}

      {/* ==================================================
          CANDIDATE LEVEL EDIT MODAL
          - Clean, dedicated dialog for MK users to change level
          - Dismiss on backdrop click or ESC
          - Select from configured levels
          - Type new custom level
      ================================================== */}
      {levelModalCandidate && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setLevelModalCandidate(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#181E54]/10 text-[#181E54] rounded-xl">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Candidate Level</h3>
                  <p className="text-xs text-slate-500">
                    {levelModalCandidate.name} ({levelModalCandidate.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLevelModalCandidate(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {/* Current Level display */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs sm:text-sm font-semibold text-slate-600">Currently Assigned:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border ${getLevelBadgeStyle(
                    levelModalCandidate.matchmakingLevel
                  )}`}
                >
                  <Tag className="w-3.5 h-3.5 opacity-70" />
                  {levelModalCandidate.matchmakingLevel || 'Level 1'}
                </span>
              </div>

              {/* Fast 1-Click Level Selection */}
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-2.5">
                  Choose Configured Level:
                </label>
                <div className="flex flex-wrap gap-2.5">
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
                        className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 border min-h-[42px] touch-manipulation active:scale-[0.97] ${
                          isCurrent
                            ? 'bg-[#181E54] text-white border-[#181E54] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-[#181E54] hover:bg-slate-50'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5 opacity-60" />
                        <span>{opt}</span>
                        {isCurrent && <Check className="w-3.5 h-3.5 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Level Assignment */}
              <div className="pt-4 border-t border-slate-100">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-2">
                  Or Type Custom Level Name:
                </label>
                <div className="flex items-center gap-2.5">
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
                    className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#181E54] focus:bg-white min-h-[42px]"
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
                    className="px-4 py-2.5 bg-[#181E54] hover:bg-[#222b75] text-white rounded-xl text-xs sm:text-sm font-bold disabled:opacity-40 transition-colors cursor-pointer min-h-[42px] touch-manipulation active:scale-[0.97]"
                  >
                    Assign
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
                  className="text-xs font-bold text-[#181E54] hover:underline cursor-pointer inline-flex items-center gap-1.5 min-h-[36px] touch-manipulation"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Rename / Manage All Level Names</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ==================================================
          MANAGE ALL LEVELS MODAL
          - MK users can rename level names (Editable)
          - Delete unused levels with safe in-modal confirm
          - Add new global level options
          - Dismiss on backdrop click or ESC
      ================================================== */}
      {showManageLevelsModal && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => {
            setShowManageLevelsModal(false);
            setDeletingLevelConfirm(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#181E54]/10 text-[#181E54] rounded-xl">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Manage &amp; Edit Level Names</h3>
                  <p className="text-xs text-slate-500">
                    Rename levels or add new options for the MK team
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowManageLevelsModal(false);
                  setDeletingLevelConfirm(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {/* Level List */}
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-2.5">
                  Configured Level Options ({levelOptions.length}):
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {levelOptions.map((lvl) => {
                    const isEditing = editingLevelOptionOldName === lvl;
                    const isDeletingConfirm = deletingLevelConfirm === lvl;
                    const count = levelCounts[lvl] || 0;

                    if (isEditing) {
                      return (
                        <div
                          key={lvl}
                          className="flex items-center gap-2 p-2.5 bg-slate-50 border border-[#181E54] rounded-xl"
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
                            className="flex-1 px-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-lg outline-none min-h-[36px]"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleRenameLevelOption(lvl, editingLevelOptionNewText);
                              setEditingLevelOptionOldName(null);
                            }}
                            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
                            title="Save renamed level"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingLevelOptionOldName(null)}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    }

                    if (isDeletingConfirm) {
                      return (
                        <div
                          key={lvl}
                          className="flex items-center justify-between p-2.5 bg-rose-50 border border-rose-300 rounded-xl animate-in fade-in duration-100"
                        >
                          <span className="text-xs sm:text-sm font-bold text-rose-900">
                            Delete &ldquo;{lvl}&rdquo;?
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteLevelOption(lvl)}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer min-h-[32px] touch-manipulation"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingLevelConfirm(null)}
                              className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer min-h-[32px] touch-manipulation"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={lvl}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/80 group min-h-[46px]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">{lvl}</span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-mono font-semibold shrink-0">
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
                            className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center text-slate-400 hover:text-[#181E54] hover:bg-white rounded-lg transition-colors cursor-pointer touch-manipulation"
                            title={`Rename "${lvl}"`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingLevelConfirm(lvl)}
                            className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer touch-manipulation"
                            title={`Delete "${lvl}" option`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add New Level Section */}
              <div className="pt-4 border-t border-slate-100">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-2">
                  + Add New Level Option:
                </label>
                <div className="flex items-center gap-2.5">
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
                    className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#181E54] focus:bg-white min-h-[42px]"
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
                    className="px-4 py-2.5 bg-[#181E54] hover:bg-[#222b75] text-white rounded-xl text-xs sm:text-sm font-bold disabled:opacity-40 transition-colors cursor-pointer min-h-[42px] touch-manipulation active:scale-[0.97]"
                  >
                    Add Option
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowManageLevelsModal(false);
                  setDeletingLevelConfirm(null);
                }}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer min-h-[42px] touch-manipulation active:scale-[0.97]"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ==================================================
          CANDIDATE PROFILE MODAL (with token & status update sync)
      ================================================== */}
      {viewingProfile && (
        <TrafficProfileModal
          isOpen={!!viewingProfile}
          onClose={() => setViewingProfile(null)}
          traffic={viewingProfile}
          token={token}
          canEdit={false}
          onStatusUpdated={(updated) => handleServiceRecorded(updated)}
          showPaymentInfo={true}
        />
      )}

      {/* ==================================================
          MATCHMAKING SERVICE MODAL (Record interactions & reset 3-day timer)
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
