import React, { useState, useEffect } from 'react';
import { Flame, ChevronUp, ChevronDown, BookOpen } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeroWelcomeCardProps {
  hasTurns?: boolean;
  onNavigateBooks?: () => void;
}

export const HeroWelcomeCard: React.FC<HeroWelcomeCardProps> = React.memo(({ hasTurns = false, onNavigateBooks }) => {
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
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {onNavigateBooks && (
            <button
              type="button"
              onClick={onNavigateBooks}
              className={`px-2 py-1 rounded-md border text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20`}
              title="หนังสือ & ผลงานสิ่งพิมพ์"
            >
              <BookOpen className="w-3 h-3 text-amber-500" />
              <span>หนังสือ</span>
            </button>
          )}
          <button type="button" onClick={() => setIsCollapsed(false)} className={`px-2.5 py-1.5 rounded-md border text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${isLight ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 border-white/10'}`} title="แสดงรายละเอียด">
            <span>DETAILS</span><ChevronDown className="w-3 h-3 text-amber-500" />
          </button>
        </div>
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
            <div className={`text-xs mt-2 space-y-1 font-medium leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <p className="font-semibold text-amber-500">คิดให้ลึกซึ้ง • ตัดสินใจให้ปลอดภัย</p>
              <p>ระบบวิเคราะห์เชิงประจักษ์เพื่อการตัดสินใจระดับยุทธศาสตร์</p>
              <p className="text-[10px] font-mono tracking-widest text-amber-400 uppercase pt-0.5">POWERED BY PUNN PCA V3.0 ARCHITECTURE</p>
              {onNavigateBooks && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onNavigateBooks}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                    <span>อ่านหนังสือ & ผลงานสิ่งพิมพ์ (Firekeeper Theory Book)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
