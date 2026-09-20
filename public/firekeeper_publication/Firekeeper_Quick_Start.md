# FIRE KEEPER Quick Start

**คู่มือเริ่มต้นใช้งานฉบับย่อ**  
Version: 2026.09

## เริ่มใน 60 วินาที
1. เปิด Workspace/Chat
2. ระบุโจทย์ เป้าหมาย และข้อจำกัด
3. แนบข้อมูลหรือหลักฐานที่เกี่ยวข้อง
4. ขอให้แยก FACT / INFERENCE / HYPOTHESIS / UNCERTAINTY / UNKNOWN
5. ตรวจ Evidence และ Audit
6. งานสำคัญให้มนุษย์อนุมัติขั้นสุดท้าย

## Prompt เริ่มต้น
> วิเคราะห์โจทย์นี้โดยแยก FACT, INFERENCE, HYPOTHESIS, UNCERTAINTY และ UNKNOWN ระบุหลักฐาน สิ่งที่ยังต้องตรวจ ความเสี่ยง และทางเลือก โดยอย่าตัดสินใจแทนฉัน

## ระดับการประมวลผล
- L0_DIRECT - งานตรงไปตรงมา
- L1_ANALYTICAL - วิเคราะห์และเพิ่มบริบท
- L2_STRUCTURED - เปรียบเทียบ/หลักฐาน/ทางเลือก
- L3_DEEP_AUDIT - งานเสี่ยงสูงหรือต้อง audit

## ถ้ามี Confidence
ตรวจ Coverage, Reliability, Quality และ evidence หากไม่มี measured evidence ควรเป็น N/A/null

## ถ้ามี Bayesian Probability
ตรวจ Probability Governance และ provenance warnings หากไม่ผ่านให้ QUARANTINE quantitative effect

## ถ้ามี Recommendation
ตรวจ alternatives, risks, uncertainties, policy conflicts, escalation และ Human Approval

## กฎจำง่าย
- AI assists. Human decides.
- Retrieved != Verified
- Implemented != Verified != Certified
- Unknown != False
- Credibility != Probability
- Recommendation != Approval

อ่าน Practical Guide สำหรับรายละเอียดเต็ม และ Case Studies สำหรับตัวอย่าง
