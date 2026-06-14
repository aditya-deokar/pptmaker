# MCP Server Specification — Verto AI

> **Document**: `01-specs.md`
> **Version**: 1.0.0-draft
> **Scope**: Presentation CRUD Operations
> **Last Updated**: 2026-05-02

---

## 1. Executive Summary

This specification defines the Model Context Protocol (MCP) server for **Verto AI**, enabling any MCP-compatible client (Claude Desktop, Cursor, Windsurf, Claude Code, custom agents) to programmatically create, read, update, and delete presentations through a standardized, AI-optimized interface.

The MCP server acts as a **protocol translator at the trust boundary** between external AI agents and Verto AI's critical infrastructure. It is **not** a thin REST wrapper — it is an agent-optimized interface designed to maximize LLM reasoning efficiency while enforcing strict security boundaries.

### 1.1 Design Philosophy

Inspired by production MCP deployments at **Cloudflare**, **Stripe**, and **Anthropic's Claude Code**:

| Principle | Application |
|-----------|-------------|
| **Bounded Context** | Single-domain server: `verto-presentation-mcp-server` |
| **Outcomes over Operations** | Tools like `generate_presentation` instead of raw DB operations |
| **Agent-Optimized UX** | Rich descriptions, structured errors, pagination tokens |
| **Defense in Depth** | OAuth 2.1 + Zod validation + rate limiting + audit logging |
| **Idempotency** | Client-generated request IDs, safe retries |

---

## 2. Protocol Overview

### 2.1 MCP Primitives Used

| Primitive | Purpose in Verto AI | Count |
|-----------|---------------------|-------|
| **Tools** | Mutating operations (create, update, delete, generate) | 10 |
| **Resources** | Read-only data (project listings, templates, themes) | 3 |
| **Prompts** | Reusable interaction templates (future scope) | 0 (v1) |

### 2.2 SDK & Protocol Version

```
Protocol: MCP 2025-03-26 (latest stable)
SDK: @modelcontextprotocol/sdk ^2.x
Transport: Streamable HTTP (primary) + stdio (local dev)
Serialization: JSON-RPC 2.0
```

---

## 3. Scope Definition

### 3.1 In Scope (v1 — Presentation CRUD)

```
✅ Presentation lifecycle (create, read, update, delete, recover)
✅ Slide content management (read slides, update slides, update theme)
✅ Publishing & sharing (publish, unpublish, get share state)
✅ AI-powered generation (generate full presentation from topic)
✅ Resource browsing (list projects, list templates, list themes)
```

### 3.2 Out of Scope (Future Expansion)

```
❌ User account management
❌ Subscription / billing operations
❌ Mobile design generation
❌ Template CRUD (admin operations)
❌ Real-time collaborative editing
❌ File upload / image management
❌ AI key management
```

### 3.3 Expansion Strategy

The server is architected with a **plugin-based tool registry** so future domains can be added as separate modules without modifying the core server:

```
v1.0 → Presentation CRUD (this spec)
v1.1 → Template browsing + AI generation options
v2.0 → Mobile design operations
v2.1 → Collaborative features
v3.0 → Admin operations + analytics
```

---

## 4. Tool Catalog

### 4.1 Tool Naming Convention

Following MCP community standards and Cloudflare's naming pattern:

```
{domain}_{action}_{target}
```

Examples: `presentation_create`, `presentation_update_slides`, `presentation_generate`

### 4.2 Category: Presentation Lifecycle

#### `presentation_list`

| Field | Value |
|-------|-------|
| **Description** | List all presentations owned by the authenticated user. Returns metadata only (no slide content) for token efficiency. Supports pagination. |
| **Mutating** | No |
| **Idempotent** | Yes |

**Input Schema (Zod)**:
```typescript
z.object({
  cursor: z.string().optional()
    .describe("Pagination cursor from a previous response. Omit for the first page."),
  limit: z.number().int().min(1).max(50).default(20)
    .describe("Number of presentations to return per page. Default: 20, Max: 50."),
  include_deleted: z.boolean().default(false)
    .describe("If true, also returns soft-deleted presentations."),
  sort_by: z.enum(["updated_at", "created_at", "title"]).default("updated_at")
    .describe("Field to sort results by."),
  sort_order: z.enum(["asc", "desc"]).default("desc")
    .describe("Sort direction."),
})
```

