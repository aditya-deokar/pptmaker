// /lib/state.ts

// The final, structured JSON for a single content item INSIDE a slide.
// This interface remains the same.
export interface FinalSlideContent {
  id: string;
  type: string;
  name: string; // The descriptive name for the content block (e.g., "Main Title")
  content: string | string[] | FinalSlideContent[];
  // Add any other specific properties like className, alt, code, etc.
  [key: string]: any;
}

// --- NEW INTERFACE ---
// This represents the top-level object for a single slide.
export interface Slide {
  id: string;
  slideName: string; // The name of the slide itself (e.g., "Introduction")
  type: string;      // e.g., "slide"
  className: string;
  content: FinalSlideContent[]; // A slide's content is an array of content items.
}

// The data we build up for each slide during the generation process.
// This interface remains the same.
export interface SlideGenerationData {
  outline: string;
  slideTitle: string | null;
  slideContent: string | null;
  layoutType: string | null;
  imageQuery: string | null;
  imageUrl: string | null;
  finalJson: FinalSlideContent | null;
}

// The main state object for our graph.
export interface PresentationGraphState {
//   projectId: string | null;
  userInput: string;
  outlines: string[] | null;
  slideData: SlideGenerationData[];
  // --- FIX: The final output is now an array of our new Slide type ---
  finalPresentationJson: Slide[] | null;
  error: string | null;
}