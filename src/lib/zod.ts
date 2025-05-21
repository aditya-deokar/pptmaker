import { z } from "zod";
// Enum for allowed ContentType values
const ContentTypeEnum = z.enum([
  "column",
  "title",
  "heading1",
  "heading3",
  "paragraph",
  "resizable-column",
  "image",
]);

// Base content schema
const ContentSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: ContentTypeEnum,
    name: z.string(),
    content: z.union([
      z.string(), // for content being a string (for text or image URL)
      z.array(ContentSchema), // or nested array of ContentSchema
    ]),
    placeholder: z.string().optional(),
    className: z.string().optional(),
    alt: z.string().optional(),
    restrictToDrop: z.boolean().optional(),
    restrictDropTo: z.boolean().optional(),
  })
);

// Layout schema
const LayoutSchema = z.object({
  id: z.string(),
  slideName: z.string(),
  type: z.string(),
  className: z.string(),
  content: ContentSchema,
});

// Final schema for the entire array
const ReferedLayoutsSchema = z.array(LayoutSchema);

export { ReferedLayoutsSchema };