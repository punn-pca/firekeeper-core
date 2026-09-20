# FIRE KEEPER Practical Guide

**คู่มือการใช้งาน FIRE KEEPER Core ฉบับอิง implementation ปัจจุบัน**

Version: 2026.09  
Source of truth: repository `punn-pca/firekeeper-core`  
Status: Public practical guide

> **AI supports the decision. Humans retain decision authority.**  
> FIRE KEEPER ช่วยจัดโครงสร้าง วิเคราะห์ ตรวจหลักฐาน เปิดเผยความไม่แน่นอน และสร้างร่องรอยการตรวจสอบ แต่ไม่เปลี่ยนคำแนะนำของ AI ให้เป็นอำนาจอนุมัติแทนมนุษย์

---

## 1. คู่มือนี้ใช้สำหรับอะไร

คู่มือนี้อธิบายการใช้งาน FIRE KEEPER Core จากมุมของผู้ใช้ ผู้ตรวจสอบ และนักพัฒนา โดยยึด implementation และเอกสารใน repository ปัจจุบันเป็นหลัก ไม่ถือว่าฟีเจอร์ที่ “มีโค้ด” เท่ากับ “ผ่านการพิสูจน์” หรือ “ได้รับการรับรอง”

กฎพื้นฐานของระบบคือ:

```text
IMPLEMENTED != VERIFIED != CERTIFIED
```

- **IMPLEMENTED** - มี implementation ที่ทำงานได้ใน codebase
- **VERIFIED / EMPIRICAL_VERIFIED** - มีหลักฐานหรือการทดสอบที่รองรับตามขอบเขตที่ระบุ
- **NOT_VERIFIED** - ยังไม่ควรยกระดับเป็นข้อสรุปที่ผ่านการยืนยัน
- **INSUFFICIENT_EVIDENCE** - หลักฐานไม่พอ ระบบควรคืน N/A/null แทนการสร้างความมั่นใจเทียม
- **THEORETICAL** - แนวคิดหรือแบบจำลองที่ยังไม่ควรตีความเป็นความสามารถที่พิสูจน์แล้ว

---

## 2. Mental Model: FIRE KEEPER ไม่ใช่แค่ Chatbot

มองระบบเป็น **AI Governance Layer + Decision Intelligence Runtime**

```text
User Request
   |
   v
Safety / Access Boundary
   |
   v
PCA Runtime Controller
   |
   v
Model Inference
   |
   v
Epistemic + Evidence Governance
   |
   v
Deterministic Validation
   |
   v
Human Approval / Decision
```

โมเดลภาษาเป็นผู้สร้างและวิเคราะห์ภาษา แต่ **ไม่ใช่ authority ของ validation** การตรวจ schema, evidence state, policy conflict, probability provenance และ escalation ถูกแยกออกจาก model output

---

## 3. เริ่มใช้งานแบบง่ายที่สุด

### 3.1 คำถามทั่วไป

ถามตามธรรมชาติได้ เช่น:

> อธิบายข้อดีข้อเสียของทางเลือก A และ B แบบสั้น ๆ

ระบบสามารถใช้ระดับประมวลผลเบาเมื่อโจทย์ไม่ซับซ้อน

### 3.2 งานที่ต้องใช้หลักฐาน

ระบุสิ่งที่ต้องการตรวจ เช่น:

> เปรียบเทียบ A และ B โดยแยก FACT, INFERENCE, UNCERTAINTY และบอกว่าข้อมูลใดต้องตรวจเพิ่มก่อนตัดสินใจ

### 3.3 งานที่มีผลกระทบสูง

อย่าขอเพียง “เลือกให้เลย” แต่ให้กำหนด decision context:

- เป้าหมาย
- ทางเลือก
- ข้อจำกัด
- หลักฐาน/เอกสาร
- ความเสี่ยง
- นโยบายที่เกี่ยวข้อง
- เงื่อนไขที่ต้องผ่านก่อนอนุมัติ

ผลลัพธ์ที่ต้องการคือ **decision support ที่ตรวจสอบได้** ไม่ใช่คำสั่งอัตโนมัติ

---

## 4. ระดับการประมวลผล L0-L3

