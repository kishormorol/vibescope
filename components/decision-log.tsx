"use client";

import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import type { Decision, TechCategory } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  framework: "260",
  language: "300",
  styling: "330",
  state: "195",
  visualization: "155",
  animation: "80",
  api: "45",
  database: "25",
  testing: "120",
  tooling: "210",
  deployment: "0",
};

function getCategoryHue(category: string): string {
  return CATEGORY_COLORS[category] ?? "260";
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

function DecisionCard({
  decision,
  index,
}: {
  decision: Decision;
  index: number;
}) {
  const hue = getCategoryHue(decision.category);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-xl p-5 border border-white/10 space-y-3"
      style={{
        background: "oklch(0.12 0.01 260 / 60%)",
        backdropFilter: "blur(12px)",
        boxShadow: `0 0 24px oklch(0.4 0.08 ${hue} / 8%), inset 0 1px 0 oklch(1 0 0 / 4%)`,
      }}
    >
      {/* Title */}
      <h3 className="text-base font-semibold text-foreground">
        {decision.title}
      </h3>

      {/* Chosen */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground shrink-0">Chosen:</span>
        <span
          className="text-sm font-semibold px-2.5 py-0.5 rounded-lg"
          style={{
            color: `oklch(0.9 0.1 ${hue})`,
            background: `oklch(0.2 0.04 ${hue} / 50%)`,
            boxShadow: `0 0 12px oklch(0.6 0.12 ${hue} / 25%)`,
          }}
        >
          {decision.chosen}
        </span>
      </div>

      {/* Alternatives */}
      {decision.alternatives.length > 0 && (
        <div className="flex items-start gap-2">
          <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
            Alternatives:
          </span>
          <span className="text-xs text-muted-foreground/60">
            {decision.alternatives.join(", ")}
          </span>
        </div>
      )}

      {/* Reasoning */}
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground font-medium">
          Reasoning
        </span>
        <p className="text-xs text-foreground/70 leading-relaxed">
          {decision.reasoning}
        </p>
      </div>

      {/* Category badge */}
      <div className="pt-1">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{
            background: `oklch(0.2 0.04 ${hue} / 50%)`,
            color: `oklch(0.75 0.1 ${hue})`,
          }}
        >
          {decision.category}
        </span>
      </div>
    </motion.div>
  );
}

export function DecisionLog() {
  const { analysis } = useStore();
  const decisions = analysis?.decisions ?? [];

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">
          No analysis yet. Analyze a repository to view architecture decisions.
        </p>
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">
          No decisions found in the analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <h2
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: "oklch(0.7 0.1 80)" }}
        >
          Architecture Decisions ({decisions.length})
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {decisions.map((decision, i) => (
          <DecisionCard key={decision.id} decision={decision} index={i} />
        ))}
      </div>
    </div>
  );
}
