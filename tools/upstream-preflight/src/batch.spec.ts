import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createTempRepo } from "../test/fixtures";
import {
  planBatches,
  readPersistedBatchPlan,
  renderBatchMarkdown,
  renderNextBatchMarkdown,
  runNextBatchCommand,
  selectBatchAuditScope,
  selectNextBatch,
  validatePersistedBatchPlan,
  writeBatchPlanReports,
} from "./batch";
import { getGitPath } from "./git";
import type {
  BatchPlan,
  BatchPlanMetadata,
  CheckEntry,
  ClassifiedCommit,
  RiskLevel,
} from "./types";

function commit(
  shortSha: string,
  risk: RiskLevel,
  reasons: string[] = [],
  files: string[] = [],
  requiredChecks = risk === "high" ? ["mobile-drift-rebase-check"] : [],
): ClassifiedCommit {
  const fullSha = sha(shortSha);

  return {
    sha: fullSha,
    shortSha,
    subject: `${risk} commit`,
    files,
    domains: [],
    overlapFiles: [],
    features: [],
    risk,
    reasons,
    requiredChecks,
  };
}

describe("planBatches", () => {
  it("groups low risk commits up to the soft cap and isolates high risk commits", () => {
    const plan = planBatches(
      [
        commit("000000001", "low"),
        commit("000000002", "low"),
        commit("539a39ae4", "high", ["Matches risk pattern mobile-drift"]),
        commit("000000004", "medium", [
          "Matches risk pattern openapi-generated",
        ]),
        commit("000000005", "medium"),
      ],
      { metadata: metadata(), softCap: 10 },
    );

    expect(
      plan.batches.map((batch) => batch.commits.map((item) => item.shortSha)),
    ).toEqual([
      ["000000001", "000000002"],
      ["539a39ae4"],
      ["000000004"],
      ["000000005"],
    ]);
    expect(plan.batches[1].requiredChecks).toEqual([
      "mobile-drift-rebase-check",
    ]);
  });

  it("persists metadata and full upstream commit SHAs", () => {
    const planMetadata = metadata({
      generatedAt: "2026-05-05T06:00:00.000Z",
      softCap: 3,
    });
    const plan = planBatches([commit("539a39ae4", "high")], {
      metadata: planMetadata,
      softCap: 3,
    });

    expect(plan.metadata).toEqual(planMetadata);
    expect(plan.metadata.generatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
    expect(plan.batches[0].tipSha).toBe(sha("539a39ae4"));
    expect(plan.batches[0].commits[0].sha).toBe(sha("539a39ae4"));
  });

  it("renders short SHAs in tables and full SHAs in commands", () => {
    const plan = planBatches([commit("539a39ae4", "high")], {
      metadata: metadata(),
      softCap: 10,
      checks: checkCatalog(),
    });
    const markdown = renderBatchMarkdown(plan, checkCatalog());

    expect(markdown).toContain("| 01 | `539a39ae4` | 1 | HIGH | yes |");
    expect(markdown).toContain(`git rebase ${sha("539a39ae4")}`);
    expect(markdown).toContain("make mobile-drift-rebase-check BATCH=01");
  });

  it("splits cheap post-batch checks from expensive checkpoint checks", () => {
    const plan = planBatches(
      [
        commit(
          "111111111",
          "medium",
          ["openapi-generated"],
          [],
          ["cheap-check", "expensive-check"],
        ),
        commit("222222222", "low", [], [], ["cheap-check"]),
      ],
      { metadata: metadata(), softCap: 10, checks: checkCatalog() },
    );

    expect(plan.batches[0]).toMatchObject({
      checkpoint: false,
      postBatchChecks: ["cheap-check"],
      checkpointChecks: [],
    });
    expect(plan.batches[1]).toMatchObject({
      checkpoint: true,
      postBatchChecks: ["cheap-check"],
      checkpointChecks: ["expensive-check"],
    });

    const markdown = renderBatchMarkdown(plan, checkCatalog());
    expect(markdown).toContain("make cheap-check");
    expect(markdown).toContain("make expensive-check");
    expect(markdown).toContain("git push origin HEAD:rebase/upstream-batch-02");
    expect(markdown).not.toContain(
      "git push origin HEAD:rebase/upstream-batch-01",
    );
  });

  it("checkpoints high-risk batches and resets low/medium cumulative counting", () => {
    const plan = planBatches(
      [
        commit("111111111", "low"),
        commit("222222222", "low"),
        commit("333333333", "high", [], [], ["expensive-check"]),
        commit("444444444", "low"),
        commit("555555555", "low"),
        commit("666666666", "medium", ["openapi-generated"]),
      ],
      { metadata: metadata(), softCap: 3, checks: checkCatalog() },
    );

    expect(plan.batches.map((batch) => batch.checkpoint)).toEqual([
      false,
      true,
      false,
      true,
    ]);
    expect(plan.batches[1].checkpointChecks).toEqual(["expensive-check"]);
  });

  it("renders manifest check commands, missing-check fallbacks, and batch-scoped mobile Drift", () => {
    const plan = planBatches(
      [
        commit(
          "111111111",
          "high",
          [],
          [],
          ["cheap-check", "missing-check", "mobile-drift-rebase-check"],
        ),
      ],
      { metadata: metadata(), softCap: 10, checks: checkCatalog() },
    );
    const markdown = renderBatchMarkdown(plan, checkCatalog());
    const nextBatch = renderNextBatchMarkdown(
      { status: "next", plan, batch: plan.batches[0], completedBatchCount: 0 },
      checkCatalog(),
    );

    expect(markdown).toContain("make cheap-check");
    expect(markdown).toContain("make missing-check");
    expect(markdown).toContain("make mobile-drift-rebase-check BATCH=01");
    expect(nextBatch).toContain("make mobile-drift-rebase-check BATCH=01");
  });
});

describe("batch plan reports", () => {
  it("writes Markdown and JSON reports idempotently", () => {
    const outputDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "gallery-batch-plan-"),
    );
    const plan = planBatches([commit("111111111", "low")], {
      metadata: metadata(),
      softCap: 10,
    });

    const firstWrite = writeBatchPlanReports(plan, outputDir);
    const secondWrite = writeBatchPlanReports(plan, outputDir);

    expect(secondWrite).toEqual(firstWrite);
    expect(fs.readFileSync(firstWrite.markdownPath, "utf8")).toContain(
      "| 01 | `111111111` |",
    );
    expect(JSON.parse(fs.readFileSync(firstWrite.jsonPath, "utf8"))).toEqual(
      plan,
    );
  });

  it("can write under Git metadata without dirtying source status", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    repo.commit("base commit");
    const plan = planBatches([commit("111111111", "low")], {
      metadata: metadata(),
      softCap: 10,
    });
    const outputDir = getGitPath(repo.path, "upstream-preflight");

    const paths = writeBatchPlanReports(plan, outputDir);

    expect(paths.markdownPath).toContain(".git/upstream-preflight");
    expect(paths.jsonPath).toContain(".git/upstream-preflight");
    expect(repo.git("status", "--short")).toBe("");
  });
});

