import React from 'react';
import { Flame, History, Share2, User, Settings2 } from 'lucide-react';
import { useConversation } from '../context/การสนทนาContext';
import { useTheme } from '../context/ThemeContext';

interface MinimalHeaderProps {
  onOpenDrawer: () => void;
  onOpenAuth: () => void;
  isAuthenticated: boolean;
  onOpenSettings?: () => void;
  onOpenตั้งค่า?: () => void;
  onOpenShare?: () => void;
  onOpenแชร์?: () => void;
  userEmail?: string | null;
  onNavigateLanding?: () => void;
}

export const MinimalHeader: React.FC<MinimalHeaderProps> = ({
  onOpenDrawer,
  onOpenAuth,
  isAuthenticated,
  onOpenSettings,
  onOpenตั้งค่า,
  onOpenShare,
  onOpenแชร์,
  userEmail,
  onNavigateLanding,
}) => {
  const handleOpenShare = onOpenแชร์ || onOpenShare;
  const handleOpenSettings = onOpenตั้งค่า || onOpenSettings;
  // ...
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
    <header className={`sticky top-0 z-40 w-full h-14 sm:h-[68px] border-b backdrop-blur-xl transition-colors ${surface}`}>
      <div className="h-full w-full max-w-[1600px] mx-auto px-2.5 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-0.5 sm:gap-2">
          <button type="button" onClick={onOpenDrawer} aria-label="เปิดเมนูนำทาง" title="เมนูนำทาง" className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${control}`}>
            <span className="flex flex-col gap-1.5"><span className="block w-4 h-px bg-current" /><span className="block w-4 h-px bg-current" /><span className="block w-4 h-px bg-current" /></span>
          </button>
          <button type="button" onClick={() => openDrawer('history')} aria-label="เปิดประวัติการวิเคราะห์" title="ประวัติการวิเคราะห์" className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${control}`}>
            <History className="w-[18px] h-[18px]" />
          </button>
        </div>

        <button type="button" onClick={onNavigateLanding} aria-label="กลับหน้าหลัก FIRE KEEPER" className="group flex items-center gap-1.5 sm:gap-2.5 shrink-0 select-none cursor-pointer hover:opacity-95 transition-all focus:outline-none">
          <span className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg border border-amber-500/40 bg-amber-500/[0.08] flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.25)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all">
            <Flame className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-amber-500 animate-[fk-flame-motion_2.5s_infinite] group-hover:scale-110 transition-transform" />
          </span>
          <span className="font-mono font-black tracking-[0.18em] text-sm sm:text-lg bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-amber-500 to-orange-600 drop-shadow-[0_0_12px_rgba(245,158,11,0.3)] group-hover:animate-fire-flicker">FIRE KEEPER</span>
        </button>


        <div className="flex items-center gap-1 sm:gap-1.5">
          <button type="button" onClick={handleOpenShare} aria-label="แชร์ผลการวิเคราะห์" title="แชร์" className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${control}`}>
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
