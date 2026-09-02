/**
 * Shared Information Taxonomy Design Tokens & Utility for FIRE KEEPER
 * 
 * Complete 12-Taxonomy Color Palette:
 * [FACT]         = Green       (#34D399 dark / #047857 light)
 * [USER CLAIM]   = Orange      (#FB923C dark / #C2410C light)
 * [EVIDENCE]     = Blue        (#60A5FA dark / #1D4ED8 light)
 * [INFERENCE]    = Purple      (#C084FC dark / #7E22CE light)
 * [ASSUMPTION]   = Amber       (#FBBF24 dark / #92400E light)
 * [UNCERTAINTY]  = Red         (#F87171 dark / #B91C1C light)
 * [HYPOTHESIS]   = Cyan        (#67E8F9 dark / #0E7490 light)
 * [UNKNOWN]      = Gray        (#CBD5E1 dark / #475569 light)
 * [SCENARIO]     = Indigo      (#A5B4FC dark / #4338CA light)
 * [ESTIMATE]     = Yellow      (#FDE047 dark / #854D0E light)
 * [TRADE-OFF]    = Pink        (#F9A8D4 dark / #BE185D light)
 * [DECISION GAP] = Crimson     (#FB7185 dark / #BE123C light)
 */

export type InformationTaxonomyType =
  | 'FACT'
  | 'USER CLAIM'
  | 'EVIDENCE'
  | 'INFERENCE'
  | 'ASSUMPTION'
  | 'UNCERTAINTY'
  | 'HYPOTHESIS'
  | 'UNKNOWN'
  | 'SCENARIO'
  | 'ESTIMATE'
  | 'TRADE-OFF'
  | 'DECISION GAP';

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
  | 'crimson';

