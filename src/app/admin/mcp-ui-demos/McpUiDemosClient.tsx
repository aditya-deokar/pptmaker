'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  actionResultPayload,
  deckLivePayload,
  deckPreviewPayload,
  generationPayload,
  presentationListPayload,
  publishCardPayload,
  richSlides,
  themeStudioPayload,
  type FixturePayload,
} from './fixtures';

/* ------------------------------------------------------------------ */
/* Widget registry                                                     */
/* ------------------------------------------------------------------ */

type WidgetId =
  | 'deck-preview'
  | 'deck-live'
  | 'generation-progress'
  | 'theme-studio'
  | 'publish-card'
  | 'presentation-list'
  | 'action-result';

interface WidgetVariant {
  id: string;
  label: string;
  payload: FixturePayload;
}

interface WidgetEntry {
  id: WidgetId;
  label: string;
  defaultHeight: number;
  variants: WidgetVariant[];
  load: () => Promise<string>;
}

const LOADERS: Record<WidgetId, () => Promise<string>> = {
  'deck-preview': () =>
    import('@/mcp/apps/generated/deck-preview').then((m) => m.DECK_PREVIEW_WIDGET_HTML),
  'deck-live': () =>
    import('@/mcp/apps/generated/deck-live').then((m) => m.DECK_LIVE_WIDGET_HTML),
  'generation-progress': () =>
    import('@/mcp/apps/generated/generation-progress').then(
      (m) => m.GENERATION_PROGRESS_WIDGET_HTML
    ),
  'theme-studio': () =>
    import('@/mcp/apps/generated/theme-studio').then((m) => m.THEME_STUDIO_WIDGET_HTML),
  'publish-card': () =>
    import('@/mcp/apps/generated/publish-card').then((m) => m.PUBLISH_CARD_WIDGET_HTML),
  'presentation-list': () =>
    import('@/mcp/apps/generated/presentation-list').then(
      (m) => m.PRESENTATION_LIST_WIDGET_HTML
    ),
  'action-result': () =>
    import('@/mcp/apps/generated/action-result').then((m) => m.ACTION_RESULT_WIDGET_HTML),
};