Runtime contract ปัจจุบันกำหนด response mode และ process depth เพื่อไม่ใช้กระบวนการหนักเกินความจำเป็น

| Level | Runtime | ใช้เมื่อ |
|---|---|---|
| L0 | `L0_DIRECT` | คำถามตรง คำตอบสั้น งานทั่วไป |
| L1 | `L1_ANALYTICAL` | ต้องอธิบาย วิเคราะห์ หรือเพิ่มบริบท |
| L2 | `L2_STRUCTURED` | งานเปรียบเทียบ เอกสาร หลักฐาน ทางเลือก |
| L3 | `L3_DEEP_AUDIT` | งานเสี่ยงสูง มีข้อขัดแย้ง หรือต้อง audit เชิงลึก |

Response modes ที่ runtime รองรับคือ `DIRECT`, `BRIEF`, `STRUCTURED`, `DEEP`

---

## 5. PCA: กระบวนการคิดแบบมีโครงสร้าง

เอกสารสถาปัตยกรรมปัจจุบันอธิบาย PCA เป็น 12-stage epistemic reasoning pipeline:

1. Context Understanding
2. Stakeholder Assessment
3. Logical Chain Analysis
4. Logical Conflict Identification
5. External Anchoring & Standards Verification
6. Multi-Hypothesis / ACH Analysis
7. Evidence & Confidence Scoring
8. Vulnerability Critique
9. Strategic Recommendation
10. Concrete Action Plan
11. Meta-Reflection
12. Human Approval Gate

สิ่งสำคัญคือ pipeline ไม่ได้มีไว้เพื่อทำให้คำตอบ “ดูซับซ้อน” แต่เพื่อแยกสิ่งที่ระบบรู้ สิ่งที่อนุมาน ความเสี่ยง และจุดที่มนุษย์ต้องอนุมัติ

---

## 6. Evidence ก่อน Confidence

FIRE KEEPER แยกสถานะทางญาณวิทยาเพื่อไม่ให้ข้อความที่ฟังดูมั่นใจกลายเป็น “ข้อเท็จจริง” โดยอัตโนมัติ

- **FACT** - ข้ออ้างที่มีหลักฐานเพียงพอในขอบเขตนั้น
- **INFERENCE** - ข้อสรุปจากข้อมูล ไม่ใช่ข้อมูลดิบ
- **HYPOTHESIS** - คำอธิบายที่ยังต้องทดสอบ
- **UNCERTAINTY** - ข้อมูลไม่พอหรือหลักฐานขัดแย้ง
- **UNKNOWN** - ยังตอบอย่างรับผิดชอบไม่ได้จากข้อมูลที่มี

หลักปฏิบัติ:

```text
UNKNOWN != FALSE
UNVERIFIED != FACT
RETRIEVED != VERIFIED
CREDIBILITY != PROBABILITY
```

การค้นพบข้อมูลจากเว็บหรือการมี source ไม่ได้ทำให้ claim ถูกต้องโดยอัตโนมัติ ต้องผ่าน evidence governance ตามขอบเขตที่เกี่ยวข้อง

---

## 7. Confidence Engine

เมื่อมีข้อมูลที่วัดผลได้ ระบบเอกสารกำหนดสูตร synthesis:

```text
Confidence =
(0.40 * Coverage + 0.35 * Reliability + 0.25 * Quality)
- Penalties
```

ตัวอย่าง penalty ที่เอกสารกำหนด:

- missing information: -10% ต่อจุด
- evidence conflict: -15% ต่อจุด

แต่ invariant สำคัญกว่าสูตรคือ **ถ้าไม่มี measured evidence ระบบไม่ควรสร้าง confidence number ขึ้นมาเอง** และสามารถคืน `null` / `N/A`

---

## 8. Probability Governance: ตัวเลขไม่เท่ากับหลักฐาน

Implementation ปัจจุบันมี probability provenance boundary แยกจาก confidence ทั่วไป

ประเภท provenance:

- `SOURCE_BACKED`
- `CALIBRATED`
- `EXPERT_ELICITATION`
- `USER_SCENARIO`
- `UNCALIBRATED`

ค่าความน่าจะเป็นจะมีอำนาจต่อ Bayesian update ได้ก็ต่อเมื่อผ่านเงื่อนไข provenance และ evidence linkage ที่กำหนด

