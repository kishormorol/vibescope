"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-9 h-9" />;

  const isDark = theme === "dark";

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer"
      style={{
        background: isDark
          ? "oklch(0.18 0.02 260 / 60%)"
          : "oklch(0.92 0.02 260 / 80%)",
        border: isDark
          ? "1px solid oklch(0.3 0.03 260 / 40%)"
          : "1px solid oklch(0.8 0.02 260 / 60%)",
      }}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm"
          >
            🌙
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm"
          >
            ☀️
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
