# 03 — Auth & Security Model

> Part of the [architecture deep dive](./README.md). One identity spine, three
> credential types, a self-hosted OAuth 2.1 authorization server, scopes,
> rate limits, and an honest threat/limitation list.

---

## 1. The identity spine

Every credential resolves to **one Prisma `User` row keyed by `clerkId`**:

```mermaid
flowchart LR
    subgraph credentials
        O[OAuth bearer vto_at_…]
        K[API key vk_live_…]
        C[Clerk session cookie]
    end
    O --> M[auth/middleware.ts resolveAuth :48]
    K --> M
    C --> M
    M --> U[(User id = DB UUID<br/>clerkId unique)]
    U --> S[AuthContext {userId, clerkId, tier, scopes}]
    S --> T[Every tool handler]
```

Order of resolution for HTTP: Bearer token first (OAuth access token, then
API key), else Clerk session via `clerk-session.ts`. stdio uses the env API
key only.

**Naming trap worth knowing:** the engine's first parameter is named `userId`
but receives `clerkId` (both surfaces do this consistently —
`tools/presentation/generate.ts:93`, `actions/generatePresentation.ts`). It is
consistent-by-convention; flagged in the audit and slated for rename.

## 2. Self-hosted OAuth 2.1 (why + how)

Public app-directory listings require real user consent flows; delegating to
Clerk alone can't issue MCP-scoped tokens bound to *this* resource. So Verto
runs its own authorization server:

| Endpoint | Purpose |
|---|---|
| `/oauth/authorize` | Consent UI (Clerk-authenticated), PKCE challenge intake |
| `/oauth/token` | Exchange code / refresh |
| `/oauth/register` | Dynamic Client Registration (DCR) |
| `/oauth/revoke` | RFC 7009 revocation (access+refresh atomically) |
| `/.well-known/oauth-protected-resource` | Rewritten by `src/proxy.ts` → route handler; metadata + scope list |
| `/.well-known/oauth-authorization-server` | Server metadata |

```mermaid
sequenceDiagram
    autonumber
    participant Host as ChatGPT/Claude
    participant AS as Verto /oauth/*
    participant Browser as User browser (Clerk login)
    participant API as /mcp

    Host->>AS: GET /oauth/authorize?client_id&redirect_uri&code_challenge(S256)&resource
    AS->>Browser: consent page (Clerk session)
    Browser->>AS: approve
    AS-->>Host: redirect ?code=  (single-use, 10 min TTL)
    Host->>AS: POST /oauth/token {code, code_verifier}
    Note over AS: verifyPkceS256 via timingSafeEqual;<br/>atomic single-use: updateMany({usedAt:null}) + count check
    AS-->>Host: {access_token vto_at_…, refresh_token vto_rt_…} (hashed at rest)
    loop every hour
        Host->>API: Authorization: Bearer …
        API-->>Host: 200 (token.resource validated vs this server)
    end
    Host->>AS: POST /oauth/token (refresh)
    Note over AS: rotation: new pair issued,<br/>old refresh marked revoked+rotated
    Host->>AS: POST /oauth/revoke
    AS-->>Host: transactional revocation of matching pair
```

Implementation details that matter in an interview:

- **Tokens are opaque 32-byte randoms**, stored only as SHA-256 hashes with
  `vto_at_`/`vto_rt_` prefixes (oauth-tokens.ts:64-70). No JWT means no
  revocation problem and no secret-in-token leakage.
- **PKCE is S256-only**; plain is rejected (:178). Comparison uses
  `timingSafeEqual`.
- **Auth codes are single-use atomically** (`updateMany({usedAt: null})` +
  count check) — race-safe without transactions.
- **Resource binding (RFC 8707-style)**: tokens carry `resource`; mismatch on
  use → rejected with normalized-URI comparison.
- **Clients**: DCR issues `vc_…` ids; redirect URIs must be https or loopback;
  public clients only (`token_endpoint_auth_method: none`); CIMD supported
  (fetch client-id metadata document, 3 s timeout, must echo client_id).
