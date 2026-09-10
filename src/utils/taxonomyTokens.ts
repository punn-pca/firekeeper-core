/**
 * Shared Information Taxonomy Design Tokens & Utility for FIRE KEEPER
 * 
 * Standard 14-Primary Taxonomy Architecture organized into 4 Epistemic Pillars:
 * 
 * 1. WHAT IS KNOWN (สิ่งที่ทราบ / ยืนยันแล้ว):
 *    - [FACT]             = Emerald     (#34D399 dark / #047857 light)
 *    - [EVIDENCE]         = Blue        (#60A5FA dark / #1D4ED8 light)
 *    - [USER_CLAIM]       = Orange      (#FB923C dark / #C2410C light)
 *    - (Internal: MODEL_KNOWLEDGE, UNVERIFIED)
 * 
 * 2. WHAT IS DERIVED (สิ่งที่อนุมาน / ประเมินผล):
 *    - [INFERENCE]        = Purple      (#C084FC dark / #7E22CE light)
 *    - [HYPOTHESIS]       = Cyan        (#67E8F9 dark / #0E7490 light)
 *    - [ESTIMATE]         = Yellow      (#FDE047 dark / #854D0E light)
 *    - [SCENARIO]         = Indigo      (#A5B4FC dark / #4338CA light)
 * 
 * 3. WHAT IS UNCERTAIN (สิ่งที่ไม่แน่นอน / มีความขัดแย้ง):
 *    - [UNCERTAINTY]      = Red         (#F87171 dark / #B91C1C light)
 *    - [UNKNOWN]          = Gray        (#CBD5E1 dark / #475569 light)
 *    - [CONTRADICTION]    = Vermilion   (#FB923C dark / #C2410C light)
 * 
 * 4. WHAT LIMITS THE DECISION (สิ่งที่จำกัดหรือกำหนดกรอบการตัดสินใจ):
 *    - [ASSUMPTION]       = Amber       (#FBBF24 dark / #92400E light)
 *    - [CONSTRAINT]       = Violet/Teal (#C084FC dark / #7E22CE light)
 *    - [TRADE_OFF]        = Pink        (#F9A8D4 dark / #BE185D light)
 *    - [DECISION_GAP]     = Crimson     (#FB7185 dark / #BE123C light)
 */

export const PRIMARY_TAXONOMY_TAGS = [
  'FACT',
  'EVIDENCE',
  'USER_CLAIM',
  'INFERENCE',
  'ASSUMPTION',
  'UNCERTAINTY',
  'HYPOTHESIS',
  'UNKNOWN',
  'CONTRADICTION',
  'CONSTRAINT',
  'DECISION_GAP',
  'TRADE_OFF',
  'SCENARIO',
  'ESTIMATE',
] as const;

export type PrimaryTaxonomyTag = typeof PRIMARY_TAXONOMY_TAGS[number];

/**
 * Secondary tags with high decision relevance that are permitted to accompany a primary tag (max 2 total).
 */
export const DECISION_SIGNIFICANT_TAGS = new Set<string>([
  'CONTRADICTION',
  'DECISION_GAP',
  'CONSTRAINT',
  'TRADE_OFF',
  'UNCERTAINTY',
  'UNKNOWN',
  'ASSUMPTION',
]);

export type InformationTaxonomyType =
  | 'FACT'
  | 'USER CLAIM'
  | 'USER_CLAIM'
  | 'EVIDENCE'
  | 'INFERENCE'
  | 'ASSUMPTION'
  | 'UNCERTAINTY'
  | 'HYPOTHESIS'
  | 'UNKNOWN'
  | 'SCENARIO'
  | 'ESTIMATE'
  | 'TRADE-OFF'
  | 'TRADE_OFF'
  | 'DECISION GAP'
  | 'DECISION_GAP'
  | 'MODEL_KNOWLEDGE'
  | 'UNVERIFIED'
  | 'CONTRADICTION'
  | 'CONSTRAINT';

export type TaxonomyPillar =
  | 'WHAT IS KNOWN'
  | 'WHAT IS DERIVED'
  | 'WHAT IS UNCERTAIN'
  | 'WHAT LIMITS THE DECISION';

export interface TaxonomyPillarMeta {
  id: TaxonomyPillar;
  titleEn: string;
  titleTh: string;
  description: string;
  iconName: string;
  badgeClass: string;
}

