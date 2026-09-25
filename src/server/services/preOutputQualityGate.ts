import { governClaimVerification, type GovernedVerificationStatus } from './claimVerificationGovernance';
import { linkClaimEvidence } from '../../utils/claimEvidenceLinker';
import { buildDecisionQualityExtensions, type DecisionQualityExtensions } from './decisionQualityExtensions';

export type ClaimKind = 'OBSERVED_FACT' | 'SOURCE_CLAIM' | 'INTERPRETATION' | 'HYPOTHESIS' | 'RECOMMENDATION' | 'DECISION';

type EvidenceStatus = 'AVAILABLE' | 'MISSING' | 'NOT_APPLICABLE';

export interface PreOutputQualityReport {
  decisionRequired: boolean;
  publicationStatus: 'PASS' | 'REVISED' | 'REVIEW_REQUIRED';
  violations: string[];
  claimLedger: Array<{
    kind: ClaimKind;
    text: string;
    evidenceStatus: EvidenceStatus;
    verificationStatus: GovernedVerificationStatus | 'NOT_APPLICABLE';
    supportingEvidenceIds: string[];
    conflictingEvidenceIds: string[];
  }>;
  recommendationConsistency: { status: 'PASS' | 'WARNING'; warnings: string[] };
  extensions?: DecisionQualityExtensions;
  decisionRecord?: {
    currentRecommendation: string;
    evidenceSupporting: string;
    evidenceAgainst: string;
    unresolvedGaps: string;
    conditionsThatChangeIt: string;
    actionsAllowedNow: string;
    actionsRequiringApproval: string;
    decisionOwner: string;
    reviewTrigger: string;
  };
}

const DECISION_REQUEST = /(ควร|แนะนำ|เลือก|ตัดสินใจ|อนุมัติ|ดำเนินการ|recommend|should|choose|approve|decision)/i;
const HIGH_IMPACT_DOMAIN = /(กฎหมาย|legal|แพทย์|medical|สุขภาพ|รักษา|ลงทุน|investment|การเงิน|financial|ความปลอดภัย|security incident|incident response)/i;
const ABSOLUTE_RECOMMENDATION = /(ควร(?:จะ)?|ต้อง|best|should|recommend)/i;
const CORRUPTION = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/g;
const CAUSAL_LANGUAGE = /(because|therefore|causes?|leads? to|results? in|ส่งผลให้|ทำให้|เนื่องจาก|จึง)/i;
const UNSUPPORTED_SUPERLATIVE = /(ดีที่สุด|สำคัญที่สุด|แน่นอน|always|never|best|most important)/i;

function sentences(text: string): string[] {
  return String(text || '').split(/(?<=[.!?。]|\n)\s+/u).map((value) => value.trim()).filter(Boolean);
}

function classify(sentence: string): ClaimKind {
  if (/(อนุมัติแล้ว|decided|decision owner|ผู้อนุมัติ)/i.test(sentence)) return 'DECISION';
  if (/(ควร|แนะนำ|ต้องดำเนิน|should|recommend)/i.test(sentence)) return 'RECOMMENDATION';
  if (/(อาจ|เป็นไปได้|สมมติฐาน|hypothesis|if )/i.test(sentence)) return 'HYPOTHESIS';
  if (/(ตามแหล่ง|รายงานระบุ|source|อ้างอิง)/i.test(sentence)) return 'SOURCE_CLAIM';
  if (/(หมายความว่า|ตีความ|interpret)/i.test(sentence)) return 'INTERPRETATION';
  return 'OBSERVED_FACT';
}

function firstRecommendation(text: string): string {
  return sentences(text).find((sentence) => ABSOLUTE_RECOMMENDATION.test(sentence)) || 'ยังไม่มีข้อเสนอแนะที่ยืนยันได้';
}

function normalizeEvidence(evidence: Array<unknown>): Array<{ id: string; source?: string; content?: string }> {
  return (Array.isArray(evidence) ? evidence : []).map((item, index) => {
    const value = item as Record<string, unknown>;
    return {
      id: String(value?.id || value?.evidenceId || `evidence-${index + 1}`),
      source: typeof value?.source === 'string' ? value.source : undefined,
      content: String(value?.content || value?.summary || value?.text || ''),
    };
  });
}

function consistencyWarnings(text: string, recommendation: string, conflictsCount: number, missingInfoCount: number): string[] {
  const warnings: string[] = [];
  if (conflictsCount > 0 && !/(เงื่อนไข|ทบทวน|ขัดแย้ง|conditional|review)/i.test(recommendation)) {
    warnings.push('Recommendation does not explicitly acknowledge conflicting evidence.');
  }
  if (missingInfoCount > 0 && /(ทันที|แน่นอน|always|must|ดีที่สุด|best)/i.test(recommendation)) {
    warnings.push('Recommendation is overly certain despite unresolved information gaps.');
  }
  if (/(ห้ามดำเนินการ|do not proceed)/i.test(text) && /(ให้ดำเนินการ|proceed immediately)/i.test(text)) {
    warnings.push('Response contains mutually inconsistent execution guidance.');
  }
  return warnings;
}

