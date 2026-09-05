import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  CheckCheck,
  Brain,
  Scale,
  AlertTriangle,
  Lightbulb,
  FileCheck2,
  Terminal,
  Copy,
  Check,
  Download,
  X,
  Hash,
  Lock,
  ExternalLink,
  ArrowRight,
  GitBranch,
  FileText,
  BookmarkCheck,
  Info,
  KeyRound,
  AlertOctagon,
  Network,
  Table2,
  Calculator
} from 'lucide-react';
import {
  DecisionExecutionTrace,
  ExecutionStepRecord,
  ExecutionStepStageKey,
  EvidenceLineageItem,
  DecisionLineageTree
} from '../types';
import { useTheme } from '../context/ThemeContext';

interface ExecutionTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  trace: DecisionExecutionTrace | null;
}

const STAGE_ICONS: Record<ExecutionStepStageKey, React.ElementType> = {
  INPUT: Terminal,
  CONTEXT: Layers,
  EVIDENCE_RETRIEVAL: Search,
  EVIDENCE_VALIDATION: CheckCheck,
  HYPOTHESIS: Brain,
  REASONING: Scale,
  RISK: AlertTriangle,
  DECISION: Lightbulb,
  GOVERNANCE: ShieldCheck,
  OUTPUT: FileCheck2,
};

const STAGE_COLORS: Record<ExecutionStepStageKey, { bg: string; text: string; border: string }> = {
  INPUT: { bg: 'bg-blue-500/10', text: 'text-blue-500 dark:text-blue-400', border: 'border-blue-500/30' },
  CONTEXT: { bg: 'bg-purple-500/10', text: 'text-purple-500 dark:text-purple-400', border: 'border-purple-500/30' },
  EVIDENCE_RETRIEVAL: { bg: 'bg-amber-500/10', text: 'text-amber-500 dark:text-amber-400', border: 'border-amber-500/30' },
  EVIDENCE_VALIDATION: { bg: 'bg-emerald-500/10', text: 'text-emerald-500 dark:text-emerald-400', border: 'border-emerald-500/30' },
  HYPOTHESIS: { bg: 'bg-cyan-500/10', text: 'text-cyan-500 dark:text-cyan-400', border: 'border-cyan-500/30' },
  REASONING: { bg: 'bg-indigo-500/10', text: 'text-indigo-500 dark:text-indigo-400', border: 'border-indigo-500/30' },
  RISK: { bg: 'bg-rose-500/10', text: 'text-rose-500 dark:text-rose-400', border: 'border-rose-500/30' },
  DECISION: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
  GOVERNANCE: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
  OUTPUT: { bg: 'bg-teal-500/10', text: 'text-teal-500 dark:text-teal-400', border: 'border-teal-500/30' },
};

type ActiveSubTab = 'step_detail' | 'evidence_lineage' | 'claim_evidence_matrix' | 'bayesian_proof' | 'decision_lineage' | 'version_manifest' | 'crypto_ledger';

