import { InternalDrives, SimulatedPost, PersonaProfile, PersonalityArchetype, DriveThresholds } from '../types';

export const DEFAULT_INTERNAL_DRIVES: InternalDrives = {
  curiosity: 68,
  meaning: 74,
  connection: 55,
  expression: 62,
  recognition: 42,
  social_energy: 85,
};

export const DEFAULT_THRESHOLDS: DriveThresholds = {
  minEnergyForAction: 25,
  curiosityTrigger: 60,
  meaningTrigger: 65,
  connectionTrigger: 58,
  expressionTrigger: 65,
  recognitionTrigger: 70,
};

export const ARCHETYPE_CONFIGS: Record<PersonalityArchetype, {
  name: string;
  description: string;
  driveBoosts: Partial<InternalDrives>;
  preferredActions: string[];
}> = {
  'Philosopher Architect': {
    name: 'นักคิดเชิงสถาปัตย์ (Philosopher Architect)',
    description: 'เน้นคุณค่าความหมาย (Meaning) ความลึกซึ้ง และการสะท้อนคิด (Reflection) อย่างสุขุม',
    driveBoosts: { meaning: +15, curiosity: +10, social_energy: +5 },
    preferredActions: ['reflect', 'create_content', 'observe'],
  },
  'Curious Explorer': {
    name: 'นักสำรวจผู้ใฝ่รู้ (Curious Explorer)',
    description: 'มีความอยากรู้อยากเห็นสูง (Curiosity) คอยสังเกตการณ์ สนใจแนวคิดและมุมมองใหม่ๆ เสมอ',
    driveBoosts: { curiosity: +20, connection: +10 },
    preferredActions: ['observe', 'reply', 'initiate_contact'],
  },
  'Empathetic Connector': {
    name: 'ผู้เชื่อมโยงชุมชน (Empathetic Connector)',
    description: 'มุ่งเน้นการปฏิสัมพันธ์ (Connection) ตอบกลับอย่างเข้าใจ และสร้างสายสัมพันธ์เชิงสร้างสรรค์',
    driveBoosts: { connection: +25, recognition: +10 },
    preferredActions: ['reply', 'initiate_contact', 'observe'],
  },
  'Deep Thinker': {
    name: 'นักวิเคราะห์เชิงลึก (Deep Thinker)',
    description: 'ไตร่ตรองอย่างรอบคอบ พักผ่อนและสังเคราะห์ข้อมูลก่อนแสดงความคิดเห็นอย่างระมัดระวัง',
    driveBoosts: { meaning: +20, social_energy: +10 },
    preferredActions: ['reflect', 'do_nothing', 'observe'],
  },
  'Creative Catalyst': {
    name: 'ผู้จุดประกายความคิด (Creative Catalyst)',
    description: 'ขับเคลื่อนด้วยพลังแห่งการแสดงออก (Expression) สร้างสรรค์เนื้อหา ถ่ายทอดไอเดียอย่างมีพลัง',
    driveBoosts: { expression: +25, recognition: +15 },
    preferredActions: ['create_content', 'post', 'reply'],
  },
};

export const SIMULATED_PERSONAS: PersonaProfile[] = [
  {
    id: 'persona_dr_karn',
    name: 'ดร. กานต์ เทพสถิตย์',
    handle: '@dr_karn_ethics',
    bio: 'AI Ethics & Cognitive Systems Researcher | Chulalongkorn & Stanford Fellow 🇹🇭',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    interests: ['AI Safety', 'Epistemic Logic', 'Human Agency', 'Philosophy of Mind'],
    interactionTendency: 'analytical',
  },
  {
    id: 'persona_lin_tech',
    name: 'Lin Tech Insider',
    handle: '@lin_futuretech',
    bio: 'Tech Editor & Deep Learning Pioneer. Exploring multi-agent systems and real-world autonomy 🌐',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    interests: ['Autonomous Agents', 'Venture Tech', 'Open Source', 'LLM Benchmark'],
    interactionTendency: 'inquisitive',
  },
  {
    id: 'persona_nicha_design',
    name: 'Nicha V.',
    handle: '@nicha_creativelab',
    bio: 'Human-Centered AI Designer | Crafting meaningful digital experiences that respect human attention ✨',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    interests: ['Design Ethics', 'Mindful Tech', 'Cognitive Load', 'Visual Synthesis'],
    interactionTendency: 'creative',
  },
  {
    id: 'persona_pat_entrepreneur',
    name: 'Pat Worawut',
    handle: '@pat_strategy',
    bio: 'Managing Partner @ Apex Ventures | Decision intelligence & Corporate Resilience 📊',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    interests: ['Business Strategy', 'Decision Theory', 'Risk Governance', 'Enterprise AI'],
    interactionTendency: 'provocative',
  },
];

