import React, { useState, useEffect } from 'react';
import { Flame, ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeroWelcomeCardProps {
  hasTurns?: boolean;
}

export const HeroWelcomeCard: React.FC<HeroWelcomeCardProps> = React.memo(({ hasTurns = false }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [isCollapsed, setIsCollapsed] = useState<boolean>(hasTurns);

  useEffect(() => {
    if (hasTurns) setIsCollapsed(true);
  }, [hasTurns]);

  if (isCollapsed) {
    return (
      <div className={`relative overflow-hidden rounded-lg border px-3 sm:px-4 py-2.5 shadow-sm flex items-center justify-between text-left transition-all ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#080808] border-white/[0.08]'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-md border border-amber-500/25 bg-amber-500/[0.08] flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="min-w-0 flex flex-wrap items-center gap-x-2">
            <span className={`font-semibold text-xs sm:text-sm font-mono uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>FIRE KEEPER</span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">Decision Intelligence & AI Governance</span>
          </div>
        </div>
        <button type="button" onClick={() => setIsCollapsed(false)} className={`px-2.5 py-1.5 rounded-md border text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-2 ${isLight ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 border-white/10'}`} title="แสดงรายละเอียด">
          <span>DETAILS</span><ChevronDown className="w-3 h-3 text-amber-500" />
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border p-4 shadow-sm text-left transition-all ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#080808] border-white/[0.08]'
    }`}>
      <button type="button" onClick={() => setIsCollapsed(true)} className={`absolute top-3 right-3 px-2 py-1 rounded-md border text-[9px] font-mono flex items-center gap-1 transition-colors cursor-pointer z-20 ${isLight ? 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200' : 'bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 border-white/10'}`} title="ย่อรายละเอียด">
        <span>COLLAPSE</span><ChevronUp className="w-3 h-3 text-amber-500" />
      </button>

      <div className="max-w-3xl mx-auto">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-md border border-amber-500/25 bg-amber-500/[0.08] flex items-center justify-center shrink-0 mt-0.5">
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="min-w-0 pr-16">
            <h1 className={`text-base sm:text-lg font-semibold tracking-tight font-mono uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>FIRE KEEPER</h1>
            <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              ชั้นการกำกับดูแลและปัญญาการตัดสินใจของ PUNN Cognitive Architecture — จัดโครงสร้างการให้เหตุผล การใช้หลักฐาน การจัดการความไม่แน่นอน และการกำกับโดยมนุษย์
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
