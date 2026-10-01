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
- Conversation isolation และ persistence
- Decision approval / human authority boundary
- Secure outbound web access / SSRF protection

## Product

ฟีเจอร์ผลิตภัณฑ์ที่ผู้ใช้เข้าถึงโดยตรง:

- Chat workspace
- Publication และ public reader
- Admin dashboard
- Team/workspace governance (optional enterprise surface; approval boundary remains Core)
- Settings และ provider configuration

## Specialized

ฟีเจอร์ที่มีประโยชน์ แต่ไม่ควรผูกกับทุก request:

- Flood AI Lab UI และ weather/hydrology integrations
- Satellite/Planet integrations
- AI Passport interface (reuse Evidence/Governance primitives; do not duplicate the Core)
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
- Historical Social/Autonomous Firestore collections remain migration-sensitive data surfaces. The unused TypeScript OAuth/social-worker runtime was removed after repository-wide caller inspection; legacy collections/rules are retained until an explicit data migration decision.

## กติกาการจัดการต่อไป

1. ห้ามลบโมดูลจากชื่อไฟล์อย่างเดียว ต้องตรวจ import และ route ที่เรียกใช้จริงก่อน
2. โมดูล Specialized ควรโหลดแบบ feature boundary หรือ dynamic import เมื่อเหมาะสม
3. ทุกการลบต้องผ่าน npm run lint, npm run build และ test ที่เกี่ยวข้อง
4. สิ่งที่เป็นเพียงทฤษฎีต้องไม่ถูกนำเสนอเป็น capability ที่ verified
5. แกน Core ต้องไม่มี dependency เฉพาะทางที่ไม่จำเป็น


## Core Reduction Audit — 2026-10-01

Current reduction target:

```text
Evidence → Reasoning → Governance → Accountability
```

Decisions from the current repository audit:

- **KEEP:** evidence/provenance, claim verification, ACH where diagnostically activated, probability provenance, confidence/uncertainty, policy controls, human approval, decision records, audit integrity, conversation isolation, secure retrieval.
- **MERGE:** Memory is context support rather than an independent reasoning authority. AI Passport should reuse the same evidence/verification primitives instead of becoming a parallel governance stack. Publication retrieval should be context/evidence, not system-policy identity.
- **OPTIONAL:** Publication reader, Whitepaper, Team workspace UI, Billing/Plans, Admin surfaces, advanced exports, BYOK configuration and specialized document/vision tools.
- **EXTRACT:** Flood AI Lab is a domain demo/lab. It is no longer exposed in the core navigation; its direct route remains available while extraction is staged.
- **REVIEW FOR REMOVAL:** legacy social/autonomous-worker OAuth and persistence fields. Search found infrastructure definitions but no active product caller; do not delete until build/tests confirm no indirect dependency.

The reduction process is intentionally reversible: first remove specialized modules from the core surface and critical path, then extract or delete only after dependency and regression checks.


### Reduction log

- 2026-10-01: Removed unused `src/server/infrastructure/oauth.ts` (Instagram/X OAuth state infrastructure). Repository search found no active source caller.
- 2026-10-01: Removed unused `src/server/infrastructure/persistence.ts` (autonomous social publishing state). Repository search found no active source caller.
- Firestore `autonomous_state`, `ticks`, and related historical rules/schema are intentionally retained for now; code removal does not delete persisted data.
