"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function HomePage() {
  const { repoUrl, setRepoUrl, setApiKey, setAnalysis } = useStore();
  const router = useRouter();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");

  const handleAnalyze = () => {
    if (!repoUrl.trim()) return;
    setShowApiKeyModal(true);
  };

  const handleStartAnalysis = () => {
    setApiKey(tempApiKey);
    setShowApiKeyModal(false);
    router.push("/analyze");
  };

  const handleDemo = async () => {
    try {
      const res = await fetch("/demo/thinkdiff-analysis.json");
      if (!res.ok) {
        console.error("Demo fetch failed:", res.status, res.statusText);
        return;
      }
      const data = await res.json();
      useStore.getState().setAnalysis(data);
      router.push("/analyze");
    } catch (err) {
      console.error("Demo load error:", err);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center space-y-8 max-w-3xl"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Explore any AI-built codebase
          </span>
        </motion.div>

        {/* Title */}
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tighter">
          <span className="bg-gradient-to-r from-[oklch(0.75_0.18_260)] via-[oklch(0.8_0.15_195)] to-[oklch(0.72_0.17_155)] bg-clip-text text-transparent">
            Vibe
          </span>
          <span className="text-foreground/30">Scope</span>
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
        >
          See how your code was built. Interactive visualization of the entire
          SWE pipeline — technologies, concepts, decisions, and learning paths.
        </motion.p>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
        >
          <div className="flex-1 relative">
            <Input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="github.com/user/repo"
              className="h-12 pl-4 pr-4 rounded-xl glass border-[oklch(0.25_0.03_260_/_50%)] text-sm font-mono focus:glow-primary transition-all"
            />
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={!repoUrl.trim()}
            className="h-12 px-8 rounded-xl font-semibold text-sm relative overflow-hidden group"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.55 0.18 260), oklch(0.6 0.15 195))",
            }}
          >
            <span className="relative z-10">Analyze</span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </motion.div>

        {/* Demo button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <button
            onClick={handleDemo}
            className="inline-flex items-center gap-3 px-5 py-3 rounded-xl glass hover:glow-cyan transition-all group text-sm"
          >
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
              Try Demo
            </span>
            <span className="text-xs text-muted-foreground/50">
              ThinkDiff (8K lines)
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </button>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-wrap justify-center gap-2 pt-4"
        >
          {[
            { icon: "⊞", label: "Pipeline View", color: "260" },
            { icon: "◎", label: "Tech Map", color: "195" },
            { icon: "{ }", label: "Code Anatomy", color: "155" },
            { icon: "◇", label: "Concept Graph", color: "300" },
            { icon: "⚖", label: "Decisions", color: "80" },
            { icon: "▶", label: "Learning Path", color: "25" },
          ].map((f) => (
            <span
              key={f.label}
              className="px-3 py-1.5 rounded-lg text-[11px] font-mono glass border-[oklch(0.25_0.03_260_/_30%)] text-muted-foreground/70"
            >
              <span style={{ color: `oklch(0.7 0.15 ${f.color})` }}>
                {f.icon}
              </span>{" "}
              {f.label}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* API Key Modal */}
      <Dialog open={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
        <DialogContent className="glass-strong border-[oklch(0.25_0.03_260_/_50%)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Claude API Key
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              VibeScope uses Claude to analyze your codebase. Your key is never
              stored on any server.
            </p>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">API Key</Label>
              <Input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="h-10 rounded-lg font-mono text-xs glass"
              />
            </div>
            <Button
              onClick={handleStartAnalysis}
              disabled={!tempApiKey.trim()}
              className="w-full h-10 rounded-lg font-semibold text-sm"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.55 0.18 260), oklch(0.6 0.15 195))",
              }}
            >
              Start Analysis
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
