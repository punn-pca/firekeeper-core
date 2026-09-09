import React, { useState } from 'react';

interface AnimatedFlameLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTitle?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AnimatedFlameLogo: React.FC<AnimatedFlameLogoProps> = ({
  size = 'lg',
  showTitle = true,
  className = '',
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative flex flex-col items-center select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Outer ambient golden atmospheric halo */}
      <div className="relative flex items-center justify-center">
        {/* Soft pulsing radial amber gradient aura */}
        <div
          className={`absolute rounded-full transition-all duration-700 pointer-events-none ${
            isHovered
              ? 'w-36 h-36 bg-amber-500/25 blur-3xl scale-110'
              : 'w-28 h-28 bg-amber-500/15 blur-2xl animate-[pulse_4s_ease-in-out_infinite]'
          }`}
        />

        {/* Outer subtle solid ring (as seen in reference) */}
        <div
          className={`absolute rounded-full border border-amber-500/20 transition-all duration-500 pointer-events-none ${
            isHovered ? 'w-26 h-26 border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'w-24 h-24'
          }`}
        />

        {/* Middle dashed radar / intelligence rotation ring */}
        <div
          className={`absolute rounded-full border border-dashed border-amber-500/35 pointer-events-none transition-all duration-500 ${
            isHovered ? 'w-22 h-22 border-amber-400/60 rotate-45' : 'w-20 h-20'
          } animate-[spin_28s_linear_infinite]`}
        />

        {/* Inner reverse micro-dash ring */}
        <div
          className="absolute w-18 h-18 rounded-full border border-dotted border-amber-400/20 pointer-events-none animate-[spin_40s_linear_infinite_reverse]"
        />

        {/* Floating Spark Embers */}
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          <span
            className={`absolute -top-1 left-1/2 -translate-x-3 w-1 h-1 rounded-full bg-amber-300 opacity-70 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite] ${
              isHovered ? 'scale-125' : ''
            }`}
          />
          <span
            className="absolute top-2 right-2 w-1 h-1 rounded-full bg-amber-400 opacity-60 animate-[pulse_3s_ease-in-out_infinite]"
          />
          <span
            className="absolute -bottom-1 left-3 w-0.5 h-0.5 rounded-full bg-amber-200 opacity-50 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]"
          />
        </div>

        {/* Center Squircle Box (Rounded Rectangle Container) */}
        <div
          className={`relative z-10 flex items-center justify-center rounded-[20px] sm:rounded-[22px] border transition-all duration-300 cursor-pointer overflow-hidden ${
            isHovered
              ? 'w-15 h-15 sm:w-16 sm:h-16 border-amber-400/70 bg-[#0d1222] shadow-[0_0_28px_rgba(245,158,11,0.45)] scale-105'
              : 'w-14 h-14 sm:w-15 sm:h-15 border-amber-500/40 bg-[#090d1c] shadow-[0_0_20px_rgba(245,158,11,0.25),inset_0_1px_1px_rgba(255,255,255,0.1)]'
          }`}
        >
          {/* Subtle internal gradient shine */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-white/[0.04] pointer-events-none" />

          {/* Animated Custom Vector Flame */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className={`relative z-10 text-amber-400 transition-all duration-300 ${
              isHovered
                ? 'w-7 h-7 sm:w-8 sm:h-8 drop-shadow-[0_0_12px_rgba(251,191,36,0.95)]'
                : 'w-6.5 h-6.5 sm:w-7 sm:h-7 drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]'
            } animate-[fk-flame-motion_3.2s_ease-in-out_infinite]`}
          >
            <defs>
              <linearGradient id="fk-flame-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="60%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#fef08a" />
              </linearGradient>
              <radialGradient id="fk-flame-inner" cx="50%" cy="75%" r="45%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Inner subtle glow fill */}
            <path
              d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"
              fill="url(#fk-flame-inner)"
            />

            {/* Main flame outline path (crisp stroked icon matching reference) */}
            <path
              d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"
              stroke="url(#fk-flame-gradient)"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* FIRE KEEPER Title with Reference-accurate Chromatic/Neon Edge Accent */}
      {showTitle && (
        <div className="mt-5 flex flex-col items-center">
          <div className="relative group">
            {/* Background subtle chromatic shift / RGB effect */}
            <span
              className="absolute inset-0 font-mono font-black tracking-[0.24em] text-cyan-400 blur-[0.5px] opacity-40 select-none pointer-events-none translate-x-[-1px]"
              aria-hidden="true"
            >
              FIRE KEEPER
            </span>
            <span
              className="absolute inset-0 font-mono font-black tracking-[0.24em] text-red-500 blur-[0.5px] opacity-30 select-none pointer-events-none translate-x-[1px]"
              aria-hidden="true"
            >
              FIRE KEEPER
            </span>

            {/* Main Crisp White Title */}
            <h1 className="relative font-mono text-2xl sm:text-3xl lg:text-4xl font-black tracking-[0.24em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              FIRE KEEPER
            </h1>
          </div>

          {/* Clean border line underneath matching reference */}
          <div className="mt-3.5 h-px w-40 sm:w-56 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      )}
    </div>
  );
};
