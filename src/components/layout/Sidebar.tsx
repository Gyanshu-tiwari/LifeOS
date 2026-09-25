import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Target,
  CheckSquare,
  Calendar,
  FileText,
  Bot,
  Bell,
  Search,
  MapPin,
  CalendarCheck,
  ShieldCheck,
  Zap,
  User,
  Settings,
  HelpCircle,
  X,
  Compass,
  Sparkles,
} from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeGoal, notifications } = useLifeOS();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const primaryNav = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/goals', label: 'My Goals', icon: Target },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/agents', label: 'Agents', icon: Bot },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
  ];

  const toolsNav = [
    { to: '/research', label: 'Research Agent', icon: Search },
    { to: '/maps', label: 'Maps & Commute', icon: MapPin },
    { to: '/planning', label: 'Planning', icon: CalendarCheck },
    { to: '/verification', label: 'Verification', icon: ShieldCheck },
    { to: '/actions', label: 'Action Center', icon: Zap },
  ];

  const accountNav = [
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/help', label: 'Help & Docs', icon: HelpCircle },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-semibold transition-all duration-150 group ${
      isActive
        ? 'bg-[#1E60F2] text-white shadow-sm'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
          <NavLink to="/" onClick={onClose} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0F172A] via-[#1E60F2] to-[#38BDF8] p-[1.5px] shadow-sm flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Compass className="w-4 h-4 text-[#1E60F2]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-[#0F172A]">
                LIFE<span className="text-[#1E60F2]">OS</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 -mt-1 tracking-wider uppercase">
                Goal Intelligence
              </span>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="lg:hidden w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {/* Active Goal Context Badge */}
          {activeGoal && (
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50/90 to-indigo-50/70 border border-blue-100/90">
              <div className="flex items-center justify-between text-[10px] font-bold text-[#1E60F2] uppercase tracking-wider mb-1">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Active Goal
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs font-bold text-slate-800 truncate">
                {activeGoal.title}
              </p>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>{activeGoal.constraints.budget}</span>
                <span className="font-semibold text-[#1E60F2]">
                  {Math.round((activeGoal.completedTasks / activeGoal.totalTasks) * 100)}% done
                </span>
              </div>
            </div>
          )}

          {/* Primary Nav */}
          <div>
            <div className="px-3 mb-2 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              Workspace
            </div>
            <nav className="space-y-1">
              {primaryNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={navLinkClass}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#1E60F2] text-white rounded-full group-hover:bg-blue-600">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Tools & Agents */}
          <div>
            <div className="px-3 mb-2 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              Specialized Agents
            </div>
            <nav className="space-y-1">
              {toolsNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={navLinkClass}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Account & Settings */}
          <div>
            <div className="px-3 mb-2 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              Account
            </div>
            <nav className="space-y-1">
              {accountNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={navLinkClass}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer User Info */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <NavLink
            to="/profile"
            onClick={onClose}
            className="flex items-center gap-2.5 min-w-0 hover:opacity-85 transition-opacity"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
              alt="Ananya Sharma"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20 flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">Ananya Sharma</p>
              <p className="text-[10px] text-slate-500 truncate">ananya@lifeos.ai</p>
            </div>
          </NavLink>
        </div>
      </aside>
    </>
  );
};
