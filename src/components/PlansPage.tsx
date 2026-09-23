import React from 'react';

const plans = [
  { id: 'free', name: 'Free', price: 'ฟรี', description: 'เริ่มต้นใช้งาน Firekeeper', features: ['DeepSeek ระบบ', '30 analyses/วัน', 'Fact / Hypothesis / Risk', 'Audit Log พื้นฐาน'] },
  { id: 'byok', name: 'BYOK', price: 'ฟรี / 199 บาท', description: 'ใช้โมเดลและ API ของคุณเอง', features: ['เชื่อม OpenAI, Claude, Gemini และอื่น ๆ', 'เลือกโมเดลเอง', 'ไม่คิดค่า Token เพิ่ม', 'Export JSON / HTML'] },
  { id: 'professional', name: 'Professional', price: '499 บาท/เดือน', description: 'สำหรับนักวิเคราะห์และที่ปรึกษา', features: ['วิเคราะห์ตาม Fair Use', 'ประวัติระยะยาว', 'Export PDF / HTML / JSON', 'Template และ Risk Register'], featured: true },
  { id: 'team', name: 'Team', price: '4,900 บาท/เดือน', description: 'สำหรับทีมสูงสุด 5 คน', features: ['Shared Workspace', 'Role และ Review', 'Human Approval Workflow', 'Audit Log 90 วัน'] },
  { id: 'business', name: 'Business', price: '19,000 บาท/เดือน', description: 'สำหรับองค์กรขนาดกลาง', features: ['ผู้ใช้ 20 คน', 'Admin Policy', 'Audit Log 365 วัน', 'Governance Dashboard'] },
  { id: 'enterprise', name: 'Enterprise', price: 'เริ่ม 300,000 บาท/ปี', description: 'สำหรับองค์กรที่มีข้อกำกับสูง', features: ['SSO / SAML / OIDC', 'Dedicated Audit Store', 'Custom Governance Rules', 'SLA และ Dedicated Support'] },
];

export const PlansPage: React.FC<{ onBack?: () => void; onCheckout?: (planId: string) => void }> = ({ onBack, onCheckout }) => {
  return (
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
          <button type="button" onClick={() => onCheckout?.(plan.id)} className="mt-6 w-full rounded-lg border border-amber-500/40 bg-amber-500/10 py-2 text-sm text-amber-300">{plan.id === 'free' ? 'เริ่มใช้งาน' : 'สมัครแพ็กเกจ'}</button>
        </article>)}
      </div>
      <p className="text-xs text-slate-500 mt-8">หมายเหตุ: ค่าใช้บริการโมเดล/API ของผู้ให้บริการภายนอกไม่รวมอยู่ในราคา Firekeeper</p>
    </div>
    </main>
  );
};
