import { type GovernedVerificationStatus } from './claimVerificationGovernance';
import { assessClaimEvidence } from './evidenceGovernanceCore';
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

// A full Decision Record is reserved for an actual choice/action/approval request.
// Analytical prompts often contain words such as "ควรตรวจสอบ" or "should examine";
// those must not be upgraded into an enterprise decision workflow.
const DECISION_REQUEST = /(ช่วย(?:ฉัน|ผม|เรา)?(?:เลือก|ตัดสินใจ)|ควร(?:เลือก|ซื้อ|ขาย|ลงทุน|อนุมัติ|ดำเนินการ|ทำอย่างไร|ทำอะไร)|แนะนำ(?:ว่า)?(?:ควร)?(?:เลือก|ซื้อ|ขาย|ลงทุน|ดำเนินการ)|ตัดสินใจ|อนุมัติ|ให้ดำเนินการ|recommend (?:which|whether|a course of action)|should (?:i|we) (?:choose|buy|sell|invest|approve|proceed)|choose (?:between|which)|approve|decision)/i;
const HIGH_IMPACT_DOMAIN = /(กฎหมาย|legal|แพทย์|medical|สุขภาพ|รักษา|ลงทุน|investment|การเงิน|financial|ความปลอดภัย|security incident|incident response)/i;
const LOW_RISK_ENGINEERING_ACTION = /(อ่าน|ดู|ตรวจ|ตรวจสอบ|trace|review|inspect|draft|ร่าง|วิเคราะห์|debug|test|ทดสอบ|architecture|โค้ด|code|repo|repository|ไฟล์|file)/i;
const ABSOLUTE_RECOMMENDATION = /(ควร(?:จะ)?|ต้อง|best|should|recommend)/i;
const CORRUPTION = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/g;
const CAUSAL_LANGUAGE = /(because|therefore|causes?|leads? to|results? in|ส่งผลให้|ทำให้|เนื่องจาก|จึง)/i;
const UNSUPPORTED_SUPERLATIVE = /(ดีที่สุด|สำคัญที่สุด|แน่นอน|always|never|best|most important)/i;
const HAN_CHARACTERS = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/g;

/** Deterministic QA for public Thai articles. Code, URLs and taxonomy tags are ignored. */
export function validateThaiArticlePurity(markdown: string): { valid: boolean; offendingTokens: string[]; reason?: string } {
  let prose = String(markdown || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\[[A-Z0-9_\-\s]{2,30}\]/g, ' ');
  const matches = prose.match(HAN_CHARACTERS) || [];
  const offendingTokens = Array.from(new Set(matches)).slice(0, 20);
  return offendingTokens.length
    ? { valid: false, offendingTokens, reason: 'Thai article contains Han/CJK characters in natural-language prose.' }
    : { valid: true, offendingTokens: [] };
}

/** Prevent a taxonomy label from being mentioned only in an introductory disclaimer. */
export function validateArticleTaxonomy(markdown: string): { valid: boolean; issues: string[] } {
  const text = String(markdown || '');
  const issues: string[] = [];
  const hypothesisCount = (text.match(/\[HYPOTHESIS\]/g) || []).length;
  if (hypothesisCount === 1 && /\[HYPOTHESIS\]/.test(text.slice(0, 900))) {
    issues.push('[HYPOTHESIS] is declared in the introduction but not used for an actual claim.');
  }
  return { valid: issues.length === 0, issues };
}

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
  // Impact is derived from the user's requested action/domain, never from model output.
  // This prevents generated prose from recursively triggering its own approval gate.
  const highImpactDomain = HIGH_IMPACT_DOMAIN.test(input.query) && !LOW_RISK_ENGINEERING_ACTION.test(input.query);
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
    const assessment = assessClaimEvidence({ claim: sentence, evidence: normalizedEvidence });
    const evidenceStatus: EvidenceStatus = assessment.verificationStatus === 'UNVERIFIED' || assessment.verificationStatus === 'CONFLICTING' ? 'MISSING' : 'AVAILABLE';
    return {
      kind,
      text: sentence.slice(0, 240),
      evidenceStatus,
      verificationStatus: assessment.verificationStatus,
      supportingEvidenceIds: assessment.links.filter((link) => link.relation === 'SUPPORTS').map((link) => link.evidenceId),
      conflictingEvidenceIds: assessment.links.filter((link) => link.relation === 'CONTRADICTS').map((link) => link.evidenceId),
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
  const highImpactNeedsReview = decisionRequired && highImpactDomain && !recommendationHasSupport;

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
    conditionsThatChangeIt: highImpactDomain
      ? 'เมื่อพบหลักฐานใหม่ ข้อหักล้าง หรือข้อจำกัดที่เกี่ยวข้องกับการตัดสินใจนี้'
      : 'เมื่อพบหลักฐานใหม่ ข้อหักล้าง หรือสมมติฐานสำคัญเปลี่ยนแปลง',
    actionsAllowedNow: highImpactNeedsReview
      ? 'รวบรวมและตรวจสอบหลักฐานเพิ่มเติม; เปรียบเทียบทางเลือกก่อนดำเนินการ'
      : 'ตรวจสอบข้อมูลที่ยังขาดและเปรียบเทียบทางเลือกตามบริบท',
    actionsRequiringApproval: highImpactNeedsReview ? 'การดำเนินการเชิงปฏิบัติ ต้องให้ผู้เชี่ยวชาญเฉพาะทางและผู้มีอำนาจอนุมัติ' : 'NOT_REQUIRED',
    decisionOwner: highImpactNeedsReview ? 'ผู้มีอำนาจตัดสินใจที่เกี่ยวข้อง' : 'ผู้ใช้หรือผู้รับผิดชอบการตัดสินใจ',
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
