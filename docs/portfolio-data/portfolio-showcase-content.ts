import { DetailedProject } from "./project.type";

const LIVE_URL = "https://verto.ai.aditya-deokar.me";
const REPO_URL = "https://github.com/aditya-deokar/verto.ai";
const DOCS_BASE_URL = `${REPO_URL}/tree/master/docs`;

export const pptmakerDetailedProjectData: DetailedProject = {
  name: "Verto AI",
  tagline:
    "Multi-agent AI presentation engine with MCP integration, real-time generation streaming, and a recursive slide editor — built on Next.js 16, LangGraph, and Inngest",
  year: "2026",
  role: "Founder Engineer — Full-Stack, AI Systems, and Platform Architecture",
  duration: "Ongoing product development",
  team: "Solo engineering across frontend, backend, AI pipeline, MCP protocol, and DevOps",
  category: "AI SaaS · Developer Platform · Productivity · MCP Server",
  liveUrl: LIVE_URL,
  repoUrl: REPO_URL,
  docsUrl: DOCS_BASE_URL,
  navigation: [
    "Overview",
    "Architecture",
    "Features",
    "Process",
    "Outcomes",
    "Docs",
  ],
  overviewDescription:
    "Verto AI is a production-grade Next.js 16 SaaS platform that transforms user prompts into complete, editable slide decks through an 8-agent LangGraph pipeline. The system spans three major subsystems: a presentation generation engine with SSE-streamed real-time progress, a mobile UI design generator powered by Inngest background functions with realtime pub/sub, and a Model Context Protocol (MCP) server that exposes 10 tools and 3 resources to external AI clients like Claude Desktop, Cursor, and Windsurf. Every layer — from Clerk-guarded server actions and Zod-validated LLM outputs to recursive ContentItem rendering and webhook-driven billing — is documented across 10+ architecture docs and 8 ADRs.",

  overviewKeyPoints: [
    {
      number: "8",
      title: "Specialized AI Agents",
      description:
        "A LangGraph state machine orchestrates 8 agents — from project initialization through layout-aware content writing, conditional image fetching, deterministic JSON compilation, and database persistence — each with tuned temperature profiles and Zod-validated outputs.",
    },
    {
      number: "10",
      title: "MCP Tools Exposed",
      description:
        "A full MCP server exposes presentation CRUD, slide management, publishing, and AI generation to any MCP-compatible client via dual transport (stdio for IDE integrations, Streamable HTTP for production agents).",
    },
    {
      number: "3",
      title: "Distinct Subsystems",
      description:
        "Presentation generation (LangGraph + SSE), mobile UI design (Inngest + Realtime pub/sub), and MCP protocol server (JSON-RPC 2.0) — each with dedicated architecture, transport, and data models.",
    },
    {
      number: "18+",
      title: "Documentation Artifacts",
      description:
        "10 core architecture docs, 8 ADRs, 4 MCP specification docs, contributing guide, glossary, and deployment checklists — all maintained alongside the codebase.",
    },
  ],

  overviewQuote: {
    text: "The key systems decision was layout-first generation: select the visual structure before writing content so each agent's output is structurally aware of its target layout. This eliminated post-generation reformatting and enabled deterministic JSON compilation into a recursive editor runtime.",
    label: "ADR-005 — Layout-First Content Generation",
  },

  architectureHighlights: [
    {
      title: "Server-First Mutations",
      description:
        "All data mutations flow through Next.js Server Actions with centralized ownership enforcement via getOwnedProject() — no REST controllers, automatic CSRF protection.",
    },
    {
      title: "Agent-Based AI Decomposition",
      description:
        "8 agents with independent LLM temperature/token configs, Zod validation, and retry logic. The pipeline is testable, debuggable, and extensible at each node.",
    },
    {
      title: "Database-Persisted Progress",
      description:
        "Generation progress is tracked in PresentationGenerationRun rows, not simulated on the client. Progress survives page refreshes and is visible across devices.",
    },
    {
      title: "Recursive Component Rendering",
      description:
        "Slides are stored as recursive ContentItem trees. MasterRecursiveComponent walks the tree and renders the right React component at any nesting depth — editor, present, share, and export modes all use the same data.",
    },
    {
      title: "MCP as a First-Class Protocol",
      description:
        "The MCP server delegates to existing server actions — never touches Prisma directly. Plugin-based tool registry allows new domains (templates, mobile design) without modifying core server code.",
    },
    {
      title: "Event-Driven Mobile Design",
      description:
        "Mobile screen generation runs as Inngest background functions with @inngest/realtime middleware for pub/sub streaming — completely decoupled from the main request cycle.",
    },
  ],

  technologies: {
    frontend: [
      {
        name: "Next.js 16",
        category: "Framework",
        description:
          "App Router, Server Actions, Turbopack dev server, React Compiler auto-memoization, and file-system routing with route groups.",
      },
      {
        name: "React 19",
        category: "UI Runtime",
        description:
          "React Compiler enabled via babel-plugin-react-compiler for automatic memoization. Powers the recursive slide editor, presentation mode, and landing page.",
      },
      {
        name: "TypeScript 5 (Strict)",
        category: "Language",
        description:
          "Strict mode enforced across UI components, server actions, AI state schemas, MCP tool handlers, and Zod validators.",
      },
      {
        name: "Zustand 5",
        category: "State Management",
        description:
          "6 stores segmented by concern — useSlideStore (persisted, undo/redo), useAgenticWorkflowStore (ephemeral), useSearchStore, and 3 more. LocalStorage persistence with partialize exclusions.",
      },
      {
        name: "Tailwind CSS v4 + shadcn/ui",
        category: "Design System",
        description:
          "Utility-first CSS with 20+ Radix UI primitives styled via shadcn/ui pattern. Includes cmdk command palette, vaul drawers, and sonner toasts.",
      },
      {
        name: "Framer Motion + GSAP",
        category: "Animation",
        description:
          "Framer Motion for app UI animations and page transitions. GSAP with @gsap/react for complex timeline-based landing page sequences.",
      },
    ],
    backend: [
      {
        name: "Prisma 6 + PostgreSQL",
        category: "Data Layer",
        description:
          "6 models (User, Project, MobileProject, MobileFrame, PresentationGenerationRun, Subscription). Slides stored as recursive JSON. Migration-driven schema evolution.",
      },
      {
        name: "Clerk",
        category: "Authentication",
        description:
          "Edge middleware route protection, server-side auth() in server actions, auto user creation on first login, and dark theme integration.",
      },
      {
        name: "Inngest 4 + @inngest/realtime",
        category: "Background Jobs & Realtime",
        description:
          "Event-driven background functions for mobile design generation with realtime pub/sub middleware. Step functions, automatic retries, and local dev dashboard.",
      },
      {
        name: "MCP Server (@modelcontextprotocol/sdk)",
        category: "AI Protocol Layer",
        description:
          "10 tools + 3 resources over dual transport (stdio + Streamable HTTP). Plugin-based tool registry, Zod validation, structured error responses with suggestions.",
      },
      {
        name: "Lemon Squeezy",
        category: "Payments",
        description:
          "Merchant-of-Record billing with webhook-driven subscription sync (created, updated, cancelled, expired events). Customer portal and feature gating.",
      },
    ],
    ai: [
      {
        name: "Google Gemini 2.5 Flash",
        category: "LLM",
        description:
          "Primary model with 5 tuned agent profiles — temperature 0.2 (JSON compilation) to 0.8 (creative outlines), token limits from 1K to 8K per agent.",
      },
      {
        name: "LangGraph",
        category: "Agent Orchestration",
        description:
          "StateGraph with typed channels, sequential edges, and a conditional image-fetcher loop (shouldFetchMoreImages). Recursion limit of 150 for loop safety.",
      },
      {
        name: "Vercel AI SDK + LangChain",
        category: "Model Integration",
        description:
          "AI SDK v6 for streaming primitives and provider abstraction. LangChain for structured generation with Zod schemas. Google GenAI adapter for Gemini.",
      },
      {
        name: "Unsplash API + Fallback Provider",
        category: "Image Retrieval",
        description:
          "Provider abstraction pattern with UnsplashImageProvider (real API search) and FallbackImageProvider (categorized placeholders) for resiliency.",
      },
    ],
    devops: [
      {
        name: "Vercel Deployment",
        category: "Hosting",
        description:
          "Production deployment on Vercel with App Router conventions, Inngest webhook endpoints, and environment-based configuration.",
      },
      {
        name: "SSE Streaming Pipeline",
        category: "Real-Time Feedback",
        description:
          "StreamingEventEmitter singleton with subscribe/emit pattern, event history replay (1,000 events per run), and auto-cleanup. Client connects via EventSource.",
      },
      {
        name: "Zod Runtime Validation",
        category: "Reliability",
        description:
          "LLM outputs validated at every pipeline stage — outlineSchema, bulkContentSchema, layoutSelectionSchema, imageQuerySchema. MCP tool inputs validated with 3-layer validation (Zod → semantic → business rules).",
      },
      {
        name: "Puppeteer + Chromium",
        category: "Server-Side Rendering",
        description:
          "puppeteer-core with @sparticuz/chromium-min for serverless slide rendering. html2canvas + jsPDF for client-side PDF export pipeline.",
      },
    ],
  },

  techStats: {
    totalTechnologies:
      "45+ libraries and services across frontend, backend, AI, and DevOps layers",
    typescriptCoverage:
      "Strict TypeScript across all layers — UI components, server actions, AI state, MCP handlers, and Zod schemas",
    microservices:
      "3 event-driven subsystems: LangGraph presentation pipeline, Inngest mobile design workflows, and MCP JSON-RPC server",
    aiModels:
      "Gemini 2.5 Flash with 5 tuned agent profiles, Zod-validated structured outputs, and provider-abstracted image retrieval",
  },

  overview:
    "Verto AI is engineered as an interconnected platform, not a single-feature app. The presentation engine uses an 8-agent LangGraph pipeline where layout selection precedes content writing — ensuring every slide is structurally aware of its target format before a single word is generated. The mobile design subsystem runs as Inngest background functions with realtime pub/sub streaming, completely decoupled from the main request cycle. The MCP server exposes the platform's capabilities to external AI agents through a standardized protocol, turning Verto AI into a programmable presentation API. Every mutation flows through ownership-checked server actions, every LLM response passes through Zod validation, and every architectural decision is recorded in one of the 8 ADRs that accompany the codebase.",

  features: [
    {
      number: "01",
      title: "8-Agent LangGraph Presentation Pipeline",
      description:
        "A stateful LangGraph state machine orchestrates 8 specialized agents: Project Initializer → Outline Generator → Layout Selector → Content Writer → Image Query Generator → Image Fetcher (conditional loop) → JSON Compiler → Database Persister. Each agent has its own LLM temperature/token profile, Zod validation schema, and is wrapped by wrapNode() for automatic progress tracking and SSE event emission.",
      tags: [
        "LangGraph",
        "State Machine",
        "8 Agents",
        "Conditional Edges",
        "Zod Validation",
      ],
      impact: [
        { metric: "8", label: "Sequential specialized agents with typed state transitions" },
        {
          metric: "5",
          label: "Distinct LLM temperature profiles (0.2 precise → 0.8 creative)",
        },
      ],
    },
    {
      number: "02",
      title: "Layout-First Content Generation (ADR-005)",
      description:
        "Layout selection runs BEFORE content writing — a deliberate architectural decision documented in ADR-005. The Content Writer receives each slide's layoutType and generates structurally-aware content: comparisonPointsA/B for comparison layouts, statValue/statLabel for big-number layouts, processSteps[] for timelines. This eliminates post-generation reformatting and enables deterministic JSON compilation across 17+ layout families.",
      tags: [
        "ADR-005",
        "Layout Intelligence",
        "Structural Awareness",
        "17+ Layout Templates",
      ],
      impact: [
        { metric: "17+", label: "Supported layout families with dedicated content structures" },
        {
          metric: "0",
          label: "Post-generation reformatting steps — content is layout-native from creation",
        },
      ],
    },
    {
      number: "03",
      title: "MCP Server — AI-Agent Protocol Interface",
      description:
        "A full Model Context Protocol server exposes 10 tools (presentation CRUD, slide management, publishing, AI generation) and 3 resources (presentations, templates, themes) via dual transport: stdio for IDE integrations (Claude Desktop, Cursor, Windsurf) and Streamable HTTP for production agents. Features plugin-based tool registry, 3-layer input validation (Zod → semantic → business rules), structured error responses with recovery suggestions, cursor-based pagination, and tiered rate limiting.",
      tags: [
        "MCP",
        "JSON-RPC 2.0",
        "Dual Transport",
        "Plugin Registry",
        "Claude Desktop",
        "Cursor",
      ],
      impact: [
        {
          metric: "10+3",
          label: "MCP tools and resources exposed to external AI agents",
        },
        {
          metric: "7",
          label: "Compatible MCP clients (Claude Desktop, Claude Code, Cursor, Windsurf, Cline, custom agents, Gemini CLI)",
        },
      ],
    },
    {
      number: "04",
      title: "Real-Time SSE Generation Streaming (ADR-004)",
      description:
        "Generation progress is database-persisted in PresentationGenerationRun rows and simultaneously streamed to clients via Server-Sent Events. The StreamingEventEmitter singleton supports subscribe/emit with event history replay (1,000 events per run) for reconnection resilience. 6 event types: agent_start, progress, token, agent_complete, error, complete. Progress survives page refreshes and is visible across devices.",
      tags: [
        "SSE",
        "ADR-004",
        "EventSource",
        "Progress Persistence",
        "Reconnection Replay",
      ],
      impact: [
        {
          metric: "1,000",
          label: "Events buffered per run for replay on client reconnection",
        },
        {
          metric: "6",
          label: "Distinct SSE event types for granular generation visibility",
        },
      ],
    },
    {
      number: "05",
      title: "Recursive Slide Editor with Undo/Redo (ADR-006)",
      description:
        "Slides are stored as recursive ContentItem trees — columns containing headings, paragraphs, images, lists, code blocks, and nested columns at any depth. MasterRecursiveComponent walks the tree and renders 15+ component types. The Zustand-based useSlideStore provides full undo/redo with past[]/future[] stacks, optimistic updates, and localStorage persistence with partialize exclusions. Same data renders in 4 contexts: editor, present, share, and PDF export.",
      tags: [
        "ADR-006",
        "Recursive Tree",
        "Undo/Redo",
        "15+ Components",
        "4 Render Modes",
      ],
      impact: [
        { metric: "15+", label: "ContentItem types rendered by MasterRecursiveComponent" },
        {
          metric: "4",
          label: "Rendering contexts from a single Slide[] data model (editor, present, share, export)",
        },
      ],
    },
    {
      number: "06",
      title: "Mobile Design Generator with Inngest Realtime",
      description:
        "A separate subsystem generates mobile UI screens using Inngest v4 background functions with @inngest/realtime middleware for pub/sub streaming. The generateScreens function orchestrates multi-screen generation with theme-aware Tailwind CSS + CSS variable styling, while regenerateFrame handles individual frame updates. Generation events are published to user-scoped channels for real-time client updates.",
      tags: [
        "Inngest v4",
        "@inngest/realtime",
        "Pub/Sub",
        "Background Functions",
        "Theme System",
      ],
      impact: [
        {
          metric: "2",
          label: "Inngest functions: generateScreens (multi-screen) and regenerateFrame (single)",
        },
        {
          metric: "∞",
          label: "Generation fully decoupled from the request cycle via event-driven architecture",
        },
      ],
    },
    {
      number: "07",
      title: "Ownership-Enforced Server Action Layer",
      description:
        "All 32+ backend operations are implemented as Next.js Server Actions — no REST controllers. The centralized getOwnedProject() helper enforces ownership in every mutation's WHERE clause, making it impossible to distinguish 'project doesn't exist' from 'project belongs to another user' (404 masking prevents enumeration attacks). 9 project CRUD actions, 7 run tracking actions, 4 share actions, 5 subscription actions.",
      tags: [
        "Server Actions",
        "Clerk Auth",
        "Ownership Enforcement",
        "404 Masking",
        "Zero REST",
      ],
      impact: [
        { metric: "32+", label: "Server actions across 11 action files with ownership checks" },
        {
          metric: "0",
          label: "REST API controllers — all mutations via Server Actions with built-in CSRF protection",
        },
      ],
    },
    {
      number: "08",
      title: "Production Documentation & ADR Governance",
      description:
        "10 core architecture docs cover system overview, tech stack, agentic workflow, data model, API reference, frontend architecture, development guide, deployment, security, and testing strategy. 8 Architecture Decision Records document choices from LangGraph orchestration (ADR-001) to Inngest background jobs (ADR-008). 4 MCP specification docs detail tool catalog, phased implementation, and security model. Plus contributing guide, glossary, and interview preparation materials.",
      tags: [
        "10 Architecture Docs",
        "8 ADRs",
        "4 MCP Specs",
        "Contributing Guide",
        "Glossary",
      ],
      impact: [
        {
          metric: "22+",
          label: "Documentation artifacts maintained alongside the codebase",
        },
        {
          metric: "8",
          label: "Architecture Decision Records formalizing every major technical choice",
        },
      ],
    },
  ],

  process: [
    {
      phase: "Phase 01",
      title: "Foundation & Architecture Decisions",
      subtitle:
        "Framework selection, domain boundaries, and formalized ADRs",
      description:
        "Established Next.js 16 App Router architecture with route groups ((auth), (protected), (pages)), selected LangGraph for stateful agent orchestration (ADR-001), adopted Clerk for auth (ADR-002), chose Zustand for partitioned state management (ADR-003), and designed the recursive ContentItem rendering model (ADR-006).",
      keywords: [
        "Next.js 16",
        "App Router",
        "ADR-001 through ADR-006",
        "Route Groups",
        "System Design",
      ],
    },
    {
      phase: "Phase 02",
      title: "Data Layer & Access Control",
      subtitle:
        "Prisma models, ownership enforcement, and webhook-driven billing",
      description:
        "Implemented 6 Prisma models (User, Project, MobileProject, MobileFrame, PresentationGenerationRun, Subscription) with JSON slide storage. Built centralized getOwnedProject() ownership helper, soft-delete lifecycle, and Lemon Squeezy webhook integration (ADR-007) for subscription state sync.",
      keywords: [
        "Prisma 6",
        "PostgreSQL",
        "getOwnedProject()",
        "Soft Delete",
        "Lemon Squeezy Webhooks",
      ],
    },
    {
      phase: "Phase 03",
      title: "8-Agent Generation Pipeline",
      subtitle:
        "Layout-first AI flow from prompt to persisted slide JSON",
      description:
        "Built the LangGraph pipeline with 5 tuned LLM profiles, Zod validation at every stage, provider-abstracted image fetching with conditional loops (shouldFetchMoreImages), deterministic JSON compilation across 17+ layout families, and the wrapNode() pattern for automatic progress tracking and SSE streaming.",
      keywords: [
        "Gemini 2.5 Flash",
        "LangGraph StateGraph",
        "ADR-005 Layout-First",
        "Zod Validators",
        "wrapNode() Pattern",
      ],
    },
    {
      phase: "Phase 04",
      title: "Editor, Export & Mobile Design",
      subtitle:
        "Recursive editor, PDF pipeline, and Inngest-powered mobile generation",
      description:
        "Integrated the MasterRecursiveComponent editor with undo/redo, drag-and-drop (react-dnd), zoom/pan canvas (react-zoom-pan-pinch), and resizable panels. Built the PDF export pipeline (html2canvas → jsPDF). Launched the mobile design subsystem with Inngest v4 background functions, @inngest/realtime middleware (ADR-008), and theme-aware HTML frame generation.",
      keywords: [
        "MasterRecursiveComponent",
        "Undo/Redo Stacks",
        "html2canvas + jsPDF",
        "Inngest v4",
        "ADR-008",
      ],
    },
    {
      phase: "Phase 05",
      title: "MCP Server & Platform Expansion",
      subtitle:
        "Model Context Protocol integration for AI-agent interoperability",
      description:
        "Designed and implemented the MCP server with 10 tools and 3 resources across dual transport (stdio + Streamable HTTP). Built the plugin-based tool registry, 3-layer input validation, structured error responses with recovery suggestions, cursor-based pagination, and tiered rate limiting. Documented everything across 4 MCP specification documents with production readiness checklists.",
      keywords: [
        "MCP 2025-03-26",
        "@modelcontextprotocol/sdk",
        "Plugin Registry",
        "Dual Transport",
        "4 MCP Spec Docs",
      ],
    },
  ],

  processStats: {
    phases: "5",
    technologies: "45+",
    aiWorkflows:
      "8-agent LangGraph pipeline with conditional image-fetch loop and 5 tuned LLM profiles",
    nodeTypes:
      "Sequential edges + conditional branching (shouldFetchMoreImages) in state graph",
    documentationArtifacts:
      "22+ docs: 10 architecture, 8 ADRs, 4 MCP specs",
  },

  outcomes: [
    {
      metric: "8/8",
      label: "AI pipeline agents implemented with Zod-validated outputs and tuned LLM profiles",
    },
    {
      metric: "10+3",
      label: "MCP tools and resources exposed via dual transport to 7+ client types",
    },
    {
      metric: "32+",
      label: "Server actions across 11 files with centralized ownership enforcement",
    },
    {
      metric: "3",
      label: "Production subsystems: presentation engine, mobile design generator, MCP server",
    },
    {
      metric: "22+",
      label: "Documentation artifacts: architecture docs, ADRs, MCP specs, guides",
    },
    {
      metric: "8",
      label: "Architecture Decision Records formalizing major technical choices (ADR-001 through ADR-008)",
    },
    {
      metric: "17+",
      label: "Layout template families with dedicated content structures and CSS classes",
    },
    {
      metric: "6",
      label: "Zustand stores partitioned by concern with selective localStorage persistence",
    },
  ],

  footerCta: {
    heading: {
      text: "Want to explore the",
      highlight: "architecture, AI pipeline, and MCP integration",
      suffix: "in depth?",
    },
    primaryButton: {
      text: "Read Full Documentation",
      url: DOCS_BASE_URL,
    },
    secondaryButton: {
      text: "View Source Code",
      url: REPO_URL,
    },
    contactInfo: [
      {
        label: "Architecture Overview",
        value: "System context, request flows, and module dependency map",
        url: `${DOCS_BASE_URL}/01-architecture-overview.md`,
        hasIndicator: true,
      },
      {
        label: "Agentic Workflow",
        value: "8-agent pipeline deep dive with state schema and LLM configs",
        url: `${DOCS_BASE_URL}/03-agentic-workflow.md`,
        hasIndicator: true,
      },
      {
        label: "MCP Server Specs",
        value: "10 tools, 3 resources, dual transport, and security model",
        url: `${DOCS_BASE_URL}/mcp/01-specs.md`,
        hasIndicator: true,
      },
      {
        label: "API Reference",
        value: "32+ server actions, SSE streaming, Inngest functions, and webhooks",
        url: `${DOCS_BASE_URL}/05-api-reference.md`,
        hasIndicator: true,
      },
      {
        label: "Security Model",
        value: "Authn/authz, ownership enforcement, 404 masking, and MCP threat model",
        url: `${DOCS_BASE_URL}/09-security.md`,
        hasIndicator: true,
      },
    ],
  },

  footer: {
    description:
      "Verto AI is a production-focused AI presentation platform with multi-agent orchestration, MCP protocol integration, and every architectural decision documented for maintainability, security, and extensibility.",
    social: [
      {
        name: "GitHub",
        url: REPO_URL,
      },
      {
        name: "Live Demo",
        url: LIVE_URL,
      },
      {
        name: "Documentation",
        url: DOCS_BASE_URL,
      },
    ],
    quickLinks: [
      "Overview",
      "Architecture",
      "Features",
      "Process",
      "Outcomes",
      "Docs",
    ],
    projects: [
      "Presentation Engine (LangGraph)",
      "Mobile Design Generator (Inngest)",
      "MCP Server (Protocol Layer)",
    ],
    resources: [
      `${DOCS_BASE_URL}/01-architecture-overview.md`,
      `${DOCS_BASE_URL}/02-technology-stack.md`,
      `${DOCS_BASE_URL}/03-agentic-workflow.md`,
      `${DOCS_BASE_URL}/04-data-model.md`,
      `${DOCS_BASE_URL}/05-api-reference.md`,
      `${DOCS_BASE_URL}/06-frontend-architecture.md`,
      `${DOCS_BASE_URL}/09-security.md`,
      `${DOCS_BASE_URL}/10-testing-strategy.md`,
      `${DOCS_BASE_URL}/mcp/01-specs.md`,
      `${DOCS_BASE_URL}/mcp/03-architecture-security-tooling.md`,
    ],
    legal: ["Privacy", "Terms", "MIT License"],
    copyright: "2026 Aditya Deokar",
    rightsReserved: "All rights reserved.",
  },
};