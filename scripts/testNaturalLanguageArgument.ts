import assert from 'node:assert/strict';
import {
  parseNaturalLanguageArgument,
  shouldExtractNaturalLanguageArgument,
} from '../src/utils/naturalLanguageArgument';

const validAnswer = 'ถ้าฝนตก ถนนจะเปียก และวันนี้ฝนตก ดังนั้นถนนจึงเปียก';
const valid = parseNaturalLanguageArgument(JSON.stringify({
  status: 'EXTRACTED',
  premises: [
    { id: 'P1', text: 'ถ้าฝนตก ถนนจะเปียก', source_quote: 'ถ้าฝนตก ถนนจะเปียก', kind: 'CONDITIONAL' },
    { id: 'P2', text: 'วันนี้ฝนตก', source_quote: 'วันนี้ฝนตก', kind: 'FACT_CLAIM' }
  ],
  inference_steps: [
    { from_premise_ids: ['P1', 'P2'], rule: 'Modus Ponens', conclusion: 'ถนนเปียก', source_quote: 'ดังนั้นถนนจึงเปียก' }
  ],
  conclusion: { text: 'ถนนจึงเปียก', source_quote: 'ดังนั้นถนนจึงเปียก' },
  formalization: {
    atom_map: { P: 'ฝนตก', Q: 'ถนนเปียก' },
    premise_formulas: ['P -> Q', 'P'],
    conclusion_formula: 'Q'
  },
  limitations: []
}), validAnswer);
assert.equal(valid.status, 'EXTRACTED');
assert.equal(valid.formalization?.validation.validity, 'VALID');
assert.equal(valid.formalization?.validation.soundness, 'UNDETERMINED');
assert.equal(valid.formalization?.review_status, 'HUMAN_REVIEW_REQUIRED');
assert.deepEqual(valid.premises.map(item => item.truth_status), ['UNKNOWN', 'UNKNOWN']);

const invalidAnswer = 'ถ้าฝนตก ถนนจะเปียก และถนนเปียก ดังนั้นฝนตก';
const invalid = parseNaturalLanguageArgument(JSON.stringify({
  status: 'EXTRACTED',
  premises: [
    { id: 'P1', text: 'ถ้าฝนตก ถนนจะเปียก', source_quote: 'ถ้าฝนตก ถนนจะเปียก', kind: 'CONDITIONAL' },
    { id: 'P2', text: 'ถนนเปียก', source_quote: 'ถนนเปียก', kind: 'FACT_CLAIM' }
  ],
  inference_steps: [
    { from_premise_ids: ['P1', 'P2'], rule: 'Affirming the consequent', conclusion: 'ฝนตก', source_quote: 'ดังนั้นฝนตก' }
  ],
  conclusion: { text: 'ฝนตก', source_quote: 'ดังนั้นฝนตก' },
  formalization: {
    atom_map: { P: 'ฝนตก', Q: 'ถนนเปียก' },
    premise_formulas: ['P -> Q', 'Q'],
    conclusion_formula: 'P'
  },
  limitations: []
}), invalidAnswer);
assert.equal(invalid.status, 'EXTRACTED');
assert.equal(invalid.formalization?.validation.validity, 'INVALID');
assert.equal(invalid.formalization?.validation.soundness, 'UNSOUND');

const noArgument = parseNaturalLanguageArgument(JSON.stringify({
  status: 'NO_ARGUMENT', premises: [], inference_steps: [], conclusion: null,
  formalization: null, limitations: ['Descriptive definition only']
}), 'ความรักเป็นความรู้สึกผูกพัน');
assert.equal(noArgument.status, 'NO_ARGUMENT');
assert.equal(noArgument.formalization, null);

const fabricatedQuote = parseNaturalLanguageArgument(JSON.stringify({
  status: 'EXTRACTED',
  premises: [{ id: 'P1', text: 'AI is always correct', source_quote: 'AI is always correct', kind: 'FACT_CLAIM' }],
  inference_steps: [{ from_premise_ids: ['P1'], rule: 'Deduction', conclusion: 'Trust AI', source_quote: 'therefore trust AI' }],
  conclusion: { text: 'Trust AI', source_quote: 'therefore trust AI' },
  formalization: null, limitations: []
}), 'AI may help with analysis.');
assert.equal(fabricatedQuote.status, 'INVALID_OUTPUT');
assert.equal(fabricatedQuote.formalization, null);

const unknownPremiseRef = parseNaturalLanguageArgument(JSON.stringify({
  status: 'EXTRACTED',
  premises: [{ id: 'P1', text: 'P', source_quote: 'Premise P', kind: 'ASSUMPTION' }],
  inference_steps: [{ from_premise_ids: ['P2'], rule: 'Deduction', conclusion: 'Q', source_quote: 'therefore Q' }],
  conclusion: { text: 'Q', source_quote: 'therefore Q' },
  formalization: null, limitations: []
}), 'Premise P therefore Q');
assert.equal(unknownPremiseRef.status, 'INVALID_OUTPUT');

assert.equal(shouldExtractNaturalLanguageArgument('สวัสดีครับ'), false);
assert.equal(shouldExtractNaturalLanguageArgument('ข้อสรุปนี้เกิดขึ้นเพราะมีเหตุผลรองรับและมีเงื่อนไขที่เกี่ยวข้องอย่างชัดเจน'), false);
assert.equal(shouldExtractNaturalLanguageArgument('คำอธิบายนี้มีรายละเอียดมากพอสมควร เพราะเหตุผลข้อแรกสนับสนุนข้อสรุปดังกล่าว และดังนั้นจึงควรตรวจสอบความสัมพันธ์ระหว่างเหตุผลกับข้อสรุปอีกครั้ง'), true);

console.log('Natural-language argument extraction tests passed.');
