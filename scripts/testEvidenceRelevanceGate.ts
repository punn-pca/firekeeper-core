import assert from 'node:assert/strict';
import { assessEvidenceRelevance, isPreselectedDocumentEvidence } from '../src/server/services/evidenceRelevance';

assert.equal(isPreselectedDocumentEvidence({ id: 'ev-attachment-chunk-1', source: 'uploaded.pdf' }), true, 'User-provided attachment chunks must bypass external-web lexical filtering.');
assert.equal(isPreselectedDocumentEvidence({ id: 'ev-internal-document-42-1', source: 'policy.pdf' }), true, 'Preselected internal document chunks must be preserved.');
assert.equal(isPreselectedDocumentEvidence({ id: 'ev-websearch-1', source: 'news site' }), false);

const query = [
  'ข้อมูลสองแหล่งที่ขัดแย้งกัน',
  'แหล่ง A เป็นรายงานจากหน่วยงานรัฐที่เผยแพร่เมื่อ 3 ปีก่อน',
  'แหล่ง B เป็นรายงานจากองค์กรอิสระที่เผยแพร่เมื่อเดือนที่ผ่านมา โดยใช้วิธีเก็บข้อมูลที่ตรวจสอบได้',
  'ทั้งสองแหล่งรายงานตัวเลขไม่ตรงกัน',
  'Firekeeper จะป้องกันไม่ให้ AI เลือกหลักฐานที่สนับสนุนข้อสรุปของตัวเองได้อย่างไร'
].join('\n');

const unrelated = assessEvidenceRelevance(
  'ชายชาวออสเตรเลียพัฒนาวัคซีน mRNA ด้วย AI เพื่อรักษามะเร็งให้สุนัข โดยร่วมมือกับทีมนักวิจัย',
  query,
  'DOCUMENT_ANALYSIS'
);
assert.equal(unrelated.relevance, 'IRRELEVANT', 'Unrelated AI news must not pass because it shares generic AI vocabulary.');

const relevant = assessEvidenceRelevance(
  'รายงานฉบับนี้เปรียบเทียบตัวเลขจากสองแหล่งที่ขัดแย้งกัน โดยตรวจสอบวิธีเก็บข้อมูลและช่วงเวลาที่เผยแพร่ของรายงานทั้งสองฉบับ',
  query,
  'DOCUMENT_ANALYSIS'
);
assert(['HIGH', 'MEDIUM'].includes(relevant.relevance), 'Evidence with multiple specific matches should be retained.');

const genericOnly = assessEvidenceRelevance(
  'AI news',
  'AI',
  'META_INQUIRY'
);
assert.equal(genericOnly.relevance, 'IRRELEVANT', 'A generic AI token alone must not admit evidence.');

console.log('Evidence relevance gate checks passed');
