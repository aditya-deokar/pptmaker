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


// export const generateLayoutsJSON = async (outlineArray: string[]) => {
//   // --- FIX: A completely rewritten prompt that requests valid JSON and uses the presentation outlines ---
//   const prompt = `
//     You are an expert presentation layout designer. Based on the following presentation outlines, generate an array of slide layouts in valid JSON format.

//     Presentation Outlines:
//     ${outlineArray.map((outline, index) => `${index + 1}. ${outline}`).join('\n')}

//     Rules for JSON generation:
//     1.  The root of the output MUST be a valid JSON array of slide objects.
//     2.  Each object in the array represents a slide.
//     3.  Generate content (titles, headings, paragraphs) that is relevant to the provided outlines.
//     4.  Use a variety of slide types to make the presentation engaging.
//     5.  For all "id" fields, use the placeholder string "uuid-placeholder".
//     6.  For "image" content, use a relevant Unsplash URL.
//     7.  Do NOT include any explanations, comments, or any text outside of the main JSON array.

//     Here is an example of a single slide object structure:
//     {
//       "id": "uuid-placeholder",
//       "slideName": "Title Slide",
//       "type": "title-slide",
//       "className": "p-8 mx-auto flex flex-col justify-center items-center min-h-[300px]",
//       "content": {
//         "id": "uuid-placeholder",
//         "type": "column",
//         "name": "Main Content",
//         "content": [
//           {
//             "id": "uuid-placeholder",
//             "type": "title",
//             "name": "Title",
//             "content": "The Main Title of the Presentation",
//             "placeholder": "Presentation Title"
//           },
//           {
//             "id": "uuid-placeholder",
//             "type": "paragraph",
//             "name": "Subtitle",
//             "content": "A brief and engaging subtitle.",
//             "placeholder": "Subtitle"
//           }
//         ]
//       }
//     }
//   `;

//   try {
//     console.log("🟢 Generating Layouts based on outlines...");
    
//     const { object } = await generateObject({
//       model: google("gemini-1.5-flash"), // No need for structuredOutputs: false here
//       schema: ReferedLayoutsSchema,
//       system: `You are a creative AI assistant that generates presentation slide layouts in JSON format based on user-provided outlines.`,
//       prompt: prompt,
//     });

//     if (!object) {
//       return { status: 400, error: "No content was generated by the AI." };
//     }

//     // --- FIX: After generation, loop through the object and replace placeholders with real UUIDs ---
//     object.forEach(populateUuids);

//     console.log("🟢 Layouts Generated and UUIDs populated successfully 🟢");
//     return { status: 200, data: object };

//   } catch (error) {
//       console.error("🔴 AI Generation ERROR:", error);
//       return { status: 500, error: "An error occurred during AI content generation." };
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

//     if (!userExist) {
//       return { status: 404, error: "User not found in the database" };
//     }
    
//     // Note: Subscription check logic is kept as is.
//     // if (!userExist.subscription) {
//     //   return {
//     //     status: 403,
//     //     error: "User does not have an active subscription",
//     //   };
//     // }

//     const project = await prisma.project.findUnique({
//       where: { id: projectId, isDeleted: false },
//     });

//     if (!project) {
//       return { status: 404, error: "Project not found" };
//     }

//     if (!project.outlines || project.outlines.length === 0) {
//       return { status: 400, error: "Project does not have any outlines to generate content from" };
//     }

//     const layouts = await generateLayoutsJSON(project.outlines);

//     if (layouts.status !== 200 || !layouts.data) {
//       return { status: layouts.status, error: layouts.error || "Failed to generate valid layouts" };
//     }

//     await prisma.project.update({
//       where: { id: projectId },
//       // --- FIX: Store only the array of slides (layouts.data), not the entire status object. ---
//       // The data is now a JSON object which Prisma handles correctly.
//       data: { slides: layouts.data as any, themeName: theme },
//     });

//     return { status: 200, data: layouts };
//   } catch (error) {
//     console.error("🔴 Server Action ERROR:", error);
//     return { status: 500, error: "Internal server error" };
//   }
// };




