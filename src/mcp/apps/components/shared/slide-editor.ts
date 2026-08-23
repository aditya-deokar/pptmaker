/**
 * Guided slide editor (plan 10 F6).
 *
 * Inline editor overlay for deck_preview: one slide at a time, editable
 * textareas styled with the deck theme tokens for every text-bearing
 * component (title/headings/paragraphs/list items/quotes/callouts/stat
 * boxes/timeline milestones). Edits accumulate per slide; saving hands the
 * accumulated patches to the host widget which re-fetches the deck, applies
 * them onto the fresh tree, and performs the full-replacement
 * `presentation_update_slides` call. The editor then confirms with a
 * before→after diff strip and an Undo chip.
 */

export interface SlideEditPatch {
  slideId: string;
  slideTitle: string;
  /** ContentItem id inside the slide's content tree. */
  nodeId: string;
  kind: 'text' | 'field' | 'listItem';
  /** For kind 'field': which sibling field to write ('label' | 'placeholder'). */
  field?: string;
  /** For kind 'listItem': index within the list item's content array. */
  index?: number;
  /** Preserved `[x] `/`[ ] ` marker for todo list entries. */
  todoPrefix?: string;
  originalText: string;
  newText: string;
}

export interface SlideEditorOptions {
  container: HTMLElement;
  /** Raw slide objects (baseline snapshot at widget render time). */
  getSlides: () => unknown[];
  canUpdate: boolean;
  /**
   * Persists the given patches (host widget fetches fresh slides first).
   * Throws when the save fails; the editor surfaces the message.
   */
  save: (patches: SlideEditPatch[]) => Promise<void>;
  onDirtyChange?: (dirtyCount: number) => void;
  onClose?: (hadUnsavedEdits: boolean) => void;
}

export interface SlideEditorHandle {
  open(startIndex?: number): void;
  close(): void;
  isOpen(): boolean;
  hasUnsavedEdits(): boolean;
}

const editorStyles = `
  .vte-shell {
    display: grid;
    gap: 14px;
    border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
    border-radius: 16px;
    padding: 20px;
    background: color-mix(in srgb, var(--surface) 85%, transparent);
  }
  .vte-shell[hidden] { display: none; }
  .vte-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .vte-kicker {
    margin: 0 0 2px;
    color: var(--accent);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .vte-title {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
    overflow-wrap: anywhere;
  }
  .vte-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .vte-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 36px;
    border: 1px solid color-mix(in srgb, var(--line) 55%, transparent);
    border-radius: 99px;
    padding: 6px 14px;
    background: var(--surface);
    color: var(--fg);
    font: inherit;
    font-size: 13px;
    font-weight: 650;
    cursor: pointer;
  }
  .vte-btn:hover:not(:disabled) { box-shadow: 0 3px 10px rgba(0, 0, 0, 0.07); }
  .vte-btn.primary {
    border-color: transparent;
    background-color: #dc2626;
    background-image: var(--vt-brand-gradient);
    color: #ffffff;
  }
  .vte-btn.danger {
    border-color: color-mix(in srgb, #dc2626 45%, transparent);
    color: #b91c1c;
  }
  @media (prefers-color-scheme: dark) {
    .vte-btn.danger { color: #fca5a5; }
  }
  .vte-btn:disabled { cursor: default; opacity: 0.5; }
  .vte-btn.is-busy { cursor: wait; opacity: 0.7; }
  .vte-hint {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    overflow-wrap: anywhere;
  }
  .vte-fields {
    display: grid;
    gap: 12px;
    padding: 18px;
    min-height: 120px;
  }
  .vte-field-row {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .vte-field-label {
    color: var(--vt-slide-muted, var(--muted));
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .vte-field {
    width: 100%;
    resize: vertical;
    border: 1px solid color-mix(in srgb, var(--vt-slide-fg, var(--fg)) 16%, transparent);
    border-radius: calc(var(--vt-radius, 12px) - 4px);
    padding: 9px 12px;
    background: color-mix(in srgb, var(--vt-slide-bg, var(--surface)) 60%, transparent);
    color: var(--vt-slide-fg, var(--fg));
    font-family: var(--vt-body-font, inherit);
    font-size: 14px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .vte-field:focus-visible {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 30%, transparent);
  }
  .vte-field.t-heading,
  .vte-field.t-title {
    font-family: var(--vt-heading-font, inherit);
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .vte-field.t-title { font-size: 21px; }
  .vte-field.t-heading { font-size: 17px; }
  .vte-field.t-subheading { font-size: 15px; font-weight: 700; font-family: var(--vt-heading-font, inherit); }
  .vte-field.t-quote { font-style: italic; }
  .vte-field.t-value { font-weight: 800; font-size: 19px; }
  .vte-field.t-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .vte-empty {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    text-align: center;
  }
  .vte-foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .vte-chip {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    max-width: 100%;
    border: 1px solid color-mix(in srgb, #f97316 45%, transparent);
    border-radius: 99px;
    padding: 4px 12px;
    background: color-mix(in srgb, #f97316 12%, transparent);
    color: var(--fg);
    font-size: 12px;
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  @media (prefers-color-scheme: dark) {
    .vte-chip { color: #fdba74; }
  }
  .vte-chip.saved {
    border-color: color-mix(in srgb, #16a34a 45%, transparent);
    background: color-mix(in srgb, #16a34a 12%, transparent);
  }
  .vte-chip[hidden] { display: none; }
  .vte-foot-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .vte-note {
    min-height: 18px;
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    overflow-wrap: anywhere;
  }
  .vte-diff {
    display: grid;
    gap: 8px;
    border: 1px solid color-mix(in srgb, #16a34a 40%, transparent);
    border-radius: 12px;
    padding: 12px 14px;
    background: color-mix(in srgb, #16a34a 7%, transparent);
  }
  .vte-diff[hidden] { display: none; }
  .vte-diff-title {
    margin: 0;
    color: #15803d;
    font-size: 13px;
    font-weight: 750;
  }
  @media (prefers-color-scheme: dark) {
    .vte-diff-title { color: #4ade80; }
  }
  .vte-diff-list {
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
    list-style: none;
  }
  .vte-diff-item {
    display: block;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .vte-diff-item .old { text-decoration: line-through; opacity: 0.75; }
  .vte-diff-item .new { color: var(--fg); font-weight: 650; }
  .vte-diff-actions { display: flex; }
`;

