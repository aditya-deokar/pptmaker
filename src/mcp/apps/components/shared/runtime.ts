import { App } from '@modelcontextprotocol/ext-apps';
import {
  attachHostAdaptation,
  vertoSkinStyles,
} from './verto-skin';

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

export function mountWidget(render: RenderHandler): void {
  injectStyles(vertoSkinStyles);

  // Host adaptation must be registered BEFORE connect(): the host may deliver
  // theme/context immediately after the ui/initialize handshake.
  const refreshHostAdaptation = attachHostAdaptation(app);

  // Handlers must be registered BEFORE connect(): the host may deliver the
  // current tool result immediately after the ui/initialize handshake.
  app.ontoolresult = (params) => {
    renderFromPayload(params.structuredContent, render);
  };

  app.connect()
    .then(() => {
      refreshHostAdaptation();
    })
    .catch((error) => {
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

/**
 * Plan 10 F7/§4: widgets register cleanup (poll timers, pending edits) that
 * runs when the host tears the view down.
 */
export function onTeardown(handler: () => void): void {
  app.onteardown = async () => {
    handler();
    return {};
  };
}

/**
 * Plan 10 F6/§4: structured widget telemetry into host logs. Used for the
 * unsaved-changes warning when the host tears a view down mid-edit.
 * Falls back to console when the host has no sendLog support.
 */
export function logWidgetWarning(message: string): void {
  const logger = app as unknown as {
    sendLog?: (params: { level: string; message: string }) => Promise<unknown>;
  };

  if (typeof logger.sendLog === 'function') {
    void logger.sendLog({ level: 'warning', message }).catch(() => {});
    return;
  }

  console.warn(message);
}

let lastContextDigest = '';

/**
 * Plan 10 F8: pushes widget-side state back to the LLM so follow-up turns
 * stay grounded. Capability-guarded and de-duplicated by digest; a silent
 * no-op on hosts without updateModelContext support.
 */
export async function pushModelContext(
  structuredContent: Record<string, unknown>,
  textDigest: string
): Promise<boolean> {
  const trimmed = textDigest.trim();

  if (!trimmed || trimmed === lastContextDigest) {
    return false;
  }

  if (!app.getHostCapabilities()?.updateModelContext) {
    return false;
  }

  try {
    await app.updateModelContext({
      content: [{ type: 'text', text: trimmed }],
      structuredContent,
    });
    lastContextDigest = trimmed;
    return true;
  } catch {
    return false;
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
