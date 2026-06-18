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

const listStyles = `
  .list-shell {
    display: grid;
    gap: 16px;
    min-height: 340px;
    padding: 16px;
    overflow: hidden;
  }
  .list-header {
    display: grid;
    gap: 8px;
  }
  .list-kicker {
    color: var(--accent);
    font-size: 12px;
    font-weight: 750;
  }
  .list-title {
    margin: 0;
    max-width: 44rem;
    font-size: 22px;
    line-height: 1.18;
    overflow-wrap: anywhere;
  }
  .list-summary {
    max-width: 48rem;
    margin: 0;
    color: var(--muted);
    overflow-wrap: anywhere;
  }
  .badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-height: 26px;
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
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .list-stage {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(184px, 236px);
    gap: 14px;
    align-items: stretch;
  }
  .presentation-panel,
  .action-panel {
    border: 1px solid var(--line);
    border-radius: 8px;
    background: color-mix(in srgb, var(--surface) 96%, var(--accent-soft));
  }
  .presentation-panel {
    display: grid;
    gap: 8px;
    padding: 12px;
  }
  .list-head {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) 72px 112px 100px 94px 54px;
    gap: 10px;
    padding: 0 8px 8px;
    border-bottom: 1px solid var(--line);
    color: var(--muted);
    font-size: 11px;
    font-weight: 750;
  }
  .presentation-row {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) 72px 112px 100px 94px 54px;
    gap: 10px;
    align-items: center;
    min-height: 56px;
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 8px;
  }
  .presentation-row:hover {
    border-color: color-mix(in srgb, var(--accent) 34%, var(--line));
    background: color-mix(in srgb, var(--surface) 88%, var(--accent-soft));
  }
  .presentation-title {
    min-width: 0;
    font-size: 13px;
    font-weight: 800;
    overflow-wrap: anywhere;
  }
  .presentation-meta,
  .presentation-date {
    min-width: 0;
    color: var(--muted);
    font-size: 12px;
    overflow-wrap: anywhere;
  }
  .status-pill {
    justify-self: start;
    min-width: 0;
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 3px 8px;
    color: var(--fg);
    font-size: 12px;
    font-weight: 750;
  }
  .status-pill.published {
    border-color: color-mix(in srgb, var(--accent) 42%, var(--line));
    color: var(--accent);
  }
  .status-pill.deleted {
    border-color: #7f1d1d;
    color: #fca5a5;
  }
  .open-link {
    justify-self: end;
    font-size: 12px;
    font-weight: 800;
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
  .empty-state {
    border: 1px dashed var(--line);
    border-radius: 8px;
    padding: 16px;
    color: var(--muted);
    background: color-mix(in srgb, var(--surface) 94%, var(--accent-soft));
  }
  @media (max-width: 780px) {
    .list-stage { grid-template-columns: 1fr; }
    .list-head { display: none; }
    .presentation-row {
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 7px 10px;
      align-items: start;
      border-color: var(--line);
    }
    .presentation-title { grid-column: 1 / -1; }
    .presentation-meta,
    .presentation-date,
    .status-pill {
      justify-self: start;
    }
    .open-link {
      grid-column: 2;
      grid-row: 2 / span 2;
      align-self: center;
    }
  }
  @media (max-width: 440px) {
    .list-shell { padding: 14px; }
    .presentation-row {
      grid-template-columns: 1fr;
    }
    .open-link {
      grid-column: 1;
      grid-row: auto;
      justify-self: start;
    }
  }
`;

let stylesInjected = false;

type PresentationListItemViewModel = {
  id: string;
  title: string;
  themeName: string;
  slideCount: number;
  updatedAt: string;
  isPublished: boolean;
  isDeleted: boolean;
  openUrl: string;
};

type PresentationListViewModel = {
  presentations: PresentationListItemViewModel[];
  totalCount: number;
  pageSize: number;
  hasMore: boolean;
  publishedCount: number;
  draftCount: number;
  deletedCount: number;
};

function ensureListStyles(): void {
  if (stylesInjected) return;
  injectStyles(listStyles);
  stylesInjected = true;
}

