import React from 'react';
import { Flame, History, Share2, User, Command, Smartphone, Plus } from 'lucide-react';
import { useConversation } from '../context/การสนทนาContext';
import { useTheme } from '../context/ThemeContext';

interface MinimalHeaderProps {
  onOpenDrawer: () => void;
  onOpenAuth: () => void;
  isAuthenticated: boolean;
  onOpenShare?: () => void;
  onOpenแชร์?: () => void;
  onOpenDownloadApk?: () => void;
  userEmail?: string | null;
  onNavigateLanding?: () => void;
  onNewChat?: () => void;
}

export const MinimalHeader: React.FC<MinimalHeaderProps> = ({
  onOpenDrawer,
  onOpenAuth,
  isAuthenticated,
  onOpenShare,
  onOpenแชร์,
  onOpenDownloadApk,
  userEmail,
  onNavigateLanding,
  onNewChat,
}) => {
  const handleOpenShare = onOpenแชร์ || onOpenShare;
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
    <header className={`sticky top-0 z-40 w-full h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] sm:h-[calc(4.25rem+env(safe-area-inset-top))] border-b backdrop-blur-xl transition-colors ${surface}`}>
      <div className="h-full w-full max-w-[1600px] mx-auto px-2.5 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Navigation Drawer & History */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label="เปิดเมนูนำทาง"
            title="เมนูนำทาง"
            className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${control}`}
          >
            <span className="flex flex-col gap-1.5"><span className="block w-4 h-px bg-current" /><span className="block w-4 h-px bg-current" /><span className="block w-4 h-px bg-current" /></span>
          </button>
          <button
            type="button"
            onClick={() => openDrawer('history')}
            aria-label="เปิดประวัติการวิเคราะห์"
            title="ประวัติการวิเคราะห์"
            className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${control}`}
          >
            <History className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Center: Brand Identity */}
        <button
          type="button"
          onClick={onNavigateLanding}
          aria-label="กลับหน้าหลัก FIRE KEEPER"
          className="group flex items-center gap-1.5 sm:gap-2.5 shrink-0 select-none cursor-pointer hover:opacity-95 transition-all focus:outline-none"
        >
          <span className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg border border-amber-500/40 bg-amber-500/[0.08] flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.25)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all">
            <Flame className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-amber-500 animate-[fk-flame-motion_2.5s_infinite] group-hover:scale-110 transition-transform" />
          </span>
          <span className="font-mono font-black tracking-[0.15em] sm:tracking-[0.18em] text-sm sm:text-lg bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-amber-500 to-orange-600 drop-shadow-[0_0_12px_rgba(245,158,11,0.3)] group-hover:animate-fire-flicker">
            FIRE KEEPER
          </span>
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* ChatGPT-style New Chat Button */}
          {onNewChat && (
            <button
              type="button"
              onClick={onNewChat}
              aria-label="สร้างการสนทนาใหม่ (New Chat)"
              title="สร้างการสนทนาใหม่"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center transition-all cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 hover:text-amber-400 border border-amber-500/25 active:scale-95 shadow-2xs"
            >
              <Plus className="w-[18px] h-[18px]" />
            </button>
          )}

          {/* Download APK - only visible on Desktop Web */}
          {onOpenDownloadApk && (
            <button 
              type="button" 
              onClick={onOpenDownloadApk} 
              aria-label="ดาวน์โหลดแอพ Android (APK)" 
              title="ดาวน์โหลดแอพ Android (APK)" 
              className={`hidden sm:flex h-10 w-10 rounded-lg items-center justify-center transition-colors cursor-pointer ${control}`}
            >
              <Smartphone className="w-[18px] h-[18px] text-amber-500" />
            </button>
          )}

          {/* Share - hidden on mobile to keep bar clean */}
          <button
            type="button"
            onClick={handleOpenShare}
            aria-label="แชร์ผลการวิเคราะห์"
            title="แชร์"
            className={`hidden sm:flex h-10 w-10 rounded-lg items-center justify-center transition-colors cursor-pointer ${control}`}
          >
            <Share2 className="w-[18px] h-[18px]" />
          </button>

          {/* User Account / Sign In */}
          <button
            type="button"
            onClick={onOpenAuth}
            aria-label={isAuthenticated ? `บัญชี ${userEmail || 'ผู้ใช้'}` : 'เข้าสู่ระบบ'}
            title={isAuthenticated ? (userEmail || 'บัญชีผู้ใช้') : 'เข้าสู่ระบบ'}
            className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${control}`}
          >
            <User className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
};