**Response**:
```json
{
  "content": [{
    "type": "text",
    "text": "{ \"presentations\": [...], \"pagination\": { \"next_cursor\": \"...\", \"has_more\": true, \"total_count\": 42 } }"
  }]
}
```

---

#### `presentation_get`

| Field | Value |
|-------|-------|
| **Description** | Get a single presentation by ID. Returns full metadata and optionally the complete slide JSON. |
| **Mutating** | No |
| **Idempotent** | Yes |

**Input Schema**:
```typescript
z.object({
  presentation_id: z.string().min(1)
    .describe("The unique identifier of the presentation (cuid format)."),
  include_slides: z.boolean().default(true)
    .describe("If true, includes the full slide JSON content. Set to false for metadata-only."),
})
```

---

#### `presentation_create`

| Field | Value |
|-------|-------|
| **Description** | Create a new empty presentation with the given title and slide outlines. Returns the created presentation with its ID. |
| **Mutating** | Yes |
| **Idempotent** | No (use `request_id` for deduplication) |

**Input Schema**:
```typescript
z.object({
  title: z.string().min(1).max(200)
    .describe("The title of the new presentation."),
  outlines: z.array(
    z.object({
      title: z.string().min(1).max(200),
      order: z.number().int().min(0),
    })
  ).min(1).max(30)
    .describe("Slide outline cards. Each has a title and display order."),
  request_id: z.string().uuid().optional()
    .describe("Client-generated UUID for idempotent creation. If a presentation with this request_id was already created, the existing one is returned."),
})
```

---

#### `presentation_delete`

| Field | Value |
|-------|-------|
| **Description** | Soft-delete a presentation. The presentation can be recovered later. Does NOT permanently destroy data. |
| **Mutating** | Yes |
| **Idempotent** | Yes (deleting an already-deleted presentation is a no-op) |

**Input Schema**:
```typescript
z.object({
  presentation_id: z.string().min(1)
    .describe("ID of the presentation to soft-delete."),
})
```

---

#### `presentation_recover`

| Field | Value |
|-------|-------|
| **Description** | Recover a soft-deleted presentation, restoring it to the active project list. |
| **Mutating** | Yes |
| **Idempotent** | Yes |

**Input Schema**:
```typescript
z.object({
  presentation_id: z.string().min(1)
    .describe("ID of the soft-deleted presentation to recover."),
})
```

---

#### `presentation_delete_permanently`

| Field | Value |
|-------|-------|
| **Description** | Permanently and irreversibly delete one or more presentations from the database. This action CANNOT be undone. Requires explicit confirmation via the confirm flag. |
| **Mutating** | Yes |
| **Idempotent** | Yes |
| **Destructive** | ⚠️ Yes — requires `confirm: true` |

**Input Schema**:
```typescript
z.object({
  presentation_ids: z.array(z.string().min(1)).min(1).max(20)
    .describe("Array of presentation IDs to permanently delete."),
  confirm: z.literal(true)
    .describe("Must be set to true to confirm permanent deletion. This prevents accidental data loss."),
})
```

---

### 4.3 Category: Slide Content Management

#### `presentation_update_slides`

| Field | Value |
|-------|-------|
| **Description** | Replace the entire slide deck JSON for a presentation. Accepts the full Slide[] array. Use presentation_get first to read current slides before modifying. |
| **Mutating** | Yes |
| **Idempotent** | Yes (same input → same result) |

**Input Schema**:
```typescript
z.object({
  presentation_id: z.string().min(1)
    .describe("ID of the presentation to update."),
  slides: z.array(z.object({
    id: z.string(),
    slideName: z.string(),
    type: z.string(),
    content: z.any(), // ContentItem recursive structure
    slideOrder: z.number().optional(),
    className: z.string().optional(),
  }))
    .describe("The complete Slide[] array. This replaces all existing slides."),
})
```

---

#### `presentation_update_theme`

| Field | Value |
|-------|-------|
| **Description** | Change the visual theme of a presentation. Use the 'available_themes' resource to see valid theme names. |
| **Mutating** | Yes |
| **Idempotent** | Yes |

