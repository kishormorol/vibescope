// ═══════════════════════════════════════════════
// LLM PROMPT TEMPLATES — Build analysis prompts
// ═══════════════════════════════════════════════

import type { RepoFile } from "@/lib/analyzer/repo-loader";
import type { DependencyInfo } from "@/lib/analyzer/dependency-parser";
import type { FileStats } from "@/lib/analyzer/file-scanner";

/**
 * Build the main analysis prompt that asks Claude to produce
 * a full CodebaseAnalysis JSON object.
 */
export function buildAnalysisPrompt(
  files: RepoFile[],
  deps: DependencyInfo,
  stats: FileStats
): string {
  // Build file tree summary
  const fileTree = files.map((f) => `  ${f.path} (${f.size} bytes)`).join("\n");

  // Build dependency list
  const depList = deps.dependencies
    .map((d) => `  ${d.name}@${d.version} [${d.category}]${d.isDev ? " (dev)" : ""}`)
    .join("\n");

  // Build language stats
  const langStats = stats.languages
    .map((l) => `  ${l.name}: ${l.percentage}% (${l.lines} lines)`)
    .join("\n");

  // Include content of key files (truncated to keep prompt manageable)
  const keyFilePatterns = [
    "package.json",
    "tsconfig.json",
    /config/,
    /layout\./,
    /page\./,
    /route\./,
    /index\./,
    /store/,
    /types/,
    /schema/,
    /middleware/,
  ];

  const keyFiles = files
    .filter((f) => {
      const name = f.path.split("/").pop() || "";
      return keyFilePatterns.some((p) =>
        typeof p === "string" ? name === p : p.test(f.path)
      );
    })
    .slice(0, 20);

  const keyFileContents = keyFiles
    .map((f) => {
      const truncated =
        f.content.length > 3000
          ? f.content.slice(0, 3000) + "\n... (truncated)"
          : f.content;
      return `### ${f.path}\n\`\`\`\n${truncated}\n\`\`\``;
    })
    .join("\n\n");

  // Include a sample of other important source files
  const srcFiles = files
    .filter(
      (f) =>
        !keyFiles.includes(f) &&
        (f.path.endsWith(".ts") ||
          f.path.endsWith(".tsx") ||
          f.path.endsWith(".js") ||
          f.path.endsWith(".jsx") ||
          f.path.endsWith(".py"))
    )
    .slice(0, 10);

  const srcFileContents = srcFiles
    .map((f) => {
      const truncated =
        f.content.length > 2000
          ? f.content.slice(0, 2000) + "\n... (truncated)"
          : f.content;
      return `### ${f.path}\n\`\`\`\n${truncated}\n\`\`\``;
    })
    .join("\n\n");

  return `You are an expert software engineer analyzing a codebase. Based on the repository data below, produce a comprehensive analysis as a JSON object.

## Repository Data

### File Tree
${fileTree}

### Dependencies
${depList || "  (none found)"}

### Language Distribution
${langStats}

### Key Configuration & Entry Files
${keyFileContents}

### Source Code Samples
${srcFileContents}

## Task

Analyze this codebase and return a JSON object with EXACTLY this structure (no markdown, no explanation, just valid JSON):

{
  "id": "<generated-unique-id>",
  "summary": {
    "name": "<project name from package.json or repo>",
    "description": "<1-2 sentence description of what this project does>",
    "totalFiles": ${stats.totalFiles},
    "totalLines": ${stats.totalLines},
    "languages": ${JSON.stringify(stats.languages.map((l) => ({ name: l.name, percentage: l.percentage })))},
    "mainStack": "<e.g. 'Next.js + TypeScript + Tailwind'>",
    "complexity": "<beginner|intermediate|advanced>"
  },
  "files": [
    {
      "path": "<file path>",
      "language": "<language>",
      "lines": <line count>,
      "summary": "<1 sentence: what this file does>",
      "difficulty": "<beginner|intermediate|advanced>",
      "concepts": ["<concept-id-1>", "<concept-id-2>"],
      "annotations": [
        {
          "startLine": <number>,
          "endLine": <number>,
          "conceptId": "<concept-id>",
          "explanation": "<what this code section does and why>"
        }
      ],
      "category": "<config|component|page|api|lib|style|type|test|asset|other>"
    }
  ],
  "technologies": [
    {
      "id": "<tech-id>",
      "name": "<display name>",
      "category": "<framework|language|styling|state|visualization|animation|api|database|testing|tooling|deployment>",
      "description": "<what it does, 1-2 sentences>",
      "whyChosen": "<why this was chosen for this project>",
      "officialUrl": "<official website>",
      "docsUrl": "<documentation URL>",
      "version": "<version if known>"
    }
  ],
  "pipeline": [
    {
      "id": "<stage-id>",
      "order": <1-based order>,
      "label": "<stage name, e.g. 'User Input', 'Data Processing'>",
      "description": "<what happens at this stage>",
      "filesInvolved": ["<file paths>"],
      "technologiesUsed": ["<tech-ids>"],
      "icon": "<single emoji representing this stage>"
    }
  ],
  "concepts": [
    {
      "id": "<concept-id>",
      "name": "<concept name>",
      "category": "<e.g. 'React', 'TypeScript', 'Architecture'>",
      "difficulty": "<beginner|intermediate|advanced>",
      "explanation": "<2-3 sentence explanation of this concept>",
      "docUrl": "<link to relevant documentation>",
      "prerequisites": ["<other-concept-ids>"]
    }
  ],
  "conceptEdges": [
    {
      "from": "<concept-id>",
      "to": "<concept-id>",
      "relationship": "<prerequisite|related|builds-on>"
    }
  ],
  "decisions": [
    {
      "id": "<decision-id>",
      "title": "<what decision was made>",
      "chosen": "<what was chosen>",
      "alternatives": ["<what could have been chosen instead>"],
      "reasoning": "<why this choice makes sense for this project>",
      "category": "<framework|language|styling|state|visualization|animation|api|database|testing|tooling|deployment>"
    }
  ],
  "learningPath": [
    {
      "id": "<lesson-id>",
      "order": <1-based order>,
      "title": "<lesson title>",
      "difficulty": "<beginner|intermediate|advanced>",
      "concepts": ["<concept-ids covered>"],
      "content": "<markdown content: explain the concept, show code examples from this repo, explain how it's used here>",
      "estimatedMinutes": <number>
    }
  ]
}

## Guidelines

1. **Files**: Include ALL ${stats.totalFiles} files from the file tree. For each, write a clear summary, assign difficulty, identify concepts used, and add 1-3 annotations for the most interesting code sections.

2. **Technologies**: List every significant technology used. Include ALL dependencies that aren't just type definitions or dev tooling. Write insightful "whyChosen" explanations.

3. **Pipeline**: Break down the application flow into 4-8 logical stages showing how data flows through the system.

4. **Concepts**: Identify 10-20 key software engineering concepts demonstrated in this codebase. Set up proper prerequisite chains (e.g., "JSX" is prerequisite for "React Components").

5. **Concept Edges**: Create edges between related concepts to form a knowledge graph.

6. **Decisions**: Identify 4-8 key architectural/technology decisions and explain the tradeoffs.

7. **Learning Path**: Create 5-10 lessons that would teach someone this codebase from scratch, ordered from basic to advanced. Include real code snippets from the repo in the content field (as markdown code blocks).

Return ONLY the JSON object. No markdown fences, no explanation text.`;
}
