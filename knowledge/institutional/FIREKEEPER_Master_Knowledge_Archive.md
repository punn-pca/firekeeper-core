# FIREKEEPER — Institutional Knowledge Preservation & Reconstruction

> **เอกสารรวม / Master Knowledge Handbook**  
> Document ID: FK-KA-002 · Version 2.0 · 13 October 2026  
> Project: FIREKEEPER / PUNN Predictive Cognitive Architecture (PCA)  
> Repository: `punn-pca/firekeeper-core` · Website: https://firekeeper.site  
> Founder: Kriangkrai Kamphaen (เกรียงไกร คำแผ่น)

## ขอบเขตและระดับความน่าเชื่อถือ

เอกสารนี้รวบรวมความรู้เชิงสถาบันจากบทสนทนาและบันทึกประวัติการพัฒนา FIREKEEPER ที่มีอยู่ ครอบคลุมช่วงประมาณกุมภาพันธ์–ตุลาคม 2026 ไม่ใช่การตรวจสอบโค้ดปัจจุบันแบบอิสระ และไม่อ้างว่าเข้าถึงทุกข้อความ ทุก commit หรือทุกระบบ production โดยตรง

**ป้ายกำกับหลักฐาน**

- **FACT** — ข้อเท็จจริงที่ปรากฏในประวัติการสนทนา/ผลทดสอบที่บันทึกไว้ ไม่ได้แปลว่ายังเป็นสถานะ production ปัจจุบัน
- **DECISION** — การตัดสินใจหรือข้อกำหนดที่ผู้สร้างเลือกไว้
- **ASSUMPTION** — สมมติฐานที่ใช้ทำงานแต่ยังไม่พิสูจน์ครบ
- **HYPOTHESIS** — คำอธิบายหรือผลลัพธ์ที่ต้องทดสอบ
- **OPINION** — ข้อประเมินหรือข้อเสนอเชิงวิเคราะห์

**ระดับความคืบหน้า**: `PROPOSED → IMPLEMENTED → TESTED → VERIFIED → PRODUCTION VERIFIED → INDEPENDENTLY ASSESSED` ต้องแยกจากกันเสมอ

---

# SECTION 1 — EXECUTIVE SUMMARY

## วิสัยทัศน์

**FIREKEEPER ต้องการเปลี่ยน AI จากระบบที่เพียงสร้างคำตอบ ให้เป็นระบบสนับสนุนการตัดสินใจที่ตรวจสอบหลักฐานได้ มองเห็นความไม่แน่นอน ประเมินความเสี่ยง และรักษาอำนาจการตัดสินใจไว้กับมนุษย์**

> **AI assists. Humans decide.**

ปัญหาตั้งต้นคือ LLM สามารถสร้างคำตอบที่ลื่นไหลและมั่นใจ แม้ข้อมูลไม่ครบ หลักฐานไม่สนับสนุน หรือไม่พิจารณาทางเลือกอื่น FIREKEEPER จึงผสาน (1) PCA orchestration (2) evidence/provenance (3) competing hypotheses (4) risk critique (5) human approval และ audit

## ผู้ใช้เป้าหมาย

| กลุ่ม | คุณค่าที่คาดหวัง |
|---|---|
| บุคคลทั่วไป | วิเคราะห์ทางเลือกอย่างมีเหตุผล |
| นักวิเคราะห์/ผู้เชี่ยวชาญ | ตรวจหลักฐาน สมมติฐาน และข้อจำกัด |
| ทีมงาน | ใช้บริบทและการทบทวนร่วมกัน |
| ผู้อนุมัติ | เห็นเหตุผล ความเสี่ยง และสถานะอนุมัติ |
| องค์กร | นโยบาย สิทธิ์ การตรวจสอบย้อนหลัง |

กลุ่มเหล่านี้เป็น **สมมติฐานตลาด** ไม่ใช่หลักฐานว่ามี product-market fit แล้ว

## จุดต่างเชิงยุทธศาสตร์

ความแตกต่างที่มีศักยภาพอยู่ที่ **การผสาน** cognitive framework + evidence + governance + product experience ไม่ใช่การอ้างว่า ACH, RAG, human-in-the-loop หรือ structured prompting เป็นสิ่งประดิษฐ์ใหม่ทั้งหมด

## Timeline ภาพรวม

| ช่วงเวลา | วิวัฒนาการ | ความหมาย |
|---|---|---|
| ก.พ.–เม.ย. 2026 | PUNN, แนวคิด cognitive architecture, The 12 Laws of the Firekeeper | ก่อตัวเป็นหลักคิด |
| พ.ค.–ส.ค. 2026 | FIREKEEPER product, เว็บ, Firebase, Cloud Run | จากแนวคิดสู่ซอฟต์แวร์ |
| ก.ย. 2026 | PCA 12 stages, evidence, audit, security, billing | เพิ่มความเป็นระบบและ governance |
| ต้น ต.ค. 2026 | ตรวจ prompt, context/memory, provider, MCP, retrieval | พบช่องว่างระหว่าง “มีฟีเจอร์” กับ “ทำงานจริง” |
| 11–13 ต.ค. 2026 | Direct/Governed separation, responsive UI, runtime identity, เอกสารองค์ความรู้ | เน้นตรวจสอบและส่งต่อความรู้ |

**ข้อสรุปเชิงยุทธศาสตร์ (OPINION):** ความก้าวหน้าขั้นถัดไปควรเป็นการพิสูจน์ว่า Governed PCA ทำให้ผลการตัดสินใจดีขึ้นอย่างวัดได้ในต้นทุนที่รับได้ มากกว่าการเพิ่มฟีเจอร์เพียงเพื่อความซับซ้อน

---

# SECTION 2 — KNOWLEDGE EXTRACTION

## ศัพท์และความหมาย

| คำ | คืออะไร | ทำไมต้องมี | ควรใช้เมื่อ | ไม่ควรใช้เมื่อ |
|---|---|---|---|---|
| FIREKEEPER | ผลิตภัณฑ์ซอฟต์แวร์ | นำ PCA ไปใช้จริง | อ้างถึงแอป/บริการ | หมายถึงทฤษฎี PCA อย่างเดียว |
| PCA | PUNN Predictive Cognitive Architecture | จัดกระบวนการวิเคราะห์ | วิเคราะห์งานซับซ้อน | ตีความเป็น LLM 12 calls เสมอ |
| FACT | ข้อกล่าวอ้างที่มีหลักฐานเพียงพอในบริบท | แยกจากการเดา | พิสูจน์ได้ | ยังไม่มีแหล่งรองรับ |
| EVIDENCE | วัสดุ/ข้อมูลสนับสนุนหรือขัดแย้ง | ตรวจสอบข้อกล่าวอ้าง | ประเมิน claim | ใช้ URL แทนการตรวจเนื้อหา |
| HYPOTHESIS | คำอธิบายที่เป็นไปได้ | ป้องกันสรุปเร็ว | มีหลายคำอธิบาย | เสนอเป็นความจริงที่พิสูจน์แล้ว |
| INFERENCE | ข้ออนุมานจากข้อมูล | ทำให้เหตุผลตรวจได้ | มีความสัมพันธ์อธิบายได้ | ซ่อนสมมติฐาน |
| ACH | Analysis of Competing Hypotheses | เทียบคำอธิบายกับหลักฐาน | ปัญหามีหลายสาเหตุ | คำถามง่ายหรือไม่มีหลักฐาน |
| Claim–Evidence Link | ความสัมพันธ์ SUPPORTS/CONTRADICTS/CONTEXTUAL/NEUTRAL | แยกการอ้างจากการสนับสนุนจริง | ประเมิน claims | คิดว่าแหล่งข้อมูลเกี่ยวข้องเท่ากับสนับสนุน |
| Human Approval Gate | จุดอนุมัติจากมนุษย์ | รักษาความรับผิดชอบ | การตัดสินใจสำคัญ | ใช้เป็นเพียงข้อความสวยงาม |
| Direct AI | ทางเรียก LLM ตรง | UX ธรรมดาและ baseline | งานที่ไม่ต้อง governed | อ้างว่าได้ผ่าน PCA แล้ว |
| Governed PCA | ทางวิเคราะห์แบบมีหลักฐานและกฎ | ตรวจสอบเหตุผล | งานที่ต้องวิเคราะห์/กำกับ | เพิ่มความฝืดกับงานเล็กโดยไม่จำเป็น |
| BYOK | Bring Your Own Key | ให้ใช้คีย์ผู้ใช้ | ตั้งค่าปลอดภัย | เผยคีย์ใน logs |
| Provenance | ต้นทางและประวัติข้อมูล | ตรวจสอบย้อนกลับ | หลักฐานและ metadata | สร้างต้นทางขึ้นเอง |
| Confidence | คะแนน heuristic | แสดงความมั่นใจแบบมีเงื่อนไข | ระบุความหมายชัด | อ้างเป็นโอกาสถูกต้องแบบ calibrated |

## PCA 12 stages

1. `INTENT_DEFINITION` — ระบุโจทย์จริง
2. `CONTEXT_UNDERSTANDING` — เข้าใจบริบท
3. `PURPOSE_SCOPE` — กำหนดขอบเขต
4. `DATA_STRUCTURING` — จัดโครงข้อมูล
5. `RELATIONSHIP_MODELING` — เชื่อมความสัมพันธ์
6. `EVIDENCE_EVALUATION` — ตรวจคุณภาพและความเกี่ยวข้องของหลักฐาน
7. `HYPOTHESIS_FORMATION` — สร้างคำอธิบายที่เป็นไปได้
8. `RISK_CRITIQUE_ANALYSIS` — ตรวจข้อโต้แย้งและความเสี่ยง
9. `STRATEGIC_DECISION` — เสนอทางเลือกที่มีเหตุผล
10. `RESPONSE_FORMATTING` — สื่อสารให้เข้าใจ
11. `META_REFLECTION` — ทบทวนข้อจำกัดของการวิเคราะห์
12. `HUMAN_APPROVAL_GATE` — คงอำนาจอนุมัติไว้กับมนุษย์

**DECISION:** Evidence Evaluation มาก่อน Hypothesis Formation ในลำดับที่พัฒนาขึ้นภายหลัง **ข้อควรระวัง:** PCA เป็น application-level orchestration ไม่จำเป็นต้องเรียก LLM 12 ครั้ง

## Confidence heuristic

\[
C=0.40E_c+0.35E_r+0.25E_q-P
\]

โดย `Ec` = evidence coverage, `Er` = evidence reliability, `Eq` = evidence quality, `P` = penalty. **FACT:** สูตรนี้ปรากฏในประวัติโครงการ **ASSUMPTION:** น้ำหนักสะท้อนคุณภาพการวิเคราะห์ได้ **LIMITATION:** ไม่ใช่ calibrated probability และต้อง validate ค่า/สถานะ evidence ก่อนแสดง

## หลักการสำคัญ

