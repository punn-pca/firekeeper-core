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
  Sun,
  Moon,
  RefreshCw,
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

const PCA_FEATURE_SETS = [
  [
    {
      title: 'แยกข้อเท็จจริง',
      desc: 'แยก FACT, INFERENCE และข้อมูลที่ยังไม่มีหลักฐาน',
      icon: FileText,
      prompt: 'ช่วยแยกข้อเท็จจริง ข้ออนุมาน และข้อมูลที่ยังไม่ทราบจากประเด็นนี้: '
    },
    {
      title: 'เปรียบเทียบทางเลือก',
      desc: 'เทียบเกณฑ์ ข้อดี ข้อจำกัด และข้อมูลที่ยังขาด',
      icon: Target,
      prompt: 'เปรียบเทียบทางเลือกต่อไปนี้ โดยระบุเกณฑ์ ข้อดี ข้อเสีย และข้อมูลที่ยังขาด: '
    },
    {
      title: 'ประเมินความเสี่ยง',
      desc: 'มองผลกระทบ ความไม่แน่นอน และแนวทางลดความเสี่ยง',
      icon: ShieldAlert,
      prompt: 'ประเมินความเสี่ยงของแผนนี้ ระบุผลกระทบ ความไม่แน่นอน และมาตรการลดความเสี่ยง: '
    },
    {
      title: 'ตรวจสอบเหตุผล',
      desc: 'ตรวจว่าข้อสรุปสอดคล้องกับเหตุผลและหลักฐานหรือไม่',
      icon: ShieldCheck,
      prompt: 'ตรวจสอบว่าข้อสรุปนี้ตามมาจากเหตุผลและหลักฐานที่ให้มาหรือไม่ พร้อมชี้สมมติฐานแฝง: '
    }
  ],
  [
    {
      title: 'ตรวจสอบนโยบาย',
      desc: 'แยกข้อกำหนด ข้อสมมติ และประเด็นที่ต้องยืนยัน',
      icon: ShieldCheck,
      prompt: 'ตรวจสอบร่างนโยบายนี้ โดยแยกข้อกำหนด ข้อสมมติ และประเด็นที่ต้องให้ผู้เชี่ยวชาญยืนยัน: '
    },
    {
      title: 'วางแผนดำเนินงาน',
      desc: 'จัดลำดับงาน ความเสี่ยง และจุดอนุมัติของมนุษย์',
      icon: Workflow,
      prompt: 'จัดทำแผนดำเนินงานจากเป้าหมายนี้ พร้อมลำดับงาน ความเสี่ยง และจุดที่ต้องอนุมัติโดยมนุษย์: '
    },
    {
      title: 'สรุปเอกสาร',
      desc: 'สรุปสาระสำคัญพร้อมแยกข้อเท็จจริงและช่องว่าง',
      icon: FileText,
      prompt: 'สรุปเอกสารที่แนบ โดยแยกข้อเท็จจริง ข้อสรุป และช่องว่างของข้อมูล'
    },
    {
      title: 'วิเคราะห์ผลกระทบ',
      desc: 'พิจารณาผลระยะสั้น ระยะยาว และสิ่งที่ยังไม่แน่นอน',
      icon: Activity,
      prompt: 'วิเคราะห์ผลกระทบระยะสั้นและระยะยาวของทางเลือกนี้ พร้อมระบุความไม่แน่นอน: '
    }
  ],
  [
    {
      title: 'กำหนดโจทย์',
      desc: 'จัดกรอบปัญหา เป้าหมาย และขอบเขตการวิเคราะห์',
      icon: Target,
      prompt: 'ช่วยจัดกรอบปัญหานี้ โดยระบุเป้าหมาย ขอบเขต ผู้เกี่ยวข้อง และคำถามที่ต้องตอบ: '
    },
    {
      title: 'วิเคราะห์หลักฐาน',
      desc: 'ตรวจแหล่งที่มา ความเกี่ยวข้อง และข้อจำกัดของข้อมูล',
      icon: Globe,
      prompt: 'ช่วยประเมินหลักฐานที่มี โดยตรวจแหล่งที่มา ความเกี่ยวข้อง ความน่าเชื่อถือ และข้อจำกัด: '
    },
    {
      title: 'ตั้งสมมติฐาน',
      desc: 'สร้างสมมติฐานที่แข่งขันกันและหาหลักฐานแยกแยะ',
      icon: Layers,
      prompt: 'สร้างสมมติฐานที่เป็นไปได้หลายข้อสำหรับสถานการณ์นี้ และระบุหลักฐานที่ใช้แยกแยะ: '
    },
    {
      title: 'ทบทวนการตัดสินใจ',
      desc: 'ตรวจเหตุผล เงื่อนไข และสิ่งที่ควรติดตามภายหลัง',
      icon: History,
      prompt: 'ทบทวนการตัดสินใจนี้ โดยตรวจเหตุผล เงื่อนไข ความเสี่ยง และข้อมูลที่ควรติดตามภายหลัง: '
    }
  ]
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
  const effectiveSetDeep = setDeepการให้เหตุผล || setDeepReasoning || (() => {});  const effectiveIsAnalyzing = isกำลังวิเคราะห์ !== undefined ? isกำลังวิเคราะห์ : (isAnalyzing !== undefined ? isAnalyzing : false);
  const effectiveSetProfile = setการให้เหตุผลProfile || setReasoningProfile || (() => {});
  const [prompt, setPrompt] = useState('');
  const [sampleSetIndex, setSampleSetIndex] = useState(0);
  const PCA_FEATURES = PCA_FEATURE_SETS[sampleSetIndex];
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
    <div className="fk-home-workspace relative min-w-0 flex-1 overflow-x-hidden min-h-screen">
      {/* Workspace Layout */}
      <div className="relative z-10 mx-auto grid w-full max-w-[1280px] items-start gap-4 px-4 py-5 sm:px-8 sm:py-10 lg:px-12">
        
        {/* LEFT CONTEXT PANEL (Desktop Only) */}
        <aside className="hidden">
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
        <div className="flex min-w-0 flex-col gap-5 sm:gap-8">
          <section className={`relative isolate overflow-hidden rounded-[26px] border px-5 py-7 sm:px-8 sm:py-9 lg:px-11 lg:py-10 ${isLight ? 'border-amber-200 bg-gradient-to-br from-white via-orange-50/70 to-slate-50' : 'border-amber-500/20 bg-[radial-gradient(ellipse_at_18%_10%,rgba(180,83,9,0.22),transparent_48%),linear-gradient(135deg,#171311_0%,#111214_58%,#17191d_100%)]'}`}>
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)] [background-size:34px_34px]" />
            <div className="relative grid items-center gap-5 sm:gap-2 md:grid-cols-[minmax(0,1fr)_210px] lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="min-w-0 text-center md:text-left">
                <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] sm:text-xs font-semibold tracking-[0.12em] ${isLight ? 'border-amber-300/70 bg-white/80 text-amber-700' : 'border-amber-500/25 bg-amber-500/[0.08] text-amber-400'}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  THE DECISION OBSERVATORY · PCA V3.0
                </div>
                <h1 className={`text-[clamp(2.15rem,5.2vw,4.25rem)] font-semibold leading-[1.12] tracking-[-0.045em] ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  มองให้ลึก<br /><span className="text-amber-500">ก่อนตัดสินใจ</span>
                </h1>
                <p className={`mx-auto mt-4 max-w-2xl text-sm leading-7 sm:text-base sm:leading-8 md:mx-0 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  เชื่อมหลักฐาน สำรวจสมมติฐาน และมองความเสี่ยงให้รอบด้าน ด้วย AI ที่ช่วยคุณคิด
                </p>
                <div className={`mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm md:justify-start ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-sky-500" />หลักฐานและความไม่แน่นอน</span>
                  <span className="inline-flex items-center gap-2"><UserCheck className="h-4 w-4 text-amber-500" />มนุษย์เป็นผู้ตัดสินใจ</span>
                </div>
              </div>
              <div className="relative mx-auto h-[170px] w-[150px] sm:h-[210px] sm:w-[185px] md:h-[250px] md:w-[205px] lg:h-[290px] lg:w-[245px]">
                <div className="absolute inset-3 rounded-full bg-amber-500/20 blur-3xl" />
                <img src="/assets/firekeeper-hero-art.jpg" alt="เปลวไฟเหนือยอดเขา สัญลักษณ์ของ FIREKEEPER" className="relative h-full w-full object-cover object-center rounded-[48%_48%_28%_28%] opacity-95 shadow-[0_20px_60px_rgba(0,0,0,0.25)]" />
                <div className={`pointer-events-none absolute inset-0 rounded-[48%_48%_28%_28%] ${isLight ? 'bg-gradient-to-t from-white/20 via-transparent to-white/10' : 'bg-gradient-to-t from-[#111214]/45 via-transparent to-[#111214]/15'}`} />
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
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files.length) processFileList(e.dataTransfer.files);
              }}
              className={`overflow-hidden rounded-2xl sm:rounded-[24px] border transition-all duration-200 fk-surface-elevated shadow-sm focus-within:border-amber-500/50 focus-within:shadow-md ${isDragging ? 'border-amber-500 bg-amber-500/10' : isLight ? 'bg-white border-black/[0.08]' : 'bg-[#19191b] border-white/[0.09]'}`}
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
                
                <div className={`flex items-center justify-between border-t px-3 sm:px-5 py-2.5 sm:py-3 gap-2 sm:gap-3 flex-nowrap ${isLight ? 'border-black/[0.06] bg-slate-50/80' : 'border-white/[0.06] bg-black/10'}`}>
                  <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar shrink min-w-0 py-0.5">
                    <button                       type="button"
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
                      className="min-h-[38px] px-4 sm:px-5 py-1.5 flex items-center justify-center gap-1.5 rounded-full bg-amber-500 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-amber-400 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <span>เริ่มวิเคราะห์</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.12em] text-amber-500">เริ่มต้นได้ทันที</p>
                <h2 className={`mt-1 text-base font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>คำถามตัวอย่าง</h2>
              </div>
              <button type="button" onClick={() => setSampleSetIndex(index => (index + 1) % PCA_FEATURE_SETS.length)} className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${isLight ? 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-amber-700' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-amber-500/40 hover:text-amber-300'}`} aria-label="เปลี่ยนชุดคำถามตัวอย่าง">
                <RefreshCw className="h-3.5 w-3.5" />
                เปลี่ยนตัวอย่าง
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PCA_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return <button key={feature.title} type="button" disabled={effectiveIsAnalyzing} onClick={() => onExecute(feature.prompt, [], tone, effectiveDeepReasoning, reasoningProfile)} className={`group flex min-h-[108px] w-full items-start gap-3 rounded-2xl p-4 text-left disabled:cursor-not-allowed disabled:opacity-50 ${cardInteractive}`} aria-label={`เริ่มประมวลผล: ${feature.title}`}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isLight ? 'bg-amber-500/[0.09]' : 'bg-amber-500/[0.12]'}`}><Icon className="h-[18px] w-[18px] text-amber-500" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2"><h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{feature.title}</h3><ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" /></div>
                  <p className={`mt-1.5 line-clamp-3 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{feature.desc}</p>
                </div>
              </button>;
            })}
            </div>
          </section>

          {/* System capabilities and reasoning path */}
          <div className="flex flex-col gap-6">
            <section className={`rounded-2xl border p-5 sm:p-6 ${isLight ? 'border-black/[0.07] bg-white' : 'border-white/[0.07] bg-[#19191b]'}`}>
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <p className="text-xs font-medium text-slate-500">เครื่องมือที่ใช้ร่วมกัน</p>
                  <h2 className={`mt-1 text-lg sm:text-xl font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>องค์ประกอบการวิเคราะห์</h2>
                </div>
                <Workflow className="h-5 w-5 text-slate-400" />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {systemItems.map(({ label, icon: Icon }) => (
                  <div key={label} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${isLight ? 'border-black/[0.06] bg-slate-50/70' : 'border-white/[0.06] bg-white/[0.025]'}`}>
                    <Icon className="h-[18px] w-[18px] text-amber-500" />
                    <span className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className={`rounded-2xl border p-5 sm:p-6 ${isLight ? 'border-black/[0.07] bg-white' : 'border-white/[0.07] bg-[#19191b]'}`}>
              <div className={`flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b pb-4 ${isLight ? 'border-black/[0.07]' : 'border-white/[0.07]'}`}>
                <div>
                  <p className="text-xs font-medium text-slate-500">กระบวนการ</p>
                  <h2 className={`mt-1 text-lg sm:text-xl font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>จากคำถามสู่การตัดสินใจ</h2>
                </div>
                <p className="text-xs text-slate-500">คุณตรวจสอบและตัดสินใจในทุกขั้นตอน</p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {reasoningStages.map((stage, index) => (
                  <div key={stage} className={`relative rounded-xl border px-4 py-4 ${isLight ? 'border-black/[0.06] bg-slate-50/70' : 'border-white/[0.06] bg-white/[0.025]'}`}>
                    <div className="text-[11px] font-medium text-slate-500">0{index + 1}</div>
                    <div className={`mt-2 text-xs sm:text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{stage}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
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
            <button className="mt-6 min-h-11 w-full flex items-center justify-center gap-2 py-2.5 text-sm font-black text-slate-500 hover:text-amber-400 transition-colors uppercase tracking-[0.2em]">              ดูประวัติการตรวจสอบทั้งหมด
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