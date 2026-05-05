import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  evaluateReadiness,
  readinessExitCode,
  renderReadinessMarkdown,
  writeReadinessReports,
} from "./ready";
import type { AuditResult, CoverageClassification } from "./types";

describe("evaluateReadiness", () => {
  it("fails for uncovered fork files and non-ancestor manifest baselines", () => {
    const result = evaluateReadiness({
      uncoveredFiles: ["web/src/routes/uncovered.ts"],
      headValidation: {
        ok: false,
        errors: ["manifest baseline is not an ancestor"],
        warnings: [],
        changedSinceBaseline: [],
      },
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "Ownership manifest does not cover 1 fork files:",
    );
    expect(result.errors).toContain("web/src/routes/uncovered.ts");
    expect(result.errors).toContain("manifest baseline is not an ancestor");
  });

  it("fails for CI invariant and package patch failures", () => {
    const result = evaluateReadiness({
      ciResults: [failedAudit("No PUSH_O_MATIC", ["workflow token found"])],
      patchResults: [failedAudit("Patch check: @immich/ui", ["missing patch"])],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("No PUSH_O_MATIC:");
    expect(result.errors).toContain("- workflow token found");
    expect(result.errors).toContain("Patch check: @immich/ui:");
  });

  it("fails for current-fork post-rebase audit blockers", () => {
    const result = evaluateReadiness({
      postRebaseAuditResults: [
        failedAudit("Fork-Owned File Survival", [
          "Missing fork-owned file server/src/services/shared-space.service.ts",
        ]),
        failedAudit("Fork Extension Symbol Survival", [
          "server/src/schema/functions.ts is missing expected symbol library_user",
        ]),
        failedAudit("Gallery Migration Count", ["Gallery migration count: 1"]),
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Fork-Owned File Survival:");
    expect(result.errors).toContain("Fork Extension Symbol Survival:");
    expect(result.errors).toContain("Gallery Migration Count:");
  });

  it("passes for warning-only baseline drift and broad optional coverage", () => {
    const broadOnly: CoverageClassification = {
      file: "mobile/lib/new.dart",
      explicitGlobs: [],
      broadOptionalGlobs: ["mobile/**"],
      narrowOptionalGlobs: [],
    };

    const result = evaluateReadiness({
      headValidation: {
        ok: true,
        errors: [],
        warnings: ["manifest baseline is behind origin/main"],
        changedSinceBaseline: ["mobile/lib/new.dart"],
      },
      broadOptionalOnly: [broadOnly],
    });

    expect(result.ok).toBe(true);
    expect(readinessExitCode(result)).toBe(0);
    expect(result.warnings).toContain(
      "manifest baseline is behind origin/main",
    );
    expect(result.warnings).toContain(
      "Broad optional coverage: mobile/lib/new.dart is covered only by mobile/**. Add a narrower owned path or upstream extension path when reconciling the manifest.",
    );
  });

  it("reports mobile Drift, generated artifacts, and migration collisions as planned resolutions", () => {
    const result = evaluateReadiness({
      planningResults: [
        failedAudit("Mobile Drift Migration Check", [
          "Upstream touches shipped Gallery Drift version v23",
        ]),
      ],
      postRebaseAuditResults: [
        failedAudit("Generated Artifact Review", [
          "Review regenerated artifact open-api/spec.json",
        ]),
        failedAudit("Migration Timestamp Collision Check", [
          "Migration timestamp collision: 1770000000000",
        ]),
      ],
    });

    expect(result.ok).toBe(true);
    expect(result.plannedResolutions).toContain(
      "Mobile Drift Migration Check:",
    );
    expect(result.plannedResolutions).toContain("Generated Artifact Review:");
    expect(result.plannedResolutions).toContain(
      "Migration Timestamp Collision Check:",
    );
  });

  it("fails when fresh batch plan generation fails", () => {
    const result = evaluateReadiness({
      batchPlanError: "upstream/main is missing",
    });

    expect(result.ok).toBe(false);
    expect(readinessExitCode(result)).toBe(1);
    expect(result.errors).toEqual([
      "Batch plan generation failed: upstream/main is missing",
    ]);
  });

  it("passes with a useful no-incoming-upstream summary", () => {
    const result = evaluateReadiness({
      reportPaths: ["batch-plan.json", "preflight.json"],
    });
    const markdown = renderReadinessMarkdown(result);

    expect(result.ok).toBe(true);
    expect(markdown).toContain("READY");
    expect(markdown).toContain("batch-plan.json");
  });

  it("writes readiness Markdown and JSON reports", () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "gallery-ready-"));
    const { result, markdownPath, jsonPath } = writeReadinessReports(
      outputDir,
      evaluateReadiness({}),
    );

    expect(path.basename(markdownPath)).toBe("readiness.md");
    expect(path.basename(jsonPath)).toBe("readiness.json");
    expect(result.reportPaths).toEqual([markdownPath, jsonPath]);
    expect(JSON.parse(fs.readFileSync(jsonPath, "utf8"))).toMatchObject({
      ok: true,
      reportPaths: [markdownPath, jsonPath],
    });
  });
});

function failedAudit(title: string, details: string[]): AuditResult {
  return { ok: false, title, details };
}
