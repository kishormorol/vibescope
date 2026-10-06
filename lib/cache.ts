import type { CodebaseAnalysis } from "./types";

const CACHE_PREFIX = "vibescope:";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  data: CodebaseAnalysis;
  timestamp: number;
}

async function getIdb() {
  if (typeof window === "undefined") return null;
  try {
    const { get, set, del, keys } = await import("idb-keyval");
    return { get, set, del, keys };
  } catch {
    return null;
  }
}

export async function cacheAnalysis(
  repoUrl: string,
  analysis: CodebaseAnalysis
): Promise<void> {
  const idb = await getIdb();
  if (!idb) return;
  try {
    const entry: CacheEntry = { data: analysis, timestamp: Date.now() };
    await idb.set(`${CACHE_PREFIX}${repoUrl}`, entry);
  } catch (e) {
    console.warn("vibescope: cache write failed", e);
  }
}

export async function getCachedAnalysis(
  repoUrl: string
): Promise<CodebaseAnalysis | null> {
  const idb = await getIdb();
  if (!idb) return null;
  try {
    const entry = await idb.get<CacheEntry>(`${CACHE_PREFIX}${repoUrl}`);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > TTL_MS) {
      await idb.del(`${CACHE_PREFIX}${repoUrl}`);
      return null;
    }
    return entry.data;
  } catch (e) {
    console.warn("vibescope: cache read failed", e);
    return null;
  }
}

export async function listCachedRepos(): Promise<
  { url: string; timestamp: number; name: string }[]
> {
  const idb = await getIdb();
  if (!idb) return [];
  try {
    const allKeys = await idb.keys();
    const results: { url: string; timestamp: number; name: string }[] = [];
    for (const key of allKeys) {
      if (typeof key === "string" && key.startsWith(CACHE_PREFIX)) {
        const url = key.slice(CACHE_PREFIX.length);
        const entry = await idb.get<CacheEntry>(key);
        if (entry && Date.now() - entry.timestamp <= TTL_MS) {
          results.push({
            url,
            timestamp: entry.timestamp,
            name: entry.data.summary?.name || url.split("/").pop() || url,
          });
        } else if (entry) {
          // expired — clean up
          await idb.del(key);
        }
      }
    }
    return results.sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    console.warn("vibescope: cache list failed", e);
    return [];
  }
}

export async function clearCache(): Promise<void> {
  const idb = await getIdb();
  if (!idb) return;
  try {
    const allKeys = await idb.keys();
    for (const key of allKeys) {
      if (typeof key === "string" && key.startsWith(CACHE_PREFIX)) {
        await idb.del(key);
      }
    }
  } catch (e) {
    console.warn("vibescope: cache clear failed", e);
  }
}
