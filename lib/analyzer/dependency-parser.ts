// ═══════════════════════════════════════════════
// DEPENDENCY PARSER — Extract and categorize deps
// ═══════════════════════════════════════════════

import { parse as parseToml } from "smol-toml";
import type { TechCategory } from "@/lib/types";

export type Ecosystem = "npm" | "pypi";

export interface ParsedDependency {
  name: string;
  version: string;
  category: TechCategory;
  isDev: boolean;
  ecosystem: Ecosystem;
}

export interface DependencyInfo {
  dependencies: ParsedDependency[];
}

// Map known package names to tech categories
const CATEGORY_MAP: Record<string, TechCategory> = {
  // Frameworks
  next: "framework",
  react: "framework",
  "react-dom": "framework",
  vue: "framework",
  nuxt: "framework",
  svelte: "framework",
  "@sveltejs/kit": "framework",
  angular: "framework",
  "@angular/core": "framework",
  express: "framework",
  fastify: "framework",
  hono: "framework",
  remix: "framework",
  "@remix-run/react": "framework",
  gatsby: "framework",
  astro: "framework",

  // State management
  zustand: "state",
  redux: "state",
  "@reduxjs/toolkit": "state",
  jotai: "state",
  recoil: "state",
  mobx: "state",
  valtio: "state",
  "react-query": "state",
  "@tanstack/react-query": "state",
  swr: "state",
  pinia: "state",

  // Styling
  tailwindcss: "styling",
  "@tailwindcss/postcss": "styling",
  "tw-animate-css": "styling",
  "styled-components": "styling",
  emotion: "styling",
  "@emotion/react": "styling",
  "@emotion/styled": "styling",
  sass: "styling",
  "postcss": "styling",
  "@base-ui/react": "styling",
  shadcn: "styling",
  "class-variance-authority": "styling",
  "clsx": "styling",
  cn: "styling",

  // Visualization / Animation
  "framer-motion": "animation",
  "motion": "animation",
  gsap: "animation",
  "react-spring": "animation",
  d3: "visualization",
  "chart.js": "visualization",
  recharts: "visualization",
  "@xyflow/react": "visualization",
  "react-flow": "visualization",
  "three": "visualization",
  "@react-three/fiber": "visualization",
  shiki: "visualization",

  // API / Data
  axios: "api",
  ky: "api",
  "node-fetch": "api",
  graphql: "api",
  "@apollo/client": "api",
  trpc: "api",
  "@trpc/client": "api",
  "@trpc/server": "api",
  "@anthropic-ai/sdk": "api",
  openai: "api",

  // Database
  prisma: "database",
  "@prisma/client": "database",
  drizzle: "database",
  "drizzle-orm": "database",
  mongoose: "database",
  typeorm: "database",
  knex: "database",
  "better-sqlite3": "database",
  pg: "database",
  redis: "database",
  "idb-keyval": "database",

  // Testing
  jest: "testing",
  vitest: "testing",
  "@testing-library/react": "testing",
  cypress: "testing",
  playwright: "testing",
  "@playwright/test": "testing",
  mocha: "testing",

  // Tooling
  typescript: "tooling",
  eslint: "tooling",
  prettier: "tooling",
  webpack: "tooling",
  vite: "tooling",
  turbo: "tooling",
  esbuild: "tooling",
  "@types/node": "tooling",
  "@types/react": "tooling",

  // Deployment
  vercel: "deployment",
  "wrangler": "deployment",
  "@cloudflare/workers-types": "deployment",
  serverless: "deployment",
};

// Python packages (keys are PEP 503-normalized names)
const PYTHON_CATEGORY_MAP: Record<string, TechCategory> = {
  // Frameworks
  django: "framework",
  flask: "framework",
  fastapi: "framework",
  starlette: "framework",
  tornado: "framework",
  aiohttp: "framework",
  sanic: "framework",
  litestar: "framework",
  streamlit: "framework",
  gradio: "framework",
  dash: "framework",
  pyramid: "framework",
  bottle: "framework",
  falcon: "framework",
  typer: "framework",
  click: "framework",

  // API / clients / AI
  djangorestframework: "api",
  requests: "api",
  httpx: "api",
  urllib3: "api",
  grpcio: "api",
  graphene: "api",
  "strawberry-graphql": "api",
  anthropic: "api",
  openai: "api",
  langchain: "api",
  "langchain-core": "api",
  "llama-index": "api",
  transformers: "api",
  "huggingface-hub": "api",
  pydantic: "api",
  "pydantic-settings": "api",
  marshmallow: "api",
  celery: "api",

  // Deployment
  uvicorn: "deployment",
  gunicorn: "deployment",
  hypercorn: "deployment",

  // Data / ML / visualization
  numpy: "visualization",
  pandas: "visualization",
  polars: "visualization",
  scipy: "visualization",
  "scikit-learn": "visualization",
  torch: "visualization",
  tensorflow: "visualization",
  jax: "visualization",
  matplotlib: "visualization",
  seaborn: "visualization",
  plotly: "visualization",
  bokeh: "visualization",
  altair: "visualization",

  // Database
  sqlalchemy: "database",
  sqlmodel: "database",
  alembic: "database",
  psycopg2: "database",
  "psycopg2-binary": "database",
  psycopg: "database",
  asyncpg: "database",
  pymongo: "database",
  motor: "database",
  redis: "database",
  peewee: "database",
  "tortoise-orm": "database",

  // Testing
  pytest: "testing",
  hypothesis: "testing",
  tox: "testing",
  nox: "testing",
  coverage: "testing",

  // Tooling
  black: "tooling",
  ruff: "tooling",
  mypy: "tooling",
  flake8: "tooling",
  isort: "tooling",
  pylint: "tooling",
  "pre-commit": "tooling",
  poetry: "tooling",
  setuptools: "tooling",
  "python-dotenv": "tooling",
  jupyter: "tooling",
  rich: "tooling",
  jinja2: "styling",
};