function selfAuditWarnings(
  ledger: PreOutputQualityReport['claimLedger'],
  recommendation: string,
  decisionRequired: boolean
): string[] {
  if (!decisionRequired) return [];
  const warnings: string[] = [];
  const recommendationClaim = ledger.find((claim) => claim.kind === 'RECOMMENDATION' && claim.text === recommendation);
  if (recommendationClaim && recommendationClaim.verificationStatus !== 'VERIFIED' && recommendationClaim.verificationStatus !== 'PARTIALLY_VERIFIED') {
    warnings.push('Recommendation is not linked to supporting evidence.');
  }
  if (CAUSAL_LANGUAGE.test(recommendation) && recommendationClaim?.verificationStatus !== 'VERIFIED') {
    warnings.push('Causal recommendation lacks verified causal evidence.');
  }
  if (UNSUPPORTED_SUPERLATIVE.test(recommendation) && recommendationClaim?.verificationStatus !== 'VERIFIED') {
    warnings.push('Comparative or absolute recommendation lacks verified comparison evidence.');
  }
  if (ledger.some((claim) => claim.conflictingEvidenceIds.length > 0)) {
    warnings.push('One or more response claims have conflicting linked evidence.');
  }
  return warnings;
}

/**
 * P0 deterministic pre-publication control. It never fabricates evidence.
 * Claims are classified and linked to evidence before recommendations can be
 * presented as unconditional guidance. High-impact, ungrounded actions are
 * retained as a review-required record rather than an executable instruction.
 */
