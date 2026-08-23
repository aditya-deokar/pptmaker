/**
 * Real slide renderer — vanilla port of the dashboard editor's preview
 * rendering (plan 10 F1 / Phase 10B).
 *
 * Mirrors `MasterRecursiveComponent` + the editor components under
 * `src/components/global/editor/compontents/`: same DOM structure, colors,
 * fonts, and spacing, translated from Tailwind to a `.vts-*` stylesheet and
 * driven by the `--vt-*` deck-theme variables from verto-skin.
 *
 * Coverage: title, heading1–4, paragraph/text, numberedList, bulletList/
 * bulletedList, todoList, blockquote/quote, calloutBox (all 5 variants),
 * codeBlock/code, divider, statBox, timelineCard, table, tableOfContents,
 * image (graceful fallback), link, customButton, column/multiColumn/
 * resizable-column/imageAndText recursive layouts. Unknown types fall back
 * to plain content rendering instead of dropping data.
 *
 * All text is HTML-escaped; input comes from untrusted tool payloads.
 */

import { ensureReadable } from './verto-skin';

let stylesInjected = false;
const STYLE_ELEMENT_ID = 'verto-slide-renderer-styles';

/** Widget-scale translation of the dashboard's heading clamp() sizes. */
export const slideRendererStyles = `
  .vts-root {
    color: var(--vt-slide-fg, var(--fg, #18181b));
    font-family: var(--vt-body-font, inherit);
    font-size: 13px;
  }

  /* Headings — Headings.tsx */
  .vts-h {
    position: relative;
    width: 100%;
    line-height: 1.2;
    font-family: var(--vt-heading-font, inherit);
    overflow-wrap: anywhere;
  }
  .vts-title {
    font-size: 26px;
    font-weight: 900;
    letter-spacing: -0.03em;
    margin-bottom: 16px;
  }
  .vts-heading1 {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin-bottom: 10px;
  }
  .vts-title.vts-accent,
  .vts-heading1.vts-accent {
    margin-bottom: 0;
  }
  .vts-accent-bar {
    width: 60px;
    height: 3px;
    margin-top: 12px;
    border-radius: 999px;
    background: var(--vt-accent-gradient, var(--accent, #0f766e));
  }
  .vts-accent-bar.w48 { width: 48px; }
  .vts-heading2 {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.015em;
    margin-bottom: 8px;
  }
  .vts-heading3 {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin-bottom: 6px;
  }
  .vts-heading4 {
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 6px;
  }
  [data-vt-theme="dark"] .vts-h { text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3); }

  /* Paragraph — Paragraph.tsx */
  .vts-p {
    margin: 0 0 6px;
    max-width: 72ch;
    font-size: 13px;
    line-height: 1.6;
    opacity: 0.9;
    overflow-wrap: anywhere;
  }

  /* Lists — ListComponents.tsx */
  .vts-list {
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .vts-list li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .vts-list .vts-li-text {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    line-height: 1.5;
    padding-top: 2px;
    overflow-wrap: anywhere;
  }
  .vts-num-badge {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--vt-accent, #3b82f6) 12%, transparent);
    border: 1.5px solid color-mix(in srgb, var(--vt-accent, #3b82f6) 30%, transparent);
    color: var(--vts-accent-text, var(--vt-accent, #3b82f6));
    font-size: 11px;
    font-weight: 700;
  }
  .vts-bullet-dot {
    flex: none;
    width: 10px;
    height: 10px;
    margin-top: 6px;
    border-radius: 999px;
    background: var(--vt-accent, #3b82f6);
    opacity: 0.7;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--vt-accent, #3b82f6) 8%, transparent);
  }
  .vts-todo-check {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-top: 2px;
    border-radius: 6px;
    border: 2px solid color-mix(in srgb, var(--vt-slide-fg, #18181b) 30%, transparent);
    background: transparent;
  }
  .vts-todo-check.checked {
    border-color: var(--vt-accent, #3b82f6);
    background: var(--vt-accent, #3b82f6);
  }
  .vts-todo-label.checked {
    opacity: 0.45;
    text-decoration: line-through;
  }

  /* BlockQuote — BlockQuote.tsx */
  .vts-blockquote {
    position: relative;
    padding: 12px 0 12px 28px;
    margin: 12px 0;
    overflow: hidden;
  }
  .vts-blockquote::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 4px;
    height: 100%;
    border-radius: 999px;
    background: var(--vt-accent-gradient, var(--accent, #0f766e));
  }
  .vts-blockquote::after {
    content: "\\201C";
    position: absolute;
    top: -8px;
    left: 10px;
    color: var(--vt-accent, #3b82f6);
    opacity: 0.12;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 56px;
    line-height: 1;
    pointer-events: none;
    user-select: none;
  }
  .vts-blockquote-inner { position: relative; z-index: 1; font-style: italic; }

  /* CalloutBox — CalloutBox.tsx */
  .vts-callout {
    --vts-co-accent: #3b82f6;
    --vts-co-text: #1d4ed8;
    --vts-co-bg: rgba(59, 130, 246, 0.08);
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 0;
    padding: 14px;
    margin: 4px 0 8px;
    border-radius: var(--vt-radius, 12px);
    background: var(--vts-co-bg);
    border: 1px solid color-mix(in srgb, var(--vts-co-accent) 20%, transparent);
    overflow: hidden;
  }
  .vts-callout::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 4px;
    height: 100%;
    border-radius: 4px 0 0 4px;
    background: linear-gradient(to bottom, var(--vts-co-accent), color-mix(in srgb, var(--vts-co-accent) 60%, transparent), color-mix(in srgb, var(--vts-co-accent) 20%, transparent));
  }
  .vts-callout-icon {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-right: 12px;
    border-radius: 9px;
    background: linear-gradient(135deg, color-mix(in srgb, var(--vts-co-accent) 20%, transparent), color-mix(in srgb, var(--vts-co-accent) 10%, transparent));
    border: 1px solid color-mix(in srgb, var(--vts-co-accent) 25%, transparent);
    color: var(--vts-co-text);
    font-size: 15px;
    font-weight: 700;
  }
  .vts-callout-body {
    flex: 1;
    min-width: 0;
    margin-top: 2px;
    color: var(--vts-co-text);
    font-size: 13px;
    line-height: 1.55;
    overflow-wrap: anywhere;
  }
  .vts-callout.success { --vts-co-accent: #22c55e; --vts-co-bg: rgba(34, 197, 94, 0.08); }
  .vts-callout.warning { --vts-co-accent: #eab308; --vts-co-bg: rgba(234, 179, 8, 0.08); }
  .vts-callout.info    { --vts-co-accent: #3b82f6; --vts-co-bg: rgba(59, 130, 246, 0.08); }
  .vts-callout.question{ --vts-co-accent: #a855f7; --vts-co-bg: rgba(168, 85, 247, 0.08); }
  .vts-callout.caution { --vts-co-accent: #ef4444; --vts-co-bg: rgba(239, 68, 68, 0.08); }
  .vts-callout.success .vts-callout-icon, .vts-callout.success .vts-callout-body { color: #15803d; }
  .vts-callout.warning .vts-callout-icon, .vts-callout.warning .vts-callout-body { color: #a16207; }
  .vts-callout.info    .vts-callout-icon, .vts-callout.info    .vts-callout-body { color: #1d4ed8; }
  .vts-callout.question .vts-callout-icon, .vts-callout.question .vts-callout-body { color: #7e22ce; }
  .vts-callout.caution .vts-callout-icon, .vts-callout.caution .vts-callout-body { color: #b91c1c; }
  [data-vt-theme="dark"] .vts-callout.success { --vts-co-bg: rgba(34, 197, 94, 0.12); }
  [data-vt-theme="dark"] .vts-callout.success .vts-callout-icon,
  [data-vt-theme="dark"] .vts-callout.success .vts-callout-body { color: #4ade80; }
  [data-vt-theme="dark"] .vts-callout.warning { --vts-co-bg: rgba(234, 179, 8, 0.12); }
  [data-vt-theme="dark"] .vts-callout.warning .vts-callout-icon,
  [data-vt-theme="dark"] .vts-callout.warning .vts-callout-body { color: #facc15; }
  [data-vt-theme="dark"] .vts-callout.info { --vts-co-bg: rgba(59, 130, 246, 0.12); }
  [data-vt-theme="dark"] .vts-callout.info .vts-callout-icon,
  [data-vt-theme="dark"] .vts-callout.info .vts-callout-body { color: #60a5fa; }
  [data-vt-theme="dark"] .vts-callout.question { --vts-co-bg: rgba(168, 85, 247, 0.12); }
  [data-vt-theme="dark"] .vts-callout.question .vts-callout-icon,
  [data-vt-theme="dark"] .vts-callout.question .vts-callout-body { color: #c084fc; }
  [data-vt-theme="dark"] .vts-callout.caution { --vts-co-bg: rgba(239, 68, 68, 0.12); }
  [data-vt-theme="dark"] .vts-callout.caution .vts-callout-icon,
  [data-vt-theme="dark"] .vts-callout.caution .vts-callout-body { color: #f87171; }

  /* CodeBlock — CodeBlock.tsx */
  .vts-code {
    margin: 6px 0 10px;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
    text-align: left;
  }
  .vts-code-head {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: #2d2d2d;
    border-bottom: 1px solid #3e3e3e;
  }
  .vts-code-dot { width: 9px; height: 9px; border-radius: 999px; }
  .vts-code-dot.r { background: #ef4444; }
  .vts-code-dot.y { background: #eab308; }
  .vts-code-dot.g { background: #22c55e; }
  .vts-code-lang {
    margin-left: 10px;
    color: #9ca3af;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
  }
  .vts-code-body {
    margin: 0;
    padding: 12px 14px;
    background: #1e1e1e;
    color: #d4d4d4;
    font-family: 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11.5px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-x: auto;
  }

  /* Divider — Divider.tsx */
  .vts-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    margin: 14px 0;
  }
  .vts-divider-line {
    flex: 1;
    height: 1px;
    border-radius: 999px;
    background: var(--vt-accent-gradient, var(--accent, #0f766e));
    opacity: 0.3;
  }
  .vts-divider-gem {
    flex: none;
    width: 6px;
    height: 6px;
    transform: rotate(45deg);
    border-radius: 1px;
    background: var(--vt-accent, #3b82f6);
    opacity: 0.5;
  }

  /* StatBox — StatBox.tsx */
  .vts-stat {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 18px;
    margin: 4px 0 8px;
    text-align: center;
    border-radius: calc(var(--vt-radius, 12px) + 6px);
    background: var(--vt-surface-chip, color-mix(in srgb, var(--vt-slide-fg, #ffffff) 5%, transparent));
    border: 1px solid color-mix(in srgb, var(--vt-accent, #3b82f6) 15%, transparent);
    box-shadow: var(--vt-shadow, none);
    overflow: hidden;
  }
  .vts-stat-icon { font-size: 22px; line-height: 1; }
  .vts-stat-sep {
    width: 30px;
    height: 1px;
    background-image: repeating-linear-gradient(
      to right,
      color-mix(in srgb, var(--vt-accent, #3b82f6) 40%, transparent),
      color-mix(in srgb, var(--vt-accent, #3b82f6) 40%, transparent) 3px,
      transparent 3px,
      transparent 6px
    );
  }
  .vts-stat-value {
    font-size: 24px;
    font-weight: 700;
    line-height: 1.1;
    color: var(--vts-accent-text, var(--vt-accent, #3b82f6));
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
  .vts-stat-label {
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--vt-slide-muted, var(--muted, #6b7280));
    overflow-wrap: anywhere;
  }

  /* TimelineCard — TimelineCard.tsx */
  .vts-timeline {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 16px;
    margin: 10px 0 4px;
    border-radius: calc(var(--vt-radius, 12px) + 6px);
    background: var(--vt-surface-chip, color-mix(in srgb, var(--vt-slide-fg, #ffffff) 5%, transparent));
    border: 1px solid color-mix(in srgb, var(--vt-accent, #3b82f6) 15%, transparent);
    box-shadow: var(--vt-shadow, none);
    overflow: visible;
  }
  .vts-timeline::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 3px;
    height: 100%;
    border-radius: 4px 0 0 4px;
    background: linear-gradient(to bottom, var(--vt-accent, #3b82f6), color-mix(in srgb, var(--vt-accent, #3b82f6) 40%, transparent), transparent);
  }
  .vts-timeline-dot {
    position: absolute;
    top: -4px;
    left: 20px;
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: var(--vt-accent, #3b82f6);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--vt-accent, #3b82f6) 20%, transparent);
  }
  .vts-timeline-stem {
    position: absolute;
    top: -12px;
    left: 24px;
    width: 1px;
    height: 12px;
    background: color-mix(in srgb, var(--vt-accent, #3b82f6) 30%, transparent);
  }
  .vts-timeline:first-child .vts-timeline-stem { display: none; }
  .vts-timeline-year {
    width: fit-content;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    background: linear-gradient(135deg, color-mix(in srgb, var(--vt-accent, #3b82f6) 20%, transparent), color-mix(in srgb, var(--vt-accent, #3b82f6) 10%, transparent));
    color: var(--vts-accent-text, var(--vt-accent, #3b82f6));
  }
  .vts-timeline-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    font-family: var(--vt-heading-font, inherit);
    overflow-wrap: anywhere;
  }
  .vts-timeline-desc {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--vt-slide-muted, var(--muted, #6b7280));
    overflow-wrap: anywhere;
  }

  /* Table — TableComponent.tsx preview branch */
  .vts-table-wrap {
    width: 100%;
    margin: 4px 0 8px;
    overflow-x: auto;
    border: 1px solid color-mix(in srgb, var(--vt-slide-fg, #18181b) 20%, transparent);
    border-radius: 8px;
  }
  .vts-table {
    width: 100%;
    border-collapse: collapse;
  }
  .vts-table td {
    padding: 6px 8px;
    border: 1px solid color-mix(in srgb, var(--vt-slide-fg, #18181b) 20%, transparent);
    font-size: 12px;
    color: var(--vt-slide-fg, var(--fg, #18181b));
    overflow-wrap: anywhere;
  }
  .vts-table tr:first-child td { font-weight: 600; }

  /* TableOfContents — TableOfContents.tsx */
  .vts-toc {
    margin: 4px 0 8px;
    display: grid;
    gap: 6px;
    font-size: 13px;
  }
  .vts-toc-item { overflow-wrap: anywhere; }

  /* Image — ImageComponent.tsx (+ fallback for blocked sources) */
  .vts-image-box {
    margin: 6px 0;
    border-radius: 12px;
    overflow: hidden;
    line-height: 0;
  }
  .vts-image-box img {
    width: 100%;
    height: auto;
    object-fit: cover;
    display: block;
  }
  .vts-image-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 72px;
    border: 1px dashed color-mix(in srgb, var(--vt-slide-fg, #18181b) 30%, transparent);
    border-radius: 12px;
    color: var(--vt-slide-muted, var(--muted, #6b7280));
    font-size: 12px;
    line-height: 1.4;
    white-space: normal;
    text-align: center;
    padding: 8px;
  }

  /* Link + customButton */
  .vts-link {
    display: inline-block;
    margin: 2px 0 8px;
    font-size: 13px;
    color: var(--vts-accent-text, var(--vt-accent, #3b82f6));
    text-decoration: underline;
    text-underline-offset: 2px;
    overflow-wrap: anywhere;
  }
  .vts-button {
    display: inline-block;
    margin: 4px 0 8px;
    padding: 7px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    color: var(--vts-btn-fg, #ffffff);
    background: var(--vts-btn-bg, var(--vt-accent, #3b82f6));
    overflow-wrap: anywhere;
  }

  /* Layouts — column / multiColumn / resizable-column / imageAndText */
  .vts-col { display: flex; flex-direction: column; min-width: 0; }
  .vts-row {
    display: flex;
    flex-direction: row;
    gap: 12px;
    min-width: 0;
    align-items: stretch;
  }
  .vts-row > [data-vts-panel] { flex: 1 1 0%; min-width: 0; }
  .vts-media-row {
    display: flex;
    flex-direction: row;
    gap: 14px;
    align-items: center;
    min-width: 0;
  }
  .vts-media-row .vts-media-image { flex: 1 1 45%; min-width: 0; }
  .vts-media-row .vts-media-text { flex: 1 1 55%; min-width: 0; }
  @media (max-width: 480px) {
    .vts-row, .vts-media-row { flex-direction: column; }
    .vts-media-row .vts-media-image, .vts-media-row .vts-media-text { flex: 1 1 auto; width: 100%; }
  }
`;