- **Evidence before confidence:** ไม่สร้างความมั่นใจเกินหลักฐาน
- **Human authority:** ข้อเสนอจาก AI ไม่ใช่การอนุมัติ
- **Inspectability:** ตรวจเส้นทางจากข้อมูลสู่ข้อสรุปได้ โดยไม่จำเป็นต้องเปิดเผย reasoning ภายในโมเดล
- **Provider independence:** กฎหลักต้องไม่ติดกับผู้ให้บริการ LLM เดียว
- **Root-cause repair:** ตรวจต้นเหตุก่อนแก้เฉพาะหน้า
- **Preserve known-good:** การปรับปรุงต้องไม่ทำลายฟีเจอร์ที่ใช้ได้
- **Verification before claims:** เขียนโค้ด/ผ่าน build/merge/deploy/production verification เป็นคนละสถานะ
- **Usability is correctness:** ปุ่มที่มองไม่เห็นหรือกดไม่ได้ถือเป็นข้อบกพร่อง

## สมมติฐานหลักที่ต้องทดสอบ

| สมมติฐาน | วิธีทดสอบ |
|---|---|
| PCA ดีกว่า Direct LLM ในงานสำคัญ | Controlled benchmark ด้วย rubric เดียวกัน |
| Evidence labels ลด hallucination | วัด unsupported-claim rate |
| Memory ช่วยความต่อเนื่อง | End-to-end retrieval/injection tests |
| Governance เพิ่มความเชื่อมั่นองค์กร | Pilot และ security/authorization audit |
| Multi-provider ลด lock-in | ทดสอบ portability, cost, failure modes |
| แพ็กเกจจ่ายเงินสร้างธุรกิจยั่งยืน | วัด retention, MRR, margin, churn |

---

# SECTION 3 — ARCHITECTURE RECONSTRUCTION

## Logical architecture

```text
Web / Mobile / Chat / Workspace
             |
      Authenticated API
             |
     +-------+-------+
     |               |
  DIRECT AI      GOVERNED PCA
     |               |
  Chat/Prompt     Context/Memory
     |               |
     |           Evidence Retrieval
     |               |
     |           Evidence Evaluation
     |               |
     |           Hypothesis/Risk
     |               |
     |           Governed Prompt
     +-------+-------+
             |
      Unified LLM Runtime
             |
      Provider Adapters
             |
       LLM Response
             |
  Validation / Presentation
             |
   Persistence / Audit
             |
 Human Approval (when required)
```

**Cross-cutting:** auth, policy, quotas, logging, secret protection, retention, tool permissions, observability. แผนภาพนี้เป็น logical boundaries ไม่ได้หมายความว่าทุกกล่องเป็น service แยกกัน

## Historical stack

| ชั้น | เทคโนโลยี |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Express, TypeScript |
| Deployment | Docker, Google Cloud Run |
| Auth/Data | Firebase Authentication, Firestore |
| Edge | Cloudflare |
| Mobile | Android / Capacitor-based application |
| Models | DeepSeek, OpenAI, Claude, Gemini, Groq, Mistral, Perplexity, OpenRouter, Ollama, custom compatible endpoints |
| Commercial | Subscription, quota, Stripe-related infrastructure |

Historical Cloud Run service: `fire-keeper-punn-cognitive-architecture`, region `asia-southeast1`. ต้องตรวจสภาพแวดล้อมจริงก่อนใช้งาน

## Data flow

**Direct:** User → Auth/entitlement → selected conversation context → provider/model resolution → LLM request → streamed response → appropriate persistence. ต้องไม่ปน governed wrapper โดยไม่ตั้งใจ

**Governed:** User → intent/scope → context → retrieval → evidence verification → competing hypotheses → risk critique → governed prompt → model → validation → audit/persistence → human approval when required

**Memory invariant:** `Stored → Retrieved → Selected → Injected → Consumed → Observable impact` ต้องทดสอบครบ

**Approval invariant:** ข้อความ `approved: true` จากโมเดลไม่ใช่ authenticated approval event

## ADR register

### ADR-001 — PCA orchestration
- **Situation:** คำตอบ LLM ตรงตรวจหลักฐานและความเสี่ยงได้ยาก
- **Decision:** ใช้กรอบ 12 stages
- **Reason:** สร้าง shared analytical contract
- **Alternatives (inferred):** direct prompting, smaller pipeline, multi-agent
- **Tradeoff:** latency, complexity, test burden
- **Consequence:** ต้องแยก framework จากจำนวน model calls

### ADR-002 — Human authorization boundary
- **Situation:** คำแนะนำ AI อาจถูกเข้าใจว่าเป็นการตัดสินใจ
- **Decision:** Human Approval Gate + backend policy
- **Alternatives (inferred):** prompt-only rules, autonomous execution
- **Tradeoff:** workflow state, review latency
- **Consequence:** authenticated state transitions และ audit

### ADR-003 — Unified provider runtime
- **Situation:** ต้องรองรับหลายโมเดล
- **Decision:** provider adapter abstraction
- **Alternatives (inferred):** single-provider, scattered provider-specific code
- **Tradeoff:** compatibility maintenance
- **Consequence:** regression matrix ราย provider

### ADR-004 — Evidence before hypothesis
- **Situation:** ข้อมูลที่ retrieve อาจไม่ผ่านการตรวจ
- **Decision:** verified evidence states ก่อน ACH
- **Alternatives (inferred):** ทุก source ใช้ได้, ให้ LLM ตัดสินทั้งหมด
- **Tradeoff:** evidence ที่ใช้ได้น้อยลง, validation cost
- **Consequence:** tests/fixtures ต้องระบุ status

### ADR-005 — Hosted memory
- **Situation:** การวิเคราะห์ต้องต่อเนื่อง
- **Decision:** memory APIs, retrieval/context integration
- **Alternatives (inferred):** stateless, browser-only
- **Tradeoff:** privacy, retention, ranking
- **Consequence:** storage อย่างเดียวไม่พอ

### ADR-006 — Direct vs Governed separation
- **Situation:** prompt governance ปนเข้า Direct mode
- **Decision:** แยก execution paths
- **Reason:** baseline ที่เปรียบเทียบได้จริง
- **Tradeoff:** dual-mode testing
- **Consequence:** ต้อง inspect exact provider payloads

### ADR-007 — Runtime metadata grounding
- **Situation:** โมเดลเดาวันที่/ชื่อโมเดล/ต้นทางผิด
- **Decision:** backend ส่ง authoritative runtime facts
- **Tradeoff:** metadata contract
- **Consequence:** ไม่ใช้ model self-description เป็น telemetry

### ADR-008 — Selective mobile rollback
- **Situation:** APK ใหม่มีบัคแต่เวอร์ชันเก่าทำงาน
- **Decision:** นำส่วน known-good กลับมาแบบเลือกเฉพาะส่วน
- **Tradeoff:** compatibility review
- **Consequence:** regression baseline สำหรับ mobile

### ADR-009 — Custom endpoint hardening
- **Situation:** SSRF/credentials/network exposure
- **Decision:** URL guard, auth, CORS restrictions
- **Tradeoff:** จำกัดบาง endpoint
- **Consequence:** negative security tests

### ADR-010 — Honest enterprise claims
- **Situation:** มีฟีเจอร์ governance แต่ยังไม่ใช่ certification
- **Decision:** แยก implemented/tested/verified/assessed
- **Consequence:** ห้ามอ้าง ISO 42001 certification โดยไม่มีหลักฐาน

### ADR-011 — Commercial entitlements
- **Situation:** ต้องจัดแพ็กเกจและ quota
- **Decision:** backend entitlement + billing integration
- **Tradeoff:** synchronization complexity
- **Consequence:** admin overrides ต้องจำกัดสิทธิ์และ audit

### ADR-012 — Responsive chat
- **Situation:** controls ถูกบัง/ผิดสัดส่วนในหลายอุปกรณ์
- **Decision:** ปรับ shared interaction + device-specific constraints
- **Tradeoff:** visual regression testing
- **Consequence:** ทดสอบ mobile/tablet/desktop/zoom/keyboard

---

# SECTION 4 — DECISION HISTORY

| ช่วง | สถานการณ์ | ทางเลือก | การตัดสินใจ | เหตุผล | ผลตามมา |
|---|---|---|---|---|---|
| ก.พ. | ต้องการ cognitive model | direct AI หรือ framework | สร้าง PUNN/PCA | ควบคุมกระบวนการคิด | แนวคิดเริ่มมีโครง |
| กลางปี | ต้องการให้คนใช้จริง | เอกสารหรือ product | ทำเว็บและ backend | ใช้งานจริงได้ | operational responsibility |
| ก.ย. | Code/docs ไม่ตรง | ปล่อยไว้หรือ align | ยืนยัน 12 stages | ป้องกันความสับสน | canonical framework |
| ก.ย. | Security/retention | prompt-only หรือ backend controls | harden API/data | ลดความเสี่ยงจริง | เพิ่ม tests |
| ก.ย. | Monetization | free-only หรือ plans | subscription/entitlements | ทดสอบธุรกิจ | billing complexity |
| ปลาย ก.ย. | Memory แสดงแต่ไม่ใช้ | cosmetic fix หรือ trace | ตรวจ pipeline | แก้ root cause | verification debt |
| ต.ค. | Retrieval บางแหล่งไม่มีเนื้อหา | ถือว่าเป็น evidence หรือ reject | เพิ่ม status/provenance | ไม่หลอกความมั่นใจ | quality gate |
| ต.ค. | Direct mode ปน governance | shared prompt หรือ separate | แยก modes | valid baseline | dual-mode regression |
| ต.ค. | UI/Android บัค | quick CSS หรือ cross-layer debugging | ตรวจจริงและ selective rollback | รักษาของเดิม | mobile test baseline |
| ต.ค. | ความรู้กระจัดกระจาย | เก็บในแชทหรือทำ handbook | institutional documentation | ลด key-person risk | transferable context |

**Strategic pivots:** philosophy → product; prompt instructions → backend governance; feature presence → end-to-end verification; technical scope → measurable user/business value

---

# SECTION 5 — FAILED EXPERIMENTS / NEGATIVE KNOWLEDGE

> บันทึกนี้แยก “ความล้มเหลวที่พบ” ออกจาก “ข้อจำกัดที่ยังไม่ตรวจซ้ำ” เพื่อไม่ให้สร้างข้อกล่าวอ้างเกินหลักฐาน

