import React from 'react';

/**
 * Shared visual surface for every Firekeeper chat entry point.
 * Chat execution, attachments, auth and model state stay with each caller.
 */
type ChatComposerSurfaceProps = {
  as?: 'div' | 'form';
  children: React.ReactNode;
  className?: string;
  light?: boolean;
} & React.HTMLAttributes<HTMLElement>;

export const ChatComposerSurface: React.FC<ChatComposerSurfaceProps> = ({
  as = 'div', children, className = '', light = false, ...rest
}) => React.createElement(as, {
  ...rest,
  className: [
    'fk-unified-chat-composer overflow-hidden rounded-2xl border transition-all duration-300',
    'shadow-[0_12px_45px_rgba(0,0,0,0.35)]',
    'focus-within:border-sky-400/80 focus-within:shadow-[0_0_28px_rgba(59,130,246,0.22)]',
    light
      ? 'border-slate-200 bg-white text-slate-900'
      : 'border-sky-400/35 bg-gradient-to-br from-[#101d39] via-[#0c1428] to-[#080d19] text-slate-100',
    className,
  ].join(' '),
}, children);
