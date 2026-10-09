import React from 'react';
import { Clock, Brain, ShieldCheck } from 'lucide-react';

interface PcaTrace {
  stage: string;
  timestamp: string;
  confidence: number;
  decision: string;
  details: string;
}

const mockTraces: PcaTrace[] = [
  { stage: 'Stage 1: Input Analysis', timestamp: '18:38:00', confidence: 0.98, decision: 'Proceed', details: 'Intent classified as "General Inquiry"' },
  { stage: 'Stage 5: Context Retrieval', timestamp: '18:38:05', confidence: 0.95, decision: 'Validated', details: 'Context grounded in production docs' },
  { stage: 'Stage 10: Analysis Communication', timestamp: '18:38:10', confidence: 0.92, decision: 'Generated', details: 'Governed Prompt Package assembled' },
];

export const PcaTraceDashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-amber-500" />
          <h2 className="text-lg font-bold text-neutral-100">PCA Reasoning Trace</h2>
        </div>
        <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          🛡️ Governed Mode Exclusive
        </span>
      </div>

      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-neutral-300">
        <span className="font-semibold text-amber-400">สถาปัตยกรรม Dual-Mode:</span> หน้าต่าง Trace นี้ประมวลผลและเก็บบันทึก Audit Chain เฉพาะการสนทนาใน <span className="font-bold text-amber-300">Governed Mode</span> เท่านั้น ในขณะที่ Normal Mode จะรันตรงผ่าน Shared LLM Runtime โดยไม่บันทึก PCA trace
      </div>
      
      <div className="space-y-4">
        {mockTraces.map((trace) => (
          <div key={trace.stage} className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 flex items-start gap-4">
            <div className="mt-1">
              <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-neutral-200">{trace.stage}</span>
                <span className="text-xs font-mono text-neutral-500">{trace.timestamp}</span>
              </div>
              <p className="text-xs text-neutral-400 mb-2">{trace.details}</p>
              <div className="flex gap-4">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">Confidence: <span className="text-amber-400">{(trace.confidence * 100).toFixed(0)}%</span></span>
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">Decision: <span className="text-emerald-400">{trace.decision}</span></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
