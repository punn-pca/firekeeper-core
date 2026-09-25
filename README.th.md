# FIRE KEEPER Core (ฉบับภาษาไทย)

[English Version](README.md) | **ภาษาไทย**

**FIRE KEEPER** คือชั้นการกำกับดูแล (Governance Layer) และระบบปัญญาเพื่อการตัดสินใจ (Decision Intelligence) ของ **PUNN Predictive Cognitive Architecture (PCA)** ซึ่งเป็นกรอบการทำงานของ AI สำหรับการให้เหตุผลเชิงโครงสร้าง การตรวจสอบความถูกต้องของหลักฐาน การจัดการความไม่แน่นอน และการรักษาอำนาจการควบคุมของมนุษย์

> **หลักการสำคัญ:** AI มีหน้าที่สนับสนุนการตัดสินใจ แต่มนุษย์ยังคงเป็นผู้ถือครองอำนาจในการตัดสินใจสูงสุด (AI supports the decision. Humans retain decision authority.)

---

## FIRE KEEPER คืออะไร?

FIRE KEEPER คือระบบที่นำแนวคิดการกำกับดูแลของ PUNN Predictive Cognitive Architecture มาพัฒนาใช้งานจริง มีเป้าหมายเพื่อให้การให้เหตุผลที่ขับเคลื่อนด้วย AI มี**โครงสร้างชัดเจน ตรวจสอบย้อนกลับได้ อิงหลักฐานเชิงประจักษ์ และมีความรับผิดชอบ** โดยไม่ปล่อยให้คำตอบดิบจากโมเดลภาษาขนาดใหญ่ (LLM) ถูกนำมาใช้เป็นข้อสรุปที่ปราศจากการตรวจสอบ

โปรเจกต์นี้ประกอบด้วยแอปพลิเคชัน Full-Stack สมบูรณ์แบบ: หน้าจอโต้ตอบ React สำหรับพื้นที่ปฏิบัติการ, รันไทม์ API ด้วย Express, ระบบ State Machine ด้านการกำกับดูแล, ระบบบันทึกการตรวจสอบย้อนกลับด้วยการเข้ารหัสลับ (Cryptographic Audit Logging), ระบบคำนวณและสอบเทียบความเชื่อมั่นทางคณิตศาสตร์ และชุดทดสอบความปลอดภัย (Regression Test Suites)

---

## สถาปัตยกรรมทางปัญญา PUNN (PCA)
PUNN Predictive Cognitive Architecture ทำหน้าที่เป็นกรอบการให้เหตุผลเบื้องหลัง FIRE KEEPER โดยกำหนดกระบวนการทำงานแบบ **12-Stage Orchestration Pipeline** เพื่อประสานบริบท ผู้มีส่วนได้ส่วนเสีย ตรรกะ หลักฐาน สมมติฐานคู่แข่ง ความเชื่อมั่น การวิพากษ์ความเปราะบาง ข้อเสนอแนะ แผนปฏิบัติการ การทบทวนตัวเอง และด่านการอนุมัติโดยมนุษย์ ทั้ง 12 ขั้นคือขั้น orchestration และ control gate ของแอป ไม่ใช่การเรียกให้ LLM reasoning แยกกัน 12 รอบ:

```text
คำถามหรือโจทย์การตัดสินใจเชิงกลยุทธ์
                 │
                 ▼
1.  Context Understanding (การทำความเข้าใจบริบท)
                 ↓
2.  Stakeholder Assessment (การประเมินผู้มีส่วนได้ส่วนเสีย)
                 ↓
3.  Logical Chain Analysis (การวิเคราะห์สายธารตรรกะ)
                 ↓
4.  Logical Conflict Identification (การระบุข้อขัดแย้งเชิงตรรกะ)
                 ↓
5.  External Anchoring & Standards Verification (การเทียบโยงมาตรฐานภายนอก)
                 ↓
6.  Multi-Hypothesis / ACH Analysis (การวิเคราะห์สมมติฐานคู่แข่ง)
                 ↓
7.  Evidence & Confidence Scoring (การให้คะแนนหลักฐานและความเชื่อมั่น)
                 ↓
8.  Vulnerability Critique (การวิพากษ์จุดเปราะบางและความเสี่ยง)
                 ↓
9.  Strategic Recommendation (ข้อเสนอแนะเชิงกลยุทธ์)
                 ↓
10. Concrete Action Plan (แผนปฏิบัติการที่เป็นรูปธรรม)
                 ↓
11. Meta-Reflection (การทบทวนตัวเองและข้อจำกัด)
                 ↓
12. Human Approval Gate (ด่านการตรวจสอบและอนุมัติโดยมนุษย์)
                 │
                 ▼
[Decision Governance Gate: Schema Check, Semantic Audit, Policy Check]
                 │
                 ▼
   ผลลัพธ์การตัดสินใจที่ตรวจสอบได้และโปร่งใส (Verifiable Decision Output)
```

