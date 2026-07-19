# 🎬 Verto AI — YouTube Demo Video Script

> **Duration**: ~6:30–7:00 minutes  
> **Framework**: PACT (Problem → Architecture → Live Demo → Technical Decisions → Challenges & Learnings → Future Improvements)  
> **Tone**: Casual, conversational, no jargon

---

## 🎤 INTRO — Hook (0:00–0:30)

**[Screen: Landing page of Verto AI]**

> Hey everyone! So I built this app called **Verto AI** — and the idea is pretty simple.

> You type in a topic, and it gives you a fully designed presentation — slides, content, images, everything — in under a minute.

> But here's what makes it different — it's not just a UI app. It also works as an **MCP server**, which means AI tools like Claude, Cursor, and ChatGPT can directly create and manage your presentations through code.

> Let me walk you through the whole thing.

---

## 🔴 PROBLEM (0:30–1:15)

**[Slide: "The Problem"]**

> So here's the problem I was trying to solve.

> Making presentations is boring. Like genuinely painful. You open PowerPoint, you stare at a blank slide, you spend an hour just picking fonts and colors.

> And yeah, there are AI tools out there that generate slides — but most of them just dump text onto slides. No structure, no layout thinking, no visual awareness.

> Plus, none of them work as a **backend for AI agents**. You can't tell Claude "hey, make me a deck about React hooks and publish it" — there's no tool for that.

> So I wanted to build something that:
> - **Actually understands slide layouts** before writing content
> - Gives you a **visual editor** to tweak things after generation
> - And exposes the whole presentation workflow as an **MCP server** that any AI client can use

> That's Verto AI.

---

## 🏗️ ARCHITECTURE (1:15–2:00)

**[Slide: "Architecture Overview" — show the System Map mermaid diagram]**

> Let me quickly walk through how the whole system is put together.

> At the core, it's a **Next.js 16** app using the App Router. The frontend is React 19 with Tailwind and shadcn/ui.

> For the database, I'm using **PostgreSQL with Prisma** as the ORM.

> Authentication is handled by **Clerk** — sign-up, login, session management, all taken care of.

> Now the interesting part — the **AI generation pipeline**. This is built with **LangGraph** and it has **8 specialized agents** that run one after another.

**[Slide: "8-Agent Pipeline" — show pipeline mermaid diagram]**

> Here's how it flows:
> 1. **Project Initializer** — creates the project record in the database
> 2. **Outline Generator** — breaks your topic into slide-level outlines
> 3. **Layout Selector** — picks the best visual layout for each slide BEFORE writing content
> 4. **Content Writer** — writes copy that actually fits the chosen layout
> 5. **Image Query Generator** — creates smart search queries for each slide
> 6. **Image Fetcher** — finds and attaches relevant images
> 7. **JSON Compiler** — assembles everything into the final slide JSON
> 8. **Database Persister** — saves it all to PostgreSQL

> The key insight here is that **layout comes before content** — so the AI writes text that actually fits the slide shape, not the other way around.

**[Slide: "MCP Architecture" — show MCP request flow diagram]**

> And then there's the **MCP layer**. The same app also runs an MCP server at `/mcp` — it uses **Streamable HTTP** transport with bearer token auth.

> AI clients like Claude or Cursor can connect, authenticate with an API key, and call tools to create, edit, publish, and manage presentations — all without touching the UI.

> There's also a **local stdio transport** if you want to run the MCP server from the repo directly.

---

## 🖥️ LIVE DEMO (2:00–4:30)

### Dashboard & Generation (2:00–2:45)

**[Screen recording: Dashboard]**

> Alright, let me show you the actual app.

> This is the dashboard — you can see all your presentations here, recent ones, favorites, everything nicely organized.

> Let me generate a new one. I'll type in "Introduction to System Design" and pick a theme.

**[Screen recording: Generation in progress with real-time updates]**

> You can see the progress updating in real-time — each agent reports what it's doing. Outline generated... layouts picked... content written... images found... and done!

> The whole thing took about 40 seconds.

### Visual Editor (2:45–3:15)

