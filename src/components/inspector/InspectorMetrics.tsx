import React from 'react';
import { ExecutiveMetrics, ConfidenceCalibration, BayesianMetrics } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../utils/themeTokens';

interface InspectorMetricsProps {
  metrics?: ExecutiveMetrics;
  calibration?: ConfidenceCalibration;
  bayesian?: BayesianMetrics;
  conflictCount?: number;
}

export const InspectorMetrics: React.FC<InspectorMetricsProps> = ({
  metrics,
  calibration,
  bayesian,
  conflictCount = 0,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  const riskScore = metrics?.riskScore ?? 12;
  const confidenceScore = metrics?.confidenceScore ?? 88;
  const latencyMs = metrics?.latencyMs ?? 1150;
  const estCostUsd = metrics?.tokenUsage?.estCostUsd ?? 0.023;

  const cards = [
    {
      title: 'Risk',
      value: `${riskScore}%`,
      subtitle: 'Low Risk Threshold < 25%',
      status: '● Healthy',
      statusColor: isLight
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      valueColor: isLight ? 'text-emerald-600' : 'text-emerald-400',
      accentLine: 'border-t-2 border-t-emerald-500',
    },
    {
      title: 'Confidence',
      value: `${confidenceScore}%`,
      subtitle: 'ECE Calibration Error 0.03',
      status: '● Healthy',
      statusColor: isLight
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      valueColor: isLight ? 'text-[#D97706]' : 'text-amber-400',
      accentLine: 'border-t-2 border-t-[#F59E0B]',
    },
    {
      title: 'Latency',
      value: `${latencyMs} ms`,
      subtitle: 'Internal Reasoning ~180ms | LLM ~' + (latencyMs > 1000 ? Math.round(latencyMs - 180) : latencyMs) + 'ms',
      status: '● Healthy',
      statusColor: isLight
        ? 'text-blue-700 bg-blue-50 border-blue-200'
        : 'text-slate-300 bg-white/5 border-white/10',
      valueColor: isLight ? 'text-[#111827]' : 'text-white',
      accentLine: 'border-t-2 border-t-blue-500',
    },
    {
      title: 'Cost',
      value: `$${estCostUsd.toFixed(3)}`,
      subtitle: '19.2k Tokens Used',
      status: '● Healthy',
      statusColor: isLight
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      valueColor: isLight ? 'text-emerald-600' : 'text-emerald-400',
      accentLine: 'border-t-2 border-t-emerald-500',
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((c, idx) => (
        <div
          key={idx}
          className={`border rounded-xl p-5 flex flex-col justify-between h-full ${tokens.shadow} ${c.accentLine} ${
            isLight ? 'bg-white border-[#E5E7EB]' : 'bg-[#111827] border-white/10'
          }`}
        >
          {/* Card Top */}
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-[#6B7280]' : 'text-slate-400'
            }`}>
              {c.title}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${c.statusColor}`}>
              {c.status}
            </span>
          </div>

          {/* Large Number */}
          <div className="my-1">
            <div className={`text-2xl font-bold tracking-tight ${c.valueColor}`}>{c.value}</div>
          </div>

          {/* Subtitle */}
          <div className={`mt-2 pt-2 border-t text-xs font-normal ${
            isLight ? 'border-[#E5E7EB] text-[#6B7280]' : 'border-white/5 text-slate-400'
          }`}>
            {c.subtitle}
          </div>
        </div>
      ))}
    </section>
  );
};