สำหรับทฤษฎีเชิงลึกและข้อกำหนดทางเทคนิค สามารถอ่านเพิ่มเติมได้ที่ [`WHITEPAPER.md`](WHITEPAPER.md) และ [`docs/FIRE_KEEPER_SPEC.md`](docs/FIRE_KEEPER_SPEC.md)

---

## รูปแบบการกำกับดูแล (Governance Model)

FIRE KEEPER ยึดมั่นในหลักการ **การกำกับดูแลที่สอดคล้องกับหลักฐานเชิงประจักษ์ (Evidence-Aligned Governance)** ภายใต้กฎพื้นฐานที่เข้มงวด:

```text
IMPLEMENTED (ทำโค้ดแล้ว)  ≠  VERIFIED (ตรวจสอบแล้ว)  ≠  CERTIFIED (รับรองแล้ว)
```

ความสามารถของระบบที่ถูกเขียนขึ้นในโค้ด ไม่ได้หมายความว่าความสามารถนั้นผ่านการทดสอบเชิงประจักษ์หรือได้รับการรับรองจากองค์กรภายนอก ระบบจึงกำหนดสถานะอย่างโปร่งใสและแสดงให้เห็นชัดเจนบนหน้าจอ:

| สถานะ (State) | ความหมาย | การทำงานของระบบ |
| --- | --- | --- |
| `VERIFIED` / `EMPIRICAL_VERIFIED` | ผ่านการพิสูจน์ทางคณิตศาสตร์หรือมีหลักฐานเชิงประจักษ์ครบถ้วน | อนุญาตให้นำไปใช้ในการตัดสินใจความเชื่อมั่นสูง |
| `IMPLEMENTED` | โค้ดทำงานได้ แต่ยังอยู่ระหว่างรอการทดสอบเทียบเคียงเชิงประจักษ์ | แสดงผลพร้อมคำเตือนขอบเขตข้อจำกัด |
| `NOT_VERIFIED` | การประเมินแบบฮิวริสติกส์ทั่วไป ข้อมูลภายนอกยังไม่ได้รับการยืนยัน | จำกัดระดับความเชื่อมั่นสูงสุด พร้อมแสดงคำเตือน |
| `INSUFFICIENT_EVIDENCE` | ไม่มีหลักฐานที่วัดผลได้ หรือไม่มีแหล่งอ้างอิงที่น่าเชื่อถือ | ประเมินคะแนนเป็น `N/A` สกัดกั้นการแอบอ้างความมั่นใจเกินจริง |
| `THEORETICAL` | ข้อเสนอแนะเชิงแนวคิดหรือสถาปัตยกรรมทางทฤษฎีเท่านั้น | ใช้เป็นข้อมูลประกอบเท่านั้น ห้ามใช้สั่งการ |

---

## ระบบสอบเทียบความเชื่อมั่น (Calibrated Confidence Engine)

FIRE KEEPER จัดการกับความไม่แน่นอนและคุณภาพของหลักฐานในฐานะโจทย์ทางคณิตศาสตร์ชั้นหนึ่ง:

- **การไม่มีหลักฐาน ไม่ทำให้สิ่งนั้นกลายเป็นความจริง:** ข้ออ้างที่ไม่มีหลักฐานรองรับต้องคงสถานะเป็นเพียงข้ออนุมานหรือสมมติฐานเท่านั้น
- **ความน่าเชื่อไม่ได้แปลว่าเป็นความจริง:** คำตอบที่เขียนสละสลวยไม่ได้แปลว่าคำตอบนั้นถูกต้องหากไร้หลักฐานยืนยัน
- **สิ่งที่ไม่รู้ ต้องคงสถานะว่าไม่รู้:** ช่องว่างทางความรู้และข้อจำกัดต้องถูกเปิดเผยอย่างโปร่งใส โดยไม่ให้ AI ปรุงแต่งคำตอบด้วยความน่าจะเป็น

### สูตรการคำนวณคะแนนความเชื่อมั่น (Mathematical Formula)

เมื่อพบหลักฐานที่วัดผลได้ ระบบจะคำนวณคะแนนความเชื่อมั่นตามเกณฑ์ถ่วงน้ำหนักหลายมิติ (Multi-Criteria Weighted Synthesis):

ระบบคำนวณ confidence เฉพาะเมื่อมีหลักฐานที่วัดผลได้และมีฐานการสอบเทียบที่ระบุชัด; หากไม่มีต้องคืน `null` / `N/A` สัญญาณเชิง heuristic ไม่ใช่ความน่าจะเป็นทางสถิติ.

- **ต้องมีฐานข้อมูลที่วัดผลได้:** ระบบพิจารณา coverage, reliability, quality, relevance/directness และ penalties ภายในขอบเขต calibration ที่ระบุเท่านั้น
- **กฎเมื่อพบความขัดแย้ง:** หลักฐานที่ขัดแย้งหรือยังวัดผลไม่ได้อาจต้องคืน `null` / `N/A` แทนตัวเลข
- **กฎ Invariant:** หากไม่มีหลักฐานหรือยังไม่ถูกวัดผล ระบบจะคืนค่าเป็น `null` (`N/A`) ทันที ป้องกันการสร้างตัวเลขความมั่นใจแบบหลอกลวง

---

## การตรวจสอบย้อนกลับและการเข้ารหัสลับ (Cryptographic Auditability)

FIRE KEEPER มีกลไกการรักษาความปลอดภัยและตรวจสอบย้อนกลับระดับ Audit-Grade:

- **Execution Trace Hash Chaining:** ทุกขั้นตอนในการตัดสินใจจะถูกแฮชเชื่อมโยงกันเป็นห่วงโซ่แบบลำดับ (`eventHash = SHA256(prevHash + stepData)`)
- **Merkle Tree Root Calculation:** คำนวณ Merkle Root ของเหตุการณ์ทั้งหมดเพื่อสร้าง錨 (Anchor) ในการยืนยันความถูกต้องของข้อมูลทั้งชุด
- **Tamper-evident trace:** SHA-256 chaining และ Merkle-root logic ช่วยตรวจจับ trace ที่ไม่สอดคล้องกัน แต่ไม่ใช่การอ้างว่า storage เป็น WORM immutable
- **Sensitive Data Redaction:** ระบบ Audit Sanitizer อัตโนมัติคอยตัด API Keys, Token, รหัสผ่าน และข้อมูลส่วนบุคคล (PII) ออกก่อนบันทึกลงฐานข้อมูลและก่อน Export

---

---

## สถานะปัจจุบัน — 25 กันยายน 2026`n`nระบบมี claim-to-evidence checks, self-audit, conditional recommendation, consistency checks, Decision Records, action-impact structure, sequential evidence plans, hypothesis separation, recommendation change tracking และ optional metadata-only Azure Monitor export. Audit trace เป็น tamper-evident ตามขอบเขต deployment ไม่ใช่ WORM, RFC 3161 trusted timestamp หรือ external certification.`n`n## การรองรับโมเดลหลากหลายค่าย (Multi-Provider & Model Architecture)

FIRE KEEPER รองรับการเชื่อมต่อกับโมเดลปัญญาประดิษฐ์ชั้นนำระดับสากลและ Local LLM ได้อย่างยืดหยุ่น:

