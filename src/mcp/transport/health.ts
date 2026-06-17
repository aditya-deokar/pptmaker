import prisma from '@/lib/prisma';
import { MCP_SERVER_NAME, MCP_SERVER_VERSION } from '../config/constants';

export async function handleHealth(): Promise<Response> {
  const startedAt = performance.now();
  const checks: Record<string, 'ok' | 'error'> = {
    database: 'ok',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    checks.database = 'error';
  }

  const ok = Object.values(checks).every((status) => status === 'ok');

  return Response.json(
    {
      ok,
      service: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
      checks,
      latency_ms: Math.round(performance.now() - startedAt),
      timestamp: new Date().toISOString(),
    },
    {
      status: ok ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  );
}
