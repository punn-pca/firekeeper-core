# FIRE KEEPER AI Governance

**กรอบการกำกับดูแล AI สำหรับ Decision Intelligence**  
Version: 2026.09 - อิง FIRE KEEPER Core ปัจจุบัน

## 1. หลักการ
FIRE KEEPER แยก model inference ออกจาก governance authority และรักษาอำนาจตัดสินใจขั้นสุดท้ายไว้กับมนุษย์

## 2. Human Agency
Recommendation ไม่ใช่ Approval งานที่มีความเสี่ยง นโยบายขัดแย้ง หรือหลักฐานไม่พอ ต้องเปิดเผยข้อจำกัดและใช้ Human Approval / escalation ตามกฎ

## 3. Epistemic Governance
รักษาความต่างระหว่าง FACT, INFERENCE, HYPOTHESIS, UNCERTAINTY และ UNKNOWN

```text
UNKNOWN != FALSE
UNVERIFIED != FACT
RETRIEVED != VERIFIED
```

## 4. Capability States
- VERIFIED / EMPIRICAL_VERIFIED
- IMPLEMENTED
- NOT_VERIFIED
- INSUFFICIENT_EVIDENCE
- THEORETICAL

```text
IMPLEMENTED != VERIFIED != CERTIFIED
```

การอ้าง alignment กับมาตรฐานไม่ใช่ certification หากไม่มีการรับรองภายนอก

## 5. Evidence และ Confidence
Evidence ต้องเชื่อมกับ claim และ provenance ระบบไม่ควรสร้าง confidence เมื่อไม่มี measured evidence

สูตรเอกสารปัจจุบัน:
```text
0.40 * Coverage + 0.35 * Reliability + 0.25 * Quality - Penalties
```

## 6. Probability Governance
Credibility, relevance, authority และ LLM confidence ไม่ใช่ Bayesian likelihood

Probability provenance boundary ใช้ป้องกันค่าตัวเลขที่ไม่มี evidence linkage จากการสร้าง quantitative evidentiary effect

## 7. Bayesian Quarantine
เมื่อ probability admission ไม่ผ่าน ระบบ neutralize likelihood ใน Bayesian boundary เพื่อไม่ให้ synthetic probability ขยับ posterior อย่างมีอำนาจเชิงหลักฐาน

## 8. Decision Governance
Decision Object ครอบคลุม options, risks, uncertainties, consequences, evidence, assumptions, recommendation, confidence, policies, conflicts, escalation และ control level

Validator:
- PASS
- REPAIR_REQUIRED
- ESCALATE

Critical policy conflict ต้อง ESCALATE

## 9. Auditability
Runtime trace และ cryptographic audit mechanisms ช่วยให้ตรวจสอบกระบวนการได้ แต่ต้องแยก implementation, deployment guarantee และ external certification ออกจากกัน

## 10. Security
ใช้ authentication/authorization ตาม boundary, redact secrets/tokens/PII, ห้าม commit credentials และต้อง rotate credential ที่รั่ว

## 11. Governance Checklist
ก่อนใช้ผลลัพธ์สำคัญ ให้ถาม:
1. Claim นี้มี evidence อะไร?
2. Evidence verified แค่ไหน?
3. มี uncertainty/conflict หรือไม่?
4. ตัวเลข probability มี provenance หรือไม่?
5. มี policy conflict/escalation หรือไม่?
6. ใครเป็นผู้อนุมัติ?

**AI assists. Human decides.**
