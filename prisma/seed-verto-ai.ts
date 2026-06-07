/**
 * Seed script — Premium Verto AI presentation for a specific user.
 *
 * Creates a 16-slide Project directly in the database using premium,
 * advanced, and creative slide layouts filled with real Verto AI content.
 *
 * Run with:
 *   npx tsx prisma/seed-verto-ai.ts
 */

import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const USER_ID = "f53e58b5-4c54-4f37-9083-8ed18f1815b6";
const THEME = "Neon Cyberpunk";
const TITLE = "Verto AI — AI-Native Presentation Workspace";

// ─── Helpers (same pattern as seed-templates.ts) ───────────────

let _counter = 0;
const uid = (prefix: string) => `${prefix}-${++_counter}`;

interface ContentItem {
  id: string;
  type: string;
  name: string;
  content: ContentItem[] | string | string[] | string[][];
  placeholder?: string;
  className?: string;
  alt?: string;
  link?: string;
  bgColor?: string;
  isTransparent?: boolean;
  restrictToDrop?: boolean;
  [key: string]: unknown;
}

interface Slide {
  id: string;
  slideName: string;
  type: string;
  slideOrder: number;
  className: string;
  content: ContentItem;
}

function col(name: string, children: ContentItem[], className?: string): ContentItem {
  return {
    id: uid("col"),
    type: "column",
    name,
    content: children,
    className: className || "flex flex-col gap-4 w-full",
  };
}

function resizableCol(name: string, children: ContentItem[], className?: string): ContentItem {
  return {
    id: uid("rc"),
    type: "resizable-column",
    name,
    content: children,
    className: className || "",
  };
}

function title(name: string, text: string, className?: string): ContentItem {
  return {
    id: uid("title"),
    type: "title",
    name,
    content: text,
    className: className || "",
  };
}

function h1(name: string, text: string, className?: string): ContentItem {
  return {
    id: uid("h1"),
    type: "heading1",
    name,
    content: text,
    className: className || "",
  };
}

function h2(name: string, text: string, className?: string): ContentItem {
  return {
    id: uid("h2"),
    type: "heading2",
    name,
    content: text,
    className: className || "",
  };
}

function h3(name: string, text: string, className?: string): ContentItem {
  return {
    id: uid("h3"),
    type: "heading3",
    name,
    content: text,
    className: className || "",
  };
}

function h4(name: string, text: string, className?: string): ContentItem {
  return {
    id: uid("h4"),
    type: "heading4",
    name,
    content: text,
    className: className || "",
  };
}

function para(name: string, text: string, className?: string): ContentItem {
  return {
    id: uid("p"),
    type: "paragraph",
    name,
    content: text,
    className: className || "",
  };
}

function img(name: string, src: string, className?: string): ContentItem {
  return {
    id: uid("img"),
    type: "image",
    name,
    content: src,
    alt: name,
    className: className || "",
  };
}

function bulletList(name: string, items: string[]): ContentItem {
  return {
    id: uid("bl"),
    type: "bulletList",
    name,
    content: items,
  };
}

function blockquote(name: string, text: string, className?: string): ContentItem {
  return {
    id: uid("bq"),
    type: "blockquote",
    name,
    content: text,
    className: className || "",
  };
}

function statBox(name: string, value: string, label?: string, icon?: string): ContentItem {
  return {
    id: uid("stat"),
    type: "statBox",
    name,
    content: value,
    label: label,
    icon: icon,
  };
}

function btn(name: string, text: string, bgColor?: string): ContentItem {
  return {
    id: uid("btn"),
    type: "customButton",
    name,
    content: text,
    link: "#",
    bgColor: bgColor || "#000000",
  };
}

function divider(name: string): ContentItem {
  return {
    id: uid("div"),
    type: "divider",
    name,
    content: "",
  };
}

// ─── Build 16 Slides ───────────────────────────────────────────

