
/**
 * Intent Classification for FIRE KEEPER Adaptive Reasoning Architecture.
 * Determines the complexity and intent of the user query to gate the PCA pipeline.
 */

export type IntentType = 
  | 'GREETING'           // Casual talk, "hello", "thank you"
  | 'SIMPLE_QUERY'       // Direct factual question, "what time is it", "who is X"
  | 'NORMAL_QUERY'       // Standard question requiring some thought
  | 'DECISION_SUPPORT'   // Question requiring comparison or decision help
  | 'COMPLEX'            // High risk, high uncertainty, or deeply complex analysis
  | 'META_INQUIRY'       // User auditing the system, trace, or reasoning
  | 'DOCUMENT_ANALYSIS' // Specific analysis of provided documents
  | 'PHILOSOPHICAL_ANALYSIS'; // Non-operational philosophy, ethics, metaphysics, or thought experiments

export interface IntentClassification {
  type: IntentType;
  reason: string;
  confidence: number;
}

const GREETING_REGEX = /^(สวัสดี|หวัดดี|hello|hi|hey|ขอบคุณ|thank you|ok|โอเค|เป็นไงบ้าง|สบายดีไหม|how are you|good morning|good afternoon|good evening|bye|ลาก่อน|สวัสดีครับ|สวัสดีค่ะ|ขอบคุณครับ|ขอบคุณค่ะ|หวัดดีครับ|หวัดดีค่ะ|hi there|hello there|thx|thanks)$/i;
const CASUAL_KEYWORDS = /^(ขอบคุณ|โอเค|ok|thanks|รับทราบ|เข้าใจแล้ว|ดีมาก|เยี่ยม|ขอบคุณมาก|ขอบใจ)$/i;

