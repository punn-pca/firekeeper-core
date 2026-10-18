import React, { useRef, useEffect, useState } from 'react';
import { Flame, AlertTriangle, History, MessageSquare, Plus } from 'lucide-react';
import { MessageBubble, StreamingMessageBubble } from './MessageBubble';
import { MobileComposer } from './MobileComposer';
import { Turn, ToneMode, ReasoningProfile, AttachedFile, ChatMode } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useConversation } from '../context/การสนทนาContext';

interface MobileChatLayoutProps {
  currentTurns: Turn[];
  isAnalyzing: boolean;
  streamingStage: string;
  streamingResponseText: string;
  lightGovernanceNotice?: string | null;
  streamingTokens: number;
  isTokenEstimated: boolean;
  onSendPrompt: (
    prompt: string,
    tone?: ToneMode,
    deepReasoning?: boolean,
    attachments?: AttachedFile[],
    reasoningProfile?: ReasoningProfile
  ) => void;
  onCancelAnalysis: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  isAuthenticated: boolean;
  isAdmin?: boolean;
  remainingQuota?: { direct: number; governance: number };
  tone: ToneMode;
  deepReasoning: boolean;
  webSearch: boolean;
  onToggleWebSearch: () => void;
  reasoningProfile: ReasoningProfile;
  errorMessage: string | null;
  onDismissError: () => void;
  draftPrompt: string;
  onChooseReply?: (reply: string) => void;
  currentMission?: string;
  missionPresets?: Array<{ id: string; label: string; icon: string }>;
  onSelectMission?: (mission: string) => void;
  mode?: ChatMode;
  onToggleMode?: (newMode: ChatMode) => void;
}

const QUICK_QUESTIONS = [
  { label: 'เปรียบเทียบทางเลือก', prompt: 'ช่วยเปรียบเทียบทางเลือก พร้อมข้อดี ข้อเสีย และความเสี่ยงที่ควรพิจารณา' },
  { label: 'ตรวจสอบข้อเท็จจริง', prompt: 'ช่วยแยกข้อเท็จจริง ข้ออนุมาน และข้อมูลที่ยังต้องตรวจสอบ' },
  { label: 'วางแผนแก้ปัญหา', prompt: 'ช่วยวิเคราะห์สาเหตุของปัญหาและเสนอขั้นตอนแก้ไขที่ทำได้จริง' },
];

