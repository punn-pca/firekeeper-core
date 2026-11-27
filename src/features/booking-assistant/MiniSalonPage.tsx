import React, { useState } from "react";
import { ArrowLeft, CalendarDays, Clock3, Scissors, Sparkles, ShieldCheck, Send, Copy, CheckCircle2 } from "lucide-react";
import type { User } from "firebase/auth";

type Props = { user: User | null; onBack: () => void; onOpenAuth: () => void };

const services = [
  { name: "ตัดผม", detail: "ปรึกษาทรงผมที่เหมาะกับคุณ", icon: Scissors },
  { name: "สระและไดร์", detail: "ดูแลเส้นผมในวันสบาย ๆ", icon: Sparkles },
  { name: "ทำสี / ทรีตเมนต์", detail: "สอบถามบริการและการดูแลก่อนทำ", icon: Sparkles },
];

export function MiniSalonPage({ user, onBack, onOpenAuth }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [copied, setCopied] = useState(false);

  async function askAI() {
    const q = question.trim();
    if (!q || busy) return;
    if (!user) { onOpenAuth(); return; }
    setBusy(true); setError(""); setAnswer("");
    try {
      const token = await user.getIdToken();
      const context = [
        "คุณคือผู้ช่วยให้ข้อมูลและช่วยเตรียมคำขอจองคิวของ Mini Salon ภายใน FIREKEEPER.",
        "ตอบภาษาไทยอย่างสุภาพ กระชับ และถามข้อมูลที่จำเป็นเท่านั้น.",
        "ห้ามแต่งราคา เวลาเปิดร้าน ระยะเวลาบริการ หรือคิวว่าง หากไม่มีข้อมูลที่ยืนยันได้ให้แจ้งตรง ๆ.",
        "คุณไม่มีสิทธิ์สร้างหรือยืนยันการจอง คิวจะสำเร็จต่อเมื่อร้านตรวจสอบและยืนยันโดยมนุษย์.",
        "ข้อมูลที่ลูกค้าเลือกไว้: "+JSON.stringify({service,date,time}),
        "คำถามลูกค้า: "+q
      ].join("\n");
      const response = await fetch("/api/pca/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer "+token, "Accept": "text/event-stream" },
        body: JSON.stringify({ question: context, history: [], attachments: [] })
      });
      if (response.status === 401) { onOpenAuth(); throw new Error("กรุณาเข้าสู่ระบบแล้วลองอีกครั้ง"); }
      if (!response.ok || !response.body) throw new Error("ระบบ AI ยังไม่พร้อมใช้งาน");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", output = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n"); buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const dataLine = frame.split("\n").find(line => line.startsWith("data:"));
          if (!dataLine) continue;
          const raw = dataLine.slice(5).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const data = JSON.parse(raw);
            output += data.delta?.text ?? data.text ?? data.content ?? data.token ?? "";
            if (output) setAnswer(output);
          } catch { /* Ignore malformed stream frames. */ }
        }
      }
      if (!output.trim()) setAnswer("ยังไม่ได้รับคำตอบจาก AI กรุณาลองใหม่อีกครั้ง");
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally { setBusy(false); }
  }

  const requestText = [
    "คำขอจองคิว Mini Salon (รอร้านยืนยัน)",
    "ชื่อ: "+customerName,
    "เบอร์โทร: "+phone,
    "บริการ: "+service,
    "วันที่ต้องการ: "+(date || "ยังไม่ระบุ"),
    "เวลาที่ต้องการ: "+(time || "ยังไม่ระบุ"),
    "หมายเหตุ: ยังไม่ถือเป็นการจองจนกว่าร้านจะยืนยัน"
  ].join("\n");

  async function copyRequest() {
    try {
      await navigator.clipboard.writeText(requestText);
      setCopied(true);
    } catch { setError("คัดลอกอัตโนมัติไม่ได้ กรุณาคัดลอกข้อความคำขอด้วยตนเอง"); }
  }

  return <main className="min-h-screen bg-[#0b0c0e] text-stone-100">
    <header className="border-b border-amber-500/20 bg-black/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-stone-300 hover:text-amber-300"><ArrowLeft size={16}/> FIREKEEPER Core</button>
        <div className="text-sm font-semibold tracking-[0.22em] text-amber-300">MINI SALON</div>
        <span className="text-xs text-stone-500">AI Booking</span>
      </div>
    </header>
    <section className="relative overflow-hidden border-b border-white/5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(217,164,65,0.15),transparent_55%)]"/>
      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-24">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">Your style, thoughtfully cared for</p>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-6xl">ดูแลตัวเอง<br/><span className="text-amber-300">ในแบบที่เป็นคุณ</span></h1>
          <p className="mt-5 max-w-lg leading-7 text-stone-400">เลือกบริการที่สนใจ แล้วให้ FIREKEEPER AI ช่วยตอบคำถามและเตรียมข้อมูลก่อนติดต่อร้าน</p>
          <a href="#booking" className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 font-semibold text-stone-950 hover:bg-amber-300">เตรียมคำขอจองคิว <CalendarDays size={17}/></a>
          <p className="mt-3 text-xs text-stone-500">AI ช่วยแนะนำเท่านั้น ไม่ยืนยันคิวหรือราคาแทนร้าน</p>
        </div>
        <div className="rounded-3xl border border-amber-400/20 bg-[#141414] p-6 shadow-2xl shadow-black/30 md:p-8">
          <div className="flex items-center gap-3"><div className="rounded-2xl bg-amber-400/10 p-3 text-amber-300"><Sparkles size={23}/></div><div><h2 className="font-semibold">บริการของ Mini Salon</h2><p className="text-xs text-stone-500">เลือกบริการเพื่อเริ่มต้น</p></div></div>
          <div className="mt-6 space-y-3">{services.map(item => { const Icon=item.icon; return <button key={item.name} onClick={()=>setService(item.name)} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${service===item.name?"border-amber-300/70 bg-amber-300/10":"border-white/10 bg-black/20 hover:border-amber-300/30"}`}><Icon className="shrink-0 text-amber-300" size={20}/><span className="flex-1"><span className="block font-medium">{item.name}</span><span className="mt-1 block text-sm text-stone-500">{item.detail}</span></span>{service===item.name&&<CheckCircle2 size={18} className="text-amber-300"/>}</button>})}</div>
          <p className="mt-5 text-xs leading-5 text-stone-500">รายการนี้เป็นตัวเลือกเบื้องต้น ยังไม่ได้เชื่อมกับแคตตาล็อกบริการและราคาจริงของร้าน</p>
        </div>
      </div>
    </section>
    <section className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-2 md:py-16">
      <div className="rounded-3xl border border-white/10 bg-[#121315] p-6 md:p-8">
        <div className="flex items-center gap-3"><Sparkles className="text-amber-300"/><h2 className="text-xl font-semibold">ถาม FIREKEEPER AI</h2></div>
        <p className="mt-2 text-sm leading-6 text-stone-400">ถามเกี่ยวกับบริการหรือบอกความต้องการของคุณ AI จะใช้ระบบของ FIREKEEPER ที่มีอยู่ โดยไม่สร้างผู้ให้บริการ AI แยก</p>
        {!user && <button onClick={onOpenAuth} className="mt-5 rounded-xl border border-amber-300/30 px-4 py-2 text-sm text-amber-200">เข้าสู่ระบบเพื่อใช้ AI</button>}
        <textarea value={question} onChange={e=>setQuestion(e.target.value)} rows={4} placeholder="เช่น อยากตัดผมวันเสาร์ มีบริการไหนเหมาะกับผมบ้าง" className="mt-5 w-full resize-y rounded-2xl border border-white/10 bg-black/40 p-4 text-sm outline-none focus:border-amber-300/50"/>
        <button onClick={()=>void askAI()} disabled={busy||!question.trim()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 font-semibold text-stone-950 disabled:cursor-not-allowed disabled:opacity-50">{busy?"กำลังถาม FIREKEEPER AI...":"ถาม AI"} <Send size={16}/></button>
        {error&&<p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
        {answer&&<div className="mt-4 whitespace-pre-wrap rounded-2xl border border-amber-300/20 bg-black/30 p-4 text-sm leading-6 text-stone-200">{answer}</div>}
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-stone-500"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-amber-300"/> AI เป็นผู้ช่วยให้ข้อมูล ไม่ได้ตรวจสอบคิวว่างหรือยืนยันการจองโดยอัตโนมัติ</p>
      </div>
      <div id="booking" className="rounded-3xl border border-amber-400/20 bg-[#121315] p-6 md:p-8">
        <div className="flex items-center gap-3"><CalendarDays className="text-amber-300"/><h2 className="text-xl font-semibold">เตรียมคำขอจองคิว</h2></div>
        <p className="mt-2 text-sm leading-6 text-stone-400">กรอกข้อมูลเพื่อจัดเตรียมข้อความส่งให้ร้าน แบบฟอร์มนี้ยังไม่ได้ส่งหรือบันทึกการจองในระบบร้าน</p>
        <form className="mt-6 space-y-4" onSubmit={e=>{e.preventDefault(); void copyRequest();}}>
          <label className="block text-sm text-stone-300">ชื่อผู้จอง<input required value={customerName} onChange={e=>setCustomerName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 outline-none focus:border-amber-300/50" placeholder="ชื่อของคุณ"/></label>
          <label className="block text-sm text-stone-300">เบอร์โทรศัพท์<input required value={phone} onChange={e=>setPhone(e.target.value)} inputMode="tel" className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 outline-none focus:border-amber-300/50" placeholder="เบอร์ที่ติดต่อได้"/></label>
          <label className="block text-sm text-stone-300">บริการที่สนใจ<select required value={service} onChange={e=>setService(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 outline-none focus:border-amber-300/50"><option value="">เลือกบริการ</option>{services.map(s=><option key={s.name} value={s.name}>{s.name}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-3"><label className="block text-sm text-stone-300">วันที่ต้องการ<input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm outline-none focus:border-amber-300/50"/></label><label className="block text-sm text-stone-300">ช่วงเวลา<input value={time} onChange={e=>setTime(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 outline-none focus:border-amber-300/50" placeholder="เช่น บ่าย"/></label></div>
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300/40 px-4 py-3 font-semibold text-amber-200 hover:bg-amber-300/10"><Copy size={16}/>{copied?"คัดลอกแล้ว — คัดลอกอีกครั้ง":"สร้างข้อความคำขอจอง"}</button>
        </form>
        {copied&&<div className="mt-4 whitespace-pre-wrap rounded-xl bg-black/40 p-4 text-sm leading-6 text-stone-300">{requestText}<p className="mt-3 text-xs text-amber-300">โปรดส่งข้อความนี้ให้ร้านเพื่อให้ตรวจสอบและยืนยันคิว</p></div>}
      </div>
    </section>
    <footer className="border-t border-white/10 px-5 py-8 text-center text-xs text-stone-500">MINI SALON · Booking Assistant powered by FIREKEEPER Core · AI assists. Humans decide.</footer>
  </main>;
}
