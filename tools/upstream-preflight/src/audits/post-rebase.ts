import fs from "node:fs";
import path from "node:path";
import micromatch from "micromatch";
import type { AuditResult, Manifest } from "../types";

export type PostRebaseAuditReportInput = {
  date: string;
  batch?: string;
  results: AuditResult[];
  upstreamTouchedFiles: string[];
};

export function auditForkOwnedFiles(
  manifest: Manifest,
  currentFiles: string[],
): AuditResult {
  const missing: string[] = [];

  for (const feature of Object.values(manifest.features)) {
    for (const file of feature.owned_paths ?? []) {
      if (file.includes("*")) continue;
      if (!currentFiles.includes(file)) {
        missing.push(`Missing fork-owned file ${file}`);
      }
    }
  }

  return {
    ok: missing.length === 0,
    title: "Fork-Owned File Survival",
    details:
      missing.length > 0
        ? missing
        : ["All literal fork-owned files are present"],
  };
}

export function auditMigrationCount(
  migrations: string[],
  expectedMigrations: string[] = [],
): AuditResult {
  const expectedCount = expectedMigrations.length;
  const details =
    expectedCount > 0
      ? [
          `Gallery migration count: ${migrations.length} (expected ${expectedCount})`,
        ]
      : [`Gallery migration count: ${migrations.length}`];

  return {
    ok: expectedCount === 0 || migrations.length === expectedCount,
    title: "Gallery Migration Count",
    details,
  };
}

export function auditExpectedMigrations(
  manifest: Manifest,
  currentFiles: string[],
): AuditResult {
  const expectedMigrations = collectExpectedMigrations(manifest);
  const missing = expectedMigrations
    .filter((file) => !currentFiles.includes(file))
    .map((file) => `Missing expected Gallery migration ${file}`);

  return {
    ok: missing.length === 0,
    title: "Gallery Migration Filename Survival",
    details:
      missing.length > 0
        ? missing
        : ["All manifest expected migrations are present"],
  };
}

export function auditExtensionSymbols(
  manifest: Manifest,
  fileTextByPath: Record<string, string>,
): AuditResult {
  const details: string[] = [];

  for (const feature of Object.values(manifest.features)) {
    for (const [file, symbols] of Object.entries(
      feature.expected_symbols ?? {},
    )) {
      const text = fileTextByPath[file] ?? "";
      for (const symbol of symbols) {
        if (!text.includes(symbol)) {
          details.push(`${file} is missing expected symbol ${symbol}`);
        }
      }
    }
  }

  return {
    ok: details.length === 0,
    title: "Fork Extension Symbol Survival",
    details:
      details.length > 0
        ? details
        : ["All manifest expected symbols are present"],
  };
}

export function auditMigrationGlobs(
  manifest: Manifest,
  currentFiles: string[],
): AuditResult {
  const details: string[] = [];

  for (const feature of Object.values(manifest.features)) {
    for (const glob of feature.database?.migration_globs ?? []) {
      if (micromatch(currentFiles, glob, { dot: true }).length === 0) {
        details.push(`No Gallery migration matches ${glob}`);
      }
    }
  }

  return {
    ok: details.length === 0,
    title: "Gallery Migration Manifest Coverage",
    details:
      details.length > 0
        ? details
        : ["All manifest migration globs match current files"],
  };
}

export function auditMigrationTimestampCollisions(
  galleryMigrations: string[],
  upstreamMigrations: string[],
): AuditResult {
  const galleryTimestamps = new Set(
    galleryMigrations
      .map((file) => path.basename(file).match(/^(\d+)/)?.[1])
      .filter((value): value is string => Boolean(value)),
  );
  const details = upstreamMigrations
    .map((file) => path.basename(file).match(/^(\d+)/)?.[1])
    .filter(
      (value): value is string =>
        typeof value === "string" && galleryTimestamps.has(value),
    )
    .map((timestamp) => `Migration timestamp collision: ${timestamp}`);

  return {
    ok: details.length === 0,
    title: "Migration Timestamp Collision Check",
    details:
      details.length > 0
        ? [...new Set(details)]
        : ["No upstream migration timestamp collides with Gallery migrations"],
  };
}

export function auditGeneratedArtifactSignals(
  upstreamTouchedFiles: string[],
): AuditResult {
  const generatedFiles = micromatch(
    upstreamTouchedFiles,
    ["open-api/**", "mobile/openapi/**", "server/src/queries/**/*.sql"],
    { dot: true },
  );
  return {
    ok: generatedFiles.length === 0,
    title: "Generated Artifact Review",
    details:
      generatedFiles.length > 0
        ? generatedFiles.map((file) => `Review regenerated artifact ${file}`)
        : ["No upstream generated artifact changes require review"],
  };
}

