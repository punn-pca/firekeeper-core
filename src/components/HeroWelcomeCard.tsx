import React, { useState, useEffect } from 'react';
import { Flame, Sparkles, Brain, ShieldAlert, Layers, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useModel } from '../context/ModelContext';

interface HeroWelcomeCardProps {
  hasTurns?: boolean;
  onSelectPrompt?: (prompt: string) => void;
}

const QUICK_DECISION_CARDS = [
  {
    id: 'decision-analysis',
    icon: Brain,
    title: 'วิเคราะห์การตัดสินใจลงทุน',
    subtitle: 'Trade-offs และผลตอบแทนเชิงกลยุทธ์',
    prompt: 'โปรดวิเคราะห์การตัดสินใจลงทุนโครงสร้างพื้นฐาน AI ข้ามภูมิภาค โดยประเมินความเสี่ยง ผลตอบแทน และข้อแลกเปลี่ยนทางกลยุทธ์ตามกรอบ PCA',
    color: 'text-amber-400',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/10',
  },
  {
    id: 'red-team',
    icon: ShieldAlert,
    title: 'Red Team Stress-Test',
    subtitle: 'จำลองจุดอ่อนและวิกฤตความเสี่ยง',
    prompt: 'ทำการจำลอง Red Team Stress-Test แผนงานโครงการสำคัญ เพื่อหาจุดอ่อนช่องโหว่ความเสี่ยงสูงสุดและแนวทางป้องกัน',
    color: 'text-rose-400',
    border: 'border-rose-500/20',
    bg: 'bg-rose-500/10',
  },
  {
    id: 'governance',
    icon: Layers,
    title: 'ธรรมาภิบาล ISO 42001 & RMF',
    subtitle: 'ตรวจสอบมาตรฐาน AI และความปลอดภัย',
    prompt: 'จัดทำแผนผัง Framework Mapping เชื่อมโยง ISO 42001, NIST AI RMF และสถาปัตยกรรมระบบองค์กรของ FIRE KEEPER',
    color: 'text-indigo-400',
    border: 'border-indigo-500/20',
    bg: 'bg-indigo-500/10',
  },
  {
    id: 'report-analysis',
    icon: FileText,
    title: 'วิเคราะห์รายงาน & ผลประกอบการ',
    subtitle: 'สังเคราะห์ข้อมูลตัวเลขและบทสรุปผู้บริหาร',
    prompt: 'โปรดสังเคราะห์และตรวจสอบความถูกต้องของรายงานผลประกอบการประจำไตรมาส พร้อมสกัดประเด็นสำคัญและข้อเสนอแนะระดับผู้บริหาร',
    color: 'text-sky-400',
    border: 'border-sky-500/20',
    bg: 'bg-sky-500/10',
  },
];

export const HeroWelcomeCard: React.FC<HeroWelcomeCardProps> = React.memo(({ hasTurns = false, onSelectPrompt }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { modelDetails } = useModel();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(hasTurns);

  useEffect(() => {
    if (hasTurns) setIsCollapsed(true);
  }, [hasTurns]);

  // When conversation turns exist, hide entirely on mobile to maximize chat visibility
  if (hasTurns) {
    if (isCollapsed) {
      return (
        <div className={`hidden sm:flex relative overflow-hidden rounded-lg border px-3 sm:px-4 py-2 shadow-xs items-center justify-between text-left transition-all ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#080808] border-white/[0.08]'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-md border border-amber-500/25 bg-amber-500/[0.08] flex items-center justify-center shrink-0">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="min-w-0 flex items-center gap-x-2">
              <span className={`font-semibold text-xs font-mono uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>FIRE KEEPER</span>
              <span className="text-[11px] text-slate-500">PUNN Cognitive Architecture v3.0</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className={`px-2 py-1 rounded-md border text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
              isLight ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 border-white/10'
            }`}
            title="แสดงรายละเอียด"
          >
            <span>DETAILS</span><ChevronDown className="w-3 h-3 text-amber-500" />
          </button>
        </div>
      );
    }
  }

  // ChatGPT-style Minimal Centered Welcome State
  return (
    <div className="flex flex-col items-center justify-center text-center py-6 sm:py-14 px-2 max-w-2xl mx-auto space-y-6 animate-fadeIn select-none">
      {/* Centered Glowing Flame Symbol */}
      <div className="relative group">
        <div className="absolute -inset-3 rounded-3xl bg-amber-500/20 blur-xl opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/20 via-[#0c1222] to-black flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)]">
          <Flame className="w-8 h-8 sm:w-9 sm:h-9 text-amber-500 animate-[fk-flame-motion_2.5s_infinite]" />
        </div>
      </div>

      {/* Brand Title & Executive Subtitle */}
      <div className="space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-mono font-black tracking-[0.18em] bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500">
          FIRE KEEPER
        </h1>
        <p className={`text-xs sm:text-sm font-sans max-w-md mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          PUNN Cognitive Architecture v3.0 · Executive Decision Intelligence & AI Governance
        </p>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-[10px] font-mono text-amber-400/90">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>{modelDetails.displayName}</span>
        </div>
      </div>

      {/* ChatGPT-style Quick Recommendation Chips (2x2 Grid) */}
      {onSelectPrompt && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 w-full pt-2">
          {QUICK_DECISION_CARDS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectPrompt(item.prompt)}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer group active:scale-98 ${
                  isLight
                    ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:border-amber-500/40'
                    : 'bg-[#080d1a]/80 hover:bg-[#0e1629] border-white/10 hover:border-amber-500/40 shadow-xs'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.bg} ${item.border} border ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-xs font-semibold group-hover:text-amber-400 transition-colors truncate ${
                    isLight ? 'text-slate-800' : 'text-slate-200'
                  }`}>
                    {item.title}
                  </div>
                  <div className={`text-[11px] truncate mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {item.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
