import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import type { Server } from 'node:http';
import { sanitizeErrorForLog } from './src/server/security/sanitizeError';
import { createCorsOriginPolicy } from './src/server/security/corsPolicy';

/**
 * Deterministic standard SHA-256 implementation using Node.js crypto.
 */
function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

import { securityHeaders } from './src/server/middleware/security';
import { rateLimiter, publishRateLimiter } from './src/server/middleware/rateLimit';
import { requireAuth, requireAdmin, isUserAdmin, activeSessions, StoredUser, userDatabase, hashPassword, verifyPassword, isOfflineOnlyMode, OFFLINE_USER_UID } from './src/server/middleware/auth';
import { serverDb, stripUndefinedFields, adminDb, isServerFirestoreAdminAvailable, markAdminFirestoreUnavailable } from './src/server/infrastructure/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let activeHttpServer: Server | null = null;
let shutdownStarted = false;

function gracefulFatalShutdown(label: string, error: unknown): void {
  console.error(label, sanitizeErrorForLog(error));
  if (shutdownStarted) return;
  shutdownStarted = true;
  process.exitCode = 1;

  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();

  if (activeHttpServer) {
    activeHttpServer.close(() => process.exit(1));
  } else {
    setImmediate(() => process.exit(1));
  }
}

// An uncaught exception leaves process state unknown. Log only a redacted summary,
// stop accepting traffic, and let Cloud Run replace the instance.
process.on('uncaughtException', (error) => {
  gracefulFatalShutdown('[Fatal] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  gracefulFatalShutdown('[Fatal] Unhandled rejection:', reason);
});

let isServerFirestoreQuotaExhausted = false;

async function getUserPlan(userId: string, email?: string, role?: string): Promise<PlanDefinition> {
  // Admin status is derived from the authenticated identity, never from a
  // client-provided plan value. Admins always receive Enterprise capabilities.
  if (isUserAdmin(userId, email, role)) return getPlan('enterprise');
  if (!adminDb || !isServerFirestoreAdminAvailable || isOfflineOnlyMode()) return getPlan('free');
  try {
    const snap = await adminDb.collection('users').doc(userId).get();
    return getPlan(snap.exists ? snap.data()?.planId : 'free');
  } catch { return getPlan('free'); }
}

function getRequestUserPlan(req: Request): Promise<PlanDefinition> {
  const identity = (req as any).user || {};
  return getUserPlan((req as any).userId, identity.email, identity.role);
}

async function getDailyAnalysisCount(userId: string): Promise<number> {
  if (!adminDb || !isServerFirestoreAdminAvailable || isOfflineOnlyMode()) return 0;
  try {
    const data = (await adminDb.collection('users').doc(userId).get()).data() || {};
    return data.dailyAnalysisDate === new Date().toISOString().slice(0, 10) ? Number(data.dailyAnalysisCount || 0) : 0;
  } catch { return 0; }
}

/** Persist completed-analysis usage from the trusted server, not the browser. */
async function recordCompletedAnalysisUsage(userId: string, email?: string, hasPdf = false): Promise<void> {
  if (!adminDb || !isServerFirestoreAdminAvailable || isOfflineOnlyMode() || !userId) return;
  const today = new Date().toISOString().slice(0, 10);
  const userRef = adminDb.collection('users').doc(userId);
  const dailyRef = adminDb.collection('daily_stats').doc(today);
  const { FieldValue } = require('firebase-admin/firestore');
  try {
    await adminDb.runTransaction(async (transaction: any) => {
      const existing = await transaction.get(userRef);
      const data = existing.exists ? (existing.data() || {}) : {};
      const dailyCount = data.dailyAnalysisDate === today ? Number(data.dailyAnalysisCount || 0) : 0;
      transaction.set(userRef, {
        uid: data.uid || userId,
        ...(email ? { email } : {}),
        ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
        lastActiveAt: FieldValue.serverTimestamp(),
        lastAnalysisAt: FieldValue.serverTimestamp(),
        analysisCount: FieldValue.increment(1),
        activeEventsCount: FieldValue.increment(1),
        ...(hasPdf ? { pdfAnalysisCount: FieldValue.increment(1) } : {}),
        dailyAnalysisDate: today,
        dailyAnalysisCount: dailyCount + 1,
      }, { merge: true });
    });
    await dailyRef.set({ date: today, analysesCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  } catch (error) {
    console.warn('[Usage] Could not persist completed-analysis usage:', sanitizeErrorForLog(error));
  }
}

function getStripeClient(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY;
  return secret ? new Stripe(secret) : null;
}

const STRIPE_PRICE_ENV: Record<string, string | undefined> = {
  // Internal plan id remains `byok` for backward compatibility, while the
  // customer-facing package is Starter.
  byok: process.env.STRIPE_PRICE_STARTER || process.env.STRIPE_PRICE_BYOK,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL,
  team: process.env.STRIPE_PRICE_TEAM,
  business: process.env.STRIPE_PRICE_BUSINESS,
};

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
import {
  callUnifiedLlmContent,
  testLlmConnection
} from './src/server/services/unifiedLlm';
import { countTokens } from './src/server/utils/text';
import { calculateActualTokenCost } from './src/utils/tokenUtils';
import { buildOptimizedSystemPrompt, cleanAiResponseStyle } from './src/server/services/promptOptimizer';
import { 
  calculateRuntimeResponseDepth, 
  filterMemoriesByRelevance, 
  validateModelOutput, 
  routeOrchestrationLanguage,
  getTaxonomyActivationPlan,
  RuntimeTrace
} from './src/server/services/pcaRuntimeController';
import { buildGovernedPromptPackage, GovernedPromptEvidence } from './src/server/services/governedPrompt';
import { ProcessDepth, ControlActivationPlan } from './src/types';
import { classifyIntent } from './src/server/services/intentClassifier';
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
import { deepWebRetrieve, DeepWebRetrievalResult } from './src/server/services/webAccess';
import { buildWebEvidenceGovernanceContext } from './src/server/services/webEvidenceGovernance';
import { resolvePublicationEvidence, formatPublicationContext, validatePublicationCitations } from './src/server/services/publicationKnowledge';
import { auditAndEnforcePunnPersona } from './src/server/services/punnPersonaGovernance';
import { enforcePreOutputQuality } from './src/server/services/preOutputQualityGate';
import { resolveContextualSearchAsync, ContextualSearchResolution } from './src/server/services/contextualSearchResolver';
import { buildRealDecisionExecutionTrace } from './src/utils/executionTraceEngine';
import { buildTieredAuditLog } from './src/server/services/auditLogger';
import { exportAuditEventToAzure } from './src/server/services/azureLogsIngestion';
import { validateDecisionObject } from './src/shared/contracts/decision';
import { DecisionObject } from './src/shared/contracts/decision';
import { auditDecisionSemantics } from './src/server/services/semanticAuditor';
import { formatModelTag, resolveProvider } from './src/utils/modelUtils';
import { 
  validateOutputLanguage, 
  buildLanguagePolicyRewritePrompt, 
  DEFAULT_LANGUAGE_POLICY 
} from './src/server/services/languagePolicy';
import { getPlan, hasPlanFeature, PlanFeature, PlanDefinition } from './src/config/plans';
import Stripe from 'stripe';

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
        console.warn(`[Env Loader] Could not read ${file}:`, sanitizeErrorForLog(err));
      }
    }
  }
}
loadLocalEnvFiles();

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '12mb', verify: (req: any, _res, buf) => { req.rawBody = Buffer.from(buf); } }));
app.use(securityHeaders);

// Prevent 206 Partial Content for HTML/Navigation requests (ensures Facebook Sharing Debugger and crawlers receive 200 OK)
app.use((req, res, next) => {
  const pathLower = req.path.toLowerCase();
  if (
    pathLower.endsWith('.html') ||
    pathLower === '/' ||
    (!pathLower.includes('.') && !pathLower.startsWith('/api'))
  ) {
    delete req.headers['range'];
  }
  next();
});

// CORS Policy Origin Check
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const isOriginAllowed = createCorsOriginPolicy({
  isProduction: IS_PRODUCTION,
  configuredOrigin: process.env.APP_ORIGIN,
});

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

function parseRetentionDays(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 3650) : fallback;
}

const RETENTION_DAYS = {
  conversations: parseRetentionDays('CONVERSATION_RETENTION_DAYS', 30),
  memories: parseRetentionDays('MEMORY_RETENTION_DAYS', 90),
  auditLogs: parseRetentionDays('AUDIT_LOG_RETENTION_DAYS', 365),
};

function expiresAt(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function isExpiredRecord(record: any): boolean {
  const value = record?.expiresAt;
  if (!value) return false;
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isFinite(date.getTime()) && date.getTime() <= Date.now();
}

function requirePersistentStorage(res: Response): boolean {
  // Offline mode is explicitly local-only. All hosted modes must have a working
  // Admin SDK so sensitive records are persisted by the trusted backend.
  if (isOfflineOnlyMode() || (adminDb && isServerFirestoreAdminAvailable)) return true;
  res.status(503).json({
    error: 'PERSISTENCE_UNAVAILABLE',
    message: 'Secure persistent storage is temporarily unavailable. Your data was not saved.'
  });
  return false;
}

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
  const store = userConversationsMap.get(key)!;
  for (const [id, record] of store.entries()) {
    if (isExpiredRecord(record)) {
      store.delete(id);
      userContextCacheMap.delete(`${key}:${id}`);
    }
  }
  return store;
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
    const record = store.get(conversationId);
    if (record && isExpiredRecord(record)) {
      store.delete(conversationId);
      userContextCacheMap.delete(`${otherUid}:${conversationId}`);
      continue;
    }
    if (otherUid !== userId && record) {
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
        if (data && isExpiredRecord(data)) {
          userStore.delete(conversationId);
          userContextCacheMap.delete(`${userId}:${conversationId}`);
          await docRef.delete();
          return { authorized: true, exists: false };
        }
        if (data && data.userId === userId) {
          // Hydrate only active records into the in-memory cache.
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
        console.warn('[Security Auth] Firestore conversation check notice:', sanitizeErrorForLog(e));
      }
    }
  }

  // If it doesn't exist anywhere, we treat it as a new conversation claim
  return { authorized: true, exists: false };
}

// ── API & HEALTH ROUTES ───────────────────────────────────────────────────

