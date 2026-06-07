// lib/streamable-prompt.ts - Concise Prompt for Streamable Presentation Generation
//
// Design principles:
//   • Short, prescriptive rules — no redundant explanations
//   • Layout catalog as compact table, not prose
//   • Single full-slide example instead of scattered micro-examples
//   • IDs are auto-assigned server-side — model only needs to provide structure
//   • className is auto-assigned per layout — model doesn't generate Tailwind

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

export interface StreamablePromptOptions {
  topic: string;
  theme: string;
  additionalContext?: string;
  slideCount?: number;
}

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ─────────────────────────────────────────────────────
// Prompt builder
// ─────────────────────────────────────────────────────

export function buildStreamablePrompt(options: StreamablePromptOptions): {
  system: string;
  user: string;
} {
  const {
    topic,
    theme,
    additionalContext,
    slideCount: rawCount = 10,
  } = options;

  const slideCount = clamp(rawCount, 5, 20);

  const system = `\
You are a presentation architect. Output ONLY a valid JSON array of slide objects — no markdown, no commentary.

RULES:
• Exactly ${slideCount} slides, slideOrder 0 through ${slideCount - 1}.
• Every slide's root content must be type "column" with name "root".
• All IDs must be unique strings (any format — they will be replaced server-side).
• Do NOT include className on any element — it will be auto-assigned.
• No filler phrases ("In conclusion…", "It is important to note…").
• Every sentence must be specific to the topic, not generic.
• Response must be valid JSON parseable by JSON.parse().`;

  const user = `\
Generate ${slideCount} slides on: "${topic}"
Theme: ${theme}
${additionalContext ? `Context: ${additionalContext}\n` : ""}
═══ SLIDE OBJECT SHAPE ═══
{
  "id": "<unique>",
  "type": "<layout>",
  "slideName": "<label>",
  "slideOrder": <0-based>,
  "content": {
    "id": "<unique>", "type": "column", "name": "root",
    "content": [ ...children ]
  }
}

═══ CONTENT ITEM TYPES ═══
Leaf (content = string):
  heading1 — slide title (≤ 8 words, punchy)
  heading2 — sub-heading or stat value
  heading3 — tertiary heading
  paragraph — body text (1-3 sentences, specific facts)
  blockquote — quote with attribution
  customButton — CTA label (≤ 6 words, end with →)
  image — use "[IMAGE: descriptive search query]" as content, MUST include "alt" field
  divider — content = ""

List (content = string[]):
  bulletList — 4-7 items, each ≤ 12 words, start with bold keyword
  numberedList — 3-6 ordered steps

Container (content = ContentItem[]):
  column — vertical stack for grouping
  statBox — metric card, must contain exactly: [heading2 (value), paragraph (label)]
            heading2 value must be a number/percentage/multiplier, NOT a phrase

═══ LAYOUT CATALOG ═══
Pick from these 12 layouts. Match content type to layout purpose.

  creativeHero          → Opening impact. Children: [heading1, paragraph, customButton, image]
  titleAndContent       → Core content. Children: [heading1, paragraph?, bulletList]
  accentLeft            → Visual + text. Children: [heading1, paragraph, image]
  statsRow              → KPI showcase. Children: [heading1, statBox, statBox, statBox]
  comparisonLayout      → A vs B. Children: [heading1, bulletList (side-A), bulletList (side-B)]
  processFlow           → Steps/workflow. Children: [heading1, numberedList]
  iconGrid              → Feature grid. Children: [heading1, bulletList]
  bentoGrid             → Data dashboard. Children: [heading1, paragraph, bulletList, image]
  quoteLayout           → Testimonial. Children: [blockquote, paragraph (attribution)]
  sectionDivider        → Chapter break. Children: [heading1 (number "I","II"…), heading1 (title)]
  fullImageBackground   → Dramatic visual. Children: [heading1, paragraph, image]
  callToAction          → Closing CTA. Children: [heading1, paragraph, customButton]

═══ DECK STRUCTURE (${slideCount} slides) ═══
Follow this narrative arc. Adapt proportionally:

  Slide 0 — HOOK: creativeHero or fullImageBackground. Bold title, punchy subtitle.
  Slide 1 — FOUNDATION: titleAndContent. What is it? Why does it matter?
  Slides 2-4 — DEPTH: titleAndContent, iconGrid, processFlow. Details, capabilities, how it works.
  Slides 5-6 — EVIDENCE: statsRow, bentoGrid. Real metrics, data points, market stats.
  Slide 7 — CONTRAST: comparisonLayout. Before vs after, old vs new.
  Slide 8 — CREDIBILITY: quoteLayout. Expert quote or testimonial.
  Slide ${slideCount - 1} — CLOSE: callToAction. Clear next step with CTA button.

For ${slideCount} > 10, add sectionDivider slides between major sections.
For ${slideCount} > 12, add accentLeft or fullImageBackground slides for visual variety.

═══ QUALITY CHECKS ═══
Before each slide verify:
  ✓ heading1 ≤ 8 words
  ✓ paragraph is 1-3 factual sentences (no filler)
  ✓ bulletList items start with keyword (e.g. "Latency — sub-200ms p99")
  ✓ statBox heading2 is a number/percentage, not text
  ✓ No two consecutive slides share the same layout type
  ✓ Content is specific to "${topic}"

═══ EXAMPLE SLIDE ═══
{
  "id": "s1",
  "type": "statsRow",
  "slideName": "Market Impact",
  "slideOrder": 5,
  "content": {
    "id": "r1", "type": "column", "name": "root",
    "content": [
      { "id": "t1", "type": "heading1", "name": "title", "content": "The Numbers Speak" },
      { "id": "st1", "type": "statBox", "name": "s1", "content": [
        { "id": "sv1", "type": "heading2", "name": "value", "content": "4.2×" },
        { "id": "sl1", "type": "paragraph", "name": "label", "content": "faster time-to-market" }
      ]},
      { "id": "st2", "type": "statBox", "name": "s2", "content": [
        { "id": "sv2", "type": "heading2", "name": "value", "content": "$2.1B" },
        { "id": "sl2", "type": "paragraph", "name": "label", "content": "annual market size by 2026" }
      ]},
      { "id": "st3", "type": "statBox", "name": "s3", "content": [
        { "id": "sv3", "type": "heading2", "name": "value", "content": "89%" },
        { "id": "sl3", "type": "paragraph", "name": "label", "content": "enterprise adoption rate" }
      ]}
    ]
  }
}

Output the JSON array now. Start with [ and end with ].`;

  return { system, user };
}

/**
 * Flatten to a single prompt string for APIs that don't support separate fields.
 */
export function buildStreamablePromptFlat(options: StreamablePromptOptions): string {
  const { system, user } = buildStreamablePrompt(options);
  return `${system}\n\n${user}`;
}