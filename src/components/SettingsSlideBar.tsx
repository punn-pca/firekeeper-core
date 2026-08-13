import React from 'react';
import { X, Sliders, Brain, Compass, Sparkles, DollarSign, Award, Zap, CheckCircle2, UserCheck, Shield, Crown } from 'lucide-react';
import { ToneMode, ReasoningProfile } from '../types';
import { ReasoningProfileSelector } from './ReasoningProfileSelector';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getThemeTokens } from '../utils/themeTokens';

interface SettingsSlideBarProps {
  isOpen: boolean;
  onClose: () => void;
  reasoningProfile: ReasoningProfile;
  setReasoningProfile: (profile: ReasoningProfile) => void;
  tone: ToneMode;
  setTone: (tone: ToneMode) => void;
  deepReasoning: boolean;
  setDeepReasoning: (enabled: boolean) => void;
}

export const SettingsSlideBar: React.FC<SettingsSlideBarProps> = ({
  isOpen,
  onClose,
  reasoningProfile,
  setReasoningProfile,
  tone,
  setTone,
  deepReasoning,
  setDeepReasoning,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { openProfileModal, openPricingModal } = useAuth();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Panel from Left */}
      <div className="absolute inset-y-0 left-0 max-w-full flex pr-10">
        <div className={`w-screen max-w-md shadow-2xl border-r flex flex-col ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E1525] border-slate-800 text-white'
        }`}>
          {/* Slide Bar Header */}
          <div className={`p-5 border-b flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight">Strategy & Reasoning Slide Bar</h2>
                <p className="text-xs text-slate-400">ตั้งค่าโปรไฟล์ยุทธศาสตร์และระดับการประมวลผล</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Slide Bar Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Section 1: Reasoning Profile */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="flex items-center space-x-2 text-amber-500">
                <Brain className="w-4 h-4" />
                <h3 className="font-bold text-xs sm:text-sm tracking-wide">
                  Reasoning Profile <span className="text-[11px] font-normal text-slate-400">(โปรไฟล์ยุทธศาสตร์)</span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                เลือกกฎการสกัดพยานหลักฐานและกรอบความคิดเฉพาะสาขา (เช่น ป.อ. ภาค 1, การเงิน, การแพทย์, ไอที)
              </p>
              <div className="pt-1">
                <ReasoningProfileSelector
                  selectedProfile={reasoningProfile}
                  onChange={setReasoningProfile}
                />
              </div>
            </div>

            {/* Section 2: Response Tone */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="flex items-center space-x-2 text-purple-400">
                <Compass className="w-4 h-4" />
                <h3 className="font-bold text-xs sm:text-sm tracking-wide">
                  Response Tone <span className="text-[11px] font-normal text-slate-400">(ระดับน้ำเสียง)</span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                เลือกลักษณะการนำเสนอและรูปแบบรายงานผลลัพธ์
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { id: 'Formal Architect', label: 'Formal', desc: 'เป็นทางการ' },
                  { id: 'Empathetic Guide', label: 'Empathetic', desc: 'เข้าใจ แนะนำ' },
                  { id: 'Direct Expert', label: 'Direct', desc: 'ตรงประเด็น' },
                ].map((item) => {
                  const isSelected = tone === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTone(item.id as ToneMode)}
                      className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                        isSelected
                          ? isLight
                            ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold shadow-2xs'
                            : 'bg-purple-500/20 border-purple-500 text-white shadow-md'
                          : isLight
                            ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <div className="font-bold text-xs">{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Deep Reasoning Engine */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <h3 className="font-bold text-xs sm:text-sm tracking-wide">
                    Deep Reasoning <span className="text-[11px] font-normal text-slate-400">(12-Stage FIRE)</span>
                  </h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={deepReasoning}
                    onChange={(e) => setDeepReasoning(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-600" />
                </label>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                ประมวลผลผ่าน 12-Stage Cognitive Matrix Engine พร้อมตรวจสอบความเสี่ยงระดับสูง
              </p>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] block text-slate-400 font-mono">Est. Cost</span>
                  <span className="font-black text-xs font-mono text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                    <DollarSign className="w-3 h-3" /> {deepReasoning ? '$0.0012' : '$0.0004'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] block text-slate-400 font-mono">Token Opt.</span>
                  <span className="font-black text-xs font-mono text-sky-400 flex items-center justify-center gap-0.5 mt-0.5">
                    <Zap className="w-3 h-3" /> -45%
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] block text-slate-400 font-mono">Rigor Score</span>
                  <span className="font-black text-xs font-mono text-amber-400 flex items-center justify-center gap-0.5 mt-0.5">
                    <Award className="w-3 h-3" /> {deepReasoning ? '99.4%' : '92.0%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 4: Member Account & Subscription Tier */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="flex items-center space-x-2 text-emerald-400">
                <Crown className="w-4 h-4" />
                <h3 className="font-bold text-xs sm:text-sm tracking-wide">
                  Member Account & Tier <span className="text-[11px] font-normal text-slate-400">(จัดการสมาชิก & โควตา)</span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                แก้ไขข้อมูลส่วนตัว ติดตามการนับจำนวน Token รายสมาชิก และอัปเกรดแพ็กเกจการใช้งาน
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openProfileModal();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>แก้ไขโปรไฟล์</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openPricingModal();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  <span>แพ็กเกจ & โควตา</span>
                </button>
              </div>
            </div>
          </div>

          {/* Slide Bar Footer */}
          <div className={`p-4 border-t flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> บันทึกการตั้งค่าอัตโนมัติ
            </div>
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow transition-all cursor-pointer"
            >
              เสร็จสิ้น (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
