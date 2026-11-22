export type ChatMode = 'normal' | 'governed';

export type ChatRetrievalCapability = {
  source: 'web';
  context: string;
};

export type ChatTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatRequest = {
  mode: ChatMode;
  question: string;
  history: ChatTurn[];
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  ollamaBaseUrl?: string;
  signal?: AbortSignal;
  retrieval?: ChatRetrievalCapability;
};

export type ChatResult = {
  mode: ChatMode;
  text: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  durationMs: number;
};

export type ChatExecutor = (request: ChatRequest) => Promise<ChatResult>;
