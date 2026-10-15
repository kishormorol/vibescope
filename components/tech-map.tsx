"use client";

import { useMemo, useState, useCallback } from "react";
import {
  ReactFlow,
  Controls,
  Background,
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
import type { Technology, TechCategory } from "@/lib/types";

/* ─── Category color hues (oklch) ─── */
const CATEGORY_HUE: Record<TechCategory, number> = {
  framework: 260,
  language: 80,
  styling: 195,
  state: 300,
  visualization: 155,
  animation: 320,
  api: 40,
  tooling: 220,
  deployment: 140,
  database: 100,
  testing: 0,
};

const CATEGORY_LABEL: Record<TechCategory, string> = {
  framework: "Framework",
  language: "Language",
  styling: "Styling",
  state: "State Mgmt",
  visualization: "Visualization",
  animation: "Animation",
  api: "API",
  tooling: "Tooling",
  deployment: "Deployment",
  database: "Database",
  testing: "Testing",
};

function hue(category: TechCategory) {
  return CATEGORY_HUE[category] ?? 220;
}

/* ─── Central project node ─── */
function CenterNode(_props: NodeProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tc = themeColors(isDark);

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
      className="relative flex items-center justify-center"
    >
      <div
        className="w-28 h-28 rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle, ${tc.accentBg(260)} 0%, ${tc.cardBg} 100%)`,
          border: `1px solid ${tc.hueBorder(260, 0.3)}`,
          boxShadow: tc.shadowActive(260),
        }}
      >
        <div className="text-center">
          <div className="text-2xl mb-0.5">◎</div>
          <div
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: tc.accentText(260) }}
          >
            Project
          </div>
        </div>
      </div>
      {/* Handles on all sides for edges */}
      <Handle type="source" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" id="bottom" />
      <Handle type="source" position={Position.Left} className="!bg-transparent !border-0 !w-0 !h-0" id="left" />
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-0 !w-0 !h-0" id="right" />
    </motion.div>
  );
}

