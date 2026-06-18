import {
  byId,
  getArray,
  getNumber,
  getRecord,
  getString,
  injectStyles,
  mountWidget,
  sendFollowUpMessage,
} from './shared/runtime';

const actionResultStyles = `
  .result-shell {
    display: grid;
    gap: 16px;
    min-height: 300px;
    padding: 16px;
    overflow: hidden;
  }
  .result-header {
    display: grid;
    gap: 8px;
  }
  .result-kicker {
    color: var(--accent);
    font-size: 12px;
    font-weight: 750;
  }
  .result-title {
    margin: 0;
    max-width: 44rem;
    font-size: 22px;
    line-height: 1.18;
    overflow-wrap: anywhere;
  }
  .result-message {
    max-width: 48rem;
    margin: 0;
    color: var(--muted);
    overflow-wrap: anywhere;
  }
  .badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    max-width: 100%;
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 3px 8px;
    background: color-mix(in srgb, var(--surface) 90%, var(--accent-soft));
    color: var(--fg);
    font-size: 12px;
    font-weight: 750;
    overflow-wrap: anywhere;
  }
  .badge.success {
    border-color: color-mix(in srgb, var(--accent) 42%, var(--line));
    color: var(--accent);
  }
  .badge.warning {
    border-color: #b45309;
    background: #fff7ed;
    color: #92400e;
  }
  .result-stage {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(184px, 236px);
    gap: 14px;
  }
  .summary-panel,
  .action-panel,
  .affected-panel {
    border: 1px solid var(--line);
    border-radius: 8px;
    background: color-mix(in srgb, var(--surface) 96%, var(--accent-soft));
  }
  .summary-panel {
    display: grid;
    gap: 12px;
    padding: 14px;
  }
  .summary-title {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
    overflow-wrap: anywhere;
  }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }
  .metric {
    display: grid;
    gap: 4px;
    min-height: 68px;
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 9px;
  }
  .metric-label {
    color: var(--muted);
    font-size: 11px;
    font-weight: 750;
  }
  .metric-value {
    font-size: 13px;
    font-weight: 800;
    overflow-wrap: anywhere;
  }
  .affected-panel {
    display: grid;
    gap: 8px;
    padding: 12px;
  }
  .affected-panel[hidden] {
    display: none;
  }
  .affected-title {
    margin: 0;
    font-size: 13px;
    font-weight: 800;
  }
  .affected-list {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .affected-item {
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 8px;
    color: var(--muted);
    font-size: 12px;
    overflow-wrap: anywhere;
  }
  .action-panel {
    display: grid;
    align-content: start;
    gap: 10px;
    padding: 12px;
  }
  .action-title {
    margin: 0;
    font-size: 13px;
    font-weight: 800;
  }
  .action-note {
    min-height: 40px;
    margin: 0;
    color: var(--muted);
    font-size: 12px;
  }
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 38px;
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 8px 10px;
    background: var(--surface);
    color: var(--fg);
    font: inherit;
    font-size: 13px;
    font-weight: 750;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
  }
  .button.primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--bg);
  }
  .button:disabled,
  .button[aria-disabled="true"] {
    cursor: default;
    opacity: 0.55;
  }
  .button.is-busy {
    cursor: wait;
  }
  @media (max-width: 720px) {
    .result-stage { grid-template-columns: 1fr; }
    .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (prefers-color-scheme: dark) {
    .badge.warning {
      border-color: #f59e0b;
      background: #271303;
      color: #fbbf24;
    }
  }
  @media (max-width: 440px) {
    .result-shell { padding: 14px; }
    .summary-grid { grid-template-columns: 1fr; }
  }
`;

let stylesInjected = false;

type ActionResultViewModel = {
  kind: string;
  title: string;
  message: string;
  status: string;
  completedAt: string;
  presentation: {
    id: string;
    title: string;
    themeName: string;
    slideCount: number;
    updatedAt: string;
    isPublished: boolean;
    isDeleted: boolean;
    shareUrl: string;
    openUrl: string;
  } | null;
  affectedPresentations: Array<{ id: string; title: string }>;
};

function ensureResultStyles(): void {
  if (stylesInjected) return;
  injectStyles(actionResultStyles);
  stylesInjected = true;
}

