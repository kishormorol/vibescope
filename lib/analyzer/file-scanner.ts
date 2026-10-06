// ═══════════════════════════════════════════════
// FILE SCANNER — File stats and language detection
// ═══════════════════════════════════════════════

import type { FileCategory } from "@/lib/types";
import type { RepoFile } from "./repo-loader";

export interface ScannedFile {
  path: string;
  language: string;
  lines: number;
  category: FileCategory;
}

export interface FileStats {
  files: ScannedFile[];
  totalFiles: number;
  totalLines: number;
  languages: { name: string; percentage: number; lines: number }[];
}

// Extension to language mapping
const EXT_LANGUAGE: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  mjs: "JavaScript",
  cjs: "JavaScript",
  py: "Python",
  rb: "Ruby",
  go: "Go",
  rs: "Rust",
  java: "Java",
  kt: "Kotlin",
  swift: "Swift",
  c: "C",
  cpp: "C++",
  h: "C",
  hpp: "C++",
  cs: "C#",
  php: "PHP",
  dart: "Dart",
  lua: "Lua",
  r: "R",
  scala: "Scala",
  sh: "Shell",
  bash: "Shell",
  zsh: "Shell",
  ps1: "PowerShell",
  sql: "SQL",
  html: "HTML",
  htm: "HTML",
  css: "CSS",
  scss: "SCSS",
  sass: "SASS",
  less: "LESS",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  toml: "TOML",
  xml: "XML",
  md: "Markdown",
  mdx: "MDX",
  graphql: "GraphQL",
  gql: "GraphQL",
  prisma: "Prisma",
  dockerfile: "Docker",
  makefile: "Makefile",
};

// File name to language (for files without extensions)
const NAME_LANGUAGE: Record<string, string> = {
  Dockerfile: "Docker",
  Makefile: "Makefile",
  Procfile: "Procfile",
  Gemfile: "Ruby",
  Rakefile: "Ruby",
  ".gitignore": "Git Config",
  ".eslintrc": "JSON",
  ".prettierrc": "JSON",
  ".env": "Environment",
  ".env.example": "Environment",
  ".env.local": "Environment",
};

function detectLanguage(path: string): string {
  const fileName = path.split("/").pop() || "";

  // Check full file name first
  if (NAME_LANGUAGE[fileName]) return NAME_LANGUAGE[fileName];

  // Check extension
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (EXT_LANGUAGE[ext]) return EXT_LANGUAGE[ext];

  return "Other";
}

function categorizeFile(path: string): FileCategory {
  const lower = path.toLowerCase();
  const fileName = path.split("/").pop() || "";

  // Config files
  if (
    fileName === "package.json" ||
    fileName === "tsconfig.json" ||
    fileName.includes("config") ||
    fileName.startsWith(".") ||
    fileName === "Dockerfile" ||
    fileName === "docker-compose.yml" ||
    fileName === "Makefile"
  ) {
    return "config";
  }

  // Test files
  if (
    lower.includes(".test.") ||
    lower.includes(".spec.") ||
    lower.includes("__tests__") ||
    lower.includes("/test/") ||
    lower.includes("/tests/")
  ) {
    return "test";
  }

  // Type definition files
  if (lower.endsWith(".d.ts") || lower.includes("/types")) {
    return "type";
  }

  // Style files
  if (
    lower.endsWith(".css") ||
    lower.endsWith(".scss") ||
    lower.endsWith(".sass") ||
    lower.endsWith(".less") ||
    lower.includes("globals.css") ||
    lower.includes("styles")
  ) {
    return "style";
  }

  // API routes
  if (
    lower.includes("/api/") ||
    lower.includes("route.ts") ||
    lower.includes("route.js")
  ) {
    return "api";
  }

  // Pages
  if (
    lower.includes("/page.") ||
    lower.includes("/pages/") ||
    lower.includes("layout.") ||
    lower.includes("loading.") ||
    lower.includes("error.") ||
    lower.includes("not-found.")
  ) {
    return "page";
  }

  // Components
  if (
    lower.includes("/components/") ||
    lower.includes("/component/") ||
    lower.includes("/ui/")
  ) {
    return "component";
  }

  // Library / utility
  if (
    lower.includes("/lib/") ||
    lower.includes("/utils/") ||
    lower.includes("/helpers/") ||
    lower.includes("/hooks/") ||
    lower.includes("/services/")
  ) {
    return "lib";
  }

  // Assets
  if (
    lower.includes("/public/") ||
    lower.includes("/assets/") ||
    lower.includes("/images/") ||
    lower.includes("/icons/")
  ) {
    return "asset";
  }

  return "other";
}

/**
 * Scan files to compute stats, detect languages, and categorize.
 */
export function scanFiles(files: RepoFile[]): FileStats {
  const scanned: ScannedFile[] = files.map((file) => ({
    path: file.path,
    language: detectLanguage(file.path),
    lines: file.content.split("\n").length,
    category: categorizeFile(file.path),
  }));

  const totalLines = scanned.reduce((sum, f) => sum + f.lines, 0);

  // Compute language percentages
  const langLines: Record<string, number> = {};
  for (const file of scanned) {
    langLines[file.language] = (langLines[file.language] || 0) + file.lines;
  }

  const languages = Object.entries(langLines)
    .map(([name, lines]) => ({
      name,
      lines,
      percentage: Math.round((lines / totalLines) * 1000) / 10,
    }))
    .sort((a, b) => b.lines - a.lines);

  return {
    files: scanned,
    totalFiles: scanned.length,
    totalLines,
    languages,
  };
}
