import React from 'react';

interface HeroSectionProps {
  userName?: string;
  className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  userName = 'Ananya',
  className = '',
}) => {
  return (
    <section className={`w-full ${className}`}>
      {/* Outer Card with Rounded Corners and Soft Glow */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-blue-100/80 bg-gradient-to-b from-[#F0F6FF] via-[#E8F1FD] to-[#DCEBFE] shadow-soft-md">
        {/* Background Decorative Graphic Elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 px-5 sm:px-8 pt-6 pb-2">
          {/* Greeting */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[13px] sm:text-sm font-semibold tracking-normal text-slate-600">
              Hello, {userName}
            </span>
            <span className="text-base select-none" role="img" aria-label="waving hand">
              👋
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] leading-[1.2] font-extrabold tracking-tight text-[#0B192C]">
            Turn your real-life goals<br />
            into <span className="text-[#1E60F2]">real progress.</span>
          </h1>
        </div>

        {/* Hero Visual Artwork (Goal -> Journey -> Progress) */}
        <div className="relative w-full h-[155px] sm:h-[185px] md:h-[210px] overflow-hidden mt-1">
          <svg
            viewBox="0 0 480 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full object-cover select-none"
            preserveAspectRatio="xMidYMax meet"
          >
            <defs>
              <linearGradient id="skyGrad" x1="240" y1="0" x2="240" y2="160" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#E0EDFE" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#FEF3C7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.9" />
              </linearGradient>

              <radialGradient id="sunGlow" cx="260" cy="85" r="85" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFBEB" stopOpacity="1" />
                <stop offset="35%" stopColor="#FDE68A" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#FDBA74" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#FDBA74" stopOpacity="0" />
              </radialGradient>

              <linearGradient id="mountainFar" x1="240" y1="40" x2="240" y2="110" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#C7D2FE" />
                <stop offset="100%" stopColor="#A5B4FC" />
              </linearGradient>

              <linearGradient id="mountainMid" x1="240" y1="60" x2="240" y2="120" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#93C5FD" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>

              <linearGradient id="hillLeft" x1="80" y1="90" x2="80" y2="160" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              <linearGradient id="hillRight" x1="360" y1="95" x2="360" y2="160" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>

              <linearGradient id="pathGrad" x1="260" y1="85" x2="200" y2="160" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="30%" stopColor="#FDE047" />
                <stop offset="70%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#CBD5E1" />
              </linearGradient>
            </defs>

            {/* Sun Rays & Glowing Orb */}
            <circle cx="260" cy="80" r="65" fill="url(#sunGlow)" />
            <circle cx="260" cy="80" r="18" fill="#FFFBEB" />

            {/* Distant Mountain Ridges */}
            <path
              d="M0 115 L60 70 L140 110 L220 50 L300 100 L380 65 L440 95 L500 70 L500 160 L0 160 Z"
              fill="url(#mountainFar)"
              opacity="0.65"
            />
            <path
              d="M0 120 L80 80 L180 118 L260 68 L360 115 L430 80 L500 120 L500 160 L0 160 Z"
              fill="url(#mountainMid)"
              opacity="0.75"
            />

            {/* City Skyline Silhouette on Horizon */}
            <g fill="#475569" opacity="0.38">
              <rect x="225" y="70" width="10" height="15" rx="1" />
              <rect x="238" y="62" width="12" height="23" rx="1" />
              <rect x="253" y="56" width="14" height="29" rx="1.5" />
              <polygon points="260,50 256,56 264,56" />
              <rect x="270" y="64" width="11" height="21" rx="1" />
              <rect x="284" y="72" width="13" height="13" rx="1" />
            </g>

            {/* Left Rolling Hill */}
            <path
              d="M-20 160 Q80 90 245 118 L245 160 Z"
              fill="url(#hillLeft)"
              opacity="0.88"
            />

            {/* Right Rolling Hill */}
            <path
              d="M500 160 Q380 95 230 115 L230 160 Z"
              fill="url(#hillRight)"
              opacity="0.9"
            />

            {/* Pine Trees */}
            <g fill="#065F46" opacity="0.9">
              <polygon points="40,122 35,135 45,135" />
              <polygon points="40,128 33,142 47,142" />
              <polygon points="70,118 66,129 74,129" />
              <polygon points="100,125 96,135 104,135" />
              <polygon points="140,128 137,136 143,136" />
            </g>

            <g fill="#064E3B" opacity="0.9">
              <polygon points="430,120 425,133 435,133" />
              <polygon points="430,127 423,140 437,140" />
              <polygon points="390,122 386,132 394,132" />
              <polygon points="350,125 347,134 353,134" />
            </g>

            {/* Winding Road / Path leading towards the horizon */}
            <path
              d="M175 160 C200 142 215 130 235 118 C248 110 255 102 260 86 L264 86 C258 102 251 112 238 122 C218 135 205 146 182 160 Z"
              fill="url(#pathGrad)"
            />
            <path
              d="M178 160 Q225 132 262 86"
              stroke="#FFFFFF"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.8"
            />

            {/* Traveler / Student moving toward the horizon */}
            <g transform="translate(232, 114) scale(0.7)">
              <circle cx="10" cy="5" r="3.2" fill="#1E293B" />
              <rect x="4.5" y="8.5" width="4.5" height="7.5" rx="2" fill="#2563EB" />
              <path d="M8 8 C9.5 8 13 8.5 13.5 12 L13 19 L7 19 Z" fill="#0F172A" />
              <line x1="8.5" y1="19" x2="6.5" y2="28" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
              <line x1="11.5" y1="19" x2="14.5" y2="27" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
};
