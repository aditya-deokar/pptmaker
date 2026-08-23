/**
 * Publish Card widget (plan 10 F5).
 *
 * Dedicated celebration UI bound to the `presentation_publish` result:
 * confetti moment (reduced-motion aware), big share URL with copy, an
 * in-widget QR code pointing at the share page (`openLink` deep link), and
 * a guarded unpublish action. Publish/unpublish taken here are pushed back
 * to the model via `updateModelContext` (plan F8).
 */

import {
  byId,
  callMcpTool,
  getRecord,
  getString,
  injectStyles,
  mountWidget,
  pushModelContext,
} from './shared/runtime';
import { extractWidgetLinks, openVertoLink, renderDeepLinkMenu } from './shared/verto-skin';
import { drawQrToCanvas } from './shared/qrcode';

const CONFETTI_COLORS = ['#ef4444', '#f97316', '#F55C7A', '#F6BC66', '#3b82f6', '#22c55e'];

const publishCardStyles = `
  .pc-shell {
    position: relative;
    display: grid;
    gap: 16px;
    min-height: 320px;
    padding: 24px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    letter-spacing: -0.01em;
  }
  .pc-header {
    display: grid;
    gap: 6px;
    padding-right: 48px;
  }
  .pc-kicker {
    color: var(--accent);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.05em;
  }
  .pc-title {
    margin: 0;
    max-width: 44rem;
    font-size: 26px;
    font-weight: 800;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }
  .pc-hero {
    position: relative;
    display: grid;
    justify-items: start;
    gap: 10px;
    border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
    border-radius: 18px;
    padding: 26px 24px;
    background:
      radial-gradient(circle at top right, color-mix(in srgb, #f97316 12%, transparent), transparent 42%),
      radial-gradient(circle at bottom left, color-mix(in srgb, #ef4444 10%, transparent), transparent 46%),
      color-mix(in srgb, var(--surface) 80%, transparent);
    overflow: hidden;
  }
  .pc-hero::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--vt-brand-gradient);
  }
  .pc-confetti {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .pc-piece {
    position: absolute;
    top: -16px;
    left: var(--pc-left);
    width: 8px;
    height: 14px;
    border-radius: 2px;
    background: var(--pc-color);
    opacity: 0;
    transform: rotate(var(--pc-rot));
    animation: pc-fall 2600ms ease-in forwards;
    animation-delay: var(--pc-delay);
  }
  @keyframes pc-fall {
    0% { opacity: 1; transform: translateY(-8px) rotate(0deg); }
    100% { opacity: 0; transform: translateY(300px) rotate(520deg); }
  }
  .pc-status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 26px;
    border: 1px solid color-mix(in srgb, var(--line) 40%, transparent);
    border-radius: 99px;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 700;
    color: var(--fg);
    background: color-mix(in srgb, var(--surface) 70%, transparent);
  }
  .pc-status .dot {
    width: 8px;
    height: 8px;
    border-radius: 99px;
    background: var(--muted);
  }
  .pc-status.live {
    border-color: color-mix(in srgb, #15803d 45%, transparent);
    color: #15803d;
  }
  .pc-status.live .dot { background: #15803d; }
  @media (prefers-color-scheme: dark) {
    .pc-status.live { border-color: color-mix(in srgb, #4ade80 45%, transparent); color: #4ade80; }
    .pc-status.live .dot { background: #4ade80; }
  }
  .pc-hero-title {
    margin: 2px 0 0;
    max-width: 34rem;
    font-size: 30px;
    font-weight: 800;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }
  .pc-hero-sub {
    margin: 0;
    max-width: 40rem;
    color: var(--muted);
    font-size: 15px;
    overflow-wrap: anywhere;
  }
  .pc-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 16px;
    align-items: stretch;
  }
  .pc-panel {
    border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
    border-radius: 16px;
    padding: 20px;
    background: color-mix(in srgb, var(--surface) 75%, transparent);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
  }
  .pc-panel[hidden] { display: none; }
  .pc-share-panel {
    display: grid;
    align-content: start;
    gap: 12px;
    min-width: 0;
  }
  .pc-panel-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
  }
  .pc-share-url {
    display: block;
    max-width: 100%;
    border: 1px solid color-mix(in srgb, var(--line) 50%, transparent);
    border-radius: 10px;
    padding: 11px 13px;
    background: color-mix(in srgb, var(--line) 22%, transparent);
    color: var(--fg);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    overflow-wrap: anywhere;
  }
  a.pc-share-url:hover { border-color: color-mix(in srgb, var(--accent) 50%, transparent); }
  .pc-share-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .pc-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    border: 1px solid color-mix(in srgb, var(--line) 50%, transparent);
    border-radius: 99px;
    padding: 8px 16px;
    background: var(--surface);
    color: var(--fg);
    font: inherit;
    font-size: 14px;
    font-weight: 650;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .pc-button:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }
  .pc-button.primary {
    border-color: transparent;
    background-color: #dc2626;
    background-image: var(--vt-brand-gradient);
    color: #ffffff;
  }
  .pc-button.danger {
    border-color: color-mix(in srgb, #dc2626 45%, transparent);
    background: color-mix(in srgb, #dc2626 7%, transparent);
    color: #b91c1c;
  }
  @media (prefers-color-scheme: dark) {
    .pc-button.danger { color: #fca5a5; }
  }
  .pc-button:disabled {
    cursor: default;
    opacity: 0.5;
    transform: none;
    box-shadow: none;
  }
  .pc-button.is-busy { cursor: wait; opacity: 0.7; }
  .pc-note {
    min-height: 20px;
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    overflow-wrap: anywhere;
  }
  .pc-qr-panel {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 10px;
    min-width: 168px;
  }
  .pc-qr-frame {
    border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
    border-radius: 12px;
    padding: 8px;
    background: #ffffff;
  }
  .pc-qr-frame canvas { display: block; }
  .pc-qr-caption {
    margin: 0;
    color: var(--muted);
    font-size: 12px;
    font-weight: 650;
    text-align: center;
  }
  .pc-manage {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
  .pc-manage .pc-note { flex: 1 1 220px; }
  @media (max-width: 560px) {
    .pc-shell { padding: 16px; }
    .pc-body { grid-template-columns: 1fr; }
    .pc-qr-panel { justify-items: start; }
    .pc-hero-title { font-size: 25px; }
  }
`;

