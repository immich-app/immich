export type RiskLevel = "low" | "medium" | "high";
export type Domain =
  | "server"
  | "web"
  | "mobile"
  | "database"
  | "ci"
  | "docs"
  | "e2e"
  | "ml"
  | "config";

export type Manifest = {
  version: 1;
  metadata: {
    upstream_remote: string;
    upstream_branch: string;
    fork_remote: string;
    fork_branch: string;
    last_verified_fork_head: string;
  };
  features: Record<string, FeatureEntry>;
  checks?: Record<string, CheckEntry>;
  ci_invariants?: CiInvariant[];
  patches?: PackagePatch[];
  risk_patterns?: RiskPattern[];
  coverage_ignore?: string[];
  fork_surface?: {
    preferred_namespaces?: Partial<Record<Domain, string[]>>;
  };
};

export type FeatureEntry = {
  title: string;
  aliases?: string[];
  risk: RiskLevel;
  domains: Domain[];
  owned_paths?: string[];
  upstream_extension_paths?: string[];
  optional_paths?: string[];
  expected_symbols?: Record<string, string[]>;
  generated_artifacts?: string[];
  database?: {
    tables?: string[];
    migration_globs?: string[];
    expected_migrations?: string[];
  };
  mobile?: {
    drift_versions?: {
      owned: number[];
      shipped: boolean;
      owner: "gallery";
      expected_callbacks?: Record<number, string[]>;
    };
    paths?: string[];
  };
  required_checks?: string[];
};

export type CheckEntry = {
  command: string;
  phase: "preflight" | "post-batch" | "preflight-and-post-batch" | "final";
  cost?: "cheap" | "expensive";
  required_for_risk?: RiskLevel[];
  required_for_domains?: Domain[];
};

export type CiInvariant = {
  id: string;
  title: string;
  forbidden_patterns: string[];
  paths: string[];
  exceptions?: string[];
};

export type PackagePatch = {
  id: string;
  package: string;
  version_source: string;
  expected_patch: string;
  required_check: string;
};

export type RiskPattern = {
  id: string;
  risk: RiskLevel;
  subject_regex?: string;
  path_globs?: string[];
  notes: string;
};

export type GitCommit = {
  sha: string;
  shortSha: string;
  subject: string;
  files: string[];
};

export type ClassifiedCommit = GitCommit & {
  domains: Domain[];
  overlapFiles: string[];
  features: string[];
  risk: RiskLevel;
  reasons: string[];
  requiredChecks: string[];
};

export type BatchPlanMetadata = {
  generatedAt: string;
  mergeBase: string;
  upstreamRef: string;
  upstreamHead: string;
  forkRef: string;
  forkHead: string;
  manifestForkBaseline: string;
  softCap: number;
};

export type BatchPlan = {
  metadata: BatchPlanMetadata;
  batches: Batch[];
};

export type Batch = {
  id: string;
  tipSha: string;
  commits: ClassifiedCommit[];
  risk: RiskLevel;
  why: string[];
  requiredChecks: string[];
  postBatchChecks: string[];
  checkpointChecks: string[];
  checkpoint: boolean;
};

export type AuditResult = {
  ok: boolean;
  title: string;
  details: string[];
};

export type ManifestHeadValidation = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  changedSinceBaseline: string[];
};

export type CoverageClassification = {
  file: string;
  explicitGlobs: string[];
  broadOptionalGlobs: string[];
  narrowOptionalGlobs: string[];
};
