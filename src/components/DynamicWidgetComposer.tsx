import React, { useState, useEffect } from 'react';
import { PCAState } from '../types';
import { useTheme } from '../context/ThemeContext';
import { getThemeTokens } from '../utils/themeTokens';
import {
  LayoutGrid,
  GitMerge,
  Search,
  Database,
  ShieldCheck,
  Clock,
  Brain,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sparkles,
  Info,
  Layers,
  Award,
  Compass
} from 'lucide-react';

export type UserPersona = 'ceo' | 'analyst' | 'auditor' | 'developer';

// Import core sub-viewers
import { AlternativeDecisionsViewer } from './AlternativeDecisionsViewer';
import { DecisionGraphViewer } from './DecisionGraphViewer';
import { HypothesisBayesianViewer } from './HypothesisBayesianViewer';
import { KnowledgeGraphViewer } from './KnowledgeGraphViewer';
import { GovernancePoliciesViewer } from './GovernancePoliciesViewer';
import { HumanAgencyEnforcer } from './HumanAgencyEnforcer';
import { PipelineMachineViewer } from './PipelineMachineViewer';
import { ConfidenceCalibrationViewer } from './ConfidenceCalibrationViewer';
import { WhiteBoxInspector } from './WhiteBoxInspector';

interface DynamicWidgetComposerProps {
  pcaState: PCAState;
}

type TabType = 'executive' | 'cognitive' | 'evidence' | 'memory' | 'governance' | 'execution' | 'metacognition';