function buildVertoSlides(): Slide[] {
  return [
    // ══════════════════════════════════════════════
    // SLIDE 0 — Gradient Hero
    // ══════════════════════════════════════════════
    {
      id: uid("verto"),
      slideName: "Verto AI",
      type: "gradientHero",
      slideOrder: 0,
      className: "h-full w-full flex items-center justify-center p-12 text-center",
      content: col("root", [
        col("content", [
          title("title", "Verto AI", "text-center mb-4"),
          para(
            "subtitle",
            "AI-native presentation, design, and MCP workspace. Turn a prompt into a polished presentation, refine it in a visual editor, generate mobile UI concepts, and expose the whole presentation layer through a hosted MCP server.",
            "text-center opacity-80 mb-8"
          ),
          btn("cta", "Explore Verto AI →", "#7c3aed"),
        ], "max-w-4xl flex flex-col items-center justify-center"),
      ]),
    },

    // ══════════════════════════════════════════════
    // SLIDE 1 — Agenda
    // ══════════════════════════════════════════════
    {
      id: uid("verto"),
      slideName: "Today's Agenda",
      type: "agendaSlide",
      slideOrder: 1,
      className: "h-full w-full p-8 md:p-12",
      content: col("root", [
        title("title", "Today's Agenda", "mb-10"),
        resizableCol("agenda-items", [
          col("left", [
            h3("a1", "01  ·  What Is Verto AI?"),
            h3("a2", "02  ·  The Problem We Solve"),
            h3("a3", "03  ·  8-Agent Generation Pipeline"),
          ], "flex flex-col gap-6 pr-4"),
          col("right", [
            h3("a4", "04  ·  Platform Features & Tech Stack"),
            h3("a5", "05  ·  MCP & Architecture"),
            h3("a6", "06  ·  Pricing & Roadmap"),
          ], "flex flex-col gap-6 pl-4"),
        ]),
      ]),
    },

    // ══════════════════════════════════════════════
    // SLIDE 2 — Feature Showcase (What is Verto AI)
    // ══════════════════════════════════════════════
    {
      id: uid("verto"),
      slideName: "What Is Verto AI?",
      type: "featureShowcase",
      slideOrder: 2,
      className: "h-full w-full p-8",
      content: col("root", [
        title("title", "What Is Verto AI?", "text-center mb-2"),
        para(
          "subtitle",
          "A full-stack creative workspace built on Next.js 16 — not just a slide generator",
          "text-center opacity-70 mb-10"
        ),
        col("features", [
          col("f1", [
            h3("icon1", "🧠", "text-4xl mb-2"),
            h4("title1", "AI Presentation Generation"),
            para("desc1", "8-agent LangGraph workflow from topic to final slide JSON with layout-aware content writing", "opacity-70 text-sm"),
          ], "p-6 rounded-xl border border-border/30 flex flex-col gap-2"),
          col("f2", [
            h3("icon2", "🎨", "text-4xl mb-2"),
            h4("title2", "Visual Slide Editor"),
            para("desc2", "Recursive content tree, theme switching, interactive editing, share links, and PDF export", "opacity-70 text-sm"),
          ], "p-6 rounded-xl border border-border/30 flex flex-col gap-2"),
          col("f3", [
            h3("icon3", "🔌", "text-4xl mb-2"),
            h4("title3", "Hosted MCP Server"),
            para("desc3", "11 presentation tools and 4 resources available through authenticated Streamable HTTP transport", "opacity-70 text-sm"),
          ], "p-6 rounded-xl border border-border/30 flex flex-col gap-2"),
          col("f4", [
            h3("icon4", "🔑", "text-4xl mb-2"),
            h4("title4", "BYOK Runtime"),
            para("desc4", "Bring your own Google, OpenAI, or Groq keys with model preferences and validation-aware storage", "opacity-70 text-sm"),
          ], "p-6 rounded-xl border border-border/30 flex flex-col gap-2"),
        ], "grid grid-cols-2 gap-6"),
      ]),
    },

    // ══════════════════════════════════════════════
    // SLIDE 3 — Accent Left (The Problem)
    // ══════════════════════════════════════════════
    {
      id: uid("verto"),
      slideName: "The Problem We Solve",
      type: "accentLeft",
      slideOrder: 3,
      className: "h-full w-full",
      content: col("root", [
        resizableCol("split", [
          img(
            "problem-img",
            "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop",
            "w-full h-full object-cover"
          ),
          col("text", [
            h1("title", "The Problem We Solve"),
            para(
              "desc",
              "Creating polished presentations is slow, tedious, and disconnected from modern AI workflows. Teams spend hours in legacy tools, manually designing slides, searching for images, and formatting content — when they should be focusing on their message."
            ),
            bulletList("pain-points", [
              "Manual slide design takes 3-8 hours per deck",
              "No AI integration in traditional presentation tools",
              "External AI clients can't programmatically create or edit decks",
              "Mobile UI mockups require separate design tools entirely",
            ]),
          ], "w-full h-full p-8 md:p-12 flex justify-center items-center"),
        ]),
      ]),
    },

    // ══════════════════════════════════════════════
    // SLIDE 4 — Process Flow (8-Agent Pipeline)
    // ══════════════════════════════════════════════
    {
      id: uid("verto"),
      slideName: "8-Agent Generation Pipeline",
      type: "processFlow",
      slideOrder: 4,
      className: "p-4 md:p-8 mx-auto min-h-[400px]",
      content: col("root", [
        title("title", "8-Agent Generation Pipeline", "mb-8 text-center"),
        col("flow", [
          col("s1", [
            h3("n1", "1", "text-2xl font-bold text-primary mb-2"),
            h4("t1", "projectInitializer"),
          ], "flex-1 bg-primary/10 rounded-lg p-6 text-center"),
          para("arrow1", "→", "text-3xl text-primary text-center min-w-[2rem]"),
          col("s2", [
            h3("n2", "2", "text-2xl font-bold text-primary mb-2"),
            h4("t2", "outlineGenerator"),
          ], "flex-1 bg-primary/10 rounded-lg p-6 text-center"),
          para("arrow2", "→", "text-3xl text-primary text-center min-w-[2rem]"),
          col("s3", [
            h3("n3", "3", "text-2xl font-bold text-primary mb-2"),
            h4("t3", "layoutSelector"),
          ], "flex-1 bg-primary/10 rounded-lg p-6 text-center"),
          para("arrow3", "→", "text-3xl text-primary text-center min-w-[2rem]"),
          col("s4", [
            h3("n4", "4", "text-2xl font-bold text-primary mb-2"),
            h4("t4", "contentWriter"),
          ], "flex-1 bg-primary/10 rounded-lg p-6 text-center"),
        ], "flex flex-row items-center justify-between gap-2 w-full"),
        para(
          "pipeline-desc",
          "Layout selection happens before content writing so the generated copy fits the target slide shape. The pipeline continues through imageQueryGenerator → imageFetcher → jsonCompiler → databasePersister to produce the final deck.",
          "text-center opacity-70 mt-6"
        ),
      ]),
    },

    // ══════════════════════════════════════════════
    // SLIDE 5 — Metric Dashboard (KPIs)
    // ══════════════════════════════════════════════
    {
      id: uid("verto"),
      slideName: "Platform KPIs at a Glance",
      type: "metricDashboard",
      slideOrder: 5,
      className: "h-full w-full p-8 flex flex-col justify-center",
      content: col("root", [
        h2("title", "Platform KPIs at a Glance", "text-center mb-4"),
        para("desc", "The numbers that define Verto AI's capabilities today", "text-center opacity-70 mb-12"),
        resizableCol("metrics", [
          statBox("m1", "11", "MCP Tools Exposed", "🔌"),
          statBox("m2", "8", "AI Pipeline Agents", "🤖"),
          statBox("m3", "3", "AI Providers (BYOK)", "🔑"),
          statBox("m4", "30+", "Slide Layouts Available", "🎨"),
        ]),
      ]),
    },

    // ══════════════════════════════════════════════
    // SLIDE 6 — Icon Grid (Feature Deep-Dive)
    // ══════════════════════════════════════════════
    {
      id: uid("verto"),
      slideName: "Feature Deep-Dive",
      type: "iconGrid",
      slideOrder: 6,
      className: "p-4 md:p-8 mx-auto min-h-[400px]",
      content: col("root", [
        title("title", "Feature Deep-Dive", "mb-8 text-center"),
        col("grid", [
          col("i1", [
            h3("icon1", "⚡", "text-4xl mb-2"),
            h4("t1", "AI Presentation Generation"),
            para("d1", "Topic-to-deck generation with run tracking and streamable real-time progress updates", "text-sm"),
          ], "text-center p-4 rounded-lg border"),
          col("i2", [
            h3("icon2", "🎨", "text-4xl mb-2"),
            h4("t2", "Visual Slide Editor"),
            para("d2", "Recursive content tree with theme switching, interactive editing, and PDF export", "text-sm"),
          ], "text-center p-4 rounded-lg border"),
          col("i3", [
            h3("icon3", "📱", "text-4xl mb-2"),
            h4("t3", "Mobile Design Generation"),
            para("d3", "AI-generated HTML frames with background generation and per-frame regeneration via Inngest", "text-sm"),
          ], "text-center p-4 rounded-lg border"),
          col("i4", [
            h3("icon4", "🔌", "text-4xl mb-2"),
            h4("t4", "Hosted MCP Server"),
            para("d4", "Streamable HTTP transport with session-based auth for Claude, Cursor, and other MCP clients", "text-sm"),
          ], "text-center p-4 rounded-lg border"),
        ], "grid grid-cols-2 gap-6"),
      ]),
    },

    // ══════════════════════════════════════════════
    // SLIDE 7 — Comparison (Traditional vs Verto AI)
    // ══════════════════════════════════════════════
    {
      id: uid("verto"),
      slideName: "Traditional Tools vs Verto AI",
      type: "comparisonLayout",
      slideOrder: 7,
      className: "p-4 md:p-8 mx-auto min-h-[400px]",
      content: col("root", [
        title("title", "Traditional Tools vs Verto AI", "mb-6 text-center"),
        resizableCol("comparison", [
          col("optionA", [
            h3("labelA", "Traditional Slide Tools", "text-center text-red-500"),
            bulletList("listA", [
              "Manual layout design, one slide at a time",
              "No AI integration — copy-paste from ChatGPT",
              "No API access for external automation",
              "Separate tools needed for mobile mockups",
              "No BYOK — locked to vendor AI models",
            ]),
          ], "border-2 border-primary/20 rounded-lg p-6 bg-red-50 dark:bg-red-950/20"),
          col("optionB", [
            h3("labelB", "Verto AI", "text-center text-green-500"),
            bulletList("listB", [
              "8-agent pipeline: topic → polished deck in seconds",
              "Built-in AI with layout-aware content writing",
              "11 MCP tools for programmatic access",
              "Dedicated mobile design workspace with Inngest jobs",
              "BYOK: Google, OpenAI, and Groq with model preferences",
            ]),
          ], "border-2 border-primary/20 rounded-lg p-6 bg-green-50 dark:bg-green-950/20"),
        ]),
      ]),
    },

    // ══════════════════════════════════════════════
    // SLIDE 8 — Bento Grid (Tech Stack)
    // ══════════════════════════════════════════════
    {
      id: uid("verto"),
      slideName: "Tech Stack",
      type: "bentoGrid",
      slideOrder: 8,
      className: "h-full w-full p-6",
      content: col("root", [
        title("title", "Tech Stack", "mb-6"),
        resizableCol("bento", [
          col("c1", [
            img(
              "tech-img",
              "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop",
              "h-full object-cover rounded-2xl"
            ),
          ], "h-full bg-muted/20 rounded-3xl border border-border/50 p-2"),
          col("c2", [
            statBox("s1", "Next.js 16", "App Router + Turbopack", "🚀"),
            statBox("s2", "React 19", "Tailwind CSS 4 + Radix UI", "⚛️"),
          ], "flex flex-col gap-4"),
          col("c3", [
            h2("heading", "Core Technologies"),
            bulletList("stack", [
              "LangGraph — AI orchestration pipeline",
              "Prisma 6 + PostgreSQL — Data layer",
              "Clerk — Authentication & user management",
              "Inngest — Background jobs for mobile designs",
              "Lemon Squeezy — Subscription billing",
              "MCP SDK — Streamable HTTP transport",
            ]),
          ], "bg-primary/5 rounded-3xl p-6 flex flex-col justify-center"),
        ]),
      ]),
    },

    // ══════════════════════════════════════════════
    // SLIDE 9 — Split Content Image (Architecture)
    // ══════════════════════════════════════════════
    {
      id: uid("verto"),
      slideName: "System Architecture",
      type: "splitContentImage",
      slideOrder: 9,
      className: "min-h-[400px]",
      content: col("root", [
        resizableCol("split", [
          col("text", [
            h2("title", "System Architecture"),
            bulletList("arch-points", [
              "User in browser → Verto AI web app → Clerk Auth",
              "Server actions → LangGraph presentation pipeline",
              "Streamable generation API for real-time updates",
              "AI runtime with BYOK routing: Google, OpenAI, Groq",
              "Mobile design pages → Inngest background jobs",
              "MCP clients → Hosted MCP server → Prisma → PostgreSQL",
              "Lemon Squeezy billing integration",
            ]),
          ], "w-full h-full p-8"),
          img(
            "arch-img",
            "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop",
            "w-full h-full object-cover"
          ),
        ]),
      ]),
    },

    // ══════════════════════════════════════════════
    // SLIDE 10 — Testimonial
    // ══════════════════════════════════════════════
    {
      id: uid("verto"),
      slideName: "What Users Are Saying",
      type: "testimonialSlide",
      slideOrder: 10,
      className: "h-full w-full p-12 flex items-center justify-center",
      content: col("root", [
        blockquote(
          "quote",
          "Verto AI completely transformed our pitch deck workflow. What used to take our team an entire day now happens in minutes — and the quality is better than what we produced manually. The MCP integration lets our AI assistants create decks autonomously.",
          "text-2xl text-center mb-8"
        ),
        resizableCol("author-info", [
          img(
            "avatar",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
            "w-16 h-16 rounded-full object-cover"
          ),
          col("details", [
            h4("author-name", "Alex Chen"),
            para("author-title", "VP of Product, TechForward Inc.", "opacity-70"),
          ], "flex flex-col justify-center pl-4"),
        ]),
      ], "max-w-4xl flex flex-col items-center"),
    },

    // ══════════════════════════════════════════════
    // SLIDE 11 — Stats Row (Growth Metrics)
    // ══════════════════════════════════════════════
    {
      id: uid("verto"),
      slideName: "Growth Metrics",
      type: "statsRow",
      slideOrder: 11,
      className: "h-full w-full p-8 flex flex-col justify-center",
      content: col("root", [
        h2("title", "Growth & Performance Metrics", "text-center mb-12"),
        resizableCol("stats", [
          statBox("s1", "30+", "Slide Layouts & Components", "🎨"),
          statBox("s2", "4", "Product Surfaces (Web, Mobile, MCP, Templates)", "📱"),
          statBox("s3", "< 60s", "Average Deck Generation Time", "⚡"),
        ]),
      ]),
    },

    // ══════════════════════════════════════════════
    // SLIDE 12 — Timeline Layout (MCP Flow)
    // ══════════════════════════════════════════════
    {
      id: uid("verto"),
      slideName: "MCP Request Flow",
      type: "timelineLayout",
      slideOrder: 12,
      className: "p-4 md:p-8 mx-auto min-h-[400px]",
      content: col("root", [
        title("title", "MCP Request Flow", "mb-8 text-center"),
        resizableCol("phases", [
          col("phase1", [
            h3("ph1", "Phase 1: Authentication", "text-primary"),
            para("pd1", "Client sends initialize request with Bearer token (vk_live_...). Server validates against hashed MCP key metadata stored in PostgreSQL and returns session ID + capabilities."),
          ], "border-l-4 border-primary pl-4"),
          col("phase2", [
            h3("ph2", "Phase 2: Tool Execution", "text-primary"),
            para("pd2", "Client sends tool calls over the established session. The MCP server routes to authenticated presentation actions — create, edit, list, publish, generate, and more."),
          ], "border-l-4 border-primary/60 pl-4"),
          col("phase3", [
            h3("ph3", "Phase 3: Response", "text-primary"),
            para("pd3", "Tools read/write presentation data through Prisma, then return structured JSON or streamed responses back to the client — Claude, Cursor, or any MCP-compatible AI."),
          ], "border-l-4 border-primary/30 pl-4"),
        ], "gap-4"),
      ]),
    },

    // ══════════════════════════════════════════════
    // SLIDE 13 — Pricing Table
    // ══════════════════════════════════════════════
    {
      id: uid("verto"),
      slideName: "Pricing",
      type: "pricingTable",
      slideOrder: 13,
      className: "h-full w-full p-8",
      content: col("root", [
        title("title", "Simple, Transparent Pricing", "text-center mb-2"),
        para("subtitle", "Choose the plan that fits your workflow", "text-center opacity-70 mb-10"),
        resizableCol("plans", [
          col("free", [
            h3("plan-free", "Free"),
            h1("price-free", "$0/mo"),
            bulletList("feat-free", [
              "5 AI-generated presentations",
              "Basic slide layouts",
              "PDF export",
              "Community support",
            ]),
            btn("cta-free", "Get Started", "transparent"),
          ], "p-6 rounded-2xl border border-border/30 flex flex-col gap-4"),
          col("pro", [
            h3("plan-pro", "Professional ⭐"),
            h1("price-pro", "$29/mo"),
            bulletList("feat-pro", [
              "Unlimited AI presentations",
              "All premium layouts",
              "BYOK: Google, OpenAI, Groq",
              "MCP server access",
              "Mobile design generation",
              "Priority support",
            ]),
            btn("cta-pro", "Upgrade to Pro", "#7c3aed"),
          ], "p-6 rounded-2xl border-2 border-primary/40 flex flex-col gap-4 bg-primary/5 scale-105"),
          col("enterprise", [
            h3("plan-ent", "Enterprise"),
            h1("price-ent", "Custom"),
            bulletList("feat-ent", [
              "Everything in Professional",
              "Custom AI model deployment",
              "Dedicated MCP endpoints",
              "SLA guarantee",
              "SSO & advanced security",
            ]),
            btn("cta-ent", "Contact Sales", "transparent"),
          ], "p-6 rounded-2xl border border-border/30 flex flex-col gap-4"),
        ]),
      ]),
    },

    // ══════════════════════════════════════════════
    // SLIDE 14 — Visual Timeline (Roadmap)
    // ══════════════════════════════════════════════
    {
      id: uid("verto"),
      slideName: "Product Roadmap",
      type: "timeline",
      slideOrder: 14,
      className: "h-full w-full p-8",
      content: col("root", [
        h2("title", "Product Roadmap", "mb-8 text-center"),
        resizableCol("timeline", [
          {
            id: uid("tc"),
            type: "timelineCard",
            name: "Phase 1",
            content: "Foundation — 8-agent pipeline, visual editor, template system, PDF export, Clerk auth, Lemon Squeezy billing",
          } as ContentItem,
          {
            id: uid("tc"),
            type: "timelineCard",
            name: "Phase 2",
            content: "Scale — Hosted MCP server, BYOK multi-provider runtime, mobile design workspace, Inngest background jobs",
          } as ContentItem,
          {
            id: uid("tc"),
            type: "timelineCard",
            name: "Phase 3",
            content: "Enterprise — Team collaboration, custom model deployment, advanced analytics, white-label options, API marketplace",
          } as ContentItem,
        ]),
      ]),
    },

    // ══════════════════════════════════════════════
    // SLIDE 15 — Thank You
    // ══════════════════════════════════════════════
    {
      id: uid("verto"),
      slideName: "Thank You",
      type: "thankYouSlide",
      slideOrder: 15,
      className: "h-full w-full flex items-center justify-center p-12 text-center",
      content: col("root", [
        title("title", "Thank You", "text-center mb-2"),
        para(
          "message",
          "Verto AI is where ideas become polished decks in seconds — and where AI clients get first-class presentation tooling through MCP. We're building the future of creative workspaces.",
          "text-center opacity-80 mb-6"
        ),
        divider("sep"),
        h3("contact", "verto.ai.aditya-deokar.me  ·  hello@verto.ai", "text-center opacity-60"),
      ], "max-w-3xl flex flex-col items-center justify-center gap-4"),
    },
  ];
}

