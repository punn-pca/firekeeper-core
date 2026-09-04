import React, { useState } from 'react';
import { Gauge, ShieldCheck, ChevronDown, ChevronUp, Scale, CheckCircle2 } from 'lucide-react';
import { ConfidenceCalibration } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ConfidenceCardProps {
  confidence: ConfidenceCalibration;
  className?: string;
  defaultExpanded?: boolean;
}

export const ConfidenceCard: React.FC<ConfidenceCardProps> = ({
  confidence,
  className = '',
  defaultExpanded = false,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [expanded, setExpanded] = useState(defaultExpanded);

  const getLabelColor = (label: ConfidenceCalibration['label']) => {
    switch (label) {
      case 'สูง':
        return isLight
          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
          : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40';
      case 'ปานกลาง':
        return isLight
          ? 'bg-blue-100 text-blue-800 border-blue-300'
          : 'bg-blue-950/60 text-blue-400 border-blue-500/40';
      case 'ต่ำ':
        return isLight
          ? 'bg-amber-100 text-amber-800 border-amber-300'
          : 'bg-amber-950/60 text-amber-400 border-amber-500/40';
      default:
        return isLight
          ? 'bg-slate-100 text-slate-700 border-slate-300'
          : 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div
      id="confidence-box"
      className={`rounded-xl border transition-all overflow-hidden min-w-0 ${
        isLight
          ? 'bg-sky-50/60 border-sky-200 text-slate-800 shadow-sm'
          : 'bg-sky-950/20 border-sky-800/40 text-slate-200 shadow-md'
      } ${className}`}
    >
      {/* Header Bar */}
      <div className="p-3 sm:p-3.5 flex items-center justify-between gap-2 border-b border-inherit">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
              isLight ? 'bg-sky-100 border-sky-300' : 'bg-sky-900/40 border-sky-700/50'
            }`}
          >
            <Gauge className="w-4 h-4 text-sky-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs sm:text-sm tracking-tight flex items-center gap-1">
                📐 Calibrated Confidence
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                {confidence.verificationState || (confidence.calibrationStatus === 'EMPIRICAL_VERIFIED' ? 'VERIFIED' : 'UNVERIFIED')}
              </span>
              {confidence.epistemicQuarantineActive && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  🛡️ Epistemic Quarantine
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              Strict Multi-Criteria Evidence Calibration
            </p>
          </div>
        </div>

        {/* Score & Label Pill */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={`px-2 py-0.5 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm ${getLabelColor(
              confidence.label
            )}`}
          >
            <span>
              {confidence.scorePercent !== null && confidence.scorePercent !== undefined
                ? `${confidence.scorePercent}%`
                : 'N/A'}
            </span>
            <span className="font-sans font-medium">({confidence.label})</span>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'ซ่อนรายละเอียด' : 'แสดงรายละเอียด'}
            className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
              isLight
                ? 'hover:bg-sky-100 text-slate-600'
                : 'hover:bg-sky-900/50 text-slate-300'
            }`}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Body / Metrics & Empirical Note */}
      <div className="p-3 sm:p-3.5 space-y-2.5 text-xs">
        {/* Formula & Traceability Display (Collapsible) */}
        {expanded && (
          <div className="space-y-1.5">
            <div
              className={`px-2.5 py-1.5 rounded-lg border font-mono text-xs flex items-center justify-between gap-2 overflow-x-auto ${
                isLight
                  ? 'bg-white/80 border-sky-200/80 text-sky-950'
                  : 'bg-slate-950/60 border-sky-900/30 text-sky-300'
              }`}
            >
              <span className="font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase shrink-0">
                Formula:
              </span>
              <span className="font-bold truncate" title={confidence.formula}>
                {confidence.formula}
              </span>
              {confidence.bayesianPosterior !== undefined && confidence.bayesianPosterior !== null && (
                <span className="text-[10px] px-1 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 shrink-0">
                  P(H|E) = {confidence.bayesianPosterior}
                </span>
              )}
            </div>

            {confidence.mathematicalProof && (
              <div
                className={`px-2.5 py-1.5 rounded-lg border font-mono text-[11px] flex items-center gap-2 ${
                  isLight
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                }`}
              >
                <span className="font-bold text-[10px] uppercase px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
                  Math Trace
                </span>
                <span className="truncate" title={confidence.mathematicalProof}>
                  {confidence.mathematicalProof}
                </span>
              </div>
            )}

            {confidence.epistemicQuarantineActive && confidence.quarantineReason && (
              <div
                className={`px-2.5 py-1.5 rounded-lg border font-mono text-[11px] flex items-center gap-2 ${
                  isLight
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
                }`}
              >
                <span className="font-bold text-[10px] uppercase px-1 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                  Quarantine
                </span>
                <span className="truncate" title={confidence.quarantineReason}>
                  {confidence.quarantineReason}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Components Grid */}
        <div className="metrics-scroll overflow-x-auto pb-1.5 -mx-0.5 px-0.5 touch-pan-x">
          <div className="metrics-grid">
            <div
              className={`p-2.5 rounded-lg border flex flex-col justify-between min-h-[72px] min-w-[110px] ${
                isLight ? 'bg-white/70 border-slate-200 shadow-xs' : 'bg-slate-950/40 border-slate-800/80 shadow-xs'
              }`}
            >
              <span className="metric-label text-slate-500 dark:text-slate-400 font-sans">Evidence Quality</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-1.5 font-mono">
                {typeof confidence.evidenceQuality === 'number'
                  ? `${(confidence.evidenceQuality * 100).toFixed(0)}%`
                  : 'N/A'}
              </span>
            </div>

            <div
              className={`p-2.5 rounded-lg border flex flex-col justify-between min-h-[72px] min-w-[110px] ${
                isLight ? 'bg-white/70 border-slate-200 shadow-xs' : 'bg-slate-950/40 border-slate-800/80 shadow-xs'
              }`}
            >
              <span className="metric-label text-slate-500 dark:text-slate-400 font-sans">Source Reliability</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-1.5 font-mono">
                {typeof confidence.sourceReliability === 'number'
                  ? `${(confidence.sourceReliability * 100).toFixed(0)}%`
                  : 'N/A'}
              </span>
            </div>

            <div
              className={`p-2.5 rounded-lg border flex flex-col justify-between min-h-[72px] min-w-[110px] ${
                isLight ? 'bg-white/70 border-slate-200 shadow-xs' : 'bg-slate-950/40 border-slate-800/80 shadow-xs'
              }`}
            >
              <span className="metric-label text-slate-500 dark:text-slate-400 font-sans">Evidence Coverage</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-1.5 font-mono">
                {typeof (confidence.evidenceCoverage ?? confidence.evidenceCompleteness) === 'number'
                  ? `${((confidence.evidenceCoverage ?? confidence.evidenceCompleteness)! * 100).toFixed(0)}%`
                  : '0%'}
              </span>
            </div>

            <div
              className={`p-2.5 rounded-lg border flex flex-col justify-between min-h-[72px] min-w-[110px] ${
                isLight ? 'bg-white/70 border-slate-200 shadow-xs' : 'bg-slate-950/40 border-slate-800/80 shadow-xs'
              }`}
            >
              <span className="metric-label text-slate-500 dark:text-slate-400 font-sans">Conflict Penalty</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 text-sm mt-1.5 font-mono">
                {typeof confidence.conflictPenalty === 'number'
                  ? `${confidence.conflictPenalty > 0 ? '-' : ''}${(confidence.conflictPenalty * 100).toFixed(0)}%`
                  : 'N/A'}
              </span>
            </div>

            <div
              className={`p-2.5 rounded-lg border flex flex-col justify-between min-h-[72px] min-w-[110px] ${
                isLight ? 'bg-white/70 border-slate-200 shadow-xs' : 'bg-slate-950/40 border-slate-800/80 shadow-xs'
              }`}
            >
              <span className="metric-label text-slate-500 dark:text-slate-400 font-sans">Missing Info Penalty</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 text-sm mt-1.5 font-mono">
                {typeof confidence.missingInfoPenalty === 'number'
                  ? `${confidence.missingInfoPenalty > 0 ? '-' : ''}${(confidence.missingInfoPenalty * 100).toFixed(0)}%`
                  : 'N/A'}
              </span>
            </div>

            <div
              className={`p-2.5 rounded-lg border flex flex-col justify-between min-h-[72px] min-w-[110px] ${
                isLight ? 'bg-white/70 border-slate-200 shadow-xs' : 'bg-slate-950/40 border-slate-800/80 shadow-xs'
              }`}
            >
              <span className="metric-label text-slate-500 dark:text-slate-400 font-sans">Verification Status</span>
              <span
                className={`font-bold text-xs mt-1.5 font-mono truncate ${
                  (confidence.verificationStatus || confidence.calibrationStatus) === 'VERIFIED' || (confidence.verificationStatus || confidence.calibrationStatus) === 'EMPIRICAL_VERIFIED'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : (confidence.verificationStatus || confidence.calibrationStatus) === 'PARTIALLY_VERIFIED'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-sky-600 dark:text-sky-400'
                }`}
                title={confidence.verificationStatus || confidence.calibrationStatus || 'NOT_VERIFIED'}
              >
                {confidence.verificationStatus || confidence.calibrationStatus || 'NOT_VERIFIED'}
              </span>
            </div>
          </div>
        </div>

        {/* Empirical Grounding Note Callout */}
        <div
          className={`p-2.5 rounded-lg border text-[11px] leading-relaxed flex items-start gap-2 ${
            isLight
              ? 'bg-sky-100/60 border-sky-300/70 text-sky-950'
              : 'bg-sky-950/40 border-sky-800/40 text-sky-200/90'
          }`}
        >
          <Scale className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold font-mono text-[10px] uppercase px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-700 dark:text-sky-300">
              Statistical Evidence Invariant
            </span>
            <p className="text-[11px]">
              {confidence.empiricalCalibrationNote ||
                'Strict Evidence Boundary Calibration: ความมั่นใจยึดโยงกับพยานหลักฐานเชิงประจักษ์ที่ผ่านการตรวจสอบ และถูกตัดคะแนนตามข้อจำกัดด้านสารสนเทศที่ไม่ครบถ้วน'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
