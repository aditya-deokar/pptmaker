'use server'

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { AiProvider, SubscriptionStatus } from "@/generated/prisma";
import {
  getUserAiConfigCapabilities,
  getUserAiConfigRecord,
} from "@/lib/ai-config-compat";
import { decryptKey, encryptKey } from "@/lib/encryption";
import {
  AI_PROVIDER_METADATA,
  AI_PROVIDER_ORDER,
  getDefaultModelForProvider,
  normalizeModelName,
} from "@/lib/ai-models";
import { validateAiConnection } from "@/lib/ai-provider";
import { isStoredAiKeyUsable, resolveGenerationAccess } from "@/lib/byok-policy";
import prisma from "@/lib/prisma";

type SaveUserAiKeyInput = {
  apiKey?: string;
  makeDefault?: boolean;
  modelName?: string | null;
  provider: AiProvider;
};

type TestAiKeyConnectionInput = {
  apiKey: string;
  modelName?: string | null;
  provider: AiProvider;
};

export type ProviderConfiguration = {
  configured: boolean;
  defaultModel: string;
  description: string;
  isDefault: boolean;
  keyLabel: string;
  label: string;
  lastUsedAt: string | null;
  lastValidationError: string | null;
  modelName: string | null;
  provider: AiProvider;
  recommendedModels: Array<{
    description: string;
    label: string;
    value: string;
  }>;
  updatedAt: string | null;
  usable: boolean;
  validatedAt: string | null;
};

export type UserAiConfiguration = {
  businessModel: {
    byokActive: boolean;
    freeTierLimit: number;
    hasUnlimitedPlan: boolean;
    remainingFreeProjects: number;
    usage: number;
  };
  compatibility: {
    message: string | null;
    supportsDefaultProvider: boolean;
    supportsLastUsedAt: boolean;
    supportsPreferredModelName: boolean;
    supportsValidationMetadata: boolean;
  };
  coverage: string[];
  defaultProvider: AiProvider | null;
  providers: ProviderConfiguration[];
  systemFallback: {
    modelName: string;
    provider: AiProvider;
  };
};

const SAFE_AI_KEY_MUTATION_SELECT = {
  id: true,
} as const;

function isAiKeyCompatibilityError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  return (
    message.includes("UserAiKey.modelName") ||
    message.includes("UserAiKey.validatedAt") ||
    message.includes("UserAiKey.lastValidationError") ||
    message.includes("UserAiKey.lastUsedAt") ||
    message.includes("column") ||
    message.includes("does not exist")
  );
}

async function saveLegacyCompatibleAiKey(input: {
  encryptedKey: { iv: string; key: string; tag: string } | null;
  existingKey:
    | {
        id: string;
        iv: string;
        key: string;
        tag: string;
      }
    | undefined;
  provider: AiProvider;
  userId: string;
}) {
  if (input.existingKey) {
    await prisma.userAiKey.update({
      where: { id: input.existingKey.id },
      data: {
        key: input.encryptedKey?.key ?? input.existingKey.key,
        iv: input.encryptedKey?.iv ?? input.existingKey.iv,
        tag: input.encryptedKey?.tag ?? input.existingKey.tag,
      },
      select: SAFE_AI_KEY_MUTATION_SELECT,
    });
    return;
  }

  await prisma.userAiKey.create({
    data: {
      userId: input.userId,
      provider: input.provider,
      key: input.encryptedKey!.key,
      iv: input.encryptedKey!.iv,
      tag: input.encryptedKey!.tag,
    },
    select: SAFE_AI_KEY_MUTATION_SELECT,
  });
}

async function getAuthenticatedDbUser() {
  const user = await currentUser();
  if (!user) {
    return { error: "Unauthorized", status: 403 as const };
  }

  const dbUser = await getUserAiConfigRecord({ clerkId: user.id });

  if (!dbUser) {
    return { error: "User not found", status: 404 as const };
  }

  return { dbUser, status: 200 as const };
}

