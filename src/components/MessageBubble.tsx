import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import 'katex/dist/katex.min.css';
import { User, Flame, ChevronDown, ChevronUp, Clock, ShieldCheck, Activity, Timer, Paperclip, FileText, FileCode, Database, Eye, X, Printer, Cpu, Copy, Check, Info, Square, Zap } from 'lucide-react';
import { AttachedFile, ConversationTurn, ความมั่นใจCalibration } from '../types';
import { formatWallClock, formatMs, formatStopwatch } from '../utils/timeFormatter';
import { formatFileSize, getFileCategory, copyToClipboard } from '../utils/fileUtils';
import { estimateTokenCount, calculateTokenCostTHB, calculateActualTokenCost } from '../utils/tokenUtils';
import { extractExecutiveSummary } from '../utils/executiveSummary';
import { preprocessMarkdown } from '../utils/markdownPreprocessor';
import { exportToHtmlReport } from '../utils/exportUtils';
import { generateการตัดสินใจExecutionTrace } from '../utils/executionTraceEngine';
import { ExecutionTraceModal } from './ExecutionTraceModal';
import { ความมั่นใจCard } from './ความมั่นใจCard';
import { การตัดสินใจGovernanceViewer } from './การตัดสินใจGovernanceViewer';
import { useTheme } from '../context/ThemeContext';
import { useModel } from '../context/ModelContext';
import { formatModelTag, resolveModelDetails } from '../utils/modelUtils';

interface MessageBubbleProps {
  turn: ConversationTurn;
  turnIndex?: number;
  previousTurn?: ConversationTurn;
}

export interface StreamingMessageBubbleProps {
  streamingStage?: string;
  streamingText?: string;
  streamingTokens?: number;
  isTokenEstimated?: boolean;
  onCancel?: () => void;
  onยกเลิก?: () => void;
  modelName?: string;
}

