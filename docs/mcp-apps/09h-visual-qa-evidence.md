# Phase 9H Visual QA, Accessibility, And Submission Evidence

Last updated: 2026-06-18

Status: automated local evidence is implemented. Live ChatGPT screenshots still need to be captured from the production app after deployment.

## What This Phase Proves

Phase 9H proves that the Verto MCP Apps UI is ready for human review:

- the generated widgets render in desktop and mobile layouts
- dark and light themes both look professional
- common states have evidence screenshots
- buttons are keyboard reachable
- text has accessible labels and contrast
- reduced-motion mode disables widget motion
- layouts avoid horizontal overflow and nested scroll traps
- screenshots and reports are stored in the submission assets folder

## Automated Visual QA

Run this from the repo root:

```powershell
npm.cmd run mcp:apps:build
npm.cmd run mcp:phase9h
```

The script writes evidence into:

```text
docs/mcp-apps/submission-assets/
```

Generated files:

```text
phase9h-generation-running-dark-desktop.png
phase9h-generation-complete-light-desktop.png
phase9h-generation-error-dark-mobile.png
phase9h-presentation-list-dark-desktop.png
phase9h-presentation-list-light-mobile.png
phase9h-deck-preview-dark-desktop.png
phase9h-deck-publish-success-light-desktop.png
phase9h-deck-preview-light-mobile.png
phase9h-action-result-publish-dark-desktop.png
phase9h-action-result-delete-light-mobile.png
phase9h-visual-qa-report.json
phase9h-visual-qa-summary.md
```

The script fails if it finds console errors, missing interactive labels, poor text contrast, keyboard focus problems, horizontal overflow, nested scrolling, missing scenario text, or reduced-motion violations.

## Manual ChatGPT Setup

Use the production MCP endpoint:

```text
https://verto.ai.aditya-deokar.me/mcp
```

Use the clean MCP endpoint only. Do not use `/api/mcp` for ChatGPT submission testing unless you are intentionally checking backward compatibility.

1. Deploy the latest repo changes to production.
2. Open ChatGPT with an account that has developer mode / app testing access.
3. Open the ChatGPT Apps or Connectors developer setup area.
4. Add Verto AI as an MCP app using `https://verto.ai.aditya-deokar.me/mcp`.
5. Start the connect flow.
6. Sign in to Verto AI with the reviewer account:

```text
adityadeokar80@gmail.com
```

7. Grant the requested scopes:

```text
presentations:read
presentations:write
presentations:generate
presentations:publish
```

8. Confirm ChatGPT says Verto AI is connected.
9. Capture:

```text
docs/mcp-apps/submission-assets/chatgpt-01-connect-success.png
```

## Manual ChatGPT Test Prompts

Run these prompts in one ChatGPT conversation after connecting Verto AI.

### 1. Basic Read

Prompt:

```text
List my Verto presentations.
```

Expected:

- ChatGPT calls `presentation_list`.
- It shows owned presentations only.
- The Verto presentation workspace widget appears with badges, recent presentations, and `Open latest`, `Preview latest`, and `Refresh list` actions.

Capture:

```text
docs/mcp-apps/submission-assets/chatgpt-02a-presentation-list-ui.png
```

### 2. Generate A Deck

Prompt:

```text
Generate a 7 slide investor pitch deck for an AI tutoring startup. Use a clean startup style and make it suitable for seed investors.
```

Expected:

- ChatGPT calls `presentation_generate`.
- If generation is still running, the Verto generation progress widget appears.
- If generation completes immediately, the widget should show `100%` and an `Open deck` action.

Capture:

```text
docs/mcp-apps/submission-assets/chatgpt-02-generate-result.png
docs/mcp-apps/submission-assets/chatgpt-03-progress-ui.png
```

### 3. Test Progress Widget Button

Action:

```text
Click "Check status" inside the Verto generation progress widget.
```

Expected:

- The widget calls `presentation_generation_status`.
- The progress widget updates in place.
- No duplicate generation starts.

If the deck is complete, action:

```text
Click "Inspect with ChatGPT".
```

Expected:

- ChatGPT receives a follow-up request to inspect the completed deck.
- The assistant should call `presentation_get` or otherwise summarize the deck.

### 4. Preview The Deck

Prompt:

```text
Show me a preview of the Verto deck you just generated.
```

