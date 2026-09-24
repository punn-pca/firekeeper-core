import React, { useMemo } from 'react';
import { X, MessageSquare, Brain, Database, BookOpen, FileText, BarChart3, Flame, Sparkles, UserCheck, ExternalLink, ShieldCheck, Sliders, Smartphone, CreditCard } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  onOpenSettings?: () => void;
  onOpenตั้งค่า?: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({ isOpen, onClose, activeTab, setActiveTab, isAdmin, onOpenSettings, onOpenตั้งค่า }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const handleOpenSettings = onOpenตั้งค่า || onOpenSettings;

    const menuItems = useMemo(() => [
    { section: 'ทำงานหลัก' },
    { id: 'home', label: 'ภาพรวม', icon: Flame },
    { id: 'chat', label: 'เริ่มวิเคราะห์', icon: MessageSquare },
    { id: 'memory', label: 'ความจำและบริบท', icon: Database },
    { id: 'ai-passport', label: 'AI Passport', icon: Sparkles, badge: 'NEW' },
    { section: 'บัญชีและการตั้งค่า' },
    { id: 'plans', label: 'สมาชิก การชำระเงิน และสิทธิ์', icon: CreditCard },
    { id: 'settings', label: 'ตั้งค่าโมเดล AI', icon: Sliders },
    ...(isAdmin ? [{ id: 'admin', label: 'บริหารระบบ', icon: BarChart3, badge: 'ADMIN' }] : []),
    { section: 'เอกสารและความน่าเชื่อถือ' },
    { id: 'guide', label: 'คู่มือเริ่มต้นใช้งาน', icon: BookOpen, badge: 'START' },
    { id: 'docs', label: 'เอกสารอ้างอิง', icon: FileText },
    { id: 'publication', label: 'หนังสือและแนวคิด', icon: BookOpen },
    { id: 'whitepaper', label: 'Whitepaper', icon: FileText },
    { id: 'punn-pca', label: 'สถาปัตยกรรม PCA', icon: Brain },
    { id: 'privacy-terms', label: 'ความปลอดภัยและความเป็นส่วนตัว', icon: ShieldCheck },
    { id: 'about', label: 'เกี่ยวกับ Firekeeper', icon: UserCheck },
    { section: 'อื่น ๆ' },
    { id: 'download-apk', label: 'ดาวน์โหลดแอป Android', icon: Smartphone, badge: 'APK' },
  ], [isAdmin]);

  if (!isOpen) return null;

  const navigate = (id: string) => {
    if (id === 'download-apk') {
      window.open('https://github.com/punn-pca/firekeeper-core/releases/download/v1.0.0-mobile/firekeeper-standalone.apk', '_blank');
      onClose();
      return;
    }
    if (id === 'ai-passport') {
      window.location.href = '/ai-passport';
      return;
    }
    if (id === 'settings') {
      if (handleOpenSettings) {
        handleOpenSettings();
      }
      onClose();
      return;
    }
    setActiveTab(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="FIRE KEEPER navigation">
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn" />

      <aside className={`relative w-[min(400px,100vw)] sm:w-[400px] max-w-full h-full shadow-2xl flex flex-col z-10 border-r ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#080808] border-white/[0.08]'
      }`}>
        <div className={`h-[76px] px-5 flex items-center justify-between border-b ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border border-amber-500/30 bg-amber-500/[0.08] flex items-center justify-center">
              <Flame className="w-[18px] h-[18px] text-amber-500" />
            </div>
            <div>
              <h2 className={`font-mono font-semibold text-sm tracking-[0.12em] ${isLight ? 'text-slate-950' : 'text-white'}`}>FIRE KEEPER</h2>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-0.5">Decision Intelligence / Governance</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิดเมนู" title="ปิดเมนู" className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-950 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}>
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1" aria-label="Primary navigation">
          <div className="px-2 pb-2 pt-1 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.18em] text-slate-500 font-bold">
            <span>Workspace</span>
          </div>

          {menuItems.map((item) => {
              if ('section' in item) return <div key={item.section} className="px-2 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{item.section}</div>;
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full min-h-11 flex items-center justify-between px-3 rounded-lg border text-left transition-all duration-150 group cursor-pointer ${
                    isActive
                      ? (isLight ? 'bg-amber-500/[0.10] border-amber-500/25 text-amber-900' : 'bg-amber-500/[0.10] border-amber-500/25 text-amber-300')
                      : (isLight ? 'border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-50' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.04]')
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${isActive ? 'bg-amber-500/10' : ''}`}>
                      <Icon className={`w-[17px] h-[17px] ${isActive ? 'text-amber-500' : 'text-current'}`} />
                    </span>
                    <span className="text-[13px] font-medium truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                        item.badge === 'FOUNDER'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : item.badge === 'SPEC'
                            ? 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                            : 'bg-white/[0.04] text-slate-500 border-white/10'
                      }`}>{item.badge}</span>
                    )}
                  </div>
                </button>
              );
            })}
        </nav>

        <div className="px-4 pb-3">
          <div className={`rounded-lg border p-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.025] border-white/[0.08]'}`}>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Trust & Governance</div>
            <div className="mt-1 text-[10px] leading-relaxed text-slate-500">Security, privacy and governance details are maintained on the canonical Trust page.</div>
          </div>
        </div>

        <div className="px-4 pb-1.5">
          <a href="https://www.facebook.com/punn.firekeeper" target="_blank" rel="noopener noreferrer" className={`w-full p-2.5 rounded-lg border flex items-center justify-between transition-all group cursor-pointer ${isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/[0.025] hover:bg-white/[0.05] border-white/[0.08] text-slate-300'}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-sm">📘</span>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold truncate">ติดต่อผู้สร้าง (PUNN)</div>
                <div className="text-[9px] font-mono text-slate-500 truncate">fb.com/punn.firekeeper</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          </a>
        </div>

        <div className="px-4 pb-3">
          <a href="mailto:official@firekeeper.site" className={`w-full p-2.5 rounded-lg border flex items-center justify-between transition-all group cursor-pointer ${isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/[0.025] hover:bg-white/[0.05] border-white/[0.08] text-slate-300'}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-sm">📧</span>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold truncate">อีเมลติดต่อระบบ (Official)</div>
                <div className="text-[9px] font-mono text-slate-500 truncate">official@firekeeper.site</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          </a>
        </div>

        <div className={`h-12 px-4 border-t flex items-center justify-between text-[9px] font-mono uppercase tracking-wider ${isLight ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-white/[0.08] bg-black/20 text-slate-500'}`}>
          <span>FIRE KEEPER CORE</span>
          <span className="flex items-center gap-1.5 text-emerald-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />READY</span>
        </div>
      </aside>
    </div>
  );
};
