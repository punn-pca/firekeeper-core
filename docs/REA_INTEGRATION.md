# REA integration (opt-in, development only)

This repository includes an **example** MCP client configuration for [REA](https://github.com/morluto/rea). It does not install or activate REA in Firekeeper, and it does not expose reverse-engineering tools to users.

## Requirements

- Node.js 24.11+ (or another version supported by REA).
- An MCP client capable of launching a local stdio server.
- Authorization to inspect the target software.

## Configuration

See `config/rea.mcp.example.json`. Copy the `mcpServers.rea` entry into your **local MCP client** configuration, after verifying the current command against upstream REA documentation. The example uses `npx` and downloads the latest package on first use. For reproducibility, pin a reviewed REA version before deployment.

REA's interactive setup is the supported way to register it with compatible coding agents:

```sh
npx rea-agents setup
```

Review all changes proposed by setup. Never run the setup command in Cloud Run production.

## Smoke test

```sh
node scripts/testReaConfig.mjs
```

The smoke test validates the shape of the example only. It does **not** start REA, verify the actual MCP transport, or test Firekeeper's MCP manager. Test real connectivity separately in a sandbox before integration.

## Security boundary

- Do not enable REA for anonymous or untrusted users.
- Keep it on an isolated developer workstation or analysis worker, not the public chat server.
- Restrict target paths and process execution; require explicit human approval for active inspection.
- Do not upload proprietary targets or analysis output without authorization.
- Do not treat analysis findings as verified governance evidence without provenance and review.
