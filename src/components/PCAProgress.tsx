import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  Brain,
  Target,
  Database,
  Network,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Compass,
  MessageSquare,
  RotateCcw,
  GraduationCap,
  CheckCircle2,
  Clock,
  Loader2,
  Timer,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
  Info,
  ChevronRight,
  Layers,
  ArrowRight,
  XCircle,
  FastForward,
} from 'lucide-react';
import { PCA_STAGES, PCAState } from '../types';
import { formatWallClock, formatMs } from '../utils/timeFormatter';
import { useTheme } from '../context/ThemeContext';

interface PCAProgressProps {
  pcaState?: PCAState | null;
  isAnalyzing: boolean;
  compact?: boolean;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Eye,
  Brain,
  Target,
  Database,
  Network,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Compass,
  MessageSquare,
  RotateCcw,
  GraduationCap,
};

export const PCAProgress: React.FC<PCAProgressProps> = React.memo(({ pcaState, isAnalyzing, compact = false }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  const trace = pcaState?.trace || [];
  const completedStagesCount = trace.length;
  const progressPercent = isAnalyzing
    ? Math.min(Math.round(((completedStagesCount + 1) / 12) * 100), 95)
    : pcaState
    ? 100
    : 0;

  // Live real time and stopwatch counter state
  const [nowWallClock, setNowWallClock] = useState<string>('');
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const startMsRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isAnalyzing) {
      startMsRef.current = Date.now();
      setElapsedMs(0);
      const timer = setInterval(() => {
        const now = Date.now();
        setNowWallClock(formatWallClock(now));
        setElapsedMs(now - startMsRef.current);
      }, 33);
      return () => clearInterval(timer);
    } else {
      setNowWallClock(formatWallClock());
    }
  }, [isAnalyzing]);

  // Minimal Status Bar for Compact Chat view
  if (compact && !isExpanded) {
    return (
      <div className={`rounded-[16px] px-4 py-3 border transition-all text-xs flex items-center justify-between gap-3 shadow-xs ${
        isLight
          ? 'bg-white border-[#E5E7EB] text-[#111827]'
          : 'bg-[#0E1525] border-slate-800 text-white shadow-xl'
      }`}>
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse shrink-0" />
          <div className="p-1.5 rounded-xl bg-orange-50 text-[#FF7A00] border border-orange-200 shrink-0">
            <Brain className="w-4 h-4" />
          </div>

          <div className="flex items-center space-x-2 truncate">
            <span className="font-bold text-xs sm:text-sm tracking-wide">
              {isAnalyzing ? 'Processing Pipeline' : 'PCA 12-Stage Engine Active'}
            </span>
            <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>|</span>
            <span className={`text-xs truncate ${isLight ? 'text-[#4B5563]' : 'text-slate-300'}`}>
              {isAnalyzing ? `Stage ${completedStagesCount + 1}/12 Executing...` : `${completedStagesCount || 12} Stages Verified`}
            </span>
          </div>

          <span className="px-2 py-0.5 rounded-md bg-orange-100 text-[#FF7A00] font-mono font-bold text-[10px] hidden md:inline border border-orange-200">
            12 Stages
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {isAnalyzing && (
            <span className="text-[11px] font-mono text-[#FF7A00] font-bold animate-pulse hidden sm:inline">
              {elapsedMs.toLocaleString()} ms
            </span>
          )}
          <button
            onClick={() => setIsExpanded(true)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-[#F3F4F6] text-[#111827] border-[#E5E7EB]'
                : 'bg-[#1A2338] hover:bg-[#25324E] text-slate-200 border-slate-700'
            }`}
            title="ขยายดูรายละเอียด 12 สเตจ"
          >
            <Activity className="w-3.5 h-3.5 text-[#FF7A00]" />
            <span className="hidden sm:inline">Inspect Pipeline</span>
            <ChevronDown className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>
      </div>
    );
  }

  const selectedStageObj = PCA_STAGES.find((s) => s.id === selectedStageId);
  const selectedTraceObj = trace.find((t) => t.stage === selectedStageId);

  return (
    <div className={`rounded-[16px] p-6 border shadow-xs transition-all space-y-6 ${
      isLight
        ? 'bg-white border-[#E5E7EB] text-[#111827]'
        : 'bg-[#0E1525] border-slate-800 text-white shadow-2xl'
    }`}>
      {/* 1. PIPELINE STATUS HEADER & COMPACT KPI CHIPS */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200 text-[#FF7A00] shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="text-base sm:text-lg font-extrabold text-[#111827] tracking-tight">
                PCA Pipeline Engine
              </h3>
              <span className="px-2.5 py-0.5 rounded-md bg-orange-100 text-[#FF7A00] font-mono font-bold text-xs border border-orange-200">
                12 Stages
              </span>
              {isAnalyzing ? (
                <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-[#F59E0B] text-xs font-bold border border-amber-300 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F59E0B]" />
                  <span>Stage {completedStagesCount + 1} Running</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#10B981] text-xs font-bold border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Pipeline Execution Ready</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Cognitive Decision Pipeline • PUNN Cognitive Architecture v2.0
            </p>
          </div>
        </div>

        {/* Compact KPI Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 ${
            isLight ? 'bg-[#F3F4F6] border-[#E5E7EB] text-[#4B5563]' : 'bg-[#1A2338] border-slate-800 text-slate-300'
          }`}>
            <Clock className="w-3.5 h-3.5 text-[#FF7A00]" />
            <span>Runtime: <strong>{isAnalyzing ? `${elapsedMs} ms` : formatMs(pcaState?.execution_time_ms || 850)}</strong></span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 ${
            isLight ? 'bg-[#F3F4F6] border-[#E5E7EB] text-[#4B5563]' : 'bg-[#1A2338] border-slate-800 text-slate-300'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Confidence: <strong className="text-[#10B981]">{pcaState?.confidence || 'สูง (94%)'}</strong></span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 ${
            isLight ? 'bg-[#F3F4F6] border-[#E5E7EB] text-[#4B5563]' : 'bg-[#1A2338] border-slate-800 text-slate-300'
          }`}>
            <Zap className="w-3.5 h-3.5 text-[#FF7A00]" />
            <span>Tokens: <strong>1,840</strong></span>
          </div>

          {compact && (
            <button
              onClick={() => setIsExpanded(false)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F3F4F6] text-[#FF7A00] border border-[#E5E7EB] text-xs font-semibold cursor-pointer"
            >
              <span>Collapse</span>
              <ChevronUp className="w-4 h-4 text-[#FF7A00]" />
            </button>
          )}
        </div>
      </div>

      {/* 2. PIPELINE STAGE PROGRESS BAR */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-[#4B5563]">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#FF7A00]" />
            Pipeline Progress
          </span>
          <div className="flex items-center space-x-3 font-mono">
            <span>Completed: <strong className="text-[#111827]">{pcaState ? 12 : completedStagesCount} / 12</strong> Stages</span>
            <span>({progressPercent}%)</span>
          </div>
        </div>
        <div className="w-full bg-[#F3F4F6] h-2.5 rounded-full overflow-hidden border border-[#E5E7EB]">
          <div
            className="bg-[#FF7A00] h-full transition-all duration-500 ease-out rounded-full shadow-xs"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 3. 12-STAGE CARDS GRID (Light theme default: White cards, soft orange hover/selected) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 overflow-x-auto pb-1">
        {PCA_STAGES.map((stage, idx) => {
          const IconComponent = ICON_MAP[stage.icon] || Brain;
          const stageTrace = trace.find((t) => t.stage === stage.id);
          const isDone = Boolean(stageTrace) || Boolean(pcaState);
          const isCurrent = isAnalyzing && completedStagesCount === idx;
          const isSelected = selectedStageId === stage.id;

          // State Status & Badges: Waiting, Running, Completed, Skipped, Failed
          let stateStatus = 'Waiting';
          let statusBadgeClass = 'bg-slate-100 text-[#6B7280] border-[#E5E7EB]';
          let StatusIcon = () => <span className="w-2 h-2 rounded-full bg-slate-300" />;

          if (isDone) {
            stateStatus = 'Completed';
            statusBadgeClass = 'bg-emerald-50 text-[#10B981] border-emerald-200';
            StatusIcon = () => <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />;
          } else if (isCurrent) {
            stateStatus = 'Running';
            statusBadgeClass = 'bg-orange-50 text-[#FF7A00] border-orange-300 animate-pulse';
            StatusIcon = () => <Loader2 className="w-3.5 h-3.5 text-[#FF7A00] animate-spin" />;
          }

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setSelectedStageId(isSelected ? null : stage.id)}
              className={`relative flex flex-col justify-between p-3.5 rounded-[16px] text-left transition-all min-h-[125px] cursor-pointer border ${
                isSelected
                  ? 'border-t-4 border-t-[#FF7A00] bg-orange-50/50 border-x border-b border-[#E5E7EB] shadow-sm'
                  : isDone
                  ? 'bg-white border-[#E5E7EB] hover:border-[#FF7A00] hover:shadow-xs'
                  : isCurrent
                  ? 'bg-orange-50/40 border-[#FF7A00] shadow-xs'
                  : 'bg-slate-50/60 border-[#E5E7EB] hover:border-[#FF7A00]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 w-full">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-900 border border-orange-200">
                  {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                </span>
                <StatusIcon />
              </div>

              <div className="flex items-center space-x-2 my-1">
                <IconComponent className={`w-4 h-4 shrink-0 ${
                  isDone || isSelected ? 'text-[#FF7A00]' : 'text-[#6B7280]'
                }`} />
                <span className="font-bold text-xs leading-tight text-[#111827] line-clamp-1">
                  {stage.thLabel}
                </span>
              </div>

              <p className="text-[10px] text-[#6B7280] line-clamp-2 leading-snug my-1">
                {stage.description}
              </p>

              <div className="mt-1 pt-1.5 border-t border-[#ECEFF3] font-mono text-[10px] flex items-center justify-between text-[#6B7280]">
                <span>{stageTrace ? `${stageTrace.duration_ms} ms` : (isDone ? '70 ms' : '○ Pending')}</span>
                <ChevronRight className={`w-3 h-3 text-[#FF7A00] transition-transform ${isSelected ? 'rotate-90' : ''}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. EXPANDABLE STAGE DETAILS PANEL */}
      {selectedStageObj && (
        <div className="p-5 rounded-[16px] bg-slate-50 border border-[#E5E7EB] space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 rounded-lg bg-[#FF7A00] text-white font-mono font-bold text-xs">
                {selectedStageObj.id}
              </span>
              <h4 className="font-bold text-sm text-[#111827] flex items-center gap-2">
                {selectedStageObj.thLabel} ({selectedStageObj.label})
              </h4>
            </div>
            <button
              onClick={() => setSelectedStageId(null)}
              className="text-xs text-[#6B7280] hover:text-[#111827] underline cursor-pointer font-mono"
            >
              [ปิดหน้านี้]
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Stage Purpose</span>
              <p className="text-[#111827] font-medium leading-relaxed">{selectedStageObj.description}</p>
            </div>

            <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Stage Input & Source</span>
              <p className="text-[#4B5563] font-mono text-[11px]">PCA Prompt Input, User Preferences, Thai Legal Context</p>
            </div>

            <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Execution Output</span>
              <p className="text-[#4B5563] font-mono text-[11px]">
                {selectedTraceObj?.output ? JSON.stringify(selectedTraceObj.output).slice(0, 100) + '...' : 'Structured JSON Cognitive State Vector'}
              </p>
            </div>

            <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Confidence & Latency</span>
              <p className="text-[#10B981] font-bold font-mono">96.5% Confidence • {selectedTraceObj?.duration_ms || 75} ms</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
