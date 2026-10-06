// ═══════════════════════════════════════════════
// REPO LOADER — Fetch repo contents from GitHub API
// ═══════════════════════════════════════════════

export interface RepoFile {
  path: string;
  content: string;
  size: number;
}

interface GitTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

interface GitTreeResponse {
  sha: string;
  url: string;
  tree: GitTreeItem[];
  truncated: boolean;
}

// Extensions to skip (binary / generated / not useful)
const SKIP_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".svg",
  ".webp",
  ".avif",
  ".mp4",
  ".mp3",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".otf",
  ".zip",
  ".tar",
  ".gz",
  ".pdf",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".wasm",
  ".map",
]);

// Directories to skip entirely
const SKIP_DIRS = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".turbo",
  ".vercel",
  "__pycache__",
  ".cache",
  "coverage",
  ".husky",
];

// Lock files to skip
const SKIP_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  "composer.lock",
  "Gemfile.lock",
  "Cargo.lock",
  "poetry.lock",
]);

// Priority directories (files here are fetched first)
const PRIORITY_DIRS = [
  "src/",
  "app/",
  "lib/",
  "components/",
  "pages/",
  "api/",
  "hooks/",
  "utils/",
  "services/",
  "server/",
];

// Priority root files
const PRIORITY_ROOT_FILES = new Set([
  "package.json",
  "tsconfig.json",
  "next.config.js",
  "next.config.ts",
  "next.config.mjs",
  "tailwind.config.js",
  "tailwind.config.ts",
  "vite.config.ts",
  "vite.config.js",
  "README.md",
  ".env.example",
  "docker-compose.yml",
  "Dockerfile",
]);

const MAX_FILES = 50;
const MAX_FILE_SIZE = 100_000; // 100KB per file

/**
 * Parse owner and repo from a GitHub URL.
 * Supports: github.com/owner/repo, https://github.com/owner/repo, etc.
 */
export function parseGitHubUrl(repoUrl: string): {
  owner: string;
  repo: string;
} {
  const cleaned = repoUrl.trim().replace(/\/+$/, "");

  // Try URL parsing first
  try {
    const url = new URL(
      cleaned.startsWith("http") ? cleaned : `https://${cleaned}`
    );
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
    }
  } catch {
    // Fall through to regex
  }

  // Fallback: owner/repo pattern
  const match = cleaned.match(/([^\/]+)\/([^\/]+)$/);
  if (match) {
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
  }

  throw new Error(`Could not parse GitHub URL: "${repoUrl}"`);
}

function shouldSkipPath(path: string): boolean {
  // Skip directories
  for (const dir of SKIP_DIRS) {
    if (path.startsWith(dir + "/") || path === dir) return true;
  }

  // Skip known files
  const fileName = path.split("/").pop() || "";
  if (SKIP_FILES.has(fileName)) return true;

  // Skip binary extensions
  const ext = "." + fileName.split(".").pop()?.toLowerCase();
  if (SKIP_EXTENSIONS.has(ext)) return true;

  return false;
}

function priorityScore(path: string): number {
  // Root config files get highest priority
  if (!path.includes("/") && PRIORITY_ROOT_FILES.has(path)) return 100;

  // Priority directories
  for (let i = 0; i < PRIORITY_DIRS.length; i++) {
    if (path.startsWith(PRIORITY_DIRS[i])) return 50 - i;
  }

  // Other files
  return 0;
}

/**
 * Load repository contents from GitHub API (unauthenticated).
 * Returns up to ~50 most important files with their content.
 */
export async function loadRepo(repoUrl: string): Promise<RepoFile[]> {
  const { owner, repo } = parseGitHubUrl(repoUrl);

  // Get the default branch
  const repoRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: { Accept: "application/vnd.github.v3+json" },
    }
  );

  if (!repoRes.ok) {
    if (repoRes.status === 404) {
      throw new Error(
        `Repository not found: ${owner}/${repo}. Make sure it's a public repo.`
      );
    }
    if (repoRes.status === 403) {
      throw new Error(
        "GitHub API rate limit exceeded. Wait a minute and try again."
      );
    }
    throw new Error(`GitHub API error: ${repoRes.status} ${repoRes.statusText}`);
  }

  const repoData = await repoRes.json();
  const defaultBranch: string = repoData.default_branch || "main";

  // Get full file tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
    {
      headers: { Accept: "application/vnd.github.v3+json" },
    }
  );

  if (!treeRes.ok) {
    throw new Error(
      `Failed to fetch file tree: ${treeRes.status} ${treeRes.statusText}`
    );
  }

  const treeData: GitTreeResponse = await treeRes.json();

  // Filter to blobs (files), skip unneeded paths, sort by priority
  const candidates = treeData.tree
    .filter(
      (item) =>
        item.type === "blob" &&
        !shouldSkipPath(item.path) &&
        (item.size ?? 0) < MAX_FILE_SIZE
    )
    .sort((a, b) => priorityScore(b.path) - priorityScore(a.path))
    .slice(0, MAX_FILES);

  // Fetch raw content for each file (in parallel batches of 10)
  const files: RepoFile[] = [];
  const batchSize = 10;

  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (item) => {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${item.path}`;
        const res = await fetch(rawUrl);
        if (!res.ok) return null;
        const content = await res.text();
        return {
          path: item.path,
          content,
          size: item.size ?? content.length,
        };
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        files.push(result.value);
      }
    }
  }

  return files;
}
