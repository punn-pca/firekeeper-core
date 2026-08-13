import React from 'react';
import { RotateCcw, ShieldCheck, CheckCircle2, AlertTriangle, HelpCircle, Sparkles } from 'lucide-react';
import { ReflectionEvaluation, MetaCognitionThought } from '../types';

interface ReflectionLoopViewerProps {
  reflection?: ReflectionEvaluation;
  metaCognition?: MetaCognitionThought;
}

export const ReflectionLoopViewer: React.FC<ReflectionLoopViewerProps> = ({ reflection, metaCognition }) => {
  if (!reflection) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
        ไม่มีข้อมูล Reflection Loop สำหรับคำตอบนี้
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex items-center space-x-3 bg-slate-900/90 p-4 rounded-xl border border-rose-500/30">
        <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400">
          <RotateCcw className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            🔁 PCA v2.0 Reflection Loop & Meta-Cognition Engine
          </h4>
          <p className="text-xs text-slate-400">
            การประเมินคุณภาพคำตอบ ระบบตระหนักรู้ตนเอง (Meta-Cognition) และการแก้ไขจุดบอดก่อนส่งออก
          </p>
        </div>
      </div>

      {/* Meta-Cognition Consciousness Box */}
      {metaCognition && (
        <div className="bg-purple-950/40 border border-purple-500/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-purple-300 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              🧠 Meta-Cognition Engine ("ฉันกำลังคิดผิดหรือไม่?")
            </h5>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/40">
              Active Self-Awareness
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-slate-950/80 p-3 rounded-lg border border-purple-900/60">
              <span className="text-purple-400 font-semibold block mb-1">❓ คำถามตั้งข้อสงสัยในตนเอง (Self-Doubt Inquiry):</span>
              <p className="text-slate-200 italic font-medium">"{metaCognition.selfDoubtQuestion}"</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <span className="text-amber-400 font-semibold block mb-1">⚠️ จุดบอด/ความเสี่ยงที่ตรวจพบ:</span>
                <p className="text-slate-300">{metaCognition.potentialFlaw}</p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <span className="text-emerald-400 font-semibold block mb-1">🛠️ กลยุทธ์แก้ไข (Self-Correction Strategy):</span>
                <p className="text-slate-300">{metaCognition.mitigationCorrection}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid Status Checks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Hallucination Risk */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <span className="text-slate-400 text-xs block font-semibold">ความเสี่ยงภาพหลอน</span>
          <div className="flex items-center space-x-2">
            <span
              className={`text-lg font-bold font-mono px-2 py-0.5 rounded border ${
                reflection.hallucinationRisk === 'Low'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {reflection.hallucinationRisk} Risk
            </span>
          </div>
          <p className="text-[11px] text-slate-500">ผ่านการกรองเทียบกับหลักฐาน</p>
        </div>

        {/* Fact Check Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <span className="text-slate-400 text-xs block font-semibold">การตรวจสอบข้อเท็จจริง</span>
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <CheckCircle2 className="w-5 h-5" />
            <span>{reflection.factCheckPassed ? 'ผ่านเกณฑ์ (Passed)' : 'มีข้อโต้แย้ง'}</span>
          </div>
          <p className="text-[11px] text-slate-500">จำแนก Fact/Inference ชัดเจน</p>
        </div>

        {/* Human Agency Preservation */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <span className="text-slate-400 text-xs block font-semibold">การคุ้มครองเสรีภาพมนุษย์</span>
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <ShieldCheck className="w-5 h-5" />
            <span>{reflection.agencyPreserved ? 'Guaranteed' : 'Warning'}</span>
          </div>
          <p className="text-[11px] text-slate-500">ไม่ตัดสินใจเด็ดขาดแทนผู้ใช้</p>
        </div>

        {/* Tone Alignment */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <span className="text-slate-400 text-xs block font-semibold">การรักษา Tone & Persona</span>
          <div className="text-lg font-bold font-mono text-sky-400">
            {reflection.toneAlignment}%
          </div>
          <p className="text-[11px] text-slate-500">สอดคล้องกับสไตล์การสื่อสาร</p>
        </div>
      </div>

      {/* Self-Correction Log */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
        <h5 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          รายการการตรวจสอบตนเองก่อนส่งออก (Self-Correction Checklist)
        </h5>
        <div className="space-y-2">
          {reflection.selfCorrectionNotes.map((note, idx) => (
            <div
              key={idx}
              className="flex items-start space-x-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-200"
            >
              <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 font-mono text-[10px] font-bold">
                ✓
              </span>
              <span>{note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
