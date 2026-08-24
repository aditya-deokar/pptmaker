import { App } from '@modelcontextprotocol/ext-apps';
import {
  byId,
  getArray,
  getRecord,
  getString,
  injectStyles,
} from './shared/runtime';
import {
  attachHostAdaptation,
  extractThemeName,
  extractWidgetLinks,
  renderDeepLinkMenu,
  setWidgetTheme,
  vertoSkinStyles,
} from './shared/verto-skin';
import { renderSlideContent } from '../../../lib/slides/render-core/index';

/**
 * Immersive presenter view (plan 10 F2 / Phase 10C). Receives slim deck
 * payloads from the app-only `presentation_render_deck` tool and presents
 * real themed slides inline or fullscreen, mirroring PresentationViewer:
 * 16:9 stage, prev/next pills, dot progress, counter, swipe, keyboard
 * (â†/â†’/Space/Home/End/Esc/G), grid overview, thin progress bar, and
 * chrome auto-hide after 3 s idle.
 */
const app = new App(
  { name: 'verto-ai', version: '0.1.0' },
  {},
  { autoResize: true }
);

const IDLE_HIDE_MS = 3000;

type DeckLiveSlide = {
  id: string;
  title: string;
  previewText: string;
  content?: unknown;
};

type DeckLiveViewModel = {
  id: string;
  title: string;
  themeName: string;
  slides: DeckLiveSlide[];
  links: ReturnType<typeof extractWidgetLinks>;
};

let presenterState = {
  index: 0,
  count: 0,
  fullscreen: false,
  gridOpen: false,
  idleTimer: null as ReturnType<typeof setTimeout> | null,
};

let lastDeck: DeckLiveViewModel = { id: '', title: '', themeName: '', slides: [], links: {} };

