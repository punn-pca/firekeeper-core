import React from 'react';
import { Clock, Activity } from 'lucide-react';
import { PCAState, TraceEntry } from '../../types';
import { InspectorCard } from './InspectorCard';
import { PipelineMachineViewer } from '../PipelineMachineViewer';

interface InspectorTimelineProps {
  pcaState: PCAState;
  activeWidgetIds: string[];
}

export const InspectorTimeline: React.FC<InspectorTimelineProps> = ({
  pcaState,
  activeWidgetIds,
}) => {
  const trace: TraceEntry[] = pcaState?.trace || [];

  const renderPipelineMachine = activeWidgetIds.includes('pipeline_machine');
  const renderTrace = activeWidgetIds.includes('execution_trace');

  if (!renderPipelineMachine && !renderTrace) return null;

  return (
    <div className="space-y-6">
      {/* Pipeline Machine Component */}
      {renderPipelineMachine && (
        <InspectorCard
          title="Cognitive Pipeline Machine v2.0"
          description="12-stage execution flow state"
          icon={<Activity className="w-4 h-4 text-amber-500" />}
        >
          <PipelineMachineViewer
            pipelineMachine={pcaState.pipeline_machine}
            assemblyManifest={pcaState.assembly_manifest}
            trace={pcaState.trace}
            totalLatencyMs={pcaState.execution_time_ms}
          />
        </InspectorCard>
      )}

      {/* Execution Trace Table */}
      {renderTrace && (
        <InspectorCard
          title={`12-Stage Execution Timing & Trace (${trace.length} Stages)`}
          description="Detailed execution timestamp per cognitive stage"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
        >
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0B1220] p-3 shadow-inner">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#111827] border-b border-white/10 text-slate-400 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">PCA Stage</th>
                  <th className="py-2.5 px-3">Start Offset</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[11px]">
                {trace.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500 font-sans">
                      ไม่มีข้อมูล Execution Trace ในผลลัพธ์นี้
                    </td>
                  </tr>
                ) : (
                  trace.map((t, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 text-center text-amber-400 font-bold">{idx + 1}</td>
                      <td className="py-2.5 px-3 text-slate-200 font-medium">{t.stage_th_label || t.stage}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono">+{t.start_rel_ms ?? 0} ms</td>
                      <td className="py-2.5 px-3 text-amber-400 font-bold font-mono">{t.duration_ms} ms</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {t.executionType || 'HEURISTIC_EVAL'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </InspectorCard>
      )}
    </div>
  );
};
