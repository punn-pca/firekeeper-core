import React from 'react';
import { X, Sliders, Bot, BrainCircuit, Mic, Paperclip, Sparkles, Check, Info } from 'lucide-react';
import { ToneMode, ReasoningProfile } from '../types';

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tone: ToneMode;
  setTone: (tone: ToneMode) => void;
  deepReasoning: boolean;
  setDeepReasoning: (enabled: boolean) => void;
  reasoningProfile: ReasoningProfile;
  setReasoningProfile: (profile: ReasoningProfile) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  deepSeekApiKey: string;
  setDeepSeekApiKey: (key: string) => void;
  hasBackendDeepSeekKey?: boolean;
  isLight: boolean;
}

export const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({
  isOpen,
  onClose,
  tone,
  setTone,
  deepReasoning,
  setDeepReasoning,
  reasoningProfile,
  setReasoningProfile,
  selectedModel,
  setSelectedModel,
  deepSeekApiKey,
  setDeepSeekApiKey,
  hasBackendDeepSeekKey = false,
  isLight,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl border ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0B1220] border-white/10'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                การตั้งค่าระบบ & แชท (Chat Configuration)
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                ปรับแต่งสมองกล, ความลึกการวิเคราะห์, และอินพุต
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white transition-all ${
              isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* AI Model */}
          <div>
            <label className={`block text-xs font-semibold font-mono mb-1.5 flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <Bot className="w-4 h-4 text-amber-400" />
              <span>AI Reasoning Model</span>
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs font-mono outline-none transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500'
                  : 'bg-[#060A16] border-white/10 text-white focus:border-amber-500/50'
              }`}
            >
              <optgroup label="DeepSeek (Production Reasoning & Chat)">
                <option value="deepseek-chat">DeepSeek-V3 (DeepSeek Chat - รวดเร็ว แม่นยำ)</option>
                <option value="deepseek-reasoner">DeepSeek-R1 (DeepSeek Reasoner - เชิงลึก & ตรรกะสูง)</option>
              </optgroup>
            </select>
          </div>

          {/* DeepSeek API Key Input */}
          <div>
            <label className={`block text-xs font-semibold font-mono mb-1.5 flex items-center justify-between gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>DeepSeek API Key</span>
              </span>
              {hasBackendDeepSeekKey && (
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold">
                  ✓ ฝังคีย์หลังบ้านเรียบร้อย (Embedded)
                </span>
              )}
            </label>
            <input
              type="password"
              value={deepSeekApiKey}
              onChange={(e) => setDeepSeekApiKey(e.target.value)}
              placeholder={hasBackendDeepSeekKey ? "••••••••••••••••••••••••" : "sk-..."}
              className={`w-full p-2.5 rounded-xl border text-xs font-mono outline-none transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-sky-500'
                  : 'bg-[#060A16] border-white/10 text-white focus:border-sky-500/50'
              }`}
            />
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              {hasBackendDeepSeekKey 
                ? "ระบบฝังคีย์ไว้ที่เซิร์ฟเวอร์เรียบร้อย คุณไม่ต้องกรอกเพิ่มเติม หรือระบุที่นี่เพื่อใช้คีย์ส่วนตัวทดแทน" 
                : "หากไม่ระบุ ระบบจะพยายามใช้ DEEPSEEK_API_KEY จากตัวแปรสภาพแวดล้อม (Environment) ของเซิร์ฟเวอร์"}
            </p>
          </div>

          {/* Tone & Reasoning Profile Side-by-side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tone */}
            <div>
              <label className={`block text-xs font-semibold font-mono mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                โทนการสื่อสาร (Tone & Voice)
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as ToneMode)}
                className={`w-full p-2.5 rounded-xl border text-xs font-mono outline-none ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#060A16] border-white/10 text-white'
                }`}
              >
                <option value="Formal Architect">Formal Architect (ทางการ & โครงสร้างสถาปัตย์)</option>
                <option value="Executive Brief">Executive Brief (สรุปผู้บริหาร & CAPEX)</option>
                <option value="Deep Analytical">Deep Analytical (วิเคราะห์สถิติ & ลึกซึ้ง)</option>
              </select>
            </div>

            {/* Reasoning Profile */}
            <div>
              <label className={`block text-xs font-semibold font-mono mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                กระบวนการคิด (PCA Profile)
              </label>
              <select
                value={reasoningProfile}
                onChange={(e) => setReasoningProfile(e.target.value as ReasoningProfile)}
                className={`w-full p-2.5 rounded-xl border text-xs font-mono outline-none ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#060A16] border-white/10 text-white'
                }`}
              >
                <option value="Auto">Auto (12-Stage Matrix)</option>
                <option value="Chain-of-Thought">Chain-of-Thought</option>
                <option value="First Principles">First Principles</option>
                <option value="Monte Carlo Risk">Monte Carlo Risk</option>
              </select>
            </div>
          </div>

          {/* Deep Reasoning Switch */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <div className={`text-xs font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  12-Stage Deep Reasoning Verification
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  ผ่านการประเมิน 12 ขั้นตอนของ PUNN Cognitive Architecture
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={deepReasoning}
                onChange={(e) => setDeepReasoning(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Input Guidelines & File Types Help */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-2 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
              <Info className="w-3.5 h-3.5" />
              <span>การอัปโหลดไฟล์เอกสาร (Files & Documents)</span>
            </div>
            <div className="text-[10px]">
              <p>ระบบรองรับการอัปโหลดไฟล์เอกสาร (PDF, Word, CSV, TXT), โค้ดโปรแกรม และรูปภาพ เพื่อนำเข้าสู่กระบวนการวิเคราะห์เชิงลึก</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          >
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  );
};