const deckLiveStyles = `
  .live-shell {
    display: grid;
    gap: 14px;
    min-height: 320px;
    padding: 24px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    letter-spacing: -0.01em;
  }
  .live-header {
    display: grid;
    gap: 6px;
    padding-right: 48px;
  }
  .live-kicker {
    color: var(--accent);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.05em;
  }
  .live-title {
    margin: 0;
    max-width: 40rem;
    font-size: 22px;
    font-weight: 800;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }
  .badge-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    min-height: 28px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 26px;
    max-width: 100%;
    border: 1px solid color-mix(in srgb, var(--line) 40%, transparent);
    border-radius: 99px;
    padding: 4px 12px;
    background: color-mix(in srgb, var(--surface) 60%, transparent);
    color: var(--fg);
    font-size: 12px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  /* Stage */
  .vt-stage {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    max-height: 78vh;
    border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
    border-radius: calc(var(--vt-radius, 12px) + 4px);
    overflow: hidden;
    box-shadow: var(--vt-shadow, none);
    touch-action: pan-y;
    cursor: grab;
  }
  .vt-stage:active { cursor: grabbing; }
  .vt-canvas {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: clamp(16px, 5%, 56px);
    background-color: var(--vt-slide-bg, var(--surface));
    background-image: var(--vt-slide-gradient, none);
    color: var(--vt-slide-fg, var(--fg));
    font-family: var(--vt-body-font, inherit);
    overflow: hidden;
  }
  [data-vt-theme="dark"] .vt-canvas { text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3); }
  .vt-stage-content {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    max-height: 100%;
    overflow: hidden;
  }
  /* Stage-scale typography (larger than filmstrip cards) */
  .vt-stage-content .vts-title { font-size: 34px; }
  .vt-stage-content .vts-heading1 { font-size: 28px; }
  .vt-stage-content .vts-heading2 { font-size: 23px; }
  .vt-stage-content .vts-heading3 { font-size: 18px; }
  .vt-stage-content .vts-heading4 { font-size: 15px; }
  .vt-stage-content .vts-p,
  .vt-stage-content .vts-li-text,
  .vt-stage-content .vts-toc,
  .vt-stage-content .vts-callout-body { font-size: 15px; }
  .vt-stage-content .vts-stat-value { font-size: 32px; }
  .vt-stage-content .vts-table td { font-size: 13px; }

  .vt-slide-fallback {
    display: grid;
    gap: 10px;
    text-align: left;
  }
  .vt-slide-fallback h2 {
    margin: 0;
    font-family: var(--vt-heading-font, inherit);
    font-size: 30px;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }
  .vt-slide-fallback p {
    margin: 0;
    color: var(--vt-slide-muted, var(--muted));
    font-size: 16px;
    line-height: 1.55;
    overflow-wrap: anywhere;
  }

  /* Slide transitions: fade + directional slide */
  .vt-anim-left { animation: vt-in-left 260ms cubic-bezier(0.33, 1, 0.68, 1) both; }
  .vt-anim-right { animation: vt-in-right 260ms cubic-bezier(0.33, 1, 0.68, 1) both; }
  .vt-anim-first { animation: vt-in-left 200ms ease both; }
  @keyframes vt-in-left {
    from { opacity: 0; transform: translateX(36px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes vt-in-right {
    from { opacity: 0; transform: translateX(-36px); }
    to { opacity: 1; transform: translateX(0); }
  }

  /* Top progress bar */
  .vt-progress {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    z-index: 20;
    pointer-events: none;
  }
  .vt-progress-fill {
    height: 100%;
    width: 0%;
    border-radius: 0 999px 999px 0;
    background: var(--vt-fill);
    transition: width 220ms cubic-bezier(0.33, 1, 0.68, 1);
  }

  /* Controls */
  .live-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .nav-group {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .pill-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    height: 44px;
    border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
    border-radius: 999px;
    padding: 0 18px;
    background: color-mix(in srgb, var(--surface) 80%, transparent);
    color: var(--fg);
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .pill-btn:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    color: var(--accent);
  }
  .pill-btn:disabled {
    cursor: default;
    opacity: 0.45;
  }
  .counter {
    min-width: 64px;
    text-align: center;
    color: var(--muted);
    font-size: 14px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .dot-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .dot-btn {
    width: 12px;
    height: 12px;
    padding: 0;
    border: none;
    border-radius: 999px;
    background: color-mix(in srgb, var(--line) 85%, transparent);
    cursor: pointer;
    transition: all 0.2s;
  }
  .dot-btn[aria-current="true"] {
    width: 26px;
    background: var(--vt-accent-gradient, var(--accent));
  }
  .fullscreen-btn.primary {
    border-color: transparent;
    /* Solid fallback doubles as the WCAG-measured background for white text */
    background-color: #dc2626;
    background-image: var(--vt-brand-gradient);
    color: #ffffff;
  }
  .fullscreen-btn.primary:hover:not(:disabled) {
    color: #ffffff;
    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.35);
  }
  .hint {
    margin: 0;
    color: var(--muted);
    font-size: 12.5px;
  }

  /* Grid overview */
  .vt-grid {
    display: none;
    position: relative;
    padding: 20px;
    border: 1px solid color-mix(in srgb, var(--line) 50%, transparent);
    border-radius: 16px;
    background:
      linear-gradient(rgba(10, 11, 15, 0.72), rgba(10, 11, 15, 0.72)),
      radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.18) 0%, rgba(249, 115, 22, 0.06) 30%, rgba(0, 0, 0, 0) 70%);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }
  .vt-grid.open { display: block; animation: vt-in-left 200ms ease both; }
  .vt-grid-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }
  .vt-grid-title {
    margin: 0;
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .vt-grid-close {
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 999px;
    background: transparent;
    color: #ffffff;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    padding: 7px 14px;
    cursor: pointer;
  }
  .vt-grid-list {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
  }
  .vt-thumb {
    width: 190px;
    border: 2px solid transparent;
    border-radius: 10px;
    padding: 0;
    overflow: hidden;
    cursor: pointer;
    background: none;
    text-align: left;
    font: inherit;
  }
  .vt-thumb[aria-current="true"] {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent);
  }
  .vt-thumb-box {
    aspect-ratio: 16 / 9;
    padding: 10px;
    background-color: var(--vt-slide-bg, var(--surface));
    background-image: var(--vt-slide-gradient, none);
    color: var(--vt-slide-fg, var(--fg));
    font-family: var(--vt-body-font, inherit);
    overflow: hidden;
  }
  .vt-thumb-caption {
    display: flex;
    gap: 6px;
    align-items: baseline;
    margin-top: 6px;
    color: #e5e7eb;
    font-size: 11.5px;
    font-weight: 600;
    max-width: 190px;
    white-space: nowrap;
  }
  .vt-thumb-num { color: #9ca3af; flex: none; }
  .vt-thumb-text { overflow: hidden; text-overflow: ellipsis; }
  /* Thumbnail typography scale-down */
  .vt-thumb-box .vts-root { font-size: 8px; }
  .vt-thumb-box .vts-title { font-size: 15px; margin-bottom: 4px; }
  .vt-thumb-box .vts-heading1 { font-size: 13px; }
  .vt-thumb-box .vts-heading2 { font-size: 11px; }
  .vt-thumb-box .vts-heading3 { font-size: 9.5px; }
  .vt-thumb-box .vts-heading4 { font-size: 8.5px; }
  .vt-thumb-box .vts-p,
  .vt-thumb-box .vts-li-text,
  .vt-thumb-box .vts-callout-body { font-size: 8px; }
  .vt-thumb-box .vts-stat-value { font-size: 14px; }
  .vt-thumb-box .vts-callout { padding: 6px; margin: 2px 0 4px; }
  .vt-thumb-box .vts-callout-icon { width: 16px; height: 16px; margin-right: 6px; font-size: 9px; }
  .vt-thumb-box .vts-timeline { padding: 8px; margin: 4px 0 2px; }
  .vt-thumb-box .vts-code-body { font-size: 6.5px; padding: 6px 8px; }
  .vt-thumb-box .vts-code-head { padding: 3px 8px; }

  /* Fullscreen mode */
  body.vt-fullscreen { background: #000000; }
  body.vt-fullscreen .live-shell {
    min-height: 100vh;
    min-height: 100dvh;
    padding: clamp(12px, 3vw, 40px);
    padding-top: calc(clamp(12px, 3vw, 40px) + var(--vt-safe-top, 0px));
    padding-right: calc(clamp(12px, 3vw, 40px) + var(--vt-safe-right, 0px));
    padding-bottom: calc(clamp(12px, 3vw, 40px) + var(--vt-safe-bottom, 0px));
    padding-left: calc(clamp(12px, 3vw, 40px) + var(--vt-safe-left, 0px));
    align-content: start;
  }
  body.vt-fullscreen .live-header { max-width: calc((78dvh - 80px) * 16 / 9); margin: 0 auto; width: 100%; }
  body.vt-fullscreen .vt-stage {
    max-height: none;
    height: min(78vh, 78dvh);
    width: min(100%, calc((78dvh) * 16 / 9));
    margin: 0 auto;
    border-color: rgba(255, 255, 255, 0.14);
    cursor: none;
  }
  body.vt-fullscreen .live-controls {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(18px + var(--vt-safe-bottom, 0px));
    z-index: 30;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 999px;
    padding: 8px 14px;
    background: rgba(17, 19, 24, 0.82);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    transition: opacity 400ms ease, visibility 400ms;
  }
  body.vt-fullscreen .hint { position: fixed; bottom: 6px; left: 50%; transform: translateX(-50%); opacity: 0.55; }
  body.vt-fullscreen .vt-grid {
    position: fixed;
    inset: calc(12px + var(--vt-safe-top, 0px)) calc(12px + var(--vt-safe-right, 0px)) auto calc(12px + var(--vt-safe-left, 0px));
    z-index: 25;
    max-height: 86vh;
  }
  body.vt-fullscreen .vt-links { position: fixed; top: calc(10px + var(--vt-safe-top, 0px)); right: calc(10px + var(--vt-safe-right, 0px)); }
  body.vt-fullscreen.vt-idle .live-controls,
  body.vt-fullscreen.vt-idle .vt-progress {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .vt-progress-fill { transition: none; }
  }
`;

