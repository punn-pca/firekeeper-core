import { useState, useEffect } from 'react';

export interface VisualViewportState {
  viewportHeight: number;
  keyboardHeight: number;
  isKeyboardOpen: boolean;
}

/**
 * Custom hook to monitor Mobile Visual Viewport changes (e.g., Android software keyboard).
 * Provides exact keyboard height, current visual viewport height, and keyboard open status.
 */
export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>({
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    keyboardHeight: 0,
    isKeyboardOpen: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const vv = window.visualViewport;

    const handleViewportChange = () => {
      const windowHeight = window.innerHeight;
      const currentVvHeight = vv.height;
      // If visual viewport is significantly smaller than layout window, keyboard is open
      const diff = windowHeight - currentVvHeight;
      const isKeyboard = diff > 120; // 120px threshold for software keyboard

      setState({
        viewportHeight: currentVvHeight,
        keyboardHeight: isKeyboard ? diff : 0,
        isKeyboardOpen: isKeyboard,
      });
    };

    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);
    window.addEventListener('resize', handleViewportChange);

    // Initial check
    handleViewportChange();

    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  return state;
}

/**
 * Safely scrolls a focused textarea/input element into view on mobile without disrupting desktop layout.
 */
export function scrollInputIntoView(element: HTMLElement | null, delayMs = 150) {
  if (!element || typeof window === 'undefined') return;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || ('ontouchstart' in window);

  if (!isMobile) return;

  window.setTimeout(() => {
    try {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    } catch {
      element.scrollIntoView(false);
    }
  }, delayMs);
}
