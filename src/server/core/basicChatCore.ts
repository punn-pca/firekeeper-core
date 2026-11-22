import { callUnifiedLlmContent } from '../services/unifiedLlm';
import type { ChatExecutor, ChatRequest, ChatResult, ChatTurn } from './chatTypes';
import { appendRetrievalCapability } from './chatCapabilities';

const GENERIC_OPENERS = new Set([
  'มีอะไรให้ช่วยไหม',
  'มีอะไรให้ผมช่วยไหม',
  'มีอะไรให้ช่วยได้บ้าง',
  'มีอะไรให้ผมช่วยได้บ้าง',
  'what can i help you with',
  'how can i help you',
  'how can i assist you',
]);

function cleanHistory(history: ChatTurn[]): ChatTurn[] {
  return history
    .filter((turn) => turn && (turn.role === 'user' || turn.role === 'assistant'))
    .map((turn) => ({ role: turn.role, content: String(turn.content || '').trim() }))
    .filter((turn) => turn.content)
    .slice(-12);
}

function normalizeGreeting(question: string, text: string): string {
  const q = question.trim().toLocaleLowerCase('th')
    .replace(/[.!！?？,，。…]+$/u, '')
    .replace(/\s+/g, ' ')
    .trim();

  const standaloneGreeting = /^(?:สวัสดี(?:ครับ|ค่ะ|คะ|จ้า|จ้ะ)?|หวัดดี(?:ครับ|ค่ะ|คะ|จ้า|จ้ะ)?|hello|hi|hey)$/i;
  if (standaloneGreeting.test(q)) return text.trim();

  return text.replace(
    /^\s*(?:สวัสดี(?:ครับ|ค่ะ|คะ|จ้า|จ้ะ)?|หวัดดี(?:ครับ|ค่ะ|คะ|จ้า|จ้ะ)?|hello|hi|hey)(?:[!！?？,，。…]+\s*|\s+)/iu,
    '',
  ).trimStart();
}

function isGenericOpener(text: string): boolean {
  const normalized = text.trim().toLocaleLowerCase('th')
    .replace(/[!?？。]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return GENERIC_OPENERS.has(normalized);
}

function buildMessages(history: ChatTurn[], question: string): ChatTurn[] {
  return [...cleanHistory(history), { role: 'user', content: question.trim() }];
}

const NORMAL_INSTRUCTION = [
  'NORMAL MODE.',
  'Answer the latest user request directly and naturally.',
  'Use the preceding conversation when the user refers to it.',
  'Keep the response proportional to the request.',
  'Do not invent context, goals, constraints, or intent.',
  'For short follow-ups, resolve the reference from the immediately preceding relevant turn.',
  'Do not replace a substantive answer with a generic greeting or an offer to help.',
  'Do not expose internal governance, PCA, taxonomy, audit, or routing metadata unless explicitly asked.',
].join('\n');

export async function executeBasicNormalChat(request: ChatRequest, callModel: typeof callUnifiedLlmContent = callUnifiedLlmContent): Promise<ChatResult> {
  const started = Date.now();
  const question = String(request.question || '').trim();

  if (!question) {
    throw new Error('EMPTY_QUESTION');
  }

  const history = cleanHistory(request.history || []);
  const effectiveQuestion = appendRetrievalCapability(question, request.retrieval);
  const messages = buildMessages(history, effectiveQuestion);

  let result = await callModel(messages, {
    provider: request.provider,
    model: request.model,
    systemInstruction: NORMAL_INSTRUCTION,
    skipSystemPrompt: false,
    apiKey: request.apiKey,
    baseUrl: request.baseUrl,
    ollamaBaseUrl: request.ollamaBaseUrl,
    signal: request.signal,
    maxOutputTokens: 1500,
  });

  let text = normalizeGreeting(question, result.text || '').trim();

  // One bounded repair is allowed when a substantive request receives only a
  // fresh-chat opener. This is a runtime integrity rule, not semantic tagging.
  if (question && isGenericOpener(text)) {
    const repairMessages = [
      ...messages.slice(0, -1),
      {
        role: 'user' as const,
        content: [
          'Answer the current user question now.',
          'The previous answer was only a generic help offer and did not answer the request.',
          'Do not greet. Do not ask what the user needs.',
          'CURRENT QUESTION:',
          question,
        ].join('\n'),
      },
    ];

    result = await callModel(repairMessages, {
      provider: request.provider,
      model: request.model,
      systemInstruction: NORMAL_INSTRUCTION,
      skipSystemPrompt: false,
      apiKey: request.apiKey,
      baseUrl: request.baseUrl,
      ollamaBaseUrl: request.ollamaBaseUrl,
      signal: request.signal,
      maxOutputTokens: 1500,
    });

    const repaired = normalizeGreeting(question, result.text || '').trim();
    if (repaired && !isGenericOpener(repaired)) text = repaired;
  }

  if (!text) {
    throw new Error('EMPTY_MODEL_RESPONSE');
  }

  return {
    mode: 'normal',
    text,
    provider: result.providerUsed || request.provider,
    model: result.modelUsed || request.model,
    usage: result.usage,
    durationMs: Date.now() - started,
  };
};

export async function executeBasicChat(request: ChatRequest): Promise<ChatResult> {
  if (request.mode === 'normal') {
    return executeBasicNormalChat(request);
  }

  throw new Error('GOVERNED_CORE_NOT_REBUILT_YET');
}
