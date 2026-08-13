import React, { useState, useRef } from 'react';
import { GitMerge, RotateCcw, ShieldCheck, ArrowRight, CheckCircle2, AlertTriangle, Layers, Sparkles } from 'lucide-react';
import { DecisionGraphData, DecisionGraphNode } from '../types';

interface DecisionGraphViewerProps {
  graphData?: DecisionGraphData;
}

export const DecisionGraphViewer: React.FC<DecisionGraphViewerProps> = ({ graphData }) => {
  const [selectedNode, setSelectedNode] = useState<DecisionGraphNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fallback decision graph if graphData is missing or empty
  const activeGraphData: DecisionGraphData = (graphData && graphData.nodes && graphData.nodes.length > 0)
    ? graphData
    : {
        nodes: [
          { id: 'N1', label: '1. User Intent & Boundary', stageGroup: 'Input', status: 'Completed' },
          { id: 'N2', label: '2. Multi-Store Memory Context', stageGroup: 'Reasoning', status: 'Completed' },
          { id: 'N3', label: '3. Bayesian Hypotheses Engine', stageGroup: 'Reasoning', status: 'Refined' },
          { id: 'N4', label: '4. Evidence & Risk Evaluation', stageGroup: 'Evaluation', status: 'Guarded' },
          { id: 'N5', label: '5. Calibrated Executive Decision', stageGroup: 'Output', status: 'Completed' },
        ],
        edges: [
          { from: 'N1', to: 'N2', label: 'Context Retrieval', type: 'linear' },
          { from: 'N2', to: 'N3', label: 'Prior & Likelihood', type: 'linear' },
          { from: 'N3', to: 'N4', label: 'Evidence Weighting', type: 'linear' },
          { from: 'N4', to: 'N5', label: 'Confidence Calibration', type: 'guardrail' },
          { from: 'N4', to: 'N3', label: 'Posterior Feedback Loop', type: 'feedback_loop' },
        ],
        hasActiveFeedbackLoop: true,
        loopCount: 1,
      };

  const nodes = activeGraphData.nodes || [];
  const edges = activeGraphData.edges || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-amber-500/30 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <GitMerge className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              🔀 PCA Non-Linear Decision Graph & Feedback Loop Engine
            </h4>
            <p className="text-xs text-slate-400">
              กราฟขั้นตอนการตัดสินใจแบบวนลูปป้อนกลับ (Feedback Loop) และจุดตรวจ Governance Guardrails
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`px-2.5 py-1 rounded border font-mono text-xs font-semibold ${
            activeGraphData.hasActiveFeedbackLoop
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}>
            Feedback Loop: {activeGraphData.hasActiveFeedbackLoop ? `Active (Iteration ${activeGraphData.loopCount})` : 'Linear Passed'}
          </span>
        </div>
      </div>

      {/* Decision Graph Workflow Visualizer Container */}
      <div
        ref={containerRef}
        className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h5 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            แผนผังลำดับขั้นการประมวลผลความคิดเชิงกราฟ (Graph Execution Map)
          </h5>
          <span className="text-[11px] text-slate-400 font-mono">
            คลิกโหนดเพื่อตรวจสอบสภาวะของแต่ละสเตจ
          </span>
        </div>

        {/* Nodes Flow Pipeline Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {nodes.map((node) => {
            const isLooping = node.status === 'Looping';
            const isGuarded = node.status === 'Guarded';
            const isRefined = node.status === 'Refined';
            const isSelected = selectedNode?.id === node.id;

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 relative ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/15 shadow-xl shadow-amber-950/40 ring-1 ring-amber-400'
                    : isLooping
                    ? 'border-rose-500/60 bg-rose-950/30 hover:border-rose-400'
                    : isRefined
                    ? 'border-sky-500/60 bg-sky-950/30 hover:border-sky-400'
                    : isGuarded
                    ? 'border-purple-500/60 bg-purple-950/30 hover:border-purple-400'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400 font-semibold">{node.stageGroup || 'Stage'}</span>
                  <span className={`px-1.5 py-0.5 rounded font-semibold capitalize ${
                    isLooping ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : isRefined ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {node.status}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-100 leading-snug">{node.label}</p>

                {isLooping && (
                  <div className="flex items-center gap-1 text-[10px] text-rose-400 font-mono animate-pulse">
                    <RotateCcw className="w-3 h-3" /> Feedback Loop Triggered
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Node Drawer Details */}
        {selectedNode && (
          <div className="p-3.5 bg-slate-900 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs animate-fadeIn shadow-lg">
            <div className="space-y-1">
              <span className="font-bold text-amber-300 text-sm block">
                🔍 รายละเอียดโหนดการตัดสินใจ: {selectedNode.label}
              </span>
              <div className="flex items-center gap-4 text-slate-300 text-[11px] font-mono">
                <span>กลุ่มสเตจ: <strong className="text-sky-300">{selectedNode.stageGroup}</strong></span>
                <span>สถานะประมวลผล: <strong className="text-emerald-400 capitalize">{selectedNode.status}</strong></span>
                <span>ID โหนด: <strong className="text-slate-400">{selectedNode.id}</strong></span>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-mono text-xs cursor-pointer"
            >
              ปิด [X]
            </button>
          </div>
        )}

        {/* Edges & Feedback Connections Table */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <h6 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
            เส้นทางการเชื่อมโยงและการย้อนกลับ (Graph Edges & Feedback Transitions)
          </h6>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {edges.map((edge, idx) => {
              const fromNode = edge.from || `Node-${idx}`;
              const toNode = edge.to || `Node-${idx + 1}`;

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                    edge.type === 'feedback_loop'
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                      : edge.type === 'guardrail'
                      ? 'bg-purple-950/30 border-purple-500/40 text-purple-200'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-mono text-xs">
                    <span className="font-bold text-amber-400 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">{fromNode}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-bold text-sky-400 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">{toNode}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 font-medium text-[11px] truncate">{edge.label}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border shrink-0 ${
                      edge.type === 'feedback_loop'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : edge.type === 'guardrail'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {edge.type || 'linear'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
