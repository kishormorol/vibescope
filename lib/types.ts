// ═══════════════════════════════════════════════
// VIBESCOPE DATA MODEL
// ═══════════════════════════════════════════════

export interface CodebaseAnalysis {
  id: string;
  summary: ProjectSummary;
  files: AnalyzedFile[];
  technologies: Technology[];
  pipeline: PipelineStage[];
  concepts: Concept[];
  conceptEdges: ConceptEdge[];
  decisions: Decision[];
  learningPath: Lesson[];
}

export interface ProjectSummary {
  name: string;
  description: string;
  totalFiles: number;
  totalLines: number;
  languages: { name: string; percentage: number }[];
  mainStack: string;
  complexity: "beginner" | "intermediate" | "advanced";
}

export interface AnalyzedFile {
  path: string;
  language: string;
  lines: number;
  summary: string;
  difficulty: Difficulty;
  concepts: string[];
  annotations: CodeAnnotation[];
  category: FileCategory;
  sourceCode?: string;
}

export type FileCategory =
  | "config"
  | "component"
  | "page"
  | "api"
  | "lib"
  | "style"
  | "type"
  | "test"
  | "asset"
  | "other";

export interface CodeAnnotation {
  startLine: number;
  endLine: number;
  conceptId: string;
  explanation: string;
  docUrl?: string;
}

export type TechCategory =
  | "framework"
  | "language"
  | "styling"
  | "state"
  | "visualization"
  | "animation"
  | "api"
  | "database"
  | "testing"
  | "tooling"
  | "deployment";

export interface Technology {
  id: string;
  name: string;
  category: TechCategory;
  description: string;
  whyChosen: string;
  officialUrl: string;
  docsUrl: string;
  version?: string;
  icon?: string;
}

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Concept {
  id: string;
  name: string;
  category: string;
  difficulty: Difficulty;
  explanation: string;
  docUrl: string;
  prerequisites: string[];
}

export interface ConceptEdge {
  from: string;
  to: string;
  relationship: "prerequisite" | "related" | "builds-on";
}

export interface PipelineStage {
  id: string;
  order: number;
  label: string;
  description: string;
  filesInvolved: string[];
  technologiesUsed: string[];
  icon: string;
}

export interface Decision {
  id: string;
  title: string;
  chosen: string;
  alternatives: string[];
  reasoning: string;
  category: TechCategory;
}

export interface LessonResource {
  title: string;
  url: string;
  type: "docs" | "tutorial" | "video" | "article" | "reference";
}

export interface Lesson {
  id: string;
  order: number;
  title: string;
  difficulty: Difficulty;
  concepts: string[];
  content: string;
  estimatedMinutes: number;
  resources: LessonResource[];
}

// View state
export type AnalysisTab =
  | "pipeline"
  | "techmap"
  | "files"
  | "concepts"
  | "decisions"
  | "learning";
