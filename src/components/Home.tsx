import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  BookOpen,
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
} from 'lucide-react';
import { AttachedFile, ToneMode, ReasoningProfile } from '../types';
import { getFileCategory, readFileAsAttachedFile } from '../utils/fileUtils';
import { safeLocalStorage } from '../utils/safeStorage';
import { useConversation } from '../context/ConversationContext';
import { useTheme } from '../context/ThemeContext';

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
  tone: ToneMode;
  setTone: (tone: ToneMode) => void;
  deepReasoning: boolean;
  setDeepReasoning: (deep: boolean) => void;
  reasoningProfile: ReasoningProfile;
  setReasoningProfile: (profile: ReasoningProfile) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isLight?: boolean;
}

const QUICK_EXAMPLES = [
  {
    icon: <Target className="h-4 w-4 text-emerald-500" />,
    title: 'กลยุทธ์ขยายสู่ตลาดใหม่',
    description: 'ประเมินต้นทุน กฎหมาย คู่แข่ง และความเสี่ยง',
    prompt: 'วิเคราะห์ความเป็นไปได้เชิงกลยุทธ์ในการขยายบริการ B2B สู่ตลาดใหม่ เปรียบเทียบทางเลือกและประเมินความเสี่ยง จุดคุ้มทุน และปัจจัยที่ควรตรวจสอบก่อนตัดสินใจ',
  },
  {
    icon: <ShieldAlert className="h-4 w-4 text-rose-500" />,
    title: 'ความเสี่ยงสภาพคล่อง',
    description: 'เปรียบเทียบทางเลือกด้านเงินทุนและกระแสเงินสด',
    prompt: 'ประเมินความเสี่ยงสภาพคล่องทางการเงินภายใต้ภาวะอัตราดอกเบี้ยผันผวน เปรียบเทียบทางเลือกการระดมทุนและผลกระทบต่อสภาพคล่อง',
  },
  {
    icon: <Scale className="h-4 w-4 text-amber-500" />,
    title: 'รับมือสงครามราคา',
    description: 'วิเคราะห์ churn, margin และทางเลือกเชิงกลยุทธ์',
    prompt: 'วิเคราะห์ผลกระทบเมื่อคู่แข่งลดราคา 20% ประเมิน churn rate ความยืดหยุ่นของกำไร และทางเลือกในการรับมือโดยไม่ทำลาย brand equity',
  },
  {
    icon: <Workflow className="h-4 w-4 text-sky-500" />,
    title: 'เปลี่ยนผ่านสู่ระบบอัตโนมัติ',
    description: 'ประเมิน ROI ความพร้อม และผลกระทบต่อทีม',
    prompt: 'ประเมินความพร้อมขององค์กรในการนำระบบอัตโนมัติมาทดแทนงาน routine วิเคราะห์ ROI ความเสี่ยงด้านการเปลี่ยนแปลง และแผนดำเนินการแบบเป็นระยะ',
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
  tone,
  setTone,
  deepReasoning,
  setDeepReasoning,
  reasoningProfile,
  setReasoningProfile,
  selectedModel,
  setSelectedModel,
}) => {
  const { conversations, selectConversation, openDrawer } = useConversation();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  const [prompt, setPrompt] = useState(() => {
    try {
      return safeLocalStorage.getItem('fire_keeper_draft_prompt') || '';
    } catch {
      return '';
    }
  });
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 300);
    return () => window.clearTimeout(timer);
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

  const handleSubmit = () => {
    if (!prompt.trim() && attachments.length === 0) return;

    if (!isAuthenticated) {
      safeLocalStorage.setItem('fire_keeper_draft_prompt', prompt);
      onOpenAuth();
      return;
    }

    onExecute(prompt, attachments, tone, deepReasoning, reasoningProfile);
    setPrompt('');
    setAttachments([]);
    safeLocalStorage.removeItem('fire_keeper_draft_prompt');
  };

  const handleQuickExecute = (quickPrompt: string) => {
    if (!isAuthenticated) {
      setPrompt(quickPrompt);
      safeLocalStorage.setItem('fire_keeper_draft_prompt', quickPrompt);
      onOpenAuth();
      return;
    }
    onExecute(quickPrompt, attachments, tone, deepReasoning, reasoningProfile);
    setPrompt('');
    setAttachments([]);
    safeLocalStorage.removeItem('fire_keeper_draft_prompt');
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'pdf': return <FileText className="h-3.5 w-3.5 shrink-0 text-rose-400" />;
      case 'data': return <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-emerald-400" />;
      case 'code': return <FileCode className="h-3.5 w-3.5 shrink-0 text-sky-400" />;
      case 'image': return <ImageIcon className="h-3.5 w-3.5 shrink-0 text-purple-400" />;
      default: return <FileGeneric className="h-3.5 w-3.5 shrink-0 text-amber-400" />;
    }
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Just now';
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} day ago`;
  };

  const card = isLight
    ? 'border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]'
    : 'border-white/[0.08] bg-[#0B1017]/75 shadow-2xl';
  const muted = isLight ? 'text-slate-500' : 'text-slate-400';
  const heading = isLight ? 'text-slate-900' : 'text-white';

  const systemItems = [
    [Layers, 'Architecture', 'PUNN Cognitive Architecture'],
    [Server, 'Reasoning stages', '12 stages'],
    [ShieldCheck, 'Governance', 'Human approval'],
    [BookOpen, 'Evidence', 'Context-aware'],
  ] as const;

  const governanceItems = [
    [ShieldCheck, 'Evidence-aware', 'แยกหลักฐานออกจากข้อสรุป'],
    [Lock, 'Governed reasoning', 'ตรวจสอบความเสี่ยงและข้อจำกัด'],
    [UserCheck, 'Human authority', 'มนุษย์เป็นผู้อนุมัติการตัดสินใจ'],
  ] as const;

  return (
    <div className={`min-h-[85vh] w-full px-3 py-4 font-sans sm:px-6 sm:py-6 lg:px-8 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
      <div className="mx-auto grid w-full max-w-[1500px] items-start gap-6 xl:grid-cols-[240px_minmax(0,1fr)_300px] 2xl:grid-cols-[260px_minmax(0,1fr)_320px]">

        <aside className="hidden xl:flex xl:flex-col xl:gap-5">
          <div className={`rounded-2xl border p-5 ${card}`}>
            <div className="mb-5 flex items-center gap-2.5">
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-1.5"><Activity className="h-4 w-4 text-orange-500" /></div>
              <h2 className={`font-mono text-xs font-bold uppercase tracking-widest ${heading}`}>System</h2>
            </div>
            <div className="space-y-4 text-sm">
              {systemItems.map(([Icon, label, value]) => {
                const Component = Icon as React.ElementType;
                return (
                  <div key={label} className="flex items-start gap-3">
                    <Component className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <div className="min-w-0"><div className={muted}>{label}</div><div className={`mt-0.5 text-xs font-medium ${heading}`}>{value}</div></div>
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={onViewArchitecture} className={`mt-5 flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-medium ${isLight ? 'border-slate-200 bg-slate-50 hover:bg-slate-100' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
              View Architecture <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className={`rounded-2xl border p-5 ${card}`}>
            <div className="mb-4 flex items-center gap-2.5">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /></div>
              <h2 className={`font-mono text-xs font-bold uppercase tracking-widest ${heading}`}>Governance</h2>
            </div>
            <div className="space-y-3.5">
              {governanceItems.map(([Icon, title, description]) => {
                const Component = Icon as React.ElementType;
                return (
                  <div key={title} className="flex gap-3">
                    <Component className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <div className="min-w-0"><div className={`text-xs font-semibold ${heading}`}>{title}</div><div className={`mt-0.5 text-[10px] leading-4 ${muted}`}>{description}</div></div>
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={onLearnPCA} className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-400">เรียนรู้เกี่ยวกับ PCA <ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </aside>

        <main className="min-w-0">
          <section className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <div className="relative mb-4 flex h-24 w-24 items-center justify-center sm:mb-5 sm:h-28 sm:w-28">
              <div className="absolute inset-0 rounded-full border border-dashed border-orange-500/20 animate-[spin_55s_linear_infinite]" />
              <div className="absolute inset-3 rounded-full border border-dotted border-orange-500/25 animate-[spin_38s_linear_infinite_reverse]" />
              <div className="absolute inset-0 rounded-full bg-orange-500/10 blur-3xl" />
              <Flame className="relative z-10 h-10 w-10 stroke-[1.5] text-orange-500 drop-shadow-[0_0_18px_rgba(249,115,22,0.6)] sm:h-12 sm:w-12" />
            </div>

            <h1 className={`font-mono text-3xl font-bold tracking-[0.18em] sm:text-5xl sm:tracking-[0.22em] ${heading}`}>FIRE KEEPER</h1>
            <p className="mt-4 max-w-2xl px-2 text-sm font-semibold leading-6 text-orange-500 sm:text-base">
              แพลตฟอร์มปัญญาการตัดสินใจที่ช่วยวิเคราะห์ ตรวจสอบ และทำให้การตัดสินใจของมนุษย์เป็นระบบมากขึ้น
            </p>
            <div className={`mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[10px] font-bold tracking-[0.16em] sm:text-xs sm:tracking-[0.22em] ${muted}`}>
              <span>CONTEXT</span><span className="text-orange-500">•</span><span>EVIDENCE</span><span className="text-orange-500">•</span><span>REASONING</span><span className="text-orange-500">•</span><span>HUMAN DECISION</span>
            </div>
            <p className={`mt-3 max-w-2xl px-3 text-xs leading-5 sm:text-sm ${muted}`}>
              ขับเคลื่อนด้วย <strong className={heading}>PUNN Cognitive Architecture (PCA)</strong> — ระบบทำงานกับบริบท หลักฐาน และเหตุผล ก่อนคืนสิทธิ์การตัดสินใจให้มนุษย์
            </p>
          </section>

          <section className="mx-auto mt-6 w-full max-w-4xl sm:mt-8">
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
              onDrop={(event) => { event.preventDefault(); setIsDragging(false); if (event.dataTransfer.files.length) processFileList(event.dataTransfer.files); }}
              className={`overflow-hidden rounded-2xl border transition-all ${
                isDragging
                  ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_28px_rgba(249,115,22,0.2)]'
                  : `${card} focus-within:border-orange-500/60 focus-within:shadow-[0_0_30px_rgba(249,115,22,0.12)]`
              }`}
            >
              {attachments.length > 0 && (
                <div className={`flex max-h-28 flex-wrap gap-2 overflow-y-auto border-b p-3 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/20'}`}>
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className={`flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/5'}`}>
                      {getFileIcon(getFileCategory(attachment.type, attachment.name))}
                      <span className="max-w-[160px] truncate font-mono">{attachment.name}</span>
                      <button type="button" onClick={() => setAttachments((prev) => prev.filter((item) => item.id !== attachment.id))} aria-label={`Remove ${attachment.name}`} className="rounded p-0.5 text-slate-400 hover:text-rose-500"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={prompt}
                autoFocus
                onChange={(event) => { setPrompt(event.target.value); safeLocalStorage.setItem('fire_keeper_draft_prompt', event.target.value); }}
                onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSubmit(); } }}
                placeholder={isDragging ? 'วางไฟล์ที่นี่...' : 'ป้อนคำถาม ประเด็นเชิงกลยุทธ์ หรือแนบเอกสารเพื่อเริ่มการวิเคราะห์...'}
                className={`min-h-[118px] w-full resize-none bg-transparent px-4 py-4 text-sm leading-6 outline-none sm:min-h-[130px] sm:px-5 sm:py-5 sm:text-base ${isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-slate-100 placeholder:text-slate-500'}`}
              />

              <div className={`flex min-w-0 items-center justify-between gap-2 border-t px-2.5 py-2.5 sm:px-3 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/[0.08] bg-black/25'}`}>
                <div className="flex min-w-0 items-center gap-0.5 sm:gap-1">
                  <button type="button" onClick={toggleTheme} aria-label="Toggle theme" title="สลับโหมดสี" className={`rounded-lg p-2.5 transition-colors ${isLight ? 'text-amber-600 hover:bg-amber-100' : 'text-amber-400 hover:bg-white/10'}`}>
                    {isLight ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} aria-label="Attach file" title="แนบไฟล์" className={`relative rounded-lg p-2.5 transition-colors ${isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-300 hover:bg-white/10'}`}>
                    <Paperclip className="h-[18px] w-[18px]" />
                    {attachments.length > 0 && <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-orange-500 px-0.5 text-[8px] font-bold text-black">{attachments.length}</span>}
                  </button>
                  <button type="button" onClick={onOpenSettings} aria-label="Web Search settings" title="ตั้งค่าการสืบค้นเว็บ" className={`rounded-lg p-2.5 transition-colors ${isLight ? 'text-slate-600 hover:bg-slate-200 hover:text-sky-600' : 'text-slate-300 hover:bg-white/10 hover:text-sky-400'}`}>
                    <Globe className="h-[18px] w-[18px]" />
                  </button>
                  <button type="button" onClick={onOpenSettings} aria-label="Chat configuration" title="ตั้งค่าโมเดลและการวิเคราะห์" className={`rounded-lg p-2.5 transition-colors ${isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-300 hover:bg-white/10'}`}>
                    <Sliders className="h-[18px] w-[18px]" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!prompt.trim() && attachments.length === 0}
                  title={!prompt.trim() && attachments.length === 0 ? 'กรุณากรอกข้อความหรือแนบเอกสารก่อนรันคำสั่ง' : 'ประมวลผลคำสั่ง'}
                  className={`inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3.5 py-2.5 font-mono text-[11px] font-bold tracking-[0.12em] transition-all sm:px-5 sm:text-xs ${
                    !prompt.trim() && attachments.length === 0
                      ? 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-400 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-500'
                      : 'border-orange-400/80 bg-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.28)] hover:bg-orange-400 active:scale-[0.98]'
                  }`}
                >
                  <span>EXECUTE</span><Flame className="h-4 w-4 text-orange-950" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 px-2 text-[10px] text-slate-400 sm:text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>AI ช่วยวิเคราะห์ — มนุษย์ยังคงเป็นผู้ตัดสินใจ</span>
            </div>
          </section>

          <section className="mx-auto mt-7 grid max-w-4xl grid-cols-3 gap-2 sm:mt-9 sm:gap-3">
            {[
              ["01", "CONTEXT", "เข้าใจบริบท"],
              ["02", "EVIDENCE", "ตรวจสอบหลักฐาน"],
              ["03", "DECISION", "คืนอำนาจให้คน"],
            ].map(([number, label, text]) => (
              <div key={number} className={`rounded-xl border p-3 text-left sm:p-4 ${card}`}>
                <div className="font-mono text-[9px] text-orange-500">{number}</div>
                <div className={`mt-1 font-mono text-[10px] font-bold ${heading}`}>{label}</div>
                <div className={`mt-1 text-[10px] leading-4 sm:text-xs ${muted}`}>{text}</div>
              </div>
            ))}
          </section>

          <section className={`mx-auto mt-5 w-full max-w-4xl rounded-2xl border p-4 sm:mt-6 sm:p-5 ${card}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className={`font-mono text-xs font-bold tracking-widest ${heading}`}>PUNN COGNITIVE ARCHITECTURE</div>
                <div className={`mt-1 text-xs ${muted}`}>12-stage reasoning pipeline · Human Approval Gate</div>
              </div>
              <button type="button" onClick={onViewArchitecture} className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg border border-orange-500/20 px-3 py-2 text-xs font-medium text-orange-500 hover:bg-orange-500/10 sm:self-auto">ดู Architecture <ChevronRight className="h-3.5 w-3.5" /></button>
            </div>
          </section>
        </main>

        <aside className="flex flex-col gap-5">
          <div className={`rounded-2xl border p-4 sm:p-5 ${card}`}>
            <div className="mb-4 flex items-center gap-2.5">
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-1.5"><Zap className="h-4 w-4 text-orange-500" /></div>
              <h2 className={`font-mono text-xs font-bold uppercase tracking-widest ${heading}`}>Quick Start</h2>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
              {QUICK_EXAMPLES.map((example) => (
                <button key={example.title} type="button" onClick={() => handleQuickExecute(example.prompt)} className={`group rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:border-orange-500/40 ${isLight ? 'border-slate-200 bg-slate-50 hover:bg-white' : 'border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.05]'}`}>
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">{example.icon}</div>
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold ${heading}`}>{example.title}</div>
                      <div className={`mt-1 text-[10px] leading-4 ${muted}`}>{example.description}</div>
                    </div>
                    <ChevronRight className={`ml-auto mt-0.5 h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${muted}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={`rounded-2xl border p-4 sm:p-5 ${card}`}>
            <div className="mb-4 flex items-center gap-2.5">
              <div className="rounded-lg border border-slate-500/20 bg-slate-500/10 p-1.5"><History className={`h-4 w-4 ${muted}`} /></div>
              <h2 className={`font-mono text-xs font-bold uppercase tracking-widest ${heading}`}>Recent Activity</h2>
            </div>
            <div className="max-h-48 space-y-3 overflow-y-auto">
              {conversations.slice(0, 6).map((activity) => (
                <button key={activity.id} type="button" onClick={() => { selectConversation(activity.id); onSelectActivity(activity.id); }} className="group flex w-full items-center justify-between gap-3 text-left">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span className={`truncate text-xs font-medium group-hover:text-orange-500 ${heading}`}>{activity.title || 'ไม่มีชื่อการสนทนา'}</span>
                  </span>
                  <span className={`shrink-0 font-mono text-[9px] ${muted}`}>{getTimeAgo(activity.updated_at || activity.created_at)}</span>
                </button>
              ))}
              {conversations.length === 0 && <div className={`py-3 text-center text-xs ${muted}`}>No recent activity</div>}
            </div>
            <button type="button" onClick={() => openDrawer('history')} className={`mt-4 flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-medium ${isLight ? 'border-slate-200 bg-slate-50 hover:bg-slate-100' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
              View All History <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