function ensureLiveStyles(): void {
  injectStyles(vertoSkinStyles);
  injectStyles(deckLiveStyles);
}

function toDeckLiveViewModel(payload: Record<string, unknown>): DeckLiveViewModel {
  const widget = getRecord(payload.widget);

  let presentationRecord: Record<string, unknown> = {};
  let rawSlides: unknown[] = [];

  if (widget.widget === 'deck_live') {
    presentationRecord = getRecord(widget.presentation);
    rawSlides = getArray(widget.slides);
  } else {
    const data = getRecord(payload.data || payload);
    presentationRecord = getRecord(data.presentation || data);
    rawSlides = getArray(presentationRecord.slides);
  }

  const slides: DeckLiveSlide[] = rawSlides.slice(0, 50).map((slide, index) => {
    const record = getRecord(slide);

    return {
      id: getString(record.id, `slide-${index + 1}`),
      title: getString(
        record.title || record.slideName || record.slide_name,
        `Slide ${index + 1}`
      ),
      previewText: getString(record.previewText || record.preview_text),
      content: 'content' in record ? record.content : undefined,
    };
  });

  return {
    id: getString(presentationRecord.id),
    title: getString(presentationRecord.title, 'Verto presenter'),
    themeName: getString(presentationRecord.themeName || presentationRecord.theme_name),
    links: extractWidgetLinks(payload),
    slides,
  };
}

