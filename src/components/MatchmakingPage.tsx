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

  useEffect(() => {
    loadCandidates();
  }, [token]);

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

      // 2. Top center manual search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchPhone = item.phone?.includes(q);
        const matchId = item.id?.toLowerCase().includes(q);
        const matchProfession = item.profession?.toLowerCase().includes(q);
        const matchCity = item.presentCity?.toLowerCase().includes(q);
        const matchServiceNote = item.lastServiceNote?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchId && !matchProfession && !matchCity && !matchServiceNote) {
          return false;
        }
      }

      return true;
    });
  }, [candidates, serviceStatusFilter, searchQuery]);

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
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* ==================================================
          PAGE HEADER
      ================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#181E54] text-white flex items-center justify-center shadow-xs">
              <HeartHandshake className="w-5 h-5 text-[#D81124]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-[#181E54] tracking-tight">
                  Matchmaking Portal
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#181E54]/10 text-[#181E54]">
                  MK Workflow &bull; 3-Day Cycle
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Active client matchmaking pool &bull; Routine service required every 3 days
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={loadCandidates}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Pool</span>
            </button>
          </div>
        </div>

        {/* ==================================================
            STAT CARDS / MK METRICS OVERVIEW
            "and akjon mk role er account user total koto gula clent service dise ta count hobe"
        ================================================== */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Card 1: Total Assigned */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Total Clients
              </span>
              <span className="text-lg font-bold text-[#181E54]">{metrics.totalClients}</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-200/80 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Service Required / Overdue (>3 Days) */}
          <div
            onClick={() => setServiceStatusFilter('required')}
            className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
              serviceStatusFilter === 'required'
                ? 'bg-amber-100/70 border-amber-400 ring-2 ring-amber-400/30'
                : 'bg-amber-50/80 border-amber-200 hover:border-amber-300'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block flex items-center gap-1">
                <span>Service Overdue</span>
                {metrics.serviceRequiredCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                )}
              </span>
              <span className="text-lg font-bold text-amber-900">
                {metrics.serviceRequiredCount}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            </div>
          </div>

          {/* Card 3: Service Completed (Up to Date) */}
          <div
            onClick={() => setServiceStatusFilter('completed')}
            className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
              serviceStatusFilter === 'completed'
                ? 'bg-emerald-100/70 border-emerald-400 ring-2 ring-emerald-400/30'
                : 'bg-emerald-50/80 border-emerald-200 hover:border-emerald-300'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
                Up to Date (&le;3d)
              </span>
              <span className="text-lg font-bold text-emerald-900">
                {metrics.serviceCompletedCount}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
          </div>

          {/* Card 4: My Services Count (MK Role tracking) */}
          <div className="bg-purple-50/80 p-3 rounded-2xl border border-purple-200/90 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 block">
                My Services Delivered
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-purple-900">
                  {metrics.myTotalServices}
                </span>
                <span className="text-[10px] text-purple-700 font-semibold">
                  ({metrics.myUniqueClients} clients)
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-purple-200 text-purple-900 flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-4 h-4 text-purple-700" />
            </div>
          </div>
        </div>

        {/* ==================================================
            OVERDUE NOTIFICATION BANNER (Top Notification Sent)
            "and upore Notification sent thakbe"
        ================================================== */}
        {metrics.serviceRequiredCount > 0 && (
          <div className="mt-3.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-300 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-amber-500 text-white shadow-2xs shrink-0">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <p className="font-bold text-amber-900">
                  Matchmaking Service Action Required: {metrics.serviceRequiredCount} client(s) pending routine service!
                </p>
                <p className="text-[11px] text-amber-800">
                  Clients require follow-up service every 3 days. Please review and log Incoming Call, Outgoing Call, CV Send, or Update.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setServiceStatusFilter('required')}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap shadow-xs transition-colors cursor-pointer shrink-0"
            >
              View Overdue ({metrics.serviceRequiredCount})
            </button>
          </div>
        )}

        {/* ==================================================
            TOP CENTER SEARCH BAR (Manual search)
        ================================================== */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col items-center">
          <div className="relative w-full max-w-2xl">
            <Search className="w-4 h-4 text-[#181E54] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate by name, phone, profession, location, service note..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#181E54]/20 focus:border-[#181E54] focus:bg-white transition-all shadow-2xs font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ==================================================
            FILTERING SECTION (Service Required, Gender, Religion, etc.)
            "Service requ filtering section thakbe"
        ================================================== */}
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs">
          {/* Service Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setServiceStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                serviceStatusFilter === 'required'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Service Overdue ({metrics.serviceRequiredCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setServiceStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                serviceStatusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 hover:text-emerald-950'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Up to Date ({metrics.serviceCompletedCount})</span>
            </button>
          </div>

          {serviceStatusFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setServiceStatusFilter('all')}
              className="text-[11px] font-bold text-[#D81124] hover:underline ml-2 cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* ==================================================
          MATCHMAKING TABLE
          - Removed: Partner Requirements column
          - Added: 3-Day Service Status column (Clickable modal link)
      ================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-[#181E54] border-t-[#D81124] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading candidate matchmaking pool...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-600 px-4">
            <p className="text-xs font-semibold">{error}</p>
            <button
              onClick={loadCandidates}
              className="mt-3 px-3 py-1.5 text-xs bg-[#181E54] text-white rounded-lg font-medium cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="py-16 text-center text-slate-500 px-4">
            <HeartHandshake className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-700">No matching candidate profiles found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {searchQuery || serviceStatusFilter !== 'all'
                ? 'Try broadening your search query or reset filters'
                : 'Candidates with completed payment will appear here for matchmaking'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3.5 w-14 text-center">#</th>
                  <th className="py-3 px-3.5 w-28">Candidate ID</th>
                  <th className="py-3 px-3.5 min-w-[190px]">Candidate Profile</th>
                  <th className="py-3 px-3.5">Gender &amp; Age</th>
                  <th className="py-3 px-3.5">Religion &amp; Marital</th>
                  <th className="py-3 px-3.5">Location</th>
                  <th className="py-3 px-3.5">Package</th>
                  {/* Status column (replaces Partner Requirements) */}
                  <th className="py-3 px-3.5 min-w-[200px]">Service Status (3-Day Cycle)</th>
                  <th className="py-3 px-3.5 min-w-[140px]">Assigned MK</th>
                  <th className="py-3 px-3.5 text-right w-24">Action</th>
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
                      <td className="py-2.5 px-3.5 text-center font-mono text-slate-500 font-semibold text-[11px]">
                        {idx + 1}
                      </td>

                      {/* 2. Candidate ID & Date */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-mono font-bold text-[#181E54] text-xs">{row.id}</div>
                        <div className="text-[10px] text-slate-400">{row.createdAt}</div>
                      </td>

                      {/* 3. Candidate Name + Rounded Profile Picture */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setViewingProfile(row)}
                            className="relative shrink-0 cursor-pointer group focus:outline-none"
                            title={`View ${row.name}'s details`}
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200/90 bg-slate-100 flex items-center justify-center shadow-2xs group-hover:ring-2 group-hover:ring-[#181E54]/30 transition-all">
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
                                  <User className="w-4 h-4 opacity-70" />
                                </div>
                              )}
                            </div>
                            {row.images && row.images.length > 1 && (
                              <span className="absolute -bottom-0.5 -right-0.5 bg-[#181E54] text-white text-[8px] font-bold px-1 py-0.2 rounded-full border border-white">
                                +{row.images.length - 1}
                              </span>
                            )}
                          </button>

                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setViewingProfile(row)}
                              className="font-bold text-slate-900 hover:text-[#D81124] transition-colors truncate block text-left cursor-pointer text-xs"
                            >
                              {row.name}
                            </button>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {row.profession || 'Professional'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 4. Gender & Age */}
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isFemale ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {row.gender || 'Not specified'}
                        </span>
                        {age && (
                          <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                            {age} yrs
                          </div>
                        )}
                      </td>

                      {/* 5. Religion & Marital */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-semibold text-slate-800 text-[11px]">
                          {row.religion || 'Muslim'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {row.maritalStatus || 'Never Married'}
                        </div>
                      </td>

                      {/* 6. Location */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
                          <CountryFlag iso={detectCountryIso(row.presentCountry || 'BD')} className="w-3.5 h-2.5" />
                          <span className="truncate max-w-[100px]">{row.presentCity || 'Dhaka'}</span>
                        </div>
                      </td>

                      {/* 7. Package */}
                      <td className="py-2.5 px-3.5">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#181E54]/10 text-[#181E54]">
                          {row.package || 'Standard'}
                        </span>
                      </td>

                      {/* 8. 3-Day Service Status Column (Replaced Partner Requirements) */}
                      <td className="py-2.5 px-3.5">
                        {serviceInfo.isOverdue ? (
                          <button
                            type="button"
                            onClick={() => setSelectedServiceCandidate(row)}
                            className="text-left group/status cursor-pointer focus:outline-none"
                            title="3-day cycle overdue! Click to record service and reset cycle."
                          >
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs group-hover/status:bg-amber-100 group-hover/status:border-amber-400 transition-all">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                              <span>Service Required</span>
                              <span className="text-[10px] bg-amber-200/90 text-amber-950 px-1.5 py-0.2 rounded-md font-mono font-bold">
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
                            className="text-left group/status cursor-pointer focus:outline-none"
                            title="Click to add another service or view service log history."
                          >
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs group-hover/status:bg-emerald-100 group-hover/status:border-emerald-400 transition-all">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Service Completed</span>
                              <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-1.5 py-0.2 rounded-md font-mono font-semibold">
                                {serviceInfo.daysRemaining}d left
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1 pl-1 truncate max-w-[180px]">
                              <span className="font-semibold text-emerald-700">
                                {row.lastServiceType || 'Service'}
                              </span>
                              <span>&bull;</span>
                              <span>{serviceInfo.diffDays === 0 ? 'Today' : `${serviceInfo.diffDays}d ago`}</span>
                              {serviceInfo.servicesCount > 1 && (
                                <span className="text-[9px] text-slate-400 font-mono">
                                  ({serviceInfo.servicesCount} logs)
                                </span>
                              )}
                            </div>
                          </button>
                        )}
                      </td>

                      {/* 9. Assigned MK Account */}
                      <td className="py-2.5 px-3.5">
                        {Array.isArray(row.assignedMKs) && row.assignedMKs.length > 1 ? (
                          <div>
                            <div className="font-bold text-slate-900 text-xs truncate max-w-[130px]">
                              {row.assignedMKs[0].name}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-bold">
                              +{row.assignedMKs.length - 1} Co-Assigned MKs
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-slate-800 text-xs truncate">
                              {row.assignedTo?.name || row.assignBy || 'General MK'}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-bold">
                              Assigned MK Officer
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 10. Actions (Record Service, View Profile, PDF) */}
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Record Matchmaking Service button */}
                          <button
                            type="button"
                            onClick={() => setSelectedServiceCandidate(row)}
                            className="p-1.5 rounded-lg text-emerald-700 hover:text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                            title="Record Service (Incoming/Outgoing Call, CV Send, Update)"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>

                          {/* View Profile */}
                          <button
                            type="button"
                            onClick={() => setViewingProfile(row)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#181E54] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Full Candidate Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* PDF Biodata */}
                          {row.pdf && (row.pdf.dataUrl || row.pdf.url) && (
                            <a
                              href={row.pdf.dataUrl || row.pdf.url}
                              download={row.pdf.name || `${row.name}_biodata.pdf`}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-[#D81124] hover:bg-rose-50 transition-colors cursor-pointer"
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
