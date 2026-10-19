import { ChatComposerSurface } from './ChatComposerSurface';
import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Activity, ArrowRight, ArrowUpRight, Check, CheckCircle2, FileSearch, FileText,
  Flame, Github, Globe2, Layers3, LockKeyhole, MessageSquareText,
  Network, Scale, ShieldCheck, Sparkles, UserRound, UsersRound, Workflow,
  Zap, Cpu, Settings2,
} from 'lucide-react';
import { PLAN_DEFINITIONS, PlanId } from '../config/plans';
import { useTheme } from '../context/ThemeContext';
import './LandingPage.css';

interface LandingPageProps {
  onEnter: () => void;
  onSubmitPrompt?: (prompt: string) => void;
  compactHome?: boolean;
  onOpenChatSettings?: () => void;
  onNavigateDocs?: () => void;
  onNavigateDevelopers?: () => void;
  onNavigatePublication?: () => void;
  onNavigateBooks?: () => void;
  onNavigatePlans?: () => void;
  isLight?: boolean;
}

const capabilities = [
  {
    icon: Zap,
    title: 'Dual-Mode สลับสองโหมดอิสระ',
    text: 'Direct AI ช่วยสนทนาและค้นหาโจทย์ก่อนตัดสินใจ ส่วน Governance ใช้ PCA วิเคราะห์หลักฐานและความเสี่ยงอย่างเป็นระบบ ผู้ใช้เลือกสลับโหมดเองได้',
    detail: 'Direct AI · Governed PCA · Independent execution paths',
  },
  {
    icon: Layers3,
    title: 'จัดระเบียบเหตุผลให้ตรวจทานได้',
    text: 'แยกข้อเท็จจริง ข้ออ้างจากแหล่งข้อมูล การตีความ สมมติฐาน ความเสี่ยง และคำแนะนำออกจากกัน แทนการรวมทุกอย่างเป็นคำตอบก้อนเดียว',
    detail: 'Fact · Source claim · Inference · Hypothesis · Recommendation',
  },
  {
    icon: FileSearch,
    title: 'เชื่อมข้อสรุปกับหลักฐาน',
    text: 'ดูว่า claim ใดมีข้อมูลรองรับ มาจากแหล่งใด และมีหลักฐานที่ขัดแย้งหรือยังไม่ได้ตรวจสอบตรงไหน',
    detail: 'Evidence lineage · Claim-evidence review',
  },
  {
    icon: Network,
    title: 'เปรียบเทียบสมมติฐานและทางเลือก',
    text: 'สำรวจคำอธิบายที่แข่งขันกัน ข้อดีข้อเสีย และเงื่อนไขที่ทำให้ข้อเสนอเปลี่ยน โดยปรับความลึกตามโจทย์',
    detail: 'Alternative hypotheses · Trade-offs · Risk critique',
  },
  {
    icon: Globe2,
    title: 'ใช้บริบทจากไฟล์และเว็บ',
    text: 'แนบ PDF, เอกสาร, ตาราง, ไฟล์ข้อความ, โค้ด หรือภาพประกอบ และเปิดค้นเว็บเมื่อ workflow กับ deployment รองรับ',
    detail: 'Documents · Spreadsheets · Code · Images · Web search',
  },
  {
    icon: Sparkles,
    title: 'เลือกวิธีวิเคราะห์และโมเดล',
    text: 'ตั้งค่ารูปแบบคำตอบ ระดับการให้เหตุผล และผู้ให้บริการโมเดลที่รองรับ รวมถึง BYOK หรือ Ollama ตามแพ็กเกจและการตั้งค่า',
    detail: 'Adaptive PCA · Multi-provider · BYOK · Ollama',
  },
  {
    icon: UserRound,
    title: 'ให้คนมีอำนาจตัดสินใจ',
    text: 'เมื่อข้อมูลไม่พอ ระบบควรระบุสิ่งที่ยังไม่รู้และเสนอเงื่อนไขที่ต้องตรวจเพิ่ม งานสำคัญยังต้องผ่านการทบทวนและอนุมัติโดยมนุษย์',
    detail: 'Unknowns · Conditional recommendations · Human review',
  },
  {
    icon: Workflow,
    title: 'ทำงานร่วมกันใน Workspace',
    text: 'แพ็กเกจทีมมี workspace สมาชิกและบทบาท พร้อมคิวส่งคำตัดสินใจให้ผู้ทบทวนอนุมัติหรือตีกลับ',
    detail: 'Shared workspace · Roles · Approval queue',
  },
  {
    icon: Activity,
    title: 'เก็บร่องรอยและส่งออกรายงาน',
    text: 'Decision Record และ audit trace ช่วยให้ย้อนดูบริบท หลักฐาน ความเสี่ยง และข้อมูลกำกับการวิเคราะห์ พร้อมส่งออกรายงานตามสิทธิ์แพ็กเกจ',
    detail: 'Decision records · Audit trace · Report export',
  },
];

