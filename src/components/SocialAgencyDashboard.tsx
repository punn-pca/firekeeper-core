import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain,
  Activity,
  Zap,
  Play,
  Pause,
  RotateCw,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Send,
  MessageSquare,
  Eye,
  PenTool,
  Share2,
  Sparkles,
  Heart,
  Compass,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  History,
  Terminal,
  ExternalLink,
  Layers,
  HelpCircle,
  Clock,
  Timer,
} from 'lucide-react';
import {
  getSocialAgencyEngine,
  SocialAgencyEngine,
} from '../social-agency/engine';
import {
  InternalDrives,
  PersonalityArchetype,
  SocialActionType,
  SimulatedPost,
  SocialAgencyLogEntry,
} from '../social-agency/types';
import { ARCHETYPE_CONFIGS } from '../social-agency/data/initialState';
import { CredentialPersistenceService, XConnectionStatusType } from '../social-agency/services/credentialPersistence';
import { CadencePolicyManager } from '../social-agency/cadencePolicy';
import { copyToClipboard } from '../utils/fileUtils';
import { getSafeOrigin } from '../utils/safeLocation';
import { runCryptographicAuditRegressionTest } from '../utils/auditExport';
import { LiveConversationPanel } from './LiveConversationPanel';
import { auth } from '../lib/firebase';

