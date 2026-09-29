import React from 'react';
import { Sparkle } from 'lucide-react';

interface MotivationCardProps {
  quote?: string;
  author?: string;
  className?: string;
}

export const MotivationCard: React.FC<MotivationCardProps> = ({
  quote = 'Small goals make big changes.',
  author = 'LIFEOS',
  className = '',
}) => {
  return (
    <section className={`w-full px-5 py-2 ${className}`}>
      <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#EFF6FF] via-[#F0F7FF] to-[#E0EDFE] border border-blue-100/90 p-4 shadow-soft-sm overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-300/20 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center gap-3">
          {/* Subtle Sparkle / Compass Vector Icon */}
          <div className="w-8 h-8 rounded-xl bg-white/90 border border-blue-200/60 flex items-center justify-center text-[#1E60F2] flex-shrink-0 shadow-soft-sm">
            <Sparkle className="w-4 h-4 fill-[#1E60F2]/10" />
          </div>

          {/* Quote & Attribution */}
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-medium text-slate-700 tracking-tight leading-snug">
              &ldquo;{quote}&rdquo;
            </p>
            <span className="text-[11px] font-bold text-[#1E60F2] tracking-wider uppercase mt-0.5 block">
              — {author}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