export function ensureSlideRendererStyles(): void {
  if (!stylesInjected) {
    let element = document.getElementById(STYLE_ELEMENT_ID);

    if (!element) {
      element = document.createElement('style');
      element.id = STYLE_ELEMENT_ID;
      document.head.appendChild(element);
    }

    element.textContent = slideRendererStyles;
    stylesInjected = true;
  }

  ensureImageFallbackListener();
}

let fallbackListenerInstalled = false;

/**
 * Slide images may point at storage hosts that sandboxed widget iframes
 * cannot load (plan risk W1). Swap failed images for a graceful fallback
 * tile via one delegated listener — no inline handlers (CSP-safe).
 */
function ensureImageFallbackListener(): void {
  if (fallbackListenerInstalled || typeof document === 'undefined') return;

  document.addEventListener(
    'error',
    (event) => {
      const target = event.target as HTMLElement | null;

      if (!target || target.tagName !== 'IMG' || !target.closest('.vts-image-box')) {
        return;
      }

      const box = target.closest('.vts-image-box');
      const alt = target.getAttribute('alt') || 'Image unavailable';

      if (box) {
        box.outerHTML =
          `<div class="vts-image-fallback" role="img" aria-label="${escapeAttr(alt)}">` +
          '<span aria-hidden="true">🖼️</span><span>Image unavailable</span>' +
          '</div>';
      }
    },
    true
  );

  fallbackListenerInstalled = true;
}

