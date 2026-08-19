import React from 'react';
import { X, MessageSquare, Brain, Sparkles, Database, BookOpen, BarChart3, Sliders, ShieldCheck, BookOpen as GlossaryIcon, Share2, Flame } from 'lucide-react';
import { useConversation } from '../context/ConversationContext';
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
    { id: 'home', label: 'Home', icon: Flame },
    { id: 'chat', label: 'แชท & วิเคราะห์', icon: MessageSquare },
    { id: 'pipeline', label: '12-Stage Pipeline', icon: Brain },
    { id: 'social_agency', label: 'Social Agency Lab', icon: Sparkles },
    { id: 'memory', label: 'Memory Bank', icon: Database },
    { id: 'docs', label: 'Framework Spec', icon: BookOpen },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Analytics', icon: BarChart3 }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
      <div className={`relative w-80 max-w-[90vw] h-full shadow-2xl flex flex-col ${
        isLight ? 'bg-white' : 'bg-[#060A16]'
      }`}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <h2 className={`font-bold ${isLight ? 'text-black' : 'text-white'}`}>MENU</h2>
          <button onClick={onClose} className="p-2 text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); onClose(); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                        activeTab === item.id 
                        ? 'bg-amber-500/20 text-amber-500' 
                        : (isLight ? 'text-slate-700' : 'text-slate-300')
                    }`}
                >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                </button>
            ))}
        </nav>
      </div>
    </div>
  );
};
