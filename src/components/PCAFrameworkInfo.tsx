import React, { useState } from 'react';
import { BookOpen, ShieldCheck, Flame, Brain, Compass, Layers, CheckCircle, ChevronDown, ChevronRight, Cpu, Wrench, Sparkles, FileText, Copy, Check, Download, ExternalLink, Award, CheckSquare, Hash } from 'lucide-react';
import { GCPFreeTierServicesManager } from './GCPFreeTierServicesManager';
import { FireKeeperHistorySection } from './FireKeeperHistorySection';
import { CapabilityStatusPanel } from './CapabilityStatusPanel';
import { useTheme } from '../context/ThemeContext';
import { FULL_WHITEPAPER_MARKDOWN, WHITEPAPER_METADATA, WHITEPAPER_SECTIONS } from '../data/whitepaperData';

export const PCAFrameworkInfo: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [activeView, setActiveView] = useState<'architecture' | 'history' | 'whitepaper'>(() => {
    try {
      if (typeof window !== 'undefined' && window.location.pathname === '/whitepaper') {
        return 'whitepaper';
      }
    } catch (e) {}
    return 'architecture';
  });
  const [copied, setCopied] = useState(false);
  const [selectedSecId, setSelectedSecId] = useState<string>('all');

  const handleCopyWhitepaper = () => {
    navigator.clipboard.writeText(FULL_WHITEPAPER_MARKDOWN);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadWhitepaper = () => {
    const blob = new Blob([FULL_WHITEPAPER_MARKDOWN], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Firekeeper_PCA_Enterprise_Whitepaper_v3.0_2026.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 space-y-6 text-slate-200 leading-relaxed text-sm box-border">
      {/* What is PUNN Cognitive Architecture (PCA)? */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight">What is PUNN Cognitive Architecture (PCA)?</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          PUNN Cognitive Architecture (PCA) is the underlying cognitive architecture of FIRE KEEPER, designed to provide a structured framework for:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 list-disc list-inside">
          <li>contextual understanding</li>
          <li>evidence analysis</li>
          <li>reasoning</li>
          <li>strategic evaluation</li>
          <li>decision support</li>
          <li>traceable conclusions</li>
        </ul>
        <p className="text-xs text-slate-500 italic">
          In FIRE KEEPER, PCA means PUNN Cognitive Architecture, not Principal Component Analysis.
        </p>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
                PUNN Cognitive Architecture (PCA) Specification
              </h2>
              <span className="inline-block shrink-0 text-[11px] sm:text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Enterprise Whitepaper (2026 Edition)
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              กรอบการออกแบบปัญญาประดิษฐ์เชิงยุทธศาสตร์เพื่อการลงเหตุผล การประเมินความเสี่ยง และการคุ้มครอง Human Agency
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveView('architecture')}
            type="button"
            className={`flex-1 sm:flex-initial text-center px-3 py-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeView === 'architecture'
                ? 'bg-[#FF8A00] text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            สถาปัตยกรรม (Architecture)
          </button>
          <button
            onClick={() => setActiveView('history')}
            type="button"
            className={`flex-1 sm:flex-initial text-center flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeView === 'history'
                ? 'bg-[#FF8A00] text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>ประวัติศาสตร์ & ปรัชญา</span>
          </button>
          <button
            onClick={() => setActiveView('whitepaper')}
            type="button"
            className={`flex-1 sm:flex-initial text-center flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeView === 'whitepaper'
                ? 'bg-[#FF8A00] text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>White Paper (ฉบับใหม่ v3.0)</span>
          </button>
        </div>
      </div>

      {/* Conditionally Render History, Whitepaper or Architecture */}
      {activeView === 'history' ? (
        <FireKeeperHistorySection />
      ) : activeView === 'whitepaper' ? (
        <div className="space-y-6">
          {/* Main Whitepaper Container */}
          <div 
            className={`relative overflow-hidden rounded-2xl border shadow-2xl ${isLight ? 'bg-white border-slate-200 text-[#172033]' : 'bg-gradient-to-br from-[#0e1626] via-[#121c2e] to-[#0a0f1d] border-amber-500/30 text-white'}`}
            style={{
              padding: 'clamp(16px, 4vw, 40px)',
            }}
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className={`relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-6 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="space-y-3 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                    <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="break-words">PCA ENTERPRISE WHITEPAPER v3.0</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono break-words shrink-0">
                    Official 2026 Edition
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[11px] font-mono break-words">
                    NIST SP 800-61 Rev. 3 & ISO 42001 Aligned
                  </span>
                </div>
                <h3 
                  className={`font-extrabold tracking-tight ${isLight ? 'text-[#172033]' : 'text-white'}`}
                  style={{
                    fontSize: 'clamp(20px, 4.5vw, 30px)',
                    lineHeight: '1.2'
                  }}
                >
                  เอกสารวิชาการและสถาปัตยกรรมระบบ (White Paper)
                </h3>
                <p className={`text-xs sm:text-sm max-w-3xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {WHITEPAPER_METADATA.subtitle}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-mono text-slate-400 pt-1">
                  <span>📅 อัปเดตล่าสุด: {WHITEPAPER_METADATA.lastUpdated}</span>
                  <span>📄 รหัสอ้างอิง: FK-TR-2026-03</span>
                  <span>🏛️ การจำแนก: Enterprise Open Technical Specification</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto shrink-0 w-full sm:w-auto">
                <button
                  onClick={handleDownloadWhitepaper}
                  type="button"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-medium border border-slate-700 transition-all text-xs cursor-pointer shadow"
                >
                  <Download className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>ดาวน์โหลด .md</span>
                </button>
                <button
                  onClick={handleCopyWhitepaper}
                  type="button"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-slate-950 font-bold transition-all text-xs cursor-pointer shadow-md"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 shrink-0" />
                      <span>คัดลอก Markdown แล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 shrink-0" />
                      <span>คัดลอกฉบับเต็ม</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Section Filter Bar */}
            <div 
              className="mt-6 flex items-center gap-2 overflow-x-auto pb-2.5 border-b border-slate-800/60 scrollbar-none"
              style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedSecId('all')}
                className={`px-3.5 py-2 rounded-lg font-mono text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                  selectedSecId === 'all'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                ทั้งหมด (All 9 Chapters)
              </button>
              {WHITEPAPER_SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSelectedSecId(sec.id)}
                  className={`px-3.5 py-2 rounded-lg font-mono text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer flex items-center gap-2 ${
                    selectedSecId === sec.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="text-[10px] opacity-75 font-bold shrink-0">{sec.secNumber}</span>
                  <span className="font-sans font-medium">{sec.titleTh}</span>
                </button>
              ))}
            </div>

            {/* Content Chapters List */}
            <div className="mt-6 space-y-6 text-sm">
              {WHITEPAPER_SECTIONS.filter(sec => selectedSecId === 'all' || selectedSecId === sec.id).map((sec) => (
                <div
                  key={sec.id}
                  id={sec.id}
                  className={`rounded-2xl border transition-all space-y-4 ${
                    isLight ? 'bg-slate-50/80 border-slate-200 text-[#172033]' : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                  style={{
                    padding: 'clamp(16px, 3.5vw, 24px)',
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold border border-amber-500/30">
                        {sec.secNumber}
                      </span>
                      <div>
                        <h4 className="font-bold text-base text-amber-600 dark:text-amber-400">
                          {sec.titleTh}
                        </h4>
                        <div className="text-xs font-mono text-slate-400">{sec.titleEn}</div>
                      </div>
                    </div>
                    {sec.badge && (
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                        {sec.badge}
                      </span>
                    )}
                  </div>

                  <p className={`text-xs leading-relaxed italic ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    💡 {sec.summary}
                  </p>

                  <div className="space-y-2.5 text-xs sm:text-[13px] leading-relaxed">
                    {sec.content.map((p, idx) => (
                      <p key={idx} className={isLight ? 'text-slate-800' : 'text-slate-300'}>
                        {p}
                      </p>
                    ))}
                  </div>

                  {/* Subsections if available */}
                  {sec.subsections && sec.subsections.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {sec.subsections.map((sub) => (
                        <div
                          key={sub.subId}
                          className={`p-3.5 rounded-xl border space-y-1.5 ${
                            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950/80 border-slate-800/80 text-slate-300'
                          }`}
                        >
                          <div className="font-bold text-amber-600 dark:text-amber-300 text-xs flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{sub.title}</span>
                          </div>
                          <p className={`text-[11.5px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                            {sub.description}
                          </p>
                          {sub.formula && (
                            <div className="p-2 rounded bg-slate-900 border border-amber-500/20 font-mono text-[11px] text-amber-300 overflow-x-auto">
                              <code>{sub.formula}</code>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Active Standards Reference Matrix */}
            <div className={`mt-8 p-6 rounded-2xl border space-y-4 ${isLight ? 'bg-sky-50/50 border-sky-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'}`}>
              <div className="flex items-center gap-2 font-bold text-sky-500 text-sm">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
                <span>Authoritative Standards Reference Matrix (มาตรฐานสากลฉบับบังคับใช้ 2026)</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-900 text-slate-300 font-mono text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-3">มาตรฐาน / กรอบสากล</th>
                      <th className="p-3">ฉบับที่เป็นปัจจุบัน (Active Status)</th>
                      <th className="p-3">บทบาทและการบังคับใช้ในระบบ PCA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans text-slate-300">
                    <tr>
                      <td className="p-3 font-mono font-bold text-amber-400">NIST SP 800-61 Rev. 3</td>
                      <td className="p-3 text-emerald-400 font-mono text-[11px]">2024 Active (แทนที่ Rev. 2)</td>
                      <td className="p-3 text-slate-400">Incident Response, Crisis Triage, Digital Forensics Chain of Custody</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-sky-400">NIST CSF 2.0</td>
                      <td className="p-3 text-emerald-400 font-mono text-[11px]">2024 Active (CSF 2.0)</td>
                      <td className="p-3 text-slate-400">Cybersecurity Framework 6 แกน พร้อมฟังก์ชัน GOVERN ระดับสูงสุด</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-indigo-400">ISO/IEC 42001:2023</td>
                      <td className="p-3 text-emerald-400 font-mono text-[11px]">2023 Active</td>
                      <td className="p-3 text-slate-400">Artificial Intelligence Management System (AIMS) & Risk Controls</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-purple-400">NIST AI RMF 1.0</td>
                      <td className="p-3 text-emerald-400 font-mono text-[11px]">2023 Active (AI 100-1)</td>
                      <td className="p-3 text-slate-400">GOVERN, MAP, MEASURE, MANAGE สำหรับระบบปัญญาประดิษฐ์ที่น่าเชื่อถือ</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-rose-400">ISO/IEC 27001:2022</td>
                      <td className="p-3 text-emerald-400 font-mono text-[11px]">2022 Active</td>
                      <td className="p-3 text-slate-400">Information Security Management Systems & Access Control Policies</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-xs text-slate-400 font-mono break-all md:break-normal">
                Citation: {WHITEPAPER_METADATA.citation}
              </div>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadWhitepaper}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition cursor-pointer border border-slate-700 shadow"
                >
                  <Download className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>ดาวน์โหลดไฟล์ Markdown</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyWhitepaper}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md"
                >
                  {copied ? <Check className="w-4 h-4 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
                  <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกฉบับเต็ม (Copy All)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Core Architectural Pillars */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-1">
              <div className="flex items-center gap-2 font-bold text-indigo-400 font-mono text-xs">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Design Intent & Governance Principles (เจตนารมณ์การออกแบบ)</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                อ้างอิงกรอบแนวคิด Human-in-the-Loop, Transparent Confidence และการวิเคราะห์เชิงโครงสร้าง เพื่อสนับสนุนการตัดสินใจเชิงยุทธศาสตร์ภายใต้ความรับผิดชอบของมนุษย์
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-400 font-mono text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Forensically Verified Capabilities (สิ่งที่พิสูจน์ได้จาก Audit Package)</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                ความสมบูรณ์ของเอกสารและหลักฐานการประมวลผลที่ตรวจสอบได้ทางคริปโตกราฟี (Cryptographic Integrity, WORM Chain, TSR Timestamp และ SHA-256 Hashes)
              </p>
            </div>
          </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-sm">1. Human Agency Preserved</h3>
          <p className="text-xs text-slate-400">
            ระบบทำหน้าที่สนับสนุนการตัดสินใจเชิงยุทธศาสตร์ ประเมินทางเลือกและ Trade-offs โดยคงอำนาจการตัดสินใจขั้นสุดท้ายไว้ที่มนุษย์เสมอ (Human-in-the-Loop)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-sm">2. Structured Analysis & Evaluation</h3>
          <p className="text-xs text-slate-400">
            การจำแนกองค์ประกอบข้อมูลออกเป็นมิติเชิงตรรกะ เพื่อแยกแยะข้อเท็จจริงเชิงประจักษ์ สมมติฐานทางเลือก ความเสี่ยง และหลักฐานสนับสนุนอย่างโปร่งใส
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="w-8 h-8 rounded-xl bg-sky-950/80 border border-sky-500/40 text-sky-400 flex items-center justify-center">
            <Brain className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-sm">3. Transparent Confidence</h3>
          <p className="text-xs text-slate-400">
            การประเมินระดับความมั่นใจอย่างตรงไปตรงมา พร้อมระบุสัญญาณข้อมูลที่ยังขาดหายไป เพื่อป้องกันความมั่นใจเกินจริงและลดความเสี่ยงในการดำเนินงาน
          </p>
        </div>
      </div>

      {/* 📖 PCA Architectural Glossary & Core Governance Standards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">PCA Enterprise Conceptual Glossary (อภิธานศัพท์เชิงแนวคิด)</h3>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Governance Standard
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          คำศัพท์มาตรฐานในระดับ Conceptual Capability เพื่อสร้างความเข้าใจตรงกันระหว่างผู้บริหาร นักวิเคราะห์ และผู้ตรวจสอบ:
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3 w-1/4">Concept / Term</th>
                <th className="p-3 w-1/4">Domain Focus</th>
                <th className="p-3 w-1/2">Observable Capability & Definition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 text-slate-300">
              <tr>
                <td className="p-3 font-mono font-bold text-amber-400">12-Stage Reasoning Pipeline</td>
                <td className="p-3 font-mono text-[11px] text-indigo-400">Architecture</td>
                <td className="p-3">วงจรการประมวลผล 12 ขั้นตอนของ PUNN PCA เพื่อตรวจสอบข้อเท็จจริง คัดกรองสมมติฐาน ชั่งน้ำหนักหลักฐาน และประเมินความเสี่ยงภายในระบบก่อนสังเคราะห์ข้อเสนอแนะ</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-amber-400">Structured Reasoning</td>
                <td className="p-3 font-mono text-[11px] text-indigo-400">Analysis</td>
                <td className="p-3">กระบวนการวิเคราะห์เชิงโครงสร้างที่จำแนกข้อเท็จจริง สมมติฐาน และประเมินความเสี่ยงอย่างเป็นระบบ</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-emerald-400">HITL (Human Agency)</td>
                <td className="p-3 font-mono text-[11px] text-indigo-400">Governance</td>
                <td className="p-3">การออกแบบให้มนุษย์เป็นผู้กำกับและตัดสินใจขั้นสุดท้าย เพื่อป้องกันการตัดสินใจอัตโนมัติในจุดเสี่ยง</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-sky-400">Deterministic Guardrails</td>
                <td className="p-3 font-mono text-[11px] text-indigo-400">Safety</td>
                <td className="p-3">มาตรการควบคุมความปลอดภัยและนโยบายองค์กรที่ไม่ยินยอมให้ข้ามผ่าน (เช่น Compliance & PDPA alignment)</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-purple-400">Verifiable Audit Trail</td>
                <td className="p-3 font-mono text-[11px] text-indigo-400">Compliance</td>
                <td className="p-3">การบันทึกร่องรอยการวิเคราะห์และเหตุผลประกอบการตัดสินใจเพื่อให้สามารถตรวจสอบย้อนหลังได้</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-rose-400">Transparent Confidence</td>
                <td className="p-3 font-mono text-[11px] text-indigo-400">Reliability</td>
                <td className="p-3">การรายงานระดับความมั่นใจพร้อมระบุเงื่อนไขและข้อมูลที่ยังขาดหายไปอย่างไร้ความอคติ</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-cyan-400">Context Adaptability</td>
                <td className="p-3 font-mono text-[11px] text-amber-400">Localization</td>
                <td className="p-3">ความสามารถในการปรับตัวตามบริบทกฎหมายและสภาพแวดล้อมเฉพาะทาง (เช่น บริบทประเทศไทย)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* High-Level Operational Capabilities */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          High-Level Operational Capabilities (ความสามารถเชิงปฏิบัติการ)
        </h3>
        <p className="text-xs text-slate-400">
          ลักษณะการทำงานภายนอกที่ผู้ใช้และองค์กรสามารถสังเกตเห็นได้ (Observable Behavior):
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="font-bold text-amber-400 font-mono">1. Intent & Context Comprehension</span>
            <p className="text-slate-300">วิเคราะห์เจตนาและความต้องการเชิงลึกของผู้ใช้ พร้อมปรับบริบทให้สอดคล้องกับมาตรฐานองค์กร</p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="font-bold text-amber-400 font-mono">2. Multi-Hypothesis Evaluation</span>
            <p className="text-slate-300">ประเมินทางเลือกและสมมติฐานที่หลากหลาย พร้อมเปรียบเทียบข้อดี ข้อเสีย และ Trade-offs</p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="font-bold text-amber-400 font-mono">3. Risk & Vulnerability Critique</span>
            <p className="text-slate-300">ตรวจสอบจุดอ่อน ความเสี่ยง และสัญญาณข้อมูลที่ยังขาดหายไปเพื่อป้องกันข้อผิดพลาด</p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="font-bold text-amber-400 font-mono">4. Verifiable Decision Support</span>
            <p className="text-slate-300">นำเสนอคำแนะนำเชิงยุทธศาสตร์ที่ตรวจสอบย้อนหลังได้ พร้อมรักษา Human Agency เต็มรูปแบบ</p>
          </div>
        </div>
      </div>

      {/* ── Collapsible PCA Strategic Enterprise Roadmap & Product Hypothesis ── */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl transition-all">
        <button
          type="button"
          onClick={() => setIsRoadmapOpen(!isRoadmapOpen)}
          className="w-full p-5 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 flex items-center justify-between text-left hover:bg-slate-800/50 transition cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                PCA Strategic Enterprise Roadmap & Value Proposition
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                  Enterprise Whitepaper
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                วิสัยทัศน์ทางธุรกิจ กลุ่มเป้าหมาย และแผนพัฒนาความสามารถของระบบในระดับองค์กร
              </p>
            </div>
          </div>
          <div className="text-amber-400 shrink-0 ml-2">
            {isRoadmapOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
        </button>

        {isRoadmapOpen && (
          <div className="p-6 border-t border-slate-800 space-y-6 animate-fade-in">
            {/* Product Hypothesis Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
              <h4 className="text-xs font-bold text-amber-400 font-mono flex items-center gap-2">
                <span>🎯 Product Hypothesis & Business Value Proposition</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-white text-[11px]">1. Target Customer (กลุ่มเป้าหมาย)</div>
                  <p className="text-[11px] text-slate-400">องค์กรที่มีความสุ่มเสี่ยงสูง (Regulated Enterprise): ธนาคาร, ประกันภัย, การแพทย์, และฝ่ายกฎหมายที่ต้องการ Audit Trail ย้อนหลังได้</p>
                </div>
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-white text-[11px]">2. Problem Replaced (สิ่งที่ทดแทน)</div>
                  <p className="text-[11px] text-slate-400">ทดแทนการสร้าง Custom Prompt In-house ที่ไม่มี Audit Trail และขาดกลไกยับยั้งความเสี่ยงแบบ Deterministic Guardrail</p>
                </div>
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-white text-[11px]">3. Willingness to Pay (ทำไมถึงจ่าย)</div>
                  <p className="text-[11px] text-slate-400">จ่ายเพื่อลดความเสี่ยงด้าน Liability & Regulatory Penalty และป้องกัน Hallucination ในเคสเสี่ยงสูง</p>
                </div>
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-white text-[11px]">4. Primary KPI (ตัวชี้วัดหลัก)</div>
                  <p className="text-[11px] text-slate-400">Audit Verification Rate (99.8%), Human Intervention Override Rate (&lt;5%), และ Epistemic Verification Design</p>
                </div>
              </div>
            </div>

            {/* 4 Phases Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Phase 1 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-indigo-400 font-mono text-xs">Phase 1 — Core Reliability</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">Current Focus</span>
                </div>
                <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                  <li>พัฒนาโครงสร้างการประมวลผลและการตรวจสอบย้อนหลัง (Audit Trail) ให้มีความเสถียรสูงสุด</li>
                  <li>สร้างระบบตรวจสอบความถูกต้องของข้อมูลและผลลัพธ์ตามเกณฑ์มาตรฐาน</li>
                </ul>
              </div>

              {/* Phase 2 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-sky-400 font-mono text-xs">Phase 2 — Knowledge Integration</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Planned</span>
                </div>
                <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                  <li>เชื่อมต่อฐานข้อมูลภายนอกและแหล่งอ้างอิงกฎหมายเฉพาะทาง</li>
                  <li>พัฒนาระบบ Citation และการอ้างอิงแหล่งที่มาอย่างแม่นยำ</li>
                </ul>
              </div>

              {/* Phase 3 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-rose-400 font-mono text-xs">Phase 3 — Advanced Governance</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Planned</span>
                </div>
                <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                  <li>ระบบจัดการสิทธิ์ผู้ใช้งานระดับองค์กร (RBAC) และนโยบายความปลอดภัยแบบไดนามิก</li>
                  <li>การทดสอบความปลอดภัยและการประเมินความเสี่ยงจากผู้เชี่ยวชาญภายนอก</li>
                </ul>
              </div>

              {/* Phase 4 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-emerald-400 font-mono text-xs">Phase 4 — Enterprise Scale</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Target Milestone</span>
                </div>
                <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                  <li>ร่วมมือกับพาร์ทเนอร์เชิงกลยุทธ์ในการใช้งานจริงระดับองค์กร</li>
                  <li>เผยแพร่รายงานการประเมินประสิทธิภาพและความคุ้มค่าต่อการลงทุน</li>
                </ul>
              </div>
            </div>

            {/* ── Enterprise Governance & Standards ── */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                องค์ประกอบการควบคุมธรรมาภิบาลตามมาตรฐานสากล (Global Compliance Standards)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {/* ISO/IEC 42001 */}
                <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-300 text-xs flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-sky-400" />
                      ISO/IEC 42001:2023 (AIMS Alignment)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    เทียบเคียงกรอบระบบบริหารจัดการปัญญาประดิษฐ์ในด้านการประเมินความเสี่ยงและการกำกับดูแลโดยมนุษย์ เพื่อให้การตัดสินใจตรวจสอบย้อนหลังได้ทุกขั้นตอน
                  </p>
                </div>

                {/* NIST AI RMF 1.0 */}
                <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-indigo-400" />
                      NIST AI RMF 1.0 Framework
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    ประยุกต์ใช้หลักการกำกับดูแล (GOVERN, MAP, MEASURE, MANAGE) และตัวชี้วัดความน่าเชื่อถือเพื่อความปลอดภัยและความยืดหยุ่นในการใช้งาน
                  </p>
                </div>
              </div>
            </div>

            {/* ── GCP Cloud Infrastructure & Credits Integration ── */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Active Google Cloud Project Configuration
              </h4>

              <div className="p-4 bg-emerald-950/20 rounded-xl border border-emerald-500/30 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">ACTIVE PROJECT</span>
                    <span className="text-white font-bold">Production GCP Project</span>
                  </div>
                  <span className="text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 text-[11px]">
                    Billing: Active Cloud Account
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] py-1">
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Project Type</div>
                    <div className="text-white font-bold truncate">Production Serverless</div>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Region</div>
                    <div className="text-white font-bold">asia-southeast1</div>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Runtime</div>
                    <div className="text-white font-bold">Cloud Run Container</div>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Gemini Model</div>
                    <div className="text-white font-bold">gemini-3.5-flash-lite</div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  ตัวแอปพลิเคชันถูกแพ็กเกจและรันบน Cloud Run ภายใต้ระบบคลาวด์มาตรฐาน การใช้งานบริการ Google Cloud และ Gemini API จัดการผ่าน Billing Account ขององค์กรอย่างปลอดภัย
                </p>
              </div>

              {/* Capability Status Panel & Evidence Metadata */}
              <div className="pt-2">
                <CapabilityStatusPanel />
              </div>

              {/* System Implementation Status Matrix */}
              <div className="pt-2 space-y-3">
                <h5 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  System Implementation Status Matrix (ตารางตรวจสอบสถานะการทำงานจริง vs แนวคิด)
                </h5>
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-[11px] text-slate-300 font-sans">
                    <thead className="bg-slate-900 text-slate-200 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Capability / Feature</th>
                        <th className="p-2.5 text-center">Status</th>
                        <th className="p-2.5">Verification & Implementation Detail</th>
                        <th className="p-2.5">Evidence / Traceability Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      <tr>
                        <td className="p-2.5 font-medium text-white">Gemini API Integration</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">ทำงานจริง (Implemented)</span>
                        </td>
                        <td className="p-2.5 text-slate-400">ใช้ @google/genai SDK ผ่าน `process.env.GEMINI_API_KEY` ของโปรเจกต์ GCP จริง</td>
                        <td className="p-2.5 font-mono text-[10px] text-sky-400">src/lib/gemini.ts, @google/genai</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-white">Cryptographic Audit Package (.zip)</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">ทำงานจริง (Verified)</span>
                        </td>
                        <td className="p-2.5 text-slate-400">สร้างไฟล์ SHA-256 hashes, WORM chain (JSONL), และ RFC3161 Timestamp (.tsr) ได้จริง</td>
                        <td className="p-2.5 font-mono text-[10px] text-sky-400">manifest.json, audit.sig, timestamp.tsr</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-white">Containerized Deployment on Cloud Run</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">ทำงานจริง (Containerized)</span>
                        </td>
                        <td className="p-2.5 text-slate-400">แอปพลิเคชันรันบน Cloud Run container ภายในโปรเจกต์ GCP ภายใต้พอร์ตมาตรฐาน 3000</td>
                        <td className="p-2.5 font-mono text-[10px] text-sky-400">Cloud Run Service URL / Revision ID</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-white">Vertex AI SDK (Dedicated)</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">แนวคิด/สถาปัตยกรรม (Design Intent)</span>
                        </td>
                        <td className="p-2.5 text-slate-400">ปัจจุบันใช้งานผ่าน Gemini Developer API (`@google/genai`) ไม่ได้ใช้ Vertex AI Python/Node SDK โดยตรง</td>
                        <td className="p-2.5 font-mono text-[10px] text-amber-400">Conceptual Architecture Spec</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-white">Automated ISO/NIST Compliance</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">อ้างอิงกรอบแนวคิด (Design Reference)</span>
                        </td>
                        <td className="p-2.5 text-slate-400">เป็นการออกแบบสถาปัตยกรรมให้สอดคล้องกับหลักการ (Aligned with AIMS/RMF) ไม่ใช่ใบรับรองสำเร็จรูป</td>
                        <td className="p-2.5 font-mono text-[10px] text-amber-400">ISO 42001 & NIST AI RMF Alignment Guide</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── All 5 GCP Free Tier & Enterprise Services Manager ── */}
              {/* Hiding GCP configuration section as requested by user */}
            </div>
          </div>
        )}
      </div>

      {/* Intellectual Property & Architecture Whitepaper Disclaimer */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 leading-relaxed font-mono space-y-2 shadow-xl">
        <div className="flex items-center space-x-2 text-amber-400 font-bold">
          <span>🛡️</span>
          <span>Architecture Whitepaper & IP Protection Disclaimer</span>
        </div>
        <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
          This document describes the conceptual architecture of PCA v2.0. Certain implementation details, algorithms, heuristics, configuration parameters, prompt engineering techniques, optimization strategies, and proprietary components have been intentionally omitted to protect intellectual property and trade secrets. This document is intended to describe conceptual capabilities and governance principles only. It is not a software design specification and should not be interpreted as documentation of the internal implementation, runtime behavior, prompt architecture, proprietary algorithms, or configuration of PCA.
        </p>
      </div>
    </>
  )}
</div>
  );
};
