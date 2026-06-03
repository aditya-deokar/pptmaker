'use server'

import { generateObject, generateText} from 'ai'
import { getAiModel } from '@/lib/ai-provider';
import { AiProvider } from '@/generated/prisma';
import { v4 as uuidv4 } from "uuid";
import { ContentItem, ContentType, Slide } from '@/lib/types';
import { GeneratedOutputSchema, outlineSchema } from '@/lib/zodSchema';
import { ReferedLayoutsSchema } from '@/lib/zod';
import prisma from '@/lib/prisma';
import { getOwnedProject } from './project-access';




export const generateCreativePrompt=async (userPrompt:string)=>{

    try {
    
    // console.log("🟢 Generating creative prompt...", userPrompt);
    const { object } = await generateObject({
      model: await getAiModel("gemini-3-flash-preview"),
      schema: outlineSchema,
      system:`You are an ELITE presentation strategist and content architect. You specialize in creating compelling, well-structured presentation outlines that tell a story and engage audiences.`,
      prompt: `Create a strategic, comprehensive outline for a presentation on: "${userPrompt}"

**OUTLINE REQUIREMENTS:**

1. **Structure & Flow:**
   - Generate 8-15 strategic slides (not just 6)
   - Follow a narrative arc: Opening → Core Content → Closing
   - Each point should be a complete, compelling slide title
   - Create natural flow and logical progression

2. **Content Types to Include (mix these):**
   - Opening: Title/introduction slide
   - Context: Problem statement or background
   - Core Concepts: 3-5 main teaching/explanation slides
   - Evidence: Statistics, case studies, or examples
   - Process: Step-by-step methodologies or timelines
   - Comparison: Before/after or options analysis
   - Impact: Benefits or outcomes
   - Closing: Summary, call-to-action, or next steps

3. **Slide Title Guidelines:**
   - Each title should be descriptive and engaging (5-10 words)
   - Use action words and specific language
   - Hint at the content type (e.g., "3 Key Benefits", "How It Works", "Case Study: Success Story")
   - Vary your approach to maintain interest

4. **Strategic Positioning:**
   - Start strong (grab attention)
   - Build momentum (develop ideas logically)
   - Include peaks (highlight key insights)
   - End memorably (clear takeaway)

**EXAMPLES:**

Topic: "Introduction to Machine Learning"
Good Outline:
1. "Machine Learning: Transforming Modern Technology"
2. "The Problem: Making Sense of Big Data"
3. "What is Machine Learning?"
4. "Supervised vs. Unsupervised Learning"
5. "How Neural Networks Work"
6. "Real-World Applications: Healthcare, Finance, and More"
7. "Success Story: Netflix Recommendation Engine"
8. "Getting Started: Tools and Resources"
9. "The Future of Machine Learning"
10. "Take Action: Your ML Journey Begins Here"

Topic: "Startup Growth Strategy"
Good Outline:
1. "Building a Scalable Startup in 2025"
2. "The Startup Challenge: Growth vs. Sustainability"
3. "5 Pillars of Sustainable Growth"
4. "Customer Acquisition: Finding Your Market"
5. "Product-Market Fit: How to Know You've Found It"
6. "Scaling Operations: Systems That Work"
7. "Funding Options: Bootstrap vs. VC"
8. "Case Study: How Airbnb Scaled Globally"
9. "Common Pitfalls to Avoid"
10. "Your 90-Day Growth Roadmap"

Now create a compelling outline for: "${userPrompt}"

Return as JSON array of 8-15 slide titles:
{
  "outlines": [
    "Slide 1 title",
    "Slide 2 title",
    ...
  ]
}
`
    
    });

    // console.log(object);

    if (object) {
      try {
        return { status: 200, data: object };
      } catch (err) {
        console.error("Invalid JSON received:", object, err);
        return { status: 500, error: "Invalid JSON format received from AI" };
      }
    }

    return { status: 400, error: "No content generated" };
  } catch (error) {
    console.error("🔴 ERROR", error);
    return { status: 500, error: "Internal server error" };
  }
}


