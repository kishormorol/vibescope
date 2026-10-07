"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useStore } from "@/lib/store";
import { themeColors } from "@/lib/theme-colors";
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
  tc,
}: {
  decision: Decision;
  index: number;
  tc: ReturnType<typeof themeColors>;
}) {
  const hue = getCategoryHue(decision.category);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-xl p-5 space-y-3"
      style={{
        background: tc.cardBg,
        backdropFilter: tc.backdrop,
        border: `1px solid ${tc.borderWhite}`,
        boxShadow: tc.shadow(hue, 0.08),
      }}
    >
      {/* Title */}
      <h3
        className="text-base font-semibold"
        style={{ color: tc.heading }}
      >
        {decision.title}
      </h3>

      {/* Chosen */}
      <div className="flex items-center gap-2">
        <span className="text-xs shrink-0" style={{ color: tc.muted }}>Chosen:</span>
        <span
          className="text-sm font-semibold px-2.5 py-0.5 rounded-lg"
          style={{
            color: tc.accentText(hue),
            background: tc.hueBadgeBg(hue),
            boxShadow: tc.hueGlow(hue, 0.25),
          }}
        >
          {decision.chosen}
        </span>
      </div>

      {/* Alternatives */}
      {decision.alternatives.length > 0 && (
        <div className="flex items-start gap-2">
          <span className="text-xs shrink-0 mt-0.5" style={{ color: tc.muted }}>
            Alternatives:
          </span>
          <span className="text-xs" style={{ color: tc.subtle }}>
            {decision.alternatives.join(", ")}
          </span>
        </div>
      )}

      {/* Reasoning */}
      <div className="space-y-1">
        <span className="text-xs font-medium" style={{ color: tc.muted }}>
          Reasoning
        </span>
        <p className="text-xs leading-relaxed" style={{ color: tc.body }}>
          {decision.reasoning}
        </p>
      </div>

      {/* Category badge */}
      <div className="pt-1">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            background: tc.hueBadgeBg(hue),
            color: tc.hueText(hue),
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tc = themeColors(isDark);
  const decisions = analysis?.decisions ?? [];

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: tc.muted }}>
          No analysis yet. Analyze a repository to view architecture decisions.
        </p>
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: tc.muted }}>
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
          style={{ color: tc.hueText(80) }}
        >
          Architecture Decisions ({decisions.length})
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {decisions.map((decision, i) => (
          <DecisionCard key={decision.id} decision={decision} index={i} tc={tc} />
        ))}
      </div>
    </div>
  );
}
