/**
 * Generation Progress widget (plan 10 F7).
 *
 * Ambient live-generation experience bound to `presentation_generate` /
 * `presentation_generation_status`: an in-widget auto-poll loop with
 * adaptive backoff (3s -> 8s) and a countdown ring, a stage timeline bound
 * to the run's REAL steps (`run.steps[]`) with animated connectors, and
 * elapsed/ETA chips. On completion the widget transitions itself (inline
 * "Open deck", first-slide preview rendered by the shared F1 renderer) and
 * pushes the outcome to the model via `updateModelContext` (plan F8). On
 * failure the error card + Retry follow-up behaviour is preserved.
 */

import {
  byId,
  callMcpTool,
  getArray,
  getNumber,
  getRecord,
  getString,
  injectStyles,
  mountWidget,
  onTeardown,
  pushModelContext,
  sendFollowUpMessage,
} from './shared/runtime';
import { renderSlideContent } from './shared/slide-renderer';
import {
  extractWidgetLinks,
  renderDeepLinkMenu,
  setWidgetTheme,
} from './shared/verto-skin';

const POLL_BASE_MS = 3000;
const POLL_MAX_MS = 8000;
const POLL_BACKOFF_STEP_MS = 1000;
const POLL_TICK_MS = 250;
const MAX_CONSECUTIVE_POLL_FAILURES = 3;

