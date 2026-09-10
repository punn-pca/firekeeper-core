/**
 * FIRE KEEPER Runtime Model & Provider Resolution Utility
 * 
 * Strict Source-of-Truth Principle:
 * - Model and provider tags must strictly reflect the actual model/provider requested and executed at runtime.
 * - Zero hardcoded "deepseek-chat" fallbacks.
 * - Ollama models always resolve to `ollama:<model>` format (e.g., `ollama:qwen3:4b`, `ollama:llama3.2`).
 * - If model/provider is absent, fall back to "ollama:qwen3:4b" or selected local model.
 */

export interface ModelResolution {
  provider: string;
  model: string;
  tag: string;
  displayName: string;
  isLocal: boolean;
}

/**
 * Normalizes and builds the canonical Model/Provider tag.
 * E.g.:
 * - formatModelTag("ollama:qwen3:4b") -> "ollama:qwen3:4b"
 * - formatModelTag("qwen3:4b", "ollama") -> "ollama:qwen3:4b"
 * - formatModelTag("ollama:llama3.2") -> "ollama:llama3.2"
 * - formatModelTag("deepseek-chat", "deepseek") -> "deepseek-chat"
 * - formatModelTag("deepseek-reasoner", "deepseek") -> "deepseek-reasoner"
 * - formatModelTag("gemini-2.5-flash", "google") -> "google:gemini-2.5-flash"
 * - formatModelTag(undefined, undefined) -> "ollama:qwen3:4b"
 */
export function formatModelTag(rawModel?: string | null, rawProvider?: string | null): string {
  const model = (rawModel || '').trim();
  const provider = (rawProvider || '').toLowerCase().trim();

  if (!model && !provider) {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('fire_keeper_selected_model');
        if (stored) {
          return stored.startsWith('ollama:') ? stored : `ollama:${stored}`;
        }
      }
    } catch {}
    return 'ollama:qwen3:4b';
  }

  const modelLower = model.toLowerCase();

  // 1. If model already has ollama: prefix
  if (modelLower.startsWith('ollama:')) {
    return model;
  }

  // 2. If provider is ollama or model name indicates ollama/local
  if (
    provider === 'ollama' || 
    modelLower.startsWith('qwen') || 
    modelLower.startsWith('llama') || 
    modelLower.startsWith('mistral') ||
    modelLower.startsWith('phi') ||
    modelLower.startsWith('gemma') ||
    modelLower.includes('qwen') ||
    modelLower.includes('llama')
  ) {
    const clean = model.replace(/^ollama:/i, '').trim();
    return clean ? `ollama:${clean}` : 'ollama:qwen3:4b';
  }

  // 3. DeepSeek models
  if (modelLower.startsWith('deepseek')) {
    return model;
  }

  // 3.5. DeepSeek Vision provider
  if (provider === 'deepseek_vision' || provider === 'deepseek-vision') {
    return model || 'deepseek-v4-flash-vision-exp';
  }

  // 4. If provider is explicitly provided and distinct from model prefix
  if (provider && provider !== 'unknown' && provider !== 'n/a' && !modelLower.startsWith(`${provider}:`)) {
    if (model) {
      return `${provider}:${model}`;
    }
    return provider;
  }

  if (model) {
    return model;
  }

  return provider === 'ollama' ? 'ollama:qwen3:4b' : (provider || 'ollama:qwen3:4b');
}

/**
 * Resolves the canonical provider from model name and/or explicit provider string.
 */
export function resolveProvider(rawModel?: string | null, rawProvider?: string | null): string {
  const provider = (rawProvider || '').toLowerCase().trim();
  if (provider && provider !== 'unknown' && provider !== 'n/a') {
    if (provider === 'deepseek_vision' || provider === 'deepseek-vision') {
      return 'deepseek_vision';
    }
    return provider;
  }

  const model = (rawModel || '').toLowerCase().trim();
  if (model.includes('vision') || model.includes('deepseek-v4-flash-vision-exp')) {
    return 'deepseek_vision';
  }

  if (
    model.startsWith('ollama:') ||
    model.includes('qwen') ||
    model.includes('llama') ||
    model.includes('mistral') ||
    model.includes('local') ||
    model.includes('phi') ||
    model.includes('gemma')
  ) {
    return 'ollama';
  }

  if (model.includes('deepseek')) {
    return 'deepseek';
  }

  if (model.includes('gemini')) {
    return 'google';
  }

  if (model.includes('gpt') || model.includes('openai') || model.includes('o1') || model.includes('o3')) {
    return 'openai';
  }

  if (model.includes('claude') || model.includes('anthropic')) {
    return 'anthropic';
  }

  return model ? 'custom' : 'ollama';
}

/**
 * Fully resolves model details including display name and tag.
 */
export function resolveModelDetails(rawModel?: string | null, rawProvider?: string | null): ModelResolution {
  const provider = resolveProvider(rawModel, rawProvider);
  const tag = formatModelTag(rawModel, provider);
  const model = (rawModel || '').trim() || tag;
  const isLocal = provider === 'ollama';

  let displayName = tag;
  if (tag === 'deepseek-chat') {
    displayName = 'DeepSeek-V3';
  } else if (tag === 'deepseek-reasoner') {
    displayName = 'DeepSeek-R1';
  } else if (tag === 'deepseek-v4-flash-vision-exp' || tag.includes('vision')) {
    displayName = 'DeepSeek Vision (v4-flash)';
  } else if (tag.startsWith('ollama:')) {
    const modelPart = tag.replace(/^ollama:/i, '').trim();
    const modelLower = modelPart.toLowerCase();
    if (modelLower === 'qwen3:4b' || modelLower.includes('qwen3')) {
      displayName = 'Qwen3 4B';
    } else if (modelLower.includes('qwen')) {
      displayName = modelPart.toUpperCase().replace(':', ' ');
    } else if (modelLower.includes('llama')) {
      displayName = modelPart.replace(/[-:]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } else if (modelPart) {
      displayName = `Ollama (${modelPart})`;
    } else {
      displayName = 'Qwen3 4B';
    }
  } else if (tag === 'unknown' || !tag) {
    displayName = 'Qwen3 4B';
  }

  return {
    provider,
    model,
    tag,
    displayName,
    isLocal,
  };
}
