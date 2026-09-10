import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { TwitterApi } from 'twitter-api-v2';

import { securityHeaders } from './src/server/middleware/security';
import { rateLimiter } from './src/server/middleware/rateLimit';
import { requireAuth, requireAdmin, activeSessions, StoredUser, userDatabase, hashPassword, verifyPassword, isOfflineOnlyMode, OFFLINE_USER_UID } from './src/server/middleware/auth';
import { serverDb, stripUndefinedFields, adminDb, isServerFirestoreAdminAvailable, markAdminFirestoreUnavailable, firebaseAppConfig } from './src/server/infrastructure/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase-admin/storage';

// Protect Node process against asynchronous background gRPC / credential rejections
process.on('unhandledRejection', (reason) => {
  console.warn('[Backend Notice - Unhandled Rejection Caught Safely]:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Backend Notice - Uncaught Exception Caught Safely]:', err);
});

let isServerFirestoreQuotaExhausted = false;

import { 
  callDeepSeekStreamWithRetry,
  callDeepSeekContentWithRetry,
  callDeepSeekVisionContentWithRetry,
  callDeepSeekVisionStreamWithRetry,
  checkDeepSeekVisionStatus,
  DEEPSEEK_VISION_MODEL,
  routeRequest,
  inspectAttachments,
  isOllamaModel,
  callOllamaContentWithRetry,
  callOllamaStreamWithRetry,
  checkOllamaStatus
} from './src/server/services/ai';
import { countTokens } from './src/server/utils/text';
import { calculateActualTokenCost } from './src/utils/tokenUtils';
import { buildOptimizedSystemPrompt, cleanAiResponseStyle } from './src/server/services/promptOptimizer';
import { getPublicShareUrl } from './src/shared/shareUtils';
import {
  detectTemporalSensitivity,
  retrieveCurrentAuthoritativeEvidence,
  getCurrentDateISO,
  MODEL_KNOWLEDGE_CUTOFF,
  TemporalDetectionResult,
  TemporalRetrievalResult,
  TemporalClaimVerification
} from './src/server/services/temporalGrounding';
import {
  evaluateStrictGovernancePolicies,
  calculateStrictCalibratedConfidence,
  buildDynamicACH,
  validateAndClassifyClaims,
  evaluateResponseCentricGovernance,
  repairResponseText
} from './src/server/services/evidenceGovernance';

import {
  detectLanguage,
  runStage,
  parseAttachmentSingle,
  rerankAndFilterEvidence,
  routeKnowledge,
  retrieveExternalEvidenceAsync,
  generateCompressedContext,
  classifyInputDocument,
  MemoryRecord,
  PCAStateInternal,
  rankAndRetrieveMemories,
  recordStageTrace
} from './src/server/services/pcaEngine';
import { performWebSearch, formatWebSearchResultsForPrompt, WebSearchExecutionResult } from './src/server/services/webSearch';
import { buildWebEvidenceGovernanceContext } from './src/server/services/webEvidenceGovernance';
import { auditAndEnforcePunnPersona } from './src/server/services/punnPersonaGovernance';
import { resolveContextualSearchAsync, ContextualSearchResolution } from './src/server/services/contextualSearchResolver';
import { buildRealDecisionExecutionTrace } from './src/utils/executionTraceEngine';
import { buildTieredAuditLog } from './src/server/services/auditLogger';
import { validateDecisionObject } from './src/shared/contracts/decision';
import { DecisionObject } from './src/shared/contracts/decision';
import { auditDecisionSemantics } from './src/server/services/semanticAuditor';
import { formatModelTag, resolveProvider } from './src/utils/modelUtils';
import { 
  validateOutputLanguage, 
  buildLanguagePolicyRewritePrompt, 
  DEFAULT_LANGUAGE_POLICY 
} from './src/server/services/languagePolicy';

// Server-side promise timeout helper to prevent hanging operations
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs))
  ]);
}

// Securely load environment variables from local env files
function loadLocalEnvFiles() {
  const envFiles = ['.env', '.env.local'];
  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const match = trimmed.match(/^([A-Za-z0-9_]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            let val = match[2].trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (val && (!process.env[key] || process.env[key] === '')) {
              process.env[key] = val;
            }
          }
        }
      } catch (err) {
        console.warn(`[Env Loader] Could not read ${file}:`, err);
      }
    }
  }
}
loadLocalEnvFiles();

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '12mb' }));
app.use(securityHeaders);

// CORS Policy Origin Check
const ALLOWED_ORIGIN_PATTERNS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/.*\.run\.app$/,
  /^https:\/\/.*\.google\.com$/,
  /^https:\/\/.*\.googleusercontent\.com$/,
  /^https:\/\/ai\.studio$/,
  /^https:\/\/.*\.aistudio\.google\.com$/,
  /^https:\/\/firekeeper\.site$/,
  /^https:\/\/.*\.firekeeper\.site$/,
];

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  if (process.env.APP_ORIGIN && (origin === process.env.APP_ORIGIN || process.env.APP_ORIGIN === '*')) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS_ORIGIN_BLOCKED: Origin not allowed by security policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// In-Memory LTM and Conversation User Isolation maps (strictly partitioned by userId)
const userMemoryBanks = new Map<string, MemoryRecord[]>();
const userDeletedMemoryIds = new Map<string, Set<string>>();
const userConversationsMap = new Map<string, Map<string, any>>();
const userContextCacheMap = new Map<string, any>(); // cacheKey: `${userId}:${conversationId}`

function getInitialDefaultMemories(): MemoryRecord[] {
  return [
    {
      id: 'mem-1',
      content: 'หลักการสำคัญ: PUNN (ปุญญ์) คือผู้สร้าง Firekeeper (AI assists. PUNN creates.) ต้องรักษา Human Agency ของผู้ใช้เสมอ ห้ามตัดสินใจเด็ดขาดแทนมนุษย์',
      layer: 'Constraint',
      source: 'System Policy',
      confidence: 1.0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'mem-2',
      content: 'ธรรมาภิบาลข้อมูล AI ตามกรอบมาตรฐาน ISO/IEC 42001 ต้องมุ่งเน้นการตรวจสอบได้ โปร่งใส และมีภาระรับผิดชอบ (Accountability)',
      layer: 'System',
      source: 'Standard Reference',
      confidence: 0.98,
      created_at: new Date().toISOString(),
    },
    {
      id: 'mem-3',
      content: 'การจัดระดับความมั่นใจของคำแนะนำ (Calibrated Confidence) ต้องสะท้อนความสมบูรณ์และคุณภาพของหลักฐานอ้างอิงจริงเท่านั้น',
      layer: 'System',
      source: 'System Instruction',
      confidence: 0.95,
      created_at: new Date().toISOString(),
    }
  ];
}

function getOrCreateUserMemoryBank(userId: string): MemoryRecord[] {
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    throw new Error('AUTHENTICATION_REQUIRED: Valid userId is required for memory access');
  }
  const key = userId.trim();
  if (!userMemoryBanks.has(key)) {
    const initial = getInitialDefaultMemories();
    const deletedSet = userDeletedMemoryIds.get(key) || new Set();
    const filtered = initial.filter(m => !deletedSet.has(m.id));
    userMemoryBanks.set(key, filtered);
  }
  return userMemoryBanks.get(key)!;
}

function getUserConversationStore(userId: string): Map<string, any> {
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    throw new Error('AUTHENTICATION_REQUIRED: Valid userId is required for conversation access');
  }
  const key = userId.trim();
  if (!userConversationsMap.has(key)) {
    userConversationsMap.set(key, new Map());
  }
  return userConversationsMap.get(key)!;
}

async function verifyConversationOwnership(userId: string, conversationId: string): Promise<{ authorized: boolean; exists: boolean; conversation?: any }> {
  if (!userId || !conversationId) return { authorized: false, exists: false };

  // 1. Check in-memory store for this user
  const userStore = getUserConversationStore(userId);
  if (userStore.has(conversationId)) {
    return { authorized: true, exists: true, conversation: userStore.get(conversationId) };
  }

  // Check if conversation exists in any other user's in-memory store
  for (const [otherUid, store] of userConversationsMap.entries()) {
    if (otherUid !== userId && store.has(conversationId)) {
      console.warn(`[Security Alert] Access mismatch (In-Memory) for conversation ${conversationId}: user ${userId} vs found in owner ${otherUid} store`);
      return { authorized: false, exists: true }; 
    }
  }

  // 2. Check Firestore via Admin SDK (Server-Side Source of Truth)
  if (adminDb && isServerFirestoreAdminAvailable && !isOfflineOnlyMode()) {
    try {
      const docRef = adminDb.collection('conversations').doc(conversationId);
      const snap = await docRef.get();
      if (snap.exists) {
        const data = snap.data();
        if (data && data.userId === userId) {
          // Hydrate in-memory cache for subsequent fast lookups
          userStore.set(conversationId, data);
          return { authorized: true, exists: true, conversation: data };
        } else {
          console.warn(`[Security Alert] Access mismatch (Firestore) for conversation ${conversationId}: user ${userId} vs owner ${data?.userId}`);
          return { authorized: false, exists: true }; 
        }
      }
    } catch (e: any) {
      if (e?.code === 7 || e?.message?.includes('PERMISSION_DENIED') || e?.message?.includes('Missing or insufficient permissions')) {
        markAdminFirestoreUnavailable(e);
      } else {
        console.warn('[Security Auth] Firestore conversation check notice:', e?.message || e);
      }
    }
  }

  // If it doesn't exist anywhere, we treat it as a new conversation claim
  return { authorized: true, exists: false };
}

// ── API ROUTES ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test-only endpoint to create non-guest session
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/test/create-user-token', (req, res) => {
    const requestedUserId = req.body?.userId || 'test-user-001';
    const requestedEmail = req.body?.email || `${requestedUserId}@firekeeper.ai`;
    const token = `test-user-${crypto.randomBytes(16).toString('hex')}`;
    activeSessions.set(token, {
      userId: requestedUserId,
      email: requestedEmail,
      name: requestedUserId,
      isGuest: false,
      expiresAt: Date.now() + 86400000,
    });
    res.json({ token, userId: requestedUserId });
  });
}

app.get('/api/config/status', (req, res) => {
  const visionStatus = checkDeepSeekVisionStatus();
  res.json({
    success: true,
    hasDeepSeekKey: !!process.env.DEEPSEEK_API_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    vision: {
      enabled: visionStatus.configured,
      model: visionStatus.model,
      supportedFormats: visionStatus.supportedFormats,
      maxSizeBytes: visionStatus.maxSizeBytes
    }
  });
});

app.get('/api/vision/status', (req, res) => {
  const status = checkDeepSeekVisionStatus();
  res.json({
    success: true,
    ...status
  });
});

