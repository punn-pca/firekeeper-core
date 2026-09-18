import assert from 'node:assert/strict';
import { calculateGovernedACHHypothesis } from '../src/utils/governedBayesianACH';

const uncalibrated = calculateGovernedACHHypothesis(
  0.5,
  [{ id: 'ev-1', source: 'High Authority Source', likelihood: undefined }],
  'production ACH'
);

assert.equal(uncalibrated.quarantined, true);
assert.equal(uncalibrated.likelihood, 0.5);
assert.equal(uncalibrated.posterior, 0.5);

// Regression guard: evidence authority/credibility must never become P(E|H).
const highAuthority = calculateGovernedACHHypothesis(
  0.5,
  [{ id: 'ev-high', source: 'High Authority Source', likelihood: undefined }],
  'authority invariance'
);
const lowAuthority = calculateGovernedACHHypothesis(
  0.5,
  [{ id: 'ev-low', source: 'Low Authority Source', likelihood: undefined }],
  'authority invariance'
);
assert.equal(highAuthority.likelihood, lowAuthority.likelihood);
assert.equal(highAuthority.counterLikelihood, lowAuthority.counterLikelihood);
assert.equal(highAuthority.posterior, lowAuthority.posterior);
assert.equal(highAuthority.quarantined, true);
assert.equal(lowAuthority.quarantined, true);

const calibrated = calculateGovernedACHHypothesis(
  0.5,
  [{
    id: 'ev-2',
    source: 'Calibrated Dataset',
    likelihood: 0.8,
    probabilityProvenance: {
      status: 'CALIBRATED',
      evidenceIds: ['ev-2'],
      source: 'Calibrated Dataset',
      calibrationDataset: 'historical-validation-v1',
      rationale: 'Validated likelihood'
    }
  }],
  'production ACH'
);

assert.equal(calibrated.quarantined, false);
assert.equal(calibrated.likelihood, 0.8);
assert.ok(Math.abs(calibrated.counterLikelihood - 0.2) < 1e-6);
assert.ok(calibrated.posterior > 0.5);

console.log('Governed Bayesian ACH tests passed');
