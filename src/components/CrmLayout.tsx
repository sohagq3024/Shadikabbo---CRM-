import React, { useState, useEffect, useRef } from 'react';
import { ShadikabboLogo } from './ShadikabboLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { NotificationBell } from './NotificationBell';
import {
  LayoutDashboard,
  Users2,
  GitFork,
  CheckCircle,
  CreditCard,
  UserCog,
  MapPin,
  CalendarCheck,
  ClipboardList,
  Settings,
  Trash2,
  LogOut,
  Menu,
  X,
  User,
  Camera,
  HeartHandshake,
  Wifi,
  WifiOff,
  Clock,
  Layers,
} from 'lucide-react';
import {
  formatBangladeshTimeWithSeconds,
  formatBangladeshDateDisplay,
} from '../utils/bangladeshTime';

export type SidebarPage =
  | 'Dashboard'
  | 'Lead'
  | 'Client'
  | 'Paid Client'
  | 'Traffic'
  | 'Paid Traffic'
  | 'Paid Clent'
  | 'Payment'
  | 'Matchmaking'
  | 'Account'
  | 'All Profile'
  | 'Tracking'
  | 'Attendance'
  | 'Daily Report'
  | 'Settings'
  | 'Trash Bin'
  | 'Trush bin';

interface CrmLayoutProps {
  user: any;
  token?: string | null;
  activePage: SidebarPage;
  onSelectPage: (page: SidebarPage) => void;
  onLogout: () => void;
  onOpenScanner?: () => void;
  children: React.ReactNode;
}

// Memoized standalone Clock Badge to prevent re-rendering the parent CrmLayout every second
const LiveBstClockBadge: React.FC = React.memo(() => {
  const [liveBstTime, setLiveBstTime] = useState(() => formatBangladeshTimeWithSeconds(new Date()));
  const [liveBstDate, setLiveBstDate] = useState(() => formatBangladeshDateDisplay(new Date()));

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLiveBstTime(formatBangladeshTimeWithSeconds(now));
      setLiveBstDate(formatBangladeshDateDisplay(now));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/90 text-[#181E54] text-[11px] font-semibold select-none shadow-2xs hover:bg-slate-100/70 transition-colors cursor-default"
      title={`Live Bangladesh Standard Time (BST, UTC+6 / Asia/Dhaka) · ${liveBstDate}`}
    >
      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      <span className="font-mono font-bold tracking-tight">{liveBstTime}</span>
      <span className="text-[9px] font-extrabold uppercase px-1 py-0.5 rounded bg-[#181E54]/10 text-[#181E54]">
        BST
      </span>
    </div>
  );
});

