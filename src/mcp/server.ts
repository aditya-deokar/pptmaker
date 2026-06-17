/**
 * MCP Server — Initialization
 *
 * Creates and configures the McpServer instance with capabilities,
 * instructions, and metadata. Does NOT connect a transport — that's
 * done in the transport-specific entry points.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { validateMcpEnv } from './config/env';

/**
 * Create a configured McpServer instance.
 *
 * This function:
 * 1. Validates environment configuration
 * 2. Creates the McpServer with metadata and instructions
 * 3. Returns the server (tools/resources registered separately)
 */
export function createMcpServer(): McpServer {
  const env = validateMcpEnv();

  const server = new McpServer(
    {
      name: env.MCP_SERVER_NAME,
      version: env.MCP_SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        logging: {},
      },
      instructions: [
        'You are connected to Verto AI — an AI-powered presentation platform.',
        '',
        'WORKFLOW:',
        "1. Use 'presentation_list' to browse the user's presentations",
        "2. Use 'presentation_get' to read a specific presentation (with slides)",
        "3. Use 'presentation_create' to create a new empty presentation",
        "4. Use 'presentation_generate' for AI-powered generation (takes 30-90s)",
        "   If it returns RUNNING, use 'presentation_generation_status' to check progress",
        "5. Use 'presentation_update_slides' or 'presentation_update_theme' to modify",
        "6. Use 'presentation_publish' to make a presentation publicly shareable",
        '',
        'RESOURCES (read-only context):',
        "- 'verto://themes' — available visual themes (check before updating theme)",
        "- 'verto://templates' — available presentation templates",
        "- 'verto://presentations' — quick listing of user's presentations",
        '',
        'IMPORTANT:',
        '- presentation_delete performs a soft-delete (recoverable via presentation_recover)',
        '- presentation_delete_permanently requires confirm: true — IRREVERSIBLE',
        '- presentation_update_slides replaces ALL slides — GET first, then modify',
        '- presentation_generate is a long-running operation and may return RUNNING before completion',
        '- presentation_generation_status checks a generation run without starting a duplicate run',
      ].join('\n'),
    }
  );

  return server;
}