export const generateImageUrl = async (prompt: string): Promise<string> => {
  try {
    const improvedPrompt = `
Create a PROFESSIONAL, HIGH-QUALITY image for a presentation slide.

**Image Description:** ${prompt}

**CRITICAL REQUIREMENTS:**

1. **Style & Quality:**
   - Photorealistic, professional-grade imagery
   - Suitable for business/educational presentations
   - High contrast and clarity
   - Sharp focus on key elements
   - Professional color grading

2. **Composition:**
   - Clean, uncluttered composition
   - Clear focal point
   - Balanced visual weight
   - Appropriate negative space
   - Suitable for 16:9 aspect ratio

3. **Lighting & Atmosphere:**
   - Professional lighting (avoid harsh shadows)
   - Natural or studio-quality illumination
   - Appropriate mood for context
   - Depth and dimension

4. **Content Standards:**
   - All text/signs MUST be in English
   - No watermarks or branding
   - Modern, current aesthetic
   - Culturally appropriate
   - Relevant to topic

5. **Technical Specifications:**
   - High resolution
   - Proper exposure
   - Rich color depth
   - Professional post-processing

**AVOID:**
- Cartoonish or abstract styles
- Overly busy or cluttered scenes
- Poor lighting or exposure
- Low-quality stock photo aesthetics
- Irrelevant or off-topic imagery
- Text overlays or captions
- Watermarks or logos

**USE CASES:**
- Corporate presentations
- Educational materials  
- Training documents
- Professional reports
- Conference slides

Generate an image that looks like it was shot by a professional photographer or created by a top-tier design studio.
`;

    const result = await generateText({
      model: await getAiModel('gemini-3-flash-preview', AiProvider.GOOGLE),
      providerOptions: {
        google: { responseModalities: ['TEXT', 'IMAGE'] },
      },
      prompt: improvedPrompt,
    });

    // Find the first image file in the result
    const imageFile = result.files?.find(file => {
      const mimeType = (file as any).mimeType;
      return mimeType && typeof mimeType === 'string' && mimeType.startsWith('image/');
    });

    if (imageFile && imageFile.base64) {
      console.log('🟢 Image generated successfully:', imageFile.base64);
      return imageFile.base64;
    }

    // Fallback if no image found
    return 'https://via.placeholder.com/1024';
  } catch (error) {
    console.error('Failed to generate image:', error);
    return 'https://via.placeholder.com/1024';
  }
};


const findImageComponents = (layout: ContentItem): ContentItem[] => {
  const images = [];
  if (layout.type === "image") {
    images.push(layout);
  }
  if (Array.isArray(layout.content)) {
    layout.content.forEach((child) => {
      images.push(...findImageComponents(child as ContentItem));
    });
  } else if (layout.content && typeof layout.content === "object") {
    images.push(...findImageComponents(layout.content));
  }
  return images;
};

const replaceImagePlaceholders = async (layout: Slide) => {
  const imageComponents = findImageComponents(layout.content);
  console.log("🟢 Found image components:", imageComponents);
  for (const component of imageComponents) {
    console.log("🟢 Generating image for component:", component.alt);
    component.content = await generateImageUrl(
      component.alt || "Placeholder Image"
    );
  }
};





// --- FIX: This function now populates the generated structure with real UUIDs ---
const populateUuids = (element: any) => {
    if (typeof element !== 'object' || element === null) {
        return;
    }
    // Assign a UUID if the element has an 'id' property
    if ('id' in element) {
        element.id = uuidv4();
    }
    // Recurse into nested content if it's an array
    if (Array.isArray(element.content)) {
        element.content.forEach(populateUuids);
    }
    // Recurse into a content object if it exists
    if (typeof element.content === 'object' && element.content !== null) {
        populateUuids(element.content);
    }
};


