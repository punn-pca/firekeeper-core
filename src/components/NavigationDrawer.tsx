import React from 'react';
import { X, MessageSquare, Brain, Database, BookOpen, BarChart3, Flame, Sparkles, UserCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({ isOpen, onClose, activeTab, setActiveTab, isAdmin }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (!isOpen) return null;

  const menuItems = [
    { id: 'home', label: 'หน้าหลัก', icon: Flame },
    { id: 'chat', label: 'แชท & วิเคราะห์', icon: MessageSquare },
    { id: 'ai-passport', label: 'AI Passport Companion', icon: Sparkles, badge: 'NEW' },
    { id: 'about', label: 'เกี่ยวกับฉัน (About Punn)', icon: UserCheck, badge: 'FOUNDER' },
    { id: 'docs', label: 'Framework Spec', icon: BookOpen },
    { id: 'punn-pca', label: 'PUNN PCA (Architecture Spec)', icon: Brain, badge: 'CANONICAL' },
    { id: 'memory', label: 'Memory Bank', icon: Database },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Usage Dashboard', icon: BarChart3, badge: 'PRO' }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-fadeIn" 
      />

      {/* Sidebar Panel */}
      <div className={`relative w-84 sm:w-96 max-w-[90vw] h-full shadow-2xl flex flex-col z-10 transition-transform ${
        isLight ? 'bg-white border-r border-slate-200' : 'bg-[#060A16] border-r border-white/10'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 flex items-center justify-between border-b ${
          isLight ? 'border-slate-200' : 'border-white/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Flame className="w-4.5 h-4.5 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <h2 className={`font-bold text-sm tracking-wide ${isLight ? 'text-slate-950' : 'text-white'}`}>
                FIRE KEEPER
              </h2>
              <p className="text-[10px] font-mono text-amber-500 uppercase tracking-wider font-semibold">
                PUNN PCA v3.0
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="ปิดเมนู"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
          <div className="px-2 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Navigation Menu
          </div>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'ai-passport') {
                    window.location.href = '/ai-passport';
                    return;
                  }
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 text-left group cursor-pointer ${
                  isActive
                    ? (isLight 
                        ? 'bg-amber-500/15 text-amber-900 font-semibold border border-amber-500/30 shadow-xs' 
                        : 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/35 shadow-xs shadow-amber-500/10')
                    : (isLight 
                        ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/90 border border-transparent' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent')
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Icon className={`w-4.5 h-4.5 transition-colors ${
                      isActive 
                        ? (isLight ? 'text-amber-700' : 'text-amber-400') 
                        : (isLight ? 'text-slate-500 group-hover:text-slate-900' : 'text-slate-400 group-hover:text-slate-200')
                    }`} />
                  </div>
                  <span className="text-[14px] font-medium tracking-normal leading-normal whitespace-nowrap overflow-hidden text-ellipsis py-0.5">
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span className={`text-[9.5px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 font-bold border transition-colors ${
                    item.badge === 'FOUNDER'
                      ? (isLight 
                          ? 'bg-amber-100 text-amber-900 border-amber-300' 
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40')
                      : item.badge === 'CANONICAL'
                      ? (isLight 
                          ? 'bg-purple-100 text-purple-900 border-purple-300' 
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40')
                      : (isLight 
                          ? 'bg-slate-100 text-slate-700 border-slate-300' 
                          : 'bg-white/10 text-slate-200 border-white/20')
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className={`p-4 border-t text-xs font-mono flex items-center justify-between ${
          isLight ? 'border-slate-200 text-slate-600 bg-slate-50' : 'border-white/10 text-slate-400 bg-black/30'
        }`}>
          <span className="text-[11px] font-semibold">System Status</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            PCA ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
};
