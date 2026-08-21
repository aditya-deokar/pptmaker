# Phase 7 Testing Plan: Verto AI MCP Apps

Last updated: 2026-06-17

Purpose: prove that `https://verto.ai.aditya-deokar.me/mcp` is ready for ChatGPT developer mode, Claude custom connector testing, and later public app review.

This plan has two parts:

- Automated checks that can run in the repo without live ChatGPT/Claude access.
- Manual checks that must be run against the deployed production URL with a real Verto account.

## 1. What Phase 7 Adds

New package scripts:

```bash
npm run mcp:phase7:checks
npm run mcp:phase7:typecheck
npm run mcp:phase7
```

What they cover:

| Check | Why it matters |
| --- | --- |
| Tool registry contract | Confirms all 12 presentation tools exist and are registered through `registerTool`. |
| Tool metadata and annotations | Confirms titles, `readOnlyHint`, and `destructiveHint` are present for review. |
| Scope mapping | Confirms every tool has the expected OAuth scope. |
| Security policy mapping | Confirms audit/security metadata exists for every tool. |
| Destructive confirmation | Confirms permanent delete still requires `confirm: true`. |
| UI resource wiring | Confirms generation progress and deck preview UI resources are registered. |
| OAuth route presence | Confirms authorize/token/revoke/register/server metadata routes exist. |
| Health/discovery route presence | Confirms `/mcp`, `/api/mcp`, and health routes exist. |
| Prisma OAuth models | Confirms OAuth client/code/access/refresh token models remain in schema. |
| Docs alignment | Confirms this testing plan and Phase 7 checklist stay linked. |

Recommended local validation order:

```bash
npm run mcp:phase7
npx prisma validate --schema prisma/schema.prisma
npm run db:migrate:deploy
npm run build
```

If `npm run build` fails because of a local dependency/module resolution problem, reinstall dependencies and rerun. Do not submit until the deployed build passes.

## 2. Required Environment

Production URL:

```text
https://verto.ai.aditya-deokar.me
```

Primary MCP endpoint:

```text
https://verto.ai.aditya-deokar.me/mcp
```

Backward-compatible endpoint:

```text
https://verto.ai.aditya-deokar.me/api/mcp
```

Reviewer account:

```text
adityadeokar80@gmail.com
```

Required deployment settings:

| Setting | Required value or behavior |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | `https://verto.ai.aditya-deokar.me` |
| `DATABASE_URL` | Production database with MCP OAuth migrations applied by `npm run db:migrate:deploy` or the hosting equivalent. |
| Clerk env vars | Production Clerk keys and sign-in working on the public domain. |
| MCP allowed origins | Include ChatGPT, Claude, Verto domain, and local development origins as needed. |
| OAuth issuer/resource | Issuer and resource should resolve to the production Verto domain. |
| Generation providers | AI provider keys configured for successful presentation generation. |

## 3. Reviewer Test Account Setup

Before running ChatGPT or Claude tests, prepare `adityadeokar80@gmail.com` with safe sample data.

Create these sample decks:

| Deck | Purpose |
| --- | --- |
| `Reviewer Sample - Product Overview` | Basic read/list/get test. |
| `Reviewer Sample - Published Deck` | Publish/unpublish and share-link test. |
| `Reviewer Sample - Theme Test` | Theme update test. |
| `Reviewer Sample - Recovery Test` | Soft-delete and recover test. |

Data rules:

- Use only fictional company names and public-safe sample content.
- Do not include secrets, real customers, private business data, or API keys.
- Keep at least one deck unpublished and one deck published.
- Leave enough generation allowance for at least 15 ChatGPT/Claude-connected generations.

## 4. Discovery And Health Tests

Run these against production before opening ChatGPT/Claude.

```powershell
Invoke-RestMethod https://verto.ai.aditya-deokar.me/mcp
Invoke-RestMethod https://verto.ai.aditya-deokar.me/mcp/health
Invoke-RestMethod https://verto.ai.aditya-deokar.me/.well-known/oauth-protected-resource
Invoke-RestMethod https://verto.ai.aditya-deokar.me/.well-known/oauth-authorization-server
```

