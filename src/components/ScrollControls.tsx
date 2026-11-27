import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface ScrollControlsProps {
  isLight: boolean;
  chatMode?: boolean;
}

export const ScrollControls: React.FC<ScrollControlsProps> = ({ isLight, chatMode = false }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const getScrollElement = () => chatMode
    ? document.querySelector<HTMLElement>('.firekeeper-chat-scroll, .fk-chat-message-scroll')
    : null;

  useEffect(() => {
    let element: HTMLElement | null = null;
    let contentObserver: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let pendingUpdate = 0;
    const scheduleUpdate = () => {
      if (pendingUpdate) return;
      pendingUpdate = window.requestAnimationFrame(() => {
        pendingUpdate = 0;
        update();
      });
    };

    const update = () => {
      if (chatMode && !element) {
        setShowScrollTop(false);
        setShowScrollBottom(false);
        return;
      }
      const top = element ? element.scrollTop : window.scrollY;
      const height = element ? element.clientHeight : window.innerHeight;
      const total = element ? element.scrollHeight : document.documentElement.scrollHeight;
      setShowScrollTop(total > height + 2 && top > 100);
      setShowScrollBottom(total > height + 2 && total - top - height > 100);
    };

    const connect = () => {
      const next = getScrollElement();
      if (next === element) {
        update();
        return;
      }
      element?.removeEventListener('scroll', update);
      contentObserver?.disconnect();
      resizeObserver?.disconnect();
      window.cancelAnimationFrame(pendingUpdate);
      pendingUpdate = 0;
      element = next;
      contentObserver = null;
      resizeObserver = null;
      if (element) {
        element.addEventListener('scroll', update, { passive: true });
        contentObserver = new MutationObserver(scheduleUpdate);
        contentObserver.observe(element, { childList: true, subtree: true, characterData: true });
        resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(element);
      }
      update();
    };

    // Chat views can replace their scroll node without changing chatMode.
    let pendingReconnect = 0;
    const hostObserver = new MutationObserver(() => {
      if (pendingReconnect) return;
      pendingReconnect = window.requestAnimationFrame(() => {
        pendingReconnect = 0;
        connect();
      });
    });
    if (chatMode) hostObserver.observe(document.body, { childList: true, subtree: true });
    else window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    connect();
    update();
    return () => {
      hostObserver.disconnect();
      window.cancelAnimationFrame(pendingReconnect);
      window.cancelAnimationFrame(pendingUpdate);
      element?.removeEventListener('scroll', update);
      contentObserver?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [chatMode]);

  const scrollToTop = () => {
    const element = getScrollElement();
    if (element) element.scrollTo({ top: 0, behavior: 'smooth' });
    else if (!chatMode) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    const element = getScrollElement();
    if (element) element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
    else if (!chatMode) window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  if (!showScrollTop && !showScrollBottom) {
    return null;
  }

  return (
    <div
      className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 pointer-events-none"
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
