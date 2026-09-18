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
  FileText,
  Key,
  Link,
  ShieldCheck,
  Lock,
  Zap,
  Settings2
} from 'lucide-react';
import { ToneMode, ReasoningProfile } from '../types';
import { APP_CONFIG } from '../config/env';
import { useModel, PROVIDERS, ProviderId } from '../context/ModelContext';

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
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
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
  selectedModel: selectedModelProp,
  setSelectedModel: setSelectedModelProp,
  deepSeekApiKey,
  setDeepSeekApiKey,
  hasBackendDeepSeekKey = false,
  isLight,
  ollamaUrl: ollamaUrlProp,
  setOllamaUrl: setOllamaUrlProp,
}) => {
  const modelContext = useModel();
  const {
    activeProvider,
    setActiveProvider,
    providerConfigs,
    updateProviderConfig,
    activeConfig,
    ollamaStatus,
    testOllamaConnection,
  } = modelContext;

  const selectedModel = selectedModelProp || modelContext.selectedModel;
  const setSelectedModel = setSelectedModelProp || modelContext.setSelectedModel;
  const ollamaUrl = ollamaUrlProp || modelContext.ollamaUrl;
  const setOllamaUrl = setOllamaUrlProp || modelContext.setOllamaUrl;

  const [activeTab, setActiveTab] = useState<'provider' | 'behavior'>('provider');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
  const [isCustomModel, setIsCustomModel] = useState<boolean>(false);
  const [testState, setTestState] = useState<{
    testing: boolean;
    success?: boolean;
    message?: string;
  }>({ testing: false });

  // Current active provider definition
  const currentProviderDef = PROVIDERS.find((p) => p.id === activeProvider) || PROVIDERS[0];
  const currentProviderConfig = providerConfigs[activeProvider] || {
    provider: activeProvider,
    model: currentProviderDef.defaultModel,
    apiKey: '',
    baseUrl: currentProviderDef.defaultBaseUrl || '',
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle testing connection for non-Ollama and Ollama
  const handleTestConnection = async () => {
    if (activeProvider === 'ollama') {
      await testOllamaConnection(currentProviderConfig.baseUrl);
      return;
    }

    setTestState({ testing: true });
    try {
      const res = await fetch('/api/llm/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: activeProvider,
          model: currentProviderConfig.model,
          apiKey: currentProviderConfig.apiKey || (activeProvider === 'deepseek' ? deepSeekApiKey : ''),
          baseUrl: currentProviderConfig.baseUrl,
        }),
      });
      const data = await res.json();
      setTestState({
        testing: false,
        success: data.ok,
        message: data.message || (data.ok ? 'เชื่อมต่อสำเร็จ (Connection Verified)' : 'เกิดข้อผิดพลาดในการเชื่อมต่อ'),
      });
    } catch (err: any) {
      setTestState({
        testing: false,
        success: false,
        message: err?.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้',
      });
    }
  };

  const handleProviderChange = (newProviderId: ProviderId) => {
    setActiveProvider(newProviderId);
    setTestState({ testing: false });
    const targetDef = PROVIDERS.find((p) => p.id === newProviderId);
    if (targetDef) {
      const existing = providerConfigs[newProviderId];
      const modelToSet = existing?.model || targetDef.defaultModel;
      setSelectedModel(modelToSet);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-md sm:max-w-xl rounded-2xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0B1220] border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-mono tracking-tight flex items-center gap-2">
                <span>System Configuration</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium">
                  PCA v3.0
                </span>
              </h2>
              <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                กำหนดค่าผู้ให้บริการ AI · API Keys · พฤติกรรมการประมวลผล
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="ปิด (Close)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b px-5 pt-2 gap-4 shrink-0 ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/10 bg-[#070D18]'}`}>
          <button
            type="button"
            onClick={() => setActiveTab('provider')}
            className={`pb-2.5 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'provider'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Providers & APIs</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('behavior')}
            className={`pb-2.5 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'behavior'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Behavior & Cognitive</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {activeTab === 'provider' && (
            <div className="space-y-4 animate-fadeIn">
              {/* 1. Select Provider */}
              <div className="space-y-2">
                <div className={`text-[11px] font-mono font-bold uppercase tracking-wider flex items-center justify-between ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span>ผู้ให้บริการ LLM (Provider Selection)</span>
                  <span className="text-[10px] font-normal text-amber-500">
                    Default: DeepSeek & Ollama
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PROVIDERS.map((provider) => {
                    const isSelected = activeProvider === provider.id;
                    return (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => handleProviderChange(provider.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                          isSelected
                            ? isLight
                              ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500 text-slate-900 shadow-sm'
                              : 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40 text-white shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                            : isLight
                              ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                              : 'bg-[#0E1526]/80 hover:bg-[#141E34] border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold">{provider.name}</span>
                          {(provider.id === 'ollama' || provider.category === 'custom') && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                              {provider.id === 'ollama' ? 'Local' : 'Custom'}
                            </span>
                          )}
                          {provider.id === 'deepseek' && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] font-mono mt-0.5 truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {provider.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Provider Details Configuration Card */}
              <div className={`p-4 rounded-xl border space-y-3.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E1526]/90 border-slate-800'
              }`}>
                <div className="flex items-center justify-between border-b pb-2.5 border-white/5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {currentProviderDef.name} Settings
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testState.testing || ollamaStatus === 'checking'}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${testState.testing || ollamaStatus === 'checking' ? 'animate-spin' : ''}`} />
                    <span>{testState.testing || ollamaStatus === 'checking' ? 'Testing...' : 'Test Connection'}</span>
                  </button>
                </div>

                {/* Model Selector / Custom Model */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-amber-400" />
                      <span>โมเดล (Model)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomModel(!isCustomModel)}
                      className="text-[10px] font-mono text-amber-400/80 hover:text-amber-300 cursor-pointer"
                    >
                      {isCustomModel ? 'เลือกจากรายการ (Presets)' : 'ระบุโมเดลเอง (Custom)'}
                    </button>
                  </div>

                  {!isCustomModel && currentProviderDef.models.length > 0 ? (
                    <select
                      value={currentProviderConfig.model || currentProviderDef.defaultModel}
                      onChange={(e) => {
                        const newModel = e.target.value;
                        updateProviderConfig(activeProvider, { model: newModel });
                        setSelectedModel(newModel);
                      }}
                      className={`w-full py-2 px-3 rounded-lg border text-xs font-mono outline-none cursor-pointer ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-800 focus:border-amber-500'
                          : 'bg-[#060A16] border-white/10 text-amber-300 focus:border-amber-500/50'
                      }`}
                    >
                      {currentProviderDef.models.map((m) => (
                        <option key={m.id} value={m.id} className="bg-white dark:bg-[#060A16] text-slate-800 dark:text-slate-100">
                          {m.name} {m.vision ? '👁️ (Vision)' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={currentProviderConfig.model || ''}
                      onChange={(e) => {
                        const newModel = e.target.value;
                        updateProviderConfig(activeProvider, { model: newModel });
                        setSelectedModel(newModel);
                      }}
                      placeholder={`e.g. ${currentProviderDef.defaultModel}`}
                      className={`w-full py-2 px-3 rounded-lg border text-xs font-mono outline-none ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-800 focus:border-amber-500'
                          : 'bg-[#060A16] border-white/10 text-white focus:border-amber-500/50'
                      }`}
                    />
                  )}
                </div>

                {/* API Key Input (if required/supported) */}
                {currentProviderDef.requiresApiKey !== false && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-sky-400" />
                        <span>API Key ({currentProviderDef.name})</span>
                      </label>
                      {activeProvider === 'deepseek' && hasBackendDeepSeekKey && !currentProviderConfig.apiKey && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                          ✓ Embedded Server Key
                        </span>
                      )}
                    </div>
                    <input
                      type="password"
                      value={currentProviderConfig.apiKey || (activeProvider === 'deepseek' ? deepSeekApiKey : '')}
                      onChange={(e) => {
                        const key = e.target.value;
                        updateProviderConfig(activeProvider, { apiKey: key });
                        if (activeProvider === 'deepseek') {
                          setDeepSeekApiKey(key);
                        }
                      }}
                      placeholder={
                        activeProvider === 'deepseek' && hasBackendDeepSeekKey
                          ? '•••••••••••••••• (ใช้คีย์จากเซิร์ฟเวอร์)'
                          : `ระบุ ${currentProviderDef.name} API Key...`
                      }
                      className={`w-full py-2 px-3 rounded-lg border text-xs font-mono outline-none ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-800 focus:border-sky-500'
                          : 'bg-[#060A16] border-white/10 text-slate-200 focus:border-sky-500/50'
                      }`}
                    />
                  </div>
                )}

                {/* Base URL (for Ollama, Custom, or Custom Proxies) */}
                {(!!currentProviderDef.defaultBaseUrl || currentProviderDef.id === 'ollama' || currentProviderDef.id === 'custom') && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                        <Link className="w-3.5 h-3.5 text-emerald-400" />
                        <span>API Base URL</span>
                      </label>
                      {currentProviderDef.defaultBaseUrl && currentProviderConfig.baseUrl !== currentProviderDef.defaultBaseUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            updateProviderConfig(activeProvider, { baseUrl: currentProviderDef.defaultBaseUrl });
                            if (activeProvider === 'ollama' && setOllamaUrl) {
                              setOllamaUrl(currentProviderDef.defaultBaseUrl || '');
                            }
                          }}
                          className="text-[10px] font-mono text-slate-400 hover:text-amber-400 cursor-pointer"
                        >
                          Reset Default
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={currentProviderConfig.baseUrl || ''}
                      onChange={(e) => {
                        const url = e.target.value;
                        updateProviderConfig(activeProvider, { baseUrl: url });
                        if (activeProvider === 'ollama') {
                          setOllamaUrl?.(url);
                        }
                      }}
                      placeholder={currentProviderDef.defaultBaseUrl || 'https://api.example.com/v1'}
                      className={`w-full py-2 px-3 rounded-lg border text-xs font-mono outline-none ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-800 focus:border-emerald-500'
                          : 'bg-[#060A16] border-white/10 text-white focus:border-emerald-500/50'
                      }`}
                    />
                  </div>
                )}

                {/* Security & Privacy Zero-Persistence Assurance */}
                <div className={`p-2.5 rounded-lg border text-[11px] font-mono space-y-1 ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200 text-slate-700' 
                    : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300/90'
                }`}>
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>นโยบายความปลอดภัย Zero-Persistence (Client-Side Only)</span>
                  </div>
                  <div className="text-[10px] leading-relaxed text-slate-400">
                    • <strong>ไม่บันทึกลง Database / Server:</strong> API Key จะถูกเก็บในเครื่องของคุณ (Browser Local Storage) เท่านั้น<br />
                    • <strong>Ephemeral Proxy:</strong> เซิร์ฟเวอร์ทำหน้าที่เพียงส่งต่อคำขอแบบชั่วคราวไปยัง Provider โดยตรงและลบทันที ไม่มีการทำ Log หรือจัดเก็บข้อมูลกุญแจ
                  </div>
                </div>

                {/* Connection Test Status Output */}
                {testState.message && (
                  <div
                    className={`p-2.5 rounded-lg border text-xs font-mono flex items-start gap-2 ${
                      testState.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {testState.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span className="break-all">{testState.message}</span>
                  </div>
                )}

                {activeProvider === 'ollama' && ollamaStatus !== 'idle' && (
                  <div
                    className={`p-2.5 rounded-lg border text-xs font-mono flex items-start gap-2 ${
                      ollamaStatus === 'connected'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : ollamaStatus === 'checking'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {ollamaStatus === 'connected' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div>
                        {ollamaStatus === 'connected'
                          ? 'Ollama Online'
                          : ollamaStatus === 'checking'
                          ? 'Checking Ollama connection...'
                          : 'Cannot connect to Ollama'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'behavior' && (
            <div className="space-y-3.5 animate-fadeIn">
              {/* 1. Behavior Section */}
              <div className="space-y-1.5">
                <div className={`text-[10.5px] font-mono font-bold uppercase tracking-wider px-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Cognitive Persona & Tone
                </div>
                
                {/* Tone Row (~52px) */}
                <div className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-3 min-h-[52px] ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E1526]/80 border-slate-800/80'
                }`}>
                  <span className="text-xs font-mono font-semibold">Tone Mode</span>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as ToneMode)}
                    className={`py-1.5 px-2.5 rounded-lg border text-xs font-mono outline-none text-right transition-all max-w-[200px] sm:max-w-[250px] cursor-pointer ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#060A16] border-white/10 text-slate-200'
                    }`}
                  >
                    <option value="Formal Architect" className="bg-white dark:bg-[#060A16] text-slate-800 dark:text-slate-100">Formal Architect</option>
                    <option value="Direct Expert" className="bg-white dark:bg-[#060A16] text-slate-800 dark:text-slate-100">Direct Expert</option>
                    <option value="Empathetic Guide" className="bg-white dark:bg-[#060A16] text-slate-800 dark:text-slate-100">Empathetic Guide</option>
                  </select>
                </div>

                {/* Reasoning Row (~52px) */}
                <div className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-3 min-h-[52px] ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E1526]/80 border-slate-800/80'
                }`}>
                  <span className="text-xs font-mono font-semibold">Reasoning Profile</span>
                  <select
                    value={reasoningProfile}
                    onChange={(e) => setReasoningProfile(e.target.value as ReasoningProfile)}
                    className={`py-1.5 px-2.5 rounded-lg border text-xs font-mono outline-none text-right transition-all max-w-[200px] sm:max-w-[250px] cursor-pointer ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#060A16] border-white/10 text-slate-200'
                    }`}
                  >
                    <option value="Auto" className="bg-white dark:bg-[#060A16] text-slate-800 dark:text-slate-100">Auto · 12-Stage Pipeline</option>
                    <option value="Chain-of-Thought" className="bg-white dark:bg-[#060A16] text-slate-800 dark:text-slate-100">Chain-of-Thought</option>
                    <option value="First Principles" className="bg-white dark:bg-[#060A16] text-slate-800 dark:text-slate-100">First Principles</option>
                    <option value="Monte Carlo Risk" className="bg-white dark:bg-[#060A16] text-slate-800 dark:text-slate-100">Monte Carlo Risk</option>
                  </select>
                </div>
              </div>

              {/* 2. Advanced Cognitive Capabilities */}
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
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>Advanced Cognitive Controls</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                    <span>{isAdvancedOpen ? 'ซ่อน' : 'แสดงรายละเอียด'}</span>
                    {isAdvancedOpen ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isAdvancedOpen && (
                  <div className="space-y-1.5 pt-1 animate-fadeIn">
                    {/* 12-Stage Verification Row */}
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

                    {/* Live Web Search Row */}
                    <div className={`px-3 py-2 rounded-xl border flex items-center justify-between min-h-[52px] ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E1526]/80 border-slate-800/80'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-sky-400" />
                        <span className="text-xs font-mono font-semibold">Live Web Search & Grounding</span>
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

                    {/* Files & Documents Row */}
                    <div className={`px-3 py-2 rounded-xl border flex items-center justify-between min-h-[52px] ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E1526]/80 border-slate-800/80'
                    }`}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-mono font-semibold">Document & File Reasoning</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-500 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>ACTIVE</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`px-5 py-3.5 border-t shrink-0 flex items-center justify-between gap-2 ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-[#070D18]'
        }`}>
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
            <span className="truncate">Active: {currentProviderDef.name} ({currentProviderConfig.model || selectedModel})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] cursor-pointer shrink-0"
          >
            บันทึกและเริ่มสนทนา
          </button>
        </div>
      </div>
    </div>
  );
};
export const Chatตั้งค่าModal = ChatSettingsModal;
