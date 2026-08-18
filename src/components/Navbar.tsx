import React, { useState, useRef, useEffect } from 'react';
import { Flame, Brain, Database, BookOpen, MessageSquare, History, Activity, Landmark, ShieldAlert, ChevronDown, Sliders, Eye, ShieldCheck, Share2, User, MoreHorizontal, BarChart3, Sparkles } from 'lucide-react';
import { useConversation } from '../context/ConversationContext';

export type NavTabType = 'chat' | 'pipeline' | 'memory' | 'docs' | 'admin' | 'social_agency';

interface NavbarProps {
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
  memoryCount: number;
  onOpenExport: () => void;
  onOpenGlossary?: () => void;
  onOpenSettings?: () => void;
  onOpenTrustCenter?: (tab?: 'about' | 'privacy' | 'terms' | 'contact') => void;
  onOpenShare?: () => void;
  onOpenAuth?: () => void;
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  userEmail?: string | null;
}

interface WorkspaceItem {
  id: NavTabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string | number | null;
}

interface WorkspaceCategory {
  category: string;
  items: WorkspaceItem[];
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  memoryCount, 
  onOpenGlossary,
  onOpenTrustCenter,
  onOpenShare,
  onOpenAuth,
  isAuthenticated = false,
  isAdmin = false,
  userEmail = null,
}) => {
  const { toggleDrawer, openDrawer } = useConversation();
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const workspaceCategories: WorkspaceCategory[] = [
    {
      category: 'Analyze',
      items: [
        { id: 'pipeline', label: '12-Stage Pipeline', icon: Brain, badge: null },
        { id: 'social_agency', label: 'Social Agency Lab', icon: Sparkles, badge: 'NEW' },
      ]
    },
    {
      category: 'Knowledge',
      items: [
        { id: 'memory', label: 'Memory Bank', icon: Database, badge: memoryCount > 0 ? memoryCount : null },
      ]
    },
    {
      category: 'System',
      items: [
        { id: 'docs', label: 'Framework Spec', icon: BookOpen, badge: null },
        ...(isAdmin ? [{ id: 'admin' as NavTabType, label: 'Admin Analytics', icon: BarChart3, badge: 'PRO' }] : []),
      ]
    }
  ];

  const allWorkspaces: WorkspaceItem[] = [
    { id: 'chat', label: 'แชท & วิเคราะห์', icon: MessageSquare, badge: null },
    ...workspaceCategories.flatMap(c => c.items)
  ];
  const currentWorkspace = allWorkspaces.find(w => w.id === activeTab) || allWorkspaces[0];
  const CurrentIcon = currentWorkspace.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(event.target as Node)) {
        setIsWorkspaceOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-[100] backdrop-blur-md bg-[#07090D]/95 border-b border-white/10 text-[#F5F7FA] w-full max-w-full">
      <div className="max-w-[1536px] mx-auto px-2.5 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-[52px] sm:h-[60px] gap-1.5 sm:gap-3">
          {/* Left Brand & History */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0 min-w-0">
            <button
              onClick={toggleDrawer}
              type="button"
              title="ประวัติการสนทนา (Session History)"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0F131A] hover:bg-[#151B24] text-[#9AA5B1] hover:text-[#FF8A00] border border-white/10 transition-all flex items-center justify-center cursor-pointer group shrink-0"
            >
              <History className="w-4 h-4 text-[#FF8A00] group-hover:scale-110 transition-transform" />
            </button>

            <div 
              className="flex items-center space-x-2 cursor-pointer group select-none shrink-0" 
              onClick={() => setActiveTab('chat')}
              title="FIRE KEEPER · Executive Decision Intelligence Platform"
            >
              <div className="relative shrink-0">
                <div className="absolute -inset-1 rounded-xl bg-[#FF8A00]/20 blur-sm group-hover:bg-[#FF8A00]/40 transition-all" />
                <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-[#FF8A00] to-[#FF6B00] flex items-center justify-center shadow-xs">
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 stroke-[2.5]" />
                </div>
              </div>
              <div className="flex flex-col justify-center leading-tight">
                <div className="flex items-center space-x-1">
                  <span className="font-black text-xs sm:text-sm tracking-wider text-[#F5F7FA] group-hover:text-[#FF8A00] transition-colors whitespace-nowrap font-mono">
                    FIRE KEEPER
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 hidden xs:inline">
                    PUNN v2.0
                  </span>
                </div>
                <span className="text-[9px] font-medium tracking-tight text-slate-400 hidden sm:block">
                  Executive Intelligence OS
                </span>
              </div>
            </div>
          </div>

          {/* Right Minimalist Controls & Auth */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Chat Tab - Desktop & Tablet */}
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                activeTab === 'chat'
                  ? 'bg-[#FF8A00]/15 text-[#FF8A00] border-[#FF8A00]/40 font-bold'
                  : 'bg-[#0F131A] hover:bg-[#151B24] text-[#F5F7FA] border-white/10'
              }`}
              title="Chat & Strategic Analysis"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#FF8A00]" />
              <span>Chat</span>
            </button>

            {/* Inspect Pipeline - Desktop & Tablet */}
            <button
              type="button"
              onClick={() => setActiveTab('pipeline')}
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                activeTab === 'pipeline'
                  ? 'bg-[#FF8A00]/15 text-[#FF8A00] border-[#FF8A00]/40 font-bold'
                  : 'bg-[#0F131A] hover:bg-[#151B24] text-[#F5F7FA] border-white/10'
              }`}
              title="Inspect 12-Stage Pipeline"
            >
              <Eye className="w-3.5 h-3.5 text-[#FF8A00]" />
              <span>Inspect</span>
            </button>

            {/* Workspace Dropdown (Compact on Mobile, Full on Desktop) */}
            <div className="relative shrink-0" ref={workspaceRef}>
              <button
                onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
                type="button"
                className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-[#0F131A] hover:bg-[#151B24] text-[#F5F7FA] border border-white/10 text-xs font-semibold transition-all cursor-pointer shadow-xs min-h-[34px] sm:min-h-[36px]"
                title="Workspace Navigation"
              >
                <CurrentIcon className="w-3.5 h-3.5 text-[#FF8A00] shrink-0" />
                <span className="max-w-[100px] sm:max-w-[140px] truncate text-[11px] sm:text-xs">
                  {currentWorkspace.label}
                </span>
                {currentWorkspace.badge !== null && (
                  <span className="px-1 py-0.2 text-[8px] sm:text-[9px] font-mono rounded-full font-bold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 shrink-0">
                    {currentWorkspace.badge}
                  </span>
                )}
                <ChevronDown className={`w-3 h-3 text-[#9AA5B1] transition-transform shrink-0 ${isWorkspaceOpen ? 'rotate-180' : ''}`} />
              </button>

              {isWorkspaceOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0F131A] border border-white/15 shadow-2xl py-2 z-[110] animate-fadeIn">
                  {workspaceCategories.map((cat, catIdx) => (
                    <div key={cat.category} className={catIdx > 0 ? 'mt-1.5 pt-1.5 border-t border-white/10' : ''}>
                      <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
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
                            className={`w-full flex items-center justify-between px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#FF8A00]/15 text-[#FF8A00] font-bold'
                                : 'hover:bg-[#151B24] text-[#9AA5B1] hover:text-[#F5F7FA]'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#FF8A00]' : 'text-slate-400'}`} />
                              <span>{w.label}</span>
                            </div>
                            {w.badge !== null && (
                              <span className="px-1.5 py-0.2 text-[9px] font-mono rounded-full font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20">
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

            {/* Minimalist More Menu (Strategy, Trust, Glossary, Share) */}
            <div className="relative shrink-0" ref={moreRef}>
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                type="button"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0F131A] hover:bg-[#151B24] text-[#9AA5B1] hover:text-[#F5F7FA] border border-white/10 transition-all flex items-center justify-center cursor-pointer"
                title="เครื่องมือเพิ่มเติม (More Options)"
              >
                <MoreHorizontal className="w-4 h-4 text-[#FF8A00]" />
              </button>

              {isMoreOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0F131A] border border-white/15 shadow-2xl py-1.5 z-[110] animate-fadeIn">
                  {isAdmin && (
                    <button
                      onClick={() => { setActiveTab('admin'); setIsMoreOpen(false); }}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium hover:bg-[#151B24] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer border-b border-white/10 mb-1 pb-1.5"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-bold">Admin Analytics Dashboard</span>
                    </button>
                  )}
                  <button
                    onClick={() => { openDrawer('strategy'); setIsMoreOpen(false); }}
                    className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium hover:bg-[#151B24] text-[#9AA5B1] hover:text-[#F5F7FA] transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#FF8A00]" />
                    <span>ตั้งค่าโปรไฟล์ยุทธศาสตร์</span>
                  </button>
                  {onOpenTrustCenter && (
                    <button
                      onClick={() => { onOpenTrustCenter('about'); setIsMoreOpen(false); }}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium hover:bg-[#151B24] text-[#9AA5B1] hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Trust & Legal Center</span>
                    </button>
                  )}
                  {onOpenGlossary && (
                    <button
                      onClick={() => { onOpenGlossary(); setIsMoreOpen(false); }}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium hover:bg-[#151B24] text-[#9AA5B1] hover:text-[#FF8A00] transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#FF8A00]" />
                      <span>คำศัพท์ทางเทคนิค (Glossary)</span>
                    </button>
                  )}
                  {onOpenShare && (
                    <button
                      onClick={() => { onOpenShare(); setIsMoreOpen(false); }}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium hover:bg-[#151B24] text-amber-300 transition-colors cursor-pointer border-t border-white/10 mt-1 pt-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>แชร์ลิงก์ระบบ</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Auth / Account Button */}
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                type="button"
                title={isAuthenticated ? `เข้าสู่ระบบแล้ว: ${userEmail || 'สมาชิก'}` : 'เข้าสู่ระบบ / สมัครสมาชิก (Sign In / Register)'}
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 min-h-[34px] sm:min-h-[36px] ${
                  isAuthenticated
                    ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/40'
                    : 'bg-[#FF8A00]/20 hover:bg-[#FF8A00]/30 text-[#FF8A00] border-[#FF8A00]/50'
                }`}
              >
                {isAuthenticated ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="hidden xs:inline truncate max-w-[80px] sm:max-w-[120px]">
                      {userEmail ? userEmail.split('@')[0] : 'สมาชิก'}
                    </span>
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-[#FF8A00] shrink-0" />
                    <span className="inline font-bold">เข้าสู่ระบบ</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
