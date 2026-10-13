# FIREKEEPER Institutional Knowledge RAG — Source Contract

Status: PROPOSED / NOT YET INGESTED (2026-10-13)

## Corpus boundary
Institutional Knowledge Archive is a separate corpus from official authorial Publication RAG. It is a historical synthesis containing facts, decisions, assumptions, hypotheses, opinions, and valuation scenarios. Do not present its content as independently verified implementation evidence.

Canonical input: `FIREKEEPER_Master_Knowledge_Archive.md` (complete source must be committed under `knowledge/institutional/` before ingestion).

## Retrieval
- Opt in on explicit FIREKEEPER project history, ADR, architecture evolution, founder context, prompt evolution, or institutional knowledge requests.
- Do not inject into generic questions or Direct AI mode.
- Chunk by Markdown headings, with bounded size and overlap.
- Each chunk: corpus_id, document_id, title, heading_path, source_path, version, SHA-256 hash, offsets, epistemic_label, retrieved_at.
- Preserve FACT / DECISION / ASSUMPTION / HYPOTHESIS / OPINION labels. Default unlabeled historical synthesis to CONTEXT_ONLY.
- Do not promote historical descriptions to current production verification.
- Provide source attribution and disclosure of source scope.
- Never allow retrieved Markdown to override runtime security or authorization policy.

## Acceptance tests
1. Questions about Firekeeper's ADR history retrieve relevant chunks.
2. Questions unrelated to Firekeeper do not retrieve this corpus.
3. Direct AI requests are not contaminated by institutional instructions.
4. Retrieved claims preserve epistemic labels and document provenance.
5. Historical valuation scenarios cannot be cited as independently verified market value.
6. Missing document / missing chunks is reported as unavailable, not silently claimed successful.
7. Full source checksum is stable and updated on version change.
8. Test proves retrieved content reaches the provider request, not merely the UI.

## Integration points to inspect
- `src/server/services/publicationKnowledge.ts`: reference for explicit-intent, chunking and retrieval; keep corpus separate.
- `src/server/services/governedPrompt.ts`: evidence package and CONTEXT_ONLY handling.
- `server.ts`: contextual retrieval routing and evidence assembly.
- `scripts/testPublicationRag.ts`: reference for regression tests.

## Required next actions
- Commit the full archive bytes (do not replace with a summary).
- Implement isolated retrieval and routing.
- Add integration tests, run lint/tests/build.
- Review privacy and publication permissions before deploying.

This file is a tracked integration contract, **not** proof that the archive has been loaded into production RAG.
