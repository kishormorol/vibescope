"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import type { Lesson, Difficulty, LessonResource } from "@/lib/types";

const DIFFICULTY_COLORS: Record<Difficulty, { hue: string; label: string }> = {
  beginner: { hue: "155", label: "Beginner" },
  intermediate: { hue: "80", label: "Intermediate" },
  advanced: { hue: "25", label: "Advanced" },
};

type DifficultyFilter = "all" | Difficulty;

const cardVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" as const },
  }),
};

function ProgressRing({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = total > 0 ? completed / total : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        {/* Background ring */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="oklch(0.2 0.02 155 / 40%)"
          strokeWidth="5"
        />
        {/* Progress ring */}
        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="oklch(0.65 0.15 155)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            filter: "drop-shadow(0 0 6px oklch(0.6 0.15 155 / 50%))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={completed}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-lg font-bold"
          style={{ color: "oklch(0.9 0.08 155)" }}
        >
          {Math.round(pct * 100)}%
        </motion.span>
        <span className="text-[10px] text-muted-foreground">
          {completed}/{total}
        </span>
      </div>
    </div>
  );
}

function LessonCard({
  lesson,
  index,
  isCompleted,
  isActive,
  onToggleComplete,
  onActivate,
  onConceptClick,
}: {
  lesson: Lesson;
  index: number;
  isCompleted: boolean;
  isActive: boolean;
  onToggleComplete: (id: string) => void;
  onActivate: (id: string) => void;
  onConceptClick: (concept: string) => void;
}) {
  const { hue, label } = DIFFICULTY_COLORS[lesson.difficulty];

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
        {/* Order circle — clickable to mark complete */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onToggleComplete(lesson.id)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 relative z-10 transition-all duration-300 cursor-pointer"
          style={{
            background: isCompleted
              ? `oklch(0.35 0.12 155)`
              : `oklch(0.15 0.03 ${hue})`,
            borderColor: isCompleted
              ? `oklch(0.6 0.15 155)`
              : `oklch(0.55 0.12 ${hue})`,
            color: isCompleted
              ? `oklch(0.95 0.05 155)`
              : `oklch(0.85 0.1 ${hue})`,
            boxShadow: isCompleted
              ? `0 0 18px oklch(0.5 0.15 155 / 40%)`
              : isActive
              ? `0 0 18px oklch(0.5 0.12 ${hue} / 40%)`
              : `0 0 14px oklch(0.5 0.12 ${hue} / 20%)`,
          }}
          title={isCompleted ? "Mark incomplete" : "Mark complete"}
        >
          {isCompleted ? "✓" : lesson.order}
        </motion.button>
        {/* Connecting line */}
        <div
          className="w-px flex-1 min-h-[20px]"
          style={{
            background: isCompleted
              ? `linear-gradient(to bottom, oklch(0.5 0.12 155 / 70%), oklch(0.3 0.06 155 / 20%))`
              : `linear-gradient(to bottom, oklch(0.4 0.08 ${hue} / 60%), transparent)`,
          }}
        />
      </div>

      {/* Card */}
      <motion.div
        onClick={() => onActivate(lesson.id)}
        className="flex-1 rounded-xl border border-white/10 space-y-3 mb-4 cursor-pointer transition-all duration-300"
        style={{
          background: isActive
            ? `oklch(0.15 0.02 ${hue} / 70%)`
            : "oklch(0.12 0.01 260 / 60%)",
          backdropFilter: "blur(12px)",
          boxShadow: isActive
            ? `0 0 30px oklch(0.4 0.1 ${hue} / 15%), inset 0 1px 0 oklch(1 0 0 / 6%)`
            : `0 0 20px oklch(0.4 0.08 ${hue} / 8%), inset 0 1px 0 oklch(1 0 0 / 4%)`,
          borderColor: isActive
            ? `oklch(0.4 0.08 ${hue} / 40%)`
            : undefined,
          opacity: isCompleted && !isActive ? 0.7 : 1,
          padding: isActive ? "20px" : "16px",
        }}
        whileHover={{
          boxShadow: `0 0 30px oklch(0.4 0.1 ${hue} / 18%), inset 0 1px 0 oklch(1 0 0 / 6%)`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h3
            className="text-sm font-semibold"
            style={{
              color: isCompleted
                ? "oklch(0.6 0 0)"
                : "oklch(0.92 0 0)",
              textDecoration: isCompleted ? "line-through" : undefined,
              textDecorationColor: isCompleted
                ? "oklch(0.4 0 0)"
                : undefined,
            }}
          >
            {lesson.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: `oklch(0.2 0.04 ${hue} / 60%)`,
                color: `oklch(0.8 0.1 ${hue})`,
              }}
            >
              {label}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/5 text-muted-foreground">
              {lesson.estimatedMinutes}min
            </span>
          </div>
        </div>

        {/* Concept tags — clickable, navigate to concept graph */}
        {lesson.concepts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {lesson.concepts.map((concept) => (
              <motion.button
                key={concept}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onConceptClick(concept);
                }}
                className="text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer transition-all duration-200"
                style={{
                  background: "oklch(0.18 0.03 300 / 50%)",
                  color: "oklch(0.75 0.08 300)",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background =
                    "oklch(0.25 0.06 300 / 60%)";
                  (e.target as HTMLElement).style.boxShadow =
                    "0 0 10px oklch(0.5 0.1 300 / 30%)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background =
                    "oklch(0.18 0.03 300 / 50%)";
                  (e.target as HTMLElement).style.boxShadow = "none";
                }}
                title={`View "${concept}" in Concept Graph`}
              >
                {concept} →
              </motion.button>
            ))}
          </div>
        )}

        {/* Content — expanded when active */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <p className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">
                {lesson.content}
              </p>
              {/* Resources */}
              {lesson.resources?.length > 0 && (
                <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid oklch(0.25 0.02 260 / 40%)" }}>
                  <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: "oklch(0.6 0.06 200)" }}>
                    Resources
                  </span>
                  <div className="grid gap-1.5">
                    {lesson.resources.map((r, ri) => (
                      <a
                        key={ri}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-all duration-200 group"
                        style={{
                          background: "oklch(0.13 0.02 260 / 50%)",
                          border: "1px solid oklch(0.25 0.02 260 / 30%)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "oklch(0.18 0.03 200 / 50%)";
                          (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.35 0.06 200 / 40%)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "oklch(0.13 0.02 260 / 50%)";
                          (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.25 0.02 260 / 30%)";
                        }}
                      >
                        <span className="shrink-0 text-[10px]" style={{ color: "oklch(0.6 0.08 200)" }}>
                          {r.type === "docs" ? "📄" : r.type === "video" ? "🎬" : r.type === "tutorial" ? "📝" : r.type === "article" ? "📰" : "📚"}
                        </span>
                        <span className="flex-1 truncate" style={{ color: "oklch(0.8 0.04 200)" }}>
                          {r.title}
                        </span>
                        <span
                          className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase"
                          style={{
                            background: "oklch(0.2 0.03 200 / 40%)",
                            color: "oklch(0.55 0.06 200)",
                          }}
                        >
                          {r.type}
                        </span>
                        <span className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "oklch(0.7 0.08 200)" }}>
                          ↗
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid oklch(0.25 0.02 260 / 40%)" }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete(lesson.id);
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200"
                  style={{
                    background: isCompleted
                      ? "oklch(0.2 0.04 0 / 50%)"
                      : "oklch(0.3 0.08 155 / 50%)",
                    color: isCompleted
                      ? "oklch(0.6 0 0)"
                      : "oklch(0.85 0.12 155)",
                    boxShadow: isCompleted
                      ? "none"
                      : "0 0 12px oklch(0.5 0.12 155 / 25%)",
                  }}
                >
                  {isCompleted ? "↩ Undo" : "✓ Mark Complete"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview when not active */}
        {!isActive && (
          <p className="text-xs text-foreground/50 leading-relaxed line-clamp-2">
            {lesson.content.slice(0, 120)}…
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

export function LearningPath() {
  const { analysis, setActiveTab, setSelectedConcept } = useStore();
  const lessons = analysis?.learningPath ?? [];
  const concepts = analysis?.concepts ?? [];

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("all");

  const toggleComplete = useCallback((id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleConceptClick = useCallback(
    (conceptName: string) => {
      // Find concept by name and navigate
      const concept = concepts.find(
        (c) => c.name.toLowerCase() === conceptName.toLowerCase()
      );
      if (concept) {
        setSelectedConcept(concept.id);
      }
      setActiveTab("concepts");
    },
    [concepts, setSelectedConcept, setActiveTab]
  );

  const sorted = useMemo(
    () => [...lessons].sort((a, b) => a.order - b.order),
    [lessons]
  );

  const filtered = useMemo(
    () =>
      difficultyFilter === "all"
        ? sorted
        : sorted.filter((l) => l.difficulty === difficultyFilter),
    [sorted, difficultyFilter]
  );

  const totalMinutes = sorted.reduce((s, l) => s + l.estimatedMinutes, 0);
  const completedMinutes = sorted
    .filter((l) => completedIds.has(l.id))
    .reduce((s, l) => s + l.estimatedMinutes, 0);
  const remainingMinutes = totalMinutes - completedMinutes;

  const startNextLesson = useCallback(() => {
    const next = sorted.find((l) => !completedIds.has(l.id));
    if (next) setActiveLesson(next.id);
  }, [sorted, completedIds]);

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

  const diffFilters: { key: DifficultyFilter; label: string; hue: string }[] = [
    { key: "all", label: "All", hue: "260" },
    { key: "beginner", label: "Beginner", hue: "155" },
    { key: "intermediate", label: "Intermediate", hue: "80" },
    { key: "advanced", label: "Advanced", hue: "25" },
  ];

  return (
    <div className="space-y-5">
      {/* Progress overview */}
      <div
        className="rounded-xl p-5 border border-white/10 flex items-center gap-6"
        style={{
          background: "oklch(0.1 0.01 260 / 60%)",
          backdropFilter: "blur(12px)",
          boxShadow:
            "0 0 30px oklch(0.3 0.06 155 / 10%), inset 0 1px 0 oklch(1 0 0 / 4%)",
        }}
      >
        <ProgressRing completed={completedIds.size} total={sorted.length} />

        <div className="flex-1 space-y-2">
          <h2
            className="text-base font-bold"
            style={{ color: "oklch(0.9 0.06 155)" }}
          >
            Learning Path
          </h2>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{sorted.length} lessons</span>
            <span>·</span>
            <span>~{totalMinutes} min total</span>
            {completedIds.size > 0 && (
              <>
                <span>·</span>
                <span style={{ color: "oklch(0.7 0.1 155)" }}>
                  ~{remainingMinutes} min remaining
                </span>
              </>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/5">
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, oklch(0.5 0.15 155), oklch(0.6 0.15 80))",
                boxShadow: "0 0 8px oklch(0.5 0.15 155 / 40%)",
              }}
              initial={{ width: 0 }}
              animate={{
                width: `${
                  sorted.length > 0
                    ? (completedIds.size / sorted.length) * 100
                    : 0
                }%`,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>

          {/* Start / Continue button */}
          {completedIds.size < sorted.length && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={startNextLesson}
              className="text-xs font-semibold px-4 py-2 rounded-lg mt-1 transition-all cursor-pointer"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.3 0.08 155 / 70%), oklch(0.25 0.06 80 / 70%))",
                color: "oklch(0.9 0.08 155)",
                boxShadow: "0 0 16px oklch(0.5 0.12 155 / 25%)",
                border: "1px solid oklch(0.4 0.1 155 / 30%)",
              }}
            >
              {completedIds.size === 0 ? "▶ Start Learning" : "▶ Continue"}
            </motion.button>
          )}
          {completedIds.size === sorted.length && (
            <div
              className="text-xs font-bold px-3 py-1.5 rounded-lg inline-block"
              style={{
                background: "oklch(0.25 0.06 155 / 50%)",
                color: "oklch(0.85 0.12 155)",
                boxShadow: "0 0 20px oklch(0.5 0.15 155 / 30%)",
              }}
            >
              🎉 All lessons completed!
            </div>
          )}
        </div>
      </div>

      {/* Difficulty filter tabs */}
      <div className="flex items-center gap-1.5">
        {diffFilters.map((f) => {
          const isActive = difficultyFilter === f.key;
          const count =
            f.key === "all"
              ? sorted.length
              : sorted.filter((l) => l.difficulty === f.key).length;
          return (
            <motion.button
              key={f.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDifficultyFilter(f.key)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 cursor-pointer"
              style={{
                background: isActive
                  ? `oklch(0.25 0.06 ${f.hue} / 60%)`
                  : "oklch(0.15 0.02 260 / 40%)",
                color: isActive
                  ? `oklch(0.85 0.1 ${f.hue})`
                  : "oklch(0.55 0 0)",
                border: isActive
                  ? `1px solid oklch(0.4 0.08 ${f.hue} / 40%)`
                  : "1px solid oklch(0.2 0 0 / 30%)",
                boxShadow: isActive
                  ? `0 0 12px oklch(0.5 0.1 ${f.hue} / 20%)`
                  : "none",
              }}
            >
              {f.label} ({count})
            </motion.button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="pl-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((lesson, i) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              index={i}
              isCompleted={completedIds.has(lesson.id)}
              isActive={activeLesson === lesson.id}
              onToggleComplete={toggleComplete}
              onActivate={(id) =>
                setActiveLesson((prev) => (prev === id ? null : id))
              }
              onConceptClick={handleConceptClick}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
