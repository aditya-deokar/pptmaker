// /agents/imageQueryAgent.ts

import { z } from "zod";
import { generateObject } from "ai"; 
import { model } from "../lib/llm"; 
import { PresentationGraphState } from "../lib/state";

// The Zod schema remains the same
const imageQuerySchema = z.object({
  query: z.string().describe("A vivid, descriptive, and detailed prompt for an AI image generator, suitable for creating a visually appealing slide background or illustration. Should be 40-50 words."),
});

/**
 * Agent 4: Writes a creative image prompt for slides that need one.
 * It finds the next slide where `imageQuery` is 'pending'.
 * @param state The current state of the graph.
 * @returns A partial state object with the updated slide data.
 */
export async function runImageQueryGenerator(state: PresentationGraphState): Promise<Partial<PresentationGraphState>> {
  console.log("--- Running Image Query Generator Agent ---");

  const currentSlideIndex = state.slideData.findIndex(
    (slide) => slide.imageQuery === "pending"
  );

  if (currentSlideIndex === -1) {
    console.log("✅ All necessary image queries have been generated.");
    return {};
  }

  const currentSlide = state.slideData[currentSlideIndex];
  console.log(`🖼️ Writing image query for slide ${currentSlideIndex + 1}: "${currentSlide.outline}"`);

  // --- CONVERTED ---
  // Replaced the LangChain call with the AI SDK's `generateObject`.
  try {
    const { object } = await generateObject({
      model: model,
      schema: imageQuerySchema,
      prompt: `
        You are an expert AI prompt engineer and creative director. Your task is to write a single, high-quality image generation prompt for a presentation slide.

        **Guidelines:**
        - The prompt should be descriptive, vivid, and suitable for a model like DALL-E 3 or Midjourney.
        - Focus on concepts, metaphors, or abstract visuals related to the slide's content.
        - Aim for a professional, clean, and modern aesthetic. Use keywords like "digital art," "photorealistic," "cinematic lighting," "4k".
        - DO NOT include any text in the image prompt.

        --- SLIDE CONTENT ---
        **Topic:** "${currentSlide.outline}"
        **Title:** "${currentSlide.slideTitle}"
        **Body:** "${currentSlide.slideContent}"
        --- END CONTENT ---

        Based on the content above, generate the creative image prompt.
      `,
    });

    const { query } = object; // The result is nested in the 'object' property

    // State update logic remains the same
    const updatedSlideData = [...state.slideData];
    updatedSlideData[currentSlideIndex] = {
      ...updatedSlideData[currentSlideIndex],
      imageQuery: query,
    };

    return {
      slideData: updatedSlideData,
    };
  } catch (error) {
    console.error(`🔴 Error generating image query for slide "${currentSlide.outline}":`, error);
    return {
      error: `Failed to generate image query for the slide: ${currentSlide.outline}`,
    };
  }
}