- **Google Gemini (Gen 3.x):** เชื่อมต่อผ่าน `@google/genai` SDK รุ่นใหม่ล่าสุด รองรับ `gemini-3.8-flash` (ตัวหลัก), `gemini-3.7-flash` (Hybrid Reasoning), `gemini-3.1-pro-preview` (การวิเคราะห์เชิงลึก), `gemini-3.1-flash-lite`, และ `gemini-flash-latest`
- **DeepSeek:** รองรับ `deepseek-chat`, `deepseek-reasoner` (R1), และระบบวิเคราะห์ภาพ `deepseek-v4-flash-vision-exp`
- **Ollama (Local LLM):** รันโมเดลแบบออฟไลน์บนเครื่อง เช่น `qwen3:4b`, `llama3.3`, `deepseek-r1` โดยไม่ต้องส่งข้อมูลออกภายนอก
- **Anthropic Claude:** รองรับ `claude-3-7-sonnet-20250219` และ `claude-3-5-haiku`
- **OpenAI:** รองรับ `gpt-4o` และ `o3-mini`
- **OpenRouter, Groq, Mistral, Perplexity & Custom Base URL:** รองรับการเชื่อมต่อ API Proxy หรือโมเดลส่วนตัวแบบอิสระ

---

## การจัดเก็บข้อมูลและความปลอดภัยของ BYOK

FIRE KEEPER แยกการทำงานเป็น 2 โหมดอย่างชัดเจน:
- **Offline Mode:** conversation, memory และ settings อยู่ในเครื่องผู้ใช้ และไม่บันทึกลง Firestore ของ Hosted Mode
- **Hosted Mode:** Backend บันทึก conversation, memory และ audit log ของผู้ใช้ที่ยืนยันตัวตนแล้ว โดยกำหนดวันหมดอายุที่ปรับค่าได้ ดูรายละเอียดใน [นโยบายการเก็บรักษาข้อมูล](docs/DATA_RETENTION.md)
- **BYOK API Key:** เก็บใน `localStorage` ของเบราว์เซอร์ ส่งเข้า backend เฉพาะตอนเรียก provider ที่เลือก และไม่เขียนลง Firestore หรือดิสก์ของเซิร์ฟเวอร์ Backend จะลบ reference จาก request และปล่อยตัวแปรคีย์หลังจบงาน แต่ string ใน JavaScript ไม่สามารถ zeroize หน่วยความจำแบบรับประกันได้
- **ผู้ใช้ควบคุมได้:** สามารถล้าง เปลี่ยน หรือ rotate คีย์จาก Chat Settings

ห้ามโฆษณา Hosted Mode ว่าเป็น “Zero-Persistence”

---

## โครงสร้างโปรเจกต์ (Project Structure)

