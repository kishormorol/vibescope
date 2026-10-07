/**
 * Theme-aware color helpers for components using inline oklch styles.
 * These provide light/dark variants for the common color patterns.
 */

export function themeColors(isDark: boolean) {
  return {
    // Card / container backgrounds
    cardBg: isDark
      ? "oklch(0.12 0.01 260 / 60%)"
      : "oklch(0.99 0.003 260 / 80%)",
    cardBgHover: isDark
      ? "oklch(0.15 0.02 260 / 70%)"
      : "oklch(0.97 0.005 260 / 90%)",
    cardBorder: isDark
      ? "oklch(0.25 0.03 260 / 40%)"
      : "oklch(0.85 0.01 260 / 60%)",

    // Text
    heading: isDark ? "oklch(0.92 0 0)" : "oklch(0.15 0.02 260)",
    body: isDark ? "oklch(0.75 0 0)" : "oklch(0.35 0.02 260)",
    muted: isDark ? "oklch(0.55 0 0)" : "oklch(0.5 0.02 260)",
    subtle: isDark ? "oklch(0.4 0 0)" : "oklch(0.65 0.01 260)",

    // Surfaces
    panelBg: isDark
      ? "oklch(0.1 0.01 260 / 60%)"
      : "oklch(0.97 0.005 260 / 70%)",
    sectionBg: isDark
      ? "oklch(0.15 0.02 260 / 70%)"
      : "oklch(0.95 0.005 260 / 80%)",

    // Borders & dividers
    divider: isDark
      ? "oklch(0.25 0.02 260 / 40%)"
      : "oklch(0.85 0.01 260 / 50%)",
    borderWhite: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",

    // Backdrop
    backdrop: isDark ? "blur(12px)" : "blur(8px)",

    // Shadows
    shadow: (hue: number | string, intensity = 0.15) =>
      isDark
        ? `0 0 20px oklch(0.4 0.1 ${hue} / ${intensity}), inset 0 1px 0 oklch(1 0 0 / 4%)`
        : `0 2px 12px oklch(0.5 0.08 ${hue} / ${intensity * 0.5})`,
    shadowActive: (hue: number | string) =>
      isDark
        ? `0 0 30px oklch(0.4 0.1 ${hue} / 15%), inset 0 1px 0 oklch(1 0 0 / 6%)`
        : `0 4px 16px oklch(0.5 0.08 ${hue} / 10%), 0 0 0 1px oklch(0.8 0.03 ${hue} / 20%)`,

    // Dynamic hue-based colors (for difficulty, category, etc.)
    hueBg: (hue: number | string, opacity = 0.6) =>
      isDark
        ? `oklch(0.15 0.03 ${hue} / ${opacity})`
        : `oklch(0.95 0.02 ${hue} / ${opacity})`,
    hueText: (hue: number | string) =>
      isDark
        ? `oklch(0.85 0.1 ${hue})`
        : `oklch(0.4 0.12 ${hue})`,
    hueBorder: (hue: number | string, opacity = 0.4) =>
      isDark
        ? `oklch(0.4 0.08 ${hue} / ${opacity})`
        : `oklch(0.75 0.06 ${hue} / ${opacity})`,
    hueBadgeBg: (hue: number | string) =>
      isDark
        ? `oklch(0.2 0.04 ${hue} / 60%)`
        : `oklch(0.92 0.03 ${hue} / 70%)`,
    hueBadgeText: (hue: number | string) =>
      isDark
        ? `oklch(0.8 0.1 ${hue})`
        : `oklch(0.4 0.12 ${hue})`,
    hueGlow: (hue: number | string, intensity = 0.2) =>
      isDark
        ? `0 0 18px oklch(0.5 0.12 ${hue} / ${intensity})`
        : `0 2px 8px oklch(0.5 0.08 ${hue} / ${intensity * 0.4})`,

    // Accent colors
    accentBg: (hue: number | string) =>
      isDark
        ? `oklch(0.25 0.06 ${hue} / 60%)`
        : `oklch(0.93 0.03 ${hue} / 70%)`,
    accentText: (hue: number | string) =>
      isDark
        ? `oklch(0.85 0.1 ${hue})`
        : `oklch(0.4 0.14 ${hue})`,

    // Specific for concept tags
    tagBg: isDark
      ? "oklch(0.18 0.03 300 / 50%)"
      : "oklch(0.93 0.02 300 / 60%)",
    tagText: isDark
      ? "oklch(0.75 0.08 300)"
      : "oklch(0.4 0.1 300)",
    tagHoverBg: isDark
      ? "oklch(0.25 0.06 300 / 60%)"
      : "oklch(0.88 0.04 300 / 70%)",

    // Inline transparency helpers
    white: (opacity: number) =>
      isDark ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity * 0.6})`,
  };
}
