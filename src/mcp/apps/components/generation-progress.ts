import {
  byId,
  callMcpTool,
  getArray,
  getNumber,
  getRecord,
  getString,
  injectStyles,
  mountWidget,
  sendFollowUpMessage,
} from './shared/runtime';

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
  .timeline-panel {
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
  .current-step {
    max-width: 18rem;
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
    background: var(--accent);
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
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 12px;
  }
  .stage {
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
    border-color: var(--accent);
    background: var(--accent);
  }
  .stage.current .stage-dot {
    border-color: var(--accent);
    background: var(--surface);
    box-shadow: inset 0 0 0 4px var(--accent);
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
  .stage.current .stage-dot {
    animation: verto-stage-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  @keyframes verto-stage-pulse {
    0% { box-shadow: inset 0 0 0 4px var(--accent), 0 0 0 0 color-mix(in srgb, var(--accent) 40%, transparent); }
    70% { box-shadow: inset 0 0 0 4px var(--accent), 0 0 0 8px transparent; }
    100% { box-shadow: inset 0 0 0 4px var(--accent), 0 0 0 0 transparent; }
  }
  @media (prefers-reduced-motion: reduce) {
    .stage.current .stage-dot,
    .progress-fill {
      animation: none;
      transition: none;
    }
  }
  @media (max-width: 700px) {
    .progress-stage { grid-template-columns: 1fr; }
    .stage-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .progress-head { align-items: start; }
    .progress-percent { font-size: 42px; }
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
  isComplete: boolean;
  isFailed: boolean;
  pollHint: string;
  steps: unknown[];
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
            <p class="current-step" id="current-step">Waiting</p>
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
          <button class="button" id="inspect-action" type="button">Inspect with ChatGPT</button>
          <p class="action-note" id="action-note">Wait for Verto to finish the deck.</p>
        </aside>
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

  if (widget.widget === 'generation_progress') {
    const generation = getRecord(widget.generation);
    const presentation = getRecord(widget.presentation);

    return {
      topic: getString(generation.topic, 'Generation progress'),
      status: getString(generation.status, 'Waiting'),
      currentStepName: getString(generation.currentStepName, 'Queued'),
      progress: getNumber(generation.progress),
      presentationId: getString(generation.presentationId || presentation.id),
      presentationOpenUrl: getString(presentation.openUrl),
      runId: getString(generation.runId),
      error: getString(generation.error),
      isComplete: Boolean(generation.isComplete),
      isFailed: Boolean(generation.isFailed),
      pollHint: getString(generation.pollHint),
      steps: getArray(widget.steps),
    };
  }

  const data = getRecord(payload.data || payload);
  const status = getRecord(data.generation_status || data);
  const run = getRecord(status.generation_run || data.generation_run || data.generation || {});

  return {
    topic: getString(run.topic || data.topic, 'Generation progress'),
    status: getString(status.status || data.status || run.status, 'Waiting'),
    currentStepName: getString(run.current_step_name || run.currentStepName || data.current_step_name, 'Queued'),
    progress: getNumber(run.progress || data.progress),
    presentationId: getString(status.presentation_id || data.presentation_id || run.project_id || run.projectId),
    presentationOpenUrl: '',
    runId: getString(status.generation_run_id || data.generation_run_id || run.id),
    error: getString(run.error || data.error),
    isComplete: Boolean(status.is_complete || data.is_complete || data.status === 'COMPLETED'),
    isFailed: Boolean(status.is_failed || data.is_failed || data.status === 'FAILED'),
    pollHint: getString(status.poll_hint || data.poll_hint),
    steps: getArray(run.steps),
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

function renderStatusPills(generation: GenerationViewModel): void {
  const row = byId('status-row');
  row.textContent = '';
  row.appendChild(createPill(generation.status, statusClass(generation)));
  row.appendChild(createPill(`${clampProgress(generation.progress)}%`));
  if (generation.runId) {
    row.appendChild(createPill(`Run ${generation.runId.slice(0, 8)}`));
  }
}

function createPill(label: string, className = ''): HTMLElement {
  const pill = document.createElement('span');
  pill.className = `pill${className ? ` ${className}` : ''}`;
  pill.textContent = label || 'Waiting';
  return pill;
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

  return generation.pollHint || 'Verto is building the deck. Check back shortly instead of starting a duplicate run.';
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
    ? `Error: ${generation.error}. Ask ChatGPT to retry with a simpler topic or fewer constraints.`
    : 'Ask ChatGPT to retry with a simpler topic or fewer constraints.';
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
    note.textContent = 'Ask ChatGPT to check status after a short pause.';
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

function stageForProgress(progress: number): DisplayStage {
  let current: DisplayStage = DISPLAY_STAGES[0];
  for (const stage of DISPLAY_STAGES) {
    if (progress >= stage.threshold) {
      current = stage;
    }
  }
  return current;
}

function stageState(stageIndex: number, currentIndex: number, generation: GenerationViewModel): string {
  if (generation.isFailed && stageIndex === currentIndex) return 'failed';
  if (generation.isComplete) return 'done';
  if (stageIndex < currentIndex) return 'done';
  if (stageIndex === currentIndex) return 'current';
  return 'pending';
}

function renderTimeline(generation: GenerationViewModel): void {
  const progress = clampProgress(generation.progress);
  const currentStage = generation.isComplete
    ? DISPLAY_STAGES[DISPLAY_STAGES.length - 1]
    : stageForProgress(progress);
  const currentIndex = DISPLAY_STAGES.findIndex((stage) => stage.id === currentStage.id);
  const grid = byId('stage-grid');

  byId('timeline-state').textContent = currentStage.name;
  grid.textContent = '';

  DISPLAY_STAGES.forEach((stage, index) => {
    const state = stageState(index, currentIndex, generation);
    const item = document.createElement('article');
    item.className = `stage ${state}`;

    const dot = document.createElement('span');
    dot.className = 'stage-dot';
    dot.setAttribute('aria-hidden', 'true');
    item.appendChild(dot);

    const title = document.createElement('div');
    title.className = 'stage-name';
    title.textContent = stage.name;
    item.appendChild(title);

    const copy = document.createElement('p');
    copy.className = 'stage-copy';
    copy.textContent = getStageCopy(stage.id, generation, state) || stage.copy;
    item.appendChild(copy);

    grid.appendChild(item);
  });
}

function getStageCopy(
  stageId: string,
  generation: GenerationViewModel,
  state: string
): string {
  if (generation.isFailed && state === 'failed') {
    return 'Needs retry';
  }

  if (generation.isComplete && stageId === 'complete') {
    return 'Ready to review';
  }

  if (state === 'current' && generation.currentStepName) {
    return generation.currentStepName;
  }

  return '';
}

function renderGenerationPayload(payload: Record<string, unknown>): void {
  ensureGenerationStyles();
  ensureMarkup();

  const generation = toGenerationViewModel(payload);

  byId('title').textContent = generation.topic;
  byId('summary').textContent = generation.isComplete
    ? 'Verto finished building your presentation.'
    : generation.isFailed
      ? 'Verto could not finish this presentation run.'
      : 'Verto is turning your prompt into a presentation.';

  renderStatusPills(generation);
  renderProgress(generation);
  renderError(generation);
  configureActions(generation);
  renderTimeline(generation);
}

mountWidget((payload) => {
  renderGenerationPayload(payload);
});
