# Firekeeper AI Passport Companion

## Purpose

The AI Passport Companion is a separate Firekeeper capability for working with AI providers accessed through TH-AI Passport/AiPASS or directly.

It treats Firekeeper as an epistemic and governance layer rather than as another AI provider.

## Current integration boundary

This implementation is intentionally **user-mediated**:

1. Firekeeper generates a governed prompt.
2. The user submits that prompt to the selected AI provider.
3. The user pastes the AI response back into Firekeeper.
4. Firekeeper can verify the response using its existing evidence and governance pipeline.
5. The human retains final decision authority.

The companion does not call, scrape, automate, or depend on private AiPASS APIs, API keys, tokens, or internal endpoints.

## Architecture

```text
User
  |
  v
Firekeeper AI Passport Companion
  |  governed prompt
  v
AiPASS / AI Provider (user mediated)
  |  generated response
  v
Firekeeper verification pipeline
  |  evidence / claims / uncertainty
  v
Human decision
```

## Package contract

`buildAIPassportCompanionPackage()` returns:

- `mode: AI_PASSPORT_COMPANION`
- `integration: USER_MEDIATED`
- provider metadata
- governed prompt
- original governed package
- explicit workflow stages
- integration constraints
- a verification input contract for the returned AI response

## Future official integration

A future official integration can replace the user-mediated transport layer without changing the governance contract. Any direct AiPASS integration must be implemented only through an officially supported API/integration agreement.
