// agents/contentWriter.ts - Agent 3: Write Content for All Slides (Bulk)

import { generateObject } from "ai";
import { model, modelConfigs } from "../lib/llm";
import { AdvancedPresentationState } from "../lib/state";
import { bulkContentSchema, validateSlideCount } from "../lib/validators";

/**
 * Agent 3: Content Writer (Bulk)
 * 
 * Purpose: Writes title and body content for ALL slides in a single API call
 * - More efficient than per-slide generation
 * - Ensures consistent tone and style
 * - Avoids rate limiting
 * 
 * @param state - Current graph state
 * @returns Updated state with slide titles and content
 */
export async function runContentWriter(
  state: AdvancedPresentationState
): Promise<Partial<AdvancedPresentationState>> {
  console.log("\n┌─────────────────────────────────────────┐");
  console.log("│  ✍️  AGENT 3: Content Writer (Bulk)     │");
  console.log("└─────────────────────────────────────────┘");

  if (!state.outlines || state.outlines.length === 0) {
    console.log("⚠️  No outlines to process. Skipping content generation.");
    return {};
  }

  try {
    const outlines = state.outlines;
    const topic = state.userInput;
    const context = state.additionalContext || "";
    
    console.log(`📝 Generating content for ${outlines.length} slides...`);

    // Format outlines for prompt
    const formattedOutlines = outlines
      .map((outline, index) => `${index + 1}. ${outline}`)
      .join("\n");

    const prompt = `You are an expert presentation copywriter. Write compelling, professional content for a presentation.

Overall Topic: "${topic}"
${context ? `Additional Context: "${context}"` : ""}

Slide Outlines:
${formattedOutlines}

Instructions:
1. For EACH outline above, generate:
   - A compelling, concise title (max 100 characters)
   - Main body content (150-500 characters per slide)
2. Content should be:
   - Clear and easy to understand
   - Professional and engaging
   - Suitable for presentation slides (not essay format)
   - Use bullet points (markdown format with "-") when listing items
3. Maintain consistent tone throughout
4. Build narrative flow from slide to slide
5. You MUST generate exactly ${outlines.length} slide contents in the exact same order

Example format:
Title: "Introduction to AI"
Content: "Artificial Intelligence is transforming industries worldwide:\n- Automation of repetitive tasks\n- Enhanced decision-making\n- Personalized user experiences"

Generate all slide content now:`;

    console.log("🤖 Calling AI to generate content...");

    const { object } = await generateObject({
      model: model,
      schema: bulkContentSchema,
      prompt: prompt,
      temperature: modelConfigs.content.temperature,
      maxTokens: modelConfigs.content.maxTokens,
    });

    const slidesContent = object.slidesContent;

    // Validate we got the right number of slides
    validateSlideCount(
      slidesContent.length,
      outlines.length,
      "Content Writer"
    );

    console.log(`✅ Generated content for ${slidesContent.length} slides:`);
    slidesContent.forEach((slide, i) => {
      console.log(`   ${i + 1}. ${slide.title}`);
      console.log(`      Content: ${slide.content.slice(0, 60)}...`);
    });

    // Update slide data with titles and content
    const updatedSlideData = state.slideData.map((slide, index) => ({
      ...slide,
      slideTitle: slidesContent[index].title,
      slideContent: slidesContent[index].content,
    }));

    return {
      slideData: updatedSlideData,
      currentStep: "Content Written",
      progress: 40, // 40% complete
    };
  } catch (error) {
    console.error("🔴 Error generating content:", error);
    return {
      error: `Failed to generate content: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
