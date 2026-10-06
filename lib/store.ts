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
}

export const useStore = create<VibescopeState>((set) => ({
  repoUrl: "",
  apiKey: "",
  analysis: null,
  isAnalyzing: false,
  analyzeProgress: 0,
  analyzeStatus: "",
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
}));