export const CrmLayout: React.FC<CrmLayoutProps> = ({
  user,
  token,
  activePage,
  onSelectPage,
  onLogout,
  onOpenScanner,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    setAvatarError(false);
  }, [user?.profilePicture]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const role = user?.role || 'Super Admin';

  // Role-based sidebar navigation items:
  // - CRO: Dashboard, Lead, Client, Paid Client, Payment, Account, Attendance
  // - MK: Dashboard, Lead, Client, Paid Client, Payment, Matchmaking, Account, Attendance
  // - Super Admin: Dashboard, Lead, Client, Paid Client, Payment, Matchmaking, Account, Tracking, Attendance, Settings, Trash bin
  const navItems: { label: SidebarPage; icon: React.ReactNode }[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Lead', icon: <Users2 className="w-4 h-4" /> },
    { label: 'Client', icon: <GitFork className="w-4 h-4" /> },
    { label: 'Paid Client', icon: <CheckCircle className="w-4 h-4" /> },
    { label: 'Payment', icon: <CreditCard className="w-4 h-4" /> },
    ...(role === 'MK' || role === 'Super Admin'
      ? [{ label: 'Matchmaking' as SidebarPage, icon: <HeartHandshake className="w-4 h-4" /> }]
      : []),
    { label: 'Account', icon: <UserCog className="w-4 h-4" /> },
    { label: 'All Profile' as SidebarPage, icon: <Layers className="w-4 h-4" /> },
    { label: 'Attendance', icon: <CalendarCheck className="w-4 h-4" /> },
    { label: 'Daily Report', icon: <ClipboardList className="w-4 h-4" /> },
    ...(role === 'Super Admin'
      ? [
          { label: 'Settings' as SidebarPage, icon: <Settings className="w-4 h-4" /> },
          { label: 'Trash Bin' as SidebarPage, icon: <Trash2 className="w-4 h-4" /> },
        ]
      : []),
  ];

  const handleNavClick = (page: SidebarPage) => {
    onSelectPage(page);
    setMobileMenuOpen(false);
  };

  // Primary workflow page for mobile bottom bar based on role:
  // - MK and Super Admin: Matchmaking (routine 3-day client services)
  // - CRO: Paid Client (pipeline review)
  const primaryWorkflowPage: SidebarPage =
    role === 'MK' || role === 'Super Admin' ? 'Matchmaking' : 'Paid Client';
  const primaryWorkflowLabel =
    role === 'MK' || role === 'Super Admin' ? 'Match' : 'Paid Client';
  const primaryWorkflowIcon =
    role === 'MK' || role === 'Super Admin' ? (
      <HeartHandshake className="w-5 h-5" />
    ) : (
      <CheckCircle className="w-5 h-5" />
    );

  const directTabPages: SidebarPage[] = [
    'Dashboard',
    'Lead',
    primaryWorkflowPage,
    ...(primaryWorkflowPage === 'Paid Client' ? (['Paid Traffic', 'Paid Clent'] as SidebarPage[]) : []),
  ];
  const isMoreActive = !directTabPages.includes(activePage);

  // Robust haptic feedback function for mobile touch and click interactions
  const lastVibrateTime = React.useRef<number>(0);
  const triggerHaptic = (pattern: number | number[] = 15) => {
    const now = Date.now();
    // Guard against double triggers from both touchstart and click events within 80ms
    if (now - lastVibrateTime.current < 80) return;
    lastVibrateTime.current = now;

    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Safe fallback if vibrate permission is restricted or unsupported
      }
    }
  };

  const handleMobileNavClick = (page: SidebarPage) => {
    triggerHaptic(15);
    handleNavClick(page);
  };

  const handleMobileScanClick = () => {
    triggerHaptic([20, 30, 20]);
    if (onOpenScanner) {
      onOpenScanner();
    } else {
      handleNavClick('Attendance');
    }
  };

  const handleMobileMoreClick = () => {
    triggerHaptic(15);
    setMobileMenuOpen(true);
  };

  return (
    <div className="h-screen max-h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* ==================================================
          TOP HEADER
          TOP LEFT: Shadikabbo company logo
          TOP RIGHT: Profile picture area, specific profile name, role (Super Admin)
          IMPORTANT: Neutral profile placeholder/icon (NO demo photograph)
      ================================================== */}
      <header className="h-14 sm:h-15 bg-white border-b border-slate-200 shrink-0 z-40 px-3.5 sm:px-6 md:px-8 flex items-center justify-between shadow-2xs">
        {/* TOP LEFT */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <ShadikabboLogo size="sm" />
        </div>

        {/* TOP RIGHT */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Live Bangladesh Standard Time Clock Pill */}
          <LiveBstClockBadge />

          {/* Subtle Network Status Indicator (Online / Offline) */}
          <div
            className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold border transition-all select-none shrink-0 ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs'
                : 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs animate-pulse'
            }`}
            title={
              isOnline
                ? 'Network Status: Online (Connected to office cloud server)'
                : 'Network Status: Offline (Attendance scans will be cached locally and synced upon reconnect)'
            }
          >
            {isOnline ? (
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <span className="inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-rose-500"></span>
            )}
            <span className="font-semibold tracking-tight text-[10px] sm:text-[11px]">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Add to Home Screen (PWA Install Button) */}
          <PWAInstallButton />

          {/* Quick Staff Attendance Scanner shortcut (hidden on mobile since bottom navigation bar has prominent center scanner) */}
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181E54] text-white hover:bg-[#121742] text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Open Daily Attendance Scanner"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
              <span className="hidden md:inline">Scanner</span>
            </button>
          )}

          {/* TOP RIGHT NOTIFICATION BELL */}
          <NotificationBell token={token} onSelectPage={onSelectPage} />

          {/* TOP RIGHT PROFILE INFO & AVATAR (Interactive & displays real existing profile picture) */}
          <button
            type="button"
            onClick={() => onSelectPage('Account')}
            className="flex items-center gap-1.5 sm:gap-2.5 p-0.5 sm:p-1 rounded-xl hover:bg-slate-100/90 transition-all cursor-pointer group select-none text-left focus:outline-none shrink-0"
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
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#181E54] text-white flex items-center justify-center shadow-xs border-2 border-white ring-2 ring-[#D81124]/40 overflow-hidden shrink-0 group-hover:ring-[#D81124]/70 transition-all">
              {user?.profilePicture && !avatarError ? (
                <img
                  src={user.profilePicture}
                  alt={user?.name || 'User Profile'}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white/90" />
              )}
            </div>
          </button>
        </div>
      </header>

      {/* ==================================================
          BODY WITH SIDEBAR & MAIN CONTENT
      ================================================== */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        
        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* SIDEBAR: ROCK-SOLID FIXED WIDTH & MOBILE SLIDE-OVER */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto h-full w-60 md:w-56 lg:w-60 shrink-0 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out overflow-y-auto flex flex-col justify-between p-3 shadow-2xl md:shadow-none ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Mobile drawer header (md:hidden) */}
          <div className="md:hidden flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
            <ShadikabboLogo size="sm" />
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setMobileMenuOpen(false);
              }}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
              aria-label="Close Navigation Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Top nav items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                activePage === item.label ||
                (item.label === 'Client' && activePage === 'Traffic') ||
                (item.label === 'Paid Client' && (activePage === 'Paid Traffic' || activePage === 'Paid Clent')) ||
                (item.label === 'Trash Bin' && activePage === 'Trush bin');
              return (
                <button
                  key={item.label}
                  type="button"
                  onTouchStart={() => triggerHaptic(12)}
                  onClick={() => {
                    triggerHaptic(12);
                    handleNavClick(item.label);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#181E54] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#181E54] hover:bg-slate-100/90'
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

          {/* Logout */}
          <div className="pt-2.5 border-t border-slate-100 mt-auto">
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-[13px] font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-[#D81124]" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT VIEWPORT: FULL WIDTH & COMPACT SCROLLABLE WORKSPACE */}
        <main className="flex-1 min-w-0 h-full p-3.5 sm:p-4 md:p-5 lg:p-6 w-full overflow-y-auto pb-24 md:pb-6">
          {children}
        </main>

      </div>

      {/* ==================================================
          MOBILE BOTTOM TAB BAR NAVIGATION (md:hidden)
          Persistent, ergonomic navigation for staff members on the go:
          1. Dashboard
          2. Leads
          3. Center Elevated QR Attendance Scanner
          4. Matchmaking (MK) / Traffic (CRO)
          5. More Menu Drawer
      ================================================== */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1 select-none"
      >
        <div className="grid grid-cols-5 items-center justify-around px-1 max-w-lg mx-auto">
          {/* Tab 1: Dashboard */}
          <button
            type="button"
            onTouchStart={() => triggerHaptic(15)}
            onClick={() => handleMobileNavClick('Dashboard')}
            className={`group flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-100 ease-out select-none touch-manipulation cursor-pointer active:scale-[0.88] active:translate-y-0.5 active:opacity-90 ${
              activePage === 'Dashboard' ? 'text-[#181E54]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all duration-100 ease-out ${
                activePage === 'Dashboard'
                  ? 'bg-[#181E54]/10 text-[#181E54] shadow-2xs group-active:scale-95'
                  : 'text-slate-400 group-hover:text-slate-600 group-active:bg-slate-100 group-active:scale-90'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 transition-transform duration-100 group-active:scale-95" />
            </div>
            <span
              className={`text-[10px] tracking-tight transition-transform duration-100 group-active:scale-95 ${
                activePage === 'Dashboard' ? 'font-bold text-[#181E54]' : 'font-medium text-slate-500'
              }`}
            >
              Dashboard
            </span>
          </button>

          {/* Tab 2: Leads */}
          <button
            type="button"
            onTouchStart={() => triggerHaptic(15)}
            onClick={() => handleMobileNavClick('Lead')}
            className={`group flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-100 ease-out select-none touch-manipulation cursor-pointer active:scale-[0.88] active:translate-y-0.5 active:opacity-90 ${
              activePage === 'Lead' ? 'text-[#181E54]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all duration-100 ease-out ${
                activePage === 'Lead'
                  ? 'bg-[#181E54]/10 text-[#181E54] shadow-2xs group-active:scale-95'
                  : 'text-slate-400 group-hover:text-slate-600 group-active:bg-slate-100 group-active:scale-90'
              }`}
            >
              <Users2 className="w-5 h-5 transition-transform duration-100 group-active:scale-95" />
            </div>
            <span
              className={`text-[10px] tracking-tight transition-transform duration-100 group-active:scale-95 ${
                activePage === 'Lead' ? 'font-bold text-[#181E54]' : 'font-medium text-slate-500'
              }`}
            >
              Leads
            </span>
          </button>

          {/* Tab 3: Center Elevated Scanner Button */}
          <div className="flex flex-col items-center justify-center -mt-4 touch-manipulation">
            <button
              type="button"
              onTouchStart={() => triggerHaptic([20, 30, 20])}
              onClick={handleMobileScanClick}
              className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-[#181E54] via-[#1f2868] to-[#2b3582] text-white shadow-lg shadow-[#181E54]/30 border-2 border-white flex items-center justify-center active:scale-[0.85] active:translate-y-1 active:shadow-sm active:ring-2 active:ring-[#D81124]/60 transition-all duration-100 ease-out cursor-pointer group select-none touch-manipulation"
              title="Quick QR Attendance Scanner"
              aria-label="Scan QR Attendance"
            >
              <Camera className="w-5 h-5 text-white group-hover:scale-110 group-active:scale-90 transition-transform duration-100" />
              <span className="absolute top-0 right-0 w-3 h-3 bg-[#D81124] rounded-full border-2 border-white animate-pulse" />
            </button>
            <span className="text-[10px] font-bold text-[#181E54] mt-0.5 tracking-tight active:scale-95 transition-transform">
              Scan QR
            </span>
          </div>

          {/* Tab 4: Matchmaking (MK / Admin) or Paid Client (CRO) */}
          {(() => {
            const isWorkflowActive =
              activePage === primaryWorkflowPage ||
              (primaryWorkflowPage === 'Paid Client' &&
                (activePage === 'Paid Traffic' || activePage === 'Paid Clent'));
            return (
              <button
                type="button"
                onTouchStart={() => triggerHaptic(15)}
                onClick={() => handleMobileNavClick(primaryWorkflowPage)}
                className={`group flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-100 ease-out select-none touch-manipulation cursor-pointer active:scale-[0.88] active:translate-y-0.5 active:opacity-90 ${
                  isWorkflowActive
                    ? 'text-[#181E54]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all duration-100 ease-out ${
                    isWorkflowActive
                      ? 'bg-[#181E54]/10 text-[#181E54] shadow-2xs group-active:scale-95'
                      : 'text-slate-400 group-hover:text-slate-600 group-active:bg-slate-100 group-active:scale-90'
                  }`}
                >
                  {primaryWorkflowIcon}
                </div>
                <span
                  className={`text-[10px] tracking-tight transition-transform duration-100 group-active:scale-95 ${
                    isWorkflowActive
                      ? 'font-bold text-[#181E54]'
                      : 'font-medium text-slate-500'
                  }`}
                >
                  {primaryWorkflowLabel}
                </span>
              </button>
            );
          })()}

          {/* Tab 5: More Menu Drawer */}
          <button
            type="button"
            onTouchStart={() => triggerHaptic(15)}
            onClick={handleMobileMoreClick}
            className={`group flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-100 ease-out select-none touch-manipulation cursor-pointer relative active:scale-[0.88] active:translate-y-0.5 active:opacity-90 ${
              isMoreActive ? 'text-[#181E54]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all duration-100 ease-out relative ${
                isMoreActive
                  ? 'bg-[#181E54]/10 text-[#181E54] shadow-2xs group-active:scale-95'
                  : 'text-slate-400 group-hover:text-slate-600 group-active:bg-slate-100 group-active:scale-90'
              }`}
            >
              <Menu className="w-5 h-5 transition-transform duration-100 group-active:scale-95" />
              {isMoreActive && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#D81124]" />
              )}
            </div>
            <span
              className={`text-[10px] tracking-tight transition-transform duration-100 group-active:scale-95 ${
                isMoreActive ? 'font-bold text-[#181E54]' : 'font-medium text-slate-500'
              }`}
            >
              More
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
};
