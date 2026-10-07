import { adversarialResultToRelations, AdversarialVerifierResult } from '../src/server/services/adversarialEvidenceVerifier';

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

console.log('PASS: adversarial verifier silence and paraphrase boundaries.');
