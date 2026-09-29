import assert from 'node:assert/strict';
import { applyResponsePolicyPenalty } from '../src/server/services/responsePolicyPenalty';

const measured = { scorePercent: 84, label: 'สูง', formula: 'Evidence score = 84%', mathematicalProof: 'Measured evidence.' } as any;
const clean = applyResponsePolicyPenalty(measured, 'PASS', false, 0);
assert.equal(clean.scorePercent, 84);
assert.equal(clean.policyPenalty, 0);

const revised = applyResponsePolicyPenalty(measured, 'REVISE', true, 1);
assert.equal(revised.policyPenalty, 0.25);
assert.equal(revised.scorePercent, 59);
assert.equal(revised.label, 'ปานกลาง');
assert.match(revised.formula, /Policy P\(25%\)/);

const unmeasured = applyResponsePolicyPenalty({ ...measured, scorePercent: null, label: 'ไม่สามารถประเมินได้' }, 'BLOCK', true, 3);
assert.equal(unmeasured.policyPenalty, 0.40);
assert.equal(unmeasured.scorePercent, null, 'Policy penalty cannot manufacture evidence confidence');
console.log('Response policy penalty tests passed.');
