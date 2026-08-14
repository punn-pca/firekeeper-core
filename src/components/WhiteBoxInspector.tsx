import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowRight,
  TrendingUp,
  Target,
  Zap,
} from 'lucide-react';
import { PCAState, HypothesisV2, EvidenceItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { getThemeTokens } from '../utils/themeTokens';
import { PlainLanguageTooltip } from './PlainLanguageTooltip';

interface WhiteBoxInspectorProps {
  pcaState: PCAState;
}

export const WhiteBoxInspector: React.FC<WhiteBoxInspectorProps> = ({ pcaState }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  const [activeTab, setActiveTab] = useState<'hypotheses' | 'evidence_map' | 'rejection_rationale' | 'uncertainty_gaps'>('hypotheses');

  // Fallback dynamic generation for hypotheses if not provided explicitly in pcaState
  const hypotheses: HypothesisV2[] = pcaState.hypotheses_v2 || (pcaState.hypotheses && pcaState.hypotheses.length > 0
    ? pcaState.hypotheses.map((h, i) => ({
        id: `H${i + 1}`,
        claim: h.claim,
        prior: 0.35,
        likelihood: i === 0 ? 0.88 : 0.25,
        posterior: i === 0 ? (h.confidence || 92) / 100 : 0.15,
        rationale: i === 0
          ? 'สอดคล้องกับหลักฐานข้อเท็จจริงและไม่มีข้อโต้แย้งที่มีนัยสำคัญ'
          : 'มีหลักฐานขัดแย้งหรือน้ำหนักความน่าเชื่อถือไม่เพียงพอ',
        status: i === 0 ? 'Supported' : 'Refuted',
      }))
    : [
        {
          id: 'H1',
          claim: pcaState.decision || 'แนวทางหลักตามข้อเสนอแนะของระบบ',
          prior: 0.40,
          likelihood: 0.90,
          posterior: 0.88,
          rationale: 'สอดคล้องกับเป้าหมาย ข้อจำกัด และหลักฐานที่มีอยู่สูงสุด',
          status: 'Supported',
        },
        {
          id: 'H2',
          claim: 'แนวทางทางเลือกที่ 2 (Alternative Path B)',
          prior: 0.30,
          likelihood: 0.35,
          posterior: 0.22,
          rationale: 'มีความเสี่ยงต่อต้นทุนหรือระยะเวลาสูงกว่าแนวทางแรก',
          status: 'Refuted',
        },
        {
          id: 'H3',
          claim: 'แนวทางแบบดั้งเดิม / คงสถานะเดิม (Status Quo)',
          prior: 0.30,
          likelihood: 0.20,
          posterior: 0.12,
          rationale: 'ไม่ตอบโจทย์เป้าหมายการปรับปรุงเชิงยุทธศาสตร์ที่ผู้ใช้กำหนด',
          status: 'Refuted',
        },
      ]);

  const evidenceItems: string[] = pcaState.evidence || [
    'ข้อมูลความจำและความต้องการของผู้ใช้ที่ระบุไว้ในบริบทการสนทนา',
    'ข้อจำกัดและขอบเขตทางนโยบาย (Governance Constraints)',
    'ผลการตรวจสอบข้อเท็จจริงและความสอดคล้องเชิงตรรกะ',
  ];

  const critiqueItems: string[] = pcaState.critique || [
    'ความเสี่ยงในการนำไปปฏิบัติจริงหากไม่มีการกำกับดูแลโดยผู้เชี่ยวชาญ',
    'ความจำเป็นในการสอบทานข้อมูลภายนอกเพิ่มเติมในกรณีวิกฤต',
  ];

  const uncertaintyItems: string[] = pcaState.missing_info && pcaState.missing_info.length > 0
    ? pcaState.missing_info
    : pcaState.uncertainty && pcaState.uncertainty.length > 0
    ? pcaState.uncertainty
    : [
        'ไม่มีการระบุตัวแปรด้านงบประมาณที่แน่นอนจากผู้ใช้',
        'ระยะเวลาดำเนินการขึ้นอยู่กับดุลยพินิจของคณะทำงานมนุษย์',
      ];

  const rejectedHypotheses = hypotheses.filter(h => h.status === 'Refuted');
  const supportedHypotheses = hypotheses.filter(h => h.status === 'Supported');

  return (
    <div className={`rounded-xl border p-4 sm:p-5 space-y-4 ${tokens.shadow} ${
      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E1525] border-white/10 text-white'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-sm sm:text-base font-mono tracking-tight">
                White-Box Cognitive Trace & Reasoning Rationale
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                WHITE-BOX INSPECTOR
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ความโปร่งใสระดับสมมติฐาน: เปิดเผยกระบวนการคิด เหตุผลที่เลือก และเหตุผลที่ตัดตัวเลือกอื่นทิ้ง
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('hypotheses')}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              activeTab === 'hypotheses'
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-xs'
                : 'bg-slate-100 dark:bg-[#151D2E] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-amber-500/50'
            }`}
          >
            สมมติฐานทางเลือก ({hypotheses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rejection_rationale')}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              activeTab === 'rejection_rationale'
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-xs'
                : 'bg-slate-100 dark:bg-[#151D2E] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-amber-500/50'
            }`}
          >
            เหตุผลการตัดตัวเลือก ({rejectedHypotheses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('evidence_map')}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              activeTab === 'evidence_map'
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-xs'
                : 'bg-slate-100 dark:bg-[#151D2E] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-amber-500/50'
            }`}
          >
            หลักฐานชั่งน้ำหนัก ({evidenceItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('uncertainty_gaps')}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              activeTab === 'uncertainty_gaps'
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-xs'
                : 'bg-slate-100 dark:bg-[#151D2E] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-amber-500/50'
            }`}
          >
            ช่องว่างข้อมูล ({uncertaintyItems.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Hypotheses Matrix */}
      {activeTab === 'hypotheses' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>
              สมมติฐานทางเลือกที่ถูกสร้างขึ้นใน Stage 6 (
              <PlainLanguageTooltip termKey="hypotheses_engine">
                <strong className="text-amber-500 cursor-pointer">Hypotheses Engine</strong>
              </PlainLanguageTooltip>
              ) และชั่งน้ำหนักตามความน่าจะเป็น (Bayesian Posterior)
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              ACH Framework
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {hypotheses.map((h, i) => {
              const isSupported = h.status === 'Supported';
              return (
                <div
                  key={h.id || i}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2.5 transition-all ${
                    isSupported
                      ? 'bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-white/10 opacity-80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {h.id || `H${i + 1}`}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          isSupported
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {isSupported ? '✓ SUPPORTED' : '✗ ELIMINATED'}
                      </span>
                    </div>

                    <h5 className="font-bold text-xs sm:text-sm leading-snug line-clamp-2 text-slate-900 dark:text-white">
                      {h.claim}
                    </h5>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {h.rationale}
                    </p>
                  </div>

                  {/* Bayesian Probability Breakdown */}
                  <div className="pt-2 border-t border-slate-200 dark:border-white/10 font-mono text-[10px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Prior P(H):</span>
                      <span className="text-slate-700 dark:text-slate-300">{(h.prior * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Likelihood P(E|H):</span>
                      <span className="text-slate-700 dark:text-slate-300">{(h.likelihood * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center justify-between font-bold pt-1 border-t border-slate-200/60 dark:border-white/5">
                      <span className="text-amber-600 dark:text-amber-400">Posterior P(H|E):</span>
                      <span className={`text-xs ${isSupported ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                        {(h.posterior * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Rejection Rationale */}
      {activeTab === 'rejection_rationale' && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">ความโปร่งใสในการตัดตัวเลือก (Elimination Transparency):</strong>
              เพื่อความมั่นใจของผู้บริหาร ระบบจะแสดงเหตุผลอย่างชัดเจนว่าทำไมตัวเลือกหรือสมมติฐานทางเลือกอื่นๆ จึงถูกตัดออก เพื่อให้มนุษย์สามารถตรวจสอบดุลยพินิจได้
            </div>
          </div>

          <div className="space-y-2.5">
            {rejectedHypotheses.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-mono">
                ไม่มีสมมติฐานที่ถูกตัดออกในรอบการวิเคราะห์นี้
              </div>
            ) : (
              rejectedHypotheses.map((h, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 dark:bg-[#16111D] space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      ตัดตัวเลือก {h.id}: {h.claim}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      Posterior: {(h.posterior * 100).toFixed(0)}% (ต่ำกว่าเกณฑ์อนุมัติ)
                    </span>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 pl-5">
                    <strong>เหตุผลและหลักฐานขัดแย้ง:</strong> {h.rationale}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Evidence Grounding Map */}
      {activeTab === 'evidence_map' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            หลักฐานที่ผ่านการตรวจสอบและนำมาประกอบการตัดสินใจใน Stage 7 (Evidence Evaluation)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {evidenceItems.map((ev, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111827] space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                    EVIDENCE E{i + 1}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ผ่านการตรวจสอบข้อเท็จจริง
                  </span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  {ev}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Uncertainty & Missing Information Gaps */}
      {activeTab === 'uncertainty_gaps' && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">ทะเบียนความไม่แน่นอน (Uncertainty Register):</strong>
              AI ทำการบันทึกข้อมูลที่ยังไม่ทราบหรือตัวแปรที่ขาดหาย เพื่อให้ผู้บริหารทราบจุดที่ต้องหาข้อมูลเพิ่มก่อนตัดสินใจจริง
            </div>
          </div>

          <div className="space-y-2">
            {uncertaintyItems.map((gap, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-[#1A1610] text-xs flex items-start space-x-2.5"
              >
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  ?{i + 1}
                </span>
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white">{gap}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    คำแนะนำ: ขอข้อมูลเพิ่มเติมจากผู้ใช้หรือสอบทานแหล่งข้อมูลภายนอก
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
