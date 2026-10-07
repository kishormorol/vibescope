"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useStore } from "@/lib/store";
import { themeColors } from "@/lib/theme-colors";
import { cacheAnalysis, clearCache } from "@/lib/cache";
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

function TypingSubtitle() {
  const text = "See how your code was built. Interactive visualization of the entire SWE pipeline \u2014 technologies, concepts, decisions, and learning paths.";
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 18);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
    >
      {displayed}
      {!done && <span className="inline-block w-[2px] h-[1em] bg-[oklch(0.7_0.18_260)] ml-0.5 animate-pulse align-middle" />}
    </motion.p>
  );
}

export default function HomePage() {
  const { repoUrl, setRepoUrl, setApiKey, setAnalysis, cachedRepos, loadCachedRepos, loadFromCache } = useStore();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tc = themeColors(isDark);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");

  useEffect(() => {
    loadCachedRepos();
  }, [loadCachedRepos]);

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
      const demoUrl = "demo/thinkdiff";
      useStore.getState().setAnalysis(data, demoUrl);
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
        className="text-center space-y-8 max-w-3xl relative"
      >
        {/* Animated gradient background for hero */}
        <div className="absolute -inset-20 -z-10 rounded-3xl opacity-40 animate-gradient-shift" style={{ background: isDark
          ? 'linear-gradient(135deg, oklch(0.2 0.08 260 / 30%), oklch(0.15 0.06 195 / 20%), oklch(0.2 0.08 300 / 25%), oklch(0.15 0.06 155 / 20%))'
          : 'linear-gradient(135deg, oklch(0.85 0.06 260 / 25%), oklch(0.88 0.04 195 / 20%), oklch(0.85 0.06 300 / 20%), oklch(0.88 0.04 155 / 15%))',
          backgroundSize: '200% 200%', filter: 'blur(60px)' }} />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass text-sm text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Explore any AI-built codebase
          </span>
        </motion.div>

        {/* Title */}
        <h1 className="text-7xl sm:text-8xl font-bold tracking-tighter">
          <span className={`bg-gradient-to-r bg-clip-text text-transparent ${isDark
            ? "from-[oklch(0.75_0.18_260)] via-[oklch(0.8_0.15_195)] to-[oklch(0.72_0.17_155)]"
            : "from-[oklch(0.45_0.22_260)] via-[oklch(0.5_0.18_195)] to-[oklch(0.42_0.2_155)]"}`}>
            Vibe
          </span>
          <span className="text-foreground/30">Scope</span>
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
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
              className="h-14 pl-5 pr-5 rounded-xl glass border-[oklch(0.25_0.03_260_/_50%)] text-base font-mono focus:glow-primary transition-all"
            />
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={!repoUrl.trim()}
            className="h-14 px-10 rounded-xl font-semibold text-base relative overflow-hidden group"
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
            className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl glass hover:glow-cyan transition-all group text-base"
          >
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
              Try Demo
            </span>
            <span className="text-sm text-muted-foreground/50">
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
              className="px-4 py-2 rounded-lg text-sm font-mono glass border-[oklch(0.25_0.03_260_/_30%)] text-muted-foreground/70"
            >
              <span style={{ color: isDark ? `oklch(0.7 0.15 ${f.color})` : `oklch(0.45 0.18 ${f.color})` }}>
                {f.icon}
              </span>{" "}
              {f.label}
            </span>
          ))}
        </motion.div>

        {/* Recent analyses from cache */}
        {cachedRepos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="pt-6 space-y-3 w-full max-w-xl mx-auto"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider">
                Recent
              </span>
              <button
                onClick={async () => {
                  await clearCache();
                  loadCachedRepos();
                }}
                className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors font-mono"
              >
                Clear cache
              </button>
            </div>
            <div className="space-y-1.5">
              {cachedRepos.map((repo) => (
                <button
                  key={repo.url}
                  onClick={async () => {
                    const loaded = await loadFromCache(repo.url);
                    if (loaded) router.push("/analyze");
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg glass hover:glow-primary transition-all group text-left"
                >
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                    {repo.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground/40 font-mono shrink-0 ml-3">
                    {new Date(repo.timestamp).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
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
