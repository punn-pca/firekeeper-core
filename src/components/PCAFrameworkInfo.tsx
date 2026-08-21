import React, { useState } from 'react';
import { BookOpen, ShieldCheck, Flame, Brain, Compass, Layers, CheckCircle, ChevronDown, ChevronRight, Cpu, Wrench, Sparkles, FileText, Copy, Check } from 'lucide-react';
import { GCPFreeTierServicesManager } from './GCPFreeTierServicesManager';
import { FireKeeperHistorySection } from './FireKeeperHistorySection';

export const PCAFrameworkInfo: React.FC = () => {
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [activeView, setActiveView] = useState<'architecture' | 'history' | 'whitepaper'>(() => {
    try {
      if (typeof window !== 'undefined' && window.location.pathname === '/whitepaper') {
        return 'whitepaper';
      }
    } catch (e) {}
    return 'architecture';
  });
  const [copied, setCopied] = useState(false);

  const handleCopyWhitepaper = () => {
    const markdownContent = `# FIREKEEPER & PUNN COGNITIVE ARCHITECTURE (PCA)
## Enterprise Whitepaper v2.0: Unified Theory, Architecture Specification & Governance Guardrails
*Last Updated: August 20, 2026*

---

### EXECUTIVE SUMMARY (บทสรุปผู้บริหาร)
FIREKEEPER และ PUNN Cognitive Architecture (PCA v2.0) เป็นระบบปัญญาประดิษฐ์เชิงยุทธศาสตร์ระดับวิสาหกิจ (Enterprise Strategic AI System) ที่สร้างขึ้นเพื่อตอบโจทย์องค์กรที่มีความต้องการด้านเสถียรภาพ การรักษาอำนาจการตัดสินใจของมนุษย์ (Human-in-the-Loop) และการรับประกันความน่าเชื่อถือและความโปร่งใสสูงสุดผ่านการบันทึกตรวจสอบย้อนหลังในรูปแบบลายเซ็นเข้ารหัสคริปโทกราฟิก (Cryptographic Audit Trail)

---

### SECTION 1: ORIGIN & PHILOSOPHY (จุดกำเนิดและปรัชญา)
- ชื่อและตัวตนของปุญญ์ (The Name "PUNN"): เริ่มจากการวิเคราะห์ตัวตนและความหมายของคำว่า "ปุญญ์" (Punn) ซึ่งนำไปสู่การตั้งคำถามเชิงลึกเกี่ยวกับมนุษย์และการรักษาสิ่งสำคัญที่สุดในสภาวะโลกที่มีความไม่แน่นอนและความแปรผันสูง
- สัญลักษณ์ "ผู้รักษาไฟ" (Firekeeper Symbolism): "ไฟ (The Fire)" คือตัวแทนแห่งการเลือกและเจตจำนงอิสระ (Human Agency) ของมนุษย์ ส่วน "ผู้รักษา (The Keeper)" คือการสนับสนุนเพื่อไม่ให้ไฟนั้นดับสูญ โดยไม่มีการพรากสิทธิ์หรือเข้าแทนที่การตัดสินใจของมนุษย์ (Non-encroachment of Human Autonomy)

---

### SECTION 2: PUNN COGNITIVE ARCHITECTURE (PCA 12-STAGE)
1. STAGE 1: Understanding (ความเข้าใจบริบท)
2. STAGE 2: Stakeholder (ผู้มีส่วนได้ส่วนเสีย)
3. STAGE 3: Logical Analyse (การวิเคราะห์เชิงตรรกะ)
4. STAGE 4: Logical Conflicts (การขัดแย้งเชิงตรรกะ)
5. STAGE 5: External Anchor (การอ้างอิงแหล่งที่มา)
6. STAGE 6: Multi-Hypothesis (สมมติฐานที่หลากหลาย)
7. STAGE 7: Calibrated Value (ค่าน้ำหนักประเมิน) — ใช้ Bayesian ในการประเมิน Confidence Score และ Risk Score
8. STAGE 8: Critique & Vulnerability (การวิพากษ์จุดอ่อน) — ค้นหาจุดอ่อนเพื่อระบุ "สิ่งที่เรายังไม่รู้" (Unk-Unks)
9. STAGE 9: Strategy Recommendation (ข้อเสนอเชิงยุทธศาสตร์)
10. STAGE 10: Concrete Action Plans (แผนงานที่เป็นรูปธรรม)
11. STAGE 11: Reflection (การสะท้อนย้อนคิด)
12. STAGE 12: Human-in-the-Loop Gate (จุดอนุมัติของมนุษย์) — อำนาจควบคุมสุดท้ายเป็นของมนุษย์แบบ 100%

---

### SECTION 3: FIREKEEPER UNIFIED THEORY (FUT)
- Information Physics & Entropy: การลดทอนความปั่นป่วน (Entropy Reduction) เพื่อสร้างระบบที่มีระเบียบและเสถียรภาพสูงสุด
- Information Integration Theory (IIT): ประเมินระดับของการบูรณาการข้อมูลเพื่อความเข้าใจที่ลึกซึ้ง
- Empathy and Human Agency Preservation: ปัญญาประดิษฐ์ยิ่งมีความสามารถสูง ยิ่งต้องเคารพสิทธิ์ของมนุษย์มากขึ้นเท่านั้น

---

### SECTION 4: TECHNICAL ARCHITECTURE & SECURITY
- Google Cloud Run Deployment: รันเป็น Containerized Microservice บน Google Cloud Run ภูมิภาค asia-southeast1 พอร์ต 3000
- Active GCP Project: เชื่อมต่อผ่าน Google Cloud Production Project
- Gemini SDK: @google/genai SDK ประมวลผลฝั่ง Server-side ป้องกันข้อมูลรั่วไหล
- Cryptographic Audit: สร้างไฟล์ zip ยืนยันข้อมูลในรูปแบบ manifest.json, audit.sig (SHA-256), และ timestamp.tsr (RFC3161)

---

### SECTION 5: ETHICS, COMPLIANCE & STANDARDS
- ISO/IEC 42001:2023: AI Management System (AIMS) ประเมินความเสี่ยงและตรวจสอบย้อนหลังได้ทุกขั้นตอน
- NIST AI RMF 1.0: กรอบระบบการกำกับดูแลความเสี่ยงและความปลอดภัยอย่างมีประสิทธิภาพ

---

### SECTION 6: LOOP DETECTION & ROBUST RECOVERY
- Idempotency Hash Keys: ลงทะเบียนป้องกันโพสต์ซ้ำซ้อน
- Logical Defer & Handle Guard: ทำเครื่องหมาย .replied = true ทันทีสำหรับข้อสังเกตเพื่อขจัดปัญหา Infinite Trigger Loop
- Thread & Depth Cooldown: ควบคุมความลึกในการตอบสนองและรักษาระบบเสถียรภาพสูง

---
จัดทำโดยทีมสถาปัตยกรรมระบบปัญญาประดิษฐ์ Firekeeper (PUNN Cognitive Architecture Core Team)`;
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-200 leading-relaxed text-sm">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              PUNN Cognitive Architecture (PCA) Specification
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Enterprise Whitepaper v2.0
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              กรอบการออกแบบปัญญาประดิษฐ์เชิงยุทธศาสตร์เพื่อการลงเหตุผล การประเมินความเสี่ยง และการคุ้มครอง Human Agency
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => setActiveView('architecture')}
            type="button"
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeView === 'architecture'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            สถาปัตยกรรม (Architecture)
          </button>
          <button
            onClick={() => setActiveView('history')}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeView === 'history'
                ? 'bg-[#FF8A00] text-slate-950 font-bold shadow'
                : 'text-amber-400 hover:text-amber-300 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ประวัติศาสตร์ & ปรัชญา</span>
          </button>
          <button
            onClick={() => setActiveView('whitepaper')}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeView === 'whitepaper'
                ? 'bg-amber-600 text-slate-950 font-bold shadow'
                : 'text-amber-500 hover:text-amber-400 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>White Paper (ล่าสุด)</span>
          </button>
        </div>
      </div>

      {/* Conditionally Render History or Architecture */}
      {activeView === 'history' ? (
        <FireKeeperHistorySection />
      ) : activeView === 'whitepaper' ? (
        <div className="space-y-6">
          {/* Main Whitepaper Container */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0e1626] via-[#121c2e] to-[#0a0f1d] border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>PCA ENTERPRISE WHITEPAPER v2.0</span>
                </div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">
                  เอกสารวิชาการและแนวคิดสถาปัตยกรรม (White Paper)
                </h3>
                <p className="text-xs text-slate-400">
                  โครงสร้างทางวิศวกรรมปัญญา ทฤษฎีเอกภาพ และกลไกการคุ้มครอง Human Agency ฉบับสมบูรณ์
                </p>
              </div>

              <button
                onClick={handleCopyWhitepaper}
                type="button"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-slate-950 font-bold transition-all text-xs cursor-pointer shadow-md self-start md:self-auto"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>คัดลอกสำเร็จ! (Copied)</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>คัดลอก Markdown ต้นฉบับ</span>
                  </>
                )}
              </button>
            </div>

            {/* Content Chapters */}
            <div className="mt-6 space-y-6 text-sm text-slate-300">
              {/* Sec 1 */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">SEC 1</span>
                  <span>บทสรุปผู้บริหาร (Executive Summary)</span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-slate-300 font-sans">
                  <strong>FIREKEEPER</strong> และสถาปัตยกรรม <strong>PUNN Cognitive Architecture (PCA v2.0)</strong> เป็นระบบสนับสนุนการตัดสินใจเชิงกลยุทธ์ระดับองค์กร (Enterprise Strategic AI System) ที่มุ่งมั่นการทำงานแบบเปิดกล่อง (White-box Structured Thinking) เพื่อสร้างความโปร่งใสและคุ้มครองเสรีภาพในการเลือกของมนุษย์ (Human Agency Preserved) ข้อมูลการประมวลผลและการอนุมัติทั้งหมดจะถูกลงนามทางเทคโนโลยีผ่านระบบรอยแผลเป็นทางคริปโทกราฟิก (Cryptographic Audit Trail) เพื่อเป็นหลักฐานที่ไม่สามารถดัดแปลงได้ (WORM Ledger Principle) ปลอดภัยและเชื่อถือได้
                </p>
              </div>

              {/* Sec 2 */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">SEC 2</span>
                  <span>สถาปัตยกรรมโครงสร้าง 12 ขั้นตอน (PUNN Cognitive Architecture)</span>
                </div>
                <p className="text-[12px] text-slate-400 leading-relaxed font-sans">
                  ระบบไม่ได้ประมวลผลข้อมูลในลักษณะ Direct Chat (กล่องดำ) แต่นำเข้าสู่โครงสร้างทางปัญญา 12 ขั้นตอนย่อย เพื่อสอบทานเชิงลึกก่อนได้มาซึ่งข้อเสนอแนะ:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1">
                    <div className="font-bold text-amber-300">1. Context Understanding</div>
                    <p className="text-[11px] text-slate-400">เข้าใจความประสงค์ที่แท้จริงของผู้ใช้และความสอดคล้องเชิงนโยบาย</p>
                  </div>
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1">
                    <div className="font-bold text-amber-300">2. Stakeholder Assessment</div>
                    <p className="text-[11px] text-slate-400">ประเมินผลกระทบทางตรงและทางอ้อมต่อบุคคลและสังคมแวดล้อม</p>
                  </div>
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1">
                    <div className="font-bold text-amber-300">3. Logical Chain Analysis</div>
                    <p className="text-[11px] text-slate-400">สร้างความสัมพันธ์แบบเหตุและผล (Causal-effects chain)</p>
                  </div>
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1">
                    <div className="font-bold text-rose-300">4. Logical Conflicts</div>
                    <p className="text-[11px] text-slate-400">ระบุจุดขัดแย้งของกฎเกณฑ์หรือทางเลือกเชิงตรรกะในระบบ</p>
                  </div>
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1">
                    <div className="font-bold text-amber-300">5. External Anchoring</div>
                    <p className="text-[11px] text-slate-400">อ้างอิงและสอบทานข้อมูลร่วมกับกฎหมายและมาตรฐานอุตสาหกรรม</p>
                  </div>
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1">
                    <div className="font-bold text-amber-300">6. Multi-Hypothesis Option</div>
                    <p className="text-[11px] text-slate-400">จำลองทางเลือกที่หลากหลายเพื่อประเมินจุดเด่นและจุดด้อย</p>
                  </div>
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1">
                    <div className="font-bold text-sky-300">7. Calibrated Scoring</div>
                    <p className="text-[11px] text-slate-400">ใช้ทฤษฎีความน่าจะเป็นแบบ Bayesian ในการคำนวณสัดส่วนความเสี่ยง</p>
                  </div>
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1">
                    <div className="font-bold text-amber-300">8. Vulnerability Critique</div>
                    <p className="text-[11px] text-slate-400">วิพากษ์และประเมินรอยรั่วที่อาจเกิดขึ้นจากข้อมูลที่ยังไม่ครอบคลุม</p>
                  </div>
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1">
                    <div className="font-bold text-emerald-300">9. Strategic Recs</div>
                    <p className="text-[11px] text-slate-400">ข้อเสนอเชิงยุทธศาสตร์ที่ชัดเจนเป็นประโยชน์สูงสุด</p>
                  </div>
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1">
                    <div className="font-bold text-amber-300">10. Concrete Action Plans</div>
                    <p className="text-[11px] text-slate-400">แจกแจงแผนปฏิบัติการระงับความเสี่ยงและการทำงานอย่างรอบด้าน</p>
                  </div>
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1">
                    <div className="font-bold text-amber-300">11. Meta-Cognitive Reflection</div>
                    <p className="text-[11px] text-slate-400">การประเมินตนเองของระบบปัญญาเพื่อป้องกันการเกิด Hallucination</p>
                  </div>
                  <div className="p-3 bg-slate-950/80 border border-emerald-500/40 rounded-lg space-y-1 bg-emerald-950/20">
                    <div className="font-bold text-emerald-300 flex items-center gap-1">
                      <span>12. Human-in-the-Loop</span>
                    </div>
                    <p className="text-[11px] text-slate-400">ส่งต่อข้อมูลวิเคราะห์เข้าสู่จุดตรวจสอบและตัดสินใจโดยมนุษย์ 100%</p>
                  </div>
                </div>
              </div>

              {/* Sec 3 */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">SEC 3</span>
                  <span>ทฤษฎีเอกภาพ (Firekeeper Unified Theory - FUT)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans mt-1">
                  <div className="space-y-1.5">
                    <div className="font-bold text-white text-[12px]">● Information Physics & Entropy Reduction</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      การประเมินและการกรองตรรกะในระบบเป็นการขจัดความปั่นป่วนทางความคิด (Cognitive Noise) โดยมุ่งลดค่า Entropy ของทางเลือกเพื่อให้ระบบมีความเป็นระเบียบทางยุทธศาสตร์สูงสุด
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="font-bold text-white text-[12px]">● Empathy-driven Human Augmentation</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      ปรัชญาหลักที่ยึดมั่นว่าเทคโนโลยีที่ฉลาดขึ้นจะต้องทำงานเพื่อเพิ่มประสิทธิภาพของมนุษย์ เคารพและพิทักษ์เสรีภาพในการเลือกตัดสินใจ (Agency Preservation) เสมอ
                    </p>
                  </div>
                </div>
              </div>

              {/* Sec 4 */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">SEC 4</span>
                  <span>สถาปัตยกรรมระบบคลาวด์และความปลอดภัย (GCP & Cryptography)</span>
                </div>
                <div className="space-y-2 text-xs font-sans leading-relaxed text-slate-300">
                  <p>
                    ระบบทำงานบนแพลตฟอร์มเซิร์ฟเวอร์แบบ Full-stack (Node.js/Express และ React/Vite) เชื่อมโยงระบบกับคลาวด์แบบปลอดภัย:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] pl-2 font-mono">
                    <li><strong className="text-white">Active Container Service:</strong> Google Cloud Run ภูมิภาค asia-southeast1 ภายใต้พอร์ต 3000 คอยกำกับดูแล</li>
                    <li><strong className="text-white">Enterprise Production:</strong> รันบน Google Cloud Run สำรองความจุ</li>
                    <li><strong className="text-white">Zero-Breach Server Logic:</strong> Gemini API SDK ทำงานแบบ Server-side API Proxy ปิดบัง API Keys ในระดับปลอดภัยสูงสุด</li>
                    <li><strong className="text-white">Cryptographic Verification:</strong> ทุกสัญญานโยบายและการประเมินความเสี่ยงสร้างเป็นไฟล์ manifest.json ควบคู่กับ SHA-256 ลายเซ็นดิจิทัลใน audit.sig และประทับเวลา RFC3161 ใน timestamp.tsr ป้องกันการปลอมแปลงและตรวจสอบย้อนกลับได้แบบสมบูรณ์</li>
                  </ul>
                </div>
              </div>

              {/* Sec 5 */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">SEC 5</span>
                  <span>มาตรฐานธรรมาภิบาลและความปลอดภัยสากล (Global AI Governance Compliance)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                    <div className="font-bold text-sky-400">ISO/IEC 42001:2023 Compliance</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">เทียบเคียงกรอบระบบการจัดการปัญญาประดิษฐ์เพื่อรับรองระบบการจัดการความเสี่ยงที่ดี (AIMS Alignment) มีการตรวจสอบสิทธิ์และเก็บ Audit Trail ย้อนหลังได้อย่างแม่นยำ</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                    <div className="font-bold text-indigo-400">NIST AI RMF 1.0 Framework</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">ประยุกต์ใช้องค์ประกอบควบคุมความเสี่ยง 4 แกนสำคัญ (GOVERN, MAP, MEASURE, MANAGE) ส่งต่อความปลอดภัยและความรับผิดชอบต่อผู้มีส่วนได้ส่วนเสียในระบบ</p>
                  </div>
                </div>
              </div>

              {/* Sec 6 */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">SEC 6</span>
                  <span>ระบบควบคุมการประมวลผลซ้ำซ้อนและการวนลูป (Loop & Repeat Protections)</span>
                </div>
                <p className="text-[12px] leading-relaxed text-slate-300 font-sans">
                  ระบบวิเคราะห์ตรรกะใน **Autonomous Loop Mode** ใช้กลไกสำคัญเพื่อระงับการทำงานซ้ำ:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11.5px] pl-2 font-sans">
                  <li><strong className="text-slate-300">Idempotency Checks:</strong> การประมวลผลมีระบบเทียบความเหมือนของ Content หากตรวจพบสแปมหรือข้อความเดิมจะถูกยับยั้งลูปการตัดสินใจทันที</li>
                  <li><strong className="text-slate-300">Safe Defer State:</strong> ทันทีที่ระบบมีข้อสงสัยหรือมีความมั่นใจต่ำ (Confidence low) ระบบจะเข้าสู่โหมด `DEFER` และกำหนดสิทธิ์ประมวลผลเป็น handled (`replied = true`) ทันทีขจัดบัควินาทีการปลุกสเตทซ้ำซ้อน (Zero Loop Thrashing)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Core Architectural Pillars */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-1">
              <div className="flex items-center gap-2 font-bold text-indigo-400 font-mono text-xs">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Design Intent & Governance Principles (เจตนารมณ์การออกแบบ)</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                อ้างอิงกรอบแนวคิด Human-in-the-Loop, Transparent Confidence และการวิเคราะห์เชิงโครงสร้าง เพื่อสนับสนุนการตัดสินใจเชิงยุทธศาสตร์ภายใต้ความรับผิดชอบของมนุษย์
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-400 font-mono text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Forensically Verified Capabilities (สิ่งที่พิสูจน์ได้จาก Audit Package)</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                ความสมบูรณ์ของเอกสารและหลักฐานการประมวลผลที่ตรวจสอบได้ทางคริปโตกราฟี (Cryptographic Integrity, WORM Chain, TSR Timestamp และ SHA-256 Hashes)
              </p>
            </div>
          </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-sm">1. Human Agency Preserved</h3>
          <p className="text-xs text-slate-400">
            ระบบทำหน้าที่สนับสนุนการตัดสินใจเชิงยุทธศาสตร์ ประเมินทางเลือกและ Trade-offs โดยคงอำนาจการตัดสินใจขั้นสุดท้ายไว้ที่มนุษย์เสมอ (Human-in-the-Loop)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-sm">2. Structured Analysis & Evaluation</h3>
          <p className="text-xs text-slate-400">
            การจำแนกองค์ประกอบข้อมูลออกเป็นมิติเชิงตรรกะ เพื่อแยกแยะข้อเท็จจริงเชิงประจักษ์ สมมติฐานทางเลือก ความเสี่ยง และหลักฐานสนับสนุนอย่างโปร่งใส
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="w-8 h-8 rounded-xl bg-sky-950/80 border border-sky-500/40 text-sky-400 flex items-center justify-center">
            <Brain className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-sm">3. Transparent Confidence</h3>
          <p className="text-xs text-slate-400">
            การประเมินระดับความมั่นใจอย่างตรงไปตรงมา พร้อมระบุสัญญาณข้อมูลที่ยังขาดหายไป เพื่อป้องกันความมั่นใจเกินจริงและลดความเสี่ยงในการดำเนินงาน
          </p>
        </div>
      </div>

      {/* 📖 PCA Architectural Glossary & Core Governance Standards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">PCA Enterprise Conceptual Glossary (อภิธานศัพท์เชิงแนวคิด)</h3>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Governance Standard
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          คำศัพท์มาตรฐานในระดับ Conceptual Capability เพื่อสร้างความเข้าใจตรงกันระหว่างผู้บริหาร นักวิเคราะห์ และผู้ตรวจสอบ:
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3 w-1/4">Concept / Term</th>
                <th className="p-3 w-1/4">Domain Focus</th>
                <th className="p-3 w-1/2">Observable Capability & Definition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 text-slate-300">
              <tr>
                <td className="p-3 font-mono font-bold text-amber-400">12-Stage Reasoning Pipeline</td>
                <td className="p-3 font-mono text-[11px] text-indigo-400">Architecture</td>
                <td className="p-3">วงจรการประมวลผล 12 ขั้นตอนของ PUNN PCA เพื่อตรวจสอบข้อเท็จจริง คัดกรองสมมติฐาน ชั่งน้ำหนักหลักฐาน และประเมินความเสี่ยงภายในระบบก่อนสังเคราะห์ข้อเสนอแนะ</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-amber-400">Structured Reasoning</td>
                <td className="p-3 font-mono text-[11px] text-indigo-400">Analysis</td>
                <td className="p-3">กระบวนการวิเคราะห์เชิงโครงสร้างที่จำแนกข้อเท็จจริง สมมติฐาน และประเมินความเสี่ยงอย่างเป็นระบบ</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-emerald-400">HITL (Human Agency)</td>
                <td className="p-3 font-mono text-[11px] text-indigo-400">Governance</td>
                <td className="p-3">การออกแบบให้มนุษย์เป็นผู้กำกับและตัดสินใจขั้นสุดท้าย เพื่อป้องกันการตัดสินใจอัตโนมัติในจุดเสี่ยง</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-sky-400">Deterministic Guardrails</td>
                <td className="p-3 font-mono text-[11px] text-indigo-400">Safety</td>
                <td className="p-3">มาตรการควบคุมความปลอดภัยและนโยบายองค์กรที่ไม่ยินยอมให้ข้ามผ่าน (เช่น Compliance & PDPA alignment)</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-purple-400">Verifiable Audit Trail</td>
                <td className="p-3 font-mono text-[11px] text-indigo-400">Compliance</td>
                <td className="p-3">การบันทึกร่องรอยการวิเคราะห์และเหตุผลประกอบการตัดสินใจเพื่อให้สามารถตรวจสอบย้อนหลังได้</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-rose-400">Transparent Confidence</td>
                <td className="p-3 font-mono text-[11px] text-indigo-400">Reliability</td>
                <td className="p-3">การรายงานระดับความมั่นใจพร้อมระบุเงื่อนไขและข้อมูลที่ยังขาดหายไปอย่างไร้ความอคติ</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-cyan-400">Context Adaptability</td>
                <td className="p-3 font-mono text-[11px] text-amber-400">Localization</td>
                <td className="p-3">ความสามารถในการปรับตัวตามบริบทกฎหมายและสภาพแวดล้อมเฉพาะทาง (เช่น บริบทประเทศไทย)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* High-Level Operational Capabilities */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          High-Level Operational Capabilities (ความสามารถเชิงปฏิบัติการ)
        </h3>
        <p className="text-xs text-slate-400">
          ลักษณะการทำงานภายนอกที่ผู้ใช้และองค์กรสามารถสังเกตเห็นได้ (Observable Behavior):
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="font-bold text-amber-400 font-mono">1. Intent & Context Comprehension</span>
            <p className="text-slate-300">วิเคราะห์เจตนาและความต้องการเชิงลึกของผู้ใช้ พร้อมปรับบริบทให้สอดคล้องกับมาตรฐานองค์กร</p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="font-bold text-amber-400 font-mono">2. Multi-Hypothesis Evaluation</span>
            <p className="text-slate-300">ประเมินทางเลือกและสมมติฐานที่หลากหลาย พร้อมเปรียบเทียบข้อดี ข้อเสีย และ Trade-offs</p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="font-bold text-amber-400 font-mono">3. Risk & Vulnerability Critique</span>
            <p className="text-slate-300">ตรวจสอบจุดอ่อน ความเสี่ยง และสัญญาณข้อมูลที่ยังขาดหายไปเพื่อป้องกันข้อผิดพลาด</p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="font-bold text-amber-400 font-mono">4. Verifiable Decision Support</span>
            <p className="text-slate-300">นำเสนอคำแนะนำเชิงยุทธศาสตร์ที่ตรวจสอบย้อนหลังได้ พร้อมรักษา Human Agency เต็มรูปแบบ</p>
          </div>
        </div>
      </div>

      {/* ── Collapsible PCA Strategic Enterprise Roadmap & Product Hypothesis ── */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl transition-all">
        <button
          type="button"
          onClick={() => setIsRoadmapOpen(!isRoadmapOpen)}
          className="w-full p-5 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 flex items-center justify-between text-left hover:bg-slate-800/50 transition cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                PCA Strategic Enterprise Roadmap & Value Proposition
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                  Enterprise Whitepaper
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                วิสัยทัศน์ทางธุรกิจ กลุ่มเป้าหมาย และแผนพัฒนาความสามารถของระบบในระดับองค์กร
              </p>
            </div>
          </div>
          <div className="text-amber-400 shrink-0 ml-2">
            {isRoadmapOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
        </button>

        {isRoadmapOpen && (
          <div className="p-6 border-t border-slate-800 space-y-6 animate-fade-in">
            {/* Product Hypothesis Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
              <h4 className="text-xs font-bold text-amber-400 font-mono flex items-center gap-2">
                <span>🎯 Product Hypothesis & Business Value Proposition</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-white text-[11px]">1. Target Customer (กลุ่มเป้าหมาย)</div>
                  <p className="text-[11px] text-slate-400">องค์กรที่มีความสุ่มเสี่ยงสูง (Regulated Enterprise): ธนาคาร, ประกันภัย, การแพทย์, และฝ่ายกฎหมายที่ต้องการ Audit Trail ย้อนหลังได้</p>
                </div>
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-white text-[11px]">2. Problem Replaced (สิ่งที่ทดแทน)</div>
                  <p className="text-[11px] text-slate-400">ทดแทนการสร้าง Custom Prompt In-house ที่ไม่มี Audit Trail และขาดกลไกยับยั้งความเสี่ยงแบบ Deterministic Guardrail</p>
                </div>
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-white text-[11px]">3. Willingness to Pay (ทำไมถึงจ่าย)</div>
                  <p className="text-[11px] text-slate-400">จ่ายเพื่อลดความเสี่ยงด้าน Liability & Regulatory Penalty และป้องกัน Hallucination ในเคสเสี่ยงสูง</p>
                </div>
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-white text-[11px]">4. Primary KPI (ตัวชี้วัดหลัก)</div>
                  <p className="text-[11px] text-slate-400">Audit Compliance Rate (100%), Human Intervention Override Rate (&lt;5%), และ Zero Hallucination Breach</p>
                </div>
              </div>
            </div>

            {/* 4 Phases Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Phase 1 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-indigo-400 font-mono text-xs">Phase 1 — Core Reliability</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">Current Focus</span>
                </div>
                <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                  <li>พัฒนาโครงสร้างการประมวลผลและการตรวจสอบย้อนหลัง (Audit Trail) ให้มีความเสถียรสูงสุด</li>
                  <li>สร้างระบบตรวจสอบความถูกต้องของข้อมูลและผลลัพธ์ตามเกณฑ์มาตรฐาน</li>
                </ul>
              </div>

              {/* Phase 2 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-sky-400 font-mono text-xs">Phase 2 — Knowledge Integration</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Planned</span>
                </div>
                <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                  <li>เชื่อมต่อฐานข้อมูลภายนอกและแหล่งอ้างอิงกฎหมายเฉพาะทาง</li>
                  <li>พัฒนาระบบ Citation และการอ้างอิงแหล่งที่มาอย่างแม่นยำ</li>
                </ul>
              </div>

              {/* Phase 3 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-rose-400 font-mono text-xs">Phase 3 — Advanced Governance</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Planned</span>
                </div>
                <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                  <li>ระบบจัดการสิทธิ์ผู้ใช้งานระดับองค์กร (RBAC) และนโยบายความปลอดภัยแบบไดนามิก</li>
                  <li>การทดสอบความปลอดภัยและการประเมินความเสี่ยงจากผู้เชี่ยวชาญภายนอก</li>
                </ul>
              </div>

              {/* Phase 4 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-emerald-400 font-mono text-xs">Phase 4 — Enterprise Scale</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Target Milestone</span>
                </div>
                <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                  <li>ร่วมมือกับพาร์ทเนอร์เชิงกลยุทธ์ในการใช้งานจริงระดับองค์กร</li>
                  <li>เผยแพร่รายงานการประเมินประสิทธิภาพและความคุ้มค่าต่อการลงทุน</li>
                </ul>
              </div>
            </div>

            {/* ── Enterprise Governance & Standards ── */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                องค์ประกอบการควบคุมธรรมาภิบาลตามมาตรฐานสากล (Global Compliance Standards)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {/* ISO/IEC 42001 */}
                <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-300 text-xs flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-sky-400" />
                      ISO/IEC 42001:2023 (AIMS Alignment)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    เทียบเคียงกรอบระบบบริหารจัดการปัญญาประดิษฐ์ในด้านการประเมินความเสี่ยงและการกำกับดูแลโดยมนุษย์ เพื่อให้การตัดสินใจตรวจสอบย้อนหลังได้ทุกขั้นตอน
                  </p>
                </div>

                {/* NIST AI RMF 1.0 */}
                <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-indigo-400" />
                      NIST AI RMF 1.0 Framework
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    ประยุกต์ใช้หลักการกำกับดูแล (GOVERN, MAP, MEASURE, MANAGE) และตัวชี้วัดความน่าเชื่อถือเพื่อความปลอดภัยและความยืดหยุ่นในการใช้งาน
                  </p>
                </div>
              </div>
            </div>

            {/* ── GCP Cloud Infrastructure & Credits Integration ── */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Active Google Cloud Project Configuration
              </h4>

              <div className="p-4 bg-emerald-950/20 rounded-xl border border-emerald-500/30 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">ACTIVE PROJECT</span>
                    <span className="text-white font-bold">Production GCP Project</span>
                  </div>
                  <span className="text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 text-[11px]">
                    Billing: Active Cloud Account
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] py-1">
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Project Type</div>
                    <div className="text-white font-bold truncate">Production Serverless</div>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Region</div>
                    <div className="text-white font-bold">asia-southeast1</div>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Runtime</div>
                    <div className="text-white font-bold">Cloud Run Container</div>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Gemini Model</div>
                    <div className="text-white font-bold">gemini-3.5-flash-lite</div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  ตัวแอปพลิเคชันถูกแพ็กเกจและรันบน Cloud Run ภายใต้ระบบคลาวด์มาตรฐาน การใช้งานบริการ Google Cloud และ Gemini API จัดการผ่าน Billing Account ขององค์กรอย่างปลอดภัย
                </p>
              </div>

              {/* System Implementation Status Matrix */}
              <div className="pt-2 space-y-3">
                <h5 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  System Implementation Status Matrix (ตารางตรวจสอบสถานะการทำงานจริง vs แนวคิด)
                </h5>
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-[11px] text-slate-300 font-sans">
                    <thead className="bg-slate-900 text-slate-200 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Capability / Feature</th>
                        <th className="p-2.5 text-center">Status</th>
                        <th className="p-2.5">Verification & Implementation Detail</th>
                        <th className="p-2.5">Evidence / Traceability Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      <tr>
                        <td className="p-2.5 font-medium text-white">Gemini API Integration</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">ทำงานจริง (Implemented)</span>
                        </td>
                        <td className="p-2.5 text-slate-400">ใช้ @google/genai SDK ผ่าน `process.env.GEMINI_API_KEY` ของโปรเจกต์ GCP จริง</td>
                        <td className="p-2.5 font-mono text-[10px] text-sky-400">src/lib/gemini.ts, @google/genai</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-white">Cryptographic Audit Package (.zip)</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">ทำงานจริง (Verified)</span>
                        </td>
                        <td className="p-2.5 text-slate-400">สร้างไฟล์ SHA-256 hashes, WORM chain (JSONL), และ RFC3161 Timestamp (.tsr) ได้จริง</td>
                        <td className="p-2.5 font-mono text-[10px] text-sky-400">manifest.json, audit.sig, timestamp.tsr</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-white">Containerized Deployment on Cloud Run</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">ทำงานจริง (Containerized)</span>
                        </td>
                        <td className="p-2.5 text-slate-400">แอปพลิเคชันรันบน Cloud Run container ภายในโปรเจกต์ GCP ภายใต้พอร์ตมาตรฐาน 3000</td>
                        <td className="p-2.5 font-mono text-[10px] text-sky-400">Cloud Run Service URL / Revision ID</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-white">Vertex AI SDK (Dedicated)</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">แนวคิด/สถาปัตยกรรม (Design Intent)</span>
                        </td>
                        <td className="p-2.5 text-slate-400">ปัจจุบันใช้งานผ่าน Gemini Developer API (`@google/genai`) ไม่ได้ใช้ Vertex AI Python/Node SDK โดยตรง</td>
                        <td className="p-2.5 font-mono text-[10px] text-amber-400">Conceptual Architecture Spec</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-white">Automated ISO/NIST Compliance</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">อ้างอิงกรอบแนวคิด (Design Reference)</span>
                        </td>
                        <td className="p-2.5 text-slate-400">เป็นการออกแบบสถาปัตยกรรมให้สอดคล้องกับหลักการ (Aligned with AIMS/RMF) ไม่ใช่ใบรับรองสำเร็จรูป</td>
                        <td className="p-2.5 font-mono text-[10px] text-amber-400">ISO 42001 & NIST AI RMF Alignment Guide</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── All 5 GCP Free Tier & Enterprise Services Manager ── */}
              {/* Hiding GCP configuration section as requested by user */}
            </div>
          </div>
        )}
      </div>

      {/* Intellectual Property & Architecture Whitepaper Disclaimer */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 leading-relaxed font-mono space-y-2 shadow-xl">
        <div className="flex items-center space-x-2 text-amber-400 font-bold">
          <span>🛡️</span>
          <span>Architecture Whitepaper & IP Protection Disclaimer</span>
        </div>
        <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
          This document describes the conceptual architecture of PCA v2.0. Certain implementation details, algorithms, heuristics, configuration parameters, prompt engineering techniques, optimization strategies, and proprietary components have been intentionally omitted to protect intellectual property and trade secrets. This document is intended to describe conceptual capabilities and governance principles only. It is not a software design specification and should not be interpreted as documentation of the internal implementation, runtime behavior, prompt architecture, proprietary algorithms, or configuration of PCA.
        </p>
      </div>
    </>
  )}
</div>
  );
};
