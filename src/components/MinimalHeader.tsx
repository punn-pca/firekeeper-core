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
}

export const MinimalHeader: React.FC<MinimalHeaderProps> = ({ onOpenDrawer, isAuthenticated, onOpenAuth, onOpenShare, userEmail }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { openDrawer } = useConversation();

  return (
    <header className={`sticky top-0 z-40 w-full p-4 flex items-center justify-between ${
        isLight ? 'bg-white' : 'bg-[#060A16]'
    }`}>
        <div className="flex items-center gap-1">
            <button onClick={onOpenDrawer} className="p-2 text-slate-400">
                <div className="space-y-1">
                    <div className="w-5 h-0.5 bg-slate-400"></div>
                    <div className="w-5 h-0.5 bg-slate-400"></div>
                    <div className="w-5 h-0.5 bg-slate-400"></div>
                </div>
            </button>
            <button onClick={() => openDrawer('history')} className="p-2 text-slate-400">
                <History className="w-6 h-6" />
            </button>
        </div>
        <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-500" />
            <span className={`font-mono font-bold tracking-tighter text-lg ${isLight ? 'text-black' : 'text-white'}`}>FIRE KEEPER</span>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={onOpenShare} className="p-2 text-slate-400">
                <Share2 className="w-6 h-6" />
            </button>
            <button onClick={onOpenAuth} className="p-2 text-slate-400">
                <User className="w-6 h-6" />
            </button>
        </div>
    </header>
  );
};