const formatDisplayTime = (isoOrEpoch?: string | number) => {
  if (!isoOrEpoch) return '';
  const d = new Date(isoOrEpoch);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatFullDateTime = (isoOrEpoch?: string | number) => {
  if (!isoOrEpoch) return '';
  const d = new Date(isoOrEpoch);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('th-TH', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
};

const formatDuration = (ms?: number) => {
  if (ms === undefined || ms === null || isNaN(ms) || ms < 0) return '';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(2)} วินาที`;
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = (seconds % 60).toFixed(1);
  return `${minutes} นาที ${remainingSecs} วินาที`;
};

const createMarkdownComponents = (isLight: boolean) => ({
  table: ({ children, node, ...props }: any) => (
    <div className={`table-responsive-wrapper my-4 sm:my-5 rounded-xl border shadow-md overflow-x-auto max-w-full ${
      isLight ? 'border-slate-300 bg-white shadow-sm' : 'border-slate-700/80 bg-slate-950/90 shadow-lg'
    }`}>
      <table className={`w-full text-left text-xs sm:text-sm border-collapse table-auto min-w-[560px] sm:min-w-full ${
        isLight ? 'text-slate-900' : 'text-slate-200'
      }`} {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, node, ...props }: any) => (
    <thead className={`font-bold border-b text-xs tracking-wider ${
      isLight ? 'bg-slate-100/90 text-slate-900 border-slate-300' : 'bg-[#111827] text-amber-400 border-slate-700'
    }`} {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, node, ...props }: any) => (
    <tbody className={`divide-y ${
      isLight ? 'divide-slate-200 bg-white' : 'divide-slate-800/80 bg-slate-900/30'
    }`} {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, node, ...props }: any) => (
    <tr className={`transition-colors ${
      isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
    }`} {...props}>
      {children}
    </tr>
  ),
  th: ({ children, node, ...props }: any) => (
    <th className={`px-3.5 sm:px-4 py-3 sm:py-3.5 font-bold align-top text-xs uppercase tracking-wider border-r last:border-r-0 whitespace-normal ${
      isLight ? 'text-slate-900 bg-slate-100/90 border-slate-200' : 'text-slate-100 bg-[#111827] border-slate-800/60'
    }`} {...props}>
      {children}
    </th>
  ),
  td: ({ children, node, ...props }: any) => (
    <td className={`px-3.5 sm:px-4 py-3 sm:py-3.5 align-top leading-relaxed text-xs sm:text-sm border-r last:border-r-0 ${
      isLight ? 'text-slate-800 border-slate-200 bg-white' : 'text-slate-300 border-slate-800/40'
    }`} {...props}>
      {children}
    </td>
  ),
  h1: ({ children, node, ...props }: any) => (
    <h1 className={`text-lg sm:text-xl font-bold mt-5 sm:mt-7 mb-2.5 sm:mb-3 pb-1.5 border-b flex items-center gap-2 ${
      isLight ? 'text-amber-600 border-slate-200' : 'text-amber-400 border-slate-800'
    }`} {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, node, ...props }: any) => (
    <h2 className={`text-base sm:text-lg font-bold mt-4 sm:mt-6 mb-2 sm:mb-2.5 flex items-center gap-2 ${
      isLight ? 'text-amber-700' : 'text-amber-300'
    }`} {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, node, ...props }: any) => (
    <h3 className={`text-sm sm:text-base font-semibold mt-3.5 sm:mt-5 mb-1.5 sm:mb-2 flex items-center gap-1.5 ${
      isLight ? 'text-sky-700' : 'text-sky-300'
    }`} {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, node, ...props }: any) => (
    <h4 className={`text-xs sm:text-sm font-semibold mt-3 sm:mt-4 mb-1.5 ${
      isLight ? 'text-slate-800' : 'text-slate-200'
    }`} {...props}>
      {children}
    </h4>
  ),
  p: ({ children, node, ...props }: any) => (
    <p className={`my-2 leading-relaxed text-xs sm:text-base break-words ${
      isLight ? 'text-slate-800' : 'text-slate-200'
    }`} {...props}>
      {children}
    </p>
  ),
  ul: ({ children, node, ...props }: any) => (
    <ul className={`my-2 pl-4 sm:pl-5 list-disc space-y-1 text-xs sm:text-base ${
      isLight ? 'text-slate-800' : 'text-slate-200'
    }`} {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, node, ...props }: any) => (
    <ol className={`my-2 pl-4 sm:pl-5 list-decimal space-y-1 text-xs sm:text-base ${
      isLight ? 'text-slate-800' : 'text-slate-200'
    }`} {...props}>
      {children}
    </ol>
  ),
  li: ({ children, node, ...props }: any) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, node, ...props }: any) => (
    <blockquote className={`my-2.5 sm:my-3 border-l-4 border-amber-500 pl-3 sm:pl-4 py-1.5 sm:py-2 rounded-r-lg italic text-xs sm:text-sm ${
      isLight ? 'bg-amber-50 border border-amber-200/80 border-l-amber-500 text-amber-900' : 'bg-amber-950/20 text-amber-200/90'
    }`} {...props}>
      {children}
    </blockquote>
  ),
  pre: ({ children, node, ...props }: any) => <pre {...props}>{children}</pre>,
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = inline || (!match && typeof children === 'string' && !children.includes('\n'));
    return isInline ? (
      <code className={`px-1.5 py-0.5 rounded font-mono text-[11px] sm:text-xs border break-all ${
        isLight ? 'bg-slate-100 text-amber-800 border-slate-300' : 'bg-slate-800 text-amber-300 border-slate-700'
      }`} {...props}>
        {children}
      </code>
    ) : (
      <div className={`my-2.5 sm:my-3 rounded-xl overflow-hidden border max-w-full ${
        isLight ? 'border-slate-300 bg-slate-900' : 'border-slate-800 bg-slate-950'
      }`}>
        <div className="bg-slate-800/80 px-3 py-1 text-[10px] sm:text-[11px] font-mono text-slate-400 border-b border-slate-700 flex justify-between items-center">
          <span>{match ? match[1].toUpperCase() : 'Code Block'}</span>
        </div>
        <div className="p-2.5 sm:p-3 text-[11px] sm:text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre font-normal max-w-full">
          <code>{children}</code>
        </div>
      </div>
    );
  },
  hr: ({ node, ...props }: any) => <hr className={`my-4 sm:my-5 ${isLight ? 'border-slate-200' : 'border-slate-800'}`} {...props} />,
});

export const StreamingMessageBubble: React.FC<StreamingMessageBubbleProps> = (props) => {
  const {
    streamingStage,
    streamingText,
    streamingTokens,
    isTokenEstimated = true,
    onCancel,
    onยกเลิก,
    modelName: rawModelName,
  } = props;

  const handleCancel = onยกเลิก || onCancel;
  const { theme } = useTheme();
  const { selectedModel } = useModel();
  const isLight = theme === 'light';
  const effectiveModelName = rawModelName || selectedModel;
  const modelDetails = resolveModelDetails(effectiveModelName);
  const modelName = modelDetails.displayName;
  const markdownComponents = useMemo(() => createMarkdownComponents(isLight), [isLight]);
  const [clockText, setClockText] = useState<string>('');
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [activeStageIdx, setActiveStageIdx] = useState<number>(0);
  const startMsRef = useRef<number>(Date.now());

  const PCA_REASONING_STAGES = [
    { id: '01', title: 'Intent & Scope', desc: 'จำแนกเจตนาและตีกรอบขอบเขต', icon: '🎯' },
    { id: '02', title: 'Context & Memory', desc: 'ดึงบริบทและความจำระยะยาว', icon: '🧠' },
    { id: '03', title: 'Competing Hypotheses (ACH)', desc: 'สร้างสมมติฐานคู่ขนานประเมินตรรกะ', icon: '⚖️' },
    { id: '04', title: 'Epistemic Taxonomy', desc: 'ประเมิน FACT / INFERENCE / UNKNOWN', icon: '🛡️' },
    { id: '05', title: 'Predictive Synthesis', desc: 'สังเคราะห์คำตอบและตรวจสอบผลกระทบ', icon: '✨' },
  ];

  useEffect(() => {
    startMsRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startMsRef.current;
      setClockText(formatWallClock(now));
      setElapsedMs(elapsed);

      // Dynamically advance PCA reasoning stage animation based on elapsed time if no specific streamingStage provided
      const stageIdx = Math.min(Math.floor(elapsed / 1800), PCA_REASONING_STAGES.length - 1);
      setActiveStageIdx(stageIdx);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-start my-5 w-full max-w-4xl mx-auto animate-fadeIn">
      {/* Dynamic PUNN PCA Architectural Banner */}
      <div className={`w-full max-w-3xl mb-2.5 px-3 py-2 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs backdrop-blur-md transition-all ${
        isLight
          ? 'bg-amber-50/90 border-amber-300/80 text-amber-950 shadow-sm'
          : 'bg-[#0B132B]/90 border-amber-500/30 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.12)]'
      }`}>
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-5 h-5">
            <span className="absolute w-4 h-4 rounded-full bg-amber-400/40 animate-ping" />
            <span className="relative w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <span className="font-mono font-bold tracking-wide uppercase text-[11px] sm:text-xs text-amber-400">
            PUNN Predictive Cognitive Architecture (PCA)
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-semibold">
            PCA v3.0 Active
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-slate-400">{formatMs(elapsedMs)}</span>
          <div className="w-1 h-1 rounded-full bg-amber-400" />
          <span className="text-amber-400 font-semibold">{modelName}</span>
        </div>
      </div>

      {/* Role Avatar & Status Header */}
      <div className="flex items-center justify-between w-full max-w-3xl mb-2 px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 text-white shadow-lg shadow-orange-950/60 flex items-center justify-center text-xs font-bold animate-pulse ring-2 ring-amber-400/40">
              <Flame className="w-4 h-4 text-amber-100 animate-bounce" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
          </div>
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            <span className={`text-xs sm:text-sm font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              FIRE KEEPER Core
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono rounded-full border shadow-sm ${
              isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
              <span>Inference In Progress</span>
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded border ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800/80 text-slate-300 border-slate-700'
            }`}>
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{clockText || formatWallClock(Date.now())}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Message Bubble Body - Animated PCA Pipeline Loading & Streaming State */}
      <div className={`relative w-full max-w-3xl rounded-2xl rounded-tl-none p-4 sm:p-6 shadow-2xl space-y-4 border transition-all duration-300 ${
        isLight 
          ? 'bg-white text-slate-900 border-amber-400/40 shadow-amber-500/5' 
          : 'bg-[#0A101D] text-slate-100 border-amber-500/40 shadow-[0_0_35px_rgba(245,158,11,0.18)]'
      }`}>
        {/* Animated Glowing Top Border Scanner */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
        
        {/* PCA 5-Stage Live Cognitive Pipeline Visualizer */}
        <div className={`rounded-xl p-3 border space-y-2 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-white/10'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-mono pb-1 border-b border-white/5">
            <span className="flex items-center gap-1.5 font-bold text-amber-400">
              <Zap className="w-3.5 h-3.5 animate-spin-slow text-amber-400" />
              <span>PUNN Predictive Cognitive Architecture (PCA) Reasoning Pipeline</span>
            </span>
            <span className="text-slate-400">Step {activeStageIdx + 1}/5</span>
          </div>

          {/* Interactive Steps Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
            {PCA_REASONING_STAGES.map((stage, idx) => {
              const isCurrent = idx === activeStageIdx;
              const isCompleted = idx < activeStageIdx;
              return (
                <div
                  key={stage.id}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    isCurrent
                      ? 'bg-amber-500/20 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)] text-amber-300 scale-[1.02]'
                      : isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 opacity-90'
                        : 'bg-white/5 border-white/5 text-slate-500 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                    <span className="font-bold">{stage.id}</span>
                    <span>{stage.icon}</span>
                  </div>
                  <p className="text-[10px] font-semibold leading-tight line-clamp-1">{stage.title}</p>
                  {isCurrent && (
                    <div className="w-full bg-amber-500/30 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full animate-pulse w-3/4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {!streamingText ? (
          /* Chatbot UI Initial Reasoning State */
          <div className="py-2.5 px-1 sm:px-2 space-y-3">
            <div className="flex items-center gap-3">
              <span className={`text-sm sm:text-base font-bold flex items-center gap-2 ${
                isLight ? 'text-amber-700' : 'text-amber-300'
              }`}>
                🔥 กำลังสังเคราะห์การวิเคราะห์เชิงยุทธศาสตร์…
              </span>
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              ระบบกำลังเชื่อมโยงข้อมูล ประเมินข้อเท็จจริงตามเกณฑ์ Epistemic Taxonomy และคำนวณผลกระทบเชิงคาดการณ์ (Predictive Trajectory)
            </p>
            <div className={`flex flex-wrap items-center gap-2 pt-1.5 text-[11px] font-mono ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                <span>กำลังประมวลผล</span>
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                isLight ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-slate-800 text-amber-300 border-slate-700'
              }`}>
                <Cpu className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                <span>{modelName}</span>
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{clockText || formatWallClock(Date.now())}</span>
              </span>
              {handleCancel && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-sans font-semibold transition-all active:scale-95 cursor-pointer ml-auto shadow-sm ${
                    isLight 
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200' 
                      : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>หยุดการวิเคราะห์</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* When text is streaming */
          <div className="space-y-3">
            <div className={`flex items-center justify-between border-b pb-2 mb-2 ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className={`text-xs font-mono font-bold ${
                  isLight ? 'text-slate-800' : 'text-slate-300'
                }`}>กำลังส่งผลการวิเคราะห์ PUNN PCA...</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  {clockText || formatWallClock(Date.now())}
                </span>
                {handleCancel && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-mono underline ml-1 cursor-pointer"
                  >
                    [ยกเลิก]
                  </button>
                )}
              </div>
            </div>
            
            <div className={`markdown-body ${isLight ? 'light' : 'dark'} max-w-full overflow-hidden break-words w-full`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeSlug, rehypeAutolinkHeadings, rehypeKatex]}
                components={markdownComponents}
              >
                {preprocessMarkdown(streamingText || '')}
              </ReactMarkdown>
              <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse align-middle shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ turn, turnIndex, previousTurn }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const markdownComponents = useMemo(() => createMarkdownComponents(isLight), [isLight]);

  const isUser = turn.role === 'user';
  const [showInspector, setShowInspector] = useState(false);
  const [showExecSummary, setShowExecSummary] = useState(false);
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const [activePreviewFile, setActivePreviewFile] = useState<AttachedFile | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'clean' | 'audit'>('clean');

  const handleCopy = async () => {
    const success = await copyToClipboard(turn.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const outputTokensVal = turn.pcaState?.telemetry?.outputTokens ?? turn.pcaState?.executive_dashboard?.tokenUsage?.completionTokens ?? null;
  const inputTokensVal = turn.pcaState?.telemetry?.inputTokens ?? turn.pcaState?.executive_dashboard?.tokenUsage?.promptTokens ?? null;
  const calculatedTokens = turn.pcaState?.telemetry?.totalTokens ?? turn.pcaState?.executive_dashboard?.tokenUsage?.totalTokens ?? (inputTokensVal !== null && outputTokensVal !== null ? inputTokensVal + outputTokensVal : 0);
  const isEstimated = turn.isTokenEstimated ?? false;

  // Extract structured executive summary
  const execSummary = !isUser ? extractExecutiveSummary(turn.content, turn.pcaState) : null;
  const analysisSeqNum = typeof turnIndex === 'number' ? Math.floor(turnIndex / 2) + 1 : ((turn.pcaState as any)?.cycle_count || 1);
  const turnElementId = `turn-container-${turn.timestamp || (typeof turnIndex === 'number' ? `idx-${turnIndex}` : 'current')}`;

  const turnTime = turn.timestamp || (turn.pcaState as any)?.end_time || (turn.pcaState as any)?.start_time;
  const displayTime = formatDisplayTime(turnTime);
  const fullDateTime = formatFullDateTime(turnTime);
  const assistantModelName = resolveModelDetails(turn.model || turn.pcaState?.llm_model, turn.pcaState?.llm_provider).displayName;

  // Calculate timing & latency between user question and assistant answer
  const userQuestionTime = !isUser 
    ? (turn.userSentTimestamp || (previousTurn?.role === 'user' ? previousTurn.timestamp : undefined) || (turn.pcaState as any)?.start_time)
    : turn.timestamp;
  const displayUserQuestionTime = formatDisplayTime(userQuestionTime);
  const fullUserQuestionTime = formatFullDateTime(userQuestionTime);

  let responseDurationMs = turn.durationMs ?? turn.pcaState?.execution_time_ms ?? (turn.pcaState?.telemetry as any)?.durationMs;
  if ((responseDurationMs === undefined || responseDurationMs === null || responseDurationMs <= 0) && !isUser && userQuestionTime && turnTime) {
    const diff = new Date(turnTime).getTime() - new Date(userQuestionTime).getTime();
    if (diff > 0 && diff < 86400000) {
      responseDurationMs = diff;
    }
  }
  const formattedDuration = formatDuration(responseDurationMs);

  // Generate or retrieve deterministic execution trace
  const executionTrace = useMemo(() => {
    if (isUser) return null;
    if (turn.pcaState?.execution_trace) {
      return turn.pcaState.execution_trace;
    }
    const userQuestion = previousTurn?.role === 'user' ? previousTurn.content : 'วิเคราะห์ประเด็นเชิงยุทธศาสตร์';
    return generateการตัดสินใจExecutionTrace({
      userInput: userQuestion,
      assistantOutput: turn.content,
      pcaState: turn.pcaState,
      modelName: assistantModelName,
      totalDurationMs: responseDurationMs || turn.pcaState?.execution_time_ms || 1250,
      startTimeIso: userQuestionTime,
    });
  }, [isUser, turn, previousTurn, assistantModelName, responseDurationMs, userQuestionTime]);

  // Resolve ความมั่นใจ for assistant message using authoritative backend state
  const confidenceData: ความมั่นใจCalibration | null = useMemo(() => {
    if (isUser) return null;
    if (turn.pcaState?.confidence_calibration) {
      return turn.pcaState.confidence_calibration;
    }
    return null;
  }, [isUser, turn.pcaState]);

  return (
    <div
      id={turnElementId}
      data-fire-keeper-turn="true"
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} my-3 sm:my-4 w-full max-w-full sm:max-w-4xl mx-auto`}
    >
      {/* File Lightbox / Preview Modal */}
      {activePreviewFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className={`border rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden ${
            isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
          }`}>
            <div className={`p-3.5 sm:p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-800 border-slate-700'
            }`}>
              <div className="flex items-center space-x-2 min-w-0">
                <Paperclip className="w-4 h-4 text-amber-500 shrink-0" />
                <span className={`font-bold text-xs sm:text-sm truncate ${
                  isLight ? 'text-slate-900' : 'text-amber-300'
                }`}>{activePreviewFile.name}</span>
                <span className={`text-[11px] sm:text-xs font-mono shrink-0 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>({formatFileSize(activePreviewFile.size)})</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePreviewFile(null)}
                className={`p-1.5 rounded-lg transition-all ml-2 shrink-0 ${
                  isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className={`p-3 sm:p-4 overflow-auto flex-1 ${isLight ? 'bg-slate-50' : 'bg-slate-950'}`}>
              {getFileCategory(activePreviewFile.type, activePreviewFile.name) === 'image' && activePreviewFile.dataUrl ? (
                <div className="flex justify-center">
                  <img
                    src={activePreviewFile.dataUrl}
                    alt={activePreviewFile.name}
                    className={`max-h-[60vh] object-contain rounded-xl border ${
                      isLight ? 'border-slate-300' : 'border-slate-800'
                    }`}
                  />
                </div>
              ) : activePreviewFile.textContent ? (
                <pre className={`text-[11px] sm:text-xs font-mono whitespace-pre-wrap leading-relaxed p-3 sm:p-4 rounded-xl border overflow-x-auto max-w-full ${
                  isLight ? 'text-slate-900 bg-white border-slate-300' : 'text-emerald-300 bg-slate-900 border-slate-800'
                }`}>
                  {activePreviewFile.textContent}
                </pre>
              ) : (
                <div className={`text-center py-12 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <FileText className={`w-12 h-12 mx-auto mb-2 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
                  <p className="text-sm font-semibold">ไฟล์ประเภท {activePreviewFile.type}</p>
                  <p className={`text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>ได้รับการประมวลผลผ่าน AI Engine ในฝั่งเซิร์ฟเวอร์เรียบร้อยแล้ว</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Role Avatar & Label Header */}
      <div className={`flex items-center space-x-2 mb-1.5 px-1 max-w-full flex-wrap gap-1 ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
        <div
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
            isUser
              ? isLight ? 'bg-slate-200 text-slate-700 border border-slate-300' : 'bg-slate-700 text-slate-200 border border-slate-600'
              : 'bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 text-white shadow-md shadow-orange-950/50'
          }`}
        >
          {isUser ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-200" />}
        </div>
        <span className={`text-[11px] sm:text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
          {isUser ? 'คุณ (User)' : 'FIRE KEEPER (PCA System)'}
        </span>

        {/* User Question Timestamp Badge */}
        {isUser && displayTime && (
          <span 
            className={`px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono rounded border flex items-center gap-1 ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800/90 text-slate-300 border-slate-700/80'
            }`}
            title={`เวลาที่ส่งคำถาม: ${fullDateTime}`}
          >
            <Clock className={`w-3 h-3 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
            <span>ถามเมื่อ {displayTime}</span>
          </span>
        )}

        {/* Assistant Response Timestamp Badge */}
        {!isUser && displayTime && (
          <span 
            className={`px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono rounded border flex items-center gap-1 ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800/80 text-slate-300 border-slate-700/70'
            }`}
            title={`เวลาตอบเสร็จสิ้น: ${fullDateTime}`}
          >
            <Clock className="w-3 h-3 text-slate-400" />
            <span>ตอบเมื่อ {displayTime}</span>
          </span>
        )}

        {/* Assistant Response Duration / Latency Badge */}
        {!isUser && formattedDuration && (
          <span 
            className={`px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono rounded border flex items-center gap-1 shadow-sm ${
              isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
            }`}
            title={`ระยะเวลาคำนวณและประมวลผลคำตอบ (ตั้งแต่เริ่มส่งคำถามจนถึงตอบเสร็จ): ${formattedDuration}`}
          >
            <Zap className={`w-3 h-3 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
            <span>ใช้เวลา {formattedDuration}</span>
          </span>
        )}

        {isUser && (turn.model || calculatedTokens > 0) && (() => {
          const rawModel = turn.model || turn.pcaState?.llm_model;
          const modelDetails = resolveModelDetails(rawModel, turn.pcaState?.llm_provider);
          const modelName = formatModelTag(rawModel, turn.pcaState?.llm_provider);
          const costInfo = calculatedTokens > 0 ? calculateActualTokenCost(modelName, inputTokensVal, outputTokensVal) : null;
          return (
            <span className={`px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono rounded border flex items-center gap-1.5 shadow-sm ${
              isLight ? 'bg-slate-100 text-sky-800 border-slate-300' : 'bg-slate-800 text-sky-300 border-slate-700/80'
            }`} title={costInfo ? `ต้นทุน API: ${costInfo.formattedTHB} (${costInfo.formattedUSD}) [Model: ${costInfo.metadata.model}, In: ${inputTokensVal}, Out: ${outputTokensVal}]` : `โมเดลที่ใช้งาน: ${modelDetails.displayName}`}>
              <Cpu className={`w-3 h-3 ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
              <span>{modelDetails.displayName}</span>
              {calculatedTokens > 0 && costInfo && (
                <span className="opacity-80">({calculatedTokens.toLocaleString()} tokens{costInfo.costUSD > 0 ? ` • ${costInfo.formattedTHB}` : ''})</span>
              )}
            </span>
          );
        })()}
        {isUser && (
          <button
            type="button"
            onClick={handleCopy}
            title="คัดลอกข้อความ"
            className={`flex items-center space-x-1 px-1.5 sm:px-2 py-0.5 rounded border text-[9px] sm:text-[10px] transition-all cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
          </button>
        )}
      </div>

      {/* Message Bubble Body */}
      <div
        className={`relative max-w-full sm:max-w-3xl rounded-2xl p-2.5 sm:p-6 shadow-xl border text-xs sm:text-base leading-relaxed overflow-hidden break-words w-full ${
          isUser
            ? isLight ? 'bg-slate-100 text-slate-900 border-slate-300 rounded-tr-none shadow-sm' : 'bg-slate-800 text-slate-100 border-slate-600 rounded-tr-none'
            : isLight ? 'bg-white text-slate-900 border-slate-200 rounded-tl-none shadow-md' : 'bg-slate-900 text-slate-100 border-slate-700/90 rounded-tl-none shadow-xl'
        }`}
      >
        {/* Render Attached Files if Present */}
        {turn.attachments && (turn.attachments?.length ?? 0) > 0 && (
          <div className={`mb-4 pb-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-700/70'}`}>
            <span className={`text-xs font-semibold mb-2 flex items-center gap-1.5 ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
              <Paperclip className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              ไฟล์แนบในข้อความนี้ ({turn.attachments?.length ?? 0} รายการ):
            </span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {turn.attachments?.map((att) => {
                const category = getFileCategory(att.type, att.name);
                return (
                  <div
                    key={att.id}
                    onClick={() => setActivePreviewFile(att)}
                    className={`flex items-center gap-2.5 border p-2.5 rounded-xl text-xs cursor-pointer transition-all shadow-md group max-w-xs ${
                      isLight 
                        ? 'bg-slate-50 hover:bg-white border-slate-300 hover:border-amber-500' 
                        : 'bg-slate-900/90 hover:bg-slate-900 border-slate-700 hover:border-amber-500/60'
                    }`}
                  >
                    {category === 'image' && att.dataUrl ? (
                      <img
                        src={att.dataUrl}
                        alt={att.name}
                        className={`w-9 h-9 rounded object-cover border shrink-0 ${isLight ? 'border-slate-300' : 'border-slate-700'}`}
                      />
                    ) : (
                      <div className={`w-9 h-9 rounded border flex items-center justify-center shrink-0 ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-800 border-slate-700'}`}>
                        {category === 'pdf' && <FileText className="w-4 h-4 text-rose-500" />}
                        {category === 'code' && <FileCode className="w-4 h-4 text-emerald-500" />}
                        {category === 'data' && <Database className="w-4 h-4 text-amber-500" />}
                        {category === 'doc' && <FileText className="w-4 h-4 text-sky-500" />}
                        {category === 'text' && <FileText className={`w-4 h-4 ${isLight ? 'text-slate-600' : 'text-slate-300'}`} />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate text-xs transition-colors ${
                        isLight ? 'text-slate-900 group-hover:text-amber-700' : 'text-slate-200 group-hover:text-amber-300'
                      }`}>
                        {att.name}
                      </p>
                      <p className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {formatFileSize(att.size)} • <span className={`uppercase font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{category}</span>
                      </p>
                    </div>
                    <Eye className={`w-3.5 h-3.5 transition-colors shrink-0 ${isLight ? 'text-slate-400 group-hover:text-amber-600' : 'text-slate-400 group-hover:text-amber-400'}`} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Full Answer (Displayed Directly) */}
        <div className={`markdown-body ${isLight ? 'light' : 'dark'} max-w-full overflow-x-auto overflow-y-visible break-words w-full`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeSlug, rehypeAutolinkHeadings, rehypeKatex]}
            components={markdownComponents}
          >
            {preprocessMarkdown(turn.content)}
          </ReactMarkdown>
        </div>

        {/* Epistemic Calibration Box */}
        {!isUser && confidenceData && (
          <div className="mt-4 min-w-0" data-export-ignore="false">
            <ความมั่นใจCard confidence={confidenceData} />
          </div>
        )}

        {/* การตัดสินใจ Governance Layer */}
        {!isUser && turn.pcaState?.decision_governance && (
          <div className="mt-4 min-w-0" data-export-ignore="false">
            <การตัดสินใจGovernanceViewer decision={turn.pcaState.decision_governance} />
          </div>
        )}

        {/* หลักฐาน Status Footer */}
        {!isUser && executionTrace && (
          <div className={`mt-3 py-2 px-3 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center gap-2 text-[11px] w-full ${
            isLight 
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-slate-900/50 border-slate-800/80 text-slate-300'
          }`}>
             <span className="font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap uppercase">
               {executionTrace.summary_metrics.unverified_claims_count > 0 
                ? <span className="text-amber-500">? Conclusion: Not ตรวจสอบแล้ว</span>
                : executionTrace.summary_metrics.verified_claims_count > 0
                  ? <span className="text-emerald-500">✓ Conclusion: ตรวจสอบแล้ว</span>
                  : <span className="text-sky-500">≈ Conclusion: Inferred</span>
               }
             </span>
             <span className="opacity-80 font-mono italic leading-relaxed break-words">
               {executionTrace.summary_metrics.unverified_claims_count > 0 
                ? '“แหล่งข้อมูลผ่านการตรวจสอบ แต่ข้อสรุปยังไม่ควรตีความว่าเป็นข้อเท็จจริงที่ยืนยันแล้ว (Conclusion remains uncalibrated)”'
                : '“Firekeeper แยกให้คุณเห็นว่าอะไรยืนยันแล้ว อะไรคือการวิเคราะห์ และอะไรที่ยังไม่รู้ — ไม่เดาขึ้นมาเอง”'
               }
             </span>
          </div>
        )}

        {/* Assistant Footer & Human Agency ตรวจสอบย้อนหลัง Indicator */}
        {!isUser && (
          <div className={`mt-4 pt-3 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs w-full ${
            isLight ? 'border-slate-200' : 'border-slate-800/80'
          }`}>
            <div className="flex items-center flex-wrap gap-2 text-[11px] font-mono w-full sm:w-auto">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border font-medium whitespace-nowrap ${
                isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
              }`}>
                🛡️ Human Agency: Advisory
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[10.5px] whitespace-nowrap ${
                isLight ? 'bg-slate-100 text-amber-800 border-slate-300' : 'bg-slate-800 text-amber-300 border-slate-700/80'
              }`} title={`โมเดลที่ตอบ: ${assistantModelName}`}>
                <Cpu className={`w-3 h-3 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                <span>{assistantModelName}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto" data-export-ignore="true">
              <button
                type="button"
                data-export-ignore="true"
                onClick={() => setIsTraceModalOpen(true)}
                title="เปิดดู Execution Trace"
                className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg border transition-all text-xs cursor-pointer font-medium min-h-[40px] whitespace-nowrap ${
                  isLight 
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300' 
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="whitespace-nowrap">Trace</span>
              </button>

              <button
                type="button"
                data-export-ignore="true"
                onClick={async () => {
                  await exportToHtmlReport(
                    [turn],
                    turn.pcaState || null,
                    [],
                    undefined,
                    `FIRE-KEEPER-Turn-${turn.timestamp || Date.now()}`,
                    analysisSeqNum,
                    turnElementId
                  );
                }}
                title="ส่งออกข้อความนี้"
                className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-lg border transition-all text-xs cursor-pointer min-h-[40px] whitespace-nowrap ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="whitespace-nowrap">Export</span>
              </button>

              <button
                type="button"
                data-export-ignore="true"
                onClick={handleCopy}
                title="คัดลอกข้อความ"
                className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-lg border transition-all text-xs cursor-pointer min-h-[40px] whitespace-nowrap ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-slate-400 shrink-0" />}
                <span className="whitespace-nowrap">{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Execution Trace Modal */}
      {isTraceModalOpen && executionTrace && (
        <ExecutionTraceModal
          isOpen={isTraceModalOpen}
          onClose={() => setIsTraceModalOpen(false)}
          trace={executionTrace}
        />
      )}
    </div>
  );
});
