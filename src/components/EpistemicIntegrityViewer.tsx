import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  FileCheck2,
  FileSpreadsheet,
  AlertTriangle,
  Fingerprint,
  Info,
  ChevronDown,
  ChevronUp,
  Server,
  Database,
  Search,
  Network,
  Scale,
  Settings,
  HelpCircle,
  TrendingUp,
  Layers,
  History,
  GitBranch,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getThemeTokens } from '../utils/themeTokens';

interface EpistemicClaim {
  claim_id: string;
  claim: string;
  epistemic_type: 'FACT' | 'INFERENCE' | 'HYPOTHESIS' | 'ESTIMATE' | 'UNKNOWN' | 'PREFERENCE' | 'CONSTRAINT';
  supporting_evidence: Array<{
    evidence_id: string;
    content: string;
    source: string;
    source_reliability: 'HIGH' | 'MODERATE' | 'LOW';
    evidence_relevance: 'HIGH' | 'MODERATE' | 'LOW';
    evidence_strength: 'STRONG' | 'MODERATE' | 'WEAK';
    claim_support_strength: 'STRONG' | 'MODERATE' | 'WEAK';
    source_timestamp?: string;
    source_type: 'SYSTEM_EVIDENCE' | 'DECISION_EVIDENCE';
    evidence_confidence: number;
    corroboration_status: 'CORROBORATED' | 'UNCORROBORATED' | 'CONFLICTING';
  }>;
  source: string;
  source_timestamp?: string;
  source_type: 'SYSTEM_EVIDENCE' | 'DECISION_EVIDENCE';
  evidence_strength: 'STRONG' | 'MODERATE' | 'WEAK';
  evidence_confidence: number;
  corroboration_status: 'CORROBORATED' | 'UNCORROBORATED' | 'CONFLICTING';
}

interface InternalConsistencyWarning {
  conflict_id: string;
  conflicting_fields: string[];
  explanation: string;
  severity: 'CRITICAL' | 'WARNING' | 'NOTICE';
  required_review: string;
  resolution_status: 'UNRESOLVED_CONTRADICTION' | 'RESOLVED_BY_RULE' | 'HUMAN_RESOLVED';
}

interface MissingInformationRegistryItem {
  missing_id: string;
  missing_information: string;
  why_needed: string;
  decision_impact: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING_COLLECTION' | 'COLLECTED' | 'DISMISSED';
}

interface RiskArchitectureItem {
  risk_id: string;
  risk_type: 'System Risk' | 'Data Risk' | 'Evidence Risk' | 'Inference Risk' | 'Decision Risk' | 'Operational Risk';
  probability: 'High' | 'Medium' | 'Low';
  impact: 'High' | 'Medium' | 'Low';
  evidence_basis: string;
  uncertainty: string;
  mitigation: string;
  owner_reviewer: string;
  trigger_condition: string;
}

interface DecisionAlternativeOption {
  option_id: string;
  title: string;
  description: string;
  evidence_strength: 'STRONG' | 'MODERATE' | 'WEAK';
  inference_confidence: number | string;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  decision_robustness: number | string;
  trade_offs: string;
  unknowns: string[];
  reversibility: 'HIGHLY_REVERSIBLE' | 'PARTIALLY_REVERSIBLE' | 'IRREVERSIBLE';
  cost_of_being_wrong: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'RECOMMENDED' | 'CONDITIONAL_OPTION' | 'INSUFFICIENT_EVIDENCE' | 'BACKUP_OPTION';
}

interface PCAStageContract {
  stage_id: string;
  input: string;
  output: string;
  epistemic_state: string;
  confidence_delta: number;
  evidence_delta: number;
  risk_delta: number;
  validation_status: 'VALID' | 'FAILED_CHECK' | 'BYPASS_WARNING';
}

interface EpistemicIntegrityViewerProps {
  pcaState?: any;
}

