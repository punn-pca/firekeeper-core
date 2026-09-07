import express from 'express';
import { buildGovernedPromptPackage, GovernedPromptEvidence } from './governedPrompt';
import { performWebSearch } from './webSearch';

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

function inferObjective(question: string, type: string): string {
  if (type === 'decision_support' || type === 'comparative_analysis') {
    return `Support a decision about: ${question}. Compare relevant options, trade-offs, evidence strength, risks, and unknowns without making the final decision for the user.`;
  }
  if (type === 'technical') return `Provide a technically grounded answer to: ${question}, distinguishing documented facts from recommendations and assumptions.`;
  if (type === 'legal_policy') return `Provide a source-grounded analysis of: ${question}, distinguishing authoritative requirements from interpretation and uncertainty.`;
  return `Produce a well-grounded answer to: ${question}, using retrieved evidence and explicit uncertainty.`;
}

function normalizeClientEvidence(value: unknown): GovernedPromptEvidence[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 20).map((item: any, index) => ({
    id: String(item?.id || `CLIENT-E-${String(index + 1).padStart(3, '0')}`),
    claim: String(item?.claim || item?.content || '').trim(),
    source: String(item?.source || 'Client-supplied evidence').trim(),
    credibility: typeof item?.credibility === 'number' ? Math.max(0, Math.min(1, item.credibility)) : 0.50,
    // Client-provided material is never promoted to VERIFIED automatically.
    status: 'UNVERIFIED' as const,
    url: typeof item?.url === 'string' ? item.url : undefined,
    relevance: typeof item?.relevance === 'number' ? Math.max(0, Math.min(1, item.relevance)) : undefined,
  })).filter((item) => item.claim || item.source);
}

async function prepareGovernedPackage(body: any, question: string) {
  const preliminary = buildGovernedPromptPackage({ question });
  const queryType = preliminary.query.type;
  const objective = body.objective || inferObjective(question, queryType);

  let evidence = normalizeClientEvidence(body.evidence);
  let searchStatus = 'NOT_REQUESTED';

  // GOVERNED_PROMPT retrieves live public evidence by default. Callers can
  // explicitly disable retrieval with webSearch=false for offline preparation.
  if (body.webSearch !== false) {
    const search = await performWebSearch(question, { maxResults: 8, forceFresh: true });
    searchStatus = search.success ? 'RETRIEVED' : 'NO_RESULTS';

    const liveEvidence: GovernedPromptEvidence[] = search.results.map((result) => ({
      id: result.id,
      claim: result.snippet,
      source: result.title || result.sourceDomain,
      credibility: Math.max(0, Math.min(1, result.credibilityScore ?? 0.5)),
      // Retrieval alone is not claim verification.
      status: 'UNVERIFIED',
      url: result.url,
      relevance: result.relevanceScore,
      retrieved_at: search.retrievedAt,
    }));

    evidence = [...evidence, ...liveEvidence].slice(0, 20);
  }

  const claims = evidence.map((item) => ({
    id: `CLM-${item.id}`,
    text: item.claim,
    category: 'FACT_CANDIDATE',
    evidence: [item.id],
    status: 'UNTESTED',
    confidence: Math.min(0.70, Math.max(0.20, item.credibility * 0.70)),
  }));

  const risks: any[] = [];
  if (evidence.length === 0) {
    risks.push({
      type: 'EVIDENCE_GAP',
      severity: 'MEDIUM',
      description: 'No external evidence was retrieved or supplied. The external model must not invent missing support.'
    });
  }
  if (queryType === 'decision_support' || queryType === 'comparative_analysis') {
    risks.push({
      type: 'DECISION_CONTEXT_GAP',
      severity: 'MEDIUM',
      description: 'Final recommendation depends on project-specific constraints, priorities, costs, and operational requirements not necessarily present in the query.'
    });
  }

  return buildGovernedPromptPackage({
    question,
    objective,
    evidence,
    claims,
    risks,
  });
}

function install() {
  if (installed) return;
  installed = true;

  const originalPost = express.application.post;

  express.application.post = function patchedPost(this: express.Application, path: any, ...handlers: any[]) {
    if (path === '/api/pca/stream') {
      const app = this;

      originalPost.call(
        app,
        '/api/pca/governed-prompt',
        async (req: express.Request, res: express.Response) => {
          try {
            const body = req.body || {};
            const question = String(body.question || '').trim();
            if (!question) return res.status(400).json({ success: false, error: 'question is required' });
            const pkg = await prepareGovernedPackage(body, question);
            return res.json({ success: true, mode: 'GOVERNED_PROMPT', package: pkg });
          } catch (error: any) {
            return res.status(500).json({ success: false, error: error?.message || 'Failed to build governed prompt package' });
          }
        }
      );

      originalPost.call(
        app,
        '/api/pca/stream',
        async (req: express.Request, res: express.Response, next: express.NextFunction) => {
          const rawQuestion = String(req.body?.question || '').trim();
          if (!isGovernedQuestion(rawQuestion)) return next();

          const question = stripGovernedPrefix(rawQuestion);
          if (!question) return res.status(400).json({ success: false, error: 'A question is required after /governed' });

          try {
            const pkg = await prepareGovernedPackage(req.body || {}, question);

            res.status(200);
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            if (typeof (res as any).flushHeaders === 'function') (res as any).flushHeaders();

            sendSse(res, 'pipeline_stage', {
              stage: 10,
              name: 'GOVERNED_PROMPT',
              message: pkg.audit.evidence_count > 0
                ? `Built governed package with ${pkg.audit.evidence_count} evidence item(s)`
                : 'Built governed package without external evidence'
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