let stylesInjected = false;

type PublishState = {
  presentationId: string;
  presentationTitle: string;
  isPublished: boolean;
  shareUrl: string;
  canCopyShareLink: boolean;
  canOpenShareLink: boolean;
  canUnpublish: boolean;
  /** Set after an in-widget unpublish so republish re-celebrates. */
  celebratedInSession: boolean;
};

function ensurePublishStyles(): void {
  if (stylesInjected) return;
  injectStyles(publishCardStyles);
  stylesInjected = true;
}

function ensureMarkup(): void {
  if (document.getElementById('verto-publish-card-widget')) {
    return;
  }

  document.body.innerHTML = `
    <main class="pc-shell" id="verto-publish-card-widget">
      <div class="vt-links" id="publish-links"></div>
      <header class="pc-header" aria-labelledby="publish-title">
        <div class="pc-kicker">Verto AI publish</div>
        <h1 class="pc-title" id="publish-title">Publish</h1>
      </header>
      <section class="pc-hero" aria-label="Publication status">
        <div class="pc-confetti" id="confetti" aria-hidden="true"></div>
        <span class="pc-status" id="status-badge"><span class="dot" aria-hidden="true"></span><span id="status-text">Checking status</span></span>
        <h2 class="pc-hero-title" id="hero-title">Getting your deck ready</h2>
        <p class="pc-hero-sub" id="hero-sub">Verto is preparing the publication details.</p>
      </section>
      <section class="pc-body" aria-label="Share options">
        <article class="pc-panel pc-share-panel">
          <p class="pc-panel-title">Public share link</p>
          <a class="pc-share-url" id="share-url">Waiting for the share link.</a>
          <div class="pc-share-actions">
            <button class="pc-button primary" id="copy-action" type="button">Copy link</button>
            <button class="pc-button" id="open-action" type="button">Open share page</button>
          </div>
          <p class="pc-note" id="share-note">Anyone with this link can view the deck.</p>
        </article>
        <aside class="pc-panel pc-qr-panel" aria-label="QR code for the share link">
          <span class="pc-qr-frame"><canvas id="qr-canvas" width="132" height="132" aria-label="QR code linking to the share page" role="img"></canvas></span>
          <p class="pc-qr-caption">Scan to open the deck</p>
        </aside>
      </section>
      <section class="pc-manage" aria-label="Manage publication">
        <button class="pc-button danger" id="unpublish-action" type="button">Unpublish deck</button>
        <p class="pc-note" id="action-note">Unpublishing removes public access immediately.</p>
      </section>
    </main>
  `;
}

