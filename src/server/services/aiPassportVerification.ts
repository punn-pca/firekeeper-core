import { governClaimVerification, GovernedVerificationStatus, VerificationMethod } from './claimVerificationGovernance';
import { linkClaimEvidence, ClaimEvidenceLink } from '../../utils/claimEvidenceLinker';

export type VerificationFinding = {
  type: 'FACT' | 'INFERENCE' | 'ASSUMPTION' | 'UNSUPPORTED' | 'CONFLICT';
  text: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
};

export type AIPassportEvidence = {
  id: string;
  source?: string;
  content?: string;
};

export type AIPassportVerificationResult = {
  mode: 'AI_PASSPORT_VERIFICATION';
  provider: string;
  question: string;
  response: string;
  score: number;
  findings: VerificationFinding[];
  checks: {
    response_present: boolean;
    uncertainty_disclosed: boolean;
    evidence_present: boolean;
    human_agency_preserved: boolean;
    claim_evidence_governed: boolean;
  };
  decision: 'READY_FOR_REVIEW' | 'NEEDS_EVIDENCE' | 'HIGH_RISK';
  evidenceIds: string[];
  claimEvidenceLinks: ClaimEvidenceLink[];
  verificationStatus: GovernedVerificationStatus;
  verificationMethod: VerificationMethod;
};

/**
 * Lightweight deterministic first-pass verification.
 *
 * The pasted AI response is never treated as evidence. If caller-supplied
 * evidence is available, it is passed through the same claim-evidence linker
 * and verification gate used by the production research pipeline.
 */
export function verifyAIPassportResponse(input: {
  question: string;
  response: string;
  provider?: string;
  evidence?: AIPassportEvidence[];
  verificationMethod?: VerificationMethod;
}): AIPassportVerificationResult {
  const question = String(input.question || '').trim();
  const response = String(input.response || '').trim();
  const lower = response.toLowerCase();
  const findings: VerificationFinding[] = [];

  const uncertaintyDisclosed = /(uncertain|uncertainty|unknown|insufficient evidence|cannot verify|may be|might be|ไม่แน่ใจ|ไม่ทราบ|หลักฐานไม่เพียงพอ|อาจจะ)/i.test(response);
  const evidencePresent = /(source|sources|citation|citations|reference|references|หลักฐาน|แหล่งที่มา|อ้างอิง|http[s]?:\/\/)/i.test(response);
  const agencyPreserved = !/(you must|you should definitely|do this now|ต้องทำทันที|ควรทำแน่นอน|ให้ทำทันที)/i.test(response);
  const evidence = Array.isArray(input.evidence) ? input.evidence.filter((item) => item && item.id) : [];

  let claimEvidenceLinks: ClaimEvidenceLink[] = [];
  let verificationStatus: GovernedVerificationStatus = 'UNVERIFIED';
  let verificationMethod: VerificationMethod = input.verificationMethod || 'NONE';
  let evidenceIds: string[] = [];

  if (!response) {
    findings.push({ type: 'UNSUPPORTED', text: 'No AI response was supplied.', severity: 'HIGH' });
  } else if (!evidencePresent) {
    findings.push({ type: 'UNSUPPORTED', text: 'No explicit evidence or source signal was detected. Verify externally before relying on factual claims.', severity: 'MEDIUM' });
  }

  if (!uncertaintyDisclosed && /(definitely|certainly|always|never|แน่นอน|100%|ไม่มีข้อสงสัย)/i.test(lower)) {
    findings.push({ type: 'ASSUMPTION', text: 'The response uses high-certainty language without an explicit uncertainty boundary.', severity: 'HIGH' });
  }

  if (!agencyPreserved) {
    findings.push({ type: 'INFERENCE', text: 'The response contains directive language. Human decision authority should be preserved.', severity: 'MEDIUM' });
  }

  if (question && response.length < 40) {
    findings.push({ type: 'UNSUPPORTED', text: 'The response is unusually short for the supplied question; check whether material reasoning or evidence is missing.', severity: 'LOW' });
  }

  if (evidence.length > 0 && question) {
    const linking = linkClaimEvidence(question, evidence);
    claimEvidenceLinks = linking.links;
    const governed = governClaimVerification({
      claim: question,
      evidence,
      links: claimEvidenceLinks,
      verificationMethod
    });
    verificationStatus = governed.status;
    verificationMethod = governed.verificationMethod;
    evidenceIds = governed.evidenceIds;

    if (governed.status === 'CONFLICTING') {
      findings.push({ type: 'CONFLICT', text: governed.reason, severity: 'HIGH' });
    } else if (governed.status === 'UNVERIFIED') {
      findings.push({ type: 'UNSUPPORTED', text: governed.reason, severity: 'MEDIUM' });
    } else if (governed.status === 'PARTIALLY_VERIFIED') {
      findings.push({ type: 'FACT', text: governed.reason, severity: 'LOW' });
    }
  }

  const deductions = findings.reduce((n, f) => n + (f.severity === 'HIGH' ? 25 : f.severity === 'MEDIUM' ? 12 : 5), 0);
  const score = Math.max(0, Math.min(100, 100 - deductions));
  const decision = score < 60
    ? 'HIGH_RISK'
    : (verificationStatus === 'UNVERIFIED' || !evidencePresent ? 'NEEDS_EVIDENCE' : 'READY_FOR_REVIEW');

  return {
    mode: 'AI_PASSPORT_VERIFICATION', provider: input.provider || 'other', question, response,
    score, findings,
    checks: {
      response_present: Boolean(response),
      uncertainty_disclosed: uncertaintyDisclosed,
      evidence_present: evidencePresent,
      human_agency_preserved: agencyPreserved,
      claim_evidence_governed: evidence.length > 0 && question.length > 0,
    },
    decision,
    evidenceIds,
    claimEvidenceLinks,
    verificationStatus,
    verificationMethod,
  };
}
