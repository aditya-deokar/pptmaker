/**
 * Theme Studio widget (plan 10 F4).
 *
 * Visual theme browser bound to the `presentation_update_theme` and
 * `presentation_render_theme_studio` results: search + Light/Dark filter over
 * the 65-theme catalog, mini slide mocks painted with each theme's own
 * colors, then a confirm-to-apply flow through `callMcpTool`. Applying pushes
 * the outcome back to the model via `updateModelContext` (plan F8) so the
 * next reply knows the deck's new look.
 */

import {
  byId,
  callMcpTool,
  getArray,
  getRecord,
  getString,
  injectStyles,
  mountWidget,
  pushModelContext,
} from './shared/runtime';
import {
  ensureReadable,
  extractWidgetLinks,
  renderDeepLinkMenu,
  setWidgetTheme,
} from './shared/verto-skin';

const INITIAL_VISIBLE_THEMES = 24;

const studioStyles = `
  .ts-shell {
    display: grid;
    gap: 16px;
    min-height: 320px;
    padding: 24px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    letter-spacing: -0.01em;
  }
  .ts-header {
    display: grid;
    gap: 6px;
    padding-right: 48px;
  }
  .ts-kicker {
    color: var(--accent);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.05em;
  }
  .ts-title {
    margin: 0;
    max-width: 44rem;
    font-size: 26px;
    font-weight: 800;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }
  .ts-summary {
    max-width: 48rem;
    margin: 2px 0 0;
    color: var(--muted);
    font-size: 15px;
    overflow-wrap: anywhere;
  }
  .ts-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .ts-search {
    flex: 1 1 200px;
    min-width: 160px;
    min-height: 40px;
    border: 1px solid color-mix(in srgb, var(--line) 70%, transparent);
    border-radius: 99px;
    padding: 8px 14px;
    background: var(--surface);
    color: var(--fg);
    font: inherit;
    font-size: 14px;
  }
  .ts-search::placeholder { color: var(--muted); }
  .ts-tabs {
    display: inline-flex;
    gap: 4px;
    border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
    border-radius: 99px;
    padding: 3px;
    background: color-mix(in srgb, var(--surface) 70%, transparent);
  }
  .ts-tab {
    border: 1px solid transparent;
    border-radius: 99px;
    padding: 6px 14px;
    background: transparent;
    color: var(--muted);
    font: inherit;
    font-size: 13px;
    font-weight: 650;
    cursor: pointer;
  }
  .ts-tab[aria-pressed="true"] {
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    color: var(--accent);
  }
  .ts-count {
    margin-left: auto;
    color: var(--muted);
    font-size: 13px;
    font-weight: 650;
    white-space: nowrap;
  }
  .ts-confirm {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
    border-radius: 14px;
    padding: 12px 14px;
    background: color-mix(in srgb, var(--accent) 8%, transparent);
  }
  .ts-confirm[hidden] { display: none; }
  .ts-confirm-text {
    flex: 1 1 220px;
    min-width: 0;
    color: var(--fg);
    font-size: 14px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .ts-confirm.is-success {
    border-color: color-mix(in srgb, #16a34a 45%, transparent);
    background: color-mix(in srgb, #16a34a 10%, transparent);
  }
  .ts-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    border: 1px solid color-mix(in srgb, var(--line) 50%, transparent);
    border-radius: 99px;
    padding: 7px 16px;
    background: var(--surface);
    color: var(--fg);
    font: inherit;
    font-size: 13px;
    font-weight: 650;
    cursor: pointer;
    white-space: nowrap;
  }
  .ts-button.primary {
    border-color: transparent;
    background-color: #dc2626;
    background-image: var(--vt-brand-gradient);
    color: #ffffff;
  }
  .ts-button.ghost {
    border-color: transparent;
    background: transparent;
    color: var(--muted);
  }
  .ts-button:hover:not(:disabled) { filter: brightness(1.04); }
  .ts-button:disabled {
    cursor: default;
    opacity: 0.55;
  }
  .ts-button.is-busy { cursor: wait; opacity: 0.7; }
  .ts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
    gap: 12px;
  }
  .ts-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 9px;
    border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
    border-radius: 14px;
    padding: 10px;
    background: color-mix(in srgb, var(--surface) 80%, transparent);
    color: var(--fg);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  }
  .ts-card:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  }
  .ts-card[aria-pressed="true"] {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 35%, transparent);
  }
  .ts-card.is-current {
    border-color: color-mix(in srgb, var(--accent) 55%, transparent);
  }
  .ts-card:disabled { cursor: default; opacity: 0.6; }
  .ts-mock {
    position: relative;
    display: grid;
    align-content: start;
    gap: 6px;
    aspect-ratio: 16 / 9;
    border-radius: 9px;
    padding: 12% 12%;
    box-shadow: inset 0 0 0 1px rgba(127, 127, 127, 0.28), 0 1px 2px rgba(0, 0, 0, 0.06);
  }
  .ts-mock-accent {
    position: absolute;
    top: 9%;
    right: 9%;
    width: 14%;
    height: 9%;
    border-radius: 99px;
  }
  .ts-mock-bar {
    height: 9%;
    border-radius: 99px;
  }
  .ts-mock-bar.title { height: 14%; width: 72%; }
  .ts-mock-bar.second { width: 90%; opacity: 0.62; }
  .ts-mock-bar.third { width: 58%; opacity: 0.38; }
  .ts-card-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }
  .ts-card-name {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 13px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ts-card-type {
    flex: none;
    color: var(--muted);
    font-size: 11px;
    font-weight: 650;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .ts-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-height: 20px;
  }
  .ts-badge {
    display: inline-flex;
    align-items: center;
    min-height: 20px;
    border-radius: 99px;
    padding: 2px 8px;
    background: var(--accent-soft);
    color: var(--fg);
    font-size: 11px;
    font-weight: 700;
  }
  .ts-badge.new {
    border: 1px solid color-mix(in srgb, #f97316 50%, transparent);
    background: color-mix(in srgb, #f97316 16%, transparent);
    color: #9a3412;
  }
  @media (prefers-color-scheme: dark) {
    .ts-badge.new { color: #fdba74; }
  }
  .ts-empty {
    grid-column: 1 / -1;
    border: 1px dashed color-mix(in srgb, var(--line) 60%, transparent);
    border-radius: 12px;
    padding: 24px;
    color: var(--muted);
    font-size: 14px;
    text-align: center;
  }
  .ts-more-row { display: flex; justify-content: center; }
  .ts-more-row .ts-button { min-width: 220px; }
  .ts-note {
    min-height: 20px;
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    overflow-wrap: anywhere;
  }
  @media (max-width: 480px) {
    .ts-shell { padding: 16px; }
    .ts-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
    .ts-count { margin-left: 0; width: 100%; }
  }
`;