/** PEP 503 normalization: lowercase, runs of -_. become a single dash */
export function normalizePythonName(name: string): string {
  return name.toLowerCase().replace(/[-_.]+/g, "-");
}

function categorizePython(name: string): TechCategory {
  const key = normalizePythonName(name);
  if (PYTHON_CATEGORY_MAP[key]) return PYTHON_CATEGORY_MAP[key];
  if (key.startsWith("django-") || key.startsWith("flask-")) return "framework";
  if (key.startsWith("pytest-")) return "testing";
  if (key.startsWith("types-") || key.endsWith("-stubs")) return "tooling";
  return categorize(key);
}

function categorize(name: string): TechCategory {
  if (CATEGORY_MAP[name]) return CATEGORY_MAP[name];

  // Heuristic fallbacks
  if (name.startsWith("@types/")) return "tooling";
  if (name.startsWith("eslint-")) return "tooling";
  if (name.includes("lint") || name.includes("prettier")) return "tooling";
  if (name.includes("test") || name.includes("spec")) return "testing";
  if (name.includes("css") || name.includes("style") || name.includes("sass"))
    return "styling";
  if (name.includes("db") || name.includes("sql") || name.includes("mongo"))
    return "database";

  return "tooling"; // default
}

/**
 * Parse package.json content and extract categorized dependencies.
 */
export function parseDependencies(packageJsonContent: string): DependencyInfo {
  let parsed: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  try {
    parsed = JSON.parse(packageJsonContent);
  } catch {
    return { dependencies: [] };
  }

  const deps: ParsedDependency[] = [];

  if (parsed.dependencies) {
    for (const [name, version] of Object.entries(parsed.dependencies)) {
      deps.push({
        name,
        version: version.replace(/^[\^~>=<]/, ""),
        category: categorize(name),
        isDev: false,
        ecosystem: "npm",
      });
    }
  }

  if (parsed.devDependencies) {
    for (const [name, version] of Object.entries(parsed.devDependencies)) {
      deps.push({
        name,
        version: version.replace(/^[\^~>=<]/, ""),
        category: categorize(name),
        isDev: true,
        ecosystem: "npm",
      });
    }
  }

  return { dependencies: deps };
}

// ─── Python ─────────────────────────────────────

/**
 * Version from a specifier, using the lower bound or pin rather than an upper bound:
 * ">=2.1,<3" → "2.1", "<3,>=2.1" → "2.1", "^0.110" → "0.110", "<2" → "".
 */
function versionFromSpec(spec: string): string {
  const clauses = spec.replace(/[()]/g, "").split(",").map((c) => c.trim());
  const clause = clauses.find((c) => c && !c.startsWith("<") && !c.startsWith("!="));
  if (!clause || clause === "*") return "";
  return clause.match(/\d+(?:\.[\w*]+)*/)?.[0] ?? "";
}

/**
 * Parse one PEP 508 requirement, e.g. `fastapi[all]>=0.110,<1 ; python_version>"3.8"`.
 * Returns null for pip options, URLs, and local/editable installs.
 */
function parseRequirement(
  line: string,
  isDev: boolean
): ParsedDependency | null {
  const req = line.split(/\s+#/)[0].split(";")[0].trim();
  if (!req || req.startsWith("#") || req.startsWith("-") || req.startsWith(".")) {
    return null;
  }
  if (/^[a-z+]+:\/\//i.test(req)) return null;

  const match = req.match(/^([A-Za-z0-9][A-Za-z0-9._-]*)\s*(?:\[[^\]]*\])?\s*(.*)$/);
  if (!match) return null;
  const [, name, spec] = match;
  if (spec.startsWith("@")) return null; // direct URL reference

  return {
    name,
    version: versionFromSpec(spec),
    category: categorizePython(name),
    isDev,
    ecosystem: "pypi",
  };
}

/** Poetry / Pipfile tables: `name = "^1.2"` or `name = { version = "^1.2", extras = [...] }` */
function parseDependencyTable(
  table: unknown,
  isDev: boolean
): ParsedDependency[] {
  if (!table || typeof table !== "object") return [];
  const deps: ParsedDependency[] = [];

  for (const [name, value] of Object.entries(table as Record<string, unknown>)) {
    if (name.toLowerCase() === "python") continue;

    let spec = "";
    if (typeof value === "string") {
      spec = value;
    } else if (value && typeof value === "object") {
      const entry = value as Record<string, unknown>;
      if (typeof entry.version === "string") spec = entry.version;
      else if ("git" in entry || "path" in entry || "url" in entry) continue; // VCS / local
    }

    deps.push({
      name,
      version: versionFromSpec(spec),
      category: categorizePython(name),
      isDev,
      ecosystem: "pypi",
    });
  }
  return deps;
}

function parseRequirementList(list: unknown, isDev: boolean): ParsedDependency[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item): item is string => typeof item === "string")
    .map((item) => parseRequirement(item, isDev))
    .filter((d): d is ParsedDependency => d !== null);
}

