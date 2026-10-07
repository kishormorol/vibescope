"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useStore } from "@/lib/store";
import { themeColors } from "@/lib/theme-colors";
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
  isDark,
}: {
  completed: number;
  total: number;
  isDark: boolean;
}) {
  const pct = total > 0 ? completed / total : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={isDark ? "oklch(0.2 0.02 155 / 40%)" : "oklch(0.88 0.02 155 / 50%)"}
          strokeWidth="5"
        />
        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={isDark ? "oklch(0.65 0.15 155)" : "oklch(0.45 0.18 155)"}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            filter: isDark
              ? "drop-shadow(0 0 6px oklch(0.6 0.15 155 / 50%))"
              : "drop-shadow(0 0 4px oklch(0.45 0.15 155 / 30%))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={completed}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-lg font-bold"
          style={{ color: isDark ? "oklch(0.9 0.08 155)" : "oklch(0.35 0.12 155)" }}
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
  isDark,
  onToggleComplete,
  onActivate,
  onConceptClick,
}: {
  lesson: Lesson;
  index: number;
  isCompleted: boolean;
  isActive: boolean;
  isDark: boolean;
  onToggleComplete: (id: string) => void;
  onActivate: (id: string) => void;
  onConceptClick: (concept: string) => void;
}) {
  const { hue, label } = DIFFICULTY_COLORS[lesson.difficulty];
  const tc = themeColors(isDark);

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
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onToggleComplete(lesson.id)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 relative z-10 transition-all duration-300 cursor-pointer"
          style={{
            background: isCompleted
              ? (isDark ? `oklch(0.35 0.12 155)` : `oklch(0.88 0.06 155)`)
              : tc.hueBg(hue),
            borderColor: isCompleted
              ? (isDark ? `oklch(0.6 0.15 155)` : `oklch(0.5 0.15 155)`)
              : tc.hueBorder(hue),
            color: isCompleted
              ? (isDark ? `oklch(0.95 0.05 155)` : `oklch(0.3 0.1 155)`)
              : tc.hueText(hue),
            boxShadow: isCompleted
              ? tc.hueGlow(155, 0.4)
              : tc.hueGlow(hue, isActive ? 0.4 : 0.2),
          }}
          title={isCompleted ? "Mark incomplete" : "Mark complete"}
        >
          {isCompleted ? "✓" : lesson.order}
        </motion.button>
        <div
          className="w-px flex-1 min-h-[20px]"
          style={{
            background: isCompleted
              ? (isDark
                  ? `linear-gradient(to bottom, oklch(0.5 0.12 155 / 70%), oklch(0.3 0.06 155 / 20%))`
                  : `linear-gradient(to bottom, oklch(0.6 0.1 155 / 50%), oklch(0.8 0.04 155 / 10%))`)
              : (isDark
                  ? `linear-gradient(to bottom, oklch(0.4 0.08 ${hue} / 60%), transparent)`
                  : `linear-gradient(to bottom, oklch(0.7 0.06 ${hue} / 40%), transparent)`),
          }}
        />
      </div>

      {/* Card */}
      <motion.div
        onClick={() => onActivate(lesson.id)}
        className="flex-1 rounded-xl space-y-3 mb-4 cursor-pointer transition-all duration-300"
        style={{
          background: isActive ? tc.hueBg(hue, 0.7) : tc.cardBg,
          backdropFilter: tc.backdrop,
          border: `1px solid ${isActive ? tc.hueBorder(hue) : tc.borderWhite}`,
          boxShadow: isActive ? tc.shadowActive(hue) : tc.shadow(hue, 0.08),
          opacity: isCompleted && !isActive ? 0.7 : 1,
          padding: isActive ? "20px" : "16px",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h3
            className="text-sm font-semibold"
            style={{
              color: isCompleted ? tc.muted : tc.heading,
              textDecoration: isCompleted ? "line-through" : undefined,
              textDecorationColor: isCompleted ? tc.subtle : undefined,
            }}
          >
            {lesson.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: tc.hueBadgeBg(hue),
                color: tc.hueBadgeText(hue),
              }}
            >
              {label}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded-full text-muted-foreground"
              style={{ background: tc.white(0.05) }}>
              {lesson.estimatedMinutes}min
            </span>
          </div>
        </div>

        {/* Concept tags */}
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
                  background: tc.tagBg,
                  color: tc.tagText,
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = tc.tagHoverBg;
                  (e.target as HTMLElement).style.boxShadow = tc.hueGlow(300, 0.3);
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = tc.tagBg;
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
                <div className="mt-3 pt-3 space-y-2" style={{ borderTop: `1px solid ${tc.divider}` }}>
                  <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: tc.hueText(200) }}>
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
                          background: tc.panelBg,
                          border: `1px solid ${tc.divider}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = tc.hueBg(200, 0.5);
                          e.currentTarget.style.borderColor = tc.hueBorder(200, 0.4);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = tc.panelBg;
                          e.currentTarget.style.borderColor = tc.divider;
                        }}
                      >
                        <span className="shrink-0 text-[10px]">
                          {r.type === "docs" ? "📄" : r.type === "video" ? "🎬" : r.type === "tutorial" ? "📝" : r.type === "article" ? "📰" : "📚"}
                        </span>
                        <span className="flex-1 truncate" style={{ color: tc.hueText(200) }}>
                          {r.title}
                        </span>
                        <span
                          className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase"
                          style={{
                            background: tc.hueBadgeBg(200),
                            color: tc.hueBadgeText(200),
                          }}
                        >
                          {r.type}
                        </span>
                        <span className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: tc.hueText(200) }}>
                          ↗
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${tc.divider}` }}>
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
                      ? tc.hueBg(0, 0.5)
                      : tc.accentBg(155),
                    color: isCompleted
                      ? tc.muted
                      : tc.accentText(155),
                    boxShadow: isCompleted ? "none" : tc.hueGlow(155, 0.25),
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tc = themeColors(isDark);
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
        className="rounded-xl p-5 flex items-center gap-6"
        style={{
          background: tc.panelBg,
          backdropFilter: tc.backdrop,
          border: `1px solid ${tc.borderWhite}`,
          boxShadow: tc.shadow(155, 0.1),
        }}
      >
        <ProgressRing completed={completedIds.size} total={sorted.length} isDark={isDark} />

        <div className="flex-1 space-y-2">
          <h2
            className="text-base font-bold"
            style={{ color: tc.accentText(155) }}
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
                <span style={{ color: tc.accentText(155) }}>
                  ~{remainingMinutes} min remaining
                </span>
              </>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: tc.white(0.05) }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                background: isDark
                  ? "linear-gradient(90deg, oklch(0.5 0.15 155), oklch(0.6 0.15 80))"
                  : "linear-gradient(90deg, oklch(0.45 0.18 155), oklch(0.5 0.15 80))",
                boxShadow: isDark ? "0 0 8px oklch(0.5 0.15 155 / 40%)" : "none",
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
                background: isDark
                  ? "linear-gradient(135deg, oklch(0.3 0.08 155 / 70%), oklch(0.25 0.06 80 / 70%))"
                  : "linear-gradient(135deg, oklch(0.45 0.12 155 / 90%), oklch(0.5 0.1 80 / 90%))",
                color: isDark ? "oklch(0.9 0.08 155)" : "oklch(0.98 0 0)",
                boxShadow: tc.hueGlow(155, 0.25),
                border: `1px solid ${tc.hueBorder(155, 0.3)}`,
              }}
            >
              {completedIds.size === 0 ? "▶ Start Learning" : "▶ Continue"}
            </motion.button>
          )}
          {completedIds.size === sorted.length && (
            <div
              className="text-xs font-bold px-3 py-1.5 rounded-lg inline-block"
              style={{
                background: tc.accentBg(155),
                color: tc.accentText(155),
                boxShadow: tc.hueGlow(155, 0.3),
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
                background: isActive ? tc.accentBg(f.hue) : tc.sectionBg,
                color: isActive ? tc.accentText(f.hue) : tc.muted,
                border: isActive
                  ? `1px solid ${tc.hueBorder(f.hue)}`
                  : `1px solid ${tc.divider}`,
                boxShadow: isActive ? tc.hueGlow(f.hue) : "none",
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
              isDark={isDark}
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