function ensureMarkup(): void {
  if (document.getElementById('verto-list-widget')) {
    return;
  }

  document.body.innerHTML = `
    <main class="list-shell" id="verto-list-widget">
      <section class="list-header" aria-labelledby="title">
        <div class="list-kicker">Verto AI workspace</div>
        <h1 class="list-title" id="title">Presentation workspace</h1>
        <p class="list-summary" id="summary">Waiting for your Verto presentations.</p>
        <div class="badge-row" id="badges" aria-label="Workspace summary"></div>
      </section>
      <section class="list-stage" aria-label="Presentation list">
        <article class="presentation-panel" aria-label="Recent presentations">
          <div class="list-head" aria-hidden="true">
            <span>Presentation</span>
            <span>Slides</span>
            <span>Theme</span>
            <span>Status</span>
            <span>Updated</span>
            <span>Action</span>
          </div>
          <div id="presentations"></div>
        </article>
        <aside class="action-panel" aria-label="List actions">
          <p class="action-title">Next action</p>
          <a class="button primary" id="open-latest-link">Open latest</a>
          <button class="button" id="preview-latest-action" type="button">Preview latest</button>
          <button class="button" id="refresh-list-action" type="button">Refresh list</button>
          <p class="action-note" id="action-note">Choose a presentation to preview or open in Verto.</p>
        </aside>
      </section>
    </main>
  `;
}

function toListViewModel(payload: Record<string, unknown>): PresentationListViewModel {
  const widget = getRecord(payload.widget);

  if (widget.widget === 'presentation_list') {
    const summary = getRecord(widget.summary);
    const pagination = getRecord(widget.pagination);
    const presentations = getArray(widget.presentations).map(mapPresentationItem);

    return {
      presentations,
      totalCount: getNumber(summary.totalCount, getNumber(pagination.totalCount, presentations.length)),
      pageSize: getNumber(pagination.pageSize, presentations.length),
      hasMore: Boolean(pagination.hasMore),
      publishedCount: getNumber(summary.publishedCount),
      draftCount: getNumber(summary.draftCount),
      deletedCount: getNumber(summary.deletedCount),
    };
  }

  const data = getArray(payload.data);
  const pagination = getRecord(payload.pagination);
  const presentations = data.map(mapPresentationItem);

  return {
    presentations,
    totalCount: getNumber(pagination.total_count, presentations.length),
    pageSize: getNumber(pagination.page_size, presentations.length),
    hasMore: Boolean(pagination.has_more),
    publishedCount: presentations.filter((item) => item.isPublished).length,
    draftCount: presentations.filter((item) => !item.isPublished && !item.isDeleted).length,
    deletedCount: presentations.filter((item) => item.isDeleted).length,
  };
}

function mapPresentationItem(value: unknown): PresentationListItemViewModel {
  const record = getRecord(value);

  return {
    id: getString(record.id),
    title: getString(record.title, 'Untitled presentation'),
    themeName: getString(record.themeName || record.theme_name, 'Default'),
    slideCount: getNumber(record.slideCount || record.slide_count),
    updatedAt: getString(record.updatedAt || record.updated_at),
    isPublished: Boolean(record.isPublished || record.is_published),
    isDeleted: Boolean(record.isDeleted || record.is_deleted),
    openUrl: getString(record.openUrl || record.open_url || record.url),
  };
}

function renderListPayload(payload: Record<string, unknown>): void {
  ensureListStyles();
  ensureMarkup();

  const list = toListViewModel(payload);

  byId('title').textContent = 'Presentation workspace';
  byId('summary').textContent = list.presentations.length > 0
    ? `Showing ${list.presentations.length} of ${list.totalCount} Verto presentations, sorted by latest updated.`
    : 'No presentations were returned for this workspace.';

  renderBadges(list);
  renderRows(list);
  configureActions(list);
}

function renderBadges(list: PresentationListViewModel): void {
  const badges = byId('badges');
  badges.textContent = '';
  badges.appendChild(createBadge(`${list.totalCount} total`));
  badges.appendChild(createBadge(`${list.publishedCount} published`));
  badges.appendChild(createBadge(`${list.draftCount} draft`));
  if (list.deletedCount > 0) {
    badges.appendChild(createBadge(`${list.deletedCount} deleted`));
  }
  if (list.hasMore) {
    badges.appendChild(createBadge(`More than ${list.pageSize} available`));
  }
}

function createBadge(text: string): HTMLElement {
  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = text;
  return badge;
}

