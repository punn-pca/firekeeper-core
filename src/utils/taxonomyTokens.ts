/**
 * Shared Information Taxonomy Design Tokens & Utility for FIRE KEEPER
 * 
 * Standard Color Palette:
 * [FACT]        = Emerald / Green (#34D399 dark / #047857 light)
 * [USER CLAIM]  = Orange          (#FB923C dark / #C2410C light)
 * [EVIDENCE]    = Blue            (#60A5FA dark / #1D4ED8 light)
 * [INFERENCE]   = Purple          (#C084FC dark / #7E22CE light)
 * [ASSUMPTION]  = Amber / Yellow  (#FBBF24 dark / #92400E light)
 * [UNCERTAINTY] = Red / Rose      (#F87171 dark / #B91C1C light)
 */

export type InformationTaxonomyType =
  | 'FACT'
  | 'USER CLAIM'
  | 'EVIDENCE'
  | 'INFERENCE'
  | 'ASSUMPTION'
  | 'UNCERTAINTY';

export interface TaxonomyMeta {
  type: InformationTaxonomyType;
  label: string;
  name: string;
  thLabel: string;
  description: string;
  colorName: 'emerald' | 'orange' | 'blue' | 'purple' | 'amber' | 'red';
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
      darkBg: 'rgba(16, 185, 129, 0.15)',
      darkBorder: 'rgba(16, 185, 129, 0.35)',
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
      darkBg: 'rgba(249, 115, 22, 0.15)',
      darkBorder: 'rgba(249, 115, 22, 0.35)',
      lightText: '#C2410C',
      lightBg: '#FFEDD5',
      lightBorder: '#FDBA74',
    },
  },
  EVIDENCE: {
    type: 'EVIDENCE',
    label: '[EVIDENCE]',
    name: 'EVIDENCE',
    thLabel: 'หลักฐาน',
    description: 'หลักฐาน แหล่งข้อมูลอ้างอิง หรือสารสนเทศสด (Real-time Retrieval) ที่ถูกนำเข้ามาเพื่อประเมินความสอดคล้อง',
    colorName: 'blue',
    badgeClass: 'taxonomy-badge taxonomy-badge-evidence',
    textClass: 'taxonomy-text-evidence',
    hex: {
      darkText: '#60A5FA',
      darkBg: 'rgba(59, 130, 246, 0.15)',
      darkBorder: 'rgba(59, 130, 246, 0.35)',
      lightText: '#1D4ED8',
      lightBg: '#DBEAFE',
      lightBorder: '#93C5FD',
    },
  },
  INFERENCE: {
    type: 'INFERENCE',
    label: '[INFERENCE]',
    name: 'INFERENCE',
    thLabel: 'ข้ออนุมาน',
    description: 'การอนุมานอย่างสมเหตุสมผลเชิงตรรกะ จากข้อเท็จจริงที่ปรากฏและสืบค้นได้จริงเท่านั้น',
    colorName: 'purple',
    badgeClass: 'taxonomy-badge taxonomy-badge-inference',
    textClass: 'taxonomy-text-inference',
    hex: {
      darkText: '#C084FC',
      darkBg: 'rgba(168, 85, 247, 0.15)',
      darkBorder: 'rgba(168, 85, 247, 0.35)',
      lightText: '#7E22CE',
      lightBg: '#F3E8FF',
      lightBorder: '#D8B4FE',
    },
  },
  ASSUMPTION: {
    type: 'ASSUMPTION',
    label: '[ASSUMPTION]',
    name: 'ASSUMPTION',
    thLabel: 'สมมติฐาน',
    description: 'สมมติฐานหรือข้อตกลงเบื้องต้นที่ใช้ประกอบการวิเคราะห์ ในกรณีที่มีความต้องการประเมินสถานการณ์ภายใต้เงื่อนไขจำกัด',
    colorName: 'amber',
    badgeClass: 'taxonomy-badge taxonomy-badge-assumption',
    textClass: 'taxonomy-text-assumption',
    hex: {
      darkText: '#FBBF24',
      darkBg: 'rgba(245, 158, 11, 0.15)',
      darkBorder: 'rgba(245, 158, 11, 0.35)',
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
    description: 'ความไม่แน่นอน จุดที่ข้อมูลยังไม่เพียงพอ หรือช่องว่างความรู้ที่ต้องรวบรวมเพิ่มเติมเพื่อลดทอนความเสี่ยง',
    colorName: 'red',
    badgeClass: 'taxonomy-badge taxonomy-badge-uncertainty',
    textClass: 'taxonomy-text-uncertainty',
    hex: {
      darkText: '#F87171',
      darkBg: 'rgba(239, 68, 68, 0.15)',
      darkBorder: 'rgba(239, 68, 68, 0.35)',
      lightText: '#B91C1C',
      lightBg: '#FEE2E2',
      lightBorder: '#FCA5A5',
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
    clean === 'ASSUMPTIONS' ||
    clean === 'HYPOTHESIS' ||
    clean === 'HYPOTHESES' ||
    clean.startsWith('HYPOTHESIS_')
  ) {
    return 'ASSUMPTION';
  }
  if (
    clean === 'UNCERTAINTY' ||
    clean === 'UNCERTAIN' ||
    clean === 'UNKNOWN' ||
    clean === 'INSUFFICIENT EVIDENCE' ||
    clean === 'INSUFFICIENT_EVIDENCE' ||
    clean === 'NOT SUPPORTED'
  ) {
    return 'UNCERTAINTY';
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

  // Replace each standard tag (and known variations) with uniform badge
  output = output.replace(/\[FACT\]/gi, '<span class="taxonomy-badge taxonomy-badge-fact">[FACT]</span>');
  output = output.replace(/\[USER CLAIM\]/gi, '<span class="taxonomy-badge taxonomy-badge-user-claim">[USER CLAIM]</span>');
  output = output.replace(/\[USER_CLAIM\]/gi, '<span class="taxonomy-badge taxonomy-badge-user-claim">[USER CLAIM]</span>');
  output = output.replace(/\[EVIDENCE\]/gi, '<span class="taxonomy-badge taxonomy-badge-evidence">[EVIDENCE]</span>');
  output = output.replace(/\[INFERENCE\]/gi, '<span class="taxonomy-badge taxonomy-badge-inference">[INFERENCE]</span>');
  output = output.replace(/\[ASSUMPTION\]/gi, '<span class="taxonomy-badge taxonomy-badge-assumption">[ASSUMPTION]</span>');
  output = output.replace(/\[UNCERTAINTY\]/gi, '<span class="taxonomy-badge taxonomy-badge-uncertainty">[UNCERTAINTY]</span>');

  return output;
}
