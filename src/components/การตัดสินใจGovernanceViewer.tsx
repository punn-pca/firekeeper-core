import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck, ExternalLink, FileJson } from 'lucide-react';
import { DecisionObject } from '../shared/contracts/decision';

interface Props {
  decision: DecisionObject;
}

export const DecisionGovernanceViewer: React.FC<Props> = ({ decision }) => {
  const [expandedLevel, setExpandedLevel] = useState<number>(0);

  const toggleLevel = (level: number) => {
    setExpandedLevel(expandedLevel === level ? 0 : level);
  };

  const recommendedOption = decision.recommendation
    ? decision.options.find((option) => option.id === decision.recommendation?.optionId)
    : decision.options.find((option) => option.isRecommended);
  const rationale = decision.recommendation?.rationale || recommendedOption?.rationale || recommendedOption?.text || '';
  const confidenceScore = decision.confidence.score;
  const confidenceText = confidenceScore == null
    ? decision.confidence.label
    : `${decision.confidence.label} (${Math.round(confidenceScore * 100)}%)`;

  const cleanEvidence = (text: string) => text
    .replace(/<[^>]*>/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const evidencePreview = decision.evidence.slice(0, 5);

  return (
    <div className="mt-4 border border-amber-500/30 rounded-xl bg-slate-900/50 p-4 space-y-4">
      {/* Level 1: Summary */}
      <div className="space-y-2">
        <h3 className="font-bold text-amber-400 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" /> Decision Summary
        </h3>
        {rationale && <p className="text-sm leading-relaxed">{rationale}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
           <span className="font-mono">Confidence: {confidenceText}</span>
           {decision.risks.length > 0 && <span className="font-mono text-rose-400">Risks: {decision.risks.length}</span>}
           <span className="font-mono text-slate-400">Evidence: {decision.evidence.length}</span>
        </div>
      </div>

      {/* Expandable Controls */}
      <div className="border-t border-slate-700 pt-2 flex gap-2">
          <button onClick={() => toggleLevel(2)} className="text-xs text-sky-400 flex items-center gap-1">
              {expandedLevel === 2 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} Evidence & Policy
          </button>
          <button onClick={() => toggleLevel(3)} className="text-xs text-sky-400 flex items-center gap-1">
              {expandedLevel === 3 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} Metadata & Audit
          </button>
      </div>

      {/* Level 2 */}
      {expandedLevel === 2 && (
          <div className="space-y-3 text-xs text-slate-300">
             <h4 className="font-semibold text-sky-300">Key Evidence</h4>
             {evidencePreview.length ? (
               <div className="space-y-2">
                 {evidencePreview.map((e) => (
                   <div key={e.id} className="rounded-lg border border-slate-700/70 bg-slate-950/30 px-3 py-2">
                     <div className="line-clamp-3 leading-relaxed">{cleanEvidence(e.text)}</div>
                     <div className="mt-1 flex gap-2 text-[10px] uppercase text-slate-500">
                       <span>{e.relevance || 'UNKNOWN'}</span>
                       {e.isContradictory && <span className="text-rose-400">Contradictory</span>}
                     </div>
                   </div>
                 ))}
                 {decision.evidence.length > evidencePreview.length && (
                   <p className="text-[11px] text-slate-500">+ {decision.evidence.length - evidencePreview.length} more evidence items in the audit record</p>
                 )}
               </div>
             ) : <p className="text-slate-500">No evidence attached.</p>}
             {decision.applicable_policies.length > 0 && (
               <>
                 <h4 className="font-semibold text-sky-300">Applicable Policies</h4>
                 <ul className="list-disc pl-4">
                   {decision.applicable_policies.map(p => <li key={p.id}>{p.name}</li>)}
                 </ul>
               </>
             )}
          </div>
      )}

      {/* Level 3 */}
      {expandedLevel === 3 && (
          <div className="space-y-3 text-xs text-slate-400">
             <h4 className="font-semibold text-slate-200 flex items-center gap-2"><FileJson className="w-4 h-4" /> Audit metadata</h4>
             <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-700/70 bg-slate-950/30 p-3 font-mono">
               <span>Options</span><span>{decision.options.length}</span>
               <span>Evidence</span><span>{decision.evidence.length}</span>
               <span>Policies</span><span>{decision.applicable_policies.length}</span>
               <span>Control</span><span>{decision.controlLevel}</span>
               <span>Escalation</span><span>{decision.escalation_required ? 'REQUIRED' : 'NO'}</span>
             </div>
             <details className="rounded-lg border border-slate-700/70">
               <summary className="cursor-pointer px-3 py-2 text-slate-300">Advanced: raw decision record</summary>
               <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words border-t border-slate-700/70 p-3 font-mono text-[10px]">{JSON.stringify(decision, null, 2)}</pre>
             </details>
          </div>
      )}
    </div>
  );
};
export const การตัดสินใจGovernanceViewer = DecisionGovernanceViewer;