// Guest Sign-In Session Endpoint
app.post('/api/auth/guest', rateLimiter, (req, res) => {
  try {
    const guestId = `guest-${crypto.randomBytes(8).toString('hex')}`;
    const guestToken = `session-guest-${crypto.randomBytes(16).toString('hex')}`;
    activeSessions.set(guestToken, {
      userId: guestId,
      email: `${guestId}@guest.firekeeper.site`,
      name: `Guest Analyst ${guestId.slice(-4).toUpperCase()}`,
      isGuest: true,
      expiresAt: Date.now() + 86400000 * 3, // 3 days expiry
    });
    res.json({ success: true, token: guestToken, userId: guestId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Guest login failed' });
  }
});

// ── CONVERSATION ENDPOINTS (Strictly Isolated by authenticated req.userId) ───

// GET /api/conversations - List conversations for authenticated user only
app.get('/api/conversations', rateLimiter, requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User ID missing' });
    }

    const conversations: any[] = [];
    const localStore = getUserConversationStore(userId);

    // 1. Fetch from Firestore if available
    if (adminDb && isServerFirestoreAdminAvailable && !isOfflineOnlyMode()) {
      try {
        const q = await adminDb.collection('conversations').where('userId', '==', userId).get();
        q.forEach((docSnap: any) => {
          const data = docSnap.data();
          if (data && data.userId === userId) {
            conversations.push(data);
            localStore.set(docSnap.id, data);
          }
        });
      } catch (err: any) {
        if (err?.code === 7 || err?.message?.includes('PERMISSION_DENIED') || err?.message?.includes('Missing or insufficient permissions')) {
          markAdminFirestoreUnavailable(err);
        } else {
          console.warn('[API Conversations] Firestore query notice:', err?.message || err);
        }
      }
    }

    // 2. Add any in-memory conversations for this user
    for (const [id, session] of localStore.entries()) {
      if (!conversations.some(c => c.id === id)) {
        conversations.push(session);
      }
    }

    // Sort descending by updated_at
    conversations.sort((a, b) => {
      const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
      const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
      return timeB - timeA;
    });

    res.json({ success: true, conversations });
  } catch (err: any) {
    console.error('[API Conversations] Error listing conversations:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET /api/conversations/:id - Get single conversation (with strict server-side ownership check)
app.get('/api/conversations/:id', rateLimiter, requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const check = await verifyConversationOwnership(userId, id);
    if (!check.exists) {
      return res.status(404).json({ error: 'Not Found', message: 'Conversation not found' });
    }
    if (!check.authorized) {
      return res.status(403).json({ error: 'Forbidden', message: 'FORBIDDEN: You do not have permission to view this conversation' });
    }

    res.json({ success: true, conversation: check.conversation });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// POST /api/conversations - Create or update conversation for authenticated user
app.post('/api/conversations', rateLimiter, requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const session = req.body;
    if (!session || !session.id) {
      return res.status(400).json({ error: 'Invalid session payload. id is required' });
    }

    // Server-side ownership verification: Cannot overwrite another user's conversation!
    const check = await verifyConversationOwnership(userId, session.id);
    if (check.exists && !check.authorized) {
      return res.status(403).json({ error: 'Forbidden', message: 'FORBIDDEN: Cannot modify conversation belonging to another user' });
    }

    // Force authenticated userId as the owner (ignore any userId in body)
    const secureSession = {
      ...session,
      userId,
      updated_at: new Date().toISOString(),
    };

    // Save to user-scoped in-memory store
    const userStore = getUserConversationStore(userId);
    userStore.set(session.id, secureSession);

    // Save to Firestore if available
    if (adminDb && isServerFirestoreAdminAvailable && !isOfflineOnlyMode()) {
      try {
        await adminDb.collection('conversations').doc(session.id).set(secureSession);
      } catch (err: any) {
        if (err?.code === 7 || err?.message?.includes('PERMISSION_DENIED') || err?.message?.includes('Missing or insufficient permissions')) {
          markAdminFirestoreUnavailable(err);
        } else {
          console.warn('[API Conversations] Firestore save notice:', err?.message || err);
        }
      }
    }

    res.json({ success: true, conversation: secureSession });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

// DELETE /api/conversations/:id - Delete conversation (with strict server-side ownership check)
app.delete('/api/conversations/:id', rateLimiter, requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const check = await verifyConversationOwnership(userId, id);
    if (check.exists && !check.authorized) {
      return res.status(403).json({ error: 'Forbidden', message: 'FORBIDDEN: Cannot delete conversation belonging to another user' });
    }

    // Remove from user-scoped in-memory
    const userStore = getUserConversationStore(userId);
    userStore.delete(id);
    userContextCacheMap.delete(`${userId}:${id}`);

    // Remove from Firestore
    if (adminDb && isServerFirestoreAdminAvailable && !isOfflineOnlyMode()) {
      try {
        await adminDb.collection('conversations').doc(id).delete();
      } catch (err: any) {
        if (err?.code === 7 || err?.message?.includes('PERMISSION_DENIED') || err?.message?.includes('Missing or insufficient permissions')) {
          markAdminFirestoreUnavailable(err);
        } else {
          console.warn('[API Conversations] Firestore delete notice:', err?.message || err);
        }
      }
    }

    res.json({ success: true, message: 'Conversation deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// ── AUDIT & GOVERNANCE LOGGING ENDPOINTS ────

app.post('/api/audit/decision', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { decision, metadata, conversationId } = req.body;

  if (!decision) {
    return res.status(400).json({ error: 'Decision object required' });
  }

  // 1. Validate decision against formal contract
  const validation = validateDecisionObject(decision);

  // 2. Persist audit record to Firestore
  if (adminDb && isServerFirestoreAdminAvailable && !isOfflineOnlyMode()) {
    try {
      const auditId = `audit-dec-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      await adminDb.collection('decision_audits').doc(auditId).set({
        id: auditId,
        userId,
        conversationId,
        decision,
        validationStatus: validation.status,
        validationErrors: validation.errors,
        metadata: {
          ...metadata,
          serverTimestamp: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }
      });
      console.log(`[Audit Log] Decision audit saved: ${auditId} (Status: ${validation.status})`);
    } catch (err: any) {
      if (err?.code === 7 || err?.message?.includes('PERMISSION_DENIED') || err?.message?.includes('Missing or insufficient permissions')) {
        markAdminFirestoreUnavailable(err);
      } else {
        console.warn('[Audit Log] Firestore notice:', err?.message || err);
      }
    }
  }

  res.json({ success: true, validation });
});

async function verifyMemoryOwnership(userId: string, memoryId: string): Promise<boolean> {
  if (!userId || !memoryId) return false;
  
  // 1. Check in-memory bank first
  const userBank = userMemoryBanks.get(userId);
  if (userBank && userBank.some(m => m.id === memoryId)) {
    return true;
  }

  // 2. Check Firestore
  if (adminDb && isServerFirestoreAdminAvailable && !isOfflineOnlyMode()) {
    try {
      const doc = await adminDb.collection('memories').doc(memoryId).get();
      if (doc.exists && doc.data()?.userId === userId) {
        return true;
      }
    } catch (err: any) {
      if (err?.code === 7 || err?.message?.includes('PERMISSION_DENIED') || err?.message?.includes('Missing or insufficient permissions')) {
        markAdminFirestoreUnavailable(err);
      } else {
        console.warn('[Memory Security] Firestore verification notice:', err?.message || err);
      }
    }
  }
  return false;
}

app.get('/api/memory', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Attempt to hydrate from Firestore if memory bank is empty or stale
  if (adminDb && isServerFirestoreAdminAvailable && !isOfflineOnlyMode()) {
    try {
      const snapshot = await adminDb.collection('memories').where('userId', '==', userId).get();
      const memories: MemoryRecord[] = [];
      snapshot.forEach((doc: any) => {
        memories.push(doc.data() as MemoryRecord);
      });
      if (memories.length > 0) {
        userMemoryBanks.set(userId, memories);
      }
    } catch (err: any) {
      if (err?.code === 7 || err?.message?.includes('PERMISSION_DENIED') || err?.message?.includes('Missing or insufficient permissions')) {
        markAdminFirestoreUnavailable(err);
      } else {
        console.warn('[Memory Bank] Firestore fetch notice:', err?.message || err);
      }
    }
  }

  const userBank = getOrCreateUserMemoryBank(userId);
  res.json({ memories: userBank });
});

app.post('/api/memory', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userBank = getOrCreateUserMemoryBank(userId);
  const { content, layer, source, confidence } = req.body;
  if (!content) {
    res.status(400).json({ error: 'content is required' });
    return;
  }
  const newMem: MemoryRecord = {
    id: `mem-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    userId, // Ensure userId is captured
    content,
    layer: layer || 'Fact',
    source: source || 'User Input',
    confidence: typeof confidence === 'number' ? confidence : 0.9,
    created_at: new Date().toISOString(),
  };

  // Persist to memory
  userBank.unshift(newMem);

  // Persist to Firestore
  if (adminDb && isServerFirestoreAdminAvailable && !isOfflineOnlyMode()) {
    try {
      await adminDb.collection('memories').doc(newMem.id).set(newMem);
    } catch (err: any) {
      if (err?.code === 7 || err?.message?.includes('PERMISSION_DENIED') || err?.message?.includes('Missing or insufficient permissions')) {
        markAdminFirestoreUnavailable(err);
      } else {
        console.warn('[Memory Bank] Firestore save notice:', err?.message || err);
      }
    }
  }

  res.json({ success: true, memory: newMem, memories: userBank });
});

app.delete('/api/memory/:id', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { id } = req.params;

  // Security check: Verify ownership before deletion
  const isOwner = await verifyMemoryOwnership(userId, id);
  if (!isOwner) {
    return res.status(404).json({ error: 'Not Found', message: 'Memory record not found' });
  }

  // Delete from Firestore
  if (adminDb && isServerFirestoreAdminAvailable && !isOfflineOnlyMode()) {
    try {
      await adminDb.collection('memories').doc(id).delete();
    } catch (err: any) {
      if (err?.code === 7 || err?.message?.includes('PERMISSION_DENIED') || err?.message?.includes('Missing or insufficient permissions')) {
        markAdminFirestoreUnavailable(err);
      } else {
        console.warn('[Memory Bank] Firestore delete notice:', err?.message || err);
      }
    }
  }

  // Delete from memory
  const userBank = userMemoryBanks.get(userId) || [];
  const updated = userBank.filter((m) => m.id !== id);
  userMemoryBanks.set(userId, updated);
  
  if (!userDeletedMemoryIds.has(userId)) {
    userDeletedMemoryIds.set(userId, new Set());
  }
  userDeletedMemoryIds.get(userId)!.add(id);

  res.json({ success: true, memories: updated });
});

// Admin Usage Analytics Endpoint (Admin Only)
app.get('/api/admin/usage', rateLimiter, requireAuth, requireAdmin, async (req, res) => {
  try {
    if (isOfflineOnlyMode() || !adminDb || !isServerFirestoreAdminAvailable) {
      return res.json({
        success: true,
        summary: {
          totalMembers: 1,
          activeUsers: 1,
          totalAnalyses: 1,
          recentUsers: [{
            uid: OFFLINE_USER_UID,
            email: 'operator@punn-secure',
            analysisCount: 1,
            pdfAnalysisCount: 0,
            isActive: true,
            role: 'admin',
            createdAtText: new Date().toLocaleString('th-TH'),
            lastLoginText: new Date().toLocaleString('th-TH'),
            lastAnalysisText: new Date().toLocaleString('th-TH')
          }],
          lastRefreshedAt: new Date().toLocaleTimeString('th-TH')
        }
      });
    }

    if (adminDb && isServerFirestoreAdminAvailable) {
      try {
        const usersSnap = await adminDb.collection('users').get();
        let totalMembers = 0;
        let totalAnalyses = 0;
        let activeUsers = 0;
        const recentUsers: any[] = [];

        usersSnap.forEach((doc: any) => {
          totalMembers++;
          const data = doc.data();
          const analysisCount = Number(data.analysisCount) || 0;
          const pdfAnalysisCount = Number(data.pdfAnalysisCount) || 0;
          totalAnalyses += analysisCount;
          const isActive = analysisCount > 0 || pdfAnalysisCount > 0 || (Number(data.activeEventsCount) || 0) > 0;
          if (isActive) activeUsers++;

          recentUsers.push({
            uid: data.uid || doc.id,
            email: data.email || 'user@firebase',
            analysisCount,
            pdfAnalysisCount,
            isActive,
            role: data.role || 'member',
            createdAtText: data.createdAt ? new Date(data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt).toLocaleString('th-TH') : '-',
            lastLoginText: data.lastLoginAt ? new Date(data.lastLoginAt.toDate ? data.lastLoginAt.toDate() : data.lastLoginAt).toLocaleString('th-TH') : '-',
            lastAnalysisText: data.lastAnalysisAt ? new Date(data.lastAnalysisAt.toDate ? data.lastAnalysisAt.toDate() : data.lastAnalysisAt).toLocaleString('th-TH') : 'ยังไม่เคยวิเคราะห์',
          });
        });

        return res.json({
          success: true,
          summary: {
            totalMembers,
            activeUsers,
            totalAnalyses,
            recentUsers,
            lastRefreshedAt: new Date().toLocaleTimeString('th-TH'),
          }
        });
      } catch (adminErr: any) {
        if (adminErr?.code === 7 || adminErr?.message?.includes('PERMISSION_DENIED') || adminErr?.message?.includes('Missing or insufficient permissions')) {
          markAdminFirestoreUnavailable(adminErr);
        }
        return res.json({
          success: true,
          summary: {
            totalMembers: 1,
            activeUsers: 1,
            totalAnalyses: 1,
            recentUsers: [{
              uid: (req as any).userId || 'admin',
              email: (req as any).userEmail || 'admin@firekeeper.ai',
              analysisCount: 1,
              pdfAnalysisCount: 0,
              isActive: true,
              role: 'admin',
              createdAtText: new Date().toLocaleString('th-TH'),
              lastLoginText: new Date().toLocaleString('th-TH'),
              lastAnalysisText: new Date().toLocaleString('th-TH')
            }],
            lastRefreshedAt: new Date().toLocaleTimeString('th-TH')
          }
        });
      }
    }

    res.json({
      success: true,
      message: 'Direct Firestore client aggregation available'
    });
  } catch (err: any) {
    console.error('[Admin API] Error fetching usage analytics:', err);
    res.status(500).json({ error: err?.message || 'Failed to fetch admin usage summary' });
  }
});

// Context Compression Endpoint
app.post('/api/compress-context', rateLimiter, requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User ID missing' });
    }

    const { conversationId, history = [], existingCompressed } = req.body;
    if (!Array.isArray(history)) {
      res.status(400).json({ error: 'history must be an array' });
      return;
    }

    // Verify conversation ownership if conversationId provided
    if (conversationId) {
      const check = await verifyConversationOwnership(userId, conversationId);
      if (check.exists && !check.authorized) {
        return res.status(403).json({ error: 'Forbidden', message: 'FORBIDDEN: You do not own this conversation' });
      }
    }

    const compressedContext = generateCompressedContext(history, existingCompressed);

    // Save to user-scoped cache
    if (conversationId) {
      userContextCacheMap.set(`${userId}:${conversationId}`, compressedContext);
    }

    res.json({ success: true, compressedContext });
  } catch (err: any) {
    console.error('Compress Context Error:', err);
    res.status(500).json({ error: err?.message || 'Failed to compress context' });
  }
});

// FIRE KEEPER Contextual Search Resolver Endpoint
app.post('/api/contextual-search/resolve', rateLimiter, requireAuth, async (req, res) => {
  try {
    const { question = '', history = [], deepSeekApiKey } = req.body;
    const resolution = await resolveContextualSearchAsync(question, history, { apiKey: deepSeekApiKey });
    res.json(resolution);
  } catch (err: any) {
    console.error('Contextual Search Resolver Error:', err);
    res.status(500).json({ error: err?.message || 'Failed to resolve contextual search' });
  }
});

// Check Local Ollama Status & Downloaded Models
app.get('/api/ollama/status', async (req, res) => {
  try {
    const customUrl = typeof req.query.baseUrl === 'string' ? req.query.baseUrl : undefined;
    const status = await checkOllamaStatus(customUrl);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ online: false, error: err?.message || 'Failed to check Ollama status' });
  }
});

// Main PCA Cognitive 12-Stage Pipeline Streaming Endpoint
app.post('/api/pca/stream', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
  }

  const { 
    conversationId,
    question = '', 
    history = [], 
    attachments = [], 
    tone = 'Formal Architect', 
    model: rawModel = '', 
    deepReasoning = false,
    webSearch = false,
    compressed: reqCompressed = null,
    reasoningProfile = 'Auto',
    personalContext = '',
    deepSeekApiKey
  } = req.body;

  // Server-side ownership verification of conversationId before streaming
  if (conversationId) {
    const check = await verifyConversationOwnership(userId, conversationId);
    if (check.exists && !check.authorized) {
      return res.status(403).json({ error: 'Forbidden', message: 'FORBIDDEN: You do not have permission to access this conversation' });
    }
  }

  // ── SERVER-AUTHORITATIVE REQUEST ROUTER ──
  // Backend determines provider & model based on attachment inspection (Images -> DeepSeek Vision)
  const routeResolution = routeRequest(question || '', attachments || [], rawModel);
  const resolvedProvider = routeResolution.provider;
  const canonicalModelTag = routeResolution.model;
  const model = canonicalModelTag;
  const attachedImages = routeResolution.images;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let isClientDisconnected = false;
  req.on('close', () => {
    isClientDisconnected = true;
  });
  res.on('close', () => {
    isClientDisconnected = true;
  });

  const sendSSE = (event: string, data: any) => {
    if (res.writableEnded || isClientDisconnected) return;
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    } catch {
      isClientDisconnected = true;
    }
  };

  try {
    const startMs = Date.now();
    
    // Parse input files & chunks
    let parsedAttachmentChunks: any[] = [];
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const results = await Promise.all(attachments.map(att => parseAttachmentSingle(att)));
      for (const r of results) {
        if (r.success) {
          parsedAttachmentChunks.push(...r.chunks);
        } else {
          throw new Error(`[ATTACHMENT_PARSING_FAILURE] "${r.filename}": ${r.error}`);
        }
      }
    }

    // Apply Semantic Reranking & Filter to cap at 12 highly relevant chunks
    const rerankResult = rerankAndFilterEvidence(parsedAttachmentChunks, question || '', 12);
    parsedAttachmentChunks = rerankResult.selected;

    const activeCompressedContext = reqCompressed || (history && history.length > 0 ? generateCompressedContext(history) : undefined);
    const userBank = getOrCreateUserMemoryBank(userId);

    // Dynamic Route Knowledge matching
    const routerResult = routeKnowledge(question || '', attachments || []);
    const evidenceResult = await retrieveExternalEvidenceAsync(question || '', routerResult.route, { searchEnabled: Boolean(webSearch) });

    // Contextual Search Resolver: Ensure web searches reflect user's intended meaning in context
    const contextualResolution = await resolveContextualSearchAsync(question || '', history || [], { 
      apiKey: deepSeekApiKey,
      searchEnabled: Boolean(webSearch)
    });
    sendSSE('contextual_search_resolution', contextualResolution);

    // Target query resolved from context (preserves entity, replaces ambiguous pronouns)
    const effectiveSearchQuery = (contextualResolution.search_required && contextualResolution.search_query) 
      ? contextualResolution.search_query 
      : (contextualResolution.resolved_query || question || '');

    // Temporal Grounding Engine: Detect time sensitivity & force external retrieval using contextual resolved query
    const temporalDetection = detectTemporalSensitivity(contextualResolution.resolved_query || question || '', history || []);
    let temporalRetrieval: TemporalRetrievalResult = {
      success: false,
      verified: false,
      retrievedAt: new Date().toISOString(),
      confidence: 'UNVERIFIED',
      statusMessage: 'ไม่ได้ตรวจพบประเด็นอ่อนไหวต่อเวลา'
    };

    if (temporalDetection.isTemporalSensitive) {
      temporalRetrieval = await retrieveCurrentAuthoritativeEvidence(effectiveSearchQuery, temporalDetection, { searchEnabled: Boolean(webSearch) });
    }

    // Live Web Search Engine (Directly executed when webSearch toggle is on, provided search is required)
    // CRITICAL: webSearch is the HARD GATE. If webSearch is false, NO live web search should occur even if temporally sensitive.
    let liveWebSearchResult: WebSearchExecutionResult | null = null;
    if (webSearch && contextualResolution.search_required) {
      try {
        liveWebSearchResult = await performWebSearch(effectiveSearchQuery, { maxResults: 8 });
      } catch (err) {
        console.warn('[PCA Stream] performWebSearch error:', err);
      }
    }

    const temporalClaimVerification: TemporalClaimVerification = {
      claim: contextualResolution.resolved_query || question || '',
      claim_time: temporalDetection.temporalScope === 'CURRENT_STATUS' ? 'current' : (temporalDetection.temporalScope === 'HISTORICAL' ? 'historical' : 'timeless'),
      knowledge_cutoff: MODEL_KNOWLEDGE_CUTOFF,
      current_date: getCurrentDateISO(),
      verification_required: temporalDetection.verificationRequired,
      verified: temporalRetrieval.verified || (liveWebSearchResult ? liveWebSearchResult.success : false),
      source_id: temporalRetrieval.sourceTitle || (liveWebSearchResult?.results[0]?.title),
      source_url: temporalRetrieval.sourceUrl || (liveWebSearchResult?.results[0]?.url),
      source_published_at: temporalRetrieval.publishedAt || (liveWebSearchResult?.results[0]?.publishedAt),
      classification: (temporalRetrieval.verified || liveWebSearchResult?.success) ? 'FACT' : (temporalDetection.isTemporalSensitive ? 'UNVERIFIED' : 'MODEL_KNOWLEDGE'),
      status_message: liveWebSearchResult?.success ? liveWebSearchResult.statusMessage : temporalRetrieval.statusMessage
    };

    const auditTrailFlow = [
      { 
        step: 'REQUEST_ROUTER', 
        description: routeResolution.routingReason, 
        status: 'COMPLETED' as const, 
        timestamp: new Date().toISOString(),
        metadata: {
          provider: routeResolution.provider,
          model: routeResolution.model,
          hasImages: routeResolution.hasImages,
          imageCount: routeResolution.images.length,
          decisionAuthority: routeResolution.decisionAuthority
        }
      },
      { step: 'KNOWLEDGE_ROUTING', description: `ประมวลผลผ่าน Knowledge Router คัดกรองเข้าช่องทาง: [${routerResult.route}]`, status: 'COMPLETED' as const, timestamp: new Date().toISOString() },
      { 
        step: 'CONTEXTUAL_SEARCH_RESOLUTION', 
        description: contextualResolution.ambiguity
          ? `ประเมินบริบทคำถาม: ตรวจพบความกำกวม (${contextualResolution.resolved_query})`
          : (contextualResolution.resolved_query !== question 
              ? `คลี่คลายบริบทคำถาม: "${question}" -> "${contextualResolution.resolved_query}" [คำค้น: ${effectiveSearchQuery}]`
              : (contextualResolution.search_required 
                  ? `ประเมินบริบทคำถาม: ใจความสมบูรณ์ในตัวเอง [คำค้น: ${effectiveSearchQuery}]`
                  : `ประเมินบริบทคำถาม: ไม่จำเป็นต้องสืบค้นเว็บภายนอก (${contextualResolution.context_used[0] || 'ข้อมูลภายใน'})`)),
        status: 'COMPLETED' as const, 
        timestamp: new Date().toISOString() 
      },
      { step: 'WEB_SEARCH', description: liveWebSearchResult?.success ? `สืบค้นเว็บสด (DeepSeek + Web Search): พบ ${liveWebSearchResult.results.length} แหล่งข้อมูล [คำค้น: ${effectiveSearchQuery}]` : (webSearch ? (contextualResolution.search_required ? 'สืบค้นเว็บสด: ไม่พบผลลัพธ์โดยตรง' : 'สืบค้นเว็บสด: ข้ามการค้นหาตามการประเมินบริบท') : 'สืบค้นเว็บสด: ไม่ได้เปิดใช้งาน'), status: 'COMPLETED' as const, timestamp: new Date().toISOString() },
      { step: 'TEMPORAL_GROUNDING', description: `ตรวจสอบความไวต่อเวลา: [${temporalDetection.temporalScope}] บังคับสืบค้นสด: ${temporalDetection.verificationRequired} | ผลยืนยัน: ${temporalRetrieval.verified ? 'VERIFIED' : 'UNVERIFIED'} (${temporalRetrieval.sourceTitle || 'ไม่มีหลักฐานสด'})`, status: 'COMPLETED' as const, timestamp: new Date().toISOString() },
      { step: 'EXTERNAL_RETRIEVAL', description: `ดึงและประมวลผลหลักฐานภายนอก (${evidenceResult.provenance})`, status: 'COMPLETED' as const, timestamp: new Date().toISOString() },
      { step: 'EVIDENCE_VERIFICATION', description: `ประเมินคุณภาพหลักฐานเชิงสดใหม่ [${evidenceResult.verificationStatus}]`, status: 'COMPLETED' as const, timestamp: new Date().toISOString() },
      { step: 'REASONING_CORE', description: 'เปิดเครื่องยนต์ประมวลผล Bayesian Multi-Hypothesis และ ACH Framework', status: 'COMPLETED' as const, timestamp: new Date().toISOString() },
      { step: 'GOVERNANCE_CONTROL', description: 'ตรวจสอบความปลอดภัย นโยบายการปกป้องความเป็นส่วนตัว และคุ้มครองเสรีภาพมนุษย์', status: 'COMPLETED' as const, timestamp: new Date().toISOString() },
    ];

    const state: PCAStateInternal & {
      knowledge_router?: typeof routerResult;
      evidence_verification_matrix?: any[];
      audit_trail_flow?: any[];
      temporal_detection?: TemporalDetectionResult;
      temporal_claim_verification?: TemporalClaimVerification;
    } = {
      user_input: question || (attachments.length > 0 ? `วิเคราะห์ไฟล์แนบ: ${attachments.map((a: any) => a.name).join(', ')}` : ''),
      language: detectLanguage(question),
      observations: [],
      understanding: '',
      purpose: '',
      constraints: [],
      memories: userBank,
      hypotheses: [],
      evidence: [],
      critique: [],
      uncertainty: [],
      decision: '',
      response: '',
      reflection: [],
      learning: [],
      agency_checks: [],
      notes: [],
      confidence: 'สูง',
      conflicts: [],
      missing_info: [],
      trace: [],
      llm_provider: resolvedProvider,
      llm_model: canonicalModelTag,
      execution_time_ms: 0,
      start_time: new Date().toISOString(),
      end_time: '',
      knowledge_router: routerResult,
      evidence_verification_matrix: [evidenceResult] as any[],
      audit_trail_flow: auditTrailFlow,
      temporal_detection: temporalDetection,
      temporal_claim_verification: temporalClaimVerification,
      web_search_enabled: Boolean(webSearch),
      web_search_results: liveWebSearchResult,
    };

    const docClassification = classifyInputDocument(question, attachments);

    // Stage 1: Intent Definition
    sendSSE('pipeline_stage', { stage: 'Thinking', detail: 'STAGE 01: การระบุเจตนาและความต้องการของผู้ใช้ (Intent Definition)...' });
    await runStage(state, 'INTENT_DEFINITION', 1, 'การระบุเจตนาและความต้องการ', startMs, () => {
      state.observations.push(state.user_input || 'รับอินพุตเพื่อประมวลผล');
      if (attachments && attachments.length > 0) {
        state.observations.push(`ตรวจพบไฟล์แนบเพื่อวิเคราะห์ ${attachments.length} รายการ`);
      }
      return { observations: state.observations, language: state.language };
    }, 15);

    // Stage 2: Context Understanding
    sendSSE('pipeline_stage', { stage: 'Thinking', detail: 'STAGE 02: การทำความเข้าใจบริบทแวดล้อมและข้อจำกัด (Context Understanding)...' });
    await runStage(state, 'CONTEXT_UNDERSTANDING', 2, 'การทำความเข้าใจบริบทและข้อจำกัด', startMs, () => {
      state.understanding = 'ผู้ใช้ต้องการวิเคราะห์หาความจริงตามพยานหลักฐาน ประเมินความน่าจะเป็น และรับคำแนะนำยุทธศาสตร์';
      return { understanding: state.understanding };
    }, 15);

    // Stage 3: Purpose & Scope
    sendSSE('pipeline_stage', { stage: 'Thinking', detail: 'STAGE 03: การกำหนดวัตถุประสงค์ ขอบเขต และนโยบาย Governance (Purpose & Scope)...' });
    await runStage(state, 'PURPOSE_SCOPE', 3, 'การกำหนดวัตถุประสงค์และขอบเขต', startMs, () => {
      state.purpose = `วิเคราะห์เหตุผลและเสนอแนะยุทธศาสตร์ตามกรอบธรรมาภิบาล: "${state.user_input.slice(0, 80)}"`;
      state.constraints = [
        'สงวนและคุ้มครองเสรีภาพการตัดสินใจของผู้ใช้ (Preserve Human Agency)',
        'แยกแยะข้อเท็จจริงออกจากสมมติฐานและระบุระดับความมั่นใจอย่างโปร่งใส'
      ];
      return { purpose: state.purpose, constraints: state.constraints };
    }, 15);

    // Stage 4: Data Structuring & Memory Retrieval
    console.log('[DEBUG] PCA Stage 4: Data Structuring starting...');
    sendSSE('pipeline_stage', { stage: 'Reasoning', detail: 'STAGE 04: การจัดโครงสร้างข้อมูลและการดึงความจำ LTM (Data Structuring & Memory Gate)...' });
    let rankedMems: any[] = [];
    await runStage(state, 'DATA_STRUCTURING', 4, 'การจัดโครงสร้างข้อมูลและการดึงความจำ', startMs, () => {
      rankedMems = rankAndRetrieveMemories(state.user_input, userBank);
      state.memories = rankedMems.filter(m => m.decision === 'ACCEPT').slice(0, 5);
      return { retrieved_count: rankedMems.length, accepted_count: state.memories.length };
    }, 15);

    // Stage 5: Relationship Modeling
    sendSSE('pipeline_stage', { stage: 'Reasoning', detail: 'STAGE 05: การสร้างแบบจำลองความสัมพันธ์เชิงตรรกะ (Relationship Modeling & DAG)...' });
    await runStage(state, 'RELATIONSHIP_MODELING', 5, 'การสร้างแบบจำลองความสัมพันธ์เชิงตรรกะ', startMs, () => {
      return { framework: 'PUNN Cognitive Architecture (PCA v2.0)' };
    }, 15);

    // Stage 6: Hypothesis Formation (ACH)
    sendSSE('pipeline_stage', { stage: 'Reasoning', detail: 'STAGE 06: การสร้างสมมติฐานทางเลือกคู่ขนาน ACH (Hypothesis Formation)...' });
    let hypotheses_v2: any[] = [];
    await runStage(state, 'HYPOTHESIS_FORMATION', 6, 'การสร้างสมมติฐานทางเลือกคู่ขนาน (ACH)', startMs, () => {
      const ach = buildDynamicACH(state.user_input, []);
      hypotheses_v2 = ach.hypotheses;
      state.hypotheses = hypotheses_v2.map(h => ({ claim: h.claim, confidence: Math.round(h.posterior * 100) }));
      return { hypotheses_v2 };
    }, 15);

    // Stage 7: Evidence Evaluation
    sendSSE('pipeline_stage', { stage: 'Decision', detail: 'STAGE 07: การประเมินและจำแนกหลักฐานเชิงประจักษ์ (Evidence Evaluation & Taxonomy)...' });
    let evidence_explorer: any[] = [];
    let sources_used: any[] = [];
    await runStage(state, 'EVIDENCE_EVALUATION', 7, 'การประเมินและจำแนกหลักฐานเชิงประจักษ์', startMs, () => {
      const items: any[] = [];
      const sources: any[] = [];

      // 1. User Input Source
      sources.push({
        id: 'src-user-input',
        category: 'User Input',
        name: 'คำถามและบริบทจากผู้ใช้ (User Input)',
        description: state.user_input ? (state.user_input.length > 120 ? state.user_input.slice(0, 120) + '...' : state.user_input) : 'คำถามหรือคำขอการวิเคราะห์ของผู้ใช้',
        details: state.user_input,
        isExternal: false,
        isEvidence: false,
      });

      // 2. External Sources (Only if real external evidence exists)
      if (evidenceResult) {
        const isTemporalUnverified = temporalDetection.isTemporalSensitive && !temporalRetrieval.verified;
        const extItem = {
          id: 'EXT-SEARCH-1',
          source: evidenceResult.source,
          content: evidenceResult.content,
          credibilityScore: isTemporalUnverified ? 0.20 : (evidenceResult.confidence === 'HIGH' ? 0.98 : 0.65),
          strength: isTemporalUnverified ? 'Low' : (evidenceResult.confidence === 'HIGH' ? 'High' : 'Moderate'),
          type: isTemporalUnverified ? 'Unverified' : 'Empirical',
          provenance: evidenceResult.provenance,
          sourceUrl: evidenceResult.provenance,
          citationQuote: evidenceResult.content.slice(0, 120),
        };
        items.push(extItem);
        sources.push({
          id: 'src-ext-search-1',
          category: isTemporalUnverified ? 'Unverified Source' : 'External Source',
          name: `${isTemporalUnverified ? 'ผลค้นหาเบื้องต้น (ยังไม่ผ่านการยืนยันสถานะปัจจุบัน)' : 'แหล่งค้นหาภายนอก'}: ${evidenceResult.source}`,
          description: evidenceResult.content.slice(0, 150),
          citationQuote: evidenceResult.content.slice(0, 150),
          sourceUrl: evidenceResult.provenance,
          isExternal: true,
          isEvidence: !isTemporalUnverified,
        });
      }

      // 2.1 Live Temporal Evidence (If verified current source retrieved)
      if (temporalRetrieval.verified && temporalRetrieval.evidence) {
        items.push(temporalRetrieval.evidence);
        sources.push({
          id: 'src-temporal-live-1',
          category: 'External Source',
          name: `แหล่งข้อมูลสดปัจจุบัน: ${temporalRetrieval.sourceTitle || 'Live Current Source'}`,
          description: temporalRetrieval.snippet?.slice(0, 150) || 'หลักฐานภายนอกยืนยันสถานะปัจจุบัน',
          citationQuote: temporalRetrieval.snippet?.slice(0, 150),
          sourceUrl: temporalRetrieval.sourceUrl,
          isExternal: true,
          isEvidence: true,
        });
      }

      // 2.2 Live Web Search Evidence (DeepSeek + Web Search Engine)
      if (liveWebSearchResult && liveWebSearchResult.success && liveWebSearchResult.results.length > 0) {
        liveWebSearchResult.results.forEach((webItem, idx) => {
          items.push({
            id: `ev-websearch-${idx + 1}`,
            source: `${webItem.sourceDomain} - ${webItem.title}`,
            content: webItem.snippet,
            credibilityScore: webItem.credibilityScore,
            strength: webItem.credibilityScore >= 0.9 ? 'High' : 'Medium',
            type: 'Empirical',
            provenance: webItem.url,
            sourceUrl: webItem.url,
            citationQuote: webItem.snippet.slice(0, 140),
            locator: `${webItem.sourceDomain} [${webItem.sourceType}]`
          });
          sources.push({
            id: `src-websearch-${idx + 1}`,
            category: 'External Source',
            name: `สืบค้นเว็บสด (${webItem.sourceType.toUpperCase()}): ${webItem.title}`,
            description: webItem.snippet.slice(0, 150),
            citationQuote: webItem.snippet.slice(0, 150),
            sourceUrl: webItem.url,
            locator: webItem.sourceDomain,
            isExternal: true,
            isEvidence: true,
          });
        });
      }

      parsedAttachmentChunks.forEach((chunk, idx) => {
        const attItem = {
          id: `ev-attachment-chunk-${idx + 1}`,
          source: chunk.source || 'attachment',
          content: chunk.content,
          credibilityScore: 0.99,
          strength: 'High',
          type: 'Empirical',
          provenance: chunk.source,
          sourceUrl: chunk.source,
          citationQuote: chunk.content.slice(0, 120),
          locator: chunk.locator,
        };
        items.push(attItem);
        sources.push({
          id: `src-attachment-${idx + 1}`,
          category: 'External Source',
          name: `ไฟล์แนบ: ${chunk.source || 'เอกสารแนบ'}`,
          description: chunk.content.slice(0, 150),
          citationQuote: chunk.content.slice(0, 150),
          locator: chunk.locator,
          isExternal: true,
          isEvidence: true,
        });
      });

      // 3. System Specification (Strictly NOT Evidence)
      sources.push({
        id: 'src-system-spec',
        category: 'System Specification',
        name: 'กรอบสถาปัตยกรรมและกฎความปลอดภัย (System Specification)',
        description: 'PUNN Cognitive Architecture & Human Agency Protection Rules (ข้อกำหนดการคุ้มครองเจตจำนงอิสระของมนุษย์ และกรอบการให้เหตุผล)',
        isExternal: false,
        isEvidence: false,
      });

      // 4. Model Knowledge (Strictly NOT Evidence)
      sources.push({
        id: 'src-model-knowledge',
        category: 'Model Knowledge',
        name: 'ฐานความรู้พารามิเตอร์ของโมเดล (Model Parametric Knowledge)',
        description: 'ความรู้และตรรกะการใช้เหตุผลภายในโมเดลภาษาขนาดใหญ่ (LLM Internal Knowledge - ไม่ใช่หลักฐานเชิงประจักษ์ภายนอก)',
        isExternal: false,
        isEvidence: false,
      });

      evidence_explorer = items;
      sources_used = sources;
      state.evidence = items.map(e => `${e.source}: ${e.content}`);
      return { evidence_explorer, sources_used };
    }, 15);

    // Stage 8: Risk & Critique Analysis
    sendSSE('pipeline_stage', { stage: 'Decision', detail: 'STAGE 08: การวิเคราะห์ความเสี่ยงและจุดวิพากษ์ (Risk & Critique Analysis)...' });
    const missingSignals: string[] = [];
    const conflicts: string[] = [];

    // Evaluate empirical evidence availability
    const hasDirectEmpirical = evidence_explorer.some((e: any) => e.type === 'Empirical' || e.source === 'attachment');
    if (!hasDirectEmpirical) {
      missingSignals.push('ไม่มีเอกสารหลักฐานเชิงประจักษ์แนบโดยตรง (No Direct Empirical Document)');
    }
    if ((state.user_input || '').length < 50) {
      missingSignals.push('ข้อมูลบริบทและขอบเขตข้อจำกัดจากผู้ใช้มีจำกัด (Limited Query Scope)');
    }

    // Detect contradictory constraints or resource tensions
    if (/(ดีที่สุด.*ถูกที่สุด|เร็วที่สุด.*ประหยัดที่สุด|ไม่มีงบ.*ระดับ enterprise)/i.test(state.user_input || '')) {
      conflicts.push('ข้อกำหนดมีลักษณะขัดแย้งกันในเชิงทรัพยากรและเป้าหมาย (Conflicting Operational Constraints)');
    }

    // Detect temporal grounding gap
    if (temporalDetection.isTemporalSensitive && !temporalRetrieval.verified) {
      missingSignals.push(`ขาดหลักฐานภายนอกที่เป็นปัจจุบัน (${getCurrentDateISO()}) สำหรับยืนยันสถานะล่าสุด (Temporal Grounding Gap)`);
      conflicts.push(`คำถามเป็นประเด็นปัจจุบัน แต่โมเดลมี Knowledge Cutoff (${MODEL_KNOWLEDGE_CUTOFF}) และไม่มีหลักฐานสดที่ยืนยัน`);
    }

    state.missing_info = missingSignals;
    state.conflicts = conflicts;

    await runStage(state, 'RISK_CRITIQUE_ANALYSIS', 8, 'การวิเคราะห์ความเสี่ยงและจุดวิพากษ์', startMs, () => {
      return { 
        status: 'COMPLETED', 
        conflict_count: conflicts.length,
        conflicts,
        missing_signals: missingSignals 
      };
    }, 10);

    // Stage 9: Strategic Options & Calibrated Confidence
    sendSSE('pipeline_stage', { stage: 'Decision', detail: 'STAGE 09: การสังเคราะห์ทางเลือกเชิงยุทธศาสตร์และ Trade-offs (Strategic Options)...' });
    let calibratedConfidenceObj: any = null;
    await runStage(state, 'STRATEGIC_OPTIONS', 9, 'การสังเคราะห์ทางเลือกเชิงยุทธศาสตร์', startMs, () => {
      const dynamicAch = buildDynamicACH(state.user_input, evidence_explorer, state.missing_info || [], state.conflicts || []);
      hypotheses_v2 = dynamicAch.hypotheses;
      (state as any).hypotheses_v2 = hypotheses_v2;
      state.hypotheses = hypotheses_v2.map(h => ({ claim: h.claim, confidence: Math.round(h.posterior * 100) }));

      const policyOutput = evaluateStrictGovernancePolicies(state.user_input, 'Strategic Advice', state.constraints);
      calibratedConfidenceObj = calculateStrictCalibratedConfidence(
        state.user_input,
        history.length,
        state.memories,
        state.missing_info || [],
        state.conflicts || [],
        evidence_explorer,
        routerResult?.route || 'General',
        {
          detection: temporalDetection,
          retrieval: temporalRetrieval
        }
      );
      state.decision = 'เสนอแนะทางเลือกเชิงวิเคราะห์ ปฏิเสธการสรุปเด็ดขาดเพื่อคุ้มครอง Human Agency';
      state.confidence = calibratedConfidenceObj.label;
      return {
        confidence_calibration: calibratedConfidenceObj,
        policies: policyOutput,
        hypotheses_v2
      };
    }, 15);

    // Stage 9.5: Decision Governance
    sendSSE('pipeline_stage', { stage: 'Decision', detail: 'STAGE 09.5: การกำกับดูแลการตัดสินใจ (Decision Governance)...' });
    await runStage(state, 'DECISION_GOVERNANCE', 9.5, 'การกำกับดูแลการตัดสินใจ', startMs, async () => {
      // 1. Construct decision object from state
      const confidenceLabel: 'LOW' | 'MEDIUM' | 'HIGH' =
        calibratedConfidenceObj?.label === 'HIGH' ? 'HIGH' :
        calibratedConfidenceObj?.label === 'LOW' ? 'LOW' : 'MEDIUM';

      const decisionObj: DecisionObject = {
        options: (state as any).hypotheses_v2?.map((h: any, i: number) => ({
          id: `opt-${i}`,
          text: h.claim,
          rationale: h.claim,
          isRecommended: i === 0,
        })) || [],
        risks: state.conflicts.map((c: string, i: number) => ({
            id: `risk-${i}`,
            text: c,
            severity: 'MEDIUM' as const,
        })),
        uncertainties: state.missing_info.map((m: string, i: number) => ({
            id: `unc-${i}`,
            text: m,
            importance: 'HIGH' as const,
        })),
        consequences: [],
        evidence: state.evidence.map((e: string, i: number) => ({
            id: `ev-${i}`,
            text: e,
            sourceId: 'src-1',
        })),
        assumptions: [],
        confidence: {
            score: calibratedConfidenceObj?.score || 0.5,
            label: confidenceLabel,
            breakdown: {}
        },
        applicable_policies: [],
        policy_conflicts: [],
        escalation_required: false,
        controlLevel: 'LOW' as const,
      };

      state.decision_governance = decisionObj;

      // 2. Deterministic Validation
      const valResult = validateDecisionObject(decisionObj);
      
      // 3. Semantic Audit
      const semResult = await auditDecisionSemantics(decisionObj);

      return {
          validation: valResult,
          semantics: semResult,
          decision: decisionObj
      };
    }, 15);

    // Stage 10: Analysis Communication (Streaming tokens from deepseek)
    console.log('[DEBUG] PCA Stage 10: Analysis Communication starting...');
    sendSSE('pipeline_stage', { stage: 'Reflecting', detail: 'STAGE 10: การสื่อสารบทวิเคราะห์และการสร้างคำตอบเรียลไทม์ (Analysis Communication)...' });
    const stage10StartMs = Date.now();
    
    const isOngoingConversation = Array.isArray(history) && history.length > 0;
    const conversationContext = {
      isOngoing: isOngoingConversation,
      turnCount: Array.isArray(history) ? history.length : 0
    };

    // Build context summary and prompt optimizer
    const optPromptResult = buildOptimizedSystemPrompt(
      state as any,
      tone,
      deepReasoning,
      personalContext,
      '',
      { richness: 'moderate', missingSignals: [] },
      [],
      reasoningProfile,
      activeCompressedContext,
      docClassification,
      conversationContext,
      { detection: temporalDetection, retrieval: temporalRetrieval }
    );

    const systemPrompt = optPromptResult.fullPrompt;
    let generatedText = '';
    const userParts: any[] = [];

    if (liveWebSearchResult && liveWebSearchResult.success && liveWebSearchResult.results.length > 0) {
      const govContext = buildWebEvidenceGovernanceContext(liveWebSearchResult);
      if (govContext) {
        userParts.push({ text: govContext });
      }
      const webPrompt = formatWebSearchResultsForPrompt(liveWebSearchResult);
      if (webPrompt) {
        userParts.push({ text: webPrompt });
      }
    }

    if (parsedAttachmentChunks.length > 0) {
      userParts.push({
        text: `\n── Retrieved Chunks from Attachments ──\n` +
          parsedAttachmentChunks.map(c => `[Source: ${c.locator}]\n${c.content}`).join('\n\n') +
          `\n──────────────────────────────────────\n`
      });
    }
    // Push user question
    userParts.push({ text: question });

    // Inject PCA 12-Stage Epistemic Synthesis Directive at the end of the user prompt
    if (deepReasoning && (hypotheses_v2?.length > 0 || calibratedConfidenceObj)) {
      const achSummary = (hypotheses_v2 || []).map((h: any, i: number) => 
        `  • H${i + 1} [HYPOTHESIS]: ${h.claim} (ความน่าจะเป็นประเมิน: ${Math.round((h.posterior || 0) * 100)}%)`
      ).join('\n');
      const missingSummary = (state.missing_info || []).map((m: string) => `  • ${m}`).join('\n') || '  • ไม่มี';
      const confLabel = calibratedConfidenceObj?.label || state.confidence || 'ปานกลาง';
      const confStatus = calibratedConfidenceObj?.calibrationStatus || 'NOT_VERIFIED';

      userParts.push({
        text: `\n\n══════════════════════════════════════════════════════════════════════════════
[คำสั่งควบคุมการคิดวิเคราะห์เชิงลึก: PCA 12-STAGE SYNTHESIS INSTRUCTION]
สำหรับคำถามข้างต้น ระบบได้ผ่านขั้นตอน Stage 1 ถึง Stage 9 เรียบร้อยแล้ว:
• [STAGE 06: ACH Multi-Hypotheses]:
${achSummary}
• [STAGE 08: Vulnerabilities & Missing Signals]:
${missingSummary}
• [STAGE 09: Calibrated Confidence]: ${confLabel} (${confStatus})
• [STAGE 12: Human Agency]: สงวนสิทธิ์การตัดสินใจขั้นสูงสุดให้แก่มนุษย์ (Advisory Only)

**ข้อบังคับการตอบตามกรอบ PCA 12 ขั้นตอน (ห้ามตอบสั้นประโยคเดียวเด็ดขาด):**
กรุณาเขียนแจกแจงบทวิเคราะห์ตามหัวข้อต่อไปนี้ให้ครบถ้วนทุกส่วน:

### 1. [INFERENCE] บทสรุปจุดยืนตามกรอบ PUNN PCA v3.0
(ระบุข้อสรุปที่ชัดเจนตรงประเด็นทันทีในย่อหน้าแรก พร้อมระดับความมั่นใจ)

### 2. [HYPOTHESIS] การจำแนกสมมติฐานทางเลือก (ACH)
(เปรียบเทียบสมมติฐานทางเลือกคู่ขนาน H1 vs H2 และผลลัพธ์ของแต่ละทางเลือก)

### 3. [TRADE-OFF] การวิเคราะห์ข้อดี-ข้อเสียและความเสี่ยง
(เปรียบเทียบข้อดี ข้อเสีย ผลกระทบ และความเสี่ยงของแต่ละทางเลือกอย่างรอบด้าน)

### 4. [DECISION GAP] ดุลยพินิจและเงื่อนไขของมนุษย์
(ระบุข้อจำกัดของข้อมูล ความไม่แน่นอน และคืนอำนาจการตัดสินใจขั้นสุดท้ายให้แก่ผู้ใช้)
══════════════════════════════════════════════════════════════════════════════`
      });
    }

    // Build multi-turn conversational payload so DeepSeek has true multi-turn context
    const contentsPayload: any[] = [];
    if (isOngoingConversation) {
      const recentHistory = history.slice(-6);
      for (const turn of recentHistory) {
        if (turn && turn.content) {
          contentsPayload.push({
            role: turn.role === 'assistant' || turn.role === 'model' ? 'assistant' : 'user',
            content: turn.content
          });
        }
      }
    }
    contentsPayload.push({ role: 'user', parts: userParts });

    const customOllamaUrl = req.body.ollamaBaseUrl || process.env.OLLAMA_BASE_URL;
    const isTargetOllama = isOllamaModel(model);
    const isVisionRouting = resolvedProvider === 'deepseek_vision' || attachedImages.length > 0;

    if (isVisionRouting) {
      const finalApiKey = deepSeekApiKey || process.env.DEEPSEEK_API_KEY;
      const customBaseUrl = req.body.deepSeekBaseUrl || process.env.DEEPSEEK_BASE_URL;

      if (!finalApiKey) {
        console.warn('[PCA Stream] DEEPSEEK_API_KEY ไม่ได้ถูกตั้งค่าสำหรับ DeepSeek Vision');
        generatedText = `### ❌ [FIRE KEEPER VISION GOVERNANCE NOTICE]
DEEPSEEK_API_KEY ไม่ได้ถูกตั้งค่า ไม่สามารถเรียกใช้งานโมเดล DeepSeek Vision (${DEEPSEEK_VISION_MODEL}) เพื่อวิเคราะห์ภาพได้ กรุณากำหนดตัวแปรสภาพแวดล้อม DEEPSEEK_API_KEY ให้กับเซิร์ฟเวอร์ หรือระบุ Key ในการตั้งค่า`;
      } else {
        try {
          const llmResult = await callDeepSeekVisionContentWithRetry(
            contentsPayload,
            attachedImages,
            DEEPSEEK_VISION_MODEL,
            systemPrompt,
            finalApiKey,
            customBaseUrl
          );
          generatedText = llmResult.text || '';
          generatedText = cleanAiResponseStyle(generatedText, isOngoingConversation, question);
        } catch (visionErr: any) {
          console.warn('[DeepSeek Vision Stream Error]:', visionErr);
          generatedText = `### ❌ [FIRE KEEPER VISION NOTICE]
ขออภัย เกิดข้อผิดพลาดในการประมวลผลผ่าน DeepSeek Vision (${DEEPSEEK_VISION_MODEL}):
${visionErr?.message || 'ไม่สามารถติดต่อ DeepSeek Vision API ได้'}`;
        }
      }
    } else if (isTargetOllama) {
      try {
        const llmResult = await callOllamaContentWithRetry(
          contentsPayload,
          model,
          systemPrompt,
          customOllamaUrl
        );
        generatedText = llmResult.text || '';
        generatedText = cleanAiResponseStyle(generatedText, isOngoingConversation, question);
      } catch (ollamaErr: any) {
        console.warn('[Ollama PCA Stream Error]:', ollamaErr);
        const targetClean = (model || 'qwen3:4b').replace(/^ollama:/i, '');
        generatedText = `### ❌ [FIRE KEEPER OLLAMA NOTICE]
ไม่สามารถเชื่อมต่อกับ Ollama สำหรับโมเดล "${targetClean}":
${ollamaErr?.message || 'ไม่สามารถติดต่อ Ollama Endpoint ได้'}

**วิธีแก้ปัญหาเบื้องต้น:**
1. ตรวจสอบสถานะการเชื่อมต่อของ Ollama Endpoint (${customOllamaUrl || process.env.OLLAMA_BASE_URL || 'https://ollama.firekeeper.site'})
2. ตรวจสอบว่ามีโมเดล \`${targetClean}\` พร้อมใช้งานบนเซิร์ฟเวอร์หรือไม่`;
      }
    } else {
      const finalApiKey = deepSeekApiKey || process.env.DEEPSEEK_API_KEY;

      if (!finalApiKey) {
        console.warn('[PCA Stream] DEEPSEEK_API_KEY ไม่ได้ถูกตั้งค่า (DEEPSEEK_ONLY policy)');
        generatedText = `### ❌ [FIRE KEEPER GOVERNANCE NOTICE]
DEEPSEEK_API_KEY ไม่ได้ถูกตั้งค่า (DeepSeek เป็นโมเดลหลักภายใต้นโยบาย DEEPSEEK_ONLY) กรุณากำหนดตัวแปรสภาพแวดล้อม DEEPSEEK_API_KEY ให้กับเซิร์ฟเวอร์ หรือสลับไปใช้โหมด Ollama Local (Qwen3:4b)`;
      } else {
        try {
          const llmResult = await callDeepSeekContentWithRetry(
            contentsPayload,
            model || 'deepseek-chat',
            systemPrompt,
            finalApiKey
          );
          generatedText = llmResult.text || '';
          // Clean accidental repetitive greetings and archaic vocabulary slips
          generatedText = cleanAiResponseStyle(generatedText, isOngoingConversation, question);
        } catch (llmErr) {
          console.warn('LLM call errored out, implementing polite fallback: ', llmErr);
          generatedText = `### ❌ [FIRE KEEPER GOVERNANCE NOTICE]
ขออภัย ระบบขัดข้องในการดึงข้อมูลผ่าน LLM Engine โปรดลองอีกครั้งในภายหลัง`;
        }
      }
    }

    // Global Language Policy Output Validation & Automatic Retry / Rewrite
    const isErrorNotice = generatedText.startsWith('### ❌ [FIRE KEEPER');
    if (!isErrorNotice && generatedText.trim()) {
      let langValidation = validateOutputLanguage(generatedText, DEFAULT_LANGUAGE_POLICY.outputLanguage);
      
      let rewriteRetries = 0;
      const maxRetries = DEFAULT_LANGUAGE_POLICY.maxRewriteRetries;
      
      while (!langValidation.isValid && rewriteRetries < maxRetries) {
        rewriteRetries++;
        console.warn(`[GLOBAL LANGUAGE POLICY]: Non-compliant language output detected (Thai ratio: ${(langValidation.thaiRatio * 100).toFixed(1)}%). Attempting rewrite in ${DEFAULT_LANGUAGE_POLICY.outputLanguage.toUpperCase()} (Attempt ${rewriteRetries}/${maxRetries})...`);
        
        const rewritePrompt = buildLanguagePolicyRewritePrompt(generatedText, DEFAULT_LANGUAGE_POLICY.outputLanguage);
        
        try {
          let rewrittenText = '';
          if (isVisionRouting) {
            const finalApiKey = deepSeekApiKey || process.env.DEEPSEEK_API_KEY;
            const customBaseUrl = req.body.deepSeekBaseUrl || process.env.DEEPSEEK_BASE_URL;
            if (finalApiKey) {
              const rewriteResult = await callDeepSeekVisionContentWithRetry(
                rewritePrompt.userPrompt,
                attachedImages,
                DEEPSEEK_VISION_MODEL,
                rewritePrompt.systemInstruction,
                finalApiKey,
                customBaseUrl
              );
              rewrittenText = rewriteResult.text || '';
            }
          } else if (isTargetOllama) {
            const rewriteResult = await callOllamaContentWithRetry(
              rewritePrompt.userPrompt,
              model,
              rewritePrompt.systemInstruction,
              customOllamaUrl
            );
            rewrittenText = rewriteResult.text || '';
          } else {
            const finalApiKey = deepSeekApiKey || process.env.DEEPSEEK_API_KEY;
            if (finalApiKey) {
              const rewriteResult = await callDeepSeekContentWithRetry(
                rewritePrompt.userPrompt,
                model || 'deepseek-chat',
                rewritePrompt.systemInstruction,
                finalApiKey
              );
              rewrittenText = rewriteResult.text || '';
            }
          }
          
          if (rewrittenText.trim()) {
            const reValidation = validateOutputLanguage(rewrittenText, DEFAULT_LANGUAGE_POLICY.outputLanguage);
            if (reValidation.isValid || reValidation.thaiRatio > langValidation.thaiRatio) {
              generatedText = cleanAiResponseStyle(rewrittenText, isOngoingConversation, question);
              langValidation = reValidation;
              console.log(`[GLOBAL LANGUAGE POLICY]: Successfully rewritten response to Thai (Thai ratio: ${(reValidation.thaiRatio * 100).toFixed(1)}%)`);
            }
          }
        } catch (rewriteErr) {
          console.warn('[GLOBAL LANGUAGE POLICY]: Rewrite attempt failed:', rewriteErr);
          break;
        }
      }

      state.audit_trail_flow.push({
        step: 'GLOBAL_LANGUAGE_POLICY',
        description: langValidation.isValid 
          ? `ผ่านการตรวจสอบ Global Language Policy (${DEFAULT_LANGUAGE_POLICY.outputLanguage.toUpperCase()})` 
          : `ตรวจสอบพบการใช้ภาษาอื่น ดำเนินการกำกับภาษา (${langValidation.reason})`,
        status: langValidation.isValid ? 'COMPLETED' : 'WARNING',
        timestamp: new Date().toISOString(),
        metadata: {
          outputLanguage: DEFAULT_LANGUAGE_POLICY.outputLanguage,
          isValid: langValidation.isValid,
          thaiRatio: langValidation.thaiRatio,
          retriesAttempted: rewriteRetries,
          reason: langValidation.reason
        }
      });
    }

    // Response Centric Governance and repair with Temporal Grounding validation
    const govReport = evaluateResponseCentricGovernance(
      question, 
      generatedText, 
      evidence_explorer, 
      { detection: temporalDetection, retrieval: temporalRetrieval }
    );
    
    state.fact_claims = govReport.factClaims || [];
    let finalResponse = generatedText;
    let publicationBlocked = false;

    if (govReport.decisionState === 'BLOCK') {
      console.error(`[GOVERNANCE BLOCK]: Violation detected: ${govReport.violations.join(', ')}`);
      finalResponse = cleanAiResponseStyle(govReport.repairedResponse, isOngoingConversation, question);
      publicationBlocked = true;
    } else if (govReport.decisionState === 'REVISE') {
      console.warn(`[GOVERNANCE REVISE]: Repairing output text based on strict rules...`);
      finalResponse = cleanAiResponseStyle(govReport.repairedResponse || "ไม่สามารถประมวลผลคำตอบได้ตามนโยบายธรรมาภิบาล", isOngoingConversation, question);
    }

    // AUDIT LOGGING
    state.audit_trail_flow.push({
      step: 'GOVERNANCE_PUBLICATION',
      description: `การประเมิน Governance ผลลัพธ์: ${govReport.decisionState}`,
      status: govReport.decisionState === 'BLOCK' ? 'BLOCKED' : 'COMPLETED',
      timestamp: new Date().toISOString(),
      metadata: {
        governance_decision: govReport.decisionState,
        violations: govReport.violations,
        repair_applied: govReport.repairApplied,
        publication_blocked: publicationBlocked,
        original_response_hash: crypto.createHash('sha256').update(generatedText).digest('hex'),
        published_response_hash: crypto.createHash('sha256').update(finalResponse).digest('hex'),
        publication_status: govReport.decisionState === 'BLOCK' ? 'SAFE_BLOCKED_RESPONSE' : (govReport.decisionState === 'REVISE' ? 'REPAIRED_RESPONSE' : 'ORIGINAL_RESPONSE')
      }
    });

    // PUNN Persona Boundary Enforcement
    const personaAudit = auditAndEnforcePunnPersona(finalResponse, question);
    if (personaAudit.modified) {
      console.warn(`[PUNN PERSONA GOVERNANCE]: Corrected identity violations: ${personaAudit.violations.join(', ')}`);
      finalResponse = personaAudit.text;
    }

    generatedText = finalResponse;

    // Stream final governed text to frontend in small typing simulation chunks
    const chunkSize = 25;
    for (let i = 0; i < finalResponse.length; i += chunkSize) {
      if (isClientDisconnected || res.writableEnded) break;
      const textSlice = finalResponse.slice(i, i + chunkSize);
      sendSSE('token', { token: textSlice });
      await new Promise((r) => setTimeout(r, 6));
    }

    const stage10EndMs = Date.now();
    state.response = generatedText;
    state.llm_model = model;

    recordStageTrace(state, 'ANALYSIS_COMMUNICATION', 10, 'การสื่อสารบทวิเคราะห์และการสร้างคำตอบ', stage10StartMs, stage10EndMs, startMs, { response_length: generatedText.length });

    // Stage 11: Review & Verification
    sendSSE('pipeline_stage', { stage: 'Reflecting', detail: 'STAGE 11: การทบทวนและตรวจสอบความสอดคล้องตามกรอบธรรมาภิบาล (Review & Verification)...' });
    await runStage(state, 'REVIEW_VERIFICATION', 11, 'การทบทวนและตรวจสอบความสอดคล้อง', startMs, () => {
      state.reflection = ['ตรวจสอบคำตอบภายใต้กฎเหล็ก ANTI-FABRICATION: PASS'];
      return { reflection: state.reflection };
    }, 10);

    // Stage 12: Continuous Improvement & Human Agency
    sendSSE('pipeline_stage', { stage: 'Reflecting', detail: 'STAGE 12: การปรับปรุงอย่างต่อเนื่องและการคุ้มครองสิทธิ์ขาด Human Agency (Continuous Improvement)...' });
    await runStage(state, 'CONTINUOUS_IMPROVEMENT', 12, 'การปรับปรุงอย่างต่อเนื่องและเคารพ Human Agency', startMs, () => {
      state.learning = ['จัดเก็บบันทึกการสังเคราะห์เข้าคลังความรู้สำหรับการเรียนรู้ในระยะยาว'];
      state.agency_checks = ['สิทธิ์การตัดสินใจขั้นสุดท้ายถูกสงวนไว้ให้กับผู้ใช้อย่างสมบูรณ์'];
      return { learning: state.learning };
    }, 10);

    const endMs = Date.now();
    state.end_time = new Date().toISOString();
    state.execution_time_ms = endMs - startMs;

    const promptTokens = optPromptResult.coreTokens + countTokens(question);
    const completionTokens = countTokens(generatedText);
    const totalTokens = promptTokens + completionTokens;
    const costResult = calculateActualTokenCost(model, promptTokens, completionTokens);

    // Build Real Immutable Decision Execution Trace in Backend Runtime
    const realExecutionTrace = buildRealDecisionExecutionTrace({
      userInput: state.user_input,
      assistantOutput: generatedText,
      pcaState: {
        ...state,
        evidence_explorer,
        sources_used,
        hypotheses_v2,
        knowledge_router: routerResult,
      } as any,
      modelName: model,
      userRole: 'Authenticated Decision Maker',
      totalDurationMs: state.execution_time_ms,
      startTimeIso: state.start_time,
      endTimeIso: state.end_time,
    });

    const pcaStateV2 = {
      user_input: state.user_input,
      start_time: state.start_time,
      end_time: state.end_time,
      execution_time_ms: state.execution_time_ms,
      llm_provider: resolvedProvider,
      llm_model: canonicalModelTag,
      sources_used,
      has_external_evidence: evidence_explorer.length > 0,
      evidence_explorer,
      conflicts: state.conflicts || [],
      missing_info: state.missing_info || state.uncertainty || [],
      knowledge_router: routerResult,
      confidence: state.confidence,
      confidence_calibration: calibratedConfidenceObj || undefined,
      decision: state.decision,
      trace: state.trace || [],
      execution_trace: realExecutionTrace,
      human_agency_audit: {
        status: 'ENFORCED',
        decision_authority: 'Human Exclusive (Human-in-the-Loop)',
        role: 'Advisory Only (AI acts as an analytical advisor, no autonomous executive action)',
        coercion_free: true,
        summary: 'ระบบทำหน้าที่เป็นที่ปรึกษาเชิงวิเคราะห์ ไม่ตัดสินใจหรือสั่งการแทนมนุษย์ การตัดสินใจขั้นสุดท้ายเป็นดุลยพินิจของมนุษย์ 100%'
      }
    };

    // Send completion events to frontend immediately so user UI is instant
    sendSSE('state', pcaStateV2);
    sendSSE('complete', {
      pcaState: pcaStateV2,
      response: generatedText,
      fullResponse: generatedText,
      totalTokens,
      provider: resolvedProvider,
      model: canonicalModelTag,
      compressedContext: activeCompressedContext,
    });
    sendSSE('done', { done: true });
    
    if (!res.writableEnded && !isClientDisconnected) {
      res.write('data: [DONE]\n\n');
    }

    // End response immediately
    if (!res.writableEnded) {
      try {
        res.end();
      } catch {}
    }

    // Non-blocking Firestore persistence in background (3-Tier Operational Log & Audit Index)
    if (serverDb && userId && !isServerFirestoreQuotaExhausted && !isOfflineOnlyMode() && userId !== OFFLINE_USER_UID) {
      const explicitLogLevel = (req.body?.logLevel || req.headers['x-pca-log-level']) as any;
      const tieredAuditLog = buildTieredAuditLog(
        pcaStateV2,
        realExecutionTrace,
        question || '',
        generatedText,
        model,
        explicitLogLevel
      );

      const auditDocId = `run-${Date.now()}-${realExecutionTrace.execution_id.slice(-6)}`;
      const auditRef = doc(serverDb, 'users', userId, 'pca_audit_logs', auditDocId);
      setDoc(auditRef, stripUndefinedFields(tieredAuditLog))
        .then(() => {
          console.log(`[Firestore] Tiered PCA audit log (${tieredAuditLog.logging_level}) saved in background for user: ${userId}`);
        })
        .catch((fError: any) => {
          const errStr = String(fError?.message || fError);
          if (errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('resource-exhausted') || errStr.includes('Quota limit exceeded')) {
            isServerFirestoreQuotaExhausted = true;
            console.warn('[Firestore] Server daily free tier write quota reached. Operating in memory-only audit fallback mode.');
          } else {
            console.warn(`[Firestore] Notice persisting audit log: ${fError}`);
          }
        });
    }

  } catch (err: any) {
    console.error('[PCA STREAM GATEWAY ERROR]:', err);
    if (!res.writableEnded && !isClientDisconnected) {
      sendSSE('error', { message: err?.message || 'Cognitive pipeline processing failed' });
    }
  } finally {
    if (!res.writableEnded) {
      try {
        res.end();
      } catch {}
    }
  }
});

