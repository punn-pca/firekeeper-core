import React, { useState, useEffect } from 'react';
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
};

const BOOKS: PublicationBook[] = [
  { id: 'theory', title: 'Firekeeper Theory', subtitle: 'ทฤษฎีผู้เฝ้าไฟ', markdown: '/firekeeper_publication/Firekeeper_Theory.md', html: '/firekeeper_publication/Firekeeper_Theory.html', epub: '/firekeeper_publication/Firekeeper_Theory.epub' },
  { id: 'practical-guide', title: 'Practical Guide', subtitle: 'คู่มือการใช้งานจริง', markdown: '/firekeeper_publication/Firekeeper_Practical_Guide.md', html: '/firekeeper_publication/Firekeeper_Practical_Guide.html', epub: '/firekeeper_publication/Firekeeper_Practical_Guide.epub' },
  { id: 'case-studies', title: 'Case Studies', subtitle: 'กรณีศึกษา', markdown: '/firekeeper_publication/Firekeeper_Case_Studies.md', html: '/firekeeper_publication/Firekeeper_Case_Studies.html', epub: '/firekeeper_publication/Firekeeper_Case_Studies.epub' },
  { id: 'quick-start', title: 'Quick Start', subtitle: 'เริ่มต้นอย่างรวดเร็ว', markdown: '/firekeeper_publication/Firekeeper_Quick_Start.md', html: '/firekeeper_publication/Firekeeper_Quick_Start.html', epub: '/firekeeper_publication/Firekeeper_Quick_Start.epub' },
  { id: 'ai-governance', title: 'AI Governance', subtitle: 'กรอบกำกับดูแล AI', markdown: '/firekeeper_publication/Firekeeper_AI_Governance.md', html: '/firekeeper_publication/Firekeeper_AI_Governance.html', epub: '/firekeeper_publication/Firekeeper_AI_Governance.epub' },
  { id: 'sacred-flame', title: 'Sacred Flame', subtitle: 'Firekeeper × Christian Theology', markdown: '/firekeeper_publication/Firekeeper_Sacred_Flame.md', html: '/firekeeper_publication/Firekeeper_Sacred_Flame.html', epub: '/firekeeper_publication/Firekeeper_Sacred_Flame.epub' },
];

type ReaderSection = { id: string; title: string; category: string; content: string };

function parseMarkdownSections(markdown: string): ReaderSection[] {
  const lines = markdown.replace(/\r/g, '').split('\n');
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
        <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
            <button onClick={onBackToApp || onNavigateHome} className="p-2 rounded-xl border border-slate-700"><ArrowLeft className="w-4 h-4"/></button>
            <Flame className="w-5 h-5 text-amber-500"/><strong>Firekeeper Publication Series</strong>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-10">
          <div className="mb-8"><div className="text-amber-500 text-xs font-mono tracking-[.2em] uppercase">Publication Library</div><h1 className="text-3xl sm:text-4xl font-black mt-2">หนังสือ FIRE KEEPER</h1><p className="text-slate-400 mt-2">เลือกหนังสือหนึ่งเล่มเพื่อเปิด Reader เฉพาะเล่ม พร้อมสารบัญและ EPUB ของเล่มนั้น</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BOOKS.map((book, index) => (
              <div key={book.id} className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
                <button onClick={() => setSelectedBookId(book.id)} className="w-full text-left">
                  <div className="aspect-[3/2] bg-gradient-to-br from-slate-950 via-amber-950/50 to-slate-950 p-6 flex flex-col justify-between">
                    <div className="text-xs font-mono text-amber-500">FIREKEEPER · {String(index + 1).padStart(2,'0')}</div>
                    <div><div className="text-2xl font-black">{book.title}</div><div className="text-sm text-slate-400 mt-1">{book.subtitle}</div></div>
                  </div>
                </button>
                <div className="p-4 flex gap-2">
                  <button onClick={() => setSelectedBookId(book.id)} className="flex-1 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm py-2.5 flex items-center justify-center gap-2"><BookOpen className="w-4 h-4"/>อ่านออนไลน์</button>
                  <a href={book.epub} download className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold flex items-center gap-2"><Download className="w-4 h-4"/>EPUB</a>
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
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <button onClick={() => { setSelectedBookId(null); setSearchQuery(''); }} className="flex items-center gap-2 text-sm"><ArrowLeft className="w-4 h-4"/>หนังสือทั้งหมด</button>
          <div className="font-bold truncate">{selectedBook.title}</div>
          <a href={selectedBook.epub} download className="rounded-xl border border-amber-500/40 text-amber-500 px-3 py-2 text-xs font-bold flex items-center gap-2"><Download className="w-4 h-4"/>EPUB</a>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 lg:sticky lg:top-24">
              <div className="flex justify-between items-center mb-4"><h2 className="font-bold flex gap-2 items-center"><BookOpen className="w-4 h-4 text-amber-500"/>สารบัญหนังสือ</h2><span className="text-xs text-amber-500">{sections.length} ตอน</span></div>
              <div className="relative mb-3"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/><input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="ค้นหาบท..." className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 text-sm"/></div>
              <div className="space-y-1 max-h-[68vh] overflow-y-auto">
                {filtered.map(section => <button key={section.id} onClick={()=>setSelectedSectionId(section.id)} className={`w-full text-left rounded-xl px-3 py-3 text-sm flex justify-between gap-3 ${section.id===currentSection?.id?'bg-amber-500/15 border border-amber-500/40 text-amber-400':'border border-transparent hover:bg-slate-800'}`}><span>{section.title}</span><span className="text-[10px] opacity-50 shrink-0">{section.category}</span></button>)}
              </div>
            </div>
          </aside>
          <section className="lg:col-span-8">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-10">
              {loading ? <div className="py-24 text-center text-slate-400">กำลังโหลดหนังสือ...</div> : currentSection ? <>
                <div className="border-b border-slate-800 pb-6 mb-7 flex justify-between gap-4">
                  <div><div className="text-xs text-amber-500 font-mono mb-2">{currentSection.category} · {selectedBook.title}</div><h1 className="text-2xl font-black">{currentSection.title}</h1></div>
                  <a href={selectedBook.markdown} target="_blank" rel="noreferrer" className="h-fit rounded-xl border border-slate-700 px-3 py-2 text-xs flex gap-2 items-center"><ExternalLink className="w-4 h-4"/>Raw MD</a>
                </div>
                <div className="whitespace-pre-wrap leading-8 text-sm sm:text-base">{currentSection.content}</div>
              </> : <div className="py-24 text-center">ไม่พบเนื้อหาหนังสือ</div>}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
