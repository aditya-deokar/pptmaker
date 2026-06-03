// /agents/imageGenerationAgent.ts
import { generateText } from "ai";
import { AiProvider } from "@/generated/prisma";
import { getAiModel } from "@/lib/ai-provider";
import { PresentationGraphState } from "../lib/state";

/**
 * Uses the shared resolver so legacy image generation does not depend on
 * standalone Gemini environment variables anymore.
 */
async function generateImageUrl(query: string): Promise<string | null> {
  try {
    const result = await generateText({
      model: await getAiModel("gemini-3-flash-preview", AiProvider.GOOGLE),
      providerOptions: {
        google: { responseModalities: ["TEXT", "IMAGE"] },
      },
      prompt: query,
    });

    const imageFile = result.files?.find((file) => {
      const mimeType = (file as any).mimeType;
      return mimeType && typeof mimeType === "string" && mimeType.startsWith("image/");
    });

    if (imageFile?.base64) {
      const mimeType = (imageFile as any).mimeType || "image/png";
      return `data:${mimeType};base64,${imageFile.base64}`;
    }

    console.warn("No image bytes found in Gemini response.");
    return null;
  } catch (error) {
    console.error("Gemini image generation failed:", error);
    return null;
  }
}

/**
 * Agent 5: Fetches an image URL (data URL) for each slide that needs one.
 * It finds the next slide that has a query but no final URL.
 */
export async function runImageGenerator(
  state: PresentationGraphState
): Promise<Partial<PresentationGraphState>> {
  console.log("--- Running Image Generation Tool Node (Gemini) ---");

  const currentSlideIndex = state.slideData.findIndex(
    (slide) => slide.imageQuery && !slide.imageUrl
  );

  if (currentSlideIndex === -1) {
    console.log("All necessary images have been generated.");
    return {};
  }

  const currentSlide = state.slideData[currentSlideIndex];
  console.log(
    `Generating image for slide ${currentSlideIndex + 1}: "${currentSlide.outline}"`
  );

  const imageUrl = await generateImageUrl(currentSlide.imageQuery!);

  const updatedSlideData = [...state.slideData];
  updatedSlideData[currentSlideIndex] = {
    ...updatedSlideData[currentSlideIndex],
    imageUrl,
  };

  return { slideData: updatedSlideData };
}