function renderRows(list: PresentationListViewModel): void {
  const container = byId('presentations');
  container.textContent = '';

  if (list.presentations.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Your Verto workspace is connected. Generate a deck to see it here.';
    container.appendChild(empty);
    return;
  }

  list.presentations.slice(0, 8).forEach((presentation) => {
    const row = document.createElement('article');
    row.className = 'presentation-row';

    const title = document.createElement('div');
    title.className = 'presentation-title';
    title.textContent = presentation.title;
    row.appendChild(title);

    const slides = document.createElement('div');
    slides.className = 'presentation-meta';
    slides.textContent = `${presentation.slideCount} slide${presentation.slideCount === 1 ? '' : 's'}`;
    row.appendChild(slides);

    const theme = document.createElement('div');
    theme.className = 'presentation-meta';
    theme.textContent = presentation.themeName;
    row.appendChild(theme);

    const status = document.createElement('span');
    status.className = `status-pill ${presentation.isDeleted ? 'deleted' : presentation.isPublished ? 'published' : ''}`;
    status.textContent = presentation.isDeleted
      ? 'Deleted'
      : presentation.isPublished
        ? 'Published'
        : 'Draft';
    row.appendChild(status);

    const updated = document.createElement('div');
    updated.className = 'presentation-date';
    updated.textContent = formatUpdatedAt(presentation.updatedAt);
    row.appendChild(updated);

    const link = document.createElement('a');
    link.className = 'open-link';
    link.textContent = 'Open';
    if (presentation.openUrl) {
      link.href = presentation.openUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `Open presentation: ${presentation.title}`);
    } else {
      link.setAttribute('aria-disabled', 'true');
    }
    row.appendChild(link);

    container.appendChild(row);
  });
}

function configureActions(list: PresentationListViewModel): void {
  const latest = list.presentations[0];
  const openLink = byId('open-latest-link');
  const previewButton = byId('preview-latest-action');
  const refreshButton = byId('refresh-list-action');
  const note = byId('action-note');

  if (openLink instanceof HTMLAnchorElement) {
    openLink.textContent = 'Open latest';
    if (latest?.openUrl) {
      openLink.href = latest.openUrl;
      openLink.target = '_blank';
      openLink.rel = 'noopener noreferrer';
      openLink.setAttribute('aria-label', `Open latest presentation: ${latest.title}`);
      openLink.setAttribute('aria-disabled', 'false');
    } else {
      openLink.removeAttribute('href');
      openLink.removeAttribute('aria-label');
      openLink.setAttribute('aria-disabled', 'true');
    }
  }

  if (previewButton instanceof HTMLButtonElement) {
    previewButton.disabled = !latest?.id;
    previewButton.setAttribute('aria-disabled', latest?.id ? 'false' : 'true');
    previewButton.onclick = latest?.id
      ? () => askChatGptToPreview(latest, previewButton, note)
      : null;
  }

  if (refreshButton instanceof HTMLButtonElement) {
    refreshButton.disabled = false;
    refreshButton.setAttribute('aria-disabled', 'false');
    refreshButton.onclick = () => refreshList(list, refreshButton, note);
  }

  note.textContent = latest?.id
    ? 'Preview the latest deck or open it in Verto.'
    : 'Generate a Verto deck to populate this workspace.';
}

async function askChatGptToPreview(
  presentation: PresentationListItemViewModel,
  button: HTMLButtonElement,
  note: HTMLElement
): Promise<void> {
  await runButtonAction(button, note, 'Asking ChatGPT...', async () => {
    await sendFollowUpMessage(
      `Show me a visual preview of Verto presentation ${presentation.id}.`
    );
    note.textContent = 'Asked ChatGPT to preview the latest deck.';
  });
}

async function refreshList(
  list: PresentationListViewModel,
  button: HTMLButtonElement,
  note: HTMLElement
): Promise<void> {
  await runButtonAction(button, note, 'Refreshing...', async () => {
    const payload = await callMcpTool('presentation_list', {
      limit: list.pageSize || 20,
      include_deleted: false,
      sort_by: 'updated_at',
      sort_order: 'desc',
    });
    renderListPayload(payload);
    byId('action-note').textContent = 'Workspace list refreshed.';
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

function formatUpdatedAt(value: string): string {
  if (!value) return 'Updated time unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Updated time unavailable';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

mountWidget((payload) => {
  renderListPayload(payload);
});
