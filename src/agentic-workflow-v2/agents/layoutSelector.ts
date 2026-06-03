// agents/layoutSelector.ts - Agent 4: Select Optimal Layouts (AI-Powered)

import { generateObject } from "ai";
import { getModel, modelConfigs } from "../lib/llm";
import { AdvancedPresentationState } from "../lib/state";
import { layoutSelectionSchema, validateSlideCount } from "../lib/validators";
import { LAYOUT_DESCRIPTIONS, getLayoutTemplate } from "../lib/layoutTemplates";

function emitToken(state: AdvancedPresentationState, content: string) {
  if (state.streamEventHandler) {
    state.streamEventHandler({
      type: 'token',
      agentId: 'layoutSelector',
      content,
      timestamp: Date.now(),
    });
  }
}

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

    // Format slide outlines for analysis (content not yet generated at this stage)
    const slidesSummary = slides
      .map((slide, index) => {
        return `Slide ${index + 1}: ${slide.outline}`;
      })
      .join("\n");

    const prompt = `You are an ELITE presentation designer with expertise in visual communication and layout optimization. Your mission: Select the PERFECT layout for each slide to maximize impact and engagement.

Presentation Topic: "${state.userInput}"
${state.additionalContext ? `Additional Context: "${state.additionalContext}"` : ""}

${LAYOUT_DESCRIPTIONS}

═══════════════════════════════════════════════════════════════
📊 SLIDE OUTLINES TO ANALYZE
═══════════════════════════════════════════════════════════════
${slidesSummary}

═══════════════════════════════════════════════════════════════
✨ OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════
For each slide, provide:
1. **layoutType:** One of the 28 available layouts (follow the MANDATORY SELECTION RULES above strictly!)
2. **reasoning:** 30-50 word explanation of WHY this layout is perfect for this content

CRITICAL REMINDERS:
- You MUST follow every MANDATORY SELECTION RULE listed above (banned layouts, required first/last slides, diversity minimums)
- Prefer CREATIVE and ADVANCED layouts over basic column layouts — they make presentations look premium
- Match content type to layout purpose (stats→bigNumberLayout/statsRow, comparisons→comparisonLayout, processes→processFlow, etc.)
- Think like a professional designer building a keynote presentation, NOT a generic slideshow

Generate layout selections for all ${slides.length} slides NOW:`;

    console.log("🤖 Calling AI to select layouts...");

    const model = await getModel(state.userId);
    const { object } = await generateObject({
      model: model,
      schema: layoutSelectionSchema,
      prompt: prompt,
      temperature: modelConfigs.layout.temperature,
    });

    const layouts = object.layouts;

    // Validate we got selections for all slides
    validateSlideCount(layouts.length, slides.length, "Layout Selector");

    console.log(`✅ Selected layouts:`);
    layouts.forEach((layout: (typeof layouts)[number], i: number) => {
      console.log(
        `   ${i + 1}. ${layout.layoutType} - ${layout.reasoning.slice(0, 50)}...`
      );
      emitToken(state, `Slide ${i + 1}: ${layout.layoutType}`);
    });

    // Update slide data with layout types
    const updatedSlideData = state.slideData.map((slide, index) => {
      const selectedLayout = layouts[index];
      
      return {
        ...slide,
        layoutType: selectedLayout.layoutType,
      };
    });

    return {
      slideData: updatedSlideData,
      currentStep: "Layouts Selected",
      progress: 30, // 30% complete (runs before content writer now)
    };
  } catch (error) {
    console.error("🔴 Error selecting layouts:", error);
    return {
      error: `Failed to select layouts: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