// ─── Main ──────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Seeding Verto AI presentation...\n");

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: USER_ID },
  });

  if (!user) {
    console.error(`❌ User not found: ${USER_ID}`);
    console.error("   Make sure the user exists in the database before seeding.");
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name} (${user.email})`);

  const slides = buildVertoSlides();
  const outlines = slides.map((s) => s.slideName);

  // Check if a project with this exact title already exists for the user
  const existing = await prisma.project.findFirst({
    where: {
      userId: USER_ID,
      title: TITLE,
      isDeleted: false,
    },
  });

  if (existing) {
    // Update existing
    await prisma.project.update({
      where: { id: existing.id },
      data: {
        slides: slides as any,
        outlines,
        themeName: THEME,
        updatedAt: new Date(),
      },
    });
    console.log(`\n✅ Updated existing project (id: ${existing.id})`);
  } else {
    // Create new
    const project = await prisma.project.create({
      data: {
        title: TITLE,
        userId: USER_ID,
        slides: slides as any,
        outlines,
        themeName: THEME,
        isDeleted: false,
        isPublished: false,
        projectType: "PRESENTATION",
      },
    });
    console.log(`\n✅ Created new project (id: ${project.id})`);
  }

  console.log("\n📊 Presentation details:");
  console.log(`   Title:  ${TITLE}`);
  console.log(`   Theme:  ${THEME}`);
  console.log(`   Slides: ${slides.length}`);
  console.log(`   Layouts used:`);
  slides.forEach((s, i) => {
    console.log(`     ${i.toString().padStart(2)}. [${s.type}] ${s.slideName}`);
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
