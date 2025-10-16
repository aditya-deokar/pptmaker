import Home from "@/icons/Home";
import { Settings } from "lucide-react";

import { ComponentGroup, LayoutGroup, LayoutSlides, Theme } from "@/lib/types";
import {
  BlankCardIcon,
  FourColumnsIcon,
  FourImageColumnsIcon,
  ImageAndTextIcon,
  TextAndImageIcon,
  ThreeColumnsIcon,
  ThreeColumnsWithHeadingsIcon,
  ThreeImageColumnsIcon,
  TwoColumnsIcon,
  TwoColumnsWithHeadingsIcon,
  TwoImageColumnsIcon,
} from "./iconsComponent";

import {
  BlankCard,
  AccentLeft,
  AccentRight,
  ImageAndText,
  TextAndImage,
  TwoColumns,
  ThreeColumns,
  TwoColumnsWithHeadings,
  ThreeColumnsWithHeadings,
  FourColumns,
  TwoImageColumns,
  FourImageColumns,
  ThreeImageColumns,
} from "./slideLayouts";

import {
  Heading1,
  CalloutBoxComponent,
  Heading2,
  Heading3,
  Heading4,
  NumberedListComponent,
  Paragraph,
  ResizableColumn,
  Table,
  Title,
  TodoListComponent,
  BulletListComponent
} from "@/lib/slideComponents";

import { Template } from "@/icons/Template";
import { Trash } from "@/icons/Trash";


export const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },

  navMain: [
    {
      title: "Home",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Templates",
      url: "/templates",
      icon: Template,
    },
    {
      title: "Trash",
      url: "/trash",
      icon: Trash,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
};

export const CreatePageCard = [
  {
    title: "AI-Powered",
    highlightedText: "Agentic Workflow",
    description: "Let 5 specialized AI agents work together to create your perfect presentation",
    type: "agentic-workflow",
    highlight: true,
  },
  {
    title: "Generate with",
    highlightedText: "Creative AI",
    description: "Write a prompt and leave everything else for us to handle",
    type: "creative-ai",
  },
  {
    title: "Start from",
    highlightedText: "Scratch",
    description: "Build your presentation from the ground up with full control",
    type: "create-scratch",
  },
];

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

export const timeAgo = (timestamp: string) => {
  const now = new Date();
  const diffInSeconds = Math.floor(
    (now.getTime() - new Date(timestamp).getTime()) / 1000
  );

  // Time intervals in seconds
  const intervals = [
    { label: "year", value: 60 * 60 * 24 * 365 },
    { label: "month", value: 60 * 60 * 24 * 30 },
    { label: "days", value: 60 * 60 * 24 },
    { label: "hours", value: 60 * 60 },
    { label: "mins", value: 60 },
    { label: "sec", value: 1 },
  ];

  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i];
    const count = Math.floor(diffInSeconds / interval.value);

    if (count >= 1) {
      return `${count} ${interval.label} ago`;
    }
  }

  return "just now";
};

export const createSlideFromLayout = (layoutType: string): LayoutSlides => {
  switch (layoutType) {
    case "blank-card":
      return BlankCard;
    case "accentLeft":
      return AccentLeft;
    case "accentRight":
      return AccentRight;
    case "imageAndText":
      return ImageAndText;
    case "textAndImage":
      return TextAndImage;
    default:
      return BlankCard;
  }
};

