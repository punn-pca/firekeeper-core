import express from 'express';
import { buildGovernedPromptPackage } from './governedPrompt';

/**
 * Additive integration for GOVERNED_PROMPT mode.
 * Standard /api/pca/stream requests are untouched unless the question starts
 * with /governed or /governed-prompt.
 */

let installed = false;

function isGovernedQuestion(question: unknown): boolean {
  return /^\/(?:governed|governed-prompt)(?:\s|$)/i.test(String(question || '').trim());
}

function stripGovernedPrefix(question: string): string {
  return question.replace(/^\/(?:governed|governed-prompt)\s*/i, '').trim();
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

      // Dedicated JSON API for external AI clients.
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

      // First-pass route. Normal requests fall through to the original Standard Mode route.
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

            res.status(200);
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            if (typeof (res as any).flushHeaders === 'function') (res as any).flushHeaders();

            // IMPORTANT: do not emit a fake PCAState. GOVERNED_PROMPT is a preparation
            // artifact, not a completed PCA execution, so the normal PCA renderers must
            // not receive a partial state object.
            sendSse(res, 'pipeline_stage', {
              stage: 10,
              name: 'GOVERNED_PROMPT',
              message: 'Building governed prompt package'
            });
            sendSse(res, 'complete', {
              text: JSON.stringify(pkg, null, 2),
              mode: 'GOVERNED_PROMPT',
              governedPromptPackage: pkg,
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
