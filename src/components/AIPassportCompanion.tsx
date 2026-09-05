import React, { useMemo, useState } from 'react';
import { Clipboard, Check, ShieldCheck, ExternalLink, ArrowLeft, RotateCcw, AlertTriangle, Copy, Sparkles, Search, Trash2, Lightbulb, ChevronRight } from 'lucide-react';
import { buildAIPassportCompanionPackage, AIPassportProvider } from '../server/services/aiPassportCompanion';
import { verifyAIPassportResponse, AIPassportVerificationResult } from '../server/services/aiPassportVerification';

type Props = { onBack?: () => void; isLight?: boolean };

const providers: { id: AIPassportProvider; label: string }[] = [
  { id: 'chatgpt', label: 'ChatGPT' }, { id: 'claude', label: 'Claude' }, { id: 'gemini', label: 'Gemini' },
  { id: 'perplexity', label: 'Perplexity' }, { id: 'deepseek', label: 'DeepSeek' }, { id: 'mistral', label: 'Mistral' },
  { id: 'llama', label: 'Llama' }, { id: 'qwen', label: 'Qwen' }, { id: 'other', label: 'Other / AiPASS' },
];

const exampleQuestions = ['วิเคราะห์ข้อมูล', 'สรุปเนื้อหา', 'เปรียบเทียบทางเลือก', 'วางกลยุทธ์', 'ขอคำแนะนำ'];

