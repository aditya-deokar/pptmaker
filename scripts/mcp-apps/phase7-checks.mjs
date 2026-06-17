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

check(
  'all presentation tools call registerPresentationTool',
  countMatches(toolIndex, /\n\s*registerPresentationTool\(/g) === tools.length,
  `found ${countMatches(toolIndex, /\n\s*registerPresentationTool\(/g)}`
);
check('tools use SDK registerTool API', toolIndex.includes('server.registerTool('));
check('tool UI metadata helper is used', toolIndex.includes('createToolUiMeta('));
check('scope checker requires every requested scope', scopes.includes('requiredScopes.every'));
check('unknown scopes are rejected during parsing', scopes.includes('invalidScopes.push'));
check('permanent delete requires z.literal(true) in live registration', toolIndex.includes('confirm: z.literal(true)'));
check('permanent delete requires z.literal(true) in shared schema', schemas.includes('confirm: z.literal(true)'));
check('OAuth connected generation limit is 15', constants.includes('OAUTH_CONNECTED_GENERATION_LIMIT: 15'));
check('generation timeout returns before host timeout by default', constants.includes('GENERATION_DEFAULT_WAIT_TIMEOUT_MS: 25_000'));

check('generation progress UI URI is defined', appUiConstants.includes("'ui://verto/generation-progress.html'"));
check('deck preview UI URI is defined', appUiConstants.includes("'ui://verto/deck-preview.html'"));
check('UI resources serve text/html', appUiResources.includes("mimeType: 'text/html'"));
check('UI resources include CSP metadata', appUiConstants.includes("'ui/csp'"));
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
