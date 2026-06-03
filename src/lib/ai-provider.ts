import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { auth, currentUser } from "@clerk/nextjs/server";
import { AiProvider } from "@/generated/prisma";
import {
  getUserAiConfigRecord,
  type UserAiConfigRecord,
} from "./ai-config-compat";
import { decryptKey } from "./encryption";
import {
  AI_PROVIDER_METADATA,
  AI_PROVIDER_ORDER,
  getDefaultModelForProvider,
  inferProviderFromModelName,
  isModelCompatibleWithProvider,
  normalizeModelName,
} from "./ai-models";
import { isByokActive, isStoredAiKeyUsable } from "./byok-policy";
import prisma from "./prisma";

type ProviderFactory = ReturnType<typeof createGoogleGenerativeAI> &
  ReturnType<typeof createOpenAI> &
  ReturnType<typeof createGroq>;

export type AiRuntimeIdentity = {
  appUserId?: string | null;
  clerkId?: string | null;
};

type ResolveAiRuntimeOptions = {
  identity?: AiRuntimeIdentity;
  modelName?: string | null;
  providerPreference?: AiProvider;
};

export type ValidateAiConnectionInput = {
  apiKey: string;
  modelName?: string | null;
  provider: AiProvider;
};

function hasSystemGoogleKey() {
  return Boolean(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  );
}

function createProviderFactory(provider: AiProvider, apiKey?: string) {
  switch (provider) {
    case AiProvider.OPENAI:
      if (!apiKey) {
        throw new Error("OpenAI requires a user API key.");
      }
      return createOpenAI({ apiKey });
    case AiProvider.GROQ:
      if (!apiKey) {
        throw new Error("Groq requires a user API key.");
      }
      return createGroq({ apiKey });
    case AiProvider.GOOGLE:
    default: {
      const resolvedKey =
        apiKey ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.GEMINI_API_KEY;

      if (!resolvedKey) {
        throw new Error("Google Gemini is not configured on the server.");
      }

      return createGoogleGenerativeAI({ apiKey: resolvedKey });
    }
  }
}

async function resolveRequestIdentity(): Promise<AiRuntimeIdentity> {
  try {
    const { userId } = await auth();
    if (userId) {
      return { clerkId: userId };
    }
  } catch {
    // No active request context.
  }

  try {
    const user = await currentUser();
    if (user?.id) {
      return { clerkId: user.id };
    }
  } catch {
    // Ignore Clerk context failures outside authenticated requests.
  }

  return {};
}

async function getResolvedIdentity(identity?: AiRuntimeIdentity) {
  if (identity?.appUserId || identity?.clerkId) {
    return identity;
  }

  return resolveRequestIdentity();
}

async function getUserAiConfig(identity?: AiRuntimeIdentity) {
  const resolvedIdentity = await getResolvedIdentity(identity);
  return getUserAiConfigRecord(resolvedIdentity) as Promise<UserAiConfigRecord | null>;
}

function getCompatibleModelName(
  provider: AiProvider,
  requestedModelName?: string | null,
  savedModelName?: string | null
) {
  const savedModel = normalizeModelName(savedModelName);
  if (savedModel && isModelCompatibleWithProvider(provider, savedModel)) {
    return savedModel;
  }

  const requestedModel = normalizeModelName(requestedModelName);
  if (requestedModel && isModelCompatibleWithProvider(provider, requestedModel)) {
    return requestedModel;
  }

  return getDefaultModelForProvider(provider);
}

function getPreferredUserProvider(
  userConfig: UserAiConfigRecord | null,
  providerPreference?: AiProvider,
  requestedModelName?: string | null
) {
  if (!userConfig) {
    return null;
  }

  const hasUsableAiKeys = userConfig.keys.some((key) => isStoredAiKeyUsable(key));
  const byokEnabled = isByokActive({
    usageCount: userConfig.usageCount,
    subscriptionStatus: userConfig.subscriptionStatus,
    hasUsableAiKeys,
  });

  if (!byokEnabled) {
    return null;
  }

  const usableKeyMap = new Map(
    userConfig.keys
      .filter((key) => isStoredAiKeyUsable(key))
      .map((key) => [key.provider, key] as const)
  );

  if (providerPreference && usableKeyMap.has(providerPreference)) {
    return providerPreference;
  }

  if (!providerPreference) {
    if (
      userConfig.defaultAiProvider &&
      usableKeyMap.has(userConfig.defaultAiProvider)
    ) {
      return userConfig.defaultAiProvider;
    }

    const inferredProvider = inferProviderFromModelName(requestedModelName);
    if (inferredProvider && usableKeyMap.has(inferredProvider)) {
      return inferredProvider;
    }

    const firstUsableProvider = AI_PROVIDER_ORDER.find((provider) =>
      usableKeyMap.has(provider)
    );
    if (firstUsableProvider) {
      return firstUsableProvider;
    }
  }

  return null;
}

