import React from 'react';
import { Flame, History, Share2, User, Command } from 'lucide-react';
import { useConversation } from '../context/ConversationContext';
import { useTheme } from '../context/ThemeContext';

interface MinimalHeaderProps {
  onOpenDrawer: () => void;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  onOpenShare: () => void;
  userEmail?: string | null;
  onNavigateLanding?: () => void;
}

export const MinimalHeader: React.FC<MinimalHeaderProps> = ({
  onOpenDrawer,
  isAuthenticated,
  onOpenAuth,
  onOpenShare,
  userEmail,
  onNavigateLanding,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { openDrawer } = useConversation();

  const surface = isLight
    ? 'bg-white/90 border-slate-200/80 text-slate-900'
    : 'bg-[#070707]/90 border-white/[0.08] text-white';

  const control = isLight
    ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]';

  return (
    <header className={`sticky top-0 z-40 w-full h-16 sm:h-[68px] border-b backdrop-blur-xl transition-colors ${surface}`}>
      <div className="h-full w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button type="button" onClick={onOpenDrawer} aria-label="เปิดเมนูนำทาง" title="เมนูนำทาง" className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${control}`}>
            <span className="flex flex-col gap-1.5"><span className="block w-4 h-px bg-current" /><span className="block w-4 h-px bg-current" /><span className="block w-4 h-px bg-current" /></span>
          </button>
          <button type="button" onClick={() => openDrawer('history')} aria-label="เปิดประวัติการวิเคราะห์" title="ประวัติการวิเคราะห์" className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${control}`}>
            <History className="w-[18px] h-[18px]" />
          </button>
        </div>

        <button type="button" onClick={onNavigateLanding} aria-label="กลับหน้าหลัก FIRE KEEPER" className="flex items-center gap-2.5 shrink-0 select-none cursor-pointer hover:opacity-85 transition-opacity focus:outline-none">
          <span className="h-8 w-8 rounded-lg border border-amber-500/30 bg-amber-500/[0.08] flex items-center justify-center">
            <Flame className="w-[17px] h-[17px] text-amber-500" />
          </span>
          <span className="font-mono font-semibold tracking-[0.12em] text-sm sm:text-base">FIRE KEEPER</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="hidden md:flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-amber-500/20 bg-amber-500/[0.06] text-[10px] font-mono tracking-wider text-amber-500 uppercase">
            <Command className="w-3 h-3" />
            Decision Workspace
          </span>
          <button type="button" onClick={onOpenShare} aria-label="แชร์ผลการวิเคราะห์" title="แชร์" className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${control}`}>
            <Share2 className="w-[18px] h-[18px]" />
          </button>
          <button type="button" onClick={onOpenAuth} aria-label={isAuthenticated ? `บัญชี ${userEmail || 'ผู้ใช้'}` : 'เข้าสู่ระบบ'} title={isAuthenticated ? (userEmail || 'บัญชีผู้ใช้') : 'เข้าสู่ระบบ'} className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${control}`}>
            <User className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
};
