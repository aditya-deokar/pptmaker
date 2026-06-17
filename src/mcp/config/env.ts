/**
 * MCP Server Environment Configuration
 */

import { z, type ZodIssue } from 'zod';
import { MCP_SERVER_NAME, MCP_SERVER_VERSION } from './constants';

const mcpEnvSchema = z.object({
  MCP_SERVER_NAME: z.string().default(MCP_SERVER_NAME),
  MCP_SERVER_VERSION: z.string().default(MCP_SERVER_VERSION),
  VERTO_MCP_API_KEY_HASH: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  MCP_RATE_LIMIT_RPM: z.coerce.number().int().positive().default(120),
  MCP_RATE_LIMIT_CONCURRENT: z.coerce.number().int().positive().default(10),
  MCP_ALLOWED_ORIGINS: z.string().optional().default(''),
  MCP_MAX_REQUEST_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  MCP_MAX_JSON_DEPTH: z.coerce.number().int().positive().default(20),
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
  MCP_PUBLIC_ENDPOINT: z.string().url().optional(),
  OAUTH_ISSUER: z.string().url().optional(),
  OAUTH_ALLOWED_CLIENTS: z.string().optional().default(''),
  OAUTH_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  OAUTH_REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 30),
  OAUTH_AUTH_CODE_TTL_SECONDS: z.coerce.number().int().positive().default(600),
});

export type McpEnv = z.infer<typeof mcpEnvSchema>;

let cachedEnv: McpEnv | null = null;

export function validateMcpEnv(): McpEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = mcpEnvSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue: ZodIssue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error(`\n[MCP] Invalid environment configuration\n${formatted}\n`);
    throw new Error('MCP environment validation failed. See stderr for details.');
  }

  cachedEnv = result.data;
  return cachedEnv;
}

export function resetMcpEnvCache(): void {
  cachedEnv = null;
}