describe("persisted batch plan validation", () => {
  it("reads and validates a current persisted plan", () => {
    const { repo, plan, outputDir } = createRepoWithPersistedPlan();

    const persisted = readPersistedBatchPlan(repo.path, outputDir);

    expect(persisted).toEqual(plan);
    expect(() =>
      validatePersistedBatchPlan(persisted, repo.path),
    ).not.toThrow();
  });

  it("fails clearly when the persisted plan is missing", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    repo.commit("base commit");
    const outputDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "gallery-batch-plan-"),
    );

    expect(() => readPersistedBatchPlan(repo.path, outputDir)).toThrow(
      `Missing persisted batch plan ${path.join(outputDir, "batch-plan.json")}; run make upstream-batch-plan first.`,
    );
  });

  it("fails clearly when the persisted plan JSON is corrupt", () => {
    const { repo, outputDir } = createRepoWithPersistedPlan();
    fs.writeFileSync(path.join(outputDir, "batch-plan.json"), "{");

    expect(() => readPersistedBatchPlan(repo.path, outputDir)).toThrow(
      "Failed to parse persisted batch plan",
    );
  });

  it("fails clearly when required structure is missing", () => {
    const { repo, outputDir, commits } = createRepoWithPersistedPlan();
    fs.writeFileSync(
      path.join(outputDir, "batch-plan.json"),
      JSON.stringify({
        metadata: metadata({
          upstreamRef: "upstream",
          upstreamHead: commits[1].sha,
          forkRef: "main",
          forkHead: commits[1].sha,
          manifestForkBaseline: commits[1].sha,
        }),
        batches: [
          {
            id: "01",
            tipSha: commits[0].sha,
            risk: "low",
            why: [],
            requiredChecks: [],
            postBatchChecks: [],
            checkpointChecks: [],
            checkpoint: false,
          },
        ],
      }),
    );

    expect(() => readPersistedBatchPlan(repo.path, outputDir)).toThrow(
      "commits must contain at least one commit",
    );
  });

  it("rejects batch tips that are not full 40-character SHAs", () => {
    const { repo, outputDir, plan } = createRepoWithPersistedPlan();
    fs.writeFileSync(
      path.join(outputDir, "batch-plan.json"),
      JSON.stringify({
        ...plan,
        batches: [{ ...plan.batches[0], tipSha: "123456789" }],
      }),
    );

    expect(() => readPersistedBatchPlan(repo.path, outputDir)).toThrow(
      "tipSha must be a full 40-character SHA",
    );
  });

  it("rejects batch tips that are not ancestors of the persisted upstream head", () => {
    const { repo, plan } = createRepoWithPersistedPlan();
    repo.git("checkout", "-b", "side", plan.metadata.mergeBase);
    repo.write("upstream/side.txt", "side");
    const side = repo.commit("side commit");
    repo.git("checkout", "main");
    const invalidPlan: BatchPlan = {
      ...plan,
      batches: [{ ...plan.batches[0], tipSha: side }],
    };

    expect(() => validatePersistedBatchPlan(invalidPlan, repo.path)).toThrow(
      `Persisted batch 01 tip ${side} is not an ancestor of upstream head ${plan.metadata.upstreamHead}. Run make upstream-batch-plan.`,
    );
  });

  it("rejects stale plans when the upstream ref moved", () => {
    const { repo, plan } = createRepoWithPersistedPlan();
    repo.git("checkout", "upstream");
    repo.write("upstream/three.txt", "three");
    const newUpstreamHead = repo.commit("upstream three");
    repo.git("checkout", "main");

    expect(() => validatePersistedBatchPlan(plan, repo.path)).toThrow(
      `Persisted batch plan is stale: upstream is ${newUpstreamHead}, but batch-plan.json was generated for ${plan.metadata.upstreamHead}. Run make upstream-batch-plan.`,
    );
  });
});