const workflow = [
  {
    number: '01',
    icon: MessageSquareText,
    title: 'เริ่มจากโจทย์จริง',
    text: 'เขียนคำถาม แนบเอกสารที่เกี่ยวข้อง หรือเปิดค้นเว็บ เพื่อให้การวิเคราะห์มีบริบทที่คุณต้องการ',
  },
  {
    number: '02',
    icon: Scale,
    title: 'ตรวจหลักฐานและทางเลือก',
    text: 'PUNN PCA ช่วยจัดโครงสร้างข้ออ้าง สมมติฐาน ความเสี่ยง และช่องว่างข้อมูลตามความซับซ้อนของโจทย์',
  },
  {
    number: '03',
    icon: ShieldCheck,
    title: 'ทบทวนก่อนนำไปใช้',
    text: 'อ่านเหตุผลและเงื่อนไข ตรวจข้อมูลที่ยังไม่ยืนยัน แล้วให้ผู้รับผิดชอบเลือกขั้นตอนถัดไป',
  },
  {
    number: '04',
    icon: FileText,
    title: 'บันทึกและติดตาม',
    text: 'บันทึก Decision Record ส่งเข้ากระบวนการอนุมัติของทีม หรือส่งออกรายงานตามสิทธิ์ที่ใช้งาน',
  },
];

const planAudience: Record<PlanId, string> = {
  free: 'เริ่มทดลองวิเคราะห์และทำความรู้จัก governance',
  byok: 'ใช้งานส่วนตัว พร้อมเลือก provider และใช้ API key ของคุณ',
  professional: 'สำหรับนักวิเคราะห์และที่ปรึกษาที่ต้องการประวัติระยะยาว',
  team: 'สำหรับทีมที่ต้องทำงานร่วมกันและมีขั้นตอน review',
  business: 'สำหรับองค์กรที่ต้องใช้ policy และควบคุมผู้ใช้',
  enterprise: 'ปรับใช้กับข้อกำหนดและการเชื่อมต่อขององค์กร',
};

const planFeatures: Record<PlanId, string[]> = {
  free: ['Direct 50 ข้อความ/วัน + Governance 20 วิเคราะห์/วัน (โควตาแยกกัน)', 'DeepSeek และการตรวจ Fact / Hypothesis / Risk', 'Audit Log และประวัติ 7 วัน'],
  byok: ['490 บาท/เดือน · รองรับ BYOK และหลาย provider', 'Governance trace และ export พื้นฐาน', 'ประวัติ 30 วัน · ค่าโมเดลภายนอกคิดโดย provider'],
  professional: ['990 บาท/เดือน · ใช้งานตาม Fair Use', 'ประวัติระยะยาว 365 วัน', 'ส่งออก PDF / HTML / JSON และ Decision Report'],
  team: ['4,900 บาท/เดือน · สูงสุด 5 คน', 'Shared Workspace, roles และ approval workflow', 'Audit Log 90 วัน'],
  business: ['19,000 บาท/เดือน · สูงสุด 20 คน', 'Workspace, approval และ admin policy', 'Audit Log 365 วัน'],
  enterprise: ['ราคาและขอบเขตตามการประเมินองค์กร', 'สิทธิ์ SSO, SIEM และ API access ตามการตั้งค่า', 'ตกลง governance และรูปแบบการติดตั้งร่วมกัน'],
};

