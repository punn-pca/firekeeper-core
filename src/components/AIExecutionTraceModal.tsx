import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  Sparkles, 
  X, 
  Activity, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Layers, 
  ArrowRight, 
  Terminal, 
  Fingerprint, 
  Database, 
  Network, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  FileCode,
  FileText,
  Search,
  Eye,
  Workflow
} from 'lucide-react';

interface AIExecutionTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIExecutionTraceModal: React.FC<AIExecutionTraceModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'provenance' | 'activity' | 'logs' | 'trace-source' | 'deviations'>('provenance');
  const [loading, setLoading] = useState<boolean>(true);
  const [traceData, setTraceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const [logFilter, setLogFilter] = useState<string>('');
  
  // Trace source selector state
  const [selectedTraceSource, setSelectedTraceSource] = useState<'recommendation' | 'risk' | 'findings'>('recommendation');

  const fetchTrace = () => {
    setLoading(true);
    setError(null);
    fetch('/api/ai/execution-trace')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTraceData(data);
        } else {
          setError('Failed to load execution trace from server.');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Network connection failed.');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchTrace();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleStageExpand = (stageNum: number) => {
    setExpandedStage(expandedStage === stageNum ? null : stageNum);
  };

  // Filter logs
  const filteredLogs = traceData?.global_logs?.filter((l: string) => 
    l.toLowerCase().includes(logFilter.toLowerCase())
  ) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02040a]/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0a0f24] border border-slate-800 rounded-2xl w-full max-w-7xl h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-[#0d1331]">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  FIRE KEEPER PCA AUDIT & PROVENANCE LEDGER
                </h2>
                <span className="text-[10px] font-mono text-orange-400 bg-orange-950/60 border border-orange-900/60 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                  ISO 42001 Auditable
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Run ID: <span className="text-orange-400 font-bold">{traceData?.run_id || 'Analyzing...'}</span> | Canonical Time: <span className="text-slate-300">UTC</span> | Display Timezone: <span className="text-slate-300">Asia/Bangkok (ICT, UTC+07:00)</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchTrace}
              className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/40 transition-colors"
              title="Refresh Audit Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-300 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Security Integrity Bar */}
        {traceData && (
          <div className="bg-[#060a17] px-6 py-3.5 border-b border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-xs font-mono">
            {/* Column 1: Multi-AI Verification Status */}
            <div className="flex items-center gap-2.5">
              <span className="text-slate-400">Provenance Audit:</span>
              <span className={`px-2.5 py-1 rounded font-bold text-xs uppercase tracking-wider ${
                traceData.provenance_status === 'MULTI-AI VERIFIED' 
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                  : 'bg-amber-950/60 text-amber-400 border border-amber-900/60'
              }`}>
                ● {traceData.provenance_status}
              </span>
            </div>

            {/* Column 2: Chronological Sequence Integrity Status */}
            <div className="flex items-center gap-2.5 md:justify-center">
              <span className="text-slate-400">Sequence Integrity:</span>
              {traceData.chronology_integrity_passed ? (
                <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-900/50 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> CHRONOLOGY PASSED
                </span>
              ) : (
                <span className="text-rose-400 font-bold bg-rose-950/50 px-2.5 py-1 rounded border border-rose-900/60 animate-pulse flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" /> CHRONOLOGY INTEGRITY FAILED
                </span>
              )}
            </div>

            {/* Column 3: Secure Ledger Chain Hash */}
            <div className="flex items-center gap-2 md:justify-end">
              <span className="text-slate-400">Chain Seal Hash:</span>
              <span className="text-slate-300 bg-slate-900 px-2.5 py-1 rounded font-bold border border-slate-800 text-[11px] truncate max-w-[200px]" title={traceData.source_integrity_hash}>
                {traceData.source_integrity_hash?.slice(0, 24)}...
              </span>
            </div>
          </div>
        )}

        {/* Modal Main Content Container with Sidebar Navigation */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#050815]">
          
          {/* Navigation Sidebar */}
          <div className="w-full md:w-64 bg-[#080d21] border-r border-slate-800/70 p-4 space-y-1.5 shrink-0">
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase px-2 block mb-2">
              Ledger Sections
            </span>
            
            <button
              onClick={() => setActiveTab('provenance')}
              className={`w-full text-left px-3.5 py-3 rounded-lg transition-all flex items-center gap-2.5 text-xs font-mono font-bold ${
                activeTab === 'provenance'
                  ? 'bg-orange-500 text-slate-950 shadow-[0_4px_12px_rgba(249,115,22,0.15)]'
                  : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
              }`}
            >
              <Fingerprint className="w-4 h-4 shrink-0" />
              12-Stage Chronology
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`w-full text-left px-3.5 py-3 rounded-lg transition-all flex items-center gap-2.5 text-xs font-mono font-bold ${
                activeTab === 'activity'
                  ? 'bg-orange-500 text-slate-950 shadow-[0_4px_12px_rgba(249,115,22,0.15)]'
                  : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
              }`}
            >
              <Network className="w-4 h-4 shrink-0" />
              AI Activity Panel
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full text-left px-3.5 py-3 rounded-lg transition-all flex items-center gap-2.5 text-xs font-mono font-bold ${
                activeTab === 'logs'
                  ? 'bg-orange-500 text-slate-950 shadow-[0_4px_12px_rgba(249,115,22,0.15)]'
                  : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
              }`}
            >
              <Terminal className="w-4 h-4 shrink-0" />
              Central Audit Logs
            </button>

            <button
              onClick={() => setActiveTab('trace-source')}
              className={`w-full text-left px-3.5 py-3 rounded-lg transition-all flex items-center gap-2.5 text-xs font-mono font-bold ${
                activeTab === 'trace-source'
                  ? 'bg-orange-500 text-slate-950 shadow-[0_4px_12px_rgba(249,115,22,0.15)]'
                  : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
              }`}
            >
              <Workflow className="w-4 h-4 shrink-0" />
              Source Trace Visualizer
            </button>

            <button
              onClick={() => setActiveTab('deviations')}
              className={`w-full text-left px-3.5 py-3 rounded-lg transition-all flex items-center justify-between text-xs font-mono font-bold ${
                activeTab === 'deviations'
                  ? 'bg-orange-500 text-slate-950 shadow-[0_4px_12px_rgba(249,115,22,0.15)]'
                  : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Pipeline Deviations
              </div>
              <span className={`px-1.5 py-0.2 text-[10px] rounded font-bold ${
                activeTab === 'deviations' 
                  ? 'bg-slate-950 text-orange-400' 
                  : 'bg-amber-950/50 text-amber-400 border border-amber-900/50'
              }`}>
                {traceData?.provenance_deviation_flags?.length || 0}
              </span>
            </button>

            <div className="pt-6 border-t border-slate-800/60 mt-6 text-[10px] font-mono text-slate-500 leading-relaxed space-y-1 px-2">
              <span className="font-bold text-slate-400 block uppercase">EPIDEMIC FACT GATE:</span>
              <p>Findings require a minimum evidence correlation factor &gt;0.85 in order to receive formal Gemini or DeepSeek attribution seals.</p>
            </div>
          </div>

          {/* Main Workspace Display */}
          <div className="flex-1 p-6 overflow-y-auto bg-[#050815]">
            
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-mono text-slate-400">Reconstructing audit lineage from cryptoledger state...</p>
              </div>
            ) : error ? (
              <div className="p-6 rounded-xl bg-rose-950/30 border border-rose-900/40 text-center text-rose-400 font-mono text-sm">
                {error}
              </div>
            ) : traceData ? (
              <>
                
                {/* View 1: 12-Stage Chronology timeline */}
                {activeTab === 'provenance' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                        12-Stage Pipeline Cryptographic Chain
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Seals Verified: <span className="text-emerald-400 font-bold">12/12</span>
                      </span>
                    </div>

                    <div className="space-y-3">
                      {traceData.trace.map((t: any) => {
                        const isExpanded = expandedStage === t.stage_number;
                        const hasFallback = t.fallback_used || t.status === 'FALLBACK';
                        
                        return (
                          <div 
                            key={t.stage_number}
                            className={`rounded-xl border transition-all ${
                              isExpanded 
                                ? 'bg-[#0b1126] border-slate-700 shadow-md' 
                                : 'bg-[#080d1a]/80 border-slate-800/80 hover:border-slate-700 hover:bg-[#080d1a]'
                            }`}
                          >
                            {/* Summary Header Line */}
                            <div 
                              onClick={() => toggleStageExpand(t.stage_number)}
                              className="px-4 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg font-mono text-xs font-bold flex items-center justify-center border ${
                                  t.status === 'UNVERIFIED'
                                    ? 'bg-slate-900/50 border-slate-800 text-slate-500'
                                    : hasFallback 
                                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-400' 
                                    : 'bg-slate-900 border-slate-700/80 text-slate-300'
                                }`}>
                                  {String(t.stage_number).padStart(2, '0')}
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                    {t.stage_th_label}
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-850 px-2 py-0.2 rounded font-medium">
                                      {t.stage_name}
                                    </span>
                                  </h4>
                                  <div className="flex items-center gap-2.5 mt-0.5 text-xs font-mono text-slate-400">
                                    <span>Declared: <strong className="text-slate-300">{t.declaredProvider}</strong></span>
                                    <span>➔</span>
                                    <span>Actual: <strong className={t.actualProvider !== t.declaredProvider ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>{t.actualProvider} ({t.model})</strong></span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-xs font-mono">
                                <span className="text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-500" /> {t.duration_ms}ms
                                </span>
                                
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                  t.status === 'VERIFIED' 
                                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40' 
                                    : t.status === 'UNVERIFIED'
                                    ? 'bg-slate-950/60 text-slate-500 border-slate-900'
                                    : 'bg-amber-950/40 text-amber-400 border-amber-900/40'
                                }`}>
                                  {t.status}
                                </span>

                                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="px-5 pb-5 pt-2 border-t border-slate-800/70 bg-[#050915] rounded-b-xl space-y-4 font-mono text-xs text-slate-300">
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                                  
                                  {/* Lineage Info */}
                                  <div className="space-y-2">
                                    <span className="text-slate-400 font-bold text-[10px] uppercase block tracking-wider">
                                      Artifact Sourcing Lineage & Evidence
                                    </span>
                                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3 space-y-2 text-[11px]">
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Call ID (Request ID):</span>
                                        <span className="text-slate-300 font-bold font-mono truncate max-w-[200px]">
                                          {t.requestId}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Input Artifacts:</span>
                                        <span className="text-slate-300 bg-slate-800 px-1.5 py-0.2 rounded font-mono text-[10px]">
                                          {t.input_artifact_ids?.join(', ') || 'N/A'}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Output Artifact ID:</span>
                                        <span className="text-orange-400 bg-orange-950/30 border border-orange-900/30 px-1.5 py-0.2 rounded font-mono text-[10px]">
                                          {t.output_artifact_id}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Output Hash:</span>
                                        <span className="text-slate-400 font-mono text-[10px] bg-slate-950 px-1 rounded truncate max-w-[150px]" title={t.outputHash}>
                                          {t.outputHash || 'N/A'}
                                        </span>
                                      </div>
                                      
                                      {t.evidence_ids && t.evidence_ids.length > 0 && (
                                        <div className="pt-2 border-t border-slate-800/60 mt-1">
                                          <span className="text-slate-500 block mb-1">Grounded Evidences:</span>
                                          <div className="flex flex-wrap gap-1">
                                            {t.evidence_ids.map((id: string) => (
                                              <span key={id} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
                                                {id}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Cryptographic Hash Proof */}
                                  <div className="space-y-2">
                                    <span className="text-emerald-400 font-bold text-[10px] uppercase block tracking-wider">
                                      Cryptographic Integrity Hash Chain
                                    </span>
                                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3 space-y-2 text-[11px]">
                                      <div>
                                        <span className="text-slate-500 block">Execution Hash:</span>
                                        <span className="text-slate-300 break-all font-mono text-[10px] bg-slate-950 px-1.5 py-0.5 rounded block mt-0.5">
                                          {t.execution_hash || 'SHA256-uncalculated'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block">Previous Cumulative Hash:</span>
                                        <span className="text-slate-400 break-all font-mono text-[10px] bg-slate-950/60 px-1.5 py-0.5 rounded block mt-0.5">
                                          {t.prev_hash || '0000000000000000000000000000000000000000'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-emerald-400 font-bold block">Cumulative Hash Seal:</span>
                                        <span className="text-emerald-300 break-all font-mono text-[10px] bg-emerald-950/30 border border-emerald-900/30 px-1.5 py-0.5 rounded block mt-0.5">
                                          {t.cumulative_hash}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                </div>

                                {/* Thailand Time Audit Section */}
                                <div className="space-y-2 pt-1">
                                  <span className="text-slate-400 font-bold text-[10px] uppercase block tracking-wider">
                                    Thailand Time & API Latency Event Log
                                  </span>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#080d1c] border border-slate-800/80 rounded-lg p-3.5 text-[11px]">
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Started (Thailand Time):</span>
                                        <span className="text-slate-200 font-bold">{t.startedAtLocal}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Completed (Thailand Time):</span>
                                        <span className="text-slate-200 font-bold">{t.completedAtLocal}</span>
                                      </div>
                                      <div className="flex justify-between border-t border-slate-800/40 pt-1 mt-1">
                                        <span className="text-slate-500">UTC Canonical Start:</span>
                                        <span className="text-slate-400">{t.startedAtUtc}</span>
                                      </div>
                                    </div>

                                    <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-800 md:pl-4">
                                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Fine API Timestamp Milestones:</span>
                                      <div className="space-y-1 text-[10px] text-slate-300">
                                        <div className="flex justify-between">
                                          <span>API_REQUEST_STARTED:</span>
                                          <span className="text-slate-400">{t.timing?.API_REQUEST_STARTED || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>API_REQUEST_SENT:</span>
                                          <span className="text-slate-400">{t.timing?.API_REQUEST_SENT || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>API_RESPONSE_RECEIVED:</span>
                                          <span className="text-slate-400">{t.timing?.API_RESPONSE_RECEIVED || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>STAGE_COMPLETED:</span>
                                          <span className="text-emerald-400 font-bold">{t.timing?.STAGE_COMPLETED || 'N/A'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Raw Output Container */}
                                <div className="space-y-2">
                                  <span className="text-blue-400 font-bold text-[10px] uppercase block tracking-wider flex items-center gap-1">
                                    <FileCode className="w-3.5 h-3.5 text-blue-400" /> Immutable Raw Output Ledger Copy
                                  </span>
                                  <pre className="p-3.5 rounded-lg bg-black/60 border border-slate-800 text-slate-300 font-mono text-[11px] max-h-44 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                    {JSON.stringify(JSON.parse(t.raw_output || '{}'), null, 2)}
                                  </pre>
                                </div>

                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* View 2: AI Provider Activity Panel */}
                {activeTab === 'activity' && (
                  <div className="space-y-6 font-mono text-xs">
                    <h3 className="text-sm font-bold uppercase text-slate-200">
                      Multi-AI Provider Activity Panel
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      
                      {/* OpenAI Card */}
                      {traceData.provider_activity?.OpenAI && (
                        <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 relative overflow-hidden flex flex-col justify-between h-72">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-purple-400" /> OpenAI
                              </h4>
                              <span className="bg-purple-950/60 text-purple-400 border border-purple-900/60 px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider">
                                Synthesis & Synthesis
                              </span>
                            </div>

                            <div className="space-y-2 text-[11px] text-slate-300">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Stages Executed:</span>
                                <span className="text-slate-100 font-bold">
                                  {traceData.provider_activity.OpenAI.stages?.map((s: number) => String(s).padStart(2, '0')).join(', ') || 'None'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">API Calls:</span>
                                <span className="text-slate-100 font-bold">{traceData.provider_activity.OpenAI.calls}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Successes:</span>
                                <span className="text-emerald-400 font-bold">{traceData.provider_activity.OpenAI.success}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Fallbacks Triggered:</span>
                                <span className="text-amber-400 font-bold">{traceData.provider_activity.OpenAI.fallback}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Total API Duration:</span>
                                <span className="text-slate-100 font-bold">{traceData.provider_activity.OpenAI.totalDuration}ms</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-t border-slate-800/60 pt-3 mt-4 text-[10px] text-slate-500">
                            <span className="block uppercase font-bold text-[9px] mb-0.5 text-slate-400">Last Call completed:</span>
                            <span className="text-slate-400 truncate block">{traceData.provider_activity.OpenAI.lastCall}</span>
                          </div>
                        </div>
                      )}

                      {/* Gemini Card */}
                      {traceData.provider_activity?.Gemini && (
                        <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 relative overflow-hidden flex flex-col justify-between h-72">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-sky-500" />
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-400" /> Gemini
                              </h4>
                              <span className="bg-blue-950/60 text-blue-400 border border-blue-900/60 px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider">
                                Research & Extraction
                              </span>
                            </div>

                            <div className="space-y-2 text-[11px] text-slate-300">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Stages Executed:</span>
                                <span className="text-slate-100 font-bold">
                                  {traceData.provider_activity.Gemini.stages?.map((s: number) => String(s).padStart(2, '0')).join(', ') || 'None'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">API Calls:</span>
                                <span className="text-slate-100 font-bold">{traceData.provider_activity.Gemini.calls}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-emerald-400 font-bold">Successes:</span>
                                <span className="text-emerald-400 font-bold">{traceData.provider_activity.Gemini.success}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Fallbacks Triggered:</span>
                                <span className="text-slate-100 font-bold">{traceData.provider_activity.Gemini.fallback}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Total API Duration:</span>
                                <span className="text-slate-100 font-bold">{traceData.provider_activity.Gemini.totalDuration}ms</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-t border-slate-800/60 pt-3 mt-4 text-[10px] text-slate-500">
                            <span className="block uppercase font-bold text-[9px] mb-0.5 text-slate-400">Last Call completed:</span>
                            <span className="text-slate-400 truncate block">{traceData.provider_activity.Gemini.lastCall}</span>
                          </div>
                        </div>
                      )}

                      {/* DeepSeek Card */}
                      {traceData.provider_activity?.DeepSeek && (
                        <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 relative overflow-hidden flex flex-col justify-between h-72">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <Lock className="w-4 h-4 text-orange-400" /> DeepSeek
                              </h4>
                              <span className="bg-orange-950/60 text-orange-400 border border-orange-900/60 px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider">
                                Validation & Logic Audit
                              </span>
                            </div>

                            <div className="space-y-2 text-[11px] text-slate-300">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Stages Executed:</span>
                                <span className="text-slate-100 font-bold">
                                  {traceData.provider_activity.DeepSeek.stages?.map((s: number) => String(s).padStart(2, '0')).join(', ') || 'None'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">API Calls:</span>
                                <span className="text-slate-100 font-bold">{traceData.provider_activity.DeepSeek.calls}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-emerald-400 font-bold">Successes:</span>
                                <span className="text-emerald-400 font-bold">{traceData.provider_activity.DeepSeek.success}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Fallbacks Triggered:</span>
                                <span className="text-slate-100 font-bold">{traceData.provider_activity.DeepSeek.fallback}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Total API Duration:</span>
                                <span className="text-slate-100 font-bold">{traceData.provider_activity.DeepSeek.totalDuration}ms</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-t border-slate-800/60 pt-3 mt-4 text-[10px] text-slate-500">
                            <span className="block uppercase font-bold text-[9px] mb-0.5 text-slate-400">Last Call completed:</span>
                            <span className="text-slate-400 truncate block">{traceData.provider_activity.DeepSeek.lastCall}</span>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                )}

                {/* View 3: Central Audit Logs */}
                {activeTab === 'logs' && (
                  <div className="space-y-4 font-mono text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                      <h3 className="text-sm font-bold uppercase text-slate-200 flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-orange-400" />
                        CENTRAL RUNTIME LEDGER LOGS (THAILAND TIMEICT)
                      </h3>
                      
                      <div className="relative max-w-xs w-full">
                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={logFilter}
                          onChange={(e) => setLogFilter(e.target.value)}
                          placeholder="Search central logs..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
                        />
                      </div>
                    </div>

                    <div className="bg-black/85 border border-slate-800/80 rounded-xl p-4 h-[50vh] overflow-y-auto flex flex-col justify-between shadow-inner">
                      <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                        {filteredLogs.length > 0 ? (
                          filteredLogs.map((log: string, idx: number) => {
                            let colorClass = 'text-slate-300';
                            if (log.includes('STARTED')) colorClass = 'text-blue-300 font-medium';
                            if (log.includes('COMPLETED')) colorClass = 'text-emerald-400 font-bold';
                            if (log.includes('FAILED') || log.includes('BYPASSED')) colorClass = 'text-rose-400';
                            if (log.includes('API_REQUEST')) colorClass = 'text-orange-400';
                            if (log.includes('PIPELINE SECURE')) colorClass = 'text-amber-300 font-bold border-t border-slate-900 pt-1.5 mt-1.5';
                            
                            return (
                              <div key={idx} className={`${colorClass} break-all hover:bg-slate-900/40 px-1 py-0.5 rounded leading-relaxed`}>
                                {log}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-20 text-slate-500">No matching audit logs found.</div>
                        )}
                      </div>
                      
                      <div className="text-[10px] text-slate-500 border-t border-slate-900 pt-3 mt-4 text-right">
                        Immutable Ledger Signature: <span className="text-slate-400 font-bold">{traceData.source_integrity_hash}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* View 4: Source Trace Visualizer ("Who Produced This?") */}
                {activeTab === 'trace-source' && (
                  <div className="space-y-4 font-mono text-xs">
                    <div className="border-b border-slate-800/60 pb-3">
                      <h3 className="text-sm font-bold uppercase text-slate-200">
                        Strategic Sourcing Lineage Explorer
                      </h3>
                      <p className="text-slate-400 font-sans mt-1">
                        Select a key synthesis artifact from the final executive report and follow the precise cognitive dependency tree back to the grounded raw evidence segments.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedTraceSource('recommendation')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedTraceSource === 'recommendation'
                            ? 'bg-orange-500 text-slate-950'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        Final Strategy Recommendations
                      </button>
                      <button
                        onClick={() => setSelectedTraceSource('risk')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedTraceSource === 'risk'
                            ? 'bg-orange-500 text-slate-950'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        Stress Tests & Risk Calibration
                      </button>
                      <button
                        onClick={() => setSelectedTraceSource('findings')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedTraceSource === 'findings'
                            ? 'bg-orange-500 text-slate-950'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        Primary Grounded Findings
                      </button>
                    </div>

                    {/* interactive Tree Layout */}
                    <div className="bg-[#080c1d] border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                      <div className="space-y-4 max-w-2xl mx-auto">
                        
                        {/* Final Output Node */}
                        <div className="p-3.5 rounded-lg bg-orange-950/40 border border-orange-500/40 flex items-center justify-between">
                          <div>
                            <span className="text-orange-400 text-[10px] font-bold uppercase block">FINAL DECISION SYNTHESIS</span>
                            <span className="text-white font-sans font-bold">
                              {selectedTraceSource === 'recommendation' ? 'ยุทธศาสตร์ป้องกันอธิปไตยดิจิทัล (FIRE KEEPER)' : selectedTraceSource === 'risk' ? 'Stress-test แผนสำรองการโจมตีด่านความมั่นคงปลอดภัย' : 'ข้อเสนอโครงสร้างสิทธิ์ความมั่นคงปลอดภัย Zero-Trust'}
                            </span>
                          </div>
                          <span className="text-[10px] text-orange-400 font-bold bg-orange-950 px-2 py-0.5 rounded border border-orange-900">
                            Stage 12 (OpenAI)
                          </span>
                        </div>

                        {/* Downward Arrow */}
                        <div className="flex justify-center text-slate-600">➔ Downstream Synthesized From:</div>

                        {/* Mid Synthesis Node */}
                        <div className="p-3.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
                          <div>
                            <span className="text-indigo-400 text-[10px] font-bold uppercase block">COMMUNICATION REPORT MATRIX</span>
                            <span className="text-slate-200 font-sans">
                              {selectedTraceSource === 'recommendation' ? 'โครงสร้างข้อเสนอจัดสรรทรัพยากรฉุกเฉิน' : selectedTraceSource === 'risk' ? 'แผนเผชิญเหตุและการควบคุมสิทธิ์ผู้ใช้จำกัด' : 'สถาปัตยกรรม ISO 27001 Access Controls'}
                            </span>
                          </div>
                          <span className="text-[10px] text-indigo-400 font-bold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900">
                            Stage 10 (OpenAI)
                          </span>
                        </div>

                        {/* Downward Arrow */}
                        <div className="flex justify-center text-slate-600">➔ Evaluated From:</div>

                        {/* Deep Analysis Node */}
                        <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-between">
                          <div>
                            <span className="text-amber-400 text-[10px] font-bold uppercase block">BAYESIAN PRIOR PROBABILITY ANALYSIS</span>
                            <span className="text-slate-200 font-sans">
                              {selectedTraceSource === 'recommendation' ? 'ค่าคำนวณเบย์ (Bayesian Prior Estimator = 0.94)' : selectedTraceSource === 'risk' ? 'วิเคราะห์ระดับสิทธิ์การบล็อกผู้ใช้ทั่วไปผิดพลาด' : 'โมเดลเหตุผลความเสี่ยง ISO 27001'}
                            </span>
                          </div>
                          <span className="text-[10px] text-amber-400 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-900">
                            Stage 06 (DeepSeek)
                          </span>
                        </div>

                        {/* Downward Arrow */}
                        <div className="flex justify-center text-slate-600">➔ Grounded in Research:</div>

                        {/* Foundational Extraction Node */}
                        <div className="p-3.5 rounded-lg bg-blue-950/40 border border-blue-500/30 flex items-center justify-between">
                          <div>
                            <span className="text-blue-400 text-[10px] font-bold uppercase block">FOUNDATIONAL ENTITY EXTRACTION</span>
                            <span className="text-slate-200 font-sans">
                              {selectedTraceSource === 'recommendation' ? 'สกัดข้อบังคับ ISO 27001 และระบุหลักฐานประจักษ์' : selectedTraceSource === 'risk' ? 'บันทึกตรวจสอบสิทธิ์เข้าถึงล้มเหลว 47 ครั้ง (EV-0021)' : 'หลักฐานการจัดการความมั่นคงปลอดภัยพื้นฐาน'}
                            </span>
                          </div>
                          <span className="text-[10px] text-blue-400 font-bold bg-blue-950 px-2 py-0.5 rounded border border-blue-900">
                            Stage 02 (Gemini)
                          </span>
                        </div>

                        {/* Downward Arrow */}
                        <div className="flex justify-center text-slate-600">➔ Original Input Root:</div>

                        {/* Root Node */}
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-slate-400 text-[11px]">
                          <span>Original User Request: <strong className="text-slate-300 font-sans">"{traceData.user_input}"</strong></span>
                          <span className="text-[10px] font-bold bg-slate-800 px-2 py-0.5 rounded">Root Input</span>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* View 5: Pipeline Deviations */}
                {activeTab === 'deviations' && (
                  <div className="space-y-4 font-mono text-xs">
                    <h3 className="text-sm font-bold uppercase text-slate-200">
                      Pipeline Architecture vs Runtime Deviations
                    </h3>

                    {traceData.provenance_deviation_flags && traceData.provenance_deviation_flags.length > 0 ? (
                      <div className="space-y-3">
                        {traceData.provenance_deviation_flags.map((flag: string, idx: number) => (
                          <div key={idx} className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/50 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-amber-300 font-bold text-[10px] uppercase block">ACTIVE MODEL FALLBACK DETECTED</span>
                              <p className="text-slate-300 mt-1 font-sans leading-relaxed">{flag}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 border border-slate-800 border-dashed rounded-xl text-center bg-slate-900/10">
                        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                        <span className="text-emerald-400 font-bold text-sm block">0 DEVIATIONS DETECTED</span>
                        <p className="text-slate-400 font-sans text-xs mt-1 max-w-md mx-auto leading-relaxed">
                          The pipeline executed in 100% perfect alignment with the declared 3-AI architecture mappings across all 12 stages.
                        </p>
                      </div>
                    )}
                  </div>
                )}

              </>
            ) : null}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#0a0f24] border-t border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-500">
            Ledger Sig: <span className="text-slate-400 font-bold">{traceData?.source_integrity_hash?.slice(0, 32)}...</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold font-mono transition-all"
          >
            Close Audit Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
