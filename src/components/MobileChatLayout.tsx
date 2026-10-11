import React, { useRef, useEffect } from 'react';
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

const QUESTION_GROUPS = [
  { title: 'การตัดสินใจและกลยุทธ์', questions: [
    { label: 'วิเคราะห์ทางเลือก', prompt: 'ช่วยเปรียบเทียบทางเลือกที่เป็นไปได้ พร้อมข้อดี ข้อเสีย และเงื่อนไขที่ควรตัดสินใจ' },
    { label: 'วิเคราะห์กลยุทธ์', prompt: 'วิเคราะห์กลยุทธ์การขยายตลาดและประเมินความเสี่ยงเชิงยุทธศาสตร์' },
    { label: 'ตรวจสอบสมมติฐาน', prompt: 'ช่วยตั้งสมมติฐานหลายทางเลือกและระบุหลักฐานที่ต้องใช้ตรวจสอบแต่ละข้อ' },
  ] },
  { title: 'ความเสี่ยงและหลักฐาน', questions: [
    { label: 'ประเมินความเสี่ยง', prompt: 'ประเมินปัจจัยความเสี่ยง โอกาสเกิด ผลกระทบ และแนวทางรับมือ' },
    { label: 'ตรวจสอบนโยบาย', prompt: 'ตรวจสอบนโยบายองค์กรและกำกับดูแลธรรมาภิบาล AI ตามมาตรฐาน' },
    { label: 'แยกข้อเท็จจริง', prompt: 'แยกข้อเท็จจริง ข้ออนุมาน และสิ่งที่ยังไม่มีหลักฐานยืนยันในประเด็นนี้' },
  ] },
  { title: 'ช่วยคิดและเรียนรู้', questions: [
    { label: 'ตั้งคำถามเชิงลึก', prompt: 'ช่วยตั้งคำถามเชิงลึก 10 ข้อเพื่อทำความเข้าใจปัญหาและหาจุดที่อาจมองข้าม' },
    { label: 'มุมมองที่แตกต่าง', prompt: 'ช่วยเสนอมุมมองที่แตกต่างและข้อโต้แย้งต่อแนวคิดนี้' },
    { label: 'วางแผนลงมือทำ', prompt: 'ช่วยแตกปัญหานี้เป็นขั้นตอนที่ทำได้จริง พร้อมลำดับความสำคัญ' },
  ] },
];

export const MobileChatLayout: React.FC<MobileChatLayoutProps> = ({
  currentTurns,
  isAnalyzing,
  streamingStage,
  streamingResponseText,
  streamingTokens,
  isTokenEstimated,
  onSendPrompt,
  onCancelAnalysis,
  onOpenSettings,
  onOpenAuth,
  isAuthenticated,
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

  // Auto scroll to bottom when new streaming token or turn is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentTurns.length, streamingResponseText]);

  return (
    <div
      className={`firekeeper-document-surface flex flex-col h-full w-full overflow-hidden ${
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

      {/* Document-style Chat Container */}
      <main className="firekeeper-chat-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-5 py-4 space-y-4 min-h-0 min-w-0 w-full max-w-3xl mx-auto">
        <details className={`rounded-xl border ${isLight ? 'border-slate-200 bg-white' : 'border-slate-700 bg-[#101827]'}`}>
          <summary className="cursor-pointer select-none px-3 py-3 text-sm font-semibold">ตั้งคำถามตามกลุ่ม <span className="text-xs font-normal opacity-60">เลือกหัวข้อเพื่อเริ่มถาม</span></summary>
          <div className="space-y-3 border-t border-slate-500/20 p-3">
            {QUESTION_GROUPS.map(group => (
              <section key={group.title}>
                <h2 className="mb-2 text-xs font-semibold text-amber-500">{group.title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.questions.map(question => (
                    <button key={question.label} type="button"
                      disabled={isAnalyzing}
                      onClick={() => onSendPrompt(question.prompt, tone, deepReasoning, [], reasoningProfile)}
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
          <div className="flex flex-col items-center justify-center min-h-[min(55vh,440px)] text-center px-2 sm:px-4 space-y-4 sm:space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.25)]">
              <Flame className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-mono tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500 uppercase">
                FIREKEEPER
              </h1>
              <p className="text-xs text-amber-400 font-mono mt-1 font-semibold">
                PUNN PREDICTIVE COGNITIVE ARCHITECTURE (PCA v3.0)
              </p>
              <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
                Decision Intelligence Workspace • คิดให้ลึกซึ้ง • ตรวจสอบความน่าเชื่อถือ • ตัดสินใจอย่างปลอดภัย
              </p>
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
      <footer className={`shrink-0 border-t p-2 sm:p-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#060a16] border-white/10'
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
            externalPrompt={draftPrompt}
            mode={mode}
            onToggleMode={onToggleMode}
          />
        </div>
      </footer>
    </div>
  );
};
