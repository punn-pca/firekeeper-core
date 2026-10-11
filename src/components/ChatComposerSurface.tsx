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
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
} & Omit<React.HTMLAttributes<HTMLElement>, 'onSubmit'>;

export const ChatComposerSurface: React.FC<ChatComposerSurfaceProps> = ({
  as = 'div', children, className = '', light = false, ...rest
}) => React.createElement(as, {
  ...rest,
  className: [
    'fk-unified-chat-composer overflow-hidden rounded-2xl border transition-colors duration-200',
    'shadow-[0_8px_28px_rgba(0,0,0,0.20)]',
    'focus-within:border-amber-500/60 focus-within:shadow-[0_0_0_1px_rgba(217,161,72,0.16)]',
    light
      ? 'border-slate-200 bg-white text-slate-900'
      : 'border-[#34302a] bg-[#171717] text-[#f1eee8]',
    className,
  ].join(' '),
}, children);
