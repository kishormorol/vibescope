"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import type { Lesson, Difficulty } from "@/lib/types";

const DIFFICULTY_COLORS: Record<Difficulty, { hue: string; label: string }> = {
  beginner: { hue: "155", label: "Beginner" },
  intermediate: { hue: "80", label: "Intermediate" },
  advanced: { hue: "25", label: "Advanced" },
};

const cardVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" as const },
  }),
};

function LessonCard({ lesson, index }: { lesson: Lesson; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { hue, label } = DIFFICULTY_COLORS[lesson.difficulty];
  const shouldTruncate = lesson.content.length > 200;
  const displayContent =
    !expanded && shouldTruncate
      ? lesson.content.slice(0, 200) + "..."
      : lesson.content;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="flex gap-4"
    >
      {/* Timeline connector */}
      <div className="flex flex-col items-center shrink-0">
        {/* Order circle */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 relative z-10"
          style={{
            background: `oklch(0.15 0.03 ${hue})`,
            borderColor: `oklch(0.55 0.12 ${hue})`,
            color: `oklch(0.85 0.1 ${hue})`,
            boxShadow: `0 0 14px oklch(0.5 0.12 ${hue} / 30%)`,
          }}
        >
          {lesson.order}
        </div>
        {/* Connecting line */}
        <div
          className="w-px flex-1 min-h-[20px]"
          style={{
            background: `linear-gradient(to bottom, oklch(0.4 0.08 ${hue} / 60%), transparent)`,
          }}
        />
      </div>

      {/* Card */}
      <div
        className="flex-1 rounded-xl p-4 border border-white/10 space-y-3 mb-4"
        style={{
          background: "oklch(0.12 0.01 260 / 60%)",
          backdropFilter: "blur(12px)",
          boxShadow: `0 0 20px oklch(0.4 0.08 ${hue} / 8%), inset 0 1px 0 oklch(1 0 0 / 4%)`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            {lesson.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: `oklch(0.2 0.04 ${hue} / 60%)`,
                color: `oklch(0.8 0.1 ${hue})`,
              }}
            >
              {label}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-muted-foreground">
              {lesson.estimatedMinutes}min
            </span>
          </div>
        </div>

        {/* Concept tags */}
        {lesson.concepts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {lesson.concepts.map((concept) => (
              <span
                key={concept}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: "oklch(0.18 0.03 300 / 50%)",
                  color: "oklch(0.75 0.08 300)",
                }}
              >
                {concept}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <p className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">
          {displayContent}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-medium transition-colors"
            style={{ color: `oklch(0.7 0.1 ${hue})` }}
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function LearningPath() {
  const { analysis } = useStore();
  const lessons = analysis?.learningPath ?? [];

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">
          No analysis yet. Analyze a repository to view the learning path.
        </p>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">
          No learning path found in the analysis.
        </p>
      </div>
    );
  }

  const sorted = [...lessons].sort((a, b) => a.order - b.order);
  const totalMinutes = sorted.reduce((s, l) => s + l.estimatedMinutes, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: "oklch(0.7 0.1 25)" }}
        >
          Learning Path ({sorted.length} lessons)
        </h2>
        <span className="text-xs text-muted-foreground">
          ~{totalMinutes} min total
        </span>
      </div>

      {/* Timeline */}
      <div className="pl-2">
        {sorted.map((lesson, i) => (
          <LessonCard key={lesson.id} lesson={lesson} index={i} />
        ))}
      </div>
    </div>
  );
}