const generationStyles = `
  .generation-shell {
    display: grid;
    gap: 16px;
    min-height: 360px;
    padding: 24px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    letter-spacing: -0.01em;
  }
  .generation-header {
    display: grid;
    gap: 6px;
    margin-bottom: 8px;
    padding-right: 48px;
  }
  .generation-kicker {
    color: var(--accent);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.05em;
  }
  .generation-title {
    margin: 0;
    max-width: 44rem;
    font-size: 26px;
    font-weight: 800;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }
  .generation-summary {
    max-width: 46rem;
    margin: 4px 0 12px;
    color: var(--muted);
    font-size: 15px;
    overflow-wrap: anywhere;
  }
  .status-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-height: 28px;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    min-height: 26px;
    max-width: 100%;
    border: 1px solid color-mix(in srgb, var(--line) 50%, transparent);
    border-radius: 99px;
    padding: 4px 12px;
    background: color-mix(in srgb, var(--surface) 60%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: var(--fg);
    font-size: 12px;
    font-weight: 600;
    overflow-wrap: anywhere;
    white-space: nowrap;
  }
  .pill.running,
  .pill.complete {
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
  }
  .pill.failed {
    border-color: #fca5a5;
    color: #ef4444;
    background: color-mix(in srgb, #fef2f2 80%, transparent);
  }
  @media (prefers-color-scheme: dark) {
    .pill.failed {
      border-color: #7f1d1d;
      color: #fca5a5;
      background: color-mix(in srgb, #450a0a 60%, transparent);
    }
  }
  .progress-stage {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(200px, 260px);
    gap: 20px;
  }
  .progress-panel,
  .action-panel,
  .timeline-panel,
  .preview-panel {
    border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
    border-radius: 16px;
    background: color-mix(in srgb, var(--surface) 75%, transparent);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
  }
  .progress-panel {
    display: grid;
    gap: 20px;
    padding: 24px;
  }
  .progress-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: start;
  }
  .progress-label {
    margin: 0 0 4px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .progress-percent {
    margin: 0;
    font-size: 48px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--fg);
  }
  .poll-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .poll-ring {
    position: relative;
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 46px;
    height: 46px;
  }
  .poll-ring[hidden] { display: none; }
  .poll-ring svg {
    position: absolute;
    inset: 0;
    transform: rotate(-90deg);
  }
  .ring-track,
  .ring-fill {
    fill: none;
    stroke-width: 3.4;
    stroke-linecap: round;
  }
  .ring-track { stroke: color-mix(in srgb, var(--line) 70%, transparent); }
  .ring-fill {
    stroke: var(--accent);
    stroke-dasharray: 100;
    stroke-dashoffset: var(--ring, 0);
    transition: stroke-dashoffset 260ms linear;
  }
  .ring-label {
    position: relative;
    color: var(--muted);
    font-size: 11px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .current-step {
    max-width: 16rem;
    margin: 0;
    color: var(--fg);
    font-size: 15px;
    font-weight: 600;
    text-align: right;
    overflow-wrap: anywhere;
  }
  .progress-track {
    height: 14px;
    border-radius: 999px;
    overflow: hidden;
    background: color-mix(in srgb, var(--line) 50%, transparent);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
  }
  .progress-fill {
    width: var(--progress, 0%);
    height: 100%;
    border-radius: inherit;
    background: var(--vt-fill);
    transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: inset 0 -2px 4px rgba(0,0,0,0.1);
  }
  .status-message {
    min-height: 42px;
    margin: 0;
    color: var(--muted);
    font-size: 14px;
    overflow-wrap: anywhere;
  }
  .error-card {
    display: none;
    border: 1px solid #fca5a5;
    border-radius: 12px;
    padding: 16px;
    color: #ef4444;
    background: color-mix(in srgb, #fef2f2 90%, transparent);
    font-weight: 500;
  }
  @media (prefers-color-scheme: dark) {
    .error-card {
      border-color: #7f1d1d;
      color: #fca5a5;
      background: color-mix(in srgb, #450a0a 60%, transparent);
    }
  }
  .error-card.is-visible {
    display: block;
  }
  .action-panel {
    display: grid;
    align-content: start;
    gap: 12px;
    padding: 20px;
  }
  .action-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
  }
  .action-note {
    min-height: 40px;
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.4;
  }
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 42px;
    border: 1px solid color-mix(in srgb, var(--line) 50%, transparent);
    border-radius: 99px;
    padding: 8px 16px;
    background: color-mix(in srgb, var(--surface) 80%, transparent);
    color: var(--fg);
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .button:hover:not(:disabled) {
    background: var(--surface);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transform: translateY(-1px);
  }
  .button.primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--bg);
  }
  .button.primary:hover:not(:disabled) {
    opacity: 0.9;
    box-shadow: 0 6px 16px color-mix(in srgb, var(--accent) 30%, transparent);
  }
  .button[aria-disabled="true"],
  .button:disabled {
    cursor: default;
    opacity: 0.5;
  }
  .button.is-busy {
    cursor: wait;
    opacity: 0.7;
  }
  .timeline-panel {
    display: grid;
    gap: 16px;
    padding: 20px;
  }
  .timeline-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .stage-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 14px;
  }
  .stage {
    position: relative;
    display: grid;
    grid-template-rows: auto auto 1fr;
    gap: 8px;
    min-width: 0;
    min-height: 124px;
    border: 1px solid color-mix(in srgb, var(--line) 40%, transparent);
    border-radius: 12px;
    padding: 12px;
    background: color-mix(in srgb, var(--surface) 60%, transparent);
    transition: all 0.2s;
  }
  /* Animated connector into the next stage (F7) */
  .stage::after {
    content: "";
    position: absolute;
    top: 22px;
    right: -15px;
    z-index: 1;
    width: 16px;
    height: 3px;
    border-radius: 2px;
    background: linear-gradient(90deg, var(--vt-accent), var(--vt-accent));
    opacity: 0;
    transition: opacity 240ms ease;
  }
  .stage.done::after { opacity: 1; }
  .stage.current::after {
    opacity: 1;
    background-image: linear-gradient(90deg, transparent, var(--vt-accent), transparent);
    background-size: 200% 100%;
    animation: verto-connector-flow 1400ms ease-in-out infinite;
  }
  .stage:last-child::after { display: none; }
  @keyframes verto-connector-flow {
    from { background-position: 200% 0; }
    to { background-position: -200% 0; }
  }
  .stage.current {
    background: color-mix(in srgb, var(--surface) 95%, var(--accent-soft));
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  }
  .stage-dot {
    width: 20px;
    height: 20px;
    border: 2px solid color-mix(in srgb, var(--line) 60%, transparent);
    border-radius: 999px;
    background: var(--surface);
    transition: all 0.3s;
  }
  .stage.done .stage-dot {
    border-color: var(--vt-accent);
    background: var(--vt-accent);
  }
  .stage.current .stage-dot {
    border-color: var(--vt-accent);
    background: var(--surface);
    box-shadow: inset 0 0 0 4px var(--vt-accent);
    animation: verto-stage-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  .stage.failed .stage-dot {
    border-color: #ef4444;
    background: #ef4444;
  }
  .stage-name {
    font-size: 13px;
    font-weight: 700;
    color: var(--fg);
    overflow-wrap: anywhere;
  }
  .stage-copy {
    margin: 0;
    color: var(--muted);
    font-size: 12px;
    overflow-wrap: anywhere;
  }
  @keyframes verto-stage-pulse {
    0% { box-shadow: inset 0 0 0 4px var(--vt-accent), 0 0 0 0 color-mix(in srgb, var(--vt-accent) 40%, transparent); }
    70% { box-shadow: inset 0 0 0 4px var(--vt-accent), 0 0 0 8px transparent; }
    100% { box-shadow: inset 0 0 0 4px var(--vt-accent), 0 0 0 0 transparent; }
  }
  .preview-panel {
    display: grid;
    gap: 12px;
    padding: 20px;
  }
  .preview-panel[hidden] { display: none; }
  .preview-title {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .preview-stage {
    min-height: 180px;
    padding: 24px;
  }
  .preview-empty {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
  }
  @media (prefers-reduced-motion: reduce) {
    .stage.current .stage-dot,
    .progress-fill,
    .ring-fill {
      animation: none !important;
      transition: none !important;
    }
    .stage.current::after {
      animation: none !important;
      background-image: linear-gradient(90deg, var(--vt-accent), var(--vt-accent));
    }
  }
  @media (max-width: 700px) {
    .progress-stage { grid-template-columns: 1fr; }
    .stage-grid { grid-template-columns: repeat(auto-fill, minmax(128px, 1fr)); }
    .progress-head { align-items: start; }
    .progress-percent { font-size: 42px; }
    .stage::after { display: none; }
  }
  @media (max-width: 440px) {
    .generation-shell { padding: 16px; }
    .stage-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .progress-head { grid-template-columns: 1fr; }
    .current-step { text-align: left; }
  }
`;

