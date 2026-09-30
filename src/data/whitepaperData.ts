export interface WhitepaperSection {
  id: string;
  secNumber: string;
  titleTh: string;
  titleEn: string;
  badge?: string;
  summary: string;
  content: string[];
  subsections?: {
    subId: string;
    title: string;
    description: string;
    keyPoints?: string[];
    formula?: string;
    standardsRef?: string;
  }[];
}

export const WHITEPAPER_METADATA = {
  version: '3.2',
  title: 'FIRE KEEPER & PUNN PREDICTIVE COGNITIVE ARCHITECTURE (PCA)',
  subtitle: 'Enterprise Whitepaper v3.2: Product Boundary, Decision Quality Controls, Evidence Governance, and Auditability',
  lastUpdated: 'September 30, 2026',
  classification: 'Enterprise Public Technical Specification & Governance Standard',
  authors: 'Firekeeper Core Engineering & AI Cognitive Architecture Working Group',
  citation: 'Firekeeper Project — Enterprise Whitepaper v3.2 (2026)',
};

export const FULL_WHITEPAPER_MARKDOWN = `# FIRE KEEPER Enterprise Whitepaper
## Decision Quality Controls, Evidence Governance & Auditable AI

*Release Version: 3.2 (2026 Edition) · Product/Technical Whitepaper*

> **Documentation boundary:** เอกสารนี้อธิบายว่า FIRE KEEPER คืออะไร ทำอะไรได้ และขอบเขต implementation ปัจจุบันเท่านั้น รายละเอียด PCA 12 stages มีเจ้าของเนื้อหาเพียงแห่งเดียวที่ **PUNN PCA Specification (/punn-pca)**; วิธีใช้งานอยู่ที่ **Getting Started (/guide)**; API และ integration อยู่ที่ **Developer Docs (/developers)**; หนังสือ/บทความอยู่ที่ **Publication (/publication)**.

---

## Executive Summary

FIRE KEEPER เป็น decision-quality และ AI-governance layer ที่ช่วยแยก Fact, Source Claim, Interpretation, Hypothesis, Recommendation และ Decision ออกจากกัน เชื่อม claim กับ evidence ตรวจความขัดแย้งและความเสี่ยง และเก็บ Decision Record กับ tamper-evident audit trace เพื่อให้มนุษย์ตรวจสอบก่อนตัดสินใจ

หลักสำคัญคือ **AI assists; human decides.** ระบบไม่ถือว่าคำตอบจากโมเดลเป็นข้อเท็จจริงโดยอัตโนมัติ และไม่สร้าง confidence, verification หรือ Bayesian probability เมื่อไม่มี measurement/provenance ที่รองรับ

## What the Product Provides

- Multi-provider AI runtime และ BYOK ตาม provider ที่ deployment เปิดใช้
- Evidence/claim separation, competing hypotheses, risk & critique และ recommendation governance
- Human approval boundary, workspace และ decision history ตาม entitlement
- Hosted/Offline modes, memory/context services และ audit metadata
- Decision Record และ SHA-256 based tamper-evident trace ตามขอบเขต runtime

## Evidence & Confidence Boundary

Evidence kind, verification status, source credibility, authority, quality, relevance และ claim-support เป็นคนละมิติและต้องไม่ใช้แทนกัน

- ไม่มี measured evidence → confidence ต้องเป็น N/A/null
- VERIFIED ไม่ได้แปลว่า quality = 100%
- Credibility ไม่ใช่ Authority และไม่ใช่ Bayesian likelihood
- Heuristic relevance ใช้ช่วย ranking ได้ แต่ไม่ถือเป็น empirical measurement
- Bayesian posterior อัปเดตได้เมื่อมี explicit probability provenance สำหรับ P(E|H) และ P(E|¬H) เท่านั้น

รายละเอียด taxonomy, stage gates และ canonical architecture ให้ยึด **/punn-pca** เป็น source of truth

## Auditability

Runtime รองรับ execution/trace identifiers, evidence/risk/conflict summaries, Decision Record และ SHA-256 integrity hashes เพื่อช่วยตรวจจับการเปลี่ยนแปลงของ trace ตามข้อมูลที่บันทึก

ขอบเขตที่ต้องแยกให้ชัด: tamper-evident hash ไม่เท่ากับ storage-enforced WORM, trusted timestamp หรือ external certification และ audit trace ไม่ได้พิสูจน์ว่าข้อเท็จจริงในคำตอบถูกต้องโดยอัตโนมัติ

## Deployment & Security Boundary

ระบบเป็น React/TypeScript + Express runtime และสามารถ deploy แบบ containerized service ได้ การเชื่อม provider, Firebase, logging หรือ enterprise integrations ขึ้นกับ configuration ของ deployment นั้น ๆ ข้อมูล secret ควรถูกจัดการฝั่ง server หรือผ่าน BYOK boundary ที่กำหนดไว้ ไม่ควรตีความเอกสารนี้เป็นการรับรอง security certification

## Human Agency

FIRE KEEPER เป็นระบบสนับสนุนการตัดสินใจ ไม่ใช่ผู้มีอำนาจตัดสินใจแทนมนุษย์ งานผลกระทบสูงควรมี human review/approval และแสดง assumptions, unknowns, conflicts และ evidence gaps อย่างชัดเจน

## Current vs Planned

**Current implementation scope:** claim/evidence governance, consistency checks, conditional recommendations, decision records, audit trace, human-approval boundaries และ runtime controls ที่มีอยู่ใน repository/deployment

**Planned / requires separate validation:** storage-enforced immutability, external trusted timestamping, broader multimodal evidence anchoring, cross-organization verification และ integrations ที่ยังไม่มี deployment evidence

Roadmap ไม่ใช่คำรับประกันกำหนดส่งมอบ

---

## Canonical Documentation Map

| ต้องการอ่านเรื่อง | Source of truth |
| --- | --- |
| เริ่มใช้งาน | **/guide** |
| PCA architecture, 12 stages, taxonomy, stage gates | **/punn-pca** |
| Product/technical overview และ implementation boundary | **/whitepaper** (หน้านี้) |
| API, contracts, integration | **/developers** |
| Privacy, security, governance disclosures | **/privacy** |
| หนังสือ บทความ และงานเผยแพร่ | **/publication** |

*FIRE KEEPER Whitepaper เป็น overview ไม่ใช่สำเนา PCA Specification หรือ Publication.*`

