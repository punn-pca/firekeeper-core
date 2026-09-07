import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Brain, CheckCircle2, Flame, Search, ShieldCheck, Sun, Moon } from 'lucide-react';
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
};

const FLOW_STEPS: FlowStep[] = [
  { id: 'input', label: 'INPUT', thai: 'รับโจทย์', detail: 'เริ่มจากคำถามหรือปัญหาที่ต้องตัดสินใจ' },
  { id: 'context', label: 'CONTEXT', thai: 'บริบท', detail: 'ทำความเข้าใจสิ่งที่สำคัญและเงื่อนไขที่เกี่ยวข้อง' },
  { id: 'evidence', label: 'EVIDENCE', thai: 'หลักฐาน', detail: 'ตรวจสอบสิ่งที่รองรับข้อกล่าวอ้าง' },
  { id: 'reasoning', label: 'REASONING', thai: 'เหตุผล', detail: 'วิเคราะห์และท้าทายข้อสรุป' },
  { id: 'verification', label: 'VERIFICATION', thai: 'สอบทาน', detail: 'ตรวจสอบความสอดคล้องก่อนสรุป' },
  { id: 'decision', label: 'HUMAN DECISION', thai: 'การตัดสินใจของมนุษย์', detail: 'อำนาจการตัดสินใจยังอยู่ที่มนุษย์' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, isLight: propIsLight }) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = propIsLight !== undefined ? propIsLight : theme === 'light';
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % FLOW_STEPS.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, []);

  const activeStep = useMemo(() => FLOW_STEPS[activeIndex], [activeIndex]);

  const handleEnter = () => {
    setHasEntered(true);
    window.setTimeout(onEnter, 180);
  };

  const bg = isLight ? 'bg-[#f7f7f5] text-slate-950' : 'bg-[#050505] text-white';
  const muted = isLight ? 'text-slate-500' : 'text-white/45';
  const border = isLight ? 'border-slate-200' : 'border-white/[0.09]';

  return (
    <main className={`relative min-h-screen overflow-hidden ${bg} transition-colors duration-500`}>
      <style>{`
        @keyframes fk-pulse { 0%,100% { opacity:.28; transform:scale(.92); } 50% { opacity:1; transform:scale(1); } }
        @keyframes fk-scan { 0% { transform:translateX(-120%); opacity:0; } 20% { opacity:.7; } 80% { opacity:.7; } 100% { transform:translateX(520%); opacity:0; } }
        @keyframes fk-rise { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .fk-pulse { animation:fk-pulse 2.2s ease-in-out infinite; }
        .fk-scan { animation:fk-scan 3.8s ease-in-out infinite; }
        .fk-rise { animation:fk-rise .7s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .fk-pulse,.fk-scan,.fk-rise { animation:none !important; }
          html { scroll-behavior:auto !important; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`absolute left-1/2 top-[-20%] h-[70vh] w-[70vw] -translate-x-1/2 rounded-full blur-3xl ${isLight ? 'bg-orange-400/[0.07]' : 'bg-orange-500/[0.055]'}`} />
        <div className={`absolute inset-x-0 top-1/2 h-px ${isLight ? 'bg-slate-900/[0.04]' : 'bg-white/[0.035]'}`} />
        <div className={`absolute inset-y-0 left-1/2 w-px ${isLight ? 'bg-slate-900/[0.035]' : 'bg-white/[0.025]'}`} />
      </div>

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${border} bg-orange-500/[0.08]`}>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <div className="font-mono text-xs font-semibold tracking-[0.22em]">FIRE KEEPER</div>
            <div className={`mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] ${muted}`}>Decision Intelligence</div>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className={`rounded-lg border p-2 transition-colors ${border} ${isLight ? 'bg-white hover:bg-slate-50' : 'bg-white/[0.025] hover:bg-white/[0.06]'}`}
        >
          {isLight ? <Moon className="h-4 w-4 text-slate-600" /> : <Sun className="h-4 w-4 text-white/65" />}
        </button>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-78px)] max-w-7xl flex-col justify-center px-5 pb-20 pt-8 sm:px-8 lg:px-12">
        <div className="grid items-center gap-14 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
          <div className="max-w-2xl">
            <div className={`mb-7 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] ${border} ${muted}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 fk-pulse" />
              Human decision authority
            </div>

            <h1 className="text-5xl font-semibold tracking-[-0.055em] sm:text-7xl lg:text-[5.7rem]">
              FIRE
              <span className="text-orange-500"> KEEPER</span>
            </h1>

            <p className={`mt-5 max-w-xl text-lg leading-relaxed sm:text-xl ${muted}`}>
              Decision Intelligence for Human Judgment.
            </p>

            <div className="mt-8 space-y-1 font-mono text-sm sm:text-base">
              <div>AI analyzes.</div>
              <div>FIRE KEEPER verifies.</div>
              <div className="text-orange-500">Humans decide.</div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleEnter}
                className="group inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-black transition-all hover:bg-orange-400 hover:shadow-[0_0_30px_rgba(249,115,22,.18)]"
              >
                Try FIRE KEEPER
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <a
                href="#how-it-works"
                className={`inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm transition-colors ${border} ${muted} hover:text-current`}
              >
                Explore how it works
              </a>
            </div>
          </div>

          <div className={`relative rounded-2xl border p-5 sm:p-7 ${border} ${isLight ? 'bg-white/70' : 'bg-white/[0.018]'}`}>
            <div className={`mb-6 flex items-center justify-between border-b pb-4 ${border}`}>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em]">Decision flow</div>
              <div className={`flex items-center gap-2 font-mono text-[9px] ${muted}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> LIVE
              </div>
            </div>

            <div className="space-y-2">
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
                    className={`group relative flex w-full items-center gap-4 rounded-xl border p-3.5 text-left transition-all duration-300 sm:p-4 ${
                      active ? 'border-orange-500/35 bg-orange-500/[0.07]' : `${border} ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.025]'}`
                    }`}
                  >
                    <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-mono text-[10px] ${active ? 'border-orange-500/45 text-orange-500' : `${border} ${muted}`}`}>
                      {completed ? <CheckCircle2 className="h-4 w-4 text-orange-500" /> : String(index + 1).padStart(2, '0')}
                      {active && <span className="absolute inset-0 rounded-lg border border-orange-500/30 fk-pulse" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`font-mono text-xs tracking-[0.12em] ${active ? 'text-orange-500' : ''}`}>{step.label}</div>
                      <div className={`mt-1 text-xs ${muted}`}>{step.thai}</div>
                    </div>
                    <ArrowRight className={`h-4 w-4 shrink-0 transition-all ${active ? 'translate-x-0 text-orange-500 opacity-100' : '-translate-x-1 opacity-20'}`} />
                    {active && <div className="absolute bottom-0 left-0 top-0 w-px bg-orange-500 fk-pulse" />}
                  </button>
                );
              })}
            </div>

            <div className={`relative mt-5 overflow-hidden rounded-xl border p-4 ${border}`}>
              <div className="fk-scan pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-orange-500/15 to-transparent" />
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-500">{activeStep.label}</div>
                  <p key={activeStep.id} className={`mt-1 text-xs leading-relaxed ${muted} fk-rise`}>{activeStep.detail}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="how-it-works" className={`mt-24 grid gap-4 border-t pt-10 sm:grid-cols-3 ${border}`}>
          <div className="flex gap-3">
            <Brain className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
            <div><div className="font-mono text-xs">UNDERSTAND</div><p className={`mt-1 text-xs leading-relaxed ${muted}`}>เข้าใจบริบทก่อนสรุป</p></div>
          </div>
          <div className="flex gap-3">
            <Search className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
            <div><div className="font-mono text-xs">VERIFY</div><p className={`mt-1 text-xs leading-relaxed ${muted}`}>ตรวจสอบสิ่งที่รองรับข้อสรุป</p></div>
          </div>
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
            <div><div className="font-mono text-xs">DECIDE</div><p className={`mt-1 text-xs leading-relaxed ${muted}`}>AI ช่วยคิด แต่มนุษย์ตัดสินใจ</p></div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className={`font-mono text-xs tracking-[0.12em] ${muted}`}>KEEP THE DECISION HUMAN.</p>
          <button type="button" onClick={handleEnter} className="mt-3 text-sm font-medium underline decoration-orange-500/50 underline-offset-4 transition-colors hover:text-orange-500">
            Enter FIRE KEEPER
          </button>
        </div>
      </section>

      <div className={`pointer-events-none fixed inset-x-0 bottom-0 h-24 bg-gradient-to-t ${isLight ? 'from-[#f7f7f5]' : 'from-[#050505]'} to-transparent`} />
      {hasEntered && <div className="pointer-events-none fixed inset-0 z-50 bg-orange-500/[0.04] transition-opacity" />}
    </main>
  );
};