const DISPLAY_STAGES = [
  {
    id: 'queued',
    name: 'Queued',
    copy: 'Preparing the run',
    threshold: 0,
  },
  {
    id: 'outline',
    name: 'Outline',
    copy: 'Structuring the story',
    threshold: 12,
  },
  {
    id: 'content',
    name: 'Content',
    copy: 'Writing slides',
    threshold: 35,
  },
  {
    id: 'design',
    name: 'Design',
    copy: 'Choosing layouts',
    threshold: 58,
  },
  {
    id: 'finalizing',
    name: 'Finalizing',
    copy: 'Saving the deck',
    threshold: 82,
  },
  {
    id: 'complete',
    name: 'Complete',
    copy: 'Ready to review',
    threshold: 100,
  },
] as const;

type DisplayStage = typeof DISPLAY_STAGES[number];

type StageState = 'done' | 'current' | 'failed' | 'pending';

type StepView = {
  name: string;
  copy: string;
  state: StageState;
};

let stylesInjected = false;

type GenerationViewModel = {
  topic: string;
  status: string;
  currentStepName: string;
  progress: number;
  presentationId: string;
  presentationOpenUrl: string;
  runId: string;
  error: string;
  createdAt: string;
  completedAt: string;
  updatedAt: string;
  isComplete: boolean;
  isFailed: boolean;
  pollHint: string;
  steps: Array<Record<string, unknown>>;
  completion: {
    slideCount: number;
    themeName: string;
    previewSlide: Record<string, unknown> | null;
  } | null;
};

function ensureGenerationStyles(): void {
  if (stylesInjected) return;
  injectStyles(generationStyles);
  stylesInjected = true;
}

function ensureMarkup(): void {
  if (document.getElementById('verto-generation-widget')) {
    return;
  }

  document.body.innerHTML = `
    <main class="generation-shell" id="verto-generation-widget">
      <div class="vt-links" id="generation-links"></div>
      <section class="generation-header" aria-labelledby="title">
        <div class="generation-kicker">Verto AI generation</div>
        <h1 class="generation-title" id="title">Generation progress</h1>
        <p class="generation-summary" id="summary">Waiting for generation data.</p>
        <div class="status-row" id="status-row" aria-label="Generation status"></div>
      </section>
      <section class="progress-stage" aria-label="Generation progress">
        <article class="progress-panel">
          <div class="progress-head">
            <div>
              <p class="progress-label">Progress</p>
              <p class="progress-percent" id="progress-percent">0%</p>
            </div>
            <div class="poll-wrap">
              <span class="poll-ring" id="poll-ring" hidden>
                <svg viewBox="0 0 36 36" focusable="false" aria-hidden="true">
                  <circle class="ring-track" cx="18" cy="18" r="15.9"></circle>
                  <circle class="ring-fill" id="ring-fill" cx="18" cy="18" r="15.9"></circle>
                </svg>
                <span class="ring-label" id="ring-label"></span>
              </span>
              <p class="current-step" id="current-step">Waiting</p>
            </div>
          </div>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <p class="status-message" id="status-message">Generation has not started yet.</p>
          <div class="error-card" id="error-card" role="status"></div>
        </article>
        <aside class="action-panel" aria-label="Generation actions">
          <p class="action-title">Next action</p>
          <a class="button primary" id="open-link">Open deck</a>
          <button class="button" id="inspect-action" type="button">Check status</button>
          <p class="action-note" id="action-note">Wait for Verto to finish the deck.</p>
        </aside>
      </section>
      <section class="preview-panel" id="preview-panel" aria-label="First slide preview" hidden>
        <p class="preview-title">First slide</p>
        <div class="preview-stage vt-slide-surface" id="preview-stage"></div>
      </section>
      <section class="timeline-panel" aria-label="Generation stages">
        <div class="timeline-head">
          <span>Stage timeline</span>
          <span id="timeline-state">Waiting</span>
        </div>
        <div class="stage-grid" id="stage-grid"></div>
      </section>
    </main>
  `;
}