function ensureMarkup(): void {
  if (document.getElementById('verto-action-result-widget')) {
    return;
  }

  document.body.innerHTML = `
    <main class="result-shell" id="verto-action-result-widget">
      <section class="result-header" aria-labelledby="title">
        <div class="result-kicker">Verto AI result</div>
        <h1 class="result-title" id="title">Action complete</h1>
        <p class="result-message" id="message">Verto finished the requested action.</p>
        <div class="badge-row" id="badges" aria-label="Action summary"></div>
      </section>
      <section class="result-stage" aria-label="Action result details">
        <article class="summary-panel" aria-label="Presentation summary">
          <h2 class="summary-title" id="summary-title">Presentation summary</h2>
          <div class="summary-grid" id="summary-grid"></div>
          <div class="affected-panel" id="affected-panel" aria-label="Affected presentations">
            <p class="affected-title">Affected presentations</p>
            <ul class="affected-list" id="affected-list"></ul>
          </div>
        </article>
        <aside class="action-panel" aria-label="Result actions">
          <p class="action-title">Next action</p>
          <a class="button primary" id="open-link">Open in Verto</a>
          <button class="button" id="preview-action" type="button">Preview with ChatGPT</button>
          <button class="button" id="copy-action" type="button">Copy share link</button>
          <p class="action-note" id="action-note">Choose what to do next.</p>
        </aside>
      </section>
    </main>
  `;
}

function toActionResultViewModel(payload: Record<string, unknown>): ActionResultViewModel {
  const widget = getRecord(payload.widget);

  if (widget.widget === 'action_result') {
    const operation = getRecord(widget.operation);
    const presentation = readPresentation(getRecord(widget.presentation));

    return {
      kind: getString(operation.kind, 'action'),
      title: getString(operation.title, 'Action complete'),
      message: getString(operation.message, 'Verto finished the requested action.'),
      status: getString(operation.status, 'success'),
      completedAt: getString(operation.completedAt),
      presentation,
      affectedPresentations: readAffectedPresentations(getArray(widget.affectedPresentations)),
    };
  }

  const data = getRecord(payload.data || payload);
  const presentation = readPresentation(data);

  return {
    kind: 'action',
    title: getString(data.message, 'Action complete'),
    message: getString(data.message, 'Verto finished the requested action.'),
    status: 'success',
    completedAt: '',
    presentation,
    affectedPresentations: readAffectedFromFallback(data),
  };
}

function readPresentation(record: Record<string, unknown>): ActionResultViewModel['presentation'] {
  const id = getString(record.id);
  const title = getString(record.title);

  if (!id && !title) {
    return null;
  }

  return {
    id,
    title: title || 'Untitled presentation',
    themeName: getString(record.themeName || record.theme_name, 'Default'),
    slideCount: getNumber(record.slideCount || record.slide_count),
    updatedAt: getString(record.updatedAt || record.updated_at),
    isPublished: Boolean(record.isPublished || record.is_published),
    isDeleted: Boolean(record.isDeleted || record.is_deleted || record.deleted),
    shareUrl: getString(record.shareUrl || record.share_url),
    openUrl: getString(record.openUrl || record.open_url || record.url),
  };
}

function readAffectedPresentations(items: unknown[]): Array<{ id: string; title: string }> {
  return items.map((item, index) => {
    const record = getRecord(item);
    return {
      id: getString(record.id, `item-${index + 1}`),
      title: getString(record.title, `Presentation ${index + 1}`),
    };
  });
}

function readAffectedFromFallback(data: Record<string, unknown>): Array<{ id: string; title: string }> {
  const ids = getArray(data.deleted_ids);
  const titles = getArray(data.deleted_titles);

  return ids.map((id, index) => ({
    id: getString(id, `item-${index + 1}`),
    title: getString(titles[index], `Presentation ${index + 1}`),
  }));
}

function renderActionResultPayload(payload: Record<string, unknown>): void {
  ensureResultStyles();
  ensureMarkup();

  const result = toActionResultViewModel(payload);

  byId('title').textContent = result.title;
  byId('message').textContent = result.message;

  renderBadges(result);
  renderSummary(result);
  renderAffected(result);
  configureActions(result);
}

function renderBadges(result: ActionResultViewModel): void {
  const badges = byId('badges');
  badges.textContent = '';
  badges.appendChild(createBadge(result.status === 'warning' ? 'Needs attention' : 'Complete', result.status));
  badges.appendChild(createBadge(formatKind(result.kind)));
  if (result.presentation?.isPublished) badges.appendChild(createBadge('Published'));
  if (result.presentation?.isDeleted) badges.appendChild(createBadge('Deleted', 'warning'));
  if (result.completedAt) badges.appendChild(createBadge(formatUpdatedAt(result.completedAt)));
}

function createBadge(text: string, className = ''): HTMLElement {
  const badge = document.createElement('span');
  badge.className = `badge${className ? ` ${className}` : ''}`;
  badge.textContent = text;
  return badge;
}