/**
 * Renders a ContentItem tree (or string/array fragment) into themed HTML.
 */
export function renderSlideContent(content: unknown): string {
  ensureSlideRendererStyles();

  // One guarded accent for text uses (badges, stat values, year chips):
  // gold-on-white style themes would otherwise fail contrast at small sizes.
  const accentText = readableAccent();

  return (
    `<div class="vts-root" style="--vts-accent-text:${escapeAttr(accentText)}">` +
    `${renderItem(content)}` +
    `</div>`
  );
}

function renderItem(item: unknown): string {
  if (item == null || item === false) return '';
  if (typeof item === 'string') return renderTextBlock(item);
  if (typeof item === 'number') return renderTextBlock(String(item));
  if (Array.isArray(item)) return item.map(renderItem).join('');
  if (typeof item !== 'object') return '';

  const record = item as Record<string, unknown>;
  const type = typeof record.type === 'string' ? record.type : '';

  return dispatch(type, record);
}

function dispatch(type: string, item: Record<string, unknown>): string {
  switch (type) {
    case 'title':
      return renderHeading(item, 'vts-title', { accent: true, underline: true });
    case 'heading1':
      return renderHeading(item, 'vts-heading1', { accent: true, underline: true });
    case 'heading2':
      return renderHeading(item, 'vts-heading2');
    case 'heading3':
      return renderHeading(item, 'vts-heading3');
    case 'heading4':
      return renderHeading(item, 'vts-heading4');

    case 'paragraph':
    case 'text':
      return `<p class="vts-p"${idAttr(item)}${styleAttr(item)}>${renderInline(item.content)}</p>`;

    case 'numberedList': {
      const items = stringList(item.content);
      const rows = items
        .map((text, index) =>
          `<li><span class="vts-num-badge" aria-hidden="true">${index + 1}</span>` +
          `<span class="vts-li-text"${listIdAttr(item, index)}>${escapeHtml(text)}</span></li>`
        )
        .join('');
      return `<ol class="vts-list"${styleAttr(item)}>${rows}</ol>`;
    }

    case 'bulletedList':
    case 'bulletList': {
      const items = stringList(item.content);
      const rows = items
        .map((text, index) =>
          `<li><span class="vts-bullet-dot" aria-hidden="true"></span>` +
          `<span class="vts-li-text"${listIdAttr(item, index)}>${escapeHtml(text)}</span></li>`
        )
        .join('');
      return `<ul class="vts-list"${styleAttr(item)}>${rows}</ul>`;
    }

    case 'todoList': {
      const items = stringList(item.content);
      const rows = items
        .map((raw, index) => {
          const checked = /^\[[xX]\]\s/.test(raw);
          const label = raw.replace(/^\[[ xX]\]\s?/, '');
          return (
            `<li><span class="vts-todo-check${checked ? ' checked' : ''}" aria-hidden="true">` +
            (checked ? TODO_CHECK_SVG : '') +
            `</span><span class="vts-li-text vts-todo-label${checked ? ' checked' : ''}"${listIdAttr(item, index)}>` +
            `${escapeHtml(label)}</span></li>`
          );
        })
        .join('');
      return `<ul class="vts-list"${styleAttr(item)}>${rows}</ul>`;
    }

    case 'blockquote':
    case 'quote':
      return (
        `<blockquote class="vts-blockquote"${styleAttr(item)}>` +
        `<div class="vts-blockquote-inner"${idAttr(item)}>${renderInner(item.content)}</div>` +
        `</blockquote>`
      );

    case 'calloutBox': {
      const requested = readString(item.callOutType) || 'info';
      const variant = requested in CALL_OUT_ICONS ? requested : 'info';
      const icon = CALL_OUT_ICONS[variant];

      // Plan 10G F12: variant colors assume pale surfaces; vivid gradient
      // themes need per-surface readable foregrounds (icon 3:1, body 4.5:1).
      const surface = cssVar('--vt-slide-bg-solid') || '#ffffff';
      const iconColor = ensureReadable(CALL_OUT_ACCENTS[variant], surface, 3);
      const textColor = ensureReadable(CALL_OUT_TEXT[variant], surface, 4.5);

      return (
        `<div class="vts-callout ${variant}" role="note"${styleAttr(item)}>` +
        `<span class="vts-callout-icon" aria-hidden="true"` +
        ` style="${escapeAttr(`color:${iconColor}`)}">${icon}</span>` +
        `<div class="vts-callout-body"${idAttr(item)}` +
        ` style="${escapeAttr(`color:${textColor}`)}">${renderInner(item.content)}</div>` +
        `</div>`
      );
    }

    case 'code':
    case 'codeBlock': {
      const code = readString(item.code) || flattenContent(item.content);
      const language = readString(item.language) || 'javascript';
      return (
        `<div class="vts-code" role="figure"${styleAttr(item)}>` +
        `<div class="vts-code-head">` +
        `<span class="vts-code-dot r"></span><span class="vts-code-dot y"></span><span class="vts-code-dot g"></span>` +
        `<span class="vts-code-lang">${escapeHtml(language)}</span>` +
        `</div>` +
        `<pre class="vts-code-body">${escapeHtml(code)}</pre>` +
        `</div>`
      );
    }

    case 'divider':
      return (
        `<div class="vts-divider" role="separator"${styleAttr(item)}>` +
        `<span class="vts-divider-line"></span>` +
        `<span class="vts-divider-gem"></span>` +
        `<span class="vts-divider-line"></span>` +
        `</div>`
      );

    case 'statBox': {
      const value = readString(item.content) || '0';
      const icon = readString(item.icon) || '📈';
      const label = readString(item.label) || '';
      return (
        `<div class="vts-stat"${styleAttr(item)}>` +
        `<span class="vts-stat-icon" aria-hidden="true">${escapeHtml(icon)}</span>` +
        `<span class="vts-stat-sep" aria-hidden="true"></span>` +
        `<span class="vts-stat-value"${idAttr(item)}>${escapeHtml(value)}</span>` +
        (label ? `<span class="vts-stat-label"${fieldAttr(item, 'label')}>${escapeHtml(label)}</span>` : '') +
        `</div>`
      );
    }

    case 'timelineCard': {
      const title = readString(item.content) || readString(item.label) || 'Milestone';
      const year = readYear(item.icon);
      const description = readString(item.placeholder) || '';
      return (
        `<article class="vts-timeline"${styleAttr(item)}>` +
        `<span class="vts-timeline-dot" aria-hidden="true"></span>` +
        `<span class="vts-timeline-stem" aria-hidden="true"></span>` +
        (year ? `<span class="vts-timeline-year">${escapeHtml(year)}</span>` : '') +
        `<h4 class="vts-timeline-title"${idAttr(item)}>${escapeHtml(title)}</h4>` +
        (description ? `<p class="vts-timeline-desc"${fieldAttr(item, 'placeholder')}>${escapeHtml(description)}</p>` : '') +
        `</article>`
      );
    }

    case 'table':
    case 'comparisonTable':
    case 'pricingTable':
      return renderTable(item.content);

    case 'tableOfContents': {
      const items = stringList(item.content);
      const rows = items.map((text) => `<div class="vts-toc-item">${escapeHtml(text)}</div>`).join('');
      return `<nav class="vts-toc" aria-label="Table of contents"${styleAttr(item)}>${rows}</nav>`;
    }

    case 'image':
      return renderImage(item);

    case 'link': {
      const href = readString(item.link) || flattenContent(item.content);
      const label = readString(item.label) || href || 'Link';
      if (!href) return '';
      return (
        `<a class="vts-link" href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer"` +
        `${styleAttr(item)}>${escapeHtml(label)}</a>`
      );
    }

    case 'customButton': {
      const label = flattenContent(item.content) || readString(item.label) || 'Button';
      const href = readString(item.link);
      const bg = readString(item.bgColor);
      // White-on-light button colors fail WCAG; pick a readable foreground.
      const fg = bg ? ensureReadable('#ffffff', bg, 4.5) : '#ffffff';
      const style = bg
        ? ` style="--vts-btn-bg:${escapeAttr(bg)};--vts-btn-fg:${escapeAttr(fg)};"`
        : '';
      const tag = href ? 'a' : 'span';
      const linkAttrs = href
        ? ` href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer"`
        : '';
      return `<${tag} class="vts-button"${linkAttrs}${style}>${escapeHtml(label)}</${tag}>`;
    }

    case 'column':
      return wrapLayout('vts-col', item, arrayItems(item.content).map(renderItem).join(''));

    case 'multiColumn':
    case 'resizable-column': {
      const panels = arrayItems(item.content).map((child) =>
        `<div data-vts-panel>${renderItem(child)}</div>`
      ).join('');
      return `<div class="vts-row"${styleAttr(item)}>${panels}</div>`;
    }

    case 'imageAndText': {
      const children = arrayItems(item.content);
      const imagePart = children.find((child) => readType(child) === 'image');
      const rest = children.filter((child) => child !== imagePart);
      return (
        `<div class="vts-media-row"${styleAttr(item)}>` +
        `<div class="vts-media-image">${imagePart ? renderItem(imagePart) : ''}</div>` +
        `<div class="vts-media-text">${rest.map(renderItem).join('')}</div>` +
        `</div>`
      );
    }

    default:
      return renderUnknown(item);
  }
}

