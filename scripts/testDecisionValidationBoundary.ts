import assert from 'node:assert/strict';
import { validateDecisionObject } from '../src/shared/contracts/decision';

const base = {
  question: 'Should we proceed?', context: [], options: [], risks: [], uncertainties: [],
  consequences: [], evidence: [], assumptions: [], confidence: { score: null, label: 'UNKNOWN', breakdown: {} },
  applicable_policies: [], policy_conflicts: [], escalation_required: false, controlLevel: 'LOW'
};
assert.equal(validateDecisionObject(base).status, 'PASS', 'Unknown confidence remains null without evidence');
assert.equal(validateDecisionObject({ ...base, confidence: { ...base.confidence, score: 1.2 } }).status, 'REPAIR_REQUIRED');
assert.equal(validateDecisionObject({ ...base, confidence: { ...base.confidence, score: -0.1 } }).status, 'REPAIR_REQUIRED');
assert.equal(validateDecisionObject({ ...base, evidence: 'invalid' }).status, 'REPAIR_REQUIRED');
assert.equal(validateDecisionObject({ ...base, escalation_required: true }).status, 'ESCALATE');
console.log('Decision object validation boundaries passed.');
