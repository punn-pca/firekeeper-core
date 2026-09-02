import React, { useState } from 'react';
import { Flame, Brain, BookOpen, MessageSquare, History, Activity, Landmark, ShieldAlert, Sparkles, X, LogIn, User, BarChart3, Sliders, ShieldCheck, Share2 } from 'lucide-react';
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

  return (
    <header 
      className={`sticky top-0 z-40 w-full py-3 sm:py-4 flex items-center justify-between border-b box-border transition-colors ${
        isLight ? 'bg-white/95 backdrop-blur-md border-[#D9E0E8]' : 'bg-[#060A16]/95 backdrop-blur-md border-white/10'
      }`}
      style={{
        paddingLeft: 'clamp(16px, 3.5vw, 48px)',
        paddingRight: 'clamp(16px, 3.5vw, 48px)',
      }}
    >
        <div 
          className="flex items-center"
          style={{ gap: 'clamp(8px, 1.8vw, 20px)' }}
        >
            <button 
              onClick={onOpenDrawer} 
              className={`p-2.5 rounded-xl hover:bg-slate-500/10 transition-colors shrink-0 flex items-center justify-center cursor-pointer ${isLight ? 'text-slate-700 hover:text-slate-900' : 'text-slate-300 hover:text-white'}`}
              title="เมนูนำทาง"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
                <div className="space-y-1.5">
                    <div className={`w-5 h-0.5 rounded-full ${isLight ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                    <div className={`w-5 h-0.5 rounded-full ${isLight ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                    <div className={`w-5 h-0.5 rounded-full ${isLight ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                </div>
            </button>
            <button 
              onClick={() => openDrawer('history')} 
              className={`p-2.5 rounded-xl hover:bg-slate-500/10 transition-colors shrink-0 flex items-center justify-center cursor-pointer ${isLight ? 'text-slate-700 hover:text-slate-900' : 'text-slate-300 hover:text-white'}`} 
              title="ประวัติการสนทนา"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
                <History className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
        </div>
        
        <button 
          onClick={onNavigateLanding}
          className="flex items-center gap-2 sm:gap-2.5 shrink-0 select-none cursor-pointer hover:opacity-85 transition-opacity focus:outline-none"
        >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-amber-500 shrink-0" />
            </div>
            <span className={`font-mono font-bold tracking-tight text-lg sm:text-xl md:text-2xl ${isLight ? 'text-[#111827]' : 'text-white'}`}>
              FIRE KEEPER
            </span>
        </button>
        
        <div 
          className="flex items-center"
          style={{ gap: 'clamp(8px, 1.8vw, 20px)' }}
        >
            <button 
              onClick={onOpenShare} 
              className={`p-2.5 rounded-xl hover:bg-slate-500/10 transition-colors shrink-0 flex items-center justify-center cursor-pointer ${isLight ? 'text-slate-700 hover:text-slate-900' : 'text-slate-300 hover:text-white'}`} 
              title="แชร์"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
                <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button 
              onClick={onOpenAuth} 
              className={`p-2.5 rounded-xl hover:bg-slate-500/10 transition-colors shrink-0 flex items-center justify-center cursor-pointer ${isLight ? 'text-slate-700 hover:text-slate-900' : 'text-slate-300 hover:text-white'}`} 
              title="บัญชีผู้ใช้"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
        </div>
    </header>
  );
};