// Sanitize and validate content items to ensure all have required fields
const sanitizeContent = (element: any): any => {
    if (typeof element !== 'object' || element === null) {
        return element;
    }

    // If this is an array, process each item
    if (Array.isArray(element)) {
        return element.map(sanitizeContent).filter(item => item !== null);
    }

    // Ensure required fields exist
    if (!element.type) {
        // If no type, try to infer it or skip
        if (element.content && Array.isArray(element.content) && element.content.length > 0) {
            // If it has array content, it's likely a column
            element.type = 'column';
        } else if (typeof element.content === 'string') {
            // If it has string content, make it a paragraph
            element.type = 'paragraph';
        } else {
            // Skip this element entirely
            console.warn('Skipping element without type:', element);
            return null;
        }
    }

    // Ensure id exists
    if (!element.id) {
        element.id = uuidv4();
    }

    // Ensure name exists
    if (!element.name) {
        element.name = element.type || 'Component';
    }

    // Recursively sanitize nested content
    if (Array.isArray(element.content)) {
        element.content = element.content.map(sanitizeContent).filter((item: any) => item !== null);
    } else if (element.content && typeof element.content === 'object' && !Array.isArray(element.content)) {
        element.content = sanitizeContent(element.content);
    }

    return element;
};


// Process and validate an entire slide
const sanitizeSlide = (slide: any): any => {
    if (!slide) return null;
    
    // Ensure slide has required fields
    if (!slide.id) slide.id = uuidv4();
    if (!slide.type) slide.type = 'blank-card';
    if (!slide.slideName) slide.slideName = 'Slide';
    if (!slide.className) slide.className = 'p-8';
    
    // Sanitize the content
    if (slide.content) {
        slide.content = sanitizeContent(slide.content);
    } else {
        // Create default content if missing
        slide.content = {
            id: uuidv4(),
            type: 'column',
            name: 'Column',
            content: []
        };
    }
    
    return slide;
};





// export const generateLayoutsJSON = async (outlineArray: string[]) => {
  
//   const prompt = `
// You are an ELITE presentation designer with expertise in creating visually stunning, content-rich slide decks. Generate a complete presentation in JSON format.

// **PRESENTATION OUTLINES:**
// ${outlineArray.map((outline, index) => `${index + 1}. ${outline}`).join('\n')}

// ════════════════════════════════════════════════════════════════
// 📋 COMPONENT TYPES AVAILABLE (25 Layout Options)
// ════════════════════════════════════════════════════════════════

// **STRUCTURAL COMPONENTS:**
// - "column" - Vertical container (content = array of components)
// - "resizable-column" - Draggable columns (content = array of components)

// **TEXT COMPONENTS:**
// - "title" - Main slide title (content = string)
// - "heading1", "heading2", "heading3", "heading4" - Headings (content = string)
// - "paragraph" - Body text (content = string)
// - "blockquote" - Quote text (content = string)

// **LIST COMPONENTS:**
// - "bulletList" - Bullet points (content = array of strings)
// - "numberedList" - Numbered items (content = array of strings)
// - "todoList" - Checklist items (content = array of strings)

// **VISUAL COMPONENTS:**
// - "image" - Image display (content = URL string, alt = description)
// - "divider" - Horizontal line separator

// **ADVANCED COMPONENTS:**
// - "table" - Data table (complex structure with headers/rows)
// - "tableOfContents" - Outline of slides (content = array of strings)
// - "calloutBox" - Highlighted info box (content = string, variant = "info"/"warning"/"success")
// - "codeBlock" - Code snippet (code = string, language = string)
// - "customButton" - Interactive button (content = string, link = URL)

// ════════════════════════════════════════════════════════════════
// 🎨 LAYOUT PATTERNS TO USE (Mix & Match)
// ════════════════════════════════════════════════════════════════

// **1. TITLE SLIDE (First Slide):**
//    - Center-aligned title + subtitle
//    - Use: title + paragraph
//    - className: "flex flex-col justify-center items-center text-center h-full"

