#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checks = [];

const tools = [
  {
    key: 'PRESENTATION_LIST',
    name: 'presentation_list',
    scope: 'presentations:read',
    readOnly: true,
    destructive: false,
  },
  {
    key: 'PRESENTATION_GET',
    name: 'presentation_get',
    scope: 'presentations:read',
    readOnly: true,
    destructive: false,
  },
  {
    key: 'PRESENTATION_CREATE',
    name: 'presentation_create',
    scope: 'presentations:write',
    readOnly: false,
    destructive: false,
  },
  {
    key: 'PRESENTATION_GENERATE',
    name: 'presentation_generate',
    scope: 'presentations:generate',
    readOnly: false,
    destructive: false,
    ui: 'MCP_APP_UI_RESOURCE_URIS.GENERATION_PROGRESS',
  },
  {
    key: 'PRESENTATION_GENERATION_STATUS',
    name: 'presentation_generation_status',
    scope: 'presentations:generate',
    readOnly: true,
    destructive: false,
    ui: 'MCP_APP_UI_RESOURCE_URIS.GENERATION_PROGRESS',
  },
  {
    key: 'PRESENTATION_UPDATE_SLIDES',
    name: 'presentation_update_slides',
    scope: 'presentations:write',
    readOnly: false,
    destructive: false,
  },
  {
    key: 'PRESENTATION_UPDATE_THEME',
    name: 'presentation_update_theme',
    scope: 'presentations:write',
    readOnly: false,
    destructive: false,
  },
  {
    key: 'PRESENTATION_PUBLISH',
    name: 'presentation_publish',
    scope: 'presentations:publish',
    readOnly: false,
    destructive: false,
  },
  {
    key: 'PRESENTATION_UNPUBLISH',
    name: 'presentation_unpublish',
    scope: 'presentations:publish',
    readOnly: false,
    destructive: false,
  },
  {
    key: 'PRESENTATION_DELETE',
    name: 'presentation_delete',
    scope: 'presentations:write',
    readOnly: false,
    destructive: false,
  },
  {
    key: 'PRESENTATION_RECOVER',
    name: 'presentation_recover',
    scope: 'presentations:write',
    readOnly: false,
    destructive: false,
  },
  {
    key: 'PRESENTATION_DELETE_PERMANENTLY',
    name: 'presentation_delete_permanently',
    scope: 'presentations:write',
    readOnly: false,
    destructive: true,
  },
];

function fromRoot(filePath) {
  return path.join(root, filePath);
}

function read(filePath) {
  return readFileSync(fromRoot(filePath), 'utf8');
}

function exists(filePath) {
  return existsSync(fromRoot(filePath));
}

