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

  return (
    <>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <motion.div
        layout
        onClick={() => {
          setExpanded(!expanded);
          setSelectedConcept(concept.id);
        }}
        className="cursor-pointer rounded-xl p-3 min-w-[180px] max-w-[260px] border border-white/10"
        style={{
          background: `oklch(0.12 0.02 ${hue} / 80%)`,
          backdropFilter: "blur(12px)",
          boxShadow: `0 0 20px oklch(0.5 0.12 ${hue} / 15%), inset 0 1px 0 oklch(1 0 0 / 5%)`,
        }}
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-sm font-semibold truncate"
              style={{ color: `oklch(0.9 0.08 ${hue})` }}
            >
              {concept.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: `oklch(0.25 0.04 ${hue} / 60%)`,
                color: `oklch(0.8 0.1 ${hue})`,
              }}
            >
              {label}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-muted-foreground">
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
                <p className="text-[11px] text-foreground/60 leading-relaxed mt-1.5">
                  {concept.explanation}
                </p>
                {concept.docUrl && (
                  <a
                    href={concept.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] mt-1 inline-block underline"
                    style={{ color: `oklch(0.7 0.1 220)` }}
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
          stroke: `oklch(0.5 0.1 ${relColor})`,
          strokeWidth: 1.5,
        },
        label: e.relationship,
        labelStyle: {
          fill: "oklch(0.6 0 0)",
          fontSize: 9,
        },
      };
    });

    return { nodes: allNodes, edges: allEdges };
  }, [concepts, conceptEdges]);

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
        <Background color="oklch(0.3 0 0 / 30%)" gap={20} size={1} />
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
                style={{ background: `oklch(0.7 0.15 ${hue})` }}
              />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
