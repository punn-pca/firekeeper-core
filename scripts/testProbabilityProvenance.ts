import assert from 'node:assert/strict';
import { buildSourceBackedProvenance, gateProbabilityInput } from '../src/utils/probabilityProvenance';

const quarantined = gateProbabilityInput({
  prior: 0.5,
  likelihood: 0.65,
  counterLikelihood: 0.35
});
assert.equal(quarantined.accepted, false);
assert.equal(quarantined.posteriorMustRemainPrior, true);
assert.equal(quarantined.likelihood, 0.5);
assert.equal(quarantined.counterLikelihood, 0.5);

const provenance = buildSourceBackedProvenance(['EV-001', 'EV-002'], 'World Bank');
const accepted = gateProbabilityInput({
  prior: 0.5,
  likelihood: 0.65,
  counterLikelihood: 0.35,
  provenance
});
assert.equal(accepted.accepted, true);
assert.equal(accepted.posteriorMustRemainPrior, false);
assert.equal(accepted.likelihood, 0.65);

const empty = buildSourceBackedProvenance([], 'Unknown');
assert.equal(empty.status, 'UNCALIBRATED');

console.log('Probability provenance tests passed.');
