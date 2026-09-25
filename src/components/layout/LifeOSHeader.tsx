import React from 'react';
import { Search, Bell } from 'lucide-react';

interface LifeOSHeaderProps {
  onSearchClick?: () => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  unreadNotifications?: number;
}

export const LifeOSHeader: React.FC<LifeOSHeaderProps> = ({
  onSearchClick,
  onNotificationClick,
  onProfileClick,
  unreadNotifications = 2,
}) => {
  return (
    <header className="w-full px-5 pt-1 pb-3 flex items-center justify-between">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3">
        {/* LIFEOS Vector Mark */}
        <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0F172A] via-[#1E60F2] to-[#38BDF8] p-[1.5px] shadow-sm flex-shrink-0">
          <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
            {/* Intelligent LifeOS geometric symbol */}
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-[#1E60F2]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" fill="#1E60F2" fillOpacity="0.2" />
              <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
              <circle cx="12" cy="12" r="7" strokeDasharray="3 3" />
            </svg>
          </div>
        </div>

        {/* Wordmark and Tagline */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold tracking-tight text-[#0F172A] font-sans">
              LIFE<span className="text-[#1E60F2]">OS</span>
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 tracking-tight leading-tight">
            Your Goals. Your Intelligence. A Better You.
          </span>
        </div>
      </div>

      {/* Right: Actions & User Avatar */}
      <div className="flex items-center gap-2">
        {/* Search Button */}
        <button
          onClick={onSearchClick}
          aria-label="Search"
          className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:scale-95 transition-all shadow-soft-sm"
        >
          <Search className="w-4 h-4" strokeWidth={2} />
        </button>

        {/* Notifications Button */}
        <button
          onClick={onNotificationClick}
          aria-label="Notifications"
          className="relative w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:scale-95 transition-all shadow-soft-sm"
        >
          <Bell className="w-4 h-4" strokeWidth={2} />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#1E60F2] rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* User Avatar */}
        <button
          onClick={onProfileClick}
          aria-label="User Profile"
          className="relative ml-0.5 rounded-full ring-2 ring-blue-500/20 active:scale-95 transition-transform"
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
            alt="Ananya"
            className="w-9 h-9 rounded-full object-cover shadow-soft-sm"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
};