function toGenerationViewModel(payload: Record<string, unknown>): GenerationViewModel {
  const widget = getRecord(payload.widget);

  let generation: Record<string, unknown>;
  let presentation: Record<string, unknown>;
  let rawCompletion: unknown = null;
  let rawSteps: unknown[] = [];

  if (widget.widget === 'generation_progress') {
    generation = getRecord(widget.generation);
    presentation = getRecord(widget.presentation);
    rawCompletion = widget.completion;
    rawSteps = getArray(widget.steps);
  } else {
    const data = getRecord(payload.data || payload);
    generation = getRecord(data.generation_run || data.generation || data);
    const status = getRecord(data.generation_status || data);
    presentation = getRecord(widget.presentation || data.presentation);
    rawSteps = getArray(generation.steps);

    rawCompletion = data.completion;

    return {
      topic: getString(generation.topic || data.topic, 'Generation progress'),
      status: getString(status.status || generation.status, 'Waiting'),
      currentStepName: getString(
        generation.current_step_name || generation.currentStepName,
        'Queued'
      ),
      progress: getNumber(generation.progress),
      presentationId: getString(
        status.presentation_id || generation.project_id || generation.projectId
      ),
      presentationOpenUrl: getString(presentation.openUrl),
      runId: getString(status.generation_run_id || generation.id),
      error: getString(generation.error),
      createdAt: getString(generation.created_at || generation.createdAt),
      completedAt: getString(generation.completed_at || generation.completedAt),
      updatedAt: getString(generation.updated_at || generation.updatedAt),
      isComplete: Boolean(status.is_complete || generation.status === 'COMPLETED'),
      isFailed: Boolean(status.is_failed || generation.status === 'FAILED'),
      pollHint: getString(status.poll_hint),
      steps: normalizeSteps(rawSteps),
      completion: readCompletion(rawCompletion),
    };
  }

  return {
    topic: getString(generation.topic, 'Generation progress'),
    status: getString(generation.status, 'Waiting'),
    currentStepName: getString(generation.currentStepName, 'Queued'),
    progress: getNumber(generation.progress),
    presentationId: getString(generation.presentationId || presentation.id),
    presentationOpenUrl: getString(presentation.openUrl),
    runId: getString(generation.runId),
    error: getString(generation.error),
    createdAt: getString(generation.createdAt),
    completedAt: getString(generation.completedAt),
    updatedAt: getString(generation.updatedAt),
    isComplete: Boolean(generation.isComplete),
    isFailed: Boolean(generation.isFailed),
    pollHint: getString(generation.pollHint),
    steps: normalizeSteps(rawSteps),
    completion: readCompletion(rawCompletion),
  };
}

function normalizeSteps(items: unknown[]): Array<Record<string, unknown>> {
  return items
    .map((item) => (item && typeof item === 'object' ? getRecord(item) : null))
    .filter((record): record is Record<string, unknown> =>
      Boolean(record && getString(record.name))
    );
}