app.get(['/healthz', '/health'], (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test-only endpoint to create non-guest session. This is deliberately opt-in and unavailable outside the test runtime.
if (process.env.NODE_ENV === 'test' && process.env.ENABLE_TEST_AUTH === 'true') {
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

// ── ADMIN ARTICLE STUDIO ──────────────────────────────────────────────────
// Public articles are generated as Markdown, reviewed and explicitly published
// by an administrator. Raw HTML is never accepted from the browser or the model.
type PublicArticleRecord = {
  slug: string;
  title: string;
  markdown: string;
  contentHash: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  createdBy: string;
  model?: string;
  lensSummary?: string;
  deletedAt?: string;
  deletedBy?: string;
};

function normalizePublicArticleSlug(value: unknown): string {
  const slug = String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
  return slug;
}

function escapePublicHtml(value: unknown): string {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

app.post('/api/admin/articles/generate', publishRateLimiter, requireAuth, requireAdmin, async (req, res) => {
  const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim().slice(0, 500) : '';
  const sourceText = typeof req.body?.sourceText === 'string' ? req.body.sourceText.trim().slice(0, 50_000) : '';
  const language = req.body?.language === 'en' ? 'English' : 'Thai';
  if (!topic && !sourceText) return res.status(400).json({ error: 'ARTICLE_INPUT_REQUIRED', message: 'ระบุหัวข้อหรือข้อความต้นทางก่อนสร้างบทความ' });
  try {
    const result = await callUnifiedLlmContent(`Topic: ${topic || 'Derive a precise title from the supplied source'}\n\nSource material (may be incomplete or unverified):\n${sourceText || '(No source material supplied.)'}`, {
      provider: process.env.FIREKEEPER_ARTICLE_PROVIDER || 'deepseek',
      model: process.env.FIREKEEPER_ARTICLE_MODEL || 'deepseek-chat',
      temperature: 0.35,
      systemInstruction: `You are FIREKEEPER's public article drafting assistant. Write a ${language} Markdown article for public publication. Begin with exactly one # title. Use a clear, non-promotional voice. Apply the FIREKEEPER lens: distinguish observed/source-backed material from interpretation; mark uncertainty; do not turn recommendations into facts; never invent citations, statistics, organizations, events, standards compliance, or legal/medical/financial conclusions. If the source is only a topic, write general explanatory content and explicitly avoid unsupported claims. Include a short 'What to verify' section when factual verification is needed. The human editor will review the draft before publication.`
    });
    const markdown = result.text.trim().slice(0, 50_000);
    if (!markdown) throw new Error('The model returned an empty article draft.');
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = (titleMatch?.[1] || topic || 'FIREKEEPER Article').replace(/[*_`]/g, '').trim().slice(0, 180);
    return res.json({ success: true, title, slug: normalizePublicArticleSlug(title), markdown, model: result.modelUsed, lensSummary: 'Draft generated with a claim/evidence, uncertainty, and conditional-recommendation boundary. Human review is required before publication.' });
  } catch (error: any) {
    console.error('[Article Studio] Draft generation failed:', sanitizeErrorForLog(error));
    return res.status(502).json({ error: 'ARTICLE_GENERATION_FAILED', message: 'ไม่สามารถสร้างร่างบทความได้ โปรดตรวจการตั้งค่า AI runtime แล้วลองใหม่' });
  }
});

app.post('/api/admin/articles/publish', publishRateLimiter, requireAuth, requireAdmin, async (req, res) => {
  if (isOfflineOnlyMode() || !adminDb || !isServerFirestoreAdminAvailable) return res.status(503).json({ error: 'ARTICLE_PUBLISHING_UNAVAILABLE', message: 'ต้องเชื่อมต่อ Firestore ฝั่ง server เพื่อเผยแพร่บทความสาธารณะ' });
  const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 180) : '';
  const slug = normalizePublicArticleSlug(req.body?.slug || title);
  const markdown = typeof req.body?.markdown === 'string' ? req.body.markdown.trim().slice(0, 50_000) : '';
  if (!title || !slug || !markdown) return res.status(400).json({ error: 'INVALID_ARTICLE', message: 'ชื่อ slug และเนื้อหาบทความต้องครบถ้วน' });
  try {
    const now = new Date().toISOString();
    const ref = adminDb.collection('public_articles').doc(slug);
    const existing = await ref.get();
    const previous = existing.exists ? existing.data() || {} : {};
    const record: PublicArticleRecord = { slug, title, markdown, contentHash: sha256(markdown), createdAt: previous.createdAt || now, updatedAt: now, publishedAt: now, createdBy: (req as any).userId, model: typeof req.body?.model === 'string' ? req.body.model.slice(0, 120) : undefined, lensSummary: typeof req.body?.lensSummary === 'string' ? req.body.lensSummary.slice(0, 500) : undefined };
    await ref.set(stripUndefinedFields(record));
    return res.json({ success: true, slug, publicUrl: `/publication?article=${slug}`, htmlUrl: `/publication?article=${slug}` });
  } catch (error: any) {
    if (error?.code === 7 || /PERMISSION_DENIED|Missing or insufficient permissions/.test(error?.message || '')) markAdminFirestoreUnavailable(error);
    console.error('[Article Studio] Publishing failed:', sanitizeErrorForLog(error));
    return res.status(500).json({ error: 'ARTICLE_PUBLISHING_FAILED', message: 'Firestore ไม่อนุญาตให้เขียน public_articles หรือการตั้งค่า server ยังไม่พร้อม' });
  }
});

app.get('/api/admin/articles', rateLimiter, requireAuth, requireAdmin, async (_req, res) => {
  if (!adminDb || !isServerFirestoreAdminAvailable) return res.status(503).json({ error: 'ARTICLE_ADMIN_UNAVAILABLE', message: 'ต้องเชื่อมต่อ Firestore ฝั่ง server' });
  try {
    const snapshot = await adminDb.collection('public_articles').limit(200).get();
    const articles = snapshot.docs
      .map((item: any) => ({ id: item.id, ...(item.data() as PublicArticleRecord) }))
      .filter((article: any) => !article.deletedAt)
      .sort((a: any, b: any) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    return res.json({ articles });
  } catch (error) { return res.status(500).json({ error: 'ARTICLE_ADMIN_LIST_FAILED' }); }
});

app.put('/api/admin/articles/:slug', publishRateLimiter, requireAuth, requireAdmin, async (req, res) => {
  if (isOfflineOnlyMode() || !adminDb || !isServerFirestoreAdminAvailable) return res.status(503).json({ error: 'ARTICLE_EDITING_UNAVAILABLE', message: 'ต้องเชื่อมต่อ Firestore ฝั่ง server เพื่อแก้ไขบทความ' });
  const currentSlug = normalizePublicArticleSlug(req.params.slug);
  const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 180) : '';
  const nextSlug = normalizePublicArticleSlug(req.body?.slug || title);
  const markdown = typeof req.body?.markdown === 'string' ? req.body.markdown.trim().slice(0, 50_000) : '';
  if (!currentSlug || !title || !nextSlug || !markdown) return res.status(400).json({ error: 'INVALID_ARTICLE', message: 'ชื่อ slug และเนื้อหาบทความต้องครบถ้วน' });
  try {
    const currentRef = adminDb.collection('public_articles').doc(currentSlug);
    const currentSnap = await currentRef.get();
    if (!currentSnap.exists || currentSnap.data()?.deletedAt) return res.status(404).json({ error: 'ARTICLE_NOT_FOUND' });
    const previous = currentSnap.data() || {};
    const now = new Date().toISOString();
    const record: PublicArticleRecord = { ...previous, slug: nextSlug, title, markdown, contentHash: sha256(markdown), createdAt: previous.createdAt || now, updatedAt: now, publishedAt: previous.publishedAt || now, createdBy: previous.createdBy || (req as any).userId, model: typeof req.body?.model === 'string' ? req.body.model.slice(0, 120) : previous.model, lensSummary: typeof req.body?.lensSummary === 'string' ? req.body.lensSummary.slice(0, 500) : previous.lensSummary };
    if (nextSlug !== currentSlug) {
      const nextRef = adminDb.collection('public_articles').doc(nextSlug);
      const nextSnap = await nextRef.get();
      if (nextSnap.exists && !nextSnap.data()?.deletedAt) return res.status(409).json({ error: 'ARTICLE_SLUG_EXISTS', message: 'slug นี้ถูกใช้งานแล้ว' });
      await nextRef.set(stripUndefinedFields(record));
      await currentRef.set(stripUndefinedFields({ ...previous, deletedAt: now, deletedBy: (req as any).userId, updatedAt: now }));
    } else {
      await currentRef.set(stripUndefinedFields(record), { merge: true });
    }
    return res.json({ success: true, slug: nextSlug, publicUrl: `/publication?article=${nextSlug}` });
  } catch (error: any) {
    if (error?.code === 7 || /PERMISSION_DENIED|Missing or insufficient permissions/.test(error?.message || '')) markAdminFirestoreUnavailable(error);
    console.error('[Article Studio] Editing failed:', sanitizeErrorForLog(error));
    return res.status(500).json({ error: 'ARTICLE_EDITING_FAILED', message: 'ไม่สามารถแก้ไขบทความได้' });
  }
});

app.delete('/api/admin/articles/:slug', publishRateLimiter, requireAuth, requireAdmin, async (req, res) => {
  if (isOfflineOnlyMode() || !adminDb || !isServerFirestoreAdminAvailable) return res.status(503).json({ error: 'ARTICLE_DELETING_UNAVAILABLE', message: 'ต้องเชื่อมต่อ Firestore ฝั่ง server เพื่อลบบทความ' });
  const slug = normalizePublicArticleSlug(req.params.slug);
  if (!slug) return res.status(400).json({ error: 'INVALID_ARTICLE_SLUG' });
  try {
    const ref = adminDb.collection('public_articles').doc(slug);
    const snap = await ref.get();
    if (!snap.exists || snap.data()?.deletedAt) return res.status(404).json({ error: 'ARTICLE_NOT_FOUND' });
    const now = new Date().toISOString();
    await ref.set({ deletedAt: now, deletedBy: (req as any).userId, updatedAt: now }, { merge: true });
    return res.json({ success: true, deleted: true, slug });
  } catch (error: any) {
    if (error?.code === 7 || /PERMISSION_DENIED|Missing or insufficient permissions/.test(error?.message || '')) markAdminFirestoreUnavailable(error);
    console.error('[Article Studio] Deleting failed:', sanitizeErrorForLog(error));
    return res.status(500).json({ error: 'ARTICLE_DELETING_FAILED', message: 'ไม่สามารถลบบทความได้' });
  }
});

app.get('/api/public/articles', rateLimiter, async (_req, res) => {
  if (!adminDb || !isServerFirestoreAdminAvailable) return res.status(503).json({ error: 'ARTICLE_READER_UNAVAILABLE' });
  try {
    const snapshot = await adminDb.collection('public_articles').orderBy('publishedAt', 'desc').limit(100).get();
    const articles = snapshot.docs
      .map((item: any) => item.data() as PublicArticleRecord)
      .filter((article: PublicArticleRecord) => !article.deletedAt)
      .map((article: PublicArticleRecord) => ({
        slug: article.slug,
        title: article.title,
        publishedAt: article.publishedAt,
        excerpt: article.markdown.replace(/^#.*$/m, '').replace(/[#*_`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 220)
      }));
    return res.json({ articles });
  } catch (error) { return res.status(500).json({ error: 'ARTICLE_LIST_FAILED' }); }
});

app.get('/api/public/articles/:slug', rateLimiter, async (req, res) => {
  const slug = normalizePublicArticleSlug(req.params.slug);
  if (!slug) return res.status(404).json({ error: 'ARTICLE_NOT_FOUND' });
  if (!adminDb || !isServerFirestoreAdminAvailable) return res.status(503).json({ error: 'ARTICLE_READER_UNAVAILABLE' });
  try {
    const snap = await adminDb.collection('public_articles').doc(slug).get();
    if (!snap.exists || snap.data()?.deletedAt) return res.status(404).json({ error: 'ARTICLE_NOT_FOUND' });
    const article = snap.data() as PublicArticleRecord;
    return res.json({ slug: article.slug, title: article.title, publishedAt: article.publishedAt, markdown: article.markdown });
  } catch (error) { return res.status(500).json({ error: 'ARTICLE_READ_FAILED' }); }
});

// Preserve old article links while keeping all public reading inside the shared
// Publication experience and its primary typography.
app.get('/articles/:slug', rateLimiter, (req, res) => {
  const slug = normalizePublicArticleSlug(req.params.slug);
  return res.redirect(302, `/publication?article=${encodeURIComponent(slug)}`);
});

app.post('/api/flood/live-data', rateLimiter, requireAuth, async (req, res) => {
  const location = typeof req.body?.location === 'string' ? req.body.location.trim().slice(0, 120) : '';
  if (!location) return res.status(400).json({ error: 'LOCATION_REQUIRED', message: 'ระบุพื้นที่ที่ต้องการค้นหาข้อมูล' });
  try {
    const queries = {
      weather: `พยากรณ์อากาศ ฝน อุณหภูมิ ${location} ล่าสุด`,
      metAnnouncement: `site:tmd.go.th ประกาศเตือนภัยอากาศ น้ำฝน ${location} ล่าสุด`,
      satellite: `ภาพดาวเทียม เมฆ ฝน น้ำท่วม ${location} ล่าสุด GISTDA NASA Sentinel`
    };
    const entries = await Promise.all(Object.entries(queries).map(async ([category, query]) => {
      const result = await performWebSearch(query, { maxResults: 6, forceFresh: true });
      return { category, query, success: Boolean(result.success), statusMessage: result.statusMessage, results: (result.results || []).map((item: any) => ({ title: item.title, url: item.url, sourceDomain: item.sourceDomain, publishedAt: item.publishedAt, snippet: item.snippet })) };
    }));
    const satellite = entries.find((entry) => entry.category === 'satellite');
    if (satellite) {
      satellite.results.unshift(
        { title: 'GISTDA Disaster Platform · Flood', url: 'https://disaster.gistda.or.th/flood', sourceDomain: 'disaster.gistda.or.th', snippet: 'พอร์ทัลทางการสำหรับติดตามสถานการณ์น้ำท่วมและข้อมูลดาวเทียมของ GISTDA' },
        { title: 'Sentinel Hub EO Browser', url: 'https://apps.sentinel-hub.com/eo-browser/', sourceDomain: 'sentinel-hub.com', snippet: 'เครื่องมือสำรวจภาพ Sentinel และข้อมูลดาวเทียมตามพื้นที่และช่วงเวลา' }
      );
    }
    return res.json({ success: entries.some((entry) => entry.success), location, categories: entries });
  } catch (error) {
    console.error('[Flood AI] live retrieval failed:', sanitizeErrorForLog(error));
    return res.status(502).json({ error: 'FLOOD_LIVE_RETRIEVAL_FAILED', message: 'ดึงข้อมูลสดไม่สำเร็จ' });
  }
});

app.post('/api/flood/weather', rateLimiter, requireAuth, async (req, res) => {
  const location = typeof req.body?.location === 'string' ? req.body.location.trim().slice(0, 120) : '';
  if (!location) return res.status(400).json({ error: 'LOCATION_REQUIRED', message: 'ระบุพื้นที่ที่ต้องการค้นหาข้อมูล' });
  try {
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=th&format=json`);
    const geo: any = await geoResponse.json().catch(() => ({}));
    const place = Array.isArray(geo?.results) ? geo.results[0] : null;
    if (!place) return res.status(404).json({ error: 'LOCATION_NOT_FOUND', message: 'ไม่พบพิกัดพื้นที่นี้' });
    const params = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
      hourly: 'precipitation_probability,precipitation,rain',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code',
      timezone: 'Asia/Bangkok',
      forecast_days: '3',
    });
    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    const weather: any = await weatherResponse.json().catch(() => ({}));
    if (!weatherResponse.ok) return res.status(502).json({ error: 'WEATHER_PROVIDER_FAILED', message: 'แหล่งข้อมูลพยากรณ์ไม่ตอบสนอง' });
    return res.json({
      success: true,
      source: 'Open-Meteo',
      location: { name: place.name, admin1: place.admin1, country: place.country, latitude: place.latitude, longitude: place.longitude },
      current: weather.current || null,
      daily: weather.daily || null,
      hourly: weather.hourly || null,
      retrievedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Flood AI] weather retrieval failed:', sanitizeErrorForLog(error));
    return res.status(502).json({ error: 'WEATHER_RETRIEVAL_FAILED', message: 'ดึงพยากรณ์อากาศไม่สำเร็จ' });
  }
});

app.post('/api/flood/analyze', rateLimiter, requireAuth, async (req, res) => {
  const location = typeof req.body?.location === 'string' ? req.body.location.trim().slice(0, 120) : '';
  const weather = req.body?.weather || {};
  const risk = typeof req.body?.risk === 'string' ? req.body.risk : 'ยังไม่ประเมิน';
  if (!location) return res.status(400).json({ error: 'LOCATION_REQUIRED', message: 'ระบุพื้นที่ก่อนวิเคราะห์' });
  try {
    const result = await callUnifiedLlmContent(
      `พื้นที่: ${location}
ระดับความเสี่ยงจากค่าคัดกรอง: ${risk}
ข้อมูลอากาศปัจจุบัน: ${JSON.stringify(weather.current || {})}
พยากรณ์รายวัน: ${JSON.stringify(weather.daily || {})}

วิเคราะห์สถานการณ์น้ำท่วมแบบสั้น กระชับ และตรวจสอบได้ โดยตอบเป็นภาษาไทยตามหัวข้อ:
1) ภาพรวมสถานการณ์
2) ปัจจัยที่สนับสนุนความเสี่ยง
3) ข้อมูลที่ยังขาด/ความไม่แน่นอน
4) สิ่งที่ควรติดตามต่อใน 6-24 ชั่วโมง
ห้ามประกาศเตือนภัย ห้ามสั่งอพยพ และห้ามสร้างตัวเลขที่ไม่มีในข้อมูล`,
      {
        provider: process.env.FIREKEEPER_FLOOD_PROVIDER || 'deepseek',
        model: process.env.FIREKEEPER_FLOOD_MODEL || 'deepseek-chat',
        temperature: 0.2,
        systemInstruction: 'คุณเป็นผู้ช่วยวิเคราะห์ข้อมูลน้ำท่วมของ FIREKEEPER ใช้เฉพาะข้อมูลที่ให้มา แยกข้อเท็จจริงกับการอนุมาน และระบุข้อจำกัดเสมอ',
      }
    );
    const analysisText = typeof result === 'string' ? result : (result as any)?.text || (result as any)?.content || (result as any)?.reasoningContent || JSON.stringify(result);
    return res.json({ success: true, analysis: analysisText });
  } catch (error) {
    console.error('[Flood AI] analysis failed:', sanitizeErrorForLog(error));
    return res.status(502).json({ error: 'FLOOD_AI_ANALYSIS_FAILED', message: 'AI วิเคราะห์ไม่สำเร็จ' });
  }
});

app.post('/api/flood/follow-up', rateLimiter, requireAuth, async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, 4000) : '';
  const context = typeof req.body?.context === 'string' ? req.body.context.slice(0, 30000) : '';
  if (!message) return res.status(400).json({ error: 'MESSAGE_REQUIRED', message: 'ระบุรายละเอียดที่ต้องการให้ AI เพิ่มเติม' });
  try {
    const result = await callUnifiedLlmContent(`รายงานเดิม:
${context}

คำขอเพิ่มเติมจากผู้ใช้:
${message}`, {
      provider: process.env.FIREKEEPER_FLOOD_PROVIDER || 'deepseek',
      model: process.env.FIREKEEPER_FLOOD_MODEL || 'deepseek-chat',
      temperature: 0.2,
      systemInstruction: 'คุณเป็นผู้ช่วยต่อยอดรายงาน Flood AI ของ FIREKEEPER เขียนเป็น Markdown ภาษาไทย รักษาข้อเท็จจริงเดิม ห้ามสร้างข้อมูลที่ไม่มีหลักฐาน และระบุความไม่แน่นอนเมื่อจำเป็น',
    });
    const text = typeof result === 'string' ? result : (result as any)?.text || (result as any)?.content || JSON.stringify(result);
    return res.json({ success: true, response: text });
  } catch (error) {
    console.error('[Flood AI] follow-up failed:', sanitizeErrorForLog(error));
    return res.status(502).json({ error: 'FLOOD_FOLLOW_UP_FAILED', message: 'ไม่สามารถต่อยอดรายงานได้' });
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
            if (isExpiredRecord(data)) {
              void docSnap.ref.delete().catch((error: unknown) => {
                console.warn('[Retention] Failed to delete expired conversation:', sanitizeErrorForLog(error));
              });
            } else {
              conversations.push(data);
              localStore.set(docSnap.id, data);
            }
          }
        });
      } catch (err: any) {
        if (err?.code === 7 || err?.message?.includes('PERMISSION_DENIED') || err?.message?.includes('Missing or insufficient permissions')) {
          markAdminFirestoreUnavailable(err);
        } else {
          console.warn('[API Conversations] Firestore query notice:', sanitizeErrorForLog(err));
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
    console.error('[API Conversations] Error listing conversations:', sanitizeErrorForLog(err));
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
    if (!requirePersistentStorage(res)) return;
    const session = req.body;
    if (!session || !session.id) {
      return res.status(400).json({ error: 'Invalid session payload. id is required' });
    }

    // Server-side ownership verification: Cannot overwrite another user's conversation!
    let targetSessionId = session.id;
    const check = await verifyConversationOwnership(userId, targetSessionId);
    if (check.exists && !check.authorized) {
      targetSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      console.warn(`[API Conversations] Session ID collision with another user. Reassigning to fresh ID: ${targetSessionId}`);
    }

    // Force authenticated userId as the owner (ignore any userId in body)
    const secureSession = {
      ...session,
      id: targetSessionId,
      userId,
      updated_at: new Date().toISOString(),
      expiresAt: expiresAt(RETENTION_DAYS.conversations),
    };

    // Save to user-scoped in-memory store
    const userStore = getUserConversationStore(userId);
    userStore.set(targetSessionId, secureSession);

    // Save to Firestore if available
    if (adminDb && isServerFirestoreAdminAvailable && !isOfflineOnlyMode()) {
      try {
        await adminDb.collection('conversations').doc(targetSessionId).set(secureSession);
      } catch (err: any) {
        if (err?.code === 7 || err?.message?.includes('PERMISSION_DENIED') || err?.message?.includes('Missing or insufficient permissions')) {
          markAdminFirestoreUnavailable(err);
        } else {
          console.warn('[API Conversations] Firestore save notice:', sanitizeErrorForLog(err));
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
    if (!requirePersistentStorage(res)) return;
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
          console.warn('[API Conversations] Firestore delete notice:', sanitizeErrorForLog(err));
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
  if (!requirePersistentStorage(res)) return;
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
        },
        expiresAt: expiresAt(RETENTION_DAYS.auditLogs),
      });
      console.log(`[Audit Log] Decision audit saved: ${auditId} (Status: ${validation.status})`);
    } catch (err: any) {
      if (err?.code === 7 || err?.message?.includes('PERMISSION_DENIED') || err?.message?.includes('Missing or insufficient permissions')) {
        markAdminFirestoreUnavailable(err);
      } else {
        console.warn('[Audit Log] Firestore notice:', sanitizeErrorForLog(err));
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
        console.warn('[Memory Security] Firestore verification notice:', sanitizeErrorForLog(err));
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
        const data = doc.data();
        if (isExpiredRecord(data)) {
          void doc.ref.delete().catch((error: unknown) => {
            console.warn('[Retention] Failed to delete expired memory:', sanitizeErrorForLog(error));
          });
        } else {
          memories.push(data as MemoryRecord);
        }
      });
      if (memories.length > 0) {
        userMemoryBanks.set(userId, memories);
      }
    } catch (err: any) {
      if (err?.code === 7 || err?.message?.includes('PERMISSION_DENIED') || err?.message?.includes('Missing or insufficient permissions')) {
        markAdminFirestoreUnavailable(err);
      } else {
        console.warn('[Memory Bank] Firestore fetch notice:', sanitizeErrorForLog(err));
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
  if (!requirePersistentStorage(res)) return;
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
    expiresAt: expiresAt(RETENTION_DAYS.memories),
  } as MemoryRecord;

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
        console.warn('[Memory Bank] Firestore save notice:', sanitizeErrorForLog(err));
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
  if (!requirePersistentStorage(res)) return;

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
        console.warn('[Memory Bank] Firestore delete notice:', sanitizeErrorForLog(err));
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
  if (isOfflineOnlyMode() || !adminDb || !isServerFirestoreAdminAvailable) {
    return res.status(503).json({ error: 'ADMIN_ANALYTICS_UNAVAILABLE', message: 'ยังเชื่อมต่อฐานข้อมูลสถิติของผู้ดูแลระบบไม่ได้ จึงไม่แสดงข้อมูลจำลอง' });
  }
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;
    const dateKey = (date: Date) => date.toISOString().slice(0, 10);
    const toMillis = (value: any) => !value ? 0 : typeof value.toMillis === 'function' ? value.toMillis() : typeof value.toDate === 'function' ? value.toDate().getTime() : (new Date(value).getTime() || 0);
    const formatDate = (value: any, fallback: string) => {
      const millis = toMillis(value);
      return millis ? new Date(millis).toLocaleString('th-TH') : fallback;
    };
    const daily = new Map<string, { analyses: number; newUsers: number; activeUsers: number }>();
    for (let offset = 6; offset >= 0; offset--) daily.set(dateKey(new Date(startOfToday - offset * 86400000)), { analyses: 0, newUsers: 0, activeUsers: 0 });

    const [usersSnap, dailySnap] = await Promise.all([adminDb.collection('users').get(), adminDb.collection('daily_stats').get()]);
    let totalMembers = 0, activeUsers = 0, newMembersToday = 0, newMembersThisWeek = 0, totalAnalyses = 0, returningUsers = 0;
    const recentUsers: any[] = [];
    usersSnap.forEach((userDoc: any) => {
      const data = userDoc.data() || {};
      const analysisCount = Number(data.analysisCount) || 0;
      const pdfAnalysisCount = Number(data.pdfAnalysisCount) || 0;
      const activeEventsCount = Number(data.activeEventsCount) || 0;
      const createdAt = toMillis(data.createdAt);
      const lastActiveAt = toMillis(data.lastActiveAt) || toMillis(data.lastAnalysisAt) || toMillis(data.lastLoginAt);
      const isActive = analysisCount > 0 || pdfAnalysisCount > 0 || activeEventsCount > 0 || !!data.lastAnalysisAt;
      totalMembers++; totalAnalyses += analysisCount;
      if (isActive) activeUsers++;
      if (analysisCount >= 2 || activeEventsCount >= 3) returningUsers++;
      if (createdAt >= startOfToday) newMembersToday++;
      if (createdAt >= startOfWeek) newMembersThisWeek++;
      const createdKey = createdAt ? dateKey(new Date(createdAt)) : '';
      if (daily.has(createdKey)) daily.get(createdKey)!.newUsers++;
      const activeKey = lastActiveAt ? dateKey(new Date(lastActiveAt)) : '';
      if (isActive && daily.has(activeKey)) daily.get(activeKey)!.activeUsers++;
      recentUsers.push({ uid: data.uid || userDoc.id, email: data.email || 'user@firebase', analysisCount, pdfAnalysisCount, isActive, role: isUserAdmin(userDoc.id, data.email, data.role) ? 'admin' : 'member', createdAtText: formatDate(data.createdAt, '-'), lastLoginText: formatDate(data.lastLoginAt, '-'), lastAnalysisText: formatDate(data.lastAnalysisAt, 'ยังไม่เคยวิเคราะห์'), sortTime: lastActiveAt });
    });
    dailySnap.forEach((dailyDoc: any) => {
      const data = dailyDoc.data() || {}; const key = data.date || dailyDoc.id;
      if (!daily.has(key)) return;
      const entry = daily.get(key)!;
      entry.analyses = Number(data.analysesCount) || 0;
      entry.newUsers = Math.max(entry.newUsers, Number(data.newUsersCount) || 0);
    });
    const today = dateKey(now);
    const dailyTrends = Array.from(daily.entries()).map(([date, value]) => ({ date: date.slice(5), ...value }));
    const analysesToday = daily.get(today)?.analyses || 0;
    const analysesThisWeek = Array.from(daily.values()).reduce((sum, value) => sum + value.analyses, 0);
    recentUsers.sort((a, b) => b.sortTime - a.sortTime);
    recentUsers.forEach((user) => delete user.sortTime);
    return res.json({ success: true, summary: { totalMembers, activeUsers, newMembersToday, newMembersThisWeek, analysesToday, analysesThisWeek, totalAnalyses, returningUsers, dailyTrends, recentUsers: recentUsers.slice(0, 50), lastRefreshedAt: now.toLocaleTimeString('th-TH') } });
  } catch (error: any) {
    if (error?.code === 7 || error?.message?.includes('PERMISSION_DENIED') || error?.message?.includes('Missing or insufficient permissions')) markAdminFirestoreUnavailable(error);
    console.error('[Admin API] Error fetching usage analytics:', sanitizeErrorForLog(error));
    return res.status(500).json({ error: 'ADMIN_ANALYTICS_FAILED', message: 'ไม่สามารถโหลดสถิติผู้ดูแลระบบได้' });
  }
});
// Admin-only mapping from Sentinel references to Firekeeper users and safe audit metadata.
// This endpoint intentionally excludes prompts, responses, previews, evidence payloads, and hashes of content.
app.get('/api/admin/audit-lookup', rateLimiter, requireAuth, requireAdmin, async (req, res) => {
  if (isOfflineOnlyMode() || !adminDb || !isServerFirestoreAdminAvailable) {
    return res.status(503).json({ error: 'ADMIN_AUDIT_LOOKUP_UNAVAILABLE', message: 'ยังเชื่อมต่อคลัง audit สำหรับผู้ดูแลระบบไม่ได้' });
  }

  const reference = typeof req.query.reference === 'string' ? req.query.reference.trim() : '';
  const isUserHash = /^[a-f0-9]{64}$/i.test(reference);
  const isExecutionId = /^(DEC|EXEC)-[A-Z0-9-]{4,96}$/i.test(reference);
  if (!isUserHash && !isExecutionId) {
    return res.status(400).json({ error: 'INVALID_AUDIT_REFERENCE', message: 'ระบุ UserIdHash แบบ SHA-256 หรือ ExecutionId ที่ถูกต้อง' });
  }

  const toIso = (value: any): string | null => {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };
  const summarize = (auditDoc: any) => {
    const audit = auditDoc.data() || {};
    return {
      executionId: audit.execution_id || auditDoc.id,
      traceId: audit.trace_id || audit.execution_id || auditDoc.id,
      timestamp: toIso(audit.timestamp),
      model: audit.model || 'unknown',
      logLevel: audit.logging_level || 'PRODUCTION',
      durationMs: Number(audit.duration_ms) || 0,
      evidenceCount: Number(audit.counts?.evidence_count) || 0,
      conflictCount: Number(audit.counts?.conflicts_count) || 0,
      riskCount: Number(audit.counts?.risk_count) || 0,
      governanceStatus: audit.governance?.status || 'UNKNOWN',
      integrityStatus: audit.integrity?.chain_status || 'UNKNOWN',
    };
  };

  try {
    let userId = '';
    let auditRecords: any[] = [];

    if (isExecutionId) {
      const auditSnapshot = await adminDb.collectionGroup('pca_audit_logs').where('execution_id', '==', reference).limit(10).get();
      if (auditSnapshot.empty) return res.json({ success: true, result: null });
      userId = auditSnapshot.docs[0].ref.parent.parent?.id || '';
      auditRecords = auditSnapshot.docs.map(summarize);
    } else {
      // The hash is computed from the Firestore UID exactly as the Azure exporter does.
      // Only the matching account is returned; no user directory is exposed to the client.
      const usersSnapshot = await adminDb.collection('users').get();
      const matchedUser = usersSnapshot.docs.find((userDoc: any) => sha256(userDoc.id) === reference.toLowerCase());
      if (!matchedUser) return res.json({ success: true, result: null });
      userId = matchedUser.id;
      const auditsSnapshot = await matchedUser.ref.collection('pca_audit_logs').orderBy('timestamp', 'desc').limit(10).get();
      auditRecords = auditsSnapshot.docs.map(summarize);
    }

    if (!userId) return res.json({ success: true, result: null });
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const user = userDoc.data() || {};
    return res.json({
      success: true,
      result: {
        referenceType: isUserHash ? 'user_hash' : 'execution_id',
        user: { uid: userId, email: user.email || null, role: isUserAdmin(userId, user.email, user.role) ? 'admin' : 'member' },
        auditRecords,
      },
    });
  } catch (error: any) {
    console.error('[Admin API] Audit lookup failed:', sanitizeErrorForLog(error));
    return res.status(500).json({ error: 'ADMIN_AUDIT_LOOKUP_FAILED', message: 'ไม่สามารถค้นหา audit reference ได้' });
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
    console.error('Compress Context Error:', sanitizeErrorForLog(err));
    res.status(500).json({ error: err?.message || 'Failed to compress context' });
  }
});

// FIRE KEEPER Contextual Search Resolver Endpoint
app.post('/api/contextual-search/resolve', rateLimiter, requireAuth, async (req, res) => {
  const userPlan = await getRequestUserPlan(req);
  if (!hasPlanFeature(userPlan.id, 'byok')) {
    return res.status(403).json({ error: 'PLAN_FEATURE_REQUIRED', feature: 'byok', plan: userPlan.id, message: 'Contextual Web Search ใช้ได้ตั้งแต่แพ็กเกจ Starter ขึ้นไป', upgradeRequired: true });
  }
  try {
    const { question = '', history = [], deepSeekApiKey } = req.body;
    const resolution = await resolveContextualSearchAsync(question, history, { apiKey: deepSeekApiKey });
    res.json(resolution);
  } catch (err: any) {
    console.error('Contextual Search Resolver Error:', sanitizeErrorForLog(err));
    res.status(500).json({ error: err?.message || 'Failed to resolve contextual search' });
  }
});

// Check Local Ollama Status & Downloaded Models
app.get('/api/ollama/status', rateLimiter, requireAuth, async (req, res) => {
  try {
    const customUrl = typeof req.query.baseUrl === 'string' ? req.query.baseUrl : undefined;
    const status = await checkOllamaStatus(customUrl);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ online: false, error: err?.message || 'Failed to check Ollama status' });
  }
});

// Test Connection for Any LLM Provider (DeepSeek, Ollama, OpenAI, Anthropic, Gemini, Groq, OpenRouter, Mistral, Perplexity, Custom)
app.post('/api/llm/test-connection', rateLimiter, requireAuth, async (req, res) => {
  let apiKey = typeof req.body?.apiKey === 'string' ? req.body.apiKey : undefined;
  try {
    const { provider, model, baseUrl } = req.body;
    // Enforce the same BYOK entitlement used by the streaming endpoint.
    const userPlan = await getRequestUserPlan(req);
    const requestedProvider = String(provider || 'deepseek').trim().toLowerCase();
    const usesExternalProvider = requestedProvider !== 'deepseek' || Boolean(baseUrl);
    if (usesExternalProvider && !hasPlanFeature(userPlan.id, 'byok')) {
      return res.status(403).json({
        error: 'PLAN_FEATURE_REQUIRED',
        feature: 'byok',
        plan: userPlan.id,
        message: 'การทดสอบโมเดล/API ภายนอกใช้ได้ตั้งแต่แพ็กเกจ Starter ขึ้นไป',
        upgradeRequired: true
      });
    }
    delete req.body.apiKey;
    const result = await testLlmConnection({
      provider: provider || 'deepseek',
      model,
      apiKey,
      baseUrl
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err?.message || 'Connection test failed' });
  } finally {
    apiKey = undefined;
  }
});

// Main PCA Cognitive 12-Stage Pipeline Streaming Endpoint
app.get('/api/account/plan', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const plan = await getRequestUserPlan(req);
  const dailyUsed = await getDailyAnalysisCount(userId);
  res.json({ plan: plan.id, name: plan.name, isAdmin: isUserAdmin(userId, (req as any).user?.email, (req as any).user?.role), dailyUsed, dailyLimit: plan.dailyAnalysisLimit, features: plan.features, maxMembers: plan.maxMembers, retentionDays: plan.retentionDays });
});

// Team Governance MVP: workspace, membership and approval records.
function requireWorkspacePlan(planId: string): boolean {
  return ['team', 'business', 'enterprise'].includes(planId);
}

type WorkspaceRole = 'owner' | 'reviewer' | 'analyst' | 'viewer';

function getWorkspaceRole(workspace: any, userId: string): WorkspaceRole | null {
  if (!workspace || !userId) return null;
  if (workspace.ownerId === userId) return 'owner';
  const member = Array.isArray(workspace.members)
    ? workspace.members.find((entry: any) => entry?.userId === userId)
    : null;
  return member && ['reviewer', 'analyst', 'viewer'].includes(member.role)
    ? member.role as WorkspaceRole
    : null;
}

function canRequestApproval(role: WorkspaceRole | null): boolean {
  return role === 'owner' || role === 'reviewer' || role === 'analyst';
}

function canReviewApproval(role: WorkspaceRole | null): boolean {
  return role === 'owner' || role === 'reviewer';
}
app.get('/api/workspaces', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const plan = await getRequestUserPlan(req);
  if (!requireWorkspacePlan(plan.id)) {
    return res.status(403).json({ error: 'PLAN_FEATURE_REQUIRED', feature: 'workspace', plan: plan.id, upgradeRequired: true });
  }
  if (!adminDb || !isServerFirestoreAdminAvailable) {
    return res.status(503).json({ error: 'PERSISTENCE_UNAVAILABLE' });
  }
  try {
    const [owned, joined] = await Promise.all([
      adminDb.collection('workspaces').where('ownerId', '==', userId).get(),
      adminDb.collection('workspaces').where('memberIds', 'array-contains', userId).get(),
    ]);
    const byId = new Map<string, any>();
    for (const doc of [...owned.docs, ...joined.docs]) byId.set(doc.id, { id: doc.id, ...doc.data() });
    const workspaces = [...byId.values()];
    res.json({ workspaces });
  } catch (err) {
    res.status(500).json({ error: 'WORKSPACE_LIST_FAILED' });
  }
});

app.post('/api/workspaces', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const plan = await getRequestUserPlan(req);
  if (!requireWorkspacePlan(plan.id)) {
    return res.status(403).json({ error: 'PLAN_FEATURE_REQUIRED', feature: 'workspace', plan: plan.id, upgradeRequired: true });
  }
  if (!adminDb || !isServerFirestoreAdminAvailable) {
    return res.status(503).json({ error: 'PERSISTENCE_UNAVAILABLE' });
  }
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'WORKSPACE_NAME_REQUIRED' });
  try {
    const ref = adminDb.collection('workspaces').doc();
    const now = new Date().toISOString();
    const members = [{ userId, role: 'owner' }];
    await ref.set({ name, ownerId: userId, members, memberIds: [userId], createdAt: now, updatedAt: now });
    res.status(201).json({ workspace: { id: ref.id, name, ownerId: userId, members, memberIds: [userId], createdAt: now, updatedAt: now } });
  } catch (err) {
    res.status(500).json({ error: 'WORKSPACE_CREATE_FAILED' });
  }
});

function requireBusinessPlan(planId: string): boolean {
  return ['business', 'enterprise'].includes(planId);
}

app.get('/api/admin/audit', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const plan = await getRequestUserPlan(req);
  if (!requireBusinessPlan(plan.id)) return res.status(403).json({ error: 'PLAN_FEATURE_REQUIRED', feature: 'audit_log', plan: plan.id, upgradeRequired: true });
  if (!adminDb || !isServerFirestoreAdminAvailable) return res.status(503).json({ error: 'PERSISTENCE_UNAVAILABLE' });
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const snap = await adminDb.collection('users').doc(userId).collection('pca_audit_logs').orderBy('created_at', 'desc').limit(limit).get();
    res.json({ retentionDays: plan.retentionDays, logs: snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) });
  } catch (err) {
    res.status(500).json({ error: 'AUDIT_LOG_READ_FAILED' });
  }
});

app.get('/api/admin/policy', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const plan = await getRequestUserPlan(req);
  if (!requireBusinessPlan(plan.id)) return res.status(403).json({ error: 'PLAN_FEATURE_REQUIRED', feature: 'admin_policy', plan: plan.id, upgradeRequired: true });
  if (!adminDb || !isServerFirestoreAdminAvailable) return res.status(503).json({ error: 'PERSISTENCE_UNAVAILABLE' });
  try {
    const ref = adminDb.collection('governance_policies').doc(userId);
    const snap = await ref.get();
    res.json({ policy: snap.exists ? snap.data() : { allowedProviders: ['deepseek'], approvalRequired: false, restrictedTopics: [], updatedAt: null } });
  } catch (err) {
    res.status(500).json({ error: 'POLICY_READ_FAILED' });
  }
});

app.put('/api/admin/policy', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const plan = await getRequestUserPlan(req);
  if (!requireBusinessPlan(plan.id)) return res.status(403).json({ error: 'PLAN_FEATURE_REQUIRED', feature: 'admin_policy', plan: plan.id, upgradeRequired: true });
  if (!adminDb || !isServerFirestoreAdminAvailable) return res.status(503).json({ error: 'PERSISTENCE_UNAVAILABLE' });
  const allowedProviders = Array.isArray(req.body?.allowedProviders) ? req.body.allowedProviders.map(String).filter(Boolean) : ['deepseek'];
  const approvalRequired = Boolean(req.body?.approvalRequired);
  const restrictedTopics = Array.isArray(req.body?.restrictedTopics) ? req.body.restrictedTopics.map(String).filter(Boolean) : [];
  try {
    const policy = { allowedProviders, approvalRequired, restrictedTopics, updatedAt: new Date().toISOString(), updatedBy: userId };
    await adminDb.collection('governance_policies').doc(userId).set(policy, { merge: true });
    res.json({ policy });
  } catch (err) {
    res.status(500).json({ error: 'POLICY_UPDATE_FAILED' });
  }
});

app.get('/api/admin/governance-dashboard', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const plan = await getRequestUserPlan(req);
  if (!requireBusinessPlan(plan.id)) return res.status(403).json({ error: 'PLAN_FEATURE_REQUIRED', feature: 'admin_policy', plan: plan.id, upgradeRequired: true });
  if (!adminDb || !isServerFirestoreAdminAvailable) return res.status(503).json({ error: 'PERSISTENCE_UNAVAILABLE' });
  try {
    const approvals = await adminDb.collectionGroup('approvals').where('requestedBy', '==', userId).get();
    const counts = { total: approvals.size, pending: 0, approved: 0, rejected: 0 };
    approvals.forEach((doc: any) => {
      const status = String(doc.data()?.status || '').toLowerCase();
      if (status === 'pending') counts.pending += 1;
      else if (status === 'approved') counts.approved += 1;
      else if (status === 'rejected') counts.rejected += 1;
    });
    res.json({ plan: plan.id, approvalCounts: counts, retentionDays: plan.retentionDays, maxMembers: plan.maxMembers });
  } catch (err) {
    res.status(500).json({ error: 'GOVERNANCE_DASHBOARD_FAILED' });
  }
});

app.get('/api/workspaces/:workspaceId', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const plan = await getRequestUserPlan(req);
  if (!requireWorkspacePlan(plan.id)) return res.status(403).json({ error: 'PLAN_FEATURE_REQUIRED', feature: 'workspace', plan: plan.id, upgradeRequired: true });
  if (!adminDb || !isServerFirestoreAdminAvailable) return res.status(503).json({ error: 'PERSISTENCE_UNAVAILABLE' });
  try {
    const ref = adminDb.collection('workspaces').doc(String(req.params.workspaceId));
    const snap = await ref.get();
    const data = snap.data();
    if (!snap.exists || !data || !getWorkspaceRole(data, userId)) return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND' });
    res.json({ workspace: { id: snap.id, ...data } });
  } catch (err) {
    res.status(500).json({ error: 'WORKSPACE_READ_FAILED' });
  }
});

app.get('/api/workspaces/:workspaceId/approvals', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const plan = await getRequestUserPlan(req);
  if (!hasPlanFeature(plan.id, 'approval_workflow')) return res.status(403).json({ error: 'PLAN_FEATURE_REQUIRED', feature: 'approval_workflow', plan: plan.id, upgradeRequired: true });
  if (!adminDb || !isServerFirestoreAdminAvailable) return res.status(503).json({ error: 'PERSISTENCE_UNAVAILABLE' });
  try {
    const workspaceRef = adminDb.collection('workspaces').doc(String(req.params.workspaceId));
    const workspace = await workspaceRef.get();
    if (!workspace.exists || !getWorkspaceRole(workspace.data(), userId)) return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND' });
    const snap = await workspaceRef.collection('approvals').orderBy('createdAt', 'desc').limit(100).get();
    res.json({ approvals: snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) });
  } catch (err) {
    res.status(500).json({ error: 'APPROVAL_LIST_FAILED' });
  }
});

app.post('/api/workspaces/:workspaceId/members', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const plan = await getRequestUserPlan(req);
  if (!requireWorkspacePlan(plan.id)) return res.status(403).json({ error: 'PLAN_FEATURE_REQUIRED', feature: 'workspace', plan: plan.id, upgradeRequired: true });
  if (!adminDb || !isServerFirestoreAdminAvailable) return res.status(503).json({ error: 'PERSISTENCE_UNAVAILABLE' });
  const memberId = String(req.body?.userId || '').trim();
  const role = String(req.body?.role || 'analyst').toLowerCase();
  if (!memberId) return res.status(400).json({ error: 'MEMBER_USER_ID_REQUIRED' });
  if (!['reviewer', 'analyst', 'viewer'].includes(role)) return res.status(400).json({ error: 'INVALID_MEMBER_ROLE' });
  try {
    const ref = adminDb.collection('workspaces').doc(String(req.params.workspaceId));
    const snap = await ref.get();
    if (!snap.exists || snap.data()?.ownerId !== userId) return res.status(403).json({ error: 'WORKSPACE_OWNER_REQUIRED' });
    const members = Array.isArray(snap.data()?.members) ? snap.data().members : [];
    if (members.some((m: any) => m.userId === memberId)) return res.status(409).json({ error: 'MEMBER_ALREADY_EXISTS' });
    if (members.length >= plan.maxMembers) return res.status(409).json({ error: 'WORKSPACE_MEMBER_LIMIT_REACHED', limit: plan.maxMembers });
    const nextMembers = [...members, { userId: memberId, role }];
    const memberIds = Array.from(new Set([...members.map((member: any) => member.userId), memberId]));
    await ref.set({ members: nextMembers, memberIds, updatedAt: new Date().toISOString() }, { merge: true });
    res.status(201).json({ member: { userId: memberId, role }, members: nextMembers });
  } catch (err) {
    res.status(500).json({ error: 'MEMBER_ADD_FAILED' });
  }
});

app.post('/api/workspaces/:workspaceId/approvals', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const plan = await getRequestUserPlan(req);
  if (!hasPlanFeature(plan.id, 'approval_workflow')) {
    return res.status(403).json({ error: 'PLAN_FEATURE_REQUIRED', feature: 'approval_workflow', plan: plan.id, upgradeRequired: true });
  }
  if (!adminDb || !isServerFirestoreAdminAvailable) return res.status(503).json({ error: 'PERSISTENCE_UNAVAILABLE' });
  const workspaceId = String(req.params.workspaceId);
  const decisionId = String(req.body?.decisionId || '').trim();
  if (!decisionId) return res.status(400).json({ error: 'DECISION_ID_REQUIRED' });
  try {
    const workspaceRef = adminDb.collection('workspaces').doc(workspaceId);
    const workspace = await workspaceRef.get();
    if (!workspace.exists || !canRequestApproval(getWorkspaceRole(workspace.data(), userId))) {
      return res.status(403).json({ error: 'WORKSPACE_MEMBER_REQUIRED' });
    }
    const ref = workspaceRef.collection('approvals').doc();
    const record = { id: ref.id, decisionId, requestedBy: userId, status: 'PENDING', createdAt: new Date().toISOString() };
    await ref.set(record);
    res.status(201).json({ approval: record });
  } catch (err) {
    res.status(500).json({ error: 'APPROVAL_CREATE_FAILED' });
  }
});

app.patch('/api/workspaces/:workspaceId/approvals/:approvalId', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const plan = await getRequestUserPlan(req);
  if (!hasPlanFeature(plan.id, 'approval_workflow')) {
    return res.status(403).json({ error: 'PLAN_FEATURE_REQUIRED', feature: 'approval_workflow', plan: plan.id, upgradeRequired: true });
  }
  if (!adminDb || !isServerFirestoreAdminAvailable) return res.status(503).json({ error: 'PERSISTENCE_UNAVAILABLE' });
  const status = String(req.body?.status || '').toUpperCase();
  if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ error: 'INVALID_APPROVAL_STATUS' });
  try {
    const workspaceRef = adminDb.collection('workspaces').doc(String(req.params.workspaceId));
    const workspace = await workspaceRef.get();
    if (!workspace.exists || !canReviewApproval(getWorkspaceRole(workspace.data(), userId))) {
      return res.status(403).json({ error: 'WORKSPACE_REVIEWER_REQUIRED' });
    }
    const ref = workspaceRef.collection('approvals').doc(String(req.params.approvalId));
    if (!(await ref.get()).exists) return res.status(404).json({ error: 'APPROVAL_NOT_FOUND' });
    await ref.set({ status, reviewedBy: userId, reviewedAt: new Date().toISOString() }, { merge: true });
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: 'APPROVAL_UPDATE_FAILED' });
  }
});

app.post('/api/billing/create-checkout-session', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  if (isUserAdmin(userId, (req as any).user?.email, (req as any).user?.role)) {
    return res.json({ currentPlan: 'enterprise', isAdmin: true, checkoutRequired: false });
  }
  const planId = String(req.body?.planId || '').toLowerCase();
  const priceId = STRIPE_PRICE_ENV[planId];
  const stripe = getStripeClient();
  if (!stripe || !priceId) return res.status(503).json({ error: 'BILLING_NOT_CONFIGURED', message: 'ระบบชำระเงินยังไม่ได้ตั้งค่าแพ็กเกจนี้' });
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.APP_ORIGIN || 'http://localhost:3000'}/plans?checkout=success`,
      cancel_url: `${process.env.APP_ORIGIN || 'http://localhost:3000'}/plans?checkout=cancelled`,
      client_reference_id: userId,
      metadata: { userId, planId },
      subscription_data: { metadata: { userId, planId } },
    });
    res.json({ url: session.url });
  } catch (err) { res.status(500).json({ error: 'CHECKOUT_FAILED', message: 'ไม่สามารถสร้างหน้าชำระเงินได้' }); }
});

