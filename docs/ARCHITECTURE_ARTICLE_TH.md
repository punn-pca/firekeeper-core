# เจาะลึกสถาปัตยกรรม FIRE KEEPER Core: เมื่อ AI สำหรับองค์กรต้องตรวจสอบได้จริงจากระดับ Codebase

> **"AI มีหน้าที่สนับสนุนการตัดสินใจ แต่มนุษย์ยังคงเป็นผู้ถือครองอำนาจในการตัดสินใจสูงสุด"**  
> *(AI supports the decision. Humans retain decision authority.)*

---

## บทนำ: วิกฤตการณ์ของ "Black-Box AI" ในห้องประชุมผู้บริหาร

ในยุคที่ Generative AI และ Large Language Models (LLMs) กลายเป็นเครื่องมือยอดนิยม องค์กรระดับ Enterprise ส่วนใหญ่กลับต้องเผชิญกับอุปสรรคสำคัญที่ทำให้ไม่สามารถนำ AI ไปใช้ในกระบวนการตัดสินใจระดับยุทธศาสตร์ได้อย่างแท้จริง:

1. **ภาพลวงตาของความมั่นใจ (Hallucinated Certainty):** โมเดลภาษาสามารถสร้างข้อความที่สละสลวย น่าเชื่อถือ และมั่นใจในระดับ 100% แม้ว่าข้อมูลนั้นจะถูกปรุงแต่งขึ้นมาเองโดยปราศจากหลักฐานรองรับ
2. **กล่องดำทางตรรกะ (Black-Box Reasoning):** AI สรุปผลลัพธ์มาให้ทางเดียว โดยไม่แสดงสายธารทางความคิด (Causal Logic Chain), ไม่ระบุข้อสมมุติฐานที่ซ่อนอยู่ และไม่เปิดเผยข้อขัดแย้งเชิงตรรกะ
3. **การสูญเสียอำนาจการควบคุม (Erosion of Human Agency):** ระบบ Agentic AI ยุคใหม่มักพยายามรวบอำนาจการกระทำแบบเบ็ดเสร็จ (Autonomous Encroachment) ซึ่งขัดต่อหลักการกำกับดูแลความเสี่ยงและกฎหมายสากล

**FIRE KEEPER Core** ถูกสร้างขึ้นมาเพื่อแก้ปัญหานี้โดยเฉพาะ มันไม่ใช่เพียงแค่ "UI ครอบโมเดล LLM" แต่เป็น **Enterprise Decision Intelligence & AI Governance Platform** ที่พัฒนาบนรากฐานของ **PUNN Cognitive Architecture (PCA)** เพื่อเปลี่ยน AI จาก "เครื่องจักรเดาสุ่มทางภาษา" ให้กลายเป็น **"ระบบประมวลผลตรรกะทางปัญญาที่ตรวจสอบย้อนกลับได้ทางคณิตศาสตร์และการเข้ารหัสลับ"**

บทความนี้จะเจาะลึกสถาปัตยกรรมของ FIRE KEEPER Core แบบองค์รวม โดยอ้างอิงจากโครงสร้างซอร์สโค้ดที่รันได้จริงในโปรเจกต์

---

## 1. ภาพรวมสถาปัตยกรรมระบบ (System Architecture Overview)