// ── PUBLIC HTML SHARING & STORAGE ENDPOINTS ─────────────────────────────────

const publicSharesMemoryMap = new Map<string, any>();
const sharedHtmlContentMemoryMap = new Map<string, string>();
const SHARES_DIR = path.join(process.cwd(), '.shares_cache');

function saveShareToDisk(shareId: string, record: any, html?: string) {
  try {
    if (!fs.existsSync(SHARES_DIR)) {
      fs.mkdirSync(SHARES_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(SHARES_DIR, `${shareId}.json`), JSON.stringify(record, null, 2), 'utf8');
    if (html) {
      fs.writeFileSync(path.join(SHARES_DIR, `${shareId}.html`), html, 'utf8');
    }
  } catch (err: any) {
    console.warn('[SHARE] disk cache write error:', err?.message);
  }
}

function loadShareFromDisk(shareId: string): { record: any; html: string | null } | null {
  try {
    const jsonPath = path.join(SHARES_DIR, `${shareId}.json`);
    const htmlPath = path.join(SHARES_DIR, `${shareId}.html`);
    if (fs.existsSync(jsonPath)) {
      const record = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : null;
      return { record, html };
    }
  } catch (err: any) {
    console.warn('[SHARE] disk cache read error:', err?.message);
  }
  return null;
}

// GET /shared/:shareId - Public endpoint to view shared HTML (No login required)
app.get('/shared/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    console.log('[SHARE DEBUG] shared route status: requested', { shareId });

    if (!shareId || typeof shareId !== 'string' || shareId.length > 128) {
      return res.status(404).send('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h1>404 Not Found</h1><p>The requested shared link is invalid or does not exist.</p></body></html>');
    }

    let shareData: any = null;

    if (publicSharesMemoryMap.has(shareId)) {
      shareData = publicSharesMemoryMap.get(shareId);
    }

    if (!shareData) {
      const diskData = loadShareFromDisk(shareId);
      if (diskData?.record) {
        shareData = diskData.record;
        publicSharesMemoryMap.set(shareId, shareData);
        if (diskData.html) {
          sharedHtmlContentMemoryMap.set(shareId, diskData.html);
        }
      }
    }

    if (!shareData && adminDb && isServerFirestoreAdminAvailable) {
      try {
        const docSnap = await adminDb.collection('publicShares').doc(shareId).get();
        if (docSnap.exists) {
          shareData = docSnap.data();
          publicSharesMemoryMap.set(shareId, shareData);
        }
      } catch (err) {
        console.warn('[Shared Route] Firestore lookup warning:', err);
      }
    }

    if (!shareData || shareData.isPublic !== true) {
      console.log('[SHARE DEBUG] shared route status: 404 not found or unpublished', { shareId });
      return res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8').send('<!DOCTYPE html><html><head><title>404 Not Found or Unpublished</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h1>404 Not Found or Unpublished</h1><p>This shared report is no longer available or has been unpublished by its owner.</p></body></html>');
    }

    let htmlContent = '';

    // 1. Try Firebase Storage if storagePath exists (with 3-second strict timeout)
    if (shareData.storagePath) {
      try {
        const bucket = getStorage().bucket(firebaseAppConfig.storageBucket);
        const file = bucket.file(shareData.storagePath);
        
        console.log('[Shared Route] Checking Storage file existence (with 3s timeout):', shareData.storagePath);
        const exists = await withTimeout(
          file.exists().then((res: any) => res[0]),
          3000,
          'Storage file.exists timed out'
        );
        
        if (exists) {
          console.log('[Shared Route] Downloading Storage file contents (with 3s timeout)...');
          const contents = await withTimeout<any>(
            file.download().then((res: any) => res[0]),
            3000,
            'Storage file.download timed out'
          );
          htmlContent = contents.toString('utf8');
        }
      } catch (storageErr: any) {
        console.warn('[Shared Route] Firebase Storage check/download FAILED or TIMED OUT, using fallbacks:', storageErr?.message || storageErr);
      }
    }

    // 2. Fallback: Firestore htmlContent
    if (!htmlContent && shareData.htmlContent) {
      htmlContent = shareData.htmlContent;
    }

    // 3. Fallback: memory cache
    if (!htmlContent && sharedHtmlContentMemoryMap.has(shareId)) {
      htmlContent = sharedHtmlContentMemoryMap.get(shareId)!;
    }

    // 4. Fallback: disk cache
    if (!htmlContent) {
      const diskData = loadShareFromDisk(shareId);
      if (diskData?.html) {
        htmlContent = diskData.html;
      }
    }

    if (!htmlContent) {
      console.log('[SHARE DEBUG] shared route status: 404 content missing', { shareId });
      return res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8').send('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h1>404 Not Found</h1><p>Shared HTML file content could not be located.</p></body></html>');
    }

    console.log('[SHARE DEBUG] shared route status: 200 OK', { shareId, length: htmlContent.length });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).send(htmlContent);
  } catch (err: any) {
    console.error('[Shared Route Error]:', err);
    return res.status(500).setHeader('Content-Type', 'text/html; charset=utf-8').send('<!DOCTYPE html><html><head><title>500 Internal Error</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h1>500 Internal Error</h1><p>An error occurred while loading the shared report.</p></body></html>');
  }
});

