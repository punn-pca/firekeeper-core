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

const CHAPTERS = [
  { id: '01_preface', title: 'Preface / คำนำ', file: '01_preface.md', category: 'Introduction' },
  { id: '02_chapter', title: 'Chapter 2: The Epistemic Foundation of Firekeeper', file: '02_chapter.md', category: 'Theory' },
  { id: '03_chapter', title: 'Chapter 3: PUNN Predictive Cognitive Architecture (PCA v3.0)', file: '03_chapter.md', category: 'Architecture' },
  { id: '04_chapter', title: 'Chapter 4: Reasoning Dynamics & Evidence Transparency', file: '04_chapter.md', category: 'Architecture' },
  { id: '05_chapter', title: 'Chapter 5: Ground Truth vs. Inferences & Epistemic Separation', file: '05_chapter.md', category: 'Epistemology' },
  { id: '06_chapter', title: 'Chapter 6: Counterfactual Audit & Decision Risk Governance', file: '06_chapter.md', category: 'Governance' },
  { id: '07_chapter', title: 'Chapter 7: Multi-Layer Cognitive Pipelines & Semantic Classification', file: '07_chapter.md', category: 'Architecture' },
  { id: '08_chapter', title: 'Chapter 8: Dynamic Bayesian Evidence Integration', file: '08_chapter.md', category: 'Reasoning' },
  { id: '09_chapter', title: 'Chapter 9: Real-Time Web Retrieval & Evidence Verification', file: '09_chapter.md', category: 'Retrieval' },
  { id: '10_chapter', title: 'Chapter 10: AI Passport Companion & Identity Verification', file: '10_chapter.md', category: 'Security' },
  { id: '11_chapter', title: 'Chapter 11: Autonomous Semantic Auditor & Compliance Guardrails', file: '11_chapter.md', category: 'Governance' },
  { id: '12_chapter', title: 'Chapter 12: Adaptive Model Routing & Dual-Engine Fallbacks', file: '12_chapter.md', category: 'Infrastructure' },
  { id: '13_chapter', title: 'Chapter 13: Distributed Persistence & Secure State Management', file: '13_chapter.md', category: 'Infrastructure' },
  { id: '14_chapter', title: 'Chapter 14: Real-Time Collaborative Intelligence & Session Isolation', file: '14_chapter.md', category: 'Collaboration' },
  { id: '15_chapter', title: 'Chapter 15: Security Boundary & Threat Modeling', file: '15_chapter.md', category: 'Security' },
  { id: '16_chapter', title: 'Chapter 16: Telemetry, Observability & Execution Trace Engines', file: '16_chapter.md', category: 'Observability' },
  { id: '17_chapter', title: 'Chapter 17: Enterprise Deployment, Docker & Cloud Run Architecture', file: '17_chapter.md', category: 'Deployment' },
  { id: '18_chapter', title: 'Chapter 18: API Specifications & Integration Protocols', file: '18_chapter.md', category: 'API' },
  { id: '19_chapter', title: 'Chapter 19: Benchmarking, Diagnostics & Automated Verification', file: '19_chapter.md', category: 'Testing' },
  { id: '20_chapter', title: 'Chapter 20: Future Horizons of Predictive Cognitive Systems', file: '20_chapter.md', category: 'Vision' },
  { id: '21_chapter', title: 'Chapter 21: Case Studies & Operational Implementations', file: '21_chapter.md', category: 'Applications' },
  { id: '22_epilogue', title: 'Epilogue / บทส่งท้าย', file: '22_epilogue.md', category: 'Conclusion' },
  { id: '23_author', title: 'Author Biography / เกี่ยวกับผู้สร้าง (PUNN)', file: '23_author.md', category: 'Author' },
];

