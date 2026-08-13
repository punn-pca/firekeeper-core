import React from 'react';
import { ShieldCheck, TrendingUp, Layers, Compass, ArrowUpRight } from 'lucide-react';
import { SAMPLE_PROMPTS, SamplePrompt } from '../data/pcaDefaults';
import { useTheme } from '../context/ThemeContext';
import { getThemeTokens } from '../utils/themeTokens';

interface ExamplePromptCardsProps {
  onSelectSample: (sample: SamplePrompt) => void;
}

export const ExamplePromptCards: React.FC<ExamplePromptCardsProps> = ({ onSelectSample }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  const cards = [
    {
      sampleId: 'gov-1',
      title: 'Enterprise AI Governance',
      description: 'ออกแบบกรอบการกำกับดูแล AI ความเสี่ยง ความปลอดภัย และข้อกำหนดปฏิบัติตามมาตรฐานองค์กร',
      icon: ShieldCheck,
      color: 'text-[#F59E0B]',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    {
      sampleId: 'biz-1',
      title: 'Business Pivot Evaluation',
      description: 'ประเมินทิศทางยุทธศาสตร์การปรับเปลี่ยนโมเดลธุรกิจ โอกาสทางการตลาด และข้อแลกเปลี่ยน',
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-[#35D07F]',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
    },
    {
      sampleId: 'arch-1',
      title: 'Architecture Selection',
      description: 'เปรียบเทียบสถาปัตยกรรมระบบ คลาวด์อินฟราสตรัคเจอร์ และการเลือกใช้เทคโนโลยีหลัก',
      icon: Layers,
      color: 'text-purple-600 dark:text-[#7C5CFF]',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
    },
    {
      sampleId: 'agi-1',
      title: 'AGI Alignment & Safety',
      description: 'วิเคราะห์ผลกระทบด้านความปลอดภัย จริยธรรมปัญญาประดิษฐ์ และการรักษาสิทธิ์ของมนุษย์',
      icon: Compass,
      color: 'text-[#F59E0B]',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-extrabold tracking-wide uppercase font-mono flex items-center gap-2 ${
          isLight ? 'text-[#111827]' : 'text-white'
        }`}>
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
          <span>Executive Quick Prompts</span>
        </h3>
        <span className={`text-xs sm:text-[12.5px] font-medium ${
          isLight ? 'text-[#6B7280]' : 'text-slate-300'
        }`}>
          คลิกการ์ดเพื่อเลือกวิเคราะห์โจทย์ยุทธศาสตร์ทันที
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const matchingSample = SAMPLE_PROMPTS.find((s) => s.id === card.sampleId) || SAMPLE_PROMPTS[0];
          return (
            <button
              key={card.sampleId}
              type="button"
              onClick={() => onSelectSample(matchingSample)}
              className={`rounded-2xl p-4 sm:p-5 text-left flex items-start justify-between gap-3.5 border transition-all ${tokens.shadow} group cursor-pointer ${
                isLight
                  ? 'bg-white border-[#E5E7EB] hover:border-[#F59E0B]'
                  : 'bg-[#111827] border-white/10 hover:border-[#F59E0B]/50'
              }`}
            >
              <div className="flex items-start space-x-3.5 min-w-0">
                <div className={`p-3 rounded-2xl ${card.bgColor} ${card.borderColor} border ${card.color} shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h4 className={`font-extrabold text-sm sm:text-base group-hover:text-[#F59E0B] transition-colors truncate ${
                    isLight ? 'text-[#111827]' : 'text-white'
                  }`}>
                    {card.title}
                  </h4>
                  <p className={`text-xs sm:text-[13px] font-medium leading-relaxed line-clamp-2 ${
                    isLight ? 'text-[#4B5563]' : 'text-slate-200'
                  }`}>
                    {card.description}
                  </p>
                </div>
              </div>

              <div className={`p-2 rounded-xl border transition-all shrink-0 ${
                isLight
                  ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280] group-hover:text-[#111827] group-hover:border-[#F59E0B]'
                  : 'bg-[#060A16] border-white/10 text-slate-300 group-hover:text-white group-hover:border-[#F59E0B]/40'
              }`}>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