| ID | สิ่งที่ลอง/สมมติฐาน | สิ่งที่เกิดขึ้น | บทเรียน |
|---|---|---|---|
| F01 | Memory เก็บแล้ว LLM ใช้เอง | records แสดง แต่ injection ไม่ครบ | storage ≠ contextual use |
| F02 | Retrieved URL = evidence | dynamic page ได้ `TITLE_ONLY` | metadata ≠ verified content |
| F03 | Claim links มีแล้ว ACH ใช้ | links ไม่ได้ถูก consume ครบ | producer ≠ consumer integration |
| F04 | ทุก provider ทำตามภาษาเหมือนกัน | Gemini มีภาษาจีนหลุด | provider-specific tests |
| F05 | Confidence numeric น่าเชื่อถือเอง | ค่าติดลบ/N/A/ไม่สัมพันธ์ evidence | validate score/state |
| F06 | Follow-up template ใช้ได้ทุกคำถาม | คำถามต่อยอดไม่สัมพันธ์ | derive from context |
| F07 | `adjustResize`/`100dvh` แก้ keyboard ได้ | บัคยังอยู่ | inspect native IME + WebView |
| F08 | Cloud Run deploy พร้อมกันได้ | version conflict | serialize deployment |
| F09 | merge/build = deployed | production status ยังไม่ยืนยัน | verify revision/traffic |
| F10 | SPA meta ใช้ทุกหน้าได้ | crawler/canonical ผิด | route-specific metadata |
| F11 | LLM รู้ชื่อโมเดลตัวเอง | ระบุตัวตนผิด | backend identity authoritative |
| F12 | ปรับ mobile ใหม่แล้วดีขึ้นแน่ | APK ใหม่ regress | selective known-good rollback |
| F13 | เอกสารภายใน credibility ต่ำเสมอ | primary evidence ถูก undervalue | authority depends on claim/context |
| F14 | เพิ่ม MCP ก่อนก็ได้ | complexity สูง ไม่แน่จำเป็น | validate use case first |
| F15 | ปุ่มมีใน code เท่ากับใช้ได้ | clipped/hidden/unresponsive | actual interaction tests |
| F16 | CI green = complete | ยังไม่รู้ production | status discipline |
| F17 | Dependency/install แบบไม่ reproducible | lockfile/build issues | deterministic builds |
| F18 | Client-side audit/data authority เพียงพอ | เคยพบ access/session concerns | server-side ownership checks |

## Deep lessons

**Memory:** ตรวจ `write → retrieve → select → inject → consume → test`. ไม่ให้ UI หลอกว่ามีความจำที่ใช้จริง

**Evidence:** แยก `discovered`, `retrieved`, `content-complete`, `verified`, `claim-supporting`. อย่าให้ title/URL กลายเป็น proof

**ACH:** Link relations `SUPPORTS`, `CONTRADICTS`, `CONTEXTUAL`, `NEUTRAL` ต้องเป็น input ของ evaluator ไม่ใช่แค่ metadata เก็บไว้

**Confidence:** สูตร heuristic ไม่ควรแสดงค่าที่ขัดกับ evidence หรือหลอกว่าเป็นความน่าจะเป็น calibrated

**Android:** ตรวจ Android window/theme/IME insets, Capacitor config, WebView, visual viewport, packaged assets ก่อนทำ padding hack

**Deploy:** ใช้ immutable artifact, coordinate jobs, check active Cloud Run revision, traffic, health และ rollback

**Direct AI:** ตรวจ exact system/developer prompt และ provider payload ไม่ให้ PCA instructions ปน

**Discontinued concept:** Offline chat เคยเป็นส่วนหนึ่งของระบบ แต่ทิศทางภายหลังร้องขอให้ถอดออก อย่า restore โดยไม่ตัดสินใจใหม่

---

# SECTION 6 — SUCCESSFUL PATTERNS

| Pattern | ปัญหาที่แก้ | ทำไมมีประโยชน์ | Reuse |
|---|---|---|---|
| PCA orchestration | reasoning ไม่เป็นระบบ | มี stage contracts | สูง |
| Provider adapters | vendor lock-in | แยก runtime | สูง |
| Evidence states | source ไม่น่าเชื่อถือ | แยก verified/unverified | สูง |
| Direct/Governed separation | baseline ปน | test semantics ได้ | สูง |
| Human approval boundary | AI self-authorization | trusted backend transition | สูง หาก enforcement ผ่าน test |
| SSRF/auth/CORS tests | security regressions | negative checks | สูง |
| Selective rollback | mobile regression | จำกัด blast radius | สูง |
| Runtime grounding | hallucinated metadata | trusted source of truth | สูง |
| Context telemetry | memory/prompt assembly มองไม่เห็น | traceable pipeline | สูง |
| Real-device UX review | responsive defects | ทดสอบสถานการณ์จริง | สูง |
| Explicit status reporting | false completion | แยก merge/deploy/prod | สูง |

**ข้อจำกัด:** รูปแบบที่ดีเชิงสถาปัตยกรรมไม่เท่ากับพิสูจน์ว่าช่วยลูกค้าได้แล้ว ต้องมี controlled evaluation

---

# SECTION 7 — PROMPT EVOLUTION MAP

> Version ต่อไปนี้เป็น **reconstructed phases** ไม่ใช่เลขเวอร์ชันไฟล์ prompt ที่ตรวจยืนยันได้ทุกตัว ไม่มีการแต่ง literal historical prompts ขึ้นมา

| Version | Purpose | Weakness | Improvement | Why | Benefit / Evidence |
|---|---|---|---|---|---|
| V1 Direct LLM | ตอบคำถาม | ขาด evidence/risk | PCA structure | คำตอบลื่นไม่เท่ากับถูก | baseline เชิงแนวคิด |
| V2 PCA structured | 12-stage reasoning | ยังไม่ enforce policy | governed instructions | structure ไม่พอ | shared analytical contract |
| V3 Governed | ให้ LLM ทำตาม governance | prompt ไม่บังคับสิทธิ์ได้ | epistemic rules + backend | model ไม่ใช่ policy engine | ชัดเจนขึ้น |
| V4 Evidence-aware | ลด unsupported claims | retrieval ไม่ครบ/ไม่ verified | provenance/status | citation ไม่ใช่ proof | evidence contracts |
| V5 Context-aware | memory continuity | stored ไม่ injected | selection/telemetry | storage ≠ use | observability; ยังต้อง verify |
| V6 Lean prompts | ลด token overhead | duplicated instructions | stable/dynamic separation | cost/latency | cleaner assembly |
| V7 Runtime-grounded | วันที่/model/provenance ถูก | LLM เดา metadata | backend facts | telemetry ต้อง trusted | ลด identity hallucination |
| V8 Dual-mode | Direct baseline จริง | governed contamination | separate payloads | fair comparison | historical regression tests passed |
| V9 Natural output | แชร์แบบคนเขียน | หัวข้อ/Markdown แข็ง | presentation transform | style ≠ facts | format flexibility; prod test pending |

## Prompt Library — reconstructed canonical templates

### PL-01 Governed Decision

```text
Role: Produce an inspectable decision proposal.
Separate FACT, ASSUMPTION, HYPOTHESIS, INFERENCE and UNKNOWN.
Use only eligible evidence for verified claims.
Identify contradictions and competing explanations.
Evaluate risk, reversibility and missing information.
Do not treat confidence as calibrated probability.
Do not claim human approval.
Output: question, evidence, alternatives, risks, proposal, approval requirement.
```

### PL-02 Evidence Evaluator

```text
For each evidence item, inspect source, provenance, content completeness,
claim relevance, verification status and support/contradiction relation.
Do not infer support from a URL or title alone.
```

### PL-03 Risk Critic

```text
Challenge assumptions; identify contradictory evidence, alternative causes,
failure conditions, impact, reversibility and information gaps.
Do not fabricate evidence to resolve uncertainty.
```

### PL-04 Contextual Follow-ups

```text
Generate follow-ups based on the actual user question, relevant context,
unresolved evidence and next useful decision. Avoid generic templates.
```

### PL-05 Natural Comment

```text
Rewrite as a natural conversational comment without headings, excessive
Markdown or AI-like phrasing. Preserve facts, qualifications and uncertainty.
Do not invent personal experience or new claims.
```

### PL-06 Runtime Identity

```text
Treat backend-provided provider/model identity as authoritative.
Do not infer identity from chat history or generated self-description.
If identity is unavailable, say so.
```

**Prompt governance:** ทุก production prompt ต้องมี ID/version, owner, execution mode, input/output contract, changelog, regression suite, known failures, rollback reference, cost/latency measurements

---

# SECTION 8 — GOVERNANCE RULEBOOK

## Mandatory invariants

1. AI output ไม่ใช่ human authorization
2. ผู้ใช้เพิ่มสิทธิ์ตนเองไม่ได้
3. Evidence ต้องมี provenance และ verification state
4. Unverified ไม่ถูก promote เป็น verified เงียบ ๆ
5. Confidence ต้องสอดคล้องกับ evidence
6. Audit ต้องสะท้อนเหตุการณ์จริง
7. Retention/deletion ต้อง enforce จริง
8. External tools/URLs ต้องผ่าน security policy
9. Persistence failure ต้องไม่รายงาน success
10. Direct AI ไม่รับ governed wrapper โดยไม่ตั้งใจ
11. การกระทำสำคัญต้องมี approval ตาม policy
12. Product/enterprise claims ต้องมีหลักฐานรองรับ

## Historical retention defaults

| Data | Default historically |
|---|---|
| Conversations | 30 วัน |
| Memories | 90 วัน |
| Audit logs | 365 วัน |

ไม่ใช่ข้อกำหนดทางกฎหมายสากล ต้องตรวจ env, TTL, actual deletion, contractual obligations

## Escalation triggers

- หลักฐานขัดแย้งอย่างมีนัยสำคัญ
- การตัดสินใจมีผลทางการเงิน สิทธิ์ ความปลอดภัย หรือย้อนกลับยาก
- Tool ขอสิทธิ์เกินขอบเขต
- ตรวจแหล่งสำคัญไม่ได้
- Confidence ไม่สอดคล้อง evidence
- Approval state ไม่ชัด
- Production change เสี่ยงข้อมูลสูญหาย
- Policy conflict ไม่สามารถ resolve ได้

## Approval state concept

`DRAFT → PENDING_REVIEW → APPROVED / REJECTED / REVISE → AUDITED`

การเปลี่ยนสถานะต้องผ่าน authenticated actor + role + policy + state checks ไม่ใช่ให้ LLM ส่งข้อความ `approved` แล้วถือว่าจบ

---

# SECTION 9 — FOUNDER COGNITIVE MODEL

> **HYPOTHESIS:** เป็นการอนุมานรูปแบบการทำงานจากการตัดสินใจซ้ำ ๆ ไม่ใช่การอ่านใจหรือวิเคราะห์บุคลิกทางคลินิก

## If Founder were solving this problem from scratch, they would:

1. นิยามปัญหาจริง ไม่เริ่มด้วยเทคโนโลยี
2. ตรวจระบบปัจจุบันและข้อจำกัด
3. แยก fact/assumption/unknown
4. Trace root cause ข้ามชั้นระบบ
5. ระบุสิ่งที่ต้องไม่เสีย
6. เสนอทางเลือกและ tradeoffs
7. ประเมิน security/governance/cost/UX
8. เลือกความซับซ้อนขั้นต่ำที่พอ
9. แก้แบบตรวจสอบย้อนหลังได้
10. รันทดสอบที่เกี่ยวข้อง
11. ทดสอบ regression และอุปกรณ์จริง
12. Verify merge/deploy/production ตามจริง
13. ปรับซ้ำจนผ่าน acceptance criteria
14. บันทึกเหตุผลและความเสี่ยงคงเหลือ

