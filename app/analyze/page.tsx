"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useStore } from "@/lib/store";
import { AnalysisTabs } from "@/components/analysis-tabs";
import { PipelineView } from "@/components/pipeline-view";
import { TechMap } from "@/components/tech-map";
import { FileExplorer } from "@/components/file-explorer";
import { ConceptGraph } from "@/components/concept-graph";
import { DecisionLog } from "@/components/decision-log";
import { LearningPath } from "@/components/learning-path";
import type { AnalysisTab } from "@/lib/types";

const VIEW_MAP: Record<AnalysisTab, React.ComponentType> = {
  pipeline: PipelineView,
  techmap: TechMap,
  files: FileExplorer,
  concepts: ConceptGraph,
  decisions: DecisionLog,
  learning: LearningPath,
};

export default function AnalyzePage() {
  const {
    analysis,
    isAnalyzing,
    analyzeProgress,
    analyzeStatus,
    analyzeError,
    activeTab,
  } = useStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (!analysis && !isAnalyzing) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center text-3xl text-muted-foreground/30 mx-auto">
            ⊘
          </div>
          {analyzeError ? (
            <div className="space-y-1 max-w-md">
              <p className="text-foreground text-sm font-semibold">
                Analysis failed
              </p>
              <p className="text-muted-foreground text-sm">{analyzeError}</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No analysis loaded. Go back and analyze a repo or try the demo.
            </p>
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs glass hover:glow-primary transition-all text-muted-foreground hover:text-foreground"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  if (isAnalyzing) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
            <div
              className="absolute inset-3 rounded-full border-2 border-cyan-500/30 animate-spin"
              style={{ animationDuration: "3s" }}
            />
            <div
              className="absolute inset-6 rounded-full border-2 border-indigo-400/40 animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "2s",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-indigo-400 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground/60">
              {analyzeStatus || "Analyzing codebase..."}
            </p>
            <div className={`w-64 h-1.5 rounded-full overflow-hidden mx-auto ${isDark ? "bg-[oklch(0.15_0.01_260)]" : "bg-[oklch(0.9_0.005_260)]"}`}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.7 0.18 260), oklch(0.75 0.15 195))",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${analyzeProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-[10px] font-mono text-muted-foreground/40">
              {analyzeProgress}%
            </p>
            <p className="text-xs text-muted-foreground/40 max-w-xs mx-auto pt-2">
              Large repos can take a few minutes. Keep this tab open.
            </p>
          </div>
        </motion.div>
      </main>
    );
  }

  const ActiveView = VIEW_MAP[activeTab];

  return (
    <main className="flex-1 flex flex-col px-4 py-4">
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4 max-w-[1600px] mx-auto w-full"
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground glass border-[oklch(0.2_0.02_260_/_30%)] hover:border-[oklch(0.3_0.05_260_/_40%)] transition-all"
          >
            ← Home
          </Link>
          <h1 className="text-2xl font-bold tracking-tighter">
            <span className={`bg-gradient-to-r bg-clip-text text-transparent ${isDark
              ? "from-[oklch(0.75_0.18_260)] to-[oklch(0.8_0.15_195)]"
              : "from-[oklch(0.45_0.22_260)] to-[oklch(0.5_0.18_195)]"}`}>
              Vibe
            </span>
            <span className="text-foreground/30">Scope</span>
          </h1>
        </div>

        {analysis && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-muted-foreground/60">
              {analysis.summary.name}
            </span>
            <span className="text-xs font-mono px-3 py-1.5 rounded glass text-muted-foreground/50">
              {analysis.summary.totalFiles} files ·{" "}
              {analysis.summary.totalLines.toLocaleString()} lines
            </span>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <AnalysisTabs />

      {/* Active view */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full mt-4">
        <ActiveView />
      </div>
    </main>
  );
}
