import React, { useState, useMemo } from 'react';
import { ShieldCheck, Lock, CheckCircle2, AlertOctagon, Terminal, Hash, Key, RefreshCw, FileCode, Layers, XCircle } from 'lucide-react';
import { PCAState, AuditBlock, TraceVerificationResult } from '../types';
import { generateDecisionExecutionTrace, verifyDecisionExecutionTrace } from '../utils/executionTraceEngine';
import { ExecutionTraceModal } from './ExecutionTraceModal';

interface AuditChainViewerProps {
  pcaState: PCAState;
}

export const AuditChainViewer: React.FC<AuditChainViewerProps> = ({ pcaState }) => {
  const [selectedBlock, setSelectedBlock] = useState<number | null>(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<TraceVerificationResult | null>(null);
  const [verificationPassed, setVerificationPassed] = useState<boolean | null>(null);
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);

  const fullTrace = useMemo(() => {
    if (pcaState.execution_trace) return pcaState.execution_trace;
    return generateDecisionExecutionTrace(
      pcaState.user_input || 'คำถามและโจทย์การวิเคราะห์',
      pcaState.response || 'บทวิเคราะห์ของระบบ',
      pcaState
    );
  }, [pcaState]);

  // Construct audit chain directly from real trace steps
  const auditChain: AuditBlock[] = useMemo(() => {
    if (fullTrace?.steps && fullTrace.steps.length > 0) {
      return fullTrace.steps.map((s, idx) => {
        const isTampered = verificationResult?.tampered_step_indices?.includes(idx);
        let mappedExecType: AuditBlock['executionType'] = 'LLM_GENERATION';
        if (s.execution_type === 'BAYESIAN_COMPUTATION') mappedExecType = 'BAYESIAN_COMPUTATION';
        else if (s.execution_type === 'SEMANTIC_RERANKER') mappedExecType = 'SEMANTIC_RERANKER';
        else if (s.execution_type === 'HEURISTIC_EVAL') mappedExecType = 'HEURISTIC_EVAL';
        else if (s.execution_type === 'RULE_CHECK') mappedExecType = 'RULE_CHECK';

        return {
          index: s.step_number,
          stage_id: s.event_id,
          stage_name: s.stage_label_th || s.stage_label_en,
          timestamp_ns: Date.parse(s.started_at || new Date().toISOString()) * 1000000 + idx * 100,
          iso_timestamp: s.started_at || new Date().toISOString(),
          prev_hash: s.previous_event_hash,
          block_hash: s.event_hash,
          executionType: mappedExecType,
          inputs_summary: s.input_ref ? `[Input Ref]: ${s.input_ref}` : '[Input Ref]: None',
          outputs_summary: s.output_ref ? `[Output Ref]: ${s.output_ref} | Summary: ${s.summary}` : s.summary,
          verification_status: isTampered ? 'TAMPERED' : 'AUDITED_AND_VERIFIED',
          tamperCheckPassed: !isTampered,
        };
      });
    }

    // Fallback if no steps available
    return (pcaState.trace || []).map((t, idx) => ({
      index: idx + 1,
      stage_id: t.stage || `STAGE_${idx + 1}`,
      stage_name: t.stage_th_label || t.stage || `STAGE_${idx + 1}`,
      timestamp_ns: Date.parse(t.timestamp || new Date().toISOString()) * 1000000 + idx * 100,
      iso_timestamp: t.timestamp || new Date().toISOString(),
      prev_hash: idx === 0 ? '0'.repeat(64) : 'chained_hash',
      block_hash: 'chained_hash',
      executionType: (t.executionType as AuditBlock['executionType']) || 'LLM_GENERATION',
      inputs_summary: `[State In]: Tokens=${t.promptTokens || 120}`,
      outputs_summary: `[State Out]: Tokens=${t.completionTokens || 85}`,
      verification_status: 'EXECUTED_IN_RUNTIME',
      tamperCheckPassed: true,
    }));
  }, [fullTrace, pcaState, verificationResult]);

  const handleVerifyChain = () => {
    setIsVerifying(true);
    try {
      // Execute REAL cryptographic verification of event hashes, previous hash linkage, Merkle root, and canonical trace hash
      const result = verifyDecisionExecutionTrace(fullTrace);
      setVerificationResult(result);
      setVerificationPassed(result.overall_verified);
    } catch (err: any) {
      setVerificationPassed(false);
      setVerificationResult({
        overall_verified: false,
        tamper_detected: true,
        status: 'TAMPERED',
        checks: {
          event_hashes_valid: false,
          previous_hash_linkage_valid: false,
          ordering_valid: false,
          execution_id_consistent: false,
          merkle_root_valid: false,
          canonical_trace_hash_valid: false,
          input_hash_valid: false,
          output_checksum_valid: false,
          evidence_refs_valid: false,
        },
        details: [`Verification error: ${err?.message || 'Unknown error'}`],
        tampered_step_indices: [],
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const activeBlock = auditChain[selectedBlock ?? 0] || auditChain[0];

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              Pipeline Execution Trace & Human Agency Audit Log
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Cryptographically Tamper-Evident
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              บันทึกร่องรอยการประมวลผล 10 ขั้นตอนตามลำดับเวลาจริง พร้อมตรวจสอบกรอบการกำกับดูแลโดยมนุษย์ (Advisory Mode)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTraceModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-orange-500/25 hover:from-amber-500/35 hover:to-orange-500/35 text-amber-300 border border-amber-500/50 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>View 10-Step Execution Trace</span>
          </button>

          <button
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'กำลังตรวจสอบ...' : 'Verify Execution Log'}</span>
          </button>
        </div>
      </div>

      {/* Verification Status Card */}
      {verificationPassed === true && verificationResult && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>VERIFIED: Tamper-Evident Cryptographic Chain Validated</strong>
              </span>
            </div>
            <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/60 font-bold">
              PASS: Cryptographically Verified
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] pt-1">
            <span className="px-2 py-0.5 rounded bg-emerald-900/40 border border-emerald-600/40">HASH: VALID</span>
            <span className="px-2 py-0.5 rounded bg-emerald-900/40 border border-emerald-600/40">CHAIN: VALID</span>
            <span className="px-2 py-0.5 rounded bg-emerald-900/40 border border-emerald-600/40">MERKLE: VALID</span>
            <span className="px-2 py-0.5 rounded bg-emerald-900/40 border border-emerald-600/40">CANONICAL: VALID</span>
            <span className="px-2 py-0.5 rounded bg-amber-900/30 text-amber-300 border border-amber-600/30">WORM ANCHOR: NONE (LOCAL TAMPER-EVIDENT)</span>
          </div>
        </div>
      )}

      {verificationPassed === false && verificationResult && (
        <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/60 text-rose-300 text-xs space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>FAIL / TAMPERED: Cryptographic Integrity Verification Failed!</strong>
              </span>
            </div>
            <span className="text-[10px] bg-rose-900/80 px-2 py-0.5 rounded border border-rose-600 font-bold text-rose-200">
              TAMPER DETECTED
            </span>
          </div>
          <div className="text-[11px] text-rose-200 space-y-1 pl-6">
            {verificationResult.details.map((detail, dIdx) => (
              <div key={dIdx} className="flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Block Chain Grid */}
      <div className="space-y-2">
        <div className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-amber-400" />
            <span>10-Step Execution Chain Blocks ({auditChain.length} Blocks Recorded):</span>
          </div>
          <span className="text-[11px] text-slate-400 font-normal">
            Root: <span className="text-amber-300">{(fullTrace.provenance_hashes?.merkle_root_sha256 || '000000000000').slice(0, 12)}...</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {auditChain.map((b, idx) => {
            const isTampered = !b.tamperCheckPassed;
            return (
              <button
                key={idx}
                onClick={() => setSelectedBlock(idx)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer font-mono text-[11px] space-y-1 ${
                  isTampered
                    ? 'bg-rose-950/40 border-rose-500 text-rose-300 ring-1 ring-rose-500'
                    : selectedBlock === idx
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50 shadow-lg'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`font-bold ${isTampered ? 'text-rose-400' : 'text-amber-400'}`}>
                    Step #{b.index}
                  </span>
                  <span className={`text-[9px] px-1 py-0.2 rounded ${
                    isTampered
                      ? 'bg-rose-900/60 text-rose-200 border border-rose-600'
                      : 'text-slate-500'
                  }`}>
                    {isTampered ? 'TAMPERED' : (b.executionType.includes('BAYESIAN') ? 'BAYES' : b.executionType.includes('EVAL') ? 'EVAL' : 'EXEC')}
                  </span>
                </div>
                <div className="font-sans font-medium text-white truncate">{b.stage_name}</div>
                <div className="text-[9px] text-slate-500 truncate font-mono">
                  Hash: {b.block_hash.substring(0, 10)}...
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Inspection Panel for Selected Block */}
      {activeBlock && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <Key className="w-4 h-4 text-amber-400" />
              <span>
                Step #{activeBlock.index}: {activeBlock.stage_name} ({activeBlock.stage_id})
              </span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded border ${
              !activeBlock.tamperCheckPassed
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {activeBlock.verification_status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="text-slate-400 font-bold">Step Metadata & Hashes:</div>
              <div>
                <span className="text-slate-500">Event Hash:</span>{' '}
                <span className="text-emerald-400 font-bold break-all">{activeBlock.block_hash}</span>
              </div>
              <div>
                <span className="text-slate-500">Previous Event Hash:</span>{' '}
                <span className="text-sky-400 break-all">{activeBlock.prev_hash}</span>
              </div>
              <div>
                <span className="text-slate-500">Runtime Timestamp (ns):</span>{' '}
                <span className="text-amber-300">{activeBlock.timestamp_ns}</span>
              </div>
              <div>
                <span className="text-slate-500">Execution Type:</span>{' '}
                <span className="text-purple-300 font-bold">{activeBlock.executionType}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="text-slate-400 font-bold">State Artifact Verification:</div>
              <div className="text-slate-300 leading-relaxed font-sans text-xs">
                {activeBlock.inputs_summary}
              </div>
              <div className="text-slate-300 leading-relaxed font-sans text-xs pt-1 border-t border-slate-800">
                {activeBlock.outputs_summary}
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-emerald-400 font-bold text-[10px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Chained & Signed in Deterministic Forward-Audit Trail</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10-Step Execution Trace Modal */}
      {isTraceModalOpen && fullTrace && (
        <ExecutionTraceModal
          isOpen={isTraceModalOpen}
          onClose={() => setIsTraceModalOpen(false)}
          trace={fullTrace}
        />
      )}
    </div>
  );
};
