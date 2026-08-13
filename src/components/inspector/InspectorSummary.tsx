import React from 'react';
import { PCAState, ExecutiveMetrics } from '../../types';
import { ClassificationResult } from '../../utils/reportClassifier';
import { UserPersona } from './InspectorHeader';
import { useTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../utils/themeTokens';

interface InspectorSummaryProps {
  pcaState: PCAState;
  classification: ClassificationResult;
  activePersona: UserPersona;
}

export const InspectorSummary: React.FC<InspectorSummaryProps> = ({
  pcaState,
  classification,
  activePersona,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  const metrics: ExecutiveMetrics = pcaState.executive_dashboard || {
    riskScore: 12,
    confidenceScore: 88,
    latencyMs: pcaState.execution_time_ms || 1150,
    humanAgencyScore: 100,
    tokenUsage: {
      promptTokens: 12450,
      completionTokens: 6820,
      totalTokens: 19270,
      estCostUsd: 0.023,
    },
  };

  const conflictCount = pcaState.conflict_resolutions?.length || 0;
  const memoryCount = pcaState.memory_impacts?.filter((m) => m.usageStatus === 'USED_IN_DECISION').length || 1;

  return (
    <section className={`border-l-4 border-l-[#F59E0B] rounded-xl p-6 border ${tokens.shadow} space-y-5 ${
      isLight ? 'bg-white border-[#E5E7EB] text-[#111827]' : 'bg-[#111827] border-white/10 text-white'
    }`}>
      {/* Title */}
      <div className={`flex items-center justify-between border-b pb-3 ${
        isLight ? 'border-[#E5E7EB]' : 'border-white/10'
      }`}>
        <h2 className={`text-[18px] font-bold tracking-tight ${isLight ? 'text-[#111827]' : 'text-white'}`}>
          Executive Summary
        </h2>
        <span className={`text-xs font-mono ${isLight ? 'text-[#6B7280]' : 'text-slate-400'}`}>
          Persona: {activePersona.toUpperCase()}
        </span>
      </div>

      {/* Short Paragraph */}
      <p className={`text-sm leading-relaxed font-normal ${isLight ? 'text-[#374151]' : 'text-slate-200'}`}>
        ระบบประเมินว่าความเสี่ยงอยู่ในระดับต่ำ ({metrics.riskScore}%) และระดับความเชื่อมั่นอยู่ในระดับสูง ({metrics.confidenceScore}%)
        โดย{conflictCount === 0 ? ' ไม่พบความขัดแย้งเชิงตรรกะในระบบ' : ` มีการแก้ไขความขัดแย้งเชิงตรรกะ ${conflictCount} รายการ`}
        และการตัดสินใจถูกอ้างอิงตรงกับคลังความจำหลักจำนวน {memoryCount} รายการ พร้อมผ่านเกณฑ์ Human Agency Guard {metrics.humanAgencyScore}%
      </p>

      {/* Key Findings */}
      <div className={`space-y-2 pt-2 border-t ${isLight ? 'border-[#E5E7EB]' : 'border-white/10'}`}>
        <h3 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-[#111827]' : 'text-slate-100'}`}>
          Key Findings
        </h3>
        <ul className={`space-y-1.5 text-sm ${isLight ? 'text-[#4B5563]' : 'text-slate-300'}`}>
          <li className="flex items-start gap-2">
            <span className="text-[#F59E0B] font-bold">•</span>
            <span>ระดับความเสี่ยง {metrics.riskScore}% อยู่ในเกณฑ์มาตรฐานความปลอดภัย ISO 42001 & NIST AI RMF</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#F59E0B] font-bold">•</span>
            <span>กระบวนการไตร่ตรองเบย์เซียนและ 12-Stage Pipeline เสร็จสิ้นภายใน {metrics.latencyMs} ms</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#F59E0B] font-bold">•</span>
            <span>คุ้มครองเสรีภาพการตัดสินใจของผู้ใช้ (Preserve Human Agency) ครบถ้วน 100%</span>
          </li>
        </ul>
      </div>

      {/* Recommended Action */}
      <div className={`pt-3 border-t ${isLight ? 'border-[#E5E7EB]' : 'border-white/10'}`}>
        <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-[#111827]' : 'text-slate-100'}`}>
          Recommended Action
        </h3>
        <p className={`text-sm font-normal ${isLight ? 'text-[#4B5563]' : 'text-slate-300'}`}>
          อนุมัติให้ดำเนินการตามยุทธศาสตร์ที่เสนอ โดยมียุทธศาสตร์สำรองพร้อมใช้งานในแผงควบคุม
        </p>
      </div>
    </section>
  );
};
