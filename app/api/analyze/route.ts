// ═══════════════════════════════════════════════
// ANALYZE API — SSE streaming endpoint
// ═══════════════════════════════════════════════

import { loadRepo } from "@/lib/analyzer/repo-loader";
import { parseProjectDependencies } from "@/lib/analyzer/dependency-parser";
import { scanFiles } from "@/lib/analyzer/file-scanner";
import { callClaude } from "@/lib/llm/client";
import { buildAnalysisPrompt } from "@/lib/llm/prompts";
import { enrichAnalysis, fetchPackageInfo } from "@/lib/analyzer/resources";
import type { CodebaseAnalysis } from "@/lib/types";

// Generating a full analysis takes a few minutes
export const maxDuration = 300;

// Rough size of a complete analysis, used only to animate progress while Claude writes
const EXPECTED_RESPONSE_CHARS = 70_000;

interface AnalyzeRequest {
  repoUrl: string;
  apiKey: string;
}

function sseEvent(data: {
  progress: number;
  status: string;
  result?: CodebaseAnalysis;
  error?: string;
}): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  let body: AnalyzeRequest;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { repoUrl, apiKey } = body;

  if (!repoUrl?.trim()) {
    return Response.json({ error: "repoUrl is required" }, { status: 400 });
  }

  if (!apiKey?.trim()) {
    return Response.json({ error: "apiKey is required" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: {
        progress: number;
        status: string;
        result?: CodebaseAnalysis;
        error?: string;
      }) => {
        controller.enqueue(encoder.encode(sseEvent(data)));
      };

      try {
        // Step 1: Load repository
        send({ progress: 10, status: "Loading repository from GitHub..." });
        const files = await loadRepo(repoUrl);

        if (files.length === 0) {
          send({
            progress: 0,
            status: "Error",
            error: "No files found in repository. Is it empty or private?",
          });
          controller.close();
          return;
        }

        send({
          progress: 25,
          status: `Loaded ${files.length} files. Parsing dependencies...`,
        });

        // Step 2: Parse dependencies
        const deps = parseProjectDependencies(files);

        // Look up real package docs on npm / PyPI while Claude works
        const packagesPromise = fetchPackageInfo(deps.dependencies);

        send({
          progress: 40,
          status: `Found ${deps.dependencies.length} dependencies. Scanning files...`,
        });

        // Step 3: Scan files
        const stats = scanFiles(files);

        send({
          progress: 55,
          status: `Scanned ${stats.totalFiles} files (${stats.totalLines.toLocaleString()} lines). Analyzing with Claude...`,
        });

        // Step 4: Build prompt and call Claude
        const prompt = buildAnalysisPrompt(files, deps, stats);

        send({
          progress: 65,
          status: "Sending to Claude for deep analysis...",
        });

        let lastSent = 0;
        const response = await callClaude(prompt, apiKey, (chars) => {
          const now = Date.now();
          if (now - lastSent < 1500) return;
          lastSent = now;
          const fraction = Math.min(chars / EXPECTED_RESPONSE_CHARS, 1);
          send({
            progress: Math.round(65 + fraction * 20),
            status: `Claude is writing the analysis (${Math.round(chars / 1000)}K characters)...`,
          });
        });

        send({ progress: 85, status: "Parsing analysis results..." });

        // Step 5: Parse the JSON response
        let analysis: CodebaseAnalysis;

        try {
          // Try to extract JSON from the response (in case Claude wrapped it)
          let jsonStr = response.trim();

          // Strip markdown fences or surrounding prose by taking the outermost object
          const start = jsonStr.indexOf("{");
          const end = jsonStr.lastIndexOf("}");
          if (start !== -1 && end > start) {
            jsonStr = jsonStr.slice(start, end + 1);
          }

          analysis = JSON.parse(jsonStr);
        } catch {
          send({
            progress: 0,
            status: "Error",
            error: `Failed to parse Claude's response as JSON. The model may have returned an incomplete response. Try again.`,
          });
          controller.close();
          return;
        }

        // Step 6: Ground links in real package data and drop dead ones
        send({ progress: 90, status: "Verifying documentation links..." });
        await enrichAnalysis(analysis, await packagesPromise);

        // Step 7: Done
        send({
          progress: 100,
          status: "Analysis complete!",
          result: analysis,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "An unknown error occurred";
        send({
          progress: 0,
          status: "Error",
          error: message,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
