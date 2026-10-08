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
} from 'lucide-react';
import { CountryFlag, detectCountryIso } from './CountryFlag';
import { TrafficProfileModal } from './TrafficProfileModal';
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
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [religionFilter, setReligionFilter] = useState<string>('all');
  const [maritalStatusFilter, setMaritalStatusFilter] = useState<string>('all');
  const [professionFilter, setProfessionFilter] = useState<string>('all');

  // Modals
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);

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

  // Client-side filtering
  const filteredCandidates = useMemo(() => {
    return candidates.filter((item) => {
      // 1. Top center manual search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchPhone = item.phone?.includes(q);
        const matchId = item.id?.toLowerCase().includes(q);
        const matchProfession = item.profession?.toLowerCase().includes(q);
        const matchCity = item.presentCity?.toLowerCase().includes(q);
        const matchRequirement = item.requirement?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchId && !matchProfession && !matchCity && !matchRequirement) {
          return false;
        }
      }

      // 2. Gender filter
      if (genderFilter !== 'all') {
        const itemGender = item.gender?.toLowerCase() || '';
        if (genderFilter === 'Male' && !itemGender.includes('male')) return false;
        if (genderFilter === 'Female' && !itemGender.includes('female')) return false;
      }

      // 3. Religion filter
      if (religionFilter !== 'all') {
        if (item.religion?.toLowerCase() !== religionFilter.toLowerCase()) return false;
      }

      // 4. Marital Status filter
      if (maritalStatusFilter !== 'all') {
        if (item.maritalStatus?.toLowerCase() !== maritalStatusFilter.toLowerCase()) return false;
      }

      // 5. Profession filter
      if (professionFilter !== 'all') {
        if (item.profession?.toLowerCase() !== professionFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [candidates, searchQuery, genderFilter, religionFilter, maritalStatusFilter, professionFilter]);

  // Calculate age from DOB
  const calculateAge = (dobString?: string) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
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
                  MK Exclusive
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Match verified profiles and find prospective proposals for assigned clients
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
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ==================================================
            TOP CENTER SEARCH BAR (Explicit Requirement)
            "top center a thakbe akta search option"
        ================================================== */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-center">
          <div className="relative w-full max-w-2xl">
            <Search className="w-4 h-4 text-[#181E54] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate by name, phone, profession, location, requirements..."
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
            FILTERING SECTION (Like Paid Traffic)
        ================================================== */}
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs">
          {/* Gender Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-500">Gender:</span>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-[#181E54]"
            >
              <option value="all">All Genders</option>
              <option value="Male">Groom (Male)</option>
              <option value="Female">Bride (Female)</option>
            </select>
          </div>

          {/* Religion Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-500">Religion:</span>
            <select
              value={religionFilter}
              onChange={(e) => setReligionFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-[#181E54]"
            >
              <option value="all">All Religions</option>
              {(fields.religions || ['Muslim', 'Hindu', 'Christian', 'Buddhist']).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Marital Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-500">Marital Status:</span>
            <select
              value={maritalStatusFilter}
              onChange={(e) => setMaritalStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-[#181E54]"
            >
              <option value="all">All Status</option>
              {(fields.maritalStatuses || ['Never Married', 'Divorced', 'Widowed']).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Profession Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-500">Profession:</span>
            <select
              value={professionFilter}
              onChange={(e) => setProfessionFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-[#181E54]"
            >
              <option value="all">All Professions</option>
              {(fields.professions || []).slice(0, 15).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {(genderFilter !== 'all' || religionFilter !== 'all' || maritalStatusFilter !== 'all' || professionFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setGenderFilter('all');
                setReligionFilter('all');
                setMaritalStatusFilter('all');
                setProfessionFilter('all');
              }}
              className="text-[11px] font-bold text-[#D81124] hover:underline ml-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ==================================================
          MATCHMAKING TABLE (Paid Traffic Style with MK Focus)
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
              {searchQuery || genderFilter !== 'all'
                ? 'Try broadening your search query or filter options'
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
                  <th className="py-3 px-3.5 min-w-[200px]">Candidate Profile</th>
                  <th className="py-3 px-3.5">Gender & Age</th>
                  <th className="py-3 px-3.5">Religion & Marital</th>
                  <th className="py-3 px-3.5">Location</th>
                  <th className="py-3 px-3.5">Package</th>
                  <th className="py-3 px-3.5 min-w-[180px]">Partner Requirements</th>
                  <th className="py-3 px-3.5 min-w-[140px]">Assigned MK</th>
                  <th className="py-3 px-3.5 text-right w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCandidates.map((row, idx) => {
                  const age = calculateAge(row.dateOfBirth);
                  const isFemale = row.gender?.toLowerCase() === 'female';

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
                        <div className="font-semibold text-slate-800 text-[11px]">{row.religion || 'Muslim'}</div>
                        <div className="text-[10px] text-slate-500">{row.maritalStatus || 'Never Married'}</div>
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

                      {/* 8. Partner Requirements snippet */}
                      <td className="py-2.5 px-3.5">
                        <p className="text-[11px] text-slate-600 line-clamp-2 max-w-[200px]" title={row.requirement}>
                          {row.requirement || 'Standard matching criteria'}
                        </p>
                      </td>

                      {/* 9. Assigned MK Account */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-semibold text-slate-800 text-xs truncate">
                          {row.assignedTo?.name || row.assignBy || 'General MK'}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-bold">
                          Assigned MK Officer
                        </div>
                      </td>

                      {/* 10. Actions (View Profile & PDF) */}
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingProfile(row)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#181E54] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Full Candidate Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

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
          canEdit={false} // MK cannot edit candidate
        />
      )}
    </div>
  );
};
