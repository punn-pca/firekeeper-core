import React, { useEffect, useState } from 'react';
import { ArrowRight, ChevronDown, Flame, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LandingPageProps {
  onEnter: () => void;
  isLight?: boolean;
}

type Signal = {
  id: string;
  title: string;
  detail: string;
};

const SIGNALS: Signal[] = [
  { id: '01', title: 'CONTEXT', detail: 'Understand the question, constraints, and working state.' },
  { id: '02', title: 'EVIDENCE', detail: 'Separate known facts, inference, and missing evidence.' },
  { id: '03', title: 'REASONING', detail: 'Test assumptions, alternatives, and fragile conclusions.' },
  { id: '04', title: 'GOVERNANCE', detail: 'Validate structure, policy, relevance, and decision boundaries.' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, isLight: propIsLight }) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = propIsLight !== undefined ? propIsLight : theme === 'light';
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => (value + 1) % SIGNALS.length), 3200);
    return () => window.clearInterval(timer);
  }, []);

  const bg = isLight ? '#f5f5f2' : '#050505';
  const fg = isLight ? '#111111' : '#f5f5f5';
  const muted = isLight ? 'rgba(17,17,17,.62)' : 'rgba(255,255,255,.62)';
  const soft = isLight ? 'rgba(17,17,17,.42)' : 'rgba(255,255,255,.40)';
  const line = isLight ? 'rgba(17,17,17,.11)' : 'rgba(255,255,255,.11)';
  const card = isLight ? 'rgba(255,255,255,.72)' : 'rgba(255,255,255,.035)';

  return (
    <main
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: bg, color: fg, transition: 'background .35s ease, color .35s ease' }}
    >
      <style>{`
        @keyframes fk-pulse { 0%,100% { transform:scale(.96); opacity:.65 } 50% { transform:scale(1.04); opacity:1 } }
        @keyframes fk-spin { to { transform:rotate(360deg) } }
        @keyframes fk-float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-6px) } }
        @keyframes fk-enter { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        .fk-pulse { animation:fk-pulse 3s ease-in-out infinite }
        .fk-spin { animation:fk-spin 28s linear infinite }
        .fk-float { animation:fk-float 3s ease-in-out infinite }
        .fk-enter { animation:fk-enter .55s ease-out both }
        @media (prefers-reduced-motion:reduce) { .fk-pulse,.fk-spin,.fk-float,.fk-enter { animation:none !important } }
      `}</style>

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `linear-gradient(${isLight ? 'rgba(0,0,0,.035)' : 'rgba(255,255,255,.035)'} 1px, transparent 1px), linear-gradient(90deg, ${isLight ? 'rgba(0,0,0,.035)' : 'rgba(255,255,255,.035)'} 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
        <div className="absolute left-[62%] top-[-180px] h-[620px] w-[620px] rounded-full bg-orange-500/[.065] blur-[130px]" />
        <div className="absolute right-[-180px] bottom-[-220px] h-[560px] w-[560px] rounded-full bg-orange-500/[.045] blur-[120px]" />
      </div>

      <header className="relative z-20 mx-auto flex max-w-[1480px] items-center justify-between px-5 py-5 sm:px-8 lg:px-14 lg:py-7">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl border"
            style={{ borderColor: line, background: 'rgba(249,115,22,.08)' }}
          >
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <div className="font-mono text-[11px] font-bold tracking-[.22em] sm:text-sm">FIRE KEEPER</div>
            <div className="mt-0.5 font-mono text-[8px] tracking-[.18em] sm:text-[9px]" style={{ color: soft }}>
              DECISION INTELLIGENCE SYSTEM
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-6 font-mono text-[10px] tracking-[.16em] sm:flex" style={{ color: soft }}>
            <span>MEMORY</span>
            <span>EVIDENCE</span>
            <span>REASONING</span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-xl border p-2.5 transition hover:border-orange-500/50"
            style={{ borderColor: line, background: card }}
          >
            {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-white/75" />}
          </button>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-[1480px] px-5 pb-16 pt-8 sm:px-8 sm:pt-14 lg:px-14 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[.96fr_1.04fr] lg:gap-20 xl:gap-28">
          <div className="max-w-[720px]">
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-2 font-mono text-[9px] tracking-[.16em] sm:text-[10px]"
              style={{ borderColor: line, color: soft, background: card }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              HUMAN DECISION AUTHORITY
            </div>

            <h1 className="text-[clamp(3.6rem,10vw,9rem)] font-semibold leading-[.82] tracking-[-.075em]">
              FIRE
              <br />
              <span className="text-orange-500">KEEPER</span>
            </h1>

            <p className="mt-7 max-w-[680px] text-[clamp(1.3rem,2.6vw,2.55rem)] font-medium leading-[1.18] tracking-[-.025em]" style={{ color: muted }}>
              AI ช่วยคิดอย่างเป็นระบบ
              <br className="hidden sm:block" />
              แต่การตัดสินใจยังเป็นของมนุษย์
            </p>

            <p className="mt-5 max-w-[610px] text-sm leading-7 sm:text-base" style={{ color: muted }}>
              Fire Keeper เชื่อมบริบท ความทรงจำ หลักฐาน เหตุผล และการกำกับดูแลไว้ใน workflow เดียว เพื่อให้คำตอบตรวจสอบย้อนกลับได้ก่อนนำไปใช้จริง
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onEnter}
                className="group inline-flex items-center justify-center gap-3 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-orange-400 hover:shadow-[0_0_55px_rgba(249,115,22,.22)]"
              >
                เปิด Fire Keeper
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <a
                href="#system"
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3.5 text-sm transition hover:border-orange-500/50 hover:text-orange-500"
                style={{ borderColor: line, color: muted, background: card }}
              >
                ดูระบบ
                <ChevronDown className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-9 flex items-center gap-3 font-mono text-[9px] tracking-[.13em] sm:text-[10px]" style={{ color: soft }}>
              <span>CONTEXT</span><span className="text-orange-500">/</span>
              <span>EVIDENCE</span><span className="text-orange-500">/</span>
              <span>REASONING</span><span className="text-orange-500">/</span>
              <span>GOVERNANCE</span>
            </div>
          </div>

          <div id="system" className="relative mx-auto w-full max-w-[720px]">
            <div className="absolute -inset-10 rounded-full bg-orange-500/[.055] blur-[90px]" />
            <div
              className="relative aspect-square overflow-hidden rounded-[2rem] border p-5 shadow-[0_35px_120px_rgba(0,0,0,.28)] sm:p-8"
              style={{ borderColor: line, background: card }}
            >
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  backgroundImage: `linear-gradient(${isLight ? 'rgba(0,0,0,.03)' : 'rgba(255,255,255,.03)'} 1px, transparent 1px), linear-gradient(90deg, ${isLight ? 'rgba(0,0,0,.03)' : 'rgba(255,255,255,.03)'} 1px, transparent 1px)`,
                  backgroundSize: '42px 42px',
                }}
              />

              <div className="absolute left-1/2 top-1/2 h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/10 fk-spin" />
              <div className="absolute left-1/2 top-1/2 h-[55%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/15" />
              <div className="absolute left-1/2 top-1/2 h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/[.08] blur-2xl fk-pulse" />

              {SIGNALS.map((signal, index) => {
                const positions = [
                  'left-[5%] top-[15%]',
                  'right-[5%] top-[18%]',
                  'right-[5%] bottom-[15%]',
                  'left-[5%] bottom-[18%]',
                ];
                return (
                  <button
                    key={signal.id}
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                    onClick={() => setActive(index)}
                    className={`absolute z-10 ${positions[index]} w-[36%] rounded-2xl border p-3 text-left backdrop-blur-xl transition-all duration-500 sm:p-4`}
                    style={{
                      borderColor: active === index ? 'rgba(249,115,22,.55)' : line,
                      background: active === index ? 'rgba(249,115,22,.09)' : card,
                      boxShadow: active === index ? '0 0 35px rgba(249,115,22,.10)' : 'none',
                    }}
                  >
                    <div className="font-mono text-[9px] text-orange-500">{signal.id}</div>
                    <div className="mt-1 text-xs font-bold tracking-[.08em] sm:text-sm">{signal.title}</div>
                    <div className="mt-1 text-[9px] leading-4 sm:text-[10px] sm:leading-5" style={{ color: soft }}>{signal.detail}</div>
                  </button>
                );
              })}

              <div
                className="absolute left-1/2 top-1/2 z-20 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-orange-500/30 backdrop-blur-xl sm:h-44 sm:w-44"
                style={{ background: isLight ? 'rgba(255,255,255,.82)' : 'rgba(8,6,4,.82)', boxShadow: '0 0 90px rgba(249,115,22,.15)' }}
              >
                <div className="absolute inset-3 rounded-full border border-orange-500/15" />
                <Flame className="h-16 w-16 text-orange-500 fk-float sm:h-20 sm:w-20" fill="currentColor" />
              </div>

              <div
                className="absolute bottom-5 left-5 right-5 z-30 rounded-2xl border p-4 backdrop-blur-xl sm:bottom-7 sm:left-7 sm:right-7"
                style={{ borderColor: line, background: isLight ? 'rgba(255,255,255,.86)' : 'rgba(0,0,0,.62)' }}
              >
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="font-mono text-[9px] tracking-[.16em] text-orange-500">ACTIVE SYSTEM LAYER</div>
                    <div className="mt-1 text-base font-semibold sm:text-lg">{SIGNALS[active].title}</div>
                  </div>
                  <div className="hidden max-w-[250px] text-right text-[10px] leading-5 sm:block" style={{ color: muted }}>
                    {SIGNALS[active].detail}
                  </div>
                </div>
                <div className="mt-3 flex gap-1">
                  {SIGNALS.map((signal, index) => (
                    <span key={signal.id} className="h-1 flex-1 rounded-full" style={{ background: index === active ? '#f97316' : 'rgba(249,115,22,.14)' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y" style={{ borderColor: line }}>
        <div className="mx-auto grid max-w-[1480px] md:grid-cols-3">
          {[
            ['MEMORY', 'รักษา working context และความรู้ที่สำคัญ'],
            ['EVIDENCE', 'ทำให้ที่มาของข้อสรุปตรวจสอบได้'],
            ['CONTROL', 'กำหนดขอบเขตและสิทธิ์ของการตัดสินใจ'],
          ].map(([label, text], index) => (
            <div key={label} className={`p-7 sm:p-9 lg:p-12 ${index < 2 ? 'border-b md:border-b-0 md:border-r' : ''}`} style={{ borderColor: line }}>
              <div className="font-mono text-[10px] tracking-[.18em] text-orange-500">0{index + 1} / {label}</div>
              <p className="mt-3 max-w-[300px] text-sm leading-6" style={{ color: muted }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1480px] px-5 py-16 sm:px-8 lg:px-14 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-24">
          <div>
            <div className="font-mono text-[10px] tracking-[.18em] text-orange-500">FIRE KEEPER CORE</div>
            <h2 className="mt-4 max-w-[560px] text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
              From question<br />to accountable decision.
            </h2>
          </div>
          <div className="grid gap-0 border-t" style={{ borderColor: line }}>
            {[
              ['01', 'Context', 'What does the system actually know about the situation?'],
              ['02', 'Evidence', 'Which claims are supported, inferred, or still uncertain?'],
              ['03', 'Reasoning', 'What assumptions and alternatives should be tested?'],
              ['04', 'Human decision', 'The system surfaces the decision boundary; the human remains accountable.'],
            ].map(([number, title, text]) => (
              <div key={number} className="grid gap-4 border-b py-6 sm:grid-cols-[70px_180px_1fr] sm:items-start" style={{ borderColor: line }}>
                <span className="font-mono text-[10px] text-orange-500">{number}</span>
                <strong className="text-sm tracking-wide">{title}</strong>
                <span className="text-sm leading-6" style={{ color: muted }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t" style={{ borderColor: line }}>
        <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-14">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-orange-500" />
            <span className="font-mono text-[9px] tracking-[.14em]" style={{ color: soft }}>AI ASSISTS. HUMAN DECIDES.</span>
          </div>
          <button type="button" onClick={onEnter} className="group inline-flex items-center gap-2 font-mono text-[10px] tracking-[.14em] text-orange-500">
            ENTER FIRE KEEPER <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </footer>
    </main>
  );
};
