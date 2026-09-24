import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, KeyRound, MessageSquareText, Settings2, ShieldCheck, Sparkles, Users } from 'lucide-react';

interface GettingStartedGuideProps {
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onStartAnalysis: () => void;
  onOpenPlans: () => void;
}

export const GettingStartedGuide: React.FC<GettingStartedGuideProps> = ({
  isAuthenticated,
  onOpenAuth,
  onOpenSettings,
  onStartAnalysis,
  onOpenPlans,
}) => {
  const [completed, setCompleted] = useState<number[]>([]);
  const steps = useMemo(() => [
    {
      title: isAuthenticated ? 'ยืนยันว่าพร้อมใช้งาน' : 'เข้าสู่ระบบก่อนเริ่ม',
      detail: isAuthenticated ? 'คุณเข้าสู่ระบบแล้ว สิทธิ์แพ็กเกจจะถูกใช้กับการวิเคราะห์และการตั้งค่าโมเดลทันที' : 'เข้าสู่ระบบเพื่อบันทึกประวัติ ใช้สิทธิ์แพ็กเกจ และเชื่อมต่อ API ของคุณอย่างปลอดภัย',
      action: isAuthenticated ? 'พร้อมแล้ว' : 'เข้าสู่ระบบ',
      icon: KeyRound,
      onAction: isAuthenticated ? undefined : onOpenAuth,
    },
    {
      title: 'เลือกโมเดล AI ที่จะใช้',
      detail: 'เปิดตั้งค่าโมเดล แล้วเลือกผู้ให้บริการ ระบุ API key ของคุณถ้าจำเป็น และกด Test Connection ก่อนใช้งานจริง',
      action: 'ตั้งค่าโมเดล',
      icon: Settings2,
      onAction: onOpenSettings,
    },
    {
      title: 'เริ่มการวิเคราะห์ครั้งแรก',
      detail: 'บอกเป้าหมาย ทางเลือก ข้อจำกัด และข้อมูลที่มีให้ชัดเจน ระบบจะช่วยจัดโครงสร้างการคิดและระบุสิ่งที่ควรตรวจสอบ',
      action: 'เริ่มวิเคราะห์',
      icon: MessageSquareText,
      onAction: onStartAnalysis,
    },
    {
      title: 'ตรวจผลก่อนตัดสินใจ',
      detail: 'แยกข้อเท็จจริง ข้อสันนิษฐาน ความเสี่ยง และหลักฐานออกจากกัน แล้วให้มนุษย์เป็นผู้ตัดสินใจขั้นสุดท้าย',
      action: 'ทำเครื่องหมายว่าอ่านแล้ว',
      icon: ShieldCheck,
    },
    {
      title: 'ทำงานร่วมกันเมื่อพร้อม',
      detail: 'ดูสิทธิ์และแพ็กเกจเพื่อใช้ Workspace, Approval และ Governance ตามระดับที่องค์กรของคุณได้รับ',
      action: 'ดูสิทธิ์และแพ็กเกจ',
      icon: Users,
      onAction: onOpenPlans,
    },
  ], [isAuthenticated, onOpenAuth, onOpenPlans, onOpenSettings, onStartAnalysis]);

  const toggleComplete = (index: number) => setCompleted((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  const progress = Math.round((completed.length / steps.length) * 100);

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 pb-8">
      <header className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-[#111827] to-[#0b1220] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-amber-300"><Sparkles className="h-6 w-6" /></div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs font-bold tracking-widest text-amber-400">GETTING STARTED</p>
            <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">เริ่มใช้ FIRE KEEPER ทีละขั้นตอน</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">ใช้เวลาประมาณ 5 นาที: ตั้งค่าการใช้งาน ส่งโจทย์แรก และอ่านผลอย่างมีหลักฐานประกอบ</p>
          </div>
        </div>
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs font-mono text-slate-400"><span>ความคืบหน้า</span><span>{completed.length}/{steps.length} ขั้นตอน · {progress}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      </header>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const done = completed.includes(index);
          const Icon = step.icon;
          return (
            <article key={step.title} className={`rounded-2xl border p-5 transition-colors ${done ? 'border-emerald-500/35 bg-emerald-500/[0.06]' : 'border-white/10 bg-[#0b1220]'}`}>
              <div className="flex gap-4">
                <button type="button" aria-label={`ทำขั้นตอน ${index + 1} เสร็จแล้ว`} onClick={() => toggleComplete(index)} className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold ${done ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-slate-600 text-slate-300 hover:border-amber-400'}`}>{done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><Icon className="h-4 w-4 text-amber-400" /><h2 className="font-bold text-white">{step.title}</h2></div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{step.detail}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {step.onAction && <button type="button" onClick={() => { step.onAction?.(); toggleComplete(index); }} className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300">{step.action}<ArrowRight className="h-3.5 w-3.5" /></button>}
                    {!step.onAction && <button type="button" onClick={() => toggleComplete(index)} className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-400">{done ? 'ยกเลิกสถานะ' : step.action}</button>}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <p className="rounded-xl border border-sky-500/25 bg-sky-500/[0.06] p-4 text-sm leading-6 text-sky-100">FIRE KEEPER ช่วยจัดระเบียบข้อมูลและตรวจสอบเหตุผล แต่การตัดสินใจขั้นสุดท้ายยังเป็นของคุณเสมอ</p>
    </section>
  );
};
