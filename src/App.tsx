import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalHeader } from './components/MinimalHeader';
import { NavigationDrawer } from './components/NavigationDrawer';
import { PCAProgress } from './components/PCAProgress';
import { ChatInput } from './components/ChatInput';
import { ChatSettingsModal } from './components/ChatSettingsModal';
import { MessageBubble, StreamingMessageBubble } from './components/MessageBubble';
import { PCAStateViewer } from './components/PCAStateViewer';
import { MessageSkeleton, PCAStateSkeleton } from './components/Skeletons';
import { MemoryManager } from './components/MemoryManager';
import { PCAFrameworkInfo } from './components/PCAFrameworkInfo';
import { ExportModal } from './components/ExportModal';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { GlossaryModal } from './components/GlossaryModal';
import { EnterpriseTrustModal, TrustTab } from './components/EnterpriseTrustModal';
import { ShareModal } from './components/ShareModal';
import { AuthModal } from './components/AuthModal';
import { AdminAnalyticsDashboard } from './components/AdminAnalyticsDashboard';
import { safeLocalStorage } from './utils/safeStorage';
import { getSafePathname } from './utils/safeLocation';
import { auth, onAuthStateChanged } from './lib/firebase';
import { trackAnalysisStarted, trackAnalysisCompleted, trackAnalysisFailed, trackPageView } from './lib/analytics';
import { recordAnalysisStarted, recordAnalysisCompleted } from './services/usageTracker';
import { verifyAdminStatusAsync, checkIsAdminSync } from './config/adminConfig';

import { ConversationDrawer } from './components/ConversationDrawer';
import { HeroWelcomeCard } from './components/HeroWelcomeCard';
import { ExamplePromptCards } from './components/ExamplePromptCards';
import { DashboardKpiCards } from './components/DashboardKpiCards';
import { Home } from './components/Home';
import { LandingPage } from './components/LandingPage';
import { SocialAgencyDashboard } from './components/SocialAgencyDashboard';
import { LayeredRoleSelector, DashboardLayer } from './components/LayeredRoleSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AttachedFile, ConversationTurn, MemoryItem, PCAState, ToneMode, ReasoningProfile, MemoryCandidate } from './types';
import { INITIAL_MEMORIES, SamplePrompt } from './data/pcaDefaults';
import { Flame, Trash2, Brain, Sparkles, RefreshCw, AlertTriangle, Download, ShieldCheck, Activity, Plus, LayoutGrid, ChevronUp, ChevronDown, EyeOff, Eye, LogIn, Lock, ArrowUp, ArrowDown } from 'lucide-react';
import { detectMemoryCandidates, recordMemoryAudit } from './utils/memoryCandidateEngine';

import { ConversationProvider, useConversation } from './context/ConversationContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { PipelineEmptyState } from './components/PipelineEmptyState';
import { ContextCompressionViewer } from './components/ContextCompressionViewer';
import { APP_CONFIG } from './config/env';
import { estimateTokenCount } from './utils/tokenUtils';
import { getThemeTokens } from './utils/themeTokens';
import { memoryRepository } from './services/memoryRepository';

