import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VibeScope — See How Your Code Was Built",
  description:
    "Interactive visualization of AI-built codebases. Explore the SWE pipeline, technologies, concepts, and learning paths behind any project.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Top gradient accent line */}
        <div className="fixed top-0 left-0 right-0 h-[2px] z-50 animate-gradient-shift" style={{ background: 'linear-gradient(90deg, oklch(0.7 0.18 260), oklch(0.75 0.15 195), oklch(0.72 0.17 155), oklch(0.7 0.18 260))', backgroundSize: '200% 100%' }} />
        {/* Ambient glow orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[oklch(0.4_0.15_260_/_12%)] blur-[100px] animate-pulse-glow" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[oklch(0.4_0.12_195_/_10%)] blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[oklch(0.3_0.08_260_/_6%)] blur-[120px]" />
          {/* Particle dot grid */}
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(oklch(0.5 0.08 260 / 15%) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        </div>
        {children}
      </body>
    </html>
  );
}
