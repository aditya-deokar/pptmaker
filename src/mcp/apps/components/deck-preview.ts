import {
  byId,
  callMcpTool,
  getArray,
  getNumber,
  getRecord,
  getString,
  injectStyles,
  mountWidget,
} from './shared/runtime';

const deckStyles = `
  .deck-shell {
    display: grid;
    gap: 16px;
    min-height: 360px;
    padding: 24px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    letter-spacing: -0.01em;
  }
  .deck-header {
    display: grid;
    gap: 6px;
    margin-bottom: 8px;
  }
  .deck-kicker {
    color: var(--accent);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.05em;
  }
  .deck-title {
    margin: 0;
    max-width: 42rem;
    font-size: 26px;
    font-weight: 800;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }
  .deck-summary {
    max-width: 44rem;
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
  .badge.is-published {
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
  }
  .deck-stage {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(200px, 240px);
    gap: 20px;
    align-items: stretch;
  }
  .cover-preview {
    position: relative;
    display: grid;
    align-content: space-between;
    min-height: 242px;
    aspect-ratio: 16 / 9;
    border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
    border-radius: 16px;
    padding: 24px;
    overflow: hidden;
    background: color-mix(in srgb, var(--surface) 75%, transparent);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
  }
  .cover-meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .cover-title {
    max-width: 78%;
    margin: 22px 0 8px;
    font-size: 32px;
    font-weight: 800;
    line-height: 1.1;
    overflow-wrap: anywhere;
  }
  .cover-text {
    max-width: 68%;
    margin: 0;
    color: var(--muted);
    font-size: 15px;
    overflow-wrap: anywhere;
  }
  .cover-lines {
    display: grid;
    gap: 8px;
    width: min(260px, 58%);
    margin-top: 20px;
  }
  .cover-line {
    height: 8px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--accent) 20%, transparent);
  }
  .cover-line:nth-child(2) { width: 72%; }
  .cover-line:nth-child(3) { width: 48%; }
  .action-panel {
    display: grid;
    align-content: start;
    gap: 12px;
    border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
    border-radius: 16px;
    padding: 20px;
    background: color-mix(in srgb, var(--surface) 75%, transparent);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
  }
  .action-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
  }
  .action-note {
    min-height: 36px;
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
  .filmstrip {
    display: grid;
    gap: 12px;
  }
  .filmstrip-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .filmstrip-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
  .slide-card {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .slide-preview {
    position: relative;
    display: grid;
    align-content: end;
    aspect-ratio: 16 / 9;
    min-height: 78px;
    border: 1px solid color-mix(in srgb, var(--line) 40%, transparent);
    border-radius: 12px;
    padding: 12px;
    overflow: hidden;
    background: color-mix(in srgb, var(--surface) 60%, transparent);
    transition: all 0.2s;
  }
  .slide-preview:hover {
    background: color-mix(in srgb, var(--surface) 80%, transparent);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }
  .slide-number {
    position: absolute;
    top: 8px;
    left: 8px;
    min-width: 24px;
    border: 1px solid color-mix(in srgb, var(--line) 40%, transparent);
    border-radius: 99px;
    padding: 2px 8px;
    background: color-mix(in srgb, var(--surface) 80%, transparent);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: var(--fg);
    font-size: 11px;
    font-weight: 700;
    text-align: center;
  }
  .slide-title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    margin: 0;
    color: var(--fg);
    font-size: 13px;
    font-weight: 700;
    overflow: hidden;
    overflow-wrap: anywhere;
  }
  .slide-preview-text {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    min-height: 36px;
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    overflow: hidden;
    overflow-wrap: anywhere;
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
  .is-loading .cover-preview,
  .is-loading .badge,
  .is-loading .button,
  .is-loading .slide-preview {
    opacity: 0.6;
    pointer-events: none;
  }
  @media (max-width: 560px) {
    .deck-shell { padding: 16px; }
    .deck-stage { grid-template-columns: 1fr; }
    .cover-preview {
      min-height: 220px;
      aspect-ratio: 4 / 3;
    }
    .cover-title {
      max-width: 100%;
      font-size: 26px;
    }
    .cover-text { max-width: 100%; }
    .action-panel { grid-template-columns: 1fr; }
    .filmstrip-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
`;

let stylesInjected = false;

type DeckViewModel = {
  id: string;
  title: string;
  themeName: string;
  slideCount: number;
  updatedAt: string;
  isPublished: boolean;
  shareUrl: string;
  openUrl: string;
  actions: Record<string, unknown>;
  slides: unknown[];
};

