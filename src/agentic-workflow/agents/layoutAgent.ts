// /agents/layoutAgent.ts

import { z } from "zod";
import { generateObject } from "ai";
import { model } from "../lib/llm";
import { PresentationGraphState } from "../lib/state";

// Schema for a single slide's design decision.
const singleLayoutSchema = z.object({
  layoutType: z.enum([
    "title", "paragraph", "bulletList", "numberedList",
    "blockquote", "calloutBox", "table", "codeBlock",
  ]).describe("The best layout type for the textual content of the slide."),
  imageNeeded: z.boolean().describe("Set to true if a relevant image would significantly enhance this slide's content."),
});

// The main schema for our bulk generation call.
const bulkLayoutSchema = z.object({
  layoutDecisions: z.array(singleLayoutSchema).describe("An array of layout decision objects, one for each slide provided."),
});

/**
 * Agent 3 (Upgraded to Bulk): Analyzes all slide content and chooses layouts in a single API call.
 * This version is enhanced for creativity and variety.
 *
 * @param state The current state of the graph.
 * @returns A partial state object with the updated slide data.
 */
export async function runLayoutDesigner(state: PresentationGraphState): Promise<Partial<PresentationGraphState>> {
  console.log("--- Running Bulk Layout Designer Agent ---");

  if (!state.slideData || state.slideData.length === 0) {
    console.log("✅ No slide data to design layouts for. Skipping.");
    return {};
  }

  const formattedSlidesContent = state.slideData.map((slide, index) => 
    `---
    Slide Index: ${index}
    Topic: "${slide.outline}"
    Title: "${slide.slideTitle}"
    Body: "${slide.slideContent}"
    ---`
  ).join('\n\n');

  try {
    const { object } = await generateObject({
      model: model,
      schema: bulkLayoutSchema,
      prompt: `
        You are an expert presentation visual designer tasked with creating an engaging and varied slide deck. Your goal is to analyze the content for a series of slides and choose the best layout for each one.

        **CRITICAL INSTRUCTION: Strive for variety!** Do not use the same layout for every slide. Use your creative judgment to select a diverse range of layouts from the toolkit to keep the presentation interesting.

        --- COMPONENT STYLE GUIDE & CREATIVE DIRECTION ---
        - "title": Use for the VERY FIRST slide (index 0) and perhaps one section break slide in the middle.
        - "paragraph": Use for slides that explain a concept with 1-2 paragraphs of text. A great alternative to a bullet list.
        - "bulletList": A good default, but use it thoughtfully. Perfect for summarizing key features or points.
        - "numberedList": Use ONLY for sequential steps, a process, or a ranked list.
        - "blockquote": Is there a short, powerful, quotable sentence in the content? If so, use this layout to make it stand out. Perfect for a summary slide.
        - "calloutBox": Use to highlight a critical warning, a pro-tip, a surprising statistic, or a key definition that the audience must remember.
        - "table": Look for content that is clearly comparing items or presenting data. If you see content like "Feature A vs. Feature B", this is a perfect choice.
        - "codeBlock": Use ONLY if the content contains a clear snippet of code.

        --- IMAGE GUIDELINES ---
        Set 'imageNeeded' to true if a slide's topic is abstract, conceptual, or would be made clearer by a visual aid. An introduction, conclusion, or high-level concept slide almost always needs an image.

        --- ANALYSIS TASK ---
        Analyze the following slide content blocks. For each one, generate a corresponding layout decision object, keeping the goal of VARIETY in mind.
        You MUST return a JSON object containing an array called 'layoutDecisions'. This array must have the exact same number of elements as the number of slides provided below, and in the same order.

        ${formattedSlidesContent}
      `,
    });

    if (object.layoutDecisions.length !== state.slideData.length) {
      throw new Error("AI did not return the correct number of layout decision objects.");
    }
    
    const updatedSlideData = state.slideData.map((slide, index) => {
      const decision = object.layoutDecisions[index];
      return {
        ...slide,
        layoutType: decision.layoutType,
        imageQuery: decision.imageNeeded ? "pending" : null,
      };
    });

    console.log("✅ All slide layouts have been designed in a single batch with variety.");

    return {
      slideData: updatedSlideData,
    };
  } catch (error) {
    console.error(`🔴 Error designing layouts for all slides:`, error);
    return {
      error: `Failed to design layouts for the presentation slides.`,
    };
  }
}