const QUESTION_GROUPS = [
  { title: "คำถามทั่วไปและการสื่อสาร", questions: [
    { label: "ถามเรื่องทั่วไป", prompt: "อธิบายประเด็นที่ฉันสนใจด้วยภาษาที่เข้าใจง่าย และถามกลับหากยังไม่ทราบหัวข้อ" },
    { label: "สรุปเนื้อหา", prompt: "สรุปข้อมูลที่ฉันให้โดยแยกสาระสำคัญและสิ่งที่ยังไม่ชัดเจน" },
    { label: "เขียนและปรับข้อความ", prompt: "ช่วยร่างหรือปรับข้อความให้เหมาะกับกลุ่มเป้าหมายและวัตถุประสงค์" },
    { label: "แปลและอธิบายศัพท์", prompt: "ช่วยแปลหรืออธิบายคำศัพท์ตามบริบท โดยคงความหมายเดิม" },
  ] },
  { title: "การตัดสินใจและกลยุทธ์", questions: [
    { label: "วิเคราะห์ทางเลือก", prompt: "เปรียบเทียบทางเลือกที่เกี่ยวข้องกับสถานการณ์นี้ พร้อมข้อดี ข้อเสีย และเกณฑ์ตัดสินใจ" },
    { label: "วิเคราะห์กลยุทธ์", prompt: "วิเคราะห์เป้าหมาย กลยุทธ์ที่เป็นไปได้ เงื่อนไขความสำเร็จ และความเสี่ยง" },
    { label: "จัดลำดับความสำคัญ", prompt: "จัดลำดับงานหรือทางเลือกตามผลกระทบ ความเร่งด่วน และทรัพยากร" },
    { label: "ตรวจสอบสมมติฐาน", prompt: "ตั้งสมมติฐานหลายทางเลือกและระบุหลักฐานที่ต้องใช้ตรวจสอบ" },
  ] },
  { title: "ความเสี่ยง หลักฐาน และธรรมาภิบาล", questions: [
    { label: "ประเมินความเสี่ยง", prompt: "ระบุความเสี่ยง โอกาสเกิด ผลกระทบ และวิธีลดความเสี่ยง โดยไม่สร้างตัวเลขที่ไม่มีข้อมูล" },
    { label: "ตรวจสอบข้อเท็จจริง", prompt: "แยกข้อเท็จจริง ข้ออนุมาน และสิ่งที่ยังไม่มีหลักฐาน พร้อมระบุวิธีตรวจสอบ" },
    { label: "ประเมินคุณภาพหลักฐาน", prompt: "ตรวจสอบแหล่งที่มา ความน่าเชื่อถือ ความทันสมัย และข้อจำกัดของหลักฐานที่ให้" },
    { label: "ตรวจสอบนโยบาย", prompt: "วิเคราะห์ความสอดคล้องกับนโยบายหรือมาตรฐานที่ระบุ โดยแยกข้อกำหนดจริงจากข้อเสนอแนะ" },
  ] },
  { title: "ธุรกิจ การเงิน และการตลาด", questions: [
    { label: "วางแผนธุรกิจ", prompt: "ช่วยวางแผนธุรกิจจากกลุ่มลูกค้า คุณค่า ต้นทุน รายได้ และข้อจำกัดที่ระบุ" },
    { label: "วิเคราะห์ต้นทุนและผลตอบแทน", prompt: "คำนวณต้นทุน รายได้ จุดคุ้มทุน และสถานการณ์จำลองจากตัวเลขที่ให้ พร้อมบอกสมมติฐาน" },
    { label: "วิเคราะห์ลูกค้าและตลาด", prompt: "วิเคราะห์กลุ่มเป้าหมาย ความต้องการ คู่แข่ง และแนวทางทดสอบตลาด" },
    { label: "วางแผนคอนเทนต์", prompt: "ออกแบบแนวคิดคอนเทนต์ ช่องทาง สารหลัก และวิธีวัดผลให้เหมาะกับเป้าหมาย" },
  ] },
  { title: "เทคโนโลยีและการพัฒนาซอฟต์แวร์", questions: [
    { label: "ตรวจสอบโค้ด", prompt: "รีวิวโค้ดหรือสถาปัตยกรรมที่ให้เพื่อหาข้อผิดพลาด ความเสี่ยง และแนวทางปรับปรุง" },
    { label: "วิเคราะห์บั๊ก", prompt: "ช่วยแยกอาการ สาเหตุที่เป็นไปได้ วิธีตรวจสอบ และแนวทางแก้ปัญหาอย่างเป็นขั้นตอน" },
    { label: "ออกแบบระบบ", prompt: "ช่วยออกแบบระบบโดยพิจารณาความต้องการ ข้อมูล API ความปลอดภัย และการขยายระบบ" },
    { label: "วางแผนการทดสอบ", prompt: "สร้างกรณีทดสอบ ครอบคลุมกรณีปกติ ขอบเขตผิดปกติ และเกณฑ์ผ่าน" },
  ] },
  { title: "การเรียนรู้ วิจัย และการคิดเชิงลึก", questions: [
    { label: "อธิบายแบบเป็นขั้นตอน", prompt: "สอนหัวข้อที่ต้องการเป็นขั้นตอน พร้อมตัวอย่างและตรวจความเข้าใจ" },
    { label: "ตั้งคำถามเชิงลึก", prompt: "ตั้งคำถามเชิงลึกเพื่อสำรวจปัญหา สมมติฐาน และสิ่งที่อาจมองข้าม" },
    { label: "เปรียบเทียบแนวคิด", prompt: "เปรียบเทียบทฤษฎีหรือมุมมองที่เกี่ยวข้อง พร้อมจุดแข็งและข้อจำกัด" },
    { label: "ออกแบบการวิจัย", prompt: "ช่วยกำหนดคำถามวิจัย วิธีเก็บข้อมูล ตัวแปร และข้อจำกัดเชิงระเบียบวิธี" },
  ] },
  { title: "การวางแผนและแก้ปัญหา", questions: [
    { label: "วางแผนลงมือทำ", prompt: "แปลงเป้าหมายเป็นขั้นตอนที่ทำได้จริง พร้อมลำดับงานและตัวชี้วัด" },
    { label: "วิเคราะห์สาเหตุราก", prompt: "แยกอาการจากสาเหตุที่เป็นไปได้ และเสนอวิธีตรวจสอบก่อนสรุป" },
    { label: "สร้างแผนสำรอง", prompt: "จัดทำแผนสำรองและสัญญาณเตือนเมื่อแผนหลักไม่เป็นไปตามคาด" },
    { label: "ทบทวนผลลัพธ์", prompt: "ช่วยประเมินผลที่เกิดขึ้น เทียบกับเป้าหมาย และระบุบทเรียนเพื่อปรับปรุง" },
  ] },
];