### กฎสำคัญ

```text
source credibility != P(E|H)
relevance          != P(E|H)
authority          != P(E|H)
LLM confidence     != P(E|H)
```

ห้ามนำคะแนนความน่าเชื่อถือของแหล่งข้อมูลมาใช้เป็น Bayesian likelihood โดยปริยาย

### เมื่อ provenance ไม่ผ่าน

Bayesian engine จะ quarantine quantitative effect:

```text
P(E|H)  = 0.50
P(E|~H) = 0.50
Bayes Factor = 1
Posterior remains at prior
```

ดังนั้น LLM ไม่สามารถสร้างตัวเลข เช่น 0.65 แล้วทำให้ posterior ดูเหมือนเป็น empirical probability เพียงเพราะตัวเลขถูกส่งเข้าเครื่องคำนวณ

### ตัวอย่าง

**ไม่ผ่าน**

```text
AI says likelihood = 0.82
evidence IDs = none
probability provenance = none
=> QUARANTINED
=> quantitative effect neutralized
```

**ผ่าน boundary ขั้นพื้นฐาน**

```text
method = EMPIRICAL_RATE
sourceEvidenceIds = [...]
sampleSize > 0
likelihood = 0.82
counterLikelihood = 0.18
=> admitted if provenance validation has no warnings
```

สถานะ probability และ warnings สามารถถูกแสดงใน Audit UI เมื่อ runtime มี `bayesian_proof`

---

## 9. ACH และ Multi-Hypothesis Reasoning

FIRE KEEPER ใช้แนวคิด ACH เพื่อไม่รีบล็อกคำตอบเดียวเร็วเกินไป

แนวทางใช้งาน:

1. สร้าง hypothesis หลายทาง
2. เชื่อม evidence กับ hypothesis
3. แยก evidence quality ออกจาก probability
4. ใช้ likelihood เฉพาะเมื่อมี probability provenance
5. เก็บ hypothesis ที่ยังไม่ผ่านเป็น `Unconfirmed`
6. เปิดเผย conflict และ uncertainty

ระบบไม่ควรยกระดับ hypothesis เป็น Supported เพียงเพราะ model เขียนเหตุผลได้ดี

---

## 10. Decision Object

Developer contract ปัจจุบันกำหนด Decision Object หลักประกอบด้วย:

- `options`
- `risks`
- `uncertainties`
- `consequences`
- `evidence`
- `assumptions`
- optional `recommendation`
- `confidence`
- `applicable_policies`
- `policy_conflicts`
- `escalation_required`
- `controlLevel`

Validator คืนหนึ่งในสามสถานะ:

```text
PASS
REPAIR_REQUIRED
ESCALATE
```

Critical policy conflict ต้องนำไปสู่ `ESCALATE`

---

## 11. Human Approval Gate

FIRE KEEPER อาจ:

- จัดระเบียบข้อมูล
- วิเคราะห์
- เปรียบเทียบทางเลือก
- เปิดความเสี่ยง
- เสนอ recommendation

แต่ recommendation ไม่ใช่ approval

```text
Evidence
   |
   v
AI Analysis
   |
   v
Options + Risks + Uncertainty
   |
   v
HUMAN APPROVAL
   |
   v
Decision / Action
```

การออกแบบนี้รักษาเส้นแบ่งระหว่าง **การสร้างภาษา**, **การตรวจสอบ**, และ **อำนาจตัดสินใจ**

---

## 12. Audit และ Traceability

Runtime trace สามารถเก็บข้อมูล เช่น:

- request ID / timestamp
- model requested / resolved / provider
- language routing
- classification scores
- response mode / process depth
- memory retrieval / acceptance / rejection
- policies / conflicts
- validation trace
- duration / token / word metrics

ระบบมี cryptographic audit mechanisms เช่น SHA-256 execution trace hash chaining และ Merkle-root related logic เพื่อช่วยตรวจจับการเปลี่ยนแปลง

ควรใช้คำว่า **tamper-evident** ตามความสามารถที่พิสูจน์ได้ และไม่ควรเรียกว่า WORM immutable เว้นแต่ deployment นั้นเชื่อมต่อ storage ที่มีคุณสมบัติ WORM จริงและมีหลักฐานรองรับ