function renderHeading(item: Record<string, unknown>, className: string, options: { accent?: boolean; underline?: boolean } = {}): string {
  const useAccent = Boolean(options.accent);
  const declarations = styleDeclarations(item);

  if (useAccent) {
    declarations.push(`color:${readableAccent()}`);
  }

  const levelTag =
    className === 'vts-title' ? 'h1'
      : className === 'vts-heading1' ? 'h2'
        : className === 'vts-heading2' ? 'h3'
          : 'h4';
  const underline =
    options.underline
      ? `<span class="vts-accent-bar${className === 'vts-heading1' ? ' w48' : ''}" aria-hidden="true"></span>`
      : '';

  return (
    `<${levelTag} class="vts-h ${className}"${idAttr(item)}` +
    `${declarations.length > 0 ? ` style="${escapeAttr(declarations.join(';'))}"` : ''}>` +
    `${renderInline(item.content)}` +
    `</${levelTag}>` +
    underline
  );
}

function renderImage(item: Record<string, unknown>): string {
  const src = flattenContent(item.content);
  const alt = readString(item.alt) || 'image';

  if (!src) {
    return (
      `<div class="vts-image-fallback" role="img" aria-label="${escapeAttr(alt)}">` +
      '<span aria-hidden="true">🖼️</span>' +
      `<span>${escapeHtml(alt && alt !== 'image' ? alt : 'Image unavailable')}</span>` +
      '</div>'
    );
  }

  const safeSrc = /^(https?:\/\/|\/|data:image\/)/i.test(src.trim()) ? src.trim() : '';

  if (!safeSrc) {
    return renderImage({ ...item, content: '' });
  }

  return (
    `<figure class="vts-image-box"${styleAttr(item)}>` +
    `<img src="${escapeAttr(safeSrc)}" alt="${escapeAttr(alt)}" loading="lazy">` +
    '</figure>'
  );
}

