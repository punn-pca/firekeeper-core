/**
 * FIREKEEPER limits only the prompt sent into the model.
 * Generated output has no shared application-level token cap.
 */
export const GLOBAL_LLM_INPUT_TOKEN_BUDGET = 2500;
/** @deprecated Output is intentionally uncapped; retained for compatibility only. */
export const GLOBAL_LLM_OUTPUT_TOKEN_BUDGET = Number.MAX_SAFE_INTEGER;
/** @deprecated This is an input-only budget, not a prompt+completion total. */
export const GLOBAL_LLM_TOTAL_TOKEN_BUDGET = GLOBAL_LLM_INPUT_TOKEN_BUDGET;

export type BudgetMessage = {
  role?: string;
  content?: any;
};

export function estimateBudgetTokens(messages: BudgetMessage[]): number {
  const text = messages.map((m) => {
    if (typeof m.content === 'string') return `${m.role || 'user'}: ${m.content}`;
    if (Array.isArray(m.content)) {
      return `${m.role || 'user'}: ${m.content.map((p: any) => {
        if (p?.type === 'image_url' || p?.type === 'image') return '[image input]';
        return typeof p?.text === 'string' ? p.text : JSON.stringify(p);
      }).join(' ')}`;
    }
    return `${m.role || 'user'}: ${JSON.stringify(m.content)}`;
  }).join('\\n');

  const images = messages.reduce((n, m) => {
    if (!Array.isArray(m.content)) return n;
    return n + m.content.filter((p: any) => p?.type === 'image_url' || p?.type === 'image').length;
  }, 0);

  // Image payload bytes/base64 are deliberately not counted as text tokens.
  // Reserve a fixed multimodal budget per image.
  return Math.ceil(text.length / 3) + images * 2048;
}

function trimTextToTokenBudget(text: string, maxTokens: number, keepTail = false): string {
  const maxChars = Math.max(0, Math.floor(maxTokens * 3));
  if (text.length <= maxChars) return text;
  return keepTail ? text.slice(-maxChars) : text.slice(0, maxChars);
}

/**
 * Fit every provider's final message array before dispatch.
 * Priority: keep the system contract, keep the latest user request,
 * remove old turns first, then trim system text and finally latest text
 * only if absolutely necessary.
 */
export function fitMessagesToGlobalBudget<T extends BudgetMessage>(
  messages: T[],
  maxPromptTokens = GLOBAL_LLM_INPUT_TOKEN_BUDGET
): T[] {
  const fitted = messages.map((m) => ({ ...m })) as T[];
  const latestUserIndex = [...fitted].map((m, i) => ({ m, i }))
    .reverse()
    .find(x => x.m.role === 'user')?.i;

  while (estimateBudgetTokens(fitted) > maxPromptTokens) {
    const removable = fitted.findIndex((m, i) =>
      m.role !== 'system' && i !== latestUserIndex
    );
    if (removable < 0) break;
    fitted.splice(removable, 1);
  }

  if (estimateBudgetTokens(fitted) <= maxPromptTokens) return fitted;

  const system = fitted.find(m => m.role === 'system');
  const latest = latestUserIndex === undefined
    ? undefined
    : fitted.find((m, i) => m.role === 'user' && i === latestUserIndex);

  if (!system && !latest) return fitted.slice(-1);

  const systemText = typeof system?.content === 'string'
    ? system.content
    : JSON.stringify(system?.content || '');
  const latestText = typeof latest?.content === 'string'
    ? latest.content
    : JSON.stringify(latest?.content || '');

  const fixedImageTokens = estimateBudgetTokens(fitted)
    - Math.ceil((systemText.length + latestText.length) / 3);

  const availableTextTokens = Math.max(1, maxPromptTokens - fixedImageTokens);
  const systemBudget = Math.max(1, Math.floor(availableTextTokens * 0.45));
  const latestBudget = Math.max(1, availableTextTokens - systemBudget);

  if (system) system.content = trimTextToTokenBudget(systemText, systemBudget, false);
  if (latest) latest.content = trimTextToTokenBudget(latestText, latestBudget, true);

  while (estimateBudgetTokens(fitted) > maxPromptTokens) {
    const removable = fitted.findIndex((m, i) =>
      m !== latest && m !== system && i !== latestUserIndex
    );
    if (removable >= 0) {
      fitted.splice(removable, 1);
      continue;
    }
    break;
  }

  return fitted;
}
