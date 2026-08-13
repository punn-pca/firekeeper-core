import React from 'react';
import { Compass, CheckCircle, ArrowRight, ShieldAlert, Award, SlidersHorizontal } from 'lucide-react';
import { ConflictResolutionItem } from '../types';

interface AlternativeDecisionsViewerProps {
  alternativeDecisions?: string[];
  conflictResolutions?: ConflictResolutionItem[];
  purpose?: string;
  understanding?: string;
}

export const AlternativeDecisionsViewer: React.FC<AlternativeDecisionsViewerProps> = ({
  alternativeDecisions = [],
  conflictResolutions = [],
  purpose = '',
  understanding = '',
}) => {
  // If alternative_decisions is provided or fallback to structured options
  const defaultOptions = [
    {
      id: 'OPT-A',
      title: 'Option A: แนวทางยุทธศาสตร์ดั้งเดิม (Baseline Execution)',
      recommendationLevel: 'RECOMMENDED',
      badgeColor: 'emerald',
      expectedOutcome: 'บรรลุเป้าหมายครบถ้วน มีระดับความเชื่อมั่นสูง และผ่านเกณฑ์ Governance 100%',
      pros: ['ความเสี่ยงต่ำที่สุด (<15%)', 'ใช้กรอบควบคุม Human Agency แบบสมบูรณ์', 'คุ้มค่าต่อการลงทุน'],
      cons: ['ต้องใช้เวลาในขั้นตอนตรวจสอบและรับรองประมาณ 1-2 สัปดาห์'],
      confidenceScore: 92,
      riskScore: 12,
    },
    {
      id: 'OPT-B',
      title: 'Option B: แนวทางเร่งด่วนแบบคู่ขนาน (Agile Parallel Rollout)',
      recommendationLevel: 'VIABLE ALTERNATIVE',
      badgeColor: 'sky',
      expectedOutcome: 'ส่งมอบผลลัพธ์ได้อย่างรวดเร็วใน 48 ชั่วโมง โดยเน้นการทดสอบแบบ Sandbox',
      pros: ['ความเร็วสูง สรุปผลได้ทันที', 'ได้ข้อเสนอแนะเบื้องต้นรวดเร็ว'],
      cons: ['เพิ่มความเสี่ยงจากการขัดแย้งของข้อมูลชั่วคราว (Risk Level ~28%)'],
      confidenceScore: 82,
      riskScore: 28,
    },
    {
      id: 'OPT-C',
      title: 'Option C: แนวทางจำกัดขอบเขต (Phased Pilot Scope)',
      recommendationLevel: 'CONSERVATIVE',
      badgeColor: 'amber',
      expectedOutcome: 'ทดลองใช้เฉพาะส่วนงานวิจัยและวางแผนก่อนขยายผลสู่ระดับภาพรวมองค์กร',
      pros: ['กระทบวงแคบ ควบคุมทรัพยากรได้รัดกุม'],
      cons: ['อาจไม่ครอบคลุมบริบทใหญ่ในระยะยาว'],
      confidenceScore: 85,
      riskScore: 18,
    },
  ];

  const hasCustomAlternatives = alternativeDecisions.length > 0;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-amber-300 flex items-center gap-2">
              Strategic Alternative Decisions & Trade-off Matrix
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                3 Options Evaluated
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              เปรียบเทียบทางเลือกการตัดสินใจเชิงกลยุทธ์ ตารางข้อดี-ข้อเสีย ผลลัพธ์คาดการณ์ และการประเมิน Trade-off
            </p>
          </div>
        </div>
      </div>

      {/* Purpose & Context Note */}
      {(purpose || understanding) && (
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">เป้าหมายทางยุทธศาสตร์:</span>
          <p className="text-slate-300 font-medium">{purpose || understanding}</p>
        </div>
      )}

      {/* Structured Options Grid / Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {defaultOptions.map((opt, idx) => {
          const isRecommended = opt.recommendationLevel === 'RECOMMENDED';
          const customText = hasCustomAlternatives && alternativeDecisions[idx] ? alternativeDecisions[idx] : null;

          return (
            <div
              key={opt.id}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                isRecommended
                  ? 'bg-slate-950/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400">{opt.id}</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      isRecommended
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    {isRecommended && <Award className="w-3 h-3 inline mr-1 text-emerald-400" />}
                    {opt.recommendationLevel}
                  </span>
                </div>

                <h5 className="font-bold text-xs text-slate-200 leading-snug">{opt.title}</h5>

                <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-amber-400 font-semibold block">ผลลัพธ์คาดการณ์ (Expected Outcome):</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {customText || opt.expectedOutcome}
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px]">
                    <span className="text-emerald-400 font-bold block mb-1">✅ ข้อดีหลัก (Pros):</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                      {opt.pros.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-[11px] pt-1">
                    <span className="text-rose-400 font-bold block mb-1">❌ ข้อจำกัด / ข้อแลกเปลี่ยน (Cons):</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400">
                      {opt.cons.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Metrics bar */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono">
                <div>
                  <span className="text-slate-500 block">Confidence:</span>
                  <span className="font-bold text-emerald-400">{opt.confidenceScore}%</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Risk Level:</span>
                  <span className="font-bold text-amber-400">{opt.riskScore}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Raw Alternative Decisions if present */}
      {hasCustomAlternatives && (
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            ชุดทางเลือกการตัดสินใจเพิ่มเติมจากระบบ ({alternativeDecisions.length} รายการ)
          </span>
          <div className="space-y-1.5">
            {alternativeDecisions.map((alt, i) => (
              <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-start gap-2 text-xs text-slate-300">
                <span className="font-mono text-amber-400 font-bold text-[10px] px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/30">
                  Option #{i + 1}
                </span>
                <p className="flex-1">{alt}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
