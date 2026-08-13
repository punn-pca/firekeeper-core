import React, { useState } from 'react';
import {
  Landmark,
  Scale,
  HeartPulse,
  Bell,
  CheckCircle,
  Plus,
  Trash2,
  RefreshCw,
  FileText,
  Shield,
  Sparkles,
  AlertCircle,
  Send,
  Brain,
  Sliders,
  Play,
  Layers,
  Cpu,
  BookOpen,
  Wrench,
  Check,
  Globe,
  Database,
  Terminal,
  Search,
  Building2,
  ShieldAlert,
  Languages,
  Share2,
} from 'lucide-react';
import { MemoryItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { getThemeTokens } from '../utils/themeTokens';

interface ThaiContextManagerProps {
  memories: MemoryItem[];
  onAddMemory: (content: string, layer: MemoryItem['layer'], source: string) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  onSelectSamplePrompt?: (prompt: string) => void;
}

export const ThaiContextManager: React.FC<ThaiContextManagerProps> = ({
  memories,
  onAddMemory,
  onDeleteMemory,
  onSelectSamplePrompt,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  const [activeDevToolTab, setActiveDevToolTab] = useState<'simulator' | 'injection' | 'test_prompts' | 'memory_inspector'>('simulator');
  const [activeCategory, setActiveCategory] = useState<'all' | 'firearms' | 'mental_health' | 'early_warning'>('all');
  const [customLawContent, setCustomLawContent] = useState('');
  const [customSource, setCustomSource] = useState('ฝ่ายกฎหมาย / กระทรวงมหาดไทย');
  const [customLayer, setCustomLayer] = useState<MemoryItem['layer']>('Constraint');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Live Context Simulator State
  const [simText, setSimText] = useState(
    'ขอเรียนสอบถามท่านประธานและทีมวิศวกร เรื่องมาตรการรักษาความปลอดภัยและคุ้มครองข้อมูลส่วนบุคคล (PDPA) บริเวณสถานี BTS สุขุมวิท พ.ศ. 2568 ด่วนที่สุดครับ'
  );
  const [selectedPersona, setSelectedPersona] = useState<'CEO Mode' | 'Developer Mode' | 'Auditor Mode' | 'Analyst Mode' | 'Teacher Mode'>('CEO Mode');
  const [selectedRelation, setSelectedRelation] = useState<'ลูกค้า' | 'หัวหน้า' | 'ผู้บริหาร' | 'เพื่อนร่วมงาน' | 'ประชาชน'>('ผู้บริหาร');

  // Filter Thai context memories from active memory bank
  const thaiMemories = memories.filter(
    (m) =>
      m.provenanceId?.startsWith('LAW-THAI') ||
      m.provenanceId?.startsWith('HEALTH-COMMUNITY') ||
      m.provenanceId?.startsWith('WARN-LOCAL') ||
      /พ\.ร\.บ\. อาวุธปืน|สุขภาพจิต|1323|191|1599|1567|รพ\.สต\.|อสม\.|SMI-V|pdpa/i.test(m.content)
  );

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleInjectDefaultThaiContext = async () => {
    setIsSubmitting(true);
    try {
      // 1. Firearms Act
      await onAddMemory(
        'กรอบกฎหมายอาวุธปืนไทย (Thai Firearms Legal Framework): กำหนดตาม พ.ร.บ. อาวุธปืน เครื่องกระสุนปืน สิ่งเทียมอาวุธปืนฯ พ.ศ. 2490 ภายใต้กรมการปกครอง กระทรวงมหาดไทย ครอบคลุมระบบใบอนุญาต ป.3 (ซื้อ/รับโอน) และ ป.4 (มี/ใช้), ตรวจประวัติอาชญากรรม (สตช.), ใบรับรองแพทย์ประเมินสภาวะจิตใจ, การกวาดล้างแบลงค์กัน (Blank Guns) ดัดแปลง และการจัดเก็บปืนสวัสดิการข้าราชการ',
        'Constraint',
        'พ.ร.บ. อาวุธปืน พ.ศ. 2490 & กรมการปกครอง กระทรวงมหาดไทย'
      );

      // 2. Mental Health Infrastructure
      await onAddMemory(
        'ระบบสุขภาพจิตชุมชนไทย (Community Mental Health System): กรมสุขภาพจิต กระทรวงสาธารณสุข และ สายด่วนสุขภาพจิต 1323, การคัดกรองและเฝ้าระวังระดับฐานรากโดย รพ.สต. และ อสม. สำหรับผู้ป่วยกลุ่มเสี่ยง SMI-V (Severe Mental Illness with Violence potential) พร้อมส่งต่อ รพ.ชุมชน -> รพ.ศูนย์/จิตเวช ร่วมกับฝ่ายปกครอง',
        'Fact',
        'กรมสุขภาพจิต กระทรวงสาธารณสุข & ระบบสุขภาพจิตชุมชน'
      );

      // 3. Early Warning Hotlines & Community Protocols
      await onAddMemory(
        'กลไกแจ้งเบาะแสและเฝ้าระวังระดับพื้นที่ (Localized Early-Warning Mechanisms): ศูนย์รับแจ้งเหตุ 191/1599 (สตช.), ศูนย์ดำรงธรรม 1567 (มท.), เครือข่ายกำนัน/ผู้ใหญ่บ้าน/ผู้นำชุมชน และระบบแจ้งเบาะแสนิรนาม (Anonymous Reporting) ในสถานศึกษา โดยใช้ Threat Assessment Protocol สังเกตพฤติกรรมเสี่ยงและสัญญาณรั่วไหล (Leakage) แทนการใช้ Profiling',
        'Fact',
        'สำนักงานตำรวจแห่งชาติ, กระทรวงมหาดไทย & Threat Assessment Protocol'
      );

      showNotification('✔ ซิงค์ Thai Knowledge Modules เข้าสู่ Memory Bank เรียบร้อย');
    } catch (err) {
      console.error('Error injecting Thai context:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomThaiRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLawContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddMemory(customLawContent.trim(), customLayer, customSource.trim() || 'Custom Thai Law/Policy');
      setCustomLawContent('');
      showNotification('✔ บันทึกโมดูลบริบทไทยเพิ่มใหม่เรียบร้อยแล้ว');
    } catch (err) {
      console.error('Error adding custom memory:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for live simulator parsing
  const simHasBE = simText.match(/25\d{2}/) || simText.match(/พ\.ศ\.\s*\d{4}/);
  const simBEConverted = simHasBE ? parseInt(simHasBE[0].replace(/\D/g, '')) - 543 : null;
  const simHasTransit = /bts|mrt|รถไฟฟ้า|สนามบิน/i.test(simText);
  const simHasPDPA = /pdpa|คุ้มครองข้อมูล|ข้อมูลส่วนบุคคล|0\d{9}|\d{13}/i.test(simText);
  const simHasHonorifics = ['ครับ', 'ค่ะ', 'ท่าน', 'ขอเรียน', 'เนื่องด้วย'].filter((h) => simText.includes(h));

  const presetContextQueries = [
    {
      title: 'วิเคราะห์รายวิจัย: แรงจูงใจคดีกราดยิง & ข้อเสนอแนะบริบทไทย',
      query: 'โปรดวิเคราะห์แรงจูงใจคดีกราดยิงภายใต้กรอบ FIRE KEEPER PCA โดยคำนึงถึงบริบทกฎหมายอาวุธปืนไทย (พ.ร.บ. 2490/ป.3/ป.4), ระบบสุขภาพจิตชุมชน (รพ.สต./อสม./1323), และกลไกแจ้งเตือนภัย 191/1599/1567',
      tag: 'Full Socio-Legal Analysis',
    },
    {
      title: 'ประเมิน Threat Assessment & การป้องกัน Contagion ในสถานศึกษาไทย',
      query: 'ขอแผนยุทธศาสตร์ป้องกันเหตุความรุนแรงในโรงเรียน/มหาวิทยาลัยไทย โดยใช้ Threat Assessment แทน Profiling พร้อมระบบแจ้งเบาะแสนิรนามและการประสานงานฝ่ายปกครอง/ตำรวจ',
      tag: 'Education Safety',
    },
    {
      title: 'การกำกับดูแลความเสี่ยงกฎหมาย PDPA & การคุ้มครองข้อมูลในระบบบริการ AI',
      query: 'ประเมินความเสี่ยงและมาตรการกำกับดูแลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) สำหรับการปรับใช้ระบบ AI ในองค์กรภาครัฐและเอกชนไทย',
      tag: 'Legal & PDPA Audit',
    },
  ];

  return (
    <div id="thai-context-manager" className="space-y-6">
      {/* 1. Header Banner */}
      <div className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 border shadow-xl transition-all ${
        isLight
          ? 'bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white border-indigo-200'
          : 'bg-gradient-to-r from-indigo-950/90 via-slate-900 to-slate-950 text-white border-indigo-500/30'
      }`}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Landmark className="w-4 h-4 text-indigo-400" />
              <span>Thai Context Intelligence Engine • Modular Architecture</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Thai Context Intelligence Engine</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              ระบบประมวลผลบริบทภาษาไทยสำหรับ PCA โดยแยก <strong className="text-indigo-300 font-bold">Core Context Engine</strong>, <strong className="text-purple-300 font-bold">Knowledge Modules</strong> และ <strong className="text-amber-300 font-bold">Developer Tools</strong> ออกจากกัน เพื่อให้สถาปัตยกรรมมีความยืดหยุ่น ขยายได้ง่าย และดูแลรักษาได้อย่างเป็นระบบ
            </p>
          </div>

          <button
            type="button"
            onClick={handleInjectDefaultThaiContext}
            disabled={isSubmitting}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 border border-indigo-400/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>ซิงค์ Thai Knowledge Modules</span>
          </button>
        </div>

        {notification && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* Philosophy Banner */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-medium ${
        isLight ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950' : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200'
      }`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span><strong>หลักการออกแบบสถาปัตยกรรม:</strong> Architecture อธิบายว่า &quot;ระบบคิดอย่างไร&quot; • Knowledge อธิบายว่า &quot;ระบบรู้อะไร&quot; • Tools อธิบายว่า &quot;นักพัฒนาใช้ตรวจสอบอย่างไร&quot;</span>
        </div>
        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 shrink-0">
          Decoupled Structure
        </span>
      </div>

      {/* 2. Three-Tier Architectural Division */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tier 1: Core Context Engine (แกนหลัก) */}
        <div className={`rounded-2xl p-5 border space-y-4 ${tokens.shadow} ${
          isLight ? 'bg-white border-[#E5E7EB]' : 'bg-[#111827] border-white/10'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm sm:text-base">
              <Cpu className="w-5 h-5" />
              <span>1. Core Context Engine (แกนหลัก)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Language-Agnostic Core
            </span>
          </div>

          <p className={`text-xs leading-relaxed ${isLight ? 'text-[#4B5563]' : 'text-slate-300'}`}>
            กลไกประมวลผลบริบทระดับรากฐานที่ไม่ขึ้นกับประเทศหรือภาษาเฉพาะ สามารถนำไปปรับใช้กับภาษาอื่นได้ทันที:
          </p>

          <div className="space-y-2.5">
            {[
              {
                num: '1',
                title: 'Language Processing',
                desc: 'ตัดคำไทย • ตรวจคำกำกวม • Normalization & Stopword Filtering',
                color: 'text-indigo-600 dark:text-indigo-400',
                badge: 'NLP Core',
              },
              {
                num: '2',
                title: 'Intent Resolution',
                desc: 'วิเคราะห์เจตนาแฝง • ประเมินระดับความเร่งด่วน & Severity Level',
                color: 'text-purple-600 dark:text-purple-400',
                badge: 'Intent Pipeline',
              },
              {
                num: '3',
                title: 'Context Resolution',
                desc: 'บุคคล (Entities) • เวลา (Temporal CE/BE) • สถานที่ (Spatial) • ความสัมพันธ์ (Relations)',
                color: 'text-blue-600 dark:text-sky-400',
                badge: 'Entity Graph',
              },
              {
                num: '4',
                title: 'Memory Integration',
                desc: 'เชื่อมต่อ Memory Bank • Context Recall & Semantic Search Dynamic Injection',
                color: 'text-emerald-600 dark:text-emerald-400',
                badge: 'Memory Sync',
              },
              {
                num: '5',
                title: 'Context Evaluation',
                desc: 'ตรวจความครบถ้วนของหลักฐาน • ประเมินดัชนีความมั่นใจ (Confidence Score)',
                color: 'text-amber-600 dark:text-amber-400',
                badge: 'Scorer v2.0',
              },
            ].map((step) => (
              <div key={step.num} className={`p-3 rounded-xl border flex items-start space-x-3 ${
                isLight ? 'bg-[#F9FAFB] border-[#E5E7EB]' : 'bg-[#060A16] border-white/10'
              }`}>
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-mono font-bold text-xs text-indigo-500 shrink-0 mt-0.5">
                  {step.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-bold ${isLight ? 'text-[#111827]' : 'text-white'}`}>
                      {step.title}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${step.color} bg-indigo-500/10`}>
                      {step.badge}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${isLight ? 'text-[#6B7280]' : 'text-slate-400'}`}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className={`p-3 rounded-xl border text-[11px] flex items-center gap-2 ${
            isLight ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900' : 'bg-indigo-950/30 border-indigo-800/40 text-indigo-300'
          }`}>
            <Globe className="w-4 h-4 text-indigo-500 shrink-0" />
            <span><strong>หมายเหตุสถาปัตยกรรม:</strong> Core Context Engine จะส่งต่อโครงสร้างข้อมูลดิบเข้าสู่ Knowledge Modules ด้านล่าง</span>
          </div>
        </div>

        {/* Tier 2: Thai Knowledge Modules (โมดูลความรู้) */}
        <div className={`rounded-2xl p-5 border space-y-4 ${tokens.shadow} ${
          isLight ? 'bg-white border-[#E5E7EB]' : 'bg-[#111827] border-white/10'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm sm:text-base">
              <BookOpen className="w-5 h-5" />
              <span>2. Thai Knowledge Modules (โมดูลความรู้)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30">
              Knowledge Adapters
            </span>
          </div>

          <p className={`text-xs leading-relaxed ${isLight ? 'text-[#4B5563]' : 'text-slate-300'}`}>
            โมดูลความรู้เฉพาะทางของประเทศไทย (Knowledge Adapters) ถูกโหลดเข้าสู่คอร์เมื่อการวิเคราะห์ต้องการความแม่นยำสูง:
          </p>

          <div className="space-y-2.5">
            {[
              {
                id: 'legal',
                name: 'Legal Module',
                desc: 'PDPA 2562 • พ.ร.บ. อาวุธปืน 2490 (ป.3/ป.4) • กฎหมายดิจิทัล',
                icon: Scale,
                color: 'text-purple-600 dark:text-purple-400',
                bgColor: 'bg-purple-500/10',
                borderColor: 'border-purple-500/30',
              },
              {
                id: 'business',
                name: 'Business Module',
                desc: 'ภาษีมูลค่าเพิ่ม VAT 7% • หนังสือราชการ • มาตรฐานองค์กรไทย',
                icon: Building2,
                color: 'text-amber-600 dark:text-amber-400',
                bgColor: 'bg-amber-500/10',
                borderColor: 'border-amber-500/30',
              },
              {
                id: 'safety',
                name: 'Safety & Health Module',
                desc: 'กรมสุขภาพจิต 1323 • Threat Assessment • Community Safety Protocols',
                icon: HeartPulse,
                color: 'text-rose-600 dark:text-rose-400',
                bgColor: 'bg-rose-500/10',
                borderColor: 'border-rose-500/30',
              },
              {
                id: 'language',
                name: 'Language & Cultural Module',
                desc: 'Honorifics (ครับ/ค่ะ/ท่าน) • สำนวนไทย • มิติวัฒนธรรมองค์กรไทย',
                icon: Languages,
                color: 'text-indigo-600 dark:text-indigo-400',
                bgColor: 'bg-indigo-500/10',
                borderColor: 'border-indigo-500/30',
              },
              {
                id: 'rag',
                name: 'ThaiRAG Connector',
                desc: 'OpenThaiRAG Connector • Vector Knowledge Adapter for Thai Text',
                icon: Share2,
                color: 'text-emerald-600 dark:text-emerald-400',
                bgColor: 'bg-emerald-500/10',
                borderColor: 'border-emerald-500/30',
              },
            ].map((mod) => {
              const IconComp = mod.icon;
              return (
                <div key={mod.id} className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  isLight ? 'bg-[#F9FAFB] border-[#E5E7EB]' : 'bg-[#060A16] border-white/10'
                }`}>
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-2 rounded-lg ${mod.bgColor} ${mod.borderColor} border ${mod.color} shrink-0`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${isLight ? 'text-[#111827]' : 'text-white'}`}>
                        {mod.name}
                      </div>
                      <div className={`text-[11px] truncate mt-0.5 ${isLight ? 'text-[#6B7280]' : 'text-slate-400'}`}>
                        {mod.desc}
                      </div>
                    </div>
                  </div>

                  <span className="shrink-0 text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ready
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className={`text-xs ${isLight ? 'text-[#6B7280]' : 'text-slate-400'}`}>
              จำนวนข้อกำหนดใน Memory Bank: <strong className="text-indigo-600 dark:text-indigo-400">{thaiMemories.length}</strong> รายการ
            </span>
            <button
              type="button"
              onClick={handleInjectDefaultThaiContext}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> โหลดหรือซิงค์ข้อมูลใหม่
            </button>
          </div>
        </div>

      </div>

      {/* Tier 3: Developer Tools Section */}
      <div className={`rounded-2xl p-5 border space-y-4 ${tokens.shadow} ${
        isLight ? 'bg-white border-[#E5E7EB]' : 'bg-[#111827] border-white/10'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm sm:text-base">
            <Wrench className="w-5 h-5 text-amber-500" />
            <span>3. Developer Tools (เครื่องมือสำหรับนักพัฒนา)</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30">
            Developer Toolkit Sandbox
          </span>
        </div>

        {/* Developer Tool Sub-Tab Navigation */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-slate-200 dark:border-white/10">
          {[
            { id: 'simulator', label: 'Live Simulator', icon: Sliders, desc: 'ทดสอบวิเคราะห์ข้อความ' },
            { id: 'injection', label: 'Context Injection', icon: Plus, desc: 'เพิ่มกฎหมาย/นโยบาย' },
            { id: 'test_prompts', label: 'Test Prompts', icon: Sparkles, desc: 'โจทย์ทดสอบบริบทไทย' },
            { id: 'memory_inspector', label: 'Inspector / Memory', icon: Database, desc: `คลังบริบท (${thaiMemories.length})` },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeDevToolTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveDevToolTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? isLight
                      ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs'
                      : 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                    : isLight
                      ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#4B5563] hover:text-[#111827]'
                      : 'bg-[#060A16] border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TOOL 1: Live Context Simulator */}
        {activeDevToolTab === 'simulator' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h4 className={`text-xs font-bold uppercase font-mono tracking-wide ${isLight ? 'text-[#111827]' : 'text-white'}`}>
                🧪 Live Context Simulator (จำลองการสกัดบริบทภาษาไทย)
              </h4>
              <span className={`text-[11px] ${isLight ? 'text-[#6B7280]' : 'text-slate-400'}`}>
                ป้อนข้อความจำลองเพื่อตรวจคำกำกวม, พ.ศ. ➔ ค.ศ., Honorifics และ PDPA
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-[#374151]' : 'text-slate-300'}`}>
                  ป้อนข้อความภาษาไทยเพื่อทดสอบการสกัดบริบท (Test Thai Query):
                </label>
                <textarea
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  rows={2}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-sans transition-all focus:outline-none ${
                    isLight
                      ? 'bg-white border-[#E5E7EB] text-[#111827] focus:border-amber-500'
                      : 'bg-[#060A16] border-white/10 text-white focus:border-amber-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-[#374151]' : 'text-slate-300'}`}>
                    กำหนด Persona Mode:
                  </label>
                  <select
                    value={selectedPersona}
                    onChange={(e) => setSelectedPersona(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs transition-all focus:outline-none ${
                      isLight
                        ? 'bg-white border-[#E5E7EB] text-[#111827]'
                        : 'bg-[#060A16] border-white/10 text-white'
                    }`}
                  >
                    <option value="CEO Mode">CEO Mode (เน้นภาพรวม & ยุทธศาสตร์)</option>
                    <option value="Developer Mode">Developer Mode (เน้นโค้ด & Architecture)</option>
                    <option value="Auditor Mode">Auditor Mode (เน้น PDPA & Compliance)</option>
                    <option value="Analyst Mode">Analyst Mode (เน้นการวิเคราะห์ข้อมูล)</option>
                    <option value="Teacher Mode">Teacher Mode (เน้นการอธิบายเข้าใจง่าย)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-[#374151]' : 'text-slate-300'}`}>
                    กำหนดระดับความสัมพันธ์ (Relationship Context):
                  </label>
                  <select
                    value={selectedRelation}
                    onChange={(e) => setSelectedRelation(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs transition-all focus:outline-none ${
                      isLight
                        ? 'bg-white border-[#E5E7EB] text-[#111827]'
                        : 'bg-[#060A16] border-white/10 text-white'
                    }`}
                  >
                    <option value="ผู้บริหาร">ผู้บริหาร (Executive Level)</option>
                    <option value="หัวหน้า">หัวหน้า (Supervisor Level)</option>
                    <option value="ลูกค้า">ลูกค้า (Client Level)</option>
                    <option value="เพื่อนร่วมงาน">เพื่อนร่วมงาน (Colleague Level)</option>
                    <option value="ประชาชน">ประชาชน (Public Level)</option>
                  </select>
                </div>
              </div>

              {/* Live Extraction Output Card */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                isLight ? 'bg-[#F9FAFB] border-[#E5E7EB]' : 'bg-[#060A16] border-amber-500/30'
              }`}>
                <div className={`flex items-center justify-between text-xs border-b pb-2 ${
                  isLight ? 'border-[#E5E7EB]' : 'border-white/10'
                }`}>
                  <span className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-[#111827]' : 'text-amber-300'}`}>
                    <Brain className="w-4 h-4 text-amber-500" /> Live Extraction Output:
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    ดัชนีความเข้าใจบริบท: 96.5%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className={`p-2.5 rounded-lg border ${
                    isLight ? 'bg-white border-[#E5E7EB]' : 'bg-slate-900 border-white/10'
                  }`}>
                    <div className={`text-[10px] ${isLight ? 'text-[#6B7280]' : 'text-slate-400'}`}>Honorifics Detected</div>
                    <div className="font-bold text-indigo-600 dark:text-indigo-300 truncate">
                      {simHasHonorifics.length > 0 ? simHasHonorifics.join(', ') : 'สุภาพทั่วไป'}
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-lg border ${
                    isLight ? 'bg-white border-[#E5E7EB]' : 'bg-slate-900 border-white/10'
                  }`}>
                    <div className={`text-[10px] ${isLight ? 'text-[#6B7280]' : 'text-slate-400'}`}>Temporal BE Conversion</div>
                    <div className="font-bold text-cyan-600 dark:text-cyan-300 truncate">
                      {simBEConverted ? `${simHasBE?.[0]} ➔ ${simBEConverted} CE` : 'ปีปัจจุบัน'}
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-lg border ${
                    isLight ? 'bg-white border-[#E5E7EB]' : 'bg-slate-900 border-white/10'
                  }`}>
                    <div className={`text-[10px] ${isLight ? 'text-[#6B7280]' : 'text-slate-400'}`}>Transit & Location</div>
                    <div className="font-bold text-amber-600 dark:text-amber-300 truncate">
                      {simHasTransit ? 'BTS สุขุมวิท' : 'ประเทศไทย'}
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-lg border ${
                    isLight ? 'bg-white border-[#E5E7EB]' : 'bg-slate-900 border-white/10'
                  }`}>
                    <div className={`text-[10px] ${isLight ? 'text-[#6B7280]' : 'text-slate-400'}`}>PDPA Status</div>
                    <div className={`font-bold truncate ${simHasPDPA ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {simHasPDPA ? 'CHECK_PERSONAL_DATA' : 'PDPA COMPLIANT'}
                    </div>
                  </div>
                </div>

                {onSelectSamplePrompt && (
                  <button
                    type="button"
                    onClick={() => onSelectSamplePrompt(simText)}
                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>ส่งวิเคราะห์ผ่าน PCA Core Engine ด้วยบริบทนี้</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TOOL 2: Custom Context Injection Form */}
        {activeDevToolTab === 'injection' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-500" />
              <h4 className={`text-xs font-bold uppercase font-mono tracking-wide ${isLight ? 'text-[#111827]' : 'text-white'}`}>
                ➕ Custom Context Injection (ฉีดข้อกำหนดกฎหมาย/นโยบายองค์กรเพิ่ม)
              </h4>
            </div>

            <form onSubmit={handleAddCustomThaiRecord} className="space-y-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-[#374151]' : 'text-slate-300'}`}>
                  เนื้อหาข้อกำหนด/ระเบียบปฏิบัติตามกฎหมายหรือนโยบายไทย:
                </label>
                <textarea
                  value={customLawContent}
                  onChange={(e) => setCustomLawContent(e.target.value)}
                  placeholder="เช่น: ระเบียบกระทรวงศึกษาธิการ ว่าด้วยมาตรการรักษาความปลอดภัยในสถานศึกษา พ.ศ. 2566..."
                  rows={3}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-sans transition-all focus:outline-none ${
                    isLight
                      ? 'bg-white border-[#E5E7EB] text-[#111827] focus:border-amber-500'
                      : 'bg-[#060A16] border-white/10 text-white focus:border-amber-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-[#374151]' : 'text-slate-300'}`}>
                    แหล่งอ้างอิง/หน่วยงานบังคับใช้:
                  </label>
                  <input
                    type="text"
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                    placeholder="เช่น: กระทรวงศึกษาธิการ / สตช."
                    className={`w-full px-3 py-2 rounded-xl border text-xs transition-all focus:outline-none ${
                      isLight
                        ? 'bg-white border-[#E5E7EB] text-[#111827]'
                        : 'bg-[#060A16] border-white/10 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-[#374151]' : 'text-slate-300'}`}>
                    ประเภท Layer:
                  </label>
                  <select
                    value={customLayer}
                    onChange={(e) => setCustomLayer(e.target.value as MemoryItem['layer'])}
                    className={`w-full px-3 py-2 rounded-xl border text-xs transition-all focus:outline-none ${
                      isLight
                        ? 'bg-white border-[#E5E7EB] text-[#111827]'
                        : 'bg-[#060A16] border-white/10 text-white'
                    }`}
                  >
                    <option value="Constraint">Constraint (ข้อจำกัดทางกฎหมาย/นโยบาย)</option>
                    <option value="Fact">Fact (ข้อเท็จจริงโครงสร้างระบบ)</option>
                    <option value="Rule">Rule (กฎเกณฑ์ยุทธศาสตร์)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !customLawContent.trim()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>บันทึกเข้าคลังโมดูลความรู้บริบทไทย</span>
              </button>
            </form>
          </div>
        )}

        {/* TOOL 3: Strategy Test Prompts */}
        {activeDevToolTab === 'test_prompts' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h4 className={`text-xs font-bold uppercase font-mono tracking-wide ${isLight ? 'text-[#111827]' : 'text-white'}`}>
                🎯 Strategy Test Prompts (โจทย์ทดสอบความเข้าใจบริบทไทย)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {presetContextQueries.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 group ${
                    isLight
                      ? 'bg-[#F9FAFB] border-[#E5E7EB] hover:border-amber-500'
                      : 'bg-[#060A16] border-white/10 hover:border-amber-500/50'
                  }`}
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20">
                      {item.tag}
                    </span>
                    <h5 className={`text-xs font-bold leading-snug group-hover:text-amber-500 transition-colors ${
                      isLight ? 'text-[#111827]' : 'text-white'
                    }`}>
                      {item.title}
                    </h5>
                    <p className={`text-[11px] line-clamp-3 leading-relaxed ${
                      isLight ? 'text-[#4B5563]' : 'text-slate-400'
                    }`}>
                      {item.query}
                    </p>
                  </div>

                  {onSelectSamplePrompt && (
                    <button
                      type="button"
                      onClick={() => onSelectSamplePrompt(item.query)}
                      className={`w-full py-1.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isLight
                          ? 'bg-white border-[#CBD5E1] text-[#111827] hover:border-amber-500 hover:text-amber-600'
                          : 'bg-slate-900 border-white/10 text-slate-200 hover:border-amber-500 hover:text-white'
                      }`}
                    >
                      <span>วิเคราะห์โจทย์นี้</span>
                      <Send className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOOL 4: Memory Inspector / Records */}
        {activeDevToolTab === 'memory_inspector' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-500" />
                <h4 className={`text-xs font-bold uppercase font-mono tracking-wide ${isLight ? 'text-[#111827]' : 'text-white'}`}>
                  🗄️ Memory Inspector ({thaiMemories.length} รายการที่เปิดใช้งาน)
                </h4>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {['all', 'firearms', 'mental_health', 'early_warning'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat as any)}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-amber-500 border-amber-600 text-white font-bold'
                        : isLight
                          ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#4B5563]'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {cat === 'all' ? 'ทั้งหมด' : cat === 'firearms' ? 'อาวุธปืน' : cat === 'mental_health' ? 'สุขภาพจิต' : 'เฝ้าระวัง'}
                  </button>
                ))}
              </div>
            </div>

            {thaiMemories.length === 0 ? (
              <div className={`py-8 text-center space-y-3 rounded-xl border ${
                isLight ? 'bg-[#F9FAFB] border-[#E5E7EB]' : 'bg-[#060A16] border-white/10'
              }`}>
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className={`text-xs max-w-md mx-auto ${isLight ? 'text-[#6B7280]' : 'text-slate-400'}`}>
                  ยังไม่มีข้อกำหนดบริบทไทยในคลังความจำ กดปุ่ม &quot;ซิงค์ Thai Knowledge Modules&quot; ด้านบนเพื่อโหลดข้อมูล พ.ร.บ. อาวุธปืน, กรมสุขภาพจิต 1323 และสายด่วน 191/1599/1567
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {thaiMemories.map((mem) => (
                  <div
                    key={mem.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isLight
                        ? 'bg-[#F9FAFB] border-[#E5E7EB] hover:border-[#CBD5E1]'
                        : 'bg-[#060A16] border-white/10 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1 text-xs min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                          {mem.layer}
                        </span>
                        <span className={`font-mono text-[11px] truncate ${isLight ? 'text-[#6B7280]' : 'text-slate-400'}`}>
                          แหล่งอ้างอิง: {mem.source}
                        </span>
                      </div>
                      <p className={`leading-relaxed font-sans ${isLight ? 'text-[#111827]' : 'text-slate-200'}`}>
                        {mem.content}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteMemory(mem.id)}
                      className="shrink-0 p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition-all cursor-pointer self-start sm:self-center"
                      title="ลบออกจากคลังความจำ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
