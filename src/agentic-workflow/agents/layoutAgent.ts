// /agents/layoutAgent.ts

import { z } from "zod";
import { generateObject } from "ai"; // --- CONVERTED ---
import { model } from "../lib/llm"; // Assuming llm.ts now exports an AI SDK model
import { PresentationGraphState } from "../lib/state";

// --- The Zod schemas do not need any changes ---
const availableLayouts = z.enum([
  "title",
  "paragraph",
  "bulletList",
  "numberedList",
  "blockquote",
  "calloutBox",
  "table",
  "codeBlock",
]);

const layoutSchema = z.object({
  layoutType: availableLayouts.describe("The best layout type for the textual content of the slide."),
  imageNeeded: z.boolean().describe("Set to true if a relevant image would significantly enhance this slide's content."),
});

/**
 * Agent 3 (Upgraded): Analyzes slide content and chooses the best layout from a rich component library.
 * It also decides if the slide would benefit from an accompanying image.
 *
 * @param state The current state of the graph.
 * @returns A partial state object with the updated slide data.
 */
export async function runLayoutDesigner(state: PresentationGraphState): Promise<Partial<PresentationGraphState>> {
  console.log("--- Running Upgraded Layout Designer Agent ---");

  const currentSlideIndex = state.slideData.findIndex(
    (slide) => slide.slideContent && !slide.layoutType
  );

  if (currentSlideIndex === -1) {
    console.log("✅ All slide layouts have been decided.");
    return {};
  }

  const currentSlide = state.slideData[currentSlideIndex];
  console.log(`🎨 Designing layout for slide ${currentSlideIndex + 1}: "${currentSlide.outline}"`);

  // --- CONVERTED ---
  // The LangChain `withStructuredOutput` and `invoke` calls are replaced
  // with a single `generateObject` call from the AI SDK.
  try {
    const { object } = await generateObject({
      model: model,
      schema: layoutSchema,
      prompt: `
        You are an expert presentation visual designer. Your task is to analyze the slide's content and choose the best layout for the text, while also deciding if an accompanying image is necessary.

        --- COMPONENT STYLE GUIDE ---
        Here is your toolkit of available layouts and when to use them:
        - "title": Use ONLY for a main title slide or a section break. The body content should be empty or a very short subtitle.
        - "paragraph": The default choice for standard text-based slides with one or more paragraphs.
        - "bulletList": Use if the content is clearly a list of items, especially if it uses markdown like '-' or '*'.
        - "numberedList": Use if the content is a sequential list or a step-by-step guide.
        - "blockquote": Use for a short, impactful quote, a testimonial, or a key takeaway statement.
        - "calloutBox": Use to highlight a critical piece of information, like a warning, a pro-tip, a statistic, or a key definition.
        - "table": Use if the content is structured in a way that looks like a table (e.g., comparing features, showing data with headers).
        - "codeBlock": Use ONLY if the content contains a snippet of code in any programming language.

        --- IMAGE GUIDELINES ---
        Set 'imageNeeded' to true if the slide topic is abstract, conceptual, or would be made clearer or more engaging with a visual aid. Do not add images to slides that are purely informational lists or dense text.

        --- ANALYSIS TASK ---
        Analyze the following slide content and return your decision in the required JSON format.

        **Slide Topic:** "${currentSlide.outline}"
        **Slide Title:** "${currentSlide.slideTitle}"
        **Slide Body Content:**
        \`\`\`
        ${currentSlide.slideContent}
        \`\`\`
      `,
    });

    const { layoutType, imageNeeded } = object; // The result is nested in the 'object' property
    console.log(` decyzja: Layout: ${layoutType}, Image Needed: ${imageNeeded}`);

    // The state update logic remains exactly the same
    const updatedSlideData = [...state.slideData];
    updatedSlideData[currentSlideIndex] = {
      ...updatedSlideData[currentSlideIndex],
      layoutType: layoutType,
      imageQuery: imageNeeded ? "pending" : null,
    };

    return {
      slideData: updatedSlideData,
    };
  } catch (error) {
    console.error(`🔴 Error designing layout for slide "${currentSlide.outline}":`, error);
    return {
      error: `Failed to design layout for the slide: ${currentSlide.outline}`,
    };
  }
}
