export type VerificationFinding = {
  type: 'FACT' | 'INFERENCE' | 'ASSUMPTION' | 'UNSUPPORTED' | 'CONFLICT';
  text: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
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
  };
  decision: 'READY_FOR_REVIEW' | 'NEEDS_EVIDENCE' | 'HIGH_RISK';
};

/**
 * Lightweight, deterministic first-pass verification. It deliberately does
 * not claim that a citation is true; authoritative evidence validation belongs
 * to Firekeeper's existing evidence/research pipeline.
 */
export function verifyAIPassportResponse(input: {
  question: string;
  response: string;
  provider?: string;
}): AIPassportVerificationResult {
  const question = String(input.question || '').trim();
  const response = String(input.response || '').trim();
  const lower = response.toLowerCase();
  const findings: VerificationFinding[] = [];

  const uncertaintyDisclosed = /(uncertain|uncertainty|unknown|insufficient evidence|cannot verify|may be|might be|ไม่แน่ใจ|ไม่ทราบ|หลักฐานไม่เพียงพอ|อาจจะ)/i.test(response);
  const evidencePresent = /(source|sources|citation|citations|reference|references|หลักฐาน|แหล่งที่มา|อ้างอิง|http[s]?:\/\/)/i.test(response);
  const agencyPreserved = !/(you must|you should definitely|do this now|ต้องทำทันที|ควรทำแน่นอน|ให้ทำทันที)/i.test(response);

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

  const deductions = findings.reduce((n, f) => n + (f.severity === 'HIGH' ? 25 : f.severity === 'MEDIUM' ? 12 : 5), 0);
  const score = Math.max(0, Math.min(100, 100 - deductions));
  const decision = score < 60 ? 'HIGH_RISK' : (!evidencePresent ? 'NEEDS_EVIDENCE' : 'READY_FOR_REVIEW');

  return {
    mode: 'AI_PASSPORT_VERIFICATION', provider: input.provider || 'other', question, response,
    score, findings,
    checks: {
      response_present: Boolean(response),
      uncertainty_disclosed: uncertaintyDisclosed,
      evidence_present: evidencePresent,
      human_agency_preserved: agencyPreserved,
    },
    decision,
  };
}