let stylesInjected = false;

interface ThemeStudioTheme {
  name: string;
  background: string;
  accent: string;
  fontColor: string;
  scheme: 'light' | 'dark';
  isNew: boolean;
}

type ThemeFilter = 'all' | 'light' | 'dark';

type StudioState = {
  presentationId: string;
  presentationTitle: string;
  currentThemeName: string;
  canApplyTheme: boolean;
  themes: ThemeStudioTheme[];
  filter: ThemeFilter;
  query: string;
  selectedTheme: string | null;
  visibleLimit: number;
};

function ensureStudioStyles(): void {
  if (stylesInjected) return;
  injectStyles(studioStyles);
  stylesInjected = true;
}

function ensureMarkup(): void {
  if (document.getElementById('verto-theme-studio-widget')) {
    return;
  }

  document.body.innerHTML = `
    <main class="ts-shell" id="verto-theme-studio-widget">
      <div class="vt-links" id="studio-links"></div>
      <header class="ts-header" aria-labelledby="studio-title">
        <div class="ts-kicker">Verto AI theme studio</div>
        <h1 class="ts-title" id="studio-title">Theme studio</h1>
        <p class="ts-summary" id="studio-summary">Loading the Verto theme catalog.</p>
      </header>
      <section class="toolbar ts-toolbar" aria-label="Theme filters">
        <input class="ts-search" id="studio-search" type="search" placeholder="Search themes" aria-label="Search themes" />
        <div class="ts-tabs" role="group" aria-label="Filter themes by scheme">
          <button class="ts-tab" id="tab-all" type="button" aria-pressed="true">All</button>
          <button class="ts-tab" id="tab-light" type="button" aria-pressed="false">Light</button>
          <button class="ts-tab" id="tab-dark" type="button" aria-pressed="false">Dark</button>
        </div>
        <span class="ts-count" id="studio-count" aria-live="polite"></span>
      </section>
      <aside class="ts-confirm" id="confirm-strip" hidden aria-label="Apply theme confirmation">
        <span class="ts-confirm-text" id="confirm-text"></span>
        <button class="ts-button primary" id="confirm-apply" type="button">Apply theme</button>
        <button class="ts-button ghost" id="confirm-cancel" type="button">Cancel</button>
      </aside>
      <section aria-label="Theme gallery">
        <div class="ts-grid" id="theme-grid"></div>
      </section>
      <div class="ts-more-row">
        <button class="ts-button" id="show-more" type="button" hidden>Show more themes</button>
      </div>
      <p class="ts-note" id="studio-note" aria-live="polite">Pick a theme to preview it on your deck.</p>
    </main>
  `;
}

