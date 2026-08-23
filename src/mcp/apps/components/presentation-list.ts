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
import {
  extractWidgetLinks,
  extractThemeName,
  findTheme,
  renderDeepLinkMenu,
  resolveThemeTokens,
  setWidgetTheme,
} from './shared/verto-skin';

const listStyles = `
  .list-shell {
    display: grid;
    gap: 16px;
    min-height: 340px;
    padding: 24px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    letter-spacing: -0.01em;
  }
  .list-header {
    display: grid;
    gap: 6px;
    margin-bottom: 8px;
    padding-right: 48px;
  }
  .list-kicker {
    color: var(--accent);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.05em;
  }
  .list-title {
    margin: 0;
    max-width: 44rem;
    font-size: 26px;
    font-weight: 800;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }
  .list-summary {
    max-width: 48rem;
    margin: 4px 0 12px;
    color: var(--muted);
    font-size: 15px;
    overflow-wrap: anywhere;
  }
  .badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-height: 28px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    min-height: 26px;
    max-width: 100%;
    border: 1px solid color-mix(in srgb, var(--line) 40%, transparent);
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
  .list-stage {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(200px, 260px);
    gap: 20px;
    align-items: stretch;
  }
  .presentation-panel,
  .action-panel {
    position: relative;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
    border-radius: 16px;
    background: color-mix(in srgb, var(--surface) 75%, transparent);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
  }
  .presentation-panel::before,
  .action-panel::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background-image: var(--vt-brand-gradient);
  }
  .presentation-panel {
    display: grid;
    gap: 8px;
    padding: 16px;
  }
  .list-head {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) 64px 116px 92px 88px 236px;
    gap: 12px;
    padding: 4px 12px 12px;
    border-bottom: 1px solid color-mix(in srgb, var(--line) 40%, transparent);
    color: var(--muted);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }
  .presentation-row {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) 64px 116px 92px 88px 236px;
    gap: 12px;
    align-items: center;
    min-height: 64px;
    border: 1px solid transparent;
    border-radius: 12px;
    padding: 10px 12px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .presentation-row:hover {
    background: color-mix(in srgb, var(--surface) 95%, var(--accent-soft));
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.07);
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--accent) 22%, transparent);
  }
  .title-cell {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 0;
  }
  /* Mini slide mock painted in the row's deck theme (plan 10 polish). */
  .row-thumb {
    position: relative;
    flex: none;
    display: grid;
    align-content: center;
    gap: 4px;
    width: 62px;
    aspect-ratio: 16 / 9;
    border-radius: 8px;
    padding: 7px 9px;
    box-shadow:
      inset 0 0 0 1px rgba(127, 127, 127, 0.28),
      0 1px 3px rgba(0, 0, 0, 0.14);
  }
  .row-thumb .bar {
    height: 3px;
    border-radius: 99px;
  }
  .row-thumb .bar.b1 { width: 72%; height: 5px; }
  .row-thumb .bar.b2 { width: 90%; opacity: 0.58; }
  .row-thumb .bar.b3 { width: 54%; opacity: 0.32; }
  .row-thumb .chip {
    position: absolute;
    top: 5px;
    right: 6px;
    width: 11px;
    height: 3px;
    border-radius: 99px;
  }
  .presentation-title {
    min-width: 0;
    font-size: 14px;
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .presentation-meta,
  .presentation-date {
    min-width: 0;
    color: var(--muted);
    font-size: 13px;
    overflow-wrap: anywhere;
  }
  .status-pill {
    justify-self: start;
    min-width: 0;
    border: 1px solid color-mix(in srgb, var(--line) 50%, transparent);
    border-radius: 99px;
    padding: 4px 10px;
    color: var(--muted);
    font-size: 12px;
    font-weight: 650;
    background: color-mix(in srgb, var(--surface) 60%, transparent);
  }
  .status-pill.published {
    border-color: color-mix(in srgb, #15803d 45%, transparent);
    color: #15803d;
    background: color-mix(in srgb, #15803d 10%, transparent);
  }
  @media (prefers-color-scheme: dark) {
    .status-pill.published {
      border-color: color-mix(in srgb, #4ade80 45%, transparent);
      color: #4ade80;
    }
  }
  .status-pill.deleted {
    border-color: #fca5a5;
    color: #ef4444;
    background: color-mix(in srgb, #fef2f2 80%, transparent);
  }
  @media (prefers-color-scheme: dark) {
    .status-pill.deleted {
      border-color: #7f1d1d;
      color: #fca5a5;
      background: color-mix(in srgb, #450a0a 60%, transparent);
    }
  }
  .theme-cell {
    display: flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
  }
  .theme-cell .theme-name {
    overflow-wrap: anywhere;
  }
  .open-link {
    font-size: 13px;
    font-weight: 700;
    color: var(--accent);
    text-decoration: none;
    transition: opacity 0.2s;
  }
  .open-link:hover {
    opacity: 0.8;
  }
  .row-actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
  .row-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 30px;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 650;
    color: var(--fg);
    cursor: pointer;
    border: 1px solid color-mix(in srgb, var(--line) 55%, transparent);
    border-radius: 99px;
    background: color-mix(in srgb, var(--surface) 65%, transparent);
    transition: all 0.18s ease;
    white-space: nowrap;
  }
  .row-action-btn:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    color: var(--accent);
  }
  .row-action-btn.danger {
    color: #dc2626;
  }
  @media (prefers-color-scheme: dark) {
    .row-action-btn.danger {
      color: #fca5a5;
    }
  }
  .row-action-btn.danger:hover:not(:disabled) {
    border-color: color-mix(in srgb, #ef4444 45%, transparent);
    background: color-mix(in srgb, #ef4444 10%, transparent);
    color: #dc2626;
  }
  @media (prefers-color-scheme: dark) {
    .row-action-btn.danger:hover:not(:disabled) {
      color: #fca5a5;
    }
  }
  .row-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
    border-color: transparent;
    background-color: #dc2626;
    background-image: var(--vt-brand-gradient);
    color: #ffffff;
  }
  .button.primary:hover:not(:disabled) {
    opacity: 1;
    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.35);
  }
  .button:disabled,
  .button[aria-disabled="true"] {
    cursor: default;
    opacity: 0.5;
  }
  .button.is-busy {
    cursor: wait;
    opacity: 0.7;
  }
  .empty-state {
    border: 1px dashed color-mix(in srgb, var(--line) 60%, transparent);
    border-radius: 12px;
    padding: 24px;
    color: var(--muted);
    background: color-mix(in srgb, var(--surface) 40%, transparent);
    text-align: center;
    font-size: 14px;
  }
  @media (max-width: 780px) {
    .list-stage { grid-template-columns: 1fr; }
    .list-head { display: none; }
    .presentation-row {
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px 12px;
      align-items: start;
      border-color: color-mix(in srgb, var(--line) 30%, transparent);
      margin-bottom: 8px;
    }
    .presentation-title { grid-column: 1 / -1; }
    .title-cell {
      grid-column: 1 / -1;
      align-items: flex-start;
    }
    .presentation-meta,
    .presentation-date,
    .status-pill {
      justify-self: start;
    }
    .open-link {
      grid-column: 2;
      grid-row: 2 / span 2;
      align-self: center;
      background: color-mix(in srgb, var(--accent) 10%, transparent);
      padding: 6px 12px;
      border-radius: 99px;
    }
  }
  @media (max-width: 440px) {
    .list-shell { padding: 16px; }
    .presentation-row {
      grid-template-columns: 1fr;
    }
    .open-link {
      grid-column: 1;
      grid-row: auto;
      justify-self: start;
      margin-top: 8px;
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
      <div class="vt-links" id="list-links"></div>
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
            <span style="text-align: right">Actions</span>
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

  setWidgetTheme(extractThemeName(payload));
  renderDeepLinkMenu(byId('list-links'), extractWidgetLinks(payload));

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

function themeGradient(themeName: string): string {
  const theme = findTheme(themeName);
  return theme ? resolveThemeTokens(theme).accentGradient : 'var(--vt-brand-gradient)';
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
    theme.className = 'presentation-meta theme-cell';
    const swatch = document.createElement('span');
    swatch.className = 'vt-swatch';
    swatch.setAttribute('aria-hidden', 'true');
    swatch.style.background = themeGradient(presentation.themeName);
    theme.appendChild(swatch);
    const themeName = document.createElement('span');
    themeName.className = 'theme-name';
    themeName.textContent = presentation.themeName;
    theme.appendChild(themeName);
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

    const actions = document.createElement('div');
    actions.className = 'row-actions';

    if (presentation.isDeleted) {
      const recoverBtn = document.createElement('button');
      recoverBtn.className = 'row-action-btn';
      recoverBtn.textContent = 'Recover';
      recoverBtn.onclick = () => performRowAction(presentation, 'recover', recoverBtn);
      actions.appendChild(recoverBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'row-action-btn danger';
      deleteBtn.textContent = 'Delete forever';
      deleteBtn.onclick = () => performRowAction(presentation, 'delete-forever', deleteBtn);
      actions.appendChild(deleteBtn);
    } else {
      const previewBtn = document.createElement('button');
      previewBtn.className = 'row-action-btn';
      previewBtn.textContent = 'Preview';
      previewBtn.onclick = () => askChatGptToPreview(presentation, previewBtn, byId('action-note'));
      actions.appendChild(previewBtn);

      if (presentation.isPublished) {
        const unpubBtn = document.createElement('button');
        unpubBtn.className = 'row-action-btn';
        unpubBtn.textContent = 'Unpublish';
        unpubBtn.onclick = () => performRowAction(presentation, 'unpublish', unpubBtn);
        actions.appendChild(unpubBtn);
      } else {
        const pubBtn = document.createElement('button');
        pubBtn.className = 'row-action-btn';
        pubBtn.textContent = 'Publish';
        pubBtn.onclick = () => performRowAction(presentation, 'publish', pubBtn);
        actions.appendChild(pubBtn);
      }

      const delBtn = document.createElement('button');
      delBtn.className = 'row-action-btn danger';
      delBtn.textContent = 'Delete';
      delBtn.onclick = () => performRowAction(presentation, 'delete', delBtn);
      actions.appendChild(delBtn);
    }

    row.appendChild(actions);

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

async function performRowAction(
  presentation: PresentationListItemViewModel,
  action: 'publish' | 'unpublish' | 'delete' | 'recover' | 'delete-forever',
  button: HTMLButtonElement
): Promise<void> {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = '...';
  
  let toolName = '';
  if (action === 'publish') toolName = 'presentation_publish';
  if (action === 'unpublish') toolName = 'presentation_unpublish';
  if (action === 'delete') toolName = 'presentation_delete';
  if (action === 'recover') toolName = 'presentation_recover';
  if (action === 'delete-forever') toolName = 'presentation_delete_permanently';
  
  try {
    await callMcpTool(toolName, { presentation_id: presentation.id });
    const payload = await callMcpTool('presentation_list', {
      limit: 20,
      include_deleted: false,
      sort_by: 'updated_at',
      sort_order: 'desc',
    });
    renderListPayload(payload);
  } catch (error) {
    button.disabled = false;
    button.textContent = originalText || '';
    const msg = error && typeof error === 'object' && 'message' in error ? String((error as any).message) : 'Action failed';
    alert(msg);
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