/* ─── Tech node (custom) ─── */
function TechNode({ data }: NodeProps) {
  const [expanded, setExpanded] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tc = themeColors(isDark);
  const tech = data.tech as Technology;
  const h = hue(tech.category);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        bounce: 0.3,
        duration: 0.6,
        delay: (data.index as number) * 0.04,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-0 !w-0 !h-0"
      />

      <div
        className="rounded-xl px-4 py-3 cursor-pointer select-none transition-all duration-200"
        style={{
          background: tc.hueBg(h, 0.85),
          border: `1px solid ${tc.hueBorder(h, 0.3)}`,
          boxShadow: expanded
            ? tc.shadowActive(h)
            : tc.hueGlow(h, 0.12),
          backdropFilter: tc.backdrop,
          minWidth: 160,
          maxWidth: 260,
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-1.5">
          {tech.icon && <span className="text-lg">{tech.icon}</span>}
          <span
            className="font-semibold text-base leading-tight"
            style={{ color: tc.hueText(h) }}
          >
            {tech.name}
          </span>
        </div>

        {/* Category badge + version */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <span
            className="text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
            style={{
              background: tc.hueBadgeBg(h),
              color: tc.hueBadgeText(h),
            }}
          >
            {CATEGORY_LABEL[tech.category]}
          </span>
          {tech.version && (
            <span
              className="text-[11px] font-mono px-1.5 py-0.5 rounded-md"
              style={{
                background: tc.white(0.05),
                color: tc.muted,
              }}
            >
              v{tech.version}
            </span>
          )}
        </div>

        {/* Description (always visible, truncated unless expanded) */}
        <p
          className="text-xs leading-relaxed mt-1"
          style={{
            color: tc.body,
            display: "-webkit-box",
            WebkitLineClamp: expanded ? 99 : 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {tech.description}
        </p>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              {/* Why chosen */}
              <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${tc.hueBorder(h, 0.4)}` }}>
                <div
                  className="text-[11px] uppercase tracking-wider font-bold mb-0.5"
                  style={{ color: tc.accentText(h) }}
                >
                  Why chosen
                </div>
                <p className="text-xs leading-relaxed" style={{ color: tc.body }}>
                  {tech.whyChosen}
                </p>
              </div>

              {/* Links: docs plus real npm / source pages when it's a dependency */}
              {(tech.docsUrl || tech.packageUrl || tech.repoUrl) && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: "Docs", url: tech.docsUrl },
                    {
                      label: tech.registry === "pypi" ? "PyPI" : "npm",
                      url: tech.packageUrl,
                    },
                    { label: "Source", url: tech.repoUrl },
                  ]
                    .filter((l) => l.url)
                    .map((l) => (
                      <a
                        key={l.label}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-colors"
                        style={{
                          background: tc.hueBadgeBg(h),
                          color: tc.accentText(h),
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.background = tc.accentBg(h);
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.background = tc.hueBadgeBg(h);
                        }}
                      >
                        {l.label} &rarr;
                      </a>
                    ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Handle
        type="target"
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-0 !h-0"
        id="bottom"
      />
    </motion.div>
  );
}

/* ─── Node types registry ─── */
const nodeTypes = {
  center: CenterNode,
  tech: TechNode,
};

/* ─── Layout: radial arrangement grouped by category ─── */
function buildLayout(technologies: Technology[], tc: ReturnType<typeof themeColors>) {
  const centerX = 0;
  const centerY = 0;

  // Group by category
  const groups = new Map<TechCategory, Technology[]>();
  for (const t of technologies) {
    const list = groups.get(t.category) ?? [];
    list.push(t);
    groups.set(t.category, list);
  }

  const categories = Array.from(groups.keys());
  const totalCategories = categories.length;

  const nodes: Node[] = [
    {
      id: "center",
      type: "center",
      position: { x: centerX - 56, y: centerY - 56 },
      data: {},
      draggable: true,
    },
  ];

  const edges: Edge[] = [];
  let globalIndex = 0;

  categories.forEach((cat, catIdx) => {
    const techs = groups.get(cat)!;
    const categoryAngleStart = (catIdx / totalCategories) * 2 * Math.PI - Math.PI / 2;
    const categoryAngleSpan = (1 / totalCategories) * 2 * Math.PI;
    const h = hue(cat);

    techs.forEach((tech, techIdx) => {
      const angleOffset =
        techs.length === 1
          ? categoryAngleSpan / 2
          : (techIdx / (techs.length - 1)) * categoryAngleSpan * 0.7 +
            categoryAngleSpan * 0.15;
      const angle = categoryAngleStart + angleOffset;

      // Vary radius slightly per item so they don't overlap
      const baseRadius = 320;
      const radiusJitter = techs.length > 1 ? (techIdx % 2 === 0 ? 0 : 60) : 0;
      const radius = baseRadius + radiusJitter;

      const x = centerX + Math.cos(angle) * radius - 80;
      const y = centerY + Math.sin(angle) * radius - 40;

      nodes.push({
        id: tech.id,
        type: "tech",
        position: { x, y },
        data: { tech, index: globalIndex },
        draggable: true,
      });

      edges.push({
        id: `center-${tech.id}`,
        source: "center",
        target: tech.id,
        style: {
          stroke: tc.hueText(h),
          strokeWidth: 1.5,
        },
        animated: true,
      });

      globalIndex++;
    });
  });

  return { nodes, edges };
}

/* ─── Main component ─── */
export function TechMap() {
  const analysis = useStore((s) => s.analysis);
  const technologies = analysis?.technologies ?? [];
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tc = themeColors(isDark);

  const { nodes, edges } = useMemo(
    () => buildLayout(technologies, tc),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [technologies, isDark]
  );

  const onInit = useCallback((instance: { fitView: () => void }) => {
    setTimeout(() => instance.fitView(), 100);
  }, []);

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-4xl mb-3 opacity-30">◎</div>
          <p className="text-sm" style={{ color: tc.muted }}>
            No analysis data yet.
          </p>
          <p className="text-xs mt-1" style={{ color: tc.subtle }}>
            Analyze a codebase to see its technology map.
          </p>
        </motion.div>
      </div>
    );
  }

  if (technologies.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-4xl mb-3 opacity-30">◎</div>
          <p className="text-sm" style={{ color: tc.muted }}>
            No technologies detected.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-[700px] rounded-2xl overflow-hidden"
      style={{
        background: tc.panelBg,
        border: `1px solid ${tc.divider}`,
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        minZoom={0.3}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: "default",
        }}
      >
        <Controls
          className={isDark
            ? "!bg-black/40 !border-white/10 !rounded-lg [&>button]:!bg-black/50 [&>button]:!border-white/10 [&>button]:!text-white/60 [&>button:hover]:!bg-white/10"
            : "!bg-white/60 !border-black/10 !rounded-lg [&>button]:!bg-white/70 [&>button]:!border-black/10 [&>button]:!text-black/50 [&>button:hover]:!bg-black/5"
          }
          showInteractive={false}
        />
        <Background
          color={isDark ? "oklch(0.3 0.02 260 / 20%)" : "oklch(0.7 0.02 260 / 15%)"}
          gap={40}
          size={1}
        />
      </ReactFlow>
    </motion.div>
  );
}