function renderTable(content: unknown): string {
  const rows = Array.isArray(content) ? content : [];

  if (rows.length === 0) return '';

  const body = rows
    .map((row) => {
      const cells = Array.isArray(row) ? row : [row];
      return (
        `<tr>${cells.map((cell) => `<td>${escapeHtml(stringifyCell(cell))}</td>`).join('')}</tr>`
      );
    })
    .join('');

  return `<div class="vts-table-wrap" role="region" aria-label="Data table"><table class="vts-table"><tbody>${body}</tbody></table></div>`;
}

function renderUnknown(item: Record<string, unknown>): string {
  const content = item.content;

  if (Array.isArray(content)) {
    return `<div class="vts-col"${styleAttr(item)}>${content.map(renderItem).join('')}</div>`;
  }
  if (typeof content === 'string' && content.trim()) {
    return renderTextBlock(content);
  }
  return '';
}

function renderTextBlock(text: string): string {
  const trimmed = text.trim();

  if (!trimmed) return '';
  if (/^https?:\/\/\S+$/i.test(trimmed)) {
    return `<a class="vts-link" href="${escapeAttr(trimmed)}" target="_blank" rel="noopener noreferrer">${escapeHtml(trimmed)}</a>`;
  }
  return `<p class="vts-p">${escapeHtml(text)}</p>`;
}

