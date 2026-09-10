import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, Check, Flame, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LandingPageProps {
  onEnter: () => void;
  isLight?: boolean;
}

type Stage = { id: string; en: string; th: string; detail: string };

const STAGES: Stage[] = [
  { id: '01', en: 'CONTEXT', th: 'เข้าใจบริบท', detail: 'แยกคำถาม เงื่อนไข และสิ่งที่ต้องรู้ก่อนตอบ' },
  { id: '02', en: 'EVIDENCE', th: 'ตรวจสอบหลักฐาน', detail: 'แยกสิ่งที่รู้ อนุมาน และสิ่งที่ยังไม่มีหลักฐาน' },
  { id: '03', en: 'REASONING', th: 'วิเคราะห์เหตุผล', detail: 'ตรวจสายเหตุผล ทางเลือก และข้อสรุปที่เปราะบาง' },
  { id: '04', en: 'GOVERNANCE', th: 'กำกับดูแลการตัดสินใจ', detail: 'ตรวจสอบ JSON Schema, นโยบาย, และความหมายก่อนอนุมัติผล' },
  { id: '05', en: 'HUMAN DECISION', th: 'มนุษย์ตัดสินใจ', detail: 'ระบบช่วยคิดและตรวจสอบ แต่สิทธิ์ขาดอยู่ที่มนุษย์' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, isLight: propIsLight }) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = propIsLight !== undefined ? propIsLight : theme === 'light';
  const [active, setActive] = useState(0);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => (value + 1) % STAGES.length), 2800);
    return () => window.clearInterval(timer);
  }, []);

  const enter = () => {
    setEntering(true);
    window.setTimeout(onEnter, 260);
  };

  const bg = isLight ? 'bg-[#f7f6f2] text-[#111]' : 'bg-[#030303] text-white';
  const muted = isLight ? 'text-slate-600' : 'text-white/62';
  const soft = isLight ? 'text-slate-500' : 'text-white/42';
  const line = isLight ? 'border-black/10' : 'border-white/10';
  const surface = isLight ? 'bg-white/75' : 'bg-white/[0.035]';

  return (
    <main className={`relative min-h-screen overflow-x-hidden ${bg} transition-colors duration-500`}>
      <style>{`
        @keyframes fk-breathe { 0%,100% { transform:scale(.96); opacity:.72 } 50% { transform:scale(1.04); opacity:1 } }
        @keyframes fk-flame { 0%,100% { transform:translateY(2px) scale(.94) rotate(-2deg); filter:drop-shadow(0 0 18px rgba(249,115,22,.38)) } 50% { transform:translateY(-5px) scale(1.07) rotate(2deg); filter:drop-shadow(0 0 42px rgba(249,115,22,.78)) } }
        @keyframes fk-orbit { to { transform:rotate(360deg) } }
        @keyframes fk-scan { 0% { transform:translateY(-120%); opacity:0 } 20% { opacity:.8 } 80% { opacity:.8 } 100% { transform:translateY(520%); opacity:0 } }
        @keyframes fk-rise { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .fk-breathe { animation:fk-breathe 2.6s ease-in-out infinite }
        .fk-flame { animation:fk-flame 1.7s ease-in-out infinite; transform-origin:50% 100% }
        .fk-orbit { animation:fk-orbit 24s linear infinite }
        .fk-scan { animation:fk-scan 4s ease-in-out infinite }
        .fk-rise { animation:fk-rise .45s ease-out both }
        @media (prefers-reduced-motion:reduce) { .fk-breathe,.fk-flame,.fk-orbit,.fk-scan,.fk-rise { animation:none !important } }
      `}</style>

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 opacity-[.16] [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="absolute left-[58%] top-[8%] h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-orange-500/[0.07] blur-[120px]" />
        <div className="absolute left-[82%] top-[62%] h-[340px] w-[340px] rounded-full bg-orange-500/[0.045] blur-[100px]" />
      </div>

      <header className="relative z-20 mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:px-14">
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className={`relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border ${line} bg-orange-500/[.08]`}>
            <Flame className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-orange-500" />
          </div>
          <div className="whitespace-nowrap">
            <div className="font-mono text-[10px] sm:text-sm font-bold tracking-[.15em] sm:tracking-[.2em]">FIRE KEEPER</div>
            <div className={`mt-0.5 font-mono text-[8px] sm:text-[10px] tracking-[.1em] sm:tracking-[.18em] ${soft}`}>DECISION INTELLIGENCE</div>
          </div>
        </div>
        <button type="button" onClick={toggleTheme} className={`rounded-xl border p-2 sm:p-2.5 ${line} ${surface} transition hover:border-orange-500/40 cursor-pointer`} aria-label="Toggle theme">
          {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-white/75" />}
        </button>
      </header>

      <section className="relative z-10 mx-auto flex min-h-0 lg:min-h-[calc(100vh-78px)] max-w-[1440px] items-center px-4 sm:px-8 lg:px-14 pb-8 sm:pb-12 lg:pb-14 pt-2 sm:pt-6 lg:pt-2">
        <div className="grid w-full items-center gap-8 sm:gap-10 lg:grid-cols-[.92fr_1.08fr] lg:gap-16 xl:gap-24">
          <div className="max-w-[680px]">
            <div className={`mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 sm:px-3.5 sm:py-2 font-mono text-[10px] sm:text-[11px] tracking-[.12em] sm:tracking-[.14em] ${line} ${soft}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> HUMAN DECISION AUTHORITY
            </div>

            <h1 className="text-[clamp(2.25rem,9vw,7.5rem)] font-semibold leading-[.9] tracking-[-.06em]">
              FIRE<br /><span className="text-orange-500">KEEPER</span>
            </h1>

            <p className={`mt-3 sm:mt-6 lg:mt-8 max-w-[620px] text-base sm:text-2xl lg:text-[2.1rem] font-medium leading-[1.35] sm:leading-[1.4] ${muted}`}>
              AI ช่วยวิเคราะห์และตรวจสอบ<br className="hidden sm:block" />
              แต่มนุษย์ยังเป็นผู้ตัดสินใจ
            </p>

            <p className={`mt-3 sm:mt-4 lg:mt-5 max-w-[590px] text-sm sm:text-base lg:text-lg leading-6 sm:leading-7 lg:leading-8 ${muted}`}>
              FIRE KEEPER ทำให้คำถามที่ซับซ้อนผ่านกระบวนการของบริบท หลักฐาน เหตุผล และการสอบทาน ก่อนส่งผลกลับมาให้มนุษย์พิจารณา
            </p>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button type="button" onClick={enter} className="group inline-flex items-center justify-center gap-3 rounded-xl bg-orange-500 px-6 py-3.5 text-sm sm:text-base font-semibold text-black transition hover:bg-orange-400 hover:shadow-[0_0_50px_rgba(249,115,22,.25)] cursor-pointer">
                เริ่มใช้งาน <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <a href="#intelligence" className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-sm sm:text-base ${line} ${muted} transition hover:border-orange-500/40 hover:text-orange-500`}>
                สำรวจระบบ <ArrowDown className="h-4 w-4" />
              </a>
            </div>

            {/* Stage Path: Single line, no awkward wrap */}
            <div className={`mt-6 sm:mt-9 flex items-center justify-between sm:justify-start gap-x-1.5 sm:gap-x-4 md:gap-x-6 border-t pt-4 sm:pt-5 font-mono text-[9px] sm:text-[11px] tracking-[.06em] sm:tracking-[.13em] overflow-x-auto whitespace-nowrap scrollbar-none ${line} ${soft}`}>
              <span>CONTEXT</span>
              <span className="text-orange-500">/</span>
              <span>EVIDENCE</span>
              <span className="text-orange-500">/</span>
              <span>REASONING</span>
              <span className="text-orange-500">/</span>
              <span>VERIFICATION</span>
            </div>
          </div>

          {/* DESKTOP COMPOSITION (≥1024px) */}
          <div className="relative mx-auto w-full max-w-[700px] hidden lg:block">
            <div className="absolute -inset-12 rounded-full bg-orange-500/[.06] blur-[80px]" />
            <div className={`relative aspect-square overflow-hidden rounded-[2rem] border ${line} ${surface} shadow-[0_30px_100px_rgba(0,0,0,.35)]`}>
              <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:40px_40px]" />
              <div className="absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/10 fk-orbit" />
              <div className="absolute left-1/2 top-1/2 h-[53%] w-[53%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/20" />
              <div className="absolute left-1/2 top-1/2 h-[32%] w-[32%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/[.07] blur-2xl fk-breathe" />

              {STAGES.slice(0, 4).map((stage, index) => {
                const positions = [
                  'left-[9%] top-[28%]', 'right-[9%] top-[20%]', 'right-[8%] bottom-[22%]', 'left-[9%] bottom-[18%]',
                ];
                return (
                  <button key={stage.id} type="button" onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)} className={`absolute ${positions[index]} z-10 w-[34%] rounded-2xl border p-3 text-left backdrop-blur-md transition-all duration-500 sm:p-4 cursor-pointer ${active === index ? 'border-orange-500/55 bg-orange-500/[.10] shadow-[0_0_30px_rgba(249,115,22,.12)]' : `${line} ${surface}`}`}>
                    <div className="font-mono text-[10px] text-orange-500">{stage.id}</div>
                    <div className="mt-1 text-xs font-bold tracking-wide sm:text-sm">{stage.en}</div>
                    <div className={`mt-1 text-[11px] leading-5 ${soft}`}>{stage.th}</div>
                  </button>
                );
              })}

              <div className="absolute left-1/2 top-1/2 z-20 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-orange-500/30 bg-[#090604]/80 shadow-[0_0_80px_rgba(249,115,22,.18)] backdrop-blur-xl sm:h-44 sm:w-44">
                <div className="absolute inset-3 rounded-full border border-orange-500/15" />
                <Flame className="relative h-20 w-20 text-orange-500 fk-flame sm:h-24 sm:w-24" fill="currentColor" />
              </div>

              <div className={`absolute bottom-5 left-5 right-5 z-20 rounded-2xl border p-4 backdrop-blur-xl ${line} ${isLight ? 'bg-white/85' : 'bg-black/55'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-mono text-[10px] tracking-[.15em] text-orange-500">ACTIVE REASONING STAGE</div>
                    <div key={STAGES[active].id} className="fk-rise mt-1 text-base font-semibold sm:text-lg">{STAGES[active].th}</div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className={`font-mono text-[10px] ${soft}`}>{STAGES[active].en}</div>
                    <div className={`mt-1 max-w-[270px] text-xs leading-5 ${muted}`}>{STAGES[active].detail}</div>
                  </div>
                </div>
                <div className="mt-3 h-px overflow-hidden bg-orange-500/10"><div className="h-full w-1/3 bg-orange-500 fk-scan" /></div>
              </div>
            </div>
          </div>

          {/* DEDICATED MOBILE & TABLET COMPOSITION (<1024px) */}
          <div className="relative mx-auto w-full max-w-[520px] block lg:hidden">
            <div className="absolute -inset-4 rounded-3xl bg-orange-500/[.05] blur-[50px] pointer-events-none" />

            <div className={`relative rounded-2xl border p-4 sm:p-5 ${line} ${surface} shadow-xl overflow-hidden`}>
              <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none" />

              {/* Centered Fire Keeper Flame Core */}
              <div className="relative z-10 flex flex-col items-center justify-center pt-1 pb-1">
                <div className="relative flex h-20 w-20 sm:h-28 sm:w-28 items-center justify-center rounded-full border border-orange-500/30 bg-[#090604]/85 shadow-[0_0_50px_rgba(249,115,22,.25)] backdrop-blur-xl">
                  <div className="absolute inset-2 rounded-full border border-orange-500/20" />
                  <Flame className="relative h-10 w-10 sm:h-14 sm:w-14 text-orange-500 fk-flame" fill="currentColor" />
                </div>
                <div className="mt-2 font-mono text-[10px] sm:text-xs font-bold tracking-[.18em] text-orange-500">
                  FIRE KEEPER
                </div>
                <div className={`font-mono text-[8.5px] tracking-[.12em] ${soft}`}>
                  DECISION INTELLIGENCE
                </div>
              </div>

              {/* Active Reasoning Stage Card */}
              <div className={`relative z-10 mt-3 rounded-xl border p-3 sm:p-3.5 backdrop-blur-xl ${line} ${isLight ? 'bg-white/90' : 'bg-black/60'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-[9.5px] sm:text-[10px] tracking-[.14em] text-orange-500 font-bold">
                    ACTIVE REASONING STAGE
                  </div>
                  <div className="font-mono text-[10px] text-orange-400/80 font-bold">
                    {STAGES[active].id} / 04
                  </div>
                </div>
                <div key={STAGES[active].id} className="fk-rise mt-1 text-sm sm:text-base font-bold">
                  {STAGES[active].th}
                </div>
                <div className={`mt-0.5 text-[11px] sm:text-xs leading-4 sm:leading-5 ${muted}`}>
                  {STAGES[active].detail}
                </div>
                <div className="mt-2.5 h-0.5 overflow-hidden bg-orange-500/15 rounded-full">
                  <div className="h-full w-1/3 bg-orange-500 fk-scan rounded-full" />
                </div>
              </div>

              {/* Clean 4-Stage List (1 col on XS, 2 col on SM, No Overlap, Touch-friendly) */}
              <div className="relative z-10 mt-8 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STAGES.slice(0, 4).map((stage, index) => {
                  const isCurrent = active === index;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setActive(index)}
                      className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-orange-500/60 bg-orange-500/[.12] shadow-[0_0_20px_rgba(249,115,22,.15)]'
                          : `${line} ${surface} hover:border-orange-500/30`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-orange-500">{stage.id}</span>
                        {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />}
                      </div>
                      <div className="mt-1 font-mono text-[11px] font-bold tracking-tight">{stage.en}</div>
                      <div className={`mt-0.5 text-[10px] leading-4 truncate ${soft}`}>{stage.th}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="intelligence" className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-14 py-6 sm:py-16 lg:py-24">
        <div className="mb-5 sm:mb-10 max-w-2xl">
          <div className="font-mono text-[10px] sm:text-xs tracking-[.18em] text-orange-500">HOW FIRE KEEPER WORKS</div>
          <h2 className="mt-1 text-xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">ไม่รีบให้คำตอบ<br /><span className={muted}>แต่ทำให้เหตุผลตรวจสอบได้</span></h2>
        </div>
        <div className="grid gap-2.5 sm:gap-4 md:grid-cols-3">
          <div className={`rounded-2xl border p-5 sm:p-6 ${line} ${surface}`}>
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
            <h3 className="mt-4 sm:mt-5 text-base sm:text-lg font-semibold">Decision Governance</h3>
            <p className={`mt-1.5 sm:mt-2 text-xs sm:text-sm leading-5 sm:leading-6 ${muted}`}>JSON Schema และ Semantic Audit เพื่อรักษาความถูกต้อง</p>
          </div>
          <div className={`rounded-2xl border p-5 sm:p-6 ${line} ${surface}`}>
            <Check className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
            <h3 className="mt-4 sm:mt-5 text-base sm:text-lg font-semibold">Evidence-first Reasoning</h3>
            <p className={`mt-1.5 sm:mt-2 text-xs sm:text-sm leading-5 sm:leading-6 ${muted}`}>ตรวจสายเหตุผลและหลักฐานรองรับก่อนแสดงผล</p>
          </div>
          <div className={`rounded-2xl border p-5 sm:p-6 ${line} ${surface}`}>
            <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
            <h3 className="mt-4 sm:mt-5 text-base sm:text-lg font-semibold">Human remains in control</h3>
            <p className={`mt-1.5 sm:mt-2 text-xs sm:text-sm leading-5 sm:leading-6 ${muted}`}>ระบบสนับสนุนการตัดสินใจ ไม่ใช่ผู้มีอำนาจตัดสินใจแทน</p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1100px] px-4 sm:px-8 lg:px-14 pb-14 sm:pb-20 lg:pb-28 text-center">
        <div className={`rounded-2xl sm:rounded-[2rem] border px-4 sm:px-6 py-8 sm:py-12 ${line} ${surface}`}>
          <Flame className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-orange-500 fk-flame" fill="currentColor" />
          <h2 className="mt-4 text-2xl sm:text-4xl lg:text-5xl font-semibold">ให้ AI ช่วยคิด</h2>
          <p className={`mx-auto mt-2.5 max-w-xl text-sm sm:text-base lg:text-lg ${muted}`}>แต่ให้มนุษย์เป็นผู้ตัดสินใจในท้ายที่สุด</p>
          <button type="button" onClick={enter} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-black transition hover:bg-orange-400 cursor-pointer">เข้าสู่ FIRE KEEPER <ArrowRight className="h-4 w-4" /></button>
        </div>
      </section>

      <footer className={`relative z-10 border-t px-4 py-5 sm:px-6 sm:py-6 text-center font-mono text-[9px] sm:text-[10px] tracking-[.12em] sm:tracking-[.16em] ${line} ${soft}`}>
        FIRE KEEPER · DECISION INTELLIGENCE · HUMAN DECISION AUTHORITY
      </footer>
      {entering && <div className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[2px] transition-opacity" />}
    </main>
  );
};
