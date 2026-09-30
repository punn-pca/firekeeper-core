import React, { useState } from 'react';
import { ArrowUpRight, FileText, Lightbulb, ShieldCheck, UserRound } from 'lucide-react';

const nodes = [
  { title: 'หลักฐาน', subtitle: 'EVIDENCE', text: 'ตรวจแหล่งที่มาและข้อมูลที่สนับสนุนข้อสรุป', icon: FileText, className: 'evidence' },
  { title: 'สมมติฐาน', subtitle: 'HYPOTHESES', text: 'สำรวจคำอธิบายและทางเลือกที่แตกต่าง', icon: Lightbulb, className: 'hypothesis' },
  { title: 'ความเสี่ยง', subtitle: 'RISK', text: 'มองข้อขัดแย้ง ช่องว่าง และผลที่อาจตามมา', icon: ShieldCheck, className: 'risk' },
  { title: 'มนุษย์ทบทวน', subtitle: 'HUMAN REVIEW', text: 'คุณตรวจทานและเลือกสิ่งที่จะนำไปใช้', icon: UserRound, className: 'human' },
];

export function DecisionObservatory() {
  const [selected, setSelected] = useState(0);
  return <div className="fk-instrument relative min-w-0" aria-label="ภาพจำลองกระบวนการวิเคราะห์">
    <div className="fk-instrument-header"><span>DECISION FIELD / 001</span><span className="fk-eyebrow">ภาพจำลองกระบวนการ</span></div>
    <div className="fk-constellation">
      <div className="fk-orbit fk-orbit-outer" aria-hidden="true" /><div className="fk-orbit fk-orbit-inner" aria-hidden="true" />
      <svg className="fk-connections" viewBox="0 0 500 450" preserveAspectRatio="none" aria-hidden="true"><path d="M105 98 Q250 90 250 225 M397 98 Q250 100 250 225 M105 345 Q250 350 250 225 M397 345 Q250 340 250 225" /><path className="fk-flow" d="M105 98 Q250 90 250 225 M397 98 Q250 100 250 225 M105 345 Q250 350 250 225 M397 345 Q250 340 250 225" /></svg>
      <div className="fk-decision-core"><span className="fk-core-symbol" aria-hidden="true">✧</span><span className="fk-core-kicker">DECISION</span><strong>เห็นเหตุผล<br />ก่อนเลือกทาง</strong><span className="fk-core-caption">AI assists. Humans decide.</span></div>
      {nodes.map(({ title, subtitle, icon: Icon, className }, index) => <button key={title} type="button" onClick={() => setSelected(index)} aria-pressed={selected === index} className={`fk-node fk-node-${className} ${selected === index ? 'is-selected' : ''}`}><Icon size={18} /><span className="fk-node-subtitle">{subtitle}</span><strong>{title}</strong></button>)}
    </div>
    <div className="fk-instrument-detail" aria-live="polite"><span><strong>{nodes[selected].title}</strong><span>{nodes[selected].text}</span></span><ArrowUpRight size={20} aria-hidden="true" /></div>
  </div>;
}
