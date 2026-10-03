import React, { useState } from 'react';
import { ShadikabboLogo } from './ShadikabboLogo';
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
} from 'lucide-react';

export type SidebarPage =
  | 'Dashboard'
  | 'Lead'
  | 'Traffic'
  | 'Paid Traffic'
  | 'Payment'
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
  children: React.ReactNode;
}

export const CrmLayout: React.FC<CrmLayoutProps> = ({
  user,
  activePage,
  onSelectPage,
  onLogout,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // EXACTLY these 10 sidebar navigation items + Logout as 11th
  const navItems: { label: SidebarPage; icon: React.ReactNode }[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Lead', icon: <Users2 className="w-4 h-4" /> },
    { label: 'Traffic', icon: <GitFork className="w-4 h-4" /> },
    { label: 'Paid Traffic', icon: <CheckCircle className="w-4 h-4" /> },
    { label: 'Payment', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Account', icon: <UserCog className="w-4 h-4" /> },
    { label: 'Tracking', icon: <MapPin className="w-4 h-4" /> },
    { label: 'Attendance', icon: <CalendarCheck className="w-4 h-4" /> },
    { label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { label: 'Trush bin', icon: <Trash2 className="w-4 h-4" /> },
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
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-[#181E54] leading-tight">
              {user?.name || 'Sohag'}
            </p>
            <p className="text-[11px] font-semibold text-[#D81124] leading-tight">
              {user?.role || 'Super Admin'}
            </p>
          </div>

          {/* Proper neutral profile placeholder icon (neutral silhouette, not fake human photo) */}
          <div className="w-9 h-9 rounded-full bg-[#181E54] text-white flex items-center justify-center shadow-xs border-2 border-slate-100 ring-2 ring-[#D81124]/30">
            <User className="w-5 h-5" />
          </div>
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
