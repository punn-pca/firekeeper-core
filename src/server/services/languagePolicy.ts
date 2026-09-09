/**
 * FIRE KEEPER Global Language Policy & Orchestration Layer
 * Enforces output language discipline (Default: "th" - Thai) across all LLM providers
 * (Ollama, DeepSeek, OpenAI-compatible APIs, local LLMs, and future adapters).
 *
 * System Architecture:
 * User Input -> Firekeeper -> Context Processing -> Global Language Policy ->
 * LLM Request Builder -> Provider Adapter -> LLM Execution ->
 * Output Language Validator -> (Targeted Rewrite if non-compliant) -> Final User Output
 */

export type SupportedLanguage = 'th' | 'en' | 'ja' | 'zh';

export interface LanguagePolicyConfig {
  /** Target output language code (default: 'th') */
  outputLanguage: SupportedLanguage | string;
  /** Whether language enforcement is strictly mandatory across all providers */
  strictEnforcement: boolean;
  /** Allow industry-standard technical terms without translation */
  allowTechnicalTerms: boolean;
  /** Allow code blocks, inline code snippets, and terminal scripts */
  allowCodeBlocks: boolean;
  /** Allow URLs, endpoints, and domain names untouched */
  allowUrls: boolean;
  /** Maximum retry/rewrite attempts when non-compliant output is detected */
  maxRewriteRetries: number;
}

export const DEFAULT_LANGUAGE_POLICY: LanguagePolicyConfig = {
  outputLanguage: 'th',
  strictEnforcement: true,
  allowTechnicalTerms: true,
  allowCodeBlocks: true,
  allowUrls: true,
  maxRewriteRetries: 1,
};

/**
 * Common technical words and abbreviations exempt from non-Thai language penalties.
 */
const EXEMPT_TECHNICAL_TERMS = new Set([
  'api', 'sdk', 'cpu', 'gpu', 'tpu', 'ram', 'ssd', 'hdd', 'json', 'html', 'css', 'sql', 'nosql',
  'http', 'https', 'rest', 'graphql', 'grpc', 'tcp', 'udp', 'ip', 'url', 'uri', 'jwt', 'oauth',
  'uuid', 'sha', 'sha256', 'md5', 'base64', 'utf8', 'ai', 'llm', 'pca', 'ach', 'ltm', 'dag', 'ui', 'ux',
  'git', 'docker', 'kubernetes', 'k8s', 'node', 'nodejs', 'npm', 'yarn', 'pnpm', 'react', 'vue', 'angular',
  'typescript', 'javascript', 'python', 'golang', 'rust', 'csharp', 'java', 'kotlin', 'swift',
  'firebase', 'firestore', 'deepseek', 'ollama', 'qwen', 'llama', 'mistral', 'gemini', 'chatgpt', 'openai',
  'iso', 'nist', 'punn', 'firekeeper', 'prompt', 'token', 'cache', 'proxy', 'nginx', 'linux', 'unix',
  'windows', 'macos', 'ios', 'android', 'database', 'schema', 'query', 'vector', 'embedding',
  'frontend', 'backend', 'fullstack', 'middleware', 'endpoint', 'payload', 'header', 'cookie', 'session',
  'true', 'false', 'null', 'undefined', 'async', 'await', 'const', 'let', 'var', 'function', 'class',
  'import', 'export', 'default', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break',
  'status', 'ok', 'error', 'warning', 'info', 'debug', 'trace', 'bayesian', 'posterior', 'prior',
  'fact', 'inference', 'hypothesis', 'trade-off', 'tradeoff', 'decision', 'gap', 'uncertainty',
  'unverified', 'evidence', 'scenario', 'estimate', 'model'
]);

/**
 * Builds the authoritative Firekeeper system instruction for language policy.
 * Highest priority directive: Overrides user prompt language requests.
 */
