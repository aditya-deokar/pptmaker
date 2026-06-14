# Verto AI MCP Client Setup Guide

This document describes the **current MCP server implementation** in this repository and the recommended client setup for the hosted Verto AI deployment:

- App: `https://verto.ai.aditya-deokar.me`
- MCP endpoint: `https://verto.ai.aditya-deokar.me/mcp`
- Discovery URL: `https://verto.ai.aditya-deokar.me/.well-known/oauth-protected-resource`
- Public guide page: `https://verto.ai.aditya-deokar.me/docs/mcp/04-usage-guide`

## Executive Summary

Use **Streamable HTTP** for the hosted app.

Use **stdio** only when:

- you are running this repository locally
- your MCP client cannot send remote headers cleanly
- you explicitly want the client to spawn the server process itself

For most users of the hosted Verto AI product, the setup should be:

1. Generate a Verto AI MCP key in Settings
2. Add the hosted URL `https://verto.ai.aditya-deokar.me/mcp`
3. Send the key as `Authorization: Bearer vk_live_...`

## What This MCP Server Exposes

### Transport

- `Streamable HTTP` at `/mcp`
- legacy Streamable HTTP at `/api/mcp`
- `stdio` via `src/mcp/transport/stdio.ts`

### Authentication

- **Remote HTTP clients**: `Authorization: Bearer <vk_live_...>`
- **Local stdio clients**: `VERTO_API_KEY=<vk_live_...>`
- **Browser-based flows on the same signed-in session**: the server can fall back to the current Clerk session

### Current protocol version

- `2025-03-26`

This matters because the current hosted HTTP implementation is **session-based**. Clients must initialize first before sending tool calls.

## Current Server Behavior

The codebase currently implements the following HTTP behavior:

- `GET /mcp`
  - returns MCP server metadata when no session ID is present
  - acts as a lightweight health/discovery endpoint
- `POST /mcp`
  - accepts MCP JSON-RPC requests
  - creates a session when the first request is `initialize`
  - rejects non-initialize requests that do not include a valid session ID
- `DELETE /mcp`
  - closes the current session
- `OPTIONS /mcp`
  - supports CORS preflight

### Important implication

This endpoint is **not** a plain REST API.

If you send a direct `tools/list` POST without doing the MCP initialize handshake first, this server will reject the request.

That is why the recommended validation tools are:

- a real MCP client
- MCP Inspector
- Claude Code
- Cursor

## Why Streamable HTTP Is The Right Default Here

The hosted Verto AI app already lives on a public domain, so Streamable HTTP is the right fit for the main product use case:

- no repository checkout required
- no Node.js runtime required on the end user machine
- multiple users can connect to the same deployed service
- easier onboarding for Claude, Cursor, hosted agents, and cloud connectors

### Best use cases for Streamable HTTP

- Claude Code connected to the hosted Verto AI server
- Cursor remote MCP setup
- Claude custom connectors using a public MCP URL
- internal team agents using a shared deployed MCP service
- browser or cloud workflows that should not spawn local processes

### Best use cases for stdio

- local development of this repository
- testing the MCP server implementation directly from source
- clients that only support command-based MCP servers
- fallback when a remote client has weak header support

## Tools Registered Today

The current MCP server registers 11 presentation-focused tools:

| Tool | Purpose |
| --- | --- |
| `presentation_list` | List presentations for the authenticated user |
| `presentation_get` | Read one presentation, optionally including slide JSON |
| `presentation_create` | Create a new presentation from title and outlines |
| `presentation_delete` | Soft-delete a presentation |
| `presentation_recover` | Recover a soft-deleted presentation |
| `presentation_delete_permanently` | Permanently delete presentations with `confirm: true` |
| `presentation_update_slides` | Replace the full slides array |
| `presentation_update_theme` | Change the theme of a presentation |
| `presentation_publish` | Publish a presentation to a public share URL |
| `presentation_unpublish` | Remove public access |
| `presentation_generate` | Run the long-running Verto AI generation pipeline |

## Resources Registered Today

The current MCP server registers 4 read-only resources:

| Resource URI | Purpose |
| --- | --- |
| `verto://presentations` | Read-only presentation discovery context |
| `verto://templates` | Published template catalog |
| `verto://themes` | Valid theme names and visual metadata |
| `verto://generation/{runId}/progress` | Progress state for running generation jobs |

## Security Notes

### API keys

