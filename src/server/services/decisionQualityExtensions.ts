import { createHash } from 'node:crypto';

export interface DecisionQualityClaim {
  kind: string;
  text: string;
  evidenceStatus: 'AVAILABLE' | 'MISSING' | 'NOT_APPLICABLE';
  verificationStatus: string;
  supportingEvidenceIds: string[];
  conflictingEvidenceIds: string[];
}

export interface DecisionQualityExtensions {
  actionImpact: Array<{
    action: string;
    objective: string;
    evidenceBasis: string;
    expectedBenefit: string;
    possibleHarm: string;
    reversibility: 'UNKNOWN' | 'POTENTIALLY_REVERSIBLE';
    urgency: 'ASSESS_REQUIRED';
    requiredAuthority: 'HUMAN_APPROVAL_REQUIRED';
    dependencies: string[];
    stopCondition: string;
  }>;
  sequentialEvidencePlan: Array<{
    priority: number;
    question: string;
    whyDiagnostic: string;
    stopCondition: string;
  }>;
  competingHypotheses: {
    status: 'NOT_APPLICABLE' | 'REVIEW_REQUIRED' | 'STRUCTURED';
    hypotheses: Array<{ claim: string; status: 'CANDIDATE' | 'INDEPENDENT_DIMENSION'; diagnosticEvidenceNeeded: string }>;
  };
  recommendationSnapshot: {
    fingerprint: string;
    changeTracking: 'BASELINE_RECORDED';
    changeRule: string;
  };
}

function normalized(value: string): string {
  return String(value || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function tokenize(value: string): Set<string> {
  return new Set(normalized(value).split(/\s+/).filter((token) => token.length > 1));
}

function overlap(left: string, right: string): number {
  const a = tokenize(left);
  const b = tokenize(right);
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.min(a.size, b.size);
}

/**
 * P1/P2 structured controls. These records are deterministic and deliberately
 * do not estimate probability, impact magnitude, or domain-specific outcomes.
 */
export function buildDecisionQualityExtensions(input: {
  query: string;
  claims: DecisionQualityClaim[];
  conflictsCount: number;
  missingInfoCount: number;
}): DecisionQualityExtensions {
  const recommendations = input.claims.filter((claim) => claim.kind === 'RECOMMENDATION');
  const hypotheses = input.claims.filter((claim) => claim.kind === 'HYPOTHESIS');
  const actionImpact = recommendations.slice(0, 5).map((claim) => ({
    action: claim.text,
    objective: 'ต้องยืนยันกับเป้าหมายของผู้ตัดสินใจ',
    evidenceBasis: claim.supportingEvidenceIds.length ? `linked evidence: ${claim.supportingEvidenceIds.join(', ')}` : 'ยังไม่มีหลักฐานที่เชื่อมโยงโดยตรง',
    expectedBenefit: 'ยังไม่ประเมินเชิงปริมาณ; ต้องกำหนดตัวชี้วัดก่อนดำเนินการ',
    possibleHarm: 'ต้องประเมินผลกระทบต่อการดำเนินงาน ผู้ได้รับผลกระทบ และหลักฐาน',
    reversibility: 'UNKNOWN' as const,
    urgency: 'ASSESS_REQUIRED' as const,
    requiredAuthority: 'HUMAN_APPROVAL_REQUIRED' as const,
    dependencies: claim.supportingEvidenceIds.length ? [] : ['หลักฐานที่เชื่อมโยงกับคำแนะนำ'],
    stopCondition: 'หยุดเมื่อพบหลักฐานขัดแย้ง, ขาดอำนาจอนุมัติ, หรือผลกระทบเกินขอบเขตที่ยอมรับได้',
  }));

  const sequentialEvidencePlan = [
    ...(input.conflictsCount > 0 ? [{
      priority: 1,
      question: 'หลักฐานชิ้นใดเป็นต้นทางและตรวจสอบได้ เพื่อแยกข้อขัดแย้ง?',
      whyDiagnostic: 'ช่วยแยกข้ออ้างที่ขัดแย้งออกจากกันโดยไม่เลือกข้างก่อนเวลาอันควร',
      stopCondition: 'หยุดเมื่อยืนยันความสัมพันธ์ของหลักฐานต่อข้ออ้างไม่ได้',
    }] : []),
    ...(input.missingInfoCount > 0 ? [{
      priority: input.conflictsCount > 0 ? 2 : 1,
      question: 'ข้อมูลใดที่หายไปและหากได้มาจะเปลี่ยนคำแนะนำ?',
      whyDiagnostic: 'เก็บเฉพาะข้อมูลที่เปลี่ยนการตัดสินใจได้จริง',
      stopCondition: 'หยุดเมื่อข้อมูลใหม่ไม่เปลี่ยนทางเลือกหรือเงื่อนไขของคำแนะนำ',
    }] : []),
    ...(recommendations.some((claim) => claim.evidenceStatus === 'MISSING') ? [{
      priority: input.conflictsCount + input.missingInfoCount + 1,
      question: 'หลักฐานใดรองรับหรือหักล้างคำแนะนำโดยตรง?',
      whyDiagnostic: 'ลดช่องว่างระหว่างคำแนะนำกับหลักฐาน',
      stopCondition: 'หยุดเมื่อไม่พบหลักฐานที่เชื่อมโยงโดยตรงและส่งต่อผู้เชี่ยวชาญ',
    }] : []),
  ];

  const structuredHypotheses = hypotheses.slice(0, 6).map((claim, index, all) => ({
    claim: claim.text,
    status: all.some((other, otherIndex) => {
      const left = normalized(claim.text);
      const right = normalized(other.text);
      return otherIndex !== index && (overlap(claim.text, other.text) >= 0.65 || left.includes(right) || right.includes(left));
    })
      ? 'INDEPENDENT_DIMENSION' as const
      : 'CANDIDATE' as const,
    diagnosticEvidenceNeeded: 'หลักฐานที่สนับสนุนสมมติฐานนี้มากกว่าสมมติฐานทางเลือกอย่างชัดเจน',
  }));

  const stableRecord = JSON.stringify({
    query: normalized(input.query),
    recommendations: recommendations.map((claim) => normalized(claim.text)),
    supportingEvidence: recommendations.flatMap((claim) => claim.supportingEvidenceIds).sort(),
  });

  return {
    actionImpact,
    sequentialEvidencePlan,
    competingHypotheses: {
      status: structuredHypotheses.length === 0 ? 'NOT_APPLICABLE' : (structuredHypotheses.some((item) => item.status === 'INDEPENDENT_DIMENSION') ? 'REVIEW_REQUIRED' : 'STRUCTURED'),
      hypotheses: structuredHypotheses,
    },
    recommendationSnapshot: {
      fingerprint: createHash('sha256').update(stableRecord).digest('hex'),
      changeTracking: 'BASELINE_RECORDED',
      changeRule: 'คำแนะนำเปลี่ยนได้เมื่อ evidence link, conflict, information gap, หรือเงื่อนไขนโยบายเปลี่ยนเท่านั้น',
    },
  };
}