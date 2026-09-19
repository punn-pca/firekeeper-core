/**
 * Taxonomy Design Tokens & Styling for FIRE KEEPER Android
 * Matches firekeeper.site web taxonomy architecture exactly.
 */

export interface TaxonomyMeta {
  type: string;
  label: string;
  name: string;
  thLabel: string;
  pillar: 'KNOWN' | 'DERIVED' | 'UNCERTAIN' | 'LIMITS';
  textColor: string;
  bgColor: string;
  borderColor: string;
}

export const TAXONOMY_MAP: Record<string, TaxonomyMeta> = {
  FACT: {
    type: 'FACT',
    label: '[FACT]',
    name: 'FACT',
    thLabel: 'ข้อเท็จจริง',
    pillar: 'KNOWN',
    textColor: '#34D399',
    bgColor: '#10B98126',
    borderColor: '#10B98159',
  },
  EVIDENCE: {
    type: 'EVIDENCE',
    label: '[EVIDENCE]',
    name: 'EVIDENCE',
    thLabel: 'หลักฐานเชิงประจักษ์',
    pillar: 'KNOWN',
    textColor: '#60A5FA',
    bgColor: '#3B82F626',
    borderColor: '#3B82F659',
  },
  USER_CLAIM: {
    type: 'USER_CLAIM',
    label: '[USER_CLAIM]',
    name: 'USER_CLAIM',
    thLabel: 'ข้อกล่าวอ้างจากผู้ใช้',
    pillar: 'KNOWN',
    textColor: '#FB923C',
    bgColor: '#F9731626',
    borderColor: '#F9731659',
  },
  'USER CLAIM': {
    type: 'USER_CLAIM',
    label: '[USER_CLAIM]',
    name: 'USER_CLAIM',
    thLabel: 'ข้อกล่าวอ้างจากผู้ใช้',
    pillar: 'KNOWN',
    textColor: '#FB923C',
    bgColor: '#F9731626',
    borderColor: '#F9731659',
  },
  MODEL_KNOWLEDGE: {
    type: 'MODEL_KNOWLEDGE',
    label: '[MODEL_KNOWLEDGE]',
    name: 'MODEL_KNOWLEDGE',
    thLabel: 'ความรู้จากการเทรน',
    pillar: 'KNOWN',
    textColor: '#94A3B8',
    bgColor: '#64748B26',
    borderColor: '#64748B59',
  },
  UNVERIFIED: {
    type: 'UNVERIFIED',
    label: '[UNVERIFIED]',
    name: 'UNVERIFIED',
    thLabel: 'ยังไม่ยืนยัน',
    pillar: 'KNOWN',
    textColor: '#FB7185',
    bgColor: '#E11D4826',
    borderColor: '#E11D4859',
  },
  INFERENCE: {
    type: 'INFERENCE',
    label: '[INFERENCE]',
    name: 'INFERENCE',
    thLabel: 'ข้ออนุมานเชิงตรรกะ',
    pillar: 'DERIVED',
    textColor: '#C084FC',
    bgColor: '#A855F726',
    borderColor: '#A855F759',
  },
  HYPOTHESIS: {
    type: 'HYPOTHESIS',
    label: '[HYPOTHESIS]',
    name: 'HYPOTHESIS',
    thLabel: 'สมมติฐานทางเลือก',
    pillar: 'DERIVED',
    textColor: '#67E8F9',
    bgColor: '#06B6D426',
    borderColor: '#06B6D459',
  },
  ESTIMATE: {
    type: 'ESTIMATE',
    label: '[ESTIMATE]',
    name: 'ESTIMATE',
    thLabel: 'ประมาณการ',
    pillar: 'DERIVED',
    textColor: '#FDE047',
    bgColor: '#EAB30826',
    borderColor: '#EAB30859',
  },
  SCENARIO: {
    type: 'SCENARIO',
    label: '[SCENARIO]',
    name: 'SCENARIO',
    thLabel: 'ฉากทัศน์จำลอง',
    pillar: 'DERIVED',
    textColor: '#A5B4FC',
    bgColor: '#6366F126',
    borderColor: '#6366F159',
  },
  UNCERTAINTY: {
    type: 'UNCERTAINTY',
    label: '[UNCERTAINTY]',
    name: 'UNCERTAINTY',
    thLabel: 'ความไม่แน่นอน',
    pillar: 'UNCERTAIN',
    textColor: '#F87171',
    bgColor: '#EF444426',
    borderColor: '#EF444459',
  },
  UNKNOWN: {
    type: 'UNKNOWN',
    label: '[UNKNOWN]',
    name: 'UNKNOWN',
    thLabel: 'ช่องว่างข้อมูล',
    pillar: 'UNCERTAIN',
    textColor: '#CBD5E1',
    bgColor: '#64748B26',
    borderColor: '#64748B59',
  },
  CONTRADICTION: {
    type: 'CONTRADICTION',
    label: '[CONTRADICTION]',
    name: 'CONTRADICTION',
    thLabel: 'ข้อขัดแย้ง',
    pillar: 'UNCERTAIN',
    textColor: '#FB923C',
    bgColor: '#EA580C26',
    borderColor: '#EA580C59',
  },
  ASSUMPTION: {
    type: 'ASSUMPTION',
    label: '[ASSUMPTION]',
    name: 'ASSUMPTION',
    thLabel: 'ข้อตกลงเบื้องต้น',
    pillar: 'LIMITS',
    textColor: '#FBBF24',
    bgColor: '#F59E0B26',
    borderColor: '#F59E0B59',
  },
  CONSTRAINT: {
    type: 'CONSTRAINT',
    label: '[CONSTRAINT]',
    name: 'CONSTRAINT',
    thLabel: 'เงื่อนไขและข้อจำกัด',
    pillar: 'LIMITS',
    textColor: '#E879F9',
    bgColor: '#A855F726',
    borderColor: '#A855F759',
  },
  TRADE_OFF: {
    type: 'TRADE_OFF',
    label: '[TRADE_OFF]',
    name: 'TRADE_OFF',
    thLabel: 'ข้อแลกเปลี่ยน',
    pillar: 'LIMITS',
    textColor: '#F9A8D4',
    bgColor: '#EC489926',
    borderColor: '#EC489959',
  },
  'TRADE-OFF': {
    type: 'TRADE_OFF',
    label: '[TRADE_OFF]',
    name: 'TRADE_OFF',
    thLabel: 'ข้อแลกเปลี่ยน',
    pillar: 'LIMITS',
    textColor: '#F9A8D4',
    bgColor: '#EC489926',
    borderColor: '#EC489959',
  },
  DECISION_GAP: {
    type: 'DECISION_GAP',
    label: '[DECISION_GAP]',
    name: 'DECISION_GAP',
    thLabel: 'ช่องว่างการตัดสินใจ',
    pillar: 'LIMITS',
    textColor: '#FB7185',
    bgColor: '#F43F5E26',
    borderColor: '#F43F5E59',
  },
  'DECISION GAP': {
    type: 'DECISION_GAP',
    label: '[DECISION_GAP]',
    name: 'DECISION_GAP',
    thLabel: 'ช่องว่างการตัดสินใจ',
    pillar: 'LIMITS',
    textColor: '#FB7185',
    bgColor: '#F43F5E26',
    borderColor: '#F43F5E59',
  },
};

