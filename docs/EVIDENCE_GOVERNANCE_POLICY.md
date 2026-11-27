# Evidence Governance Policy (Runtime Contract)

This document describes enforced runtime boundaries; it is not a certification claim.

## Claim status vs. evidence verification

- `VERIFIED`: the shared verifier returned `VERIFIED` under an explicit verification method and explicit semantic `SUPPORTS` link.
- `UNVERIFIED`: evidence is absent, provenance is not traceable, or the verification gate did not establish support.
- `CONTRADICTED`: an explicit `CONTRADICTS` relation points to evidence with non-empty source/content and a traceable URL, locator, or document ID.

The evidence verification field remains separate (for example `PARTIALLY_VERIFIED` or `CONFLICTING`). Lexical overlap and source authority alone do not establish claim truth.

## Claim ledger disclosures

The pre-output quality gate records claim status, linked evidence identifiers, source URL/locator/document ID, publication date when supplied, limitations, and per-claim confidence. Confidence is `null` when this gate has no calibrated per-claim measurement; it must not fabricate a score.

## Decision Gap inventory

Callers may provide three independent lists:
- `availableData`: inspected information already available.
- `missingData`: information known to be absent and relevant to the conclusion.
- `verificationRequired`: existing or external records that still need checking.

The runtime helper normalizes and deduplicates these lists but never guesses which records exist. Do not fill the lists from assumptions.

## PCA trace completion

A canonical stage is counted as executed only when the runtime trace contains a matching stage, finite start/end timestamps in order, and an output object. A generated display row or a stage declaration is not proof of execution. If all 12 stages do not meet this condition, the execution trace must report `PARTIAL`, label unrecorded rows `NOT_RECORDED`, and must not claim all 12 stages completed.

## Regression coverage

`scripts/testEvidenceGovernanceCore.ts` covers:
- lexical overlap without semantic verification remains `UNVERIFIED`;
- traceable explicit contradiction maps to `CONTRADICTED`, while an untraceable contradiction does not;
- Decision Gap categories remain separate and do not invent data;
- stages without recorded timing/output do not count as completed;
- trace output and mobile stage counts cannot default to 12 completed stages.

`scripts/testPreOutputQualityGate.ts` covers claim-ledger status, provenance fields, limitations, null confidence, and explicit Decision Gap inventory.