// **2. SIMPLE CONTENT (Concepts, Definitions):**
//    - Heading + paragraph or bullet list
//    - Use: heading2 + paragraph/bulletList
//    - className: "p-8 space-y-6"

// **3. TWO-COLUMN SPLIT (Comparisons, Before/After):**
//    - Use: resizable-column with 2 columns
//    - Each column: heading3 + bulletList
//    - className: "grid grid-cols-2 gap-6 p-8"

// **4. THREE-COLUMN (Features, Categories):**
//    - Use: column with 3 nested columns
//    - Each column: heading4 + paragraph
//    - className: "grid grid-cols-3 gap-4 p-8"

// **5. IMAGE + TEXT (Visual Explanations):**
//    - Use: resizable-column (50/50 split)
//    - Left: heading2 + paragraph/bulletList
//    - Right: image
//    - className: "grid grid-cols-2 gap-8 items-center p-8"

// **6. BIG STAT/NUMBER (Metrics, KPIs):**
//    - Use: heading1 (giant number) + paragraph (description)
//    - className: "flex flex-col justify-center items-center text-center h-full"
//    - Make number huge: className on heading1: "text-9xl font-bold"

// **7. QUOTE SLIDE (Testimonials, Inspiration):**
//    - Use: blockquote + paragraph (attribution)
//    - className: "flex flex-col justify-center items-center p-16"
//    - blockquote className: "text-4xl italic"

// **8. TIMELINE/PROCESS (Steps, Phases):**
//    - Use: numberedList with detailed items
//    - Or: multiple calloutBoxes in sequence
//    - className: "space-y-4 p-8"

// **9. DATA TABLE (Comparisons, Specifications):**
//    - Use: table component
//    - Structure: headers + rows with data
//    - className: "p-8"

// **10. CALL-TO-ACTION (Final Slide):**
//     - Use: heading2 + paragraph + customButton
//     - Center-aligned, focused
//     - className: "flex flex-col justify-center items-center text-center h-full gap-6"

// ════════════════════════════════════════════════════════════════
// ⚡ JSON STRUCTURE RULES (CRITICAL!)
// ════════════════════════════════════════════════════════════════

// 1. **Root Structure:**
//    - Output = Array of slide objects
//    - Each slide MUST have: id, slideName, type, className, content

// 2. **Data Types by Component:**
//    - column/resizable-column → content = ARRAY of components
//    - title/heading/paragraph/blockquote/calloutBox → content = STRING
//    - bulletList/numberedList/todoList → content = ARRAY OF STRINGS
//    - image → content = URL (string), alt = description (string)
//    - table → complex object with headers/rows
//    - codeBlock → code = STRING, language = STRING

// 3. **ID Fields:**
//    - Always use "uuid-placeholder" for all id fields
//    - IDs will be replaced with real UUIDs later

// 4. **Names:**
//    - "name" property = descriptive label (e.g., "Main Title", "Key Points")
//    - Actual content goes in "content" property

// 5. **ClassNames:**
//    - Use Tailwind CSS classes
//    - Common patterns: "p-8", "space-y-6", "grid grid-cols-2 gap-6"
//    - Responsive: "flex flex-col", "items-center", "justify-center"

// ════════════════════════════════════════════════════════════════
// 📝 CONTENT WRITING GUIDELINES
// ════════════════════════════════════════════════════════════════

// **DO:**
// ✅ Write clear, concise content (150-600 characters per paragraph)
// ✅ Use bullet points for lists (3-8 items)
// ✅ Create descriptive headings
// ✅ Add engaging image alt text (for AI image generation)
// ✅ Vary slide layouts for visual interest
// ✅ Use calloutBoxes for important notes
// ✅ Include tables for data comparisons
// ✅ Add quotes for credibility

// **DON'T:**
// ❌ Write walls of text (keep paragraphs short)
// ❌ Repeat the same layout for every slide
// ❌ Use vague or generic content
// ❌ Forget to add alt text for images
// ❌ Create more than 8 bullet points per list
// ❌ Use complex nested structures unnecessarily