## Founder values — inferred priority

1. Safety / human authority
2. Correctness
3. Preserve working behavior
4. Verification
5. Usability
6. Maintainability / cost
7. Visual polish

## Strengths and associated risks

| Strength | Risk | Countermeasure |
|---|---|---|
| Systems thinking | scope expansion | explicit boundaries |
| Rapid iteration | regression | automated tests |
| Product detail | endless refinement | definition of done |
| Broad ownership | key-person dependency | ADR and delegated ownership |
| Evidence focus | validation bottleneck | repeatable evaluation protocol |
| Experimentation | architecture sprawl | roadmap by measured value |

---

# SECTION 10 — HIDDEN KNOWLEDGE

1. **Fluency is not evidence.** โครงการไม่ได้ต้องการ AI ที่แค่พูดเก่ง แต่ต้องการคำตอบที่ไม่ทำให้คนเข้าใจผิด
2. **Governance must survive provider replacement.** กฎต้องไม่ผูกกับ prompt เฉพาะ vendor
3. **Visible feature ≠ functioning feature.** Memory, audit, buttons และ evidence ต้องพิสูจน์ data flow
4. **Credibility is an asset.** ผู้สร้างขอการประเมินแบบไม่อวยและแยกข้ออ้างจากหลักฐาน
5. **UX is part of integrity.** ปุ่มถูกบัง/เลื่อนซ้อน/ตัวอักษรขาดถือเป็นข้อบกพร่องจริง
6. **Architecture must be earned.** MCP และ integration ต้องมี use case ไม่ใช่สร้างเพราะทำได้
7. **Historical reasoning is IP-like context.** เหตุผลในการเลือก/เลิกใช้มีค่าแม้ไม่ใช่สิทธิ IP ตามกฎหมายเสมอ
8. **Internal primary evidence can be authoritative.** แหล่งภายในไม่ควรถูกลดความน่าเชื่อถือโดยอัตโนมัติ แต่ต้องจำกัดขอบเขตข้ออ้าง
9. **Tests must reflect contracts.** Fixture ที่ไม่ตรง evidence rules ไม่ควรทำให้ลดมาตรฐานโดยไม่วิเคราะห์
10. **Runtime metadata is not model prose.** วันที่ ชื่อโมเดล สิทธิ์และ provenance ต้องมาจากระบบที่เชื่อถือได้

---

# SECTION 11 — INTELLECTUAL PROPERTY AUDIT

> **OPINION / scenario estimates:** ตัวเลขต่อไปนี้เป็นการประเมินต้นทุนสร้างทดแทนอย่างหยาบในหน่วยบาท ไม่ใช่มูลค่าบริษัท มูลค่าทรัพย์สินที่รับรอง หรือข้อสรุปทางกฎหมาย หมวดต่าง ๆ ซ้อนทับกัน ห้ามนำมาบวกเป็นมูลค่ารวม

| Asset | ตัวอย่าง | ความหายาก | ความยากในการทำซ้ำ | Replacement cost scenario | Competitive value |
|---|---|---|---|---:|---|
| Code | PCA, runtime, APIs, UI, mobile, billing | ปานกลาง | ปานกลาง | ฿1.8–4.0M | Integration execution |
| Architecture | Boundaries, flows, provider abstraction | ปานกลาง | ปานกลาง | ฿0.3–0.9M | Maintainability |
| Framework | PCA stages, cognitive laws, decision model | เฉพาะองค์ประกอบค่อนข้างสูง | ปานกลาง | ฿0.45–1.2M | Differentiation if validated |
| Governance | Approval, evidence rules, audit | ปานกลาง | ปานกลาง | ฿0.5–1.4M | Enterprise potential |
| Knowledge | Lessons, failure register, rationale | เฉพาะโครงการ | ปานกลาง | ฿0.25–0.7M | Avoided learning cost |
| Prompt | Governed templates, regression cases | ต่ำ–ปานกลาง | ต่ำ–ปานกลาง | ฿0.12–0.45M | Limited standalone moat |
| Workflow | Dev/release/review process | ต่ำ | ต่ำ | ฿0.12–0.35M | Delivery consistency |
| Data | Fixtures, evaluation cases, audit data | ยังไม่พิสูจน์ว่าหายาก | ต่ำ–ปานกลาง | ฿0.03–0.18M | Unknown; rights matter |
| Context | Decision lineage, founder rationale | สูงในเชิงบริบท | ทำซ้ำตรง ๆ ยาก | ฿0.15–0.5M | Succession advantage |
| Founder | Tacit expertise, judgment | เฉพาะบุคคล | ทำซ้ำตรง ๆ ยาก | ไม่ควรตั้งเป็น IP replacement cost ตรง ๆ | Human capital |

## Integrated reconstruction scenarios (not additive)

- **AI-assisted comparable product:** ประมาณ ฿2.0–4.5M
- **Conventional team comparable product:** ประมาณ ฿5.0–10.0M
- **Enterprise-grade broader reconstruction:** ประมาณ ฿8–15M+ (รวมงาน assurance ที่ยังไม่ยืนยันว่ามีในระบบปัจจุบัน)

## Due diligence checklist

- Chain of title และ contributor assignments
- Third-party licenses และ dependencies
- Current BUSL-1.1 terms, change date, change license (ประวัติกล่าวถึง 25 Sep 2030 / Apache 2.0; ต้องตรวจไฟล์จริง)
- Ownership of data, prompts, documentation and trademarks
- Production deployment and security validation
- Customer contracts, actual revenue, retention, unit economics
- Evidence benchmark and independent assessment

**ข้อสรุป:** ต้นทุนสร้างทดแทนมีนัยสำคัญ แต่ durable moat และ enterprise readiness ยังต้องพิสูจน์

---

# SECTION 12 — TRANSFERABLE HANDBOOK

## Must never change (institutional invariants)

- Human authorization ไม่ถูกแทนด้วย AI text
- Provenance ไม่ถูกแต่ง
- Citation ไม่ถูกถือเป็น proof อัตโนมัติ
- Unverified ไม่ถูกแปลงเป็น verified เงียบ ๆ
- Confidence heuristic ไม่ถูกอ้างเป็น probability
- Authorization ต้องอยู่ใน trusted backend
- Secrets ไม่รั่ว
- Persistence failure ไม่ถูกซ่อน
- Direct/Governed contracts ชัด
- Production claims ต้องมี production evidence
- Decision records traceable
- Data isolation ตามสิทธิ์จริง

## Can evolve

PCA internal implementation, prompt wording, provider adapters, UX, retrieval, memory ranking, data stores, deployment architecture, model routing, pricing — หากผ่าน invariants และ tests

## First 90 days of a successor team

| Phase | งาน | Deliverable |
|---|---|---|
| Days 1–7 | Inspect repo, build, tests, current deployment, auth, model/evidence/memory flow | Current System Inventory |
| Days 8–14 | Map architecture, risks, owners, ADRs | Architecture Baseline |
| Days 15–30 | Resolve authorization/evidence/context/deploy critical gaps | Verified P0/P1 fixes |
| Days 31–60 | Controlled Governed vs Direct benchmark | Reproducible Evaluation Report |
| Days 61–90 | Focused customer pilot, economics, readiness | Pilot and Product Roadmap |

## Canonical institutional files

```text
institutional-knowledge/
  PRODUCT_VISION.md
  FRAMEWORK_DEFINITION.md
  FOUNDER_COGNITIVE_MODEL.md
  ARCHITECTURE.md
  GOVERNANCE_RULEBOOK.md
  PROMPT_EVOLUTION.md
  PROMPT_REGISTRY.md
  FAILURE_REGISTER.md
  EVALUATION_PROTOCOL.md
  IP_ASSET_REGISTER.md
  OPERATIONS_RUNBOOK.md
  DECISION_LOG.md
  EVIDENCE_REGISTER.md
  ADR/
```

## Standard ADR template

```markdown
# ADR-XXX — Decision title
Status: Proposed | Accepted | Superseded
Date:
Owner:

## Problem
## Evidence and unknowns
## Alternatives considered
## Decision
## Rationale
## Tradeoffs
## Invariants
## Verification
## Reversal conditions
```

## Definition of Done

- [ ] ปัญหาและ acceptance criteria ชัด
- [ ] ตรวจ current implementation
- [ ] ตรวจ security/governance impact
- [ ] Core invariants ยังอยู่
- [ ] Unit/integration tests ผ่าน
- [ ] Regression tests ครอบคลุม
- [ ] Device/browser behavior ผ่านตาม scope
- [ ] Persistence/error behavior ไม่หลอก success
- [ ] Docs ตรง code
- [ ] Verify deployment/production หากเกี่ยวข้อง
- [ ] บันทึก residual risks และ unknowns

## Future opportunities (hypotheses)

1. Curated evidence benchmark พร้อม expert labels
2. Governance assurance และ adversarial tests
3. Domain-specific decision workflows ที่วัดผลได้
4. Context/memory reliability ที่ trace ได้
5. Adaptive PCA depth ตาม risk/cost
6. Explainable/exportable decision artifacts

---

# SECTION 13 — CONTEXT COMPRESSION

## A. One-page Executive Brief

**Mission:** AI-assisted decision intelligence ที่ตรวจสอบหลักฐานและรักษาอำนาจมนุษย์  
**Doctrine:** AI assists. Humans decide.  
**Origin:** Cognitive framework ก.พ. 2026 → hosted software product กลางปี → governance/evidence/multi-provider และ commercial infrastructure ภายใน ต.ค. 2026  
**Core:** PCA 12 stages, Direct/Governed modes, provider runtime, evidence/provenance, risk critique, human approval  
**Successful patterns:** orchestration, adapters, security tests, evidence states, selective rollback, mode separation  
**Negative knowledge:** stored memory ≠ used memory; URL ≠ evidence; claim links ≠ ACH integration; CSS ≠ native keyboard fix; merge ≠ production; confidence ≠ calibrated probability  
**Key risks:** unproven decision-quality lift, independent security assessment gaps, founder dependency, weak proprietary dataset evidence, unverified commercial traction  
**Next priority:** benchmark Governed PCA vs Direct AI, close critical governance/evidence gaps, validate customer value

## B. Ten-page Strategic Handbook — ten briefing modules

1. **Mission:** Defensible proposals rather than fluent answers.
2. **Architecture:** PCA, runtime, evidence, persistence, audit, human approval.
3. **Epistemics:** FACT/EVIDENCE/HYPOTHESIS/INFERENCE/UNKNOWN; provenance and calibrated caution.
4. **Governance:** Backend authorization; audit; retention; approval integrity.
5. **Engineering:** Inspect → Trace → Fix → Test → Verify → Record.
6. **Negative knowledge:** Memory injection, metadata retrieval, keyboard, deployment, confidence failures.
7. **Prompt system:** Versioned governed prompts; Direct baseline; runtime facts; regression tests.
8. **Product UX:** Real-device testing, balanced controls, no duplicate/hidden actions.
9. **IP/commercial:** Cost-to-recreate ≠ company valuation; chain of title and PMF remain to verify.
10. **Future:** Measurable decision improvement, reliable evidence, narrow validated customer workflow.

