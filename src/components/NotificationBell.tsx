import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bell,
  BellRing,
  CheckCheck,
  Check,
  Clock,
  PhoneCall,
  CreditCard,
  UserPlus,
  ChevronRight,
  X,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { SidebarPage } from './CrmLayout';

export interface NotificationItem {
  id: string;
  type: 'new_lead' | 'follow_up' | 'payment_reminder';
  category: string;
  title: string;
  message: string;
  timestamp: number;
  targetPage: SidebarPage;
  targetId: string;
  priority?: 'high' | 'medium' | 'normal';
  entity?: {
    id?: string;
    name?: string;
    phone?: string;
    category?: string;
    status?: string;
    createdBy?: string;
    officer?: string;
    paidAmount?: number;
    dueAmount?: number;
    method?: string;
    sender?: string;
  };
}

interface NotificationBellProps {
  token?: string | null;
  onSelectPage: (page: SidebarPage) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  token,
  onSelectPage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    newLeads: 0,
    followUps: 0,
    paymentReminders: 0,
  });
  const [activeTab, setActiveTab] = useState<'all' | 'new_lead' | 'follow_up' | 'payment_reminder'>('all');

  // Track read notification IDs in localStorage for persistence
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('shadikabbo_read_notifications');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fetch notifications
  const fetchNotifications = async (showLoadingState = false) => {
    const activeToken = token || localStorage.getItem('shadikabbo_token') || sessionStorage.getItem('shadikabbo_token');
    if (!activeToken) return;

    if (showLoadingState) setLoading(true);
    try {
      const res = await fetch('/api/notifications', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  // Initial fetch and auto-refresh interval
  useEffect(() => {
    fetchNotifications(true);
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 30000); // 30s auto-refresh

    // Also refresh on window focus
    const onFocus = () => fetchNotifications(false);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [token]);

  // Click outside and ESC key listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Save readIds to localStorage
  const markAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('shadikabbo_read_notifications', JSON.stringify(Array.from(next)));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const next = new Set([...Array.from(readIds), ...allIds]);
    setReadIds(next);
    try {
      localStorage.setItem('shadikabbo_read_notifications', JSON.stringify(Array.from(next)));
    } catch (err) {
      console.error(err);
    }
  };

  // Unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readIds.has(n.id)).length;
  }, [notifications, readIds]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    return notifications.filter((n) => n.type === activeTab);
  }, [notifications, activeTab]);

  // Handle clicking a notification item
  const handleItemClick = (notif: NotificationItem) => {
    markAsRead(notif.id);
    setIsOpen(false);
    onSelectPage(notif.targetPage);
  };

  // Helper relative time
  const formatTime = (ts: number) => {
    if (!ts) return 'Recent';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    const d = new Date(ts);
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  return (
    <div className="relative shrink-0">
      {/* Notification Bell Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications(false);
          }
        }}
        className={`relative p-2 rounded-xl transition-all cursor-pointer select-none focus:outline-none ${
          isOpen
            ? 'bg-[#181E54] text-white shadow-xs'
            : 'text-slate-600 hover:text-[#181E54] hover:bg-slate-100/90'
        }`}
        title={`Notifications & Alerts (${unreadCount} unread)`}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        {unreadCount > 0 ? (
          <BellRing className={`w-5 h-5 transition-transform ${isOpen ? 'scale-105' : ''}`} />
        ) : (
          <Bell className="w-5 h-5" />
        )}

        {/* Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 bg-[#D81124] text-white text-[10px] font-extrabold rounded-full border-2 border-white shadow-xs animate-in zoom-in-50">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D81124] opacity-40"></span>
            <span className="relative font-mono">{unreadCount > 99 ? '99+' : unreadCount}</span>
          </span>
        )}
      </button>

      {/* Notifications Dropdown Popover */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed inset-x-3 top-16 sm:inset-x-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[410px] md:w-[440px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 flex flex-col max-h-[85vh] sm:max-h-[600px] animate-in fade-in-50 slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#181E54] text-white flex items-center justify-center shadow-2xs">
                <Bell className="w-4 h-4 text-rose-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-[#181E54]">Notifications & Alerts</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#D81124] text-white font-mono">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">New leads, follow-ups & payments</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fetchNotifications(true)}
                disabled={loading}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                title="Refresh alerts"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#181E54]' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="px-2 py-1 text-[11px] font-semibold text-[#181E54] hover:text-[#D81124] hover:bg-white rounded-lg transition-colors flex items-center gap-1 border border-slate-200/80 cursor-pointer shadow-2xs"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-slate-100 overflow-x-auto scrollbar-none shrink-0 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer text-[11px] ${
                activeTab === 'all'
                  ? 'bg-[#181E54] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('new_lead')}
              className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer text-[11px] flex items-center gap-1 ${
                activeTab === 'new_lead'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserPlus className="w-3 h-3" />
              <span>New Leads ({counts.newLeads})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('follow_up')}
              className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer text-[11px] flex items-center gap-1 ${
                activeTab === 'follow_up'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Follow-ups ({counts.followUps})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payment_reminder')}
              className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer text-[11px] flex items-center gap-1 ${
                activeTab === 'payment_reminder'
                  ? 'bg-[#D81124] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-3 h-3" />
              <span>Payments ({counts.paymentReminders})</span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 overscroll-contain">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center text-slate-500">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                  <Check className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="font-bold text-slate-700 text-sm">All caught up!</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[260px] mx-auto">
                  {activeTab === 'all'
                    ? 'No new alerts for leads, follow-ups, or payment reminders right now.'
                    : `No active ${activeTab.replace('_', ' ')} alerts at the moment.`}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isRead = readIds.has(notif.id);

                // Styling based on notification category
                let iconColor = 'bg-blue-50 text-blue-600 border-blue-200';
                let Icon = UserPlus;
                let badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';

                if (notif.type === 'follow_up') {
                  iconColor = 'bg-amber-50 text-amber-700 border-amber-200';
                  Icon = PhoneCall;
                  badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
                } else if (notif.type === 'payment_reminder') {
                  iconColor = 'bg-rose-50 text-rose-700 border-rose-200';
                  Icon = CreditCard;
                  badgeClass = 'bg-rose-50 text-rose-800 border-rose-200';
                }

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3 sm:p-3.5 transition-colors cursor-pointer group flex items-start gap-3 text-left relative ${
                      isRead ? 'bg-white hover:bg-slate-50/80 opacity-80' : 'bg-slate-50/60 hover:bg-slate-100/80'
                    }`}
                  >
                    {/* Unread dot */}
                    {!isRead && (
                      <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-[#D81124]" />
                    )}

                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${iconColor}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold border tracking-tight ${badgeClass}`}
                        >
                          {notif.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTime(notif.timestamp)}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#181E54] transition-colors line-clamp-1">
                        {notif.title}
                      </h4>

                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Bottom action tags */}
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100/80">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#181E54] group-hover:underline">
                          <span>Open in {notif.targetPage}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-[#D81124]" />
                        </span>

                        <div className="flex items-center gap-1">
                          {!isRead && (
                            <button
                              type="button"
                              onClick={(e) => markAsRead(notif.id, e)}
                              className="px-2 py-0.5 text-[10px] font-medium text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                              title="Mark as read"
                            >
                              Dismiss
                            </button>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Quick Links */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] shrink-0 font-medium text-slate-600">
            <span className="text-slate-500">Quick views:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onSelectPage('Lead');
                }}
                className="hover:text-[#181E54] hover:underline cursor-pointer"
              >
                Leads
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onSelectPage('Traffic');
                }}
                className="hover:text-[#181E54] hover:underline cursor-pointer"
              >
                Traffics
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onSelectPage('Payment');
                }}
                className="hover:text-[#D81124] hover:underline cursor-pointer font-bold"
              >
                Payments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
