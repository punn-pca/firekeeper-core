import React from 'react';
import { Sliders, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../utils/themeTokens';

interface InspectorActionsProps {
  onToggleCustomizer: () => void;
  showCustomizer: boolean;
  activeWidgetCount: number;
}

export const InspectorActions: React.FC<InspectorActionsProps> = ({
  onToggleCustomizer,
  showCustomizer,
  activeWidgetCount,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  return (
    <div className={`border p-4 rounded-xl flex items-center justify-between gap-4 font-sans text-xs ${tokens.shadow} ${
      isLight ? 'bg-white border-[#E5E7EB] text-[#111827]' : 'bg-[#111827] border-white/10 text-slate-200'
    }`}>
      <div className="flex items-center space-x-2">
        <Sparkles className="w-4 h-4 text-[#F59E0B]" />
        <span className="font-bold text-sm">Widget Management Controls</span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={onToggleCustomizer}
          className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            showCustomizer
              ? 'bg-amber-500/20 text-[#D97706] dark:text-amber-300 border-[#F59E0B]'
              : isLight
                ? 'bg-white hover:bg-[#F9FAFB] text-[#111827] border-[#E5E7EB]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Customize Widgets ({activeWidgetCount})</span>
        </button>
      </div>
    </div>
  );
};