function toPublishState(payload: Record<string, unknown>): PublishState {
  const widget = getRecord(payload.widget);

  let presentation: Record<string, unknown>;
  let actions: Record<string, unknown>;

  if (widget.widget === 'publish_card') {
    presentation = getRecord(widget.presentation);
    actions = getRecord(widget.actions);
  } else {
    const data = getRecord(payload.data || payload);
    presentation = getRecord(data.presentation || data);
    actions = {};
  }

  const shareUrl = getString(
    presentation.shareUrl || presentation.share_url
  );

  return {
    presentationId: getString(presentation.id),
    presentationTitle: getString(presentation.title, 'Untitled presentation'),
    isPublished: Boolean(presentation.isPublished ?? presentation.is_published ?? true),
    shareUrl,
    canCopyShareLink: actions.canCopyShareLink !== false && Boolean(shareUrl),
    canOpenShareLink: actions.canOpenShareLink !== false && Boolean(shareUrl),
    canUnpublish: actions.canUnpublish === true,
    celebratedInSession: false,
  };
}

let state: PublishState | null = null;

function renderPublishPayload(payload: Record<string, unknown>, options: { celebrate?: boolean } = {}): void {
  ensurePublishStyles();
  ensureMarkup();

  const isFirstRender = !state;
  const nextState = toPublishState(payload);

  if (state) {
    nextState.celebratedInSession = state.celebratedInSession || nextState.isPublished;
  }

  const celebrate =
    nextState.isPublished
    && (!isFirstRender || !nextState.celebratedInSession || options.celebrate === true);

  state = nextState;

  renderDeepLinkMenu(byId('publish-links'), extractWidgetLinks(payload));
  renderHero();
  renderSharePanel();

  if (celebrate) {
    launchConfetti();
    state.celebratedInSession = true;
  }

  renderManageRow();
}

function renderHero(): void {
  if (!state) return;

  byId('publish-title').textContent = state.presentationTitle;

  const badge = byId('status-badge');
  badge.classList.toggle('live', state.isPublished);
  byId('status-text').textContent = state.isPublished ? 'Live' : 'Private';

  byId('hero-title').textContent = state.isPublished
    ? 'Your deck is live!'
    : 'This deck is private';

  byId('hero-sub').textContent = state.isPublished
    ? 'Anyone with the share link can view this presentation.'
    : 'The share link is disabled. Publish again whenever you are ready.';
}

function renderSharePanel(): void {
  if (!state) return;

  const shareLink = byId('share-url') as HTMLAnchorElement;
  const copyButton = byId('copy-action') as HTMLButtonElement;
  const openButton = byId('open-action') as HTMLButtonElement;
  const qrPanel = document.querySelector('.pc-qr-panel') as HTMLElement | null;
  const qrFrame = document.querySelector('.pc-qr-frame') as HTMLElement | null;
  const canvas = byId('qr-canvas') as HTMLCanvasElement;
  const published = state.isPublished && Boolean(state.shareUrl);

  shareLink.textContent = state.isPublished
    ? (state.shareUrl || 'Share link unavailable.')
    : 'Share link removed.';

  if (published) {
    shareLink.href = state.shareUrl;
    shareLink.target = '_blank';
    shareLink.rel = 'noopener noreferrer';
  } else {
    shareLink.removeAttribute('href');
  }

  copyButton.disabled = !published || !state.canCopyShareLink;
  copyButton.textContent = 'Copy link';
  copyButton.onclick = published ? () => void copyShareLink(copyButton) : null;

  openButton.disabled = !published || !state.canOpenShareLink;
  openButton.onclick = published ? () => void openSharePage() : null;

  if (published && state.shareUrl.length <= 106) {
    qrPanel?.removeAttribute('hidden');
    try {
      drawQrToCanvas(canvas, state.shareUrl);
      qrFrame?.removeAttribute('hidden');
    } catch {
      qrFrame?.setAttribute('hidden', 'true');
    }
  } else {
    qrPanel?.setAttribute('hidden', 'true');
  }

  byId('share-note').textContent = state.isPublished
    ? 'Anyone with this link can view the deck.'
    : 'Republish to generate a working share link again.';
}

async function copyShareLink(button: HTMLButtonElement): Promise<void> {
  if (!state?.shareUrl) return;

  try {
    await navigator.clipboard?.writeText(state.shareUrl);
    button.textContent = 'Copied';
    byId('share-note').textContent = 'Share link copied to your clipboard.';
    window.setTimeout(() => {
      button.textContent = 'Copy link';
    }, 1600);
  } catch {
    byId('share-note').textContent = state.shareUrl;
  }
}

