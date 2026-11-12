import { type GovernedVerificationStatus } from './claimVerificationGovernance';
import { assessClaimEvidence, buildDecisionGapInventory, type ClaimTruthStatus, type DecisionGapInventory } from './evidenceGovernanceCore';
import { buildDecisionQualityExtensions, type DecisionQualityExtensions } from './decisionQualityExtensions';

export type ClaimKind = 'OBSERVED_FACT' | 'USER_STATED' | 'SOURCE_CLAIM' | 'MODEL_KNOWLEDGE' | 'INTERPRETATION' | 'ASSUMPTION' | 'HYPOTHESIS' | 'ESTIMATE' | 'UNKNOWN' | 'RECOMMENDATION' | 'DECISION';

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
    /** Claim truth status is distinct from evidence verification status. */
    claimStatus: ClaimTruthStatus | 'NOT_APPLICABLE';
    /** Traceable source metadata for evidence explicitly linked to this claim. */
    evidenceReferences: Array<{ id: string; source?: string; sourceUrl?: string; locator?: string; documentId?: string; publishedAt?: string }>;
    /** Null means this gate has no calibrated per-claim confidence measurement. */
    confidence: number | null;
    limitations: string[];
    supportingEvidenceIds: string[];
    conflictingEvidenceIds: string[];
  }>;
  recommendationConsistency: { status: 'PASS' | 'WARNING'; warnings: string[] };
  /** Included only when the caller has inspected context and supplied a real inventory. */
  decisionGapInventory?: DecisionGapInventory;
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
    uncertainty: string;
    decisionStatus: 'DRAFT' | 'PROPOSED' | 'REVIEW_REQUIRED';
  };
}

/**
 * Reject visibly truncated Markdown before a generated response is treated as publishable.
 * This is a structural guard, not a semantic guarantee that the answer is correct.
 */
export function validateMarkdownCompleteness(markdown: string): string[] {
  const source = String(markdown || '');
  const lines = source.split(/\r?\n/);
  const issues: string[] = [];
  let fenceOpen = false;

  for (const line of lines) {
    if (/^\s*\x60\x60\x60/.test(line) || /^\s*~~~/.test(line)) fenceOpen = !fenceOpen;
  }
  if (fenceOpen) issues.push('Markdown code fence is not closed.');

  const isSeparator = (line: string) =>
    /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);

  for (let i = 0; i < lines.length - 1; i++) {
    const header = lines[i].trim();
    if (!header.startsWith('|') || !isSeparator(lines[i + 1])) continue;
    const cellCount = (line: string) => {
      const trimmed = line.trim();
      const cells = trimmed.split('|');
      if (trimmed.startsWith('|')) cells.shift();
      if (trimmed.endsWith('|')) cells.pop();
      return cells.length;
    };
    const expectedColumns = cellCount(lines[i + 1]);
    if (cellCount(lines[i]) !== expectedColumns) {
      issues.push('Markdown table header at line ' + (i + 1) + ' has an inconsistent column count.');
    }
    let j = i + 2;
    while (j < lines.length && lines[j].trim().startsWith('|')) {
      if (cellCount(lines[j]) !== expectedColumns) {
        issues.push('Markdown table row at line ' + (j + 1) + ' is incomplete: expected ' + expectedColumns + ' columns.');
      }
      j++;
    }
    i = j - 1;
  }

  const lastNonEmpty = [...lines].reverse().find((line) => line.trim().length > 0)?.trim() || '';
  if (lastNonEmpty && !lastNonEmpty.startsWith('|') &&
      /(?:\b(?:and|or|with|because|that|which|to|for|including|แจ้งให้|และให้|เพื่อให้|พร้อม|หรือ|และ|แต่|เพราะ|เนื่องจาก|ให้))\s*$/iu.test(lastNonEmpty)) {
    issues.push('Response appears to end with an unfinished connector or clause.');
  }
  return [...new Set(issues)];
}

