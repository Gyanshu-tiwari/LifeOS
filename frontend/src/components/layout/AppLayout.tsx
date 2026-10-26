import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, ListTodo, Activity, User, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';

export default function AppLayout() {
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-lifeos-bg">
      {/* Desktop Sidebar (Sticky left navigation) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 px-4 py-6 z-40 shrink-0 h-screen sticky top-0 shadow-soft-sm">
        {/* Brand */}
        <div className="mb-8 px-3 flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-lifeos-navy flex items-center justify-center text-white font-bold text-base shadow-soft-sm">
            L
          </div>
          <div>
            <span className="text-xl font-bold text-lifeos-navy tracking-tight block leading-none">
              LIFEOS
            </span>
            <span className="text-[10px] text-lifeos-muted font-medium tracking-wide uppercase mt-0.5 block">
              Journey OS
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1.5" aria-label="Desktop Navigation">
          <NavItem to="/" icon={<Home size={18} />} label="Home" />
          <NavItem to="/dashboard" icon={<ListTodo size={18} />} label="My Plans" />
          <NavItem to="/create" icon={<Activity size={18} />} label="New Plan" />
          <NavItem to="/profile" icon={<User size={18} />} label="Profile" />
          <NavItem to="/settings" icon={<Settings size={18} />} label="Settings" />
        </nav>

        {/* Quick Footer */}
        <div className="pt-4 border-t border-gray-100 px-3">
          <div className="flex items-center justify-between text-xs text-lifeos-muted">
            <span className="font-medium">LIFEOS Mobile</span>
            <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Scroll Area with reserved bottom space on mobile */}
      <main className="flex-1 min-w-0 min-h-screen flex flex-col bg-lifeos-bg overflow-x-hidden">
        {/*
          Content container:
          - Reserves 5rem + safe-area-inset on mobile so content never renders under bottom nav
          - Automatically resets to normal pb-8 on desktop (md:)
        */}
        <div className="flex-1 w-full max-w-7xl mx-auto pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Fixed Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-gray-100 flex justify-around items-center px-2 z-50 shadow-soft-lg pb-[env(safe-area-inset-bottom,0px)]"
        aria-label="Mobile Bottom Navigation"
      >
        <MobileNavItem to="/" icon={<Home size={20} />} label="Home" />
        <MobileNavItem to="/dashboard" icon={<ListTodo size={20} />} label="Plans" />
        <MobileNavItem to="/create" icon={<Activity size={20} />} label="Create" />
        <MobileNavItem to="/profile" icon={<User size={20} />} label="Profile" />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all font-semibold text-xs md:text-sm',
          isActive
            ? 'bg-blue-50 text-lifeos-blue font-bold shadow-soft-sm'
            : 'text-lifeos-muted hover:bg-gray-50 hover:text-lifeos-navy'
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

function MobileNavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center w-16 h-12 space-y-1 transition-all rounded-xl select-none',
          isActive ? 'text-lifeos-blue font-bold' : 'text-gray-400 hover:text-lifeos-navy'
        )
      }
    >
      {icon}
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </NavLink>
  );
}
