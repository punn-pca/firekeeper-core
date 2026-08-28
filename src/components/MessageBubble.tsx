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
import { ExecutiveDecisionDashboard } from './ExecutiveDecisionDashboard';
import { formatWallClock, formatMs, formatStopwatch } from '../utils/timeFormatter';
import { formatFileSize, getFileCategory, copyToClipboard } from '../utils/fileUtils';
import { estimateTokenCount, calculateTokenCostTHB, calculateActualTokenCost } from '../utils/tokenUtils';
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
    <div className="overflow-x-auto my-3 sm:my-5 rounded-xl border border-slate-700/80 bg-slate-950/90 shadow-xl max-w-full">
      <table className="w-full text-left text-xs sm:text-sm text-slate-200 border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-slate-800/90 text-amber-400 font-semibold border-b border-slate-700 text-[11px] sm:text-xs tracking-wider">
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
    <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-slate-100 whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-3 sm:px-4 py-2 sm:py-3 text-slate-300 leading-relaxed text-xs sm:text-sm">
      {children}
    </td>
  ),
  h1: ({ children }: any) => (
    <h1 className="text-lg sm:text-xl font-bold text-amber-400 mt-4 sm:mt-6 mb-2 sm:mb-3 pb-1 border-b border-slate-800 flex items-center gap-2">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-base sm:text-lg font-bold text-amber-300 mt-3 sm:mt-5 mb-2 flex items-center gap-2">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-sm sm:text-base font-semibold text-sky-300 mt-3 sm:mt-4 mb-1.5 flex items-center gap-1.5">
      {children}
    </h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="text-xs sm:text-sm font-semibold text-slate-200 mt-2.5 sm:mt-3 mb-1">
      {children}
    </h4>
  ),
  p: ({ children }: any) => (
    <div className="my-2 leading-relaxed text-slate-200 text-xs sm:text-base break-words">
      {children}
    </div>
  ),
  ul: ({ children }: any) => (
    <ul className="my-2 pl-4 sm:pl-5 list-disc space-y-1 text-slate-200 text-xs sm:text-base">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="my-2 pl-4 sm:pl-5 list-decimal space-y-1 text-slate-200 text-xs sm:text-base">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="leading-relaxed">
      {children}
    </li>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="my-2.5 sm:my-3 border-l-4 border-amber-500 pl-3 sm:pl-4 py-1.5 sm:py-2 bg-amber-950/20 rounded-r-lg italic text-amber-200/90 text-xs sm:text-sm">
      {children}
    </blockquote>
  ),
  pre: ({ children }: any) => <>{children}</>,
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = inline || (!match && typeof children === 'string' && !children.includes('\n'));
    return isInline ? (
      <code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px] sm:text-xs border border-slate-700 break-all" {...props}>
        {children}
      </code>
    ) : (
      <div className="my-2.5 sm:my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-w-full">
        <div className="bg-slate-800/80 px-3 py-1 text-[10px] sm:text-[11px] font-mono text-slate-400 border-b border-slate-700 flex justify-between items-center">
          <span>{match ? match[1].toUpperCase() : 'Code Block'}</span>
        </div>
        <div className="p-2.5 sm:p-3 text-[11px] sm:text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre font-normal max-w-full">
          <code>{children}</code>
        </div>
      </div>
    );
  },
  hr: () => <hr className="my-4 sm:my-5 border-slate-800" />,
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
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const displayStageText = streamingStage || "Synthesizing strategic options...";

  return (
    <div className="flex flex-col items-start my-4 w-full max-w-4xl mx-auto animate-fadeIn">
      {/* Role Avatar & Status Header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 text-white shadow-md shadow-orange-950/50 flex items-center justify-center text-xs font-bold animate-pulse">
          <Flame className="w-4 h-4 text-amber-200" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-100">
            FIRE KEEPER
          </span>
          <span className="text-[11px] font-mono text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
            PUNN Architecture v2.0
          </span>
        </div>
      </div>

      {/* Message Bubble Body - Minimalist Clean Loading Indicator */}
      <div className="relative w-full max-w-3xl rounded-2xl rounded-tl-none p-5 sm:p-6 bg-[#0B1220] text-slate-100 border-2 border-amber-500/40 shadow-2xl space-y-4">
        
        {!streamingText ? (
          /* Pure minimalist loading state when answer hasn't started streaming */
          <div className="flex items-center gap-4 py-4 px-2">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-sm font-medium text-amber-400 animate-pulse font-mono">
                {displayStageText}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Elapsed: {formatStopwatch(elapsedMs)}
              </span>
            </div>
          </div>
        ) : (
          /* When text is streaming, render only the minimalist text container without the simulation stages/trace */
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-mono text-slate-300 font-bold">Streaming Response...</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Elapsed: {formatStopwatch(elapsedMs)}</span>
            </div>
            
            <div className="markdown-body dark max-w-full overflow-hidden break-words w-full">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeSlug, rehypeAutolinkHeadings, rehypeKatex]}
                components={markdownComponents}
              >
                {preprocessMarkdown(streamingText || '')}
              </ReactMarkdown>
              <span className="inline-block w-1.5 h-4 ml-1 bg-amber-400 animate-pulse align-middle" />
            </div>

            {streamingTokens && (
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Tokens Generated: <strong className="text-slate-300">{streamingTokens}</strong> {isTokenEstimated ? '(est.)' : '(actual)'}</span>
                <span>NIST Enforced</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ turn, onOpenExport }) => {
  const isUser = turn.role === 'user';
  const [showInspector, setShowInspector] = useState(false);
  const [showExecSummary, setShowExecSummary] = useState(false);
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

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} my-3 sm:my-4 w-full max-w-full sm:max-w-4xl mx-auto overflow-hidden`}>
      {/* File Lightbox / Preview Modal */}
      {activePreviewFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 sm:p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <Paperclip className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-amber-300 text-xs sm:text-sm truncate">{activePreviewFile.name}</span>
                <span className="text-[11px] sm:text-xs text-slate-400 font-mono shrink-0">({formatFileSize(activePreviewFile.size)})</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePreviewFile(null)}
                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all ml-2 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 sm:p-4 overflow-auto flex-1 bg-slate-950">
              {getFileCategory(activePreviewFile.type, activePreviewFile.name) === 'image' && activePreviewFile.dataUrl ? (
                <div className="flex justify-center">
                  <img
                    src={activePreviewFile.dataUrl}
                    alt={activePreviewFile.name}
                    className="max-h-[60vh] object-contain rounded-xl border border-slate-800"
                  />
                </div>
              ) : activePreviewFile.textContent ? (
                <pre className="text-[11px] sm:text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed p-3 sm:p-4 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
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
      <div className={`flex items-center space-x-2 mb-1.5 px-1 max-w-full flex-wrap gap-1 ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
        <div
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
            isUser
              ? 'bg-slate-700 text-slate-200 border border-slate-600'
              : 'bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 text-white shadow-md shadow-orange-950/50'
          }`}
        >
          {isUser ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-200" />}
        </div>
        <span className="text-[11px] sm:text-xs font-semibold text-slate-300">
          {isUser ? 'คุณ (User)' : 'FIRE KEEPER (PCA System)'}
        </span>
        {isUser && calculatedTokens > 0 && (() => {
          const modelName = turn.pcaState?.llm_model || 'gemini-3.5-flash-lite';
          const costInfo = calculateActualTokenCost(modelName, inputTokensVal, outputTokensVal);
          return (
            <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono rounded bg-slate-800 text-sky-300 border border-slate-700/80 flex items-center gap-1.5 shadow-sm" title={`ต้นทุน API: ${costInfo.formattedTHB} (${costInfo.formattedUSD}) [Model: ${costInfo.metadata.model}, In: ${inputTokensVal}, Out: ${outputTokensVal}]`}>
              <Cpu className="w-3 h-3 text-sky-400" />
              <span>{calculatedTokens.toLocaleString()} tokens ({costInfo.formattedTHB})</span>
            </span>
          );
        })()}
        {isUser && (
          <button
            type="button"
            onClick={handleCopy}
            title="คัดลอกข้อความ"
            className="flex items-center space-x-1 px-1.5 sm:px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[9px] sm:text-[10px] transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
          </button>
        )}
        {!isUser && turn.pcaState && (
          <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
            PCA 12-Stage
          </span>
        )}
      </div>

      {/* Message Bubble Body */}
      <div
        className={`relative max-w-full sm:max-w-3xl rounded-2xl p-3 sm:p-6 shadow-xl border text-xs sm:text-base leading-relaxed overflow-hidden break-words w-full ${
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

        {/* Modern Tab Switcher */}
        {!isUser && turn.pcaState && (
          <div className="flex border-b border-slate-800/80 mb-5 text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={() => setViewMode('clean')}
              className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
                viewMode === 'clean'
                  ? 'border-amber-500 text-amber-400 font-bold bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>คำตอบที่เรียบง่าย (Clean Answer)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('audit')}
              className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
                viewMode === 'audit'
                  ? 'border-amber-500 text-amber-400 font-bold bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>การตรวจสอบและวิเคราะห์ (Deep Audit & Telemetry)</span>
            </button>
          </div>
        )}

        {/* Assistant Decision Summary Callout (Shown only in Audit mode) */}
        {!isUser && turn.pcaState && viewMode === 'audit' && (
          <div className="space-y-4 mb-4">
            <ExecutiveDecisionDashboard pcaState={turn.pcaState} />
            <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-100 text-sm flex items-start space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-amber-300 mr-2">[ข้อสรุปเชิงยุทธศาสตร์]:</span>
                <span className="text-amber-100">{turn.pcaState.decision}</span>
              </div>
            </div>
          </div>
        )}

        {/* Full 12-Stage Analysis (Displayed Directly by Default) */}
        <div className="markdown-body dark max-w-full overflow-hidden break-words w-full">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeSlug, rehypeAutolinkHeadings, rehypeKatex]}
            components={markdownComponents}
          >
            {preprocessMarkdown(turn.content)}
          </ReactMarkdown>
        </div>

        {/* Optional Collapsible Executive Summary (Hidden by default) */}
        {!isUser && execSummary && (
          <div className="mt-4 w-full">
            <button
              type="button"
              onClick={() => setShowExecSummary(!showExecSummary)}
              className="py-2 px-3.5 rounded-xl bg-[#151B24] hover:bg-[#1B2330] text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <span>{showExecSummary ? '▲ Hide Executive Summary' : '▼ View Executive Summary'}</span>
            </button>

            {showExecSummary && (
              <div className="mt-3 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0F131A] p-3.5 sm:p-5 shadow-xl text-slate-100 space-y-3 sm:space-y-4 max-w-full overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="flex items-center space-x-2.5 pb-2.5 sm:pb-3 border-b border-[rgba(255,255,255,0.06)]">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-[#FF8A00]/10 text-[#FF8A00] flex items-center justify-center border border-[#FF8A00]/20 font-bold text-xs shrink-0">
                    📌
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold tracking-wide text-slate-100">Executive Summary</h4>
                </div>

                {/* Objective */}
                <div className="space-y-1 sm:space-y-1.5">
                  <div className="flex items-center space-x-2 text-[11px] sm:text-xs font-bold text-[#FF8A00]">
                    <span>🎯</span>
                    <span>Objective</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-100 bg-[#151B24] p-2.5 sm:p-3.5 rounded-xl border border-[rgba(255,255,255,0.06)] leading-relaxed break-words">
                    {execSummary.objective}
                  </p>
                </div>

                {/* Key Findings */}
                <div className="space-y-1 sm:space-y-1.5">
                  <div className="flex items-center space-x-2 text-[11px] sm:text-xs font-bold text-sky-400">
                    <span>🔍</span>
                    <span>Key Findings</span>
                  </div>
                  <ul className="text-xs sm:text-sm text-slate-400 bg-[#151B24] p-2.5 sm:p-3.5 rounded-xl border border-[rgba(255,255,255,0.06)] space-y-1.5 sm:space-y-2">
                    {execSummary.keyFindings.map((finding, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-sky-400 font-bold mt-0.5 shrink-0">•</span>
                        <span className="text-slate-100 leading-relaxed break-words">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Major Risks */}
                <div className="space-y-1 sm:space-y-1.5">
                  <div className="flex items-center space-x-2 text-[11px] sm:text-xs font-bold text-amber-400">
                    <span>⚠</span>
                    <span>Major Risks</span>
                  </div>
                  <ul className="text-xs sm:text-sm text-slate-400 bg-[#151B24] p-2.5 sm:p-3.5 rounded-xl border border-[rgba(255,255,255,0.06)] space-y-1.5 sm:space-y-2">
                    {execSummary.majorRisks.map((risk, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-amber-400 font-bold mt-0.5 shrink-0">•</span>
                        <span className="text-slate-100 leading-relaxed break-words">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Actions */}
                <div className="space-y-1 sm:space-y-1.5">
                  <div className="flex items-center space-x-2 text-[11px] sm:text-xs font-bold text-emerald-400">
                    <span>✅</span>
                    <span>Recommended Actions</span>
                  </div>
                  <ol className="text-xs sm:text-sm text-slate-400 bg-[#151B24] p-2.5 sm:p-3.5 rounded-xl border border-[rgba(255,255,255,0.06)] space-y-1.5 sm:space-y-2">
                    {execSummary.recommendedActions.map((action, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-emerald-400 font-bold font-mono mt-0.5 shrink-0">{idx + 1}.</span>
                        <span className="text-slate-100 leading-relaxed break-words">{action}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Final Conclusion */}
                <div className="space-y-1 sm:space-y-1.5">
                  <div className="flex items-center space-x-2 text-[11px] sm:text-xs font-bold text-purple-400">
                    <span>🏁</span>
                    <span>Final Conclusion</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-100 bg-[#151B24] p-2.5 sm:p-3.5 rounded-xl border border-[rgba(255,255,255,0.06)] leading-relaxed break-words">
                    {execSummary.conclusion}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assistant Footer Info */}
        {!isUser && (
          <div className="mt-4 space-y-3">
            {/* Enterprise Performance & Audit Telemetry Panel */}
            {turn.pcaState && viewMode === 'audit' && (() => {
              const tel = turn.pcaState?.telemetry || {};
              const dashboardTokens = (turn.pcaState?.executive_dashboard?.tokenUsage || {}) as any;

              const inTok = tel.inputTokens ?? dashboardTokens.promptTokens ?? null;
              const outTok = tel.outputTokens ?? dashboardTokens.completionTokens ?? null;
              const compRatio = tel.compressionRatio || 'N/A — No compression applied';

              const totalMs = tel.totalLatencyMs || turn.pcaState?.execution_time_ms || 0;
              const totalSec = tel.totalLatencySec || (totalMs ? (totalMs / 1000).toFixed(2) : 'N/A');
              const reasoningSec = tel.reasoningLatencySec || '0.00';
              const generationSec = tel.generationLatencySec || '0.00';
              const auditSec = tel.auditLatencySec || '0.00';
              const sumSec = tel.sumLatencySec || (
                (parseFloat(String(reasoningSec)) || 0) + (parseFloat(String(generationSec)) || 0) + (parseFloat(String(auditSec)) || 0)
              ).toFixed(2);

              return (
                <div className="rounded-xl bg-[#090E17] border border-amber-500/30 p-3.5 sm:p-4 text-xs font-mono text-slate-300 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center space-x-2 text-amber-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>ENTERPRISE PERFORMANCE & AUDIT TELEMETRY</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-amber-300 border border-slate-700">
                      {tel.auditAligned || 'Governance Framework Reference'}
                    </span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
                    <div className="bg-[#111827] p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400">Input / Output Tokens ({tel.isProviderSourceOfTruth ? 'Measured' : 'Estimated'})</div>
                      <div className="text-sm font-bold text-sky-400 font-mono mt-0.5">
                        {inTok !== null && outTok !== null ? `${inTok.toLocaleString()} (In) / ${outTok.toLocaleString()} (Out)` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-[#111827] p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400">Cost ({tel.isProviderSourceOfTruth ? 'Measured' : 'Estimated'})</div>
                      {(() => {
                        const modelName = turn.pcaState?.llm_model || 'gemini-3.5-flash-lite';
                        const costInfo = calculateActualTokenCost(modelName, inTok, outTok);
                        return (
                          <div className="mt-0.5">
                            <span className="text-sm font-bold text-amber-400 font-mono">{costInfo.formattedTHB}</span>
                            <span className="text-[10px] text-sky-400 font-mono ml-1.5">({costInfo.formattedUSD})</span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="bg-[#111827] p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400">Compression Ratio</div>
                      <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5 truncate" title={compRatio}>{compRatio}</div>
                    </div>
                    <div className="bg-[#111827] p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400">Total Latency (Measured)</div>
                      <div className="text-sm font-bold text-purple-400 font-mono mt-0.5">
                        {totalSec !== 'N/A' ? `${totalSec}s (${totalMs} ms)` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Token Breakdown */}
                  <div className="bg-[#111827]/80 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1.5 text-slate-400 font-mono">
                    <div className="flex items-center justify-between text-amber-400/90 font-semibold mb-1">
                      <span>Token Breakdown Attribution ({tel.isProviderSourceOfTruth ? 'Measured' : 'Calculated / Estimated'}):</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                        User Messages: {(tel as any).userMessageCount ?? 1}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>User Input Tokens: <strong className="text-slate-200">{tel.userInputTokens?.toLocaleString() ?? 'N/A'}</strong></div>
                      <div>System Prompt: <strong className="text-slate-200">{tel.systemPromptTokens?.toLocaleString() ?? 'N/A'}</strong></div>
                      <div>Context/Memory: <strong className="text-slate-200">{tel.contextMemoryTokens?.toLocaleString() ?? 'N/A'}</strong></div>
                      <div>Tools/Schema: <strong className="text-slate-200">{tel.toolsSchemaTokens?.toLocaleString() ?? 'N/A'}</strong></div>
                    </div>
                    <div className="pt-1.5 mt-1 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] text-slate-400 gap-y-1">
                      <span>Governance Audit Source: <strong className={`font-bold ${tel.coercionDetectionSource === 'AI_OUTPUT' ? 'text-rose-400 font-mono' : tel.coercionDetectionSource === 'USER_INPUT' ? 'text-teal-400 font-mono' : tel.coercionDetectionSource === 'SYSTEM_INSTRUCTION' ? 'text-amber-400 font-mono' : 'text-slate-500 font-mono'}`}>{tel.coercionDetectionSource || 'NONE'}</strong></span>
                      <span>Optimization: <span className="text-slate-300 font-medium">N/A</span> <span className="text-slate-500">(No Verifiable Baseline)</span></span>
                      <span>
                        Core / Conditional Metrics: <span className="text-slate-400 font-semibold">Not Measured</span>
                      </span>
                    </div>
                  </div>

                  {/* Pipeline Breakdown Timings (Mathematically Consistent Equation) */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 pt-1">
                    <span>Pipeline Processing: <strong className="text-slate-200">{reasoningSec}s</strong></span>
                    <span>•</span>
                    <span>LLM Generation: <strong className="text-slate-200">{generationSec}s</strong></span>
                    <span>•</span>
                    <span>Audit Processing: <strong className="text-slate-200">{auditSec}s</strong></span>
                    <span className="text-[10px] text-amber-400/80 ml-auto font-mono">(Sum = {sumSec}s)</span>
                  </div>

                  {/* Artifact Checklists */}
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-3 text-[11px]">
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <span>✓</span> Executive Report
                    </span>
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <span>✓</span> Audit Package
                    </span>
                    <span className="text-amber-400/90 flex items-center gap-1 font-medium">
                      <span className="text-amber-400">⚠</span> Governance Ref Trace: NOT VERIFIED
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-2">
              {viewMode === 'audit' && (
                <div className="flex flex-wrap items-center gap-2 text-slate-400 font-mono text-[11px]">
                  {outputTokensVal > 0 && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-sky-300">
                      <Cpu className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="text-slate-400">Output:</span>
                      <span className="text-sky-200 font-bold font-mono">{outputTokensVal.toLocaleString()}</span>
                    </span>
                  )}
                  {inputTokensVal > 0 && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-teal-300">
                      <Cpu className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="text-slate-400">Input:</span>
                      <span className="text-teal-200 font-bold font-mono">{inputTokensVal.toLocaleString()}</span>
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
                        className="px-2 py-1 rounded font-semibold bg-amber-950 text-amber-300 border border-amber-500/30"
                      >
                        Measurement Confidence: Low
                      </span>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2 ml-auto">
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

                {turn.pcaState && viewMode === 'clean' && (
                  <button
                    type="button"
                    onClick={() => setViewMode('audit')}
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-medium transition-all text-xs border border-slate-700 cursor-pointer animate-fadeIn"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>ตรวจสอบความปลอดภัยและการวิเคราะห์ (Audit)</span>
                  </button>
                )}

                {turn.pcaState && viewMode === 'audit' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setViewMode('clean')}
                      className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-medium transition-all text-xs border border-slate-700 cursor-pointer animate-fadeIn"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ดูคำตอบที่เรียบง่าย (Clean View)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowInspector(!showInspector)}
                      className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-medium transition-all text-xs border border-slate-700 cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>{showInspector ? 'ซ่อน PCA Inspector' : 'เปิดตรวจ PCA Inspector'}</span>
                      {showInspector ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </>
                )}
              </div>
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
