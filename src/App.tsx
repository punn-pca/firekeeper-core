import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { MinimalHeader } from './components/MinimalHeader';
import { NavigationDrawer } from './components/NavigationDrawer';
import { ChatInput } from './components/ChatInput';
import { MessageBubble, StreamingMessageBubble } from './components/MessageBubble';
import { MessageSkeleton } from './components/Skeletons';
import { safeLocalStorage, safeSessionStorage, getDraftPromptStorageKey, getDeepSeekApiKeyStorageKey } from './utils/safeStorage';
import { getSafePathname } from './utils/safeLocation';
import { auth, onAuthStateChanged } from './lib/firebase';
import { trackAnalysisStarted, trackAnalysisCompleted, trackAnalysisFailed, trackPageView } from './lib/analytics';
import { recordAnalysisStarted, recordAnalysisCompleted } from './services/usageTracker';
import { verifyAdminStatusAsync, checkIsAdminSync } from './config/adminConfig';

import { Footer } from './components/Footer';
import { ConversationDrawer } from './components/ConversationDrawer';
import { HeroWelcomeCard } from './components/HeroWelcomeCard';
import { ExamplePromptCards } from './components/ExamplePromptCards';
import { Home } from './components/Home';
import { LandingPage } from './components/LandingPage';
import { TaxonomyTag } from './components/TaxonomyTag';
import { INFORMATION_TAXONOMY_LIST, TAXONOMY_PILLARS, TaxonomyPillar } from './utils/taxonomyTokens';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AttachedFile, ConversationTurn, MemoryItem, PCAState, ToneMode, ReasoningProfile, MemoryCandidate } from './types';
import { INITIAL_MEMORIES, SamplePrompt } from './data/pcaDefaults';
import { Flame, Trash2, Brain, Sparkles, RefreshCw, AlertTriangle, Download, ShieldCheck, Activity, Plus, LayoutGrid, ChevronUp, ChevronDown, EyeOff, Eye, LogIn, Lock, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import { detectMemoryCandidates, recordMemoryAudit } from './utils/memoryCandidateEngine';
import { exportToHtmlReport } from './utils/exportUtils';

import { ConversationProvider, useConversation } from './context/ConversationContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ModelProvider, useModel } from './context/ModelContext';
import { APP_CONFIG } from './config/env';
import { estimateTokenCount } from './utils/tokenUtils';
import { getThemeTokens } from './utils/themeTokens';
import { memoryRepository } from './services/memoryRepository';

// Lazy-loaded heavy Application Layer components to keep Public Layer light & resilient
const AdminUsageDashboard = lazy(() => import('./components/AdminUsageDashboard').then(m => ({ default: m.AdminUsageDashboard })));
const MemoryManager = lazy(() => import('./components/MemoryManager').then(m => ({ default: m.MemoryManager })));
const PunnPcaCanonicalPage = lazy(() => import('./components/PunnPcaCanonicalPage').then(m => ({ default: m.PunnPcaCanonicalPage })));
const AboutPunnPage = lazy(() => import('./components/AboutPunnPage').then(m => ({ default: m.AboutPunnPage })));
const ChatSettingsModal = lazy(() => import('./components/ChatSettingsModal').then(m => ({ default: m.ChatSettingsModal })));
const ShareModal = lazy(() => import('./components/ShareModal').then(m => ({ default: m.ShareModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const GlossaryModal = lazy(() => import('./components/GlossaryModal').then(m => ({ default: m.GlossaryModal })));
const PrivacyTermsPage = lazy(() => import('./components/Legal').then(m => ({ default: m.PrivacyTermsPage })));

export type DashboardLayer = 'executive' | 'analyst' | 'governance' | 'auditor' | 'developer';
export type AppTabType = 'landing' | 'home' | 'chat' | 'memory' | 'docs' | 'developers' | 'admin' | 'punn-pca' | 'about' | 'privacy-terms';

function SuspenseFallback({ text = 'กำลังโหลด...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[40vh] text-center space-y-3">
      <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      <p className="text-xs font-mono text-slate-400">{text}</p>
    </div>
  );
}

function getInitialTabFromLocation(): AppTabType {
  try {
    const pathname = getSafePathname().toLowerCase();
    const hash = (typeof window !== 'undefined' ? window.location.hash : '').toLowerCase();
    
    // Check if user has already entered the workspace once
    let hasSeenLanding = false;
    try {
      hasSeenLanding = localStorage.getItem('fire_keeper_has_seen_landing') === 'true';
    } catch (e) {}

    if (pathname === '/about' || pathname === '/about-punn' || hash === '#about' || hash === '#about-punn') {
      return 'about';
    }
    if (pathname === '/punn-pca' || pathname === '/pca' || hash === '#punn-pca' || hash === '#pca') {
      return 'punn-pca';
    }
    if (pathname === '/docs' || pathname === '/whitepaper' || hash === '#docs' || hash === '#whitepaper') {
      return 'docs';
    }
    if (pathname === '/developers' || pathname === '/developer' || hash === '#developers' || hash === '#developer') {
      return 'developers';
    }
    if (pathname === '/admin' || pathname === '/admin-dashboard' || hash === '#admin' || hash === '#admin-dashboard' || hash === '#admin-usage') {
      return 'admin';
    }
    if (pathname === '/chat' || hash === '#chat') {
      return 'chat';
    }
    if (pathname === '/memory' || hash === '#memory') {
      return 'memory';
    }
    if (pathname === '/privacy' || pathname === '/terms' || pathname === '/security' || hash === '#privacy' || hash === '#terms') {
      return 'privacy-terms';
    }
    if (pathname === '/home' || hash === '#home') {
      return 'home';
    }

    // Default case for root path "/"
    if (pathname === '/' || pathname === '') {
      return 'landing';
    }
  } catch (e) {
    console.warn('[Router] Error resolving initial route:', e);
  }
  return 'landing';
}

const OFFLINE_USER = {
  uid: 'usr-offline-local',
  email: 'offline@firekeeper.local',
  displayName: 'Offline Operator (Local)',
  isOffline: true,
  getIdToken: async () => 'offline-local-token'
};

function MainWorkspace() {
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(() => {
    try {
      return safeLocalStorage.getItem(APP_CONFIG.OFFLINE_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const { selectedModel, setSelectedModel, ollamaUrl, setOllamaUrl, modelDetails } = useModel();

  const fetchWithAuthRetry = async (url: string, options: RequestInit = {}): Promise<Response> => {
    if (isOfflineMode) {
      const headers = {
        ...(options.headers || {}),
        'Authorization': 'Bearer offline-local-token',
      };
      return fetch(url, { ...options, headers });
    }

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

  const [activeTab, setActiveTab] = useState<AppTabType>(() => getInitialTabFromLocation());
  const [memories, setMemories] = useState<MemoryItem[]>(() => memoryRepository.loadMemories());
  const [memoryCandidates, setMemoryCandidates] = useState<MemoryCandidate[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [streamingStage, setStreamingStage] = useState<string>('');
  const [streamingResponseText, setStreamingResponseText] = useState<string>('');
  const [streamingTokens, setStreamingTokens] = useState<number>(0);
  const [isTokenEstimated, setIsTokenEstimated] = useState<boolean>(true);
  const [latestPcaState, setLatestPcaState] = useState<PCAState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChatBoxCollapsed, setIsChatBoxCollapsed] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isChatFooterVisible, setIsChatFooterVisible] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      if (safeLocalStorage.getItem(APP_CONFIG.OFFLINE_MODE_KEY) === 'true') {
        return OFFLINE_USER;
      }
    } catch {}
    return auth.currentUser;
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      if (safeLocalStorage.getItem(APP_CONFIG.OFFLINE_MODE_KEY) === 'true') {
        return true;
      }
    } catch {}
    return checkIsAdminSync(auth.currentUser);
  });
  const [draftPrompt, setDraftPrompt] = useState<string>(() => {
    try {
      const uid = auth.currentUser?.uid || null;
      return safeLocalStorage.getItem(getDraftPromptStorageKey(uid)) || '';
    } catch {
      return '';
    }
  });
  const [deepSeekApiKey, setDeepSeekApiKey] = useState<string>(() => {
    try {
      const uid = auth.currentUser?.uid || null;
      return safeLocalStorage.getItem(getDeepSeekApiKeyStorageKey(uid)) || '';
    } catch {
      return '';
    }
  });
  const [hasBackendDeepSeekKey, setHasBackendDeepSeekKey] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

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
      const uid = currentUser?.uid || (isOfflineMode ? 'usr-offline-local' : null);
      safeLocalStorage.setItem(getDeepSeekApiKeyStorageKey(uid), deepSeekApiKey);
    } catch {}
  }, [deepSeekApiKey, currentUser, isOfflineMode]);

  // Track Firebase Auth State & Admin Status & Fetch Memories on Auth Ready
  useEffect(() => {
    if (isOfflineMode) {
      setCurrentUser(OFFLINE_USER);
      setIsAdmin(true);
      setMemories(memoryRepository.loadMemories('usr-offline-local'));
      fetchWithAuthRetry('/api/memory')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.memories && Array.isArray(data.memories) && data.memories.length > 0) {
            setMemories(data.memories);
          }
        })
        .catch((err) => console.warn('Could not load memory bank from server in offline mode:', err));
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      const uid = user?.uid || null;
      // Immediately hydrate user-scoped memories, draft prompt, and private API key
      setMemories(memoryRepository.loadMemories(uid));
      setMemoryCandidates([]);
      setLatestPcaState(null);
      setDraftPrompt(safeLocalStorage.getItem(getDraftPromptStorageKey(uid)) || '');
      setDeepSeekApiKey(safeLocalStorage.getItem(getDeepSeekApiKeyStorageKey(uid)) || '');

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
              memoryRepository.saveMemories(data.memories, user.uid);
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
  }, [isOfflineMode]);

  // Track Page Views in Analytics
  useEffect(() => {
    trackPageView(`Fire Keeper - ${activeTab}`, getSafePathname());
  }, [activeTab]);

  // Pathname-based sub-page client router & Hash router with popstate/hashchange sync
  useEffect(() => {
    const handleLocationChange = () => {
      try {
        const initialTab = getInitialTabFromLocation();
        setActiveTab((prev) => (prev !== initialTab ? initialTab : prev));
      } catch (e) {
        console.warn('[Router] Direct pathname routing was restricted by the browser context:', e);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handleLocationChange);
      window.addEventListener('hashchange', handleLocationChange);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handleLocationChange);
        window.removeEventListener('hashchange', handleLocationChange);
      }
    };
  }, []);

  const navigateToTab = useCallback((tab: AppTabType) => {
    setActiveTab(tab);
    
    // Mark landing as seen when entering the workspace
    if (tab !== 'landing') {
      try {
        localStorage.setItem('fire_keeper_has_seen_landing', 'true');
      } catch (e) {}
    }

    try {
      const routeMap: Record<AppTabType, string> = {
        landing: '/',
        home: '/home',
        chat: '/chat',
        memory: '/memory',
        docs: '/docs',
        developers: '/developers',
        admin: '/admin',
        'punn-pca': '/punn-pca',
        about: '/about',
        'privacy-terms': '/privacy-terms',
      };
      const targetPath = routeMap[tab] || '/';
      if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
        window.history.pushState({ tab }, '', targetPath);
      }
    } catch (e) {
      // Sandbox security fallback
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
  const [webSearch, setWebSearch] = useState<boolean>(() => {
    try {
      const saved = safeLocalStorage.getItem('fire_keeper_web_search');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [reasoningProfile, setReasoningProfile] = useState<ReasoningProfile>('Auto');

  useEffect(() => {
    try {
      safeLocalStorage.setItem('fire_keeper_web_search', String(webSearch));
    } catch {}
  }, [webSearch]);

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
    submitReasoningProfile: ReasoningProfile = reasoningProfile,
    forceSessionId?: string // Added parameter
  ) => {
    if ((!promptText.trim() && attachments.length === 0) || isAnalyzing) return;

    const user = auth.currentUser;
    if (!user && !isOfflineMode) {
      // User is not signed in: preserve draft and prompt to sign in immediately without pipeline failure
      setDraftPrompt(promptText);
      safeLocalStorage.setItem(getDraftPromptStorageKey(null), promptText);
      setErrorMessage('AUTH_REQUIRED: กรุณาเข้าสู่ระบบก่อนส่งคำขอ (Please sign in first)');
      setIsAuthModalOpen(true);
      return;
    }

    const targetSessionId = forceSessionId || activeConversation?.id;

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
    if (user?.uid || isOfflineMode) {
      recordAnalysisStarted(user?.uid || OFFLINE_USER.uid).catch(() => {});
    }

    const initialPromptTokens = estimateTokenCount(promptText, attachments);
    setStreamingTokens(initialPromptTokens);
    setIsTokenEstimated(true);
    let realTotalTokens: number | undefined = undefined;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    let isAbortedByUser = false;

    // Timeout safety fallback (180 seconds)
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current === abortController) {
        abortController.abort(new Error('TIMEOUT'));
      }
    }, 180000);

    try {
      let idToken = isOfflineMode
        ? 'offline-local-token'
        : (user ? await user.getIdToken(true) : 'offline-local-token');
      const requestPayload = {
        conversationId: targetSessionId,
        question: promptText,
        tone: submitTone,
        deepReasoning: submitDeepReasoning,
        webSearch,
        reasoningProfile: submitReasoningProfile,
        model: selectedModel,
        deepSeekApiKey,
        ollamaBaseUrl: ollamaUrl,
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
        signal: abortController.signal,
      });

      console.log('[AUTH DEBUG]', {
        firebaseUser: !!user,
        isOfflineMode,
        uidPresent: !!user?.uid || isOfflineMode,
        idTokenPresent: !!idToken,
        authorizationHeaderPresent: true,
        backendStatus: response.status
      });

      if (response.status === 401 && !isOfflineMode && user) {
        console.warn('[AUTH DEBUG] Backend returned 401. Attempting exactly ONE fresh token refresh and retry...');
        idToken = await user.getIdToken(true);
        response = await fetch('/api/pca/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify(requestPayload),
          signal: abortController.signal,
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
      let isStreamComplete = false;

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

        if (dataStr === '[DONE]' || dataStr.includes('[DONE]') || eventName === 'done') {
          isStreamComplete = true;
          return;
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
        } else if (eventName === 'state' && dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            finalPcaState = parsed;
          } catch (e) {}
        } else if (eventName === 'complete' && dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            finalPcaState = parsed.pcaState || parsed.result || parsed.state || finalPcaState;
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
            if (completeText !== undefined && completeText !== null && typeof completeText === 'string' && completeText.length >= accumulatedText.length) {
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
          isStreamComplete = true;
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

      try {
        while (!isStreamComplete) {
          if (abortController.signal.aborted) {
            isAbortedByUser = true;
            break;
          }
          const { done, value } = await reader.read();
          if (done) {
            isStreamComplete = true;
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split(/(?:\r?\n){2}/);
          buffer = events.pop() || '';

          for (const eventStr of events) {
            processEventBlock(eventStr);
            if (isStreamComplete) break;
          }
        }

        if (!isStreamComplete && buffer.trim()) {
          processEventBlock(buffer);
        }
      } finally {
        // ALWAYS abort / cancel reader to release socket immediately
        try {
          await reader.cancel();
        } catch (e) {}
      }

      // Handle final text resolution
      if (!accumulatedText || !accumulatedText.trim()) {
        if (finalPcaState?.response && finalPcaState.response.trim()) {
          accumulatedText = finalPcaState.response;
        } else if ((finalPcaState as any)?.answer && (finalPcaState as any).answer.trim()) {
          accumulatedText = (finalPcaState as any).answer;
        } else if ((finalPcaState as any)?.content && (finalPcaState as any).content.trim()) {
          accumulatedText = (finalPcaState as any).content;
        } else if ((finalPcaState as any)?.text && (finalPcaState as any).text.trim()) {
          accumulatedText = (finalPcaState as any).text;
        } else if (!isAbortedByUser) {
          throw new Error('ไม่ได้รับข้อมูลตอบกลับจากเซิร์ฟเวอร์ (Stream response was empty or disconnected prematurely)');
        }
      }

      // If we have accumulated text (even if user cancelled halfway or stream completed normally):
      // NEVER delete or hide completed/accumulated answers!
      if (accumulatedText && accumulatedText.trim()) {
        const finalTurnTokens = realTotalTokens ?? (initialPromptTokens + estimateTokenCount(accumulatedText));
        const finalIsEstimated = realTotalTokens === undefined;

        if (finalPcaState) {
          setLatestPcaState(finalPcaState);
        }

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
        if (user?.uid || isOfflineMode) {
          recordAnalysisCompleted(user?.uid || OFFLINE_USER.uid, { hasPdf }).catch(() => {});
        }

        const userSentIso = new Date(analysisStartTime).toISOString();
        const assistantReceivedIso = new Date().toISOString();
        const responseModel = (finalPcaState as any)?.llm_model || selectedModel;

        addTurnToActive(
          promptText,
          accumulatedText,
          finalPcaState || undefined,
          attachments,
          targetSessionId,
          finalTurnTokens,
          finalIsEstimated,
          finalCompressedContext || undefined,
          durationMs,
          userSentIso,
          assistantReceivedIso,
          responseModel
        );
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err?.name === 'AbortError' || abortController.signal.aborted || isAbortedByUser;
      if (isAbort) {
        console.log('[FIRE KEEPER] Stream generation cancelled by user or timeout.');
      } else {
        console.error('PCA Stream Error:', err);
        const errText = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการประมวลผลสตรีมมิง';
        setErrorMessage(errText);
        trackAnalysisFailed({
          errorType: errText.slice(0, 60),
        });
      }
    } finally {
      clearTimeout(timeoutId);
      abortControllerRef.current = null;
      setIsAnalyzing(false);
      setStreamingStage('');
      setStreamingResponseText('');
    }
  };

  const handleSelectSamplePrompt = (sample: SamplePrompt) => {
    setTone(sample.tone);
    setDeepReasoning(sample.deepReasoning);
    
    if (!auth.currentUser && !isOfflineMode) {
      setDraftPrompt(sample.prompt);
      safeLocalStorage.setItem(getDraftPromptStorageKey(null), sample.prompt);
      setErrorMessage('AUTH_REQUIRED: กรุณาเข้าสู่ระบบก่อนส่งคำขอ (Please sign in first)');
      setIsAuthModalOpen(true);
      return;
    }

    handleSendPrompt(sample.prompt, sample.tone, sample.deepReasoning, [], reasoningProfile);
  };

  // Memory Handlers
  const handleAddMemory = async (content: string, layer: MemoryItem['layer'], source: string, importance?: 'HIGH' | 'MEDIUM' | 'LOW') => {
    try {
      const uid = currentUser?.uid || (isOfflineMode ? 'usr-offline-local' : null);
      const newMem = memoryRepository.addMemory(content, layer, source, uid, importance);
      setMemories(memoryRepository.loadMemories(uid));

      // Also sync to server API with Firebase ID token and retry mechanism
      await fetchWithAuthRetry('/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, layer, source, importance }),
      });
    } catch (err) {
      console.error('Failed to add memory:', err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const uid = currentUser?.uid || (isOfflineMode ? 'usr-offline-local' : null);
      const updated = memoryRepository.deleteMemory(id, uid);
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
      await handleAddMemory(candidate.content, candidate.layer, candidate.source, candidate.importance);
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
    return (
      <div className={`min-h-screen flex flex-col font-sans ${isLight ? 'bg-[#F8FAFC] text-[#111827]' : 'bg-[#060A16] text-white'}`}>
        <div className="flex-1 min-h-0">
          <LandingPage onEnter={() => navigateToTab('home')} onNavigateDocs={() => navigateToTab('docs')} onNavigateDevelopers={() => navigateToTab('developers')} isLight={isLight} />
        </div>
      {/* Global scroll controls: available to every page rendered by the application shell */}
      {/* Global scroll controls: available to every page rendered by the application shell */}
      <div className="fixed right-4 sm:right-6 bottom-20 sm:bottom-24 z-40 flex flex-col gap-2" aria-label="Page scroll controls">
        {showScrollTop && (
          <button
            type="button"
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
            type="button"
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
      <Suspense fallback={null}>
        {isSettingsModalOpen && (
          <ChatSettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            tone={tone}
            setTone={setTone}
            deepReasoning={deepReasoning}
            setDeepReasoning={setDeepReasoning}
            webSearch={webSearch}
            setWebSearch={setWebSearch}
            reasoningProfile={reasoningProfile}
            setReasoningProfile={setReasoningProfile}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            deepSeekApiKey={deepSeekApiKey}
            setDeepSeekApiKey={setDeepSeekApiKey}
            hasBackendDeepSeekKey={hasBackendDeepSeekKey}
            ollamaUrl={ollamaUrl}
            setOllamaUrl={setOllamaUrl}
            isLight={isLight}
          />
        )}
      </Suspense>

      {/* Plain Language Glossary Modal Dialog */}
      <Suspense fallback={null}>
        {isGlossaryOpen && (
          <GlossaryModal
            isOpen={isGlossaryOpen}
            onClose={() => setIsGlossaryOpen(false)}
          />
        )}
      </Suspense>

      {/* Share Link & Social Preview Modal Dialog */}
      <Suspense fallback={null}>
        {isShareModalOpen && (
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
          />
        )}
      </Suspense>

      {/* Authentication & User Account Modal Dialog */}
      <Suspense fallback={null}>
        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onOfflineMode={() => {
              setIsOfflineMode(true);
              setCurrentUser(OFFLINE_USER);
              setIsAdmin(true);
              setIsAuthModalOpen(false);
            }}
          />
        )}
      </Suspense>

      <ConversationDrawer onNavigateToChat={() => navigateToTab('chat')} />

      <Footer isLight={isLight} navigateToTab={navigateToTab} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ModelProvider>
        <ConversationProvider>
          <MainWorkspace />
        </ConversationProvider>
      </ModelProvider>
    </ThemeProvider>
  );
}