function readCompletion(raw: unknown): GenerationViewModel['completion'] {
  if (!raw || typeof raw !== 'object') return null;

  const record = getRecord(raw);
  const slide = getRecord(record.previewSlide);

  return {
    slideCount: getNumber(record.slideCount),
    themeName: getString(record.themeName),
    previewSlide: Object.keys(slide).length > 0 ? slide : null,
  };
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function statusClass(generation: GenerationViewModel): string {
  if (generation.isFailed || generation.status === 'FAILED') return 'failed';
  if (generation.isComplete || generation.status === 'COMPLETED') return 'complete';
  if (generation.status === 'RUNNING') return 'running';
  return '';
}

function isTerminal(generation: GenerationViewModel): boolean {
  return generation.isComplete || generation.isFailed;
}

/* ------------------------------------------------------------------ */
/* Auto-poll engine (F7)                                               */
/* ------------------------------------------------------------------ */

let tickerId: number | null = null;
let nextPollAt = 0;
let pollDelayMs = POLL_BASE_MS;
let pollCount = 0;
let pollInFlight = false;
let consecutivePollFailures = 0;
let pausedRemainingMs: number | null = null;
let lastProgressSample: { at: number; progress: number } | null = null;
let etaSeconds: number | null = null;
let lastGeneration: GenerationViewModel | null = null;
let celebratedRunId = '';

function stopPolling(): void {
  if (tickerId !== null) {
    window.clearInterval(tickerId);
    tickerId = null;
  }
  nextPollAt = 0;
  hideRing();
}

function hideRing(): void {
  const ring = document.getElementById('poll-ring');

  if (ring) {
    ring.setAttribute('hidden', 'true');
  }
}

function adaptiveDelay(): number {
  return Math.min(POLL_MAX_MS, POLL_BASE_MS + pollCount * POLL_BACKOFF_STEP_MS);
}

function shouldAutoPoll(generation: GenerationViewModel | null): boolean {
  return Boolean(
    generation
      && !isTerminal(generation)
      && generation.runId
  );
}

function maybeStartPolling(): void {
  if (!shouldAutoPoll(lastGeneration) || document.hidden) {
    return;
  }

  stopPolling();
  pollDelayMs = adaptiveDelay();
  nextPollAt = Date.now() + pollDelayMs;

  const ring = document.getElementById('poll-ring');
  ring?.removeAttribute('hidden');
  updateRing(pollDelayMs);

  tickerId = window.setInterval(() => {
    if (nextPollAt === 0) return;

    const remaining = nextPollAt - Date.now();

    updateRing(Math.max(0, remaining));

    if (remaining <= 0) {
      if (tickerId !== null) {
        window.clearInterval(tickerId);
        tickerId = null;
      }
      void runAutoPoll();
    }
  }, POLL_TICK_MS);
}

function updateRing(remainingMs: number): void {
  const fraction = pollDelayMs > 0
    ? Math.max(0, Math.min(1, remainingMs / pollDelayMs))
    : 0;
  const offset = 100 * (1 - fraction);
  const root = document.documentElement.style;

  root.setProperty('--ring', offset.toFixed(1));

  const label = document.getElementById('ring-label');
  if (label) {
    label.textContent = `${Math.max(1, Math.ceil(remainingMs / 1000))}s`;
  }
}

async function runAutoPoll(): Promise<void> {
  const generation = lastGeneration;

  if (!generation?.runId || pollInFlight || isTerminal(generation)) {
    return;
  }

  pollInFlight = true;

  try {
    const payload = await callMcpTool('presentation_generation_status', {
      generation_run_id: generation.runId,
    });

    assertSuccess(payload);
    consecutivePollFailures = 0;

    const previousProgress = generation.progress;
    renderGenerationPayload(payload);

    if (lastGeneration && lastGeneration.progress <= previousProgress) {
      pollCount += 1;
    } else {
      pollCount = 0;
    }
  } catch {
    consecutivePollFailures += 1;

    if (consecutivePollFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
      stopPolling();
      setActionNote(
        'Auto-refresh paused after repeated errors. Use Check status to try again.'
      );
      return;
    }

    pollCount += 1;
  } finally {
    pollInFlight = false;
  }

  maybeStartPolling();
}

function wireLifecycleHandlers(): void {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (tickerId !== null && nextPollAt > 0) {
        pausedRemainingMs = Math.max(0, nextPollAt - Date.now());
        stopPolling();
      }
      return;
    }

    if (pausedRemainingMs !== null && shouldAutoPoll(lastGeneration)) {
      nextPollAt = Date.now() + pausedRemainingMs;
      pausedRemainingMs = null;
      pollDelayMs = Math.max(POLL_BASE_MS, pollDelayMs);
      const ring = document.getElementById('poll-ring');
      ring?.removeAttribute('hidden');

      tickerId = window.setInterval(() => {
        if (nextPollAt === 0) return;

        const remaining = nextPollAt - Date.now();
        updateRing(Math.max(0, remaining));

        if (remaining <= 0) {
          if (tickerId !== null) {
            window.clearInterval(tickerId);
            tickerId = null;
          }
          void runAutoPoll();
        }
      }, POLL_TICK_MS);
    } else {
      pausedRemainingMs = null;
      maybeStartPolling();
    }
  });

  onTeardown(stopPolling);
}

let lifecycleWired = false;

