// /lib/llm.ts

import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Ensure you have GOOGLE_API_KEY set in your .env file
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

// We'll use a specific model for consistency
export const model = google("gemini-2.5-flash");