import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Trash2,
  RotateCcw,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Filter,
  Users2,
  GitFork,
  CheckCircle,
  Phone,
  Mail,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { CountryFlag, detectCountryIso } from './CountryFlag';

export interface TrashItem {
  id: string;
  originalId: string;
  category: 'Traffic' | 'Paid Traffic' | 'Lead';
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  profession?: string;
  createdBy: string;
  creatorRole: string;
  createdAt: string;
  deletedAt: number;
  deletedDate: string;
  deletedBy?: {
    id?: string;
    name: string;
    role: string;
  };
  expiresAt: number;
  msRemaining: number;
  daysRemaining: number;
  hoursRemaining: number;
  package?: string;
  images?: string[];
  rawItem?: any;
}

interface TrashBinPageProps {
  token: string;
}

export const TrashBinPage: React.FC<TrashBinPageProps> = ({ token }) => {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    traffic: 0,
    paidTraffic: 0,
    lead: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeCategory, setActiveCategory] = useState<'All' | 'Traffic' | 'Paid Traffic' | 'Lead'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Actions State
  const [actionToast, setActionToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [itemToPermanentDelete, setItemToPermanentDelete] = useState<TrashItem | null>(null);
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);
  const [showEmptyConfirmModal, setShowEmptyConfirmModal] = useState(false);

  // Load Trash items from Server
  const loadTrash = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/trash', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Failed to load trash bin items');
      }
      const data = await response.json();
      setItems(data.items || []);
      setCounts(data.counts || { total: 0, traffic: 0, paidTraffic: 0, lead: 0 });
    } catch (err: any) {
      setError(err.message || 'Error loading trash bin');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  // Restore Item
  const handleRestore = async (item: TrashItem) => {
    setRestoringId(item.id);
    try {
      const response = await fetch('/api/trash/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: item.id,
          category: item.category,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to restore item');
      }

      const resData = await response.json();
      setActionToast({
        type: 'success',
        message: resData.message || `${item.category} "${item.name}" restored to active records.`,
      });

      // Update state locally
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setCounts((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        traffic: item.category === 'Traffic' ? Math.max(0, prev.traffic - 1) : prev.traffic,
        paidTraffic: item.category === 'Paid Traffic' ? Math.max(0, prev.paidTraffic - 1) : prev.paidTraffic,
        lead: item.category === 'Lead' ? Math.max(0, prev.lead - 1) : prev.lead,
      }));
    } catch (err: any) {
      setActionToast({
        type: 'error',
        message: err.message || 'Error restoring item',
      });
    } finally {
      setRestoringId(null);
    }
  };

  // Permanently Delete Item (2nd Confirmation)
  const confirmPermanentDelete = async () => {
    if (!itemToPermanentDelete) return;
    setIsDeletingPermanently(true);

    try {
      const response = await fetch('/api/trash/permanent', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: itemToPermanentDelete.id,
          category: itemToPermanentDelete.category,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to permanently delete item');
      }

      setActionToast({
        type: 'success',
        message: `Permanently deleted ${itemToPermanentDelete.category} "${itemToPermanentDelete.name}" (${itemToPermanentDelete.id}) from database forever.`,
      });

      setItems((prev) => prev.filter((i) => i.id !== itemToPermanentDelete.id));
      setCounts((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        traffic: itemToPermanentDelete.category === 'Traffic' ? Math.max(0, prev.traffic - 1) : prev.traffic,
        paidTraffic: itemToPermanentDelete.category === 'Paid Traffic' ? Math.max(0, prev.paidTraffic - 1) : prev.paidTraffic,
        lead: itemToPermanentDelete.category === 'Lead' ? Math.max(0, prev.lead - 1) : prev.lead,
      }));
      setItemToPermanentDelete(null);
    } catch (err: any) {
      setActionToast({
        type: 'error',
        message: err.message || 'Error executing permanent deletion',
      });
    } finally {
      setIsDeletingPermanently(false);
    }
  };

  // Empty Trash
  const confirmEmptyTrash = async () => {
    setIsEmptyingTrash(true);
    try {
      const categoryParam = activeCategory === 'All' ? 'all' : activeCategory;
      const response = await fetch('/api/trash/empty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ category: categoryParam }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to empty trash');
      }

      const resData = await response.json();
      setActionToast({
        type: 'success',
        message: resData.message || 'Trash emptied permanently.',
      });
      setShowEmptyConfirmModal(false);
      loadTrash();
    } catch (err: any) {
      setActionToast({
        type: 'error',
        message: err.message || 'Error emptying trash',
      });
    } finally {
      setIsEmptyingTrash(false);
    }
  };

  // Filtered List
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Category Tab Filter
      if (activeCategory !== 'All' && item.category !== activeCategory) {
        return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchPhone = item.phone?.toLowerCase().includes(q);
        const matchId = item.id?.toLowerCase().includes(q);
        const matchEmail = item.email?.toLowerCase().includes(q);
        const matchProfession = item.profession?.toLowerCase().includes(q);
        const matchDeletedBy = item.deletedBy?.name?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchId && !matchEmail && !matchProfession && !matchDeletedBy) {
          return false;
        }
      }

      return true;
    });
  }, [items, activeCategory, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#181E54]">Trush Bin</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
              {counts.total} in Recycle
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Central repository for removed <strong>Traffic</strong>, <strong>Paid Traffic</strong>, and <strong>Lead</strong> records.
          </p>
        </div>

        {/* 10-Day Retention Notice & Empty Trash Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>10-Day Auto-Purge Policy</span>
          </div>

          <button
            type="button"
            onClick={loadTrash}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
            title="Refresh Trash Bin"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {counts.total > 0 && (
            <button
              type="button"
              onClick={() => setShowEmptyConfirmModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty {activeCategory === 'All' ? 'Trash' : activeCategory}</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Notification Toast */}
      {actionToast && (
        <div
          className={`p-3 rounded-2xl border text-xs flex items-center justify-between shadow-xs transition-all ${
            actionToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{actionToast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionToast(null)}
            className="text-slate-400 hover:text-slate-700 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Controls Container: Tabs & Search Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs: Traffic, Paid Traffic, Lead */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveCategory('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === 'All'
                  ? 'bg-[#181E54] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>All Items</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeCategory === 'All' ? 'bg-[#D81124] text-white' : 'bg-slate-200 text-slate-700'}`}>
                {counts.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('Traffic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === 'Traffic'
                  ? 'bg-[#181E54] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <GitFork className="w-3.5 h-3.5 text-blue-400" />
              <span>Traffic</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeCategory === 'Traffic' ? 'bg-[#D81124] text-white' : 'bg-slate-200 text-slate-700'}`}>
                {counts.traffic}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('Paid Traffic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === 'Paid Traffic'
                  ? 'bg-[#181E54] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Paid Traffic</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeCategory === 'Paid Traffic' ? 'bg-[#D81124] text-white' : 'bg-slate-200 text-slate-700'}`}>
                {counts.paidTraffic}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('Lead')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === 'Lead'
                  ? 'bg-[#181E54] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Lead</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeCategory === 'Lead' ? 'bg-[#D81124] text-white' : 'bg-slate-200 text-slate-700'}`}>
                {counts.lead}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, email, ID..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Trash Table */}
      <div className="-mt-1 sm:-mt-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs border-b border-red-100 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={loadTrash} className="font-bold underline cursor-pointer">
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[840px]">
            <thead className="bg-[#181E54] text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold w-12 text-center">SL</th>
                <th className="py-2.5 px-3.5 font-semibold w-40">Item ID &amp; Source</th>
                <th className="py-2.5 px-3.5 font-semibold">Candidate Details</th>
                <th className="py-2.5 px-3.5 font-semibold w-40">Deleted On &amp; By</th>
                <th className="py-2.5 px-3.5 font-semibold w-48">10-Day Retention Clock</th>
                <th className="py-2.5 px-3.5 font-semibold text-right w-44">Restore / Purge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#181E54] border-t-[#D81124] rounded-full animate-spin" />
                      <span>Loading trash bin items &amp; calculating retention clocks...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                        <Trash2 className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">Trash Bin is Empty</p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {searchQuery
                          ? 'No deleted records matched your search query.'
                          : `No deleted ${activeCategory === 'All' ? 'leads or traffic candidates' : activeCategory} currently in the Trash bin. Any removed item is kept here for 10 days before automatic permanent database cleanup.`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const daysLeft = item.daysRemaining;
                  const isExpiringSoon = daysLeft <= 2;
                  const isRestoring = restoringId === item.id;

                  // Category styling
                  const categoryBadge =
                    item.category === 'Lead'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : item.category === 'Paid Traffic'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200';

                  return (
                    <tr key={`${item.category}-${item.id}`} className="hover:bg-slate-50/90 transition-colors group">
                      {/* 1. SL */}
                      <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-500 text-center w-12">
                        {idx + 1}
                      </td>

                      {/* 2. Item ID & Category Source */}
                      <td className="py-2.5 px-3.5 w-40">
                        <div className="font-mono font-bold text-[#181E54] text-xs">
                          {item.id}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${categoryBadge}`}>
                            {item.category === 'Lead' && <Users2 className="w-2.5 h-2.5" />}
                            {item.category === 'Traffic' && <GitFork className="w-2.5 h-2.5" />}
                            {item.category === 'Paid Traffic' && <CheckCircle className="w-2.5 h-2.5" />}
                            <span>{item.category}</span>
                          </span>
                        </div>
                      </td>

                      {/* 3. Candidate Details */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-3">
                          {/* Photo Thumbnail */}
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 flex items-center justify-center">
                            {item.images && item.images.length > 0 ? (
                              <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-slate-400" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 text-xs truncate max-w-[200px]">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[11px] text-slate-500">
                              <span className="font-mono flex items-center gap-1">
                                <CountryFlag iso={detectCountryIso(item.phone)} className="w-3.5 h-2.5 rounded-xs" />
                                {item.phone}
                              </span>
                              {item.profession && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[120px]">{item.profession}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 4. Deleted On & By */}
                      <td className="py-2.5 px-3.5 w-40">
                        <div className="text-slate-700 font-semibold text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{item.deletedDate || 'N/A'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          By: <strong className="text-slate-700 font-semibold">{item.deletedBy?.name || item.createdBy || 'Staff'}</strong> ({item.deletedBy?.role || 'Admin'})
                        </div>
                      </td>

                      {/* 5. 10-Day Retention Clock */}
                      <td className="py-2.5 px-3.5 w-48">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className={`font-bold flex items-center gap-1 ${isExpiringSoon ? 'text-rose-600' : 'text-[#181E54]'}`}>
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{daysLeft <= 1 ? `Expires in ${item.hoursRemaining}h` : `${daysLeft} days remaining`}</span>
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              / 10 days
                            </span>
                          </div>

                          {/* Retention Countdown Progress Bar */}
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isExpiringSoon ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, (daysLeft / 10) * 100))}%` }}
                            />
                          </div>

                          <div className="text-[9px] text-slate-400">
                            Auto-purges permanently after 10 days
                          </div>
                        </div>
                      </td>

                      {/* 6. Actions: Restore & Permanent Delete */}
                      <td className="py-2.5 px-3.5 text-right w-44">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Restore Button */}
                          <button
                            type="button"
                            onClick={() => handleRestore(item)}
                            disabled={isRestoring}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-105 disabled:opacity-50"
                            title={`Restore ${item.category} back to active pipeline`}
                          >
                            <RotateCcw className={`w-3.5 h-3.5 text-emerald-700 ${isRestoring ? 'animate-spin' : ''}`} />
                            <span>{isRestoring ? 'Restoring...' : 'Restore'}</span>
                          </button>

                          {/* Permanent Delete Button */}
                          <button
                            type="button"
                            onClick={() => setItemToPermanentDelete(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-105"
                            title="Permanently remove from database (2nd confirmation)"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2nd-Confirmation Permanent Deletion Modal */}
      {itemToPermanentDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 transition-opacity duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-[#D81124] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-[#181E54]">
              Permanently Delete from Database?
            </h3>

            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to permanently delete this{' '}
              <strong className="text-slate-800 font-semibold">{itemToPermanentDelete.category}</strong> record:
            </p>

            <div className="my-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Candidate:</span>
                <span className="font-bold text-slate-800">{itemToPermanentDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ID:</span>
                <span className="font-mono font-semibold text-[#181E54]">{itemToPermanentDelete.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="font-mono text-slate-700">{itemToPermanentDelete.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Source:</span>
                <span className="font-semibold text-rose-700">{itemToPermanentDelete.category}</span>
              </div>
            </div>

            <p className="text-[11px] text-rose-600 font-semibold mb-4">
              ⚠️ Warning: This action CANNOT be undone. The record will be permanently purged from the database immediately.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setItemToPermanentDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPermanentDelete}
                disabled={isDeletingPermanently}
                className="px-4 py-2 bg-[#D81124] hover:bg-[#B80E1C] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingPermanently ? 'Purging forever...' : 'Yes, Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Trash Confirmation Modal */}
      {showEmptyConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 transition-opacity duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-[#D81124] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-[#181E54]">
              Empty {activeCategory === 'All' ? 'All Trash Items' : activeCategory}
            </h3>

            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              This will permanently delete all records currently inside the{' '}
              <strong className="text-slate-800 font-semibold">{activeCategory === 'All' ? 'Trash Bin' : activeCategory}</strong> section without waiting for the 10-day retention countdown.
            </p>

            <p className="text-[11px] text-rose-600 font-semibold my-4">
              ⚠️ This will remove all selected items from the database permanently.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowEmptyConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmEmptyTrash}
                disabled={isEmptyingTrash}
                className="px-4 py-2 bg-[#D81124] hover:bg-[#B80E1C] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isEmptyingTrash ? 'Emptying...' : 'Yes, Empty Trash Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