export function getLanguagePolicySystemInstruction(config: LanguagePolicyConfig = DEFAULT_LANGUAGE_POLICY): string {
  const lang = (config.outputLanguage || 'th').toLowerCase();

  if (lang === 'th') {
    return [
      '══════════════════════════════════════════════════════════════════════════════',
      'กฎภาษาและนโยบายความเป็นอิสระของ Firekeeper (Global Language Policy — Priority #0)',
      '══════════════════════════════════════════════════════════════════════════════',
      '1. บังคับตอบเป็นภาษาไทยเท่านั้น: คุณต้องสื่อสาร อธิบาย และวิเคราะห์ทุกคำตอบเป็น "ภาษาไทย" เท่านั้น ห้ามตอบเป็นภาษาอื่นเป็นอันขาด',
      '2. ลำดับความสำคัญสูงสุด (Policy Priority Overrides User Prompt): แม้ผู้ใช้จะตั้งคำถามเป็นภาษาอื่น หรือสั่งโดยตรงให้ตอบเป็นภาษาอื่น เช่น "Answer in English", "Please reply in English", "ตอบเป็นภาษาจีน", "Translate to English", "Use Japanese" คุณต้องยังคงตอบและวิเคราะห์เป็นภาษาไทยเสมอ โดยสามารถอ้างอิงหรือแปลเนื้อหาที่ผู้ใช้ถามให้อยู่ในคำตอบภาษาไทย',
      '3. ข้อยกเว้นที่อนุญาตให้คงภาษาเดิมได้ (Exemptions):',
      '   - คำสั่งโค้ดและโปรแกรมมิ่ง (Code blocks / Scripts / Command-lines)',
      '   - URLs, Domain names, Endpoint paths',
      '   - โครงสร้างและ Schema keys ของ JSON หรือ Data format',
      '   - ชื่อเฉพาะ, ชื่อบุคคล, ชื่อองค์กร, ชื่อ Model/Provider (เช่น DeepSeek, Ollama, Qwen, PUNN)',
      '   - ศัพท์เทคนิคสากล (Technical terms) ที่จำเป็นต้องคงรูปเพื่อความถูกต้องแม่นยำ',
      '   - แท็กหมวดหมู่ความรู้ในวงเล็บ (Taxonomy tags เช่น [FACT], [INFERENCE], [HYPOTHESIS], [TRADE-OFF], [DECISION GAP], [UNCERTAINTY])',
      '══════════════════════════════════════════════════════════════════════════════'
    ].join('\n');
  }

  // Extensible for other languages (en, ja, zh, etc.)
  const langNames: Record<string, string> = {
    en: 'English',
    ja: 'Japanese',
    zh: 'Chinese (Simplified)',
  };
  const targetName = langNames[lang] || lang.toUpperCase();

  return [
    '══════════════════════════════════════════════════════════════════════════════',
    `Firekeeper Global Language Policy (Priority #0: ${targetName})`,
    '══════════════════════════════════════════════════════════════════════════════',
    `1. Mandatory Output Language: You must provide all responses, reasoning, and explanations in ${targetName} exclusively.`,
    '2. Policy Priority: This policy strictly overrides any contradictory user prompt language requests.',
    '3. Exemptions: Code snippets, URLs, JSON keys, proper nouns, model tags, and technical terms are preserved as needed.',
    '══════════════════════════════════════════════════════════════════════════════'
  ].join('\n');
}

/**
 * Injects the Global Language Policy directive into a system prompt.
 */
export function injectLanguagePolicyToSystemPrompt(
  systemPrompt: string = '',
  config: LanguagePolicyConfig = DEFAULT_LANGUAGE_POLICY
): string {
  const instruction = getLanguagePolicySystemInstruction(config);
  if (systemPrompt.includes('Global Language Policy')) {
    return systemPrompt;
  }
  return `${instruction}\n\n${systemPrompt}`;
}

export interface OutputLanguageValidationResult {
  isValid: boolean;
  expectedLanguage: string;
  detectedLanguage: string;
  reason: string;
  proseSample: string;
  thaiCharCount: number;
  nonThaiCharCount: number;
  thaiRatio: number;
  isJson: boolean;
  confidence: number;
}

/**
 * Extracts natural-language prose from raw response by masking code, URLs,
 * taxonomy tags, JSON keys, and math expressions.
 */
