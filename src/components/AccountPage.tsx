import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Search,
  Shield,
  Phone,
  Mail,
  Calendar,
  Building,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Upload,
  User,
  Camera,
  X,
  RefreshCw,
  Power,
  Rows3,
} from 'lucide-react';

interface AccountUser {
  id: string;
  name: string;
  phone: string; // Official number
  role: 'Super Admin' | 'CRO' | 'MK';
  gender?: 'Male' | 'Female' | 'Other';
  joiningDate?: string;
  branch?: string;
  personalPhone?: string;
  presentLocation?: string;
  currentLocation?: string;
  email?: string;
  profilePicture?: string;
  status?: 'active' | 'suspended';
  createdAt?: number;
}

interface AccountPageProps {
  user: any;
  token: string;
  onUpdateCurrentUser?: (updatedUser: any) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ user, token, onUpdateCurrentUser }) => {
  const isSuperAdmin = user?.role === 'Super Admin';

  const [accounts, setAccounts] = useState<AccountUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Compact mode for data table (persisted to localStorage)
  const [isCompact, setIsCompact] = useState<boolean>(() => {
    try {
      return localStorage.getItem('crm_account_compact') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCompact = () => {
    setIsCompact((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('crm_account_compact', String(next));
      } catch {}
      return next;
    });
  };

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountUser | null>(null);
  const [accountToSuspend, setAccountToSuspend] = useState<AccountUser | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<AccountUser | null>(null);

  // Load Accounts from server
  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to load accounts');
      }
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Error loading accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [token]);

  // Toggle Suspend / Active status
  const handleToggleStatus = async (account: AccountUser) => {
    try {
      const res = await fetch(`/api/accounts/${account.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update account status');
      }
      setAccountToSuspend(null);
      loadAccounts();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  // Delete Account
  const handleDeleteAccount = async (account: AccountUser) => {
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }
      setAccountToDelete(null);
      loadAccounts();
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      acc.name.toLowerCase().includes(q) ||
      acc.phone.includes(q) ||
      (acc.email && acc.email.toLowerCase().includes(q)) ||
      (acc.personalPhone && acc.personalPhone.includes(q)) ||
      (acc.branch && acc.branch.toLowerCase().includes(q));

    const matchRole = roleFilter === 'all' || acc.role === roleFilter;
    const matchStatus = statusFilter === 'all' || (acc.status || 'active') === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="space-y-4 pb-12">
      {/* ==================================================
          PAGE HEADER: Title, Summary & "Add Account" Button
      ================================================== */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#181E54] text-white flex items-center justify-center shadow-xs">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-[#181E54] tracking-tight">
                  {isSuperAdmin ? 'Staff Account Management' : 'My Account Profile'}
                </h1>
                <p className="text-xs text-slate-500">
                  {isSuperAdmin
                    ? 'Register employees, assign CRO/MK roles, and manage login credentials'
                    : 'View and update your personal employee profile details'}
                </p>
              </div>
            </div>
          </div>

          {/* Top Right Actions & Quick Stats */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* Quick Count Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600">
              <span>Total Staff:</span>
              <span className="font-bold font-mono text-[#181E54]">{accounts.length}</span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-700 font-semibold">{accounts.filter(a => a.status !== 'suspended').length} Active</span>
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
              onClick={loadAccounts}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition-colors cursor-pointer"
              title="Refresh Accounts"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#181E54] hover:bg-[#121742] text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-sm cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-[#D81124]" />
                <span>Add Account</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filters (Super Admin only or multiple accounts) */}
        {isSuperAdmin && (
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, official number, branch..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#181E54]/20 focus:border-[#181E54] transition-all"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-[#181E54]"
              >
                <option value="all">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="CRO">CRO</option>
                <option value="MK">MK</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-[#181E54]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>

              {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                  }}
                  className="px-2.5 py-1.5 text-xs text-[#D81124] hover:underline font-semibold cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==================================================
          ACCOUNTS TABLE
          Columns matching CRM standard style:
          - Serial (1, 2, 3...)
          - Employee / Staff Name with Avatar & Subtitle
          - Role (CRO, MK, Super Admin)
          - Branch
          - Official Phone (Login)
          - Joining Date
          - Status (Active / Suspended)
          - Action (Update & edit, Suspend/Activate, Delete)
      ================================================== */}
      <div className="-mt-1 sm:-mt-1.5 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-7 h-7 border-2 border-[#181E54] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium text-slate-500">Loading account records...</span>
            </div>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-600 px-4">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-[#D81124]" />
            <p className="text-xs font-semibold">{error}</p>
            <button
              onClick={loadAccounts}
              className="mt-3 px-3 py-1.5 text-xs bg-[#181E54] text-white rounded-lg font-medium cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 px-4">
            <User className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No account records found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery ? 'Try adjusting your search criteria' : 'Click "Add Account" above to register staff'}
            </p>
            {isSuperAdmin && !searchQuery && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#181E54] hover:bg-[#121742] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#D81124]" />
                <span>Add Account</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1050px]">
              <thead className="bg-[#181E54] text-white uppercase tracking-wider font-semibold">
                <tr>
                  <th className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[9.5px]' : 'py-2.5 px-2.5 sm:px-3 text-[10px]'} font-semibold w-14`}>Serial</th>
                  <th className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[9.5px]' : 'py-2.5 px-2.5 sm:px-3 text-[10px]'} font-semibold min-w-[220px]`}>Employee / Staff</th>
                  <th className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[9.5px]' : 'py-2.5 px-2.5 sm:px-3 text-[10px]'} font-semibold w-28`}>Role</th>
                  <th className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[9.5px]' : 'py-2.5 px-2.5 sm:px-3 text-[10px]'} font-semibold w-28`}>Branch</th>
                  <th className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[9.5px]' : 'py-2.5 px-2.5 sm:px-3 text-[10px]'} font-semibold w-40`}>Official Number (Login)</th>
                  <th className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[9.5px]' : 'py-2.5 px-2.5 sm:px-3 text-[10px]'} font-semibold w-32`}>Joining Date</th>
                  <th className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[9.5px]' : 'py-2.5 px-2.5 sm:px-3 text-[10px]'} font-semibold w-28`}>Status</th>
                  <th className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[9.5px]' : 'py-2.5 px-2.5 sm:px-3 text-[10px]'} font-semibold text-right w-28`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAccounts.map((acc, index) => {
                  const isSuspended = acc.status === 'suspended';
                  const isPrimaryAdmin = acc.id === 'usr_super_admin';

                  return (
                    <tr
                      key={acc.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSuspended ? 'bg-rose-50/30' : ''
                      } ${isCompact ? 'text-[11px]' : 'text-xs'}`}
                    >
                      {/* Serial Number */}
                      <td className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[11px]' : 'py-3 px-2.5 sm:px-3 text-xs'} font-mono font-semibold text-slate-500 w-14`}>
                        {index + 1}
                      </td>

                      {/* 1. Name with Profile Picture on the far left */}
                      <td className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5' : 'py-3 px-2.5 sm:px-3'} min-w-[220px]`}>
                        <div className={`flex items-center ${isCompact ? 'gap-2' : 'gap-3'}`}>
                          {/* Profile Picture Thumbnail */}
                          <div className="relative shrink-0">
                            <div className={`${isCompact ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-10 h-10'} rounded-full overflow-hidden border border-slate-200 shadow-2xs bg-slate-100 flex items-center justify-center`}>
                              {acc.profilePicture ? (
                                <img
                                  src={acc.profilePicture}
                                  alt={acc.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className={`w-full h-full flex items-center justify-center font-bold ${
                                    isCompact ? 'text-[10px]' : 'text-xs'
                                  } ${
                                    acc.role === 'Super Admin'
                                      ? 'bg-amber-100 text-amber-900'
                                      : acc.role === 'CRO'
                                      ? 'bg-purple-100 text-purple-900'
                                      : 'bg-blue-100 text-blue-900'
                                  }`}
                                >
                                  {acc.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            {/* Online / Status dot */}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 ${
                                isCompact ? 'w-2.5 h-2.5 border-[1.5px]' : 'w-3 h-3 border-2'
                              } rounded-full border-white ${
                                isSuspended ? 'bg-red-500' : 'bg-emerald-500'
                              }`}
                              title={isSuspended ? 'Suspended' : 'Active Account'}
                            />
                          </div>

                          {/* Name & Contact preview */}
                          <div className="min-w-0">
                            <div className={`font-bold text-[#181E54] truncate flex items-center gap-1.5 ${
                              isCompact ? 'text-xs' : 'text-xs sm:text-sm'
                            }`}>
                              <span>{acc.name}</span>
                              {acc.id === user?.id && (
                                <span className={`bg-blue-50 text-blue-700 rounded font-bold border border-blue-200/60 ${
                                  isCompact ? 'px-1 py-0.2 text-[9px]' : 'px-1.5 py-0.5 text-[10px]'
                                }`}>
                                  You
                                </span>
                              )}
                            </div>
                            <div className={`text-slate-500 truncate flex items-center gap-1.5 ${
                              isCompact ? 'text-[10px]' : 'text-[11px] mt-0.5'
                            }`}>
                              {acc.email ? (
                                <>
                                  <Mail className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-slate-400 shrink-0`} />
                                  <span className="truncate">{acc.email}</span>
                                </>
                              ) : acc.personalPhone ? (
                                <>
                                  <Phone className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-slate-400 shrink-0`} />
                                  <span>{acc.personalPhone}</span>
                                </>
                              ) : (
                                <span className="text-slate-400 italic">No personal contact</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Role (Super Admin, CRO, MK) */}
                      <td className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5' : 'py-3 px-2.5 sm:px-3'} w-28`}>
                        <span
                          className={`inline-flex items-center rounded-lg font-bold ${
                            isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
                          } ${
                            acc.role === 'Super Admin'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : acc.role === 'CRO'
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {acc.role}
                        </span>
                      </td>

                      {/* Branch */}
                      <td className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5' : 'py-3 px-2.5 sm:px-3'} w-28`}>
                        <div className={`flex items-center gap-1.5 text-slate-800 font-semibold ${
                          isCompact ? 'text-[11px]' : 'text-xs'
                        }`}>
                          <Building className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-slate-400 shrink-0`} />
                          <span>{acc.branch || 'Uttara'}</span>
                        </div>
                      </td>

                      {/* 3. Official Number (Login number) */}
                      <td className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[11px]' : 'py-3 px-2.5 sm:px-3 text-xs'} w-40 font-mono font-semibold text-slate-800`}>
                        <div className="flex items-center gap-1.5">
                          <Phone className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-[#181E54] shrink-0`} />
                          <span>{acc.phone}</span>
                        </div>
                      </td>

                      {/* 4. Joining Date */}
                      <td className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5 text-[11px]' : 'py-3 px-2.5 sm:px-3 text-xs'} w-32 text-slate-600 font-mono`}>
                        <div className="flex items-center gap-1.5">
                          <Calendar className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-slate-400 shrink-0`} />
                          <span>{acc.joiningDate || '2024-01-15'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5' : 'py-3 px-2.5 sm:px-3'} w-28`}>
                        {isSuspended ? (
                          <span className={`inline-flex items-center gap-1 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs ${
                            isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
                          }`}>
                            <XCircle className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0`} />
                            <span>Suspended</span>
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs ${
                            isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
                          }`}>
                            <CheckCircle className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0`} />
                            <span>Active</span>
                          </span>
                        )}
                      </td>

                      {/* 5. Action (Update & edit Account, Suspend and active Account) */}
                      <td className={`${isCompact ? 'py-1.5 px-2 sm:px-2.5' : 'py-3 px-2.5 sm:px-3'} text-right w-28`}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit / Update Button */}
                          <button
                            type="button"
                            onClick={() => setEditingAccount(acc)}
                            className={`${
                              isCompact ? 'p-1 sm:p-1.5' : 'p-1.5 sm:p-2'
                            } rounded-lg text-slate-600 hover:text-[#181E54] hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer`}
                            title={isSuperAdmin ? 'Update and edit Account' : 'Edit profile info'}
                          >
                            <Edit className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                          </button>

                          {/* Super Admin specific actions: Suspend / Active & Delete */}
                          {isSuperAdmin && !isPrimaryAdmin && (
                            <>
                              {/* Suspend / Active Toggle */}
                              <button
                                type="button"
                                onClick={() => setAccountToSuspend(acc)}
                                className={`${
                                  isCompact ? 'p-1 sm:p-1.5' : 'p-1.5 sm:p-2'
                                } rounded-lg border border-slate-200/80 transition-colors cursor-pointer ${
                                  isSuspended
                                    ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                    : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                                }`}
                                title={isSuspended ? 'Activate Account' : 'Suspend Account'}
                              >
                                <Power className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                              </button>

                              {/* Delete Account */}
                              {acc.id !== user?.id && (
                                <button
                                  type="button"
                                  onClick={() => setAccountToDelete(acc)}
                                  className={`${
                                    isCompact ? 'p-1 sm:p-1.5' : 'p-1.5 sm:p-2'
                                  } rounded-lg text-slate-400 hover:text-[#D81124] hover:bg-rose-50 border border-slate-200/80 transition-colors cursor-pointer`}
                                  title="Delete Account"
                                >
                                  <Trash2 className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                                </button>
                              )}
                            </>
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
          POPUP MODAL 1: ADD ACCOUNT (Super Admin Only)
          Fields required by prompt:
          - Employee name
          - Joining date
          - Gender
          - Role (CRO, MK)
          - Branch name (Uttara, Dhanmondi)
          - Official number (Required for login)
          - Personal number
          - Present location
          - Current location
          - Personal Email
          - Profile picture
          - Password (Required for login)
          - Add account button
      ================================================== */}
      {isAddModalOpen && (
        <AddAccountModal
          isOpen={isAddModalOpen}
          token={token}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            loadAccounts();
          }}
        />
      )}

      {/* ==================================================
          POPUP MODAL 2: EDIT / UPDATE ACCOUNT
          - For Super Admin: Full edit access
          - For CRO/MK: Basic information change ONLY (Without Official number and password)
      ================================================== */}
      {editingAccount && (
        <EditAccountModal
          isOpen={!!editingAccount}
          account={editingAccount}
          isSuperAdmin={isSuperAdmin}
          token={token}
          onClose={() => setEditingAccount(null)}
          onSuccess={(updatedUser) => {
            setEditingAccount(null);
            loadAccounts();
            if (updatedUser && (updatedUser.id === user?.id || editingAccount.id === user?.id)) {
              onUpdateCurrentUser?.(updatedUser);
            }
          }}
        />
      )}

      {/* ==================================================
          CONFIRMATION MODAL: SUSPEND / ACTIVATE
      ================================================== */}
      {accountToSuspend && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  accountToSuspend.status === 'suspended'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {accountToSuspend.status === 'suspended' ? 'Activate Account?' : 'Suspend Account?'}
                </h3>
                <p className="text-xs text-slate-500">Employee: {accountToSuspend.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {accountToSuspend.status === 'suspended'
                ? `This will restore login and CRM access for ${accountToSuspend.name} (${accountToSuspend.role}).`
                : `Suspended accounts cannot log in to the CRM or scanner until reactivated by Super Admin.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAccountToSuspend(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus(accountToSuspend)}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs cursor-pointer ${
                  accountToSuspend.status === 'suspended'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                Confirm {accountToSuspend.status === 'suspended' ? 'Activation' : 'Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          CONFIRMATION MODAL: DELETE ACCOUNT
      ================================================== */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-[#D81124] flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Account Permanently?</h3>
                <p className="text-xs text-slate-500">{accountToDelete.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this account? This action cannot be undone and will permanently
              revoke credentials for official phone <span className="font-mono font-semibold">{accountToDelete.phone}</span>.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAccount(accountToDelete)}
                className="px-4 py-2 text-xs font-bold text-white bg-[#D81124] hover:bg-red-700 rounded-xl shadow-xs cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==============================================================================
// ADD ACCOUNT MODAL COMPONENT (Super Admin only)
// ==============================================================================
interface AddAccountModalProps {
  isOpen: boolean;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  token,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [role, setRole] = useState<'CRO' | 'MK'>('CRO');
  const [branch, setBranch] = useState('Uttara');
  const [phone, setPhone] = useState(''); // Official number (required)
  const [personalPhone, setPersonalPhone] = useState('');
  const [presentLocation, setPresentLocation] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [password, setPassword] = useState(''); // Required for login
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Keyboard shortcut: Escape to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Profile photo file upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, JPEG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfilePicture(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Employee name is required');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Official number is required for login');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Password is required for login');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          joiningDate,
          gender,
          role,
          branch,
          phone: phone.trim(),
          personalPhone: personalPhone.trim(),
          presentLocation: presentLocation.trim(),
          currentLocation: currentLocation.trim(),
          email: email.trim(),
          profilePicture,
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-4xl xl:max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#181E54] text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-4 h-4 text-[#D81124]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#181E54]">Add New Account</h2>
              <p className="text-[11px] text-slate-500">Official staff registration with role and login credentials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 2-Column Responsive Layout for Web Screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            
            {/* LEFT COLUMN: Identity, Photo & Role Assignment */}
            <div className="space-y-4">
              {/* Profile Picture Uploader & Employee Name */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                {/* Picture Preview & Upload */}
                <div className="relative shrink-0 group">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 bg-white flex items-center justify-center shadow-xs">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <label
                    htmlFor="add-account-photo"
                    className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-[10px] font-bold"
                  >
                    <Camera className="w-4 h-4 mb-0.5" />
                    <span>Upload</span>
                  </label>
                  <input
                    id="add-account-photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 w-full space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Employee Name <span className="text-[#D81124]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Tanvir Ahmed"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="add-account-photo"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-400" />
                      <span>Choose Photo</span>
                    </label>
                    {profilePicture && (
                      <button
                        type="button"
                        onClick={() => setProfilePicture('')}
                        className="text-[11px] text-red-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Role, Gender & Joining Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Role <span className="text-[#D81124]">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54] font-semibold text-[#181E54]"
                  >
                    <option value="CRO">CRO (Client Relations)</option>
                    <option value="MK">MK (Matchmaking)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54]"
                  />
                </div>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Branch Name</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54]"
                >
                  <option value="Uttara">Uttara Branch</option>
                  <option value="Dhanmondi">Dhanmondi Branch</option>
                  <option value="Mirpur">Mirpur Branch</option>
                  <option value="Gulshan">Gulshan Branch</option>
                </select>
              </div>
            </div>

            {/* RIGHT COLUMN: Contacts, Login Credentials & Locations */}
            <div className="space-y-4">
              {/* Contact Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Official Number <span className="text-[#D81124]">* (Login ID)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-[#181E54] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 01700000001"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54] font-mono font-medium"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Used as staff login ID</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Personal Number</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={personalPhone}
                      onChange={(e) => setPersonalPhone(e.target.value)}
                      placeholder="e.g. 01911223344"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54] font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Password (Login Credentials) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-amber-50/40 rounded-2xl border border-amber-200/60">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Personal Email</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="employee@shadikabbo.com"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Password <span className="text-[#D81124]">* (Required)</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-[#181E54] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Set login password"
                      className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Staff login authentication</p>
                </div>
              </div>

              {/* Locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Present Location</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={presentLocation}
                      onChange={(e) => setPresentLocation(e.target.value)}
                      placeholder="e.g. Sector 11, Uttara"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Current Location</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={currentLocation}
                      onChange={(e) => setCurrentLocation(e.target.value)}
                      placeholder="e.g. Dhanmondi, Dhaka"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54]"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[#181E54] hover:bg-[#121742] disabled:opacity-50 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#D81124]" />
              <span>{submitting ? 'Creating Account...' : 'Add Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==============================================================================
// EDIT / UPDATE ACCOUNT MODAL COMPONENT
// - For Super Admin: Full edit access
// - For CRO/MK: Basic information ONLY (Without Official number and password)
// ==============================================================================
interface EditAccountModalProps {
  isOpen: boolean;
  account: AccountUser;
  isSuperAdmin: boolean;
  token: string;
  onClose: () => void;
  onSuccess: (updatedUser?: any) => void;
}

const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  account,
  isSuperAdmin,
  token,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState(account.name || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(account.gender || 'Male');
  const [joiningDate, setJoiningDate] = useState(account.joiningDate || '2024-01-15');
  const [role, setRole] = useState(account.role || 'CRO');
  const [branch, setBranch] = useState(account.branch || 'Uttara');
  const [phone, setPhone] = useState(account.phone || ''); // Official number
  const [personalPhone, setPersonalPhone] = useState(account.personalPhone || '');
  const [presentLocation, setPresentLocation] = useState(account.presentLocation || '');
  const [currentLocation, setCurrentLocation] = useState(account.currentLocation || '');
  const [email, setEmail] = useState(account.email || '');
  const [profilePicture, setProfilePicture] = useState(account.profilePicture || '');
  const [password, setPassword] = useState(''); // Only editable by Super Admin
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, JPEG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfilePicture(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Name is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        gender,
        personalPhone: personalPhone.trim(),
        presentLocation: presentLocation.trim(),
        currentLocation: currentLocation.trim(),
        email: email.trim(),
        profilePicture,
      };

      // Super Admin can edit official number, password, role, branch, joining date
      if (isSuperAdmin) {
        payload.phone = phone.trim();
        payload.role = role;
        payload.branch = branch;
        payload.joiningDate = joiningDate;
        if (password.trim()) {
          payload.password = password.trim();
        }
      }

      const res = await fetch(`/api/accounts/${account.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update account');
      }

      onSuccess(data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-4xl xl:max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#181E54] text-white flex items-center justify-center shadow-xs">
              <Edit className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#181E54]">
                {isSuperAdmin ? `Edit Account: ${account.name}` : 'Update Profile Information'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isSuperAdmin
                  ? 'Update employee credentials, branch, role, and profile'
                  : 'Update basic details (Official number and password are fixed)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 2-Column Responsive Layout for Web Screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            
            {/* LEFT COLUMN: Identity, Photo & Role Assignment */}
            <div className="space-y-4">
              {/* Profile Picture Uploader & Employee Name */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                <div className="relative shrink-0 group">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 bg-white flex items-center justify-center shadow-xs">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <label
                    htmlFor="edit-account-photo"
                    className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-[10px] font-bold"
                  >
                    <Camera className="w-4 h-4 mb-0.5" />
                    <span>Upload</span>
                  </label>
                  <input
                    id="edit-account-photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 w-full space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Employee Name <span className="text-[#D81124]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="edit-account-photo"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-400" />
                      <span>Change Photo</span>
                    </label>
                    {profilePicture && (
                      <button
                        type="button"
                        onClick={() => setProfilePicture('')}
                        className="text-[11px] text-red-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Role, Gender & Joining Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Role</label>
                  {isSuperAdmin ? (
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54] font-semibold text-[#181E54]"
                    >
                      <option value="Super Admin">Super Admin</option>
                      <option value="CRO">CRO</option>
                      <option value="MK">MK</option>
                    </select>
                  ) : (
                    <div className="px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl font-bold text-[#181E54] flex items-center justify-between">
                      <span>{account.role}</span>
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Joining Date</label>
                  {isSuperAdmin ? (
                    <input
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54]"
                    />
                  ) : (
                    <div className="px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-700 flex items-center justify-between">
                      <span>{account.joiningDate || '2024-01-15'}</span>
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Branch</label>
                {isSuperAdmin ? (
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54]"
                  >
                    <option value="Uttara">Uttara Branch</option>
                    <option value="Dhanmondi">Dhanmondi Branch</option>
                    <option value="Mirpur">Mirpur Branch</option>
                    <option value="Gulshan">Gulshan Branch</option>
                  </select>
                ) : (
                  <div className="px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700 flex items-center justify-between">
                    <span>{account.branch || 'Uttara'}</span>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Contacts, Login Credentials & Locations */}
            <div className="space-y-4">
              {/* Contact Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Official Number {isSuperAdmin ? '(Login)' : '(Locked)'}
                  </label>
                  {isSuperAdmin ? (
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-[#181E54] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54] font-mono font-medium"
                      />
                    </div>
                  ) : (
                    <div className="px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-700 flex items-center justify-between">
                      <span>{account.phone}</span>
                      <span title="Managed by Super Admin">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Personal Number</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={personalPhone}
                      onChange={(e) => setPersonalPhone(e.target.value)}
                      placeholder="e.g. 01911223344"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54] font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Personal Email</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="employee@shadikabbo.com"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54]"
                    />
                  </div>
                </div>

                {/* Password input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {isSuperAdmin ? 'Reset Password (Blank to keep)' : 'Password (Login)'}
                  </label>
                  {isSuperAdmin ? (
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-[#181E54] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="New password"
                        className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ) : (
                    <div className="px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 flex items-center justify-between">
                      <span>•••••••• (Protected)</span>
                      <span title="Contact Super Admin to reset password">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Present Location</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={presentLocation}
                      onChange={(e) => setPresentLocation(e.target.value)}
                      placeholder="e.g. Sector 11, Uttara, Dhaka"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Current Location</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={currentLocation}
                      onChange={(e) => setCurrentLocation(e.target.value)}
                      placeholder="e.g. Dhanmondi, Dhaka"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#181E54]"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[#181E54] hover:bg-[#121742] disabled:opacity-50 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>{submitting ? 'Updating...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
