import { describe, expect, it } from "vitest";
import { renderPreflightMarkdown } from "./report";
import type { ClassifiedCommit } from "./types";

describe("renderPreflightMarkdown", () => {
  it("renders high-risk commits, batch plan, audits, and extension hotspots", () => {
    const commit: ClassifiedCommit = {
      sha: "539a39ae4abc",
      shortSha: "539a39ae4",
      subject:
        "refactor(mobile): Migrate durationInSeconds to durationMs (#26615)",
      files: ["mobile/lib/infrastructure/repositories/db.repository.dart"],
      domains: ["mobile"],
      overlapFiles: [
        "mobile/lib/infrastructure/repositories/db.repository.dart",
      ],
      features: ["mobile-app-and-branding"],
      risk: "high",
      reasons: ["Matches risk pattern mobile-drift"],
      requiredChecks: ["mobile-drift-rebase-check"],
    };

    const markdown = renderPreflightMarkdown({
      date: "2026-05-04",
      mergeBase: "f909648bc",
      upstreamShortStat: "852 files changed",
      forkShortStat: "2040 files changed",
      classifiedCommits: [commit],
      incomingCommits: [commit],
      forkFileCount: 2040,
      upstreamFileCount: 852,
      overlapFiles: [
        "mobile/lib/infrastructure/repositories/db.repository.dart",
      ],
      domainOverlaps: [
        {
          domain: "mobile",
          files: ["mobile/lib/infrastructure/repositories/db.repository.dart"],
        },
      ],
      featureOverlaps: [
        {
          feature: "mobile-app-and-branding",
          commits: ["539a39ae4"],
          files: ["mobile/lib/infrastructure/repositories/db.repository.dart"],
        },
      ],
      dependencyChanges: ["pnpm-lock.yaml"],
      serverMigrationChanges: [
        "server/src/schema/migrations/1740000000000-Upstream.ts",
      ],
      serverTableOverlaps: ["shared_spaces"],
      mobileDriftChanges: ["mobile/drift_schemas/main/drift_schema_v23.json"],
      ciWorkflowChanges: [".github/workflows/test.yml"],
      broadRefactorHints: [
        "539a39ae4 touches 1 files and matches risk pattern mobile-drift",
      ],
      batchMarkdown:
        "| Batch | Tip SHA | Commits | Risk | Why | Required Checks |",
      auditResults: [
        {
          ok: false,
          title: "Mobile Drift Migration Check",
          details: ["Upstream touches shipped Gallery Drift version v23"],
        },
      ],
      extensionHotspots: [
        {
          path: "server/src/services/search.service.ts",
          hits: 4,
          features: ["shared-spaces"],
        },
      ],
      forkSurfaceSignals: {
        configured: true,
        preferredNamespaceFiles: {
          count: 1,
          sample: ["server/src/gallery/search.ts"],
        },
        outsidePreferredNamespaceFiles: {
          count: 2,
          sample: ["server/src/services/search.service.ts"],
        },
        adapterHookFiles: {
          count: 1,
          sample: ["server/src/services/search.service.ts"],
        },
        extractionCandidates: {
          count: 1,
          sample: ["server/src/services/timeline.service.ts"],
        },
        broadOnlyRecentFiles: {
          count: 1,
          sample: ["web/src/routes/(user)/photos/+page.svelte"],
        },
      },
    });

    expect(markdown).toContain("# Upstream Preflight Report - 2026-05-04");
    expect(markdown).toContain("539a39ae4");
    expect(markdown).toContain("mobile-drift-rebase-check");
    expect(markdown).toContain("Fork Surface Reduction Signals");
    expect(markdown).toContain("Preferred namespace files");
    expect(markdown).toContain("Extraction candidates");
    expect(markdown).toContain("web/src/routes/(user)/photos/+page.svelte");
    expect(markdown).toContain("server/src/services/search.service.ts");
    expect(markdown).toContain("Incoming Commit List");
    expect(markdown).toContain("Dependency And Lockfile Changes");
    expect(markdown).toContain("Server Migration Signals");
    expect(markdown).toContain("Mobile Drift Migration Check");
  });
});