function toStudioState(payload: Record<string, unknown>): StudioState {
  const widget = getRecord(payload.widget);

  if (widget.widget === 'theme_studio') {
    const presentation = getRecord(widget.presentation);
    const actions = getRecord(widget.actions);

    return {
      presentationId: getString(presentation.id),
      presentationTitle: getString(presentation.title, 'your deck'),
      currentThemeName: getString(
        presentation.currentThemeName || presentation.current_theme_name
      ),
      canApplyTheme: actions.canApplyTheme !== false,
      themes: readThemes(getArray(widget.themes)),
      filter: 'all',
      query: '',
      selectedTheme: null,
      visibleLimit: INITIAL_VISIBLE_THEMES,
    };
  }

  const data = getRecord(payload.data || payload);
  const presentation = getRecord(data.presentation || data);

  return {
    presentationId: getString(presentation.id),
    presentationTitle: getString(presentation.title || data.title, 'your deck'),
    currentThemeName: getString(
      presentation.themeName || presentation.theme_name || data.theme_name
    ),
    canApplyTheme: true,
    themes: [],
    filter: 'all',
    query: '',
    selectedTheme: null,
    visibleLimit: INITIAL_VISIBLE_THEMES,
  };
}

function readThemes(items: unknown[]): ThemeStudioTheme[] {
  const themes: ThemeStudioTheme[] = [];

  for (const item of items) {
    const record = getRecord(item);
    const name = getString(record.name);

    if (!name) continue;

    const colors = getArray(record.colors);
    const background = getString(colors[0], '#f5f5f5');

    themes.push({
      name,
      background,
      accent: getString(colors[1], '#6366f1'),
      fontColor: getString(colors[2], '#111111'),
      scheme: readScheme(getString(record.description), background),
      isNew: Boolean(record.isNew),
    });
  }

  return themes;
}

function readScheme(description: string, background: string): 'light' | 'dark' {
  const normalized = description.toLowerCase();

  if (normalized.includes('dark')) return 'dark';
  if (normalized.includes('light')) return 'light';

  return classifyScheme(background);
}

/**
 * Averages luminance across every color token found in the background CSS
 * (solid, rgba, or gradient stops) so gradient-only dark themes classify
 * correctly.
 */
function classifyScheme(background: string): 'light' | 'dark' {
  const tokens = background.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)/g) ?? [];

  let total = 0;
  let count = 0;

  for (const token of tokens) {
    const channels = token.startsWith('#')
      ? hexChannels(token)
      : rgbChannels(token);

    if (!channels) continue;

    total += (0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]) / 255;
    count += 1;
  }

  return count === 0 || total / count >= 0.45 ? 'light' : 'dark';
}

function hexChannels(token: string): [number, number, number] | null {
  const hex = token.slice(1);
  const expand = (chunk: string) => parseInt(chunk, 16);

  if (hex.length === 3 || hex.length === 4) {
    return [
      expand(hex[0] + hex[0]),
      expand(hex[1] + hex[1]),
      expand(hex[2] + hex[2]),
    ];
  }

  if (hex.length >= 6) {
    return [
      expand(hex.slice(0, 2)),
      expand(hex.slice(2, 4)),
      expand(hex.slice(4, 6)),
    ];
  }

  return null;
}

function rgbChannels(token: string): [number, number, number] | null {
  const match = token.match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;

  const parts = match[1].split(/\s*,\s*|\s+/).filter(Boolean).map(Number.parseFloat);

  if (parts.length < 3 || !parts.slice(0, 3).every(Number.isFinite)) {
    return null;
  }

  return [parts[0], parts[1], parts[2]];
}

let state: StudioState | null = null;

function filteredThemes(): ThemeStudioTheme[] {
  if (!state) return [];

  const query = state.query.trim().toLowerCase();

  return state.themes.filter((theme) => {
    if (state!.filter !== 'all' && theme.scheme !== state!.filter) {
      return false;
    }

    return !query || theme.name.toLowerCase().includes(query);
  });
}

function isCurrentTheme(themeName: string): boolean {
  return Boolean(
    state?.currentThemeName
    && state.currentThemeName.toLowerCase() === themeName.toLowerCase()
  );
}

