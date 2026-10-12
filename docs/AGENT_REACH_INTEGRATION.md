# Agent Reach integration — experimental

This PR adds a **disabled-by-default** read-only adapter, not a live integration.

## Security boundaries

- Do not install Agent Reach or its dependencies in the Firekeeper production container.
- Operate the Agent Reach service separately, with an explicit HTTPS API contract.
- The bridge expects POST JSON `{query,mode:"read_only",limit:5}` and a JSON `{results:[{url,title,content}]}` response. **This is a proposed wrapper contract, not an upstream Agent Reach API guarantee.**
- No credentials, cookies, local execution, or write/execute tools are exposed through this adapter.
- All retrieved content is untrusted and tagged `unverified`. It must pass the existing evidence validation and provenance pipeline before use.
- URL validation and guarded outbound fetching are required. Deployment must also enforce network egress restrictions and service-to-service authentication.
- Requests time out after 8 seconds and response processing is size-limited.

## Activation plan

1. Review upstream Agent Reach licensing, dependencies, deployment model, and security.
2. Implement and authenticate a separate wrapper service; establish the exact API schema.
3. Add server-side configuration, authenticated invocation, per-user quotas, audit logs, and human approval for any non-read operations.
4. Integrate into the existing retrieval/evidence pipeline, preserving source URLs and verification states.
5. Add mock integration, SSRF, failure, timeout, authorization, and Cloud Run tests.
6. Only then enable behind a feature flag in a controlled pilot.

Run the isolated contract test with `node --import tsx scripts/testAgentReachAdapter.ts`.
