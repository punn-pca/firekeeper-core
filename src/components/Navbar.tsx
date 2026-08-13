import React, { useState, useRef, useEffect } from 'react';
import { Flame, Brain, Database, BookOpen, MessageSquare, History, User as UserIcon, LogIn, Activity, Landmark, ShieldAlert, ChevronDown, Sliders, Eye, Zap, Sparkles, CreditCard, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConversation } from '../context/ConversationContext';

interface NavbarProps {
  activeTab: 'chat' | 'pipeline' | 'memory' | 'docs' | 'diagnostic' | 'thai_context' | 'red_team';
  setActiveTab: (tab: 'chat' | 'pipeline' | 'memory' | 'docs' | 'diagnostic' | 'thai_context' | 'red_team') => void;
  memoryCount: number;
  onOpenExport: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, memoryCount, onOpenSettings }) => {
  const { user, openAuthModal, openProfileModal, openPricingModal } = useAuth();
  const { toggleDrawer } = useConversation();
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const workspaces = [
    { id: 'chat', label: 'Chat & Analysis', icon: MessageSquare, badge: null },
    { id: 'pipeline', label: '12-Stage Pipeline', icon: Brain, badge: null },
    { id: 'memory', label: 'Memory Bank', icon: Database, badge: memoryCount > 0 ? memoryCount : null },
    { id: 'thai_context', label: 'Thai Context Engine', icon: Landmark, badge: null },
    { id: 'red_team', label: 'Red Team Lab', icon: ShieldAlert, badge: null },
    { id: 'docs', label: 'Framework Spec', icon: BookOpen, badge: null },
    { id: 'diagnostic', label: 'Diagnostics', icon: Activity, badge: null },
  ];

  const currentWorkspace = workspaces.find(w => w.id === activeTab) || workspaces[0];
  const CurrentIcon = currentWorkspace.icon;

  const membership = user?.membership || {
    tier: 'free',
    tierName: 'Free Starter Tier',
    tokensUsedThisMonth: 12450,
    tokenQuotaMonthly: 50000,
  };

  const tokensUsed = membership.tokensUsedThisMonth || 0;
  const tokenQuota = membership.tokenQuotaMonthly || 50000;
  const formatCompact = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(event.target as Node)) {
        setIsWorkspaceOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
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
                <span className="text-[10px] font-medium tracking-tight text-[#9AA5B1] hidden sm:block">
                  Executive AI OS
                </span>
              </div>
            </div>

            {/* PCA Status Chip */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0F131A] border border-[rgba(255,255,255,0.06)] text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[#9AA5B1]">PCA • 12 Verified</span>
            </div>
          </div>

          {/* Right Action Controls: Inspect, Token Gauge, Workspace Dropdown, User Dropdown */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Processing Credits Meter Quick Gauge */}
            <button
              onClick={openProfileModal}
              type="button"
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#0F131A] hover:bg-[#151B24] border border-[rgba(255,255,255,0.08)] transition-all cursor-pointer font-mono text-xs"
              title="โควตา AI Processing Credits ประจำเดือน - กดเพื่อดูรายละเอียดหรือแก้ไขโปรไฟล์"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <div className="flex items-center space-x-1">
                <span className="text-white font-bold">{formatCompact(tokensUsed)}</span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-400">{formatCompact(tokenQuota)}</span>
              </div>
            </button>

            {/* Inspect Button */}
            <button
              type="button"
              onClick={() => setActiveTab('pipeline')}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#0F131A] hover:bg-[#151B24] text-[#F5F7FA] border border-[rgba(255,255,255,0.06)] text-xs font-semibold transition-all cursor-pointer shadow-xs"
              title="ตรวจสอบสเตจการประมวลผล (Inspect Pipeline)"
            >
              <Eye className="w-4 h-4 text-[#FF8A00]" />
              <span className="hidden sm:inline">Inspect</span>
            </button>

            {/* Strategy / Settings Slide Bar Icon Button */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                type="button"
                title="ตั้งค่าโปรไฟล์ยุทธศาสตร์และระดับการประมวลผล"
                className="p-2 rounded-xl bg-[#0F131A] hover:bg-[#151B24] text-[#9AA5B1] hover:text-[#F5F7FA] border border-[rgba(255,255,255,0.06)] transition-all cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-[#FF8A00]" />
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
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0F131A] border border-[rgba(255,255,255,0.08)] shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6B7280] font-mono">
                    Workspace Views
                  </div>
                  {workspaces.map((w) => {
                    const Icon = w.icon;
                    const isSelected = activeTab === w.id;
                    return (
                      <button
                        key={w.id}
                        onClick={() => {
                          setActiveTab(w.id as any);
                          setIsWorkspaceOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-all cursor-pointer ${
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
              )}
            </div>

            {/* User Dropdown / Profile Controls */}
            <div className="relative shrink-0" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                type="button"
                className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#0F131A] hover:bg-[#151B24] text-[#F5F7FA] border border-[rgba(255,255,255,0.06)] text-xs font-semibold transition-all cursor-pointer shrink-0"
              >
                {user?.isGuest ? (
                  <>
                    <LogIn className="w-4 h-4 text-[#FF8A00]" />
                    <span className="hidden md:inline">Guest Analyst</span>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-[10px] flex items-center justify-center border border-emerald-500/30">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="hidden md:inline font-bold text-[#F5F7FA] max-w-[110px] truncate">
                      {user?.name}
                    </span>
                  </>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0F131A] border border-[rgba(255,255,255,0.08)] shadow-2xl py-2 z-50 divide-y divide-slate-800/80">
                  {/* Member Info Banner */}
                  <div className="px-4 py-3 space-y-1">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span className="truncate">{user?.name}</span>
                      <span className="px-2 py-0.2 rounded text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        {membership.tier.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</p>
                    
                    {/* Token usage in dropdown */}
                    <div className="pt-2">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span>Tokens Used:</span>
                        <span className="text-amber-300 font-bold">{tokensUsed.toLocaleString()} / {tokenQuota.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${Math.min(100, Math.round((tokensUsed / tokenQuota) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openProfileModal();
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-slate-300 hover:bg-[#151B24] hover:text-white transition-colors cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-emerald-400" />
                      <span>แก้ไขข้อมูลสมาชิก (Edit Profile)</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openPricingModal();
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-slate-300 hover:bg-[#151B24] hover:text-white transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>แพ็กเกจสมาชิก & โควตา (Pricing)</span>
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openAuthModal();
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-slate-400 hover:bg-[#151B24] hover:text-white transition-colors cursor-pointer"
                    >
                      <LogIn className="w-4 h-4 text-sky-400" />
                      <span>สลับสิทธิ์การเข้าสู่ระบบ (Switch User)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};