```text
firekeeper-core/
├── docs/                        # เอกสารข้อกำหนดสถาปัตยกรรมและการกำกับดูแล
│   ├── ARCHITECTURE.md          # โครงสร้างสถาปัตยกรรมระบบและการทำงานแต่ละชั้น
│   ├── EVIDENCE_MODEL.md        # วงจรชีวิตของหลักฐานและสถานะทางญาณวิทยา
│   ├── FIRE_KEEPER_SPEC.md      # ข้อกำหนดทางวิศวกรรมและคุณสมบัติระบบ
│   ├── GOVERNANCE.md            # นโยบายการกำกับดูแลและการควบคุมโดยมนุษย์
│   ├── PUBLIC_RELEASE.md        # ขอบเขตความปลอดภัยและแนวทางการเผยแพร่สาธารณะ
│   └── screenshots/             # ภาพหน้าจอระบบและสเปกโครงสร้าง
├── public/                      # ไฟล์ Static, โลโก้ และภาพเวกเตอร์
├── scripts/                     # ชุดสคริปต์ทดสอบระบบ การสอบเทียบ และความปลอดภัย
│   ├── testGovernance.ts        # ทดสอบการบังคับใช้นโยบาย (BLOCK, REVISE, PASS)
│   ├── testConfidenceCalibration.ts # ทดสอบสูตรคณิตศาสตร์และน้ำหนักคะแนน
│   ├── testAdversarialAudit.ts  # ทดสอบการดัดแปลงแฮชและ Merkle Root ปลอม
│   └── testConversationMerge.ts # ทดสอบการซิงค์ข้อมูล LocalStorage/Firestore
├── src/
│   ├── components/              # UI Components (Workspace, Audit Viewer, ConfidenceCard)
│   ├── context/                 # State Management ระดับแอปและเซสชันการสนทนา
│   ├── lib/                     # ตัวเชื่อมต่อ Firebase Client และสิ่งแวดล้อม
│   ├── server/                  # API และระบบประมวลผลฝั่งเซิร์ฟเวอร์
│   │   ├── middleware/          # ระบบรักษาความปลอดภัย, Auth และ Rate Limiting
│   │   └── services/            # เอนจิน PCA, รันไทม์ AI, State Machine ตรวจสอบหลักฐาน
│   └── types.ts                 # โครงสร้าง Type ทางภาษา TypeScript
├── server.ts                    # จุดเริ่มต้นของ Express Backend Server
├── package.json                 # การตั้งค่า Dependencies และคำสั่ง Build Pipeline
├── vite.config.ts               # การตั้งค่า Vite พร้อม Tailwind CSS v4
├── README.md                    # คู่มือภาพรวมโครงการ (ภาษาอังกฤษ)
├── README.th.md                 # คู่มือภาพรวมโครงการ (ภาษาไทย)
├── SECURITY_AUDIT.md            # เอกสารประเมินสถาปัตยกรรมความปลอดภัย
├── WHITEPAPER.md                # เอกสาร Whitepaper เชิงทฤษฎีของ PCA
└── CHANGES.md                   # บันทึกประวัติการแก้ไขและปรับปรุงความปลอดภัย
```

---

## การติดตั้งและเริ่มใช้งานในเครื่อง (Run Locally)

### สิ่งที่จำเป็นต้องมี (Prerequisites)

- **Node.js:** v18.0.0 ขึ้นไป (แนะนำ Node.js 20+)
- **npm:** v9.0.0 ขึ้นไป
- **DeepSeek API Key:** จำเป็นต้องมีสำหรับฟังก์ชัน AI (`DEEPSEEK_API_KEY`)
- **การตั้งค่า Firebase:** ระบุในไฟล์ `firebase-applet-config.json`

### 1. ติดตั้งโปรเจกต์

```bash
git clone https://github.com/punn-pca/firekeeper-core.git
cd firekeeper-core
npm install
```

### 2. ตั้งค่าไฟล์สภาพแวดล้อม (Environment Variables)

คัดลอกไฟล์ `.env.example` เป็น `.env` และกรอกค่าที่จำเป็น:

```bash
cp .env.example .env
```

ตัวแปรสำคัญในระบบ:

| ตัวแปร | คำอธิบาย |
| --- | --- |
| `DEEPSEEK_API_KEY` | คีย์ API ของ DeepSeek สำหรับเรียกใช้โมเดล `deepseek-chat` และ `deepseek-reasoner` |
| `APP_URL` | URL ฐานของแอปพลิเคชัน (ใช้สำหรับ Callback และ CORS) |
| `FIREKEEPER_ADMIN_PASSWORD` | รหัสผ่านสำหรับเข้าสู่ระบบผู้ดูแลระบบ (เพื่อดู Telemetry) |
| `ADMIN_UID` | Firebase UID ของผู้ดูแลระบบที่ได้รับสิทธิ์พิเศษ |
| `SERVICE_SECRET` | คีย์ลับสำหรับ Worker หรือฟังก์ชันเบื้องหลัง |

### 3. รัน Development Server

รันทั้ง Frontend Vite และ Backend Express พร้อมกันในโหมดพัฒนา:

```bash
npm run dev
```

เปิดใช้งานผ่านเบราว์เซอร์ที่ `http://localhost:5173` (หรือตามพอร์ตที่แสดงใน Terminal)

### 4. การรันชุดทดสอบ (Test Suite)