function renderInline(content: unknown): string {
  if (content == null) return '';
  if (Array.isArray(content)) return content.map(renderInline).join('');
  if (typeof content === 'object') {
    // Nested rich children inside headings/paragraphs render inline.
    const record = content as Record<string, unknown>;
    if (typeof record.type === 'string' && record.type !== 'paragraph' && record.type !== 'text') {
      return renderItem(record);
    }
    return renderInline(record.content);
  }
  return escapeHtml(String(content));
}

function renderInner(content: unknown): string {
  if (content == null) return '';
  if (Array.isArray(content)) return content.map(renderItem).join('');
  if (typeof content === 'object') return renderItem(content);
  return `<p class="vts-p">${escapeHtml(String(content))}</p>`;
}

/* ------------------------------------------------------------------ */

const CALL_OUT_ICONS: Record<string, string> = {
  success: '✓',
  warning: '⚠',
  info: 'ℹ',
  question: '?',
  caution: '!',
};

/** Variant accent hues (icons/borders) from the dashboard CalloutBox. */
const CALL_OUT_ACCENTS: Record<string, string> = {
  success: '#22c55e',
  warning: '#eab308',
  info: '#3b82f6',
  question: '#a855f7',
  caution: '#ef4444',
};

/** Default variant text colors before per-surface readability adjustment. */
const CALL_OUT_TEXT: Record<string, string> = {
  success: '#15803d',
  warning: '#a16207',
  info: '#1d4ed8',
  question: '#7e22ce',
  caution: '#b91c1c',
};

