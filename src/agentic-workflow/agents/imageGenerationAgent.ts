// /agents/imageGenerationAgent.ts
import { PresentationGraphState } from "../lib/state";

// Gemini REST endpoint for image generation (preview)
const GEMINI_IMAGE_MODEL =
  "gemini-2.5-flash-image-preview";
const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`;

/**
 * Calls Gemini 2.5 Flash Image Preview to generate an image from a text prompt
 * and returns a data URL (data:<mime>;base64,<bytes>) for easy in-app rendering.
 * When no image is returned, resolves to null.
 */
async function generateImageUrl(query: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("🔴 GEMINI_API_KEY is not set");
    return null;
  }

  // Minimal request: text prompt only; model returns interleaved parts, including image inline_data.
  // See: image bytes appear in response.candidates.content.parts[*].inline_data
  const body = {
    contents: [
      {
        parts: [{ text: query }],
      },
    ],
    // Optional: you can explicitly request images; omitted here for maximal compatibility
    // generationConfig: { responseModalities: ["IMAGE"] },
  };

  try {
    const resp = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error("🔴 Gemini API error:", resp.status, errText);
      return null;
    }

    const data = await resp.json();

    // Find first inline image in the candidates
    const candidates = data?.candidates ?? [];
    for (const c of candidates) {
      const parts = c?.content?.parts ?? [];
      for (const p of parts) {
        // REST uses snake_case inline_data; SDKs may camelCase (inlineData). Handle both.
        const inline = p.inline_data || p.inlineData;
        if (inline?.data) {
          const mime =
            inline.mime_type || inline.mimeType || "image/png";
          const b64 = inline.data;
          return `data:${mime};base64,${b64}`;
        }
      }
    }

    console.warn("⚠️ No image bytes found in Gemini response.");
    return null;
  } catch (error) {
    console.error("🔴 Gemini image generation failed:", error);
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
    console.log("✅ All necessary images have been generated.");
    return {};
  }

  const currentSlide = state.slideData[currentSlideIndex];
  console.log(
    `🏞️ Generating image for slide ${currentSlideIndex + 1}: "${currentSlide.outline}"`
  );

  const imageUrl = await generateImageUrl(currentSlide.imageQuery!);

  const updatedSlideData = [...state.slideData];
  updatedSlideData[currentSlideIndex] = {
    ...updatedSlideData[currentSlideIndex],
    imageUrl, // data URL or null if generation failed
  };

  return { slideData: updatedSlideData };
}
