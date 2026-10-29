import assert from 'node:assert/strict';
import { isRelevantXPost } from '../src/server/services/xEvidenceProvider';

assert.equal(
  isRelevantXPost('ข่าว AI ล่าสุด', 'OpenAI releases a new model for coding'),
  true,
  'AI-related posts should remain available as unverified evidence'
);
assert.equal(
  isRelevantXPost('ข่าวเอไอวันนี้', 'เด็กมีปัญหาเรื่องบัตรประชาชน'),
  false,
  'Unrelated social posts should be filtered from AI-news retrieval'
);
assert.equal(
  isRelevantXPost('ข่าว AI ล่าสุด', 'NVIDIA announces new AI computing platform'),
  true,
  'AI infrastructure posts should remain relevant'
);
assert.equal(
  isRelevantXPost('ร้านซ่อมเครื่องซักผ้าใกล้ฉัน', 'ร้านซ่อมเครื่องซักผ้าเปิดวันนี้'),
  true,
  'Non-AI queries must not be filtered by the AI-news relevance gate'
);

console.log('PASS: X evidence relevance gate');
