/**
 * FIRE KEEPER - OpenClaw Integration Gateway
 * 
 * Provides an OpenAI-compatible Gateway and Cognitive Governance endpoint
 * allowing OpenClaw (and other autonomous agent platforms) to leverage
 * the PUNN Predictive Cognitive Architecture (PCA v3.0) and Dual-Mode Runtime.
 * 
 * Routes exposed:
 * - GET  /v1/models & /api/openclaw/models
 * - POST /v1/chat/completions & /api/openclaw/chat/completions
 * - GET  /v1/health & /api/openclaw/health & /api/openclaw/status
 * - POST /v1/governance/evaluate & /api/openclaw/governance/evaluate
 * - POST /v1/governance/audit & /api/openclaw/governance/audit
 */

import crypto from 'crypto';
import type { Express, Request, Response, NextFunction } from 'express';
import { executeNormalChat } from '../services/normalChatService';
import { callUnifiedLlmContent } from '../services/unifiedLlm';
import { classifyIntent } from '../services/intentClassifier';
import { calculateRuntimeResponseDepth } from '../services/pcaRuntimeController';
import { buildUnifiedPcaGovernancePrompt } from '../services/pcaGovernance';
import { cleanAiResponseStyle } from '../services/promptOptimizer';
import { sanitizeErrorForLog } from '../security/sanitizeError';

export interface OpenClawGatewayOptions {
  adminDb?: any;
  firestoreAvailable?: () => boolean;
}

export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: any; // Can be string or array of parts [{ type: 'text', text: '...' }]
}

export interface OpenAIChatCompletionRequest {
  model?: string;
  messages: OpenAIChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

const SUPPORTED_MODELS = [
  {
    id: 'firekeeper-pca',
    name: 'Firekeeper PCA (PUNN Predictive Cognitive Architecture - Governed)',
    mode: 'governed',
    description: '12-Stage Decision Intelligence with Epistemic Taxonomy ([FACT], [HYPOTHESIS], [RISK]), uncertainty evaluation, and Human Agency preservation.'
  },
  {
    id: 'firekeeper-direct',
    name: 'Firekeeper Direct (Normal Mode)',
    mode: 'normal',
    description: 'Fast, direct conversational AI execution without governance overhead.'
  },
  {
    id: 'firekeeper/firekeeper-pca',
    name: 'Firekeeper PCA (Canonical Ref)',
    mode: 'governed',
    description: 'Alias for OpenClaw provider/model format.'
  },
  {
    id: 'firekeeper/firekeeper-direct',
    name: 'Firekeeper Direct (Canonical Ref)',
    mode: 'normal',
    description: 'Alias for OpenClaw provider/model format.'
  }
];

function timingSafeTokenEqual(actual: string, expected: string): boolean {
  if (!actual || !expected) return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function verifyOpenClawAccess(req: Request, res: Response, next: NextFunction) {
  const remoteIp = req.socket?.remoteAddress || '';
  const isLoopback = remoteIp === '127.0.0.1' || remoteIp === '::1' || remoteIp === '::ffff:127.0.0.1';

  const expectedToken = String(process.env.OPENCLAW_SERVICE_TOKEN || process.env.OPENCLAW_API_KEY || '').trim();
  
  if (!expectedToken && isLoopback) {
    return next();
  }

  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : String(req.headers['x-api-key'] || '').trim();

  if (expectedToken && !timingSafeTokenEqual(token, expectedToken)) {
    return res.status(401).json({
      error: {
        message: 'Invalid OpenClaw authorization token.',
        type: 'authentication_error',
        code: 'unauthorized'
      }
    });
  }

  next();
}

/**
 * Robust text extractor that safely normalizes:
 * - String: "Hello"
 * - Multi-part array: [{ type: "text", text: "Hello" }, ...]
 * - Object: { text: "Hello" }
 */
function extractTextContent(content: any): string {
  if (content === null || content === undefined) return '';
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (!part) return '';
        if (typeof part === 'string') return part;
        if (typeof part === 'object') {
          return part.text || part.content || '';
        }
        return '';
      })
      .filter(Boolean)
      .join('\n')
      .trim();
  }
  if (typeof content === 'object') {
    return (content.text || content.content || '').trim();
  }
  return String(content).trim();
}