export const layouts: LayoutGroup[] = [
  {
    name: "Basic",
    layouts: [
      {
        name: "Blank card",
        icon: BlankCardIcon,
        type: "layout",
        layoutType: "blank-card",
        component: BlankCard,
      },
      {
        name: "Image and text",
        icon: ImageAndTextIcon,
        type: "layout",
        layoutType: "imageAndText",
        component: ImageAndText,
      },
      {
        name: "Text and image",
        icon: TextAndImageIcon,
        type: "layout",
        layoutType: "textAndImage",
        component: TextAndImage,
      },
      {
        name: "Two Columns",
        icon: TwoColumnsIcon,
        type: "layout",
        layoutType: "twoColumns",
        component: TwoColumns,
      },
      {
        name: "Two Columns with headings",
        icon: TwoColumnsWithHeadingsIcon,
        type: "layout",
        layoutType: "twoColumnsWithHeadings",
        component: TwoColumnsWithHeadings,
      },
      {
        name: "Three Columns",
        icon: ThreeColumnsIcon,
        type: "layout",
        layoutType: "threeColumns",
        component: ThreeColumns,
      },
      {
        name: "Three Columns with headings",
        icon: ThreeColumnsWithHeadingsIcon,
        type: "layout",
        layoutType: "threeColumnsWithHeadings",
        component: ThreeColumnsWithHeadings,
      },

      {
        name: "Four Columns",
        icon: FourColumnsIcon,
        type: "layout",
        layoutType: "fourColumns",
        component: FourColumns,
      },
    ],
  },

  {
    name: "Card layouts",
    layouts: [
      {
        name: "Accent left",
        icon: ImageAndTextIcon,
        type: "layout",
        layoutType: "accentLeft",
        component: AccentLeft,
      },
      {
        name: "Accent right",
        icon: TextAndImageIcon,
        type: "layout",
        layoutType: "accentRight",
        component: AccentRight,
      },
    ],
  },

  {
    name: "Images",
    layouts: [
      {
        name: "2 images columns",
        icon: TwoImageColumnsIcon,
        type: "layout",
        layoutType: "twoImageColumns",
        component: TwoImageColumns,
      },
      {
        name: "3 images columns",
        icon: ThreeImageColumnsIcon,
        type: "layout",
        layoutType: "threeImageColumns",
        component: ThreeImageColumns,
      },
      {
        name: "4 images columns",
        icon: FourImageColumnsIcon,
        type: "layout",
        layoutType: "fourImageColumns",
        component: FourImageColumns,
      },
    ],
  },
];

export const component: ComponentGroup[] = [
  {
    name: "Text",
    components: [
      {
        name: "Title",
        icon: "T",
        type: "component",
        component: Title,
        componentType: "title",
      },
      {
        componentType: "heading1",
        name: "Heading 1",
        type: "component",
        component: Heading1,
        icon: "H1",
      },
      {
        componentType: "heading2",
        name: "Heading 2",
        type: "component",
        component: Heading2,
        icon: "H2",
      },
      {
        componentType: "heading3",
        name: "Heading 3",
        type: "component",
        component: Heading3,
        icon: "H3",
      },
      {
        componentType: "heading4",
        name: "Heading 4",
        type: "component",
        component: Heading4,
        icon: "H4",
      },

      {
        componentType: "paragraph",
        name: "Paragraph",
        type: "component",
        component: Paragraph,
        icon: "Paragraph",
      },
    ],
  },

  {
    name: "Tables",
    components: [
      {
        componentType: "table2x2",
        name: "2×2 table",
        type: "component",
        component: { ...Table, initialColumns: 2, initialRows: 2 },
        icon: "⊞",
      },
      {
        componentType: "table3x3",
        name: "3×3 table",
        type: "component",
        component: { ...Table, initialColumns: 3, initialRows: 3 },
        icon: "⊞",
      },
      {
        componentType: "table4x4",
        name: "4×4 table",
        type: "component",
        component: { ...Table, initialColumns: 4, initialRows: 4 },
        icon: "⊞",
      },
    ],
  },

  {
    name: "Lists",
    components: [
      {
        componentType: "bulletList",
        name: "Bulleted list",
        type: "component",
        component: BulletListComponent,
        icon: "•",
      },
      {
        componentType: "numberedList",
        name: "Numbered list",
        type: "component",
        component: NumberedListComponent,
        icon: "1.",
      },
      {
        componentType: "todoList",
        name: "Todo list",
        type: "component",
        component: TodoListComponent,
        icon: "☐",
      },
    ],
  },
  {
    name: "Callouts",
    components: [
      {
        componentType: "note",
        name: "Note box",
        type: "component",
        component: { ...CalloutBoxComponent, callOutType: "info" },
        icon: "📝",
      },
      {
        componentType: "info",
        name: "Info box",
        type: "component",
        component: { ...CalloutBoxComponent, callOutType: "info" },
        icon: "ℹ",
      },
      {
        componentType: "warning",
        name: "Warning box",
        type: "component",
        component: { ...CalloutBoxComponent, callOutType: "warning" },
        icon: "⚠",
      },
      {
        componentType: "caution",
        name: "Caution box",
        type: "component",
        component: { ...CalloutBoxComponent, callOutType: "caution" },
        icon: "⚠",
      },
      {
        componentType: "success",
        name: "Success box",
        type: "component",
        component: { ...CalloutBoxComponent, callOutType: "success" },
        icon: "✓",
      },
      {
        componentType: "question",
        name: "Question box",
        type: "component",
        component: { ...CalloutBoxComponent, callOutType: "question" },
        icon: "?",
      },
    ],
  },

  {
    name: "Columns",
    components: [
      {
        componentType: "resizableColumns",
        name: "2x2 Column",
        type: "component",
        component: ResizableColumn,
        icon: "⊞",
      },
    ],
  },
];