## C. Detailed long-form knowledge index

| Record | Type | Essential content | Verification |
|---|---|---|---|
| PRODUCT-001 | FACT/DECISION | FIREKEEPER mission and human authority | Current product docs |
| PRODUCT-002 | DECISION | Direct/Governed separation | Exact model payload tests |
| PRODUCT-003 | ASSUMPTION | Subscription viability | Revenue/retention |
| ARCH-001 | FACT | PCA 12 stages | Code/docs reconciliation |
| ARCH-002 | FACT | Unified runtime | Provider regression |
| ARCH-003 | FACT + GAP | Memory APIs/injection | End-to-end memory test |
| ARCH-004 | FACT + GAP | Evidence states/ACH | Link consumption tests |
| GOV-001 | DECISION | Human Approval Gate | Unauthorized approval tests |
| GOV-002 | FACT + RISK | SSRF/CORS/auth hardening | Security regression |
| GOV-003 | DECISION | Decision audit | Audit integrity tests |
| FAIL-001 | FACT | Stored memory not used | Retrieval telemetry |
| FAIL-002 | FACT | TITLE_ONLY retrieval | Content completeness checks |
| FAIL-003 | FACT | Mobile keyboard bug | Native/WebView tests |
| FAIL-004 | FACT | Cloud Run version conflict | Deployment orchestration |
| FAIL-005 | FACT | Confidence inconsistency | Schema/range tests |
| FOUNDER-001 | HYPOTHESIS | Root-cause before workaround | Founder review |
| FOUNDER-002 | HYPOTHESIS | Preserve known-good | Founder review |
| FOUNDER-003 | HYPOTHESIS | Honest verification | Founder review |
| EVAL-001 | PROPOSED | Governed vs Direct benchmark | Reproducible scoring |
| EVAL-002 | PROPOSED | Authorization/audit benchmark | Adversarial tests |
| EVAL-003 | PROPOSED | UX benchmark | Task completion/device matrix |
| EVAL-004 | PROPOSED | Unit economics | Usage/cost/revenue |

## D. Machine-readable YAML manifest

```yaml
schema_version: '1.0'
document_id: FK-KA-001
as_of: '2026-10-13'
project:
  name: FIREKEEPER
  architecture: PUNN Predictive Cognitive Architecture
  abbreviation: PCA
  repository: punn-pca/firekeeper-core
  website: https://firekeeper.site
  founder: Kriangkrai Kamphaen
  inception: '2026-02-01'
evidence_labels: [FACT, ASSUMPTION, HYPOTHESIS, OPINION, DECISION]
verification_states:
  - PROPOSED
  - IMPLEMENTED
  - TESTED
  - VERIFIED
  - PRODUCTION_VERIFIED
  - INDEPENDENTLY_ASSESSED
mission: >
  Evidence-grounded, inspectable, risk-aware AI-assisted decisions
  with human authority preserved.
doctrine: 'AI assists. Humans decide.'
pca:
  version: '3.0'
  orchestration_not_mandatory_llm_calls: true
  stages:
    - INTENT_DEFINITION
    - CONTEXT_UNDERSTANDING
    - PURPOSE_SCOPE
    - DATA_STRUCTURING
    - RELATIONSHIP_MODELING
    - EVIDENCE_EVALUATION
    - HYPOTHESIS_FORMATION
    - RISK_CRITIQUE_ANALYSIS
    - STRATEGIC_DECISION
    - RESPONSE_FORMATTING
    - META_REFLECTION
    - HUMAN_APPROVAL_GATE
runtime:
  historical_stack:
    frontend: [React, TypeScript, Vite]
    backend: [Express, TypeScript]
    auth: Firebase Authentication
    persistence: Firestore
    hosting: Google Cloud Run
  modes: [DIRECT_AI, GOVERNED_PCA]
  providers:
    - DeepSeek
    - OpenAI
    - Claude
    - Gemini
    - Groq
    - Mistral
    - Perplexity
    - OpenRouter
    - Ollama
    - Custom OpenAI-Compatible
confidence:
  type: heuristic
  formula: '0.40*Ec + 0.35*Er + 0.25*Eq - P'
  calibrated_probability: false
invariants:
  - no_ai_self_approval
  - evidence_provenance
  - citation_not_proof
  - no_silent_evidence_promotion
  - confidence_not_probability
  - backend_authorization
  - secret_protection
  - truthful_persistence_status
  - direct_governed_separation
  - production_verification_required
historical_failures:
  - memory_not_injected
  - title_only_retrieval
  - claim_links_not_consumed_by_ach
  - provider_language_instability
  - confidence_inconsistency
  - android_keyboard_viewport
  - concurrent_cloud_run_conflict
  - direct_prompt_contamination
founder_model:
  status: HYPOTHESIS
  method:
    - DEFINE
    - INSPECT
    - SEPARATE_FACTS_AND_ASSUMPTIONS
    - TRACE_ROOT_CAUSE
    - PRESERVE_KNOWN_GOOD
    - COMPARE_ALTERNATIVES
    - EVALUATE_RISK
    - IMPLEMENT
    - TEST
    - VERIFY
    - RECORD
open_verification:
  - current_repository_and_production_state
  - evidence_ach_integration
  - memory_context_injection
  - approval_authorization
  - audit_integrity
  - confidence_consistency
  - billing_entitlements
  - ip_chain_of_title
  - decision_quality_benchmark
  - customer_revenue_retention
next_phase: VERIFY_BEFORE_EXPANDING
```

---

# Final Institutional Doctrine

> **FIREKEEPER exists to make AI-assisted decisions more inspectable, evidence-grounded, and accountable.**
>
> PCA structures analysis but does not replace verification. Evidence must be traceable and honestly represented. Governance must be enforced by trusted systems, not merely requested from language models. Humans retain authority over consequential decisions. Engineering changes must preserve working capabilities and be verified against real behavior. Technical progress must ultimately be demonstrated through measurable improvements in decision quality, user outcomes, reliability, and commercial value.

**Succession rule:** อย่าเก็บสถาปัตยกรรมไว้เพียงเพราะมันมีอยู่ แต่จงเก็บเหตุผลที่ทำให้เลือกมัน ทดสอบว่าเหตุผลนั้นยังจริง และเปลี่ยนระบบเมื่อมีหลักฐานที่ดีกว่า โดยไม่ละเมิดหลัก governance สำคัญ

---

*End of Master Handbook — FK-KA-001. Historical reconstruction, not an independently certified code, security, legal, or valuation audit.*

---

# PART II — CONSOLIDATED SPECIALIST REPORTS

> **การรวมฉบับขยาย:** ส่วนนี้เก็บสาระเฉพาะทางจากชุดรายงานก่อนหน้า ได้แก่ Framework Definition (`FK-FWK-001`), Founder Cognitive Model (`FK-FOUNDER-001`), Prompt Evolution Map (`FK-PEM-001`), Technology/IP Due Diligence (`FK-IP-DD-001`), Institutional Continuity Handbook (`FK-ICH-001`) และ Knowledge Archaeology (`FK-KA-001`). เป็นการรวมเชิงเนื้อหาและขยายรายละเอียด ไม่ใช่การรับรองว่าคัดลอกต้นฉบับทุกคำหรือเข้าถึงทุกบทสนทนา/commit ได้ครบถ้วน.

## REPORT A — FRAMEWORK DEFINITION (FK-FWK-001)

### A1. Core Philosophy

**What:** FIREKEEPER เป็นสภาพแวดล้อมสำหรับช่วยวิเคราะห์และเตรียมข้อเสนอการตัดสินใจ โดยไม่ยกอำนาจตัดสินใจให้โมเดล. **Why:** คำตอบที่ไพเราะไม่ได้แปลว่ามีหลักฐานหรือได้รับอนุมัติ. **How:** แยกการสร้างคำตอบ การประเมินหลักฐาน การวิจารณ์ความเสี่ยง และ Human Approval. **Tradeoff:** เพิ่มขั้นตอนและ latency แลกกับการตรวจสอบย้อนหลัง. **Example:** AI แนะนำให้อนุมัติคำขอ แต่ API ต้องตรวจผู้มีสิทธิ์อนุมัติจริง.

### A2. Mental Models

| Model | What | Why | How | Tradeoff | Example |
|---|---|---|---|---|---|
| Intent-first | เริ่มจากคำถามที่แท้จริง | ป้องกันตอบผิดโจทย์ | แยก goal, constraints, audience | เพิ่มขั้นวิเคราะห์ | ผู้ใช้ถามราคา แต่จริง ๆ ต้องการประเมินความคุ้มทุน |
| Evidence-first | ใช้หลักฐานก่อนสรุป | ลดการเดา | เก็บ provenance, status, relevance | หลักฐานอาจไม่พอ | TITLE_ONLY ไม่ใช่ข้อมูลที่พิสูจน์ข้ออ้าง |
| Competing hypotheses | เปรียบเทียบคำอธิบาย | ลด confirmation bias | สร้างทางเลือกและหลักฐานสนับสนุน/ขัดแย้ง | ต้องมีข้อมูลหลายด้าน | บัคเกิดจาก UI, API หรือข้อมูล |
| Risk-first critique | ทดสอบจุดพัง | ป้องกันมั่นใจเกินจริง | failure modes, reversibility, worst case | เพิ่มต้นทุน | ปรับ policy แล้วเกิด privilege escalation |
| Human sovereignty | คนรับผิดชอบการตัดสินใจ | รักษา accountability | authenticated approval | เพิ่ม friction | การ publish/อนุมัติธุรกรรม |
| System observability | ดูการทำงานจริง | ป้องกันฟีเจอร์ลวง | telemetry, tests, traces | เก็บข้อมูลเพิ่ม | memory ถูกอ่านแต่ไม่ได้ส่งให้ LLM |

### A3. Decision Models

**Decision proposal contract:**
1. คำถามและขอบเขตการตัดสินใจ
2. ข้อเท็จจริงที่ยืนยันได้และแหล่งที่มา
3. สมมติฐานและสิ่งที่ยังไม่ทราบ
4. ทางเลือกและ competing hypotheses
5. ความเสี่ยง ข้อจำกัด และสิ่งที่ทำให้ข้อสรุปเปลี่ยน
6. ข้อเสนอแนะที่มีเงื่อนไข
7. สถานะว่าต้องอนุมัติหรือไม่

**When to use:** การตัดสินใจซับซ้อน มีผลกระทบสูง หรือต้องตรวจสอบ. **When not to use:** คำถามเล็กน้อยที่ต้นทุน governance เกินประโยชน์; ใช้ Direct AI ตามเจตนาผู้ใช้และข้อกำหนดความปลอดภัย.

### A4. Governance Principles

