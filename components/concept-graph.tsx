"use client";

import { useMemo, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { themeColors } from "@/lib/theme-colors";
import type { Concept, Difficulty } from "@/lib/types";

const DIFFICULTY_COLORS: Record<Difficulty, { hue: string; label: string }> = {
  beginner: { hue: "155", label: "Beginner" },
  intermediate: { hue: "80", label: "Intermediate" },
  advanced: { hue: "25", label: "Advanced" },
};

const DIFFICULTY_RANK: Record<Difficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

interface ConceptNodeData {
  concept: Concept;
  [key: string]: unknown;
}

function ConceptNodeComponent({ data }: NodeProps<Node<ConceptNodeData>>) {
  const [expanded, setExpanded] = useState(false);
  const concept = data.concept;
  const { hue, label } = DIFFICULTY_COLORS[concept.difficulty];
  const setSelectedConcept = useStore((s) => s.setSelectedConcept);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tc = themeColors(isDark);

  return (
    <>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <motion.div
        layout
        onClick={() => {
          setExpanded(!expanded);
          setSelectedConcept(concept.id);
        }}
        className="cursor-pointer rounded-xl p-3 min-w-[180px] max-w-[260px]"
        style={{
          background: tc.hueBg(hue, 0.8),
          backdropFilter: tc.backdrop,
          boxShadow: tc.hueGlow(hue, 0.15),
          border: `1px solid ${tc.borderWhite}`,
        }}
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-sm font-semibold truncate"
              style={{ color: tc.hueText(hue) }}
            >
              {concept.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: tc.hueBadgeBg(hue),
                color: tc.hueBadgeText(hue),
              }}
            >
              {label}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{
                background: tc.white(0.05),
                color: tc.muted,
              }}
            >
              {concept.category}
            </span>
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p
                  className="text-xs leading-relaxed mt-1.5"
                  style={{ color: tc.body }}
                >
                  {concept.explanation}
                </p>
                {concept.docUrl && (
                  <a
                    href={concept.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs mt-1 inline-block underline"
                    style={{ color: tc.hueText(220) }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Docs
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </>
  );
}

const nodeTypes = { concept: ConceptNodeComponent };

export function ConceptGraph() {
  const { analysis, setSelectedConcept } = useStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tc = themeColors(isDark);

  const concepts = analysis?.concepts ?? [];
  const conceptEdges = analysis?.conceptEdges ?? [];

  const { nodes, edges } = useMemo(() => {
    if (concepts.length === 0) return { nodes: [], edges: [] };

    // Group by difficulty for hierarchical layout
    const groups: Record<Difficulty, Concept[]> = {
      beginner: [],
      intermediate: [],
      advanced: [],
    };
    concepts.forEach((c) => groups[c.difficulty].push(c));

    const allNodes: Node<ConceptNodeData>[] = [];
    const yOffsets: Record<Difficulty, number> = {
      beginner: 0,
      intermediate: 250,
      advanced: 500,
    };

    for (const diff of ["beginner", "intermediate", "advanced"] as Difficulty[]) {
      const group = groups[diff];
      const totalWidth = group.length * 240;
      const startX = -totalWidth / 2;

      group.forEach((concept, i) => {
        allNodes.push({
          id: concept.id,
          type: "concept",
          position: { x: startX + i * 240, y: yOffsets[diff] },
          data: { concept },
        });
      });
    }

    const allEdges: Edge[] = conceptEdges.map((e, i) => {
      const relColor =
        e.relationship === "prerequisite"
          ? "155"
          : e.relationship === "builds-on"
          ? "80"
          : "260";
      return {
        id: `edge-${i}`,
        source: e.from,
        target: e.to,
        animated: e.relationship === "prerequisite",
        style: {
          stroke: tc.hueText(relColor),
          strokeWidth: 1.5,
        },
        label: e.relationship,
        labelStyle: {
          fill: tc.muted,
          fontSize: 9,
        },
      };
    });

    return { nodes: allNodes, edges: allEdges };
  }, [concepts, conceptEdges, tc]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedConcept(node.id);
    },
    [setSelectedConcept]
  );

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">
          No analysis yet. Analyze a repository to view the concept graph.
        </p>
      </div>
    );
  }

  if (concepts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">
          No concepts found in the analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden h-[600px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
        style={{ background: "transparent" }}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background color={isDark ? "oklch(0.3 0 0 / 30%)" : "oklch(0.7 0 0 / 20%)"} gap={20} size={1} />
        <Controls
          showInteractive={false}
          className="[&>button]:!bg-white/5 [&>button]:!border-white/10 [&>button]:!text-foreground [&>button]:!fill-foreground"
        />
      </ReactFlow>
      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass rounded-lg p-2.5 flex items-center gap-3">
        {(["beginner", "intermediate", "advanced"] as Difficulty[]).map((d) => {
          const { hue, label } = DIFFICULTY_COLORS[d];
          return (
            <div key={d} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: tc.hueText(hue) }}
              />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
