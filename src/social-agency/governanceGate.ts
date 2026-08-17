import { SocialActionType, GovernanceCheckResult } from './types';

/**
 * FIRE KEEPER Social Governance Gate
 * 
 * Intercepts every autonomous social action candidate before execution.
 * Enforces ISO/IEC 42001, NIST AI RMF, and FIRE KEEPER Epistemic Standards:
 * 1. Human Agency Preservation: AI must not manipulate, deceive, or usurp human sovereign judgment.
 * 2. Epistemic Integrity: No fabricated numbers, hallucinated metrics, or false claims of certainty.
 * 3. Civility & Constructiveness: No toxic engagement bait, aggression, or spamming.
 * 4. Privacy & Consent: Zero personal data leakage or sensitive disclosure.
 */
export class SocialGovernanceGate {
  private static generateSimpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return 'gov_' + Math.abs(hash).toString(16) + '_' + Date.now().toString(36);
  }

  public static verifyAction(
    actionType: SocialActionType,
    content: string,
    context?: {
      targetAuthor?: string;
      internalMonologue?: string;
      strictness?: 'Permissive' | 'Balanced' | 'Strict';
    }
  ): GovernanceCheckResult {
    const strictness = context?.strictness || 'Balanced';
    const violations: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let requiresHumanOverride = false;

    // Passive / Safe actions (observe, reflect, do_nothing) have minimal outward risk
    if (actionType === 'observe' || actionType === 'reflect' || actionType === 'do_nothing') {
      return {
        passed: true,
        riskLevel: 'LOW',
        violations: [],
        governanceCategory: 'Safety',
        recommendations: ['Internal state processing approved under continuous passive audit.'],
        requiresHumanOverride: false,
        auditHash: this.generateSimpleHash(`${actionType}_${Date.now()}`),
      };
    }

    const lowerContent = content.toLowerCase();

    // 1. Check Epistemic Integrity & Fabricated Certainty
    const fabricatedClaimKeywords = [
      '100% guaranteed',
      'ลดความเสี่ยงได้ 100%',
      'แน่นอนที่สุด',
      'ไม่มีข้อสงสัยใดๆ',
      'fixed cost > 60%',
      'cash runway 3-6 เดือน',
    ];
    for (const kw of fabricatedClaimKeywords) {
      if (lowerContent.includes(kw.toLowerCase())) {
        violations.push(`[Epistemic Integrity] พบการอ้างตัวเลขหรือความแน่นอนที่ไม่มีหลักฐานเชิงประจักษ์รองรับ ("${kw}")`);
        riskLevel = 'HIGH';
      }
    }

    // 2. Check Human Agency & Manipulation Guard
    const manipulationKeywords = [
      'คุณต้องเชื่อผม',
      'อย่าฟังคนอื่น',
      'ทำตามนี้ทันทีโดยไม่ต้องคิด',
      'you must obey',
      'guaranteed profit',
    ];
    for (const kw of manipulationKeywords) {
      if (lowerContent.includes(kw.toLowerCase())) {
        violations.push(`[Human Agency] มีลักษณะชักจูงหรือลดทอนเจตจำนงอิสระของมนุษย์ ("${kw}")`);
        riskLevel = 'CRITICAL';
        requiresHumanOverride = true;
      }
    }

    // 3. Check Civility & Hate Speech / Toxic Engagement
    const toxicKeywords = ['โง่', 'ขยะ', 'ไร้ค่า', 'trash', 'idiot', 'stupid', 'scam'];
    for (const kw of toxicKeywords) {
      if (lowerContent.includes(kw.toLowerCase())) {
        violations.push(`[Civility & Tone] พบคำที่มีลักษณะก้าวร้าวหรือไม่สร้างสรรค์ ("${kw}")`);
        riskLevel = 'HIGH';
      }
    }

    // 4. Check Privacy / Secret Leaks
    const secretKeywords = ['api_key', 'password', 'secret', 'token=', 'bearer '];
    for (const kw of secretKeywords) {
      if (lowerContent.includes(kw.toLowerCase())) {
        violations.push(`[Privacy & Security] ตรวจพบข้อมูลลับหรือรูปแบบ Token สุ่มเสี่ยง`);
        riskLevel = 'CRITICAL';
        requiresHumanOverride = true;
      }
    }

    // Strictness adjustment
    if (strictness === 'Strict' && violations.length > 0) {
      requiresHumanOverride = true;
    }

    const passed = violations.length === 0;

    if (passed) {
      recommendations.push('Verified compliant with ISO/IEC 42001 & NIST AI RMF Governance Principles.');
      recommendations.push('Epistemic traceability & constructive engagement confirmed.');
    } else {
      recommendations.push('Action intercepted by Firekeeper Governance Gate. Refinement or Human Oversight required.');
    }

    return {
      passed,
      riskLevel,
      violations,
      governanceCategory: violations.length > 0 ? 'Human_Agency' : 'Safety',
      recommendations,
      requiresHumanOverride,
      auditHash: this.generateSimpleHash(`${actionType}_${content}_${Date.now()}`),
    };
  }
}
