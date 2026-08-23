#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import puppeteer from 'puppeteer';

const root = process.cwd();
const assetsDir = path.join(root, 'docs/mcp-apps/submission-assets');
const generatedDir = path.join(root, 'src/mcp/apps/generated');
const reportJsonPath = path.join(assetsDir, 'phase9h-visual-qa-report.json');
const reportMarkdownPath = path.join(assetsDir, 'phase9h-visual-qa-summary.md');

await mkdir(assetsDir, { recursive: true });

const generationHtml = await readFile(
  path.join(generatedDir, 'generation-progress.html'),
  'utf8'
);
const listHtml = await readFile(
  path.join(generatedDir, 'presentation-list.html'),
  'utf8'
);
const deckHtml = await readFile(
  path.join(generatedDir, 'deck-preview.html'),
  'utf8'
);
const actionResultHtml = await readFile(
  path.join(generatedDir, 'action-result.html'),
  'utf8'
);
const deckLiveHtml = await readFile(
  path.join(generatedDir, 'deck-live.html'),
  'utf8'
);
const themeStudioHtml = await readFile(
  path.join(generatedDir, 'theme-studio.html'),
  'utf8'
);
const publishCardHtml = await readFile(
  path.join(generatedDir, 'publish-card.html'),
  'utf8'
);

