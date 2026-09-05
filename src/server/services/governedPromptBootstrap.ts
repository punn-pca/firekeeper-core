import express from 'express';
import { buildGovernedPromptPackage } from './governedPrompt';

/**
 * Additive integration for GOVERNED_PROMPT mode.
 *
 * Standard /api/pca/stream requests are untouched unless the question starts
 * with /governed or /governed-prompt. A dedicated JSON endpoint is also added
 * when the main stream route is registered.
 */

let installed = false;

function isGovernedQuestion(question: unknown): boolean {
  return /^\/(?:governed|governed-prompt)(?:\s|$)/i.test(String(question || '').trim());
}

function stripGovernedPrefix(question: string): string {
  return question.replace(/^\/(?:governed|governed-prompt)\s*/i, '').trim();
}

function buildGovernedPcaState(pkg: ReturnType<typeof buildGovernedPromptPackage>, startedAt: string, endedAt: string) {
  return {
    user_input: pkg.query.original,
    language: 'th' as const,
    observations: pkg.evidence.map((item) => item.claim),
    understanding: pkg.query.objective,
    purpose: pkg.query.objective,
    constraints: [
      'Anti-fabrication',
      'Evidence grounding',
      'Uncertainty disclosure',
      'Human agency preservation',
    ],
    memories: [],
    hypotheses: pkg.claims.map((claim, index) => ({
      claim: claim.claim,
      confidence: pkg.evidence.length > 0 ? 0.5 : 0,
      id: `GP-H-${String(index + 1).padStart(3, '0')}`,
    })),
    evidence: pkg.evidence.map((item) => item.claim),
    critique: [],
    uncertainty: pkg.risks.length > 0 ? pkg.risks : ['Governed prompt package; external AI output not yet generated or verified.'],
    decision: 'DEFERRED_TO_EXTERNAL_AI',
    response: pkg.external_ai_prompt,
    reflection: [],
    learning: [],
    agency_checks: ['Human decision authority preserved'],
    notes: ['GOVERNED_PROMPT mode: Firekeeper prepares governance context; it does not generate the final answer.'],
    confidence: pkg.evidence.length > 0 ? 'ปานกลาง' as const : 'ไม่สามารถประเมินได้' as const,
    conflicts: [],
    missing_info: [],
    trace: [],
    llm_provider: 'Firekeeper Governance Layer',
    llm_model: 'GOVERNED_PROMPT',
    execution_time_ms: Math.max(0, new Date(endedAt).getTime() - new Date(startedAt).getTime()),
    start_time: startedAt,
    end_time: endedAt,
    version: '2.0' as const,
    mode: 'GOVERNED_PROMPT',
    governed: true,
  };
}

function sendSse(res: express.Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function install() {
  if (installed) return;
  installed = true;

  const originalPost = express.application.post;

  express.application.post = function patchedPost(this: express.Application, path: any, ...handlers: any[]) {
    if (path === '/api/pca/stream') {
      const app = this;

      // Dedicated API: returns the governed package as JSON for external AI clients.
      originalPost.call(
        app,
        '/api/pca/governed-prompt',
        async (req: express.Request, res: express.Response) => {
          try {
            const body = req.body || {};
            const question = String(body.question || '').trim();
            if (!question) {
              return res.status(400).json({ success: false, error: 'question is required' });
            }

            const pkg = buildGovernedPromptPackage({
              question,
              objective: body.objective,
              evidence: Array.isArray(body.evidence) ? body.evidence : [],
              claims: Array.isArray(body.claims) ? body.claims : [],
              risks: Array.isArray(body.risks) ? body.risks : [],
            });

            return res.json({ success: true, mode: 'GOVERNED_PROMPT', package: pkg });
          } catch (error: any) {
            return res.status(500).json({ success: false, error: error?.message || 'Failed to build governed prompt package' });
          }
        }
      );

      // Add a first-pass route. Normal requests call next() and then execute
      // the original Standard Mode route registered below.
      originalPost.call(
        app,
        '/api/pca/stream',
        async (req: express.Request, res: express.Response, next: express.NextFunction) => {
          const rawQuestion = String(req.body?.question || '').trim();
          if (!isGovernedQuestion(rawQuestion)) return next();

          const question = stripGovernedPrefix(rawQuestion);
          if (!question) {
            return res.status(400).json({ success: false, error: 'A question is required after /governed' });
          }

          try {
            const body = req.body || {};
            const pkg = buildGovernedPromptPackage({
              question,
              objective: body.objective,
              evidence: Array.isArray(body.evidence) ? body.evidence : [],
              claims: Array.isArray(body.claims) ? body.claims : [],
              risks: Array.isArray(body.risks) ? body.risks : [],
            });

            const startedAt = new Date().toISOString();
            const endedAt = new Date().toISOString();
            const pcaState = buildGovernedPcaState(pkg, startedAt, endedAt);

            res.status(200);
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            if (typeof (res as any).flushHeaders === 'function') (res as any).flushHeaders();

            sendSse(res, 'pipeline_stage', {
              stage: 10,
              name: 'GOVERNED_PROMPT',
              message: 'Building governed prompt package'
            });
            sendSse(res, 'state', pcaState);
            sendSse(res, 'complete', {
              text: JSON.stringify(pkg, null, 2),
              mode: 'GOVERNED_PROMPT',
              governedPromptPackage: pkg,
              pcaState,
            });
            sendSse(res, 'done', { mode: 'GOVERNED_PROMPT' });
            res.write('data: [DONE]\n\n');
            return res.end();
          } catch (error: any) {
            if (!res.headersSent) return res.status(500).json({ success: false, error: error?.message || 'Failed to build governed prompt package' });
            sendSse(res, 'error', { error: error?.message || 'Failed to build governed prompt package' });
            return res.end();
          }
        }
      );
    }

    return originalPost.call(this, path, ...handlers);
  } as typeof express.application.post;
}

install();
