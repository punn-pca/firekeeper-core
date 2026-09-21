import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  BookOpen, 
  Download, 
  FileText, 
  ExternalLink, 
  Flame, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  ChevronRight, 
  Check, 
  Copy, 
  Globe, 
  ArrowLeft,
  BookMarked,
  Cpu
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface FirekeeperPublicationPageProps {
  onBackToApp?: () => void;
  onNavigateHome?: () => void;
  onNavigatePca?: () => void;
  onNavigateAbout?: () => void;
  onNavigateChat?: () => void;
}

type PublicationBook = {
  id: string;
  title: string;
  subtitle: string;
  markdown: string;
  html: string;
  epub: string;
  cover: string;
};

const BOOKS: PublicationBook[] = [
  { id: 'theory', title: 'Firekeeper Theory', subtitle: 'ทฤษฎีผู้เฝ้าไฟ', markdown: '/firekeeper_publication/Firekeeper_Theory.md', html: '/firekeeper_publication/Firekeeper_Theory.html', epub: '/firekeeper_publication/Firekeeper_Theory.epub', cover: '/firekeeper-book-cover.png' },
  { id: 'practical-guide', title: 'Practical Guide', subtitle: 'คู่มือการใช้งานจริง', markdown: '/firekeeper_publication/Firekeeper_Practical_Guide.md', html: '/firekeeper_publication/Firekeeper_Practical_Guide.html', epub: '/firekeeper_publication/Firekeeper_Practical_Guide.epub', cover: '/firekeeper-book-cover.png' },
  { id: 'case-studies', title: 'Case Studies', subtitle: 'กรณีศึกษา', markdown: '/firekeeper_publication/Firekeeper_Case_Studies.md', html: '/firekeeper_publication/Firekeeper_Case_Studies.html', epub: '/firekeeper_publication/Firekeeper_Case_Studies.epub', cover: '/firekeeper-book-cover.png' },
  { id: 'quick-start', title: 'Quick Start', subtitle: 'เริ่มต้นอย่างรวดเร็ว', markdown: '/firekeeper_publication/Firekeeper_Quick_Start.md', html: '/firekeeper_publication/Firekeeper_Quick_Start.html', epub: '/firekeeper_publication/Firekeeper_Quick_Start.epub', cover: '/firekeeper-book-cover.png' },
  { id: 'ai-governance', title: 'AI Governance', subtitle: 'กรอบกำกับดูแล AI', markdown: '/firekeeper_publication/Firekeeper_AI_Governance.md', html: '/firekeeper_publication/Firekeeper_AI_Governance.html', epub: '/firekeeper_publication/Firekeeper_AI_Governance.epub', cover: '/firekeeper-book-cover.png' },
  { id: 'sacred-flame', title: 'Sacred Flame', subtitle: 'Firekeeper × Christian Theology', markdown: '/firekeeper_publication/Firekeeper_Sacred_Flame.md', html: '/firekeeper_publication/Firekeeper_Sacred_Flame.html', epub: '/firekeeper_publication/Firekeeper_Sacred_Flame.epub', cover: '/firekeeper-book-cover.png' },
];

type ReaderSection = { id: string; title: string; category: string; content: string };

function parseMarkdownSections(markdown: string): ReaderSection[] {
  const normalized = markdown
    .replace(/\r/g, '')
    .replace(/^\s*<!doctype html>[\s\S]*$/i, '')
    .trim();
  const lines = normalized.split('\n');
  const sections: ReaderSection[] = [];
  let title = 'Preface / คำนำ';
  let category = 'Introduction';
  let body: string[] = [];
  const push = () => {
    const content = body.join('\n').trim();
    if (content || sections.length === 0) sections.push({ id: `section-${sections.length + 1}`, title, category, content });
    body = [];
  };
  for (const line of lines) {
    const match = line.match(/^#{1,2}\s+(.+)$/);
    if (match) {
      const heading = match[1].trim();
      const isBookTitle = sections.length === 0 && body.length === 0 && !/^(คำนำ|Preface|บทที่|PART\b|Epilogue|บทส่งท้าย|\d+[.)\s])/i.test(heading);
      if (isBookTitle) { body.push(line); continue; }
      push();
      title = heading;
      category = /^บทที่\s*\d+/i.test(heading) ? 'Chapter' : /^\d+[.)\s]/.test(heading) ? 'Section' : /คำนำ|Preface/i.test(heading) ? 'Introduction' : /Epilogue|บทส่งท้าย/i.test(heading) ? 'Conclusion' : 'Part';
    } else body.push(line);
  }
  push();
  return sections.filter((section, index) => index === 0 || section.content || section.title);
}

