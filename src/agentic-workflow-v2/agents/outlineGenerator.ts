// agents/outlineGenerator.ts - Agent 2: Generate Presentation Outline

import { generateObject } from "ai";
import { model, modelConfigs } from "../lib/llm";
import { AdvancedPresentationState } from "../lib/state";
import { outlineSchema, validateSlideCount } from "../lib/validators";

/**
 * Agent 2: Outline Generator (Enhanced)
 * 
 * Purpose: Generates a structured outline for the presentation
 * - Analyzes topic complexity
 * - Generates 5-15 slide topics based on complexity
 * - Ensures logical flow and coherence
 * 
 * @param state - Current graph state
 * @returns Updated state with outlines and initialized slide data
 */
export async function runOutlineGenerator(
  state: AdvancedPresentationState
): Promise<Partial<AdvancedPresentationState>> {
  console.log("\n┌─────────────────────────────────────────┐");
  console.log("│  📋 AGENT 2: Outline Generator         │");
  console.log("└─────────────────────────────────────────┘");

  try {
    const topic = state.userInput;
    const context = state.additionalContext || "";
    
    console.log(`📝 Topic: "${topic}"`);
    if (context) {
      console.log(`📎 Additional Context: "${context.slice(0, 100)}..."`);
    }

    // Build comprehensive prompt
    const prompt = `You are an expert presentation strategist. Analyze the following topic and create a logical, comprehensive outline for a professional presentation.

Topic: "${topic}"
${context ? `Additional Context: "${context}"` : ""}

Instructions:
1. Analyze the complexity and scope of this topic
2. Generate between 5-15 slide topics (more complex topics need more slides)
3. Start with an introduction/overview slide
4. Include main content slides that build logically on each other
5. End with a conclusion or call-to-action slide
6. Each outline point should be clear, concise, and specific
7. Ensure natural flow from one topic to the next

Example for "Marketing Strategy for Startups":
- Introduction to Marketing for Startups
- Understanding Your Target Audience
- Building Your Brand Identity
- Digital Marketing Channels
- Content Marketing Strategy
- Social Media Best Practices
- Measuring Marketing ROI
- Conclusion and Next Steps

Generate the outline now:`;

    console.log("🤖 Calling AI to generate outline...");

    const { object } = await generateObject({
      model: model,
      schema: outlineSchema,
      prompt: prompt,
      temperature: modelConfigs.outline.temperature,
      maxTokens: modelConfigs.outline.maxTokens,
    });

    const outlines = object.outlines;
    console.log(`✅ Generated ${outlines.length} slide topics:`);
    outlines.forEach((outline, i) => {
      console.log(`   ${i + 1}. ${outline}`);
    });

    // Validate outline count
    if (outlines.length < 5 || outlines.length > 15) {
      console.warn(
        `⚠️  Warning: Generated ${outlines.length} outlines (expected 5-15)`
      );
    }

    // Initialize slide data for each outline
    const initialSlideData = outlines.map((outline) => ({
      outline,
      slideTitle: null,
      slideContent: null,
      layoutType: null,
      imageQuery: null,
      imageUrl: null,
      finalJson: null,
      validationStatus: "pending" as const,
    }));

    return {
      outlines: outlines,
      slideData: initialSlideData,
      currentStep: "Outline Generated",
      progress: 20, // 20% complete
    };
  } catch (error) {
    console.error("🔴 Error generating outline:", error);
    return {
      error: `Failed to generate outline: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