**Input Schema**:
```typescript
z.object({
  presentation_id: z.string().min(1)
    .describe("ID of the presentation to update."),
  theme_name: z.string().min(1)
    .describe("Name of the theme to apply. Must be a valid theme from the available_themes resource."),
})
```

---

### 4.4 Category: Publishing & Sharing

#### `presentation_publish`

| Field | Value |
|-------|-------|
| **Description** | Publish a presentation, making it accessible via a public share link. Returns the share URL. |
| **Mutating** | Yes |
| **Idempotent** | Yes |

**Input Schema**:
```typescript
z.object({
  presentation_id: z.string().min(1)
    .describe("ID of the presentation to publish."),
})
```

---

#### `presentation_unpublish`

| Field | Value |
|-------|-------|
| **Description** | Unpublish a presentation, revoking public access. The share link will stop working. |
| **Mutating** | Yes |
| **Idempotent** | Yes |

**Input Schema**:
```typescript
z.object({
  presentation_id: z.string().min(1)
    .describe("ID of the presentation to unpublish."),
})
```

---

### 4.5 Category: AI Generation

#### `presentation_generate`

| Field | Value |
|-------|-------|
| **Description** | Generate a complete AI-powered presentation from a topic description. Uses the 8-agent LangGraph pipeline. This is a long-running operation (30-90 seconds). Returns the generation run ID for progress tracking and the final presentation ID upon completion. |
| **Mutating** | Yes |
| **Idempotent** | No |
| **Long-Running** | Yes (30-90s) |

**Input Schema**:
```typescript
z.object({
  topic: z.string().min(1).max(500)
    .describe("The topic or subject for the AI to generate a presentation about. Be descriptive for better results."),
  additional_context: z.string().max(2000).optional()
    .describe("Optional additional instructions or context to guide the AI generation."),
  theme_preference: z.string().default("Default")
    .describe("Preferred visual theme for the generated presentation."),
  outlines: z.array(z.string().min(1).max(200)).max(30).optional()
    .describe("Optional pre-defined slide outlines. If omitted, the AI will generate outlines automatically."),
})
```

**Response** (success):
```json
{
  "content": [{
    "type": "text",
    "text": "{ \"success\": true, \"presentation_id\": \"clx...\", \"slide_count\": 12, \"generation_run_id\": \"clx...\" }"
  }]
}
```

---

## 5. Resource Catalog

Resources provide **read-only context** that agents can use to inform their tool calls.

### 5.1 `verto://presentations`

| Field | Value |
|-------|-------|
| **URI** | `verto://presentations` |
| **Name** | User Presentations |
| **Description** | List of all presentations owned by the authenticated user with metadata (no slide content). |
| **MIME Type** | `application/json` |

---

### 5.2 `verto://templates`

| Field | Value |
|-------|-------|
| **URI** | `verto://templates` |
| **Name** | Available Templates |
| **Description** | Catalog of presentation templates with categories, tags, and difficulty levels. |
| **MIME Type** | `application/json` |

---

### 5.3 `verto://themes`

| Field | Value |
|-------|-------|
| **URI** | `verto://themes` |
| **Name** | Available Themes |
| **Description** | List of all available presentation themes with their visual properties (colors, fonts, styles). |
| **MIME Type** | `application/json` |

---

## 6. Transport Strategy

### 6.1 Dual Transport Architecture

| Transport | Use Case | Endpoint |
|-----------|----------|----------|
| **Streamable HTTP** | Production, remote clients, web-based agents | `POST /mcp` |
| **stdio** | Local development, IDE integrations (Cursor, Claude Desktop) | `npx verto-mcp-server` |

### 6.2 Streamable HTTP Configuration

```
Endpoint: /mcp
Legacy endpoint: /api/mcp
Methods: GET (SSE stream), POST (JSON-RPC messages)
Protocol: JSON-RPC 2.0 over HTTP
Session: Stateful with Mcp-Session-Id header
Content-Type: application/json
```

### 6.3 stdio Configuration

For local development, provide a standalone entry point:
```json
// Claude Desktop / Cursor config
{
  "mcpServers": {
    "verto-ai": {
      "command": "npx",
      "args": ["-y", "verto-mcp-server"],
      "env": {
        "VERTO_API_KEY": "vk_..."
      }
    }
  }
}
```

