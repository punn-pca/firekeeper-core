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

export const MinimalHeader: React.FC<MinimalHeaderProps> = ({ onOpenDrawer, isAuthenticated, onOpenAuth, onOpenShare, userEmail, onNavigateLanding }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { openDrawer } = useConversation();

  return (
    <header 
      className={`sticky top-0 z-40 w-full py-2.5 sm:py-4 flex items-center justify-between border-b box-border ${
        isLight ? 'bg-white border-[#D9E0E8]' : 'bg-[#060A16] border-white/10'
      }`}
      style={{
        paddingLeft: 'clamp(12px, 3vw, 40px)',
        paddingRight: 'clamp(12px, 3vw, 40px)',
      }}
    >
        <div 
          className="flex items-center"
          style={{ gap: 'clamp(4px, 1.5vw, 16px)' }}
        >
            <button 
              onClick={onOpenDrawer} 
              className={`p-2 rounded-lg hover:bg-slate-500/10 transition-colors shrink-0 flex items-center justify-center ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
              title="เมนูนำทาง"
              style={{ minWidth: '40px', minHeight: '40px' }}
            >
                <div className="space-y-1">
                    <div className={`w-5 h-0.5 ${isLight ? 'bg-slate-600' : 'bg-slate-400'}`}></div>
                    <div className={`w-5 h-0.5 ${isLight ? 'bg-slate-600' : 'bg-slate-400'}`}></div>
                    <div className={`w-5 h-0.5 ${isLight ? 'bg-slate-600' : 'bg-slate-400'}`}></div>
                </div>
            </button>
            <button 
              onClick={() => openDrawer('history')} 
              className={`p-2 rounded-lg hover:bg-slate-500/10 transition-colors shrink-0 flex items-center justify-center ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`} 
              title="ประวัติการสนทนา"
              style={{ minWidth: '40px', minHeight: '40px' }}
            >
                <History className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
        </div>
        
        <button 
          onClick={onNavigateLanding}
          className="flex items-center gap-1.5 sm:gap-2 shrink-0 select-none cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
        >
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 shrink-0" />
            <span className={`font-mono font-bold tracking-tighter text-base sm:text-lg ${isLight ? 'text-[#172033]' : 'text-white'}`}>
              FIRE KEEPER
            </span>
        </button>
        
        <div 
          className="flex items-center"
          style={{ gap: 'clamp(4px, 1.5vw, 16px)' }}
        >
            <button 
              onClick={onOpenShare} 
              className={`p-2 rounded-lg hover:bg-slate-500/10 transition-colors shrink-0 flex items-center justify-center ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`} 
              title="แชร์"
              style={{ minWidth: '40px', minHeight: '40px' }}
            >
                <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button 
              onClick={onOpenAuth} 
              className={`p-2 rounded-lg hover:bg-slate-500/10 transition-colors shrink-0 flex items-center justify-center ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`} 
              title="บัญชีผู้ใช้"
              style={{ minWidth: '40px', minHeight: '40px' }}
            >
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
        </div>
    </header>
  );
};

