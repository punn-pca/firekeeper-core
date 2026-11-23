import assert from 'node:assert/strict';
import { assessRetrievalNeed } from '../src/server/core/retrievalNeedGate';

const noneCases = [
  'รักคืออะไร อธิบาย',
  'อธิบายความรัก',
  'AI คืออะไร',
  'ทำไมคนเราถึงรักกัน',
  'ช่วยเปรียบเทียบความหมายของความรัก',
];

for (const question of noneCases) {
  const result = assessRetrievalNeed(question, true);
  assert.equal(result.need, 'NONE', question);
  assert.equal(result.shouldRetrieve, false, question);
}

const webCases: Array<[string, string]> = [
  ['ข่าว AI ล่าสุด', 'CURRENT'],
  ['กฎหมายแรงงานล่าสุดเป็นอย่างไร', 'CURRENT'],
  ['ช่วยค้นหางานวิจัยเรื่องความรัก', 'USER_REQUESTED'],
  ['ขอแหล่งอ้างอิงจากเว็บเรื่อง AI', 'USER_REQUESTED'],
  ['ช่วยหาแหล่งข้อมูลเรื่องกฎหมายแรงงาน', 'USER_REQUESTED'],
];

for (const [question, expected] of webCases) {
  const result = assessRetrievalNeed(question, true);
  assert.equal(result.need, expected, question);
  assert.equal(result.shouldRetrieve, true, question);
}

assert.equal(
  assessRetrievalNeed('ข่าว AI ล่าสุด', false).shouldRetrieve,
  false,
  'Disabled web search must never retrieve'
);

assert.equal(
  assessRetrievalNeed('ไม่ต้องค้นข้อมูลเรื่อง AI ล่าสุด', true).shouldRetrieve,
  false,
  'Explicit retrieval negation must win'
);

console.log('Retrieval need gate tests passed');
