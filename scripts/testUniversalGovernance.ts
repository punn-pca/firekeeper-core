import assert from 'node:assert/strict';
import {
  checkUniversalPipelineCompleteness,
  evaluateUniversalEvidence,
  resolveUniversalControl,
  StructuredHypothesisOutputSchema,
  UniversalDecisionObjectSchema,
} from '../src/server/services/universalGovernance';

const evidence = evaluateUniversalEvidence([
  { id: 'direct', claim: 'alpha beta gamma', content: 'alpha beta gamma', source: 'source', sourceUrl: 'https://example.org/item' },
  { id: 'irrelevant', claim: 'alpha beta gamma', content: 'unrelated material about another subject', source: 'source', sourceUrl: 'https://example.org/other' },
], { now: new Date('2026-01-01T00:00:00.000Z') });
assert.deepEqual(evidence.acceptedEvidenceIds, ['direct']);
assert.deepEqual(evidence.rejectedEvidenceIds, ['irrelevant']);
assert.equal(evidence.has_usable_evidence, true);
assert.equal(evidence.quarantine_required, false);

const empty = evaluateUniversalEvidence([]);
assert.equal(empty.has_usable_evidence, false);
assert.equal(empty.quarantine_required, true);

const stale = evaluateUniversalEvidence([
  { id: 'old', claim: 'alpha beta', content: 'alpha beta', source: 'source', sourceUrl: 'https://example.org/old', temporalSensitive: true, publishedAt: '2000-01-01T00:00:00.000Z' },
], { now: new Date('2026-01-01T00:00:00.000Z') });
assert.equal(stale.evidence[0].usable, false);
assert.ok(stale.evidence[0].reasons.includes('STALE_OR_UNDATED'));

const medium = resolveUniversalControl({
  confidence: null, epistemicQuarantineActive: false, has_usable_evidence: true,
  criticalDecisionGap: false, highImpact: false, highUncertainty: false, pipeline_incomplete: false,
});
assert.equal(medium.controlLevel, 'MEDIUM');
assert.equal(medium.quarantine_required, true);

const high = resolveUniversalControl({
  confidence: 0.8, epistemicQuarantineActive: false, has_usable_evidence: true,
  criticalDecisionGap: true, highImpact: false, highUncertainty: false, pipeline_incomplete: false,
});
assert.equal(high.controlLevel, 'HIGH');
assert.equal(high.escalation_required, true);

const incomplete = checkUniversalPipelineCompleteness(['EVIDENCE_GATHERING', 'GOVERNANCE_GATE']);
assert.equal(incomplete.pipeline_incomplete, true);
assert.deepEqual(incomplete.missing_stages, ['EVIDENCE_QUALITY_GATE', 'HYPOTHESIS_GENERATION', 'RISK_UNCERTAINTY', 'HUMAN_AGENCY_CHECK']);

assert.equal(StructuredHypothesisOutputSchema.safeParse({
  hypotheses: [{ id: 'H1', statement: 'A claim', supporting_evidence_ids: [], contradicting_evidence_ids: [], status: 'untested' }],
}).success, true);
assert.equal(StructuredHypothesisOutputSchema.safeParse({ hypotheses: [{ id: 'H1', statement: 'missing fields' }] }).success, false);

const validDecision = {
  options: [{ id: 'A', title: 'Option A', type: 'advisory', benefits: [], costs: [], risks: [], assumptions: [], evidenceIds: [] }],
  recommendation: { optionId: 'A', rationale: 'Compare before deciding', conditions: [], status: 'ADVISORY_ONLY' },
};
assert.equal(UniversalDecisionObjectSchema.safeParse(validDecision).success, true);
assert.equal(UniversalDecisionObjectSchema.safeParse({
  ...validDecision, recommendation: { ...validDecision.recommendation, optionId: 'missing' },
}).success, false);

console.log('Universal governance contract tests passed.');