const plans = Object.values(PLAN_DEFINITIONS) as (typeof PLAN_DEFINITIONS)[PlanId][];

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnter,
  onSubmitPrompt,
  compactHome = false,
  onOpenChatSettings,
  onNavigateDocs,
  onNavigatePublication,
  onNavigateBooks,
  onNavigatePlans,
  isLight: propIsLight,
}) => {
  const [heroPrompt, setHeroPrompt] = useState('');
  const [showAllCapabilities, setShowAllCapabilities] = useState(false);
  const { theme } = useTheme();
  const isLight = propIsLight !== undefined ? propIsLight : theme === 'light';
  const reducedMotion = useReducedMotion();
  const bg = isLight ? 'bg-[#f4f7f8] text-slate-950' : 'bg-[#070d18] text-[#f4f1e8]';
  const surface = isLight ? 'bg-white border-slate-200' : 'bg-[#0c1524] border-white/10';
  const muted = isLight ? 'text-slate-600' : 'text-white/60';
  const secondarySurface = isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/20';

  return (
    <main className={`fk-observatory min-h-screen ${bg}`} data-theme={isLight ? 'light' : 'dark'}>
      <section className="fk-hero relative mx-auto flex max-w-7xl flex-col items-center justify-center px-5 py-12 text-center sm:py-16 lg:px-8 lg:py-20">
        <motion.div initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }} className="relative z-10 flex w-full max-w-5xl flex-col items-center">
          <div className="fk-eyebrow mb-7 flex items-center justify-center gap-3 text-xs font-semibold tracking-[.2em]"><span className="fk-status-dot" /> AI ช่วยวิเคราะห์ · มนุษย์ตัดสินใจ</div>
          <h1 className="fk-hero-title font-semibold">ก่อนเลือกทาง<br /><span className="fk-hero-accent">เห็นเหตุผลให้ครบ</span></h1>
          <p className={`mt-7 max-w-3xl text-lg leading-8 ${muted}`}>
            ถาม AI ได้ตามปกติ หรือเลือกตรวจหลักฐาน ความเสี่ยง และสิ่งที่ยังไม่รู้ก่อนตัดสินใจ — คุณเป็นผู้เลือกวิธีใช้งาน
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={onEnter} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">
              วิเคราะห์ฟรี →
            </button>
            <a href="#sample-report" className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-colors ${isLight ? "border-slate-300 text-slate-800 hover:border-orange-400" : "border-white/20 text-white hover:border-orange-400"}`}><FileText className="h-4 w-4 text-orange-500" />ดูตัวอย่างรายงาน</a>
            {!onSubmitPrompt && <a href="#how-it-works" className={`inline-flex min-h-11 items-center rounded-xl border px-5 py-3 text-sm font-medium ${isLight ? "border-slate-300 text-slate-800" : "border-white/20 text-white"}`}>ดูวิธีการทำงาน</a>}
          </div>
          {onSubmitPrompt && (
            <div className="mx-auto mt-8 w-full max-w-3xl text-left">

              <ChatComposerSurface as="form" light={isLight} onSubmit={(event) => { event.preventDefault(); if (!heroPrompt.trim()) return; onSubmitPrompt(heroPrompt.trim()); setHeroPrompt(''); }} className={`flex items-end gap-2 rounded-2xl border border-sky-400/40 p-3 shadow-[0_12px_45px_rgba(0,0,0,0.35),0_0_18px_rgba(59,130,246,0.15)] focus-within:border-sky-400/80 ${isLight ? 'bg-white' : 'bg-gradient-to-br from-[#101d39] via-[#0c1428] to-[#080d19]'}`}>
                <textarea aria-label="พิมพ์คำถามถึง Firekeeper" rows={2} value={heroPrompt}
                  onChange={(event) => setHeroPrompt(event.target.value)}
                  placeholder="ถาม Firekeeper ได้เลย..."
                  className={`min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-base outline-none ${isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-white/40'}`}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      if (heroPrompt.trim()) { onSubmitPrompt(heroPrompt.trim()); setHeroPrompt(''); }
                    }
                  }} />
                <button type="button" onClick={onOpenChatSettings} aria-label="ตั้งค่าแชทและโมเดล" title="ตั้งค่าแชทและโมเดล" className={`rounded-xl p-3 transition-colors ${isLight ? "text-slate-600 hover:bg-slate-100" : "text-slate-300 hover:bg-white/10"}`}><Settings2 className="h-5 w-5" /></button>
                <button type="submit" disabled={!heroPrompt.trim()} className="rounded-xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 border border-sky-400/60 px-5 py-3 font-bold text-white disabled:opacity-40">ส่ง ↗</button>
              </ChatComposerSurface>
              <p className={`mt-2 text-xs ${muted}`}>ส่งคำถามเข้าสู่ระบบแชท Firekeeper · การใช้งานขึ้นอยู่กับสิทธิ์และการตั้งค่าระบบ</p>
            </div>
          )}
        </motion.div>
      </section>

      {!compactHome && <>
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className={`rounded-3xl border p-7 sm:p-10 lg:p-12 ${surface}`}>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6 border-slate-500/15">
            <div>
              <div className="text-xs font-bold tracking-[.25em] text-orange-500 uppercase">ONE PLATFORM · TWO INDEPENDENT PATHS</div>
              <h2 className="mt-2 text-2xl sm:text-4xl font-bold">สองโหมด เลือกให้เหมาะกับคำถาม</h2>
            </div>
            <span className={`text-xs px-3 py-1.5 rounded-full border font-mono ${secondarySurface}`}>PUNN PCA v3.0 Core Router</span>
          </div>

          <p className={`mt-6 max-w-3xl leading-relaxed text-sm sm:text-base ${muted}`}>
            ถามตอบทั่วไปใช้ Normal AI ได้ทันที เมื่อต้องตัดสินใจเรื่องสำคัญให้เลือก Governance เพื่อตรวจหลักฐาน ทางเลือก ความเสี่ยง และข้อจำกัดของข้อมูล โดยทั้งสองโหมดใช้เส้นทางประมวลผลแยกกัน
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Normal Mode */}
            <div className={`rounded-2xl border p-6 flex flex-col justify-between ${secondarySurface} hover:border-amber-500/40 transition-colors`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-amber-500 font-bold text-sm tracking-wide">
                    <Zap className="h-4 w-4" /> ⚡ NORMAL MODE (DIRECT AI)
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">Fast & Direct</span>
                </div>
                <h3 className="mt-4 text-xl font-bold">ความเร็วสูง · คล่องตัว · ประหยัดต้นทุน</h3>
                <p className={`mt-3 text-sm leading-6 ${muted}`}>
                  ส่งตรงถึง LLM Runtime ทันทีโดยไม่ผ่านขั้นตอนกำกับซับซ้อน เหมาะสำหรับการถามตอบทั่วไป ร่างข้อความ สรุปประเด็น หรือช่วยงานรายวันอย่างรวดเร็ว
                </p>
                <ul className="mt-4 space-y-2 text-xs">
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-amber-500 shrink-0" /> ข้ามขั้นตอน PCA 12 Stages เพื่อลดขั้นตอนการประมวลผล</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-amber-500 shrink-0" /> คำตอบอ่านง่าย กระชับ ไม่มี Epistemic Tags รบกวน</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-amber-500 shrink-0" /> ติดตามการใช้งานและต้นทุนตามข้อมูลที่ระบบบันทึกได้</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-amber-500 shrink-0" /> ใช้มาตรการความปลอดภัยและการควบคุมภาษาที่ระบบรองรับ</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-500/15 flex items-center justify-between text-xs font-mono text-amber-500">
                <span>Latency: Provider-dependent</span>
                <span>Audit: Operational Usage</span>
              </div>
            </div>

            {/* Governed Mode */}
            <div className={`rounded-2xl border p-6 flex flex-col justify-between ${isLight ? 'border-sky-300 bg-sky-500/[0.04]' : 'border-sky-500/30 bg-sky-500/[0.04]'} hover:border-sky-500/50 transition-colors`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sky-400 font-bold text-sm tracking-wide">
                    <ShieldCheck className="h-4 w-4" /> 🛡️ GOVERNED MODE (FIREKEEPER PCA)
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">Evidence & Review</span>
                </div>
                <h3 className="mt-4 text-xl font-bold">กำกับยุทธศาสตร์ · อิงหลักฐาน · ทบทวนได้</h3>
                <p className={`mt-3 text-sm leading-6 ${muted}`}>
                  รันผ่านกระบวนการเต็มรูปแบบของ PUNN PCA เพื่อกำกับคุณภาพการตัดสินใจในงานสำคัญ ตรวจสอบความขัดแย้งของสมมติฐาน และแสดงความเชื่อมโยงของข้อสรุปกับหลักฐานที่ตรวจพบ
                </p>
                <ul className="mt-4 space-y-2 text-xs">
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-sky-400 shrink-0" /> ผ่าน PCA 12 Stages & Adaptive Response Depth</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-sky-400 shrink-0" /> จำแนก Epistemic Taxonomy ([FACT], [HYPOTHESIS], [RISK])</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-sky-400 shrink-0" /> การตรวจสมมติฐานและหลักฐานตามขั้นตอนที่ระบบรองรับ</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-sky-400 shrink-0" /> บันทึก Audit Trace พร้อม integrity hash ตามขอบเขตระบบ</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-500/15 flex items-center justify-between text-xs font-mono text-sky-400">
                <span>Assurance: Human Review Required</span>
                <span>Audit: Tamper-Evident Trace</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="fk-eyebrow text-xs font-bold tracking-[.2em]">01 / HOW FIREKEEPER WORKS</div>
        <div className="mt-5 grid gap-5 md:grid-cols-[.8fr_1.2fr] md:items-end">
          <h2 className="max-w-3xl text-3xl font-semibold leading-snug sm:text-5xl">จากโจทย์ซับซ้อน<br /><span className={muted}>สู่เหตุผลที่ตรวจทานได้</span></h2>
          <p className={`max-w-2xl leading-7 ${muted}`}>FIREKEEPER ใช้ PUNN Predictive Cognitive Architecture (PCA) เพื่อจัดกระบวนการวิเคราะห์และกำกับคุณภาพของข้อเสนอ ไม่ได้อ้างว่าเปิดเผยความคิดภายในของโมเดลหรือรับประกันว่าคำตอบถูกต้อง</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {workflow.map(({ number, icon: Icon, title, text }, index) => (
            <motion.article key={number} initial={reducedMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ duration: .35, delay: index * .04 }} className={`fk-step rounded-2xl border p-6 ${surface}`}>
              <div className="flex items-center justify-between"><span className="fk-eyebrow font-mono text-sm">{number}</span><Icon className="h-5 w-5 text-orange-500" /></div>
              <h3 className="mt-8 text-xl font-semibold">{title}</h3>
              <p className={`mt-3 text-sm leading-7 ${muted}`}>{text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── DUAL-MODE ARCHITECTURE SECTION ── */}
      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className={`fk-example grid gap-8 rounded-3xl border p-6 sm:p-10 lg:grid-cols-[.8fr_1.2fr] ${surface}`}>
          <div>
            <div className="fk-eyebrow text-xs tracking-[.2em]">A PRACTICAL EXAMPLE</div>
            <h2 className="mt-5 text-3xl font-semibold leading-snug">ไม่หยุดแค่<br />“ราคาไหนถูกกว่า”</h2>
            <p className={`mt-5 leading-7 ${muted}`}>สำหรับการเลือกผู้ขาย ระบบช่วยแยกข้อมูลราคาออกจากข้อสรุปเรื่องความคุ้มค่า ชี้สิ่งที่ต้องตรวจเพิ่ม และช่วยให้ผู้อนุมัติเห็นเงื่อนไขก่อนตัดสินใจ</p>
          </div>
          <div id="decision-record" className="min-w-0 scroll-mt-8">
            <div className={`mb-4 flex flex-wrap items-center justify-between gap-3 text-xs ${muted}`}><span className="font-mono tracking-wider">ILLUSTRATIVE DECISION RECORD</span><span className="rounded-full border px-3 py-1.5">ตัวอย่างประกอบ · ไม่ใช่ผลวิเคราะห์จริง</span></div>
            <div className="space-y-3">
              {[
                ['ข้อเท็จจริง', 'ใบเสนอราคาของผู้ขาย A ต่ำกว่าผู้ขาย B', 'border-cyan-500/30 bg-cyan-500/[.06]'],
                ['ข้ออนุมาน', 'A อาจคุ้มค่ากว่า หากต้นทุนดูแลไม่สูงกว่า', 'border-violet-500/30 bg-violet-500/[.06]'],
                ['สิ่งที่ยังไม่รู้', 'ค่าบำรุงรักษา เงื่อนไขบริการ และต้นทุนตลอดอายุใช้งาน', 'border-amber-500/30 bg-amber-500/[.06]'],
              ].map(([title, text, style]) => <div key={title} className={`rounded-xl border p-4 ${style}`}><div className="text-xs font-semibold">{title}</div><p className="mt-2 text-sm leading-6">{text}</p></div>)}
              <div className={`flex items-start gap-3 rounded-xl border p-4 ${isLight ? 'border-orange-200 bg-orange-50' : 'border-orange-500/20 bg-orange-500/[.06]'}`}><UserRound className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" /><div><div className="text-sm font-bold">จุดที่ต้องทบทวนโดยมนุษย์</div><p className={`mt-1 text-xs leading-5 ${muted}`}>ตรวจต้นทุนรวมและเงื่อนไขบริการก่อนอนุมัติการเลือกผู้ขาย</p></div></div>
            </div>
          </div>
        </div>
      </section>


      <section id="sample-report" aria-labelledby="sample-report-title" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-16 lg:px-8 lg:py-20">
        <div className={`overflow-hidden rounded-3xl border ${surface}`}>
          <div className={`flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[.025]'}`}>
            <div>
              <div className="text-xs font-bold tracking-[.22em] text-orange-500">SAMPLE DECISION REPORT</div>
              <h2 id="sample-report-title" className="mt-2 text-2xl font-bold sm:text-3xl">ตัวอย่างรายงานวิเคราะห์เพื่อการตัดสินใจ</h2>
              <p className={`mt-2 text-sm leading-6 ${muted}`}>ตัวอย่างสมมติสำหรับสาธิตโครงสร้างรายงาน ไม่ใช่ผลวิเคราะห์จากการใช้งานจริง</p>
            </div>
            <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${isLight ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-amber-500/30 bg-amber-500/[.08] text-amber-300'}`}><Activity className="h-4 w-4" /> ILLUSTRATIVE · UNVERIFIED</span>
          </div>
          <div className="grid gap-0 lg:grid-cols-[.8fr_1.2fr]">
            <div className={`border-b p-6 sm:p-8 lg:border-b-0 lg:border-r ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <div className="text-xs font-bold tracking-[.16em] text-orange-500">EXECUTIVE SUMMARY</div>
              <h3 className="mt-3 text-xl font-bold">ควรเลือกผู้ขายรายใด?</h3>
              <p className={`mt-3 text-sm leading-7 ${muted}`}>ข้อมูลราคาตั้งต้นเพียงอย่างเดียวยังไม่เพียงพอที่จะสรุปว่าผู้ขายรายใดคุ้มค่ากว่า ควรเปรียบเทียบต้นทุนรวม เงื่อนไขรับประกัน ระยะเวลาบริการ และค่าใช้จ่ายตลอดอายุการใช้งานก่อนอนุมัติ</p>
              <div className={`mt-6 rounded-xl border p-4 ${isLight ? 'border-orange-200 bg-orange-50' : 'border-orange-500/20 bg-orange-500/[.06]'}`}>
                <div className="flex items-center gap-2 text-sm font-bold"><UserRound className="h-4 w-4 text-orange-500" /> การตัดสินใจยังเป็นของมนุษย์</div>
                <p className={`mt-2 text-sm leading-6 ${muted}`}>ข้อเสนอจาก AI เป็นข้อมูลประกอบ ผู้รับผิดชอบต้องตรวจข้อมูลและอนุมัติด้วยตนเอง</p>
              </div>
            </div>
            <div className="min-w-0 p-6 sm:p-8">
              <div className="text-xs font-bold tracking-[.16em] text-orange-500">CLAIM & EVIDENCE REVIEW</div>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/[.06] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-bold">ข้อเท็จจริงที่ระบุในโจทย์</span><span className="rounded-full border border-cyan-500/30 px-2 py-1 text-[11px] font-semibold text-cyan-600">USER-PROVIDED</span></div>
                  <p className={`mt-2 text-sm leading-6 ${muted}`}>ใบเสนอราคาของผู้ขาย A ต่ำกว่าผู้ขาย B ตามตัวอย่างที่สมมติขึ้น</p>
                </div>
                <div className="rounded-xl border border-violet-500/30 bg-violet-500/[.06] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-bold">ข้ออนุมาน</span><span className="rounded-full border border-violet-500/30 px-2 py-1 text-[11px] font-semibold text-violet-600">INFERENCE</span></div>
                  <p className={`mt-2 text-sm leading-6 ${muted}`}>ราคาต่ำกว่าอาจช่วยลดต้นทุนเริ่มต้น แต่ยังสรุปความคุ้มค่ารวมไม่ได้</p>
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/[.06] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-bold">ข้อมูลที่ยังขาด</span><span className="rounded-full border border-amber-500/30 px-2 py-1 text-[11px] font-semibold text-amber-700">UNVERIFIED</span></div>
                  <p className={`mt-2 text-sm leading-6 ${muted}`}>ไม่มีข้อมูลยืนยันเรื่องค่าบำรุงรักษา การรับประกัน ระยะเวลาซ่อม และต้นทุนตลอดอายุใช้งาน</p>
                </div>
                <div className={`rounded-xl border p-4 ${secondarySurface}`}>
                  <div className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-4 w-4 text-orange-500" /> ขั้นตอนถัดไปที่แนะนำ</div>
                  <p className={`mt-2 text-sm leading-6 ${muted}`}>ขอรายละเอียดต้นทุนและเงื่อนไขบริการจากผู้ขายทั้งสองราย แล้วให้ผู้มีอำนาจอนุมัติทบทวนข้อมูลก่อนตัดสินใจ</p>
                </div>
              </div>
            </div>
          </div>
          <div className={`flex flex-col gap-3 border-t p-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
            <p className={`text-xs leading-5 ${muted}`}>หมายเหตุ: ตัวอย่างนี้ไม่ได้ยืนยันว่าระบบได้ค้นแหล่งข้อมูลภายนอกหรือดำเนินการตรวจสอบจริง</p>
            <button type="button" onClick={onEnter} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-orange-400">ลองวิเคราะห์ด้วยตัวเอง <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      </section>

      <section id="capabilities" className={`mt-12 border-y py-20 ${isLight ? 'border-slate-200 bg-white/40' : 'border-white/10 bg-white/[.015]'}`}>
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-3xl"><div className="text-xs font-bold tracking-[.28em] text-orange-500">CAPABILITIES IN THE PRODUCT</div><h2 className="mt-3 text-3xl font-bold sm:text-4xl">เครื่องมือที่ช่วยให้ AI มีบริบทและตรวจสอบได้</h2><p className={`mt-4 leading-7 ${muted}`}>ความสามารถบางส่วนขึ้นอยู่กับแพ็กเกจ provider และการตั้งค่าของ deployment</p></div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(showAllCapabilities ? capabilities : capabilities.slice(0, 4)).map(({ icon: Icon, title, text, detail }) => <article key={title} className={`fk-feature rounded-2xl border p-6 ${surface}`}><span className="flex h-12 w-12 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/[.07] text-orange-500"><Icon className="h-6 w-6" /></span><h3 className="mt-5 text-lg font-bold">{title}</h3><p className={`mt-2 text-sm leading-6 ${muted}`}>{text}</p><p className="mt-4 border-t border-slate-500/15 pt-3 text-[11px] font-medium leading-5 text-orange-500">{detail}</p></article>)}
          </div>
        </div>
          <div className="mt-8 text-center"><button type="button" aria-expanded={showAllCapabilities} onClick={() => setShowAllCapabilities(value => !value)} className="min-h-11 rounded-xl border border-orange-500/40 px-5 py-3 text-sm font-semibold text-orange-500">{showAllCapabilities ? 'แสดงเฉพาะจุดเด่น' : 'ดูความสามารถทั้งหมด'}</button></div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className={`grid gap-8 rounded-[2rem] border p-7 sm:p-10 lg:grid-cols-[.8fr_1.2fr] lg:p-12 ${surface}`}>
          <div><div className="text-xs font-bold tracking-[.25em] text-orange-500">BUILT FOR HUMAN ACCOUNTABILITY</div><h2 className="mt-3 text-3xl font-bold">ตรวจทานได้ โดยไม่ยกอำนาจให้ AI</h2><p className={`mt-4 text-sm leading-7 ${muted}`}>ระบบสนับสนุนการตัดสินใจ: ไม่ถือว่าคำตอบจากโมเดลเป็นข้อเท็จจริงเอง และไม่สร้างความมั่นใจเชิงตัวเลขเมื่อไม่มีข้อมูลวัดผลรองรับ</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['หลักฐานมาก่อน', 'เชื่อมข้ออ้างกับหลักฐานเท่าที่มี และแสดงจุดที่ยังยืนยันไม่ได้'],
              ['ความไม่แน่นอนมีที่ยืน', 'แยกสิ่งที่รู้ สิ่งที่อนุมาน และข้อมูลที่ควรหาเพิ่ม'],
              ['คำแนะนำมีเงื่อนไข', 'เมื่อข้อมูลไม่พอ ให้ระบุสิ่งที่ต้องตรวจสอบก่อนเดินหน้าต่อ'],
              ['มนุษย์รับผิดชอบผล', 'ผู้ใช้และองค์กรเป็นผู้ทบทวน อนุมัติ และตัดสินใจขั้นสุดท้าย'],
            ].map(([title, text]) => <div key={title} className={`rounded-xl border p-4 ${secondarySurface}`}><div className="flex items-center gap-2 text-sm font-bold text-orange-500"><CheckCircle2 className="h-4 w-4" />{title}</div><p className={`mt-2 text-sm leading-6 ${muted}`}>{text}</p></div>)}
          </div>
        </div>
      </section>

      <section className={`border-y py-20 ${isLight ? 'border-slate-200 bg-white/40' : 'border-white/10 bg-white/[.015]'}`}>
        <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
          <div><div className="text-xs font-bold tracking-[.28em] text-orange-500">MODEL & DEPLOYMENT CHOICE</div><h2 className="mt-3 text-3xl font-bold">เพิ่ม governance ให้กับโมเดลที่คุณเลือก</h2><p className={`mt-4 leading-7 ${muted}`}>เชื่อมต่อผู้ให้บริการที่ระบบรองรับ ใช้ API key ของคุณเอง หรือใช้ Ollama ตามสิทธิ์และการตั้งค่า โดยค่าใช้โมเดล/API ภายนอกเป็นไปตามผู้ให้บริการนั้น</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['เลือก provider', 'DeepSeek, OpenAI, Anthropic, Google Gemini, Groq, OpenRouter, Mistral, Perplexity และ custom OpenAI-compatible endpoint'],
              ['ใช้โมเดลในเครื่อง', 'รองรับการตั้งค่า Ollama สำหรับโมเดล local หรือ private endpoint ตาม deployment'],
              ['ควบคุมการวิเคราะห์', 'เลือกโทนคำตอบ การค้นเว็บ และระดับ/รูปแบบการให้เหตุผลที่มีใน workspace'],
              ['กำหนดขอบเขตองค์กร', 'แพ็กเกจระดับสูงมี workspace, policy, SSO/SIEM/API entitlement ตามการเปิดใช้และการตั้งค่าจริง'],
            ].map(([title, text]) => <article key={title} className={`rounded-xl border p-5 ${surface}`}><div className="flex items-center gap-2 font-bold"><LockKeyhole className="h-4 w-4 text-orange-500" />{title}</div><p className={`mt-2 text-sm leading-6 ${muted}`}>{text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="max-w-3xl"><div className="text-xs font-bold tracking-[.28em] text-orange-500">FOR REAL DECISION WORK</div><h2 className="mt-3 text-3xl font-bold sm:text-4xl">ใช้กับเรื่องที่ต้องมีเหตุผลรองรับ</h2><p className={`mt-4 leading-7 ${muted}`}>ตัวอย่างโจทย์ที่นำมาวิเคราะห์ได้ ทั้งนี้คุณภาพผลลัพธ์ขึ้นอยู่กับข้อมูลและการตรวจทานของผู้ใช้</p></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['จัดซื้อและคัดเลือกผู้ขาย', 'เปรียบเทียบราคา เงื่อนไขบริการ ความเสี่ยง และต้นทุนที่ยังต้องขอเพิ่ม'],
            ['กลยุทธ์และการลงทุน', 'แจกแจงทางเลือก สมมติฐาน ตัวขับเคลื่อนผลลัพธ์ และข้อมูลที่ทำให้เปลี่ยนใจ'],
            ['นโยบายและความเสี่ยง', 'ทบทวนข้อเสนอ ผลกระทบ ผู้มีส่วนได้เสีย และความไม่แน่นอน'],
            ['ตรวจเอกสารและข้อเสนอ', 'สรุปประเด็นจากไฟล์ แล้วตรวจข้ออ้าง หลักฐาน และคำถามที่ยังค้าง'],
          ].map(([title, text]) => <article key={title} className={`rounded-2xl border p-5 ${surface}`}><h3 className="font-bold">{title}</h3><p className={`mt-2 text-sm leading-6 ${muted}`}>{text}</p></article>)}
        </div>
      </section>

      <section className={`border-y py-20 ${isLight ? 'border-slate-200 bg-white/40' : 'border-white/10 bg-white/[.015]'}`}>
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-6 md:grid-cols-[.8fr_1.2fr] md:items-end"><div><div className="text-xs font-bold tracking-[.28em] text-orange-500">TRACEABLE WORK</div><h2 className="mt-3 text-3xl font-bold">ทบทวนย้อนหลังได้ตามสิทธิ์ที่ใช้</h2></div><p className={`max-w-2xl leading-7 ${muted}`}>Decision Record และ audit trace ช่วยเก็บ identifiers กับสรุปข้อมูลกำกับการวิเคราะห์ มี integrity hash แบบ tamper-evident ตามขอบเขต runtime เพื่อช่วยตรวจพบการเปลี่ยนแปลงของ trace</p></div>
          <div className={`mt-7 flex items-start gap-3 rounded-xl border p-5 ${isLight ? 'border-amber-200 bg-amber-50' : 'border-amber-500/20 bg-amber-500/[.06]'}`}><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" /><p className={`text-sm leading-6 ${muted}`}>Trace ไม่ได้พิสูจน์ว่าข้อสรุปถูกต้อง และไม่ใช่ WORM storage, trusted timestamp หรือใบรับรองความปลอดภัยจากหน่วยงานภายนอก การเก็บข้อมูลและ integration ขึ้นอยู่กับแพ็กเกจและ deployment</p></div>
        </div>
      </section>

      <section id="plans" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="text-center"><div className="text-xs font-bold tracking-[.28em] text-orange-500">FIREKEEPER PLANS</div><h2 className="mt-3 text-3xl font-bold sm:text-4xl">เริ่มเล็ก แล้วขยายตาม workflow</h2><p className={`mx-auto mt-4 max-w-2xl ${muted}`}>ราคาและสิทธิ์หลักอ้างอิงจากแพ็กเกจในระบบ ค่า API ของผู้ให้บริการ AI ภายนอกไม่รวมในค่าบริการ</p></div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const id = plan.id as PlanId;
            const isFeatured = id === 'professional';
            const price = plan.monthlyPriceThb === null ? 'ติดต่อทีม' : plan.monthlyPriceThb === 0 ? 'ฟรี' : `${plan.monthlyPriceThb.toLocaleString('th-TH')} บาท/เดือน`;
            return (
              <article key={id} className={`relative flex flex-col rounded-2xl border p-6 ${isFeatured ? 'border-orange-500 bg-orange-500/[.08]' : surface}`}>
                {isFeatured && <span className="absolute right-5 top-5 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold text-black">สำหรับนักวิเคราะห์</span>}
                <h3 className="text-xl font-bold">{plan.name.replace('FIREKEEPER ', '')}</h3><div className="mt-4 text-2xl font-extrabold text-orange-500">{price}</div>
                <p className={`mt-2 min-h-12 text-sm ${muted}`}>{planAudience[id]}</p>
                <ul className="mt-5 space-y-3 text-sm">{planFeatures[id].map((feature) => <li key={feature} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" /><span>{feature}</span></li>)}</ul>
                <button type="button" onClick={onNavigatePlans || onEnter} className="mt-7 rounded-xl border border-orange-500/50 px-4 py-3 text-sm font-bold text-orange-500 transition-colors hover:bg-orange-500 hover:text-black">{id === 'free' ? 'เริ่มใช้ฟรี' : id === 'enterprise' ? 'คุยเรื่องการใช้งานองค์กร' : 'ดูแพ็กเกจและสมัคร'}</button>
              </article>
            );
          })}
        </div>
        <div className={`mx-auto mt-6 flex max-w-4xl items-start gap-3 rounded-xl border p-4 text-sm leading-6 ${surface} ${muted}`}><UsersRound className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" /><p>ต้องการประเมิน workflow จริงก่อนเลือกแพ็กเกจ? ดูรายละเอียด Governance Validation Program และ Pilot ในหน้าแพ็กเกจ</p></div>
      </section>

      <section className="fk-final mx-auto max-w-7xl px-5 pb-12 pt-16 text-center lg:px-8 lg:pb-14 lg:pt-20">
        <div className="text-xs font-semibold tracking-[.25em] text-amber-500">BRING ONE REAL DECISION</div>
        <h2 className="mt-6 text-3xl font-semibold leading-snug sm:text-5xl">มีเรื่องสำคัญที่ยังตัดสินใจยากไหม?</h2>
        <p className={`mx-auto mt-5 max-w-2xl leading-7 ${muted}`}>เริ่มจากหนึ่งคำถาม แนบข้อมูลที่มี แล้วดูว่าหลักฐาน ทางเลือก และสิ่งที่ยังต้องรู้พาคุณไปทางไหน</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><button type="button" onClick={onEnter} className="fk-primary inline-flex min-h-12 items-center gap-3 rounded-xl px-7 py-4 font-bold">เริ่มวิเคราะห์ฟรี <ArrowRight className="h-4 w-4" /></button><a href="#plans" className="fk-secondary inline-flex min-h-12 items-center gap-2 rounded-xl border px-6 py-4 font-medium">เลือกแพ็กเกจ <ArrowUpRight className="h-4 w-4" /></a></div>
        <p className={`mt-4 text-xs ${muted}`}>AI ช่วยวิเคราะห์ · คุณยังเป็นผู้ตัดสินใจ</p>
      </section>

      </>}

          <section aria-label="ความโปร่งใสและการจัดการข้อมูล" className={`mx-auto w-full max-w-7xl px-5 pb-12 pt-4 text-center lg:px-8 lg:pb-16`}>
            <div className={`mx-auto max-w-3xl border-t pt-8 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <h2 className="text-xl font-semibold sm:text-2xl">ความโปร่งใสและการจัดการข้อมูล</h2>
              <p className={`mx-auto mt-3 max-w-2xl text-sm leading-7 ${muted}`}>ผลวิเคราะห์และบันทึกการตรวจสอบไม่ใช่การรับรองว่าข้อสรุปถูกต้อง</p>
              <p className={`mx-auto mt-2 max-w-2xl text-sm leading-7 ${muted}`}>การจัดเก็บข้อมูลและการเชื่อมต่อผู้ให้บริการ AI ขึ้นอยู่กับการตั้งค่าและรูปแบบการใช้งาน โปรดตรวจสอบนโยบายก่อนส่งข้อมูลอ่อนไหว</p>
              <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm"><a className="text-orange-500 underline underline-offset-4" href="/privacy-terms">นโยบายข้อมูลและเงื่อนไข</a><a className="text-orange-500 underline underline-offset-4" href="/about">เกี่ยวกับ FIREKEEPER</a><a className="text-orange-500 underline underline-offset-4" href="https://github.com/punn-pca/firekeeper-core" target="_blank" rel="noreferrer">ตรวจสอบโค้ดบน GitHub</a></div>
            </div>
          </section>

      <footer className={`border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3"><Flame className="h-6 w-6 fill-orange-500 text-orange-500" /><div><div className="text-sm font-bold tracking-[.2em]">FIREKEEPER</div><div className={`text-xs ${muted}`}>AI Decision Quality & Governance</div></div></div>
          <div className={`flex flex-wrap gap-5 text-sm ${muted}`}><a href="/about">เกี่ยวกับผู้สร้าง</a><button type="button" onClick={onNavigateDocs}>เอกสารและ whitepaper</button><a href="https://github.com/punn-pca/firekeeper-core" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5"><Github className="h-4 w-4" />GitHub</a><button type="button" onClick={onNavigatePublication || onNavigateBooks} className="inline-flex items-center gap-1.5"><FileText className="h-4 w-4" />บทความและสิ่งพิมพ์</button></div>
        </div>
      </footer>
    </main>
  );
};
