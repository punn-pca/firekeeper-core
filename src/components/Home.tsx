import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ChevronRight,
  File as FileGeneric,
  FileCode,
  FileSpreadsheet,
  FileText,
  Flame,
  Globe,
  History,
  Layers,
  Lock,
  Moon,
  Paperclip,
  Scale,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sun,
  Target,
  UserCheck,
  Workflow,
  X,
  Zap,
  Image as ImageIcon,
  Send,
  Cpu,
  Search,
  ExternalLink,
  Info,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { AttachedFile, ToneMode, ReasoningProfile } from '../types';
import { getFileCategory, readFileAsAttachedFile, extractImagesFromClipboardEvent, MAX_ATTACHMENT_SIZE_BYTES, formatFileSize } from '../utils/fileUtils';
import { safeLocalStorage, getDraftPromptStorageKey } from '../utils/safeStorage';
import { auth, onAuthStateChanged } from '../lib/firebase';
import { useConversation } from '../context/ConversationContext';
import { useTheme } from '../context/ThemeContext';
import { useModel } from '../context/ModelContext';
import { AnimatedFlameLogo } from './AnimatedFlameLogo';

interface HomeProps {
  onExecute: (
    prompt: string,
    attachments?: AttachedFile[],
    tone?: ToneMode,
    deepReasoning?: boolean,
    reasoningProfile?: ReasoningProfile
  ) => void;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onViewArchitecture: () => void;
  onLearnPCA: () => void;
  onSelectActivity: (id: string) => void;
  onNavigateDocs?: (subTab?: string) => void;
  tone: ToneMode;
  setTone: (tone: ToneMode) => void;
  deepReasoning: boolean;
  setDeepReasoning: (deep: boolean) => void;
  reasoningProfile: ReasoningProfile;
  setReasoningProfile: (profile: ReasoningProfile) => void;
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
  webSearch?: boolean;
  onToggleWebSearch?: () => void;
  isAnalyzing?: boolean;
  isLight?: boolean;
}

const QUICK_EXAMPLES = [
  {
    icon: <Target className="h-4 w-4 text-emerald-400" />,
    title: 'กลยุทธ์ขยายสู่ตลาดใหม่',
    description: 'ประเมินต้นทุน กฎหมาย คู่แข่ง และความเสี่ยง',
    prompt: 'วิเคราะห์ความเป็นไปได้เชิงกลยุทธ์ในการขยายบริการ B2B สู่ตลาดใหม่ เปรียบเทียบทางเลือกและประเมินความเสี่ยง จุดคุ้มทุน และปัจจัยที่ควรตรวจสอบก่อนตัดสินใจ',
    badge: 'Strategic',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  },
  {
    icon: <ShieldAlert className="h-4 w-4 text-rose-400" />,
    title: 'ความเสี่ยงสภาพคล่อง',
    description: 'เปรียบเทียบทางเลือกด้านเงินทุนและกระแสเงินสด',
    prompt: 'ประเมินความเสี่ยงสภาพคล่องทางการเงินภายใต้ภาวะอัตราดอกเบี้ยผันผวน เปรียบเทียบทางเลือกการระดมทุนและผลกระทบต่อสภาพคล่อง',
    badge: 'Risk / Treasury',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
  },
  {
    icon: <Scale className="h-4 w-4 text-amber-400" />,
    title: 'รับมือสงครามราคา',
    description: 'วิเคราะห์ churn, margin และทางเลือกเชิงกลยุทธ์',
    prompt: 'วิเคราะห์ผลกระทบเมื่อคู่แข่งลดราคา 20% ประเมิน churn rate ความยืดหยุ่นของกำไร และทางเลือกในการรับมือโดยไม่ทำลาย brand equity',
    badge: 'Competitive',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
  },
  {
    icon: <Workflow className="h-4 w-4 text-cyan-400" />,
    title: 'เปลี่ยนผ่านสู่ระบบอัตโนมัติ',
    description: 'ประเมิน ROI ความพร้อม และผลกระทบต่อทีม',
    prompt: 'ประเมินความพร้อมขององค์กรในการนำระบบอัตโนมัติมาทดแทนงาน routine วิเคราะห์ ROI ความเสี่ยงด้านการเปลี่ยนแปลง และแผนดำเนินการแบบเป็นระยะ',
    badge: 'Operations',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
  },
];

