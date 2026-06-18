#!/usr/bin/env node

import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();

const candidateFiles = [
  'src/lib/mcp-client-guide.ts',
  'src/mcp/config/constants.ts',
  'src/mcp/config/env.ts',
  'src/mcp/auth/api-key.ts',
  'src/mcp/auth/clerk-session.ts',
  'src/mcp/auth/middleware.ts',
  'src/mcp/auth/oauth-clients.ts',
  'src/mcp/auth/oauth-config.ts',
  'src/mcp/auth/oauth-metadata.ts',
  'src/mcp/auth/oauth-tokens.ts',
  'src/mcp/auth/oauth-users.ts',
  'src/mcp/auth/scopes.ts',
  'src/mcp/auth/types.ts',
  'src/mcp/security/tool-policy.ts',
  'src/mcp/middleware/audit-logger.ts',
  'src/mcp/middleware/error-handler.ts',
  'src/mcp/middleware/rate-limiter.ts',
  'src/mcp/middleware/request-context.ts',
  'src/mcp/tools/_shared/errors.ts',
  'src/mcp/tools/_shared/pagination.ts',
  'src/mcp/tools/_shared/response.ts',
  'src/mcp/tools/presentation/create.ts',
  'src/mcp/tools/presentation/delete-permanently.ts',
  'src/mcp/tools/presentation/delete.ts',
  'src/mcp/tools/presentation/generate.ts',
  'src/mcp/tools/presentation/generation-status.ts',
  'src/mcp/tools/presentation/get.ts',
  'src/mcp/tools/presentation/index.ts',
  'src/mcp/tools/presentation/list.ts',
  'src/mcp/tools/presentation/mappers.ts',
  'src/mcp/tools/presentation/publish.ts',
  'src/mcp/tools/presentation/recover.ts',
  'src/mcp/tools/presentation/schemas.ts',
  'src/mcp/tools/presentation/unpublish.ts',
  'src/mcp/tools/presentation/update-slides.ts',
  'src/mcp/tools/presentation/update-theme.ts',
  'src/mcp/lib/generation-telemetry.ts',
  'src/mcp/lib/mcp-project-access.ts',
  'src/mcp/lib/presentation-generation-runs.ts',
  'src/mcp/lib/theme-validator.ts',
  'src/mcp/lib/transport-context.ts',
  'src/mcp/apps/constants.ts',
  'src/mcp/apps/widget-data.ts',
  'src/mcp/apps/widgets.ts',
  'src/mcp/apps/components/shared/runtime.ts',
  'src/mcp/apps/components/presentation-list.ts',
  'src/mcp/apps/components/generation-progress.ts',
  'src/mcp/apps/components/deck-preview.ts',
  'src/mcp/apps/components/action-result.ts',
  'src/mcp/apps/generated/index.ts',
  'src/mcp/apps/generated/presentation-list.ts',
  'src/mcp/apps/generated/generation-progress.ts',
  'src/mcp/apps/generated/deck-preview.ts',
  'src/mcp/apps/generated/action-result.ts',
  'src/mcp/resources/app-ui.ts',
  'src/mcp/resources/generation-progress.ts',
  'src/mcp/resources/presentations.ts',
  'src/mcp/resources/registry.ts',
  'src/mcp/resources/templates.ts',
  'src/mcp/resources/themes.ts',
  'src/mcp/server.ts',
  'src/mcp/transport/health.ts',
  'src/mcp/transport/http.ts',
  'src/mcp/transport/stdio.ts',
  'src/app/api/mcp/oauth-protected-resource/metadata.ts',
  'src/app/api/mcp/oauth-protected-resource/route.ts',
  'src/app/api/mcp/oauth-protected-resource/[...path]/route.ts',
  'src/app/api/mcp/health/route.ts',
  'src/app/api/mcp/route.ts',
  'src/app/api/oauth/authorization-server/route.ts',
  'src/app/mcp/health/route.ts',
  'src/app/mcp/route.ts',
  'src/app/oauth/authorize/route.ts',
  'src/app/oauth/register/route.ts',
  'src/app/oauth/revoke/route.ts',
  'src/app/oauth/token/route.ts',
  'src/agentic-workflow-v2/actions/advanced-genai-graph.ts',
];

const configPath = ts.findConfigFile(root, ts.sys.fileExists, 'tsconfig.json');
if (!configPath) {
  console.error('Unable to find tsconfig.json.');
  process.exit(1);
}

const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
if (configFile.error) {
  reportDiagnostics([configFile.error]);
  process.exit(1);
}

const parsedConfig = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  root
);

const rootFiles = candidateFiles
  .map((filePath) => path.join(root, filePath))
  .filter((filePath) => ts.sys.fileExists(filePath));

const scopePrefixes = [
  'src/lib/mcp-client-guide.ts',
  'src/mcp/',
  'src/app/mcp/',
  'src/app/api/mcp/',
  'src/app/oauth/',
  'src/app/api/oauth/',
  'src/agentic-workflow-v2/actions/advanced-genai-graph.ts',
];

const ignoredDiagnosticCodes = new Set([
  2307, // Local dependency/module resolution issues are tracked separately from Phase 7 contract checks.
]);

const compilerOptions = {
  ...parsedConfig.options,
  noEmit: true,
  skipLibCheck: true,
  incremental: false,
  tsBuildInfoFile: undefined,
  types: ['node'],
};

const program = ts.createProgram(rootFiles, compilerOptions);
const diagnostics = ts.getPreEmitDiagnostics(program);

let ignoredCount = 0;
const scopedDiagnostics = diagnostics.filter((diagnostic) => {
  const relativeFile = diagnostic.file
    ? normalizePath(path.relative(root, diagnostic.file.fileName))
    : '';

  const inScope =
    !relativeFile ||
    scopePrefixes.some((prefix) => relativeFile === prefix || relativeFile.startsWith(prefix));

  if (!inScope) {
    return false;
  }

  if (ignoredDiagnosticCodes.has(diagnostic.code)) {
    ignoredCount += 1;
    return false;
  }

  return true;
});

if (scopedDiagnostics.length > 0) {
  console.error('Focused MCP Apps typecheck failed.');
  reportDiagnostics(scopedDiagnostics);
  process.exit(1);
}

console.log('Focused MCP Apps typecheck passed.');
console.log(`Checked ${rootFiles.length} MCP/OAuth/app-hosting files.`);
if (ignoredCount > 0) {
  console.log(`Skipped ${ignoredCount} TS2307 module-resolution diagnostic(s); run npm run build after fixing local dependencies.`);
}

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function reportDiagnostics(diagnosticsToReport) {
  const formatted = diagnosticsToReport.slice(0, 50).map((diagnostic) => {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

    if (!diagnostic.file || diagnostic.start === undefined) {
      return `TS${diagnostic.code}: ${message}`;
    }

    const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    const relativeFile = normalizePath(path.relative(root, diagnostic.file.fileName));

    return `${relativeFile}:${position.line + 1}:${position.character + 1} TS${diagnostic.code}: ${message}`;
  });

  console.error(formatted.join('\n'));

  if (diagnosticsToReport.length > formatted.length) {
    console.error(`...and ${diagnosticsToReport.length - formatted.length} more diagnostic(s).`);
  }
}