async function openSharePage(): Promise<void> {
  if (!state?.shareUrl) return;

  await openVertoLink(state.shareUrl);
}

function renderManageRow(): void {
  const manageButton = byId('unpublish-action') as HTMLButtonElement;
  const note = byId('action-note');

  manageButton.classList.remove('is-busy');
  manageButton.disabled = false;

  if (state?.isPublished) {
    manageButton.classList.add('danger');
    manageButton.textContent = 'Unpublish deck';
    manageButton.setAttribute('aria-label', 'Unpublish deck');
    manageButton.onclick = () => confirmOrUnpublish(manageButton, note);
    note.textContent = 'Unpublishing removes public access immediately.';
    return;
  }

  manageButton.classList.remove('danger');
  manageButton.textContent = 'Publish again';
  manageButton.removeAttribute('aria-label');
  manageButton.onclick = () => void republish(manageButton, note);

  if (!state?.presentationId) {
    manageButton.disabled = true;
  }

  note.textContent = 'Publishing creates a fresh public share link for this deck.';
}

let pendingUnpublish = false;

function confirmOrUnpublish(
  button: HTMLButtonElement,
  note: HTMLElement
): void {
  if (!pendingUnpublish) {
    pendingUnpublish = true;
    button.textContent = 'Confirm unpublish';
    note.textContent = 'This makes the share link stop working right away.';
    window.setTimeout(() => {
      if (pendingUnpublish) {
        pendingUnpublish = false;
        renderManageRow();
      }
    }, 6000);
    return;
  }

  pendingUnpublish = false;
  void runManagedAction(button, note, 'Unpublishing…', async () => {
    assertSuccess(await callMcpTool('presentation_unpublish', {
      presentation_id: state!.presentationId,
    }));

    state!.isPublished = false;
    state!.shareUrl = '';
    state!.canUnpublish = false;
    renderHero();
    renderSharePanel();
    renderManageRow();
    note.textContent = 'Deck unpublished. It is private again.';

    void pushModelContext(
      {
        event: 'presentation_unpublished',
        presentationId: state!.presentationId,
        presentationTitle: state!.presentationTitle,
      },
      `User unpublished presentation ${state!.presentationTitle} `
        + `(${state!.presentationId}) from the chat publish card.`
    );
  });
}

async function republish(
  button: HTMLButtonElement,
  note: HTMLElement
): Promise<void> {
  await runManagedAction(button, note, 'Publishing…', async () => {
    const payload = await callMcpTool('presentation_publish', {
      presentation_id: state!.presentationId,
    });

    assertSuccess(payload);
    renderPublishPayload(payload, { celebrate: true });
    byId('action-note').textContent = 'Deck published. The share link is ready.';
  });
}

async function runManagedAction(
  button: HTMLButtonElement,
  note: HTMLElement,
  busyLabel: string,
  action: () => Promise<void>
): Promise<void> {
  const previousLabel = button.textContent || '';
  button.disabled = true;
  button.classList.add('is-busy');
  button.textContent = busyLabel;

  try {
    await action();
  } catch (error) {
    note.textContent = getActionErrorMessage(error);
    renderManageRow();
  } finally {
    if (button.textContent === busyLabel) {
      button.textContent = previousLabel;
    }
  }
}

function assertSuccess(payload: Record<string, unknown>): void {
  if (payload.success === false) {
    const error = getRecord(payload.error);
    throw new Error(getString(error.message, 'Verto could not complete that action.'));
  }
}

/**
 * Deterministic confetti burst: index-derived positions/colors keep visual QA
 * screenshots stable. Animation itself is disabled globally under
 * `prefers-reduced-motion`, where pieces stay invisible.
 */
function launchConfetti(): void {
  const container = byId('confetti');
  container.textContent = '';

  const pieceCount = 28;

  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('span');
    piece.className = 'pc-piece';

    const left = ((i * 37 + 13) % 96) + 2;
    const delay = ((i * 53) % 40) / 100;
    const rotation = (i * 47) % 360;
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];

    piece.style.setProperty('--pc-left', `${left}%`);
    piece.style.setProperty('--pc-delay', `${delay}s`);
    piece.style.setProperty('--pc-rot', `${rotation}deg`);
    piece.style.setProperty('--pc-color', color);

    container.appendChild(piece);
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

mountWidget((payload) => {
  renderPublishPayload(payload);
});
