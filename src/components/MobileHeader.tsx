import React from 'react';
import { Flame, Plus, User, History } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useConversation } from '../context/การสนทนาContext';

interface MobileHeaderProps {
  onOpenDrawer: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenAuth?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onOpenDrawer,
  onNewChat,
  onOpenSettings,
  onOpenAuth,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { openDrawer } = useConversation();

  const surface = isLight
    ? 'bg-white/95 border-slate-200 text-slate-900'
    : 'bg-[#070707]/95 border-white/[0.08] text-white';

  const control = isLight
    ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]';

  return (
    <header className={`shrink-0 h-14 w-full border-b backdrop-blur-xl transition-colors ${surface} z-30`}>
      <div className="h-full w-full px-2.5 sm:px-4 flex items-center justify-between gap-2">
        {/* Left Controls: Hamburger Menu ☰ + History Button */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label="เปิดเมนูนำทาง"
            title="เมนูนำทาง"
            className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${control}`}
          >
            <span className="flex flex-col gap-1.5">
              <span className="block w-4 h-px bg-current" />
              <span className="block w-4 h-px bg-current" />
              <span className="block w-4 h-px bg-current" />
            </span>
          </button>
          <button
            type="button"
            onClick={() => openDrawer('history')}
            aria-label="ประวัติการสนทนา"
            title="ประวัติการสนทนา"
            className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${control}`}
          >
            <History className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Center: Glowing Flame Box Logo + FIRE KEEPER + PCA v3.0 Badge */}
        <div
          className="group flex items-center gap-2 shrink-0 select-none cursor-pointer"
          onClick={onOpenSettings}
        >
          <span className="h-8 w-8 rounded-lg border border-amber-500/40 bg-amber-500/[0.08] flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.25)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all">
            <Flame className="w-[18px] h-[18px] text-amber-500 animate-[fk-flame-motion_2.5s_infinite] group-hover:scale-110 transition-transform" />
          </span>
          <span className="font-mono font-black tracking-[0.18em] text-sm bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-amber-500 to-orange-600 drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            FIRE KEEPER
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase font-semibold">
            PCA v3.0
          </span>
        </div>

        {/* Right Controls: New Chat ＋ + User Account */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onNewChat}
            aria-label="เริ่มการสนทนาใหม่"
            title="เริ่มการสนทนาใหม่"
            className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isLight ? 'text-amber-600 hover:bg-amber-50' : 'text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <Plus className="w-5 h-5" />
          </button>
          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              aria-label="เข้าสู่ระบบ / บัญชีผู้ใช้"
              title="เข้าสู่ระบบ / บัญชีผู้ใช้"
              className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${control}`}
            >
              <User className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

