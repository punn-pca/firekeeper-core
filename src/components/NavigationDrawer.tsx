import React, { useMemo, useState } from 'react';
import { X, MessageSquare, Brain, Database, BookOpen, FileText, BarChart3, Flame, Sparkles, UserCheck, ExternalLink, ShieldCheck, Sliders, Smartphone, CreditCard, ChevronDown } from 'lucide-react';
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
  const [showMore, setShowMore] = useState(false);

    const menuItems = useMemo(() => [
    { section: 'ทำงานหลัก' },
    { id: 'home', label: 'ภาพรวม', icon: Flame },
    { id: 'chat', label: 'เริ่มวิเคราะห์', icon: MessageSquare },
    { id: 'memory', label: 'ความจำและบริบท', icon: Database },
    { id: 'resources', label: 'คลังเอกสารหลักฐาน', icon: FileText, badge: 'EVIDENCE' },
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
      window.open('https://github.com/punn-pca/firekeeper-core/releases/download/v1.0.0/FIREKE.1.APK', '_blank');
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
      <div onClick={onClose} className={`fixed inset-0 backdrop-blur-[2px] animate-fadeIn ${isLight ? 'bg-slate-950/25' : 'bg-black/45'}`} />

      <aside className={`fk-navigation-drawer relative w-[min(360px,100vw)] sm:w-[360px] max-w-full h-full shadow-2xl flex flex-col z-10 border-r ${
        isLight ? 'bg-[#f7f7f8] border-black/[0.07]' : 'bg-[#171719] border-white/[0.08]'
      }`}>
        <div className={`h-[72px] px-5 flex items-center justify-between border-b ${isLight ? 'border-black/[0.06]' : 'border-white/[0.07]'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/[0.1] flex items-center justify-center">
              <Flame className="w-[17px] h-[17px] text-amber-500" />
            </div>
            <div>
              <h2 className={`font-semibold text-sm tracking-[0.04em] ${isLight ? 'text-slate-950' : 'text-white'}`}>FIREKEEPER</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">พื้นที่ทำงานและการตั้งค่า</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิดเมนู" title="ปิดเมนู" className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-950 hover:bg-black/[0.05]' : 'text-slate-400 hover:text-white hover:bg-white/[0.07]'}`}>
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Primary navigation">
          <div className="px-3 pb-2 pt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>พื้นที่ทำงาน</span>
          </div>

          {menuItems.map((item) => {
              if ('section' in item && item.section === 'เอกสารและความน่าเชื่อถือ') {
                return (
                  <button key={item.section} type="button" onClick={() => setShowMore((value) => !value)} className="w-full px-3 pb-2 pt-5 flex items-center justify-between text-left text-[11px] font-medium text-slate-500 hover:text-amber-500">
                    <span>เอกสารและเครื่องมือ</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMore ? 'rotate-180' : ''}`} />
                  </button>
                );
              }
              if ('section' in item) {
                if (!showMore && item.section === 'อื่น ๆ') return null;
                return <div key={item.section} className="px-3 pb-2 pt-5 text-[11px] font-medium text-slate-500">{item.section}</div>;
              }
              if (!showMore && ['guide', 'docs', 'publication', 'whitepaper', 'punn-pca', 'privacy-terms', 'about', 'download-apk'].includes(item.id)) return null;
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full min-h-11 flex items-center justify-between px-3 rounded-xl border text-left transition-colors duration-150 group cursor-pointer ${
                    isActive
                      ? (isLight ? 'bg-black/[0.055] border-transparent text-slate-950' : 'bg-white/[0.08] border-transparent text-white')
                      : (isLight ? 'border-transparent text-slate-600 hover:text-slate-950 hover:bg-black/[0.035]' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.045]')
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 flex items-center justify-center shrink-0">
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
          <div className={`rounded-xl border px-3.5 py-3 ${isLight ? 'bg-white/70 border-black/[0.06]' : 'bg-white/[0.025] border-white/[0.07]'}`}>
            <div className="text-[10px] font-medium text-slate-500">Trust & Governance</div>
            <div className="mt-1 text-[11px] leading-relaxed text-slate-500">รายละเอียดความปลอดภัยและการกำกับดูแล</div>
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

        <div className={`h-12 px-5 border-t flex items-center justify-between text-[10px] ${isLight ? 'border-black/[0.06] bg-white/40 text-slate-500' : 'border-white/[0.07] bg-black/10 text-slate-500'}`}>
          <span>FIREKEEPER CORE</span>
          <span>Version 1.0</span>
        </div>
      </aside>
    </div>
  );
};
