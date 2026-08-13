import React from 'react';
import { Activity, GitBranch, ArrowRight, RefreshCw, CheckCircle2, Zap, Layers, ShieldCheck, Lock, Hash } from 'lucide-react';
import { CognitivePipelineMachine, TraceEntry, PCA_STAGES, PromptAssemblyManifest } from '../types';

interface PipelineMachineViewerProps {
  pipelineMachine?: CognitivePipelineMachine;
  assemblyManifest?: PromptAssemblyManifest;
  trace?: TraceEntry[];
  totalLatencyMs?: number;
}

export const PipelineMachineViewer: React.FC<PipelineMachineViewerProps> = ({
  pipelineMachine,
  assemblyManifest,
  trace = [],
  totalLatencyMs = 850,
}) => {
  const currentStatus = pipelineMachine?.state_status || 'Completed';

  // Dependency mapping for 12 stages
  const stageDependencies = [
    { stage: 'S1 Observation', dependsOn: 'User Input', type: 'Sequential', parallelGroup: 'Group 1' },
    { stage: 'S2 Understanding', dependsOn: 'S1', type: 'Sequential', parallelGroup: 'Group 1' },
    { stage: 'S3 Purpose & Scope', dependsOn: 'S2', type: 'Parallel', parallelGroup: 'Group 2' },
    { stage: 'S4 Memory Retrieval', dependsOn: 'S2', type: 'Parallel', parallelGroup: 'Group 2' },
    { stage: 'S5 Mental Model & Graph', dependsOn: 'S3, S4', type: 'Sequential', parallelGroup: 'Group 3' },
    { stage: 'S6 Hypotheses Engine', dependsOn: 'S5', type: 'Parallel', parallelGroup: 'Group 4' },
    { stage: 'S7 Evidence Evaluation', dependsOn: 'S6', type: 'Parallel', parallelGroup: 'Group 4' },
    { stage: 'S8 Critique & Risk', dependsOn: 'S7', type: 'Sequential', parallelGroup: 'Group 5' },
    { stage: 'S9 Decision Support', dependsOn: 'S8', type: 'Branch & Merge', parallelGroup: 'Group 6' },
    { stage: 'S10 Executive Synth', dependsOn: 'S9', type: 'Sequential', parallelGroup: 'Group 7' },
    { stage: 'S11 Reflection Loop', dependsOn: 'S10', type: 'Feedback Loop', parallelGroup: 'Group 8' },
    { stage: 'S12 Learning & Agency', dependsOn: 'S11', type: 'Sequential', parallelGroup: 'Group 9' },
  ];

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-amber-300 flex items-center gap-2">
              Cognitive Pipeline Machine v2.0
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 uppercase">
                STATUS: {currentStatus}
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              ผังการทำงานของ Cognitive State Machine แสดง Stage Dependency, Parallel Execution, Retry Loops และ Confidence Flow
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 font-mono text-xs">
          <span className="text-slate-500 block text-[10px]">Total Latency</span>
          <span className="font-bold text-amber-400">{totalLatencyMs} ms</span>
        </div>
      </div>

      {/* State Machine Status Panel */}
      {pipelineMachine && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block">THINKING STATE</span>
            <p className="text-slate-200 font-sans line-clamp-2">{pipelineMachine.thinking}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block">REASONING STATE</span>
            <p className="text-slate-200 font-sans line-clamp-2">{pipelineMachine.reasoning}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block">DECISION STATE</span>
            <p className="text-slate-200 font-sans line-clamp-2">{pipelineMachine.decision}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block">REFLECTION DELTA</span>
            <p className="text-slate-200 font-sans line-clamp-2">{pipelineMachine.reflection}</p>
          </div>
        </div>
      )}

      {/* Enterprise Prompt Assembly Manifest & Fingerprint Panel */}
      {assemblyManifest && (
        <div className="p-4 rounded-xl bg-slate-950/90 border border-sky-500/30 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-xs text-sky-400 font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              Enterprise Prompt Assembly Manifest & SHA-256 Fingerprint
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/40">
              Version: {assemblyManifest.promptVersion} | Total Tokens: {assemblyManifest.total_input_tokens}
            </span>
          </div>

          {/* Knowledge Sources Audit Flags */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-400 block">Knowledge Sources Active Audit:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
              {Object.entries(assemblyManifest.knowledge_sources).map(([key, active]) => (
                <div
                  key={key}
                  className={`p-2 rounded border flex items-center justify-between ${
                    active
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="capitalize text-[10px]">{key.replace('_', ' ')}</span>
                  <span className="text-xs font-bold">{active ? '✓' : '✗'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prompt Fingerprint Hash */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 font-mono text-xs">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1 text-amber-300"><Hash className="w-3.5 h-3.5" /> Assembly Final Prompt SHA-256 Fingerprint:</span>
              <span className="text-emerald-400">IP-Protected (No Raw Prompt Exposure)</span>
            </div>
            <div className="text-[11px] text-slate-300 break-all bg-slate-950 p-2 rounded border border-slate-800 select-all font-mono">
              {assemblyManifest.assembly_hash}
            </div>
          </div>

          {/* Components breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-0.5">
              <div className="text-[10px] text-slate-400">System Prompt</div>
              <div className="text-sky-300 font-bold text-[11px]">{assemblyManifest.components.systemPrompt.version} ({assemblyManifest.components.systemPrompt.tokens} tokens)</div>
              <div className="text-[9px] text-slate-500 truncate">Hash: {assemblyManifest.components.systemPrompt.hash.slice(0, 16)}...</div>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-0.5">
              <div className="text-[10px] text-slate-400">Developer / Tone Prompt</div>
              <div className="text-amber-300 font-bold text-[11px]">{assemblyManifest.components.developerPrompt.version} ({assemblyManifest.components.developerPrompt.tokens} tokens)</div>
              <div className="text-[9px] text-slate-500 truncate">Hash: {assemblyManifest.components.developerPrompt.hash.slice(0, 16)}...</div>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-0.5">
              <div className="text-[10px] text-slate-400">Retrieved Memory & RAG</div>
              <div className="text-emerald-300 font-bold text-[11px]">{assemblyManifest.components.retrievedMemory.length} memories, {assemblyManifest.components.retrievedDocs.length} docs</div>
              <div className="text-[9px] text-slate-500">Conv: {assemblyManifest.components.conversation.messages} msgs</div>
            </div>
          </div>
        </div>
      )}

      {/* Stage Dependency & Parallel Execution Matrix */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <span className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
          <GitBranch className="w-4 h-4 text-amber-400" />
          ผังการเชื่อมโยงขั้นตอน (Stage Dependency & Parallel Execution Flow)
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {stageDependencies.map((sd, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 font-mono">{sd.stage}</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                  {sd.type}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 flex justify-between pt-1 border-t border-slate-800/80">
                <span>Depends on: <strong className="text-sky-400">{sd.dependsOn}</strong></span>
                <span className="text-slate-500">{sd.parallelGroup}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

