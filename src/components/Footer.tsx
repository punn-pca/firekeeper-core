import React from 'react';
import { ExternalLink } from 'lucide-react';

interface FooterProps {
  isLight: boolean;
  navigateToTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ isLight, navigateToTab }) => {
  const itemClass = 'hover:text-amber-500 transition-colors cursor-pointer py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 rounded-sm';

  return (
    <footer
      className={`shrink-0 border-t py-4 sm:py-3 text-[10px] font-mono shadow-2xs transition-colors duration-300 relative z-10 ${
        isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#060A16] border-white/5 text-slate-500'
      }`}
    >
      <nav
        aria-label="Project footer navigation"
        className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2.5 font-medium"
      >
        <div className="flex flex-col md:flex-row items-center gap-x-4 gap-y-3">
          <div className="flex items-center space-x-2 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span className={`font-black tracking-[0.2em] uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
              FIRE KEEPER OS
            </span>
          </div>

          <span className={`hidden md:inline ${isLight ? 'text-slate-300' : 'text-white/5'}`} aria-hidden="true">|</span>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 uppercase tracking-widest">
            <button type="button" onClick={() => navigateToTab('about')} className={`${itemClass} text-amber-500 font-black`}>
              ปรัชญา (Philosophy)
            </button>

            <span className={isLight ? 'text-slate-300' : 'text-white/5'} aria-hidden="true">/</span>

            <button type="button" onClick={() => navigateToTab('punn-pca')} className={itemClass}>
              ข้อกำหนด PCA
            </button>

            <span className={isLight ? 'text-slate-300' : 'text-white/5'} aria-hidden="true">/</span>

            <button type="button" onClick={() => navigateToTab('privacy-terms')} className={itemClass}>
              ความปลอดภัย
            </button>

            <span className={isLight ? 'text-slate-300' : 'text-white/5'} aria-hidden="true">/</span>

            <a
              href="https://firekeeper.site/about"
              target="_blank"
              rel="noopener noreferrer"
              className={itemClass}
            >
              ติดต่อเรา
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
             <div className="w-1 h-1 rounded-full bg-slate-700" />
             <span className={isLight ? 'text-slate-400' : 'text-slate-600'}>PCA v3.0.42</span>
          </div>
          <span className={`uppercase tracking-[0.15em] ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>
            © {new Date().getFullYear()} PUNN
          </span>
        </div>
      </nav>
    </footer>
  );
};