let stylesInjected = false;

function ensureEditorStyles(): void {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = editorStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

/* ------------------------------------------------------------------ */
/* Tree walking                                                        */
/* ------------------------------------------------------------------ */

type FieldKindClass =
  | 't-title'
  | 't-heading'
  | 't-subheading'
  | 't-body'
  | 't-list'
  | 't-quote'
  | 't-callout'
  | 't-value'
  | 't-label';

interface EditorTarget {
  key: string;
  nodeId: string;
  kind: 'text' | 'field' | 'listItem';
  field?: string;
  index?: number;
  label: string;
  styleClass: FieldKindClass;
  originalText: string;
  todoPrefix?: string;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function readType(value: unknown): string {
  if (value && typeof value === 'object') {
    const type = (value as Record<string, unknown>).type;
    return typeof type === 'string' ? type : '';
  }
  return '';
}

/**
 * Depth-first collection of text-bearing targets, mirroring the order the
 * renderer emits them so labels stay meaningful.
 */
export function collectTargets(content: unknown): EditorTarget[] {
  const targets: Omit<EditorTarget, 'key'>[] = [];

  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (!node || typeof node !== 'object') return;

    const record = node as Record<string, unknown>;
    const id = readString(record.id);

    if (!id) {
      // Layout containers may lack ids but can still hold children.
      if (Array.isArray(record.content)) record.content.forEach(visit);
      return;
    }

    const type = readType(record);
    const text = record.content;

    switch (type) {
      case 'title':
      case 'heading1':
        if (typeof text === 'string') {
          targets.push({
            nodeId: id,
            kind: 'text',
            label: type === 'title' ? 'Title' : 'Heading 1',
            styleClass: type === 'title' ? 't-title' : 't-heading',
            originalText: text,
          });
        }
        break;

      case 'heading2':
      case 'heading3':
      case 'heading4':
        if (typeof text === 'string') {
          targets.push({
            nodeId: id,
            kind: 'text',
            label: `Heading ${type.slice(-1)}`,
            styleClass: type === 'heading2' ? 't-subheading' : 't-body',
            originalText: text,
          });
        }
        break;

      case 'paragraph':
      case 'text':
        if (typeof text === 'string') {
          targets.push({
            nodeId: id,
            kind: 'text',
            label: 'Paragraph',
            styleClass: 't-body',
            originalText: text,
          });
        }
        break;

      case 'bulletedList':
      case 'bulletList':
      case 'numberedList':
      case 'todoList':
        if (Array.isArray(text)) {
          text.forEach((entry, index) => {
            if (typeof entry !== 'string') return;
            const isTodo = type === 'todoList';
            const match = isTodo ? /^(\[[ xX]\]\s?)/.exec(entry) : null;
            targets.push({
              nodeId: id,
              kind: 'listItem',
              index,
              label: `${listLabel(type)} · item ${index + 1}`,
              styleClass: 't-body',
              originalText: match ? entry.slice(match[1].length) : entry,
              ...(match ? { todoPrefix: match[1] } : {}),
            });
          });
        }
        break;

      case 'blockquote':
      case 'quote':
        if (typeof text === 'string') {
          targets.push({
            nodeId: id,
            kind: 'text',
            label: 'Quote',
            styleClass: 't-quote',
            originalText: text,
          });
        } else if (Array.isArray(text)) {
          text.forEach(visit);
        }
        break;

      case 'calloutBox':
        if (typeof text === 'string') {
          targets.push({
            nodeId: id,
            kind: 'text',
            label: 'Callout text',
            styleClass: 't-body',
            originalText: text,
          });
        } else if (Array.isArray(text)) {
          text.forEach(visit);
        }
        break;

      case 'statBox':
        if (typeof text === 'string') {
          targets.push({
            nodeId: id,
            kind: 'text',
            label: 'Stat value',
            styleClass: 't-value',
            originalText: text,
          });
        }
        if (typeof record.label === 'string' && record.label.trim()) {
          targets.push({
            nodeId: id,
            kind: 'field',
            field: 'label',
            label: 'Stat label',
            styleClass: 't-label',
            originalText: record.label,
          });
        }
        break;

      case 'timelineCard':
        if (typeof text === 'string') {
          targets.push({
            nodeId: id,
            kind: 'text',
            label: 'Milestone title',
            styleClass: 't-subheading',
            originalText: text,
          });
        }
        if (typeof record.placeholder === 'string' && record.placeholder.trim()) {
          targets.push({
            nodeId: id,
            kind: 'field',
            field: 'placeholder',
            label: 'Milestone description',
            styleClass: 't-body',
            originalText: record.placeholder,
          });
        }
        break;

      default:
        break;
    }

    if (
      type === 'column'
      || type === 'multiColumn'
      || type === 'resizable-column'
      || type === 'imageAndText'
    ) {
      if (Array.isArray(record.content)) record.content.forEach(visit);
    }
  };

  visit(content);

  return targets.map((target) => ({
    ...target,
    key: targetKey(target.nodeId, target.kind, target.field, target.index),
  }));
}

function listLabel(type: string): string {
  if (type === 'numberedList') return 'Numbered list';
  if (type === 'todoList') return 'To-do list';
  return 'Bullet list';
}

function targetKey(
  nodeId: string,
  kind: EditorTarget['kind'],
  field: string | undefined,
  index: number | undefined
): string {
  return `${kind}:${field ?? ''}:${index ?? ''}:${nodeId}`;
}

/* ------------------------------------------------------------------ */
/* Patch application                                                   */
/* ------------------------------------------------------------------ */

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function findNodeById(node: unknown, nodeId: string): Record<string, unknown> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = findNodeById(child, nodeId);
      if (hit) return hit;
    }
    return null;
  }

  if (!node || typeof node !== 'object') return null;

  const record = node as Record<string, unknown>;

  if (readString(record.id) === nodeId) return record;

  for (const value of Object.values(record)) {
    if (value && typeof value === 'object') {
      const hit = findNodeById(value, nodeId);
      if (hit) return hit;
    }
  }

  return null;
}