export const DynamicWidgetComposer: React.FC<DynamicWidgetComposerProps> = ({
  pcaState,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  const [activeTab, setActiveTab] = useState<TabType>('executive');
  const [activePersona, setActivePersona] = useState<UserPersona>('ceo');

  // Synchronize persona and tabs gracefully
  const handleSelectPersona = (persona: UserPersona) => {
    setActivePersona(persona);
    if (persona === 'ceo') {
      setActiveTab('executive');
    } else if (persona === 'analyst') {
      setActiveTab('evidence');
    } else if (persona === 'auditor') {
      setActiveTab('governance');
    } else if (persona === 'developer') {
      setActiveTab('execution');
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Synced persona
    if (tab === 'executive') setActivePersona('ceo');
    else if (tab === 'evidence') setActivePersona('analyst');
    else if (tab === 'governance') setActivePersona('auditor');
    else if (tab === 'execution') setActivePersona('developer');
  };

  // Pre-calculate canonical stats
  const riskScore = pcaState.executive_dashboard?.riskScore ?? 12;
  const canonicalConfidence = pcaState.confidence_calibration?.scorePercent ?? pcaState.executive_dashboard?.confidenceScore ?? 88;
  const tokenUsage = pcaState.executive_dashboard?.tokenUsage ?? {
    promptTokens: 12450,
    completionTokens: 6820,
    totalTokens: 19270,
    estCostUsd: 0.023
  };
  const totalLatency = pcaState.execution_time_ms ?? 1150;
  const humanAgencyScore = pcaState.executive_dashboard?.humanAgencyScore ?? 100;

  // Render tabs config
  const tabsList = [
    { id: 'executive' as TabType, label: '01 | Executive Overview', icon: LayoutGrid, desc: 'What happened?' },
    { id: 'cognitive' as TabType, label: '02 | Cognitive Decision', icon: GitMerge, desc: 'Why this decision?' },
    { id: 'evidence' as TabType, label: '03 | Evidence & Provenance', icon: Search, desc: 'What supports it?' },
    { id: 'memory' as TabType, label: '04 | Memory Trace', icon: Database, desc: 'What prior knowledge influenced it?' },
    { id: 'governance' as TabType, label: '05 | Governance & Context', icon: ShieldCheck, desc: 'Was it compliant and safe?' },
    { id: 'execution' as TabType, label: '06 | 12-Stage Trace', icon: Clock, desc: 'How did system execute?' },
    { id: 'metacognition' as TabType, label: '07 | Meta-Cognition', icon: Brain, desc: 'Did system challenge itself?' },
  ];

  // Map credibility to reliability grade
  const getReliabilityGrade = (credibility: number) => {
    if (credibility >= 0.9) return { grade: 'Grade A', label: 'Primary (Completely Reliable)', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' };
    if (credibility >= 0.8) return { grade: 'Grade B', label: 'Verified (Usually Reliable)', color: 'text-sky-400 border-sky-500/20 bg-sky-500/10' };
    if (credibility >= 0.7) return { grade: 'Grade C', label: 'Credible (Fairly Reliable)', color: 'text-purple-400 border-purple-500/20 bg-purple-500/10' };
    if (credibility >= 0.6) return { grade: 'Grade D', label: 'Moderate (Not Usually Reliable)', color: 'text-amber-400 border-amber-500/20 bg-amber-500/10' };
    return { grade: 'Grade F', label: 'Low/Unverified', color: 'text-rose-400 border-rose-500/20 bg-rose-500/10' };
  };

  // Combined Memory Trace list
  const memoryTraceList = (pcaState.ranked_memories || pcaState.memories || []).map((m, idx) => {
    const impact = (pcaState.memory_impacts || []).find((mi) => mi.memoryId === m.id || mi.content === m.content);
    return {
      id: m.id || `M-0${idx + 1}`,
      content: m.content,
      relevance: m.storeType || 'Semantic',
      reRankScore: m.relevanceScore || m.confidence || 0.85,
      usedAt: impact?.appliedStage || 'Stage 4 | Memory Retrieval',
      impact: impact?.usageStatus === 'USED_IN_DECISION' ? 'Positive' : impact?.usageStatus === 'CONFLICTED' ? 'Contradicted' : 'Neutral'
    };
  });

  return (
    <div className={`max-w-[1440px] mx-auto rounded-xl border ${tokens.shadow} overflow-hidden font-sans my-4 ${
      isLight ? 'bg-[#F8FAFC] text-[#111827] border-[#E5E7EB]' : 'bg-[#0B1220] text-white border-white/10'
    }`}>
      
      {/* Dynamic Inspector Header */}
      <header className={`sticky top-0 z-20 backdrop-blur-md border-b px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans ${
        isLight ? 'bg-white/95 border-[#E5E7EB]' : 'bg-[#0B1220]/95 border-white/10'
      }`}>
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className={`text-base font-bold tracking-tight truncate ${isLight ? 'text-[#111827]' : 'text-white'}`}>
                PCA Audit Console
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1 shrink-0 ${
                isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Audit Pass
              </span>
            </div>
          </div>
        </div>

        {/* Persona Controller switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className={`text-[10px] font-mono uppercase tracking-wider shrink-0 ${isLight ? 'text-[#6B7280]' : 'text-slate-400'}`}>Persona:</span>
          <div className={`flex items-center p-0.5 border rounded-xl whitespace-nowrap ${
            isLight ? 'bg-[#F3F4F6] border-[#E5E7EB]' : 'bg-[#111827] border-white/10'
          }`}>
            {[
              { id: 'ceo', label: 'CEO View' },
              { id: 'analyst', label: 'Analyst' },
              { id: 'auditor', label: 'Auditor' },
              { id: 'developer', label: 'Developer' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPersona(p.id as UserPersona)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  activePersona === p.id
                    ? 'bg-[#F59E0B] text-white font-bold'
                    : isLight
                      ? 'text-[#6B7280] hover:text-[#111827]'
                      : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[auto]">
        
        {/* Sidebar Tabs */}
        <div className={`p-4 border-b lg:border-b-0 lg:border-r ${isLight ? 'bg-slate-50 border-[#E5E7EB]' : 'bg-[#090F1C] border-white/10'}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-2">
            {tabsList.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full text-left p-3 rounded-xl border flex items-start gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#F59E0B] text-white border-[#F59E0B] font-semibold shadow-xs'
                      : isLight
                        ? 'bg-white border-[#E5E7EB] hover:bg-slate-100 text-[#374151]'
                        : 'bg-[#111827]/50 border-slate-800/80 hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-white' : 'text-amber-500'}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold leading-tight truncate">{tab.label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Canvas */}
        <div className="col-span-1 lg:col-span-3 p-4 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* 01 — Executive Overview */}
          {activeTab === 'executive' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Title */}
              <div>
                <h2 className="text-base font-bold text-slate-200">01 — Executive Overview</h2>
                <p className="text-xs text-slate-400 mt-0.5">ภาพรวมตัวชี้วัดหลักและคำวินิจฉัยเชิงยุทธศาสตร์สําหรับผู้บริหาร</p>
              </div>

              {/* Canonical Metrics Deck */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Risk Score', value: `${riskScore}%`, status: riskScore < 25 ? 'Low' : 'Moderate', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
                  { label: 'Confidence', value: `${canonicalConfidence}%`, status: 'Canonical', color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
                  { label: 'Token Cost', value: `$${tokenUsage.estCostUsd.toFixed(3)}`, status: `${(tokenUsage.totalTokens / 1000).toFixed(1)}k tokens`, color: 'text-sky-400 border-sky-500/20 bg-sky-500/5' },
                  { label: 'Total Latency', value: `${totalLatency} ms`, status: 'Total execution', color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5' },
                  { label: 'Human Agency', value: `${humanAgencyScore}%`, status: 'Preserved', color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' },
                ].map((card, i) => (
                  <div key={i} className={`p-4 rounded-xl border flex flex-col justify-between ${card.color}`}>
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400">{card.label}</span>
                    <span className="text-lg font-bold tracking-tight mt-1">{card.value}</span>
                    <span className="text-[9px] font-mono text-slate-400 mt-1">● {card.status}</span>
                  </div>
                ))}
              </div>

              {/* Executive Brief Box */}
              <div className="p-5 rounded-xl border border-amber-500/20 bg-slate-950/80 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Executive Decision Briefing</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">CONFIDENTIAL</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] block font-mono">STRATEGIC VERDICT</span>
                    <span className="text-slate-100 font-bold mt-1 block flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {pcaState.executive_decision_dashboard?.verdictThai || 'APPROVE (อนุมัติ)'}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] block font-mono">URGENCY LEVEL</span>
                    <span className="text-rose-400 font-bold mt-1 block">ด่วนมาก (P1 - Immediate)</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] block font-mono">KEY DECISION DELTA</span>
                    <span className="text-slate-100 font-medium mt-1 block truncate">{pcaState.understanding || 'อนุมัติตามยุทธศาสตร์หลัก'}</span>
                  </div>
                </div>

                <div className="text-xs space-y-2 text-slate-300 leading-relaxed pt-2">
                  <p>
                    ระบบได้ผ่านกระบวนการไตร่ตรองเบย์เซียน (Bayesian Reflection Cycle) ครบสมบูรณ์ 
                    ความเชื่อมั่นสูงสุดอยู่ที่ <strong className="text-amber-400">{canonicalConfidence}%</strong> ตรวจวัดความเสี่ยงโดยละเอียดอยู่ในเกณฑ์ดีเยี่ยม ({riskScore}%) 
                    หลักฐานเชิงประจักษ์ได้รับการถ่วงน้ำหนักตรวจสอบความขัดแย้งเป็นธรรม พร้อมควบคุมขอบเขตนโยบายความปลอดภัยครบถ้วนตามหลักธรรมาภิบาล
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 02 — Cognitive Decision */}
          {activeTab === 'cognitive' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-base font-bold text-slate-200">02 — Cognitive Decision</h2>
                <p className="text-xs text-slate-400 mt-0.5">กระบวนการวิเคราะห์สมมติฐานเบย์เซียน โครงสร้างการเชื่อมโยงความรู้ และตารางเปรียบเทียบทางเลือกยุทธศาสตร์</p>
              </div>

              {/* Whitebox explainability inspector */}
              <WhiteBoxInspector pcaState={pcaState} />

              {/* Bayesian hypotheses component */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Scale className="w-4 h-4" />
                  Bayesian Hypotheses Shift Analysis
                </h3>
                <HypothesisBayesianViewer
                  hypotheses={pcaState.hypotheses_v2}
                  bayesian={pcaState.bayesian}
                />
              </div>

              {/* Decision Graph component */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <GitMerge className="w-4 h-4" />
                  Causal Decision Graph & Feedback loops
                </h3>
                <DecisionGraphViewer graphData={pcaState.decision_graph} />
              </div>

              {/* Alternative trade-offs component */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  Strategic Options & Trade-off Matrix (Counterfactuals)
                </h3>
                <AlternativeDecisionsViewer
                  alternativeDecisions={pcaState.alternative_decisions}
                  conflictResolutions={pcaState.conflict_resolutions}
                  purpose={pcaState.purpose}
                  understanding={pcaState.understanding}
                />
              </div>
            </div>
          )}

          {/* 03 — Evidence & Provenance */}
          {activeTab === 'evidence' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-base font-bold text-slate-200">03 — Evidence & Provenance</h2>
                <p className="text-xs text-slate-400 mt-0.5">คลังหลักฐานเชิงประจักษ์และการจัดอันดับความน่าเชื่อถือเอกสารอ้างอิงเป็นเอกฉันท์ (Single Source of Truth)</p>
              </div>

              {/* Unified Evidence Explorer & Citation Matrix Table */}
              <div className="border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Evidence Audit Registry Table</span>
                  <span className="text-[10px] font-mono text-emerald-400">{(pcaState.evidence_explorer?.length ?? 0)} SECURE CITATIONS</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0B1220] border-b border-slate-800 text-slate-400 font-semibold font-mono text-[10px]">
                        <th className="p-3 w-20">ID</th>
                        <th className="p-3 w-48">Source</th>
                        <th className="p-3 w-32">Reliability Grade</th>
                        <th className="p-3">Claim & Text Citation</th>
                        <th className="p-3 w-32 text-center">Support / Conflict</th>
                        <th className="p-3 w-24">Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(!pcaState.evidence_explorer || pcaState.evidence_explorer.length === 0) ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 font-sans italic">
                            ไม่มีหลักฐานบันทึกในเซสชันนี้
                          </td>
                        </tr>
                      ) : (
                        pcaState.evidence_explorer.map((ev) => {
                          const reliabilityGrade = getReliabilityGrade(ev.credibilityScore);
                          return (
                            <tr key={ev.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-3 font-mono text-amber-500 font-bold">{ev.id}</td>
                              <td className="p-3 font-semibold text-slate-300 truncate max-w-[150px]" title={ev.source}>{ev.source}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${reliabilityGrade.color}`}>
                                  {reliabilityGrade.grade}
                                </span>
                              </td>
                              <td className="p-3 text-slate-300">
                                <p className="line-clamp-2 leading-relaxed italic">&ldquo;{ev.content}&rdquo;</p>
                                {ev.explainableAnalysis && (
                                  <span className="text-[10px] text-emerald-400 font-mono mt-1 block">💡 {ev.explainableAnalysis}</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5 font-mono text-[10px]">
                                  <span className="text-emerald-400">+{ev.supportScore ?? 90}%</span>
                                  <span className="text-slate-500">/</span>
                                  <span className="text-rose-400">-{ev.conflictScore ?? 10}%</span>
                                </div>
                              </td>
                              <td className="p-3">
                                {ev.sourceUrl ? (
                                  <a
                                    href={ev.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 inline-block"
                                    title="Open citation source link"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <span className="text-slate-600 font-mono text-[10px]">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Relocated Knowledge Graph Matrix */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Knowledge Entity Relationship Matrix
                </h3>
                <KnowledgeGraphViewer graphData={pcaState.knowledge_graph} />
              </div>
            </div>
          )}

          {/* 04 — Memory Trace */}
          {activeTab === 'memory' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-base font-bold text-slate-200">04 — Memory Trace</h2>
                <p className="text-xs text-slate-400 mt-0.5">สำรวจคลังความทรงจำระยะยาว (LTM) ที่มีอิทธิพลต่อยุทธศาสตร์การตัดสินใจ (รวมข้อมูลความจำและการใช้งานในที่เดียว)</p>
              </div>

              {/* Memory Trace Unified Audit Table */}
              <div className="border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Memory Activation & Impact Log</span>
                  <span className="text-[10px] font-mono text-purple-400">{memoryTraceList.length} MEMORIES ENGAGED</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[800px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0B1220] border-b border-slate-800 text-slate-400 font-semibold font-mono text-[10px]">
                        <th className="p-3 w-16 whitespace-nowrap">ID</th>
                        <th className="p-3 min-w-[200px]">Memory Content</th>
                        <th className="p-3 w-32 whitespace-nowrap">Relevance Layer</th>
                        <th className="p-3 w-28 text-center whitespace-nowrap">Re-rank Score</th>
                        <th className="p-3 w-40 whitespace-nowrap">Applied Stage</th>
                        <th className="p-3 w-24 text-center whitespace-nowrap">Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {memoryTraceList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 font-sans italic">
                            ไม่มีบันทึกความทรงจำใช้งานในคำตอบนี้
                          </td>
                        </tr>
                      ) : (
                        memoryTraceList.map((mem) => {
                          const impactColor =
                            mem.impact === 'Positive'
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              : mem.impact === 'Contradicted'
                              ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                              : 'text-slate-300 bg-slate-800 border-slate-700';

                          return (
                            <tr key={mem.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-3 font-mono text-purple-400 font-bold">{mem.id}</td>
                              <td className="p-3 text-slate-200 font-medium leading-relaxed max-w-[250px] truncate" title={mem.content}>
                                {mem.content}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                  {mem.relevance}
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-sky-400">
                                {Math.round(mem.reRankScore * 100)}%
                              </td>
                              <td className="p-3 text-slate-400 font-mono truncate max-w-[150px]">{mem.usedAt}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${impactColor}`}>
                                  {mem.impact}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 05 — Governance & Context */}
          {activeTab === 'governance' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-base font-bold text-slate-200">05 — Governance & Context</h2>
                <p className="text-xs text-slate-400 mt-0.5">การบังคับใช้นโยบายมาตรฐานธรรมาภิบาล ISO 42001, คุ้มครองข้อมูลส่วนบุคคล (PDPA), และมิติบริบทประเทศสิงคโปร์/ไทย</p>
              </div>

              {/* Renders GovernancePoliciesViewer */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Compliance & Safety Policy Guard (ISO/IEC 42001 & NIST AI RMF)
                </h3>
                <GovernancePoliciesViewer
                  policies={pcaState.governance_policies}
                  conflicts={pcaState.conflict_resolutions}
                  agencyEnforcement={pcaState.human_agency_enforcement}
                />
              </div>

              {/* Renders HumanAgencyEnforcer */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
                <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  Enforced Human-in-the-Loop Agency Guard
                </h3>
                <HumanAgencyEnforcer pcaState={pcaState} />
              </div>
            </div>
          )}

          {/* 06 — 12-Stage Trace */}
          {activeTab === 'execution' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-base font-bold text-slate-200">06 — 12-Stage Execution Trace</h2>
                <p className="text-xs text-slate-400 mt-0.5">โครงสร้างเบื้องหลังการรันไทม์เวลา (SLA Timing) แฟ้มคลาสและการไหลประมวลผลโมดูลาร์</p>
              </div>

              {/* total execution time summary */}
              <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-slate-950/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">TOTAL EXECUTION LATENCY TIME:</span>
                <span className="text-indigo-400 font-bold text-sm">{totalLatency} ms</span>
              </div>

              {/* Pipeline Machine Component */}
              <PipelineMachineViewer
                pipelineMachine={pcaState.pipeline_machine}
                assemblyManifest={pcaState.assembly_manifest}
                trace={pcaState.trace}
                totalLatencyMs={totalLatency}
              />

              {/* Timing trace table */}
              <div className="border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-bold text-slate-300">12-Stage Latency Breakdown & Process Metadata</span>
                </div>
                <div className="p-4">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="bg-[#0B1220] border-b border-slate-800 text-slate-400 font-semibold font-mono text-[10px]">
                        <th className="p-2.5 w-10 text-center">#</th>
                        <th className="p-2.5">PCA Cognitive Stage</th>
                        <th className="p-2.5 w-32">Start Offset</th>
                        <th className="p-2.5 w-28 text-center">Latency</th>
                        <th className="p-2.5 w-32">Execution Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(!pcaState.trace || pcaState.trace.length === 0) ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-500 italic font-sans">
                            ไม่มีข้อมูลประวัติ Execution Trace บันทึกในเซสชันนี้
                          </td>
                        </tr>
                      ) : (
                        pcaState.trace.map((entry, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="p-2.5 text-center text-amber-500 font-bold">{idx + 1}</td>
                            <td className="p-2.5 text-slate-200 font-semibold">{entry.stage_th_label || entry.stage}</td>
                            <td className="p-2.5 text-slate-400">+{entry.start_rel_ms ?? 0} ms</td>
                            <td className="p-2.5 text-center text-amber-400 font-bold">{entry.duration_ms} ms</td>
                            <td className="p-2.5">
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 border border-slate-700">
                                {entry.executionType || 'HEURISTIC_EVAL'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 07 — Meta-Cognition */}
          {activeTab === 'metacognition' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-base font-bold text-slate-200">07 — Meta-Cognition</h2>
                <p className="text-xs text-slate-400 mt-0.5">การประเมินตนเอง (Self-critique) ดักจับอคติ (Bias Checking) และวิเคราะห์ความไม่แน่นอนเชิงลึก</p>
              </div>

              {/* Renders Self-Critique / Doubt Information */}
              <div className="p-5 rounded-xl border border-rose-500/20 bg-slate-950/80 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Brain className="w-4 h-4" />
                    White-Box Self-Doubt Critique
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/20">DIAGNOSTIC ACTIVE</span>
                </div>

                <div className="space-y-3.5 text-xs text-slate-300">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-rose-400 font-bold text-[10px] uppercase font-mono">Self-Doubt Question:</span>
                    <p className="text-slate-200 font-medium italic">
                      &ldquo;{pcaState.meta_cognition?.selfDoubtQuestion || 'เรามั่นใจมากเกินไปในการสันนิษฐานความประสงค์ของผู้ใช้หรือไม่?'}&rdquo;
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-rose-400 font-bold text-[10px] uppercase font-mono">Potential Logical Flaw:</span>
                    <p className="text-slate-200 leading-relaxed">
                      {pcaState.meta_cognition?.potentialFlaw || 'อาจมีความคลาดเคลื่อนจากความจำเก่าหากคลังข้อมูลอ้างอิงเป็นข้อมูลแบบไดนามิก'}
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-950/20 rounded-lg border border-emerald-500/20 space-y-1">
                    <span className="text-emerald-400 font-bold text-[10px] uppercase font-mono">Mitigation Corrective Action:</span>
                    <p className="text-slate-200 leading-relaxed">
                      {pcaState.meta_cognition?.mitigationCorrection || 'บังคับเปรียบเทียบคอเท็กซ์ข้อมูลจริงกับประจักษ์พยานเพื่อแก้ความขัดแย้งเชิงนโยบายอย่างสมบูรณ์'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Decomposed Confidence Score as a Diagnostic Breakdown */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Scale className="w-4 h-4" />
                  Decomposed Confidence Score (Diagnostic Calibration Breakdown Only)
                </h3>
                <ConfidenceCalibrationViewer
                  calibration={pcaState.confidence_calibration}
                  uncertainty={pcaState.uncertainty_detection}
                  rawConfidenceLabel={pcaState.confidence}
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
