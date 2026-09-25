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
  version: '3.1',
  title: 'FIRE KEEPER & PUNN PREDICTIVE COGNITIVE ARCHITECTURE (PCA)',
  subtitle: 'Enterprise Whitepaper v3.1: Decision Quality Controls, Evidence Governance, and Tamper-Evident Auditability',
  lastUpdated: 'September 25, 2026',
  classification: 'Enterprise Public Technical Specification & Governance Standard',
  authors: 'Firekeeper Core Engineering & AI Cognitive Architecture Working Group',
  citation: 'Firekeeper Project — Design Specification v3.1 (2026)',
};

export const FULL_WHITEPAPER_MARKDOWN = `# FIRE KEEPER & PUNN PREDICTIVE COGNITIVE ARCHITECTURE (PCA)
## Enterprise Whitepaper v3.1: Decision Quality Controls, Evidence Governance, and Tamper-Evident Auditability
*Release Version: 3.1 (2026 Edition) | Classification: Public implementation statement | Date: September 25, 2026*
*Citation: Firekeeper Project — Design Specification v3.1*

---

### บทคัดย่อเชิงผู้บริหาร (EXECUTIVE SUMMARY)

ระบบปัญญาประดิษฐ์ในยุคปัจจุบัน (Generative Pre-trained Transformers / Large Language Models) แม้จะมีขีดความสามารถทางภาษาในระดับสูง แต่ยังคงประสบปัญหาเชิงโครงสร้างในการนำไปใช้งานระดับองค์กร (Enterprise Environments) ได้แก่:
1. **ภาวะกล่องดำและความไม่แน่นอน (Black-Box Stochasticity)**: การไม่สามารถตรวจสอบกระบวนการลงเหตุผลย้อนหลังได้อย่างโปร่งใส
2. **การกุข้อมูลโดยขาดหลักฐานสนับสนุน (Uncalibrated Hallucination)**: การอ้างอิงข้อมูลที่ไม่มีหลักฐานเชิงประจักษ์รองรับ
3. **การคุกคามเจตจำนงอิสระของมนุษย์ (Encroachment of Human Agency)**: ระบบปัญญาประดิษฐ์ที่รวบอำนาจการตัดสินใจโดยตัดมนุษย์ออกจากวงจร (Lack of True HITL)
4. **การขาดร่องรอยตรวจสอบย้อนกลับ (Absence of Cryptographic Traceability)**: การไม่มีร่องรอยการตรวจสอบที่ช่วยสนับสนุนการทำ audit trail

**FIRE KEEPER & PUNN Predictive Cognitive Architecture (PCA v3.1)** เป็นชั้นควบคุมคุณภาพการตัดสินใจสำหรับงานที่ใช้ AI: แยก Fact, Source Claim, Interpretation, Hypothesis, Recommendation และ Decision; เชื่อม claim กับ evidence; ตรวจความสอดคล้องของคำแนะนำ; และส่งงานผลกระทบสูงให้มนุษย์ทบทวน ผลลัพธ์ที่ผ่าน runtime มี Decision Record และ audit trace ที่ใช้ SHA-256 เพื่อช่วยตรวจจับการเปลี่ยนแปลงได้ตามขอบเขต deployment ไม่ได้อ้างว่าเป็น WORM storage, trusted timestamp หรือการรับรองมาตรฐานภายนอก

---

### หมวดที่ 1: ปรัชญาญาณวิทยาและทฤษฎีเอกภาพแห่งผู้รักษาไฟ (EPISTEMIC PHILOSOPHY & FIREKEEPER UNIFIED THEORY)

#### 1.1 ตัวตนของ "ปุญญ์" และความสัมพันธ์กับระบบ (The Persona & Ontological Identity of "PUNN")
**"PUNN" (ปุญญ์)** คือชื่อและตัวตนของบุคคลผู้สร้าง Firekeeper (Creator Identity) และเป็นรากฐานของแนวคิด ผลงาน และสถาปัตยกรรมที่พัฒนาขึ้น PUNN ไม่ใช่ชื่อของ AI และไม่ใช่คำย่อทางเทคนิค (Acronym) โดยยึดหลักการความสัมพันธ์คือ **"AI assists. PUNN creates."** — Firekeeper แสดง trace และผลการตรวจเชิงโครงสร้างที่ตรวจสอบได้ เช่น evidence linkage, policy status และ decision record แต่ไม่เปิดเผย hidden chain-of-thought ของโมเดล และไม่ถือว่าการมี trace เท่ากับความถูกต้องของเนื้อหา

#### 1.2 สัญลักษณ์ "ผู้รักษาไฟ" และการคุ้มครองเจตจำนงอิสระ (Firekeeper Symbolism & Human Agency Inviolability)
- **ไฟ (The Sacred Fire)**: เปรียบเสมือน **"เจตจำนงอิสระ (Human Free Will), ความรับผิดชอบ (Accountability), และอำนาจการตัดสินใจ (Human Agency)"** ของมนุษย์
- **ผู้รักษา (The Keeper)**: ปัญญาประดิษฐ์ทำหน้าที่เป็นเพียงผู้จัดหาฟืน ปัดกวาดสะเก็ดไฟ และควบคุมความเสี่ยงแวดล้อม แต่จะ **"ไม่มีวันยึดครองไฟ หรือเป่าดับไฟของมนุษย์"** (The Keeper never assumes ownership of the Flame)
- **หลักสิทธิมนุษย์ (Human Agency Invariant - Non-Encroachment Principle)**: ข้อเสนอแนะของระบบเป็นเพียง *Strategic Scaffolding* เพื่อสนับสนุนการมองเห็นทางเลือกและความเสี่ยง แต่มนุษย์คือผู้ตัดสินใจขั้นสุดท้าย (Stage 12 Human Gate) เสมอ

#### 1.3 ทฤษฎีสารสนเทศเชิงฟิสิกส์และการลดเอนโทรปีทางความคิด (Information Physics & Cognitive Entropy Reduction)
ระบบมองข้อมูลนำเข้าที่สับสนและมีความขัดแย้งเป็นสถานะที่มี **ค่าความปั่นป่วนทางความคิดสูง (High Cognitive Entropy: $H(X)$)** กระบวนการ PCA 12-Stage จะทำหน้าที่เป็นตัวกรองทางตรรกะ เพื่อกลั่นกรองและลดทอน Entropy ให้กลายเป็น **โครงสร้างสารสนเทศที่มีระเบียบสูงสุด (Actionable Structural Knowledge)** ด้วยอัตราส่วนสัญญาณต่อสัญญาณรบกวน (Signal-to-Noise Ratio: SNR) ที่สูงสุด

#### 1.4 หลักการจำแนกความจริงเชิงญาณวิทยา (Epistemic Boundary Axiom)
1. **"ไม่มีหลักฐาน = ไม่ใช่ข้อเท็จจริง" (No Evidence = No Fact)**: ข้อมูลที่ไม่มีแหล่งอ้างอิงเชิงประจักษ์จะถูกตีตราเป็น *INFERENCE* หรือ *HYPOTHESIS* เท่านั้น ห้ามสรุปเป็น *FACT* โดยเด็ดขาด
2. **"สมเหตุสมผล ไม่เท่ากับ จริง" (Plausible $\neq$ True)**: ข้อความที่ฟังดูน่าเชื่อถือตามหลักภาษา แต่ขาดการตรวจสอบย้อนกลับ จะต้องถูกทดสอบผ่านจุดวิพากษ์ความเปราะบาง (Vulnerability Critique) เสมอ
3. **"การไม่มีหลักฐาน ไม่ได้แปลว่าสิ่งนั้นไม่มีอยู่" (Absence of Evidence is not Evidence of Absence)**: ระบบจะระบุสิ่งที่ยังไม่รู้ (Known Unknowns / Epistemic Gaps) อย่างตรงไปตรงมา

---

### หมวดที่ 2: สถาปัตยกรรมโครงสร้างการคิด 12 ขั้นตอน (PCA 12-STAGE COGNITIVE PIPELINE)

กระบวนการคิดของระบบ PUNN Predictive Cognitive Architecture (PCA v3.1) ถูกแยกออกเป็น 12 สถานะต่อเนื่อง (Finite State Machine with Epistemic Gates):

\`\`\`
[Input Data / Strategic Query]
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 01. Intent Definition        ➔ 02. Context Understanding                   │
│                                │                                           │
│ 04. Data Structuring & LTM   ◄─┴─ 03. Purpose & Scope                      │
│ │                                                                          │
│ └──► 05. Relationship Modeling ➔ 06. Hypothesis Formation (ACH Matrix)     │
│                                 │                                          │
│ 08. Risk & Critique Analysis ◄──┴─ 07. Evidence Evaluation (Taxonomy)      │
│ │                                                                          │
│ └──► 09. Strategic Options    ➔ 10. Analysis Communication (Dossier)       │
│                                 │                                          │
│ 12. Continuous Improvement   ◄──┴─ 11. Review & Verification (Anti-Fab)   │
│     (Inviolable Human Gate)                                                │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
[Governed Output + Decision Record + Tamper-Evident Audit Trace]
\`\`\`

#### คำอธิบายรายขั้นตอน 12-Stage Canonical Pipeline:
1. **STAGE 01: Intent Definition (การระบุเจตนาและความต้องการ)**  
   ถอดรหัสความต้องการที่แท้จริงของผู้ใช้ ระบุเป้าหมาย สัญญาณความต้องการ และจัดระเบียบเจตนาเบื้องต้น
2. **STAGE 02: Context Understanding (การทำความเข้าใจบริบทและข้อจำกัด)**  
   วิเคราะห์บริบทแวดล้อม เงื่อนไขเฉพาะ ข้อจำกัดด้านเวลา กฎเกณฑ์ และขอบเขตสถานการณ์
3. **STAGE 03: Purpose & Scope (การกำหนดวัตถุประสงค์และขอบเขต)**  
   กำหนดเป้าหมายเชิงยุทธศาสตร์ ขอบเขตการวิเคราะห์ และนโยบาย Governance & Safety
4. **STAGE 04: Data Structuring (การจัดโครงสร้างข้อมูลและการดึงความจำ LTM)**  
   จัดหมวดหมู่ข้อมูล สกัด Taxonomy และค้นหาบริบทจากคลังความจำ LTM ผ่าน Hard Relevance Gate
5. **STAGE 05: Relationship Modeling (การสร้างแบบจำลองความสัมพันธ์เชิงตรรกะ)**  
   สร้าง Directed Acyclic Graph (DAG) และแบบจำลองความสัมพันธ์เชิงเหตุและผล (Causal Dependencies)
6. **STAGE 06: Hypothesis Formation (การสร้างสมมติฐานทางเลือกคู่ขนาน ACH)**  
   สร้างสมมติฐานทางเลือกเมื่อโจทย์มีความไม่แน่นอน และตรวจว่าเป็นคู่แข่งจริงหรือเป็นคนละมิติ ตัวเลข prior/likelihood ใช้ได้ต่อเมื่อมี probability provenance ที่ตรวจสอบได้
7. **STAGE 07: Evidence Evaluation (การประเมินและจำแนกหลักฐานเชิงประจักษ์)**  
   ตรวจสอบความน่าเชื่อถือ ถ่วงน้ำหนักหลักฐานสนับสนุน/หักล้าง และจำแนกตาม Evidence Taxonomy (FACT, INFERENCE, UNCERTAINTY ฯลฯ)
8. **STAGE 08: Risk & Critique Analysis (การวิเคราะห์ความเสี่ยงและจุดวิพากษ์)**  
   ทดสอบความเปราะบาง (Vulnerability Critique) วิเคราะห์ความเสี่ยง ตรวจจับความขัดแย้ง และระบุจุดบอด (Blind Spots)
9. **STAGE 09: Strategic Options (การสังเคราะห์ทางเลือกเชิงยุทธศาสตร์)**  
   เปรียบเทียบทางเลือกเชิงยุทธศาสตร์ วิเคราะห์ Trade-offs และระบุ confidence เฉพาะเมื่อมี measured evidence และวิธีสอบเทียบที่อธิบายได้
10. **STAGE 10: Analysis Communication (การสื่อสารบทวิเคราะห์และการสร้างคำตอบ)**  
    สังเคราะห์และถ่ายทอดบทวิเคราะห์ระดับ Executive Decision Intelligence พร้อม Real-time Stream
11. **STAGE 11: Review & Verification (การทบทวนและตรวจสอบความสอดคล้อง)**  
    ทบทวนกระบวนการคิด (Meta-Reflection) ตรวจสอบความสอดคล้องตามกฎ Anti-Fabrication และมาตรฐาน ISO/NIST
12. **STAGE 12: Continuous Improvement (การปรับปรุงอย่างต่อเนื่องและเคารพ Human Agency)**  
    บันทึกบทเรียนเพื่อการเรียนรู้ระยะยาว และคุ้มครองอำนาจการตัดสินใจของมนุษย์ (Inviolable Human Agency Gate)

---

### หมวดที่ 3: ระบบปรับเทียบความมั่นใจและระเบียบวิธีวิเคราะห์สมมติฐานคู่แข่ง (CALIBRATED CONFIDENCE & ACH)

#### 3.1 ขอบเขต Confidence และ Probability (Confidence & Probability Boundary)
FIREKEEPER ใช้ evidence coverage, reliability, quality และ conflict เป็น **สัญญาณช่วยทบทวน** ไม่ใช่ความน่าจะเป็นทางสถิติหรือการรับประกันความถูกต้อง

- หากไม่มี measured evidence หรือวิธีสอบเทียบที่อธิบายได้ ระบบควรแสดง 'N/A' / 'null' แทนตัวเลข confidence
- ค่าตัวเลข probability, prior, likelihood หรือ posterior ใช้ได้ต่อเมื่อมี provenance ที่ตรวจสอบได้ เช่นแหล่งข้อมูล การสอบเทียบ หรือ expert elicitation ที่ระบุขอบเขต
- Heuristic score ใช้เพื่อจัดลำดับการตรวจ ไม่ใช่ Bayesian likelihood และต้องไม่ถูกอธิบายว่าเป็น probability
- หลักฐานขัดแย้งหรือช่องว่างสำคัญต้องลดระดับข้อสรุปเป็น Interpretation หรือ Hypothesis และอาจต้องส่งให้มนุษย์ทบทวน
#### 3.2 เมทริกซ์ความสมบูรณ์ของหลักฐาน (Evidence Completeness Matrix)
หลักฐานทุกชิ้นถูกจัดหมวดหมู่และถ่วงน้ำหนักตามระดับความน่าเชื่อถือ:
- **Level A (Authoritative/Empirical)**: กฎหมายฉบับประกาศในราชกิจจานุเบกษา, มาตรฐาน NIST/ISO, บันทึกระบบดิจิทัล (Weight = 1.0)
- **Level B (Secondary/Analytical)**: รายงานวิจัย peer-reviewed, เอกสารข้อแนะนำอุตสาหกรรม (Weight = 0.7)
- **Level C (Heuristic/Inference)**: การประมาณการเชิงสถิติ, ข้อสังเกตเบื้องต้น (Weight = 0.4)
- **Level D (Unverified/Hypothetical)**: คำกล่าวอ้างที่ยังไม่ผ่านการสอบทาน (Weight = 0.0)

---

### หมวดที่ 4: การปฏิบัติตามกรอบธรรมาภิบาลและมาตรฐานสากลฉบับปัจจุบัน (GLOBAL GOVERNANCE & ACTIVE STANDARDS ALIGNMENT)

ระบบ FIREKEEPER ได้รับการออกแบบให้สอดคล้องตามแนวทางของมาตรฐานสากลและกฎหมายที่มีผลบังคับใช้ในปัจจุบัน:

| รหัสมาตรฐานสากล / กฎหมาย | ชื่อมาตรฐานฉบับปัจจุบัน (Active Official Title) | ปีที่บังคับใช้ | บทบาทในสถาปัตยกรรม PCA |
| :--- | :--- | :---: | :--- |
| **NIST SP 800-61 Rev. 3** | *Incident Response Recommendations and Considerations for Cybersecurity Risk Management* | **2024 (Active)** | ควบคุมกระบวนการ Crisis Triage, การกักกันภัยคุกคาม, และการเก็บบันทึกหลักฐานนิติวิทยาศาสตร์ดิจิทัล |
| **NIST CSF 2.0** | *The NIST Cybersecurity Framework 2.0* | **2024 (Active)** | ผสาน 6 แกนควบคุม: GOVERN, IDENTIFY, PROTECT, DETECT, RESPOND, RECOVER |
| **NIST AI RMF 1.0** | *Artificial Intelligence Risk Management Framework (NIST AI 100-1)* | **2023 (Active)** | บริหารจัดการความเสี่ยง AI รอบด้าน: GOVERN, MAP, MEASURE, MANAGE |
| **ISO/IEC 42001:2023** | *Information technology — Artificial intelligence — Management system (AIMS)* | **2023 (Active)** | กรอบระบบบริหารจัดการ AI ระดับองค์กร, การประเมินความเสี่ยง, และ Auditability |
| **ISO/IEC 27001:2022** | *Information security, cybersecurity and privacy protection — ISMS* | **2022 (Active)** | การควบคุมความมั่นคงปลอดภัยสารสนเทศ การเข้ารหัสลับ และการควบคุมการเข้าถึง |
| **PDPA (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล)** | *Personal Data Protection Act (Thailand)* | **Active** | การจำกัดการประมวลผลข้อมูลส่วนบุคคล (Data Minimization) และสิทธิของเจ้าของข้อมูล |
| **EU AI Act / GDPR** | *Regulation (EU) 2024/1689 (AI Act) & GDPR* | **2024 (Active)** | การจำแนกระบบ AI ความเสี่ยงสูง (High-Risk AI) และการบังคับใช้ Human Oversight |

---

### หมวดที่ 5: Audit Trace และความสมบูรณ์ของข้อมูล (AUDIT TRACE & DATA INTEGRITY)

สถานะ ณ วันที่ 25 กันยายน 2026:

- **Implemented ใน runtime**: execution/trace identifiers, governance status, evidence/risk/conflict summaries, Decision Record, และ SHA-256 integrity hashes เพื่อช่วยตรวจความสอดคล้องและตรวจจับการเปลี่ยนแปลงของ trace ตามข้อมูลที่ระบบบันทึก
- **Optional deployment integration**: สามารถส่ง metadata ด้าน audit ไป Azure Monitor / Log Analytics ได้เมื่อผู้ดูแลตั้งค่า Data Collection Endpoint และ Rule แล้ว ข้อมูลที่ส่งเป็น metadata ไม่ใช่ prompt, คำตอบเต็ม, email หรือ secret
- **ขอบเขตที่ต้องระบุให้ชัด**: hash chain เป็น tamper-evident control ไม่ใช่หลักฐานว่า storage ทุกชั้นแก้ไขไม่ได้ และ audit trace ไม่ใช่การยืนยันความถูกต้องของข้อเท็จจริงโดยอัตโนมัติ
- **ยังไม่อ้างว่า implemented**: storage-enforced WORM, RFC 3161 trusted timestamp จาก TSA ภายนอก, หรือ external certification. สิ่งเหล่านี้เป็นเป้าหมายที่ต้องมี integration, หลักฐาน deployment และการประเมินแยกต่างหาก

---
### หมวดที่ 6: สถาปัตยกรรมระบบคลาวด์ ความปลอดภัย และระบบป้องกันการวนลูป (CLOUD ARCHITECTURE, SECURITY & ANTI-LOOP ENGINE)

#### 6.1 โครงสร้างระบบคลาวด์ระดับวิสาหกิจ (Cloud Run Microservice Architecture)
- **Containerized Deployment**: รันบน Google Cloud Run ภูมิภาค \`asia-southeast1\` พอร์ต 3000 แบบ Serverless Autoscaling
- **Server-side Proxy Architecture**: การเรียกใช้งานโมเดล DeepSeek API (\`deepseek-chat\` และ \`deepseek-reasoner\` ภายใต้นโยบาย DEEPSEEK_ONLY) ถูกจำกัดให้อยู่เฉพาะใน Express Backend ฝั่ง Server-side เท่านั้น เพื่อลดความเสี่ยงการรั่วไหลของ Secret API Keys สู่เบราว์เซอร์
- **Streaming Pipeline (SSE)**: ส่งผลลัพธ์แบบ Server-Sent Events แบบเรียลไทม์ เพื่อให้ผู้ใช้มองเห็นสถานะการประมวลผลของแต่ละ Stage ทันที

#### 6.2 กลไกป้องกันการประมวลผลซ้ำซ้อนและการวนลูป (Idempotency & Anti-Loop Engine)
ในโหมดการทำงานอัตโนมัติ (Autonomous / Continuous Analysis) ระบบได้ติดตั้งกลไกความปลอดภัย 4 ชั้น:
1. **Idempotency Hash Fingerprinting**: สร้าง Cryptographic Hash จากเนื้อหา หากพบข้อมูลซ้ำซ้อน ระบบจะข้ามการประมวลผลทันที
2. **Safe Defer State & Immediate Reply Marking**: เมื่อระบบพบความไม่แน่นอนสูงหรือติดเงื่อนไข Defer ระบบจะตั้งค่า \`.replied = true\` และ \`state = DEFERRED\` ทันที เพื่อป้องกัน Infinite Trigger Loop
3. **Thread Depth & Execution Cooldown**: ควบคุมความลึกของชุดคำสั่งและการหน่วงเวลาอย่างเป็นระบบ
4. **Autonomous Circuit Breaker**: ตัดการทำงานอัตโนมัติหากเกิดความผิดพลาดติดต่อกันเกินเกณฑ์ที่กำหนด

---

### หมวดที่ 7: เป้าหมายเชิงคุณภาพของการออกแบบระบบและแผนการประเมิน (DESIGN TARGETS & EVALUATION ROADMAP)

หัวข้อนี้เป็นการระบุถึง **เป้าหมายเชิงคุณภาพของการออกแบบระบบ** เพื่อเป็น evaluation targets / design objectives โดยยังไม่ใช่ผลลัพธ์จาก empirical testing หรือมีการอ้างว่า benchmark ผ่านการทดสอบจริง ผ่านชุดทดสอบภายในที่ออกแบบขึ้นเอง (internal test scenarios):
- การประเมินเชิงปริมาณจะดำเนินการเมื่อมี dataset, test protocol และ reproducible methodology ที่เหมาะสม
- ระบบมุ่งเน้นการลดอัตราความเข้าใจคลาดเคลื่อน (Hallucination reduction design) และการสนับสนุนการตรวจสอบย้อนกลับ (Audit traceability support)

---

### หมวดที่ 8: แผนงานพัฒนาเชิงยุทธศาสตร์และข้อสงวนสิทธิ์ทางกฎหมาย (STRATEGIC ROADMAP & LEGAL DISCLAIMER)

#### 8.1 สถานะการพัฒนาและทิศทาง (Current & Planned)
- **ปัจจุบัน**: claim-to-evidence gate, self-audit, conditional recommendation, consistency check, human approval boundary, Decision Record, action-impact structure, sequential evidence plan, hypothesis separation และ recommendation change tracking
- **แผนที่ต้องประเมินก่อนประกาศใช้**: multi-modal evidence anchoring, graph-based retrieval, storage-enforced immutability, trusted timestamping, cross-organization verification และ industry governance templates
- Roadmap ไม่ใช่กำหนดส่งมอบหรือการรับประกันผลลัพธ์; สถานะจะเปลี่ยนเมื่อมี implementation, test coverage และ deployment evidence ที่ตรวจสอบได้
#### 8.2 ข้อสงวนสิทธิ์ทางทรัพย์สินทางปัญญาและกฎหมาย (Intellectual Property & Legal Disclaimer):
เอกสารฉบับนี้จัดทำขึ้นเพื่ออธิบายหลักการทางวิศวกรรมปัญญา ทฤษฎีเชิงแนวคิด และกรอบธรรมาภิบาลของระบบ FIRE KEEPER & PUNN Predictive Cognitive Architecture (PCA v3.1) รายละเอียดทางเทคนิคขั้นสูง อัลกอริทึมเฉพาะ และพารามิเตอร์การตั้งค่าบางส่วนถูกสงวนไว้เพื่อคุ้มครองความลับทางการค้าและทรัพย์สินทางปัญญา ข้อเสนอแนะจากระบบเป็นเพียงข้อมูลสนับสนุนการตัดสินใจ มิอาจนำมาใช้ทดแทนคำแนะนำทางกฎหมาย การแพทย์ หรือการเงินจากผู้ประกอบวิชาชีพที่มีใบอนุญาตได้โดยตรง

---
*จัดทำโดย: คณะทำงานสถาปัตยกรรมปัญญาประดิษฐ์และธรรมาภิบาล (Firekeeper Project)*
*เอกสารอ้างอิง: Firekeeper Project — Design Specification v3.1 | ลิขสิทธิ์ © 2026 Firekeeper Project. สงวนลิขสิทธิ์ตามกฎหมาย.*
`;

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