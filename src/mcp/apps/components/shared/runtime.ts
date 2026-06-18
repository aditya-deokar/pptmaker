type VertoPayload = Record<string, unknown>;

type RenderHandler = (payload: VertoPayload) => void;
type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  timeoutId: number;
};

const MCP_APPS_PROTOCOL_VERSION = '2026-01-26';
const TOOL_CALL_TIMEOUT_MS = 15_000;
const BRIDGE_INIT_TIMEOUT_MS = 5_000;

let rpcId = 0;
let bridgeReady: Promise<void> | null = null;
const pendingRequests = new Map<number, PendingRequest>();

declare global {
  interface Window {
    openai?: {
      toolOutput?: unknown;
      toolResult?: unknown;
      toolResponse?: unknown;
      callTool?: (name: string, args: Record<string, unknown>) => Promise<unknown>;
      sendFollowUpMessage?: (message: {
        prompt: string;
        scrollToBottom?: boolean;
      }) => Promise<unknown> | unknown;
    };
    __VERTO_MCP_PAYLOAD__?: VertoPayload;
  }
}

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

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;

    const message = event.data;
    if (!message || typeof message !== 'object') return;

    if (message.jsonrpc === '2.0') {
      if (handleRpcResponse(message)) return;

      if (message.method === 'ui/notifications/tool-result') {
        renderFromPayload(message.params, render);
      }
      return;
    }

    renderFromPayload(message.result || message.payload || message, render);
  });

  initializeMcpAppsBridge().catch((error) => {
    console.warn('Verto MCP Apps bridge was not initialized:', error);
  });

  renderFromPayload(pickInitialPayload(), render);
}

export async function callMcpTool(
  name: string,
  args: Record<string, unknown>
): Promise<VertoPayload> {
  const response = await callMcpToolRaw(name, args);
  const payload = normalizePayload(response);
  window.__VERTO_MCP_PAYLOAD__ = payload;
  return payload;
}

export async function sendFollowUpMessage(prompt: string): Promise<void> {
  if (!prompt.trim()) {
    return;
  }

  const openaiBridge = window.openai;
  if (typeof openaiBridge?.sendFollowUpMessage === 'function') {
    await openaiBridge.sendFollowUpMessage({ prompt, scrollToBottom: true });
    return;
  }

  if (!hasParentBridge()) {
    throw new Error('This host has not enabled ChatGPT follow-up messages for the widget.');
  }

  rpcNotify('ui/message', {
    role: 'user',
    content: [{ type: 'text', text: prompt }],
  });
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

async function callMcpToolRaw(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  if (hasParentBridge()) {
    try {
      await initializeMcpAppsBridge();
      return await rpcRequest('tools/call', {
        name,
        arguments: args,
      }, TOOL_CALL_TIMEOUT_MS);
    } catch (error) {
      if (typeof window.openai?.callTool !== 'function') {
        throw error;
      }
    }
  }

  if (typeof window.openai?.callTool === 'function') {
    return window.openai.callTool(name, args);
  }

  throw new Error('This host has not enabled widget tool calls for Verto AI yet.');
}

function hasParentBridge(): boolean {
  return typeof window !== 'undefined' && window.parent !== window;
}

function initializeMcpAppsBridge(): Promise<void> {
  if (!hasParentBridge()) {
    return Promise.resolve();
  }

  if (!bridgeReady) {
    bridgeReady = rpcRequest('ui/initialize', {
      appInfo: { name: 'verto-ai', version: '0.1.0' },
      appCapabilities: {},
      protocolVersion: MCP_APPS_PROTOCOL_VERSION,
    }, BRIDGE_INIT_TIMEOUT_MS)
      .then(() => {
        rpcNotify('ui/notifications/initialized', {});
      })
      .catch((error) => {
        bridgeReady = null;
        throw error;
      });
  }

  return bridgeReady;
}

function rpcNotify(method: string, params: Record<string, unknown>): void {
  window.parent.postMessage({ jsonrpc: '2.0', method, params }, '*');
}

function rpcRequest(
  method: string,
  params: Record<string, unknown>,
  timeoutMs: number
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const id = ++rpcId;
    const timeoutId = window.setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error(`Timed out waiting for ${method}.`));
    }, timeoutMs);

    pendingRequests.set(id, { resolve, reject, timeoutId });
    window.parent.postMessage({ jsonrpc: '2.0', id, method, params }, '*');
  });
}

function handleRpcResponse(message: Record<string, unknown>): boolean {
  if (typeof message.id !== 'number' || typeof message.method === 'string') {
    return false;
  }

  const pending = pendingRequests.get(message.id);
  if (!pending) {
    return false;
  }

  pendingRequests.delete(message.id);
  window.clearTimeout(pending.timeoutId);

  if (message.error) {
    pending.reject(message.error);
  } else {
    pending.resolve(message.result);
  }

  return true;
}

function pickInitialPayload(): unknown {
  if (window.__VERTO_MCP_PAYLOAD__) {
    return window.__VERTO_MCP_PAYLOAD__;
  }

  const openai = window.openai || {};
  return openai.toolOutput || openai.toolResult || openai.toolResponse || {};
}

function renderFromPayload(raw: unknown, render: RenderHandler): void {
  const payload = normalizePayload(raw);
  window.__VERTO_MCP_PAYLOAD__ = payload;
  render(payload);
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