function renderSummary(): void {
  if (!state) return;

  byId('studio-title').textContent = state.presentationTitle;

  const summary = byId('studio-summary');
  summary.textContent = state.themes.length > 0
    ? `${state.themes.length} catalog themes. Current look: ${state.currentThemeName || 'Default'}.`
    : 'Theme catalog unavailable. Ask ChatGPT to apply a theme instead.';

  const tabs = [
    ['all', byId('tab-all')],
    ['light', byId('tab-light')],
    ['dark', byId('tab-dark')],
  ] as const;

  for (const [filter, tab] of tabs) {
    tab.setAttribute('aria-pressed', String(state.filter === filter));
  }
}

function renderGrid(): void {
  if (!state) return;

  const grid = byId('theme-grid');
  const showMore = byId('show-more') as HTMLButtonElement;
  const matches = filteredThemes();
  const visible = matches.slice(0, state.visibleLimit);

  grid.textContent = '';
  byId('studio-count').textContent =
    `${visible.length} of ${matches.length} shown`;

  if (matches.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'ts-empty';
    empty.textContent = state.themes.length === 0
      ? 'The theme catalog did not load with this result. Try refreshing the studio.'
      : `No themes match "${state.query || state.filter}". Clear the search or switch filters.`;
    grid.appendChild(empty);
  }

  for (const theme of visible) {
    grid.appendChild(renderThemeCard(theme));
  }

  const remaining = matches.length - visible.length;
  showMore.hidden = remaining <= 0;
  showMore.textContent = `Show more themes (${remaining} more)`;
}

function renderThemeCard(theme: ThemeStudioTheme): HTMLButtonElement {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'ts-card';
  card.dataset.themeName = theme.name;

  const current = isCurrentTheme(theme.name);
  const selected = state?.selectedTheme === theme.name;

  if (current) card.classList.add('is-current');
  card.setAttribute('aria-pressed', String(selected));
  card.disabled = !state?.canApplyTheme;
  card.setAttribute(
    'aria-label',
    `${current ? 'Current theme' : 'Apply theme'}: ${theme.name}`
  );
  card.onclick = () => selectTheme(theme.name);

  const mock = document.createElement('span');
  mock.className = 'ts-mock';
  mock.setAttribute('aria-hidden', 'true');

  const barColor = ensureReadable(theme.fontColor, theme.background, 4.5);
  mock.style.background = theme.background;

  const accentChip = document.createElement('span');
  accentChip.className = 'ts-mock-accent';
  accentChip.style.background = ensureReadable(theme.accent, theme.background, 1.6);
  mock.appendChild(accentChip);

  for (const variant of ['title', 'second', 'third'] as const) {
    const bar = document.createElement('span');
    bar.className = `ts-mock-bar ${variant}`;
    bar.style.background = barColor;
    mock.appendChild(bar);
  }

  card.appendChild(mock);

  const meta = document.createElement('span');
  meta.className = 'ts-card-meta';

  const name = document.createElement('span');
  name.className = 'ts-card-name';
  name.textContent = theme.name;
  meta.appendChild(name);

  const type = document.createElement('span');
  type.className = 'ts-card-type';
  type.textContent = theme.scheme === 'dark' ? 'Dark' : 'Light';
  meta.appendChild(type);

  card.appendChild(meta);

  if (theme.isNew || current) {
    const badges = document.createElement('span');
    badges.className = 'ts-badges';

    if (current) {
      badges.appendChild(createBadge('Current'));
    }
    if (theme.isNew) {
      badges.appendChild(createBadge('NEW', 'new'));
    }

    card.appendChild(badges);
  }

  return card;
}

function createBadge(text: string, modifier = ''): HTMLElement {
  const badge = document.createElement('span');
  badge.className = `ts-badge${modifier ? ` ${modifier}` : ''}`;
  badge.textContent = text;
  return badge;
}

function selectTheme(themeName: string): void {
  if (!state) return;

  if (isCurrentTheme(themeName)) {
    setNote(`${themeName} is already active on this deck.`);
    clearSelection();
    return;
  }

  state.selectedTheme = state.selectedTheme === themeName ? null : themeName;
  updateConfirmStrip();
  renderGrid();
}

function clearSelection(): void {
  if (!state) return;

  state.selectedTheme = null;
  updateConfirmStrip();
  renderGrid();
}

