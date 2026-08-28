import React, { useState, useEffect } from 'react';
import { X, Sliders, Bot, BrainCircuit, Sparkles, Check, Info, ShieldCheck, Cpu, Network } from 'lucide-react';
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
  const [apiStatus, setApiStatus] = useState<{ openAi: string; gemini: string; deepSeek: string }>({
    openAi: 'NOT CONFIGURED',
    gemini: 'CONNECTED',
    deepSeek: 'CONNECTED'
  });

  useEffect(() => {
    // Check actual backend config status
    fetch('/api/config/status')
      .then(res => res.json())
      .then(data => {
        setApiStatus({
          openAi: data.hasOpenAiKey ? 'CONNECTED' : 'NOT CONFIGURED',
          gemini: data.hasGeminiKey !== false ? 'CONNECTED' : 'NOT CONFIGURED',
          deepSeek: (hasBackendDeepSeekKey || data.hasDeepSeekKey || Boolean(deepSeekApiKey)) ? 'CONNECTED' : 'NOT CONFIGURED'
        });
      })
      .catch(() => {
        setApiStatus({
          openAi: 'NOT CONFIGURED',
          gemini: 'CONNECTED',
          deepSeek: hasBackendDeepSeekKey || Boolean(deepSeekApiKey) ? 'CONNECTED' : 'NOT CONFIGURED'
        });
      });
  }, [hasBackendDeepSeekKey, deepSeekApiKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl border ${
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
                PUNN Cognitive Architecture — Multi-AI Decision Intelligence Pipeline
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
          {/* FIRE KEEPER AI ENGINE Header */}
          <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'} space-y-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span className={`text-xs font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  FIRE KEEPER AI ENGINE
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Multi-AI 12-Stage Pipeline
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
              ใช้ Gemini, DeepSeek และ OpenAI แบ่งหน้าที่กันตามความถนัดใน 12 ขั้นตอนของ FIRE KEEPER
            </p>
          </div>

          {/* AI RESPONSIBILITY CARD */}
          <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060A16] border-slate-800'} space-y-3`}>
            <div className="flex items-center gap-2 text-xs font-bold font-mono text-amber-400">
              <Network className="w-4 h-4" />
              <span>AI RESPONSIBILITY & ROLES</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-mono">
              <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/60 border-white/10 text-slate-200'}`}>
                <div className="font-bold text-sky-400 mb-1">OpenAI</div>
                <div className="text-[10px] text-slate-400">Decision & Synthesis (Framing, Options, Final Report)</div>
              </div>
              <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/60 border-white/10 text-slate-200'}`}>
                <div className="font-bold text-emerald-400 mb-1">Gemini</div>
                <div className="text-[10px] text-slate-400">Research & Evidence (Web Research & Extraction)</div>
              </div>
              <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/60 border-white/10 text-slate-200'}`}>
                <div className="font-bold text-purple-400 mb-1">DeepSeek</div>
                <div className="text-[10px] text-slate-400">Analysis & Risk (Validation, Decomposition, Stress Test)</div>
              </div>
            </div>
          </div>

          {/* API Configuration & Status */}
          <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'} space-y-2`}>
            <div className="text-xs font-bold font-mono text-amber-400 flex items-center justify-between">
              <span>AI PROVIDER STATUS & SMART FALLBACK</span>
              <span className="text-[10px] text-slate-400">Live Health Check</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-black/20 border border-white/5 flex flex-col justify-between">
                <span className="text-slate-400">Gemini</span>
                <span className={`text-[10px] font-bold mt-1 text-emerald-400`}>
                  AVAILABLE
                </span>
              </div>
              <div className="p-2 rounded bg-black/20 border border-white/5 flex flex-col justify-between">
                <span className="text-slate-400">OpenAI</span>
                <span className={`text-[10px] font-bold mt-1 ${apiStatus.openAi === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {apiStatus.openAi === 'CONNECTED' ? 'AVAILABLE' : 'NOT_CONFIGURED'}
                </span>
              </div>
              <div className="p-2 rounded bg-black/20 border border-white/5 flex flex-col justify-between">
                <span className="text-slate-400">DeepSeek</span>
                <span className={`text-[10px] font-bold mt-1 ${apiStatus.deepSeek === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {apiStatus.deepSeek === 'CONNECTED' ? 'AVAILABLE' : 'QUOTA_LIMITED'}
                </span>
              </div>
            </div>
          </div>

          {/* DeepSeek API Key Input */}
          <div>
            <label className={`block text-xs font-semibold font-mono mb-1.5 flex items-center justify-between gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>DeepSeek API Key (Optional Override)</span>
              </span>
              {(hasBackendDeepSeekKey || apiStatus.deepSeek === 'CONNECTED') && (
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold">
                  ✓ Configured / Connected
                </span>
              )}
            </label>
            <input
              type="password"
              value={deepSeekApiKey}
              onChange={(e) => setDeepSeekApiKey(e.target.value)}
              placeholder="sk-..."
              className={`w-full p-2.5 rounded-xl border text-xs font-mono outline-none transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-sky-500'
                  : 'bg-[#060A16] border-white/10 text-white focus:border-sky-500/50'
              }`}
            />
          </div>

          {/* Tone & Reasoning Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div>
              <label className={`block text-xs font-semibold font-mono mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                PCA Profile
              </label>
              <select
                value={reasoningProfile}
                onChange={(e) => setReasoningProfile(e.target.value as ReasoningProfile)}
                className={`w-full p-2.5 rounded-xl border text-xs font-mono outline-none ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#060A16] border-white/10 text-white'
                }`}
              >
                <option value="Auto">PCA Multi-AI 12-Stage</option>
                <option value="Chain-of-Thought">Chain-of-Thought</option>
                <option value="First Principles">First Principles</option>
                <option value="Monte Carlo Risk">Monte Carlo Risk</option>
              </select>
            </div>
          </div>

          {/* 12-Stage Multi-AI Verification Switch */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <div className={`text-xs font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  12-Stage Multi-AI Verification
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  ตรวจสอบกระบวนการตัดสินใจทั้ง 12 ขั้นตอน โดยใช้ AI แต่ละตัวตามบทบาทที่กำหนด
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

          {/* 12-STAGE FLOW VIEW */}
          <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'} space-y-2`}>
            <div className="text-xs font-bold font-mono text-amber-400">
              12-STAGE FLOW (Multi-AI Execution Mapping)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono">
              <div className="p-1.5 rounded bg-black/20 border border-white/5 flex items-center justify-between"><span className="text-slate-400">01 Framing</span><span className="text-sky-400 font-bold">OpenAI</span></div>
              <div className="p-1.5 rounded bg-black/20 border border-white/5 flex items-center justify-between"><span className="text-slate-400">02 Research</span><span className="text-emerald-400 font-bold">Gemini</span></div>
              <div className="p-1.5 rounded bg-black/20 border border-white/5 flex items-center justify-between"><span className="text-slate-400">03 Extraction</span><span className="text-emerald-400 font-bold">Gemini</span></div>
              <div className="p-1.5 rounded bg-black/20 border border-white/5 flex items-center justify-between"><span className="text-slate-400">04 Validation</span><span className="text-purple-400 font-bold">DeepSeek</span></div>
              <div className="p-1.5 rounded bg-black/20 border border-white/5 flex items-center justify-between"><span className="text-slate-400">05 Root Cause</span><span className="text-purple-400 font-bold">DeepSeek</span></div>
              <div className="p-1.5 rounded bg-black/20 border border-white/5 flex items-center justify-between"><span className="text-slate-400">06 Deep Analysis</span><span className="text-purple-400 font-bold">DeepSeek</span></div>
              <div className="p-1.5 rounded bg-black/20 border border-white/5 flex items-center justify-between"><span className="text-slate-400">07 Options</span><span className="text-sky-400 font-bold">OpenAI</span></div>
              <div className="p-1.5 rounded bg-black/20 border border-white/5 flex items-center justify-between"><span className="text-slate-400">08 Stress Test</span><span className="text-purple-400 font-bold">DeepSeek</span></div>
              <div className="p-1.5 rounded bg-black/20 border border-white/5 flex items-center justify-between"><span className="text-slate-400">09 Risk Analysis</span><span className="text-purple-400 font-bold">DeepSeek</span></div>
              <div className="p-1.5 rounded bg-black/20 border border-white/5 flex items-center justify-between"><span className="text-slate-400">10 Synthesis</span><span className="text-sky-400 font-bold">OpenAI</span></div>
              <div className="p-1.5 rounded bg-black/20 border border-white/5 flex items-center justify-between"><span className="text-slate-400">11 Recommendation</span><span className="text-sky-400 font-bold">OpenAI</span></div>
              <div className="p-1.5 rounded bg-black/20 border border-white/5 flex items-center justify-between"><span className="text-slate-400">12 Decision Report</span><span className="text-sky-400 font-bold">OpenAI</span></div>
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

