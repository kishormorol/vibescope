import { create } from "zustand";
import type { CodebaseAnalysis, AnalysisTab } from "./types";
import { listCachedRepos, getCachedAnalysis, cacheAnalysis } from "./cache";

interface VibescopeState {
  // Input
  repoUrl: string;
  apiKey: string;

  // Analysis
  analysis: CodebaseAnalysis | null;
  isAnalyzing: boolean;
  analyzeProgress: number;
  analyzeStatus: string;
  analyzeError: string | null;

  // UI
  activeTab: AnalysisTab;
  selectedFile: string | null;
  selectedConcept: string | null;

  // Cache
  cachedRepos: { url: string; timestamp: number; name: string }[];

  // Actions
  setRepoUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  setAnalysis: (analysis: CodebaseAnalysis, repoUrl?: string) => void;
  setIsAnalyzing: (v: boolean) => void;
  setAnalyzeProgress: (p: number, status?: string) => void;
  setActiveTab: (tab: AnalysisTab) => void;
  setSelectedFile: (path: string | null) => void;
  setSelectedConcept: (id: string | null) => void;
  reset: () => void;
  loadCachedRepos: () => Promise<void>;
  loadFromCache: (repoUrl: string) => Promise<boolean>;
  runAnalysis: () => Promise<void>;
}

export const useStore = create<VibescopeState>((set, get) => ({
  repoUrl: "",
  apiKey: "",
  analysis: null,
  isAnalyzing: false,
  analyzeProgress: 0,
  analyzeStatus: "",
  analyzeError: null,
  activeTab: "pipeline",
  selectedFile: null,
  selectedConcept: null,
  cachedRepos: [],

  setRepoUrl: (repoUrl) => set({ repoUrl }),
  setApiKey: (apiKey) => set({ apiKey }),
  setAnalysis: (analysis, repoUrl) => {
    set({ analysis, isAnalyzing: false, analyzeProgress: 100 });
    if (repoUrl) {
      cacheAnalysis(repoUrl, analysis).catch(() => {});
    }
  },
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalyzeProgress: (analyzeProgress, analyzeStatus) =>
    set({ analyzeProgress, ...(analyzeStatus !== undefined ? { analyzeStatus } : {}) }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedFile: (selectedFile) => set({ selectedFile }),
  setSelectedConcept: (selectedConcept) => set({ selectedConcept }),
  reset: () =>
    set({
      analysis: null,
      isAnalyzing: false,
      analyzeProgress: 0,
      analyzeStatus: "",
      analyzeError: null,
      activeTab: "pipeline",
      selectedFile: null,
      selectedConcept: null,
    }),
  loadCachedRepos: async () => {
    const repos = await listCachedRepos();
    set({ cachedRepos: repos });
  },
  loadFromCache: async (repoUrl: string) => {
    const analysis = await getCachedAnalysis(repoUrl);
    if (analysis) {
      set({
        analysis,
        repoUrl,
        isAnalyzing: false,
        analyzeProgress: 100,
        activeTab: "pipeline",
      });
      return true;
    }
    return false;
  },
  runAnalysis: async () => {
    const { repoUrl, apiKey } = get();
    set({
      analysis: null,
      isAnalyzing: true,
      analyzeProgress: 0,
      analyzeStatus: "Starting analysis...",
      analyzeError: null,
      activeTab: "pipeline",
      selectedFile: null,
      selectedConcept: null,
    });

    const fail = (message: string) =>
      set({ isAnalyzing: false, analyzeProgress: 0, analyzeError: message });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl, apiKey }),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        return fail(body?.error || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          if (!event.startsWith("data: ")) continue;
          const data = JSON.parse(event.slice(6)) as {
            progress: number;
            status: string;
            result?: CodebaseAnalysis;
            error?: string;
          };
          if (data.error) return fail(data.error);
          if (data.result) {
            get().setAnalysis(data.result, repoUrl);
            get().loadCachedRepos();
            return;
          }
          set({ analyzeProgress: data.progress, analyzeStatus: data.status });
        }
      }

      fail("The connection closed before the analysis finished. Please try again.");
    } catch (e) {
      fail(e instanceof Error ? e.message : "Network error. Please try again.");
    } finally {
      // Don't keep the key around longer than needed
      set({ apiKey: "" });
    }
  },
}));