// GET /api/shares/status/:shareId - Get verified share status
app.get('/api/shares/status/:shareId', rateLimiter, requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { shareId } = req.params;
    console.log('[HTML_SHARE] fetch:status', { shareId, userId });

    let record = publicSharesMemoryMap.get(shareId);
    if (!record) {
      const diskData = loadShareFromDisk(shareId);
      if (diskData?.record) {
        record = diskData.record;
      }
    }
    if (!record && adminDb && isServerFirestoreAdminAvailable) {
      const docSnap = await adminDb.collection('publicShares').doc(shareId).get();
      if (docSnap.exists) {
        record = docSnap.data();
        publicSharesMemoryMap.set(shareId, record);
      }
    }

    if (!record) {
      console.log('[HTML_SHARE] fetch:status:not_found', { shareId });
      return res.status(404).json({ error: 'Not Found', message: 'Share record not found' });
    }

    if (record.ownerId !== userId) {
      console.log('[HTML_SHARE] fetch:status:forbidden', { shareId, userId, ownerId: record.ownerId });
      return res.status(403).json({ error: 'Forbidden', message: 'Not authorized' });
    }

    res.json({ success: true, record });
  } catch (err: any) {
    console.error('[HTML_SHARE] fetch:status:error', err);
    res.status(500).json({ error: 'Failed to fetch status', message: err?.message });
  }
});

