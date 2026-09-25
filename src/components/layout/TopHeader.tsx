import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Sparkles, Plus, ArrowRight, Wifi, WifiOff } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';

interface TopHeaderProps {
  onToggleSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleSidebar }) => {
  const { user, notifications, activeGoal, connectionStatus, showToast } = useLifeOS();
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState('');
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    showToast(`LIFEOS AI searching: "${globalSearch}" across goals and agent memory`, 'info');
    navigate(`/research?q=${encodeURIComponent(globalSearch.trim())}`);
    setGlobalSearch('');
  };

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-16 px-4 md:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between gap-4">
      {/* Left: Mobile Sidebar Toggle & Active Goal Pill */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="lg:hidden w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Current Goal Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/60 text-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-800 truncate max-w-[200px]">
            {activeGoal ? activeGoal.title : 'LIFEOS Workspace'}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 font-medium">
            {activeGoal ? activeGoal.constraints.budget : ''}
          </span>
        </div>
      </div>

      {/* Center: Global AI Command / Search Field */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex-1 max-w-xl mx-auto relative hidden md:block"
      >
        <div className="relative flex items-center">
          <div className="absolute left-3 text-slate-400">
            <Sparkles className="w-4 h-4 text-[#1E60F2]" />
          </div>
          <input
            id="global-search-input"
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Ask LIFEOS or search goals, agents, documents..."
            className="w-full pl-9 pr-20 py-2 rounded-xl bg-slate-100/70 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]/20 focus:border-[#1E60F2] focus:bg-white transition-all"
          />
          <div className="absolute right-2.5 flex items-center gap-1.5">
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded">
              ⌘K
            </kbd>
            {globalSearch.trim() && (
              <button
                type="submit"
                className="p-1 rounded-lg bg-[#1E60F2] text-white hover:bg-blue-700"
              >
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Right: Connection status, Actions, Notifications & Avatar */}
      <div className="flex items-center gap-2.5">
        {/* Live WebSocket Status Dot */}
        <div
          title={`Agent Stream: ${connectionStatus}`}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-500"
        >
          {connectionStatus === 'connected' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden xl:inline text-emerald-700">Live Agent Stream</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="hidden xl:inline text-amber-700">Connecting...</span>
            </>
          )}
        </div>

        {/* Create Goal Action Button */}
        <button
          onClick={() => navigate('/goals/new')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1E60F2] text-white text-xs font-bold shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Goal</span>
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
          className="relative w-9 h-9 rounded-xl border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile */}
        <button
          onClick={() => navigate('/profile')}
          aria-label="User Profile"
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20"
          />
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800 leading-tight">
              {user.name}
            </span>
            <span className="text-[10px] text-slate-500 leading-tight">
              Student Account
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