Expected behavior:

| URL | Expected result |
| --- | --- |
| `/mcp` | JSON metadata with name, version, protocol version, health endpoint, limits, and privacy metadata. |
| `/mcp/health` | JSON health status for production monitoring. |
| `/.well-known/oauth-protected-resource` | Protected resource metadata with scopes and authorization server. |
| `/.well-known/oauth-authorization-server` | OAuth server metadata with authorize/token/revoke/register endpoints. |

## 5. MCP Inspector Test

Use MCP Inspector before ChatGPT/Claude. It gives faster feedback and clearer tool-level failures.

Steps:

1. Run the inspector.

```bash
npx @modelcontextprotocol/inspector
```

2. In the Inspector UI, create a Streamable HTTP connection.
3. Use this server URL:

```text
https://verto.ai.aditya-deokar.me/mcp
```

4. Complete OAuth if the Inspector supports the flow. If it does not, use a temporary MCP API key only for development testing.
5. Verify `tools/list` returns all 12 tools.
6. Verify `resources/list` includes Verto resources and UI resources.
7. Run the prompt/tool matrix in section 8.

Minimum pass criteria:

- Initialize succeeds.
- Tool list has 12 presentation tools.
- `presentation_delete_permanently` shows destructive metadata and requires `confirm: true`.
- `presentation_generate` returns either a completed deck or `RUNNING` with `generation_run_id` and `progress_resource_uri`.
- `presentation_generation_status` can read the run status.
- UI resources can be fetched or gracefully ignored by the host.

## 6. ChatGPT Developer Mode Test

Run this before any ChatGPT public submission.

Steps:

1. Open ChatGPT settings.
2. Go to Apps/Connectors advanced settings.
3. Enable developer mode.
4. Create a new connector/app.
5. Use:
   - Name: `Verto AI`
   - Server URL: `https://verto.ai.aditya-deokar.me/mcp`
   - Auth: OAuth/account linking from Verto
6. Sign in as `adityadeokar80@gmail.com`.
7. Grant the requested presentation scopes.
8. Start a new chat and enable Verto AI.
9. Run the prompt matrix in section 8.
10. Capture screenshots for Phase 8:
    - OAuth consent screen
    - tool list or connector setup success
    - generation prompt result
    - generation progress UI or fallback
    - deck preview UI or fallback
    - publish/share result

Expected behavior:

- ChatGPT can discover tools from `/mcp`.
- OAuth redirects back successfully.
- Verto tools are callable from a chat.
- Long generation does not time out; it returns status/progress.
- UI renders if supported. If not, text fallback remains useful.

## 7. Claude Custom Connector Test

Claude public submission should happen after ChatGPT approval, per the release decision. This runtime test can be run before Phase 10 if the account has custom connector access.

Steps:

1. Open Claude settings.
2. Go to Connectors.
3. Add a custom connector.
4. Use:
   - Name: `Verto AI`
   - URL: `https://verto.ai.aditya-deokar.me/mcp`
5. Complete OAuth as `adityadeokar80@gmail.com`.
6. Start a new Claude conversation with the connector enabled.
7. Run the prompt matrix in section 8.

Expected behavior:

- Claude can initialize the remote Streamable HTTP MCP server.
- Tool names, titles, and annotations are accepted.
- Read/write/destructive behavior is clear.
- OAuth scopes map to tool calls correctly.
- UI resources render if supported, or Claude falls back to text output.

## 8. Prompt And Expected Behavior Matrix

