import React from 'react';
import { Database, ArrowUpRight, Plus, Sparkles, History, Layers, Cpu, CheckCircle, Target, AlertTriangle } from 'lucide-react';
import { MemoryDelta, RankedMemoryItem, MemoryImpactItem } from '../types';

interface MemoryEvolutionViewerProps {
  memoryEvolution?: MemoryDelta;
  rankedMemories?: RankedMemoryItem[];
  memoryImpacts?: MemoryImpactItem[];
}

export const MemoryEvolutionViewer: React.FC<MemoryEvolutionViewerProps> = ({
  memoryEvolution,
  rankedMemories,
  memoryImpacts,
}) => {
  if (!memoryEvolution && (!rankedMemories || rankedMemories.length === 0)) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
        ไม่มีข้อมูล Memory Evolution สำหรับคำตอบนี้
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex items-center space-x-3 bg-slate-900/90 p-4 rounded-xl border border-purple-500/30">
        <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/40 flex items-center justify-center text-purple-400">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            🧩 PCA v2.0 Multi-Store Memory Architecture & Retrieval Ranking
          </h4>
          <p className="text-xs text-slate-400">
            จำแนก Episodic, Semantic, Working Memory พร้อม Cross-Encoder Score & Recency Weight
          </p>
        </div>
      </div>

      {/* Multi-Store Memory Breakdown Grid */}
      {rankedMemories && rankedMemories.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-xs font-semibold text-purple-300 font-mono uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            คลังความจำ 3 ระดับ (Multi-Store Memory Classification)
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {['Episodic', 'Semantic', 'Working'].map((store) => {
              const items = rankedMemories.filter((m) => m.storeType === store || (store === 'Semantic' && !m.storeType));
              const badgeColor =
                store === 'Episodic'
                  ? 'bg-sky-500/10 text-sky-300 border-sky-500/40'
                  : store === 'Semantic'
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/40'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40';

              return (
                <div key={store} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${badgeColor}`}>
                      {store} Memory
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{items.length} items</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {items.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic p-2">ไม่มีข้อมูลจำเพาะในสโตร์นี้</p>
                    ) : (
                      items.map((item, idx) => {
                        const isFictional = (item.content || '').toLowerCase().includes('fictional') || (item.content || '').includes('สมมติ') || (item.content || '').toLowerCase().includes('baseline');
                        return (
                          <div key={idx} className={`p-2 rounded border text-[11px] space-y-1 ${isFictional ? 'bg-amber-950/20 border-amber-500/40' : 'bg-slate-900 border-slate-800/80'}`}>
                            {isFictional && (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono mb-1">
                                ⚠️ ตัวอย่างสมมติ (Fictional Example)
                              </span>
                            )}
                            <p className="text-slate-200 line-clamp-2">{item.content}</p>
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                              <span>Rel Score: <strong className="text-purple-300">{Math.round((item.relevanceScore || 0.8) * 100)}%</strong></span>
                              <span>CrossEncoder: <strong className="text-sky-300">{Math.round((item.crossEncoderScore || 0.85) * 100)}%</strong></span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Context Evolution Summary Card */}
      {memoryEvolution && (
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
          <span className="text-xs font-semibold text-purple-300 font-mono uppercase tracking-wider block">
            สรุปการเติบโตของบริบท (Context Delta Summary)
          </span>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {memoryEvolution.contextEvolutionSummary}
          </p>
        </div>
      )}

      {/* Memory Confidence Shift Updates */}
      {memoryEvolution?.updated && memoryEvolution.updated.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
            การปรับเปลี่ยนคะแนนความเชื่อมั่นของความจำ (Confidence Calibration Shift)
          </h5>

          <div className="space-y-2">
            {memoryEvolution.updated.map((u, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <span className="font-mono text-purple-300 font-bold block">{u.id}</span>
                  <span className="text-slate-400 block">{u.reason}</span>
                </div>

                <div className="flex items-center space-x-3 shrink-0 font-mono text-xs">
                  <span className="text-slate-500">{(u.oldConfidence * 100).toFixed(0)}%</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">
                    {(u.newConfidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Active Memory Impact Matrix Panel */}
      {memoryImpacts && memoryImpacts.length > 0 && (
        <div className="bg-slate-950/90 border border-purple-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h5 className="text-xs font-bold text-purple-300 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              🧠 การส่งผลจริงของความจำต่อการตัดสินใจ (Dynamic Memory Impact Matrix)
            </h5>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
              AUDITED IMPACT
            </span>
          </div>

          <div className="space-y-2">
            {memoryImpacts.map((mi, idx) => {
              const statusBadge =
                mi.usageStatus === 'USED_IN_DECISION'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : mi.usageStatus === 'CONFLICTED'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : mi.usageStatus === 'REJECTED_OUTDATED'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700';

              const statusLabel =
                mi.usageStatus === 'USED_IN_DECISION'
                  ? 'นำไปใช้ตัดสินใจหลัก'
                  : mi.usageStatus === 'CONFLICTED'
                  ? 'ถูกปรับลดเนื่องจากขัดแย้ง'
                  : mi.usageStatus === 'REJECTED_OUTDATED'
                  ? 'ปฏิเสธเนื่องจากหมดอายุ'
                  : 'บริบทสนับสนุนแวดล้อม';

              return (
                <div key={idx} className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-purple-300 font-bold">{mi.memoryId}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${statusBadge}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-slate-200 text-[11px] line-clamp-2 italic border-l-2 border-purple-500/50 pl-2">
                    "{mi.content}"
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                    <span>ขั้นตอนประยุกต์: <strong className="text-purple-300">{mi.appliedStage}</strong></span>
                    <span className="text-slate-300">{mi.impactDescription}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
