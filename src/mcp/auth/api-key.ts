/**
 * MCP Auth — API Key Validation
 *
 * Validates API keys passed via environment variables (stdio transport)
 * or via Authorization header (HTTP transport).
 *
 * Keys are stored as bcrypt hashes — plaintext keys are NEVER persisted.
 */

import { compare } from 'bcryptjs';
import prisma from '@/lib/prisma';
import type { AuthContext, UserTier } from './types';
import { SubscriptionStatus } from '@/generated/prisma';
import { getAllMcpOAuthScopes } from './scopes';

/** API key prefix for identification: vk_live_xxx or vk_dev_xxx */
const API_KEY_PREFIX_REGEX = /^vk_(live|dev)_/;

/**
 * Validate an API key and resolve the associated user.
 *
 * @param apiKey - The plaintext API key from the client
 * @returns AuthContext if valid, null if invalid
 */
export async function validateApiKey(apiKey: string): Promise<AuthContext | null> {
  if (!apiKey || !API_KEY_PREFIX_REGEX.test(apiKey)) {
    return null;
  }

  // Extract the prefix (first 12 chars) for efficient lookup
  const keyPrefix = apiKey.substring(0, 12);

  // Find candidate keys by prefix (avoids scanning every row)
  const candidates = await prisma.mcpApiKey.findMany({
    where: {
      keyPrefix,
      isRevoked: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      user: {
        include: {
          Subscription: { select: { status: true } },
        },
      },
    },
  });

  // Verify bcrypt hash against each candidate
  for (const candidate of candidates) {
    const isMatch = await compare(apiKey, candidate.keyHash);
    if (!isMatch) continue;

    // Update lastUsedAt (fire-and-forget, non-blocking)
    prisma.mcpApiKey.update({
      where: { id: candidate.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {
      // Silently ignore — this is a non-critical analytics update
    });

    // Resolve user tier
    const tier = resolveUserTier(candidate.user.Subscription?.status);

    return {
      userId: candidate.user.id,
      clerkId: candidate.user.clerkId,
      email: candidate.user.email,
      tier,
      authMethod: 'api_key',
      scopes: getAllMcpOAuthScopes(),
    };
  }

  return null;
}

/**
 * Resolve user tier from subscription status.
 */
function resolveUserTier(status?: SubscriptionStatus | null): UserTier {
  if (status === SubscriptionStatus.ACTIVE) return 'pro';
  return 'free';
}
