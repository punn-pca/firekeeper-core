import React from 'react';
import { Sliders, CheckCircle2 } from 'lucide-react';
import { ALL_COMPOSER_WIDGETS } from '../../utils/reportClassifier';
import { useTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../utils/themeTokens';

interface InspectorSettingsProps {
  activeWidgetIds: string[];
  onToggleWidget: (widgetId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export const InspectorSettings: React.FC<InspectorSettingsProps> = ({
  activeWidgetIds,
  onToggleWidget,
  onSelectAll,
  onClearAll,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  return (
    <div className={`p-5 rounded-xl border space-y-4 ${tokens.shadow} animate-fadeIn ${
      isLight ? 'bg-white border-[#E5E7EB] text-[#111827]' : 'bg-[#111827] border-white/10 text-white'
    }`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#F59E0B] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#F59E0B]" />
          Custom Widget Selection
        </h3>
        <div className="flex gap-3 text-xs">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-[#F59E0B] hover:underline cursor-pointer font-medium"
          >
            Select All
          </button>
          <span className={isLight ? 'text-[#E5E7EB]' : 'text-slate-600'}>|</span>
          <button
            type="button"
            onClick={onClearAll}
            className={`hover:underline cursor-pointer font-medium ${
              isLight ? 'text-[#6B7280]' : 'text-slate-400'
            }`}
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ALL_COMPOSER_WIDGETS.map((w) => {
          const isChecked = activeWidgetIds.includes(w.id);
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => onToggleWidget(w.id)}
              className={`p-3 rounded-lg border text-left transition-all flex items-start space-x-2.5 cursor-pointer ${
                isChecked
                  ? isLight
                    ? 'bg-amber-50 border-[#F59E0B] text-[#111827]'
                    : 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                  : isLight
                    ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280] hover:border-[#CBD5E1]'
                    : 'bg-[#0B1220] border-white/5 text-slate-400 hover:border-white/20'
              }`}
            >
              <div
                className={`w-4 h-4 rounded border shrink-0 mt-0.5 flex items-center justify-center ${
                  isChecked
                    ? 'bg-[#F59E0B] border-[#F59E0B] text-white'
                    : isLight
                      ? 'border-[#CBD5E1] bg-white'
                      : 'border-slate-700'
                }`}
              >
                {isChecked && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className={`text-xs font-bold truncate ${
                  isChecked && isLight ? 'text-[#111827]' : ''
                }`}>{w.title}</div>
                <div className={`text-[11px] line-clamp-1 ${
                  isLight ? 'text-[#6B7280]' : 'text-slate-400'
                }`}>{w.category}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
