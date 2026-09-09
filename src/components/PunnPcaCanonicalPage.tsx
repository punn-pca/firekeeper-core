import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Brain, 
  Flame, 
  ArrowLeft, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Lock, 
  Database, 
  FileCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  BookOpen,
  Scale,
  Sparkles,
  GitBranch,
  Terminal,
  Key
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TaxonomyTag } from './TaxonomyTag';
import { INFORMATION_TAXONOMY_LIST, TAXONOMY_PILLARS, TaxonomyPillar } from '../utils/taxonomyTokens';

interface PunnPcaCanonicalPageProps {
  onBackToApp?: () => void;
  onNavigateHome?: () => void;
}

export const PunnPcaCanonicalPage: React.FC<PunnPcaCanonicalPageProps> = ({
  onBackToApp,
  onNavigateHome
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  const CANONICAL_STAGES = [
    {
      num: '01',
      id: 'intent-definition',
      nameEn: 'Intent Definition',
      nameTh: 'การระบุเจตนาและความต้องการ',
      icon: '🎯',
      description: 'ถอดรหัสความต้องการที่แท้จริงของผู้ใช้ ระบุเป้าหมาย สัญญาณความต้องการ จัดระเบียบความคาดหวัง และแยกแยะคำสั่งเชิงยุทธศาสตร์ออกจากคำถามทั่วไป',
      fsmGate: 'Intent Clarification & Objective Scaffolding',
      input: 'ดิบ (Raw Natural Language Query / Business Problem Statement)',
      output: 'Structured Intent Object with Core Objective Vector'
    },
    {
      num: '02',
      id: 'context-understanding',
      nameEn: 'Context Understanding',
      nameTh: 'การทำความเข้าใจบริบทและข้อจำกัด',
      icon: '🌐',
      description: 'วิเคราะห์บริบทแวดล้อม เงื่อนไขเฉพาะ กฎหมาย/ข้อบังคับอุตสาหกรรม กรอบเวลา งบประมาณ และระบุตัวแสดงหลัก (Stakeholder Boundaries)',
      fsmGate: 'Environmental & Constraint Validation',
      input: 'Intent Object + Context Data + Temporal/Legal Constraints',
      output: 'Context Boundary Map with Explicit Constraints Matrix'
    },
    {
      num: '03',
      id: 'purpose-scope',
      nameEn: 'Purpose & Scope',
      nameTh: 'การกำหนดวัตถุประสงค์และขอบเขต',
      icon: '📐',
      description: 'กำหนดขอบเขตของการวิเคราะห์ (In-Scope vs. Out-of-Scope) ป้องกันการขยายขอบเขตโดยไม่จำเป็น (Scope Creep) และกำหนดเกณฑ์ความสำเร็จ (Success Criteria)',
      fsmGate: 'Scope Lock & Governance Perimeter Definition',
      input: 'Context Boundary Map',
      output: 'Locked Scope Definition with Strategic Bounds'
    },
    {
      num: '04',
      id: 'data-structuring',
      nameEn: 'Data Structuring & LTM',
      nameTh: 'การจัดโครงสร้างข้อมูลและการดึงความจำ',
      icon: '🗄️',
      description: 'จัดระเบียบข้อมูลนำเข้าเป็นคลังสารสนเทศที่มีโครงสร้าง ดึงข้อมูลหน่วยความจำระยะยาว (Long-Term Memory) ผ่าน Hard Relevance Gate เพื่อป้องกัน Memory Pollution',
      fsmGate: 'Hard Relevance Filter (Cosine Threshold ≥ 0.72) & Deduplication',
      input: 'Raw Documents, User Assertions, Relevant LTM Memory Bank',
      output: 'Structured Knowledge Base & Epistemic Token Registry'
    },
    {
      num: '05',
      id: 'relationship-modeling',
      nameEn: 'Relationship Modeling',
      nameTh: 'แบบจำลองความสัมพันธ์เชิงตรรกะ',
      icon: '🕸️',
      description: 'สร้างกราฟ Directed Acyclic Graph (DAG) และแบบจำลองความสัมพันธ์เชิงเหตุผล (Causal & Dependency Modeling) ระหว่างตัวแปร ปัจจัยขับเคลื่อน และผลกระทบ',
      fsmGate: 'Causal Directed Graph Consistency Check',
      input: 'Structured Knowledge Base',
      output: 'Causal Dependency Graph with Causal Links'
    },
    {
      num: '06',
      id: 'hypothesis-formation',
      nameEn: 'Hypothesis Formation (ACH)',
      nameTh: 'สมมติฐานทางเลือกคู่ขนาน ACH',
      icon: '⚖️',
      description: 'สร้างชุดสมมติฐานทางเลือกคู่ขนาน (H1, H2, H3) ตามระเบียบวิธี Analysis of Competing Hypotheses พร้อมคำนวณ Prior Probability เพื่อป้องกัน Confirmation Bias',
      fsmGate: 'Mutually Exclusive & Collectively Exhaustive (MECE) Hypothesis Gate',
      input: 'Causal Dependency Graph + Strategic Query',
      output: 'ACH Multi-Hypothesis Set (H1: Baseline, H2: Opportunistic, H3: Risk-Averse)'
    },
    {
      num: '07',
      id: 'evidence-evaluation',
      nameEn: 'Evidence Evaluation',
      nameTh: 'ประเมินและจำแนกหลักฐานเชิงประจักษ์',
      icon: '🔍',
      description: 'ตรวจสอบความถูกต้องของหลักฐาน ถ่วงน้ำหนักความน่าเชื่อถือ และติดป้ายกำกับตาม Epistemic Taxonomy ([FACT], [INFERENCE], [HYPOTHESIS], [UNKNOWN], [EVIDENCE] ฯลฯ)',
      fsmGate: 'Admiralty Reliability Scoring & Epistemic Classification Gate',
      input: 'ACH Hypotheses + Evidence Items',
      output: 'Diagnostic Evidence Matrix & Weighted Evidentiary Ledger'
    },
    {
      num: '08',
      id: 'risk-critique',
      nameEn: 'Risk & Critique Analysis',
      nameTh: 'วิเคราะห์ความเสี่ยงและจุดวิพากษ์',
      icon: '🛡️',
      description: 'จำลองการโจมตีเชิงตรรกะ (Red Team AI / Vulnerability Critique) ระบุจุดบอด (Blind Spots) ประเมินความเสี่ยงขาลง (Downside Risks) และสมมติฐานที่เปราะบาง',
      fsmGate: 'Adversarial Stress-Test & Vulnerability Assessment',
      input: 'Diagnostic Evidence Matrix + System Hypotheses',
      output: 'Risk Matrix, Vulnerability Report & Worst-Case Scenario Tree'
    },
    {
      num: '09',
      id: 'strategic-options',
      nameEn: 'Strategic Options',
      nameTh: 'สังเคราะห์ทางเลือกเชิงยุทธศาสตร์',
      icon: '📊',
      description: 'เปรียบเทียบทางเลือกเชิงยุทธศาสตร์ วิเคราะห์ Trade-offs คำนวณ Calibrated Confidence Score แบบ Bayesian และประเมินความคุ้มค่า (Expected Value)',
      fsmGate: 'Bayesian Confidence Formulation & Trade-off Optimization',
      input: 'Risk Matrix + Validated Hypotheses',
      output: 'Calibrated Strategic Options Portfolio with Confidence Bounds'
    },
    {
      num: '10',
      id: 'analysis-communication',
      nameEn: 'Analysis Communication',
      nameTh: 'การสื่อสารบทวิเคราะห์ผู้บริหาร',
      icon: '📑',
      description: 'สังเคราะห์บทวิเคราะห์เป็น Executive Decision Dossier สื่อสารชัดเจน กระชับ พร้อม Real-time Epistemic Transparency Stream และ Actionable Next Steps',
      fsmGate: 'Executive Readability & Structured Taxonomy Rendering Gate',
      input: 'Strategic Options Portfolio + Confidence Metrics',
      output: 'Executive Dossier & Multi-Perspective Strategic Brief'
    },
    {
      num: '11',
      id: 'review-verification',
      nameEn: 'Review & Verification',
      nameTh: 'การทบทวนและตรวจสอบความสอดคล้อง',
      icon: '✅',
      description: 'ทบทวนกระบวนการคิดทั้งหมด (Meta-Reflection) ตรวจสอบความถูกต้องตามกฎ Anti-Fabrication และความสอดคล้องกับมาตรฐาน ISO/IEC 42001 & NIST AI RMF',
      fsmGate: 'ISO 42001 / NIST AI RMF Governance & Anti-Fabrication Audit',
      input: 'Complete Reasoning Trace & Generated Output',
      output: 'Cryptographic WORM Audit Package (SHA-256 Checksum + RFC 3161 Token)'
    },
    {
      num: '12',
      id: 'continuous-improvement',
      nameEn: 'Continuous Improvement & Human Gate',
      nameTh: 'ปรับปรุงอย่างต่อเนื่องและเคารพ Human Agency',
      icon: '🔥',
      description: 'บันทึกบทเรียนเพื่อพัฒนาองค์ความรู้ และหยุดรอการตัดสินใจขั้นสุดท้ายจากมนุษย์ (Level-3 Hard Stop Safety Gate) สงวนอำนาจการตัดสินใจไว้ที่มนุษย์ 100%',
      fsmGate: 'Inviolable Human Sovereignty Gate (The Keeper Never Assumes Ownership of the Flame)',
      input: 'Validated Audit Package + Human Feedback Interface',
      output: 'Committed Decision Record & Long-Term System Evolution'
    }
  ];

  const citationText = `PUNN. (2026). PUNN Predictive Cognitive Architecture (PCA v3.0): 12-Stage Epistemic Reasoning, Calibrated Confidence, and Enterprise AI Decision Governance Specification. FIRE KEEPER Project. https://firekeeper.site/punn-pca`;

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(citationText);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  return (
    <div className={`min-h-screen ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#0B0F19] text-slate-100'} transition-colors duration-200`}>
      {/* Top Header / Breadcrumb Bar */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 sm:px-8 py-3.5 ${
        isLight ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-[#0F172A]/90 border-slate-800'
      }`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome || onBackToApp}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to FIRE KEEPER</span>
            </button>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />
            <nav className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-500">
              <span>firekeeper.site</span>
              <span>/</span>
              <span className="text-[#FF8A00] font-bold">punn-pca</span>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Canonical Standard v3.0
            </span>
          </div>
        </div>
      </header>

      {/* Main Canonical Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-16">
        
        {/* Section 1: Hero & Canonical Entity Definition */}
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium border bg-amber-500/10 border-amber-500/30 text-amber-500">
            <Flame className="w-3.5 h-3.5 text-[#FF8A00]" />
            <span>Canonical Architecture Knowledge Base · PUNN PCA v3.0</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-sans leading-tight">
              PUNN Predictive Cognitive Architecture (PCA)
            </h1>
            <p className="text-lg sm:text-xl font-medium text-[#FF8A00]">
              The 12-Stage Epistemic Reasoning, Calibrated Confidence &amp; AI Decision Governance Framework
            </p>
          </div>

          {/* Canonical Definition Box */}
          <div className={`p-6 rounded-xl border space-y-4 ${
            isLight ? 'bg-white border-amber-200/80 shadow-sm' : 'bg-slate-900/80 border-amber-500/20'
          }`}>
            <h2 className="text-xs font-mono uppercase tracking-wider text-amber-500 font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Canonical Definition · คำจำกัดความอย่างเป็นทางการ
            </h2>
            <div className="space-y-3">
              <p className="text-base sm:text-lg leading-relaxed font-medium">
                <strong>PUNN Predictive Cognitive Architecture (PCA)</strong> is an enterprise-grade cognitive reasoning and decision intelligence framework developed by <strong>PUNN</strong>. It operates as the underlying architecture powering the <strong>FIRE KEEPER</strong> platform, establishing a structured finite state machine for multi-source context understanding, diagnostic evidence evaluation, Bayesian confidence calibration, adversarial risk analysis, and auditable cryptographic verification under human sovereignty.
              </p>
              <div className={`p-4 rounded-lg border text-sm sm:text-base leading-relaxed space-y-2 ${
                isLight ? 'bg-amber-50/60 border-amber-200 text-slate-800' : 'bg-amber-500/10 border-amber-500/30 text-slate-100'
              }`}>
                <p className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <strong className="text-[#FF8A00]">FIRE KEEPER</strong> คือแพลตฟอร์มปัญญาการตัดสินใจสำหรับผู้บริหารระดับองค์กรและธรรมาภิบาล AI ซึ่งออกแบบมาเพื่อช่วยองค์กรวิเคราะห์ข้อมูลที่ซับซ้อน ประเมินความเสี่ยง และสนับสนุนการตัดสินใจที่มีความมั่นใจสูง
                </p>
                <p className={`text-xs sm:text-sm pt-2 border-t ${
                  isLight ? 'border-amber-200 text-slate-700' : 'border-amber-500/20 text-slate-200'
                }`}>
                  <strong className="text-[#FF8A00]">PUNN Predictive Cognitive Architecture (PCA)</strong> คือสถาปัตยกรรมพื้นฐานที่ขับเคลื่อน FIRE KEEPER โดยจัดเตรียมกรอบการทำงานที่มีโครงสร้างสำหรับ บริบท หลักฐาน การให้เหตุผล และปัญญาด้านการตัดสินใจ
                </p>
              </div>
            </div>
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 border-t border-slate-200 dark:border-slate-800">
              <span>Canonical Version: <strong>3.0 (2026 Edition)</strong></span>
              <span>•</span>
              <span>Creator / Architect: <strong>PUNN (ปุญญ์)</strong></span>
              <span>•</span>
              <span>Platform Implementation: <strong>FIRE KEEPER (firekeeper.site)</strong></span>
            </div>
          </div>
        </section>

        {/* Section 2: Entity Relationship Graph & Architectural Lineage */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-2xl font-bold font-sans flex items-center gap-2.5">
              <GitBranch className="w-6 h-6 text-[#FF8A00]" />
              Entity Hierarchy &amp; Architectural Lineage
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              โครงสร้างความสัมพันธ์เชิงภววิทยาและสายวิวัฒนาการ 6 ขั้นตอน จาก Reference Prototype สู่ Enterprise Decision Intelligence
            </p>
          </div>

          <div className={`p-6 rounded-xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="p-4 rounded-lg bg-black/5 dark:bg-black/30 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-mono text-amber-500 font-bold">1. ARCHITECT / CREATOR</div>
              <h3 className="text-base font-bold">PUNN (ปุญญ์)</h3>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Cognitive Architect และผู้ริเริ่มหลักการ Epistemic Purity, ทฤษฎีเอกภาพแห่งผู้รักษาไฟ และกระบวนการลดเอนโทรปีทางความคิด
              </p>
            </div>

            <div className="p-4 rounded-lg bg-sky-500/5 border border-sky-500/30 space-y-2">
              <div className="text-xs font-mono text-sky-400 font-bold">2. HISTORICAL PROTOTYPE</div>
              <h3 className="text-base font-bold text-sky-400">punn-pca Prototype</h3>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Reference Prototype &amp; Cognitive DNA 12 ขั้นตอน บันทึกใน repository <code>punn-pca/punn-cognitive-architecture</code>
              </p>
            </div>

            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/30 space-y-2 relative">
              <div className="text-xs font-mono text-amber-500 font-bold">3. COGNITIVE ARCHITECTURE</div>
              <h3 className="text-base font-bold text-[#FF8A00]">PUNN PCA (v3.0)</h3>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                สถาปัตยกรรมปัญญาประดิษฐ์ 12 ขั้นตอน (FSM with Epistemic Gates) จัดระเบียบการให้เหตุผล (“LLMs generate language. PCA structures reasoning.”)
              </p>
            </div>

            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/30 space-y-2">
              <div className="text-xs font-mono text-emerald-500 font-bold">4. ENTERPRISE PLATFORM</div>
              <h3 className="text-base font-bold text-emerald-400">FIRE KEEPER</h3>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Enterprise Executive Decision Intelligence &amp; AI Governance Platform สำหรับสนับสนุนการตัดสินใจระดับบริหาร (firekeeper.site)
              </p>
            </div>
          </div>

          {/* Historical Reference Callout */}
          <div className={`p-4 rounded-xl border font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLight ? 'bg-sky-50/80 border-sky-200 text-sky-950' : 'bg-sky-950/30 border-sky-500/30 text-sky-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-sky-500 shrink-0" />
              <span>Historical Architecture Reference: <strong>github.com/punn-pca/punn-cognitive-architecture</strong></span>
            </div>
            <a 
              href="https://github.com/punn-pca/punn-cognitive-architecture" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline shrink-0"
            >
              <span>View Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>

        {/* Section 3: The 12 Canonical Stages */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-2xl font-bold font-sans flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-[#FF8A00]" />
              The 12 Canonical Stages of PCA (v3.0 Pipeline)
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              โครงสร้างกระบวนการคิด 12 สถานะต่อเนื่องแบบ White-Box พร้อมเกณฑ์ตรวจสอบเชิงญาณวิทยาในทุกจุด
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CANONICAL_STAGES.map((stg, index) => (
              <div 
                key={stg.id}
                onClick={() => setSelectedStage(selectedStage === index ? null : index)}
                className={`p-5 rounded-xl border transition-all cursor-pointer ${
                  selectedStage === index
                    ? 'border-amber-500 bg-amber-500/5 shadow-md'
                    : isLight 
                      ? 'bg-white border-slate-200 hover:border-slate-300' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{stg.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#FF8A00]">STAGE {stg.num}</span>
                        <h3 className="text-sm font-bold">{stg.nameEn}</h3>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{stg.nameTh}</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs leading-relaxed mt-3 text-slate-600 dark:text-slate-300">
                  {stg.description}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-[11px] font-mono">
                  <div className="text-amber-600 dark:text-amber-400">
                    <strong>Gate:</strong> {stg.fsmGate}
                  </div>
                  {selectedStage === index && (
                    <div className="space-y-1 pt-1 text-slate-500 dark:text-slate-400">
                      <div><strong>Input:</strong> {stg.input}</div>
                      <div><strong>Output:</strong> {stg.output}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Epistemic Evidence Taxonomy */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-2xl font-bold font-sans flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              Epistemic Evidence &amp; Information Taxonomy Standard (16 Tags / 4 Pillars)
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              ระบบจำแนกสถานะของสารสนเทศ 16 หมวดหมู่ ภายใต้ 4 เสาหลักทางญาณวิทยาเพื่อขจัดภาพหลอนและเคารพ Human Agency
            </p>
          </div>

          <div className="space-y-8">
            {(Object.keys(TAXONOMY_PILLARS) as TaxonomyPillar[]).map((pillarKey) => {
              const pillar = TAXONOMY_PILLARS[pillarKey];
              const items = INFORMATION_TAXONOMY_LIST.filter((t) => t.pillar === pillarKey);

              return (
                <div key={pillarKey} className="space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md border ${pillar.badgeClass}`}>
                        {pillar.titleEn}
                      </span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {pillar.titleTh}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {items.length} Standard Tokens
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    {pillar.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                    {items.map((tax) => (
                      <div 
                        key={tax.type}
                        className={`p-4 rounded-xl border space-y-2.5 ${
                          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <TaxonomyTag type={tax.type} />
                          <span className="text-[10px] font-mono text-slate-400">{tax.thLabel}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          {tax.description}
                        </p>
                        <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span>Standard Tag</span>
                          <strong className="text-amber-500 font-mono">{tax.label}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 5: Mathematical Formulation & Bayesian Calibration */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-2xl font-bold font-sans flex items-center gap-2.5">
              <Scale className="w-6 h-6 text-purple-500" />
              Mathematical &amp; Epistemic Formulations
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              สูตรคณิตศาสตร์และสมการการปรับเทียบความมั่นใจตามหลักการ Bayesian
            </p>
          </div>

          <div className={`p-6 rounded-xl border space-y-5 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div>
              <h3 className="text-sm font-mono font-bold text-amber-500 mb-2">
                1. Heuristic Bayesian-Inspired Confidence Formulation
              </h3>
              <div className="p-4 rounded-lg bg-black/10 dark:bg-black/40 border border-slate-200 dark:border-slate-800 font-mono text-xs overflow-x-auto text-amber-400">
                Confidence Score = min(0.99, max(0.10, BaseConfidence × (1 - EpistemicPenalty) + EvidenceBoost))
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                โดยมีเพดานความมั่นใจสูงสุดจำกัดที่ <strong>0.99</strong> เสมอ เพื่อสะท้อนความถ่อมตนเชิงญาณวิทยา (Epistemic Modesty) ว่าไม่มีสิ่งใดในระบบที่มีความแน่นอนเบ็ดเสร็จ
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-mono font-bold text-purple-500 mb-2">
                2. Information Physics &amp; Cognitive Entropy Reduction
              </h3>
              <div className="p-4 rounded-lg bg-black/10 dark:bg-black/40 border border-slate-200 dark:border-slate-800 font-mono text-xs overflow-x-auto text-purple-400">
                H(X) = - Σ P(x_i) log₂ P(x_i)  →  Minimized across Stage 01–11
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                กลั่นกรองข้อมูลนำเข้าที่มีค่าเอนโทรปีทางความคิดสูง (High Entropy) ให้กลายเป็นโครงสร้างสารสนเทศที่มีระเบียบสูงสุด (Actionable Structural Knowledge) พร้อมอัตราส่วนสัญญาณต่อสัญญาณรบกวน (SNR) สูงสุด
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Governance, Standards & WORM Audit */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-2xl font-bold font-sans flex items-center gap-2.5">
              <Lock className="w-6 h-6 text-emerald-500" />
              Governance Rules &amp; Standards Alignment
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              การกำกับดูแลภายในตามกฎเกณฑ์สถาปัตยกรรม (Internal Architecture Alignment) และการตรวจสอบย้อนกลับเชิงตรรกะ
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-5 rounded-xl border space-y-2 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="text-xs font-mono font-bold text-emerald-500">GOVERNANCE ALIGNMENT</div>
              <h3 className="text-sm font-bold">ISO/IEC 42001:2023 Principles</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                การวางสถาปัตยกรรมสอดรับกับหลักการ AIMS — ออกแบบกฎกำกับดูแลภายใน (Governance Rule Engine) เพื่อควบคุมความเสี่ยง การแยกแยะ Fact/Inference และการบันทึกกระบวนการให้ตรวจสอบได้
              </p>
            </div>

            <div className={`p-5 rounded-xl border space-y-2 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="text-xs font-mono font-bold text-blue-500">RISK MANAGEMENT ALIGNMENT</div>
              <h3 className="text-sm font-bold">NIST AI RMF 1.0 Taxonomy</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                โครงสร้างการประเมินความเสี่ยงตามแนวทาง Govern, Map, Measure, Manage เพื่อบริหารความน่าเชื่อถือ (Trustworthiness) และความปลอดภัยของระบบ
              </p>
            </div>

            <div className={`p-5 rounded-xl border space-y-2 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="text-xs font-mono font-bold text-purple-500">FORENSIC TRACEABILITY</div>
              <h3 className="text-sm font-bold">Cryptographic Ledger / Event Hash</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                การสร้าง SHA-256 Checksum, Event Hash และสถานะ Commit ไปยังบันทึกการประมวลผล (COMMITTED_TO_WORM_LEDGER) เพื่อรองรับการตรวจสอบย้อนกลับของแต่ละ Trace
              </p>
            </div>

            <div className={`p-5 rounded-xl border space-y-2 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="text-xs font-mono font-bold text-red-500">HUMAN SOVEREIGNTY</div>
              <h3 className="text-sm font-bold">Human Exclusive &amp; Advisory Only</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                ระบบถูกออกแบบให้เป็น Advisory Only โดยสมบูรณ์ ไม่มีกลไกตัดสินใจหรือสั่งการอัตโนมัติ (No autonomous executive action) เพื่อสงวนอำนาจการตัดสินใจไว้ที่มนุษย์ 100%
              </p>
            </div>
          </div>
        </section>

        {/* Section 7: Formal Citation & Attribution */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-xl font-bold font-sans flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#FF8A00]" />
              Canonical Citation &amp; Attribution
            </h2>
          </div>

          <div className={`p-5 rounded-xl border space-y-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <p className="text-xs text-slate-500">
              สำหรับการอ้างอิงเอกสารและสถาปัตยกรรมในงานวิจัย เอกสารวิชาการ หรือการตรวจสอบระบบ กรุณาใช้รูปแบบการอ้างอิงมาตรฐานด้านล่างนี้:
            </p>
            <div className="p-3.5 rounded-lg bg-black/20 border border-slate-200 dark:border-slate-800 font-mono text-xs break-all text-slate-700 dark:text-slate-300">
              {citationText}
            </div>
            <button
              onClick={handleCopyCitation}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                copiedCitation
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-[#FF8A00] border border-amber-500/30'
              }`}
            >
              {copiedCitation ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied Citation</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Canonical Citation</span>
                </>
              )}
            </button>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className={`border-t px-4 sm:px-8 py-8 text-center text-xs font-mono ${
        isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#0F172A] border-slate-800 text-slate-400'
      }`}>
        <div className="max-w-5xl mx-auto space-y-2">
          <p>
            FIRE KEEPER · Powered by PUNN Predictive Cognitive Architecture (PCA v3.0)
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Official Platform: <a href="https://firekeeper.site" className="text-[#FF8A00] hover:underline">firekeeper.site</a> · Canonical Architecture Specification
          </p>
        </div>
      </footer>
    </div>
  );
};
