
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
  | 'DOCUMENT_ANALYSIS'; // Specific analysis of provided documents

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
  const isMeta = /\b(trace|reasoning|stages|runtime|classification|evidence|confidence|behavior|audit|self-analysis|pipeline)\b|(ตรวจสอบ.*trace|วิเคราะห์.*ระบบ|ทำไม.*ตอบ|ความมั่นใจ|ขั้นตอน.*คิด|สถาปัตยกรรม.*ตัวเอง|ดู.*trace)/i.test(q);
  if (isMeta && (q.includes('firekeeper') || q.includes('system') || q.includes('your') || q.includes('ตัวเอง') || q.includes('ระบบ'))) {
    return { type: 'META_INQUIRY', reason: 'User is auditing the system runtime, trace, or reasoning behavior.', confidence: 0.95 };
  }

  // 2. DOCUMENT ANALYSIS GATE
  const isDocAnalysis = /\b(document|pdf|file|attachment|conflict|contradiction|summarize.*doc)\b|(เอกสาร|ไฟล์|ข้อความ.*แนบ|สรุป.*เอกสาร|วิเคราะห์.*เอกสาร|ขัดแย้ง)/i.test(q);
  if (isDocAnalysis && (q.includes('เอกสาร') || q.includes('ไฟล์') || q.includes('this doc') || q.includes('attachment'))) {
    return { type: 'DOCUMENT_ANALYSIS', reason: 'User is requesting analysis of a specific document or attachment.', confidence: 0.9 };
  }

  // 3. GREETING / CASUAL GATE
  if (GREETING_REGEX.test(q) || CASUAL_KEYWORDS.test(q) || q.length < 5) {
    if (!q.includes('?') && !q.includes('ช่วย') && !q.includes('ทำไม') && !q.includes('อย่างไร')) {
      return { type: 'GREETING', reason: 'Detected as greeting or casual affirmation based on regex and length.', confidence: 0.95 };
    }
  }

  // 4. DECISION SUPPORT GATE
  const isDecision = /\b(should|choose|select|recommend|decision|decide|which|versus|compare|trade.?off|vs)\b|(เลือก|ควร|เปรียบเทียบ|ตัดสินใจ|เหมาะกว่า|ไหนดี|อันไหนดี|ดีกว่ากัน|ข้อดีข้อเสีย)/i.test(q);
  if (isDecision) {
    return { type: 'DECISION_SUPPORT', reason: 'Detected decision-making keywords or comparative structures.', confidence: 0.9 };
  }

  // 5. COMPLEX GATE
  const isComplex = /\b(risk|hazard|danger|critical|complex|security|legal|policy|audit|architect|framework|evaluate|assess)\b|(ความเสี่ยง|อันตราย|วิกฤต|ซับซ้อน|กฎหมาย|นโยบาย|ประเมิน|ตรวจสอบ|สถาปัตยกรรม|วิพากษ์)/i.test(q);
  if (isComplex || q.length > 300) {
    return { type: 'COMPLEX', reason: 'Detected high-complexity domain keywords or significant input length.', confidence: 0.85 };
  }

  // 6. SIMPLE vs NORMAL
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
