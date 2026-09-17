import React, { useState, useRef } from 'react';
import {
  Activity,
  ChevronRight,
  FileText,
  Flame,
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
} from 'lucide-react';
import { AttachedFile as Attachment, ToneMode, การให้เหตุผลProfile } from '../types';
import { useRecentDecisions, PcaDecision } from '../hooks/useRecentDecisions';
import { useModel } from '../context/ModelContext';
import { auth } from '../lib/firebase';
import strategicAnalysisImg from '../assets/images/strategic_analysis_1789548731039.jpg';
import policyAuditingImg from '../assets/images/policy_auditing_1789548745776.jpg';
import marketTrendsImg from '../assets/images/market_trends_1789548758379.jpg';
import riskAssessmentImg from '../assets/images/risk_assessment_1789548771788.jpg';

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
    image: strategicAnalysisImg,
    color: 'text-amber-500',
    prompt: 'วิเคราะห์กลยุทธ์ทางธุรกิจสำหรับปี 2025 โดยใช้หลักการ PUNN PCA'
  },
  { 
    title: 'ตรวจสอบนโยบาย', 
    desc: 'Audit ความสอดคล้องของนโยบายองค์กรกับข้อกำหนดสากล', 
    image: policyAuditingImg,
    color: 'text-emerald-500',
    prompt: 'ตรวจสอบนโยบายการคุ้มครองข้อมูลส่วนบุคคล (PDPA) เทียบกับมาตรฐาน GDPR'
  },
  { 
    title: 'แนวโน้มตลาด', 
    desc: 'ระบุสัญญาณตลาดและการเปลี่ยนแปลงพฤติกรรมผู้บริโภค', 
    image: marketTrendsImg,
    color: 'text-sky-500',
    prompt: 'วิเคราะห์แนวโน้มตลาด AI ในเอเชียตะวันออกเฉียงใต้'
  },
  { 
    title: 'ประเมินความเสี่ยง', 
    desc: 'ระบุความเสี่ยงที่ซ่อนอยู่และแนวทางการบรรเทาผลกระทบ', 
    image: riskAssessmentImg,
    color: 'text-rose-500',
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
    ? 'fk-surface border-slate-200 hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer'
    : 'fk-surface border-white/10 hover:border-amber-500/30 hover:bg-white/[0.05] transition-all cursor-pointer';

  const processFileList = (files: FileList) => {
    const newAttachments: Attachment[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(7),
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
    { label: 'หลักฐาน Engine', icon: ShieldCheck },
    { label: 'Governance Guard', icon: Lock },
    { label: 'Memory Bank', icon: Layers },
  ];

  const intelligenceSignals = [
    { label: 'แกนระบบ', value: 'ออนไลน์', tone: 'text-emerald-400', dot: 'bg-emerald-500' },
    { label: 'PCA', value: 'v3.0', tone: 'text-amber-400', dot: 'bg-amber-500' },
    { label: 'หลักฐาน', value: 'พร้อม', tone: 'text-sky-400', dot: 'bg-sky-500' },
    { label: 'ธรรมาภิบาล', value: 'ทำงานอยู่', tone: 'text-violet-400', dot: 'bg-violet-500' },
  ];

  const reasoningStages = [
    'คำถาม', 'หลักฐาน', 'การให้เหตุผล', 'ข้อขัดแย้ง', 'การตัดสินใจ', 'ตรวจสอบย้อนหลัง'
  ];

  return (
    <div className="relative min-w-0 flex-1 overflow-x-hidden min-h-screen">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[5%] left-1/4 w-[50%] h-[30%] bg-amber-600/5 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 -right-[10%] w-[40%] h-[40%] bg-orange-600/5 rounded-full blur-[160px]" />
      </div>

      {/* Workspace Layout */}
      <div className="relative z-10 mx-auto grid w-full max-w-[1920px] items-start gap-4 sm:gap-6 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        
        {/* LEFT CONTEXT PANEL (Desktop Only) */}
        <aside className="hidden flex-col gap-6 xl:flex sticky top-[84px] pr-2">
          {/* Intelligence status */}
          <section className="rounded-2xl border border-white/10 fk-surface-elevated p-6 shadow-[0_0_45px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-500">สถานะระบบ</p>
                <h2 className="mt-1 text-lg sm:text-xl font-black text-[var(--fk-text-primary)] leading-tight">ระบบปัญญา Firekeeper</h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-mono font-bold text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0">
                <Flame className="w-4 h-4 text-amber-500 animate-[fk-flame-motion_2s_infinite]" />
                ออนไลน์
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {intelligenceSignals.map((signal) => (
                <div key={signal.label} className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 hover:border-white/15 transition-all">
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full shadow-[0_0_10px_currentColor] ${signal.dot} ${signal.tone}`} />
                    <span className="text-xs sm:text-sm font-mono font-bold tracking-widest text-[var(--fk-text-muted)] uppercase">{signal.label}</span>
                  </div>
                  <div className={`text-xs sm:text-sm font-black font-mono ${signal.tone}`}>{signal.value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* How Firekeeper thinks */}
          <section className="rounded-2xl border border-white/10 fk-surface p-6">
            <div className="mb-5">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-500">กระบวนการตัดสินใจ</p>
              <h2 className="mt-1 text-lg sm:text-xl font-black text-[var(--fk-text-primary)] leading-tight">Cognitive Pipeline</h2>
            </div>
            <div className="space-y-2.5">
              {reasoningStages.map((stage, index) => (
                <div key={stage} className="group relative flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3.5 transition-all hover:bg-white/[0.04] hover:border-amber-500/30">
                  <div className="text-xs font-mono font-bold text-amber-500/50 group-hover:text-amber-500">0{index + 1}</div>
                  <div className="text-xs sm:text-sm font-bold text-[var(--fk-text-secondary)] group-hover:text-white transition-colors">{stage}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Intelligence principles */}
          <div className="space-y-3">
            {[
              ['หลักฐาน-First', 'ตรวจสอบและวางหลักฐานก่อนสรุปผล'],
              ['มนุษย์กำกับได้', 'ระบบช่วยประกอบการตัดสินใจ'],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-[11px] font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                  <Target className="w-3 h-3 text-amber-500/60" />
                  {title}
                </div>
                <p className="mt-1.5 text-[10px] leading-relaxed text-[var(--fk-text-muted)]">{desc}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* Primary workspace — navigation is owned by NavigationDrawer */}
        {/* CENTER CONTENT AREA */}
        <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
          <section className="flex flex-col gap-4 pt-6 sm:pt-12 pb-8 sm:pb-12 text-center relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
            {/* Header Background Glow and Gradient */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[200px] sm:h-[300px] bg-amber-500/20 blur-[80px] sm:blur-[120px] rounded-full animate-pulse" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
            </div>

            <div className="flex flex-col gap-4 relative z-10 items-center px-4">
              <div className="flex items-center gap-3">
                 <span className="h-px w-6 sm:w-12 bg-gradient-to-r from-transparent to-amber-500/50" />
                 <span className="font-mono text-[9px] sm:text-[11px] font-bold tracking-[0.4em] sm:tracking-[0.6em] text-amber-500/80 uppercase drop-shadow-sm">Sovereign Intelligence Engine</span>
                 <span className="h-px w-6 sm:w-12 bg-gradient-to-l from-transparent to-amber-500/50" />
              </div>
              <h1 className="font-sans text-[clamp(2.5rem,8.5vw,4.5rem)] font-black tracking-tighter text-white leading-[1.05]">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500">คิดให้ลึกซึ้ง</span> <br />
                <span className="text-amber-500 animate-fire-flicker">ตัดสินใจให้ปลอดภัย</span>
              </h1>
              <p className="mt-2 max-w-2xl px-2 text-base leading-relaxed sm:px-0 sm:text-2xl text-slate-300 font-medium mx-auto">
                ระบบวิเคราะห์เชิงประจักษ์เพื่อการตัดสินใจระดับยุทธศาสตร์ <br className="hidden sm:block" />
                <span className="block mt-2 text-amber-500/60 text-[11px] sm:text-lg font-mono uppercase tracking-widest">
                  Powered by PUNN PCA v3.0 Architecture
                </span>
              </p>
            </div>
          </section>

          <section className="w-full sticky top-[56px] sm:top-[76px] z-30 -mx-3 px-3 sm:mx-0 sm:px-0">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && processFileList(e.target.files)}
            />
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files.length) processFileList(e.dataTransfer.files);
              }}
              className={`overflow-hidden rounded-2xl border transition-all duration-300 fk-surface-elevated backdrop-blur-xl shadow-2xl focus-within:border-amber-500/40 focus-within:shadow-[0_0_50px_rgba(245,158,11,0.15)] ${isDragging ? 'border-amber-500 bg-amber-500/10' : isLight ? 'bg-white border-slate-200' : 'border-white/10'}`}
            >
              <div className="relative">
                {attachments.length > 0 && (
                  <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto border-b border-white/5 p-2 bg-[var(--fk-overlay-subtle)]">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-200">
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
                  placeholder="ถามคำถามเชิงกลยุทธ์ วิเคราะห์การตัดสินใจ..."
                  className="fk-input w-full bg-transparent p-3.5 sm:p-6 text-lg sm:text-2xl outline-none min-h-[96px] sm:min-h-[160px] resize-none leading-relaxed"
                  autoFocus
                />
                
                <div className="flex items-center justify-between border-t border-white/[0.06] bg-[var(--fk-overlay)] px-3 sm:px-4 py-2.5 sm:py-3 gap-3">
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                      title="แนบไฟล์ (PDF, เอกสาร, ภาพ, โค้ด)"
                      aria-label="แนบไฟล์"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <div className="h-5 w-px bg-white/10" />
                    <button
                      type="button"
                      onClick={onToggleWebSearch}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all cursor-pointer ${
                        webSearch 
                          ? 'border-sky-500/40 bg-sky-500/10 text-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.2)]' 
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                      title={webSearch ? 'ค้นหาเว็บสด (เปิดใช้งานอยู่)' : 'เปิดใช้งานการค้นหาเว็บสด'}
                    >
                      <Globe className={`h-4 w-4 ${webSearch ? 'text-sky-400' : ''}`} />
                      <span className="text-xs font-medium">ค้นหาเว็บ</span>
                      <div className={`h-2 w-2 rounded-full ${webSearch ? 'bg-sky-400 animate-pulse' : 'bg-slate-600'}`} />
                    </button>
                    <div className="h-5 w-px bg-white/10" />
                    <button
                      type="button"
                      onClick={handleOpenSettings}
                      className="p-2 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                      title="ตั้งค่าแชท & โมเดล AI"
                      aria-label="ตั้งค่าแชท & โมเดล AI"
                    >
                      <Sliders className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={handleSubmit}
                      disabled={effectiveIsAnalyzing || (!prompt.trim() && attachments.length === 0)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-black hover:bg-amber-400 transition-all active:scale-[0.98] shadow-[0_0_25px_rgba(245,158,11,0.25)] disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer"
                    >
                      <span className="font-semibold uppercase tracking-wider">ประมวลผล</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            {PCA_FEATURES.map((feature, i) => (
              <div 
                key={i} 
                className={`group relative overflow-hidden rounded-2xl border p-0 ${cardInteractive}`}
                onClick={() => {
                  // Feature cards are executable actions: run the selected analysis immediately.
                  onExecute(feature.prompt, [], tone, effectiveDeepReasoning, reasoningProfile);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onExecute(feature.prompt, [], tone, effectiveDeepReasoning, reasoningProfile);
                  }
                }}
                aria-label={`เริ่มประมวลผล: ${feature.title}`}
              >
                 <div className="aspect-[16/10] w-full overflow-hidden relative bg-white/[0.02]">
                    <img 
                      src={feature.image} 
                      alt={feature.title} 
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('/images/')) {
                          target.src = `/images/${feature.title === 'วิเคราะห์กลยุทธ์' ? 'strategic_analysis_1789548731039.jpg' : feature.title === 'ตรวจสอบนโยบาย' ? 'policy_auditing_1789548745776.jpg' : feature.title === 'แนวโน้มตลาด' ? 'market_trends_1789548758379.jpg' : 'risk_assessment_1789548771788.jpg'}`;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#060A16] via-[#060A16]/20 to-transparent opacity-80" />
                    <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/5 transition-colors duration-500" />
                 </div>
                 <div className="relative -mt-16 p-5 sm:p-7">
                    <h3 className={`text-2xl sm:text-3xl font-extrabold ${feature.color} drop-shadow-sm`}>{feature.title}</h3>
                    <p className="mt-2 text-base text-slate-200 leading-relaxed min-h-[40px]">{feature.desc}</p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onExecute(feature.prompt, [], tone, effectiveDeepReasoning, reasoningProfile);
                      }}
                      className="mt-5 flex items-center gap-2 text-sm font-extrabold text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-widest bg-amber-500/5 hover:bg-amber-500/10 px-5 py-2.5 rounded-lg border border-amber-500/25"
                    >
                       <span>เริ่มการประมวลผล (Execute)</span>
                       <ChevronRight className="h-4 w-4" />
                    </button>
                 </div>
              </div>
            ))}
          </div>

          {/* Mobile Only: Intelligence status (Hidden on XL desktop as it moves to left sidebar) */}
          <div className="flex flex-col gap-6 xl:hidden">
            <section className="rounded-2xl border border-white/10 fk-surface-elevated p-5 sm:p-6 shadow-[0_0_45px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-500">สถานะระบบ</p>
                  <h2 className="mt-1 text-base sm:text-xl font-black text-[var(--fk-text-primary)]">ระบบปัญญา Firekeeper</h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-mono font-bold text-emerald-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                  พร้อมทำงาน
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {intelligenceSignals.map((signal) => (
                  <div key={signal.label} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 hover:border-white/15 transition-all">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2.5 w-2.5 rounded-full shadow-[0_0_10px_currentColor] ${signal.dot} ${signal.tone}`} />
                      <span className="text-xs font-mono tracking-widest text-[var(--fk-text-muted)] uppercase">{signal.label}</span>
                    </div>
                    <div className={`mt-1.5 text-sm sm:text-base font-black font-mono ${signal.tone}`}>{signal.value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 fk-surface p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-500">กระบวนการตัดสินใจ</p>
                  <h2 className="mt-1 text-lg sm:text-xl font-black text-[var(--fk-text-primary)]">Firekeeper คิดและวิเคราะห์อย่างไร</h2>
                </div>
                <p className="text-xs text-[var(--fk-text-muted)] font-mono">หลักฐาน → การให้เหตุผล → การตัดสินใจที่ตรวจสอบได้</p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {reasoningStages.map((stage, index) => (
                  <div key={stage} className="relative rounded-xl border border-white/[0.08] bg-white/[0.015] px-4 py-4 transition-all hover:bg-white/[0.04] hover:border-amber-500/30">
                    <div className="text-xs font-mono font-bold text-amber-500/60">0{index + 1}</div>
                    <div className="mt-2 text-xs sm:text-sm font-bold text-[var(--fk-text-secondary)]">{stage}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* RIGHT CONTEXT PANEL */}
        <aside className="hidden min-w-0 flex-col gap-6 lg:flex">
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
            <button onClick={onViewArchitecture} className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
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
            <button className="mt-6 w-full flex items-center justify-center gap-2 py-1 text-[10px] font-black text-slate-500 hover:text-amber-400 transition-colors uppercase tracking-[0.2em]">
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
