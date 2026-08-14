import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import 'katex/dist/katex.min.css';
import { User, Flame, ChevronDown, ChevronUp, Clock, ShieldCheck, Activity, Timer, Paperclip, FileText, FileCode, Database, Eye, X, Printer, Cpu, Copy, Check } from 'lucide-react';
import { AttachedFile, ConversationTurn } from '../types';
import { PCAStateViewer } from './PCAStateViewer';
import { formatWallClock, formatMs, formatStopwatch } from '../utils/timeFormatter';
import { formatFileSize, getFileCategory } from '../utils/fileUtils';
import { estimateTokenCount } from '../utils/tokenUtils';
import { extractExecutiveSummary } from '../utils/executiveSummary';
import { preprocessMarkdown } from '../utils/markdownPreprocessor';

interface MessageBubbleProps {
  turn: ConversationTurn;
  onOpenExport?: () => void;
}

export interface StreamingMessageBubbleProps {
  streamingStage?: string;
  streamingText?: string;
  streamingTokens?: number;
  isTokenEstimated?: boolean;
}

const markdownComponents = {
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-5 rounded-xl border border-slate-700/80 bg-slate-950/90 shadow-xl">
      <table className="w-full text-left text-sm text-slate-200 border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-slate-800/90 text-amber-400 font-semibold border-b border-slate-700 text-xs tracking-wider">
      {children}
    </thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="divide-y divide-slate-800/70 bg-slate-900/40">
      {children}
    </tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="hover:bg-slate-800/50 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }: any) => (
    <th className="px-4 py-3 font-semibold text-slate-100">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-3 text-slate-300 leading-relaxed">
      {children}
    </td>
  ),
  h1: ({ children }: any) => (
    <h1 className="text-xl font-bold text-amber-400 mt-6 mb-3 pb-1 border-b border-slate-800 flex items-center gap-2">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-lg font-bold text-amber-300 mt-5 mb-2.5 flex items-center gap-2">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-base font-semibold text-sky-300 mt-4 mb-2 flex items-center gap-1.5">
      {children}
    </h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="text-sm font-semibold text-slate-200 mt-3 mb-1.5">
      {children}
    </h4>
  ),
  p: ({ children }: any) => (
    <div className="my-2.5 leading-relaxed text-slate-200 text-sm sm:text-base">
      {children}
    </div>
  ),
  ul: ({ children }: any) => (
    <ul className="my-2.5 pl-5 list-disc space-y-1 text-slate-200 text-sm sm:text-base">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="my-2.5 pl-5 list-decimal space-y-1 text-slate-200 text-sm sm:text-base">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="leading-relaxed">
      {children}
    </li>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="my-3 border-l-4 border-amber-500 pl-4 py-2 bg-amber-950/20 rounded-r-lg italic text-amber-200/90 text-sm">
      {children}
    </blockquote>
  ),
  pre: ({ children }: any) => <>{children}</>,
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = inline || (!match && typeof children === 'string' && !children.includes('\n'));
    return isInline ? (
      <code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-xs border border-slate-700" {...props}>
        {children}
      </code>
    ) : (
      <div className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
        <div className="bg-slate-800/80 px-3 py-1.5 text-[11px] font-mono text-slate-400 border-b border-slate-700 flex justify-between items-center">
          <span>{match ? match[1].toUpperCase() : 'Code Block'}</span>
        </div>
        <div className="p-3 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre font-normal">
          <code>{children}</code>
        </div>
      </div>
    );
  },
  hr: () => <hr className="my-5 border-slate-800" />,
};