- **Known gaps (fixed-list honesty)**: refresh rotation commits the new pair
  before revoking the old outside a transaction (crash window leaves both
  live), and there is no reuse-detection/family-revocation when a rotated
  refresh token is replayed. Both are Phase C3 items.

## 3. Scopes — designed correctly, enforced asymmetrically

Scope map (`auth/scopes.ts:50+`) mirrors tool classes:

| Scope | Tools |
|---|---|
| `presentations:read` | list, get, render_deck*, render_theme_studio* |
| `presentations:generate` | generate, generation_status |
| `presentations:publish` | publish, unpublish |
| `presentations:write` | create, delete, recover, delete_permanently, update_slides, update_theme |

*app-only view tools still require read scope.

The asymmetry to disclose: **third-party OAuth clients get scoped down, but
first-party callers (API keys, Clerk sessions) currently receive ALL scopes**
(`api-key.ts:74`, `clerk-session.ts:50`). This is deliberate for launch
(first-party = the user themselves), but it means the scope system's teeth
only show for directory apps. Phase C5 introduces minimal-scope API keys at
creation time.

## 4. Rate limiting & concurrency

`middleware/rate-limiter.ts`: sliding-window RPM per user + a concurrency
gauge per generation-class tools, enforced inside the error-boundary wrapper
before handlers run. Response headers expose limit state.

Honest limitation: buckets live in a module-level Map — per-process memory.
Resets on deploy; not shared across instances; hourly generation caps come
from the usage metering path instead (`lib/usage-limit.ts`, which also gates
dashboard creation — one meter, two surfaces). Redis-backed limiter is the
Phase C2 fix; the interface already isolates callers from storage.

## 5. Input/output governance

| Control | Where | Value |
|---|---|---|
| Body size | transport | ≤10 MB (`MCP_MAX_REQUEST_BYTES`) |
| JSON depth | transport | ≤20 |
| Title/topic/context lengths | zod schemas | 200 / 500 / 2000 chars |
| Outlines count | zod | ≤30 |
| Permanent-delete batch | zod `confirm: z.literal(true)` | ≤20 ids, irreversible flag |
| Generation wait | zod | default 25 s, max 120 s |
| Output slides | mappers | cap 40 slides / 200 KB with truncation metadata |
| Deck-preview payload | widget-data | cap 50 slides, 180-char preview text |
| Slide content input | schemas | **known hole**: `z.any()` on update_slides content — Phase C4 replaces with a slide schema |

## 6. Prompt-injection & content safety posture

Current defenses are architectural rather than lexical:

1. Widgets escape all interpolated content (`escapeHtml/escapeAttr`) and run
   under empty-CSP sandboxes except allowlisted image origins.
2. Audit redaction keeps user content out of logs.
3. Ownership checks mean injected instructions can't pivot to other users' data.
4. Destructive tool requires literal `confirm: true` in args — model-side
   social pressure alone can't satisfy it without the caller intending it.

What we do NOT claim: no content filtering of slide text returned to models.
That's a roadmap item if directory review demands it; today the blast radius
is bounded by scopes+ownership, not scrubbing.

## 7. Threat-model quick table

| Threat | Defense |
|---|---|
| Stolen bearer token | hashed-at-rest (irrelevant), resource-bound, 1 h TTL, revocation endpoint, audit trail |
| Auth-code interception | PKCE S256 + single-use atomicity + 10 min TTL |
| CSRF on dashboard→MCP confusion | separate credential types; Clerk sessions never accepted as Bearer; origin allowlist on transport |
| Cross-tenant access | ownership check inside every handler (`getOwnedProjectForMcp(id, auth.userId)`) |
| Malicious slide payload → widget XSS | full escaping, no inline handlers, sandboxed opaque-origin iframe, empty CSP by default |
| Share-URL leak via QR service | QR generated in-widget (~4 KB encoder), zero third-party requests |
| Replay of rotated refresh token | **gap** — reuse detection pending (Phase C3) |
| DoS by giant/deep payloads | size + depth caps, output caps, rate/concurrency limiter |

Continue to [04 — Tool pipeline](./04-tool-pipeline.md).
