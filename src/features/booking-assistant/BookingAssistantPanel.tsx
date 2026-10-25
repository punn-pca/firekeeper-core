import React, { useState } from "react";
import { askBookingAssistant, type BookingContext } from "./bookingAssistantAdapter";

type Props = {
  context: BookingContext;
  onCopySuggestion?: (message: string) => void;
};

export function BookingAssistantPanel({ context, onCopySuggestion }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (import.meta.env.VITE_FIREKEEPER_BOOKING_ASSISTANT !== "true") return null;

  async function submit() {
    const trimmed = question.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError("");
    setAnswer("");
    try {
      const result = await askBookingAssistant(trimmed, context);
      setAnswer(result.message || "ยังไม่มีคำตอบจากระบบ กรุณาลองใหม่");
    } catch {
      setError("ผู้ช่วยจองคิวไม่พร้อมใช้งานชั่วคราว กรุณาใช้แบบฟอร์มจองคิวเดิม");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="FIREKEEPER AI Booking Assistant" className="rounded-2xl border border-amber-500/30 bg-stone-900 p-5">
      <h3 className="text-lg font-semibold text-amber-400">ผู้ช่วยจองคิวด้วย FIREKEEPER AI</h3>
      <p className="mt-1 text-sm text-stone-400">
        ช่วยเลือกบริการและเวลาที่ต้องการเท่านั้น การจองจะยังไม่สำเร็จจนกว่าร้านจะยืนยัน
      </p>
      <form className="mt-4 flex gap-2" onSubmit={event => { event.preventDefault(); void submit(); }}>
        <input
          value={question}
          onChange={event => setQuestion(event.target.value)}
          placeholder="เช่น อยากสระไดร์วันเสาร์ช่วงบ่าย"
          aria-label="คำถามเกี่ยวกับการจองคิว"
          className="min-w-0 flex-1 rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white"
        />
        <button type="submit" disabled={busy || !question.trim()}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-stone-950 disabled:opacity-50">
          {busy ? "กำลังถาม..." : "ถาม AI"}
        </button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
      {answer && (
        <div className="mt-4 rounded-lg bg-stone-950 p-3 text-sm text-stone-200">
          <p className="whitespace-pre-wrap">{answer}</p>
          <p className="mt-3 border-t border-stone-800 pt-2 text-xs text-amber-400">
            ต้องตรวจสอบเวลาว่างและให้ร้านยืนยันก่อนทุกครั้ง
          </p>
          {onCopySuggestion && (
            <button type="button" onClick={() => onCopySuggestion(answer)} className="mt-2 text-amber-300 underline">
              นำคำแนะนำไปใช้ในแบบฟอร์มเดิม
            </button>
          )}
        </div>
      )}
    </section>
  );
}
