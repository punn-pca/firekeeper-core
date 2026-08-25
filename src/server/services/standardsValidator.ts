/**
 * Authoritative Standards & Citation Version Registry
 * FIRE KEEPER - Epistemic Integrity & Standards Verification Engine
 *
 * Ensures all references to international standards (e.g., NIST, ISO, OWASP)
 * strictly cite active, current revisions and prevents citing superseded versions.
 */

export interface AuthoritativeStandard {
  id: string;
  code: string;
  title: string;
  titleTh: string;
  activeRevision: string;
  publicationYear: number | string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'UNDER_REVIEW';
  officialUrl: string;
  doi?: string;
  domain: 'Cybersecurity' | 'AI Governance' | 'Privacy' | 'Risk Management' | 'Incident Response';
  supersededRevisions: string[];
  deprecationNote?: string;
  keyUpdates?: string;
  regexPatterns: RegExp[];
}

export const AUTHORITATIVE_STANDARDS: Record<string, AuthoritativeStandard> = {
  NIST_SP_800_61: {
    id: 'NIST-SP-800-61',
    code: 'NIST SP 800-61 Rev. 3',
    title: 'Incident Response Recommendations and Considerations for Cybersecurity Risk Management',
    titleTh: 'ข้อเสนอแนะและข้อพิจารณาการตอบสนองต่อเหตุการณ์ความมั่นคงปลอดภัยไซเบอร์ (NIST SP 800-61 Rev. 3)',
    activeRevision: 'Rev. 3',
    publicationYear: 2024,
    status: 'ACTIVE',
    officialUrl: 'https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf',
    doi: '10.6028/NIST.SP.800-61r3',
    domain: 'Incident Response',
    supersededRevisions: ['Rev. 2', 'Rev. 1', 'Rev 2', 'Rev 1', 'r2', 'r1', '800-61 Rev. 2', '800-61r2'],
    deprecationNote: 'NIST SP 800-61 Rev. 2 (สิงหาคม 2012) ถูกยกเลิกและแทนที่อย่างเป็นทางการโดย NIST SP 800-61 Rev. 3',
    keyUpdates: 'ขยายขอบเขตจากเดิมที่เป็นเพียง Computer Security Incident Handling สู่การผสาน Incident Response เข้ากับกรอบ Cybersecurity Risk Management ตาม NIST CSF 2.0 ครอบคลุมวงจรการเตรียมความพร้อม การประสานงานระหว่างหน่วยงาน และการรับมือวิกฤตความมั่นคงปลอดภัยไซเบอร์ระดับองค์กร',
    regexPatterns: [
      /nist\s*(?:sp\s*)?800-61\s*(?:rev\.?\s*2|r2)\b/gi,
      /nist\s*special\s*publication\s*800-61\s*(?:revision\s*2|rev\.?\s*2)/gi,
      /800-61\s*(?:rev\.?\s*2|r2)\b/gi
    ]
  },
  NIST_CSF: {
    id: 'NIST-CSF',
    code: 'NIST CSF 2.0',
    title: 'The NIST Cybersecurity Framework 2.0',
    titleTh: 'กรอบการรักษาความมั่นคงปลอดภัยไซเบอร์ NIST CSF 2.0',
    activeRevision: '2.0',
    publicationYear: 2024,
    status: 'ACTIVE',
    officialUrl: 'https://doi.org/10.6028/NIST.CSWP.29',
    domain: 'Cybersecurity',
    supersededRevisions: ['1.1', '1.0', 'v1.1', 'v1.0', 'CSF 1.1', 'CSF 1.0'],
    deprecationNote: 'NIST CSF 1.1 ถูกแทนที่โดย NIST CSF 2.0 (กุมภาพันธ์ 2024) ซึ่งเพิ่มฟังก์ชัน GOVERN',
    keyUpdates: 'เพิ่มฟังก์ชัน GOVERN (GV) เพื่อรวมบทบาทการกำกับดูแลและยุทธศาสตร์องค์กรเข้ากับ Identify, Protect, Detect, Respond, Recover',
    regexPatterns: [
      /nist\s*csf\s*(?:v?1\.1|v?1\.0)\b/gi,
      /cybersecurity\s*framework\s*(?:v?1\.1|v?1\.0)\b/gi
    ]
  },
  NIST_AI_RMF: {
    id: 'NIST-AI-RMF',
    code: 'NIST AI 100-1 (NIST AI RMF 1.0)',
    title: 'Artificial Intelligence Risk Management Framework (AI RMF 1.0)',
    titleTh: 'กรอบการบริหารความเสี่ยงปัญญาประดิษฐ์ NIST AI RMF 1.0',
    activeRevision: '1.0',
    publicationYear: 2023,
    status: 'ACTIVE',
    officialUrl: 'https://doi.org/10.6028/NIST.AI.100-1',
    domain: 'AI Governance',
    supersededRevisions: [],
    keyUpdates: 'กำหนด 4 ฟังก์ชันหลัก: GOVERN, MAP, MEASURE, MANAGE เพื่อสร้าง Trustworthy AI',
    regexPatterns: [
      /nist\s*ai\s*rmf(?:\s*1\.0)?\b/gi,
      /nist\s*ai\s*100-1\b/gi
    ]
  },
  NIST_SP_800_53: {
    id: 'NIST-SP-800-53',
    code: 'NIST SP 800-53 Rev. 5',
    title: 'Security and Privacy Controls for Information Systems and Organizations',
    titleTh: 'มาตรการควบคุมความมั่นคงปลอดภัยและความเป็นส่วนตัว NIST SP 800-53 Rev. 5',
    activeRevision: 'Rev. 5',
    publicationYear: 2020,
    status: 'ACTIVE',
    officialUrl: 'https://doi.org/10.6028/NIST.SP.800-53r5',
    domain: 'Cybersecurity',
    supersededRevisions: ['Rev. 4', 'Rev. 3', 'Rev 4', 'Rev 3', 'r4', 'r3'],
    deprecationNote: 'NIST SP 800-53 Rev. 4 ถูกยกเลิกและแทนที่โดย Rev. 5',
    regexPatterns: [
      /nist\s*(?:sp\s*)?800-53\s*(?:rev\.?\s*4|r4)\b/gi
    ]
  },
  ISO_IEC_42001: {
    id: 'ISO-IEC-42001',
    code: 'ISO/IEC 42001:2023',
    title: 'Information technology — Artificial intelligence — Management system',
    titleTh: 'ระบบการจัดการปัญญาประดิษฐ์ ISO/IEC 42001:2023 (AIMS)',
    activeRevision: '2023',
    publicationYear: 2023,
    status: 'ACTIVE',
    officialUrl: 'https://www.iso.org/standard/81230.html',
    domain: 'AI Governance',
    supersededRevisions: [],
    regexPatterns: [
      /iso(?:\/iec)?\s*42001(?::2023)?\b/gi
    ]
  },
  ISO_IEC_27001: {
    id: 'ISO-IEC-27001',
    code: 'ISO/IEC 27001:2022',
    title: 'Information security, cybersecurity and privacy protection — Information security management systems',
    titleTh: 'ระบบบริหารจัดการความมั่นคงปลอดภัยสารสนเทศ ISO/IEC 27001:2022',
    activeRevision: '2022',
    publicationYear: 2022,
    status: 'ACTIVE',
    officialUrl: 'https://www.iso.org/standard/27001',
    domain: 'Cybersecurity',
    supersededRevisions: ['2013', '2005', 'ISO 27001:2013'],
    deprecationNote: 'ISO/IEC 27001:2013 สิ้นสุดระยะเวลาเปลี่ยนผ่านและถูกแทนที่อย่างสมบูรณ์โดย ISO/IEC 27001:2022 (Annex A 93 Controls)',
    regexPatterns: [
      /iso(?:\/iec)?\s*27001:2013\b/gi
    ]
  }
};

