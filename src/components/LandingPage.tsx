import React from 'react';
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
  const bg = isLight ? 'bg-[#f7f6f2] text-slate-950' : 'bg-[#090a0c] text-white';
  const surface = isLight ? 'bg-white border-slate-200' : 'bg-[#111214] border-white/10';
  const muted = isLight ? 'text-slate-600' : 'text-white/60';

  return (
    <main className={`min-h-screen ${bg}`}>
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
          <button type="button" onClick={onEnter} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-black">เริ่มใช้งาน</button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-24">
        <div>
          <div className="mb-5 text-xs font-bold tracking-[.24em] text-orange-500">FIREKEEPER · PCA v3.0</div>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.15] tracking-[-.035em] sm:text-6xl sm:leading-[1.04] sm:tracking-[-.045em] lg:text-7xl">เพิ่มคุณภาพการตัดสินใจ<br /><span className="text-orange-500">เมื่อใช้ AI ในงานสำคัญ</span></h1>
          <p className={`mt-7 max-w-2xl text-lg leading-8 sm:text-xl ${muted}`}>FIREKEEPER คือ Decision Quality Platform ที่ช่วยให้องค์กรตรวจทานหลักฐาน ข้อสรุป ความไม่แน่นอน และเงื่อนไขของคำแนะนำ ก่อนที่มนุษย์จะตัดสินใจในเรื่องสำคัญ</p>
          <div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={onEnter} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 font-bold text-black">เริ่มวิเคราะห์ฟรี <ArrowRight className="h-4 w-4" /></button><a href="#capabilities" className={`inline-flex items-center rounded-xl border px-6 py-3.5 font-semibold ${isLight ? 'border-slate-300' : 'border-white/20'}`}>ดูวิธีทำงาน</a></div>
          <div className={`mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm ${muted}`}><span className="flex items-center gap-2"><UserRound className="h-4 w-4" />Human approval</span><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Governance controls</span><span className="flex items-center gap-2"><Scale className="h-4 w-4" />Evidence & uncertainty</span></div>
        </div>
        <div className={`rounded-[2rem] border p-8 sm:p-12 ${surface}`}><div className="mx-auto flex aspect-square max-w-[430px] flex-col items-center justify-center rounded-[2rem] border border-orange-500/20 bg-orange-500/[.035] text-center"><div className={`flex h-28 w-28 items-center justify-center rounded-full border border-orange-500/40 ${isLight ? 'bg-white' : 'bg-[#090a0c]'}`}><Flame className="h-16 w-16 fill-orange-500 text-orange-500" /></div><div className="mt-8 text-sm font-bold tracking-[.34em] text-orange-500">FIREKEEPER</div><div className={`mt-3 max-w-xs text-lg leading-7 ${muted}`}>AI assists. Humans decide.</div></div></div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20"><div className={`grid gap-8 rounded-[2rem] border p-7 sm:p-10 lg:grid-cols-[.78fr_1.22fr] lg:p-12 ${surface}`}><div><div className="text-xs font-bold tracking-[.25em] text-orange-500">THE DECISION GAP</div><h2 className="mt-3 text-3xl font-bold">คำตอบเร็ว ไม่ได้แปลว่าตัดสินใจได้ดี</h2></div><div className={`space-y-4 text-base leading-7 ${muted}`}><p>เมื่อ AI ถูกใช้ในงานกลยุทธ์ ความเสี่ยง การจัดซื้อ Compliance หรือความปลอดภัย คำถามสำคัญคือหลักฐานใดรองรับข้อสรุป มีข้อมูลใดขัดแย้ง และใครควรรับผิดชอบการอนุมัติ</p><p>FIREKEEPER ช่วยจัดโครงสร้างคำตอบให้ตรวจทานได้ ไม่ได้อ้างว่าแทนที่ผู้เชี่ยวชาญ หรือรับประกันผลลัพธ์ทางธุรกิจ</p></div></div></section>

      <section id="capabilities" className={`border-y py-20 ${isLight ? 'border-slate-200 bg-white/40' : 'border-white/10 bg-white/[.015]'}`}><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="text-center"><div className="text-xs font-bold tracking-[.28em] text-orange-500">CORE CAPABILITIES</div><h2 className="mt-3 text-3xl font-bold sm:text-4xl">สิ่งที่ FIREKEEPER ทำได้จริง</h2><p className={`mx-auto mt-4 max-w-2xl ${muted}`}>ความสามารถที่มีในระบบปัจจุบัน ไม่ใช่ผลลัพธ์ที่รับประกัน</p></div><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{capabilities.map(({ icon: Icon, title, text }) => <article key={title} className={`rounded-2xl border p-6 ${surface}`}><span className="flex h-12 w-12 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/[.07] text-orange-500"><Icon className="h-6 w-6" /></span><h3 className="mt-5 text-lg font-bold">{title}</h3><p className={`mt-2 text-sm leading-6 ${muted}`}>{text}</p></article>)}</div></div></section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className={`grid gap-8 rounded-[2rem] border p-7 sm:p-10 lg:grid-cols-[1fr_.85fr] lg:p-12 ${surface}`}><div><div className="text-xs font-bold tracking-[.25em] text-orange-500">DECISION RECORD</div><h2 className="mt-3 text-3xl font-bold">ให้คำแนะนำมีที่มาและขอบเขต</h2><p className={`mt-4 max-w-2xl leading-7 ${muted}`}>สำหรับคำถามที่ต้องตัดสินใจ ระบบสร้างโครงสร้างให้เห็นคำแนะนำ หลักฐานสนับสนุนและคัดค้าน ช่องว่างข้อมูล เงื่อนไขที่ทำให้คำแนะนำเปลี่ยน สิ่งที่ทำได้ทันที และสิ่งที่ต้องได้รับอนุมัติ</p><button type="button" onClick={onEnter} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-bold text-black">เปิด FIREKEEPER <ArrowRight className="h-4 w-4" /></button></div><div className="grid gap-3">{principles.map((item) => <div key={item} className={`flex items-start gap-3 rounded-xl border p-4 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/20'}`}><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" /><span className="text-sm font-medium">{item}</span></div>)}</div></div></section>

      <section id="measurement" className={`border-y py-20 ${isLight ? 'border-slate-200 bg-white/40' : 'border-white/10 bg-white/[.015]'}`}><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="max-w-3xl"><div className="text-xs font-bold tracking-[.28em] text-orange-500">MEASURING BUSINESS VALUE</div><h2 className="mt-3 text-3xl font-bold sm:text-4xl">วัดผลที่กระบวนการตัดสินใจ ไม่ใช่จำนวนคำตอบ</h2><p className={`mt-4 leading-7 ${muted}`}>องค์กรสามารถกำหนด baseline และติดตาม KPI ของ workflow ที่เลือกใช้ได้ ผลลัพธ์ขึ้นอยู่กับข้อมูล กระบวนการ และการนำไปใช้ของแต่ละองค์กร</p></div><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{kpis.map(([title, text]) => <article key={title} className={`rounded-2xl border p-6 ${surface}`}><h3 className="font-bold text-orange-500">{title}</h3><p className={`mt-3 text-sm leading-6 ${muted}`}>{text}</p></article>)}</div><p className={`mt-6 text-xs leading-5 ${muted}`}>ตัวอย่าง ROI หรือเปอร์เซ็นต์การปรับปรุงต้องคำนวณจากข้อมูลจริงขององค์กร ไม่ใช่ผลลัพธ์ที่ FIREKEEPER รับประกัน</p></div></section>

      <section id="pricing" className={`border-y py-20 ${isLight ? 'border-slate-200 bg-white/40' : 'border-white/10 bg-white/[.015]'}`}><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="text-center"><div className="text-xs font-bold tracking-[.28em] text-orange-500">FIREKEEPER PLANS</div><h2 className="mt-3 text-3xl font-bold sm:text-4xl">เลือกแพ็กเกจตามระดับการใช้งาน</h2><p className={`mx-auto mt-4 max-w-2xl ${muted}`}>เปรียบเทียบขอบเขตการใช้งานและ retention ของแต่ละแผนก่อนเลือกใช้</p></div><div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{pricingPlans.map((plan) => <article key={plan.name} className={`relative flex flex-col rounded-2xl border p-6 ${plan.featured ? 'border-orange-500 bg-orange-500/[.08]' : surface}`}>{plan.featured && <span className="absolute right-5 top-5 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold text-black">แนะนำ</span>}<h3 className="text-xl font-bold">{plan.name}</h3><div className="mt-4 text-2xl font-extrabold text-orange-500">{plan.price}</div><p className={`mt-2 min-h-12 text-sm ${muted}`}>{plan.audience}</p><ul className="mt-5 space-y-3 text-sm">{plan.features.map((feature) => <li key={feature} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-orange-500" />{feature}</li>)}</ul><button type="button" onClick={onNavigatePlans || onEnter} className="mt-7 rounded-xl border border-orange-500/50 px-4 py-3 text-sm font-bold text-orange-500 hover:bg-orange-500 hover:text-black">{plan.name === 'Free' ? 'เริ่มใช้งาน' : plan.name === 'Enterprise' ? 'ติดต่อทีม' : 'ดูรายละเอียดแพ็กเกจ'}</button></article>)}</div></div></section>

      <footer className={`border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}><div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between lg:px-8"><div className="flex items-center gap-3"><Flame className="h-6 w-6 fill-orange-500 text-orange-500" /><div><div className="text-sm font-bold tracking-[.2em]">FIREKEEPER</div><div className={`text-xs ${muted}`}>Decision Quality Platform for the AI Era</div></div></div><div className={`flex flex-wrap gap-5 text-sm ${muted}`}><a href="/about">เกี่ยวกับผู้สร้าง</a><button type="button" onClick={onNavigateDocs}>เอกสาร</button><a href="https://github.com/punn-pca/firekeeper-core" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5"><Github className="h-4 w-4" />GitHub</a><button type="button" onClick={onNavigatePublication || onNavigateBooks} className="inline-flex items-center gap-1.5"><BookOpen className="h-4 w-4" />Publications</button></div></div></footer>
    </main>
  );
};