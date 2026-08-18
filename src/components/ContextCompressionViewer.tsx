import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Target,
  FileCheck,
  ShieldAlert,
  BookOpen,
  Scale,
  HelpCircle,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';
import { CompressedContextSummary } from '../types';

interface ContextCompressionViewerProps {
  compressedContext?: CompressedContextSummary;
  onManualCompress?: () => Promise<void>;
  isCompressing?: boolean;
}

export const ContextCompressionViewer: React.FC<ContextCompressionViewerProps> = ({
  compressedContext,
  onManualCompress,
  isCompressing = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'stages'>('overview');

  if (!compressedContext) {
    return (
      <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0F131A] p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-[#9AA5B1] mb-2">
          <Zap className="w-4 h-4 text-[#FF8A00]" />
          <span>ระบบ Context Compression ทำงานอัตโนมัติ หรือกดปุ่มด้านล่างเพื่อสั่งบีบอัดสถานะทันที</span>
        </div>
        {onManualCompress && (
          <button
            type="button"
            onClick={onManualCompress}
            disabled={isCompressing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#151B24] border border-[rgba(255,255,255,0.08)] text-[#F5F7FA] hover:bg-[#1B2330] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCompressing ? 'animate-spin text-[#FF8A00]' : ''}`} />
            {isCompressing ? 'กำลังบีบอัดบริบท...' : 'สั่งบีบอัดบริบทตอนนี้ (Compress Context)'}
          </button>
        )}
      </div>
    );
  }

  const { metrics, goal, facts, constraints, evidence, decision, openQuestions, stageSummary } = compressedContext;

  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0F131A] shadow-xl overflow-hidden transition-all text-[#F5F7FA]">
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-[#151B24] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#FF8A00]/10 text-[#FF8A00] flex items-center justify-center border border-[#FF8A00]/20">
            <Zap className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-[#F5F7FA]">
                Context Compression Engine
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-[#FF8A00]/10 text-[#FF8A00] border border-[#FF8A00]/20 font-mono">
                Active
              </span>
            </div>
            <p className="text-[11px] text-[#9AA5B1]">
              รักษาเฉพาะโครงสร้างสำคัญ (Facts, Constraints, Decisions) เพื่อความแม่นยำระดับสูงสุด
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Compact Metric Status Chips */}
          <div className="flex items-center gap-2 bg-[#07090D] border border-[rgba(255,255,255,0.06)] rounded-xl px-3 py-1.5 text-xs font-mono">
            <div>
              <span className="text-[#6B7280] text-[10px] uppercase">Token Reduction</span>
              <div className="text-[#F5F7FA] font-bold flex items-center gap-1">
                <span className="line-through text-[#6B7280] text-[10px]">{metrics.originalEstimatedTokens.toLocaleString()}</span>
                <span>→</span>
                <span className="text-[#22C55E]">{metrics.compressedTokens.toLocaleString()}</span>
                <span className="text-[10px] text-[#22C55E] bg-[#22C55E]/10 px-1.5 py-0.5 rounded ml-1 font-bold">
                  {metrics.reductionPercentage}%
                </span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-[#07090D] border border-[rgba(255,255,255,0.06)] rounded-xl px-3 py-1.5 text-xs font-mono">
            <div>
              <span className="text-[#6B7280] text-[10px] uppercase">Engine</span>
              <div className="text-[#22C55E] font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                <span>Optimal</span>
              </div>
            </div>
          </div>

          {/* Compress Action */}
          {onManualCompress && (
            <button
              onClick={onManualCompress}
              disabled={isCompressing}
              title="สั่งบีบอัดบริบทใหม่แบบเรียลไทม์"
              className="p-2 text-[#9AA5B1] hover:text-[#FF8A00] bg-[#07090D] hover:bg-[#1B2330] border border-[rgba(255,255,255,0.06)] rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isCompressing ? 'animate-spin text-[#FF8A00]' : ''}`} />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-[#9AA5B1] hover:text-[#F5F7FA] bg-[#07090D] hover:bg-[#1B2330] border border-[rgba(255,255,255,0.06)] rounded-xl transition-all cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[rgba(255,255,255,0.06)] bg-[#0F131A]"
          >
            {/* View Tabs */}
            <div className="px-5 py-2.5 bg-[#07090D]/50 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1 rounded-xl font-medium transition-all cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-[#151B24] text-[#FF8A00] font-bold border border-[rgba(255,255,255,0.08)]'
                      : 'text-[#9AA5B1] hover:text-[#F5F7FA]'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5 inline mr-1 text-[#FF8A00]" />
                  Structured Context Overview
                </button>
                <button
                  onClick={() => setActiveTab('stages')}
                  className={`px-3 py-1 rounded-xl font-medium transition-all cursor-pointer ${
                    activeTab === 'stages'
                      ? 'bg-[#151B24] text-[#FF8A00] font-bold border border-[rgba(255,255,255,0.08)]'
                      : 'text-[#9AA5B1] hover:text-[#F5F7FA]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 inline mr-1 text-[#FF8A00]" />
                  12-Stage Cognitive State
                </button>
              </div>
              <span className="text-[11px] font-mono text-[#6B7280]">
                Updated: {new Date().toLocaleTimeString()}
              </span>
            </div>

            {/* Tab Contents */}
            <div className="p-5 space-y-4">
              {activeTab === 'overview' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Goal Card */}
                  <div className="p-4 rounded-xl bg-[#151B24] border border-[rgba(255,255,255,0.06)] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#FF8A00]">
                      <Target className="w-4 h-4" />
                      <span>Executive Goal & Objective</span>
                    </div>
                    <p className="text-xs text-[#F5F7FA] font-medium leading-relaxed bg-[#07090D] p-3 rounded-xl border border-[rgba(255,255,255,0.04)]">
                      {goal || 'ยังไม่มีเป้าหมายที่กำหนด (ระบบรอรับคำสั่งสนทนาแรก)'}
                    </p>
                  </div>

                  {/* Constraints Card */}
                  <div className="p-4 rounded-xl bg-[#151B24] border border-[rgba(255,255,255,0.06)] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Constraints & Guardrails ({constraints.length})</span>
                    </div>
                    <ul className="text-xs text-[#9AA5B1] space-y-1 bg-[#07090D] p-3 rounded-xl border border-[rgba(255,255,255,0.04)]">
                      {constraints.length > 0 ? (
                        constraints.slice(0, 3).map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 truncate">
                            <span className="text-amber-400">•</span>
                            <span className="truncate">{c}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-[#6B7280]">ไม่มีเงื่อนไขจำกัดเพิ่มเติม</li>
                      )}
                    </ul>
                  </div>

                  {/* Facts Card */}
                  <div className="p-4 rounded-xl bg-[#151B24] border border-[rgba(255,255,255,0.06)] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                      <FileCheck className="w-4 h-4" />
                      <span>Verified Facts ({facts.length})</span>
                    </div>
                    <ul className="text-xs text-[#9AA5B1] space-y-1 bg-[#07090D] p-3 rounded-xl border border-[rgba(255,255,255,0.04)]">
                      {facts.length > 0 ? (
                        facts.slice(0, 3).map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5 truncate">
                            <span className="text-emerald-400">•</span>
                            <span className="truncate">{f}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-[#6B7280]">รอข้อมูลพื้นฐานจากการสนทนา</li>
                      )}
                    </ul>
                  </div>

                  {/* Core Decisions Card */}
                  <div className="p-4 rounded-xl bg-[#151B24] border border-[rgba(255,255,255,0.06)] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Core Decisions ({decision.length})</span>
                    </div>
                    <ul className="text-xs text-[#9AA5B1] space-y-1 bg-[#07090D] p-3 rounded-xl border border-[rgba(255,255,255,0.04)]">
                      {decision.length > 0 ? (
                        decision.slice(0, 3).map((d, i) => (
                          <li key={i} className="flex items-start gap-1.5 truncate">
                            <span className="text-sky-400">•</span>
                            <span className="truncate">{d}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-[#6B7280]">ยังไม่มีการตัดสินใจยุทธศาสตร์หลัก</li>
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[#9AA5B1] mb-3">สถานะการทำงาน 12 สเตจของกระบวนการคิดวิเคราะห์ (PCA 12-Stage Pipeline):</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {stageSummary && Object.entries(stageSummary).map(([stageName, isVerified], idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                          isVerified
                            ? 'bg-[#151B24] border-emerald-500/20 text-[#F5F7FA]'
                            : 'bg-[#07090D] border-[rgba(255,255,255,0.06)] text-[#6B7280]'
                        }`}
                      >
                        <span className="font-mono font-medium truncate">
                          {idx + 1}. {stageName}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isVerified ? 'bg-emerald-500/10 text-[#22C55E]' : 'bg-[#151B24] text-[#6B7280]'
                        }`}>
                          {isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