function ensureMarkup(): void {
  if (document.getElementById('verto-deck-live-widget')) {
    return;
  }

  document.body.innerHTML = `
    <main class="live-shell" id="verto-deck-live-widget">
      <div class="vt-progress" aria-hidden="true"><div class="vt-progress-fill" id="vt-progress-fill"></div></div>
      <div class="vt-links" id="live-links"></div>
      <section class="live-header" aria-labelledby="title">
        <div class="live-kicker">Verto AI presenter</div>
        <h1 class="live-title" id="title">Presenter</h1>
        <div class="badge-row" id="badges" aria-label="Deck metadata"></div>
      </section>
      <section class="vt-stage" id="stage" aria-label="Slide stage">
        <div class="vt-canvas" id="canvas"></div>
      </section>
      <div class="live-controls" id="controls">
        <div class="nav-group">
          <button class="pill-btn" id="prev-btn" type="button" aria-label="Previous slide">â†</button>
          <span class="counter" id="counter">0 / 0</span>
          <button class="pill-btn" id="next-btn" type="button" aria-label="Next slide">â†’</button>
        </div>
        <div class="dot-row" id="dot-row" role="group" aria-label="Slide picker"></div>
        <div class="nav-group">
          <button class="pill-btn" id="grid-btn" type="button" aria-expanded="false" aria-label="Toggle slide grid overview (G)">Grid</button>
          <button class="pill-btn fullscreen-btn primary" id="fs-btn" type="button">Present fullscreen</button>
        </div>
      </div>
      <p class="hint" id="hint">Use â† â†’ or Space to navigate, G for the grid overview, Esc to exit.</p>
      <section class="vt-grid" id="grid" role="region" aria-label="Slide grid overview">
        <div class="vt-grid-head">
          <h2 class="vt-grid-title">All slides</h2>
          <button class="vt-grid-close" id="grid-close" type="button">Close (Esc)</button>
        </div>
        <div class="vt-grid-list" id="grid-list"></div>
      </section>
    </main>
  `;
}

function hasRenderableContent(slide: DeckLiveSlide): boolean {
  if (slide.content == null) return false;

  return Array.isArray(slide.content) ? slide.content.length > 0 : typeof slide.content === 'object';
}

