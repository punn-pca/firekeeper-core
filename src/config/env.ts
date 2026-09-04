// Centralized Environment & App Configuration
export const APP_CONFIG = {
  APP_NAME: 'FIRE KEEPER',
  VERSION: '',
  SUBTITLE: 'PUNN Cognitive Architecture (FIRE Engine)',
  API_BASE_URL: '/api',
  DEFAULT_LANGUAGE: 'th' as const,
  TOKEN_KEY: 'fire_keeper_auth_token',
  USER_KEY: 'fire_keeper_user',
  CONVERSATIONS_KEY: 'fire_keeper_conversations',
  CURRENT_CONVERSATION_KEY: 'fire_keeper_current_conversation_id',
  OFFLINE_MODE_KEY: 'fire_keeper_offline_mode',
  OLLAMA_URL_KEY: 'fire_keeper_ollama_url',
  OLLAMA_DEFAULT_URL: 'http://127.0.0.1:11434',
  OLLAMA_DEFAULT_MODEL: 'qwen3:4b',
};
