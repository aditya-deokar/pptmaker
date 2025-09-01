// /agents/contentAgent.ts

import { z } from "zod";
import { generateObject } from "ai";
import { PresentationGraphState } from "../lib/state";
import { model } from "../lib/llm";


// Define the expected output structure for this agent
const contentSchema = z.object({
  title: z.string().describe("A compelling and concise title for the slide."),
  content: z.string().describe("The main body content for the slide. This can be a paragraph or a markdown list (using '-' for bullets). Keep it brief and engaging."),
});

/**
 * Agent 2: Writes the title and body content for a single slide.
 * It finds the next slide that needs content and processes it.
 * @param state The current state of the graph.
 * @returns A partial state object with the updated slide data.
 */
export async function runContentWriter(state: PresentationGraphState): Promise<Partial<PresentationGraphState>> {
  console.log("--- Running Content Writer Agent ---");

  // Find the index of the first slide that has an outline but no title yet.
  const currentSlideIndex = state.slideData.findIndex(slide => slide.slideTitle === null);

  // If all slides are done, there's nothing to do.
  if (currentSlideIndex === -1) {
    console.log("✅ All slide content has been generated.");
    return {};
  }
  
  const currentSlide = state.slideData[currentSlideIndex];
  console.log(`✍️ Writing content for slide ${currentSlideIndex + 1}: "${currentSlide.outline}"`);

  try {
    const { object } = await generateObject({
      model: model,
      schema: contentSchema,
      prompt: `You are an expert presentation copywriter. Your task is to write the content for a single slide.
      The overall presentation topic is: "${state.userInput}".
      The specific topic for this slide is: "${currentSlide.outline}".
      Please generate a title and the main content. The content should be suitable for a presentation slide (concise, clear, and easy to read). If listing items, use markdown bullets.`,
    });
    
    // Create a new array with the updated slide data to avoid mutation
    const updatedSlideData = [...state.slideData];
    updatedSlideData[currentSlideIndex] = {
      ...updatedSlideData[currentSlideIndex],
      slideTitle: object.title,
      slideContent: object.content,
    };

    return {
      slideData: updatedSlideData,
    };
  } catch (error) {
    console.error(`🔴 Error writing content for slide "${currentSlide.outline}":`, error);
    return {
      error: `Failed to write content for the slide: ${currentSlide.outline}`,
    };
  }
}