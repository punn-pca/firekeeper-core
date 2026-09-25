# FIRE KEEPER Case Studies

**กรณีศึกษาการใช้ AI Governance และ Decision Intelligence**  
Version: 2026.09.25 - อิง FIRE KEEPER Core ปัจจุบัน


## สถานะเอกสารและระบบ — 25 กันยายน 2026

เอกสารเล่มนี้ได้รับการทบทวนกับ FIREKEEPER Core ปัจจุบันแล้ว สำหรับความสามารถเชิงระบบ ให้ยึดสถานะดังนี้: มี claim-to-evidence gate, self-audit, conditional recommendation, consistency check, human-approval boundary, Decision Record, action-impact structure, sequential evidence plan, hypothesis separation และ recommendation change tracking.

Audit trace มี identifiers, สรุป evidence/risk/conflict, governance status และ SHA-256 integrity hashes. Azure Monitor / Log Analytics เป็น optional integration ที่ส่ง metadata เท่านั้น ไม่ส่ง prompt, คำตอบเต็ม, email หรือ secret. สิ่งนี้เป็น tamper-evident ตามขอบเขต deployment ไม่ใช่ WORM immutable, RFC 3161 trusted timestamp หรือ external certification.
> กรณีทั้งหมดเป็นสถานการณ์ตัวอย่างเพื่ออธิบายพฤติกรรมระบบ ไม่ใช่ผลการดำเนินงานจริง

## 1. กรอบการวิเคราะห์
ทุกกรณีใช้ลำดับ Context -> Evidence -> Uncertainty -> Hypotheses -> Risks -> Governance -> Human Decision

กฎร่วม:
- Retrieved != Verified
- Implemented != Verified != Certified
- Credibility != Probability
- Recommendation != Approval

## 2. เลือกผู้ให้บริการ
องค์กรเปรียบเทียบ Provider A/B โดยใส่ราคา SLA security evidence integration constraints และ switching cost ระบบแยกข้อเท็จจริงออกจาก inference สร้าง options, risks, uncertainties, consequences และ assumptions ก่อน Human Approval

## 3. ข่าวหรือข้อกล่าวอ้างที่ยังไม่ยืนยัน
การพบข้อมูลจากหลายแหล่งไม่เท่ากับ verification ระบบต้องรักษา verification state และเปิดเผย conflict/ช่องว่าง หากหลักฐานไม่พอให้คง NOT_VERIFIED หรือ INSUFFICIENT_EVIDENCE

## 4. AI สร้างตัวเลข 82%
หาก likelihood ไม่มี probability provenance และ evidence linkage ให้ QUARANTINE quantitative effect โดยไม่แปลงความน่าเชื่อถือของแหล่งหรือความมั่นใจของ LLM เป็น P(E|H)

## 5. ACH หลายสมมติฐาน
สร้าง H1/H2/H3 เชื่อม evidence แยก evidence quality ออกจาก probability และคง hypothesis ที่ยังไม่มีหลักฐานพอเป็น Unconfirmed

## 6. Critical Policy Conflict
เมื่อ Decision Object มี policy conflict ระดับ CRITICAL deterministic validator ต้อง ESCALATE แทนการให้โมเดล bypass policy

## 7. Confidence ที่ไม่มี measured evidence
หากหลักฐานวัดผลไม่ได้ ระบบควรคืน null/N/A แทนการสร้างเปอร์เซ็นต์ความมั่นใจเทียม

## 8. บทเรียน
FIRE KEEPER มีหน้าที่ทำให้เห็นว่าอะไรคือ fact, inference, uncertainty, probability ที่มี provenance, จุดที่ต้อง escalate และผู้มีอำนาจอนุมัติ

**AI assists. Human decides.**
