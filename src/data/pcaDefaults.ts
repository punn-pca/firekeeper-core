import { MemoryItem, ToneMode } from '../types';

export interface SamplePrompt {
  id: string;
  title: string;
  prompt: string;
  category: 'Strategic' | 'AI Governance' | 'Ethics' | 'Personal Decision';
  tone: ToneMode;
  deepReasoning: boolean;
}

export const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    id: 'ai-governance',
    title: 'การกำกับดูแล AI ในองค์กร (Enterprise AI Governance)',
    prompt: 'องค์กรของเราควรวางกรอบ Governance และ Human-in-the-loop อย่างไรเมื่อนำ LLM มาใช้ในงานบริการลูกค้าเพื่อป้องกัน hallucination และรักษาความเชื่อถือของลูกค้า?',
    category: 'AI Governance',
    tone: 'Formal Architect',
    deepReasoning: true,
  },
  {
    id: 'business-pivot',
    title: 'การตัดสินใจปรับทิศทางธุรกิจ (Business Pivot)',
    prompt: 'เรากำลังพิจารณาว่าจะเปลี่ยนโมเดลธุรกิจจากการขาย ซอฟต์แวร์แบบ On-Premise ไปเป็น SaaS Subscription เต็มรูปแบบในอีก 6 เดือนข้างหน้า ขอการวิเคราะห์ความเสี่ยงและทางเลือกเชิงยุทธศาสตร์',
    category: 'Strategic',
    tone: 'Formal Architect',
    deepReasoning: true,
  },
  {
    id: 'agi-alignment',
    title: 'ความปลอดภัยและการจัดระเบียบ AGI (AGI Alignment)',
    prompt: 'วิเคราะห์แนวทางในการรักษา Human Agency และความปลอดภัยของมนุษย์เมื่อระบบปัญญาประดิษฐ์มีความสามารถเหนือมนุษย์ในหลากหลายโดเมน',
    category: 'Ethics',
    tone: 'Empathetic Guide',
    deepReasoning: true,
  },
  {
    id: 'tech-stack',
    title: 'เลือกสถาปัตยกรรมระบบ (Architecture Selection)',
    prompt: 'เปรียบเทียบข้อดีข้อเสียระหว่าง Microservices กับ Monolith ในระบบ e-commerce ขนาดกลางที่ต้องการความยืดหยุ่นและความรวดเร็วในการเปิดตัวผลิตภัณฑ์',
    category: 'Strategic',
    tone: 'Direct Expert',
    deepReasoning: false,
  },
];

