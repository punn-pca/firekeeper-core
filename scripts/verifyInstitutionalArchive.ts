import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { INSTITUTIONAL_ARCHIVE_PATH, chunkInstitutionalMarkdown, retrieveInstitutionalKnowledge } from '../src/server/services/institutionalKnowledge';

const file = path.resolve(process.cwd(), INSTITUTIONAL_ARCHIVE_PATH);
assert.ok(fs.existsSync(file), 'Missing complete institutional archive: ' + INSTITUTIONAL_ARCHIVE_PATH);
const text = fs.readFileSync(file, 'utf8');
assert.ok(text.length > 20000, 'Institutional archive is suspiciously short; do not accept a placeholder or summary');
const chunks = chunkInstitutionalMarkdown(text);
assert.ok(chunks.length >= 20, 'Institutional archive must produce at least 20 chunks');
for (const chunk of chunks) {
  assert.equal(chunk.hash, crypto.createHash('sha256').update(chunk.content).digest('hex'));
  assert.equal(text.slice(chunk.startOffset, chunk.endOffset).trim(), chunk.content);
  assert.equal(chunk.epistemicStatus, 'CONTEXT_ONLY');
}
assert.ok(retrieveInstitutionalKnowledge('FIREKEEPER ประวัติการตัดสินใจ').length > 0);
assert.deepEqual(retrieveInstitutionalKnowledge('What is RAG?'), []);
console.log('[Institutional RAG] PASS: full archive present, ' + chunks.length + ' chunks, hashes and offsets verified');