FIRE KEEPER Core ถูกสร้างขึ้นบนสถาปัตยกรรม Full-Stack สมัยใหม่ที่มุ่งเน้นประสิทธิภาพ ความปลอดภัยแบบ Fail-Closed และการตรวจสอบย้อนกลับได้ทุกมิติ

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER / ENTERPRISE CLIENT                         │
│   (React 19 + Tailwind CSS v4 + Motion + KaTeX Mathematical Rendering)  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ SSE Streaming & HTTPS
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    NODE.JS / EXPRESS RUNTIME GATEWAY                    │
│   (Security Headers · Strict CORS · Nonce Token Auth · Rate Limiting)   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌──────────────────────────────────────┐   ┌──────────────────────────────┐
│       PCA 12-STAGE ENGINE            │   │ EVIDENCE & GOVERNANCE ENGINE │
│ • Saliency & Context Parsing         │   │ • Admiralty Grading (A to F) │
│ • Causal Dependency DAG              │   │ • Mathematical Confidence    │
│ • ACH Multi-Hypothesis Testing       │   │ • Conflict & Penalty Gating  │
│ • Adversarial FMEA Risk Critique     │   │ • Policy Enforcement Guard   │
│ • Meta-Reflection Audit Gate         │   │   (BLOCK / REVISE / PASS)    │
└──────────────────┬───────────────────┘   └──────────────┬───────────────┘
                   │                                      │
                   └──────────────────┬───────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  CRYPTOGRAPHIC AUDIT LEDGER (WORM)                      │
│ • SHA-256 Execution Trace Chaining: eventHash = SHA256(prev + stepData) │
│ • Merkle Tree Root Anchor across all Pipeline Decision Nodes            │
│ • Automated Deep Sanitizer (API Keys, PII, Token Redaction)            │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
           ┌──────────────────────────┴──────────────────────────┐
           ▼                                                     ▼
┌──────────────────────────────────────┐   ┌──────────────────────────────┐
│        PERSISTENCE & CLOUD           │   │    AI RUNTIME EXECUTION      │
│ • Firebase Auth & Cloud Firestore    │   │ • DeepSeek API Runtime       │
│ • In-Memory & LocalStorage Cache     │   │   (deepseek-chat / reasoner) │
│ • Bidirectional Race-Safe Hydration  │   │ • Strict DEEPSEEK_ONLY Policy│
└──────────────────────────────────────┘   └──────────────────────────────┘
```

---

## 2. หัวใจหลักของกระบวนการคิด: 12-Stage Epistemic Reasoning Pipeline

ในไฟล์ [`src/server/services/pcaEngine.ts`](file:///C:/Users/Ton/.gemini/antigravity/scratch/firekeeper-core/src/server/services/pcaEngine.ts) ระบบจะไม่ปล่อยให้โมเดล AI ตอบคำถามทันที แต่จะบังคับให้กระบวนการประมวลผลเดินทางผ่าน **12 สเตจทางญาณวิทยา (Epistemic Pipeline)** ซึ่งถูกกำหนดสเปกอย่างเป็นทางการ:

```text
1. Context Understanding  ──► 2. Stakeholder Assessment ──► 3. Logical Chain Analysis
             │                                                          │
             ▼                                                          ▼
4. Conflict Identification ──► 5. External Anchoring    ──► 6. Multi-Hypothesis (ACH)
             │                                                          │
             ▼                                                          ▼
7. Evidence & Confidence   ──► 8. Vulnerability Critique──► 9. Strategic Options
             │                                                          │
             ▼                                                          ▼
