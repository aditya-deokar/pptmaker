function baseStyles(): string {
  return `
    :root {
      color-scheme: light dark;
      --bg: #fbfbfc;
      --fg: #18181b;
      --muted: #6b7280;
      --line: #d7dce2;
      --accent: #0f766e;
      --accent-soft: #ccfbf1;
      --warn: #b45309;
      --surface: #ffffff;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0b0c0f;
        --fg: #f4f4f5;
        --muted: #a1a1aa;
        --line: #2f333a;
        --accent: #5eead4;
        --accent-soft: #123532;
        --warn: #fbbf24;
        --surface: #111318;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-width: 260px;
      background: var(--bg);
      color: var(--fg);
      font-size: 14px;
      line-height: 1.45;
    }
    main {
      width: 100%;
      min-height: 180px;
      padding: 18px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 18px;
      line-height: 1.25;
      letter-spacing: 0;
    }
    .muted { color: var(--muted); }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-top: 1px solid var(--line);
      padding: 10px 0;
    }
    .row:first-of-type { border-top: 0; }
    .label { color: var(--muted); }
    .value { font-weight: 650; text-align: right; overflow-wrap: anywhere; }
    .bar {
      height: 8px;
      overflow: hidden;
      border-radius: 999px;
      background: color-mix(in srgb, var(--line) 70%, transparent);
      margin: 14px 0 6px;
    }
    .fill {
      width: var(--progress, 0%);
      height: 100%;
      background: var(--accent);
      transition: width 180ms ease;
    }
    .slides {
      display: grid;
      gap: 8px;
      margin-top: 12px;
    }
    .slide {
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 10px;
      background: color-mix(in srgb, var(--surface) 88%, var(--accent-soft));
    }
    .slide-title {
      font-weight: 650;
      overflow-wrap: anywhere;
    }
    .status {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 3px 8px;
      background: var(--accent-soft);
      color: var(--fg);
      font-size: 12px;
      font-weight: 650;
    }
    a {
      color: var(--accent);
      font-weight: 650;
      text-decoration: none;
    }
  `;
}

function sharedScript(): string {
  return `
    function pickPayload() {
      return window.__VERTO_MCP_PAYLOAD__ || {};
    }

    function readJsonText(value) {
      if (!value || typeof value !== "object") return null;
      const content = Array.isArray(value.content) ? value.content : [];
      const textBlock = content.find((item) => item && item.type === "text" && typeof item.text === "string");
      if (!textBlock) return null;
      try { return JSON.parse(textBlock.text); } catch { return null; }
    }

    function setText(id, value) {
      const element = document.getElementById(id);
      if (element) element.textContent = value == null || value === "" ? "Not available" : String(value);
    }

    function setLink(id, href) {
      const element = document.getElementById(id);
      if (!element) return;
      if (!href) {
        element.removeAttribute("href");
        element.textContent = "Not available";
        return;
      }
      element.href = href;
      element.textContent = "Open in Verto";
    }

    function normalizePayload(raw) {
      return readJsonText(raw) || raw || {};
    }

    window.addEventListener("message", (event) => {
      const payload = event.data && (event.data.result || event.data.payload || event.data);
      if (payload && typeof payload === "object") {
        window.__VERTO_MCP_PAYLOAD__ = normalizePayload(payload);
        window.renderVertoWidget(window.__VERTO_MCP_PAYLOAD__);
      }
    });
  `;
}

export function getGenerationProgressWidgetHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Verto generation progress</title>
  <style>${baseStyles()}</style>
</head>
<body>
  <main>
    <h1 id="title">Generation progress</h1>
    <div class="row"><span class="label">Status</span><span class="status" id="status">Waiting</span></div>
    <div class="row"><span class="label">Step</span><span class="value" id="step">Not available</span></div>
    <div class="bar" aria-hidden="true"><div class="fill" id="fill"></div></div>
    <div class="muted" id="progress-text">0% complete</div>
    <div class="row"><span class="label">Presentation</span><span class="value" id="presentation">Not available</span></div>
    <div class="row"><span class="label">Run ID</span><span class="value" id="run">Not available</span></div>
  </main>
  <script>
    ${sharedScript()}
    window.renderVertoWidget = function(payload) {
      const data = payload && payload.data ? payload.data : payload;
      const status = data.generation_status || data;
      const run = status.generation_run || data.generation_run || data.generation || {};
      const progress = Math.max(0, Math.min(100, Number(run.progress || data.progress || 0)));
      document.documentElement.style.setProperty("--progress", progress + "%");
      setText("title", run.topic || data.topic || "Generation progress");
      setText("status", status.status || data.status || run.status || "Waiting");
      setText("step", run.current_step_name || run.currentStepName || data.current_step_name);
      setText("progress-text", progress + "% complete");
      setText("presentation", status.presentation_id || data.presentation_id || run.project_id || run.projectId);
      setText("run", status.generation_run_id || data.generation_run_id || run.id);
    };
    window.renderVertoWidget(pickPayload());
  </script>
</body>
</html>`;
}

export function getDeckPreviewWidgetHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Verto deck preview</title>
  <style>${baseStyles()}</style>
</head>
<body>
  <main>
    <h1 id="title">Deck preview</h1>
    <div class="row"><span class="label">Theme</span><span class="value" id="theme">Not available</span></div>
    <div class="row"><span class="label">Slides</span><span class="value" id="slide-count">0</span></div>
    <div class="row"><span class="label">Published</span><span class="value" id="published">No</span></div>
    <div class="row"><span class="label">Verto</span><span class="value"><a id="open-link">Not available</a></span></div>
    <section class="slides" id="slides"></section>
  </main>
  <script>
    ${sharedScript()}
    function getPresentation(data) {
      if (!data) return {};
      if (data.data && data.data.presentation) return data.data.presentation;
      if (data.presentation) return data.presentation;
      return data.data || data;
    }
    window.renderVertoWidget = function(payload) {
      const presentation = getPresentation(payload);
      const slides = Array.isArray(presentation.slides) ? presentation.slides : [];
      setText("title", presentation.title || "Deck preview");
      setText("theme", presentation.theme_name || presentation.themeName);
      setText("slide-count", presentation.slide_count || slides.length || 0);
      setText("published", presentation.is_published || presentation.isPublished ? "Yes" : "No");
      setLink("open-link", presentation.open_url || presentation.verto_url || presentation.url);
      const container = document.getElementById("slides");
      container.innerHTML = "";
      slides.slice(0, 6).forEach(function(slide, index) {
        const item = document.createElement("article");
        item.className = "slide";
        const title = document.createElement("div");
        title.className = "slide-title";
        title.textContent = slide.slideName || slide.title || "Slide " + (index + 1);
        item.appendChild(title);
        container.appendChild(item);
      });
      if (slides.length === 0) {
        const item = document.createElement("article");
        item.className = "slide";
        item.textContent = "No slide preview available.";
        container.appendChild(item);
      }
    };
    window.renderVertoWidget(pickPayload());
  </script>
</body>
</html>`;
}
