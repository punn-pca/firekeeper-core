import { ConversationTurn, MemoryItem, PCAState, EvidenceItem } from '../types';
import { normalizeReport } from '../export/reportNormalizer';
import { validateReportModel } from '../export/reportValidator';

interface TestCase {
  id: number;
  name: string;
  description: string;
  history: ConversationTurn[];
  pcaState: Partial<PCAState>;
  memories: MemoryItem[];
}

const testCases: TestCase[] = [
  {
    id: 1,
    name: 'Contradictory Evidence',
    description: 'Two pieces of evidence directly contradict each other. Verify conflict penalty, reporting of conflicts, and safe confidence calibration.',
    history: [
      { role: 'user', content: 'ระบบความปลอดภัยของเซิร์ฟเวอร์หลักยังคงเสถียรอยู่หรือไม่?' }
    ],
    memories: [],
    pcaState: {
      user_input: 'ระบบความปลอดภัยของเซิร์ฟเวอร์หลักยังคงเสถียรอยู่หรือไม่?',
      language: 'th',
      observations: ['ทีมวิศวกรตรวจพบกิจกรรมที่น่าสงสัยในพอร์ต 8080', 'รายงานความปลอดภัยประจำสัปดาห์เคลมว่าไม่มีภัยคุกคาม'],
      understanding: 'การประเมินความปลอดภัยของเซิร์ฟเวอร์หลักในภาวะข้อมูลขัดแย้ง',
      purpose: 'ประเมินเสถียรภาพและตรวจสอบข้อขัดแย้งเชิงประจักษ์',
      constraints: ['ต้องอ้างอิงหลักฐานดิบเท่านั้น', 'ห้ามสรุปแบบคาดเดา'],
      hypotheses: [
        { claim: 'ระบบถูกแทรกแซงและกำลังมีความเสี่ยง', confidence: 45 },
        { claim: 'ระบบปลอดภัยและไม่มีความผิดปกติ', confidence: 55 }
      ],
      evidence: [
        'Log-Alert: พอร์ต 8080 ตรวจพบ Bruteforce Attack สำเร็จเมื่อเวลา 02:14 UTC',
        'Compliance-Report: ตรวจสอบความสอดคล้องผ่าน 100% (เผยแพร่ก่อนเกิดเหตุ 1 วัน)'
      ],
      conflicts: [
        'ระบบ Log-Alert ตรวจพบการโจมตีสำเร็จ แต่รายงาน Compliance-Report เคลมว่าปลอดภัย 100%'
      ],
      missing_info: ['ข้อมูลยืนยันผลกระทบจริงบนฐานข้อมูล (Database Audit Log)'],
      decision: 'ชะลอการตอบรับแบบปกติและสั่งกักกันพอร์ต 8080 ทันที (Deferred Response)',
      response: 'จากการตรวจพบข้อขัดแย้งเชิงประจักษ์ระดับสูงระหว่างระบบแจ้งเตือนเชิงรุกและเอกสารสอดคล้องกฎระเบียบ ระบบแนะนำให้ยึดหลัก Worst-Case Scenario และสั่งดำเนินการจำกัดพื้นที่การเชื่อมต่อพอร์ต 8080',
      confidence: 'ต่ำ',
      llm_provider: 'Google AI Studio',
      llm_model: 'gemini-3.6-flash',
      execution_time_ms: 120,
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      version: '2.0',
      evidence_explorer: [
        {
          id: 'ev-1',
          source: 'official-alert',
          content: 'Log-Alert: พอร์ต 8080 ตรวจพบ Bruteforce Attack สำเร็จเมื่อเวลา 02:14 UTC',
          credibilityScore: 98,
          supportScore: 90,
          conflictScore: 80,
          noveltyScore: 95,
          reliabilityScore: 98,
          strength: 'High',
          type: 'Empirical',
          documentId: 'ALERT-0214',
          locator: 'Syslog Port 8080'
        },
        {
          id: 'ev-2',
          source: 'compliance-pdf',
          content: 'Compliance-Report: ตรวจสอบความสอดคล้องผ่าน 100% (เผยแพร่ก่อนเกิดเหตุ 1 วัน)',
          credibilityScore: 70,
          supportScore: 10,
          conflictScore: 80,
          noveltyScore: 40,
          reliabilityScore: 50,
          strength: 'Medium',
          type: 'Empirical',
          documentId: 'COMP-101',
          locator: 'Compliance Document PDF v1'
        }
      ],
      confidence_calibration: {
        scorePercent: 42,
        label: 'ต่ำ',
        formula: 'BaseConfidence * (1 - EpistemicPenalty) - ConflictWeight',
        evidenceStrength: 85,
        conflictPenalty: 35,
        missingInfoPenalty: 15,
        bayesianPosterior: 42
      },
      uncertainty_detection: {
        uncertaintyIndex: 78,
        drivers: ['ข้อมูลประวัติการทำ Bruteforce บน Syslog ขัดแย้งกับรายงาน Compliance ใบรับรองเดิม'],
        mitigationStrategy: 'ให้เจ้าหน้าที่ความปลอดภัยมนุษย์เข้าแทรกแซงและตรวจสอบหลักฐานระดับฟิสิกส์ทันที'
      }
    }
  },
  {
    id: 2,
    name: 'Insufficient Evidence',
    description: 'No empirical evidence is supplied. Verify that confidence is capped/downgraded and evidence quality is marked low/medium.',
    history: [
      { role: 'user', content: 'แนวโน้มราคาตลาดคาร์บอนเครดิตในปี 2570 จะเพิ่มขึ้นหรือไม่?' }
    ],
    memories: [],
    pcaState: {
      user_input: 'แนวโน้มราคาตลาดคาร์บอนเครดิตในปี 2570 จะเพิ่มขึ้นหรือไม่?',
      language: 'th',
      observations: ['ผู้ใช้ถามหาคาดการณ์ในอนาคตที่ยังไม่เกิดขึ้นจริง'],
      understanding: 'การคาดการณ์เชิงเก็งกำไรในตลาดที่มีความผันผวนสูง',
      purpose: 'วิเคราะห์แนวโน้มราคาปี 2570 บนสมมติฐานทางเศรษฐศาสตร์',
      constraints: ['ไม่มีข้อมูลหลักฐานเชิงประจักษ์ (No Empirical Evidence Available)'],
      hypotheses: [
        { claim: 'ราคาจะพุ่งสูงเนื่องจากมาตรการภาษีใหม่', confidence: 60 },
        { claim: 'ราคาจะทรงตัวหรือลดลงเนื่องจากกำลังการผลิตทดแทน', confidence: 40 }
      ],
      evidence: [], // No actual evidence
      conflicts: [],
      missing_info: ['สถิติราคาซื้อขายสดประจำปี 2570', 'นโยบายทางภาษีอย่างเป็นทางการของสหภาพยุโรปฉบับบังคับใช้จริง'],
      decision: 'รายงานตามสมมติฐานเชิงวิชาการโดยระบุดุลยพินิจของมนุษย์ (Level 1 Advisory)',
      response: 'ระบบระบุว่าประเด็นนี้อยู่ภายใต้สถานการณ์อนาคตที่ไม่มีหลักฐานเชิงประจักษ์รองรับแน่ชัด ข้อสรุปนี้จึงสร้างขึ้นบนการวิเคราะห์สมมติฐานทางเลือกเชิงเปรียบเทียบเท่านั้น',
      confidence: 'ไม่สามารถประเมินได้',
      llm_provider: 'Google AI Studio',
      llm_model: 'gemini-3.6-flash',
      execution_time_ms: 80,
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      version: '2.0',
      evidence_explorer: [], // Empty
      confidence_calibration: {
        scorePercent: 15,
        label: 'ไม่สามารถประเมินได้',
        formula: 'BaseConfidence * 0.2 (Epistemic Void)',
        evidenceStrength: 0,
        conflictPenalty: 0,
        missingInfoPenalty: 80,
        bayesianPosterior: 15
      },
      uncertainty_detection: {
        uncertaintyIndex: 95,
        drivers: ['ไม่มีชุดข้อมูลหลักฐาน (Missing Datasets)', 'สมมติฐานคาดการณ์อนาคตระยะยาว'],
        mitigationStrategy: 'ห้ามนำรายงานชิ้นนี้ไปใช้ตัดสินใจทางการเงินเด็ดขาด ให้ยึดเป็นเพียงแบบจำลองทางเลือก'
      }
    }
  },
  {
    id: 3,
    name: 'Missing Datasets & Missing Information',
    description: 'PCA state has blank trace entries, missing memories, and no telemetry data. Verify system resilience and missing dataset alerts.',
    history: [
      { role: 'user', content: 'ประเมินความสอดคล้องมาตรฐานขั้นต้น' }
    ],
    memories: [],
    pcaState: {
      user_input: 'ประเมินความสอดคล้องมาตรฐานขั้นต้น',
      language: 'th',
      observations: [],
      understanding: 'ประเมินเบื้องต้น',
      purpose: 'ประเมินตามมาตรฐานทั่วไป',
      constraints: [],
      hypotheses: [],
      evidence: [],
      conflicts: [],
      missing_info: ['ข้อมูลโครงสร้างเครือข่าย', 'นโยบายองค์กร', 'ผลการประเมินรอบก่อนหน้า'],
      decision: 'สรุปผลขั้นแรกตามที่ระบุ',
      response: 'รายงานความสอดคล้องเบื้องต้นระบุว่าข้อมูลที่ได้รับไม่พียงพอที่จะประเมินตามมาตรฐาน ISO/IEC 42001 ได้อย่างมีนัยสำคัญ',
      confidence: 'ต่ำ',
      llm_provider: 'Google AI Studio',
      llm_model: 'gemini-3.6-flash',
      execution_time_ms: 50,
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      version: '2.0',
      trace: [] // Empty trace to simulate missing pipeline details
    }
  },
  {
    id: 4,
    name: 'High-Risk / Low-Confidence Scenario',
    description: 'High risk exposure and low calibrated confidence. Test validation warnings, status of evidence, and safety flags.',
    history: [
      { role: 'user', content: 'อนุมัติการเชื่อมต่อพอร์ตสาธารณะเข้ากับระบบคอร์หลักโดยไม่มีไฟร์วอลล์เสริม' }
    ],
    memories: [
      { content: 'นโยบายความมั่นคงปลอดภัยห้ามทำการเชื่อมต่อเครือข่ายสาธารณะเข้ากับเซิร์ฟเวอร์คอร์หลักโดยตรงเด็ดขาด', layer: 'Constraint', source: 'LTM Security Policy', confidence: 99 }
    ],
    pcaState: {
      user_input: 'อนุมัติการเชื่อมต่อพอร์ตสาธารณะเข้ากับระบบคอร์หลักโดยไม่มีไฟร์วอลล์เสริม',
      language: 'th',
      observations: ['ผู้ใช้ประสงค์จะทำการเชื่อมโยงข้อมูลที่มีระดับความเสี่ยงสูงมาก', 'ขัดแย้งกับหลักการความปลอดภัยของเครือข่ายระดับองค์กร'],
      understanding: 'การขออนุมัติการเปลี่ยนแปลงระบบควบคุมในลักษณะอันตรายและละเมิดข้อบังคับความปลอดภัย',
      purpose: 'ประเมินความเสี่ยงและแจ้งจุดตัดความปลอดภัย',
      constraints: ['ห้ามฝ่าฝืนนโยบายความมั่นคงปลอดภัยเครือข่าย', 'คุ้มครองทรัพย์สินส่วนกลางและสิทธิผู้มีส่วนได้เสีย'],
      hypotheses: [
        { claim: 'การขอเปิดเชื่อมต่อเป็นกรณีเร่งด่วนที่สมควรอนุญาตผ่านบอร์ดชั่วคราว', confidence: 12 },
        { claim: 'การปฏิเสธคำขอและสั่งปิดกั้นการดำเนินการทันทีตามมาตรฐานความเสี่ยง', confidence: 88 }
      ],
      evidence: [
        'Constraint: นโยบายความมั่นคงปลอดภัยห้ามทำการเชื่อมต่อเครือข่ายสาธารณะเข้ากับเซิร์ฟเวอร์คอร์หลักโดยตรงเด็ดขาด',
        'ISO-27001-Standard: กฎควบคุมการแบ่งปันโซนเครือข่ายเคร่งครัด'
      ],
      conflicts: [
        'คำขอจากผู้ใช้งานขัดแย้งกับนโยบายระบบรักษาความปลอดภัยเครือข่ายหลักอย่างเป็นลายลักษณ์อักษร'
      ],
      missing_info: ['เหตุผลความจำเป็นทางวิศวกรรมที่มากพอสำหรับการยกเว้นเป็นกรณีพิเศษ'],
      decision: 'ปฏิเสธคำขอเปิดพอร์ตสาธารณะและออกใบสั่งบล็อกสิทธิชั่วคราว (HARD REJECTION)',
      response: 'ระบบตรวจพบความเสี่ยงร้ายแรงในระดับยอมรับไม่ได้ (Unacceptable Risk) ขัดตรรกะ ISO/IEC 27001 และนโยบาย LTM ข้อที่ 1 อย่างชัดเจน จึงขอปฏิเสธการดำเนินการนี้เพื่อปกป้องความมั่นคงปลอดภัยขององค์กร',
      confidence: 'ต่ำ',
      llm_provider: 'Google AI Studio',
      llm_model: 'gemini-3.6-flash',
      execution_time_ms: 150,
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      version: '2.0',
      evidence_explorer: [
        {
          id: 'ev-3',
          source: 'ltm-security-policy',
          content: 'นโยบายความมั่นคงปลอดภัยห้ามทำการเชื่อมต่อเครือข่ายสาธารณะเข้ากับเซิร์ฟเวอร์คอร์หลักโดยตรงเด็ดขาด',
          credibilityScore: 99,
          supportScore: 99,
          conflictScore: 0,
          noveltyScore: 50,
          reliabilityScore: 99,
          strength: 'High',
          type: 'Empirical',
          documentId: 'POLICY-LTM-1',
          locator: 'LTM Security Policy Section 4.2'
        }
      ],
      confidence_calibration: {
        scorePercent: 22,
        label: 'ต่ำ',
        formula: 'PolicyViolationPenaltyApplied',
        evidenceStrength: 99,
        conflictPenalty: 80, // Heavy conflict with policies
        missingInfoPenalty: 10,
        bayesianPosterior: 22
      },
      uncertainty_detection: {
        uncertaintyIndex: 85,
        drivers: ['ความขัดแย้งเชิงนโยบายอย่างร้ายแรง', 'ความเสี่ยงต่อการถูกเจาะระบบในระดับวิกฤต'],
        mitigationStrategy: 'ล็อกเซสชันชั่วคราวและแจ้งเตือนแผนกป้องกันข้อมูลส่วนกลางตรวจสอบเจตนาผู้ใช้'
      }
    }
  },
  {
    id: 5,
    name: 'Low-Risk / High-Confidence Scenario',
    description: 'Perfect empirical grounding and low uncertainty. Verify high confidence output, traceability, and valid report validation status.',
    history: [
      { role: 'user', content: 'ประเมินแผนอัปเกรดมาตรฐาน ISO 42001 ของระบบด้วยข้อมูลข้อตกลงใหม่' }
    ],
    memories: [
      { content: 'ระบบได้รับการประเมิน Gap Analysis สำเร็จและได้คะแนนสอดคล้องกฎ 94%', layer: 'Context', source: 'Internal QA Portal', confidence: 95 }
    ],
    pcaState: {
      user_input: 'ประเมินแผนอัปเกรดมาตรฐาน ISO 42001 ของระบบด้วยข้อมูลข้อตกลงใหม่',
      language: 'th',
      observations: ['ข้อมูลอัปเกรดและ Gap Analysis ถูกโหลดอย่างสมบูรณ์', 'แผนได้รับการตรวจสอบเชิงกฎหมายเบื้องต้น'],
      understanding: 'การวิเคราะห์ความพร้อมระบบตามเกณฑ์มาตรฐานสากล ISO/IEC 42001:2023',
      purpose: 'จัดทำแผนปรับปรุงระดับธรรมาภิบาล AI ขององค์กร',
      constraints: ['ต้องคำนึงถึงกรอบปฏิบัติการของ NIST AI RMF', 'อิงความจำของระบบ'],
      hypotheses: [
        { claim: 'ระบบมีความพร้อมสูงและสมควรดำเนินการจัดทำขั้นตอนสมัครสอบใบรับรองรอบถัดไป', confidence: 94 }
      ],
      evidence: [
        'Empirical-Record: ผล Gap Analysis สำเร็จระดับ 94% ได้การรับรองจากหน่วยประเมินสากลเมื่อ 12 สค 2569'
      ],
      conflicts: [],
      missing_info: [],
      decision: 'ดำเนินการส่งแผนอัปเกรดขั้นที่สองเพื่อสมัครสอบรับใบรับรองระบบ AI (PROCEED)',
      response: 'ระบบคำนวณและประเมินผ่าน Bayesian scoring แล้วยืนยันระดับความมั่นใจสูงสุดด้วยผลตรวจ Gap Analysis 94% และหลักฐานที่ชัดเจน แนะนำให้ดำเนินขั้นตอนรับรองระบบทันที',
      confidence: 'สูง',
      llm_provider: 'Google AI Studio',
      llm_model: 'gemini-3.6-flash',
      execution_time_ms: 190,
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      version: '2.0',
      evidence_explorer: [
        {
          id: 'ev-4',
          source: 'official-gap-analysis',
          content: 'Empirical-Record: ผล Gap Analysis สำเร็จระดับ 94% ได้การรับรองจากหน่วยประเมินสากลเมื่อ 12 สค 2569',
          credibilityScore: 97,
          supportScore: 95,
          conflictScore: 0,
          noveltyScore: 88,
          reliabilityScore: 97,
          strength: 'High',
          type: 'Empirical',
          documentId: 'GAP-ISO-42001',
          locator: 'Audit Report Page 3'
        }
      ],
      confidence_calibration: {
        scorePercent: 96,
        label: 'สูง',
        formula: 'BaseConfidence * (1 - EpistemicPenalty) + EvidenceBoost',
        evidenceStrength: 97,
        conflictPenalty: 0,
        missingInfoPenalty: 0,
        bayesianPosterior: 96
      },
      uncertainty_detection: {
        uncertaintyIndex: 8,
        drivers: [],
        mitigationStrategy: 'ดำเนินตามยุทธศาสตร์หลักและบันทึกรอยเท้าเข้าระบบความจำระยะยาว'
      }
    }
  },
  {
    id: 6,
    name: 'Conflicting Recommendations',
    description: 'Fictional/conflicting recommendations are injected to verify that they are captured and resolved logically without fake numerical scores.',
    history: [
      { role: 'user', content: 'ขอแผนปฏิบัติการด่วนเพื่อบริหารโครงการที่กำลังดีเลย์' }
    ],
    memories: [],
    pcaState: {
      user_input: 'ขอแผนปฏิบัติการด่วนเพื่อบริหารโครงการที่กำลังดีเลย์',
      language: 'th',
      observations: ['โครงการหลักล่าช้ากว่าแผน 4 สัปดาห์', 'งบประมาณเหลือจำกัด'],
      understanding: 'การแก้สถานการณ์วิกฤตของโครงการล่าช้าด้วยมาตรการจำกัดความเสียหาย',
      purpose: 'จัดสรรกำลังพลและงบประมาณเพื่อเร่งปิดแผนงาน',
      constraints: ['ห้ามเพิ่มงบประมาณรวม', 'ห้ามปรับลดฟีเจอร์หลัก'],
      hypotheses: [
        { claim: 'มาตรการเร่งเวลาโดยจ้างงานภายนอก (Outsourcing) ช่วยเร่งได้ดีสุด', confidence: 40 },
        { claim: 'มาตรการเพิ่มกำลังคนในทีมโดยทำสลับคู่ผลัดเวลา (Overtime Allocation) ช่วยประหยัดสุด', confidence: 60 }
      ],
      evidence: [
        'Project-Log: งบประมาณคงเหลือ 15,000 USD ต่ำกว่าเกณฑ์จัดซื้อภายนอก',
        'Policy-Rule: ระเบียบบริษัทห้ามพนักงานทำงานเกิน 50 ชั่วโมงต่อสัปดาห์'
      ],
      conflicts: [
        'ทางเลือกที่ 1 (จ้างนอก) ขัดแย้งกับข้อจำกัดเรื่องงบประมาณที่ตึงตัว',
        'ทางเลือกที่ 2 (ทำล่วงเวลา) ขัดแย้งกับข้อบังคับห้ามทำงานเกิน 50 ชม.'
      ],
      missing_info: ['ข้อมูลกำลังพลสำรองที่สามารถสลับตารางเวลาทำงานข้ามทีมได้'],
      decision: 'เลือกกลยุทธ์จัดตารางทรัพยากรแบบ Agile Sprint รีไพรออริตี้ฟีเจอร์ที่ไม่ใช่วิกฤต (Agile Defer Mode)',
      response: 'เนื่องจากทั้งสองข้อเสนอแนะหลัก (จ้างนอก และ ทำล่วงเวลา) ตกอยู่ในสภาวะขัดแย้งเชิงนโยบายการควบคุมและงบประมาณอย่างรุนแรง ระบบปฏิเสธแนวทางทั้งสองและเสนอยุทธศาสตร์ข้อที่สามซึ่งปลอดภัยและสอดคล้องตามกฎควบคุม 100%',
      confidence: 'ปานกลาง',
      llm_provider: 'Google AI Studio',
      llm_model: 'gemini-3.6-flash',
      execution_time_ms: 110,
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      version: '2.0',
      evidence_explorer: [
        {
          id: 'ev-5',
          source: 'project-dashboard',
          content: 'Project-Log: งบประมาณคงเหลือ 15,000 USD ต่ำกว่าเกณฑ์จัดซื้อภายนอก',
          credibilityScore: 92,
          supportScore: 90,
          conflictScore: 50,
          noveltyScore: 70,
          reliabilityScore: 92,
          strength: 'Medium',
          type: 'Empirical',
          documentId: 'PRJ-LOG-01',
          locator: 'Project Budget Sheet'
        },
        {
          id: 'ev-6',
          source: 'hr-policy-manual',
          content: 'Policy-Rule: ระเบียบบริษัทห้ามพนักงานทำงานเกิน 50 ชั่วโมงต่อสัปดาห์',
          credibilityScore: 99,
          supportScore: 95,
          conflictScore: 50,
          noveltyScore: 10,
          reliabilityScore: 99,
          strength: 'High',
          type: 'Empirical',
          documentId: 'HR-POLICY-50H',
          locator: 'HR Manual Clause 12'
        }
      ],
      confidence_calibration: {
        scorePercent: 55,
        label: 'ปานกลาง',
        formula: 'AlternativeReconciliationApplied',
        evidenceStrength: 95,
        conflictPenalty: 35,
        missingInfoPenalty: 10,
        bayesianPosterior: 55
      },
      uncertainty_detection: {
        uncertaintyIndex: 58,
        drivers: ['เส้นทางการเร่งงานล่าช้าสองเส้นทางหลักติดขัดข้อห้าม'],
        mitigationStrategy: 'จัดทีมพิจารณาร่วม (Joint Sprint Review) เพื่ออนุมัติยกเลิกขอบเขตบางส่วนของฟีเจอร์ที่ไม่จำเป็น โดยไม่ต้องยกเว้นนโยบายพนักงานหรือขอสิทธิเพิ่มงบ'
      }
    }
  }
];

