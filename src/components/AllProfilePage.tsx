import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Eye,
  User,
  Users2,
  Briefcase,
  GraduationCap,
  MapPin,
  Calendar,
  CheckCircle,
  X,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  Heart,
  Shield,
  Building,
  Rows3,
} from 'lucide-react';
import { CountryFlag, detectCountryIso } from './CountryFlag';
import { TrafficProfileModal } from './TrafficProfileModal';
import { useCrmFields } from '../context/CrmFieldsContext';

interface AllProfilePageProps {
  token?: string | null;
  user: any;
}

export const AllProfilePage: React.FC<AllProfilePageProps> = ({ token, user }) => {
  const isSuperAdmin = user?.role === 'Super Admin';
  const { fields } = useCrmFields();

  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compact mode for data table (persisted to localStorage)
  const [isCompact, setIsCompact] = useState<boolean>(() => {
    try {
      return localStorage.getItem('crm_allprofile_compact') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCompact = () => {
    setIsCompact((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('crm_allprofile_compact', String(next));
      } catch {}
      return next;
    });
  };

  // Selected profile for detailed modal preview
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

  // Expand / collapse advanced filters bar
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // ==================================================
  // FILTERS
  // ==================================================
  // 1. Manual search option (Detect anything across full page)
  const [searchQuery, setSearchQuery] = useState('');
  // 2. Age to age filtering (minAge to maxAge)
  const [minAge, setMinAge] = useState<string>('');
  const [maxAge, setMaxAge] = useState<string>('');
  // 3. Gender
  const [genderFilter, setGenderFilter] = useState('');
  // 4. Height
  const [heightFilter, setHeightFilter] = useState('');
  // 5. Job Type
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  // 6. Profession
  const [professionFilter, setProfessionFilter] = useState('');
  // 7. Qualification
  const [qualificationFilter, setQualificationFilter] = useState('');
  // 8. Religion
  const [religionFilter, setReligionFilter] = useState('');
  // 9. Present Country & Present City
  const [presentCountryFilter, setPresentCountryFilter] = useState('');
  const [presentCityFilter, setPresentCityFilter] = useState('');
  // 10. Permanent Country & Permanent City
  const [permanentCountryFilter, setPermanentCountryFilter] = useState('');
  const [permanentCityFilter, setPermanentCityFilter] = useState('');
  // 11. Category (Client, Paid Client)
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'client' | 'paid'>('all');

  // Load profiles from backend
  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/all-profiles', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to load profiles');
      }
      const data = await res.json();
      setProfiles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Error loading profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [token]);

  // Helper to calculate exact age in years from dateOfBirth
  const calculateAge = (dobString?: string): number | null => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 && age < 120 ? age : null;
  };

  // Check if any filters are currently active
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      searchQuery.trim() ||
        minAge ||
        maxAge ||
        genderFilter ||
        heightFilter ||
        jobTypeFilter ||
        professionFilter ||
        qualificationFilter ||
        religionFilter ||
        presentCountryFilter ||
        presentCityFilter ||
        permanentCountryFilter ||
        permanentCityFilter ||
        categoryFilter !== 'all'
    );
  }, [
    searchQuery,
    minAge,
    maxAge,
    genderFilter,
    heightFilter,
    jobTypeFilter,
    professionFilter,
    qualificationFilter,
    religionFilter,
    presentCountryFilter,
    presentCityFilter,
    permanentCountryFilter,
    permanentCityFilter,
    categoryFilter,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setMinAge('');
    setMaxAge('');
    setGenderFilter('');
    setHeightFilter('');
    setJobTypeFilter('');
    setProfessionFilter('');
    setQualificationFilter('');
    setReligionFilter('');
    setPresentCountryFilter('');
    setPresentCityFilter('');
    setPermanentCountryFilter('');
    setPermanentCityFilter('');
    setCategoryFilter('all');
  };

  // Filter profiles based on all criteria
  const filteredProfiles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const minA = minAge ? parseInt(minAge, 10) : null;
    const maxA = maxAge ? parseInt(maxAge, 10) : null;

    return profiles.filter((item) => {
      // 1. Manual search across anything in the profile
      if (q) {
        const candidateSearchCorpus = [
          item.name,
          item.phone,
          item.id,
          item.email,
          item.profession,
          item.qualification,
          item.jobType,
          item.religion,
          item.maritalStatus,
          item.presentCity,
          item.presentCountry,
          item.permanentCity,
          item.permanentCountry,
          item.createdBy,
          item.creatorRole,
          item.assignedTo?.name,
          item.requirement,
          item.package,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!candidateSearchCorpus.includes(q)) {
          return false;
        }
      }

      // 2. Age to Age filtering
      if (minA !== null || maxA !== null) {
        const age = calculateAge(item.dateOfBirth);
        if (age === null) return false;
        if (minA !== null && age < minA) return false;
        if (maxA !== null && age > maxA) return false;
      }

      // 3. Gender
      if (genderFilter && item.gender?.toLowerCase() !== genderFilter.toLowerCase()) {
        return false;
      }

      // 4. Height
      if (heightFilter && item.height !== heightFilter) {
        return false;
      }

      // 5. Job Type
      if (jobTypeFilter && item.jobType !== jobTypeFilter) {
        return false;
      }

      // 6. Profession
      if (professionFilter && item.profession !== professionFilter) {
        return false;
      }

      // 7. Qualification
      if (qualificationFilter && item.qualification !== qualificationFilter) {
        return false;
      }

      // 8. Religion
      if (religionFilter && item.religion !== religionFilter) {
        return false;
      }

      // 9. Present Country & Present City
      if (presentCountryFilter && item.presentCountry !== presentCountryFilter) {
        return false;
      }
      if (presentCityFilter && item.presentCity !== presentCityFilter) {
        return false;
      }

      // 10. Permanent Country & Permanent City
      if (permanentCountryFilter && item.permanentCountry !== permanentCountryFilter) {
        return false;
      }
      if (permanentCityFilter && item.permanentCity !== permanentCityFilter) {
        return false;
      }

      // 11. Category (Client vs Paid Client)
      const isPaid = item.isPaid || item.paymentStatus === 'accepted';
      if (categoryFilter === 'paid' && !isPaid) {
        return false;
      }
      if (categoryFilter === 'client' && isPaid) {
        return false;
      }

      return true;
    });
  }, [
    profiles,
    searchQuery,
    minAge,
    maxAge,
    genderFilter,
    heightFilter,
    jobTypeFilter,
    professionFilter,
    qualificationFilter,
    religionFilter,
    presentCountryFilter,
    presentCityFilter,
    permanentCountryFilter,
    permanentCityFilter,
    categoryFilter,
  ]);

  // Overall counts for quick stats
  const totalCount = profiles.length;
  const paidCount = profiles.filter((p) => p.isPaid || p.paymentStatus === 'accepted').length;
  const clientCount = totalCount - paidCount;
  const assignedCount = profiles.filter(
    (p) => Boolean(p.assignedTo?.name) || (Array.isArray(p.assignedMKs) && p.assignedMKs.length > 0)
  ).length;

  return (
    <div className="space-y-4 pb-12">
      {/* ==================================================
          PAGE HEADER: Title, Stats & Quick Summary
      ================================================== */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#181E54] text-white flex items-center justify-center shadow-xs">
                <Users2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-[#181E54] tracking-tight">
                    All Profile
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#181E54] border border-blue-200/70">
                    All Roles Access
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unified central directory of all qualified matrimonial candidates (Client, Paid Client, Matchmaking)
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Badges & Refresh */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
              <span>Total:</span>
              <strong className="font-mono text-[#181E54] font-bold">{totalCount}</strong>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-700 font-semibold">{paidCount} Paid</span>
              <span className="text-slate-300">|</span>
              <span className="text-blue-700 font-semibold">{clientCount} None Paid</span>
              <span className="text-slate-300">|</span>
              <span className="text-indigo-700 font-semibold">{assignedCount} Assigned</span>
            </div>

            {/* Compact Mode Toggle */}
            <button
              type="button"
              onClick={toggleCompact}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isCompact
                  ? 'bg-[#181E54] text-white border-[#181E54] shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={isCompact ? 'Compact mode active (click for standard view)' : 'Click to enable compact mode'}
            >
              <Rows3 className="w-3.5 h-3.5" />
              <span>Compact</span>
              {isCompact && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>

            <button
              type="button"
              onClick={loadProfiles}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition-colors cursor-pointer"
              title="Refresh All Profiles"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ==================================================
            PRIMARY SEARCH & CATEGORY FILTER BAR
        ================================================== */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* 1. Manual Search Bar (Searches anything) */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Detect anything across full page: Name, Phone, ID, Profession, Location, Bio..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#181E54]/20 focus:border-[#181E54] transition-all"
            />
          </div>

          {/* Category Toggle & Advanced Filters Toggle Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Category Filter Pills */}
            <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-white text-[#181E54] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('client')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  categoryFilter === 'client'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                None Paid
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('paid')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  categoryFilter === 'paid'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paid
              </button>
            </div>

            {/* Toggle Advanced Filters Button */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showAdvancedFilters || hasActiveFilters
                  ? 'bg-[#181E54] text-white border-[#181E54]'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {showAdvancedFilters ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 text-xs text-[#D81124] hover:underline font-bold cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* ==================================================
            EXPANDABLE ADVANCED FILTER MATRIX
            Contains:
            - Age to Age Filtering (minAge - maxAge)
            - Gender
            - Height
            - Job Type
            - Profession
            - Qualification
            - Religion
            - Present Country & City
            - Permanent Country & City
        ================================================== */}
        {showAdvancedFilters && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
              {/* 1. Age to Age Filtering */}
              <div className="col-span-2 sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Age Range (Years)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="18"
                    max="90"
                    placeholder="Min"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-[#181E54]"
                  />
                  <span className="text-slate-400 font-bold">to</span>
                  <input
                    type="number"
                    min="18"
                    max="90"
                    placeholder="Max"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-[#181E54]"
                  />
                </div>
              </div>

              {/* 2. Gender */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Gender
                </label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-[#181E54]"
                >
                  <option value="">All Genders</option>
                  {(fields.genders || ['Male', 'Female']).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Height */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Height
                </label>
                <select
                  value={heightFilter}
                  onChange={(e) => setHeightFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-[#181E54]"
                >
                  <option value="">All Heights</option>
                  {(fields.heights || []).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Job Type */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Job Type
                </label>
                <select
                  value={jobTypeFilter}
                  onChange={(e) => setJobTypeFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-[#181E54]"
                >
                  <option value="">All Job Types</option>
                  {(fields.jobTypes || []).map((jt) => (
                    <option key={jt} value={jt}>
                      {jt}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Profession */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Profession
                </label>
                <select
                  value={professionFilter}
                  onChange={(e) => setProfessionFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-[#181E54]"
                >
                  <option value="">All Professions</option>
                  {(fields.professions || []).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Qualification */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Qualification
                </label>
                <select
                  value={qualificationFilter}
                  onChange={(e) => setQualificationFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-[#181E54]"
                >
                  <option value="">All Qualifications</option>
                  {(fields.qualifications || []).map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>

              {/* 7. Religion */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Religion
                </label>
                <select
                  value={religionFilter}
                  onChange={(e) => setReligionFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-[#181E54]"
                >
                  <option value="">All Religions</option>
                  {(fields.religions || []).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* 8. Present Country */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Present Country
                </label>
                <select
                  value={presentCountryFilter}
                  onChange={(e) => setPresentCountryFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-[#181E54]"
                >
                  <option value="">All Countries</option>
                  {(fields.countries || ['Bangladesh']).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* 9. Present City */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Present City
                </label>
                <select
                  value={presentCityFilter}
                  onChange={(e) => setPresentCityFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-[#181E54]"
                >
                  <option value="">All Cities</option>
                  {(fields.cities || []).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* 10. Permanent Country */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Permanent Country
                </label>
                <select
                  value={permanentCountryFilter}
                  onChange={(e) => setPermanentCountryFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-[#181E54]"
                >
                  <option value="">All Countries</option>
                  {(fields.countries || ['Bangladesh']).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* 11. Permanent City */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Permanent City
                </label>
                <select
                  value={permanentCityFilter}
                  onChange={(e) => setPermanentCityFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-[#181E54]"
                >
                  <option value="">All Cities</option>
                  {(fields.cities || []).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Filter status row */}
        {hasActiveFilters && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">
              Showing filtered results (
              <strong className="text-[#181E54]">{filteredProfiles.length}</strong> of{' '}
              {profiles.length} profiles)
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[#D81124] hover:underline font-semibold cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ==================================================
          ALL PROFILES TABLE
          Columns specified in prompt:
          1. Row Number & ID (Serial 1, 2, 3... + ID)
          2. Name + Profile picture
          3. Category (None Paid, Paid)
          4. Gender
          5. Profession
          6. Created and assign
          7. Phone number
          8. Action (Open Profile popup)
      ================================================== */}
      <div className="-mt-1 sm:-mt-1.5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-7 h-7 border-2 border-[#181E54] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium text-slate-500">Loading candidate profiles...</span>
            </div>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-600 px-4">
            <p className="text-xs font-semibold">{error}</p>
            <button
              onClick={loadProfiles}
              className="mt-3 px-3 py-1.5 text-xs bg-[#181E54] text-white rounded-lg font-medium cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="py-16 text-center text-slate-500 px-4">
            <User className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No candidate profiles found</p>
            <p className="text-xs text-slate-400 mt-1">
              {hasActiveFilters
                ? 'Try adjusting your search query or filter attributes'
                : 'Qualified client records will automatically appear here once added in Client section.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-3 px-3 py-1.5 text-xs bg-[#181E54] text-white rounded-xl font-bold cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1100px]">
              <thead className="bg-[#181E54] text-white uppercase tracking-wider font-semibold">
                <tr>
                  <th className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[9.5px]' : 'py-2.5 px-2.5 sm:px-3 text-[10px]'} font-semibold w-16`}>Serial</th>
                  <th className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[9.5px]' : 'py-2.5 px-2.5 sm:px-3 text-[10px]'} font-semibold w-28`}>ID &amp; Date</th>
                  <th className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[9.5px]' : 'py-2.5 px-2.5 sm:px-3 text-[10px]'} font-semibold min-w-[220px]`}>
                    Candidate Name
                  </th>
                  <th className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[9.5px]' : 'py-2.5 px-2.5 sm:px-3 text-[10px]'} font-semibold w-28`}>Category</th>
                  <th className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[9.5px]' : 'py-2.5 px-2.5 sm:px-3 text-[10px]'} font-semibold w-24`}>Gender</th>
                  <th className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[9.5px]' : 'py-2.5 px-2.5 sm:px-3 text-[10px]'} font-semibold min-w-[150px]`}>Profession</th>
                  <th className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[9.5px]' : 'py-2.5 px-2.5 sm:px-3 text-[10px]'} font-semibold min-w-[160px]`}>
                    Created &amp; Assign
                  </th>
                  <th className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[9.5px]' : 'py-2.5 px-2.5 sm:px-3 text-[10px]'} font-semibold w-32`}>Phone</th>
                  <th className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[9.5px]' : 'py-2.5 px-2.5 sm:px-3 text-[10px]'} font-semibold text-right w-20`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProfiles.map((row, index) => {
                  const isPaid = row.isPaid || row.paymentStatus === 'accepted';
                  const candidateAge = calculateAge(row.dateOfBirth);
                  const candidatePhoto =
                    Array.isArray(row.images) && row.images.length > 0 ? row.images[0] : null;

                  // Assigned staff detection
                  const assignedAgentName =
                    row.assignedTo?.name ||
                    (Array.isArray(row.assignedMKs) && row.assignedMKs[0]?.name) ||
                    row.assignBy ||
                    null;

                  return (
                    <tr
                      key={row.id || index}
                      onClick={() => setSelectedProfile(row)}
                      className={`hover:bg-slate-50/85 transition-colors cursor-pointer group ${
                        isCompact ? 'text-[11px]' : 'text-xs'
                      }`}
                      title="Click row to open full candidate bio-data modal"
                    >
                      {/* 1. Row Number (1 > 2 > 3 sequential entry order) */}
                      <td className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[11px]' : 'py-3 px-2.5 sm:px-3 text-xs'} font-mono font-semibold text-slate-500 w-16`}>
                        {index + 1}
                      </td>

                      {/* ID & Date */}
                      <td className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5' : 'py-3 px-2.5 sm:px-3'} w-28`}>
                        <div className={`font-mono font-bold text-[#181E54] ${isCompact ? 'text-[11px]' : 'text-xs'}`}>
                          {row.id}
                        </div>
                        <div className={`text-slate-400 font-mono ${isCompact ? 'text-[9px]' : 'text-[10px] mt-0.5'}`}>
                          {row.createdAt || 'Recent'}
                        </div>
                      </td>

                      {/* 2. Name + Profile Picture */}
                      <td className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5' : 'py-3 px-2.5 sm:px-3'} min-w-[220px]`}>
                        <div className={`flex items-center ${isCompact ? 'gap-2' : 'gap-2.5'}`}>
                          {/* Thumbnail */}
                          <div className="relative shrink-0">
                            <div className={`${isCompact ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-10 h-10'} rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shadow-2xs`}>
                              {candidatePhoto ? (
                                <img
                                  src={candidatePhoto}
                                  alt={row.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div
                                  className={`w-full h-full flex items-center justify-center font-bold ${
                                    isCompact ? 'text-[10px]' : 'text-xs'
                                  } ${
                                    row.gender?.toLowerCase() === 'female'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-blue-100 text-blue-900'
                                  }`}
                                >
                                  {row.name ? row.name.charAt(0).toUpperCase() : 'C'}
                                </div>
                              )}
                            </div>
                            {/* Online / Active status dot */}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 ${
                                isCompact ? 'w-2.5 h-2.5 border-[1.5px]' : 'w-3 h-3 border-2'
                              } rounded-full border-white ${
                                isPaid ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              title={isPaid ? 'Paid Client' : 'Registered Client'}
                            />
                          </div>

                          {/* Candidate Name & Attribute teaser */}
                          <div className="min-w-0">
                            <div className={`font-bold text-[#181E54] truncate group-hover:text-[#D81124] transition-colors flex items-center gap-1.5 ${
                              isCompact ? 'text-xs' : 'text-xs sm:text-sm'
                            }`}>
                              <span>{row.name}</span>
                              {candidateAge && (
                                <span className={`text-slate-500 font-mono font-normal ${
                                  isCompact ? 'text-[9.5px]' : 'text-[10px]'
                                }`}>
                                  ({candidateAge} yrs)
                                </span>
                              )}
                            </div>
                            <div className={`text-slate-500 truncate flex items-center gap-1 ${
                              isCompact ? 'text-[10px]' : 'text-[11px] mt-0.5'
                            }`}>
                              <span>{row.maritalStatus || 'Unmarried'}</span>
                              {row.religion && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="truncate">{row.religion}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Category (None Paid, Paid) */}
                      <td className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5' : 'py-3 px-2.5 sm:px-3'} w-28`}>
                        {isPaid ? (
                          <span className={`inline-flex items-center gap-1 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs ${
                            isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
                          }`}>
                            <CheckCircle className={`${isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-emerald-600 shrink-0`} />
                            <span>Paid</span>
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 rounded-full font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs ${
                            isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>None Paid</span>
                          </span>
                        )}
                      </td>

                      {/* 4. Gender */}
                      <td className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5' : 'py-3 px-2.5 sm:px-3'} w-24`}>
                        <span
                          className={`inline-flex items-center rounded-full font-semibold ${
                            isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
                          } ${
                            row.gender?.toLowerCase() === 'female'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1 ${
                              row.gender?.toLowerCase() === 'female'
                                ? 'bg-rose-500'
                                : 'bg-blue-500'
                            }`}
                          />
                          {row.gender || 'N/A'}
                        </span>
                      </td>

                      {/* 5. Profession */}
                      <td className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5' : 'py-3 px-2.5 sm:px-3'} min-w-[150px]`}>
                        <div className={`font-semibold text-slate-800 truncate ${isCompact ? 'text-[11px]' : 'text-xs'}`}>
                          {row.profession || '—'}
                        </div>
                        <div className={`text-slate-500 truncate ${isCompact ? 'text-[9.5px]' : 'text-[10px] mt-0.5'}`}>
                          {row.qualification || row.jobType || 'Standard Candidate'}
                        </div>
                      </td>

                      {/* 6. Created and assign */}
                      <td className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5' : 'py-3 px-2.5 sm:px-3'} min-w-[160px]`}>
                        <div className={`text-slate-800 truncate ${isCompact ? 'text-[11px]' : 'text-xs'}`}>
                          <span className="text-slate-400 font-medium">Created: </span>
                          <strong className="font-semibold text-[#181E54]">
                            {row.createdBy || 'Sohag'}
                          </strong>
                          {row.creatorRole && (
                            <span className="text-[10px] text-slate-500 ml-1">
                              ({row.creatorRole})
                            </span>
                          )}
                        </div>
                        <div className={`text-slate-600 truncate ${isCompact ? 'text-[10px]' : 'text-[11px] mt-0.5'}`}>
                          {assignedAgentName ? (
                            <span className={`inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60 font-semibold ${
                              isCompact ? 'text-[9.5px]' : 'text-[10px]'
                            }`}>
                              <span>Assign:</span>
                              <strong>{assignedAgentName}</strong>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">
                              Unassigned
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. Phone number */}
                      <td className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5' : 'py-3 px-2.5 sm:px-3'} w-32 font-mono text-slate-800 font-semibold ${
                        isCompact ? 'text-[11px]' : 'text-xs'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <CountryFlag
                            iso={detectCountryIso(row.phone)}
                            className="w-3.5 h-2.5 rounded-xs shrink-0"
                          />
                          <span className="truncate">{row.phone || '—'}</span>
                        </div>
                      </td>

                      {/* 8. Action (Open Profile popup) */}
                      <td className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5' : 'py-3 px-2.5 sm:px-3'} text-right w-20`}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProfile(row);
                          }}
                          className={`inline-flex items-center gap-1 bg-slate-100 hover:bg-[#181E54] text-slate-700 hover:text-white rounded-lg font-semibold transition-all cursor-pointer shadow-2xs border border-slate-200/80 ${
                            isCompact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
                          }`}
                          title="View Profile Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">View</span>
                        </button>
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
          READ-ONLY PROFILE POPUP MODAL
          - Opens when clicking any row or View button
          - canEdit = FALSE (no edit access for anyone)
          - showPaymentInfo = TRUE only for Super Admin
            (Restricted / hidden for all other roles)
      ================================================== */}
      {selectedProfile && (
        <TrafficProfileModal
          isOpen={!!selectedProfile}
          traffic={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          token={token || undefined}
          canEdit={false}
          showPaymentInfo={isSuperAdmin}
        />
      )}
    </div>
  );
};
