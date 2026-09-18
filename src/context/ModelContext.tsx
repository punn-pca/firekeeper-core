import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { safeLocalStorage } from '../utils/safeStorage';
import { APP_CONFIG } from '../config/env';
import { resolveModelDetails, ModelResolution } from '../utils/modelUtils';

export interface PresetModel {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isVisionCapable?: boolean;
  isReasoningCapable?: boolean;
}

export interface ProviderModelItem {
  id: string;
  name: string;
  vision?: boolean;
  reasoning?: boolean;
  description?: string;
}

export interface ProviderDefinition {
  id: string;
  name: string;
  category: 'default' | 'cloud' | 'custom';
  description: string;
  defaultBaseUrl?: string;
  defaultModel: string;
  requiresApiKey: boolean;
  presetModels: PresetModel[];
  models: ProviderModelItem[];
}

export type ProviderId = string;

export interface ProviderUserConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  selectedModel?: string;
  customModelName?: string;
  customProviderName?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  group: string;
  category: 'default' | 'cloud' | 'local' | 'custom';
  description?: string;
  isVisionCapable?: boolean;
  isReasoningCapable?: boolean;
}

export const RAW_PROVIDER_DEFINITIONS: Omit<ProviderDefinition, 'models'>[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek (Default)',
    category: 'default',
    description: 'DeepSeek-V3 & DeepSeek-R1 (Reasoner) — โมเดลหลักค่าเริ่มต้น',
    defaultBaseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    requiresApiKey: false, // embedded key available
    presetModels: [
      {
        id: 'deepseek-chat',
        name: 'deepseek-chat',
        displayName: 'DeepSeek-V3',
        description: 'High-speed strategic reasoning & multi-turn synthesis',
      },
      {
        id: 'deepseek-reasoner',
        name: 'deepseek-reasoner',
        displayName: 'DeepSeek-R1 (Reasoner)',
        isReasoningCapable: true,
        description: 'Extended chain-of-thought mathematical and analytical reasoning',
      },
      {
        id: 'deepseek-v4-flash-vision-exp',
        name: 'deepseek-v4-flash-vision-exp',
        displayName: 'DeepSeek Vision (v4 Flash)',
        isVisionCapable: true,
        description: 'Multimodal vision and diagram inspection engine',
      },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama (Local / Custom)',
    category: 'default',
    description: 'รันโมเดลบนเครื่องของคุณเอง หรือรีโมทเซิร์ฟเวอร์แบบส่วนตัว',
    defaultBaseUrl: 'https://ollama.firekeeper.site',
    defaultModel: 'ollama:qwen3:4b',
    requiresApiKey: false,
    presetModels: [
      {
        id: 'ollama:qwen3:4b',
        name: 'ollama:qwen3:4b',
        displayName: 'Qwen3:4b (Local)',
        description: 'Fast local reasoning model',
      },
      {
        id: 'ollama:qwen2.5:3b',
        name: 'ollama:qwen2.5:3b',
        displayName: 'Qwen2.5:3b (Local)',
        description: 'Lightweight local model',
      },
      {
        id: 'ollama:custom',
        name: 'ollama:custom',
        displayName: 'Ollama: Custom Model...',
        description: 'โมเดลอื่น ๆ ที่ติดตั้งไว้ใน Ollama',
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'cloud',
    description: 'GPT-4o, GPT-4o-mini, o1, o3-mini (ต้องใช้ OpenAI API Key)',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    requiresApiKey: true,
    presetModels: [
      { id: 'gpt-4o', name: 'gpt-4o', displayName: 'GPT-4o (Omni)', isVisionCapable: true },
      { id: 'gpt-4o-mini', name: 'gpt-4o-mini', displayName: 'GPT-4o-mini (Fast)', isVisionCapable: true },
      { id: 'o1', name: 'o1', displayName: 'OpenAI o1 (High Reasoning)', isReasoningCapable: true },
      { id: 'o3-mini', name: 'o3-mini', displayName: 'OpenAI o3-mini', isReasoningCapable: true },
      { id: 'gpt-4-turbo', name: 'gpt-4-turbo', displayName: 'GPT-4 Turbo', isVisionCapable: true },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    category: 'cloud',
    description: 'Claude 3.7 Sonnet, 3.5 Sonnet, 3.5 Haiku (ต้องใช้ Anthropic API Key)',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-7-sonnet-20250219',
    requiresApiKey: true,
    presetModels: [
      { id: 'claude-3-7-sonnet-20250219', name: 'claude-3-7-sonnet-20250219', displayName: 'Claude 3.7 Sonnet', isReasoningCapable: true, isVisionCapable: true },
      { id: 'claude-3-5-sonnet-20241022', name: 'claude-3-5-sonnet-20241022', displayName: 'Claude 3.5 Sonnet', isVisionCapable: true },
      { id: 'claude-3-5-haiku-20241022', name: 'claude-3-5-haiku-20241022', displayName: 'Claude 3.5 Haiku (Speed)' },
    ],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    category: 'cloud',
    description: 'Gemini 3.8 Flash, 3.7 Flash, 3.1 Pro (Google AI Gemini API)',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-3.8-flash',
    requiresApiKey: true,
    presetModels: [
      { id: 'gemini-3.8-flash', name: 'gemini-3.8-flash', displayName: 'Gemini 3.8 Flash (Latest)', isVisionCapable: true },
      { id: 'gemini-3.7-flash', name: 'gemini-3.7-flash', displayName: 'Gemini 3.7 Flash', isVisionCapable: true, isReasoningCapable: true },
      { id: 'gemini-3.1-pro-preview', name: 'gemini-3.1-pro-preview', displayName: 'Gemini 3.1 Pro (Advanced Reasoning)', isVisionCapable: true, isReasoningCapable: true },
      { id: 'gemini-3.1-flash-lite', name: 'gemini-3.1-flash-lite', displayName: 'Gemini 3.1 Flash Lite (Fast)', isVisionCapable: true },
      { id: 'gemini-flash-latest', name: 'gemini-flash-latest', displayName: 'Gemini Flash Latest', isVisionCapable: true },
    ],
  },
  {
    id: 'groq',
    name: 'Groq (Ultra-Fast LPU)',
    category: 'cloud',
    description: 'Llama 3.3 70B, DeepSeek-R1 Distill บน Groq LPU ความเร็วสูง',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    requiresApiKey: true,
    presetModels: [
      { id: 'llama-3.3-70b-versatile', name: 'llama-3.3-70b-versatile', displayName: 'Llama 3.3 70B (Groq)' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'deepseek-r1-distill-llama-70b', displayName: 'DeepSeek-R1 Distill 70B (Groq)', isReasoningCapable: true },
      { id: 'llama-3.1-8b-instant', name: 'llama-3.1-8b-instant', displayName: 'Llama 3.1 8B Instant (Groq)' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    category: 'cloud',
    description: 'เข้าถึงโมเดล AI ชั้นนำทุกค่ายผ่าน OpenRouter API เดียว',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.7-sonnet',
    requiresApiKey: true,
    presetModels: [
      { id: 'anthropic/claude-3.7-sonnet', name: 'anthropic/claude-3.7-sonnet', displayName: 'Claude 3.7 Sonnet (OpenRouter)' },
      { id: 'deepseek/deepseek-r1', name: 'deepseek/deepseek-r1', displayName: 'DeepSeek R1 (OpenRouter)', isReasoningCapable: true },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'meta-llama/llama-3.3-70b-instruct', displayName: 'Llama 3.3 70B (OpenRouter)' },
      { id: 'google/gemini-2.5-pro', name: 'google/gemini-2.5-pro', displayName: 'Gemini 2.5 Pro (OpenRouter)' },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    category: 'cloud',
    description: 'Mistral Large, Mistral Small, Codestral (ต้องใช้ Mistral API Key)',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-large-latest',
    requiresApiKey: true,
    presetModels: [
      { id: 'mistral-large-latest', name: 'mistral-large-latest', displayName: 'Mistral Large' },
      { id: 'mistral-small-latest', name: 'mistral-small-latest', displayName: 'Mistral Small' },
      { id: 'codestral-latest', name: 'codestral-latest', displayName: 'Codestral (Coding)' },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    category: 'cloud',
    description: 'Sonar Pro & Sonar Reasoning พร้อมค้นหาเว็บสด',
    defaultBaseUrl: 'https://api.perplexity.ai',
    defaultModel: 'sonar-pro',
    requiresApiKey: true,
    presetModels: [
      { id: 'sonar-pro', name: 'sonar-pro', displayName: 'Sonar Pro' },
      { id: 'sonar-reasoning', name: 'sonar-reasoning', displayName: 'Sonar Reasoning', isReasoningCapable: true },
      { id: 'sonar', name: 'sonar', displayName: 'Sonar (Fast)' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom API (OpenAI Compatible)',
    category: 'custom',
    description: 'เชื่อมต่อกับ API Server หรือ Proxy ใดก็ได้ (vLLM, LM Studio, Together, ฯลฯ)',
    defaultBaseUrl: '',
    defaultModel: '',
    requiresApiKey: false,
    presetModels: [],
  },
];

export const PROVIDER_DEFINITIONS: ProviderDefinition[] = RAW_PROVIDER_DEFINITIONS.map((p) => ({
  ...p,
  models: p.presetModels.map((m) => ({
    id: m.id,
    name: m.displayName || m.name,
    vision: m.isVisionCapable,
    reasoning: m.isReasoningCapable,
    description: m.description,
  })),
}));

export const PROVIDERS = PROVIDER_DEFINITIONS;

export interface ModelContextType {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  activeProvider: string;
  setActiveProvider: (provider: string) => void;
  providerConfigs: Record<string, ProviderUserConfig>;
  updateProviderConfig: (providerId: string, updates: Partial<ProviderUserConfig>) => void;
  activeConfig: ProviderUserConfig;
  activeApiKey: string;
  activeBaseUrl: string;
  modelDetails: ModelResolution;
  isOllamaSelected: boolean;
  availableModels: ModelOption[];
  availableProviders: ProviderDefinition[];
  ollamaUrl: string;
  setOllamaUrl: (url: string) => void;
  ollamaStatus: 'connected' | 'disconnected' | 'checking' | 'idle';
  testOllamaConnection: (url?: string) => Promise<boolean>;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const MODEL_STORAGE_KEY = 'fire_keeper_selected_model';
export const PROVIDER_STORAGE_KEY = 'fire_keeper_active_provider';
export const PROVIDER_CONFIGS_KEY = 'fire_keeper_provider_configs';

export const ModelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeProvider, setActiveProviderState] = useState<string>(() => {
    try {
      const saved = safeLocalStorage.getItem(PROVIDER_STORAGE_KEY);
      if (saved && saved.trim()) return saved.trim();
    } catch (e) {}
    return 'deepseek';
  });

  const [providerConfigs, setProviderConfigs] = useState<Record<string, ProviderUserConfig>>(() => {
    try {
      const savedRaw = safeLocalStorage.getItem(PROVIDER_CONFIGS_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        // Auto-migrate any deprecated Gemini models
        if (parsed.gemini) {
          const m = (parsed.gemini.selectedModel || '').toLowerCase();
          if (!m || m.includes('2.5') || m.includes('2.0') || m.includes('1.5') || m === 'gemini-pro' || m === 'gemini-flash') {
            parsed.gemini.selectedModel = m.includes('pro') ? 'gemini-3.1-pro-preview' : 'gemini-3.8-flash';
          }
        }
        return parsed;
      }
    } catch (e) {}
    return {
      deepseek: { selectedModel: 'deepseek-chat' },
      ollama: { selectedModel: 'ollama:qwen3:4b', baseUrl: APP_CONFIG.OLLAMA_DEFAULT_URL },
      openai: { selectedModel: 'gpt-4o' },
      anthropic: { selectedModel: 'claude-3-7-sonnet-20250219' },
      gemini: { selectedModel: 'gemini-3.8-flash' },
      groq: { selectedModel: 'llama-3.3-70b-versatile' },
      openrouter: { selectedModel: 'anthropic/claude-3.7-sonnet' },
      mistral: { selectedModel: 'mistral-large-latest' },
      perplexity: { selectedModel: 'sonar-pro' },
      custom: { selectedModel: 'custom-model', baseUrl: 'http://localhost:1234/v1', customProviderName: 'Custom API' },
    };
  });

  const [selectedModel, setSelectedModelState] = useState<string>(() => {
    try {
      const saved = safeLocalStorage.getItem(MODEL_STORAGE_KEY);
      if (saved && saved.trim()) {
        const s = saved.trim();
        if (s.includes('gemini-2.5') || s.includes('gemini-2.0') || s.includes('gemini-1.5')) {
          return s.includes('pro') ? 'gemini-3.1-pro-preview' : 'gemini-3.8-flash';
        }
        return s;
      }
    } catch (e) {}
    return 'deepseek-chat';
  });

  const [ollamaUrl, setOllamaUrlState] = useState<string>(() => {
    try {
      const saved = safeLocalStorage.getItem(APP_CONFIG.OLLAMA_URL_KEY);
      if (saved && saved !== 'http://127.0.0.1:11434' && saved !== 'http://localhost:11434') {
        return saved;
      }
    } catch (e) {}
    return APP_CONFIG.OLLAMA_DEFAULT_URL;
  });

  const setActiveProvider = (provider: string) => {
    const trimmed = (provider || 'deepseek').trim();
    setActiveProviderState(trimmed);
    try {
      safeLocalStorage.setItem(PROVIDER_STORAGE_KEY, trimmed);
    } catch (e) {}

    // Auto-update selectedModel to match active provider's chosen model
    const config = providerConfigs[trimmed];
    const def = PROVIDER_DEFINITIONS.find((d) => d.id === trimmed);
    const targetModel = config?.selectedModel || config?.customModelName || def?.defaultModel || 'deepseek-chat';
    if (targetModel) {
      setSelectedModel(targetModel);
    }
  };

  const updateProviderConfig = (providerId: string, updates: Partial<ProviderUserConfig>) => {
    setProviderConfigs((prev) => {
      const existing = prev[providerId] || {};
      const nextConfig = { ...existing, ...updates };
      const updated = { ...prev, [providerId]: nextConfig };
      try {
        safeLocalStorage.setItem(PROVIDER_CONFIGS_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // If updating currently active provider's model
    if (providerId === activeProvider && updates.selectedModel) {
      setSelectedModel(updates.selectedModel);
    }
  };

  const setSelectedModel = (model: string) => {
    const trimmed = (model || '').trim();
    const finalModel = trimmed || 'deepseek-chat';
    setSelectedModelState(finalModel);
    try {
      safeLocalStorage.setItem(MODEL_STORAGE_KEY, finalModel);
    } catch (e) {}
  };

  const setOllamaUrl = (url: string) => {
    const trimmed = (url || '').trim();
    setOllamaUrlState(trimmed);
    try {
      safeLocalStorage.setItem(APP_CONFIG.OLLAMA_URL_KEY, trimmed);
    } catch (e) {}
    updateProviderConfig('ollama', { baseUrl: trimmed });
  };

  useEffect(() => {
    try {
      safeLocalStorage.setItem(MODEL_STORAGE_KEY, selectedModel);
    } catch (e) {}
  }, [selectedModel]);

  const activeApiKey = useMemo(() => {
    const config = providerConfigs[activeProvider];
    return config?.apiKey || '';
  }, [providerConfigs, activeProvider]);

  const activeBaseUrl = useMemo(() => {
    if (activeProvider === 'ollama') return ollamaUrl;
    const config = providerConfigs[activeProvider];
    const def = PROVIDER_DEFINITIONS.find((d) => d.id === activeProvider);
    return config?.baseUrl || def?.defaultBaseUrl || '';
  }, [providerConfigs, activeProvider, ollamaUrl]);

  const modelDetails = useMemo(() => {
    return resolveModelDetails(selectedModel, activeProvider);
  }, [selectedModel, activeProvider]);

  const isOllamaSelected = useMemo(() => {
    return activeProvider === 'ollama' || selectedModel.startsWith('ollama:') || selectedModel.toLowerCase().includes('qwen');
  }, [activeProvider, selectedModel]);

  const availableModels = useMemo<ModelOption[]>(() => {
    const models: ModelOption[] = [];
    for (const def of PROVIDER_DEFINITIONS) {
      for (const p of def.presetModels) {
        models.push({
          id: p.id,
          name: p.name,
          displayName: p.displayName,
          provider: def.id,
          group: def.name,
          category: def.category === 'default' && def.id === 'ollama' ? 'local' : def.category,
          description: p.description,
          isVisionCapable: p.isVisionCapable,
          isReasoningCapable: p.isReasoningCapable,
        });
      }
    }
    return models;
  }, []);

  const [ollamaStatus, setOllamaStatus] = useState<'connected' | 'disconnected' | 'checking' | 'idle'>('idle');

  const testOllamaConnection = async (testUrl?: string): Promise<boolean> => {
    const targetUrl = testUrl || ollamaUrl;
    setOllamaStatus('checking');
    try {
      const res = await fetch('/api/ollama/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: targetUrl }),
      });
      const data = await res.json();
      const isConnected = !!data.connected;
      setOllamaStatus(isConnected ? 'connected' : 'disconnected');
      return isConnected;
    } catch {
      setOllamaStatus('disconnected');
      return false;
    }
  };

  const activeConfig = useMemo<ProviderUserConfig>(() => {
    const cfg = providerConfigs[activeProvider];
    const def = PROVIDER_DEFINITIONS.find((d) => d.id === activeProvider);
    return {
      apiKey: cfg?.apiKey || '',
      baseUrl: cfg?.baseUrl || def?.defaultBaseUrl || '',
      model: cfg?.model || cfg?.selectedModel || def?.defaultModel || selectedModel,
      selectedModel: cfg?.selectedModel || cfg?.model || def?.defaultModel || selectedModel,
      customModelName: cfg?.customModelName,
      customProviderName: cfg?.customProviderName,
    };
  }, [providerConfigs, activeProvider, selectedModel]);

  const value = useMemo<ModelContextType>(() => ({
    selectedModel,
    setSelectedModel,
    activeProvider,
    setActiveProvider,
    providerConfigs,
    updateProviderConfig,
    activeConfig,
    activeApiKey,
    activeBaseUrl,
    modelDetails,
    isOllamaSelected,
    availableModels,
    availableProviders: PROVIDER_DEFINITIONS,
    ollamaUrl,
    setOllamaUrl,
    ollamaStatus,
    testOllamaConnection,
  }), [
    selectedModel,
    activeProvider,
    providerConfigs,
    activeConfig,
    activeApiKey,
    activeBaseUrl,
    modelDetails,
    isOllamaSelected,
    availableModels,
    ollamaUrl,
    ollamaStatus,
  ]);

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = (): ModelContextType => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};