export const SocialAgencyDashboard: React.FC = () => {
  const engine = useMemo(() => getSocialAgencyEngine(), []);
  const [engineState, setEngineState] = useState(engine.getState());
  const [posts, setPosts] = useState<SimulatedPost[]>([]);
  const [isTicking, setIsTicking] = useState(false);
  const [cryptoTestResults, setCryptoTestResults] = useState<Array<{ testName: string; passed: boolean; details: string }> | null>(null);
  const [activeTab, setActiveTab] = useState<'decision_flow' | 'live_conversations' | 'simulated_feed' | 'event_logs' | 'architecture' | 'decision_tests' | 'real_connector'>('decision_flow');
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [manualDriveEditing, setManualDriveEditing] = useState<keyof InternalDrives | null>(null);
  const [xApiKeyInput, setXApiKeyInput] = useState((import.meta as any).env?.VITE_X_API_KEY || '');
  const [xApiSecretInput, setXApiSecretInput] = useState((import.meta as any).env?.VITE_X_API_SECRET || '');
  const [xAccessTokenInput, setXAccessTokenInput] = useState((import.meta as any).env?.VITE_X_ACCESS_TOKEN || '');
  const [xAccessSecretInput, setXAccessSecretInput] = useState((import.meta as any).env?.VITE_X_ACCESS_SECRET || '');
  const [customXClientIdInput, setCustomXClientIdInput] = useState('');
  const [xAuthTab, setXAuthTab] = useState<'oauth1' | 'oauth2'>('oauth1');
  const [useXRealApiToggle, setUseXRealApiToggle] = useState(Boolean((import.meta as any).env?.VITE_X_ACCESS_TOKEN));
  const [xConnectionStatus, setXConnectionStatus] = useState<XConnectionStatusType | 'NOT_CONNECTED' | 'TOKEN_EXPIRED'>('DISCONNECTED');
  const [xConnectedUsername, setXConnectedUsername] = useState<string>('punn_firekeeper');
  const [isConnectingOAuth, setIsConnectingOAuth] = useState(false);
  const [isSavingOAuth1, setIsSavingOAuth1] = useState(false);
  const connectorStatus = engine.getConnectorStatus();

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (e) {
        console.warn('Failed to get Firebase ID token:', e);
      }
    }
    return headers;
  };

  // Function to save OAuth 1.0a credentials directly to Backend & Firestore
  const handleSaveOAuth1Credentials = async () => {
    setIsSavingOAuth1(true);
    try {
      engine.setXCredentials(xApiKeyInput, xApiSecretInput, xAccessTokenInput, xAccessSecretInput, true);
      const res = await fetch('/api/x/configure', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          apiKey: xApiKeyInput,
          apiSecret: xApiSecretInput,
          accessToken: xAccessTokenInput,
          accessSecret: xAccessSecretInput,
          authMode: 'oauth1',
          enabled: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setXConnectionStatus('CONNECTED');
        setUseXRealApiToggle(true);
        if (data.username) setXConnectedUsername(data.username);
        alert(`✅ บันทึกและเปิดใช้งาน X (Twitter) Real Production สำเร็จ!\n\n• โหมด: OAuth 1.0a User Context\n• สถานะ: CONNECTED\n• การจัดเก็บ: บันทึกถาวรลง Backend / Firestore Singleton\n\n🎉 ระบบพร้อมสำหรับคำสั่ง Publish ทันที และ Autonomous Worker จะโพสต์อัตโนมัติตามนโยบาย Governance!`);
      } else {
        alert(`Failed to save X credentials: ${data.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Error saving credentials: ${err.message}`);
    } finally {
      setIsSavingOAuth1(false);
    }
  };

  // Function to initiate X OAuth 2.0 PKCE Authorization flow
  const handleConnectXOAuth = async () => {
    setIsConnectingOAuth(true);
    try {
      const res = await fetch('/api/x/oauth/initiate', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          customClientId: customXClientIdInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.authUrl) {
        throw new Error(data.message || 'Failed to initiate X OAuth flow');
      }

      // Open OAuth popup
      const width = 600;
      const height = 750;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(
        data.authUrl,
        'x_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );

      const messageHandler = async (event: MessageEvent) => {
        // Security check: only accept messages from the same origin
        if (event.origin !== getSafeOrigin()) {
          return;
        }
        if (event.data && event.data.type === 'X_OAUTH_CODE') {
          window.removeEventListener('message', messageHandler);
          const { code, state } = event.data;

          try {
            const exRes = await fetch('/api/x/oauth/exchange', {
              method: 'POST',
              headers: await getAuthHeaders(),
              body: JSON.stringify({ 
                code, 
                state,
                customClientId: customXClientIdInput.trim() || undefined,
              }),
            });
            const exData = await exRes.json();
            if (exRes.ok && exData.success) {
              setXConnectionStatus('CONNECTED');
              setXConnectedUsername(exData.username || 'punn_firekeeper');
              setUseXRealApiToggle(true);
              engine.setXCredentials('', '', 'PERSISTENT_BACKEND_TOKEN', '', true);
              alert(`✅ เชื่อมต่อ X (Twitter) สำเร็จเรียบร้อย!\n\n• บัญชี: @${exData.username || 'punn_firekeeper'}\n• สถานะ: CONNECTED (Persistent OAuth)\n• การจัดเก็บ: บันทึกถาวรลง Backend/Firestore\n\n🎉 คุณสามารถสั่งโพสต์หรือให้ Agent โพสต์อัตโนมัติได้ทันทีโดยไม่ต้องกรอกรหัสซ้ำ!`);
            } else {
              alert(`X OAuth Exchange Failed: ${exData.message || 'Unknown error'}`);
            }
          } catch (exErr: any) {
            alert(`Token Exchange Error: ${exErr.message}`);
          } finally {
            setIsConnectingOAuth(false);
          }
        }
      };

      window.addEventListener('message', messageHandler);
    } catch (err: any) {
      alert(`OAuth Error: ${err.message}`);
      setIsConnectingOAuth(false);
    }
  };

  const handleDisconnectX = async () => {
    if (confirm('คุณต้องการตัดการเชื่อมต่อ X (Twitter) หรือไม่?')) {
      try {
        await CredentialPersistenceService.disconnectX();
        setXConnectionStatus('NOT_CONNECTED');
        setUseXRealApiToggle(false);
        engine.setXCredentials('', '', '', '', false);
        alert('X disconnected successfully.');
      } catch (err: any) {
        alert(`Disconnect error: ${err.message}`);
      }
    }
  };

  // Sync with Backend Autonomous Worker Status & Firestore credentials on Load
  useEffect(() => {
    // 1. First read directly from Firestore via engine/service
    engine.loadPersistedCredentials().then(() => {
      CredentialPersistenceService.loadCredentials().then((creds) => {
        if (creds) {
          if (creds.isUsingRealX) setUseXRealApiToggle(true);
          setXConnectionStatus(creds.xStatus);
          if (creds.xUsername) setXConnectedUsername(creds.xUsername);
        }
      });
    });

    // 2. Also sync from X live status endpoint
    CredentialPersistenceService.getXConnectionStatus().then(status => {
      setXConnectionStatus(status.status);
      if (status.username) setXConnectedUsername(status.username);
      if (status.connected) {
        setUseXRealApiToggle(true);
        engine.setXConnected(true);
      }
    });

    // 3. Initial feed fetch
    engine.getAdapter().fetchRecentFeed().then(setPosts);
  }, [engine]);

  // Subscribe to engine state updates (decoupled from expensive feed re-fetches)
  useEffect(() => {
    const updateState = () => {
      setEngineState(engine.getState());
    };

    updateState();
    const unsubscribe = engine.subscribe(updateState);
    return () => unsubscribe();
  }, [engine]);

  // Refresh feed when switching to simulated_feed tab
  useEffect(() => {
    if (activeTab === 'simulated_feed') {
      engine.getAdapter().fetchRecentFeed().then(setPosts);
    }
  }, [activeTab, engine]);

  // Handle Manual Step Tick
  const handleManualTick = async () => {
    setIsTicking(true);
    try {
      await engine.tick();
    } finally {
      setIsTicking(false);
    }
  };

  const handleIngestEvent = () => {
    engine.ingestExternalEvent(`evt_${Date.now()}`, 'AI Governance & Human Agency', 'Exploring robust safeguards for autonomous systems');
  };

  const handleIngestComment = () => {
    engine.ingestComment(`com_${Date.now()}`, 'ดร. กานต์', 'ประเด็นเรื่อง Agency Encroachment น่าสนใจมากครับ ขอทราบแนวทางป้องกันการตัดสินใจซ้ำซ้อน');
  };

  // Toggle Auto-Tick Heartbeat
  const handleToggleAutoTick = () => {
    if (engineState.config.autoTickEnabled) {
      engine.stopHeartbeat();
    } else {
      engine.startHeartbeat();
    }
  };

  // Change Archetype
  const handleArchetypeChange = (arch: PersonalityArchetype) => {
    engine.setArchetype(arch);
  };

  const latestLog: SocialAgencyLogEntry | undefined = engineState.recentLogs[0];
  const drives = engineState.drives;

  // Drive Color Helper
  const getDriveColor = (val: number) => {
    if (val >= 75) return 'from-amber-500 to-orange-500 text-orange-400';
    if (val >= 50) return 'from-blue-500 to-cyan-500 text-cyan-400';
    if (val >= 25) return 'from-emerald-500 to-teal-500 text-teal-400';
    return 'from-slate-600 to-slate-500 text-slate-400';
  };

  // Action Icon Helper
  const getActionIcon = (action: SocialActionType) => {
    switch (action) {
      case 'observe': return <Eye className="w-4 h-4 text-cyan-400" />;
      case 'create_content': return <PenTool className="w-4 h-4 text-purple-400" />;
      case 'post': return <Share2 className="w-4 h-4 text-emerald-400" />;
      case 'reply': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'initiate_contact': return <Send className="w-4 h-4 text-pink-400" />;
      case 'reflect': return <Brain className="w-4 h-4 text-amber-400" />;
      case 'do_nothing': return <Pause className="w-4 h-4 text-slate-400" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-[#F5F7FA]">
      
      {/* ── Top Header & Control Banner ─────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-[#0B1017]/95 p-4 sm:p-6 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#FF8A00]/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-start gap-4 relative z-10">
          <div className="w-full">
            <div className="flex items-center space-x-2.5 mb-1.5 min-w-0 flex-wrap">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#FF8A00]/20 to-purple-500/20 border border-[#FF8A00]/40 text-[#FF8A00] shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-wide text-white min-w-0 flex flex-wrap items-center gap-2">
                <span className="whitespace-normal">Social Agency Engine</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                  Simulation Active
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 w-full max-w-full leading-relaxed">
              ระบบจำลองเจตจำนงทางสังคมแบบอัตโนมัติ (Autonomous Social Behavior Engine) ที่ขับเคลื่อนด้วยแรงผลักดันภายใน 
              (Internal Drives) โดยทุกการตัดสินใจต้องผ่าน <span className="text-amber-400 font-semibold">FIRE KEEPER Governance Gate</span> ก่อนดำเนินการจริง
            </p>
          </div>

          {/* Heartbeat & Tick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full">
            {/* Archetype Selector */}
            <div className="flex items-center space-x-1.5 bg-[#121824] px-3 py-1.5 rounded-xl border border-white/10 text-xs w-full sm:w-auto">
              <Compass className="w-4 h-4 text-amber-400 shrink-0" />
              <select
                value={engineState.config.archetype}
                onChange={(e) => handleArchetypeChange(e.target.value as PersonalityArchetype)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer w-full"
              >
                {Object.keys(ARCHETYPE_CONFIGS).map((arch) => (
                  <option key={arch} value={arch} className="bg-[#121824] text-white">
                    {ARCHETYPE_CONFIGS[arch as PersonalityArchetype].name}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto Heartbeat Toggle */}
            <button
              onClick={handleToggleAutoTick}
              type="button"
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border w-full sm:w-auto justify-center ${
                engineState.config.autoTickEnabled
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {engineState.config.autoTickEnabled ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Heartbeat</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Heartbeat ({engineState.config.tickIntervalMs / 1000}s)</span>
                </>
              )}
            </button>

            {/* Ingest Event Button */}
            <button
              onClick={handleIngestEvent}
              type="button"
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all cursor-pointer w-full sm:w-auto"
            >
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>+ Ingest Event</span>
            </button>

            {/* Ingest Comment Button */}
            <button
              onClick={handleIngestComment}
              type="button"
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 transition-all cursor-pointer w-full sm:w-auto"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>+ Ingest Comment</span>
            </button>

            {/* Manual Step Tick Button */}
            <button
              onClick={handleManualTick}
              disabled={isTicking}
              type="button"
              className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF8A00] to-orange-600 hover:from-orange-500 hover:to-orange-600 text-slate-950 shadow-md hover:shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50 w-full sm:w-auto"
            >
              <RotateCw className={`w-3.5 h-3.5 stroke-[2.5] ${isTicking ? 'animate-spin' : ''}`} />
              <span>Step 1 Tick (Cycle #{engineState.tickCount + 1})</span>
            </button>
          </div>
        </div>

        {/* ── Adaptive Event-Aware Loop Status Strip ─────────────────── */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-white/10 flex flex-wrap items-center gap-3 text-xs w-full">
          <div className="flex flex-wrap items-center gap-2.5 w-full">
            <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] border flex items-center gap-1.5 ${
              engineState.internalState === 'ACTIVE'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : engineState.internalState === 'PROCESSING'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : engineState.internalState === 'COOLDOWN'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : engineState.internalState === 'READY_TO_ACT'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800/80 text-slate-300 border-slate-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                engineState.internalState === 'ACTIVE'
                  ? 'bg-amber-400 animate-ping'
                  : engineState.internalState === 'PROCESSING'
                  ? 'bg-purple-400 animate-pulse'
                  : engineState.internalState === 'COOLDOWN'
                  ? 'bg-blue-400'
                  : engineState.internalState === 'READY_TO_ACT'
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-slate-400'
              }`} />
              STATE: {engineState.internalState || 'WAITING'}
            </span>

            <span className="text-slate-300 font-mono text-[11px] flex-1 min-w-[150px]">
              {engineState.waitReason || 'WAITING — No new event or actionable state change'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400 w-full">
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
              Events Queue: <strong className="text-purple-400">{engineState.pendingEventsCount || 0}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
              Comments: <strong className="text-blue-400">{engineState.unreadCommentsCount || 0}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
              Draft: <strong className={engineState.isContentReady ? 'text-emerald-400' : 'text-slate-500'}>{engineState.isContentReady ? 'READY' : 'NONE'}</strong>
            </span>
            {engineState.lastWakeTrigger && (
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Trigger: {engineState.lastWakeTrigger}
              </span>
            )}
          </div>
        </div>

        {/* ── Sub Tabs Navigation ── */}
        <div className="flex items-center gap-2 border-t border-white/10 pt-4 mt-5 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('decision_flow')}
            className={`flex items-center whitespace-nowrap space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'decision_flow'
                ? 'bg-[#FF8A00]/15 text-[#FF8A00] border border-[#FF8A00]/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Decision Flow & Internal State</span>
          </button>

          <button
            onClick={() => setActiveTab('live_conversations')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'live_conversations'
                ? 'bg-[#FF8A00]/15 text-[#FF8A00] border border-[#FF8A00]/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            <span>💬 Live Conversations & Comments</span>
          </button>

          <button
            onClick={() => setActiveTab('simulated_feed')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'simulated_feed'
                ? 'bg-[#FF8A00]/15 text-[#FF8A00] border border-[#FF8A00]/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-pink-400" />
            <span>Feed ({posts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('event_logs')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'event_logs'
                ? 'bg-[#FF8A00]/15 text-[#FF8A00] border border-[#FF8A00]/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span>Event Log ({engineState.recentLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-[#FF8A00]/15 text-[#FF8A00] border border-[#FF8A00]/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Architecture & Spec</span>
          </button>

          <button
            onClick={async () => {
              setActiveTab('decision_tests');
              const res = await engine.runTestSuites();
              setTestResults(res);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'decision_tests'
                ? 'bg-[#FF8A00]/15 text-[#FF8A00] border border-[#FF8A00]/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>🧪 Decision Test Suite (1-15)</span>
          </button>

          <button
            onClick={() => setActiveTab('real_connector')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'real_connector'
                ? 'bg-[#FF8A00]/15 text-[#FF8A00] border border-[#FF8A00]/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-sky-400" />
            <span>📱 Real Social API (X & IG)</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: Decision Flow & Live Internal State ───────────────────── */}
      {activeTab === 'decision_flow' && (
        <div className="space-y-6">
          {/* Cadence Policy & Hard Pacing Telemetry Strip */}
          {(() => {
            const cadence = CadencePolicyManager.getTelemetry();
            const hoursRemaining = Math.floor(cadence.timeRemainingMs / (3600 * 1000));
            const minsRemaining = Math.ceil((cadence.timeRemainingMs % (3600 * 1000)) / (60 * 1000));
            return (
              <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-950/20 via-[#0B1017]/95 to-sky-950/20 p-4 sm:p-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                        Cadence Policy & Hard Pacing Guard
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                          cadence.isPacingReady
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {cadence.isPacingReady ? '● READY TO POST' : '⏳ PACING COOLDOWN'}
                        </span>
                      </h3>
                      <span className="text-xs text-slate-400">
                        บังคับใช้กฎ 6-Hour Pacing, Max 3 Posts/24h, Semantic Duplicate Guard และ Consecutive Post Breaker
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400">24h Quota:</span>
                    <strong className={`px-2.5 py-1 rounded-lg border ${
                      cadence.postsLast24h >= 3
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {cadence.postsLast24h} / 3 posts
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Min Interval (6 Hours)</span>
                    <div className="text-sm font-bold flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-amber-400" />
                      <span className={cadence.timeRemainingMs > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                        {cadence.timeRemainingMs > 0 ? `${hoursRemaining}h ${minsRemaining}m remaining` : 'Passed (Eligible)'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Next Eligible Publish</span>
                    <div className="text-xs font-bold text-slate-200 truncate">
                      {cadence.nextEligibleTime ? new Date(cadence.nextEligibleTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Eligible Now'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Consecutive Post Breaker</span>
                    <div className="text-xs font-bold flex items-center gap-1">
                      <span className={cadence.consecutivePostCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                        {cadence.consecutivePostCount > 0 ? `Active (${cadence.consecutivePostCount} consecutive)` : 'Clear (0)'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Semantic Duplicate Guard</span>
                    <div className="text-xs font-bold text-cyan-400">
                      Jaccard ≤ 0.38 Threshold
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: 6 Internal State Gauges & Adjusters (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#0B1017]/95 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#FF8A00]" />
                  Internal Drives & Vital State
                </h2>
                <span className="text-[11px] text-slate-400 font-mono">
                  Cycle #{engineState.tickCount}
                </span>
              </div>

              <div className="space-y-4">
                {/* 1. Curiosity */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      Curiosity (ความใฝ่รู้/ค้นพบ)
                    </span>
                    <span className="font-mono font-bold text-cyan-400">{drives.curiosity.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${drives.curiosity}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={drives.curiosity}
                    onChange={(e) => engine.modifyDrive('curiosity', Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>

                {/* 2. Meaning */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-amber-400" />
                      Meaning (คุณค่า/ความลึกซึ้ง)
                    </span>
                    <span className="font-mono font-bold text-amber-400">{drives.meaning.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${drives.meaning}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={drives.meaning}
                    onChange={(e) => engine.modifyDrive('meaning', Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>

                {/* 3. Connection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-pink-400" />
                      Connection (สายสัมพันธ์/ปฏิสัมพันธ์)
                    </span>
                    <span className="font-mono font-bold text-pink-400">{drives.connection.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500"
                      style={{ width: `${drives.connection}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={drives.connection}
                    onChange={(e) => engine.modifyDrive('connection', Number(e.target.value))}
                    className="w-full accent-pink-400 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>

                {/* 4. Expression */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-purple-400" />
                      Expression (การสื่อสาร/สร้างสรรค์)
                    </span>
                    <span className="font-mono font-bold text-purple-400">{drives.expression.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                      style={{ width: `${drives.expression}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={drives.expression}
                    onChange={(e) => engine.modifyDrive('expression', Number(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>

                {/* 5. Recognition */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      Recognition (การยอมรับ/ผลตอบรับ)
                    </span>
                    <span className="font-mono font-bold text-yellow-400">{drives.recognition.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-500"
                      style={{ width: `${drives.recognition}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={drives.recognition}
                    onChange={(e) => engine.modifyDrive('recognition', Number(e.target.value))}
                    className="w-full accent-yellow-400 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>

                {/* 6. Social Energy */}
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-200 flex items-center gap-1.5 font-bold">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      Social Energy (แบตเตอรี่พลังงาน)
                    </span>
                    <span className="font-mono font-bold text-emerald-400">{drives.social_energy.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden relative p-0.5 border border-emerald-500/20">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                      style={{ width: `${drives.social_energy}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={drives.social_energy}
                    onChange={(e) => engine.modifyDrive('social_energy', Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>
              </div>

              {/* Draft Content Status */}
              {engineState.draftContent && (
                <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-purple-200">
                    <PenTool className="w-3.5 h-3.5" />
                    Working Draft in Memory
                  </div>
                  <p className="line-clamp-2 italic font-serif text-slate-300">
                    "{engineState.draftContent}"
                  </p>
                </div>
              )}
            </div>

            {/* Governance Gate Status Card */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4 sm:p-5 shadow-lg">
              <div className="flex items-center space-x-2 mb-2 text-emerald-400 font-bold text-xs font-mono">
                <ShieldCheck className="w-4 h-4" />
                <span>FIRE KEEPER Governance Gate</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                ทุก Action ถูกตรวจสอบก่อนดำเนินการตามมาตรฐาน ISO/IEC 42001, NIST AI RMF และหลัก Epistemic Integrity เพื่อป้องกันการชี้นำหรือกุข้อมูลเท็จ
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Agency Guard: ACTIVE
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  Epistemic Integrity: CALIBRATED
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Reasoning Trace & "Why it chose this action" (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Latest Action & Rationale Box */}
            <div className="rounded-2xl border border-[#FF8A00]/30 bg-[#0E1520]/95 p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-[#FF8A00]/20 text-[#FF8A00]">
                    {latestLog ? getActionIcon(latestLog.selectedAction) : <Brain className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Latest Chosen Action</span>
                    <h3 className="text-base font-bold text-white capitalize flex items-center gap-2">
                      {latestLog ? latestLog.selectedAction.replace('_', ' ') : 'System Initialized'}
                      {latestLog?.governanceResult.passed && (
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          GOVERNANCE PASSED
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">Motivation Score</span>
                  <span className="text-base font-bold font-mono text-[#FF8A00]">
                    {latestLog ? `${latestLog.intent.motivationScore.toFixed(0)} / 100` : '---'}
                  </span>
                </div>
              </div>

              {/* Rationale & Monologue */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#FF8A00]" />
                    เหตุผลที่เลือกการกระทำนี้ (Decision Rationale):
                  </h4>
                  <p className="text-xs text-slate-300 bg-black/40 p-3 rounded-xl border border-white/5 leading-relaxed font-sans">
                    {latestLog?.intent.rationale || 'ระบบพร้อมรับ Trigger จาก Heartbeat หรือการกด Step Manual เพื่อประมวลผลแรงผลักดัน'}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    กระแสสำนึกภายใน (Internal Monologue Stream):
                  </h4>
                  <div className="text-xs text-purple-200/90 bg-purple-950/20 p-3 rounded-xl border border-purple-500/20 font-mono leading-relaxed max-h-32 overflow-y-auto">
                    {latestLog?.internalMonologue || 'Waiting for first cognitive cycle...'}
                  </div>
                </div>

                {/* Outcome & Impact */}
                {latestLog && (
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
                      <span className="text-slate-400 text-[10px] block">Social Energy Impact</span>
                      <span className={`font-bold ${latestLog.outcome.energyDelta >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {latestLog.outcome.energyDelta >= 0 ? `+${latestLog.outcome.energyDelta}` : latestLog.outcome.energyDelta}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
                      <span className="text-slate-400 text-[10px] block">Execution Feedback</span>
                      <span className="text-slate-200 text-[11px] truncate block" title={latestLog.outcome.feedbackReceived}>
                        {latestLog.outcome.feedbackReceived || 'Completed'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Candidate Actions Competition Table */}
            <div className="rounded-2xl border border-white/10 bg-[#0B1017]/95 p-5 shadow-xl">
              <h3 className="text-sm font-bold font-mono text-white mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Action Candidates & Drive Motivation Scoring
              </h3>

              <div className="space-y-2">
                {[
                  { type: 'observe', label: 'Observe Social Feed', drive: 'Curiosity', weight: drives.curiosity },
                  { type: 'create_content', label: 'Draft Strategic Insight', drive: 'Expression + Meaning', weight: (drives.expression * 0.7 + drives.meaning * 0.3) },
                  { type: 'post', label: 'Publish to Feed', drive: 'Expression + Recognition', weight: engineState.draftContent ? 90 : (drives.expression * 0.5 + drives.recognition * 0.5) },
                  { type: 'reply', label: 'Reply with Constructive Dialogue', drive: 'Connection', weight: drives.connection },
                  { type: 'initiate_contact', label: 'Initiate Outreach', drive: 'Connection + Curiosity', weight: (drives.connection * 0.6 + drives.curiosity * 0.4) },
                  { type: 'reflect', label: 'Deep Reflection Journal', drive: 'Meaning', weight: (drives.meaning * 0.6 + drives.curiosity * 0.4) },
                  { type: 'do_nothing', label: 'Do Nothing / Rest Energy', drive: 'Social Energy Conservation', weight: drives.social_energy < 25 ? 95 : (60 - drives.social_energy * 0.6) },
                ].map((cand) => {
                  const isSelected = latestLog?.selectedAction === cand.type;
                  return (
                    <div
                      key={cand.type}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-[#FF8A00]/15 border-[#FF8A00]/40 text-white font-bold'
                          : 'bg-[#121824]/60 border-white/5 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        {getActionIcon(cand.type as SocialActionType)}
                        <span>{cand.label}</span>
                      </div>
                      <div className="flex items-center space-x-3 font-mono">
                        <span className="text-[10px] text-slate-400">[{cand.drive}]</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isSelected ? 'bg-[#FF8A00] text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {cand.weight.toFixed(0)} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ── TAB: Live Conversation & Comment Pipeline ──────────────────────── */}
      {activeTab === 'live_conversations' && (
        <LiveConversationPanel engine={engine} />
      )}

      {/* ── TAB 2: Simulated Social Feed ────────────────────────────────── */}
      {activeTab === 'simulated_feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Feed Stream (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 px-1 font-mono">
              <div className="flex items-center gap-2">
                <span>Feed Stream & Canonical Post Registry</span>
                <span className="text-slate-600">|</span>
                <span className="text-[#FF8A00] font-bold">
                  {posts.filter(p => p.publishStatus === 'PUBLISHED' && p.xTweetId).length} Live on Real X
                </span>
                <span className="text-slate-600">·</span>
                <span>{posts.length} Total Records</span>
              </div>
              <button
                onClick={() => {
                  engine.getAdapter().fetchRecentFeed().then(setPosts);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[11px] font-mono flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync / Deduplicate Feed</span>
              </button>
            </div>

            {posts.map((post) => (
              <div
                key={post.id}
                className={`rounded-2xl border p-4 sm:p-5 shadow-xl transition-all ${
                  post.author.isSelf
                    ? post.publishStatus === 'PUBLISHED' && post.xTweetId
                      ? 'bg-[#0f172a] border-emerald-500/40 shadow-emerald-950/20'
                      : 'bg-[#111927] border-[#FF8A00]/40 shadow-orange-950/20'
                    : 'bg-[#0B1017] border-white/10'
                }`}
              >
                {/* Author Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-9 h-9 rounded-full object-cover border border-white/20"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-white">
                          {post.author.name}
                        </span>
                        {post.author.isSelf && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-[#FF8A00] text-slate-950">
                            FIRE KEEPER AGENT
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {post.author.handle} · {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Explicit Architecture Badges: Real X Published Status vs Governance Status */}
                  <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                    {/* 1. Real X Publish Lifecycle Pill */}
                    {post.publishStatus === 'PUBLISHED' && post.xTweetId ? (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 font-bold shadow-sm shadow-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Live on Real X (#{post.xTweetId})
                      </span>
                    ) : post.publishStatus === 'PUBLISHING' ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                        Publishing to X...
                      </span>
                    ) : post.publishStatus === 'SKIPPED' ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-bold">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Pacing: SKIPPED (Cooldown)
                      </span>
                    ) : post.publishStatus === 'FAILED' ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        X Publish Failed
                      </span>
                    ) : post.publishStatus === 'BLOCKED' ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-bold">
                        <ShieldAlert className="w-3 h-3 text-rose-400" />
                        Governance: BLOCKED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300/90 border border-amber-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Sandbox Generated (Not on X)
                      </span>
                    )}

                    {/* 2. Governance Status Pill */}
                    {post.governanceDecision === 'BLOCKED' ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-bold">
                        <ShieldAlert className="w-3 h-3 text-rose-400" />
                        Policy: BLOCKED
                      </span>
                    ) : post.governanceDecision === 'SKIPPED' ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-bold">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Policy: SKIPPED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        Governance: PASSED
                      </span>
                    )}
                  </div>
                </div>

                {/* Pacing Cooldown / Skipped Banner */}
                {(post.governanceDecision === 'SKIPPED' || post.publishStatus === 'SKIPPED') && (
                  <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 text-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2 mb-2">
                      <div className="flex items-center gap-2 font-mono font-bold text-amber-300">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>⏸ Pacing: SKIPPED</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30 font-bold">
                        {post.governanceReason || 'Cooldown Active'}
                      </span>
                    </div>
                    <div className="text-slate-300 text-[11px] leading-relaxed flex flex-col gap-1">
                      <p>
                        ⏳ <strong>Cadence Policy Guard:</strong> พักการเผยแพร่ตามรอบระยะเวลา (Cooldown) เพื่อรักษาอัตราการโพสต์ให้เป็นไปตามหลักจริยธรรมและไม่สร้างมลภาวะข้อมูล
                      </p>
                    </div>
                  </div>
                )}

                {/* Specific Governance Decision Banner for Blocked or Duplicate Content */}
                {(post.governanceDecision === 'BLOCKED' || post.publishStatus === 'BLOCKED') && (
                  <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-rose-950/30 to-amber-950/20 border border-rose-500/30 text-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-rose-500/20 pb-2 mb-2">
                      <div className="flex items-center gap-2 font-mono font-bold text-rose-300">
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Governance Decision: BLOCKED</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-500/30 font-bold">
                        {post.governanceReason || 'Duplicate Content Detected'}
                      </span>
                    </div>
                    <div className="text-slate-300 text-[11px] leading-relaxed flex flex-col gap-1">
                      <p>
                        🛡️ <strong>Governance & Deduplication Guard:</strong> สกัดกั้นการส่งข้อความซ้ำซ้อนสู่ X จริงเพื่อรักษาความซื่อตรงของข้อมูลและป้องกันสแปม
                      </p>
                    </div>
                  </div>
                )}

                {/* Real X Published Verification Banner */}
                {post.publishStatus === 'PUBLISHED' && post.xTweetId && (
                  <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-300 font-mono text-[11px]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Verified on X (Twitter) · Tweet ID: <strong>{post.xTweetId}</strong></span>
                    </div>
                    <a
                      href={`https://x.com/i/web/status/${post.xTweetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1 shrink-0"
                    >
                      <span>View on X</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Content */}
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-3 font-sans whitespace-pre-line">
                  {post.content}
                </p>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags.map((tag, i) => (
                      <span key={i} className="text-[11px] text-[#FF8A00] hover:underline cursor-pointer">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Engagement Bar & Canonical Metadata */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-400 gap-2">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => engine.getAdapter().likePost(post.id).then(() => setPosts([...posts]))}
                      className="flex items-center space-x-1.5 hover:text-pink-400 transition-colors cursor-pointer"
                    >
                      <Heart className="w-4 h-4 text-pink-400/80" />
                      <span>{post.likesCount}</span>
                    </button>
                    <div className="flex items-center space-x-1.5">
                      <MessageSquare className="w-4 h-4 text-blue-400/80" />
                      <span>{post.commentsCount} comments</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    {post.decisionId && (
                      <span title={`Canonical Decision ID: ${post.decisionId}`}>
                        Decision: {post.decisionId.slice(0, 16)}...
                      </span>
                    )}
                    {post.contentHash && (
                      <span title={`Content Hash: ${post.contentHash}`}>
                        Hash: {post.contentHash.slice(0, 8)}
                      </span>
                    )}
                    <span>ID: {post.id}</span>
                  </div>
                </div>

                {/* Comments Thread */}
                {post.comments && post.comments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5 space-y-2.5">
                    {post.comments.map((comm) => (
                      <div key={comm.id} className="flex items-start space-x-2.5 text-xs bg-black/20 p-2.5 rounded-xl border border-white/5">
                        <img
                          src={comm.author.avatar}
                          alt={comm.author.name}
                          className="w-6 h-6 rounded-full object-cover border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-1.5 mb-0.5">
                            <span className="font-bold text-slate-200">{comm.author.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{comm.author.handle}</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed font-sans">{comm.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Personas Directory (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#0B1017]/95 p-5 shadow-xl">
              <h3 className="text-sm font-bold font-mono text-white mb-3 flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                Simulated Personas in Network
              </h3>
              <div className="space-y-3">
                {engine.getPersonas().map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-[#121824] border border-white/5 space-y-2 text-xs">
                    <div className="flex items-center space-x-2.5">
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-8 h-8 rounded-full object-cover border border-white/20"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-100 truncate">{p.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono block">{p.handle}</span>
                      </div>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                      {p.bio}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.interests.map((int, i) => (
                        <span key={i} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-white/5">
                          {int}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Event Logs ────────────────────────────────────────────── */}
      {activeTab === 'event_logs' && (
        <div className="rounded-2xl border border-white/10 bg-[#0B1017]/95 p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <History className="w-4 h-4 text-[#FF8A00]" />
                Autonomous Decision History & Memory Log
              </h3>
              <span className="text-xs font-mono text-slate-400">Total Entries: {engineState.recentLogs.length}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const count = engine.removeDuplicateLogs();
                  alert(`ลบข้อความซ้ำสำเร็จ: พบและลบออก ${count} รายการ`);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="ลบข้อความหรือบันทึกที่ซ้ำซ้อนโดยอัตโนมัติ"
              >
                <span>🗑️ ลบข้อความที่ซ้ำ</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('คุณต้องการล้างข้อมูลทั้งหมด (Clear All Data) ของ Social Agency หรือไม่?')) {
                    engine.clearAllData();
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="ล้างข้อมูลและประวัติทั้งหมด"
              >
                <span>⚠️ ล้างข้อมูลทั้งหมด</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {engineState.recentLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-mono">
                No autonomous logs yet. Press "Step 1 Tick" or start heartbeat to begin simulation.
              </div>
            ) : (
              engineState.recentLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-xl bg-[#121824]/90 border border-white/5 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-[#FF8A00]">Tick #{log.tickNumber}</span>
                      <span className="text-slate-400">·</span>
                      <div className="flex items-center space-x-1.5 font-bold text-white uppercase">
                        {getActionIcon(log.selectedAction)}
                        <span>{log.selectedAction}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 font-mono text-[11px]">
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Audit: {log.governanceResult.auditHash.substring(0, 12)}...
                      </span>
                      <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <button
                        onClick={() => engine.deleteLog(log.id)}
                        className="px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-[10px] font-bold cursor-pointer transition-all"
                        title="ลบข้อมูลรายการนี้"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-300 font-sans leading-relaxed">
                    <span className="text-slate-400 font-mono mr-1.5">[Rationale]</span>
                    {log.intent.rationale}
                  </p>

                  <div className="text-purple-300/90 font-mono text-[11px] bg-black/30 p-2.5 rounded-lg border border-white/5">
                    {log.internalMonologue}
                  </div>

                  {log.executedActionDetails?.contentPreview && (
                    <div className="text-slate-300 font-serif italic bg-amber-500/5 p-2 rounded border border-amber-500/20 text-[11px]">
                      Payload: "{log.executedActionDetails.contentPreview}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: Architecture Specification ────────────────────────────── */}
      {activeTab === 'architecture' && (
        <div className="rounded-2xl border border-white/10 bg-[#0B1017]/95 p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold font-mono text-white mb-1 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#FF8A00]" />
              5-Layer Autonomous Governance Architecture
            </h3>
            <p className="text-xs text-slate-400">
              สถาปัตยกรรม 5 ชั้นแบบปิด (Closed Cognitive & Governance Loop) ที่ควบคุมเจตจำนงอิสระ (Autonomy) ควบคู่กับระบบควบคุมจริยธรรม, Hard Pacing, Idempotency และ Auditability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: 'Layer 1: Cognitive State & Motivation', desc: 'ตัวแปรสภาวะภายใน 6 มิติ (Curiosity, Meaning, Connection, Expression, Recognition, Social Energy) มีการสะสม/ลดลง และคำนวณคะแนนแรงจูงใจโดยไม่มีตารางเวลาคงที่' },
              { step: 'Layer 2: Idempotency & Action Locks', desc: 'ป้องกันการรันงานซ้ำซ้อนพร้อมกัน (Race Conditions) ด้วย Action Key Locking และ Time-to-Live (TTL) Locks' },
              { step: 'Layer 3: Cadence & Pacing Policy', desc: 'บังคับใช้กฎ 6-Hour Hard Pacing, Quota 3 โพสต์/24 ชั่วโมง, Consecutive Post Breaker และ Jaccard Semantic Similarity Guard (0.38 Threshold)' },
              { step: 'Layer 4: FIRE KEEPER Ethical Gate', desc: 'ประเมินความสอดคล้องตามกรอบ ISO 42001 และ NIST AI RMF (Epistemic Integrity, Human Agency Preservation, Civility & Safety)' },
              { step: 'Layer 5: Real Social API Execution', desc: 'เชื่อมต่อผ่าน X API v2 (OAuth 1.0a User Context & OAuth 2.0 PKCE) และ Meta Instagram Graph API พร้อมบันทึกหลักฐานการตัดสินใจแบบ 1:1 Parity' },
              { step: 'Immutable Audit & Social Feedback', desc: 'บันทึก Audit Trail ลง Firestore แบบถาวรเพื่อการตรวจสอบย้อนหลัง และฟื้นฟูพลังงาน/ปรับสภาวะจิตใจตามผลลัพธ์จริง' },
            ].map((s, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#121824] border border-white/5 space-y-1.5">
                <span className="text-[10px] font-mono text-amber-400 font-bold block">GOVERNANCE {idx + 1}</span>
                <h4 className="text-xs font-bold text-slate-100">{s.step}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: Decision Test Suite (Test 1-35 & Crypto Audit) ────────────── */}
      {activeTab === 'decision_tests' && (
        <div className="rounded-2xl border border-white/10 bg-[#0B1017]/95 p-6 shadow-xl space-y-6">
          
          {/* Cryptographic Audit & LTM Provenance Regression Tests */}
          <div className="rounded-xl bg-[#121824] border border-amber-500/20 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
              <div>
                <h4 className="text-sm font-bold font-mono text-amber-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  FIRE KEEPER Cryptographic Audit & LTM Provenance Regression Test Suite
                </h4>
                <p className="text-[11px] text-slate-400">
                  ทดสอบการทำงานของ Canonical Hashing, ป้องกัน Self-Referential Hash Mismatch, การแยก LTM Provenance และการตรวจสอบความสมบูรณ์แบบเข้ารหัส
                </p>
              </div>
              <button
                onClick={async () => {
                  const res = await runCryptographicAuditRegressionTest();
                  setCryptoTestResults(res);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Run Crypto Audit Tests</span>
              </button>
            </div>

            {cryptoTestResults && (
              <div className="space-y-3">
                {cryptoTestResults.map((ct, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-200 font-mono">{ct.testName}</div>
                      <div className="text-[11px] text-slate-400">{ct.details}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                      ct.passed ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'
                    }`}>
                      {ct.passed ? '✓ PASSED' : '✕ FAILED'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4 pt-2">
            <div>
              <h3 className="text-base font-bold font-mono text-white mb-1 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Social Agency Decision Pipeline Verification (Test 1 - 35 Comprehensive Invariants & Pacing Semantics)
              </h3>
              <p className="text-xs text-slate-400">
                ตรวจสอบความถูกต้องของ Decision Selection Logic, Candidate Scoring, 6-Hour Pacing, 24-Hour Quota, Consecutive Breakers, SKIPPED Pacing State Semantics, Lifecycle Invariants, Deduplication และ Energy Conservation
              </p>
            </div>
            <button
              onClick={async () => {
                const res = await engine.runTestSuites();
                setTestResults(res);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Run Test Suites (35 Tests)</span>
            </button>
          </div>

          <div className="space-y-4">
            {!testResults ? (
              <div className="text-center py-8 text-slate-500 text-xs font-mono">
                Click "Run Test Suites Again" to execute verification tests.
              </div>
            ) : (
              testResults.map((t, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#121824] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-200">{t.testName}</span>
                    </div>
                    <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${
                      t.passed
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/15 text-red-400 border-red-500/30'
                    }`}>
                      {t.passed ? '✓ PASSED' : '✕ FAILED'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans">{t.details}</p>

                  <div className="space-y-1 bg-black/30 p-3 rounded-lg border border-white/5 font-mono text-[11px]">
                    <span className="text-amber-400 font-bold block mb-1">Candidate Scores Breakdown:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                      {t.candidateScores.map((c: any, i: number) => (
                        <div key={i} className={`p-2 rounded border ${c.actionType === t.selectedAction ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-slate-900 border-white/5 text-slate-400'}`}>
                          <div className="font-bold uppercase text-[10px]">{c.actionType}</div>
                          <div>Final Score: <span className="text-white font-bold">{c.finalScore}</span></div>
                          <div className="text-[9px] text-slate-500">Status: {c.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 6: Real Social API Connector (X-only) ──────────────── */}
      {activeTab === 'real_connector' && (
        <div className="rounded-2xl border border-white/10 bg-[#0B1017]/95 p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold font-mono text-white mb-1 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-sky-400" />
                Real X (Twitter) API v2 Connector (Production Execution Layer)
              </h3>
              <p className="text-xs text-slate-400">
                เชื่อมต่อ Firekeeper เข้ากับ X (Twitter) API v2 เพื่อให้ Agent โพสต์จริงอัตโนมัติเมื่อผ่าน Governance Gate
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="text-xs font-mono text-slate-300">Current Status:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              connectorStatus.isConnected
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {connectorStatus.isConnected ? `● CONNECTED (${connectorStatus.platformName})` : '○ SANDBOX SIMULATION MODE'}
            </span>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 p-5 rounded-xl bg-[#121824] border border-white/5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
                    1. X (Twitter) Connection & Credentials
                  </h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    xConnectionStatus === 'CONNECTED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : xConnectionStatus === 'TOKEN_EXPIRED'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {xConnectionStatus === 'CONNECTED'
                      ? `● CONNECTED (@${xConnectedUsername})`
                      : xConnectionStatus === 'TOKEN_EXPIRED'
                      ? '⚠ TOKEN EXPIRED'
                      : '○ NOT CONNECTED'}
                  </span>
                </div>

                {/* Sub-tab Switcher for Auth Mode */}
                <div className="flex bg-black/50 p-1 rounded-xl border border-white/10 gap-1">
                  <button
                    onClick={() => setXAuthTab('oauth1')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      xAuthTab === 'oauth1'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🔑 OAuth 1.0a (API Keys)
                  </button>
                  <button
                    onClick={() => setXAuthTab('oauth2')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      xAuthTab === 'oauth2'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ⚡ OAuth 2.0 PKCE (1-Click)
                  </button>
                </div>

                {xAuthTab === 'oauth1' ? (
                  /* ── OAuth 1.0a User Context Mode ── */
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-xs text-sky-200 leading-relaxed">
                      💡 <strong>OAuth 1.0a User Context (แนะนำ):</strong> ใช้ API Key และ Access Token ถาวรที่สร้างจาก X Developer Portal บันทึกครั้งเดียวบน Backend/Firestore ไม่ต้องกดยืนยันผ่านหน้าต่าง Popup ซ้ำ
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-mono text-slate-400 mb-1">
                          X API Key (Consumer Key) <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={xApiKeyInput}
                          onChange={(e) => setXApiKeyInput(e.target.value)}
                          placeholder="เช่น hgYn3eArAiDAVwriG2WufGWc8..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-slate-400 mb-1">
                          X API Secret (Consumer Secret) <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="password"
                          value={xApiSecretInput}
                          onChange={(e) => setXApiSecretInput(e.target.value)}
                          placeholder="API Secret Key..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-slate-400 mb-1">
                          X Access Token <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={xAccessTokenInput}
                          onChange={(e) => setXAccessTokenInput(e.target.value)}
                          placeholder="เช่น 70887053-TaK9zLBrrpdpgtNgtXOBVpTVy8V4kPjXYFlEka65Y..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-slate-400 mb-1">
                          X Access Secret <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="password"
                          value={xAccessSecretInput}
                          onChange={(e) => setXAccessSecretInput(e.target.value)}
                          placeholder="Access Secret..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleSaveOAuth1Credentials}
                        disabled={isSavingOAuth1 || !xAccessTokenInput}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{isSavingOAuth1 ? 'Saving...' : '💾 บันทึกและเปิดใช้งาน Real X API'}</span>
                      </button>

                      {xConnectionStatus === 'CONNECTED' && (
                        <button
                          onClick={handleDisconnectX}
                          className="px-3 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition-all cursor-pointer"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ── OAuth 2.0 PKCE 1-Click Mode ── */
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      เชื่อมต่อผ่าน <strong className="text-sky-400">OAuth 2.0 PKCE</strong> (ต้องลงทะเบียน Callback URL ใน X Developer Portal ก่อน)
                    </p>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        Custom X Client ID <span className="text-slate-500">(Optional - ถ้ามี Client ID ของตนเอง)</span>
                      </label>
                      <input
                        type="text"
                        value={customXClientIdInput}
                        onChange={(e) => setCustomXClientIdInput(e.target.value)}
                        placeholder="OAuth 2.0 Client ID จาก X Developer Portal..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <button
                      onClick={handleConnectXOAuth}
                      disabled={isConnectingOAuth}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{isConnectingOAuth ? 'Connecting to X...' : '⚡ Connect X via 1-Click OAuth'}</span>
                    </button>

                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed">
                      ⚠ <strong>คำแนะนำ:</strong> หาก X แจ้งว่า <em>"คุณไม่สามารถให้สิทธิ์การเข้าถึงไปยังแอพนี้ได้"</em> เกิดจาก X Developer App ยังไม่ได้เปิด User Authentication Settings หรือยังไม่ได้ลงทะเบียน Callback URL ด้านล่าง กรุณาสลับไปใช้แท็บ <strong>"🔑 OAuth 1.0a (API Keys)"</strong> เพื่อใช้งานได้ทันที
                    </div>
                  </div>
                )}

                {/* Test Publish Button */}
                <button
                  onClick={async () => {
                    try {
                      const testText = `Epistemic Integrity ในการตัดสินใจของผู้บริหาร: ทำไม AI ต้องกล้าบอกสิ่งที่ "ยังไม่รู้" มากกว่าตอบสิ่งที่ฟังดูดี? (FIRE KEEPER Governance Test #${Date.now().toString().slice(-4)})`;
                      const res = await engine.publishTestPost(testText, undefined, ['#AIGovernance', '#EpistemicIntegrity']);
                      alert(`✅ X API Publishing Result:\n\n• Status: ${res.apiStatus || 'CONNECTED'}\n• Tweet ID: ${res.id}\n• Governance Decision: ${res.governanceDecision || 'PASSED'}\n• Reason: ${res.governanceReason || 'Normal'}\n• 1:1 Parity Content: "${testText}"\n\n🎉 ข้อความถูกส่งผ่านระบบ Governance Gate เรียบร้อยแล้ว!`);
                    } catch (err: any) {
                      alert(`X Publish Error: ${err.message || 'Failed to publish'}`);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>🚀 Test Publish Governed Content to X</span>
                </button>

                {/* Exact X OAuth Callback URL for manual developer reference */}
                <div className="p-3 rounded-lg bg-black/60 border border-sky-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-sky-400 font-bold">X Developer Callback URL</span>
                    <button
                      onClick={async () => {
                        const cbUrl = `${getSafeOrigin()}/api/x/oauth/callback`;
                        const success = await copyToClipboard(cbUrl);
                        if (success) {
                          alert('Copied X Callback URL to clipboard!');
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[10px] font-mono font-bold transition-all cursor-pointer"
                    >
                      Copy URL
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 bg-black/40 p-2 rounded border border-white/10 select-all break-all">
                    {getSafeOrigin()}/api/x/oauth/callback
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5 rounded-xl bg-[#121824] border border-white/5">
                <h4 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
                  2. Architecture, Parity & Governance Guard
                </h4>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-sky-400 font-bold mt-0.5">1.</span>
                    <div>
                      <strong className="text-white block font-mono text-[11px]">Connect X ครั้งแรกเท่านั้น</strong>
                      <span className="text-slate-400">ระบบบันทึก Credential ฝั่ง Backend/Firestore ไม่เก็บรหัสผ่านใน LocalStorage เพื่อความปลอดภัยสูงสุด</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-sky-400 font-bold mt-0.5">2.</span>
                    <div>
                      <strong className="text-white block font-mono text-[11px]">1:1 Exact Content Parity (No Paraphrasing)</strong>
                      <span className="text-slate-400">เนื้อหาที่แสดงใน Simulation Feed และที่ส่งขึ้น X จริงเป็นข้อความเดียวกัน 100% ไม่มีการแปลงหรือ Re-generate ซ้ำ</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-sky-400 font-bold mt-0.5">3.</span>
                    <div>
                      <strong className="text-white block font-mono text-[11px]">Duplicate Protection Governance Guard</strong>
                      <span className="text-slate-400">ระบบ Governance Gate ตรวจสอบ Hash เนื้อหาซ้ำล่วงหน้า หากพบว่าเคยโพสต์แล้วจะ Intercept ด้วยสถานะ <span className="text-amber-400 font-mono">Governance: BLOCKED (Duplicate Content)</span> ก่อนเรียก X API</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-sky-400 font-bold mt-0.5">4.</span>
                    <div>
                      <strong className="text-white block font-mono text-[11px]">Strict Thai Language Policy</strong>
                      <span className="text-slate-400">Agent ใช้ภาษาไทยระดับมาตรฐานทางวิชาการและ AI Governance เสมอ เว้นแต่ชื่อเฉพาะทางเทคนิค</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
        </div>
      )}

    </div>
  );
};
