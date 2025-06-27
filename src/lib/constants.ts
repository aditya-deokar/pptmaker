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
    title: "Use a",
    highlightedText: "Template",
    description: "Write a prompt and leave everything else for us to handle",
    type: "template",
  },
  {
    title: "Generate with",
    highlightedText: "Creative AI",
    description: "Write a prompt and leave everything else for us to handle",
    type: "creative-ai",
    highlight: true,
  },
  {
    title: "Start from",
    highlightedText: "Scratch",
    description: "Write a prompt and leave everything else for us to handle",
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