const TODO_CHECK_SVG =
  '<svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">' +
  '<path d="M1 4L3.5 6.5L9 1" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function cssVar(name: string): string {
  if (typeof document === 'undefined') return '';

  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Accent color guarded for text use against the current slide surface.
 * Accent-tinted text (badges, year chips, links) is small text, so it must
 * clear WCAG 4.5:1 — measured against the opaque solid underlay so gradient
 * paints resolve correctly (plan 10G F12).
 */
export function readableAccent(): string {
  const accent = cssVar('--vt-accent') || '#3b82f6';

  try {
    return ensureReadable(
      accent,
      cssVar('--vt-slide-bg-solid') || cssVar('--vt-slide-bg') || '#ffffff',
      4.5
    );
  } catch {
    return accent;
  }
}

function wrapLayout(className: string, item: Record<string, unknown>, innerHtml: string): string {
  const width = typeof item.width === 'number' ? `${item.width}%` : '';
  const style = width ? ` style="width:${escapeAttr(width)};"` : '';

  return `<div class="${className}" data-vts-item${style}${styleAttr(item)}>${innerHtml}</div>`;
}

function styleDeclarations(item: Record<string, unknown>): string[] {
  const declarations: string[] = [];

  if (typeof item.fontSize === 'string') declarations.push(`font-size:${item.fontSize}`);
  if (typeof item.fontWeight === 'string') declarations.push(`font-weight:${item.fontWeight}`);
  if (typeof item.fontStyle === 'string') declarations.push(`font-style:${item.fontStyle}`);
  if (typeof item.textDecoration === 'string') declarations.push(`text-decoration:${item.textDecoration}`);
  if (typeof item.color === 'string') declarations.push(`color:${item.color}`);
  if (typeof item.textAlign === 'string') declarations.push(`text-align:${item.textAlign}`);

  return declarations;
}

