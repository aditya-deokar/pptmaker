'use server'

import { generateObject, generateText} from 'ai'
import { getAiModel } from '@/lib/ai-provider';
import { AiProvider } from '@/generated/prisma';
import { outlineSchema } from '@/lib/zodSchema';




export const generateCreativePrompt=async (userPrompt:string)=>{

    try {
    
    // console.log("ðŸŸ¢ Generating creative prompt...", userPrompt);
    const { object } = await generateObject({
      model: await getAiModel("gemini-3-flash-preview"),
      schema: outlineSchema,
      system:`You are an ELITE presentation strategist and content architect. You specialize in creating compelling, well-structured presentation outlines that tell a story and engage audiences.`,
      prompt: `Create a strategic, comprehensive outline for a presentation on: "${userPrompt}"

**OUTLINE REQUIREMENTS:**

1. **Structure & Flow:**
   - Generate 8-15 strategic slides (not just 6)
   - Follow a narrative arc: Opening â†’ Core Content â†’ Closing
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
    console.error("ðŸ”´ ERROR", error);
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
      console.log('ðŸŸ¢ Image generated successfully:', imageFile.base64);
      return imageFile.base64;
    }

    // Fallback if no image found
    return 'https://via.placeholder.com/1024';
  } catch (error) {
    console.error('Failed to generate image:', error);
    return 'https://via.placeholder.com/1024';
  }
};
