'use server'

import { generateObject} from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
const outlineSchema = z.object({
  outlines: z.array(z.string())
});

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