function renderStage(deck: DeckLiveViewModel, direction: 'left' | 'right' | 'first'): void {
  const slide = deck.slides[presenterState.index] ?? null;
  const canvas = byId('canvas');

  canvas.textContent = '';

  if (!slide) {
    canvas.innerHTML =
      '<div class="vt-slide-fallback"><h2>No slides yet</h2>' +
      '<p>This deck has no slides to present yet.</p></div>';
    byId('counter').textContent = `0 / ${presenterState.count}`;
    updateProgress();
    updateNavDisabled();
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = `vt-stage-content ${
    direction === 'first'
      ? 'vt-anim-first'
      : direction === 'left'
        ? 'vt-anim-left'
        : 'vt-anim-right'
  }`;
  wrapper.setAttribute('role', 'group');
  wrapper.setAttribute('aria-label', `Slide ${presenterState.index + 1}: ${slide.title}`);

  if (hasRenderableContent(slide)) {
    wrapper.innerHTML = renderSlideContent(slide.content);
  } else {
    const fallback = document.createElement('div');
    fallback.className = 'vt-slide-fallback';
    const heading = document.createElement('h2');
    heading.textContent = slide.title;
    fallback.appendChild(heading);

    if (slide.previewText) {
      const copy = document.createElement('p');
      copy.textContent = slide.previewText;
      fallback.appendChild(copy);
    }
    wrapper.appendChild(fallback);
  }

  canvas.appendChild(wrapper);
  byId('counter').textContent = `${presenterState.index + 1} / ${presenterState.count}`;
  updateProgress();
  updateNavDisabled();
  syncGridCurrent();
}

function updateProgress(): void {
  const fill = byId('vt-progress-fill');

  fill.style.width =
    presenterState.count > 0
      ? `${((presenterState.index + 1) / presenterState.count) * 100}%`
      : '0%';
}

function updateNavDisabled(): void {
  const prev = byId('prev-btn') as HTMLButtonElement;
  const next = byId('next-btn') as HTMLButtonElement;

  prev.disabled = presenterState.index <= 0;
  next.disabled = presenterState.index >= presenterState.count - 1;
}

function goTo(index: number): void {
  const clamped = Math.max(0, Math.min(presenterState.count - 1, index));

  if (clamped === presenterState.index) return;

  const direction = clamped > presenterState.index ? 'left' : 'right';

  presenterState.index = clamped;
  renderStage(lastDeck, direction);
  renderDots();
}

function renderDots(): void {
  const row = byId('dot-row');
  row.textContent = '';

  lastDeck.slides.forEach((slide, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'dot-btn';
    dot.setAttribute('aria-label', `Go to slide ${index + 1}: ${slide.title}`);
    dot.setAttribute('aria-current', String(index === presenterState.index));
    dot.addEventListener('click', () => goTo(index));
    row.appendChild(dot);
  });
}

function openGrid(): void {
  if (presenterState.gridOpen) {
    closeGrid();
    return;
  }

  const list = byId('grid-list');
  list.textContent = '';

  lastDeck.slides.forEach((slide, index) => {
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'vt-thumb';
    thumb.setAttribute('aria-label', `Go to slide ${index + 1}: ${slide.title}`);
    thumb.setAttribute('aria-current', String(index === presenterState.index));

    const box = document.createElement('div');
    box.className = 'vt-thumb-box';

    if (hasRenderableContent(slide)) {
      box.innerHTML = renderSlideContent(slide.content);
    } else {
      const mini = document.createElement('div');
      mini.className = 'vt-slide-fallback';
      const heading = document.createElement('h2');
      heading.style.fontSize = '14px';
      heading.style.margin = '0';
      heading.textContent = slide.title;
      mini.appendChild(heading);
      box.appendChild(mini);
    }

    const caption = document.createElement('span');
    caption.className = 'vt-thumb-caption';

    const num = document.createElement('span');
    num.className = 'vt-thumb-num';
    num.textContent = `${index + 1}`;

    const label = document.createElement('span');
    label.className = 'vt-thumb-text';
    label.textContent = slide.title;

    caption.appendChild(num);
    caption.appendChild(label);
    thumb.appendChild(box);
    thumb.appendChild(caption);
    thumb.addEventListener('click', () => {
      closeGrid();
      goTo(index);
    });

    list.appendChild(thumb);
  });

  byId('grid').classList.add('open');
  byId('grid-btn').setAttribute('aria-expanded', 'true');
  presenterState.gridOpen = true;
  byId('grid-close').focus();
}

function closeGrid(): void {
  if (!presenterState.gridOpen) return;

  byId('grid').classList.remove('open');
  byId('grid-btn').setAttribute('aria-expanded', 'false');
  presenterState.gridOpen = false;
}

function syncGridCurrent(): void {
  const thumbs = byId('grid-list').querySelectorAll('.vt-thumb');

  thumbs.forEach((thumb, index) => {
    thumb.setAttribute('aria-current', String(index === presenterState.index));
  });
}

/* ------------------------------------------------------------------ */
/* Fullscreen + idle chrome                                            */
/* ------------------------------------------------------------------ */

function canRequestFullscreen(): boolean {
  const context = app.getHostContext();

  return Boolean(context?.availableDisplayModes?.includes('fullscreen'));
}

async function enterFullscreen(): Promise<void> {
  presenterState.fullscreen = true;
  document.body.classList.add('vt-fullscreen');
  (byId('fs-btn') as HTMLButtonElement).textContent = 'Exit fullscreen';

  if (canRequestFullscreen()) {
    try {
      await app.requestDisplayMode({ mode: 'fullscreen' });
    } catch {
      // Host refused; local stage styling still applies.
    }
  }

  resetIdleTimer();
}

async function exitFullscreen(): Promise<void> {
  presenterState.fullscreen = false;
  document.body.classList.remove('vt-fullscreen', 'vt-idle');
  (byId('fs-btn') as HTMLButtonElement).textContent = 'Present fullscreen';

  if (presenterState.idleTimer) clearTimeout(presenterState.idleTimer);

  if (canRequestFullscreen()) {
    try {
      await app.requestDisplayMode({ mode: 'inline' });
    } catch {
      // Standalone/basic hosts have nothing to restore.
    }
  }
}

function resetIdleTimer(): void {
  if (!presenterState.fullscreen) return;

  document.body.classList.remove('vt-idle');

  if (presenterState.idleTimer) clearTimeout(presenterState.idleTimer);

  presenterState.idleTimer = setTimeout(() => {
    if (presenterState.fullscreen) {
      document.body.classList.add('vt-idle');
    }
  }, IDLE_HIDE_MS);
}

/* ------------------------------------------------------------------ */
/* Input: keyboard + swipe                                             */
/* ------------------------------------------------------------------ */

function onKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null;

  if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;

  switch (event.key) {
    case 'ArrowRight':
    case 'PageDown':
      event.preventDefault();
      goTo(presenterState.index + 1);
      break;
    case 'ArrowLeft':
    case 'PageUp':
      event.preventDefault();
      goTo(presenterState.index - 1);
      break;
    case ' ':
      event.preventDefault();
      goTo(presenterState.index + 1);
      break;
    case 'Home':
      event.preventDefault();
      goTo(0);
      break;
    case 'End':
      event.preventDefault();
      goTo(presenterState.count - 1);
      break;
    case 'Escape':
      if (presenterState.gridOpen) {
        closeGrid();
      } else if (presenterState.fullscreen) {
        void exitFullscreen();
      }
      break;
    case 'g':
    case 'G':
      event.preventDefault();
      openGrid();
      break;
    default:
      break;
  }

  resetIdleTimer();
}

