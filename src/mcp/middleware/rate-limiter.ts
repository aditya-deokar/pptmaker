import { RATE_LIMIT_DEFAULTS } from '../config/constants';
import { validateMcpEnv } from '../config/env';
import type { AuthContext, UserTier } from '../auth/types';

interface SlidingWindowBucket {
  timestamps: number[];
  concurrent: number;
}

const buckets = new Map<string, SlidingWindowBucket>();

function getBucket(key: string): SlidingWindowBucket {
  const existing = buckets.get(key);
  if (existing) {
    return existing;
  }

  const created: SlidingWindowBucket = {
    timestamps: [],
    concurrent: 0,
  };
  buckets.set(key, created);
  return created;
}

function getTierLimits(tier: UserTier) {
  const env = validateMcpEnv();

  switch (tier) {
    case 'enterprise':
      return RATE_LIMIT_DEFAULTS.ENTERPRISE;
    case 'free':
      return RATE_LIMIT_DEFAULTS.FREE;
    case 'pro':
    default:
      return {
        requestsPerMinute: env.MCP_RATE_LIMIT_RPM,
        concurrentTools: env.MCP_RATE_LIMIT_CONCURRENT,
        generationsPerHour: RATE_LIMIT_DEFAULTS.PRO.generationsPerHour,
      };
  }
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds?: number;
  limit?: number;
  remaining?: number;
  resetAfterSeconds?: number;
  release?: () => void;
}

export function acquireRateLimit(auth: AuthContext): RateLimitResult {
  const now = Date.now();
  const windowMs = 60_000;
  const key = auth.userId;
  const bucket = getBucket(key);
  const limits = getTierLimits(auth.tier);

  bucket.timestamps = bucket.timestamps.filter((timestamp) => now - timestamp < windowMs);

  if (bucket.timestamps.length >= limits.requestsPerMinute) {
    const oldestTimestamp = bucket.timestamps[0] ?? now;
    const retryAfterMs = Math.max(windowMs - (now - oldestTimestamp), 1_000);

    return {
      ok: false,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      limit: limits.requestsPerMinute,
      remaining: 0,
      resetAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  if (bucket.concurrent >= limits.concurrentTools) {
    return {
      ok: false,
      retryAfterSeconds: 1,
      limit: limits.concurrentTools,
      remaining: 0,
      resetAfterSeconds: 1,
    };
  }

  bucket.timestamps.push(now);
  bucket.concurrent += 1;

  return {
    ok: true,
    limit: limits.requestsPerMinute,
    remaining: Math.max(0, limits.requestsPerMinute - bucket.timestamps.length),
    resetAfterSeconds: 60,
    release: () => {
      const current = buckets.get(key);
      if (!current) {
        return;
      }

      current.concurrent = Math.max(0, current.concurrent - 1);
      if (current.concurrent === 0 && current.timestamps.length === 0) {
        buckets.delete(key);
      }
    },
  };
}
