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
    authority: 'System',
    mutability: 'Immutable',
    status: 'Active',
    relevanceScore: 0.98,
    provenanceId: 'GOV-MANIFESTO-01',
    sourceUrl: 'REF-DOC-GOV-MANIFESTO-01 (Internal Governance Vault)',
    confidence: 1.0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mem-2',
    content: 'มาตรฐานกรอบธรรมาภิบาลและควบคุมความเสี่ยงสากล: อ้างอิง ISO/IEC 42001:2023 (AIMS), NIST AI RMF 1.0 (NIST AI 100-1), NIST CSF 2.0, และ NIST SP 800-61 Rev. 3 (Incident Response Recommendations - ฉบับปัจจุบันที่แทนที่ Rev. 2) เพื่อกำหนดกรอบควบคุมความเสี่ยง มาตรการ Human Oversight และการตรวจสอบย้อนกลับ (Auditability)',
    layer: 'Constraint',
    storeType: 'Knowledge',
    source: 'ISO/IEC 42001:2023, NIST AI RMF 1.0 & NIST SP 800-61 Rev. 3 Standards',
    authority: 'System',
    mutability: 'Immutable',
    status: 'Active',
    relevanceScore: 0.98,
    provenanceId: 'STD-ISO-42001-NIST-RMF-SP800-61R3',
    sourceUrl: 'https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf',
    confidence: 0.99,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mem-3',
    content: 'มาตรฐานโครงสร้างรายงาน: ให้แยก [ข้อเท็จจริง] จาก [สมมติฐาน] และระบุ [ข้อมูลที่ขาด] (เช่น Transaction Volume, Risk Threshold, งบประมาณ HITL) พร้อมตาราง Matrix เปรียบเทียบ',
    layer: 'System',
    storeType: 'Semantic',
    source: 'PCA Governance Standard v2.0',
    authority: 'System',
    mutability: 'Immutable',
    status: 'Active',
    relevanceScore: 0.95,
    provenanceId: 'DOC-PCA-SPEC-v2',
    sourceUrl: 'REF-DOC-PCA-SPEC-V2 (Secure Standard Repo)',
    confidence: 0.95,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mem-4',
    content: 'สไตล์การตอบสนองผู้ใช้: ผู้ช่วยส่วนตัวที่คุยเป็นธรรมชาติ ฉลาด มืออาชีพ ภาษาไทยร่วมสมัย ตรงประเด็น ไม่เกริ่นนำ ไม่ใช้ภาษาโบราณหรือภาษาราชการ ไม่ทักทายซ้ำในบทสนทนาต่อเนื่อง',
    layer: 'Preference',
    storeType: 'Preference',
    source: 'User Profile & Persona Settings',
    authority: 'User',
    mutability: 'Mutable',
    status: 'Active',
    relevanceScore: 0.92,
    provenanceId: 'USER-PREF-PRO-88',
    sourceUrl: 'REF-USER-PROFILE-88 (Encrypted Settings)',
    confidence: 0.92,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mem-6',
    content: 'เป้าหมายและบริบทงานปัจจุบัน: กำลังประเมินการออกแบบสถาปัตยกรรม AI Decision Intelligence และการกำกับดูแล AI Governance ขององค์กร',
    layer: 'Context',
    storeType: 'Working',
    source: 'Active Session Goal',
    authority: 'Session',
    mutability: 'Mutable',
    status: 'Active',
    relevanceScore: 0.94,
    provenanceId: 'SESSION-WORKING-CTX',
    sourceUrl: 'REF-SESSION-ACTIVE-CONTEXT (Runtime Store)',
    confidence: 0.90,
    created_at: new Date().toISOString(),
  },
];
