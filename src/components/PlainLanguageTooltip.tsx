import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info, ExternalLink } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export interface GlossaryTerm {
  term: string;
  thaiLabel: string;
  simpleExplanation: string;
  practicalValue: string;
  category: 'Governance' | 'Reasoning' | 'Security' | 'Architecture';
  standardRef?: string;
  examples?: string[];
  useCases?: string[];
  relatedConcepts?: string[];
}

export const GLOSSARY_TERMS: Record<string, GlossaryTerm> = {
  hypotheses_engine: {
    term: 'Hypotheses Engine (ACH)',
    thaiLabel: 'ระบบวิเคราะห์สมมติฐานเปรียบเทียบ',
    simpleExplanation: 'แทนที่จะคิดคำตอบเดียว AI จะตั้งสมมติฐานทางเลือกหลายมุมมอง แล้วทดสอบด้วยหลักฐานเพื่อตัดตัวเลือกที่ผิดออก',
    practicalValue: 'ป้องกันการด่วนสรุป (Premature Convergence) และลดอคติในการตัดสินใจของผู้บริหาร',
    category: 'Reasoning',
    standardRef: 'Heuer Analysis of Competing Hypotheses (ACH)',
  },
  mental_model: {
    term: 'Mental Model & Knowledge Graph',
    thaiLabel: 'แบบจำลองโครงสร้างความคิดและผังความสัมพันธ์',
    simpleExplanation: 'แผนภาพความสัมพันธ์ที่ AI เชื่อมโยงบริบท นโยบาย ข้อจำกัด และข้อมูลความจำเข้าด้วยกันเป็นโครงข่ายก่อนเริ่มคิด',
    practicalValue: 'ช่วยให้เห็นภาพรวมของระบบและจุดเชื่อมโยงที่ไม่ชัดเจนในข้อมูลดิบ',
    category: 'Reasoning',
  },
  aiia: {
    term: 'AIIA (AI Integrity & Impact Assessment)',
    thaiLabel: 'การประเมินความถูกต้องและผลกระทบของ AI',
    simpleExplanation: 'กรอบการตรวจสอบความน่าเชื่อถือ ตรวจจับความคลาดเคลื่อน (Hallucination) และป้องกันผลกระทบเชิงลบ',
    practicalValue: 'ให้ความมั่นใจว่าคำตอบผ่านการกลั่นกรองและไม่มีการแต่งข้อมูล',
    category: 'Governance',
    standardRef: 'AIIA Standard v2',
  },
  gov_01: {
    term: 'GOV-01 / NIST AI RMF',
    thaiLabel: 'กรอบธรรมาภิบาลและความปลอดภัย AI สากล',
    simpleExplanation: 'มาตรฐานการจัดการความเสี่ยง AI ระดับสากล (NIST AI 100-1 และ ISO 42001) ที่เน้นความโปร่งใส ความปลอดภัย และสิทธิมนุษย์',
    practicalValue: 'สอดคล้องกับข้อกำหนดทางกฎหมายและนโยบายกำกับดูแลระดับองค์กร',
    category: 'Governance',
    standardRef: 'NIST AI RMF 1.0 / ISO/IEC 42001',
  },
  worm_ledger: {
    term: 'WORM Cryptographic Ledger',
    thaiLabel: 'ระบบบันทึกแบบแก้ไขไม่ได้เพื่อการตรวจสอบ',
    simpleExplanation: 'บันทึกประวัติการคิดและข้อมูลทุกขั้นตอนด้วยรหัสแฮช (SHA-256) ซึ่งไม่มีใครสามารถลบหรือดัดแปลงย้อนหลังได้ (Write Once, Read Many)',
    practicalValue: 'ใช้เป็นหลักฐานทางกฎหมายและการตรวจสอบย้อนหลัง (Non-repudiation) ได้ 100%',
    category: 'Security',
  },
  ece_calibration: {
    term: 'ECE Confidence Calibration',
    thaiLabel: 'ความเที่ยงตรงของการประเมินความมั่นใจ',
    simpleExplanation: 'การคำนวณว่า "เมื่อ AI บอกว่ามั่นใจ 90% มันถูกต้อง 90% จริงหรือไม่" เพื่อป้องกันไม่ให้ AI มั่นใจเกินจริง',
    practicalValue: 'ผู้บริหารสามารถเชื่อถือตัวเลขความมั่นใจ (Confidence Score) ได้ตามหลักสถิติ',
    category: 'Reasoning',
    standardRef: 'Expected Calibration Error (ECE)',
  },
  human_agency: {
    term: 'Human-in-the-Loop Agency',
    thaiLabel: 'การคงอำนาจตัดสินใจให้มนุษย์',
    simpleExplanation: 'AI ทำหน้าที่เป็นระบบช่วยสนับสนุนการตัดสินใจ (Decision Support) แต่ไม่ทำการกระทำที่มีความเสี่ยงสูงโดยพลการ',
    practicalValue: 'ป้องกันความผิดพลาดระดับวิกฤต และคงอำนาจบริหารไว้ที่ผู้นำองค์กร',
    category: 'Governance',
    standardRef: 'EU AI Act Article 14 (Human Oversight)',
  },
  bayesian_metrics: {
    term: 'Bayesian Probabilistic Update',
    thaiLabel: 'การอัปเดตน้ำหนักความน่าจะเป็นตามหลักฐานใหม่',
    simpleExplanation: 'การคำนวณปรับเปลี่ยนความน่าจะเป็นของแต่ละข้อสรุปเมื่อได้รับหลักฐานสนับสนุนหรือโต้แย้งเข้ามาเพิ่มเติม',
    practicalValue: 'สะท้อนกระบวนการคิดที่เป็นวิทยาศาสตร์ ไม่ใช่การเดาสุ่ม',
    category: 'Reasoning',
  },
  uncertainty_register: {
    term: 'Uncertainty Register / Missing Info',
    thaiLabel: 'ทะเบียนความไม่แน่นอนและข้อมูลที่ยังขาด',
    simpleExplanation: 'ส่วนที่ AI สรุปอย่างตรงไปตรงมาว่ามีข้อมูลใดที่ยังไม่ทราบ หรือจุดใดที่ยังมีความคลุมเครือ',
    practicalValue: 'ช่วยให้ผู้บริหารทราบว่าต้องหาข้อมูลใดเพิ่มก่อนตัดสินใจอนุมัติ',
    category: 'Governance',
  },
};

