import assert from 'node:assert/strict';
import { validateModelOutput } from '../src/server/services/pcaRuntimeController';
import { preprocessMarkdown } from '../src/utils/markdownPreprocessor';

const governed = validateModelOutput(
  '[FACT] Firekeeper ใช้ PUNN Cognitive Architecture เป็นกรอบของระบบ\n\n[INFERENCE] คำตอบนี้ถูกจัดโครงสร้างผ่าน runtime governance',
  {
    query: 'Firekeeper ทำอะไรได้',
    expectedDepth: 'L0_DIRECT',
    expectedLanguage: 'th',
    governedMode: true,
    executedProvider: 'groq',
    executedModel: 'openai/gpt-oss-120b',
  }
);

assert.equal(governed.repairedText?.includes('[FACT]'), true, 'Governed L0 must preserve [FACT]');
assert.equal(governed.repairedText?.includes('[INFERENCE]'), true, 'Governed L0 must preserve [INFERENCE]');

const rendered = preprocessMarkdown('[FACT] Firekeeper ใช้ PUNN Cognitive Architecture');
assert.equal(rendered.includes('[FACT]'), true, 'Markdown preprocessing must preserve [FACT] for ReactMarkdown badge rendering');

const direct = validateModelOutput(
  '[FACT] ข้อความสำหรับ Direct mode',
  {
    query: 'คำถามทั่วไป',
    expectedDepth: 'L0_DIRECT',
    expectedLanguage: 'th',
    executedProvider: 'groq',
    executedModel: 'openai/gpt-oss-120b',
  }
);
assert.equal(direct.repairedText?.includes('[FACT]'), false, 'Direct L0 may still suppress taxonomy');

console.log('Taxonomy visibility regression tests: PASS');
