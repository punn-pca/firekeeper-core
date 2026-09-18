import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, Check, Code2, Flame, FileText, Moon, ShieldCheck, Sun, Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LandingPageProps {
  onEnter: () => void;
  onNavigateDocs?: () => void;
  onNavigateDevelopers?: () => void;
  isLight?: boolean;
}

type Stage = { id: string; en: string; th: string; detail: string; icon?: React.ReactNode };

// Custom SVG Illustrations for reasoning stages
const IntentIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 12L52 22V42L32 52L12 42V22L32 12Z" fill="url(#grad1)" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="32" cy="32" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
    <path d="M32 20V26M32 38V44M20 32H26M38 32H44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <defs>
      <linearGradient id="grad1" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B" />
        <stop offset="1" stopColor="#F59E0B" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

const ContextIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22L32 12L52 22M12 42L32 52L52 42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 12V52M12 22L52 42M52 22L12 42" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
    <rect x="26" y="26" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
  </svg>
);

const ScopeIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="1.5" />
    <path d="M32 12V20M32 44V52M12 32H20M44 32H52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M22 22L28 28M36 36L42 42M22 42L28 36M36 28L42 22" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    <circle cx="32" cy="32" r="4" fill="currentColor" />
  </svg>
);

const DataIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 20L32 12L48 20V44L32 52L16 44V20Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 28L32 36L48 28" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 36L32 44L48 36" stroke="currentColor" strokeWidth="1.5" />
    <path d="M32 12V36" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
  </svg>
);