const scenarios = [
  {
    id: 'phase10d-theme-studio-dark-desktop',
    label: 'Theme studio catalog - dark desktop',
    html: themeStudioHtml,
    payload: themeStudioPayload({ theme: 'Dark Elegance' }),
    viewport: { width: 1200, height: 900 },
    colorScheme: 'dark',
    expectations: {
      text: ['Verto AI theme studio', 'Dark Elegance', 'All', 'Light', 'Dark', 'Current', 'NEW', 'Show more themes (6 more)'],
      rendererCounts: {
        '.ts-card': 24,
        '.ts-tab': 3,
      },
    },
  },
  {
    id: 'phase10d-theme-studio-light-mobile',
    label: 'Theme studio catalog - light mobile',
    html: themeStudioHtml,
    payload: themeStudioPayload({ theme: 'Sunset Glow' }),
    viewport: { width: 390, height: 900 },
    colorScheme: 'light',
    expectations: {
      text: ['Verto AI theme studio', 'Sunset Glow', 'catalog themes', 'Show more themes (6 more)'],
      rendererCounts: {
        '.ts-mock': 24,
      },
    },
  },
  {
    id: 'phase10d-publish-card-celebration-light-desktop',
    label: 'Publish card celebration - light desktop',
    html: publishCardHtml,
    payload: publishCardPayload({ published: true }),
    viewport: { width: 1200, height: 900 },
    colorScheme: 'light',
    expectations: {
      text: ['Verto AI publish', 'Your deck is live!', 'Copy link', 'Open share page', 'Unpublish deck', 'Scan to open the deck'],
      rendererCounts: {
        '.pc-piece': 28,
      },
    },
  },
  {
    id: 'phase10d-publish-card-private-dark-mobile',
    label: 'Publish card private - dark mobile',
    html: publishCardHtml,
    payload: publishCardPayload({ published: false }),
    viewport: { width: 390, height: 900 },
    colorScheme: 'dark',
    expectations: {
      text: ['Verto AI publish', 'This deck is private', 'Publish again'],
      rendererCounts: {
        '.pc-piece': 0,
      },
    },
  },
  {
    id: 'phase10f-deck-preview-edit-mode-light-desktop',
    label: 'Deck preview guided edit - light desktop',
    html: deckHtml,
    payload: deckPayload({ published: false, theme: 'Sunset Glow', slides: richSlides() }),
    viewport: { width: 1200, height: 900 },
    colorScheme: 'light',
    preClicks: ['#edit-action'],
    setValueSteps: [
      { selector: '#vte-f-0', value: 'Renamed headline for guided edit QA' },
    ],
    expectations: {
      text: [
        'Verto AI deck',
        'Slide 1 of 6',
        'Quarterly growth review',
        '1 unsaved edit',
        'Save changes',
        'Cancel',
      ],
      minCounts: {
        '.vte-field': 3,
      },
    },
  },
  {
    id: 'phase10c-deck-live-dark-desktop',
    label: 'Deck live presenter - dark desktop',
    html: deckLiveHtml,
    payload: deckLivePayload({ theme: 'Dark Elegance' }),
    viewport: { width: 1200, height: 900 },
    colorScheme: 'dark',
    expectations: {
      text: ['Verto AI presenter', '1 / 3', 'Present fullscreen', 'Grid'],
      rendererCounts: {
        '.vt-stage': 1,
        '.vt-progress-fill': 1,
        '.dot-btn': 3,
      },
      keyboardSteps: [
        { keys: ['ArrowRight'], expectCounter: '2 / 3' },
        { keys: ['ArrowRight'], expectCounter: '3 / 3' },
        { keys: ['ArrowLeft'], expectCounter: '2 / 3' },
      ],
    },
  },
  {
    id: 'phase10c-deck-live-grid-light-mobile',
    label: 'Deck live presenter grid - light mobile',
    html: deckLiveHtml,
    payload: deckLivePayload({ theme: 'Sunset Glow' }),
    viewport: { width: 390, height: 900 },
    colorScheme: 'light',
    expectations: {
      text: ['Verto AI presenter', 'Present fullscreen', 'Grid'],
      rendererCounts: {
        '.vt-stage': 1,
        '.vt-thumb': 0,
      },
      keyboardSteps: [
        { keys: ['g'], expectCount: { selector: '.vt-thumb', value: 3 } },
        { keys: ['Escape'], expectCount: { selector: '.vt-grid.open', value: 0 } },
      ],
    },
  },
  {
    id: 'phase10b-deck-renderer-rich-dark-desktop',
    label: 'Deck renderer rich content - dark desktop',
    html: deckHtml,
    payload: deckPayload({ published: false, theme: 'Dark Elegance', slides: richSlides() }),
    viewport: { width: 1200, height: 900 },
    colorScheme: 'dark',
    expectations: {
      text: ['Verto AI deck', 'Quarterly growth review', 'Market momentum'],
      minSlides: 6,
      rendererCounts: {
        '.vts-stat': 1,
        '.vts-timeline': 2,
        '.vts-callout.success': 1,
        '.vts-code': 1,
        '.vts-table': 1,
        '.vts-blockquote': 1,
        '.vts-divider': 1,
      },
    },
  },
  {
    id: 'phase10b-deck-renderer-rich-light-mobile',
    label: 'Deck renderer rich content - light mobile',
    html: deckHtml,
    payload: deckPayload({ published: true, theme: 'Sunset Glow', slides: richSlides() }),
    viewport: { width: 390, height: 900 },
    colorScheme: 'light',
    expectations: {
      text: ['Verto AI deck', 'Copy share link'],
      minSlides: 6,
      rendererCounts: {
        '.vts-stat': 1,
        '.vts-timeline': 2,
        '.vts-callout.warning': 1,
        '.vts-list li .vts-num-badge': 3,
        '.vts-todo-check.checked': 1,
      },
    },
  },
  {
    id: 'phase9h-presentation-list-dark-desktop',
    label: 'Presentation list - dark desktop',
    html: listHtml,
    payload: listPayload(),
    viewport: { width: 1200, height: 900 },
    colorScheme: 'dark',
    expectations: {
      text: ['Verto AI workspace', 'Presentation workspace', 'Open latest', 'Preview latest', 'Refresh list', 'Preview', 'Publish', 'Delete'],
      minListRows: 6,
    },
  },
  {
    id: 'phase9h-presentation-list-light-mobile',
    label: 'Presentation list - light mobile',
    html: listHtml,
    payload: listPayload(),
    viewport: { width: 390, height: 900 },
    colorScheme: 'light',
    expectations: {
      text: ['Verto AI workspace', 'Presentation workspace', 'Preview latest', 'Preview', 'Delete'],
      minListRows: 6,
    },
  },
  {
    id: 'phase9h-generation-running-dark-desktop',
    label: 'Generation running - dark desktop',
    html: generationHtml,
    payload: generationPayload({
      status: 'RUNNING',
      progress: 68,
      currentStepName: 'Visual Search',
      isComplete: false,
      isFailed: false,
      presentationId: null,
      presentationOpenUrl: null,
      error: null,
    }),
    viewport: { width: 1200, height: 900 },
    colorScheme: 'dark',
    expectations: {
      text: ['Verto AI generation', '68%', 'Visual Search', 'Elapsed', 'Check status'],
      stageCount: 8,
    },
  },
  {
    id: 'phase10e-generation-complete-light-desktop',
    label: 'Generation complete with live preview - light desktop',
    html: generationHtml,
    payload: generationPayload({
      status: 'COMPLETED',
      progress: 100,
      currentStepName: 'Finalization',
      isComplete: true,
      isFailed: false,
      presentationId: 'deck_demo_123',
      presentationOpenUrl: 'https://verto.ai.aditya-deokar.me/presentation/deck_demo_123',
      error: null,
    }),
    viewport: { width: 1200, height: 900 },
    colorScheme: 'light',
    expectations: {
      text: ['Verto AI generation', '100%', 'Open deck', 'Inspect with ChatGPT', 'FIRST SLIDE', 'Built in'],
      stageCount: 8,
      rendererCounts: {
        '.vts-stat': 1,
      },
    },
  },
  {
    id: 'phase9h-generation-error-dark-mobile',
    label: 'Generation error - dark mobile',
    html: generationHtml,
    payload: generationPayload({
      status: 'FAILED',
      progress: 48,
      currentStepName: 'Content Writing',
      isComplete: false,
      isFailed: true,
      presentationId: null,
      presentationOpenUrl: null,
      error: 'The generation provider returned an empty outline.',
    }),
    viewport: { width: 390, height: 860 },
    colorScheme: 'dark',
    expectations: {
      text: ['Verto AI generation', 'FAILED', 'Ask ChatGPT to retry', 'Needs retry'],
      stageCount: 8,
    },
  },
  {
    id: 'phase9h-deck-preview-dark-desktop',
    label: 'Deck preview - dark desktop',
    html: deckHtml,
    payload: deckPayload({ published: false, theme: 'Dark Elegance' }),
    viewport: { width: 1200, height: 900 },
    colorScheme: 'dark',
    expectations: {
      text: ['Verto AI deck', 'Open in Verto', 'Publish from chat', 'Refresh preview'],
      minSlides: 6,
    },
  },
  {
    id: 'phase9h-deck-publish-success-light-desktop',
    label: 'Publish success - light desktop',
    html: deckHtml,
    payload: deckPayload({ published: true, theme: 'Sunset Glow' }),
    viewport: { width: 1200, height: 900 },
    colorScheme: 'light',
    expectations: {
      text: ['Published', 'Copy share link', 'Refresh preview'],
      minSlides: 6,
    },
  },
  {
    id: 'phase9h-deck-preview-light-mobile',
    label: 'Deck preview - light mobile',
    html: deckHtml,
    payload: deckPayload({ published: false, theme: 'Sakura Blossom' }),
    viewport: { width: 390, height: 900 },
    colorScheme: 'light',
    expectations: {
      text: ['Verto AI deck', 'Open in Verto', 'Publish from chat'],
      minSlides: 6,
    },
  },
  {
    id: 'phase9h-action-result-publish-dark-desktop',
    label: 'Action result publish - dark desktop',
    html: actionResultHtml,
    payload: actionResultPayload({
      kind: 'publish',
      title: 'Presentation published',
      message: 'The deck is now publicly shareable.',
      published: true,
    }),
    viewport: { width: 1200, height: 900 },
    colorScheme: 'dark',
    expectations: {
      text: ['Verto AI result', 'Presentation published', 'Open in Verto', 'Preview with ChatGPT', 'Copy share link', 'Unpublish deck'],
    },
  },
  {
    id: 'phase9h-action-result-delete-light-mobile',
    label: 'Action result delete - light mobile',
    html: actionResultHtml,
    payload: actionResultPayload({
      kind: 'delete_permanently',
      title: 'Presentations permanently deleted',
      message: '2 presentations were permanently deleted.',
      affected: true,
    }),
    viewport: { width: 390, height: 900 },
    colorScheme: 'light',
    expectations: {
      text: ['Verto AI result', 'Presentations permanently deleted', 'Affected presentations', 'Operation summary'],
    },
  },
];

