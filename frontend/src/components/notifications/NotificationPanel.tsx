import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  ListTodo,
  Navigation,
  Calendar,
  Sparkles,
  Check,
  ChevronRight,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../hooks/useNotifications';
import { Notification } from '../../types';
import { cn } from '../../lib/utils';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';

export function NotificationBellButton() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'relative p-2.5 rounded-full transition-all text-lifeos-navy hover:bg-gray-100/80 active:scale-95 focus:outline-none focus:ring-2 focus:ring-lifeos-blue/20',
          isOpen && 'bg-blue-50 text-lifeos-blue'
        )}
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <Bell size={20} className={cn(unreadCount > 0 && 'text-lifeos-navy')} />

        {/* Real Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Panel */}
      {isOpen && (
        <NotificationPanel
          panelRef={panelRef}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

interface NotificationPanelProps {
  panelRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

export function NotificationPanel({ panelRef, onClose }: NotificationPanelProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const {
    data: notifData,
    isLoading,
    isError,
    refetch,
  } = useNotifications({ limit: 40 });

  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();

  const notifications = notifData?.items || [];
  const unreadCount = notifData?.unread_count ?? 0;

  const filteredItems = notifications.filter((n) => {
    if (filter === 'unread') return n.read_at === null;
    return true;
  });

  const handleItemClick = (item: Notification) => {
    if (item.read_at === null) {
      markReadMutation.mutate(item.id);
    }
    if (item.action_url) {
      onClose();
      navigate(item.action_url);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = parseISO(isoString);
      if (isValid(date)) {
        return formatDistanceToNow(date, { addSuffix: true }).replace('about ', '');
      }
    } catch {
      // fallback
    }
    return 'recently';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PLAN_READY':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} />
          </div>
        );
      case 'PLAN_FAILED':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle size={16} />
          </div>
        );
      case 'TASK_COMPLETED':
      case 'TASK_REMINDER':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-lifeos-blue flex items-center justify-center shrink-0">
            <ListTodo size={16} />
          </div>
        );
      case 'ROUTE_UPDATED':
        return (
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Navigation size={16} />
          </div>
        );
      case 'ITINERARY_UPDATED':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Calendar size={16} />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-gray-50 text-lifeos-navy flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
        );
    }
  };

  return (
    <div
      ref={panelRef as React.RefObject<HTMLDivElement>}
      className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[380px] bg-white rounded-3xl shadow-soft-xl border border-gray-100 z-[60] flex flex-col max-h-[82vh] sm:max-h-[580px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center space-x-2">
          <h3 className="font-bold text-base text-lifeos-navy">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-lifeos-blue font-bold text-xs">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="text-xs font-semibold text-lifeos-blue hover:text-lifeos-navy transition disabled:opacity-50"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-lifeos-navy hover:bg-gray-100 transition"
            aria-label="Close notifications panel"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 bg-gray-50/60 border-b border-gray-100 flex space-x-2 text-xs font-semibold shrink-0">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-3 py-1 rounded-lg transition',
            filter === 'all'
              ? 'bg-white text-lifeos-navy shadow-soft-sm font-bold'
              : 'text-lifeos-muted hover:text-lifeos-navy'
          )}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'px-3 py-1 rounded-lg transition',
            filter === 'unread'
              ? 'bg-white text-lifeos-navy shadow-soft-sm font-bold'
              : 'text-lifeos-muted hover:text-lifeos-navy'
          )}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50 no-scrollbar">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-1.5 pt-1">
                  <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center">
            <p className="text-xs text-rose-500 font-semibold mb-2">Could not load notifications</p>
            <button
              onClick={() => refetch()}
              className="text-xs font-semibold text-lifeos-blue flex items-center space-x-1 mx-auto hover:underline"
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <Check size={20} className="text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-lifeos-navy">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-xs text-lifeos-muted mt-1 max-w-[220px] mx-auto leading-relaxed">
              Updates about your generated plans, routes, and tasks will appear here.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isUnread = item.read_at === null;

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'p-4 flex items-start space-x-3.5 hover:bg-gray-50/80 transition cursor-pointer relative group select-none',
                  isUnread ? 'bg-blue-50/25' : 'bg-white'
                )}
              >
                {/* Visual Icon */}
                {getNotificationIcon(item.type)}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4
                      className={cn(
                        'text-xs leading-snug truncate',
                        isUnread ? 'font-bold text-lifeos-navy' : 'font-semibold text-gray-700'
                      )}
                    >
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-medium shrink-0">
                      {formatTime(item.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-lifeos-muted line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>

                  {item.action_url && (
                    <div className="mt-1.5 flex items-center text-[11px] font-semibold text-lifeos-blue group-hover:underline">
                      <span>View details</span>
                      <ChevronRight size={12} className="ml-0.5" />
                    </div>
                  )}
                </div>

                {/* Unread Accent Dot */}
                {isUnread && (
                  <span
                    className="w-2 h-2 rounded-full bg-lifeos-blue shrink-0 mt-2"
                    title="Unread notification"
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 bg-gray-50/80 border-t border-gray-100 text-center shrink-0">
          <p className="text-[11px] text-lifeos-muted">
            Notifications are saved securely to your LIFEOS account.
          </p>
        </div>
      )}
    </div>
  );
}