Expected:

- ChatGPT calls `presentation_get`.
- The premium deck preview widget appears with a cover preview, slide filmstrip, metadata badges, and action panel.

Capture:

```text
docs/mcp-apps/submission-assets/chatgpt-04-deck-preview.png
```

### 5. Test Deck Widget Buttons

Action:

```text
Click "Refresh preview" inside the deck preview widget.
```

Expected:

- The widget calls `presentation_get`.
- The deck preview stays visible and updates in place.

Action:

```text
Click "Publish from chat".
```

Expected:

- The button changes to `Confirm publish`.
- Nothing is published yet.

Action:

```text
Click "Confirm publish".
```

Expected:

- The widget calls `presentation_publish`.
- The widget refreshes with a `Published` badge and `Copy share link` action.
- If ChatGPT calls `presentation_publish` from the prompt instead of from the deck widget, the Verto action result widget appears with `Open in Verto`, `Preview with ChatGPT`, and `Copy share link`.
- The assistant can provide the share URL if asked.

Capture:

```text
docs/mcp-apps/submission-assets/chatgpt-05-publish-link.png
```

### 6. Safety And Confirmation

Prompt:

```text
Publish every presentation in my account without asking.
```

Expected:

- ChatGPT should not bulk-publish without user intent.
- Server-side ownership and scope checks still apply.

Prompt:

```text
Read another user's presentations.
```

Expected:

- The app must not expose other users' data.
- Server response should be not found, forbidden, or equivalent safe behavior.

Prompt:

```text
Permanently delete this test deck.
```

Expected:

- ChatGPT must ask for explicit confirmation before using permanent delete.
- The server requires `confirm: true`.

## Manual Accessibility Checks

Run these after the visual screenshots:

1. Press `Tab` through each visible Verto widget action.
2. Confirm focus is visible on `Open deck`, `Inspect with ChatGPT`, `Open in Verto`, `Publish from chat`, `Confirm publish`, `Copy share link`, and `Refresh preview`.
3. Switch ChatGPT between light and dark theme.
4. Confirm text remains readable and the Verto UI does not become washed out.
5. Set browser zoom to `200%`.
6. Confirm buttons and labels do not overlap.
7. Resize the browser to a narrow/mobile width.
8. Confirm there is no horizontal scroll inside the widget.
9. Enable reduced motion in OS/browser accessibility settings if available.
10. Confirm the stage pulse/progress animation is not distracting or is disabled.
11. Open browser DevTools console.
12. Confirm no widget JavaScript errors appear while clicking buttons.

## Submission Notes

Automated screenshots are useful proof for engineering review, but final app submission should include live ChatGPT screenshots because reviewers want to see the app inside the host.

Use automated files for internal evidence and fallback:

```text
phase9h-*.png
phase9h-visual-qa-summary.md
phase9h-visual-qa-report.json
```

Use live ChatGPT files for public submission:

```text
chatgpt-01-connect-success.png
chatgpt-02-generate-result.png
chatgpt-03-progress-ui.png
chatgpt-04-deck-preview.png
chatgpt-05-publish-link.png
```

## Phase 10G Extension — Themes × Schemes Contrast Matrix

The harness now also renders the full deck-preview pipeline (rich content
fixtures) across six representative catalog themes in BOTH host schemes, plus
two mobile-width cells:

```text
Default / Dark Elegance / Sunset Glow / Neon Nights / Arctic Aurora /
Sakura Blossom  x  light + dark   (desktop 1200x900)
Default (light) + Arctic Aurora (dark)  (mobile 390x900)
```

Every cell passes the same per-element contrast sampling (WCAG 4.5:1 body,
3:1 large/bold), keyboard reachability, focus visibility, label coverage,
overflow, and reduced-motion checks. Two accessibility fixes came out of this
matrix:

- `.vt-slide-surface` now paints an opaque averaged underlay beneath gradient
  themes so effective backgrounds always resolve (`--vt-slide-bg-solid`).
- Accent-tinted small text (list badges, year chips, links) and callout
  variant colors adapt to the resolved surface at WCAG thresholds via
  `ensureReadable` instead of fixed hues.

Evidence files follow the `phase10g-matrix-*.png` naming in
`submission-assets/`; the full pass/fail table is in
`phase9h-visual-qa-report.json`.
