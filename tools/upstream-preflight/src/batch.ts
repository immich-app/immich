import fs from "node:fs";
import path from "node:path";
import { getGitPath, isAncestor, revParse } from "./git";
import type {
  Batch,
  BatchPlan,
  BatchPlanMetadata,
  CheckEntry,
  ClassifiedCommit,
  RiskLevel,
} from "./types";

const riskRank: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };
const fullShaPattern = /^[0-9a-f]{40}$/i;

export type BatchAuditScopeInput = {
  batch?: string;
  batchPlan: BatchPlan;
  upstreamTouchedFiles: string[];
};

export type BatchAuditScope = {
  batch?: string;
  upstreamTouchedFiles: string[];
};

export type PlanBatchesOptions = {
  metadata: BatchPlanMetadata;
  softCap?: number;
  checks?: Record<string, CheckEntry>;
};

export type BatchPlanReportPaths = {
  markdownPath: string;
  jsonPath: string;
};

export type NextBatchSelection =
  | { status: "none"; plan: BatchPlan }
  | { status: "complete"; plan: BatchPlan; completedBatchCount: number }
  | {
      status: "next";
      plan: BatchPlan;
      batch: Batch;
      completedBatchCount: number;
    };

export type NextBatchCommandOptions = {
  repoPath: string;
  outputDir?: string;
  checks?: Record<string, CheckEntry>;
  write?: (message: string) => void;
  writeError?: (message: string) => void;
};

function batchRisk(commits: ClassifiedCommit[]): RiskLevel {
  return commits.reduce<RiskLevel>(
    (risk, commit) =>
      riskRank[commit.risk] > riskRank[risk] ? commit.risk : risk,
    "low",
  );
}

function makeBatch(index: number, commits: ClassifiedCommit[]): Batch {
  const requiredChecks = [
    ...new Set(commits.flatMap((commit) => commit.requiredChecks)),
  ].sort();
  const why = [...new Set(commits.flatMap((commit) => commit.reasons))];
  const tip = commits.at(-1);

  if (!tip) {
    throw new Error("Cannot create an empty batch");
  }

  return {
    id: String(index).padStart(2, "0"),
    tipSha: tip.sha,
    commits,
    risk: batchRisk(commits),
    why,
    requiredChecks,
    postBatchChecks: [],
    checkpointChecks: [],
    checkpoint: false,
  };
}

function mustStartOwnBatch(commit: ClassifiedCommit): boolean {
  return (
    commit.risk === "high" ||
    commit.features.length > 1 ||
    commit.reasons.some((reason) => reason.includes("openapi-generated"))
  );
}

export function planBatches(
  commits: ClassifiedCommit[],
  options: PlanBatchesOptions,
): BatchPlan {
  const softCap = options.softCap ?? options.metadata.softCap;
  const batches: Batch[] = [];
  let current: ClassifiedCommit[] = [];

  const flush = () => {
    if (current.length > 0) {
      batches.push(makeBatch(batches.length + 1, current));
      current = [];
    }
  };

  for (const commit of commits) {
    if (mustStartOwnBatch(commit)) {
      flush();
      batches.push(makeBatch(batches.length + 1, [commit]));
      continue;
    }

    current.push(commit);
    if (current.length >= softCap) flush();
  }

  flush();
  applyCheckpointPolicy(batches, softCap, options.checks);
  return { metadata: { ...options.metadata, softCap }, batches };
}

export function selectBatchAuditScope(
  input: BatchAuditScopeInput,
): BatchAuditScope {
  if (!input.batch) {
    return { upstreamTouchedFiles: input.upstreamTouchedFiles };
  }

  const requestedBatch = normalizeBatchId(input.batch);
  const batch = input.batchPlan.batches.find(
    (candidate) => candidate.id === requestedBatch,
  );
  if (!batch) {
    const availableBatches = input.batchPlan.batches
      .map((candidate) => candidate.id)
      .join(", ");
    throw new Error(
      `Unknown upstream batch ${input.batch}. Available batches: ${availableBatches || "none"}`,
    );
  }

  return {
    batch: batch.id,
    upstreamTouchedFiles: [
      ...new Set(batch.commits.flatMap((commit) => commit.files)),
    ].sort(),
  };
}