export const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    content: 'หลักการสำคัญของ PUNN: ต้องรักษา Human Agency ของผู้ใช้เสมอ ห้ามตัดสินใจเด็ดขาดแทนมนุษย์ (Mandatory Preserved)',
    layer: 'Constraint',
    storeType: 'Knowledge',
    source: 'PUNN Core Manifesto & Governance Standard',
    provenanceId: 'GOV-MANIFESTO-01',
    sourceUrl: 'REF-DOC-GOV-MANIFESTO-01 (Internal Governance Vault)',
    confidence: 1.0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mem-2',
    content: 'มาตรฐานกรอบธรรมาภิบาลสากล: อ้างอิง ISO/IEC 42001:2023 (AIMS) และ NIST AI RMF 1.0 เพื่อกำหนดกรอบควบคุมความเสี่ยง มาตรการ Human Oversight และการตรวจสอบย้อนกลับ (Auditability)',
    layer: 'Constraint',
    storeType: 'Knowledge',
    source: 'ISO/IEC 42001:2023 & NIST AI RMF 1.0 Standard',
    provenanceId: 'STD-ISO-42001-NIST-RMF',
    sourceUrl: 'https://www.iso.org/standard/81230.html',
    confidence: 0.99,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mem-3',
    content: 'มาตรฐานโครงสร้างรายงาน: ให้แยก [ข้อเท็จจริง] จาก [สมมติฐาน] และระบุ [ข้อมูลที่ขาด] (เช่น Transaction Volume, Risk Threshold, งบประมาณ HITL) พร้อมตาราง Matrix เปรียบเทียบ',
    layer: 'System',
    storeType: 'Semantic',
    source: 'PCA Governance Standard v2.0',
    provenanceId: 'DOC-PCA-SPEC-v2',
    sourceUrl: 'REF-DOC-PCA-SPEC-V2 (Secure Standard Repo)',
    confidence: 0.95,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mem-4',
    content: 'สไตล์การตอบสนองผู้ใช้: ต้องการรายงานระดับ Executive Decision Intelligence ภาษาไทย สุขุม มีสถิติ สมการ และตารางเปรียบเทียบเชิงโครงสร้าง',
    layer: 'Preference',
    storeType: 'Preference',
    source: 'User Profile & Persona Settings',
    provenanceId: 'USER-PREF-PRO-88',
    sourceUrl: 'REF-USER-PROFILE-88 (Encrypted Settings)',
    confidence: 0.92,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mem-5',
    content: '[สมมติฐานเชิงประวัติศาสตร์ (Fictional Historical Baseline)] ประวัติกรณีศึกษาตัวอย่างในอดีต: โครงการเปลี่ยนผ่านระบบคลังสินค้า Q3/2025 เลือกใช้ Microservices Architecture ร่วมกับ Human-in-the-Loop Guardrail บรรลุ SLA 99.95%',
    layer: 'Observation',
    storeType: 'Episodic',
    source: 'Fictional Case Baseline (Case-2025-Q3-Baseline)',
    provenanceId: 'CASE-FICTIONAL-BASELINE-2025-Q3',
    sourceUrl: 'REF-CASE-ARCH-2025-Q3 (Audit Archive)',
    confidence: 0.88,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mem-6',
    content: 'เป้าหมายและบริบทงานปัจจุบัน: กำลังประเมินการออกแบบสถาปัตยกรรม AI Decision Intelligence และการกำกับดูแล AI Governance ขององค์กร',
    layer: 'Fact',
    storeType: 'Working',
    source: 'Active Session Goal',
    provenanceId: 'SESSION-WORKING-CTX',
    sourceUrl: 'REF-SESSION-ACTIVE-CONTEXT (Runtime Store)',
    confidence: 0.90,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mem-7',
    content: 'กรอบกฎหมายอาวุธปืนไทย (Thai Firearms Legal Framework): กำหนดตาม พ.ร.บ. อาวุธปืน เครื่องกระสุนปืน สิ่งเทียมอาวุธปืนฯ พ.ศ. 2490 ภายใต้กรมการปกครอง กระทรวงมหาดไทย ครอบคลุมระบบใบอนุญาต ป.3 (ซื้อ/รับโอน) และ ป.4 (มี/ใช้), ตรวจประวัติอาชญากรรม (สตช.), ใบรับรองแพทย์ประเมินสภาวะจิตใจ, การกวาดล้างแบลงค์กัน (Blank Guns) ดัดแปลง และการจัดเก็บปืนสวัสดิการข้าราชการ',
    layer: 'Constraint',
    storeType: 'Knowledge',
    source: 'พ.ร.บ. อาวุธปืน พ.ศ. 2490 & กรมการปกครอง กระทรวงมหาดไทย',
    provenanceId: 'LAW-THAI-FIREARMS-2490',
    sourceUrl: 'https://www.dopa.go.th/',
    confidence: 0.98,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mem-8',
    content: 'ระบบสุขภาพจิตชุมชนไทย (Community Mental Health System): กรมสุขภาพจิต กระทรวงสาธารณสุข และ สายด่วนสุขภาพจิต 1323, การคัดกรองและเฝ้าระวังระดับฐานรากโดย รพ.สต. และ อสม. สำหรับผู้ป่วยกลุ่มเสี่ยง SMI-V (Severe Mental Illness with Violence potential) พร้อมส่งต่อ รพ.ชุมชน -> รพ.ศูนย์/จิตเวช ร่วมกับฝ่ายปกครอง',
    layer: 'Fact',
    storeType: 'Knowledge',
    source: 'กรมสุขภาพจิต กระทรวงสาธารณสุข & ระบบสุขภาพจิตชุมชน',
    provenanceId: 'HEALTH-COMMUNITY-MENTAL-1323',
    sourceUrl: 'https://dmh.go.th/',
    confidence: 0.98,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mem-9',
    content: 'กลไกแจ้งเบาะแสและเฝ้าระวังระดับพื้นที่ (Localized Early-Warning Mechanisms): ศูนย์รับแจ้งเหตุฉุกเฉิน 191/1599 (สตช.), ศูนย์ดำรงธรรม 1567 (มท.), เครือข่ายกำนัน/ผู้ใหญ่บ้าน/ผู้นำชุมชน และระบบแจ้งเบาะแสนิรนาม (Anonymous Reporting) ในสถานศึกษา โดยใช้ Threat Assessment Protocol สังเกตพฤติกรรมเสี่ยงและสัญญาณรั่วไหล (Leakage) แทนการใช้ Profiling',
    layer: 'Fact',
    storeType: 'Knowledge',
    source: 'สำนักงานตำรวจแห่งชาติ, กระทรวงมหาดไทย & Threat Assessment Protocol',
    provenanceId: 'WARN-LOCAL-EARLY-WARNING-TH',
    sourceUrl: 'https://www.royalthaipolice.go.th/',
    confidence: 0.98,
    created_at: new Date().toISOString(),
  },
];