function renderSummary(result: ActionResultViewModel): void {
  const grid = byId('summary-grid');
  const title = byId('summary-title');
  grid.textContent = '';

  if (!result.presentation) {
    title.textContent = 'Operation summary';
    grid.appendChild(createMetric('Affected', String(result.affectedPresentations.length || 1)));
    grid.appendChild(createMetric('Status', result.status === 'warning' ? 'Needs attention' : 'Complete'));
    grid.appendChild(createMetric('Operation', formatKind(result.kind)));
    return;
  }

  const presentation = result.presentation;
  title.textContent = presentation.title;
  grid.appendChild(createMetric('Slides', `${presentation.slideCount}`));
  grid.appendChild(createMetric('Theme', presentation.themeName));
  grid.appendChild(createMetric('Status', presentation.isDeleted ? 'Deleted' : presentation.isPublished ? 'Published' : 'Draft'));
  grid.appendChild(createMetric('Updated', formatUpdatedAt(presentation.updatedAt)));
}

function createMetric(label: string, value: string): HTMLElement {
  const metric = document.createElement('div');
  metric.className = 'metric';

  const labelElement = document.createElement('span');
  labelElement.className = 'metric-label';
  labelElement.textContent = label;
  metric.appendChild(labelElement);

  const valueElement = document.createElement('span');
  valueElement.className = 'metric-value';
  valueElement.textContent = value || 'Not available';
  metric.appendChild(valueElement);

  return metric;
}

function renderAffected(result: ActionResultViewModel): void {
  const panel = byId('affected-panel');
  const list = byId('affected-list');
  list.textContent = '';

  if (result.affectedPresentations.length === 0) {
    panel.setAttribute('hidden', 'true');
    return;
  }

  panel.removeAttribute('hidden');
  result.affectedPresentations.slice(0, 8).forEach((presentation) => {
    const item = document.createElement('li');
    item.className = 'affected-item';
    item.textContent = `${presentation.title} (${presentation.id})`;
    list.appendChild(item);
  });
}

function configureActions(result: ActionResultViewModel): void {
  const openLink = byId('open-link');
  const previewButton = byId('preview-action');
  const copyButton = byId('copy-action');
  const note = byId('action-note');
  const presentation = result.presentation;

  if (openLink instanceof HTMLAnchorElement) {
    if (presentation?.openUrl && !presentation.isDeleted) {
      openLink.href = presentation.openUrl;
      openLink.target = '_blank';
      openLink.rel = 'noopener noreferrer';
      openLink.textContent = 'Open in Verto';
      openLink.classList.add('primary');
      openLink.setAttribute('aria-label', `Open presentation: ${presentation.title}`);
      openLink.setAttribute('aria-disabled', 'false');
    } else {
      openLink.removeAttribute('href');
      openLink.removeAttribute('aria-label');
      openLink.textContent = 'Open unavailable';
      openLink.classList.remove('primary');
      openLink.setAttribute('aria-disabled', 'true');
    }
  }

  if (previewButton instanceof HTMLButtonElement) {
    previewButton.disabled = !presentation?.id || Boolean(presentation?.isDeleted);
    previewButton.setAttribute('aria-disabled', presentation?.id && !presentation.isDeleted ? 'false' : 'true');
    previewButton.onclick = presentation?.id && !presentation.isDeleted
      ? () => previewPresentation(presentation, previewButton, note)
      : null;
  }

  if (copyButton instanceof HTMLButtonElement) {
    copyButton.disabled = !presentation?.shareUrl;
    copyButton.setAttribute('aria-disabled', presentation?.shareUrl ? 'false' : 'true');
    copyButton.onclick = presentation?.shareUrl
      ? () => copyShareLink(presentation.shareUrl, copyButton, note)
      : null;
  }

  note.textContent = presentation?.isDeleted
    ? 'This deck is deleted. Recover it before opening or previewing.'
    : presentation?.id
      ? 'Open the deck, preview it with ChatGPT, or copy the share link when available.'
      : 'The operation finished. Review the affected presentation list above.';
}

async function previewPresentation(
  presentation: NonNullable<ActionResultViewModel['presentation']>,
  button: HTMLButtonElement,
  note: HTMLElement
): Promise<void> {
  await runButtonAction(button, note, 'Asking ChatGPT...', async () => {
    await sendFollowUpMessage(
      `Show me a visual preview of Verto presentation ${presentation.id}.`
    );
    note.textContent = 'Asked ChatGPT to preview this deck.';
  });
}

async function copyShareLink(
  shareUrl: string,
  button: HTMLButtonElement,
  note: HTMLElement
): Promise<void> {
  await runButtonAction(button, note, 'Copying...', async () => {
    await navigator.clipboard?.writeText(shareUrl);
    note.textContent = 'Share link copied.';
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

function formatKind(kind: string): string {
  return kind
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatUpdatedAt(value: string): string {
  if (!value) return 'Time unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Time unavailable';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

mountWidget((payload) => {
  renderActionResultPayload(payload);
});
