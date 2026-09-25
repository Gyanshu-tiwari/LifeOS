import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Bot,
  Calendar,
  Check,
  ArrowRight,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { LifeOSButton } from '../components/ui/LifeOSButton';
import { LifeOSBadge } from '../components/ui/LifeOSBadge';
import { LifeOSEmptyState } from '../components/ui/LifeOSEmptyState';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead, showToast, activeGoal } = useLifeOS();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread' | 'agent' | 'deadline'>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'agent') return n.type === 'agent' || n.type === 'verification';
    if (filter === 'deadline') return n.type === 'deadline';
    return true;
  });

  const handleMarkAllRead = () => {
    notifications.forEach((n) => markNotificationRead(n.id));
    showToast('All notifications marked as read', 'info');
  };

  const handleNotificationClick = (item: any) => {
    markNotificationRead(item.id);
    if (item.title.toLowerCase().includes('document') || item.title.toLowerCase().includes('certificate')) {
      navigate('/documents');
    } else if (item.title.toLowerCase().includes('plan')) {
      navigate(`/goals/${activeGoal.id}/plan`);
    } else if (item.title.toLowerCase().includes('transit') || item.title.toLowerCase().includes('metro')) {
      navigate('/maps');
    } else {
      navigate('/tasks');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E60F2] uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" />
            <span>Activity & Alert Feed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
            Notifications & Feed
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time multi-agent alerts, deadline countdowns, and validation updates.
          </p>
        </div>

        <LifeOSButton
          onClick={handleMarkAllRead}
          variant="outline"
          size="sm"
          leftIcon={<Check className="w-3.5 h-3.5" />}
        >
          Mark all as read
        </LifeOSButton>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: `All Activity (${notifications.length})` },
          { id: 'unread', label: `Unread (${notifications.filter((n) => !n.read).length})` },
          { id: 'agent', label: 'Agent Updates' },
          { id: 'deadline', label: 'Deadlines' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filter === tab.id
                ? 'bg-[#1E60F2] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications Feed */}
      {filtered.length === 0 ? (
        <LifeOSEmptyState
          icon={Bell}
          title="You're up to date!"
          description="No unread notifications or alerts found under this filter."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-start gap-4 ${
                !item.read
                  ? 'bg-blue-50/40 border-blue-200/90 shadow-soft hover:bg-blue-50/70'
                  : 'bg-white border-slate-200/80 hover:bg-slate-50/60'
              }`}
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                  item.type === 'agent'
                    ? 'bg-purple-100 text-purple-700'
                    : item.type === 'verification'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {item.type === 'agent' ? (
                  <Bot className="w-5 h-5" />
                ) : item.type === 'verification' ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                    {item.title}
                  </h3>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap font-medium">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.message}
                </p>
                <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#1E60F2]">
                  <span>Inspect details</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              {/* Unread indicator */}
              {!item.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E60F2] flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
