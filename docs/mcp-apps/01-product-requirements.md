# Product Requirements: Verto AI App For ChatGPT And Claude

Last updated: 2026-06-14

## 1. Product Summary

Verto AI should become an installable AI app/connector inside ChatGPT and Claude. After a user connects their Verto account, they can create, inspect, edit, publish, and manage Verto presentations directly from a conversation.

The product should feel like this:

```text
User: Create a product launch deck for our new analytics platform.
ChatGPT/Claude: Calls Verto AI.
Verto AI: Generates the deck, returns a preview, and gives actions like edit theme, publish, or open in Verto.
```

## 2. Problem

Users already ask AI assistants to help write decks. But without a real connection to Verto:

- They must copy content manually into Verto.
- The assistant cannot see their existing Verto presentations.
- The assistant cannot create or update real decks.
- The user loses context when switching between chat and the Verto app.

The Verto MCP app solves this by making Verto's presentation workflow available as real tools inside ChatGPT and Claude.

## 3. Goals

| Goal | Meaning |
| --- | --- |
| Public discovery | Users can find Verto AI in ChatGPT Apps/Connectors and Claude Connectors Directory. |
| Account linking | Users can connect their Verto account with OAuth, not by pasting API keys. |
| Useful deck workflows | Users can create, read, update, theme, publish, and recover presentations through chat. |
| Rich in-chat UI | Users can see generation progress and deck previews inside ChatGPT/Claude where supported. |
| Safety | Destructive actions require clear confirmation and reviewers can understand every tool's impact. |
| Portability | One MCP implementation works across ChatGPT, Claude, and other MCP clients. |

## 4. Non-Goals For First Public Release

- Billing and subscription management through ChatGPT/Claude.
- Admin-only template management.
- Full drag-and-drop slide editing inside chat.
- User AI key management inside chat.
- Mobile design generation, unless added as a separate later app surface.
- A separate native desktop download.

## 5. Target Users

| User | Need |
| --- | --- |
| Founder or student | Generate a polished deck quickly from a prompt. |
| Sales or marketing team member | Turn campaign notes into a presentation and publish a share link. |
| Existing Verto user | Ask ChatGPT/Claude to find, update, or repurpose existing decks. |
| Team admin | Let teammates connect Verto safely without sharing API keys. |

## 6. Core User Stories

| ID | User story | Acceptance criteria |
| --- | --- | --- |
| U1 | As a new user, I can find Verto AI in ChatGPT or Claude and connect it. | Directory listing exists, OAuth works, user sees connected status. |
| U2 | As a user, I can generate a presentation from a topic. | `presentation_generate` creates a Verto project and returns status, title, deck ID, and next steps. |
| U3 | As a user, I can list and open my decks. | `presentation_list` returns only the authenticated user's presentations with pagination. |
| U4 | As a user, I can ask for edits to a deck. | Assistant reads the deck first, then calls update tools with complete valid input. |
| U5 | As a user, I can publish or unpublish a deck. | Publish returns a share URL. Unpublish revokes public access. |
| U6 | As a user, I am protected from accidental data loss. | Soft delete is recoverable. Permanent delete requires explicit confirmation and platform UI confirmation where available. |
| U7 | As a reviewer, I can exercise every tool using a test account. | All tools succeed with valid inputs and return actionable errors for invalid inputs. |

## 7. Functional Requirements

### 7.1 Authentication And Consent

- Users must authenticate with their Verto account using OAuth 2.1 for public ChatGPT/Claude distribution.
- The app must request scopes that match tool permissions:
  - `presentations:read`
  - `presentations:write`
  - `presentations:generate`
  - `presentations:publish`
- Users must be able to disconnect the app.
- Existing API key auth may remain for local development and custom MCP clients.

### 7.2 MCP Tools

The first release should expose the presentation tools:

| Tool | Type | Required annotation |
| --- | --- | --- |
| `presentation_list` | Read | `readOnlyHint: true` |
| `presentation_get` | Read | `readOnlyHint: true` |
| `presentation_create` | Write | `readOnlyHint: false`, `destructiveHint: false` |
| `presentation_generate` | Write/long-running | `readOnlyHint: false`, `destructiveHint: false` |
| `presentation_generation_status` | Read/status | `readOnlyHint: true`, `destructiveHint: false` |
| `presentation_update_slides` | Write | `readOnlyHint: false`, `destructiveHint: false` |
| `presentation_update_theme` | Write | `readOnlyHint: false`, `destructiveHint: false` |
| `presentation_publish` | Write/external sharing | `readOnlyHint: false`, `destructiveHint: false`, user-visible consent recommended |
| `presentation_unpublish` | Write | `readOnlyHint: false`, `destructiveHint: false` |
| `presentation_delete` | Soft delete | `readOnlyHint: false`, `destructiveHint: false` |
| `presentation_recover` | Write | `readOnlyHint: false`, `destructiveHint: false` |
| `presentation_delete_permanently` | Destructive | `readOnlyHint: false`, `destructiveHint: true` |

