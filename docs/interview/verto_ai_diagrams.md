# 🏗️ Verto AI — Architecture Diagrams (Mermaid)

> All diagrams for the YouTube demo video. Copy any of these into slides or render them directly.

---

## 1. Full System Architecture

```mermaid
graph TB
    subgraph Clients
        Browser["👤 Browser User"]
        Claude["🤖 Claude / Cursor"]
        ChatGPT["🤖 ChatGPT / MCP Client"]
    end

    subgraph VertoApp["Verto AI (Next.js 16)"]
        Landing["Landing Page"]
        Dashboard["Dashboard"]
        Editor["Slide Editor"]
        MobileUI["Mobile Design UI"]
        Settings["Settings & API Keys"]
        SharePage["Public Share Pages"]
        DocsPage["MCP Docs Page"]
    end

    subgraph Backend["Backend Layer"]
        ServerActions["Server Actions"]
        APIRoutes["API Routes"]
        StreamAPI["Streaming Generation API"]
        MCPEndpoint["/mcp Endpoint"]
    end

    subgraph AIEngine["AI Engine"]
        LangGraph["LangGraph Pipeline\n(8 Agents)"]
        AIRuntime["AI Runtime\n(BYOK Router)"]
        ImageSearch["Image Search\nProviders"]
    end

    subgraph Infra["Infrastructure"]
        Clerk["🔐 Clerk Auth"]
        Prisma["Prisma ORM"]
        DB[("🗄️ PostgreSQL")]
        Inngest["⚡ Inngest\n(Background Jobs)"]
        LemonSqueezy["💳 Lemon Squeezy\n(Billing)"]
    end

    subgraph Providers["AI Providers"]
        Google["Google Gemini"]
        OpenAI["OpenAI"]
        Groq["Groq"]
    end

    Browser --> Landing & Dashboard & Editor & MobileUI & Settings
    Claude --> MCPEndpoint
    ChatGPT --> MCPEndpoint

    Dashboard --> ServerActions
    Editor --> ServerActions
    StreamAPI --> LangGraph
    ServerActions --> LangGraph
    ServerActions --> Prisma
    MCPEndpoint --> ServerActions
    MCPEndpoint --> LangGraph
    MobileUI --> Inngest

    LangGraph --> AIRuntime
    LangGraph --> ImageSearch
    LangGraph --> Prisma
    Inngest --> AIRuntime
    Inngest --> Prisma

    AIRuntime --> Google & OpenAI & Groq

    Prisma --> DB
    VertoApp --> Clerk
    VertoApp --> LemonSqueezy
    SharePage --> Prisma
```

---

## 2. 8-Agent Generation Pipeline (Detailed)

```mermaid
flowchart LR
    Input["🎯 User Input\n(topic + context + theme)"]

    subgraph Pipeline["LangGraph State Machine"]
        A["1️⃣ Project\nInitializer"]
        B["2️⃣ Outline\nGenerator"]
        C["3️⃣ Layout\nSelector"]
        D["4️⃣ Content\nWriter"]
        E["5️⃣ Image Query\nGenerator"]
        F["6️⃣ Image\nFetcher"]
        G["7️⃣ JSON\nCompiler"]
        H["8️⃣ Database\nPersister"]
    end

    Output["✅ Complete\nPresentation"]

    Input --> A
    A -->|"projectId"| B
    B -->|"outlines[]"| C
    C -->|"layoutType\nper slide"| D
    D -->|"structured content\nper slide"| E
    E -->|"imageQuery\nper slide"| F
    F -->|"imageUrl\nper slide"| G
    F -.->|"🔄 loop if\nmore needed"| F
    G -->|"Slide[] JSON"| H
    H --> Output

    style A fill:#6366f1,color:#fff,stroke:#4f46e5
    style B fill:#7c3aed,color:#fff,stroke:#6d28d9
    style C fill:#9333ea,color:#fff,stroke:#7e22ce
    style D fill:#a855f7,color:#fff,stroke:#9333ea
    style E fill:#c084fc,color:#fff,stroke:#a855f7
    style F fill:#d8b4fe,color:#000,stroke:#c084fc
    style G fill:#e9d5ff,color:#000,stroke:#d8b4fe
    style H fill:#f3e8ff,color:#000,stroke:#e9d5ff
```

---

## 3. MCP Request Flow (Sequence Diagram)

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Settings as ⚙️ Settings UI
    participant DB as 🗄️ PostgreSQL
    participant Client as 🤖 MCP Client
    participant MCP as /mcp Endpoint
    participant Auth as 🔐 Auth Layer
    participant Tools as 🔧 Presentation Tools

    Note over User,Settings: Step 1: Generate API Key
    User->>Settings: Create MCP API key
    Settings->>DB: Store hashed key (vk_live_...)

    Note over Client,MCP: Step 2: Connect & Initialize
    Client->>MCP: POST /mcp (initialize + Bearer vk_live_...)
    MCP->>Auth: Validate bearer token
    Auth->>DB: Look up hashed key
    Auth-->>MCP: ✅ userId resolved
    MCP-->>Client: Session ID + server capabilities

    Note over Client,Tools: Step 3: Use Tools
    Client->>MCP: POST /mcp (tools/list)
    MCP-->>Client: 11 tools + 4 resources

    Client->>MCP: POST /mcp (presentation_generate)
    MCP->>Tools: Run generation pipeline
    Tools->>DB: Create project + slides
    Tools-->>MCP: Generation started (runId)
    MCP-->>Client: RUNNING status + runId

    Client->>MCP: POST /mcp (presentation_generation_status)
    MCP->>DB: Check run status
    MCP-->>Client: COMPLETED + presentation data
