// agents/contentWriter.ts - Agent 3: Layout-Aware Content Writer (Bulk)

import { generateObject } from "ai";
import { getModel, modelConfigs } from "../lib/llm";
import { AdvancedPresentationState } from "../lib/state";
import { layoutAwareContentSchema } from "../lib/validators";

function emitToken(state: AdvancedPresentationState, content: string) {
  if (state.streamEventHandler) {
    state.streamEventHandler({
      type: 'token',
      agentId: 'contentWriter',
      content,
      timestamp: Date.now(),
    });
  }
}

/**
 * Ensure we have exactly the right number of content items
 * Pads with default content if too few, truncates if too many
 */
function normalizeContentCount(
  slidesContent: Array<{ title: string; content: string;[key: string]: any }>,
  outlines: string[],
  expectedCount: number
): Array<{ title: string; content: string;[key: string]: any }> {
  // If we have enough, just take what we need
  if (slidesContent.length >= expectedCount) {
    return slidesContent.slice(0, expectedCount);
  }

  // If we have fewer, pad with generated defaults based on outlines
  const normalized = [...slidesContent];
  
  for (let i = slidesContent.length; i < expectedCount; i++) {
    const outline = outlines[i] || `Slide ${i + 1}`;
    normalized.push({
      title: outline.length > 80 ? outline.slice(0, 77) + "..." : outline,
      subtitle: "Overview and Key Insights",
      content: `- Detailed analysis of ${outline}\n- Strategic implications and required actions\n- Focus on operational efficiency and growth\n- Comprehensive review to guide next steps`,
    });
    console.log(`   ⚠️ Generated fallback content for slide ${i + 1}: "${outline}"`);
  }

  return normalized;
}

/**
 * Agent 3: Layout-Aware Content Writer (Bulk)
 * 
 * Purpose: Writes title and body content for ALL slides in a single API call
 * - Now receives layout types and generates content SHAPED for each layout
 * - Produces structured fields (stats, comparisons, steps, etc.) for premium layouts
 * - Ensures consistent tone and style across the presentation
 * 
 * @param state - Current graph state (with layoutType already set per slide)
 * @returns Updated state with slide titles, content, and structured fields
 */
