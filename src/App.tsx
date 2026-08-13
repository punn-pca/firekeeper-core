import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PCAProgress } from './components/PCAProgress';
import { ChatInput } from './components/ChatInput';
import { MessageBubble, StreamingMessageBubble } from './components/MessageBubble';
import { PCAStateViewer } from './components/PCAStateViewer';
import { MessageSkeleton, PCAStateSkeleton } from './components/Skeletons';
import { MemoryManager } from './components/MemoryManager';
import { PCAFrameworkInfo } from './components/PCAFrameworkInfo';
import { DiagnosticView } from './components/DiagnosticView';
import { ExportModal } from './components/ExportModal';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { PricingModal } from './components/PricingModal';
import { ConversationDrawer } from './components/ConversationDrawer';
import { HeroWelcomeCard } from './components/HeroWelcomeCard';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { ExamplePromptCards } from './components/ExamplePromptCards';
import { DashboardKpiCards } from './components/DashboardKpiCards';
import { ThaiContextManager } from './components/ThaiContextManager';
import { RedTeamSimulationView } from './components/RedTeamSimulationView';
import { SettingsSlideBar } from './components/SettingsSlideBar';
import { LayeredRoleSelector, DashboardLayer } from './components/LayeredRoleSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AttachedFile, ConversationTurn, MemoryItem, PCAState, ToneMode, ReasoningProfile } from './types';
import { INITIAL_MEMORIES, SamplePrompt } from './data/pcaDefaults';
import { Flame, Trash2, Brain, Sparkles, RefreshCw, AlertTriangle, Download, ShieldCheck, Activity, Plus, LayoutGrid, ChevronUp, ChevronDown, EyeOff, Eye } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConversationProvider, useConversation } from './context/ConversationContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { PipelineEmptyState } from './components/PipelineEmptyState';
import { ContextCompressionViewer } from './components/ContextCompressionViewer';
import { APP_CONFIG } from './config/env';
import { estimateTokenCount } from './utils/tokenUtils';
import { getThemeTokens } from './utils/themeTokens';