```

---

## 4. BYOK Runtime Routing

```mermaid
flowchart TD
    Request["🎯 Generation Request"]
    Check["📋 Business Rule Check"]
    
    Request --> Check
    
    Check -->|"Free tier\nstill active"| FreePath
    Check -->|"BYOK\neligible"| BYOKPath
    Check -->|"Over limit\nno keys"| Blocked["🚫 Usage Limit\nReached"]

    subgraph FreePath["Free Tier Path"]
        HostedRuntime["Use Hosted\nDefault Runtime\n(Gemini Flash)"]
    end

    subgraph BYOKPath["BYOK Path"]
        ResolvePref["Resolve User\nPreferences"]
        ResolvePref --> GoogleProv["☁️ Google\nGemini"]
        ResolvePref --> OpenAIProv["🟢 OpenAI\nGPT"]
        ResolvePref --> GroqProv["⚡ Groq\nLlama"]
        ResolvePref --> Fallback["🔄 Safe\nFallback"]
    end

    style FreePath fill:#f0fdf4,stroke:#16a34a
    style BYOKPath fill:#eff6ff,stroke:#2563eb
    style Blocked fill:#fef2f2,stroke:#dc2626
```

---

## 5. MCP App UI Widget Flow

```mermaid
flowchart LR
    subgraph Client["MCP Client (Claude/ChatGPT)"]
        UserPrompt["User prompt"]
        WidgetRender["🖼️ Sandboxed iframe Component\n(Apple-grade UI)"]
        Bridge["MCP Apps Bridge\n(postMessage)"]
    end

    subgraph Server["Verto MCP Server"]
        ToolCall["MCP Tool Call"]
        WidgetBuilder["Widget Data Mapper\n(structuredContent)"]
        HTMLGenerator["esbuild HTML Generator\n(text/html;profile=mcp-app)"]
    end

    subgraph Widgets["Premium UI Widgets"]
        W1["📋 Presentation List Card"]
        W2["🎴 Deck Preview (w/ filmstrip)"]
        W3["📊 Generation Progress Ring"]
        W4["✅ Publish / Action Card"]
        W5["🎨 Theme Studio"]
    end

    UserPrompt -->|"tool call"| ToolCall
    ToolCall --> WidgetBuilder
    WidgetBuilder -->|"structured data + text fallback"| HTMLGenerator
    HTMLGenerator -->|"text/html\nprofile=mcp-app"| WidgetRender
    WidgetRender <-->|"UI Actions (safe)"| Bridge
    Bridge -->|"tools/call"| ToolCall

    HTMLGenerator -.-> W1 & W2 & W3 & W4 & W5

    style W1 fill:#dbeafe,color:#000
    style W2 fill:#fce7f3,color:#000
    style W3 fill:#d1fae5,color:#000
    style W4 fill:#fef3c7,color:#000
    style W5 fill:#e0e7ff,color:#000
```

---

## 6. Data Model Overview

```mermaid
erDiagram
    User ||--o{ Project : owns
    User ||--o{ MobileProject : owns
    User ||--o{ UserAiKey : has
    User ||--o{ McpApiKey : has
    User ||--o| Subscription : has
    User ||--o{ TemplateFavorite : favorites

    Project ||--o{ Slide : contains
    Project ||--o{ PresentationGenerationRun : tracks

    PresentationTemplate ||--o{ TemplateFavorite : receives

    User {
        string clerkId
        string email
        string name
        boolean subscription
        int usageCount
    }

    Project {
        string title
        string themeName
        boolean isPublished
        boolean isDeleted
        enum ProjectType
    }

    Slide {
        int slideOrder
        json content
        string className
    }

    McpApiKey {
        string keyHash
        string keyPrefix
        datetime lastUsedAt
    }

    UserAiKey {
        enum provider
        string encryptedKey
        string preferredModel
    }

    Subscription {
        string lemonSqueezyId
        enum status
        datetime currentPeriodEnd
    }
```

---

## 7. Deployment Architecture

```mermaid
graph TB
    subgraph Edge["Edge / CDN"]
        Vercel["▲ Vercel\n(Next.js 16 Hosting)"]
    end

    subgraph Services["External Services"]
        ClerkCloud["🔐 Clerk Cloud"]
        InngestCloud["⚡ Inngest Cloud"]
        LemonCloud["💳 Lemon Squeezy"]
    end

    subgraph Database["Database"]
        NeonDB["🐘 PostgreSQL\n(Neon / Supabase)"]
    end

    subgraph AI["AI Providers"]
        GoogleAI["Google AI"]
        OpenAIAPI["OpenAI API"]
        GroqAPI["Groq API"]
    end

    Vercel --> ClerkCloud
    Vercel --> InngestCloud
    Vercel --> LemonCloud
    Vercel --> NeonDB
    Vercel --> GoogleAI & OpenAIAPI & GroqAPI

    style Edge fill:#000,color:#fff
    style Services fill:#f8fafc,stroke:#94a3b8
    style Database fill:#eff6ff,stroke:#3b82f6
    style AI fill:#f0fdf4,stroke:#16a34a
```
