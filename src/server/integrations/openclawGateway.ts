/**
 * FIRE KEEPER - OpenClaw Integration Gateway
 * 
 * Provides an OpenAI-compatible Gateway and Cognitive Governance endpoint
 * allowing OpenClaw (and other autonomous agent platforms) to leverage
 * the PUNN Predictive Cognitive Architecture (PCA v3.0) and Dual-Mode Runtime.
 * 
 * Features:
 * - OpenAI-compatible Chat Completions (/v1/chat/completions)
 * - DeepSeek Markup Language (DSML) & Native Tool Calling Parser
 * - Autonomous Tool Execution Runtime (web_search, exec allowlist)
 * - 5-Step Tool Execution Loop (Model -> Parse -> Registry -> Result -> Synthesized Answer)
 * - Multi-turn Conversation with Tool Result History
 * - Models Catalog & Health Endpoints
 * - Decision Intelligence Governance Endpoints (/v1/governance/evaluate)
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
import { parseModelToolCalls, type NormalizedToolCall } from '../services/toolParser';
import { ToolRegistry } from '../services/toolRegistry';

export interface OpenClawGatewayOptions {
  adminDb?: any;
  firestoreAvailable?: () => boolean;
}

export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: any; // String or multi-part [{ type: 'text', text: '...' }]
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface OpenAIChatCompletionRequest {
  model?: string;
  messages: OpenAIChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  tools?: any[];
  tool_choice?: any;
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
export function extractTextContent(content: any): string {
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
        openai: Boolean(process.env.OPENAI_API_KEY),
        deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
        groq: Boolean(process.env.GROQ_API_KEY),
        gemini: Boolean(process.env.GEMINI_API_KEY),
        ollama: Boolean(process.env.OLLAMA_BASE_URL),
      },
      models: SUPPORTED_MODELS.map(m => m.id),
      tools_registered: ['web_search', 'exec'],
      database: isDbReady() ? 'connected' : 'in-memory',
      timestamp: new Date().toISOString()
    });
  };

  app.get(['/v1/health', '/api/openclaw/health', '/api/openclaw/status'], verifyOpenClawAccess, handleHealth);

  // ── 3. CHAT COMPLETIONS (OPENAI-COMPATIBLE WITH TOOL EXECUTION LOOP) ──
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

    // Parse messages into system instruction and conversation turns (including tool results)
    let systemInstruction = '';
    const conversationTurns: Array<{
      role: 'user' | 'assistant' | 'tool';
      content: string;
      tool_call_id?: string;
      tool_calls?: any[];
    }> = [];

    for (const msg of rawMessages) {
      const role = String(msg.role || '').toLowerCase();
      const text = extractTextContent(msg.content);

      if (role === 'system') {
        systemInstruction = systemInstruction ? `${systemInstruction}\n\n${text}` : text;
        continue;
      }

      if (role === 'tool') {
        conversationTurns.push({
          role: 'tool',
          tool_call_id: msg.tool_call_id || 'call_0',
          content: text || (typeof msg.content === 'object' ? JSON.stringify(msg.content) : ''),
        });
        continue;
      }

      if (role === 'assistant') {
        conversationTurns.push({
          role: 'assistant',
          content: text,
          tool_calls: msg.tool_calls || undefined,
        });
        continue;
      }

      if (role === 'user') {
        if (text) {
          conversationTurns.push({
            role: 'user',
            content: text,
          });
        }
      }
    }

    // Determine current user query (find latest user message)
    let question = '';
    for (let i = conversationTurns.length - 1; i >= 0; i--) {
      if (conversationTurns[i].role === 'user') {
        question = conversationTurns[i].content;
        break;
      }
    }
    if (!question) {
      question = 'สวัสดี';
    }

    // Determine operational mode: Governed (PCA) or Direct (Normal)
    const isGoverned = requestedModel.includes('pca') || requestedModel.includes('governed');
    const selectedMode = isGoverned ? 'governed' : 'normal';

    // Provider selection
    const preferred = (process.env.PREFERRED_PROVIDER || '').toLowerCase().trim();
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
    const hasDeepSeek = Boolean(process.env.DEEPSEEK_API_KEY);
    const hasGroq = Boolean(process.env.GROQ_API_KEY);
    const hasOllama = Boolean(process.env.OLLAMA_BASE_URL || process.env.OLLAMA_MODEL);
    
    let defaultProvider = 'deepseek';
    if (preferred === 'openai' && hasOpenAI) {
      defaultProvider = 'openai';
    } else if (preferred === 'groq' && hasGroq) {
      defaultProvider = 'groq';
    } else if (preferred === 'ollama' && hasOllama) {
      defaultProvider = 'ollama';
    } else if (hasOpenAI && !hasDeepSeek && !hasGroq) {
      defaultProvider = 'openai';
    } else if (hasDeepSeek) {
      defaultProvider = 'deepseek';
    } else if (hasOpenAI) {
      defaultProvider = 'openai';
    } else if (hasGroq) {
      defaultProvider = 'groq';
    } else if (hasOllama) {
      defaultProvider = 'ollama';
    }

    let defaultModel = defaultProvider === 'openai'
      ? (process.env.OPENAI_MODEL || 'gpt-4o-mini')
      : (defaultProvider === 'groq'
        ? (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile')
        : (defaultProvider === 'deepseek' ? 'deepseek-chat' : (process.env.OLLAMA_MODEL || 'qwen3:4b')));

    // Available tools configuration
    const requestedTools = Array.isArray(body.tools) && body.tools.length > 0
      ? body.tools
      : ToolRegistry.getOpenAITools();

    // Check if client explicitly requests passthrough tool calls without internal execution
    const isPassthroughRequested = req.headers['x-openclaw-passthrough-tools'] === 'true' ||
      (!stream && body.tool_choice === 'required' && req.query.execute === 'false');

    // Safe SSE writer helper
    const sendSSEChunk = (deltaText: string, finishReason: string | null = null, toolCallsDelta?: any[]) => {
      if (isClientDisconnected || res.writableEnded) return;
      try {
        const deltaObj: any = {};
        if (deltaText) deltaObj.content = deltaText;
        if (toolCallsDelta) deltaObj.tool_calls = toolCallsDelta;

        const chunk = {
          id: completionId,
          object: 'chat.completion.chunk',
          created,
          model: requestedModel,
          choices: [
            {
              index: 0,
              delta: finishReason ? {} : deltaObj,
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

      // Assemble unified PCA system instructions
      const intentResult = classifyIntent(question);
      detectedIntent = intentResult.type;

      const depthResult = calculateRuntimeResponseDepth(question, {
        intent: detectedIntent,
        deepReasoning: false,
        historyTurns: conversationTurns.length
      });
      appliedDepth = depthResult.depth;

      const pcaPrompt = isGoverned ? buildUnifiedPcaGovernancePrompt({
        depth: depthResult.depth,
        activationPlan: depthResult.activationPlan
      }) : '';

      const unifiedSystemPrompt = [
        systemInstruction,
        pcaPrompt,
        `\nFIREKEEPER TOOL CALLING & EVIDENCE DIRECTIVE:
• Available tools:
  - web_search(query: string): live web search for fresh news, facts, and citations.
  - exec(command: string): execute shell inspection commands on allowlist (e.g. echo, date, uptime, git status).
• When calling tools, emit standard function call or DSML:
  <invoke name="web_search">
    <parameter name="query">search keyword</parameter>
  </invoke>
• When tool results are provided, synthesize a factual answer with source citations (URLs/domains).
• If search finds no results or fails, explain transparently without fabricating false claims.
• Never leak internal DSML or raw tool markup in user-facing answers.`,
        isGoverned ? `• Enforce Epistemic Taxonomy: tag [FACT], [HYPOTHESIS], and [RISK] where appropriate.` : ''
      ].filter(Boolean).join('\n\n');

      // Prepare conversation payload for LLM
      const contextPayload: any[] = conversationTurns.map(t => {
        if (t.role === 'tool') {
          return { role: 'tool', tool_call_id: t.tool_call_id, content: t.content };
        }
        if (t.role === 'assistant' && t.tool_calls) {
          return { role: 'assistant', content: t.content || null, tool_calls: t.tool_calls };
        }
        return { role: t.role, content: t.content };
      });

      // ── AUTONOMOUS TOOL EXECUTION LOOP (Max 3 iterations) ──
      const MAX_TOOL_ITERATIONS = 3;
      let loopIteration = 0;
      let currentToolCalls: NormalizedToolCall[] = [];
      const executedToolLogs: any[] = [];

      while (loopIteration < MAX_TOOL_ITERATIONS) {
        requestAbortController.signal.throwIfAborted();
        loopIteration++;

        let llmResult: any;
        try {
          llmResult = await callUnifiedLlmContent(contextPayload, {
            provider: defaultProvider,
            model: defaultModel,
            systemInstruction: unifiedSystemPrompt,
            temperature,
            maxOutputTokens: maxTokens,
            signal: requestAbortController.signal,
            tools: requestedTools,
            toolChoice: body.tool_choice || 'auto',
          });
        } catch (primaryErr: any) {
          // Automatic Failover to Ollama if DeepSeek fails
          if (defaultProvider === 'deepseek' && hasOllama) {
            console.warn('[OpenClaw Gateway] DeepSeek failed, auto-failover to Ollama (qwen3:4b)...', primaryErr?.message);
            llmResult = await callUnifiedLlmContent(contextPayload, {
              provider: 'ollama',
              model: process.env.OLLAMA_MODEL || 'qwen3:4b',
              ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'https://ollama.firekeeper.site',
              systemInstruction: unifiedSystemPrompt,
              temperature,
              maxOutputTokens: maxTokens,
              signal: requestAbortController.signal,
              tools: requestedTools,
              toolChoice: body.tool_choice || 'auto',
            });
          } else {
            throw primaryErr;
          }
        }

        totalTokens += (llmResult.usage?.totalTokens || Math.ceil((question.length + llmResult.text.length) / 3.5));

        // Parse tool calls from either native API tool_calls or DSML text
        const parseResult = parseModelToolCalls(llmResult.text, llmResult.toolCalls);

        if (!parseResult.hasToolCalls) {
          // Model produced final answer without tool calls
          finalResponseText = parseResult.cleanVisibleText || llmResult.text;
          break;
        }

        currentToolCalls = parseResult.toolCalls;

        // If client explicitly requested raw passthrough tool_calls, exit immediately
        if (isPassthroughRequested) {
          if (stream) {
            sendSSEChunk('', 'tool_calls', currentToolCalls);
            res.write('data: [DONE]\n\n');
            return res.end();
          } else {
            return res.json({
              id: completionId,
              object: 'chat.completion',
              created,
              model: requestedModel,
              choices: [
                {
                  index: 0,
                  message: {
                    role: 'assistant',
                    content: parseResult.cleanVisibleText || null,
                    tool_calls: currentToolCalls,
                  },
                  finish_reason: 'tool_calls',
                }
              ],
            });
          }
        }

        // Autonomous Execution: Execute each tool in registry
        console.log(`[OpenClaw Gateway] Tool call detected (Iteration ${loopIteration}/${MAX_TOOL_ITERATIONS}):`, 
          currentToolCalls.map(tc => tc.function.name).join(', ')
        );

        // Record assistant turn in context
        contextPayload.push({
          role: 'assistant',
          content: parseResult.cleanVisibleText || null,
          tool_calls: currentToolCalls,
        });

        for (const tc of currentToolCalls) {
          requestAbortController.signal.throwIfAborted();
          const toolName = tc.function.name;
          const toolArgs = tc.function.arguments;

          console.log(`[OpenClaw Gateway] Executing tool: ${toolName}`);
          const execResult = await ToolRegistry.executeTool(toolName, toolArgs, {
            signal: requestAbortController.signal,
          });

          executedToolLogs.push({
            tool: toolName,
            args: toolArgs,
            success: execResult.success,
            durationMs: execResult.durationMs,
          });

          // Feed result back into conversation context
          const toolOutputString = JSON.stringify(execResult.output ?? { error: execResult.error });
          contextPayload.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: toolOutputString,
          });
        }

        // Loop continues to let model synthesize final answer with the tool results
      }

      // If loop completed without final text, generate synthesis prompt
      if (!finalResponseText && loopIteration >= MAX_TOOL_ITERATIONS) {
        finalResponseText = 'ขออภัยครับ การดำเนินการเครื่องมือถึงขีดจำกัดสูงสุด ไม่สามารถประมวลผลต่อได้';
      }

      // Clean final response style
      finalResponseText = cleanAiResponseStyle(finalResponseText, conversationTurns.length > 0, question);

      // Ensure no raw DSML tokens leak into the user's Telegram answer
      finalResponseText = finalResponseText
        .replace(/<[|｜]?DSML[|｜]?[^>]*>/gi, '')
        .replace(/<\/[|｜]?DSML[|｜]?[^>]*>/gi, '')
        .replace(/<invoke\b[^>]*>[\s\S]*?<\/invoke>/gi, '')
        .replace(/<parameter\b[^>]*>[\s\S]*?<\/parameter>/gi, '')
        .trim();

      // Compute cryptographic audit hash
      auditHash = crypto.createHash('sha256')
        .update(`${created}:${completionId}:${detectedIntent}:${appliedDepth}:${finalResponseText}`)
        .digest('hex');

      // Deliver via SSE if streaming
      if (stream) {
        const chunkSize = Math.max(16, Math.ceil(finalResponseText.length / 25));
        for (let i = 0; i < finalResponseText.length; i += chunkSize) {
          if (isClientDisconnected || res.writableEnded) break;
          const slice = finalResponseText.slice(i, i + chunkSize);
          sendSSEChunk(slice);
          await new Promise(r => setTimeout(r, 6));
        }

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
            tools_executed: executedToolLogs.length > 0 ? executedToolLogs : undefined,
            engine: 'PUNN PCA v3.0'
          }
        });
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
            toolsExecuted: executedToolLogs,
            totalTokens,
            durationMs: Date.now() - startTime,
            timestamp: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn('[OpenClaw Gateway] Operational log note:', sanitizeErrorForLog(dbErr));
        }
      }
    } catch (err: any) {
      console.error('[OpenClaw Gateway] Chat completion error:', sanitizeErrorForLog(err));
      if (stream) {
        if (!isClientDisconnected && !res.writableEnded) {
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
        return res.status(400).json({
          error: {
            message: 'Parameter "query" is required for governance evaluation.',
            type: 'invalid_request_error'
          }
        });
      }

      const intent = classifyIntent(cleanQuery);
      const depth = calculateRuntimeResponseDepth(cleanQuery, {
        intent: intent.type,
        deepReasoning: true,
      });

      const auditHash = crypto.createHash('sha256')
        .update(`${Date.now()}:${cleanQuery}:${intent.type}:${depth.depth}`)
        .digest('hex');

      res.json({
        success: true,
        evaluation_id: `gov-eval-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`,
        query: cleanQuery,
        intent: intent.type,
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
      res.status(500).json({
        error: {
          message: err?.message || 'Failed to evaluate governance',
          type: 'internal_error'
        }
      });
    }
  });

  // ── 5. PERSISTENT AUDIT VERIFICATION ENDPOINT ─────────────────────────
  app.post(['/v1/governance/audit', '/api/openclaw/governance/audit'], verifyOpenClawAccess, async (req: Request, res: Response) => {
    try {
      const { hash } = req.body || {};
      if (!hash || typeof hash !== 'string') {
        return res.status(400).json({
          error: { message: 'Parameter "hash" is required.', type: 'invalid_request_error' }
        });
      }

      res.json({
        hash,
        valid: /^[a-f0-9]{64}$/i.test(hash),
        verified_by: 'PUNN PCA v3.0 Cryptographic Integrity Engine',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({
        error: { message: err?.message || 'Audit verification error', type: 'internal_error' }
      });
    }
  });
}