Every tool must have:

- A short display `title`.
- A precise description of what it does.
- Input schema with descriptions for every field.
- Structured output where possible.
- Actionable error messages.
- Ownership checks.
- Rate limits.

### 7.3 MCP Resources

The first release can keep the existing resources:

| Resource | Purpose |
| --- | --- |
| `verto://presentations` | Quick read-only context for the user's decks. |
| `verto://templates` | Template catalog. |
| `verto://themes` | Valid theme names and visual metadata. |
| `verto://generation/{runId}/progress` | Generation progress. |

### 7.4 Interactive UI

Minimum useful MCP Apps UI:

| UI surface | Trigger | What user sees |
| --- | --- | --- |
| Generation progress | `presentation_generate` returns running state | Progress steps, current agent/stage, deck title, refresh/status. |
| Deck preview | `presentation_get` or generation completion | Slide thumbnails, title, theme, open/publish actions. |
| Theme chooser | `presentation_update_theme` workflow | Theme list with preview swatches and apply button. |

For first launch, build generation progress + deck preview. Theme chooser can be a v1.1 enhancement.

### 7.5 Directory Listing

Both app stores need product metadata.

Minimum listing copy:

- Name: `Verto AI`
- Tagline: `Create and edit AI presentations from chat`
- Short description: `Generate, update, preview, and publish Verto AI presentations directly inside ChatGPT or Claude.`
- Categories: productivity, design, education, business, marketing.
- Required account: Verto AI account.
- Required plan/limit: 15 presentation generations for connected ChatGPT/Claude usage.
- Privacy policy URL.
- Support URL or email.
- Documentation URL.
- Logo and screenshots.

## 8. Nonfunctional Requirements

| Area | Requirement |
| --- | --- |
| Availability | Public MCP endpoint should be stable and HTTPS only. |
| Latency | Normal read tools under 2 seconds p95. Generation may take longer but must return progress if still running. |
| Timeout | Claude hosted surfaces document a 300 second timeout; Verto should return a running status before long operations hit host timeouts. |
| Security | Validate all inputs, enforce ownership, never return secrets, redact logs. |
| Privacy | Do not collect ChatGPT/Claude conversation data unless needed for the tool action and disclosed. |
| Observability | Log tool name, user ID, trace ID, status, latency, and error code. |
| Compatibility | Prefer MCP Apps standard `_meta.ui.resourceUri` and `ui/*` bridge. Use `window.openai` only as optional ChatGPT enhancement. |

## 9. Success Metrics

| Metric | Target for first 30 days after launch |
| --- | --- |
| App connection success rate | 95%+ |
| Tool call success rate | 98%+ for read tools, 95%+ for write tools |
| Generation completion rate | 90%+ |
| First successful deck after connect | 60%+ of connected users |
| Review pass | Approved by ChatGPT and Claude without critical rework |
| Support burden | Fewer than 5 support tickets per 100 connected users |

## 9.1 Launch Limits

For the first ChatGPT/Claude release, connected users should be limited to 15 presentation generations through these assistant surfaces. This limit should be enforced in the Verto usage-limit layer so the MCP app cannot bypass normal product controls.

## 10. Key Risks

| Risk | Mitigation |
| --- | --- |
| OAuth implementation delays | Use a proven IdP or build a minimal standards-compliant auth server with strong tests. |
| Directory rejection for missing annotations | Add annotations before submission and test tool list in both clients. |
| Long generation timeout | Return `RUNNING` plus progress resource quickly, then let user re-check status. |
| Prompt injection through tool descriptions | Keep descriptions factual; do not include behavioral instructions unrelated to tool function. |
| Claude policy concern around AI media generation | Position Verto as presentation/document generation. Verify whether any image/audio/video generation paths need to be disabled or documented for Claude review. |
| User confusion about "download" | Use "Connect Verto AI" language in docs and UI. There is no binary app download. |

## 11. Release Definition Of Done

- Public HTTPS MCP endpoint exists at `/mcp` and remains compatible with `/api/mcp`.
- OAuth 2.1 connection works in ChatGPT developer mode and Claude custom connector.
- Every tool has title and annotations.
- MCP Inspector can list and call every tool.
- ChatGPT developer mode can connect and use the app.
- Claude custom connector can connect and use the same endpoint.
- At least one MCP Apps UI resource renders in ChatGPT and Claude.
- Privacy policy, documentation page, logo, screenshots, test prompts, and test account are ready.
- Security review completed for write/destructive tools.
- Submission packets completed for OpenAI and Anthropic.