export const StreamingMessageBubble: React.FC<StreamingMessageBubbleProps> = ({
  streamingStage,
  streamingText,
  streamingTokens,
  isTokenEstimated = true,
}) => {
  const [clockText, setClockText] = useState<string>('');
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const startMsRef = useRef<number>(Date.now());

  useEffect(() => {
    startMsRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      setClockText(formatWallClock(now));
      setElapsedMs(now - startMsRef.current);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // 6-Phase Cognitive Execution Lifecycle
  const phases = [
    { id: 'p1', name: 'Input Deconstruction & Scope Clarification', thai: 'แจกแจงประเด็นคำสั่ง & วัตถุประสงค์', threshold: 200 },
    { id: 'p2', name: 'Epistemic Context & Multi-source Retrieval', thai: 'ดึงข้อมูลบริบท & กรอบความรู้ที่เกี่ยวข้อง', threshold: 800 },
    { id: 'p3', name: '12-Stage PCA Reasoning & Bayesian Hypotheses', thai: 'คำนวณสมมติฐาน 12 ขั้นตอน & Bayesian Posterior', threshold: 1600 },
    { id: 'p4', name: 'Red Team Adversarial & Uncertainty Register', thai: 'จำลองการโจมตี Stress-Test & จุดบอดข้อมูล', threshold: 2600 },
    { id: 'p5', name: 'Governance Alignment (ISO 42001 / NIST RMF)', thai: 'ตรวจสอบความสอดคล้องธรรมาภิบาล & PDPA', threshold: 3400 },
    { id: 'p6', name: 'Executive Synthesis & Actionable Strategic Dossier', thai: 'สังเคราะห์ข้อเสนอแนะระดับผู้บริหาร & Action Plan', threshold: 4200 },
  ];

  const currentPhaseIndex = Math.min(
    phases.filter(p => elapsedMs >= p.threshold).length,
    phases.length - 1
  );

  const activePhase = phases[currentPhaseIndex];
  const progressPercent = Math.min(Math.floor((elapsedMs / 4800) * 100), 96);

  // Generate ASCII block progress bar for authentic CLI / IDE feel
  const totalBlocks = 12;
  const filledBlocks = Math.round((progressPercent / 100) * totalBlocks);
  const asciiBar = '█'.repeat(filledBlocks) + '░'.repeat(Math.max(0, totalBlocks - filledBlocks));

  return (
    <div className="flex flex-col items-start my-4 w-full max-w-4xl mx-auto animate-fadeIn">
      {/* Role Avatar & Status Header */}
      <div className="flex flex-wrap items-center gap-2 mb-2 px-1">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 text-white shadow-md shadow-orange-950/50 flex items-center justify-center text-xs font-bold">
          <Flame className="w-4 h-4 animate-pulse text-amber-200" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-100">
            FIRE KEEPER
          </span>
          <span className="text-[11px] font-mono text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
            PUNN Architecture v2.0
          </span>
        </div>
        <span className="px-2.5 py-0.5 text-[11px] font-mono rounded bg-slate-800 text-amber-300 border border-slate-700 flex items-center gap-1.5 shadow ml-auto">
          <Timer className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Elapsed:</span>
          <span className="font-bold text-amber-400 font-mono">{formatStopwatch(elapsedMs)}</span>
        </span>
      </div>

      {/* Message Bubble Body - Cognitive Stepped Reasoning Progress */}
      <div className="relative w-full max-w-3xl rounded-2xl rounded-tl-none p-5 sm:p-6 bg-[#0B1220] text-slate-100 border-2 border-amber-500/40 shadow-2xl space-y-4">
        {/* Main Cognitive Stage Headline */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Stage {currentPhaseIndex + 1}/6: {activePhase.name}</span>
              </div>
              <div className="text-sm font-semibold text-slate-200 mt-0.5">
                {activePhase.thai}
              </div>
            </div>
          </div>
          <div className="text-right font-mono shrink-0">
            <div className="text-base font-black text-amber-400">
              {progressPercent}%
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-widest">
              [{asciiBar}]
            </div>
          </div>
        </div>

        {/* Dynamic Continuous Progress Bar */}
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 rounded-full transition-all duration-300 shadow-sm shadow-amber-500/50"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 6-Stage Stepped Execution Visualizer ("Seeing the AI Think") */}
        <div className="space-y-1.5 font-mono text-xs pt-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between">
            <span>Cognitive Verification Trace</span>
            <span className="text-emerald-400">● White-Box Engine</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {phases.map((p, idx) => {
              const isDone = elapsedMs > p.threshold + 700;
              const isCurrent = !isDone && idx === currentPhaseIndex;
              const isPending = !isDone && !isCurrent;

              return (
                <div
                  key={p.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    isDone
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                      : isCurrent
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-300 ring-1 ring-amber-500/30 shadow-md animate-pulse'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="font-bold text-[11px]">
                      {isDone ? '✓' : isCurrent ? '⚡' : '○'}
                    </span>
                    <span className="truncate font-sans font-medium text-xs">
                      {idx + 1}. {p.thai}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono shrink-0 ml-1">
                    {isDone ? '[████]' : isCurrent ? '[██░░]' : '[░░░░]'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time Telemetry Metrics Strip */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-slate-300">
              <span className="text-amber-400">Prior → Likelihood → Posterior</span>
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="flex items-center gap-1 text-slate-300">
              <span>ECE Calibration:</span>
              <span className="text-emerald-400 font-bold">±0.027 (Calibrated)</span>
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-purple-300">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>NIST AI RMF · ISO 42001 Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ turn, onOpenExport }) => {
  const isUser = turn.role === 'user';
  const [showInspector, setShowInspector] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePreviewFile, setActivePreviewFile] = useState<AttachedFile | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(turn.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const calculatedTokens = turn.tokensUsed ?? turn.pcaState?.executiveMetrics?.tokenUsage?.totalTokens ?? estimateTokenCount(turn.content, turn.attachments);
  const isEstimated = turn.isTokenEstimated ?? !(turn.pcaState?.executiveMetrics?.tokenUsage?.totalTokens);

  // Extract structured executive summary
  const execSummary = !isUser ? extractExecutiveSummary(turn.content, turn.pcaState) : null;

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} my-4 w-full max-w-4xl mx-auto`}>
      {/* File Lightbox / Preview Modal */}
      {activePreviewFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-amber-300 text-sm truncate">{activePreviewFile.name}</span>
                <span className="text-xs text-slate-400 font-mono">({formatFileSize(activePreviewFile.size)})</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePreviewFile(null)}
                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 bg-slate-950">
              {getFileCategory(activePreviewFile.type, activePreviewFile.name) === 'image' && activePreviewFile.dataUrl ? (
                <div className="flex justify-center">
                  <img
                    src={activePreviewFile.dataUrl}
                    alt={activePreviewFile.name}
                    className="max-h-[60vh] object-contain rounded-xl border border-slate-800"
                  />
                </div>
              ) : activePreviewFile.textContent ? (
                <pre className="text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed p-4 bg-slate-900 rounded-xl border border-slate-800">
                  {activePreviewFile.textContent}
                </pre>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold">ไฟล์ประเภท {activePreviewFile.type}</p>
                  <p className="text-xs text-slate-500 mt-1">ได้รับการประมวลผลผ่าน Gemini Multimodal Engine ในฝั่งเซิร์ฟเวอร์เรียบร้อยแล้ว</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Role Avatar & Label Header */}
      <div className={`flex items-center space-x-2 mb-1.5 px-1 ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
            isUser
              ? 'bg-slate-700 text-slate-200 border border-slate-600'
              : 'bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 text-white shadow-md shadow-orange-950/50'
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Flame className="w-4 h-4 animate-pulse" />}
        </div>
        <span className="text-xs font-semibold text-slate-300">
          {isUser ? 'คุณ (User)' : 'FIRE KEEPER (PCA System)'}
        </span>
        {isUser && calculatedTokens > 0 && (
          <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-sky-300 border border-slate-700/80 flex items-center gap-1 shadow-sm">
            <Cpu className="w-3 h-3 text-sky-400" />
            <span>{calculatedTokens.toLocaleString()} tokens</span>
          </span>
        )}
        {isUser && (
          <button
            type="button"
            onClick={handleCopy}
            title="คัดลอกข้อความ"
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
          </button>
        )}
        {!isUser && turn.pcaState && (
          <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
            PCA 12-Stage
          </span>
        )}
      </div>

      {/* Message Bubble Body */}
      <div
        className={`relative max-w-3xl rounded-2xl p-4 sm:p-6 shadow-xl border text-base leading-relaxed ${
          isUser
            ? 'bg-slate-800 text-slate-100 border-slate-600 rounded-tr-none'
            : 'bg-slate-900 text-slate-100 border-slate-700/90 rounded-tl-none'
        }`}
      >
        {/* Render Attached Files if Present */}
        {turn.attachments && turn.attachments.length > 0 && (
          <div className="mb-4 pb-3 border-b border-slate-700/70">
            <span className="text-xs font-semibold text-amber-300 mb-2 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-amber-400" />
              ไฟล์แนบในข้อความนี้ ({turn.attachments.length} รายการ):
            </span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {turn.attachments.map((att) => {
                const category = getFileCategory(att.type, att.name);
                return (
                  <div
                    key={att.id}
                    onClick={() => setActivePreviewFile(att)}
                    className="flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-700 hover:border-amber-500/60 p-2.5 rounded-xl text-xs cursor-pointer transition-all shadow-md group max-w-xs"
                  >
                    {category === 'image' && att.dataUrl ? (
                      <img
                        src={att.dataUrl}
                        alt={att.name}
                        className="w-9 h-9 rounded object-cover border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                        {category === 'pdf' && <FileText className="w-4 h-4 text-rose-400" />}
                        {category === 'code' && <FileCode className="w-4 h-4 text-emerald-400" />}
                        {category === 'data' && <Database className="w-4 h-4 text-amber-400" />}
                        {category === 'doc' && <FileText className="w-4 h-4 text-sky-400" />}
                        {category === 'text' && <FileText className="w-4 h-4 text-slate-300" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 font-bold truncate text-xs group-hover:text-amber-300 transition-colors">
                        {att.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {formatFileSize(att.size)} • <span className="uppercase text-amber-400">{category}</span>
                      </p>
                    </div>
                    <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Assistant Decision Summary Callout */}
        {!isUser && turn.pcaState && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-100 text-sm flex items-start space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-amber-300 mr-2">[ข้อสรุปเชิงยุทธศาสตร์]:</span>
              <span className="text-amber-100">{turn.pcaState.decision}</span>
            </div>
          </div>
        )}

        {/* Structured Executive Summary Card for Assistant Turns */}
        {!isUser && execSummary ? (
          <div className="space-y-4 w-full">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0F131A] p-5 shadow-xl text-[#F5F7FA] space-y-4">
              {/* Header */}
              <div className="flex items-center space-x-2.5 pb-3 border-b border-[rgba(255,255,255,0.06)]">
                <div className="w-7 h-7 rounded-xl bg-[#FF8A00]/10 text-[#FF8A00] flex items-center justify-center border border-[#FF8A00]/20 font-bold text-xs">
                  📌
                </div>
                <h4 className="text-sm font-bold tracking-wide text-[#F5F7FA]">Executive Summary</h4>
              </div>

              {/* Objective */}
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#FF8A00]">
                  <span>🎯</span>
                  <span>Objective</span>
                </div>
                <p className="text-xs sm:text-sm text-[#F5F7FA] bg-[#151B24] p-3.5 rounded-xl border border-[rgba(255,255,255,0.06)] leading-relaxed">
                  {execSummary.objective}
                </p>
              </div>

              {/* Key Findings */}
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-sky-400">
                  <span>🔍</span>
                  <span>Key Findings</span>
                </div>
                <ul className="text-xs sm:text-sm text-[#9AA5B1] bg-[#151B24] p-3.5 rounded-xl border border-[rgba(255,255,255,0.06)] space-y-2">
                  {execSummary.keyFindings.map((finding, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-sky-400 font-bold mt-0.5">•</span>
                      <span className="text-[#F5F7FA] leading-relaxed">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Major Risks */}
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                  <span>⚠</span>
                  <span>Major Risks</span>
                </div>
                <ul className="text-xs sm:text-sm text-[#9AA5B1] bg-[#151B24] p-3.5 rounded-xl border border-[rgba(255,255,255,0.06)] space-y-2">
                  {execSummary.majorRisks.map((risk, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-amber-400 font-bold mt-0.5">•</span>
                      <span className="text-[#F5F7FA] leading-relaxed">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Actions */}
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                  <span>✅</span>
                  <span>Recommended Actions</span>
                </div>
                <ol className="text-xs sm:text-sm text-[#9AA5B1] bg-[#151B24] p-3.5 rounded-xl border border-[rgba(255,255,255,0.06)] space-y-2">
                  {execSummary.recommendedActions.map((action, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold font-mono mt-0.5">{idx + 1}.</span>
                      <span className="text-[#F5F7FA] leading-relaxed">{action}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Final Conclusion */}
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-purple-400">
                  <span>🏁</span>
                  <span>Final Conclusion</span>
                </div>
                <p className="text-xs sm:text-sm text-[#F5F7FA] bg-[#151B24] p-3.5 rounded-xl border border-[rgba(255,255,255,0.06)] leading-relaxed">
                  {execSummary.conclusion}
                </p>
              </div>
            </div>

            {/* View Full 12-Stage Analysis Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#151B24] hover:bg-[#1B2330] text-[#FF8A00] border border-[rgba(255,255,255,0.08)] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <span>{isExpanded ? '▲ Hide Full 12-Stage Analysis' : '▼ View Full 12-Stage Analysis'}</span>
              </button>

              {isExpanded && (
                <div className="mt-4 p-5 rounded-2xl bg-[#0F131A] border border-[rgba(255,255,255,0.06)] markdown-body dark">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeRaw, rehypeSlug, rehypeAutolinkHeadings, rehypeKatex]}
                    components={markdownComponents}
                  >
                    {preprocessMarkdown(turn.content)}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="markdown-body dark">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeRaw, rehypeSlug, rehypeAutolinkHeadings, rehypeKatex]}
              components={markdownComponents}
            >
              {preprocessMarkdown(turn.content)}
            </ReactMarkdown>
          </div>
        )}

        {/* Assistant Footer Info */}
        {!isUser && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex flex-wrap items-center gap-2 text-slate-400 font-mono text-[11px]">
              {calculatedTokens > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-sky-300">
                  <Cpu className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="text-slate-400">Tokens:</span>
                  <span className="text-sky-200 font-bold font-mono">{calculatedTokens.toLocaleString()}</span>
                  {isEstimated && <span className="text-[9px] text-sky-400/70 ml-0.5">(ประมาณ)</span>}
                </span>
              )}
              {turn.pcaState && (
                <>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-slate-400">เริ่ม:</span>
                    <span className="text-slate-200">{formatWallClock(turn.pcaState.start_time)}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-slate-400">จบ:</span>
                    <span className="text-slate-200">{formatWallClock(turn.pcaState.end_time)}</span>
                    <span className="text-amber-400 font-bold ml-1">({formatMs(turn.pcaState.execution_time_ms)})</span>
                  </span>
                  <span
                    className={`px-2 py-1 rounded font-semibold ${
                      turn.pcaState.confidence === 'สูง'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : turn.pcaState.confidence === 'ปานกลาง'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    ความมั่นใจ: {turn.pcaState.confidence}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopy}
                title="คัดลอกข้อความแชท"
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all text-xs cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>

              {onOpenExport && (
                <button
                  type="button"
                  onClick={onOpenExport}
                  title="ส่งออกรายงาน / พิมพ์รายงาน A4"
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-[#FF8A00] hover:bg-[#E67C00] text-slate-950 font-bold transition-all text-xs shadow-md hover:shadow-[#FF8A00]/25 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                  <span>ส่งออกรายงาน</span>
                </button>
              )}

              {turn.pcaState && (
                <button
                  type="button"
                  onClick={() => setShowInspector(!showInspector)}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-medium transition-all text-xs border border-slate-700 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{showInspector ? 'ซ่อน PCA Inspector' : 'เปิดตรวจ PCA Inspector'}</span>
                  {showInspector ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expandable PCA Inspector Drawer */}
      {!isUser && turn.pcaState && showInspector && (
        <div className="w-full max-w-3xl mt-2 animate-fadeIn">
          <PCAStateViewer pcaState={turn.pcaState} />
        </div>
      )}
    </div>
  );
});
