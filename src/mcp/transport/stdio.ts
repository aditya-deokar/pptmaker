#!/usr/bin/env node
/**
 * MCP Transport - stdio Entry Point
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from '../server';
import { registerAllTools } from '../tools/registry';
import { registerAllResources } from '../resources/registry';
import { setTransportType } from '../tools/presentation/index';

import '../tools/presentation/index';
import '../resources/presentations';
import '../resources/templates';
import '../resources/themes';
import '../resources/generation-progress';
import '../resources/app-ui';

async function main(): Promise<void> {
  setTransportType('stdio');

  console.error('---------------------------------------------');
  console.error('  Verto AI MCP Server (stdio transport)');
  console.error('---------------------------------------------');

  const server = createMcpServer();
  registerAllTools(server);
  registerAllResources(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[MCP] Server connected via stdio transport');
  console.error('[MCP] Ready to accept requests');
}

main().catch((error) => {
  console.error('[MCP] Fatal error during startup:', error);
  process.exit(1);
});