function buildUserAiConfiguration(input: {
  aiKeys: Array<{
    lastUsedAt: Date | null;
    lastValidationError: string | null;
    modelName: string | null;
    provider: AiProvider;
    updatedAt: Date;
    validatedAt: Date | null;
  }>;
  compatibilityMode: "legacy" | "modern";
  defaultAiProvider: AiProvider | null;
  subscriptionStatus: SubscriptionStatus | null;
  usageCount: number;
}): UserAiConfiguration {
  const hasUsableAiKeys = input.aiKeys.some((key) => isStoredAiKeyUsable(key));
  const access = resolveGenerationAccess({
    usageCount: input.usageCount,
    subscriptionStatus: input.subscriptionStatus,
    hasUsableAiKeys,
  });
  const capabilities = getUserAiConfigCapabilities({
    compatibilityMode: input.compatibilityMode,
  });

  return {
    businessModel: {
      usage: input.usageCount,
      byokActive: access.byokActive,
      freeTierLimit: access.freeTierLimit,
      hasUnlimitedPlan: access.isUnlimited,
      remainingFreeProjects: access.remainingFreeProjects,
    },
    compatibility: {
      ...capabilities,
      message:
        input.compatibilityMode === "legacy"
          ? "Your workspace is using compatibility mode while the latest AI settings upgrade finishes syncing. Key storage still works, but default provider selection, saved model names, and validation history will unlock after that rollout completes."
          : null,
    },
    defaultProvider: input.defaultAiProvider,
    providers: AI_PROVIDER_ORDER.map((provider) => {
      const existingKey = input.aiKeys.find((key) => key.provider === provider);
      const metadata = AI_PROVIDER_METADATA[provider];

      return {
        provider,
        label: metadata.label,
        description: metadata.description,
        keyLabel: metadata.keyLabel,
        defaultModel: metadata.defaultModel,
        recommendedModels: metadata.recommendedModels,
        configured: Boolean(existingKey),
        usable: existingKey ? isStoredAiKeyUsable(existingKey) : false,
        isDefault: input.defaultAiProvider === provider,
        modelName: existingKey?.modelName ?? null,
        validatedAt: existingKey?.validatedAt?.toISOString() ?? null,
        lastUsedAt: existingKey?.lastUsedAt?.toISOString() ?? null,
        lastValidationError: existingKey?.lastValidationError ?? null,
        updatedAt: existingKey?.updatedAt?.toISOString() ?? null,
      };
    }),
    systemFallback: {
      provider: AiProvider.GOOGLE,
      modelName: getDefaultModelForProvider(AiProvider.GOOGLE),
    },
    coverage: [
      "Presentation generation",
      "Streamable slides",
      "MCP presentation generation",
      "Mobile design screen generation",
      "Mobile design frame regeneration",
    ],
  };
}

export async function getUserAiConfiguration() {
  try {
    const result = await getAuthenticatedDbUser();
    if (result.status !== 200) {
      return result;
    }

    return {
      status: 200,
      data: buildUserAiConfiguration({
        aiKeys: result.dbUser.keys,
        compatibilityMode: result.dbUser.compatibilityMode,
        defaultAiProvider: result.dbUser.defaultAiProvider,
        subscriptionStatus: result.dbUser.subscriptionStatus,
        usageCount: result.dbUser.usageCount,
      }),
    };
  } catch (error) {
    console.error("Failed to get AI configuration:", error);
    return { status: 500, error: "Failed to fetch AI configuration" };
  }
}

export async function updateUserAiDefaultProvider(provider: AiProvider | null) {
  try {
    const result = await getAuthenticatedDbUser();
    if (result.status !== 200) {
      return result;
    }

    if (result.dbUser.compatibilityMode === "legacy") {
      return {
        status: 409,
        error:
          "Default provider selection will be available after the latest AI settings upgrade finishes syncing.",
      };
    }

    if (provider) {
      const providerKey = result.dbUser.keys.find((key) => key.provider === provider);
      if (!providerKey || !isStoredAiKeyUsable(providerKey)) {
        return {
          status: 400,
          error: `Add and validate a ${AI_PROVIDER_METADATA[provider].label} key before setting it as default.`,
        };
      }
    }

    await prisma.user.update({
      where: { id: result.dbUser.id },
      data: { defaultAiProvider: provider },
      select: { id: true },
    });

    revalidatePath("/settings");

    return {
      status: 200,
      message: provider
        ? `${AI_PROVIDER_METADATA[provider].label} is now your default provider.`
        : "Default provider reset to automatic.",
    };
  } catch (error) {
    console.error("Failed to update default AI provider:", error);
    return { status: 500, error: "Failed to update default provider" };
  }
}

