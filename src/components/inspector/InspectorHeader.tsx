import React from 'react';
import { Sparkles, Sliders } from 'lucide-react';
import { ReportPerspective } from '../../utils/reportClassifier';
import { useTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../utils/themeTokens';

export type UserPersona = 'ceo' | 'analyst' | 'auditor' | 'developer';

interface InspectorHeaderProps {
  title: string;
  subtitle: string;
  confidenceScore: number;
  confidenceLabel: string;
  executionTimeMs?: number;
  activePersona: UserPersona;
  onSelectPersona: (persona: UserPersona) => void;
  activePerspective: ReportPerspective;
  onSelectPerspective: (perspective: ReportPerspective) => void;
  activeWidgetCount: number;
  showCustomizer: boolean;
  onToggleCustomizer: () => void;
}

export const InspectorHeader: React.FC<InspectorHeaderProps> = ({
  title,
  subtitle,
  confidenceScore,
  confidenceLabel,
  executionTimeMs = 1150,
  activePersona,
  onSelectPersona,
  activePerspective,
  onSelectPerspective,
  activeWidgetCount,
  showCustomizer,
  onToggleCustomizer,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  const personas: { id: UserPersona; label: string }[] = [
    { id: 'ceo', label: 'CEO View' },
    { id: 'analyst', label: 'Analyst' },
    { id: 'auditor', label: 'Auditor' },
    { id: 'developer', label: 'Developer' },
  ];

  return (
    <header className={`sticky top-0 z-20 backdrop-blur-md border-b px-6 py-3.5 flex items-center justify-between flex-wrap gap-4 font-sans ${tokens.shadow} ${
      isLight ? 'bg-white/95 border-[#E5E7EB]' : 'bg-[#0B1220]/95 border-white/10'
    }`}>
      {/* Title & Identity */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-lg font-bold tracking-tight leading-tight ${isLight ? 'text-[#111827]' : 'text-white'}`}>
              PCA Dynamic Decision Inspector
            </h1>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border flex items-center gap-1 ${
              isLight
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ● Healthy
            </span>
          </div>
          <p className={`text-xs font-normal ${isLight ? 'text-[#6B7280]' : 'text-slate-400'}`}>
            Enterprise AI Governance & Strategic Decision Engine
          </p>
        </div>
      </div>

      {/* Center/Right Metrics & Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Quick Stats Pill */}
        <div className={`hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl border text-xs font-mono ${
          isLight ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280]' : 'bg-[#111827] border-white/10 text-slate-300'
        }`}>
          <div>
            <span className={isLight ? 'text-[#6B7280]' : 'text-slate-400'}>Latency: </span>
            <span className={`font-bold ${isLight ? 'text-[#111827]' : 'text-white'}`}>{executionTimeMs} ms</span>
          </div>
          <span className={isLight ? 'text-[#E5E7EB]' : 'text-slate-700'}>|</span>
          <div>
            <span className={isLight ? 'text-[#6B7280]' : 'text-slate-400'}>Tokens: </span>
            <span className={`font-bold ${isLight ? 'text-[#111827]' : 'text-white'}`}>19.2k</span>
          </div>
          <span className={isLight ? 'text-[#E5E7EB]' : 'text-slate-700'}>|</span>
          <div>
            <span className={isLight ? 'text-[#6B7280]' : 'text-slate-400'}>Confidence: </span>
            <span className="text-[#F59E0B] font-bold">{confidenceScore}%</span>
          </div>
        </div>

        {/* Data View Perspective Dropdown */}
        <div className="flex items-center space-x-1.5">
          <span className={`text-[11px] font-mono ${isLight ? 'text-[#6B7280]' : 'text-slate-400'}`}>View:</span>
          <select
            value={activePerspective}
            onChange={(e) => onSelectPerspective(e.target.value as ReportPerspective)}
            className={`text-xs font-medium rounded-xl px-2.5 py-1.5 border cursor-pointer focus:outline-none ${
              isLight
                ? 'bg-white border-[#E5E7EB] text-[#111827] focus:border-amber-500'
                : 'bg-[#111827] border-white/10 text-slate-100 focus:border-amber-500'
            }`}
          >
            <option value="executive">📊 Executive Briefing (มุมมองผู้บริหาร)</option>
            <option value="strategic_decision">🎯 Strategic Decision (การตัดสินใจเชิงยุทธศาสตร์)</option>
            <option value="evidence_investigation">🔍 Evidence & Citations (สำรวจหลักฐานและอ้างอิง)</option>
            <option value="governance_risk">🛡️ Governance & Risk (ธรรมาภิบาลและความเสี่ยง)</option>
            <option value="technical_pipeline">⚙️ Technical Pipeline (ท่อประมวลผล 12 ขั้นตอน)</option>
            <option value="diagnostic_calibration">📐 Diagnostic Calibration (สอบเทียบความมั่นใจ)</option>
            <option value="legal_compliance">⚖️ Legal & Compliance (กฎหมายและข้อบังคับ)</option>
            <option value="financial_investment">💼 Financial & Investment (การเงินและการลงทุน)</option>
            <option value="medical_healthcare">🏥 Medical & Healthcare (การแพทย์และสาธารณสุข)</option>
            <option value="tech_cybersecurity">🛡️ IT & Cybersecurity (ความปลอดภัยไซเบอร์)</option>
            <option value="commercial_marketing">🚀 Commercial & Marketing (การตลาดและการค้า)</option>
            <option value="public_policy">🏛️ Public Policy (นโยบายสาธารณะ)</option>
          </select>
        </div>

        {/* Persona Segmented Control */}
        <div className={`flex items-center p-1 border rounded-xl ${
          isLight ? 'bg-[#F3F4F6] border-[#E5E7EB]' : 'bg-[#111827] border-white/10'
        }`}>
          {personas.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPersona(p.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                activePersona === p.id
                  ? 'bg-[#F59E0B] text-white font-bold shadow-2xs'
                  : isLight
                    ? 'text-[#6B7280] hover:text-[#111827]'
                    : 'text-slate-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Customizer Button */}
        <button
          type="button"
          onClick={onToggleCustomizer}
          className={`px-3 py-1.5 text-xs font-medium rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
            showCustomizer
              ? 'bg-amber-500/20 text-[#D97706] dark:text-amber-300 border-[#F59E0B]'
              : isLight
                ? 'bg-white hover:bg-[#F3F4F6] text-[#111827] border-[#E5E7EB]'
                : 'bg-[#111827] hover:bg-white/10 text-slate-300 border-white/10'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Widgets ({activeWidgetCount})</span>
        </button>
      </div>
    </header>
  );
};