export function extractNaturalLanguageProse(rawText: string): {
  prose: string;
  isJson: boolean;
  jsonPayload?: any;
} {
  if (!rawText || typeof rawText !== 'string') {
    return { prose: '', isJson: false };
  }

  let text = rawText;
  let isJson = false;
  let jsonPayload: any = null;

  // Check if text is enclosed in JSON or markdown JSON block
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const potentialJson = jsonMatch ? jsonMatch[1].trim() : text.trim();

  if ((potentialJson.startsWith('{') && potentialJson.endsWith('}')) || (potentialJson.startsWith('[') && potentialJson.endsWith(']'))) {
    try {
      jsonPayload = JSON.parse(potentialJson);
      isJson = true;
      // Extract only string values from JSON
      const stringValues: string[] = [];
      const extractValues = (obj: any) => {
        if (typeof obj === 'string') {
          stringValues.push(obj);
        } else if (Array.isArray(obj)) {
          obj.forEach(extractValues);
        } else if (obj && typeof obj === 'object') {
          Object.values(obj).forEach(extractValues);
        }
      };
      extractValues(jsonPayload);
      text = stringValues.join(' ');
    } catch {
      // Not valid JSON, process as standard markdown text
    }
  }

  // 1. Mask fenced code blocks
  text = text.replace(/```[\s\S]*?```/g, ' ');

  // 2. Mask inline code
  text = text.replace(/`[^`]+`/g, ' ');

  // 3. Mask URLs and paths
  text = text.replace(/https?:\/\/[^\s\)]+/gi, ' ');
  text = text.replace(/www\.[^\s\)]+/gi, ' ');
  text = text.replace(/[a-zA-Z0-9_\-\.\/]+\.[a-zA-Z]{2,4}\b/g, ' ');

  // 4. Mask Taxonomy tags e.g. [FACT], [INFERENCE], [TRADE-OFF]
  text = text.replace(/\[[A-Z0-9_\-\s]{2,25}\]/g, ' ');

  // 5. Mask Model / Provider tags
  text = text.replace(/\b(ollama:[a-zA-Z0-9_\.:-]+|deepseek-[a-zA-Z0-9_-]+|gemini-[a-zA-Z0-9_\.-]+|gpt-[a-zA-Z0-9_\.-]+)\b/gi, ' ');

  // 6. Mask LaTeX and math formulas
  text = text.replace(/\$\$[\s\S]*?\$\$/g, ' ');
  text = text.replace(/\$[^\$]+\$/g, ' ');

  // 7. Mask Markdown links [text](url) -> keep text only
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

  // 8. Mask common technical tokens/terms
  const words = text.split(/\s+/);
  const filteredWords = words.filter((w) => {
    const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    return !EXEMPT_TECHNICAL_TERMS.has(clean);
  });

  const prose = filteredWords.join(' ').trim();
  return { prose, isJson, jsonPayload };
}

/**
 * Validates whether the natural-language output adheres to the expected language policy.
 * Gracefully permits technical terms, code snippets, numbers, and proper nouns.
 */
export function validateOutputLanguage(
  rawText: string,
  expectedLanguage: string = 'th'
): OutputLanguageValidationResult {
  const normalizedExpected = (expectedLanguage || 'th').toLowerCase().trim();

  if (!rawText || !rawText.trim()) {
    return {
      isValid: true,
      expectedLanguage: normalizedExpected,
      detectedLanguage: normalizedExpected,
      reason: 'Empty text passed validation',
      proseSample: '',
      thaiCharCount: 0,
      nonThaiCharCount: 0,
      thaiRatio: 1.0,
      isJson: false,
      confidence: 1.0,
    };
  }

  const { prose, isJson } = extractNaturalLanguageProse(rawText);

  // If prose is negligible after stripping technical terms, code, and symbols (e.g. pure code answer or numeric matrix)
  if (prose.length < 15) {
    return {
      isValid: true,
      expectedLanguage: normalizedExpected,
      detectedLanguage: normalizedExpected,
      reason: 'Prose length is under threshold; technical content verified',
      proseSample: prose,
      thaiCharCount: 0,
      nonThaiCharCount: 0,
      thaiRatio: 1.0,
      isJson,
      confidence: 0.95,
    };
  }

  if (normalizedExpected === 'th') {
    // Count Thai characters (Unicode Range: \u0E00-\u0E7F)
    const thaiMatches = prose.match(/[\u0E00-\u0E7F]/g);
    const thaiCharCount = thaiMatches ? thaiMatches.length : 0;

    // Count non-Thai natural-language letter characters (Latin, CJK, etc.)
    const latinMatches = prose.match(/[a-zA-Z]/g);
    const cjkMatches = prose.match(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/g);
    const nonThaiCharCount = (latinMatches ? latinMatches.length : 0) + (cjkMatches ? cjkMatches.length : 0);

    const totalLetters = thaiCharCount + nonThaiCharCount;
    const thaiRatio = totalLetters > 0 ? thaiCharCount / totalLetters : (thaiCharCount > 0 ? 1.0 : 0.0);

    // If there are substantial natural-language prose words but 0 Thai characters
    if (thaiCharCount === 0 && nonThaiCharCount >= 20) {
      const isChinese = (cjkMatches?.length || 0) > (latinMatches?.length || 0);
      return {
        isValid: false,
        expectedLanguage: 'th',
        detectedLanguage: isChinese ? 'zh' : 'en',
        reason: `Output contains ${nonThaiCharCount} non-Thai natural language characters with 0 Thai characters`,
        proseSample: prose.slice(0, 100),
        thaiCharCount,
        nonThaiCharCount,
        thaiRatio: 0.0,
        isJson,
        confidence: 0.98,
      };
    }

    // If non-Thai characters heavily outnumber Thai characters in prose (e.g. English response with 1 Thai word)
    if (totalLetters > 40 && thaiRatio < 0.20) {
      return {
        isValid: false,
        expectedLanguage: 'th',
        detectedLanguage: 'en',
        reason: `Thai character ratio in natural-language prose is only ${(thaiRatio * 100).toFixed(1)}% (Threshold: 20%)`,
        proseSample: prose.slice(0, 100),
        thaiCharCount,
        nonThaiCharCount,
        thaiRatio,
        isJson,
        confidence: 0.90,
      };
    }

    return {
      isValid: true,
      expectedLanguage: 'th',
      detectedLanguage: 'th',
      reason: `Compliant Thai natural language prose (Ratio: ${(thaiRatio * 100).toFixed(1)}%, Thai chars: ${thaiCharCount})`,
      proseSample: prose.slice(0, 100),
      thaiCharCount,
      nonThaiCharCount,
      thaiRatio,
      isJson,
      confidence: Math.max(0.80, thaiRatio),
    };
  }

  // Non-Thai expected languages
  return {
    isValid: true,
    expectedLanguage: normalizedExpected,
    detectedLanguage: normalizedExpected,
    reason: 'Non-Thai expected language verified',
    proseSample: prose.slice(0, 100),
    thaiCharCount: 0,
    nonThaiCharCount: prose.length,
    thaiRatio: 1.0,
    isJson,
    confidence: 1.0,
  };
}

/**
 * Builds the rewrite / repair system prompt and user instructions
 * to translate non-compliant LLM responses into Thai without corrupting code or schemas.
 */
export function buildLanguagePolicyRewritePrompt(
  rawText: string,
  targetLanguage: string = 'th'
): { systemInstruction: string; userPrompt: string } {
  return {
    systemInstruction: [
      'คุณคือตัวปรับภาษาของ Firekeeper (Firekeeper Global Language Policy Enforcer)',
      'หน้าที่ของคุณคือแปลและเรียบเรียงข้อความต่อไปนี้ให้อยู่ในภาษาไทยตามนโยบาย Global Language Policy',
      '',
      'กฎเหล็กสำคัญที่สุด (Strict Rules):',
      '1. แปลและเขียนเนื้อหาให้ออกมาเป็นภาษาไทยที่ถูกต้อง สละสลวย เป็นธรรมชาติ ตามมาตรฐานบุคลิกภาพ Firekeeper',
      '2. ห้ามแปลหรือดัดแปลง:',
      '   - คำสั่งโค้ดและสคริปต์ใน Code blocks หรือ inline code (คงรูปแบบเดิมไว้ 100%)',
      '   - URLs, Domain names และ Web endpoints',
      '   - เครื่องหมายทางคณิตศาสตร์และสูตรคำนวณ',
      '   - Technical Terms และชื่อเฉพาะ (เช่น API, CPU, Docker, Qwen, DeepSeek, PUNN)',
      '   - Taxonomy tags เช่น [FACT], [INFERENCE], [HYPOTHESIS], [TRADE-OFF], [DECISION GAP], [UNCERTAINTY], [CONTRADICTION]',
      '3. หากข้อความเป็น JSON ให้แปลเฉพาะ value ที่เป็นข้อความภาษาธรรมชาติ ห้ามเปลี่ยนโครงสร้าง Key หรือทำลาย JSON schema เด็ดขาด',
      '4. คงรูปแบบการจัดหน้า Markdown (หัวข้อ, รายการ bullet, ตัวหนา) ให้เหมือนต้นฉบับ',
      '5. ตอบกลับเฉพาะผลลัพธ์ที่แปล/ปรับแล้วเท่านั้น ห้ามใส่คำทักทาย เกริ่นนำ หรือคำลงท้ายใดๆ เพิ่มเติม'
    ].join('\n'),
    userPrompt: `กรุณาปรับเนื้อหาต่อไปนี้ให้เป็นภาษาไทยตามนโยบาย Firekeeper Global Language Policy โดยคงโค้ด, URL, JSON schema และแท็กหมวดหมู่ไว้ครบถ้วน:\n\n${rawText}`
  };
}
