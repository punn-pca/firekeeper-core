import React, { useState } from 'react';
import {
  Flame,
  ArrowRight,
  ShieldCheck,
  Activity,
  Eye,
  Brain,
  Target,
  Database,
  Network,
  Sparkles,
  Compass,
  MessageSquare,
  RotateCcw,
  GraduationCap,
  AlertTriangle,
  Sun,
  Moon,
  Lock,
  FileCheck2,
  Scale,
  Cpu,
  Layers,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sliders,
  BarChart3,
  Search,
  FileText
} from 'lucide-react';
import { PCA_STAGES } from '../types';
import { useTheme } from '../context/ThemeContext';

interface LandingPageProps {
  onEnter: () => void;
  isLight?: boolean;
}

// Map PCA stage IDs to lucide icons
const STAGE_ICONS: Record<string, React.ComponentType<any>> = {
  INTENT_DEFINITION: Eye,
  CONTEXT_UNDERSTANDING: Brain,
  PURPOSE_SCOPE: Target,
  DATA_STRUCTURING: Database,
  RELATIONSHIP_MODELING: Network,
  HYPOTHESIS_FORMATION: Sparkles,
  EVIDENCE_EVALUATION: ShieldCheck,
  RISK_CRITIQUE_ANALYSIS: AlertTriangle,
  STRATEGIC_OPTIONS: Compass,
  ANALYSIS_COMMUNICATION: MessageSquare,
  REVIEW_VERIFICATION: RotateCcw,
  CONTINUOUS_IMPROVEMENT: GraduationCap,
};

