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
import { GlossaryModal } from './components/GlossaryModal';
import { EnterpriseTrustModal, TrustTab } from './components/EnterpriseTrustModal';
import { ShareModal } from './components/ShareModal';
import { safeLocalStorage } from './utils/safeStorage';

import { ConversationDrawer } from './components/ConversationDrawer';
import { HeroWelcomeCard } from './components/HeroWelcomeCard';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { ExamplePromptCards } from './components/ExamplePromptCards';
import { DashboardKpiCards } from './components/DashboardKpiCards';
import { ThaiContextManager } from './components/ThaiContextManager';
import { RedTeamSimulationView } from './components/RedTeamSimulationView';
import { LayeredRoleSelector, DashboardLayer } from './components/LayeredRoleSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AttachedFile, ConversationTurn, MemoryItem, PCAState, ToneMode, ReasoningProfile } from './types';
import { INITIAL_MEMORIES, SamplePrompt } from './data/pcaDefaults';
import { Flame, Trash2, Brain, Sparkles, RefreshCw, AlertTriangle, Download, ShieldCheck, Activity, Plus, LayoutGrid, ChevronUp, ChevronDown, EyeOff, Eye } from 'lucide-react';

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
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isTrustModalOpen, setIsTrustModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [trustModalInitialTab, setTrustModalInitialTab] = useState<TrustTab>('about');
  const [isChatBoxCollapsed, setIsChatBoxCollapsed] = useState(false);

  // Executive Current Mission Directive
  const [currentMission, setCurrentMission] = useState<string>('Enterprise Decision Intelligence');
  const [isMissionSelectorOpen, setIsMissionSelectorOpen] = useState<boolean>(false);

  const MISSION_PRESETS = [
    { id: 'm1', label: 'Enterprise Decision Intelligence', icon: '⚡' },
    { id: 'm2', label: 'Executive Dossier & CAPEX Allocation', icon: '🏢' },
    { id: 'm3', label: 'Red Team Threat Model & Supply Audit', icon: '🛡️' },
    { id: 'm4', label: 'ISO 42001 & Regulatory Governance', icon: '⚖️' },
    { id: 'm5', label: 'M&A Due Diligence & Expansion Risk', icon: '🎯' },
  ];

  const PIPELINE_STEPPER_STAGES = [
    { id: 's1', label: 'Input', thai: 'รับคำสั่ง', icon: '📥' },
    { id: 's2', label: 'Context', thai: 'บริบท', icon: '🧠' },
    { id: 's3', label: 'PCA v2', thai: '12-Stage', icon: '⚡' },
    { id: 's4', label: 'Governance', thai: 'ISO 42001', icon: '🛡️' },
    { id: 's5', label: 'Validation', thai: 'สอบทาน', icon: '⚖️' },
    { id: 's6', label: 'Executive Dossier', thai: 'รายงาน', icon: '📊' },
  ];

  // Widget Visibility State (Persisted in localStorage)
  const [widgetVisibility, setWidgetVisibility] = useState<{
    pipelineProgress: boolean;
    heroWelcome: boolean;
    configurationPanel: boolean;
    examplePrompts: boolean;
    kpiCards: boolean;
  }>(() => {
    try {
      const saved = safeLocalStorage.getItem('fire_keeper_widget_visibility');
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
      safeLocalStorage.setItem('fire_keeper_widget_visibility', JSON.stringify(widgetVisibility));
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

  const { activeConversation, addTurnToActive, createNewConversation, deleteConversation, compressActiveSession, isCompressingActive, openDrawer } = useConversation();

  const currentTurns = activeConversation?.turns || [];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestTurnRef = useRef<HTMLDivElement>(null);
  const prevTurnsLengthRef = useRef<number>(currentTurns.length);

  // Scroll to top of answers when a new turn is added (analysis completed)
  useEffect(() => {
    if (currentTurns.length > prevTurnsLengthRef.current) {
      latestTurnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    prevTurnsLengthRef.current = currentTurns.length;
  }, [currentTurns.length]);

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
      const token = safeLocalStorage.getItem('fire_keeper_auth_token');
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
          personalContext: '',
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
      const token = safeLocalStorage.getItem('fire_keeper_auth_token');
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
      const token = safeLocalStorage.getItem('fire_keeper_auth_token');
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
          onOpenGlossary={() => setIsGlossaryOpen(true)}
          onOpenTrustCenter={(tab) => {
            setTrustModalInitialTab(tab || 'about');
            setIsTrustModalOpen(true);
          }}
          onOpenShare={() => setIsShareModalOpen(true)}
        />
      </div>

      {/* Main Container max-w-[1400px] (Fits viewport & scrolls cleanly) */}
      <main className="flex-1 overflow-y-auto min-h-0 max-w-[1400px] w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-6 flex flex-col space-y-3 sm:space-y-6 overflow-x-hidden">
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

        {/* TAB 1: Chat & Executive Analysis View (Enterprise Decision Intelligence Layout) */}
        {activeTab === 'chat' && (
          <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผล สนทนา & วิเคราะห์">
            <div className={`flex flex-col h-[calc(100dvh-120px)] sm:h-[calc(100vh-105px)] min-h-[500px] max-w-5xl mx-auto w-full rounded-2xl border overflow-hidden ${
              isLight ? 'bg-[#F8FAFC] border-slate-200 shadow-sm' : 'bg-[#060A16] border-slate-800/80 shadow-2xl'
            }`}>
              {/* 1. Consolidated High-Legibility Status Bar with Live Pipeline Stepper */}
              <div className={`shrink-0 flex flex-wrap items-center justify-between px-2.5 sm:px-4 py-1.5 sm:py-2 border-b text-xs font-mono gap-1.5 sm:gap-2 ${
                isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#0B1220] border-slate-800 text-slate-300'
              }`}>
                {/* System Readiness Flags */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <div className="flex items-center space-x-1 sm:space-x-1.5 px-1.5 sm:px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] sm:text-[11px]">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Ready</span>
                  </div>

                  <div className="flex items-center space-x-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold text-[10px] sm:text-[11px]">
                    <span>⚡</span>
                    <span className="hidden xs:inline">PCA Auto</span>
                    <span className="xs:hidden">PCA</span>
                  </div>

                  <div className="hidden sm:flex items-center space-x-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-800/70 border border-slate-700/60 text-slate-300 font-semibold text-[10px] sm:text-[11px]">
                    <span className="text-emerald-400">●</span>
                    <span>Memory ON</span>
                  </div>

                  <div className="hidden md:flex items-center space-x-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold text-[10px] sm:text-[11px]">
                    <span>🛡️</span>
                    <span>ISO 42001</span>
                  </div>
                </div>

                {/* 3. Responsive Pipeline Stepper Bar: Consolidated on mobile, full stepper on md+ */}
                <div className="flex items-center space-x-1 py-0.5 ml-auto">
                  {/* Mobile Compact Pipeline Pill (< md) */}
                  <div className="flex md:hidden items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('pipeline')}
                      className={`px-2 py-0.5 rounded text-[10px] flex items-center space-x-1.5 transition-all cursor-pointer ${
                        isAnalyzing
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse font-bold'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60'
                      }`}
                    >
                      <span className={isAnalyzing ? 'w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping' : 'w-1.5 h-1.5 rounded-full bg-emerald-400'} />
                      <span className="font-bold text-amber-400">Pipeline:</span>
                      <span>12 Stages</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('pipeline')}
                      className="px-1.5 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 text-[10px] font-bold transition-all cursor-pointer shrink-0"
                    >
                      Inspect ▼
                    </button>
                  </div>

                  {/* Desktop Full 6-Stage Stepper (>= md) */}
                  <div className="hidden md:flex items-center space-x-1 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden lg:inline mr-1">
                      Pipeline:
                    </span>
                    {PIPELINE_STEPPER_STAGES.map((stg, i) => (
                      <button
                        key={stg.id}
                        type="button"
                        onClick={() => setActiveTab('pipeline')}
                        title={`สเตจ ${stg.label}: ${stg.thai} (คลิกเพื่อตรวจละเอียด)`}
                        className={`px-1.5 py-0.5 rounded text-[10px] flex items-center space-x-1 transition-all cursor-pointer shrink-0 ${
                          isAnalyzing
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse font-bold'
                            : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
                        }`}
                      >
                        <span className={isAnalyzing ? 'text-amber-400 font-bold animate-ping' : 'text-emerald-400'}>●</span>
                        <span className="truncate">{stg.label}</span>
                        {i < PIPELINE_STEPPER_STAGES.length - 1 && <span className="text-slate-600 ml-0.5">→</span>}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setActiveTab('pipeline')}
                      className="ml-1 px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 text-[10px] font-bold transition-all cursor-pointer shrink-0"
                    >
                      Inspect ▼
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Executive Current Mission Context Directive (Point 2) */}
              <div className={`shrink-0 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 border-b text-xs ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-gradient-to-r from-[#0C1424] via-[#090E1A] to-[#0C1424] border-slate-800'
              }`}>
                <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 max-w-[calc(100%-120px)] sm:max-w-none">
                  <span className="px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider shrink-0">
                    🎯 Mission
                  </span>
                  <span className={`font-semibold truncate text-[11px] sm:text-sm ${
                    isLight ? 'text-slate-900' : 'text-slate-100'
                  }`}>
                    {currentMission}
                  </span>
                </div>

                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsMissionSelectorOpen(!isMissionSelectorOpen)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[10px] sm:text-[11px] font-mono font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <span>Switch</span>
                    <ChevronDown className="w-3 h-3 text-amber-400" />
                  </button>

                  {isMissionSelectorOpen && (
                    <div className="absolute right-0 mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 space-y-1 animate-fadeIn">
                      <div className="px-2 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                        Select Executive Objective Preset
                      </div>
                      {MISSION_PRESETS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setCurrentMission(m.label);
                            setIsMissionSelectorOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs flex items-center gap-2 transition-all cursor-pointer ${
                            currentMission === m.label
                              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span className="text-sm shrink-0">{m.icon}</span>
                          <span className="truncate">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-3 sm:space-y-4">
                {/* 3.1 Initial Hero Flow when no turns: Executive Intro -> Strategic Console (Hero) -> Quick Commands */}
                {currentTurns.length === 0 && (
                  <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                    {/* Purposeful Executive Introduction Banner (Refined, Compact & Clear Hierarchy) */}
                    <div className={`px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border text-center relative overflow-hidden transition-all ${
                      isLight
                        ? 'bg-gradient-to-b from-white to-amber-50/20 border-amber-200/60 shadow-xs'
                        : 'bg-gradient-to-b from-[#0E1729] to-[#080D18] border-amber-500/20 shadow-lg'
                    }`}>
                      {/* Subdued Category Tag (Clean Hierarchy - Single focal headline) */}
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400/90 text-[10px] font-mono tracking-wider mb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>PUNN Cognitive Architecture v2.0</span>
                      </div>
                      
                      {/* Primary Dominant Headline */}
                      <h2 className={`text-base sm:text-xl font-black tracking-tight mb-1 font-mono uppercase ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        FIRE KEEPER <span className="text-amber-500 font-sans font-normal">·</span> <span className="font-semibold text-sm sm:text-lg text-slate-300 font-sans">Strategic Governance AI</span>
                      </h2>

                      {/* Concise 2-3 Line Paragraph with Enhanced Typography (+1-2px larger & crisper for Thai readability) */}
                      <p className={`text-sm sm:text-[15px] max-w-xl mx-auto leading-relaxed mb-2.5 font-normal ${
                        isLight ? 'text-slate-700' : 'text-slate-200'
                      }`}>
                        ระบบปัญญาประดิษฐ์กำกับดูแลการตัดสินใจเชิงกลยุทธ์ ตรวจสอบ 12 ขั้นตอนโปร่งใสแบบ White-Box พร้อมจำลองความเสี่ยง Red Team อัตโนมัติ
                      </p>

                      {/* Live Audit Status Badges with Verified / Certified / Active States */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-mono">
                        <div className="inline-flex items-center space-x-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[9px] sm:text-[10px] uppercase font-bold px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300">Verified</span>
                          <span className={`${isLight ? 'text-slate-700' : 'text-slate-300'} font-sans font-medium`}>12-Stage White-Box</span>
                        </div>

                        <div className="inline-flex items-center space-x-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 font-semibold shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          <span className="text-[9px] sm:text-[10px] uppercase font-bold px-1 py-0.2 rounded bg-purple-500/20 text-purple-300">Certified</span>
                          <span className={`${isLight ? 'text-slate-700' : 'text-slate-300'} font-sans font-medium`}>ISO 42001 & NIST</span>
                        </div>

                        <div className="inline-flex items-center space-x-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span className="text-[9px] sm:text-[10px] uppercase font-bold px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300">Active</span>
                          <span className={`${isLight ? 'text-slate-700' : 'text-slate-300'} font-sans font-medium`}>Human Agency</span>
                        </div>
                      </div>
                    </div>

                    {/* Point 1 & 5: Elevated Strategic Command Console in Primary View */}
                    <div className="rounded-xl sm:rounded-2xl border-2 border-amber-500/30 shadow-xl overflow-hidden bg-[#0A101D]">
                      <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-amber-500 font-bold text-xs sm:text-sm">⚡</span>
                          <span className="text-[11px] sm:text-xs font-bold text-slate-200 tracking-wide font-mono">
                            STRATEGIC COMMAND CONSOLE
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>PUNN v2.0 Live</span>
                        </span>
                      </div>
                      <div className="p-2 sm:p-3">
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
                          onOpenStrategy={() => openDrawer('strategy')}
                        />
                      </div>
                    </div>

                    {/* Quick Command Presets as Supporting Accelerators Below Console */}
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span>⚡ Quick Command Presets & Accelerators</span>
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-amber-400 font-medium">1-Tap Direct Execution</span>
                      </div>
                      <ExamplePromptCards onSelectSample={handleSelectSamplePrompt} />
                    </div>
                  </div>
                )}

                {/* Context Compression View */}
                {(currentTurns.length > 0 || activeConversation?.compressedContext) && (
                  <ContextCompressionViewer
                    compressedContext={activeConversation?.compressedContext}
                    onManualCompress={compressActiveSession}
                    isCompressing={isCompressingActive}
                  />
                )}

                {/* 3.2 Conversation History & Analysis */}
                <div ref={latestTurnRef} className="space-y-6">
                  {currentTurns.length > 0 && (
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <h3 className={`text-sm font-bold font-mono flex items-center gap-2 ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        💬 Recent Analysis & History ({currentTurns.length} turns)
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => createNewConversation()}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-900 hover:bg-white/10 text-white border-slate-800'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-500" />
                          <span>New Session</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (activeConversation && window.confirm('คุณต้องการลบประวัติการสนทนาในเซสชันนี้ใช่หรือไม่?')) {
                              deleteConversation(activeConversation.id);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            isLight ? 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border-slate-200' : 'bg-slate-900 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 border-slate-800'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Clear</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {currentTurns.map((turn, idx) => (
                    <MessageBubble
                      key={idx}
                      turn={turn}
                      onOpenExport={handleOpenExport}
                    />
                  ))}

                  {/* Streaming Message Response with Cognitive Stepped Progress */}
                  {isAnalyzing && (
                    <StreamingMessageBubble
                      streamingStage={streamingStage}
                      streamingText={streamingResponseText}
                      streamingTokens={streamingTokens}
                      isTokenEstimated={isTokenEstimated}
                    />
                  )}

                  {/* Quick Action Cards at bottom of conversation for easy followup */}
                  {currentTurns.length > 0 && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80">
                      <ExamplePromptCards onSelectSample={handleSelectSamplePrompt} />
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* 4. Bottom Pinned Chat Input Bar (Shown when turns exist or toggled) */}
              {currentTurns.length > 0 && (
                <div className={`shrink-0 p-3 sm:p-4 border-t backdrop-blur-xl ${
                  isLight ? 'bg-white/95 border-slate-200' : 'bg-[#0A101D]/95 border-slate-800'
                }`}>
                  {isChatBoxCollapsed ? (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsChatBoxCollapsed(false)}
                        className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                          isLight
                            ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                            : 'bg-[#FF8A00] hover:bg-[#E07B00] text-black font-extrabold border-[#FF8A00]'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        <span>แสดงแถบแชท (Show Command Center)</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1 px-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-amber-500 font-bold">🔥</span>
                          <span className={`text-xs font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            FIRE KEEPER · Executive Decision Intelligence Platform (PUNN v2.0)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsChatBoxCollapsed(true)}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer ${
                            isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                          title="ย่อแถบแชท"
                        >
                          <EyeOff className="w-3 h-3 text-amber-500" />
                          <span>ย่อแถบ</span>
                        </button>
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
                        onOpenStrategy={() => openDrawer('strategy')}
                      />
                    </div>
                  )}
                </div>
              )}
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

      {/* Enterprise Trust & Legal Modal Dialog (About, Privacy, Terms, Contact) */}
      <EnterpriseTrustModal
        isOpen={isTrustModalOpen}
        onClose={() => setIsTrustModalOpen(false)}
        initialTab={trustModalInitialTab}
      />

      {/* Plain Language Glossary Modal Dialog */}
      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />

      {/* Share Link & Social Preview Modal Dialog */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />


      <ConversationDrawer
        reasoningProfile={reasoningProfile}
        setReasoningProfile={setReasoningProfile}
        tone={tone}
        setTone={setTone}
        deepReasoning={deepReasoning}
        setDeepReasoning={setDeepReasoning}
      />

      {/* Executive Enterprise Footer with Trust & Compliance Links */}
      <footer className={`shrink-0 border-t py-2 sm:py-2.5 text-xs font-mono shadow-2xs ${
        isLight
          ? 'bg-white border-[#E5E7EB] text-[#4B5563]'
          : 'bg-[#0B1220] border-white/10 text-slate-400'
      }`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2.5 font-medium">
          <div className="flex items-center flex-wrap gap-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span className={`font-bold tracking-wide text-xs ${
                isLight ? 'text-[#111827]' : 'text-white'
              }`}>FIRE KEEPER OS</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">|</span>

            {/* Corporate Compliance Links */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] font-sans">
              <button
                onClick={() => {
                  setTrustModalInitialTab('about');
                  setIsTrustModalOpen(true);
                }}
                className="hover:text-[#FF8A00] transition-colors cursor-pointer"
              >
                About
              </button>
              <span className="text-slate-600">·</span>
              <button
                onClick={() => {
                  setTrustModalInitialTab('privacy');
                  setIsTrustModalOpen(true);
                }}
                className="hover:text-[#FF8A00] transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-slate-600">·</span>
              <button
                onClick={() => {
                  setTrustModalInitialTab('terms');
                  setIsTrustModalOpen(true);
                }}
                className="hover:text-[#FF8A00] transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <span className="text-slate-600">·</span>
              <button
                onClick={() => {
                  setTrustModalInitialTab('contact');
                  setIsTrustModalOpen(true);
                }}
                className="hover:text-[#FF8A00] transition-colors cursor-pointer"
              >
                Contact & Security
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSecurityAuditModalOpen(true)}
              className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="สถาปัตยกรรมออกแบบอ้างอิงตามกรอบมาตรฐานสากล ISO/IEC 42001 & NIST AI RMF"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Designed with ref. to ISO/IEC 42001 & NIST AI RMF</span>
            </button>
            <span className={`text-[11px] font-sans hidden md:inline ${isLight ? 'text-[#6B7280]' : 'text-slate-400'}`}>
              Preserving Human Agency · PUNN Architecture v2.0
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ConversationProvider>
        <MainWorkspace />
      </ConversationProvider>
    </ThemeProvider>
  );
}