FIRE KEEPER รันคำสั่ง regression ที่ดูแลต่อเนื่อง ครอบคลุม governance, การเชื่อม Claim กับ Evidence, ขอบเขตของ probability, ความสมบูรณ์ของ cryptographic audit, ความปลอดภัยเครือข่าย, session และ decision-quality extensions. ณ วันที่อัปเดตนี้ `npm test` เรียกใช้ test script ที่รันได้ 23 ชุด โดยให้ `package.json` เป็นรายการอ้างอิงที่เป็นปัจจุบัน:

```bash
npm test
```

หรือเลือกรันการตรวจสอบบางส่วนได้ (ตัวอย่าง):

```bash
# ทดสอบการบังคับใช้นโยบายการกำกับดูแล (BLOCK, REVISE, PASS)
npx tsx scripts/testGovernance.ts

# ทดสอบสูตรคำนวณคณิตศาสตร์และการสอบเทียบความเชื่อมั่น
npx tsx scripts/testConfidenceCalibration.ts

# ทดสอบความทนทานต่อการโจมตีและการปลอมแปลงข้อมูลรหัสลับ (Adversarial Audit)
npx tsx scripts/testAdversarialAudit.ts

# ทดสอบการผสานข้อมูลข้ามเซสชัน Local/Firestore และป้องกัน Race Condition
npx tsx scripts/testConversationMerge.ts
```

### 5. ตรวจสอบ Type และ Lint

```bash
npm run lint
```

### 6. การ Build สำหรับ Production

สร้าง Bundle สำหรับการใช้งานจริงผ่าน Vite และ esbuild:

```bash
npm run build
npm run start
```

---

## การสอดคล้องกับมาตรฐานสากล (Standards Alignment)

FIRE KEEPER ได้รับการออกแบบตามแนวทางของกรอบมาตรฐานความปลอดภัยและการกำกับดูแล AI ระดับสากล:

- **ISO/IEC 42001:2023:** Artificial Intelligence Management System (ระบบการจัดการปัญญาประดิษฐ์)
- **NIST AI Risk Management Framework (AI RMF 1.0):** ฟังก์ชัน Governance, Map, Measure, Manage
- **NIST Cybersecurity Framework (CSF 2.0)**
- **RFC 7636:** Proof Key for Code Exchange (PKCE)
- **Trusted timestamping:** ยังไม่อ้างว่า RFC 3161 integration ถูก implement แล้ว

> *หมายเหตุ: การอ้างอิงมาตรฐานข้างต้นเป็นการอธิบายแนวทางการออกแบบและสถาปัตยกรรมทางวิศวกรรม มิได้เป็นการอ้างว่าได้รับการรับรองจากองค์กรภายนอก (Third-Party Certification)*

---

## ดัชนีเอกสารทั้งหมด (Documentation Index)

- [`README.md`](README.md) — คู่มือและภาพรวมโครงการฉบับภาษาอังกฤษ (English)
- [`docs/`](docs/) — เอกสาร Cognitive Architecture และ Epistemic Transparency
- [`docs/developers/`](docs/developers/) — Developer Portal, Decision Object และ JSON Schema
- [`WHITEPAPER.md`](WHITEPAPER.md) — เอกสารทฤษฎีฉบับขยาย
- [`docs/FIRE_KEEPER_SPEC.md`](docs/FIRE_KEEPER_SPEC.md) — ข้อกำหนดเชิงเทคนิคและคุณลักษณะของระบบฉบับสมบูรณ์
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — สถาปัตยกรรมระบบ การแบ่งเลเยอร์ และวงจรการประมวลผล
- [`docs/EVIDENCE_MODEL.md`](docs/EVIDENCE_MODEL.md) — โมเดลการจำแนกหลักฐานและวงจรชีวิตความรู้
- [`docs/GOVERNANCE.md`](docs/GOVERNANCE.md) — นโยบายการกำกับดูแลและการควบคุมโดยมนุษย์
- [`docs/PUBLIC_RELEASE.md`](docs/PUBLIC_RELEASE.md) — ขอบเขตการเปิดเผยสาธารณะและการรักษาความปลอดภัย
- [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md) — การประเมินความปลอดภัย การควบคุมสิทธิ์ และการตรวจสอบภายใน
- [`CHANGES.md`](CHANGES.md) — บันทึกประวัติการปรับปรุง แก้ไข และการตรวจสอบระบบ
