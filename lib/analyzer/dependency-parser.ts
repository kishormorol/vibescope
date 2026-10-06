// ═══════════════════════════════════════════════
// DEPENDENCY PARSER — Extract and categorize deps
// ═══════════════════════════════════════════════

import type { TechCategory } from "@/lib/types";

export interface ParsedDependency {
  name: string;
  version: string;
  category: TechCategory;
  isDev: boolean;
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
      });
    }
  }

  return { dependencies: deps };
}
