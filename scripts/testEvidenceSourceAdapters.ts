import assert from 'node:assert/strict';
import fs from 'node:fs';

const serverSource = fs.readFileSync(new URL('../server.ts', import.meta.url), 'utf8');

const attachmentStart = serverSource.indexOf('parsedAttachmentChunks.forEach');
assert(attachmentStart >= 0, 'Attachment evidence adapter must exist.');
const attachmentBlock = serverSource.slice(attachmentStart, attachmentStart + 2200);
assert(attachmentBlock.includes("evidence_status: 'UNVERIFIED'"), 'Attachment content must enter evidence evaluation as UNVERIFIED.');
assert(attachmentBlock.includes('credibilityScore: undefined'), 'Attachment credibility must start unmeasured rather than high by default.');
assert(attachmentBlock.includes('strength: undefined'), 'Attachment strength must remain unmeasured until explicit verification.');
assert(!attachmentBlock.includes('credibilityScore: 0.99'), 'Attachment upload must not imply 0.99 source credibility.');

const publicationStart = serverSource.indexOf('publicationKnowledge.forEach');
assert(publicationStart >= 0, 'Publication evidence adapter must exist.');
const publicationBlock = serverSource.slice(publicationStart, publicationStart + 2600);
assert(publicationBlock.includes("evidence_status: 'UNVERIFIED'"), 'Official publication claims must remain UNVERIFIED by default.');
assert(publicationBlock.includes("sourceType: 'OFFICIAL_PUBLICATION'"), 'Publication provenance type must remain explicit.');
assert(publicationBlock.includes('content_hash: chunk.hash'), 'Publication integrity hash must remain preserved.');

console.log('Evidence source adapter boundary checks passed.');
