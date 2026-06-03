import { SubscriptionStatus } from "@/generated/prisma";

export const GENERATION_LIMITS = {
  FREE: 5,
  BYOK: 15,
} as const;

type StoredAiKeyStatus = {
  lastValidationError: string | null;
  validatedAt: Date | null;
};

export function isStoredAiKeyUsable(key: StoredAiKeyStatus) {
  return Boolean(key.validatedAt) || key.lastValidationError === null;
}

export function hasUnlimitedGenerationAccess(
  subscriptionStatus?: SubscriptionStatus | null
) {
  return subscriptionStatus === SubscriptionStatus.ACTIVE;
}

export function isByokActive(input: {
  hasUsableAiKeys: boolean;
  subscriptionStatus?: SubscriptionStatus | null;
  usageCount: number;
}) {
  if (!input.hasUsableAiKeys) {
    return false;
  }

  if (hasUnlimitedGenerationAccess(input.subscriptionStatus)) {
    return true;
  }

  return input.usageCount >= GENERATION_LIMITS.FREE;
}

export function resolveGenerationAccess(input: {
  hasUsableAiKeys: boolean;
  subscriptionStatus?: SubscriptionStatus | null;
  usageCount: number;
}) {
  const isUnlimited = hasUnlimitedGenerationAccess(input.subscriptionStatus);
  const byokActive = isByokActive(input);

  return {
    byokActive,
    freeTierLimit: GENERATION_LIMITS.FREE,
    isUnlimited,
    limit: isUnlimited
      ? Infinity
      : byokActive
        ? GENERATION_LIMITS.BYOK
        : GENERATION_LIMITS.FREE,
    remainingFreeProjects: Math.max(0, GENERATION_LIMITS.FREE - input.usageCount),
  };
}