export interface TaxonomyMeta {
  type: InformationTaxonomyType;
  label: string;
  name: string;
  thLabel: string;
  description: string;
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

export const INFORMATION_TAXONOMY_MAP: Record<InformationTaxonomyType, TaxonomyMeta> = {
  FACT: {
    type: 'FACT',
    label: '[FACT]',
    name: 'FACT',
    thLabel: 'ข้อเท็จจริง',
    description: 'ข้อเท็จจริงประจักษ์พยานที่ยืนยันได้อย่างสมบูรณ์ มีหลักฐานตรงกับระบบความจำหรืออินพุตของผู้ใช้โดยตรง',
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
  'USER CLAIM': {
    type: 'USER CLAIM',
    label: '[USER CLAIM]',
    name: 'USER CLAIM',
    thLabel: 'ข้อกล่าวอ้างจากผู้ใช้',
    description: 'ข้อกล่าวอ้างหรือสมมติฐานที่ระบุโดยผู้ใช้งาน ซึ่งยังคงรอการสอบทวนและยืนยันน้ำหนักหลักฐาน',
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
  EVIDENCE: {
    type: 'EVIDENCE',
    label: '[EVIDENCE]',
    name: 'EVIDENCE',
    thLabel: 'หลักฐานเชิงประจักษ์',
    description: 'หลักฐาน แหล่งข้อมูลอ้างอิง หรือสารสนเทศสด (Real-time Retrieval) ที่ถูกนำเข้ามาเพื่อประเมินความสอดคล้อง',
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
  INFERENCE: {
    type: 'INFERENCE',
    label: '[INFERENCE]',
    name: 'INFERENCE',
    thLabel: 'ข้ออนุมานเชิงตรรกะ',
    description: 'การอนุมานอย่างสมเหตุสมผลเชิงตรรกะ จากข้อเท็จจริงที่ปรากฏและสืบค้นได้จริงเท่านั้น',
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
  ASSUMPTION: {
    type: 'ASSUMPTION',
    label: '[ASSUMPTION]',
    name: 'ASSUMPTION',
    thLabel: 'ข้อตกลงเบื้องต้น',
    description: 'ข้อตกลงเบื้องต้นหรือสมมติฐานที่ใช้ประกอบการวิเคราะห์ ในกรณีที่มีความต้องการประเมินสถานการณ์ภายใต้เงื่อนไขจำกัด',
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
  UNCERTAINTY: {
    type: 'UNCERTAINTY',
    label: '[UNCERTAINTY]',
    name: 'UNCERTAINTY',
    thLabel: 'ความไม่แน่นอน',
    description: 'ความไม่แน่นอน จุดที่ความเสี่ยงหรือความแปรปรวนต้องการการประเมินและควบคุมอย่างรอบคอบ',
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
  HYPOTHESIS: {
    type: 'HYPOTHESIS',
    label: '[HYPOTHESIS]',
    name: 'HYPOTHESIS',
    thLabel: 'สมมติฐานทางเลือก',
    description: 'สมมติฐานหรือฉากทัศน์ทางเลือกที่ตั้งขึ้นเพื่อการวิเคราะห์และทดสอบ (Analysis of Competing Hypotheses)',
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
  UNKNOWN: {
    type: 'UNKNOWN',
    label: '[UNKNOWN]',
    name: 'UNKNOWN',
    thLabel: 'ช่องว่างข้อมูล / ไม่ระบุ',
    description: 'จุดที่ข้อมูลยังไม่เพียงพอ หรือช่องว่างความรู้ (Decision Gaps) ที่ต้องรวบรวมเพิ่มเติมเพื่อลดทอนความเสี่ยง',
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
  SCENARIO: {
    type: 'SCENARIO',
    label: '[SCENARIO]',
    name: 'SCENARIO',
    thLabel: 'ฉากทัศน์จำลอง',
    description: 'ฉากทัศน์จำลอง การคาดการณ์สภาวะการณ์และความเป็นไปได้ภายใต้ชุดเงื่อนไขที่กำหนด',
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
  ESTIMATE: {
    type: 'ESTIMATE',
    label: '[ESTIMATE]',
    name: 'ESTIMATE',
    thLabel: 'ประมาณการตัวเลข/เวลา',
    description: 'การประมาณการตัวเลข ช่วงเวลา หรือขนาดผลกระทบ พร้อมระบุสมมติฐานและขอบเขตข้อจำกัดอย่างโปร่งใส',
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
  'TRADE-OFF': {
    type: 'TRADE-OFF',
    label: '[TRADE-OFF]',
    name: 'TRADE-OFF',
    thLabel: 'ข้อแลกเปลี่ยนเชิงกลยุทธ์',
    description: 'ข้อแลกเปลี่ยน จุดได้เปรียบ-เสียเปรียบ หรือผลกระทบข้างเคียงของแต่ละทางเลือกการตัดสินใจ',
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
  'DECISION GAP': {
    type: 'DECISION GAP',
    label: '[DECISION GAP]',
    name: 'DECISION GAP',
    thLabel: 'ช่องว่างที่ยังขาดต่อการตัดสินใจ',
    description: 'จุดที่ยังขาดสารสนเทศหรือหลักฐานสำคัญ ซึ่งจำเป็นต่อการประเมินและตัดสินใจอย่างรอบคอบ',
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

export const INFORMATION_TAXONOMY_LIST: TaxonomyMeta[] = Object.values(INFORMATION_TAXONOMY_MAP);

/**
 * Normalizes any string representation of taxonomy to the standard type.
 */
export function normalizeTaxonomyType(raw?: string | null): InformationTaxonomyType | null {
  if (!raw) return null;
  const clean = raw.replace(/[\[\]]/g, '').trim().toUpperCase();

  if (clean === 'FACT' || clean.startsWith('FACT_')) {
    return 'FACT';
  }
  if (
    clean === 'USER CLAIM' ||
    clean === 'USER_CLAIM' ||
    clean === 'USERCLAIM' ||
    clean === 'CLAIM'
  ) {
    return 'USER CLAIM';
  }
  if (
    clean === 'EVIDENCE' ||
    clean === 'SYSTEM_EVIDENCE' ||
    clean === 'DECISION_EVIDENCE' ||
    clean === 'REQUIRED EVIDENCE' ||
    clean === 'REQUIRED_EVIDENCE'
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
    clean === 'INSUFFICIENT EVIDENCE' ||
    clean === 'INSUFFICIENT_EVIDENCE' ||
    clean === 'NOT SUPPORTED'
  ) {
    return 'UNKNOWN';
  }
  if (
    clean === 'SCENARIO' ||
    clean === 'SCENARIOS' ||
    clean === 'SCENARIO INPUT' ||
    clean === 'SCENARIO_INPUT'
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
    clean === 'TRADE-OFF' ||
    clean === 'TRADE-OFFS' ||
    clean === 'TRADEOFF' ||
    clean === 'TRADEOFFS' ||
    clean === 'TRADE OFF' ||
    clean === 'TRADE OFFS'
  ) {
    return 'TRADE-OFF';
  }
  if (
    clean === 'DECISION GAP' ||
    clean === 'DECISION_GAP' ||
    clean === 'DECISIONGAP' ||
    clean === 'DECISION-GAP' ||
    clean === 'CRITICAL GAP' ||
    clean === 'CRITICAL_GAP' ||
    clean === 'CRITICAL-GAP' ||
    clean === 'DECISION GAPS'
  ) {
    return 'DECISION GAP';
  }

  return null;
}

/**
 * Returns metadata for a given taxonomy type.
 */
export function getTaxonomyMeta(raw?: string | null): TaxonomyMeta | null {
  const norm = normalizeTaxonomyType(raw);
  if (!norm) return null;
  return INFORMATION_TAXONOMY_MAP[norm];
}

/**
 * Replaces taxonomy bracket tags in raw markdown / text with HTML badge spans.
 * Only the tag itself is wrapped in the colored badge; subsequent text remains normal.
 */
export function replaceTaxonomyTagsInMarkdown(text: string): string {
  if (!text) return '';

  let output = text;

  // 1. FACT — 🟢 Green
  output = output.replace(/\[FACT\]/gi, '<span class="taxonomy-badge taxonomy-badge-fact">[FACT]</span>');

  // 2. USER CLAIM — 🟠 Orange
  output = output.replace(/\[USER[ _]CLAIM\]/gi, '<span class="taxonomy-badge taxonomy-badge-user-claim">[USER CLAIM]</span>');

  // 3. EVIDENCE — 🔵 Blue
  output = output.replace(/\[(REQUIRED[ _]EVIDENCE|SYSTEM[ _]EVIDENCE|DECISION[ _]EVIDENCE|EVIDENCE)\]/gi, (_match, p1) => {
    const label = p1.toUpperCase().replace(/_/g, ' ');
    return `<span class="taxonomy-badge taxonomy-badge-evidence">[${label}]</span>`;
  });

  // 4. INFERENCE — 🟣 Purple
  output = output.replace(/\[INFERENCE\]/gi, '<span class="taxonomy-badge taxonomy-badge-inference">[INFERENCE]</span>');

  // 5. ASSUMPTION — 🟡 Amber
  output = output.replace(/\[ASSUMPTIONS?\]/gi, '<span class="taxonomy-badge taxonomy-badge-assumption">[ASSUMPTION]</span>');

  // 6. UNCERTAINTY — 🔴 Red
  output = output.replace(/\[(UNCERTAINTY|UNCERTAIN)\]/gi, '<span class="taxonomy-badge taxonomy-badge-uncertainty">[UNCERTAINTY]</span>');

  // 7. HYPOTHESIS — 🩵 Cyan
  output = output.replace(/\[(HYPOTHESIS|HYPOTHESES)\]/gi, '<span class="taxonomy-badge taxonomy-badge-hypothesis">[HYPOTHESIS]</span>');

  // 8. UNKNOWN — ⚪ Gray
  output = output.replace(/\[UNKNOWN\]/gi, '<span class="taxonomy-badge taxonomy-badge-unknown">[UNKNOWN]</span>');
  output = output.replace(/\[INSUFFICIENT[ _]EVIDENCE\]/gi, '<span class="taxonomy-badge taxonomy-badge-unknown">[INSUFFICIENT EVIDENCE]</span>');
  output = output.replace(/\[NOT[ _]SUPPORTED\]/gi, '<span class="taxonomy-badge taxonomy-badge-unknown">[NOT SUPPORTED]</span>');

  // 9. SCENARIO — 🟦 Indigo
  output = output.replace(/\[SCENARIO[ _]INPUT\]/gi, '<span class="taxonomy-badge taxonomy-badge-scenario">[SCENARIO INPUT]</span>');
  output = output.replace(/\[SCENARIOS?\]/gi, '<span class="taxonomy-badge taxonomy-badge-scenario">[SCENARIO]</span>');

  // 10. ESTIMATE — 🟨 Yellow
  output = output.replace(/\[(ESTIMATE|ESTIMATION|ESTIMATED)\]/gi, '<span class="taxonomy-badge taxonomy-badge-estimate">[ESTIMATE]</span>');

  // 11. TRADE-OFF — 🩷 Pink
  output = output.replace(/\[(TRADE[-_ ]OFFS?|TRADEOFFS?)\]/gi, '<span class="taxonomy-badge taxonomy-badge-trade-off">[TRADE-OFF]</span>');

  // 12. DECISION GAP — 🛑 Crimson / Deep Rose
  output = output.replace(/\[(DECISION[ _-]GAP|CRITICAL[ _-]GAP|DECISION[ _-]GAPS)\]/gi, '<span class="taxonomy-badge taxonomy-badge-decision-gap">[DECISION GAP]</span>');

  return output;
}