/**
 * Applies patches onto a deep clone of the given raw slides (used against a
 * freshly fetched deck right before the full-replacement save).
 */
export function applyPatchesToSlides(
  slides: unknown[],
  patches: SlideEditPatch[]
): unknown[] {
  const next = deepClone(slides);

  for (const patch of patches) {
    const slide = next.find((candidate) => {
      const record = candidate && typeof candidate === 'object'
        ? candidate as Record<string, unknown>
        : null;
      return record ? readString(record.id) === patch.slideId : false;
    });

    if (!slide) continue;

    const node = findNodeById((slide as Record<string, unknown>).content, patch.nodeId);

    if (!node) continue;

    if (patch.kind === 'listItem' && typeof patch.index === 'number') {
      if (Array.isArray(node.content)) {
        node.content[patch.index] = (patch.todoPrefix ?? '') + patch.newText;
      }
      continue;
    }

    if (patch.kind === 'field' && patch.field) {
      node[patch.field] = patch.newText;
      continue;
    }

    node.content = patch.newText;
  }

  return next;
}

/* ------------------------------------------------------------------ */
/* Editor controller                                                   */
/* ------------------------------------------------------------------ */

interface PendingEdit {
  target: Omit<EditorTarget, 'originalText'> & { originalText: string };
  newText: string;
}

