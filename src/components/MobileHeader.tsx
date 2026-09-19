import React from 'react';
import { Menu, Plus, Flame, Sliders } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useModel } from '../context/ModelContext';

interface MobileHeaderProps {
  onOpenDrawer: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onOpenDrawer,
  onNewChat,
  onOpenSettings,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { selectedModel } = useModel();

  return (
    <header className={`shrink-0 h-13 px-3 flex items-center justify-between border-b z-30 transition-colors ${
      isLight ? 'bg-white/95 border-slate-200' : 'bg-[#060a16]/95 border-white/10'
    } backdrop-blur-md`}>
      {/* Left: Menu Icon ☰ */}
      <button
        type="button"
        onClick={onOpenDrawer}
        className={`p-2 rounded-xl transition-colors cursor-pointer ${
          isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/10 text-slate-200'
        }`}
        title="เปิดเมนู"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Center: App Title & PCA v3.0 Engine Badge */}
      <div className="flex items-center gap-2 cursor-pointer select-none" onClick={onOpenSettings}>
        <Flame className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
        <span className="font-mono font-black text-sm tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
          FIREKEEPER
        </span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
          PCA v3.0
        </span>
      </div>

      {/* Right: New Chat Button ＋ */}
      <button
        type="button"
        onClick={onNewChat}
        className={`p-2 rounded-xl transition-colors cursor-pointer ${
          isLight ? 'hover:bg-slate-100 text-amber-600' : 'hover:bg-white/10 text-amber-400'
        }`}
        title="เริ่มการสนทนาใหม่"
      >
        <Plus className="w-5 h-5" />
      </button>
    </header>
  );
};