describe("upstream next batch", () => {
  it("reports no work when there are no incoming upstream commits", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    const base = repo.commit("base commit");
    repo.git("branch", "upstream", base);
    const plan: BatchPlan = {
      metadata: metadata({
        mergeBase: base,
        upstreamRef: "upstream",
        upstreamHead: base,
        forkRef: "main",
        forkHead: base,
        manifestForkBaseline: base,
      }),
      batches: [],
    };

    const output = renderNextBatchMarkdown(selectNextBatch(plan, repo.path));

    expect(output).toContain("No upstream batches are required");
    expect(output).not.toContain("git rebase");
  });

  it("prints batch 01 before the rebase starts", () => {
    const { repo, plan } = createRepoWithPersistedPlan({ upstreamCommits: 3 });

    const output = renderNextBatchMarkdown(selectNextBatch(plan, repo.path));

    expect(output).toContain("Next upstream batch: 01");
    expect(output).toContain(`Tip SHA: ${plan.batches[0].tipSha}`);
    expect(output).toContain(`git rebase ${plan.batches[0].tipSha}`);
  });

  it("prints the next batch after HEAD contains a middle batch tip", () => {
    const { repo, plan } = createRepoWithPersistedPlan({ upstreamCommits: 3 });
    repo.git("checkout", "-B", "rebased", plan.batches[1].tipSha);
    repo.write("gallery/rebased.txt", "fork");
    repo.commit("fork after batch 02");

    const output = renderNextBatchMarkdown(selectNextBatch(plan, repo.path));

    expect(output).toContain("Next upstream batch: 03");
    expect(output).toContain(`git rebase ${plan.batches[2].tipSha}`);
  });

  it("reports completion when the final batch tip is already included", () => {
    const { repo, plan, outputDir } = createRepoWithPersistedPlan({
      upstreamCommits: 3,
    });
    repo.git("checkout", "-B", "rebased", plan.batches[2].tipSha);
    repo.write("gallery/rebased.txt", "fork");
    repo.commit("fork after upstream head");
    const messages: string[] = [];

    const exitCode = runNextBatchCommand({
      repoPath: repo.path,
      outputDir,
      write: (message) => messages.push(message),
    });

    expect(exitCode).toBe(0);
    expect(messages.join("\n")).toContain("Upstream rebase already includes");
    expect(messages.join("\n")).not.toContain("git rebase");
  });

  it("exits non-zero for stale persisted plans", () => {
    const { repo, outputDir } = createRepoWithPersistedPlan();
    repo.git("checkout", "upstream");
    repo.write("upstream/three.txt", "three");
    repo.commit("upstream three");
    repo.git("checkout", "main");
    const errors: string[] = [];

    const exitCode = runNextBatchCommand({
      repoPath: repo.path,
      outputDir,
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join("\n")).toContain("Persisted batch plan is stale");
  });

  it("exits non-zero for missing persisted plans", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    repo.commit("base commit");
    const errors: string[] = [];

    const exitCode = runNextBatchCommand({
      repoPath: repo.path,
      outputDir: fs.mkdtempSync(path.join(os.tmpdir(), "gallery-batch-plan-")),
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join("\n")).toContain("run make upstream-batch-plan first");
  });

  it("exits non-zero for corrupt or structurally invalid persisted plans", () => {
    const { repo, outputDir } = createRepoWithPersistedPlan();
    const errors: string[] = [];
    fs.writeFileSync(path.join(outputDir, "batch-plan.json"), "{");

    const corruptExitCode = runNextBatchCommand({
      repoPath: repo.path,
      outputDir,
      writeError: (message) => errors.push(message),
    });

    fs.writeFileSync(
      path.join(outputDir, "batch-plan.json"),
      JSON.stringify({ metadata: {}, batches: [] }),
    );
    const invalidExitCode = runNextBatchCommand({
      repoPath: repo.path,
      outputDir,
      writeError: (message) => errors.push(message),
    });

    expect(corruptExitCode).toBe(1);
    expect(invalidExitCode).toBe(1);
    expect(errors.join("\n")).toContain("Failed to parse persisted batch plan");
    expect(errors.join("\n")).toContain("metadata.generatedAt is required");
  });
});

