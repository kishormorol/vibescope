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
Radial graph of every technology used, color-coded by category (framework, styling, state management, etc.), with "why it was chosen" explanations. Dependencies show the exact version declared in the project and **Docs**, **npm/PyPI**, and **Source** links pulled from the real package registry.

### 3. File Explorer + Code Anatomy
File tree sidebar with syntax-highlighted source code (Shiki), inline concept annotations, and difficulty ratings. Click any file to see what it does, what concepts it uses, and how it fits into the architecture.

### 4. Concept Graph
Knowledge prerequisite graph showing how concepts relate — Components → Props → State → Hooks. Click any node to see explanations and links to documentation.

### 5. Decision Log
Architecture decision cards: "Why Zustand over Redux?", "Why Tailwind over CSS Modules?" — each with the chosen option, alternatives considered, and reasoning.

### 6. Learning Path
Interactive lesson timeline from beginner to advanced. Track your progress, filter by difficulty, click concept tags to jump to the knowledge graph, and work through the codebase at your own pace. Each lesson links to learning resources that are checked before they're shown, plus version-specific docs for the technologies it covers.

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
2. Click **Analyze** and enter your [Anthropic API key](https://console.anthropic.com/settings/keys)
3. Progress streams in real time — a full analysis usually takes 1–4 minutes
4. Explore all 6 views of your codebase. Results are cached in your browser for 7 days.

Any language works, but **JavaScript/TypeScript and Python** projects get the richest results — their dependencies are read from the manifest and linked to real package data:

| Ecosystem | Manifests read (repo root or one folder down) |
|---|---|
| JavaScript / TypeScript | `package.json` |
| Python | `pyproject.toml` (PEP 621, Poetry, uv/PDM dependency groups), `requirements*.txt`, `requirements/*.txt`, `Pipfile` |

Analysis uses Claude Opus 5.5 on your key — roughly $0.20–0.50 per repo depending on size. Up to 50 of the most important files are analyzed.

> Your API key is held in browser memory and passed through the VibeScope server only to make the Claude request for your analysis. It is never stored or logged.

### Self-Hosting

Deploy to Vercel (or any Node host) with no required configuration. Optionally set:

| Variable | Purpose |
|---|---|
| `GITHUB_TOKEN` | A GitHub token (no scopes needed) to raise the GitHub API limit from 60 to 5,000 requests/hour. Recommended for public deployments — without it, all visitors share the 60/hour limit. |

Analyses can take a few minutes, so the API route sets `maxDuration = 300`.

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
| LLM | Claude Opus 5.5 via Anthropic SDK (streaming) |
| Package data | npm registry + PyPI JSON API |
| Manifest parsing | smol-toml |
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
│   ├── analyzer/
│   │   ├── repo-loader.ts     # GitHub file loading + prioritization
│   │   ├── dependency-parser.ts # npm + Python manifest parsing
│   │   ├── file-scanner.ts    # Language and line stats
│   │   └── resources.ts       # npm/PyPI lookup + link verification
│   └── llm/                   # Claude API + prompt templates
└── public/demo/               # Pre-computed demo data
```

---

## How It Works

1. **Repo Loading** — Fetches up to 50 of the most important files from a public GitHub repo, prioritizing manifests, configs, and entry points (and skipping lock files, build output, virtualenvs, and binaries)
2. **Dependency Parsing** — Reads npm and Python manifests and categorizes each dependency
3. **Registry Lookup** — In parallel with the LLM call, looks up every dependency on npm or PyPI for its real homepage, docs, and source repository
4. **LLM Analysis** — Streams the code to Claude with a structured prompt to generate:
   - File summaries, difficulty ratings, and concept annotations
   - Technology descriptions and "why chosen" reasoning
   - Pipeline stage breakdown
   - Concept prerequisite graph
   - Architecture decisions with alternatives
   - Ordered learning path with estimated times
5. **Link Verification** — Replaces model-guessed versions and doc links with registry data, then checks every remaining link (docs, concept references, code annotations, lesson resources, YouTube videos). Definitely-dead links (404, unknown host, missing video) are repaired with a verified fallback or dropped
6. **Streaming** — Progress streams back via Server-Sent Events so you see each step in real time
7. **Caching** — Analysis results are cached in IndexedDB (7-day TTL) so repeat visits are instant

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

- Support for more ecosystems (Rust `Cargo.toml`, Go `go.mod`, Java/Kotlin) — add a parser in `lib/analyzer/dependency-parser.ts` and a registry lookup in `lib/analyzer/resources.ts`
- Resolve exact versions from lock files
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