function ensureDeckStyles(): void {
  if (stylesInjected) return;
  injectStyles(deckStyles);
  stylesInjected = true;
}

function ensureMarkup(): void {
  if (document.getElementById('verto-deck-widget')) {
    return;
  }

  document.body.innerHTML = `
    <main class="deck-shell" id="verto-deck-widget">
      <section class="deck-header" aria-labelledby="title">
        <div class="deck-kicker">Verto AI deck</div>
        <h1 class="deck-title" id="title">Deck preview</h1>
        <p class="deck-summary" id="summary">Waiting for deck data.</p>
        <div class="badge-row" id="badges" aria-label="Deck metadata"></div>
      </section>
      <section class="deck-stage" aria-label="Deck overview">
        <article class="cover-preview" id="cover-preview">
          <div class="cover-meta">
            <span id="cover-theme">Theme</span>
            <span id="cover-count">0 slides</span>
          </div>
          <div>
            <h2 class="cover-title" id="cover-title">Deck preview</h2>
            <p class="cover-text" id="cover-text">Slide preview will appear here.</p>
            <div class="cover-lines" aria-hidden="true">
              <span class="cover-line"></span>
              <span class="cover-line"></span>
              <span class="cover-line"></span>
            </div>
          </div>
        </article>
        <aside class="action-panel" aria-label="Deck actions">
          <p class="action-title">Next action</p>
          <a class="button primary" id="open-link">Open in Verto</a>
          <button class="button" id="secondary-action" type="button">Copy link</button>
          <button class="button" id="refresh-action" type="button">Refresh preview</button>
          <p class="action-note" id="action-note">Open the deck to continue editing in Verto.</p>
        </aside>
      </section>
      <section class="filmstrip" aria-label="Slide filmstrip">
        <div class="filmstrip-head">
          <span>Slide preview</span>
          <span id="filmstrip-count">0 shown</span>
        </div>
        <div class="filmstrip-grid" id="slides"></div>
      </section>
    </main>
  `;
}

function getDeckPayload(payload: Record<string, unknown>): {
  presentation: Record<string, unknown>;
  slides: unknown[];
  actions: Record<string, unknown>;
} {
  const widget = getRecord(payload.widget);

  if (widget.widget === 'deck_preview') {
    return {
      presentation: getRecord(widget.presentation),
      slides: getArray(widget.slides),
      actions: getRecord(widget.actions),
    };
  }

  const data = getRecord(payload.data || payload);
  const presentation = getRecord(data.presentation || data);

  return {
    presentation,
    slides: getArray(presentation.slides),
    actions: {},
  };
}

function toDeckViewModel(payload: Record<string, unknown>): DeckViewModel {
  const { presentation, slides, actions } = getDeckPayload(payload);

  return {
    id: getString(presentation.id),
    title: getString(presentation.title, 'Deck preview'),
    themeName: getString(presentation.theme_name || presentation.themeName, 'Default'),
    slideCount: getNumber(presentation.slide_count || presentation.slideCount, slides.length),
    updatedAt: getString(presentation.updated_at || presentation.updatedAt),
    isPublished: Boolean(presentation.is_published || presentation.isPublished),
    shareUrl: getString(presentation.share_url || presentation.shareUrl),
    openUrl: getString(presentation.open_url || presentation.openUrl || presentation.verto_url || presentation.url),
    actions,
    slides,
  };
}

function hasDeckData(deck: DeckViewModel): boolean {
  return Boolean(deck.id || deck.title !== 'Deck preview' || deck.slides.length > 0);
}

function getSlideTitle(slide: Record<string, unknown>, index: number): string {
  return getString(
    slide.title || slide.slideName || slide.slide_name,
    `Slide ${index + 1}`
  );
}

function getSlidePreview(slide: Record<string, unknown>): string {
  return getString(
    slide.previewText
      || slide.preview_text
      || slide.subtitle
      || slide.description
      || slide.body
      || slide.content
  );
}

function formatUpdatedAt(value: string): string {
  if (!value) return 'Updated time unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Updated time unavailable';
  }

  return `Updated ${new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date)}`;
}

function slideCountLabel(count: number): string {
  return `${count} slide${count === 1 ? '' : 's'}`;
}

function renderBadge(label: string, className = ''): HTMLElement {
  const badge = document.createElement('span');
  badge.className = `badge${className ? ` ${className}` : ''}`;
  badge.textContent = label;
  return badge;
}