describe("selectBatchAuditScope", () => {
  const batchPlan: BatchPlan = {
    metadata: metadata(),
    batches: [
      {
        id: "01",
        tipSha: sha("111111111"),
        commits: [
          commit(
            "111111111",
            "medium",
            [],
            [
              "server/src/queries/asset.job.repository.sql",
              "web/src/routes/+page.svelte",
            ],
          ),
        ],
        risk: "medium",
        why: [],
        requiredChecks: [],
        postBatchChecks: [],
        checkpointChecks: [],
        checkpoint: false,
      },
      {
        id: "02",
        tipSha: sha("222222222"),
        commits: [
          commit(
            "222222222",
            "high",
            [],
            [
              "mobile/openapi/lib/api.dart",
              "open-api/immich-openapi-specs.json",
            ],
          ),
        ],
        risk: "high",
        why: ["Matches risk pattern openapi-generated"],
        requiredChecks: ["mobile-drift-rebase-check"],
        postBatchChecks: ["mobile-drift-rebase-check"],
        checkpointChecks: [],
        checkpoint: true,
      },
    ],
  };

  const allUpstreamFiles = batchPlan.batches.flatMap((batch) =>
    batch.commits.flatMap((item) => item.files),
  );

  it("selects only the requested batch files for audit signals", () => {
    expect(
      selectBatchAuditScope({
        batch: "01",
        batchPlan,
        upstreamTouchedFiles: allUpstreamFiles,
      }),
    ).toEqual({
      batch: "01",
      upstreamTouchedFiles: [
        "server/src/queries/asset.job.repository.sql",
        "web/src/routes/+page.svelte",
      ],
    });
  });

  it("uses the full upstream file list when no batch is requested", () => {
    expect(
      selectBatchAuditScope({
        batchPlan,
        upstreamTouchedFiles: allUpstreamFiles,
      }).upstreamTouchedFiles,
    ).toEqual(allUpstreamFiles);
  });

  it("normalizes numeric batch ids and rejects unknown batches", () => {
    expect(
      selectBatchAuditScope({
        batch: "1",
        batchPlan,
        upstreamTouchedFiles: allUpstreamFiles,
      }).batch,
    ).toBe("01");

    expect(() =>
      selectBatchAuditScope({
        batch: "99",
        batchPlan,
        upstreamTouchedFiles: allUpstreamFiles,
      }),
    ).toThrow("Unknown upstream batch 99. Available batches: 01, 02");
  });
});