function updateConfirmStrip(): void {
  const strip = byId('confirm-strip');
  const text = byId('confirm-text');
  const applyButton = byId('confirm-apply') as HTMLButtonElement;

  strip.classList.remove('is-success');

  if (!state?.selectedTheme) {
    strip.setAttribute('hidden', 'true');
    text.textContent = '';
    applyButton.onclick = null;
    return;
  }

  strip.removeAttribute('hidden');
  text.textContent = `Apply “${state.selectedTheme}” to ${state.presentationTitle}?`;
  applyButton.onclick = () => void applySelectedTheme();
}

async function applySelectedTheme(): Promise<void> {
  if (!state?.selectedTheme) return;

  const themeName = state.selectedTheme;
  const applyButton = byId('confirm-apply') as HTMLButtonElement;
  applyButton.classList.add('is-busy');
  applyButton.disabled = true;
  applyButton.textContent = 'Applying…';

  try {
    const payload = await callMcpTool('presentation_update_theme', {
      presentation_id: state.presentationId,
      theme_name: themeName,
    });

    assertSuccess(payload);

    mergeServerState(payload, themeName);
    setWidgetTheme(state.currentThemeName || themeName);
    updateConfirmStrip();
    renderGrid();
    setNote(`Applied ${themeName}. The deck now uses this theme.`);

    void pushModelContext(
      {
        event: 'theme_applied',
        presentationId: state.presentationId,
        presentationTitle: state.presentationTitle,
        appliedTheme: state.currentThemeName || themeName,
      },
      `User applied theme ${state.currentThemeName || themeName} to presentation `
        + `${state.presentationTitle} (${state.presentationId}) from the chat theme studio.`
    );
  } catch (error) {
    setNote(getActionErrorMessage(error));
  } finally {
    applyButton.classList.remove('is-busy');
    applyButton.disabled = false;
    applyButton.textContent = 'Apply theme';
  }
}

function mergeServerState(
  payload: Record<string, unknown>,
  appliedFallback: string
): void {
  if (!state) return;

  const next = toStudioState(payload);

  if (next.themes.length > 0) {
    state.themes = next.themes;
    state.canApplyTheme = next.canApplyTheme;
  }

  state.currentThemeName = next.currentThemeName || appliedFallback;
  state.selectedTheme = null;
}

function assertSuccess(payload: Record<string, unknown>): void {
  if (payload.success === false) {
    const error = getRecord(payload.error);
    throw new Error(getString(error.message, 'Verto could not apply that theme.'));
  }
}

function setNote(message: string): void {
  byId('studio-note').textContent = message;
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

function wireStaticControls(): void {
  const search = byId('studio-search') as HTMLInputElement;

  search.addEventListener('input', () => {
    if (!state) return;
    state.query = search.value;
    state.visibleLimit = INITIAL_VISIBLE_THEMES;
    renderGrid();
  });

  for (const [filter, tabId] of [
    ['all', 'tab-all'],
    ['light', 'tab-light'],
    ['dark', 'tab-dark'],
  ] as Array<[ThemeFilter, string]>) {
    byId(tabId).onclick = () => {
      if (!state) return;
      state.filter = filter;
      state.visibleLimit = INITIAL_VISIBLE_THEMES;
      renderSummary();
      renderGrid();
    };
  }

  byId('show-more').onclick = () => {
    if (!state) return;
    state.visibleLimit = Number.MAX_SAFE_INTEGER;
    renderGrid();
  };

  byId('confirm-cancel').onclick = () => clearSelection();
}

function renderStudioPayload(payload: Record<string, unknown>): void {
  ensureStudioStyles();
  ensureMarkup();

  const isFirstRender = !state;
  const nextState = toStudioState(payload);

  if (isFirstRender) {
    state = nextState;
    wireStaticControls();
  } else if (state && hasCatalogChanged(state, nextState)) {
    state.themes = nextState.themes;
    state.canApplyTheme = nextState.canApplyTheme;
  }

  if (state) {
    state.presentationId = nextState.presentationId;
    state.presentationTitle = nextState.presentationTitle;
    state.currentThemeName = nextState.currentThemeName;
  }

  setWidgetTheme(state?.currentThemeName || null);
  renderDeepLinkMenu(byId('studio-links'), extractWidgetLinks(payload));
  renderSummary();
  renderGrid();
  updateConfirmStrip();
}

function hasCatalogChanged(current: StudioState, next: StudioState): boolean {
  return (
    next.themes.length > 0
    && JSON.stringify(current.themes.map((theme) => theme.name))
      !== JSON.stringify(next.themes.map((theme) => theme.name))
  );
}

mountWidget((payload) => {
  renderStudioPayload(payload);
});
