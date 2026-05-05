import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTempRepo } from "../test/fixtures";
import {
  classifyCoverage,
  findBroadOptionalOnlyFiles,
  findUncoveredFiles,
  manifestCoverageGlobs,
  runCoverageCli,
  validateManifestForkHead,
} from "./coverage";
import type { Manifest } from "./types";

const originalExitCode = process.exitCode;
const originalInitCwd = process.env.INIT_CWD;

const baselineForkHead = "919deb87a6477d5058e0fa7b3960d30de577b495";

const manifest: Manifest = {
  version: 1,
  metadata: {
    upstream_remote: "upstream",
    upstream_branch: "main",
    fork_remote: "origin",
    fork_branch: "main",
    last_verified_fork_head: baselineForkHead,
  },
  features: {
    "shared-spaces": {
      title: "Shared Spaces",
      risk: "high",
      domains: ["server", "database"],
      owned_paths: ["server/src/services/shared-space.service.ts"],
      upstream_extension_paths: ["server/src/services/search.service.ts"],
      expected_symbols: {
        "server/src/services/timeline.service.ts": ["SharedSpace"],
      },
      generated_artifacts: ["open-api/typescript-sdk/src/fetch-client.ts"],
      database: {
        migration_globs: [
          "server/src/schema/migrations-gallery/*SharedSpace*.ts",
        ],
        expected_migrations: [
          "server/src/schema/migrations-gallery/1772230000000-CreateStorageMigrationLogTable.ts",
        ],
      },
      mobile: {
        paths: ["mobile/lib/gallery/shared_space.dart"],
      },
    },
  },
  ci_invariants: [
    {
      id: "no-push-o-matic",
      title: "No PUSH_O_MATIC",
      forbidden_patterns: ["PUSH_O_MATIC"],
      paths: [".github/workflows/**/*.yml"],
      exceptions: [".github/workflows/gallery-release.yml"],
    },
  ],
  patches: [
    {
      id: "immich-ui-command-patch",
      package: "@immich/ui",
      version_source: "pnpm-workspace.yaml",
      expected_patch: "patches/@immich__ui@0.76.2.patch",
      required_check: "mobile-drift-rebase-check",
    },
  ],
  coverage_ignore: ["docs/superpowers/**"],
};

const dotfileManifest: Manifest = manifestWith({
  features: {
    mobile: {
      title: "Mobile",
      risk: "high",
      domains: ["mobile"],
      optional_paths: ["mobile/**"],
    },
  },
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = originalExitCode;
  if (originalInitCwd === undefined) {
    delete process.env.INIT_CWD;
  } else {
    process.env.INIT_CWD = originalInitCwd;
  }
});

