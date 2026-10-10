# Authorizing AI agents with OPA

**Live:** [agents.shiben.dev](https://agents.shiben.dev)

An interactive explainer. Pick one of five scenarios, each an AI agent trying to call a tool on someone's behalf, and follow the request through a flow graph:

```
Person → (Untrusted input) → Agent → Tool call → Gateway ⇅ OPA → Tool runs | Human approval | Blocked + logged
```

Every verdict on the page comes from the real Rego policy in [`policy/authz.rego`](policy/authz.rego), compiled to WebAssembly and evaluated in your browser with [`@open-policy-agent/opa-wasm`](https://github.com/open-policy-agent/npm-opa-wasm). Nothing is hard-coded in TypeScript and nothing is sent to a server. Click the OPA node to see the policy block by block, with the value each line resolved to.

## How it fits together

| Path | What it is |
|---|---|
| `policy/authz.rego` | The policy. Single source of truth for the UI, the tests and the expected verdicts. |
| `policy/data.json` | Agents, users, tools, limits, org domain. Loaded into the Wasm at runtime with `setData`. |
| `policy/authz_test.rego` | `opa test` suite: scenario-driven tests plus edge cases. |
| `scenarios/scenarios.json` | The 5 scenarios: display metadata, OPA input, expected verdict. Read by both `opa test` and the UI. |
| `scripts/build-policy.sh` | `fmt → check --strict → test → build -t wasm`, then writes `public/policy.wasm` and `public/test-summary.json`. |
| `public/policy.wasm` | Generated and committed. CI fails if it is stale. |
| `lib/opa.ts` | Fetches `/policy.wasm` once, loads `data.json`, `evaluate(input) → PolicyResult`. No fallback logic. |
| `lib/trace.ts` | Formats `result.evidence` and `result.checks` against the Rego source lines. No authorization logic. |
| `components/` | Scenario picker, flow graph, detail views, OPA Evaluate and Build tabs. |

The policy has four layers and three outcomes:

1. **agent_granted**: the agent may only call tools it was explicitly given.
2. **user_permitted**: the person the agent acts for must hold every permission the tool needs (stops the confused deputy).
3. **args_ok**: arguments inside limits (internal recipients only, payments under the limit).
4. **needs_approval**: after reading untrusted content, any side-effecting call needs a human.

`decision` is `allow`, `needs_approval` or `deny`, and defaults to `deny`. The Wasm entrypoint is `agent/authz/result`, which also returns `checks`, `failed` and `evidence` so the UI never has to recompute a decision.

## Run it locally

Requires Node 22+ and pnpm 10.

```bash
pnpm install
pnpm dev
```

```bash
pnpm test        # Vitest: all scenarios through public/policy.wasm, trace ↔ Rego source sync
pnpm typecheck
pnpm build
```

## Edit the policy

1. Change `policy/authz.rego`, `policy/data.json` or `scenarios/scenarios.json`.
2. Rebuild and test with the pinned OPA version (the script refuses any other version, because a different compiler can emit a different Wasm):

   ```bash
   pnpm policy                     # uses `opa` on your PATH
   OPA=/path/to/opa pnpm policy    # or point at a specific binary
   ```

3. Commit `public/policy.wasm` and `public/test-summary.json` along with your change.

No TypeScript change is needed for a data or policy change to show up in the UI. For example, lower `limits.payment_inr` below 40000 and the "Web page sets the amount" scenario flips from NEEDS APPROVAL to DENY. If a new display needs a value the policy doesn't return, add it to `evidence` in Rego rather than computing it in `lib/trace.ts`.

## Pinned versions

| Tool | Version | Notes |
|---|---|---|
| OPA CLI | **1.21.1** | Pinned in `scripts/build-policy.sh` and `.github/workflows/policy.yml`. Wasm ABI 1.3. |
| `@open-policy-agent/opa-wasm` | **1.10.0** | Latest release. Confirmed to load and evaluate Wasm built by OPA 1.21.1 (see `tests/opa.test.ts`). |
| Next.js | 16.4.0 | App Router, static output. |

`pnpm audit` reports one moderate advisory in `sprintf-js`, pulled in by opa-wasm for the `sprintf` builtin. That builtin isn't reachable from the compiled entrypoint here, and there is no patched release yet.

## CI

`.github/workflows/policy.yml` has two jobs:

- **policy**: installs OPA 1.21.1, runs `scripts/build-policy.sh`, then `git diff --exit-code public/`. The deployed Wasm is always the tested one.
- **app**: `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Deploy

Vercel project `agents-opa`, connected to this repo, building with the Next.js preset. Vercel has no OPA binary, which is why the Wasm is committed. Domain: `agents.shiben.dev` (Vercel DNS). No analytics, no cookies.

All names and domains in the data are fictional; `.example` is reserved for exactly this.
