"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useStore } from "@/lib/store";
import { themeColors } from "@/lib/theme-colors";
import type { AnalysisTab } from "@/lib/types";

const TABS: { id: AnalysisTab; icon: string; label: string; color: string }[] =
  [
    { id: "pipeline", icon: "⊞", label: "Pipeline", color: "260" },
    { id: "techmap", icon: "◎", label: "Tech Map", color: "195" },
    { id: "files", icon: "{ }", label: "Files", color: "155" },
    { id: "concepts", icon: "◇", label: "Concepts", color: "300" },
    { id: "decisions", icon: "⚖", label: "Decisions", color: "80" },
    { id: "learning", icon: "▶", label: "Learn", color: "25" },
  ];

export function AnalysisTabs() {
  const { activeTab, setActiveTab } = useStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tc = themeColors(isDark);

  return (
    <div className="flex justify-center">
      <div className="glass rounded-xl p-1.5 flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative px-5 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5"
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 rounded-lg"
                style={{
                  background: tc.accentBg(tab.color),
                  boxShadow: tc.hueGlow(tab.color),
                }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span
              className="relative z-10"
              style={{
                color:
                  activeTab === tab.id
                    ? tc.accentText(tab.color)
                    : undefined,
              }}
            >
              {tab.icon}
            </span>
            <span
              className={`relative z-10 ${
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