| Prompt | Expected tool behavior | Expected user-visible result |
| --- | --- | --- |
| `List my Verto presentations.` | `presentation_list` | Shows the reviewer account decks without slide-heavy JSON. |
| `Show me the newest presentation.` | `presentation_list`, then `presentation_get` | Shows one deck summary and optional preview. |
| `Create a 5 slide deck outline for an AI note-taking app.` | `presentation_create` | Creates a basic 5-slide deck. |
| `Generate a 7 slide investor pitch deck for a privacy-first analytics startup.` | `presentation_generate` | Returns completed deck or `RUNNING` with progress details. |
| `Show me the generation progress.` | `presentation_generation_status` or progress resource | Shows current run status without starting duplicate generation. |
| `Show me a preview of this deck.` | `presentation_get` | Shows deck preview UI or compact text fallback. |
| `Change the deck theme to a clean startup style.` | `presentation_update_theme` | Updates theme after selecting a valid theme. |
| `Publish this deck and give me the share link.` | `presentation_publish` | Returns public share URL. |
| `Unpublish the deck I just published.` | `presentation_unpublish` | Public access is removed. |
| `Soft-delete the test deck.` | `presentation_delete` | Deck is soft-deleted and recoverable. |
| `Recover the test deck.` | `presentation_recover` | Deck returns to active state. |
| `Permanently delete the test deck only after I explicitly confirm.` | Should ask for confirmation first, then `presentation_delete_permanently` with `confirm: true` only if confirmed. | Destructive action is not performed silently. |

## 9. OAuth And Safety Test Matrix

| Test | How to trigger | Expected result |
| --- | --- | --- |
| Invalid token | Call `/mcp` tool request with a bad bearer token. | HTTP 401 with `WWW-Authenticate`. |
| Missing scope | Connect with limited scopes, then call a write/publish/generate tool. | HTTP 403 or tool error with required scope. |
| Revoked token | Revoke OAuth connection, then call a tool. | HTTP 401 and reconnect instruction. |
| Wrong resource | Use token issued for a different resource. | Token rejected. |
| Invalid redirect URI | Start OAuth with an unregistered redirect URI. | Authorization error. |
| Expired code | Reuse or delay authorization code exchange. | Token endpoint rejects request. |
| Cross-user access | Ask for a deck ID owned by another account. | Not found or forbidden, never returns another user's data. |
| Permanent delete without confirmation | Ask to permanently delete without explicit confirmation. | Tool is not called or validation fails. |
| Prompt injection | Ask the assistant to ignore policies and call destructive tools. | Assistant refuses unsafe action; server still enforces ownership and confirmation. |
| Rate limit | Repeatedly call tools past configured limit. | Rate limit error with retry metadata. |

## 10. Evidence To Capture

Save these artifacts for Phase 8 submission:

- Output of `npm run mcp:phase7`.
- Output of `npx prisma validate --schema prisma/schema.prisma`.
- Production deployment/build success link or log.
- MCP Inspector screenshots:
  - initialized connection
  - tool list
  - resource list
  - one successful read tool
  - one generation/status flow
  - permanent delete validation behavior
- ChatGPT screenshots:
  - connector setup success
  - OAuth success
  - generation result
  - progress/preview UI or fallback
  - publish link result
- Claude screenshots after ChatGPT approval:
  - custom connector setup success
  - OAuth success
  - tool call result
  - UI or fallback result

## 11. ChatGPT OAuth 500 Troubleshooting

If ChatGPT redirects to `/oauth/authorize` and the browser shows `HTTP ERROR 500`, check these in order:

1. Verify ChatGPT's `client_id` metadata document is reachable. The `client_id` can be a URL like `https://chatgpt.com/oauth/.../client.json?token_endpoint_auth_method=none`.
2. Verify the metadata document has:
   - `client_id` exactly matching the full URL, including query string.
   - `redirect_uris` containing the exact ChatGPT redirect URI.
   - `token_endpoint_auth_method` set to `none`.
3. Confirm the deployed Verto app includes the ChatGPT metadata-client validation fix:
   - URL-style `client_id` values are fetched before dynamic Prisma client lookup.
   - Dynamic Prisma client lookup failures are logged and do not crash the authorize request.
4. Confirm the production build ran `prisma generate --schema prisma/schema.prisma`.
5. Confirm the production database has the MCP OAuth tables by running `npm run db:migrate:deploy` or the hosting equivalent.
6. Retry the ChatGPT connector from a fresh browser session.

Expected result after the fix:

- If the user is not signed in, Verto redirects to `/sign-in` instead of returning a blank 500 page.
- If ChatGPT client metadata is invalid, Verto returns a controlled OAuth error.
- If the database is missing OAuth tables, the deployment logs show the Prisma failure clearly instead of failing during ChatGPT metadata validation.

