// /agents/contentAgent.ts

import { z } from "zod";
import { generateObject } from "ai";
import { PresentationGraphState } from "../lib/state";
import { model } from "../lib/llm";

// Schema for a single slide's content (reusable)
const singleSlideContentSchema = z.object({
  title: z.string().describe("A compelling and concise title for the slide."),
  content: z.string().describe("The main body content for the slide. This can be a paragraph or a markdown list (using '-' for bullets). Keep it brief and engaging."),
});

// --- NEW SCHEMA ---
// This is the main schema for our bulk generation call.
// It expects an object containing an array of slide content.
const bulkContentSchema = z.object({
  slidesContent: z.array(singleSlideContentSchema).describe("An array of content objects, one for each slide outline provided."),
});

/**
 * Agent 2 (Upgraded): Writes the title and body content for ALL slides in a single API call.
 * This is more efficient and helps avoid rate-limiting issues.
 * @param state The current state of the graph.
 * @returns A partial state object with the updated slide data.
 */
export async function runContentWriter(state: PresentationGraphState): Promise<Partial<PresentationGraphState>> {
  console.log("--- Running Bulk Content Writer Agent ---");

  if (!state.outlines || state.outlines.length === 0) {
    console.log("✅ No outlines to process. Skipping content generation.");
    return {};
  }
  
  // Format the outlines into a clear, numbered list for the prompt
  const formattedOutlines = state.outlines.map((outline, index) => `${index + 1}. ${outline}`).join('\n');

  try {
    const { object } = await generateObject({
      model: model,
      schema: bulkContentSchema,
      prompt: `You are an expert presentation copywriter. Your task is to write the title and body content for EVERY slide outline provided below.

      The overall presentation topic is: "${state.userInput}".
      
      Here are the slide outlines:
      ${formattedOutlines}

      Please generate a title and the main content for each outline. The content should be suitable for a presentation slide (concise, clear, and easy to read). If listing items, use markdown bullets.
      You MUST return a JSON object containing an array called 'slidesContent'. This array must have the exact same number of elements as the number of outlines provided, and in the same order.`,
    });
    
    // Robustness check: Ensure the AI returned the correct number of slides
    if (object.slidesContent.length !== state.outlines.length) {
      throw new Error("AI did not return the correct number of slide content objects.");
    }

    // Merge the newly generated content into our existing slideData array
    const updatedSlideData = state.slideData.map((slide, index) => ({
      ...slide,
      slideTitle: object.slidesContent[index].title,
      slideContent: object.slidesContent[index].content,
    }));

    console.log("✅ All slide content has been generated in a single batch.");

    return {
      slideData: updatedSlideData,
    };
  } catch (error) {
    console.error(`🔴 Error writing content for all slides:`, error);
    return {
      error: `Failed to write content for the presentation slides.`,
    };
  }
}