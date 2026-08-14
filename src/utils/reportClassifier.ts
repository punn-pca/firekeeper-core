import { PCAState } from '../types';

export type ReportPerspective =
  | 'executive'
  | 'strategic_decision'
  | 'evidence_investigation'
  | 'governance_risk'
  | 'technical_pipeline'
  | 'diagnostic_calibration'
  | 'legal_compliance'
  | 'financial_investment'
  | 'medical_healthcare'
  | 'tech_cybersecurity'
  | 'commercial_marketing'
  | 'public_policy'
  | 'custom_composer';

export interface ClassificationResult {
  perspective: ReportPerspective;
  title: string;
  subtitle: string;
  badgeColor: string;
  reasoning: string;
  confidenceScore: number;
  activeWidgetIds: string[];
}

export interface WidgetMeta {
  id: string;
  title: string;
  category: 'executive' | 'decision' | 'evidence' | 'governance' | 'pipeline' | 'diagnostic';
  iconName: string;
  description: string;
}

export const ALL_COMPOSER_WIDGETS: WidgetMeta[] = [
  { id: 'executive_kpi_deck', title: 'Executive KPI Deck (6 Core Metrics)', category: 'executive', iconName: 'Activity', description: '6 ดัชนีหลักสำหรับผู้บริหาร: ความมั่นใจ, ความเสี่ยง, หลักฐาน, ช่องว่างข้อมูล, มนุษย์กำกับ, มาตรฐาน' },
  { id: 'executive_brief', title: 'Executive Brief & Dashboard', category: 'executive', iconName: 'BarChart3', description: 'บทสรุปความเสี่ยง ระดับความเชื่อมั่น และ KPI สำหรับผู้บริหาร' },
  { id: 'whitebox_inspector', title: 'White-Box Cognitive Trace & Hypotheses', category: 'decision', iconName: 'Brain', description: 'ความโปร่งใสระดับสมมติฐาน: เหตุผลที่เลือก และเหตุผลที่ตัดตัวเลือกอื่นทิ้ง' },
  { id: 'alternative_decisions', title: 'Strategic Options & Trade-offs', category: 'decision', iconName: 'Compass', description: 'ทางเลือกยุทธศาสตร์ Option A/B/C ตารางข้อดีข้อเสีย และผลลัพธ์คาดการณ์' },
  { id: 'decision_graph', title: 'Decision Graph Network', category: 'decision', iconName: 'GitMerge', description: 'เครือข่ายผังการตัดสินใจ ลูป Feedback และจุดเปลี่ยนตรรกะ' },
  { id: 'bayesian_hypotheses', title: 'Hypotheses & Bayesian Shift', category: 'decision', iconName: 'Scale', description: 'การทดสอบสมมติฐานและค่าน้ำหนักความเชื่อมั่นเบย์เซียน' },
  { id: 'evidence_explorer', title: 'Evidence Explorer & Citations', category: 'evidence', iconName: 'Search', description: 'คลังหลักฐาน คะแนนสนับสนุน/ขัดแย้ง และโควตการอ้างอิงแหล่งที่มา' },
  { id: 'knowledge_graph', title: 'Knowledge Graph Matrix', category: 'evidence', iconName: 'Network', description: 'กราฟความสัมพันธ์เอนทิตี Node & Edge ในมิติเชิงความรู้' },
  { id: 'ranked_memories', title: 'Memory Evolution & Reranking', category: 'evidence', iconName: 'Database', description: 'ความจำระยะยาวที่ถูกเลือก คะแนนความเกี่ยวข้อง Cross-Encoder' },
  { id: 'governance_policies', title: 'Governance & Policy Guard', category: 'governance', iconName: 'ShieldCheck', description: 'การตรวจสอบนโยบาย ISO/NIST/Safety และการแก้ความขัดแย้ง' },
  { id: 'contextual_awareness', title: 'Contextual Awareness (Thai Domain)', category: 'governance', iconName: 'Landmark', description: 'ชั้นข้อมูลบริบทกฎหมายอาวุธปืน สุขภาพจิตชุมชน และการเฝ้าระวังภัยคุกคามไทย' },
  { id: 'human_agency', title: 'Enforced Human Agency Guard', category: 'governance', iconName: 'AlertOctagon', description: 'มาตรการกำกับดูแลโดยมนุษย์ และระบบอนุมัติ Token' },
  { id: 'pipeline_machine', title: 'Cognitive Pipeline Machine', category: 'pipeline', iconName: 'Activity', description: 'สถิติสภาวะการคิด Dependencies และสเตตัสประมวลผล' },
  { id: 'stage_radar', title: '12-Stage Cognitive Radar', category: 'pipeline', iconName: 'Layers', description: 'เรดาร์แสดงความสมบูรณ์ 12 ขั้นตอนเชิงลึก' },
  { id: 'execution_trace', title: '12-Stage Execution Trace & Timing', category: 'pipeline', iconName: 'Clock', description: 'บันทึกเวลา Milliseconds รายขั้นตอนและ JSON Output' },
  { id: 'confidence_calibration', title: 'Confidence Calibration Engine', category: 'diagnostic', iconName: 'Scale', description: 'สมการประเมินความมั่นใจ ปัจจัยความไม่แน่นอน และ Non-LLM Anchor' },
  { id: 'metacognition', title: 'Meta-Cognition & Self-Critique', category: 'diagnostic', iconName: 'RotateCcw', description: 'การวิพากษ์ตนเอง (Self-Doubt) การค้นหาจุดบอด (Blind spots) และ Bias' },
  { id: 'empirical_benchmark', title: 'PCA Diagnostic Test Suite', category: 'diagnostic', iconName: 'BarChart3', description: 'ผลการทดสอบระบบและ 12-Stage Diagnostic Suite' },
];