export function renderBatchMarkdown(
  plan: BatchPlan,
  checks: Record<string, CheckEntry> = {},
): string {
  const rows = plan.batches
    .map(
      (batch) =>
        `| ${batch.id} | \`${shortSha(batch.tipSha)}\` | ${batch.commits.length} | ${batch.risk.toUpperCase()} | ${batch.checkpoint ? "yes" : "no"} | ${batch.why.join("; ") || "-"} | ${batch.postBatchChecks.join(", ") || "-"} | ${batch.checkpointChecks.join(", ") || "-"} |`,
    )
    .join("\n");
  const commands = plan.batches
    .map(
      (batch) => `### Batch ${batch.id}

\`\`\`bash
${renderBatchCommands(batch, checks)}
\`\`\``,
    )
    .join("\n\n");

  return `| Batch | Tip SHA | Commits | Risk | Checkpoint | Why | Post-Batch Checks | Checkpoint Checks |
| --- | --- | ---: | --- | --- | --- | --- | --- |
${rows || "| - | - | 0 | LOW | - | No incoming upstream commits | - | - |"}

## Batch Commands

${commands || "No upstream batches are required."}
`;
}

export function writeBatchPlanReports(
  plan: BatchPlan,
  outputDir: string,
  checks: Record<string, CheckEntry> = {},
): BatchPlanReportPaths {
  fs.mkdirSync(outputDir, { recursive: true });
  const markdownPath = path.join(outputDir, "batch-plan.md");
  const jsonPath = path.join(outputDir, "batch-plan.json");
  fs.writeFileSync(markdownPath, renderBatchMarkdown(plan, checks));
  fs.writeFileSync(jsonPath, `${JSON.stringify(plan, null, 2)}\n`);

  return { markdownPath, jsonPath };
}

