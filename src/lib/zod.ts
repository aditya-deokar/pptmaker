// /lib/schemas/layoutSchema.ts

import { z } from "zod";

// --- FIX: Expanded the enum to include all types your component can handle ---
const ContentTypeEnum = z.enum([
  "column",
  "title",
  "heading1",
  "heading2",
  "heading3",
  "heading4",
  "paragraph",
  "resizable-column",
  "image",
  "blockquote",
  "numberedList",
  "bulletList",
  "todoList",
  "calloutBox",
  "codeBlock",
  "tableOfContents",
  "divider",
  "table",
]);

// Base content schema
const ContentSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: ContentTypeEnum,
    name: z.string(),
    // --- FIX: Expanded the content union to allow for arrays of strings (lists) and 2D arrays (tables) ---
    content: z.union([
      z.string(),
      z.array(z.string()),
      z.array(z.array(z.string())),
      z.array(z.lazy(() => ContentSchema)),
    ]),
    placeholder: z.string().optional(),
    className: z.string().optional(),
    alt: z.string().optional(),
    restrictToDrop: z.boolean().optional(),
    restrictDropTo: z.boolean().optional(),
    // --- FIX: Added optional fields for specific components ---
    callOutType: z.enum(['info', 'warning', 'danger', 'success']).optional(),
    code: z.string().optional(),
    language: z.string().optional(),
    initialColumns: z.number().optional(),
    initialRows: z.number().optional(),
  })
);

// Layout schema (no changes needed here)
const LayoutSchema = z.object({
  id: z.string(),
  slideName: z.string(),
  type: z.string(),
  className: z.string(),
  content: ContentSchema,
});

// Final schema for the entire array (no changes needed here)
const ReferedLayoutsSchema = z.array(LayoutSchema);

export { ReferedLayoutsSchema };