import React from 'react';

interface KaviLogoProps {
  className?: string;
  showEnglish?: boolean;
}

export const KaviLogo: React.FC<KaviLogoProps> = ({
  className = '',
  showEnglish = false,
}) => {
  return (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="kaviMarkGrad" x1="6" y1="6" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38D9FF" />
            <stop offset="48%" stopColor="#4F8CFF" />
            <stop offset="100%" stopColor="#875BFF" />
          </linearGradient>
          <linearGradient id="kaviWingGrad" x1="14" y1="9" x2="28" y2="27" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38D9FF" />
            <stop offset="100%" stopColor="#875BFF" />
          </linearGradient>
        </defs>
        {/* Outer precision rounded frame */}
        <rect
          x="1.5"
          y="1.5"
          width="33"
          height="33"
          rx="9.5"
          className="fill-slate-100 stroke-slate-300 dark:fill-[#0D1220] dark:stroke-[#4F8CFF]/40"
          strokeWidth="1.25"
        />
        {/* Subtle inner circuit ring */}
        <rect
          x="4.5"
          y="4.5"
          width="27"
          height="27"
          rx="7"
          className="stroke-slate-200/80 dark:stroke-slate-800/80"
          strokeWidth="0.75"
        />
        {/* Geometric K Spine (pillar of autonomous execution) */}
        <path
          d="M11.5 9.5V26.5"
          stroke="url(#kaviMarkGrad)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Intersecting dynamic K wings forming an agentic directional spark */}
        <path
          d="M24.5 9.5L14.5 18L24.5 26.5"
          stroke="url(#kaviWingGrad)"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Central autonomous node core */}
        <circle cx="14.5" cy="18" r="2.2" fill="#38D9FF" />
        {/* Orbital apex spark on top-right wing */}
        <circle cx="24.5" cy="9.5" r="2.1" fill="#4F8CFF" />
        {/* Execution anchor node */}
        <circle cx="24.5" cy="26.5" r="2.1" fill="#875BFF" />
      </svg>
      <span className="inline-flex items-baseline gap-2">
        <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-[#F8FAFC]">
          کاوی
        </span>
        {showEnglish && (
          <span
            dir="ltr"
            className="text-[11px] font-medium tracking-tight text-slate-500 dark:text-slate-400 font-mono"
          >
            kaviai.ir
          </span>
        )}
      </span>
    </span>
  );
};

// Backwards-compatible alias for existing imports
export const VortaLogo = KaviLogo;