export function readPersistedBatchPlan(
  repoPath: string,
  outputDir?: string,
): BatchPlan {
  const jsonPath = path.join(
    outputDir ?? getGitPath(repoPath, "upstream-preflight"),
    "batch-plan.json",
  );

  if (!fs.existsSync(jsonPath)) {
    throw new Error(
      `Missing persisted batch plan ${jsonPath}; run make upstream-batch-plan first.`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  } catch (error) {
    throw new Error(
      `Failed to parse persisted batch plan ${jsonPath}: ${errorMessage(error)}`,
    );
  }

  validateBatchPlanShape(parsed, jsonPath);
  return parsed;
}

export function validatePersistedBatchPlan(
  plan: BatchPlan,
  repoPath: string,
): void {
  const currentUpstreamHead = revParse(repoPath, plan.metadata.upstreamRef);
  if (currentUpstreamHead !== plan.metadata.upstreamHead) {
    throw new Error(
      `Persisted batch plan is stale: ${plan.metadata.upstreamRef} is ${currentUpstreamHead}, but batch-plan.json was generated for ${plan.metadata.upstreamHead}. Run make upstream-batch-plan.`,
    );
  }

  for (const batch of plan.batches) {
    if (!isAncestor(repoPath, batch.tipSha, plan.metadata.upstreamHead)) {
      throw new Error(
        `Persisted batch ${batch.id} tip ${batch.tipSha} is not an ancestor of upstream head ${plan.metadata.upstreamHead}. Run make upstream-batch-plan.`,
      );
    }
  }
}

export function selectNextBatch(
  plan: BatchPlan,
  repoPath: string,
): NextBatchSelection {
  if (plan.batches.length === 0) {
    return { status: "none", plan };
  }

  if (isAncestor(repoPath, plan.metadata.upstreamHead, "HEAD")) {
    return {
      status: "complete",
      plan,
      completedBatchCount: plan.batches.length,
    };
  }

  let completedBatchIndex = -1;
  for (const [index, batch] of plan.batches.entries()) {
    if (isAncestor(repoPath, batch.tipSha, "HEAD")) {
      completedBatchIndex = index;
    }
  }

  if (completedBatchIndex === plan.batches.length - 1) {
    return {
      status: "complete",
      plan,
      completedBatchCount: plan.batches.length,
    };
  }

  return {
    status: "next",
    plan,
    batch: plan.batches[completedBatchIndex + 1],
    completedBatchCount: completedBatchIndex + 1,
  };
}

export function renderNextBatchMarkdown(
  selection: NextBatchSelection,
  checks: Record<string, CheckEntry> = {},
): string {
  if (selection.status === "none") {
    return `No upstream batches are required for ${selection.plan.metadata.upstreamRef} (${shortSha(selection.plan.metadata.upstreamHead)}).`;
  }

  if (selection.status === "complete") {
    return `Upstream rebase already includes ${selection.plan.metadata.upstreamRef} (${selection.plan.metadata.upstreamHead}).
Completed batches: ${selection.completedBatchCount}
No rebase command is required.`;
  }

  const { batch, completedBatchCount, plan } = selection;
  const reasons = batch.why.length > 0 ? batch.why.join("\n- ") : "none";

  return `Next upstream batch: ${batch.id}
Completed batches: ${completedBatchCount}
Upstream ref: ${plan.metadata.upstreamRef}
Upstream head: ${plan.metadata.upstreamHead}
Tip SHA: ${batch.tipSha}
Risk: ${batch.risk.toUpperCase()}
Reasons:
- ${reasons}

Commands:

\`\`\`bash
${renderBatchCommands(batch, checks)}
\`\`\``;
}

export function runNextBatchCommand(options: NextBatchCommandOptions): number {
  const write = options.write ?? console.log;
  const writeError = options.writeError ?? console.error;

  try {
    const plan = readPersistedBatchPlan(options.repoPath, options.outputDir);
    validatePersistedBatchPlan(plan, options.repoPath);
    write(
      renderNextBatchMarkdown(
        selectNextBatch(plan, options.repoPath),
        options.checks,
      ),
    );
    return 0;
  } catch (error) {
    writeError(errorMessage(error));
    return 1;
  }
}

export function renderBatchCommands(
  batch: Batch,
  checks: Record<string, CheckEntry> = {},
): string {
  const commands = [
    `git rebase ${batch.tipSha}`,
    `make upstream-postrebase-audit BATCH=${batch.id}`,
    ...batch.postBatchChecks.map((check) =>
      renderRequiredCheckCommand(check, batch.id, checks),
    ),
  ];

  if (batch.checkpoint) {
    commands.push(
      ...batch.checkpointChecks.map((check) =>
        renderRequiredCheckCommand(check, batch.id, checks),
      ),
      `git push origin HEAD:rebase/upstream-batch-${batch.id} --force`,
    );
  }

  return commands.join("\n");
}

function validateBatchPlanShape(
  value: unknown,
  source: string,
): asserts value is BatchPlan {
  assertRecord(value, source);
  assertRecord(value.metadata, `${source}: metadata`);
  const metadata = value.metadata;

  for (const key of [
    "generatedAt",
    "mergeBase",
    "upstreamRef",
    "upstreamHead",
    "forkRef",
    "forkHead",
    "manifestForkBaseline",
  ]) {
    assertString(metadata[key], `${source}: metadata.${key}`);
  }
  assertNumber(metadata.softCap, `${source}: metadata.softCap`);
  assertFullSha(metadata.mergeBase as string, `${source}: metadata.mergeBase`);
  assertFullSha(
    metadata.upstreamHead as string,
    `${source}: metadata.upstreamHead`,
  );
  assertFullSha(metadata.forkHead as string, `${source}: metadata.forkHead`);
  assertFullSha(
    metadata.manifestForkBaseline as string,
    `${source}: metadata.manifestForkBaseline`,
  );

  if (!Array.isArray(value.batches)) {
    throw new Error(
      `Invalid persisted batch plan ${source}: batches is required`,
    );
  }

  for (const [batchIndex, batch] of value.batches.entries()) {
    const label = `${source}: batches[${batchIndex}]`;
    assertRecord(batch, label);
    assertString(batch.id, `${label}.id`);
    assertString(batch.tipSha, `${label}.tipSha`);
    assertFullSha(batch.tipSha, `${label}.tipSha`);
    assertRisk(batch.risk, `${label}.risk`);
    assertStringArray(batch.why, `${label}.why`);
    assertStringArray(batch.requiredChecks, `${label}.requiredChecks`);
    assertStringArray(batch.postBatchChecks, `${label}.postBatchChecks`);
    assertStringArray(batch.checkpointChecks, `${label}.checkpointChecks`);
    assertBoolean(batch.checkpoint, `${label}.checkpoint`);

    if (!Array.isArray(batch.commits) || batch.commits.length === 0) {
      throw new Error(
        `Invalid persisted batch plan ${source}: ${label}.commits must contain at least one commit`,
      );
    }

    for (const [commitIndex, commit] of batch.commits.entries()) {
      const commitLabel = `${label}.commits[${commitIndex}]`;
      assertRecord(commit, commitLabel);
      assertString(commit.sha, `${commitLabel}.sha`);
      assertFullSha(commit.sha, `${commitLabel}.sha`);
    }
  }
}

function assertRecord(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(
      `Invalid persisted batch plan ${label}: object is required`,
    );
  }
}

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid persisted batch plan ${label} is required`);
  }
}

function assertNumber(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Invalid persisted batch plan ${label} is required`);
  }
}