---

## 13. Multi-Provider AI

FIRE KEEPER ออกแบบให้ model/provider เป็นชั้นที่สลับได้ ไม่ใช่ decision authority

repository มี integration/แนวทางสำหรับหลาย provider และ local model แต่ชื่อโมเดลที่พร้อมใช้งานจริงอาจเปลี่ยนตาม provider และ deployment

หลักการที่ไม่เปลี่ยน:

```text
Model inference != Governance authority
```

ไม่ว่าใช้โมเดลใด ผลลัพธ์ต้องผ่าน boundary ที่เกี่ยวข้องก่อนถูกตีความเป็น governed output

---

## 14. API Keys และ Security Boundary

แนวทางสถาปัตยกรรมปัจจุบันเน้น:

- client-controlled provider credentials
- ไม่ใช้ model output เป็น validator
- protected server endpoints ต้องตรวจ authentication ตาม implementation
- administrative capability ต้องมี authorization
- audit sanitizer ต้องลดความเสี่ยงจาก secrets/tokens/PII ใน trace/export

ก่อน publish code ต้องตรวจ:

- ไม่มี `.env` หรือ secret ถูก commit
- ไม่มี token/API key ใน source หรือ docs
- lint/typecheck ผ่าน
- build ผ่าน
- regression tests ที่เกี่ยวข้องผ่าน

---

## 15. วิธีอ่าน Audit UI

เมื่อเปิด Audit/Trace ให้ดูอย่างน้อย 5 อย่าง:

1. **Evidence state** - claim ใด verified / unverified / insufficient
2. **Uncertainty** - ระบบระบุช่องว่างอะไร
3. **Policy / escalation** - มี conflict หรือ human gate หรือไม่
4. **Probability Governance** - likelihood admitted หรือ quarantined
5. **Traceability** - request/runtime/validation chain สอดคล้องกันหรือไม่

อย่าดูเพียง confidence number เดียว

---

## 16. Workflow แนะนำสำหรับการตัดสินใจจริง

### Step 1 - เขียนโจทย์

แทนที่จะถาม:

> ควรเลือก A หรือ B?

ให้ถาม:

> เปรียบเทียบ A และ B สำหรับเป้าหมาย X ภายใต้ข้อจำกัด Y แยก FACT/INFERENCE/UNCERTAINTY ระบุหลักฐานที่ยังขาด ความเสี่ยง และเงื่อนไขที่ต้องยืนยันก่อนอนุมัติ

### Step 2 - แนบหลักฐาน

ให้เอกสาร ข้อมูล หรือลิงก์ที่เกี่ยวข้อง พร้อมระบุช่วงเวลาและขอบเขต

### Step 3 - ตรวจ epistemic labels

ตรวจว่าข้อความที่เป็น inference ไม่ถูกเขียนเหมือน fact

### Step 4 - ตรวจ probability

ถ้ามี posterior/likelihood ให้ตรวจ provenance และ warnings

### Step 5 - ตรวจทางเลือกและความเสี่ยง

อย่าให้ recommendation ซ่อนทางเลือกอื่นหรือ uncertainty

### Step 6 - Human Approval

ผู้มีอำนาจเป็นผู้ตัดสินใจขั้นสุดท้าย

---

## 17. ตัวอย่าง Prompt ที่เหมาะกับ FIRE KEEPER

### วิเคราะห์เอกสาร

> วิเคราะห์เอกสารนี้โดยแยก FACT, INFERENCE, HYPOTHESIS, UNCERTAINTY และ UNKNOWN ระบุ claim ที่มีหลักฐานรองรับและ claim ที่ยังต้องตรวจเพิ่ม

### เปรียบเทียบทางเลือก

> สร้าง Decision Object สำหรับ A/B ระบุ options, risks, uncertainties, consequences, evidence, assumptions และ policy conflicts โดยอย่ายกระดับ recommendation เป็น approval

### ตรวจตัวเลขความน่าจะเป็น

> ตรวจว่า likelihood และ posterior ทุกค่ามี probability provenance หรือไม่ หากไม่มีให้ quarantine quantitative effect และรายงานว่า posterior ไม่ใช่ empirical probability

### Deep Audit

