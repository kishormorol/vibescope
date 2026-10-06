"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import type { AnalyzedFile, Difficulty } from "@/lib/types";
import { FileAnatomy } from "./file-anatomy";

const DIFFICULTY_COLORS: Record<Difficulty, { hue: string; label: string }> = {
  beginner: { hue: "155", label: "Beginner" },
  intermediate: { hue: "80", label: "Intermediate" },
  advanced: { hue: "25", label: "Advanced" },
};

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
  file?: AnalyzedFile;
}

function buildTree(files: AnalyzedFile[]): TreeNode[] {
  const root: TreeNode = { name: "", path: "", isDir: true, children: [] };

  for (const file of files) {
    const parts = file.path.replace(/\\/g, "/").split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const existingChild = current.children.find((c) => c.name === part);

      if (existingChild) {
        current = existingChild;
        if (isLast) {
          existingChild.file = file;
          existingChild.isDir = false;
        }
      } else {
        const node: TreeNode = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          isDir: !isLast,
          children: [],
          file: isLast ? file : undefined,
        };
        current.children.push(node);
        current = node;
      }
    }
  }

  // Sort: directories first, then alphabetical
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(root.children);

  return root.children;
}

function TreeItem({
  node,
  depth,
  selectedFile,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedFile: string | null;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const diff = node.file?.difficulty;
  const diffColor = diff ? DIFFICULTY_COLORS[diff] : null;

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1.5 py-1 px-2 rounded-md text-xs hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <span
            className="transition-transform duration-200"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ▸
          </span>
          <span className="opacity-60">📁</span>
          <span className="truncate">{node.name}</span>
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {node.children.map((child) => (
                <TreeItem
                  key={child.path}
                  node={child}
                  depth={depth + 1}
                  selectedFile={selectedFile}
                  onSelect={onSelect}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const isSelected = selectedFile === node.file?.path;

  return (
    <button
      onClick={() => node.file && onSelect(node.file.path)}
      className="w-full flex items-center gap-1.5 py-1 px-2 rounded-md text-xs transition-all"
      style={{
        paddingLeft: `${depth * 12 + 8}px`,
        background: isSelected
          ? `oklch(0.2 0.04 ${diffColor?.hue ?? "155"} / 50%)`
          : undefined,
        color: isSelected
          ? `oklch(0.85 0.12 ${diffColor?.hue ?? "155"})`
          : undefined,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          background: diffColor
            ? `oklch(0.7 0.15 ${diffColor.hue})`
            : "oklch(0.5 0 0)",
        }}
      />
      <span className="truncate">{node.name}</span>
      {node.file && (
        <span className="ml-auto text-[10px] text-muted-foreground opacity-60">
          {node.file.lines}L
        </span>
      )}
    </button>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const { hue, label } = DIFFICULTY_COLORS[difficulty];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{
        background: `oklch(0.2 0.04 ${hue} / 60%)`,
        color: `oklch(0.8 0.12 ${hue})`,
        boxShadow: `0 0 8px oklch(0.6 0.12 ${hue} / 20%)`,
      }}
    >
      {label}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-muted-foreground border border-white/10">
      {category}
    </span>
  );
}

export function FileExplorer() {
  const { analysis, selectedFile, setSelectedFile, setSelectedConcept } =
    useStore();

  const files = analysis?.files ?? [];
  const tree = useMemo(() => buildTree(files), [files]);
  const selected = useMemo(
    () => files.find((f) => f.path === selectedFile),
    [files, selectedFile]
  );

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">
          No analysis yet. Analyze a repository to explore files.
        </p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">No files found in the analysis.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[280px_1fr] gap-4 h-[600px]">
      {/* Left sidebar: file tree */}
      <div className="glass rounded-xl overflow-hidden flex flex-col">
        <div className="px-3 py-2.5 border-b border-white/5">
          <h3
            className="text-xs font-semibold tracking-wider uppercase"
            style={{ color: "oklch(0.7 0.1 155)" }}
          >
            Files ({files.length})
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-1 space-y-px scrollbar-thin">
          {tree.map((node) => (
            <TreeItem
              key={node.path}
              node={node}
              depth={0}
              selectedFile={selectedFile}
              onSelect={setSelectedFile}
            />
          ))}
        </div>
      </div>

      {/* Right panel: file details */}
      <div className="glass rounded-xl overflow-hidden">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.path}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col h-full overflow-hidden"
            >
              {/* Header */}
              <div className="space-y-2 px-5 pt-5 pb-3 border-b border-white/5 shrink-0">
                <h2 className="text-lg font-semibold text-foreground font-mono">
                  {selected.path}
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-muted-foreground border border-white/10">
                    {selected.language}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selected.lines} lines
                  </span>
                  <DifficultyBadge difficulty={selected.difficulty} />
                  <CategoryBadge category={selected.category} />
                </div>
              </div>

              {/* File Anatomy */}
              <div className="flex-1 overflow-hidden">
                <FileAnatomy
                  file={selected}
                  sourceCode={selected.sourceCode}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="text-center space-y-2">
                <div className="text-3xl opacity-30">{ }</div>
                <p className="text-sm text-muted-foreground">
                  Select a file to view details
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
