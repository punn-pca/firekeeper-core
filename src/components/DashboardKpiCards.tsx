import React from 'react';
import { Layers, Activity, Database, Brain, Sparkles, Compass } from 'lucide-react';
import { ToneMode, ReasoningProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { getThemeTokens } from '../utils/themeTokens';

interface DashboardKpiCardsProps {
  memoryCount: number;
  tone: ToneMode;
  reasoningProfile: ReasoningProfile;
  deepReasoning: boolean;
}

export const DashboardKpiCards: React.FC<DashboardKpiCardsProps> = React.memo(({
  memoryCount,
  tone,
  reasoningProfile,
  deepReasoning,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  const kpiData = [
    {
      title: '12 Stage Matrix',
      value: deepReasoning ? '12/12 Stages Active' : 'Fast Path Active',
      subtext: 'PUNN Cognitive Engine',
      icon: Layers,
      color: 'text-[#F59E0B]',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Current Mode',
      value: 'Executive OS',
      subtext: `Profile: ${reasoningProfile}`,
      icon: Activity,
      color: 'text-emerald-600 dark:text-[#35D07F]',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Memory Enabled',
      value: `${memoryCount} Active Memories`,
      subtext: 'Persistent Long-Term Memory',
      icon: Database,
      color: 'text-purple-600 dark:text-[#7C5CFF]',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Reasoning Level',
      value: deepReasoning ? 'Deep Analysis' : 'Standard Speed',
      subtext: 'Multi-Perspective Rigor',
      icon: Brain,
      color: 'text-[#F59E0B]',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Knowledge Sources',
      value: 'Multimodal + Web',
      subtext: 'Documents, Code, Media',
      icon: Sparkles,
      color: 'text-blue-600 dark:text-sky-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Response Style',
      value: tone,
      subtext: 'Tone Preference',
      icon: Compass,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
      {kpiData.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className={`rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between space-y-1.5 border ${tokens.shadow} ${
              isLight ? 'bg-white border-[#E5E7EB]' : 'bg-[#111827] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold truncate ${
                isLight ? 'text-[#6B7280]' : 'text-slate-400'
              }`}>
                {kpi.title}
              </span>
              <div className={`p-1 sm:p-1.5 rounded-lg ${kpi.bgColor} ${kpi.color} shrink-0`}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            <div>
              <div className={`text-xs sm:text-sm font-extrabold truncate font-mono ${
                isLight ? 'text-[#111827]' : 'text-white'
              }`}>
                {kpi.value}
              </div>
              <div className={`text-[10px] truncate mt-0.5 ${
                isLight ? 'text-[#6B7280]' : 'text-[#94A3B8]'
              }`}>
                {kpi.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
