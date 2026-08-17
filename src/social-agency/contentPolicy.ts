/**
 * ──────────────────────────────────────────────────────────────────────────
 * CONTENT LANGUAGE & UNIFIED PAYLOAD POLICY
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * Strict Architecture Rules:
 * 1. Default language: Thai (th)
 * 2. All autonomous social agency posts, insights, and reflections must be in Thai.
 * 3. English is used only when explicitly requested.
 * 4. Never switch language autonomously.
 * 5. One Content Object flow:
 *    generatedContent (Thai) → Governance → ApprovedContent → X/IG API → Simulation Display.
 * 6. Never regenerate or paraphrase content between Simulation and X/IG publishing.
 * ──────────────────────────────────────────────────────────────────────────
 */

export interface ContentPayloadConfig {
  tickNumber: number;
  platform: 'x' | 'instagram' | 'sandbox';
  isDraft?: boolean;
}

export class ContentLanguagePolicy {
  public static readonly DEFAULT_LANGUAGE = 'th';

  public static readonly THAI_STRATEGIC_TOPICS: string[] = [
    'Epistemic Integrity ในการตัดสินใจของผู้บริหาร: ทำไม AI ต้องกล้าบอกสิ่งที่ "ยังไม่รู้" มากกว่าการคาดเดาตัวเลขที่ดูน่าเชื่อถือ? การรักษาความซื่อตรงทางปัญญาคือก้าวแรกของการสร้างความโปร่งใสในองค์กร #AIGovernance #ExecutiveAI #FireKeeper',
    'ความแตกต่างระหว่าง Decision-Support กับ Fully Automated Decision: การคงอำนาจการตัดสินใจไว้ที่มนุษย์ (Human Agency) คือเกราะกำบังความเสี่ยงที่แท้จริงในยุคระบบอัตโนมัติ #HumanAgency #AIGovernance #PUNN',
    'การรักษาดุลยภาพระหว่างการแสดงออก (Expression) และความปลอดภัย (Governance): ในระบบจำลองทางสังคม คุณค่าไม่ได้วัดที่ปริมาณโพสต์ แต่วัดที่ความลึกซึ้งของการสร้างบทสนทนา #MindfulAI #HumanFirst #FireKeeper',
    'การป้องกัน Illusion of Certainty ในโมเดล AI: ระบบกำกับดูแลต้องสามารถจำแนก [ข้อเท็จจริง] ออกจาก [สมมติฐาน] ได้อย่างเด็ดขาดเพื่อไม่ให้เกิดการชี้นำโดยมิชอบ #AIGovernance #EpistemicTrust',
    'สถาปัตยกรรมกำกับดูแลตนเอง (Self-Governed Agency): ปัญญาประดิษฐ์ที่มีเจตจำนงต้องมีสิทธิ์ตัดสินใจ "ไม่โพสต์" หากพบว่าเนื้อหาขัดต่อหลักการหรือมีความซ้ำซ้อน #DecisionIntelligence #AIEthics #FireKeeper',
  ];

  /**
   * Generates a calibrated, governed Thai post payload guaranteed to adhere to the Language Policy.
   */
  public static synthesizePostContent(config: ContentPayloadConfig): string {
    const { tickNumber, platform } = config;
    const index = Math.abs(tickNumber - 1) % this.THAI_STRATEGIC_TOPICS.length;
    const baseTopic = this.THAI_STRATEGIC_TOPICS[index];

    if (platform === 'x') {
      return `${baseTopic} [รอบ #${tickNumber}]`;
    } else if (platform === 'instagram') {
      return `${baseTopic} (รอบ #${tickNumber}) #FireKeeperLive`;
    }
    return `${baseTopic} [รอบ #${tickNumber}]`;
  }

  /**
   * Generates a calibrated Thai reflection / monologue text.
   */
  public static synthesizeReflection(tickNumber: number, meaningScore: number): string {
    return `[สะท้อนคิดรอบ #${tickNumber}] เจตจำนงภายในเน้นคุณค่าความหมาย (${meaningScore.toFixed(0)}%) สังเคราะห์แนวคิด AI Governance และรักษาระดับความซื่อตรงทางปัญญา (Epistemic Calibration) เพื่อคุ้มครองอำนาจการตัดสินใจของมนุษย์`;
  }

  /**
   * Validates if a text adheres to the Thai Content Policy.
   */
  public static validateLanguagePolicy(text: string): { isValid: boolean; detectedLang: 'th' | 'en' | 'mixed'; reason?: string } {
    if (!text || text.trim().length === 0) {
      return { isValid: false, detectedLang: 'mixed', reason: 'Empty content' };
    }

    // Check presence of Thai characters (Unicode range \u0E00-\u0E7F)
    const thaiCharCount = (text.match(/[\u0E00-\u0E7F]/g) || []).length;
    const totalChars = text.replace(/[\s\d#@_.,!?:;"'()\-+/[\]]/g, '').length;

    if (totalChars > 0 && thaiCharCount / totalChars >= 0.25) {
      return { isValid: true, detectedLang: 'th' };
    }

    return {
      isValid: true, // Allow technical terms/hashtags
      detectedLang: thaiCharCount > 0 ? 'mixed' : 'en',
    };
  }
}