let swipeStartX: number | null = null;
let swipeStartY: number | null = null;

function installInput(): void {
  window.addEventListener('keydown', onKeydown);

  const stage = byId('stage');

  stage.addEventListener('pointerdown', (event) => {
    swipeStartX = event.clientX;
    swipeStartY = event.clientY;
    resetIdleTimer();
  });

  stage.addEventListener('pointerup', (event) => {
    if (swipeStartX == null || swipeStartY == null) return;

    const dx = event.clientX - swipeStartX;
    const dy = event.clientY - swipeStartY;

    swipeStartX = null;
    swipeStartY = null;

    if (Math.abs(dx) > 48 && Math.abs(dy) < 80) {
      goTo(presenterState.index + (dx < 0 ? 1 : -1));
    }
  });

  ['pointermove', 'pointerdown'].forEach((eventName) => {
    window.addEventListener(eventName, resetIdleTimer, { passive: true });
  });

  (byId('prev-btn') as HTMLButtonElement).addEventListener('click', () => {
    goTo(presenterState.index - 1);
    resetIdleTimer();
  });
  (byId('next-btn') as HTMLButtonElement).addEventListener('click', () => {
    goTo(presenterState.index + 1);
    resetIdleTimer();
  });
  (byId('fs-btn') as HTMLButtonElement).addEventListener('click', () => {
    if (presenterState.fullscreen) {
      void exitFullscreen();
    } else {
      void enterFullscreen();
    }
  });
  byId('grid-btn').addEventListener('click', openGrid);
  byId('grid-close').addEventListener('click', closeGrid);

  app.onteardown = async () => {
    window.removeEventListener('keydown', onKeydown);

    if (presenterState.idleTimer) clearTimeout(presenterState.idleTimer);

    return {};
  };
}

