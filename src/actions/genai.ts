'use server'

import { generateObject, generateText} from 'ai'
import { google } from '@ai-sdk/google'
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from "uuid";
import { ContentItem, ContentType, Slide } from '@/lib/types';
import { GeneratedOutputSchema, outlineSchema } from '@/lib/zodSchema';
import { ReferedLayoutsSchema } from '@/lib/zod';






export const generateCreativePrompt=async (userPrompt:string)=>{

    try {
    
    // console.log("🟢 Generating creative prompt...", userPrompt);
    const { object } = await generateObject({
      model: google("gemini-2.0-flash", {
        structuredOutputs: false,
      }),
      schema: outlineSchema,
      system:`You are a helpful AI that generates outlines for presentations.`,
      prompt: ` Create a coherent and relevant outline for the following prompt: ${userPrompt}.
                The outline should consist of at least 6 points, with each point written as a single sentence.
                Ensure the outline is well-structured and directly related to the topic. 
                Return the output in the following JSON format:

                {
                    "outlines": [
                    "Point 1",
                    "Point 2",
                    "Point 3",
                    "Point 4",
                    "Point 5",
                    "Point 6"
                    ]
                }

                Ensure that the JSON is valid and properly formatted. Do not include any other text or explanations outside the JSON.
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






// const referedLayouts = [
//   {
//     id: uuidv4(),
//     slideName: "Blank card",
//     type: "blank-card",
//     className: "p-8 mx-auto flex justify-center items-center min-h-[200px]",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       content: [
//         {
//           id: uuidv4(),
//           type: "title" as ContentType,
//           name: "Title",
//           content: "",
//           placeholder: "Untitled Card",
//         },
//       ],
//     },
//   },

//   {
//     id: uuidv4(),
//     slideName: "Accent left",
//     type: "accentLeft",
//     className: "min-h-[300px]",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       restrictDropTo: true,
//       content: [
//         {
//           id: uuidv4(),
//           type: "resizable-column" as ContentType,
//           name: "Resizable column",
//           restrictToDrop: true,
//           content: [
//             {
//               id: uuidv4(),
//               type: "image" as ContentType,
//               name: "Image",
//               content:
//                 "https://plus.unsplash.com/premium_photo-1729004379397-ece899804701?q=80&w=2767&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//               alt: "Title",
//             },
//             {
//               id: uuidv4(),
//               type: "column" as ContentType,
//               name: "Column",
//               content: [
//                 {
//                   id: uuidv4(),
//                   type: "heading1" as ContentType,
//                   name: "Heading1",
//                   content: "",
//                   placeholder: "Heading1",
//                 },
//                 {
//                   id: uuidv4(),
//                   type: "paragraph" as ContentType,
//                   name: "Paragraph",
//                   content: "",
//                   placeholder: "start typing here",
//                 },
//               ],
//               className: "w-full h-full p-8 flex justify-center items-center",
//               placeholder: "Heading1",
//             },
//           ],
//         },
//       ],
//     },
//   },

//   {
//     id: uuidv4(),
//     slideName: "Accent Right",
//     type: "accentRight",
//     className: "min-h-[300px]",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       content: [
//         {
//           id: uuidv4(),
//           type: "resizable-column" as ContentType,
//           name: "Resizable column",
//           restrictToDrop: true,
//           content: [
//             {
//               id: uuidv4(),
//               type: "column" as ContentType,
//               name: "Column",
//               content: [
//                 {
//                   id: uuidv4(),
//                   type: "heading1" as ContentType,
//                   name: "Heading1",
//                   content: "",
//                   placeholder: "Heading1",
//                 },
//                 {
//                   id: uuidv4(),
//                   type: "paragraph" as ContentType,
//                   name: "Paragraph",
//                   content: "",
//                   placeholder: "start typing here",
//                 },
//               ],
//               className: "w-full h-full p-8 flex justify-center items-center",
//               placeholder: "Heading1",
//             },
//             {
//               id: uuidv4(),
//               type: "image" as ContentType,
//               name: "Image",
//               restrictToDrop: true,
//               content:
//                 "https://plus.unsplash.com/premium_photo-1729004379397-ece899804701?q=80&w=2767&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//               alt: "Title",
//             },
//           ],
//         },
//       ],
//     },
//   },

//   {
//     id: uuidv4(),
//     slideName: "Image and text",
//     type: "imageAndText",
//     className: "min-h-[200px] p-8 mx-auto flex justify-center items-center",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       content: [
//         {
//           id: uuidv4(),
//           type: "resizable-column" as ContentType,
//           name: "Image and text",
//           className: "border",
//           content: [
//             {
//               id: uuidv4(),
//               type: "column" as ContentType,
//               name: "Column",
//               content: [
//                 {
//                   id: uuidv4(),
//                   type: "image" as ContentType,
//                   name: "Image",
//                   className: "p-3",
//                   content:
//                     "https://plus.unsplash.com/premium_photo-1729004379397-ece899804701?q=80&w=2767&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//                   alt: "Title",
//                 },
//               ],
//             },
//             {
//               id: uuidv4(),
//               type: "column" as ContentType,
//               name: "Column",
//               content: [
//                 {
//                   id: uuidv4(),
//                   type: "heading1" as ContentType,
//                   name: "Heading1",
//                   content: "",
//                   placeholder: "Heading1",
//                 },
//                 {
//                   id: uuidv4(),
//                   type: "paragraph" as ContentType,
//                   name: "Paragraph",
//                   content: "",
//                   placeholder: "start typing here",
//                 },
//               ],
//               className: "w-full h-full p-8 flex justify-center items-center",
//               placeholder: "Heading1",
//             },
//           ],
//         },
//       ],
//     },
//   },

//   {
//     id: uuidv4(),
//     slideName: "Text and image",
//     type: "textAndImage",
//     className: "min-h-[200px] p-8 mx-auto flex justify-center items-center",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       content: [
//         {
//           id: uuidv4(),
//           type: "resizable-column" as ContentType,
//           name: "Text and image",
//           className: "border",
//           content: [
//             {
//               id: uuidv4(),
//               type: "column" as ContentType,
//               name: "",
//               content: [
//                 {
//                   id: uuidv4(),
//                   type: "heading1" as ContentType,
//                   name: "Heading1",
//                   content: "",
//                   placeholder: "Heading1",
//                 },
//                 {
//                   id: uuidv4(),
//                   type: "paragraph" as ContentType,
//                   name: "Paragraph",
//                   content: "",
//                   placeholder: "start typing here",
//                 },
//               ],
//               className: "w-full h-full p-8 flex justify-center items-center",
//               placeholder: "Heading1",
//             },
//             {
//               id: uuidv4(),
//               type: "column" as ContentType,
//               name: "Column",
//               content: [
//                 {
//                   id: uuidv4(),
//                   type: "image" as ContentType,
//                   name: "Image",
//                   className: "p-3",
//                   content:
//                     "https://plus.unsplash.com/premium_photo-1729004379397-ece899804701?q=80&w=2767&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//                   alt: "Title",
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//     },
//   },

//   {
//     id: uuidv4(),
//     slideName: "Two columns",
//     type: "twoColumns",
//     className: "p-4 mx-auto flex justify-center items-center",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       content: [
//         {
//           id: uuidv4(),
//           type: "title" as ContentType,
//           name: "Title",
//           content: "",
//           placeholder: "Untitled Card",
//         },
//         {
//           id: uuidv4(),
//           type: "resizable-column" as ContentType,
//           name: "Text and image",
//           className: "border",
//           content: [
//             {
//               id: uuidv4(),
//               type: "paragraph" as ContentType,
//               name: "Paragraph",
//               content: "",
//               placeholder: "Start typing...",
//             },
//             {
//               id: uuidv4(),
//               type: "paragraph" as ContentType,
//               name: "Paragraph",
//               content: "",
//               placeholder: "Start typing...",
//             },
//           ],
//         },
//       ],
//     },
//   },

//   {
//     id: uuidv4(),
//     slideName: "Two columns with headings",
//     type: "twoColumnsWithHeadings",
//     className: "p-4 mx-auto flex justify-center items-center",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       content: [
//         {
//           id: uuidv4(),
//           type: "title" as ContentType,
//           name: "Title",
//           content: "",
//           placeholder: "Untitled Card",
//         },
//         {
//           id: uuidv4(),
//           type: "resizable-column" as ContentType,
//           name: "Text and image",
//           className: "border",
//           content: [
//             {
//               id: uuidv4(),
//               type: "column" as ContentType,
//               name: "Column",
//               content: [
//                 {
//                   id: uuidv4(),
//                   type: "heading3" as ContentType,
//                   name: "Heading3",
//                   content: "",
//                   placeholder: "Heading 3",
//                 },
//                 {
//                   id: uuidv4(),
//                   type: "paragraph" as ContentType,
//                   name: "Paragraph",
//                   content: "",
//                   placeholder: "Start typing...",
//                 },
//               ],
//             },
//             {
//               id: uuidv4(),
//               type: "column" as ContentType,
//               name: "Column",
//               content: [
//                 {
//                   id: uuidv4(),
//                   type: "heading3" as ContentType,
//                   name: "Heading3",
//                   content: "",
//                   placeholder: "Heading 3",
//                 },
//                 {
//                   id: uuidv4(),
//                   type: "paragraph" as ContentType,
//                   name: "Paragraph",
//                   content: "",
//                   placeholder: "Start typing...",
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//     },
//   },

//   {
//     id: uuidv4(),
//     slideName: "Three column",
//     type: "threeColumns",
//     className: "p-4 mx-auto flex justify-center items-center",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       content: [
//         {
//           id: uuidv4(),
//           type: "title" as ContentType,
//           name: "Title",
//           content: "",
//           placeholder: "Untitled Card",
//         },
//         {
//           id: uuidv4(),
//           type: "resizable-column" as ContentType,
//           name: "Text and image",
//           className: "border",
//           content: [
//             {
//               id: uuidv4(),
//               type: "paragraph" as ContentType,
//               name: "",
//               content: "",
//               placeholder: "Start typing...",
//             },
//             {
//               id: uuidv4(),
//               type: "paragraph" as ContentType,
//               name: "",
//               content: "",
//               placeholder: "Start typing...",
//             },
//             {
//               id: uuidv4(),
//               type: "paragraph" as ContentType,
//               name: "",
//               content: "",
//               placeholder: "Start typing...",
//             },
//           ],
//         },
//       ],
//     },
//   },
// ];

// const prompt = `### Guidelines
// You are a highly creative AI that generates JSON-based layouts for presentations. I will provide you with a pattern and a format to follow, and for each outline, you must generate unique layouts and contents and give me the output in the JSON format expected.
// Our final JSON output is a combination of layouts and elements. The available LAYOUTS TYPES are as follows: "accentLeft", "accentRight", "imageAndText", "textAndImage", "twoColumns", "twoColumnsWithHeadings", "threeColumns", "threeColumnsWithHeadings", "fourColumns", "twoImageColumns", "threeImageColumns", "fourImageColumns", "tableLayout".
// The available CONTENT TYPES are "heading1", "heading2", "heading3", "heading4", "title", "paragraph", "table", "resizable-column", "image", "blockquote", "numberedList", "bulletList", "todoList", "calloutBox", "codeBlock", "tableOfContents", "divider", "column"

// Use these outlines as a starting point for the content of the presentations 
//   ${JSON.stringify(outlineArray)}

// The output must be an array of JSON objects.
//   1. Write layouts based on the specific outline provided. Do not use types that are not mentioned in the example layouts.
//   2. Ensuring each layout is unique.
//   3. Adhere to the structure of existing layouts
//   4. Fill placeholder data into content fields where required.
//   5. Generate unique image placeholders for the 'content' property of image components and also alt text according to the outline.
//   6. Ensure proper formatting and schema alignment for the output JSON.
// 7. First create LAYOUTS TYPES  at the top most level of the JSON output as follows ${JSON.stringify(
//     [
//       {
//         slideName: "Blank card",
//         type: "blank-card",
//         className: "p-8 mx-auto flex justify-center items-center min-h-[200px]",
//         content: {},
//       },
//     ]
//   )}

// 8.The content property of each LAYOUTS TYPE should start with “column” and within the columns content property you can use any  of the CONTENT TYPES I provided above. Resizable-column, column and other multi element contents should be an array because you can have more elements inside them nested. Static elements like title and paragraph should have content set to a string.Here is an example of what 1 layout with 1 column with 1 title inside would look like:
// ${JSON.stringify([
//   {
//     slideName: "Blank card",
//     type: "blank-card",
//     className: "p-8 mx-auto flex justify-center items-center min-h-[200px]",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       content: [
//         {
//           id: uuidv4(),
//           type: "title" as ContentType,
//           name: "Title",
//           content: "",
//           placeholder: "Untitled Card",
//         },
//       ],
//     },
//   },
// ])}


// 9. Here is a final example of an example output for you to get an idea 
// ${JSON.stringify([
//   {
//     id: uuidv4(),
//     slideName: "Blank card",
//     type: "blank-card",
//     className: "p-8 mx-auto flex justify-center items-center min-h-[200px]",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       content: [
//         {
//           id: uuidv4(),
//           type: "title" as ContentType,
//           name: "Title",
//           content: "",
//           placeholder: "Untitled Card",
//         },
//       ],
//     },
//   },

//   {
//     id: uuidv4(),
//     slideName: "Accent left",
//     type: "accentLeft",
//     className: "min-h-[300px]",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       restrictDropTo: true,
//       content: [
//         {
//           id: uuidv4(),
//           type: "resizable-column" as ContentType,
//           name: "Resizable column",
//           restrictToDrop: true,
//           content: [
//             {
//               id: uuidv4(),
//               type: "image" as ContentType,
//               name: "Image",
//               content:
//                 "https://plus.unsplash.com/premium_photo-1729004379397-ece899804701?q=80&w=2767&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//               alt: "Title",
//             },
//             {
//               id: uuidv4(),
//               type: "column" as ContentType,
//               name: "Column",
//               content: [
//                 {
//                   id: uuidv4(),
//                   type: "heading1" as ContentType,
//                   name: "Heading1",
//                   content: "",
//                   placeholder: "Heading1",
//                 },
//                 {
//                   id: uuidv4(),
//                   type: "paragraph" as ContentType,
//                   name: "Paragraph",
//                   content: "",
//                   placeholder: "start typing here",
//                 },
//               ],
//               className: "w-full h-full p-8 flex justify-center items-center",
//               placeholder: "Heading1",
//             },
//           ],
//         },
//       ],
//     },
//   },
// ])}

//  For Images 
//   - The alt text should describe the image clearly and concisely.
//   - Focus on the main subject(s) of the image and any relevant details such as colors, shapes, people, or objects.
//   - Ensure the alt text aligns with the context of the presentation slide it will be used on (e.g., professional, educational, business-related).
//   - Avoid using terms like "image of" or "picture of," and instead focus directly on the content and meaning.

//   Output the layouts in JSON format. Ensure there are no duplicate layouts across the array.`;

  //   const prompt = `
//     I will provide you with an array of outlines, and for each outline, you must generate a unique and creative layout. Use the existing layouts as examples for structure and design, and generate unique designs based on the provided outline.

//     ### Guidelines:
//     1. Write layouts based on the specific outline provided. Do not use types that are not mentioned in the example layouts.
//     2. Use diverse and engaging designs, ensuring each layout is unique.
//     3. Adhere to the structure of existing layouts but add new styles or components if needed.
//     4. Fill placeholder data into content fields where required.
//     5. Generate unique image placeholders for the 'content' property of image components and also alt text according to the outline.
//     6. Ensure proper formatting and schema alignment for the output JSON.

//     ### Example Layouts:
//     ${JSON.stringify(referedLayouts, null, 2)}

//     ### Outline Array:
//     ${JSON.stringify(outlineArray)}

//     For each entry in the outline array, generate:
//     - A unique JSON layout with creative designs.
//     - Properly filled content, including placeholders for image components.
//     - Clear and well-structured JSON data.
//     For Images
//     - The alt text should describe the image clearly and concisely.
//     - Focus on the main subject(s) of the image and any relevant details such as colors, shapes, people, or objects.
//     - Ensure the alt text aligns with the context of the presentation slide it will be used on (e.g., professional, educational, business-related).
//     - Avoid using terms like "image of" or "picture of," and instead focus directly on the content and meaning.

//     Output the layouts in JSON format. Ensure there are no duplicate layouts across the array.
// `

// export const generateLayoutsJSON =async (outlineArray: string[])=>{
  


// const prompt = `You are a JSON layout generator. 
// Generate an array of slide layouts with the following exact structure. 
// Always return **valid JSON only** without explanation or extra text.

// Rules:
// - The root output must be: const referedLayouts = [ ... ];
// - Each layout must include:
//   - id: uuidv4()
//   - slideName: string
//   - type: string
//   - className: string
//   - content: {
//       id: uuidv4(),
//       type: "column" | "resizable-column" | "title" | "heading1" | "heading3" | "paragraph" | "image",
//       name: string,
//       content: [] (nested items),
//       placeholder?: string,
//       className?: string,
//       alt?: string
//     }
// - Use nested content arrays to build the structure.
// - Always use "as ContentType" type casting for type values.
// - Use Unsplash URLs for default image content.
// - Do not add explanations or comments.

// Output example (format your result exactly like this):

// const referedLayouts = [
//   {
//     id: uuidv4(),
//     slideName: "Blank card",
//     type: "blank-card",
//     className: "p-8 mx-auto flex justify-center items-center min-h-[200px]",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       content: [
//         {
//           id: uuidv4(),
//           type: "title" as ContentType,
//           name: "Title",
//           content: "",
//           placeholder: "Untitled Card",
//         },
//       ],
//     },
//   },

//   {
//     id: uuidv4(),
//     slideName: "Accent left",
//     type: "accentLeft",
//     className: "min-h-[300px]",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       restrictDropTo: true,
//       content: [
//         {
//           id: uuidv4(),
//           type: "resizable-column" as ContentType,
//           name: "Resizable column",
//           restrictToDrop: true,
//           content: [
//             {
//               id: uuidv4(),
//               type: "image" as ContentType,
//               name: "Image",
//               content:
//                 "https://plus.unsplash.com/premium_photo-1729004379397-ece899804701?q=80&w=2767&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//               alt: "Title",
//             },
//             {
//               id: uuidv4(),
//               type: "column" as ContentType,
//               name: "Column",
//               content: [
//                 {
//                   id: uuidv4(),
//                   type: "heading1" as ContentType,
//                   name: "Heading1",
//                   content: "",
//                   placeholder: "Heading1",
//                 },
//                 {
//                   id: uuidv4(),
//                   type: "paragraph" as ContentType,
//                   name: "Paragraph",
//                   content: "",
//                   placeholder: "start typing here",
//                 },
//               ],
//               className: "w-full h-full p-8 flex justify-center items-center",
//               placeholder: "Heading1",
//             },
//           ],
//         },
//       ],
//     },
//   },

//   {
//     id: uuidv4(),
//     slideName: "Accent Right",
//     type: "accentRight",
//     className: "min-h-[300px]",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       content: [
//         {
//           id: uuidv4(),
//           type: "resizable-column" as ContentType,
//           name: "Resizable column",
//           restrictToDrop: true,
//           content: [
//             {
//               id: uuidv4(),
//               type: "column" as ContentType,
//               name: "Column",
//               content: [
//                 {
//                   id: uuidv4(),
//                   type: "heading1" as ContentType,
//                   name: "Heading1",
//                   content: "",
//                   placeholder: "Heading1",
//                 },
//                 {
//                   id: uuidv4(),
//                   type: "paragraph" as ContentType,
//                   name: "Paragraph",
//                   content: "",
//                   placeholder: "start typing here",
//                 },
//               ],
//               className: "w-full h-full p-8 flex justify-center items-center",
//               placeholder: "Heading1",
//             },
//             {
//               id: uuidv4(),
//               type: "image" as ContentType,
//               name: "Image",
//               restrictToDrop: true,
//               content:
//                 "https://plus.unsplash.com/premium_photo-1729004379397-ece899804701?q=80&w=2767&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//               alt: "Title",
//             },
//           ],
//         },
//       ],
//     },
//   },

//   {
//     id: uuidv4(),
//     slideName: "Image and text",
//     type: "imageAndText",
//     className: "min-h-[200px] p-8 mx-auto flex justify-center items-center",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       content: [
//         {
//           id: uuidv4(),
//           type: "resizable-column" as ContentType,
//           name: "Image and text",
//           className: "border",
//           content: [
//             {
//               id: uuidv4(),
//               type: "column" as ContentType,
//               name: "Column",
//               content: [
//                 {
//                   id: uuidv4(),
//                   type: "image" as ContentType,
//                   name: "Image",
//                   className: "p-3",
//                   content:
//                     "https://plus.unsplash.com/premium_photo-1729004379397-ece899804701?q=80&w=2767&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//                   alt: "Title",
//                 },
//               ],
//             },
//             {
//               id: uuidv4(),
//               type: "column" as ContentType,
//               name: "Column",
//               content: [
//                 {
//                   id: uuidv4(),
//                   type: "heading1" as ContentType,
//                   name: "Heading1",
//                   content: "",
//                   placeholder: "Heading1",
//                 },
//                 {
//                   id: uuidv4(),
//                   type: "paragraph" as ContentType,
//                   name: "Paragraph",
//                   content: "",
//                   placeholder: "start typing here",
//                 },
//               ],
//               className: "w-full h-full p-8 flex justify-center items-center",
//               placeholder: "Heading1",
//             },
//           ],
//         },
//       ],
//     },
//   },

//   {
//     id: uuidv4(),
//     slideName: "Text and image",
//     type: "textAndImage",
//     className: "min-h-[200px] p-8 mx-auto flex justify-center items-center",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       content: [
//         {
//           id: uuidv4(),
//           type: "resizable-column" as ContentType,
//           name: "Text and image",
//           className: "border",
//           content: [
//             {
//               id: uuidv4(),
//               type: "column" as ContentType,
//               name: "",
//               content: [
//                 {
//                   id: uuidv4(),
//                   type: "heading1" as ContentType,
//                   name: "Heading1",
//                   content: "",
//                   placeholder: "Heading1",
//                 },
//                 {
//                   id: uuidv4(),
//                   type: "paragraph" as ContentType,
//                   name: "Paragraph",
//                   content: "",
//                   placeholder: "start typing here",
//                 },
//               ],
//               className: "w-full h-full p-8 flex justify-center items-center",
//               placeholder: "Heading1",
//             },
//             {
//               id: uuidv4(),
//               type: "column" as ContentType,
//               name: "Column",
//               content: [
//                 {
//                   id: uuidv4(),
//                   type: "image" as ContentType,
//                   name: "Image",
//                   className: "p-3",
//                   content:
//                     "https://plus.unsplash.com/premium_photo-1729004379397-ece899804701?q=80&w=2767&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//                   alt: "Title",
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//     },
//   },

//   {
//     id: uuidv4(),
//     slideName: "Two columns",
//     type: "twoColumns",
//     className: "p-4 mx-auto flex justify-center items-center",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       content: [
//         {
//           id: uuidv4(),
//           type: "title" as ContentType,
//           name: "Title",
//           content: "",
//           placeholder: "Untitled Card",
//         },
//         {
//           id: uuidv4(),
//           type: "resizable-column" as ContentType,
//           name: "Text and image",
//           className: "border",
//           content: [
//             {
//               id: uuidv4(),
//               type: "paragraph" as ContentType,
//               name: "Paragraph",
//               content: "",
//               placeholder: "Start typing...",
//             },
//             {
//               id: uuidv4(),
//               type: "paragraph" as ContentType,
//               name: "Paragraph",
//               content: "",
//               placeholder: "Start typing...",
//             },
//           ],
//         },
//       ],
//     },
//   },

//   {
//     id: uuidv4(),
//     slideName: "Two columns with headings",
//     type: "twoColumnsWithHeadings",
//     className: "p-4 mx-auto flex justify-center items-center",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       content: [
//         {
//           id: uuidv4(),
//           type: "title" as ContentType,
//           name: "Title",
//           content: "",
//           placeholder: "Untitled Card",
//         },
//         {
//           id: uuidv4(),
//           type: "resizable-column" as ContentType,
//           name: "Text and image",
//           className: "border",
//           content: [
//             {
//               id: uuidv4(),
//               type: "column" as ContentType,
//               name: "Column",
//               content: [
//                 {
//                   id: uuidv4(),
//                   type: "heading3" as ContentType,
//                   name: "Heading3",
//                   content: "",
//                   placeholder: "Heading 3",
//                 },
//                 {
//                   id: uuidv4(),
//                   type: "paragraph" as ContentType,
//                   name: "Paragraph",
//                   content: "",
//                   placeholder: "Start typing...",
//                 },
//               ],
//             },
//             {
//               id: uuidv4(),
//               type: "column" as ContentType,
//               name: "Column",
//               content: [
//                 {
//                   id: uuidv4(),
//                   type: "heading3" as ContentType,
//                   name: "Heading3",
//                   content: "",
//                   placeholder: "Heading 3",
//                 },
//                 {
//                   id: uuidv4(),
//                   type: "paragraph" as ContentType,
//                   name: "Paragraph",
//                   content: "",
//                   placeholder: "Start typing...",
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//     },
//   },

//   {
//     id: uuidv4(),
//     slideName: "Three column",
//     type: "threeColumns",
//     className: "p-4 mx-auto flex justify-center items-center",
//     content: {
//       id: uuidv4(),
//       type: "column" as ContentType,
//       name: "Column",
//       content: [
//         {
//           id: uuidv4(),
//           type: "title" as ContentType,
//           name: "Title",
//           content: "",
//           placeholder: "Untitled Card",
//         },
//         {
//           id: uuidv4(),
//           type: "resizable-column" as ContentType,
//           name: "Text and image",
//           className: "border",
//           content: [
//             {
//               id: uuidv4(),
//               type: "paragraph" as ContentType,
//               name: "",
//               content: "",
//               placeholder: "Start typing...",
//             },
//             {
//               id: uuidv4(),
//               type: "paragraph" as ContentType,
//               name: "",
//               content: "",
//               placeholder: "Start typing...",
//             },
//             {
//               id: uuidv4(),
//               type: "paragraph" as ContentType,
//               name: "",
//               content: "",
//               placeholder: "Start typing...",
//             },
//           ],
//         },
//       ],
//     },
//   },
// ];
// `
//   try {
    
//   console.log("🟢 Generating Layout 🟢");
//    const { object } = await generateObject({
//       model: google("gemini-2.5-flash", {
//         structuredOutputs: false,
//       }),
//       schema: ReferedLayoutsSchema,
//       system:`You are a highly creative AI that generates JSON-based layouts for presentations.`,
//       prompt: prompt
    
//     });

//     if (!object) {
//       return { status: 400, error: "No content generated" };
//     }

//     // await Promise.all(object.map(replaceImagePlaceholders));

//     console.log("🟢 Layouts Generated successfully 🟢");
//     return { status: 200, data: object };

//   } catch (error) {
//       console.error("🔴 ERROR:", error);
//       return { status: 500, error: "Internal server error" };
//   }



// }

// export const generateLayouts = async (projectId: string, theme: string) => {
//   try {
//     if (!projectId) {
//       return { status: 400, error: "Project ID is required" };
//     }
//     const user = await currentUser();
//     if (!user) {
//       return { status: 403, error: "User not authenticated" };
//     }

//     const userExist = await prisma.user.findUnique({
//       where: { clerkId: user.id },
//     });

//     if (!userExist || !userExist.subscription) {
//       return {
//         status: 403,
//         error: !userExist?.subscription
//           ? "User does not have an active subscription"
//           : "User not found in the database",
//       };
//     }

//     const project = await prisma.project.findUnique({
//       where: { id: projectId, isDeleted: false },
//     });

//     if (!project) {
//       return { status: 404, error: "Project not found" };
//     }

//     if (!project.outlines || project.outlines.length === 0) {
//       return { status: 400, error: "Project does not have any outlines" };
//     }

//     const layouts = await generateLayoutsJSON(project.outlines);

//     if (layouts.status !== 200) {
//       return layouts;
//     }

//     await prisma.project.update({
//       where: { id: projectId },
//       data: { slides: layouts, themeName: theme },
//     });

//     return { status: 200, data: layouts };
//   } catch (error) {
//     console.error("🔴 ERROR:", error);
//     return { status: 500, error: "Internal server error", data: [] };
//   }
// };




export const generateImageUrl = async (prompt: string): Promise<string> => {
  try {
    const improvedPrompt = `
Create a highly realistic, professional image based on the following description. The image should look as if captured in real life, with attention to detail, lighting, and texture.

Description: ${prompt}

Important Notes:
- The image must be in a photorealistic style and visually compelling.
- Ensure all text, signs, or visible writing in the image are in English.
- Pay special attention to lighting, shadows, and textures to make the image as lifelike as possible.
- Avoid elements that appear abstract, cartoonish, or overly artistic. The image should be suitable for professional presentations.
- Focus on accurately depicting the concept described, including specific objects, environment, mood, and context. Maintain relevance to the description provided.

Example Use Cases: Business presentations, educational slides, professional designs.
`;

    const result = await generateText({
      model: google('gemini-2.0-flash-exp'),
      providerOptions: {
        google: { responseModalities: ['TEXT', 'IMAGE'] },
      },
      prompt: improvedPrompt,
    });

    // Find the first image file in the result
    const imageFile = result.files?.find(file => file.mimeType?.startsWith('image/'));

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


export const generateLayoutsJSON = async (outlineArray: string[]) => {
  // --- FIX: A completely rewritten prompt that requests valid JSON and uses the presentation outlines ---
  const prompt = `
    You are an expert presentation layout designer. Based on the following presentation outlines, generate an array of slide layouts in valid JSON format.

    Presentation Outlines:
    ${outlineArray.map((outline, index) => `${index + 1}. ${outline}`).join('\n')}

    Rules for JSON generation:
    1.  The root of the output MUST be a valid JSON array of slide objects.
    2.  Each object in the array represents a slide.
    3.  Generate content (titles, headings, paragraphs) that is relevant to the provided outlines.
    4.  Use a variety of slide types to make the presentation engaging.
    5.  For all "id" fields, use the placeholder string "uuid-placeholder".
    6.  For "image" content, use a relevant Unsplash URL.
    7.  Do NOT include any explanations, comments, or any text outside of the main JSON array.

    Here is an example of a single slide object structure:
    {
      "id": "uuid-placeholder",
      "slideName": "Title Slide",
      "type": "title-slide",
      "className": "p-8 mx-auto flex flex-col justify-center items-center min-h-[300px]",
      "content": {
        "id": "uuid-placeholder",
        "type": "column",
        "name": "Main Content",
        "content": [
          {
            "id": "uuid-placeholder",
            "type": "title",
            "name": "Title",
            "content": "The Main Title of the Presentation",
            "placeholder": "Presentation Title"
          },
          {
            "id": "uuid-placeholder",
            "type": "paragraph",
            "name": "Subtitle",
            "content": "A brief and engaging subtitle.",
            "placeholder": "Subtitle"
          }
        ]
      }
    }
  `;

  try {
    console.log("🟢 Generating Layouts based on outlines...");
    
    const { object } = await generateObject({
      model: google("gemini-1.5-flash"), // No need for structuredOutputs: false here
      schema: ReferedLayoutsSchema,
      system: `You are a creative AI assistant that generates presentation slide layouts in JSON format based on user-provided outlines.`,
      prompt: prompt,
    });

    if (!object) {
      return { status: 400, error: "No content was generated by the AI." };
    }

    // --- FIX: After generation, loop through the object and replace placeholders with real UUIDs ---
    object.forEach(populateUuids);

    console.log("🟢 Layouts Generated and UUIDs populated successfully 🟢");
    return { status: 200, data: object };

  } catch (error) {
      console.error("🔴 AI Generation ERROR:", error);
      return { status: 500, error: "An error occurred during AI content generation." };
  }
}

export const generateLayouts = async (projectId: string, theme: string) => {
  try {
    if (!projectId) {
      return { status: 400, error: "Project ID is required" };
    }
    const user = await currentUser();
    if (!user) {
      return { status: 403, error: "User not authenticated" };
    }

    const userExist = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!userExist) {
      return { status: 404, error: "User not found in the database" };
    }
    
    // Note: Subscription check logic is kept as is.
    // if (!userExist.subscription) {
    //   return {
    //     status: 403,
    //     error: "User does not have an active subscription",
    //   };
    // }

    const project = await prisma.project.findUnique({
      where: { id: projectId, isDeleted: false },
    });

    if (!project) {
      return { status: 404, error: "Project not found" };
    }

    if (!project.outlines || project.outlines.length === 0) {
      return { status: 400, error: "Project does not have any outlines to generate content from" };
    }

    const layouts = await generateLayoutsJSON(project.outlines);

    if (layouts.status !== 200 || !layouts.data) {
      return { status: layouts.status, error: layouts.error || "Failed to generate valid layouts" };
    }

    await prisma.project.update({
      where: { id: projectId },
      // --- FIX: Store only the array of slides (layouts.data), not the entire status object. ---
      // The data is now a JSON object which Prisma handles correctly.
      data: { slides: layouts.data as any, themeName: theme },
    });

    return { status: 200, data: layouts };
  } catch (error) {
    console.error("🔴 Server Action ERROR:", error);
    return { status: 500, error: "Internal server error" };
  }
};




const q = [
  {
    id: "4ac13b00-3d91-4d28-855a-0f343b6659a5",
    type: "title-slide",
    content: {
      id: "df97a7e9-8ebd-44cc-bec3-c46b8a055409",
      name: "Main Content",
      type: "column",
      content: [
        {
          id: "3e4d61cf-bbd2-4e6d-b0a6-398be11da4e3",
          name: "Title",
          type: "title",
          content: "Understanding REST APIs",
          placeholder: "Presentation Title",
        },
        {
          id: "3bec607d-5ba7-4a72-8a02-87c768df3307",
          name: "Subtitle",
          type: "paragraph",
          content: "A Deep Dive into RESTful Web Services",
          placeholder: "Subtitle",
        },
      ],
    },
    className:
      "p-8 mx-auto flex flex-col justify-center items-center min-h-[300px]",
    slideName: "Title Slide",
  },
  {
    id: "07a03c89-4219-4096-8d83-3715a344e646",
    type: "text-slide",
    content: {
      id: "d355bc34-3b33-43fa-9299-e309afbd14d6",
      name: "Main Content",
      type: "column",
      content: [
        {
          id: "f1e5ca4c-e7b7-428d-a807-3c65971d797c",
          name: "REST APIs: Architectural Styles for Web Services",
          type: "heading1",
          content:
            "REST APIs are architectural styles for building web services. They use standard HTTP methods to interact with resources.",
          placeholder: "Heading 1",
        },
        {
          id: "a4a2735c-8cfa-4e93-9c77-c2a7356d8e7a",
          name: "Description",
          type: "paragraph",
          content:
            "REST APIs provide a standardized way for different systems to communicate and exchange data over the internet.",
          placeholder: "Paragraph",
        },
      ],
    },
    className:
      "p-8 mx-auto flex flex-col justify-center items-center min-h-[300px]",
    slideName: "What are REST APIs?",
  },
  {
    id: "de1114f7-11f5-4275-87f4-40babfa0bfcf",
    type: "image-slide",
    content: {
      id: "6620ed3a-a2c1-4651-94be-e40c66c81406",
      alt: "HTTP Methods",
      name: "HTTP Methods",
      type: "image",
      content:
        "https://images.unsplash.com/photo-1612594675576-06200006227a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTd8fGh0dHB8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60",
      placeholder: "Image",
    },
    className:
      "p-8 mx-auto flex flex-col justify-center items-center min-h-[300px]",
    slideName: "HTTP Methods",
  },
  {
    id: "488b59fb-99b0-4886-a33f-8798df694be1",
    type: "text-slide",
    content: {
      id: "06ef9390-1f48-4d41-a6c5-9817b7df84cc",
      name: "Main Content",
      type: "column",
      content: [
        {
          id: "ec3c7731-a1cd-4599-87cd-276ac2e7ddea",
          name: "Statelessness",
          type: "heading3",
          content:
            "Each request from a client to the server must contain all the information necessary to understand the request.",
          placeholder: "Heading 3",
        },
        {
          id: "f1471666-cf61-4feb-b39d-d480ca10833a",
          name: "Description",
          type: "paragraph",
          content:
            "The server does not store any context or session information between requests.",
          placeholder: "Paragraph",
        },
      ],
    },
    className:
      "p-8 mx-auto flex flex-col justify-center items-center min-h-[300px]",
    slideName: "Statelessness",
  },
  {
    id: "ade9aa16-ad9f-426d-b28a-16d8df49b6ab",
    type: "text-slide",
    content: {
      id: "79052074-0c25-47ef-b142-594f5ebd4f35",
      name: "Main Content",
      type: "column",
      content: [
        {
          id: "13ae5445-68c4-40de-9952-59edfca0d715",
          name: "Resources Identified by URIs",
          type: "heading1",
          content:
            "Resources in REST APIs are identified by URIs (Uniform Resource Identifiers).",
          placeholder: "Heading 1",
        },
        {
          id: "2ebb51bc-37da-43ef-b43d-1bb3febcb0e1",
          name: "Description",
          type: "paragraph",
          content:
            "A URI uniquely identifies a resource and is used in the HTTP request to access it.",
          placeholder: "Paragraph",
        },
      ],
    },
    className:
      "p-8 mx-auto flex flex-col justify-center items-center min-h-[300px]",
    slideName: "Resources and URIs",
  },
  {
    id: "ef1c409b-0318-40f2-8bff-b2e255ee7a9f",
    type: "text-slide",
    content: {
      id: "00f02b56-f215-4d90-a1bf-6a9d8c2c64cc",
      name: "Main Content",
      type: "column",
      content: [
        {
          id: "7876538c-0130-4c3c-8740-35929e57bf16",
          name: "Scalability and Flexibility",
          type: "heading1",
          content:
            "REST promotes scalability and flexibility due to its stateless nature and use of standard HTTP methods.",
          placeholder: "Heading 1",
        },
        {
          id: "76cbffd2-ebcf-412b-9835-70cb3f613253",
          name: "Description",
          type: "paragraph",
          content:
            "It's easy to scale RESTful services by adding more servers to handle increased traffic.",
          placeholder: "Paragraph",
        },
      ],
    },
    className:
      "p-8 mx-auto flex flex-col justify-center items-center min-h-[300px]",
    slideName: "Benefits of REST",
  },
  {
    id: "abb9b113-2761-4b71-b05f-8a4de0d410e7",
    type: "text-slide",
    content: {
      id: "93277a2c-df3c-4b03-89d2-6b94bda2b815",
      name: "Main Content",
      type: "column",
      content: [
        {
          id: "28fb1eae-4cb0-46cd-90ea-a4e1556dc626",
          name: "JSON: The Data Format of Choice",
          type: "heading1",
          content:
            "JSON (JavaScript Object Notation) is commonly used as the data format for REST API responses.",
          placeholder: "Heading 1",
        },
        {
          id: "b6a3b2ba-3755-4c39-b2b6-47f51301cf7d",
          name: "Description",
          type: "paragraph",
          content:
            "JSON's simplicity and human-readability make it ideal for data exchange in web services.",
          placeholder: "Paragraph",
        },
      ],
    },
    className:
      "p-8 mx-auto flex flex-col justify-center items-center min-h-[300px]",
    slideName: "JSON Data Format",
  },
];