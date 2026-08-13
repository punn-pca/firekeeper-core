import React, { useState, FormEvent } from 'react';
import { Database, Plus, Trash2, Shield, Layers, HelpCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { MemoryItem } from '../types';

interface MemoryManagerProps {
  memories: MemoryItem[];
  onAddMemory: (content: string, layer: MemoryItem['layer'], source: string) => void;
  onDeleteMemory: (id: string) => void;
  isLoading: boolean;
}

export const MemoryManager: React.FC<MemoryManagerProps> = ({
  memories,
  onAddMemory,
  onDeleteMemory,
  isLoading,
}) => {
  const [content, setContent] = useState('');
  const [layer, setLayer] = useState<MemoryItem['layer']>('Fact');
  const [source, setSource] = useState('User Override');
  const [hideFictional, setHideFictional] = useState(false);

  const isFictionalItem = (mem: MemoryItem) => {
    const text = (mem.content + ' ' + mem.source + ' ' + (mem.provenanceId || '')).toLowerCase();
    return text.includes('fictional') || text.includes('สมมติ') || text.includes('baseline');
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-200">
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
              คลังความจำระยะยาวสำหรับจัดเก็บบริบท ข้อจำกัด และมาตรฐานการตอบตามกรอบ PUNN Cognitive Architecture
            </p>
          </div>
        </div>
      </div>

      {/* Add New Memory Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-amber-400" />
          เพิ่มบันทึกความจำใหม่ (Add Context Record)
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
                <option value="Fact">Fact (ข้อเท็จจริงยืนยันแล้ว)</option>
                <option value="Constraint">Constraint (ข้อจำกัด / นโยบายบังคับ)</option>
                <option value="Preference">Preference (ความชอบของผู้ใช้)</option>
                <option value="System">System (มาตรฐานระบบ)</option>
                <option value="Observation">Observation (ข้อสังเกตเพิ่มเติม)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                แหล่งอ้างอิง (Source Attribution)
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="เช่น User Override, Enterprise Policy"
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
            <span>ซ่อนตัวอย่างสมมติ (Hide Fictional Examples)</span>
          </label>
        </div>

        <div className="space-y-2.5">
          {filteredMemories.map((mem) => {
            const isFictional = isFictionalItem(mem);
            return (
              <div
                key={mem.id}
                className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                  isFictional
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-950 border-slate-800/80'
                }`}
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        mem.layer === 'Constraint'
                          ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                          : mem.layer === 'System'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {mem.layer}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Source: {mem.source}
                    </span>
                    {isFictional && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1">
                        ⚠️ ตัวอย่างสมมติ (Fictional Example)
                      </span>
                    )}
                  </div>
                  <p className="text-slate-200">{mem.content}</p>
                  {isFictional && (
                    <p className="text-[10px] text-amber-400/80 italic font-mono">
                      * หมายเหตุ: ข้อมูลนี้เป็นกรณีศึกษาตัวอย่างสมมติเพื่อการทดสอบอ้างอิงโครงสร้าง ไม่ใช่ข้อมูลจริงของการดำเนินงาน
                    </p>
                  )}
                </div>

                {mem.id && (
                  <button
                    onClick={() => onDeleteMemory(mem.id!)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm shrink-0"
                    title="ลบบันทึกความจำนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>ลบ</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