function createRepoWithPersistedPlan(
  options: { upstreamCommits?: number } = {},
) {
  const repo = createTempRepo();
  repo.write("README.md", "base");
  const base = repo.commit("base commit");
  repo.git("checkout", "-b", "upstream");

  const upstreamCommits: ClassifiedCommit[] = [];
  for (let index = 1; index <= (options.upstreamCommits ?? 2); index++) {
    repo.write(`upstream/${index}.txt`, `${index}`);
    const commitSha = repo.commit(`upstream ${index}`);
    upstreamCommits.push(
      classifiedCommit(commitSha, index === 2 ? "high" : "medium"),
    );
  }

  repo.git("checkout", "main");
  repo.write("gallery/fork.txt", "fork");
  const forkHead = repo.commit("fork commit");
  const upstreamHead = upstreamCommits.at(-1)?.sha ?? base;
  const plan = planBatches(upstreamCommits, {
    metadata: metadata({
      mergeBase: base,
      upstreamRef: "upstream",
      upstreamHead,
      forkRef: "main",
      forkHead,
      manifestForkBaseline: forkHead,
      softCap: 1,
    }),
    softCap: 1,
  });
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "gallery-batch-plan-"),
  );
  writeBatchPlanReports(plan, outputDir);

  return { repo, commits: upstreamCommits, plan, outputDir };
}

function classifiedCommit(shaValue: string, risk: RiskLevel): ClassifiedCommit {
  return {
    sha: shaValue,
    shortSha: shaValue.slice(0, 9),
    subject: `${risk} commit`,
    files: [`upstream/${shaValue.slice(0, 9)}.txt`],
    domains: [],
    overlapFiles: [],
    features: [],
    risk,
    reasons: risk === "high" ? ["Matches risk pattern mobile-drift"] : [],
    requiredChecks: risk === "high" ? ["mobile-drift-rebase-check"] : [],
  };
}

function metadata(
  overrides: Partial<BatchPlanMetadata> = {},
): BatchPlanMetadata {
  return {
    generatedAt: "2026-05-05T06:00:00.000Z",
    mergeBase: sha("aaaaaaaaa"),
    upstreamRef: "upstream/main",
    upstreamHead: sha("bbbbbbbbb"),
    forkRef: "origin/main",
    forkHead: sha("ccccccccc"),
    manifestForkBaseline: sha("ddddddddd"),
    softCap: 10,
    ...overrides,
  };
}

function checkCatalog(): Record<string, CheckEntry> {
  return {
    "cheap-check": {
      command: "make cheap-check",
      phase: "post-batch",
      cost: "cheap",
    },
    "expensive-check": {
      command: "make expensive-check",
      phase: "post-batch",
      cost: "expensive",
    },
    "mobile-drift-rebase-check": {
      command: "make mobile-drift-rebase-check",
      phase: "preflight-and-post-batch",
      cost: "cheap",
    },
  };
}

function sha(prefix: string): string {
  return `${prefix}${"0".repeat(40 - prefix.length)}`;
}
