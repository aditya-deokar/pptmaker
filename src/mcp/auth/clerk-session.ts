/**
 * MCP Auth — Clerk Session Resolver
 *
 * For HTTP transport: extracts the authenticated user from a Clerk session.
 * This is used when the MCP server is accessed via the Next.js API route.
 */

import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import type { AuthContext, UserTier } from './types';
import { SubscriptionStatus } from '@/generated/prisma';
import { getAllMcpOAuthScopes } from './scopes';

/**
 * Resolve AuthContext from the current Clerk session (HTTP transport).
 *
 * @returns AuthContext if authenticated, null otherwise
 */
export async function resolveClerkSession(): Promise<AuthContext | null> {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        Subscription: { select: { status: true } },
      },
    });

    if (!user) {
      return null;
    }

    const tier: UserTier =
      user.Subscription?.status === SubscriptionStatus.ACTIVE ? 'pro' : 'free';

    return {
      userId: user.id,
      clerkId: user.clerkId,
      email: user.email,
      tier,
      authMethod: 'clerk_session',
      scopes: getAllMcpOAuthScopes(),
    };
  } catch {
    return null;
  }
}
