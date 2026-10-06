import { create } from "zustand";
import type { CodebaseAnalysis, AnalysisTab } from "./types";

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

  // Actions
  setRepoUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  setAnalysis: (analysis: CodebaseAnalysis) => void;
  setIsAnalyzing: (v: boolean) => void;
  setAnalyzeProgress: (p: number, status?: string) => void;
  setActiveTab: (tab: AnalysisTab) => void;
  setSelectedFile: (path: string | null) => void;
  setSelectedConcept: (id: string | null) => void;
  reset: () => void;
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

  setRepoUrl: (repoUrl) => set({ repoUrl }),
  setApiKey: (apiKey) => set({ apiKey }),
  setAnalysis: (analysis) =>
    set({ analysis, isAnalyzing: false, analyzeProgress: 100 }),
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
}));
