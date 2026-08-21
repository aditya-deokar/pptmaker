# Research Notes And Sources

Last updated: 2026-06-14

This file summarizes the external research used for the Verto AI MCP Apps plan.

## 1. Key Findings

### ChatGPT

- ChatGPT Apps are built on MCP servers.
- Developers can test with ChatGPT developer mode before public submission.
- A connector needs a public HTTPS MCP endpoint.
- Public distribution happens through OpenAI's app submission/review process.
- For authenticated user-specific tools, OAuth 2.1 is the expected path.
- ChatGPT supports the MCP Apps UI standard and also supports optional `window.openai` extensions.
- Submission requires app metadata, OAuth details, tool information, screenshots, test prompts/responses, company info, privacy policy, and compliance confirmations.

### Claude

- Claude supports remote MCP connectors over Streamable HTTP.
- Custom connectors are the private testing path and use the same runtime as directory connectors.
- Public distribution happens through the Claude Connectors Directory.
- Directory submissions can include remote MCP servers and MCP Apps.
- Tool annotations are required for review.
- Claude requires test credentials and reviewer instructions.
- Directory connectors are discoverable and can be suggested in chat; custom connectors are not suggested.

### MCP Apps Standard

- MCP Apps let MCP tools return interactive HTML interfaces inside the conversation.
- The UI is referenced by a `ui://` resource.
- The UI runs in a sandboxed iframe.
- UI and host communicate by JSON-RPC over `postMessage`.
- Apps must gracefully degrade for hosts that do not support UI.
- Current host support includes Claude, Claude Desktop, ChatGPT-compatible Apps SDK behavior, and other MCP clients, but each host can vary.

## 2. Source Summaries

### OpenAI: Building MCP Servers For ChatGPT Apps And API Integrations

URL: https://developers.openai.com/api/docs/mcp

Useful facts:

- OpenAI documents remote MCP servers and ChatGPT connectors.
- For custom remote MCP servers, OpenAI recommends OAuth with Client ID Metadata Documents when supported.
- If a custom remote MCP server is connected in ChatGPT as an app, users get an OAuth flow to the application.

Impact on Verto:

- Verto should not rely on pasted API keys for the public ChatGPT app.
- Verto needs OAuth and protected resource metadata.

### OpenAI: Connect From ChatGPT

URL: https://developers.openai.com/apps-sdk/deploy/connect-chatgpt

Useful facts:

- Test apps in ChatGPT using developer mode.
- Public publishing is available through the submission process.
- The MCP server must be reachable over HTTPS.
- ChatGPT connector setup asks for connector name, description, and connector URL.
- After connector creation, users add the app/tool to a conversation from the composer.

Impact on Verto:

- We can test before public launch.
- Verto needs a production HTTPS endpoint like `https://verto.ai.aditya-deokar.me/mcp`.
- Description quality matters because the model uses connector metadata during discovery.

### OpenAI: MCP Apps Compatibility In ChatGPT

URL: https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt

Useful facts:

- ChatGPT supports the MCP Apps open standard for embedded app UIs.
- UIs run in iframes and use `ui/*` JSON-RPC over `postMessage`.
- New apps should use MCP Apps standard keys like `_meta.ui.resourceUri`.
- `window.openai` should be optional for ChatGPT-specific capabilities.

Impact on Verto:

- Build Verto widgets with MCP Apps standard first.
- Add ChatGPT-only enhancements only after feature detection.

### OpenAI: MCP Server Concept

URL: https://developers.openai.com/apps-sdk/concepts/mcp-server

Useful facts:

- MCP servers expose tools the model can call.
- Apps can also return resources and embedded UI.
- Apps SDK recommends Streamable HTTP for hosted servers.

Impact on Verto:

- Current Streamable HTTP design is the right production direction.
- The existing stdio transport is useful for local development, not primary app-store distribution.

### OpenAI: Build Your ChatGPT UI

URL: https://developers.openai.com/apps-sdk/build/chatgpt-ui