/**
 * Plan 10G F12 — contrast sampling matrix: representative catalog themes
 * across BOTH host schemes (plus a mobile pipeline pair), rendered through
 * the full deck-preview pipeline. The harness's per-element contrast,
 * keyboard, and overflow checks do the heavy lifting; every cell must pass.
 */
const MATRIX_THEMES = [
  'Default',
  'Dark Elegance',
  'Sunset Glow',
  'Neon Nights',
  'Arctic Aurora',
  'Sakura Blossom',
];

function themeSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

for (const theme of MATRIX_THEMES) {
  for (const colorScheme of ['light', 'dark']) {
    scenarios.push({
      id: `phase10g-matrix-${themeSlug(theme)}-${colorScheme}`,
      label: `Theme matrix ${theme} - ${colorScheme}`,
      html: deckHtml,
      payload: deckPayload({ published: false, theme, slides: richSlides() }),
      viewport: { width: 1200, height: 900 },
      colorScheme,
      expectations: {
        text: ['Verto AI deck', 'Open in Verto'],
        minSlides: 6,
      },
    });
  }
}

for (const combo of [
  { theme: 'Default', colorScheme: 'light' },
  { theme: 'Arctic Aurora', colorScheme: 'dark' },
]) {
  scenarios.push({
    id: `phase10g-matrix-mobile-${themeSlug(combo.theme)}-${combo.colorScheme}`,
    label: `Theme matrix mobile ${combo.theme} - ${combo.colorScheme}`,
    html: deckHtml,
    payload: deckPayload({ published: false, theme: combo.theme, slides: richSlides() }),
    viewport: { width: 390, height: 900 },
    colorScheme: combo.colorScheme,
    expectations: {
      text: ['Verto AI deck', 'Publish from chat'],
      minSlides: 6,
    },
  });
}

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox'],
});

const results = [];
let hasFailure = false;

for (const scenario of scenarios) {
  const page = await browser.newPage();
  const errors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  await page.setViewport({
    ...scenario.viewport,
    deviceScaleFactor: 1,
  });
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: scenario.colorScheme },
    { name: 'prefers-reduced-motion', value: 'reduce' },
  ]);
  await page.setContent(injectPayload(scenario.html, scenario.payload), {
    waitUntil: 'load',
  });

  await runInteractions(page, scenario);

  const screenshotFile = `${scenario.id}.png`;
  const screenshotPath = path.join(assetsDir, screenshotFile);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const analysis = await page.evaluate(runAccessibilityAndVisualChecks);
  const keyboard = await collectKeyboardOrder(page);
  const expectationFailures = await checkScenarioExpectations(page, scenario);

  const failures = [
    ...errors.map((message) => `Console/page error: ${message}`),
    ...analysis.failures,
    ...keyboard.failures,
    ...expectationFailures,
  ];

  const result = {
    id: scenario.id,
    label: scenario.label,
    screenshot: `docs/mcp-apps/submission-assets/${screenshotFile}`,
    viewport: scenario.viewport,
    colorScheme: scenario.colorScheme,
    failures,
    metrics: {
      focusableCount: keyboard.order.length,
      contrastChecked: analysis.metrics.contrastChecked,
      textElementCount: analysis.metrics.textElementCount,
      bodyTextLength: analysis.metrics.bodyTextLength,
      screenshotWidth: scenario.viewport.width,
    },
  };

  results.push(result);
  hasFailure = hasFailure || failures.length > 0;

  const status = failures.length > 0 ? '[FAIL]' : '[PASS]';
  console.log(`${status} ${scenario.label} -> ${result.screenshot}`);
  for (const failure of failures) {
    console.log(`       - ${failure}`);
  }

  await page.close();
}

