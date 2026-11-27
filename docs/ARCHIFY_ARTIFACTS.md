# Archify-inspired Interactive Artifacts (experimental)

This branch introduces a standalone, offline-viewable HTML architecture explorer at `public/artifacts/pca-architecture.html`.

## Scope and safety
- Inspired by self-contained interactive HTML artifacts; **does not embed or install the upstream Archify code**.
- The artifact uses only local CSS and JavaScript; no external scripts, CDN, authentication tokens, or network calls.
- It documents the **current README's PCA stage names**, including the conditional stage 9.5 and separate human approval workflow.
- This is a static architecture explainer, **not a live execution trace or a verified audit report**.
- It does not alter the Normal/Governed mode router, API, LLM providers, audit data, or permissions.

## Usage
Run the existing Vite application and open `/artifacts/pca-architecture.html`, or download that HTML and open it directly in a browser. Click any stage to see details. Use Print to save as PDF.

## Validation required before merge
1. Run `npm ci && npm run lint && npm run build`.
2. Verify the HTML opens offline and stage selection works with keyboard and touch.
3. Confirm no changes to existing chat, governance, and authentication behavior.
4. Review CSP/deployment settings if embedding this artifact into the app later.

## Follow-up integration
A governed, user-specific execution graph must be built from a validated, permission-filtered audit API. Do not embed raw prompts, keys, personal data, or unverified claims in shareable artifacts. Add access controls and redaction before exposing export from live decisions.
