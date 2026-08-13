import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../utils/themeTokens';

interface InspectorCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const InspectorCard: React.FC<InspectorCardProps> = ({
  title,
  description,
  icon,
  badge,
  children,
  footer,
  defaultOpen = true,
  className = '',
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  return (
    <div
      className={`rounded-xl border transition-all overflow-hidden ${
        isLight
          ? 'bg-white border-[#E5E7EB] shadow-[0_2px_8px_rgba(15,23,42,0.08)]'
          : 'bg-[#111827] border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
      } ${className}`}
    >
      {/* Header */}
      <div
        className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 ${
          isLight ? 'bg-white border-[#E5E7EB]' : 'bg-[#111827] border-white/10'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && <div className="text-[#F59E0B] shrink-0">{icon}</div>}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className={`text-base font-bold truncate ${
                  isLight ? 'text-[#111827]' : 'text-white'
                }`}
              >
                {title}
              </h3>
              {badge}
            </div>
            {description && (
              <p
                className={`text-xs font-normal truncate mt-0.5 ${
                  isLight ? 'text-[#6B7280]' : 'text-slate-400'
                }`}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
            isLight
              ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title={isOpen ? 'Collapse section' : 'Expand section'}
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Body */}
      {isOpen && <div className="p-5 space-y-4">{children}</div>}

      {/* Optional Footer */}
      {isOpen && footer && (
        <div
          className={`px-5 py-3 border-t flex items-center justify-between text-xs ${
            isLight
              ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280]'
              : 'bg-[#0B1220]/50 border-white/10 text-slate-400'
          }`}
        >
          {footer}
        </div>
      )}
    </div>
  );
};
