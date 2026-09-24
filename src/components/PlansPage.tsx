import { TeamWorkspacePanel } from './TeamWorkspacePanel';
import React from 'react';

const plans = [
  { id: 'free', name: 'Free', price: 'ฟรี', description: 'Explore AI และเริ่มสร้าง Governance ส่วนตัว', features: ['DeepSeek ระบบ', '20 analyses/วัน', 'Fact / Hypothesis / Risk', 'Audit Log 7 วัน'] },
  { id: 'byok', name: 'Starter', price: '490 บาท/เดือน', description: 'Personal Governance พร้อมใช้โมเดลของคุณเอง', features: ['เชื่อม OpenAI, Claude, Gemini และอื่น ๆ', 'Governance Pipeline + Trace', 'ไม่คิดค่า Token เพิ่ม', 'Export พื้นฐาน'] },
  { id: 'professional', name: 'Professional', price: '990 บาท/เดือน', description: 'Decision Intelligence สำหรับนักวิเคราะห์และที่ปรึกษา', features: ['วิเคราะห์ตาม Fair Use', 'ประวัติระยะยาว', 'Export PDF / HTML / JSON', 'Decision Report และ Template'], featured: true },
  { id: 'team', name: 'Team', price: '4,900 บาท/เดือน', description: 'สำหรับทีมสูงสุด 5 คน', features: ['Shared Workspace', 'Role และ Review', 'Human Approval Workflow', 'Audit Log 90 วัน'] },
  { id: 'business', name: 'Business', price: '19,000 บาท/เดือน', description: 'สำหรับองค์กรขนาดกลาง', features: ['ผู้ใช้ 20 คน', 'Admin Policy', 'Audit Log 365 วัน', 'Governance Dashboard'] },
  { id: 'enterprise', name: 'Enterprise', price: 'Contact Sales', description: 'Governance สำหรับองค์กรที่มีข้อกำกับสูง', features: ['SSO / SAML / OIDC', 'Dedicated Audit Store', 'Custom Governance Rules', 'SLA และ Dedicated Support'] },
];

export const PlansPage: React.FC<{ onBack?: () => void; onCheckout?: (planId: string) => void }> = ({ onBack, onCheckout }) => (
  <main className="min-h-screen px-4 py-10 sm:px-8 bg-[#07090D] text-white">
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div><p className="text-xs font-mono text-amber-400 tracking-widest">FIREKEEPER PLANS</p><h1 className="text-3xl sm:text-4xl font-black mt-2">เลือกแพ็กเกจที่เหมาะกับการตัดสินใจของคุณ</h1><p className="text-slate-400 mt-2">ใช้ AI ค่ายไหนก็ได้ แล้วเพิ่ม Governance Layer ให้ตรวจสอบได้</p></div>
        {onBack && <button onClick={onBack} className="px-3 py-2 rounded-lg border border-white/10 text-sm text-slate-300">กลับ</button>}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map(plan => <article key={plan.id} className={`rounded-2xl border p-5 ${plan.featured ? 'border-amber-500/70 bg-amber-500/10' : 'border-white/10 bg-white/[0.03]'}`}>
          {plan.featured && <span className="text-[10px] font-mono text-amber-300">แนะนำ</span>}
          <h2 className="text-xl font-bold mt-1">{plan.name}</h2><p className="text-amber-400 font-mono text-sm mt-2">{plan.price}</p><p className="text-slate-400 text-sm mt-2">{plan.description}</p>
          <ul className="mt-5 space-y-2 text-sm text-slate-300">{plan.features.map(feature => <li key={feature}>✓ {feature}</li>)}</ul>
          <button type="button" onClick={() => (plan.id === 'pilot' || plan.id === 'enterprise' ? window.location.href = 'mailto:hello@firekeeper.site' : onCheckout?.(plan.id))} className="mt-6 w-full rounded-lg border border-amber-500/40 bg-amber-500/10 py-2 text-sm text-amber-300">{plan.id === 'free' ? 'เริ่มใช้งาน' : plan.id === 'pilot' || plan.id === 'enterprise' ? 'ติดต่อทีม' : 'สมัครแพ็กเกจ'}</button>
        </article>)}
      </div>
      <section className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-6 sm:p-8">
        <p className="text-xs font-mono tracking-widest text-amber-400">FIREKEEPER GOVERNANCE VALIDATION PROGRAM</p>
        <h2 className="mt-2 text-2xl font-bold">Pilot สำหรับพิสูจน์การใช้งานจริง</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">ทดลองใช้ FIREKEEPER กับ Workflow จริงขององค์กร ก่อนตัดสินใจลงทุนระยะยาว โดยมุ่งวัดคุณภาพการตัดสินใจ หลักฐาน การอนุมัติ และความสามารถตรวจสอบย้อนหลัง</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/20 p-5">
            <h3 className="font-bold text-amber-300">Standard · 49,000 บาท</h3>
            <p className="mt-1 text-sm text-slate-400">30 วัน · 5 ผู้ใช้ · 1 Use Case</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300"><li>✓ Kickoff Workshop</li><li>✓ Governance Assessment</li><li>✓ Pilot Findings Report</li><li>✓ Executive Recommendation</li></ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-5">
            <h3 className="font-bold text-amber-300">Professional · 79,000 บาท</h3>
            <p className="mt-1 text-sm text-slate-400">60 วัน · 10 ผู้ใช้ · 2 Use Cases</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300"><li>✓ รวมทุกอย่างใน Standard</li><li>✓ Progress Review สูงสุด 2 ครั้ง</li><li>✓ Executive Review Session</li><li>✓ 12-Month Governance Roadmap</li></ul>
          </div>
        </div>
        <div className="mt-6 grid gap-4 text-sm text-slate-300 md:grid-cols-3">
          <div><h3 className="font-bold text-white">สิ่งที่ส่งมอบ</h3><p className="mt-1 text-slate-400">Assessment Report, Pilot Results, Executive Summary และ Governance Roadmap</p></div>
          <div><h3 className="font-bold text-white">รับประกันการส่งมอบ</h3><p className="mt-1 text-slate-400">หากส่งมอบรายงานตามขอบเขตไม่ครบ จะดำเนินการต่อให้ครบโดยไม่มีค่าใช้จ่ายเพิ่ม</p></div>
          <div><h3 className="font-bold text-white">ไม่รวม</h3><p className="mt-1 text-slate-400">Custom Development, System Integration, Data Migration, Penetration Test และ SLA ระดับ Enterprise</p></div>
        </div>
        <p className="mt-6 border-t border-white/10 pt-4 text-xs leading-5 text-slate-500">กำหนด Success Criteria ร่วมกันก่อนเริ่มโครงการ · ไม่รับประกัน ROI หรือผลทางกฎหมาย · ค่า API ของผู้ให้บริการโมเดลไม่รวมในค่าบริการ · หากซื้อ Business หรือ Enterprise ภายใน 30 วัน นำค่าบริการ Pilot 50% หักจากค่าบริการปีแรกได้</p>
      </section>
      <p className="text-xs text-slate-500 mt-8">หมายเหตุ: ค่าใช้บริการโมเดล/API ของผู้ให้บริการภายนอกไม่รวมอยู่ในราคา Firekeeper</p>
    <TeamWorkspacePanel />
      </div>
  </main>
);
