import { buildDecisionQualityExtensions } from '../src/server/services/decisionQualityExtensions';

function expect(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const result = buildDecisionQualityExtensions({
  query: 'ควรดำเนินการอย่างไร',
  claims: [
    { kind: 'RECOMMENDATION', text: 'ควรระงับการดำเนินการชั่วคราว', evidenceStatus: 'MISSING', verificationStatus: 'UNVERIFIED', supportingEvidenceIds: [], conflictingEvidenceIds: [] },
    { kind: 'HYPOTHESIS', text: 'อาจเกิดจากการตั้งค่าระบบ', evidenceStatus: 'MISSING', verificationStatus: 'UNVERIFIED', supportingEvidenceIds: [], conflictingEvidenceIds: [] },
    { kind: 'HYPOTHESIS', text: 'อาจเกิดจากการตั้งค่าระบบเดิม', evidenceStatus: 'MISSING', verificationStatus: 'UNVERIFIED', supportingEvidenceIds: [], conflictingEvidenceIds: [] },
  ],
  conflictsCount: 1,
  missingInfoCount: 2,
});

expect(result.actionImpact.length === 1, 'Action impact schema must be created per recommendation');
expect(result.actionImpact[0].requiredAuthority === 'AUTHORITY_ASSESSMENT_REQUIRED', 'Recommendations must assess authority without assuming Human Approval by default');
expect(result.sequentialEvidencePlan.length >= 3, 'Evidence plan must prioritize conflicts, gaps, and unlinked recommendations');
expect(result.competingHypotheses.status === 'REVIEW_REQUIRED', 'Overlapping hypotheses must not be treated as independent competitors');
expect(result.recommendationSnapshot.fingerprint.length === 64, 'Recommendation snapshot must have a stable SHA-256 fingerprint');

const policyBound = buildDecisionQualityExtensions({
  query: 'ควรดำเนินการอย่างไร',
  claims: [
    { kind: 'RECOMMENDATION', text: 'ควรระงับการดำเนินการชั่วคราว', evidenceStatus: 'MISSING', verificationStatus: 'UNVERIFIED', supportingEvidenceIds: [], conflictingEvidenceIds: [] },
  ],
  conflictsCount: 0,
  missingInfoCount: 1,
  approvalRequired: true,
});
expect(policyBound.actionImpact[0].requiredAuthority === 'HUMAN_APPROVAL_REQUIRED', 'Explicit approval policy must require Human Approval');

console.log('P1/P2 decision quality extension tests passed.');