import { getAiModel } from "@/lib/ai-provider";

function getMobileDesignIdentity(appUserId?: string) {
  return appUserId ? { appUserId } : undefined;
}

/**
 * Mobile design uses the shared BYOK resolver.
 * If the user has saved a preferred provider/model, that wins.
 * Otherwise we fall back to a strong hosted Gemini default.
 */
export async function getMobileDesignAnalysisModel(appUserId?: string) {
  return getAiModel(
    "gemini-2.5-flash",
    undefined,
    getMobileDesignIdentity(appUserId)
  );
}

export async function getMobileDesignGenerationModel(appUserId?: string) {
  return getAiModel(
    "gemini-2.5-flash",
    undefined,
    getMobileDesignIdentity(appUserId)
  );
}