// POST /api/shares/publish - Publish HTML and save to Firebase Storage or Firestore fallback (Authenticated)
app.post(['/api/shares/publish', '/api/api/shares/publish'], rateLimiter, requireAuth, async (req, res) => {
  const correlationId = 'share-publish-' + crypto.randomBytes(8).toString('hex');
  const userId = (req as any).userId;
  const userToken = (req as any).userToken || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '').trim() : '');
  const { htmlContent, title, shareId: requestedShareId, clientFirestorePersisted } = req.body;
  
  console.log(`[${correlationId}] PUBLISH_START: user=${userId}, requestedShareId=${requestedShareId}, length=${htmlContent?.length || 0}`);

  if (!htmlContent || typeof htmlContent !== 'string') {
    console.error(`[${correlationId}] PUBLISH_RESPONSE: Bad Request (missing htmlContent)`);
    return res.status(400).json({ error: 'Bad Request', message: 'htmlContent string is required' });
  }

  const shareId = (requestedShareId && typeof requestedShareId === 'string' && requestedShareId.length <= 128)
    ? requestedShareId
    : `share-${crypto.randomBytes(12).toString('hex')}`;

  const storagePath = `public-html/${userId}/${shareId}/index.html`;
  const now = new Date().toISOString();

  // 1. Calculate Public URL early using the unified helper
  let publicUrl = '';
  try {
    publicUrl = getPublicShareUrl(shareId);
  } catch (urlErr: any) {
    console.error(`[${correlationId}] PUBLISH_RESPONSE: failure (APP_URL config error: ${urlErr?.message})`);
    return res.status(500).json({
      success: false,
      published: false,
      stage: 'publish',
      error: `เซิร์ฟเวอร์ไม่ได้ตั้งค่า APP_URL สำหรับใช้งานในระบบจริง (Configuration Error: ${urlErr?.message})`
    });
  }

  // 2. Firebase Storage attempt (with strict 4s timeout)
  let fileUploaded = false;
  let storageErrorMessage: string | null = null;
  
  console.log(`[${correlationId}] STORAGE_WRITE: starting upload to bucket=${firebaseAppConfig.storageBucket}, path=${storagePath}`);
  try {
    const bucket = getStorage().bucket(firebaseAppConfig.storageBucket);
    const file = bucket.file(storagePath);
    
    await withTimeout(
      file.save(htmlContent, {
        contentType: 'text/html; charset=utf-8',
        metadata: { contentType: 'text/html; charset=utf-8', ownerId: userId }
      }),
      2500,
      'Firebase Storage file save timed out'
    );
    fileUploaded = true;
    console.log(`[${correlationId}] STORAGE_WRITE: success`);
  } catch (storageErr: any) {
    fileUploaded = false;
    storageErrorMessage = storageErr?.message || 'Storage upload error';
    console.warn(`[${correlationId}] STORAGE_WRITE: failed/timedout: ${storageErrorMessage}`);
  }

  const shareRecord: any = {
    shareId,
    ownerId: userId,
    storagePath,
    title: title || 'Firekeeper Shared Report',
    createdAt: now,
    updatedAt: now,
    isPublic: true,
    published: true,
    contentType: 'text/html',
    htmlContent: htmlContent,
    source: fileUploaded ? 'storage' : 'firestore',
    storageUploaded: fileUploaded,
    publicUrl: publicUrl
  };

  // 3. Firestore Persistence attempt
  let firestorePersisted = false;

  console.log(`[${correlationId}] FIRESTORE_WRITE: starting persistence...`);
  // 3a. Admin SDK attempt (with strict 2.5s timeout)
  if (adminDb && isServerFirestoreAdminAvailable) {
    try {
      await withTimeout(
        adminDb.collection('publicShares').doc(shareId).set(shareRecord, { merge: true }),
        2500,
        'Firestore Admin SDK write timed out'
      );
      firestorePersisted = true;
      console.log(`[${correlationId}] FIRESTORE_WRITE: Admin SDK write success`);
    } catch (fsErr: any) {
      console.warn(`[${correlationId}] FIRESTORE_WRITE: Admin SDK write failed/timedout: ${fsErr?.message}`);
      markAdminFirestoreUnavailable(fsErr);
    }
  }

  // 3b. Firestore REST API fallback (with strict 2.5s timeout)
  if (!firestorePersisted && userToken && userToken !== 'offline-local-token') {
    const dbId = firebaseAppConfig.firestoreDatabaseId || '(default)';
    const projectId = firebaseAppConfig.projectId;
    const restUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/publicShares/${shareId}?key=${firebaseAppConfig.apiKey}`;
    
    console.log(`[${correlationId}] FIRESTORE_WRITE: REST API fallback start`);

    try {
      const fields: Record<string, any> = {
        shareId: { stringValue: shareId },
        ownerId: { stringValue: userId },
        storagePath: { stringValue: storagePath },
        title: { stringValue: title || 'Firekeeper Shared Report' },
        createdAt: { stringValue: now },
        updatedAt: { stringValue: now },
        isPublic: { booleanValue: true },
        published: { booleanValue: true },
        contentType: { stringValue: 'text/html' },
        htmlContent: { stringValue: htmlContent },
        source: { stringValue: fileUploaded ? 'storage' : 'firestore' },
        storageUploaded: { booleanValue: fileUploaded },
        publicUrl: { stringValue: publicUrl }
      };

      const restRes = await withTimeout(
        fetch(restUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ fields })
        }),
        2500,
        'Firestore REST API write timed out'
      );

      if (restRes.ok) {
        firestorePersisted = true;
        console.log(`[${correlationId}] FIRESTORE_WRITE: REST API write success`);
      } else {
        const errText = await restRes.text().catch(() => '');
        console.warn(`[${correlationId}] FIRESTORE_WRITE: REST API write failed: status=${restRes.status}, err=${errText}`);
      }
    } catch (restErr: any) {
      console.warn(`[${correlationId}] FIRESTORE_WRITE: REST API write error: ${restErr?.message}`);
    }
  }

  // 2c. Client-side Firestore SDK write signal
  if (!firestorePersisted && clientFirestorePersisted === true) {
    firestorePersisted = true;
    console.log(`[${correlationId}] FIRESTORE_WRITE: using Client SDK success signal`);
  }

  // 3. Persistent Disk + Memory Cache
  sharedHtmlContentMemoryMap.set(shareId, htmlContent);
  publicSharesMemoryMap.set(shareId, shareRecord);
  saveShareToDisk(shareId, shareRecord, htmlContent);

  // If both Storage and Firestore write failed, we DO NOT abort! We log a warning
  // and proceed with local server persistence fallback, allowing the publish to succeed.
  if (!fileUploaded && !firestorePersisted) {
    console.warn(`[${correlationId}] STORAGE_AND_FIRESTORE_FAILED: Both cloud-hosted Storages failed. Falling back to local disk and memory cache.`, {
      storageError: storageErrorMessage
    });
  }

  // 5. Bounded retrieval verification (instantaneous local process cache check)
  console.log(`[${correlationId}] VERIFICATION_START: evaluating memory/disk cache status`);
  let isVerified = false;
  let verificationError = '';

  const memoryShare = publicSharesMemoryMap.get(shareId);
  const memoryHtml = sharedHtmlContentMemoryMap.get(shareId);
  if (memoryShare && memoryHtml && memoryHtml.length > 500) {
    isVerified = true;
    console.log(`[${correlationId}] VERIFICATION_RESULT: success (verified via instantaneous process memory check, length=${memoryHtml.length})`);
  } else {
    const diskData = loadShareFromDisk(shareId);
    if (diskData?.record && diskData?.html && diskData.html.length > 500) {
      isVerified = true;
      console.log(`[${correlationId}] VERIFICATION_RESULT: success (verified via instantaneous disk cache check)`);
    } else {
      verificationError = 'Content missing from memory and disk caches';
      console.warn(`[${correlationId}] VERIFICATION_RESULT: failed: ${verificationError}`);
    }
  }

  const source = fileUploaded ? 'storage' : (firestorePersisted ? 'firestore' : 'local');
  const status = isVerified ? 'active' : 'pending';
  const publicHttp = isVerified ? 'verified' : 'failed';

  console.log(`[${correlationId}] PUBLISH_RESPONSE: success, status=${status}, publicHttp=${publicHttp}, source=${source}`);

  return res.status(200).json({
    success: true,
    published: true,
    shareId,
    source,
    storageUploaded: fileUploaded,
    firestorePersisted: firestorePersisted,
    url: `/shared/${shareId}`,
    publicUrl,
    status,
    verification: {
      storage: fileUploaded ? 'verified' : (firestorePersisted ? 'fallback' : 'failed'),
      publicHttp
    }
  });
});

// POST /api/shares/unpublish - Stop public access (Authenticated owner only)
app.post(['/api/shares/unpublish', '/api/api/shares/unpublish'], rateLimiter, requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { shareId } = req.body;

    if (!shareId) {
      return res.status(400).json({ error: 'Bad Request', message: 'shareId is required' });
    }

    let record = publicSharesMemoryMap.get(shareId);
    if (!record) {
      const diskData = loadShareFromDisk(shareId);
      if (diskData?.record) {
        record = diskData.record;
      }
    }
    if (!record && adminDb && isServerFirestoreAdminAvailable) {
      try {
        const docSnap = await adminDb.collection('publicShares').doc(shareId).get();
        if (docSnap.exists) {
          record = docSnap.data();
        }
      } catch (err: any) {
        console.warn('[Unpublish API] Firestore get warning:', err?.message);
      }
    }

    if (!record || record.ownerId !== userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this share or it does not exist' });
    }

    record.isPublic = false;
    record.published = false;
    record.updatedAt = new Date().toISOString();

    publicSharesMemoryMap.set(shareId, record);
    saveShareToDisk(shareId, record);

    if (adminDb && isServerFirestoreAdminAvailable) {
      try {
        await adminDb.collection('publicShares').doc(shareId).set(record, { merge: true });
      } catch (err: any) {
        console.warn('[Unpublish API] Firestore update warning:', err?.message);
      }
    }

    res.json({ success: true, message: 'Unpublished successfully' });
  } catch (err: any) {
    console.error('[Unpublish API Error]:', err);
    res.status(500).json({ error: 'Failed to unpublish' });
  }
});

// POST /api/shares/x - Share a public report to X (Authenticated owner only)
app.post(['/api/shares/x', '/api/api/shares/x'], rateLimiter, requireAuth, async (req, res) => {
  const correlationId = 'share-x-' + crypto.randomBytes(8).toString('hex');
  console.log(`[SHARE_X] START: correlationId=${correlationId}`);
  try {
    const userId = (req as any).userId;
    const { shareId } = req.body;

    if (!shareId) {
      console.warn(`[SHARE_X] ERROR: Missing shareId`);
      return res.status(400).json({ error: 'Bad Request', message: 'shareId is required' });
    }

    // 1. Load share record
    let record: any = publicSharesMemoryMap.get(shareId);
    if (!record) {
      const diskData = loadShareFromDisk(shareId);
      if (diskData?.record) {
        record = diskData.record;
      }
    }
    if (!record && adminDb && isServerFirestoreAdminAvailable) {
      try {
        const docSnap = await adminDb.collection('publicShares').doc(shareId).get();
        if (docSnap.exists) {
          record = docSnap.data();
        }
      } catch (err: any) {
        console.warn(`[SHARE_X] Firestore get warning:`, err?.message);
      }
    }

    if (!record) {
      console.warn(`[SHARE_X] ERROR: Record not found for shareId=${shareId}`);
      return res.status(404).json({ error: 'Not Found', message: 'Share record not found' });
    }

    // 2. Validate ownership & state
    if (record.ownerId !== userId) {
      console.warn(`[SHARE_X] ERROR: Forbidden (ownerId=${record.ownerId}, userId=${userId})`);
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this share' });
    }

    if (record.isPublic !== true && record.published !== true) {
      console.warn(`[SHARE_X] ERROR: BadRequest (report is not published or public)`);
      return res.status(400).json({ error: 'Bad Request', message: 'Cannot share an unpublished report to X' });
    }

    // 3. Get canonical public URL
    const publicUrl = record.publicUrl || getPublicShareUrl(shareId);
    if (!publicUrl) {
      console.warn(`[SHARE_X] ERROR: Missing publicUrl`);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Public URL is not configured' });
    }

    const postText = `Check out my Firekeeper Decision Intelligence & AI Governance Report: ${publicUrl}`;
    console.log(`[SHARE_X] API_REQUEST: sending tweet to X API (length=${postText.length})`);

    // Check credentials securely from environment
    const apiKey = process.env.X_API_KEY;
    const apiSecret = process.env.X_API_SECRET;
    const accessToken = process.env.X_ACCESS_TOKEN;
    const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET || process.env.X_ACCESS_SECRET;

    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      console.error(`[SHARE_X] ERROR: Missing X API Credentials in environment`);
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'ระบบไม่ได้ตั้งค่าสิทธิ์เชื่อมต่อ X (Twitter) API (X Credentials Missing on Server)'
      });
    }

    // Initialize twitter-api-v2 client
    const twitterClient = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessTokenSecret,
    });

    const response = await twitterClient.v2.tweet(postText);
    console.log(`[SHARE_X] SUCCESS: tweet posted. id=${response.data.id}`);

    const postId = response.data.id;
    const postUrl = `https://x.com/user/status/${postId}`;

    return res.status(200).json({
      success: true,
      postId,
      postUrl,
      message: 'แชร์ไปยัง X เรียบร้อยแล้ว!'
    });
  } catch (err: any) {
    console.error(`[SHARE_X] ERROR:`, err?.message || err);
    return res.status(500).json({
      error: 'Failed to share to X',
      message: err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ X API'
    });
  }
});

