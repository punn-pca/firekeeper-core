import React, { useMemo, useState } from 'react';
import { FilePenLine, Globe2, Loader2, Sparkles, ExternalLink, Copy, ShieldCheck } from 'lucide-react';
import { fetchWithAuthorization } from '../config/authFetch';
import { useTheme } from '../context/ThemeContext';

type ArticleDraft = { title: string; slug: string; markdown: string; model?: string; lensSummary?: string };

const toSlug = (value: string) => value
  .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);

export const AdminArticleStudio: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [topic, setTopic] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [language, setLanguage] = useState<'th' | 'en'>('th');
  const [draft, setDraft] = useState<ArticleDraft | null>(null);
  const [status, setStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');
  const [articles, setArticles] = useState<any[]>([]);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);

  const generatedSlug = useMemo(() => draft?.slug || toSlug(draft?.title || topic) || 'firekeeper-article', [draft, topic]);
  const loadArticles = async () => {
    setIsLoadingArticles(true);
    try {
      const response = await fetchWithAuthorization('/api/admin/articles');
      const data = await response.json();
      if (response.ok) setArticles(Array.isArray(data.articles) ? data.articles : []);
    } catch {} finally { setIsLoadingArticles(false); }
  };
  React.useEffect(() => { loadArticles(); }, []);
  const startEdit = (article: any) => {
    setEditingSlug(article.slug);
    setDraft({ title: article.title, slug: article.slug, markdown: article.markdown, model: article.model, lensSummary: article.lensSummary });
    setPublicUrl('');
    setStatus('กำลังแก้ไขบทความ — บันทึกเมื่อพร้อม');
  };
  const removeArticle = async (slug: string) => {
    if (!window.confirm('ลบบทความนี้ออกจากสาธารณะใช่หรือไม่? ระบบจะเก็บประวัติการลบไว้')) return;
    try {
      const response = await fetchWithAuthorization('/api/admin/articles/' + encodeURIComponent(slug), { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'ลบบทความไม่สำเร็จ');
      setArticles(items => items.filter(item => item.slug !== slug));
      if (editingSlug === slug) { setEditingSlug(null); setDraft(null); }
      setStatus('ลบบทความออกจากสาธารณะแล้ว');
    } catch (error: any) { setStatus(error?.message || 'ลบบทความไม่สำเร็จ'); }
  };

  const card = isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900/40';
  const field = isLight ? 'border-slate-300 bg-white text-slate-950' : 'border-slate-700 bg-slate-950 text-slate-100';

  const generate = async () => {
    if (!topic.trim() && !sourceText.trim()) { setStatus('กรุณาระบุหัวข้อหรือวางบทความต้นทางก่อนสร้างร่าง'); return; }
    setIsGenerating(true); setStatus('กำลังสร้างร่างผ่านกรอบ FIREKEEPER…'); setPublicUrl('');
    try {
      const response = await fetchWithAuthorization('/api/admin/articles/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, sourceText, language })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'สร้างบทความไม่สำเร็จ');
      setDraft({ title: data.title, slug: data.slug, markdown: data.markdown, model: data.model, lensSummary: data.lensSummary });
      setStatus('สร้างร่างแล้ว — ตรวจทานและแก้ไขก่อนเผยแพร่');
    } catch (error: any) { setStatus(error?.message || 'สร้างบทความไม่สำเร็จ'); }
    finally { setIsGenerating(false); }
  };

  const publish = async () => {
    if (!draft?.title?.trim() || !draft.markdown.trim()) { setStatus('ร่างบทความยังไม่ครบ'); return; }
    setIsPublishing(true); setStatus('กำลังเผยแพร่บทความ HTML…');
    try {
      const response = await fetchWithAuthorization(editingSlug ? '/api/admin/articles/' + encodeURIComponent(editingSlug) : '/api/admin/articles/publish', {
        method: editingSlug ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, slug: generatedSlug })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'เผยแพร่ไม่สำเร็จ');
      setPublicUrl(data.publicUrl); setEditingSlug(null); setStatus(editingSlug ? 'แก้ไขบทความสำเร็จ' : 'เผยแพร่สำเร็จ — URL นี้เปิดได้โดยไม่ต้องล็อกอิน'); loadArticles();
    } catch (error: any) { setStatus(error?.message || 'เผยแพร่ไม่สำเร็จ'); }
    finally { setIsPublishing(false); }
  };

  return <section className={`mt-8 rounded-2xl border p-5 sm:p-7 ${card}`}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><div className="flex items-center gap-2 text-amber-500"><FilePenLine className="h-5 w-5"/><span className="font-mono text-xs font-bold uppercase tracking-widest">Public Article Studio</span></div>
        <h2 className="mt-2 text-xl font-black">สร้างบทความผ่านเลนส์ FIREKEEPER</h2>
        <p className={`mt-1 max-w-3xl text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>สำหรับแอดมินเท่านั้น: สร้างร่างจากหัวข้อหรือข้อความต้นทาง, ตรวจทานเอง, แล้วเผยแพร่เป็น HTML สาธารณะ</p></div>
      <div className="flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs text-amber-600"><ShieldCheck className="h-3.5 w-3.5"/>Human review required</div>
    </div>
    <div className={`mt-6 rounded-xl border p-4 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/40'}`}>
      <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">บทความที่เผยแพร่แล้ว</h3><button onClick={loadArticles} className="text-xs text-amber-500">{isLoadingArticles ? 'กำลังโหลด…' : 'รีเฟรช'}</button></div>
      {articles.length === 0 ? <p className="text-sm text-slate-500">ยังไม่มีบทความใน Firestore</p> : <div className="space-y-2">{articles.map(article => <div key={article.slug} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700/30 p-3"><div><div className="text-sm font-semibold">{article.title}</div><div className="text-xs text-slate-500">/{article.slug}</div></div><div className="flex gap-2"><button onClick={() => startEdit(article)} className="rounded-md border border-slate-500/40 px-3 py-1.5 text-xs">แก้ไข</button><button onClick={() => removeArticle(article.slug)} className="rounded-md border border-rose-500/40 px-3 py-1.5 text-xs text-rose-500">ลบ</button></div></div>)}</div>}
    </div>
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <label className="text-sm font-semibold">หัวข้อ <span className="font-normal text-slate-500">(เลือกอย่างใดอย่างหนึ่ง)</span><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="เช่น ทำไมองค์กรต้องตรวจสอบคำแนะนำของ AI" className={`mt-2 w-full rounded-lg border px-3 py-2.5 text-sm ${field}`}/></label>
      <label className="text-sm font-semibold">ภาษา<select value={language} onChange={e => setLanguage(e.target.value as 'th' | 'en')} className={`mt-2 w-full rounded-lg border px-3 py-2.5 text-sm ${field}`}><option value="th">ไทย</option><option value="en">English</option></select></label>
      <label className="text-sm font-semibold lg:col-span-2">บทความหรือข้อมูลต้นทาง <span className="font-normal text-slate-500">(ไม่บังคับ; ระบบจะตีความ ไม่คัดลอกคำกล่าวที่ตรวจสอบไม่ได้)</span><textarea value={sourceText} onChange={e => setSourceText(e.target.value)} maxLength={50000} rows={7} placeholder="วางข้อความต้นทาง หรือเว้นว่างเพื่อให้ FIREKEEPER สร้างจากหัวข้อ…" className={`mt-2 w-full resize-y rounded-lg border px-3 py-2.5 text-sm leading-6 ${field}`}/></label>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3"><button onClick={generate} disabled={isGenerating} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-60">{isGenerating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}สร้างร่าง</button><span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>AI แยก fact / interpretation / recommendation และไม่เผยแพร่เอง</span></div>
    {draft && <div className="mt-6 space-y-4 border-t border-slate-700/30 pt-6"><div className="grid gap-4 md:grid-cols-[1fr_220px]"><label className="text-sm font-semibold">ชื่อบทความ<input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} className={`mt-2 w-full rounded-lg border px-3 py-2.5 text-sm ${field}`}/></label><label className="text-sm font-semibold">Public slug<input value={generatedSlug} onChange={e => setDraft({ ...draft, slug: toSlug(e.target.value) })} className={`mt-2 w-full rounded-lg border px-3 py-2.5 text-sm ${field}`}/></label></div>
      <label className="block text-sm font-semibold">ร่าง Markdown <span className="font-normal text-slate-500">— แอดมินต้องทบทวนก่อนเผยแพร่</span><textarea value={draft.markdown} onChange={e => setDraft({ ...draft, markdown: e.target.value })} rows={20} maxLength={50000} className={`mt-2 w-full resize-y rounded-lg border px-3 py-2.5 font-mono text-xs leading-6 ${field}`}/></label>
      {draft.lensSummary && <p className={`rounded-lg border p-3 text-xs ${isLight ? 'border-sky-200 bg-sky-50 text-slate-700' : 'border-sky-900 bg-sky-950/30 text-slate-300'}`}>{draft.lensSummary}</p>}
      <div className="flex flex-wrap items-center gap-3"><button onClick={publish} disabled={isPublishing} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-60">{isPublishing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Globe2 className="h-4 w-4"/>}{editingSlug ? 'บันทึกการแก้ไข' : 'เผยแพร่ HTML สาธารณะ'}</button>{publicUrl && <><a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-500"><ExternalLink className="h-4 w-4"/>เปิดบทความ</a><button onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${publicUrl}`)} className="inline-flex items-center gap-1 text-xs text-slate-500"><Copy className="h-3.5 w-3.5"/>คัดลอกลิงก์</button></>}</div></div>}
    {status && <p role="status" className={`mt-4 text-sm ${status.includes('สำเร็จ') || status.includes('สร้างร่างแล้ว') ? 'text-emerald-500' : status.includes('ไม่') || status.includes('กรุณา') ? 'text-rose-500' : 'text-sky-500'}`}>{status}</p>}
  </section>;
};