function MainWorkspace() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  const [activeTab, setActiveTab] = useState<'chat' | 'pipeline' | 'memory' | 'docs' | 'diagnostic' | 'thai_context' | 'red_team'>('chat');
  const [memories, setMemories] = useState<MemoryItem[]>(INITIAL_MEMORIES);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [streamingStage, setStreamingStage] = useState<string>('');
  const [streamingResponseText, setStreamingResponseText] = useState<string>('');
  const [streamingTokens, setStreamingTokens] = useState<number>(0);
  const [isTokenEstimated, setIsTokenEstimated] = useState<boolean>(true);
  const [latestPcaState, setLatestPcaState] = useState<PCAState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSecurityAuditModalOpen, setIsSecurityAuditModalOpen] = useState(false);
  const [isSettingsSlideBarOpen, setIsSettingsSlideBarOpen] = useState(false);
  const [isChatBoxCollapsed, setIsChatBoxCollapsed] = useState(false);

  // Widget Visibility State (Persisted in localStorage)
  const [widgetVisibility, setWidgetVisibility] = useState<{
    pipelineProgress: boolean;
    heroWelcome: boolean;
    configurationPanel: boolean;
    examplePrompts: boolean;
    kpiCards: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('fire_keeper_widget_visibility');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      pipelineProgress: true,
      heroWelcome: true,
      configurationPanel: true,
      examplePrompts: true,
      kpiCards: true,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('fire_keeper_widget_visibility', JSON.stringify(widgetVisibility));
    } catch (e) {}
  }, [widgetVisibility]);

  const [currentLayer, setCurrentLayer] = useState<DashboardLayer>('executive');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLayerChange = (layer: DashboardLayer) => {
    setCurrentLayer(layer);
    if (layer === 'executive') {
      setWidgetVisibility({
        pipelineProgress: false,
        heroWelcome: true,
        configurationPanel: false,
        examplePrompts: false,
        kpiCards: true,
      });
    } else if (layer === 'analyst') {
      setWidgetVisibility({
        pipelineProgress: true,
        heroWelcome: true,
        configurationPanel: true,
        examplePrompts: true,
        kpiCards: true,
      });
    } else if (layer === 'auditor') {
      setWidgetVisibility({
        pipelineProgress: true,
        heroWelcome: true,
        configurationPanel: false,
        examplePrompts: false,
        kpiCards: true,
      });
    } else if (layer === 'developer') {
      setWidgetVisibility({
        pipelineProgress: true,
        heroWelcome: false,
        configurationPanel: true,
        examplePrompts: false,
        kpiCards: true,
      });
    }
  };

  // Configuration Panel Controls State
  const [tone, setTone] = useState<ToneMode>('Formal Architect');
  const [deepReasoning, setDeepReasoning] = useState<boolean>(true);
  const [reasoningProfile, setReasoningProfile] = useState<ReasoningProfile>('Auto');

  const { activeConversation, addTurnToActive, createNewConversation, deleteConversation, compressActiveSession, isCompressingActive } = useConversation();
  const { user, trackTokenUsage } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentTurns = activeConversation?.turns || [];

  // Fetch Memories from Backend on Mount
  useEffect(() => {
    fetch('/api/memory')
      .then((res) => res.json())
      .then((data) => {
        if (data.memories && Array.isArray(data.memories) && data.memories.length > 0) {
          setMemories(data.memories);
        }
      })
      .catch((err) => console.warn('Could not load memory bank from server:', err));
  }, []);

  const isScrolledNearBottomRef = useRef(true);

  // Sync latest PCA State from last assistant turn
  useEffect(() => {
    const lastAssistantTurn = [...currentTurns].reverse().find((t) => t.role === 'assistant' && t.pcaState);
    if (lastAssistantTurn?.pcaState) {
      setLatestPcaState(lastAssistantTurn.pcaState);
    }
  }, [currentTurns]);

  // Track if user is near bottom to avoid interrupting manual scroll up
  useEffect(() => {
    const handleScroll = () => {
      const threshold = 160;
      const position = window.innerHeight + window.scrollY;
      const bottom = document.documentElement.scrollHeight;
      isScrolledNearBottomRef.current = bottom - position <= threshold;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll for new user turn, instant 'auto' scroll during rapid token streaming
  useEffect(() => {
    if (activeTab === 'chat' && isScrolledNearBottomRef.current) {
      const behavior = isAnalyzing ? 'auto' : 'smooth';
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  }, [currentTurns, streamingResponseText, isAnalyzing, activeTab]);

  // Handle Prompt Submission with SSE Streaming Real-Time Tokens
  const handleSendPrompt = async (
    promptText: string,
    submitTone: ToneMode = tone,
    submitDeepReasoning: boolean = deepReasoning,
    attachments: AttachedFile[] = [],
    submitReasoningProfile: ReasoningProfile = reasoningProfile
  ) => {
    if ((!promptText.trim() && attachments.length === 0) || isAnalyzing) return;

    const targetSessionId = activeConversation?.id;

    setErrorMessage(null);
    setIsAnalyzing(true);
    setStreamingStage('กำลังเชื่อมต่อเอนจิน FIRE KEEPER และประมวลผลไฟล์แนบ...');
    setStreamingResponseText('');

    const initialPromptTokens = estimateTokenCount(promptText, attachments);
    setStreamingTokens(initialPromptTokens);
    setIsTokenEstimated(true);
    let realTotalTokens: number | undefined = undefined;

    try {
      const token = localStorage.getItem('fire_keeper_auth_token');
      const response = await fetch('/api/pca/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question: promptText,
          tone: submitTone,
          deepReasoning: submitDeepReasoning,
          reasoningProfile: submitReasoningProfile,
          personalContext: user?.preferences?.toneMode || '',
          history: currentTurns.map((t) => ({ role: t.role, content: t.content })),
          attachments,
          compressedContext: activeConversation?.compressedContext,
        }),
      });

      if (!response.ok || !response.body) {
        if (response.status === 413) {
          throw new Error('ขนาดของข้อมูลที่ส่งใหญ่เกินขีดจำกัด (HTTP 413 Payload Too Large)');
        }
        throw new Error(`การเชื่อมต่อเซิร์ฟเวอร์ล้มเหลว (HTTP ${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let finalPcaState: PCAState | null = null;
      let finalCompressedContext: any = null;
      let buffer = '';

      const processEventBlock = (eventStr: string) => {
        if (!eventStr.trim()) return;

        let eventName = 'message';
        let dataStr = '';

        const lines = eventStr.split(/\r?\n/);
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataStr = line.slice(5).trim();
          }
        }

        if (eventName === 'pipeline_stage' && dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            const stageText = parsed.detail || parsed.stage || parsed.message || parsed.description || '';
            setStreamingStage(stageText);
          } catch (e) {}
        } else if (eventName === 'token' && dataStr) {
          let tokenText = '';
          try {
            const parsed = JSON.parse(dataStr);
            tokenText = parsed.token ?? parsed.text ?? parsed.content ?? parsed.answer ?? parsed.chunk ?? parsed.delta ?? parsed.response ?? '';
            const apiTokens = parsed.totalTokens ?? parsed.usageMetadata?.totalTokenCount ?? parsed.tokenUsage?.totalTokens;
            if (typeof apiTokens === 'number' && apiTokens > 0) {
              realTotalTokens = apiTokens;
              setStreamingTokens(apiTokens);
              setIsTokenEstimated(false);
            }
          } catch (e) {
            tokenText = dataStr;
          }

          if (tokenText && typeof tokenText === 'string') {
            accumulatedText += tokenText;
            setStreamingResponseText(accumulatedText);
            if (realTotalTokens === undefined) {
              const currentCompletionEst = estimateTokenCount(accumulatedText);
              setStreamingTokens(initialPromptTokens + currentCompletionEst);
              setIsTokenEstimated(true);
            }
          }
        } else if (eventName === 'complete' && dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            finalPcaState = parsed.pcaState || parsed.result || parsed.state || null;
            finalCompressedContext = parsed.compressedContext || null;
            const completeText =
              parsed.fullResponse ??
              parsed.response ??
              parsed.answer ??
              parsed.content ??
              parsed.text ??
              parsed.pcaState?.response ??
              parsed.pcaState?.answer ??
              parsed.pcaState?.content;
            if (completeText !== undefined && completeText !== null && typeof completeText === 'string') {
              accumulatedText = completeText;
              setStreamingResponseText(accumulatedText);
            }

            const apiTokens = parsed.totalTokens ?? parsed.pcaState?.executiveMetrics?.tokenUsage?.totalTokens ?? parsed.usageMetadata?.totalTokenCount ?? parsed.tokenUsage?.totalTokens;
            if (typeof apiTokens === 'number' && apiTokens > 0) {
              realTotalTokens = apiTokens;
              setStreamingTokens(apiTokens);
              setIsTokenEstimated(false);
            }
          } catch (e) {}
        } else if (eventName === 'error' && dataStr) {
          let errorMsg = dataStr;
          try {
            const parsed = JSON.parse(dataStr);
            errorMsg = parsed.message || parsed.error || dataStr;
          } catch (e) {}
          throw new Error(errorMsg);
        } else if (dataStr) {
          let textCandidate = '';
          try {
            const parsed = JSON.parse(dataStr);
            textCandidate = parsed.token ?? parsed.text ?? parsed.content ?? parsed.answer ?? parsed.response ?? '';
            const apiTokens = parsed.totalTokens ?? parsed.usageMetadata?.totalTokenCount ?? parsed.tokenUsage?.totalTokens;
            if (typeof apiTokens === 'number' && apiTokens > 0) {
              realTotalTokens = apiTokens;
              setStreamingTokens(apiTokens);
              setIsTokenEstimated(false);
            }
          } catch (e) {}

          if (textCandidate && typeof textCandidate === 'string') {
            accumulatedText += textCandidate;
            setStreamingResponseText(accumulatedText);
            if (realTotalTokens === undefined) {
              const currentCompletionEst = estimateTokenCount(accumulatedText);
              setStreamingTokens(initialPromptTokens + currentCompletionEst);
              setIsTokenEstimated(true);
            }
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/(?:\r?\n){2}/);
        buffer = events.pop() || '';

        for (const eventStr of events) {
          processEventBlock(eventStr);
        }
      }

      if (buffer.trim()) {
        processEventBlock(buffer);
      }

      if (!accumulatedText || !accumulatedText.trim()) {
        if (finalPcaState?.response && finalPcaState.response.trim()) {
          accumulatedText = finalPcaState.response;
        } else if ((finalPcaState as any)?.answer && (finalPcaState as any).answer.trim()) {
          accumulatedText = (finalPcaState as any).answer;
        } else if ((finalPcaState as any)?.content && (finalPcaState as any).content.trim()) {
          accumulatedText = (finalPcaState as any).content;
        } else if ((finalPcaState as any)?.text && (finalPcaState as any).text.trim()) {
          accumulatedText = (finalPcaState as any).text;
        } else {
          throw new Error('ไม่ได้รับข้อมูลตอบกลับจากเซิร์ฟเวอร์ (Stream response was empty or disconnected prematurely)');
        }
      }

      const finalTurnTokens = realTotalTokens ?? (initialPromptTokens + estimateTokenCount(accumulatedText));
      const finalIsEstimated = realTotalTokens === undefined;

      if (finalPcaState) {
        setLatestPcaState(finalPcaState);
      }

      addTurnToActive(
        promptText,
        accumulatedText,
        finalPcaState || undefined,
        attachments,
        targetSessionId,
        finalTurnTokens,
        finalIsEstimated,
        finalCompressedContext || undefined
      );

      // Record token consumption in member profile & backend
      if (finalTurnTokens > 0) {
        trackTokenUsage(finalTurnTokens);
      }
    } catch (err) {
      console.error('PCA Stream Error:', err);
      const errText = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการประมวลผลสตรีมมิง';
      setErrorMessage(errText);
    } finally {
      setIsAnalyzing(false);
      setStreamingStage('');
      setStreamingResponseText('');
    }
  };

  const handleSelectSamplePrompt = (sample: SamplePrompt) => {
    setTone(sample.tone);
    setDeepReasoning(sample.deepReasoning);
    handleSendPrompt(sample.prompt, sample.tone, sample.deepReasoning, [], reasoningProfile);
  };

  // Memory Handlers
  const handleAddMemory = async (content: string, layer: MemoryItem['layer'], source: string) => {
    try {
      const token = localStorage.getItem('fire_keeper_auth_token');
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content, layer, source }),
      });
      const data = await res.json();
      if (data.memories) setMemories(data.memories);
    } catch (err) {
      console.error('Failed to add memory:', err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const token = localStorage.getItem('fire_keeper_auth_token');
      const res = await fetch(`/api/memory/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.memories) setMemories(data.memories);
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  const handleOpenExport = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  return (
    <div className={`h-screen max-h-screen overflow-hidden flex flex-col font-sans transition-all ${
      isLight
        ? 'bg-[#F8FAFC] text-[#111827] selection:bg-[#F59E0B] selection:text-white'
        : 'bg-[#060A16] text-white selection:bg-[#F59E0B] selection:text-slate-950'
    }`}>
      {/* Top Navigation Bar (Pinned Header) */}
      <div className="shrink-0">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          memoryCount={memories.length}
          onOpenExport={handleOpenExport}
          onOpenSettings={() => setIsSettingsSlideBarOpen(true)}
        />
      </div>

      {/* Main Container max-w-[1400px] (Fits viewport & scrolls cleanly) */}
      <main className="flex-1 overflow-y-auto min-h-0 max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col space-y-4 sm:space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-center justify-between text-rose-800 text-sm shadow-2xs">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-rose-600 hover:underline font-mono cursor-pointer"
            >
              [Dismiss]
            </button>
          </div>
        )}

        {/* TAB 1: Chat & Executive Analysis View (No Sidebar, Pinned Bottom Chat Input) */}
        {activeTab === 'chat' && (
          <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผล สนทนา & วิเคราะห์">
            <div className={`flex flex-col h-[calc(100vh-80px)] overflow-hidden -mx-3 sm:-mx-6 lg:-mx-8 ${
              isLight ? 'bg-[#F8FAFC]' : 'bg-[#060A16]'
            }`}>
              {/* Scrollable Conversation History & Hero Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
                {/* 1. Compact Status Pill */}
                <div className={`flex items-center justify-between px-4 py-2 rounded-xl text-xs font-mono border ${
                  isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#0E1525] border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-white">PCA • Active</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400">12 Stages Cognitive Matrix</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('pipeline')}
                    className="text-amber-400 hover:text-amber-300 font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Inspect</span>
                    <span>▼</span>
                  </button>
                </div>

                {/* 2. Hero Welcome (Only when no turns) */}
                {currentTurns.length === 0 && widgetVisibility.heroWelcome && (
                  <HeroWelcomeCard hasTurns={false} />
                )}

                {/* 3. Quick Example Prompts (When no turns) */}
                {currentTurns.length === 0 && (
                  <ExamplePromptCards onSelectSample={handleSelectSamplePrompt} />
                )}

                {/* Context Compression View */}
                {(currentTurns.length > 0 || activeConversation?.compressedContext) && (
                  <ContextCompressionViewer
                    compressedContext={activeConversation?.compressedContext}
                    onManualCompress={compressActiveSession}
                    isCompressing={isCompressingActive}
                  />
                )}

                {/* 4. Chat History & Streaming Responses */}
                <div className={`space-y-6 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  {currentTurns.length > 0 && (
                    <div className="flex items-center justify-between pb-2">
                      <h3 className={`text-sm font-bold font-mono flex items-center gap-2 ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        💬 Conversation History ({currentTurns.length} turns)
                      </h3>
                    </div>
                  )}

                  {currentTurns.map((turn, idx) => (
                    <MessageBubble
                      key={idx}
                      turn={turn}
                      onOpenExport={handleOpenExport}
                    />
                  ))}

                  {/* Streaming Message Response */}
                  {isAnalyzing && (
                    <StreamingMessageBubble
                      streamingStage={streamingStage}
                      streamingText={streamingResponseText}
                      streamingTokens={streamingTokens}
                      isTokenEstimated={isTokenEstimated}
                    />
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* 5. Pinned Bottom Chat Input Section (Collapsible) */}
              <div className={`shrink-0 sticky bottom-0 z-30 transition-all ${
                isLight ? 'bg-white/95 border-slate-200 shadow-xl' : 'bg-[#060A16]/95 border-slate-800 shadow-2xl'
              } backdrop-blur-xl border-t`}>
                {isChatBoxCollapsed ? (
                  <div className="max-w-4xl mx-auto w-full px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span>Chat Input is currently hidden (Maximizing View Area)</span>
                    </div>
                    <button
                      onClick={() => setIsChatBoxCollapsed(false)}
                      className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isLight
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 font-bold'
                          : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 font-bold'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>แสดงช่องแชท (Show Chat Box)</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-3 pb-4 px-4 sm:px-6 space-y-3">
                    <div className="max-w-4xl mx-auto w-full space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-amber-500">🔥</span>
                          <span className={`text-xs font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            Ask FIRE KEEPER
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setIsChatBoxCollapsed(true)}
                            title="ซ่อนช่องแชท (Hide Chat Box)"
                            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                              isLight
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                                : 'bg-slate-900 hover:bg-white/10 text-slate-300 border-slate-800'
                            }`}
                          >
                            <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                            <span>ซ่อนช่องแชท</span>
                          </button>

                          {currentTurns.length > 0 && (
                            <>
                              <button
                                onClick={() => createNewConversation()}
                                className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  isLight
                                    ? 'bg-white hover:bg-slate-100 text-slate-900 border-slate-200'
                                    : 'bg-slate-900 hover:bg-white/10 text-white border-slate-800'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5 text-amber-500" />
                                <span>New Session</span>
                              </button>

                              {activeConversation && (
                                <button
                                  onClick={() => {
                                    if (window.confirm('คุณต้องการลบประวัติการสนทนาในเซสชันนี้ใช่หรือไม่?')) {
                                      deleteConversation(activeConversation.id);
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    isLight
                                      ? 'bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-200'
                                      : 'bg-slate-900 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 border-slate-800'
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Clear</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <ChatInput
                        onSend={handleSendPrompt}
                        isLoading={isAnalyzing}
                        tone={tone}
                        setTone={setTone}
                        deepReasoning={deepReasoning}
                        setDeepReasoning={setDeepReasoning}
                        reasoningProfile={reasoningProfile}
                        setReasoningProfile={setReasoningProfile}
                        onSelectSample={handleSelectSamplePrompt}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ErrorBoundary>
        )}

        {/* TAB 2: Pipeline Explorer */}
        {activeTab === 'pipeline' && (
          <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผล Pipeline Explorer">
            <div className="space-y-6">
              <PCAProgress pcaState={latestPcaState} isAnalyzing={isAnalyzing} />
              {isAnalyzing ? (
                <PCAStateSkeleton />
              ) : latestPcaState ? (
                <PCAStateViewer pcaState={latestPcaState} />
              ) : (
                <PipelineEmptyState
                  onStartAnalysis={() => setActiveTab('chat')}
                  onLoadSample={(samplePromptText) => {
                    setActiveTab('chat');
                    handleSendPrompt(samplePromptText);
                  }}
                />
              )}
            </div>
          </ErrorBoundary>
        )}

        {/* TAB 3: Memory Bank Manager */}
        {activeTab === 'memory' && (
          <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผล Memory Bank Manager">
            <MemoryManager
              memories={memories}
              onAddMemory={handleAddMemory}
              onDeleteMemory={handleDeleteMemory}
              isLoading={isAnalyzing}
            />
          </ErrorBoundary>
        )}

        {/* TAB 3.5: Thai Context Layer Manager */}
        {activeTab === 'thai_context' && (
          <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผล Thai Context Layer Manager">
            <ThaiContextManager
              memories={memories}
              onAddMemory={handleAddMemory}
              onDeleteMemory={handleDeleteMemory}
              onSelectSamplePrompt={(p) => {
                setActiveTab('chat');
                handleSendPrompt(p);
              }}
            />
          </ErrorBoundary>
        )}

        {/* TAB 3.7: Red Team Simulation Lab */}
        {activeTab === 'red_team' && (
          <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผล Red Team Simulation Lab">
            <RedTeamSimulationView pcaState={latestPcaState} />
          </ErrorBoundary>
        )}
        {activeTab === 'docs' && (
          <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผล Documentation">
            <PCAFrameworkInfo />
          </ErrorBoundary>
        )}

        {/* TAB 5: System Diagnostics */}
        {activeTab === 'diagnostic' && (
          <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผล System Diagnostics">
            <DiagnosticView />
          </ErrorBoundary>
        )}
      </main>

      {/* Export Modal Dialog */}
      <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการใช้งาน Export Modal">
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          conversationHistory={currentTurns}
          pcaState={latestPcaState}
          memories={memories}
        />
      </ErrorBoundary>

      {/* Security Audit Modal Dialog */}
      <SecurityAuditModal
        isOpen={isSecurityAuditModalOpen}
        onClose={() => setIsSecurityAuditModalOpen(false)}
      />

      {/* Auth Modal, User Profile Modal, Pricing Modal & Session Drawer */}
      <AuthModal />
      <UserProfileModal />
      <PricingModal />
      {/* Settings Slide Bar */}
      <SettingsSlideBar
        isOpen={isSettingsSlideBarOpen}
        onClose={() => setIsSettingsSlideBarOpen(false)}
        reasoningProfile={reasoningProfile}
        setReasoningProfile={setReasoningProfile}
        tone={tone}
        setTone={setTone}
        deepReasoning={deepReasoning}
        setDeepReasoning={setDeepReasoning}
      />

      <ConversationDrawer />

      {/* Executive Footer */}
      <footer className={`shrink-0 border-t py-3.5 sm:py-4 text-xs sm:text-[13px] font-mono shadow-2xs ${
        isLight
          ? 'bg-white border-[#E5E7EB] text-[#4B5563]'
          : 'bg-[#0B1220] border-white/10 text-slate-400'
      }`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 font-medium">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
              <span className={`font-extrabold tracking-wide text-xs sm:text-sm ${
                isLight ? 'text-[#111827]' : 'text-white'
              }`}>FIRE KEEPER · Executive AI OS</span>
            </div>
            <button
              onClick={() => setIsSecurityAuditModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="เปิดเอกสารตรวจสอบความปลอดภัยสำหรับออดิต (ISO 42001 / NIST)"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Security Audit Record (ISO 42001)</span>
            </button>
          </div>
          <span className={`font-sans ${isLight ? 'text-[#6B7280]' : 'text-slate-400'}`}>Preserving Human Agency & Strategic Rigor · PUNN Cognitive Architecture v2.0</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConversationProvider>
          <MainWorkspace />
        </ConversationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