---

## 7. Client Compatibility Matrix

| Client | Transport | Auth Method | Status |
|--------|-----------|-------------|--------|
| **Claude Desktop** | stdio / Streamable HTTP | API Key in env | Primary |
| **Claude Code** | stdio | API Key in env | Primary |
| **Cursor** | stdio / Streamable HTTP | API Key in env | Primary |
| **Windsurf** | stdio | API Key in env | Supported |
| **Cline** | stdio | API Key in env | Supported |
| **Custom Agent (AI SDK)** | Streamable HTTP | Bearer Token / OAuth 2.1 | Supported |
| **Gemini CLI** | stdio | API Key in env | Planned |

---

## 8. Response Format Standards

### 8.1 Success Response

All tool responses follow the MCP content block format:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"success\": true, \"data\": { ... }}"
    }
  ]
}
```

### 8.2 Error Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"success\": false, \"error\": {\"code\": \"PRESENTATION_NOT_FOUND\", \"message\": \"No presentation found with ID 'clx123'. Verify the ID using the presentation_list tool.\", \"suggestion\": \"Call presentation_list to get valid presentation IDs.\"}}"
    }
  ],
  "isError": true
}
```

### 8.3 Error Code Catalog

| Code | HTTP Equiv | Description |
|------|-----------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | User doesn't own this resource |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION_ERROR` | 400 | Input failed Zod schema validation |
| `RATE_LIMITED` | 429 | Too many requests, retry after X seconds |
| `USAGE_LIMIT_EXCEEDED` | 403 | Free tier generation limit reached |
| `GENERATION_FAILED` | 500 | AI pipeline error during generation |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 9. Pagination Strategy

All list operations use **cursor-based pagination** (not offset-based) for stable results:

```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6ImNseC4uLiJ9",
    "has_more": true,
    "total_count": 42,
    "page_size": 20
  }
}
```

- **Cursor format**: Base64-encoded `{id, sortField}` composite key
- **Stability**: Immune to insertions/deletions during pagination
- **Token efficiency**: Only returns `next_cursor` (no `prev_cursor` to save tokens)

---

## 10. Versioning Policy

### 10.1 Semantic Versioning for Tools

```
Tool Version Format: {major}.{minor}
Breaking changes: Major bump → new tool name (e.g., presentation_create_v2)
Additive changes: Minor bump → new optional fields
```

### 10.2 Server Version Header

Every Streamable HTTP response includes:
```
X-Verto-MCP-Version: 1.0.0
X-Verto-MCP-Protocol: 2025-03-26
```

### 10.3 Deprecation Policy

1. Deprecated tools continue working for **6 months**
2. Deprecation notice added to tool description
3. New tool version announced in changelog
4. Old tool removed after grace period

---

## 11. Rate Limiting Specification

| Tier | Requests/min | Concurrent Tools | Generation/hour |
|------|-------------|-------------------|-----------------|
| **Free** | 30 | 3 | 5 |
| **Pro** | 120 | 10 | 50 |
| **Enterprise** | 600 | 50 | Unlimited |

Rate limit headers (Streamable HTTP only):
```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 115
X-RateLimit-Reset: 1714648800
Retry-After: 12  (only on 429)
```

---

## 12. Appendix: JSON Schema Reference

### 12.1 Presentation Object (Abbreviated)

```typescript
interface PresentationMCPResponse {
  id: string;            // cuid
  title: string;
  created_at: string;    // ISO 8601
  updated_at: string;    // ISO 8601
  slide_count: number;
  theme_name: string;
  is_published: boolean;
  is_deleted: boolean;
  share_url: string | null;
  outlines: string[];
  slides?: Slide[];      // Only if include_slides=true
}
```

### 12.2 Slide Object

```typescript
interface Slide {
  id: string;
  slideName: string;
  type: string;
  content: ContentItem;
  slideOrder?: number;
  className?: string;
}
```

> **Next Document**: [02-detailed-phased-implementation.md](./02-detailed-phased-implementation.md) — Phase-by-phase build plan with tasks, dependencies, and milestones.
