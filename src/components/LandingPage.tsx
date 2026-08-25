import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Activity,
  CheckCircle,
  Eye,
  Brain,
  Target,
  Database,
  Network,
  Compass,
  MessageSquare,
  RotateCcw,
  GraduationCap,
  AlertTriangle,
  Lock,
  Scale,
  FileText,
  Check,
  ChevronDown,
  ExternalLink,
  ShieldAlert,
  Menu,
  X
} from 'lucide-react';
import { PCA_STAGES } from '../types';

interface LandingPageProps {
  onEnter: () => void;
  isLight?: boolean;
}

// Map PCA stage IDs to icons
const STAGE_ICONS: Record<string, React.ComponentType<any>> = {
  OBSERVATION: Eye,
  UNDERSTANDING: Brain,
  PURPOSE: Target,
  MEMORY: Database,
  MENTAL_MODEL: Network,
  HYPOTHESIS: Sparkles,
  EVIDENCE_EVALUATION: ShieldCheck,
  CRITIQUE: AlertTriangle,
  DECISION: Compass,
  COMMUNICATION: MessageSquare,
  REFLECTION: RotateCcw,
  LEARNING: GraduationCap,
};

// Map stages to typical inputs/outputs for the interactive grid
const STAGE_METADATA: Record<string, { input: string; output: string; focus: string }> = {
  OBSERVATION: {
    input: 'ดิบประเด็นคำถาม (Raw Question) / ไฟล์แนบ',
    output: 'โครงสร้างเจตนา (Intent Structure) & ประเด็นสำคัญ (Saliency)',
    focus: 'Signal Parsing & Ingestion'
  },
  UNDERSTANDING: {
    input: 'ประเด็นสำคัญ (Saliency) & ข้อมูลบริบทเดิม',
    output: 'โครงข่ายคำนิยามและการเชื่อมโยงภาษา (Semantic Representation)',
    focus: 'Deep Semantic Ingestion'
  },
  PURPOSE: {
    input: 'Semantic Representation & ความเข้าใจเป้าหมาย',
    output: 'เกณฑ์ความสำเร็จ (Success Criteria) & นโยบายความปลอดภัย',
    focus: 'Governance & Constraint Definition'
  },
  MEMORY: {
    input: 'เป้าหมายผู้ใช้ & หัวข้อเนื้อหาเฉพาะ',
    output: 'ความจำบริบทที่ดึงขึ้นมา (Fact/Preference/Constraint)',
    focus: 'Long-Term Contextual Retrieval'
  },
  MENTAL_MODEL: {
    input: 'ความจำบริบทที่ถูกเรียก & ข้อมูลนำเข้า',
    output: 'Knowledge Graph ระบุโหนดและทิศความสัมพันธ์',
    focus: 'Structural Representation'
  },
  HYPOTHESIS: {
    input: 'Knowledge Graph & สถานการณ์ปัญหานำเข้า',
    output: 'สมมติฐานเป้าหมายที่เป็นไปได้ (Supported Hypotheses)',
    focus: 'Bayesian Alternative Generation'
  },
  EVIDENCE_EVALUATION: {
    input: 'สมมติฐานเป้าหมาย & ข้อมูลหลักฐานดิบ',
    output: 'สัดส่วนและน้ำหนักความถูกต้องของหลักฐานสนับสนุน',
    focus: 'Epistemic Grounding & Verification'
  },
  CRITIQUE: {
    input: 'น้ำหนักความน่าเชื่อถือ & ข้อสรุปเบื้องต้น',
    output: 'บันทึกช่องว่างของข้อมูล (Information Gap Registry)',
    focus: 'Adversarial Logic & Doubt Injection'
  },
  DECISION: {
    input: 'สมมติฐานทั้งหมดที่ผ่านการกลั่นกรอง & น้ำหนักหลักฐาน',
    output: 'คำแนะนำสุดท้าย (Core Verdict) & ความมั่นใจ (Calibrated Confidence)',
    focus: 'Multi-Criteria Decision Analysis'
  },
  COMMUNICATION: {
    input: 'คำแนะนำสุดท้าย & ข้อมูลความเสี่ยงเสร็จสิ้น',
    output: 'รายงานผลระดับบริหาร (Executive Decision Report)',
    focus: 'Verifiable Rhetoric Synthesis'
  },
  REFLECTION: {
    input: 'ผลลัพธ์รายงานที่ร่างขึ้นมา',
    output: 'บันทึกความถูกต้องและการปรับแต่งตนเอง (Meta-Cognitive Evaluation)',
    focus: 'Self-Correction & Quality Audit'
  },
  LEARNING: {
    input: 'รายงานสุดท้าย & บทเรียนการปรับแต่ง',
    output: 'การอัปเดตโมเดลความจำระยะยาวถาวร (Permanent Memory Updates)',
    focus: 'Human-in-the-Loop Memory Retention'
  }
};

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, isLight = false }) => {
  const [activeStage, setActiveStage] = useState<string>('OBSERVATION');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Nodes for the Flow Visualizer
  const flowNodes = [
    { id: 'question', label: 'QUESTION', desc: 'ข้อมูลดิบและโจทย์เชิงกลยุทธ์', color: 'border-slate-700 text-slate-300 font-bold' },
    { id: 'evidence', label: 'EVIDENCE', desc: 'หลักฐานที่ตรวจสอบความถูกต้องทางวิชาการ', color: 'border-emerald-950 text-emerald-400 bg-emerald-950/20' },
    { id: 'reasoning', label: 'REASONING', desc: 'กระบวนการคิดเชิงตรรกะ 12 ขั้นตอน', color: 'border-orange-950 text-orange-400 bg-orange-950/20' },
    { id: 'scenarios', label: 'SCENARIOS', desc: 'การจำลองทางเลือกและผลกระทบ', color: 'border-blue-950 text-blue-400 bg-blue-950/20' },
    { id: 'tradeoffs', label: 'TRADEOFFS', desc: 'การชั่งน้ำหนักข้อดีข้อเสียและความคุ้มค่า', color: 'border-purple-950 text-purple-400 bg-purple-950/20' },
    { id: 'decision', label: 'DECISION', desc: 'การตัดสินใจสุดท้ายและการให้สิทธิ์มนุษย์', color: 'border-[#FF8A00] text-[#FF8A00] bg-[#FF8A00]/10' }
  ];

  const currentStageIndex = PCA_STAGES.findIndex(s => s.id === activeStage);
  const currentStageInfo = currentStageIndex !== -1 ? PCA_STAGES[currentStageIndex] : PCA_STAGES[0];
  const currentStageOrder = currentStageIndex !== -1 ? currentStageIndex + 1 : 1;
  const CurrentStageIcon = STAGE_ICONS[activeStage] || Brain;
  const currentStageMeta = STAGE_METADATA[activeStage] || { input: '', output: '', focus: '' };

  const handleStageClick = (stageId: string) => {
    setActiveStage(stageId);
    const element = document.getElementById('stage-detail-card');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className="min-h-screen bg-[#02040A] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background radial effects */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#FF8A00]/5 blur-[120px] pointer-events-none z-0" />

      {/* 1. CUSTOM ENTERPRISE HEADER */}
      <header className="sticky top-0 z-50 w-full bg-[#030611]/90 backdrop-blur-md border-b border-white/5 px-4 sm:px-8 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 select-none shrink-0">
          <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF8A00] drop-shadow-[0_0_8px_rgba(255,138,0,0.5)]" />
          <span className="font-mono font-bold tracking-tighter text-base sm:text-lg text-white whitespace-nowrap">
            FIRE KEEPER <span className="text-[#FF8A00] font-semibold text-[10px] ml-1 border border-[#FF8A00]/30 px-1.5 py-0.5 rounded font-mono">OS V2.0</span>
          </span>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-mono text-slate-400">
          <a href="#architecture" className="hover:text-white transition-colors">สถาปัตยกรรมการรู้คิด (12 ขั้นตอน)</a>
          <a href="#governance" className="hover:text-white transition-colors">ธรรมาภิบาลและมาตรฐาน</a>
          <span className="text-slate-700">|</span>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30 font-mono">
            SECURE PORTAL
          </span>
        </nav>

        <button
          onClick={onEnter}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#FF8A00] to-[#E06C00] hover:from-[#FF9E22] hover:to-[#FF7700] text-black text-xs font-mono font-bold tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(255,138,0,0.15)] hover:shadow-[0_0_20px_rgba(255,138,0,0.3)] active:scale-95"
        >
          เข้าสู่ระบบงานวิเคราะห์
        </button>
      </header>

      {/* 2. PREMIUM HERO SECTION */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-16 pb-12 w-full text-center lg:text-left grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#FF8A00] animate-pulse" />
            ระบบประเมินและตัดสินใจเชิงวิชาการระดับผู้นำองค์กร
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.15]">
            ยกระดับความโปร่งใส <br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#FF8A00]">
              ด้วยวิจารณญาณทางกลยุทธ์
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl lg:max-w-none">
            ระบบปฏิบัติการวิเคราะห์ข้อมูลเชิงลึกแบบประเมินหลักฐานบนกรอบแนวคิดธรรมาภิบาลข้อมูล AI 
            ป้องกันข้อสมมติฐานและสถิติลอยๆ นำเสนอแบบจำลองตรรกะแบบโปร่งใส 12 ขั้นตอน เพื่อให้มนุษย์สามารถตรวจสอบและรับรองสัญชาตญาณได้อย่างสมบูรณ์แบบ
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <button
              onClick={onEnter}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-200 text-black text-xs font-mono font-bold tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 group"
            >
              เปิดแดชบอร์ดบริหาร
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href="#architecture"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono transition-all duration-300 flex items-center justify-center gap-1"
            >
              ศึกษาการทำงานแบบ 12 ขั้นตอน
            </a>
          </div>
        </div>

        {/* Hero Interactive Visual Map */}
        <div className="lg:col-span-5 relative w-full aspect-square max-w-[420px] mx-auto bg-[#050811] border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-blue-500/5 rounded-full blur-[60px] pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FF8A00] animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-slate-400 font-bold uppercase">
                COGNITIVE PIPELINE FLOW
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30 font-mono">
              ACTIVE
            </span>
          </div>

          {/* Interactive Flow Nodes Visualizer */}
          <div className="grid grid-cols-2 gap-3 my-6 relative">
            {flowNodes.map((node) => (
              <div
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className={`p-3.5 rounded-xl border text-left transition-all duration-300 cursor-pointer relative overflow-hidden ${node.color} ${
                  hoveredNode === node.id ? 'scale-[1.03] shadow-lg border-opacity-80' : 'opacity-85'
                }`}
              >
                <div className="text-xs font-mono font-bold tracking-wider mb-1">{node.label}</div>
                <div className="text-[10px] text-slate-400 line-clamp-1 leading-normal">{node.desc}</div>
              </div>
            ))}
          </div>

          <div className="bg-[#090D1C] rounded-xl p-3 border border-white/5 text-left">
            <span className="text-[9px] font-mono text-slate-500 font-bold block mb-1 uppercase">
              {hoveredNode ? 'NODE DETAIL DETECTED' : 'HOVER NODE TO INSPECT'}
            </span>
            <p className="text-[11px] text-slate-300 leading-normal">
              {hoveredNode 
                ? flowNodes.find(n => n.id === hoveredNode)?.desc 
                : 'ข้อมูลผ่านการไหลแบบเส้นตรงจาก Question ผ่านขั้นตอนเหตุผล เพื่อนำไปรับรองเชิงกลยุทธ์สูงสุด'}
            </p>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE 12-STAGE PUNN COGNITIVE ARCHITECTURE */}
      <section id="architecture" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16 w-full border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono text-[#FF8A00] font-bold tracking-widest uppercase">สถาปัตยกรรมเบื้องหลัง</span>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white mt-2">
            ประมวลผลผ่านสถาปัตยกรรมการรู้คิด 12 ขั้นตอน (PUNN v2.0)
          </h2>
          <p className="text-slate-400 text-sm mt-3">
            โครงสร้างการวิเคราะห์ข้อมูลความเข้าใจและการสร้างสมมติฐานบนความรู้ทางวิชาการและสถิติ 
            ที่จำแนกตรรกะในแต่ละสถานการณ์อย่างโปร่งใส ไร้กล่องดำ
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Grid: 12 Stages Buttons */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PCA_STAGES.map((stage, idx) => {
              const Icon = STAGE_ICONS[stage.id] || Brain;
              const isActive = activeStage === stage.id;
              return (
                <button
                  key={stage.id}
                  onClick={() => handleStageClick(stage.id)}
                  className={`p-4 rounded-xl text-left border transition-all duration-300 flex items-start gap-3 relative overflow-hidden group ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0C1122] to-[#060A14] border-[#FF8A00]/40 shadow-md shadow-[#FF8A00]/5'
                      : 'bg-[#040711] border-white/5 hover:border-white/10 hover:bg-white/[0.01]'
                  }`}
                >
                  <div className={`p-2 rounded-lg mt-0.5 transition-colors ${
                    isActive ? 'bg-[#FF8A00]/10 text-[#FF8A00]' : 'bg-white/5 text-slate-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono font-bold text-[#FF8A00]">
                        STAGE {String(idx + 1).padStart(2, '0')}
                      </span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    </div>
                    <h4 className="text-xs font-bold text-white tracking-wide">{stage.thLabel}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1 leading-normal">{stage.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Grid: Detailed Card for Active Stage */}
          <div id="stage-detail-card" className="lg:col-span-5 sticky top-24 bg-[#050811] border border-white/5 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <span className="text-[10px] font-mono text-slate-500 font-bold tracking-widest uppercase">
                ACTIVE STAGE INTERACTIVE PANEL
              </span>
              <span className="text-xs font-mono text-[#FF8A00] font-bold">
                STAGE {String(currentStageOrder).padStart(2, '0')} / 12
              </span>
            </div>

            <div className="flex items-center gap-4 mb-5">
              <div className="p-3.5 rounded-xl bg-[#FF8A00]/10 border border-[#FF8A00]/30 text-[#FF8A00]">
                <CurrentStageIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{currentStageInfo.thLabel}</h3>
                <span className="text-[10px] font-mono text-[#FF8A00] uppercase tracking-wider font-bold">
                  {currentStageMeta.focus}
                </span>
              </div>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
              {currentStageInfo.description}
            </p>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-[#080D1D] border border-white/5">
                <span className="text-[9px] font-bold text-[#FF8A00] block mb-1 uppercase tracking-wider">
                  INPUT DATA / สัญญาณขาเข้า:
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">{currentStageMeta.input}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#080D1D] border border-white/5">
                <span className="text-[9px] font-bold text-emerald-400 block mb-1 uppercase tracking-wider">
                  OUTPUT DATA / ผลลัพธ์ขาออก:
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">{currentStageMeta.output}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. GOVERNANCE & COMPLIANCE SECTION */}
      <section id="governance" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16 w-full border-t border-white/5 bg-[#03050B]/40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-mono text-emerald-400 font-bold tracking-widest uppercase">
              มาตรฐานธรรมาภิบาลและความปลอดภัย
            </span>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white mt-2 leading-snug">
              ปฏิบัติตามมาตรฐานระดับสากล <br />
              เพื่อป้องกันข้อมูลบิดเบือน
            </h2>
            <p className="text-slate-400 text-sm mt-4 leading-relaxed">
              เราตระหนักถึงความสุ่มเสี่ยงจากการประเมินด้วยระบบกล่องดำ Fire Keeper OS 
              จึงถูกตรวจสอบคุณภาพความปลอดภัยในการตัดสินใจและการคุ้มครองข้อมูลด้วยนโยบายอย่างเข้มงวด
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mt-1 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white">มาตรฐานการปฏิบัติตาม ISO/IEC 42001:2023</span>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">มีระบบประมวลผลความปลอดภัยของข้อมูลและการจัดการความน่าเชื่อถือของ AI (Artificial Intelligence Management System)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mt-1 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white">กรอบความปลอดภัย NIST AI RMF 1.0 (MAP & MEASURE)</span>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">รันโมดูลแผนรับความเสี่ยงและวัดสัดส่วนข้อเท็จจริงประกอบเพื่อป้องกันความเสียหายแก่ทรัพย์สินเชิงพาณิชย์และกฎหมายอย่างตรงจุด</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mt-1 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white">บัญชีบันทึกรอยเท้าแบบเรียลไทม์ (Real-Time Tamper-Evident Ledger)</span>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">บล็อกการทำงานสแกนและบันทึกประวัติรอยเท้า (Audited Blocks) ป้องกันระบบถูกแทรกแซงหรือปรับเปลี่ยนแบบย้อนหลัง</p>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Visual Log */}
          <div className="bg-[#050811] border border-white/5 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF8A00]/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <span className="text-[10px] font-mono text-slate-500 font-bold tracking-widest uppercase">
                บันทึกนโยบายธรรมาภิบาล (การตรวจสอบระบบแบบเรียลไทม์)
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-4 font-mono text-[11px] text-slate-400">
              <div className="p-3.5 rounded-xl bg-[#080D1D] border border-white/5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#FF8A00] font-bold">✓ POLICY_AG_01: HUMAN_AGENCY</span>
                  <span className="text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded text-[10px] border border-emerald-900/30">PASSED</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  ตรวจสอบสิทธิ์การตัดสินใจของมนุษย์ (Level 3 Hard Stop Control): ทำงานแบบ Human-in-the-loop เพื่อยืนยันความปลอดภัยในภารกิจหลัก
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#080D1D] border border-white/5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#FF8A00] font-bold">✓ POLICY_SF_02: FACT_CONSISTENCY</span>
                  <span className="text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded text-[10px] border border-emerald-900/30">PASSED</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  คัดกรองข้อมูลทับซ้อนและข้อหักล้างทางสถิติ (Bayesian Consistency Check): ค้นพบระดับความขัดแย้ง 0% ในฐานข้อมูลความจำ
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#080D1D] border border-white/5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#FF8A00] font-bold">✓ POLICY_TN_03: EXECUTIVE_DECORUM</span>
                  <span className="text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded text-[10px] border border-emerald-900/30">PASSED</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  ตรวจคุณภาพภาษาและการเรียบเรียงประโยค (Decorum Standards): บังคับใช้ความสุขุมและสุภาพปราศจากอารมณ์หรือคำโอ้อวดเกินจริง
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-slate-500 flex justify-between">
              <span>ตรวจสอบความปลอดภัยสะสม: 1,240 ครั้ง</span>
              <span>เวอร์ชันลายเซ็นกำกับ: v2.0-secure</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. REVOLUTIONARY BOTTOM CTA SECTION */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center border-t border-white/5 w-full">
        <div className="relative p-8 md:p-16 rounded-3xl bg-gradient-to-b from-[#0B1020] to-[#050812] border border-white/10 shadow-2xl overflow-hidden group">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-[#FF8A00]/5 rounded-full blur-[100px] pointer-events-none" />
          
          <h3 className="text-2xl sm:text-4xl font-light tracking-tight text-white mb-4">
            พร้อมที่จะเพิ่มความโปร่งใสและวิจารณญาณของคุณแล้วหรือยัง?
          </h3>
          
          <p className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-10">
            ก้าวเข้าสู่ห้องพิจารณากลยุทธ์เชิงวิชาการ ค้นพบความถูกต้อง คำนวณความโปร่งใส และร่วมขับเคลื่อนการประเมินสถิติอย่างมั่นใจไปด้วยกันในระดับผู้นำองค์กร
          </p>

          <button
            onClick={onEnter}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-200 text-black text-sm font-mono font-bold tracking-widest transition-all duration-300 shadow-[0_0_25px_rgba(255,255,255,0.08)] hover:scale-[1.04] active:scale-[0.98]"
          >
            เปิดระบบงานวิเคราะห์ (ENTER WORKSPACE)
          </button>
        </div>
      </section>

      {/* 6. SIMPLIFIED LUXURY FOOTER */}
      <footer className="relative z-10 w-full border-t border-white/5 bg-[#030611] py-8 px-4 sm:px-12 text-slate-500 text-xs font-mono mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#FF8A00]" />
            <span className="font-bold text-white text-xs">FIRE KEEPER OS</span>
            <span>|</span>
            <span>สถาปัตยกรรมการรู้คิด PUNN Cognitive Architecture v2.0</span>
          </div>

          <div className="flex gap-4">
            <span className="text-[10px]">เอกสารอ้างอิง: ISO/IEC 42001 & NIST AI RMF</span>
          </div>

          <div className="text-[10px]">
            &copy; {new Date().getFullYear()} FIRE KEEPER. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
