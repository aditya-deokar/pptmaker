// lib/layoutTemplates.ts - Available Layout Templates

import { LayoutTemplate } from "./state";

/**
 * All available layout types for AI selection
 */
export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  // === BASIC LAYOUTS ===
  {
    type: "blank-card",
    slideName: "Blank card",
    className: "p-8 mx-auto flex justify-center items-center min-h-[200px]",
    requiresImage: false,
    contentStructure: "title-content",
  },
  
  // === IMAGE + TEXT LAYOUTS ===
  {
    type: "accentLeft",
    slideName: "Accent left",
    className: "min-h-[300px]",
    requiresImage: true,
    contentStructure: "image-text",
  },
  {
    type: "accentRight",
    slideName: "Accent Right",
    className: "min-h-[300px]",
    requiresImage: true,
    contentStructure: "image-text",
  },
  {
    type: "imageAndText",
    slideName: "Image and text",
    className: "min-h-[200px] p-8 mx-auto flex justify-center items-center",
    requiresImage: true,
    contentStructure: "image-text",
  },
  {
    type: "textAndImage",
    slideName: "Text and image",
    className: "min-h-[200px] p-8 mx-auto flex justify-center items-center",
    requiresImage: true,
    contentStructure: "image-text",
  },
  
  // === COLUMN LAYOUTS ===
  {
    type: "twoColumns",
    slideName: "Two columns",
    className: "p-4 mx-auto flex justify-center items-center",
    requiresImage: false,
    contentStructure: "two-column",
  },
  {
    type: "twoColumnsWithHeadings",
    slideName: "Two columns with headings",
    className: "p-4 mx-auto flex justify-center items-center",
    requiresImage: false,
    contentStructure: "two-column",
  },
  {
    type: "threeColumns",
    slideName: "Three columns",
    className: "p-4 mx-auto flex justify-center items-center",
    requiresImage: false,
    contentStructure: "three-column",
  },
  {
    type: "threeColumnsWithHeadings",
    slideName: "Three columns with headings",
    className: "p-4 mx-auto flex justify-center items-center",
    requiresImage: false,
    contentStructure: "three-column",
  },
  {
    type: "fourColumns",
    slideName: "Four columns",
    className: "p-4 mx-auto flex justify-center items-center",
    requiresImage: false,
    contentStructure: "four-column",
  },
  
  // === IMAGE GRID LAYOUTS ===
  {
    type: "twoImageColumns",
    slideName: "Two Image Columns",
    className: "p-4 mx-auto flex justify-center items-center",
    requiresImage: true,
    contentStructure: "image-grid",
  },
  {
    type: "threeImageColumns",
    slideName: "Three Image Columns",
    className: "p-4 mx-auto flex justify-center items-center",
    requiresImage: true,
    contentStructure: "image-grid",
  },
  {
    type: "fourImageColumns",
    slideName: "Four Image Columns",
    className: "p-4 mx-auto flex justify-center items-center",
    requiresImage: true,
    contentStructure: "image-grid",
  },
  
  // === ADVANCED SPECIALIZED LAYOUTS ===
  {
    type: "titleAndContent",
    slideName: "Title and Content",
    className: "p-8 mx-auto flex flex-col min-h-[400px]",
    requiresImage: false,
    contentStructure: "title-content",
  },
  {
    type: "splitContentImage",
    slideName: "Split Content Image",
    className: "min-h-[400px]",
    requiresImage: true,
    contentStructure: "image-text",
  },
  {
    type: "bigNumberLayout",
    slideName: "Big Number Layout",
    className: "p-8 mx-auto flex min-h-[400px]",
    requiresImage: false,
    contentStructure: "stat-showcase",
  },
  {
    type: "comparisonLayout",
    slideName: "Comparison Layout",
    className: "p-8 mx-auto min-h-[400px]",
    requiresImage: false,
    contentStructure: "comparison",
  },
  {
    type: "quoteLayout",
    slideName: "Quote Layout",
    className: "p-12 mx-auto flex items-center justify-center min-h-[400px]",
    requiresImage: false,
    contentStructure: "quote",
  },
  {
    type: "timelineLayout",
    slideName: "Timeline Layout",
    className: "p-8 mx-auto min-h-[400px]",
    requiresImage: false,
    contentStructure: "timeline",
  },
  {
    type: "fullImageBackground",
    slideName: "Full Image Background",
    className: "relative min-h-[500px]",
    requiresImage: true,
    contentStructure: "image-overlay",
  },
  {
    type: "iconGrid",
    slideName: "Icon Grid",
    className: "p-8 mx-auto min-h-[400px]",
    requiresImage: false,
    contentStructure: "feature-grid",
  },
  {
    type: "sectionDivider",
    slideName: "Section Divider",
    className: "p-12 mx-auto flex items-center justify-center min-h-[400px] bg-linear-to-br from-primary/10 to-primary/5",
    requiresImage: false,
    contentStructure: "divider",
  },
  {
    type: "processFlow",
    slideName: "Process Flow",
    className: "p-8 mx-auto min-h-[400px]",
    requiresImage: false,
    contentStructure: "process",
  },
  {
    type: "callToAction",
    slideName: "Call to Action",
    className: "p-12 mx-auto flex flex-col items-center justify-center min-h-[400px] text-center",
    requiresImage: false,
    contentStructure: "cta",
  },

  // === CREATIVE LAYOUTS (Premium) ===
  {
    type: "creativeHero",
    slideName: "Creative Hero",
    className: "h-full w-full p-8",
    requiresImage: true,
    contentStructure: "image-text",
  },
  {
    type: "bentoGrid",
    slideName: "Bento Grid",
    className: "h-full w-full p-6",
    requiresImage: true,
    contentStructure: "feature-grid",
  },
  {
    type: "statsRow",
    slideName: "Stats Row",
    className: "h-full w-full p-8 flex flex-col justify-center",
    requiresImage: false,
    contentStructure: "stat-showcase",
  },
  {
    type: "timeline",
    slideName: "Visual Timeline",
    className: "h-full w-full p-8",
    requiresImage: false,
    contentStructure: "timeline",
  },
];