> ใช้การวิเคราะห์เชิงลึก ตรวจ evidence conflict, competing hypotheses, policy conflict, probability provenance, validation state และสิ่งที่ต้องให้มนุษย์อนุมัติ

---

## 18. สิ่งที่ไม่ควรทำ

- อย่าใช้ข้อความของ LLM เป็นหลักฐานในตัวเอง
- อย่าแปลง source credibility เป็น Bayesian likelihood
- อย่าสร้าง confidence score เมื่อไม่มี measured evidence
- อย่าเรียก IMPLEMENTED ว่า VERIFIED
- อย่าเรียก alignment กับมาตรฐานว่า certification
- อย่าให้ recommendation กลายเป็นคำสั่งอัตโนมัติ
- อย่าซ่อน uncertainty เพื่อให้คำตอบดูเด็ดขาด
- อย่าตีความ `USER_SCENARIO` เป็น empirical evidence

---

## 19. สำหรับนักพัฒนา

Source of truth ที่ควรอ่านคู่กับคู่มือนี้:

- `README.th.md`
- `docs/ARCHITECTURE.md`
- `docs/FIRE_KEEPER_SPEC.md`
- `docs/EVIDENCE_MODEL.md`
- `docs/GOVERNANCE.md`
- `docs/PUBLIC_RELEASE.md`
- `docs/developers/API_REFERENCE.md`
- `src/shared/contracts/decision.ts`
- `src/server/services/pcaRuntimeController.ts`
- `src/utils/probabilityProvenance.ts`
- `src/utils/bayesianEngine.ts`
- `src/utils/sourceBackedACH.ts`
- `src/utils/governedBayesianACH.ts`
- `src/utils/governedDynamicACH.ts`

Regression suites ที่สำคัญรวมถึง governance, verification state machine, source-backed probability, probability provenance, governed Bayesian ACH, dynamic ACH probability boundary และ adversarial audit

---

## 20. ข้อจำกัดที่ต้องสื่อสารอย่างตรงไปตรงมา

FIRE KEEPER เป็นระบบที่กำลังพัฒนา ความสามารถบางส่วนอาจอยู่ในสถานะ implementation ก่อนมี benchmark หรือ operational evidence ที่เพียงพอ

ดังนั้นทุกครั้งที่นำไปใช้กับงานสำคัญ ควรถามสามคำถาม:

1. **มีโค้ดหรือยัง?**
2. **มีหลักฐานว่าทำงานตาม claim หรือยัง?**
3. **มีการรับรองภายนอกหรือยัง?**

สามคำถามนี้ไม่ใช่คำถามเดียวกัน

---

## 21. Quick Reference

```text
AI assists. Human decides.

Retrieved != Verified
Implemented != Verified != Certified
Unknown != False
Credibility != Probability

No probability provenance
    -> quarantine likelihood
    -> neutral quantitative effect
    -> posterior must not gain evidentiary authority

Recommendation
    -> validation
    -> human approval
    -> decision
```

---

## 22. สรุป

FIRE KEEPER Core ไม่ได้พยายามทำให้ AI “มีสิทธิ์ตัดสินใจมากขึ้น” แต่พยายามทำให้การใช้ AI ในการตัดสินใจ **ตรวจสอบได้มากขึ้น**

แก่นของการใช้งานจึงไม่ใช่การถามว่า:

> AI ตอบว่าอะไร?

แต่คือการถามต่อว่า:

> ข้อสรุปนี้มาจากหลักฐานอะไร?  
> ส่วนใดเป็นข้อเท็จจริง ส่วนใดเป็นการอนุมาน?  
> มีอะไรที่ยังไม่รู้?  
> ตัวเลขความน่าจะเป็นมี provenance หรือไม่?  
> มีกฎหรือนโยบายใดบังคับให้ escalate?  
> และสุดท้าย ใครเป็นผู้มีอำนาจอนุมัติ?

เมื่อคำถามเหล่านี้ตอบได้ การใช้ AI จึงเปลี่ยนจากการ “เชื่อคำตอบ” ไปสู่การ **ตรวจสอบกระบวนการตัดสินใจ**

---

**FIRE KEEPER Practical Guide**  
PUNN - Creator / Human Architect  
AI assists. PUNN creates.