export const EpistemicIntegrityViewer: React.FC<EpistemicIntegrityViewerProps> = ({ pcaState }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  const [activeTab, setActiveTab] = useState<'claims' | 'confidence' | 'risks' | 'alternatives' | 'pipeline'>('claims');
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);

  if (!pcaState) {
    return (
      <div className={`p-6 text-center rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800'}`}>
        <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          No decision intelligence state available. Run the analysis to view Epistemic Governance.
        </p>
      </div>
    );
  }

  // Retrieve new PCA v3.0 data structures with fallbacks
  const claimsMap: EpistemicClaim[] = pcaState.evidence_claim_mapping || [];
  const consistencyWarnings: InternalConsistencyWarning[] = pcaState.internal_consistency_warnings || [];
  const missingRegistry: MissingInformationRegistryItem[] = pcaState.missing_information_registry || [];
  const riskArchitecture: RiskArchitectureItem[] = pcaState.risk_architecture || [];
  const decisionAlternatives: DecisionAlternativeOption[] = pcaState.decision_alternatives_v3 || [];
  const stageContracts: PCAStageContract[] = pcaState.pca_stage_contracts || [];

  const evConf = pcaState.evidence_confidence ?? 'INSUFFICIENT_EVIDENCE';
  const infConf = pcaState.inference_confidence ?? 'NOT_CALIBRATED';
  const predConf = pcaState.prediction_confidence ?? 'NOT_CALIBRATED';
  const decRob = pcaState.decision_robustness ?? 'NOT_CALIBRATED';

  const reportStatus: 'GREEN' | 'AMBER' | 'RED' = pcaState.report_status || 'GREEN';
  const signatureStatus = pcaState.signature_status || 'VERIFIED';
  const validityStatus = pcaState.evidence_validity_status || 'FULLY_VALID';
  const validationStatus = pcaState.decision_validation_status || 'VALIDATED_BY_GOVERNANCE';

  return (
    <div className={`border rounded-xl space-y-6 p-5 ${tokens.shadow} ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#0B1220] border-white/10'
    }`}>
      {/* 1. Header with Signature & Epistemic Sign-off Status */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b pb-4 gap-4 border-slate-800/60">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            reportStatus === 'GREEN' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : reportStatus === 'AMBER' 
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}>
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
              EPISTEMIC GOVERNANCE & INTEGRITY
            </h4>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Strict Evidence-to-Claim Audit Trails & Cognitive Consistency Checking
            </p>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className={`flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full border ${
            reportStatus === 'GREEN'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : reportStatus === 'AMBER'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              reportStatus === 'GREEN' ? 'bg-emerald-500' : reportStatus === 'AMBER' ? 'bg-amber-500' : 'bg-rose-500'
            }`}></span>
            <span>STATUS: {reportStatus}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SIGNATURE: {signatureStatus}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>GATE: {validationStatus === 'VALIDATED_BY_GOVERNANCE' ? 'PASS' : 'FAIL'}</span>
          </div>
        </div>
      </div>

      {/* 2. Internal Consistency Engine Warnings */}
      {consistencyWarnings.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-3 animate-pulse">
          <div className="flex items-center gap-2 text-rose-400">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span className="font-bold text-xs uppercase tracking-wider">
              Internal Consistency Warnings detected ({consistencyWarnings.length})
            </span>
          </div>
          <div className="space-y-2.5 text-xs text-rose-200">
            {consistencyWarnings.map((warning, idx) => (
              <div key={idx} className="p-3 bg-slate-950/40 rounded-lg border border-rose-500/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-400 font-mono text-[10px]">{warning.conflict_id}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300">
                    {warning.severity}
                  </span>
                </div>
                <p className="font-semibold leading-relaxed">{warning.explanation}</p>
                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  <strong className="text-rose-300">Required Audit:</strong> {warning.required_review}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Navigation tabs */}
      <div className="flex overflow-x-auto space-x-1 border-b border-slate-800/40 pb-px scrollbar-none">
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'claims'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          🔎 Claims & Grounding Map
        </button>
        <button
          onClick={() => setActiveTab('confidence')}
          className={`px-4 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'confidence'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📊 Confidence Taxonomy
        </button>
        <button
          onClick={() => setActiveTab('risks')}
          className={`px-4 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'risks'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          🛡️ Risk & Gaps Architecture
        </button>
        <button
          onClick={() => setActiveTab('alternatives')}
          className={`px-4 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'alternatives'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚖️ Strategic Alternatives
        </button>
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-4 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'pipeline'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ⛓️ 12-Stage Traces
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-4">
        {/* Tab 1: Claims & Grounding Map */}
        {activeTab === 'claims' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>ตรวจสอบความเชื่อมโยงระดับ Epistemic Tagging เพื่อกรองการ Hallucinate</span>
              <span>พบข้ออ้างทั้งหมด {claimsMap.length} รายการ</span>
            </div>

            <div className="space-y-2.5">
              {claimsMap.map((claim) => {
                const isFact = claim.epistemic_type === 'FACT';
                const isHypo = claim.epistemic_type === 'HYPOTHESIS';
                const isUnknown = claim.epistemic_type === 'UNKNOWN';
                
                return (
                  <div
                    key={claim.claim_id}
                    className={`border rounded-xl transition-all ${
                      expandedClaim === claim.claim_id
                        ? 'bg-slate-950/40 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-950/20 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedClaim(expandedClaim === claim.claim_id ? null : claim.claim_id)}
                      className="w-full text-left p-4 flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-500">{claim.claim_id}</span>
                          <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                            isFact
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                              : isHypo
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                              : isUnknown
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/20'
                              : 'bg-blue-500/15 text-blue-400 border-blue-500/20'
                          }`}>
                            {claim.epistemic_type}
                          </span>
                          <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300`}>
                            {claim.corroboration_status}
                          </span>
                        </div>
                        <p className={`text-xs font-medium leading-relaxed ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {claim.claim}
                        </p>
                      </div>
                      <div className="text-slate-500 shrink-0 self-center">
                        {expandedClaim === claim.claim_id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {expandedClaim === claim.claim_id && (
                      <div className="px-4 pb-4 border-t border-slate-800/40 pt-3 space-y-3 text-xs leading-relaxed">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Primary Source</span>
                            <span className="text-slate-300 font-medium block truncate">{claim.source}</span>
                            <span className="text-[10px] text-slate-500 block truncate">{claim.source_type}</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Evidence Strength</span>
                            <span className={`font-semibold ${
                              claim.evidence_strength === 'STRONG' ? 'text-emerald-400' : 'text-amber-400'
                            }`}>{claim.evidence_strength}</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Confidence Score</span>
                            <span className="text-slate-300 font-semibold font-mono">
                              {typeof claim.evidence_confidence === 'number' 
                                ? `${Math.round(claim.evidence_confidence * 100)}%` 
                                : claim.evidence_confidence}
                            </span>
                          </div>
                        </div>

                        {/* Supporting Evidence List */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Verified Reference Pieces ({claim.supporting_evidence.length})</span>
                          {claim.supporting_evidence.length > 0 ? (
                            <div className="space-y-1.5">
                              {claim.supporting_evidence.map((ev, sIdx) => (
                                <div key={sIdx} className="p-2 bg-slate-900/40 rounded border border-slate-800/60 space-y-1">
                                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                                    <span>{ev.evidence_id} - {ev.source}</span>
                                    <span className="text-emerald-400 font-bold">{ev.evidence_strength} Strength</span>
                                  </div>
                                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans italic">"{ev.content}"</p>
                                  <div className="flex gap-2 text-[9px] font-mono">
                                    <span className="bg-slate-800 px-1 rounded">Rel: {ev.source_reliability}</span>
                                    <span className="bg-slate-800 px-1 rounded">Rev: {ev.evidence_relevance}</span>
                                    <span className="bg-slate-800 px-1 rounded">Sup: {ev.claim_support_strength}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/10">
                              ⚠️ NO EVIDENCE PROVIDED: ข้อความกล่าวอ้างนี้ถูกจัดเป็น UNGROUNDED CLAIM เนื่องจากไม่มีหลักฐานเชิงประจักษ์อ้างอิงตรงจุด (Strict Separated Protocol)
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Confidence Taxonomy */}
        {activeTab === 'confidence' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs leading-relaxed text-slate-400">
              <strong className="text-amber-400 block mb-1">Decomposed Confidence Grid:</strong>
              เพื่อความเที่ยงตรงทางญาณวิทยา ระบบจะไม่นำเสนอคะแนนความเชื่อมั่นลอยๆ (Single Arbitrary Score) แต่จะจำแนกออกเป็นสี่มิติหลักตามระเบียบพจนานุกรมการวิเคราะห์
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Evidence Confidence */}
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2 relative overflow-hidden">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">1. Evidence Confidence</div>
                <div className="text-3xl font-black font-mono tracking-tight text-amber-500">
                  {typeof evConf === 'number' ? `${evConf}%` : evConf}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ความแน่นหนา คุณภาพ และเกรดความน่าเชื่อถือของชิ้นหลักฐานต้นทาง
                </p>
              </div>

              {/* Card 2: Inference Confidence */}
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2 relative overflow-hidden">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">2. Inference Confidence</div>
                <div className="text-3xl font-black font-mono tracking-tight text-amber-500">
                  {typeof infConf === 'number' ? `${infConf}%` : infConf}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ความแน่นหนาของการอนุมานทางสมมติฐานแข่งขันและข้อสรุป (ACH Matrix Score)
                </p>
              </div>

              {/* Card 3: Prediction Confidence */}
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2 relative overflow-hidden">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">3. Prediction Confidence</div>
                <div className="text-3xl font-black font-mono tracking-tight text-amber-500">
                  {typeof predConf === 'number' ? `${predConf}%` : predConf}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  อัตราความมั่นใจในการวิเคราะห์ผลลัพธ์ที่จะเกิดขึ้นในอนาคต (พิจารณา Data Gaps)
                </p>
              </div>

              {/* Card 4: Decision Robustness */}
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2 relative overflow-hidden">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">4. Decision Robustness</div>
                <div className="text-3xl font-black font-mono tracking-tight text-amber-500">
                  {typeof decRob === 'number' ? `${decRob}%` : decRob}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ระดับความปลอดภัยและเสถียรภาพของการลงมติปฏิบัติในสภาวะที่มีสัญญาณขาดหาย
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="text-amber-500 font-bold">Bayesian Calibration Formula:</div>
              <p className="text-slate-300 leading-relaxed break-words">{pcaState.confidence_calibration?.formula}</p>
            </div>
          </div>
        )}

        {/* Tab 3: Risk & Gaps Architecture */}
        {activeTab === 'risks' && (
          <div className="space-y-6">
            {/* 1. Missing Info Registry */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-bold text-xs uppercase tracking-wider">Missing Information Registry (Data Gaps)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {missingRegistry.map((item) => (
                  <div key={item.missing_id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-500 font-bold">{item.missing_id}</span>
                      <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                        item.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>{item.priority} Priority</span>
                    </div>
                    <h5 className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{item.missing_information}</h5>
                    <div className="text-[11px] text-slate-400 space-y-1">
                      <p><strong className="text-slate-300">Why Needed:</strong> {item.why_needed}</p>
                      <p><strong className="text-slate-300">Decision Impact:</strong> {item.decision_impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Decomposed Risk Matrix */}
            <div className="space-y-3 pt-3 border-t border-slate-800/40">
              <div className="flex items-center gap-2 text-rose-400">
                <ShieldAlert className="w-4 h-4" />
                <span className="font-bold text-xs uppercase tracking-wider">Decomposed Risk Architecture (6 Dimensions)</span>
              </div>
              <div className="space-y-2.5">
                {riskArchitecture.map((risk) => (
                  <div key={risk.risk_id} className="p-4 bg-slate-950/25 border border-slate-800/60 rounded-xl space-y-2 text-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/40 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500 font-bold">{risk.risk_id}</span>
                        <strong className="text-slate-200">{risk.risk_type}</strong>
                      </div>
                      <div className="flex gap-2 text-[10px] font-mono">
                        <span className="text-slate-400">Prob: <strong className="text-amber-400">{risk.probability}</strong></span>
                        <span className="text-slate-400">Impact: <strong className="text-rose-400">{risk.impact}</strong></span>
                      </div>
                    </div>
                    <div className="space-y-1.5 leading-relaxed text-slate-300">
                      <p><strong className="text-slate-400">Evidence Basis:</strong> {risk.evidence_basis}</p>
                      <p><strong className="text-slate-400">Uncertainty Drivers:</strong> {risk.uncertainty}</p>
                      <p><strong className="text-slate-400">Actionable Mitigation:</strong> <span className="text-emerald-400">{risk.mitigation}</span></p>
                      <div className="flex flex-col md:flex-row md:justify-between text-[10px] text-slate-500 pt-1">
                        <span>Owner: {risk.owner_reviewer}</span>
                        <span>Trigger: {risk.trigger_condition}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Strategic Alternatives */}
        {activeTab === 'alternatives' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs leading-relaxed text-slate-400">
              <strong className="text-blue-400 block mb-1">Human Choice Empowerment Grid:</strong>
              เป้าหมายสูงสุดของ FIRE KEEPER คือ "ไม่เข้ามาทำตัวแทนวิจารณญาณของผู้ใช้" แต่จะช่วยแสดงโครงสร้างทางเลือกเพื่อการอนุมัติและตัดสินใจของมนุษย์
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {decisionAlternatives.map((alt) => {
                const isRecommended = alt.status === 'RECOMMENDED';
                const isConditional = alt.status === 'CONDITIONAL_OPTION';
                const isInsufficient = alt.status === 'INSUFFICIENT_EVIDENCE';
                
                return (
                  <div
                    key={alt.option_id}
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                      isRecommended
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : isConditional
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : 'bg-rose-500/5 border-rose-500/20'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-slate-500 font-bold">{alt.option_id}</span>
                        <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                          isRecommended
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isConditional
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {alt.status}
                        </span>
                      </div>
                      <h5 className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{alt.title}</h5>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{alt.description}</p>
                    </div>

                    <div className="space-y-2 border-t border-slate-800/40 pt-2.5 text-[11px] leading-relaxed">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Evidence Strength:</span>
                        <span className={`font-semibold ${alt.evidence_strength === 'STRONG' ? 'text-emerald-400' : alt.evidence_strength === 'MODERATE' ? 'text-amber-400' : 'text-rose-400'}`}>{alt.evidence_strength}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Reversibility Index:</span>
                        <span className="font-medium text-slate-300">{alt.reversibility}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cost of Being Wrong:</span>
                        <span className="font-medium text-slate-300">{alt.cost_of_being_wrong}</span>
                      </div>
                      <div className="space-y-1 mt-1 text-[10px] bg-slate-900/60 p-2 rounded border border-slate-800/40">
                        <strong className="text-slate-400 block uppercase">Trade-Offs & Unknowns</strong>
                        <p className="text-slate-300 leading-normal">{alt.trade_offs}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 5: PCA Stage Contracts Tracing */}
        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>ประมวลผลผ่าน Cognitive Pipeline 12 ขั้นตอน บังคับใช้สัญญาข้อมูลขาออกสะท้อนระดับความเชื่อมั่นแปรค่า</span>
              <span>สถานะสัญญา: ยืนยันสมบูรณ์</span>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800/80">
              {stageContracts.map((stage) => {
                const isConfidenceUp = stage.confidence_delta > 0;
                const isRiskUp = stage.risk_delta > 0;

                return (
                  <div key={stage.stage_id} className="relative space-y-1 text-xs">
                    {/* Circle marker */}
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-amber-500 bg-slate-950"></span>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 font-mono text-[10px]">{stage.stage_id}</span>
                      <span className="px-1 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                        {stage.validation_status}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950/30 border border-slate-800/80 rounded-lg space-y-1.5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-400 leading-relaxed">
                        <p><strong className="text-slate-500">Input Contract:</strong> {stage.input}</p>
                        <p><strong className="text-slate-500">Output Contract:</strong> {stage.output}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-slate-500 border-t border-slate-800/40 pt-1.5">
                        <span>Epistemic State: <strong className="text-amber-500">{stage.epistemic_state}</strong></span>
                        {stage.confidence_delta !== 0 && (
                          <span className={isConfidenceUp ? 'text-emerald-400' : 'text-rose-400'}>
                            Confidence: {isConfidenceUp ? '+' : ''}{stage.confidence_delta}%
                          </span>
                        )}
                        {stage.evidence_delta !== 0 && (
                          <span className="text-blue-400">Evidence: +{stage.evidence_delta}%</span>
                        )}
                        {stage.risk_delta !== 0 && (
                          <span className={isRiskUp ? 'text-rose-400' : 'text-emerald-400'}>
                            Risk: {isRiskUp ? '+' : ''}{stage.risk_delta}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