/**
 * Get layout template by type
 */
export function getLayoutTemplate(type: string): LayoutTemplate | undefined {
  return LAYOUT_TEMPLATES.find(layout => layout.type === type);
}

/**
 * Get layouts that don't require images (for text-heavy content)
 */
export function getTextOnlyLayouts(): LayoutTemplate[] {
  return LAYOUT_TEMPLATES.filter(layout => !layout.requiresImage);
}

/**
 * Get layouts that include images
 */
export function getImageLayouts(): LayoutTemplate[] {
  return LAYOUT_TEMPLATES.filter(layout => layout.requiresImage);
}

/**
 * Layout descriptions for AI selection
 */
export const LAYOUT_DESCRIPTIONS = `
═══════════════════════════════════════════════════════
AVAILABLE SLIDE LAYOUTS (12 Curated)
═══════════════════════════════════════════════════════

1. creativeHero → Bold opening with heading, subtitle, CTA button, hero image. Use for: first slide, major announcements.
2. titleAndContent → Clean title + bullet list or paragraphs. Use for: core content, takeaways, explanations.
3. accentLeft → Large image left, text right. Use for: visual concepts, product showcases.
4. statsRow → 2-4 stat boxes in a row. Use for: KPI showcases, metrics, numbers.
5. comparisonLayout → Two styled columns side-by-side. Use for: before/after, pros/cons, A vs B.
6. processFlow → Numbered steps in a horizontal flow. Use for: workflows, methodologies, how-it-works.
7. iconGrid → 2x2 grid of feature cards. Use for: features, benefits, services overview.
8. bentoGrid → Dashboard-style grid with stats + bullets + image. Use for: data overviews, dashboards.
9. quoteLayout → Large centered quote with attribution. Use for: testimonials, expert opinions, inspiration.
10. sectionDivider → Giant section number + title. Use for: chapter breaks between major sections.
11. fullImageBackground → Full-screen image with text overlay. Use for: dramatic openings, emotional impact.
12. callToAction → Centered CTA with title + description + button. Use for: final slide, next steps.

RULES:
- Slide 1 MUST be creativeHero or fullImageBackground.
- Final slide MUST be callToAction.
- Use at least 6 different layouts across the deck.
- Never use the same layout consecutively.
- Never use the same layout more than twice total.
`;