**[Screen recording: Slide editor]**

> Now I'm in the editor. You can see all the slides on the left, and the main slide view in the center.

> I can **click on any text element and edit it directly**. Change headings, body text, whatever I want.

> I can also **switch themes** — let me try a dark theme... and boom, the whole deck updates instantly.

> When I'm happy with it, I can **export it as a PDF** or **publish it** to get a shareable link.

### Templates & Sharing (3:15–3:30)

**[Screen recording: Templates page, share flow]**

> There's also a templates system — pre-built starting points organized by categories like Business, Education, Startup Pitch, and more.

> You can favorite templates, use them as a base, and even get AI enhancement on top of them.

> For sharing — one click to publish, and anyone with the link can view your presentation.

### Mobile Design Workspace (3:30–3:45)

**[Screen recording: Mobile design page]**

> There's also a separate **Mobile Design workspace** — this generates mobile UI screen concepts as HTML frames.

> It runs in the background using **Inngest jobs** because these can take longer than normal requests.

> You can regenerate individual screens if you don't like one.

### MCP Server Demo (3:45–4:00)

**[Screen recording: Settings → API Keys page]**

> Now the MCP part. In settings, you can generate an MCP API key — these are hashed and stored securely.

> The key starts with `vk_live_` and you use it as a Bearer token.
> We use **Streamable HTTP** since Verto is hosted on a public domain, making it easy to connect from Claude Desktop or Cursor without running any local Node.js processes. There's also a local stdio fallback for developers.

### MCP in Claude / Cursor (4:00–4:15)

**[Screen recording: Claude or Cursor using Verto MCP tools]**

> Here's where it gets cool. I've connected the Verto MCP server to Claude.

> I can say "list my presentations" and it calls the `presentation_list` tool.

> I can say "create a presentation about machine learning" and it actually generates one through the MCP pipeline.

> There are **11 tools** available — for creating, getting, listing, updating slides, changing themes, publishing, soft deleting, recovering, and generating presentations.

> And **4 read-only resources** — themes, templates, presentations context, and generation progress.

### MCP Apps / Premium UI (4:15–4:30)

**[Screen recording: MCP App UI widgets rendering in ChatGPT/Claude]**

> But I didn't want it to just return raw JSON text. I wanted it to feel like a real "Apple-grade" app inside ChatGPT and Claude. So I built **MCP App UI widgets**.

> When the AI returns data, the server generates a sandboxed iframe component with a specific `text/html;profile=mcp-app` profile. 
> So instead of JSON, you see a beautiful **Deck Preview** with slide filmstrips, a **Generation Progress Ring** with a timeline, or a **Publish Card** with share links.

> You can even click safe action buttons inside these widgets that talk back to the MCP server via the `postMessage` bridge, so you don't even need to write another prompt. It's a completely native UI experience inside the chat window.

---

## ⚙️ TECHNICAL DECISIONS (4:30–5:30)

**[Slide: "Key Technical Decisions"]**

> Let me talk about some of the technical decisions I made and why.

> **Why LangGraph instead of one big prompt?** — Because breaking the pipeline into 8 focused agents means each one does one thing well. The layout agent doesn't care about content. The content writer doesn't care about images. It's modular and easier to debug.

> **Why layout before content?** — This was a deliberate choice. Most AI slide tools write content first and then try to fit it into a layout. That's backwards. If you know the layout has a two-column split, you write content that fits two columns.

> **Why Streamable HTTP for MCP?** — Because the app is already hosted on a public domain. Users shouldn't need to clone the repo or install Node.js to use the MCP tools. Just add the URL and your API key, and you're connected.

> **How does the premium MCP UI work?** — I used esbuild to compile lightweight, single-file vanilla TS widgets. They receive `structuredContent`, render beautiful UI cards, and use the MCP Apps bridge over `postMessage` for user interactions inside ChatGPT.

> **Why BYOK (Bring Your Own Key)?** — I wanted users to optionally use their own API keys from Google, OpenAI, or Groq. The app routes requests through the user's preferred provider when they have one set up, and falls back to the hosted runtime for free-tier users.

