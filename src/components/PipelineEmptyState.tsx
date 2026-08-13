import React from 'react';
import { Brain, Sparkles, ArrowRight, Upload, History, Play, FileText, CheckCircle2 } from 'lucide-react';
import { useConversation } from '../context/ConversationContext';
import { useTheme } from '../context/ThemeContext';

interface PipelineEmptyStateProps {
  onStartAnalysis: () => void;
  onLoadSample: (promptText: string) => void;
}

export const PipelineEmptyState: React.FC<PipelineEmptyStateProps> = ({
  onStartAnalysis,
  onLoadSample,
}) => {
  const { toggleDrawer } = useConversation();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const samplePrompts = [
    'วิเคราะห์ความเสี่ยงและทางเลือกเชิงยุทธศาสตร์การลงทุนระบบ AI ในภาครัฐปี 2569',
    'ประเมินผลกระทบด้านกฎหมาย PDPA และ Cyber Security ต่อการขยายบริการ Digital Banking',
    'ร่างแนวทางการกำกับดูแลปัญญาประดิษฐ์ (AI Governance Policy) สำหรับองค์กรระดับประเทศ',
  ];

  return (
    <div className={`rounded-[16px] p-8 sm:p-12 border text-center my-6 shadow-xs transition-all max-w-4xl mx-auto space-y-8 ${
      isLight ? 'bg-white border-[#E5E7EB] text-[#111827]' : 'bg-[#0E1525] border-slate-800 text-white'
    }`}>
      {/* Large Illustration / Badge */}
      <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-orange-100 animate-ping opacity-25" />
        <div className="relative w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FF7A00] shadow-xs">
          <Brain className="w-8 h-8 text-[#FF7A00]" />
        </div>
      </div>

      {/* Headlines */}
      <div className="space-y-2 max-w-xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
          Executive AI Decision Intelligence
        </h2>
        <p className="text-sm text-[#4B5563] leading-relaxed">
          ระบบประมวลผล 12-Stage Cognitive Architecture พร้อมการตรวจสอบเชิงเหตุผล Governance Audit และ Memory Tracking ระดับผู้บริหาร
        </p>
      </div>

      {/* Example Prompt Chips */}
      <div className="space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
          คำถามยุทธศาสตร์ตัวอย่างสำหรับเริ่มต้นวิเคราะห์
        </span>
        <div className="flex flex-col gap-2">
          {samplePrompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onLoadSample(prompt)}
              className={`p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between group cursor-pointer ${
                isLight
                  ? 'bg-slate-50 hover:bg-orange-50/60 border-[#E5E7EB] hover:border-[#FF7A00]/50 text-[#111827]'
                  : 'bg-[#152036] hover:bg-[#1A2846] border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2 min-w-0 pr-2">
                <Sparkles className="w-4 h-4 text-[#FF7A00] shrink-0" />
                <span className="truncate">{prompt}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#FF7A00] group-hover:translate-x-1 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-[#ECEFF3]">
        <button
          onClick={onStartAnalysis}
          type="button"
          className="px-5 py-2.5 rounded-[12px] bg-[#FF7A00] hover:bg-[#e06c00] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Play className="w-4 h-4" />
          <span>เริ่มวิเคราะห์ใหม่ (Start Analysis)</span>
        </button>

        <button
          onClick={() => onLoadSample(samplePrompts[0])}
          type="button"
          className="px-5 py-2.5 rounded-[12px] bg-white border border-[#FF7A00] text-[#FF7A00] hover:bg-orange-50 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4 text-[#FF7A00]" />
          <span>โหลดตัวอย่างยุทธศาสตร์ (Load Sample)</span>
        </button>

        <button
          onClick={toggleDrawer}
          type="button"
          className="px-5 py-2.5 rounded-[12px] bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6] font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
        >
          <History className="w-4 h-4 text-[#6B7280]" />
          <span>เปิดเซสชันเดิม (Open Previous Session)</span>
        </button>
      </div>
    </div>
  );
};