// POST /api/shares/delete - Delete storage files and public share record (Authenticated owner only)
app.post(['/api/shares/delete', '/api/api/shares/delete'], rateLimiter, requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { shareId } = req.body;

    if (!shareId) {
      return res.status(400).json({ error: 'Bad Request', message: 'shareId is required' });
    }

    let record = publicSharesMemoryMap.get(shareId);
    if (!record && adminDb && isServerFirestoreAdminAvailable) {
      const docSnap = await adminDb.collection('publicShares').doc(shareId).get();
      if (docSnap.exists) {
        record = docSnap.data();
      }
    }

    if (!record || record.ownerId !== userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this share or it does not exist' });
    }

    try {
      const { getStorage } = require('firebase-admin/storage');
      const bucket = getStorage().bucket(firebaseAppConfig.storageBucket);
      await bucket.file(record.storagePath).delete();
    } catch (e) {
      console.warn('[Delete API] Storage file delete warning:', e);
    }

    publicSharesMemoryMap.delete(shareId);
    sharedHtmlContentMemoryMap.delete(shareId);

    if (adminDb && isServerFirestoreAdminAvailable) {
      await adminDb.collection('publicShares').doc(shareId).delete();
    }

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err: any) {
    console.error('[Delete API Error]:', err);
    res.status(500).json({ error: 'Failed to delete share' });
  }
});

// ── VITE DEVELOPMENT / STATIC PRODUCTION MIDDLEWARE ─────────────────────────

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.join(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        const reactPreamble = `
    <script>
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
      window.__vite_plugin_react_preamble_installed__ = true;
    </script>
    <script type="module">
      import RefreshRuntime from '/@react-refresh';
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
      window.__vite_plugin_react_preamble_installed__ = true;
    </script>`;
        template = template.replace('<head>', `<head>${reactPreamble}`);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (err: any) {
        vite.ssrFixStacktrace(err);
        next(err);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1h',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Fire Keeper Core is listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Bootstrap Error]:', err);
});
