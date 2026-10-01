# FIRE KEEPER Module Classification

สถานะการจัดกลุ่มโค้ดเพื่อแยกแกนระบบออกจากฟีเจอร์เฉพาะทาง การลดระบบเริ่มดำเนินการแล้วแบบ reversible: specialized surfaces ถูกถอนจาก Core ก่อน และ dead runtime code จะถูกลบเมื่อยืนยันว่าไม่มี caller

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
- **REMOVED RUNTIME:** legacy social/autonomous-worker OAuth and persistence TypeScript infrastructure was removed after caller inspection. Historical Firestore collections/rules remain until an explicit data-migration decision.

The reduction process is intentionally reversible: first remove specialized modules from the core surface and critical path, then extract or delete only after dependency and regression checks.


### Reduction log

- 2026-10-01: Removed unused `src/server/infrastructure/oauth.ts` (Instagram/X OAuth state infrastructure). Repository search found no active source caller.
- 2026-10-01: Removed unused `src/server/infrastructure/persistence.ts` (autonomous social publishing state). Repository search found no active source caller.
- Firestore `autonomous_state`, `ticks`, and related historical rules/schema are intentionally retained for now; code removal does not delete persisted data.


### Context boundary update — 2026-10-01

- The system prompt is now governance-only.
- Official Publication excerpts are runtime context/evidence and are no longer duplicated into the system instruction.
- Publication provenance/hash validation remains intact; canonical origin proves source identity/integrity, not empirical truth.
- AI Passport remains an optional user-mediated adapter. Its verification path reuses the shared Claim–Evidence Linker and Claim Verification Governance rather than defining a second evidence authority.


### Memory boundary update — 2026-10-01

- Long-term Memory is a context service, not an empirical evidence authority.
- New memory records default to `layer: Context` and no synthetic epistemic confidence (`confidence: 0`) unless the caller explicitly supplies metadata.
- Relevance filtering controls whether memory is injected; it does not verify the remembered content.
- Runtime audit labels memory policy as `RELEVANCE_FILTERED_CONTEXT_ONLY`.
- Existing historical records are not rewritten automatically; compatibility is preserved while new writes follow the stricter boundary.


### Conversation context consolidation — 2026-10-01

- `resolveConversationContext()` is now the shared runtime boundary for client context normalization, server-authoritative Hosted history, and fresh-session empty context.
- `server.ts` no longer maintains a second copy of persisted-turn normalization.
- Foreign-conversation reassignment remains in the route because ownership/audit/session creation are transport concerns; contextual payloads are still quarantined.
- Regression coverage prevents the runtime from drifting back to duplicated conversation-boundary logic.


### ACH / Bayesian boundary consolidation — 2026-10-01

- Diagnostic competing-hypothesis reasoning (ACH) is Core.
- `evidenceGovernance.buildDynamicACH()` is the canonical production entry point and resolves to `buildGovernedDynamicACH()`.
- Bayesian posterior movement is an optional quantitative extension inside that governed path. It remains neutral/quarantined unless admissible probability provenance supplies both conditional likelihoods.
- Verification, source credibility, and Claim–Evidence relations may affect evidence eligibility/diagnostics, but none of them are converted into `P(E|H)`.
- `bayesianEngine.computeDeterministicACH()` uses comparative joint-normalization semantics and is retained only for compatibility/regression experiments; it is not the production decision path.
- Regression coverage prevents `server.ts` from bypassing the canonical governed ACH boundary.
