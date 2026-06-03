import { getAiModel } from "@/lib/ai-provider";
import { AiProvider } from "@/generated/prisma";

/**
 * Legacy workflow fallback.
 * Routes through the shared resolver so this path no longer bypasses BYOK rules
 * or relies on separate environment variable names.
 */
export async function getModel() {
  return getAiModel("gemini-3-flash-preview", AiProvider.GOOGLE);
}