Useful facts:

- UI components turn structured tool results into human-friendly UI.
- Components run in a ChatGPT iframe.
- The MCP Apps bridge is recommended for tool inputs, tool results, tool calls, messages, and model context updates.

Impact on Verto:

- Deck preview and generation progress should be embedded UI components.
- The UI should receive structured tool results, not parse long text.

### OpenAI: Authentication

URL: https://developers.openai.com/apps-sdk/build/auth

Useful facts:

- Apps that expose customer-specific data or write actions should authenticate users.
- Authenticated MCP servers are expected to implement OAuth 2.1 conforming to the MCP authorization spec.
- OpenAI recommends using an established identity provider rather than building auth from scratch.

Impact on Verto:

- Existing Verto API keys are not enough for public app distribution.
- Use a proven OAuth provider if possible.

### OpenAI: Submit And Maintain Your App

URL: https://developers.openai.com/apps-sdk/deploy/submission

Useful facts:

- Public distribution goes through dashboard-based review.
- Only submit if the app should be publicly accessible in chosen countries.
- Public MCP server must be on a public domain and not a local/testing endpoint.
- Submission requires CSP, OAuth details if selected, app name, logo, description, company/privacy policy URLs, tool info, screenshots, test prompts/responses, and localization info.

Impact on Verto:

- Build a submission packet before starting review.
- Use a real production endpoint and exact CSP.

### OpenAI: Security And Privacy

URL: https://developers.openai.com/apps-sdk/guides/security-privacy

Useful facts:

- Use least privilege.
- Get explicit user consent.
- Validate inputs server-side.
- Require human confirmation for irreversible operations.
- Redact PII in logs.

Impact on Verto:

- `presentation_delete_permanently` must remain isolated and confirmed.
- Logs must avoid prompt text/secrets unless strictly needed.

### MCP Apps Blog

URL: https://blog.modelcontextprotocol.io/posts/2025-11-21-mcp-apps/

Useful facts:

- MCP Apps Extension proposal standardizes interactive UIs in MCP.
- It was developed with maintainers and contributors from OpenAI and Anthropic.
- Existing implementations can keep working because the extension is optional.
- Servers should return meaningful text fallback when UI is unavailable.

Impact on Verto:

- Add UI but do not make UI mandatory for core tool usefulness.

### MCP: What Is MCP?

URL: https://modelcontextprotocol.io/docs/getting-started/intro

Useful facts:

- MCP is an open-source standard for connecting AI apps to external systems.
- Claude and ChatGPT are listed as MCP-supporting AI assistants.
- MCP is intended to let developers build once and integrate widely.

Impact on Verto:

- One MCP server can support multiple assistant surfaces.

### MCP Authorization Spec

URL: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization

Useful facts:

- HTTP MCP authorization is based on OAuth 2.1 and related specs.
- Protected MCP servers act as OAuth resource servers.
- MCP servers must implement OAuth Protected Resource Metadata when using authorization.
- Protected resource metadata must include `authorization_servers`.
- MCP clients must send access tokens in the `Authorization` header.
- Tokens must be intended for the MCP server resource.

Impact on Verto:

- Current protected resource metadata needs to be expanded.
- Tokens must be audience-bound to the Verto MCP endpoint.

### MCP Apps Overview

URL: https://modelcontextprotocol.io/extensions/apps/overview

Useful facts:

- MCP Apps render interactive HTML inside MCP hosts.
- A tool declares a UI resource with `_meta.ui.resourceUri`.
- UI resources can load external origins only through CSP.
- The app is sandboxed and communicates through `postMessage`.
- Framework support is flexible. The `@modelcontextprotocol/ext-apps` package provides helpers.

Impact on Verto:

- Use `@modelcontextprotocol/ext-apps` plus Vite/React for widgets.
- Define CSP carefully.

### MCP Apps Build Guide

URL: https://modelcontextprotocol.io/extensions/apps/build

