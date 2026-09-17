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
  const boxSize = size === 'sm' ? 'h-10 w-10' : size === 'md' ? 'h-12 w-12' : 'h-14 w-14';
  const iconSize = size === 'sm' ? 'h-5 w-5' : size === 'md' ? 'h-6 w-6' : 'h-7 w-7';

  return (
    <div
      className={`relative flex flex-col items-center select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div
        className={`absolute h-20 w-20 rounded-full bg-amber-400/10 blur-2xl transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-60'}`}
        aria-hidden="true"
      />
      <div
        className={`relative flex ${boxSize} items-center justify-center rounded-2xl border bg-[#090d18] transition-all duration-300 ${isHovered ? 'border-amber-400/60 shadow-[0_0_28px_rgba(245,158,11,0.18)]' : 'border-amber-500/30 shadow-[0_8px_24px_rgba(245,158,11,0.10)]'}`}
      >
        <FlameIcon className={`relative ${iconSize} text-amber-400 transition-transform duration-300 ${isHovered ? 'scale-105' : ''}`} />
      </div>
      {showTitle && (
        <div className="mt-4 flex flex-col items-center">
          <h1 className="font-mono text-xl font-semibold tracking-[0.18em] text-white sm:text-2xl">FIRE KEEPER</h1>
          <div className="mt-2 h-px w-24 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>
      )}
    </div>
  );
};

const FlameIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
