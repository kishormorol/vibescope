# VibeScope

**See how your code was built.** Interactive visualization of the entire software engineering pipeline — technologies, concepts, architecture decisions, and learning paths.

> "Vibe coding" lets anyone build full apps with AI — but what if you actually want to *understand* what was built? VibeScope takes any AI-generated (or human-written) codebase and creates an explorable visual breakdown of the entire SWE pipeline.

**[Live Demo](https://vibescope-one.vercel.app)** — no setup needed, click "Try Demo" to explore a real 8K-line codebase.

---

## What It Does

VibeScope analyzes a codebase and generates **6 interactive views**:

### 1. Pipeline View
Animated flow diagram showing how the project was built stage-by-stage — from setup and data modeling through API design, UI, visualization, and polish.

### 2. Tech Map
Radial graph of every technology used, color-coded by category (framework, styling, state management, etc.), with version info, "why it was chosen" explanations, and links to official docs.

### 3. File Explorer + Code Anatomy
File tree sidebar with syntax-highlighted source code (Shiki), inline concept annotations, and difficulty ratings. Click any file to see what it does, what concepts it uses, and how it fits into the architecture.

### 4. Concept Graph
Knowledge prerequisite graph showing how concepts relate — Components → Props → State → Hooks. Click any node to see explanations and links to documentation.

### 5. Decision Log
Architecture decision cards: "Why Zustand over Redux?", "Why Tailwind over CSS Modules?" — each with the chosen option, alternatives considered, and reasoning.

### 6. Learning Path
Interactive lesson timeline from beginner to advanced. Track your progress, filter by difficulty, click concept tags to jump to the knowledge graph, and work through the codebase at your own pace.

---

## Getting Started

### Try the Demo (No Setup)

1. Visit **[vibescope-one.vercel.app](https://vibescope-one.vercel.app)**
2. Click **"Try Demo"**
3. Explore all 6 views of a real codebase (ThinkDiff — an 8K-line comparative LLM reasoning visualizer)

### Run Locally

```bash
git clone https://github.com/kishormorol/vibescope.git
cd vibescope
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Analyze Your Own Codebase

1. Enter a **public GitHub repo URL** (e.g., `https://github.com/user/repo`)
2. Click the **key icon** to enter your Anthropic API key (uses Claude for analysis)
3. Click **Analyze** — progress streams in real-time via SSE
4. Explore all 6 views of your codebase

> Your API key is stored only in your browser's memory and never sent to our servers. Analysis calls go directly from your browser to the Anthropic API.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Visualization | React Flow (@xyflow/react) |
| State | Zustand |
| Animation | Framer Motion |
| Code Highlighting | Shiki |
| LLM | Claude (Anthropic SDK) |
| Caching | IndexedDB (idb-keyval) |
| Deployment | Vercel |

---

## Project Structure

```
vibescope/
├── app/
│   ├── page.tsx               # Landing page
│   ├── analyze/page.tsx       # Dashboard with 6 tabs
│   └── api/analyze/route.ts   # SSE streaming analysis endpoint
├── components/
│   ├── pipeline-view.tsx      # React Flow: build journey
│   ├── tech-map.tsx           # React Flow: technology graph
│   ├── file-explorer.tsx      # File tree + detail panel
│   ├── file-anatomy.tsx       # Shiki code + annotations
│   ├── concept-graph.tsx      # React Flow: knowledge graph
│   ├── decision-log.tsx       # Architecture decision cards
│   ├── learning-path.tsx      # Interactive lesson timeline
│   └── ui/                    # shadcn components
├── lib/
│   ├── store.ts               # Zustand state
│   ├── types.ts               # TypeScript interfaces
│   ├── cache.ts               # IndexedDB caching
│   ├── analyzer/              # GitHub loader, parsers
│   └── llm/                   # Claude API + prompt templates
└── public/demo/               # Pre-computed demo data
```

---

## How It Works

1. **Repo Loading** — Fetches files from a public GitHub repo via the GitHub API
2. **Dependency Parsing** — Extracts technologies from `package.json`, `requirements.txt`, etc.
3. **LLM Analysis** — Sends code to Claude with structured prompts to generate:
   - File summaries, difficulty ratings, and concept annotations
   - Technology descriptions and "why chosen" reasoning
   - Pipeline stage breakdown
   - Concept prerequisite graph
   - Architecture decisions with alternatives
   - Ordered learning path with estimated times
4. **Streaming** — Results stream back via Server-Sent Events so you see progress in real-time
5. **Caching** — Analysis results are cached in IndexedDB (7-day TTL) so repeat visits are instant

---

## Use Cases

- **Learning from AI-generated code** — Understand what your AI assistant actually built
- **Onboarding new developers** — Give teammates an interactive tour of the codebase
- **Code review prep** — See the architecture and decisions at a glance
- **Teaching** — Use the concept graph and learning path as a curriculum for students
- **Portfolio showcase** — Generate a visual breakdown of your projects

---

## Contributing

Contributions welcome! Some ideas:

- Support for more languages and ecosystems (Python, Rust, Go)
- Export analysis as shareable JSON or PDF
- Collaborative annotations
- Custom themes

```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run lint   # Run linter
```

---

## License

MIT

---

Built for CHI 2027 poster track. Created by [Kishor Morol](https://github.com/kishormorol).
