import React, { useRef, useEffect } from 'react';
import { Menu, Plus, Flame, Sparkles, Sliders, Globe, AlertTriangle, LogIn, Trash2, FileText, ChevronDown } from 'lucide-react';
import { MessageBubble, StreamingMessageBubble } from './MessageBubble';
import { Chatข้อมูลนำเข้า } from './Chatข้อมูลนำเข้า';
import { Turn, ToneMode, ReasoningProfile, AttachedFile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useModel } from '../context/ModelContext';

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
  onOpenDrawer: () => void;
  onNewChat: () => void;
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
  onOpenDrawer,
  onNewChat,
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
  const { selectedModel } = useModel();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new streaming token or turn is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentTurns.length, streamingResponseText]);

  return (
    <div className={`flex flex-col h-screen w-full overflow-hidden ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#060a16] text-white'
    }`}>
      {/* ChatGPT-Style Top Header Bar */}
      <header className={`shrink-0 h-14 px-3 flex items-center justify-between border-b z-30 ${
        isLight ? 'bg-white/95 border-slate-200' : 'bg-[#060a16]/95 border-white/10'
      } backdrop-blur-md`}>
        {/* Left: Navigation Menu */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/10 text-slate-200'
          }`}
          title="เปิดเมนู"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Center: App Title & Model Badge */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={onOpenSettings}>
          <Flame className="w-4 h-4 text-amber-500" />
          <span className="font-mono font-extrabold text-sm tracking-wider uppercase">FIRE KEEPER</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <span>{selectedModel.slice(0, 10)}</span>
            <ChevronDown className="w-3 h-3 text-amber-400" />
          </span>
        </div>

        {/* Right: New Chat (+) */}
        <button
          type="button"
          onClick={onNewChat}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            isLight ? 'hover:bg-slate-100 text-amber-600' : 'hover:bg-white/10 text-amber-400'
          }`}
          title="สนทนาใหม่"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* Error Alert */}
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

      {/* Chat Messages Body Area */}
      <main className="flex-1 overflow-y-auto px-3 py-4 space-y-4 min-h-0 w-full max-w-3xl mx-auto">
        {currentTurns.length === 0 ? (
          /* Empty State: Sleek ChatGPT Greeting */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <Flame className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold font-mono tracking-wider">FIRE KEEPER</h1>
              <p className="text-xs text-amber-400 font-mono mt-1">PUNN PREDICTIVE COGNITIVE ARCHITECTURE (PCA v3.0)</p>
              <p className="text-xs text-slate-400 mt-2">คิดให้ลึกซึ้ง • ตัดสินใจให้ปลอดภัย • วิเคราะห์เชิงประจักษ์</p>
            </div>

            {/* Quick Prompt Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md pt-4">
              {QUICK_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSendPrompt(item.prompt, tone, deepReasoning, [], reasoningProfile)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
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
              <MessageBubble
                key={turn.id || `turn-${idx}`}
                turn={turn}
                turnIndex={idx}
                previousTurn={idx > 0 ? currentTurns[idx - 1] : undefined}
              />
            ))}

            {isAnalyzing && (
              <StreamingMessageBubble
                streamingStage={streamingStage}
                streamingText={streamingResponseText}
                streamingTokens={streamingTokens}
                isTokenEstimated={isTokenEstimated}
                onยกเลิก={onCancelAnalysis}
                modelName={selectedModel}
              />
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* ChatGPT Docked Input Footer */}
      <footer className={`shrink-0 border-t p-2 sm:p-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#060a16] border-white/10'
      }`}>
        <div className="max-w-3xl mx-auto w-full">
          <Chatข้อมูลนำเข้า
            onส่ง={onSendPrompt}
            isLoading={isAnalyzing}
            onยกเลิก={onCancelAnalysis}
            tone={tone}
            deepReasoning={deepReasoning}
            webSearch={webSearch}
            onToggleWebSearch={onToggleWebSearch}
            reasoningProfile={reasoningProfile}
            selectedModel={selectedModel}
            onOpenตั้งค่า={onOpenSettings}
            isAuthenticated={isAuthenticated}
            onOpenAuth={onOpenAuth}
            externalPrompt={draftPrompt}
          />
        </div>
      </footer>
    </div>
  );
};
