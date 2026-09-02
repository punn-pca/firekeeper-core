import React, { useState } from 'react';
import { 
  Flame, 
  Sparkles, 
  Brain, 
  Compass, 
  Layers, 
  Cpu, 
  Globe, 
  FileText, 
  ShieldCheck, 
  ChevronRight, 
  Quote, 
  CheckCircle2, 
  ArrowRight,
  BookOpen,
  Atom,
  Eye,
  HeartHandshake,
  ExternalLink,
  Share2,
  Copy,
  Check,
  Award,
  UserCheck,
  Home,
  MessageSquare
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface AboutPunnPageProps {
  onBackToApp?: () => void;
  onNavigateHome?: () => void;
  onNavigatePca?: () => void;
  onNavigateChat?: () => void;
}

export const AboutPunnPage: React.FC<AboutPunnPageProps> = ({
  onBackToApp,
  onNavigateHome,
  onNavigatePca,
  onNavigateChat
}) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + '/about');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const socialChannels = [
    {
      platform: 'X (Twitter)',
      handle: '@punn_firekeeper',
      url: 'https://x.com/punn_firekeeper',
      category: 'Real-time Thoughts & Dispatch',
      description: 'ข้อคิดสั้น ความคืบหน้าการวิจัย และมุมมองทันเหตุการณ์เกี่ยวกับ AI & Cognitive Systems',
      badge: 'Official X',
      color: 'from-sky-500/20 to-blue-500/20 border-sky-500/30 text-sky-400'
    },
    {
      platform: 'TikTok',
      handle: '@punn_firekeeper',
      url: 'https://www.tiktok.com/@punn_firekeeper',
      category: 'Video Essays & Philosophy',
      description: 'แบ่งปันแนวคิด Firekeeper Theory, ปรัชญาชีวิต, และมุมมองต่อปัญญาประดิษฐ์',
      badge: 'Official TikTok',
      color: 'from-pink-500/20 to-purple-500/20 border-pink-500/30 text-pink-400'
    },
    {
      platform: 'Instagram',
      handle: '@punn.parameth',
      url: 'https://www.instagram.com/punn.parameth/',
      category: 'Personal & Creative Journal',
      description: 'บันทึกความคิด การค้นคว้าเชิงลึก และชีวิตในฐานะ Keeper of Inner Light',
      badge: 'Official Instagram',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400'
    },
    {
      platform: 'GitHub (Historical Reference)',
      handle: 'punn-pca/punn-cognitive-architecture',
      url: 'https://github.com/punn-pca/punn-cognitive-architecture',
      category: 'Reference Prototype & Cognitive DNA',
      description: 'พื้นที่ประวัติศาสตร์และต้นแบบระยะแรกของ PUNN Cognitive Architecture บันทึก 12-Stage Cognitive DNA และ Firekeeper Supervision',
      badge: 'Historical Reference',
      color: 'from-slate-500/20 to-sky-500/20 border-sky-500/40 text-sky-400'
    },
    {
      platform: 'Medium',
      handle: 'Punn FireKeeper',
      url: 'https://medium.com',
      category: 'Long-form Essays & Whitepapers',
      description: 'บทความวิเคราะห์เชิงลึกว่าด้วย Cognitive Architecture, ธรรมาภิบาล AI และญาณวิทยา',
      badge: 'Official Medium',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400'
    },
    {
      platform: 'Patreon',
      handle: 'Punn | The Firekeeper',
      url: 'https://www.patreon.com',
      category: 'Deep Research & Fellowship',
      description: 'พื้นที่สนับสนุนงานวิจัยอิสระ ผลงานปรัชญา และเบื้องหลังการพัฒนาระบบสถาปัตยกรรม',
      badge: 'Official Patreon',
      color: 'from-red-500/20 to-rose-500/20 border-red-500/30 text-rose-400'
    },
    {
      platform: 'FIRE KEEPER Platform',
      handle: 'firekeeper.site',
      url: 'https://firekeeper.site',
      category: 'Enterprise Decision Intelligence',
      description: 'แพลตฟอร์มการตัดสินใจสำหรับผู้บริหารระดับองค์กรที่ขับเคลื่อนด้วย PUNN PCA v3.0',
      badge: 'Live Platform',
      color: 'from-amber-500/30 to-amber-700/30 border-amber-500/50 text-[#FF8A00]'
    }
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors ${
      isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#040711] text-slate-100'
    }`}>
      {/* Top Sticky Header */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
        isLight ? 'bg-white/90 border-slate-200 shadow-xs' : 'bg-[#060A16]/90 border-white/10 shadow-lg'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome || onBackToApp}
              className="flex items-center gap-2.5 group cursor-pointer"
              title="กลับสู่หน้าหลัก FIRE KEEPER"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Flame className="w-4.5 h-4.5 text-slate-950 fill-slate-950" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm tracking-wider text-[#FF8A00]">
                  FIRE KEEPER
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  PUNN PCA v3.0
                </div>
              </div>
            </button>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="text-xs font-mono font-semibold text-slate-400 hidden sm:inline">
              เกี่ยวกับฉัน · About Punn
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'คัดลอกลิงก์แล้ว' : 'แชร์หน้านี้'}</span>
            </button>

            {onNavigatePca && (
              <button
                onClick={onNavigatePca}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                  isLight 
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900' 
                    : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span className="hidden md:inline">PUNN PCA Spec</span>
              </button>
            )}

            <button
              onClick={onBackToApp || onNavigateHome}
              className="px-3.5 py-1.5 rounded-lg bg-[#FF8A00] hover:bg-[#FFA333] text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบหลัก</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        
        {/* Profile / Hero Section */}
        <section className={`p-6 sm:p-10 rounded-2xl border relative overflow-hidden ${
          isLight 
            ? 'bg-white border-slate-200 shadow-sm' 
            : 'bg-gradient-to-b from-[#0B132B] to-[#060A16] border-amber-500/20 shadow-2xl'
        }`}>
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
              <span className={`px-2.5 py-1 rounded-md font-bold border ${
                isLight 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              }`}>
                Founder Profile · ประวัติผู้สร้าง
              </span>
              <span className={`px-2.5 py-1 rounded-md border ${
                isLight 
                  ? 'bg-slate-100 text-slate-700 border-slate-300' 
                  : 'bg-slate-800/60 text-slate-300 border-slate-700'
              }`}>
                Keeper of Inner Light
              </span>
            </div>

            <div className="space-y-2">
              <h1 className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}>
                ปุญญ์ ปรเมษฐ์ ปุญกัลรโชติ
              </h1>
              <p className={`text-base sm:text-xl font-medium font-mono ${
                isLight ? 'text-amber-800' : 'text-[#FF9D2E]'
              }`}>
                Punn Firekeeper · Founder of Firekeeper Theory · Keeper of Inner Light
              </p>
            </div>

            {/* Core Manifesto Quote Box */}
            <div className={`p-5 sm:p-6 rounded-xl border space-y-3 leading-relaxed ${
              isLight 
                ? 'bg-amber-50/90 border-amber-200 text-slate-900' 
                : 'bg-amber-500/15 border-amber-500/35 text-slate-100'
            }`}>
              <div className="flex items-start gap-3">
                <Quote className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                <div className="space-y-2">
                  <p className="font-semibold text-sm sm:text-base leading-relaxed">
                    ผู้สร้างแนวคิด <strong>Firekeeper Theory</strong> และผู้พัฒนา <strong>FIRE KEEPER</strong> — Executive Decision Intelligence & Enterprise AI Governance Platform powered by <strong>PUNN Predictive Cognitive Architecture (PCA)</strong>
                  </p>
                  <p className={`text-xs sm:text-sm font-medium ${
                    isLight ? 'text-slate-700' : 'text-slate-200'
                  }`}>
                    “ไฟไม่ใช่สิ่งที่เราครอบครองเพื่อแสดงอำนาจ แต่คือแก่นแท้ของชีวิต สติปัญญา และเสรีภาพในการเลือกที่มนุษย์ต้องช่วยกันรักษาไว้ไม่ให้ดับท่ามกลางความผันผวนของโลก”
                  </p>
                </div>
              </div>
            </div>

            {/* Entity Mapping Hierarchy Diagram */}
            <div className={`p-4 sm:p-5 rounded-xl border space-y-4 ${
              isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/50 border-white/15'
            }`}>
              <div className={`text-[11px] font-mono uppercase tracking-wider font-bold flex items-center justify-between ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span>Architectural Lineage (สายวิวัฒนาการระดับสถาปัตยกรรมและระบบ)</span>
                </div>
                <span className="text-[10px] text-amber-500 font-bold hidden sm:inline">
                  LLMs generate language · PCA structures reasoning
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className={`p-3 rounded-lg border flex flex-col justify-between ${
                  isLight ? 'bg-white border-amber-300 text-slate-900' : 'bg-white/10 border-amber-500/40 text-slate-100'
                }`}>
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold block mb-1">01. INDIVIDUAL & IDENTITY</span>
                    <strong className={`block text-sm ${isLight ? 'text-slate-950' : 'text-white'}`}>Punn (ปุญญ์)</strong>
                    <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Punn Firekeeper</span>
                  </div>
                  <div className={`mt-2 text-[10px] border-t pt-1 font-mono ${
                    isLight ? 'text-slate-600 border-slate-200' : 'text-slate-300 border-white/10'
                  }`}>
                    Keeper of Inner Light
                  </div>
                </div>

                <div className={`p-3 rounded-lg border flex flex-col justify-between ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-white/10 border-white/20 text-slate-100'
                }`}>
                  <div>
                    <span className="text-[10px] font-mono text-orange-400 font-bold block mb-1">02. PHILOSOPHY & SUPERVISION</span>
                    <strong className={`block text-sm ${isLight ? 'text-slate-950' : 'text-white'}`}>Firekeeper Theory</strong>
                    <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Human Agency & Governance</span>
                  </div>
                  <div className={`mt-2 text-[10px] border-t pt-1 font-mono ${
                    isLight ? 'text-slate-600 border-slate-200' : 'text-slate-300 border-white/10'
                  }`}>
                    Uncertainty & Non-coercion
                  </div>
                </div>

                <div className={`p-3 rounded-lg border flex flex-col justify-between ${
                  isLight ? 'bg-white border-sky-300 text-slate-900' : 'bg-white/10 border-sky-500/40 text-slate-100'
                }`}>
                  <div>
                    <span className="text-[10px] font-mono text-sky-400 font-bold block mb-1">03. COGNITIVE DNA & PROTOTYPE</span>
                    <strong className={`block text-sm ${isLight ? 'text-slate-950' : 'text-white'}`}>punn-pca Prototype</strong>
                    <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>12-Stage Cognitive DNA</span>
                  </div>
                  <div className={`mt-2 text-[10px] border-t pt-1 font-mono ${
                    isLight ? 'text-slate-600 border-slate-200' : 'text-slate-300 border-white/10'
                  }`}>
                    Historical Reference Repo
                  </div>
                </div>

                <div className={`p-3 rounded-lg border flex flex-col justify-between ${
                  isLight ? 'bg-white border-purple-300 text-slate-900' : 'bg-white/10 border-purple-500/40 text-slate-100'
                }`}>
                  <div>
                    <span className="text-[10px] font-mono text-purple-400 font-bold block mb-1">04. PLATFORM & ARCHITECTURE</span>
                    <strong className={`block text-sm ${isLight ? 'text-slate-950' : 'text-white'}`}>FIRE KEEPER (PCA)</strong>
                    <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Executive Decision Intelligence</span>
                  </div>
                  <div className={`mt-2 text-[10px] border-t pt-1 font-mono ${
                    isLight ? 'text-slate-600 border-slate-200' : 'text-slate-300 border-white/10'
                  }`}>
                    Enterprise AI Governance
                  </div>
                </div>
              </div>

              {/* Charter Axiom Banner */}
              <div className={`p-3 rounded-lg border text-center font-mono text-xs ${
                isLight ? 'bg-amber-100/60 border-amber-200 text-amber-950' : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              }`}>
                “The purpose of intelligence is not to think for humanity. The purpose of intelligence is to help humanity think better.”
              </div>
            </div>
          </div>
        </section>

        {/* Section: จุดเริ่มต้นและปรัชญา Firekeeper Theory */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[#FF8A00]">
            <Flame className="w-5 h-5 text-[#FF8A00]" />
            <h2 className={`text-lg sm:text-xl font-bold font-mono tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              01 · ทฤษฎีผู้รักษาไฟ (Firekeeper Theory & Keeper of Inner Light)
            </h2>
          </div>

          <div className={`p-6 rounded-2xl border space-y-4 text-sm sm:text-base leading-relaxed ${
            isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0E172A] border-slate-700 text-slate-200'
          }`}>
            <p className={isLight ? 'text-slate-800' : 'text-slate-200'}>
              จุดเริ่มต้นของ <strong>Firekeeper</strong> ไม่ได้เริ่มจากโค้ดหรือโมเดลปัญญาประดิษฐ์ แต่เริ่มต้นจากการตั้งคำถามเชิงปรัชญาและการค้นหาความหมายของการดำรงอยู่ของมนุษย์:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3">
              <div className={`p-4 rounded-xl border ${
                isLight ? 'bg-amber-50 border-amber-300' : 'bg-slate-900/90 border-amber-500/40'
              }`}>
                <span className={`text-xs font-mono font-bold block mb-1 ${
                  isLight ? 'text-amber-800' : 'text-amber-400'
                }`}>🔥 “ไฟ” (The Fire)</span>
                <p className={`text-xs sm:text-[13px] leading-relaxed ${
                  isLight ? 'text-slate-700' : 'text-slate-200'
                }`}>
                  ไม่ใช่แค่พลังงานทางกายภาพ แต่คือสติปัญญา ความมีสติรู้ ความตระหนักรู้ในตนเอง (Consciousness) ความหวัง และเจตจำนงเสรีที่ขับเคลื่อนมนุษย์ไปข้างหน้า
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${
                isLight ? 'bg-orange-50 border-orange-300' : 'bg-slate-900/90 border-orange-500/40'
              }`}>
                <span className={`text-xs font-mono font-bold block mb-1 ${
                  isLight ? 'text-orange-800' : 'text-orange-400'
                }`}>🛡️ “ผู้รักษา” (The Keeper)</span>
                <p className={`text-xs sm:text-[13px] leading-relaxed ${
                  isLight ? 'text-slate-700' : 'text-slate-200'
                }`}>
                  ไม่ได้หมายถึงผู้ผูกขาดอำนาจหรือครอบครองไฟไว้คนเดียว แต่คือผู้ที่ทำหน้าที่ปกป้อง คอยเติมเชื้อไฟ และประคองแสงสว่างให้คงอยู่แม้ในวันที่ลมพายุความไม่แน่นอนพัดกระหน่ำ
                </p>
              </div>
            </div>

            <p className={isLight ? 'text-slate-800' : 'text-slate-200'}>
              จากแนวคิดนี้ ปุญญ์ ปรเมษฐ์ จึงได้ต่อยอดจากปรัชญาส่วนบุคคลไปสู่การออกแบบกรอบคิดสากล ว่าด้วยการที่มนุษย์ควรจะร่วมมือและใช้งานเทคโนโลยีอย่างไร โดยไม่สูญเสีย <strong>Human Sovereignty (อำนาจอธิปไตยในการตัดสินใจของมนุษย์)</strong> ไปให้กับระบบอัตโนมัติ
            </p>
          </div>
        </section>

        {/* Section: สู่การเป็น FIRE KEEPER Platform & PUNN PCA */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-amber-500">
            <Brain className="w-5 h-5 text-amber-400" />
            <h2 className={`text-lg sm:text-xl font-bold font-mono tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              02 · จากปรัชญาสู่สถาปัตยกรรม: FIRE KEEPER & PUNN PCA
            </h2>
          </div>

          <div className={`p-6 rounded-2xl border space-y-4 text-sm sm:text-base leading-relaxed ${
            isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0E172A] border-slate-700 text-slate-200'
          }`}>
            <p className={isLight ? 'text-slate-800' : 'text-slate-200'}>
              เมื่อโลกก้าวสู่ยุคที่ปัญญาประดิษฐ์ (AI) เข้ามามีบทบาทสำคัญต่อการบริหารและการตัดสินใจระดับสูง ปัญหาที่พบคือระบบ AI ส่วนใหญ่ทำงานในลักษณะ <em>Black-Box (กล่องดำ)</em> ที่ไม่สามารถตรวจสอบเหตุผลที่แท้จริงได้ และมักสร้างภาพลวงตาทางข้อมูล (Hallucination)
            </p>

            <p className={isLight ? 'text-slate-800' : 'text-slate-200'}>
              เพื่อแก้ปัญหานี้ ปุญญ์จึงได้คิดค้นและสถาปนา <strong>PUNN Predictive Cognitive Architecture (PCA v3.0)</strong> ขึ้น โดยกำหนดให้การให้เหตุผลของ AI ต้องแบ่งออกเป็น 12 ขั้นตอนเชิงญาณวิทยา (12-Stage Epistemic State Machine):
            </p>

            <ul className="space-y-2.5 list-none pl-0 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className={isLight ? 'text-slate-800' : 'text-slate-200'}><strong className={isLight ? 'text-slate-950' : 'text-white'}>Epistemic Taxonomy:</strong> จำแนกข้อเท็จจริง คำกล่าวอ้าง สมมติฐาน และความไม่แน่นอนออกจากกันอย่างเด็ดขาด</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className={isLight ? 'text-slate-800' : 'text-slate-200'}><strong className={isLight ? 'text-slate-950' : 'text-white'}>Analysis of Competing Hypotheses (ACH):</strong> ประเมินสมมติฐานแข่งขันเพื่อขจัดอคติทางการรับรู้</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className={isLight ? 'text-slate-800' : 'text-slate-200'}><strong className={isLight ? 'text-slate-950' : 'text-white'}>Bayesian Confidence Calibration:</strong> คำนวณความน่าจะเป็นอย่างเป็นรูปธรรม แทนการสุ่มคำตอบ</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className={isLight ? 'text-slate-800' : 'text-slate-200'}><strong className={isLight ? 'text-slate-950' : 'text-white'}>Cryptographic Audit Trails:</strong> บันทึกประวัติการตัดสินใจด้วยแฮชเข้ารหัส WORM Ledger ตามมาตรฐานสากล</span>
              </li>
            </ul>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {onNavigatePca && (
                <button
                  onClick={onNavigatePca}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                    isLight 
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300' 
                      : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/40'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>อ่านเอกสารสถาปัตยกรรมฉบับเต็ม (PUNN PCA v3.0 Spec)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Section: ช่องทางการติดต่อและติดตามผลงานจริง (Official Verified Channels) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400">
              <Globe className="w-5 h-5 text-rose-400" />
              <h2 className={`text-lg sm:text-xl font-bold font-mono tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                03 · ช่องทางการติดต่อ / Official Follow Channels
              </h2>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Identity</span>
            </span>
          </div>

          <p className={`text-xs sm:text-sm font-medium ${
            isLight ? 'text-slate-600' : 'text-slate-200'
          }`}>
            ติดตามและเชื่อมต่อกับ ปุญญ์ ปรเมษฐ์ (Punn Firekeeper) ผ่านช่องทางดิจิทัลอย่างเป็นทางการ:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {socialChannels.map((ch) => (
              <a
                key={ch.platform}
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-5 rounded-xl border transition-all duration-200 group flex flex-col justify-between hover:scale-[1.01] ${
                  isLight 
                    ? 'bg-white hover:bg-slate-50 border-slate-300 shadow-sm hover:border-amber-500' 
                    : 'bg-[#0E172A] hover:bg-[#131F38] border-slate-700/80 shadow-xl hover:border-amber-400/60'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-base sm:text-lg transition-colors flex items-center gap-1.5 ${
                      isLight 
                        ? 'text-slate-950 group-hover:text-[#FF8A00]' 
                        : 'text-white group-hover:text-[#FFA333]'
                    }`}>
                      {ch.platform}
                      <ExternalLink className={`w-4 h-4 transition-all opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 ${
                        isLight ? 'text-slate-600' : 'text-slate-300'
                      }`} />
                    </span>
                    <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-md font-semibold border ${
                      isLight 
                        ? 'bg-slate-100 border-slate-300 text-slate-700' 
                        : 'bg-white/10 border-white/20 text-slate-200'
                    }`}>
                      {ch.badge}
                    </span>
                  </div>

                  <div className={`text-sm font-mono font-bold ${
                    isLight ? 'text-amber-700' : 'text-amber-400'
                  }`}>
                    {ch.handle}
                  </div>

                  <p className={`text-xs sm:text-[13px] leading-relaxed ${
                    isLight ? 'text-slate-700' : 'text-slate-200'
                  }`}>
                    {ch.description}
                  </p>
                </div>

                <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-mono ${
                  isLight 
                    ? 'border-slate-200 text-slate-600' 
                    : 'border-white/10 text-slate-300'
                }`}>
                  <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>{ch.category}</span>
                  <span className={`font-bold group-hover:underline flex items-center gap-1 ${
                    isLight ? 'text-amber-700' : 'text-amber-400'
                  }`}>
                    Visit Channel →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Closing Footnote Box */}
        <section className={`p-6 rounded-2xl border text-center space-y-3 ${
          isLight ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#0E172A] border-slate-700 text-slate-200'
        }`}>
          <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
            <Flame className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <p className={`text-sm sm:text-base font-semibold ${
            isLight ? 'text-slate-950' : 'text-white'
          }`}>
            “สถาปัตยกรรมทางปัญญานี้สร้างขึ้นเพื่อค้ำจุนการตัดสินใจของผู้นำ ให้มั่นคง ชัดเจน และโปร่งใสในทุกมิติ”
          </p>
          <div className={`text-xs font-mono font-medium ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            © {new Date().getFullYear()} PUNN · Firekeeper Theory · FIRE KEEPER. All rights reserved.
          </div>
        </section>

      </main>
    </div>
  );
};
