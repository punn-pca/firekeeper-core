import React, { useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, CircleDot,
  Database, FileCheck2, GitBranch, MapPin, ShieldCheck, Target, UserCheck,
  XCircle, ArrowLeft, RotateCcw
} from 'lucide-react';

type EvidenceStatus = 'VERIFIED' | 'UNVERIFIED' | 'UNKNOWN';

interface EvidenceItem {
  id: string;
  label: string;
  value: string;
  status: EvidenceStatus;
  source: string;
}

const evidence: EvidenceItem[] = [
  { id: 'E1', label: 'อุบัติเหตุย้อนหลัง', value: 'เกิดเหตุซ้ำในจุดเสี่ยงช่วง 16:00–19:00', status: 'VERIFIED', source: 'ข้อมูลเหตุการณ์จำลอง · 90 วัน' },
  { id: 'E2', label: 'ปริมาณการจราจร', value: 'ความหนาแน่นสูงในช่วงเวลาเร่งด่วน', status: 'VERIFIED', source: 'ข้อมูลจราจรจำลอง · รายชั่วโมง' },
  { id: 'E3', label: 'สถานศึกษาใกล้เคียง', value: 'มีสถานศึกษาอยู่ในรัศมี 500 เมตร', status: 'VERIFIED', source: 'ข้อมูลสถานที่จำลอง' },
  { id: 'E4', label: 'ความเร็วเฉลี่ย', value: 'ยังไม่มีข้อมูลความเร็วรายช่วงเวลาที่เพียงพอ', status: 'UNKNOWN', source: 'Data gap' },
];

const options = [
  {
    id: 'A',
    title: 'ปรับสัญญาณไฟจราจร',
    summary: 'จัดจังหวะสัญญาณใหม่เพื่อลดคอขวดช่วงเร่งด่วน',
    impact: 'MEDIUM',
    reversibility: 'สูง',
    evidence: 'MODERATE',
  },
  {
    id: 'B',
    title: 'เพิ่มมาตรการควบคุมความเร็ว',
    summary: 'เพิ่มมาตรการลดความเร็วและการเฝ้าระวังในจุดเสี่ยง',
    impact: 'MEDIUM',
    reversibility: 'สูง',
    evidence: 'MODERATE',
  },
  {
    id: 'C',
    title: 'ดำเนินการ A + B ร่วมกัน',
    summary: 'จัดการทั้งการไหลของจราจรและปัจจัยด้านความเร็ว',
    impact: 'HIGH',
    reversibility: 'สูง',
    evidence: 'STRONG',
  },
];

const stages = [
  ['01', 'Intent Definition', 'ระบุโจทย์: จัดลำดับพื้นที่ที่ควรได้รับการแก้ไขก่อน'],
  ['02', 'Context Understanding', 'ช่วงเวลา พื้นที่ ผู้ใช้ถนน และข้อจำกัด'],
  ['03', 'Purpose & Scope', 'กำหนดเป้าหมายเป็นการลดความเสี่ยง ไม่ใช่การสั่งการอัตโนมัติ'],
  ['04', 'Data Structuring', 'จัดข้อมูลอุบัติเหตุ จราจร สถานที่ และช่องว่างข้อมูล'],
  ['05', 'Relationship Modeling', 'เชื่อมความสัมพันธ์ระหว่างเวลา ปริมาณรถ และความเสี่ยง'],
  ['06', 'Evidence Evaluation', 'แยกหลักฐานที่ตรวจสอบได้ออกจากข้อสันนิษฐาน'],
  ['07', 'Hypothesis Formation', 'สร้างทางเลือก A/B/C เพื่อเปรียบเทียบ'],
  ['08', 'Risk & Critique Analysis', 'ตรวจความเสี่ยงและข้อมูลที่ยังไม่เพียงพอ'],
  ['09', 'Strategic Options', 'จัดอันดับทางเลือกตามผลกระทบ ความเสี่ยง และหลักฐาน'],
  ['10', 'Analysis Communication', 'สร้าง Decision Brief ที่อ่านได้โดยผู้มีอำนาจตัดสินใจ'],
  ['11', 'Review & Verification', 'ตรวจความสอดคล้องและห้ามยกระดับช่องว่างเป็นข้อเท็จจริง'],
  ['12', 'Human Agency', 'ส่ง Recommendation ให้มนุษย์อนุมัติ/ปฏิเสธ'],
];

function statusClass(status: EvidenceStatus) {
  if (status === 'VERIFIED') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (status === 'UNKNOWN') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
}

