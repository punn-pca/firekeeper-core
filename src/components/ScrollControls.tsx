import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface ScrollControlsProps {
  isLight: boolean;
}

export const ScrollControls: React.FC<ScrollControlsProps> = ({ isLight }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(true);

  useEffect(() => {
    const handleWindowScroll = () => {
      // Toggle Scroll to Top button when scrolled down
      if (window.scrollY > 250) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      // Toggle Scroll to Bottom button when near bottom
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const clientHeight = document.documentElement.clientHeight || window.innerHeight;
      const isNearBottom = window.scrollY + clientHeight >= scrollHeight - 200;

      if (isNearBottom) {
        setShowScrollBottom(false);
      } else {
        setShowScrollBottom(true);
      }
    };

    // Initial check
    const timer = setTimeout(handleWindowScroll, 300);

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    window.addEventListener('resize', handleWindowScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleWindowScroll);
      window.removeEventListener('resize', handleWindowScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    window.scrollTo({ top: scrollHeight, behavior: 'smooth' });
  };

  if (!showScrollTop && !showScrollBottom) {
    return null;
  }

  return (
    <div
      className="fixed right-4 sm:right-6 bottom-20 sm:bottom-24 z-40 flex flex-col gap-2 pointer-events-none"
      aria-label="Page scroll controls"
    >
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className={`pointer-events-auto p-2.5 sm:p-3 rounded-full shadow-2xl border transition-all animate-fadeIn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-amber-500 shadow-slate-300/50'
              : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-amber-400 backdrop-blur-sm shadow-black/60'
          }`}
          aria-label="Scroll to top"
          title="ขึ้นไปบนสุด (Scroll to top)"
        >
          <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}
      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className={`pointer-events-auto p-2.5 sm:p-3 rounded-full shadow-2xl border transition-all animate-fadeIn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-amber-500 shadow-slate-300/50'
              : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-amber-400 backdrop-blur-sm shadow-black/60'
          }`}
          aria-label="Scroll to bottom"
          title="ลงไปล่างสุด (Scroll to bottom)"
        >
          <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}
    </div>
  );
};