export const Home: React.FC<HomeProps> = ({
  onExecute,
  isAuthenticated,
  onOpenAuth,
  onOpenSettings,
  onViewArchitecture,
  onLearnPCA,
  onSelectActivity,
  onNavigateDocs,
  tone,
  setTone,
  deepReasoning,
  setDeepReasoning,
  reasoningProfile,
  setReasoningProfile,
  selectedModel: selectedModelProp,
  setSelectedModel: setSelectedModelProp,
  webSearch = true,
  onToggleWebSearch,
  isAnalyzing = false,
}) => {
  const { conversations, selectConversation, openDrawer } = useConversation();
  const { theme, toggleTheme } = useTheme();
  const modelContext = useModel();
  const selectedModel = selectedModelProp || modelContext.selectedModel;
  const setSelectedModel = setSelectedModelProp || modelContext.setSelectedModel;
  const isLight = theme === 'light';

  const currentUid = auth.currentUser?.uid || null;

  const [prompt, setPrompt] = useState(() => {
    try {
      return safeLocalStorage.getItem(getDraftPromptStorageKey(currentUid)) || '';
    } catch {
      return '';
    }
  });

  // Sync draft prompt and clear attachments on account switch
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      const uid = u?.uid || null;
      const saved = safeLocalStorage.getItem(getDraftPromptStorageKey(uid)) || '';
      setPrompt(saved);
      setAttachments([]);
    });
    return () => unsub();
  }, []);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 250);
    return () => {
      window.clearTimeout(timer);
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    };
  }, []);

  const processFileList = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const parsedFiles = await Promise.all(Array.from(files).map((file) => readFileAsAttachedFile(file)));
      setAttachments((prev) => [...prev, ...parsedFiles]);
    } catch (error) {
      console.error('Failed to parse uploaded files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const imageFiles = extractImagesFromClipboardEvent(event);
    if (imageFiles.length > 0) {
      event.preventDefault();

      const oversized = imageFiles.filter((f) => f.size > MAX_ATTACHMENT_SIZE_BYTES);
      if (oversized.length > 0) {
        alert(`ไฟล์รูปภาพมีขนาดใหญ่เกินกำหนด (${formatFileSize(MAX_ATTACHMENT_SIZE_BYTES)})`);
        return;
      }

      await processFileList(imageFiles);
    }
  };

  const handleSubmit = () => {
    if (!prompt.trim() && attachments.length === 0) return;

    if (!isAuthenticated) {
      safeLocalStorage.setItem(getDraftPromptStorageKey(auth.currentUser?.uid || null), prompt);
      onOpenAuth();
      return;
    }

    onExecute(prompt, attachments, tone, deepReasoning, reasoningProfile);
    setPrompt('');
    setAttachments([]);
    safeLocalStorage.removeItem(getDraftPromptStorageKey(auth.currentUser?.uid || null));
  };

  const handleQuickExecute = (quickPrompt: string) => {
    if (!isAuthenticated) {
      setPrompt(quickPrompt);
      safeLocalStorage.setItem(getDraftPromptStorageKey(auth.currentUser?.uid || null), quickPrompt);
      onOpenAuth();
      return;
    }
    onExecute(quickPrompt, attachments, tone, deepReasoning, reasoningProfile);
    setPrompt('');
    setAttachments([]);
    safeLocalStorage.removeItem(getDraftPromptStorageKey(auth.currentUser?.uid || null));
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'document':
        return <FileText className="h-4 w-4 shrink-0 text-cyan-400" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-400" />;
      case 'code':
        return <FileCode className="h-4 w-4 shrink-0 text-amber-400" />;
      case 'image':
        return <ImageIcon className="h-4 w-4 shrink-0 text-purple-400" />;
      default:
        return <FileGeneric className="h-4 w-4 shrink-0 text-slate-400" />;
    }
  };

  const getTimeAgo = (dateInput?: string | number | Date) => {
    if (!dateInput) return '';
    try {
      const date = new Date(dateInput);
      const diffMs = Date.now() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'เมื่อสักครู่';
      if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr} ชม.ที่แล้ว`;
      const diffDay = Math.floor(diffHr / 24);
      return `${diffDay} วันที่แล้ว`;
    } catch {
      return '';
    }
  };

  // Enterprise styling tokens
  const card = isLight
    ? 'border-slate-200/90 bg-white/95 shadow-sm'
    : 'border-white/[0.08] bg-[#0c1122]/80 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.4)]';

  const cardInteractive = isLight
    ? 'border-slate-200 bg-white/90 hover:border-amber-500/50 hover:shadow-md'
    : 'border-white/[0.08] bg-white/[0.02] hover:border-amber-500/40 hover:bg-white/[0.04]';

  const muted = isLight ? 'text-slate-500' : 'text-slate-400';
  const heading = isLight ? 'text-slate-900' : 'text-white';

  const systemItems = [
    { icon: Layers, label: 'Architecture', value: 'PUNN Predictive Cognitive Architecture (PCA v3.0)', status: 'v3.0' },
    { icon: Server, label: 'Reasoning Stages', value: '12 Formal Evaluation Stages', status: 'Active' },
    { icon: ShieldCheck, label: 'Governance Standard', value: 'ISO 42001 & Human Gate', status: 'Enforced' },
    { icon: Sparkles, label: 'Evidence Engine', value: 'Context & Ground-Truth Aware', status: 'Ground' },
  ];

  const governanceItems = [
    {
      icon: ShieldCheck,
      title: 'Evidence Transparency',
      description: 'แยกข้อเท็จจริง (Fact), บริบท (Context) และข้อสรุป (Inference) อย่างชัดเจน',
      accent: 'text-amber-400',
    },
    {
      icon: Lock,
      title: 'Governed Reasoning',
      description: 'ประเมินความเสี่ยง ผลกระทบ ข้อกฎหมาย และมาตรการบรรเทาเชิงลึก',
      accent: 'text-cyan-400',
    },
    {
      icon: UserCheck,
      title: 'Human Agency Gate',
      description: 'รักษาสิทธิ์ขาดในการอนุมัติและตัดสินใจให้อยู่กับผู้บริหารมนุษย์เสมอ',
      accent: 'text-emerald-400',
    },
  ];

  return (
    <div className={`min-h-[calc(100vh-3.5rem)] w-full px-3 py-4 font-sans sm:px-5 sm:py-6 lg:px-7 ${
      isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#060A16] text-slate-100'
    }`}>
      {/* 3-Column Layout Container */}
      <div className="mx-auto grid w-full max-w-[1680px] items-start gap-5 xl:grid-cols-[270px_minmax(0,1fr)_310px] 2xl:grid-cols-[290px_minmax(0,1fr)_330px]">

        {/* =========================================================================
            LEFT COLUMN: SYSTEM ARCHITECTURE & GOVERNANCE
        ========================================================================= */}
        <aside className="hidden xl:flex xl:flex-col xl:gap-4.5">
          {/* Card 1: System Status & Engine Specs */}
          <div className={`rounded-xl border p-4.5 transition-all ${card}`}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-1.5 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                  <Activity className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <h2 className={`font-mono text-xs font-bold uppercase tracking-widest ${heading}`}>System Architecture</h2>
                  <p className="text-[10px] font-mono text-slate-500">ENGINE SPECS & METRICS</p>
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                READY
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              {systemItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-2.5 group">
                    <div className="mt-0.5 rounded-md border border-white/5 bg-white/[0.03] p-1 text-slate-400 group-hover:text-amber-400 transition-colors">
                      <IconComponent className="h-3.5 w-3.5 shrink-0" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[11px] font-medium ${muted}`}>{item.label}</span>
                        <span className="text-[9px] font-mono font-semibold text-slate-400">{item.status}</span>
                      </div>
                      <div className={`mt-0.5 font-mono text-[11px] font-semibold truncate ${heading}`}>
                        {item.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex flex-col gap-2">
              <button
                type="button"
                onClick={onViewArchitecture}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                  isLight
                    ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                    : 'border-white/[0.08] bg-white/[0.03] hover:border-amber-500/30 hover:bg-white/[0.06] text-slate-200'
                }`}
              >
                <span>View PCA Blueprint</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateDocs?.('iso42001')}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                  isLight
                    ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                    : 'border-white/[0.08] bg-white/[0.03] hover:border-amber-500/30 hover:bg-white/[0.06] text-slate-200'
                }`}
              >
                <span>ISO 42001 Standard</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Card 2: Governance & Epistemic Principles */}
          <div className={`rounded-xl border p-4.5 transition-all ${card}`}>
            <div className="mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-1.5 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <h2 className={`font-mono text-xs font-bold uppercase tracking-widest ${heading}`}>Governance</h2>
                  <p className="text-[10px] font-mono text-slate-500">TRUST & COMPLIANCE</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {governanceItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-2.5">
                    <div className={`mt-0.5 rounded-md border border-white/5 bg-white/[0.03] p-1 shrink-0 ${item.accent}`}>
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold ${heading}`}>{item.title}</div>
                      <div className={`mt-0.5 text-[11px] leading-4.5 ${muted}`}>{item.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={onLearnPCA}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <span>เรียนรู้รายละเอียด PCA Framework</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* =========================================================================
            CENTER COLUMN: HERO, COMMAND CONSOLE, 3-STEP FLOW, PCA BANNER
        ========================================================================= */}
        <main className="min-w-0 flex flex-col gap-6">

          {/* Section 1: Hero Section with Animated Flame Logo */}
          <section className="mx-auto flex w-full max-w-3xl flex-col items-center text-center pt-2 sm:pt-4">
            {/* Animated Flame Logo Component */}
            <AnimatedFlameLogo showTitle={true} />

            {/* Subtitle */}
            <p className="mt-3.5 max-w-xl px-2 text-xs font-medium tracking-wide text-amber-400 sm:text-sm">
              Enterprise Decision Intelligence & PUNN Predictive Cognitive Architecture (PCA)
            </p>

            {/* Thai Mission Statement */}
            <p className={`mt-2 max-w-2xl px-3 text-xs leading-relaxed sm:text-[13px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              “แพลตฟอร์มปัญญาการตัดสินใจที่ช่วยวิเคราะห์ ตรวจสอบ และทำให้การตัดสินใจของมนุษย์เป็นระบบมากขึ้น”
            </p>

            {/* Pipeline Chips */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 font-mono text-[11px] font-semibold">
              <span className="rounded-md border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-cyan-400">CONTEXT</span>
              <span className="text-slate-600">•</span>
              <span className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-amber-400">EVIDENCE</span>
              <span className="text-slate-600">•</span>
              <span className="rounded-md border border-purple-500/25 bg-purple-500/10 px-2 py-0.5 text-purple-400">REASONING</span>
              <span className="text-slate-600">•</span>
              <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-emerald-400">HUMAN DECISION</span>
            </div>

          </section>


          {/* Section 2: Command Console Input */}
          <section className="mx-auto w-full max-w-3xl">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.csv,.json,.md,.js,.ts,.tsx,.py,.png,.jpg,.jpeg,.xlsx,.xls"
              className="hidden"
              onChange={(event) => event.target.files && processFileList(event.target.files)}
            />

            <div
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                if (event.dataTransfer.files.length) processFileList(event.dataTransfer.files);
              }}
              onPaste={handlePaste as any}
              className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                isDragging
                  ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_35px_rgba(245,158,11,0.25)]'
                  : `${card} focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/25 focus-within:shadow-[0_0_35px_rgba(245,158,11,0.15)]`
              }`}
            >
              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className={`flex max-h-32 flex-wrap gap-2 overflow-y-auto border-b p-3 ${
                  isLight ? 'border-slate-200 bg-slate-50' : 'border-white/[0.08] bg-black/30'
                }`}>
                  {attachments.map((attachment) => {
                    const category = getFileCategory(attachment.type, attachment.name);
                    const isImg = category === 'image' && !!attachment.dataUrl;
                    return (
                      <div
                        key={attachment.id}
                        className={`flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-1 text-xs transition-all ${
                          isLight ? 'border-slate-200 bg-white text-slate-800 shadow-xs' : 'border-white/10 bg-white/[0.05] text-slate-200'
                        }`}
                      >
                        {isImg ? (
                          <img
                            src={attachment.dataUrl}
                            alt={attachment.name}
                            className="w-6 h-6 rounded object-cover border border-slate-600/40 shrink-0"
                          />
                        ) : (
                          getFileIcon(category)
                        )}
                        <span className="max-w-[180px] min-w-0 truncate font-mono text-[11px]" title={attachment.name}>{attachment.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({formatFileSize(attachment.size)})</span>
                        <button
                          type="button"
                          onClick={() => setAttachments((prev) => prev.filter((item) => item.id !== attachment.id))}
                          aria-label={`Remove ${attachment.name}`}
                          className="rounded p-0.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setAttachments([])}
                    className="text-[10px] text-rose-400 hover:underline px-1 py-0.5 self-center cursor-pointer font-mono"
                  >
                    ลบทั้งหมด ({attachments.length})
                  </button>
                </div>
              )}

              {/* Textarea Input */}
              <textarea
                ref={textareaRef}
                value={prompt}
                onPaste={handlePaste}
                onChange={(event) => {
                  const val = event.target.value;
                  setPrompt(val);
                  safeLocalStorage.setItem(getDraftPromptStorageKey(auth.currentUser?.uid || null), val);

                  // Trigger active typing blinking effect
                  setIsTyping(true);
                  if (typingTimerRef.current) {
                    window.clearTimeout(typingTimerRef.current);
                  }
                  typingTimerRef.current = window.setTimeout(() => {
                    setIsTyping(false);
                  }, 1400);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    setIsTyping(false);
                    handleSubmit();
                  } else {
                    setIsTyping(true);
                    if (typingTimerRef.current) {
                      window.clearTimeout(typingTimerRef.current);
                    }
                    typingTimerRef.current = window.setTimeout(() => {
                      setIsTyping(false);
                    }, 1400);
                  }
                }}
                placeholder={
                  isDragging
                    ? 'วางไฟล์ที่นี่เพื่อแนบเป็นบริบทการวิเคราะห์...'
                    : 'ป้อนคำถามเชิงกลยุทธ์ ปัญหาการตัดสินใจ หรือแนบเอกสารเพื่อเริ่มการวิเคราะห์...'
                }
                rows={3}
                className={`min-h-[110px] w-full resize-none bg-transparent px-4.5 py-4 text-sm leading-6 outline-none transition-all sm:min-h-[125px] sm:px-5 sm:py-4.5 sm:text-base ${
                  isLight
                    ? 'text-slate-900 placeholder:text-slate-400'
                    : 'text-slate-100 placeholder:text-slate-500'
                }`}
              />

              {/* Console Toolbar Bottom */}
              <div className={`flex min-w-0 flex-wrap items-center justify-between gap-2 border-t px-3 py-2.5 sm:px-4 ${
                isLight ? 'border-slate-200 bg-slate-50/80' : 'border-white/[0.06] bg-black/40'
              }`}>
                {/* Left Controls: File upload, Web search toggle, Settings */}
                <div className="flex items-center gap-1">
                  {/* Attach Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    aria-label="Attach file"
                    title="แนบเอกสาร (PDF, CSV, Doc, รูปภาพ)"
                    className={`relative rounded-lg p-2 transition-colors cursor-pointer ${
                      isLight
                        ? 'text-slate-600 hover:bg-slate-200'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Paperclip className="h-4.5 w-4.5" />
                    {attachments.length > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-black">
                        {attachments.length}
                      </span>
                    )}
                  </button>

                  {/* Web Search Toggle */}
                  <button
                    type="button"
                    onClick={onToggleWebSearch || onOpenSettings}
                    aria-label="Toggle web search"
                    title={`การสืบค้นเว็บภายนอก: ${webSearch ? 'เปิดใช้งาน' : 'ปิดอยู่'}`}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-mono transition-colors cursor-pointer ${
                      webSearch
                        ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                        : isLight
                        ? 'text-slate-400 hover:bg-slate-200'
                        : 'text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline-block">Web {webSearch ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Model / Reasoning Tone Settings */}
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    aria-label="Chat & Model configuration"
                    title="ตั้งค่าโมเดล AI และพารามิเตอร์การคิดวิเคราะห์"
                    className={`rounded-lg p-2 transition-colors cursor-pointer ${
                      isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <Sliders className="h-3.5 w-3.5 text-amber-400" />
                  </button>

                  {/* Theme Switch */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    title="สลับโหมด Dark / Light"
                    className={`rounded-lg p-2 transition-colors cursor-pointer ${
                      isLight ? 'text-amber-600 hover:bg-amber-100' : 'text-amber-400 hover:bg-white/10'
                    }`}
                  >
                    {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </button>
                </div>

                {/* Right: EXECUTE Button */}
                {(() => {
                  const hasContent = Boolean(prompt.trim() || attachments.length > 0);
                  const isBlinking = hasContent && isTyping;

                  return (
                    <div className="relative inline-flex items-center">
                      {/* Active typing radiating glow ring */}
                      {isBlinking && (
                        <span
                          className="absolute -inset-1 rounded-xl bg-amber-400/45 blur-sm animate-ping pointer-events-none"
                          aria-hidden="true"
                        />
                      )}

                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!hasContent}
                        title={
                          !hasContent
                            ? 'กรุณากรอกข้อความหรือแนบเอกสารก่อนรันคำสั่ง'
                            : 'ประมวลผลคำสั่งเชิงวิเคราะห์ (กด Enter หรือคลิกเพื่อรัน)'
                        }
                        className={`relative z-10 inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2 font-mono text-xs font-bold tracking-[0.14em] transition-all duration-200 cursor-pointer ${
                          !hasContent
                            ? 'cursor-not-allowed border-white/5 bg-white/5 text-slate-500'
                            : isBlinking
                            ? 'border-amber-300 bg-amber-400 text-slate-950 font-black shadow-[0_0_30px_rgba(245,158,11,0.9)] animate-[fk-execute-blink_0.75s_ease-in-out_infinite]'
                            : 'border-amber-400/90 bg-amber-500 text-slate-950 shadow-[0_0_22px_rgba(245,158,11,0.45)] hover:bg-amber-400 animate-[pulse_2.2s_ease-in-out_infinite] active:scale-[0.98]'
                        }`}
                      >
                        <span>EXECUTE</span>
                        <Flame
                          className={`h-3.5 w-3.5 fill-current transition-transform ${
                            isBlinking
                              ? 'text-slate-950 animate-[fk-flame-flicker_0.4s_ease-in-out_infinite]'
                              : hasContent
                              ? 'text-slate-950 animate-[fk-flame-motion_2.5s_ease-in-out_infinite]'
                              : 'text-slate-500'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Bottom Disclaimer */}
            <div className="mt-2.5 flex items-center justify-center gap-2 px-2 text-xs text-slate-400 sm:text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>AI ช่วยสนับสนุนข้อมูลและวิเคราะห์ — สิทธิ์การตัดสินใจยังคงเป็นของมนุษย์เสมอ</span>
            </div>
          </section>

          {/* Section 3: 3-Step Decision Flow */}
          <section className="mx-auto w-full max-w-3xl">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  number: '01',
                  label: 'CONTEXT',
                  title: 'ทำความเข้าใจบริบท',
                  desc: 'สำรวจสภาพแวดล้อม ตัวแปร และกรอบปัญหาอย่างรอบด้าน',
                  color: 'text-cyan-400 border-cyan-500/25',
                },
                {
                  number: '02',
                  label: 'EVIDENCE',
                  title: 'ตรวจสอบหลักฐาน',
                  desc: 'แยกแยะสมมติฐาน ข้อเท็จจริง และข้อมูลที่ไม่ทราบค่า',
                  color: 'text-amber-400 border-amber-500/25',
                },
                {
                  number: '03',
                  label: 'DECISION',
                  title: 'คืนอำนาจให้คน',
                  desc: 'สังเคราะห์ทางเลือก ความเสี่ยง และส่งมอบให้ผู้บริหารอนุมัติ',
                  color: 'text-emerald-400 border-emerald-500/25',
                },
              ].map((step) => (
                <div
                  key={step.number}
                  className={`rounded-xl border p-3.5 text-left transition-all ${card}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-xs font-bold ${step.color.split(' ')[0]}`}>{step.number}</span>
                    <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider ${step.color}`}>
                      {step.label}
                    </span>
                  </div>
                  <div className={`mt-2 font-mono text-xs font-bold ${heading}`}>{step.title}</div>
                  <div className={`mt-1 text-[11px] leading-4.5 ${muted}`}>{step.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: PUNN Predictive Cognitive Architecture (PCA) Banner */}
          <section className="mx-auto w-full max-w-3xl">
            <div className={`rounded-xl border p-4 sm:p-5 transition-all ${card}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-400" />
                    <h3 className={`font-mono text-xs sm:text-sm font-bold tracking-widest uppercase ${heading}`}>
                      PUNN Predictive Cognitive Architecture (PCA)
                    </h3>
                  </div>
                  <p className={`mt-1 text-xs ${muted}`}>
                    12-Stage Formal Reasoning Pipeline · ISO 42001 Auditable · Human Approval Gate
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onViewArchitecture}
                  className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-mono font-medium text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer sm:self-auto"
                >
                  <span>ดู Architecture</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </section>

          {/* Section 5: Professional Enterprise Footer */}
          <footer className="mx-auto w-full max-w-3xl pt-2 pb-6 border-t border-white/[0.06] text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500 font-mono">
              <span className="text-slate-400 font-medium">FIRE KEEPER v2.5</span>
              <span>•</span>
              <span>Enterprise Decision Intelligence</span>
              <span>•</span>
              <span className="text-amber-500/80">Creator: PUNN</span>
              <span>•</span>
              <span>ISO 42001 Aligned</span>
            </div>
          </footer>
        </main>

        {/* =========================================================================
            RIGHT COLUMN: QUICK START TEMPLATES & RECENT SESSIONS
        ========================================================================= */}
        <aside className="flex flex-col gap-4.5">
          {/* Card 1: Quick Start Prompts */}
          <div className={`rounded-xl border p-4.5 transition-all ${card}`}>
            <div className="mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-1.5 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                  <Zap className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <h2 className={`font-mono text-xs font-bold uppercase tracking-widest ${heading}`}>Quick Start</h2>
                  <p className="text-[10px] font-mono text-slate-500">EXECUTIVE TEMPLATES</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
              {QUICK_EXAMPLES.map((example) => (
                <button
                  key={example.title}
                  type="button"
                  onClick={() => handleQuickExecute(example.prompt)}
                  className={`group rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 cursor-pointer ${cardInteractive}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0 rounded-md border border-white/5 bg-white/[0.03] p-1">
                      {example.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-semibold truncate ${heading}`}>{example.title}</span>
                        <span className={`rounded border px-1.5 py-0.2 font-mono text-[9px] font-medium shrink-0 ${example.badgeColor}`}>
                          {example.badge}
                        </span>
                      </div>
                      <div className={`mt-1 text-[11px] leading-4.5 ${muted}`}>{example.description}</div>
                    </div>
                    <ChevronRight className={`ml-1 mt-1 h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${muted}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Card 2: Recent Activity / History */}
          <div className={`rounded-xl border p-4.5 transition-all ${card}`}>
            <div className="mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg border border-slate-500/20 bg-slate-500/10 p-1.5">
                  <History className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <h2 className={`font-mono text-xs font-bold uppercase tracking-widest ${heading}`}>Recent Sessions</h2>
                  <p className="text-[10px] font-mono text-slate-500">ACTIVITY LOGS</p>
                </div>
              </div>
              {conversations.length > 0 && (
                <span className="font-mono text-[10px] text-slate-500">
                  {conversations.length} saved
                </span>
              )}
            </div>

            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {conversations.slice(0, 5).map((activity) => (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => {
                    selectConversation(activity.id);
                    onSelectActivity(activity.id);
                  }}
                  className={`group flex w-full items-start justify-between gap-2.5 rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                    isLight
                      ? 'border-slate-100 hover:border-amber-500/30 hover:bg-slate-50'
                      : 'border-white/[0.04] hover:border-amber-500/30 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                    <span className={`min-w-0 text-xs font-medium leading-4.5 line-clamp-2 group-hover:text-amber-400 transition-colors ${heading}`}>
                      {activity.title || 'การวิเคราะห์เชิงกลยุทธ์'}
                    </span>
                  </div>
                  <span className={`shrink-0 font-mono text-[10px] ${muted}`}>
                    {getTimeAgo(activity.updated_at || activity.created_at)}
                  </span>
                </button>
              ))}

              {conversations.length === 0 && (
                <div className={`py-6 text-center text-xs ${muted}`}>
                  ยังไม่มีประวัติการวิเคราะห์
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => openDrawer('history')}
              className={`mt-3.5 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-mono font-medium transition-colors cursor-pointer ${
                isLight
                  ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  : 'border-white/[0.08] bg-white/[0.03] hover:border-amber-500/30 hover:bg-white/[0.06] text-slate-300'
              }`}
            >
              <span>View All History</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
};