- ไม่ให้ LLM กำหนดสิทธิ์ของตัวเอง.
- แยก generated recommendation จาก authenticated action.
- แสดงหลักฐานตามสถานะที่แท้จริง; ไม่ยกระดับ unverified เป็น verified อัตโนมัติ.
- บันทึก decision trace ที่ตรวจสอบได้; ordinary log ไม่เท่ากับ tamper-proof audit.
- ไม่อ้าง ISO 42001 / NIST AI RMF certification หากไม่มีการประเมินรับรอง.
- รักษา data retention, access controls และ secrets ตามนโยบายและกฎหมายที่ใช้จริง.

### A5. Architecture Rules

1. PCA เป็น orchestration framework ไม่ใช่โมเดล LLM เฉพาะตัว.
2. 12 stages ไม่เท่ากับ 12 model calls.
3. Evidence Evaluation มาก่อน Hypothesis Formation ใน canonical stage sequence.
4. Provider adapters ไม่ควรเป็นแหล่ง policy authority.
5. Direct AI และ Governed PCA ต้องแยก contract.
6. ข้อมูล runtime เช่น date, model identity, retrieval provenance มาจาก backend.
7. Memory ต้องพิสูจน์ `write → retrieve → select → inject → use`.
8. สิทธิ์และ quota ต้องตรวจที่ backend.
9. Tool/MCP execution ต้องมี scope และ approval ตามระดับความเสี่ยง.
10. คำว่า Implemented, Tested, Verified, Production Verified ต้องไม่ปะปน.

### A6. Evaluation Criteria

| Criterion | What to measure | Interpretation |
|---|---|---|
| Evidence grounding | Unsupported claims per task | ยิ่งต่ำยิ่งดี |
| Source relevance | Claim/source agreement | Citation อย่างเดียวไม่พอ |
| Contradiction detection | Detection rate on labeled cases | ต้องมี gold labels |
| Appropriate abstention | ไม่ตอบเกินหลักฐาน | ไม่ควรให้รางวัลกับการเดา |
| Authorization integrity | Unauthorized actions blocked | ควรไม่มี bypass ใน test scope |
| Context fidelity | Retrieved memory actually used | ต้องตรวจ end-to-end |
| Latency/cost | P50/P95, tokens, cost per completed task | เปรียบเทียบ Direct/Governed |
| Human usefulness | Decision time, error rate, reviewer agreement | ตัวชี้วัดคุณค่าจริง |
| Reliability | Deploy success, error rate, recovery time | วัดจาก production telemetry |

**Success metrics:** ค่าเป้าหมายต้องตั้งหลังเก็บ baseline; ห้ามแต่งค่าความสำเร็จย้อนหลัง. Confidence heuristic `C = 0.40Ec + 0.35Er + 0.25Eq − P` ไม่ใช่ calibrated probability.

## REPORT B — FOUNDER COGNITIVE MODEL (FK-FOUNDER-001)

### B1. Operating Philosophy

**Reconstructed, not a psychological assessment:** ผู้สร้างให้ความสำคัญกับการเห็นระบบจริงก่อนเปลี่ยน, แก้ต้นเหตุ, ไม่ทำของเดิมพัง, ขอหลักฐานการทดสอบ, ตรงไปตรงมาเรื่องข้อจำกัด, และปรับ UX จนใช้งานจริงได้. ความเห็นเหล่านี้เป็นการอนุมานจากพฤติกรรมซ้ำ ไม่ใช่กฎถาวรหรือข้อเท็จจริงเชิงบุคลิกภาพ.

### B2. Founder decision algorithm

> If Founder were solving this problem from scratch, they would:

1. นิยามปัญหาที่แท้จริง ไม่เริ่มจากเครื่องมือ.
2. ตรวจ code, screenshots, logs, docs และ deployed state.
3. แยก FACT / ASSUMPTION / HYPOTHESIS.
4. ไล่ data flow และ control flow เพื่อหา root cause.
5. ระบุสิ่งที่ต้องไม่เสียหายและ known-good baseline.
6. เสนอทางเลือกเล็ก/กลาง/ใหญ่ พร้อมผลกระทบ.
7. ตัดทางเลือกที่ละเมิด security หรือ human authority.
8. เลือกวิธีที่ง่ายที่สุดซึ่งแก้ปัญหาได้จริง.
9. ทำการเปลี่ยนแปลงอย่างตรวจสอบย้อนกลับได้.
10. ทดสอบ unit/integration/regression และอุปกรณ์จริง.
11. ตรวจ merge/deploy/revision/production แยกกัน.
12. หากยังไม่ผ่านเกณฑ์ ให้แก้ต่อโดยไม่อ้างว่าสำเร็จ.
13. บันทึกเหตุผล สิ่งที่ลองแล้ว และความเสี่ยงคงเหลือ.

### B3. Founder priorities and tensions

| Priority | Desired behavior | Failure mode to watch |
|---|---|---|
| Security and authority | ปิดช่องโหว่ก่อนความสะดวก | Security theater |
| Functional correctness | แก้โจทย์จริง | Fix symptom only |
| Preserve baseline | ไม่ทำ regression | ปกป้อง legacy จนไม่กล้าปรับ |
| Verification | หลักฐานมากกว่าคำกล่าวอ้าง | Verification bottleneck |
| Usability | ปุ่มอ่านได้ กดได้ ทุกอุปกรณ์ | Endless UI iteration |
| Simplicity and cost | ไม่สร้าง integration ก่อนจำเป็น | Underinvestment in foundations |
| Strategic value | ต้องมีเหตุผลทางธุรกิจ | Feature count as proxy for value |

### B4. Scenario playbooks

**Mobile layout broken:** เก็บภาพหน้าจอ/viewport → reproduce → ตรวจ safe area, scroll container, keyboard inset → แก้เฉพาะส่วน → ทดสอบ 50%, 100%, tablet, mobile, APK → เทียบ baseline.

**Memory visible but unused:** ตรวจ database record → retrieval query → selection/filtering → actual provider payload → response trace → regression fixture.

**Cloud Run deployment fails:** อ่าน error จริง → ตรวจ concurrent jobs/revision → serialize → build immutable artifact → deploy → verify revision and traffic → rollback if necessary.

**Evidence seems unreliable:** ตรวจ source completeness → status → claim relationship → contradiction → verified-only rules → display limitations.

**New integration requested:** ถาม use case และสิทธิ์ → ประเมิน existing API vs MCP vs n8n → prototype minimal path → security review → ship only if useful.

**Investor asks valuation:** แยก replacement cost, historical cost, IP transaction value, enterprise value → ตรวจ revenue, ownership, security, market → รายงานช่วงพร้อม uncertainty.

### B5. Delegation protocol

ผู้รับงานต้องส่งมอบ: ปัญหา, ขอบเขต, ไฟล์/ส่วนที่เปลี่ยน, เหตุผล, test commands/results, deployment status, rollback, known limitations. ห้ามใช้คำว่า 'แก้แล้ว' หากยังไม่มีหลักฐานว่าการเปลี่ยนแปลงที่กล่าวถึงเกิดขึ้นจริง.

## REPORT C — PROMPT EVOLUTION MAP (FK-PEM-001)

> V1–V9 เป็น **retrospective conceptual versions** ไม่ใช่เลข version ของ prompt file หรือ deployment ที่ยืนยันจาก Git. ไม่ทราบ literal prompt ครบทุกช่วง.

| Version | Purpose | Weakness | Improvement | Reason | Verified outcome |
|---|---|---|---|---|---|
| V1 Initial | ตอบคำถามทั่วไป | ความมั่นใจเกินหลักฐาน | กรอบ PCA | คำตอบดีไม่เท่ากับการตัดสินใจดี | Conceptual baseline |
| V2 Structured PCA | 12-stage analysis | โครงสร้างไม่บังคับความจริง | Governed instructions | ต้องแยก epistemic states | Framework documented |
| V3 Governed | External governed prompt package | Prompt ไม่ใช่ enforcement | Evidence/authority constraints | เพิ่ม traceability | Historical implementation |
| V4 Evidence-aware | Verified status/provenance | TITLE_ONLY, unverified source | Evidence gating | Source ≠ support | Components built; gaps remain |
| V5 Context-aware | ใช้ history/memory | stored ≠ injected | telemetry and context tests | continuity | Partial historical tests |
| V6 Lean | ลด token ซ้ำ | overhead/latency | static core + dynamic context | efficiency | Savings not independently quantified |
| V7 Runtime grounded | date/provider/source facts | model invented metadata | trusted runtime injection | accuracy | Changes reported; post-fix benchmark incomplete |
| V8 Dual-mode | Direct vs Governed | mode contamination | separate payloads | valid baseline | Dual-mode regression tests passed historically |
| V9 Natural/identity | correct model name and informal share | hallucinated identity, stiff style | runtime identity + presentation transform | clarity/usability | Mixed implementation/request status |
| V10 Proposed | adaptive evidence-calibrated orchestration | high cost, weak benchmark | risk-based depth, validation, benchmarks | measurable value | **NOT IMPLEMENTED AS A CONFIRMED VERSION** |

### C1. Prompt package layers

```text
Trusted system policy
  + Runtime facts (provider, model, time, retrieval status)
  + User/workspace permissions (enforced outside model)
  + Evidence items and verification states
  + Selected conversation/memory context
  + Current user question
  + Presentation contract
  = Governed prompt package
```

### C2. Prompt asset inventory

- `PL-01` Governed decision proposal: evidence, alternatives, risk, human approval.
- `PL-02` Evidence evaluator: provenance, status, claim relevance.
- `PL-03` Risk critic: counterarguments, failure conditions, missing facts.
- `PL-04` Contextual follow-up: derive questions from actual context, not generic templates.
- `PL-05` Natural comment: no formal headings or Markdown emphasis; retain factual meaning.
- `PL-06` Runtime identity: backend provider/model name is authoritative.
- `PL-07` Prompt telemetry: token counts, selected context, truncation and cost.
- `PL-08` Direct-mode baseline: avoid governed wrappers, maintain platform safety controls.

### C3. Prompt regression checklist

Test: unsupported claim, contradictory evidence, missing evidence, source title only, date grounding, wrong model identity, mixed language, user memory relevance, long history truncation, direct-mode contamination, authorization wording, natural comment fidelity. Compare against a fixed baseline and record tokens/latency as well as quality.

## REPORT D — TECHNOLOGY & IP DUE DILIGENCE (FK-IP-DD-001)

### D1. Asset inventory and preliminary cost to recreate

**These ranges are analytical scenarios, not an independent valuation. Categories overlap and must not be summed as enterprise value.**

