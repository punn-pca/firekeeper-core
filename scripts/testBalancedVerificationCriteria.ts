import { calculateBalancedConfidence, evaluateBalancedClaim } from '../src/server/services/balancedVerificationCriteria';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

const base = {
  text: 'Annual revenue was 20 million',
  category: 'FACT' as const,
  fullContentRetrieved: true,
  hasPublishOrRefreshDate: true,
};

const v0 = evaluateBalancedClaim({ ...base, fullContentRetrieved: false, sources: [{ sourceId: 's1', domain: 'example.com' }] });
assert(v0.verificationLevel === 'V0', 'snippet-only evidence must remain V0');

const v1 = evaluateBalancedClaim({ ...base, sources: [{ sourceId: 's1', domain: 'one.example' }] });
assert(v1.verificationLevel === 'V1', 'one dated full-content source should reach V1 only');

const v2 = evaluateBalancedClaim({
  ...base,
  sources: [
    { sourceId: 's1', domain: 'one.example' },
    { sourceId: 's2', domain: 'two.example' },
  ],
});
assert(v2.verificationLevel === 'V2', 'two distinct source domains should reach V2');

const numericNoPrimary = evaluateBalancedClaim({
  ...base,
  numericClaim: true,
  sources: [
    { sourceId: 's1', domain: 'one.example' },
    { sourceId: 's2', domain: 'two.example' },
    { sourceId: 's3', domain: 'three.example' },
  ],
});
assert(numericNoPrimary.verificationLevel === 'V2', 'numeric claims cannot reach V3 without primary evidence');

const v3Primary = evaluateBalancedClaim({
  ...base,
  numericClaim: true,
  sources: [
    { sourceId: 's1', domain: 'one.example', primary: true },
    { sourceId: 's2', domain: 'two.example' },
  ],
});
assert(v3Primary.verificationLevel === 'V3', 'V2 plus a primary source should reach V3 for a numeric claim');

const contradiction = evaluateBalancedClaim({
  ...base,
  category: 'CONTRADICTION',
  hasUnresolvedContradiction: true,
  sources: [{ sourceId: 's1', domain: 'one.example', primary: true }],
});
assert(contradiction.blocked && contradiction.verificationLevel === 'V0' &&
  contradiction.category === 'CONTRADICTION', 'unresolved contradiction must block upgrades');

const inference = evaluateBalancedClaim({
  ...base,
  category: 'INFERENCE',
  isInference: true,
  sources: [
    { sourceId: 's1', domain: 'one.example', primary: true },
    { sourceId: 's2', domain: 'two.example' },
    { sourceId: 's3', domain: 'three.example' },
  ],
});
assert(inference.verificationLevel === 'V1', 'inference must be capped at V1');

const marketShare = evaluateBalancedClaim({
  ...base,
  marketShareOrDominance: true,
  sources: [
    { sourceId: 's1', domain: 'one.example' },
    { sourceId: 's2', domain: 'two.example' },
  ],
});
assert(marketShare.category === 'UNCERTAINTY' && marketShare.blocked,
  'market-share/dominance claim without primary source must become UNCERTAINTY');

const score = calculateBalancedConfidence({
  claims: [
    { claimId: 'a', verificationLevel: 'V1', category: 'FACT' },
    { claimId: 'b', verificationLevel: 'V2', category: 'FACT' },
    { claimId: 'c', verificationLevel: 'V3', category: 'FACT' },
    { claimId: 'c', verificationLevel: 'V3', category: 'FACT' }, // duplicate id is counted once
    { claimId: 'd', verificationLevel: 'V0', category: 'CONTRADICTION', hasUnresolvedContradiction: true },
    { claimId: 'e', verificationLevel: 'V0', category: 'FACT', hasCriticalMissingInformation: true },
  ],
});
assert(score.counts.V1 === 1 && score.counts.V2 === 1 && score.counts.V3 === 1,
  'confidence counts must de-duplicate claim IDs');
assert(score.score === 23, 'confidence score should apply 8 + 15 + 22 - 12 - 10 = 23');

const capped = calculateBalancedConfidence({
  claims: Array.from({ length: 20 }, (_, index) => ({
    claimId: `v1-${index}`,
    verificationLevel: 'V1' as const,
    category: 'FACT' as const,
  })),
});
assert(capped.score === 75 && capped.capApplied === 75, 'score without any V3 must be capped at 75');

console.log('Balanced Verification Criteria tests passed.');
