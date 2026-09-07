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
  {
    id: 'input',
    label: 'INPUT',
    thai: 'รับโจทย์',
    detail: 'เริ่มจากคำถามหรือปัญหาที่ต้องการคำตอบ โดยไม่รีบกระโดดไปหาข้อสรุป',
    question: 'กำลังถามอะไร และต้องการตัดสินใจเรื่องไหน?',
  },
  {
    id: 'context',
    label: 'CONTEXT',
    thai: 'เข้าใจบริบท',
    detail: 'แยกสิ่งที่สำคัญ เงื่อนไข และบริบทที่อาจเปลี่ยนความหมายของคำตอบ',
    question: 'อะไรคือบริบทที่ต้องรู้ก่อนจึงจะตอบได้อย่างมีความหมาย?',
  },
  {
    id: 'evidence',
    label: 'EVIDENCE',
    thai: 'ตรวจสอบหลักฐาน',
    detail: 'มองหาสิ่งที่รองรับข้อกล่าวอ้าง และแยกสิ่งที่รู้ อนุมาน และยังไม่แน่ใจออกจากกัน',
    question: 'อะไรสนับสนุนข้อสรุปนี้ และอะไรยังไม่มีหลักฐานเพียงพอ?',
  },
  {
    id: 'reasoning',
    label: 'REASONING',
    thai: 'วิเคราะห์เหตุผล',
    detail: 'ตรวจสายเหตุผล มองทางเลือก และตั้งคำถามกับข้อสรุปที่ดูเหมือนถูกต้องเกินไป',
    question: 'มีเหตุผลอื่นหรือคำอธิบายอื่นที่ควรพิจารณาหรือไม่?',
  },
  {
    id: 'verification',
    label: 'VERIFICATION',
    thai: 'สอบทาน',
    detail: 'ทบทวนความสอดคล้อง จุดเปราะบาง และระดับความมั่นใจก่อนนำผลไปใช้',
    question: 'มีอะไรที่ควรตรวจอีกครั้งก่อนตัดสินใจ?',
  },
  {
    id: 'decision',
    label: 'HUMAN DECISION',
    thai: 'มนุษย์ตัดสินใจ',
    detail: 'ระบบช่วยจัดระเบียบและตรวจสอบการคิด แต่การตัดสินใจขั้นสุดท้ายยังเป็นของมนุษย์',
    question: 'เมื่อเห็นข้อมูลทั้งหมดแล้ว มนุษย์จะเลือกอย่างไร?',
  },
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
  const muted = isLight ? 'text-slate-600' : 'text-white/58';
  const faint = isLight ? 'text-slate-500' : 'text-white/38';
  const border = isLight ? 'border-slate-200' : 'border-white/[0.10]';
  const panel = isLight ? 'bg-white/80' : 'bg-white/[0.035]';

  return (
    <main className={`relative min-h-screen overflow-hidden ${bg} transition-colors duration-500`}>
      <style>{`
        @keyframes fk-pulse { 0%,100% { opacity:.35; transform:scale(.92); } 50% { opacity:1; transform:scale(1); } }
        @keyframes fk-ring { 0% { transform:scale(.65); opacity:.65; } 100% { transform:scale(1.45); opacity:0; } }
        @keyframes fk-scan { 0% { transform:translateX(-140%); opacity:0; } 15% { opacity:.8; } 85% { opacity:.8; } 100% { transform:translateX(540%); opacity:0; } }
        @keyframes fk-flow { 0% { transform:translateX(-120%); opacity:0; } 15% { opacity:1; } 85% { opacity:1; } 100% { transform:translateX(420%); opacity:0; } }
        @keyframes fk-float { 0%,100% { transform:translateY(0) rotate(-1deg); } 50% { transform:translateY(-6px) rotate(1deg); } }
        @keyframes fk-fire { 0%,100% { transform:scaleY(.94) rotate(-2deg); filter:drop-shadow(0 0 12px rgba(249,115,22,.35)); } 50% { transform:scaleY(1.06) rotate(2deg); filter:drop-shadow(0 0 28px rgba(249,115,22,.7)); } }
        @keyframes fk-rise { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fk-spin { to { transform:rotate(360deg); } }
        .fk-pulse { animation:fk-pulse 2s ease-in-out infinite; }
        .fk-ring { animation:fk-ring 2.4s ease-out infinite; }
        .fk-scan { animation:fk-scan 4.8s ease-in-out infinite; }
        .fk-flow { animation:fk-flow 3s ease-in-out infinite; }
        .fk-float { animation:fk-float 4s ease-in-out infinite; }
        .fk-fire { animation:fk-fire 1.8s ease-in-out infinite; transform-origin:50% 100%; }
        .fk-rise { animation:fk-rise .45s ease-out both; }
        .fk-spin { animation:fk-spin 20s linear infinite; }
        .fk-grid { background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px); background-size:32px 32px; }
        @media (prefers-reduced-motion:reduce) {
          .fk-pulse,.fk-ring,.fk-scan,.fk-flow,.fk-float,.fk-fire,.fk-rise,.fk-spin { animation:none !important; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="fk-grid absolute inset-0 opacity-20" />
        <div className={`absolute left-1/2 top-[-18%] h-[58vh] w-[58vw] -translate-x-1/2 rounded-full blur-3xl ${isLight ? 'bg-orange-400/[0.10]' : 'bg-orange-500/[0.09]'}`} />
        <div className={`absolute left-1/2 top-[46%] h-[30vh] w-[45vw] -translate-x-1/2 rounded-full blur-3xl ${isLight ? 'bg-orange-400/[0.035]' : 'bg-orange-500/[0.025]'}`} />
        <div className={`absolute inset-y-0 left-1/2 w-px ${isLight ? 'bg-slate-900/[0.035]' : 'bg-white/[0.025]'}`} />
      </div>

      <header className="relative z-20 flex items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <div className={`relative flex h-9 w-9 items-center justify-center rounded-xl border ${border} bg-orange-500/[0.08]`}>
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="absolute inset-0 rounded-xl border border-orange-500/25 fk-ring" />
          </div>
          <div>
            <div className="font-mono text-sm font-semibold tracking-[0.18em]">FIRE KEEPER</div>
            <div className={`mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] ${faint}`}>Decision Intelligence</div>
          </div>
        </div>
        <button type="button" onClick={toggleTheme} aria-label="Toggle theme" className={`rounded-lg border p-2 ${border} ${panel} transition-colors hover:border-orange-500/35`}>
          {isLight ? <Moon className="h-4 w-4 text-slate-600" /> : <Sun className="h-4 w-4 text-white/70" />}
        </button>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-14 pt-4 sm:px-8 sm:pt-8 lg:px-12">
        <div className="grid min-h-[calc(100vh-88px)] items-center gap-10 lg:grid-cols-[.88fr_1.12fr] lg:gap-14">
          <div className="max-w-2xl">
            <div className={`mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] ${border} ${muted}`}>
              <span className="relative h-1.5 w-1.5 rounded-full bg-orange-500">
                <span className="absolute inset-[-3px] rounded-full border border-orange-500/45 fk-ring" />
              </span>
              Human decision authority
            </div>

            <div className="relative inline-block">
              <div className="pointer-events-none absolute -inset-x-6 -inset-y-8 rounded-full bg-orange-500/[0.08] blur-2xl" />
              <h1 className="relative text-5xl font-semibold leading-[.9] tracking-[-0.06em] sm:text-7xl lg:text-[5.8rem]">
                FIRE<span className="text-orange-500"> KEEPER</span>
              </h1>
            </div>

            <p className={`mt-6 max-w-xl text-xl leading-8 sm:text-2xl sm:leading-9 ${muted}`}>
              ระบบช่วยให้การคิดเป็นระบบมากขึ้น
              <br className="hidden sm:block" />
              โดยไม่แย่งสิทธิ์ในการตัดสินใจจากมนุษย์
            </p>

            <div className={`mt-6 border-l-2 border-orange-500/70 pl-4 text-base leading-7 sm:text-lg sm:leading-8 ${muted}`}>
              <p>เมื่อคำถามซับซ้อน คำตอบที่เร็วที่สุดอาจไม่ใช่คำตอบที่ดีที่สุด</p>
              <p>FIRE KEEPER ช่วยแยกบริบท หลักฐาน เหตุผล และจุดที่ควรสอบทาน</p>
            </div>

            <div className="mt-7 grid max-w-xl grid-cols-3 gap-2 sm:gap-3">
              {[
                ['01', 'เข้าใจ', 'Context'],
                ['02', 'ตรวจสอบ', 'Evidence'],
                ['03', 'ตัดสินใจ', 'Human'],
              ].map(([num, thai, english]) => (
                <div key={num} className={`rounded-xl border p-3.5 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/35 ${border} ${panel}`}>
                  <div className="font-mono text-[10px] text-orange-500">{num}</div>
                  <div className="mt-1.5 text-base font-semibold">{thai}</div>
                  <div className={`mt-0.5 font-mono text-[10px] ${faint}`}>{english}</div>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button type="button" onClick={handleEnter} className="group inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-3 text-base font-semibold text-black transition-all hover:bg-orange-400 hover:shadow-[0_0_42px_rgba(249,115,22,.24)]">
                เริ่มใช้งาน FIRE KEEPER
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <a href="#intelligence" className={`inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-base ${border} ${muted} transition-all hover:border-orange-500/35 hover:text-orange-500`}>
                ดูว่าระบบคิดอย่างไร
                <ArrowDown className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className={`relative overflow-hidden rounded-3xl border ${border} ${panel} p-4 shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:p-5`}>
            <div className="fk-grid pointer-events-none absolute inset-0 opacity-35" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/[0.09] fk-spin" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/[0.14]" />

            <div className={`relative z-10 flex items-center justify-between border-b pb-3 ${border}`}>
              <div>
                <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">Decision Intelligence</div>
                <div className={`mt-1 text-sm ${muted}`}>จากคำถาม → สู่การตัดสินใจที่ตรวจสอบได้</div>
              </div>
              <div className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 font-mono text-[10px] ${border} ${muted}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 fk-pulse" />
                ACTIVE
              </div>
            </div>

            <div className="relative z-10 mt-4 grid gap-2">
              {FLOW_STEPS.map((step, index) => {
                const active = index === activeIndex;
                const completed = index < activeIndex;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                    onClick={() => setActiveIndex(index)}
                    className={`group relative flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-300 sm:p-3.5 ${active ? 'translate-x-1 border-orange-500/50 bg-orange-500/[0.09] shadow-[0_0_24px_rgba(249,115,22,.08)]' : `${border} ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.035]'}`}`}
                  >
                    <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-mono text-[10px] transition-all ${active ? 'border-orange-500/55 bg-orange-500/[0.09] text-orange-500' : `${border} ${muted}`}`}>
                      {completed ? <CheckCircle2 className="h-4 w-4 text-orange-500" /> : String(index + 1).padStart(2, '0')}
                      {active && <span className="absolute inset-[-4px] rounded-lg border border-orange-500/20 fk-ring" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`font-mono text-sm font-semibold tracking-[0.1em] ${active ? 'text-orange-500' : ''}`}>{step.label}</div>
                      <div className={`mt-0.5 text-sm ${active ? '' : muted}`}>{step.thai}</div>
                    </div>
                    <ArrowRight className={`h-4 w-4 shrink-0 transition-all ${active ? 'text-orange-500' : 'opacity-20'}`} />
                    {active && <div className="absolute bottom-0 left-0 top-0 w-0.5 rounded-full bg-orange-500 fk-pulse" />}
                  </button>
                );
              })}
            </div>

            <div className={`relative z-10 mt-3 overflow-hidden rounded-xl border p-3.5 sm:p-4 ${border}`}>
              <div className="fk-scan pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-orange-500/15 to-transparent" />
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-orange-500/10 p-2"><ShieldCheck className="h-4 w-4 text-orange-500" /></div>
                <div className="min-w-0">
                  <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-500">{activeStep.label}</div>
                  <p key={activeStep.id} className={`mt-1 text-sm leading-6 ${muted} fk-rise`}>{activeStep.detail}</p>
                  <p key={`${activeStep.id}-q`} className={`mt-1.5 text-sm italic leading-6 ${faint} fk-rise`}>“{activeStep.question}”</p>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-5 right-5 opacity-70">
              <div className="relative flex h-16 w-16 items-end justify-center">
                <div className="absolute bottom-0 h-12 w-9 rounded-[55%_45%_55%_45%] bg-orange-500/20 blur-md fk-fire" />
                <Flame className="relative h-12 w-12 text-orange-500 fk-fire" fill="currentColor" />
              </div>
            </div>
          </div>
        </div>

        <div id="intelligence" className="scroll-mt-8 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-500">HOW IT WORKS</div>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">ไม่ใช่แค่ตอบคำถาม<br />แต่ช่วยตรวจสอบการคิด</h2>
            <p className={`mx-auto mt-4 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8 ${muted}`}>
              FIRE KEEPER ช่วยพิจารณาบริบท หลักฐาน ความไม่แน่นอน และผลกระทบ ก่อนส่งผลกลับมาให้มนุษย์ตัดสินใจ
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-3 md:grid-cols-4">
            {[
              { icon: Brain, title: 'เข้าใจบริบท', text: 'คำถามเดียวกันอาจมีคำตอบต่างกัน เมื่อบริบทต่างกัน' },
              { icon: Search, title: 'ตรวจหลักฐาน', text: 'ไม่ให้ข้อสรุปหนักแน่นเกินกว่าหลักฐานที่มี' },
              { icon: ShieldCheck, title: 'ท้าทายข้อสรุป', text: 'มองจุดเปราะบาง ทางเลือก และสิ่งที่อาจถูกมองข้าม' },
              { icon: UserRound, title: 'คืนอำนาจให้คน', text: 'ระบบช่วยวิเคราะห์ แต่ไม่เปลี่ยนผลวิเคราะห์เป็นคำสั่ง' },
            ].map(({ icon: Icon, title, text }, index) => (
              <div key={title} className={`rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/35 ${border} ${panel}`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/[0.07] p-2.5"><Icon className="h-4 w-4 text-orange-500" /></div>
                  <span className={`font-mono text-[10px] ${faint}`}>0{index + 1}</span>
                </div>
                <h3 className="text-base font-semibold">{title}</h3>
                <p className={`mt-2 text-sm leading-6 ${muted}`}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        <section className={`relative overflow-hidden rounded-3xl border ${border} ${panel} px-5 py-10 sm:px-8 sm:py-12`}>
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/[0.08] blur-3xl" />
          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-500">A DIFFERENT APPROACH</div>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">AI ไม่จำเป็นต้องเป็น<br />คนตัดสินใจแทนคุณ</h2>
              <p className={`mt-4 max-w-xl text-base leading-7 sm:text-lg sm:leading-8 ${muted}`}>
                สิ่งสำคัญไม่ใช่แค่การได้คำตอบ แต่คือการรู้ว่าคำตอบนั้นตั้งอยู่บนอะไร มีจุดอ่อนตรงไหน และยังมีอะไรที่เราไม่รู้
              </p>
            </div>

            <div className={`rounded-2xl border p-4 sm:p-5 ${border}`}>
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] font-semibold tracking-[0.18em]">SIGNAL MONITOR</div>
                <Sparkles className="h-4 w-4 text-orange-500" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {SIGNALS.map((signal, index) => {
                  const active = hoveredSignal === signal || (hoveredSignal === null && index === activeIndex % SIGNALS.length);
                  return (
                    <button
                      key={signal}
                      type="button"
                      onMouseEnter={() => setHoveredSignal(signal)}
                      onMouseLeave={() => setHoveredSignal(null)}
                      onFocus={() => setHoveredSignal(signal)}
                      className={`relative overflow-hidden rounded-xl border px-3 py-3.5 text-left transition-all ${active ? 'border-orange-500/40 bg-orange-500/[0.08]' : border}`}
                    >
                      {active && <span className="fk-flow pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />}
                      <div className="relative flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-orange-500 fk-pulse' : isLight ? 'bg-slate-300' : 'bg-white/20'}`} />
                        <span className="font-mono text-[10px] font-semibold tracking-[0.12em]">{signal}</span>
                      </div>
                      <div className={`relative mt-1 text-sm ${muted}`}>{active ? 'กำลังพิจารณา' : 'พร้อมตรวจสอบ'}</div>
                    </button>
                  );
                })}
              </div>
              <div className={`mt-2 flex items-center gap-2 rounded-xl border px-3 py-2.5 ${border}`}>
                <LockKeyhole className="h-4 w-4 shrink-0 text-orange-500" />
                <p className={`text-sm leading-6 ${muted}`}>การวิเคราะห์ไม่ใช่คำสั่งสุดท้าย — มนุษย์ยังเป็นผู้ถือสิทธิ์ในการตัดสินใจ</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 text-center sm:py-20">
          <div className="mx-auto max-w-2xl">
            <div className="relative mx-auto flex h-16 w-16 items-end justify-center rounded-2xl border border-orange-500/25 bg-orange-500/[0.07] fk-float">
              <div className="absolute bottom-2 h-10 w-8 rounded-full bg-orange-500/25 blur-md fk-fire" />
              <Flame className="relative mb-2 h-9 w-9 text-orange-500 fk-fire" fill="currentColor" />
            </div>
            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">ให้ AI ช่วยคิด<br />แต่ให้มนุษย์เป็นคนตัดสินใจ</h2>
            <p className={`mx-auto mt-4 max-w-xl text-base leading-7 sm:text-lg sm:leading-8 ${muted}`}>
              เริ่มต้นจากคำถามของคุณ แล้วให้ FIRE KEEPER ช่วยทำให้กระบวนการคิดชัดขึ้น ตรวจสอบได้ขึ้น และพร้อมสำหรับการตัดสินใจของคุณ
            </p>
            <button type="button" onClick={handleEnter} className="group mt-7 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3.5 text-base font-semibold text-black transition-all hover:bg-orange-400 hover:shadow-[0_0_42px_rgba(249,115,22,.24)]">
              เริ่มใช้งาน FIRE KEEPER
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </section>

        <footer className={`border-t pt-5 ${border}`}>
          <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div className={`font-mono text-[10px] tracking-[0.16em] ${faint}`}>FIRE KEEPER · DECISION INTELLIGENCE</div>
            <div className={`flex items-center justify-center gap-2 font-mono text-[10px] ${faint}`}><Check className="h-3 w-3 text-orange-500" /> HUMAN DECISION AUTHORITY</div>
          </div>
        </footer>
      </section>

      <div className={`pointer-events-none fixed inset-x-0 bottom-0 h-24 bg-gradient-to-t ${isLight ? 'from-[#f6f6f3]' : 'from-[#040404]'} to-transparent`} />
      {hasEntered && <div className="pointer-events-none fixed inset-0 z-50 bg-orange-500/[0.05] transition-opacity" />}
    </main>
  );
};