export const FirekeeperPublicationPage: React.FC<FirekeeperPublicationPageProps> = ({ onBackToApp, onNavigateHome }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [sections, setSections] = useState<ReaderSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectedBook = BOOKS.find(book => book.id === selectedBookId) || null;
  const currentSection = sections.find(section => section.id === selectedSectionId) || sections[0];

  useEffect(() => {
    if (!selectedBook) return;
    let mounted = true;
    setLoading(true);
    fetch(selectedBook.markdown)
      .then(res => { if (!res.ok) throw new Error('Failed to load publication'); return res.text(); })
      .then(text => {
        if (!mounted) return;
        const parsed = parseMarkdownSections(text);
        setSections(parsed);
        setSelectedSectionId(parsed[0]?.id || '');
        setLoading(false);
      })
      .catch(() => { if (mounted) { setSections([]); setLoading(false); } });
    return () => { mounted = false; };
  }, [selectedBookId]);

  const filtered = sections.filter(section => (section.title + ' ' + section.category).toLowerCase().includes(searchQuery.toLowerCase()));

  if (!selectedBook) {
    return (
      <div className={`min-h-screen ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
        <header className={`sticky top-0 z-30 border-b backdrop-blur-md ${isLight ? 'border-slate-200 bg-white/90' : 'border-slate-800 bg-slate-950/90'}`}>
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
            <button onClick={onBackToApp || onNavigateHome} className={`p-2 rounded-xl border ${isLight ? 'border-slate-300 hover:bg-slate-100' : 'border-slate-700 hover:bg-slate-800'}`}><ArrowLeft className="w-4 h-4"/></button>
            <Flame className="w-5 h-5 text-amber-500"/><strong>Firekeeper Publication Series</strong>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-10">
          <div className="mb-8"><div className="text-amber-500 text-xs font-mono tracking-[.2em] uppercase">Publication Library</div><h1 className="text-3xl sm:text-4xl font-black mt-2">หนังสือ FIRE KEEPER</h1><p className={`mt-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>เลือกหนังสือหนึ่งเล่มเพื่อเปิด Reader เฉพาะเล่ม พร้อมสารบัญและ EPUB ของเล่มนั้น</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BOOKS.map((book, index) => (
              <div key={book.id} className={`rounded-2xl border overflow-hidden ${isLight ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-800 bg-slate-900'}`}>
                <button onClick={() => setSelectedBookId(book.id)} className="w-full text-left">
                  <div className={`relative aspect-[3/2] overflow-hidden ${isLight ? 'bg-amber-50' : 'bg-slate-950'}`}>
                    <img src={book.cover} alt={`ปก ${book.title}`} className="absolute inset-0 h-full w-full object-cover opacity-75" />
                    <div className={`absolute inset-0 ${isLight ? 'bg-gradient-to-t from-white via-white/30 to-transparent' : 'bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent'}`} />
                    <div className="relative h-full p-6 flex flex-col justify-between">
                      <div className="text-xs font-mono text-amber-500">FIREKEEPER · {String(index + 1).padStart(2,'0')}</div>
                      <div><div className="text-2xl font-black">{book.title}</div><div className={`text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{book.subtitle}</div></div>
                    </div>
                  </div>
                </button>
                <div className="p-4 flex gap-2">
                  <button onClick={() => setSelectedBookId(book.id)} className="flex-1 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm py-2.5 flex items-center justify-center gap-2"><BookOpen className="w-4 h-4"/>อ่านออนไลน์</button>
                  <a href={book.epub} download className={`rounded-xl border px-4 py-2.5 text-sm font-bold flex items-center gap-2 ${isLight ? 'border-slate-300 hover:bg-slate-50' : 'border-slate-700 hover:bg-slate-800'}`}><Download className="w-4 h-4"/>EPUB</a>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md ${isLight ? 'border-slate-200 bg-white/90' : 'border-slate-800 bg-slate-950/90'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <button onClick={() => { setSelectedBookId(null); setSearchQuery(''); }} className="flex items-center gap-2 text-sm"><ArrowLeft className="w-4 h-4"/>หนังสือทั้งหมด</button>
          <div className="font-bold truncate">{selectedBook.title}</div>
          <a href={selectedBook.epub} download className="rounded-xl border border-amber-500/40 text-amber-500 px-3 py-2 text-xs font-bold flex items-center gap-2"><Download className="w-4 h-4"/>EPUB</a>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-4">
            <div className={`rounded-2xl border p-4 lg:sticky lg:top-24 ${isLight ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-800 bg-slate-900'}`}>
              <div className="flex justify-between items-center mb-4"><h2 className="font-bold flex gap-2 items-center"><BookOpen className="w-4 h-4 text-amber-500"/>สารบัญหนังสือ</h2><span className="text-xs text-amber-500">{sections.length} ตอน</span></div>
              <div className="relative mb-3"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/><input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="ค้นหาบท..." className={`w-full rounded-xl border pl-9 pr-3 py-2 text-sm outline-none ${isLight ? 'bg-white border-slate-300 placeholder:text-slate-400 focus:border-amber-500' : 'bg-slate-950 border-slate-800 placeholder:text-slate-500 focus:border-amber-500'}`}/></div>
              <div className="space-y-1 max-h-[68vh] overflow-y-auto">
                {filtered.map(section => <button key={section.id} onClick={()=>setSelectedSectionId(section.id)} className={`w-full text-left rounded-xl px-3 py-3 text-sm flex justify-between gap-3 ${section.id===currentSection?.id?'bg-amber-500/15 border border-amber-500/40 text-amber-400':isLight ? 'border border-transparent hover:bg-slate-100 text-slate-700' : 'border border-transparent hover:bg-slate-800'}`}><span>{section.title}</span><span className="text-[10px] opacity-50 shrink-0">{section.category}</span></button>)}
              </div>
            </div>
          </aside>
          <section className="lg:col-span-8">
            <div className={`rounded-2xl border p-6 sm:p-10 ${isLight ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-800 bg-slate-900'}`}>
              {loading ? <div className="py-24 text-center text-slate-400">กำลังโหลดหนังสือ...</div> : currentSection ? <>
                <div className={`border-b pb-6 mb-7 flex justify-between gap-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <div><div className="text-xs text-amber-500 font-mono mb-2">{currentSection.category} · {selectedBook.title}</div><h1 className="text-2xl font-black">{currentSection.title}</h1></div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <a href={selectedBook.html} target="_blank" rel="noreferrer" className={`h-fit rounded-xl border px-3 py-2 text-xs flex gap-2 items-center ${isLight ? 'border-slate-300 hover:bg-slate-50' : 'border-slate-700 hover:bg-slate-800'}`}><ExternalLink className="w-4 h-4"/>HTML</a>
                    <a href={selectedBook.markdown} target="_blank" rel="noreferrer" className={`h-fit rounded-xl border px-3 py-2 text-xs flex gap-2 items-center ${isLight ? 'border-slate-300 hover:bg-slate-50' : 'border-slate-700 hover:bg-slate-800'}`}><ExternalLink className="w-4 h-4"/>Raw MD</a>
                  </div>
                </div>
                <article className={`publication-reader-prose markdown-body leading-8 text-sm sm:text-base ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentSection.content}</ReactMarkdown>
                </article>
              </> : <div className="py-24 text-center">ไม่พบเนื้อหาหนังสือ</div>}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