function styleAttr(item: Record<string, unknown>): string {
  const declarations = styleDeclarations(item);

  return declarations.length > 0
    ? ` style="${escapeAttr(declarations.join(';'))}"`
    : '';
}

function arrayItems(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => (typeof entry === 'string' ? entry : stringifyCell(entry))).filter(Boolean);
}

function stringifyCell(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    if ('content' in record) return flattenContent(record.content) || readString(record.label) || '';
  }
  return String(value);
}

function flattenContent(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(flattenContent).filter(Boolean).join(' ');
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if ('content' in record) return flattenContent(record.content);
  }
  return '';
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function readYear(value: unknown): string | null {
  const text = readString(value);
  return text && /^\d{4}$/.test(text.trim()) ? text.trim() : null;
}

function readType(value: unknown): string {
  if (value && typeof value === 'object') {
    const type = (value as Record<string, unknown>).type;
    if (typeof type === 'string') return type;
  }
  return '';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

/* ------------------------------------------------------------------ */
/* Edit hooks (plan 10 F6): text-bearing elements carry stable ids so  */
/* the guided slide editor can pair DOM nodes with ContentItems.       */
/* ------------------------------------------------------------------ */

export function idAttr(item: Record<string, unknown>): string {
  const id = readString(item.id);
  return id ? ` data-vts-id="${escapeAttr(id)}"` : '';
}

function listIdAttr(item: Record<string, unknown>, index: number): string {
  const id = readString(item.id);
  return id ? ` data-vts-id="${escapeAttr(id)}" data-vts-index="${index}"` : '';
}

function fieldAttr(item: Record<string, unknown>, field: string): string {
  const id = readString(item.id);
  return id ? ` data-vts-id="${escapeAttr(id)}" data-vts-field="${field}"` : '';
}
