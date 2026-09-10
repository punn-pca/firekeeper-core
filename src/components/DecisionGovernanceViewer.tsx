import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, Database, Info } from 'lucide-react';
import { DecisionObject } from '../shared/contracts/decision';

interface Props {
  decision: DecisionObject;
}

export const DecisionGovernanceViewer: React.FC<Props> = ({ decision }) => {
  const [expandedLevel, setExpandedLevel] = useState<number>(0);

  const toggleLevel = (level: number) => {
    setExpandedLevel(expandedLevel === level ? 0 : level);
  };

  return (
    <div className="mt-4 border border-amber-500/30 rounded-xl bg-slate-900/50 p-4 space-y-4">
      {/* Level 1: Summary */}
      <div className="space-y-2">
        <h3 className="font-bold text-amber-400 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" /> Decision Summary
        </h3>
        <p className="text-sm">{decision.recommendation?.rationale || 'No rationale provided.'}</p>
        <div className="flex gap-4 text-xs">
           <span className="font-mono">Confidence: {decision.confidence.label} ({Math.round(decision.confidence.score * 100)}%)</span>
           <span className="font-mono text-rose-400">Risks: {decision.risks.length}</span>
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
      {expandedLevel >= 2 && (
          <div className="space-y-2 text-xs text-slate-300">
             <h4 className="font-semibold text-sky-300">Evidence</h4>
             <ul className="list-disc pl-4">
                 {decision.evidence.map(e => <li key={e.id}>{e.text}</li>)}
             </ul>
             <h4 className="font-semibold text-sky-300">Applicable Policies</h4>
             <ul className="list-disc pl-4">
                 {decision.applicable_policies.map(p => <li key={p.id}>{p.name}</li>)}
             </ul>
          </div>
      )}

      {/* Level 3 */}
      {expandedLevel === 3 && (
          <div className="space-y-2 text-xs text-slate-400 font-mono">
             <h4 className="font-semibold text-slate-200">Audit Trail</h4>
             <pre>{JSON.stringify(decision, null, 2)}</pre>
          </div>
      )}
    </div>
  );
};
