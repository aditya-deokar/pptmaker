import { z } from 'zod';



const LAYOUT_TYPES = [
  "accentLeft", "accentRight", "imageAndText", "textAndImage",
  "twoColumns", "twoColumnsWithHeadings", "threeColumns", "threeColumnsWithHeadings",
  "fourColumns", "twoImageColumns", "threeImageColumns", "fourImageColumns",
  "tableLayout", "blank-card" 
] as const;

const CONTENT_TYPES = [
  "heading1", "heading2", "heading3", "heading4", "title", "paragraph",
  "table", "resizable-column", "image", "blockquote", "numberedList",
  "bulletList", "todoList", "calloutBox", "codeBlock", "tableOfContents",
  "divider", "column"
] as const;


let ContentElementSchema: z.ZodTypeAny;

const BaseContentElementSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});


const StringContentSchema = BaseContentElementSchema.extend({
  content: z.string(),
  placeholder: z.string().optional(),
});

const Heading1Schema = StringContentSchema.extend({
  type: z.literal("heading1"),
});

const Heading2Schema = StringContentSchema.extend({
  type: z.literal("heading2"),
});

const Heading3Schema = StringContentSchema.extend({
  type: z.literal("heading3"),
});

const Heading4Schema = StringContentSchema.extend({
  type: z.literal("heading4"),
});

const TitleSchema = StringContentSchema.extend({
  type: z.literal("title"),
});

const ParagraphSchema = StringContentSchema.extend({
  type: z.literal("paragraph"),
});

const ImageSchema = BaseContentElementSchema.extend({
  type: z.literal("image"),
  content: z.string(), 
  alt: z.string(),
});

const BlockquoteSchema = StringContentSchema.extend({
  type: z.literal("blockquote"),
});



const ListContentSchema = BaseContentElementSchema.extend({
  content: z.array(z.lazy(() => ContentElementSchema)),
});

const NumberedListSchema = ListContentSchema.extend({
  type: z.literal("numberedList"),
});

const BulletListSchema = ListContentSchema.extend({
  type: z.literal("bulletList"),
});

const TodoListSchema = ListContentSchema.extend({
  type: z.literal("todoList"),
});

const CalloutBoxSchema = BaseContentElementSchema.extend({ 
  type: z.literal("calloutBox"),
  content: z.array(z.lazy(() => ContentElementSchema)),
});

const CodeBlockSchema = BaseContentElementSchema.extend({
  type: z.literal("codeBlock"),
  content: z.string(), 
  language: z.string().optional(), 
});



const TableOfContentsSchema = ListContentSchema.extend({ // Similar to lists
  type: z.literal("tableOfContents"),
});

const DividerSchema = BaseContentElementSchema.extend({
  type: z.literal("divider"),
  content: z.string().optional().nullable(), 
});


const TableContentSchema = BaseContentElementSchema.extend({
    type: z.literal("table"),
   
    content: z.union([
        z.string(), 
        z.object({
            headers: z.array(z.string()).optional(),
            rows: z.array(z.array(z.string())), 
        }),
        
    ]).optional(), 
    placeholder: z.string().optional(),
});




const ColumnSchema = BaseContentElementSchema.extend({
  type: z.literal("column"),
  content: z.array(z.lazy(() => ContentElementSchema)),
  className: z.string().optional(),
  placeholder: z.string().optional(), 
});

const ResizableColumnSchema = BaseContentElementSchema.extend({
  type: z.literal("resizable-column"),
  content: z.array(z.lazy(() => ContentElementSchema)),
  restrictToDrop: z.boolean().optional(), 
  className: z.string().optional(),
});




ContentElementSchema = z.discriminatedUnion("type", [
  Heading1Schema,
  Heading2Schema,
  Heading3Schema,
  Heading4Schema,
  TitleSchema,
  ParagraphSchema,
  TableContentSchema, 
  ImageSchema,
  BlockquoteSchema,
  NumberedListSchema,
  BulletListSchema,
  TodoListSchema,
  CalloutBoxSchema,
  CodeBlockSchema,
  TableOfContentsSchema,
  DividerSchema,
  ColumnSchema,       
  ResizableColumnSchema,
]);



const LayoutMainContentSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("column"), 
  name: z.literal("Column"), 
  content: z.array(ContentElementSchema),
  restrictDropTo: z.boolean().optional(),
  className: z.string().optional(),      
});

const LayoutSchema = z.object({
  id: z.string().uuid().optional(), 
  slideName: z.string(),
  type: z.enum(LAYOUT_TYPES),
  className: z.string(),
  content: LayoutMainContentSchema, 
});

const FinalLayoutSchema = z.object({
    id: z.string().uuid(),
    slideName: z.string(),
    type: z.enum(LAYOUT_TYPES),
    className: z.string(),
    content: LayoutMainContentSchema,
});


export const outlineSchema = z.object({
  outlines: z.array(z.string())
});

export const GeneratedOutputSchema = z.array(FinalLayoutSchema);

