import assert from 'assert';
import {
  CANONICAL_PUNN_PERSONA_PROMPT,
  CANONICAL_PUNN_DEFINITION,
  isPunnIdentityQuery,
  getPunnCanonicalProtocolAnswer,
  auditAndEnforcePunnPersona
} from '../src/server/services/punnPersonaGovernance';

console.log('Starting PUNN Canonical Persona Governance Tests...');

// 1. Invariant strings check
assert(CANONICAL_PUNN_PERSONA_PROMPT.includes('PUNN คือ "ปุญญ์"'), 'Must define PUNN as ปุญญ์');
assert(CANONICAL_PUNN_PERSONA_PROMPT.includes('ไม่ใช่ชื่อของ AI'), 'Must forbid classifying PUNN as AI');
assert(CANONICAL_PUNN_PERSONA_PROMPT.includes('ไม่ใช่คำย่อทางเทคนิค'), 'Must forbid classifying PUNN as acronym');
assert(CANONICAL_PUNN_PERSONA_PROMPT.includes('AI assists. PUNN creates.'), 'Must enforce Attribution rule');
assert(CANONICAL_PUNN_DEFINITION.includes('PUNN (ปุญญ์) คือชื่อของผู้สร้าง Firekeeper'), 'Canonical definition check');

// 2. Query Detection
assert.strictEqual(isPunnIdentityQuery('PUNN คือใคร'), true);
assert.strictEqual(isPunnIdentityQuery('ปุญญ์ คือใคร'), true);
assert.strictEqual(isPunnIdentityQuery('who is punn?'), true);
assert.strictEqual(isPunnIdentityQuery('PUNN ย่อมาจากอะไร'), true);
assert.strictEqual(isPunnIdentityQuery('What does PUNN stand for?'), true);
assert.strictEqual(isPunnIdentityQuery('PUNN กับ Firekeeper ต่างกันอย่างไร'), true);
assert.strictEqual(isPunnIdentityQuery('ความสัมพันธ์ระหว่าง PUNN และ Firekeeper'), true);
assert.strictEqual(isPunnIdentityQuery('ที่มาของชื่อ PUNN'), true);
assert.strictEqual(isPunnIdentityQuery('พรุ่งนี้ฝนจะตกไหม'), false);
assert.strictEqual(isPunnIdentityQuery('อธิบายกฎหมาย PDPA'), false);

// 3. Deterministic protocol answers
const answerWho = getPunnCanonicalProtocolAnswer('PUNN คือใคร?');
assert(answerWho && answerWho.includes('PUNN คือ “ปุญญ์” ชื่อของผู้สร้าง Firekeeper'));

const answerAcronym = getPunnCanonicalProtocolAnswer('PUNN ย่อมาจากอะไร?');
assert(answerAcronym && answerAcronym.includes('ไม่ได้ย่อมาจากคำใด'));

const answerDiff = getPunnCanonicalProtocolAnswer('PUNN กับ Firekeeper ต่างกันอย่างไร?');
assert(answerDiff && answerDiff.includes('PUNN คือผู้สร้างและเจ้าของแนวคิด'));

// 4. Output Audit & Enforcement
const passReport = auditAndEnforcePunnPersona('Firekeeper คือระบบให้เหตุผลเชิงญาณวิทยา');
assert.strictEqual(passReport.modified, false);
assert.strictEqual(passReport.violations.length, 0);

// Test violation: Model claimed to be PUNN
const v1 = auditAndEnforcePunnPersona('สวัสดีครับ ผมคือ PUNN ผู้ช่วยของคุณ');
assert.strictEqual(v1.modified, true);
assert(v1.violations.includes('MODEL_CLAIMED_PUNN_IDENTITY'));
assert(v1.text.includes('Firekeeper'));

// Test violation: PUNN classified as AI
const v2 = auditAndEnforcePunnPersona('PUNN คือ AI อัจฉริยะที่พัฒนาขึ้นมา');
assert.strictEqual(v2.modified, true);
assert(v2.violations.includes('PUNN_CLASSIFIED_AS_AI'));

// Test violation: Fabricated Acronym
const v3 = auditAndEnforcePunnPersona('PUNN ย่อมาจาก Personal Neural Network');
assert.strictEqual(v3.modified, true);
assert(v3.violations.includes('FABRICATED_ACRONYM'));

// Test violation: English pun etymology
const v4 = auditAndEnforcePunnPersona('คำว่า PUNN มาจากคำว่า pun ในภาษาอังกฤษ หมายถึงการเล่นคำ');
assert.strictEqual(v4.modified, true);
assert(v4.violations.includes('FABRICATED_ENGLISH_PUN_ETYMOLOGY'));

console.log('All PUNN Canonical Persona Governance Tests Passed Successfully!');
