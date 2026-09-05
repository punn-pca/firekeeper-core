import { buildGovernedDynamicACH } from '../src/utils/governedDynamicACH';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

const highAuthority = buildGovernedDynamicACH('governed ACH boundary', [
  {
    id: 'ev-high-authority',
    source: 'Authoritative source',
    content: 'High authority evidence without a probability model.',
    credibilityScore: 0.99,
    strength: 'High',
    type: 'Empirical'
  } as any
]);

const lowAuthority = buildGovernedDynamicACH('governed ACH boundary', [
  {
    id: 'ev-low-authority',
    source: 'Low authority source',
    content: 'Low authority evidence without a probability model.',
    credibilityScore: 0.20,
    strength: 'Low',
    type: 'Empirical'
  } as any
]);

assert(highAuthority.hypotheses[0].likelihood === 0.5, 'Authority must not become H1 likelihood.');
assert(lowAuthority.hypotheses[0].likelihood === 0.5, 'Low authority must also remain neutral without provenance.');
assert(highAuthority.hypotheses[0].posterior === 0.5, 'High authority alone must not move posterior.');
assert(lowAuthority.hypotheses[0].posterior === 0.5, 'Low authority alone must not move posterior.');
assert(highAuthority.hypotheses[0].quarantined, 'Uncalibrated probability must be quarantined.');

const calibrated = buildGovernedDynamicACH('governed ACH calibrated', [
  {
    id: 'ev-calibrated',
    source: 'Calibrated dataset',
    content: 'Explicit calibrated likelihood.',
    credibilityScore: 0.99,
    strength: 'High',
    type: 'Empirical',
    likelihood: 0.80,
    probabilityProvenance: {
      status: 'CALIBRATED',
      evidenceIds: ['ev-calibrated'],
      source: 'calibration dataset',
      calibrationDataset: 'test-dataset-v1',
      calibrationDate: '2026-09-05',
      rationale: 'Held-out calibration benchmark'
    }
  } as any
]);

assert(calibrated.hypotheses[0].likelihood === 0.80, 'Explicit calibrated likelihood must be preserved.');
assert(calibrated.hypotheses[0].posterior > 0.5, 'Calibrated likelihood must move posterior.');
assert(!calibrated.hypotheses[0].quarantined, 'Calibrated probability must not be quarantined.');

console.log('PASS: Governed Dynamic ACH — credibility is not likelihood; provenance gates posterior movement.');
