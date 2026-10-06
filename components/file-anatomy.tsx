"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
        lineEl.style.borderLeft = `3px solid oklch(0.7 0.15 ${hue})`;
        lineEl.style.marginLeft = "-3px";
      }
    });
  }, [highlightedHtml, lineAnnotationMap]);

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
      <div className="flex items-center gap-1 px-4 pt-3 pb-2 border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            disabled={tab.disabled}
            className="relative px-3 py-1.5 text-xs font-medium rounded-md transition-all"
            style={{
              color:
                activeTab === tab.id
                  ? "oklch(0.9 0.05 155)"
                  : tab.disabled
                    ? "oklch(0.35 0 0)"
                    : "oklch(0.6 0 0)",
              background:
                activeTab === tab.id
                  ? "oklch(0.2 0.04 155 / 50%)"
                  : "transparent",
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="anatomy-tab-indicator"
                className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full"
                style={{ background: "oklch(0.7 0.15 155)" }}
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
              background: "oklch(0.2 0.04 300 / 40%)",
              color: "oklch(0.75 0.1 300)",
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
                    style={{ color: "oklch(0.5 0.05 155)" }}
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
                        background: "oklch(0.12 0.02 260 / 90%)",
                        borderColor: `oklch(0.4 0.1 ${DIFFICULTY_COLORS[file.difficulty].hue} / 40%)`,
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{
                            background: `oklch(0.2 0.04 ${DIFFICULTY_COLORS[file.difficulty].hue} / 60%)`,
                            color: `oklch(0.8 0.12 ${DIFFICULTY_COLORS[file.difficulty].hue})`,
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
                          style={{ color: "oklch(0.7 0.08 300)" }}
                        >
                          {file.annotations[expandedAnnotation].conceptId}
                        </span>
                        <button
                          onClick={() => setExpandedAnnotation(null)}
                          className="ml-auto text-[10px] px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
                          style={{ color: "oklch(0.5 0 0)" }}
                        >
                          Close
                        </button>
                      </div>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "oklch(0.8 0.02 260)" }}
                      >
                        {file.annotations[expandedAnnotation].explanation}
                      </p>
                      {file.annotations[expandedAnnotation].docUrl && (
                        <a
                          href={file.annotations[expandedAnnotation].docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-[10px] underline transition-opacity hover:opacity-80"
                          style={{ color: "oklch(0.7 0.12 220)" }}
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
                        background: "oklch(0.15 0.02 260 / 95%)",
                        border: "1px solid oklch(0.3 0.05 260)",
                        color: "oklch(0.8 0.02 260)",
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
                  style={{ color: "oklch(0.5 0 0)" }}
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
                        background: "oklch(0.1 0.01 260 / 40%)",
                        borderColor: "oklch(0.25 0.02 260)",
                        borderLeft: `3px solid oklch(0.7 0.15 ${hue})`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{
                            background: `oklch(0.2 0.04 ${hue} / 60%)`,
                            color: `oklch(0.8 0.12 ${hue})`,
                          }}
                        >
                          L{ann.startLine}
                          {ann.endLine !== ann.startLine &&
                            `\u2013${ann.endLine}`}
                        </span>
                        <span
                          className="text-[10px] font-medium"
                          style={{ color: "oklch(0.7 0.08 300)" }}
                        >
                          {ann.conceptId}
                        </span>
                      </div>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "oklch(0.75 0.02 260)" }}
                      >
                        {ann.explanation}
                      </p>
                      {ann.docUrl && (
                        <a
                          href={ann.docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] underline transition-opacity hover:opacity-80"
                          style={{ color: "oklch(0.7 0.12 220)" }}
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
                  style={{ color: "oklch(0.55 0.05 155)" }}
                >
                  Overview
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "oklch(0.8 0.02 260)" }}
                >
                  {file.summary}
                </p>
              </div>

              {file.concepts.length > 0 && (
                <div className="space-y-2">
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "oklch(0.55 0.05 155)" }}
                  >
                    Concepts Used
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {file.concepts.map((conceptId) => (
                      <span
                        key={conceptId}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{
                          background: "oklch(0.2 0.04 300 / 50%)",
                          color: "oklch(0.8 0.1 300)",
                          boxShadow: "0 0 8px oklch(0.6 0.1 300 / 15%)",
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
                    background: "oklch(0.1 0.01 260 / 40%)",
                    border: "1px solid oklch(0.25 0.02 260)",
                  }}
                >
                  <div
                    className="text-lg font-semibold font-mono"
                    style={{ color: "oklch(0.85 0.08 155)" }}
                  >
                    {file.lines}
                  </div>
                  <div
                    className="text-[10px] uppercase tracking-wider"
                    style={{ color: "oklch(0.5 0 0)" }}
                  >
                    Lines
                  </div>
                </div>
                <div
                  className="p-3 rounded-lg text-center"
                  style={{
                    background: "oklch(0.1 0.01 260 / 40%)",
                    border: "1px solid oklch(0.25 0.02 260)",
                  }}
                >
                  <div
                    className="text-lg font-semibold font-mono"
                    style={{ color: "oklch(0.85 0.08 220)" }}
                  >
                    {file.annotations.length}
                  </div>
                  <div
                    className="text-[10px] uppercase tracking-wider"
                    style={{ color: "oklch(0.5 0 0)" }}
                  >
                    Annotations
                  </div>
                </div>
                <div
                  className="p-3 rounded-lg text-center"
                  style={{
                    background: "oklch(0.1 0.01 260 / 40%)",
                    border: "1px solid oklch(0.25 0.02 260)",
                  }}
                >
                  <div
                    className="text-lg font-semibold font-mono"
                    style={{ color: "oklch(0.85 0.08 300)" }}
                  >
                    {file.concepts.length}
                  </div>
                  <div
                    className="text-[10px] uppercase tracking-wider"
                    style={{ color: "oklch(0.5 0 0)" }}
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
