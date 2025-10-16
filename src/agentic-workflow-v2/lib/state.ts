// lib/state.ts - State Management for Advanced Workflow

/**
 * Content item within a slide (nested structure)
 */
export interface FinalSlideContent {
  id: string;
  type: string;
  name: string;
  content: string | string[] | FinalSlideContent[];
  placeholder?: string;
  className?: string;
  alt?: string;
  restrictToDrop?: boolean;
  restrictDropTo?: boolean;
  [key: string]: any; // Allow additional properties
}

/**
 * Complete slide structure
 */
export interface Slide {
  id: string;
  slideName: string;
  type: string;
  className: string;
  content: FinalSlideContent;
}

/**
 * Data tracked for each slide during generation
 */
export interface SlideGenerationData {
  outline: string;
  slideTitle: string | null;
  slideContent: string | null;
  layoutType: string | null;
  imageQuery: string | null;
  imageUrl: string | null;
  finalJson: FinalSlideContent | null;
  validationStatus: 'pending' | 'valid' | 'invalid';
}

/**
 * Main state object for the advanced presentation graph
 */
export interface AdvancedPresentationState {
  // Input Data
  projectId: string | null;
  userId: string;
  userInput: string;
  additionalContext?: string;
  themePreference: string; // Default theme name
  
  // Generation Progress
  outlines: string[] | null;
  slideData: SlideGenerationData[];
  
  // Output
  finalPresentationJson: Slide[] | null;
  
  // Metadata & Error Handling
  error: string | null;
  currentStep: string;
  progress: number; // 0-100
  retryCount: number;
}

/**
 * Layout template information
 */
export interface LayoutTemplate {
  type: string;
  slideName: string;
  className: string;
  requiresImage: boolean;
  contentStructure: 'title-only' | 'title-content' | 'two-column' | 'three-column' | 'image-text';
}
