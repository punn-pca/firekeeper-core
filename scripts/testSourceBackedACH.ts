import assert from 'node:assert/strict';
import { resolveSourceBackedLikelihood } from '../src/utils/sourceBackedACH';

// Regression: credibility must never become P(E|H).
{
  const result = resolveSourceBackedLikelihood(0.5, [
    { id: 'EV-001', source: 'High-authority source', content: 'verified source', likelihood: undefined }
  ], 'credibility-only evidence');
  assert.equal(result.likelihood, 0.5);
  assert.equal(result.counterLikelihood, 0.5);
  assert.equal(result.quarantined, true);
}

// Regression: explicit source-backed likelihood may update Bayes.
{
  const result = resolveSourceBackedLikelihood(0.5, [
    {
      id: 'EV-002',
      source: 'Historical dataset',
      likelihood: 0.65,
      counterLikelihood: 0.35,
      probabilityProvenance: {
        status: 'CALIBRATED',
        evidenceIds: ['EV-002'],
        source: 'Historical dataset',
        methodology: 'empirical frequency',
        sampleSize: 1000,
        calibrationDataset: 'dataset-v1'
      }
    }
  ], 'calibrated evidence');
  assert.equal(result.likelihood, 0.65);
  assert.equal(result.counterLikelihood, 0.35);
  assert.equal(result.quarantined, false);
  assert.equal(result.provenance.status, 'CALIBRATED');
  assert.deepEqual(result.provenance.evidenceIds, ['EV-002']);
}

// Conditional likelihoods are independent inputs; one cannot be derived as
// the complement of the other.
{
  const result = resolveSourceBackedLikelihood(0.5, [{
    id: 'EV-ONE-SIDED', source: 'Historical dataset', likelihood: 0.8,
    probabilityProvenance: { status: 'CALIBRATED', evidenceIds: ['EV-ONE-SIDED'], source: 'Historical dataset' }
  }], 'missing counter likelihood');
  assert.equal(result.quarantined, true);
  assert.equal(result.counterLikelihood, 0.5);
}

// Regression: evidence provenance alone is not permission to invent a number.
{
  const result = resolveSourceBackedLikelihood(0.7, [
    { id: 'EV-003', source: 'World Bank', probabilityProvenance: { status: 'SOURCE_BACKED' } }
  ], 'source-only evidence');
  assert.equal(result.likelihood, 0.7);
  assert.equal(result.quarantined, true);
}

// An unrelated calibration record cannot validate another item's likelihood.
{
  const result = resolveSourceBackedLikelihood(0.5, [
    { id: 'EV-NUMBER', source: 'Uncalibrated estimate', likelihood: 0.9 },
    { id: 'EV-CALIBRATION', source: 'Other dataset', probabilityProvenance: {
      status: 'CALIBRATED', evidenceIds: ['EV-CALIBRATION'], source: 'Other dataset'
    } }
  ], 'cross-item provenance');
  assert.equal(result.quarantined, true);
  assert.equal(result.likelihood, 0.5);
}

// A provenance record must explicitly name the evidence carrying its number.
{
  const result = resolveSourceBackedLikelihood(0.5, [{
    id: 'EV-NUMBER', source: 'Dataset', likelihood: 0.9,
    probabilityProvenance: { status: 'CALIBRATED', evidenceIds: ['EV-OTHER'], source: 'Dataset' }
  }], 'incorrect lineage');
  assert.equal(result.quarantined, true);
}

console.log('Source-backed ACH tests passed.');
