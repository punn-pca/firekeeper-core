import { ChatComposerSurface } from './ChatComposerSurface';
import React, { useState, useRef } from 'react';
import {
  Activity,
  ChevronRight,
  FileText,
  Globe,
  History,
  Layers,
  Paperclip,
  ShieldAlert,
  ShieldCheck,
  Target,
  UserCheck,
  Workflow,
  X,
  Lock,
  Send,
  ExternalLink,
  ArrowRight,
  Settings2,
  Cpu,
  Sliders,
  Sun,
  Moon,
  Zap,
} from 'lucide-react';
import { AttachedFile as Attachment, ToneMode, การให้เหตุผลProfile } from '../types';
import { useRecentDecisions, PcaDecision } from '../hooks/useRecentDecisions';
import { useModel } from '../context/ModelContext';
import { useTheme } from '../context/ThemeContext';
import { auth } from '../lib/firebase';

interface HomeProps {
  onExecute: (prompt: string, attachments: Attachment[], tone?: ToneMode, deep?: boolean, profile?: การให้เหตุผลProfile) => void;
  isAuthenticated: boolean;
  userId?: string;
  onOpenAuth: () => void;
  onOpenSettings?: () => void;
  onOpenตั้งค่า?: () => void;
  onViewArchitecture: () => void;
  onLearnPCA: () => void;
  onSelectActivity: (id: string) => void;
  onSelectDecision?: (decision: PcaDecision) => void;
  onNavigateDocs: (section: string) => void;
  tone: ToneMode;
  setTone: (tone: ToneMode) => void;
  deepการให้เหตุผล?: boolean;
  deepReasoning?: boolean;
  setDeepการให้เหตุผล?: (deep: boolean) => void;
  setDeepReasoning?: (deep: boolean) => void;
  reasoningProfile: การให้เหตุผลProfile;
  setการให้เหตุผลProfile?: (profile: การให้เหตุผลProfile) => void;
  setReasoningProfile?: (profile: การให้เหตุผลProfile) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  webSearch: boolean;
  onToggleWebSearch: () => void;
  isAnalyzing?: boolean;
  isกำลังวิเคราะห์?: boolean;
  isLight: boolean;
}

// Custom SVG Illustrations for Features
const StrategicIcon = () => (
  <svg viewBox="0 0 160 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 80L50 50L80 70L140 20" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="20" cy="80" r="4" fill="#F59E0B" />
    <circle cx="50" cy="50" r="4" fill="#F59E0B" />
    <circle cx="80" cy="70" r="4" fill="#F59E0B" />
    <circle cx="140" cy="20" r="6" fill="#F59E0B" stroke="white" strokeWidth="2" />
    <path d="M140 20V40M140 20H120" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    <rect x="30" y="20" width="40" height="15" rx="4" fill="#F59E0B" fillOpacity="0.1" stroke="#F59E0B" strokeWidth="1" />
  </svg>
);

