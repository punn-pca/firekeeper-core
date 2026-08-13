import React, { useState } from 'react';
import { Search, ExternalLink, ShieldCheck, Database, MessageSquare, BookOpen, Filter, Scale, GitPullRequest } from 'lucide-react';
import { EvidenceItem, ConflictResolutionItem } from '../types';

interface EvidenceExplorerProps {
  evidenceList?: EvidenceItem[];
  conflictResolutions?: ConflictResolutionItem[];
}

export const EvidenceExplorer: React.FC<EvidenceExplorerProps> = ({ evidenceList, conflictResolutions }) => {
  const [filterType, setFilterType] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);

  if (!evidenceList || evidenceList.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
        ไม่มีหลักฐานในระบบสำหรับเซสชันนี้
      </div>
    );
  }

  const filtered = filterType === 'All'
    ? evidenceList
    : evidenceList.filter((e) => e.type === filterType);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-xl border border-emerald-500/30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              🔍 Citation & Evidence Explorer
            </h4>
            <p className="text-xs text-slate-400">
              สำรวจหลักฐานเชิงประจักษ์ ระดับความน่าเชื่อถือ และแหล่งอ้างอิงของระบบ
            </p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
          {['All', 'User Context', 'Memory', 'Empirical'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterType === t
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'All' ? 'ทั้งหมด' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const supp = item.supportScore ?? 90;
          const isHigh = supp >= 80 || item.strength === 'High';
          const isMedium = !isHigh && (supp >= 60 || item.strength === 'Medium');

          const priorityTag = isHigh ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
              🔴 HIGH PRIORITY
            </span>
          ) : isMedium ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              🟡 MEDIUM
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1">
              🔵 LOW
            </span>
          );

          const cardBorder = isHigh
            ? 'border-rose-500/40 bg-slate-900/90 hover:border-rose-500/70'
            : isMedium
            ? 'border-amber-500/30 bg-slate-900/80 hover:border-amber-500/60'
            : 'border-slate-800 bg-slate-900/70 hover:border-slate-700';

          return (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`p-4 rounded-xl border cursor-pointer transition-all space-y-3 ${cardBorder} ${
                selectedItem?.id === item.id
                  ? 'border-emerald-500 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  {item.source}
                </span>

                <div className="flex items-center gap-1.5">
                  {priorityTag}
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-700 text-slate-400">
                    {item.strength}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-200 font-medium leading-relaxed italic border-l-2 border-emerald-500/50 pl-3 py-0.5">
                {item.content}
              </p>

              {/* Explainable AI Evidence Matrix Scores */}
              <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-center">
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded py-1">
                  <span className="text-slate-400 block text-[9px]">SUPPORT</span>
                  <span className="text-emerald-300 font-bold">{item.supportScore ?? 90}%</span>
                </div>
                <div className="bg-rose-950/40 border border-rose-500/30 rounded py-1">
                  <span className="text-slate-400 block text-[9px]">CONFLICT</span>
                  <span className="text-rose-300 font-bold">{item.conflictScore ?? 10}%</span>
                </div>
                <div className="bg-sky-950/40 border border-sky-500/30 rounded py-1">
                  <span className="text-slate-400 block text-[9px]">NOVELTY</span>
                  <span className="text-sky-300 font-bold">{item.noveltyScore ?? 75}%</span>
                </div>
                <div className="bg-amber-950/40 border border-amber-500/30 rounded py-1">
                  <span className="text-slate-400 block text-[9px]">RELIABILITY</span>
                  <span className="text-amber-300 font-bold">{item.reliabilityScore ?? Math.round(item.credibilityScore * 100)}%</span>
                </div>
              </div>

              {item.explainableAnalysis && (
                <p className="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800 text-left">
                  💡 <strong className="text-emerald-400">Explainable AI Analysis:</strong> {item.explainableAnalysis}
                </p>
              )}

              {/* Provenance & Citation Metadata */}
              {(item.documentId || item.sourceUrl || item.citationQuote) && (
                <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] space-y-1 font-mono text-slate-300">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400">
                    <span>📌 Doc ID: <strong className="text-emerald-300">{item.documentId || 'DOC-GENERIC'}</strong></span>
                    {item.locator && <span className="text-slate-400">📍 {item.locator}</span>}
                  </div>
                  {item.citationQuote && (
                    <p className="text-slate-300 italic">
                      &ldquo;{item.citationQuote}&rdquo;
                    </p>
                  )}
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{item.sourceUrl}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive Detail Modal / Inspector Drawer */}
      {selectedItem && (
        <div className="p-4 bg-slate-950/90 border border-emerald-500/40 rounded-xl space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
            <span>🎯 รายละเอียดหลักฐานชิ้นที่เลือก ({selectedItem.id})</span>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              ปิด Inspector
            </button>
          </div>
          <p className="text-xs text-slate-200">{selectedItem.content}</p>
          <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-4 pt-1 font-mono">
            <span>แหล่งที่มา: {selectedItem.source}</span>
            <span>คะแนนความน่าเชื่อถือ: {(selectedItem.credibilityScore * 100).toFixed(0)}%</span>
            <span>ความสมบูรณ์: ผ่านเกณฑ์การตรวจสอบ PCA v2.0</span>
          </div>
        </div>
      )}

      {/* Conflict Resolution Engine Panel */}
      {conflictResolutions && conflictResolutions.length > 0 && (
        <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h5 className="text-xs font-bold text-amber-300 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              ⚖️ กลไกการจัดการความขัดแย้งของหลักฐาน (Conflict Resolution Engine)
            </h5>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              EXPLICIT RESOLUTION
            </span>
          </div>

          <div className="space-y-2.5">
            {conflictResolutions.map((cr) => (
              <div key={cr.id} className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg text-xs space-y-2">
                <div className="font-semibold text-slate-200 flex items-start gap-1.5">
                  <GitPullRequest className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>ประเด็น: {cr.conflictDescription}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-rose-400 block text-[9px]">ฝั่ง A (Source A)</span>
                    <span className="text-slate-300">{cr.sourceA}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-sky-400 block text-[9px]">ฝั่ง B (Source B)</span>
                    <span className="text-slate-300">{cr.sourceB}</span>
                  </div>
                </div>

                <div className="bg-amber-950/30 border border-amber-500/30 p-2.5 rounded text-[11px] space-y-1">
                  <div className="text-amber-300 font-semibold flex items-center justify-between">
                    <span>แนวทางตัดสินใจ: {cr.resolutionChoice}</span>
                    <span className="text-[10px] font-mono text-rose-400">{cr.confidenceImpact}</span>
                  </div>
                  <p className="text-slate-300 text-[10.5px] leading-relaxed">{cr.rationale}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