await browser.close();

const report = {
  generatedAt: new Date().toISOString(),
  source: 'scripts/mcp-apps/phase9h-visual-qa.mjs',
  results,
};

await writeFile(reportJsonPath, JSON.stringify(report, null, 2), 'utf8');
await writeFile(reportMarkdownPath, buildMarkdownReport(report), 'utf8');

if (hasFailure) {
  console.error(`\nPhase 9H visual QA failed. See ${relative(reportJsonPath)}.`);
  process.exit(1);
}

console.log(`\nPhase 9H visual QA passed. Evidence written to ${relative(assetsDir)}.`);

function injectPayload(html, payload) {
  const safePayload = JSON.stringify(payload).replace(/<\/script/gi, '<\\/script');
  return html.replace(
    '<body>',
    `<body>\n<script>window.__VERTO_MCP_PAYLOAD__=${safePayload};</script>`
  );
}

/**
 * Plan 10F: scenarios may drive the widget into interactive states
 * (open the guided editor, type an edit) before evidence is captured.
 */
async function runInteractions(page, scenario) {
  for (const selector of scenario.preClicks ?? []) {
    await page.click(selector);
  }

  for (const step of scenario.setValueSteps ?? []) {
    await page.evaluate(
      ({ selector, value }) => {
        const element = document.querySelector(selector);

        if (!element) return;

        element.focus();
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      },
      { selector: step.selector, value: step.value }
    );
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
}

function generationPayload(options) {
  const presentation = options.presentationId && options.presentationOpenUrl
    ? {
        id: options.presentationId,
        openUrl: options.presentationOpenUrl,
      }
    : null;

  // Recent relative timestamps so Elapsed/Built-in chips read naturally.
  const createdAt = new Date(Date.now() - 95_000).toISOString();
  const completedAt = new Date(Date.now() - 4_000).toISOString();

  return {
    widget: {
      widget: 'generation_progress',
      version: 2,
      links: presentation
        ? {
            editorUrl: options.presentationOpenUrl,
            presentUrl: options.presentationOpenUrl.replace('/presentation/', '/present/'),
            shareUrl: null,
          }
        : { editorUrl: null, presentUrl: null, shareUrl: null },
      generation: {
        runId: 'run_demo_123456',
        topic: 'AI tutoring investor pitch deck',
        status: options.status,
        progress: options.progress,
        currentStepName: options.currentStepName,
        error: options.error,
        presentationId: options.presentationId,
        createdAt,
        completedAt: options.isComplete ? completedAt : null,
        updatedAt: new Date().toISOString(),
        isComplete: options.isComplete,
        isFailed: options.isFailed,
        pollHint: options.isComplete
          ? null
          : 'Generation is still running. Check again after a short delay.',
      },
      steps: generationSteps(options),
      ...(options.isComplete
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
        canRefresh: !options.isComplete && !options.isFailed,
        canOpenPresentation: Boolean(presentation),
        canInspectPresentation: Boolean(options.presentationId),
        canRetry: options.isFailed,
      },
    },
  };
}

/** Real run-step names/statuses mirroring GENERATION_STEP_DEFINITIONS. */
function generationSteps(options) {
  const definitions = [
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
    definitions.findIndex(([, name]) => name === options.currentStepName)
  );

  const stepStatus = (index) => {
    if (options.isComplete) return 'completed';
    if (options.isFailed) {
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

function deckPayload({ published, theme = 'Dark Elegance', slides = null }) {
  const openUrl = 'https://verto.ai.aditya-deokar.me/presentation/deck_demo_123';
  return {
    widget: {
      widget: 'deck_preview',
      version: 2,
      links: {
        editorUrl: openUrl,
        presentUrl: 'https://verto.ai.aditya-deokar.me/present/deck_demo_123',
        shareUrl: published
          ? 'https://verto.ai.aditya-deokar.me/share/deck_demo_123'
          : null,
      },
      presentation: {
        id: 'deck_demo_123',
        title: 'AI tutoring investor pitch deck',
        themeName: theme,
        slideCount: 7,
        updatedAt: '2026-06-18T00:00:00.000Z',
        isPublished: published,
        shareUrl: published
          ? 'https://verto.ai.aditya-deokar.me/share/deck_demo_123'
          : null,
        openUrl,
      },
      slides: slides ?? [
        { id: 's1', title: 'Market shift', order: 0, previewText: 'AI tutoring is becoming a daily learning layer for students, parents, and teachers.' },
        { id: 's2', title: 'Problem', order: 1, previewText: 'Students need immediate help, but human tutoring is expensive and hard to scale.' },
        { id: 's3', title: 'Product', order: 2, previewText: 'Personalized guidance, generated practice, and teacher-ready learning diagnostics.' },
        { id: 's4', title: 'Workflow', order: 3, previewText: 'Learners ask questions, Verto adapts the deck, and teachers review progress quickly.' },
        { id: 's5', title: 'Business model', order: 4, previewText: 'Subscription seats for tutoring centers, schools, and parent-led learning groups.' },
        { id: 's6', title: 'Go to market', order: 5, previewText: 'Start with tutoring centers and expand into homeschool networks and schools.' },
      ],
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

/**
 * Phase 10B fixture: one slide per renderer family, mirroring the dashboard
 * editor's ContentItem shapes (src/lib/types.ts + layout presets).
 */
function richSlides() {
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
            'Expansion in <em>enterprise</em> accounts drove the majority of new bookings this quarter & retention stayed above target.',
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
        { id: 'r6l', type: 'link', name: 'Link', link: 'https://verto.ai.aditya-deokar.me/docs', content: 'Read the launch docs' },
        {
          id: 'r6btn',
          type: 'customButton',
          name: 'Button',
          bgColor: '#ef4444',
          link: 'https://verto.ai.aditya-deokar.me',
          content: 'Open dashboard',
        },
      ],
    },
  ];
}

function deckLivePayload({ theme }) {
  return {
    widget: {
      widget: 'deck_live',
      version: 2,
      links: {
        editorUrl: 'https://verto.ai.aditya-deokar.me/presentation/deck_demo_123',
        presentUrl: 'https://verto.ai.aditya-deokar.me/present/deck_demo_123',
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

/**
 * Plan 10 F4 fixture: 30-entry catalog (24 visible + "show more" tail) with
 * a NEW-badged theme inside the first page and the current theme marked.
 */
function themeStudioPayload({ theme }) {
  const catalog = [
    { name: 'Default', type: 'light', bg: '#ffffff', accent: '#3b82f6', font: '#000000' },
    { name: 'Dark Elegance', type: 'dark', bg: 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)', accent: '#ffd700', font: '#ffffff' },
    { name: 'Nature Fresh', type: 'light', bg: '#e8f5e9', accent: '#4caf50', font: '#1b4332' },
    { name: 'Tech Vibrant', type: 'dark', bg: '#0d1117', accent: '#00e5ff', font: '#e6edf3' },
    { name: 'Pastel Dream', type: 'light', bg: '#fdf2f8', accent: '#ec4899', font: '#831843' },
    { name: 'Ocean Breeze', type: 'light', bg: '#e0f2fe', accent: '#0284c7', font: '#0c4a6e' },
    { name: 'Sunset Glow', type: 'light', bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', accent: '#f97316', font: '#7c2d12' },
    { name: 'Minimalist Mono', type: 'light', bg: '#fafafa', accent: '#171717', font: '#171717' },
    { name: 'Neon Nights', type: 'dark', bg: '#09090b', accent: '#a3e635', font: '#fafafa' },
    { name: 'Earthy Tones', type: 'light', bg: '#f5f5f4', accent: '#b45309', font: '#44403c' },
    { name: 'Retro Pop', type: 'light', bg: '#fef9c3', accent: '#e11d48', font: '#450a0a' },
    { name: 'Zen Garden', type: 'light', bg: '#ecfccb', accent: '#65a30d', font: '#365314' },
    { name: 'Arctic Frost', type: 'light', bg: '#f0f9ff', accent: '#38bdf8', font: '#0c4a6e' },
    { name: 'Vintage Warmth', type: 'light', bg: '#fefce8', accent: '#ca8a04', font: '#713f12' },
    { name: 'Cosmic Delight', type: 'dark', bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', accent: '#c084fc', font: '#ede9fe' },
    { name: 'Midnight Bloom', type: 'dark', bg: '#111827', accent: '#f472b6', font: '#f9fafb' },
    { name: 'Coral Sunset', type: 'light', bg: '#fff1f2', accent: '#fb7185', font: '#881337' },
    { name: 'Emerald City', type: 'dark', bg: '#022c22', accent: '#34d399', font: '#ecfdf5' },
    { name: 'Lavender Mist', type: 'light', bg: '#f5f3ff', accent: '#8b5cf6', font: '#4c1d95' },
    { name: 'Golden Hour', type: 'light', bg: '#fffbeb', accent: '#f59e0b', font: '#78350f' },
    { name: 'Arctic Aurora', type: 'dark', bg: 'linear-gradient(160deg, #172554 0%, #0f172a 100%)', accent: '#22d3ee', font: '#e0f2fe' },
    { name: 'Sakura Blossom', type: 'light', bg: '#fdf4ff', accent: '#d946ef', font: '#701a75' },
    { name: 'Urban Jungle', type: 'dark', bg: '#1c1917', accent: '#84cc16', font: '#fafaf9' },
    { name: 'Modern Dark', type: 'dark', bg: '#18181b', accent: '#60a5fa', font: '#fafafa', isNew: true },
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
      themes: [
        ...catalog.map((entry) => ({
          name: entry.name,
          colors: [entry.bg, entry.accent, entry.font],
          description: entry.type === 'dark' ? 'Dark theme' : 'Light theme',
          ...(entry.isNew ? { isNew: true } : {}),
        })),
        ...['Royal Sapphire', 'Terracotta Clay', 'Graphite Pro', 'Mint Cream', 'Nordic Fjord', 'Amber Glow'].map((name) => ({
          name,
          colors: ['#f8fafc', '#64748b', '#0f172a'],
          description: 'Light theme',
        })),
      ],
      actions: {
        canApplyTheme: true,
      },
    },
  };
}

function publishCardPayload({ published }) {
  const shareUrl = published
    ? 'https://verto.ai.aditya-deokar.me/share/deck_demo_123'
    : null;

  return {
    widget: {
      widget: 'publish_card',
      version: 2,
      links: {
        editorUrl: 'https://verto.ai.aditya-deokar.me/presentation/deck_demo_123',
        presentUrl: 'https://verto.ai.aditya-deokar.me/present/deck_demo_123',
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

function actionResultPayload({ kind, title, message, published = false, affected = false }) {
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
        shareUrl: published
          ? 'https://verto.ai.aditya-deokar.me/share/deck_demo_123'
          : null,
        openUrl: 'https://verto.ai.aditya-deokar.me/presentation/deck_demo_123',
      };

  const links = presentation
    ? {
        editorUrl: presentation.openUrl,
        presentUrl: 'https://verto.ai.aditya-deokar.me/present/deck_demo_123',
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

function listPayload() {
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
      presentations: presentations.map((presentation) => ({
        id: presentation.id,
        title: presentation.title,
        themeName: presentation.theme_name,
        slideCount: presentation.slide_count,
        updatedAt: presentation.updated_at,
        isPublished: presentation.is_published,
        isDeleted: presentation.is_deleted,
        shareUrl: presentation.share_url,
        openUrl: presentation.open_url,
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

function listPresentations() {
  return [
    {
      id: 'deck_workspace_001',
      title: 'Verto AI - AI-Native Presentation Workspace',
      theme_name: 'Charcoal Copper',
      slide_count: 16,
      updated_at: '2026-06-07T10:00:00.000Z',
      is_published: true,
      is_deleted: false,
      share_url: 'https://verto.ai.aditya-deokar.me/share/deck_workspace_001',
      open_url: 'https://verto.ai.aditya-deokar.me/presentation/deck_workspace_001',
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
      open_url: 'https://verto.ai.aditya-deokar.me/presentation/deck_workspace_002',
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
      open_url: 'https://verto.ai.aditya-deokar.me/presentation/deck_workspace_003',
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
      open_url: 'https://verto.ai.aditya-deokar.me/presentation/deck_workspace_004',
    },
    {
      id: 'deck_workspace_005',
      title: 'AI tutoring investor pitch',
      theme_name: 'Arctic Aurora',
      slide_count: 7,
      updated_at: '2026-06-07T06:00:00.000Z',
      is_published: true,
      is_deleted: false,
      share_url: 'https://verto.ai.aditya-deokar.me/share/deck_workspace_005',
      open_url: 'https://verto.ai.aditya-deokar.me/presentation/deck_workspace_005',
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
      open_url: 'https://verto.ai.aditya-deokar.me/presentation/deck_workspace_006',
    },
  ];
}

async function collectKeyboardOrder(page) {
  const focusables = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ))
      .filter((element) => {
        const styles = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          styles.display !== 'none'
          && styles.visibility !== 'hidden'
          && Number.parseFloat(styles.opacity) > 0
          && rect.width > 0
          && rect.height > 0
        );
      })
      .map((element) => element.id || element.textContent?.trim() || element.tagName);
  });
  const seen = [];

  for (let index = 0; index < focusables.length + 2; index += 1) {
    await page.keyboard.press('Tab');
    const active = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element || element === document.body) return '';
      const styles = window.getComputedStyle(element);
      const accessibleName = (
        element.getAttribute('aria-label')
        || document.getElementById(element.getAttribute('aria-labelledby') || '')?.textContent
        || element.textContent
        || element.getAttribute('title')
        || ''
      ).trim();
      return {
        id: element.id || '',
        label: accessibleName,
        outline: styles.outlineStyle,
        boxShadow: styles.boxShadow,
      };
    });

    if (active && typeof active === 'object' && active.label) {
      const key = active.id || active.label;
      if (!seen.some((item) => item.key === key)) {
        seen.push({ key, ...active });
      }
    }
  }

  const failures = [];
  if (focusables.length > 0 && seen.length === 0) {
    failures.push('Keyboard Tab did not reach any interactive control.');
  }

  for (const item of seen) {
    if (item.outline === 'none' && item.boxShadow === 'none') {
      failures.push(`Focused control lacks visible focus style: ${item.key}`);
    }
  }

  return { order: seen, failures };
}

async function checkScenarioExpectations(page, scenario) {
  const failures = [];
  const pageText = await page.evaluate(() => document.body.innerText);

  for (const text of scenario.expectations.text ?? []) {
    if (!pageText.includes(text)) {
      failures.push(`Expected visible text missing: ${text}`);
    }
  }

  if (scenario.expectations.stageCount != null) {
    const stageCount = await page.evaluate(() => document.querySelectorAll('.stage').length);
    if (stageCount !== scenario.expectations.stageCount) {
      failures.push(`Expected ${scenario.expectations.stageCount} stage cards, found ${stageCount}.`);
    }
  }

  if (scenario.expectations.minSlides != null) {
    const slideCount = await page.evaluate(() => document.querySelectorAll('.slide-card').length);
    if (slideCount < scenario.expectations.minSlides) {
      failures.push(`Expected at least ${scenario.expectations.minSlides} slide cards, found ${slideCount}.`);
    }
  }

  for (const [selector, expected] of Object.entries(scenario.expectations.rendererCounts ?? {})) {
    const actual = await page.evaluate(
      (sel) => document.querySelectorAll(sel).length,
      selector
    );
    if (actual !== expected) {
      failures.push(`Renderer snapshot mismatch: expected ${expected} × "${selector}", found ${actual}.`);
    }
  }

  for (const [selector, minimum] of Object.entries(scenario.expectations.minCounts ?? {})) {
    const actual = await page.evaluate(
      (sel) => document.querySelectorAll(sel).length,
      selector
    );
    if (actual < minimum) {
      failures.push(`Renderer minimum not met: expected ≥${minimum} × "${selector}", found ${actual}.`);
    }
  }

  for (const step of scenario.expectations.keyboardSteps ?? []) {
    for (const key of step.keys) {
      await page.keyboard.press(key);
    }
    await new Promise((resolve) => setTimeout(resolve, 120));

    if (step.expectCounter != null) {
      const counter = await page.evaluate(() => {
        const element = document.getElementById('counter');
        return element ? element.textContent.trim() : '';
      });
      if (counter !== step.expectCounter) {
        failures.push(`Keyboard step [${step.keys.join('+')}] expected counter "${step.expectCounter}", found "${counter}".`);
      }
    }

    if (step.expectCount != null) {
      const actual = await page.evaluate(
        (sel) => document.querySelectorAll(sel).length,
        step.expectCount.selector
      );
      if (actual !== step.expectCount.value) {
        failures.push(
          `Keyboard step [${step.keys.join('+')}] expected ${step.expectCount.value} × "${step.expectCount.selector}", found ${actual}.`
        );
      }
    }
  }

  if (scenario.expectations.minListRows != null) {
    const rowCount = await page.evaluate(() => document.querySelectorAll('.presentation-row').length);
    if (rowCount < scenario.expectations.minListRows) {
      failures.push(`Expected at least ${scenario.expectations.minListRows} presentation rows, found ${rowCount}.`);
    }
  }

  return failures;
}

function runAccessibilityAndVisualChecks() {
  const failures = [];
  const metrics = {
    bodyTextLength: document.body.innerText.trim().length,
    contrastChecked: 0,
    textElementCount: 0,
  };

  if (document.documentElement.lang !== 'en') {
    failures.push('Document language is not set to en.');
  }

  if (!document.querySelector('main')) {
    failures.push('Widget does not expose a main landmark.');
  }

  if (document.body.scrollWidth > document.documentElement.clientWidth + 1) {
    failures.push('Body has horizontal overflow.');
  }

  if (metrics.bodyTextLength < 120) {
    failures.push('Widget rendered too little visible text to be review evidence.');
  }

  const nestedScrollers = Array.from(document.querySelectorAll('body *'))
    .filter((element) => {
      const styles = window.getComputedStyle(element);
      const scrollable = /(auto|scroll)/.test(`${styles.overflow}${styles.overflowX}${styles.overflowY}`);
      return scrollable && (
        element.scrollWidth > element.clientWidth + 1
        || element.scrollHeight > element.clientHeight + 1
      );
    })
    .map(getElementLabel);

  if (nestedScrollers.length > 0) {
    failures.push(`Nested scrolling elements found: ${nestedScrollers.slice(0, 4).join(', ')}`);
  }

  const unlabeledControls = getFocusableElements()
    .filter((element) => !getAccessibleName(element))
    .map(getElementLabel);

  if (unlabeledControls.length > 0) {
    failures.push(`Interactive controls without labels: ${unlabeledControls.join(', ')}`);
  }

  const missingSectionLabels = Array.from(document.querySelectorAll('section, aside'))
    .filter((element) => !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby'))
    .map(getElementLabel);

  if (missingSectionLabels.length > 0) {
    failures.push(`Sections/asides without accessible labels: ${missingSectionLabels.join(', ')}`);
  }

  const interactiveOverflow = getFocusableElements()
    .filter((element) => element.scrollWidth > element.clientWidth + 1)
    .map(getElementLabel);

  if (interactiveOverflow.length > 0) {
    failures.push(`Interactive text overflows its control: ${interactiveOverflow.join(', ')}`);
  }

  const reducedMotionFailures = Array.from(
    document.querySelectorAll('.stage.current .stage-dot, .progress-fill')
  )
    .filter((element) => {
      const styles = window.getComputedStyle(element);
      return hasMotion(styles.animationDuration) || hasMotion(styles.transitionDuration);
    })
    .map(getElementLabel);

  if (reducedMotionFailures.length > 0) {
    failures.push(`Reduced-motion mode still has animation/transition: ${reducedMotionFailures.join(', ')}`);
  }

  for (const element of Array.from(document.body.querySelectorAll('*'))) {
    const ownText = Array.from(element.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!ownText || !isVisible(element)) continue;

    metrics.textElementCount += 1;

    const styles = window.getComputedStyle(element);
    if (Number.parseFloat(styles.opacity) < 0.74) continue;
    if (element.matches('[aria-disabled="true"], :disabled')) continue;

    const textColor = parseRgb(styles.color);
    const backgroundColor = getEffectiveBackground(element);
    if (!textColor || !backgroundColor) continue;

    const ratio = contrastRatio(textColor, backgroundColor);
    const fontSize = Number.parseFloat(styles.fontSize);
    const fontWeight = Number.parseInt(styles.fontWeight, 10) || 400;
    const required = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700) ? 3 : 4.5;

    metrics.contrastChecked += 1;
    if (ratio < required) {
      failures.push(
        `Low contrast (${ratio.toFixed(2)}:1, need ${required}:1) on ${getElementLabel(element)}: "${ownText.slice(0, 48)}"`
      );
    }
  }

  return { failures, metrics };

  function getFocusableElements() {
    return Array.from(document.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(isVisible);
  }

  function getAccessibleName(element) {
    return (
      element.getAttribute('aria-label')
      || document.getElementById(element.getAttribute('aria-labelledby') || '')?.textContent
      || element.textContent
      || element.getAttribute('title')
      || ''
    ).trim();
  }

  function isVisible(element) {
    const styles = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return (
      styles.display !== 'none'
      && styles.visibility !== 'hidden'
      && Number.parseFloat(styles.opacity) > 0
      && rect.width > 0
      && rect.height > 0
    );
  }

  function getElementLabel(element) {
    const id = element.id ? `#${element.id}` : '';
    const className = typeof element.className === 'string' && element.className
      ? `.${element.className.trim().replace(/\s+/g, '.')}`
      : '';
    return `${element.tagName.toLowerCase()}${id}${className}`;
  }

  function hasMotion(durationList) {
    return durationList.split(',')
      .map((duration) => duration.trim())
      .some((duration) => {
        if (duration.endsWith('ms')) return Number.parseFloat(duration) > 0;
        if (duration.endsWith('s')) return Number.parseFloat(duration) > 0;
        return false;
      });
  }

  function getEffectiveBackground(element) {
    let current = element;
    while (current && current instanceof Element) {
      const color = parseRgb(window.getComputedStyle(current).backgroundColor);
      if (color && color.a > 0.94) {
        return color;
      }
      current = current.parentElement;
    }

    return parseRgb(window.getComputedStyle(document.body).backgroundColor)
      || { r: 255, g: 255, b: 255, a: 1 };
  }

  function parseRgb(value) {
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;

    const parts = match[1].split(/\s*,\s*|\s+/)
      .filter((part) => part !== '/')
      .map((part) => part.trim());
    const [r, g, b] = parts.slice(0, 3).map(Number.parseFloat);
    const alpha = parts[3] == null ? 1 : Number.parseFloat(parts[3]);

    if (![r, g, b].every(Number.isFinite)) return null;
    return { r, g, b, a: Number.isFinite(alpha) ? alpha : 1 };
  }

  function contrastRatio(a, b) {
    const l1 = relativeLuminance(a);
    const l2 = relativeLuminance(b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function relativeLuminance(color) {
    const values = [color.r, color.g, color.b].map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });

    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  }
}

function buildMarkdownReport(report) {
  const lines = [
    '# Phase 9H Visual QA Evidence',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'Automated checks covered: console errors, keyboard reachability, focus visibility, interactive labels, section labels, text contrast, reduced motion, horizontal overflow, nested scrolling, and expected scenario content.',
    '',
    '| Scenario | Theme | Viewport | Result | Screenshot |',
    '| --- | --- | --- | --- | --- |',
  ];

  for (const result of report.results) {
    lines.push([
      result.label,
      result.colorScheme,
      `${result.viewport.width} x ${result.viewport.height}`,
      result.failures.length === 0 ? 'PASS' : `FAIL (${result.failures.length})`,
      result.screenshot,
    ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
  }

  lines.push('', '## Manual ChatGPT Evidence Still Needed', '');
  lines.push('- `chatgpt-01-connect-success.png`: capture the connected Verto AI app in ChatGPT developer mode.');
  lines.push('- `chatgpt-02a-presentation-list-ui.png`: capture the live ChatGPT-rendered presentation list widget after `List my Verto presentations`.');
  lines.push('- `chatgpt-02-generate-result.png`: capture the tool result after a generation prompt.');
  lines.push('- `chatgpt-03-progress-ui.png`: capture the live ChatGPT-rendered generation progress widget.');
  lines.push('- `chatgpt-04-deck-preview.png`: capture the live ChatGPT-rendered deck preview widget.');
  lines.push('- `chatgpt-05-publish-link.png`: capture the publish/share-link result.');
  lines.push('');

  return `${lines.join('\n')}\n`;
}

function relative(filePath) {
  return path.relative(root, filePath).replace(/\\/g, '/');
}
