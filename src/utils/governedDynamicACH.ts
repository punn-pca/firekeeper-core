import { EvidenceItem } from '../types';
import { calculateGovernedACHHypothesis } from './governedBayesianACH';

export interface GovernedDynamicACHHypothesis {
  id: string;
  claim: string;
  prior: number;
  likelihood: number;
  posterior: number;
  confidence: 'HIGH' | 'MODERATE' | 'LOW';
  rationale: string;
  status: 'Supported' | 'Under_Review' | 'Unconfirmed';
  supportingEvidence: string[];
  counterEvidence: string[];
  requiredEvidence: string[];
  isRootCauseSelected: boolean;
  evidenceIds: string[];
  quarantined: boolean;
}

export interface GovernedDynamicACHResult {
  hypotheses: GovernedDynamicACHHypothesis[];
  hasSufficientEvidence: boolean;
  evidenceSummary: string;
}

/** Only explicit requests activate a minimum; cap work to a bounded audit set. */
export function requestedHypothesisCount(query: string): number {
  const text = String(query || '');
  const match = text.match(/(?:อย่างน้อย|ขั้นต่ำ|จำนวน|ขอ|ระบุ|เสนอ|at least|minimum|give|provide|list)\s*(\d{1,2})\s*(?:สมมติฐาน|hypothes(?:is|es))/i)
    || text.match(/(\d{1,2})\s*(?:สมมติฐาน|hypothes(?:is|es))/i);
  return match ? Math.min(10, Math.max(2, Number(match[1]))) : 0;
}

/**
 * Governed Dynamic ACH adapter.
 *
 * IMPORTANT: source authority/credibility is evidence quality only. It is never
 * promoted to Bayesian P(E|H). A likelihood can affect the posterior only when
 * an EvidenceItem explicitly carries numeric likelihood plus probability provenance.
 */
