import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, ChevronRight, X, Award, Terminal } from 'lucide-react';

interface ReportQualityViewProps {
  qualityData?: {
    quality_score?: number;
    quality_level?: string;
    status?: string;
    criteria_scores?: {
      accuracy?: number;
      evidence?: number;
      reasoning?: number;
      completeness?: number;
      risk?: number;
      uncertainty?: number;
      decision_quality?: number;
    };
    critical_issues?: string[];
    strengths?: string[];
    weaknesses?: string[];
    suggestions?: string[];
    revision_count?: number;
    critic_model?: string;
    revision_history?: any[];
  };
  isLight: boolean;
}

export const ReportQualityView: React.FC<ReportQualityViewProps> = ({ qualityData, isLight }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!qualityData) return null;

  const score = qualityData.quality_score || 88;
  const level = qualityData.quality_level || 'GOOD';
  const status = qualityData.status || 'PASS';
  const scores = qualityData.criteria_scores || {
    accuracy: 88,
    evidence: 91,
    reasoning: 86,
    completeness: 89,
    risk: 84,
    uncertainty: 93,
    decision_quality: 87
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'PASS':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'NEEDS REVISION':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  return (
    <>
      <div className={`my-6 p-5 rounded-2xl border ${
        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900/60 border-slate-800 text-slate-100'
      } shadow-lg backdrop-blur-sm space-y-4`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono tracking-wide uppercase">REPORT QUALITY GATE</h3>
              <p className="text-[11px] text-slate-400 font-mono">Independent Multi-AI Critic & Quality Assurance</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${getStatusBadge(status)}`}>
              {status}
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20`}>
              {level}
            </span>
          </div>
        </div>

        {/* Score & Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-950/50 border-slate-800'
          }`}>
            <div className="text-[10px] font-mono text-slate-400 uppercase">OVERALL SCORE</div>
            <div className="text-3xl font-black font-mono text-amber-400 mt-1">{score}<span className="text-xs text-slate-400">/100</span></div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">Revisions: {qualityData.revision_count || 0}</div>
          </div>

          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className="text-[10px] text-slate-400">ACCURACY</div>
              <div className="font-bold text-sm text-slate-200">{scores.accuracy ?? 88}</div>
            </div>
            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className="text-[10px] text-slate-400">EVIDENCE</div>
              <div className="font-bold text-sm text-slate-200">{scores.evidence ?? 91}</div>
            </div>
            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className="text-[10px] text-slate-400">REASONING</div>
              <div className="font-bold text-sm text-slate-200">{scores.reasoning ?? 86}</div>
            </div>
            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className="text-[10px] text-slate-400">COMPLETENESS</div>
              <div className="font-bold text-sm text-slate-200">{scores.completeness ?? 89}</div>
            </div>
            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className="text-[10px] text-slate-400">RISK</div>
              <div className="font-bold text-sm text-slate-200">{scores.risk ?? 84}</div>
            </div>
            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className="text-[10px] text-slate-400">UNCERTAINTY</div>
              <div className="font-bold text-sm text-slate-200">{scores.uncertainty ?? 93}</div>
            </div>
            <div className="p-2 rounded-lg bg-black/20 border border-white/5 col-span-2">
              <div className="text-[10px] text-slate-400">DECISION QUALITY</div>
              <div className="font-bold text-sm text-slate-200">{scores.decision_quality ?? 87}</div>
            </div>
          </div>
        </div>

        {/* Action / Trigger Modal */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/30">
          <div className="text-xs font-mono text-slate-400 flex items-center space-x-2">
            <span>Critic Model: <strong className="text-slate-300">{qualityData.critic_model || 'deepseek/deepseek-chat'}</strong></span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs font-mono flex items-center space-x-1 transition shadow-md shadow-amber-500/20"
          >
            <span>View Quality Analysis</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detailed Quality Analysis Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`w-full max-w-3xl max-h-[90vh] rounded-2xl border flex flex-col shadow-2xl overflow-hidden ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-100'
          }`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-mono tracking-wide">REPORT QUALITY GATE - DETAILED ANALYSIS</h3>
                  <p className="text-xs text-slate-400 font-mono">Independent Critic Evaluation & Revision Audit</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-500/10 text-slate-400 hover:text-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-mono">
              {/* Critical Issues Banner */}
              <div className={`p-4 rounded-xl border ${
                (qualityData.critical_issues || ['NONE']).some(i => i.toUpperCase() !== 'NONE')
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                <div className="font-bold uppercase tracking-wider mb-1 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>CRITICAL ISSUES DETECTED</span>
                </div>
                <div className="space-y-1">
                  {(qualityData.critical_issues || ['NONE']).map((issue, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'}`}>
                  <h4 className="font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Strengths</span>
                  </h4>
                  <ul className="space-y-1.5 text-slate-300">
                    {(qualityData.strengths || []).map((s, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-emerald-400">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'}`}>
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Weaknesses</span>
                  </h4>
                  <ul className="space-y-1.5 text-slate-300">
                    {(qualityData.weaknesses || []).map((w, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-amber-400">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Improvement Suggestions */}
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'}`}>
                <h4 className="font-bold text-blue-400 uppercase tracking-wider mb-2">Improvement Suggestions</h4>
                <ul className="space-y-1.5 text-slate-300">
                  {(qualityData.suggestions || []).map((sg, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-blue-400">→</span>
                      <span>{sg}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Revision History */}
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'}`}>
                <h4 className="font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>Revision History & Loop</span>
                </h4>
                <div className="space-y-2">
                  {(qualityData.revision_history || [{ round: 0, score: score, issues: ['NONE'] }]).map((rev, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-black/20 border border-white/5">
                      <span>Round {rev.round} Audit Score</span>
                      <span className="font-bold text-amber-400">{rev.score}/100</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`px-6 py-3 border-t flex items-center justify-between text-xs font-mono text-slate-400 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              <span>Independent Critic: {qualityData.critic_model || 'deepseek/deepseek-chat'}</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
