import { handleHealth } from '@/mcp/transport/health';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  return handleHealth();
}
