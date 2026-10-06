"use client";

import {
  ReactFlow,
  Controls,
  Background,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import type { PipelineStage } from "@/lib/types";

// ─── Color palette cycling by stage order ───
const STAGE_HUES = [260, 195, 155, 300, 80, 25];

function hueForOrder(order: number) {
  return STAGE_HUES[order % STAGE_HUES.length];
}

// ─── Custom Node ────────────────────────────
interface PipelineNodeData {
  stage: PipelineStage;
  hue: number;
  index: number;
}

function PipelineNode({ data }: { data: PipelineNodeData }) {
  const { stage, hue, index } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
      className="glass rounded-2xl p-4 w-[240px] group cursor-default"
      style={{
        borderColor: `oklch(0.55 0.12 ${hue} / 30%)`,
        borderWidth: 1,
        borderStyle: "solid",
        background: `linear-gradient(135deg, oklch(0.15 0.03 ${hue} / 70%), oklch(0.1 0.01 ${hue} / 50%))`,
        transition: "box-shadow 0.3s ease",
      }}
      whileHover={{
        boxShadow: `0 0 30px oklch(0.6 0.15 ${hue} / 25%), 0 0 60px oklch(0.5 0.1 ${hue} / 10%)`,
      }}
    >
      {/* Target handle (left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !border-2 !rounded-full"
        style={{
          background: `oklch(0.6 0.15 ${hue})`,
          borderColor: `oklch(0.3 0.05 ${hue})`,
        }}
      />

      {/* Icon */}
      <div className="text-3xl mb-2 select-none">{stage.icon}</div>

      {/* Label */}
      <div
        className="font-bold text-sm mb-1"
        style={{ color: `oklch(0.85 0.1 ${hue})` }}
      >
        {stage.label}
      </div>

      {/* Description */}
      <p
        className="text-[11px] leading-relaxed mb-3 font-mono"
        style={{ color: `oklch(0.6 0.03 ${hue})` }}
      >
        {stage.description}
      </p>

      {/* Technology badges */}
      {stage.technologiesUsed.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {stage.technologiesUsed.map((tech) => (
            <span
              key={tech}
              className="px-1.5 py-0.5 rounded-md text-[10px] font-mono"
              style={{
                background: `oklch(0.25 0.06 ${hue} / 60%)`,
                color: `oklch(0.75 0.1 ${hue})`,
                border: `1px solid oklch(0.4 0.08 ${hue} / 30%)`,
              }}
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* Files count badge */}
      <div
        className="text-[10px] font-mono mt-1"
        style={{ color: `oklch(0.5 0.04 ${hue})` }}
      >
        {stage.filesInvolved.length} file
        {stage.filesInvolved.length !== 1 ? "s" : ""} involved
      </div>

      {/* Source handle (right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !border-2 !rounded-full"
        style={{
          background: `oklch(0.6 0.15 ${hue})`,
          borderColor: `oklch(0.3 0.05 ${hue})`,
        }}
      />
    </motion.div>
  );
}

const nodeTypes = { pipeline: PipelineNode };

// ─── Main Component ─────────────────────────
export function PipelineView() {
  const analysis = useStore((s) => s.analysis);
  const pipeline = analysis?.pipeline;

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!pipeline || pipeline.length === 0) {
      return { initialNodes: [], initialEdges: [] };
    }

    const sorted = [...pipeline].sort((a, b) => a.order - b.order);

    const nodes = sorted.map((stage, i) => ({
      id: stage.id,
      type: "pipeline" as const,
      position: { x: i * 300, y: 0 },
      data: {
        stage,
        hue: hueForOrder(stage.order),
        index: i,
      },
    }));

    const edges = sorted.slice(0, -1).map((stage, i) => {
      const nextStage = sorted[i + 1];
      const hue = hueForOrder(stage.order);
      return {
        id: `${stage.id}-${nextStage.id}`,
        source: stage.id,
        target: nextStage.id,
        animated: true,
        style: {
          stroke: `oklch(0.5 0.12 ${hue})`,
          strokeWidth: 2,
          strokeDasharray: "6 4",
        },
        className: "animate-flow",
      };
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [pipeline]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when data changes (useNodesState only uses initialValue once)
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Empty state
  if (!analysis || !pipeline || pipeline.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="glass rounded-2xl px-8 py-6 text-center">
          <div className="text-3xl mb-3">⊞</div>
          <p
            className="text-sm font-mono"
            style={{ color: "oklch(0.5 0.02 260)" }}
          >
            No pipeline data available.
          </p>
          <p
            className="text-xs font-mono mt-1"
            style={{ color: "oklch(0.4 0.01 260)" }}
          >
            Analyze a codebase to see its build journey.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        style={{ background: "oklch(0.08 0.01 260)" }}
      >
        <Controls
          className="!bg-white/5 !border-white/10 !rounded-lg [&_button]:!bg-white/5 [&_button]:!border-white/10 [&_button]:!fill-white/50 [&_button:hover]:!bg-white/10"
        />
        <Background color="oklch(0.2 0.02 260)" gap={24} size={1} />
      </ReactFlow>
    </div>
  );
}
