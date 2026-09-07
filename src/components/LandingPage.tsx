import { motion } from 'motion/react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  Flame,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  UserRound,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LandingPageProps {
  onEnter: () => void;
  isLight?: boolean;
}

type FlowStep = {
  id: string;
  label: string;
  thai: string;
  detail: string;
  question: string;
};

const FLOW_STEPS: FlowStep[] = [
  { id: 'input', label: 'INPUT', thai: 'รับโจทย์', detail: 'เริ่มจากคำถามหรือปัญหาที่ต้องการคำตอบ โดยไม่รีบกระโดดไปหาข้อสรุป', question: 'กำลังถามอะไร และต้องการตัดสินใจเรื่องไหน?' },
  { id: 'context', label: 'CONTEXT', thai: 'เข้าใจบริบท', detail: 'แยกสิ่งที่สำคัญ เงื่อนไข และบริบทที่อาจเปลี่ยนความหมายของคำตอบ', question: 'อะไรคือบริบทที่ต้องรู้ก่อนจึงจะตอบได้อย่างมีความหมาย?' },
  { id: 'evidence', label: 'EVIDENCE', thai: 'ตรวจสอบหลักฐาน', detail: 'มองหาสิ่งที่รองรับข้อกล่าวอ้าง และแยกสิ่งที่รู้ อนุมาน และยังไม่แน่ใจออกจากกัน', question: 'อะไรสนับสนุนข้อสรุปนี้ และอะไรยังไม่มีหลักฐานเพียงพอ?' },
  { id: 'reasoning', label: 'REASONING', thai: 'วิเคราะห์เหตุผล', detail: 'ตรวจสายเหตุผล มองทางเลือก และตั้งคำถามกับข้อสรุปที่ดูเหมือนถูกต้องเกินไป', question: 'มีเหตุผลอื่นหรือคำอธิบายอื่นที่ควรพิจารณาหรือไม่?' },
  { id: 'verification', label: 'VERIFICATION', thai: 'สอบทาน', detail: 'ทบทวนความสอดคล้อง จุดเปราะบาง และระดับความมั่นใจก่อนนำผลไปใช้', question: 'มีอะไรที่ควรตรวจอีกครั้งก่อนตัดสินใจ?' },
  { id: 'decision', label: 'HUMAN DECISION', thai: 'มนุษย์ตัดสินใจ', detail: 'ระบบช่วยจัดระเบียบและตรวจสอบการคิด แต่การตัดสินใจขั้นสุดท้ายยังเป็นของมนุษย์', question: 'เมื่อเห็นข้อมูลทั้งหมดแล้ว มนุษย์จะเลือกอย่างไร?' },
];

