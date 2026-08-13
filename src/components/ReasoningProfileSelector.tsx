import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Search, TrendingUp, Stethoscope, Scale, Cpu, ChevronDown, Check, Info, Shield, Layers } from 'lucide-react';
import { ReasoningProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { getThemeTokens } from '../utils/themeTokens';

export interface ProfileOption {
  id: ReasoningProfile;
  nameTh: string;
  nameEn: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  borderColor: string;
  textColor: string;
  description: string;
  stagesHighlight: string[];
}

export const REASONING_PROFILES: ProfileOption[] = [
  {
    id: 'Auto',
    nameTh: 'อัตโนมัติ / Executive',
    nameEn: 'Auto-Detect / Executive',
    icon: Sparkles,
    color: 'amber',
    badgeBg: 'bg-amber-500/10 hover:bg-amber-500/20',
    borderColor: 'border-amber-500/40',
    textColor: 'text-[#F59E0B]',
    description: 'ระบบตรวจจับโดเมนอัตโนมัติ สรุปเนื้อหาตรงประเด็น เหมาะสำหรับผู้บริหารและการใช้งานทั่วไป',
    stagesHighlight: ['Executive Summary', 'Intent Detection', 'Direct Evidence', 'Actionable Takeaways'],
  },
  {
    id: 'Investigation',
    nameTh: 'การสืบสวน & พฤติกรรม',
    nameEn: 'Investigation & Behavioral',
    icon: Search,
    color: 'rose',
    badgeBg: 'bg-rose-500/10 hover:bg-rose-500/20',
    borderColor: 'border-rose-500/40',
    textColor: 'text-rose-600 dark:text-rose-400',
    description: 'เน้นลำดับเวลา (Timeline), เอนทิตีบุคคล, พยานหลักฐาน (Chain of Evidence) และเปรียบเทียบสมมติฐานแข่งขัน (ACH)',
    stagesHighlight: ['Timeline Reconstruction', 'Witness Analysis', 'Competing Hypotheses (ACH)', 'Missing Evidence Matrix'],
  },
  {
    id: 'Business',
    nameTh: 'กลยุทธ์ธุรกิจ & การเงิน',
    nameEn: 'Business & Financial Strategy',
    icon: TrendingUp,
    color: 'emerald',
    badgeBg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    description: 'เน้นตัววัดผล KPIs, สภาพตลาด, ผลกระทบทางการเงิน/OpEx, ฉากทัศน์ทางเลือก (Scenarios) และ Trade-offs',
    stagesHighlight: ['KPI & Financial Metrics', 'Scenario Planning', 'Strategic Options Matrix', 'Risk/OpEx Trade-offs'],
  },
  {
    id: 'Medical',
    nameTh: 'การแพทย์ & จิตวิทยา',
    nameEn: 'Medical & Health Science',
    icon: Stethoscope,
    color: 'cyan',
    badgeBg: 'bg-cyan-500/10 hover:bg-cyan-500/20',
    borderColor: 'border-cyan-500/40',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    description: 'เน้นอาการ (Symptoms), การวินิจฉัยแยกโรค (Differential Diagnosis), สัญญาณอันตราย (Red Flags) และภาษาไทยเข้าใจง่าย',
    stagesHighlight: ['Symptom Mapping', 'Differential Diagnosis', 'Red Flag Alerts', 'Human-Friendly Explanations'],
  },
  {
    id: 'Legal',
    nameTh: 'กฎหมาย & ธรรมาภิบาล',
    nameEn: 'Legal & Regulatory Governance',
    icon: Scale,
    color: 'purple',
    badgeBg: 'bg-purple-500/10 hover:bg-purple-500/20',
    borderColor: 'border-purple-500/40',
    textColor: 'text-purple-600 dark:text-purple-400',
    description: 'เน้นข้อเท็จจริงทางกฎหมาย, กรอบข้อบังคับ (ISO 42001, NIST, PDPA), ประเด็นพิพาท, ภาระการพิสูจน์ และ Audit Trail',
    stagesHighlight: ['Legal Facts Mapping', 'Regulatory Compliance', 'Burden of Proof', 'Tamper-Proof Audit Trail'],
  },
  {
    id: 'Engineering',
    nameTh: 'วิศวกรรม & ความปลอดภัย',
    nameEn: 'Engineering & System Safety',
    icon: Cpu,
    color: 'indigo',
    badgeBg: 'bg-indigo-500/10 hover:bg-indigo-500/20',
    borderColor: 'border-indigo-500/40',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    description: 'เน้น Root Cause Analysis (RCA), FMEA, สถาปัตยกรรมระบบ, การประเมินความเสี่ยงด้านไซเบอร์และการแก้ไข',
    stagesHighlight: ['Root Cause Analysis (RCA)', 'FMEA Matrix', 'Architecture Vulnerability', 'Actionable Remediation'],
  },
];

interface ReasoningProfileSelectorProps {
  selectedProfile: ReasoningProfile;
  onChange: (profile: ReasoningProfile) => void;
  compact?: boolean;
}

export const ReasoningProfileSelector: React.FC<ReasoningProfileSelectorProps> = ({
  selectedProfile,
  onChange,
  compact = false,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  const [isOpen, setIsOpen] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption = REASONING_PROFILES.find((p) => p.id === selectedProfile) || REASONING_PROFILES[0];
  const Icon = activeOption.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${isOpen ? 'z-50' : 'z-10'}`} ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title="สลับโหมดปฏิบัติการประมวลผล (Domain Reasoning Profile)"
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition-all text-xs font-semibold cursor-pointer ${activeOption.badgeBg} ${activeOption.borderColor} ${activeOption.textColor} shadow-2xs`}
        >
          <Icon className="w-3.5 h-3.5 shrink-0 animate-pulse" />
          <span className="truncate max-w-[130px] sm:max-w-none">
            {compact ? activeOption.nameTh.split(' ')[0] : activeOption.nameTh}
          </span>
          <span className={`text-[10px] font-mono px-1 py-0.2 rounded hidden md:inline ${
            isLight ? 'bg-[#F3F4F6] text-[#6B7280]' : 'bg-slate-900/60 text-slate-300'
          }`}>
            PROFILE
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Info Toggle Button */}
        <button
          type="button"
          onClick={() => setShowInfoModal(!showInfoModal)}
          title="คำอธิบายสถาปัตยกรรม Reasoning Profiles"
          className={`p-1 rounded-lg transition-colors cursor-pointer ${
            isLight ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]' : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute left-0 top-full mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-2rem)] rounded-xl border shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-fadeIn ${
          isLight ? 'bg-white border-[#E5E7EB] text-[#111827]' : 'bg-slate-900 border-slate-700/90 text-white'
        }`}>
          <div className={`p-2.5 border-b flex items-center justify-between ${
            isLight ? 'bg-[#F9FAFB] border-[#E5E7EB]' : 'bg-slate-950/90 border-slate-800'
          }`}>
            <div className={`flex items-center space-x-1.5 text-xs font-bold ${
              isLight ? 'text-[#111827]' : 'text-slate-200'
            }`}>
              <Layers className="w-4 h-4 text-[#F59E0B]" />
              <span>เลือกโหมดประมวลผล (Reasoning Profile)</span>
            </div>
            <span className="text-[10px] font-mono text-[#F59E0B] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
              PCA v2.0 CPU
            </span>
          </div>

          <div className="p-1.5 space-y-1 max-h-80 overflow-y-auto no-scrollbar">
            {REASONING_PROFILES.map((option) => {
              const OptionIcon = option.icon;
              const isSelected = option.id === selectedProfile;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg transition-all flex items-start space-x-2.5 cursor-pointer ${
                    isSelected
                      ? isLight
                        ? 'bg-amber-50 border border-[#F59E0B] shadow-2xs'
                        : 'bg-slate-800/90 border border-amber-500/40 shadow-2xs'
                      : isLight
                        ? 'hover:bg-[#F9FAFB] border border-transparent'
                        : 'hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className={`p-1.5 rounded-md shrink-0 mt-0.5 ${option.badgeBg} ${option.textColor}`}>
                    <OptionIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${
                        isSelected ? option.textColor : isLight ? 'text-[#111827]' : 'text-slate-200'
                      }`}>
                        {option.nameTh}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#F59E0B] shrink-0 ml-1" />}
                    </div>
                    <p className={`text-[11px] line-clamp-2 mt-0.5 leading-snug ${
                      isLight ? 'text-[#6B7280]' : 'text-slate-400'
                    }`}>
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className={`p-2 border-t text-[10px] flex items-center justify-between ${
            isLight ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280]' : 'bg-slate-950/80 border-slate-800 text-slate-400'
          }`}>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              ไดนามิกโปรไฟล์ปรับแต่งการสกัดหลักฐาน & กรอบวิเคราะห์
            </span>
          </div>
        </div>
      )}

      {/* Info Modal / Explanatory Card */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
          <div className={`border rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-white border-[#E5E7EB] text-[#111827]' : 'bg-slate-900 border-slate-700 text-white'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isLight ? 'border-[#E5E7EB]' : 'border-slate-800'
            }`}>
              <div className={`flex items-center space-x-2 font-bold text-base ${
                isLight ? 'text-[#111827]' : 'text-slate-100'
              }`}>
                <Layers className="w-5 h-5 text-[#F59E0B]" />
                <span>สถาปัตยกรรม Decoupled Reasoning Engine & Profiles</span>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className={`text-sm font-semibold px-2 py-1 rounded-lg ${
                  isLight ? 'bg-[#F3F4F6] text-[#111827]' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                ปิด
              </button>
            </div>

            <p className={`text-xs leading-relaxed ${isLight ? 'text-[#374151]' : 'text-slate-300'}`}>
              ใน PUNN Cognitive Architecture v2.0 ตัวสถาปัตยกรรมแบ่งออกเป็น 3 ชั้นอิสระ:
            </p>

            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className={`p-3 rounded-xl border space-y-1 ${
                isLight ? 'bg-[#F9FAFB] border-[#E5E7EB]' : 'bg-slate-950 border-slate-800'
              }`}>
                <span className="text-[#F59E0B] font-bold font-mono">1. PCA Core Engine (Invariant CPU)</span>
                <p className={isLight ? 'text-[#6B7280]' : 'text-slate-400'}>
                  ทำหน้าที่เป็นแกนกลางการประมวลผล 12 ขั้นตอน (Observation → Hypothesis → Evidence → Bayesian Matrix → Human Agency)
                </p>
              </div>

              <div className={`p-3 rounded-xl border space-y-1 ${
                isLight ? 'bg-[#F9FAFB] border-[#E5E7EB]' : 'bg-slate-950 border-slate-800'
              }`}>
                <span className="text-blue-600 dark:text-sky-400 font-bold font-mono">2. Domain Reasoning Profiles (Operating Modes)</span>
                <p className={isLight ? 'text-[#6B7280]' : 'text-slate-400'}>
                  ปรับจูนยุทธวิธีการสกัดหลักฐาน (Evidence Weighting), กรอบความคิดเฉพาะทาง (Investigation, Business, Medical, Legal, Engineering)
                </p>
              </div>

              <div className={`p-3 rounded-xl border space-y-1 ${
                isLight ? 'bg-[#F9FAFB] border-[#E5E7EB]' : 'bg-slate-950 border-slate-800'
              }`}>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">3. Presentation Layer (Report UI)</span>
                <p className={isLight ? 'text-[#6B7280]' : 'text-slate-400'}>
                  สร้างรูปแบบการแสดงผลและส่งออกรายงานเฉพาะโหมดโดยไม่ยัดเยียดหัวข้อที่ไม่จำเป็น
                </p>
              </div>
            </div>

            <div className={`space-y-2 pt-2 border-t ${isLight ? 'border-[#E5E7EB]' : 'border-slate-800'}`}>
              <span className={`text-xs font-bold ${isLight ? 'text-[#111827]' : 'text-slate-200'}`}>
                รายละเอียด Reasoning Profiles ทั้ง 6 โหมด:
              </span>
              <div className="space-y-2">
                {REASONING_PROFILES.map((p) => {
                  const IconComp = p.icon;
                  return (
                    <div key={p.id} className={`p-2.5 rounded-lg border flex items-start space-x-2 ${
                      isLight ? 'bg-[#F9FAFB] border-[#E5E7EB]' : 'bg-slate-950/60 border-slate-800/80'
                    }`}>
                      <div className={`p-1.5 rounded ${p.badgeBg} ${p.textColor} shrink-0 mt-0.5`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="text-xs space-y-1">
                        <div className={`font-bold flex items-center gap-2 ${isLight ? 'text-[#111827]' : 'text-slate-200'}`}>
                          <span>{p.nameTh}</span>
                          <span className={`text-[10px] font-mono ${isLight ? 'text-[#6B7280]' : 'text-slate-400'}`}>[{p.id}_PROFILE]</span>
                        </div>
                        <p className={isLight ? 'text-[#374151]' : 'text-slate-300'}>{p.description}</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {p.stagesHighlight.map((h, i) => (
                            <span key={i} className={`text-[10px] font-mono px-1.5 py-0.5 border rounded ${
                              isLight ? 'bg-white border-[#E5E7EB] text-[#6B7280]' : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}>
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-[#F59E0B] hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                รับทราบและกลับสู่การสนทนา
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