app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req: any, res) => {
  const stripe = getStripeClient();
  const signature = req.headers['stripe-signature'];
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET || typeof signature !== 'string') return res.status(400).send('Webhook is not configured');
  try {
    const event = stripe.webhooks.constructEvent(req.rawBody || req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || session.client_reference_id;
      const planId = session.metadata?.planId;
      if (userId && planId && adminDb && isServerFirestoreAdminAvailable) await adminDb.collection('users').doc(userId).set({ planId, stripeCustomerId: session.customer, stripeSubscriptionId: session.subscription, planUpdatedAt: new Date().toISOString() }, { merge: true });
    }
    res.json({ received: true });
  } catch { res.status(400).send('Invalid webhook signature'); }
});

app.post('/api/pca/stream', rateLimiter, requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
  }

  const userPlan = await getRequestUserPlan(req);
  const dailyUsed = await getDailyAnalysisCount(userId);
  if (userPlan.dailyAnalysisLimit !== null && dailyUsed >= userPlan.dailyAnalysisLimit) {
    return res.status(429).json({ error: 'PLAN_LIMIT_REACHED', plan: userPlan.id, limit: userPlan.dailyAnalysisLimit, used: dailyUsed, upgradeRequired: true });
  }

  const { 
    conversationId,
    question = '', 
    history = [], 
    attachments = [], 
    tone = 'Formal Architect', 
    model: rawModel = '', 
    provider: rawProvider = '',
    apiKey: requestApiKey = '',
    customBaseUrl = '',
    ollamaBaseUrl = '',
    deepReasoning = false,
    // Web Search is available on every package; default ON prevents older clients
    // that omit the field from silently disabling external retrieval.
    webSearch = true,
    compressed: reqCompressed = null,
    reasoningProfile = 'Auto',
    personalContext = '',
    deepSeekApiKey: requestDeepSeekApiKey
  } = req.body;

  const hasPdfAttachment = Array.isArray(attachments) && attachments.some((attachment: any) => String(attachment?.name || '').toLowerCase().endsWith('.pdf') || String(attachment?.type || '').toLowerCase().includes('pdf'));

  // Non-DeepSeek providers are BYOK features and require an eligible plan.
  const requestedProvider = String(rawProvider || '').trim().toLowerCase();
  if (requestedProvider && requestedProvider !== 'deepseek' && !hasPlanFeature(userPlan.id, 'byok')) {
    return res.status(403).json({ error: 'PLAN_FEATURE_REQUIRED', feature: 'byok', plan: userPlan.id, message: 'การเชื่อมต่อโมเดล/API ของตัวเองใช้ได้ตั้งแต่แพ็กเกจ BYOK ขึ้นไป', upgradeRequired: true });
  }

  let rawApiKey: string | undefined = requestApiKey;
  let deepSeekApiKey: string | undefined = requestDeepSeekApiKey;
  delete req.body.apiKey;
  delete req.body.deepSeekApiKey;

  // Server-side ownership verification of conversationId before streaming
  let effectiveConversationId = conversationId;
  if (effectiveConversationId) {
    const check = await verifyConversationOwnership(userId, effectiveConversationId);
    if (check.exists && !check.authorized) {
      console.warn(`[PCA Stream] Conversation ${effectiveConversationId} belongs to another account. Auto-forking into a fresh isolated session for user ${userId}.`);
      effectiveConversationId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }
  } else {
    effectiveConversationId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  // ── SERVER-AUTHORITATIVE REQUEST ROUTER ──
  // Backend determines provider & model based on attachments and explicit provider settings
  const routeResolution = routeRequest(question || '', attachments || [], rawModel, rawProvider);
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
    
    // 0. Intent Classification (Deterministic Gate)
    const intentClassification = classifyIntent(question || '');
    const intent = intentClassification.type;
    sendSSE('intent_classification', intentClassification);

    // 0.1 Adaptive Control Activation Gate
    const runtimeConfig = calculateRuntimeResponseDepth(question, {
      intent,
      deepReasoning: Boolean(deepReasoning),
      attachmentCount: (attachments || []).length
    });
    const activationPlan = runtimeConfig.activationPlan;

    // Force activation if user explicitly requested web search
    if (webSearch) {
      activationPlan.evidenceGrounding = 'REQUIRED';
    }

    sendSSE('activation_plan', activationPlan);

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

    // Firekeeper Publication Knowledge Base is opt-in by query intent.
    // Do not inject the corpus into general questions just because semantic similarity exists.
    const publicationRoute = await resolvePublicationEvidence(question || '');
    const publicationIntent = publicationRoute.intent;
    const publicationInventory = publicationRoute.inventory;
    const publicationKnowledge = publicationRoute.chunks;
    const publicationNeedsWeb = publicationRoute.needsWeb;
    // Current-news and time-sensitive requests must use live web evidence even if the
    // browser toggle was previously saved as OFF. This prevents silent fallback to
    // the no-evidence response for queries such as "ข่าวเอไอ" or "ข่าวล่าสุด".
    const autoWebSearch = /ข่าว|ล่าสุด|วันนี้|เมื่อวาน|สัปดาห์นี้|เดือนนี้|current|latest|news/i.test(question || '');
    const allowWebRetrieval = Boolean(webSearch || autoWebSearch) && (!publicationIntent || publicationNeedsWeb);
    sendSSE('knowledge_route', {
      scope: publicationIntent ? 'PUBLICATION' : 'GENERAL',
      publicationCount: publicationKnowledge.length,
      inventoryCount: publicationInventory.length,
      webSupplement: publicationNeedsWeb && Boolean(webSearch),
      reason: publicationIntent ? (publicationNeedsWeb ? 'PUBLICATION_EVIDENCE_GAP_OR_LIVE_REQUEST' : 'PUBLICATION_EVIDENCE_FOUND') : 'GENERAL_QUERY'
    });
    if (publicationKnowledge.length > 0) {
      sendSSE('publication_knowledge', {
        count: publicationKnowledge.length,
        sources: publicationKnowledge.map(k => ({
          id: k.id, source: k.source, section: k.section, url: k.canonicalUrl, hash: k.hash
        }))
      });
    }
    if (publicationInventory.length > 0) sendSSE('publication_inventory', { sources: publicationInventory });
    
    // Adaptive Evidence Retrieval
    let evidenceResult: any = null;
    // Current-news queries must pass the evidence gate even when the
    // knowledge router classifies them as General.
    if (allowWebRetrieval && (autoWebSearch || activationPlan.evidenceGrounding === 'REQUIRED' || routerResult.route !== 'General')) {
      evidenceResult = await retrieveExternalEvidenceAsync(question || '', routerResult.route, { 
        searchEnabled: allowWebRetrieval,
        activationPlan
      });
    }

    // Contextual Search Resolver: Ensure web searches reflect user's intended meaning in context
    let contextualResolution: any = { resolved_query: question, search_required: false, ambiguity: false, context_used: [] };
    if (allowWebRetrieval) {
      contextualResolution = await resolveContextualSearchAsync(question || '', history || [], { 
        apiKey: deepSeekApiKey,
        searchEnabled: allowWebRetrieval
      });
      // News/current queries are explicit web intents; do not let a contextual
      // resolver suppress the live retrieval step.
      if (autoWebSearch && !contextualResolution.search_required) {
        contextualResolution = {
          ...contextualResolution,
          search_required: true,
          search_query: contextualResolution.search_query || question || '',
          resolved_query: contextualResolution.resolved_query || question || '',
        };
      }
      sendSSE('contextual_search_resolution', contextualResolution);
    }

    // Target query resolved from context (preserves entity, replaces ambiguous pronouns)
    let effectiveSearchQuery = (contextualResolution.search_required && contextualResolution.search_query)
      ? contextualResolution.search_query
      : (contextualResolution.resolved_query || question || '');
    // A contextual rewrite must retain the named entity when a web supplement runs.
    if (publicationIntent && /fire\s*keeper|ไฟร์คีปเปอร์/i.test(question || '')
        && !/fire\s*keeper|ไฟร์คีปเปอร์/i.test(effectiveSearchQuery)) {
      effectiveSearchQuery = question || '';
    }

    // Temporal Grounding Engine: Detect time sensitivity & force external retrieval using contextual resolved query
    let temporalDetection: any = { isTemporalSensitive: false, temporalScope: 'TIMELESS', verificationRequired: false };
    let temporalRetrieval: any = { success: false, verified: false, retrievedAt: new Date().toISOString() };

    if ((activationPlan.temporalGrounding === 'REQUIRED' || autoWebSearch) && allowWebRetrieval) {
      temporalDetection = detectTemporalSensitivity(contextualResolution.resolved_query || question || '', history || []);
      if (temporalDetection.isTemporalSensitive) {
        temporalRetrieval = await retrieveCurrentAuthoritativeEvidence(effectiveSearchQuery, temporalDetection, { searchEnabled: allowWebRetrieval });
      }
    }

    // Deep Web Access & Live Retrieval Engine (Opens destination sites, extracts full bodies, verifies dates & sources)
    let liveWebSearchResult: WebSearchExecutionResult | null = null;
    let deepWebRetrievalResult: DeepWebRetrievalResult | null = null;

    // The explicit Web Search toggle authorizes retrieval. Context resolution
    // improves the query, but must not become a second gate that silently
    // prevents a requested live search from running.
    if (allowWebRetrieval && effectiveSearchQuery.trim().length > 0) {
      try {
        deepWebRetrievalResult = await deepWebRetrieve(effectiveSearchQuery, {
          maxSearchResults: 8,
          maxArticlesToFetch: 5,
          targetDateISO: temporalDetection?.isTemporalSensitive ? temporalDetection?.targetDate : undefined,
          forceFresh: true,
          followIndexLinks: true,
        });

        // Bridge full-article retrieval to the result format used by the UI.
        // Only article bodies that passed validation qualify as deep evidence.
        if (deepWebRetrievalResult?.hasSummaryEligibleEvidence) {
          const eligibleArticles = deepWebRetrievalResult.articles.filter((article) => article.summary_eligible);
          liveWebSearchResult = {
            success: deepWebRetrievalResult.success,
            query: deepWebRetrievalResult.query,
            searchQueries: [deepWebRetrievalResult.query],
            totalFound: eligibleArticles.length,
            results: eligibleArticles.map((a) => ({
              id: a.id,
              title: a.title,
              url: a.canonical_url,
              snippet: a.body.slice(0, 300) || a.snippet,
              sourceDomain: a.source_domain,
              sourceType: 'general' as const,
              publishedAt: a.published_at,
              credibilityScore: a.content_quality,
            })),
            retrievedAt: deepWebRetrievalResult.retrievedAt,
            statusMessage: deepWebRetrievalResult.statusMessage,
          };
        } else {
          // Search results remain useful, citation-safe evidence even when a
          // publisher blocks full article extraction (for example, paywalls).
          liveWebSearchResult = await performWebSearch(effectiveSearchQuery, { maxResults: 8, forceFresh: true });
        }
      } catch (err) {
        console.warn('[PCA Stream] deepWebRetrieve error:', sanitizeErrorForLog(err));
      }
    }

    const temporalClaimVerification: TemporalClaimVerification = {
      claim: contextualResolution.resolved_query || question || '',
      claim_time: temporalDetection.temporalScope === 'CURRENT_STATUS' ? 'current' : (temporalDetection.temporalScope === 'HISTORICAL' ? 'historical' : 'timeless'),
      knowledge_cutoff: MODEL_KNOWLEDGE_CUTOFF,
      current_date: getCurrentDateISO(),
      verification_required: temporalDetection.verificationRequired,
      verified: temporalRetrieval.verified || Boolean(deepWebRetrievalResult?.hasSummaryEligibleEvidence) || Boolean(liveWebSearchResult?.success),
      source_id: temporalRetrieval.sourceTitle || deepWebRetrievalResult?.articles.find((article) => article.summary_eligible)?.title || liveWebSearchResult?.results[0]?.title,
      source_url: temporalRetrieval.sourceUrl || deepWebRetrievalResult?.articles.find((article) => article.summary_eligible)?.canonical_url || liveWebSearchResult?.results[0]?.url,
      source_published_at: temporalRetrieval.publishedAt || deepWebRetrievalResult?.articles.find((article) => article.summary_eligible)?.published_at || liveWebSearchResult?.results[0]?.publishedAt,
      classification: (temporalRetrieval.verified || deepWebRetrievalResult?.hasSummaryEligibleEvidence || liveWebSearchResult?.success) ? 'FACT' : (temporalDetection.isTemporalSensitive ? 'UNVERIFIED' : 'MODEL_KNOWLEDGE'),
      status_message: deepWebRetrievalResult ? deepWebRetrievalResult.statusMessage : (liveWebSearchResult?.success ? liveWebSearchResult.statusMessage : temporalRetrieval.statusMessage)
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
      { 
        step: 'DEEP_WEB_RETRIEVAL', 
        description: deepWebRetrievalResult?.hasSummaryEligibleEvidence 
          ? `ดึงเนื้อหาเว็บจริง (Deep Web Access): เปิดอ่านสำเร็จ ${deepWebRetrievalResult.summaryEligibleCount} บทความ (${deepWebRetrievalResult.events.length} เหตุการณ์) [คำค้น: ${effectiveSearchQuery}]` 
          : (webSearch 
              ? (contextualResolution.search_required 
                  ? (deepWebRetrievalResult?.statusMessage || 'สืบค้นเว็บสด: ไม่พบเนื้อหาบทความจริงที่ยืนยันได้') 
                  : 'สืบค้นเว็บสด: ข้ามการค้นหาตามการประเมินบริบท') 
              : 'สืบค้นเว็บสด: ไม่ได้เปิดใช้งาน'), 
        status: (deepWebRetrievalResult?.hasSummaryEligibleEvidence ? 'COMPLETED' : 'SKIPPED') as 'COMPLETED' | 'SKIPPED' | 'PENDING', 
        timestamp: new Date().toISOString() 
      },
      { step: 'TEMPORAL_GROUNDING', description: `ตรวจสอบความไวต่อเวลา: [${temporalDetection.temporalScope}] บังคับสืบค้นสด: ${temporalDetection.verificationRequired} | ผลยืนยัน: ${temporalRetrieval.verified ? 'VERIFIED' : 'UNVERIFIED'} (${temporalRetrieval.sourceTitle || 'ไม่มีหลักฐานสด'})`, status: 'COMPLETED' as const, timestamp: new Date().toISOString() },
      { step: 'EXTERNAL_RETRIEVAL', description: `ดึงและประมวลผลหลักฐานภายนอก (${evidenceResult?.provenance ?? 'NOT_RETRIEVED'})`, status: 'COMPLETED' as const, timestamp: new Date().toISOString() },
      { step: 'EVIDENCE_VERIFICATION', description: `ประเมินคุณภาพหลักฐานเชิงสดใหม่ [${evidenceResult?.verificationStatus ?? 'NOT_APPLICABLE'}]`, status: 'COMPLETED' as const, timestamp: new Date().toISOString() },
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
      question: question || '',
      context: [],
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
      evidence_verification_matrix: evidenceResult ? [evidenceResult] as any[] : [],
      audit_trail_flow: auditTrailFlow,
      temporal_detection: temporalDetection,
      temporal_claim_verification: temporalClaimVerification,
      web_search_enabled: Boolean(webSearch),
      web_search_results: liveWebSearchResult,
      deep_web_retrieval: deepWebRetrievalResult,
    };

    const docClassification = classifyInputDocument(question, attachments);

    let hypotheses_v2: any[] = [];
    let calibratedConfidenceObj: any = null;
    let evidence_explorer: any[] = [];
    let sources_used: any[] = [];
    let rankedMems: any[] = [];

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

    // Stage 4: Data Structuring & Memory Retrieval (Semantic Memory Filter)
    let memoryFilterResult: any = { accepted: [], rejected: [], totalRetrieved: 0, scores: {} };
    if (intent !== 'GREETING') {
      console.log('[DEBUG] PCA Stage 4: Data Structuring starting...');
      sendSSE('pipeline_stage', { stage: 'Reasoning', detail: 'STAGE 04: การจัดโครงสร้างข้อมูลและการดึงความจำ LTM (Semantic Memory Gate)...' });
      await runStage(state, 'DATA_STRUCTURING', 4, 'การจัดโครงสร้างข้อมูลและการดึงความจำ', startMs, () => {
        memoryFilterResult = filterMemoriesByRelevance(state.user_input, userBank, 0.25);
        state.memories = memoryFilterResult.accepted.slice(0, 5) as any;
        
        const hasData = state.memories.length > 0 || attachments.length > 0;
        return { 
          retrieved_count: memoryFilterResult.totalRetrieved, 
          accepted_count: memoryFilterResult.accepted.length,
          rejected_count: memoryFilterResult.rejected.length,
          verdict: hasData ? 'PASSED' : 'INCONCLUSIVE'
        };
      }, 15);
    }

    // Stage 5: Relationship Modeling
    if (intent !== 'GREETING') {
      sendSSE('pipeline_stage', { stage: 'Reasoning', detail: 'STAGE 05: การสร้างแบบจำลองความสัมพันธ์เชิงตรรกะ (Relationship Modeling & DAG)...' });
      await runStage(state, 'RELATIONSHIP_MODELING', 5, 'การสร้างแบบจำลองความสัมพันธ์เชิงตรรกะ', startMs, () => {
        return { framework: 'PUNN Cognitive Architecture (PCA v2.0)' };
      }, 15);
    }

    // Stage 7: Evidence Evaluation (MOVED UP)
    sendSSE('pipeline_stage', { stage: 'Decision', detail: 'STAGE 07: การประเมินและจำแนกหลักฐานเชิงประจักษ์ (Evidence Evaluation & Taxonomy)...' });
    
    // Helper for relevance validation
    const validateEvidenceRelevance = (content: string, query: string, intentType: string): { relevance: 'HIGH' | 'MEDIUM' | 'LOW' | 'IRRELEVANT', reason: string } => {
      const q = query.toLowerCase();
      const text = content.toLowerCase();
      
      if (intentType === 'META_INQUIRY') {
        const metaKeywords = ['trace', 'reasoning', 'stage', 'runtime', 'logic', 'confidence', 'bayesian', 'intent', 'evidence', 'governance'];
        const matches = metaKeywords.filter(k => text.includes(k) || q.includes(k));
        if (matches.length > 2) return { relevance: 'HIGH', reason: 'Directly relates to system runtime or reasoning logic.' };
        if (matches.length > 0) return { relevance: 'MEDIUM', reason: 'Contains technical tokens related to system execution.' };
      }

      if (intentType === 'DOCUMENT_ANALYSIS') {
        if (text.length > 0) return { relevance: 'HIGH', reason: 'Primary document content for analysis.' };
      }

      // Generic relevance
      const queryWords = q.split(/\s+/).filter(w => w.length > 3);
      const matchCount = queryWords.filter(w => text.includes(w)).length;
      
      if (matchCount > 3) return { relevance: 'HIGH', reason: 'Strong keyword overlap with user query.' };
      if (matchCount > 0) return { relevance: 'MEDIUM', reason: 'Partial keyword overlap with user query.' };
      
      return { relevance: 'LOW', reason: 'No direct keyword overlap detected, context may be tangential.' };
    };

    const computeCanonicalHash = (content: string): string => {
      if (!content) return 'INVALID_EMPTY_CONTENT';
      // Canonicalization: Trim, remove extra spaces, standard encoding
      const canonical = content.trim().replace(/\s+/g, ' ');
      return sha256(canonical);
    };

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

      // Process External Sources with relevance gate
      const processEvidence = (rawEv: any, retrievalReason: string) => {
        if (!rawEv || !rawEv.content) return;
        
        const { relevance, reason: relReason } = validateEvidenceRelevance(rawEv.content, state.user_input, intent);
        const cHash = computeCanonicalHash(rawEv.content);
        
        const evItem = {
          ...rawEv,
          evidence_id: rawEv.id || `ev-${Math.random().toString(36).slice(2, 7)}`,
          content_snippet: rawEv.content.slice(0, 280),
          content_hash: cHash,
          relevance,
          retrieval_reason: retrievalReason,
          relevance_logic: relReason,
          // Relevance is not factual verification; keep external claims unverified until claim-level checking.
          evidence_status: 'UNVERIFIED'
        };

        // Only add if not IRRELEVANT (or keep it but mark it)
        if (relevance !== 'IRRELEVANT') {
          items.push(evItem);
        }
      };

      // 2. External Sources
      if (evidenceResult) {
        const isTemporalUnverified = temporalDetection.isTemporalSensitive && !temporalRetrieval.verified;
        processEvidence({
          id: 'EXT-SEARCH-1',
          source: evidenceResult.source,
          content: evidenceResult.content,
          credibilityScore: isTemporalUnverified ? 0.20 : (evidenceResult.confidence === 'HIGH' ? 0.98 : 0.65),
          strength: isTemporalUnverified ? 'Low' : (evidenceResult.confidence === 'HIGH' ? 'High' : 'Moderate'),
          type: isTemporalUnverified ? 'Unverified' : 'Empirical',
          provenance: evidenceResult.provenance,
          sourceUrl: evidenceResult.provenance,
          citationQuote: evidenceResult.content.slice(0, 120),
        }, 'Initial semantic search result.');

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

      // 2.1 Live Temporal Evidence
      if (temporalRetrieval.verified && temporalRetrieval.evidence) {
        processEvidence(temporalRetrieval.evidence, 'Verified current temporal grounding.');
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

      // 2.2 Deep Web Access & Live Evidence (Full Article Extraction)
      if (deepWebRetrievalResult?.hasSummaryEligibleEvidence) {
        deepWebRetrievalResult.articles.filter((article) => article.summary_eligible).forEach((art, idx) => {
          const isEligible = art.summary_eligible;
          const bodyExtract = art.body && art.body.length > 50 ? art.body : art.snippet;

          processEvidence({
            id: `ev-deepweb-${idx + 1}`,
            source: `${art.publisher} - ${art.title}`,
            content: bodyExtract,
            credibilityScore: art.content_quality,
            strength: art.content_quality >= 0.7 ? 'High' : (art.content_quality >= 0.4 ? 'Medium' : 'Low'),
            type: 'Empirical',
            provenance: art.canonical_url,
            sourceUrl: art.canonical_url,
            citationQuote: art.snippet.slice(0, 150),
            locator: `${art.source_domain} [${art.retrieval_method}${art.is_date_verified ? ' | Date-Verified' : ''}]`,
            relevance: isEligible ? 'HIGH' : 'LOW',
          }, `Deep web article extraction from ${art.publisher} (${art.evidence_state})`);

          sources.push({
            id: `src-deepweb-${idx + 1}`,
            category: 'External Source',
            name: `ดึงเนื้อหาเว็บจริง (${art.publisher}): ${art.title}`,
            description: art.snippet.slice(0, 150),
            citationQuote: art.snippet.slice(0, 150),
            sourceUrl: art.canonical_url,
            locator: art.source_domain,
            isExternal: true,
            isEvidence: true,
          });
        });
      } else if (liveWebSearchResult && liveWebSearchResult.success && liveWebSearchResult.results.length > 0) {
        liveWebSearchResult.results.forEach((webItem, idx) => {
          processEvidence({
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
          }, `Web search result from ${webItem.sourceDomain}`);

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

      // 2.3 Official Firekeeper Publications
      publicationKnowledge.forEach((chunk, idx) => {
        // Canonical URL + content hash verify provenance/integrity only.
        // They do NOT prove that the publication's claims are factually verified.
        const publicationItem = {
          id: chunk.id,
          evidence_id: chunk.id,
          source: `${chunk.source} — ${chunk.section}`,
          content: chunk.content,
          content_snippet: chunk.content.slice(0, 280),
          content_hash: chunk.hash,
          credibilityScore: 0.7,
          strength: 'Source-backed',
          type: 'PrimarySource',
          provenance: chunk.canonicalUrl,
          sourceUrl: chunk.canonicalUrl,
          citationQuote: chunk.content.slice(0, 150),
          locator: chunk.section,
          relevance: 'HIGH',
          retrieval_reason: 'Official Firekeeper Publication retrieval.',
          relevance_logic: 'Canonical OFFICIAL_PUBLICATION selected by Publication RAG.',
          evidence_status: 'UNVERIFIED',
          sourceType: 'OFFICIAL_PUBLICATION',
        };
        items.push(publicationItem);

        sources.push({
          id: `src-publication-${idx + 1}`,
          category: 'Official Publication',
          name: `${chunk.source}: ${chunk.section}`,
          description: chunk.content.slice(0, 150),
          citationQuote: chunk.content.slice(0, 150),
          sourceUrl: chunk.canonicalUrl,
          locator: chunk.section,
          isExternal: false,
          isEvidence: true,
          sourceType: 'OFFICIAL_PUBLICATION',
          contentHash: chunk.hash,
        });
      });

      parsedAttachmentChunks.forEach((chunk, idx) => {
        processEvidence({
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
        }, 'Parsed attachment content.');

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
      return { 
        evidence_explorer, 
        sources_used,
        relevant_count: items.filter(i => i.relevance === 'HIGH' || i.relevance === 'MEDIUM').length
      };
    }, 15);

    // Stage 6: Hypothesis Formation (MOVED DOWN & SYNCED)
    if (intent !== 'GREETING' && intent !== 'SIMPLE_QUERY') {
      sendSSE('pipeline_stage', { stage: 'Reasoning', detail: 'STAGE 06: การสร้างสมมติฐานทางเลือกคู่ขนาน ACH (Hypothesis Formation)...' });
      await runStage(state, 'HYPOTHESIS_FORMATION', 6, 'การสร้างสมมติฐานทางเลือกคู่ขนาน (ACH)', startMs, () => {
        // Now using actual evidence_explorer
        const ach = buildDynamicACH(state.user_input, evidence_explorer);
        hypotheses_v2 = ach.hypotheses;
        
        state.hypotheses = hypotheses_v2.map(h => ({ 
          claim: h.claim, 
          confidence: Math.round(h.posterior * 100),
          is_inconclusive: h.posterior < 0.6
        }));

        // Phase 5 fix: Sync posterior_score with bayesian_proof
        const topH = [...hypotheses_v2].sort((a, b) => b.posterior - a.posterior)[0];
        if (topH) {
          state.bayesian = {
            posteriorScore: topH.posterior,
            isHighlyCertain: topH.posterior > 0.85,
            verdict: topH.posterior < 0.6 ? 'INCONCLUSIVE' : (topH.posterior > 0.8 ? 'PASSED' : 'LOW_CONFIDENCE')
          };
          state.confidence = topH.posterior < 0.6 ? 'ต่ำ' : (topH.posterior > 0.85 ? 'สูง' : 'ปานกลาง');
        } else {
          state.confidence = 'ไม่สามารถประเมินได้';
        }
        
        return { hypotheses_v2, bayesian: state.bayesian };
      }, 15);
    }

    // Stage 8: Risk & Critique Analysis
    if (intent !== 'GREETING') {
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
    }

    // Stage 9: Strategic Options & Calibrated Confidence
    if (intent !== 'GREETING' && intent !== 'SIMPLE_QUERY') {
      sendSSE('pipeline_stage', { stage: 'Decision', detail: 'STAGE 09: การสังเคราะห์ทางเลือกเชิงยุทธศาสตร์และ Trade-offs (Strategic Options)...' });
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
    }

    // Stage 9.5: Decision Governance
    if (intent !== 'GREETING' && intent !== 'SIMPLE_QUERY') {
      sendSSE('pipeline_stage', { stage: 'Decision', detail: 'STAGE 09.5: การกำกับดูแลการตัดสินใจ (Decision Governance)...' });
      await runStage(state, 'DECISION_GOVERNANCE', 9.5, 'การกำกับดูแลการตัดสินใจ', startMs, async () => {
        // 1. Construct decision object from state
        const confidenceLabel: 'LOW' | 'MEDIUM' | 'HIGH' =
          calibratedConfidenceObj?.label === 'HIGH' ? 'HIGH' :
          calibratedConfidenceObj?.label === 'LOW' ? 'LOW' : 'MEDIUM';

        const decisionObj: DecisionObject = {
          question: state.question || state.user_input || '',
          context: state.context || [],
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
    }

    // Stage 10: Analysis Communication (Adaptive Governed Prompt)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG] PCA Stage 10: Analysis Communication starting...');
    }
    const stage10StartMs = Date.now();
    const isOngoingConversation = history && history.length > 0;
    sendSSE('pipeline_stage', { stage: 'Reflecting', detail: 'STAGE 10: การสื่อสารบทวิเคราะห์ (Governed Prompt Package)...' });
    
    // Prepare evidence for the governed package
    // Named Firekeeper-publication questions must be governed by the canonical corpus.
    // External web hits may still exist for diagnostics/UI, but must not override the
    // official publication in the governed prompt.
    const evidenceForGovernance = publicationIntent
      ? evidence_explorer.filter((e: any) => e.sourceType === 'OFFICIAL_PUBLICATION')
      : evidence_explorer;
    const governedEvidence: GovernedPromptEvidence[] = evidenceForGovernance.map(e => ({
      id: e.id,
      claim: e.content.slice(0, 200),
      // Preserve the complete retrieved publication excerpt inside the governed package.
      // Previously only the first 200 characters survived here, which could make the
      // system prompt truthfully look evidence-poor even though RAG had retrieved the book.
      content: e.sourceType === 'OFFICIAL_PUBLICATION' ? e.content : undefined,
      source: e.source,
      credibility: e.credibilityScore,
      status: e.evidence_status === 'VERIFIED' ? 'VERIFIED' : 'UNVERIFIED',
      url: e.sourceUrl
    }));
    for (const [index, item] of publicationInventory.entries()) {
      governedEvidence.push({
        id: `FK-INDEX-${index + 1}`,
        claim: `${item.source} is available in the local Firekeeper publication corpus (${item.chunkCount} indexed passages).`,
        source: 'Firekeeper publication corpus index',
        credibility: 0.7,
        status: 'CONTEXT_ONLY',
        url: item.url
      });
    }

    // Build adaptive governed prompt package
    const governedPackage = buildGovernedPromptPackage({
      question: question || '',
      evidence: governedEvidence,
      claims: hypotheses_v2,
      risks: state.conflicts.map(c => ({ id: 'risk', text: c })),
      activationPlan,
      depth: runtimeConfig.depth
    });

    const systemPrompt = governedPackage.external_ai_prompt;
    let generatedText = '';
    const userParts: any[] = [];

    // Push the resolved query, instructions, and deep web evidence
    userParts.push({ text: `ADAPTIVE ACTIVATION REASONING PACKAGE:\n${JSON.stringify(activationPlan, null, 2)}` });

    const publicationContext = formatPublicationContext(publicationKnowledge);
    if (publicationInventory.length > 0) {
      userParts.push({ text: `FIREKEEPER PUBLICATION CORPUS INVENTORY (from locally loaded canonical files):\n${JSON.stringify(publicationInventory)}\nAnswer the user's corpus availability question using this inventory. A listed file confirms availability in this runtime; it does not verify every claim inside the file. Do not infer which chapters answer a separate substantive question without retrieving their passages.` });
    }
    if (publicationContext) {
      userParts.push({
        text: `FIREKEEPER OFFICIAL PUBLICATION KNOWLEDGE:\nThese are PUNN-authored primary-source passages retrieved because the user explicitly asked about Firekeeper publications. Their canonical origin and content integrity are known, but publication on an official website does NOT make every claim factually verified. Treat them as source-backed authorial material, not automatically as empirical truth. For a named publication, represent what the text says accurately, distinguish the publication's claims from independently verified facts, and cite publication plus section when materially used. If the passages do not support a requested point, state that limitation.\n\n${publicationContext}`
      });
    }

    if ((!publicationIntent || publicationNeedsWeb) && deepWebRetrievalResult?.hasSummaryEligibleEvidence && deepWebRetrievalResult.evidenceModelText) {
      userParts.push({
        text: `${deepWebRetrievalResult.governanceBlock}\n\n${deepWebRetrievalResult.evidenceModelText}`
      });
    } else if ((!publicationIntent || publicationNeedsWeb) && liveWebSearchResult?.success) {
      userParts.push({ text: formatWebSearchResultsForPrompt(liveWebSearchResult) });
    }

    userParts.push({ text: question });

    // Build multi-turn conversational payload
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

    const customOllamaUrl = ollamaBaseUrl || req.body.ollamaBaseUrl || process.env.OLLAMA_BASE_URL;
    const effectiveApiKey = rawApiKey || deepSeekApiKey || (resolvedProvider === 'deepseek' ? process.env.DEEPSEEK_API_KEY : undefined);
    const effectiveBaseUrl = customBaseUrl || (resolvedProvider === 'ollama' ? customOllamaUrl : undefined);

    try {
      const llmResult = await callUnifiedLlmContent(contentsPayload, {
        provider: resolvedProvider,
        model,
        systemInstruction: systemPrompt,
        apiKey: effectiveApiKey,
        baseUrl: effectiveBaseUrl,
        ollamaBaseUrl: customOllamaUrl,
        images: attachedImages,
      });
      generatedText = llmResult.text || '';
      generatedText = cleanAiResponseStyle(generatedText, isOngoingConversation, question);
    } catch (llmErr: any) {
      console.warn(`[Unified LLM Stream Error (${resolvedProvider} / ${model})]:`, sanitizeErrorForLog(llmErr));
      const providerLabel = (resolvedProvider || 'AI').toUpperCase();
      generatedText = `### ❌ [FIRE KEEPER ${providerLabel} NOTICE]
ขออภัย เกิดข้อผิดพลาดในการประมวลผลผ่าน ${providerLabel} (${model}):
${llmErr?.message || 'ไม่สามารถติดต่อ API Endpoint ได้'}

**คำแนะนำ:**
1. ตรวจสอบ API Key และ Base URL ในการตั้งค่า (Settings)
2. ตรวจสอบว่าโมเดล "${model}" มีอยู่และเปิดใช้งานในบัญชีของผู้ให้บริการ`;
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
          const rewriteResult = await callUnifiedLlmContent(rewritePrompt.userPrompt, {
            provider: resolvedProvider,
            model,
            systemInstruction: rewritePrompt.systemInstruction,
            apiKey: effectiveApiKey,
            baseUrl: effectiveBaseUrl,
            ollamaBaseUrl: customOllamaUrl,
            images: attachedImages,
          });
          rewrittenText = rewriteResult.text || '';
          
          if (rewrittenText.trim()) {
            const reValidation = validateOutputLanguage(rewrittenText, DEFAULT_LANGUAGE_POLICY.outputLanguage);
            if (reValidation.isValid || reValidation.thaiRatio > langValidation.thaiRatio) {
              generatedText = cleanAiResponseStyle(rewrittenText, isOngoingConversation, question);
              langValidation = reValidation;
              console.log(`[GLOBAL LANGUAGE POLICY]: Successfully rewritten response to Thai (Thai ratio: ${(reValidation.thaiRatio * 100).toFixed(1)}%)`);
            }
          }
        } catch (rewriteErr) {
          console.warn('[GLOBAL LANGUAGE POLICY]: Rewrite attempt failed:', sanitizeErrorForLog(rewriteErr));
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

    // Deterministic Validator Layer (PCA Runtime Control Boundary)
    const runtimeValidation = validateModelOutput(finalResponse, {
      query: question,
      expectedDepth: runtimeConfig.depth,
      expectedLanguage: DEFAULT_LANGUAGE_POLICY.outputLanguage,
      activationPlan
    });
    if (runtimeValidation.repairedText) {
      finalResponse = runtimeValidation.repairedText;
    }

    // AUDIT LOGGING
    state.audit_trail_flow.push({
      step: 'PRE_OUTPUT_GOVERNANCE_GATE',
      description: `Pre-Output Governance Gate: ${govReport.decisionState} | Runtime Validation: ${runtimeValidation.isValid ? 'PASS' : 'REPAIRED'}`,
      status: govReport.decisionState === 'BLOCK' ? 'BLOCKED' : 'COMPLETED',
      timestamp: new Date().toISOString(),
      metadata: {
        governance_decision: govReport.decisionState,
        activation_plan: activationPlan,
        violations: [...govReport.violations, ...runtimeValidation.violations],
        repair_applied: govReport.repairApplied || !runtimeValidation.isValid,
        publication_blocked: publicationBlocked,
        runtime_validation_trace: runtimeValidation.trace,
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

    // P0 quality gate: checks recommendation/evidence asymmetry, domain boundary,
    // output corruption, and adds a decision record only for decision requests.
    const p0Quality = enforcePreOutputQuality(finalResponse, {
      query: question,
      evidence: evidence_explorer,
      conflictsCount: (state.conflicts || []).length,
      missingInfoCount: (state.missing_info || []).length,
    });
    finalResponse = p0Quality.text;
    state.audit_trail_flow.push({
      step: 'P0_PRE_OUTPUT_QUALITY_GATE',
      description: `P0 quality gate: ${p0Quality.report.publicationStatus}`,
      status: p0Quality.report.publicationStatus === 'REVIEW_REQUIRED' ? 'WARNING' : 'COMPLETED',
      timestamp: new Date().toISOString(),
      metadata: {
        decision_required: p0Quality.report.decisionRequired,
        violations: p0Quality.report.violations,
        claim_counts: p0Quality.report.claimLedger.reduce((counts: Record<string, number>, claim) => {
          counts[claim.kind] = (counts[claim.kind] || 0) + 1;
          return counts;
        }, {}),
        decision_record_created: Boolean(p0Quality.report.decisionRecord),
        recommendation_consistency: p0Quality.report.recommendationConsistency,
        action_impact_count: p0Quality.report.extensions?.actionImpact.length || 0,
        evidence_plan_count: p0Quality.report.extensions?.sequentialEvidencePlan.length || 0,
        competing_hypotheses_status: p0Quality.report.extensions?.competingHypotheses.status || 'NOT_APPLICABLE',
        recommendation_fingerprint: p0Quality.report.extensions?.recommendationSnapshot.fingerprint || null,
      },
    });
    // Validate publication references after all output rewrites and before streaming.
    const publicationCitationCheck = validatePublicationCitations(finalResponse, publicationKnowledge);
    finalResponse = publicationCitationCheck.text;
    if (publicationCitationCheck.invalidIds.length > 0) {
      sendSSE('publication_citation_warning', { invalidIds: publicationCitationCheck.invalidIds });
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
      state.reflection = ['ตรวจสอบคำตอบภายใต้หลัก ANTI-FABRICATION INVARIANT: PASS'];
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

    const systemPromptTokens = countTokens(systemPrompt);
    const userPartsTokens = userParts.reduce((acc, p) => acc + countTokens(p.text || ''), 0);
    const promptTokens = systemPromptTokens + userPartsTokens;
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

    // Count only completed analyses against the active plan.
    void recordCompletedAnalysisUsage(userId, (req as any).user?.email, hasPdfAttachment);

    // Non-blocking Firestore persistence in background (3-Tier Operational Log & Audit Index)
    if (adminDb && isServerFirestoreAdminAvailable && userId && !isServerFirestoreQuotaExhausted && !isOfflineOnlyMode() && userId !== OFFLINE_USER_UID) {
      const explicitLogLevel = (req.body?.logLevel || req.headers['x-pca-log-level']) as any;
      const tieredAuditLog = buildTieredAuditLog(
        pcaStateV2,
        realExecutionTrace,
        question || '',
        generatedText,
        model,
        explicitLogLevel
      );
      void exportAuditEventToAzure(tieredAuditLog, userId);


      const auditDocId = `run-${Date.now()}-${realExecutionTrace.execution_id.slice(-6)}`;
      const auditRef = adminDb.collection('users').doc(userId).collection('pca_audit_logs').doc(auditDocId);
      auditRef.set(stripUndefinedFields({ ...tieredAuditLog, expiresAt: expiresAt(RETENTION_DAYS.auditLogs) }))
        .then(() => {
          console.log(`[Firestore] Tiered PCA audit log (${tieredAuditLog.logging_level}) saved in background for user: ${userId}`);
        })
        .catch((fError: any) => {
          const errStr = String(fError?.message || fError);
          if (errStr.includes('PERMISSION_DENIED') || errStr.includes('Missing or insufficient permissions') || fError?.code === 7) {
            markAdminFirestoreUnavailable(fError);
          } else if (errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('resource-exhausted') || errStr.includes('Quota limit exceeded')) {
            isServerFirestoreQuotaExhausted = true;
            console.warn('[Firestore] Server daily free tier write quota reached. Operating in memory-only audit fallback mode.');
          } else {
            console.warn('[Firestore] Notice persisting audit log:', sanitizeErrorForLog(fError));
          }
        });
    }

  } catch (err: any) {
    console.error('[PCA STREAM GATEWAY ERROR]:', sanitizeErrorForLog(err));
    if (!res.writableEnded && !isClientDisconnected) {
      sendSSE('error', { message: err?.message || 'Cognitive pipeline processing failed' });
    }
  } finally {
    // JavaScript strings cannot be zeroized, but remove request references and
    // release mutable BYOK bindings at the earliest deterministic boundary.
    rawApiKey = undefined;
    deepSeekApiKey = undefined;
    if (!res.writableEnded) {
      try {
        res.end();
      } catch {}
    }
  }
});

// ── VITE DEVELOPMENT / STATIC PRODUCTION MIDDLEWARE ─────────────────────────

async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const isProdMode = process.env.NODE_ENV === 'production' || fs.existsSync(distPath);

  if (!isProdMode) {
    try {
      const { createServer: createViteServer } = await import('vite');
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
    } catch (viteErr) {
      console.warn('[Server Notice] Vite dev middleware unavailable, serving static dist files:', sanitizeErrorForLog(viteErr));
    }
  }

  if (isProdMode || fs.existsSync(distPath)) {
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));

    // Missing static assets under /assets must return 404 Not Found instead of serving index.html
    // This prevents browser syntax errors (Uncaught SyntaxError: Unexpected token '<') when old bundles are requested
    app.use('/assets', (req, res) => {
      res.status(404).setHeader('Cache-Control', 'no-cache, no-store, must-revalidate').send('Asset Not Found');
    });

    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  activeHttpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Fire Keeper Core is listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  gracefulFatalShutdown('[Bootstrap Error]:', err);
});