function assertBoolean(
  value: unknown,
  label: string,
): asserts value is boolean {
  if (typeof value !== "boolean") {
    throw new Error(`Invalid persisted batch plan ${label} is required`);
  }
}

function assertStringArray(
  value: unknown,
  label: string,
): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(
      `Invalid persisted batch plan ${label} must be an array of strings`,
    );
  }
}

function assertRisk(value: unknown, label: string): asserts value is RiskLevel {
  if (value !== "low" && value !== "medium" && value !== "high") {
    throw new Error(
      `Invalid persisted batch plan ${label} must be low, medium, or high`,
    );
  }
}

function assertFullSha(value: string, label: string) {
  if (!fullShaPattern.test(value)) {
    throw new Error(
      `Invalid persisted batch plan ${label} must be a full 40-character SHA`,
    );
  }
}

function applyCheckpointPolicy(
  batches: Batch[],
  softCap: number,
  checks: Record<string, CheckEntry> = {},
) {
  let commitsSinceCheckpoint = 0;
  let pendingCheckpointChecks = new Set<string>();

  for (const [index, batch] of batches.entries()) {
    const isFinal = index === batches.length - 1;
    commitsSinceCheckpoint += batch.commits.length;

    batch.postBatchChecks = batch.requiredChecks
      .filter((check) => checkCost(check, checks) === "cheap")
      .sort();

    for (const check of batch.requiredChecks) {
      if (checkCost(check, checks) === "expensive") {
        pendingCheckpointChecks.add(check);
      }
    }

    batch.checkpoint =
      batch.risk === "high" || commitsSinceCheckpoint >= softCap || isFinal;

    if (batch.checkpoint) {
      batch.checkpointChecks = [...pendingCheckpointChecks].sort();
      pendingCheckpointChecks = new Set<string>();
      commitsSinceCheckpoint = 0;
    } else {
      batch.checkpointChecks = [];
    }
  }
}

function renderRequiredCheckCommand(
  check: string,
  batchId: string,
  checks: Record<string, CheckEntry>,
): string {
  const command = checks[check]?.command ?? `make ${check}`;
  if (check === "mobile-drift-rebase-check" && !/\bBATCH=/.test(command)) {
    return `${command} BATCH=${batchId}`;
  }

  return command;
}

function checkCost(
  check: string,
  checks: Record<string, CheckEntry>,
): NonNullable<CheckEntry["cost"]> {
  return checks[check]?.cost ?? "expensive";
}

function normalizeBatchId(batch: string): string {
  return /^\d+$/.test(batch) ? batch.padStart(2, "0") : batch;
}

function shortSha(sha: string): string {
  return sha.slice(0, 9);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
