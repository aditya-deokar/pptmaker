// agents/layoutSelector.ts - Agent 4: Select Optimal Layouts (AI-Powered)

import { generateObject } from "ai";
import { model, modelConfigs } from "../lib/llm";
import { AdvancedPresentationState } from "../lib/state";
import { layoutSelectionSchema, validateSlideCount } from "../lib/validators";
import { LAYOUT_DESCRIPTIONS, getLayoutTemplate } from "../lib/layoutTemplates";

/**
 * Agent 4: Layout Selector (NEW)
 * 
 * Purpose: Intelligently selects the best layout for each slide based on content
 * - Analyzes content type and structure
 * - Selects optimal layout from available templates
 * - Ensures variety in presentation
 * 
 * @param state - Current graph state
 * @returns Updated state with layout types
 */
export async function runLayoutSelector(
  state: AdvancedPresentationState
): Promise<Partial<AdvancedPresentationState>> {
  console.log("\n┌─────────────────────────────────────────┐");
  console.log("│  🎨 AGENT 4: Layout Selector           │");
  console.log("└─────────────────────────────────────────┘");

  if (!state.slideData || state.slideData.length === 0) {
    console.log("⚠️  No slide data to process. Skipping layout selection.");
    return {};
  }

  try {
    const slides = state.slideData;
    console.log(`🎯 Selecting layouts for ${slides.length} slides...`);

    // Format slide content for analysis
    const slidesSummary = slides
      .map((slide, index) => {
        return `Slide ${index + 1}:
  Outline: ${slide.outline}
  Title: ${slide.slideTitle}
  Content: ${slide.slideContent?.slice(0, 150)}...`;
      })
      .join("\n\n");

    const prompt = `You are a presentation design expert. Analyze each slide's content and select the most appropriate layout type.

${LAYOUT_DESCRIPTIONS}

Slides to analyze:
${slidesSummary}

Instructions:
1. For each slide, select the layout type that best fits its content
2. Consider:
   - Content length and structure
   - Whether the slide benefits from visuals (use image layouts)
   - If comparing items (use column layouts)
   - If listing features or steps (use multi-column layouts)
3. Ensure variety - avoid using the same layout for 3+ consecutive slides
4. First slide is usually "blank-card" (introduction)
5. Last slide can be "blank-card" (conclusion) or image-based (call-to-action)
6. Provide brief reasoning for each choice

Generate layout selections for all ${slides.length} slides:`;

    console.log("🤖 Calling AI to select layouts...");

    const { object } = await generateObject({
      model: model,
      schema: layoutSelectionSchema,
      prompt: prompt,
      temperature: modelConfigs.layout.temperature,
      maxTokens: modelConfigs.layout.maxTokens,
    });

    const layouts = object.layouts;

    // Validate we got selections for all slides
    validateSlideCount(layouts.length, slides.length, "Layout Selector");

    console.log(`✅ Selected layouts:`);
    layouts.forEach((layout, i) => {
      console.log(
        `   ${i + 1}. ${layout.layoutType} - ${layout.reasoning.slice(0, 50)}...`
      );
    });

    // Update slide data with layout types
    const updatedSlideData = state.slideData.map((slide, index) => {
      const selectedLayout = layouts[index];
      const template = getLayoutTemplate(selectedLayout.layoutType);
      
      return {
        ...slide,
        layoutType: selectedLayout.layoutType,
      };
    });

    return {
      slideData: updatedSlideData,
      currentStep: "Layouts Selected",
      progress: 55, // 55% complete
    };
  } catch (error) {
    console.error("🔴 Error selecting layouts:", error);
    return {
      error: `Failed to select layouts: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