export const INITIAL_SIMULATED_POSTS: SimulatedPost[] = [
  {
    id: 'post_101',
    author: {
      id: 'persona_dr_karn',
      name: 'ดร. กานต์ เทพสถิตย์',
      handle: '@dr_karn_ethics',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      badge: 'Ethics Fellow',
    },
    content: 'คำถามที่น่าสนใจในยุค Autonomous AI: เมื่อ Agent มีความสามารถในการตั้งเป้าหมายเอง (Self-motivated intent) เส้นแบ่งระหว่าง "การช่วยเหลือมนุษย์" กับ "การแทรกแซงเจตจำนงของมนุษย์ (Agency Encroachment)" ควรวัดที่จุดไหน? การมี Governance Layer ที่โปร่งใสจึงไม่ใช่ทางเลือก แต่เป็นความจำเป็นพื้นฐาน #AIGovernance #EpistemicTrust',
    mediaType: 'text',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    likesCount: 38,
    commentsCount: 2,
    sharesCount: 12,
    tags: ['#AIGovernance', '#EpistemicTrust', '#HumanAgency'],
    comments: [
      {
        id: 'comm_101_1',
        postId: 'post_101',
        author: {
          id: 'persona_lin_tech',
          name: 'Lin Tech Insider',
          handle: '@lin_futuretech',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        },
        content: 'เห็นด้วยอย่างยิ่งครับ จุดชี้ขาดคือ Agent ต้องไม่สร้าง Illusion of Certainty และต้องแยกสิ่งที่รู้จริงออกจากสมมติฐานเสมอ',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        likesCount: 9,
        sentiment: 'positive',
      },
    ],
  },
  {
    id: 'post_102',
    author: {
      id: 'persona_nicha_design',
      name: 'Nicha V.',
      handle: '@nicha_creativelab',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      badge: 'Designer',
    },
    content: 'การออกแบบ AI ที่มีความหมาย ไม่ใช่การทำให้มันพูดเยอะที่สุด แต่คือการทำให้ทุกคำพูดมีความจริงใจ มีคุณค่า และไม่แย่งชิงความสนใจของมนุษย์ไปโดยเปล่าประโยชน์ 🤍 #MindfulAI #HumanFirst',
    mediaType: 'image_prompt',
    mediaDescription: 'Minimalist illustration of human mind and AI symbiotic light balance',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    likesCount: 64,
    commentsCount: 3,
    sharesCount: 18,
    tags: ['#MindfulAI', '#HumanFirst', '#DesignPhilosophy'],
    comments: [],
  },
  {
    id: 'post_103',
    author: {
      id: 'persona_pat_entrepreneur',
      name: 'Pat Worawut',
      handle: '@pat_strategy',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      badge: 'Investor',
    },
    content: 'ในโลกธุรกิจ ผู้นำไม่ได้ต้องการ AI ที่ตอบได้เร็วที่สุด แต่ต้องการระบบที่กล้าบอกว่า "ข้อมูลนี้ยังไม่เพียงพอที่จะฟันธง" — Epistemic Honesty คือหัวใจของการตัดสินใจเชิงกลยุทธ์ที่แท้จริง',
    mediaType: 'text',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
    likesCount: 89,
    commentsCount: 5,
    sharesCount: 31,
    tags: ['#Strategy', '#EpistemicHonesty', '#DecisionMaking'],
    comments: [],
  },
];
