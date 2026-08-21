import React from 'react';
import { Flame } from 'lucide-react';

export const ShareCoverGenerator: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-[#050B14] flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      {/* Background Elements */}
      {/* Faint Concentric Circles */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.15] pointer-events-none">
        <div className="w-[300px] h-[300px] rounded-full border border-slate-500"></div>
        <div className="absolute w-[450px] h-[450px] rounded-full border border-slate-500"></div>
        <div className="absolute w-[600px] h-[600px] rounded-full border border-slate-500"></div>
      </div>
      
      {/* Radial Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] h-[300px] bg-orange-500/10 blur-[100px] rounded-full"></div>
      </div>

      {/* Side Dot Grids */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-slate-400 rounded-full"></div>
          ))}
        </div>
      </div>
      <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-slate-400 rounded-full"></div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Flame */}
        <div className="mb-6">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f97316"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0px 0px 8px rgba(249, 115, 22, 0.4))' }}
          >
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-medium text-white tracking-[0.4em] ml-[0.4em] mb-8">
          FIRE KEEPER
        </h1>

        {/* Subtitle */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-[1px] bg-slate-700"></div>
          <span className="text-slate-400 text-xs md:text-sm tracking-widest font-mono uppercase">
            12-Stage Strategic Intelligence
          </span>
          <div className="w-16 h-[1px] bg-slate-700"></div>
        </div>

        {/* Status Pill */}
        <div className="px-4 py-1.5 rounded-full border border-slate-700/80 bg-slate-900/40 flex items-center space-x-2.5 backdrop-blur-sm mb-16">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></div>
          <span className="text-[10px] md:text-xs text-slate-300 font-mono tracking-widest">
            PUNN COGNITIVE ARCHITECTURE (PCA V2)
          </span>
        </div>

        {/* Tagline */}
        <div className="text-slate-400 text-[10px] md:text-xs font-mono tracking-widest uppercase mt-4">
          See Clearer. Decide Freer. <span className="text-orange-500">Act Wiser.</span>
        </div>
      </div>
    </div>
  );
};
