// /agents/imageQueryAgent.ts

import { z } from "zod";
import { generateObject } from "ai";
import { model } from "../lib/llm";
import { PresentationGraphState } from "../lib/state";

// --- NEW SCHEMA ---
// This schema describes the output for a single image query.
const singleImageQuerySchema = z.object({
  slideIndex: z.number().describe("The original index of the slide this query is for."),
  query: z.string().describe("A vivid, descriptive, and detailed prompt for an AI image generator, or a descriptive search term for a stock photo API. Should be 30-40 words."),
});

// --- NEW SCHEMA ---
// The main schema for our bulk generation call. It expects an array of query objects.
const bulkImageQuerySchema = z.object({
  imageQueries: z.array(singleImageQuerySchema).describe("An array of image query objects, one for each slide that requires an image."),
});


/**
 * Agent 4 (Upgraded): Writes creative image prompts for ALL slides that need one in a single API call.
 * This is more efficient and avoids rate-limiting issues.
 * @param state The current state of the graph.
 * @returns A partial state object with the updated slide data.
 */
export async function runImageQueryGenerator(state: PresentationGraphState): Promise<Partial<PresentationGraphState>> {
  console.log("--- Running Bulk Image Query Generator Agent ---");

  // 1. Identify which slides need an image query.
  // We map them to an object with their content and original index.
  const slidesNeedingImages = state.slideData
    .map((slide, index) => ({ ...slide, originalIndex: index }))
    .filter((slide) => slide.imageQuery === "pending");

  if (slidesNeedingImages.length === 0) {
    console.log("✅ No image queries needed. Skipping.");
    return {};
  }

  // 2. Format the content of these slides for the prompt.
  const formattedSlidesContent = slidesNeedingImages.map(slide => 
    `---
    Slide Index: ${slide.originalIndex}
    Topic: "${slide.outline}"
    Title: "${slide.slideTitle}"
    Body: "${slide.slideContent}"
    ---`
  ).join('\n\n');

  try {
    const { object } = await generateObject({
      model: model,
      schema: bulkImageQuerySchema,
      prompt: `
        You are an expert AI prompt engineer and creative director. Your task is to write high-quality image generation prompts for a list of presentation slides.

        **Guidelines:**
        - For each slide, create a prompt that is descriptive, vivid, and suitable for a model like DALL-E 3 or a stock photo search like Unsplash.
        - Focus on concepts, metaphors, or abstract visuals related to the slide's content.
        - Aim for a professional, clean, and modern aesthetic. Use keywords like "digital art," "photorealistic," "cinematic lighting," "4k".
        - Ensure variety; do not generate similar-sounding prompts for different slides.
        - DO NOT include any text in the image prompts themselves.
        
        **Your Task:**
        Analyze the following slide content blocks. For each one, generate a corresponding image query object.
        You MUST return a JSON object containing an array called 'imageQueries'. This array must have the exact same number of elements as the number of slides provided below.

        ${formattedSlidesContent}
      `,
    });

    // 3. Merge the generated queries back into the main slideData array.
    const updatedSlideData = [...state.slideData];
    object.imageQueries.forEach(generatedQuery => {
      // Use the original index returned by the AI to update the correct slide
      const targetIndex = generatedQuery.slideIndex;
      if (updatedSlideData[targetIndex]) {
        updatedSlideData[targetIndex].imageQuery = generatedQuery.query;
      }
    });
    
    console.log(`✅ ${object.imageQueries.length} image queries generated in a single batch.`);

    return {
      slideData: updatedSlideData,
    };
  } catch (error) {
    console.error(`🔴 Error generating bulk image queries:`, error);
    return {
      error: `Failed to generate image queries for the presentation.`,
    };
  }
}