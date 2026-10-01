import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import './LandingPage.css';
import { DecisionObservatory } from './DecisionObservatory';
import {
  Activity, ArrowRight, CheckCircle2, FileText, Flame, Github, Layers3,
  Lightbulb, MessageSquareText, Scale, ShieldCheck, Target, UserRound, BookOpen,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LandingPageProps {
  onEnter: () => void;
  onNavigateDocs?: () => void;
  onNavigateDevelopers?: () => void;
  onNavigatePublication?: () => void;
  onNavigateBooks?: () => void;
  onNavigatePlans?: () => void;
  isLight?: boolean;
}

const capabilities = [
  { icon: MessageSquareText, title: 'AI analysis with decision controls', text: 'วิเคราะห์คำถามและบริบท พร้อมชั้นควบคุมคุณภาพ ไม่ใช่ระบบตัดสินใจแทนผู้ใช้' },
  { icon: Layers3, title: 'แยก Fact, Interpretation และ Recommendation', text: 'จำแนกข้อเท็จจริง ข้ออ้าง การตีความ สมมติฐาน ความเสี่ยง และคำแนะนำ เพื่อให้ตรวจทานได้ง่ายขึ้น' },
  { icon: Lightbulb, title: 'เปิดเผยข้อขัดแย้งและช่องว่าง', text: 'แสดงหลักฐานที่สนับสนุนหรือคัดค้าน ช่องว่างข้อมูล และเงื่อนไขที่อาจทำให้คำแนะนำเปลี่ยน' },
  { icon: Target, title: 'Conditional recommendation', text: 'เมื่อหลักฐานยังไม่พอ คำแนะนำจะอยู่ในรูปแบบมีเงื่อนไข พร้อมระบุสิ่งที่ต้องยืนยันก่อนดำเนินการ' },
  { icon: ShieldCheck, title: 'Human approval boundary', text: 'งานที่มีผลกระทบสูงถูกระบุให้ทบทวนโดยผู้เชี่ยวชาญและผู้มีอำนาจอนุมัติ' },
  { icon: Activity, title: 'Decision record & audit trace', text: 'บันทึกเส้นทางการวิเคราะห์และ metadata สำหรับตรวจสอบย้อนหลัง; รองรับ Azure Monitor/Sentinel เมื่อองค์กรตั้งค่า' },
];

const principles = [
  'คำแนะนำต้องเชื่อมกับหลักฐาน หรือถูกลดระดับเป็นคำแนะนำแบบมีเงื่อนไข',
  'มนุษย์เป็นผู้อนุมัติการตัดสินใจที่มีผลกระทบ',
  'แสดงความขัดแย้งและข้อมูลที่ยังไม่รู้',
  'บันทึก Decision Record และ audit trace เพื่อการตรวจทาน',
];

const kpis = [
  ['Decision cycle', 'เวลาตั้งแต่เริ่มวิเคราะห์จนถึงการอนุมัติ'],
  ['Evidence readiness', 'สัดส่วนคำแนะนำที่มีหลักฐานและข้อมูลประกอบเพียงพอ'],
  ['Risk discovery', 'ข้อขัดแย้งหรือช่องว่างที่พบก่อนการอนุมัติ'],
  ['Audit readiness', 'เวลาที่ใช้ในการรวบรวม Decision Record และ audit evidence'],
];

const pricingPlans = [
  { name: 'Free', price: 'ฟรี', audience: 'Explore AI และเริ่มสร้าง Governance ส่วนตัว', features: ['20 analyses/วัน', 'Fact / Hypothesis / Risk', 'Audit Log 7 วัน'], featured: false },
  { name: 'Starter', price: '490 บาท/เดือน', audience: 'Personal Governance พร้อมใช้โมเดลของคุณเอง', features: ['Governance Pipeline + Trace', 'ไม่บวกค่า Token ของโมเดล', 'Export พื้นฐาน'], featured: false },
  { name: 'Professional', price: '990 บาท/เดือน', audience: 'Decision Intelligence สำหรับนักวิเคราะห์', features: ['วิเคราะห์ไม่จำกัดตาม Fair Use', 'ประวัติการตัดสินใจระยะยาว', 'Decision Report + Export'], featured: true },
  { name: 'Team', price: '4,900 บาท/เดือน', audience: 'ทีมสูงสุด 5 คน', features: ['Shared Workspace และ Role', 'Human Approval Workflow', 'Audit Log 90 วัน'], featured: false },
  { name: 'Business', price: '19,000 บาท/เดือน', audience: 'องค์กรสูงสุด 20 คน', features: ['Policy และ RBAC', 'Evidence Lineage + Approval Gate', 'Audit Log 365 วัน'], featured: false },
  { name: 'Enterprise', price: 'Contact Sales', audience: 'องค์กรที่ต้องการการกำกับดูแลเฉพาะ', features: ['SSO / SAML / OIDC', 'Dedicated Audit Store และ API', 'Custom Governance Rules + SLA'], featured: false },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onNavigateDocs, onNavigatePublication, onNavigateBooks, onNavigatePlans, isLight: propIsLight }) => {
  const { theme } = useTheme();
  const isLight = propIsLight !== undefined ? propIsLight : theme === 'light';
  const reducedMotion = useReducedMotion();
  const bg = isLight ? 'bg-[#f4f7f8] text-slate-950' : 'bg-[#070d18] text-[#f4f1e8]';
  const surface = isLight ? 'bg-white border-slate-200' : 'bg-[#0c1524] border-white/10';
  const muted = isLight ? 'text-slate-600' : 'text-white/60';

  return (
    <main className={`fk-observatory min-h-screen ${bg}`} data-theme={isLight ? "light" : "dark"}>
      <header className={`border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <button type="button" onClick={onEnter} className="flex items-center gap-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-black"><Flame className="h-5 w-5 fill-current" /></span>
            <span><span className="block text-sm font-bold tracking-[.22em]">FIREKEEPER</span><span className={`block text-[10px] ${muted}`}>Decision Quality Platform for the AI Era</span></span>
          </button>
          <nav className="hidden items-center gap-7 text-sm md:flex">
            <a href="#capabilities" className={muted}>ความสามารถ</a><a href="#measurement" className={muted}>การวัดผล</a><a href="#pricing" className={muted}>แพ็กเกจ</a>
            <button type="button" onClick={onNavigateDocs} className={muted}>เอกสาร</button><a href="/about" className={muted}>เกี่ยวกับผู้สร้าง</a>
          </nav>
          <button type="button" onClick={onEnter} className="shrink-0 whitespace-nowrap rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-black">เริ่มใช้งาน</button>
        </div>
      </header>

      <section className="fk-hero relative mx-auto flex max-w-7xl flex-col items-center justify-center px-5 py-20 text-center lg:px-8 lg:py-32">
        <motion.div initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }} className="relative z-10 flex w-full max-w-5xl flex-col items-center">
          <div className="fk-eyebrow mb-7 flex items-center justify-center gap-3 text-xs font-semibold tracking-[.2em]"><span className="fk-status-dot" /> THE DECISION OBSERVATORY / PCA v3.0</div>
          <h1 className="fk-hero-title font-semibold">มองให้ลึก <span className="fk-hero-accent">ก่อนตัดสินใจ</span></h1>
          <p className={`mt-7 max-w-3xl text-lg leading-8 ${muted}`}>เชื่อมหลักฐาน สำรวจสมมติฐาน และมองความเสี่ยงให้รอบด้าน ด้วย AI ที่ช่วยคุณคิด</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3"><button type="button" onClick={onEnter} className="fk-primary inline-flex min-h-12 items-center justify-center gap-3 rounded-xl px-6 py-3.5 font-bold">เริ่มวิเคราะห์ <ArrowRight className="h-4 w-4" /></button><a href="#workflow" className="fk-secondary inline-flex min-h-12 items-center justify-center rounded-xl border px-5 py-3.5 font-medium">สำรวจกระบวนการ ↘</a></div>
          <div className={`mt-9 flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm ${muted}`}><span className="flex items-center gap-2"><Scale className="h-4 w-4 text-cyan-500" />Evidence & uncertainty</span><span className="flex items-center gap-2"><UserRound className="h-4 w-4 text-amber-500" />Human judgment</span></div>
        </motion.div>
        <div className={`relative z-10 mt-14 flex w-full max-w-5xl items-center justify-center border-t pt-6 text-xs ${isLight ? 'border-slate-300 text-slate-600' : 'border-white/10 text-slate-400'}`}><span>จากข้อมูล → สู่การตัดสินใจที่ตรวจทานได้</span></div>
      </section>

      <section id="workflow" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="fk-eyebrow text-xs font-bold tracking-[.2em]">01 / FROM SIGNAL TO JUDGMENT</div>
        <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-snug sm:text-5xl">คำตอบที่ดูดี<br /><span className={muted}>ยังต้องมีเหตุผลรองรับ</span></h2>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[
          ['01', 'หลักฐาน', 'ข้อสรุปนี้มีข้อมูลอะไรสนับสนุน และแหล่งที่มาเชื่อถือได้แค่ไหน?', FileText],
          ['02', 'สมมติฐาน', 'มีคำอธิบายหรือทางเลือกอื่นใดที่ควรพิจารณาควบคู่กัน?', Lightbulb],
          ['03', 'ความเสี่ยง', 'หากข้อสันนิษฐานผิด อะไรจะเกิดขึ้น และยังขาดข้อมูลอะไร?', ShieldCheck],
          ['04', 'มนุษย์ทบทวน', 'ตรวจเหตุผลและเงื่อนไข ก่อนเลือกสิ่งที่จะนำไปใช้จริง', UserRound],
        ].map(([number, title, text, Icon]) => { const StepIcon = Icon as typeof FileText; return <motion.article key={String(number)} initial={reducedMotion ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ duration: .45 }} className={`fk-step rounded-2xl border p-6 ${surface}`}><div className="flex items-center justify-between"><span className="fk-eyebrow font-mono text-sm">{String(number)}</span><StepIcon className={`h-5 w-5 ${number === '04' ? 'text-amber-500' : 'text-cyan-500'}`} /></div><h3 className="mt-10 text-xl font-semibold">{String(title)}</h3><p className={`mt-3 text-sm leading-7 ${muted}`}>{String(text)}</p></motion.article>})}</div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className={`fk-example grid gap-8 rounded-3xl border p-6 sm:p-10 lg:grid-cols-[.85fr_1.15fr] ${surface}`}>
          <div><div className="fk-eyebrow text-xs tracking-[.2em]">02 / THE REASONING LENS</div><h2 className="mt-5 text-3xl font-semibold leading-snug">เห็นสิ่งที่รู้<br />และสิ่งที่ยังต้องรู้</h2><p className={`mt-5 leading-7 ${muted}`}>แยกข้อมูลออกจากข้อสันนิษฐาน เพื่อให้คุณเห็นว่าตรงไหนมีหลักฐาน และตรงไหนควรตรวจสอบเพิ่ม</p></div>
          <div className="min-w-0"><div className={`mb-4 flex flex-wrap items-center justify-between gap-3 text-xs ${muted}`}><span className="font-mono tracking-wider">ANALYSIS / 001</span><span className="rounded-full border px-3 py-1.5">ตัวอย่างประกอบ · ไม่ใช่ผลวิเคราะห์จริง</span></div>{[
            ['ข้อเท็จจริง', 'ใบเสนอราคาของผู้ขาย A ต่ำกว่าผู้ขาย B', 'cyan'],
            ['ข้อสันนิษฐาน', 'ราคาที่ต่ำกว่าอาจช่วยลดต้นทุนรวม', 'violet'],
            ['สิ่งที่ต้องตรวจสอบ', 'ค่าบำรุงรักษา เงื่อนไขบริการ และต้นทุนตลอดอายุการใช้งาน', 'amber'],
          ].map(([title, text, color]) => <div key={title} className={`fk-evidence fk-evidence-${color} mb-3 rounded-xl border p-5`}><div className="text-xs font-semibold">{title}</div><p className="mt-2 text-sm leading-7">{text}</p></div>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-18"><div className={`grid gap-7 rounded-[2rem] border p-7 sm:p-10 lg:grid-cols-[.78fr_1.22fr] lg:p-12 ${surface}`}><div><div className="text-xs font-bold tracking-[.25em] text-orange-500">THE DECISION GAP</div><h2 className="mt-3 text-3xl font-bold">คำตอบเร็ว ไม่ได้แปลว่าตัดสินใจได้ดี</h2></div><div><div className="grid gap-3 sm:grid-cols-3">{[['หลักฐาน','อะไรยืนยันข้อสรุปนี้?'],['ความขัดแย้ง','มีข้อมูลใดค้านกัน?'],['ผู้อนุมัติ','ใครเป็นคนตัดสินใจจริง?']].map(([title,text]) => <div key={title} className={`rounded-xl border p-4 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/20'}`}><div className="text-sm font-bold text-orange-500">{title}</div><p className={`mt-1 text-sm leading-6 ${muted}`}>{text}</p></div>)}</div><p className={`mt-4 text-sm leading-6 ${muted}`}>FIREKEEPER ช่วยจัดโครงสร้างเพื่อการตรวจทานและการตัดสินใจโดยมนุษย์ ไม่ใช่การรับประกันผลลัพธ์</p></div></div></section>

      <section id="capabilities" className={`border-y py-20 ${isLight ? 'border-slate-200 bg-white/40' : 'border-white/10 bg-white/[.015]'}`}><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="text-center"><div className="text-xs font-bold tracking-[.28em] text-orange-500">CORE CAPABILITIES</div><h2 className="mt-3 text-3xl font-bold sm:text-4xl">สิ่งที่ FIREKEEPER ทำได้จริง</h2><p className={`mx-auto mt-4 max-w-2xl ${muted}`}>ความสามารถที่มีในระบบปัจจุบัน ไม่ใช่ผลลัพธ์ที่รับประกัน</p></div><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{capabilities.map(({ icon: Icon, title, text }) => <article key={title} className={`fk-feature rounded-2xl border p-6 ${surface}`}><span className="flex h-12 w-12 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/[.07] text-orange-500"><Icon className="h-6 w-6" /></span><h3 className="mt-5 text-lg font-bold">{title}</h3><p className={`mt-2 text-sm leading-6 ${muted}`}>{text}</p></article>)}</div></div></section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20"><div className={`grid gap-8 rounded-[2rem] border p-7 sm:p-10 lg:grid-cols-[.8fr_1.2fr] lg:p-12 ${surface}`}><div><div className="text-xs font-bold tracking-[.25em] text-orange-500">DECISION RECORD / LIVE PREVIEW</div><h2 className="mt-3 text-3xl font-bold">เห็นเหตุผลก่อนเลือกทาง</h2><p className={`mt-4 max-w-xl text-sm leading-6 ${muted}`}>ตัวอย่างโครงสร้างที่ผู้ใช้จะเห็นในงานจริง: แยกสิ่งที่ยืนยันแล้ว สิ่งที่อนุมาน ความไม่แน่นอน และจุดที่มนุษย์ต้องอนุมัติ</p><button type="button" onClick={onEnter} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-bold text-black">ลองวิเคราะห์เคสนี้ <ArrowRight className="h-4 w-4" /></button></div><div className={`overflow-hidden rounded-2xl border ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-[#08111f]'}`}><div className={`flex items-center justify-between border-b px-5 py-4 text-xs font-mono ${isLight ? 'border-slate-200' : 'border-white/10'}`}><span>DECISION / SUPPLIER REVIEW</span><span className="text-amber-500">HUMAN REVIEW</span></div><div className="space-y-3 p-5">{[['FACT','ใบเสนอราคา A ต่ำกว่า B','text-emerald-400 border-emerald-500/30 bg-emerald-500/10'],['EVIDENCE','ราคาเป็นเพียงหนึ่งองค์ประกอบของต้นทุนรวม','text-sky-400 border-sky-500/30 bg-sky-500/10'],['INFERENCE','A อาจคุ้มค่ากว่า หากต้นทุนดูแลไม่สูงกว่า','text-violet-400 border-violet-500/30 bg-violet-500/10'],['UNCERTAINTY','ยังไม่มีข้อมูลค่าบำรุงรักษาตลอดอายุใช้งาน','text-amber-400 border-amber-500/30 bg-amber-500/10']].map(([tag,text,style]) => <div key={tag} className="flex flex-col gap-2 sm:flex-row sm:items-start"><span className={`w-fit shrink-0 rounded-md border px-2 py-1 font-mono text-[11px] font-bold ${style}`}>[{tag}]</span><span className="text-sm leading-6">{text}</span></div>)}<div className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${isLight ? 'border-orange-200 bg-orange-50' : 'border-orange-500/20 bg-orange-500/[.06]'}`}><UserRound className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" /><div><div className="text-sm font-bold">Approval Gate</div><p className={`mt-1 text-xs leading-5 ${muted}`}>ตรวจต้นทุนรวมและเงื่อนไขบริการก่อนอนุมัติการเลือกผู้ขาย</p></div></div></div></div></div></section>

      <section id="measurement" className={`border-y py-20 ${isLight ? 'border-slate-200 bg-white/40' : 'border-white/10 bg-white/[.015]'}`}><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="max-w-3xl"><div className="text-xs font-bold tracking-[.28em] text-orange-500">MEASURING BUSINESS VALUE</div><h2 className="mt-3 text-3xl font-bold sm:text-4xl">วัดผลที่กระบวนการตัดสินใจ ไม่ใช่จำนวนคำตอบ</h2><p className={`mt-4 leading-7 ${muted}`}>องค์กรสามารถกำหนด baseline และติดตาม KPI ของ workflow ที่เลือกใช้ได้ ผลลัพธ์ขึ้นอยู่กับข้อมูล กระบวนการ และการนำไปใช้ของแต่ละองค์กร</p></div><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{kpis.map(([title, text]) => <article key={title} className={`fk-feature rounded-2xl border p-6 ${surface}`}><h3 className="font-bold text-orange-500">{title}</h3><p className={`mt-3 text-sm leading-6 ${muted}`}>{text}</p></article>)}</div><p className={`mt-6 text-xs leading-5 ${muted}`}>ตัวอย่าง ROI หรือเปอร์เซ็นต์การปรับปรุงต้องคำนวณจากข้อมูลจริงขององค์กร ไม่ใช่ผลลัพธ์ที่ FIREKEEPER รับประกัน</p></div></section>

      <section id="pricing" className={`border-y py-20 ${isLight ? 'border-slate-200 bg-white/40' : 'border-white/10 bg-white/[.015]'}`}><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="text-center"><div className="text-xs font-bold tracking-[.28em] text-orange-500">FIREKEEPER PLANS</div><h2 className="mt-3 text-3xl font-bold sm:text-4xl">เลือกแพ็กเกจตามระดับการใช้งาน</h2><p className={`mx-auto mt-4 max-w-2xl ${muted}`}>เปรียบเทียบขอบเขตการใช้งานและ retention ของแต่ละแผนก่อนเลือกใช้</p></div><div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{pricingPlans.map((plan) => <article key={plan.name} className={`relative flex flex-col rounded-2xl border p-6 ${plan.featured ? 'border-orange-500 bg-orange-500/[.08]' : surface}`}>{plan.featured && <span className="absolute right-5 top-5 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold text-black">แนะนำ</span>}<h3 className="text-xl font-bold">{plan.name}</h3><div className="mt-4 text-2xl font-extrabold text-orange-500">{plan.price}</div><p className={`mt-2 min-h-12 text-sm ${muted}`}>{plan.audience}</p><ul className="mt-5 space-y-3 text-sm">{plan.features.map((feature) => <li key={feature} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-orange-500" />{feature}</li>)}</ul><button type="button" onClick={onNavigatePlans || onEnter} className="mt-7 rounded-xl border border-orange-500/50 px-4 py-3 text-sm font-bold text-orange-500 hover:bg-orange-500 hover:text-black">{plan.name === 'Free' ? 'เริ่มใช้งาน' : plan.name === 'Enterprise' ? 'ติดต่อทีม' : 'ดูรายละเอียดแพ็กเกจ'}</button></article>)}</div></div></section>

      <section className="fk-final mx-auto max-w-7xl px-5 py-20 text-center lg:px-8 lg:py-28"><div className="text-xs font-semibold tracking-[.25em] text-amber-500">THE FINAL WORD IS YOURS</div><h2 className="mt-6 text-3xl font-semibold leading-snug sm:text-5xl">AI ช่วยวิเคราะห์<br />คุณเป็นผู้ตัดสินใจ</h2><p className={`mx-auto mt-5 max-w-xl leading-7 ${muted}`}>เริ่มจากคำถามที่สำคัญกับคุณ แล้วสำรวจเหตุผล หลักฐาน และทางเลือกไปด้วยกัน</p><button type="button" onClick={onEnter} className="fk-primary mt-8 inline-flex min-h-12 items-center gap-3 rounded-xl px-7 py-4 font-bold">เปิด FIREKEEPER <ArrowRight className="h-4 w-4" /></button></section>
      <footer className={`border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}><div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between lg:px-8"><div className="flex items-center gap-3"><Flame className="h-6 w-6 fill-orange-500 text-orange-500" /><div><div className="text-sm font-bold tracking-[.2em]">FIREKEEPER</div><div className={`text-xs ${muted}`}>Decision Quality Platform for the AI Era</div></div></div><div className={`flex flex-wrap gap-5 text-sm ${muted}`}><a href="/about">เกี่ยวกับผู้สร้าง</a><button type="button" onClick={onNavigateDocs}>เอกสาร</button><a href="https://github.com/punn-pca/firekeeper-core" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5"><Github className="h-4 w-4" />GitHub</a><button type="button" onClick={onNavigatePublication || onNavigateBooks} className="inline-flex items-center gap-1.5"><BookOpen className="h-4 w-4" />Publications</button></div></div></footer>
    </main>
  );
};