function check(name, pass, detail = '') {
  checks.push({ name, pass: Boolean(pass), detail });
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function blockFor(text, key) {
  const pattern = new RegExp(
    `\\[TOOL_NAMES\\.${escapeRegex(key)}\\]: \\{[\\s\\S]*?(?=\\n  \\[TOOL_NAMES\\.|\\n\\};)`,
    'm'
  );
  return text.match(pattern)?.[0] ?? '';
}

function countMatches(text, pattern) {
  return text.match(pattern)?.length ?? 0;
}

const requiredFiles = [
  'src/mcp/config/constants.ts',
  'src/mcp/auth/scopes.ts',
  'src/mcp/security/tool-policy.ts',
  'src/mcp/tools/presentation/index.ts',
  'src/mcp/tools/presentation/schemas.ts',
  'src/mcp/transport/http.ts',
  'src/mcp/transport/stdio.ts',
  'src/mcp/transport/health.ts',
  'src/mcp/resources/app-ui.ts',
  'src/mcp/apps/constants.ts',
  'src/mcp/apps/widget-data.ts',
  'src/mcp/apps/widgets.ts',
  'src/mcp/apps/components/shared/runtime.ts',
  'src/mcp/apps/components/generation-progress.ts',
  'src/mcp/apps/components/deck-preview.ts',
  'src/mcp/apps/generated/index.ts',
  'src/mcp/apps/generated/generation-progress.ts',
  'src/mcp/apps/generated/deck-preview.ts',
  'src/mcp/apps/generated/generation-progress.html',
  'src/mcp/apps/generated/deck-preview.html',
  'src/mcp/tools/_shared/response.ts',
  'src/app/mcp/route.ts',
  'src/app/mcp/health/route.ts',
  'src/app/api/mcp/route.ts',
  'src/app/api/mcp/health/route.ts',
  'src/app/api/mcp/oauth-protected-resource/metadata.ts',
  'src/app/api/oauth/authorization-server/route.ts',
  'src/app/oauth/authorize/route.ts',
  'src/app/oauth/token/route.ts',
  'src/app/oauth/revoke/route.ts',
  'src/app/oauth/register/route.ts',
  'docs/mcp-apps/05-tool-review-matrix.md',
  'docs/mcp-apps/06-security-privacy-observability.md',
  'docs/mcp-apps/07-testing-plan.md',
  'scripts/mcp-apps/build-widgets.mjs',
];

for (const filePath of requiredFiles) {
  check(`required file exists: ${filePath}`, exists(filePath));
}

const constants = read('src/mcp/config/constants.ts');
const scopes = read('src/mcp/auth/scopes.ts');
const toolIndex = read('src/mcp/tools/presentation/index.ts');
const toolPolicy = read('src/mcp/security/tool-policy.ts');
const schemas = read('src/mcp/tools/presentation/schemas.ts');
const httpTransport = read('src/mcp/transport/http.ts');
const stdioTransport = read('src/mcp/transport/stdio.ts');
const appUiResources = read('src/mcp/resources/app-ui.ts');
const appUiConstants = read('src/mcp/apps/constants.ts');
const appUiWidgetData = read('src/mcp/apps/widget-data.ts');
const appUiWidgets = read('src/mcp/apps/widgets.ts');
const appUiRuntime = read('src/mcp/apps/components/shared/runtime.ts');
const generationWidgetSource = read('src/mcp/apps/components/generation-progress.ts');
const deckWidgetSource = read('src/mcp/apps/components/deck-preview.ts');
const generatedWidgetIndex = read('src/mcp/apps/generated/index.ts');
const generatedGenerationHtml = read('src/mcp/apps/generated/generation-progress.html');
const generatedDeckHtml = read('src/mcp/apps/generated/deck-preview.html');
const responseBuilders = read('src/mcp/tools/_shared/response.ts');
const presentationGet = read('src/mcp/tools/presentation/get.ts');
const presentationGenerate = read('src/mcp/tools/presentation/generate.ts');
const presentationGenerationStatus = read('src/mcp/tools/presentation/generation-status.ts');
const packageJson = read('package.json');
const widgetBuildScript = read('scripts/mcp-apps/build-widgets.mjs');
const protectedResourceMetadata = read('src/app/api/mcp/oauth-protected-resource/metadata.ts');
const prismaSchema = read('prisma/schema.prisma');
const readme = read('docs/mcp-apps/README.md');
const implementationPlan = read('docs/mcp-apps/implementation.md');
const testingPlan = read('docs/mcp-apps/07-testing-plan.md');

check('tool count remains 12', tools.length === 12);

for (const tool of tools) {
  check(
    `TOOL_NAMES exports ${tool.name}`,
    constants.includes(`${tool.key}: '${tool.name}'`)
  );

  const metadataBlock = blockFor(toolIndex, tool.key);
  check(`metadata exists for ${tool.name}`, metadataBlock.length > 0);
  check(`metadata title exists for ${tool.name}`, /title:\s*'[^']+'/.test(metadataBlock));
  check(
    `readOnlyHint is correct for ${tool.name}`,
    metadataBlock.includes(`readOnlyHint: ${tool.readOnly}`)
  );
  check(
    `destructiveHint is correct for ${tool.name}`,
    metadataBlock.includes(`destructiveHint: ${tool.destructive}`)
  );

  if (tool.ui) {
    check(`UI resource is attached to ${tool.name}`, metadataBlock.includes(tool.ui));
  }

  check(
    `scope map covers ${tool.name}`,
    new RegExp(
      `case TOOL_NAMES\\.${escapeRegex(tool.key)}:[\\s\\S]*?return \\['${escapeRegex(tool.scope)}'\\]`
    ).test(scopes)
  );

  const policyBlock = blockFor(toolPolicy, tool.key);
  check(`security policy exists for ${tool.name}`, policyBlock.length > 0);
  check(
    `security policy destructive flag is correct for ${tool.name}`,
    policyBlock.includes(`destructive: ${tool.destructive}`)
  );
  check(
    `security policy scopes come from scope map for ${tool.name}`,
    policyBlock.includes(`getRequiredScopesForTool(TOOL_NAMES.${tool.key})`)
  );
}

for (const key of [
  'PRESENTATION_GET',
  'PRESENTATION_PUBLISH',
  'PRESENTATION_GENERATION_STATUS',
]) {
  check(`${key} is explicitly app-callable`, blockFor(toolIndex, key).includes('appCallable: true'));
}

check(
  'unsafe broad mutation tools are not app-callable',
  [
    'PRESENTATION_CREATE',
    'PRESENTATION_DELETE',
    'PRESENTATION_RECOVER',
    'PRESENTATION_DELETE_PERMANENTLY',
    'PRESENTATION_UPDATE_SLIDES',
    'PRESENTATION_UPDATE_THEME',
    'PRESENTATION_UNPUBLISH',
    'PRESENTATION_GENERATE',
  ].every((key) => !blockFor(toolIndex, key).includes('appCallable: true'))
);

check(
  'all presentation tools call registerPresentationTool',
  countMatches(toolIndex, /\n\s*registerPresentationTool\(/g) === tools.length,
  `found ${countMatches(toolIndex, /\n\s*registerPresentationTool\(/g)}`
);
check('tools use SDK registerTool API', toolIndex.includes('server.registerTool('));
check('presentation tools declare structured output schema', toolIndex.includes('outputSchema: MCP_SUCCESS_OUTPUT_SCHEMA'));
check('tool UI metadata helper is used', toolIndex.includes('createToolUiMeta('));
check('scope checker requires every requested scope', scopes.includes('requiredScopes.every'));
check('unknown scopes are rejected during parsing', scopes.includes('invalidScopes.push'));
check('permanent delete requires z.literal(true) in live registration', toolIndex.includes('confirm: z.literal(true)'));
check('permanent delete requires z.literal(true) in shared schema', schemas.includes('confirm: z.literal(true)'));
check('OAuth connected generation limit is 15', constants.includes('OAUTH_CONNECTED_GENERATION_LIMIT: 15'));
check('generation timeout returns before host timeout by default', constants.includes('GENERATION_DEFAULT_WAIT_TIMEOUT_MS: 25_000'));

check('generation progress UI URI is defined', appUiConstants.includes("'ui://verto/generation-progress.html'"));
check('deck preview UI URI is defined', appUiConstants.includes("'ui://verto/deck-preview.html'"));
check('UI resources serve MCP app HTML MIME', appUiConstants.includes("'text/html;profile=mcp-app'") && appUiResources.includes('MCP_APP_UI_MIME_TYPE'));
check('UI resources include CSP metadata', appUiConstants.includes("'ui/csp'"));
check('UI resource content includes metadata', appUiResources.includes('_meta: createUiResourceContentMeta('));
check('UI resource content includes widget domain metadata', appUiConstants.includes("'openai/widgetDomain'") && appUiConstants.includes('domain,'));
check('widget provider imports generated HTML', appUiWidgets.includes("from './generated'") && appUiWidgets.includes('GENERATION_PROGRESS_WIDGET_HTML'));
check('generated widget index exports both widgets', generatedWidgetIndex.includes('GENERATION_PROGRESS_WIDGET_HTML') && generatedWidgetIndex.includes('DECK_PREVIEW_WIDGET_HTML'));
check('generated widget HTML is MCP app iframe-ready', generatedGenerationHtml.includes('<!doctype html>') && generatedGenerationHtml.includes('ui/notifications/tool-result') && generatedDeckHtml.includes('<!doctype html>'));
check('generated widgets are within Phase 9C size budgets', Buffer.byteLength(generatedGenerationHtml, 'utf8') <= 120 * 1024 && Buffer.byteLength(generatedDeckHtml, 'utf8') <= 180 * 1024);
check('package exposes widget build script', packageJson.includes('"mcp:apps:build"') && packageJson.includes('"mcp:apps:check"'));
check('package declares esbuild dev dependency', packageJson.includes('"esbuild": "0.27.2"'));
check('Phase 7 runs generated widget freshness check', packageJson.includes('npm run mcp:apps:check'));
check('widget build script bundles with esbuild', widgetBuildScript.includes("from 'esbuild'") && widgetBuildScript.includes('budgetBytes'));
check('tool UI metadata includes Apps bridge visibility', appUiConstants.includes('visibility:') && appUiConstants.includes("['model', 'app']"));
check('tool UI metadata includes OpenAI output template', appUiConstants.includes("'openai/outputTemplate'"));
check('tool UI metadata supports app-callable allowlist', appUiConstants.includes('appCallable') && appUiConstants.includes("'openai/widgetAccessible': appCallable"));
check('tool UI metadata keeps non-callable tools model-only', appUiConstants.includes("visibility: appCallable ? ['model', 'app'] : ['model']"));
check('success responses include structuredContent', responseBuilders.includes('structuredContent') && responseBuilders.includes('success: true'));
check('success responses can carry widget contracts', responseBuilders.includes('widget?: McpAppWidgetData') && responseBuilders.includes('widget: options.widget'));
check('success output schema allows widget data', responseBuilders.includes('MCP_SUCCESS_OUTPUT_SCHEMA') && responseBuilders.includes('widget: z.any().optional()'));
check('deck preview widget data contract exists', appUiWidgetData.includes('interface DeckPreviewWidgetData') && appUiWidgetData.includes("widget: 'deck_preview'"));
check('deck preview widget data contract includes refresh action', appUiWidgetData.includes('canRefresh: boolean'));
check('generation progress widget data contract exists', appUiWidgetData.includes('interface GenerationProgressWidgetData') && appUiWidgetData.includes("widget: 'generation_progress'"));
check('future publish and theme widget contracts exist', appUiWidgetData.includes('interface PublishCardWidgetData') && appUiWidgetData.includes('interface ThemeStudioWidgetData'));
check('deck widget mapper limits slide previews', appUiWidgetData.includes('MAX_DECK_PREVIEW_SLIDES') && appUiWidgetData.includes('MAX_PREVIEW_TEXT_LENGTH'));
check('presentation_get emits deck widget data', presentationGet.includes('createDeckPreviewWidgetData') && presentationGet.includes('widget: createDeckPreviewWidgetData(presentation)'));
check('presentation_generate emits generation widget data', presentationGenerate.includes('createGenerationProgressWidgetData') && presentationGenerate.includes('widget: createGenerationProgressWidgetData'));
check('presentation_generation_status emits generation widget data', presentationGenerationStatus.includes('createGenerationProgressWidgetData') && presentationGenerationStatus.includes('widget: createGenerationProgressWidgetData(statusPayload)'));
check('widget runtime listens for MCP Apps tool result notification', appUiRuntime.includes('ui/notifications/tool-result'));
check('widget runtime renders from structuredContent', appUiRuntime.includes('structuredContent') || appUiRuntime.includes('structured_content'));
check('widget runtime can call MCP tools from UI', appUiRuntime.includes('callMcpTool') && appUiRuntime.includes("'tools/call'") && appUiRuntime.includes("'ui/initialize'"));
check('widget runtime supports ChatGPT follow-up messages', appUiRuntime.includes('sendFollowUpMessage') && appUiRuntime.includes("'ui/message'"));
check('widget runtime times out UI tool calls', appUiRuntime.includes('TOOL_CALL_TIMEOUT_MS') && appUiRuntime.includes('pendingRequests'));
check('widget sources prefer explicit widget contracts', generationWidgetSource.includes('payload.widget') && deckWidgetSource.includes('payload.widget'));
check('widget runtime verifies parent postMessage source', appUiRuntime.includes('event.source !== window.parent'));
check('premium deck preview has cover preview surface', deckWidgetSource.includes('cover-preview') && deckWidgetSource.includes('renderCover'));
check('premium deck preview has metadata badges', deckWidgetSource.includes('badge-row') && deckWidgetSource.includes('formatUpdatedAt'));
check('premium deck preview has action CTAs', deckWidgetSource.includes('Open in Verto') && deckWidgetSource.includes('copyShareLink') && deckWidgetSource.includes('Publish from chat'));
check('premium deck preview refreshes through safe tool call', deckWidgetSource.includes("callMcpTool('presentation_get'") && deckWidgetSource.includes('Refresh preview'));
check('premium deck preview publishes only after confirmation', deckWidgetSource.includes("callMcpTool('presentation_publish'") && deckWidgetSource.includes('Confirm publish'));
check('premium deck preview has filmstrip layout', deckWidgetSource.includes('filmstrip-grid') && deckWidgetSource.includes('renderSlides'));
check('premium deck preview handles loading and partial states', deckWidgetSource.includes('renderLoading') && deckWidgetSource.includes('Slide previews are not available yet'));
check('premium deck preview includes responsive mobile layout', deckWidgetSource.includes('@media (max-width: 560px)'));
check('premium generation progress has progress surface', generationWidgetSource.includes('progress-panel') && generationWidgetSource.includes('progress-percent') && generationWidgetSource.includes('progress-fill'));
check('premium generation progress has six-stage timeline', generationWidgetSource.includes('DISPLAY_STAGES') && generationWidgetSource.includes("id: 'queued'") && generationWidgetSource.includes("id: 'complete'"));
check('premium generation progress has failure recovery state', generationWidgetSource.includes('error-card') && generationWidgetSource.includes('Ask ChatGPT to retry generation'));
check('premium generation progress has final deck action', generationWidgetSource.includes('Open deck') && generationWidgetSource.includes('presentationOpenUrl'));
check('premium generation progress refreshes through safe tool call', generationWidgetSource.includes("callMcpTool('presentation_generation_status'") && generationWidgetSource.includes('Check status'));
check('premium generation progress uses follow-up for inspect and retry', generationWidgetSource.includes('sendFollowUpMessage') && generationWidgetSource.includes('Inspect Verto presentation') && generationWidgetSource.includes('Retry the Verto presentation'));
check('premium generation progress respects reduced motion', generationWidgetSource.includes('prefers-reduced-motion'));
check('premium generation progress includes responsive layout', generationWidgetSource.includes('@media (max-width: 700px)') && generationWidgetSource.includes('@media (max-width: 440px)'));
check('HTTP transport registers app UI resources', httpTransport.includes("import '../resources/app-ui'"));
check('stdio transport registers app UI resources', stdioTransport.includes("import '../resources/app-ui'"));

check('GET /mcp advertises health endpoint', httpTransport.includes('health_endpoint'));
check('GET /mcp advertises rate limit metadata', httpTransport.includes('rate_limits'));
check('GET /mcp advertises output limits', httpTransport.includes('output_limits'));
check('protected resource metadata exposes scopes', protectedResourceMetadata.includes('scopes_supported'));
check('protected resource metadata exposes authorization server', protectedResourceMetadata.includes('authorization_servers'));

for (const modelName of [
  'McpOAuthClient',
  'McpOAuthAuthorizationCode',
  'McpOAuthAccessToken',
  'McpOAuthRefreshToken',
]) {
  check(`Prisma schema includes ${modelName}`, prismaSchema.includes(`model ${modelName}`));
}

check('README references Phase 7 testing plan', readme.includes('07-testing-plan.md'));
check('implementation plan marks auth helper tests complete', implementationPlan.includes('[x] Add automated tests for auth helpers and scope checks.'));
check('implementation plan keeps live host testing visible', implementationPlan.includes('[ ] Run ChatGPT developer mode test.'));
check('testing plan includes MCP Inspector steps', testingPlan.includes('MCP Inspector'));
check('testing plan includes ChatGPT developer mode steps', testingPlan.includes('ChatGPT Developer Mode'));
check('testing plan includes Claude custom connector steps', testingPlan.includes('Claude Custom Connector'));
check('testing plan includes reviewer account', testingPlan.includes('adityadeokar80@gmail.com'));

const failures = checks.filter((entry) => !entry.pass);

console.log('MCP Apps Phase 7 checks');
console.log('=======================');

for (const entry of checks) {
  const prefix = entry.pass ? '[PASS]' : '[FAIL]';
  const detail = entry.detail ? ` (${entry.detail})` : '';
  console.log(`${prefix} ${entry.name}${detail}`);
}

if (failures.length > 0) {
  console.error(`\n${failures.length} Phase 7 check(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${checks.length} Phase 7 checks passed.`);
