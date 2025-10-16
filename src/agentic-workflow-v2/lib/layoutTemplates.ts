// lib/layoutTemplates.ts - Available Layout Templates

import { LayoutTemplate } from "./state";

/**
 * All available layout types for AI selection
 */
export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    type: "blank-card",
    slideName: "Blank card",
    className: "p-8 mx-auto flex justify-center items-center min-h-[200px]",
    requiresImage: false,
    contentStructure: "title-content",
  },
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
Available Layout Types:
1. blank-card: Simple centered title and content, no images
2. accentLeft: Image on left, text on right - great for visual emphasis
3. accentRight: Text on left, image on right - alternative visual layout
4. imageAndText: Image with accompanying text, compact layout
5. textAndImage: Text with accompanying image, compact layout
6. twoColumns: Two equal columns of text - ideal for comparisons or lists
7. twoColumnsWithHeadings: Two columns with individual headings - structured content
8. threeColumns: Three equal columns - great for multiple points or features

Selection Guidelines:
- Use blank-card for introductory or concluding slides
- Use accentLeft/accentRight for slides emphasizing visuals
- Use twoColumns for comparisons, pros/cons, or paired concepts
- Use threeColumns for feature lists or step-by-step processes
- Vary layouts to keep presentation engaging
`;