> **Why Inngest for mobile design?** — Mobile design generation produces raw HTML frames and takes longer. Inngest handles background jobs with retry logic, so it doesn't block the main request cycle.

> **Why Clerk for auth?** — It handles sign-up, login, and session management out of the box — including the webhook sync for user creation. One less thing to build from scratch.

---

## 🧗 CHALLENGES & LEARNINGS (5:30–6:30)

**[Slide: "Challenges & Learnings"]**

> Now let me be real about the challenges.

> **Getting MCP auth right was hard.** The MCP spec has evolved a lot, and making bearer-token auth work correctly with session-based Streamable HTTP took a lot of trial and error. Clients have to do the initialize handshake first before calling any tools — and different MCP clients handle this differently.

> **Structured JSON output from LLMs is tricky.** When you ask an LLM to output valid slide JSON, it doesn't always cooperate. I had to add validation, retry logic, and fallback compilers to handle edge cases where the model returns malformed JSON.

> **Keeping MCP and web app in sync.** Both the web UI and the MCP server modify the same data. Making sure they don't conflict, and that both paths go through the same business logic, required careful architecture.

> **Real-time progress updates.** Streaming generation progress from 8 different agents to the frontend in real-time — while also persisting state for the MCP status polling endpoint — was a fun engineering problem.

> **BYOK routing complexity.** Supporting three different AI providers with user-specific preferences, plus free-tier limits, plus MCP-sourced requests — the runtime routing logic got complex fast.

> **Biggest learning?** Don't try to do everything in one prompt. The multi-agent approach is more work upfront but way more maintainable and produces better results.

---

## 🚀 FUTURE IMPROVEMENTS (6:30–7:00)

**[Slide: "What's Next"]**

> For the future, here's what I'm planning:

> **Collaborative editing** — let multiple people edit the same deck in real time.

> **More MCP tools** — adding template-based generation, slide-level editing, and mobile design tools to the MCP surface.

> **Voice-to-presentation** — speak your idea and get a deck out of it.

> **Version history** — so you can go back to previous versions of your slides.

> **More AI providers** — adding Anthropic and other model providers to the BYOK system.

> **Smarter image generation** — using AI image generation instead of just stock image search.

---

## 🎬 OUTRO (7:00)

**[Screen: Landing page with links]**

> That's Verto AI — an AI-native presentation workspace with a full MCP backend.

> The live app is at **verto.ai.aditya-deokar.me** — you can try it right now.

> If you're into MCP, the server endpoint is live at `/mcp` — connect Claude or Cursor and start building decks from your terminal.

> Thanks for watching! Drop a comment if you have any questions. See you in the next one! ✌️

---

## 📊 Quick Feature Reference (for voiceover checklist)

| Feature | One-liner |
|---------|-----------|
| AI presentation generation | Type a topic, get a full deck in under a minute |
| 8-agent LangGraph pipeline | Eight specialized agents handle different steps from outline to final slides |
| Layout-first content writing | Layout is picked before content so text actually fits the slide design |
| Visual slide editor | Click and edit any element directly on the slide |
| Theme switching | Switch the entire deck's visual theme with one click |
| PDF export | Download your finished presentation as a polished PDF |
| Public sharing | Publish your deck and share it with a link |
| Template system | Pre-built templates across 11 categories with favorites |
| Mobile design workspace | Generate mobile UI concepts as HTML frames using background jobs |
| Real-time progress | Watch each agent report its progress live during generation |
| MCP server (Streamable HTTP) | 11 tools + 4 resources accessible over authenticated HTTP |
| MCP server (stdio) | Local MCP transport for dev workflows |
| MCP App UI widgets | Rich HTML widgets that render inside Claude/ChatGPT |
| MCP API key management | Generate, revoke, and manage hashed API keys from settings |
| BYOK runtime | Bring your own Google/OpenAI/Groq keys with model preferences |
| Subscription + billing | Lemon Squeezy integration with free-tier usage limits |
| Clerk authentication | Sign-up, login, and session management |
| Soft delete + recovery | Presentations can be soft-deleted and recovered |