export async function runContentWriter(
  state: AdvancedPresentationState
): Promise<Partial<AdvancedPresentationState>> {
  console.log("\n┌─────────────────────────────────────────┐");
  console.log("│  ✍️  AGENT 3: Layout-Aware Content Writer │");
  console.log("└─────────────────────────────────────────┘");

  if (!state.outlines || state.outlines.length === 0) {
    console.log("⚠️  No outlines to process. Skipping content generation.");
    return {};
  }

  try {
    const outlines = state.outlines;
    const topic = state.userInput;
    const context = state.additionalContext || "";
    
    console.log(`📝 Generating layout-aware content for ${outlines.length} slides...`);

    // Format outlines WITH their assigned layout types
    const formattedOutlines = state.slideData
      .map((slide, index) => `${index + 1}. [LAYOUT: ${slide.layoutType || "titleAndContent"}] ${slide.outline}`)
      .join("\n");

    const prompt = `You are an ELITE presentation copywriter who creates engaging, impactful slide content perfectly shaped for specific visual layouts.

═══════════════════════════════════════════════════════════════
📋 PRESENTATION DETAILS
═══════════════════════════════════════════════════════════════
Overall Topic: "${topic}"
${context ? `Additional Context: "${context}"` : ""}

═══════════════════════════════════════════════════════════════
📝 SLIDE OUTLINES WITH ASSIGNED LAYOUTS
═══════════════════════════════════════════════════════════════
${formattedOutlines}

═══════════════════════════════════════════════════════════════
✍️ YOUR TASK
═══════════════════════════════════════════════════════════════
For EACH slide, generate content SHAPED for its assigned layout type.

**For ALL slides, always provide:**
- title: Compelling, clear, action-oriented (max 80 chars)
- content: Main body text (150-600 chars), use "\\n-" for bullet lists

**LAYOUT-SPECIFIC STRUCTURED FIELDS (provide ONLY the fields relevant to each slide's layout):**

📊 bigNumberLayout / statsRow:
- statValue: A prominent, impressive stat (e.g. "$4.2B", "150%", "3x", "10M+")
- statLabel: Short label for the stat (e.g. "Revenue Growth", "Users Worldwide")

📊 statsRow (needs exactly 3 stats):
- stats: Array of exactly 3 objects with { value, label } (e.g. [{"value":"10M+","label":"Users"},{"value":"99.9%","label":"Uptime"},{"value":"150+","label":"Countries"}])

⚖️ comparisonLayout:
- comparisonLabelA: First option label (e.g. "Traditional Approach")
- comparisonLabelB: Second option label (e.g. "AI-Powered Approach")
- comparisonPointsA: 3-4 bullet points for option A
- comparisonPointsB: 3-4 bullet points for option B

💬 quoteLayout:
- quoteText: The actual quote text (compelling and relevant)
- quoteAttribution: Who said it (e.g. "— Steve Jobs, Apple CEO")

🔄 processFlow / timelineLayout / timeline:
- processSteps: Array of 3-4 objects with { stepTitle, stepDescription } (keep descriptions to 10-15 words max)

🔲 iconGrid:
- gridItems: Array of exactly 4 objects with { icon (single contextual emoji), itemTitle, itemDescription (one line) }

📊 bentoGrid:
- stats: Array of 2 objects with { value, label }
- gridItems: Array of 3 objects with { icon, itemTitle, itemDescription } for insights list

🎯 callToAction / creativeHero:
- ctaButtonText: Action-oriented button text (e.g. "Start Free Trial →", "Get Started Today")

📌 sectionDivider:
- sectionNumber: Two-digit number as string (e.g. "01", "02", "03")

📊 twoColumnsWithHeadings / threeColumnsWithHeadings:
- columnHeadings: Array of heading strings for each column (2 or 3 items)

═══════════════════════════════════════════════════════════════
🎯 CONTENT QUALITY STANDARDS
═══════════════════════════════════════════════════════════════
✅ DO:
- Write for slides (concise, scannable)
- Include real-sounding numbers and specifics
- Vary sentence structure
- Build logical flow slide-to-slide
- Use contextual emojis for iconGrid items that match the topic
- Make comparison labels specific to the topic (NOT generic "Option A"/"Option B")
- Make stats feel impressive and believable

❌ DON'T:
- Write long paragraphs or essays
- Use generic placeholder text
- Use "Option A"/"Option B" as comparison labels — use topic-specific labels
- Use the same emoji for multiple iconGrid items
- Repeat information across slides

═══════════════════════════════════════════════════════════════
🚀 GENERATE NOW
═══════════════════════════════════════════════════════════════
⚠️ CRITICAL: You MUST generate EXACTLY ${outlines.length} slides - one for each outline above.
Do NOT skip any slides. Do NOT combine slides. Do NOT add extra slides.

Generate compelling, layout-aware content for ALL ${outlines.length} slides NOW:`;

    console.log("🤖 Calling AI to generate layout-aware content...");

    const model = await getModel(state.userId);
    const { object } = await generateObject({
      model: model,
      schema: layoutAwareContentSchema,
      prompt: prompt,
      temperature: modelConfigs.content.temperature,
    });

    let slidesContent = object.slidesContent;

    // Normalize slide count - handle cases where AI generates wrong number
    if (slidesContent.length !== outlines.length) {
      console.warn(`⚠️  AI generated ${slidesContent.length} slides but expected ${outlines.length}. Normalizing...`);
      slidesContent = normalizeContentCount(slidesContent, outlines, outlines.length);
    }

    console.log(`✅ Generated layout-aware content for ${slidesContent.length} slides:`);
    slidesContent.forEach((slide: (typeof slidesContent)[number], i: number) => {
      const layout = state.slideData[i]?.layoutType || "unknown";
      const extras = [];
      if (slide.statValue) extras.push(`stat: ${slide.statValue}`);
      if (slide.quoteText) extras.push(`quote: ${slide.quoteText.slice(0, 30)}...`);
      if (slide.ctaButtonText) extras.push(`cta: ${slide.ctaButtonText}`);
      if (slide.processSteps?.length) extras.push(`steps: ${slide.processSteps.length}`);
      if (slide.gridItems?.length) extras.push(`grid: ${slide.gridItems.length} items`);
      if (slide.stats?.length) extras.push(`stats: ${slide.stats.length}`);
      if (slide.comparisonLabelA) extras.push(`comparison: ${slide.comparisonLabelA} vs ${slide.comparisonLabelB}`);
      if (slide.columnHeadings?.length) extras.push(`cols: ${slide.columnHeadings.join(", ")}`);
      
      console.log(`   ${i + 1}. [${layout}] ${slide.title}`);
      if (extras.length > 0) console.log(`      Structured: ${extras.join(" | ")}`);
      emitToken(state, `Slide ${i + 1}: ${slide.title}\n${slide.content.slice(0, 100)}...`);
    });

    // Update slide data with titles, content, AND structured fields
    const updatedSlideData = state.slideData.map((slide, index) => {
      const generated = slidesContent[index];
      return {
        ...slide,
        slideTitle: generated.title,
        subtitle: generated.subtitle || undefined,
        slideContent: generated.content,
        // Structured fields for premium layouts
        statValue: generated.statValue || undefined,
        statLabel: generated.statLabel || undefined,
        stats: generated.stats || undefined,
        comparisonLabelA: generated.comparisonLabelA || undefined,
        comparisonLabelB: generated.comparisonLabelB || undefined,
        comparisonPointsA: generated.comparisonPointsA || undefined,
        comparisonPointsB: generated.comparisonPointsB || undefined,
        quoteText: generated.quoteText || undefined,
        quoteAttribution: generated.quoteAttribution || undefined,
        processSteps: generated.processSteps || undefined,
        gridItems: generated.gridItems || undefined,
        ctaButtonText: generated.ctaButtonText || undefined,
        sectionNumber: generated.sectionNumber || undefined,
        columnHeadings: generated.columnHeadings || undefined,
      };
    });

    return {
      slideData: updatedSlideData,
      currentStep: "Content Written",
      progress: 45, // 45% complete
    };
  } catch (error) {
    console.error("🔴 Error generating content:", error);
    return {
      error: `Failed to generate content: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