10. Concrete Action Plan   ──► 11. Meta-Reflection      ──► 12. HUMAN APPROVAL GATE
```

### รายละเอียดของสเตจสำคัญใน Codebase:

* **Stage 1–3: การสกัดเจตนา ตรรกะ และเงื่อนไขบังคับ (Context & Causal DAG)**
  ระบบรับข้อมูลดิบ พร้อมไฟล์แนบ (PDF, ZIP, Text) ผ่านโมดูลแยก Chunk (`ParsedAttachmentChunk`) เพื่อสร้าง Directed Acyclic Graph (DAG) เชื่อมโยงความสัมพันธ์เชิงเหตุและผล
* **Stage 6: Analysis of Competing Hypotheses (ACH)**
  แทนที่จะสนับสนุนสมมติฐานเดียวที่โมเดลคิดได้อันแรก ระบบบังคับให้สร้างสมมติฐานทางเลือกคู่ขนาน ($H_1, H_2, H_3$) เพื่อป้องกัน **Confirmation Bias**
* **Stage 7: Evidence Evaluation & Admiralty Grading**
  จัดหมวดหมู่ข้อมูลทุกชิ้นตามเกณฑ์ข่าวกรองสากล (Admiralty Intelligence Standard):
  * `FACT`: ข้อมูลที่มีหลักฐานประจักษ์ชัดเจน
  * `INFERENCE`: ข้อสรุปที่ได้จากการอนุมานเชิงตรรกะ
  * `UNCERTAINTY`: จุดที่ไม่มีข้อมูลยืนยัน
* **Stage 8: Adversarial Red-Team & FMEA Critique**
  จำลองบทบาทเป็นฝ่ายตรงข้าม (Red-Team) เพื่อวิพากษ์จุดอ่อน ตรวจหาข้อบกพร่องตามโมเดล Failure Mode and Effects Analysis (FMEA) และประเมินผลกระทบข้างเคียงขั้นที่สอง (Second-Order Consequences)
* **Stage 11: Meta-Reflection (การสกัดกั้นการสร้างข้อมูลเท็จ)**
  ประเมินความสอดคล้องของผลลัพธ์ผ่านเกณฑ์ 12-Rule Anti-Fabrication ป้องกันข้อความปรุงแต่ง
* **Stage 12: Level-3 Human Approval Gate**
  ด่านสุดท้ายที่ล็อกผลลัพธ์ไว้ และสงวนสิทธิ์การตัดสินใจขั้นสูงสุดให้แก่มนุษย์

---

## 3. ระบบสอบเทียบความเชื่อมั่นทางคณิตศาสตร์ (Calibrated Confidence Engine)

ความแตกต่างสำคัญระหว่าง FIRE KEEPER กับระบบ AI ทั่วไป คือ **"การปฏิเสธตัวเลขความเชื่อมั่นจอมปลอม"**

ในไฟล์ [`src/server/services/verificationStateMachine.ts`](file:///C:/Users/Ton/.gemini/antigravity/scratch/firekeeper-core/src/server/services/verificationStateMachine.ts) และ [`src/server/services/evidenceGovernance.ts`](file:///C:/Users/Ton/.gemini/antigravity/scratch/firekeeper-core/src/server/services/evidenceGovernance.ts) การประเมินคะแนนจะใช้สูตรคณิตศาสตร์แบบถ่วงน้ำหนักหลายมิติ (Multi-Criteria Weighted Synthesis):

$$\text{Confidence Score} = \Big( 0.40 \times \text{Coverage} + 0.35 \times \text{Reliability} + 0.25 \times \text{Quality} \Big) - \sum \text{Penalties}$$

### องค์ประกอบของสูตร:
1. **Evidence Coverage (40%):** สัดส่วนความครอบคลุมของหลักฐานต่อประเด็นคำถาม
2. **Source Reliability (35%):** ความน่าเชื่อถือของแหล่งที่มาตามมาตรฐาน Admiralty (0.0 ถึง 1.0)
3. **Content Quality (25%):** คุณภาพและความสอดคล้องของเนื้อหาหลักฐาน
4. **Penalties Deductions:**
   * หัก **$-10\%$** ต่อจุดข้อมูลสำคัญที่ขาดหายไป (Missing Signal)
   * หัก **$-15\%$** ต่อข้อขัดแย้งในหลักฐาน (Evidence Conflict)

### กฎเหล็ก Invariant Rule ในระดับโค้ด:
```typescript
// หากไม่มีหลักฐาน หรือข้อมูลยังไม่ผ่านการวัดผล (Unmeasured)
if (!hasMeasuredEvidence || evidenceCount === 0) {
  return {
    scorePercent: null, // N/A ห้ามแอบอ้างใส่ตัวเลขเดาสุ่ม
    label: 'ไม่สามารถประเมินได้',
    calibrationStatus: 'NOT_VERIFIED',
    isDeterminable: false
  };
}
```
หากระบบไม่มีหลักฐานเชิงประจักษ์ จะแสดงผลเป็น **`N/A (ไม่สามารถประเมินได้)`** ทันที เพื่อป้องกันไม่ให้ผู้บริหารตัดสินใจบนตัวเลขเปอร์เซ็นต์ที่ AI กุขึ้นมาเอง

---

## 4. กลไกการตรวจสอบความถูกต้องด้วยการเข้ารหัสลับ (Cryptographic Audit Ledger)

ในโลกองค์กร หากผลการวิเคราะห์ของ AI ถูกนำไปใช้ตัดสินใจทางธุรกิจ การเงิน หรือคดีความ **บันทึกประวัติการตัดสินใจ (Decision Log) จะต้องไม่สามารถถูกแก้ไขย้อนหลังได้**

ใน [`src/utils/executionTraceEngine.ts`](file:///C:/Users/Ton/.gemini/antigravity/scratch/firekeeper-core/src/utils/executionTraceEngine.ts) FIRE KEEPER ได้นำสถาปัตยกรรมระดับบล็อกเชนและ WORM (Write-Once-Read-Many) มาใช้งานจริง:

```typescript
// 1. การเชื่อมโยงแฮชเป็นสายโซ่ (Sequential Hash Chaining)
const eventHash = crypto
  .createHash('sha256')
  .update(previousHash + JSON.stringify(stepPayload))
  .digest('hex');

