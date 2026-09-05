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
assert.equal(calibrated.counterLikelihood, 0.2);
assert.ok(calibrated.posterior > 0.5);

console.log('Governed Bayesian ACH tests passed');