export const generateLayoutsJSON = async (outlineArray: string[]) => {
  
  // --- FIX: A completely rewritten prompt to teach the AI about your rich components ---
  const prompt = `
    You are an expert presentation designer AI. Your task is to generate a rich, engaging slide deck in JSON format based on the provided outlines.

    Presentation Outlines:
    ${outlineArray.map((outline, index) => `${index + 1}. ${outline}`).join('\n')}

    **CRITICAL JSON Structure Rules:**
    1.  The root output MUST be a valid JSON array of slide objects. Do NOT include any text outside the JSON array.
    2.  For each slide object, you will generate a root "content" object that defines the layout (e.g., a "column").
    3.  **Data Type Rule:** The "content" property's data type depends on the "type":
        - For "column" or "resizable-column", "content" MUST be an array of other content objects.
        - For "title", "heading1", "paragraph", "blockquote", "calloutBox", "content" MUST be a STRING with the text.
        - For "bulletList" or "numberedList", "content" MUST be an ARRAY OF STRINGS.
        - For "image", "content" MUST be a STRING containing a URL.
        - For "codeBlock", "content" MUST be an EMPTY STRING, and the code goes in the "code" property.
    4.  The "name" property should be a short, descriptive name for the component instance (e.g., "Main Title", "Key Features List"). The actual text goes in the "content" property.
    5.  For all "id" fields, use the placeholder string "uuid-placeholder".

    **Example of a Correct Title Slide Structure:**
    {
      "id": "uuid-placeholder",
      "slideName": "Introduction",
      "type": "title-slide",
      "className": "flex flex-col justify-center items-center text-center",
      "content": {
        "id": "uuid-placeholder",
        "type": "column",
        "name": "Title Content",
        "content": [
          {
            "id": "uuid-placeholder",
            "type": "title",
            "name": "Main Title",
            "content": "Langchain: A Framework for Language Model Applications"
          },
          {
            "id": "uuid-placeholder",
            "type": "paragraph",
            "name": "Subtitle",
            "className": "text-xl text-gray-500",
            "content": "Empowering developers to build data-aware and agentic applications."
          }
        ]
      }
    }

    **Example of a Correct Bullet List Slide Structure:**
    {
      "id": "uuid-placeholder",
      "slideName": "Core Components",
      "type": "content-slide",
      "className": "p-8",
      "content": {
        "id": "uuid-placeholder",
        "type": "column",
        "name": "List Content",
        "content": [
          {
            "id": "uuid-placeholder",
            "type": "heading2",
            "name": "Slide Heading",
            "content": "Core Langchain Components"
          },
          {
            "id": "uuid-placeholder",
            "type": "bulletList",
            "name": "Component List",
            "content": ["Models", "Prompts", "Chains", "Indexes"]
          }
        ]
      }
    }

    Now, based on all these rules and the outlines, generate the complete JSON array for the presentation.
  `;

  try {
    console.log("🟢 Generating rich layouts based on outlines...");
    
    const { object } = await generateObject({
      model: google("gemini-1.5-flash"),
      schema: ReferedLayoutsSchema,
      system: `You are a creative AI assistant that generates presentation slide layouts in valid JSON format based on user-provided outlines and a rich set of component types.`,
      prompt: prompt,
    });

    if (!object) {
      return { status: 400, error: "No content was generated by the AI." };
    }

    object.forEach(populateUuids);

    console.log("🟢 Rich layouts generated successfully 🟢");
    return { status: 200, data: object };

  } catch (error) {
      console.error("🔴 AI Generation ERROR:", error);
      // Add more detailed error logging for Zod validation issues
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
    id: "52393323-f662-4cde-8a99-0165bc7b7a27",
    type: "title",
    content: {
      id: "404651f2-1692-4e27-af6d-215e779d378d",
      name: "Langchain: A Framework for Language Model Applications",
      type: "heading1",
      content: "",
    },
    className: "slide-title",
    slideName: "Langchain Introduction",
  },
  {
    id: "b46d414c-ee40-47e1-b37b-5cfa4109b971",
    type: "paragraph",
    content: {
      id: "e8c62102-f06a-44e7-bb90-d59b9d8e7cf6",
      name: "Langchain empowers developers to build applications that are both data-aware, meaning they can access and process external data, and agentic, capable of making decisions and taking actions.",
      type: "paragraph",
      content: "",
    },
    className: "slide-content",
    slideName: "Data-Aware and Agentic Applications",
  },
  {
    id: "94597d7b-ebcd-44e8-9869-782451d9cf93",
    type: "bulletList",
    content: {
      id: "59d1ebc9-3851-49eb-8191-fef4351d0dee",
      name: "Core Langchain Components",
      type: "bulletList",
      content: ["Models", "Prompts", "Chains", "Indexes"],
    },
    className: "slide-content",
    slideName: "Core Components",
  },
  {
    id: "dff99b4b-858d-4391-a04a-43a53676d7ea",
    type: "column",
    content: {
      id: "ffbc950b-1ffd-44e4-a87f-58f41a574449",
      name: "Modules",
      type: "resizable-column",
      content: [
        {
          id: "86aa860c-34f0-42e7-944d-96012b554c63",
          name: "Model I/O",
          type: "bulletList",
          content: ["LLMs", "Embeddings"],
        },
        {
          id: "444089c5-7921-49bc-80f8-cc8971a30846",
          name: "Data Connection",
          type: "bulletList",
          content: ["Document Loaders", "Vector Databases"],
        },
        {
          id: "155d1837-571c-45ec-be43-a3ff8fd9d221",
          name: "Chains & Agents",
          type: "bulletList",
          content: ["Sequential Chains", "Agents"],
        },
      ],
    },
    className: "slide-content",
    slideName: "Langchain Modules",
  },
  {
    id: "e0b29a8c-594d-4f91-b498-d06d51103cc6",
    type: "bulletList",
    content: {
      id: "8a052e19-df48-4fda-87e1-b317ba47e39e",
      name: "Langchain Applications",
      type: "bulletList",
      content: [
        "Chatbots",
        "Question Answering Systems",
        "Text Summarization Tools",
        "Data-driven Agents",
      ],
    },
    className: "slide-content",
    slideName: "Use Cases",
  },
  {
    id: "0129d993-f7dd-4355-ad7f-006bb53774f2",
    type: "calloutBox",
    content: {
      id: "c71db744-1a38-4cdf-93f2-b0ced646c3d5",
      name: "Key Advantage",
      type: "calloutBox",
      content:
        "Langchain streamlines development with pre-built components and abstractions, reducing boilerplate code and accelerating development cycles.",
      callOutType: "success",
    },
    className: "slide-content",
    slideName: "Simplified Development",
  },
  {
    id: "4a438166-c5ef-49cf-b865-726233671d32",
    type: "paragraph",
    content: {
      id: "765e00a0-32ce-4d8d-83ca-2916be154cde",
      name: "Langchain is a powerful and versatile framework for building the next generation of AI applications.",
      type: "paragraph",
      content: "",
    },
    className: "slide-content",
    slideName: "Conclusion",
  },
];