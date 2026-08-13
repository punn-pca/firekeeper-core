import React from 'react';
import { Sparkles, Scale, TrendingUp, TrendingDown, HelpCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { HypothesisV2, BayesianMetrics } from '../types';
import { FormulaViewer } from './FormulaViewer';

interface HypothesisBayesianViewerProps {
  hypotheses?: HypothesisV2[];
  bayesian?: BayesianMetrics;
}

export const HypothesisBayesianViewer: React.FC<HypothesisBayesianViewerProps> = ({
  hypotheses,
  bayesian,
}) => {
  if (!hypotheses || hypotheses.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
        ไม่มีข้อมูล Multi-Hypothesis สำหรับคำตอบนี้
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex items-center space-x-3 bg-slate-900/90 p-4 rounded-xl border border-sky-500/30 shadow-lg">
        <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/40 flex items-center justify-center text-sky-400">
          <Scale className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            🧠 Multi-Hypothesis Generator & ⚖️ Bayesian Confidence Engine
          </h4>
          <p className="text-xs text-slate-400">
            คำนวณและปรับอัปเดตน้ำหนักความเชื่อถือเชิงสถิติ (Prior $\rightarrow$ Likelihood $\rightarrow$ Posterior)
          </p>
        </div>
      </div>

      {/* Readable Math Formula Block */}
      <FormulaViewer
        title="สูตรการคำนวณความเชื่อมั่นแบบเบย์เซียน (Bayes Theorem Formula)"
        formula="P(H_i | E) = \frac{P(E | H_i) \cdot P(H_i)}{\sum_{j} P(E | H_j) \cdot P(H_j)}"
        description="ทฤษฎีเบย์สสำหรับคำนวณความน่าจะเป็นของสมมติฐานหลัก หลังพิจารณาหลักฐานเชิงประจักษ์ (Posterior Probability)"
        explanation="ความน่าจะเป็นหลังพิจารณาหลักฐาน P(H|E) ถูกปรับเพิ่มขึ้นหรือลดลงจากความเชื่อเดิม P(H) ตามค่าน้ำหนักหลักฐาน P(E|H)"
        variables={[
          { symbol: 'P(H)', meaning: 'ความเชื่อมั่นตั้งต้นก่อนเห็นหลักฐาน (Prior Probability)' },
          { symbol: 'P(E|H)', meaning: 'ความสมเหตุสมผลของหลักฐานเทียบกับสมมติฐาน (Likelihood)' },
          { symbol: 'P(H|E)', meaning: 'ความเชื่อมั่นสุทธิหลังปรับด้วยหลักฐาน (Posterior Probability)' },
          { symbol: 'H(X)', meaning: 'ค่าความไม่แน่นอนทางสารสนเทศ (Shannon Entropy Bits)' },
        ]}
      />

      {/* Bayesian Mathematical Summary Banner */}
      {bayesian && (
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-4 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 text-xs block font-mono">Prior Confidence P(H)</span>
              <span className="text-xl font-bold font-mono text-slate-200">
                {(bayesian.priorScore * 100).toFixed(0)}%
              </span>
            </div>
            <div className="p-3 bg-sky-950/40 rounded-lg border border-sky-500/30 space-y-1">
              <span className="text-sky-300 text-xs block font-mono">Posterior Confidence P(H|E)</span>
              <span className="text-xl font-bold font-mono text-sky-400">
                {(bayesian.posteriorScore * 100).toFixed(0)}%
              </span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 text-xs block font-mono">Entropy H(X)</span>
              <span className="text-xl font-bold font-mono text-amber-400">{bayesian.entropy} bits</span>
            </div>
          </div>

          {/* Bayesian Factors List */}
          {bayesian.updates && bayesian.updates.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400 font-mono block">
                ปัจจัยปรับน้ำหนักความเชื่อถือ (Bayesian Likelihood Factor Updates):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {bayesian.updates.map((up, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center space-x-2 text-slate-300">
                      {up.direction === '+' ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span>{up.factor}</span>
                    </div>
                    <span
                      className={`font-mono font-bold shrink-0 ${
                        up.direction === '+' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {up.direction}
                      {(up.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi-Hypothesis Cards List */}
      <div className="space-y-3">
        <h5 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
          สมมติฐานที่ถูกประเมินพร้อมกัน (Parallel Strategic Hypotheses)
        </h5>

        <div className="space-y-3">
          {hypotheses.map((hyp) => {
            const statusColor =
              hyp.status === 'Supported'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : hyp.status === 'Refuted'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300';

            const StatusIcon =
              hyp.status === 'Supported'
                ? CheckCircle
                : hyp.status === 'Refuted'
                ? AlertCircle
                : HelpCircle;

            return (
              <div
                key={hyp.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      {hyp.claim}
                    </span>
                    <p className="text-xs text-slate-400">{hyp.rationale}</p>
                  </div>

                  <span
                    className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{hyp.status}</span>
                  </span>
                </div>

                {/* Probability Bar */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Prior P(H)</span>
                    <span className="text-slate-300 font-bold">{(hyp.prior * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Likelihood P(E|H)</span>
                    <span className="text-slate-300 font-bold">{(hyp.likelihood * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-sky-400 block">Posterior P(H|E)</span>
                    <span className="text-sky-300 font-bold font-mono">
                      {(hyp.posterior * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      hyp.status === 'Supported'
                        ? 'bg-emerald-400'
                        : hyp.status === 'Refuted'
                        ? 'bg-rose-500'
                        : 'bg-amber-400'
                    }`}
                    style={{ width: `${hyp.posterior * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
