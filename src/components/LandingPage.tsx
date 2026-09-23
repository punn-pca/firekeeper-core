import React from 'react';
import {
  ArrowRight, Brain, FileText, Flame, Layers3, Lightbulb, MessageSquareText,
  ShieldCheck, Target, CheckCircle2, Github, BookOpen, UserRound, Scale
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
  { icon: MessageSquareText, title: 'วิเคราะห์และให้คำปรึกษา', text: 'ช่วยแตกปัญหา สรุปบริบท และจัดประเด็นสำคัญก่อนตัดสินใจ' },
  { icon: Layers3, title: 'จัดโครงสร้างข้อมูล', text: 'แยกข้อมูล หลักฐาน สมมติฐาน และความไม่แน่นอนให้อยู่ในโครงสร้างที่ตรวจสอบได้' },
  { icon: Lightbulb, title: 'สร้างและเทียบสมมติฐาน', text: 'พิจารณาทางเลือกและสมมติฐานแข่งขัน เพื่อไม่ยึดติดกับคำตอบแรกเพียงคำตอบเดียว' },
  { icon: Target, title: 'สนับสนุนการตัดสินใจ', text: 'เปรียบเทียบทางเลือก ความเสี่ยง ผลกระทบ และ trade-offs โดยมนุษย์ยังเป็นผู้ตัดสินใจ' },
  { icon: ShieldCheck, title: 'AI Governance', text: 'ตรวจ schema, semantic consistency และ policy ก่อนส่งผลลัพธ์ที่ต้องใช้การกำกับดูแล' },
  { icon: FileText, title: 'หลักฐานและความไม่แน่นอน', text: 'ติดตามที่มาของข้ออ้าง แยกสิ่งที่ยืนยันได้ออกจากสิ่งที่ยังไม่แน่นอน และลดการกล่าวเกินหลักฐาน' },
];

const principles = [
  '12-stage reasoning & governance architecture',
  'Human Agency เป็นอำนาจสุดท้าย',
  'Evidence provenance & uncertainty handling',
  'Decision Governance Gate ก่อนผลลัพธ์สำคัญ',
];

