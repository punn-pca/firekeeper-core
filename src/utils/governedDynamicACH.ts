import { EvidenceItem } from '../types';
import { calculateGovernedACHHypothesis } from './governedBayesianACH';

export interface GovernedDynamicACHHypothesis {
  id: string;
  claim: string;
  prior: number | null;
  likelihood: number | null;
  posterior: number | null;
  confidence: 'HIGH' | 'MODERATE' | 'LOW' | 'UNKNOWN';
  rationale: string;
  status: 'Supported' | 'Under_Review' | 'Unconfirmed';
  supportingEvidence: string[];
  /** Retrieved material retained for analysis with an explicit epistemic label; not proof of support. */
  contextEvidence: string[];
  limitations: string[];
  counterEvidence: string[];
  requiredEvidence: string[];
  isRootCauseSelected: boolean;
  evidenceIds: string[];
  contextEvidenceIds: string[];
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
  // Retain traceable material regardless of verification state. Verification changes
  // how an item may be described, not whether it remains available as context.
  const availableEvidence = safeEvidence.filter((e: any) => {
    const explicitWebSource = typeof e?.sourceUrl === 'string' && /^https?:\/\/[^\s]+$/i.test(e.sourceUrl.trim());
    const traceableDocument = Boolean(String(e?.locator || '').trim() || String(e?.documentId || '').trim());
    return (e?.type === 'Empirical' || e?.source === 'attachment') &&
      Boolean(e?.source) &&
      Boolean(e?.content) &&
      (explicitWebSource || traceableDocument);
  });
  const verifiedEvidence = availableEvidence.filter((e: any) => e?.evidence_status === 'VERIFIED');
  const contextEvidence = availableEvidence.map((e: any) => {
    const status = e?.evidence_status || 'UNVERIFIED';
    const limitation = status === 'VERIFIED' ? 'VERIFIED' : status === 'CONFLICTING' ? 'CONFLICTING — review required' : status === 'PARTIALLY_VERIFIED' ? 'PARTIALLY VERIFIED — limited scope' : 'UNVERIFIED — not established as fact';
    return `[${limitation}] ${e.source}: ${(e.content || '').slice(0, 240)}`;
  });
  const evidenceLimitations = [
    ...availableEvidence.filter((e: any) => e?.evidence_status !== 'VERIFIED').map((e: any) => `${e.id}: ${e.evidence_status || 'UNVERIFIED'}; available as context, not verified support.`),
    ...(availableEvidence.length === 0 ? ['No traceable evidence items were retrieved.'] : []),
    ...(availableEvidence.some((e: any) => !e?.probabilityProvenance) ? ['Evidence quality or source credibility does not establish Bayesian likelihood; no empirical posterior is inferred from those fields.'] : [])
  ];
  const isConflict = safeConflicts.length > 0;

  const requiredEvidence = safeMissing.length > 0
    ? safeMissing.map((s) => `ข้อมูลตัวแปรที่ขาดหาย: ${s}`)
    : ['ข้อมูลเชิงประจักษ์ที่มี explicit probability provenance สำหรับทดสอบสมมติฐาน'];