export function normalizeTaxonomy(raw: string): TaxonomyMeta | null {
  if (!raw) return null;
  const clean = raw.replace(/[\[\]]/g, '').trim().toUpperCase();
  if (TAXONOMY_MAP[clean]) return TAXONOMY_MAP[clean];
  
  if (clean.startsWith('FACT')) return TAXONOMY_MAP.FACT;
  if (clean.includes('CLAIM')) return TAXONOMY_MAP.USER_CLAIM;
  if (clean.includes('EVIDENCE')) return TAXONOMY_MAP.EVIDENCE;
  if (clean.startsWith('INFERENCE')) return TAXONOMY_MAP.INFERENCE;
  if (clean.startsWith('ASSUMPTION')) return TAXONOMY_MAP.ASSUMPTION;
  if (clean.startsWith('CONSTRAINT')) return TAXONOMY_MAP.CONSTRAINT;
  if (clean.startsWith('HYPOTHESIS')) return TAXONOMY_MAP.HYPOTHESIS;
  if (clean.startsWith('UNCERTAIN')) return TAXONOMY_MAP.UNCERTAINTY;
  if (clean.startsWith('UNKNOWN')) return TAXONOMY_MAP.UNKNOWN;
  if (clean.startsWith('CONTRADICT')) return TAXONOMY_MAP.CONTRADICTION;
  if (clean.startsWith('ESTIMATE')) return TAXONOMY_MAP.ESTIMATE;
  if (clean.startsWith('SCENARIO')) return TAXONOMY_MAP.SCENARIO;
  if (clean.includes('TRADE') && clean.includes('OFF')) return TAXONOMY_MAP.TRADE_OFF;
  if (clean.includes('GAP')) return TAXONOMY_MAP.DECISION_GAP;

  return null;
}
