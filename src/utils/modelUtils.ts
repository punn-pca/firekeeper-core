/**
 * FIRE KEEPER Runtime Model & Provider Resolution Utility
 * 
 * Strict Source-of-Truth Principle:
 * - Model and provider tags must strictly reflect the actual model/provider requested and executed at runtime.
 * - Zero hardcoded "deepseek-chat" fallbacks.
 * - Ollama models always resolve to `ollama:<model>` format (e.g., `ollama:qwen3:4b`, `ollama:llama3.2`).
 * - If model/provider is absent, fall back to "unknown" or "N/A".
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
 * - formatModelTag(undefined, undefined) -> "unknown"
 */
export function formatModelTag(rawModel?: string | null, rawProvider?: string | null): string {
  const model = (rawModel || '').trim();
  const provider = (rawProvider || '').toLowerCase().trim();

  if (!model && !provider) {
    return 'unknown';
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
    modelLower.startsWith('gemma')
  ) {
    const clean = model.replace(/^ollama:/i, '');
    return clean ? `ollama:${clean}` : (provider || 'ollama');
  }

  // 3. DeepSeek models
  if (modelLower.startsWith('deepseek')) {
    return model;
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

  return provider || 'unknown';
}

/**
 * Resolves the canonical provider from model name and/or explicit provider string.
 */
export function resolveProvider(rawModel?: string | null, rawProvider?: string | null): string {
  const provider = (rawProvider || '').toLowerCase().trim();
  if (provider && provider !== 'unknown' && provider !== 'n/a') {
    return provider;
  }

  const model = (rawModel || '').toLowerCase().trim();
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

  return model ? 'custom' : 'unknown';
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
  } else if (tag.startsWith('ollama:')) {
    displayName = `Ollama (${tag.replace(/^ollama:/i, '')})`;
  } else if (tag === 'unknown') {
    displayName = 'Unknown Model';
  }

  return {
    provider,
    model,
    tag,
    displayName,
    isLocal,
  };
}