export interface StandardsAuditFinding {
  standardId: string;
  matchedText: string;
  activeCode: string;
  activeUrl: string;
  reason: string;
  suggestedReplacement: string;
}

export interface StandardsAuditResult {
  hasDeprecatedReferences: boolean;
  findings: StandardsAuditFinding[];
  sanitizedText: string;
  standardsVerifiedCount: number;
}

/**
 * Audits a given text for citations of international standards,
 * catches superseded/outdated revisions (e.g. NIST SP 800-61 Rev. 2),
 * and automatically sanitizes/upgrades the citation to the active revision.
 */
export function auditAndSanitizeStandardReferences(text: string): StandardsAuditResult {
  if (!text || typeof text !== 'string') {
    return {
      hasDeprecatedReferences: false,
      findings: [],
      sanitizedText: text || '',
      standardsVerifiedCount: 0,
    };
  }

  let sanitizedText = text;
  const findings: StandardsAuditFinding[] = [];
  let verifiedCount = 0;

  // 1. Audit NIST SP 800-61 specifically (Rev. 2 -> Rev. 3)
  const nist80061 = AUTHORITATIVE_STANDARDS.NIST_SP_800_61;
  for (const pattern of nist80061.regexPatterns) {
    const matches = sanitizedText.match(pattern);
    if (matches) {
      for (const match of matches) {
        const replacement = `[${nist80061.code}](${nist80061.officialUrl}) *(ฉบับปัจจุบันที่แทนที่ Rev. 2)*`;
        findings.push({
          standardId: nist80061.id,
          matchedText: match,
          activeCode: nist80061.code,
          activeUrl: nist80061.officialUrl,
          reason: nist80061.deprecationNote || 'มาตรฐานฉบับเดิมถูกยกเลิกและแทนที่แล้ว',
          suggestedReplacement: replacement,
        });
        sanitizedText = sanitizedText.replace(pattern, replacement);
      }
    }
  }

  // 2. Audit NIST CSF (1.1 -> 2.0)
  const nistCsf = AUTHORITATIVE_STANDARDS.NIST_CSF;
  for (const pattern of nistCsf.regexPatterns) {
    const matches = sanitizedText.match(pattern);
    if (matches) {
      for (const match of matches) {
        const replacement = `[${nistCsf.code}](${nistCsf.officialUrl}) *(ฉบับปัจจุบันที่แทนที่ v1.1)*`;
        findings.push({
          standardId: nistCsf.id,
          matchedText: match,
          activeCode: nistCsf.code,
          activeUrl: nistCsf.officialUrl,
          reason: nistCsf.deprecationNote || 'มาตรฐานฉบับเดิมถูกยกเลิกและแทนที่แล้ว',
          suggestedReplacement: replacement,
        });
        sanitizedText = sanitizedText.replace(pattern, replacement);
      }
    }
  }

  // 3. Audit ISO 27001:2013 -> 2022
  const iso27001 = AUTHORITATIVE_STANDARDS.ISO_IEC_27001;
  for (const pattern of iso27001.regexPatterns) {
    const matches = sanitizedText.match(pattern);
    if (matches) {
      for (const match of matches) {
        const replacement = `[${iso27001.code}](${iso27001.officialUrl}) *(ฉบับปัจจุบันที่แทนที่ 2013)*`;
        findings.push({
          standardId: iso27001.id,
          matchedText: match,
          activeCode: iso27001.code,
          activeUrl: iso27001.officialUrl,
          reason: iso27001.deprecationNote || 'มาตรฐานฉบับเดิมถูกยกเลิกและแทนที่แล้ว',
          suggestedReplacement: replacement,
        });
        sanitizedText = sanitizedText.replace(pattern, replacement);
      }
    }
  }

  // 4. Count all verified standards mentioned
  const allStandardMatches = sanitizedText.match(/(?:NIST|ISO|OWASP|CIS Controls|PDPA)[^\n,.;()]+/gi) || [];
  verifiedCount = allStandardMatches.length;

  return {
    hasDeprecatedReferences: findings.length > 0,
    findings,
    sanitizedText,
    standardsVerifiedCount: verifiedCount,
  };
}