| Class | Rarity (1–5) | Ease of replication | Rebuild time | Category replacement estimate | Competitive advantage |
|---|---:|---|---|---:|---:|
| Code | 3 | Moderate/high for capable team | 4–10 months | ฿1.80–4.00M | 3 |
| Architecture | 3 | Moderate | 2–5 months | ฿0.30–0.90M | 3 |
| Framework | 4 as specific composition | Moderate | 3–8 months | ฿0.45–1.20M | 3 |
| Governance | 3 | Moderate/high | 3–7 months | ฿0.50–1.40M | 3 |
| Knowledge | 3 | Moderate/high | 2–6 months | ฿0.25–0.70M | 3 |
| Prompt | 2 | High for text, moderate for integration | 2 weeks–4 months | ฿0.12–0.45M | 2 |
| Workflow/Process | 2 | High | 1–3 months | ฿0.12–0.35M | 2 |
| Data/Dataset | 1–2 | High for small fixtures | 2–8 weeks | ฿0.03–0.18M | 1–2 |
| Context | 4 project-specific | Difficult to recreate exact history | 1–4 months | ฿0.15–0.50M | 3 |
| Founder expertise | Person-specific | Cannot replicate exact person | Not meaningful | Not separately transferable | Depends on team transfer |

### D2. Integrated reconstruction scenarios

| Scenario | Range | Meaning |
|---|---:|---|
| AI-assisted small team | ฿2.0–4.5M | Recreate comparable product scope efficiently |
| Conventional development | ฿5.0–10.0M | Recreate scope with conventional engineering team |
| Enterprise-grade rebuild | ฿8–15M+ | **Additional** assurance, operations and independent testing; not current verified value |

### D3. Intellectual-property caveats

Historical project information referenced BUSL-1.1, a future change date of 25 September 2030, and Apache-2.0 as change license. Verify actual `LICENSE`, `NOTICE`, contributors, dependency licenses, employment obligations and ownership/assignment documents. Public GitHub availability is not proof of unrestricted commercial use. Founder know-how is not automatically a company-owned transferable asset.

### D4. Investment risk register

| Risk | Material concern | Required evidence |
|---|---|---|
| No benchmark against Direct LLM | Differentiation unproven | Reproducible controlled evaluation |
| IP chain of title | Ownership/transfer uncertainty | Contributor and contract audit |
| Governance not independently assessed | Enterprise claims limited | Security and control assessment |
| Dataset moat absent/unverified | Replication easier | Labeled dataset inventory and rights |
| Key-person dependence | Continuity risk | Runbooks, ownership, onboarding tests |
| Deployment/CI regressions | Reliability risk | Revision trace and release metrics |
| Billing traction unverified | Valuation uncertainty | Actual revenue, churn, retention |
| Prompt/provider dependence | Quality variability | Provider test matrix |

### D5. Investor interpretation

Replacement cost is not sale price, market value, fair value or enterprise value. A functioning website and payment integration do not establish paying customer traction. Framework composition can be differentiated without being legally exclusive. Avoid premiums for enterprise readiness without external evidence.

## REPORT E — INSTITUTIONAL CONTINUITY & NEGATIVE KNOWLEDGE (FK-ICH-001)

### E1. Deep failure narratives

**E1. Android IME / WebView:** `adjustResize`, `100dvh` and padding-based fixes were insufficient for some keyboard/layout defects. Investigate Android insets, theme, Capacitor, viewport and packaged assets together. Never conclude a fix from desktop-only screenshots.

**E2. Memory Bank:** UI displayed records but model context could omit them. Storage and actual model consumption are different; trace the full path.

**E3. Evidence:** Dynamic pages produced `TITLE_ONLY` or missing publish date. Separate source discovery, content extraction, provenance and claim verification.

**E4. ACH:** Claim–evidence links existed but were not fully consumed in hypothesis comparison. A module does not add value unless downstream components use it.

**E5. Gemini language leakage:** Provider-specific behavior cannot be fully normalized by assuming prompts work identically. Add language tests.

**E6. Confidence:** Historical scores included questionable/invalid displays. Do not interpret heuristic confidence as probability; validate bounds and evidence consistency.

**E7. Deployment conflicts:** Cloud Run concurrent updates caused version conflict. Serialize deployment and verify active revision.

**E8. Responsive defects:** Double scrollbars, clipped model labels, hidden top/bottom buttons, overlapping bars and zoom-dependent behavior require a device/zoom matrix.

**E9. Follow-up questions:** Generic templates led to irrelevant suggestions. Base them on current question and unresolved context.

**E10. SPA SEO:** Distinct routes may expose generic hero/canonical metadata to crawlers. Use route-specific rendering/metadata and test crawler output.

**E11. Model identity:** Self-reported identity can be wrong. Provider/model metadata must be supplied by runtime.

**E12. Offline chat:** Historical local/offline mode existed but later user direction requested removing offline chat. Do not reintroduce without new decision.

**E13. n8n/MCP:** Technically possible does not mean immediately necessary. Scope permissions, audit and approval before adding integrations.

### E2. Successful patterns with evidence caveat

- Direct/Governed split: regression tests historically passed for covered paths.
- Security hardening: SSRF, CORS, authentication and null-safe evidence tests added historically.
- Selective mobile rollback: preserve known-good APK components rather than reverting unrelated changes.
- Evidence state model: clear VERIFIED/UNVERIFIED distinction; downstream consistency still needs review.
- Prompt telemetry: makes selected history and token overhead observable; not itself proof of better quality.
- UI refinement: repeated screenshot/device review improved layout acceptance, but requires durable visual regression coverage.

### E3. Transfer runbook

**Week 1:** inventory repo, production revision, permissions, build/tests, direct and governed traces, memory/evidence flow.

**Week 2:** verify architecture contracts, ADRs, security boundaries and rollback plan.

**Weeks 3–4:** resolve P0 authorization/evidence/data integrity and P1 context/deploy/UI reliability issues.

**Month 2:** benchmark against Direct AI with identical tasks and gold evaluation rules.

**Month 3:** validate one customer workflow, willingness to pay, retention and operating cost.

## REPORT F — EVOLUTION & STRATEGIC CONTINUITY

### F1. Causal timeline

| Phase | Prevailing assumption | Trigger | Decision/pivot | Lasting knowledge |
|---|---|---|---|---|
| Cognitive foundation | Structured cognition can improve AI reasoning | Need for framework | PUNN/PCA and 12 laws | A philosophy needs executable contracts |
| Productization | Framework should be usable by real people | Web/domain/hosting work | FIREKEEPER product | Software adds security/ops obligations |
| Evidence governance | Retrieved information can support decisions | Retrieval and confidence issues | Verified evidence, provenance, ACH | Source presence is not source support |
| Hosted continuity | Stored history provides memory | Memory Bank audits | Context telemetry/injection tests | Persisted ≠ used |
| Multi-provider | Vendor independence is useful | Provider testing | Unified runtime | Adapters need behavior tests |
| Commercialization | Product can support subscriptions | Stripe/plans work | Entitlements and quotas | Payment infrastructure ≠ revenue proof |
| Security hardening | Integrations increase reach | SSRF/auth reviews | Backend controls | Prompt cannot enforce security |
| Dual-mode separation | One runtime can serve multiple modes | Prompt contamination | Direct/Governed contracts | Fair baseline needs clean separation |
| UX convergence | One design can fit devices | Mobile/tablet defects | Responsive refinement | Actual interaction is part of correctness |
| Institutionalization | Context resides in creator/chat history | Repeated archaeology requests | Manuals, IP/Founder/Prompt maps | Reasons must be portable |

### F2. Key unknowns that must remain explicit

- Whether current production exactly matches historical tests.
- Whether PCA outperforms Direct AI on a representative labeled benchmark.
- Whether evidence statuses are enforced through every downstream stage.
- Whether audit records are tamper-evident and complete.
- Whether Memory Bank context is reliably consumed.
- Whether live billing has paying customers and what retention is.
- Whether IP ownership and contributor rights are transaction-ready.
- Whether enterprise claims have independent security/compliance support.

### F3. Non-negotiable doctrine

1. AI assists; humans decide.
2. Evidence is not the same as a citation.
3. Unknowns must remain visible.
4. Governance belongs in trusted systems.
5. Model output is not authorization.
6. Runtime facts must come from runtime.
7. Tests and deployment verification are separate.
8. Preserve working capabilities through regression checks.
9. Keep Direct and Governed semantics distinct.
10. Demonstrate customer value rather than relying on feature count.

---

# PART III — SOURCE, COMPLETENESS & FUTURE RECONCILIATION

## Included report families

| Report family | Status in this combined file |
|---|---|
| Framework Definition | Main sections + Report A |
| Founder Cognitive Model | Main sections + Report B |
| Prompt Evolution Map | Main sections + Report C |
| Technology / IP Due Diligence | Main sections + Report D |
| Institutional Continuity Handbook | Main sections + Report E |
| Knowledge Archaeology (13 sections) | Main body sections 1–13 |
| Decision History / Evolution Timeline | Main sections + Report F |
| Failed Experiments / Negative Knowledge | Main sections + Report E |
| Governance Rulebook | Main sections + Reports A/E/F |
| Context Compression (executive/handbook/YAML) | Main section 13 |

## Completeness statement

This document consolidates the substantive material available in the current conversation context and prior reconstructed reports. It does **not** assert a verbatim archive of every past assistant message, every founder conversation, all source code, every Git commit, or all private connected resources. Where the original evidence was not inspected, the reconstruction remains labeled or qualified as historical, inferred, proposed, or requiring verification.

**Maintenance rule:** Every future correction should append an evidence-linked update (date, source, observed behavior, changed assumption, decision, tests) rather than silently rewriting historical conclusions.

**End of historical consolidated archive. The revised valuation and evidence-led transfer annex follows.**


---

# PART IV — REVISED INDEPENDENT VALUATION & EVIDENCE-LED DUE DILIGENCE

> **Document:** FK-KA-002 / Valuation Annex 1.0  
> **Date:** 13 October 2026  
> **Status:** Independent analytical reconstruction; **not** a certified appraisal, audited financial report, legal opinion, or verified acquisition offer.

## IV.1 Executive conclusion

**FACT (historical record):** FIREKEEPER has an extensive documented design history, a named repository, a running-product history, a PCA framework, multiple model-provider integrations, evidence/governance features, and substantial accumulated debugging and decision context. This file preserves reconstructed knowledge from those records. The current repository, complete original chat archive, revenue, and production deployment have **not** been independently audited for this valuation.

**OPINION:** The most defensible value proposition is not the number of Markdown lines or the number of AI conversations. It is the potential **time, risk, and discovery cost saved** when another competent team can understand and continue a functioning system. Value is conditional on correctness, ownership, reproducibility, and actual transferability.

**Important:** A quoted figure is not a transaction price. A replacement-cost estimate is not equity value. A founder's ability is not automatically transferable IP. None of the ranges below should be summed.

## IV.2 Five different valuation objects — never conflate

| Object | What a buyer receives | Suitable valuation lens | Major caveat |
|---|---|---|---|
| A. Markdown archive only | Edited reconstruction and handover reference | Avoided research/documentation effort; comparable service cost | Unverified source coverage and provenance |
| B. Evidence-linked archive | Archive plus original records, traceable source references, corrections | Avoided discovery and onboarding effort | Access rights, privacy, completeness |
| C. Archive + working repository + handover | Code, tests, design rationale, onboarding and founder participation | Cost to recreate/replace and verified utility | Code quality, IP title, handover terms |
| D. Transferable technology IP | Assignable code, documentation, licensed know-how, governance implementation | Replacement cost adjusted for risk and obsolescence | Licensing, third-party dependencies, uniqueness |
| E. Operating business/equity | IP plus customers, contracts, cash flows, team and liabilities | Income/market/venture methods | Revenue and unit economics unverified |