Useful facts:

- Node.js 18+ is required for the guide.
- Suggested dependencies include `@modelcontextprotocol/ext-apps`, `@modelcontextprotocol/sdk`, `vite`, `vite-plugin-singlefile`, `express`, and `cors`.
- Typical structure separates server code from UI code.
- Server registers the tool and serves the UI resource.

Impact on Verto:

- Verto already uses Node 20+ and React, so the UI build can fit naturally into the repo.

### Claude: Building Custom Connectors

URL: https://claude.com/docs/connectors/building

Useful facts:

- Claude supports Streamable HTTP and legacy HTTP+SSE, with Streamable HTTP preferred.
- Claude supports OAuth auth specs from 2025-03-26, 2025-06-18, and 2025-11-25.
- Supported protocol features include tools, prompts, resources, text/image tool results, and text/binary resources.
- Hosted Claude surfaces have a documented 300 second timeout.

Impact on Verto:

- Current Streamable HTTP transport is aligned with Claude.
- Long-running generation must return before host timeouts or expose progress.

### Claude: Directory Submission

URL: https://claude.com/docs/connectors/building/submission

Useful facts:

- Developers can submit remote MCP servers, desktop extensions, and MCP Apps.
- MCP Apps require screenshots.
- Remote MCP submissions happen inside Claude.ai admin settings for Team/Enterprise orgs, or via form if portal access is unavailable.
- Submission requirements include security, tool annotations, OAuth for authenticated services, privacy policy, documentation, and setup instructions.
- Portal asks for connection, tools, listing, use cases, company, authentication, data handling, test/launch, compliance, and review.

Impact on Verto:

- Tool annotations and OAuth are non-negotiable for directory quality.
- Prepare a fully populated reviewer account.

### Claude: Directory Connectors Vs Custom Connectors

URL: https://claude.com/docs/connectors/building/directory-vs-custom

Useful facts:

- Directory and custom connectors use the same runtime.
- Difference is review, discoverability, and distribution.
- Directory connectors can be searched, browsed, and suggested.
- Custom connectors can be shared by prefilled install links but are not suggested.

Impact on Verto:

- Test as custom first, then submit to directory.
- Product docs can include a pre-approval "Connect to Claude" custom link.

### Claude: Testing Your Connector

URL: https://claude.com/docs/connectors/building/testing

Useful facts:

- Any Claude account can add a custom connector.
- There is no separate staging environment; test in production with a custom connector.
- For local development, expose via Cloudflare Tunnel or ngrok.
- Use MCP Inspector to validate protocol compliance, auth, and schemas.
- Test credentials must be fully populated.

Impact on Verto:

- Use a staging/public tunnel for dev, but final submission must use production.
- Empty test accounts are not enough.

### Claude: Pre-Submission Checklist

URL: https://claude.com/docs/connectors/building/review-criteria

Useful facts:

- Claude reviewers run functional tests and policy scans.
- Read and write tools must be separate.
- Tool annotations are required.
- Tool names must be 64 characters or fewer.
- Tool descriptions must be narrow and accurate.
- Prompt-injection patterns in descriptions are rejected.
- Every tool must return successful responses with valid parameters.
- Generic errors fail review.
- Servers must call first-party APIs or legitimately proxied APIs.

Impact on Verto:

- Current tool split is good.
- Error messages and annotations need review-grade polish.
- Verto domain should match the service domain.

## 3. Practical Conclusion

The existing Verto MCP server is a strong base, but it is currently closer to a developer/custom connector than a public ChatGPT/Claude app-store-ready product.

The fastest path is:

1. Keep current Streamable HTTP server.
2. Add `/mcp` alias.
3. Add tool annotations.
4. Implement OAuth 2.1.
5. Add MCP Apps UI for generation progress and deck preview.
6. Test privately in ChatGPT developer mode and Claude custom connectors.
7. Submit to both directories with screenshots, test accounts, privacy policy, and documentation.
