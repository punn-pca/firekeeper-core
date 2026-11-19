export type InquiryType =
  | 'EMPIRICAL'
  | 'FACTUAL'
  | 'NORMATIVE'
  | 'CONCEPTUAL'
  | 'METAPHYSICAL'
  | 'HYPOTHETICAL'
  | 'CREATIVE';

export interface InquiryClassification {
  type: InquiryType;
  reasoningMode: 'EVIDENCE_BASED' | 'DIALECTICAL' | 'NORMATIVE_ANALYSIS' | 'CREATIVE';
  evidenceRequiredForInitialReasoning: boolean;
  competingPositionsRequired: boolean;
  premiseTreatment: 'VERIFY' | 'ASSUME_FOR_ANALYSIS' | 'INTERPRET';
  rationale: string;
}

const HYPOTHETICAL_CUES = /\b(if|suppose|imagine|what if|assuming|hypothetically)\b|(?:ถ้า|หาก|สมมติว่า|สมมติให้|ในกรณีที่|จินตนาการว่า)/i;
const METAPHYSICAL_CUES = /\b(metaphysic|reality|existence|being|consciousness|identity|free will|truth|reality-in-itself|mind|observer|universe|causality)\b|(?:อภิปรัชญา|ความจริง|ความมีอยู่|การดำรงอยู่|จิตสำนึก|ตัวตน|เจตจำนงเสรี|ความเป็นจริง|ความจริงในตัวมันเอง|ผู้สังเกต|จักรวาล|เหตุปัจจัย|ภววิทยา|ญาณวิทยา)/i;
const CONCEPTUAL_CUES = /\b(meaning|concept|definition|knowledge|understand|interpretation|philosoph|ethical|moral|justice|value)\b|(?:ความหมาย|แนวคิด|นิยาม|ความรู้|เข้าใจ|ตีความ|ปรัชญา|จริยธรรม|ศีลธรรม|ความยุติธรรม|คุณค่า)/i;
const NORMATIVE_CUES = /\b(should|ought|right or wrong|ethical|morally|justice|fairness)\b|(?:ควร|ผิดหรือถูก|ถูกต้องหรือไม่|จริยธรรม|ศีลธรรม|ความยุติธรรม|เป็นธรรมหรือไม่)/i;
const CREATIVE_CUES = /\b(write a story|compose|brainstorm|invent|fictional|creative)\b|(?:แต่งเรื่อง|เขียนนิยาย|ระดมความคิด|คิดพล็อต|สร้างเรื่องสมมติ)/i;

/**
 * Classifies the epistemic task, not whether the user's premise is factually true.
 * Non-empirical inquiries may be reasoned about without external evidence; this
 * never upgrades their premises or conclusions to verified facts.
 */
export function classifyInquiry(question: string): InquiryClassification {
  const q = String(question || '').trim();
  const hypothetical = HYPOTHETICAL_CUES.test(q);
  const metaphysical = METAPHYSICAL_CUES.test(q);
  const conceptual = CONCEPTUAL_CUES.test(q);
  if (CREATIVE_CUES.test(q)) {
    return { type: 'CREATIVE', reasoningMode: 'CREATIVE', evidenceRequiredForInitialReasoning: false, competingPositionsRequired: false, premiseTreatment: 'INTERPRET', rationale: 'Creative task; external verification is not a prerequisite.' };
  }
  if (hypothetical && (metaphysical || conceptual)) {
    return { type: 'HYPOTHETICAL', reasoningMode: 'DIALECTICAL', evidenceRequiredForInitialReasoning: false, competingPositionsRequired: true, premiseTreatment: 'ASSUME_FOR_ANALYSIS', rationale: 'Treat the stated hypothetical as a conditional premise and compare plausible interpretations without asserting it as fact.' };
  }
  if (metaphysical) {
    return { type: 'METAPHYSICAL', reasoningMode: 'DIALECTICAL', evidenceRequiredForInitialReasoning: false, competingPositionsRequired: true, premiseTreatment: 'INTERPRET', rationale: 'Analyze competing philosophical positions; empirical evidence may inform but cannot by itself settle metaphysical correspondence.' };
  }
  if (conceptual) {
    return { type: 'CONCEPTUAL', reasoningMode: 'DIALECTICAL', evidenceRequiredForInitialReasoning: false, competingPositionsRequired: true, premiseTreatment: 'INTERPRET', rationale: 'Clarify concepts, assumptions, competing definitions, and counterarguments.' };
  }
  // A direct request to choose/decide is decision support, not a standalone normative inquiry.
  // Leave it to inferQueryType so existing decision-support routing remains intact.
  const explicitDecisionIntent = /\b(?:should (?:i|we) (?:choose|buy|sell|invest|approve|proceed)|help (?:me|us) choose|decide (?:between|whether|what to)|recommend (?:which|whether)|compare .{1,100} to choose)\b|(?:ช่วย(?:ฉัน|ผม|เรา)?(?:เลือก|ตัดสินใจ)|(?:จะ|อยาก|ต้องการ)?เลือก(?:ทำอะไร|งานอะไร|อาชีพอะไร|สายงานอะไร|ทางไหน)|ควร(?:เลือก|ซื้อ|ขาย|ลงทุน|อนุมัติ|ดำเนินการ|ทำอะไร)|แนะนำ(?:ว่า)?(?:ควร)?(?:เลือก|ซื้อ|ขาย|ลงทุน|ดำเนินการ)|ตัดสินใจ|อนุมัติ|ทำงานอะไรดี|อาชีพอะไรดี|เลือกอะไรดี|เพื่อเลือก)/i.test(q);
  if (NORMATIVE_CUES.test(q) && !explicitDecisionIntent) {
    return { type: 'NORMATIVE', reasoningMode: 'NORMATIVE_ANALYSIS', evidenceRequiredForInitialReasoning: false, competingPositionsRequired: true, premiseTreatment: 'INTERPRET', rationale: 'Separate value premises from factual claims; compare ethical frameworks and consequences.' };
  }
  return { type: 'EMPIRICAL', reasoningMode: 'EVIDENCE_BASED', evidenceRequiredForInitialReasoning: true, competingPositionsRequired: false, premiseTreatment: 'VERIFY', rationale: 'Factual claims require appropriate evidence and verification.' };
}
