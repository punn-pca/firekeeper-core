import assert from 'assert';
import {
  resolveContextualSearch,
  ContextualSearchResolution
} from '../src/server/services/contextualSearchResolver';

console.log('Starting Contextual Search Resolver Test Suite...');

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Pronoun "เขา" + Elliptical follow-up ("แล้วซีอีโอของเขาล่ะคือใคร")
// ─────────────────────────────────────────────────────────────────────────────
const history1 = [
  { role: 'user', content: 'ปตท. ผลประกอบการปี 2025 เป็นอย่างไร' },
  { role: 'assistant', content: 'ผลการดำเนินงานของ ปตท. ในปี 2025 มีกำไรสุทธิเติบโตอย่างมั่นคง...' }
];

const res1 = resolveContextualSearch('แล้วซีอีโอของเขาล่ะคือใคร', history1);
console.log('Test 1 (Pronoun + Elliptical):', JSON.stringify(res1, null, 2));

assert.strictEqual(res1.user_query, 'แล้วซีอีโอของเขาล่ะคือใคร');
assert(res1.resolved_query.includes('ปตท'), 'Resolved query must contain bound entity ปตท');
assert(res1.search_query.includes('ปตท'), 'Search query must contain bound entity ปตท');
assert(!res1.search_query.includes('เขา'), 'Search query must not contain ambiguous pronoun เขา');
assert.strictEqual(res1.search_required, true);
assert.strictEqual(res1.ambiguity, false);
assert(res1.context_used.length > 0);

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: "บริษัทนี้" + Temporal marker "ล่าสุด"
// ─────────────────────────────────────────────────────────────────────────────
const history2 = [
  { role: 'user', content: 'Apple เปิดตัวสินค้าใหม่อะไรบ้าง' },
  { role: 'assistant', content: 'Apple ได้เปิดตัว iPhone 16 และ Apple Watch รุ่นใหม่...' }
];

const res2 = resolveContextualSearch('แล้วกำไรของบริษัทนี้ล่าสุดเท่าไหร่', history2);
console.log('Test 2 (Organization Pronoun + Temporal):', JSON.stringify(res2, null, 2));

assert.strictEqual(res2.user_query, 'แล้วกำไรของบริษัทนี้ล่าสุดเท่าไหร่');
assert(res2.resolved_query.includes('Apple'), 'Resolved query must replace บริษัทนี้ with Apple');
assert(res2.search_query.includes('Apple'), 'Search query must contain Apple');
assert(res2.search_query.includes('ล่าสุด'), 'Search query must preserve temporal intent ล่าสุด');
assert.strictEqual(res2.search_required, true);
assert.strictEqual(res2.ambiguity, false);

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: "เรื่องนี้" + "ตอนนี้" (Topic + Present Temporal Intent)
// ─────────────────────────────────────────────────────────────────────────────
const history3 = [
  { role: 'user', content: 'สรุปคดี Forex-3D ให้หน่อย' },
  { role: 'assistant', content: 'คดี Forex-3D เป็นคดีแชร์ลูกโซ่ที่อยู่ระหว่างการดำเนินคดี...' }
];

const res3 = resolveContextualSearch('ตอนนี้เรื่องนี้ไปถึงไหนแล้ว', history3);
console.log('Test 3 (Topic Reference + ตอนนี้):', JSON.stringify(res3, null, 2));

assert.strictEqual(res3.user_query, 'ตอนนี้เรื่องนี้ไปถึงไหนแล้ว');
assert(res3.resolved_query.includes('Forex-3D'), 'Resolved query must include Forex-3D');
assert(res3.search_query.includes('Forex-3D'), 'Search query must include Forex-3D');
assert(res3.search_query.includes('ปัจจุบัน') || res3.search_query.includes('ตอนนี้'), 'Search query must preserve temporal intent');
assert.strictEqual(res3.ambiguity, false);

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Ambiguity Detection (Rule 6 - Multiple competing entities)
// ─────────────────────────────────────────────────────────────────────────────
const history4 = [
  { role: 'user', content: 'เปรียบเทียบผลประกอบการของ KBANK และ SCB ให้ดูหน่อย' },
  { role: 'assistant', content: 'ทั้งสองธนาคารมีกลยุทธ์ที่แตกต่างกัน โดย KBANK เน้นดิจิทัล และ SCB เน้นกลุ่มการเงินครบวงจร' }
];

const res4 = resolveContextualSearch('แล้วซีอีโอของบริษัทนี้คือใคร', history4);
console.log('Test 4 (Ambiguity):', JSON.stringify(res4, null, 2));

assert.strictEqual(res4.ambiguity, true, 'Must flag ambiguity when multiple candidate entities match');
assert(res4.context_used.some(c => c.includes('กำกวม') || c.includes('มากกว่า 1 รายการ')));

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Non-search queries (search_required: false)
// ─────────────────────────────────────────────────────────────────────────────
const res5Greeting = resolveContextualSearch('สวัสดีครับ สบายดีไหม');
assert.strictEqual(res5Greeting.search_required, false);
assert.strictEqual(res5Greeting.search_query, '');

const res5Internal = resolveContextualSearch('PUNN คือใคร');
assert.strictEqual(res5Internal.search_required, false);
assert.strictEqual(res5Internal.search_query, '');

const res5Math = resolveContextualSearch('15 * 84 ได้เท่าไหร่');
assert.strictEqual(res5Math.search_required, false);
assert.strictEqual(res5Math.search_query, '');

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: Standalone query with temporal marker
// ─────────────────────────────────────────────────────────────────────────────
const res6 = resolveContextualSearch('ราคาทองคำวันนี้เท่าไหร่');
assert.strictEqual(res6.search_required, true);
assert(res6.search_query.includes('วันนี้'));
assert.strictEqual(res6.ambiguity, false);

console.log('All Contextual Search Resolver Tests Passed Successfully!');