// ════════════════════════════════════════════════════════════════
// 🎯 EXAMPLE SLIDES
// ════════════════════════════════════════════════════════════════

// **Example 1: Title Slide**
// {
//   "id": "uuid-placeholder",
//   "slideName": "Introduction",
//   "type": "title-slide",
//   "className": "flex flex-col justify-center items-center text-center h-full",
//   "content": {
//     "id": "uuid-placeholder",
//     "type": "column",
//     "name": "Title Container",
//     "content": [
//       {
//         "id": "uuid-placeholder",
//         "type": "title",
//         "name": "Main Title",
//         "content": "Machine Learning: The Future of Technology"
//       },
//       {
//         "id": "uuid-placeholder",
//         "type": "paragraph",
//         "name": "Subtitle",
//         "className": "text-2xl text-gray-600 mt-4",
//         "content": "Understanding AI and its Impact on Modern Business"
//       }
//     ]
//   }
// }

// **Example 2: Content with Bullet List**
// {
//   "id": "uuid-placeholder",
//   "slideName": "Key Benefits",
//   "type": "content-slide",
//   "className": "p-8 space-y-6",
//   "content": {
//     "id": "uuid-placeholder",
//     "type": "column",
//     "name": "Content Container",
//     "content": [
//       {
//         "id": "uuid-placeholder",
//         "type": "heading2",
//         "name": "Section Title",
//         "content": "Why Machine Learning Matters"
//       },
//       {
//         "id": "uuid-placeholder",
//         "type": "bulletList",
//         "name": "Benefits List",
//         "content": [
//           "Automates complex decision-making processes",
//           "Learns and improves from data over time",
//           "Handles massive datasets efficiently",
//           "Uncovers hidden patterns and insights",
//           "Reduces human error and bias"
//         ]
//       }
//     ]
//   }
// }

// **Example 3: Image + Text Layout**
// {
//   "id": "uuid-placeholder",
//   "slideName": "Visual Example",
//   "type": "content-slide",
//   "className": "p-8",
//   "content": {
//     "id": "uuid-placeholder",
//     "type": "resizable-column",
//     "name": "Split Layout",
//     "content": [
//       {
//         "id": "uuid-placeholder",
//         "type": "column",
//         "name": "Text Side",
//         "className": "space-y-4",
//         "content": [
//           {
//             "id": "uuid-placeholder",
//             "type": "heading2",
//             "name": "Title",
//             "content": "How Neural Networks Work"
//           },
//           {
//             "id": "uuid-placeholder",
//             "type": "paragraph",
//             "name": "Description",
//             "content": "Neural networks mimic the human brain's structure, processing information through interconnected layers of nodes. Each layer transforms the data, learning patterns and relationships."
//           }
//         ]
//       },
//       {
//         "id": "uuid-placeholder",
//         "type": "image",
//         "name": "Diagram",
//         "content": "https://via.placeholder.com/800x600",
//         "alt": "Detailed diagram showing neural network architecture with input layer, hidden layers, and output layer, with colorful connections between nodes"
//       }
//     ]
//   }
// }

// **Example 4: Big Number Slide**
// {
//   "id": "uuid-placeholder",
//   "slideName": "Impact Statistics",
//   "type": "content-slide",
//   "className": "flex flex-col justify-center items-center text-center h-full",
//   "content": {
//     "id": "uuid-placeholder",
//     "type": "column",
//     "name": "Stat Container",
//     "content": [
//       {
//         "id": "uuid-placeholder",
//         "type": "heading1",
//         "name": "Big Number",
//         "className": "text-9xl font-bold text-primary",
//         "content": "84%"
//       },
//       {
//         "id": "uuid-placeholder",
//         "type": "paragraph",
//         "name": "Context",
//         "className": "text-2xl text-gray-600 mt-6",
//         "content": "of businesses report increased efficiency with AI implementation"
//       }
//     ]
//   }
// }

