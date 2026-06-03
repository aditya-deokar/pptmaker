import { AiProvider } from "@/generated/prisma";

export type RecommendedAiModel = {
  description: string;
  label: string;
  value: string;
};

export type AiProviderMetadata = {
  defaultModel: string;
  description: string;
  keyLabel: string;
  label: string;
  recommendedModels: RecommendedAiModel[];
};

export const AI_PROVIDER_ORDER = [
  AiProvider.GOOGLE,
  AiProvider.OPENAI,
  AiProvider.GROQ,
] as const;

export const AI_PROVIDER_METADATA: Record<AiProvider, AiProviderMetadata> = {
  [AiProvider.GOOGLE]: {
    label: "Google Gemini",
    description: "Best fit for fast multimodal presentation generation.",
    keyLabel: "Gemini API key",
    defaultModel: "gemini-2.5-flash",
    recommendedModels: [
      {
        value: "gemini-2.5-flash",
        label: "Gemini 2.5 Flash",
        description: "Best default for slide generation and structured output.",
      },
      {
        value: "gemini-2.5-flash-lite",
        label: "Gemini 2.5 Flash Lite",
        description: "Lower-cost option for lightweight generation.",
      },
      {
        value: "gemini-1.5-flash",
        label: "Gemini 1.5 Flash",
        description: "Safe fallback if your account does not expose 2.5 yet.",
      },
    ],
  },
  [AiProvider.OPENAI]: {
    label: "OpenAI",
    description: "Great for high-quality reasoning and writing-heavy decks.",
    keyLabel: "OpenAI API key",
    defaultModel: "gpt-4.1-mini",
    recommendedModels: [
      {
        value: "gpt-4.1-mini",
        label: "GPT-4.1 Mini",
        description: "Balanced quality, speed, and cost for presentations.",
      },
      {
        value: "gpt-4o-mini",
        label: "GPT-4o Mini",
        description: "Fast and affordable for everyday generation.",
      },
      {
        value: "gpt-4.1",
        label: "GPT-4.1",
        description: "Higher quality when you want the strongest writing.",
      },
    ],
  },
  [AiProvider.GROQ]: {
    label: "Groq",
    description: "Very fast open-weight inference with strong value.",
    keyLabel: "Groq API key",
    defaultModel: "llama-3.3-70b-versatile",
    recommendedModels: [
      {
        value: "llama-3.3-70b-versatile",
        label: "Llama 3.3 70B Versatile",
        description: "Best Groq default for rich content generation.",
      },
      {
        value: "llama-3.1-8b-instant",
        label: "Llama 3.1 8B Instant",
        description: "Fast and economical for quick drafts.",
      },
      {
        value: "mixtral-8x7b-32768",
        label: "Mixtral 8x7B",
        description: "Useful alternative for wide context generation.",
      },
    ],
  },
};

const MODEL_PREFIXES: Record<AiProvider, string[]> = {
  [AiProvider.GOOGLE]: ["gemini"],
  [AiProvider.OPENAI]: ["gpt", "o1", "o3", "o4"],
  [AiProvider.GROQ]: [
    "llama",
    "mixtral",
    "gemma",
    "qwen",
    "mistral",
    "deepseek",
    "compound",
  ],
};

export function normalizeModelName(modelName?: string | null) {
  const normalized = modelName?.trim();
  return normalized ? normalized : null;
}

export function getDefaultModelForProvider(provider: AiProvider) {
  return AI_PROVIDER_METADATA[provider].defaultModel;
}

export function getRecommendedModels(provider: AiProvider) {
  return AI_PROVIDER_METADATA[provider].recommendedModels;
}

export function isModelCompatibleWithProvider(
  provider: AiProvider,
  modelName?: string | null
) {
  const normalized = normalizeModelName(modelName);
  if (!normalized) {
    return true;
  }

  const lowercaseModel = normalized.toLowerCase();

  return MODEL_PREFIXES[provider].some((prefix) =>
    lowercaseModel.startsWith(prefix)
  );
}

export function inferProviderFromModelName(modelName?: string | null) {
  const normalized = normalizeModelName(modelName);
  if (!normalized) {
    return null;
  }

  const provider = AI_PROVIDER_ORDER.find((candidate) =>
    isModelCompatibleWithProvider(candidate, normalized)
  );

  return provider ?? null;
}
