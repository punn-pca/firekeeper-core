import React, { useState, useRef } from 'react';
import { Network, Sparkles, Brain, Database, AlertTriangle, HelpCircle, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { KnowledgeGraphData, KnowledgeNode } from '../types';

interface KnowledgeGraphViewerProps {
  graphData?: KnowledgeGraphData;
}

export const KnowledgeGraphViewer: React.FC<KnowledgeGraphViewerProps> = ({ graphData }) => {
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fallback data if graphData is missing
  const activeGraphData: KnowledgeGraphData = (graphData && graphData.nodes && graphData.nodes.length > 0)
    ? graphData
    : {
        nodes: [
          { id: 'node-query', label: '1. User Intent & Problem Statement', type: 'query', weight: 10 },
          { id: 'node-concept', label: '2. Cognitive Semantic Understanding', type: 'concept', weight: 9 },
          { id: 'node-hypothesis', label: '3. Strategic Bayesian Hypotheses', type: 'hypothesis', weight: 8 },
          { id: 'node-memory', label: '4. Long-Term Multi-Store Memory', type: 'memory', weight: 8 },
          { id: 'node-risk', label: '5. Governance & Risk Guardrail', type: 'risk', weight: 9 },
        ],
        edges: [
          { source: 'node-query', target: 'node-concept', label: 'Trigger Pipeline' },
          { source: 'node-concept', target: 'node-hypothesis', label: 'Synthesize Options' },
          { source: 'node-query', target: 'node-memory', label: 'Retrieve Context' },
          { source: 'node-hypothesis', target: 'node-risk', label: 'Evaluate Governance' },
        ],
      };

  // Calculate positions in circular topology dynamically for N nodes
  const nodeCount = activeGraphData.nodes.length;
  const centerX = 380;
  const centerY = 170;
  const radiusX = Math.min(280, 180 + nodeCount * 15);
  const radiusY = 110;

  const getPos = (index: number) => {
    if (nodeCount === 1) return { x: centerX, y: centerY };
    const angle = (2 * Math.PI * index) / nodeCount - Math.PI / 2;
    return {
      x: Math.round(centerX + radiusX * Math.cos(angle)),
      y: Math.round(centerY + radiusY * Math.sin(angle)),
    };
  };

  const getNodeColor = (type: KnowledgeNode['type']) => {
    switch (type) {
      case 'query':
        return { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-300', stroke: '#f59e0b', fill: '#78350f' };
      case 'hypothesis':
        return { bg: 'bg-sky-500/20', border: 'border-sky-500', text: 'text-sky-300', stroke: '#38bdf8', fill: '#075985' };
      case 'memory':
        return { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-300', stroke: '#c084fc', fill: '#581c87' };
      case 'risk':
        return { bg: 'bg-rose-500/20', border: 'border-rose-500', text: 'text-rose-300', stroke: '#f43f5e', fill: '#881337' };
      default:
        return { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-300', stroke: '#10b981', fill: '#064e3b' };
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-xl border border-purple-500/30 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              🌐 PCA Interactive Knowledge Graph
            </h4>
            <p className="text-xs text-slate-400">
              แสดงโครงข่ายความเชื่อมโยงระหว่างโจทย์ (Query), แนวคิด (Concept), ความจำ (Memory) และความเสี่ยง (Risk)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
            title="ขยาย (Zoom In)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
            title="ย่อ (Zoom Out)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
            title="รีเซ็ตขนาด"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SVG Interactive Canvas Container */}
      <div
        ref={containerRef}
        className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-2xl"
      >
        <div className="text-xs font-mono text-slate-400 mb-2 flex items-center justify-between border-b border-slate-800/80 pb-2">
          <span>💡 คลิกที่โหนดเพื่อดูรายละเอียดค่าน้ำหนักและการเชื่อมโยงเชิงตรรกะ</span>
          <span className="text-[11px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
            {activeGraphData.nodes.length} Nodes | {activeGraphData.edges.length} Connections
          </span>
        </div>

        <div className="w-full overflow-x-auto py-2">
          <svg
            className="w-full min-w-[720px] h-[340px] select-none transition-transform duration-200"
            viewBox="0 0 760 340"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          >
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="24"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
              </marker>
            </defs>

            {/* Draw Edges with Arrows & Connection Labels */}
            {activeGraphData.edges.map((edge, idx) => {
              const srcIdx = activeGraphData.nodes.findIndex((n) => n.id === edge.source);
              const tgtIdx = activeGraphData.nodes.findIndex((n) => n.id === edge.target);

              const srcPos = srcIdx !== -1 ? getPos(srcIdx) : { x: 150, y: 150 };
              const tgtPos = tgtIdx !== -1 ? getPos(tgtIdx) : { x: 450, y: 150 };

              const midX = (srcPos.x + tgtPos.x) / 2;
              const midY = (srcPos.y + tgtPos.y) / 2;

              return (
                <g key={idx}>
                  <line
                    x1={srcPos.x}
                    y1={srcPos.y}
                    x2={tgtPos.x}
                    y2={tgtPos.y}
                    stroke="#475569"
                    strokeWidth="2"
                    markerEnd="url(#arrow)"
                    className="animate-pulse"
                  />
                  <rect
                    x={midX - 50}
                    y={midY - 10}
                    width="100"
                    height="20"
                    rx="5"
                    fill="#020617"
                    stroke="#334155"
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    fill="#cbd5e1"
                    fontSize="9.5"
                    fontWeight="600"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* Draw Nodes */}
            {activeGraphData.nodes.map((node, idx) => {
              const pos = getPos(idx);
              const colors = getNodeColor(node.type);
              const isSelected = selectedNode?.id === node.id;

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer transition-all hover:scale-105"
                >
                  {/* Outer Glow Halo */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? "36" : "28"}
                    fill={colors.stroke}
                    opacity={isSelected ? "0.35" : "0.15"}
                  />
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? "28" : "22"}
                    fill="#0f172a"
                    stroke={colors.stroke}
                    strokeWidth={isSelected ? "3" : "2"}
                  />
                  {/* Node Type Abbreviation */}
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="800"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    {node.type.toUpperCase().slice(0, 4)}
                  </text>
                  {/* Node Title Label Below */}
                  <text
                    x={pos.x}
                    y={pos.y + 42}
                    fill={isSelected ? "#fef08a" : "#e2e8f0"}
                    fontSize="11"
                    fontWeight={isSelected ? "700" : "500"}
                    textAnchor="middle"
                  >
                    {node.label.length > 22 ? node.label.slice(0, 20) + '...' : node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Details Box */}
        {selectedNode && (
          <div className="mt-3 p-3.5 bg-slate-900 border border-purple-500/40 rounded-xl flex items-center justify-between text-xs animate-fadeIn shadow-lg">
            <div className="space-y-1">
              <span className="font-bold text-purple-300 text-sm block">
                📌 รายละเอียดโหนด: {selectedNode.label}
              </span>
              <div className="flex items-center gap-4 text-slate-300 text-[11px]">
                <span>
                  ประเภท: <strong className="text-amber-400 font-mono">{selectedNode.type}</strong>
                </span>
                <span>
                  น้ำหนักความสำคัญ: <strong className="text-sky-400 font-mono">{selectedNode.weight || 9} / 10</strong>
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="px-3 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 font-mono text-xs cursor-pointer"
            >
              ปิด [X]
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