function ensureLifecycleHandlers(): void {
  if (lifecycleWired) return;
  wireLifecycleHandlers();
  lifecycleWired = true;
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

function renderStatusPills(generation: GenerationViewModel): void {
  const row = byId('status-row');
  row.textContent = '';
  row.appendChild(createPill(generation.status, statusClass(generation)));
  row.appendChild(createPill(`${clampProgress(generation.progress)}%`));

  if (generation.runId) {
    row.appendChild(createPill(`Run ${generation.runId.slice(0, 8)}`));
  }

  const elapsedSeconds = computeElapsedSeconds(generation);

  if (elapsedSeconds !== null && !generation.isFailed) {
    const elapsed = createPill(`Elapsed ${formatDuration(elapsedSeconds)}`);
    elapsed.id = 'elapsed-pill';
    row.appendChild(elapsed);
  }

  if (etaSeconds !== null && !isTerminal(generation)) {
    const eta = createPill(`ETA ~${formatDuration(etaSeconds)}`);
    eta.id = 'eta-pill';
    row.appendChild(eta);
  }

  if (generation.isComplete && elapsedSeconds !== null) {
    row.appendChild(createPill(`Built in ${formatDuration(elapsedSeconds)}`));
  }
}

function createPill(label: string, className = ''): HTMLElement {
  const pill = document.createElement('span');
  pill.className = `pill${className ? ` ${className}` : ''}`;
  pill.textContent = label || 'Waiting';
  return pill;
}

function computeElapsedSeconds(generation: GenerationViewModel): number | null {
  const start = Date.parse(generation.createdAt);

  if (Number.isNaN(start)) return null;

  const endValue = generation.completedAt || generation.updatedAt;
  const explicitEnd = Date.parse(endValue);
  const end = !Number.isNaN(explicitEnd)
    ? explicitEnd
    : isTerminal(generation)
      ? Date.now()
      : Date.now();

  return Math.max(0, Math.round((end - start) / 1000));
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function getStatusMessage(generation: GenerationViewModel): string {
  if (generation.isFailed) {
    return 'Generation stopped before the deck was ready.';
  }

  if (generation.isComplete) {
    return generation.presentationId
      ? 'Your deck is ready to review.'
      : 'Generation finished, but the deck ID is not available yet.';
  }

  if (generation.progress <= 0) {
    return 'Verto is preparing the generation run.';
  }

  return generation.pollHint
    || 'Verto is building the deck. This card refreshes automatically.';
}

function renderProgress(generation: GenerationViewModel): void {
  const progress = clampProgress(generation.progress);
  document.documentElement.style.setProperty('--progress', `${progress}%`);
  byId('progress-percent').textContent = `${progress}%`;
  byId('current-step').textContent = generation.currentStepName || stageForProgress(progress).name;
  byId('status-message').textContent = getStatusMessage(generation);
}

function renderError(generation: GenerationViewModel): void {
  const errorCard = byId('error-card');

  if (!generation.isFailed) {
    errorCard.classList.remove('is-visible');
    errorCard.textContent = '';
    return;
  }

  errorCard.classList.add('is-visible');
  errorCard.textContent = generation.error
    ? `Error: ${generation.error}. Ask ChatGPT to retry generation with a simpler topic or fewer constraints.`
    : 'Ask ChatGPT to retry generation with a simpler topic or fewer constraints.';
}

function renderPreview(generation: GenerationViewModel): void {
  const panel = document.getElementById('preview-panel');
  const stage = byId('preview-stage');

  if (!panel) return;

  const content = generation.completion?.previewSlide?.content;

  if (!generation.isComplete || !content) {
    panel.setAttribute('hidden', 'true');
    stage.textContent = '';
    return;
  }

  stage.textContent = '';
  stage.innerHTML = renderSlideContent(content);

  if (!stage.firstChild) {
    stage.appendChild(createPreviewFallback(generation));
  }

  panel.removeAttribute('hidden');
}

function createPreviewFallback(generation: GenerationViewModel): HTMLElement {
  const fallback = document.createElement('p');
  fallback.className = 'preview-empty';

  const count = generation.completion?.slideCount ?? 0;
  fallback.textContent = count > 0
    ? `Deck ready with ${count} slide${count === 1 ? '' : 's'}.`
    : 'Deck ready.';

  return fallback;
}

function setActionNote(message: string): void {
  byId('action-note').textContent = message;
}

function configureActions(generation: GenerationViewModel): void {
  const openLink = byId('open-link');
  const inspectButton = byId('inspect-action');
  const note = byId('action-note');

  if (openLink instanceof HTMLAnchorElement) {
    openLink.textContent = generation.isComplete ? 'Open deck' : 'Deck not ready';

    if (generation.isComplete && generation.presentationOpenUrl) {
      openLink.href = generation.presentationOpenUrl;
      openLink.target = '_blank';
      openLink.rel = 'noopener noreferrer';
      openLink.setAttribute('aria-disabled', 'false');
    } else {
      openLink.removeAttribute('href');
      openLink.setAttribute('aria-disabled', 'true');
    }
  }

  if (inspectButton instanceof HTMLButtonElement) {
    inspectButton.disabled = false;
    inspectButton.classList.remove('is-busy');
    inspectButton.setAttribute('aria-disabled', 'false');
    inspectButton.onclick = null;

    if (generation.isFailed) {
      inspectButton.textContent = 'Ask ChatGPT to retry';
      inspectButton.onclick = () => askChatGptToRetry(generation, inspectButton, note);
    } else if (generation.isComplete && generation.presentationId) {
      inspectButton.textContent = 'Inspect with ChatGPT';
      inspectButton.onclick = () => askChatGptToInspect(generation, inspectButton, note);
    } else if (generation.runId) {
      inspectButton.textContent = 'Check status';
      inspectButton.onclick = () => refreshGenerationStatus(generation, inspectButton, note);
    } else {
      inspectButton.textContent = 'Check status';
      inspectButton.disabled = true;
      inspectButton.setAttribute('aria-disabled', 'true');
    }
  }

  if (generation.isFailed) {
    note.textContent = 'Ask ChatGPT to retry generation with clearer constraints.';
  } else if (generation.isComplete) {
    note.textContent = generation.presentationId
      ? 'Open the deck or ask ChatGPT to inspect, edit, or publish it.'
      : 'Ask ChatGPT to check the completed generation status.';
  } else {
    note.textContent = 'This card refreshes automatically until the deck is ready.';
  }
}

async function refreshGenerationStatus(
  generation: GenerationViewModel,
  button: HTMLButtonElement,
  note: HTMLElement
): Promise<void> {
  if (!generation.runId) return;

  await runButtonAction(button, note, 'Checking...', async () => {
    const payload = await callMcpTool('presentation_generation_status', {
      generation_run_id: generation.runId,
    });
    renderGenerationPayload(payload);
    byId('action-note').textContent = 'Generation status refreshed.';
  });
}

async function askChatGptToInspect(
  generation: GenerationViewModel,
  button: HTMLButtonElement,
  note: HTMLElement
): Promise<void> {
  if (!generation.presentationId) return;

  await runButtonAction(button, note, 'Asking ChatGPT...', async () => {
    await sendFollowUpMessage(
      `Inspect Verto presentation ${generation.presentationId}, summarize the deck, and suggest the next best edits.`
    );
    note.textContent = 'Asked ChatGPT to inspect this deck.';
  });
}

async function askChatGptToRetry(
  generation: GenerationViewModel,
  button: HTMLButtonElement,
  note: HTMLElement
): Promise<void> {
  await runButtonAction(button, note, 'Asking ChatGPT...', async () => {
    const topic = generation.topic === 'Generation progress'
      ? 'this Verto presentation'
      : `"${generation.topic}"`;
    await sendFollowUpMessage(
      `Retry the Verto presentation generation for ${topic}. Use simpler constraints and avoid starting duplicate runs unless needed.`
    );
    note.textContent = 'Asked ChatGPT to prepare a retry.';
  });
}

async function runButtonAction(
  button: HTMLButtonElement,
  note: HTMLElement,
  busyLabel: string,
  action: () => Promise<void>
): Promise<void> {
  const previousLabel = button.textContent || '';
  button.disabled = true;
  button.classList.add('is-busy');
  button.setAttribute('aria-disabled', 'true');
  button.textContent = busyLabel;

  try {
    await action();
  } catch (error) {
    note.textContent = getActionErrorMessage(error);
  } finally {
    button.disabled = false;
    button.classList.remove('is-busy');
    button.setAttribute('aria-disabled', 'false');
    if (button.textContent === busyLabel) {
      button.textContent = previousLabel;
    }
  }
}

function getActionErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    if (typeof record.message === 'string') {
      return record.message;
    }
  }

  return 'ChatGPT could not complete that Verto action. Try again in a moment.';
}