export function createSlideEditor(options: SlideEditorOptions): SlideEditorHandle {
  ensureEditorStyles();
  injectMarkup(options.container);

  let isOpen = false;
  let currentIndex = 0;
  let lastCommitted: SlideEditPatch[] | null = null;
  let discardArmed = false;

  /** slideId → (targetKey → pending edit) */
  const pendingBySlide = new Map<string, Map<string, PendingEdit>>();

  const root = options.container.querySelector('.vte-shell') as HTMLElement;

  const els = {
    pos: root.querySelector('#vte-pos') as HTMLElement,
    name: root.querySelector('#vte-name') as HTMLElement,
    prev: root.querySelector('#vte-prev') as HTMLButtonElement,
    next: root.querySelector('#vte-next') as HTMLButtonElement,
    close: root.querySelector('#vte-close') as HTMLButtonElement,
    cancel: root.querySelector('#vte-cancel') as HTMLButtonElement,
    save: root.querySelector('#vte-save') as HTMLButtonElement,
    undo: root.querySelector('#vte-undo') as HTMLButtonElement,
    fields: root.querySelector('#vte-fields') as HTMLElement,
    chip: root.querySelector('#vte-chip') as HTMLElement,
    note: root.querySelector('#vte-note') as HTMLElement,
    diff: root.querySelector('.vte-diff') as HTMLElement,
    diffTitle: root.querySelector('#vte-diff-title') as HTMLElement,
    diffList: root.querySelector('#vte-diff-list') as HTMLElement,
  };

  els.prev.addEventListener('click', () => step(-1));
  els.next.addEventListener('click', () => step(1));

  els.close.addEventListener('click', () => requestClose());
  els.cancel.addEventListener('click', () => requestClose());

  els.save.addEventListener('click', () => void commit());
  els.undo.addEventListener('click', () => void revertLastCommit());

  function injectMarkup(container: HTMLElement): void {
    container.innerHTML = `
      <section class="vte-shell" aria-label="Guided slide editor" hidden>
        <header class="vte-head">
          <div>
            <p class="vte-kicker">Guided edit</p>
            <h2 class="vte-title">Slide <span id="vte-pos">–</span></h2>
            <p class="vte-hint" id="vte-name"></p>
          </div>
          <div class="vte-nav">
            <button class="vte-btn" id="vte-prev" type="button">‹ Previous</button>
            <button class="vte-btn" id="vte-next" type="button">Next ›</button>
            <button class="vte-btn danger" id="vte-close" type="button" aria-label="Close editor and discard changes">Close</button>
          </div>
        </header>
        <section class="vte-diff" aria-label="Last saved changes" hidden>
          <p class="vte-diff-title" id="vte-diff-title"></p>
          <ul class="vte-diff-list" id="vte-diff-list"></ul>
          <div class="vte-diff-actions">
            <button class="vte-btn" id="vte-undo" type="button">Undo changes</button>
          </div>
        </section>
        <div class="vte-fields vt-slide-surface" id="vte-fields" aria-label="Slide text"></div>
        <footer class="vte-foot">
          <span class="vte-chip" id="vte-chip" hidden></span>
          <div class="vte-foot-actions">
            <button class="vte-btn" id="vte-cancel" type="button">Cancel</button>
            <button class="vte-btn primary" id="vte-save" type="button" disabled>Save changes</button>
          </div>
        </footer>
        <p class="vte-note" id="vte-note" aria-live="polite"></p>
      </section>
    `;
  }

  function handle(): SlideEditorHandle {
    return {
      open: (startIndex = 0) => {
        isOpen = true;
        discardArmed = false;
        currentIndex = clampIndex(startIndex);
        root.removeAttribute('hidden');
        els.note.textContent = '';
        hideDiff();
        renderCurrentSlide();
      },
      close: () => forceClose(),
      isOpen: () => isOpen,
      hasUnsavedEdits: () => totalPending() > 0,
    };
  }

  function clampIndex(index: number): number {
    const count = options.getSlides().length;
    if (count === 0) return 0;
    return Math.max(0, Math.min(count - 1, index));
  }

  function step(direction: -1 | 1): void {
    renderCurrentSlide(clampIndex(currentIndex + direction));
  }

  function currentSlideRecord(): Record<string, unknown> | null {
    const slides = options.getSlides();
    const slide = slides[currentIndex];
    return slide && typeof slide === 'object' ? slide as Record<string, unknown> : null;
  }

  function slideId(slide: Record<string, unknown>): string {
    return readString(slide.id) ?? `slide-${currentIndex}`;
  }

  function slideTitle(slide: Record<string, unknown>): string {
    return readString(slide.title)
      ?? readString(slide.slideName)
      ?? readString(slide.slide_name)
      ?? `Slide ${currentIndex + 1}`;
  }

  function pendingFor(slideIdValue: string): Map<string, PendingEdit> {
    let map = pendingBySlide.get(slideIdValue);

    if (!map) {
      map = new Map();
      pendingBySlide.set(slideIdValue, map);
    }

    return map;
  }

  function totalPending(): number {
    let total = 0;
    for (const map of pendingBySlide.values()) total += map.size;
    return total;
  }

  function renderCurrentSlide(index: number = currentIndex): void {
    currentIndex = index;

    const slides = options.getSlides();

    els.pos.textContent = slides.length > 0
      ? `${currentIndex + 1} of ${slides.length}`
      : '0 of 0';

    const slide = currentSlideRecord();
    els.name.textContent = slide ? slideTitle(slide) : '';

    els.prev.disabled = !isOpen || currentIndex <= 0;
    els.next.disabled = !isOpen || currentIndex >= slides.length - 1;

    renderFields(slide);
    updateFooterState();
  }

  function renderFields(slide: Record<string, unknown> | null): void {
    els.fields.textContent = '';

    if (!options.canUpdate) {
      appendEmpty('Editing is unavailable for this deck.');
      return;
    }

    if (!slide) {
      appendEmpty('No slide selected.');
      return;
    }

    const slideIdValue = slideId(slide);
    const pending = pendingFor(slideIdValue);
    const targets = collectTargets(slide.content);

    if (targets.length === 0) {
      appendEmpty('This slide has no editable text blocks.');
      return;
    }

    targets.forEach((target, position) => {
      const row = document.createElement('div');
      row.className = 'vte-field-row';

      const inputId = `vte-f-${position}`;

      const label = document.createElement('label');
      label.className = 'vte-field-label';
      label.setAttribute('for', inputId);
      label.textContent = target.label;
      row.appendChild(label);

      const field = document.createElement('textarea');
      field.className = `vte-field ${target.styleClass}`;
      field.id = inputId;
      field.rows = 2;
      field.spellcheck = false;
      field.dataset.vteKey = target.key;
      field.value = pending.get(target.key)?.newText ?? target.originalText;
      field.setAttribute('aria-label', `${target.label} — ${els.name.textContent || 'current slide'}`);
      field.addEventListener('input', () => {
        recordEdit(slideIdValue, target, field.value);
        autoGrow(field);
      });

      row.appendChild(field);
      els.fields.appendChild(row);
      autoGrow(field);
    });
  }

  function appendEmpty(message: string): void {
    const empty = document.createElement('p');
    empty.className = 'vte-empty';
    empty.textContent = message;
    els.fields.appendChild(empty);
  }

  function recordEdit(
    slideIdValue: string,
    target: EditorTarget,
    value: string
  ): void {
    const pending = pendingFor(slideIdValue);

    if (value === target.originalText) {
      pending.delete(target.key);
    } else {
      pending.set(target.key, { target, newText: value });
    }

    updateFooterState();
  }

  function autoGrow(field: HTMLTextAreaElement): void {
    field.style.height = 'auto';
    field.style.height = `${Math.min(320, field.scrollHeight)}px`;
  }

  function updateFooterState(): void {
    const dirty = totalPending();

    els.chip.hidden = dirty === 0;
    els.chip.classList.toggle('saved', false);

    if (dirty > 0) {
      els.chip.textContent = `${dirty} unsaved ${dirty === 1 ? 'edit' : 'edits'}`;
    }

    els.save.disabled = dirty === 0;
    options.onDirtyChange?.(dirty);
  }

  async function commit(): Promise<void> {
    const patches = collectPatches();

    if (patches.length === 0) return;

    setBusy(els.save, true);
    els.note.textContent = 'Saving…';

    try {
      await options.save(patches);

      lastCommitted = patches;
      pendingBySlide.clear();

      showDiff(patches);
      updateFooterState();
      markSavedChip();
      els.note.textContent = 'Changes saved to Verto.';
    } catch (error) {
      els.note.textContent = getErrorMessage(error);
    } finally {
      setBusy(els.save, false);
    }
  }

  async function revertLastCommit(): Promise<void> {
    if (!lastCommitted || lastCommitted.length === 0) return;

    const reversed = lastCommitted.map((patch) => ({
      ...patch,
      originalText: patch.newText,
      newText: patch.originalText,
    }));

    setBusy(els.undo, true);
    els.note.textContent = 'Reverting…';

    try {
      await options.save(reversed);

      lastCommitted = null;
      hideDiff();
      renderCurrentSlide();
      els.note.textContent = 'Changes reverted.';
    } catch (error) {
      els.note.textContent = getErrorMessage(error);
    } finally {
      setBusy(els.undo, false);
    }
  }

  function collectPatches(): SlideEditPatch[] {
    const patches: SlideEditPatch[] = [];
    const slides = options.getSlides();

    for (const [idValue, map] of pendingBySlide.entries()) {
      const slide = slides.find((candidate): candidate is Record<string, unknown> => {
        if (!candidate || typeof candidate !== 'object') return false;

        const record = candidate as Record<string, unknown>;
        return (readString(record.id) ?? `slide-${slides.indexOf(candidate)}`) === idValue;
      });

      if (!slide) continue;

      for (const pending of map.values()) {
        const target = pending.target;

        patches.push({
          slideId: idValue,
          slideTitle: slideTitle(slide),
          nodeId: target.nodeId,
          kind: target.kind,
          ...(target.field ? { field: target.field } : {}),
          ...(typeof target.index === 'number' ? { index: target.index } : {}),
          ...(target.todoPrefix ? { todoPrefix: target.todoPrefix } : {}),
          originalText: target.originalText,
          newText: pending.newText,
        });
      }
    }

    return patches;
  }

  function showDiff(patches: SlideEditPatch[]): void {
    els.diffTitle.textContent = `Updated ${patches.length} text `
      + `${patches.length === 1 ? 'block' : 'blocks'} on Verto.`;

    els.diffList.textContent = '';

    for (const patch of patches.slice(0, 8)) {
      const item = document.createElement('li');
      item.className = 'vte-diff-item';
      item.append(
        createDiffSpan(patch.originalText, 'old'),
        document.createTextNode(' → '),
        createDiffSpan(patch.newText, 'new')
      );
      els.diffList.appendChild(item);
    }

    const remaining = patches.length - Math.min(8, patches.length);
    if (remaining > 0) {
      const more = document.createElement('li');
      more.className = 'vte-diff-item';
      more.textContent = `…and ${remaining} more`;
      els.diffList.appendChild(more);
    }

    els.diff.removeAttribute('hidden');
  }

  function createDiffSpan(value: string, className: string): HTMLElement {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = truncate(value, 64);
    return span;
  }

  function hideDiff(): void {
    els.diff.setAttribute('hidden', 'true');
    els.diffList.textContent = '';
  }

  function markSavedChip(): void {
    els.chip.hidden = false;
    els.chip.classList.add('saved');
    els.chip.textContent = 'Saved';
  }

  function requestClose(): void {
    const dirty = totalPending();

    if (dirty > 0 && !discardArmed) {
      discardArmed = true;
      els.note.textContent = `Discard ${dirty} unsaved `
        + `${dirty === 1 ? 'edit' : 'edits'}? Press Close again to confirm.`;
      window.setTimeout(() => {
        discardArmed = false;
      }, 5000);
      return;
    }

    forceClose();
  }

  function forceClose(): void {
    const hadUnsaved = totalPending() > 0;
    isOpen = false;
    pendingBySlide.clear();
    lastCommitted = null;
    root.setAttribute('hidden', 'true');
    options.onClose?.(hadUnsaved);
  }

  function setBusy(button: HTMLButtonElement, busy: boolean): void {
    button.classList.toggle('is-busy', busy);
    button.disabled = busy || (button === els.save && totalPending() === 0 && !busy);
  }

  function getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object') {
      const record = error as Record<string, unknown>;
      if (typeof record.message === 'string') return record.message;
    }
    return 'Verto could not save these edits. Try again in a moment.';
  }

  return handle();
}

function truncate(value: string, maxLength: number): string {
  const compact = value.replace(/\s+/g, ' ').trim();

  if (compact.length <= maxLength) return compact;

  return `${compact.slice(0, maxLength - 1).trim()}…`;
}
