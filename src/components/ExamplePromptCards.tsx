import React from 'react';
import { Brain, FileText, TrendingUp, ShieldAlert, Landmark, Layers, Sparkles, ArrowRight } from 'lucide-react';
import { SAMPLE_PROMPTS, SamplePrompt } from '../data/pcaDefaults';
import { useTheme } from '../context/ThemeContext';
import { getThemeTokens } from '../utils/themeTokens';

interface ExamplePromptCardsProps {
  onSelectSample: (sample: SamplePrompt) => void;
  compact?: boolean;
}

export const ExamplePromptCards: React.FC<ExamplePromptCardsProps> = ({ onSelectSample, compact = false }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  const cards = [
    {
      id: 'analyze-decision',
      title: 'Analyze Decision',
      subtitle: 'วิเคราะห์การตัดสินใจลงทุนและข้อแลกเปลี่ยน',
      prompt: 'โปรดวิเคราะห์การตัดสินใจลงทุนโครงสร้างพื้นฐาน AI ข้ามภูมิภาค โดยประเมินความเสี่ยง ผลตอบแทน และข้อแลกเปลี่ยนทางกลยุทธ์ตามกรอบ PCA',
      icon: Brain,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      tag: 'Strategic',
    },
    {
      id: 'red-team',
      title: 'Red Team Attack',
      subtitle: 'จำลองการโจมตี Stress-Test และประเมินจุดอ่อน',
      prompt: 'ทำการจำลอง Red Team Stress-Test แผนงานโครงการสำคัญ เพื่อหาจุดอ่อนช่องโหว่ความเสี่ยงสูงสุดและแนวทางป้องกัน',
      icon: ShieldAlert,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      tag: 'Risk Audit',
    },
    {
      id: 'framework-mapping',
      title: 'Framework Mapping',
      subtitle: 'แมปปิ้งสถาปัตยกรรม ISO 42001 & NIST AI RMF',
      prompt: 'จัดทำแผนผัง Framework Mapping เชื่อมโยง ISO 42001, NIST AI RMF และสถาปัตยกรรมระบบองค์กรของ FIRE KEEPER',
      icon: Layers,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      tag: 'Governance',
    },
    {
      id: 'analyze-report',
      title: 'Analyze Report',
      subtitle: 'สังเคราะห์และสอบทานรายงานผลประกอบการ',
      prompt: 'โปรดสังเคราะห์และตรวจสอบความถูกต้องของรายงานผลประกอบการประจำไตรมาส พร้อมสกัดประเด็นสำคัญและข้อเสนอแนะระดับผู้บริหาร',
      icon: FileText,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/20',
      tag: 'Executive',
    },
    {
      id: 'business-strategy',
      title: 'Business Strategy',
      subtitle: 'วางแผนกลยุทธ์ Business Model Pivot',
      prompt: 'วางแผนกลยุทธ์การปรับเปลี่ยนโมเดลธุรกิจ (Business Model Pivot) เพื่อรับมือกับการแข่งขันในตลาดดิจิทัลและข้อกำกับดูแลใหม่',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      tag: 'Growth',
    },
    {
      id: 'thai-law',
      title: 'Thai Law & PDPA',
      subtitle: 'ตรวจสอบกฎหมายและกฎระเบียบคณะกรรมการไทย',
      prompt: 'วิเคราะห์ข้อกฎหมาย พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA), กฎหมายไซเบอร์ และธรรมาภิบาล AI ตามบริบทกฎหมายประเทศไทย',
      icon: Landmark,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      tag: 'Compliance',
    },
  ];

  return (
    <div className="space-y-2">
      {/* Header with clear secondary role */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wide uppercase text-slate-400">
            Quick Command Presets (เทมเพลตคำสั่งด่วน)
          </span>
        </div>
        <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 hidden sm:inline">
          1-Click Executive Templates
        </span>
      </div>

      {/* Sleek, Balanced Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
        {cards.map((card) => {
          const Icon = card.icon;
          const matchingSample: SamplePrompt = {
            id: card.id,
            title: card.title,
            prompt: card.prompt,
            category: 'Strategic',
            tone: 'Formal Architect',
            deepReasoning: true,
          };

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectSample(matchingSample)}
              className={`rounded-xl p-2.5 sm:p-3 text-left flex items-center justify-between gap-2.5 border transition-all group cursor-pointer ${
                isLight
                  ? 'bg-white/90 hover:bg-white border-slate-200 hover:border-amber-500/60 shadow-2xs hover:shadow-xs'
                  : 'bg-[#0E1525]/90 hover:bg-[#131D33] border-white/10 hover:border-amber-500/40 shadow-xs'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className={`p-2 rounded-lg ${card.bgColor} ${card.borderColor} border ${card.color} shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <h4 className={`font-bold text-xs sm:text-[13px] group-hover:text-amber-400 transition-colors truncate ${
                      isLight ? 'text-slate-800' : 'text-slate-200'
                    }`}>
                      {card.title}
                    </h4>
                    <span className="text-[8px] sm:text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-semibold border border-white/5 shrink-0">
                      {card.tag}
                    </span>
                  </div>
                  <p className={`text-[11px] sm:text-xs font-normal leading-relaxed line-clamp-1 mt-0.5 ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {card.subtitle}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 opacity-40 group-hover:opacity-100" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

