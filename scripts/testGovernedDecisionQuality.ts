import assert from 'node:assert/strict';
import { reviewGovernedDecision } from '../src/server/services/governedDecisionQuality';

const base = {
  evidence: [{ id: 'E1', verified: true, source: 'user-supplied document' }],
  confidence: 0.72,
  isComplexDecision: true,
  options: ['primary', 'primary', 'intermediate'].map((type, i) => ({
    id: String(i), title: 'Option ' + i, type: type as 'primary' | 'intermediate',
    benefits: ['benefit'], costs: ['cost'], risks: ['risk'],
    assumptions: ['requires confirmation'], evidenceIds: ['E1']
  }))
};
const good = reviewGovernedDecision(base);
assert.equal(good.passed, true);
assert.match(good.confidenceDisplay, /72.0%/);
const weak = reviewGovernedDecision({ ...base, options: base.options.slice(0, 2), confidence: null });
assert(weak.issues.includes('INSUFFICIENT_OPTIONS'));
assert(weak.issues.includes('MISSING_INTERMEDIATE_OPTION'));
assert(weak.issues.includes('CONFIDENCE_NOT_MEASURED'));
const unsupported = reviewGovernedDecision({
  ...base, options: base.options.map(o => ({ ...o, evidenceIds: ['E2'] }))
});
assert.deepEqual(unsupported.missingEvidenceIds, ['E2']);
const simple = reviewGovernedDecision({ ...base, isComplexDecision: false, options: [] });
assert(!simple.issues.includes('INSUFFICIENT_OPTIONS'));
console.log('Governed decision quality checks passed');
