# FIRE KEEPER Module Classification

สถานะการจัดกลุ่มโค้ดเพื่อแยกแกนระบบออกจากฟีเจอร์เฉพาะทาง โดยระยะนี้ยังไม่ลบไฟล์และไม่เปลี่ยน runtime

## Core

ส่วนที่ต้องคงไว้สำหรับระบบหลัก:

- React/Vite frontend และ Express runtime
- Authentication, authorization, CORS และ rate limiting
- Unified LLM runtime
- Evidence, claims, verification และ quality gates
- Governance state machine
- Audit trace, sanitization และ hash integrity
- Conversation, workspace และ persistence
- Secure outbound web access / SSRF protection

## Product

ฟีเจอร์ผลิตภัณฑ์ที่ผู้ใช้เข้าถึงโดยตรง:

- Chat workspace
- Publication และ public reader
- Admin dashboard
- Team/workspace governance
- Settings และ provider configuration
- Flood AI Lab

## Specialized

ฟีเจอร์ที่มีประโยชน์ แต่ไม่ควรผูกกับทุก request:

- Flood weather/hydrology integrations
- Satellite/Planet integrations
- AI Passport
- Vision routing
- OCR และ document extraction
- Advanced export formats
- Bayesian/ACH extensions

## Experimental / Review Required

ต้องตรวจ usage และ test coverage ก่อนนำไปผูกกับ production path:

- โมดูล ACH/Bayesian ที่มีหลาย implementation
- Probability scoring ที่ยังไม่มี empirical calibration
- โมดูลเชิงทฤษฎีหรือ persona-specific
- Telemetry/export ที่เปิดใช้เฉพาะบาง deployment
- Legacy หรือ compatibility adapters

## กติกาการจัดการต่อไป

1. ห้ามลบโมดูลจากชื่อไฟล์อย่างเดียว ต้องตรวจ import และ route ที่เรียกใช้จริงก่อน
2. โมดูล Specialized ควรโหลดแบบ feature boundary หรือ dynamic import เมื่อเหมาะสม
3. ทุกการลบต้องผ่าน npm run lint, npm run build และ test ที่เกี่ยวข้อง
4. สิ่งที่เป็นเพียงทฤษฎีต้องไม่ถูกนำเสนอเป็น capability ที่ verified
5. แกน Core ต้องไม่มี dependency เฉพาะทางที่ไม่จำเป็น
