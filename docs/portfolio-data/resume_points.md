# Resume Points — Verto AI

> All points below are grounded in the actual codebase and architecture docs. Nothing is inflated.

---

## Recommended Version (Best All-Around — Systems + AI + Full-Stack)

```latex
\textbf{Verto AI — Multi-Agent Presentation Engine}
\hfill
\href{https://github.com/aditya-deokar/verto.ai}{\faGithub} \quad
\href{https://verto.ai.aditya-deokar.me}{Live} \\
\textit{Next.js 16, React 19, LangGraph, Prisma 6, Zustand, Inngest, MCP SDK}\\
\textit{AI SaaS Platform with Multi-Agent Orchestration \& Model Context Protocol}

\begin{itemize}
    \item Architected an 8-agent \textbf{LangGraph} state machine that transforms a single user prompt into a complete slide deck, with layout-first content generation ensuring each agent's output is structurally aware of 17+ layout families — eliminating post-generation reformatting entirely.
    \item Designed and implemented a \textbf{Model Context Protocol (MCP)} server exposing 10 tools and 3 resources via dual transport (stdio + Streamable HTTP), enabling 7 external AI clients (Claude Desktop, Cursor, Windsurf) to programmatically manage presentations through JSON-RPC 2.0.
    \item Built a real-time generation streaming pipeline using \textbf{SSE with event history replay} (1,000-event buffer per run), database-persisted progress tracking via \texttt{PresentationGenerationRun} rows, and a centralized ownership-enforcement layer across 32+ server actions with 404-masking to prevent resource enumeration.
    \item Engineered a recursive slide editor rendering 15+ component types via \textbf{MasterRecursiveComponent} tree traversal, with undo/redo state stacks, 4 render modes (editor, present, share, export), and Inngest-powered background mobile UI generation with realtime pub/sub streaming.
\end{itemize}
```

---

## Alternate Versions

### Version B — Emphasizes AI/ML Systems Engineering

```latex
\begin{itemize}
    \item Designed a \textbf{LangGraph} state machine orchestrating 8 specialized AI agents — each with tuned temperature profiles (0.2 precise → 0.8 creative), independent Zod-validated output schemas, and exponential-backoff retry logic — reducing prompt-to-presentation generation to a single user input.
    \item Implemented a layout-first architecture (documented in \textbf{ADR-005}) where visual structure is selected before content writing, enabling the LLM to produce structurally-native output across 17+ layout families with zero post-processing reformatting steps.
    \item Built a \textbf{Model Context Protocol} server with a plugin-based tool registry, 3-layer input validation (Zod → semantic → business rules), and structured error responses with recovery suggestions — exposing the platform as a programmable API to 7 MCP-compatible AI clients.
    \item Developed a database-persisted generation progress system with SSE streaming (6 event types, 1,000-event replay buffer), enabling reconnection-resilient real-time feedback across devices and page refreshes.
\end{itemize}
```

### Version C — Emphasizes Full-Stack & System Design

```latex
\begin{itemize}
    \item Architected a production \textbf{Next.js 16} SaaS platform spanning 3 subsystems — an 8-agent LangGraph presentation pipeline, Inngest-powered mobile design generator with realtime pub/sub, and a Model Context Protocol server — governed by 8 Architecture Decision Records.
    \item Implemented a zero-REST backend with \textbf{32+ server actions}, centralized ownership enforcement via \texttt{getOwnedProject()} with 404-masking against enumeration attacks, and webhook-driven billing integration with Lemon Squeezy for subscription lifecycle management.
    \item Built a recursive content rendering engine (\textbf{MasterRecursiveComponent}) that walks a ContentItem tree to render 15+ component types across 4 contexts (editor, present, share, PDF export), backed by 6 Zustand stores with undo/redo stacks and selective localStorage persistence.
    \item Engineered a dual-transport \textbf{MCP server} (stdio for IDE integrations + Streamable HTTP for production agents) with cursor-based pagination, tiered rate limiting, and idempotent operations — documented across 4 MCP specification docs and 22+ architecture artifacts.
\end{itemize}
```

### Version D — Concise 3-Bullet Version (if space is tight)

```latex
\begin{itemize}
    \item Architected an 8-agent \textbf{LangGraph} pipeline with layout-first content generation, 5 tuned LLM profiles, and Zod-validated outputs — transforming a single prompt into structured slide decks across 17+ layout families with zero post-generation reformatting.
    \item Built a \textbf{Model Context Protocol (MCP)} server exposing 10 tools via dual transport to 7 AI clients (Claude Desktop, Cursor, Windsurf), alongside 32+ ownership-enforced server actions, SSE streaming with 1K-event replay, and Inngest background processing with realtime pub/sub.
    \item Engineered a recursive slide editor with 15+ component types, undo/redo stacks, 4 render modes, and a full security layer with 404-masking — documented across 8 ADRs and 22+ architecture artifacts with production deployment checklists.
\end{itemize}
```

---

## Why These Points Work at a Senior Level

| Signal | Where it shows |
|--------|---------------|
| **Architectural ownership** | "Architected", "Designed", state machines, ADRs, subsystem decomposition |
| **Quantified impact** | 8 agents, 17+ layouts, 32+ server actions, 7 MCP clients, 22+ docs |
| **Design trade-off awareness** | Layout-first generation, 404-masking, dual transport, temperature tuning |
| **Production maturity** | SSE reconnection resilience, ownership enforcement, rate limiting, webhook billing |
| **Breadth of systems** | AI pipeline + MCP protocol + real-time streaming + recursive rendering + background jobs |
| **Documentation discipline** | 8 ADRs, 22+ architecture artifacts — signals staff-level engineering rigor |

> [!TIP]
> Use **Version A** (Recommended) for most applications. Switch to **Version B** if applying for AI/ML-focused roles, **Version C** for platform/infrastructure roles, or **Version D** when space is limited.
