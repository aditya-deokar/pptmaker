import { App } from '@modelcontextprotocol/ext-apps';

type VertoPayload = Record<string, unknown>;

type RenderHandler = (payload: VertoPayload) => void;

const TOOL_CALL_TIMEOUT_MS = 15_000;

declare global {
  interface Window {
    /**
     * Standalone/test hook: pre-seeds a widget payload when the HTML is
     * rendered outside an MCP Apps host (e.g. the Phase 9H visual QA
     * harness). Real hosts deliver data via `ontoolresult` instead.
     */
    __VERTO_MCP_PAYLOAD__?: VertoPayload;
  }
}

/**
 * MCP Apps client bridge. Replaces the former hand-rolled postMessage
 * JSON-RPC implementation (and its legacy host-global fallbacks) with the
 * standardized SDK `App`, which auto-detects the host environment.
 */
const app = new App(
  { name: 'verto-ai', version: '0.1.0' },
  {},
  { autoResize: true }
);

export const baseStyles = `
  :root {
    color-scheme: light dark;
    --bg: #fbfbfc;
    --fg: #18181b;
    --muted: #6b7280;
    --line: #d7dce2;
    --accent: #0f766e;
    --accent-soft: #ccfbf1;
    --surface: #ffffff;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0b0c0f;
      --fg: #f4f4f5;
      --muted: #a1a1aa;
      --line: #2f333a;
      --accent: #5eead4;
      --accent-soft: #123532;
      --surface: #111318;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-width: 260px;
    background: var(--bg);
    color: var(--fg);
    font-size: 14px;
    line-height: 1.45;
  }
  main {
    width: 100%;
    min-height: 180px;
    padding: 18px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 8px;
  }
  h1 {
    margin: 0 0 12px;
    font-size: 18px;
    line-height: 1.25;
    letter-spacing: 0;
  }
  .muted { color: var(--muted); }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-top: 1px solid var(--line);
    padding: 10px 0;
  }
  .row:first-of-type { border-top: 0; }
  .label { color: var(--muted); }
  .value { font-weight: 650; text-align: right; overflow-wrap: anywhere; }
  .bar {
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: color-mix(in srgb, var(--line) 70%, transparent);
    margin: 14px 0 6px;
  }
  .fill {
    width: var(--progress, 0%);
    height: 100%;
    background: var(--accent);
    transition: width 180ms ease;
  }
  .slides {
    display: grid;
    gap: 8px;
    margin-top: 12px;
  }
  .slide {
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 10px;
    background: color-mix(in srgb, var(--surface) 88%, var(--accent-soft));
  }
  .slide-title {
    font-weight: 650;
    overflow-wrap: anywhere;
  }
  .status {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 3px 8px;
    background: var(--accent-soft);
    color: var(--fg);
    font-size: 12px;
    font-weight: 650;
  }
  a {
    color: var(--accent);
    font-weight: 650;
    text-decoration: none;
  }
`;

export function mountWidget(render: RenderHandler): void {
  injectStyles(baseStyles);

  // Handlers must be registered BEFORE connect(): the host may deliver the
  // current tool result immediately after the ui/initialize handshake.
  app.ontoolresult = (params) => {
    renderFromPayload(params.structuredContent, render);
  };

  app.connect().catch((error) => {
    console.warn('Verto MCP Apps bridge was not initialized:', error);
  });

  // Standalone rendering (visual QA / static preview).
  if (window.__VERTO_MCP_PAYLOAD__) {
    renderFromPayload(window.__VERTO_MCP_PAYLOAD__, render);
  }
}

export async function callMcpTool(
  name: string,
  args: Record<string, unknown>
): Promise<VertoPayload> {
  const result = await app.callServerTool(
    { name, arguments: args },
    { timeout: TOOL_CALL_TIMEOUT_MS }
  );
  return normalizePayload(result);
}

export async function sendFollowUpMessage(prompt: string): Promise<void> {
  if (!prompt.trim()) {
    return;
  }

  try {
    await app.sendMessage({
      role: 'user',
      content: [{ type: 'text', text: prompt }],
    });
  } catch {
    throw new Error('This host has not enabled follow-up messages for Verto AI yet.');
  }
}

export function byId(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing widget element: ${id}`);
  }

  return element;
}

export function setText(id: string, value: unknown): void {
  byId(id).textContent = value == null || value === '' ? 'Not available' : String(value);
}

export function setLink(id: string, href: unknown): void {
  const element = byId(id);

  if (!(element instanceof HTMLAnchorElement)) {
    return;
  }

  if (typeof href !== 'string' || href.length === 0) {
    element.removeAttribute('href');
    element.textContent = 'Not available';
    return;
  }

  element.href = href;
  element.target = '_blank';
  element.rel = 'noopener noreferrer';
  element.textContent = 'Open in Verto';
}

export function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

export function getString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

export function getNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function getArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function injectStyles(css: string): void {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

function renderFromPayload(raw: unknown, render: RenderHandler): void {
  render(normalizePayload(raw));
}

function normalizePayload(raw: unknown): VertoPayload {
  const structured = getStructuredContent(raw);
  if (structured) return structured;

  const parsedText = readJsonText(raw);
  if (parsedText) return parsedText;

  return getRecord(raw);
}

function getStructuredContent(value: unknown): VertoPayload | null {
  const record = getRecord(value);
  const structured = record.structuredContent || record.structured_content;
  return structured ? getRecord(structured) : null;
}

function readJsonText(value: unknown): VertoPayload | null {
  const content = getArray(getRecord(value).content);
  const textBlock = content.find((item) => {
    const record = getRecord(item);
    return record.type === 'text' && typeof record.text === 'string';
  });

  if (!textBlock) {
    return null;
  }

  try {
    return getRecord(JSON.parse(getString(getRecord(textBlock).text)));
  } catch {
    return null;
  }
}
