import React, { useState, useEffect } from 'react';
import { ShadikabboLogo } from './ShadikabboLogo';
import { PWAInstallButton } from './PWAInstallButton';
import {
  LayoutDashboard,
  Users2,
  GitFork,
  CheckCircle,
  CreditCard,
  UserCog,
  MapPin,
  CalendarCheck,
  Settings,
  Trash2,
  LogOut,
  Menu,
  X,
  User,
  Camera,
  HeartHandshake,
} from 'lucide-react';

export type SidebarPage =
  | 'Dashboard'
  | 'Lead'
  | 'Traffic'
  | 'Paid Traffic'
  | 'Payment'
  | 'Matchmaking'
  | 'Account'
  | 'Tracking'
  | 'Attendance'
  | 'Settings'
  | 'Trush bin';

interface CrmLayoutProps {
  user: any;
  activePage: SidebarPage;
  onSelectPage: (page: SidebarPage) => void;
  onLogout: () => void;
  onOpenScanner?: () => void;
  children: React.ReactNode;
}

export const CrmLayout: React.FC<CrmLayoutProps> = ({
  user,
  activePage,
  onSelectPage,
  onLogout,
  onOpenScanner,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.profilePicture]);

  const role = user?.role || 'Super Admin';

  // Role-based sidebar navigation items:
  // - CRO: Dashboard, Lead, Traffic, Paid Traffic, Payment, Account, Attendance
  // - MK: Dashboard, Lead, Traffic, Paid Traffic, Payment, Matchmaking, Account, Attendance
  // - Super Admin: Dashboard, Lead, Traffic, Paid Traffic, Payment, Matchmaking, Account, Tracking, Attendance, Settings, Trush bin
  const navItems: { label: SidebarPage; icon: React.ReactNode }[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Lead', icon: <Users2 className="w-4 h-4" /> },
    { label: 'Traffic', icon: <GitFork className="w-4 h-4" /> },
    { label: 'Paid Traffic', icon: <CheckCircle className="w-4 h-4" /> },
    { label: 'Payment', icon: <CreditCard className="w-4 h-4" /> },
    ...(role === 'MK' || role === 'Super Admin'
      ? [{ label: 'Matchmaking' as SidebarPage, icon: <HeartHandshake className="w-4 h-4" /> }]
      : []),
    { label: 'Account', icon: <UserCog className="w-4 h-4" /> },
    ...(role === 'Super Admin'
      ? [{ label: 'Tracking' as SidebarPage, icon: <MapPin className="w-4 h-4" /> }]
      : []),
    { label: 'Attendance', icon: <CalendarCheck className="w-4 h-4" /> },
    ...(role === 'Super Admin'
      ? [
          { label: 'Settings' as SidebarPage, icon: <Settings className="w-4 h-4" /> },
          { label: 'Trush bin' as SidebarPage, icon: <Trash2 className="w-4 h-4" /> },
        ]
      : []),
  ];

  const handleNavClick = (page: SidebarPage) => {
    onSelectPage(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ==================================================
          TOP HEADER
          TOP LEFT: Shadikabbo company logo
          TOP RIGHT: Profile picture area, specific profile name, role (Super Admin)
          IMPORTANT: Neutral profile placeholder/icon (NO demo photograph)
      ================================================== */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between shadow-xs">
        {/* TOP LEFT */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <ShadikabboLogo size="sm" />
        </div>

        {/* TOP RIGHT */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Add to Home Screen (PWA Install Button) */}
          <PWAInstallButton />

          {/* Quick Staff Attendance Scanner shortcut */}
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181E54] text-white hover:bg-[#121742] text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Open Daily Attendance Scanner"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
              <span className="hidden md:inline">Scanner</span>
            </button>
          )}

          {/* TOP RIGHT PROFILE INFO & AVATAR (Interactive & displays real existing profile picture) */}
          <button
            type="button"
            onClick={() => onSelectPage('Account')}
            className="flex items-center gap-2 sm:gap-2.5 p-1 -mr-1 rounded-xl hover:bg-slate-100/90 transition-all cursor-pointer group select-none text-left focus:outline-none"
            title="View My Profile / Account"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#181E54] group-hover:text-[#D81124] transition-colors leading-tight truncate max-w-[150px]">
                {user?.name || 'User'}
              </p>
              <p className="text-[11px] font-semibold text-[#D81124] leading-tight">
                {user?.role || 'Super Admin'}
              </p>
            </div>

            {/* Profile Avatar: Shows uploaded/existing profile picture, with clean fallback */}
            <div className="w-9 h-9 rounded-full bg-[#181E54] text-white flex items-center justify-center shadow-xs border-2 border-white ring-2 ring-[#D81124]/40 overflow-hidden shrink-0 group-hover:ring-[#D81124]/70 transition-all">
              {user?.profilePicture && !avatarError ? (
                <img
                  src={user.profilePicture}
                  alt={user?.name || 'User Profile'}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <User className="w-5 h-5 text-white/90" />
              )}
            </div>
          </button>
        </div>
      </header>

      {/* ==================================================
          BODY WITH SIDEBAR & MAIN CONTENT
      ================================================== */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* SIDEBAR: EXACTLY 11 items - ROCK-SOLID FIXED WIDTH */}
        <aside
          className={`fixed md:sticky top-16 z-30 h-[calc(100vh-4rem)] w-60 min-w-[15rem] max-w-[15rem] shrink-0 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out overflow-y-auto flex flex-col justify-between p-3 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Top 10 items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activePage === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavClick(item.label)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#181E54] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#181E54] hover:bg-slate-100'
                  }`}
                >
                  <span className={`${isActive ? 'text-[#D81124]' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* 11. Logout */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-[#D81124]" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT VIEWPORT: FULL WIDTH & COMPACT PADDING */}
        <main className="flex-1 min-w-0 p-2.5 sm:p-3.5 md:px-5 md:py-3 w-full overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
};
