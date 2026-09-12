import React, { useState, FormEvent } from 'react';
import { Database, Plus, Trash2, Shield, Layers, Lock, AlertTriangle, CheckCircle, RefreshCw, Check, X, Clock, FileText } from 'lucide-react';
import { MemoryItem, MemoryCandidate } from '../types';
import { getMemoryAudits } from '../utils/memoryCandidateEngine';
import { runMemoryGovernanceTests, TestResultItem } from '../utils/memoryTestRunner';

interface MemoryManagerProps {
  memories: MemoryItem[];
  memoryCandidates?: MemoryCandidate[];
  onAddMemory: (content: string, layer: MemoryItem['layer'], source: string) => void;
  onDeleteMemory: (id: string) => void;
  onApproveCandidate?: (candidate: MemoryCandidate) => void;
  onDismissCandidate?: (candidateId: string) => void;
  isLoading: boolean;
}

export const MemoryManager: React.FC<MemoryManagerProps> = ({
  memories,
  memoryCandidates = [],
  onAddMemory,
  onDeleteMemory,
  onApproveCandidate,
  onDismissCandidate,
  isLoading,
}) => {
  const [content, setContent] = useState('');
  const [layer, setLayer] = useState<MemoryItem['layer']>('Fact');
  const [source, setSource] = useState('User Override');
  const [hideFictional, setHideFictional] = useState(false);
  const [unlockingConstraintId, setUnlockingConstraintId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResultItem[] | null>(null);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  const pendingCandidates = memoryCandidates.filter(c => c.status === 'PENDING');
  const audits = getMemoryAudits();

  const isFictionalItem = (mem: MemoryItem) => {
    const text = (mem.content + ' ' + mem.source + ' ' + (mem.provenanceId || '')).toLowerCase();
    return text.includes('fictional') || text.includes('สมมติ') || text.includes('baseline');
  };

  const getMetadata = (mem: MemoryItem) => {
    const layer = mem.layer || 'Fact';
    const source = mem.source || 'User Input';
    let authority = mem.authority;
    if (!authority) {
      if (layer === 'Constraint' || layer === 'System') authority = 'System';
      else if (layer === 'Preference' || source.toLowerCase().includes('user') || source.toLowerCase().includes('profile')) authority = 'User';
      else if (layer === 'Context' || layer === 'Session State' || source.toLowerCase().includes('session') || source.toLowerCase().includes('goal')) authority = 'Session';
      else if (source.toLowerCase().includes('baseline') || source.toLowerCase().includes('observation')) authority = 'Derived';
      else authority = 'External';
    }

    let mutability = mem.mutability;
    if (!mutability) {
      mutability = (layer === 'Constraint' || layer === 'System') ? 'Immutable' : 'Mutable';
    }

    const status = mem.status || 'Active';
    return { layer, source, authority, mutability, status };
  };

  const filteredMemories = memories.filter((mem) => {
    if (hideFictional && isFictionalItem(mem)) return false;
    return true;
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAddMemory(content, layer, source);
    setContent('');
  };

  const handleProtectedDeleteSubmit = (id: string) => {
    if (!deleteReason.trim()) {
      setDeleteError('กรุณาระบุเหตุผลในการปลดล็อก/ลบ Protected Constraint ก่อนดำเนินการ');
      return;
    }
    console.log(`[Governance Audit] Protected Constraint ${id} deleted with reason:`, deleteReason);
    onDeleteMemory(id);
    setUnlockingConstraintId(null);
    setDeleteReason('');
    setDeleteError(null);
  };

  const runTests = () => {
    const results = runMemoryGovernanceTests();
    setTestResults(results);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-200 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Memory Bank & Context Store
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                {memories.length} Records
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              คลังความจำระยะยาวพร้อมระบบ Cognitive Memory Governance และ Auto Memory Candidate Queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAuditLogs(!showAuditLogs)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Audit Logs ({audits.length})</span>
          </button>
          <button
            onClick={runTests}
            className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-mono font-semibold border border-amber-500/40 flex items-center gap-1.5 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>รันชุดทดสอบ Governance (11 Tests)</span>
          </button>
        </div>
      </div>

      {/* Test Results Banner */}
      {testResults && (
        <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>ผลการทดสอบ Memory Governance (Automated Test Suite)</span>
            </h3>
            <button
              onClick={() => setTestResults(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕ ปิด
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {testResults.map((t, idx) => (
              <div key={idx} className={`p-2.5 rounded-xl border flex items-start gap-2 ${t.passed ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/20 border-rose-500/30 text-rose-300'}`}>
                {t.passed ? <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                <div>
                  <div className="font-bold">{t.name}</div>
                  <div className="text-[11px] text-slate-400">{t.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logs Drawer / Modal Panel */}
      {showAuditLogs && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Memory Governance Audit Trail Logs</span>
            </h3>
            <button onClick={() => setShowAuditLogs(false)} className="text-slate-400 hover:text-white text-xs">✕ ปิด</button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2 text-xs font-mono">
            {audits.length === 0 ? (
              <p className="text-slate-500 italic">ยังไม่มี Audit Log บันทึกในขณะนี้</p>
            ) : (
              audits.map((a) => (
                <div key={a.id} className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-amber-400 font-bold">{a.action}</span>
                    <span className="text-slate-500">{new Date(a.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">Reason: {a.reason}</p>
                  <div className="text-[10px] text-slate-500">Source: {a.source} | Actor: {a.actor}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* AUTO MEMORY CANDIDATE QUEUE */}
      {pendingCandidates.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>🧠 Memory Candidate Detected ({pendingCandidates.length} รายการรอการตรวจสอบ)</span>
            </h3>
            <span className="text-[11px] font-mono bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/40">
              Selective LTM Architecture (Detect ≠ Commit)
            </span>
          </div>
          <p className="text-xs text-amber-200/80">
            ระบบตรวจพบข้อมูลที่มีแนวโน้มเป็นความจำระยะยาวจากบทสนทนา กรุณาตรวจสอบ Source, Layer และ Authority ก่อนบันทึกลง Active Memory Store
          </p>

          <div className="space-y-3">
            {pendingCandidates.map((cand) => (
              <div key={cand.id} className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                      {cand.layer}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800">
                      {cand.layer} → {cand.source} → {cand.authority} → {cand.mutability} → PENDING
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                    Confidence: {Math.round(cand.confidence * 100)}%
                  </span>
                </div>

                <p className="text-slate-100 text-xs font-medium leading-relaxed">{cand.content}</p>

                <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 flex items-start gap-2">
                  <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-300">เหตุผลที่ระบบเสนอให้จำ (Evidence):</strong> {cand.evidence}
                  </div>
                </div>

                {cand.updateSuggested && (
                  <div className="p-2 rounded bg-rose-950/30 border border-rose-500/40 text-[11px] text-rose-300 flex items-center justify-between">
                    <span>⚠️ <strong>Existing Memory Match:</strong> พบข้อมูลความจำซ้ำหรือเกี่ยวเนื่องกับข้อมูลเดิมใน Active Memory Store</span>
                    <span className="font-mono text-[10px]">แนะนำให้อัปเดตความจำเดิมแทนการสร้างใหม่</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => onDismissCandidate && onDismissCandidate(cand.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dismiss (ละทิ้ง)</span>
                  </button>
                  <button
                    onClick={() => onApproveCandidate && onApproveCandidate(cand)}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{cand.updateSuggested ? 'Update Existing Memory' : 'Save to Memory (อนุมัติจำ)'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Memory Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-amber-400" />
          เพิ่มบันทึกความจำใหม่ด้วยตนเอง (Manual Context Record)
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              เนื้อหาความจำหรือข้อจำกัด (Memory Content)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="ระบุข้อเท็จจริง นโยบาย หรือข้อจำกัดที่ต้องการให้ FIRE KEEPER จดจำในการวิเคราะห์..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                ประเภท Layer (Layer Tag)
              </label>
              <select
                value={layer}
                onChange={(e) => setLayer(e.target.value as MemoryItem['layer'])}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
              >
                <option value="Context" className="bg-slate-950 text-slate-200">Context (บริบท / Active Session Goal)</option>
                <option value="Session State" className="bg-slate-950 text-slate-200">Session State (สถานะเซสชัน)</option>
                <option value="Fact" className="bg-slate-950 text-slate-200">Fact (ข้อเท็จจริงยืนยันแล้ว)</option>
                <option value="Constraint" className="bg-slate-950 text-slate-200">Constraint (ข้อจำกัด / นโยบายบังคับ)</option>
                <option value="Preference" className="bg-slate-950 text-slate-200">Preference (ความชอบของผู้ใช้)</option>
                <option value="System" className="bg-slate-950 text-slate-200">System (มาตรฐานระบบ)</option>
                <option value="Observation" className="bg-slate-950 text-slate-200">Observation (ข้อสังเกตเพิ่มเติม)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                แหล่งอ้างอิง (Source Attribution & Provenance)
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="เช่น User Statement, Enterprise Policy"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!content.trim() || isLoading}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>บันทึกลงคลังความจำ</span>
          </button>
        </form>
      </div>

      {/* Memory List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            รายการความจำในระบบ (Active Memory Store)
          </h3>
          <label className="flex items-center gap-2 text-xs text-amber-300 font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 cursor-pointer hover:border-amber-500/50">
            <input
              type="checkbox"
              checked={hideFictional}
              onChange={(e) => setHideFictional(e.target.checked)}
              className="accent-amber-500 rounded"
            />
            <span>ซ่อนตัวอย่างสมมติ (Hide Fictional Examples - ข้อมูลจริงยังคงอยู่)</span>
          </label>
        </div>

        <div className="space-y-3">
          {filteredMemories.map((mem) => {
            const isFictional = isFictionalItem(mem);
            const meta = getMetadata(mem);
            const isConstraint = meta.layer === 'Constraint';
            const isUnlocking = unlockingConstraintId === mem.id;

            return (
              <div
                key={mem.id}
                className={`p-4 rounded-xl border flex flex-col gap-3 text-xs ${
                  isFictional
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-950 border-slate-800/80'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        isConstraint
                          ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                          : meta.layer === 'System'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                          : meta.layer === 'Context' || meta.layer === 'Session State'
                          ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {meta.layer}
                    </span>

                    {/* Metadata Trace String: Layer → Source → Authority → Mutability → Status */}
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800">
                      {meta.layer} → {meta.source} → {meta.authority} → {meta.mutability} → {meta.status}
                    </span>

                    {isFictional && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1">
                        ⚠️ ตัวอย่างสมมติ (Fictional Example)
                      </span>
                    )}
                  </div>

                  {/* Actions / Delete or Protected */}
                  {mem.id && (
                    <div>
                      {isConstraint ? (
                        <button
                          onClick={() => {
                            setUnlockingConstraintId(isUnlocking ? null : mem.id!);
                            setDeleteReason('');
                            setDeleteError(null);
                          }}
                          className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                          title="ข้อจำกัดธรรมาภิบาลถูกปกป้อง (Protected Governance Constraint)"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>🔒 Protected</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onDeleteMemory(mem.id!)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                          title="ลบบันทึกความจำนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>ลบ</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-slate-200 text-xs leading-relaxed">{mem.content}</p>

                {isFictional && (
                  <p className="text-[10px] text-amber-400/80 italic font-mono bg-amber-950/30 p-2 rounded border border-amber-500/20">
                    * หมายเหตุการกำกับดูแล: ข้อมูลนี้เป็นกรณีศึกษาตัวอย่างสมมติ (Fictional Example) สำหรับการทดสอบอ้างอิงโครงสร้างเท่านั้น <strong>ห้ามนำไปใช้เป็น factual memory หรือคำนวณอ้างอิงใน production reasoning</strong>
                  </p>
                )}

                {/* Protected Constraint Unlocking & Reason Modal / Inline Form */}
                {isUnlocking && (
                  <div className="mt-2 p-3.5 rounded-xl bg-slate-900 border border-rose-500/40 space-y-3">
                    <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>ยืนยันการปลดล็อกและลบ Protected Governance Constraint</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      รายการนี้มีสถานะ <strong>Authority: System</strong> และ <strong>Mutability: Immutable</strong> การลบต้องผ่านกระบวนการตรวจสอบและต้องระบุเหตุผลเพื่อเก็บบันทึกการตรวจสอบย้อนกลับ (Audit Log) ห้ามลบโดยอุบัติเหตุ
                    </p>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        ระบุเหตุผลในการดำเนินการ (Mandatory Reason for Deletion):
                      </label>
                      <input
                        type="text"
                        value={deleteReason}
                        onChange={(e) => {
                          setDeleteReason(e.target.value);
                          if (deleteError) setDeleteError(null);
                        }}
                        placeholder="เช่น อัปเดตนโยบายความปลอดภัยตามมติคณะกรรมการ Q3/2026..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                      />
                      {deleteError && (
                        <p className="text-[10px] text-rose-400 mt-1 font-mono">{deleteError}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUnlockingConstraintId(null);
                          setDeleteReason('');
                          setDeleteError(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProtectedDeleteSubmit(mem.id!)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ยืนยันลบ Protected Constraint</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


