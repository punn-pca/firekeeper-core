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
  HeartHandshake
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

  const milestones: MilestoneItem[] = [
    {
      id: 'origin',
      title: 'จุดกำเนิด — ชื่อของคนคนหนึ่ง',
      subtitle: 'The Inception · Identity & Meaning',
      badge: 'จุดเริ่มต้น',
      icon: Sparkles,
      color: 'amber',
      content: (
        <div className="space-y-3">
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            FIRE KEEPER ไม่ได้เริ่มต้นจากเว็บไซต์ ไม่ได้เริ่มต้นจากโมเดล AI และไม่ได้เริ่มต้นจากการสร้างผลิตภัณฑ์
          </p>
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            จุดเริ่มต้นอยู่ที่ <strong className={`font-semibold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>ชื่อและตัวตนของ ปุญญ์</strong>
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
      title: 'Firekeeper — ผู้รักษาไฟ',
      subtitle: 'Symbolism of Life, Agency & Meaning',
      badge: 'สัญลักษณ์และปรัชญา',
      icon: Flame,
      color: 'orange',
      content: (
        <div className="space-y-3">
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            คำว่า <strong>Firekeeper</strong> กลายเป็นสัญลักษณ์ของแนวคิดดังกล่าว
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
            <div className={`p-3.5 rounded-xl border space-y-1 ${isLight ? 'bg-slate-50 border-orange-200 text-[#172033]' : 'bg-slate-900/80 border-orange-500/30 text-slate-300'}`}>
              <span className={`text-xs font-mono font-bold block uppercase ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>“ไฟ” (The Fire)</span>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                ไม่ได้หมายถึงไฟในความหมายทางกายภาพเพียงอย่างเดียว แต่หมายถึงสิ่งที่ยังคงทำให้มนุษย์มีชีวิต มีความหมาย มีความสามารถในการเลือก และเดินหน้าต่อไป
              </p>
            </div>
            <div className={`p-3.5 rounded-xl border space-y-1 ${isLight ? 'bg-slate-50 border-amber-200 text-[#172033]' : 'bg-slate-900/80 border-amber-500/30 text-slate-300'}`}>
              <span className={`text-xs font-mono font-bold block uppercase ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>“ผู้รักษา” (The Keeper)</span>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                ไม่ได้หมายถึงผู้ที่ครอบครองไฟ แต่หมายถึงผู้ที่ <strong className={isLight ? 'text-amber-700' : 'text-amber-300'}>รักษาไฟไม่ให้ดับ</strong>
              </p>
            </div>
          </div>
          <p className={`leading-relaxed text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            แนวคิดนี้จึงมีความสัมพันธ์กับเรื่องสำคัญหลายอย่าง: <em>การมีอยู่, การเลือก, อิสรภาพ, ความหมาย, ความรู้, ความเข้าใจ และความสามารถของมนุษย์ในการกำหนดเส้นทางของตัวเอง</em>
          </p>
          <p className={`text-xs font-semibold ${isLight ? 'text-amber-700' : 'text-amber-400/90'}`}>
            ✦ Firekeeper จึงเริ่มต้นในฐานะแนวคิดเชิงปรัชญาและตัวตน ก่อนที่จะกลายเป็นเทคโนโลยี
          </p>
        </div>
      ),
    },
    {
      id: 'paradigm',
      title: 'จากแนวคิดสู่ระบบความคิด',
      subtitle: 'From Philosophy to Cognitive Augmentation',
      badge: 'การเชื่อมต่อ AI',
      icon: Compass,
      color: 'sky',
      content: (
        <div className="space-y-3">
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            เมื่อแนวคิด Firekeeper พัฒนาขึ้น คำถามไม่ได้หยุดอยู่ที่ระดับปรัชญา คำถามต่อมาคือ:
          </p>
          <div className={`p-4 rounded-xl border font-medium italic my-2 ${isLight ? 'bg-sky-50 border-sky-200 text-sky-900' : 'bg-sky-500/10 border-sky-500/30 text-sky-200'}`}>
            <Quote className="w-4 h-4 text-sky-500 mb-1 inline mr-1 opacity-70" />
            "ถ้ามนุษย์ต้องตัดสินใจในโลกที่ซับซ้อนขึ้นเรื่อย ๆ เราจะสร้างระบบที่ช่วยมนุษย์ “มองเห็น” ได้ดีขึ้นอย่างไร?"
          </div>
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            นี่เป็นจุดที่แนวคิดเริ่มเชื่อมโยงกับ <strong>ปัญญาประดิษฐ์ (AI)</strong> แต่เป้าหมายไม่ใช่การสร้าง AI ที่สั่งมนุษย์ว่าต้องทำอะไร ตรงกันข้าม แนวคิดสำคัญคือ:
          </p>
          <div className={`p-3 rounded-xl border text-xs font-semibold ${isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-900 border-slate-700 text-emerald-400'}`}>
            ✓ "AI ควรช่วยเพิ่มความสามารถในการคิดของมนุษย์ โดยไม่พรากสิทธิในการตัดสินใจไปจากมนุษย์ (Human Agency Preserved)"
          </div>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            จากตรงนี้ Firekeeper เริ่มเปลี่ยนจากแนวคิดเชิงปรัชญาไปสู่ <strong>กรอบการทำงานของระบบปัญญา (Cognitive Framework)</strong>
          </p>
        </div>
      ),
    },
    {
      id: 'pca',
      title: 'PUNN Cognitive Architecture (PCA)',
      subtitle: '12-Stage White-Box Structured Reasoning',
      badge: 'สถาปัตยกรรมปัญญา',
      icon: Brain,
      color: 'purple',
      content: (
        <div className="space-y-3">
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            การพัฒนาต่อมานำไปสู่แนวคิด <strong>PUNN Cognitive Architecture (PCA)</strong> ซึ่งเป็นความพยายามสร้างสถาปัตยกรรมที่กำหนดว่า AI ควรประมวลผลข้อมูลและช่วยมนุษย์คิดอย่างไร
          </p>
          <div className={`p-3.5 rounded-xl border space-y-2 ${isLight ? 'bg-purple-50 border-purple-200 text-purple-950' : 'bg-purple-950/40 border-purple-500/30 text-purple-200'}`}>
            <span className={`text-xs font-mono font-bold block ${isLight ? 'text-purple-800' : 'text-purple-300'}`}>
              กระบวนการคิดแบบโครงสร้างชั้นสูง (Instead of black-box Question → Answer):
            </span>
            <div className={`flex flex-wrap items-center gap-1.5 font-mono text-[11px] ${isLight ? 'text-purple-900' : 'text-purple-200'}`}>
              <span className={`px-2 py-1 rounded border ${isLight ? 'bg-white border-purple-300' : 'bg-purple-900/60 border-purple-500/30'}`}>ข้อมูล (Data)</span>
              <ArrowRight className="w-3 h-3 text-purple-500" />
              <span className={`px-2 py-1 rounded border ${isLight ? 'bg-white border-purple-300' : 'bg-purple-900/60 border-purple-500/30'}`}>การตีความ (Interpret)</span>
              <ArrowRight className="w-3 h-3 text-purple-500" />
              <span className={`px-2 py-1 rounded border ${isLight ? 'bg-white border-purple-300' : 'bg-purple-900/60 border-purple-500/30'}`}>การวิเคราะห์ (Analyze)</span>
              <ArrowRight className="w-3 h-3 text-purple-500" />
              <span className={`px-2 py-1 rounded border ${isLight ? 'bg-white border-purple-300' : 'bg-purple-900/60 border-purple-500/30'}`}>การสังเคราะห์ (Synthesize)</span>
              <ArrowRight className="w-3 h-3 text-purple-500" />
              <span className={`px-2 py-1 rounded border ${isLight ? 'bg-white border-purple-300' : 'bg-purple-900/60 border-purple-500/30'}`}>พิจารณาทางเลือก (Options)</span>
              <ArrowRight className="w-3 h-3 text-purple-500" />
              <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 font-bold">
                การตัดสินใจของมนุษย์ (Human Choice)
              </span>
            </div>
          </div>
          <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            จุดสำคัญคือ PCA ไม่ได้ถูกสร้างขึ้นเพื่อแทนที่มนุษย์ แต่เพื่อสร้างระบบที่ช่วยให้มนุษย์เข้าใจสถานการณ์ของตัวเองได้ดีขึ้น
          </p>
        </div>
      ),
    },
    {
      id: 'fut',
      title: 'Firekeeper Unified Theory (FUT)',
      subtitle: 'Information Ontology, Consciousness & Physics',
      badge: 'ทฤษฎีเอกภาพ',
      icon: Atom,
      color: 'indigo',
      content: (
        <div className="space-y-3">
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            จากการพัฒนาแนวคิด Firekeeper ในระดับที่กว้างขึ้น จึงเกิดความพยายามสร้าง <strong>Firekeeper Unified Theory (FUT)</strong> เพื่อสำรวจความสัมพันธ์ระหว่างหลากหลายศาสตร์:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {[
              'Information',
              'Entropy',
              'Consciousness',
              'Empathy',
              'Integrated Info',
              'Biology',
              'Quantum Info',
              'Ontology',
            ].map((tag) => (
              <div key={tag} className={`p-2 rounded-lg border text-center font-semibold ${isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-indigo-950/50 border-indigo-500/30 text-indigo-300'}`}>
                {tag}
              </div>
            ))}
          </div>
          <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            FUT จึงเป็นอีกชั้นหนึ่งของ Firekeeper ที่พยายามอธิบาย <em>กรอบความคิดและความสัมพันธ์ของแนวคิดต่าง ๆ ในระดับทฤษฎี</em> ในขณะที่ PCA มุ่งไปทาง <em>สถาปัตยกรรมของระบบปัญญา</em>
          </p>
        </div>
      ),
    },
    {
      id: 'tech',
      title: 'จากทฤษฎีสู่เทคโนโลยี',
      subtitle: 'LLM as a Computational Reasoning Engine',
      badge: 'การทำให้ทำงานจริง',
      icon: Cpu,
      color: 'emerald',
      content: (
        <div className="space-y-3">
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            เมื่อแนวคิดมีความชัดเจนมากขึ้น ขั้นต่อไปคือการทำให้มันสามารถทำงานจริงได้ AI จึงเข้ามาเป็นเครื่องมือสำคัญ
          </p>
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            LLM ถูกนำมาใช้เป็น <strong>computational engine</strong> เพื่อประมวลผลข้อมูลและสร้างการวิเคราะห์ แต่ AI ไม่ใช่ต้นกำเนิดของ Firekeeper มันเป็น <em>เทคโนโลยีที่ถูกนำมาใช้เพื่อทำให้แนวคิด Firekeeper สามารถทำงานได้จริง</em>
          </p>
          <div className={`p-3.5 rounded-xl border space-y-2 text-xs font-mono ${isLight ? 'bg-slate-50 border-slate-200 text-[#172033]' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
            <div className={`flex items-center justify-between py-1 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>Firekeeper</span>
              <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>กำหนดแนวคิดและเป้าหมาย (Purpose & Ethics)</span>
            </div>
            <div className={`flex items-center justify-between py-1 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <span className={`font-bold ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>PCA</span>
              <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>กำหนดสถาปัตยกรรมการคิด (Cognitive Structure)</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className={`font-bold ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>AI / LLM</span>
              <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>ทำหน้าที่ประมวลผล (Computational Processing)</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'system',
      title: 'FIRE KEEPER กลายเป็นระบบจริง',
      subtitle: 'High-Volume Data & Deep PDF Analysis Engine',
      badge: 'การใช้งานจริง',
      icon: FileText,
      color: 'amber',
      content: (
        <div className="space-y-3">
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            จากนั้นแนวคิดถูกพัฒนาเป็นระบบที่สามารถรับข้อมูลและคำถามจากผู้ใช้ แล้วนำเข้าสู่กระบวนการวิเคราะห์ โดยเฉพาะการวิเคราะห์ข้อมูลและเอกสารเชิงยุทธศาสตร์ เช่น PDF
          </p>
          <p className={`leading-relaxed text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            ระบบสามารถนำข้อมูลจำนวนมากเข้าสู่กระบวนการวิเคราะห์ และสร้างผลลัพธ์ในรูปแบบที่เหมาะกับการทำความเข้าใจสถานการณ์และการตัดสินใจ นี่คือจุดที่ Firekeeper เปลี่ยนจาก <strong>แนวคิด</strong> ไปสู่ <strong>ระบบที่สามารถใช้งานได้จริง</strong>
          </p>
        </div>
      ),
    },
    {
      id: 'site',
      title: 'FIREKEEPER.SITE',
      subtitle: 'Production Cloud Platform & User Ecosystem',
      badge: 'สู่สายตาโลก',
      icon: Globe,
      color: 'blue',
      content: (
        <div className="space-y-3">
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            ในที่สุด Firekeeper ถูกนำออกจากระดับ prototype และพัฒนาเป็นเว็บไซต์ <strong>firekeeper.site</strong> ซึ่งกลายเป็นช่องทางที่ผู้ใช้สามารถเข้าถึงระบบ Firekeeper ได้โดยตรง
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {['Authentication', 'AI Analysis', 'PDF Analysis', 'User Management', 'Security', 'Analytics', 'Enterprise Web Architecture', 'Zero-PII Telemetry'].map((item) => (
              <div key={item} className={`p-2 rounded-lg border text-center font-medium ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                ✓ {item}
              </div>
            ))}
          </div>
          <p className={`text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            ทำให้ Firekeeper ไม่ได้เป็นเพียงแนวคิดบนกระดาษอีกต่อไป แต่กลายเป็น <em>ระบบที่สามารถให้มนุษย์เข้ามาใช้งานจริงได้</em>
          </p>
        </div>
      ),
    },
    {
      id: 'core',
      title: 'สิ่งที่ FIRE KEEPER พยายามรักษา',
      subtitle: 'The Immutable Core Principle',
      badge: 'แก่นแท้แห่งไฟ',
      icon: ShieldCheck,
      color: 'emerald',
      content: (
        <div className="space-y-3">
          <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            เมื่อมองย้อนกลับไปตั้งแต่ต้นทาง จะเห็นว่าแก่นของ Firekeeper ไม่ได้เปลี่ยนไปมากนัก:
          </p>
          <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            จากจุดเริ่มต้นที่เกิดจาก <strong>ชื่อและตัวตน</strong> → มาสู่คำถามเรื่อง <strong>ความหมายและการดำรงอยู่</strong> → ต่อยอดเป็นแนวคิดเรื่อง <strong>การรักษาไฟ</strong> → พัฒนาเป็น <strong>กรอบความคิด</strong> → กลายเป็น <strong>PUNN Cognitive Architecture</strong> → ขยายไปสู่ <span>Firekeeper Unified Theory</span> → และในที่สุดถูกสร้างขึ้นเป็น <strong>AI system และ firekeeper.site</strong>
          </p>
          <div className={`p-5 rounded-2xl border text-center space-y-2 my-2 shadow-lg ${isLight ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-emerald-500/20 border-amber-500/40 text-white'}`}>
            <span className={`text-xs font-mono font-bold uppercase tracking-wider block ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
              แกนกลางอันเป็นนิรันดร์ (The Eternal Core)
            </span>
            <p className={`text-base sm:text-lg font-bold leading-relaxed ${isLight ? 'text-[#172033]' : 'text-white'}`}>
              “เทคโนโลยีควรช่วยให้มนุษย์มองเห็น เข้าใจ และตัดสินใจได้ดีขึ้น โดยไม่ยึดเอาความสามารถในการเลือกของมนุษย์ไป”
            </p>
          </div>
          <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            ดังนั้น ประวัติศาสตร์ของ FIRE KEEPER จึงไม่ใช่เพียงประวัติศาสตร์ของเว็บไซต์หนึ่งเว็บไซต์ แต่คือประวัติศาสตร์ของ <strong>แนวคิดที่เริ่มจากตัวตนของคนคนหนึ่ง แล้วค่อย ๆ ถูกแปลงจากความคิด → เป็นกรอบทฤษฎี → เป็นสถาปัตยกรรม → และสุดท้ายเป็นระบบที่ทำงานอยู่ในโลกจริง</strong>.
          </p>
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
            <span>ORIGIN & PHILOSOPHICAL FOUNDATION</span>
          </div>

          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? 'text-[#172033]' : 'text-white'}`}>
            ประวัติศาสตร์ของ FIRE KEEPER
          </h2>
          
          <p className={`text-sm sm:text-base max-w-3xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            เรื่องราวการเดินทางจากคำถามเกี่ยวกับตัวตนและความหมายของชีวิต สู่สถาปัตยกรรมปัญญาประดิษฐ์เพื่อการตัดสินใจที่คุ้มครองอิสรภาพและการเลือกของมนุษย์
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