export function runPostRebaseAudits(
  manifest: Manifest,
  upstreamTouchedFiles: string[] = [],
  cwd = process.cwd(),
): AuditResult[] {
  const currentFiles = listFiles(cwd);
  const migrationRoot = path.join(cwd, "server/src/schema/migrations-gallery");
  const migrations = fs.existsSync(migrationRoot)
    ? fs.readdirSync(migrationRoot).filter((file) => file.endsWith(".ts"))
    : [];
  const galleryMigrationPaths = migrations.map(
    (file) => `server/src/schema/migrations-gallery/${file}`,
  );
  const expectedMigrations = collectExpectedMigrations(manifest);
  const textPaths = Object.values(manifest.features).flatMap((feature) =>
    Object.keys(feature.expected_symbols ?? {}),
  );
  const fileTextByPath = Object.fromEntries(
    textPaths.map((file) => {
      const fullPath = path.join(cwd, file);
      return [
        file,
        fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : "",
      ];
    }),
  );
  const upstreamMigrations = micromatch(upstreamTouchedFiles, [
    "server/src/schema/migrations/**/*.ts",
  ]);

  return [
    auditForkOwnedFiles(manifest, currentFiles),
    auditExtensionSymbols(manifest, fileTextByPath),
    auditMigrationCount(migrations, expectedMigrations),
    auditExpectedMigrations(manifest, currentFiles),
    auditMigrationGlobs(manifest, currentFiles),
    auditMigrationTimestampCollisions(
      galleryMigrationPaths,
      upstreamMigrations,
    ),
    auditGeneratedArtifactSignals(upstreamTouchedFiles),
  ];
}

export function renderPostRebaseAuditMarkdown(
  input: PostRebaseAuditReportInput,
): string {
  const rows = input.results
    .map(
      (result) =>
        `| ${result.ok ? "OK" : "ISSUE"} | ${result.title} | ${result.details.join("<br>")} |`,
    )
    .join("\n");
  const touchedFiles =
    input.upstreamTouchedFiles.length > 0
      ? input.upstreamTouchedFiles.map((file) => `- \`${file}\``).join("\n")
      : "- None";
  const title = input.batch
    ? `Upstream Post-Rebase Audit - Batch ${input.batch}`
    : "Upstream Post-Rebase Audit";

  return `# ${title}

- **Date**: ${input.date}
- **Status**: ${input.results.every((result) => result.ok) ? "OK" : "ISSUE"}

## Audit Results

| Status | Check | Details |
| --- | --- | --- |
${rows || "| OK | No audit results | - |"}

## Upstream Touched Files

${touchedFiles}
`;
}

export function writePostRebaseAuditReport(
  outputDir: string,
  input: PostRebaseAuditReportInput,
) {
  fs.mkdirSync(outputDir, { recursive: true });
  const basename = input.batch
    ? `batch-${input.batch}-postrebase-audit`
    : `postrebase-audit-${input.date}`;
  const markdownPath = path.join(outputDir, `${basename}.md`);
  const jsonPath = path.join(outputDir, `${basename}.json`);

  fs.writeFileSync(markdownPath, renderPostRebaseAuditMarkdown(input));
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        ...input,
        ok: input.results.every((result) => result.ok),
      },
      null,
      2,
    ),
  );

  return { markdownPath, jsonPath };
}

function collectExpectedMigrations(manifest: Manifest): string[] {
  return [
    ...new Set(
      Object.values(manifest.features).flatMap(
        (feature) => feature.database?.expected_migrations ?? [],
      ),
    ),
  ].sort();
}

function listFiles(cwd: string): string[] {
  const files: string[] = [];
  const ignored = new Set([
    ".git",
    "node_modules",
    ".svelte-kit",
    "dist",
    "build",
  ]);
  const ignoredGlobs = [".claude/**", ".worktrees/**", "docker/library/**"];

  const walk = (directory: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (ignored.has(entry.name)) continue;
      const fullPath = path.join(directory, entry.name);
      const relativePath = path
        .relative(cwd, fullPath)
        .replaceAll(path.sep, "/");
      if (micromatch.isMatch(relativePath, ignoredGlobs, { dot: true })) {
        continue;
      }
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        files.push(relativePath);
      }
    }
  };

  walk(cwd);
  return files;
}
