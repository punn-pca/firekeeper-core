import assert from 'node:assert/strict';
import { classifyEvidence } from '../src/server/services/evidenceOrigin';

const hypothetical = classifyEvidence('HYPOTHETICAL');
assert.equal(hypothetical.verification, 'NOT_APPLICABLE');
assert.equal(hypothetical.canUseAsConditionalPremise, true);
assert.equal(hypothetical.canServeAsVerifiedExternalSource, false);

const calculation = classifyEvidence('DERIVED_CALCULATION');
assert.equal(calculation.verification, 'NOT_APPLICABLE');
assert.equal(calculation.canServeAsVerifiedExternalSource, false);

const internal = classifyEvidence('INTERNAL_DOCUMENT', true);
assert.equal(internal.verification, 'VERIFIED');
assert.equal(internal.canServeAsVerifiedExternalSource, false);

const external = classifyEvidence('EXTERNAL_SOURCE', true);
assert.equal(external.canServeAsVerifiedExternalSource, true);

const unverified = classifyEvidence('EXTERNAL_SOURCE');
assert.equal(unverified.canServeAsVerifiedExternalSource, false);
console.log('evidence origin classification regression checks passed');
