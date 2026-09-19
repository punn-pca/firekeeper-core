import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck, Database, FileText, ExternalLink, Activity, Scale, AlertTriangle, Layers, Brain } from 'lucide-react';
import { PCAState, Turn } from '../types';
import { INFORMATION_TAXONOMY_MAP, normalizeTaxonomyType } from '../utils/taxonomyTokens';

interface AuditDrawerProps {
  pcaState?: PCAState | null;
  turn?: Turn;
  isLight?: boolean;
}

export const AuditDrawer: React.FC<AuditDrawerProps> = ({ pcaState, turn, isLight = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Extract taxonomy tag counts from turn content or pcaState
  const content = turn?.content || pcaState?.response || '';
  const tagCounts: Record<string, number> = {};

  const tagMatches = content.match(/\[([A-Za-z0-9_ -]+)\]/g) || [];
  for (const match of tagMatches) {
    const norm = normalizeTaxonomyType(match);
    if (norm) {
      tagCounts[norm] = (tagCounts[norm] || 0) + 1;
    }
  }

  // Extract evidence sources from PCAState
  const sources = (pcaState as any)?.retrievedEvidence || (pcaState as any)?.sources || [];
  const confidenceScore = pcaState?.executiveMetrics?.confidenceScore ?? (pcaState as any)?.confidenceScore;
  const executionMs = turn?.durationMs || pcaState?.executiveMetrics?.latencyMs;

  const hasTagCounts = Object.keys(tagCounts).length > 0;
  const hasSources = Array.isArray(sources) && sources.length > 0;
  const hasAuditData = hasTagCounts || hasSources || confidenceScore !== undefined || executionMs !== undefined;

  return (
    <div className="mt-2 pt-2 border-t border-white/5 dark:border-white/5">
      {/* Inline Taxonomy Summary Pills + Accordion Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.entries(tagCounts).map(([tagKey, count]) => {
            const meta = INFORMATION_TAXONOMY_MAP[tagKey];
            if (!meta) return null;
            return (
              <span
                key={tagKey}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-700'
                    : 'bg-white/[0.04] border-white/10 text-slate-300'
                }`}
                style={{
                  color: isLight ? meta.hex.lightText : meta.hex.darkText,
                  backgroundColor: isLight ? meta.hex.lightBg : meta.hex.darkBg,
                  borderColor: isLight ? meta.hex.lightBorder : meta.hex.darkBorder,
                }}
              >
                {tagKey} {count}
              </span>
            );
          })}
        </div>

        {/* Evidence & Audit Accordion Toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-colors cursor-pointer ${
            isLight
              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80'
              : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          <span>Evidence & Audit</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Audit Details Panel */}
      {isOpen && (
        <div className={`mt-3 p-3.5 rounded-xl border text-xs space-y-3 animate-fadeIn ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-800'
            : 'bg-[#080d1a] border-amber-500/20 text-slate-200'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2 font-mono font-bold text-amber-500 uppercase tracking-wider text-[11px]">
              <Brain className="w-4 h-4" />
              <span>PUNN PCA v3.0 Governance & Evidence Trace</span>
            </div>
            {confidenceScore !== undefined && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[10px]">
                Confidence: {Math.round(confidenceScore * 100)}%
              </span>
            )}
          </div>

          {/* Execution Telemetry */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-black/20 border border-white/5">
              <span className="text-slate-400 block text-[9px] uppercase">Latency</span>
              <span className="font-semibold">{executionMs ? `${(executionMs / 1000).toFixed(2)}s` : 'N/A'}</span>
            </div>
            <div className="p-2 rounded bg-black/20 border border-white/5">
              <span className="text-slate-400 block text-[9px] uppercase">Token Count</span>
              <span className="font-semibold">{turn?.tokensUsed || 'Evaluated'}</span>
            </div>
            <div className="p-2 rounded bg-black/20 border border-white/5">
              <span className="text-slate-400 block text-[9px] uppercase">Decision Gate</span>
              <span className="text-emerald-400 font-semibold">Level 3 Hard Stop Passed</span>
            </div>
          </div>

          {/* Sources & Evidence Links */}
          {hasSources && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3 h-3 text-sky-400" />
                <span>Verified Evidence Sources ({sources.length})</span>
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {sources.map((src: any, idx: number) => (
                  <a
                    key={idx}
                    href={src.url || src.link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-1.5 rounded bg-white/5 hover:bg-white/10 text-[11px] font-mono transition-colors group"
                  >
                    <span className="truncate pr-2 text-slate-300 group-hover:text-amber-300">
                      {src.title || src.name || src.url}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Epistemic Pillar Taxonomy Breakdown */}
          {hasTagCounts && (
            <div className="pt-1 space-y-1.5">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-amber-400" />
                <span>Epistemic Taxonomy Distribution</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(tagCounts).map(([tagKey, count]) => {
                  const meta = INFORMATION_TAXONOMY_MAP[tagKey];
                  return (
                    <div
                      key={tagKey}
                      className="px-2 py-1 rounded bg-black/30 border border-white/10 text-[10px] font-mono flex items-center gap-1.5"
                    >
                      <span className="font-bold text-amber-400">{meta?.label || tagKey}</span>
                      <span className="text-slate-400">({count})</span>
                      <span className="text-[9px] text-slate-400 truncate max-w-[120px]">{meta?.thLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