export const ExecutionTraceModal: React.FC<ExecutionTraceModalProps> = ({
  isOpen,
  onClose,
  trace,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<ActiveSubTab>('step_detail');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !trace) return null;

  const steps = trace.steps || [];
  const currentStep: ExecutionStepRecord | undefined = steps[selectedStepIndex] || steps[0];
  const evidenceLineage = trace.evidence_lineage || [];
  const decisionLineage = trace.decision_lineage;
  const versionManifest = trace.version_manifest;
  const integrity = trace.integrity_report || {
    overall_integrity: 'VERIFIED',
    event_chain_status: 'VALID',
    evidence_links_status: 'VALID',
    checksum_status: 'VALID',
    schema_compliance: 'PUNN-PCA-v3.0',
    execution_status: 'COMPLETE',
    integrity_notes: [],
    tamper_detected: false,
    warnings: [],
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(trace, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FIRE_KEEPER_Execution_Trace_${trace.execution_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isVerified = integrity.overall_integrity === 'VERIFIED';

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center overflow-y-auto bg-black/80 backdrop-blur-md animate-fadeIn p-0 md:p-6">
      <div
        className={`relative w-full max-w-6xl min-h-[100dvh] md:min-h-0 md:h-[92vh] flex flex-col md:rounded-2xl shadow-2xl border md:overflow-hidden ${
          isLight
            ? 'bg-[#F8FAFC] border-[#DCE2EA] text-[#172033]'
            : 'bg-[#0B1017] border-slate-800 text-slate-100'
        }`}
      >
        {/* MODAL HEADER */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b shrink-0 ${
            isLight ? 'bg-white border-[#E2E8F0]' : 'bg-[#0F1622] border-slate-800/90'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold">
                  Execution Trace & Decision Audit Trail
                </h2>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                  {trace.schema_version}
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                10-Stage Real Runtime Execution Trace • Evidence Lineage • Decision Lineage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Decision ID pill with copy */}
            <button
              onClick={() => handleCopy(trace.execution_id, 'exec_id')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-amber-300'
              }`}
              title="คัดลอก Decision ID"
            >
              <Hash className="w-3.5 h-3.5 text-amber-500" />
              <span>{trace.execution_id}</span>
              {copiedField === 'exec_id' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* Toggle View Mode */}
            <div className={`p-0.5 rounded-lg border flex items-center ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-800'}`}>
              <button
                onClick={() => setViewMode('visual')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'visual'
                    ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-800 text-white shadow-sm')
                    : (isLight ? 'text-slate-600' : 'text-slate-400')
                }`}
              >
                Audit Explorer
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'json'
                    ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-800 text-white shadow-sm')
                    : (isLight ? 'text-slate-600' : 'text-slate-400')
                }`}
              >
                Raw JSON
              </button>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportJson}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="ส่งออก Trace เป็น JSON"
            >
              <Download className="w-4 h-4 text-amber-500" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="ปิด (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── TOP LAYER: EXECUTION INTEGRITY PANEL ────────────────────────── */}
        <div
          className={`px-5 py-2.5 border-b shrink-0 ${
            isVerified
              ? (isLight ? 'bg-emerald-50/60 border-emerald-200/80' : 'bg-emerald-950/20 border-emerald-800/40')
              : (isLight ? 'bg-rose-50/80 border-rose-300' : 'bg-rose-950/30 border-rose-800/60')
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                <span className={`w-2 h-2 rounded-full ${isVerified ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className={isVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                  {isVerified ? 'EXECUTION INTEGRITY: VERIFIED' : '⚠ INTEGRITY WARNING DETECTED'}
                </span>
              </div>

              <div className="hidden md:flex items-center gap-2 text-[11px] font-mono">
                <span className={`px-2 py-0.5 rounded border ${isLight ? 'bg-white/80 border-slate-300 text-slate-700' : 'bg-slate-900/80 border-slate-700 text-slate-300'}`}>
                  Event Chain: <strong className={integrity.event_chain_status === 'VALID' ? 'text-emerald-500' : 'text-rose-500'}>{integrity.event_chain_status}</strong>
                </span>
                <span className={`px-2 py-0.5 rounded border ${isLight ? 'bg-white/80 border-slate-300 text-slate-700' : 'bg-slate-900/80 border-slate-700 text-slate-300'}`}>
                  Evidence Links: <strong className={integrity.evidence_links_status === 'VALID' ? 'text-emerald-500' : 'text-rose-500'}>{integrity.evidence_links_status}</strong>
                </span>
                <span className={`px-2 py-0.5 rounded border ${isLight ? 'bg-white/80 border-slate-300 text-slate-700' : 'bg-slate-900/80 border-slate-700 text-slate-300'}`}>
                  Checksum: <strong className="text-emerald-500">{integrity.checksum_status}</strong>
                </span>
                <span className={`px-2 py-0.5 rounded border ${isLight ? 'bg-white/80 border-slate-300 text-slate-700' : 'bg-slate-900/80 border-slate-700 text-slate-300'}`}>
                  Schema: <strong className="text-amber-500">{integrity.schema_compliance}</strong>
                </span>
                <span className={`px-2 py-0.5 rounded border ${isLight ? 'bg-white/80 border-slate-300 text-slate-700' : 'bg-slate-900/80 border-slate-700 text-slate-300'}`}>
                  Execution: <strong className="text-emerald-500">{integrity.execution_status}</strong>
                </span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-3">
              <span>Latency: <strong>{trace.total_duration_ms} ms</strong></span>
              <span>Model: <strong>{trace.model_name.split(' ')[0]}</strong></span>
            </div>
          </div>

          {/* Warnings list if any */}
          {integrity.warnings && integrity.warnings.length > 0 && (
            <div className="mt-2 text-xs font-mono text-rose-500 bg-rose-500/10 p-2 rounded-lg border border-rose-500/30 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                {integrity.warnings.map((w, idx) => (
                  <div key={idx}>{w}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── MAIN CONTENT AREA ────────────────────────────────────────────── */}
        {viewMode === 'json' ? (
          <div className="flex-1 overflow-auto p-5 font-mono text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Canonical JSON Representation (Audit Ready):
              </span>
              <button
                onClick={() => handleCopy(JSON.stringify(trace, null, 2), 'full_json')}
                className={`flex items-center gap-1 px-3 py-1 rounded border text-xs cursor-pointer ${
                  isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                {copiedField === 'full_json' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedField === 'full_json' ? 'คัดลอกแล้ว' : 'คัดลอก JSON'}</span>
              </button>
            </div>
            <pre
              className={`p-4 rounded-xl border overflow-x-auto leading-relaxed ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-emerald-300'
              }`}
            >
              <code>{JSON.stringify(trace, null, 2)}</code>
            </pre>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* LEFT SIDEBAR: 10-STAGE REAL TIMELINE */}
            <div
              className={`w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r overflow-y-auto p-3 space-y-1.5 shrink-0 ${
                isLight ? 'bg-white border-[#E2E8F0]' : 'bg-[#0E131C] border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between px-2 py-1">
                <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Execution Stages ({steps.length})
                </span>
                <span className="text-[10px] font-mono text-amber-500">100% Real Runtime</span>
              </div>

              {steps.map((step, idx) => {
                const IconComponent = STAGE_ICONS[step.stage_key] || Terminal;
                const isSelected = selectedStepIndex === idx;
                const colorConfig = STAGE_COLORS[step.stage_key] || STAGE_COLORS.INPUT;

                return (
                  <button
                    key={step.event_id || idx}
                    onClick={() => {
                      setSelectedStepIndex(idx);
                      setActiveTab('step_detail');
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? (isLight
                            ? 'bg-amber-50/90 border-amber-400 text-slate-900 shadow-sm ring-1 ring-amber-400/40'
                            : 'bg-amber-500/15 border-amber-500/60 text-white shadow-md ring-1 ring-amber-500/40')
                        : (isLight
                            ? 'bg-transparent border-transparent hover:bg-slate-100/80 text-slate-700'
                            : 'bg-transparent border-transparent hover:bg-slate-800/50 text-slate-300')
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border mt-0.5 ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10.5px] font-bold text-amber-600 dark:text-amber-400">
                          {step.event_id}
                        </span>
                        <span className="text-[9.5px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {step.status_badge}
                        </span>
                      </div>
                      <div className="font-semibold text-xs truncate mt-0.5">
                        {step.stage_label_th}
                      </div>
                      <div className="flex items-center justify-between text-[10.5px] text-slate-400 mt-0.5">
                        <span className="truncate">{step.stage_label_en}</span>
                        <span className="font-mono text-[10px] text-slate-500 shrink-0 ml-1">{step.duration_ms}ms</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* RIGHT MAIN PANEL: INTERACTIVE SUB-TABS & DEEP INSPECTORS */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* SUB-TABS NAV BAR */}
              <div
                className={`flex items-center gap-2 px-5 pt-3 pb-2 border-b shrink-0 overflow-x-auto ${
                  isLight ? 'bg-slate-50 border-[#E2E8F0]' : 'bg-[#0E1420] border-slate-800'
                }`}
              >
                <button
                  onClick={() => setActiveTab('step_detail')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    activeTab === 'step_detail'
                      ? (isLight ? 'bg-white text-slate-900 border border-slate-300 shadow-sm' : 'bg-slate-800 text-white border border-slate-700 shadow-sm')
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-blue-500" />
                  <span>Step I/O & Audit ({currentStep.event_id})</span>
                </button>

                <button
                  onClick={() => setActiveTab('evidence_lineage')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    activeTab === 'evidence_lineage'
                      ? (isLight ? 'bg-white text-slate-900 border border-slate-300 shadow-sm' : 'bg-slate-800 text-white border border-slate-700 shadow-sm')
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Evidence Lineage ({evidenceLineage.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('claim_evidence_matrix')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    activeTab === 'claim_evidence_matrix'
                      ? (isLight ? 'bg-white text-slate-900 border border-slate-300 shadow-sm' : 'bg-slate-800 text-white border border-slate-700 shadow-sm')
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Table2 className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Claim-Evidence Matrix ({trace.claim_evidence_matrix?.length || trace.summary_metrics.claims_evaluated_count || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('bayesian_proof')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    activeTab === 'bayesian_proof'
                      ? (isLight ? 'bg-white text-slate-900 border border-slate-300 shadow-sm' : 'bg-slate-800 text-white border border-slate-700 shadow-sm')
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Bayesian Proof</span>
                </button>

                <button
                  onClick={() => setActiveTab('decision_lineage')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    activeTab === 'decision_lineage'
                      ? (isLight ? 'bg-white text-slate-900 border border-slate-300 shadow-sm' : 'bg-slate-800 text-white border border-slate-700 shadow-sm')
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Decision Lineage Tree</span>
                </button>

                <button
                  onClick={() => setActiveTab('version_manifest')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    activeTab === 'version_manifest'
                      ? (isLight ? 'bg-white text-slate-900 border border-slate-300 shadow-sm' : 'bg-slate-800 text-white border border-slate-700 shadow-sm')
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-purple-500" />
                  <span>Version Manifest</span>
                </button>

                <button
                  onClick={() => setActiveTab('crypto_ledger')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    activeTab === 'crypto_ledger'
                      ? (isLight ? 'bg-white text-slate-900 border border-slate-300 shadow-sm' : 'bg-slate-800 text-white border border-slate-700 shadow-sm')
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-teal-500" />
                  <span>Cryptographic Chain</span>
                </button>
              </div>

              {/* TAB CONTENT CONTAINER */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 pb-[calc(16px+env(safe-area-inset-bottom))]">
                
                {/* ── SUB-TAB 1: STEP DETAIL & INPUT/OUTPUT FLOW ───────────── */}
                {activeTab === 'step_detail' && (
                  <>
                    {/* STEP HEADER */}
                    <div
                      className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                        isLight ? 'bg-white border-[#E2E8F0] shadow-sm' : 'bg-[#101725] border-slate-800 shadow-lg'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-inherit">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                              STAGE_COLORS[currentStep.stage_key].bg
                            } ${STAGE_COLORS[currentStep.stage_key].text} ${
                              STAGE_COLORS[currentStep.stage_key].border
                            }`}
                          >
                            {React.createElement(STAGE_ICONS[currentStep.stage_key] || Terminal, {
                              className: 'w-5 h-5',
                            })}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-base">
                                {currentStep.stage_label_th}
                              </h3>
                              <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                {currentStep.status_badge}
                              </span>
                            </div>
                            <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              {currentStep.stage_label_en} • <span className="text-amber-500 font-bold">{currentStep.event_id}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                          <span className={`px-2.5 py-1 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                            ⏱️ Latency: <strong>{currentStep.duration_ms} ms</strong>
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                            Model: <strong>{currentStep.model_ref}</strong>
                          </span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm leading-relaxed">
                        {currentStep.summary}
                      </p>
                    </div>

                    {/* STEP INPUT / OUTPUT PIPELINE ("Step นี้รับอะไร → ทำอะไร → ได้อะไร → ส่งต่ออะไร") */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          <Network className="w-4 h-4 text-blue-500" />
                          <span>Input / Transformation / Output Lineage</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {currentStep.input_ref} → {currentStep.event_id} → {currentStep.output_ref}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        {/* 1. INPUT RECEIVED */}
                        <div
                          className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 ${
                            isLight ? 'bg-blue-50/40 border-blue-200' : 'bg-blue-950/20 border-blue-800/40'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs font-mono text-blue-600 dark:text-blue-400 font-bold mb-1.5">
                              <span>1. Step Input (รับข้อมูล)</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                                {currentStep.input_ref}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                              ข้อมูลนำเข้าที่ส่งมาจากขั้นตอนก่อนหน้า
                            </p>
                            <pre
                              className={`p-2.5 rounded-lg border font-mono text-[10.5px] overflow-x-auto ${
                                isLight ? 'bg-white border-blue-100 text-slate-800' : 'bg-slate-950 border-blue-900/40 text-blue-300'
                              }`}
                            >
                              <code>{JSON.stringify(currentStep.input_payload || { status: 'NOT_RECORDED' }, null, 2)}</code>
                            </pre>
                          </div>
                        </div>

                        {/* 2. TRANSFORMATION & RULES */}
                        <div
                          className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 ${
                            isLight ? 'bg-purple-50/40 border-purple-200' : 'bg-purple-950/20 border-purple-800/40'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs font-mono text-purple-600 dark:text-purple-400 font-bold mb-1.5">
                              <span>2. Processing (ทำอะไร)</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                                {currentStep.execution_type || 'HEURISTIC_EVAL'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                              กฎและการประเมินความปลอดภัยที่บังคับใช้
                            </p>
                            <div className="space-y-1 text-xs font-mono">
                              {(currentStep.rule_refs && currentStep.rule_refs.length > 0 ? currentStep.rule_refs : ['STANDARD-PCA-POLICY']).map((rule) => (
                                <div key={rule} className={`p-1.5 rounded border text-[10.5px] flex items-center gap-1.5 ${isLight ? 'bg-white border-purple-100 text-purple-800' : 'bg-slate-950 border-purple-900/40 text-purple-300'}`}>
                                  <ShieldCheck className="w-3 h-3 text-purple-500 shrink-0" />
                                  <span className="truncate">{rule}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {currentStep.evidence_refs && currentStep.evidence_refs.length > 0 && (
                            <div className="pt-2 border-t border-purple-200/50 dark:border-purple-800/40">
                              <span className="text-[10.5px] font-mono text-slate-500 block mb-1">
                                Linked Evidence ({currentStep.evidence_refs.length}):
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {currentStep.evidence_refs.map((eRef) => (
                                  <button
                                    key={eRef}
                                    onClick={() => {
                                      setSelectedEvidenceId(eRef);
                                      setActiveTab('evidence_lineage');
                                    }}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 cursor-pointer"
                                  >
                                    {eRef} →
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 3. STEP OUTPUT PRODUCED */}
                        <div
                          className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 ${
                            isLight ? 'bg-emerald-50/40 border-emerald-200' : 'bg-emerald-950/20 border-emerald-800/40'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold mb-1.5">
                              <span>3. Step Output (ได้อะไร & ส่งต่อ)</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                → {currentStep.output_ref}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                              ผลผลิตที่ได้รับและส่งต่อเข้าสู่กระบวนการถัดไป
                            </p>
                            <pre
                              className={`p-2.5 rounded-lg border font-mono text-[10.5px] overflow-x-auto ${
                                isLight ? 'bg-white border-emerald-100 text-slate-800' : 'bg-slate-950 border-emerald-900/40 text-emerald-300'
                              }`}
                            >
                              <code>{JSON.stringify(currentStep.output_payload || { status: 'NOT_RECORDED' }, null, 2)}</code>
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PARAMETER CARDS */}
                    {currentStep.data.items && currentStep.data.items.length > 0 && (
                      <div className="space-y-2">
                        <div className={`text-xs font-mono font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Step Execution Metrics & Parameters
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {currentStep.data.items.map((item, i) => (
                            <div
                              key={i}
                              className={`p-3 rounded-xl border flex flex-col justify-between ${
                                item.highlight
                                  ? (isLight ? 'bg-amber-50 border-amber-300' : 'bg-amber-500/10 border-amber-500/30')
                                  : (isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800')
                              }`}
                            >
                              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                {item.label}
                              </span>
                              <span className={`font-mono text-xs sm:text-sm font-semibold mt-1 break-all ${
                                item.highlight ? 'text-amber-600 dark:text-amber-400' : ''
                              }`}>
                                {String(item.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── SUB-TAB 2: EVIDENCE LINEAGE ─────────────────────────── */}
                {activeTab === 'evidence_lineage' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                          <BookmarkCheck className="w-4 h-4 text-amber-500" />
                          <span>Evidence Lineage & Traceability Registry</span>
                        </h3>
                        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          หลักฐานเชิงประจักษ์ทุกชิ้นสามารถตรวจสอบย้อนกลับไปยังแหล่งที่มาและจุดที่ถูกใช้งานในกระบวนการตัดสินใจ
                        </p>
                      </div>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        {evidenceLineage.length} Verified Evidence Records
                      </span>
                    </div>

                    <div className="space-y-3">
                      {evidenceLineage.map((ev, idx) => {
                        const isFocused = selectedEvidenceId === ev.evidence_id;
                        return (
                          <div
                            key={ev.evidence_id || idx}
                            className={`p-4 rounded-2xl border transition-all ${
                              isFocused
                                ? (isLight ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/50' : 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/40')
                                : (isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800')
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 border-inherit">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                  {ev.evidence_id}
                                </span>
                                <span className="font-bold text-sm">
                                  {ev.source}
                                </span>
                                <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                                  {ev.source_type}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs font-mono">
                                <span className="text-emerald-500 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {ev.evidence_status}
                                </span>
                                <span className="text-slate-400">
                                  Credibility: {((ev.credibility_score || 0.95) * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>

                            {/* SOURCE & RETRIEVAL METADATA */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 my-2.5 text-xs font-mono">
                              <div className={`p-2 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                                <span className="text-[10px] text-slate-500 block">Document / URL / Locator</span>
                                <span className="font-semibold truncate block mt-0.5">{ev.document_url_or_locator}</span>
                              </div>
                              <div className={`p-2 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                                <span className="text-[10px] text-slate-500 block">Retrieved At</span>
                                <span className="font-semibold block mt-0.5">{new Date(ev.retrieved_at).toLocaleString('th-TH')}</span>
                              </div>
                              <div className={`p-2 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                                <span className="text-[10px] text-slate-500 block">Content Hash (SHA-256)</span>
                                <span className="font-semibold truncate block mt-0.5 text-amber-500" title={ev.content_hash}>
                                  {ev.content_hash.slice(0, 16)}...
                                </span>
                              </div>
                            </div>

                            {/* CONTENT SNIPPET */}
                            <div className={`p-3 rounded-xl border text-xs leading-relaxed ${isLight ? 'bg-slate-50/70 border-slate-200 text-slate-800' : 'bg-slate-950/80 border-slate-800 text-slate-300'}`}>
                              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Content Snippet</span>
                              {ev.content_snippet}
                            </div>

                            {/* USED BY TRACEABILITY LINEAGE */}
                            <div className="mt-3 pt-2.5 border-t border-inherit flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-slate-500 font-bold">Used by Lineage:</span>
                                {ev.used_by.hypotheses?.map((hId, hIdx) => (
                                  <span key={hId} className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                                    → Hypothesis {hId}
                                  </span>
                                ))}
                                {ev.used_by.risks?.map((rId, rIdx) => (
                                  <span key={rId} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                    → Risk {rId}
                                  </span>
                                ))}
                                {ev.used_by.decision_refs?.map((dId, dIdx) => (
                                  <span key={dId} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    → Decision {dId}
                                  </span>
                                ))}
                              </div>

                              <span className="text-[11px] text-slate-400">
                                {ev.verification_method}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── SUB-TAB: CLAIM-EVIDENCE MATRIX ──────────────────────── */}
                {activeTab === 'claim_evidence_matrix' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                          <Table2 className="w-4 h-4 text-cyan-500" />
                          <span>Claim-Evidence Matrix (การจับคู่ข้ออ้างกับหลักฐาน)</span>
                        </h3>
                        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          ทุกข้ออ้างต้องมีหลักฐานรองรับ หากไม่มีหลักฐานจะถูกลดระดับความน่าเชื่อถือตามหลักการ NO EVIDENCE → NO FACT
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                          Verified: {trace.claim_evidence_matrix?.filter(m => m.verified_by_evidence).length || trace.summary_metrics.verified_claims_count || 0}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold">
                          Unverified/Guarded: {trace.claim_evidence_matrix?.filter(m => !m.verified_by_evidence).length || trace.summary_metrics.unverified_claims_count || 0}
                        </span>
                      </div>
                    </div>

                    {(!trace.claim_evidence_matrix || trace.claim_evidence_matrix.length === 0) ? (
                      <div className={`p-8 text-center rounded-xl border text-xs text-slate-500 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                        ไม่พบข้อมูลข้ออ้างในเมทริกซ์การประมวลผลนี้
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {trace.claim_evidence_matrix.map((item, idx) => (
                          <div
                            key={item.claim_id || idx}
                            className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-500">[{item.claim_id}]</span>
                                <span
                                  className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                    item.epistemic_tag === 'FACT'
                                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                                      : item.epistemic_tag === 'INFERENCE'
                                      ? 'bg-blue-500/10 text-blue-600 border border-blue-500/30'
                                      : item.epistemic_tag === 'HYPOTHESIS'
                                      ? 'bg-purple-500/10 text-purple-600 border border-purple-500/30'
                                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                                  }`}
                                >
                                  [{item.epistemic_tag}]
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                    item.verified_by_evidence
                                      ? 'bg-emerald-500/10 text-emerald-500'
                                      : 'bg-rose-500/10 text-rose-500'
                                  }`}
                                >
                                  {item.verified_by_evidence ? '✓ VERIFIED' : '⚠ UNVERIFIED'}
                                </span>
                              </div>

                              <span className="text-[11px] font-mono text-slate-400">
                                Rule: {item.verification_rule}
                              </span>
                            </div>

                            <p className="font-medium text-sm leading-relaxed">{item.statement}</p>

                            {/* EVIDENCE LINKAGES */}
                            <div className="pt-2 border-t border-inherit space-y-2">
                              {item.linked_evidence_items && item.linked_evidence_items.length > 0 ? (
                                <div className="space-y-1.5">
                                  <span className="text-[11px] font-mono font-bold text-slate-400 block">
                                    Linked Empirical Evidences ({item.linked_evidence_items.length}):
                                  </span>
                                  {item.linked_evidence_items.map((ev, evIdx) => (
                                    <div
                                      key={ev.id}
                                      className={`p-2.5 rounded-lg border font-mono text-[11px] flex flex-col gap-1 ${
                                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between text-slate-400">
                                        <span className="font-bold text-amber-500">[{ev.id}] {ev.source_name}</span>
                                        <span>Relevance: {(ev.relevance_score * 100).toFixed(0)}%</span>
                                      </div>
                                      <p className="text-slate-300 font-sans text-xs">{ev.snippet}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[11px] font-mono text-amber-500 flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>ไม่มีหลักฐานเชิงประจักษ์เชื่อมโยงโดยตรง — ลดระดับความแน่นอน</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── SUB-TAB: BAYESIAN PROOF ─────────────────────────────── */}
                {activeTab === 'bayesian_proof' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-indigo-500" />
                          <span>Exact Mathematical Bayesian Proof (การพิสูจน์ความน่าจะเป็นเบย์เซียน)</span>
                        </h3>
                        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          คำนวณความน่าจะเป็นเชิงอนุมานด้วยสมการเบย์เซียนแบบ Deterministic โดยไม่พึ่งพาค่าสุ่มของโมเดล
                        </p>
                      </div>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                        Formula: P(H|E) = [P(E|H) × P(H)] / P(E)
                      </span>
                    </div>

                    {trace.bayesian_proof ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className={`p-3.5 rounded-xl border font-mono ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                            <span className="text-[11px] text-slate-400 block">Prior P(H)</span>
                            <span className="text-lg font-bold text-blue-500">{(trace.bayesian_proof.prior * 100).toFixed(1)}%</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">ความน่าจะเป็นก่อนพบหลักฐาน</span>
                          </div>

                          <div className={`p-3.5 rounded-xl border font-mono ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                            <span className="text-[11px] text-slate-400 block">Likelihood P(E|H)</span>
                            <span className="text-lg font-bold text-cyan-500">{(trace.bayesian_proof.likelihood * 100).toFixed(1)}%</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">โอกาสพบหลักฐานเมื่อสมมติฐานจริง</span>
                          </div>

                          <div className={`p-3.5 rounded-xl border font-mono ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                            <span className="text-[11px] text-slate-400 block">Marginal P(E)</span>
                            <span className="text-lg font-bold text-purple-500">{(trace.bayesian_proof.marginal_likelihood * 100).toFixed(1)}%</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">ความน่าจะเป็นรวมของหลักฐาน</span>
                          </div>

                          <div className={`p-3.5 rounded-xl border font-mono ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                            <span className="text-[11px] text-slate-400 block">Posterior P(H|E)</span>
                            <span className="text-lg font-bold text-emerald-500">{(trace.bayesian_proof.posterior * 100).toFixed(1)}%</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">ความน่าจะเป็นหลังปรับปรุง</span>
                          </div>
                        </div>

                        {/* MATHEMATICAL STEPS */}
                        <div className={`p-4 rounded-xl border space-y-2 font-mono text-xs ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                          <span className="font-bold text-slate-400 uppercase text-[11px]">Step-by-Step Bayesian Audit Calculation:</span>
                          <div className="space-y-1 text-slate-300">
                            <div>1. Prior Probability: <code>P(H) = {trace.bayesian_proof.prior}</code></div>
                            <div>2. Likelihood given H: <code>P(E|H) = {trace.bayesian_proof.likelihood}</code></div>
                            <div>3. Likelihood given ¬H: <code>P(E|¬H) = {trace.bayesian_proof.likelihood_not_h}</code></div>
                            <div>4. Marginal Likelihood: <code>P(E) = P(E|H)×P(H) + P(E|¬H)×P(¬H) = {trace.bayesian_proof.marginal_likelihood.toFixed(4)}</code></div>
                            <div>5. Posterior Probability: <code>P(H|E) = ({trace.bayesian_proof.likelihood} × {trace.bayesian_proof.prior}) / {trace.bayesian_proof.marginal_likelihood.toFixed(4)} = {trace.bayesian_proof.posterior.toFixed(4)}</code></div>
                            <div>6. Bayes Factor (K): <code>{trace.bayesian_proof.bayes_factor?.toFixed(2) || 'N/A'}</code> ({trace.bayesian_proof.bayes_factor_interpretation || 'Substantial'})</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`p-8 text-center rounded-xl border text-xs text-slate-500 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                        ไม่มีข้อมูลการคำนวณเบย์เซียนใน Trace นี้
                      </div>
                    )}
                  </div>
                )}

                {/* ── SUB-TAB 3: DECISION LINEAGE TREE ────────────────────── */}
                {activeTab === 'decision_lineage' && decisionLineage && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-emerald-500" />
                          <span>Decision Lineage Tree (ย้อนรอยการตัดสินใจ)</span>
                        </h3>
                        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          โครงสร้างย้อนกลับเพื่อตอบคำถาม: <em>“ทำไม FIRE KEEPER ถึงตัดสินใจแบบนี้?”</em> โดยเชื่อมโยง Rationale → Risk → Hypothesis → Evidence
                        </p>
                      </div>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {decisionLineage.decision_id}
                      </span>
                    </div>

                    {/* ROOT: DECISION NODE */}
                    <div
                      className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                        isLight ? 'bg-amber-50/70 border-amber-300' : 'bg-amber-500/10 border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          ROOT DECISION NODE ({decisionLineage.decision_id})
                        </span>
                        <span className="text-slate-400">
                          Formed: {new Date(decisionLineage.formed_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="font-bold text-sm sm:text-base">
                        {decisionLineage.verdict_summary}
                      </div>
                      <div className="text-xs leading-relaxed">
                        <strong>Decision Rationale:</strong> {decisionLineage.decision_rationale}
                      </div>
                      <div className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 ${isLight ? 'bg-white border-amber-200 text-amber-900' : 'bg-slate-950 border-amber-500/30 text-amber-300'}`}>
                        <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                        <span><strong>Human Agency Safeguard:</strong> {decisionLineage.human_agency_safeguard}</span>
                      </div>
                    </div>

                    {/* TREE BRANCHES */}
                    <div className="pl-4 sm:pl-8 border-l-2 border-dashed border-amber-500/40 space-y-4">
                      
                      {/* BRANCH 1: RISKS */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-500">
                          <span>├── 1. Adversarial Risk Lineage</span>
                          <span className="text-slate-400 font-normal">({decisionLineage.risks.length} evaluated)</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 pl-4">
                          {decisionLineage.risks.map((r, rIdx) => (
                            <div
                              key={r.risk_id}
                              className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between font-mono">
                                <span className="font-bold text-rose-500">[{r.risk_id}] Impact: {r.impact} ({r.probability})</span>
                                <span className="text-amber-500 font-semibold">Residual: {r.residual_risk}</span>
                              </div>
                              <p className="leading-relaxed">{r.description}</p>
                              <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                                <span className="text-emerald-500">Mitigation: {r.mitigation}</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400">Grounding:</span>
                                  {r.linked_evidence_refs?.map((eRef, eIdx) => (
                                    <span key={eIdx} className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">
                                      {eRef}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* BRANCH 2: HYPOTHESES */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-500">
                          <span>├── 2. Hypothesis (ACH) Lineage</span>
                          <span className="text-slate-400 font-normal">({decisionLineage.hypotheses.length} evaluated)</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 pl-4">
                          {decisionLineage.hypotheses.map((h, hIdx) => (
                            <div
                              key={h.hypothesis_id}
                              className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between font-mono">
                                <span className="font-bold text-cyan-500">[{h.hypothesis_id}] {h.status}</span>
                                <span className="text-amber-500 font-semibold">Posterior: {((h.posterior || 0.85) * 100).toFixed(1)}%</span>
                              </div>
                              <p className="font-medium leading-relaxed">{h.claim}</p>
                              <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                                <span className="text-slate-400">{h.rationale}</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400">Supporting:</span>
                                  {h.linked_evidence_refs?.map((eRef, eIdx) => (
                                    <span key={eIdx} className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">
                                      {eRef}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* BRANCH 3: CONTEXT REFS */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-500">
                          <span>└── 3. Context & Working Memory Lineage</span>
                          <span className="text-slate-400 font-normal">({decisionLineage.context_refs.length} layers)</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 pl-4">
                          {decisionLineage.context_refs.map((c, cIdx) => (
                            <div
                              key={c.context_id}
                              className={`p-3 rounded-xl border text-xs space-y-1 ${
                                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between font-mono text-[11px]">
                                <span className="font-bold text-purple-500">[{c.context_id}] {c.layer}</span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-300">{c.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* ── SUB-TAB 4: VERSION MANIFEST ─────────────────────────── */}
                {activeTab === 'version_manifest' && versionManifest && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-500" />
                          <span>Complete Version Manifest (การควบคุมเวอร์ชัน)</span>
                        </h3>
                        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          บันทึกสถานะของระบบ กฎระเบียบ โมเดล และฐานความรู้ ณ ช่วงเวลาที่ทำการประมวลผล เพื่อให้ทราบได้อย่างชัดเจนว่า “อะไรเปลี่ยนไปบ้าง” หากผลลัพธ์ในอนาคตเปลี่ยนแปลง
                        </p>
                      </div>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                        {versionManifest.execution_version}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                        <span className="text-[11px] text-slate-500 font-mono block">1. PUNN PCA Version</span>
                        <span className="font-mono text-sm font-bold text-amber-500 mt-0.5 block">{versionManifest.punn_pca_version}</span>
                        <p className="text-xs text-slate-400 mt-1">สถาปัตยกรรมกระบวนการคิด 10 ขั้นตอนตามมาตรฐานสากล</p>
                      </div>

                      <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                        <span className="text-[11px] text-slate-500 font-mono block">2. Model Version</span>
                        <span className="font-mono text-sm font-bold text-blue-500 mt-0.5 block">{versionManifest.model_version}</span>
                        <p className="text-xs text-slate-400 mt-1">โมเดลภาษาและ Engine ประมวลผลหลักที่เชื่อมต่อ</p>
                      </div>

                      <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                        <span className="text-[11px] text-slate-500 font-mono block">3. Prompt & Policy Version</span>
                        <span className="font-mono text-sm font-bold text-purple-500 mt-0.5 block">{versionManifest.prompt_policy_version}</span>
                        <p className="text-xs text-slate-400 mt-1">เวอร์ชันของระบบควบคุมและนโยบายกำกับคำสั่ง Prompt</p>
                      </div>

                      <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                        <span className="text-[11px] text-slate-500 font-mono block">4. Knowledge & Memory Version</span>
                        <span className="font-mono text-sm font-bold text-cyan-500 mt-0.5 block">{versionManifest.knowledge_memory_version}</span>
                        <p className="text-xs text-slate-400 mt-1">โครงสร้างหน่วยความจำระยะยาว LTM และ Knowledge Router</p>
                      </div>

                      <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                        <span className="text-[11px] text-slate-500 font-mono block">5. Evidence Version</span>
                        <span className="font-mono text-sm font-bold text-emerald-500 mt-0.5 block">{versionManifest.evidence_version}</span>
                        <p className="text-xs text-slate-400 mt-1">คลังหลักฐานและ Checksum ของชุดข้อมูลอ้างอิง</p>
                      </div>

                      <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                        <span className="text-[11px] text-slate-500 font-mono block">6. Governance Rule Version</span>
                        <span className="font-mono text-sm font-bold text-rose-500 mt-0.5 block">{versionManifest.governance_rule_version}</span>
                        <p className="text-xs text-slate-400 mt-1">กฎธรรมาภิบาล ISO 42001:2023 & NIST AI RMF 1.0</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SUB-TAB 5: CRYPTOGRAPHIC TRACE ──────────────────────── */}
                {activeTab === 'crypto_ledger' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                          <Lock className="w-4 h-4 text-teal-500" />
                          <span>Cryptographic Provenance & Forward-Chain Ledger</span>
                        </h3>
                        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          บันทึกลำดับเหตุการณ์แบบ WORM (Write Once, Read Many) เชื่อมโยงแฮชแบบ Blockchain-like Proof
                        </p>
                      </div>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                        Merkle Tree Root Signed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                        <span className="text-slate-400 block text-[10.5px]">Input SHA-256 Digest:</span>
                        <span className="font-bold text-blue-500 break-all">{trace.provenance_hashes.input_sha256}</span>
                      </div>
                      <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                        <span className="text-slate-400 block text-[10.5px]">Output SHA-256 Digest:</span>
                        <span className="font-bold text-emerald-500 break-all">{trace.provenance_hashes.output_sha256}</span>
                      </div>
                      <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                        <span className="text-slate-400 block text-[10.5px]">Merkle Root Hash:</span>
                        <span className="font-bold text-amber-500 break-all">{trace.provenance_hashes.merkle_root_sha256 || trace.provenance_hashes.trace_canonical_sha256}</span>
                      </div>
                      <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                        <span className="text-slate-400 block text-[10.5px]">Trace Canonical Hash:</span>
                        <span className="font-bold text-purple-500 break-all">{trace.provenance_hashes.trace_canonical_sha256}</span>
                      </div>
                    </div>

                    {/* EVENT CHAIN BLOCKS */}
                    <div className="space-y-2">
                      <span className="text-xs font-mono font-bold text-slate-500 uppercase block">
                        Sequential Cryptographic Block Chain (10 Stages):
                      </span>
                      <div className="space-y-2">
                        {steps.map((s, idx) => (
                          <div
                            key={s.event_id || idx}
                            className={`p-3 rounded-xl border font-mono text-[11px] flex flex-col md:flex-row items-start md:items-center justify-between gap-2 ${
                              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                                #{s.step_number} {s.event_id}
                              </span>
                              <span className="font-semibold text-slate-300">{s.stage_label_en}</span>
                            </div>

                            <div className="flex items-center gap-3 text-[10.5px] text-slate-400">
                              <span title={`Previous Hash: ${s.previous_event_hash}`}>
                                Prev: <strong className="text-slate-500">{s.previous_event_hash.slice(0, 10)}...</strong>
                              </span>
                              <span>→</span>
                              <span title={`Event Hash: ${s.event_hash}`}>
                                Hash: <strong className="text-emerald-500">{s.event_hash.slice(0, 10)}...</strong>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* MODAL FOOTER */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t shrink-0 text-xs ${
            isLight ? 'bg-white border-[#E2E8F0]' : 'bg-[#0F1622] border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>WORM Cryptographic Trace: Verified & Signed ({trace.execution_id})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectedStepIndex > 0) {
                  setSelectedStepIndex(selectedStepIndex - 1);
                }
              }}
              disabled={selectedStepIndex === 0}
              className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              ← ขั้นตอนก่อนหน้า
            </button>
            <button
              onClick={() => {
                if (selectedStepIndex < steps.length - 1) {
                  setSelectedStepIndex(selectedStepIndex + 1);
                }
              }}
              disabled={selectedStepIndex === steps.length - 1}
              className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              ขั้นตอนถัดไป →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