  const h1Evidence = verifiedEvidence.map((e: any) => ({
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
    contextEvidence: string[],
    limitations: string[],
    counterEvidence: string[],
    status: GovernedDynamicACHHypothesis['status']
  ): GovernedDynamicACHHypothesis => ({
    id,
    claim,
    prior: result.prior,
    likelihood: result.likelihood,
    posterior: result.posterior,
    confidence: result.quarantined || result.posterior === null || !['CALIBRATED', 'SOURCE_BACKED'].includes(result.provenance.status) ? 'UNKNOWN' : result.posterior >= 0.70 ? 'HIGH' : result.posterior >= 0.45 ? 'MODERATE' : 'LOW',
    rationale: result.quarantined
      ? 'Retrieved information remains available as context. Bayesian posterior is not established because admissible probability provenance is missing or incomplete; confidence is UNKNOWN.'
      : `Bayesian calculation uses explicitly declared probability provenance (P(H|E) = ${(result.posterior * 100).toFixed(1)}%); interpret according to provenance status.`,
    status,
    supportingEvidence,
    contextEvidence,
    limitations,
    counterEvidence,
    requiredEvidence,
    isRootCauseSelected: false,
    evidenceIds: result.provenance.evidenceIds,
    contextEvidenceIds: availableEvidence.map((e: any) => e.id),
    quarantined: result.quarantined
  });

  const isDecisionQuery = /(?:เลือก(?:ทำอะไร|งานอะไร|อาชีพอะไร|สายงานอะไร|ทางไหน)|ทำงานอะไรดี|อาชีพอะไรดี|เลือกอะไรดี|ไหนดี|ตัดสินใจ|ควร(?:เลือก|ทำอะไร)|แนะนำ(?:ว่า)?(?:ควร)?(?:เลือก|ทำอะไร))/i.test(userInput);
  const decisionCandidates = [
    'งานด้าน AI / Data / Software Engineering',
    'งานสายอาชีพเดิมที่ใช้ AI เป็นตัวเพิ่มประสิทธิภาพ',
    'งานด้านธุรกิจ / Operations / Project ที่ใช้ AI เป็นเครื่องมือ',
    'งานด้าน Creative / Design / Content ที่ผสาน AI',
    'งานที่ต้องใช้ทักษะมนุษย์สูง เช่น การสื่อสาร การดูแลลูกค้า การสอน หรือการประสานงาน'
  ];
  const hypotheses = isDecisionQuery
    ? decisionCandidates.map((claim, index) => {
        const id = `hyp-${index + 1}`;
        const result = { prior: null, likelihood: null, posterior: null, quarantined: true, provenance: { evidenceIds: [] } } as typeof h1;
        return makeHypothesis(
          id,
          `ทางเลือก ${String.fromCharCode(65 + index)}: ${claim}`,
          result,
          [],
          contextEvidence,
          evidenceLimitations,
          [],
          'Under_Review'
        );
      })
    : [
        makeHypothesis(
          'hyp-1',
          `สมมติฐานที่ 1 (แนวทางหลัก): ${userInput.slice(0, 100)}`,
          h1,
          verifiedEvidence.map((e: any) => `[VERIFIED] ${e.source}: ${(e.content || '').slice(0, 120)}`),
          contextEvidence,
          evidenceLimitations,
          safeConflicts.map((c) => `ข้อขัดแย้ง: ${c}`),
          h1.quarantined || verifiedEvidence.length === 0 ? 'Under_Review' : 'Supported'
        ),
        makeHypothesis(
          'hyp-2',
          'สมมติฐานที่ 2: มีปัจจัยแวดล้อมหรือเงื่อนไขเฉพาะที่ยังต้องตรวจสอบเพิ่มเติม',
          h2,
          isConflict || availableEvidence.length === 0 ? ['ยังมีความไม่แน่นอนที่ต้องตรวจสอบ'] : [],
          contextEvidence,
          evidenceLimitations,
          availableEvidence.length > 0 ? [`มีข้อมูล ${availableEvidence.length} รายการในบริบท; ไม่ถือเป็นหลักฐานสนับสนุนโดยอัตโนมัติ`] : [],
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
    const neutral = { prior: null, likelihood: null, posterior: null, quarantined: true, provenance: { evidenceIds: [] } } as typeof h1;
    hypotheses.push(makeHypothesis(`hyp-${number}`, `สมมติฐานที่ ${number} (รอตรวจสอบ): ${claim}`, neutral, [], [], evidenceLimitations, [], 'Unconfirmed'));
  }

  return {
    hypotheses,
    hasSufficientEvidence: verifiedEvidence.length > 0 && hypotheses.some((h) => !h.quarantined),
    evidenceSummary: `เก็บข้อมูลที่ตรวจสอบย้อนกลับได้ ${availableEvidence.length} รายการไว้พิจารณา (${verifiedEvidence.length} VERIFIED, ${availableEvidence.length - verifiedEvidence.length} ยังมีข้อจำกัด); ข้อมูลที่ยังไม่ยืนยันใช้เป็นบริบทได้ แต่ไม่ถูกยกระดับเป็นข้อเท็จจริงหรือ Bayesian likelihood`,
  };
}