describe("fork ownership coverage", () => {
  it("reports files not covered by ownership globs", () => {
    expect(
      findUncoveredFiles(
        [
          "server/src/services/shared-space.service.ts",
          "server/src/schema/migrations-gallery/1772250000000-AddShowInTimelineToSharedSpaceMember.ts",
          "docs/superpowers/plans/scratch.md",
          "web/src/routes/(user)/photos/+page.svelte",
        ],
        manifest,
      ),
    ).toEqual(["web/src/routes/(user)/photos/+page.svelte"]);
  });

  it("includes explicit expected migrations in coverage globs", () => {
    expect(manifestCoverageGlobs(manifest)).toContain(
      "server/src/schema/migrations-gallery/1772230000000-CreateStorageMigrationLogTable.ts",
    );
  });

  it("matches dotfiles under owned directories", () => {
    expect(
      findUncoveredFiles(
        ["mobile/.gitignore", "mobile/android/gallery-release/.gitignore"],
        dotfileManifest,
      ),
    ).toEqual([]);
  });

  it("classifies explicit, broad optional, narrow optional, and uncovered coverage", () => {
    const classified = classifyCoverage(
      [
        "server/src/services/shared-space.service.ts",
        "mobile/lib/new-gallery-view.dart",
        "server/test/medium/storage-migration.gallery.spec.ts",
        "web/src/routes/(user)/photos/+page.svelte",
      ],
      manifestWith({
        features: {
          gallery: {
            title: "Gallery",
            risk: "medium",
            domains: ["server", "mobile"],
            owned_paths: ["server/src/services/shared-space.service.ts"],
            optional_paths: [
              "mobile/**",
              "server/test/medium/storage-migration*.spec.ts",
            ],
          },
        },
      }),
    );

    expect(classified).toEqual([
      {
        file: "server/src/services/shared-space.service.ts",
        explicitGlobs: ["server/src/services/shared-space.service.ts"],
        broadOptionalGlobs: [],
        narrowOptionalGlobs: [],
      },
      {
        file: "mobile/lib/new-gallery-view.dart",
        explicitGlobs: [],
        broadOptionalGlobs: ["mobile/**"],
        narrowOptionalGlobs: [],
      },
      {
        file: "server/test/medium/storage-migration.gallery.spec.ts",
        explicitGlobs: [],
        broadOptionalGlobs: [],
        narrowOptionalGlobs: ["server/test/medium/storage-migration*.spec.ts"],
      },
      {
        file: "web/src/routes/(user)/photos/+page.svelte",
        explicitGlobs: [],
        broadOptionalGlobs: [],
        narrowOptionalGlobs: [],
      },
    ]);
  });

  it("does not warn when explicit or narrow optional coverage also matches", () => {
    const files = [
      "mobile/lib/explicit.dart",
      "mobile/lib/storage-migration.dart",
      "mobile/lib/broad-only.dart",
    ];
    const coverageManifest = manifestWith({
      features: {
        gallery: {
          title: "Gallery",
          risk: "medium",
          domains: ["mobile"],
          owned_paths: ["mobile/lib/explicit.dart"],
          optional_paths: ["mobile/**", "mobile/lib/storage-*.dart"],
        },
      },
    });

    expect(
      findBroadOptionalOnlyFiles(files, coverageManifest, [
        "mobile/lib/explicit.dart",
        "mobile/lib/storage-migration.dart",
        "mobile/lib/broad-only.dart",
      ]),
    ).toEqual([
      {
        file: "mobile/lib/broad-only.dart",
        explicitGlobs: [],
        broadOptionalGlobs: ["mobile/**"],
        narrowOptionalGlobs: [],
      },
    ]);
  });

  it("scopes broad optional warnings to files changed after the manifest baseline", () => {
    const coverageManifest = manifestWith({
      features: {
        mobile: {
          title: "Mobile",
          risk: "high",
          domains: ["mobile"],
          optional_paths: ["mobile/**"],
        },
      },
    });

    expect(
      findBroadOptionalOnlyFiles(
        ["mobile/lib/old.dart", "mobile/lib/new.dart"],
        coverageManifest,
        ["mobile/lib/new.dart"],
      ).map((classification) => classification.file),
    ).toEqual(["mobile/lib/new.dart"]);
  });

  it("does not warn for ignored files covered by broad optional globs", () => {
    const coverageManifest = manifestWith({
      features: {
        mobile: {
          title: "Mobile",
          risk: "high",
          domains: ["mobile"],
          optional_paths: ["mobile/**"],
        },
      },
      coverage_ignore: ["mobile/generated/**"],
    });

    expect(
      findBroadOptionalOnlyFiles(
        ["mobile/generated/asset.dart"],
        coverageManifest,
        ["mobile/generated/asset.dart"],
      ),
    ).toEqual([]);
  });
});