const SIGNALS = ['CONTEXT', 'EVIDENCE', 'REASONING', 'VERIFICATION'];

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, isLight: propIsLight }) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = propIsLight !== undefined ? propIsLight : theme === 'light';
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);
  const [hoveredSignal, setHoveredSignal] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % FLOW_STEPS.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, []);

  const activeStep = useMemo(() => FLOW_STEPS[activeIndex], [activeIndex]);

  const handleEnter = () => {
    setHasEntered(true);
    window.setTimeout(onEnter, 220);
  };

  const bg = isLight ? 'bg-[#f6f6f3] text-slate-950' : 'bg-[#040404] text-white';
  const muted = isLight ? 'text-slate-500' : 'text-white/48';
  const faint = isLight ? 'text-slate-400' : 'text-white/30';
  const border = isLight ? 'border-slate-200' : 'border-white/[0.09]';
  const panel = isLight ? 'bg-white/75' : 'bg-white/[0.025]';

  return (
    <main className={`relative min-h-screen overflow-hidden ${bg} transition-colors duration-500`}>
      <style>{`
        @keyframes fk-pulse { 0%,100% { opacity:.22; transform:scale(.9); } 50% { opacity:1; transform:scale(1); } }
        @keyframes fk-pulse-ring { 0% { transform:scale(.72); opacity:.65; } 100% { transform:scale(1.35); opacity:0; } }
        @keyframes fk-scan { 0% { transform:translateX(-150%); opacity:0; } 18% { opacity:.7; } 82% { opacity:.7; } 100% { transform:translateX(600%); opacity:0; } }
        @keyframes fk-flow { 0% { transform:translateX(-120%); opacity:0; } 15% { opacity:1; } 85% { opacity:1; } 100% { transform:translateX(720%); opacity:0; } }
        @keyframes fk-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-7px); } }
        @keyframes fk-spin { to { transform:rotate(360deg); } }
        @keyframes fk-rise { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fk-pulse { animation:fk-pulse 2.2s ease-in-out infinite; }
        .fk-pulse-ring { animation:fk-pulse-ring 2.4s ease-out infinite; }
        .fk-scan { animation:fk-scan 4.6s ease-in-out infinite; }
        .fk-flow { animation:fk-flow 3.2s ease-in-out infinite; }
        .fk-float { animation:fk-float 4s ease-in-out infinite; }
        .fk-spin { animation:fk-spin 18s linear infinite; }
        .fk-rise { animation:fk-rise .55s ease-out both; }
        .fk-grid { background-image: linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px); background-size:32px 32px; }
        @media (prefers-reduced-motion: reduce) {
          .fk-pulse,.fk-pulse-ring,.fk-scan,.fk-flow,.fk-float,.fk-spin,.fk-rise { animation:none !important; }
          html { scroll-behavior:auto !important; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="fk-grid absolute inset-0 opacity-20" />
        <div className={`absolute left-1/2 top-[-15%] h-[65vh] w-[65vw] -translate-x-1/2 rounded-full blur-3xl ${isLight ? 'bg-orange-400/[0.09]' : 'bg-orange-500/[0.07]'}`} />
        <div className={`absolute inset-x-0 top-[44%] h-px ${isLight ? 'bg-slate-900/[0.045]' : 'bg-white/[0.035]'}`} />
        <div className={`absolute inset-y-0 left-1/2 w-px ${isLight ? 'bg-slate-900/[0.035]' : 'bg-white/[0.025]'}`} />
      </div>

      <header className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <div className={`relative flex h-9 w-9 items-center justify-center rounded-lg border ${border} bg-orange-500/[0.08]`}>
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="absolute inset-0 rounded-lg border border-orange-500/20 fk-pulse-ring" />
          </div>
          <div>
            <div className="font-mono text-xs font-semibold tracking-[0.22em]">FIRE KEEPER</div>
            <div className={`mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] ${muted}`}>Decision Intelligence</div>
          </div>
        </div>
        <button type="button" onClick={toggleTheme} aria-label="Toggle theme" className={`rounded-lg border p-2 transition-all hover:border-orange-500/30 ${border} ${panel}`}>
          {isLight ? <Moon className="h-4 w-4 text-slate-600" /> : <Sun className="h-4 w-4 text-white/65" />}
        </button>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 pt-8 sm:px-8 lg:px-12">
        <div className="grid min-h-[calc(100vh-100px)] items-center gap-16 lg:grid-cols-[.86fr_1.14fr] lg:gap-20">
          <div className="max-w-2xl">
            <div className={`mb-7 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] ${border} ${muted}`}>
              <span className="relative h-1.5 w-1.5 rounded-full bg-orange-500">
                <span className="absolute inset-[-3px] rounded-full border border-orange-500/40 fk-pulse-ring" />
              </span>
              Human decision authority
            </div>

            <h1 className="text-5xl font-semibold leading-[.9] tracking-[-0.065em] sm:text-7xl lg:text-[6.1rem]">
              FIRE<span className="text-orange-500"> KEEPER</span>
            </h1>

            <p className={`mt-7 max-w-xl text-xl leading-relaxed sm:text-2xl ${muted}`}>
              ระบบช่วยให้การคิดเป็นระบบมากขึ้น<br className="hidden sm:block" />
              โดยไม่แย่งสิทธิ์ในการตัดสินใจจากมนุษย์
            </p>

            <div className={`mt-8 border-l-2 border-orange-500/60 pl-4 text-sm leading-7 sm:text-base ${muted}`}>
              <p>เมื่อคำถามซับซ้อน คำตอบที่เร็วที่สุดอาจไม่ใช่คำตอบที่ดีที่สุด</p>
              <p>FIRE KEEPER ช่วยแยกบริบท หลักฐาน เหตุผล และจุดที่ควรสอบทาน</p>
              <p>ก่อนที่มนุษย์จะตัดสินใจว่าจะเชื่อหรือทำอะไรต่อ</p>
            </div>

            <div className="mt-9 grid max-w-xl grid-cols-3 gap-2 sm:gap-3">
              {[
                ['01', 'เข้าใจ', 'Context'],
                ['02', 'ตรวจสอบ', 'Evidence'],
                ['03', 'ตัดสินใจ', 'Human'],
              ].map(([num, thai, english]) => (
                <div key={num} className={`group rounded-xl border p-3 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/30 ${border} ${panel}`}>
                  <div className="font-mono text-[9px] text-orange-500">{num}</div>
                  <div className="mt-2 text-sm font-medium">{thai}</div>
                  <div className={`mt-0.5 font-mono text-[9px] ${faint}`}>{english}</div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button type="button" onClick={handleEnter} className="group inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-black transition-all hover:bg-orange-400 hover:shadow-[0_0_36px_rgba(249,115,22,.2)]">
                เริ่มใช้งาน FIRE KEEPER
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <a href="#intelligence" className={`inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm transition-all hover:border-orange-500/30 hover:text-orange-500 ${border} ${muted}`}>
                ดูว่าระบบคิดอย่างไร
                <ArrowDown className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className={`relative min-h-[500px] overflow-hidden rounded-3xl border ${border} ${panel} p-4 sm:p-6`}>
            <div className="fk-grid pointer-events-none absolute inset-0 opacity-40" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/[0.08] fk-spin" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/[0.12]" />

            <div className="relative z-10 flex items-center justify-between border-b pb-4 ${border}">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em]">Decision Intelligence</div>
                <div className={`mt-1 text-xs ${muted}`}>จากคำถาม → สู่การตัดสินใจที่ตรวจสอบได้</div>
              </div>
              <div className={`flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[9px] ${border} ${muted}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 fk-pulse" />
                ACTIVE
              </div>
            </div>

            <div className="relative z-10 mt-7 grid gap-3">
              {FLOW_STEPS.map((step, index) => {
                const active = index === activeIndex;
                const completed = index < activeIndex;
                return (
                  <motion.button
                    key={step.id}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                    onClick={() => setActiveIndex(index)}
                    whileHover={{ scale: 1.02 }}
                    animate={active ? {
                      scale: 1.02,
                      boxShadow: ["0 0 0 0 rgba(249, 115, 22, 0.4)", "0 0 0 6px rgba(249, 115, 22, 0)"]
                    } : { scale: 1, boxShadow: "none" }}
                    transition={{
                      boxShadow: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                      scale: { duration: 0.2 }
                    }}
                    className={`group relative flex w-full items-center gap-4 rounded-2xl border p-3.5 text-left transition-all duration-500 sm:p-4 ${active ? 'translate-x-1 border-orange-500/45 bg-orange-500/[0.08]' : `${border} ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.035]'}`}`}
                  >
                    <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-mono text-[10px] transition-all duration-500 ${active ? 'border-orange-500/55 bg-orange-500/[0.08] text-orange-500' : `${border} ${muted}`}`}>
                      {completed ? <CheckCircle2 className="h-4 w-4 text-orange-500" /> : String(index + 1).padStart(2, '0')}
                      {active && <span className="absolute inset-[-5px] rounded-xl border border-orange-500/20 fk-pulse-ring" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`font-mono text-xs tracking-[0.13em] transition-colors ${active ? 'text-orange-500' : ''}`}>{step.label}</div>
                      <div className={`mt-1 text-sm ${active ? '' : muted}`}>{step.thai}</div>
                    </div>
                    <ArrowRight className={`h-4 w-4 shrink-0 transition-all duration-300 ${active ? 'translate-x-0 text-orange-500 opacity-100' : '-translate-x-1 opacity-20'}`} />
                    {active && <div className="absolute bottom-0 left-0 top-0 w-px rounded-full bg-orange-500 fk-pulse" />}
                  </motion.button>
                );
              })}
            </div>

            <div className={`relative z-10 mt-4 overflow-hidden rounded-2xl border p-4 sm:p-5 ${border}`}>
              <div className="fk-scan pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-orange-500/15 to-transparent" />
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-orange-500/10 p-2"><ShieldCheck className="h-4 w-4 text-orange-500" /></div>
                <div className="min-w-0">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-orange-500">{activeStep.label}</div>
                  <p key={activeStep.id} className={`mt-1 text-sm leading-6 ${muted} fk-rise`}>{activeStep.detail}</p>
                  <p key={`${activeStep.id}-q`} className={`mt-2 text-xs italic leading-5 ${faint} fk-rise`}>“{activeStep.question}”</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="intelligence" className="scroll-mt-10 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange-500">HOW IT WORKS</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">ไม่ใช่แค่ตอบคำถาม<br />แต่ช่วยตรวจสอบการคิด</h2>
            <p className={`mx-auto mt-5 max-w-2xl text-base leading-7 sm:text-lg ${muted}`}>
              FIRE KEEPER ถูกออกแบบมาเพื่อรับมือกับคำถามที่คำตอบไม่ได้มีแค่ “ถูกหรือผิด” แต่ต้องพิจารณาบริบท หลักฐาน ความไม่แน่นอน และผลกระทบของการตัดสินใจด้วย
            </p>
          </div>

          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className={`absolute left-[8%] right-[8%] top-1/2 hidden h-px md:block ${isLight ? 'bg-slate-200' : 'bg-white/[0.08]'}`} />
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { icon: Brain, title: 'เข้าใจบริบท', text: 'คำถามเดียวกันอาจมีคำตอบต่างกัน เมื่อบริบทและข้อจำกัดต่างกัน' },
                { icon: Search, title: 'ตรวจหลักฐาน', text: 'ไม่ให้ข้อสรุปดูหนักแน่นเกินกว่าหลักฐานที่มีอยู่จริง' },
                { icon: ShieldCheck, title: 'ท้าทายข้อสรุป', text: 'มองจุดเปราะบาง ทางเลือก และสิ่งที่อาจถูกมองข้าม' },
                { icon: UserRound, title: 'คืนอำนาจให้คน', text: 'ระบบช่วยวิเคราะห์ แต่ไม่เปลี่ยนการวิเคราะห์ให้กลายเป็นคำสั่ง' },
              ].map(({ icon: Icon, title, text }, index) => (
                <div key={title} className={`relative rounded-2xl border p-5 transition-all duration-500 hover:-translate-y-2 hover:border-orange-500/30 ${border} ${panel}`}>
                  <div className="mb-5 flex items-center justify-between">
                    <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.07] p-2.5"><Icon className="h-4 w-4 text-orange-500" /></div>
                    <span className={`font-mono text-[9px] ${faint}`}>0{index + 1}</span>
                  </div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className={`mt-2 text-xs leading-6 ${muted}`}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className={`relative overflow-hidden rounded-3xl border ${border} ${panel} px-5 py-12 sm:px-10 sm:py-16`}>
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/[0.07] blur-3xl" />
          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-orange-500">A DIFFERENT APPROACH</div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">AI ไม่จำเป็นต้องเป็น<br />คนตัดสินใจแทนคุณ</h2>
              <p className={`mt-5 max-w-xl text-sm leading-7 sm:text-base ${muted}`}>
                ในสถานการณ์ที่มีความเสี่ยงหรือความไม่แน่นอน สิ่งสำคัญไม่ใช่แค่การได้คำตอบ แต่คือการรู้ว่าคำตอบนั้นตั้งอยู่บนอะไร มีจุดอ่อนตรงไหน และยังมีอะไรที่เราไม่รู้
              </p>
            </div>

            <div className="relative">
              <div className={`rounded-2xl border p-5 ${border}`}>
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[9px] tracking-[0.18em]">SIGNAL MONITOR</div>
                  <Sparkles className="h-4 w-4 text-orange-500" />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {SIGNALS.map((signal, index) => {
                    const active = hoveredSignal === signal || (hoveredSignal === null && index === activeIndex % SIGNALS.length);
                    return (
                      <button key={signal} type="button" onMouseEnter={() => setHoveredSignal(signal)} onMouseLeave={() => setHoveredSignal(null)} onFocus={() => setHoveredSignal(signal)} className={`relative overflow-hidden rounded-xl border px-3 py-4 text-left transition-all duration-300 ${active ? 'border-orange-500/40 bg-orange-500/[0.08]' : border}`}>
                        {active && <span className="fk-flow pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />}
                        <div className="relative flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-orange-500 fk-pulse' : isLight ? 'bg-slate-300' : 'bg-white/20'}`} />
                          <span className="font-mono text-[9px] tracking-[0.14em]">{signal}</span>
                        </div>
                        <div className={`relative mt-2 text-[10px] leading-5 ${muted}`}>{active ? 'กำลังถูกนำมาพิจารณา' : 'พร้อมสำหรับการตรวจสอบ'}</div>
                      </button>
                    );
                  })}
                </div>
                <div className={`mt-4 flex items-center gap-3 rounded-xl border p-3 ${border}`}>
                  <LockKeyhole className="h-4 w-4 shrink-0 text-orange-500" />
                  <p className={`text-[11px] leading-5 ${muted}`}>การวิเคราะห์ไม่ใช่คำสั่งสุดท้าย — มนุษย์ยังเป็นผู้ถือสิทธิ์ในการตัดสินใจ</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 text-center sm:py-32">
          <div className="mx-auto max-w-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/[0.07] fk-float">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <h2 className="mt-7 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">ให้ AI ช่วยคิด<br />แต่ให้มนุษย์เป็นคนตัดสินใจ</h2>
            <p className={`mx-auto mt-5 max-w-xl text-sm leading-7 sm:text-base ${muted}`}>
              เริ่มต้นจากคำถามของคุณ แล้วให้ FIRE KEEPER ช่วยทำให้กระบวนการคิดชัดขึ้น ตรวจสอบได้ขึ้น และพร้อมสำหรับการตัดสินใจของคุณ
            </p>
            <button type="button" onClick={handleEnter} className="group mt-9 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3.5 text-sm font-semibold text-black transition-all hover:bg-orange-400 hover:shadow-[0_0_40px_rgba(249,115,22,.2)]">
              เริ่มใช้งาน FIRE KEEPER
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </section>

        <footer className={`border-t pt-7 ${border}`}>
          <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div className={`font-mono text-[9px] tracking-[0.18em] ${faint}`}>FIRE KEEPER · DECISION INTELLIGENCE</div>
            <div className={`flex items-center justify-center gap-2 font-mono text-[9px] ${faint}`}><Check className="h-3 w-3 text-orange-500" /> HUMAN DECISION AUTHORITY</div>
          </div>
        </footer>
      </section>

      <div className={`pointer-events-none fixed inset-x-0 bottom-0 h-28 bg-gradient-to-t ${isLight ? 'from-[#f6f6f3]' : 'from-[#040404]'} to-transparent`} />
      {hasEntered && <div className="pointer-events-none fixed inset-0 z-50 bg-orange-500/[0.05] transition-opacity" />}
    </main>
  );
};