export const FirekeeperPublicationPage: React.FC<FirekeeperPublicationPageProps> = ({
  onBackToApp,
  onNavigateHome,
  onNavigatePca,
  onNavigateAbout,
  onNavigateChat
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [selectedChapterId, setSelectedChapterId] = useState<string>('01_preface');
  const [chapterContent, setChapterContent] = useState<string>('กำลังโหลดเนื้อหาบทความ...');
  const [loadingChapter, setLoadingChapter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const currentChapter = CHAPTERS.find(c => c.id === selectedChapterId) || CHAPTERS[0];

  useEffect(() => {
    let isMounted = true;
    setLoadingChapter(true);
    fetch(`/firekeeper_publication/chapters/${currentChapter.file}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load chapter');
        return res.text();
      })
      .then(text => {
        if (isMounted) {
          setChapterContent(text);
          setLoadingChapter(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setChapterContent(`# ${currentChapter.title}\n\nไม่สามารถโหลดไฟล์เนื้อหาบทนี้ได้โดยตรง กรุณาดาวน์โหลดฉบับเต็มหรือเปิดผ่านลิงก์ HTML ฉบับสมบูรณ์\n\nError: ${err.message}`);
          setLoadingChapter(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [selectedChapterId, currentChapter]);

  const filteredChapters = CHAPTERS.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.origin + '/publication');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className={`min-h-screen ${isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-slate-100'} font-sans antialiased selection:bg-amber-500/30 selection:text-amber-200`}>
      {/* Top Navigation Bar */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md ${isLight ? 'bg-white/80 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToApp || onNavigateHome}
              className={`p-2 rounded-xl border transition-colors flex items-center gap-2 text-xs font-mono ${
                isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-700' : 'border-slate-700 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่ระบบหลัก</span>
            </button>
            <div className="hidden sm:flex items-center space-x-2 pl-3 border-l border-slate-300 dark:border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Flame className="w-4 h-4" />
              </div>
              <span className="font-mono text-sm font-bold tracking-tight">Firekeeper Theory Publication</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onNavigatePca}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-700' : 'border-slate-700 hover:bg-slate-800 text-slate-300'
              }`}
            >
              PCA Spec
            </button>
            <button
              onClick={onNavigateAbout}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-700' : 'border-slate-700 hover:bg-slate-800 text-slate-300'
              }`}
            >
              เกี่ยวกับผู้สร้าง
            </button>
            <button
              onClick={handleCopyShare}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                copiedLink 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-700' : 'border-slate-700 hover:bg-slate-800 text-slate-300'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'คัดลอกลิงก์แล้ว' : 'แชร์หนังสือ'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Header Section */}
      <section className={`relative border-b py-12 px-4 sm:px-6 lg:px-8 overflow-hidden ${
        isLight ? 'bg-gradient-to-b from-amber-50/50 to-white border-slate-200' : 'bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-950 border-slate-800'
      }`}>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-mono mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Canonical Treatise · PUNN Predictive Cognitive Architecture (PCA v3.0)</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-mono mb-4">
            Firekeeper Theory
          </h1>
          <p className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            ตำราและงานวิจัยฉบับสมบูรณ์ว่าด้วยสถาปัตยกรรมการคิดเชิงทำนาย (Predictive Cognitive Architecture) ความโปร่งใสของหลักฐาน และการรักษาความมีตัวตนของมนุษย์ (Human Agency)
          </p>

          {/* Download Center Actions */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="/firekeeper_publication/Firekeeper_Theory.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-mono text-xs font-bold hover:bg-amber-400 transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด PDF ฉบับสมบูรณ์</span>
            </a>
            <a
              href="/firekeeper_publication/Firekeeper_Theory.epub"
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2.5 rounded-xl border font-mono text-xs font-bold transition-colors flex items-center gap-2 ${
                isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-800 bg-white' : 'border-slate-700 hover:bg-slate-800 text-slate-200 bg-slate-900'
              }`}
            >
              <BookMarked className="w-4 h-4 text-amber-500" />
              <span>ดาวน์โหลด EPUB (E-Reader)</span>
            </a>
            <a
              href="/firekeeper_publication/Firekeeper_Theory.html"
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2.5 rounded-xl border font-mono text-xs font-bold transition-colors flex items-center gap-2 ${
                isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-800 bg-white' : 'border-slate-700 hover:bg-slate-800 text-slate-200 bg-slate-900'
              }`}
            >
              <Globe className="w-4 h-4 text-sky-400" />
              <span>เปิดหน้า HTML เต็มจอ</span>
            </a>
            <a
              href="/firekeeper_publication/Firekeeper_Theory.md"
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2.5 rounded-xl border font-mono text-xs font-bold transition-colors flex items-center gap-2 ${
                isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-800 bg-white' : 'border-slate-700 hover:bg-slate-800 text-slate-200 bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Markdown ต้นฉบับ</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Reader Interface */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar / Chapter Navigation (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-mono text-sm font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <span>สารบัญหนังสือ (23 บท)</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  {CHAPTERS.length} บท
                </span>
              </div>

              {/* Search filter */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาบทหรือหมวดหมู่..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:border-amber-500 transition-colors ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                />
              </div>

              {/* Chapters List */}
              <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
                {filteredChapters.map((ch) => {
                  const isSelected = ch.id === selectedChapterId;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChapterId(ch.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-500/15 border border-amber-500/40 text-amber-500 font-bold shadow-sm' 
                          : isLight 
                            ? 'hover:bg-slate-100 text-slate-700 border border-transparent' 
                            : 'hover:bg-slate-800/80 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-500' : 'bg-slate-500'}`} />
                        <span className="truncate">{ch.title}</span>
                      </div>
                      <span className="text-[10px] opacity-60 font-sans tracking-wide shrink-0 ml-2">
                        {ch.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chapter Content Reader (8 Cols) */}
          <div className="lg:col-span-8">
            <div className={`p-6 sm:p-10 rounded-2xl border shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-500 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{currentChapter.category} · Firekeeper Treatise</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-tight">
                    {currentChapter.title}
                  </h2>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <a
                    href={`/firekeeper_publication/chapters/${currentChapter.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                    title="เปิดไฟล์ Markdown บทนี้ในแท็บใหม่"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                    <span>Raw MD</span>
                  </a>
                </div>
              </div>

              {/* Reader Body */}
              {loadingChapter ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                  <p className="text-xs font-mono text-slate-400">กำลังโหลดเนื้อหาบทความ...</p>
                </div>
              ) : (
                <div className={`prose max-w-none font-sans leading-relaxed text-sm sm:text-base ${
                  isLight ? 'prose-slate' : 'prose-invert prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800'
                }`}>
                  <div className="whitespace-pre-wrap font-sans text-slate-300 bg-slate-950/40 p-6 rounded-xl border border-slate-800/80 overflow-x-auto text-xs sm:text-sm leading-relaxed font-mono">
                    {chapterContent}
                  </div>
                </div>
              )}

              {/* Footer navigation between chapters */}
              <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                {(() => {
                  const currentIndex = CHAPTERS.findIndex(c => c.id === selectedChapterId);
                  const prevChapter = currentIndex > 0 ? CHAPTERS[currentIndex - 1] : null;
                  const nextChapter = currentIndex < CHAPTERS.length - 1 ? CHAPTERS[currentIndex + 1] : null;

                  return (
                    <>
                      {prevChapter ? (
                        <button
                          onClick={() => setSelectedChapterId(prevChapter.id)}
                          className={`px-4 py-2 rounded-xl border text-xs font-mono transition-colors flex items-center gap-2 ${
                            isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-700' : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                          <span>บทก่อนหน้า: {prevChapter.title.split(':')[0]}</span>
                        </button>
                      ) : <div />}

                      {nextChapter ? (
                        <button
                          onClick={() => setSelectedChapterId(nextChapter.id)}
                          className={`px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-mono font-bold hover:bg-amber-400 transition-colors flex items-center gap-2`}
                        >
                          <span>บทถัดไป: {nextChapter.title.split(':')[0]}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : <div />}
                    </>
                  );
                })()}
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
