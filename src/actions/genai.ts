'use server'

import { generateObject} from 'ai'
import { google } from '@ai-sdk/google'
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from "uuid";
import { ContentType } from '@/lib/types';
import { GeneratedOutputSchema, outlineSchema } from '@/lib/zodSchema';






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

export const generateLayoutsJSON =async (outlineArray: string[])=>{
  

  const prompt = `### Guidelines
  I will provide you with a pattern and a format to follow, and for each outline, you must generate unique layouts and contents and give me the output in the JSON format expected.
  Our final JSON output is a combination of layouts and elements. The available LAYOUTS TYPES are as follows: "accentLeft", "accentRight", "imageAndText", "textAndImage", "twoColumns", "twoColumnsWithHeadings", "threeColumns", "threeColumnsWithHeadings", "fourColumns", "twoImageColumns", "threeImageColumns", "fourImageColumns", "tableLayout".
  The available CONTENT TYPES are "heading1", "heading2", "heading3", "heading4", "title", "paragraph", "table", "resizable-column", "image", "blockquote", "numberedList", "bulletList", "todoList", "calloutBox", "codeBlock", "tableOfContents", "divider", "column"

  Use these outlines as a starting point for the content of the presentations
    ${JSON.stringify(outlineArray)}

  The output must be an array of JSON objects.
    1. Write layouts based on the specific outline provided. Do not use types that are not mentioned in the example layouts.
    2. Ensuring each layout is unique.
    3. Adhere to the structure of existing layouts
    4. Fill placeholder data into content fields where required.
    5. Generate unique image placeholders for the 'content' property of image components and also alt text according to the outline.
    6. Ensure proper formatting and schema alignment for the output JSON.
  7. First create LAYOUTS TYPES  at the top most level of the JSON output as follows ${JSON.stringify(
      [
        {
          slideName: "Blank card",
          type: "blank-card",
          className: "p-8 mx-auto flex justify-center items-center min-h-[200px]",
          content: {},
        },
      ]
    )}

  8.The content property of each LAYOUTS TYPE should start with “column” and within the columns content property you can use any  of the CONTENT TYPES I provided above. Resizable-column, column and other multi element contents should be an array because you can have more elements inside them nested. Static elements like title and paragraph should have content set to a string.Here is an example of what 1 layout with 1 column with 1 title inside would look like:
  ${JSON.stringify([
    {
      slideName: "Blank card",
      type: "blank-card",
      className: "p-8 mx-auto flex justify-center items-center min-h-[200px]",
      content: {
        id: uuidv4(),
        type: "column" as ContentType,
        name: "Column",
        content: [
          {
            id: uuidv4(),
            type: "title" as ContentType,
            name: "Title",
            content: "",
            placeholder: "Untitled Card",
          },
        ],
      },
    },
  ])}

  9. Here is a final example of an example output for you to get an idea
  ${JSON.stringify([
    {
      id: uuidv4(),
      slideName: "Blank card",
      type: "blank-card",
      className: "p-8 mx-auto flex justify-center items-center min-h-[200px]",
      content: {
        id: uuidv4(),
        type: "column" as ContentType,
        name: "Column",
        content: [
          {
            id: uuidv4(),
            type: "title" as ContentType,
            name: "Title",
            content: "",
            placeholder: "Untitled Card",
          },
        ],
      },
    },

    {
      id: uuidv4(),
      slideName: "Accent left",
      type: "accentLeft",
      className: "min-h-[300px]",
      content: {
        id: uuidv4(),
        type: "column" as ContentType,
        name: "Column",
        restrictDropTo: true,
        content: [
          {
            id: uuidv4(),
            type: "resizable-column" as ContentType,
            name: "Resizable column",
            restrictToDrop: true,
            content: [
              {
                id: uuidv4(),
                type: "image" as ContentType,
                name: "Image",
                content:
                  "https://plus.unsplash.com/premium_photo-1729004379397-ece899804701?q=80&w=2767&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                alt: "Title",
              },
              {
                id: uuidv4(),
                type: "column" as ContentType,
                name: "Column",
                content: [
                  {
                    id: uuidv4(),
                    type: "heading1" as ContentType,
                    name: "Heading1",
                    content: "",
                    placeholder: "Heading1",
                  },
                  {
                    id: uuidv4(),
                    type: "paragraph" as ContentType,
                    name: "Paragraph",
                    content: "",
                    placeholder: "start typing here",
                  },
                ],
                className: "w-full h-full p-8 flex justify-center items-center",
                placeholder: "Heading1",
              },
            ],
          },
        ],
      },
    },
  ])}

  For Images
    - The alt text should describe the image clearly and concisely.
    - Focus on the main subject(s) of the image and any relevant details such as colors, shapes, people, or objects.
    - Ensure the alt text aligns with the context of the presentation slide it will be used on (e.g., professional, educational, business-related).
    - Avoid using terms like "image of" or "picture of," and instead focus directly on the content and meaning.

    Output the layouts in JSON format. Ensure there are no duplicate layouts across the array.
  `;

  try {
    
     console.log("🟢 Generating Layout 🟢");
   const { object } = await generateObject({
      model: google("gemini-2.0-flash", {
        structuredOutputs: false,
      }),
      schema: GeneratedOutputSchema,
      system:`You are a highly creative AI that generates JSON-based layouts for presentations.`,
      prompt: prompt
    
    });

    if (!object) {
      return { status: 400, error: "No content generated" };
    }

    console.log("🟢 Layouts Generated successfully 🟢");
    return { status: 200, data: object };

  } catch (error) {
      console.error("🔴 ERROR:", error);
      return { status: 500, error: "Internal server error" };
  }



}

export const generateLayouts= async( projectId:string , theme:string)=>{

  try {
    
    if(!projectId){
      return {
        status:400,
        error:'Project ID is Required'
      }
    }

    const user= await currentUser();

    if(!user){
      return{
        status:403,
        error:'User not Authenticated'
      }
    }

    const userExist = await prisma.user.findUnique({
      where: {
        clerkId: user.id,
      },
    });

    if(!userExist || !userExist?.subscription){
      return{
        status:403,
        error:!userExist?.subscription ? 'User does not have an active subscription' : 'User not found in the database', 
      }
    }

    const project = await prisma.project.findUnique({
      where:{
        id:projectId,
        isDeleted:false,
      }
    })

    if(!project){
      return{
        status:404,
        error:'Project not Found'
      }
    }

    if(!project.outlines || project.outlines.length ===0){
      return{
        status:400,
        error:'Project does not have any outline'
      }
    }

    const layouts= await generateLayoutsJSON(project?.outlines);

    if(layouts.status!==200){
      return layouts
    }

    await prisma.project.update({
      where:{
        id:projectId,
      },
      data:{
        slides:layouts.data,
        themeName:theme
      },

    })

    return {
      status:200,
      data:layouts.data
    }



  } catch (error) {
    
    console.error("🔴 ERROR", error);
    return { status: 500, error: "Internal server error", data:[] };
  }

} 
