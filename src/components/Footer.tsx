import React from 'react';

interface FooterProps {
  isLight: boolean;
  navigateToTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ isLight, navigateToTab }) => {
  return (
    <footer className={`shrink-0 border-t py-2.5 sm:py-3 text-xs font-mono shadow-2xs ${
      isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#0B1220] border-white/10 text-slate-400'
    }`}>
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-2.5 font-medium">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2.5 gap-y-1.5">
          <div className="flex items-center space-x-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className={`font-bold tracking-wide text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>FIRE KEEPER OS</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] font-sans">
            <button onClick={() => navigateToTab('about')} className="hover:text-[#FF8A00] transition-colors cursor-pointer py-0.5 text-amber-500 font-semibold">Philosophy & Human Agency</button>
            <span className="text-slate-700">·</span>
            <button onClick={() => navigateToTab('punn-pca')} className="hover:text-[#FF8A00] transition-colors cursor-pointer py-0.5">PUNN PCA Specification</button>
            <span className="text-slate-700">·</span>
            <button onClick={() => navigateToTab('privacy-terms')} className="hover:text-[#FF8A00] transition-colors cursor-pointer py-0.5">Trust, Privacy & Security</button>
            <span className="text-slate-700">·</span>
            <button onClick={() => window.open('https://github.com/punn-pca/firekeeper-core/blob/main/LICENSE', '_blank', 'noopener,noreferrer')} className="hover:text-[#FF8A00] transition-colors cursor-pointer py-0.5">Open Source License</button>
            <span className="text-slate-700">·</span>
            <button onClick={() => navigateToTab('about')} className="hover:text-[#FF8A00] transition-colors cursor-pointer py-0.5">Contact</button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-center">
          <span className={`text-[10px] sm:text-[11px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            PUNN Predictive Cognitive Architecture (PCA)
          </span>
        </div>
      </div>
    </footer>
  );
};