export function FirekeeperCityDecisionLab({ onBack }: { onBack: () => void }) {
  const [decision, setDecision] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [showTrace, setShowTrace] = useState(false);
  const [selectedOption, setSelectedOption] = useState('C');

  const selected = useMemo(() => options.find(o => o.id === selectedOption) ?? options[2], [selectedOption]);

  const reset = () => {
    setDecision('PENDING');
    setSelectedOption('C');
    setShowTrace(false);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-mono text-slate-300 hover:border-amber-500/40 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> BACK
          </button>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">
            <CircleDot className="h-3 w-3" /> Hackathon PoC · Demo Dataset
          </div>
        </div>

        <header className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-4xl">
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-400">FIRE KEEPER · CITY DECISION INTELLIGENCE</div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">Bangkok City Decision Lab</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                เปลี่ยนข้อมูลเมืองที่กระจัดกระจายให้เป็น <strong className="text-white">Evidence → Risk → Options → Recommendation</strong>
                โดยไม่ให้ AI กลายเป็นผู้ตัดสินใจแทนมนุษย์
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <div className="text-[10px] font-mono text-emerald-400">GOVERNANCE</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-white"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Human Decision Authority</div>
            </div>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_1.35fr_1fr]">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-sky-400">
              <Database className="h-4 w-4" /> 01 · CITY DATA
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white"><MapPin className="h-4 w-4 text-amber-400" /> ถนนสุขุมวิท · จุดเสี่ยง X</div>
              <p className="mt-2 text-xs leading-6 text-slate-400">โจทย์: พื้นที่ใดควรได้รับการแก้ไขปัญหาการเดินทางและความปลอดภัยก่อน?</p>
            </div>
            <div className="mt-4 space-y-2">
              {evidence.map(item => (
                <div key={item.id} className="rounded-xl border border-white/5 bg-black/10 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-mono ${statusClass(item.status)}`}>{item.status}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{item.value}</p>
                  <p className="mt-1 text-[9px] font-mono text-slate-600">{item.id} · {item.source}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-400">
              <Activity className="h-4 w-4" /> 02 · FIRE KEEPER ANALYSIS
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-mono text-slate-500">PRIORITY</span>
                <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-[10px] font-mono text-rose-400">HIGH PRIORITY</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                หลักฐานปัจจุบันชี้ว่าจุดนี้มีความเสี่ยงสูงในช่วงเร่งด่วน แต่ยังขาดข้อมูลความเร็วเฉลี่ยรายช่วงเวลา
                จึงไม่ควรอ้างผลลัพธ์เชิงปริมาณที่ยังพิสูจน์ไม่ได้
              </p>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {options.map(option => (
                <button key={option.id} onClick={() => { setSelectedOption(option.id); setDecision('PENDING'); }}
                  className={`rounded-xl border p-3 text-left transition-all ${selectedOption === option.id ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/10 bg-black/10 hover:border-white/20'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">OPTION {option.id}</span>
                    <span className="text-[9px] font-mono text-slate-500">{option.evidence}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-300">{option.title}</div>
                  <div className="mt-1 text-[10px] leading-4 text-slate-500">{option.summary}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">Recommendation</div>
              <div className="mt-1 text-sm font-bold text-white">{selected.title}</div>
              <p className="mt-1 text-xs leading-5 text-slate-400">{selected.summary}</p>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[10px] leading-5 text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span><strong>UNCERTAINTY:</strong> ยังไม่มีข้อมูลความเร็วเฉลี่ยรายช่วงเวลาเพียงพอ ต้องตรวจสอบก่อนประเมินผลเชิงปริมาณ</span>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400">
              <UserCheck className="h-4 w-4" /> 03 · HUMAN DECISION
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-4">
              <div className="text-[10px] font-mono text-slate-500">SELECTED RECOMMENDATION</div>
              <div className="mt-2 text-base font-bold text-white">{selected.title}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded-lg border border-white/5 p-2"><span className="text-slate-500">Impact</span><div className="mt-1 text-slate-200">{selected.impact}</div></div>
                <div className="rounded-lg border border-white/5 p-2"><span className="text-slate-500">Reversibility</span><div className="mt-1 text-slate-200">{selected.reversibility}</div></div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button onClick={() => setDecision('APPROVED')} disabled={decision === 'APPROVED'}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition ${decision === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'}`}>
                <CheckCircle2 className="h-4 w-4" /> APPROVE RECOMMENDATION
              </button>
              <button onClick={() => setDecision('REJECTED')} disabled={decision === 'REJECTED'}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition ${decision === 'REJECTED' ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-rose-500/30 text-rose-300 hover:bg-rose-500/10'}`}>
                <XCircle className="h-4 w-4" /> REJECT
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3">
              <div className="text-[10px] font-mono text-slate-500">DECISION STATUS</div>
              <div className={`mt-1 text-sm font-bold ${decision === 'APPROVED' ? 'text-emerald-400' : decision === 'REJECTED' ? 'text-rose-400' : 'text-amber-400'}`}>
                {decision === 'APPROVED' ? 'APPROVED BY HUMAN' : decision === 'REJECTED' ? 'REJECTED BY HUMAN' : 'PENDING HUMAN DECISION'}
              </div>
              <p className="mt-2 text-[10px] leading-5 text-slate-500">Demo นี้จำลอง approval state เพื่อแสดง Human Decision Gate; ไม่ได้ส่งคำสั่งปฏิบัติการไปยังหน่วยงานจริง</p>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03]">
          <button onClick={() => setShowTrace(v => !v)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
            <div className="flex items-center gap-3">
              <GitBranch className="h-4 w-4 text-sky-400" />
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-sky-400">PUNN-PCA 12-STAGE TRACE</div>
                <div className="mt-1 text-[10px] text-slate-500">แสดงเส้นทางจากข้อมูล → การประเมินหลักฐาน → Recommendation → Human Agency</div>
              </div>
            </div>
            {showTrace ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </button>
          {showTrace && (
            <div className="border-t border-white/10 p-4">
              <div className="grid gap-2 md:grid-cols-2">
                {stages.map(([num, name, desc]) => (
                  <div key={num} className="flex gap-3 rounded-xl border border-white/5 bg-black/10 p-3">
                    <span className="text-[10px] font-mono text-amber-500">{num}</span>
                    <div><div className="text-xs font-semibold text-slate-200">{name}</div><div className="mt-1 text-[10px] leading-5 text-slate-500">{desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/[0.03] px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
            <FileCheck2 className="h-4 w-4 text-amber-500" />
            Evidence quality is separated from claims · Unknown stays Unknown · AI does not create approval
          </div>
          <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-mono text-slate-400 hover:text-white">
            <RotateCcw className="h-3 w-3" /> RESET DEMO
          </button>
        </div>
      </div>
    </div>
  );
}