const WIDGETS: WidgetEntry[] = [
  {
    id: 'deck-preview',
    label: 'Deck preview',
    defaultHeight: 1500,
    load: LOADERS['deck-preview'],
    variants: [
      { id: 'draft', label: 'Draft', payload: deckPreviewPayload({ published: false }) },
      { id: 'published', label: 'Published', payload: deckPreviewPayload({ published: true }) },
      {
        id: 'rich',
        label: 'Rich content',
        payload: deckPreviewPayload({
          published: false,
          theme: 'Dark Elegance',
          slides: richSlides(),
        }),
      },
    ],
  },
  {
    id: 'deck-live',
    label: 'Live presenter',
    defaultHeight: 850,
    load: LOADERS['deck-live'],
    variants: [
      { id: 'presenter', label: 'Presenter stage', payload: deckLivePayload({ theme: 'Sunset Glow' }) },
    ],
  },
  {
    id: 'generation-progress',
    label: 'Generation progress',
    defaultHeight: 780,
    load: LOADERS['generation-progress'],
    variants: [
      {
        id: 'running',
        label: 'Running 68%',
        payload: generationPayload({
          status: 'RUNNING',
          progress: 68,
          currentStepName: 'Visual Search',
          isComplete: false,
          isFailed: false,
        }),
      },
      {
        id: 'complete',
        label: 'Complete + preview',
        payload: generationPayload({
          status: 'COMPLETED',
          progress: 100,
          currentStepName: 'Finalization',
          isComplete: true,
          isFailed: false,
          presentationId: 'deck_demo_123',
        }),
      },
      {
        id: 'failed',
        label: 'Failed',
        payload: generationPayload({
          status: 'FAILED',
          progress: 48,
          currentStepName: 'Content Writing',
          isComplete: false,
          isFailed: true,
          error: 'The generation provider returned an empty outline.',
        }),
      },
    ],
  },
  {
    id: 'theme-studio',
    label: 'Theme studio',
    defaultHeight: 1750,
    load: LOADERS['theme-studio'],
    variants: [
      { id: 'catalog', label: 'Catalog (65 themes)', payload: themeStudioPayload({ theme: 'Sunset Glow' }) },
    ],
  },
  {
    id: 'publish-card',
    label: 'Publish card',
    defaultHeight: 720,
    load: LOADERS['publish-card'],
    variants: [
      { id: 'live', label: 'Celebration', payload: publishCardPayload({ published: true }) },
      { id: 'private', label: 'Private', payload: publishCardPayload({ published: false }) },
    ],
  },
  {
    id: 'presentation-list',
    label: 'Presentation list',
    defaultHeight: 950,
    load: LOADERS['presentation-list'],
    variants: [
      { id: 'workspace', label: 'Workspace', payload: presentationListPayload() },
    ],
  },
  {
    id: 'action-result',
    label: 'Action result',
    defaultHeight: 820,
    load: LOADERS['action-result'],
    variants: [
      {
        id: 'publish',
        label: 'Publish success',
        payload: actionResultPayload({
          kind: 'publish',
          title: 'Presentation published',
          message: 'The deck is now publicly shareable.',
          published: true,
        }),
      },
      {
        id: 'delete',
        label: 'Delete affected',
        payload: actionResultPayload({
          kind: 'delete_permanently',
          title: 'Presentations permanently deleted',
          message: '2 presentations were permanently deleted.',
          affected: true,
        }),
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Document composition                                                */
/* ------------------------------------------------------------------ */

type Scheme = 'auto' | 'light' | 'dark';

const LIGHT_VARS =
  '--bg:#fbfbfc;--fg:#18181b;--muted:#6b7280;--line:#d7dce2;' +
  '--accent:#0f766e;--accent-soft:#ccfbf1;--surface:#ffffff;';

const DARK_VARS =
  '--bg:#0b0c0f;--fg:#f4f4f5;--muted:#a1a1aa;--line:#2f333a;' +
  '--accent:#5eead4;--accent-soft:#123532;--surface:#111318;';

function composeDocument(
  html: string,
  payload: FixturePayload,
  scheme: Scheme
): string {
  const safePayload = JSON.stringify(payload).replace(/<\/script/gi, '<\\/script');

  let doc = html.replace(
    '<body>',
    `<body>\n<script>window.__VERTO_MCP_PAYLOAD__=${safePayload};</script>`
  );

  if (scheme !== 'auto') {
    // Trailing style wins the cascade over the skin's light defaults and its
    // prefers-color-scheme block (equal specificity, later source order).
    const vars = scheme === 'dark' ? DARK_VARS : LIGHT_VARS;
    doc = doc.replace('</body>', `<style>:root{${vars}}</style>\n</body>`);
  }

  return doc;
}

/* ------------------------------------------------------------------ */
/* Frame                                                               */
/* ------------------------------------------------------------------ */

const WIDTHS: Array<{ id: string; label: string; px: number | null }> = [
  { id: 'full', label: 'Full', px: null },
  { id: '390', label: '390 · mobile', px: 390 },
  { id: '768', label: '768 · tablet', px: 768 },
  { id: '1200', label: '1200 · desktop', px: 1200 },
];

function WidgetFrame({
  html,
  payload,
  scheme,
  widthPx,
  height,
  title,
}: {
  html: string;
  payload: FixturePayload;
  scheme: Scheme;
  widthPx: number | null;
  height: number;
  title: string;
}): React.ReactElement {
  const doc = useMemo(
    () => composeDocument(html, payload, scheme),
    [html, payload, scheme]
  );

  return (
    <div className="flex justify-center">
      <div
        className="w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
        style={widthPx ? { maxWidth: widthPx } : undefined}
      >
        <iframe
          srcDoc={doc}
          title={title}
          sandbox="allow-scripts"
          className="block h-[var(--frame-h)] w-full border-0 bg-white"
          style={{ ['--frame-h' as string]: `${height}px` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main client                                                         */
/* ------------------------------------------------------------------ */

export default function McpUiDemosClient(): React.ReactElement {
  const [widgetId, setWidgetId] = useState<WidgetId>('deck-preview');
  const [variantByWidget, setVariantByWidget] = useState<Record<string, string>>({
    'deck-preview': 'draft',
  });
  const [scheme, setScheme] = useState<Scheme>('light');
  const [widthId, setWidthId] = useState('1200');
  const [gallery, setGallery] = useState(false);

  const widget = WIDGETS.find((entry) => entry.id === widgetId)!;
  const activeVariantId = variantByWidget[widget.id] ?? widget.variants[0].id;
  const variant = widget.variants.find((v) => v.id === activeVariantId) ?? widget.variants[0];

  const [heights, setHeights] = useState<Record<string, number>>({});
  const height = heights[`${widget.id}:${variant.id}`] ?? widget.defaultHeight;

  const htmlCache = useRef<Partial<Record<WidgetId, string>>>({});
  const [html, setHtml] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const cached = htmlCache.current[widget.id];
    if (cached) {
      setHtml(cached);
      return;
    }

    setHtml(null);
    setLoadError(null);
    widget
      .load()
      .then((bundle) => {
        htmlCache.current[widget.id] = bundle;
        if (!cancelled) setHtml(bundle);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load the generated widget bundle.');
      });

    return () => {
      cancelled = true;
    };
  }, [widget]);

  const widthPx = WIDTHS.find((w) => w.id === widthId)?.px ?? null;

  function selectWidget(next: WidgetId): void {
    setWidgetId(next);
    const entry = WIDGETS.find((w) => w.id === next)!;
    if (!variantByWidget[next]) {
      setVariantByWidget((prev) => ({ ...prev, [next]: entry.variants[0].id }));
    }
  }

  async function copyPayload(): Promise<void> {
    try {
      await navigator.clipboard.writeText(JSON.stringify(variant.payload, null, 2));
    } catch {
      window.prompt('Copy the payload JSON:', JSON.stringify(variant.payload, null, 2));
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
          <div>
            <h1 className="text-lg font-bold tracking-tight">MCP UI demos</h1>
            <p className="text-xs text-zinc-400">
              Static previews of the built widget bundles — same HTML served to MCP hosts.
              In-widget actions need a live host session.
            </p>
          </div>

          <SegmentedControl
            label="Scheme"
            options={[
              { id: 'light', label: 'Light' },
              { id: 'dark', label: 'Dark' },
              { id: 'auto', label: 'Auto' },
            ]}
            value={scheme}
            onChange={(value) => setScheme(value as Scheme)}
          />

          <SegmentedControl
            label="Width"
            options={WIDTHS.map((w) => ({ id: w.id, label: w.label }))}
            value={widthId}
            onChange={setWidthId}
          />

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={gallery}
              onChange={(event) => setGallery(event.target.checked)}
              className="size-4 accent-orange-500"
            />
            Gallery (all widgets)
          </label>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1600px] gap-5 px-5 py-6">
        {!gallery && (
          <aside className="hidden w-56 flex-none lg:block">
            <nav className="grid gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2">
              {WIDGETS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => selectWidget(entry.id)}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    entry.id === widgetId
                      ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </nav>
          </aside>
        )}

        <section className="min-w-0 flex-1">
          {!gallery && (
            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
              {widget.variants.length > 1 && (
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-400">Variant</span>
                  <select
                    value={activeVariantId}
                    onChange={(event) =>
                      setVariantByWidget((prev) => ({
                        ...prev,
                        [widget.id]: event.target.value,
                      }))
                    }
                    className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm"
                  >
                    {widget.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="flex items-center gap-2 text-sm">
                <span className="text-zinc-400">Height</span>
                <input
                  type="number"
                  min={300}
                  step={50}
                  value={height}
                  onChange={(event) => {
                    const next = Number.parseInt(event.target.value, 10);
                    if (Number.isFinite(next)) {
                      setHeights((prev) => ({
                        ...prev,
                        [`${widget.id}:${variant.id}`]: Math.max(300, next),
                      }));
                    }
                  }}
                  className="w-24 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm"
                />
              </label>

              <button
                type="button"
                onClick={() => void copyPayload()}
                className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-zinc-200 hover:bg-zinc-700"
              >
                Copy payload JSON
              </button>

              <span className="ml-auto text-xs text-zinc-500">{widget.id}</span>
            </div>
          )}

          {gallery ? (
            <div className="grid gap-10">
              {WIDGETS.map((entry) => (
                <section key={entry.id}>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                    {entry.label}
                    <span className="ml-2 font-mono text-xs normal-case text-zinc-600">
                      {entry.id}
                    </span>
                  </h2>
                  <GalleryItem entry={entry} scheme={scheme} widthPx={widthPx} />
                </section>
              ))}
            </div>
          ) : html ? (
            <WidgetFrame
              html={html}
              payload={variant.payload}
              scheme={scheme}
              widthPx={widthPx}
              height={height}
              title={`${widget.label} preview`}
            />
          ) : loadError ? (
            <p className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
              {loadError}
            </p>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-zinc-800 text-sm text-zinc-500">
              Loading widget bundle…
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function GalleryItem({
  entry,
  scheme,
  widthPx,
}: {
  entry: WidgetEntry;
  scheme: Scheme;
  widthPx: number | null;
}): React.ReactElement {
  const variant = entry.variants[0];
  const htmlRef = useRef<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!htmlRef.current) {
      entry
        .load()
        .then((bundle) => {
          htmlRef.current = bundle;
          if (!cancelled) setHtml(bundle);
        })
        .catch(() => {});
    } else {
      setHtml(htmlRef.current);
    }

    return () => {
      cancelled = true;
    };
  }, [entry]);

  return html ? (
    <WidgetFrame
      html={html}
      payload={variant.payload}
      scheme={scheme}
      widthPx={widthPx}
      height={entry.defaultHeight}
      title={`${entry.label} preview`}
    />
  ) : (
    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-zinc-800 text-sm text-zinc-500">
      Loading {entry.label}…
    </div>
  );
}

function SegmentedControl({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
      <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
              option.id === value
                ? 'bg-zinc-100 text-zinc-900'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
