import React, { useState } from 'react';
import { 
  Flame, 
  Sparkles, 
  Brain, 
  Compass, 
  Layers, 
  Cpu, 
  Globe, 
  FileText, 
  ShieldCheck, 
  ChevronRight, 
  Quote, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  Atom, 
  Eye, 
  HeartHandshake, 
  GitBranch, 
  Terminal, 
  Scale, 
  ExternalLink 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface MilestoneItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  content: React.ReactNode;
}

export const FireKeeperHistorySection: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [selectedMilestone, setSelectedMilestone] = useState<string>('all');

  const COGNITIVE_DNA_STAGES = [
    { num: 1, name: 'Observation', th: 'การสังเกตและรับรู้ข้อมูล' },
    { num: 2, name: 'Understanding', th: 'การทำความเข้าใจบริบท' },
    { num: 3, name: 'Purpose', th: 'การกำหนดเป้าหมายและเจตนา' },
    { num: 4, name: 'Memory', th: 'การเชื่อมโยงความจำและประวัติ' },
    { num: 5, name: 'Mental Model', th: 'การสร้างแบบจำลองความคิด' },
    { num: 6, name: 'Hypothesis', th: 'การตั้งสมมติฐานทางเลือก' },
    { num: 7, name: 'Evidence Evaluation', th: 'การประเมินหลักฐานเชิงประจักษ์' },
    { num: 8, name: 'Critique', th: 'การวิพากษ์และทดสอบจุดเปราะบาง' },
    { num: 9, name: 'Decision', th: 'การสังเคราะห์ข้อเสนอแนะเพื่อการตัดสินใจ' },
    { num: 10, name: 'Communication', th: 'การสื่อสารที่ชัดเจนและโปร่งใส' },
    { num: 11, name: 'Reflection', th: 'การทบทวนและสะท้อนผลลัพธ์' },
    { num: 12, name: 'Learning', th: 'การเรียนรู้และปรับปรุงอย่างต่อเนื่อง' },
  ];

  const CHARTER_PRINCIPLES = [
    { en: 'Purpose before response', th: 'ตั้งเป้าหมายและเจตนาก่อนสร้างคำตอบ' },
    { en: 'Understanding before generation', th: 'ทำความเข้าใจบริบทก่อนการสร้างข้อความ' },
    { en: 'Evidence before confidence', th: 'มีหลักฐานรองรับก่อนแสดงความมั่นใจ' },
    { en: 'Transparency before persuasion', th: 'เปิดเผยกระบวนการคิดก่อนการโน้มน้าว' },
    { en: 'Human agency above automation', th: 'คุ้มครองสิทธิในการตัดสินใจของมนุษย์เหนือระบบอัตโนมัติ' },
    { en: 'Continuous learning through evidence', th: 'เรียนรู้และพัฒนาอย่างต่อเนื่องผ่านหลักฐานเชิงประจักษ์' },
    { en: 'Architecture before implementation', th: 'วางโครงสร้างสถาปัตยกรรมก่อนการลงมือสร้าง' },
  ];

  const milestones: MilestoneItem[] = [
    {
      id: 'origin',
      title: 'จุดกำเนิด — ชื่อของคนคนหนึ่งสู่ปรัชญาญาณวิทยา',
      subtitle: 'The Inception · Identity, Meaning & Epistemic Purity',
      badge: 'จุดเริ่มต้น',
      icon: Sparkles,
      color: 'amber',
      content: (
        <div className="space-y-3">
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            FIRE KEEPER ไม่ได้เริ่มต้นจากเว็บไซต์ ไม่ได้เริ่มต้นจากโมเดล AI และไม่ได้เริ่มต้นจากการสร้างผลิตภัณฑ์สำเร็จรูป
          </p>
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            จุดเริ่มต้นอยู่ที่ <strong className={`font-semibold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>ชื่อและตัวตนของ ปุญญ์</strong> (PUNN มีรากศัพท์จากคุณงามความดี ความบริสุทธิ์ การชำระให้สะอาด และความเจริญงอกงาม)
          </p>
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            ชื่อไม่ได้เป็นเพียงสิ่งที่ใช้ระบุตัวบุคคล แต่กลายเป็นจุดตั้งต้นของการตั้งคำถามเกี่ยวกับความหมายของตัวตน การดำรงอยู่ คุณค่าของชีวิต และสิ่งที่มนุษย์ควรเป็นผู้รักษาไว้ท่ามกลางโลกที่เปลี่ยนแปลงอยู่ตลอดเวลา
          </p>
          <div className={`p-4 rounded-xl border font-medium italic my-2 ${isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-200'}`}>
            <Quote className="w-4 h-4 text-amber-500 mb-1 inline mr-1 opacity-70" />
            "มนุษย์จะรักษาสิ่งสำคัญที่สุดของตัวเองเอาไว้ได้อย่างไร ในโลกที่เต็มไปด้วยความไม่แน่นอน?"
          </div>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            จากคำถามเกี่ยวกับตัวเอง ค่อย ๆ ขยายไปสู่คำถามที่ใหญ่ขึ้น จนแนวคิดของ Firekeeper ค่อย ๆ ก่อตัวขึ้น
          </p>
        </div>
      ),
    },
    {
      id: 'firekeeper',
      title: 'Firekeeper — สัญลักษณ์ผู้รักษาไฟและ Human Agency',
      subtitle: 'Symbolism of Life, Human Agency & Meaning',
      badge: 'สัญลักษณ์และปรัชญา',
      icon: Flame,
      color: 'orange',
      content: (
        <div className="space-y-3">
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            คำว่า <strong>Firekeeper</strong> กลายเป็นสัญลักษณ์ของแนวคิดดังกล่าว โดยกำหนดบทบาทความสัมพันธ์ระหว่างมนุษย์และระบบปัญญา:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
            <div className={`p-3.5 rounded-xl border space-y-1 ${isLight ? 'bg-slate-50 border-orange-200 text-[#172033]' : 'bg-slate-900/80 border-orange-500/30 text-slate-300'}`}>
              <span className={`text-xs font-mono font-bold block uppercase ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>“ไฟ” (The Sacred Fire)</span>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                ไม่ได้หมายถึงไฟในความหมายทางกายภาพเพียงอย่างเดียว แต่หมายถึง <strong>เจตจำนงอิสระ (Human Agency), สิทธิ์ในการเลือก, ความรับผิดชอบ</strong> และสิ่งที่ทำให้มนุษย์มีชีวิต มีความหมาย และเดินหน้าต่อไป
              </p>
            </div>
            <div className={`p-3.5 rounded-xl border space-y-1 ${isLight ? 'bg-slate-50 border-amber-200 text-[#172033]' : 'bg-slate-900/80 border-amber-500/30 text-slate-300'}`}>
              <span className={`text-xs font-mono font-bold block uppercase ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>“ผู้รักษา” (The Keeper)</span>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                ไม่ได้หมายถึงผู้ที่ครอบครองไฟ แต่หมายถึงผู้ที่ <strong className={isLight ? 'text-amber-700' : 'text-amber-300'}>คอยระวัง รักษาไฟไม่ให้ดับ และไม่เคยคิดจะแย่งไฟไปจากมือของมนุษย์</strong>
              </p>
            </div>
          </div>
          <p className={`leading-relaxed text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            แนวคิดนี้จึงยึดมั่นในเรื่อง: <em>การมีอยู่, การเลือก, อิสรภาพ, ความหมาย, ความรู้, ความเข้าใจ และความสามารถของมนุษย์ในการกำหนดเส้นทางของตนเอง</em>
          </p>
          <p className={`text-xs font-semibold ${isLight ? 'text-amber-700' : 'text-amber-400/90'}`}>
            ✦ Firekeeper จึงเริ่มต้นในฐานะแนวคิดเชิงปรัชญา ธรรมาภิบาล และตัวตน ก่อนที่จะพัฒนาเป็นเทคโนโลยี
          </p>
        </div>
      ),
    },
    {
      id: 'repo-prototype',
      title: 'ต้นแบบ Repository เดิม และ Cognitive DNA',
      subtitle: 'punn-pca/punn-cognitive-architecture · The Reference Prototype',
      badge: 'หลักฐานทางประวัติศาสตร์ & เทคนิค',
      icon: GitBranch,
      color: 'sky',
      content: (
        <div className="space-y-4">
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            สถาปัตยกรรม PUNN Cognitive Architecture (PCA) มีหลักฐานเชิงประวัติศาสตร์และเชิงเทคนิคที่บันทึกไว้ใน Repository:
          </p>

          <div className={`p-4 rounded-xl border font-mono text-xs space-y-2 ${isLight ? 'bg-slate-50 border-sky-300 text-sky-950' : 'bg-sky-950/40 border-sky-500/40 text-sky-200'}`}>
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-500" />
                <span>Repository: punn-pca/punn-cognitive-architecture</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 text-[10px]">
                Original Prototype Reference
              </span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              Repository นี้เป็นต้นแบบและพื้นที่พัฒนาระยะแรกของ PUNN Cognitive Architecture เพื่อพิสูจน์ว่า PCA ไม่ได้เริ่มต้นจากเว็บไซต์หรือผลิตภัณฑ์สำเร็จรูปในปัจจุบัน แต่มีพัฒนาการอย่างเป็นรูปธรรมจาก <strong>Cognitive Architecture Prototype</strong> มาก่อน
            </p>
          </div>

          <div className="space-y-2">
            <h4 className={`text-xs font-mono font-bold uppercase ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              ลำดับ Cognitive DNA 12 ขั้นตอน ใน Repository เดิม:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
              {COGNITIVE_DNA_STAGES.map((s) => (
                <div key={s.num} className={`p-2 rounded-lg border ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`}>
                  <div className="font-mono text-[10px] text-amber-500 font-bold">
                    {String(s.num).padStart(2, '0')}. {s.name}
                  </div>
                  <div className="text-[11px] opacity-80 truncate">{s.th}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border space-y-2 text-xs ${isLight ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-amber-500/10 border-amber-500/30 text-amber-200'}`}>
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>คุณสมบัติสำคัญของ Reference Prototype / Educational Implementation:</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] list-disc list-inside">
              <li>การประมวลผล Cognitive DNA ตามลำดับ</li>
              <li>Shared Cognitive State ที่ตรวจสอบได้</li>
              <li>Timestamped stage outputs ทุกขั้นตอน</li>
              <li>Traceable memory & Source context</li>
              <li>Confidence metrics อิงหลักฐาน</li>
              <li>Firekeeper supervision & Governance</li>
              <li>Uncertainty awareness & Boundary limits</li>
              <li>Deterministic behavior (ทำงานแกนหลักได้โดยไม่ต้องพึ่งพาโมเดลภายนอก)</li>
            </ul>
            <p className="text-[10px] opacity-80 italic pt-1 border-t border-amber-500/20">
              *ระบุอย่างถูกต้องว่าเป็น Reference Prototype / Educational Implementation และไม่ใช่ระบบ PCA ที่สมบูรณ์ทั้งหมดในปัจจุบัน
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'supervision',
      title: 'Firekeeper Supervision — กลไกกำกับดูแลและธรรมาภิบาล',
      subtitle: 'Supervisory Control, Uncertainty Disclosure & Anti-Coercion',
      badge: 'การกำกับดูแล',
      icon: Scale,
      color: 'purple',
      content: (
        <div className="space-y-3">
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            ใน Prototype เดิม แนวคิด <strong>Firekeeper</strong> ทำหน้าที่เป็นกลไก Supervision และ Governance เพื่อคอยกำกับตรวจสอบว่า:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-2">
            {[
              {
                title: 'Human Agency Inviolability',
                desc: 'ระบบต้องรักษาความเป็นอิสระของมนุษย์ และไม่แทนที่การตัดสินใจของมนุษย์',
              },
              {
                title: 'Non-Coercive Recommendations',
                desc: 'คำแนะนำต้องถูกนำเสนอเป็นทางเลือกเชิงยุทธศาสตร์ ไม่ใช่คำสั่งบังคับ',
              },
              {
                title: 'Uncertainty Disclosure',
                desc: 'ความไม่แน่นอน (Epistemic Uncertainty) และข้อจำกัดต้องถูกเปิดเผยอย่างโปร่งใส',
              },
              {
                title: 'Evidence-Backed Confidence',
                desc: 'ระดับความมั่นใจ (Confidence Score) ต้องมีหลักฐานเชิงประจักษ์รองรับเสมอ',
              },
            ].map((item, idx) => (
              <div key={idx} className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-purple-200 text-purple-950' : 'bg-purple-950/30 border-purple-500/30 text-purple-200'}`}>
                <div className="font-bold text-xs font-mono mb-1 text-purple-600 dark:text-purple-400">✓ {item.title}</div>
                <div className="text-xs opacity-90 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>

          <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            แนวคิด <strong>Firekeeper / Human Agency / Governance</strong> จึงมีรากฐานมั่นคงอยู่ใน Prototype เดิม และต่อมาได้พัฒนาเป็นแนวคิดที่ครอบคลุมใน <strong>FIRE KEEPER Platform</strong>
          </p>
        </div>
      ),
    },
    {
      id: 'charter',
      title: 'Charter และหลักปรัชญาของ PCA',
      subtitle: 'The 7 Core Principles & Purpose of Intelligence',
      badge: 'กฎบัตร & หลักการ',
      icon: BookOpen,
      color: 'emerald',
      content: (
        <div className="space-y-3">
          <div className={`p-4 rounded-2xl border text-center space-y-2 ${isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'}`}>
            <span className="text-[10px] font-mono uppercase tracking-wider block text-emerald-600 dark:text-emerald-400 font-bold">
              CHARTER PHILOSOPHY AXIOM
            </span>
            <blockquote className="text-sm sm:text-base font-bold italic leading-relaxed">
              “The purpose of intelligence is not to think for humanity.<br />
              The purpose of intelligence is to help humanity think better.”
            </blockquote>
            <p className="text-xs sm:text-sm font-semibold opacity-90">
              “จุดประสงค์ของปัญญาไม่ใช่การคิดแทนมนุษยชาติ แต่คือการช่วยให้มนุษยชาติคิดได้ดีขึ้น”
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <span className={`text-xs font-mono font-bold block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              7 หลักการสำคัญตามกฎบัตร (CHARTER.md):
            </span>
            <div className="space-y-1.5">
              {CHARTER_PRINCIPLES.map((cp, idx) => (
                <div key={idx} className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/80 border-slate-800 text-slate-200'}`}>
                  <span className="font-mono text-amber-500 font-bold shrink-0">{idx + 1}. {cp.en}</span>
                  <span className="text-right text-[11px] opacity-80">{cp.th}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'evolution',
      title: 'การพัฒนาจาก Prototype สู่ Enterprise Platform',
      subtitle: 'The 6-Phase Architectural Lineage',
      badge: 'สายวิวัฒนาการ',
      icon: Layers,
      color: 'indigo',
      content: (
        <div className="space-y-3">
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            พัฒนาการของโครงการมีสายวิวัฒนาการ (Architectural Lineage) ที่ชัดเจนและต่อเนื่อง:
          </p>

          {/* Evolution Pipeline Diagram */}
          <div className={`p-4 rounded-xl border space-y-2 font-mono text-xs ${isLight ? 'bg-slate-50 border-indigo-200 text-indigo-950' : 'bg-slate-950 border-indigo-500/30 text-indigo-200'}`}>
            <div className="flex flex-col gap-2">
              {[
                { phase: '1. Cognitive Prototype', desc: 'Reference Implementation ใน punn-pca/punn-cognitive-architecture' },
                { phase: '2. Cognitive DNA', desc: 'วงจรกระบวนการรู้คิด 12 ขั้นตอนเชิงลำดับ (Observation → Learning)' },
                { phase: '3. Firekeeper Supervision', desc: 'กลไกตรวจสอบ Human Agency, Uncertainty Disclosure, Evidence-backed' },
                { phase: '4. Human Agency & Governance', desc: 'กรอบธรรมาภิบาลป้องกันการครอบงำการตัดสินใจ' },
                { phase: '5. PUNN Cognitive Architecture (PCA)', desc: 'สถาปัตยกรรมการรู้คิดชั้นสูงที่จัดระเบียบตรรกะและการให้เหตุผล' },
                { phase: '6. FIRE KEEPER Platform', desc: 'Enterprise Executive Decision Intelligence & AI Governance Platform' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${idx === 5 ? 'bg-[#FF8A00] text-slate-950' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-xs">{step.phase}</div>
                    <div className="text-[11px] opacity-75">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className={`p-3.5 rounded-xl border space-y-1.5 ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`}>
              <div className="font-bold font-mono text-sky-500">🏛️ Repository เดิม (punn-pca)</div>
              <p className="text-[11px] opacity-80 leading-relaxed">
                หลักฐานเชิงประวัติศาสตร์ของต้นกำเนิดแนวคิด, Cognitive DNA, Reference Prototype, Firekeeper supervision, และการทดลองเชิงสถาปัตยกรรมระยะแรก
              </p>
            </div>
            <div className={`p-3.5 rounded-xl border space-y-1.5 ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`}>
              <div className="font-bold font-mono text-amber-500">🔥 FIRE KEEPER ปัจจุบัน</div>
              <p className="text-[11px] opacity-80 leading-relaxed">
                แพลตฟอร์มระดับองค์กรด้าน Executive Decision Intelligence, AI Governance, Risk Evaluation, Evidence-based Reasoning และ Human Oversight
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'entity-core',
      title: 'บทบาทและแกนกลาง: สถาปัตยกรรม vs แพลตฟอร์ม',
      subtitle: 'LLMs generate language. PCA structures reasoning.',
      badge: 'แก่นแท้แห่งไฟ',
      icon: ShieldCheck,
      color: 'amber',
      content: (
        <div className="space-y-3">
          <div className={`p-4 rounded-xl border space-y-2 text-xs font-mono ${isLight ? 'bg-slate-50 border-slate-200 text-[#172033]' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
              <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>PUNN Cognitive Architecture (PCA)</span>
              <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>Underlying Cognitive Architecture (สถาปัตยกรรมการคิด)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
              <span className={`font-bold ${isLight ? 'text-[#FF8A00]' : 'text-amber-400'}`}>FIRE KEEPER</span>
              <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>Enterprise Decision Intelligence & AI Governance Platform</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className={`font-bold ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>punn-pca Repository</span>
              <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>Historical & Technical Lineage Reference</span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border text-center space-y-2 my-2 shadow-lg ${isLight ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-emerald-500/20 border-amber-500/40 text-white'}`}>
            <span className={`text-xs font-mono font-bold uppercase tracking-wider block ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
              หลักการสำคัญ (CORE AXIOM)
            </span>
            <p className={`text-base sm:text-lg font-bold leading-relaxed ${isLight ? 'text-[#172033]' : 'text-white'}`}>
              “LLM สร้างภาษา — PCA จัดโครงสร้างการให้เหตุผล”<br />
              <span className="text-xs sm:text-sm font-mono opacity-80">“LLMs generate language. PCA structures reasoning.”</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] font-mono">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/30">ข้อมูล</span>
              <span>➔</span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/30">ความเข้าใจ</span>
              <span>➔</span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/30">หลักฐาน</span>
              <span>➔</span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/30">การให้เหตุผล</span>
              <span>➔</span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 font-bold text-emerald-400">การตัดสินใจ</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 shadow-2xl ${isLight ? 'bg-white border-slate-200 text-[#172033]' : 'bg-gradient-to-br from-amber-950/60 via-slate-900 to-[#0B1220] border-amber-500/30 text-white'}`}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>ARCHITECTURAL LINEAGE & HISTORICAL FOUNDATION</span>
          </div>

          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? 'text-[#172033]' : 'text-white'}`}>
            วิวัฒนาการและประวัติศาสตร์ของ FIRE KEEPER
          </h2>
          
          <p className={`text-sm sm:text-base max-w-3xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            จากจุดกำเนิดแนวคิดและตัวตน สู่ Repository ต้นแบบ (<code>punn-pca/punn-cognitive-architecture</code>), Cognitive DNA 12 ขั้นตอน, Firekeeper Supervision จนถึงแพลตฟอร์ม Enterprise Executive Decision Intelligence & AI Governance
          </p>

          {/* Quick Filter / Milestone Chips */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            <button
              onClick={() => setSelectedMilestone('all')}
              type="button"
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                selectedMilestone === 'all'
                  ? 'bg-[#FF8A00] text-slate-950 font-bold shadow-md'
                  : isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              อ่านทั้งหมด (All Chapters)
            </button>
            {milestones.map((m, idx) => (
              <button
                key={m.id}
                onClick={() => setSelectedMilestone(m.id)}
                type="button"
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  selectedMilestone === m.id
                    ? 'bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-500/50 font-bold'
                    : isLight ? 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200' : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {idx + 1}. {m.badge}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Narrative Cards List */}
      <div className="space-y-4">
        {milestones
          .filter((m) => selectedMilestone === 'all' || selectedMilestone === m.id)
          .map((m, index) => {
            const Icon = m.icon;
            return (
              <div 
                key={m.id}
                id={`history-chapter-${m.id}`}
                className={`p-5 sm:p-6 rounded-2xl border transition-all shadow-xl space-y-4 ${isLight ? 'bg-white border-slate-200 text-[#172033]' : 'bg-slate-900/90 border-slate-800 text-white hover:border-slate-700'}`}
              >
                {/* Chapter Header */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-inner">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-amber-600 dark:text-amber-500 font-bold">
                          CHAPTER {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                          {m.badge}
                        </span>
                      </div>
                      <h3 className={`text-base sm:text-lg font-bold mt-0.5 ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                        {m.title}
                      </h3>
                    </div>
                  </div>
                  <span className={`text-xs font-mono italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {m.subtitle}
                  </span>
                </div>

                {/* Chapter Body */}
                <div className="text-sm">
                  {m.content}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