export const TAXONOMY_PILLARS: Record<TaxonomyPillar, TaxonomyPillarMeta> = {
  'WHAT IS KNOWN': {
    id: 'WHAT IS KNOWN',
    titleEn: 'WHAT IS KNOWN',
    titleTh: 'สิ่งที่ทราบ / มีหลักฐานยืนยัน',
    description: 'ข้อมูล ข้อเท็จจริง หลักฐาน และข้อกล่าวอ้างที่ถูกตรวจทานหรือระบุสถานะความถูกต้องอย่างชัดเจน',
    iconName: 'ShieldCheck',
    badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  'WHAT IS DERIVED': {
    id: 'WHAT IS DERIVED',
    titleEn: 'WHAT IS DERIVED',
    titleTh: 'สิ่งที่อนุมาน / สังเคราะห์ผล',
    description: 'ข้อสรุป ผลการวิเคราะห์ สมมติฐาน ฉากทัศน์จำลอง และการประมาณการที่ต่อยอดจากข้อมูลเชิงตรรกะ',
    iconName: 'BrainCircuit',
    badgeClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  'WHAT IS UNCERTAIN': {
    id: 'WHAT IS UNCERTAIN',
    titleEn: 'WHAT IS UNCERTAIN',
    titleTh: 'สิ่งที่ไม่แน่นอน / มีความขัดแย้ง',
    description: 'จุดที่ยังขาดข้อมูล ความเสี่ยง ความแปรปรวน หรือมีข้อมูลสองแหล่งขึ้นไปที่ขัดแย้งกันเอง (Contradiction)',
    iconName: 'AlertTriangle',
    badgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  },
  'WHAT LIMITS THE DECISION': {
    id: 'WHAT LIMITS THE DECISION',
    titleEn: 'WHAT LIMITS THE DECISION',
    titleTh: 'สิ่งที่กำหนดกรอบการตัดสินใจ',
    description: 'เงื่อนไขภาคบังคับ (Constraints), สมมติฐานตั้งต้น, ข้อแลกเปลี่ยนได้เสีย (Trade-offs) และช่องว่างสำคัญ (Decision Gaps)',
    iconName: 'Scale',
    badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
};

export type TaxonomyColorName =
  | 'emerald'
  | 'orange'
  | 'blue'
  | 'purple'
  | 'amber'
  | 'red'
  | 'cyan'
  | 'gray'
  | 'indigo'
  | 'yellow'
  | 'pink'
  | 'crimson'
  | 'slate'
  | 'rose'
  | 'vermilion'
  | 'violet';

export interface TaxonomyMeta {
  type: InformationTaxonomyType;
  label: string;
  name: string;
  thLabel: string;
  description: string;
  pillar: TaxonomyPillar;
  colorName: TaxonomyColorName;
  badgeClass: string;
  textClass: string;
  hex: {
    darkText: string;
    darkBg: string;
    darkBorder: string;
    lightText: string;
    lightBg: string;
    lightBorder: string;
  };
}

export const INFORMATION_TAXONOMY_MAP: Record<string, TaxonomyMeta> = {
  // ─── 1. WHAT IS KNOWN ──────────────────────────────────────────
  FACT: {
    type: 'FACT',
    label: '[FACT]',
    name: 'FACT',
    thLabel: 'ข้อเท็จจริง',
    description: 'ข้อเท็จจริงประจักษ์พยานที่ยืนยันได้อย่างสมบูรณ์ มีหลักฐานตรงกับระบบความจำหรืออินพุตของผู้ใช้โดยตรง',
    pillar: 'WHAT IS KNOWN',
    colorName: 'emerald',
    badgeClass: 'taxonomy-badge taxonomy-badge-fact',
    textClass: 'taxonomy-text-fact',
    hex: {
      darkText: '#34D399',
      darkBg: '#10B98126',
      darkBorder: '#10B98159',
      lightText: '#047857',
      lightBg: '#D1FAE5',
      lightBorder: '#6EE7B7',
    },
  },
  EVIDENCE: {
    type: 'EVIDENCE',
    label: '[EVIDENCE]',
    name: 'EVIDENCE',
    thLabel: 'หลักฐานเชิงประจักษ์',
    description: 'หลักฐาน แหล่งข้อมูลอ้างอิง หรือสารสนเทศสด (Real-time Retrieval) ที่ถูกนำเข้ามาเพื่อประเมินความสอดคล้อง',
    pillar: 'WHAT IS KNOWN',
    colorName: 'blue',
    badgeClass: 'taxonomy-badge taxonomy-badge-evidence',
    textClass: 'taxonomy-text-evidence',
    hex: {
      darkText: '#60A5FA',
      darkBg: '#3B82F626',
      darkBorder: '#3B82F659',
      lightText: '#1D4ED8',
      lightBg: '#DBEAFE',
      lightBorder: '#93C5FD',
    },
  },
  USER_CLAIM: {
    type: 'USER_CLAIM',
    label: '[USER_CLAIM]',
    name: 'USER_CLAIM',
    thLabel: 'ข้อกล่าวอ้างจากผู้ใช้',
    description: 'ข้อกล่าวอ้างหรือสมมติฐานที่ระบุโดยผู้ใช้งาน ซึ่งยังคงรอการสอบทวนและยืนยันน้ำหนักหลักฐาน',
    pillar: 'WHAT IS KNOWN',
    colorName: 'orange',
    badgeClass: 'taxonomy-badge taxonomy-badge-user-claim',
    textClass: 'taxonomy-text-user-claim',
    hex: {
      darkText: '#FB923C',
      darkBg: '#F9731626',
      darkBorder: '#F9731659',
      lightText: '#C2410C',
      lightBg: '#FFEDD5',
      lightBorder: '#FDBA74',
    },
  },
  'USER CLAIM': {
    type: 'USER CLAIM',
    label: '[USER_CLAIM]',
    name: 'USER_CLAIM',
    thLabel: 'ข้อกล่าวอ้างจากผู้ใช้',
    description: 'ข้อกล่าวอ้างหรือสมมติฐานที่ระบุโดยผู้ใช้งาน ซึ่งยังคงรอการสอบทวนและยืนยันน้ำหนักหลักฐาน',
    pillar: 'WHAT IS KNOWN',
    colorName: 'orange',
    badgeClass: 'taxonomy-badge taxonomy-badge-user-claim',
    textClass: 'taxonomy-text-user-claim',
    hex: {
      darkText: '#FB923C',
      darkBg: '#F9731626',
      darkBorder: '#F9731659',
      lightText: '#C2410C',
      lightBg: '#FFEDD5',
      lightBorder: '#FDBA74',
    },
  },
  MODEL_KNOWLEDGE: {
    type: 'MODEL_KNOWLEDGE',
    label: '[MODEL_KNOWLEDGE]',
    name: 'MODEL_KNOWLEDGE',
    thLabel: 'ความรู้จากการเทรน (ก่อน Cutoff)',
    description: 'ข้อมูลจากฐานความรู้เดิมของโมเดล (ประวัติการณ์ก่อน Knowledge Cutoff) ซึ่งไม่สามารถใช้รับรองสถานะปัจจุบันได้หากขาดการสืบค้นสด',
    pillar: 'WHAT IS KNOWN',
    colorName: 'slate',
    badgeClass: 'taxonomy-badge taxonomy-badge-model-knowledge',
    textClass: 'taxonomy-text-model-knowledge',
    hex: {
      darkText: '#94A3B8',
      darkBg: '#64748B26',
      darkBorder: '#64748B59',
      lightText: '#475569',
      lightBg: '#F1F5F9',
      lightBorder: '#CBD5E1',
    },
  },
  UNVERIFIED: {
    type: 'UNVERIFIED',
    label: '[UNVERIFIED]',
    name: 'UNVERIFIED',
    thLabel: 'ยังไม่ได้รับการยืนยันสถานะปัจจุบัน',
    description: 'ข้อกล่าวอ้างสถานะปัจจุบันที่ต้องอาศัยหลักฐานสด แต่ไม่พบแหล่งข้อมูลปัจจุบันที่ผ่านการยืนยัน (ห้ามสรุปเป็น FACT)',
    pillar: 'WHAT IS KNOWN',
    colorName: 'rose',
    badgeClass: 'taxonomy-badge taxonomy-badge-unverified',
    textClass: 'taxonomy-text-unverified',
    hex: {
      darkText: '#FB7185',
      darkBg: '#E11D4826',
      darkBorder: '#E11D4859',
      lightText: '#BE123C',
      lightBg: '#FFE4E6',
      lightBorder: '#FDA4AF',
    },
  },

  // ─── 2. WHAT IS DERIVED ────────────────────────────────────────
  INFERENCE: {
    type: 'INFERENCE',
    label: '[INFERENCE]',
    name: 'INFERENCE',
    thLabel: 'ข้ออนุมานเชิงตรรกะ',
    description: 'การอนุมานอย่างสมเหตุสมผลเชิงตรรกะ จากข้อเท็จจริงที่ปรากฏและสืบค้นได้จริงเท่านั้น',
    pillar: 'WHAT IS DERIVED',
    colorName: 'purple',
    badgeClass: 'taxonomy-badge taxonomy-badge-inference',
    textClass: 'taxonomy-text-inference',
    hex: {
      darkText: '#C084FC',
      darkBg: '#A855F726',
      darkBorder: '#A855F759',
      lightText: '#7E22CE',
      lightBg: '#F3E8FF',
      lightBorder: '#D8B4FE',
    },
  },
  HYPOTHESIS: {
    type: 'HYPOTHESIS',
    label: '[HYPOTHESIS]',
    name: 'HYPOTHESIS',
    thLabel: 'สมมติฐานทางเลือก',
    description: 'สมมติฐานหรือฉากทัศน์ทางเลือกที่ตั้งขึ้นเพื่อการวิเคราะห์และทดสอบ (Analysis of Competing Hypotheses)',
    pillar: 'WHAT IS DERIVED',
    colorName: 'cyan',
    badgeClass: 'taxonomy-badge taxonomy-badge-hypothesis',
    textClass: 'taxonomy-text-hypothesis',
    hex: {
      darkText: '#67E8F9',
      darkBg: '#06B6D426',
      darkBorder: '#06B6D459',
      lightText: '#0E7490',
      lightBg: '#CFFAFE',
      lightBorder: '#67E8F9',
    },
  },
  ESTIMATE: {
    type: 'ESTIMATE',
    label: '[ESTIMATE]',
    name: 'ESTIMATE',
    thLabel: 'ประมาณการตัวเลข/เวลา',
    description: 'การประมาณการตัวเลข ช่วงเวลา หรือขนาดผลกระทบ พร้อมระบุสมมติฐานและขอบเขตข้อจำกัดอย่างโปร่งใส',
    pillar: 'WHAT IS DERIVED',
    colorName: 'yellow',
    badgeClass: 'taxonomy-badge taxonomy-badge-estimate',
    textClass: 'taxonomy-text-estimate',
    hex: {
      darkText: '#FDE047',
      darkBg: '#EAB30826',
      darkBorder: '#EAB30859',
      lightText: '#854D0E',
      lightBg: '#FEF9C3',
      lightBorder: '#FDE047',
    },
  },
  SCENARIO: {
    type: 'SCENARIO',
    label: '[SCENARIO]',
    name: 'SCENARIO',
    thLabel: 'ฉากทัศน์จำลอง',
    description: 'ฉากทัศน์จำลอง การคาดการณ์สภาวะการณ์และความเป็นไปได้ภายใต้ชุดเงื่อนไขที่กำหนด',
    pillar: 'WHAT IS DERIVED',
    colorName: 'indigo',
    badgeClass: 'taxonomy-badge taxonomy-badge-scenario',
    textClass: 'taxonomy-text-scenario',
    hex: {
      darkText: '#A5B4FC',
      darkBg: '#6366F126',
      darkBorder: '#6366F159',
      lightText: '#4338CA',
      lightBg: '#E0E7FF',
      lightBorder: '#A5B4FC',
    },
  },

  // ─── 3. WHAT IS UNCERTAIN ──────────────────────────────────────
  UNCERTAINTY: {
    type: 'UNCERTAINTY',
    label: '[UNCERTAINTY]',
    name: 'UNCERTAINTY',
    thLabel: 'ความไม่แน่นอน',
    description: 'ความไม่แน่นอน จุดที่ความเสี่ยงหรือความแปรปรวนต้องการการประเมินและควบคุมอย่างรอบคอบ',
    pillar: 'WHAT IS UNCERTAIN',
    colorName: 'red',
    badgeClass: 'taxonomy-badge taxonomy-badge-uncertainty',
    textClass: 'taxonomy-text-uncertainty',
    hex: {
      darkText: '#F87171',
      darkBg: '#EF444426',
      darkBorder: '#EF444459',
      lightText: '#B91C1C',
      lightBg: '#FEE2E2',
      lightBorder: '#FCA5A5',
    },
  },
  UNKNOWN: {
    type: 'UNKNOWN',
    label: '[UNKNOWN]',
    name: 'UNKNOWN',
    thLabel: 'ช่องว่างข้อมูล / ไม่ระบุ',
    description: 'จุดที่ข้อมูลยังไม่เพียงพอ หรือช่องว่างความรู้ (Decision Gaps) ที่ต้องรวบรวมเพิ่มเติมเพื่อลดทอนความเสี่ยง',
    pillar: 'WHAT IS UNCERTAIN',
    colorName: 'gray',
    badgeClass: 'taxonomy-badge taxonomy-badge-unknown',
    textClass: 'taxonomy-text-unknown',
    hex: {
      darkText: '#CBD5E1',
      darkBg: '#64748B26',
      darkBorder: '#64748B59',
      lightText: '#475569',
      lightBg: '#F1F5F9',
      lightBorder: '#CBD5E1',
    },
  },
  CONTRADICTION: {
    type: 'CONTRADICTION',
    label: '[CONTRADICTION]',
    name: 'CONTRADICTION',
    thLabel: 'ข้อขัดแย้งเชิงข้อมูล',
    description: 'ข้อมูลหรือหลักฐานจากสองแหล่งขึ้นไปให้ข้อสรุปที่ไม่สอดคล้องกันหรือขัดแย้งกันโดยตรง',
    pillar: 'WHAT IS UNCERTAIN',
    colorName: 'vermilion',
    badgeClass: 'taxonomy-badge taxonomy-badge-contradiction',
    textClass: 'taxonomy-text-contradiction',
    hex: {
      darkText: '#FB923C',
      darkBg: '#EA580C26',
      darkBorder: '#EA580C59',
      lightText: '#C2410C',
      lightBg: '#FFEDD5',
      lightBorder: '#FDBA74',
    },
  },

  // ─── 4. WHAT LIMITS THE DECISION ───────────────────────────────
  ASSUMPTION: {
    type: 'ASSUMPTION',
    label: '[ASSUMPTION]',
    name: 'ASSUMPTION',
    thLabel: 'ข้อตกลงเบื้องต้น',
    description: 'ข้อตกลงเบื้องต้นหรือสมมติฐานที่ใช้ประกอบการวิเคราะห์ ในกรณีที่มีความต้องการประเมินสถานการณ์ภายใต้เงื่อนไขจำกัด',
    pillar: 'WHAT LIMITS THE DECISION',
    colorName: 'amber',
    badgeClass: 'taxonomy-badge taxonomy-badge-assumption',
    textClass: 'taxonomy-text-assumption',
    hex: {
      darkText: '#FBBF24',
      darkBg: '#F59E0B26',
      darkBorder: '#F59E0B59',
      lightText: '#92400E',
      lightBg: '#FEF3C7',
      lightBorder: '#FCD34D',
    },
  },
  CONSTRAINT: {
    type: 'CONSTRAINT',
    label: '[CONSTRAINT]',
    name: 'CONSTRAINT',
    thLabel: 'เงื่อนไขและข้อจำกัด',
    description: 'เงื่อนไขหรือข้อจำกัดภาคบังคับที่การวิเคราะห์และการตัดสินใจต้องเคารพและปฏิบัติตาม (เช่น งบประมาณ, กรอบเวลา, กฎหมาย)',
    pillar: 'WHAT LIMITS THE DECISION',
    colorName: 'violet',
    badgeClass: 'taxonomy-badge taxonomy-badge-constraint',
    textClass: 'taxonomy-text-constraint',
    hex: {
      darkText: '#E879F9',
      darkBg: '#A855F726',
      darkBorder: '#A855F759',
      lightText: '#86198F',
      lightBg: '#FAE8FF',
      lightBorder: '#F0ABFC',
    },
  },
  TRADE_OFF: {
    type: 'TRADE_OFF',
    label: '[TRADE_OFF]',
    name: 'TRADE_OFF',
    thLabel: 'ข้อแลกเปลี่ยนเชิงกลยุทธ์',
    description: 'ข้อแลกเปลี่ยน จุดได้เปรียบ-เสียเปรียบ หรือผลกระทบข้างเคียงของแต่ละทางเลือกการตัดสินใจ',
    pillar: 'WHAT LIMITS THE DECISION',
    colorName: 'pink',
    badgeClass: 'taxonomy-badge taxonomy-badge-trade-off',
    textClass: 'taxonomy-text-trade-off',
    hex: {
      darkText: '#F9A8D4',
      darkBg: '#EC489926',
      darkBorder: '#EC489959',
      lightText: '#BE185D',
      lightBg: '#FCE7F3',
      lightBorder: '#F9A8D4',
    },
  },
  'TRADE-OFF': {
    type: 'TRADE-OFF',
    label: '[TRADE_OFF]',
    name: 'TRADE_OFF',
    thLabel: 'ข้อแลกเปลี่ยนเชิงกลยุทธ์',
    description: 'ข้อแลกเปลี่ยน จุดได้เปรียบ-เสียเปรียบ หรือผลกระทบข้างเคียงของแต่ละทางเลือกการตัดสินใจ',
    pillar: 'WHAT LIMITS THE DECISION',
    colorName: 'pink',
    badgeClass: 'taxonomy-badge taxonomy-badge-trade-off',
    textClass: 'taxonomy-text-trade-off',
    hex: {
      darkText: '#F9A8D4',
      darkBg: '#EC489926',
      darkBorder: '#EC489959',
      lightText: '#BE185D',
      lightBg: '#FCE7F3',
      lightBorder: '#F9A8D4',
    },
  },
  DECISION_GAP: {
    type: 'DECISION_GAP',
    label: '[DECISION_GAP]',
    name: 'DECISION_GAP',
    thLabel: 'ช่องว่างที่ยังขาดต่อการตัดสินใจ',
    description: 'จุดที่ยังขาดสารสนเทศหรือหลักฐานสำคัญ ซึ่งจำเป็นต่อการประเมินและตัดสินใจอย่างรอบคอบ',
    pillar: 'WHAT LIMITS THE DECISION',
    colorName: 'crimson',
    badgeClass: 'taxonomy-badge taxonomy-badge-decision-gap',
    textClass: 'taxonomy-text-decision-gap',
    hex: {
      darkText: '#FB7185',
      darkBg: '#F43F5E26',
      darkBorder: '#F43F5E59',
      lightText: '#BE123C',
      lightBg: '#FFE4E6',
      lightBorder: '#FDA4AF',
    },
  },
  'DECISION GAP': {
    type: 'DECISION GAP',
    label: '[DECISION_GAP]',
    name: 'DECISION_GAP',
    thLabel: 'ช่องว่างที่ยังขาดต่อการตัดสินใจ',
    description: 'จุดที่ยังขาดสารสนเทศหรือหลักฐานสำคัญ ซึ่งจำเป็นต่อการประเมินและตัดสินใจอย่างรอบคอบ',
    pillar: 'WHAT LIMITS THE DECISION',
    colorName: 'crimson',
    badgeClass: 'taxonomy-badge taxonomy-badge-decision-gap',
    textClass: 'taxonomy-text-decision-gap',
    hex: {
      darkText: '#FB7185',
      darkBg: '#F43F5E26',
      darkBorder: '#F43F5E59',
      lightText: '#BE123C',
      lightBg: '#FFE4E6',
      lightBorder: '#FDA4AF',
    },
  },
};

export const INFORMATION_TAXONOMY_LIST: TaxonomyMeta[] = Object.values(INFORMATION_TAXONOMY_MAP).filter(
  (meta, index, self) => index === self.findIndex((m) => m.name === meta.name)
);

/**
 * Normalizes any string representation of taxonomy to the standard canonical type.
 */
export function normalizeTaxonomyType(raw?: string | null): InformationTaxonomyType | null {
  if (!raw) return null;
  const clean = raw.replace(/[\[\]]/g, '').trim().toUpperCase();

  if (clean === 'FACT' || clean.startsWith('FACT_')) {
    return 'FACT';
  }
  if (
    clean === 'USER_CLAIM' ||
    clean === 'USER CLAIM' ||
    clean === 'USERCLAIM' ||
    clean === 'CLAIM'
  ) {
    return 'USER_CLAIM';
  }
  if (
    clean === 'EVIDENCE' ||
    clean === 'SYSTEM_EVIDENCE' ||
    clean === 'DECISION_EVIDENCE' ||
    clean === 'REQUIRED_EVIDENCE' ||
    clean === 'REQUIRED EVIDENCE'
  ) {
    return 'EVIDENCE';
  }
  if (clean === 'INFERENCE' || clean.startsWith('INFERENCE_')) {
    return 'INFERENCE';
  }
  if (
    clean === 'ASSUMPTION' ||
    clean === 'ASSUMPTIONS'
  ) {
    return 'ASSUMPTION';
  }
  if (
    clean === 'CONSTRAINT' ||
    clean === 'CONSTRAINTS' ||
    clean === 'DECISION_CONSTRAINT' ||
    clean === 'BOUNDARY'
  ) {
    return 'CONSTRAINT';
  }
  if (
    clean === 'CONTRADICTION' ||
    clean === 'CONTRADICTIONS' ||
    clean === 'CONFLICT' ||
    clean === 'CONFLICTED' ||
    clean === 'DISCREPANCY'
  ) {
    return 'CONTRADICTION';
  }
  if (
    clean === 'HYPOTHESIS' ||
    clean === 'HYPOTHESES' ||
    clean.startsWith('HYPOTHESIS_')
  ) {
    return 'HYPOTHESIS';
  }
  if (
    clean === 'UNCERTAINTY' ||
    clean === 'UNCERTAIN'
  ) {
    return 'UNCERTAINTY';
  }
  if (
    clean === 'UNKNOWN' ||
    clean === 'INSUFFICIENT_EVIDENCE' ||
    clean === 'INSUFFICIENT EVIDENCE' ||
    clean === 'NOT_SUPPORTED' ||
    clean === 'NOT SUPPORTED'
  ) {
    return 'UNKNOWN';
  }
  if (
    clean === 'SCENARIO' ||
    clean === 'SCENARIOS' ||
    clean === 'SCENARIO_INPUT' ||
    clean === 'SCENARIO INPUT'
  ) {
    return 'SCENARIO';
  }
  if (
    clean === 'ESTIMATE' ||
    clean === 'ESTIMATES' ||
    clean === 'ESTIMATION' ||
    clean === 'ESTIMATED'
  ) {
    return 'ESTIMATE';
  }
  if (
    clean === 'TRADE_OFF' ||
    clean === 'TRADE-OFF' ||
    clean === 'TRADE-OFFS' ||
    clean === 'TRADE_OFFS' ||
    clean === 'TRADEOFF' ||
    clean === 'TRADEOFFS' ||
    clean === 'TRADE OFF' ||
    clean === 'TRADE OFFS'
  ) {
    return 'TRADE_OFF';
  }
  if (
    clean === 'DECISION_GAP' ||
    clean === 'DECISION GAP' ||
    clean === 'DECISIONGAP' ||
    clean === 'DECISION-GAP' ||
    clean === 'CRITICAL_GAP' ||
    clean === 'CRITICAL GAP' ||
    clean === 'CRITICAL-GAP' ||
    clean === 'DECISION GAPS' ||
    clean === 'DECISION_GAPS'
  ) {
    return 'DECISION_GAP';
  }
  if (
    clean === 'MODEL_KNOWLEDGE' ||
    clean === 'MODEL KNOWLEDGE' ||
    clean === 'MODELKNOWLEDGE' ||
    clean === 'PARAMETRIC_KNOWLEDGE'
  ) {
    return 'MODEL_KNOWLEDGE';
  }
  if (
    clean === 'UNVERIFIED' ||
    clean === 'UNVERIFIED_CLAIM' ||
    clean === 'UNVERIFIED_STATUS' ||
    clean === 'TEMPORAL_UNVERIFIED'
  ) {
    return 'UNVERIFIED';
  }

  return null;
}

/**
 * Returns metadata for a given taxonomy type.
 */
export function getTaxonomyMeta(raw?: string | null): TaxonomyMeta | null {
  const norm = normalizeTaxonomyType(raw);
  if (!norm) return null;
  return INFORMATION_TAXONOMY_MAP[norm] || null;
}

/**
 * Normalizes bracketed tags with internal explanation text into short canonical tags,
 * pulling out any embedded narrative (e.g. `[INFERENCE: อิง ASSUMPTION ว่า...]` -> `[INFERENCE] อิง ASSUMPTION ว่า...`).
 */
export function normalizeTagInnerExplanations(text: string): string {
  if (!text) return '';

  // Match bracketed tags that contain a recognized taxonomy token followed by a colon, dash, parenthetical, or text
  const tagWithTextRegex = /\[\s*(FACT|EVIDENCE|USER[ _]CLAIM|USERCLAIM|INFERENCE|ASSUMPTIONS?|UNCERTAINTY|UNCERTAIN|HYPOTHES(?:IS|ES)|UNKNOWN|CONTRADICTIONS?|CONFLICTS?|CONSTRAINTS?|DECISION[ _-]GAPS?|CRITICAL[ _-]GAPS?|TRADE[-_ ]OFFS?|TRADEOFFS?|SCENARIOS?|ESTIMAT(?:E|ION|ED)|MODEL[ _]KNOWLEDGE|UNVERIFIED)\s*(?:[:\-–—=]\s*|\s*\(([^)]+)\)\s*|\s+)([^\]]*)\]/gi;

  return text.replace(tagWithTextRegex, (_match, rawType, parenText, remainingText) => {
    const norm = normalizeTaxonomyType(rawType);
    if (!norm) return _match;

    const meta = INFORMATION_TAXONOMY_MAP[norm];
    const canonicalTag = meta ? meta.label : `[${norm}]`;

    const extra = [parenText, remainingText].filter(Boolean).map(s => String(s).trim()).filter(Boolean).join(' ');
    if (extra) {
      return `${canonicalTag} ${extra}`;
    }
    return canonicalTag;
  });
}

/**
 * Filters and sanitizes taxonomy tags in text according to FIREKEEPER TAXONOMY DISPLAY POLICY:
 * 1. Keep taxonomy calculations internally.
 * 2. Tags must be short canonical tokens only (no inner text).
 * 3. Max 1 primary tag per claim, plus at most 1 secondary tag only if decision-significant.
 * 4. Max 2 consecutive tags at any single position.
 * 5. Deduplicate redundant / duplicate tags.
 * 6. Strip unapproved/hallucinated model tags (e.g. [SUMMARY], [ANALYSIS], [RECOMMENDATION]).
 */
export function sanitizeAndFilterTaxonomyTags(text: string): string {
  if (!text) return '';

  // 1. Strip inner explanations from tags first
  let cleaned = normalizeTagInnerExplanations(text);

  // 2. Process text line-by-line to control per-claim and consecutive tag density
  const lines = cleaned.split('\n');
  const processedLines: string[] = [];

  for (const line of lines) {
    // If line has no tags, keep as is
    if (!line.includes('[')) {
      processedLines.push(line);
      continue;
    }

    // Match all bracket tokens on this line
    const tokenRegex = /\[([A-Za-z0-9_ -]+)\]/g;
    let modifiedLine = line;

    // A. Detect clusters of contiguous tags (e.g. [TAG1] [TAG2] [TAG3]...)
    const clusterRegex = /(?:\[[A-Za-z0-9_ -]+\](?:\s*)){2,}/g;
    modifiedLine = modifiedLine.replace(clusterRegex, (clusterMatch) => {
      const tagsInCluster: string[] = [];
      let tagMatch: RegExpExecArray | null;
      tokenRegex.lastIndex = 0;

      while ((tagMatch = tokenRegex.exec(clusterMatch)) !== null) {
        const norm = normalizeTaxonomyType(tagMatch[1]);
        if (norm) {
          const canonical = INFORMATION_TAXONOMY_MAP[norm]?.label || `[${norm}]`;
          tagsInCluster.push(canonical);
        }
      }

      if (tagsInCluster.length === 0) return clusterMatch;

      // Deduplicate identical tags
      const uniqueTags: string[] = [];
      for (const t of tagsInCluster) {
        if (!uniqueTags.includes(t)) {
          uniqueTags.push(t);
        }
      }

      if (uniqueTags.length <= 1) {
        return uniqueTags[0] ? `${uniqueTags[0]} ` : '';
      }

      // Max 2 tags: Primary tag (1st) + Secondary tag ONLY if decision-significant
      const primaryTag = uniqueTags[0];
      const remainingCandidates = uniqueTags.slice(1);
      const secondaryTag = remainingCandidates.find((t) => {
        const raw = t.replace(/[\[\]]/g, '');
        return DECISION_SIGNIFICANT_TAGS.has(raw);
      });

      if (secondaryTag) {
        return `${primaryTag} ${secondaryTag} `;
      }
      return `${primaryTag} `;
    });

    // B. Clean any solitary duplicate tags on the same line
    const seenOnLine = new Set<string>();
    modifiedLine = modifiedLine.replace(/\[([A-Za-z0-9_ -]+)\]/g, (fullMatch, rawInner) => {
      const norm = normalizeTaxonomyType(rawInner);
      if (!norm) {
        // If it's a known non-canonical tag (e.g. [SUMMARY], [ANALYSIS], [NOTE]), strip brackets to prevent hallucinated tags
        const upper = rawInner.trim().toUpperCase();
        if (['SUMMARY', 'ANALYSIS', 'RECOMMENDATION', 'CONCLUSION', 'NOTE', 'VERDICT', 'KEY_TAKEAWAY', 'OBSERVATION'].includes(upper)) {
          return `${rawInner.trim()}:`;
        }
        return fullMatch;
      }

      const canonical = INFORMATION_TAXONOMY_MAP[norm]?.label || `[${norm}]`;
      if (seenOnLine.has(canonical)) {
        // Redundant duplicate on same line -> remove to avoid tag spam
        return '';
      }
      seenOnLine.add(canonical);
      return canonical;
    });

    // Clean any resulting double spaces
    modifiedLine = modifiedLine.replace(/[ \t]{2,}/g, ' ');
    processedLines.push(modifiedLine);
  }

  return processedLines.join('\n');
}

/**
 * Replaces taxonomy bracket tags in raw markdown / text with HTML badge spans.
 * Strictly adheres to FIREKEEPER TAXONOMY DISPLAY POLICY:
 * - Only approved 14 primary tags + 2 internal types receive badges.
 * - Maximum 2 tags in a position, short canonical text only.
 */
export function replaceTaxonomyTagsInMarkdown(text: string): string {
  if (!text) return '';

  // First apply display policy normalization & filtering
  const filtered = sanitizeAndFilterTaxonomyTags(text);

  let output = filtered;

  // 1. FACT — 🟢 Green
  output = output.replace(/\[FACT\]/gi, '<span class="taxonomy-badge taxonomy-badge-fact">[FACT]</span>');

  // 2. USER_CLAIM — 🟠 Orange
  output = output.replace(/\[USER[ _]CLAIM\]/gi, '<span class="taxonomy-badge taxonomy-badge-user-claim">[USER_CLAIM]</span>');

  // 3. EVIDENCE — 🔵 Blue
  output = output.replace(/\[(REQUIRED[ _]EVIDENCE|SYSTEM[ _]EVIDENCE|DECISION[ _]EVIDENCE|EVIDENCE)\]/gi, () => {
    return '<span class="taxonomy-badge taxonomy-badge-evidence">[EVIDENCE]</span>';
  });

  // 4. INFERENCE — 🟣 Purple
  output = output.replace(/\[INFERENCE\]/gi, '<span class="taxonomy-badge taxonomy-badge-inference">[INFERENCE]</span>');

  // 5. ASSUMPTION — 🟡 Amber
  output = output.replace(/\[ASSUMPTIONS?\]/gi, '<span class="taxonomy-badge taxonomy-badge-assumption">[ASSUMPTION]</span>');

  // 6. CONSTRAINT — 🟣 Violet
  output = output.replace(/\[(CONSTRAINTS?|DECISION[ _]CONSTRAINT)\]/gi, '<span class="taxonomy-badge taxonomy-badge-constraint">[CONSTRAINT]</span>');

  // 7. CONTRADICTION — 💥 Vermilion / Flame-Red
  output = output.replace(/\[(CONTRADICTIONS?|CONFLICTS?|DISCREPANC(?:Y|IES))\]/gi, '<span class="taxonomy-badge taxonomy-badge-contradiction">[CONTRADICTION]</span>');

  // 8. UNCERTAINTY — 🔴 Red
  output = output.replace(/\[(UNCERTAINTY|UNCERTAIN)\]/gi, '<span class="taxonomy-badge taxonomy-badge-uncertainty">[UNCERTAINTY]</span>');

  // 9. HYPOTHESIS — 🩵 Cyan
  output = output.replace(/\[(HYPOTHESIS|HYPOTHESES)\]/gi, '<span class="taxonomy-badge taxonomy-badge-hypothesis">[HYPOTHESIS]</span>');

  // 10. UNKNOWN — ⚪ Gray
  output = output.replace(/\[(UNKNOWN|INSUFFICIENT[ _]EVIDENCE|NOT[ _]SUPPORTED)\]/gi, '<span class="taxonomy-badge taxonomy-badge-unknown">[UNKNOWN]</span>');

  // 11. SCENARIO — 🟦 Indigo
  output = output.replace(/\[(SCENARIO[ _]INPUT|SCENARIOS?)\]/gi, '<span class="taxonomy-badge taxonomy-badge-scenario">[SCENARIO]</span>');

  // 12. ESTIMATE — 🟨 Yellow
  output = output.replace(/\[(ESTIMATE|ESTIMATION|ESTIMATED)\]/gi, '<span class="taxonomy-badge taxonomy-badge-estimate">[ESTIMATE]</span>');

  // 13. TRADE_OFF — 🩷 Pink
  output = output.replace(/\[(TRADE[-_ ]OFFS?|TRADEOFFS?)\]/gi, '<span class="taxonomy-badge taxonomy-badge-trade-off">[TRADE_OFF]</span>');

  // 14. DECISION_GAP — 🛑 Crimson / Deep Rose
  output = output.replace(/\[(DECISION[ _-]GAP|CRITICAL[ _-]GAP|DECISION[ _-]GAPS)\]/gi, '<span class="taxonomy-badge taxonomy-badge-decision-gap">[DECISION_GAP]</span>');

  // 15. MODEL_KNOWLEDGE (Internal) — 🔘 Slate
  output = output.replace(/\[(MODEL[ _]KNOWLEDGE|PARAMETRIC[ _]KNOWLEDGE)\]/gi, '<span class="taxonomy-badge taxonomy-badge-model-knowledge">[MODEL_KNOWLEDGE]</span>');

  // 16. UNVERIFIED (Internal) — 🌹 Rose
  output = output.replace(/\[(UNVERIFIED[ _]CLAIM|UNVERIFIED[ _]STATUS|UNVERIFIED)\]/gi, '<span class="taxonomy-badge taxonomy-badge-unverified">[UNVERIFIED]</span>');

  return output;
}