const STAGES: Stage[] = [
  { id: '01', en: 'กำหนดเจตนา', th: 'ระบุเจตนา', detail: 'ระบุสิ่งที่ผู้ใช้ต้องการรู้ ตัดสินใจ หรือดำเนินการ', icon: <IntentIcon /> },
  { id: '02', en: 'ทำความเข้าใจบริบท', th: 'เข้าใจบริบท', detail: 'ทำความเข้าใจบริบท เงื่อนไข และข้อจำกัด', icon: <ContextIcon /> },
  { id: '03', en: 'กำหนดวัตถุประสงค์และขอบเขต', th: 'กำหนดขอบเขต', detail: 'กำหนดวัตถุประสงค์ ขอบเขต และเกณฑ์ของการวิเคราะห์', icon: <ScopeIcon /> },
  { id: '04', en: 'จัดโครงสร้างข้อมูล', th: 'จัดโครงสร้างข้อมูล', detail: 'จัดโครงสร้างข้อมูลและเรียกใช้ความจำที่เกี่ยวข้อง', icon: <DataIcon /> },
  { id: '05', en: 'วิเคราะห์ความสัมพันธ์', th: 'จำลองความสัมพันธ์', detail: 'วิเคราะห์ความสัมพันธ์เชิงตรรกะระหว่างข้อมูลและปัจจัย' },
  { id: '06', en: 'สร้างสมมติฐาน', th: 'สร้างสมมติฐาน', detail: 'สร้างทางเลือกและสมมติฐานคู่ขนานแบบ ACH' },
  { id: '07', en: 'ประเมินหลักฐาน', th: 'ประเมินหลักฐาน', detail: 'จำแนกหลักฐานและสถานะความรู้ตาม epistemic taxonomy' },
  { id: '08', en: 'วิเคราะห์ความเสี่ยงและวิพากษ์', th: 'วิเคราะห์ความเสี่ยง', detail: 'ตรวจจุดเปราะบาง ความเสี่ยง และข้อวิพากษ์' },
  { id: '09', en: 'สังเคราะห์ทางเลือก', th: 'สังเคราะห์ทางเลือก', detail: 'เปรียบเทียบทางเลือก ผลกระทบ และ trade-offs' },
  { id: '10', en: 'สื่อสารผลการวิเคราะห์', th: 'สื่อสารบทวิเคราะห์', detail: 'สื่อสารผลอย่างมีโครงสร้างและเหมาะกับบริบทผู้ใช้' },
  { id: '11', en: 'ทบทวนและตรวจสอบ', th: 'ทบทวนและตรวจสอบ', detail: 'ระบุข้ออ้างที่ยังไม่มีหลักฐาน ความไม่แน่นอน และขอบเขตการกำกับดูแล' },
  { id: '12', en: 'ปรับปรุงอย่างต่อเนื่อง', th: 'ปรับปรุงต่อเนื่อง', detail: 'เรียนรู้จากผลการตรวจสอบโดยคง มนุษย์ Agency เป็นหลัก' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onNavigateDocs, onNavigateDevelopers, isLight: propIsLight }) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = propIsLight !== undefined ? propIsLight : theme === 'light';
  const [active, setActive] = useState(0);
  const [entering, setEntering] = useState(false);
  const [showAuditRecord, setShowAuditRecord] = useState(false);

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
    <main className={`relative min-h-screen overflow-x-hidden fk-geometric-bg ${isLight ? 'text-[#111]' : 'text-white'} transition-colors duration-500`}>
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
        <div className="absolute left-[58%] top-[8%] h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-orange-500/[0.05] blur-[120px]" />
        <div className="absolute left-[82%] top-[62%] h-[340px] w-[340px] rounded-full bg-orange-500/[0.035] blur-[100px]" />
      </div>

      <header className="relative z-20 mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:px-14">
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className={`relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border ${line} bg-orange-500/[.08]`}>
            <Flame className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-orange-500" />
          </div>
          <div className="whitespace-nowrap">
            <div className="font-mono text-[10px] sm:text-sm font-bold tracking-[.15em] sm:tracking-[.2em]">FIRE KEEPER</div>
            <div className={`mt-0.5 font-mono text-[8px] sm:text-[10px] tracking-[.1em] sm:tracking-[.18em] ${soft}`}>ระบบปัญญาเพื่อการตัดสินใจ</div>
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
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> มนุษย์เป็นผู้มีอำนาจตัดสินใจ
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

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto">
              <button type="button" onClick={enter} className="group inline-flex items-center justify-center gap-3 rounded-xl bg-orange-500 px-6 py-3.5 text-sm sm:text-base font-semibold text-black transition hover:bg-orange-400 hover:shadow-[0_0_50px_rgba(249,115,22,.25)] cursor-pointer">
                เริ่มวิเคราะห์ <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <a href="https://github.com/punn-pca/firekeeper-core/releases/download/v1.0.0-mobile/firekeeper-standalone.apk" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500/10 border border-orange-500/30 px-5 py-3.5 text-sm sm:text-base text-orange-400 transition hover:bg-orange-500/20 hover:border-orange-500 hover:text-orange-300">
                <Download className="h-4 w-4" /> ดาวน์โหลดแอปมือถือ
              </a>
              <a href="#intelligence" className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-sm sm:text-base ${line} ${muted} transition hover:border-orange-500/40 hover:text-orange-500`}>
                ดูวิธีทำงาน <ArrowDown className="h-4 w-4" />
              </a>
              <a href="#live-example" className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-sm sm:text-base ${line} ${muted} transition hover:border-orange-500/40 hover:text-orange-500`}>
                ดูตัวอย่างผลลัพธ์ <FileText className="h-4 w-4" />
              </a>
            </div>

            {/* Stage Path: Single line, no awkward wrap */}
            <div className={`mt-6 sm:mt-9 flex items-center justify-between sm:justify-start gap-x-1.5 sm:gap-x-4 md:gap-x-6 border-t pt-4 sm:pt-5 font-mono text-[9px] sm:text-[11px] tracking-[.06em] sm:tracking-[.13em] overflow-x-auto whitespace-nowrap scrollbar-none ${line} ${soft}`}>
              <span>INTENT</span>
              <span className="text-orange-500">/</span>
              <span>CONTEXT</span>
              <span className="text-orange-500">/</span>
              <span>EVIDENCE</span>
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
                  'left-0 top-[15%]', 'right-0 top-[12%]', 'right-0 bottom-[28%]', 'left-0 bottom-[28%]',
                ];
                const isActive = active === index;
                return (
                  <button 
                    key={stage.id} 
                    type="button" 
                    onMouseEnter={() => setActive(index)} 
                    onFocus={() => setActive(index)} 
                    onClick={() => setActive(index)} 
                    className={`absolute ${positions[index]} z-30 w-[38%] rounded-2xl border p-2 text-left backdrop-blur-xl transition-all duration-700 sm:p-3 cursor-pointer group ${
                      isActive 
                        ? 'border-orange-500 bg-orange-500/[.15] shadow-[0_0_40px_rgba(249,115,22,.2)] -translate-y-1 scale-[1.03]' 
                        : `${line} ${surface} hover:border-orange-500/50 hover:bg-white/[0.06]`
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {stage.icon && (
                        <div className={`shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center border ${isActive ? 'border-orange-500/40 bg-orange-500/5' : 'border-white/5 bg-white/[0.02] shadow-inner'} text-orange-500/80`}>
                          <div className="w-6 h-6 sm:w-8 sm:h-8">
                            {stage.icon}
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[9px] text-orange-500 font-bold tracking-widest">{stage.id}</div>
                        <div className="mt-0.5 text-[11px] font-black tracking-tight text-white/90 truncate sm:text-xs">{stage.en}</div>
                        <div className={`mt-0.5 text-[10px] leading-4 line-clamp-1 ${soft}`}>{stage.th}</div>
                      </div>
                    </div>
                    {isActive && (
                      <div className="absolute -inset-0.5 rounded-2xl bg-orange-500/20 blur-md -z-10 animate-pulse" />
                    )}
                  </button>
                );
              })}

              <div className="absolute left-1/2 top-1/2 z-20 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-orange-500/30 bg-[#090604]/90 shadow-[0_0_100px_rgba(249,115,22,.25)] backdrop-blur-2xl sm:h-36 sm:w-36">
                <div className="absolute inset-3 rounded-full border border-orange-500/20" />
                <Flame className="relative h-14 w-14 text-orange-500 fk-flame sm:h-18 sm:w-18" fill="currentColor" />
              </div>

              <div className={`absolute bottom-4 left-4 right-4 z-20 rounded-2xl border p-3 sm:p-4 backdrop-blur-xl ${line} ${isLight ? 'bg-white/85' : 'bg-black/55'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-mono text-[10px] tracking-[.15em] text-orange-500">ขั้นตอนการคิดที่กำลังทำงาน</div>
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
                  ระบบปัญญาเพื่อการตัดสินใจ
                </div>
              </div>

              {/* Active Reasoning Stage Card */}
              <div className={`relative z-10 mt-3 rounded-xl border p-3 sm:p-3.5 backdrop-blur-xl ${line} ${isLight ? 'bg-white/90' : 'bg-black/60'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-[9.5px] sm:text-[10px] tracking-[.14em] text-orange-500 font-bold">
                    ขั้นตอนการคิดที่กำลังทำงาน
                  </div>
                  <div className="font-mono text-[10px] text-orange-400/80 font-bold">
                    {STAGES[active].id} / 12
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
              <div className="relative z-10 mt-8 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STAGES.slice(0, 4).map((stage, index) => {
                  const isCurrent = active === index;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setActive(index)}
                      className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer group ${
                        isCurrent
                          ? 'border-orange-500/60 bg-orange-500/[.12] shadow-[0_0_20px_rgba(249,115,22,.15)] scale-[1.02]'
                          : `${line} ${surface} hover:border-orange-500/30`
                      }`}
                    >
                      {stage.icon && (
                        <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border ${isCurrent ? 'border-orange-500/40 bg-orange-500/5' : 'border-white/5 bg-white/[0.02]'} text-orange-500/70`}>
                          <div className="w-5 h-5">
                            {stage.icon}
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] font-bold text-orange-500">{stage.id}</span>
                          {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />}
                        </div>
                        <div className="font-mono text-[10px] font-bold tracking-tight truncate text-white/90">{stage.en}</div>
                        <div className={`mt-0.5 text-[10px] leading-4 truncate ${soft}`}>{stage.th}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-14 pt-2 pb-2 sm:pt-4 sm:pb-4">
        <div className={`flex flex-wrap items-center justify-center gap-2 rounded-2xl border p-2 ${line} ${surface}`}>
          <button type="button" onClick={onNavigateDocs} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium transition hover:bg-orange-500/10 hover:text-orange-500 cursor-pointer ${muted}`}>
            <FileText className="h-4 w-4" /> เอกสารสถาปัตยกรรม
          </button>
          <button type="button" onClick={onNavigateDevelopers} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium transition hover:bg-orange-500/10 hover:text-orange-500 cursor-pointer ${muted}`}>
            <Code2 className="h-4 w-4" /> เอกสารสำหรับนักพัฒนา
          </button>
        </div>
      </section>

      <section id="live-example" className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-14 py-12 sm:py-18 lg:py-24">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="font-mono text-[10px] sm:text-xs tracking-[.18em] text-orange-500">LIVE OUTPUT FORMAT · DEMONSTRATION</div>
            <h2 className="mt-1 text-2xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">อย่าเพิ่งเชื่อคำอธิบาย<br /><span className={muted}>ดูสิ่งที่ผู้ใช้ได้รับจริง</span></h2>
          </div>
          <div className={`max-w-sm text-sm leading-6 ${muted}`}>ตัวอย่างจำลองเพื่อแสดงรูปแบบผลลัพธ์ ไม่ใช่คำแนะนำหรือข้อมูลสำหรับตัดสินใจจริง</div>
        </div>

        <div className={`overflow-hidden rounded-2xl border ${line} ${surface} shadow-[0_24px_80px_rgba(0,0,0,.18)]`}>
          <div className={`flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${line}`}>
            <div>
              <div className="font-mono text-[10px] tracking-[.14em] text-orange-500">DECISION QUESTION</div>
              <p className="mt-1 text-sm sm:text-base font-medium">บริษัทควรเปิดโรงงานแห่งใหม่ในเวียดนามหรือไม่?</p>
            </div>
            <div className={`font-mono text-[10px] ${soft}`}>DEMO · FK-EXAMPLE-001</div>
          </div>

          <div className="grid gap-px bg-white/10 lg:grid-cols-[1.12fr_.88fr]">
            <div className={`space-y-5 p-5 sm:p-7 ${isLight ? 'bg-white' : 'bg-[#080808]'}`}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={`rounded-xl border p-4 ${line} ${surface}`}><div className="font-mono text-[10px] text-emerald-500">KNOWN FACTS</div><p className={`mt-2 text-sm leading-6 ${muted}`}>มีคำขอผลิตเพิ่มและมีฐานลูกค้าในภูมิภาค</p></div>
                <div className={`rounded-xl border p-4 ${line} ${surface}`}><div className="font-mono text-[10px] text-amber-500">ASSUMPTIONS</div><p className={`mt-2 text-sm leading-6 ${muted}`}>ต้นทุนแรงงานและอุปสงค์ยังอยู่ในระดับที่คาดการณ์ไว้</p></div>
              </div>
              <div className={`rounded-xl border p-4 ${line} ${surface}`}>
                <div className="flex items-center justify-between gap-3"><div className="font-mono text-[10px] text-orange-500">COMPETING HYPOTHESES</div><span className={`text-[11px] ${soft}`}>ต้องตรวจสอบต่อ</span></div>
                <div className={`mt-3 grid gap-2 text-sm ${muted}`}>
                  <div className="flex gap-3"><span className="font-mono text-orange-500">H1</span><span>เปิดโรงงานใหม่: เพิ่มกำลังผลิตและลดเวลาส่งมอบ</span></div>
                  <div className="flex gap-3"><span className="font-mono text-orange-500">H2</span><span>ขยายกำลังผลิตเดิม: ลงทุนน้อยกว่า แต่เสี่ยงต่อ capacity จำกัด</span></div>
                  <div className="flex gap-3"><span className="font-mono text-orange-500">H3</span><span>ใช้ผู้รับจ้างผลิต: ยืดหยุ่นกว่า แต่ควบคุมคุณภาพและ IP ยากขึ้น</span></div>
                </div>
              </div>
              <div className={`rounded-xl border p-4 ${line} ${surface}`}>
                <div className="font-mono text-[10px] text-rose-400">DECISION GAPS</div>
                <p className={`mt-2 text-sm leading-6 ${muted}`}>ยังขาดข้อมูลต้นทุนที่ดิน สิทธิประโยชน์ภาษี และแผนความต้องการ 24 เดือน จึงไม่ควรสรุปเป็นคำแนะนำสุดท้าย</p>
              </div>
            </div>

            <div className={`p-5 sm:p-7 ${isLight ? 'bg-slate-50' : 'bg-white/[.025]'}`}>
              <div className="font-mono text-[10px] tracking-[.16em] text-orange-500">DECISION BRIEF</div>
              <h3 className="mt-2 text-lg sm:text-xl font-semibold">ทางเลือกที่พร้อมให้มนุษย์พิจารณา</h3>
              <p className={`mt-2 text-sm leading-6 ${muted}`}>ดำเนิน feasibility study แบบมีเงื่อนไขก่อน commit การลงทุน โดยกำหนด owner และวันครบกำหนดสำหรับช่องว่างข้อมูลแต่ละข้อ</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className={`rounded-xl border p-3 ${line} ${surface}`}><div className={`font-mono text-[9px] ${soft}`}>CONFIDENCE</div><div className="mt-1 text-xl font-semibold text-orange-500">0.78</div><div className={`mt-1 text-[11px] ${soft}`}>calibrated, not certainty</div></div>
                <div className={`rounded-xl border p-3 ${line} ${surface}`}><div className={`font-mono text-[9px] ${soft}`}>HUMAN GATE</div><div className="mt-1 text-sm font-semibold text-orange-500">REQUIRED</div><div className={`mt-1 text-[11px] ${soft}`}>ไม่มีการอนุมัติอัตโนมัติ</div></div>
              </div>
              <button type="button" onClick={() => setShowAuditRecord((value) => !value)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500/35 bg-orange-500/10 px-4 py-3 text-sm font-semibold text-orange-400 transition hover:bg-orange-500/20 cursor-pointer">
                <FileText className="h-4 w-4" /> {showAuditRecord ? 'ซ่อนตัวอย่าง Audit Record' : 'ดูตัวอย่าง Audit Record'}
              </button>
              {showAuditRecord && <div className={`mt-3 rounded-xl border p-4 font-mono text-[11px] leading-6 ${line} ${isLight ? 'bg-white' : 'bg-black/30'} ${muted}`}>
                <div>Decision ID: FK-EXAMPLE-001</div><div>Evidence sources: 17</div><div>Claims checked: 23 / 26</div><div>Unresolved: 3</div><div>Assumptions: 4</div><div>Audit status: Review required</div>
              </div>}
            </div>
          </div>
        </div>
      </section>

      <section id="intelligence" className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-14 py-10 sm:py-16 lg:py-24">
        <div className="mb-5 sm:mb-10 max-w-2xl">
          <div className="font-mono text-[10px] sm:text-xs tracking-[.18em] text-orange-500">Firekeeper ทำงานอย่างไร</div>
          <h2 className="mt-1 text-xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">ไม่รีบให้คำตอบ<br /><span className={muted}>แต่ทำให้เหตุผลตรวจสอบได้</span></h2>
        </div>
        <div className="grid gap-2.5 sm:gap-4 md:grid-cols-3">
          <div className={`rounded-2xl border p-5 sm:p-6 ${line} ${surface}`}>
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
            <h3 className="mt-4 sm:mt-5 text-base sm:text-lg font-semibold">ธรรมาภิบาลการตัดสินใจ</h3>
            <p className={`mt-1.5 sm:mt-2 text-xs sm:text-sm leading-5 sm:leading-6 ${muted}`}>จำแนกสถานะความรู้และตรวจสอบความสอดคล้องของผลลัพธ์</p>
          </div>
          <div className={`rounded-2xl border p-5 sm:p-6 ${line} ${surface}`}>
            <Check className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
            <h3 className="mt-4 sm:mt-5 text-base sm:text-lg font-semibold">เหตุผลที่เริ่มจากหลักฐาน</h3>
            <p className={`mt-1.5 sm:mt-2 text-xs sm:text-sm leading-5 sm:leading-6 ${muted}`}>ตรวจสอบสายเหตุผลและหลักฐานก่อนแสดงผล</p>
          </div>
          <div className={`rounded-2xl border p-5 sm:p-6 ${line} ${surface}`}>
            <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
            <h3 className="mt-4 sm:mt-5 text-base sm:text-lg font-semibold">มนุษย์ยังคงควบคุมการตัดสินใจ</h3>
            <p className={`mt-1.5 sm:mt-2 text-xs sm:text-sm leading-5 sm:leading-6 ${muted}`}>ระบบสนับสนุนการตัดสินใจ ไม่ใช่ผู้ตัดสินใจแทนมนุษย์</p>
          </div>
        </div>

        {/* Decision Intelligence */}
        <div className="mt-10 sm:mt-14">
          <div className="font-mono text-[10px] sm:text-xs tracking-[.18em] text-orange-500">ระบบปัญญาเพื่อการตัดสินใจ</div>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['12', 'ขั้นตอนการคิดวิเคราะห์', 'กระบวนการให้เหตุผลอย่างเป็นระบบ'],
              ['หลักฐาน', 'First', 'ตรวจสอบข้ออ้างก่อนสรุปผล'],
              ['มนุษย์', 'การกำกับและตัดสินใจได้', 'อำนาจการตัดสินใจยังอยู่ที่ผู้ใช้'],
              ['ตรวจสอบย้อนหลัง', 'พร้อมตรวจสอบ', 'บริบทการตัดสินใจตรวจสอบได้'],
            ].map(([value, label, detail]) => (
              <div key={label} className={`rounded-2xl border p-4 sm:p-5 ${line} ${surface}`}>
                <div className="font-mono text-xl sm:text-2xl font-semibold text-orange-500">{value}</div>
                <div className="mt-1 text-sm font-semibold">{label}</div>
                <div className={`mt-1.5 text-[11px] leading-5 ${soft}`}>{detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cognitive Pipeline */}
        <div className="mt-10 sm:mt-14">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="font-mono text-[10px] sm:text-xs tracking-[.18em] text-orange-500">กระบวนการคิดวิเคราะห์</div>
              <h3 className="mt-1 text-lg sm:text-2xl font-semibold">จากคำถามสู่การตัดสินใจที่ตรวจสอบได้</h3>
            </div>
            <p className={`text-[11px] sm:text-xs ${soft}`}>สถาปัตยกรรม 12 ขั้นตอน · ใช้หลักฐาน · มนุษย์กำกับ</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {STAGES.map((stage, index) => (
              <div key={stage.id} className={`rounded-xl border p-3 ${line} ${surface}`}>
                <div className="font-mono text-[9px] text-orange-500">{stage.id}</div>
                <div className="mt-1 text-[10px] sm:text-xs font-semibold leading-4">{stage.en}</div>
              </div>
            ))}
          </div>
        </div>

      </section>

      <section className="relative z-10 mx-auto max-w-[1100px] px-4 sm:px-8 lg:px-14 pb-14 sm:pb-20 lg:pb-28 text-center">
        <div className={`rounded-2xl sm:rounded-[2rem] border px-4 sm:px-6 py-8 sm:py-12 ${line} ${surface}`}>
          <Flame className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-orange-500 fk-flame" fill="currentColor" />
          <h2 className="mt-4 text-2xl sm:text-4xl lg:text-5xl font-semibold">ให้ AI ช่วยคิด</h2>
          <p className={`mx-auto mt-2.5 max-w-xl text-sm sm:text-base lg:text-lg ${muted}`}>แต่ให้มนุษย์เป็นผู้ตัดสินใจในท้ายที่สุด</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button type="button" onClick={enter} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-black transition hover:bg-orange-400 cursor-pointer">
              เข้าสู่ FIRE KEEPER <ArrowRight className="h-4 w-4" />
            </button>
            <a href="https://github.com/punn-pca/firekeeper-core/releases/download/v1.0.0-mobile/firekeeper-standalone.apk" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500/10 border border-orange-500/30 px-6 py-3.5 text-sm sm:text-base text-orange-400 transition hover:bg-orange-500/20 hover:border-orange-500 hover:text-orange-300">
              <Download className="h-4 w-4" /> ดาวน์โหลดแอปมือถือ (Android)
            </a>
          </div>
        </div>
      </section>

      {entering && <div className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[2px] transition-opacity" />}
    </main>
  );
};