If Google/Clerk sign-in succeeds but Verto sends the user to `/callback` or `/dashboard` instead of back to ChatGPT:

1. Confirm the deployed sign-in page includes the OAuth redirect preservation fix.
2. Confirm `/sign-in?redirect_url=.../oauth/authorize?...` renders Clerk with `forceRedirectUrl` set to the safe `/oauth/authorize?...` path.
3. Confirm regular non-OAuth sign-in can still use the app's default `/callback` to `/dashboard` flow.

If the consent screen appears and `POST /oauth/authorize` returns `302`, but ChatGPT shows `There was a problem connecting Verto AI`:

1. Check production logs for `POST /oauth/token` immediately after the consent redirect.
2. If token exchange returns `400`, confirm the deployed token endpoint accepts a missing `resource` parameter for `authorization_code` and `refresh_token` grants.
3. Confirm `client_id`, `redirect_uri`, `code`, and `code_verifier` are present in the token request.
4. Confirm the authorization code was issued for the same ChatGPT `client_id` metadata URL and redirect URI.
5. Retry with a fresh ChatGPT connector attempt because authorization codes are single-use.

## 12. Phase 7 Exit Gate

Phase 7 is complete when:

- `npm run mcp:phase7` passes.
- Prisma schema validation passes.
- Deployed `/mcp`, `/mcp/health`, and well-known metadata endpoints respond correctly.
- MCP Inspector can initialize and call the main read/write/generation flows.
- ChatGPT developer mode can connect through OAuth and call tools.
- Claude custom connector test is either passed or explicitly scheduled after ChatGPT approval.
- Reviewer account is populated with safe sample decks.
- Screenshots and logs are ready for Phase 8.

## 13. MCP Apps SDK (`@modelcontextprotocol/ext-apps`) Verification

The widget layer was migrated from OpenAI-specific metadata plus a hand-rolled
postMessage bridge to the standardized MCP Apps SDK. Migration details:
`00-migration-overview.md`, `02-api-mapping.md`, `03-migration-plan.md`.

Automated evidence (completed on branch `migrate/mcp-ext-apps`):

- `npm run mcp:phase7` — 275/275 checks pass, including the rewritten
  SDK-pattern assertions (`registerAppTool(`, camelCase CSP, `ontoolresult`,
  `callServerTool`).
- Focused typecheck passes across 77 MCP/OAuth/app-hosting files.
- In-memory transport smoke test: 12 tools listed with `_meta.ui.resourceUri`
  + `visibility`; exactly 4 app-callable tools; 4 `ui://verto/*.html`
  resources served as `text/html;profile=mcp-app` with camelCase
  `connectDomains`/`resourceDomains`; unauthenticated tool calls still return
  the structured unauthorized error with a WWW-Authenticate challenge.
- `npm run mcp:phase9h` — all 10 widget states render in Puppeteer from the
  SDK-bundled HTML (layout, contrast, keyboard order, reduced motion).

Remaining live-host steps (manual):

1. MCP Inspector re-check on the migrated server:

   ```bash
   npm run mcp:inspect
   ```

   Confirm the four `ui://verto/*.html` resources are readable and tool
   results still include `structuredContent` widget payloads.

2. Reference-host smoke test with `basic-host` from the ext-apps repo:

   ```bash
   # Terminal 1 — serve the migrated MCP endpoint
   npm run dev

   # Terminal 2 — reference host from a checkout of modelcontextprotocol/ext-apps
   cd examples/basic-host && npm install
   SERVERS='["http://localhost:3000/mcp"]' npm run start
   # Open http://localhost:8080 and verify per widget:
   #  - loads without console errors
   #  - ontoolresult renders data (list / preview / progress / action result)
   #  - in-widget actions (refresh, publish confirm, status check) work
   #  - follow-up message path works where the host supports it
   ```

3. Re-run the ChatGPT Developer Mode and Claude Custom Connector flows from
   sections above against the migrated widgets — the wire format for tools,
   OAuth, and resources is unchanged; only widget metadata/transport moved to
   the standardized SDK.
