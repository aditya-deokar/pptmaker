/**
 * Static payload fixtures for the /admin/mcp-ui-demos playground.
 *
 * Ported from scripts/mcp-apps/phase9h-visual-qa.mjs so every preview matches
 * the automated QA evidence byte-for-byte. Shapes mirror the v2 widget
 * contracts in src/mcp/apps/widget-data.ts.
 */

export type FixturePayload = Record<string, unknown>;

const BASE = 'https://verto.ai.aditya-deokar.me';

/* ------------------------------------------------------------------ */
/* Shared slide fixtures                                               */
/* ------------------------------------------------------------------ */

export function richSlides(): FixturePayload[] {
  return [
    {
      id: 'r1',
      title: 'Quarterly growth review',
      order: 0,
      previewText: 'Revenue is up 42% year over year across all regions.',
      content: [
        { id: 'r1t', type: 'title', name: 'Title', content: 'Quarterly growth review' },
        { id: 'r1d', type: 'divider', name: 'Divider' },
        { id: 'r1h', type: 'heading2', name: 'Heading 2', content: 'Market momentum' },
        {
          id: 'r1p',
          type: 'paragraph',
          name: 'Paragraph',
          content:
            'Expansion in enterprise accounts drove the majority of new bookings this quarter & retention stayed above target.',
        },
      ],
    },
    {
      id: 'r2',
      title: 'Key metrics',
      order: 1,
      previewText: 'Stat box, numbered list, and bullet list.',
      content: [
        { id: 'r2h', type: 'heading2', name: 'Heading 2', content: 'Key metrics' },
        { id: 'r2s', type: 'statBox', name: 'Stat box', icon: '📈', label: 'Growth', content: '+42%' },
        {
          id: 'r2n',
          type: 'numberedList',
          name: 'Numbered list',
          content: ['Sign three anchor customers', 'Launch the partner portal', 'Hire two designers'],
        },
        {
          id: 'r2b',
          type: 'bulletList',
          name: 'Bullet list',
          content: ['Churn below 4%', 'NPS at an all-time high'],
        },
        {
          id: 'r2t',
          type: 'todoList',
          name: 'Todo list',
          content: ['[x] Ship onboarding revamp', '[ ] Draft board update'],
        },
      ],
    },
    {
      id: 'r3',
      title: 'Roadmap',
      order: 2,
      previewText: 'Timeline cards and a success callout.',
      content: [
        { id: 'r3h', type: 'heading2', name: 'Heading 2', content: 'Roadmap' },
        {
          id: 'r3c',
          type: 'calloutBox',
          name: 'Callout',
          callOutType: 'success',
          content: 'Series B term sheet signed with lead investor.',
        },
        {
          id: 'r3t1',
          type: 'timelineCard',
          name: 'Timeline card',
          icon: '2026',
          content: 'Q3 platform GA',
          placeholder: 'Multi-tenant rollout completes for all enterprise workspaces.',
        },
        {
          id: 'r3t2',
          type: 'timelineCard',
          name: 'Timeline card',
          icon: '2027',
          content: 'Global expansion',
          placeholder: 'Open EU and APAC data regions with local support teams.',
        },
      ],
    },
    {
      id: 'r4',
      title: 'Engineering notes',
      order: 3,
      previewText: 'Code block, blockquote, and table.',
      content: [
        { id: 'r4h', type: 'heading2', name: 'Heading 2', content: 'Engineering notes' },
        {
          id: 'r4code',
          type: 'codeBlock',
          name: 'Code block',
          language: 'typescript',
          code: "export const uptime = 99.99;\nconsole.log(`SLA met: ${uptime}`);",
        },
        {
          id: 'r4q',
          type: 'blockquote',
          name: 'Quote',
          content: 'The fastest roadmap is the one the whole team can read.',
        },
        {
          id: 'r4table',
          type: 'table',
          name: 'Table',
          initialRows: 3,
          initialColumns: 2,
          content: [
            ['Region', 'Uptime'],
            ['US-East', '99.99%'],
            ['EU-West', '99.98%'],
          ],
        },
      ],
    },
    {
      id: 'r5',
      title: 'Agenda',
      order: 4,
      previewText: 'Table of contents, warning callout, and a two column row.',
      content: [
        { id: 'r5h', type: 'heading2', name: 'Heading 2', content: 'Agenda' },
        {
          id: 'r5toc',
          type: 'tableOfContents',
          name: 'Table of contents',
          content: ['Market momentum', 'Key metrics', 'Roadmap', 'Engineering notes'],
        },
        {
          id: 'r5w',
          type: 'calloutBox',
          name: 'Callout',
          callOutType: 'warning',
          content: 'Headcount plan assumes hiring freezes stay lifted.',
        },
        {
          id: 'r5row',
          type: 'resizable-column',
          name: 'Columns',
          content: [
            {
              id: 'r5col1',
              type: 'column',
              name: 'Column',
              content: [{ id: 'r5ch', type: 'heading4', name: 'Heading 4', content: 'Left column' }],
            },
            {
              id: 'r5col2',
              type: 'column',
              name: 'Column',
              content: [
                {
                  id: 'r5cp',
                  type: 'paragraph',
                  name: 'Paragraph',
                  content: 'Right column copy that wraps across multiple lines in narrow cards.',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'r6',
      title: 'Links',
      order: 5,
      previewText: 'Link and custom button rendering.',
      content: [
        { id: 'r6h', type: 'heading2', name: 'Heading 2', content: 'Keep exploring' },
        { id: 'r6l', type: 'link', name: 'Link', link: `${BASE}/docs`, content: 'Read the launch docs' },
        {
          id: 'r6btn',
          type: 'customButton',
          name: 'Button',
          bgColor: '#ef4444',
          link: BASE,
          content: 'Open dashboard',
        },
      ],
    },
  ];
}

function basicSlides(): FixturePayload[] {
  return [
    { id: 's1', title: 'Market shift', order: 0, previewText: 'AI tutoring is becoming a daily learning layer for students, parents, and teachers.' },
    { id: 's2', title: 'Problem', order: 1, previewText: 'Students need immediate help, but human tutoring is expensive and hard to scale.' },
    { id: 's3', title: 'Product', order: 2, previewText: 'Personalized guidance, generated practice, and teacher-ready learning diagnostics.' },
    { id: 's4', title: 'Workflow', order: 3, previewText: 'Learners ask questions, Verto adapts the deck, and teachers review progress quickly.' },
    { id: 's5', title: 'Business model', order: 4, previewText: 'Subscription seats for tutoring centers, schools, and parent-led learning groups.' },
    { id: 's6', title: 'Go to market', order: 5, previewText: 'Start with tutoring centers and expand into homeschool networks and schools.' },
  ];
}

/* ------------------------------------------------------------------ */
/* Per-widget payloads                                                 */
/* ------------------------------------------------------------------ */

export function deckPreviewPayload({
  published,
  theme = 'Dark Elegance',
  slides = null,
}: {
  published: boolean;
  theme?: string;
  slides?: FixturePayload[] | null;
}): FixturePayload {
  const openUrl = `${BASE}/presentation/deck_demo_123`;
  return {
    widget: {
      widget: 'deck_preview',
      version: 2,
      links: {
        editorUrl: openUrl,
        presentUrl: `${BASE}/present/deck_demo_123`,
        shareUrl: published ? `${BASE}/share/deck_demo_123` : null,
      },
      presentation: {
        id: 'deck_demo_123',
        title: 'AI tutoring investor pitch deck',
        themeName: theme,
        slideCount: 7,
        updatedAt: '2026-06-18T00:00:00.000Z',
        isPublished: published,
        shareUrl: published ? `${BASE}/share/deck_demo_123` : null,
        openUrl,
      },
      slides: slides ?? basicSlides(),
      actions: {
        canOpen: true,
        canRefresh: true,
        canPublish: !published,
        canUnpublish: published,
        canCopyShareLink: published,
        canUpdateSlides: true,
      },
    },
  };
}

export function deckLivePayload({ theme }: { theme: string }): FixturePayload {
  return {
    widget: {
      widget: 'deck_live',
      version: 2,
      links: {
        editorUrl: `${BASE}/presentation/deck_demo_123`,
        presentUrl: `${BASE}/present/deck_demo_123`,
        shareUrl: null,
      },
      presentation: {
        id: 'deck_demo_123',
        title: 'AI tutoring investor pitch deck',
        themeName: theme,
        slideCount: 3,
      },
      slides: richSlides().slice(0, 3),
      actions: { canRefresh: true },
    },
  };
}

export function generationSteps(currentStepName: string, isComplete: boolean, isFailed: boolean): FixturePayload[] {
  const definitions: Array<[string, string, string]> = [
    ['projectInitializer', 'Project Setup', 'Preparing your presentation workspace'],
    ['outlineGenerator', 'Structure', 'Organizing the presentation flow'],
    ['contentWriter', 'Content Writing', 'Creating engaging text for all slides'],
    ['layoutSelector', 'Design Layout', 'Selecting the best look for your slides'],
    ['imageQueryGenerator', 'Visual Search', 'Finding the right visuals for each slide'],
    ['imageFetcher', 'Image Integration', 'Adding beautiful visuals'],
    ['jsonCompiler', 'Assembly', 'Formatting and polishing your slides'],
    ['databasePersister', 'Finalization', 'Saving your masterpiece'],
  ];

  const runningIndex = Math.max(
    0,
    definitions.findIndex(([, name]) => name === currentStepName)
  );

  const stepStatus = (index: number): string => {
    if (isComplete) return 'completed';
    if (isFailed) {
      if (index < 2) return 'completed';
      if (index === 2) return 'error';
      return 'pending';
    }
    if (index < runningIndex) return 'completed';
    if (index === runningIndex) return 'running';
    return 'pending';
  };

  return definitions.map(([id, name, description], index) => ({
    id,
    name,
    description,
    status: stepStatus(index),
  }));
}

export function generationPayload({
  status,
  progress,
  currentStepName,
  isComplete,
  isFailed,
  presentationId = null,
  error = null,
}: {
  status: string;
  progress: number;
  currentStepName: string;
  isComplete: boolean;
  isFailed: boolean;
  presentationId?: string | null;
  error?: string | null;
}): FixturePayload {
  const openUrl = `${BASE}/presentation/deck_demo_123`;
  const presentation = presentationId ? { id: presentationId, openUrl } : null;
  const createdAt = new Date(Date.now() - 95_000).toISOString();
  const completedAt = new Date(Date.now() - 4_000).toISOString();

  return {
    widget: {
      widget: 'generation_progress',
      version: 2,
      links: presentation
        ? {
            editorUrl: openUrl,
            presentUrl: openUrl.replace('/presentation/', '/present/'),
            shareUrl: null,
          }
        : { editorUrl: null, presentUrl: null, shareUrl: null },
      generation: {
        runId: 'run_demo_123456',
        topic: 'AI tutoring investor pitch deck',
        status,
        progress,
        currentStepName,
        error,
        presentationId,
        createdAt,
        completedAt: isComplete ? completedAt : null,
        updatedAt: new Date().toISOString(),
        isComplete,
        isFailed,
        pollHint: isComplete
          ? null
          : 'Generation is still running. Check again after a short delay.',
      },
      steps: generationSteps(currentStepName, isComplete, isFailed),
      ...(isComplete
        ? {
            completion: {
              slideCount: 7,
              themeName: 'Sunset Glow',
              previewSlide: {
                id: 's1',
                title: 'Market shift',
                order: 0,
                previewText: 'AI tutoring is becoming a daily learning layer for students.',
                content: [
                  { id: 'p1t', type: 'title', name: 'Title', content: 'Market shift' },
                  { id: 'p1d', type: 'divider', name: 'Divider' },
                  {
                    id: 'p1p',
                    type: 'paragraph',
                    name: 'Paragraph',
                    content:
                      'Students reach for instant help every evening, and Verto meets them there with guided practice.',
                  },
                  { id: 'p1s', type: 'statBox', name: 'Stat box', icon: '📈', label: 'Homework minutes helped', content: '+42%' },
                ],
              },
            },
          }
        : {}),
      presentation,
      actions: {
        canRefresh: !isComplete && !isFailed,
        canOpenPresentation: Boolean(presentation),
        canInspectPresentation: Boolean(presentationId),
        canRetry: isFailed,
      },
    },
  };
}

export function themeStudioPayload({ theme }: { theme: string }): FixturePayload {
  const catalog: Array<{ name: string; bg: string; accent: string; font: string; isNew?: boolean }> = [
    { name: 'Default', bg: '#ffffff', accent: '#3b82f6', font: '#000000' },
    { name: 'Dark Elegance', bg: 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)', accent: '#ffd700', font: '#ffffff' },
    { name: 'Nature Fresh', bg: '#e8f5e9', accent: '#4caf50', font: '#1b4332' },
    { name: 'Tech Vibrant', bg: '#0d1117', accent: '#00e5ff', font: '#e6edf3' },
    { name: 'Pastel Dream', bg: '#fdf2f8', accent: '#ec4899', font: '#831843' },
    { name: 'Ocean Breeze', bg: '#e0f2fe', accent: '#0284c7', font: '#0c4a6e' },
    { name: 'Sunset Glow', bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', accent: '#f97316', font: '#7c2d12' },
    { name: 'Minimalist Mono', bg: '#fafafa', accent: '#171717', font: '#171717' },
    { name: 'Neon Nights', bg: '#09090b', accent: '#a3e635', font: '#fafafa' },
    { name: 'Earthy Tones', bg: '#f5f5f4', accent: '#b45309', font: '#44403c' },
    { name: 'Retro Pop', bg: '#fef9c3', accent: '#e11d48', font: '#450a0a' },
    { name: 'Zen Garden', bg: '#ecfccb', accent: '#65a30d', font: '#365314' },
    { name: 'Arctic Frost', bg: '#f0f9ff', accent: '#38bdf8', font: '#0c4a6e' },
    { name: 'Vintage Warmth', bg: '#fefce8', accent: '#ca8a04', font: '#713f12' },
    { name: 'Cosmic Delight', bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', accent: '#c084fc', font: '#ede9fe' },
    { name: 'Midnight Bloom', bg: '#111827', accent: '#f472b6', font: '#f9fafb' },
    { name: 'Coral Sunset', bg: '#fff1f2', accent: '#fb7185', font: '#881337' },
    { name: 'Emerald City', bg: '#022c22', accent: '#34d399', font: '#ecfdf5' },
    { name: 'Lavender Mist', bg: '#f5f3ff', accent: '#8b5cf6', font: '#4c1d95' },
    { name: 'Golden Hour', bg: '#fffbeb', accent: '#f59e0b', font: '#78350f' },
    { name: 'Arctic Aurora', bg: 'linear-gradient(160deg, #172554 0%, #0f172a 100%)', accent: '#22d3ee', font: '#e0f2fe' },
    { name: 'Sakura Blossom', bg: '#fdf4ff', accent: '#d946ef', font: '#701a75' },
    { name: 'Urban Jungle', bg: '#1c1917', accent: '#84cc16', font: '#fafaf9' },
    { name: 'Modern Dark', bg: '#18181b', accent: '#60a5fa', font: '#fafafa', isNew: true },
    { name: 'Royal Sapphire', bg: '#f8fafc', accent: '#64748b', font: '#0f172a' },
    { name: 'Terracotta Clay', bg: '#fef2f2', accent: '#dc2626', font: '#7f1d1d' },
    { name: 'Graphite Pro', bg: '#e5e7eb', accent: '#374151', font: '#111827' },
    { name: 'Mint Cream', bg: '#f0fdf4', accent: '#10b981', font: '#064e3b' },
    { name: 'Nordic Fjord', bg: '#f8fafc', accent: '#0ea5e9', font: '#082f49' },
    { name: 'Amber Glow', bg: '#fffbeb', accent: '#d97706', font: '#78350f' },
  ];

  return {
    widget: {
      widget: 'theme_studio',
      version: 2,
      presentation: {
        id: 'deck_demo_123',
        title: 'AI tutoring investor pitch deck',
        currentThemeName: theme,
      },
      themes: catalog.map((entry) => ({
        name: entry.name,
        colors: [entry.bg, entry.accent, entry.font],
        description: entry.bg.startsWith('linear-gradient')
          ? 'Dark theme'
          : classify(entry.bg),
        ...(entry.isNew ? { isNew: true } : {}),
      })),
      actions: {
        canApplyTheme: true,
      },
    },
  };
}

function classify(bg: string): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(bg);

  if (!hex) return 'Light theme';

  const n = parseInt(hex[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  return luminance < 0.45 ? 'Dark theme' : 'Light theme';
}

export function publishCardPayload({ published }: { published: boolean }): FixturePayload {
  const shareUrl = published
    ? `${BASE}/share/deck_demo_123`
    : null;

  return {
    widget: {
      widget: 'publish_card',
      version: 2,
      links: {
        editorUrl: `${BASE}/presentation/deck_demo_123`,
        presentUrl: `${BASE}/present/deck_demo_123`,
        shareUrl,
      },
      presentation: {
        id: 'deck_demo_123',
        title: 'AI tutoring investor pitch deck',
        isPublished: published,
        shareUrl,
      },
      actions: {
        canCopyShareLink: published,
        canOpenShareLink: published,
        canUnpublish: published,
      },
    },
  };
}

interface FixturePresentationRow {
  id: string;
  title: string;
  theme_name: string;
  slide_count: number;
  updated_at: string;
  is_published: boolean;
  is_deleted: boolean;
  share_url: string | null;
  open_url: string;
}

function listPresentations(): FixturePresentationRow[] {
  return [
    {
      id: 'deck_workspace_001',
      title: 'Verto AI - AI-Native Presentation Workspace',
      theme_name: 'Charcoal Copper',
      slide_count: 16,
      updated_at: '2026-06-07T10:00:00.000Z',
      is_published: true,
      is_deleted: false,
      share_url: `${BASE}/share/deck_workspace_001`,
      open_url: `${BASE}/presentation/deck_workspace_001`,
    },
    {
      id: 'deck_workspace_002',
      title: 'How to write a research paper',
      theme_name: 'Neon Genesis',
      slide_count: 15,
      updated_at: '2026-06-07T09:00:00.000Z',
      is_published: false,
      is_deleted: false,
      share_url: null,
      open_url: `${BASE}/presentation/deck_workspace_002`,
    },
    {
      id: 'deck_workspace_003',
      title: 'Google ADK',
      theme_name: 'Default',
      slide_count: 10,
      updated_at: '2026-06-07T08:00:00.000Z',
      is_published: false,
      is_deleted: false,
      share_url: null,
      open_url: `${BASE}/presentation/deck_workspace_003`,
    },
    {
      id: 'deck_workspace_004',
      title: 'Messi footballer profile',
      theme_name: 'Neon Nights',
      slide_count: 10,
      updated_at: '2026-06-07T07:00:00.000Z',
      is_published: false,
      is_deleted: false,
      share_url: null,
      open_url: `${BASE}/presentation/deck_workspace_004`,
    },
    {
      id: 'deck_workspace_005',
      title: 'AI tutoring investor pitch',
      theme_name: 'Arctic Aurora',
      slide_count: 7,
      updated_at: '2026-06-07T06:00:00.000Z',
      is_published: true,
      is_deleted: false,
      share_url: `${BASE}/share/deck_workspace_005`,
      open_url: `${BASE}/presentation/deck_workspace_005`,
    },
    {
      id: 'deck_workspace_006',
      title: 'Privacy-first analytics startup',
      theme_name: 'Mint Cream',
      slide_count: 9,
      updated_at: '2026-06-07T05:00:00.000Z',
      is_published: false,
      is_deleted: false,
      share_url: null,
      open_url: `${BASE}/presentation/deck_workspace_006`,
    },
  ];
}

export function presentationListPayload(): FixturePayload {
  const presentations = listPresentations();

  return {
    success: true,
    data: presentations,
    pagination: {
      next_cursor: 'cursor_demo_next',
      has_more: true,
      total_count: 44,
      page_size: 20,
    },
    widget: {
      widget: 'presentation_list',
      version: 2,
      links: {
        editorUrl: presentations[0].open_url,
        presentUrl: presentations[0].open_url.replace('/presentation/', '/present/'),
        shareUrl: presentations[0].share_url,
      },
      presentations: presentations.map((p) => ({
        id: p.id,
        title: p.title,
        themeName: p.theme_name,
        slideCount: p.slide_count,
        updatedAt: p.updated_at,
        isPublished: p.is_published,
        isDeleted: p.is_deleted,
        shareUrl: p.share_url,
        openUrl: p.open_url,
      })),
      pagination: {
        nextCursor: 'cursor_demo_next',
        hasMore: true,
        totalCount: 44,
        pageSize: 20,
      },
      summary: {
        shownCount: presentations.length,
        totalCount: 44,
        publishedCount: 2,
        draftCount: 4,
        deletedCount: 0,
      },
      actions: {
        canRefresh: true,
        canOpenLatest: true,
        canPreviewLatest: true,
      },
    },
  };
}

export function actionResultPayload({
  kind,
  title,
  message,
  published = false,
  affected = false,
}: {
  kind: string;
  title: string;
  message: string;
  published?: boolean;
  affected?: boolean;
}): FixturePayload {
  const presentation = affected
    ? null
    : {
        id: 'deck_demo_123',
        title: 'AI tutoring investor pitch deck',
        themeName: 'Crimson Velvet',
        slideCount: 7,
        updatedAt: '2026-06-18T00:00:00.000Z',
        isPublished: published,
        isDeleted: false,
        shareUrl: published ? `${BASE}/share/deck_demo_123` : null,
        openUrl: `${BASE}/presentation/deck_demo_123`,
      };

  const links = presentation
    ? {
        editorUrl: presentation.openUrl,
        presentUrl: `${BASE}/present/deck_demo_123`,
        shareUrl: presentation.shareUrl,
      }
    : { editorUrl: null, presentUrl: null, shareUrl: null };

  return {
    widget: {
      widget: 'action_result',
      version: 2,
      links,
      operation: {
        kind,
        title,
        message,
        status: affected ? 'warning' : 'success',
        completedAt: '2026-06-18T00:00:00.000Z',
      },
      presentation,
      affectedPresentations: affected
        ? [
            { id: 'deck_old_001', title: 'Old conference recap' },
            { id: 'deck_old_002', title: 'Duplicate sales draft' },
          ]
        : [],
      actions: {
        canOpen: Boolean(presentation?.openUrl),
        canPreview: Boolean(presentation?.id),
        canCopyShareLink: Boolean(presentation?.shareUrl),
      },
    },
  };
}
