/**
 * FIRE KEEPER Runtime Model & Provider Resolution Utility
 * 
 * Strict Source-of-Truth Principle:
 * - Model and provider tags must strictly reflect the actual model/provider requested and executed at runtime.
 * - DeepSeek and Ollama are fully supported by default.
 * - Supports custom user API providers: OpenAI, Anthropic, Gemini, Groq, OpenRouter, Mistral, Perplexity, Custom.
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
 */
export function formatModelTag(rawModel?: string | null, rawProvider?: string | null): string {
  const model = (rawModel || '').trim();
  const provider = (rawProvider || '').toLowerCase().trim();

  if (!model && !provider) {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('fire_keeper_selected_model');
        if (stored && stored.trim()) {
          return stored.trim();
        }
      }
    } catch {}
    return 'deepseek-chat';
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
    modelLower.startsWith('mistral-local') ||
    modelLower.startsWith('phi') ||
    modelLower.startsWith('gemma')
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

  // 4. If provider is explicitly provided
  if (provider && provider !== 'unknown' && provider !== 'n/a' && !modelLower.startsWith(`${provider}:`)) {
    if (model) {
      return model;
    }
    return provider;
  }

  if (model) {
    return model;
  }

  return provider === 'ollama' ? 'ollama:qwen3:4b' : (provider || 'deepseek-chat');
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
    model.includes('qwen')
  ) {
    return 'ollama';
  }

  if (model.includes('deepseek')) {
    return 'deepseek';
  }

  if (model.includes('gemini')) {
    return 'gemini';
  }

  if (model.includes('gpt') || model.includes('openai') || model.startsWith('o1') || model.startsWith('o3')) {
    return 'openai';
  }

  if (model.includes('claude') || model.includes('anthropic')) {
    return 'anthropic';
  }

  if (model.includes('groq')) {
    return 'groq';
  }

  if (model.includes('openrouter')) {
    return 'openrouter';
  }

  if (model.includes('mistral') || model.includes('codestral')) {
    return 'mistral';
  }

  if (model.includes('sonar') || model.includes('perplexity')) {
    return 'perplexity';
  }

  return model ? 'custom' : 'deepseek';
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
  const tagLower = tag.toLowerCase();

  // DeepSeek
  if (tagLower === 'deepseek-chat' || tagLower.includes('deepseek-chat') || tagLower === 'deepseek-v3' || tagLower === 'deepseek_chat' || tagLower === 'deepseek') {
    displayName = 'DeepSeek-V3';
  } else if (tagLower === 'deepseek-reasoner' || tagLower.includes('deepseek-reasoner') || tagLower.includes('deepseek-r1') || tagLower === 'deepseek_reasoner') {
    displayName = 'DeepSeek-R1';
  } else if (tagLower === 'deepseek-v4-flash-vision-exp' || tagLower.includes('vision') || tagLower.includes('deepseek-vision')) {
    displayName = 'DeepSeek Vision';
  } 
  // Ollama
  else if (tag.startsWith('ollama:')) {
    const modelPart = tag.replace(/^ollama:/i, '').trim();
    const modelLower = modelPart.toLowerCase();
    if (modelLower === 'qwen3:4b' || modelLower.includes('qwen3')) {
      displayName = 'Qwen3 4B';
    } else if (modelLower.includes('qwen2.5')) {
      displayName = 'Qwen2.5 3B';
    } else if (modelLower.includes('qwen')) {
      displayName = modelPart.toUpperCase().replace(':', ' ');
    } else if (modelLower.includes('llama')) {
      displayName = modelPart.replace(/[-:]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } else if (modelPart) {
      displayName = `Ollama (${modelPart})`;
    } else {
      displayName = 'Qwen3 4B';
    }
  }
  // OpenAI
  else if (tagLower.includes('gpt-4o-mini')) {
    displayName = 'GPT-4o Mini';
  } else if (tagLower.includes('gpt-4o')) {
    displayName = 'GPT-4o';
  } else if (tagLower === 'o1' || tagLower.includes('o1-preview') || tagLower.includes('o1-mini')) {
    displayName = 'OpenAI o1';
  } else if (tagLower.includes('o3-mini')) {
    displayName = 'OpenAI o3-mini';
  }
  // Anthropic
  else if (tagLower.includes('claude-3-7') || tagLower.includes('claude-3.7')) {
    displayName = 'Claude 3.7 Sonnet';
  } else if (tagLower.includes('claude-3-5') || tagLower.includes('claude-3.5')) {
    displayName = 'Claude 3.5 Sonnet';
  } else if (tagLower.includes('claude-3-haiku') || tagLower.includes('claude-3.5-haiku')) {
    displayName = 'Claude 3.5 Haiku';
  }
  // Gemini
  else if (tagLower.includes('gemini-3.8') || tagLower.includes('3.8-flash')) {
    displayName = 'Gemini 3.8 Flash';
  } else if (tagLower.includes('gemini-3.7') || tagLower.includes('3.7-flash')) {
    displayName = 'Gemini 3.7 Flash';
  } else if (tagLower.includes('gemini-3.1-pro') || tagLower.includes('3.1-pro')) {
    displayName = 'Gemini 3.1 Pro';
  } else if (tagLower.includes('gemini-3.1-flash-lite') || tagLower.includes('flash-lite')) {
    displayName = 'Gemini 3.1 Flash Lite';
  } else if (tagLower.includes('gemini-flash-latest')) {
    displayName = 'Gemini Flash Latest';
  } else if (tagLower.includes('gemini-2.5-pro')) {
    displayName = 'Gemini 3.1 Pro (Migrated)';
  } else if (tagLower.includes('gemini-2.5-flash') || tagLower.includes('gemini-2.0-flash')) {
    displayName = 'Gemini 3.8 Flash (Migrated)';
  } else if (tagLower.includes('gemini')) {
    displayName = 'Google Gemini';
  }
  // Groq
  else if (provider === 'groq') {
    displayName = `Groq (${tag})`;
  }
  // OpenRouter
  else if (provider === 'openrouter') {
    displayName = `OpenRouter (${tag})`;
  }
  // Mistral
  else if (tagLower.includes('mistral-large')) {
    displayName = 'Mistral Large';
  } else if (tagLower.includes('mistral-small')) {
    displayName = 'Mistral Small';
  } else if (tagLower.includes('codestral')) {
    displayName = 'Codestral';
  }
  // Perplexity
  else if (tagLower.includes('sonar-pro')) {
    displayName = 'Sonar Pro';
  } else if (tagLower.includes('sonar-reasoning')) {
    displayName = 'Sonar Reasoning';
  } else if (tagLower.includes('sonar')) {
    displayName = 'Sonar';
  }
  // Custom
  else if (provider === 'custom' || provider === 'Custom API') {
    displayName = `Custom: ${tag || 'LLM'}`;
  } else if (tag === 'unknown' || !tag) {
    displayName = 'DeepSeek-V3';
  }

  return {
    provider,
    model,
    tag,
    displayName,
    isLocal,
  };
}
