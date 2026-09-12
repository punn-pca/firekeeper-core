import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { safeLocalStorage } from '../utils/safeStorage';
import { APP_CONFIG } from '../config/env';
import { resolveModelDetails, ModelResolution } from '../utils/modelUtils';

export interface ModelOption {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  group: 'DeepSeek' | 'Ollama (Local)';
  category: 'cloud' | 'local';
  description?: string;
  isVisionCapable?: boolean;
  isReasoningCapable?: boolean;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'deepseek-chat',
    name: 'deepseek-chat',
    displayName: 'DeepSeek-V3',
    provider: 'deepseek',
    group: 'DeepSeek',
    category: 'cloud',
    description: 'High-speed strategic reasoning and multi-turn architectural synthesis.',
  },
  {
    id: 'deepseek-reasoner',
    name: 'deepseek-reasoner',
    displayName: 'DeepSeek-R1 (Reasoner)',
    provider: 'deepseek',
    group: 'DeepSeek',
    category: 'cloud',
    isReasoningCapable: true,
    description: 'Extended chain-of-thought mathematical and analytical reasoning.',
  },
  {
    id: 'deepseek-v4-flash-vision-exp',
    name: 'deepseek-v4-flash-vision-exp',
    displayName: 'DeepSeek Vision (v4 Flash)',
    provider: 'deepseek_vision',
    group: 'DeepSeek',
    category: 'cloud',
    isVisionCapable: true,
    description: 'Multimodal vision and diagram inspection engine.',
  },
  {
    id: 'ollama:qwen3:4b',
    name: 'ollama:qwen3:4b',
    displayName: 'Ollama: Qwen3:4b',
    provider: 'ollama',
    group: 'Ollama (Local)',
    category: 'local',
    description: 'Local on-premise model execution via Ollama.',
  },
  {
    id: 'ollama:qwen2.5:3b',
    name: 'ollama:qwen2.5:3b',
    displayName: 'Ollama: Qwen2.5:3b',
    provider: 'ollama',
    group: 'Ollama (Local)',
    category: 'local',
    description: 'Lightweight local model execution via Ollama.',
  },
  {
    id: 'ollama:custom',
    name: 'ollama:custom',
    displayName: 'Ollama: Custom...',
    provider: 'ollama',
    group: 'Ollama (Local)',
    category: 'local',
    description: 'User-specified local model name hosted on Ollama.',
  },
];

export interface ModelContextType {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  modelDetails: ModelResolution;
  isOllamaSelected: boolean;
  availableModels: ModelOption[];
  ollamaUrl: string;
  setOllamaUrl: (url: string) => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const MODEL_STORAGE_KEY = 'fire_keeper_selected_model';

export const ModelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedModel, setSelectedModelState] = useState<string>(() => {
    try {
      const saved = safeLocalStorage.getItem(MODEL_STORAGE_KEY);
      if (saved && saved.trim()) return saved.trim();
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
  };

  useEffect(() => {
    try {
      safeLocalStorage.setItem(MODEL_STORAGE_KEY, selectedModel);
    } catch (e) {}
  }, [selectedModel]);

  const modelDetails = useMemo(() => {
    return resolveModelDetails(selectedModel);
  }, [selectedModel]);

  const isOllamaSelected = useMemo(() => {
    return selectedModel.startsWith('ollama:') || selectedModel.toLowerCase().includes('qwen');
  }, [selectedModel]);

  const value = useMemo<ModelContextType>(() => ({
    selectedModel,
    setSelectedModel,
    modelDetails,
    isOllamaSelected,
    availableModels: AVAILABLE_MODELS,
    ollamaUrl,
    setOllamaUrl,
  }), [selectedModel, modelDetails, isOllamaSelected, ollamaUrl]);

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
