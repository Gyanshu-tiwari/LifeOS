import React from 'react';
import { MapPin, Calendar } from 'lucide-react';
import { Goal } from '../../types';
import { ProgressBar } from './ProgressBar';

interface GoalCardProps {
  goal: Goal;
  onClick?: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick }) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick && onClick()}
      className="w-full bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-soft hover:shadow-soft-md transition-all duration-200 text-left active:scale-[0.99] cursor-pointer"
    >
      {/* Top Media Banner with Image and Floating Status Pill */}
      <div className="relative w-full h-36 bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 overflow-hidden">
        {/* Rich Architectural University & Campus Backdrop */}
        <svg
          viewBox="0 0 400 144"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full object-cover select-none"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="campusSky" x1="200" y1="0" x2="200" y2="144" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="50%" stopColor="#312E81" />
              <stop offset="85%" stopColor="#D97706" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.9" />
            </linearGradient>
            <radialGradient id="campusSun" cx="200" cy="110" r="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#FBBF24" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#312E81" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sky & Sun Glow */}
          <rect width="400" height="144" fill="url(#campusSky)" />
          <circle cx="200" cy="115" r="70" fill="url(#campusSun)" />

          {/* University Buildings Silhouette (Lucknow University & Historic Arches) */}
          <g fill="#0F172A" opacity="0.85">
            {/* Left Wing */}
            <rect x="25" y="70" width="70" height="74" />
            <polygon points="25,70 60,45 95,70" />
            {/* Colonnade pillars */}
            <rect x="35" y="80" width="6" height="50" fill="#1E293B" />
            <rect x="50" y="80" width="6" height="50" fill="#1E293B" />
            <rect x="65" y="80" width="6" height="50" fill="#1E293B" />
            <rect x="80" y="80" width="6" height="50" fill="#1E293B" />

            {/* Central Clock Tower & Dome */}
            <rect x="165" y="35" width="70" height="109" />
            {/* Grand Dome */}
            <ellipse cx="200" cy="35" rx="30" ry="22" />
            <polygon points="198,13 202,13 200,6" />
            {/* Clock Face */}
            <circle cx="200" cy="55" r="10" fill="#FEF3C7" opacity="0.9" />
            <line x1="200" y1="55" x2="200" y2="48" stroke="#0F172A" strokeWidth="1.5" />
            <line x1="200" y1="55" x2="204" y2="55" stroke="#0F172A" strokeWidth="1.5" />
            {/* Main Arch Gate */}
            <path d="M185 144 V100 C185 90 215 90 215 100 V144 Z" fill="#F59E0B" opacity="0.6" />

            {/* Right Wing */}
            <rect x="305" y="70" width="70" height="74" />
            <polygon points="305,70 340,45 375,70" />
            <rect x="315" y="80" width="6" height="50" fill="#1E293B" />
            <rect x="330" y="80" width="6" height="50" fill="#1E293B" />
            <rect x="345" y="80" width="6" height="50" fill="#1E293B" />
            <rect x="360" y="80" width="6" height="50" fill="#1E293B" />
          </g>

          {/* Foreground Trees & Courtyard Walkway */}
          <g fill="#022C22" opacity="0.95">
            <polygon points="110,95 102,125 118,125" />
            <polygon points="140,90 130,128 150,128" />
            <polygon points="260,90 250,128 270,128" />
            <polygon points="290,95 282,125 298,125" />
          </g>
        </svg>

        {/* Optional high-res photo overlay with gentle opacity */}
        <img
          src={
            goal.imageUrl ||
            'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=700&q=80'
          }
          alt={goal.title}
          onError={(e) => {
            // Hide img if offline or failed
            (e.target as HTMLElement).style.display = 'none';
          }}
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
        />

        {/* Vignette Overlay for Crisp Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C]/90 via-[#0B192C]/30 to-transparent" />

        {/* Floating Status Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-white/50">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[12px] font-bold text-emerald-800 tracking-tight">
            {goal.status}
          </span>
        </div>

        {/* Floating Category Tag */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[11px] font-medium border border-white/20">
          {goal.category}
        </div>

        {/* Bottom Title Overlay on Image */}
        <div className="absolute bottom-2.5 left-3.5 right-3.5">
          <h3 className="text-white text-[17px] font-bold tracking-tight drop-shadow-sm">
            {goal.title}
          </h3>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col gap-3">
        {/* Goal Description */}
        <p className="text-[13px] text-slate-600 leading-relaxed font-normal">
          {goal.description}
        </p>

        {/* Key Constraints Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1E60F2] text-[11.5px] font-semibold border border-blue-100/80">
            {goal.constraints.budget}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11.5px] font-semibold border border-indigo-100/80">
            {goal.constraints.maxCommute}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11.5px] font-semibold border border-slate-200/80">
            {goal.constraints.vehicle}
          </span>
        </div>

        {/* Progress Section */}
        <div className="pt-1 pb-1">
          <ProgressBar
            completed={goal.completedTasks}
            total={goal.totalTasks}
            label={`${goal.completedTasks} of ${goal.totalTasks} tasks`}
          />
        </div>

        {/* Footer Metadata: Location & Deadline */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[12px] text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>{goal.location}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#1E60F2]" />
            <span>Deadline: {goal.deadline}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
