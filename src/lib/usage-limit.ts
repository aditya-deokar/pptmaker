import { getUserAiConfigRecord } from "./ai-config-compat";
import prisma from "./prisma";
import {
  GENERATION_LIMITS as LIMITS,
  isStoredAiKeyUsable,
  resolveGenerationAccess,
} from "./byok-policy";

/**
 * Calculates the total project limit for a user based on their status and keys.
 */
export async function getUserUsageDetails(userId: string) {
  const user = await getUserAiConfigRecord({ appUserId: userId });

  if (!user) {
    return {
      usage: 0,
      limit: LIMITS.FREE,
      isUnlimited: false,
      byokActive: false,
      remainingFreeProjects: LIMITS.FREE,
      freeTierLimit: LIMITS.FREE,
    };
  }

  const access = resolveGenerationAccess({
    usageCount: user.usageCount,
    subscriptionStatus: user.subscriptionStatus,
    hasUsableAiKeys: user.keys.some((key) => isStoredAiKeyUsable(key)),
  });

  return {
    usage: user.usageCount,
    limit: access.limit,
    isUnlimited: access.isUnlimited,
    byokActive: access.byokActive,
    remainingFreeProjects: access.remainingFreeProjects,
    freeTierLimit: access.freeTierLimit,
  };
}

/**
 * Checks if a user is within their limit and increments the count.
 */
export async function checkAndIncrementUsage(userId: string) {
  const { usage, limit, isUnlimited } = await getUserUsageDetails(userId);

  if (!isUnlimited && usage >= limit) {
    return { 
      success: false, 
      error: `Usage limit reached (${usage}/${limit}). Upgrade or add an API key to continue.`,
      usage,
      limit
    };
  }

  // Increment the usage count
  await prisma.user.updateMany({
    where: { id: userId },
    data: { usageCount: { increment: 1 } },
  });

  return { success: true, usage: usage + 1, limit };
}