## IV.3 Assessment of previously proposed price bands

The following bands were proposed in the discussion. They are **valuation hypotheses**, not established fair market values.

| Scenario | Previously proposed range | Current assessment | What would make it defensible |
|---|---:|---|---|
| Markdown file alone | ฿80,000–180,000 | **Unverified asking-price hypothesis** | Scope, originality, editorial quality, buyer need, comparable engagements |
| Archive + raw evidence + chat history | ฿250,000–600,000 | **Conditional service/knowledge-transfer scenario** | Rights-cleared complete archive, source mapping, searchability, reproducibility |
| Archive + repository + founder handover | ฿700,000–1,500,000 | **Conditional bundled transfer scenario** | Working code, accepted handover, tests, deploy access, defined founder support |
| Incremental deal uplift | ฿1–3 million | **Highly buyer-specific hypothesis** | Quantified reduction in integration risk/time or demonstrated strategic advantage |
| Integrated AI-assisted replacement | ฿2–4.5 million | **Historical rough reconstruction scenario** | Detailed work breakdown, actual comparable engineering rates and scope |
| Total transferable IP | ฿3–8 million | **Not yet substantiated as transaction value** | Verified title, functioning implementation, measurable performance, market demand |
| Potential strategic value | ฿10–30 million | **Upside scenario, not current valuation** | Replicated PCA advantage, credible commercial demand, defensible rights and buyer willingness |

### Why ฿320,000 is not yet a defensible 'market midpoint'

The number ฿320,000 can be used as a **negotiation anchor or planning hypothesis** for a packaged context transfer, but no verified comparable sale, buyer quote, or measured buyer savings is available here. The archive alone is not guaranteed to command that price. It may be worth much less to a buyer without the code, or more to a buyer with a high-cost continuity problem. Avoid treating the number as appraised fair value.

## IV.4 Non-additive reconstruction-cost framework

For a credible cost estimate, model the replacement work explicitly:

`Replacement cost = discovery + architecture + implementation + integration + tests + documentation + deployment + risk contingency − reusable commodity components`

Adjust for:

- Existing open-source libraries and third-party services that a new team can reuse.
- Verified code quality, test coverage, operational debt and security findings.
- Time required to reconstruct **unknown historical rationale**, not just functionality.
- Whether buyer needs an MVP, a production pilot, or independently assessed enterprise controls.
- Actual local engineering rates and whether AI-assisted work is allowed.
- Overlap: framework, prompts, architecture, and code often represent the **same work**, so avoid double counting.

**HYPOTHESIS:** The historical ฿2–4.5M AI-assisted and ฿5–10M conventional reconstruction scenarios may be reasonable *planning envelopes* for a broadly comparable scope. They are not verified quotes, nor are they additive to the context-archive price.

## IV.5 Founder leverage versus transferable assets

**Founder leverage** is the ability to repeatedly identify problems, choose abstractions, run experiments, and convert ambiguous requirements into working systems.

It is valuable, but belongs conceptually to **human capital**, not automatically to the IP asset register. A buyer receives this capability only through employment, consulting, retention, training, licensing, or successful codification into independently executable practices.

Do **not** claim a 5–10× productivity multiplier without controlled evidence comparing equivalent work, teams, scope and quality. Such a multiplier remains a hypothesis.

**Succession test:** Give an independent team the archive and repository, no live founder guidance, and measure time to build, test, deploy, and safely modify a representative feature. Compare against a baseline team without the archive. This directly tests the archive's economic utility.

## IV.6 Evidence traceability matrix — required next artifact

The current archive includes historical references but does **not** contain a complete, independently verified mapping to all original chat messages, commits, tests and deployments. The following is a schema and initial candidate register, **not a claim of verified links**.

| Knowledge ID | Historical claim / decision | Original chat/source | Commit/PR | Code path | Test | Production proof | Status |
|---|---|---|---|---|---|---|---|
| TR-001 | PCA has 12 stages | Historical context | TO VERIFY | `src/types.ts` historically cited | TO VERIFY | N/A | HISTORICAL |
| TR-002 | Direct/Governed separation | Historical review | TO VERIFY | TO VERIFY | Historical tests reported | TO VERIFY | PARTIALLY GROUNDED |
| TR-003 | Evidence before hypothesis | Historical code/docs review | TO VERIFY | TO VERIFY | TO VERIFY | TO VERIFY | HISTORICAL |
| TR-004 | SSRF guard for custom endpoints | Historical security review | TO VERIFY | TO VERIFY | Historical tests reported | TO VERIFY | PARTIALLY GROUNDED |
| TR-005 | Memory Bank not consistently injected | Historical failure report | TO VERIFY | TO VERIFY | End-to-end test needed | TO VERIFY | OPEN |
| TR-006 | Retrieval sometimes `TITLE_ONLY` | Historical retrieval review | TO VERIFY | TO VERIFY | Dynamic-page fixture needed | TO VERIFY | OPEN |
| TR-007 | Cloud Run revision conflicts | Historical deployment logs | TO VERIFY | CI/CD TO VERIFY | Deployment test needed | TO VERIFY | HISTORICAL |
| TR-008 | Billing and entitlements exist | Historical implementation reports | TO VERIFY | TO VERIFY | Payment/role tests needed | TO VERIFY | OPEN |
| TR-009 | Human approval cannot self-authorize | Design doctrine | TO VERIFY | TO VERIFY | Negative authorization tests needed | TO VERIFY | DESIGN RULE |
| TR-010 | PCA improves decision quality | No conclusive benchmark | NONE | N/A | Benchmark needed | NONE | HYPOTHESIS |

A successor team must replace every `TO VERIFY` with an immutable reference, or explicitly record `NOT FOUND` and the search scope. Never fabricate commit hashes, test results, or production timestamps.

## IV.7 Due-diligence evidence package

### Tier 1 — Source integrity

1. Export the full authorized conversation archive with timestamps and source identifiers.
2. Inventory every repository, branch, release, and license file.
3. Build a signed or hash-indexed manifest of source files and document versions.
4. Preserve the original files as read-only evidence; record later corrections separately.

### Tier 2 — Executable verification

1. Reproduce build from a clean environment.
2. Run and preserve test results for PCA, evidence, authorization, billing, memory, and providers.
3. Capture current production revision and deployed configuration, with secrets redacted.
4. Verify storage retention, deletion, audit permissions, and approval transitions.
5. Record a controlled end-to-end decision trace with input, source references, outputs and review state.

### Tier 3 — Performance and commercial evidence

1. Create a consented and rights-cleared benchmark dataset.
2. Define ground truth or expert scoring and inter-rater agreement.
3. Compare Governed PCA with Direct AI using identical questions and appropriate model/cost controls.
4. Measure unsupported claims, evidence relevance, contradiction handling, abstention, latency, token cost, and user review time.
5. Collect anonymized usage, retention, churn, invoices and revenue evidence where legally available.
6. Commission independent security, code/IP, and methodological reviews as justified by transaction size.

## IV.8 Decision-quality benchmark design

**HYPOTHESIS:** Governed PCA reduces material reasoning failures enough to justify added complexity and cost.

**Protocol:**

- Pre-register the evaluation criteria and scoring rubric.
- Use representative real decision tasks and clearly defined difficulty/risk tiers.
- Compare Direct AI, Governed PCA, and an appropriate human or expert baseline.
- Hold provider/model versions and available evidence constant where possible.
- Blind evaluators to which system produced each output.
- Report both favorable and unfavorable outcomes, including uncertainty intervals.
- Include failure cases and regressions, not just best examples.
- Preserve raw artifacts and reproducibility instructions subject to privacy rights.

**Minimum output table:** task ID; dataset version; model/provider; mode; evidence set; answer; claim support score; contradiction handling; risk quality; review time; latency; cost; evaluator; outcome.

Without this evidence, a claim that PCA is demonstrably superior remains **HYPOTHESIS**.

## IV.9 Transfer package acceptance criteria

A buyer or successor team should accept the package only after verifying:

- [ ] Original records are available under valid access and privacy rights.
- [ ] All included reports have document IDs, versions and change history.
- [ ] Core ADRs link to source evidence or explicitly state uncertainty.
- [ ] Repository ownership and contributor rights are documented.
- [ ] Current source builds in a clean environment.
- [ ] Critical security and governance tests are reproducible.
- [ ] A deployable release is demonstrated without exposing credentials.
- [ ] Known failures and unresolved P0/P1 issues are listed.
- [ ] Prompts have actual source versions where recoverable; reconstructions are labeled.
- [ ] Founder handover deliverables, duration and acceptance criteria are contractual if purchased.
- [ ] Customer and financial claims have documentary evidence.
- [ ] An independent reviewer can reproduce at least one representative governed decision trace.

## IV.10 Negotiation guidance

**Do not market the archive as a guaranteed ฿320,000 asset or claim the whole system is worth ฿30 million today.** Present those as conditional scenarios. A more credible transaction narrative is:

> FIREKEEPER includes a historically developed software system and a structured institutional archive. The archive may reduce onboarding and reconstruction effort, while the software and framework may support a differentiated decision workflow. Price should depend on verified code, ownership, reproducible results, buyer-specific utility, and agreed transfer obligations.

Suggested evidence-linked pricing structure for a potential transaction (not a price quote):

1. **Documentation-only license or assignment:** fixed price after source-completeness review.
2. **Repository and IP transfer:** separately priced after code, license, security, and operational review.
3. **Founder handover:** milestone-based consulting or retention, distinct from IP consideration.
4. **Performance-related upside:** contingent on validated benchmark, deployment acceptance, or customer milestones.

## IV.11 Open questions that materially change valuation

1. Who legally owns each contribution and the framework documentation?
2. What does the current license allow, restrict, or require?
3. How much of the system works today without founder intervention?
4. Which governance controls are deterministic and independently tested?
5. How much customer usage and recurring revenue is verifiable?
6. Does Governed PCA outperform a comparable Direct AI baseline?
7. How much would an independent team spend recreating the *working* capability?
8. Which assets are unique enough to protect or difficult enough to imitate?
9. What are the ongoing provider, infrastructure, and maintenance costs?
10. What exactly is transferred: code, documentation, rights, data, contracts, or founder time?

## IV.12 Final assessment

**FACT:** A substantial historical archive and documented system design exist.

**DECISION:** Preserve provenance, governance, human authority, and tested behavior during any transfer.

**ASSUMPTION:** The archive will save a successor team meaningful effort.

**HYPOTHESIS:** FIREKEEPER's governed workflow delivers measurable decision-quality and commercial advantages.

**OPINION:** The next valuation uplift should come from evidence-linked traceability, verified operation, reproducible comparative benchmarks, clean IP ownership, and demonstrated customer utility—not from longer documents or unsupported price assertions.

**End of revised master archive — FK-KA-002.**