export const themes: Theme[] = [
  {
    name: "Default",
    fontFamily: "'Inter', sans-serif",
    fontColor: "#000000",
    backgroundColor: "#f0f0f0",
    slideBackgroundColor: "#ffffff",
    accentColor: "#3b82f6",
    navbarColor: "#ffffff",
    sidebarColor: "#f0f0f0",
    type: "light",
  },
  {
    name: "Dark Elegance",
    fontFamily: "'Playfair Display', serif",
    fontColor: "#ffffff",
    backgroundColor: "#1a1a1a",
    slideBackgroundColor: "#2c2c2c",
    accentColor: "#ffd700",
    gradientBackground: "linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)",
    navbarColor: "#2c2c2c",
    sidebarColor: "#1a1a1a",
    type: "dark",
  },
  {
    name: "Nature Fresh",
    fontFamily: "'Montserrat', sans-serif",
    fontColor: "#1b4332",
    backgroundColor: "#e8f5e9",
    slideBackgroundColor: "#ffffff",
    accentColor: "#4caf50",
    gradientBackground: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
    navbarColor: "#c8e6c9",
    sidebarColor: "#e8f5e9",
    type: "light",
  },
  {
    name: "Tech Vibrant",
    fontFamily: "'Roboto', sans-serif",
    fontColor: "#ffffff",
    backgroundColor: "#2c3e50",
    slideBackgroundColor: "#34495e",
    accentColor: "#e74c3c",
    gradientBackground: "linear-gradient(135deg, #3498db 0%, #2c3e50 100%)",
    navbarColor: "#34495e",
    sidebarColor: "#2c3e50",
    type: "dark",
  },
  {
    name: "Pastel Dream",
    fontFamily: "'Lato', sans-serif",
    fontColor: "#4a4e69",
    backgroundColor: "#f7e8e8",
    slideBackgroundColor: "#ffffff",
    accentColor: "#b5838d",
    gradientBackground: "linear-gradient(135deg, #f7e8e8 0%, #e5cece 100%)",
    navbarColor: "#e5cece",
    sidebarColor: "#f7e8e8",
    type: "light",
  },
  {
    name: "Ocean Breeze",
    fontFamily: "'Open Sans', sans-serif",
    fontColor: "#f0f8ff",
    backgroundColor: "#0077be",
    slideBackgroundColor: "#ffffff",
    accentColor: "#00a86b",
    gradientBackground: "linear-gradient(135deg, #0077be 0%, #00a86b 100%)",
    navbarColor: "#0077be",
    sidebarColor: "#005c8f",
    type: "dark",
  },
  {
    name: "Sunset Glow",
    fontFamily: "'Merriweather', serif",
    fontColor: "#3d3d3d",
    backgroundColor: "#ffd700",
    slideBackgroundColor: "#ffffff",
    accentColor: "#ff6b6b",
    gradientBackground: "linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%)",
    navbarColor: "#ff6b6b",
    sidebarColor: "#ffd700",
    type: "light",
  },
  {
    name: "Minimalist Mono",
    fontFamily: "'IBM Plex Mono', monospace",
    fontColor: "#000000",
    backgroundColor: "#ffffff",
    slideBackgroundColor: "#f5f5f5",
    accentColor: "#000000",
    navbarColor: "#f5f5f5",
    sidebarColor: "#ffffff",
    type: "light",
  },
  {
    name: "Neon Nights",
    fontFamily: "'Orbitron', sans-serif",
    fontColor: "#ffffff",
    backgroundColor: "#000000",
    slideBackgroundColor: "#1a1a1a",
    accentColor: "#00ff00",
    gradientBackground: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
    navbarColor: "#1a1a1a",
    sidebarColor: "#000000",
    type: "dark",
  },
  {
    name: "Earthy Tones",
    fontFamily: "'Nunito', sans-serif",
    fontColor: "#3d3d3d",
    backgroundColor: "#d7ccc8",
    slideBackgroundColor: "#f5f5f5",
    accentColor: "#795548",
    gradientBackground: "linear-gradient(135deg, #d7ccc8 0%, #a1887f 100%)",
    navbarColor: "#a1887f",
    sidebarColor: "#d7ccc8",
    type: "light",
  },
  {
    name: "Retro Pop",
    fontFamily: "'Pacifico', cursive",
    fontColor: "#1a1a1a",
    backgroundColor: "#ff4081",
    slideBackgroundColor: "#ffffff",
    accentColor: "#ffeb3b",
    gradientBackground: "linear-gradient(135deg, #ff4081 0%, #ffeb3b 100%)",
    navbarColor: "#ff4081",
    sidebarColor: "#c60055",
    type: "dark",
  },
  {
    name: "Zen Garden",
    fontFamily: "'Noto Serif JP', serif",
    fontColor: "#2f3e46",
    backgroundColor: "#f1f8e9",
    slideBackgroundColor: "#ffffff",
    accentColor: "#558b2f",
    gradientBackground: "linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%)",
    navbarColor: "#dcedc8",
    sidebarColor: "#f1f8e9",
    type: "light",
  },
  {
    name: "Arctic Frost",
    fontFamily: "'Quicksand', sans-serif",
    fontColor: "#2c3e50",
    backgroundColor: "#e0f7fa",
    slideBackgroundColor: "#ffffff",
    accentColor: "#00bcd4",
    gradientBackground: "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)",
    navbarColor: "#b2ebf2",
    sidebarColor: "#e0f7fa",
    type: "light",
  },
  {
    name: "Vintage Warmth",
    fontFamily: "'Libre Baskerville', serif",
    fontColor: "#4a4a4a",
    backgroundColor: "#ffecb3",
    slideBackgroundColor: "#ffffff",
    accentColor: "#ff6f00",
    gradientBackground: "linear-gradient(135deg, #ffecb3 0%, #ffe082 100%)",
    navbarColor: "#ffe082",
    sidebarColor: "#ffecb3",
    type: "light",
  },
  {
    name: "Cosmic Delight",
    fontFamily: "'Space Grotesk', sans-serif",
    fontColor: "#ffffff",
    backgroundColor: "#311b92",
    slideBackgroundColor: "#4527a0",
    accentColor: "#7c4dff",
    gradientBackground: "linear-gradient(135deg, #311b92 0%, #4527a0 100%)",
    navbarColor: "#4527a0",
    sidebarColor: "#311b92",
    type: "dark",
  },
  {
    name: "Midnight Bloom",
    fontFamily: "'Poppins', sans-serif",
    fontColor: "#ffffff",
    backgroundColor: "#1a1b41",
    slideBackgroundColor: "#292a5d",
    accentColor: "#f72585",
    gradientBackground: "linear-gradient(135deg, #1a1b41 0%, #292a5d 100%)",
    navbarColor: "#292a5d",
    sidebarColor: "#1a1b41",
    type: "dark",
  },
  {
    name: "Coral Sunset",
    fontFamily: "'Raleway', sans-serif",
    fontColor: "#33272a",
    backgroundColor: "#feeafa",
    slideBackgroundColor: "#ffffff",
    accentColor: "#ff9a8b",
    gradientBackground: "linear-gradient(135deg, #feeafa 0%, #ff9a8b 100%)",
    navbarColor: "#feeafa",
    sidebarColor: "#fff0f5",
    type: "light",
  },
  {
    name: "Emerald City",
    fontFamily: "'Montserrat', sans-serif",
    fontColor: "#ffffff",
    backgroundColor: "#064e3b",
    slideBackgroundColor: "#065f46",
    accentColor: "#34d399",
    gradientBackground: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
    navbarColor: "#065f46",
    sidebarColor: "#064e3b",
    type: "dark",
  },
  {
    name: "Lavender Mist",
    fontFamily: "'Nunito', sans-serif",
    fontColor: "#4a4e69",
    backgroundColor: "#f3e8ff",
    slideBackgroundColor: "#ffffff",
    accentColor: "#9f7aea",
    gradientBackground: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
    navbarColor: "#e9d5ff",
    sidebarColor: "#f3e8ff",
    type: "light",
  },
  {
    name: "Golden Hour",
    fontFamily: "'Source Sans Pro', sans-serif",
    fontColor: "#3d3d3d",
    backgroundColor: "#fef3c7",
    slideBackgroundColor: "#ffffff",
    accentColor: "#f59e0b",
    gradientBackground: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    navbarColor: "#fde68a",
    sidebarColor: "#fef3c7",
    type: "light",
  },
  {
    name: "Arctic Aurora",
    fontFamily: "'Roboto', sans-serif",
    fontColor: "#e2e8f0",
    backgroundColor: "#0f172a",
    slideBackgroundColor: "#1e293b",
    accentColor: "#38bdf8",
    gradientBackground: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    navbarColor: "#1e293b",
    sidebarColor: "#0f172a",
    type: "dark",
  },
  {
    name: "Sakura Blossom",
    fontFamily: "'Noto Sans JP', sans-serif",
    fontColor: "#5d576b",
    backgroundColor: "#fff5f5",
    slideBackgroundColor: "#ffffff",
    accentColor: "#f687b3",
    gradientBackground: "linear-gradient(135deg, #fff5f5 0%, #fed7e2 100%)",
    navbarColor: "#fed7e2",
    sidebarColor: "#fff5f5",
    type: "light",
  },
  {
    name: "Urban Jungle",fontFamily: "'Karla', sans-serif",
    fontColor: "#2d3748",
    backgroundColor: "#e6fffa",
    slideBackgroundColor: "#ffffff",
    accentColor: "#2c7a7b",
    gradientBackground: "linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%)",
    navbarColor: "#b2f5ea",
    sidebarColor: "#e6fffa",
    type: "light",
  },
  {
    name: "Cosmic Latte",
    fontFamily: "'Work Sans', sans-serif",
    fontColor: "#3d3d3d",
    backgroundColor: "#fff8e1",
    slideBackgroundColor: "#ffffff",
    accentColor: "#d97706",
    gradientBackground: "linear-gradient(135deg, #fff8e1 0%, #fef3c7 100%)",
    navbarColor: "#fef3c7",
    sidebarColor: "#fff8e1",
    type: "light",
  },
  {
    name: "Neon Cyberpunk",
    fontFamily: "'Rajdhani', sans-serif",
    fontColor: "#ffffff",
    backgroundColor: "#09090b",
    slideBackgroundColor: "#18181b",
    accentColor: "#22d3ee",
    gradientBackground: "linear-gradient(135deg, #09090b 0%, #18181b 100%)",
    navbarColor: "#18181b",
    sidebarColor: "#09090b",
    type: "dark",
  },
  {
    name: "Royal Sapphire",
    fontFamily: "'Inter', sans-serif",
    fontColor: "#F8FAFC",
    backgroundColor: "#1A2238",
    slideBackgroundColor: "#232B47",
    accentColor: "#9D4EDD",
    gradientBackground: "linear-gradient(135deg, #232B47 0%, #1A2238 100%)",
    navbarColor: "#232B47",
    sidebarColor: "#1A2238",
    type: "dark",
  },
  {
    name: "Ivory Gold",
    fontFamily: "'Playfair Display', serif",
    fontColor: "#2D2D2D",
    backgroundColor: "#F8F5F2",
    slideBackgroundColor: "#FFFDF6",
    accentColor: "#D4AF37",
    gradientBackground: "linear-gradient(135deg, #FFFDF6 0%, #F8F5F2 100%)",
    navbarColor: "#FFFDF6",
    sidebarColor: "#F8F5F2",
    type: "light",
  },
  {
    name: "Emerald Velvet",
    fontFamily: "'Montserrat', sans-serif",
    fontColor: "#F8FAF8",
    backgroundColor: "#12372A",
    slideBackgroundColor: "#20503A",
    accentColor: "#50FA7B",
    gradientBackground: "linear-gradient(135deg, #20503A 0%, #12372A 100%)",
    navbarColor: "#20503A",
    sidebarColor: "#12372A",
    type: "dark",
  },
  {
    name: "Rose Quartz",
    fontFamily: "'Lato', sans-serif",
    fontColor: "#3D2C2E",
    backgroundColor: "#F7E9EC",
    slideBackgroundColor: "#FFF6F9",
    accentColor: "#E75480",
    gradientBackground: "linear-gradient(135deg, #FFF6F9 0%, #F7E9EC 100%)",
    navbarColor: "#FFF6F9",
    sidebarColor: "#F7E9EC",
    type: "light",
  },
  {
    name: "Charcoal Copper",
    fontFamily: "'IBM Plex Mono', monospace",
    fontColor: "#F5F3F0",
    backgroundColor: "#232526",
    slideBackgroundColor: "#393939",
    accentColor: "#B87333",
    gradientBackground: "linear-gradient(135deg, #393939 0%, #232526 100%)",
    navbarColor: "#393939",
    sidebarColor: "#232526",
    type: "dark",
  },
  {
    name: "Sapphire Mist",
    fontFamily: "'Poppins', sans-serif",
    fontColor: "#1A2238",
    backgroundColor: "#EAF6FF",
    slideBackgroundColor: "#F5FAFF",
    accentColor: "#3A86FF",
    gradientBackground: "linear-gradient(135deg, #F5FAFF 0%, #EAF6FF 100%)",
    navbarColor: "#F5FAFF",
    sidebarColor: "#EAF6FF",
    type: "light",
  },
  {
    name: "Onyx Gold",
    fontFamily: "'Merriweather', serif",
    fontColor: "#F8FAFC",
    backgroundColor: "#181818",
    slideBackgroundColor: "#232323",
    accentColor: "#FFD700",
    gradientBackground: "linear-gradient(135deg, #232323 0%, #181818 100%)",
    navbarColor: "#232323",
    sidebarColor: "#181818",
    type: "dark",
  },
  {
    name: "Pearl Blush",
    fontFamily: "'Nunito', sans-serif",
    fontColor: "#3D2C2E",
    backgroundColor: "#FFF5F7",
    slideBackgroundColor: "#FFFFFF",
    accentColor: "#FFB4A2",
    gradientBackground: "linear-gradient(135deg, #FFFFFF 0%, #FFF5F7 100%)",
    navbarColor: "#FFFFFF",
    sidebarColor: "#FFF5F7",
    type: "light",
  },
];
