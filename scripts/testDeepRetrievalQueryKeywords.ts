import assert from 'node:assert/strict';
import { extractDeepRetrievalKeywords } from '../src/server/services/webAccess/webAccessLayer';

const thai = extractDeepRetrievalKeywords('ช่วยสรุปข่าว AI ล่าสุดเกี่ยวกับกฎหมายแรงงาน');
assert.ok(thai.includes('ข่าว'), `expected Thai segment "ข่าว": ${thai.join(',')}`);
assert.ok(thai.includes('AI') || thai.includes('ai'), `expected AI anchor: ${thai.join(',')}`);
assert.ok(thai.includes('กฎหมาย'), `expected "กฎหมาย" anchor: ${thai.join(',')}`);
assert.ok(thai.includes('แรงงาน'), `expected "แรงงาน" anchor: ${thai.join(',')}`);
assert.ok(!thai.includes('ช่วย'));
assert.ok(!thai.includes('เกี่ยวกับ'));
assert.ok(!thai.includes('ล่าสุด'));

const english = extractDeepRetrievalKeywords('latest research about artificial intelligence safety');
assert.ok(english.includes('research'));
assert.ok(english.includes('artificial'));
assert.ok(english.includes('intelligence'));
assert.ok(english.includes('safety'));
assert.ok(!english.includes('latest'));
assert.ok(!english.includes('about'));

assert.deepEqual(extractDeepRetrievalKeywords('ช่วยอธิบายให้หน่อย'), []);

console.log('Deep retrieval query keyword tests passed.');
