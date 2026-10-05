import assert from 'node:assert/strict';
import {
  defaultAuthorityScore,
  normalizeDocumentKind,
  rankDocumentResourceChunks,
  type DocumentResourceChunk,
} from '../src/server/services/documentResources';

assert.equal(normalizeDocumentKind('policy'), 'POLICY');
assert.equal(normalizeDocumentKind('unknown'), 'INTERNAL_FILE');
assert.equal(defaultAuthorityScore('REGULATION'), 95);
assert.ok(defaultAuthorityScore('POLICY') > defaultAuthorityScore('INTERNAL_FILE'));

const base = {
  documentId: 'doc-1',
  ownerId: 'user-1',
  mimeType: 'application/pdf',
  createdAt: new Date(0).toISOString(),
};
const chunks: DocumentResourceChunk[] = [
  { ...base, id: 'c1', filename: 'ระเบียบจัดซื้อ.pdf', kind: 'REGULATION', content: 'การจัดซื้อวงเงินต้องได้รับอนุมัติตามระเบียบ', locator: 'หน้า 4 ข้อ 2', chunkIndex: 0, authorityScore: 95 },
  { ...base, id: 'c2', filename: 'คู่มือทั่วไป.pdf', kind: 'MANUAL', content: 'ขั้นตอนการเข้าสู่ระบบสำหรับผู้ใช้งาน', locator: 'หน้า 1', chunkIndex: 0, authorityScore: 80 },
];
const ranked = rankDocumentResourceChunks(chunks, 'ระเบียบ จัดซื้อ อนุมัติ', 2);
assert.equal(ranked[0]?.id, 'c1');
assert.equal(ranked[0]?.locator, 'หน้า 4 ข้อ 2');

console.log('Document resource evidence tests passed');
