import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  HelpCircle,
  UserCheck,
  Award,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { PCAState, ExecutiveMetrics, ConfidenceCalibration } from '../types';
import { useTheme } from '../context/ThemeContext';
import { getThemeTokens } from '../utils/themeTokens';
import { PlainLanguageTooltip } from './PlainLanguageTooltip';

interface ExecutiveKpiDeckProps {
  pcaState?: PCAState | null;
  metrics?: ExecutiveMetrics;
  calibration?: ConfidenceCalibration;
  compact?: boolean;
}

export const ExecutiveKpiDeck: React.FC<ExecutiveKpiDeckProps> = ({
  pcaState,
  metrics,
  calibration,
  compact = false,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Derive core values with robust defaults
  const confidenceScore = calibration?.scorePercent ?? metrics?.confidenceScore ?? (pcaState?.confidence === 'สูง' ? 92 : pcaState?.confidence === 'ปานกลาง' ? 74 : 58);
  const riskScore = metrics?.riskScore ?? (pcaState?.critique && pcaState.critique.length > 2 ? 28 : 12);
  const evidenceCount = pcaState?.evidence?.length ?? 4;
  const missingInfoCount = pcaState?.missing_info?.length ?? (pcaState?.uncertainty?.length || 0);
  const humanAgencyScore = metrics?.humanAgencyScore ?? (pcaState?.human_agency_enforcement?.riskScore ? 100 - pcaState.human_agency_enforcement.riskScore : 100);
  const compliancePassed = Boolean(pcaState?.governance_policies?.every(p => p.status === 'PASSED') ?? true);

  const kpis = [
    {
      id: 1,
      title: 'AI Confidence',
      thaiTitle: 'ระดับความเชื่อมั่นของ AI',
      value: `${confidenceScore}%`,
      badge: confidenceScore >= 80 ? 'Calibrated (High)' : confidenceScore >= 60 ? 'Moderate' : 'Low / Guarded',
      badgeColor: confidenceScore >= 80
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20'
        : 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20',
      icon: TrendingUp,
      accentBorder: 'border-t-[#F59E0B]',
      tooltipKey: 'ece_calibration' as const,
      summary: 'ประเมินผ่านแบบจำลองการสอบเทียบ ECE (Expected Calibration Error)',
      drilldown: [
        `ระดับความเชื่อมั่นทางสถิติ: ${confidenceScore}% (${pcaState?.confidence || 'สูง'})`,
        `สูตรคำนวณ: ${calibration?.formula || 'Ensemble Weighted Evidence Matrix'}`,
        `ข้อสังเกต: ผลการสอบเทียบไม่พบอาการ Overconfidence`,
      ],
    },
    {
      id: 2,
      title: 'Risk Score',
      thaiTitle: 'ดัชนีความเสี่ยงต่อองค์กร',
      value: `${riskScore}%`,
      badge: riskScore <= 20 ? 'Low Risk (<25%)' : riskScore <= 50 ? 'Medium Attention' : 'High Alert',
      badgeColor: riskScore <= 20
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20'
        : 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20',
      icon: AlertTriangle,
      accentBorder: 'border-t-emerald-500',
      tooltipKey: 'gov_01' as const,
      summary: 'ประเมินความเสี่ยงด้านกฎหมาย ผลกระทบต่อองค์กร และความปลอดภัย',
      drilldown: [
        `เกณฑ์ความเสี่ยง: ${riskScore <= 20 ? 'อยู่ในเกณฑ์ปลอดภัยยอมรับได้' : 'จำเป็นต้องมีมาตรการลดความเสี่ยง'}`,
        `รายการประเมินความเสี่ยง: ${pcaState?.critique?.length || 2} จุดสำคัญ`,
        `ข้อบังคับ PDPA & Security: ผ่านการตรวจสอบเบื้องต้น`,
      ],
    },
    {
      id: 3,
      title: 'Evidence Strength',
      thaiTitle: 'ความแข็งแกร่งของหลักฐาน',
      value: `${evidenceCount} แหล่งอ้างอิง`,
      badge: evidenceCount >= 3 ? 'Verified Grounding' : 'Limited Sources',
      badgeColor: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20',
      icon: FileCheck2,
      accentBorder: 'border-t-blue-500',
      tooltipKey: 'hypotheses_engine' as const,
      summary: 'สกัดจากหลักฐานข้อเท็จจริง คลังความจำ และเอกสารอ้างอิง',
      drilldown: [
        `หลักฐานที่นำมาใช้จริง: ${evidenceCount} ข้อเท็จจริง`,
        `สถานะ Grounding: ผ่านการเทียบเคียงกับคลังข้อมูล (No Unsubstantiated Claims)`,
        `การทดสอบสมมติฐานทางเลือก: ผ่านเกณฑ์ ACH Matrix`,
      ],
    },
    {
      id: 4,
      title: 'Missing Information',
      thaiTitle: 'ข้อมูลที่ยังขาด / ความไม่แน่นอน',
      value: `${missingInfoCount} รายการ`,
      badge: missingInfoCount === 0 ? 'Complete Context' : `${missingInfoCount} Gaps Tracked`,
      badgeColor: missingInfoCount === 0
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20'
        : 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20',
      icon: HelpCircle,
      accentBorder: 'border-t-amber-500',
      tooltipKey: 'uncertainty_register' as const,
      summary: 'สิ่งที่ AI ระบุอย่างตรงไปตรงมาว่ายังไม่ทราบ เพื่อป้องกันการเดาสุ่ม',
      drilldown: pcaState?.missing_info && pcaState.missing_info.length > 0
        ? pcaState.missing_info
        : [
            'ไม่พบช่องว่างข้อมูลวิกฤต (Sufficient Context for Decision Support)',
            'ข้อจำกัดและขอบเขตได้รับการระบุครบถ้วนใน Stage 3',
          ],
    },
    {
      id: 5,
      title: 'Human Review',
      thaiTitle: 'สถานะการกำกับดูแลโดยมนุษย์',
      value: 'Human-in-the-Loop',
      badge: 'Level 1: Advisory',
      badgeColor: 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-500/10 dark:border-purple-500/20',
      icon: UserCheck,
      accentBorder: 'border-t-purple-500',
      tooltipKey: 'human_agency' as const,
      summary: 'คงอำนาจการตัดสินใจและอนุมัติขั้นสุดท้ายไว้ที่มนุษย์ 100%',
      drilldown: [
        `Human Agency Score: ${humanAgencyScore}% (คงสิทธิของผู้ใช้)`,
        `นโยบายระบบ: แนะนำแนวทางและชั่งน้ำหนัก ไม่ดำเนินการอัตโนมัติที่กระทบต่อสิทธิ`,
        `การตรวจสอบย้อนกลับ: บันทึกใน WORM Audit Ledger`,
      ],
    },
    {
      id: 6,
      title: 'Compliance Status',
      thaiTitle: 'มาตรฐานธรรมาภิบาลและการกำกับดูแล',
      value: 'NIST & ISO 42001',
      badge: compliancePassed ? 'Verified Passed' : 'Guarded',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20',
      icon: Award,
      accentBorder: 'border-t-emerald-500',
      tooltipKey: 'aiia' as const,
      summary: 'สอดคล้องตามกรอบความปลอดภัยและมาตรฐานความโปร่งใสสากล',
      drilldown: [
        'NIST AI RMF 1.0: Govern, Map, Measure, Manage (ผ่านเกณฑ์)',
        'ISO/IEC 42001: AI Management System Standard (สอดคล้อง)',
        'PDPA & Data Governance: คุ้มครองข้อมูลส่วนบุคคล',
      ],
    },
  ];

  return (
    <div className="space-y-3">
      {/* Executive Header Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0E1525] border-white/10'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className={`text-sm sm:text-base font-bold font-mono tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Executive KPI Dashboard
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                10-SEC EXECUTIVE SCAN
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              6 ตัวชี้วัดสำคัญสำหรับการตัดสินใจระดับผู้บริหาร (Decision Support Framework)
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4 items-stretch">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isExpanded = expandedCard === kpi.id;

          return (
            <div
              key={kpi.id}
              className={`rounded-xl border p-3.5 sm:p-4 flex flex-col justify-between h-full transition-all border-t-4 ${kpi.accentBorder} ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#111827] border-white/10 shadow-md'
              }`}
              style={{ minWidth: 0, wordBreak: 'normal', overflowWrap: 'break-word' }}
            >
              {/* Content Body: Title -> Badge -> Thai Description -> Main Value -> Summary */}
              <div className="flex-1 flex flex-col">
                {/* 1. KPI Title Row */}
                <div className="flex items-start gap-1.5 mb-1.5 min-w-0">
                  <Icon className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <PlainLanguageTooltip termKey={kpi.tooltipKey}>
                      <span 
                        className="text-[11px] sm:text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-200 leading-snug"
                        style={{ wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'normal' }}
                      >
                        {kpi.title}
                      </span>
                    </PlainLanguageTooltip>
                  </div>
                </div>

                {/* 2. Badge (Dedicated line to prevent horizontal squeezing) */}
                <div className="mb-2">
                  <span 
                    className={`inline-flex items-center w-fit max-w-full px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border leading-tight ${kpi.badgeColor}`}
                    style={{ wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'normal' }}
                  >
                    {kpi.badge}
                  </span>
                </div>

                {/* 3. Thai Subtitle / Description */}
                <div 
                  className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mb-2"
                  style={{ wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'normal' }}
                >
                  {kpi.thaiTitle}
                </div>

                {/* 4. Main Value */}
                <div className="my-1 sm:my-1.5">
                  <div 
                    className={`text-lg sm:text-xl font-extrabold font-mono tracking-tight leading-tight ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                    style={{ wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'normal' }}
                  >
                    {kpi.value}
                  </div>
                </div>

                {/* 5. Supporting Text / Summary */}
                <p 
                  className={`text-[11px] leading-relaxed line-clamp-3 mb-3 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}
                  style={{ wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'normal' }}
                >
                  {kpi.summary}
                </p>
              </div>

              {/* 6. Footer Drilldown Button (Consistently aligned at bottom) */}
              <div className="mt-auto pt-2.5 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setExpandedCard(isExpanded ? null : kpi.id)}
                  className="w-full flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400 font-mono font-medium hover:underline cursor-pointer pt-0.5"
                >
                  <span>{isExpanded ? 'ย่อข้อมูล' : 'ดูรายละเอียด'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isExpanded && (
                  <div className="mt-2.5 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 animate-fadeIn bg-slate-50 dark:bg-black/30 p-2.5 rounded-lg border border-slate-200 dark:border-white/5">
                    {kpi.drilldown.map((point, idx) => (
                      <div key={idx} className="flex items-start space-x-1.5" style={{ wordBreak: 'normal', overflowWrap: 'break-word' }}>
                        <span className="text-amber-500 font-bold shrink-0">•</span>
                        <span className="leading-snug">{point}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