type TomlTable = Record<string, unknown>;

function asTable(value: unknown): TomlTable {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as TomlTable)
    : {};
}

function parsePyproject(content: string): ParsedDependency[] {
  let toml: TomlTable;
  try {
    toml = parseToml(content);
  } catch {
    return [];
  }

  const deps: ParsedDependency[] = [];
  const project = asTable(toml.project);

  // PEP 621
  deps.push(...parseRequirementList(project.dependencies, false));
  for (const list of Object.values(asTable(project["optional-dependencies"]))) {
    deps.push(...parseRequirementList(list, true));
  }

  // PEP 735 dependency groups (uv, pdm)
  for (const list of Object.values(asTable(toml["dependency-groups"]))) {
    deps.push(...parseRequirementList(list, true));
  }

  // Poetry
  const poetry = asTable(asTable(toml.tool).poetry);
  deps.push(...parseDependencyTable(poetry.dependencies, false));
  deps.push(...parseDependencyTable(poetry["dev-dependencies"], true));
  for (const group of Object.values(asTable(poetry.group))) {
    deps.push(...parseDependencyTable(asTable(group).dependencies, true));
  }

  return deps;
}

function parsePipfile(content: string): ParsedDependency[] {
  try {
    const toml = parseToml(content);
    return [
      ...parseDependencyTable(toml.packages, false),
      ...parseDependencyTable(toml["dev-packages"], true),
    ];
  } catch {
    return [];
  }
}

function parseRequirementsTxt(content: string, isDev: boolean): ParsedDependency[] {
  return content
    .split(/\r?\n/)
    .map((line) => parseRequirement(line, isDev))
    .filter((d): d is ParsedDependency => d !== null);
}

const MANIFEST_NAMES = new Set(["package.json", "pyproject.toml", "Pipfile"]);
const NON_PROJECT_DIR = /(^|\/)(tests?|examples?|docs?|fixtures?|samples?|node_modules)\//i;

/**
 * Whether a repo path is a dependency manifest that parseProjectDependencies reads.
 * Accepts the root and one folder down (e.g. backend/pyproject.toml, frontend/package.json),
 * plus requirements/ folders; skips tests, examples, and docs.
 */
export function isDependencyManifest(path: string): boolean {
  if (NON_PROJECT_DIR.test(path)) return false;
  const dirs = path.split("/");
  const name = dirs.pop() ?? "";

  if (MANIFEST_NAMES.has(name)) return dirs.length <= 1;
  if (!name.endsWith(".txt")) return false;
  // requirements*.txt at root or one level down, or any .txt in a requirements/ folder
  if (/^requirements[\w.-]*\.txt$/.test(name)) return dirs.length <= 1;
  return (
    dirs[dirs.length - 1] === "requirements" && dirs.length <= 2
  );
}

/**
 * Collect dependencies from every manifest in the repo: package.json,
 * requirements*.txt (root or requirements/), pyproject.toml, and Pipfile.
 * Duplicates are merged, preferring runtime over dev and entries with a version.
 */
export function parseProjectDependencies(
  files: { path: string; content: string }[]
): DependencyInfo {
  const all: ParsedDependency[] = [];

  for (const { path, content } of files) {
    if (!isDependencyManifest(path)) continue;
    const name = path.split("/").pop() ?? "";

    if (name === "package.json") {
      all.push(...parseDependencies(content).dependencies);
    } else if (name === "pyproject.toml") {
      all.push(...parsePyproject(content));
    } else if (name === "Pipfile") {
      all.push(...parsePipfile(content));
    } else {
      all.push(...parseRequirementsTxt(content, /dev|test|lint|doc/i.test(path)));
    }
  }

  const merged = new Map<string, ParsedDependency>();
  for (const dep of all) {
    const key =
      dep.ecosystem === "pypi"
        ? `pypi:${normalizePythonName(dep.name)}`
        : `npm:${dep.name}`;
    const existing = merged.get(key);
    if (
      !existing ||
      (existing.isDev && !dep.isDev) ||
      (existing.isDev === dep.isDev && !existing.version && dep.version)
    ) {
      merged.set(key, dep);
    }
  }
  return { dependencies: [...merged.values()] };
}