export function classifyIntent(query: string): IntentClassification {
  const q = query.trim().toLowerCase();
  
  // 1. META-INQUIRY GATE (High Priority)
  const isMeta = /\b(trace|reasoning|stages|runtime|classification|self-analysis)\b|(\b(?:audit|inspect|review)\b.*\b(?:trace|runtime|reasoning|pipeline|behavior)\b)|(ตรวจสอบ.*trace|วิเคราะห์.*ระบบ(?:ของคุณ|ตัวเอง)|ทำไม.*(?:คุณ|ระบบ).*ตอบ|ความมั่นใจ.*(?:ของคุณ|ระบบ)|ขั้นตอน.*คิด|สถาปัตยกรรม.*ตัวเอง|ดู.*trace|ขอดู.*trace|audit.*trace)/i.test(q);
  if (isMeta) {
    return { type: 'META_INQUIRY', reason: 'User is auditing the system runtime, trace, or reasoning behavior.', confidence: 0.95 };
  }

  // 2. DOCUMENT ANALYSIS GATE
  const isDocAnalysis = /\b(document|pdf|file|attachment|conflict|contradiction|summarize.*doc)\b|(เอกสาร|ไฟล์|ข้อความ.*แนบ|สรุป.*เอกสาร|วิเคราะห์.*เอกสาร|ขัดแย้ง|ข้อมูล.*แหล่ง)/i.test(q);
  if (isDocAnalysis) {
    return { type: 'DOCUMENT_ANALYSIS', reason: 'User is requesting analysis of a specific document or attachment.', confidence: 0.9 };
  }

  // 3. GREETING / CASUAL GATE
  if (GREETING_REGEX.test(q) || CASUAL_KEYWORDS.test(q) || q.length < 5) {
    if (!q.includes('?') && !q.includes('ช่วย') && !q.includes('ทำไม') && !q.includes('อย่างไร') && !q.includes('คืออะไร')) {
      return { type: 'GREETING', reason: 'Detected as greeting or casual affirmation based on regex and length.', confidence: 0.95 };
    }
  }

  // 4. NON-OPERATIONAL PHILOSOPHY GATE
  // A hypothetical or philosophical question may contain words such as "should",
  // "decision", money, harm, or risk. Those words describe the thought experiment,
  // not a real-world action. Route these queries before the decision gate so
  // Governance does not manufacture an approval workflow around a fictional scenario.
  const isPhilosophical = /(?:ปรัชญา|เชิงปรัชญา|อภิปรัชญา|จริยธรรม|ศีลธรรม|ตัวตน|จิตสำนึก|ความเป็นมนุษย์|ความจริงคืออะไร|การมีอยู่|ทดลองทางความคิด|โจทย์สมมติ|สถานการณ์สมมติ|กรณีสมมติ|ถ้าสมมติ|สมมติว่า|สมมติให้|ถ้าคุณต้องเลือก|ถ้าต้องเลือก)|\b(?:philosophy|philosophical|metaphysics|ethics|ethical|morality|moral|identity|consciousness|thought experiment|hypothetical|fictional scenario|if you had to choose|trolley problem|fading qualia|teletransportation)\b/i.test(q);
  if (isPhilosophical) {
    return { type: 'PHILOSOPHICAL_ANALYSIS', reason: 'Detected a non-operational philosophical or hypothetical reasoning context; real-world decision governance is not activated.', confidence: 0.93 };
  }

  // 5. DECISION SUPPORT GATE
  // Informational comparison, price/trend lookup, market topics, and evidence-gathering
  // are not decisions by themselves. Require explicit choice/recommendation/action intent.
  const evidenceGatheringOnly = /(?:ข้อมูล|หลักฐาน|สิ่ง|ประเด็น)ที่ควร(?:ตรวจสอบ|เก็บ|หา|ยืนยัน)|ควร(?:ตรวจสอบ|เก็บข้อมูล|หาข้อมูล|ยืนยันข้อมูล|วิเคราะห์|พิจารณาข้อมูล)/i.test(q);
  const isDecision = !evidenceGatheringOnly && /\b(should (?:i|we) (?:choose|buy|sell|invest|approve|proceed)|choose|select|recommend|decide|decision)\b|(ช่วย(?:ฉัน|ผม|เรา)?(?:เลือก|ตัดสินใจ)|ควร(?:เลือก|ซื้อ|ขาย|ลงทุน|อนุมัติ|ดำเนินการ|ทำอะไร)|แนะนำ(?:ว่า)?(?:ควร)?(?:เลือก|ซื้อ|ขาย|ลงทุน|ดำเนินการ)|ตัดสินใจ|อนุมัติ|เหมาะกว่า|ไหนดี|อันไหนดี|ดีกว่ากัน)/i.test(q);
  if (isDecision) {
    return { type: 'DECISION_SUPPORT', reason: 'Detected explicit choice, recommendation, approval, or action intent.', confidence: 0.9 };
  }

  // 6. COMPLEX GATE
  // Complexity must not erase an explicit decision signal. A decision can still
  // receive deep runtime controls after being classified as DECISION_SUPPORT.
  const isComplex = /\b(risk|hazard|danger|critical|complex|security|legal|policy|audit|architect|framework|evaluate|assess|analyze|impact|future)\b|(ความเสี่ยง|อันตราย|วิกฤต|ซับซ้อน|กฎหมาย|นโยบาย|ประเมิน|ตรวจสอบ|สถาปัตยกรรม|วิพากษ์|วิเคราะห์|ผลกระทบ|อนาคต)/i.test(q);
  if (isComplex || q.length > 150) {
    return { type: 'COMPLEX', reason: 'Detected high-complexity domain keywords or significant input length.', confidence: 0.85 };
  }

  // 7. SIMPLE vs NORMAL
  // Broad topics are NORMAL
  const isBroadTopic = /ประวัติศาสตร์|เรื่องราว|รายละเอียด|สรุป|อธิบาย|วิวัฒนาการ|ความหมาย/i.test(q);
  if (isBroadTopic) {
    return { type: 'NORMAL_QUERY', reason: 'Detected broad topic markers requiring descriptive response.', confidence: 0.8 };
  }

  // Simple queries are usually short and factual
  if (q.length < 30 && !q.includes('เพราะอะไร') && !q.includes('วิเคราะห์')) {
    return { type: 'SIMPLE_QUERY', reason: 'Short query length and absence of analytical markers.', confidence: 0.8 };
  }

  return { type: 'NORMAL_QUERY', reason: 'Standard informational or operational query.', confidence: 0.7 };
}
