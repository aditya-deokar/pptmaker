import {
  byId,
  callMcpTool,
  getArray,
  getNumber,
  getRecord,
  getString,
  injectStyles,
  logWidgetWarning,
  mountWidget,
  onTeardown,
  onToolInputPartial,
  pushModelContext,
} from './shared/runtime';
import {
  canPresentFullscreen,
  extractThemeName,
  extractWidgetLinks,
  findTheme,
  renderDeepLinkMenu,
  resolveThemeTokens,
  setWidgetTheme,
} from './shared/verto-skin';
import { renderSlideContent } from '../../../lib/slides/render-core/index';
import {
  applyPatchesToSlides,
  createSlideEditor,
  type SlideEditPatch,
  type SlideEditorHandle,
} from './shared/slide-editor';

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
    padding-right: 48px;
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
    padding: 24px;
  }
  .cover-meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: var(--vt-slide-muted);
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .cover-theme-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    max-width: 100%;
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
    color: var(--vt-slide-muted);
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
    background: color-mix(in srgb, var(--vt-slide-fg) 20%, transparent);
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
  .button.present-btn {
    border-color: transparent;
    /* Solid fallback doubles as the WCAG-measured background for white text */
    background-color: #dc2626;
    background-image: var(--vt-brand-gradient);
    color: #ffffff;
  }
  .button.present-btn:hover:not(:disabled) {
    opacity: 1;
    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.35);
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
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .slide-card {
    display: flex;
    gap: 16px;
    align-items: stretch;
    min-width: 0;
  }
  .slide-reorder-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    justify-content: center;
  }
  .reorder-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid var(--line);
    border-radius: 4px;
    background: var(--surface);
    color: var(--muted);
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 0;
  }
  .reorder-btn:hover:not(:disabled) {
    background: var(--line);
    color: var(--fg);
  }
  .reorder-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .slide-preview {
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    aspect-ratio: auto;
    min-height: 120px;
    border: 1px solid color-mix(in srgb, var(--line) 40%, transparent);
    padding: 16px;
    transition: filter 0.2s;
  }
  .slide-preview:hover {
    filter: brightness(1.05);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }
  .slide-content-html {
    margin-top: 0;
    min-width: 0;
  }
  .slide-number {
    display: inline-flex;
    align-self: flex-start;
    min-width: 24px;
    border: 1px solid color-mix(in srgb, var(--vt-slide-fg) 18%, transparent);
    border-radius: 99px;
    padding: 2px 8px;
    background: color-mix(in srgb, var(--vt-slide-fg) 10%, transparent);
    color: var(--vt-slide-fg);
    font-size: 11px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 8px;
  }
  .slide-title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    margin: 0;
    color: var(--vt-slide-fg);
    font-family: var(--vt-heading-font);
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
    color: var(--vt-slide-muted);
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
    .filmstrip-grid { grid-template-columns: 1fr; }
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
  rawSlides: unknown[];
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
      <div class="vt-links" id="deck-links"></div>
      <section class="deck-header" aria-labelledby="title">
        <div class="deck-kicker">Verto AI deck</div>
        <h1 class="deck-title" id="title">Deck preview</h1>
        <p class="deck-summary" id="summary">Waiting for deck data.</p>
        <div class="badge-row" id="badges" aria-label="Deck metadata"></div>
      </section>
      <section class="deck-stage" aria-label="Deck overview">
        <article class="cover-preview vt-slide-surface" id="cover-preview">
          <div class="cover-meta">
            <span class="cover-theme-chip"><span class="vt-swatch" aria-hidden="true"></span><span id="cover-theme">Theme</span></span>
            <span id="cover-count">0 slides</span>
          </div>
          <div>
            <h2 class="cover-title vt-slide-heading" id="cover-title">Deck preview</h2>
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
          <button class="button primary present-btn" id="present-action" type="button">Present live</button>
          <button class="button" id="edit-action" type="button">Edit this slide</button>
          <button class="button" id="theme-action" type="button">Change theme</button>
          <a class="button" id="open-link">Open in Verto</a>
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
      <section id="slide-editor" aria-label="Guided slide editor"></section>
    </main>
  `;
}

function getDeckPayload(payload: Record<string, unknown>): {  presentation: Record<string, unknown>;
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
    rawSlides: getArray(getRecord(getRecord(payload.data || payload).presentation || getRecord(payload.data || payload)).slides).length > 0 
      ? getArray(getRecord(getRecord(payload.data || payload).presentation || getRecord(payload.data || payload)).slides)
      : slides,
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
  badges.appendChild(renderThemeBadge(deck.themeName));
  badges.appendChild(renderBadge(formatUpdatedAt(deck.updatedAt)));
}

function renderThemeBadge(themeName: string): HTMLElement {
  const badge = document.createElement('span');
  badge.className = 'badge';
  const swatch = document.createElement('span');
  swatch.className = 'vt-swatch';
  swatch.setAttribute('aria-hidden', 'true');
  swatch.style.background = themeGradient(themeName);
  badge.appendChild(swatch);
  badge.appendChild(document.createTextNode(themeName));
  return badge;
}

function themeGradient(themeName: string): string {
  const theme = findTheme(themeName);
  return theme ? resolveThemeTokens(theme).accentGradient : 'var(--vt-brand-gradient)';
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

  link.classList.remove('primary');
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

function configurePresentAction(deck: DeckViewModel): void {
  const button = byId('present-action');

  if (!(button instanceof HTMLButtonElement)) return;

  // Plan 10 F10: when the host advertises its display modes and fullscreen
  // is not among them, the presenter would only duplicate this preview â€”
  // hide the hero entry point.
  const fullscreenAvailable = canPresentFullscreen();
  button.hidden = fullscreenAvailable === false;

  if (!deck.id) {
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
    button.onclick = null;
    return;
  }

  button.disabled = false;
  button.setAttribute('aria-disabled', 'false');
  button.onclick = () => presentDeck(deck, button, byId('action-note'));
}

async function presentDeck(
  deck: DeckViewModel,
  button: HTMLButtonElement,
  note: HTMLElement
): Promise<void> {
  await runButtonAction(button, note, 'Opening presenterâ€¦', async () => {
    await callMcpTool('presentation_render_deck', {
      presentation_id: deck.id,
    });
    note.textContent = 'Presenter opened. Use â† â†’ to navigate.';
  });
}

function configureThemeAction(deck: DeckViewModel): void {
  const button = byId('theme-action');
  const note = byId('action-note');

  if (!(button instanceof HTMLButtonElement)) return;

  if (!deck.id) {
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
    button.onclick = null;
    return;
  }

  button.disabled = false;
  button.setAttribute('aria-disabled', 'false');
  button.onclick = () =>
    openThemeStudio(deck, button, note);
}

function configureEditAction(deck: DeckViewModel): void {
  const button = byId('edit-action');

  if (!(button instanceof HTMLButtonElement)) return;

  const canEdit = Boolean(deck.id)
    && Boolean(deck.actions.canUpdateSlides)
    && deck.rawSlides.length > 0;

  button.disabled = !canEdit;
  button.setAttribute('aria-disabled', canEdit ? 'false' : 'true');
  button.onclick = canEdit ? () => openSlideEditor(deck) : null;
}

async function openThemeStudio(
  deck: DeckViewModel,
  button: HTMLButtonElement,
  note: HTMLElement
): Promise<void> {
  await runButtonAction(button, note, 'Opening theme studioâ€¦', async () => {
    await callMcpTool('presentation_render_theme_studio', {
      presentation_id: deck.id,
    });
    note.textContent = 'Theme studio opened. Pick a look and apply it live.';
  });
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

let currentDeck: DeckViewModel | null = null;
let slideEditorHandle: SlideEditorHandle | null = null;
let teardownWired = false;

function wireEditorTeardown(): void {
  if (teardownWired) return;
  teardownWired = true;

  onTeardown(() => {
    if (slideEditorHandle?.hasUnsavedEdits()) {
      logWidgetWarning(
        'Verto deck preview was torn down with unsaved guided slide edits.'
      );
    }
  });
}

/**
 * Plan 10 F6: opens the guided single-slide editor. Saving re-fetches the
 * deck, applies patches onto the fresh tree, and performs a full-replacement
 * `presentation_update_slides` call before confirming with a diff strip.
 */
function openSlideEditor(deck: DeckViewModel): void {
  slideEditorHandle?.close();
  currentDeck = deck;

  slideEditorHandle = createSlideEditor({
    container: byId('slide-editor'),
    getSlides: () => currentDeck?.rawSlides ?? [],
    canUpdate: Boolean(deck.actions.canUpdateSlides) && deck.rawSlides.length > 0,
    save: (patches) => saveSlideEdits(patches),
    onClose: (hadUnsavedEdits) => {
      if (hadUnsavedEdits) {
        logWidgetWarning('Verto guided slide editor closed with unsaved edits.');
      }
    },
  });

  slideEditorHandle.open();
}

async function saveSlideEdits(patches: SlideEditPatch[]): Promise<void> {
  const deck = currentDeck;

  if (!deck?.id) {
    throw new Error('This deck is not available for editing.');
  }

  const freshPayload = await callMcpTool('presentation_get', {
    presentation_id: deck.id,
    include_slides: true,
  });

  const freshSlides = extractRawSlides(freshPayload);

  if (freshSlides.length === 0) {
    throw new Error('Could not read the current slides from Verto.');
  }

  const nextSlides = applyPatchesToSlides(freshSlides, patches);

  const result = await callMcpTool('presentation_update_slides', {
    presentation_id: deck.id,
    slides: nextSlides,
  });

  assertSuccess(result);
  syncAfterSave(deck, nextSlides, patches);
}

/** Raw slides prefer the full presentation payload (slideName/type intact). */
function extractRawSlides(payload: Record<string, unknown>): unknown[] {
  const data = getRecord(payload.data || payload);
  const presentation = getRecord(data.presentation || data);

  const fromData = Array.isArray(presentation.slides)
    ? presentation.slides
    : [];

  return fromData.length > 0 ? fromData : getArray(getRecord(payload.widget).slides);
}

function assertSuccess(payload: Record<string, unknown>): void {
  if (payload.success === false) {
    const error = getRecord(payload.error);
    throw new Error(getString(error.message, 'Verto could not complete that action.'));
  }
}

function syncAfterSave(
  deck: DeckViewModel,
  nextSlides: unknown[],
  patches: SlideEditPatch[]
): void {
  renderDeckPayload({
    success: true,
    data: {
      presentation: {
        id: deck.id,
        title: deck.title,
        theme_name: deck.themeName,
        slide_count: nextSlides.length,
        updated_at: new Date().toISOString(),
        is_published: deck.isPublished,
        share_url: deck.shareUrl,
        open_url: deck.openUrl,
        slides: nextSlides,
      },
    },
  });
  byId('action-note').textContent = 'Slide edits saved to Verto.';

  void pushModelContext(
    {
      event: 'slides_edited',
      presentationId: deck.id,
      editedBlocks: patches.length,
      edits: patches.map((patch) => ({
        slideTitle: patch.slideTitle,
        originalText: patch.originalText,
        newText: patch.newText,
      })),
    },
    `User edited ${patches.length} text ${patches.length === 1 ? 'block' : 'blocks'} on `
      + `"${patches[0].slideTitle}" of presentation ${deck.title} (${deck.id}) from chat.`
  );
}

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

async function reorderSlide(deck: DeckViewModel, index: number, direction: -1 | 1, button: HTMLButtonElement): Promise<void> {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= deck.rawSlides.length) return;

  const rawSlides = [...deck.rawSlides];
  const temp = rawSlides[index];
  rawSlides[index] = rawSlides[newIndex];
  rawSlides[newIndex] = temp;

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = '...';

  try {
    const updatedPayload = await callMcpTool('presentation_update_slides', {
      presentation_id: deck.id,
      slides: rawSlides
    });
    const refreshedPayload = await callMcpTool('presentation_get', {
      presentation_id: deck.id,
      include_slides: true
    });
    renderDeckPayload(refreshedPayload);
  } catch (error) {
    console.error(error);
    button.disabled = false;
    button.textContent = originalText || '';
    alert('Failed to reorder slide.');
  }
}

function renderSlides(deck: DeckViewModel): void {
  const container = byId('slides');
  container.textContent = '';
  byId('filmstrip-count').textContent = `${Math.min(deck.slides.length, 50)} shown`;

  if (deck.slides.length === 0) {
    const item = document.createElement('div');
    item.className = 'empty-state';
    item.textContent = 'Slide previews are not available yet. Open the deck to inspect the full presentation.';
    container.appendChild(item);
    return;
  }

  const canUpdate = Boolean(deck.actions.canUpdateSlides);

  deck.slides.slice(0, 50).forEach((slide, index) => {
    const record = getRecord(slide);
    const item = document.createElement('article');
    item.className = 'slide-card';

    if (canUpdate) {
      const controls = document.createElement('div');
      controls.className = 'slide-reorder-controls';

      const upBtn = document.createElement('button');
      upBtn.className = 'reorder-btn';
      upBtn.textContent = 'â†‘';
      upBtn.disabled = index === 0;
      upBtn.onclick = () => reorderSlide(deck, index, -1, upBtn);

      const downBtn = document.createElement('button');
      downBtn.className = 'reorder-btn';
      downBtn.textContent = 'â†“';
      downBtn.disabled = index === deck.slides.length - 1;
      downBtn.onclick = () => reorderSlide(deck, index, 1, downBtn);

      controls.appendChild(upBtn);
      controls.appendChild(downBtn);
      item.appendChild(controls);
    }

    const preview = document.createElement('div');
    preview.className = 'slide-preview vt-slide-surface';

    const number = document.createElement('span');
    number.className = 'slide-number';
    number.textContent = String(index + 1);
    preview.appendChild(number);

    const title = document.createElement('h3');
    title.className = 'slide-title';
    title.textContent = getSlideTitle(record, index);
    // Hide title if we are rendering html to avoid duplication
    if (record.content) {
      title.style.display = 'none';
    } else {
      preview.appendChild(title);
    }

    if (record.content) {
      const contentHtml = document.createElement('div');
      contentHtml.className = 'slide-content-html';
      contentHtml.innerHTML = renderSlideContent(record.content);
      preview.appendChild(contentHtml);
    } else {
      const previewText = document.createElement('p');
      previewText.className = 'slide-preview-text';
      previewText.textContent = getSlidePreview(record) || 'Preview text unavailable.';
      preview.appendChild(previewText);
    }

    item.appendChild(preview);
    container.appendChild(item);
  });
}

function renderLoading(): void {
  const root = byId('verto-deck-widget');
  root.classList.add('is-loading');
  currentDeck = null;
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
    rawSlides: [],
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
    rawSlides: [],
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
    rawSlides: [],
  });
  configurePresentAction({
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
    rawSlides: [],
  });
  configureThemeAction({
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
    rawSlides: [],
  });
  configureEditAction({
    id: '',
    title: 'Deck preview',
    themeName: 'Theme pending',
    slideCount: 0,
    updatedAt: '',
    isPublished: false,
    shareUrl: '',
    openUrl: '',
    actions: { canUpdateSlides: false },
    slides: [],
    rawSlides: [],
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
    rawSlides: [],
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
    rawSlides: [],
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
    rawSlides: [],
  });
}

function renderDeckPayload(payload: Record<string, unknown>): void {
  ensureDeckStyles();
  ensureMarkup();
  wireEditorTeardown();

  const deck = toDeckViewModel(payload);
  const root = byId('verto-deck-widget');

  if (!hasDeckData(deck)) {
    renderLoading();
    return;
  }

  currentDeck = deck;

  setWidgetTheme(extractThemeName(payload));
  renderDeepLinkMenu(byId('deck-links'), extractWidgetLinks(payload));

  root.classList.remove('is-loading');
  byId('title').textContent = deck.title;
  byId('summary').textContent = deck.slides.length > 0
    ? `Previewing ${slideCountLabel(deck.slideCount)} in ${deck.themeName}.`
    : 'Deck metadata is ready. Slide previews are still unavailable.';

  renderBadges(deck);
  renderCover(deck);
  configureOpenLink(deck);
  configurePresentAction(deck);
  configureThemeAction(deck);
  configureEditAction(deck);
  configureSecondaryAction(deck);
  configureRefreshAction(deck);
  renderSlides(deck);
}

mountWidget((payload) => {
  dismissStreamStatus();
  renderDeckPayload(payload);
});

/* ------------------------------------------------------------------ */
/* Plan D4: streaming partial tool input.                              */
/* While the model composes a large `presentation_update_slides` call,  */
/* hosts that stream partial arguments surface a live "preparing N      */
/* slides" strip so guided edits feel responsive instead of frozen.     */
/* ------------------------------------------------------------------ */

const STREAM_STATUS_ID = 'vdp-stream-status';

function dismissStreamStatus(): void {
  document.getElementById(STREAM_STATUS_ID)?.remove();
}

function showStreamStatus(message: string): void {
  let strip = document.getElementById(STREAM_STATUS_ID);

  if (!strip) {
    const root = document.getElementById('verto-deck-widget');
    if (!root) return;

    strip = document.createElement('div');
    strip.id = STREAM_STATUS_ID;
    strip.setAttribute('role', 'status');
    strip.setAttribute('aria-live', 'polite');
    Object.assign(strip.style, {
      position: 'fixed',
      left: '12px',
      right: '12px',
      bottom: '12px',
      zIndex: '60',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 14px',
      borderRadius: '12px',
      fontSize: '12px',
      lineHeight: '1.4',
      color: 'var(--vt-slide-fg, #18181b)',
      background: 'var(--vt-surface-chip, rgba(0,0,0,0.06))',
      border: '1px solid var(--vt-accent, #3b82f6)',
      pointerEvents: 'none',
    } as CSSStyleDeclaration);

    const spinner = document.createElement('span');
    spinner.setAttribute('aria-hidden', 'true');
    spinner.textContent = '✎';
    strip.appendChild(spinner);

    const label = document.createElement('span');
    label.className = 'vdp-stream-status-label';
    strip.appendChild(label);

    root.appendChild(strip);
  }

  const label = strip.querySelector<HTMLSpanElement>('.vdp-stream-status-label');
  if (label) {
    label.textContent = message;
  }
}

// Registered before connect() per the runtime contract; inert on hosts
// that never stream partial tool input.
onToolInputPartial((args) => {
  if (typeof args.presentation_id !== 'string') return;
  if (!Array.isArray(args.slides)) return;

  const deckId = currentDeck?.id ?? '';
  if (deckId && args.presentation_id !== deckId) return;

  const count = args.slides.filter(
    (slide) => slide && typeof slide === 'object'
  ).length;

  showStreamStatus(`Assistant is updating slides… ${count} received`);
});

onTeardown(() => {
  dismissStreamStatus();
});
