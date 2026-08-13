import React from 'react';
import { RotateCcw, AlertTriangle, Eye, Sparkles, CheckCircle2 } from 'lucide-react';
import { MetaCognitionThought, ReflectionEvaluation } from '../types';

interface MetaCognitionViewerProps {
  metaCognition?: MetaCognitionThought;
  reflectionLoop?: ReflectionEvaluation;
  critiqueList?: string[];
}

export const MetaCognitionViewer: React.FC<MetaCognitionViewerProps> = ({
  metaCognition,
  reflectionLoop,
  critiqueList = [],
}) => {
  const defaultMeta: MetaCognitionThought = {
    selfDoubtQuestion: 'มีสมมติฐานหรือมุมมองด้านนโยบายใดที่ยังไม่ได้นำมาพิจารณาหรือไม่?',
    potentialFlaw: 'การประเมินอาจอิงตามบริบทหลักโดยยังไม่ได้ทดสอบแรงต้านเชิงปฏิบัติจากผู้มีส่วนได้ส่วนเสีย',
    mitigationCorrection: 'เพิ่มการประเมิน Trade-off และกำหนดกรอบความปลอดภัย Human Agency Protocol ใน Stage 12',
    isCorrecting: true,
    confidenceDelta: -0.05,
  };

  const activeMeta = metaCognition || defaultMeta;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/30 flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-rose-300 flex items-center gap-2">
              Meta-Cognition, Self-Critique & Blind Spot Inspector
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40">
                {activeMeta.isCorrecting ? 'SELF-CORRECTING ACTIVE' : 'NO REVISION NEEDED'}
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              ระบบวิพากษ์ตนเอง ค้นหาจุดบอด (Blind Spots) อคติที่อาจเกิดขึ้น และเหตุผลในการแก้ไขตรรกะ
            </p>
          </div>
        </div>
      </div>

      {/* Meta-Cognition Thought Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Self Doubt Question */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2">
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            1. คำถามวิพากษ์ตนเอง (Self-Doubt Question)
          </span>
          <p className="text-xs text-slate-200 font-medium leading-relaxed">
            "{activeMeta.selfDoubtQuestion}"
          </p>
        </div>

        {/* 2. Potential Flaw / Blind Spot */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/30 space-y-2">
          <span className="text-[10px] font-mono font-bold text-rose-400 uppercase flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-rose-400" />
            2. จุดบอด / อคติที่ตรวจพบ (Blind Spot & Bias Risk)
          </span>
          <p className="text-xs text-slate-200 leading-relaxed">
            {activeMeta.potentialFlaw}
          </p>
        </div>

        {/* 3. Mitigation & Correction */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            3. การแก้ไขปรับปรุง (Mitigation & Revision)
          </span>
          <p className="text-xs text-slate-200 leading-relaxed">
            {activeMeta.mitigationCorrection}
          </p>
          <div className="pt-1 font-mono text-[10px] text-slate-400">
            Confidence Shift: <span className="text-amber-400 font-bold">{(activeMeta.confidenceDelta * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Reflection Loop Evaluation Details */}
      {reflectionLoop && (
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            การประเมิน Reflection Loop (Hallucination Risk, Fact Check, Agency)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono">
            <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400">Hallucination Risk:</span>
              <span className="font-bold text-emerald-400">{reflectionLoop.hallucinationRisk}</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400">Fact Check Passed:</span>
              <span className="font-bold text-sky-400">{reflectionLoop.factCheckPassed ? 'PASSED' : 'FAILED'}</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400">Tone Alignment:</span>
              <span className="font-bold text-emerald-400">{reflectionLoop.toneAlignment}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Critique Checklist */}
      {critiqueList.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <span className="font-bold text-slate-300 text-xs block">
            ข้อสังเกตและข้อวิพากษ์เพิ่มเติมจากระบบ ({critiqueList.length} รายการ)
          </span>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
            {critiqueList.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                <span className="text-slate-200">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