describe("manifest baseline validation", () => {
  it("passes when the manifest baseline exactly matches the expected fork head", () => {
    const result = validateManifestForkHead(manifest, {
      expectedHead: baselineForkHead,
    });

    expect(result).toEqual({
      ok: true,
      errors: [],
      warnings: [],
      changedSinceBaseline: [],
    });
  });

  it("passes with warnings when the manifest baseline is an ancestor of the expected head", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    const base = repo.commit("base commit");
    repo.write("web/src/routes/gallery.ts", "web");
    repo.write("server/src/gallery.ts", "server");
    const head = repo.commit("fork commit");

    const result = validateManifestForkHead(manifestAt(base), {
      repoPath: repo.path,
      expectedHead: head,
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.changedSinceBaseline).toEqual([
      "server/src/gallery.ts",
      "web/src/routes/gallery.ts",
    ]);
    expect(result.warnings[0]).toContain(
      `Ownership manifest last_verified_fork_head ${base} is behind ${head}`,
    );
    expect(result.warnings).toContain(
      "Changed since manifest baseline: server/src/gallery.ts",
    );
  });

  it("fails when the manifest baseline is not an ancestor of the expected head", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    const base = repo.commit("base commit");
    repo.write("server/src/main.ts", "head");
    const head = repo.commit("head commit");
    repo.git("checkout", "-b", "side", base);
    repo.write("mobile/lib/side.dart", "side");
    const side = repo.commit("side commit");

    const result = validateManifestForkHead(manifestAt(side), {
      repoPath: repo.path,
      expectedHead: head,
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      `Ownership manifest last_verified_fork_head ${side} is not an ancestor of ${head}; reconcile docs/fork/ownership.yml before rebasing.`,
    ]);
  });

  it("fails clearly when the manifest baseline commit is missing locally", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    const head = repo.commit("base commit");

    const result = validateManifestForkHead(
      manifestAt("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
      {
        repoPath: repo.path,
        expectedHead: head,
      },
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      "Ownership manifest last_verified_fork_head aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa is not present in this repository; fetch fork history or reconcile docs/fork/ownership.yml.",
    ]);
  });

  it("fails clearly when the expected fork head is missing locally", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    const base = repo.commit("base commit");

    const result = validateManifestForkHead(manifestAt(base), {
      repoPath: repo.path,
      expectedHead: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      "Expected fork head bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb is not present in this repository; fetch fork history before running ownership coverage.",
    ]);
  });

  it("does not validate when no expected fork head is provided", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    repo.commit("base commit");

    expect(
      validateManifestForkHead(manifestAt("missing-head"), {
        repoPath: repo.path,
      }),
    ).toEqual({
      ok: true,
      errors: [],
      warnings: [],
      changedSinceBaseline: [],
    });
  });
});

