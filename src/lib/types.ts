export interface Slide {
  id: string;
  slideName: string;
  type: string;
  content: ContentItem;
  slideOrder?: number;
  className?: string;
}

export interface ContentItem {
  id: string;
  type: ContentType;
  name: string;
  content: ContentItem[] | string | string[] | string[][];
  initialRows?: number;
  initialColumns?: number;
  restrictToDrop?: boolean;
  columns?: number;
  placeholder?: string;
  className?: string;
  alt?: string;
  callOutType?: "success" | "warning" | "info" | "question" | "caution";
  link?: string;
  code?: string;
  language?: string;
  bgColor?: string;
  isTransparent?: boolean;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  isDraggable?: boolean;
  isResizable?: boolean;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  color?: string;
  textAlign?: string;
  icon?: string;
  label?: string;
}

export type ContentType =
  | "column"
  | "resizable-column"
  | "text"
  | "paragraph"
  | "image"
  | "table"
  | "multiColumn"
  | "blank"
  | "imageAndText"
  | "heading1"
  | "heading2"
  | "heading3"
  | "title"
  | "heading4"
  | "table"
  | "blockquote"
  | "numberedList"
  | "bulletedList"
  | "code"
  | "link"
  | "quote"
  | "divider"
  | "calloutBox"
  | "todoList"
  | "bulletList"
  | "codeBlock"
  | "customButton"
  | "table"
  | "tableOfContents"
  | "statBox"
  | "timelineCard";

export interface Theme {
  name: string;
  fontFamily: string;
  fontColor: string;
  accentColor: string;
  backgroundColor: string;
  slideBackgroundColor?: string;
  sidebarColor?: string;
  gradientBackground?: string;
  navbarColor?: string;
  type: 'light' | 'dark';

  // Enhanced visual tokens (Phase 3)
  headingFontFamily?: string;
  accentGradient?: string;
  surfaceColor?: string;
  mutedColor?: string;
  borderRadius?: string;
  shadowPreset?: 'none' | 'soft' | 'medium' | 'dramatic';
}

export interface SlideDimensions {
  width: number;
  height: number;
  preset: string; // e.g., '16:9', '4:3', '9:16', '1:1', 'custom'
}

export interface OutlineCard {
  title: string
  id: string
  order: number
}

export interface LayoutSlides {
  type: string
  slideName: string
  content: ContentItem
  className?: string
}

export interface Layout {
  name: string
  icon: React.FC
  type: string
  component: LayoutSlides
  layoutType: string
}

export interface LayoutGroup {
  name: string
  layouts: Layout[]
}

export interface ComponentGroup {
  name: string;
  components: Component[];
}

interface Component {
  name: string;
  icon: string;
  type: string;
  component: ContentItem;
  componentType: string;
}