// ════════════════════════════════════════════════════════════════
// 🚀 YOUR TASK
// ════════════════════════════════════════════════════════════════

// Based on the outlines provided above:
// 1. Create ${outlineArray.length} slides (one for each outline point)
// 2. Choose appropriate layouts for each slide type
// 3. Write engaging, clear content (150-600 characters per section)
// 4. Use variety - mix different layouts and components
// 5. Add images where relevant (write descriptive alt text)
// 6. Make it visually interesting and professional
// 7. Ensure all JSON is valid and properly formatted

// Generate the complete JSON array now!
//   `;

//   try {
//     console.log("🟢 Generating rich layouts based on outlines...");
    
//     const { object } = await generateObject({
//       model: await getAiModel("gemini-2.5-flash"),
//       schema: ReferedLayoutsSchema,
//       system: `You are a creative AI assistant that generates presentation slide layouts in valid JSON format based on user-provided outlines and a rich set of component types.`,
//       prompt: prompt,
//     });

//     if (!object) {
//       return { status: 400, error: "No content was generated by the AI." };
//     }

//     object.forEach(populateUuids);

//     console.log("🟢 Rich layouts generated successfully 🟢");
//     return { status: 200, data: object };

//   } catch (error) {
//       console.error("🔴 AI Generation ERROR:", error);
//       // Add more detailed error logging for Zod validation issues
//       if (error instanceof Error && error.message.includes('Validation')) {
//           console.error("Zod Validation Error Details:", (error as any).cause);
//       }
//       return { status: 500, error: "An error occurred during AI content generation." };
//   }
// }



// ------------------------------------------------------------------
// ▼▼▼ THIS IS THE UPDATED FUNCTION ▼▼▼
// ------------------------------------------------------------------



