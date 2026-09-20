import React, { useRef, useEffect } from 'react';
import { Flame, AlertTriangle } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { MobileComposer } from './MobileComposer';
import { StreamingMessageBubble } from './MessageBubble';
import { Turn, ToneMode, ReasoningProfile, AttachedFile } from '../types';
import { useTheme } from '../context/ThemeContext';

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
}

const QUICK_PROMPTS = [
  { label: '⚡ วิเคราะห์กลยุทธ์', prompt: 'วิเคราะห์กลยุทธ์การขยายตลาดและประเมินความเสี่ยงเชิงยุทธศาสตร์' },
  { label: '🛡️ ตรวจสอบนโยบาย', prompt: 'ตรวจสอบนโยบายองค์กรและกำกับดูแลธรรมาภิบาล AI ตามมาตรฐาน' },
  { label: '📊 ประเมินความเสี่ยง', prompt: 'ประเมินปัจจัยความเสี่ยงและแนวทางการรับมือทางธุรกิจ' },
  { label: '💡 คิดค้นสมมติฐาน', prompt: 'สรุปสมมติฐานหลักและฉากทัศน์ที่เป็นไปได้ (Scenarios)' },
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
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
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
      <main className="flex-1 overflow-y-auto px-3 py-4 space-y-4 min-h-0 w-full max-w-3xl mx-auto">
        {currentTurns.length === 0 && !isAnalyzing ? (
          /* Empty State: Centered Firekeeper Branding & Quick Prompt Cards */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6 animate-fadeIn">
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

            {/* Quick Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md pt-2">
              {QUICK_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSendPrompt(item.prompt, tone, deepReasoning, [], reasoningProfile)}
                  className={`p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    isLight
                      ? 'bg-white border-slate-200 hover:border-amber-500 text-slate-800 shadow-xs'
                      : 'bg-white/[0.03] border-white/10 hover:border-amber-500/40 text-slate-200 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="font-semibold block mb-1">{item.label}</span>
                  <span className="text-[11px] text-slate-400 line-clamp-1">{item.prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Conversation History */
          <div className="space-y-4">
            {currentTurns.map((turn, idx) => (
              <ChatMessage
                key={turn.id || `turn-${idx}`}
                turn={turn}
                turnIndex={idx}
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
          />
        </div>
      </footer>
    </div>
  );
};
