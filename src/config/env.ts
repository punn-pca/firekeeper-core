// Centralized Environment & App Configuration
export const APP_CONFIG = {
  APP_NAME: 'FIRE KEEPER',
  VERSION: '',
  SUBTITLE: 'PUNN Cognitive Architecture (FIRE Engine)',
  API_BASE_URL: '/api',
  DEFAULT_LANGUAGE: 'th' as const,
  TOKEN_KEY: 'fire_keeper_auth_token',
  USER_KEY: 'fire_keeper_user',
  OFFLINE_MODE_KEY: 'fire_keeper_offline_mode',
  OLLAMA_URL_KEY: 'fire_keeper_ollama_url',
  OLLAMA_DEFAULT_URL: 'https://ollama.firekeeper.site',
  OLLAMA_DEFAULT_MODEL: 'qwen3:4b',
};