const pricingPlans = [
  { name: 'Free', price: 'ฟรี', audience: 'Explore AI และเริ่มสร้าง Governance ส่วนตัว', features: ['20 analyses/วัน', 'Fact / Hypothesis / Risk', 'Audit Log 7 วัน'], featured: false },
  { name: 'Starter', price: '490 บาท/เดือน', audience: 'Personal Governance พร้อมใช้โมเดลของคุณเอง', features: ['Governance Pipeline + Trace', 'ไม่บวกค่า Token ของโมเดล', 'Export พื้นฐาน'], featured: false },
  { name: 'Professional', price: '990 บาท/เดือน', audience: 'Decision Intelligence สำหรับนักวิเคราะห์', features: ['วิเคราะห์ไม่จำกัดตาม Fair Use', 'ประวัติการตัดสินใจระยะยาว', 'Decision Report + Export'], featured: true },
  { name: 'Team', price: '4,900 บาท/เดือน', audience: 'ทีมสูงสุด 5 คน', features: ['Shared Workspace และ Role', 'Human Approval Workflow', 'Audit Log 90 วัน'], featured: false },
  { name: 'Business', price: '19,000 บาท/เดือน', audience: 'องค์กรสูงสุด 20 คน', features: ['Policy และ RBAC', 'Evidence Lineage + Approval Gate', 'Audit Log 365 วัน'], featured: false },
  { name: 'Pilot', price: '49,000 บาท / 30 วัน', audience: 'ทดลองกับ Workflow จริงก่อนทำสัญญาองค์กร', features: ['ผู้ใช้สูงสุด 10 คน', '1 Workflow จริง', 'Workshop + Policy Template'], featured: false },
  { name: 'Enterprise', price: 'Contact Sales', audience: 'องค์กรที่ต้องการการกำกับดูแลเฉพาะ', features: ['SSO / SAML / OIDC', 'Dedicated Audit Store และ API', 'Custom Governance Rules + SLA'], featured: false },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnter,
  onNavigateDocs,
  onNavigatePublication,
  onNavigateBooks,
  onNavigatePlans,
  isLight: propIsLight,
}) => {
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
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-black">
              <Flame className="h-5 w-5 fill-current" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-[.22em]">FIREKEEPER</span>
              <span className={`block text-[10px] ${muted}`}>AI Governance & Decision Intelligence</span>
            </span>
          </button>

          <nav className="hidden items-center gap-7 text-sm md:flex">
            <a href="#capabilities" className={muted}>ความสามารถ</a>
            <a href="#pricing" className={muted}>แพ็กเกจ</a>
            <button type="button" onClick={onNavigateDocs} className={muted}>เอกสาร</button>
            <button type="button" onClick={onNavigatePublication || onNavigateBooks} className={muted}>หนังสือ</button>
            <a href="/about" className={muted}>เกี่ยวกับผู้สร้าง</a>
          </nav>

          <button type="button" onClick={onEnter} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-black">
            เริ่มใช้งาน
          </button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-24">
        <div>
          <div className="mb-5 text-xs font-bold tracking-[.24em] text-orange-500">FIREKEEPER · PCA v3.0</div>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.04] tracking-[-.045em] sm:text-6xl lg:text-7xl">
            ตัดสินใจด้วย AI ได้อย่างมั่นใจ<br/><span className="text-orange-500">เพราะทุกเหตุผลตรวจสอบได้</span>
          </h1>
          <p className={`mt-7 max-w-2xl text-lg leading-8 sm:text-xl ${muted}`}>
            Firekeeper ช่วยองค์กรลดความเสี่ยงจากการตัดสินใจด้วย AI ด้วยการแยกหลักฐานออกจากสมมติฐาน
            ตรวจความเสี่ยง บันทึกเส้นทางการวิเคราะห์ และให้มนุษย์เป็นผู้อนุมัติขั้นสุดท้าย
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={onEnter} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 font-bold text-black">
              เริ่มวิเคราะห์ฟรี <ArrowRight className="h-4 w-4" />
            </button>
            <a href="#capabilities" className={`inline-flex items-center rounded-xl border px-6 py-3.5 font-semibold ${isLight ? 'border-slate-300' : 'border-white/20'}`}>
              ดูวิธีทำงาน
            </a>
          </div>
          <div className={`mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm ${muted}`}>
            <span className="flex items-center gap-2"><UserRound className="h-4 w-4"/> Human Agency</span>
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4"/> Governance</span>
            <span className="flex items-center gap-2"><Scale className="h-4 w-4"/> Evidence & Uncertainty</span>
          </div>
        </div>

        <div className={`rounded-[2rem] border p-8 sm:p-12 ${surface}`}>
          <div className="mx-auto flex aspect-square max-w-[430px] flex-col items-center justify-center rounded-[2rem] border border-orange-500/20 bg-orange-500/[.035] text-center">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border border-orange-500/40 bg-[#090a0c]">
              <Flame className="h-16 w-16 fill-orange-500 text-orange-500" />
            </div>
            <div className="mt-8 text-sm font-bold tracking-[.34em] text-orange-500">FIREKEEPER</div>
            <div className={`mt-3 max-w-xs text-lg leading-7 ${muted}`}>AI assists. Humans decide.</div>
          </div>
        </div>
      </section>

      <section id="capabilities" className={`border-y py-20 ${isLight ? 'border-slate-200 bg-white/40' : 'border-white/10 bg-white/[.015]'}`}>
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="text-center">
            <div className="text-xs font-bold tracking-[.28em] text-orange-500">CORE CAPABILITIES</div>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">สิ่งที่ Firekeeper ทำได้จริง</h2>
            <p className={`mx-auto mt-4 max-w-2xl ${muted}`}>ความสามารถหลักที่มีอยู่ในระบบปัจจุบัน ไม่ใช่รายการฟีเจอร์เชิงสมมติ</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, text }) => (
              <article key={title} className={`rounded-2xl border p-6 ${surface}`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/[.07] text-orange-500">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className={`mt-2 text-sm leading-6 ${muted}`}>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className={`grid gap-8 rounded-[2rem] border p-7 sm:p-10 lg:grid-cols-[1fr_.85fr] lg:p-12 ${surface}`}>
          <div>
            <div className="text-xs font-bold tracking-[.25em] text-orange-500">MORE THAN A CHATBOT</div>
            <h2 className="mt-3 text-3xl font-bold">ไม่ได้มีหน้าที่แค่สร้างคำตอบ</h2>
            <p className={`mt-4 max-w-2xl leading-7 ${muted}`}>
              Firekeeper วางชั้นกำกับดูแลเหนือกระบวนการใช้ AI เพื่อช่วยตรวจเหตุผล หลักฐาน ความไม่แน่นอน
              และเงื่อนไขที่ต้องส่งกลับให้มนุษย์พิจารณา
            </p>
            <button type="button" onClick={onEnter} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-bold text-black">
              เปิด Firekeeper <ArrowRight className="h-4 w-4"/>
            </button>
          </div>
          <div className="grid gap-3">
            {principles.map((item) => (
              <div key={item} className={`flex items-start gap-3 rounded-xl border p-4 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/20'}`}>
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className={`border-y py-20 ${isLight ? 'border-slate-200 bg-white/40' : 'border-white/10 bg-white/[.015]'}`}>
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="text-center">
            <div className="text-xs font-bold tracking-[.28em] text-orange-500">FIREKEEPER PLANS</div>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">เลือกแพ็กเกจตามระดับการใช้งาน</h2>
            <p className={`mx-auto mt-4 max-w-2xl ${muted}`}>เริ่มใช้ฟรี แล้วเพิ่มความสามารถเมื่อทีมและความต้องการด้าน Governance เติบโตขึ้น</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pricingPlans.map((plan) => (
              <article key={plan.name} className={`relative flex flex-col rounded-2xl border p-6 ${plan.featured ? 'border-orange-500 bg-orange-500/[.08]' : surface}`}>
                {plan.featured && <span className="absolute right-5 top-5 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold text-black">แนะนำ</span>}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-4 text-2xl font-extrabold text-orange-500">{plan.price}</div>
                <p className={`mt-2 min-h-12 text-sm ${muted}`}>{plan.audience}</p>
                <ul className="mt-5 space-y-3 text-sm">
                  {plan.features.map((feature) => <li key={feature} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-orange-500" />{feature}</li>)}
                </ul>
                <button type="button" onClick={onNavigatePlans || onEnter} className="mt-7 rounded-xl border border-orange-500/50 px-4 py-3 text-sm font-bold text-orange-500 hover:bg-orange-500 hover:text-black">
                  {plan.name === 'Free' ? 'เริ่มใช้งาน' : plan.name === 'Enterprise' || plan.name === 'Pilot' ? 'ติดต่อทีม' : 'ดูรายละเอียดแพ็กเกจ'}
                </button>
              </article>
            ))}
          </div>
          <div className={`mx-auto mt-8 grid max-w-5xl gap-3 text-sm ${muted} sm:grid-cols-2 lg:grid-cols-4`}>
            {['ใช้ฟรีเริ่มต้น', 'ไม่บวกค่า Token เมื่อใช้ BYOK', 'Human Approval เป็นขั้นสุดท้าย', 'มี Trace และ Audit ย้อนหลัง'].map((item) => <div key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-orange-500" />{item}</div>)}
          </div>
        </div>
      </section>

      <footer className={`border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <Flame className="h-6 w-6 fill-orange-500 text-orange-500"/>
            <div>
              <div className="text-sm font-bold tracking-[.2em]">FIREKEEPER</div>
              <div className={`text-xs ${muted}`}>Ideas Become Clearer</div>
            </div>
          </div>
          <div className={`flex flex-wrap gap-5 text-sm ${muted}`}>
            <a href="/about">เกี่ยวกับผู้สร้าง</a>
            <button type="button" onClick={onNavigateDocs}>เอกสาร</button>
            <a href="https://github.com/punn-pca/firekeeper-core" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5"><Github className="h-4 w-4"/> GitHub</a>
            <button type="button" onClick={onNavigatePublication || onNavigateBooks} className="inline-flex items-center gap-1.5"><BookOpen className="h-4 w-4"/> Publications</button>
          </div>
        </div>
      </footer>
    </main>
  );
};
