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
    <div className={`relative overflow-hidden rounded-2xl border p-4 sm:p-6 shadow-sm text-left transition-all ${
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
      
      <div className="relative z-10 max-w-2xl mx-auto space-y-3.5">
        <div className="flex items-start space-x-3.5">
          {/* Floating Fire Icon */}
          <div className="relative shrink-0 mt-1">
            <div className="absolute -inset-2 rounded-full bg-[#F59E0B]/25 blur-lg animate-pulse-glow" />
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-[#F59E0B] via-orange-600 to-amber-400 p-0.5 shadow-xl flex items-center justify-center">
              <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${
                isLight ? 'bg-white' : 'bg-[#060A16]/80 backdrop-blur-md'
              }`}>
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-[#F59E0B] animate-pulse" />
              </div>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400/90 text-[10px] font-mono tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Strategic AI Governance & Decision Intelligence</span>
            </div>
            <h1 className={`text-xl sm:text-2xl font-black tracking-tight font-mono uppercase ${
              isLight ? 'text-[#111827]' : 'text-white'
            }`}>
              FIRE KEEPER
            </h1>
            <p className={`text-xs sm:text-sm font-medium leading-relaxed ${
              isLight ? 'text-[#6B7280]' : 'text-[#94A3B8]'
            }`}>
              ระบบวิเคราะห์เชิงกลยุทธ์ภายใต้ PUNN Cognitive Architecture (PCA) ออกแบบมาเพื่อช่วยผู้บริหารและผู้ตัดสินใจมองเห็นโครงสร้างของปัญหา ความเสี่ยง สมมติฐาน และทางเลือกก่อนตัดสินใจ
            </p>
          </div>
        </div>

        {/* Core Principles Box */}
        <div className={`rounded-xl p-3 sm:p-4 border text-xs sm:text-sm space-y-2 ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#060A16]/60 border-white/10 text-slate-300'
        }`}>
          <div className="font-semibold text-amber-500 font-mono text-xs uppercase tracking-wide flex items-center gap-1.5">
            <span>🛡️ หลักการตอบสนอง (Governance Principles)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5 text-[11px] sm:text-xs">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>แยกข้อเท็จจริงออกจากสมมติฐาน</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>ระบุข้อมูลที่ยังไม่เพียงพอ</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>วิเคราะห์ความเสี่ยงและผลกระทบ</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>เสนอทางเลือกโดยไม่บังคับการตัดสินใจ</span>
            </div>
          </div>
          <div className="pt-1 border-t border-slate-700/30 text-[11px] text-amber-400/90 font-medium italic">
            * FIRE KEEPER ไม่ได้ตัดสินใจแทนมนุษย์ แต่ทำหน้าที่ตรวจสอบ วิเคราะห์ และทำให้เหตุผลเบื้องหลังคำแนะนำสามารถตรวจสอบได้ (Human Agency First)
          </div>
        </div>
      </div>
    </div>
  );
});