function assertSuccess(payload: Record<string, unknown>): void {
  if (payload.success === false) {
    const error = getRecord(payload.error);
    throw new Error(getString(error.message, 'Generation status unavailable.'));
  }
}

function stageForProgress(progress: number): DisplayStage {
  let current: DisplayStage = DISPLAY_STAGES[0];
  for (const stage of DISPLAY_STAGES) {
    if (progress >= stage.threshold) {
      current = stage;
    }
  }
  return current;
}

/* ------------------------------------------------------------------ */
/* Timeline — real run steps first, cosmetic stages as fallback         */
/* ------------------------------------------------------------------ */

function normalizeStepStatus(value: string): StageState {
  switch (value) {
    case 'completed':
      return 'done';
    case 'running':
      return 'current';
    case 'failed':
    case 'error':
      return 'failed';
    default:
      return 'pending';
  }
}

function buildTimelineSteps(generation: GenerationViewModel): StepView[] {
  if (generation.steps.length > 0) {
    return generation.steps.map((step) => {
      const record = getRecord(step);
      const state = normalizeStepStatus(getString(record.status, 'pending'));
      const description = getString(record.description);

      let copy = getString(record.details);

      if (!copy && state === 'failed') {
        copy = 'Needs retry';
      }

      if (!copy && state === 'current' && generation.currentStepName) {
        copy = description || generation.currentStepName;
      }

      if (!copy) {
        copy = description;
      }

      return {
        name: getString(record.name, 'Step'),
        copy,
        state,
      };
    });
  }

  const progress = clampProgress(generation.progress);
  const currentStage = generation.isComplete
    ? DISPLAY_STAGES[DISPLAY_STAGES.length - 1]
    : stageForProgress(progress);
  const currentIndex = DISPLAY_STAGES.findIndex((stage) => stage.id === currentStage.id);

  return DISPLAY_STAGES.map((stage, index) => ({
    name: stage.name,
    copy: index === currentIndex && generation.currentStepName
      ? generation.currentStepName
      : '',
    state: stageState(index, currentIndex, generation),
  }));
}