// A full Decision Record is reserved for an actual choice/action/approval request.
// Analytical prompts often contain words such as "ควรตรวจสอบ" or "should examine";
// those must not be upgraded into an enterprise decision workflow.
const DECISION_REQUEST = /(ช่วย(?:ฉัน|ผม|เรา)?(?:เลือก|ตัดสินใจ)|(?:ฉัน|ผม|เรา)?(?:ควร|ต้องการ|อยาก)(?:จะ)?(?:เลือก|ซื้อ|ขาย|ลงทุน|อนุมัติ|ดำเนินการ)|แนะนำ(?:ว่า)?(?:ให้|ว่า)?(?:ควร)?(?:เลือก|ซื้อ|ขาย|ลงทุน|ดำเนินการ)|ช่วย(?:พิจารณา)?(?:อนุมัติ|ดำเนินการ)|ให้ดำเนินการ(?:ตาม|เรื่อง)|recommend (?:which|whether|a course of action)|help me decide|make (?:a|the) decision|should (?:i|we) (?:choose|buy|sell|invest|approve|proceed)|choose (?:between|which)|approve (?:this|the|these)|decide (?:between|whether|which))/i;
const HIGH_IMPACT_DOMAIN = /(กฎหมาย|legal|แพทย์|medical|สุขภาพ|รักษา|ลงทุน|investment|การเงิน|financial|ความปลอดภัย|security incident|incident response)/i;
const ENGINEERING_CONTEXT = /(trace|review|inspect|debug|test|ทดสอบ|architecture|โค้ด|code|repo|repository|ไฟล์|file|deploy|deployment|production)/i;
const INSPECTION_ONLY_ACTION = /(อ่าน|ดู|ตรวจ|ตรวจสอบ|review|inspect|debug|test|ทดสอบ|วิเคราะห์)/i;
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

/**
 * Extract natural-language claims without treating Markdown syntax as content.
 * Fenced code is excluded from prose claims; table rows are retained with their
 * header labels. Extraction is structural only; it never verifies truth.
 */
export function extractAtomicClaims(markdown: string): string[] {
  const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
  const output: string[] = [];
  let fence: string | null = null;
  const cells = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '')
    .split(/(?<!\\)\|/).map((cell) => cell.replace(/\\\|/g, '|')
      .replace(/<[^>]*>/g, ' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1').replace(/\s+/g, ' ').trim());
  const separator = (line: string) => /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const marker = line.match(/^\s*(\x60{3,}|~{3,})/);
    if (marker) { const char = marker[1][0]; fence = fence === char ? null : (fence || char); continue; }
    if (fence) continue;
    const value = line.trim();
    if (!value || /^#{1,6}\s+/.test(value) || /^(?:[-*_]\s*){3,}$/.test(value)) continue;

    if (value.startsWith('|') && i + 1 < lines.length && separator(lines[i + 1])) {
      const headers = cells(value);
      i++;
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
        const row = cells(lines[++i]);
        if (row.length !== headers.length) {
          if (row.some(Boolean)) output.push(row.filter(Boolean).join(' — '));
          continue;
        }
        const claim = row.map((cell, n) => cell ? headers[n] ? headers[n] + ': ' + cell : cell : '')
          .filter(Boolean).join('; ');
        if (claim) output.push(claim);
      }
      continue;
    }

    const prose = value.replace(/^[-+*]\s+/, '').replace(/^\d+[.)]\s+/, '')
      .replace(/<[^>]*>/g, ' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/\s+/g, ' ').trim();
    if (!prose || /^\|?\s*:?-{3,}/.test(prose)) continue;
    output.push(...prose.split(/(?<=[.!?。])\s+/u).map((part) => part.trim()).filter(Boolean));
  }
  return output.slice(0, 200);
}

function sentences(text: string): string[] {
  return extractAtomicClaims(text);
}
function isMarkdownHeading(sentence: string): boolean {
  return /^#{1,6}\s+/u.test(String(sentence || '').trim());
}

function hasRecommendationIntent(sentence: string): boolean {
  const value = String(sentence || '').trim();
  if (!value || isMarkdownHeading(value)) return false;
  // "ควรตรวจสอบ/ควรเก็บข้อมูล/ข้อมูลที่ควร..." are evidence-gathering language,
  // not recommendations to choose or execute an action.
  if (/(?:ข้อมูล|หลักฐาน|สิ่ง|ประเด็น)ที่ควร(?:ตรวจสอบ|เก็บ|หา|ยืนยัน)|ควร(?:ตรวจสอบ|เก็บข้อมูล|หาข้อมูล|ยืนยันข้อมูล|วิเคราะห์|พิจารณาข้อมูล)/i.test(value)) return false;
  return /(ควร(?:เลือก|ซื้อ|ขาย|ลงทุน|ดำเนินการ|ทำ|ทดลอง|เริ่ม|หยุด|เปลี่ยน)|แนะนำ(?:ว่า)?(?:ควร)?|ต้องดำเนิน|should (?:choose|buy|sell|invest|proceed|do|try|pilot|start|stop|change)|recommend)/i.test(value);
}