export const generateLayoutsJSON = async (outlineArray: string[]) => {

  // The prompt has been completely overhauled to generate the desired "JSON 2" schema.
  const prompt = `
You are an expert presentation designer AI. Your task is to generate a complete, well-structured presentation in a specific JSON format based on a list of slide outlines.

**PRESENTATION OUTLINES:**
${outlineArray.map((outline, index) => `${index + 1}. ${outline}`).join('\n')}

════════════════════════════════════════════════════════════════
🎨 SLIDE LAYOUT TYPES AVAILABLE (Choose one for each slide's root "type")
════════════════════════════════════════════════════════════════

1.  **"blank-card"**: A simple card, typically for titles or summaries. Usually contains a single column with a heading and a bullet list.
2.  **"twoColumns"**: A layout for comparing ideas or breaking down topics. Contains a title and a resizable-column with two paragraphs.
3.  **"threeColumns"**: Similar to twoColumns, but for three distinct points. Contains a title and a resizable-column with three paragraphs.
4.  **"imageAndText"**: A split layout with an image on one side and text on the other. The content is a resizable-column with two children: one column for the image, and one column for text components (like a heading and bullet list).
5.  **"textAndImage"**: The reverse of imageAndText, with text on the left and the image on the right.
6.  **"accentLeft"**: A full-bleed layout with an image on the left and a text block on the right.
7.  **"accentRight"**: A full-bleed layout with a text block on the left and an image on the right.

════════════════════════════════════════════════════════════════
🧱 CONTENT COMPONENT TYPES (Use these inside your layouts)
════════════════════════════════════════════════════════════════

-   **Structural**: "column", "resizable-column"
-   **Text**: "heading1", "paragraph", "title", "bulletList"
-   **Visual**: "image" (must include a descriptive "alt" property for image generation)

════════════════════════════════════════════════════════════════
⚡ CRITICAL JSON STRUCTURE RULES
════════════════════════════════════════════════════════════════

1.  **Root Structure**: The output MUST be a JSON array of slide objects.
2.  **Slide Object**: Each slide object must have these top-level keys: \`id\`, \`type\`, \`content\`, \`className\`, \`slideName\`.
3.  **Root \`type\`**: The root \`type\` for each slide MUST be one of the 7 layout types listed above (e.g., "imageAndText", "blank-card").
4.  **Content Nesting**: The \`content\` object for every slide MUST start with a single "column" component. Inside that column, you will place the layout's main components (like "resizable-column", "title", etc.). Follow the nesting patterns in the examples EXACTLY.
5.  **IDs and Names**: Use "uuid-placeholder" for all \`id\` fields. The \`name\` property should be a descriptive label for the component's purpose (e.g., "Slide Title", "Content Column").
6.  **Image Components**: Every component with \`type: "image"\` MUST have a descriptive \`alt\` property that clearly explains the desired visual. Content should be an empty string: \`"content": ""\`.

════════════════════════════════════════════════════════════════
📝 CONTENT WRITING GUIDELINES
════════════════════════════════════════════════════════════════

✅ Create concise, engaging content for each component based on the slide outline.
✅ Write descriptive \`alt\` text for images that an AI can use to generate a relevant picture.
✅ Vary the slide layouts to keep the presentation interesting.
✅ Ensure every slide directly addresses its corresponding outline point.
❌ Do NOT write long paragraphs. Keep text brief and scannable.
❌ Do NOT forget the required nesting structure (\`Slide -> content -> column -> resizable-column -> ...\`).

════════════════════════════════════════════════════════════════
🎯 EXAMPLE SLIDES (Follow these structures precisely!)
════════════════════════════════════════════════════════════════

**Example 1: "blank-card" for a Title Slide**
{
  "id": "uuid-placeholder",
  "type": "blank-card",
  "content": {
    "id": "uuid-placeholder",
    "name": "Column",
    "type": "column",
    "content": [
      {
        "id": "uuid-placeholder",
        "name": "Slide Title",
        "type": "heading1",
        "content": "Web3: Unveiling the Next-Gen Internet"
      },
      {
        "id": "uuid-placeholder",
        "name": "Bullet Points",
        "type": "bulletList",
        "content": [
          "Is Web3 truly the future, or just hype?",
          "Aims to be a decentralized, user-owned web.",
          "Key aspects: Blockchain, Tokenization, User Control"
        ]
      }
    ]
  },
  "className": "p-8 mx-auto flex justify-center items-center min-h-[200px]",
  "slideName": "Web3: A New Internet?"
}

**Example 2: "imageAndText" Layout**
{
  "id": "uuid-placeholder",
  "type": "imageAndText",
  "content": {
    "id": "uuid-placeholder",
    "name": "Column",
    "type": "column",
    "content": [
      {
        "id": "uuid-placeholder",
        "name": "Image and text",
        "type": "resizable-column",
        "content": [
          {
            "id": "uuid-placeholder",
            "name": "Column",
            "type": "column",
            "content": [
              {
                "id": "uuid-placeholder",
                "alt": "Abstract visualization of a glowing, interconnected blockchain.",
                "name": "Image",
                "type": "image",
                "content": "",
                "className": "p-3"
              }
            ]
          },
          {
            "id": "uuid-placeholder",
            "name": "Column",
            "type": "column",
            "content": [
              {
                "id": "uuid-placeholder",
                "name": "Slide Title",
                "type": "heading1",
                "content": "Blockchain: The Core Technology"
              },
              {
                "id": "uuid-placeholder",
                "name": "Bullet Points",
                "type": "bulletList",
                "content": [
                  "Blockchain is a distributed, immutable ledger.",
                  "Blocks are bundles of transactions.",
                  "The chain links blocks securely using cryptography."
                ]
              }
            ],
            "className": "w-full h-full p-8 flex justify-center items-center"
          }
        ],
        "className": "border"
      }
    ]
  },
  "className": "min-h-[200px] p-8 mx-auto flex justify-center items-center",
  "slideName": "Blockchain Basics"
}

**Example 3: "threeColumns" Layout**
{
  "id": "uuid-placeholder",
  "type": "threeColumns",
  "content": {
    "id": "uuid-placeholder",
    "name": "Column",
    "type": "column",
    "content": [
      {
        "id": "uuid-placeholder",
        "name": "Title",
        "type": "title",
        "content": "Web3 Infrastructure: The Foundation"
      },
      {
        "id": "uuid-placeholder",
        "name": "Three columns",
        "type": "resizable-column",
        "content": [
          {
            "id": "uuid-placeholder",
            "name": "Paragraph",
            "type": "paragraph",
            "content": "Web3 relies on a robust infrastructure. The primary component is the blockchain protocol itself, like Ethereum or Solana."
          },
          {
            "id": "uuid-placeholder",
            "name": "Paragraph",
            "type": "paragraph",
            "content": "Decentralized storage solutions like IPFS are crucial for hosting data without a central server."
          },
          {
            "id": "uuid-placeholder",
            "name": "Paragraph",
            "type": "paragraph",
            "content": "Oracles act as bridges, linking blockchains to real-world data sources, which is essential for smart contracts."
          }
        ],
        "className": "border"
      }
    ]
  },
  "className": "p-4 mx-auto flex justify-center items-center",
  "slideName": "Web3 Infrastructure"
}

════════════════════════════════════════════════════════════════
🚀 YOUR TASK
════════════════════════════════════════════════════════════════

Based on the ${outlineArray.length} outlines provided:
1.  Generate a complete JSON array of slide objects.
2.  For each slide, select the most appropriate layout \`type\` from the 7 options.
3.  Populate the layout with relevant content components and well-written text.
4.  Ensure the final JSON is valid and strictly follows the structure shown in the examples.

Generate the complete JSON array now!
  `;

  try {
    console.log("🟢 Generating rich layouts based on outlines...");

    const { object } = await generateObject({
      model: await getAiModel("gemini-2.5-flash"), // Consider using 1.5 Flash or Pro for complex JSON
      schema: ReferedLayoutsSchema, // Assuming this Zod schema matches the new structure
      system: `You are a creative AI assistant that generates presentation slide layouts in a specific, valid JSON format based on user-provided outlines and a rich set of component types. You must adhere strictly to the provided examples and structural rules.`,
      prompt: prompt,
    });

    if (!object) {
      return { status: 400, error: "No content was generated by the AI." };
    }

    // Populate UUIDs and sanitize the generated content
    const sanitizedSlides = object.map((slide: any) => {
      populateUuids(slide);
      return sanitizeSlide(slide);
    }).filter((slide: any) => slide !== null);

    console.log("🟢 Rich layouts generated and sanitized successfully 🟢");
    return { status: 200, data: sanitizedSlides };

  } catch (error) {
      console.error("🔴 AI Generation ERROR:", error);
      if (error instanceof Error && error.message.includes('Validation')) {
          console.error("Zod Validation Error Details:", (error as any).cause);
      }
      return { status: 500, error: "An error occurred during AI content generation." };
  }
}




export const generateLayouts = async (projectId: string, theme: string) => {
    
    try {
        if (!projectId) {
          return { status: 400, error: "Project ID is required" };
        }

        const access = await getOwnedProject(projectId);
        if (access.status !== 200) {
          return access;
        }

        const project = access.project;
    
        if (!project.outlines || project.outlines.length === 0) {
          return { status: 400, error: "Project does not have any outlines to generate content from" };
        }
    
        const layouts = await generateLayoutsJSON(project.outlines);
    
        if (layouts.status !== 200 || !layouts.data) {
          return { status: layouts.status, error: layouts.error || "Failed to generate valid layouts" };
        }
    
        await prisma.project.update({
          where: { id: project.id },
          data: { slides: layouts.data as any, themeName: theme },
        });
    
        return { status: 200, data: layouts };
      } catch (error) {
        console.error("🔴 Server Action ERROR:", error);
        return { status: 500, error: "Internal server error" };
      }
};