describe("coverage CLI", () => {
  it("accepts pnpm run argument separator before file arguments", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gallery-coverage-"));
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    writeFileList(tempDir, ["server/src/services/shared-space.service.ts"]);
    writeManifestYaml(tempDir, baselineForkHead, {
      ownedPaths: ["server/src/services/shared-space.service.ts"],
    });

    runCliIn(tempDir, [
      "--",
      "files.txt",
      "ownership.yml",
      "--expected-head",
      baselineForkHead,
    ]);

    expect(process.exitCode).toBeUndefined();
    expect(log).toHaveBeenCalledWith("Ownership manifest covers 1 fork files");
  });

  it("keeps full fork delta coverage even when changed-since-baseline only contains covered files", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    const base = repo.commit("base commit");
    repo.write("server/src/services/shared-space.service.ts", "new covered");
    const head = repo.commit("fork commit");
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    writeFileList(repo.path, [
      "web/src/routes/old-uncovered.ts",
      "server/src/services/shared-space.service.ts",
    ]);
    writeManifestYaml(repo.path, base, {
      ownedPaths: ["server/src/services/shared-space.service.ts"],
    });

    runCliIn(repo.path, [
      "files.txt",
      "ownership.yml",
      "--expected-head",
      head,
    ]);

    expect(process.exitCode).toBe(1);
    expect(error).toHaveBeenCalledWith(
      "Ownership manifest does not cover 1 fork files:",
    );
    expect(error).toHaveBeenCalledWith("web/src/routes/old-uncovered.ts");
  });

  it("passes with warnings in normal mode when only broad optional coverage warnings exist", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    const base = repo.commit("base commit");
    repo.write("mobile/lib/new-gallery-view.dart", "new");
    const head = repo.commit("fork commit");
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    writeFileList(repo.path, ["mobile/lib/new-gallery-view.dart"]);
    writeManifestYaml(repo.path, base, { optionalPaths: ["mobile/**"] });

    runCliIn(repo.path, [
      "files.txt",
      "ownership.yml",
      "--expected-head",
      head,
    ]);

    expect(process.exitCode).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      "Ownership manifest broad coverage warning:",
    );
    expect(warn).toHaveBeenCalledWith(
      "- mobile/lib/new-gallery-view.dart is covered only by mobile/**",
    );
    expect(log).toHaveBeenCalledWith("Ownership manifest covers 1 fork files");
  });

  it("fails strict mode when broad optional coverage warnings exist", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    const base = repo.commit("base commit");
    repo.write("mobile/lib/new-gallery-view.dart", "new");
    const head = repo.commit("fork commit");
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    writeFileList(repo.path, ["mobile/lib/new-gallery-view.dart"]);
    writeManifestYaml(repo.path, base, { optionalPaths: ["mobile/**"] });

    runCliIn(repo.path, [
      "files.txt",
      "ownership.yml",
      "--expected-head",
      head,
      "--strict-broad-coverage",
    ]);

    expect(process.exitCode).toBe(1);
    expect(error).toHaveBeenCalledWith(
      "Strict broad coverage mode found 1 post-baseline files covered only by broad optional globs:",
    );
    expect(error).toHaveBeenCalledWith(
      "- mobile/lib/new-gallery-view.dart is covered only by mobile/**",
    );
  });

  it("passes strict mode when post-baseline files have explicit or narrow optional coverage", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    const base = repo.commit("base commit");
    repo.write("mobile/lib/explicit.dart", "explicit");
    repo.write("mobile/lib/storage-migration.dart", "narrow");
    const head = repo.commit("fork commit");
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    writeFileList(repo.path, [
      "mobile/lib/explicit.dart",
      "mobile/lib/storage-migration.dart",
    ]);
    writeManifestYaml(repo.path, base, {
      ownedPaths: ["mobile/lib/explicit.dart"],
      optionalPaths: ["mobile/**", "mobile/lib/storage-*.dart"],
    });

    runCliIn(repo.path, [
      "files.txt",
      "ownership.yml",
      "--expected-head",
      head,
      "--strict-broad-coverage",
    ]);

    expect(process.exitCode).toBeUndefined();
    expect(log).toHaveBeenCalledWith("Ownership manifest covers 2 fork files");
  });

  it("reports uncovered files and baseline errors distinctly in strict mode", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    const base = repo.commit("base commit");
    repo.write("server/src/main.ts", "head");
    const head = repo.commit("head commit");
    repo.git("checkout", "-b", "side", base);
    repo.write("mobile/lib/side.dart", "side");
    const side = repo.commit("side commit");
    repo.git("checkout", "main");
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    writeFileList(repo.path, ["web/src/routes/uncovered.ts"]);
    writeManifestYaml(repo.path, side, {
      optionalPaths: ["mobile/**"],
    });

    runCliIn(repo.path, [
      "files.txt",
      "ownership.yml",
      "--expected-head",
      head,
      "--strict-broad-coverage",
    ]);

    expect(process.exitCode).toBe(1);
    expect(error).toHaveBeenCalledWith(
      `Ownership manifest last_verified_fork_head ${side} is not an ancestor of ${head}; reconcile docs/fork/ownership.yml before rebasing.`,
    );
    expect(error).toHaveBeenCalledWith(
      "Ownership manifest does not cover 1 fork files:",
    );
  });

  it("requires a value for the expected manifest fork head", () => {
    expect(() => runCoverageCli(["files.txt", "--expected-head"])).toThrow(
      "--expected-head requires a commit SHA",
    );
  });
});

function manifestAt(lastVerifiedForkHead: string): Manifest {
  return {
    ...manifest,
    metadata: {
      ...manifest.metadata,
      last_verified_fork_head: lastVerifiedForkHead,
    },
  };
}

function manifestWith(overrides: Partial<Manifest>): Manifest {
  return {
    ...manifest,
    ...overrides,
    metadata: {
      ...manifest.metadata,
      ...(overrides.metadata ?? {}),
    },
  };
}

function runCliIn(cwd: string, argv: string[]) {
  process.exitCode = undefined;
  process.env.INIT_CWD = cwd;
  runCoverageCli(argv);
}

function writeFileList(cwd: string, files: string[]) {
  fs.writeFileSync(path.join(cwd, "files.txt"), `${files.join("\n")}\n`);
}

function writeManifestYaml(
  cwd: string,
  lastVerifiedForkHead: string,
  options: {
    ownedPaths?: string[];
    optionalPaths?: string[];
  },
) {
  fs.writeFileSync(
    path.join(cwd, "ownership.yml"),
    `
version: 1
metadata:
  upstream_remote: upstream
  upstream_branch: main
  fork_remote: origin
  fork_branch: main
  last_verified_fork_head: ${lastVerifiedForkHead}
features:
  gallery:
    title: Gallery
    risk: medium
    domains: [server, mobile]
    owned_paths: [${(options.ownedPaths ?? []).join(", ")}]
    optional_paths: [${(options.optionalPaths ?? []).join(", ")}]
`,
  );
}
