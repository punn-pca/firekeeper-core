import assert from 'node:assert/strict';
import { checkTemporalResponse } from '../src/server/services/temporalResponseCheck';

const now = new Date('2026-10-09T04:00:00Z');
const broken = 'เนื่องจากปี 2025 ยังไม่ถึง จึงไม่มีข้อมูล';
const repaired = checkTemporalResponse(broken, now);
assert.equal(repaired.changed, true);
assert.match(repaired.text, /ปี 2025 ผ่านมาแล้ว/);
assert.deepEqual(repaired.findings, ['PAST_YEAR_DESCRIBED_AS_FUTURE:2025']);

for (const safe of [
  'ปี 2027 ยังไม่ถึง',
  '> ปี 2025 ยังไม่ถึง',
  'คำถาม: ปี 2025 ยังไม่ถึง?',
  '```\nปี 2025 ยังไม่ถึง\n```',
  'ปี 2025 ผ่านมาแล้ว',
]) {
  assert.equal(checkTemporalResponse(safe, now).text, safe);
}
console.log('temporal response regression checks passed');