export const WHITEPAPER_SECTIONS: WhitepaperSection[] = [
  {
    id: 'sec-exec', secNumber: 'SEC 0', titleTh: 'บทคัดย่อเชิงผู้บริหาร', titleEn: 'Executive Summary & Current Status', badge: 'Current Status',
    summary: 'ภาพรวมความสามารถปัจจุบันและขอบเขตการอ้างอิงของ FIREKEEPER PCA v3.1',
    content: [
      'FIREKEEPER PCA v3.1 ช่วยแยกหลักฐาน การตีความ สมมติฐาน คำแนะนำ และการตัดสินใจ เพื่อให้การใช้ AI มีร่องรอยการทบทวนที่ชัดเจน',
      'สถานะที่กล่าวอ้างได้คือ Decision Record และ SHA-256 tamper-evident audit trace ตามขอบเขต deployment ไม่ใช่ WORM immutable, trusted timestamp หรือ certification ภายนอก'
    ]
  },
  {
    id: 'sec-philosophy', secNumber: 'SEC 1', titleTh: 'ปรัชญาญาณวิทยาและผู้รักษาไฟ', titleEn: 'Epistemic Philosophy & Human Agency', badge: 'Core Philosophy',
    summary: 'AI สนับสนุนการคิด แต่มนุษย์ยังเป็นผู้มีอำนาจตัดสินใจ',
    content: [
      'PUNN คือผู้สร้างและเจ้าของแนวคิดของ Firekeeper ไม่ใช่ชื่อ AI. ระบบแสดงผลการตรวจเชิงโครงสร้างที่ตรวจสอบได้ แต่ไม่เปิดเผย hidden chain-of-thought ของโมเดล',
      'No evidence is not a fact; plausible is not true; unknown is not false.'
    ]
  },
  {
    id: 'sec-pipeline', secNumber: 'SEC 2', titleTh: 'PCA 12-Stage Pipeline', titleEn: 'Structured Decision Quality Pipeline', badge: 'Architecture',
    summary: 'โครงสร้างการวิเคราะห์ตั้งแต่บริบท หลักฐาน ความเสี่ยง ทางเลือก จนถึง human approval',
    content: [
      'Pipeline ช่วยจัดโครงสร้างการตรวจ ไม่รับประกันความถูกต้องของคำตอบ และต้องใช้หลักฐานกับการทบทวนตามบริบท',
      'งานผลกระทบสูงต้องผ่าน human approval boundary และระบุข้อจำกัดให้ผู้มีอำนาจตัดสินใจเห็น'
    ]
  },
  {
    id: 'sec-confidence', secNumber: 'SEC 3', titleTh: 'Confidence และ Hypothesis Governance', titleEn: 'Evidence-Grounded Confidence & Hypotheses', badge: 'Evidence Boundary',
    summary: 'ไม่เปลี่ยน heuristic เป็น probability หรือความแม่นยำที่ยืนยันไม่ได้',
    content: [
      'หากไม่มี measured evidence วิธีสอบเทียบ และ provenance ที่ตรวจสอบได้ ระบบควรใช้ N/A/null แทน confidence หรือ probability แบบตัวเลข',
      'Hypotheses ต้องแยกว่าแข่งขันกันจริงหรือเป็นคนละมิติ และต้องมีหลักฐานที่ช่วยแยกความต่าง'
    ]
  },
  {
    id: 'sec-standards', secNumber: 'SEC 4', titleTh: 'มาตรฐานและธรรมาภิบาล', titleEn: 'Governance References & Boundaries', badge: 'Governance',
    summary: 'ออกแบบโดยอ้างอิงหลักการ governance ที่เกี่ยวข้อง แต่ไม่อ้างการรับรองภายนอก',
    content: [
      'กรอบอ้างอิงรวม NIST AI RMF, NIST CSF, ISO/IEC 42001 และแนวทางความเป็นส่วนตัวที่เกี่ยวข้อง',
      'Alignment ไม่เท่ากับ certification; การรับรองต้องเกิดจากกระบวนการภายนอกที่แยกต่างหาก'
    ]
  },
  {
    id: 'sec-audit', secNumber: 'SEC 5', titleTh: 'Audit Trace และความสมบูรณ์ของข้อมูล', titleEn: 'Tamper-Evident Audit Trace', badge: 'Auditability',
    summary: 'Decision Record, audit metadata และ SHA-256 integrity hashes พร้อมขอบเขต deployment ที่ชัดเจน',
    content: [
      'Runtime บันทึก identifiers, governance/evidence/risk/conflict summaries, Decision Record และ SHA-256 integrity hashes ตามระดับ log ที่กำหนด',
      'Azure Monitor / Log Analytics เป็น optional integration ที่ส่ง metadata เท่านั้น ไม่ส่ง prompt, คำตอบเต็ม, email หรือ secret',
      'Trace เป็น tamper-evident control ไม่ใช่ storage-enforced WORM, RFC 3161 trusted timestamp หรือ external certification'
    ]
  },
  {
    id: 'sec-roadmap', secNumber: 'SEC 6', titleTh: 'สถานะและทิศทาง', titleEn: 'Current Controls & Planned Work', badge: 'Roadmap',
    summary: 'แยก controls ที่ทำงานแล้วออกจากทิศทางที่ยังต้องพิสูจน์',
    content: [
      'ปัจจุบันมี claim-to-evidence gate, self-audit, conditional recommendation, consistency check, human approval boundary, action impact, sequential evidence plan และ recommendation change tracking',
      'Multi-modal evidence, graph retrieval, storage-enforced immutability, trusted timestamping และ cross-organization verification ยังเป็นงานที่จะต้องทดสอบและมี deployment evidence ก่อนประกาศใช้'
    ]
  }
];