/**
 * Classifies PCAState to dynamically determine the best Report Perspective
 */
export function classifyPCAState(pcaState: PCAState): ClassificationResult {
  const userInput = (pcaState.user_input || '').toLowerCase();
  const purpose = (pcaState.purpose || '').toLowerCase();
  
  // Signals count
  const hasGovernance = Boolean(
    (pcaState.governance_policies && pcaState.governance_policies.length > 0) ||
    (pcaState.human_agency_enforcement && pcaState.human_agency_enforcement.riskScore > 40) ||
    userInput.includes('governance') || userInput.includes('ความเสี่ยง') || userInput.includes('นโยบาย') || userInput.includes('policy')
  );

  const hasDecisionOptions = Boolean(
    (pcaState.alternative_decisions && pcaState.alternative_decisions.length > 0) ||
    (pcaState.decision_graph && pcaState.decision_graph.nodes.length > 0) ||
    userInput.includes('ทางเลือก') || userInput.includes('ตัดสินใจ') || userInput.includes('เปรียบเทียบ') || userInput.includes('option') || userInput.includes('trade-off')
  );

  const hasDeepEvidence = Boolean(
    (pcaState.evidence_explorer && pcaState.evidence_explorer.length > 2) ||
    (pcaState.knowledge_graph && pcaState.knowledge_graph.nodes.length > 3) ||
    userInput.includes('หลักฐาน') || userInput.includes('อ้างอิง') || userInput.includes('วิจัย') || userInput.includes('citation') || userInput.includes('evidence')
  );

  const hasDiagnostics = Boolean(
    (pcaState.confidence_calibration && pcaState.confidence_calibration.eceScore !== undefined) ||
    (pcaState.meta_cognition && pcaState.meta_cognition.isCorrecting) ||
    userInput.includes('benchmark') || userInput.includes('calibration') || userInput.includes('ทดสอบ') || userInput.includes('audit')
  );

  const hasTechnicalPipeline = Boolean(
    userInput.includes('pipeline') || userInput.includes('trace') || userInput.includes('latency') || userInput.includes('stage')
  );

  // Domain Keywords Detection
  const isLegal = userInput.includes('กฎหมาย') || userInput.includes('มาตรา') || userInput.includes('คดี') || userInput.includes('ศาล') || userInput.includes('pdpa') || userInput.includes('พ.ร.บ.') || userInput.includes('legal') || userInput.includes('statute');
  const isFinancial = userInput.includes('การเงิน') || userInput.includes('ลงทุน') || userInput.includes('งบประมาณ') || userInput.includes('ต้นทุน') || userInput.includes('กำไร') || userInput.includes('roi') || userInput.includes('finance') || userInput.includes('capital');
  const isMedical = userInput.includes('การแพทย์') || userInput.includes('สุขภาพ') || userInput.includes('ยา') || userInput.includes('คลินิก') || userInput.includes('ผู้ป่วย') || userInput.includes('medical') || userInput.includes('health') || userInput.includes('clinical');
  const isTechCyber = userInput.includes('ไซเบอร์') || userInput.includes('สถาปัตยกรรม') || userInput.includes('ซอฟต์แวร์') || userInput.includes('cyber') || userInput.includes('security') || userInput.includes('vulnerability');
  const isCommercial = userInput.includes('การตลาด') || userInput.includes('ขาย') || userInput.includes('โฆษณา') || userInput.includes('ลูกค้า') || userInput.includes('marketing') || userInput.includes('sales') || userInput.includes('commercial');
  const isPublicPolicy = userInput.includes('นโยบายภาครัฐ') || userInput.includes('ยุทธศาสตร์ชาติ') || userInput.includes('ผู้มีส่วนได้ส่วนเสีย') || userInput.includes('public policy');

  // Classification Logic
  if (isLegal) {
    return {
      perspective: 'legal_compliance',
      title: 'Legal & Statutory Compliance Audit Report',
      subtitle: 'รายงานวิเคราะห์ข้อกฎหมาย การปฏิบัติตามข้อบังคับ และดุลยพินิจรับฟังพยานหลักฐาน',
      badgeColor: 'rose',
      reasoning: 'ตรวจพบคำถามเชิงกฎหมาย ตัวบทมาตรา หรือข้อบังคับทางกฎหมาย (Legal & Statutory Context)',
      confidenceScore: 96,
      activeWidgetIds: [
        'executive_brief',
        'governance_policies',
        'contextual_awareness',
        'evidence_explorer',
        'human_agency',
      ],
    };
  }

  if (isFinancial) {
    return {
      perspective: 'financial_investment',
      title: 'Financial Evaluation & Capital Allocation Report',
      subtitle: 'รายงานประเมินการเงิน การลงทุน ต้นทุนทางธุรกิจ และผลตอบแทนความเสี่ยง',
      badgeColor: 'emerald',
      reasoning: 'ตรวจพบโจทย์การวิเคราะห์ทางการเงิน งบประมาณ หรือต้นทุนค่าเสียโอกาส (Financial & ROI)',
      confidenceScore: 95,
      activeWidgetIds: [
        'executive_brief',
        'alternative_decisions',
        'confidence_calibration',
        'bayesian_hypotheses',
        'stage_radar',
      ],
    };
  }

  if (isMedical) {
    return {
      perspective: 'medical_healthcare',
      title: 'Clinical Evaluation & Healthcare Safety Report',
      subtitle: 'รายงานประเมินทางการแพทย์ ความปลอดภัยทางคลินิก และขอบเขตการคัดกรอง',
      badgeColor: 'sky',
      reasoning: 'ตรวจพบโจทย์ด้านการแพทย์ เวชปฏิบัติ หรือขอบเขตความปลอดภัยทางสาธารณสุข (Clinical Safety)',
      confidenceScore: 95,
      activeWidgetIds: [
        'executive_brief',
        'evidence_explorer',
        'governance_policies',
        'contextual_awareness',
        'metacognition',
      ],
    };
  }

  if (isTechCyber) {
    return {
      perspective: 'tech_cybersecurity',
      title: 'Tech Architecture & Cybersecurity Audit Report',
      subtitle: 'รายงานตรวจสอบสถาปัตยกรรมเทคโนโลยี ความปลอดภัยไซเบอร์ และ SLA Performance',
      badgeColor: 'purple',
      reasoning: 'ตรวจพบโจทย์วิเคราะห์ระบบเทคโนโลยี สถาปัตยกรรมซอฟต์แวร์ หรือความปลอดภัยไซเบอร์',
      confidenceScore: 94,
      activeWidgetIds: [
        'pipeline_machine',
        'execution_trace',
        'governance_policies',
        'stage_radar',
        'empirical_benchmark',
      ],
    };
  }

  if (isCommercial) {
    return {
      perspective: 'commercial_marketing',
      title: 'Commercial & Marketing Strategy Report',
      subtitle: 'รายงานกลยุทธ์การตลาด การค้า โอกาสทางธุรกิจ และตัวขับเคลื่อนรายได้',
      badgeColor: 'amber',
      reasoning: 'ตรวจพบโจทย์เชิงการตลาด การเติบโตทางธุรกิจ หรือกลยุทธ์การขาย (Commercial Strategy)',
      confidenceScore: 93,
      activeWidgetIds: [
        'executive_brief',
        'alternative_decisions',
        'decision_graph',
        'bayesian_hypotheses',
      ],
    };
  }

  if (isPublicPolicy) {
    return {
      perspective: 'public_policy',
      title: 'Public Policy & Strategic Impact Report',
      subtitle: 'รายงานประเมินผลกระทบนโยบายภาครัฐ ผลกระทบผู้มีส่วนได้ส่วนเสีย และยุทธศาสตร์องค์กร',
      badgeColor: 'indigo',
      reasoning: 'ตรวจพบโจทย์ยุทธศาสตร์ภาครัฐ ผลกระทบทางสังคม หรือนโยบายสาธารณะ (Public Policy)',
      confidenceScore: 94,
      activeWidgetIds: [
        'executive_brief',
        'governance_policies',
        'contextual_awareness',
        'human_agency',
        'alternative_decisions',
      ],
    };
  }
  if (hasGovernance) {
    return {
      perspective: 'governance_risk',
      title: 'Governance & Risk Assessment Report',
      subtitle: 'รายงานการกำกับดูแล นโยบายความปลอดภัย และมาตรการ Human Agency',
      badgeColor: 'emerald',
      reasoning: 'ตรวจพบนโยบาย Governance, ค่าระดับความเสี่ยง Risk Domain หรือคำถามกำกับดูแลนโยบาย',
      confidenceScore: 94,
      activeWidgetIds: [
        'executive_brief',
        'governance_policies',
        'human_agency',
        'metacognition',
        'stage_radar',
      ],
    };
  }

  if (hasDecisionOptions) {
    return {
      perspective: 'strategic_decision',
      title: 'Strategic Decision & Trade-offs Report',
      subtitle: 'รายงานทางเลือกยุทธศาสตร์ วิเคราะห์ข้อดี-ข้อเสีย และ Decision Graph',
      badgeColor: 'amber',
      reasoning: 'ตรวจพบชุดทางเลือกเปรียบเทียบ (Alternative Decisions), Decision Graph หรือคำถามตัดสินใจเชิงกลยุทธ์',
      confidenceScore: 92,
      activeWidgetIds: [
        'executive_brief',
        'alternative_decisions',
        'decision_graph',
        'bayesian_hypotheses',
        'confidence_calibration',
      ],
    };
  }

  if (hasDeepEvidence) {
    return {
      perspective: 'evidence_investigation',
      title: 'Evidence Investigation & Knowledge Report',
      subtitle: 'รายงานการสืบเจาะหลักฐาน คะแนนการสนับสนุน-ขัดแย้ง และ Knowledge Graph',
      badgeColor: 'purple',
      reasoning: 'ตรวจพบข้อมูลคลังหลักฐาน (Evidence Explorer) และความสัมพันธ์ใน Knowledge Graph หนาแน่น',
      confidenceScore: 90,
      activeWidgetIds: [
        'executive_brief',
        'evidence_explorer',
        'knowledge_graph',
        'ranked_memories',
        'bayesian_hypotheses',
      ],
    };
  }

  if (hasDiagnostics) {
    return {
      perspective: 'diagnostic_calibration',
      title: 'Cognitive Diagnostic & Calibration Report',
      subtitle: 'รายงานการวินิจฉัยตรรกะ การประเมินความมั่นใจ และ Diagnostic Test Suite',
      badgeColor: 'sky',
      reasoning: 'ตรวจพบสมการ Confidence Calibration, การประเมินความไม่แน่นอน และผลการทดสอบ Diagnostic Test Suite',
      confidenceScore: 89,
      activeWidgetIds: [
        'executive_brief',
        'confidence_calibration',
        'metacognition',
        'empirical_benchmark',
        'stage_radar',
      ],
    };
  }

  if (hasTechnicalPipeline) {
    return {
      perspective: 'technical_pipeline',
      title: 'Technical Pipeline & Architecture Audit',
      subtitle: 'รายงานสถาปัตยกรรม Cognitive Pipeline Machine บันทึก Trace ราย Millisecond',
      badgeColor: 'amber',
      reasoning: 'คำถามเน้นการวิเคราะห์เชิงเทคนิค Trace การประมวลผล หรือความเร็ว Pipeline Machine',
      confidenceScore: 91,
      activeWidgetIds: [
        'pipeline_machine',
        'stage_radar',
        'execution_trace',
        'governance_policies',
      ],
    };
  }

  // Default Executive Briefing for general queries
  return {
    perspective: 'executive',
    title: 'Executive Decision Briefing',
    subtitle: 'สรุปสถานการณ์ความเสี่ยง ความเชื่อมั่น และข้อเสนอแนะเชิงยุทธศาสตร์',
    badgeColor: 'amber',
    reasoning: 'วิเคราะห์บริบททั่วไป เหมาะสมสำหรับการนำเสนอผู้บริหารแบบตรงประเด็น',
    confidenceScore: 88,
    activeWidgetIds: [
      'executive_brief',
      'alternative_decisions',
      'bayesian_hypotheses',
      'stage_radar',
    ],
  };
}