function MainWorkspace() {
  const fetchWithAuthRetry = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated (auth.currentUser is null)');
    }
    let token = await user.getIdToken();
    const headers = {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`,
    };

    let response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      console.warn('[AUTH] Request returned 401. Retrying with force-refreshed ID token...');
      token = await user.getIdToken(true);
      response = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          'Authorization': `Bearer ${token}`,
        },
      });
    }
    return response;
  };

  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  const [activeTab, setActiveTab] = useState<'landing' | 'home' | 'chat' | 'pipeline' | 'memory' | 'docs' | 'admin' | 'social_agency'>('landing');
  const [memories, setMemories] = useState<MemoryItem[]>(() => memoryRepository.loadMemories());
  const [memoryCandidates, setMemoryCandidates] = useState<MemoryCandidate[]>([]);
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [trustModalInitialTab, setTrustModalInitialTab] = useState<TrustTab>('about');
  const [isChatBoxCollapsed, setIsChatBoxCollapsed] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isChatFooterVisible, setIsChatFooterVisible] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(() => auth.currentUser);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => checkIsAdminSync(auth.currentUser));
  const [draftPrompt, setDraftPrompt] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem('fire_keeper_draft_prompt') || '';
    } catch {
      return '';
    }
  });
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.6-flash');
  const [deepSeekApiKey, setDeepSeekApiKey] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem('fire_keeper_deepseek_api_key') || '';
    } catch {
      return '';
    }
  });
  const [hasBackendDeepSeekKey, setHasBackendDeepSeekKey] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/config/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.hasDeepSeekKey) {
          setHasBackendDeepSeekKey(true);
        }
      })
      .catch((err) => console.warn('Could not fetch backend config status:', err));
  }, []);

  useEffect(() => {
    try {
      safeLocalStorage.setItem('fire_keeper_deepseek_api_key', deepSeekApiKey);
    } catch {}
  }, [deepSeekApiKey]);

  // Track Firebase Auth State & Admin Status & Fetch Memories on Auth Ready
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const adminCheck = await verifyAdminStatusAsync(user);
        setIsAdmin(adminCheck);

        // Fetch memories securely once auth initialization is complete and user is verified
        try {
          const res = await fetchWithAuthRetry('/api/memory');
          if (res.ok) {
            const data = await res.json();
            if (data.memories && Array.isArray(data.memories) && data.memories.length > 0) {
              setMemories(data.memories);
            }
          }
        } catch (err) {
          console.warn('Could not load memory bank from server:', err);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Track Page Views in Analytics
  useEffect(() => {
    trackPageView(`Fire Keeper - ${activeTab}`, getSafePathname());
  }, [activeTab]);

  // Pathname-based sub-page client router
  useEffect(() => {
    try {
      const pathname = getSafePathname();
      if (pathname === '/about') {
        setTrustModalInitialTab('about');
        setIsTrustModalOpen(true);
      } else if (pathname === '/contact') {
        setTrustModalInitialTab('contact');
        setIsTrustModalOpen(true);
      } else if (pathname === '/docs' || pathname === '/whitepaper') {
        setActiveTab('docs');
      }
    } catch (e) {
      console.warn('[Router] Direct pathname routing was restricted by the browser context:', e);
    }
  }, []);

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
      // Find the last assistant turn and scroll to it
      const lastTurn = currentTurns[currentTurns.length - 1];
      if (lastTurn && lastTurn.role === 'assistant') {
        const lastTurnElement = document.getElementById(`turn-${currentTurns.length - 1}`);
        if (lastTurnElement) {
          lastTurnElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
    prevTurnsLengthRef.current = currentTurns.length;
  }, [currentTurns.length]);

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

    const user = auth.currentUser;
    if (!user) {
      // User is not signed in: preserve draft and prompt to sign in immediately without pipeline failure
      setDraftPrompt(promptText);
      safeLocalStorage.setItem('fire_keeper_draft_prompt', promptText);
      setErrorMessage('AUTH_REQUIRED: กรุณาเข้าสู่ระบบก่อนส่งคำขอ (Please sign in first)');
      setIsAuthModalOpen(true);
      return;
    }

    const targetSessionId = activeConversation?.id;

    const detectedCandidates = detectMemoryCandidates(promptText, memories);
    if (detectedCandidates.length > 0) {
      setMemoryCandidates(prev => [...detectedCandidates, ...prev]);
    }

    setErrorMessage(null);
    setIsAnalyzing(true);
    setStreamingStage('กำลังเชื่อมต่อเอนจิน FIRE KEEPER และประมวลผลไฟล์แนบ...');
    setStreamingResponseText('');

    const hasPdf = attachments.some(
      (a) => a.name.toLowerCase().endsWith('.pdf') || a.type?.includes('pdf')
    );
    const analysisStartTime = Date.now();

    // Track analysis_started in Analytics & Firestore
    trackAnalysisStarted({
      tone: submitTone,
      deepReasoning: submitDeepReasoning,
      reasoningProfile: submitReasoningProfile,
      attachmentCount: attachments.length,
      hasPdf,
    });
    if (user.uid) {
      recordAnalysisStarted(user.uid).catch(() => {});
    }

    const initialPromptTokens = estimateTokenCount(promptText, attachments);
    setStreamingTokens(initialPromptTokens);
    setIsTokenEstimated(true);
    let realTotalTokens: number | undefined = undefined;

    try {
      let idToken = await user.getIdToken(true);
      const requestPayload = {
        question: promptText,
        tone: submitTone,
        deepReasoning: submitDeepReasoning,
        reasoningProfile: submitReasoningProfile,
        model: selectedModel,
        deepSeekApiKey,
        personalContext: '',
        history: currentTurns.map((t) => ({ role: t.role, content: t.content })),
        attachments,
        compressedContext: activeConversation?.compressedContext,
      };

      let response = await fetch('/api/pca/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(requestPayload),
      });

      console.log('[AUTH DEBUG]', {
        firebaseUser: !!user,
        uidPresent: !!user?.uid,
        idTokenPresent: !!idToken,
        authorizationHeaderPresent: true,
        backendStatus: response.status
      });

      if (response.status === 401) {
        console.warn('[AUTH DEBUG] Backend returned 401. Attempting exactly ONE fresh token refresh and retry...');
        idToken = await user.getIdToken(true);
        response = await fetch('/api/pca/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify(requestPayload),
        });

        console.log('[AUTH DEBUG RETRY]', {
          firebaseUser: !!user,
          uidPresent: !!user?.uid,
          idTokenPresent: !!idToken,
          authorizationHeaderPresent: true,
          backendStatus: response.status
        });

        if (response.status === 401) {
          throw new Error('AUTHENTICATION_FAILED: การยืนยันตัวตนล้มเหลว (401 Unauthorized)');
        }
      }

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

      // Track analysis_completed in Analytics & Firestore
      const durationMs = Date.now() - analysisStartTime;
      
      console.log(JSON.stringify({ 
        event: 'client_total_latency_telemetry', 
        client_total_ms: durationMs,
        timestamp: new Date().toISOString()
      }));

      trackAnalysisCompleted({
        tone: submitTone,
        deepReasoning: submitDeepReasoning,
        reasoningProfile: submitReasoningProfile,
        totalTokens: finalTurnTokens,
        isPdf: hasPdf,
        durationMs,
      });
      if (user.uid) {
        recordAnalysisCompleted(user.uid, { hasPdf }).catch(() => {});
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
      trackAnalysisFailed({
        errorType: errText.slice(0, 60),
      });
    } finally {
      setIsAnalyzing(false);
      setStreamingStage('');
      setStreamingResponseText('');
    }
  };

  const handleSelectSamplePrompt = (sample: SamplePrompt) => {
    setTone(sample.tone);
    setDeepReasoning(sample.deepReasoning);
    
    if (!auth.currentUser) {
      setDraftPrompt(sample.prompt);
      safeLocalStorage.setItem('fire_keeper_draft_prompt', sample.prompt);
      setErrorMessage('AUTH_REQUIRED: กรุณาเข้าสู่ระบบก่อนส่งคำขอ (Please sign in first)');
      setIsAuthModalOpen(true);
      return;
    }

    handleSendPrompt(sample.prompt, sample.tone, sample.deepReasoning, [], reasoningProfile);
  };

  // Memory Handlers
  const handleAddMemory = async (content: string, layer: MemoryItem['layer'], source: string) => {
    try {
      const newMem = memoryRepository.addMemory(content, layer, source);
      setMemories(memoryRepository.loadMemories());

      // Also sync to server API with Firebase ID token and retry mechanism
      await fetchWithAuthRetry('/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, layer, source }),
      });
    } catch (err) {
      console.error('Failed to add memory:', err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const updated = memoryRepository.deleteMemory(id);
      setMemories(updated);

      // Also sync to server API with Firebase ID token and retry mechanism
      await fetchWithAuthRetry(`/api/memory/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  const handleApproveCandidate = async (candidate: MemoryCandidate) => {
    try {
      await handleAddMemory(candidate.content, candidate.layer, candidate.source);
      setMemoryCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, status: 'APPROVED' } : c));
      recordMemoryAudit(candidate.id, candidate.source, 'MEMORY_CANDIDATE_APPROVED', 'User approved memory candidate into Active Memory Store', undefined, candidate.content);
    } catch (err) {
      console.error('Failed to approve candidate:', err);
    }
  };

  const handleDismissCandidate = (candidateId: string) => {
    setMemoryCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: 'DISMISSED' } : c));
    const cand = memoryCandidates.find(c => c.id === candidateId);
    if (cand) {
      recordMemoryAudit(candidateId, cand.source, 'MEMORY_CANDIDATE_DISMISSED', 'User dismissed memory candidate');
    }
  };

  const handleOpenExport = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  // State for Navigation Drawer
  const [isNavigationDrawerOpen, setIsNavigationDrawerOpen] = useState(false);

  // Scroll to Top and Bottom logic
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(true);

  useEffect(() => {
    const handleWindowScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      const isNearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 300;
      if (!isNearBottom && document.body.offsetHeight > window.innerHeight + 100) {
        setShowScrollBottom(true);
      } else {
        setShowScrollBottom(false);
      }
    };
    
    // Check initially
    setTimeout(handleWindowScroll, 500);

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    window.addEventListener('resize', handleWindowScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      window.removeEventListener('resize', handleWindowScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  if (activeTab === 'landing') {
    return <LandingPage onEnter={() => setActiveTab('home')} isLight={isLight} />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-all ${
      isLight
        ? 'bg-[#F8FAFC] text-[#111827] selection:bg-[#F59E0B] selection:text-white'
        : 'bg-[#060A16] text-white selection:bg-[#F59E0B] selection:text-slate-950'
    }`}>
      {/* New Header */}
      <MinimalHeader
        onOpenDrawer={() => setIsNavigationDrawerOpen(true)}
        isAuthenticated={!!currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        userEmail={currentUser?.email}
        onNavigateLanding={() => setActiveTab('landing')}
      />

      <NavigationDrawer
        isOpen={isNavigationDrawerOpen}
        onClose={() => setIsNavigationDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as any)}
        isAdmin={isAdmin}
      />

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto min-h-0 w-full main-container py-4 flex flex-col space-y-4 overflow-x-hidden">
        {/* Error Alert with Smart Auth Call-To-Action */}
        {errorMessage && (
          <div className="bg-rose-950/90 border border-rose-500/60 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between text-rose-100 text-xs sm:text-sm shadow-xl gap-2.5 animate-fadeIn">
            <div className="flex items-center space-x-3 min-w-0">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="font-medium break-words">{errorMessage}</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
              {(errorMessage.includes('AUTH_REQUIRED') || errorMessage.includes('เข้าสู่ระบบ') || errorMessage.includes('401')) && (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบทันที (Sign In)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="px-2.5 py-1.5 text-xs text-rose-300 hover:text-white hover:bg-rose-900/50 rounded-lg transition-colors font-mono cursor-pointer"
              >
                [Dismiss]
              </button>
            </div>
          </div>
        )}

        {/* TAB 0: HOME */}
        {activeTab === 'home' && (
          <Home
            onExecute={(promptText, attachments, submitTone, submitDeep, submitProfile) => {
              setActiveTab('chat');
              handleSendPrompt(
                promptText,
                submitTone || tone,
                submitDeep !== undefined ? submitDeep : deepReasoning,
                attachments || [],
                submitProfile || reasoningProfile
              );
            }}
            isAuthenticated={!!currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onViewArchitecture={() => setActiveTab('pipeline')}
            onLearnPCA={() => setIsTrustModalOpen(true)}
            onSelectActivity={() => setActiveTab('chat')}
            tone={tone}
            setTone={setTone}
            deepReasoning={deepReasoning}
            setDeepReasoning={setDeepReasoning}
            reasoningProfile={reasoningProfile}
            setReasoningProfile={setReasoningProfile}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            isLight={isLight}
          />
        )}

        {/* TAB 1: Chat & Executive Analysis View (Enterprise Decision Intelligence Layout) */}
        {activeTab === 'chat' && (
          <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผล สนทนา & วิเคราะห์">
            <div className={`flex flex-col flex-1 min-h-0 max-w-7xl mx-auto w-full rounded-2xl border overflow-hidden ${
              isLight ? 'bg-[#F8FAFC] border-slate-200 shadow-sm' : 'bg-[#060A16] border-white/10 shadow-2xl'
            }`}>
              {/* [Existing content of tab 1 kept, just removing the Navbar logic and integrating the MinimalHeader/Drawer above] */}
              {/* 1. Consolidated High-Legibility Status Bar with Live Pipeline Stepper */}
              <div className={`shrink-0 flex flex-wrap items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 border-b text-xs font-mono gap-1.5 sm:gap-2 ${
                isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#0B1220] border-white/10 text-slate-300'
              }`}>
                {/* System Readiness Flags */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] sm:text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Ready</span>
                  </div>

                  <div className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold text-[10px] sm:text-[11px]">
                    <span>⚡</span>
                    <span className="hidden xs:inline">PCA Auto</span>
                    <span className="xs:hidden">PCA</span>
                  </div>

                  <div className="hidden sm:flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 font-semibold text-[10px] sm:text-[11px]">
                    <span className="text-emerald-400">●</span>
                    <span>Memory ON</span>
                  </div>

                  <div className="hidden md:flex items-center space-x-1 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold text-[10px] sm:text-[11px]">
                    <span>🛡️</span>
                    <span>ISO 42001</span>
                  </div>
                </div>

                {/* 3. Responsive Pipeline Stepper Bar: Consolidated on mobile, full stepper on md+ */}
                <div className="flex items-center space-x-1.5 py-0.5 ml-auto">
                  {/* Mobile Compact Pipeline Pill (< md) */}
                  <div className="flex md:hidden items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('pipeline')}
                      className={`px-2 py-0.5 rounded-md text-[10px] flex items-center space-x-1.5 transition-all cursor-pointer ${
                        isAnalyzing
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse font-bold'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-white/10'
                      }`}
                    >
                      <span className={isAnalyzing ? 'w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping' : 'w-1.5 h-1.5 rounded-full bg-emerald-400'} />
                      <span className="font-bold text-amber-400">Pipeline:</span>
                      <span>12 Stages</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('pipeline')}
                      className="px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 text-[10px] font-bold transition-all cursor-pointer shrink-0"
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
                      className="ml-1 px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 text-[10px] font-bold transition-all cursor-pointer shrink-0"
                    >
                      Inspect ▼
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Executive Current Mission Context Directive */}
              <div className={`shrink-0 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border-b text-xs ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#080E1A] border-white/10'
              }`}>
                <div className="flex items-center space-x-2 min-w-0 max-w-[calc(100%-100px)] sm:max-w-none">
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider shrink-0">
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
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[10px] sm:text-[11px] font-mono font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
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
                    {/* Executive Authoritative Welcome Banner */}
                    <HeroWelcomeCard hasTurns={currentTurns.length > 0} />



                    {/* Quick Command Presets as Supporting Accelerators Below Console */}
                    <div className="space-y-1.5 pt-0.5">
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
                      <button onClick={() => setIsChatFooterVisible(!isChatFooterVisible)} className="text-xs text-amber-500 font-bold flex items-center gap-1">
                        {isChatFooterVisible ? 'ซ่อนแชท' : 'แสดงแชท'}
                      </button>
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
                    <div key={idx} id={`turn-${idx}`}>
                      <MessageBubble
                        turn={turn}
                        onOpenExport={handleOpenExport}
                      />
                    </div>
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
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* 4. Fixed Chat Input Footer inside tab */}
              {isChatFooterVisible && (
                <div className={`shrink-0 border-t p-3 sm:p-4 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#060A16] border-white/10'
                }`}>
                  <ChatInput
                    onSend={handleSendPrompt}
                    isLoading={isAnalyzing}
                    tone={tone}
                    deepReasoning={deepReasoning}
                    reasoningProfile={reasoningProfile}
                    selectedModel={selectedModel}
                    onSelectSample={handleSelectSamplePrompt}
                    onOpenSettings={() => setIsSettingsModalOpen(true)}
                    isAuthenticated={!!currentUser}
                    onOpenAuth={() => setIsAuthModalOpen(true)}
                    externalPrompt={draftPrompt}
                  />
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
              memoryCandidates={memoryCandidates}
              onAddMemory={handleAddMemory}
              onDeleteMemory={handleDeleteMemory}
              onApproveCandidate={handleApproveCandidate}
              onDismissCandidate={handleDismissCandidate}
              isLoading={isAnalyzing}
            />
          </ErrorBoundary>
        )}

        {/* TAB 3.8: Autonomous Social Agency Engine Lab */}
        {activeTab === 'social_agency' && (
          <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผล Social Agency Engine">
            <SocialAgencyDashboard />
          </ErrorBoundary>
        )}

        {activeTab === 'docs' && (
          <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผล Documentation">
            <PCAFrameworkInfo />
          </ErrorBoundary>
        )}

        {/* TAB 6: Executive Admin Analytics & Usage Telemetry */}
        {activeTab === 'admin' && (
          <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผล Admin Analytics Dashboard">
            <AdminAnalyticsDashboard onNavigateHome={() => setActiveTab('chat')} />
          </ErrorBoundary>
        )}
      </main>

      {/* Scroll Controls */}
      <div className="fixed bottom-20 right-6 sm:bottom-16 sm:right-8 z-50 flex flex-col gap-2">
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className={`p-2.5 sm:p-3 rounded-full shadow-2xl border transition-all animate-fadeIn ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-emerald-500'
                : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-emerald-400 backdrop-blur-sm'
            }`}
            aria-label="Scroll to top"
            title="ขึ้นไปบนสุด"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className={`p-2.5 sm:p-3 rounded-full shadow-2xl border transition-all animate-fadeIn ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-emerald-500'
                : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-emerald-400 backdrop-blur-sm'
            }`}
            aria-label="Scroll to bottom"
            title="ลงไปล่างสุด"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Chat Settings Modal */}
      <ChatSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        tone={tone}
        setTone={setTone}
        deepReasoning={deepReasoning}
        setDeepReasoning={setDeepReasoning}
        reasoningProfile={reasoningProfile}
        setReasoningProfile={setReasoningProfile}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        deepSeekApiKey={deepSeekApiKey}
        setDeepSeekApiKey={setDeepSeekApiKey}
        hasBackendDeepSeekKey={hasBackendDeepSeekKey}
        isLight={isLight}
      />

      {/* Export Modal Dialog */}
      <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการใช้งาน Export Modal">
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          conversationHistory={currentTurns}
          pcaState={latestPcaState}
          memories={memories}
          isLight={isLight}
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

      {/* Authentication & User Account Modal Dialog */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />


      <ConversationDrawer onNavigateToChat={() => setActiveTab('chat')} />

      {/* Executive Enterprise Footer with Trust & Compliance Links */}
      <footer className={`shrink-0 border-t py-2.5 sm:py-3 text-xs font-mono shadow-2xs ${
        isLight
          ? 'bg-white border-slate-200 text-slate-600'
          : 'bg-[#0B1220] border-white/10 text-slate-400'
      }`}>
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-2.5 font-medium">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2.5 gap-y-1.5">
            <div className="flex items-center space-x-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`font-bold tracking-wide text-xs ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>FIRE KEEPER OS</span>
            </div>
            <span className="text-slate-700 hidden sm:inline">|</span>

            {/* Corporate Compliance Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] font-sans">
              <button
                onClick={() => {
                  setTrustModalInitialTab('about');
                  setIsTrustModalOpen(true);
                }}
                className="hover:text-[#FF8A00] transition-colors cursor-pointer py-0.5"
              >
                About
              </button>
              <span className="text-slate-700">·</span>
              <button
                onClick={() => {
                  setTrustModalInitialTab('privacy');
                  setIsTrustModalOpen(true);
                }}
                className="hover:text-[#FF8A00] transition-colors cursor-pointer py-0.5"
              >
                Privacy Policy
              </button>
              <span className="text-slate-700">·</span>
              <button
                onClick={() => {
                  setTrustModalInitialTab('terms');
                  setIsTrustModalOpen(true);
                }}
                className="hover:text-[#FF8A00] transition-colors cursor-pointer py-0.5"
              >
                Terms of Service
              </button>
              <span className="text-slate-700">·</span>
              <button
                onClick={() => {
                  setTrustModalInitialTab('contact');
                  setIsTrustModalOpen(true);
                }}
                className="hover:text-[#FF8A00] transition-colors cursor-pointer py-0.5"
              >
                Contact & Security
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 text-center">
            <button
              onClick={() => setIsSecurityAuditModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="สถาปัตยกรรมออกแบบอ้างอิงตามกรอบมาตรฐานสากล ISO/IEC 42001 & NIST AI RMF"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Ref. ISO/IEC 42001 & NIST AI RMF</span>
            </button>
            <span className={`text-[10px] sm:text-[11px] font-sans hidden lg:inline ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              PUNN Architecture v2.0
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
