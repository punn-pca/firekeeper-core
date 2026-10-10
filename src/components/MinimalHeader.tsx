import React from 'react';
import { Flame, History, Share2, User } from 'lucide-react';
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
  planLabel?: string;
  isLanding?: boolean;
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
  planLabel,
  isLanding = false,
}) => {
  const handleOpenShare = onOpenแชร์ || onOpenShare;
  const handleOpenSettings = onOpenตั้งค่า || onOpenSettings;
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { openDrawer } = useConversation();

  const surface = isLight
    ? 'bg-white/85 border-black/[0.06] text-slate-900'
    : 'bg-[#111112]/82 border-white/[0.07] text-white';

  const control = isLight
    ? 'text-slate-600 hover:text-slate-950 hover:bg-black/[0.045]'
    : 'text-slate-400 hover:text-white hover:bg-white/[0.07]';

  return (
    <header className={`sticky top-0 z-40 w-full h-14 sm:h-16 border-b backdrop-blur-2xl transition-colors ${surface}`}>
      <div className="h-full w-full max-w-[1600px] mx-auto px-2 sm:px-6 lg:px-8 flex items-center justify-between gap-1 sm:gap-4">
        <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
          <button type="button" onClick={onOpenDrawer} aria-label="เปิดเมนูนำทาง" title="เมนูนำทาง" className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${control}`}>
            <span className="flex flex-col gap-[4px]"><span className="block w-[15px] h-px bg-current" /><span className="block w-[15px] h-px bg-current" /><span className="block w-[15px] h-px bg-current" /></span>
          </button>
          <button type="button" onClick={() => openDrawer('history')} aria-label="เปิดประวัติการวิเคราะห์" title="ประวัติการวิเคราะห์" className={`${isLanding ? 'hidden' : 'hidden sm:flex'} h-10 w-10 rounded-full items-center justify-center transition-colors cursor-pointer ${control}`}>
            <History className="w-[18px] h-[18px]" />
          </button>
        </div>

        <div className="flex min-w-0 items-center justify-center gap-1.5 sm:gap-2.5">
          <button type="button" onClick={onNavigateLanding} aria-label="ไปยังหน้าแชท FIREKEEPER" className="group flex min-w-0 items-center gap-1 sm:gap-2.5 shrink-0 select-none cursor-pointer hover:opacity-95 transition-all focus:outline-none">
            <span className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-amber-500/[0.09] flex items-center justify-center transition-colors group-hover:bg-amber-500/[0.14]">
              <Flame className="w-[17px] h-[17px] sm:w-[18px] sm:h-[18px] text-amber-500" />
            </span>
            <span className="font-sans font-semibold tracking-[0.055em] text-[12px] sm:text-[15px]">FIREKEEPER</span>
          </button>
          {planLabel && !isLanding && <span className="hidden md:inline-flex px-2.5 py-1 rounded-full bg-black/[0.045] dark:bg-white/[0.06] text-slate-500 dark:text-slate-300 text-[10px] font-medium whitespace-nowrap">{planLabel}</span>}
        </div>

        <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
          {isLanding && <button type="button" onClick={onNavigateLanding} className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-orange-400 sm:px-4 sm:text-sm">วิเคราะห์ฟรี</button>}
          <button type="button" onClick={handleOpenShare} aria-label="แชร์ผลการวิเคราะห์" title="แชร์" className={`${isLanding ? "hidden" : "hidden sm:flex"} h-10 w-10 rounded-full items-center justify-center transition-colors cursor-pointer ${control}`}>
            <Share2 className="w-[18px] h-[18px]" />
          </button>
          <button type="button" onClick={onOpenAuth} aria-label={isAuthenticated ? `บัญชี ${userEmail || 'ผู้ใช้'}` : 'เข้าสู่ระบบ'} title={isAuthenticated ? (userEmail || 'บัญชีผู้ใช้') : 'เข้าสู่ระบบ'} className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${control}`}>
            <User className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
};
