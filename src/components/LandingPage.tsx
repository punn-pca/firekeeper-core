import React, { useState } from 'react';
import {
  Flame,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle,
  Eye,
  Brain,
  Target,
  Database,
  Network,
  Sparkles,
  AlertTriangle,
  Compass,
  MessageSquare,
  RotateCcw,
  GraduationCap,
  Play,
  Shield,
  TrendingUp,
  Cpu,
  Layers,
  Users,
  Search,
  Scale,
  FileText,
  Lock,
  Check
} from 'lucide-react';
import { PCA_STAGES } from '../types';
import { AIExecutionTraceModal } from './AIExecutionTraceModal';

interface LandingPageProps {
  onEnter: () => void;
  isLight?: boolean;
}

const STAGE_ICONS: Record<string, React.ComponentType<any>> = {
  OBSERVATION: Target,
  UNDERSTANDING: Brain,
  PURPOSE: Compass,
  MEMORY: Database,
  MENTAL_MODEL: Network,
  HYPOTHESIS: Sparkles,
  EVIDENCE_EVALUATION: ShieldCheck,
  CRITIQUE: AlertTriangle,
  DECISION: CheckCircle,
  COMMUNICATION: MessageSquare,
  REFLECTION: RotateCcw,
  LEARNING: GraduationCap,
};