interface PlainLanguageTooltipProps {
  termKey: keyof typeof GLOSSARY_TERMS;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export const PlainLanguageTooltip: React.FC<PlainLanguageTooltipProps> = ({
  termKey,
  children,
  showIcon = true,
}) => {
  const info = GLOSSARY_TERMS[termKey];
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!info) return <>{children}</>;

  return (
    <span ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`inline-flex items-center gap-1 font-medium underline decoration-dotted decoration-amber-500/50 underline-offset-2 hover:text-amber-500 transition-colors cursor-pointer text-left`}
        title={`คลิกเพื่อดูคำอธิบาย: ${info.thaiLabel}`}
      >
        {children || info.term}
        {showIcon && (
          <HelpCircle className="w-3 h-3 text-amber-500/80 inline-block shrink-0" />
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-2 w-72 sm:w-80 p-3.5 rounded-xl border shadow-2xl z-50 animate-fadeIn text-left ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
              : 'bg-[#0F172A] border-amber-500/30 text-slate-100 shadow-black/80'
          }`}
        >
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-amber-600 dark:text-amber-400 block">
                {info.category} • คำอธิบายเชิงภาษาเข้าใจง่าย
              </span>
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                {info.thaiLabel}
              </h5>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {info.term}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white px-1 font-mono"
            >
              ✕
            </button>
          </div>

          <div className="py-2.5 space-y-2 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                ความหมาย:
              </span>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                {info.simpleExplanation}
              </p>
            </div>

            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                ประโยชน์ต่อผู้บริหาร:
              </span>
              <p className="text-amber-900 dark:text-amber-200/90 text-[11px] leading-relaxed">
                {info.practicalValue}
              </p>
            </div>

            {info.standardRef && (
              <div className="pt-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>มาตรฐานอ้างอิง:</span>
                <strong className="text-slate-700 dark:text-slate-300">{info.standardRef}</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </span>
  );
};
