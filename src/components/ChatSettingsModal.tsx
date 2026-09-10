import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Bot,
  BrainCircuit,
  Sparkles,
  Globe,
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { ToneMode, ReasoningProfile } from '../types';
import { APP_CONFIG } from '../config/env';

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tone: ToneMode;
  setTone: (tone: ToneMode) => void;
  deepReasoning: boolean;
  setDeepReasoning: (enabled: boolean) => void;
  webSearch?: boolean;
  setWebSearch?: (enabled: boolean) => void;
  reasoningProfile: ReasoningProfile;
  setReasoningProfile: (profile: ReasoningProfile) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  deepSeekApiKey: string;
  setDeepSeekApiKey: (key: string) => void;
  hasBackendDeepSeekKey?: boolean;
  isLight: boolean;
  ollamaUrl?: string;
  setOllamaUrl?: (url: string) => void;
}

export const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({
  isOpen,
  onClose,
  tone,
  setTone,
  deepReasoning,
  setDeepReasoning,
  webSearch = true,
  setWebSearch,
  reasoningProfile,
  setReasoningProfile,
  selectedModel,
  setSelectedModel,
  deepSeekApiKey,
  setDeepSeekApiKey,
  hasBackendDeepSeekKey = false,
  isLight,
  ollamaUrl,
  setOllamaUrl,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
  const [localOllamaUrl, setLocalOllamaUrl] = useState<string>(() => {
    const raw = ollamaUrl || localStorage.getItem(APP_CONFIG.OLLAMA_URL_KEY);
    if (!raw || raw === 'http://127.0.0.1:11434' || raw === 'http://localhost:11434') {
      return APP_CONFIG.OLLAMA_DEFAULT_URL;
    }
    return raw;
  });
  const [customModelName, setCustomModelName] = useState<string>('qwen3:4b');
  const [ollamaStatus, setOllamaStatus] = useState<{
    testing: boolean;
    online?: boolean;
    models?: string[];
    error?: string;
  }>({ testing: false });

  const isOllamaSelected = selectedModel.startsWith('ollama:') || selectedModel.includes('qwen');

  useEffect(() => {
    if (ollamaUrl) {
      if (ollamaUrl === 'http://127.0.0.1:11434' || ollamaUrl === 'http://localhost:11434') {
        handleOllamaUrlChange(APP_CONFIG.OLLAMA_DEFAULT_URL);
      } else {
        setLocalOllamaUrl(ollamaUrl);
      }
    }
  }, [ollamaUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleTestOllama = async () => {
    setOllamaStatus({ testing: true });
    try {
      const res = await fetch(`/api/ollama/status?baseUrl=${encodeURIComponent(localOllamaUrl)}`);
      const data = await res.json();
      setOllamaStatus({
        testing: false,
        online: data.online,
        models: data.models,
        error: data.error
      });
      if (data.online) {
        localStorage.setItem(APP_CONFIG.OLLAMA_URL_KEY, localOllamaUrl);
        if (setOllamaUrl) setOllamaUrl(localOllamaUrl);
      }
    } catch (err: any) {
      setOllamaStatus({
        testing: false,
        online: false,
        error: err?.message || 'Cannot reach server'
      });
    }
  };

  const handleOllamaUrlChange = (url: string) => {
    setLocalOllamaUrl(url);
    localStorage.setItem(APP_CONFIG.OLLAMA_URL_KEY, url);
    if (setOllamaUrl) setOllamaUrl(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-md sm:max-w-lg rounded-2xl p-4 sm:p-5 shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0B1220] border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 mb-3 border-b shrink-0 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-500 shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-mono tracking-tight">
                Configuration
              </h2>
              <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                ปรับแต่งสมอง · การคิด · การเชื่อมต่อ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="ปิด (Close)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="space-y-3.5 overflow-y-auto pr-0.5">
          {/* 1. AI Model Section */}
          <div className="space-y-1.5">
            <div className={`text-[10.5px] font-mono font-bold uppercase tracking-wider px-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              AI Model
            </div>
            
            {/* Model Select Row (~52px) */}
            <div className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-3 min-h-[52px] ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E1526]/80 border-slate-800/80'
            }`}>
              <div className="flex items-center gap-2 shrink-0">
                <Bot className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-mono font-semibold">Model</span>
              </div>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className={`py-1.5 px-2.5 rounded-lg border text-xs font-mono outline-none text-right transition-all max-w-[210px] sm:max-w-[260px] truncate cursor-pointer ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800 focus:border-amber-500'
                    : 'bg-[#060A16] border-white/10 text-amber-300 focus:border-amber-500/50'
                }`}
              >
                <optgroup label="DeepSeek">
                  <option value="deepseek-chat">DeepSeek-V3</option>
                  <option value="deepseek-reasoner">DeepSeek-R1 (Reasoner)</option>
                  <option value="deepseek-v4-flash-vision-exp">DeepSeek Vision (v4 Flash)</option>
                </optgroup>
                <optgroup label="Ollama (Local)">
                  <option value="ollama:qwen3:4b">Ollama: Qwen3:4b</option>
                  <option value="ollama:qwen2.5:3b">Ollama: Qwen2.5:3b</option>
                  <option value="ollama:custom">Ollama: Custom...</option>
                </optgroup>
              </select>
            </div>

            {/* Ollama Sub-settings if selected */}
            {isOllamaSelected && (
              <div className={`p-2.5 rounded-xl border space-y-2 text-xs font-mono ${
                isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-500/5 border-amber-500/20'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5" />
                    <span>Ollama Endpoint</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {localOllamaUrl !== APP_CONFIG.OLLAMA_DEFAULT_URL && (
                      <button
                        type="button"
                        onClick={() => handleOllamaUrlChange(APP_CONFIG.OLLAMA_DEFAULT_URL)}
                        className="px-2 py-0.5 rounded text-[10px] font-mono text-amber-500/80 hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"
                        title="ตั้งค่ากลับเป็นค่าเริ่มต้น (Default)"
                      >
                        Reset Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleTestOllama}
                      disabled={ollamaStatus.testing}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${ollamaStatus.testing ? 'animate-spin' : ''}`} />
                      <span>{ollamaStatus.testing ? 'Testing...' : 'Test'}</span>
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={localOllamaUrl}
                  onChange={(e) => handleOllamaUrlChange(e.target.value)}
                  placeholder="https://ollama.firekeeper.site"
                  className={`w-full py-1 px-2 rounded-lg border text-xs font-mono outline-none ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#060A16] border-white/10 text-white'
                  }`}
                />
                {selectedModel.startsWith('ollama:') && !['ollama:qwen3:4b', 'ollama:qwen2.5:3b'].includes(selectedModel) && (
                  <input
                    type="text"
                    value={customModelName}
                    onChange={(e) => {
                      setCustomModelName(e.target.value);
                      setSelectedModel(`ollama:${e.target.value.trim()}`);
                    }}
                    placeholder="e.g. qwen2.5:7b"
                    className={`w-full py-1 px-2 rounded-lg border text-xs font-mono outline-none ${
                      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#060A16] border-white/10 text-white'
                    }`}
                  />
                )}
                {ollamaStatus.online === true && (
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>Online ({ollamaStatus.models?.join(', ') || 'Ready'})</span>
                  </div>
                )}
                {ollamaStatus.online === false && (
                  <div className="text-[10px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>Cannot connect (run: ollama serve)</span>
                  </div>
                )}
              </div>
            )}

            {/* API Key Row (~52px, single line!) */}
            <div className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2.5 min-h-[52px] ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E1526]/80 border-slate-800/80'
            }`}>
              <div className="flex items-center gap-2 shrink-0">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-mono font-semibold">API Key</span>
              </div>
              <div className="flex items-center gap-1.5 flex-1 justify-end max-w-[240px] sm:max-w-[280px]">
                <input
                  type="password"
                  value={deepSeekApiKey}
                  onChange={(e) => setDeepSeekApiKey(e.target.value)}
                  placeholder={hasBackendDeepSeekKey ? "••••••••••••••••" : "sk-..."}
                  className={`w-full py-1.5 px-2.5 rounded-lg border text-xs font-mono outline-none text-right sm:text-left transition-all ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800 focus:border-sky-500'
                      : 'bg-[#060A16] border-white/10 text-slate-200 focus:border-sky-500/50'
                  }`}
                />
                {hasBackendDeepSeekKey && !deepSeekApiKey && (
                  <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 whitespace-nowrap">
                    ✓ Embedded
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Behavior Section */}
          <div className="space-y-1.5">
            <div className={`text-[10.5px] font-mono font-bold uppercase tracking-wider px-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Behavior
            </div>
            
            {/* Tone Row (~52px) */}
            <div className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-3 min-h-[52px] ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E1526]/80 border-slate-800/80'
            }`}>
              <span className="text-xs font-mono font-semibold">Tone</span>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as ToneMode)}
                className={`py-1.5 px-2.5 rounded-lg border text-xs font-mono outline-none text-right transition-all max-w-[200px] sm:max-w-[250px] cursor-pointer ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#060A16] border-white/10 text-slate-200'
                }`}
              >
                <option value="Formal Architect">Formal Architect</option>
                <option value="Direct Expert">Direct Expert</option>
                <option value="Empathetic Guide">Empathetic Guide</option>
              </select>
            </div>

            {/* Reasoning Row (~52px) */}
            <div className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-3 min-h-[52px] ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E1526]/80 border-slate-800/80'
            }`}>
              <span className="text-xs font-mono font-semibold">Reasoning</span>
              <select
                value={reasoningProfile}
                onChange={(e) => setReasoningProfile(e.target.value as ReasoningProfile)}
                className={`py-1.5 px-2.5 rounded-lg border text-xs font-mono outline-none text-right transition-all max-w-[200px] sm:max-w-[250px] cursor-pointer ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#060A16] border-white/10 text-slate-200'
                }`}
              >
                <option value="Auto">Auto · 12-Stage</option>
                <option value="Chain-of-Thought">Chain-of-Thought</option>
                <option value="First Principles">First Principles</option>
                <option value="Monte Carlo Risk">Monte Carlo Risk</option>
              </select>
            </div>
          </div>

          {/* 3. Advanced Section (Collapsible) */}
          <div className="pt-1 space-y-1.5">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className={`w-full px-3 py-2.5 rounded-xl border flex items-center justify-between min-h-[50px] transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-100/70 hover:bg-slate-100 border-slate-200 text-slate-800'
                  : 'bg-slate-900/40 hover:bg-slate-800/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 font-mono text-xs font-bold">
                <Sliders className="w-3.5 h-3.5 text-amber-500" />
                <span>Advanced</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                <span>{isAdvancedOpen ? 'ซ่อน' : 'ตั้งค่าเพิ่มเติม'}</span>
                {isAdvancedOpen ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isAdvancedOpen && (
              <div className="space-y-1.5 pt-1 animate-fadeIn">
                {/* 12-Stage Verification Row (~52px) */}
                <div className={`px-3 py-2 rounded-xl border flex items-center justify-between min-h-[52px] ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E1526]/80 border-slate-800/80'
                }`}>
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono font-semibold">12-Stage Verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-400">
                      {deepReasoning ? 'ON' : 'OFF'}
                    </span>
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
                </div>

                {/* Live Web Search Row (~52px) */}
                <div className={`px-3 py-2 rounded-xl border flex items-center justify-between min-h-[52px] ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E1526]/80 border-slate-800/80'
                }`}>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-mono font-semibold">Live Web Search</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-400">
                      {webSearch ? 'ON' : 'OFF'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webSearch}
                        onChange={(e) => setWebSearch?.(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                    </label>
                  </div>
                </div>

                {/* Files & Documents Row (~52px) */}
                <div className={`px-3 py-2 rounded-xl border flex items-center justify-between min-h-[52px] ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E1526]/80 border-slate-800/80'
                }`}>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono font-semibold">Files & Documents</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-500 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>ON</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`mt-3 pt-3 border-t shrink-0 flex items-center justify-end gap-2 ${
          isLight ? 'border-slate-200' : 'border-white/10'
        }`}>
          <button
            type="button"
            onClick={() => {
              handleOllamaUrlChange(localOllamaUrl);
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] cursor-pointer"
          >
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  );
};