export function AIPassportCompanion({ onBack, isLight = false }: Props) {
  const [question, setQuestion] = useState('');
  const [provider, setProvider] = useState<AIPassportProvider>('other');
  const [response, setResponse] = useState('');
  const [copied, setCopied] = useState(false);
  const [verification, setVerification] = useState<AIPassportVerificationResult | null>(null);

  const pkg = useMemo(() => question.trim() ? buildAIPassportCompanionPackage({ question: question.trim(), provider }) : null, [question, provider]);

  const copyPrompt = async () => {
    if (!pkg) return;
    await navigator.clipboard.writeText(pkg.governed_prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const verify = () => {
    if (!question.trim() || !response.trim()) return;
    setVerification(verifyAIPassportResponse({ question: question.trim(), response: response.trim(), provider }));
  };

  const reset = () => { setQuestion(''); setResponse(''); setProvider('other'); setVerification(null); setCopied(false); };

  const panel = isLight
    ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
    : 'bg-[#0b1627]/90 border-[#203653] text-white shadow-[0_18px_50px_rgba(0,0,0,.22)]';
  const input = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
    : 'bg-[#07101e] border-[#263c58] text-slate-100 placeholder:text-slate-500';
  const muted = isLight ? 'text-slate-500' : 'text-[#8da0b9]';
  const decisionClass = verification?.decision === 'READY_FOR_REVIEW' ? 'text-emerald-400' : verification?.decision === 'NEEDS_EVIDENCE' ? 'text-amber-400' : 'text-red-400';

  return (
    <section className={`min-h-full w-full ${isLight ? 'bg-slate-50' : 'bg-[#06101d]'} py-5 sm:py-7`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Top navigation / brand */}
        <header className={`rounded-2xl border px-5 py-4 ${panel}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex items-center gap-2 shrink-0">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20"><ShieldCheck className="w-5 h-5" /></div>
                <div><div className="font-black tracking-[0.18em] text-sm">FIREKEEPER</div><div className={`text-[9px] tracking-wider ${muted}`}>Keeper of Inner Light</div></div>
              </div>
              <div className={`hidden sm:block h-8 w-px ${isLight ? 'bg-slate-200' : 'bg-[#2a405d]'}`} />
              <div className="flex items-center gap-2"><span className="text-sm font-bold tracking-wide">AI PASSPORT COMPANION</span><span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[9px] font-bold">BETA</span></div>
            </div>
            <div className="flex items-center gap-5">
              <div className="hidden md:block text-right"><div className="text-xs font-semibold">Human-Centered AI Governance</div><div className={`text-[10px] ${muted}`}>Question · Verify · Decide</div></div>
              {onBack && <button onClick={onBack} className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-colors ${isLight ? 'border-slate-300 hover:bg-slate-100' : 'border-[#314965] hover:bg-[#14243a]'}`}><ArrowLeft className="w-4 h-4" /> กลับ</button>}
            </div>
          </div>
        </header>

        {/* Hero */}
        <div className={`relative overflow-hidden rounded-2xl border p-6 sm:p-7 ${panel}`}>
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div><div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-[0.2em] text-amber-400 uppercase"><Sparkles className="w-3.5 h-3.5" /> AI Governance Layer</div><h1 className="text-3xl sm:text-4xl font-black mt-2 tracking-tight">AI Governance Layer</h1><p className={`text-sm sm:text-base mt-2 max-w-3xl leading-relaxed ${muted}`}>สร้าง governed prompt → ใช้ AI ผ่าน AiPASS หรือ provider อื่นตามต้องการ → นำคำตอบกลับมาตรวจสอบใน Firekeeper</p></div>
            <div className="shrink-0 rounded-2xl border border-blue-400/25 bg-blue-500/10 px-6 py-4 min-w-[245px]"><div className="flex items-center gap-3"><ShieldCheck className="w-9 h-9 text-blue-300" /><div className="space-y-0.5 text-sm font-mono"><div>Same Question</div><div>Higher Confidence</div><div>Better Decisions</div></div></div></div>
          </div>
        </div>

        {/* Question + governed prompt */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className={`rounded-2xl border p-5 sm:p-6 ${panel}`}>
            <div className="flex items-start gap-3"><div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">1</div><div><label className="text-base font-black tracking-wide uppercase">Question</label><p className={`text-xs mt-0.5 ${muted}`}>พิมพ์คำถาม หรือภารกิจที่ต้องการให้ AI ช่วย</p></div></div>
            <textarea value={question} onChange={e => { setQuestion(e.target.value); setVerification(null); }} rows={5} placeholder="พิมพ์คำถามของคุณที่นี่..." className={`mt-4 w-full rounded-xl border p-4 text-sm outline-none resize-y focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition ${input}`} />
            <label className={`block text-[11px] font-bold uppercase tracking-widest mt-4 ${muted}`}>Target AI</label>
            <select value={provider} onChange={e => { setProvider(e.target.value as AIPassportProvider); setVerification(null); }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-400 ${input}`}>{providers.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
            <div className={`mt-4 text-[10px] uppercase tracking-wider font-mono ${muted}`}>ตัวอย่างคำถาม:</div>
            <div className="flex flex-wrap gap-2 mt-2">{exampleQuestions.map(x => <button key={x} onClick={() => { setQuestion(x); setVerification(null); }} className={`px-3 py-1.5 rounded-full border text-[10px] transition ${isLight ? 'border-slate-200 hover:border-slate-400' : 'border-[#304762] hover:border-blue-400 bg-[#0c1a2c]'}`}>{x}</button>)}</div>
            <div className="flex gap-2 mt-4"><button disabled={!pkg} onClick={copyPrompt} className="group flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-sm disabled:opacity-35 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'คัดลอกแล้ว' : 'สร้าง Governed Prompt'}<ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" /></button><button onClick={reset} aria-label="Reset" className={`px-4 rounded-xl border transition ${isLight ? 'border-slate-200 hover:bg-slate-100' : 'border-[#314965] hover:bg-[#14243a]'}`}><RotateCcw className="w-4 h-4" /></button></div>
          </div>

          <div className={`rounded-2xl border p-5 sm:p-6 ${panel}`}>
            <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-blue-300 to-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-500/20">2</div><div><label className="text-base font-black tracking-wide uppercase">Governed Prompt</label><p className={`text-xs mt-0.5 ${muted}`}>นี่คือ prompt ที่ผ่านการกำกับตามหลัก Firekeeper</p></div></div>{pkg && <button onClick={copyPrompt} className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${isLight ? 'border-slate-200' : 'border-[#314965]'}`}><Clipboard className="w-3.5 h-3.5" /> คัดลอก</button>}</div>
            <pre className={`mt-4 rounded-xl border p-4 min-h-[230px] max-h-[330px] overflow-auto whitespace-pre-wrap text-xs leading-5 font-mono ${input}`}>{pkg?.governed_prompt || 'Your Firekeeper governed prompt will appear here...'}</pre>
            <div className="mt-3 rounded-xl border border-blue-400/25 bg-blue-500/10 p-3 text-xs leading-relaxed text-blue-100"><span className="font-bold">ⓘ Prompt ที่ได้รับการกำกับ</span> ด้วยหลักความเที่ยงตรง ความเป็นกลาง และการตรวจสอบได้ คุณสามารถคัดลอกไปใช้กับ ChatGPT, Claude, Gemini, AiPASS หรือ AI provider อื่นได้</div>
          </div>
        </div>

        {/* Response */}
        <div className={`rounded-2xl border p-5 sm:p-6 ${panel}`}>
          <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-violet-300 to-purple-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-500/20">3</div><div><label className="text-base font-black tracking-wide uppercase">Paste AI Response</label><p className={`text-xs mt-0.5 ${muted}`}>นำคำตอบจาก AI มาวางที่นี่ เพื่อตรวจสอบความน่าเชื่อถือ</p></div></div>{response && <button onClick={() => { setResponse(''); setVerification(null); }} className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${isLight ? 'border-slate-200' : 'border-[#314965]'}`}><Trash2 className="w-3.5 h-3.5" /> ล้างข้อความ</button>}</div>
          <textarea value={response} onChange={e => { setResponse(e.target.value); setVerification(null); }} rows={6} placeholder="วางคำตอบจาก ChatGPT / Claude / Gemini / AiPASS ที่นี่..." className={`mt-4 w-full rounded-xl border p-4 text-sm outline-none resize-y focus:ring-2 focus:ring-purple-400/20 focus:border-purple-400 transition ${input}`} />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3"><button disabled={!question.trim() || !response.trim()} onClick={verify} className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white font-black text-sm disabled:opacity-35 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/15 transition"><Search className="w-4 h-4" /> Verify AI Response</button><label className={`flex items-center gap-2 text-xs ${muted}`}><input type="checkbox" className="h-4 w-4 rounded accent-purple-500" /> แสดงการวิเคราะห์รายละเอียด (Advanced)</label></div>
        </div>

        {/* Verification */}
        {verification && <div className={`rounded-2xl border p-5 sm:p-6 ${panel}`}><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-300 to-purple-600 text-white flex items-center justify-center font-black">4</div><div><div className="text-base font-black uppercase tracking-wide">Verification Result</div><div className={`text-3xl font-black mt-1 ${decisionClass}`}>{verification.score}/100</div></div></div><div className={`px-4 py-2.5 rounded-xl border text-xs font-mono font-bold ${decisionClass}`}>{verification.decision}</div></div><div className="grid sm:grid-cols-4 gap-3 mt-5">{Object.entries(verification.checks).map(([key, value]) => <div key={key} className={`rounded-xl border p-3 ${value ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-amber-500/25 bg-amber-500/5'}`}><div className="font-mono text-[9px] tracking-wider text-slate-500">{key.replaceAll('_',' ').toUpperCase()}</div><div className={`font-black text-xs mt-1 ${value ? 'text-emerald-400' : 'text-amber-400'}`}>{value ? 'PASS' : 'CHECK'}</div></div>)}</div><div className="mt-4 space-y-2">{verification.findings.length === 0 ? <div className="text-sm text-emerald-400 flex items-center gap-2"><Check className="w-4 h-4" /> No first-pass governance findings.</div> : verification.findings.map((finding, i) => <div key={`${finding.type}-${i}`} className="rounded-xl border border-white/10 p-3 text-sm flex gap-3"><AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" /><div><span className="font-mono text-[10px] text-slate-500">{finding.type} · {finding.severity}</span><div className="mt-1">{finding.text}</div></div></div>)}</div><div className={`mt-4 text-[11px] ${muted}`}>คะแนนนี้เป็น first-pass governance signal ไม่ใช่การพิสูจน์ความจริงของคำตอบหรือความถูกต้องของแหล่งอ้างอิง</div></div>}

        {/* Workflow */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">{['INPUT|ตั้งคำถาม','AI OUTPUT|สร้างและรับคำตอบ','EVIDENCE|ตรวจสอบหลักฐาน','VERIFY|ประเมินความน่าเชื่อถือ','HUMAN DECIDES|คุณตัดสินใจ'].map((item,i) => { const [en,th] = item.split('|'); const active = i <= (verification ? 3 : 1); return <React.Fragment key={en}><div className={`rounded-full border px-4 py-3 flex items-center gap-3 ${active ? 'border-amber-400/60 bg-amber-400/5' : 'border-[#2b415d] bg-[#091525]'}`}><div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black ${active ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-200'}`}>{i+1}</div><div className="min-w-0"><div className={`text-[10px] font-bold ${active ? 'text-amber-300' : 'text-slate-400'}`}>{en}</div><div className="text-[9px] text-slate-500 truncate">{th}</div></div></div>{i < 4 && <ChevronRight className="hidden sm:block w-4 h-4 text-slate-500 mx-auto" />}</React.Fragment>})}</div>

        <div className={`rounded-xl border p-4 flex items-center gap-3 text-xs ${isLight ? 'border-blue-200 bg-blue-50' : 'border-[#29425f] bg-[#0a192b]'}`}><Lightbulb className="w-5 h-5 text-amber-400 shrink-0" /><div className={muted}><strong className="text-amber-400">Integration Boundary:</strong> โหมดนี้ไม่เรียก API, token หรือ endpoint จาก AiPASS และไม่ทำ automation ของ AiPASS โดยตรง เป็น workflow แบบ user-mediated</div><button className={`ml-auto hidden sm:flex shrink-0 px-3 py-2 rounded-lg border text-[10px] font-bold items-center gap-1 ${isLight ? 'border-slate-200' : 'border-[#314965]'}`}>เรียนรู้เพิ่มเติม <ExternalLink className="w-3 h-3" /></button></div>

        <footer className={`border-t pt-4 pb-2 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono ${muted}`}><div className="flex items-center gap-3"><span className="font-black text-white">🔥 FIREKEEPER</span><span>|</span><span>Question Deeper</span><span>·</span><span>Verify Smarter</span><span>·</span><span>Decide Brighter</span></div><div>AI Passport Companion &nbsp;|&nbsp; v0.1.0 (Beta)</div></footer>
      </div>
    </section>
  );
}