// 2. การคำนวณ Merkle Root ยืนยันความสมบูรณ์ของไปป์ไลน์ทั้งชุด
const merkleRoot = calculateMerkleRoot(executionSteps.map(s => s.eventHash));
```

### การป้องกันการโจมตีแบบ Adversarial Tampering:
ระบบมีชุดทดสอบการเจาะระบบใน [`scripts/testAdversarialAudit.ts`](file:///C:/Users/Ton/.gemini/antigravity/scratch/firekeeper-core/scripts/testAdversarialAudit.ts) ซึ่งตรวจสอบอัตโนมัติ:
* หากมีใครแอบแก้ไขข้อความแม้แต่ตัวอักษรเดียวใน Payload -> **Event Hash จะไม่ตรงกัน (Caught)**
* หากแอบเปลี่ยน Merkle Root -> **ระบบตรวจจับการปลอมแปลงได้ทันที (Rejected)**
* หากแอบสลับตำแหน่งหรือตัดขั้นตอนออก -> **Previous Hash Linkage จะขาด (Disrupted)**

---

## 5. การบังคับใช้นโยบายความปลอดภัยและธรรมาภิบาล (Policy Enforcement Gate)

ใน [`src/server/services/evidenceGovernance.ts`](file:///C:/Users/Ton/.gemini/antigravity/scratch/firekeeper-core/src/server/services/evidenceGovernance.ts) มี State Machine คอยกำกับดูแลคำตอบของ AI แบบเรียลไทม์:

| นโยบาย (Policy) | เงื่อนไขที่ตรวจพบ | บทลงโทษและการกระทำของระบบ |
| --- | --- | --- |
| **AUTONOMOUS_AUTHORITY** | AI อ้างอำนาจสั่งการหรือตัดสิทธิ์มนุษย์ | **BLOCK (สกัดกั้นทันที)** |
| **COERCION** | AI ใช้ภาษาบีบบังคับ กดดันให้ต้องเลือกทางใดทางหนึ่ง | **BLOCK (สกัดกั้นทันที)** |
| **OVERCLAIM** | AI อ้างความมั่นใจเกินจริงโดยไม่มีหลักฐานรองรับ | **REVISE (ส่งกลับไปลดทอนความมั่นใจ)** |
| **CLEAN** | ผ่านเกณฑ์ตรรกะและหลักฐานครบถ้วน | **PASS (อนุญาตให้แสดงผล)** |

---

## 6. สถาปัตยกรรม Full-Stack ทันสมัยและความเสถียรระดับ Production

FIRE KEEPER Core ไม่ได้มีดีเพียงแค่ทฤษฎี แต่ถูกสร้างด้วยเทคโนโลยีสมัยใหม่ที่พร้อมใช้งานจริง:

1. **Frontend Architecture:**
   * พัฒนาด้วย **React 19** ร่วมกับ **Tailwind CSS v4** และ **Motion** เพื่อการแสดงผลที่ลื่นไหล
   * แสดงสูตรคณิตศาสตร์ด้วย **KaTeX** สดบนเบราว์เซอร์
   * รองรับการส่งออกรายงานบทวิเคราะห์เป็นไฟล์ **1:1 Standalone HTML Report** ที่ฝังระบบ WebCrypto ตรวจสอบแฮชได้ในตัวโดยไม่ต้องต่ออินเทอร์เน็ต
2. **Backend & AI Runtime:**
   * สถาปัตยกรรม Express บน Node.js บันเดิลด้วย **esbuild** เป็นไฟล์เดี่ยว (`dist/server.cjs`) ประสิทธิภาพสูง
   * ใช้นโยบาย **`DEEPSEEK_ONLY`** รองรับโมเดล `deepseek-chat` และ `deepseek-reasoner` (R1) โดยแยกแยะ Internal Thinking Process ให้อยู่ในชั้น Telemetry เท่านั้น เพื่อความปลอดภัยของข้อมูล
3. **ความทนทานของข้อมูล (Resilience & Offline First):**
   * ระบบซิงค์ข้อมูลแบบสองทิศทาง (Bidirectional Hydration) ระหว่าง LocalStorage กับ Cloud Firestore
   * ผ่านการทดสอบ Race Condition ใน [`scripts/testConversationMerge.ts`](file:///C:/Users/Ton/.gemini/antigravity/scratch/firekeeper-core/scripts/testConversationMerge.ts) รับประกันว่าเมื่อเปิดหลายแท็บพร้อมกัน หรือเน็ตหลุดระหว่างสนทนา ประวัติการวิเคราะห์จะไม่สูญหายและไม่ถูกเขียนทับเด็ดขาด

---

## 7. บทสรุป: ทำไม FIRE KEEPER ถึงเป็นคำตอบสำหรับองค์กรยุค AI Governance

ในโลกที่กฎระเบียบด้าน AI ระดับสากล เช่น **EU AI Act, ISO/IEC 42001, และ NIST AI RMF** กำลังถูกบังคับใช้อย่างเข้มงวด การใช้ AI ที่เป็น Black-Box จะกลายเป็นความเสี่ยงทางกฎหมายและชื่อเสียงขององค์กร

**FIRE KEEPER Core คือตัวเปลี่ยนเกม:**
* **โปร่งใส 100%:** เปิดเผยขั้นตอนตรรกะและสูตรการคำนวณความเชื่อมั่นทุกขั้นตอน
* **ป้องกันความเสี่ยง:** ตรวจจับข้ออ้างเกินจริงและตัดสิทธิ์การตัดสินใจอัตโนมัติ
* **ตรวจสอบได้ในชั้นศาลหรือผู้สอบบัญชี:** บันทึกรอยเท้าด้วย Merkle Root และ SHA-256 Chaining
* **คงอำนาจของมนุษย์:** ออกแบบมาเพื่อเป็นเครื่องเคียงทางปัญญาของผู้บริหาร โดยไม่แย่งชิงอำนาจตัดสินใจ

FIRE KEEPER Core จึงไม่ใช่แค่เครื่องมือแชต แต่เป็น **"ระบบปฏิบัติการเพื่อการตัดสินใจเชิงกลยุทธ์ (Strategic Decision OS)"** ที่ทำให้ผู้บริหารสามารถนำพลังของ AI มาขับเคลื่อนองค์กรได้อย่างมั่นใจ โปร่งใส และปลอดภัยอย่างแท้จริง

---

*บทความนี้จัดทำขึ้นโดยอ้างอิงจากสถาปัตยกรรมและโค้ดของโปรเจกต์ [FIRE KEEPER Core](https://github.com/punn-pca/firekeeper-core)*