function stageState(stageIndex: number, currentIndex: number, generation: GenerationViewModel): StageState {
  if (generation.isFailed && stageIndex === currentIndex) return 'failed';
  if (generation.isComplete) return 'done';
  if (stageIndex < currentIndex) return 'done';
  if (stageIndex === currentIndex) return 'current';
  return 'pending';
}

function renderTimeline(generation: GenerationViewModel): void {
  const steps = buildTimelineSteps(generation);
  const grid = byId('stage-grid');

  const currentState = steps.find((step) => step.state === 'current')
    ?? steps.find((step) => step.state === 'failed')
    ?? steps[steps.length - 1];

  byId('timeline-state').textContent = generation.isComplete
    ? 'Complete'
    : currentState?.name ?? 'Waiting';

  grid.textContent = '';

  steps.forEach((step) => {
    const item = document.createElement('article');
    item.className = `stage ${step.state}`;

    const dot = document.createElement('span');
    dot.className = 'stage-dot';
    dot.setAttribute('aria-hidden', 'true');
    item.appendChild(dot);

    const title = document.createElement('div');
    title.className = 'stage-name';
    title.textContent = step.name;
    item.appendChild(title);

    const copy = document.createElement('p');
    copy.className = 'stage-copy';
    copy.textContent = step.copy;
    item.appendChild(copy);

    grid.appendChild(item);
  });
}

/* ------------------------------------------------------------------ */
/* Payload orchestration                                               */
/* ------------------------------------------------------------------ */

function updateEtaEstimate(generation: GenerationViewModel): void {
  if (isTerminal(generation)) {
    etaSeconds = null;
    lastProgressSample = null;
    return;
  }

  const now = Date.now();
  const previous = lastProgressSample;

  if (previous && generation.progress > previous.progress) {
    const seconds = (now - previous.at) / 1000;
    const delta = generation.progress - previous.progress;

    if (seconds >= 1 && delta > 0) {
      const velocity = delta / seconds;

      etaSeconds = velocity > 0.05 && generation.progress < 100
        ? Math.round((100 - generation.progress) / velocity)
        : null;

      if (etaSeconds !== null && (etaSeconds < 5 || etaSeconds > 900)) {
        etaSeconds = null;
      }
    }
  }

  lastProgressSample = { at: now, progress: generation.progress };
}

function announceCompletion(generation: GenerationViewModel, previous: GenerationViewModel | null): void {
  if (
    !generation.isComplete
    || (previous?.isComplete ?? false)
    || !generation.runId
    || celebratedRunId === generation.runId
  ) {
    return;
  }

  celebratedRunId = generation.runId;

  const slideCount = generation.completion?.slideCount ?? 0;
  const presentationId = generation.presentationId || 'unknown';

  void pushModelContext(
    {
      event: 'generation_completed',
      generationRunId: generation.runId,
      presentationId,
      topic: generation.topic,
      slideCount,
    },
    `Generation run ${generation.runId} completed; presentation ${presentationId} `
      + `("${generation.topic}") is ready with ${slideCount} slides.`
      + (slideCount > 0 ? '' : ' Slide count was not available yet.')
  );

  setActionNote(
    generation.presentationId
      ? 'Deck ready! Open it or ask ChatGPT what to do next.'
      : 'Deck ready. Ask ChatGPT to open it.'
  );
}

function renderGenerationPayload(payload: Record<string, unknown>): void {
  ensureGenerationStyles();
  ensureMarkup();
  ensureLifecycleHandlers();

  const previous = lastGeneration;
  const generation = toGenerationViewModel(payload);
  lastGeneration = generation;

  stopPolling();
  updateEtaEstimate(generation);

  renderDeepLinkMenu(byId('generation-links'), extractWidgetLinks(payload));

  const themeName = generation.completion?.themeName;
  if (themeName) {
    setWidgetTheme(themeName);
  }

  byId('title').textContent = generation.topic;
  byId('summary').textContent = generation.isComplete
    ? 'Verto finished building your presentation.'
    : generation.isFailed
      ? 'Verto could not finish this presentation run.'
      : 'Verto is turning your prompt into a presentation.';

  renderStatusPills(generation);
  renderProgress(generation);
  renderError(generation);
  renderPreview(generation);
  configureActions(generation);
  renderTimeline(generation);

  announceCompletion(generation, previous);

  if (shouldAutoPoll(generation)) {
    maybeStartPolling();
  } else {
    hideRing();
  }
}

mountWidget((payload) => {
  renderGenerationPayload(payload);
});
