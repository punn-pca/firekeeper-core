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
  ensureGovernanceTaxonomyPresence('ข้อสรุปนี้ยังไม่มีป้ายกำกับ\
[FACT] ข้อมูลนี้มีแหล่งอ้างอิง', true),
  '[UNVERIFIED] ข้อสรุปนี้ยังไม่มีป้ายกำกับ\
[FACT] ข้อมูลนี้มีแหล่งอ้างอิง',
);
assert.equal(
  ensureGovernanceTaxonomyPresence('```text\
[FACT] sample only\
```\
ข้อสรุปภายนอกโค้ดยังไม่ยืนยัน', true),
  '```text\
[FACT] sample only\
```\
[UNVERIFIED] ข้อสรุปภายนอกโค้ดยังไม่ยืนยัน',
);

console.log('Governance taxonomy guard tests passed.');