function classify(sentence: string): ClaimKind {
  const value = String(sentence || '').trim();
  if (/(อนุมัติแล้ว|decided|decision owner|ผู้อนุมัติ)/i.test(value)) return 'DECISION';
  if (hasRecommendationIntent(value)) return 'RECOMMENDATION';
  if (/\[(?:FACT|VERIFIED_FACT)\]/i.test(value)) return 'OBSERVED_FACT';
  if (/\[(?:USER_STATED|USER_INPUT)\]|(?:คุณ|ผู้ใช้)ระบุว่า|จากข้อมูลที่คุณให้/i.test(value)) return 'USER_STATED';
  if (/\[(?:MODEL_KNOWLEDGE|GENERAL_KNOWLEDGE)\]/i.test(value)) return 'MODEL_KNOWLEDGE';
  if (/\[ASSUMPTION\]|สมมติฐาน|ตั้งสมมติฐาน/i.test(value)) return 'ASSUMPTION';
  if (/\[ESTIMATE\]|ประมาณการ|โดยประมาณ|คาดว่าเป็นจำนวน/i.test(value)) return 'ESTIMATE';
  if (/(อาจ|เป็นไปได้|สมมติว่า|hypothesis|if )/i.test(value)) return 'HYPOTHESIS';
  if (/(ตามแหล่ง|รายงานระบุ|source|อ้างอิง)/i.test(value)) return 'SOURCE_CLAIM';
  if (/(หมายความว่า|ตีความ|interpret)/i.test(value)) return 'INTERPRETATION';
  // Never silently label unclassified generated prose as an observed FACT.
  return 'UNKNOWN';
}
function firstRecommendation(text: string): string {
  return sentences(text).find((sentence) => hasRecommendationIntent(sentence)) || 'ยังไม่มีข้อเสนอแนะที่ยืนยันได้';
}

