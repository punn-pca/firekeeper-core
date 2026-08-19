import React, { useState, useEffect } from 'react';
import { Flame, Brain, Database, ShieldCheck, ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';
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
              · Strategic AI Governance & Decision Intelligence
            </span>
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
          <span>[+ แสดงหลักการ]</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#F59E0B]" />
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 shadow-sm text-left transition-all ${
      isLight ? 'bg-white border-[#E5E7EB]' : 'bg-[#060A16] border-white/10'
    }`}>
      {/* Collapse Button Top Right */}
      <button
        type="button"
        onClick={() => setIsCollapsed(true)}
        className={`absolute top-3 right-3 px-2 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer z-20 ${
          isLight
            ? 'bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#111827] border-[#E5E7EB]'
            : 'bg-[#060A16]/80 hover:bg-[#1A2338] text-slate-400 hover:text-white border-white/10'
        }`}
        title="ย่อส่วนแสดงผล (Collapse Header)"
      >
        <span>[− ย่อ]</span>
        <ChevronUp className="w-3.5 h-3.5 text-[#F59E0B]" />
      </button>
      
      <div className="relative z-10 max-w-2xl mx-auto space-y-3">
        <div className="flex items-start space-x-3">
          {/* Floating Fire Icon */}
          <div className="relative shrink-0 mt-1">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-[#F59E0B] via-orange-600 to-amber-400 p-0.5 shadow-md flex items-center justify-center">
              <div className={`w-full h-full rounded-[6px] flex items-center justify-center ${
                isLight ? 'bg-white' : 'bg-[#060A16]'
              }`}>
                <Flame className="w-4 h-4 text-[#F59E0B]" />
              </div>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-0.5 min-w-0">
            <h1 className={`text-lg font-bold tracking-tight font-mono uppercase ${
              isLight ? 'text-[#111827]' : 'text-white'
            }`}>
              FIRE KEEPER
            </h1>
            <p className={`text-xs font-medium leading-relaxed ${
              isLight ? 'text-[#6B7280]' : 'text-[#94A3B8]'
            }`}>
              ระบบวิเคราะห์เชิงกลยุทธ์ผ่าน PCA - ฐานรากเหตุผลที่โปร่งใสและตรวจสอบได้
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