export function buildGovernedDynamicACH(
  userInput: string,
  evidenceItems: EvidenceItem[] = [],
  missingSignals: string[] = [],
  conflicts: string[] = [],
  requestedMinimum: number = 0
): GovernedDynamicACHResult {
  const safeEvidence = Array.isArray(evidenceItems) ? evidenceItems : [];
  const safeMissing = Array.isArray(missingSignals) ? missingSignals : [];
  const safeConflicts = Array.isArray(conflicts) ? conflicts : [];
  // "Empirical" describes evidence kind, not verification. ACH may only treat
  // evidence as support when verification is explicit; retrieval alone is not support.
  const empirical = safeEvidence.filter((e: any) =>
    (e?.type === 'Empirical' || e?.source === 'attachment') &&
    e?.evidence_status === 'VERIFIED' &&
    Boolean(e?.source) &&
    Boolean(e?.content) &&
    Boolean(e?.sourceUrl || e?.locator || e?.provenance)
  );
  const isConflict = safeConflicts.length > 0;

  const requiredEvidence = safeMissing.length > 0
    ? safeMissing.map((s) => `ข้อมูลตัวแปรที่ขาดหาย: ${s}`)
    : ['ข้อมูลเชิงประจักษ์ที่มี explicit probability provenance สำหรับทดสอบสมมติฐาน'];

  const h1Evidence = empirical.map((e: any) => ({
    id: e.id,
    source: e.source,
    content: e.content,
    likelihood: typeof e.likelihood === 'number' ? e.likelihood : undefined,
    counterLikelihood: typeof e.counterLikelihood === 'number' ? e.counterLikelihood : undefined,
    probabilityProvenance: e.probabilityProvenance
  }));

  const h1 = calculateGovernedACHHypothesis(0.5, h1Evidence, `ACH H1: ${userInput}`);
  const h2 = calculateGovernedACHHypothesis(0.5, [], `ACH H2 alternative: ${userInput}`);

  const makeHypothesis = (
    id: string,
    claim: string,
    result: typeof h1,
    supportingEvidence: string[],
    counterEvidence: string[],
    status: GovernedDynamicACHHypothesis['status']
  ): GovernedDynamicACHHypothesis => ({
    id,
    claim,
    prior: result.prior,
    likelihood: result.likelihood,
    posterior: result.posterior,
    confidence: result.posterior >= 0.70 ? 'HIGH' : result.posterior >= 0.45 ? 'MODERATE' : 'LOW',
    rationale: result.quarantined
      ? 'Bayesian probability is quarantined: source credibility alone cannot supply P(E|H). Explicit probability provenance is required.'
      : `Source-backed Bayesian calculation with declared probability provenance (P(H|E) = ${(result.posterior * 100).toFixed(1)}%).`,
    status,
    supportingEvidence,
    counterEvidence,
    requiredEvidence,
    isRootCauseSelected: false,
    evidenceIds: result.provenance.evidenceIds,
    quarantined: result.quarantined
  });

  const hypotheses = [
    makeHypothesis(
      'hyp-1',
      `สมมติฐานที่ 1 (แนวทางหลัก): ${userInput.slice(0, 100)}`,
      h1,
      empirical.map((e: any) => `${e.source}: ${(e.content || '').slice(0, 120)}`),
      safeConflicts.map((c) => `ข้อขัดแย้ง: ${c}`),
      h1.quarantined ? 'Under_Review' : 'Supported'
    ),
    makeHypothesis(
      'hyp-2',
      'สมมติฐานที่ 2: มีปัจจัยแวดล้อมหรือเงื่อนไขเฉพาะที่ยังต้องตรวจสอบเพิ่มเติม',
      h2,
      isConflict || empirical.length === 0 ? ['ยังมีความไม่แน่นอนที่ต้องตรวจสอบ'] : [],
      empirical.length > 0 ? [`มีหลักฐาน ${empirical.length} รายการในบริบท`] : [],
      'Under_Review'
    )
  ];

  const additionalCandidates = [
    'ผลที่สังเกตอาจเกิดจากคุณภาพหรือความครบถ้วนของข้อมูล',
    'ผลที่สังเกตอาจขึ้นอยู่กับเวลาและลำดับเหตุการณ์',
    'ผลที่สังเกตอาจเกิดจากปัจจัยภายนอกที่ยังไม่ได้ควบคุม',
    'ผลที่สังเกตอาจมีคำอธิบายจากแรงจูงใจของผู้เกี่ยวข้อง',
    'ผลที่สังเกตอาจเกิดจากวิธีวัดหรือคำนิยามที่แตกต่างกัน',
    'ผลที่สังเกตอาจเป็นความสัมพันธ์ร่วมโดยไม่มีเหตุเป็นผล',
    'ผลที่สังเกตอาจสะท้อนข้อจำกัดเฉพาะกลุ่มตัวอย่าง',
    'ผลที่สังเกตอาจเกิดจากหลายปัจจัยร่วมกัน'
  ];
  for (const claim of additionalCandidates.slice(0, Math.max(0, Math.min(10, requestedMinimum) - hypotheses.length))) {
    const number = hypotheses.length + 1;
    const neutral = calculateGovernedACHHypothesis(0.5, [], `ACH H${number}: ${userInput}`);
    hypotheses.push(makeHypothesis(`hyp-${number}`, `สมมติฐานที่ ${number} (รอตรวจสอบ): ${claim}`, neutral, [], [], 'Unconfirmed'));
  }

  return {
    hypotheses,
    hasSufficientEvidence: empirical.length > 0 && hypotheses.some((h) => !h.quarantined),
    evidenceSummary: empirical.length > 0
      ? `พบหลักฐาน ${empirical.length} รายการ แต่ Bayesian likelihood จะเปลี่ยนจาก 0.50 ได้เฉพาะเมื่อมี explicit probability provenance`
      : 'ไม่มีหลักฐานเชิงประจักษ์ — Bayesian hypotheses อยู่ใน epistemic quarantine'
  };
}