/**
 * Returns formatted Markdown Guidelines for System Prompts to enforce
 * active standards citations in LLM generations.
 */
export function getStandardsPromptEnforcement(): string {
  return `
[STANDARDS & CITATIONS INTEGRITY POLICY - MANDATORY REVISION AUDIT]
- เมื่ออ้างอิง "มาตรฐานสากล" (International Standards) เช่น NIST, ISO/IEC, OWASP:
  1. ต้องระบุหมายเลขรหัสมาตรฐาน ชื่อทางการ และรุ่น/ฉบับ (Revision/Edition/Year) ที่เป็น "ปัจจุบันและมีผลบังคับใช้ (Active)" เสมอ
  2. ห้ามอ้างอิงมาตรฐานที่ถูกแทนที่หรือยกเลิกแล้ว (Superseded/Deprecated) เป็นมาตรฐานปัจจุบันเด็ดขาด:
     • Incident Response: ต้องใช้ **NIST SP 800-61 Rev. 3** (2024: Incident Response Recommendations and Considerations for Cybersecurity Risk Management) ห้ามอ้าง Rev. 2 ซึ่งถูกแทนที่แล้ว
     • Cybersecurity Framework: ต้องใช้ **NIST CSF 2.0** (2024 ที่มีฟังก์ชัน GOVERN) ห้ามอ้าง CSF 1.1
     • AI Management: ต้องใช้ **ISO/IEC 42001:2023** และ **NIST AI RMF 1.0 (NIST AI 100-1)**
     • Information Security: ต้องใช้ **ISO/IEC 27001:2022** (93 Controls)
  3. หากจำเป็นต้องกล่าวถึงประวัติศาสตร์หรือบริบทเดิม ต้องระบุสถานะชัดเจน เช่น "(ฉบับเดิม Rev. 2 ซึ่งปัจจุบันถูกแทนที่ด้วย Rev. 3)"
  4. ระบุ URL ทางการที่ถูกต้อง เช่น https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf เมื่อมีการอ้างอิง`;
}
