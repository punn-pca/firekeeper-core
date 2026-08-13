import React, { useState, useEffect } from 'react';
import { Flame, Brain, Database, ShieldCheck, ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getThemeTokens } from '../utils/themeTokens';

interface HeroWelcomeCardProps {
  hasTurns?: boolean;
}

export const HeroWelcomeCard: React.FC<HeroWelcomeCardProps> = React.memo(({ hasTurns = false }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  // Auto-collapse when there are active turns, but allow manual toggle
  const [isCollapsed, setIsCollapsed] = useState<boolean>(hasTurns);

  useEffect(() => {
    if (hasTurns) {
      setIsCollapsed(true);
    }
  }, [hasTurns]);

  if (isCollapsed) {
    return (
      <div className={`relative overflow-hidden rounded-xl border px-3 sm:px-4 py-2 shadow-sm flex items-center justify-between text-left transition-all ${
        isLight ? 'bg-white border-[#E5E7EB]' : 'bg-[#0E1525] border-white/10'
      }`}>
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#F59E0B] via-orange-600 to-amber-400 p-0.5 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className={`font-extrabold text-xs sm:text-sm font-mono uppercase tracking-wider ${
              isLight ? 'text-[#111827]' : 'text-white'
            }`}>
              FIRE KEEPER
            </span>
            <span className={`text-[11px] font-medium hidden sm:inline ${
              isLight ? 'text-[#6B7280]' : 'text-[#94A3B8]'
            }`}>
              · PUNN Cognitive Architecture v2.0
            </span>
            <div className="hidden lg:flex items-center gap-1.5 ml-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-md border font-mono ${
                isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-[#060A16] border-slate-700/80 text-emerald-400'
              }`}>
                ✓ Long-term Memory
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md border font-mono ${
                isLight
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-[#060A16] border-slate-700/80 text-[#FF8A00]'
              }`}>
                ✓ 12-Stage Matrix
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shrink-0 ml-2 ${
            isLight
              ? 'bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] border-[#E5E7EB]'
              : 'bg-[#1A2338] hover:bg-[#253352] text-slate-300 hover:text-white border-white/10'
          }`}
          title="ขยายแสดงข้อมูลสถาปัตยกรรมระบบ (Expand Hero Banner)"
        >
          <span>[+ Show Header]</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#F59E0B]" />
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-3.5 sm:p-5 shadow-sm text-center transition-all ${
      isLight ? 'bg-white border-[#E5E7EB]' : 'bg-[#0E1525] border-white/10 bg-grid-pattern'
    }`}>
      {/* Background ambient radial gradients */}
      {!isLight && (
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-gradient-to-b from-[#FF8A00]/15 via-[#7C5CFF]/10 to-transparent blur-2xl pointer-events-none" />
      )}

      {/* Collapse Button Top Right */}
      <button
        type="button"
        onClick={() => setIsCollapsed(true)}
        className={`absolute top-2.5 right-2.5 px-2 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer z-20 ${
          isLight
            ? 'bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#111827] border-[#E5E7EB]'
            : 'bg-[#060A16]/80 hover:bg-[#1A2338] text-slate-400 hover:text-white border-white/10'
        }`}
        title="ย่อส่วนแสดงผลส่วนหัวเพื่อเพิ่มพื้นที่หน้าจอ (Collapse Header)"
      >
        <span>[− Compact]</span>
        <ChevronUp className="w-3.5 h-3.5 text-[#F59E0B]" />
      </button>
      
      <div className="relative z-10 max-w-xl mx-auto space-y-2.5">
        {/* Animated Floating Fire Icon */}
        <div className="relative inline-block">
          <div className="absolute -inset-2 rounded-full bg-[#F59E0B]/25 blur-lg animate-pulse-glow" />
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-[#F59E0B] via-orange-600 to-amber-400 p-0.5 shadow-xl mx-auto flex items-center justify-center">
            <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${
              isLight ? 'bg-white' : 'bg-[#060A16]/80 backdrop-blur-md'
            }`}>
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-[#F59E0B] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Title and Subtitle */}
        <div className="space-y-1">
          <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight font-mono uppercase ${
            isLight ? 'text-[#111827]' : 'text-white'
          }`}>
            FIRE KEEPER
          </h1>
          <p className={`text-xs sm:text-sm font-medium leading-relaxed max-w-lg mx-auto ${
            isLight ? 'text-[#6B7280]' : 'text-[#94A3B8]'
          }`}>
            PUNN Cognitive Architecture v2.0 · Executive AI Operating System
          </p>
        </div>

        {/* Feature Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
          <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold shadow-2xs ${
            isLight ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827]' : 'bg-[#060A16]/80 border-white/10 text-slate-200'
          }`}>
            <Database className="w-3 h-3 text-emerald-600 dark:text-[#35D07F]" />
            <span>✓ Long-term Memory</span>
          </div>

          <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold shadow-2xs ${
            isLight ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827]' : 'bg-[#060A16]/80 border-white/10 text-slate-200'
          }`}>
            <Brain className="w-3 h-3 text-[#F59E0B]" />
            <span>✓ PCA 12 Stage</span>
          </div>

          <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold shadow-2xs ${
            isLight ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827]' : 'bg-[#060A16]/80 border-white/10 text-slate-200'
          }`}>
            <ShieldCheck className="w-3 h-3 text-purple-600 dark:text-[#7C5CFF]" />
            <span>✓ Strategic Reasoning</span>
          </div>
        </div>
      </div>
    </div>
  );
});
