import assert from 'node:assert/strict';
import { preprocessMarkdown } from '../src/utils/markdownPreprocessor.ts';
import { buildUnifiedPcaGovernancePrompt } from '../src/server/services/pcaGovernance.ts';
import { sanitizeAndFilterTaxonomyTags } from '../src/utils/taxonomyTokens.ts';
import { containsModelContinuationArtifact } from '../src/server/services/normalChatService.ts';

const source = [
  '| ทางเลือก | รายละเอียด |',
  '|---|---|',
  '| A | อยู่ต่อ<br>ร่วมกันแก้ปัญหา |',
].join('\n');

const normalized = preprocessMarkdown(source);
const rows = normalized.split('\n');
assert.equal(rows.length, 3, 'HTML breaks inside a GFM table must not create extra rows');
assert.match(rows[2], /อยู่ต่อ \/ ร่วมกันแก้ปัญหา/, 'table cell breaks should become inline separators');

const prose = preprocessMarkdown('บรรทัดแรก<br>บรรทัดที่สอง');
assert.match(prose, /บรรทัดแรก  \nบรรทัดที่สอง/, 'HTML breaks in prose should remain Markdown hard breaks');

const prompt = buildUnifiedPcaGovernancePrompt({ depth: 'L2_STRUCTURED' });
assert.match(prompt, /Tables are OPTIONAL, not the default/);
assert.match(prompt, /NEVER put HTML <br> tags/);
assert.match(prompt, /numbered or bulleted lists/);


const taggedMarkdown = [
  '[UNVERIFIED] ## กฎหมายแรงงาน',
  '[UNVERIFIED] | กฎหมาย | ประเด็นสำคัญ |',
  '|---|---|',
  '[UNVERIFIED] | กฎหมายคุ้มครองแรงงาน | รายละเอียด |',
  '[FACT] ข้อเท็จจริงที่มีหลักฐานรองรับ',
].join('\\n');

const cleanedTaxonomy = sanitizeAndFilterTaxonomyTags(taggedMarkdown);
assert.doesNotMatch(cleanedTaxonomy, /^\\[UNVERIFIED\\] ##/m, 'taxonomy tag must not prefix Markdown headings');
assert.doesNotMatch(cleanedTaxonomy, /^\\[UNVERIFIED\\] \\|/m, 'taxonomy tag must not prefix Markdown table rows');
assert.match(cleanedTaxonomy, /\\[FACT\\] ข้อเท็จจริงที่มีหลักฐานรองรับ/, 'claim-level taxonomy tag must remain visible');

assert.equal(
  containsModelContinuationArtifact("I’m sorry, but I don’t have access to the remainder of that document."),
  true,
  'model continuation artifact must be detected'
);
assert.equal(
  containsModelContinuationArtifact('คำตอบปกติที่ตอบคำถามของผู้ใช้'),
  false,
  'normal answer must not be flagged as a model artifact'
);

console.log('✅ Adaptive response formatting, taxonomy, and model-artifact tests passed');
