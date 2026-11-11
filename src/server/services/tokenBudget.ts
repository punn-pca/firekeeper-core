/**
 * FIRE KEEPER global LLM token budget.
 * Hard ceiling: 5,000 estimated tokens per request.
 * Input/context: 3,500. Output/generation: 1,500.
 */
export const GLOBAL_LLM_TOTAL_TOKEN_BUDGET = 5000;
export const GLOBAL_LLM_OUTPUT_TOKEN_BUDGET = 1500;
export const GLOBAL_LLM_INPUT_TOKEN_BUDGET = 3500;

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
  }).join('\n');
  const images = messages.reduce((n, m) => {
    if (!Array.isArray(m.content)) return n;
    return n + m.content.filter((p: any) => p?.type === 'image_url' || p?.type === 'image').length;
  }, 0);
  return Math.ceil(text.length / 3) + images * 2048;
}

function trimTextToTokenBudget(text: string, maxTokens: number, keepTail = false): string {
  const maxChars = Math.max(0, Math.floor(maxTokens * 3));
  if (text.length <= maxChars) return text;
  return keepTail ? text.slice(-maxChars) : text.slice(0, maxChars);
}

/**
 * Removes old turns first. If system + latest user still exceed the hard
 * input budget, trims those two texts deterministically instead of throwing.
 */
export function fitMessagesToGlobalBudget<T extends BudgetMessage>(
  messages: T[],
  maxPromptTokens = GLOBAL_LLM_INPUT_TOKEN_BUDGET
): T[] {
  const fitted = [...messages];
  const latestUserIndex = [...fitted].map((m, i) => ({ m, i })).reverse().find(x => x.m.role === 'user')?.i;

  while (estimateBudgetTokens(fitted) > maxPromptTokens) {
    const removable = fitted.findIndex((m, i) =>
      m.role !== 'system' && i !== latestUserIndex
    );
    if (removable < 0) break;
    fitted.splice(removable, 1);
  }

  if (estimateBudgetTokens(fitted) <= maxPromptTokens) return fitted;

  const system = fitted.find(m => m.role === 'system');
  const latest = latestUserIndex === undefined ? undefined : fitted.find((m, i) => m.role === 'user' && i === latestUserIndex);
  if (!system && !latest) {
    return fitted.slice(-1);
  }

  const systemText = typeof system?.content === 'string' ? system.content : JSON.stringify(system?.content || '');
  const latestText = typeof latest?.content === 'string' ? latest.content : JSON.stringify(latest?.content || '');
  const fixedImageTokens = estimateBudgetTokens(fitted) - Math.ceil((systemText.length + latestText.length) / 3);
  const availableTextTokens = Math.max(1, maxPromptTokens - fixedImageTokens);
  const systemBudget = Math.floor(availableTextTokens * 0.55);
  const latestBudget = Math.max(1, availableTextTokens - systemBudget);

  if (system) system.content = trimTextToTokenBudget(systemText, systemBudget, false);
  if (latest) latest.content = trimTextToTokenBudget(latestText, latestBudget, true);

  while (estimateBudgetTokens(fitted) > maxPromptTokens) {
    const last = fitted[fitted.length - 1];
    if (last && last !== latest && last.role !== 'system') fitted.pop();
    else break;
  }
  return fitted;
}
