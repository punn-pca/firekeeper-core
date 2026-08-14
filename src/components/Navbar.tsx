import React, { useState, useRef, useEffect } from 'react';
import { Flame, Brain, Database, BookOpen, MessageSquare, History, Activity, Landmark, ShieldAlert, ChevronDown, Sliders, Eye } from 'lucide-react';
import { useConversation } from '../context/ConversationContext';

interface NavbarProps {
  activeTab: 'chat' | 'pipeline' | 'memory' | 'docs' | 'diagnostic' | 'thai_context' | 'red_team';
  setActiveTab: (tab: 'chat' | 'pipeline' | 'memory' | 'docs' | 'diagnostic' | 'thai_context' | 'red_team') => void;
  memoryCount: number;
  onOpenExport: () => void;
  onOpenGlossary?: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, memoryCount, onOpenGlossary }) => {
  const { toggleDrawer, openDrawer } = useConversation();
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const workspaceCategories = [
    {
      category: 'Analyze',
      items: [
        { id: 'pipeline', label: '12-Stage Pipeline', icon: Brain, badge: null },
        { id: 'red_team', label: 'Red Team Lab', icon: ShieldAlert, badge: null },
      ]
    },
    {
      category: 'Knowledge',
      items: [
        { id: 'memory', label: 'Memory Bank', icon: Database, badge: memoryCount > 0 ? memoryCount : null },
        { id: 'thai_context', label: 'Thai Context Engine', icon: Landmark, badge: null },
      ]
    },
    {
      category: 'System',
      items: [
        { id: 'diagnostic', label: 'Diagnostics', icon: Activity, badge: null },
        { id: 'docs', label: 'Framework Spec', icon: BookOpen, badge: null },
      ]
    }
  ];

  const allWorkspaces = [
    { id: 'chat', label: 'Chat & Analysis', icon: MessageSquare, badge: null },
    ...workspaceCategories.flatMap(c => c.items)
  ];
  const currentWorkspace = allWorkspaces.find(w => w.id === activeTab) || allWorkspaces[0];
  const CurrentIcon = currentWorkspace.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(event.target as Node)) {
        setIsWorkspaceOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#07090D]/95 border-b border-[rgba(255,255,255,0.06)] text-[#F5F7FA]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[64px] gap-3">
          {/* Brand, History Drawer Button & PCA Status */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={toggleDrawer}
              type="button"
              title="เปิดประวัติการสนทนา"
              className="p-2 rounded-xl bg-[#0F131A] hover:bg-[#151B24] text-[#9AA5B1] hover:text-[#FF8A00] border border-[rgba(255,255,255,0.06)] transition-all flex items-center space-x-2 cursor-pointer group shrink-0"
            >
              <History className="w-4 h-4 text-[#FF8A00] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold hidden md:inline text-[#F5F7FA]">ประวัติ</span>
            </button>

            <div 
              className="flex items-center space-x-2.5 cursor-pointer group select-none shrink-0" 
              onClick={() => setActiveTab('chat')}
              title="FIRE KEEPER PCA"
            >
              <div className="relative shrink-0">
                <div className="absolute -inset-1 rounded-xl bg-[#FF8A00]/20 blur-sm group-hover:bg-[#FF8A00]/40 transition-all" />
                <div className="relative w-8 h-8 rounded-xl bg-[#FF8A00] flex items-center justify-center shadow-xs">
                  <Flame className="w-4 h-4 text-slate-950" />
                </div>
              </div>
              <div className="flex flex-col justify-center leading-tight">
                <span className="font-extrabold text-sm sm:text-base tracking-wider text-[#F5F7FA] group-hover:text-[#FF8A00] transition-colors whitespace-nowrap">
                  FIRE KEEPER
                </span>
                <span className="text-[10px] font-medium tracking-tight text-amber-400/90 hidden sm:block">
                  Executive Decision Intelligence Platform
                </span>
              </div>
            </div>

            {/* PCA Status Chip */}
            <div className="hidden xl:flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0F131A] border border-[rgba(255,255,255,0.06)] text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[#9AA5B1]">PUNN v2.0 • 12-Stage Verified</span>
            </div>
          </div>

          {/* Right Action Controls: Chat, Inspect, Strategy, Workspace Dropdown */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Dedicated Chat & Analysis Button */}
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs border ${
                activeTab === 'chat'
                  ? 'bg-[#FF8A00]/15 text-[#FF8A00] border-[#FF8A00]/40 font-bold'
                  : 'bg-[#0F131A] hover:bg-[#151B24] text-[#F5F7FA] border-[rgba(255,255,255,0.06)]'
              }`}
              title="สนทนาและวิเคราะห์ (Chat & Analysis)"
            >
              <MessageSquare className="w-4 h-4 text-[#FF8A00]" />
              <span className="hidden sm:inline">Chat</span>
            </button>

            {/* Inspect Button */}
            <button
              type="button"
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs border ${
                activeTab === 'pipeline'
                  ? 'bg-[#FF8A00]/15 text-[#FF8A00] border-[#FF8A00]/40 font-bold'
                  : 'bg-[#0F131A] hover:bg-[#151B24] text-[#F5F7FA] border-[rgba(255,255,255,0.06)]'
              }`}
              title="ตรวจสอบสเตจการประมวลผล (Inspect Pipeline)"
            >
              <Eye className="w-4 h-4 text-[#FF8A00]" />
              <span className="hidden sm:inline">Inspect</span>
            </button>

            {/* Strategy & Reasoning Button */}
            <button
              onClick={() => openDrawer('strategy')}
              type="button"
              title="ตั้งค่าโปรไฟล์ยุทธศาสตร์และระดับการประมวลผล"
              className="p-2 rounded-xl bg-[#0F131A] hover:bg-[#151B24] text-[#9AA5B1] hover:text-[#F5F7FA] border border-[rgba(255,255,255,0.06)] transition-all cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-[#FF8A00]" />
            </button>

            {/* Glossary (Plain Language Dictionary) Button */}
            {onOpenGlossary && (
              <button
                onClick={onOpenGlossary}
                type="button"
                title="คู่มืออธิบายคำศัพท์ทางเทคนิคและสถาปัตยกรรม (Glossary)"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#0F131A] hover:bg-[#151B24] text-[#9AA5B1] hover:text-[#FF8A00] border border-[rgba(255,255,255,0.06)] text-xs font-semibold transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#FF8A00]" />
                <span className="hidden lg:inline">คำศัพท์</span>
              </button>
            )}

            {/* Workspace Dropdown */}
            <div className="relative shrink-0" ref={workspaceRef}>
              <button
                onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
                type="button"
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#0F131A] hover:bg-[#151B24] text-[#F5F7FA] border border-[rgba(255,255,255,0.06)] text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs"
              >
                <CurrentIcon className="w-4 h-4 text-[#FF8A00]" />
                <span className="max-w-[120px] sm:max-w-none truncate">{currentWorkspace.label}</span>
                {currentWorkspace.badge !== null && (
                  <span className="px-1.5 py-0.2 text-[10px] font-mono rounded-full font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20">
                    {currentWorkspace.badge}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] transition-transform ${isWorkspaceOpen ? 'rotate-180' : ''}`} />
              </button>

              {isWorkspaceOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0F131A] border border-[rgba(255,255,255,0.08)] shadow-2xl py-2 z-50">
                  {workspaceCategories.map((cat, catIdx) => (
                    <div key={cat.category} className={catIdx > 0 ? 'mt-2 pt-2 border-t border-[rgba(255,255,255,0.05)]' : ''}>
                      <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6B7280] font-mono">
                        {cat.category}
                      </div>
                      {cat.items.map((w) => {
                        const Icon = w.icon;
                        const isSelected = activeTab === w.id;
                        return (
                          <button
                            key={w.id}
                            onClick={() => {
                              setActiveTab(w.id as any);
                              setIsWorkspaceOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#FF8A00]/10 text-[#FF8A00] font-bold'
                                : 'hover:bg-[#151B24] text-[#9AA5B1] hover:text-[#F5F7FA]'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <Icon className={`w-4 h-4 ${isSelected ? 'text-[#FF8A00]' : 'text-[#6B7280]'}`} />
                              <span>{w.label}</span>
                            </div>
                            {w.badge !== null && (
                              <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-full font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20">
                                {w.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};