export function enforcePreOutputQuality(
  rawText: string,
  input: { query: string; evidence: Array<unknown>; conflictsCount?: number; missingInfoCount?: number }
): { text: string; report: PreOutputQualityReport } {
  const decisionRequired = DECISION_REQUEST.test(input.query);
  const violations: string[] = [];
  let text = String(rawText || '').replace(CORRUPTION, '').trim();

  if (!text) {
    return {
      text: 'ต้องทบทวน: ระบบไม่สามารถสร้างคำตอบที่ตรวจสอบได้ในขณะนี้',
      report: {
        decisionRequired,
        publicationStatus: 'REVIEW_REQUIRED',
        violations: ['Output is empty or contains invalid characters'],
        claimLedger: [],
        recommendationConsistency: { status: 'WARNING', warnings: ['No response is available for consistency review.'] },
      },
    };
  }

  const normalizedEvidence = normalizeEvidence(input.evidence);
  const ledger: PreOutputQualityReport['claimLedger'] = sentences(text).slice(0, 80).map((sentence) => {
    const kind = classify(sentence);
    if (kind === 'DECISION') {
      return { kind, text: sentence.slice(0, 240), evidenceStatus: 'NOT_APPLICABLE', verificationStatus: 'NOT_APPLICABLE', supportingEvidenceIds: [], conflictingEvidenceIds: [] };
    }
    const links = linkClaimEvidence(sentence, normalizedEvidence);
    const verification = governClaimVerification({ claim: sentence, evidence: normalizedEvidence, links: links.links });
    const evidenceStatus: EvidenceStatus = verification.status === 'UNVERIFIED' || verification.status === 'CONFLICTING' ? 'MISSING' : 'AVAILABLE';
    return {
      kind,
      text: sentence.slice(0, 240),
      evidenceStatus,
      verificationStatus: verification.status,
      supportingEvidenceIds: verification.supportingEvidenceIds,
      conflictingEvidenceIds: verification.conflictingEvidenceIds,
    };
  });

  const extensions = buildDecisionQualityExtensions({
    query: input.query,
    claims: ledger,
    conflictsCount: input.conflictsCount || 0,
    missingInfoCount: input.missingInfoCount || 0,
  });
  const recommendation = firstRecommendation(text);
  const recommendationClaim = ledger.find((claim) => claim.kind === 'RECOMMENDATION' && claim.text === recommendation);
  const recommendationHasSupport = recommendationClaim?.verificationStatus === 'VERIFIED' || recommendationClaim?.verificationStatus === 'PARTIALLY_VERIFIED';
  const consistency = consistencyWarnings(text, recommendation, input.conflictsCount || 0, input.missingInfoCount || 0);
  const selfAudit = selfAuditWarnings(ledger, recommendation, decisionRequired);
  const needsConditionalScope = decisionRequired && ABSOLUTE_RECOMMENDATION.test(recommendation) && (
    !recommendationHasSupport || (input.conflictsCount || 0) > 0 || (input.missingInfoCount || 0) > 0
  );
  const highImpactNeedsReview = decisionRequired && HIGH_IMPACT_DOMAIN.test(`${input.query}\n${text}`) && !recommendationHasSupport;

  if (needsConditionalScope) {
    violations.push('Recommendation is incomplete, conflicting, or has unresolved gaps; converted to conditional guidance.');
    text = text.replace(recommendation, `คำแนะนำแบบมีเงื่อนไข (ต้องยืนยันตามบริบทและหลักฐาน): ${recommendation}`);
  }
  if (highImpactNeedsReview) violations.push('High-impact domain action requires domain-expert review before execution.');
  violations.push(...consistency, ...selfAudit);
  if ((input.conflictsCount || 0) > 0) violations.push('Conflicting evidence exists; recommendation must remain conditional.');
  if ((input.missingInfoCount || 0) > 0) violations.push('Unresolved information gaps exist.');

  if (highImpactNeedsReview && !/^ต้องทบทวนก่อนดำเนินการ:/u.test(text)) {
    text = `ต้องทบทวนก่อนดำเนินการ: คำแนะนำนี้อยู่ในขอบเขตผลกระทบสูงและยังไม่มีหลักฐานที่เชื่อมโยงเพียงพอ ต้องให้ผู้เชี่ยวชาญเฉพาะทางและผู้มีอำนาจอนุมัติ\n\n${text}`;
  }

  const decisionRecord = decisionRequired ? {
    currentRecommendation: recommendation,
    evidenceSupporting: recommendationHasSupport ? `มีหลักฐานที่เชื่อมโยงกับคำแนะนำ: ${recommendationClaim?.supportingEvidenceIds.join(', ') || 'ต้องตรวจทานก่อนอนุมัติ'}` : 'ยังไม่มีหลักฐานที่เชื่อมโยงโดยตรง',
    evidenceAgainst: (input.conflictsCount || 0) > 0 ? `พบประเด็นขัดแย้ง ${input.conflictsCount} รายการ` : 'ยังไม่พบหลักฐานหักล้างในข้อมูลที่รับเข้า',
    unresolvedGaps: (input.missingInfoCount || 0) > 0 ? `ยังขาดข้อมูล ${input.missingInfoCount} ประเด็น` : 'ต้องยืนยันข้อมูลเฉพาะบริบทก่อนดำเนินการ',
    conditionsThatChangeIt: 'เมื่อพบหลักฐานใหม่ ข้อหักล้าง หรือข้อจำกัดด้านนโยบาย/กฎหมาย',
    actionsAllowedNow: 'รวบรวมและตรวจสอบหลักฐานเพิ่มเติม; เปรียบเทียบทางเลือก',
    actionsRequiringApproval: highImpactNeedsReview ? 'การดำเนินการเชิงปฏิบัติ ต้องให้ผู้เชี่ยวชาญเฉพาะทางและผู้มีอำนาจอนุมัติ' : 'การดำเนินการที่มีผลกระทบ ต้องให้ผู้มีอำนาจอนุมัติ',
    decisionOwner: 'มนุษย์ผู้มีอำนาจตามนโยบายองค์กร',
    reviewTrigger: 'มีหลักฐานใหม่, พบความขัดแย้ง, หรือบริบท/ความเสี่ยงเปลี่ยนแปลง',
  } : undefined;

  if (decisionRecord && !/###\s*Decision Record/i.test(text)) {
    text += `\n\n### Decision Record\n- **Current recommendation:** ${decisionRecord.currentRecommendation}\n- **Evidence supporting it:** ${decisionRecord.evidenceSupporting}\n- **Evidence against it:** ${decisionRecord.evidenceAgainst}\n- **Unresolved gaps:** ${decisionRecord.unresolvedGaps}\n- **Conditions that change it:** ${decisionRecord.conditionsThatChangeIt}\n- **Actions allowed now:** ${decisionRecord.actionsAllowedNow}\n- **Actions requiring approval:** ${decisionRecord.actionsRequiringApproval}\n- **Decision owner:** ${decisionRecord.decisionOwner}\n- **Review trigger:** ${decisionRecord.reviewTrigger}`;
  }

  return {
    text,
    report: {
      decisionRequired,
      publicationStatus: highImpactNeedsReview ? 'REVIEW_REQUIRED' : (violations.length ? 'REVISED' : 'PASS'),
      violations,
      claimLedger: ledger,
      recommendationConsistency: { status: consistency.length ? 'WARNING' : 'PASS', warnings: consistency },
      extensions,
      decisionRecord,
    },
  };
}