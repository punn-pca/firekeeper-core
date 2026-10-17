import assert from 'node:assert/strict';
import { inspectGovernedDecision, extractGovernedDecisionEnvelope } from '../src/server/services/governedDecisionEnvelope';

const options = ['primary', 'primary', 'intermediate'].map((type, i) => ({
  id: String(i), title: 'Option ' + i, type,
  benefits: ['benefit'], costs: ['cost'], risks: ['risk'],
  assumptions: ['assumption'], evidenceIds: []
}));
const text = 'Summary\n<governed-decision-json>' + JSON.stringify({ options, evidence: [] }) + '</governed-decision-json>';
assert.equal(extractGovernedDecisionEnvelope(text)?.options.length, 3);
const inspected = inspectGovernedDecision(text, true);
assert(!inspected.quality.issues.includes('INSUFFICIENT_OPTIONS'));
assert(inspected.quality.issues.includes('CONFIDENCE_NOT_MEASURED'));
assert.equal(extractGovernedDecisionEnvelope('no envelope'), null);
assert(inspectGovernedDecision('no envelope', true).quality.issues.includes('INSUFFICIENT_OPTIONS'));
const spoofed = text.replace('"evidence":[]', '"evidence":[{"id":"fake","verified":true,"source":"made up"}]');
assert.equal(extractGovernedDecisionEnvelope(spoofed)?.evidence[0].verified, false);
console.log('Governed decision envelope assertions passed');

const withReference = JSON.stringify({
  options: options.map((o, i) => ({ ...o, evidenceIds: i === 0 ? ['E-1'] : [] })),
  evidence: [{ id: 'E-1', verified: true, source: 'model invented' }],
});
const cited = '<governed-decision-json>' + withReference + '</governed-decision-json>';
const untrusted = inspectGovernedDecision(cited, true, []);
assert(untrusted.quality.issues.includes('UNVERIFIED_EVIDENCE_REFERENCES'));
const trusted = inspectGovernedDecision(cited, true, [{ id: 'E-1', status: 'VERIFIED', source: 'Trusted runtime source' }]);
assert(!trusted.quality.issues.includes('UNVERIFIED_EVIDENCE_REFERENCES'));
const unverified = inspectGovernedDecision(cited, true, [{ id: 'E-1', status: 'UNVERIFIED', source: 'Trusted runtime source' }]);
assert(unverified.quality.issues.includes('UNVERIFIED_EVIDENCE_REFERENCES'));
