import { adversarialResultToRelations, AdversarialVerifierResult, parseAdversarialVerifierResult, verifyClaimAgainstEvidence } from '../src/server/services/adversarialEvidenceVerifier';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

const partial: AdversarialVerifierResult = {
  entailment: [{ subclaim: 'Firekeeper launched in 2026', evidenceIds: ['ev-1'], explanation: 'Explicitly stated.' }],
  contradiction: [],
  silence: [{ subclaim: 'Firekeeper has more than 10,000 users', missingInformation: 'No user count is provided.', explanation: 'Evidence is silent.' }],
  paraphrase_failures: [],
  reasoning: {
    supportedComponents: ['launch year'],
    unsupportedComponents: ['user count'],
    contradictedComponents: [],
    overallVerdict: 'PARTIALLY_ENTAILED'
  }
};

assert(adversarialResultToRelations(partial, new Set(['ev-1'])).length === 0, 'partial entailment with silence must not create SUPPORTS');

const paraphraseFailure: AdversarialVerifierResult = {
  entailment: [{ subclaim: 'The pilot improved latency', evidenceIds: ['ev-2'], explanation: 'Improvement is stated.' }],
  contradiction: [],
  silence: [],
  paraphrase_failures: [{ claimText: 'The pilot dramatically improved latency', unsupportedAddition: 'dramatically', explanation: 'Evidence does not support magnitude.' }],
  reasoning: {
    supportedComponents: ['latency improved'],
    unsupportedComponents: ['magnitude'],
    contradictedComponents: [],
    overallVerdict: 'ENTAILED'
  }
};

assert(adversarialResultToRelations(paraphraseFailure, new Set(['ev-2'])).length === 0, 'unsupported paraphrase must block SUPPORTS');

const entailed: AdversarialVerifierResult = {
  entailment: [{ subclaim: 'Firekeeper launched in 2026', evidenceIds: ['ev-1'], explanation: 'Explicitly stated.' }],
  contradiction: [],
  silence: [],
  paraphrase_failures: [],
  reasoning: {
    supportedComponents: ['launch year'],
    unsupportedComponents: [],
    contradictedComponents: [],
    overallVerdict: 'ENTAILED'
  }
};

assert(adversarialResultToRelations(entailed, new Set(['ev-1']))[0]?.relation === 'SUPPORTS', 'fully entailed atomic claim may create SUPPORTS');

const contradicted: AdversarialVerifierResult = {
  entailment: [],
  contradiction: [{ subclaim: 'GDP grew 5%', evidenceIds: ['ev-3'], explanation: 'Evidence states 4%.' }],
  silence: [],
  paraphrase_failures: [],
  reasoning: {
    supportedComponents: [],
    unsupportedComponents: [],
    contradictedComponents: ['GDP grew 5%'],
    overallVerdict: 'CONTRADICTED'
  }
};

assert(adversarialResultToRelations(contradicted, new Set(['ev-3']))[0]?.relation === 'CONTRADICTS', 'semantic contradiction must produce CONTRADICTS');


const parsed = parseAdversarialVerifierResult(JSON.stringify(entailed), new Set(['ev-1']));
assert(parsed.entailment[0]?.evidenceIds[0] === 'ev-1', 'valid evidence IDs must survive parser validation');

const unknownId = parseAdversarialVerifierResult(JSON.stringify({
  ...entailed,
  entailment: [{ ...entailed.entailment[0], evidenceIds: ['invented-id'] }]
}), new Set(['ev-1']));
assert(unknownId.entailment[0]?.evidenceIds.length === 0, 'unknown evidence IDs must be discarded');

const productionVerified = await verifyClaimAgainstEvidence(
  'Firekeeper launched in 2026',
  [{ id: 'ev-1', source: 'release record', content: 'Firekeeper launched in 2026.' }],
  { provider: 'test' },
  async () => ({ text: JSON.stringify(entailed) })
);
assert(productionVerified?.relations[0]?.relation === 'SUPPORTS', 'production verifier must convert fully entailed semantic result into SUPPORTS');

const malformed = await verifyClaimAgainstEvidence(
  'Firekeeper launched in 2026',
  [{ id: 'ev-1', source: 'release record', content: 'Firekeeper launched in 2026.' }],
  { provider: 'test' },
  async () => ({ text: 'not-json' })
);
assert(malformed === null, 'malformed verifier output must fail closed');

const providerFailure = await verifyClaimAgainstEvidence(
  'Firekeeper launched in 2026',
  [{ id: 'ev-1', source: 'release record', content: 'Firekeeper launched in 2026.' }],
  { provider: 'test' },
  async () => { throw new Error('provider unavailable'); }
);
assert(providerFailure === null, 'provider failure must fail closed');

console.log('PASS: adversarial verifier semantic, parser, and fail-closed boundaries.');