function normalizeEvidence(evidence: Array<unknown>): Array<{ id: string; source?: string; content?: string; sourceUrl?: string; locator?: string; documentId?: string; publishedAt?: string }> {
  return (Array.isArray(evidence) ? evidence : []).map((item, index) => {
    const value = item as Record<string, unknown>;
    return {
      id: String(value?.id || value?.evidenceId || `evidence-${index + 1}`),
      source: typeof value?.source === 'string' ? value.source : undefined,
      content: String(value?.content || value?.summary || value?.text || ''),
      sourceUrl: typeof value?.sourceUrl === 'string' ? value.sourceUrl : (typeof value?.url === 'string' ? value.url : undefined),
      locator: typeof value?.locator === 'string' ? value.locator : undefined,
      documentId: typeof value?.documentId === 'string' ? value.documentId : undefined,
      publishedAt: typeof value?.publishedAt === 'string' ? value.publishedAt : undefined,
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
  input: { query: string; evidence: Array<unknown>; conflictsCount?: number; missingInfoCount?: number; approvalRequired?: boolean; decisionGapInventory?: DecisionGapInventory }
): { text: string; report: PreOutputQualityReport } {
  const explicitDecisionRequest = DECISION_REQUEST.test(input.query);
  const engineeringInspectionOnly = ENGINEERING_CONTEXT.test(input.query)
    && INSPECTION_ONLY_ACTION.test(input.query)
    && !explicitDecisionRequest;
  // Inspection-only engineering work is analytical. An explicit choice/action
  // request still remains a decision even when the same query also says
  // "review", "analyze", "test", or mentions code/repo/deployment.
  const decisionRequired = explicitDecisionRequest && !engineeringInspectionOnly;
  // Impact is derived from the user's requested action/domain, never from model output.
  // This prevents generated prose from recursively triggering its own approval gate.
  const highImpactDomain = HIGH_IMPACT_DOMAIN.test(input.query) && !engineeringInspectionOnly;
  const violations: string[] = [];
  let text = String(rawText || '').replace(CORRUPTION, '').trim();
  const gapInventory = input.decisionGapInventory ? buildDecisionGapInventory(input.decisionGapInventory) : undefined;

  if (!text) {
    return {
      text: 'ต้องทบทวน: ระบบไม่สามารถสร้างคำตอบที่ตรวจสอบได้ในขณะนี้',
      report: {
        decisionRequired,
        publicationStatus: 'REVIEW_REQUIRED',
        violations: ['Output is empty or contains invalid characters'],
        claimLedger: [],
        recommendationConsistency: { status: 'WARNING', warnings: ['No response is available for consistency review.'] },
        decisionGapInventory: gapInventory,
      },
    };
  }

  const markdownIssues = validateMarkdownCompleteness(text);
  if (markdownIssues.length) {
    violations.push(...markdownIssues.map((issue) => 'Output structure incomplete: ' + issue));
  }

  const normalizedEvidence = normalizeEvidence(input.evidence);
  const ledger: PreOutputQualityReport['claimLedger'] = sentences(text).map((sentence) => {
    const kind = classify(sentence);
    if (kind === 'DECISION') {
      return { kind, text: sentence.slice(0, 240), evidenceStatus: 'NOT_APPLICABLE', verificationStatus: 'NOT_APPLICABLE', claimStatus: 'NOT_APPLICABLE', evidenceReferences: [], confidence: null, limitations: ['Not a factual claim requiring evidence verification.'], supportingEvidenceIds: [], conflictingEvidenceIds: [] };
    }
    const assessment = assessClaimEvidence({ claim: sentence, evidence: normalizedEvidence });
    const supportingEvidenceIds = assessment.links
      .filter((link) => link.relation === 'SUPPORTS')
      .map((link) => link.evidenceId);
    const conflictingEvidenceIds = assessment.links
      .filter((link) => link.relation === 'CONTRADICTS')
      .map((link) => link.evidenceId);
    // Evidence availability and verification are separate epistemic dimensions.
    // A linked support/conflict is available evidence even when it is not VERIFIED.
    // Verification status continues to control whether a recommendation is treated
    // as sufficiently grounded for unconditional guidance.
    const evidenceStatus: EvidenceStatus =
      supportingEvidenceIds.length > 0 || conflictingEvidenceIds.length > 0
        ? 'AVAILABLE'
        : 'MISSING';
    const linkedIds = new Set(assessment.links.map((link) => link.evidenceId));
    const evidenceReferences = normalizedEvidence
      .filter((item) => linkedIds.has(item.id))
      .map(({ id, source, sourceUrl, locator, documentId, publishedAt }) => ({ id, source, sourceUrl, locator, documentId, publishedAt }));
    return {
      kind,
      text: sentence.slice(0, 240),
      evidenceStatus,
      verificationStatus: assessment.verificationStatus,
      claimStatus: assessment.claimStatus,
      evidenceReferences,
      confidence: null,
      limitations: assessment.claimStatus === 'CONTRADICTED'
        ? ['Traceable linked evidence contradicts this claim; review the cited source and context.']
        : assessment.claimStatus === 'UNVERIFIED'
          ? ['No governed verification result establishes this claim as verified.']
          : ['Verification is limited to the linked evidence and configured verification method; it is not external certification.'],
      supportingEvidenceIds,
      conflictingEvidenceIds,
    };
  });

  const extensions = buildDecisionQualityExtensions({
    query: input.query,
    claims: ledger,
    conflictsCount: input.conflictsCount || 0,
    missingInfoCount: input.missingInfoCount || 0,
    approvalRequired: Boolean(input.approvalRequired && decisionRequired),
  });
  const recommendation = firstRecommendation(text);
  const recommendationClaim = ledger.find((claim) => claim.kind === 'RECOMMENDATION' && claim.text === recommendation);
  const recommendationHasSupport = recommendationClaim?.verificationStatus === 'VERIFIED' || recommendationClaim?.verificationStatus === 'PARTIALLY_VERIFIED';
  const consistency = consistencyWarnings(text, recommendation, input.conflictsCount || 0, input.missingInfoCount || 0);
  if (hasRecommendationIntent(recommendation) && !recommendationHasSupport) {
    consistency.push('Recommendation lacks governed semantic evidence support.');
  }
  const selfAudit = selfAuditWarnings(ledger, recommendation, decisionRequired);
  const needsConditionalScope = decisionRequired && hasRecommendationIntent(recommendation) && (
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

  const unresolvedGapItems = Array.from(new Set([
    ...(gapInventory?.missingData || []),
    ...(gapInventory?.verificationRequired || []),
    ...((input.conflictsCount || 0) > 0 ? [`หลักฐานที่ขัดแย้ง ${input.conflictsCount} รายการต้องตรวจสอบ`] : []),
    ...((input.missingInfoCount || 0) > 0 && !gapInventory ? [`ข้อมูลที่จำเป็นต่อข้อสรุปยังไม่ครบ (อย่างน้อย ${input.missingInfoCount} ประเด็น)`] : []),
  ].map((item) => String(item || '').trim()).filter(Boolean)));

  const approvalRequiredByPolicy = Boolean(input.approvalRequired) || highImpactDomain;
  const decisionStatus: 'DRAFT' | 'PROPOSED' | 'REVIEW_REQUIRED' =
    approvalRequiredByPolicy || !recommendationHasSupport || unresolvedGapItems.length > 0
      ? 'REVIEW_REQUIRED'
      : 'PROPOSED';

  const uncertaintyReason = [
    !recommendationHasSupport ? 'คำแนะนำยังไม่มีหลักฐานที่ผ่านการยืนยันเพียงพอ' : '',
    unresolvedGapItems.length > 0 ? `ยังมีช่องว่างที่มีนัยสำคัญ ${unresolvedGapItems.length} รายการ` : '',
    (input.conflictsCount || 0) > 0 ? 'มีหลักฐานหรือข้อค้นพบที่ขัดแย้งกัน' : '',
  ].filter(Boolean).join('; ') || 'ไม่มีข้อจำกัดด้านหลักฐานที่ระบุได้จากข้อมูลที่รับเข้า';

  const decisionRecord = decisionRequired ? {
    currentRecommendation: recommendation,
    evidenceSupporting: recommendationHasSupport
      ? `มีหลักฐานที่เชื่อมโยงกับคำแนะนำ: ${recommendationClaim?.supportingEvidenceIds.join(', ') || 'ต้องตรวจทานก่อนอนุมัติ'}`
      : 'NONE',
    evidenceAgainst: (input.conflictsCount || 0) > 0
      ? `พบประเด็นขัดแย้ง ${input.conflictsCount} รายการ`
      : 'NONE',
    unresolvedGaps: unresolvedGapItems.length > 0
      ? unresolvedGapItems.join('; ')
      : 'NONE',
    conditionsThatChangeIt: highImpactDomain
      ? 'เมื่อพบหลักฐานใหม่ ข้อหักล้าง หรือข้อจำกัดที่เกี่ยวข้องกับการตัดสินใจนี้'
      : 'เมื่อพบหลักฐานใหม่ ข้อหักล้าง หรือสมมติฐานสำคัญเปลี่ยนแปลง',
    actionsAllowedNow: highImpactNeedsReview || approvalRequiredByPolicy
      ? 'รวบรวมและตรวจสอบหลักฐานเพิ่มเติม; เปรียบเทียบทางเลือกก่อนดำเนินการ'
      : 'ตรวจสอบข้อมูลที่ยังขาดและเปรียบเทียบทางเลือกตามบริบท',
    actionsRequiringApproval: approvalRequiredByPolicy
      ? 'การดำเนินการเชิงปฏิบัติที่มีผลกระทบตาม policy ต้องให้ผู้มีอำนาจอนุมัติ'
      : 'NONE — ไม่มี consequential action ที่ระบุว่าต้องอนุมัติจากข้อมูลที่รับเข้า',
    decisionOwner: approvalRequiredByPolicy ? 'ผู้มีอำนาจตัดสินใจที่เกี่ยวข้อง' : 'ผู้ใช้หรือผู้รับผิดชอบการตัดสินใจ',
    reviewTrigger: 'มีหลักฐานใหม่, พบความขัดแย้ง, หรือบริบท/ความเสี่ยงเปลี่ยนแปลง',
    uncertainty: `${uncertaintyReason}; ต้องตรวจสอบต่อ: ${unresolvedGapItems.length > 0 ? unresolvedGapItems.join('; ') : 'ยืนยันหลักฐานและบริบทที่ใช้ประกอบคำแนะนำ'}`,
    decisionStatus,
  } : undefined;

  if (decisionRecord && markdownIssues.length === 0 && !/###\s*Decision Record/i.test(text)) {
    text += `\n\n### Decision Record\n- **Current recommendation:** ${decisionRecord.currentRecommendation}\n- **Evidence supporting it:** ${decisionRecord.evidenceSupporting}\n- **Evidence against it:** ${decisionRecord.evidenceAgainst}\n- **Unresolved gaps:** ${decisionRecord.unresolvedGaps}\n- **Conditions that change it:** ${decisionRecord.conditionsThatChangeIt}\n- **Actions allowed now:** ${decisionRecord.actionsAllowedNow}\n- **Actions requiring approval:** ${decisionRecord.actionsRequiringApproval}\n- **Decision owner:** ${decisionRecord.decisionOwner}\n- **Review trigger:** ${decisionRecord.reviewTrigger}
- **Uncertainty:** ${decisionRecord.uncertainty}
- **Decision status:** ${decisionRecord.decisionStatus}`;
  }

  return {
    text,
    report: {
      decisionRequired,
      publicationStatus: highImpactNeedsReview || markdownIssues.length > 0 ? 'REVIEW_REQUIRED' : (violations.length ? 'REVISED' : 'PASS'),
      violations,
      claimLedger: ledger,
      recommendationConsistency: { status: consistency.length ? 'WARNING' : 'PASS', warnings: consistency },
      decisionGapInventory: input.decisionGapInventory ? buildDecisionGapInventory(input.decisionGapInventory) : undefined,
      extensions,
      decisionRecord,
    },
  };
}
