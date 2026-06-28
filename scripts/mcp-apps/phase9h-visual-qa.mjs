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

const scenarios = [
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
      currentStepName: 'Design Layout',
      isComplete: false,
      isFailed: false,
      presentationId: null,
      presentationOpenUrl: null,
      error: null,
    }),
    viewport: { width: 1200, height: 900 },
    colorScheme: 'dark',
    expectations: {
      text: ['Verto AI generation', '68%', 'Design Layout', 'Check status'],
      stageCount: 6,
    },
  },
  {
    id: 'phase9h-generation-complete-light-desktop',
    label: 'Generation complete - light desktop',
    html: generationHtml,
    payload: generationPayload({
      status: 'COMPLETED',
      progress: 100,
      currentStepName: 'Complete',
      isComplete: true,
      isFailed: false,
      presentationId: 'deck_demo_123',
      presentationOpenUrl: 'https://verto.ai.aditya-deokar.me/presentation/deck_demo_123',
      error: null,
    }),
    viewport: { width: 1200, height: 900 },
    colorScheme: 'light',
    expectations: {
      text: ['Verto AI generation', '100%', 'Open deck', 'Inspect with ChatGPT'],
      stageCount: 6,
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
      stageCount: 6,
    },
  },
  {
    id: 'phase9h-deck-preview-dark-desktop',
    label: 'Deck preview - dark desktop',
    html: deckHtml,
    payload: deckPayload({ published: false }),
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
    payload: deckPayload({ published: true }),
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
    payload: deckPayload({ published: false }),
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

function generationPayload(options) {
  const presentation = options.presentationId && options.presentationOpenUrl
    ? {
        id: options.presentationId,
        openUrl: options.presentationOpenUrl,
      }
    : null;

  return {
    widget: {
      widget: 'generation_progress',
      version: 1,
      generation: {
        runId: 'run_demo_123456',
        topic: 'AI tutoring investor pitch deck',
        status: options.status,
        progress: options.progress,
        currentStepName: options.currentStepName,
        error: options.error,
        presentationId: options.presentationId,
        updatedAt: '2026-06-18T00:00:00.000Z',
        isComplete: options.isComplete,
        isFailed: options.isFailed,
        pollHint: options.isComplete
          ? null
          : 'Generation is still running. Check again after a short delay.',
      },
      steps: [
        { id: 'queued', name: 'Project Setup', status: 'completed' },
        { id: 'outline', name: 'Structure', status: 'completed' },
        { id: 'content', name: 'Content Writing', status: options.isFailed ? 'failed' : 'completed' },
        { id: 'design', name: 'Design Layout', status: options.isComplete ? 'completed' : 'running' },
        { id: 'finalizing', name: 'Assembly', status: options.isComplete ? 'completed' : 'pending' },
        { id: 'complete', name: 'Finalization', status: options.isComplete ? 'completed' : 'pending' },
      ],
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

function deckPayload({ published }) {
  return {
    widget: {
      widget: 'deck_preview',
      version: 1,
      presentation: {
        id: 'deck_demo_123',
        title: 'AI tutoring investor pitch deck',
        themeName: 'Aurora',
        slideCount: 7,
        updatedAt: '2026-06-18T00:00:00.000Z',
        isPublished: published,
        shareUrl: published
          ? 'https://verto.ai.aditya-deokar.me/share/deck_demo_123'
          : null,
        openUrl: 'https://verto.ai.aditya-deokar.me/presentation/deck_demo_123',
      },
      slides: [
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
        themeName: 'Aurora',
        slideCount: 7,
        updatedAt: '2026-06-18T00:00:00.000Z',
        isPublished: published,
        isDeleted: false,
        shareUrl: published
          ? 'https://verto.ai.aditya-deokar.me/share/deck_demo_123'
          : null,
        openUrl: 'https://verto.ai.aditya-deokar.me/presentation/deck_demo_123',
      };

  return {
    widget: {
      widget: 'action_result',
      version: 1,
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
      version: 1,
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
      theme_name: 'Aurora',
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
      theme_name: 'Clean Startup',
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
