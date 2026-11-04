import assert from 'node:assert/strict';
import { preprocessMarkdown } from '../src/utils/markdownPreprocessor.ts';
import { buildUnifiedPcaGovernancePrompt } from '../src/server/services/pcaGovernance.ts';

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

console.log('✅ Adaptive response formatting and Markdown table tests passed');