- generated keys currently use the prefix `vk_live_`
- plaintext keys are shown only once
- keys are stored as bcrypt hashes in the database
- the UI currently allows up to 5 active keys per user

### Origin validation

The HTTP transport validates the `Origin` header against the configured allowlist. This is important for browser safety and DNS rebinding protection.

### Claude remote connector note

For Claude custom connectors, the connection comes from **Anthropic's cloud infrastructure**, not from the user's laptop. That means the hosted Verto AI MCP URL must stay publicly reachable.

## Hosted Client Setup

## 1. Claude Code

Recommended command:

```bash
claude mcp add --transport http verto-ai https://verto.ai.aditya-deokar.me/mcp \
  --header "Authorization: Bearer ${VERTO_MCP_KEY}"
```

Set the environment variable before running the command:

```bash
export VERTO_MCP_KEY="vk_live_your_api_key"
```

On Windows PowerShell:

```powershell
$env:VERTO_MCP_KEY = "vk_live_your_api_key"
```

## 2. Cursor

Add a remote MCP server to `.cursor/mcp.json` or `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "verto-ai": {
      "url": "https://verto.ai.aditya-deokar.me/mcp",
      "headers": {
        "Authorization": "Bearer ${env:VERTO_MCP_KEY}"
      }
    }
  }
}
```

## 3. Generic Remote MCP Client

If a client accepts a Streamable HTTP server entry in JSON:

```json
{
  "mcpServers": {
    "verto-ai": {
      "type": "streamable-http",
      "url": "https://verto.ai.aditya-deokar.me/mcp",
      "headers": {
        "Authorization": "Bearer ${VERTO_MCP_KEY}"
      }
    }
  }
}
```

## 4. Claude / Claude Desktop Custom Connector

For Claude's remote connector flow:

1. Open `Customize > Connectors`
2. Choose `Add custom connector`
3. Paste `https://verto.ai.aditya-deokar.me/mcp`
4. Complete the auth flow if prompted
5. Enable the connector in the conversation where you want Verto AI tools available

### Important note

This is a **remote** connector flow. Anthropic reaches the server from its own infrastructure, so the endpoint must be public and firewall-accessible.

## 5. Local stdio Fallback

Only use this if you are running the repository locally.

```json
{
  "mcpServers": {
    "verto-ai-local": {
      "command": "npx",
      "args": ["tsx", "src/mcp/transport/stdio.ts"],
      "cwd": "/path/to/pptmaker",
      "env": {
        "VERTO_API_KEY": "vk_live_your_api_key"
      }
    }
  }
}
```

## Verification

### Health check

```bash
curl https://verto.ai.aditya-deokar.me/mcp
```

Expected result:

- server metadata
- protocol version
- supported transport list

### Recommended functional validation

Use an MCP-aware client instead of raw curl for tools:

- Claude Code
- Cursor
- MCP Inspector

### Why raw curl is not the best tool here

The hosted server expects:

1. an MCP initialize request
2. a valid returned session ID
3. subsequent requests on that session

So a direct `tools/list` POST is not a correct representation of the real transport flow.

## Troubleshooting

### The endpoint opens but tools do not work

Check:

- the URL is exactly `https://verto.ai.aditya-deokar.me/mcp`
- the client is using MCP, not plain REST
- the key is being sent as a Bearer token
- the client supports remote HTTP MCP properly

### Authentication failures

Check:

- the key begins with `vk_live_`
- the key is active and not revoked
- the header is `Authorization: Bearer <key>`
- for stdio, `VERTO_API_KEY` is present in the spawned process environment

### Claude custom connector cannot connect

Check:

- the domain is public
- no firewall is blocking external access
- the endpoint is reachable from outside your local machine

### A client only supports command-based MCP

Use the local stdio transport instead of the hosted HTTP endpoint.

## Known Compatibility Note

This server currently advertises MCP protocol version `2025-03-26` and uses the session-based Streamable HTTP flow implemented in the app today.

That means:

- modern clients with compatibility support should work
- tools that expect only the newest stateless HTTP behavior may need a compatibility mode
- if a remote client struggles, stdio remains the safest fallback

## Official References Used To Cross-Check Client Guidance

- Claude Code MCP docs: `https://docs.anthropic.com/en/docs/claude-code/mcp`
- Claude custom connectors over remote MCP: `https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp`
- Cursor MCP docs: `https://docs.cursor.com/context/model-context-protocol`
- MCP Streamable HTTP transport spec: `https://modelcontextprotocol.io/specification/draft/basic/transports`