export function registerOpenClawGateway(app: Express, options?: OpenClawGatewayOptions): void {
  const { adminDb, firestoreAvailable } = options || {};
  const isDbReady = () => Boolean(adminDb && firestoreAvailable && firestoreAvailable());

  // ── 1. MODELS CATALOG ──────────────────────────────────────────────────
  const handleModelsList = (_req: Request, res: Response) => {
    const createdTimestamp = Math.floor(Date.now() / 1000);
    res.json({
      object: 'list',
      data: SUPPORTED_MODELS.map(m => ({
        id: m.id,
        object: 'model',
        created: createdTimestamp,
        owned_by: 'firekeeper',
        permission: [],
        root: m.id,
        parent: null,
        description: m.description,
      }))
    });
  };

  app.get('/v1/models', verifyOpenClawAccess, handleModelsList);
  app.get('/api/openclaw/models', verifyOpenClawAccess, handleModelsList);

  // ── 2. HEALTH & STATUS ────────────────────────────────────────────────
  const handleHealth = (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'firekeeper-core',
      gateway: 'openclaw-governance-gateway',
      version: '3.0.0',
      cognitive_architecture: 'PUNN PCA v3.0',
      active_modes: ['governed', 'normal'],
      providers_configured: {
        deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
        gemini: Boolean(process.env.GEMINI_API_KEY),
        ollama: Boolean(process.env.OLLAMA_BASE_URL),
      },
      models: SUPPORTED_MODELS.map(m => m.id),
      database: isDbReady() ? 'connected' : 'in-memory',
      timestamp: new Date().toISOString()
    });
  };

  app.get(['/v1/health', '/api/openclaw/health', '/api/openclaw/status'], verifyOpenClawAccess, handleHealth);

  // ── 3. CHAT COMPLETIONS (OPENAI-COMPATIBLE) ───────────────────────────
  const handleChatCompletions = async (req: Request, res: Response) => {
    const startTime = Date.now();
    const completionId = `chatcmpl-fk-${crypto.randomUUID()}`;
    const created = Math.floor(startTime / 1000);

    let isClientDisconnected = false;
    const requestAbortController = new AbortController();

    const abortDisconnectedRequest = () => {
      if (res.writableEnded) return;
      isClientDisconnected = true;
      requestAbortController.abort();
    };

    req.on('aborted', abortDisconnectedRequest);
    res.on('close', abortDisconnectedRequest);
    if (res.destroyed) abortDisconnectedRequest();

    const body: OpenAIChatCompletionRequest = req.body || {};
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const requestedModel = String(body.model || 'firekeeper-pca').trim().toLowerCase();
    const stream = Boolean(body.stream);
    const temperature = typeof body.temperature === 'number' ? body.temperature : 0.7;
    const maxTokens = typeof body.max_tokens === 'number' ? body.max_tokens : 2048;

    if (rawMessages.length === 0) {
      return res.status(400).json({
        error: {
          message: 'Missing required parameter "messages". At least one message is required.',
          type: 'invalid_request_error',
          code: 'missing_required_parameter'
        }
      });
    }

    // Parse messages into system, user question, and multi-turn history
    let systemInstruction = '';
    const sanitizedTurns: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    for (const msg of rawMessages) {
      const role = String(msg.role || '').toLowerCase();
      const text = extractTextContent(msg.content);

      if (!text && role !== 'system') continue;

      // Filter out client error placeholders from previously failed turns
      if (text.includes('[assistant turn failed before producing content]')) {
        continue;
      }

      if (role === 'system') {
        systemInstruction = systemInstruction ? `${systemInstruction}\n\n${text}` : text;
      } else if (role === 'user') {
        // If consecutive user messages, merge them gracefully
        const lastTurn = sanitizedTurns[sanitizedTurns.length - 1];
        if (lastTurn && lastTurn.role === 'user') {
          lastTurn.content = `${lastTurn.content}\n\n${text}`.trim();
        } else {
          sanitizedTurns.push({ role: 'user', content: text });
        }
      } else if (role === 'assistant') {
        const lastTurn = sanitizedTurns[sanitizedTurns.length - 1];
        if (lastTurn && lastTurn.role === 'assistant') {
          lastTurn.content = `${lastTurn.content}\n\n${text}`.trim();
        } else {
          sanitizedTurns.push({ role: 'assistant', content: text });
        }
      }
    }

    // Determine current query
    let question = '';
    const lastTurn = sanitizedTurns[sanitizedTurns.length - 1];
    if (lastTurn && lastTurn.role === 'user') {
      question = lastTurn.content;
      sanitizedTurns.pop(); // Remove from history turns
    } else {
      // Find the last user message anywhere
      for (let i = sanitizedTurns.length - 1; i >= 0; i--) {
        if (sanitizedTurns[i].role === 'user') {
          question = sanitizedTurns[i].content;
          sanitizedTurns.splice(i, 1);
          break;
        }
      }
    }

    if (!question) {
      question = extractTextContent(rawMessages[rawMessages.length - 1]?.content) || 'สวัสดี';
    }

    const contextHistory = sanitizedTurns;

    // Determine operational mode: Governed (PCA) or Direct (Normal)
    const isGoverned = requestedModel.includes('pca') || requestedModel.includes('governed');
    const selectedMode = isGoverned ? 'governed' : 'normal';

    // Provider selection
    const defaultProvider = process.env.DEEPSEEK_API_KEY ? 'deepseek' : (process.env.OLLAMA_BASE_URL ? 'ollama' : 'deepseek');
    const defaultModel = defaultProvider === 'deepseek' ? 'deepseek-chat' : (process.env.OLLAMA_MODEL || 'qwen3:4b');

    // Safe SSE writer helper
    const sendSSEChunk = (deltaText: string, finishReason: string | null = null) => {
      if (isClientDisconnected || res.writableEnded) return;
      try {
        const chunk = {
          id: completionId,
          object: 'chat.completion.chunk',
          created,
          model: requestedModel,
          choices: [
            {
              index: 0,
              delta: finishReason ? {} : { content: deltaText },
              finish_reason: finishReason,
            }
          ]
        };
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      } catch {
        isClientDisconnected = true;
      }
    };

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      // Send initial role delta
      if (!isClientDisconnected && !res.writableEnded) {
        try {
          const initialRole = {
            id: completionId,
            object: 'chat.completion.chunk',
            created,
            model: requestedModel,
            choices: [{ index: 0, delta: { role: 'assistant', content: '' }, finish_reason: null }]
          };
          res.write(`data: ${JSON.stringify(initialRole)}\n\n`);
        } catch {
          isClientDisconnected = true;
        }
      }
    }

    try {
      let finalResponseText = '';
      let totalTokens = 0;
      let auditHash = '';
      let detectedIntent = 'CONVERSATION';
      let appliedDepth = 'L0_DIRECT';

      if (isGoverned) {
        // ── GOVERNED MODE: PUNN PCA ENGINE ──
        const intentResult = classifyIntent(question);
        detectedIntent = intentResult.type;

        const depthResult = calculateRuntimeResponseDepth(question, {
          intent: detectedIntent,
          deepReasoning: false,
          historyTurns: contextHistory.length
        });
        appliedDepth = depthResult.depth;

        const pcaPrompt = buildUnifiedPcaGovernancePrompt({
          depth: depthResult.depth,
          activationPlan: depthResult.activationPlan
        });

        const unifiedSystemPrompt = [
          systemInstruction,
          pcaPrompt,
          `\nPCA COGNITIVE GOVERNANCE DIRECTIVE:
• Enforce Epistemic Taxonomy: explicitly tag facts [FACT], hypotheses [HYPOTHESIS], and risks [RISK] where appropriate.
• Preserve Human Agency: Provide transparent advice while maintaining the human operator's ultimate decision authority.
• Output language should be natural Thai or English matching the user's prompt.`
        ].filter(Boolean).join('\n\n');

        const contentsPayload: any[] = [];
        for (const turn of contextHistory.slice(-8)) {
          contentsPayload.push({ role: turn.role, content: turn.content });
        }
        contentsPayload.push({ role: 'user', content: question });

        const llmResult = await callUnifiedLlmContent(contentsPayload, {
          provider: defaultProvider,
          model: defaultModel,
          systemInstruction: unifiedSystemPrompt,
          temperature,
          maxOutputTokens: maxTokens,
          signal: requestAbortController.signal,
        });

        finalResponseText = cleanAiResponseStyle(llmResult.text || '', contextHistory.length > 0, question);
        totalTokens = llmResult.usage?.totalTokens || Math.ceil((question.length + finalResponseText.length) / 3.5);

        // Generate cryptographic audit hash
        auditHash = crypto.createHash('sha256')
          .update(`${created}:${completionId}:${detectedIntent}:${appliedDepth}:${finalResponseText}`)
          .digest('hex');

        // Deliver chunks if streaming
        if (stream) {
          const chunkSize = Math.max(16, Math.ceil(finalResponseText.length / 25));
          for (let i = 0; i < finalResponseText.length; i += chunkSize) {
            if (isClientDisconnected || res.writableEnded) break;
            const slice = finalResponseText.slice(i, i + chunkSize);
            sendSSEChunk(slice);
            await new Promise(r => setTimeout(r, 6));
          }
        }
      } else {
        // ── NORMAL MODE: DIRECT FAST AI ──
        const normalResult = await executeNormalChat({
          question,
          history: contextHistory,
          tone: 'Direct Expert',
          model: defaultModel,
          provider: defaultProvider,
          maxOutputTokens: maxTokens,
          signal: requestAbortController.signal,
        }, {
          onToken: (token: string) => {
            if (stream) {
              sendSSEChunk(token);
            }
          }
        });

        finalResponseText = normalResult.text;
        totalTokens = normalResult.totalTokens;
      }

      // Record operational log if database is available
      if (isDbReady()) {
        try {
          const logDocId = `openclaw-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
          await adminDb.collection('openclaw_logs').doc(logDocId).set({
            completionId,
            mode: selectedMode,
            model: requestedModel,
            questionLength: question.length,
            responseLength: finalResponseText.length,
            intent: detectedIntent,
            depth: appliedDepth,
            auditHash: auditHash || null,
            totalTokens,
            durationMs: Date.now() - startTime,
            timestamp: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn('[OpenClaw Gateway] Operational log note:', sanitizeErrorForLog(dbErr));
        }
      }

      // Finish response
      if (stream) {
        if (!isClientDisconnected && !res.writableEnded) {
          sendSSEChunk('', 'stop');
          try {
            res.write('data: [DONE]\n\n');
            res.end();
          } catch {}
        }
      } else {
        res.json({
          id: completionId,
          object: 'chat.completion',
          created,
          model: requestedModel,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: finalResponseText,
              },
              finish_reason: 'stop',
            }
          ],
          usage: {
            prompt_tokens: Math.ceil(question.length / 3.5),
            completion_tokens: Math.ceil(finalResponseText.length / 3.5),
            total_tokens: totalTokens,
          },
          firekeeper_governance: {
            mode: selectedMode,
            intent: detectedIntent,
            depth: appliedDepth,
            integrity_hash: auditHash || undefined,
            engine: 'PUNN PCA v3.0'
          }
        });
      }
    } catch (err: any) {
      console.error('[OpenClaw Gateway] Chat completion error:', sanitizeErrorForLog(err));
      if (stream) {
        if (!isClientDisconnected && !res.writableEnded) {
          // Send user-friendly error text directly in the stream so client agent never gets network crash
          sendSSEChunk(`\n[Firekeeper Error: ${err?.message || 'การประมวลผลขัดข้อง ชั่วคราว'}]`);
          sendSSEChunk('', 'stop');
          try {
            res.write('data: [DONE]\n\n');
            res.end();
          } catch {}
        }
      } else {
        res.status(500).json({
          error: {
            message: err?.message || 'Cognitive Gateway Internal Error',
            type: 'internal_error',
            code: 'gateway_error'
          }
        });
      }
    }
  };

  app.post('/v1/chat/completions', verifyOpenClawAccess, handleChatCompletions);
  app.post('/api/openclaw/chat/completions', verifyOpenClawAccess, handleChatCompletions);

  // ── 4. DECISION INTELLIGENCE TOOL (DIRECT GOVERNANCE EVALUATE) ─────────
  app.post(['/v1/governance/evaluate', '/api/openclaw/governance/evaluate'], verifyOpenClawAccess, async (req: Request, res: Response) => {
    try {
      const { query = '', context = '' } = req.body || {};
      const cleanQuery = extractTextContent(query);
      if (!cleanQuery) {
        return res.status(400).json({ error: 'Missing required field: query' });
      }

      const intent = classifyIntent(cleanQuery);
      const depth = calculateRuntimeResponseDepth(cleanQuery, {
        intent: intent.type,
        deepReasoning: true
      });

      const auditHash = crypto.createHash('sha256')
        .update(`${Date.now()}:${cleanQuery}:${intent.type}:${depth.depth}`)
        .digest('hex');

      res.json({
        success: true,
        query: cleanQuery,
        classification: intent,
        response_controller: {
          depth: depth.depth,
          complexity: depth.complexity,
          uncertainty: depth.uncertainty,
          decision_impact: depth.decisionImpact,
          activation_plan: depth.activationPlan
        },
        governance_requirements: {
          epistemic_tagging: depth.activationPlan.epistemicTaxonomy === 'MANDATORY',
          competing_hypotheses: depth.activationPlan.competingHypotheses === 'REQUIRED',
          evidence_grounding: depth.activationPlan.evidenceGrounding === 'REQUIRED',
          human_decision_gate: depth.depth === 'L2_STRUCTURED' || depth.depth === 'L3_DEEP_AUDIT'
        },
        audit: {
          timestamp: new Date().toISOString(),
          integrity_hash: auditHash,
          framework: 'PUNN PCA v3.0'
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Governance evaluation failed' });
    }
  });
}
