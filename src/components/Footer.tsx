import React from 'react';
import { ExternalLink } from 'lucide-react';

interface FooterProps {
  isLight: boolean;
  navigateToTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ isLight, navigateToTab }) => {
  const itemClass = 'hover:text-[#FF8A00] transition-colors cursor-pointer py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 rounded-sm';

  return (
    <footer
      className={`shrink-0 border-t py-2.5 sm:py-3 text-xs font-mono shadow-2xs ${
        isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#0B1220] border-white/10 text-slate-400'
      }`}
    >
      <nav
        aria-label="Project footer navigation"
        className="max-w-[1400px] mx-auto px-3 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-2.5 font-medium"
      >
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2.5 gap-y-1.5">
          <div className="flex items-center space-x-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span className={`font-bold tracking-wide text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
              FIRE KEEPER OS
            </span>
          </div>

          <span className="text-slate-700 hidden sm:inline" aria-hidden="true">|</span>

          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] font-sans">
            <button type="button" onClick={() => navigateToTab('about')} className={`${itemClass} text-amber-500 font-semibold`}>
              Philosophy & Human Agency
            </button>

            <span className="text-slate-700" aria-hidden="true">·</span>

            <button type="button" onClick={() => navigateToTab('punn-pca')} className={itemClass}>
              PUNN PCA Specification
            </button>

            <span className="text-slate-700" aria-hidden="true">·</span>

            <button type="button" onClick={() => navigateToTab('privacy-terms')} className={itemClass}>
              Trust, Privacy & Security
            </button>

            <span className="text-slate-700" aria-hidden="true">·</span>

            <a
              href="https://github.com/punn-pca/firekeeper-core/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className={itemClass}
              aria-label="Open source license, Apache License 2.0"
            >
              Open Source License
              <ExternalLink className="inline-block ml-1 w-3 h-3" aria-hidden="true" />
            </a>

            <span className="text-slate-700" aria-hidden="true">·</span>

            <a
              href="https://firekeeper.site/about"
              target="_blank"
              rel="noopener noreferrer"
              className={itemClass}
              aria-label="About and contact information for Punn"
            >
              Contact
              <ExternalLink className="inline-block ml-1 w-3 h-3" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2 text-center">
          <span className={`text-[10px] sm:text-[11px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            PUNN Predictive Cognitive Architecture (PCA)
          </span>
        </div>
      </nav>
    </footer>
  );
};
