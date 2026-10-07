"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { themeColors } from "@/lib/theme-colors";
import type { AnalyzedFile, Difficulty } from "@/lib/types";

type AnatomyTab = "code" | "annotations" | "summary";

const DIFFICULTY_COLORS: Record<Difficulty, { hue: string; label: string }> = {
  beginner: { hue: "155", label: "Beginner" },
  intermediate: { hue: "80", label: "Intermediate" },
  advanced: { hue: "25", label: "Advanced" },
};

const EXT_TO_LANG: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  css: "css",
  json: "json",
  html: "html",
  md: "markdown",
  py: "python",
  rs: "rust",
  go: "go",
};

function getLangFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_LANG[ext] ?? "typescript";
}

interface FileAnatomyProps {
  file: AnalyzedFile;
  sourceCode?: string;
}

export function FileAnatomy({ file, sourceCode }: FileAnatomyProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tc = themeColors(isDark);

  const [activeTab, setActiveTab] = useState<AnatomyTab>(
    sourceCode ? "code" : "annotations"
  );
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [expandedAnnotation, setExpandedAnnotation] = useState<number | null>(
    null
  );
  const [hoveredAnnotation, setHoveredAnnotation] = useState<number | null>(
    null
  );
  const codeContainerRef = useRef<HTMLDivElement>(null);

  const lang = useMemo(() => getLangFromPath(file.path), [file.path]);

  // Highlight source code with Shiki
  useEffect(() => {
    if (!sourceCode) return;
    let cancelled = false;

    async function highlight() {
      try {
        const { createHighlighter } = await import("shiki");
        const highlighter = await createHighlighter({
          themes: ["vitesse-dark"],
          langs: [lang],
        });
        const html = highlighter.codeToHtml(sourceCode!, {
          lang,
          theme: "vitesse-dark",
        });
        if (!cancelled) setHighlightedHtml(html);
        highlighter.dispose();
      } catch {
        // Fallback: wrap in pre/code
        if (!cancelled) {
          const escaped = sourceCode!
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          setHighlightedHtml(
            `<pre class="shiki"><code>${escaped
              .split("\n")
              .map((line) => `<span class="line">${line}</span>`)
              .join("\n")}</code></pre>`
          );
        }
      }
    }

    highlight();
    return () => {
      cancelled = true;
    };
  }, [sourceCode, lang]);

  // Build a map of line -> annotations for overlay
  const lineAnnotationMap = useMemo(() => {
    const map = new Map<
      number,
      { annotationIndex: number; difficulty: Difficulty }[]
    >();
    file.annotations.forEach((ann, idx) => {
      // Find the difficulty for this annotation from the concept or fallback to file
      const difficulty = file.difficulty;
      for (let line = ann.startLine; line <= ann.endLine; line++) {
        if (!map.has(line)) map.set(line, []);
        map.get(line)!.push({ annotationIndex: idx, difficulty });
      }
    });
    return map;
  }, [file.annotations, file.difficulty]);

  // After HTML is rendered, apply annotation markers to lines
  useEffect(() => {
    if (!highlightedHtml || !codeContainerRef.current) return;

    const lines =
      codeContainerRef.current.querySelectorAll<HTMLElement>(".line");
    lines.forEach((lineEl, lineIdx) => {
      const lineNum = lineIdx + 1;
      const annotations = lineAnnotationMap.get(lineNum);
      if (annotations && annotations.length > 0) {
        const ann = annotations[0];
        const diff = ann.difficulty;
        const hue = DIFFICULTY_COLORS[diff].hue;
        lineEl.classList.add("code-annotation");
        lineEl.setAttribute("data-difficulty", diff);
        lineEl.setAttribute(
          "data-annotation-index",
          String(ann.annotationIndex)
        );
        lineEl.style.cursor = "pointer";
        lineEl.style.display = "block";
        lineEl.style.paddingLeft = "6px";
        lineEl.style.borderLeft = `3px solid ${tc.hueText(hue)}`;
        lineEl.style.marginLeft = "-3px";
      }
    });
  }, [highlightedHtml, lineAnnotationMap, isDark]);

  // Handle click on annotated lines
  const handleCodeClick = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-annotation-index]"
    );
    if (target) {
      const idx = parseInt(target.getAttribute("data-annotation-index")!, 10);
      setExpandedAnnotation(expandedAnnotation === idx ? null : idx);
    }
  };

  const tabs: { id: AnatomyTab; label: string; disabled?: boolean }[] = [
    { id: "code", label: "Code", disabled: !sourceCode },
    { id: "annotations", label: "Annotations" },
    { id: "summary", label: "Summary" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-2 border-b" style={{ borderColor: tc.divider }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            disabled={tab.disabled}
            className="relative px-3 py-1.5 text-xs font-medium rounded-md transition-all"
            style={{
              color:
                activeTab === tab.id
                  ? tc.accentText(155)
                  : tab.disabled
                    ? tc.subtle
                    : tc.muted,
              background:
                activeTab === tab.id
                  ? tc.accentBg(155)
                  : "transparent",
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="anatomy-tab-indicator"
                className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full"
                style={{ background: tc.hueText(155) }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
        {/* Annotation count badge */}
        {file.annotations.length > 0 && (
          <span
            className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
            style={{
              background: tc.hueBadgeBg(300),
              color: tc.hueBadgeText(300),
            }}
          >
            {file.annotations.length} annotation
            {file.annotations.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="wait">
          {activeTab === "code" && sourceCode && (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              {/* Code view */}
              {highlightedHtml ? (
                <div
                  ref={codeContainerRef}
                  className="p-4 font-mono text-xs leading-relaxed overflow-x-auto"
                  onClick={handleCodeClick}
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                />
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div
                    className="text-xs"
                    style={{ color: tc.hueText(155) }}
                  >
                    Loading syntax highlighting...
                  </div>
                </div>
              )}

              {/* Expanded annotation overlay */}
              <AnimatePresence>
                {expandedAnnotation !== null &&
                  file.annotations[expandedAnnotation] && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="mx-4 mb-4 p-3 rounded-lg border"
                      style={{
                        background: tc.cardBg,
                        borderColor: tc.hueBorder(DIFFICULTY_COLORS[file.difficulty].hue),
                        backdropFilter: tc.backdrop,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{
                            background: tc.hueBadgeBg(DIFFICULTY_COLORS[file.difficulty].hue),
                            color: tc.hueBadgeText(DIFFICULTY_COLORS[file.difficulty].hue),
                          }}
                        >
                          L
                          {file.annotations[expandedAnnotation].startLine}
                          {file.annotations[expandedAnnotation].endLine !==
                            file.annotations[expandedAnnotation].startLine &&
                            `\u2013${file.annotations[expandedAnnotation].endLine}`}
                        </span>
                        <span
                          className="text-[10px] font-medium"
                          style={{ color: tc.hueText(300) }}
                        >
                          {file.annotations[expandedAnnotation].conceptId}
                        </span>
                        <button
                          onClick={() => setExpandedAnnotation(null)}
                          className="ml-auto text-[10px] px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
                          style={{ color: tc.muted }}
                        >
                          Close
                        </button>
                      </div>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: tc.body }}
                      >
                        {file.annotations[expandedAnnotation].explanation}
                      </p>
                      {file.annotations[expandedAnnotation].docUrl && (
                        <a
                          href={file.annotations[expandedAnnotation].docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-[10px] underline transition-opacity hover:opacity-80"
                          style={{ color: tc.accentText(220) }}
                        >
                          View documentation
                        </a>
                      )}
                    </motion.div>
                  )}
              </AnimatePresence>

              {/* Annotation legend on hover */}
              <AnimatePresence>
                {hoveredAnnotation !== null &&
                  file.annotations[hoveredAnnotation] && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed z-50 px-2.5 py-1.5 rounded-md shadow-lg text-[10px] max-w-xs pointer-events-none"
                      style={{
                        background: tc.sectionBg,
                        border: `1px solid ${tc.divider}`,
                        color: tc.body,
                      }}
                    >
                      {file.annotations[hoveredAnnotation].explanation.slice(
                        0,
                        120
                      )}
                      ...
                    </motion.div>
                  )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === "annotations" && (
            <motion.div
              key="annotations"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="p-4 space-y-3"
            >
              {file.annotations.length === 0 ? (
                <p
                  className="text-xs text-center py-8"
                  style={{ color: tc.muted }}
                >
                  No annotations for this file.
                </p>
              ) : (
                file.annotations.map((ann, i) => {
                  const hue = DIFFICULTY_COLORS[file.difficulty].hue;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-3 rounded-lg border space-y-2"
                      style={{
                        background: tc.panelBg,
                        borderColor: tc.divider,
                        borderLeft: `3px solid ${tc.hueText(hue)}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{
                            background: tc.hueBadgeBg(hue),
                            color: tc.hueBadgeText(hue),
                          }}
                        >
                          L{ann.startLine}
                          {ann.endLine !== ann.startLine &&
                            `\u2013${ann.endLine}`}
                        </span>
                        <span
                          className="text-[10px] font-medium"
                          style={{ color: tc.hueText(300) }}
                        >
                          {ann.conceptId}
                        </span>
                      </div>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: tc.body }}
                      >
                        {ann.explanation}
                      </p>
                      {ann.docUrl && (
                        <a
                          href={ann.docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] underline transition-opacity hover:opacity-80"
                          style={{ color: tc.accentText(220) }}
                        >
                          View documentation
                        </a>
                      )}
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {activeTab === "summary" && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="p-4 space-y-4"
            >
              <div className="space-y-1.5">
                <h3
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: tc.hueText(155) }}
                >
                  Overview
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: tc.body }}
                >
                  {file.summary}
                </p>
              </div>

              {file.concepts.length > 0 && (
                <div className="space-y-2">
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: tc.hueText(155) }}
                  >
                    Concepts Used
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {file.concepts.map((conceptId) => (
                      <span
                        key={conceptId}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{
                          background: tc.tagBg,
                          color: tc.tagText,
                          boxShadow: tc.hueGlow(300),
                        }}
                      >
                        {conceptId}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div
                  className="p-3 rounded-lg text-center"
                  style={{
                    background: tc.panelBg,
                    border: `1px solid ${tc.divider}`,
                  }}
                >
                  <div
                    className="text-lg font-semibold font-mono"
                    style={{ color: tc.accentText(155) }}
                  >
                    {file.lines}
                  </div>
                  <div
                    className="text-[10px] uppercase tracking-wider"
                    style={{ color: tc.muted }}
                  >
                    Lines
                  </div>
                </div>
                <div
                  className="p-3 rounded-lg text-center"
                  style={{
                    background: tc.panelBg,
                    border: `1px solid ${tc.divider}`,
                  }}
                >
                  <div
                    className="text-lg font-semibold font-mono"
                    style={{ color: tc.accentText(220) }}
                  >
                    {file.annotations.length}
                  </div>
                  <div
                    className="text-[10px] uppercase tracking-wider"
                    style={{ color: tc.muted }}
                  >
                    Annotations
                  </div>
                </div>
                <div
                  className="p-3 rounded-lg text-center"
                  style={{
                    background: tc.panelBg,
                    border: `1px solid ${tc.divider}`,
                  }}
                >
                  <div
                    className="text-lg font-semibold font-mono"
                    style={{ color: tc.accentText(300) }}
                  >
                    {file.concepts.length}
                  </div>
                  <div
                    className="text-[10px] uppercase tracking-wider"
                    style={{ color: tc.muted }}
                  >
                    Concepts
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
