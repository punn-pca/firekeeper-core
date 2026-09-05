import { buildDynamicACH } from '../src/server/services/evidenceGovernance';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

// Regression guard: source authority/credibility must never become P(E|H).
// This test intentionally uses high credibility without an explicit likelihood.
const result = buildDynamicACH(
  'ทดสอบขอบเขตความน่าจะเป็น',
  [
    {
      id: 'ev-high-authority',
      source: 'Authoritative source',
      content: 'Evidence with high source credibility but no probability model.',
      credibilityScore: 0.99,
      strength: 'High',
      type: 'Empirical'
    } as any
  ]
);

const h1 = result.hypotheses[0];

assert(h1.likelihood === 0.5, 'High credibility without probability provenance must not change H1 likelihood from the prior.');
assert(h1.posterior === 0.5, 'High credibility without probability provenance must not move the Bayesian posterior.');

console.log('PASS: Dynamic ACH probability boundary — credibility cannot become likelihood.');
