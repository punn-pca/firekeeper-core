import React, { useMemo, useState } from 'react';
import { Clipboard, Check, ShieldCheck, ExternalLink, ArrowLeft, RotateCcw } from 'lucide-react';
import { buildAIPassportCompanionPackage, AIPassportProvider } from '../server/services/aiPassportCompanion';

type Props = { onBack?: () => void; isLight?: boolean };

const providers: { id: AIPassportProvider; label: string }[] = [
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'claude', label: 'Claude' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'perplexity', label: 'Perplexity' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'mistral', label: 'Mistral' },
  { id: 'llama', label: 'Llama' },
  { id: 'qwen', label: 'Qwen' },
  { id: 'other', label: 'Other / AiPASS' },
];

export function AIPassportCompanion({ onBack, isLight = false }: Props) {
  const [question, setQuestion] = useState('');
  const [provider, setProvider] = useState<AIPassportProvider>('other');
  const [response, setResponse] = useState('');
  const [copied, setCopied] = useState(false);

  const pkg = useMemo(() => question.trim() ? buildAIPassportCompanionPackage({ question: question.trim(), provider }) : null, [question, provider]);

  const copyPrompt = async () => {
    if (!pkg) return;
    await navigator.clipboard.writeText(pkg.governed_prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const reset = () => { setQuestion(''); setResponse(''); setProvider('other'); };

  const panel = isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0A101C] border-white/10 text-white';
  const muted = isLight ? 'text-slate-500' : 'text-slate-400';
  const input = isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#060A16] border-white/10 text-slate-100';

  return (
    <section className="max-w-6xl mx-auto w-full px-3 sm:px-5 py-4 space-y-4">
      <div className={`rounded-2xl border p-5 ${panel}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Firekeeper AI Passport Companion
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-2">AI Governance Layer</h1>
            <p className={`text-sm mt-1 max-w-3xl ${muted}`}>สร้าง governed prompt เพื่อนำไปใช้กับ AI ผ่าน AiPASS หรือผู้ให้บริการโดยตรง แล้วนำคำตอบกลับมาตรวจสอบใน Firekeeper</p>
          </div>
          {onBack && <button onClick={onBack} className="px-3 py-2 rounded-xl border border-white/10 text-xs font-semibold flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className={`rounded-2xl border p-5 ${panel}`}>
          <label className="text-xs font-mono font-bold uppercase tracking-wider">1. Question</label>
          <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={7} placeholder="พิมพ์คำถามหรือภารกิจที่ต้องการให้ AI ช่วย..." className={`mt-2 w-full rounded-xl border p-3 text-sm outline-none focus:border-amber-500 ${input}`} />
          <label className="block text-xs font-mono font-bold uppercase tracking-wider mt-4">Target AI</label>
          <select value={provider} onChange={e => setProvider(e.target.value as AIPassportProvider)} className={`mt-2 w-full rounded-xl border p-3 text-sm ${input}`}>
            {providers.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <div className="flex gap-2 mt-4">
            <button disabled={!pkg} onClick={copyPrompt} className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2">{copied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}{copied ? 'Copied' : 'Copy Governed Prompt'}</button>
            <button onClick={reset} className="px-4 py-2.5 rounded-xl border border-white/10 text-sm"><RotateCcw className="w-4 h-4" /></button>
          </div>
        </div>

        <div className={`rounded-2xl border p-5 ${panel}`}>
          <div className="flex items-center justify-between"><label className="text-xs font-mono font-bold uppercase tracking-wider">2. Governed Prompt</label>{pkg && <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono">USER-MEDIATED</span>}</div>
          <pre className={`mt-2 rounded-xl border p-3 min-h-[245px] max-h-[380px] overflow-auto whitespace-pre-wrap text-xs leading-5 ${input}`}>{pkg?.governed_prompt || 'Your Firekeeper governed prompt will appear here.'}</pre>
          <div className={`mt-3 text-[11px] ${muted}`}>นำ prompt นี้ไปใช้กับ AI ที่เลือก จากนั้นคัดลอกคำตอบกลับมาที่ช่องด้านล่างเพื่อเข้าสู่ขั้นตอน verification</div>
        </div>
      </div>

      <div className={`rounded-2xl border p-5 ${panel}`}>
        <div className="flex items-center justify-between"><div><label className="text-xs font-mono font-bold uppercase tracking-wider">3. Paste AI Response</label><p className={`text-xs mt-1 ${muted}`}>Firekeeper จะใช้คำตอบนี้เป็น verification input ไม่ถือว่าเป็นหลักฐานโดยอัตโนมัติ</p></div><ExternalLink className="w-4 h-4 text-slate-500" /></div>
        <textarea value={response} onChange={e => setResponse(e.target.value)} rows={8} placeholder="วางคำตอบจาก ChatGPT / Claude / Gemini / AiPASS ที่นี่..." className={`mt-3 w-full rounded-xl border p-3 text-sm outline-none focus:border-amber-500 ${input}`} />
        <div className="mt-3 grid sm:grid-cols-5 gap-2 text-center text-[10px] font-mono">
          {['INPUT','AI OUTPUT','EVIDENCE','VERIFY','HUMAN DECIDES'].map((x,i) => <div key={x} className={`rounded-lg border p-2 ${i < 2 ? 'border-amber-500/30 text-amber-400' : 'border-white/10 text-slate-500'}`}>{i+1}. {x}</div>)}
        </div>
      </div>

      <div className={`rounded-xl border p-3 text-[11px] ${muted}`}>
        <strong className="text-amber-400">Integration boundary:</strong> โหมดนี้ไม่เรียก API, token หรือ endpoint ภายใน AiPASS และไม่ทำ automation ของ AiPASS โดยตรง เป็น workflow แบบ user-mediated เพื่อคงระบบ Firekeeper เดิมและรองรับ official integration ในอนาคต
      </div>
    </section>
  );
}