function renderBadges(deck: DeckViewModel): void {
  const badges = byId('badges');
  badges.textContent = '';
  badges.appendChild(renderBadge(deck.isPublished ? 'Published' : 'Draft', deck.isPublished ? 'is-published' : ''));
  badges.appendChild(renderBadge(slideCountLabel(deck.slideCount)));
  badges.appendChild(renderBadge(deck.themeName));
  badges.appendChild(renderBadge(formatUpdatedAt(deck.updatedAt)));
}

function renderCover(deck: DeckViewModel): void {
  const firstSlide = getRecord(deck.slides[0]);
  const coverTitle = getSlideTitle(firstSlide, 0) || deck.title;
  const coverText = getSlidePreview(firstSlide) || 'A clean preview of your generated Verto deck.';

  byId('cover-theme').textContent = deck.themeName;
  byId('cover-count').textContent = slideCountLabel(deck.slideCount);
  byId('cover-title').textContent = coverTitle;
  byId('cover-text').textContent = coverText;
}

function configureOpenLink(deck: DeckViewModel): void {
  const link = byId('open-link');

  if (!(link instanceof HTMLAnchorElement)) return;

  link.textContent = 'Open in Verto';

  if (!deck.openUrl) {
    link.removeAttribute('href');
    link.setAttribute('aria-disabled', 'true');
    return;
  }

  link.href = deck.openUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-disabled', 'false');
}

function configureSecondaryAction(deck: DeckViewModel): void {
  const button = byId('secondary-action');
  const note = byId('action-note');

  if (!(button instanceof HTMLButtonElement)) return;

  button.disabled = false;
  button.setAttribute('aria-disabled', 'false');
  button.onclick = null;

  if (deck.shareUrl) {
    button.textContent = 'Copy share link';
    note.textContent = 'This deck is published. Share the public link when you are ready.';
    button.onclick = () => copyShareLink(deck.shareUrl, button, note);
    return;
  }

  if (deck.actions.canPublish !== false && deck.id) {
    button.textContent = 'Publish from chat';
    note.textContent = 'Publish when you want a public share link.';
    button.onclick = () => confirmOrPublishDeck(deck, button, note);
    return;
  }

  button.textContent = 'Share unavailable';
  button.disabled = true;
  button.setAttribute('aria-disabled', 'true');
  note.textContent = 'Sharing is unavailable for this deck state.';
}

function configureRefreshAction(deck: DeckViewModel): void {
  const button = byId('refresh-action');
  const note = byId('action-note');

  if (!(button instanceof HTMLButtonElement)) return;

  button.textContent = 'Refresh preview';
  button.onclick = null;

  if (!deck.id) {
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
    return;
  }

  button.disabled = false;
  button.setAttribute('aria-disabled', 'false');
  button.onclick = () => refreshDeckPreview(deck, button, note);
}

let pendingPublishPresentationId = '';

function confirmOrPublishDeck(
  deck: DeckViewModel,
  button: HTMLButtonElement,
  note: HTMLElement
): void {
  if (pendingPublishPresentationId !== deck.id) {
    pendingPublishPresentationId = deck.id;
    button.textContent = 'Confirm publish';
    note.textContent = 'This creates a public share link for this deck.';
    window.setTimeout(() => {
      if (pendingPublishPresentationId === deck.id && button.textContent === 'Confirm publish') {
        pendingPublishPresentationId = '';
        button.textContent = 'Publish from chat';
        note.textContent = 'Publish when you want a public share link.';
      }
    }, 6000);
    return;
  }

  pendingPublishPresentationId = '';
  void publishDeck(deck, button, note);
}

async function publishDeck(
  deck: DeckViewModel,
  button: HTMLButtonElement,
  note: HTMLElement
): Promise<void> {
  await runButtonAction(button, note, 'Publishing...', async () => {
    const publishedPayload = await callMcpTool('presentation_publish', {
      presentation_id: deck.id,
    });

    try {
      const refreshedPayload = await callMcpTool('presentation_get', {
        presentation_id: deck.id,
        include_slides: true,
      });
      renderDeckPayload(refreshedPayload);
    } catch {
      renderDeckPayload(publishedPayload);
    }

    byId('action-note').textContent = 'Deck published. The share link is ready.';
  });
}

