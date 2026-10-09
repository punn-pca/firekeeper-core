import { 
  DEFAULT_LANGUAGE_POLICY,
  getLanguagePolicySystemInstruction,
  extractNaturalLanguageProse,
  validateOutputLanguage,
  buildLanguagePolicyRewritePrompt,
  injectLanguagePolicyToSystemPrompt
} from '../src/server/services/languagePolicy';
import { buildOptimizedSystemPrompt } from '../src/server/services/promptOptimizer';
import { buildGovernedPromptPackage } from '../src/server/services/governedPrompt';
import { buildDeepSeekMessages } from '../src/server/services/ai';
import { buildOllamaMessages } from '../src/server/services/ollama';

function runTests() {
  console.log('=== TEST SUITE: Global Language Policy (Firekeeper) ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // 1. Default Configuration
  assert(DEFAULT_LANGUAGE_POLICY.outputLanguage === 'auto', 'Default output language is adaptive (auto)');
  assert(DEFAULT_LANGUAGE_POLICY.strictEnforcement === true, 'Strict enforcement is enabled by default');

  // 2. System Instruction Construction
  const sysInstruction = getLanguagePolicySystemInstruction(DEFAULT_LANGUAGE_POLICY);
  assert(sysInstruction.includes('LANGUAGE POLICY (PCA v3.0 Adaptive Language Directive)'), 'System instruction has authoritative PCA v3.0 language header');
  assert(sysInstruction.includes("Respond in the user's current language"), 'System instruction defaults to user language');
  assert(sysInstruction.includes('User Explicit Instruction (P2)'), 'System instruction recognizes P2 user explicit language preference');

  // 3. Natural Language Prose Extraction & Exemption
  const codeText = `นี่คือตัวอย่างโค้ด TypeScript สำหรับเชื่อมต่อ API:
\`\`\`typescript
import express from "express";
const app = express();
app.get("/api/data", (req, res) => {
  res.json({ message: "Hello World", status: 200 });
});
\`\`\`
โค้ดด้านบนใช้ Express ในการสร้าง API Endpoint สำหรับส่งข้อมูลกลับไปยังผู้ใช้`;

  const { prose: extractedProse } = extractNaturalLanguageProse(codeText);
  assert(!extractedProse.includes('import express'), 'Code block inside backticks is removed from prose extraction');
  assert(extractedProse.includes('นี่คือตัวอย่างโค้ด'), 'Thai natural language prose outside backticks is preserved');

  // 4. Validation on Thai Text with Technical Terms
  const validThaiResponse = `[FACT] Firekeeper ประมวลผลคำขอผ่านโมเดล ollama:qwen3:4b โดยเชื่อมต่อกับ Endpoint http://localhost:11434 สำเร็จ
[INFERENCE] ระบบใช้สถาปัตยกรรม PCA v3.0 เพื่อกำกับความถูกต้องของข้อมูล`;
  const valResult1 = validateOutputLanguage(validThaiResponse, 'th');
  assert(valResult1.isValid, 'Thai text with model tags, URLs, and taxonomy tags is valid Thai');

  // 5. Validation on English-only Response (Violation)
  const englishResponse = `Firekeeper is an AI architecture created by PUNN. It provides strategic decision support and epistemic reasoning capabilities.`;
  const valResult2 = validateOutputLanguage(englishResponse, 'th');
  assert(!valResult2.isValid, 'Pure English response is flagged as invalid (violates policy)');
  assert(valResult2.thaiRatio < 0.1, 'English response has near-zero Thai character ratio');

  // 6. Validation on Chinese Response (Violation)
  const chineseResponse = `Firekeeper是由PUNN创建的AI认知架构系统，旨在提供战略决策支持和严谨的知识治理。`;
  const valResult3 = validateOutputLanguage(chineseResponse, 'th');
  assert(!valResult3.isValid, 'Chinese response is flagged as invalid (violates policy)');

  // 7. Validation on Structured JSON Output
  const jsonResponse = `\`\`\`json
{
  "system": "Firekeeper",
  "model": "ollama:qwen3:4b",
  "status": "active",
  "metrics": {
    "latency_ms": 120,
    "confidence": 0.95
  }
}
\`\`\`
นี่คือข้อมูลโครงสร้าง JSON สำหรับสถานะการทำงานของระบบ`;
  const valResult4 = validateOutputLanguage(jsonResponse, 'th');
  assert(valResult4.isValid, 'JSON code block with Thai explanation is valid');

  // 8. Rewrite Prompt Construction
  const rewritePrompt = buildLanguagePolicyRewritePrompt(englishResponse, 'th');
  assert(rewritePrompt.systemInstruction.includes('Global Language Policy') || rewritePrompt.systemInstruction.includes('LANGUAGE POLICY'), 'Rewrite system instruction has proper directive');
  assert(rewritePrompt.userPrompt.includes(englishResponse), 'Rewrite user prompt includes non-compliant text');

  // 9. Prompt Optimizer Integration
  const optimizedPromptResult = buildOptimizedSystemPrompt(
    { user_input: 'Tell me about quantum computing in English please' },
    'Formal Architect',
    false,
    '',
    '',
    { richness: 'moderate', missingSignals: [] },
    []
  );
  assert(optimizedPromptResult.fullPrompt.includes('LANGUAGE POLICY'), 'Optimized system prompt contains Language Policy directive');
  assert(optimizedPromptResult.activeModules.some(m => m.includes('PCA v3.0 Unified Governance')), 'Unified Governance is tracked in activeModules');
  assert(optimizedPromptResult.moduleAudits.some(m => m.name.includes('PCA v3.0 Unified Governance')), 'Unified Governance is tracked in moduleAudits');

  // 10. Governed Prompt Package Integration
  const governedPkg = buildGovernedPromptPackage({
    question: 'How to build an AI agent?',
    objective: 'Test language policy embedding'
  });
  assert(governedPkg.external_ai_prompt.length > 0, 'Governed external prompt is generated');
  assert(governedPkg.output_policy.output_language === 'th', 'Governed package output_policy enforces th language');

  // 11. LLM Message Adapters Integration (DeepSeek and Ollama)
  const dsMessages = buildDeepSeekMessages('Hello world', 'Custom System Instruction');
  const dsSysMsg = dsMessages.find(m => m.role === 'system');
  assert(Boolean(dsSysMsg && dsSysMsg.content.includes('Custom System Instruction') && dsSysMsg.content.includes('LANGUAGE POLICY')), 'DeepSeek message builder automatically wraps system instruction with language policy');

  const ollamaMessages = buildOllamaMessages('Hello world', 'Custom System Instruction');
  const ollamaSysMsg = ollamaMessages.find(m => m.role === 'system');
  assert(Boolean(ollamaSysMsg && ollamaSysMsg.content.includes('Custom System Instruction') && ollamaSysMsg.content.includes('LANGUAGE POLICY')), 'Ollama message builder automatically wraps system instruction with language policy');

  console.log(`\n===================================`);
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  console.log(`===================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