const STAGE_DETAILS: Record<string, {
  titleTh: string;
  focus: string;
  desc: string;
  aiRoles: {
    analyst: string;
    critic: string;
    synthesizer: string;
  };
  actions: string[];
  tip: string;
}> = {
  OBSERVATION: {
    titleTh: '01 การกำหนดเจตนา (Intent Definition)',
    focus: 'STAGE 01 / 12',
    desc: 'กำหนดเจตนา เป้าหมาย และขอบเขตการวิเคราะห์เพื่อให้การวิเคราะห์มีทิศทางที่ชัดเจน',
    aiRoles: {
      analyst: 'รวบรวมและวิเคราะห์ข้อมูล',
      critic: 'ตรวจสอบข้อผิดพลาด ตั้งคำถาม และท้าทายสมมติฐาน',
      synthesizer: 'รวมผลการวิเคราะห์และสร้างผลลัพธ์สำหรับขั้นตอนถัดไป'
    },
    actions: [
      'กำหนดเจตนาของการวิเคราะห์',
      'ระบุเป้าหมายที่ต้องการบรรลุ',
      'กำหนดขอบเขตและข้อจำกัด',
      'ระบุผู้มีส่วนได้ส่วนเสีย'
    ],
    tip: 'ขั้นตอนนี่คือรากฐานสำคัญของการวิเคราะห์ที่มีคุณภาพสูงสุด'
  },
  UNDERSTANDING: {
    titleTh: '02 การทำความเข้าใจบริบท (Context Understanding)',
    focus: 'STAGE 02 / 12',
    desc: 'ทำความเข้าใจสถานการณ์ บริบท และข้อจำกัดเชิงโครงสร้างเพื่อให้เข้าถึงแก่นปัญหา',
    aiRoles: {
      analyst: 'รวบรวมและวิเคราะห์ข้อมูล',
      critic: 'ตรวจสอบข้อผิดพลาด ตั้งคำถาม และท้าทายสมมติฐาน',
      synthesizer: 'รวมผลการวิเคราะห์และสร้างผลลัพธ์สำหรับขั้นตอนถัดไป'
    },
    actions: [
      'วิเคราะห์บริบทแวดล้อม',
      'สำรวจข้อจำกัดทางสภาพแวดล้อม',
      'ประเมินความซับซ้อนของปัญหา',
      'สกัดนัยสำคัญเบื้องต้น'
    ],
    tip: 'การทำความเข้าใจที่แม่นยำช่วยลดความคลาดเคลื่อนในขั้นตอนต่อไปอย่างมีนัยสำคัญ'
  },
  PURPOSE: {
    titleTh: '03 การกำหนดวัตถุประสงค์และขอบเขต (Purpose & Scope)',
    focus: 'STAGE 03 / 12',
    desc: 'ระบุเป้าหมาย สื่อที่ต้องการรู้ และขอบเขตการวิเคราะห์ให้อยู่ในกรอบที่ตรวจสอบได้',
    aiRoles: {
      analyst: 'รวบรวมและวิเคราะห์ข้อมูล',
      critic: 'ตรวจสอบข้อผิดพลาด ตั้งคำถาม และท้าทายสมมติฐาน',
      synthesizer: 'รวมผลการวิเคราะห์และสร้างผลลัพธ์สำหรับขั้นตอนถัดไป'
    },
    actions: [
      'ระบุตัวชี้วัดความสำเร็จ (KPIs)',
      'จำกัดขอบเขตข้อมูลที่ไม่เกี่ยวข้อง',
      'ตั้งธงคำถามหลักเชิงกลยุทธ์',
      'ตรวจสอบความเป็นไปได้'
    ],
    tip: 'กำหนดเป้าหมายให้ชัดเจนเพื่อให้ผลลัพธ์ตรงประเด็นและใช้งานได้จริง'
  },
  MEMORY: {
    titleTh: '04 การรวบรวมและจัดโครงสร้างข้อมูล (Data Structuring)',
    focus: 'STAGE 04 / 12',
    desc: 'รวบรวมและจัดกลุ่มข้อมูลตามประเภท เพื่อให้เข้าถึงโครงสร้างและสัดส่วนที่แท้จริง',
    aiRoles: {
      analyst: 'รวบรวมและวิเคราะห์ข้อมูล',
      critic: 'ตรวจสอบข้อผิดพลาด ตั้งคำถาม และท้าทายสมมติฐาน',
      synthesizer: 'รวมผลการวิเคราะห์และสร้างผลลัพธ์สำหรับขั้นตอนถัดไป'
    },
    actions: [
      'จัดหมวดหมู่ข้อมูลดิบ',
      'ตรวจสอบความซ้ำซ้อนของข้อมูล',
      'จัดระเบียบฐานความจำระยะยาว',
      'เตรียมข้อมูลป้อนเข้าสู่ระบบประเมิน'
    ],
    tip: 'ข้อมูลที่เป็นระเบียบช่วยเพิ่มประสิทธิภาพและความแม่นยำในการประมวลผล'
  },
  MENTAL_MODEL: {
    titleTh: '05 การสร้างแบบจำลองความสัมพันธ์ (Relationship Modeling)',
    focus: 'STAGE 05 / 12',
    desc: 'สร้างแผนผังความคิด เชื่อมโยงประเด็นสำคัญ และโครงสร้างความสัมพันธ์',
    aiRoles: {
      analyst: 'รวบรวมและวิเคราะห์ข้อมูล',
      critic: 'ตรวจสอบข้อผิดพลาด ตั้งคำถาม และท้าทายสมมติฐาน',
      synthesizer: 'รวมผลการวิเคราะห์และสร้างผลลัพธ์สำหรับขั้นตอนถัดไป'
    },
    actions: [
      'สร้าง Knowledge Graph ของปัญหา',
      'เชื่อมโยงเหตุและผล (Cause & Effect)',
      'จัดลำดับความสำคัญของตัวแปร',
      'ตรวจสอบความสมบูรณ์ของโครงสร้างตรรกะ'
    ],
    tip: 'แผนผังความคิดช่วยให้เห็นภาพรวมทั้งระบบอย่างชัดเจนและเป็นระบบ'
  },
  HYPOTHESIS: {
    titleTh: '06 การตั้งสมมติฐาน (Hypothesis Formation)',
    focus: 'STAGE 06 / 12',
    desc: 'กำหนดสมมติฐานหลักที่ต้องการตรวจสอบและพิสูจน์ตามหลักตรรกะ',
    aiRoles: {
      analyst: 'รวบรวมและวิเคราะห์ข้อมูล',
      critic: 'ตรวจสอบข้อผิดพลาด ตั้งคำถาม และท้าทายสมมติฐาน',
      synthesizer: 'รวมผลการวิเคราะห์และสร้างผลลัพธ์สำหรับขั้นตอนถัดไป'
    },
    actions: [
      'สร้างสมมติฐานทางเลือก (Alternative Hypotheses)',
      'คัดกรองสมมติฐานที่มีน้ำหนัก',
      'กำหนดตัวแปรทดสอบ',
      'เชื่อมโยงกับกรอบทฤษฎี'
    ],
    tip: 'สมมติฐานที่ดีต้องสามารถพิสูจน์ได้ด้วยหลักฐานเชิงประจักษ์'
  },
  EVIDENCE_EVALUATION: {
    titleTh: '07 การประเมินหลักฐาน (Evidence Evaluation)',
    focus: 'STAGE 07 / 12',
    desc: 'ตรวจสอบความน่าเชื่อถือ และคุณภาพของข้อมูลหลักฐานทั้งหมดก่อนนำไปอ้างอิง',
    aiRoles: {
      analyst: 'รวบรวมและวิเคราะห์ข้อมูล',
      critic: 'ตรวจสอบข้อผิดพลาด ตั้งคำถาม และท้าทายสมมติฐาน',
      synthesizer: 'รวมผลการวิเคราะห์และสร้างผลลัพธ์สำหรับขั้นตอนถัดไป'
    },
    actions: [
      'ตรวจสอบที่มาของหลักฐาน (Source Credibility)',
      'ประเมินระดับความน่าเชื่อถือทางสถิติ',
      'คัดกรองหลักฐานที่เป็นเท็จหรือบิดเบือน',
      'ให้คะแนนน้ำหนักหลักฐาน (Evidence Weighting)'
    ],
    tip: 'หลักฐานที่แน่นหนาคือเกราะป้องกันความผิดพลาดของกระบวนการทั้งหมด'
  },
  CRITIQUE: {
    titleTh: '08 การวิเคราะห์ความเสี่ยงและข้อโต้แย้ง (Risk & Critique Analysis)',
    focus: 'STAGE 08 / 12',
    desc: 'วิเคราะห์ผล ผลเสีย ความเสี่ยง และผลกระทบที่เกี่ยวข้องในทุกมิติ',
    aiRoles: {
      analyst: 'รวบรวมและวิเคราะห์ข้อมูล',
      critic: 'ตรวจสอบข้อผิดพลาด ตั้งคำถาม และท้าทายสมมติฐาน',
      synthesizer: 'รวมผลการวิเคราะห์และสร้างผลลัพธ์สำหรับขั้นตอนถัดไป'
    },
    actions: [
      'ประเมินความเสี่ยงรอบด้าน (Risk Assessment)',
      'วิเคราะห์ผลกระทบระยะสั้นและระยะยาว',
      'จำลองสถานการณ์เชิงลบ (Negative Scenarios)',
      'เตรียมแผนสำรองฉุกเฉิน'
    ],
    tip: 'การมองเห็นความเสี่ยงล่วงหน้าช่วยให้องค์กรเตรียมพร้อมรับมือได้อย่างมั่นใจ'
  },
  DECISION: {
    titleTh: '09 การสร้างทางเลือกเพื่อการตัดสินใจ (Strategic Options)',
    focus: 'STAGE 09 / 12',
    desc: 'สร้างเหตุผลสนับสนุน ทางเลือกที่เหมาะสม และคำแนะนำระดับผู้บริหาร',
    aiRoles: {
      analyst: 'รวบรวมและวิเคราะห์ข้อมูล',
      critic: 'ตรวจสอบข้อผิดพลาด ตั้งคำถาม และท้าทายสมมติฐาน',
      synthesizer: 'รวมผลการวิเคราะห์และสร้างผลลัพธ์สำหรับขั้นตอนถัดไป'
    },
    actions: [
      'เปรียบเทียบทางเลือกเชิงกลยุทธ์',
      'คำนวณความคุ้มค่า (Cost-Benefit Analysis)',
      'สร้างข้อเสนอแนะเชิงปฏิบัติการ',
      'เตรียมรายงานประกอบการตัดสินใจ'
    ],
    tip: 'ให้ทางเลือกที่มีเหตุผลและหลักฐานรองรับอย่างสมบูรณ์แบบ'
  },
  COMMUNICATION: {
    titleTh: '10 การสื่อสารผลการวิเคราะห์ (Analysis Communication)',
    focus: 'STAGE 10 / 12',
    desc: 'สรุปประเด็นสำคัญจากข้อมูลทั้งหมดอย่างเป็นระบบและเข้าใจง่าย',
    aiRoles: {
      analyst: 'รวบรวมและวิเคราะห์ข้อมูล',
      critic: 'ตรวจสอบข้อผิดพลาด ตั้งคำถาม และท้าทายสมมติฐาน',
      synthesizer: 'รวมผลการวิเคราะห์และสร้างผลลัพธ์สำหรับขั้นตอนถัดไป'
    },
    actions: [
      'สังเคราะห์บทสรุปผู้บริหาร (Executive Summary)',
      'จัดเรียงลำดับความสำคัญของเนื้อหา',
      'ตรวจสอบความกระชับและแม่นยำ',
      'นำเสนอในรูปแบบที่พร้อมใช้งานทันที'
    ],
    tip: 'ข้อมูลที่ผ่านการสังเคราะห์อย่างประณีตช่วยประหยัดเวลาในการตัดสินใจระดับสูง'
  },
  REFLECTION: {
    titleTh: '11 การทบทวนและตรวจสอบ (Review & Verification)',
    focus: 'STAGE 11 / 12',
    desc: 'ตรวจสอบความน่าเชื่อถือของผลการวิเคราะห์และความถูกต้องตามหลักการ',
    aiRoles: {
      analyst: 'รวบรวมและวิเคราะห์ข้อมูล',
      critic: 'ตรวจสอบข้อผิดพลาด ตั้งคำถาม และท้าทายสมมติฐาน',
      synthesizer: 'รวมผลการวิเคราะห์และสร้างผลลัพธ์สำหรับขั้นตอนถัดไป'
    },
    actions: [
      'ตรวจสอบความสอดคล้องภายใน (Internal Consistency)',
      'ประเมินระดับความมั่นใจ (Confidence Score)',
      'ทวนสอบข้อผิดพลาดทางตรรกะ',
      'รับรองความถูกต้องก่อนนำส่ง'
    ],
    tip: 'ความโปร่งใสและการตรวจสอบได้คือหัวใจสำคัญของระบบปัญญาประดิษฐ์'
  },
  LEARNING: {
    titleTh: '12 การเรียนรู้และปรับปรุง (Continuous Improvement)',
    focus: 'STAGE 12 / 12',
    desc: 'ทบทวนบทเรียน ปรับปรุง และพัฒนาการวิเคราะห์ในรอบถัดไปอย่างต่อเนื่อง',
    aiRoles: {
      analyst: 'รวบรวมและวิเคราะห์ข้อมูล',
      critic: 'ตรวจสอบข้อผิดพลาด ตั้งคำถาม และท้าทายสมมติฐาน',
      synthesizer: 'รวมผลการวิเคราะห์และสร้างผลลัพธ์สำหรับขั้นตอนถัดไป'
    },
    actions: [
      'บันทึกบทเรียนจากการวิเคราะห์ (Lessons Learned)',
      'ปรับปรุงชุดคำสั่งและเกณฑ์ประเมิน',
      'อัปเดตฐานความจำองค์กร',
      'พัฒนาประสิทธิภาพระบบในระยะยาว'
    ],
    tip: 'ระบบที่เรียนรู้และพัฒนาตนเองได้คือรากฐานขององค์กรแห่งอนาคต'
  }
};

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [activeStageId, setActiveStageId] = useState<string>('OBSERVATION');
  const [isTraceModalOpen, setIsTraceModalOpen] = useState<boolean>(false);

  const activeDetail = STAGE_DETAILS[activeStageId] || STAGE_DETAILS['OBSERVATION'];
  const activeStageIndex = PCA_STAGES.findIndex(s => s.id === activeStageId);
  const activeOrderNum = activeStageIndex !== -1 ? activeStageIndex + 1 : 1;
  const ActiveIcon = STAGE_ICONS[activeStageId] || Target;

  return (
    <div className="min-h-screen bg-[#030611] text-slate-100 flex flex-col font-sans selection:bg-[#FF8A00] selection:text-black">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/5 blur-[160px] pointer-events-none" />
      <div className="absolute top-[25%] right-[-10%] w-[600px] h-[600px] bg-[#FF8A00]/5 blur-[180px] pointer-events-none" />

      {/* ================= 1. HEADER ================= */}
      <header className="sticky top-0 z-50 w-full bg-[#030611]/95 backdrop-blur-md border-b border-white/10 px-6 sm:px-10 lg:px-16 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flame className="w-7 h-7 text-[#FF8A00] drop-shadow-[0_0_12px_rgba(255,138,0,0.6)]" />
          <span className="font-mono font-bold tracking-tight text-white text-lg sm:text-xl flex items-center gap-2.5">
            FIRE KEEPER
            <span className="text-xs font-mono text-[#FF8A00] bg-[#FF8A00]/15 border border-[#FF8A00]/40 px-2 py-0.5 rounded">
              OS v2.0
            </span>
          </span>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-mono text-slate-300 font-medium">
          <a href="#problem" className="hover:text-white transition-colors">ปัญหาที่องค์กรเผชิญ</a>
          <a href="#decision-output" className="hover:text-white transition-colors">ตัวอย่างรายงาน</a>
          <a href="#how-it-thinks" className="hover:text-white transition-colors">การวิเคราะห์ของระบบ</a>
          <a href="#governance-trust" className="hover:text-white transition-colors">Governance และความน่าเชื่อถือ</a>
          <a href="#scenarios" className="hover:text-white transition-colors">สถานการณ์จำลอง</a>
        </nav>

        {/* Right Nav */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-3 py-1.5 rounded-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SECURE PORTAL
          </div>
          <button
            onClick={onEnter}
            aria-label="เข้าสู่ระบบเวิร์กสเปซ"
            className="px-5 py-2.5 rounded-xl bg-[#FF8A00] hover:bg-[#ff9d2e] text-black text-xs sm:text-sm font-mono font-bold tracking-wide transition-all duration-300 shadow-[0_0_20px_rgba(255,138,0,0.25)] hover:shadow-[0_0_30px_rgba(255,138,0,0.5)] active:scale-95 flex items-center gap-2"
          >
            เข้าสู่ระบบเวิร์กสเปซ
          </button>
        </div>
      </header>

      {/* ================= 2. HERO SECTION ================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-20 pb-24 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-slate-200 text-xs sm:text-sm font-mono backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF8A00] animate-pulse" />
            แพลตฟอร์ม Decision Intelligence และ AI Governance สำหรับองค์กร
          </div>

          <div className="space-y-3">
            <span className="text-xs font-mono text-[#FF8A00] font-bold tracking-wider uppercase block">
              FIRE KEEPER OS
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-light tracking-tight text-white leading-[1.15]">
              เปลี่ยนปัญหาที่ซับซ้อนขององค์กร ให้กลายเป็นการตัดสินใจที่มี <span className="font-bold text-[#FF8A00]">หลักฐานรองรับ</span>
            </h1>
          </div>

          <p className="text-slate-300 text-base sm:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light">
            Fire Keeper ช่วยผู้บริหารวิเคราะห์ข้อมูล หลักฐาน ความเสี่ยง และทางเลือก เพื่อสร้างข้อมูลประกอบการตัดสินใจที่ตรวจสอบกระบวนการและหลักฐานย้อนหลังได้
          </p>

          <div className="text-xs font-mono text-slate-400 bg-white/[0.02] border border-white/10 px-4 py-2 rounded-xl inline-block">
            สำหรับการตัดสินใจที่มีความเสี่ยงและผลกระทบสูง
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <button
              onClick={onEnter}
              aria-label="ดูตัวอย่างการตัดสินใจ"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#FF8A00] hover:bg-[#ff9d2e] text-black text-sm font-mono font-bold tracking-wider transition-all duration-300 shadow-[0_0_25px_rgba(255,138,0,0.3)] flex items-center justify-center gap-2.5 group"
            >
              ดูตัวอย่างการตัดสินใจ
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href="#problem"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-mono font-medium transition-all duration-300 flex items-center justify-center gap-2.5"
            >
              ดูวิธีการวิเคราะห์
            </a>
          </div>

          {/* Conversion Funnel Pipeline */}
          <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs font-mono text-slate-400">
            <span className="text-[#FF8A00] font-bold">เข้าใจ</span>
            <span>→</span>
            <span className="text-slate-300">ประเมิน</span>
            <span>→</span>
            <span className="text-slate-300">ตรวจสอบ</span>
            <span>→</span>
            <span className="text-slate-300">ยืนยัน</span>
            <span>→</span>
            <span className="text-emerald-400 font-bold">ตัดสินใจ</span>
          </div>
        </div>

        {/* Right Column: Executive Command Preview Card */}
        <div className="lg:col-span-5 bg-[#050914] border border-white/15 rounded-3xl p-7 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-[#FF8A00]" />
              <span className="font-mono font-bold text-sm tracking-wider text-white">
                EXECUTIVE DECISION PIPELINE
              </span>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-900/60 px-2.5 py-1 rounded">
              12/12 ขั้นตอนทำงานอยู่
            </span>
          </div>

          <div className="space-y-3.5 mb-6 text-left">
            <div className="p-4 rounded-2xl bg-[#090E20] border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-slate-400">ปัญหาทางธุรกิจ (ตัวอย่างจำลอง)</span>
                <span className="text-xs font-mono text-amber-400">ผลกระทบสูง</span>
              </div>
              <p className="text-sm font-medium text-white">ความยืดหยุ่นของห่วงโซ่อุปทานและต้นทุนซัพพลายเออร์ที่เพิ่มขึ้น</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-900/40">
                <div className="text-[11px] font-mono text-emerald-400 mb-0.5">ความน่าเชื่อถือของหลักฐาน</div>
                <div className="text-lg font-bold text-white">ตรวจสอบแล้ว 91%</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-900/40">
                <div className="text-[11px] font-mono text-blue-400 mb-0.5">การกำกับดูแล</div>
                <div className="text-lg font-bold text-white">ผ่านเกณฑ์</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#030611] border border-white/10 flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide block mb-1">
                บันทึก Audit Trail สำหรับตรวจสอบย้อนหลัง
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                ระบบบันทึกร่องรอยของกระบวนการวิเคราะห์และผลลัพธ์ใน Audit Trail เพื่อให้สามารถตรวจสอบย้อนหลังได้
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 3. EXECUTIVE PROBLEM SECTION ================= */}
      <section id="problem" className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 w-full border-t border-white/10 bg-[#040817]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono mb-4">
            กรณีศึกษาการตัดสินใจระดับผู้บริหาร
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-light tracking-tight text-white mb-4">
            Fire Keeper ช่วยวิเคราะห์การตัดสินใจ <span className="font-bold text-[#FF8A00]">เรื่องใดได้บ้าง?</span>
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-light">
            ออกแบบมาสำหรับปัญหาที่มีความซับซ้อน มีข้อมูลจำนวนมาก และมีผลกระทบต่อองค์กรในระดับสูง
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Use Case 1 */}
          <div className="bg-[#080E24] border border-white/10 rounded-3xl p-7 flex flex-col justify-between hover:border-[#FF8A00]/50 transition-all duration-300 shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-[#FF8A00] bg-[#FF8A00]/10 border border-[#FF8A00]/30 px-3 py-1 rounded">
                  ต้นทุนและประสิทธิภาพ
                </span>
                <TrendingUp className="w-5 h-5 text-[#FF8A00]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">ต้นทุนและประสิทธิภาพ</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-light mb-6">
                วิเคราะห์โครงสร้างต้นทุน ค้นหาจุดรั่วไหล และเปรียบเทียบแนวทางเพิ่มประสิทธิภาพ
              </p>
            </div>
            <div className="space-y-2 pt-4 border-t border-white/10 text-xs font-mono text-slate-400">
              <div className="flex justify-between"><span>ปัญหา:</span><span className="text-white">แรงกดดันด้านกำไร</span></div>
              <div className="flex justify-between"><span>การวิเคราะห์:</span><span className="text-blue-400">PCA v2 Pipeline</span></div>
              <div className="flex justify-between"><span>ทางเลือก:</span><span className="text-emerald-400">แผนปฏิบัติการที่มีหลักฐาน</span></div>
            </div>
          </div>

          {/* Use Case 2 */}
          <div className="bg-[#080E24] border border-white/10 rounded-3xl p-7 flex flex-col justify-between hover:border-[#FF8A00]/50 transition-all duration-300 shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded">
                  การประเมินความเสี่ยง
                </span>
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">การประเมินความเสี่ยง</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-light mb-6">
                ประเมินความเสี่ยงจากซัพพลายเชน กฎระเบียบ ตลาด และปัจจัยภายนอกก่อนตัดสินใจ
              </p>
            </div>
            <div className="space-y-2 pt-4 border-t border-white/10 text-xs font-mono text-slate-400">
              <div className="flex justify-between"><span>ปัญหา:</span><span className="text-white">การพึ่งพาคู่ค้า</span></div>
              <div className="flex justify-between"><span>การวิเคราะห์:</span><span className="text-blue-400">วิเคราะห์ความไม่แน่นอน</span></div>
              <div className="flex justify-between"><span>ทางเลือก:</span><span className="text-emerald-400">ลดความเสี่ยงรอบด้าน</span></div>
            </div>
          </div>

          {/* Use Case 3 */}
          <div className="bg-[#080E24] border border-white/10 rounded-3xl p-7 flex flex-col justify-between hover:border-[#FF8A00]/50 transition-all duration-300 shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-purple-400 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded">
                  วิเคราะห์คู่แข่งและตลาด
                </span>
                <Search className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">วิเคราะห์คู่แข่งและตลาด</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-light mb-6">
                สังเคราะห์ข้อมูลตลาด คู่แข่ง และการเปลี่ยนแปลงของอุตสาหกรรม เพื่อสนับสนุนการตัดสินใจเชิงกลยุทธ์
              </p>
            </div>
            <div className="space-y-2 pt-4 border-t border-white/10 text-xs font-mono text-slate-400">
              <div className="flex justify-between"><span>ปัญหา:</span><span className="text-white">การเปลี่ยนแปลงตลาด</span></div>
              <div className="flex justify-between"><span>การวิเคราะห์:</span><span className="text-blue-400">การสังเคราะห์หลักฐาน</span></div>
              <div className="flex justify-between"><span>ทางเลือก:</span><span className="text-emerald-400">ปรับกลยุทธ์เชิงรุก</span></div>
            </div>
          </div>

          {/* Use Case 4 */}
          <div className="bg-[#080E24] border border-white/10 rounded-3xl p-7 flex flex-col justify-between hover:border-[#FF8A00]/50 transition-all duration-300 shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded">
                  การเปลี่ยนผ่านสู่ AI
                </span>
                <Cpu className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">การเปลี่ยนผ่านสู่ AI</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-light mb-6">
                ประเมินความพร้อม โอกาส ความเสี่ยง และแนวทางการนำ AI มาใช้ในองค์กร
              </p>
            </div>
            <div className="space-y-2 pt-4 border-t border-white/10 text-xs font-mono text-slate-400">
              <div className="flex justify-between"><span>ปัญหา:</span><span className="text-white">ความท้าทายด้านเทคโนโลยี</span></div>
              <div className="flex justify-between"><span>การวิเคราะห์:</span><span className="text-blue-400">Governance Alignment</span></div>
              <div className="flex justify-between"><span>ทางเลือก:</span><span className="text-emerald-400">แผนงานแบบมีขั้นตอน</span></div>
            </div>
          </div>

          {/* Use Case 5 */}
          <div className="bg-[#080E24] border border-white/10 rounded-3xl p-7 flex flex-col justify-between hover:border-[#FF8A00]/50 transition-all duration-300 shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded">
                  เปรียบเทียบทางเลือกเชิงกลยุทธ์
                </span>
                <Layers className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">เปรียบเทียบทางเลือกเชิงกลยุทธ์</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-light mb-6">
                วิเคราะห์ข้อดี ข้อเสีย ความเสี่ยง และผลกระทบของแต่ละทางเลือก
              </p>
            </div>
            <div className="space-y-2 pt-4 border-t border-white/10 text-xs font-mono text-slate-400">
              <div className="flex justify-between"><span>ปัญหา:</span><span className="text-white">มีทางเลือกหลายแนวทาง</span></div>
              <div className="flex justify-between"><span>การวิเคราะห์:</span><span className="text-blue-400">การประเมินข้อแลกเปลี่ยน</span></div>
              <div className="flex justify-between"><span>ทางเลือก:</span><span className="text-emerald-400">แนวทางที่เหมาะสมที่สุด</span></div>
            </div>
          </div>

          {/* Use Case 6 */}
          <div className="bg-[#080E24] border border-white/10 rounded-3xl p-7 flex flex-col justify-between hover:border-[#FF8A00]/50 transition-all duration-300 shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded">
                  ข้อมูลสำหรับผู้บริหาร
                </span>
                <FileText className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">ข้อมูลประกอบการตัดสินใจสำหรับผู้บริหาร</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-light mb-6">
                สรุปข้อมูลจากหลายแหล่งให้เป็นรายงานที่กระชับ มีหลักฐาน และตรวจสอบย้อนกลับได้
              </p>
            </div>
            <div className="space-y-2 pt-4 border-t border-white/10 text-xs font-mono text-slate-400">
              <div className="flex justify-between"><span>ปัญหา:</span><span className="text-white">ข้อมูลล้นหลาม</span></div>
              <div className="flex justify-between"><span>การวิเคราะห์:</span><span className="text-blue-400">การสังเคราะห์จากหลาย AI</span></div>
              <div className="flex justify-between"><span>ทางเลือก:</span><span className="text-emerald-400">รายงานสรุปผู้บริหาร</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 4. DECISION OUTPUT PRODUCT DEMO ================= */}
      <section id="decision-output" className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 w-full border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF8A00]/10 border border-[#FF8A00]/30 text-[#FF8A00] text-xs font-mono mb-4">
            ตัวอย่างผลลัพธ์การวิเคราะห์เพื่อการตัดสินใจ
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-light tracking-tight text-white mb-4">
            รายงานประกอบการตัดสินใจสำหรับผู้บริหาร <span className="font-bold text-[#FF8A00]">(ตัวอย่างจำลองเพื่อสาธิตความสามารถของระบบ)</span>
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-light">
            สร้างรายงานที่มีโครงสร้างชัดเจนผ่านการตรวจสอบ Governance พร้อมการอ้างอิงหลักฐานครบถ้วน
          </p>
        </div>

        {/* Executive Decision Brief UI Card */}
        <div className="bg-[#050914] border border-white/15 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden max-w-4xl mx-auto">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF8A00]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
            <div>
              <span className="text-xs font-mono text-[#FF8A00] bg-[#FF8A00]/15 border border-[#FF8A00]/40 px-3 py-1 rounded uppercase font-bold tracking-wider">
                ILLUSTRATIVE EXAMPLE — ตัวอย่างจำลองเพื่อสาธิตการทำงาน
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2">ข้อเสนอเชิงกลยุทธ์: กระจายความเสี่ยงจากการพึ่งพาซัพพลายเออร์รายเดียว</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 text-xs font-mono font-bold">
                GOVERNANCE CHECK — PASSED
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-[#FF8A00]/20 text-[#FF8A00] border border-[#FF8A00]/40 text-xs font-mono font-bold">
                ระดับความเชื่อมั่น: 87%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-5 rounded-2xl bg-[#090E20] border border-white/10 space-y-2">
              <div className="text-xs font-mono text-slate-400 uppercase">ข้อเสนอเชิงกลยุทธ์หลัก</div>
              <div className="text-base font-bold text-white">กระจายความเสี่ยงจากการพึ่งพาซัพพลายเออร์รายใหญ่ภายในไตรมาสที่ 3</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#090E20] border border-white/10 space-y-2">
              <div className="text-xs font-mono text-slate-400 uppercase">ระดับความเสี่ยงและผลกระทบ</div>
              <div className="text-base font-bold text-amber-400">ปานกลาง / ผลกระทบเชิงบวกสูง (ประหยัดงบประมาณได้ประมาณ 4.2 ล้านดอลลาร์)</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 text-center">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="text-xs font-mono text-slate-400 mb-1">หลักฐานที่ใช้</div>
              <div className="text-xl font-bold text-white">17 แหล่งข้อมูล</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="text-xs font-mono text-slate-400 mb-1">ทางเลือก</div>
              <div className="text-xl font-bold text-white">3 แนวทาง</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="text-xs font-mono text-slate-400 mb-1">ตรวจสอบ Governance</div>
              <div className="text-xl font-bold text-emerald-400">ผ่าน</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="text-xs font-mono text-slate-400 mb-1">การอนุมัติจากมนุษย์</div>
              <div className="text-xl font-bold text-[#FF8A00]">จำเป็น</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#030611] border border-white/10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div>
                <div className="text-xs font-mono text-slate-300 font-bold">บันทึกร่องรอยใน WORM Audit Trail</div>
                <div className="text-[11px] text-slate-400 font-mono">บันทึกประวัติการวิเคราะห์เพื่อให้ตรวจสอบย้อนหลังได้</div>
              </div>
            </div>
            <button
              onClick={onEnter}
              className="px-5 py-2.5 rounded-xl bg-[#FF8A00] hover:bg-[#ff9d2e] text-black text-xs font-mono font-bold tracking-wide transition-all"
            >
              ทดลองระบบเวิร์กสเปซ
            </button>
          </div>
        </div>
      </section>

      {/* ================= 5. HOW FIRE KEEPER THINKS (PCA v2) ================= */}
      <section id="how-it-thinks" className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 w-full border-t border-white/10 bg-[#040817]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono mb-4">
            PUNN COGNITIVE ARCHITECTURE (PCA v2)
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-light tracking-tight text-white mb-4">
            Fire Keeper <span className="font-bold text-[#FF8A00]">คิดและวิเคราะห์อย่างไร?</span>
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-light mb-8">
            Fire Keeper ใช้ PUNN Cognitive Architecture (PCA v2) ซึ่งเป็นกระบวนการวิเคราะห์หลายขั้นตอนที่ออกแบบมาเพื่อเปลี่ยนข้อมูลและหลักฐานที่กระจัดกระจายให้กลายเป็นข้อมูลประกอบการตัดสินใจที่มีโครงสร้าง
          </p>

          <a
            href="#architecture"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white text-sm font-mono font-bold transition-all"
          >
            ดู 12 ขั้นตอนของ PCA
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Linear Flow Diagram */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3 text-center">
          {['ข้อมูล', 'รวบรวมหลักฐาน', 'ตรวจสอบข้อมูล', 'วิเคราะห์', 'ระบุความไม่แน่นอน', 'ประเมินความเสี่ยง', 'เปรียบเทียบทางเลือก', 'ตรวจสอบ Governance', 'สร้างข้อสรุป'].map((step, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-[#080E24] border border-white/10 flex flex-col items-center justify-center">
              <span className="text-[10px] font-mono text-[#FF8A00] font-bold mb-1">0{idx + 1}</span>
              <span className="text-xs font-mono text-white font-medium">{step}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= 6. TRANSPARENT AI PROCESS (12 STAGES) ================= */}
      <section id="architecture" className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-24 w-full border-t border-white/15">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-light tracking-tight text-white mb-4">
            กระบวนการวิเคราะห์เชิงยุทธศาสตร์ 12 ขั้นตอน
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-light">
            คลิกที่แต่ละขั้นตอนเพื่อตรวจสอบการทำงานร่วมกันของ AI ในบทบาท Analyst, Critic และ Synthesizer
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Grid: 12 Stages */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PCA_STAGES.map((stage, idx) => {
              const Icon = STAGE_ICONS[stage.id] || Target;
              const isSelected = activeStageId === stage.id;
              const details = STAGE_DETAILS[stage.id];

              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStageId(stage.id)}
                  aria-expanded={isSelected}
                  className={`p-5 rounded-2xl text-left border transition-all duration-300 flex flex-col justify-between group relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#121932] to-[#080D1D] border-[#FF8A00] shadow-[0_0_25px_rgba(255,138,0,0.2)]'
                      : 'bg-[#050914] border-white/10 hover:border-white/25 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <span className="font-mono text-sm font-bold text-[#FF8A00]">
                      0{idx + 1}
                    </span>
                    <div className={`p-2.5 rounded-xl transition-colors ${
                      isSelected ? 'bg-[#FF8A00]/25 text-[#FF8A00]' : 'bg-white/5 text-slate-400 group-hover:text-white'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white mb-1.5 leading-snug">{stage.thLabel}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {details?.desc || stage.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 pt-2 border-t border-white/5">
                      <span className="text-[#FF8A00]">Analyst</span>·
                      <span className="text-blue-400">Critic</span>·
                      <span className="text-purple-400">Synthesizer</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Stage Detail Panel */}
          <div className="lg:col-span-5 sticky top-28 bg-[#050914] border border-white/15 rounded-3xl p-7 sm:p-9 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF8A00]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <span className="text-xs font-mono text-slate-400 font-bold tracking-widest uppercase">
                รายละเอียดขั้นตอนและบทบาท AI
              </span>
              <span className="text-sm font-mono text-[#FF8A00] font-bold">
                STAGE {String(activeOrderNum).padStart(2, '0')} / 12
              </span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-[#FF8A00]/15 border border-[#FF8A00]/40 text-[#FF8A00]">
                <ActiveIcon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{activeDetail.titleTh}</h3>
              </div>
            </div>

            <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-6 font-light">
              {activeDetail.desc}
            </p>

            <div className="space-y-3 mb-6 p-4 rounded-2xl bg-[#090E20] border border-white/10">
              <span className="text-xs font-mono font-bold text-[#FF8A00] uppercase tracking-wider block mb-3">
                บทบาทการทำงานร่วมกันของ AI ทั้ง 3 ตัว
              </span>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 pb-3 border-b border-white/5">
                  <div className="px-2 py-1 rounded bg-[#FF8A00]/20 text-[#FF8A00] font-mono font-bold shrink-0">AI 01</div>
                  <div>
                    <div className="font-bold text-white mb-0.5">Analyst</div>
                    <div className="text-slate-300 font-light">{activeDetail.aiRoles.analyst}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-3 border-b border-white/5">
                  <div className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-mono font-bold shrink-0">AI 02</div>
                  <div>
                    <div className="font-bold text-white mb-0.5">Critic</div>
                    <div className="text-slate-300 font-light">{activeDetail.aiRoles.critic}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 font-mono font-bold shrink-0">AI 03</div>
                  <div>
                    <div className="font-bold text-white mb-0.5">Synthesizer</div>
                    <div className="text-slate-300 font-light">{activeDetail.aiRoles.synthesizer}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 7. GOVERNANCE & TRUST LAYER ================= */}
      <section id="governance-trust" className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-24 w-full border-t border-white/10 bg-[#030611]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-4">
            สร้างมาเพื่อการตัดสินใจที่มีความเสี่ยงสูง
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-light tracking-tight text-white mb-4">
            การกำกับดูแลและความน่าเชื่อถือระดับองค์กร
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-light">
            Fire Keeper ออกแบบกระบวนการให้ตรวจสอบแหล่งข้อมูล แยกข้อเท็จจริงกับข้อสมมติ และมีความรับผิดชอบโดยมนุษย์ (Human Accountability)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-7 rounded-3xl bg-[#050914] border border-white/10 space-y-3">
            <ShieldCheck className="w-8 h-8 text-[#FF8A00]" />
            <h3 className="text-xl font-bold text-white">การสังเคราะห์หลักฐาน (Evidence Synthesis)</h3>
            <p className="text-sm text-slate-300 font-light leading-relaxed">
              รวบรวมข้อมูลจากหลายแหล่งและนำมาเชื่อมโยงเพื่อสร้างภาพรวมที่ใช้ประกอบการตัดสินใจอย่างมีโครงสร้าง
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-[#050914] border border-white/10 space-y-3">
            <Lock className="w-8 h-8 text-blue-400" />
            <h3 className="text-xl font-bold text-white">WORM Audit Trail</h3>
            <p className="text-sm text-slate-300 font-light leading-relaxed">
              บันทึกร่องรอยของกระบวนการวิเคราะห์และผลลัพธ์ใน Audit Trail เพื่อให้สามารถตรวจสอบย้อนหลังได้
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-[#050914] border border-white/10 space-y-3">
            <Users className="w-8 h-8 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">ความรับผิดชอบโดยมนุษย์ (Human Accountability)</h3>
            <p className="text-sm text-slate-300 font-light leading-relaxed">
              AI ทำหน้าที่วิเคราะห์และนำเสนอทางเลือก แต่การตัดสินใจขั้นสุดท้ายและการอนุมัติยังคงอยู่ภายใต้การควบคุมของมนุษย์
            </p>
          </div>
        </div>

        {/* Standards Alignment */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#050914] border border-white/15 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold text-white mb-3">ออกแบบโดยอ้างอิงมาตรฐานสากล</h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light mb-6">
              โครงสร้างระบบได้รับการออกแบบโดยอ้างอิงแนวทางปฏิบัติด้าน AI Governance เพื่อความโปร่งใสและการบริหารความเสี่ยงระดับองค์กร
            </p>
            <div className="space-y-3 text-sm font-mono text-slate-300">
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> ออกแบบโดยอ้างอิงแนวทาง ISO/IEC 42001</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> ออกแบบโดยอ้างอิงแนวทาง NIST AI RMF</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> WORM Immutable Decision Logging</div>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-[#090E20] border border-white/10 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <span className="text-slate-400">ตรวจสอบแหล่งข้อมูล</span>
              <span className="text-emerald-400 font-bold">ผ่าน</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <span className="text-slate-400">แยกข้อเท็จจริงกับข้อสมมติ</span>
              <span className="text-emerald-400 font-bold">ผ่าน</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">ตรวจสอบกระบวนการ AI</span>
              <span className="text-emerald-400 font-bold">ผ่าน</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 8. ILLUSTRATIVE DECISION SCENARIOS (PROOF) ================= */}
      <section id="scenarios" className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 w-full border-t border-white/10 bg-[#040817]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono mb-4">
            ตัวอย่างสถานการณ์จำลอง
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-light tracking-tight text-white mb-4">
            ตัวอย่างสถานการณ์จำลองเพื่อสาธิตความสามารถของระบบ
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-light">
            จำลองสถานการณ์ความท้าทายทางธุรกิจ เพื่อแสดงกระบวนการวิเคราะห์เชิงลึกของ Fire Keeper
          </p>
        </div>

        <div className="p-8 sm:p-12 rounded-3xl bg-[#050914] border border-white/15 max-w-4xl mx-auto space-y-8 shadow-2xl">
          <div className="flex items-center gap-4 border-b border-white/10 pb-6">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-lg font-bold">
              สถานการณ์จำลอง
            </div>
            <div>
              <div className="text-xs font-mono text-slate-400">เหตุการณ์กระตุ้น</div>
              <h3 className="text-xl font-bold text-white">“ซัพพลายเออร์รายใหญ่ประกาศขึ้นราคาชิ้นส่วน 18%”</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-[#090E20] border border-white/10 space-y-2">
              <div className="text-xs font-mono text-[#FF8A00] font-bold">1. วิเคราะห์ผลกระทบด้านต้นทุน</div>
              <p className="text-sm text-slate-300 font-light">ประเมินแรงกดดันต่ออัตรากำไรและต้นทุนรวมของสายผลิตภัณฑ์หลัก</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#090E20] border border-white/10 space-y-2">
              <div className="text-xs font-mono text-blue-400 font-bold">2. วิเคราะห์ความเสี่ยงของ Supply Chain</div>
              <p className="text-sm text-slate-300 font-light">ตรวจสอบทางเลือกซัพพลายเออร์สำรองในภูมิภาคอื่นและประเมินระยะเวลาการเตรียมพร้อม</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#090E20] border border-white/10 space-y-2">
              <div className="text-xs font-mono text-purple-400 font-bold">3. เปรียบเทียบทางเลือกเชิงกลยุทธ์</div>
              <p className="text-sm text-slate-300 font-light">ประเมินข้อดี-ข้อเสียระหว่างการเจรจาต่อรอง การเปลี่ยนซัพพลายเออร์ หรือการปรับโครงสร้างต้นทุน</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#090E20] border border-white/10 space-y-2">
              <div className="text-xs font-mono text-emerald-400 font-bold">4. ตรวจสอบ Governance และสร้าง Decision Record</div>
              <p className="text-sm text-slate-300 font-light">บันทึกผลการวิเคราะห์และหลักฐานทั้งหมดลงใน Audit Trail เพื่อประกอบการพิจารณาของคณะกรรมการ</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 9. WHY FIRE KEEPER (NOT JUST ANOTHER AI ASSISTANT) ================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 w-full border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-light tracking-tight text-white mb-4">
            Fire Keeper แตกต่างจาก AI ทั่วไปอย่างไร?
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-light">
            โดยทั่วไปเน้นการสนทนาและการสร้างคำตอบ ขณะที่ Fire Keeper ออกแบบกระบวนการให้เน้นการวิเคราะห์ การตรวจสอบ และการจัดทำ Decision Record
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-[#050914] border border-white/10 space-y-4">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block">AI ทั่วไป (AI Assistant)</span>
            <h3 className="text-2xl font-bold text-slate-300">คำถาม → คำตอบ</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              เน้นการตอบคำถามทั่วไปตามชุดข้อมูลการฝึกอบรม โดยไม่มีกระบวนการตรวจสอบหลักฐานหรือบันทึกประวัติการตัดสินใจที่เป็นทางการ
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0c132f] to-[#070b1d] border border-[#FF8A00]/40 space-y-4 shadow-xl">
            <span className="text-xs font-mono text-[#FF8A00] uppercase tracking-widest block font-bold">FIRE KEEPER OS</span>
            <h3 className="text-2xl font-bold text-white">ปัญหาธุรกิจ → หลักฐาน → การวิเคราะห์ → ความเสี่ยง → ทางเลือก → Governance → การตัดสินใจ → Audit Trail</h3>
            <p className="text-sm text-slate-300 leading-relaxed font-light">
              กระบวนการวิเคราะห์เชิงลึกที่ตรวจสอบได้ทุกขั้นตอน พร้อมระบบกำกับดูแลและบันทึก WORM Audit Trail สำหรับองค์กร
            </p>
          </div>
        </div>
      </section>

      {/* ================= 10. EXECUTIVE CTA / CONVERSION FUNNEL ================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-24 w-full">
        <div className="relative p-10 sm:p-14 lg:p-16 rounded-3xl bg-gradient-to-r from-[#070C1B] via-[#0A1026] to-[#070C1B] border border-white/15 shadow-2xl overflow-hidden text-center max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-bold text-white leading-[1.2]">
            พร้อมยกระดับการตัดสินใจเชิงกลยุทธ์ของ <span className="text-[#FF8A00]">องค์กรหรือยัง?</span>
          </h2>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-light">
            สัมผัสกระบวนการวิเคราะห์ที่รวมหลักฐาน เหตุผล ความเสี่ยง ทางเลือก และ Governance ไว้ในกระบวนการเดียว
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onEnter}
              aria-label="ดูตัวอย่างการทำงาน"
              className="w-full sm:w-auto px-10 py-4 rounded-xl bg-[#FF8A00] hover:bg-[#ff9d2e] text-black text-base font-mono font-bold tracking-wide transition-all shadow-[0_0_30px_rgba(255,138,0,0.35)] flex items-center justify-center gap-3"
            >
              ดูตัวอย่างการทำงาน
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsTraceModalOpen(true)}
              aria-label="ตรวจสอบหลักฐาน MULTI-AI LEDGER"
              className="w-full sm:w-auto px-10 py-4 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-base font-mono font-bold tracking-wide transition-all flex items-center justify-center gap-3"
            >
              <Cpu className="w-5 h-5" />
              ตรวจสอบหลักฐาน MULTI-AI LEDGER
            </button>
            <button
              onClick={onEnter}
              aria-label="ขอชมระบบสำหรับองค์กร"
              className="w-full sm:w-auto px-10 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white text-base font-mono font-bold tracking-wide transition-all flex items-center justify-center gap-3"
            >
              ขอชมระบบสำหรับองค์กร
            </button>
          </div>
        </div>
      </section>

      {/* ================= 11. FOOTER ================= */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-[#030611] py-10 px-6 sm:px-16 text-slate-400 text-sm font-mono mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <Flame className="w-5 h-5 text-[#FF8A00]" />
            <span className="font-bold text-white text-sm">FIRE KEEPER OS v2.0</span>
          </div>

          <div className="text-xs sm:text-sm text-slate-300">
            แพลตฟอร์ม Decision Intelligence และ AI Governance สำหรับองค์กร
          </div>

          <div className="text-xs">
            &copy; 2026 FIRE KEEPER. All rights reserved.
          </div>
        </div>
      </footer>

      {/* AI Execution Trace Modal */}
      <AIExecutionTraceModal isOpen={isTraceModalOpen} onClose={() => setIsTraceModalOpen(false)} />
    </div>
  );
};
