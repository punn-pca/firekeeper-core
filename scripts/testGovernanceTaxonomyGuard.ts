import assert from 'node:assert/strict';
import { ensureGovernanceTaxonomyPresence } from '../src/server/services/governanceTaxonomyGuard';

assert.equal(ensureGovernanceTaxonomyPresence(''), '');
assert.equal(ensureGovernanceTaxonomyPresence('   '), '   ');
assert.equal(
  ensureGovernanceTaxonomyPresence('A response without taxonomy labels.'),
  '[UNVERIFIED]\n\nA response without taxonomy labels.',
);
assert.equal(
  ensureGovernanceTaxonomyPresence('[FACT] This is supported.'),
  '[FACT] This is supported.',
);
assert.equal(
  ensureGovernanceTaxonomyPresence('**[EVIDENCE]** A cited passage supports this.'),
  '**[EVIDENCE]** A cited passage supports this.',
);
assert.equal(
  ensureGovernanceTaxonomyPresence('```text\n[FACT] sample only\n```\nA response without labels.'),
  '[UNVERIFIED]\n\n```text\n[FACT] sample only\n```\nA response without labels.',
);
assert.equal(
  ensureGovernanceTaxonomyPresence('This is an [UNKNOWN] limitation.'),
  'This is an [UNKNOWN] limitation.',
);

assert.equal(
  ensureGovernanceTaxonomyPresence('ข้อสรุปนี้ยังไม่มีป้ายกำกับ\n[FACT] ข้อมูลนี้มีแหล่งอ้างอิง', true),
  '[UNVERIFIED] ข้อสรุปนี้ยังไม่มีป้ายกำกับ\n[FACT] ข้อมูลนี้มีแหล่งอ้างอิง',
);
assert.equal(
  ensureGovernanceTaxonomyPresence('```text\n[FACT] sample only\n```\nข้อสรุปภายนอกโค้ดยังไม่ยืนยัน', true),
  '```text\n[FACT] sample only\n```\n[UNVERIFIED] ข้อสรุปภายนอกโค้ดยังไม่ยืนยัน',
);

assert.equal(
  ensureGovernanceTaxonomyPresence('คำแนะนำ: ควรเลือกทางที่ต่อยอดทักษะเดิม', true),
  '[UNVERIFIED]\n\nคำแนะนำ: ควรเลือกทางที่ต่อยอดทักษะเดิม',
);
assert.equal(
  ensureGovernanceTaxonomyPresence('ดังนั้น ทางเลือกนี้จึงสอดคล้องกับเป้าหมายมากกว่า', true),
  '[UNVERIFIED]\n\nดังนั้น ทางเลือกนี้จึงสอดคล้องกับเป้าหมายมากกว่า',
);
assert.equal(
  ensureGovernanceTaxonomyPresence('ยังขาดข้อมูลเรื่องเป้าหมายอาชีพและเวลาที่ใช้เรียน', true),
  '[UNVERIFIED]\n\nยังขาดข้อมูลเรื่องเป้าหมายอาชีพและเวลาที่ใช้เรียน',
);
assert.equal(
  ensureGovernanceTaxonomyPresence('ตัวเลือกนี้มีโอกาสเหมาะกับคุณมากกว่า', true),
  '[UNVERIFIED] ตัวเลือกนี้มีโอกาสเหมาะกับคุณมากกว่า',
);

console.log('Governance taxonomy guard tests passed.');