async function refreshDeckPreview(
  deck: DeckViewModel,
  button: HTMLButtonElement,
  note: HTMLElement
): Promise<void> {
  await runButtonAction(button, note, 'Refreshing...', async () => {
    const payload = await callMcpTool('presentation_get', {
      presentation_id: deck.id,
      include_slides: true,
    });
    renderDeckPayload(payload);
    byId('action-note').textContent = 'Preview refreshed from Verto.';
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

async function copyShareLink(
  shareUrl: string,
  button: HTMLButtonElement,
  note: HTMLElement
): Promise<void> {
  try {
    await navigator.clipboard?.writeText(shareUrl);
    button.textContent = 'Copied';
    note.textContent = 'Share link copied.';
    window.setTimeout(() => {
      button.textContent = 'Copy share link';
    }, 1400);
  } catch {
    note.textContent = shareUrl;
  }
}

function renderSlides(deck: DeckViewModel): void {
  const container = byId('slides');
  container.textContent = '';
  byId('filmstrip-count').textContent = `${Math.min(deck.slides.length, 6)} shown`;

  if (deck.slides.length === 0) {
    const item = document.createElement('div');
    item.className = 'empty-state';
    item.textContent = 'Slide previews are not available yet. Open the deck to inspect the full presentation.';
    container.appendChild(item);
    return;
  }

  deck.slides.slice(0, 6).forEach((slide, index) => {
    const record = getRecord(slide);
    const item = document.createElement('article');
    item.className = 'slide-card';

    const preview = document.createElement('div');
    preview.className = 'slide-preview';

    const number = document.createElement('span');
    number.className = 'slide-number';
    number.textContent = String(index + 1);
    preview.appendChild(number);

    const title = document.createElement('h3');
    title.className = 'slide-title';
    title.textContent = getSlideTitle(record, index);
    preview.appendChild(title);

    const previewText = document.createElement('p');
    previewText.className = 'slide-preview-text';
    previewText.textContent = getSlidePreview(record) || 'Preview text unavailable.';

    item.appendChild(preview);
    item.appendChild(previewText);
    container.appendChild(item);
  });
}

function renderLoading(): void {
  const root = byId('verto-deck-widget');
  root.classList.add('is-loading');
  byId('title').textContent = 'Loading deck preview';
  byId('summary').textContent = 'Waiting for Verto deck data from ChatGPT.';
  renderBadges({
    id: '',
    title: 'Deck preview',
    themeName: 'Theme pending',
    slideCount: 0,
    updatedAt: '',
    isPublished: false,
    shareUrl: '',
    openUrl: '',
    actions: {},
    slides: [],
  });
  renderCover({
    id: '',
    title: 'Deck preview',
    themeName: 'Theme pending',
    slideCount: 0,
    updatedAt: '',
    isPublished: false,
    shareUrl: '',
    openUrl: '',
    actions: {},
    slides: [],
  });
  configureOpenLink({
    id: '',
    title: 'Deck preview',
    themeName: 'Theme pending',
    slideCount: 0,
    updatedAt: '',
    isPublished: false,
    shareUrl: '',
    openUrl: '',
    actions: {},
    slides: [],
  });
  configureSecondaryAction({
    id: '',
    title: 'Deck preview',
    themeName: 'Theme pending',
    slideCount: 0,
    updatedAt: '',
    isPublished: false,
    shareUrl: '',
    openUrl: '',
    actions: { canPublish: false },
    slides: [],
  });
  configureRefreshAction({
    id: '',
    title: 'Deck preview',
    themeName: 'Theme pending',
    slideCount: 0,
    updatedAt: '',
    isPublished: false,
    shareUrl: '',
    openUrl: '',
    actions: {},
    slides: [],
  });
  renderSlides({
    id: '',
    title: 'Deck preview',
    themeName: 'Theme pending',
    slideCount: 0,
    updatedAt: '',
    isPublished: false,
    shareUrl: '',
    openUrl: '',
    actions: {},
    slides: [],
  });
}

function renderDeckPayload(payload: Record<string, unknown>): void {
  ensureDeckStyles();
  ensureMarkup();

  const deck = toDeckViewModel(payload);
  const root = byId('verto-deck-widget');

  if (!hasDeckData(deck)) {
    renderLoading();
    return;
  }

  root.classList.remove('is-loading');
  byId('title').textContent = deck.title;
  byId('summary').textContent = deck.slides.length > 0
    ? `Previewing ${slideCountLabel(deck.slideCount)} in ${deck.themeName}.`
    : 'Deck metadata is ready. Slide previews are still unavailable.';

  renderBadges(deck);
  renderCover(deck);
  configureOpenLink(deck);
  configureSecondaryAction(deck);
  configureRefreshAction(deck);
  renderSlides(deck);
}

mountWidget((payload) => {
  renderDeckPayload(payload);
});
