import React from 'react';
import {
  Home,
  Search,
  History,
  Layers,
  Shield,
  BookOpen,
  MoreVertical,
  Flame,
  User,
} from 'lucide-react';

export interface LeftSidebarProps {
  activeTab: string;
  onNavigateTab: (tab: string) => void;
  onOpenHistory: () => void;
  onOpenAuth: () => void;
  userEmail?: string | null;
  isAuthenticated: boolean;
  isLight?: boolean;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  onNavigateTab,
  onOpenHistory,
  onOpenAuth,
  userEmail,
  isAuthenticated,
  isLight = false,
}) => {
  const navItems = [
    { id: 'home', label: 'Home (หน้าหลัก)', icon: Home, onClick: () => onNavigateTab('home') },
    { id: 'chat', label: 'Analyze (วิเคราะห์)', icon: Search, onClick: () => onNavigateTab('chat') },
    { id: 'history', label: 'History (ประวัติ)', icon: History, onClick: onOpenHistory },
    { id: 'punn-pca', label: 'Architecture (สถาปัตยกรรม)', icon: Layers, onClick: () => onNavigateTab('punn-pca') },
    { id: 'privacy-terms', label: 'Governance (ธรรมาภิบาล)', icon: Shield, onClick: () => onNavigateTab('privacy-terms') },
    { id: 'docs', label: 'Resources (แหล่งข้อมูล)', icon: BookOpen, onClick: () => onNavigateTab('docs') },
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col justify-between w-60 xl:w-64 h-screen sticky top-0 shrink-0 border-r z-30 select-none ${
        isLight
          ? 'bg-slate-50/90 border-slate-200 text-slate-900'
          : 'bg-[#080d1a]/95 border-white/[0.07] text-slate-200'
      } backdrop-blur-md px-4 py-5 font-sans`}
    >
      {/* Top Brand Logo */}
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => onNavigateTab('home')}
          className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none w-full"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/30 border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.25)] group-hover:border-amber-400/60 transition-all">
            <Flame className="w-5 h-5 text-amber-500 animate-[fk-flame-motion_3s_ease-in-out_infinite]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm tracking-wider text-white flex items-center gap-1">
              <span>FIRE KEEPER</span>
            </div>
            <div className="text-[9px] font-medium text-slate-400 tracking-wider uppercase truncate">
              DECISIONS FOR A BETTER TOMORROW
            </div>
          </div>
        </button>

        {/* Navigation Items */}
        <nav className="space-y-1.5" aria-label="Main Sidebar Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? isLight
                      ? 'bg-amber-500/10 text-amber-600 font-semibold border border-amber-500/20'
                      : 'bg-white/[0.06] text-amber-400 font-semibold border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.12)]'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-amber-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="space-y-4 pt-4 border-t border-white/[0.06]">
        {/* Quote */}
        <div className="space-y-2 px-1">
          <div className="text-amber-400 font-serif text-2xl leading-none select-none">“</div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            Better decisions create a safer tomorrow.
          </p>
          <div className="text-[10px] text-slate-500">
            การตัดสินใจที่ดีกว่า สร้างวันพรุ่งนี้ที่ปลอดภัยกว่า
          </div>
          <div className="w-8 h-0.5 bg-amber-500/50 rounded-full" />
        </div>

        {/* System Status */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute opacity-75" />
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="flex items-center justify-between flex-1 text-[11px] font-mono">
            <span className="text-slate-400">PCA v3.0</span>
            <span className="text-emerald-400 font-medium">Operational</span>
          </div>
        </div>

        {/* User Profile */}
        <button
          type="button"
          onClick={onOpenAuth}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition-colors cursor-pointer group text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                {isAuthenticated ? (userEmail?.split('@')[0] || 'Punn') : 'Punn'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                Human in the Loop
              </div>
            </div>
          </div>
          <MoreVertical className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-slate-200" />
        </button>
      </div>
    </aside>
  );
};