export const MobileChatLayout: React.FC<MobileChatLayoutProps> = ({
  currentTurns,
  isAnalyzing,
  streamingStage,
  streamingResponseText,
  lightGovernanceNotice,
  streamingTokens,
  isTokenEstimated,
  onSendPrompt,
  onCancelAnalysis,
  onOpenSettings,
  onOpenAuth,
  isAuthenticated,
  isAdmin = false,
  remainingQuota,
  tone,
  deepReasoning,
  webSearch,
  onToggleWebSearch,
  reasoningProfile,
  errorMessage,
  onDismissError,
  draftPrompt,
  onChooseReply,
  currentMission,
  missionPresets = [],
  onSelectMission,
  mode = 'governed',
  onToggleMode,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { openDrawer, activeConversation, createNewConversation } = useConversation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement>(null);
  const shouldFollowRef = useRef(true);
  const [userRoleContext, setUserRoleContext] = useState('');
  const [situationContext, setSituationContext] = useState('');
  const [goalContext, setGoalContext] = useState('');
  const [constraintsContext, setConstraintsContext] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<{ label: string; prompt: string } | null>(null);
  const [questionDraft, setQuestionDraft] = useState<string | undefined>(undefined);
  const composeContextQuestion = () => {
    if (!selectedQuestion) return;
    const context = [
      userRoleContext.trim() && `บทบาทของผู้ถาม: ${userRoleContext.trim()}`,
      situationContext.trim() && `สถานการณ์/เรื่องที่ต้องการวิเคราะห์: ${situationContext.trim()}`,
      goalContext.trim() && `เป้าหมาย: ${goalContext.trim()}`,
      constraintsContext.trim() && `ข้อจำกัดและข้อมูลที่มี: ${constraintsContext.trim()}`,
    ].filter(Boolean);
    setQuestionDraft([selectedQuestion.prompt, ...context, 'หากข้อมูลสำคัญไม่เพียงพอ ให้ถามเพื่อขอรายละเอียดก่อนสรุป ไม่สมมติข้อเท็จจริงเกี่ยวกับผู้ใช้'].join('\n\n'));
  };

  // Follow incoming messages only while the reader is near the bottom.
  // Avoid scrollIntoView: it can scroll the outer page on mobile browsers.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el && shouldFollowRef.current) el.scrollTop = el.scrollHeight;
  }, [currentTurns.length, streamingResponseText]);

  return (
    <div
      className={`firekeeper-document-surface flex flex-col h-full w-full min-h-0 min-w-0 overflow-hidden ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#060a16] text-white'
      }`}
    >
      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="bg-rose-950/90 border-b border-rose-500/60 p-3 flex items-center justify-between text-rose-100 text-xs shrink-0 z-20">
          <div className="flex items-center space-x-2 min-w-0 pr-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {errorMessage.includes('AUTH') && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-2 py-1 rounded bg-amber-500 text-black font-bold text-[10px]"
              >
                เข้าสู่ระบบ
              </button>
            )}
            <button type="button" onClick={onDismissError} className="p-1 text-rose-300">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {lightGovernanceNotice && (
        <div role="status" className={`shrink-0 border-b px-3 py-2 text-xs ${isLight ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-amber-500/30 bg-amber-500/10 text-amber-200'}`}>
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{lightGovernanceNotice}</p>
          </div>
        </div>
      )}

      {/* Document-style Chat Container */}
      <main ref={scrollContainerRef} onScroll={(e) => { const el = e.currentTarget; shouldFollowRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120; }} className="firekeeper-chat-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-5 py-3 sm:py-4 space-y-3 min-h-0 min-w-0 w-full max-w-3xl mx-auto">
        <details className={`rounded-xl border ${isLight ? 'border-slate-200 bg-white' : 'border-slate-700 bg-[#101827]'}`}>
          <summary className="cursor-pointer select-none px-3 py-3 text-sm font-semibold">ตั้งคำถามตามกลุ่ม <span className="text-xs font-normal opacity-60">เลือกหัวข้อเพื่อเริ่มถาม</span></summary>
          <div className="space-y-3 border-t border-slate-500/20 p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="text-xs">บทบาทของคุณ (ไม่บังคับ)<input value={userRoleContext} onChange={e => setUserRoleContext(e.target.value)} placeholder="เช่น เจ้าของกิจการ นักพัฒนา ผู้เรียน" className="mt-1 w-full rounded-lg border border-slate-600 bg-transparent p-2.5" /></label>
              <label className="text-xs">สถานการณ์หรือบริบท<input value={situationContext} onChange={e => setSituationContext(e.target.value)} placeholder="กำลังพบปัญหาอะไร หรือวิเคราะห์เรื่องใด" className="mt-1 w-full rounded-lg border border-slate-600 bg-transparent p-2.5" /></label>
              <label className="text-xs">เป้าหมาย<input value={goalContext} onChange={e => setGoalContext(e.target.value)} placeholder="อยากได้ผลลัพธ์แบบไหน" className="mt-1 w-full rounded-lg border border-slate-600 bg-transparent p-2.5" /></label>
              <label className="text-xs">ข้อจำกัด / ข้อมูลที่มี<input value={constraintsContext} onChange={e => setConstraintsContext(e.target.value)} placeholder="เช่น งบ เวลา หลักฐาน" className="mt-1 w-full rounded-lg border border-slate-600 bg-transparent p-2.5" /></label>
            </div>
            {selectedQuestion && <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/40 p-2 text-xs"><span>หัวข้อที่เลือก: <strong>{selectedQuestion.label}</strong></span><button type="button" onClick={composeContextQuestion} className="rounded-lg bg-amber-500 px-3 py-2 font-semibold text-black">สร้างคำถามในช่องแชท</button><button type="button" onClick={() => setSelectedQuestion(null)} className="rounded-lg border border-slate-600 px-3 py-2">ยกเลิก</button></div>}
            {QUESTION_GROUPS.map(group => (
              <section key={group.title}>
                <h2 className="mb-2 text-xs font-semibold text-amber-500">{group.title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.questions.map(question => (
                    <button key={question.label} type="button"
                      disabled={isAnalyzing}
                      onClick={() => setSelectedQuestion(question)}
                      title={question.prompt}
                      className={`rounded-lg border p-2.5 text-left text-xs transition-colors disabled:opacity-50 ${isLight ? 'border-slate-200 hover:border-amber-500' : 'border-slate-700 hover:border-amber-500/70'}`}>
                      <span className="block font-semibold">{question.label}</span>
                      <span className="mt-1 block text-[11px] opacity-65">{question.prompt}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </details>
        {currentTurns.length === 0 && !isAnalyzing ? (
          /* Empty State: Centered Firekeeper Branding & Quick Prompt Cards */
          <div className="flex flex-col items-center justify-center min-h-0 text-center px-2 sm:px-4 py-5 sm:py-8 space-y-3 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.25)]">
              <Flame className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">วันนี้อยากวิเคราะห์เรื่องอะไร?</h1>
              <p className={`text-xs font-mono mt-1 font-semibold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                FIREKEEPER · AI assists. Humans decide.
              </p>
              <p className={`text-xs mt-2 max-w-xs mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                พิมพ์คำถามด้านล่าง หรือเลือกตัวอย่างเพื่อเริ่มต้น
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 w-full max-w-xl" aria-label="คำถามตัวอย่าง">
              {QUICK_QUESTIONS.map(item => (
                <button key={item.label} type="button" onClick={() => setQuestionDraft(item.prompt)}
                  className={`rounded-full border px-3 py-2 text-xs sm:text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 ${isLight ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100' : 'border-white/20 bg-white/5 text-slate-200 hover:bg-white/10'}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Conversation History */
          <div className="space-y-4">
            {currentTurns.map((turn, idx) => (
              <MessageBubble
                key={turn.id || `turn-${idx}`}
                turn={turn}
                turnIndex={idx}
                isAdmin={isAdmin}
                remainingQuota={idx === currentTurns.map(t => t.role).lastIndexOf('user') ? remainingQuota : undefined}
                previousTurn={idx > 0 ? currentTurns[idx - 1] : undefined}
                showReplyChoices={!isAnalyzing && idx === currentTurns.length - 1}
                onChooseReply={onChooseReply}
              />
            ))}

            {isAnalyzing && (
              <StreamingMessageBubble
                streamingStage={streamingStage}
                streamingText={streamingResponseText}
                streamingTokens={streamingTokens}
                isTokenEstimated={isTokenEstimated}
                onยกเลิก={onCancelAnalysis}
              />
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Docked Mobile Composer */}
      <footer className={`shrink-0 min-w-0 w-full border-t p-2 sm:p-3 ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#060a16] border-white/10 text-slate-100'
      }`}>
        <div className="max-w-3xl mx-auto w-full">
          <MobileComposer
            onSendPrompt={onSendPrompt}
            isLoading={isAnalyzing}
            onCancel={onCancelAnalysis}
            tone={tone}
            deepReasoning={deepReasoning}
            webSearch={webSearch}
            onToggleWebSearch={onToggleWebSearch}
            reasoningProfile={reasoningProfile}
            onOpenSettings={onOpenSettings}
            isAuthenticated={isAuthenticated}
            onOpenAuth={onOpenAuth}
            externalPrompt={questionDraft ?? draftPrompt}
            mode={mode}
            onToggleMode={onToggleMode}
          />
          <div className={`mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] sm:text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <span>FIREKEEPER</span><span>AI assists. Humans decide.</span>
            <span>© 2026 PUNN</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