/* ------------------------------------------------------------------ */

function createBadge(text: string): HTMLElement {
  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = text;
  return badge;
}

function renderDeckLivePayload(payload: Record<string, unknown>): void {
  ensureLiveStyles();
  ensureMarkup();

  const deck = toDeckLiveViewModel(payload);
  const hasData = deck.slides.length > 0 || Boolean(deck.id);

  setWidgetTheme(extractThemeName(payload) || deck.themeName || undefined);
  renderDeepLinkMenu(byId('live-links'), deck.links);

  if (!hasData) {
    byId('title').textContent = 'Presenter';
    byId('badges').textContent = '';
    byId('canvas').innerHTML =
      '<div class="vt-slide-fallback"><h2>Waiting for the deckâ€¦</h2>' +
      '<p>Open a presentation and choose Present to launch the live view.</p></div>';
    byId('counter').textContent = '0 / 0';
    updateProgress();
    return;
  }

  lastDeck = deck;
  presenterState.index = Math.min(presenterState.index, Math.max(0, deck.slides.length - 1));
  presenterState.count = deck.slides.length;

  byId('title').textContent = deck.title;

  const badges = byId('badges');
  badges.textContent = '';
  badges.appendChild(createBadge(`${deck.slides.length} slide${deck.slides.length === 1 ? '' : 's'}`));

  if (deck.themeName) {
    const themeBadge = document.createElement('span');
    themeBadge.className = 'badge';
    const swatch = document.createElement('span');
    swatch.className = 'vt-swatch';
    swatch.setAttribute('aria-hidden', 'true');
    themeBadge.appendChild(swatch);
    themeBadge.appendChild(document.createTextNode(deck.themeName));
    badges.appendChild(themeBadge);
  }

  renderStage(deck, 'first');
  renderDots();
  installInputOnce();
}

let inputInstalled = false;

function installInputOnce(): void {
  if (inputInstalled) return;

  installInput();
  inputInstalled = true;
}

/* Boot: same handshake contract as shared/runtime mountWidget. */
attachHostAdaptation(app);

app.ontoolresult = (params) => {
  renderDeckLivePayload(normalizeIncoming(params));
};

app.connect().catch((error) => {
  console.warn('Verto MCP Apps bridge was not initialized:', error);
});

if (window.__VERTO_MCP_PAYLOAD__) {
  renderDeckLivePayload(normalizeIncoming(window.__VERTO_MCP_PAYLOAD__));
}

/**
 * Mirrors shared/runtime normalizePayload: prefer `structuredContent`, then
 * a JSON text block, else treat the value as the widget payload itself
 * (standalone preview / Phase 9H harness inject the bare object).
 */
function normalizeIncoming(value: unknown): Record<string, unknown> {
  const record = getRecord(value);
  const structured = record.structuredContent || record.structured_content;

  if (structured) return getRecord(structured);

  const content = getArray(record.content);
  const textBlock = content.find((item) => {
    const entry = getRecord(item);
    return entry.type === 'text' && typeof entry.text === 'string';
  });

  if (textBlock) {
    try {
      return getRecord(JSON.parse(getString(getRecord(textBlock).text)));
    } catch {
      // Fall through to raw passthrough.
    }
  }

  return record;
}
