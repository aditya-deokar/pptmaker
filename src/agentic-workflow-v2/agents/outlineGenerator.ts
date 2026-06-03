// agents/outlineGenerator.ts - Agent 2: Generate Presentation Outline

import { generateObject } from "ai";
import { getModel, modelConfigs } from "../lib/llm";
import { AdvancedPresentationState } from "../lib/state";
import { outlineSchema, validateSlideCount } from "../lib/validators";

function emitToken(state: AdvancedPresentationState, content: string) {
  if (state.streamEventHandler) {
    state.streamEventHandler({
      type: 'token',
      agentId: 'outlineGenerator',
      content,
      timestamp: Date.now(),
    });
  }
}

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
    if (state.outlines && state.outlines.length > 0) {
      console.log(`📝 Using ${state.outlines.length} user-provided outlines`);

      const initialSlideData = state.outlines.map((outline) => ({
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
        outlines: state.outlines,
        slideData: initialSlideData,
        currentStep: "Outline Accepted",
        progress: 20,
      };
    }

    const topic = state.userInput;
    const context = state.additionalContext || "";
    
    console.log(`📝 Topic: "${topic}"`);
    if (context) {
      console.log(`📎 Additional Context: "${context.slice(0, 100)}..."`);
    }

    // Build comprehensive prompt
    const prompt = `You are an ELITE presentation strategist and content architect. Your mission: Analyze the topic deeply and create a comprehensive, engaging outline that tells a compelling story.

═══════════════════════════════════════════════════════════════
📋 PRESENTATION TOPIC
═══════════════════════════════════════════════════════════════
Topic: "${topic}"
${context ? `Additional Context: "${context}"` : ""}

═══════════════════════════════════════════════════════════════
🎯 YOUR TASK
═══════════════════════════════════════════════════════════════
Create a strategic outline with 8-15 slide topics that:
1. **Tells a Story:** Build a narrative arc from opening to conclusion
2. **Engages the Audience:** Mix content types to maintain interest
3. **Provides Value:** Each slide should serve a clear purpose
4. **Flows Logically:** Smooth transitions between concepts

═══════════════════════════════════════════════════════════════
📐 OUTLINE STRUCTURE GUIDELINES
═══════════════════════════════════════════════════════════════

**Opening (1-2 slides):**
- Hook/Introduction slide to capture attention
- Problem statement or context setting

**Body (5-11 slides) - Mix these content types:**
- **Concept Explanation Slides:** Core ideas, frameworks, methodologies
- **Data/Statistics Slides:** Numbers, metrics, research findings  
- **Example/Case Study Slides:** Real-world applications, success stories
- **Comparison Slides:** Pros/cons, before/after, options analysis
- **Process/Timeline Slides:** Step-by-step guides, roadmaps, phases
- **Feature/Benefit Slides:** What it does, why it matters
- **Visual Showcase Slides:** Product demos, diagrams, illustrations

**Closing (1-2 slides):**
- Key takeaways or summary
- Call-to-action or next steps

═══════════════════════════════════════════════════════════════
✨ QUALITY STANDARDS
═══════════════════════════════════════════════════════════════
Each outline point should be:
- **Specific:** Clear about what the slide will cover
- **Concise:** 5-10 words maximum
- **Action-Oriented:** Use active verbs (Discover, Understand, Build, Compare)
- **Audience-Focused:** Consider what they need to know
- **Layout-Friendly:** Think about whether it needs images, columns, or special layouts

═══════════════════════════════════════════════════════════════
🚀 ADVANCED OUTLINE RULES (CRITICAL)
═══════════════════════════════════════════════════════════════
- Include at least ONE data/statistics slide (perfect for bigNumberLayout/statsRow)
- Include at least ONE comparison or pros/cons slide (comparisonLayout)
- Include a section break if presentation has 10+ slides (sectionDivider)
- End with a clear call-to-action slide (callToAction)
- Start with an attention-grabbing opening (creativeHero or fullImageBackground)
- Include 1-2 visual showcase slides for variety (bentoGrid, iconGrid)
- Annotate each outline with the CONTENT TYPE in brackets:
  Example: "AI Market Growth in 2024 [statistics]"
  Example: "Traditional vs Modern Approaches [comparison]"
  Example: "Your 3-Step Implementation Plan [process]"

═══════════════════════════════════════════════════════════════
📊 EXAMPLE OUTLINE (Marketing Strategy)
═══════════════════════════════════════════════════════════════
1. The Modern Marketing Challenge [opening - problem statement]
2. Understanding Your Target Audience [concept - with data]
3. Building a Strong Brand Identity [concept - with visuals]
4. Digital Marketing Channels Overview [comparison - multiple options]
5. Content Marketing That Converts [process - step-by-step]
6. Social Media Best Practices [features/tips - bullet points]
7. Case Study: Startup Success Story [example - with visuals]
8. Measuring Marketing ROI [data - metrics and KPIs]
9. Common Mistakes to Avoid [comparison - dos and don'ts]
10. Your 90-Day Action Plan [timeline - roadmap]
11. Next Steps and Resources [CTA - conclusion]

Now generate your comprehensive outline:`;

    console.log("🤖 Calling AI to generate outline...");

    const { object } = await generateObject({
      model: await getModel(state.userId),
      schema: outlineSchema,
      prompt: prompt,
      temperature: modelConfigs.outline.temperature,
    });

    const outlines = object.outlines;
    console.log(`✅ Generated ${outlines.length} slide topics:`);
    outlines.forEach((outline: string, i: number) => {
      console.log(`   ${i + 1}. ${outline}`);
      emitToken(state, `Slide ${i + 1}: ${outline}`);
    });

    // Validate outline count
    if (outlines.length < 5 || outlines.length > 15) {
      console.warn(
        `⚠️  Warning: Generated ${outlines.length} outlines (expected 5-15)`
      );
    }

    // Initialize slide data for each outline
    const initialSlideData = outlines.map((outline: string) => ({
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
      error: `Failed to generate outline-solid: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