async function markKeyUsed(keyId: string) {
  void prisma.userAiKey
    .update({
      where: { id: keyId },
      data: { lastUsedAt: new Date() },
    })
    .catch((error) => {
      console.error("Failed to update AI key lastUsedAt:", error);
    });
}

async function resolveAiRuntime(options: ResolveAiRuntimeOptions = {}) {
  const { identity, modelName, providerPreference } = options;
  const userConfig = await getUserAiConfig(identity);
  const selectedUserProvider = getPreferredUserProvider(
    userConfig,
    providerPreference,
    modelName
  );

  if (selectedUserProvider && userConfig) {
    const userKey = userConfig.keys.find(
      (key) => key.provider === selectedUserProvider && isStoredAiKeyUsable(key)
    );

    if (userKey) {
      const decryptedKey = decryptKey(userKey.key, userKey.iv, userKey.tag);
      const resolvedModelName = getCompatibleModelName(
        selectedUserProvider,
        modelName,
        userKey.modelName
      );

      if (userConfig.compatibilityMode === "modern") {
        await markKeyUsed(userKey.id);
      }

      return {
        modelName: resolvedModelName,
        provider: selectedUserProvider,
        providerFactory: createProviderFactory(selectedUserProvider, decryptedKey),
        source: "user" as const,
        userKey,
      };
    }
  }

  if (!providerPreference || providerPreference === AiProvider.GOOGLE || hasSystemGoogleKey()) {
    const fallbackProvider = AiProvider.GOOGLE;
    return {
      modelName: getCompatibleModelName(fallbackProvider, modelName),
      provider: fallbackProvider,
      providerFactory: createProviderFactory(fallbackProvider),
      source: "system" as const,
      userKey: null,
    };
  }

  throw new Error(
    `No usable ${AI_PROVIDER_METADATA[providerPreference].label} key found. Add a working API key in settings first.`
  );
}

/**
 * Returns an initialized AI provider based on user settings or system defaults.
 */
export async function getAiProvider(
  providerPreference?: AiProvider,
  identity?: AiRuntimeIdentity
) {
  const runtime = await resolveAiRuntime({ identity, providerPreference });
  return runtime.providerFactory;
}

/**
 * Returns a specific model instance based on user settings or system defaults.
 */
export async function getAiModel(
  modelName?: string,
  providerPreference?: AiProvider,
  identity?: AiRuntimeIdentity
) {
  const runtime = await resolveAiRuntime({
    identity,
    modelName,
    providerPreference,
  });

  return runtime.providerFactory(runtime.modelName);
}

export async function validateAiConnection({
  apiKey,
  modelName,
  provider,
}: ValidateAiConnectionInput) {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    return {
      error: "Please enter an API key before testing the connection.",
      success: false as const,
    };
  }

  const normalizedModel = normalizeModelName(modelName);
  if (normalizedModel && !isModelCompatibleWithProvider(provider, normalizedModel)) {
    return {
      error: `${normalizedModel} does not look like a valid ${AI_PROVIDER_METADATA[provider].label} model name.`,
      success: false as const,
    };
  }

  const resolvedModelName = normalizedModel || getDefaultModelForProvider(provider);

  try {
    const providerFactory = createProviderFactory(provider, trimmedKey);
    const { text } = await generateText({
      model: providerFactory(resolvedModelName),
      prompt: "Reply with OK only.",
      maxOutputTokens: 10,
    });

    if (!text || text.trim().length === 0) {
      return {
        error: "The provider responded, but no text was returned.",
        success: false as const,
      };
    }

    return {
      message: `Connected successfully with ${resolvedModelName}.`,
      modelName: resolvedModelName,
      success: true as const,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error && error.message
          ? error.message
          : "Connection failed. Please check the API key and model name.",
      success: false as const,
    };
  }
}
