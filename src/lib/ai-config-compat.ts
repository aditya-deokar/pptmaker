import { AiProvider, SubscriptionStatus } from "@/generated/prisma";
import prisma from "@/lib/prisma";

type UserLookupClause = { clerkId: string } | { id: string };

type ModernUserRecord = {
  AiKeys: Array<{
    id: string;
    iv: string;
    key: string;
    lastUsedAt: Date | null;
    lastValidationError: string | null;
    modelName: string | null;
    provider: AiProvider;
    tag: string;
    updatedAt: Date;
    validatedAt: Date | null;
  }>;
  clerkId: string;
  defaultAiProvider: AiProvider | null;
  id: string;
  subscription: boolean | null;
  Subscription: {
    status: SubscriptionStatus;
  } | null;
  usageCount: number;
};

type LegacyUserRecord = {
  AiKeys: Array<{
    id: string;
    iv: string;
    key: string;
    provider: AiProvider;
    tag: string;
    updatedAt: Date;
  }>;
  clerkId: string;
  id: string;
  subscription: boolean | null;
  Subscription?: {
    status: SubscriptionStatus;
  } | null;
  usageCount: number;
};

export type StoredAiKeyRecord = {
  id: string;
  iv: string;
  key: string;
  lastUsedAt: Date | null;
  lastValidationError: string | null;
  modelName: string | null;
  provider: AiProvider;
  tag: string;
  updatedAt: Date;
  validatedAt: Date | null;
};

export type UserAiConfigRecord = {
  clerkId: string;
  compatibilityMode: "legacy" | "modern";
  defaultAiProvider: AiProvider | null;
  id: string;
  keys: StoredAiKeyRecord[];
  subscriptionStatus: SubscriptionStatus | null;
  usageCount: number;
};

export type UserAiConfigCapabilities = {
  supportsDefaultProvider: boolean;
  supportsLastUsedAt: boolean;
  supportsPreferredModelName: boolean;
  supportsValidationMetadata: boolean;
};

const MODERN_AI_COMPATIBILITY_FIELDS = [
  "defaultAiProvider",
  "modelName",
  "validatedAt",
  "lastUsedAt",
  "lastValidationError",
  "Subscription",
] as const;

function buildWhereClauses(input: {
  appUserId?: string | null;
  clerkId?: string | null;
}) {
  return [
    input.appUserId ? { id: input.appUserId } : null,
    input.clerkId ? { clerkId: input.clerkId } : null,
  ].filter((clause): clause is UserLookupClause => clause !== null);
}

function getCompatibilityErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "";
}

function isAiConfigCompatibilityError(error: unknown) {
  const message = getCompatibilityErrorMessage(error);
  if (!message) {
    return false;
  }

  const mentionsCompatibilityField = MODERN_AI_COMPATIBILITY_FIELDS.some((field) =>
    message.includes(field)
  );

  if (!mentionsCompatibilityField) {
    return false;
  }

  return (
    message.includes("Unknown field") ||
    message.includes("Unknown argument") ||
    message.includes("does not exist") ||
    message.includes("column") ||
    message.includes("select statement")
  );
}

function getSubscriptionStatus(input: {
  legacySubscription: boolean | null;
  relationStatus?: SubscriptionStatus | null;
}) {
  return input.relationStatus ?? (input.legacySubscription ? SubscriptionStatus.ACTIVE : null);
}

function normalizeModernUserRecord(user: ModernUserRecord): UserAiConfigRecord {
  return {
    id: user.id,
    clerkId: user.clerkId,
    defaultAiProvider: user.defaultAiProvider,
    usageCount: user.usageCount,
    compatibilityMode: "modern",
    subscriptionStatus: getSubscriptionStatus({
      relationStatus: user.Subscription?.status ?? null,
      legacySubscription: user.subscription,
    }),
    keys: user.AiKeys,
  };
}

function normalizeLegacyUserRecord(user: LegacyUserRecord): UserAiConfigRecord {
  return {
    id: user.id,
    clerkId: user.clerkId,
    defaultAiProvider: null,
    usageCount: user.usageCount,
    compatibilityMode: "legacy",
    subscriptionStatus: getSubscriptionStatus({
      relationStatus: user.Subscription?.status ?? null,
      legacySubscription: user.subscription,
    }),
    keys: user.AiKeys.map((key) => ({
      ...key,
      modelName: null,
      validatedAt: null,
      lastUsedAt: null,
      lastValidationError: null,
    })),
  };
}

async function findModernUser(whereClauses: UserLookupClause[]) {
  return prisma.user.findFirst({
    where: {
      OR: whereClauses,
    },
    select: {
      id: true,
      clerkId: true,
      defaultAiProvider: true,
      usageCount: true,
      subscription: true,
      Subscription: {
        select: {
          status: true,
        },
      },
      AiKeys: {
        select: {
          id: true,
          provider: true,
          modelName: true,
          key: true,
          iv: true,
          tag: true,
          validatedAt: true,
          lastUsedAt: true,
          lastValidationError: true,
          updatedAt: true,
        },
      },
    },
  }) as Promise<ModernUserRecord | null>;
}

async function findLegacyUser(whereClauses: UserLookupClause[]) {
  try {
    return (await prisma.user.findFirst({
      where: {
        OR: whereClauses,
      },
      select: {
        id: true,
        clerkId: true,
        usageCount: true,
        subscription: true,
        Subscription: {
          select: {
            status: true,
          },
        },
        AiKeys: {
          select: {
            id: true,
            provider: true,
            key: true,
            iv: true,
            tag: true,
            updatedAt: true,
          },
        },
      },
    })) as LegacyUserRecord | null;
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (
      !(error instanceof Error) ||
      !message.includes("subscription")
    ) {
      throw error;
    }

    return (await prisma.user.findFirst({
      where: {
        OR: whereClauses,
      },
      select: {
        id: true,
        clerkId: true,
        usageCount: true,
        subscription: true,
        AiKeys: {
          select: {
            id: true,
            provider: true,
            key: true,
            iv: true,
            tag: true,
            updatedAt: true,
          },
        },
      },
    })) as LegacyUserRecord | null;
  }
}

export function getUserAiConfigCapabilities(
  record: Pick<UserAiConfigRecord, "compatibilityMode">
): UserAiConfigCapabilities {
  const isModern = record.compatibilityMode === "modern";

  return {
    supportsDefaultProvider: isModern,
    supportsPreferredModelName: isModern,
    supportsValidationMetadata: isModern,
    supportsLastUsedAt: isModern,
  };
}

export async function getUserAiConfigRecord(input: {
  appUserId?: string | null;
  clerkId?: string | null;
}) {
  const whereClauses = buildWhereClauses(input);
  if (whereClauses.length === 0) {
    return null;
  }

  try {
    const user = await findModernUser(whereClauses);
    return user ? normalizeModernUserRecord(user) : null;
  } catch (error) {
    if (!isAiConfigCompatibilityError(error)) {
      throw error;
    }
  }

  const user = await findLegacyUser(whereClauses);
  return user ? normalizeLegacyUserRecord(user) : null;
}
