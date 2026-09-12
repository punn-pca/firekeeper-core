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
  const [docsSubTab, setDocsSubTab] = useState<'about' | 'privacy' | 'terms' | 'contact'>('about');

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
  const handleAddMemory = async (content: string, layer: MemoryItem['layer'], source: string) => {
    try {
      const uid = currentUser?.uid || (isOfflineMode ? 'usr-offline-local' : null);
      const newMem = memoryRepository.addMemory(content, layer, source, uid);
      setMemories(memoryRepository.loadMemories(uid));

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
    return <LandingPage onEnter={() => navigateToTab('home')} isLight={isLight} />;
  }

  if (activeTab === 'punn-pca') {
    return (
      <Suspense fallback={<SuspenseFallback text="กำลังโหลด PUNN Predictive Cognitive Architecture (PCA) Architecture Spec..." />}>
        <PunnPcaCanonicalPage
          onBackToApp={() => navigateToTab('home')}
          onNavigateHome={() => navigateToTab('home')}
        />
      </Suspense>
    );
  }

  if (activeTab === 'about') {
    return (
      <Suspense fallback={<SuspenseFallback text="กำลังโหลด About Punn..." />}>
        <AboutPunnPage
          onBackToApp={() => navigateToTab('home')}
          onNavigateHome={() => navigateToTab('home')}
          onNavigatePca={() => navigateToTab('punn-pca')}
          onNavigateChat={() => navigateToTab('chat')}
        />
      </Suspense>
    );
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
        onNavigateLanding={() => navigateToTab('landing')}
      />

      <NavigationDrawer
        isOpen={isNavigationDrawerOpen}
        onClose={() => setIsNavigationDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={(tab) => navigateToTab(tab as any)}
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
              const newSessionId = createNewConversation();
              navigateToTab('chat');
              handleSendPrompt(
                promptText,
                submitTone || tone,
                submitDeep !== undefined ? submitDeep : deepReasoning,
                attachments || [],
                submitProfile || reasoningProfile,
                newSessionId
              );
            }}
            isAuthenticated={!!currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onViewArchitecture={() => navigateToTab('punn-pca')}
            onLearnPCA={() => navigateToTab('punn-pca')}
            onSelectActivity={() => navigateToTab('chat')}
            onNavigateDocs={(subTab) => {
              if (subTab) setDocsSubTab(subTab as any);
              navigateToTab('docs');
            }}
            tone={tone}
            setTone={setTone}
            deepReasoning={deepReasoning}
            setDeepReasoning={setDeepReasoning}
            reasoningProfile={reasoningProfile}
            setReasoningProfile={setReasoningProfile}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            webSearch={webSearch}
            onToggleWebSearch={() => setWebSearch(!webSearch)}
            isAnalyzing={isAnalyzing}
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



                {/* 3.2 Conversation History & Analysis */}
                <div id="conversation-turns-container" ref={latestTurnRef} className="space-y-6">
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
                          onClick={() => {
                            exportToHtmlReport(
                              currentTurns,
                              latestPcaState,
                              [],
                              {
                                includeConversation: true,
                                includePcaState: true,
                                includeMemories: false,
                                includeTrace: false,
                                reportCategory: 'full_combined',
                              },
                              `FIRE-KEEPER-Transcript-${new Date().toISOString().slice(0, 10)}`,
                              undefined,
                              'conversation-turns-container'
                            );
                          }}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            isLight
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                              : 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-700/50'
                          }`}
                          title="ส่งออกประวัติการสนทนาทั้งหมดเป็นไฟล์ HTML (1:1 DOM Snapshot)"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-500" />
                          <span>Export HTML</span>
                        </button>
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
                    <div key={turn.id || `turn-${idx}-${turn.timestamp || idx}`} id={`turn-${idx}`}>
                      <MessageBubble
                        turn={turn}
                        turnIndex={idx}
                        previousTurn={idx > 0 ? currentTurns[idx - 1] : undefined}
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
                      onCancel={handleCancelAnalysis}
                      modelName={selectedModel}
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
                    onCancel={handleCancelAnalysis}
                    tone={tone}
                    deepReasoning={deepReasoning}
                    webSearch={webSearch}
                    onToggleWebSearch={() => setWebSearch(!webSearch)}
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


        {/* TAB 3: Memory Bank Manager */}
        {activeTab === 'memory' && (
          <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผล Memory Bank Manager">
            <Suspense fallback={<SuspenseFallback text="กำลังโหลด Memory Bank Manager..." />}>
              <MemoryManager
                memories={memories}
                memoryCandidates={memoryCandidates}
                onAddMemory={handleAddMemory}
                onDeleteMemory={handleDeleteMemory}
                onApproveCandidate={handleApproveCandidate}
                onDismissCandidate={handleDismissCandidate}
                isLoading={isAnalyzing}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {activeTab === 'privacy-terms' && (
          <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผล Security & Governance">
            <Suspense fallback={<SuspenseFallback text="กำลังโหลดหน้าความปลอดภัย..." />}>
              <PrivacyTermsPage />
            </Suspense>
          </ErrorBoundary>
        )}

        {activeTab === 'developers' && (
          <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผล Developer Documentation">
            <div className={`p-6 sm:p-8 rounded-xl border space-y-8 max-w-5xl mx-auto ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-850 text-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-4 flex-wrap pb-5 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-500 mb-2">Developer Documentation</div>
                  <h2 className={`text-2xl font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>FIRE KEEPER Developer Docs</h2>
                  <p className="text-sm text-slate-500 mt-2 max-w-3xl">
                    เอกสารสำหรับนักพัฒนา: integration contract, runtime architecture, API surface, Decision Object และ validation boundary
                  </p>
                </div>
                <button
                  onClick={() => navigateToTab('docs')}
                  className="px-3 py-2 rounded-lg border border-white/10 bg-black/20 text-xs font-mono text-slate-300 hover:text-white hover:border-emerald-500/40 transition-all cursor-pointer"
                >
                  ← Cognitive Docs
                </button>
              </div>

              <section className="space-y-3">
                <h3 className={`text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>01. Documentation Boundary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                    <div className="text-xs font-mono font-bold text-emerald-500 mb-2">/docs</div>
                    <p className="text-sm">อธิบายว่า FIRE KEEPER คืออะไร ทำงานเชิงปัญญาอย่างไร และจัดสถานะความรู้/หลักฐานอย่างไร</p>
                  </div>
                  <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                    <div className="text-xs font-mono font-bold text-blue-400 mb-2">/developers</div>
                    <p className="text-sm">อธิบายว่านักพัฒนาจะเชื่อมต่อ runtime และใช้ interface ของ FIRE KEEPER อย่างไร</p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className={`text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>02. Runtime Architecture</h3>
                <div className="p-4 rounded-xl bg-black/20 border border-white/5 font-mono text-xs leading-7 overflow-x-auto">
                  User → Intent → PCA Runtime → Epistemic Classification → Evidence / Reasoning → Decision Object → Deterministic Validator → Response
                </div>
                <p className="text-sm text-slate-500">
                  Developer integrations should treat the Decision Object and validation boundary as contracts. Internal model implementation is not part of the public integration contract.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className={`text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>03. API Surface</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    ['Authentication', 'Identity/session boundary for authenticated users and protected operations.'],
                    ['Inference / Chat', 'Submit user intent and receive governed analysis and response events.'],
                    ['Decision Trace', 'Expose execution trace, evidence state, uncertainty and governance results.'],
                    ['Memory', 'User-controlled long-term memory operations and persistence boundaries.'],
                    ['Validation', 'Deterministic runtime validation before publication.'],
                    ['Webhooks / Events', 'Integration points for asynchronous processing where enabled.'],
                  ].map(([title, desc]) => (
                    <div key={title} className="p-4 rounded-xl border border-white/5 bg-black/10">
                      <div className="font-mono text-sm font-bold mb-1">{title}</div>
                      <div className="text-xs text-slate-500 leading-relaxed">{desc}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className={`text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>04. Decision Object Contract</h3>
                <pre className="p-4 rounded-xl bg-black/30 border border-white/5 text-[11px] leading-5 overflow-x-auto text-slate-300">{`{
  "decision": "...",
  "confidence": 0,
  "evidence": [],
  "uncertainty": [],
  "conflicts": [],
  "trace": [],
  "execution_trace": [],
  "human_agency_audit": {
    "status": "ENFORCED",
    "decision_authority": "Human Exclusive"
  }
}`}</pre>
                <p className="text-xs text-slate-500">
                  ตัวอย่างนี้เป็น conceptual contract เท่านั้น; canonical schema ควรอ้างอิงจาก versioned developer schema เมื่อมีการเผยแพร่
                </p>
              </section>

              <section className="space-y-3">
                <h3 className={`text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>05. Validation & Governance Boundary</h3>
                <ul className="space-y-2 text-sm list-disc pl-5 text-slate-500">
                  <li>ห้ามถือ model output เป็น truth โดยอัตโนมัติ</li>
                  <li>Evidence, uncertainty, contradiction และ decision gap ต้องรักษาสถานะตาม epistemic contract</li>
                  <li>ผลลัพธ์ต้องผ่าน deterministic validation / governance ก่อน publication</li>
                  <li>Human Agency เป็น boundary สูงสุด: AI ทำหน้าที่ advisory ไม่ใช่ autonomous decision authority</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className={`text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>06. Recommended Developer Structure</h3>
                <div className="p-4 rounded-xl bg-black/20 border border-white/5 font-mono text-xs leading-6">
                  /developers<br/>
                  ├── Getting Started<br/>
                  ├── Architecture<br/>
                  ├── API Reference<br/>
                  ├── Authentication<br/>
                  ├── Decision Object<br/>
                  ├── JSON Schema<br/>
                  ├── Validation<br/>
                  ├── Error Handling<br/>
                  ├── Webhooks / Events<br/>
                  ├── SDK / Integration<br/>
                  ├── Examples<br/>
                  └── Changelog
                </div>
              </section>
            </div>
          </ErrorBoundary>
        )}

        {activeTab === 'docs' && (
          <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผล Documentation">
            <div className={`p-6 sm:p-8 rounded-xl border space-y-6 max-w-4xl mx-auto ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-850 text-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-emerald-500" />
                  <div>
                    <h2 className={`text-xl font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      FIRE KEEPER: Truth-First Core & Governance
                    </h2>
                    <p className="text-xs text-slate-500 font-mono">PUNN Cognitive Architecture (PCA) · DeepSeek-Only Engine</p>
                  </div>
                </div>

                {/* Sub-tab Navigation */}
                <div className="flex flex-wrap gap-1.5 p-1 rounded-lg bg-black/20 border border-white/10 text-xs">
                  <button
                    onClick={() => setDocsSubTab('about')}
                    className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                      docsSubTab === 'about'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    About & Philosophy
                  </button>
                  <button
                    onClick={() => setDocsSubTab('privacy')}
                    className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                      docsSubTab === 'privacy'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Privacy & Human Agency
                  </button>
                  <button
                    onClick={() => setDocsSubTab('terms')}
                    className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                      docsSubTab === 'terms'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Terms of Service
                  </button>
                  <button
                    onClick={() => setDocsSubTab('contact')}
                    className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                      docsSubTab === 'contact'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Contact & Security
                  </button>
                </div>
              </div>

              {docsSubTab === 'about' && (
                <div className="space-y-4 text-sm leading-relaxed animate-fadeIn">
                  <p>
                    ระบบปฏิบัติการ <strong>FIRE KEEPER</strong> ได้รับการสร้างสรรค์ขึ้นบนรากฐานของ <strong>PUNN Cognitive Architecture (PCA)</strong> ภายใต้ปรัชญาความโปร่งใสขั้นสุด (Extreme Epistemic Transparency) และการวิเคราะห์ที่มีหลักฐานเชิงประจักษ์รองรับจริง (Grounded Intelligence) ปราศจากการปรุงแต่งหรือสร้างภาพลวงตา
                  </p>

                  <h3 className={`font-bold font-mono text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    🔥 The 12 Canonical Stages of PCA
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
                    <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">01. Intent Definition (การระบุเจตนาและความต้องการ)</div>
                    <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">02. Context Understanding (การทำความเข้าใจบริบทและข้อจำกัด)</div>
                    <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">03. Purpose & Scope (การกำหนดวัตถุประสงค์และขอบเขต)</div>
                    <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">04. Data Structuring (การจัดโครงสร้างข้อมูลและการดึงความจำ)</div>
                    <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">05. Relationship Modeling (แบบจำลองความสัมพันธ์เชิงตรรกะ)</div>
                    <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">06. Hypothesis Formation (สมมติฐานทางเลือกคู่ขนาน ACH)</div>
                    <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">07. Evidence Evaluation (ประเมินและจำแนกหลักฐานเชิงประจักษ์)</div>
                    <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">08. Risk & Critique Analysis (วิเคราะห์ความเสี่ยงและจุดวิพากษ์)</div>
                    <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">09. Strategic Options (สังเคราะห์ทางเลือกเชิงยุทธศาสตร์)</div>
                    <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">10. Analysis Communication (การสื่อสารบทวิเคราะห์ผู้บริหาร)</div>
                    <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">11. Review & Verification (การทบทวนและตรวจสอบความสอดคล้อง)</div>
                    <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">12. Continuous Improvement (ปรับปรุงอย่างต่อเนื่องและเคารพ Human Agency)</div>
                  </div>

                  <h3 className={`font-bold font-mono text-base pt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    📌 ระบบจำแนกสถานะของสารสนเทศ (16 Information Taxonomy Standards / 4 Epistemic Pillars)
                  </h3>
                  
                  <div className="space-y-6">
                    {(Object.keys(TAXONOMY_PILLARS) as TaxonomyPillar[]).map((pillarKey) => {
                      const pillar = TAXONOMY_PILLARS[pillarKey];
                      const items = INFORMATION_TAXONOMY_LIST.filter((t) => t.pillar === pillarKey);
                      return (
                        <div key={pillarKey} className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded border ${pillar.badgeClass}`}>
                              {pillar.titleEn}
                            </span>
                            <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                              {pillar.titleTh}
                            </span>
                          </div>
                          <ul className="space-y-2 list-none pl-0">
                            {items.map((tax) => (
                              <li key={tax.type} className="flex items-start gap-2.5">
                                <TaxonomyTag type={tax.type} className="shrink-0 mt-0.5" />
                                <span className={isLight ? 'text-slate-700 text-xs' : 'text-slate-300 text-xs'}>{tax.description}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {docsSubTab === 'privacy' && (
                <div className="space-y-4 text-sm leading-relaxed animate-fadeIn">
                  <h3 className={`font-bold font-mono text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    🛡️ นโยบายคุ้มครองเสรีภาพมนุษย์ (Human Agency & Epistemic Sovereignty)
                  </h3>
                  <p>
                    <strong>หลักการสำคัญ (First Principle of Human Agency):</strong> ระบบปัญญาประดิษฐ์ไม่มีสิทธิ์สรุปหรือบังคับการตัดสินใจแทนมนุษย์ การวิเคราะห์ทุกขั้นตอนมุ่งเน้นการเปิดเผยทางเลือก (Strategic Options) พร้อมข้อแลกเปลี่ยน (Trade-offs) และความเสี่ยง (Vulnerabilities) เพื่อให้มนุษย์เป็นผู้ถืออำนาจตัดสินใจขั้นสูงสุด
                  </p>
                  <p>
                    <strong>การจัดเก็บข้อมูลส่วนบุคคลและหน่วยความจำ:</strong> คลังความทรงจำระยะยาว (Long-Term Memory) ทั้งหมดถูกควบคุมและเป็นกรรมสิทธิ์ของผู้ใช้ 100% ผู้ใช้สามารถดู แก้ไข ระงับ หรือลบข้อมูลความจำได้ตลอดเวลาผ่าน Memory Bank Management Panel โดยไม่มีการส่งต่อไปยังบุคคลภายนอก
                  </p>
                </div>
              )}

              {docsSubTab === 'terms' && (
                <div className="space-y-4 text-sm leading-relaxed animate-fadeIn">
                  <h3 className={`font-bold font-mono text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    📜 ข้อกำหนดการใช้งานและธรรมาภิบาลข้อมูล (Terms of Service)
                  </h3>
                  <p>
                    1. <strong>Anti-Fabrication Guarantee:</strong> ระบบห้ามสร้างข้อมูลเท็จ (Hallucination) หรือแต่งเติมคะแนนประเมินที่ไม่มีสูตรคณิตศาสตร์หรือหลักฐานรองรับจริง
                  </p>
                  <p>
                    2. <strong>Autonomous Agent Boundary:</strong> ระบบทำงานในฐานะ Cognitive Intelligence Assistant มิใช่ผู้มีอำนาจลงนามหรือตัดสินใจทางกฎหมาย การตัดสินใจขั้นสุดท้ายเป็นความรับผิดชอบของผู้ใช้
                  </p>
                  <p>
                    3. <strong>DeepSeek-Only Inference:</strong> การประมวลผลการให้เหตุผลเชิงลึกทั้งหมดดำเนินงานผ่าน DeepSeek Engine เพื่อรักษาความเสถียรและความแม่นยำสูง
                  </p>
                </div>
              )}

              {docsSubTab === 'contact' && (
                <div className="space-y-4 text-sm leading-relaxed animate-fadeIn">
                  <h3 className={`font-bold font-mono text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    🔒 ความปลอดภัยและการติดต่อ (Security & Contact)
                  </h3>
                  <p>
                    <strong>สถาปัตยกรรมอ้างอิง:</strong> ออกแบบและควบคุมความปลอดภัยสอดคล้องตามกรอบมาตรฐาน <strong>ISO/IEC 42001</strong> (Artificial Intelligence Management System) และ <strong>NIST AI Risk Management Framework (AI RMF 1.0)</strong>
                  </p>
                  <p>
                    <strong>การรายงานช่องโหว่ความปลอดภัย:</strong> หากท่านพบข้อผิดพลาดหรือช่องโหว่ในระบบ Epistemic Verification สามารถติดต่อทีมงานสถาปัตยกรรมความปลอดภัย PUNN ได้โดยตรงผ่านช่องทางความปลอดภัยระดับองค์กร
                  </p>
                </div>
              )}
            </div>
          </ErrorBoundary>
        )}

        {/* TAB 4: ADMIN USAGE DASHBOARD (ADMIN ONLY) */}
        {activeTab === 'admin' && (
          <ErrorBoundary>
            <Suspense fallback={<SuspenseFallback text="กำลังโหลด Admin Dashboard..." />}>
              <AdminUsageDashboard
                isAdmin={isAdmin}
                onNavigateToChat={() => navigateToTab('chat')}
              />
            </Suspense>
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
                onClick={() => setActiveTab('about')}
                className="hover:text-[#FF8A00] transition-colors cursor-pointer py-0.5 text-amber-500 font-semibold"
              >
                About Punn (ผู้สร้าง)
              </button>
              <span className="text-slate-700">·</span>
              <button
                onClick={() => {
                  setActiveTab('docs');
                  setDocsSubTab('about');
                }}
                className="hover:text-[#FF8A00] transition-colors cursor-pointer py-0.5"
              >
                Philosophy & Spec
              </button>
              <span className="text-slate-700">·</span>
              <button
                onClick={() => {
                  setActiveTab('docs');
                  setDocsSubTab('privacy');
                }}
                className="hover:text-[#FF8A00] transition-colors cursor-pointer py-0.5"
              >
                Privacy & Human Agency
              </button>
              <span className="text-slate-700">·</span>
              <button
                onClick={() => {
                  setActiveTab('docs');
                  setDocsSubTab('terms');
                }}
                className="hover:text-[#FF8A00] transition-colors cursor-pointer py-0.5"
              >
                Terms of Service
              </button>
              <span className="text-slate-700">·</span>
              <button
                onClick={() => {
                  setActiveTab('docs');
                  setDocsSubTab('contact');
                }}
                className="hover:text-[#FF8A00] transition-colors cursor-pointer py-0.5"
              >
                Contact & Security
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 text-center">
            <button
              onClick={() => {
                setActiveTab('docs');
                setDocsSubTab('contact');
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="สถาปัตยกรรมออกแบบอ้างอิงตามกรอบมาตรฐานสากล ISO/IEC 42001 & NIST AI RMF"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Ref. ISO/IEC 42001 & NIST AI RMF</span>
            </button>
            <span className={`text-[10px] sm:text-[11px] font-sans hidden lg:inline ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              PUNN Predictive Cognitive Architecture (PCA v3.0)
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
      <ModelProvider>
        <ConversationProvider>
          <MainWorkspace />
        </ConversationProvider>
      </ModelProvider>
    </ThemeProvider>
  );
}
