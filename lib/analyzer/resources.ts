// ═══════════════════════════════════════════════
// RESOURCES — Ground doc links in real package data
// and drop links that don't resolve
// ═══════════════════════════════════════════════

import type { CodebaseAnalysis, LessonResource } from "@/lib/types";
import {
  normalizePythonName,
  type Ecosystem,
  type ParsedDependency,
} from "./dependency-parser";

export interface PackageInfo {
  name: string;
  version: string; // version declared in the project's manifest
  registry: Ecosystem;
  homepage?: string;
  docsUrl?: string;
  repoUrl?: string;
  packageUrl: string; // npmjs.com / pypi.org page
}

const MAX_PACKAGES = 60;
const MAX_RESOURCES_PER_LESSON = 4;
const LINK_TIMEOUT_MS = 6000;
const LINK_CHECK_BUDGET_MS = 25000;
const LINK_CONCURRENCY = 12;

// ─── npm registry ───────────────────────────────

function normalizeRepoUrl(repository: unknown): string | undefined {
  const raw =
    typeof repository === "string"
      ? repository
      : (repository as { url?: string } | undefined)?.url;
  if (!raw) return undefined;

  // "github:user/repo" or bare "user/repo" shorthands
  const shorthand = raw.match(/^(?:github:)?([\w.-]+\/[\w.-]+)$/);
  if (shorthand) return `https://github.com/${shorthand[1]}`;

  const url = raw
    .replace(/^git\+/, "")
    .replace(/^git:\/\//, "https://")
    .replace(/^ssh:\/\/git@/, "https://")
    .replace(/^git@([^:]+):/, "https://$1/")
    .replace(/\.git$/, "");
  return url.startsWith("http") ? url : undefined;
}

const CODE_HOST = /^https?:\/\/(www\.)?(github|gitlab|bitbucket)\.(com|org)\//;
const REGISTRY_HOST = /^https?:\/\/(www\.)?(pypi\.org|npmjs\.com|npmjs\.org)\//;

// Many packages set their homepage to the repo ("<repo>#readme") or their registry
// page; those are already covered by repoUrl / packageUrl, so only treat it as a
// homepage when it's a real project site
function siteUrl(url: unknown): string | undefined {
  return typeof url === "string" &&
    url.startsWith("http") &&
    !CODE_HOST.test(url) &&
    !REGISTRY_HOST.test(url)
    ? url
    : undefined;
}

async function fetchNpmPackage(
  dep: ParsedDependency
): Promise<PackageInfo | null> {
  const encoded = dep.name.replace("/", "%2f");
  const res = await fetch(`https://registry.npmjs.org/${encoded}/latest`, {
    signal: AbortSignal.timeout(LINK_TIMEOUT_MS),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    homepage?: string;
    repository?: unknown;
  };
  return {
    name: dep.name,
    version: dep.version,
    registry: "npm",
    homepage: siteUrl(data.homepage),
    repoUrl: normalizeRepoUrl(data.repository),
    packageUrl: `https://www.npmjs.com/package/${dep.name}`,
  };
}

async function fetchPypiPackage(
  dep: ParsedDependency
): Promise<PackageInfo | null> {
  const name = normalizePythonName(dep.name);
  const res = await fetch(`https://pypi.org/pypi/${name}/json`, {
    signal: AbortSignal.timeout(LINK_TIMEOUT_MS),
  });
  if (!res.ok) return null;
  const { info } = (await res.json()) as {
    info: {
      home_page?: string | null;
      project_urls?: Record<string, string> | null;
    };
  };

  // project_urls labels are free-form ("Documentation", "Source Code", "Homepage", ...)
  const urls = Object.entries(info.project_urls ?? {});
  const find = (pattern: RegExp) =>
    urls.find(([label]) => pattern.test(label))?.[1];
  const anyCodeHostUrl = [info.home_page, ...urls.map(([, u]) => u)].find(
    (u): u is string => typeof u === "string" && CODE_HOST.test(u)
  );

  return {
    name: dep.name,
    version: dep.version,
    registry: "pypi",
    homepage: siteUrl(find(/^home\s*page$|^homepage$|^home$|^website$/i) ?? info.home_page),
    docsUrl: siteUrl(find(/doc/i)),
    repoUrl:
      normalizeRepoUrl(find(/^(source|repository|code|source code|github)$/i)) ??
      normalizeRepoUrl(anyCodeHostUrl?.replace(/(github\.com\/[^/]+\/[^/#?]+).*/, "$1")),
    packageUrl: `https://pypi.org/project/${name}/`,
  };
}

function registryKey(name: string, registry: Ecosystem): string {
  return registry === "pypi" ? `pypi:${normalizePythonName(name)}` : name;
}

/**
 * Look up each dependency on its registry (npm or PyPI) for the real homepage,
 * docs, and source repo. Type-only packages are skipped; failures are ignored.
 */
export async function fetchPackageInfo(
  deps: ParsedDependency[]
): Promise<Map<string, PackageInfo>> {
  const candidates = deps
    .filter((d) => !d.name.startsWith("@types/") && !/^types-/i.test(d.name))
    .sort((a, b) => Number(a.isDev) - Number(b.isDev))
    .slice(0, MAX_PACKAGES);

  const results = await Promise.all(
    candidates.map((dep) =>
      (dep.ecosystem === "pypi" ? fetchPypiPackage(dep) : fetchNpmPackage(dep)).catch(
        () => null
      )
    )
  );

  const map = new Map<string, PackageInfo>();
  for (const info of results) {
    if (info) map.set(registryKey(info.name, info.registry), info);
  }
  return map;
}

// ─── Link checking ──────────────────────────────

function isHttpUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function youtubeOembedUrl(url: string): string | null {
  const { hostname } = new URL(url);
  if (!/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(hostname)) return null;
  return `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
}

const DEAD_NETWORK_CODES = new Set([
  "ENOTFOUND",
  "ECONNREFUSED",
  "EAI_AGAIN",
  "CERT_HAS_EXPIRED",
  "ERR_TLS_CERT_ALTNAME_INVALID",
]);

/**
 * Returns false only when a link is definitely broken (404/410, unknown host,
 * refused connection). Timeouts, 403s, rate limits and 5xx are treated as alive,
 * since many doc sites block automated requests.
 */
async function isLinkAlive(url: string): Promise<boolean> {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (compatible; VibeScope link checker; +https://vibescope-one.vercel.app)",
    Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
  };

  try {
    // YouTube returns 200 for any watch URL; oEmbed 400/404s for missing videos
    const oembed = youtubeOembedUrl(url);
    if (oembed) {
      const res = await fetch(oembed, {
        headers,
        signal: AbortSignal.timeout(LINK_TIMEOUT_MS),
      });
      return res.status !== 400 && res.status !== 404;
    }

    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers,
      signal: AbortSignal.timeout(LINK_TIMEOUT_MS),
    });
    if (res.status === 405 || res.status === 501 || res.status === 404) {
      // Some servers mishandle HEAD; confirm with GET before declaring it dead
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers,
        signal: AbortSignal.timeout(LINK_TIMEOUT_MS),
      });
      res.body?.cancel().catch(() => {});
    }
    return res.status !== 404 && res.status !== 410;
  } catch (error) {
    const code = (error as { cause?: { code?: string } })?.cause?.code;
    return !(code && DEAD_NETWORK_CODES.has(code));
  }
}

/**
 * Check many URLs with bounded concurrency and an overall time budget.
 * Anything not checked before the budget runs out is assumed alive.
 */
async function checkLinks(urls: Iterable<string>): Promise<Set<string>> {
  const queue = [...new Set(urls)].filter(isHttpUrl);
  const dead = new Set<string>();
  const deadline = Date.now() + LINK_CHECK_BUDGET_MS;

  const worker = async () => {
    while (queue.length > 0 && Date.now() < deadline) {
      const url = queue.shift()!;
      if (!(await isLinkAlive(url))) dead.add(url);
    }
  };
  await Promise.all(Array.from({ length: LINK_CONCURRENCY }, worker));
  return dead;
}

// ─── Enrichment ─────────────────────────────────

function findPackage(
  tech: { packageName?: string; id: string; name: string },
  packages: Map<string, PackageInfo>
): PackageInfo | undefined {
  for (const key of [tech.packageName, tech.id, tech.name]) {
    if (!key) continue;
    const info =
      packages.get(key) ??
      packages.get(key.toLowerCase()) ??
      packages.get(registryKey(key, "pypi"));
    if (info) return info;
  }
  return undefined;
}

function sameUrl(a: string, b: string): boolean {
  const norm = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");
  return norm(a) === norm(b);
}

/**
 * Replace model-guessed versions and doc links with real package data,
 * drop links that don't resolve, and top up lessons with verified docs
 * for the technologies they cover. Mutates and returns the analysis.
 */
export async function enrichAnalysis(
  analysis: CodebaseAnalysis,
  packages: Map<string, PackageInfo>
): Promise<CodebaseAnalysis> {
  const technologies = analysis.technologies ?? [];
  const concepts = analysis.concepts ?? [];
  const lessons = analysis.learningPath ?? [];
  const files = analysis.files ?? [];

  // 1. Attach real package data to technologies
  const registryDocs = new Map<string, string>(); // tech id → docs URL from the registry
  for (const tech of technologies) {
    const pkg = findPackage(tech, packages);
    if (!pkg) continue;
    tech.packageName = pkg.name;
    if (pkg.version) tech.version = pkg.version;
    tech.registry = pkg.registry;
    tech.packageUrl = pkg.packageUrl;
    if (pkg.repoUrl) tech.repoUrl = pkg.repoUrl;
    if (pkg.homepage && !sameUrl(pkg.homepage, tech.officialUrl ?? "")) {
      tech.officialUrl = pkg.homepage;
    }
    if (pkg.docsUrl) registryDocs.set(tech.id, pkg.docsUrl);
  }

  // 2. Check every model-written link in one pass
  const urls: string[] = [...registryDocs.values()];
  for (const t of technologies) urls.push(t.docsUrl, t.officialUrl);
  for (const c of concepts) urls.push(c.docUrl);
  for (const l of lessons) for (const r of l.resources ?? []) urls.push(r.url);
  for (const f of files)
    for (const a of f.annotations ?? []) if (a.docUrl) urls.push(a.docUrl);
  const dead = await checkLinks(urls.filter(isHttpUrl));
  const ok = (url: unknown): url is string => isHttpUrl(url) && !dead.has(url);

  // 3. Repair or drop broken links
  for (const tech of technologies) {
    const fallback = [
      registryDocs.get(tech.id),
      tech.officialUrl,
      tech.repoUrl,
      tech.packageUrl,
    ].find(ok);
    if (!ok(tech.docsUrl)) tech.docsUrl = fallback ?? "";
    if (!ok(tech.officialUrl)) tech.officialUrl = fallback ?? "";
  }
  for (const concept of concepts) {
    if (!ok(concept.docUrl)) concept.docUrl = "";
  }
  for (const file of files) {
    for (const ann of file.annotations ?? []) {
      if (ann.docUrl && !ok(ann.docUrl)) delete ann.docUrl;
    }
  }

  // 4. Lessons: keep live resources, then add docs for the technologies they cover
  const techById = new Map(technologies.map((t) => [t.id, t]));
  for (const lesson of lessons) {
    const resources: LessonResource[] = (lesson.resources ?? []).filter((r) =>
      ok(r.url)
    );
    for (const techId of lesson.technologies ?? []) {
      if (resources.length >= MAX_RESOURCES_PER_LESSON) break;
      const tech = techById.get(techId);
      if (!tech || !ok(tech.docsUrl)) continue;
      if (resources.some((r) => sameUrl(r.url, tech.docsUrl))) continue;
      resources.push({
        title: `${tech.name}${tech.version ? ` v${tech.version}` : ""} documentation`,
        url: tech.docsUrl,
        type: "docs",
      });
    }
    lesson.resources = resources;
  }

  return analysis;
}