// Map stages to verifiable technical contracts and inputs/outputs
const STAGE_TECHNICAL_SPEC: Record<string, {
  phase: string;
  focus: string;
  input: string;
  output: string;
  algorithm: string;
  guarantee: string;
}> = {
  INTENT_DEFINITION: {
    phase: 'Phase 1: Ingestion & Intent',
    focus: 'Signal Parsing & Goal Disambiguation',
    input: 'คำถามดิบของผู้ใช้ (Raw Query), เอกสารแนบ (Attachments), Tone Directive',
    output: 'โครงสร้างเจตนา (Intent Vector), ประเด็นสำคัญ (Saliency Map), ขอบเขตคำถาม',
    algorithm: 'Semantic Token Dissection & Query Classification',
    guarantee: 'จำแนกเป้าหมายแท้จริง ปราศจากการคาดเดาเจตนาที่คลาดเคลื่อน'
  },
  CONTEXT_UNDERSTANDING: {
    phase: 'Phase 1: Ingestion & Intent',
    focus: 'Deep Context & Constraint Extraction',
    input: 'Saliency Map, ประวัติสนทนาในเซสชัน, กรอบเงื่อนไขภายนอก',
    output: 'Semantic Representation Network, รายการข้อจำกัด (Hard & Soft Constraints)',
    algorithm: 'Contextual Dependency Extraction & Ontology Mapping',
    guarantee: 'ระบุเงื่อนไขบังคับและบริบทแวดล้อมอย่างครบถ้วนก่อนการวิเคราะห์'
  },
  PURPOSE_SCOPE: {
    phase: 'Phase 1: Ingestion & Intent',
    focus: 'Strategic Purpose & Governance Boundaries',
    input: 'Semantic Representation, เกณฑ์ความสำเร็จที่ผู้ใช้กำหนด',
    output: 'เกณฑ์ความสำเร็จ (Success Criteria), ขอบเขตนโยบายความปลอดภัย (Policy Boundaries)',
    algorithm: 'Objective Function Formulation & Scope Delimitation',
    guarantee: 'กำหนดพรมแดนการคิดและกฎธรรมาภิบาล ป้องกันการหลุดกรอบ'
  },
  DATA_STRUCTURING: {
    phase: 'Phase 2: Structuring & Memory',
    focus: 'Taxonomy Extraction & Memory Retrieval Gate',
    input: 'Target Scope, คำค้นหลัก, ฐานข้อมูล Long-Term Memory (LTM)',
    output: 'ข้อมูลจัดระเบียบเชิงอนุกรมวิธาน (Taxonomy), คลังความจำที่ผ่าน Hard Relevance Gate',
    algorithm: 'Cosine Similarity & Cross-Encoder Hard Relevance Gating',
    guarantee: 'คัดกรองเฉพาะความจำที่เกี่ยวข้องจริง ป้องกันการปนเปื้อนของบริบทเก่า'
  },
  RELATIONSHIP_MODELING: {
    phase: 'Phase 2: Structuring & Memory',
    focus: 'Causal Dependencies & Directed Acyclic Graph',
    input: 'ความจำที่คัดกรองแล้ว, ข้อมูลปัจจัยแวดล้อม',
    output: 'Directed Acyclic Graph (DAG) แสดงความสัมพันธ์เชิงเหตุและผล',
    algorithm: 'Causal Graph Construction & Structural Equation Modeling',
    guarantee: 'สร้างแผนผังตรรกะเชื่อมโยงเหตุและผล โปร่งใส ตรวจสอบย้อนกลับได้ทุกข้อต่อ'
  },
  HYPOTHESIS_FORMATION: {
    phase: 'Phase 3: Hypotheses & Epistemic Evidence',
    focus: 'Analysis of Competing Hypotheses (ACH)',
    input: 'Causal DAG, ปัจจัยเชิงยุทธศาสตร์, ความรู้พื้นฐาน',
    output: 'ชุดสมมติฐานทางเลือกคู่ขนาน (H1, H2, H3) พร้อมคำนวณ Bayesian Prior',
    algorithm: 'Heckman/Richards ACH Framework & Bayesian Prior Estimation',
    guarantee: 'ป้องกัน Confirmation Bias โดยการทดสอบสมมติฐานคู่แข่งอย่างเป็นธรรม'
  },
  EVIDENCE_EVALUATION: {
    phase: 'Phase 3: Hypotheses & Epistemic Evidence',
    focus: 'Epistemic Grounding & Admiralty Reliability Grading',
    input: 'สมมติฐานเป้าหมาย, แหล่งข้อมูลและเอกสารอ้างอิง',
    output: 'การจำแนกตาม Evidence Taxonomy (FACT, INFERENCE, UNCERTAINTY) พร้อมเกรด A-F',
    algorithm: 'Admiralty Intelligence Standard & Tri-State Epistemic Verification',
    guarantee: 'แยกข้อเท็จจริงออกจากข้ออนุมานอย่างเด็ดขาด ไร้การอ้างหลักฐานลอยๆ'
  },
  RISK_CRITIQUE_ANALYSIS: {
    phase: 'Phase 4: Adversarial Critique & Calibration',
    focus: 'Adversarial Red-Team & Vulnerability Critique',
    input: 'ข้อสรุปเบื้องต้น, จุดเชื่อมโยงใน Causal DAG, สภาพแวดล้อมภายนอก',
    output: 'การวิพากษ์จุดเปราะบาง (Vulnerability Assessment), การตรวจจับความขัดแย้ง, รายการความเสี่ยง',
    algorithm: 'Failure Mode & Effects Analysis (FMEA) & Second-Order Impact Modeling',
    guarantee: 'ค้นหาจุดบอด ความเสี่ยงที่แฝงอยู่ และผลกระทบข้างเคียงก่อนสรุปคำตอบ'
  },
  STRATEGIC_OPTIONS: {
    phase: 'Phase 4: Adversarial Critique & Calibration',
    focus: 'Strategic Trade-offs & Decomposed Confidence',
    input: 'สมมติฐานที่ผ่านการวิพากษ์, เกรดความน่าเชื่อถือของหลักฐาน, ระดับความเสี่ยง',
    output: 'เมทริกซ์เปรียบเทียบทางเลือก (Option A/B/C), คะแนนความเชื่อมั่นที่สอบเทียบแล้ว (Calibrated Confidence Score)',
    algorithm: 'Multi-Criteria Decision Analysis (MCDA) & Uncertainty Calibration',
    guarantee: 'แสดงข้อดี ข้อเสีย และสิ่งที่ต้องแลก (Trade-offs) ของแต่ละทางเลือกอย่างโปร่งใส'
  },
  ANALYSIS_COMMUNICATION: {
    phase: 'Phase 5: Synthesis & Sovereign Gate',
    focus: 'Executive Decision Intelligence Synthesis',
    input: 'ชุดทางเลือกที่ประเมินแล้ว, รายการความเสี่ยง, ดัชนีความไม่แน่นอน',
    output: 'รายงานผลระดับบริหาร (Executive Intelligence Report) พร้อม Stream แบบ Real-time',
    algorithm: 'Structured Executive Synthesis & Tone Alignment Directive',
    guarantee: 'นำเสนอข้อค้นพบอย่างกระชับ สุขุม ชัดเจน และตรงไปตรงมา'
  },
  REVIEW_VERIFICATION: {
    phase: 'Phase 5: Synthesis & Sovereign Gate',
    focus: 'Meta-Reflection & Anti-Fabrication Audit',
    input: 'ร่างรายงานบทวิเคราะห์, บันทึกการให้เหตุผล (Reasoning Trace)',
    output: 'บันทึกการทบทวนตนเอง (Meta-Reflection Log), การตรวจสอบตามกฎ ISO/IEC 42001 & NIST AI RMF',
    algorithm: '12-Rule Anti-Fabrication Heuristic & Policy Conformance Audit',
    guarantee: 'ตรวจสอบความถูกต้อง 100% ป้องกันข้อความที่ผิดตรรกะหรือสร้างขึ้นเอง'
  },
  CONTINUOUS_IMPROVEMENT: {
    phase: 'Phase 5: Synthesis & Sovereign Gate',
    focus: 'Inviolable Human Agency & Long-Term Learning',
    input: 'รายงานฉบับสมบูรณ์, การยืนยันสิทธิ์ของมนุษย์ (Human Decision Token)',
    output: 'บันทึกการประเมินเพื่อการเรียนรู้ระยะยาว, การคงไว้ซึ่งอำนาจตัดสินใจของมนุษย์',
    algorithm: 'Level-3 Hard Stop Human Agency Gate & Cryptographic Audit Hash',
    guarantee: 'มนุษย์คือผู้มีอำนาจตัดสินใจขั้นสูงสุดแต่เพียงผู้เดียว (Human Sovereignty)'
  }
};

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, isLight: propIsLight }) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = propIsLight !== undefined ? propIsLight : theme === 'light';

  const [activeStageId, setActiveStageId] = useState<string>('EVIDENCE_EVALUATION');
  const [selectedWorkflowStep, setSelectedWorkflowStep] = useState<number>(2);

  // Workflow pipeline nodes matching the live engine architecture
  const workflowSteps = [
    {
      step: 1,
      id: 'input',
      title: '1. Structured Input',
      sub: 'Input Ingestion & Intent Definition',
      desc: 'รับโจทย์ยุทธศาสตร์ ข้อซักถาม หรือเอกสารแนบ ถอดรหัสเจตนาและข้อจำกัดอย่างเป็นระบบ',
      badge: 'Signal Parsing',
      metric: 'Stage 01-03'
    },
    {
      step: 2,
      id: 'evidence',
      title: '2. Epistemic Evidence',
      sub: 'Taxonomy & Admiralty Grading',
      desc: 'จำแนกข้อมูลเป็น FACT, INFERENCE และ UNCERTAINTY พร้อมถ่วงน้ำหนักความน่าเชื่อถือเกรด A-F',
      badge: 'Tri-State Gate',
      metric: 'Stage 04-07'
    },
    {
      step: 3,
      id: 'reasoning',
      title: '3. Causal & ACH Reasoning',
      sub: 'DAG & Bayesian Hypothesis',
      desc: 'สร้างแผนผังตรรกะแบบ Directed Acyclic Graph และทดสอบสมมติฐานคู่แข่งคู่ขนาน',
      badge: 'Causal Graph',
      metric: 'Stage 05-06'
    },
    {
      step: 4,
      id: 'risk',
      title: '4. Adversarial Critique',
      sub: 'Red-Team Vulnerability & Trade-offs',
      desc: 'วิพากษ์จุดบอด วิเคราะห์ความเสี่ยงรอบด้าน และคำนวณ Calibrated Confidence ตามคุณภาพหลักฐาน',
      badge: 'FMEA Risk Model',
      metric: 'Stage 08-09'
    },
    {
      step: 5,
      id: 'human',
      title: '5. Human Decision Gate',
      sub: 'Inviolable Human Sovereignty',
      desc: 'รายงานข้อสรุปความเสี่ยงและทางเลือก โดยสงวนอำนาจการตัดสินใจขั้นสูงสุดไว้ที่มนุษย์',
      badge: 'Level 3 Hard Stop',
      metric: 'Stage 10-12'
    }
  ];

  const currentStage = PCA_STAGES.find(s => s.id === activeStageId) || PCA_STAGES[0];
  const currentStageIndex = PCA_STAGES.findIndex(s => s.id === activeStageId);
  const currentStageNum = currentStageIndex !== -1 ? currentStageIndex + 1 : 1;
  const CurrentStageIcon = STAGE_ICONS[activeStageId] || Brain;
  const currentStageSpec = STAGE_TECHNICAL_SPEC[activeStageId] || STAGE_TECHNICAL_SPEC.INTENT_DEFINITION;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-[#FF8A00] selection:text-black ${
      isLight ? 'bg-[#F6F8FB] text-[#172033]' : 'bg-[#07090D] text-[#F5F7FA]'
    }`}>
      
      {/* ── TOP PRODUCT-GRADE NAVIGATION ── */}
      <header className={`sticky top-0 z-50 w-full backdrop-blur-md border-b px-4 sm:px-8 lg:px-12 py-3.5 flex items-center justify-between transition-colors ${
        isLight ? 'bg-white/90 border-[#D9E1EA] shadow-xs' : 'bg-[#07090D]/90 border-white/10 shadow-md'
      }`}>
        {/* Brand identity */}
        <div className="flex items-center gap-3 select-none shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FF8A00] to-[#E06C00] p-0.5 flex items-center justify-center shadow-md">
            <div className={`w-full h-full rounded-[6px] flex items-center justify-center ${isLight ? 'bg-white' : 'bg-[#07090D]'}`}>
              <Flame className="w-4 h-4 text-[#FF8A00]" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className={`font-mono font-bold tracking-tight text-sm sm:text-base ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                FIRE KEEPER
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border text-[#FF8A00] bg-[#FF8A00]/10 border-[#FF8A00]/30">
                PCA v3.0
              </span>
            </div>
            <span className={`text-[10px] hidden sm:block ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
              Truth-First Cognitive Decision System
            </span>
          </div>
        </div>

        {/* Desktop Navigation Anchors */}
        <nav className={`hidden lg:flex items-center gap-6 text-xs font-medium ${
          isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'
        }`}>
          <a href="#philosophy" className={`transition-colors ${isLight ? 'hover:text-[#172033]' : 'hover:text-white'}`}>
            ปรัชญาและหลักการ
          </a>
          <a href="#workflow" className={`transition-colors ${isLight ? 'hover:text-[#172033]' : 'hover:text-white'}`}>
            ลำดับการทำงาน
          </a>
          <a href="#pca-architecture" className={`transition-colors ${isLight ? 'hover:text-[#172033]' : 'hover:text-white'}`}>
            สถาปัตยกรรม 12 ขั้นตอน
          </a>
          <a href="#capabilities" className={`transition-colors ${isLight ? 'hover:text-[#172033]' : 'hover:text-white'}`}>
            ขีดความสามารถ
          </a>
          <a href="#human-gate" className={`transition-colors ${isLight ? 'hover:text-[#172033]' : 'hover:text-white'}`}>
            Human Decision Gate
          </a>
          <a href="#governance" className={`transition-colors ${isLight ? 'hover:text-[#172033]' : 'hover:text-white'}`}>
            ธรรมาภิบาล & มาตรฐาน
          </a>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isLight 
                ? 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#172033] border-[#D9E1EA]' 
                : 'bg-[#0F131A] hover:bg-[#151B24] text-amber-400 border-white/10'
            }`}
            title={isLight ? 'สลับเป็นโหมดมืด (Dark Mode)' : 'สลับเป็นโหมดสว่าง (Light Mode)'}
            aria-label="Toggle theme"
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onEnter}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#FF8A00] to-[#E06C00] hover:from-[#FF9E22] hover:to-[#FF7700] text-black text-xs font-mono font-bold tracking-wider transition-all duration-200 shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>เข้าสู่ Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── 1. HERO SECTION ── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-14 pb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* System Status & Technology line */}
            <div className="space-y-2">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono ${
                isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}>
                <span className="w-2 h-2 rounded-full bg-[#FF8A00] animate-pulse" />
                <span>Powered by PUNN Predictive Cognitive Architecture (PCA)</span>
              </div>
            </div>

            {/* Main Headline H1 & Subtitle */}
            <div>
              <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.25] sm:leading-[1.2] ${
                isLight ? 'text-[#172033]' : 'text-white'
              }`}>
                FIRE KEEPER
              </h1>
              <p className="text-base sm:text-lg lg:text-xl font-semibold text-[#FF8A00] mt-2">
                Enterprise Executive Decision Intelligence &amp; AI Governance Platform
              </p>
            </div>

            {/* Core Definition of the System & PUNN PCA */}
            <div className={`space-y-3.5 text-sm sm:text-base leading-relaxed max-w-2xl p-4 sm:p-5 rounded-xl border ${
              isLight 
                ? 'bg-slate-50/80 border-slate-200 text-slate-700' 
                : 'bg-slate-900/60 border-slate-800/80 text-slate-200'
            }`}>
              <p className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <strong className="text-[#FF8A00]">FIRE KEEPER</strong> คือแพลตฟอร์มปัญญาการตัดสินใจสำหรับผู้บริหารระดับองค์กรและธรรมาภิบาล AI ซึ่งออกแบบมาเพื่อช่วยองค์กรวิเคราะห์ข้อมูลที่ซับซ้อน ประเมินความเสี่ยง และสนับสนุนการตัดสินใจที่มีความมั่นใจสูง
              </p>
              <p className={`text-xs sm:text-sm pt-2 border-t ${
                isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-300'
              }`}>
                <strong className="text-[#FF8A00]">PUNN Predictive Cognitive Architecture (PCA)</strong> คือสถาปัตยกรรมพื้นฐานที่ขับเคลื่อน FIRE KEEPER โดยจัดเตรียมกรอบการทำงานที่มีโครงสร้างสำหรับ บริบท หลักฐาน การให้เหตุผล และปัญญาด้านการตัดสินใจ
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <button
                type="button"
                onClick={onEnter}
                className="px-6 py-3 rounded-xl bg-[#FF8A00] hover:bg-[#E06C00] text-black font-mono font-bold text-xs tracking-wider transition-all duration-200 shadow-md flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>เริ่มต้นวิเคราะห์ใน Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#workflow"
                className={`px-5 py-3 rounded-xl border font-mono text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  isLight 
                    ? 'bg-white hover:bg-[#F1F5F9] border-[#D9E1EA] text-[#172033]' 
                    : 'bg-[#0F131A] hover:bg-[#151B24] border-white/10 text-[#F5F7FA]'
                }`}
              >
                <span>ดูขั้นตอนการทำงานจริง</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#FF8A00]" />
              </a>
            </div>

            {/* Live Trust Metrics Strip */}
            <div className={`pt-4 border-t grid grid-cols-3 gap-3 text-left font-mono ${
              isLight ? 'border-[#D9E1EA]' : 'border-white/10'
            }`}>
              <div>
                <div className="text-[10px] uppercase text-[#6B7280]">Pipeline Depth</div>
                <div className={`text-sm font-bold mt-0.5 ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                  12 PCA Stages
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-[#6B7280]">Epistemic Logic</div>
                <div className={`text-sm font-bold mt-0.5 ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                  Admiralty A-F
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-[#6B7280]">Human Control</div>
                <div className="text-sm font-bold text-emerald-500 mt-0.5">
                  Level-3 Gate
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Decision Intelligence Blueprint Card */}
          <div className={`lg:col-span-5 border rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden text-left ${
            isLight ? 'bg-white border-[#D9E1EA]' : 'bg-[#0F131A] border-white/10'
          }`}>
            <div className="flex items-center justify-between border-b pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FF8A00] animate-pulse" />
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                  isLight ? 'text-[#172033]' : 'text-white'
                }`}>
                  Live Cognitive Trace (PCA State)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
                AUDITED
              </span>
            </div>

            {/* Visual Trace Stack */}
            <div className="space-y-2.5 font-mono text-xs">
              <div className={`p-3 rounded-lg border ${
                isLight ? 'bg-[#F8FAFC] border-[#D9E1EA]' : 'bg-[#151B24] border-white/5'
              }`}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#FF8A00] font-bold">01. INTENT & SALIENCY</span>
                  <span className="text-[10px] text-emerald-500">100% Extracted</span>
                </div>
                <p className={`text-[11px] ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                  ถอดรหัสเจตนายุทธศาสตร์และข้อจำกัดบริบท (Constraint Ingestion)
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${
                isLight ? 'bg-[#F8FAFC] border-[#D9E1EA]' : 'bg-[#151B24] border-white/5'
              }`}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-sky-400 font-bold">02. EPISTEMIC TAXONOMY</span>
                  <span className="text-[10px] text-sky-400">Admiralty Grade A</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="taxonomy-badge taxonomy-badge-fact text-[10px] m-0">FACT: 4</span>
                  <span className="taxonomy-badge taxonomy-badge-inference text-[10px] m-0">INFERENCE: 2</span>
                  <span className="taxonomy-badge taxonomy-badge-uncertainty text-[10px] m-0">UNCERTAIN: 1</span>
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${
                isLight ? 'bg-[#F8FAFC] border-[#D9E1EA]' : 'bg-[#151B24] border-white/5'
              }`}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-purple-400 font-bold">03. ADVERSARIAL CRITIQUE</span>
                  <span className="text-[10px] text-purple-400">FMEA Audited</span>
                </div>
                <p className={`text-[11px] ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                  วิพากษ์จุดเปราะบาง (FMEA) & ประเมินผลกระทบขั้นที่สอง
                </p>
              </div>

              <div className={`p-3 rounded-lg border border-amber-500/30 ${
                isLight ? 'bg-amber-50/70' : 'bg-amber-500/10'
              }`}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-amber-500 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    04. HUMAN SOVEREIGNTY GATE
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Level-3 Stop</span>
                </div>
                <p className={`text-[11px] ${isLight ? 'text-amber-900' : 'text-amber-200'}`}>
                  สงวนสิทธิ์การอนุมัติและตัดสินใจขั้นสุดท้ายโดยมนุษย์ผู้มีอำนาจ
                </p>
              </div>
            </div>

            {/* Live Verification Footer */}
            <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[10px] font-mono ${
              isLight ? 'border-[#D9E1EA] text-[#6B7280]' : 'border-white/10 text-[#6B7280]'
            }`}>
              <span>WebCrypto Integrity Hash: SHA-256</span>
              <span className="text-emerald-500 font-bold">● TAMPER-PROOF</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. PROBLEM & PHILOSOPHY SECTION ── */}
      <section id="philosophy" className={`py-16 border-t ${
        isLight ? 'bg-white border-[#D9E1EA]' : 'bg-[#0F131A] border-white/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 text-left">
          
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono font-bold text-[#FF8A00] uppercase tracking-wider">
              ปรัชญาและหลักการ (Core Philosophy)
            </span>
            <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight mt-1.5 ${
              isLight ? 'text-[#172033]' : 'text-white'
            }`}>
              AI ไม่ได้มาเพื่อ “ตัดสินใจแทนมนุษย์” แต่มาเพื่อช่วยให้ “มนุษย์ตัดสินใจได้รอบคอบที่สุด”
            </h2>
            <p className={`text-sm mt-3 leading-relaxed ${
              isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'
            }`}>
              ในโลกที่ Generative AI มักสร้างคำตอบด้วยความมั่นใจเกินจริง (Hallucinated Certainty) FIRE KEEPER ถูกออกแบบขึ้นมาเพื่อทำหน้าที่เป็น <strong>เครื่องมือจัดระเบียบตรรกะและประเมินหลักฐาน</strong> โดยไม่สร้างภาพลวงตาของการรู้แจ้ง
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Problem of Black-Box AI */}
            <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-[#F8FAFC] border-[#D9E1EA]' : 'bg-[#07090D] border-white/10'
            }`}>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className={`text-base font-bold ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                  กับดักของ Black-Box AI
                </h3>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                  AI ทั่วไปมักให้คำตอบแบบสรุปความทางเดียว ไม่เปิดเผยตรรกะเบื้องหลัง ไม่แยกแยะข้อเท็จจริงออกจากความเห็น และไม่กล้าระบุว่าตนเอง &ldquo;ไม่รู้&rdquo; ในจุดที่มีข้อมูลไม่เพียงพอ
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-rose-500/20 text-[11px] font-mono text-rose-500 font-semibold">
                ความเสี่ยง: การตัดสินใจบนภาพลวงตา
              </div>
            </div>

            {/* Card 2: Cognitive Structuring */}
            <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-[#F8FAFC] border-[#D9E1EA]' : 'bg-[#07090D] border-white/10'
            }`}>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className={`text-base font-bold ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                  การจัดระเบียบตรรกะที่โปร่งใส
                </h3>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                  FIRE KEEPER ช่วยสกัดโครงข่ายความสัมพันธ์เชิงเหตุและผล (Causal DAG), สร้างสมมติฐานคู่แข่ง (ACH) และประเมินน้ำหนักของหลักฐานตามมาตรฐานหน่วยข่าวกรองอย่างโปร่งใส
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-sky-500/20 text-[11px] font-mono text-sky-400 font-semibold">
                ผลลัพธ์: ตรวจสอบที่มาของเหตุผลได้ 100%
              </div>
            </div>

            {/* Card 3: Human Sovereignty */}
            <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-[#F8FAFC] border-[#D9E1EA]' : 'bg-[#07090D] border-white/10'
            }`}>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#FF8A00] flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className={`text-base font-bold ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                  อำนาจการตัดสินใจเป็นของมนุษย์
                </h3>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                  มนุษย์คือผู้รับผิดชอบต่อผลกระทบเชิงกลยุทธ์ จริยธรรม และกฎหมาย ระบบจึงมีเกณฑ์ Human Agency Gate ที่หยุดกระบวนการอัตโนมัติเมื่อพบความเสี่ยงสูง เพื่อรอการอนุมัติจากมนุษย์
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-500/20 text-[11px] font-mono text-[#FF8A00] font-semibold">
                จุดยืน: Inviolable Human Agency
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. HOW FIRE KEEPER WORKS (WORKFLOW & PIPELINE) ── */}
      <section id="workflow" className={`py-16 border-t ${
        isLight ? 'bg-[#F6F8FB] border-[#D9E1EA]' : 'bg-[#07090D] border-white/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 text-left">
          
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-mono font-bold text-[#FF8A00] uppercase tracking-wider">
              ลำดับการทำงานจริง (Cognitive Workflow)
            </span>
            <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight mt-1.5 ${
              isLight ? 'text-[#172033]' : 'text-white'
            }`}>
              จากข้อมูลดิบ สู่การตัดสินใจที่มั่นใจได้ใน 5 ขั้นตอนหลัก
            </h2>
            <p className={`text-sm mt-2 leading-relaxed ${
              isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'
            }`}>
              คลิกเลือกแต่ละขั้นตอนเพื่อดูรายละเอียดการประมวลผลภายในระบบจริง
            </p>
          </div>

          {/* Workflow Interactive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {workflowSteps.map((ws) => {
              const isSelected = selectedWorkflowStep === ws.step;
              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => setSelectedWorkflowStep(ws.step)}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? isLight
                        ? 'bg-white border-[#FF8A00] shadow-md ring-1 ring-[#FF8A00]'
                        : 'bg-[#0F131A] border-[#FF8A00] shadow-md ring-1 ring-[#FF8A00]'
                      : isLight
                        ? 'bg-white border-[#D9E1EA] hover:border-slate-400'
                        : 'bg-[#0F131A] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-mono font-bold ${
                        isSelected ? 'text-[#FF8A00]' : isLight ? 'text-[#6B7280]' : 'text-[#6B7280]'
                      }`}>
                        {ws.metric}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        isSelected 
                          ? 'bg-[#FF8A00]/10 text-[#FF8A00] font-bold' 
                          : isLight ? 'bg-[#F1F5F9] text-[#526074]' : 'bg-white/5 text-[#9AA5B1]'
                      }`}>
                        {ws.badge}
                      </span>
                    </div>
                    <div className={`text-xs font-bold ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                      {ws.title}
                    </div>
                    <div className={`text-[11px] mt-1 line-clamp-2 ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                      {ws.sub}
                    </div>
                  </div>
                  <div className={`mt-3 pt-2 border-t text-[10px] font-mono flex items-center justify-between ${
                    isLight ? 'border-[#D9E1EA]' : 'border-white/10'
                  }`}>
                    <span className={isSelected ? 'text-[#FF8A00] font-bold' : isLight ? 'text-[#6B7280]' : 'text-[#6B7280]'}>
                      {isSelected ? 'กำลังดู' : 'เลือกดู'}
                    </span>
                    <ChevronRight className={`w-3 h-3 ${isSelected ? 'text-[#FF8A00]' : 'text-[#6B7280]'}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Selected Step Visual Box */}
          {(() => {
            const currentWs = workflowSteps.find(s => s.step === selectedWorkflowStep) || workflowSteps[0];
            return (
              <div className={`mt-6 p-6 rounded-2xl border text-left ${
                isLight ? 'bg-white border-[#D9E1EA]' : 'bg-[#0F131A] border-white/10'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF8A00]" />
                    <h3 className={`text-base font-bold ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                      {currentWs.title}: {currentWs.sub}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#FF8A00]">
                    ครอบคลุมขั้นตอน: {currentWs.metric}
                  </span>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${
                  isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'
                }`}>
                  {currentWs.desc}
                </p>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ── 4. PUNN COGNITIVE ARCHITECTURE 12 STAGES (INTERACTIVE INSPECTOR) ── */}
      <section id="pca-architecture" className={`py-16 border-t ${
        isLight ? 'bg-white border-[#D9E1EA]' : 'bg-[#0F131A] border-white/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 text-left">
          
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono font-bold text-[#FF8A00] uppercase tracking-wider">
              สถาปัตยกรรมเบื้องหลัง (PCA 12 Stages)
            </span>
            <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight mt-1.5 ${
              isLight ? 'text-[#172033]' : 'text-white'
            }`}>
              ประมวลผลผ่าน PUNN Predictive Cognitive Architecture (PCA v3.0)
            </h2>
            <p className={`text-sm mt-2 leading-relaxed ${
              isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'
            }`}>
              ทุกข้อความและบทวิเคราะห์ใน FIRE KEEPER จะต้องผ่าน Stage Contracts ที่ตรวจสอบความถูกต้อง ตรวจสอบความขัดแย้ง และป้องกันการสร้างหลักฐานเท็จ
            </p>
            <div className="mt-3">
              <a 
                href="/punn-pca" 
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#FF8A00] hover:underline"
              >
                <span>เปิดเอกสารสถาปัตยกรรมฉบับทางการ (Canonical Architecture Page)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: 12 Stage Buttons */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PCA_STAGES.map((stage, idx) => {
                const Icon = STAGE_ICONS[stage.id] || Brain;
                const isActive = activeStageId === stage.id;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setActiveStageId(stage.id)}
                    className={`p-3.5 rounded-xl text-left border transition-all duration-200 flex items-start gap-3 cursor-pointer ${
                      isActive
                        ? isLight
                          ? 'bg-amber-50 border-[#FF8A00] shadow-sm'
                          : 'bg-[#151B24] border-[#FF8A00] shadow-sm'
                        : isLight
                          ? 'bg-[#F8FAFC] border-[#D9E1EA] hover:border-slate-300'
                          : 'bg-[#07090D] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isActive 
                        ? 'bg-[#FF8A00] text-black font-bold' 
                        : isLight ? 'bg-[#E2E8F0] text-[#172033]' : 'bg-white/10 text-[#9AA5B1]'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono font-bold ${
                          isActive ? 'text-[#FF8A00]' : isLight ? 'text-[#6B7280]' : 'text-[#6B7280]'
                        }`}>
                          STAGE {String(idx + 1).padStart(2, '0')}
                        </span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                      </div>
                      <div className={`text-xs font-bold truncate ${
                        isLight ? 'text-[#172033]' : 'text-white'
                      }`}>
                        {stage.thLabel}
                      </div>
                      <p className={`text-[10px] line-clamp-1 ${
                        isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'
                      }`}>
                        {stage.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Stage Technical Inspector Card */}
            <div className={`lg:col-span-5 sticky top-24 border rounded-2xl p-6 shadow-xl text-left ${
              isLight ? 'bg-[#F8FAFC] border-[#D9E1EA]' : 'bg-[#07090D] border-white/10'
            }`}>
              <div className="flex items-center justify-between border-b pb-3.5 mb-4">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isLight ? 'text-[#6B7280]' : 'text-[#6B7280]'
                }`}>
                  {currentStageSpec.phase}
                </span>
                <span className="text-xs font-mono font-bold text-[#FF8A00]">
                  STAGE {String(currentStageNum).padStart(2, '0')} / 12
                </span>
              </div>

              <div className="flex items-center gap-3.5 mb-4">
                <div className="p-3 rounded-xl bg-[#FF8A00]/10 border border-[#FF8A00]/30 text-[#FF8A00]">
                  <CurrentStageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                    {currentStage.thLabel}
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-[#FF8A00]">
                    {currentStageSpec.focus}
                  </span>
                </div>
              </div>

              <p className={`text-xs leading-relaxed mb-4 ${
                isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'
              }`}>
                {currentStage.description}
              </p>

              {/* Input / Output / Guarantee Schema */}
              <div className="space-y-2.5 font-mono text-xs">
                <div className={`p-3 rounded-xl border ${
                  isLight ? 'bg-white border-[#D9E1EA]' : 'bg-[#0F131A] border-white/5'
                }`}>
                  <span className="text-[9px] font-bold text-[#FF8A00] uppercase block mb-0.5">
                    INPUT SIGNAL (สัญญาณขาเข้า):
                  </span>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-[#172033]' : 'text-[#F5F7FA]'}`}>
                    {currentStageSpec.input}
                  </p>
                </div>

                <div className={`p-3 rounded-xl border ${
                  isLight ? 'bg-white border-[#D9E1EA]' : 'bg-[#0F131A] border-white/5'
                }`}>
                  <span className="text-[9px] font-bold text-emerald-500 uppercase block mb-0.5">
                    OUTPUT ARTIFACT (ผลลัพธ์ขาออก):
                  </span>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-[#172033]' : 'text-[#F5F7FA]'}`}>
                    {currentStageSpec.output}
                  </p>
                </div>

                <div className={`p-3 rounded-xl border ${
                  isLight ? 'bg-white border-[#D9E1EA]' : 'bg-[#0F131A] border-white/5'
                }`}>
                  <span className="text-[9px] font-bold text-sky-400 uppercase block mb-0.5">
                    ALGORITHM & GUARANTEE:
                  </span>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                    {currentStageSpec.guarantee}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. CORE SYSTEM CAPABILITIES ── */}
      <section id="capabilities" className={`py-16 border-t ${
        isLight ? 'bg-[#F6F8FB] border-[#D9E1EA]' : 'bg-[#07090D] border-white/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 text-left">
          
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono font-bold text-[#FF8A00] uppercase tracking-wider">
              ขีดความสามารถหลัก (Core Capabilities)
            </span>
            <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight mt-1.5 ${
              isLight ? 'text-[#172033]' : 'text-white'
            }`}>
              เครื่องมือวิเคราะห์ระดับยุทธศาสตร์ ที่ขับเคลื่อนด้วยเหตุผลทางวิทยาศาสตร์
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Cap 1: Epistemic Evidence */}
            <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-white border-[#D9E1EA]' : 'bg-[#0F131A] border-white/10'
            }`}>
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className={`text-base font-bold ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                  Epistemic Evidence Taxonomy
                </h3>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                  จำแนกข้อมูลเป็น FACT, INFERENCE และ UNCERTAINTY พร้อมระบบประเมินความน่าเชื่อถือตามมาตรฐาน Admiralty Intelligence Code (Grade A ถึง F)
                </p>
              </div>
              <div className="mt-4 pt-3 border-t text-[11px] font-mono text-emerald-500 font-semibold flex items-center justify-between">
                <span>Admiralty Intelligence Grade A-F</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Cap 2: ACH Hypothesis Engine */}
            <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-white border-[#D9E1EA]' : 'bg-[#0F131A] border-white/10'
            }`}>
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className={`text-base font-bold ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                  Analysis of Competing Hypotheses (ACH)
                </h3>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                  สร้างสมมติฐานทางเลือกคู่ขนาน (Competing Hypotheses) คำนวณค่า Bayesian Prior & Likelihood เพื่อทดสอบข้อหักล้างอย่างเท่าเทียม
                </p>
              </div>
              <div className="mt-4 pt-3 border-t text-[11px] font-mono text-sky-400 font-semibold flex items-center justify-between">
                <span>Bayesian Probability Update</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Cap 3: Adversarial Red-Team Critique */}
            <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-white border-[#D9E1EA]' : 'bg-[#0F131A] border-white/10'
            }`}>
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className={`text-base font-bold ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                  Adversarial Risk & Red-Team Critique
                </h3>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                  วิเคราะห์จุดเปราะบาง (Vulnerability Assessment), จำลองรูปแบบความล้มเหลว (FMEA) และประเมินผลกระทบข้างเคียงขั้นที่สอง (Second-Order Consequences)
                </p>
              </div>
              <div className="mt-4 pt-3 border-t text-[11px] font-mono text-purple-400 font-semibold flex items-center justify-between">
                <span>FMEA Vulnerability Modeling</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Cap 4: Calibrated Confidence & ECE */}
            <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-white border-[#D9E1EA]' : 'bg-[#0F131A] border-white/10'
            }`}>
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#FF8A00] flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className={`text-base font-bold ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                  Calibrated Confidence (Multi-Criteria Scoring)
                </h3>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                  ประเมินคะแนนความมั่นใจแบบถ่วงน้ำหนักหลายมิติ (Coverage 40%, Reliability 35%, Quality 25%) พร้อมหักลบจุดขัดแย้งและข้อมูลที่ขาดหาย ปราศจากการเสแสร้งสร้างตัวเลขหลอก
                </p>
              </div>
              <div className="mt-4 pt-3 border-t text-[11px] font-mono text-[#FF8A00] font-semibold flex items-center justify-between">
                <span>Mathematical Confidence Calibration</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Cap 5: Long-Term Memory with Hard Gate */}
            <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-white border-[#D9E1EA]' : 'bg-[#0F131A] border-white/10'
            }`}>
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className={`text-base font-bold ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                  Dynamic Memory Bank & Hard Gate
                </h3>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                  คลังความจำ LTM แยกหมวดหมู่ Fact, Context, Preference พร้อมระบบคัดกรอง Hard Relevance Gate ป้องกันความจำเก่ามารบกวนการวิเคราะห์เรื่องใหม่
                </p>
              </div>
              <div className="mt-4 pt-3 border-t text-[11px] font-mono text-blue-400 font-semibold flex items-center justify-between">
                <span>Anti-Contamination Retrieval</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Cap 6: Cryptographic Audit Ledger */}
            <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-white border-[#D9E1EA]' : 'bg-[#0F131A] border-white/10'
            }`}>
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h3 className={`text-base font-bold ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                  Cryptographic Integrity & Audit Hash
                </h3>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                  บันทึกรอยเท้าการทำงานของทุกขั้นตอน (Audit Ledger) พร้อมสร้าง SHA-256 Hash Signature ที่ตรวจสอบได้แบบสดด้วย WebCrypto API
                </p>
              </div>
              <div className="mt-4 pt-3 border-t text-[11px] font-mono text-teal-400 font-semibold flex items-center justify-between">
                <span>Tamper-Evident SHA-256 Ledger</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. FEATURED SECTION: HUMAN DECISION GATE ── */}
      <section id="human-gate" className={`py-16 border-t ${
        isLight ? 'bg-white border-[#D9E1EA]' : 'bg-[#0F131A] border-white/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 text-left">
          
          <div className="p-8 sm:p-10 rounded-3xl border border-amber-500/30 relative overflow-hidden shadow-2xl bg-gradient-to-b from-amber-500/5 to-transparent">
            <div className="max-w-3xl mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-mono font-bold mb-3">
                <Lock className="w-3.5 h-3.5" />
                <span>INVIOLABLE HUMAN SOVEREIGNTY</span>
              </div>
              <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                isLight ? 'text-[#172033]' : 'text-white'
              }`}>
                Human Decision Gate: มนุษย์คือผู้มีอำนาจตัดสินใจขั้นสูงสุด
              </h2>
              <p className={`text-sm mt-3 leading-relaxed ${
                isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'
              }`}>
                FIRE KEEPER ถูกสร้างขึ้นบนกฎเหล็กที่ว่า AI มีหน้าที่จัดระเบียบและประเมินหลักฐาน แต่มนุษย์คือผู้ถืออำนาจและรับผิดชอบต่อผลลัพธ์ (Accountability) ระบบจึงมีกลไก 3-Tier Human Agency Enforcement:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono text-xs">
              
              {/* Level 1 */}
              <div className={`p-5 rounded-2xl border ${
                isLight ? 'bg-white border-[#D9E1EA]' : 'bg-[#07090D] border-white/10'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-emerald-500 font-bold">LEVEL 1: ADVISORY</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">Low Risk</span>
                </div>
                <div className={`text-xs font-bold mb-2 ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                  การให้คำปรึกษาทั่วไป
                </div>
                <p className={`text-[11px] leading-relaxed ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                  AI วิเคราะห์และนำเสนอทางเลือก มนุษย์นำข้อมูลไปพิจารณาตามดุลยพินิจทั่วไปโดยไม่มีข้อจำกัดขัดขวาง
                </p>
              </div>

              {/* Level 2 */}
              <div className={`p-5 rounded-2xl border ${
                isLight ? 'bg-white border-[#D9E1EA]' : 'bg-[#07090D] border-white/10'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sky-400 font-bold">LEVEL 2: ESCALATION</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-bold">Medium Risk</span>
                </div>
                <div className={`text-xs font-bold mb-2 ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                  การแจ้งเตือนความเสี่ยงสูง
                </div>
                <p className={`text-[11px] leading-relaxed ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                  เมื่อตรวจพบความไม่แน่นอนสูงหรือความเสี่ยงที่กระทบต่อทรัพยากร ระบบจะแสดงข้อความเตือนและจุดที่ต้องตรวจสอบซ้ำ
                </p>
              </div>

              {/* Level 3 */}
              <div className={`p-5 rounded-2xl border border-amber-500/40 ${
                isLight ? 'bg-amber-50/80' : 'bg-amber-500/10'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#FF8A00] font-bold">LEVEL 3: HARD STOP</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#FF8A00]/20 text-[#FF8A00] font-bold">Critical Risk</span>
                </div>
                <div className={`text-xs font-bold mb-2 ${isLight ? 'text-amber-950' : 'text-amber-300'}`}>
                  การล็อกผลลัพธ์เพื่อรอการอนุมัติ
                </div>
                <p className={`text-[11px] leading-relaxed ${isLight ? 'text-amber-900' : 'text-amber-200'}`}>
                  สำหรับภารกิจวิกฤต (กฎหมาย การเงิน ความปลอดภัย) ระบบจะหยุดและไม่อนุญาตให้ดำเนินการจนกว่ามนุษย์จะยืนยันด้วย Digital Token
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. TRUST, GOVERNANCE & COMPLIANCE ── */}
      <section id="governance" className={`py-16 border-t ${
        isLight ? 'bg-[#F6F8FB] border-[#D9E1EA]' : 'bg-[#07090D] border-white/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 text-left">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-mono font-bold text-emerald-500 uppercase tracking-wider">
                ธรรมาภิบาลและมาตรฐานสากล
              </span>
              <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                isLight ? 'text-[#172033]' : 'text-white'
              }`}>
                ออกแบบตามกรอบมาตรฐานสากล ISO/IEC 42001 & NIST AI RMF
              </h2>
              <p className={`text-sm leading-relaxed ${
                isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'
              }`}>
                FIRE KEEPER บังคับใช้นโยบายความโปร่งใส ปราศจากการปรุงแต่งข้อมูล (Anti-Fabrication Guarantee) และรองรับการส่งออกรายงานบทวิเคราะห์เป็นเอกสารสมบูรณ์ 100%
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                      ISO/IEC 42001:2023 Design Alignment
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                      ระบบบริหารจัดการปัญญาประดิษฐ์ (Artificial Intelligence Management System)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                      NIST AI RMF 1.0 (MAP · MEASURE · MANAGE · GOVERN)
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                      กรอบการบริหารความเสี่ยงด้าน AI เพื่อลดผลกระทบเชิงลบและความไม่แน่นอน
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                      Zero Data Lock-in & 1:1 HTML Export
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                      ส่งออกรายงานบทวิเคราะห์เป็นไฟล์ HTML แบบ Self-Contained พร้อมสคริปต์ WebCrypto และโหมดสลับธีมในตัว
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Real Policy Audit Log View */}
            <div className={`lg:col-span-6 border rounded-2xl p-6 shadow-xl text-left font-mono ${
              isLight ? 'bg-white border-[#D9E1EA]' : 'bg-[#0F131A] border-white/10'
            }`}>
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <span className="text-xs font-bold text-[#FF8A00]">
                  SYSTEM GOVERNANCE AUDIT LOG
                </span>
                <span className="text-[10px] text-emerald-500 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  ALL POLICIES PASSED
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className={`p-3 rounded-lg border ${
                  isLight ? 'bg-[#F8FAFC] border-[#D9E1EA]' : 'bg-[#151B24] border-white/5'
                }`}>
                  <div className="flex items-center justify-between text-[11px] text-emerald-500 font-bold">
                    <span>✓ POLICY_AG_01: HUMAN_SOVEREIGNTY</span>
                    <span>100% ENFORCED</span>
                  </div>
                  <p className={`text-[10px] mt-1 ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                    Hard-stop control active on high-risk domains (Financial, Legal, Safety).
                  </p>
                </div>

                <div className={`p-3 rounded-lg border ${
                  isLight ? 'bg-[#F8FAFC] border-[#D9E1EA]' : 'bg-[#151B24] border-white/5'
                }`}>
                  <div className="flex items-center justify-between text-[11px] text-emerald-500 font-bold">
                    <span>✓ POLICY_EV_02: EPISTEMIC_GROUNDING</span>
                    <span>ADMIRALTY A-B</span>
                  </div>
                  <p className={`text-[10px] mt-1 ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                    Unverified assumptions isolated into UNCERTAINTY registry.
                  </p>
                </div>

                <div className={`p-3 rounded-lg border ${
                  isLight ? 'bg-[#F8FAFC] border-[#D9E1EA]' : 'bg-[#151B24] border-white/5'
                }`}>
                  <div className="flex items-center justify-between text-[11px] text-emerald-500 font-bold">
                    <span>✓ POLICY_CL_03: CONFIDENCE_CALIBRATION</span>
                    <span>EMPIRICAL CHECK</span>
                  </div>
                  <p className={`text-[10px] mt-1 ${isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'}`}>
                    Multi-criteria evidence scoring with explicit verification state gating.
                  </p>
                </div>
              </div>

              <div className={`mt-4 pt-3 border-t text-[10px] flex items-center justify-between ${
                isLight ? 'border-[#D9E1EA] text-[#6B7280]' : 'border-white/10 text-[#6B7280]'
              }`}>
                <span>Tamper-evident verification engine</span>
                <span>Audit Signature: v2.0-pca</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. FINAL CALL TO ACTION ── */}
      <section className={`py-20 border-t text-center ${
        isLight ? 'bg-white border-[#D9E1EA]' : 'bg-[#07090D] border-white/10'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF8A00] to-[#E06C00] mx-auto flex items-center justify-center shadow-lg mb-6">
            <Flame className="w-6 h-6 text-black" />
          </div>

          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight ${
            isLight ? 'text-[#172033]' : 'text-white'
          }`}>
            พร้อมใช้งานระบบคิดวิเคราะห์และตัดสินใจระดับยุทธศาสตร์
          </h2>

          <p className={`text-sm sm:text-base mt-4 max-w-xl mx-auto leading-relaxed ${
            isLight ? 'text-[#526074]' : 'text-[#9AA5B1]'
          }`}>
            เข้าสู่ Workspace ของ FIRE KEEPER เพื่อเริ่มวิเคราะห์ประเด็นซับซ้อน จัดระเบียบหลักฐาน และสร้างรายงานระดับบริหารได้ทันที
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={onEnter}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#FF8A00] hover:bg-[#E06C00] text-black font-mono font-bold text-xs tracking-wider transition-all duration-200 shadow-md flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>เข้าสู่ระบบงานวิเคราะห์ (ENTER WORKSPACE)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── 9. MINIMAL TECHNICAL FOOTER ── */}
      <footer className={`py-8 px-4 sm:px-12 border-t text-xs font-mono transition-colors mt-auto ${
        isLight ? 'bg-[#F6F8FB] border-[#D9E1EA] text-[#526074]' : 'bg-[#07090D] border-white/10 text-[#6B7280]'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-[#FF8A00]" />
            <span className={`font-bold ${isLight ? 'text-[#172033]' : 'text-white'}`}>FIRE KEEPER OS</span>
            <span>·</span>
            <span>PUNN Predictive Cognitive Architecture (PCA v3.0)</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <a href="/punn-pca" className="text-[#FF8A00] hover:underline font-semibold">
              Canonical Architecture Spec
            </a>
            <span>·</span>
            <a href="/about" className="hover:underline">
              Founder Profile
            </a>
            <span>·</span>
            <a href="/docs" className="hover:underline">
              Whitepaper &amp; Docs
            </a>
            <span>·</span>
            <span>Ref. ISO/IEC 42001 &amp; NIST AI RMF</span>
            <span>·</span>
            <span>Inviolable Human Sovereignty</span>
          </div>

          <div className="text-[11px]">
            &copy; {new Date().getFullYear()} FIRE KEEPER. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