export async function saveUserAiKey(
  providerOrInput: AiProvider | SaveUserAiKeyInput,
  legacyKey?: string
) {
  try {
    const input: SaveUserAiKeyInput =
      typeof providerOrInput === "string"
        ? { provider: providerOrInput, apiKey: legacyKey }
        : providerOrInput;

    const result = await getAuthenticatedDbUser();
    if (result.status !== 200) {
      return result;
    }

    const normalizedApiKey = input.apiKey?.trim();
    const normalizedModelName = normalizeModelName(input.modelName);
    const existingKey = result.dbUser.keys.find(
      (key) => key.provider === input.provider
    );

    if (!normalizedApiKey && !existingKey) {
      return {
        status: 400,
        error: `Enter your ${AI_PROVIDER_METADATA[input.provider].keyLabel.toLowerCase()} first.`,
      };
    }

    const apiKeyToValidate =
      normalizedApiKey ||
      decryptKey(existingKey!.key, existingKey!.iv, existingKey!.tag);

    const validation = await validateAiConnection({
      provider: input.provider,
      apiKey: apiKeyToValidate,
      modelName: normalizedModelName,
    });

    if (!validation.success) {
      if (existingKey && result.dbUser.compatibilityMode === "modern") {
        await prisma.userAiKey.update({
          where: { id: existingKey.id },
          data: {
            lastValidationError: validation.error,
          },
          select: SAFE_AI_KEY_MUTATION_SELECT,
        });
        revalidatePath("/settings");
      }

      return { status: 400, error: validation.error };
    }

    const encryptedKey = normalizedApiKey ? encryptKey(normalizedApiKey) : null;
    let usedLegacyCompatibilitySave =
      result.dbUser.compatibilityMode === "legacy";

    if (result.dbUser.compatibilityMode === "legacy") {
      await saveLegacyCompatibleAiKey({
        userId: result.dbUser.id,
        provider: input.provider,
        existingKey,
        encryptedKey,
      });
    } else {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.userAiKey.upsert({
            where: {
              userId_provider: {
                userId: result.dbUser.id,
                provider: input.provider,
              },
            },
            update: {
              key: encryptedKey?.key ?? existingKey!.key,
              iv: encryptedKey?.iv ?? existingKey!.iv,
              tag: encryptedKey?.tag ?? existingKey!.tag,
              modelName: normalizedModelName,
              validatedAt: new Date(),
              lastValidationError: null,
            },
            create: {
              userId: result.dbUser.id,
              provider: input.provider,
              key: encryptedKey!.key,
              iv: encryptedKey!.iv,
              tag: encryptedKey!.tag,
              modelName: normalizedModelName,
              validatedAt: new Date(),
              lastValidationError: null,
            },
            select: SAFE_AI_KEY_MUTATION_SELECT,
          });

          if (input.makeDefault || !result.dbUser.defaultAiProvider) {
            await tx.user.update({
              where: { id: result.dbUser.id },
              data: { defaultAiProvider: input.provider },
              select: { id: true },
            });
          }
        });
      } catch (error) {
        if (!isAiKeyCompatibilityError(error)) {
          throw error;
        }

        usedLegacyCompatibilitySave = true;
        await saveLegacyCompatibleAiKey({
          userId: result.dbUser.id,
          provider: input.provider,
          existingKey,
          encryptedKey,
        });
      }
    }

    revalidatePath("/settings");

    return {
      status: 200,
      message:
        usedLegacyCompatibilitySave
          ? `${AI_PROVIDER_METADATA[input.provider].label} saved successfully. Advanced AI preferences will appear after the latest settings upgrade finishes syncing.`
          : normalizedModelName
            ? `${AI_PROVIDER_METADATA[input.provider].label} saved with ${validation.modelName}.`
            : `${AI_PROVIDER_METADATA[input.provider].label} saved successfully.`,
    };
  } catch (error) {
    console.error("Failed to save AI key:", error);
    return { status: 500, error: "Failed to save API key" };
  }
}

export async function deleteUserAiKey(provider: AiProvider) {
  try {
    const result = await getAuthenticatedDbUser();
    if (result.status !== 200) {
      return result;
    }

    if (result.dbUser.compatibilityMode === "legacy") {
      await prisma.userAiKey.deleteMany({
        where: {
          userId: result.dbUser.id,
          provider,
        },
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.userAiKey.deleteMany({
          where: {
            userId: result.dbUser.id,
            provider,
          },
        });

        if (result.dbUser.defaultAiProvider === provider) {
          const remainingKeys = await tx.userAiKey.findMany({
            where: { userId: result.dbUser.id },
            select: {
              provider: true,
              validatedAt: true,
              lastValidationError: true,
            },
          });

          const nextDefault =
            AI_PROVIDER_ORDER.find((candidate) =>
              remainingKeys.some(
                (key) =>
                  key.provider === candidate && isStoredAiKeyUsable(key)
              )
            ) ?? null;

          await tx.user.update({
            where: { id: result.dbUser.id },
            data: { defaultAiProvider: nextDefault },
            select: { id: true },
          });
        }
      });
    }

    revalidatePath("/settings");
    return { status: 200, message: "API key deleted successfully" };
  } catch (error) {
    console.error("Failed to delete AI key:", error);
    return { status: 500, error: "Failed to delete API key" };
  }
}

export async function getUserAiKeysStatus() {
  const result = await getUserAiConfiguration();

  if (result.status !== 200 || !result.data) {
    return result;
  }

  return {
    status: 200,
    data: {
      google: result.data.providers.some(
        (provider) => provider.provider === AiProvider.GOOGLE && provider.configured
      ),
      openai: result.data.providers.some(
        (provider) => provider.provider === AiProvider.OPENAI && provider.configured
      ),
      groq: result.data.providers.some(
        (provider) => provider.provider === AiProvider.GROQ && provider.configured
      ),
    },
  };
}

export async function testAiKeyConnection(
  providerOrInput: AiProvider | TestAiKeyConnectionInput,
  legacyKey?: string,
  legacyModelName?: string
) {
  const input: TestAiKeyConnectionInput =
    typeof providerOrInput === "string"
      ? {
          provider: providerOrInput,
          apiKey: legacyKey || "",
          modelName: legacyModelName,
        }
      : providerOrInput;

  const result = await validateAiConnection(input);

  if (!result.success) {
    return { status: 400, error: result.error };
  }

  return {
    status: 200,
    message: result.message,
    data: {
      modelName: result.modelName,
    },
  };
}