const PolicyIcon = () => (
  <svg viewBox="0 0 160 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="40" y="20" width="80" height="60" rx="4" stroke="#10B981" strokeWidth="2" />
    <path d="M55 35H105M55 45H105M55 55H80" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
    <circle cx="110" cy="70" r="15" fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="1.5" />
    <path d="M105 70L108 73L115 67" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MarketIcon = () => (
  <svg viewBox="0 0 160 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 80V20H140V80H20Z" stroke="#0EA5E9" strokeWidth="2" strokeDasharray="4 4" />
    <path d="M40 80V50M70 80V30M100 80V60M130 80V40" stroke="#0EA5E9" strokeWidth="8" strokeLinecap="round" />
    <path d="M20 40C40 30 100 60 140 30" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const RiskIcon = () => (
  <svg viewBox="0 0 160 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M80 20L130 90H30L80 20Z" stroke="#F43F5E" strokeWidth="2" strokeLinejoin="round" />
    <path d="M80 45V65" stroke="#F43F5E" strokeWidth="3" strokeLinecap="round" />
    <circle cx="80" cy="75" r="2" fill="#F43F5E" />
    <path d="M20 20L140 90M140 20L20 90" stroke="#F43F5E" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
  </svg>
);

const ArchitectureStackSVG = () => (
  <svg viewBox="0 0 240 140" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M40 40L120 20L200 40L120 60L40 40Z" fill="#F59E0B" fillOpacity="0.2" stroke="#F59E0B" strokeWidth="1.5" />
    <path d="M40 60L120 40L200 60L120 80L40 60Z" fill="#F59E0B" fillOpacity="0.1" stroke="#F59E0B" strokeWidth="1.5" />
    <path d="M40 80L120 60L200 80L120 100L40 80Z" fill="#F59E0B" fillOpacity="0.05" stroke="#F59E0B" strokeWidth="1.5" />
    <path d="M120 20V100" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
    <circle cx="120" cy="60" r="10" fill="#F59E0B" fillOpacity="0.4">
      <animate attributeName="r" values="8;12;8" dur="3s" repeatCount="indefinite" />
      <animate attributeName="fill-opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" />
    </circle>
  </svg>
);

const PCA_FEATURES = [
  { 
    title: 'วิเคราะห์กลยุทธ์', 
    desc: 'ประเมินแผนงานเชิงยุทธศาสตร์ด้วย PCA Cognitive Engine', 
    icon: Target,
    prompt: 'วิเคราะห์กลยุทธ์ทางธุรกิจสำหรับปี 2025 โดยใช้หลักการ PUNN PCA'
  },
  { 
    title: 'ตรวจสอบนโยบาย', 
    desc: 'Audit ความสอดคล้องของนโยบายองค์กรกับข้อกำหนดสากล', 
    icon: ShieldCheck,
    prompt: 'ตรวจสอบนโยบายการคุ้มครองข้อมูลส่วนบุคคล (PDPA) เทียบกับมาตรฐาน GDPR'
  },
  { 
    title: 'แนวโน้มตลาด', 
    desc: 'ระบุสัญญาณตลาดและการเปลี่ยนแปลงพฤติกรรมผู้บริโภค', 
    icon: Globe,
    prompt: 'วิเคราะห์แนวโน้มตลาด AI ในเอเชียตะวันออกเฉียงใต้'
  },
  { 
    title: 'ประเมินความเสี่ยง', 
    desc: 'ระบุความเสี่ยงที่ซ่อนอยู่และแนวทางการบรรเทาผลกระทบ', 
    icon: ShieldAlert,
    prompt: 'ประเมินความเสี่ยงด้านห่วงโซ่อุปทาน (Supply Chain Risk) ในสถานการณ์ปัจจุบัน'
  },
];

export const Home: React.FC<HomeProps> = (props) => {
  const { 
    onExecute,
    isAuthenticated,
    onOpenAuth,
    onOpenSettings,
    onOpenตั้งค่า,
    onViewArchitecture,
    onLearnPCA,
    onSelectActivity,
    onNavigateDocs,
    tone,
    setTone,
    deepการให้เหตุผล,
    deepReasoning,
    setDeepการให้เหตุผล,
    setDeepReasoning,
    reasoningProfile,
    setการให้เหตุผลProfile,
    setReasoningProfile,
    selectedModel,
    setSelectedModel,
    webSearch,
    onToggleWebSearch,
    isAnalyzing,
    isกำลังวิเคราะห์,
    isLight,
    userId,
    onSelectDecision
  } = props;

  const effectiveUserId = userId || auth.currentUser?.uid || null;
  const { decisions: recentการตัดสินใจs, loading: isDecisionsLoading } = useRecentDecisions(effectiveUserId);
  const modelContext = useModel();
  const { toggleTheme } = useTheme();

  const handleOpenSettings = onOpenตั้งค่า || onOpenSettings || (() => {});
  const effectiveDeepReasoning = deepการให้เหตุผล !== undefined ? deepการให้เหตุผล : (deepReasoning !== undefined ? deepReasoning : false);
  const effectiveSetDeep = setDeepการให้เหตุผล || setDeepReasoning || (() => {});
  const effectiveIsAnalyzing = isกำลังวิเคราะห์ !== undefined ? isกำลังวิเคราะห์ : (isAnalyzing !== undefined ? isAnalyzing : false);
  const effectiveSetProfile = setการให้เหตุผลProfile || setReasoningProfile || (() => {});
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const card = isLight ? 'fk-surface border-slate-200 shadow-sm' : 'fk-surface border-white/10 backdrop-blur-xl';
  const cardInteractive = isLight
    ? 'fk-surface border-black/[0.07] hover:border-black/[0.14] hover:shadow-sm transition-all cursor-pointer'
    : 'fk-surface border-white/[0.08] hover:border-white/[0.18] hover:bg-white/[0.025] transition-all cursor-pointer';

  const processFileList = (files: FileList) => {
    const newAttachments: Attachment[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleSubmit = () => {
    if (!prompt.trim() && attachments.length === 0) return;
    onExecute(prompt, attachments, tone, effectiveDeepReasoning, reasoningProfile);
    setPrompt('');
    setAttachments([]);
  };

  const systemItems = [
    { label: 'PCA v3.0 Core', icon: Workflow },
    { label: 'Dual-Mode Router', icon: Zap },
    { label: 'หลักฐาน Engine', icon: ShieldCheck },
    { label: 'Governance Guard', icon: Lock },
    { label: 'Memory Bank', icon: Layers },
  ];

  const reasoningStages = [
    'คำถาม', 'หลักฐาน', 'การให้เหตุผล', 'ข้อขัดแย้ง', 'การตัดสินใจ', 'ตรวจสอบย้อนหลัง'
  ];

  return (
    <div className="fk-home-workspace relative min-w-0 flex-1 overflow-x-hidden min-h-screen">
      {/* Workspace Layout */}
      <div className="relative z-10 mx-auto grid w-full max-w-[1280px] items-start gap-4 px-4 py-5 sm:px-8 sm:py-10 lg:px-12">
        
        {/* Primary workspace — navigation is owned by NavigationDrawer */}
        {/* CENTER CONTENT AREA */}
        <div className="flex min-w-0 flex-col gap-5 sm:gap-8">
          <section className="relative flex items-center px-1 py-10 sm:px-4 sm:py-14 lg:py-16">
            <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center">
              <div className="mb-5 flex items-center justify-center gap-2.5 text-[11px] sm:text-xs font-medium tracking-[0.04em] text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>พื้นที่ทำงาน · PCA v3.0</span>
              </div>
              <h1 className={`max-w-6xl text-[clamp(3rem,8vw,8rem)] font-semibold leading-[1.02] tracking-[-0.055em] text-balance ${isLight ? 'text-slate-950' : 'text-white'}`}>
                มองให้ลึก <span className="text-amber-500">ก่อนตัดสินใจ</span>
              </h1>
              <p className={`mt-5 max-w-2xl text-base sm:text-lg leading-8 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                เชื่อมหลักฐาน สำรวจสมมติฐาน และมองความเสี่ยงให้รอบด้าน
                <br className="hidden sm:block" />ด้วย AI ที่ช่วยคุณคิด
              </p>
              <div className={`mt-6 flex flex-row flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <span className="inline-flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" />Dual-Mode (Direct AI / Governed)</span>
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-slate-500" />หลักฐานและความไม่แน่นอน</span>
                <span className="inline-flex items-center gap-2"><UserCheck className="h-4 w-4 text-amber-500" />มนุษย์เป็นผู้ตัดสินใจ</span>
              </div>
            </div>
          </section>

          <section className="w-full relative z-10 sm:mx-0 sm:px-0">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && processFileList(e.target.files)}
            />
            <ChatComposerSurface
              light={isLight}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files.length) processFileList(e.dataTransfer.files);
              }}
              className={`overflow-hidden rounded-2xl sm:rounded-[24px] border transition-all duration-300 fk-surface-elevated shadow-xl focus-within:border-sky-400/70 focus-within:shadow-[0_0_28px_rgba(59,130,246,0.22)] ${isDragging ? 'border-amber-500 bg-amber-500/10' : isLight ? 'bg-white border-black/[0.08]' : 'bg-gradient-to-br from-[#101d39] via-[#0c1428] to-[#080d19] border-sky-400/35 shadow-[0_12px_45px_rgba(0,0,0,0.55),0_0_18px_rgba(59,130,246,0.12)]'}`}
            >
              <div className="relative">
                {attachments.length > 0 && (
                  <div className={`flex max-h-24 flex-wrap gap-2 overflow-y-auto border-b p-3 ${isLight ? 'border-black/[0.06] bg-slate-50' : 'border-white/[0.06] bg-white/[0.025]'}`}>
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${isLight ? 'border-black/[0.07] bg-white text-slate-700' : 'border-white/[0.08] bg-white/[0.04] text-slate-200'}`}>
                        <Paperclip className="h-3 w-3 text-slate-400" />
                        <span className="max-w-[100px] truncate">{attachment.name}</span>
                        <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== attachment.id))} className="text-slate-500 hover:text-rose-400">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="เริ่มจากคำถามหรือการตัดสินใจที่ต้องการคิดให้รอบด้าน…"
                  className="fk-input w-full bg-transparent px-5 pt-5 pb-4 sm:px-7 sm:pt-7 text-lg sm:text-xl outline-none min-h-[116px] sm:min-h-[132px] resize-y leading-relaxed"
                  autoFocus
                />
                
                <div className={`flex items-center justify-between border-t px-3 sm:px-5 py-2.5 sm:py-3 gap-2 sm:gap-3 flex-nowrap ${isLight ? 'border-black/[0.06] bg-slate-50/80' : 'border-sky-400/15 bg-[#101c36]/80'}`}>
                  <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar shrink min-w-0 py-0.5">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`min-h-[38px] min-w-[38px] p-2 rounded-full transition-colors cursor-pointer flex items-center justify-center shrink-0 ${isLight ? 'text-slate-500 hover:text-amber-600 hover:bg-black/[0.04]' : 'text-slate-400 hover:text-amber-400 hover:bg-white/[0.06]'}`}
                      title="แนบไฟล์ (PDF, เอกสาร, ภาพ, โค้ด)"
                      aria-label="แนบไฟล์"
                    >
                      <Paperclip className="h-[18px] w-[18px]" />
                    </button>
                    <div className={`h-4 w-px shrink-0 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />
                    <button
                      type="button"
                      onClick={onToggleWebSearch}
                      className={`flex items-center gap-1.5 min-h-[38px] rounded-xl border px-2.5 py-1.5 transition-all cursor-pointer shrink-0 ${
                        webSearch 
                          ? (isLight ? 'border-black/[0.07] bg-white text-slate-700' : 'border-white/[0.1] bg-white/[0.06] text-slate-200')
                          : (isLight ? 'border-transparent bg-transparent text-slate-500 hover:text-slate-800' : 'border-transparent bg-transparent text-slate-400 hover:text-slate-200')
                      }`}
                      title={webSearch ? 'ค้นหาเว็บสด (เปิดใช้งานอยู่)' : 'เปิดใช้งานการค้นหาเว็บสด'}
                    >
                      <Globe className="h-4 w-4" />
                      <span className="text-xs font-medium">ค้นหาเว็บ</span>
                      <div className={`h-1.5 w-1.5 rounded-full ${webSearch ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                    </button>
                    <div className={`h-4 w-px ${isLight ? 'bg-slate-200' : 'bg-white/10'} shrink-0`} />
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className={`flex items-center gap-1.5 min-h-[38px] min-w-[38px] rounded-full px-2.5 py-1.5 transition-colors cursor-pointer shrink-0 ${isLight ? 'text-slate-500 hover:bg-black/[0.04]' : 'text-slate-400 hover:bg-white/[0.06]'}`}
                      title={isLight ? 'เปลี่ยนเป็นโหมดมืด' : 'เปลี่ยนเป็นโหมดสว่าง'}
                      aria-label={isLight ? 'เปลี่ยนเป็นโหมดมืด' : 'เปลี่ยนเป็นโหมดสว่าง'}
                    >
                      {isLight ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-sky-300" />}
                      <span className="hidden sm:inline text-xs font-medium">{isLight ? 'สว่าง' : 'มืด'}</span>
                    </button>
                    <div className={`h-4 w-px ${isLight ? 'bg-slate-200' : 'bg-white/10'} shrink-0`} />
                    <button
                      type="button"
                      onClick={handleOpenSettings}
                      className={`flex items-center gap-1.5 min-h-[38px] px-2.5 py-1.5 rounded-full transition-colors cursor-pointer shrink-0 ${isLight ? 'text-slate-600 hover:bg-black/[0.04]' : 'text-slate-300 hover:bg-white/[0.06]'}`}
                      title="ตั้งค่าแชท & โมเดล AI"
                      aria-label="ตั้งค่าแชท & โมเดล AI"
                    >
                      <Sliders className="h-4 w-4 text-slate-500 shrink-0" />
                      <span className="text-xs font-medium max-w-[110px] sm:max-w-none truncate">{selectedModel || 'deepseek-chat'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <button 
                      type="button"
                      onClick={handleSubmit}
                      disabled={effectiveIsAnalyzing || (!prompt.trim() && attachments.length === 0)}
                      className="min-h-[38px] px-4 sm:px-5 py-1.5 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 border border-sky-400/60 text-xs sm:text-sm font-semibold text-white hover:from-blue-600 hover:to-indigo-500 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <span>เริ่มวิเคราะห์</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            </ChatComposerSurface>
          </section>

        </div>

        {/* RIGHT CONTEXT PANEL */}
        <aside className="hidden">
          <div className={`rounded-2xl border p-6 ${card} sticky top-[84px]`}>
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-white uppercase tracking-widest">สถาปัตยกรรมระบบ</h3>
               <Layers className="h-4 w-4 text-slate-500" />
            </div>
            <div className="aspect-video w-full relative mb-4 overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center p-4">
               <ArchitectureStackSVG />
               <div className="absolute inset-0 bg-gradient-to-t from-[#040712] via-transparent to-transparent" />
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_40%,rgba(4,7,18,0.3))]" />
            </div>
            <div className="space-y-3">
              {systemItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-1 w-1 rounded-full bg-amber-500/60" />
                  <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
            <button onClick={onViewArchitecture} className="mt-6 min-h-11 w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <span>รายละเอียดสถาปัตยกรรม</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className={`rounded-2xl border p-6 ${card}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">ประวัติการตัดสินใจ</h3>
              <History className="h-4 w-4 text-slate-500" />
            </div>

            <div className="flex flex-col gap-4">
              {isDecisionsLoading ? (
                <div className="py-8 text-center">
                  <div className="w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">กำลังดึงข้อมูล...</p>
                </div>
              ) : recentการตัดสินใจs.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-white/5 rounded-xl">
                  <History className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">ยังไม่มีประวัติ</p>
                </div>
              ) : (
                recentการตัดสินใจs.map((decision, i) => (
                  <div 
                    key={decision.id} 
                    onClick={() => onSelectDecision?.(decision)}
                    className="group flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-amber-400 transition-colors">{decision.title}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{decision.time}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded border text-[8px] font-black tracking-wider shrink-0 ${decision.statusColor}`}>
                      {decision.status}
                    </span>
                  </div>
                ))
              )}
            </div>
            <button className="mt-6 min-h-11 w-full flex items-center justify-center gap-2 py-2.5 text-sm font-black text-slate-500 hover:text-amber-400 transition-colors uppercase tracking-[0.2em]">
              ดูประวัติการตรวจสอบทั้งหมด
            </button>
          </div>

          <div className={`rounded-2xl border p-6 bg-emerald-500/[0.02] border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]`}>
             <div className="flex items-center gap-3 mb-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">ชั้นความน่าเชื่อถือ</h3>
             </div>
             <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                การตัดสินใจดำเนินงานถูกกำกับโดยมาตรฐาน ISO/IEC 42001 และโปรโตคอลการตรวจสอบโดยมนุษย์ (Human-in-the-loop)
             </p>
             <div className="flex items-center justify-between text-[9px] font-mono font-bold text-emerald-500/60">
                <span>ENCRYPTED</span>
                <span>AUDITED</span>
                <span>PRIVATE</span>
             </div>
          </div>
        </aside>
      </div>

    </div>
  );
};