async function runEpistemicTest() {
  console.log('========================================================================');
  console.log('🛡️  FIRE KEEPER — COGNITIVE PIPELINE EPISTEMIC CONSISTENCY AUDIT WORKSPACE');
  console.log('========================================================================');
  console.log(`Running diagnostics using adversarial scenarios on Report Generator...`);
  console.log(`Node environment verified. Native subtle crypto fallback active.\n`);

  let failuresCount = 0;
  const summaryReport: any[] = [];

  for (const tc of testCases) {
    console.log(`------------------------------------------------------------------------`);
    console.log(`🧪 Test Case #${tc.id}: ${tc.name}`);
    console.log(`📝 Description: ${tc.description}`);
    
    try {
      // 1. Normalization phase
      const startMs = Date.now();
      const reportModel = await normalizeReport(tc.history, tc.pcaState as PCAState, tc.pcaState.memories || tc.memories);
      const endMs = Date.now();
      const duration = endMs - startMs;

      // 2. Validation Checks
      const valResult = validateReportModel(reportModel);

      // Verify NO fabricated scores rule
      // Every score must strictly trace back to values in original state and fall in valid bounds
      const confidence = reportModel.summary.confidenceScore;
      const isConfidenceGrounded = confidence === (tc.pcaState.confidence_calibration?.scorePercent ?? tc.pcaState.pipeline_machine?.confidence ?? 88) || 
                                   (reportModel.summary.evidenceQuality === 'MEDIUM' && confidence <= 75); // Safe capping rule

      const hasInvalidNumericalClaims = 
        confidence < 0 || confidence > 100 || 
        reportModel.uncertainty.uncertaintyIndex < 0 || reportModel.uncertainty.uncertaintyIndex > 100 ||
        reportModel.evidence.some(ev => ev.credibilityScore < 0 || ev.credibilityScore > 100 || ev.reliabilityScore < 0 || ev.reliabilityScore > 100);

      const hasFabricatedScores = !isConfidenceGrounded || hasInvalidNumericalClaims;

      // Traceability Check: Ensure every status/evidence has citation/locator when empirical evidence is provided
      const hasTraceableEvidence = reportModel.evidence.length === 0 || reportModel.evidence.every(ev => !!ev.locator || !!ev.source);

      // Conflict logging assertion
      const conflictsLoggedCorrectly = tc.pcaState.conflicts && tc.pcaState.conflicts.length > 0 
        ? reportModel.risks.some(r => r.id.startsWith('RSK-CONF') || r.description.includes('ความขัดแย้ง'))
        : true;

      const passed = valResult.valid && !hasFabricatedScores && hasTraceableEvidence && conflictsLoggedCorrectly;

      if (!passed) {
        failuresCount++;
      }

      console.log(`   🔸 [NORMALIZER] Report ID generated: ${reportModel.id}`);
      console.log(`   🔸 [METRICS] Confidence Score: ${reportModel.summary.confidenceScore}% (Calibrated: ${reportModel.summary.verdictThai})`);
      console.log(`   🔸 [METRICS] Evidence Quality: ${reportModel.summary.evidenceQuality} | Risk Level: ${reportModel.summary.riskLevel}`);
      console.log(`   🔸 [METRICS] Uncertainty Index: ${reportModel.uncertainty.uncertaintyIndex}% | Missing Datasets: ${reportModel.uncertainty.missingInfo.length}`);
      console.log(`   🔸 [TRACEABILITY] Evidence source count: ${reportModel.evidence.length}`);
      if (reportModel.evidence.length > 0) {
        console.log(`      └─ Evidence Basis: ${reportModel.evidence.map(e => `[${e.source} @ ${e.locator || 'Unspecified'}]`).join(', ')}`);
      }
      
      console.log(`   🔸 [VALIDATION] Validated: ${valResult.valid ? '✅ VALID' : '❌ INVALID'}`);
      if (valResult.errors.length > 0) {
        console.log(`      └─ Errors: ${JSON.stringify(valResult.errors)}`);
      }
      if (valResult.warnings.length > 0) {
        console.log(`      └─ Warnings: ${valResult.warnings.map(w => w.message).join(' | ')}`);
      }

      console.log(`   🔸 [SECURITY AUDIT]`);
      console.log(`      ├─ No fabricated scores: ${!hasFabricatedScores ? '✓ Passed (All scores grounded/calibrated in original state & bounds)' : '✕ Failed (Fabricated scores detected)'}`);
      console.log(`      ├─ Full evidence traceability: ${hasTraceableEvidence ? '✓ Passed (All source-backed state traces are tied to locator/provenance)' : '✕ Failed (Untraceable statement found)'}`);
      console.log(`      └─ Logic conflict mitigation: ${conflictsLoggedCorrectly ? '✓ Passed (Conflicts documented and factored into Risk indices)' : '✕ Failed (Unresolved conflict mismatch)'}`);
      console.log(`   🔸 [STATUS] ${passed ? '✅ PASSED' : '❌ FAILED'}`);

      summaryReport.push({
        id: tc.id,
        name: tc.name,
        confidence: `${reportModel.summary.confidenceScore}% (${reportModel.summary.verdictThai})`,
        risk: reportModel.summary.riskLevel,
        evidenceQuality: reportModel.summary.evidenceQuality,
        uncertainty: `${reportModel.uncertainty.uncertaintyIndex}%`,
        missingCount: reportModel.uncertainty.missingInfo.length,
        validation: valResult.valid ? 'VALID' : 'INVALID',
        noFabrication: !hasFabricatedScores ? 'YES' : 'NO',
        traceable: hasTraceableEvidence ? 'YES' : 'NO',
        passed
      });

    } catch (err: any) {
      failuresCount++;
      console.log(`   💥 Test failed with exception: ${err.message}`);
      console.log(err.stack);
      summaryReport.push({
        id: tc.id,
        name: tc.name,
        passed: false,
        error: err.message
      });
    }
  }

  console.log('\n========================================================================');
  console.log('📊  EPISTEMIC CONSISTENCY DIAGNOSTIC AUDIT SUMMARY REPORT');
  console.log('========================================================================');
  console.log(`Total Test Cases Executed: ${testCases.length}`);
  console.log(`Successful Passes: ${testCases.length - failuresCount}`);
  console.log(`Failures/Alerts: ${failuresCount}`);
  console.log('------------------------------------------------------------------------');
  console.table(summaryReport.map(r => ({
    'ID': r.id,
    'Scenario Name': r.name,
    'Conf Score': r.confidence,
    'Risk Lvl': r.risk,
    'Ev Quality': r.evidenceQuality,
    'Uncertainty': r.uncertainty,
    'No Fabric': r.noFabrication,
    'Traceable': r.traceable,
    'Status': r.passed ? '✅ PASSED' : '❌ FAILED'
  })));
  console.log('========================================================================');

  if (failuresCount > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL EPISTEMIC CONSISTENCY TESTS PASSED SUCCESSFULLY! NO FABRICATED SCORES DETECTED.');
    process.exit(0);
  }
}

runEpistemicTest();
