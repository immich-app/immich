#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import micromatch from 'micromatch';
import { Command } from 'commander';
import { runCiInvariantAudits } from './audits/ci-invariants';
import { runMobileDriftAudit } from './audits/mobile-drift';
import { runPatchAudits } from './audits/patches';
import {
  runPostRebaseAudits,
  writePostRebaseAuditReport,
} from './audits/post-rebase';
import {
  planBatches,
  readPersistedBatchAuditScope,
  renderBatchMarkdown,
  runNextBatchCommand,
  writeBatchPlanReports,
} from './batch';
import {
  findBroadOptionalOnlyFiles,
  findUncoveredFiles,
  validateManifestForkHead,
} from './coverage';
import { collectGitRange, getGitPath, getMergeBase, revParse } from './git';
import { defaultManifestPath, loadManifest } from './manifest';
import {
  evaluateReadiness,
  readinessExitCode,
  renderReadinessMarkdown,
  writeReadinessReports,
} from './ready';
import { renderPreflightMarkdown } from './report';
import {
  assertNoActiveRollingSync,
  runRollingFinalCheckCommand,
  runRollingStartCommand,
  runRollingStatusCommand,
  runRollingSyncForkMainCommand,
} from './rolling';
import { classifyCommit, detectDomain } from './risk';
import {
  collectExtensionHotspots,
  collectFeatureOverlaps,
  collectForkSurfaceSignals,
} from './signals';
import type { ClassifiedCommit, Manifest } from './types';

const program = new Command()
  .name('gallery-upstream-preflight')
  .description('Gallery upstream rebase preflight and audit tooling');
const defaultBatchSoftCap = 10;

function resolveCliPath(inputPath: string) {
  return path.resolve(process.env.INIT_CWD ?? process.cwd(), inputPath);
}

function repoRoot() {
  return process.env.INIT_CWD ?? process.cwd();
}

function buildPreflightContext(manifestPath: string) {
  const manifest = loadManifest(resolveCliPath(manifestPath));
  const upstreamRef = `${manifest.metadata.upstream_remote}/${manifest.metadata.upstream_branch}`;
  const forkRef = `${manifest.metadata.fork_remote}/${manifest.metadata.fork_branch}`;
  const mergeBase = getMergeBase(process.cwd(), forkRef, upstreamRef);
  const upstreamHead = revParse(process.cwd(), upstreamRef);
  const forkHead = revParse(process.cwd(), forkRef);
  const upstreamRange = collectGitRange(
    process.cwd(),
    `${mergeBase}..${upstreamRef}`,
  );
  const forkRange = collectGitRange(process.cwd(), `${mergeBase}..${forkRef}`);
  const classifiedCommits = upstreamRange.commits.map((commit) =>
    classifyCommit(commit, manifest, forkRange.files),
  );
  const overlapFiles = upstreamRange.files.filter((file) =>
    forkRange.files.includes(file),
  );
  const batchPlan = planBatches(classifiedCommits, {
    metadata: {
      generatedAt: new Date().toISOString(),
      mergeBase,
      upstreamRef,
      upstreamHead,
      forkRef,
      forkHead,
      manifestForkBaseline: manifest.metadata.last_verified_fork_head,
      softCap: defaultBatchSoftCap,
    },
    softCap: defaultBatchSoftCap,
    checks: manifest.checks,
  });
  const batchMarkdown = renderBatchMarkdown(batchPlan, manifest.checks);
  const headValidation = validateManifestForkHead(manifest, {
    repoPath: process.cwd(),
    expectedHead: forkHead,
  });
  const broadOptionalOnly = findBroadOptionalOnlyFiles(
    forkRange.files,
    manifest,
    headValidation.changedSinceBaseline,
  );
  const forkSurfaceSignals = collectForkSurfaceSignals({
    manifest,
    forkFiles: forkRange.files,
    overlapFiles,
    broadOnlyRecentFiles: broadOptionalOnly,
  });

  return {
    manifest,
    mergeBase,
    upstreamRange,
    forkRange,
    batchPlan,
    classifiedCommits,
    overlapFiles,
    batchMarkdown,
    headValidation,
    broadOptionalOnly,
    forkSurfaceSignals,
  };
}

function collectDomainOverlaps(overlapFiles: string[]) {
  const byDomain = new Map<string, string[]>();
  for (const file of overlapFiles) {
    const domain = detectDomain(file);
    byDomain.set(domain, [...(byDomain.get(domain) ?? []), file]);
  }
  return [...byDomain.entries()]
    .map(([domain, files]) => ({ domain, files: files.sort() }))
    .sort((left, right) => left.domain.localeCompare(right.domain));
}

function collectSignalFiles(files: string[], globs: string[]): string[] {
  return micromatch(files, globs).sort();
}

function collectServerTableOverlaps(
  manifest: Manifest,
  upstreamFiles: string[],
) {
  const upstreamText = upstreamFiles.join('\n');
  const tables = Object.values(manifest.features).flatMap(
    (feature) => feature.database?.tables ?? [],
  );
  return [...new Set(tables)]
    .filter(
      (table) =>
        upstreamText.includes(table) ||
        upstreamText.includes(table.replaceAll('_', '-')),
    )
    .sort();
}

function collectBroadRefactorHints(commits: ClassifiedCommit[]): string[] {
  return commits
    .filter(
      (commit) =>
        commit.files.length >= 25 ||
        commit.reasons.some((reason) => reason.includes('breaking-refactor')),
    )
    .map(
      (commit) =>
        `${commit.shortSha} touches ${commit.files.length} files: ${commit.subject}`,
    );
}

function renderPreflightForContext(
  context: ReturnType<typeof buildPreflightContext>,
  date: string,
) {
  return renderPreflightMarkdown({
    date,
    mergeBase: context.mergeBase.slice(0, 9),
    upstreamShortStat: context.upstreamRange.shortStat,
    forkShortStat: context.forkRange.shortStat,
    classifiedCommits: context.classifiedCommits,
    incomingCommits: context.classifiedCommits,
    forkFileCount: context.forkRange.files.length,
    upstreamFileCount: context.upstreamRange.files.length,
    overlapFiles: context.overlapFiles,
    domainOverlaps: collectDomainOverlaps(context.overlapFiles),
    featureOverlaps: collectFeatureOverlaps(
      context.manifest,
      context.classifiedCommits,
    ),
    dependencyChanges: collectSignalFiles(context.upstreamRange.files, [
      'package.json',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      '**/package.json',
      'machine-learning/pyproject.toml',
      'machine-learning/uv.lock',
    ]),
    serverMigrationChanges: collectSignalFiles(context.upstreamRange.files, [
      'server/src/schema/migrations/**',
      'server/src/schema/tables/**',
    ]),
    serverTableOverlaps: collectServerTableOverlaps(
      context.manifest,
      context.upstreamRange.files,
    ),
    mobileDriftChanges: collectSignalFiles(context.upstreamRange.files, [
      'mobile/lib/infrastructure/repositories/db.repository.dart',
      'mobile/drift_schemas/main/**',
    ]),
    ciWorkflowChanges: collectSignalFiles(context.upstreamRange.files, [
      '.github/workflows/**',
    ]),
    broadRefactorHints: collectBroadRefactorHints(context.classifiedCommits),
    batchMarkdown: context.batchMarkdown,
    auditResults: [
      runMobileDriftAudit(
        context.manifest,
        context.upstreamRange.files,
        repoRoot(),
      ),
      ...runCiInvariantAudits(context.manifest, repoRoot()),
      ...runPatchAudits(context.manifest, repoRoot()),
    ],
    extensionHotspots: collectExtensionHotspots(
      context.manifest,
      context.classifiedCommits,
    ),
    forkSurfaceSignals: context.forkSurfaceSignals,
  });
}

function writePreflightReports(
  outputDir: string,
  context: ReturnType<typeof buildPreflightContext>,
  date: string,
) {
  fs.mkdirSync(outputDir, { recursive: true });
  const markdown = renderPreflightForContext(context, date);
  const markdownPath = path.join(outputDir, `preflight-${date}.md`);
  const jsonPath = path.join(outputDir, 'preflight.json');

  fs.writeFileSync(markdownPath, markdown);
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        mergeBase: context.mergeBase,
        classifiedCommits: context.classifiedCommits,
        forkSurfaceSignals: context.forkSurfaceSignals,
      },
      null,
      2,
    ),
  );

  return { markdown, markdownPath, jsonPath };
}

program
  .command('preflight')
  .option('--manifest <path>', 'ownership manifest path', defaultManifestPath)
  .option('--output-dir <path>', 'generated report directory')
  .action((options: { manifest: string; outputDir?: string }) => {
    const context = buildPreflightContext(options.manifest);
    const date = new Date().toISOString().slice(0, 10);
    const outputDir = options.outputDir
      ? resolveCliPath(options.outputDir)
      : getGitPath(process.cwd(), 'upstream-preflight');

    const { markdown } = writePreflightReports(outputDir, context, date);
    console.log(markdown);
  });

program
  .command('ready')
  .option('--manifest <path>', 'ownership manifest path', defaultManifestPath)
  .option('--output-dir <path>', 'generated report directory')
  .action((options: { manifest: string; outputDir?: string }) => {
    const outputDir = options.outputDir
      ? resolveCliPath(options.outputDir)
      : getGitPath(process.cwd(), 'upstream-preflight');
    let result = evaluateReadiness({});

    try {
      const context = buildPreflightContext(options.manifest);
      const date = new Date().toISOString().slice(0, 10);
      const preflight = writePreflightReports(outputDir, context, date);
      const batchPlan = writeBatchPlanReports(
        context.batchPlan,
        outputDir,
        context.manifest.checks,
      );
      const postRebaseAuditResults = runPostRebaseAudits(
        context.manifest,
        context.upstreamRange.files,
        repoRoot(),
      );

      result = evaluateReadiness({
        uncoveredFiles: findUncoveredFiles(
          context.forkRange.files,
          context.manifest,
        ),
        headValidation: context.headValidation,
        broadOptionalOnly: context.broadOptionalOnly,
        ciResults: runCiInvariantAudits(context.manifest, repoRoot()),
        patchResults: runPatchAudits(context.manifest, repoRoot()),
        postRebaseAuditResults,
        planningResults: [
          runMobileDriftAudit(
            context.manifest,
            context.upstreamRange.files,
            repoRoot(),
          ),
        ],
        reportPaths: [
          preflight.markdownPath,
          preflight.jsonPath,
          batchPlan.markdownPath,
          batchPlan.jsonPath,
        ],
      });
    } catch (error) {
      result = evaluateReadiness({ batchPlanError: errorMessage(error) });
    }

    const { result: writtenResult } = writeReadinessReports(outputDir, result);
    console.log(renderReadinessMarkdown(writtenResult));
    process.exitCode = readinessExitCode(writtenResult);
  });

program
  .command('batch-plan')
  .option('--manifest <path>', 'ownership manifest path', defaultManifestPath)
  .option('--output-dir <path>', 'generated batch plan directory')
  .action((options: { manifest: string; outputDir?: string }) => {
    const context = buildPreflightContext(options.manifest);
    const outputDir = options.outputDir
      ? resolveCliPath(options.outputDir)
      : getGitPath(process.cwd(), 'upstream-preflight');
    const { markdownPath, jsonPath } = writeBatchPlanReports(
      context.batchPlan,
      outputDir,
      context.manifest.checks,
    );
    console.log(context.batchMarkdown);
    console.log(`Wrote batch plan Markdown: ${markdownPath}`);
    console.log(`Wrote batch plan JSON: ${jsonPath}`);
  });

program
  .command('next-batch')
  .option('--manifest <path>', 'ownership manifest path', defaultManifestPath)
  .option('--output-dir <path>', 'generated batch plan directory')
  .action((options: { manifest: string; outputDir?: string }) => {
    const outputDir = options.outputDir
      ? resolveCliPath(options.outputDir)
      : undefined;
    try {
      assertNoActiveRollingSync(process.cwd(), outputDir);
    } catch (error) {
      console.error(errorMessage(error));
      process.exitCode = 1;
      return;
    }

    const manifest = loadManifest(resolveCliPath(options.manifest));
    process.exitCode = runNextBatchCommand({
      repoPath: process.cwd(),
      outputDir,
      checks: manifest.checks,
    });
  });

program
  .command('rolling-start')
  .option('--output-dir <path>', 'rolling state and batch plan directory')
  .option('--resume', 'resume an existing rolling state')
  .action((options: { outputDir?: string; resume?: boolean }) => {
    process.exitCode = runRollingStartCommand({
      repoPath: process.cwd(),
      outputDir: options.outputDir
        ? resolveCliPath(options.outputDir)
        : undefined,
      resume: options.resume,
    });
  });

program
  .command('rolling-status')
  .option('--output-dir <path>', 'rolling state and batch plan directory')
  .action((options: { outputDir?: string }) => {
    process.exitCode = runRollingStatusCommand({
      repoPath: process.cwd(),
      outputDir: options.outputDir
        ? resolveCliPath(options.outputDir)
        : undefined,
    });
  });

program
  .command('sync-fork-main')
  .option('--output-dir <path>', 'rolling state and batch plan directory')
  .option('--continue', 'continue a fork sync after checks failed')
  .action((options: { outputDir?: string; continue?: boolean }) => {
    process.exitCode = runRollingSyncForkMainCommand({
      repoPath: process.cwd(),
      outputDir: options.outputDir
        ? resolveCliPath(options.outputDir)
        : undefined,
      continue: options.continue,
    });
  });

program
  .command('rolling-final-check')
  .option('--output-dir <path>', 'rolling state and batch plan directory')
  .action((options: { outputDir?: string }) => {
    process.exitCode = runRollingFinalCheckCommand({
      repoPath: process.cwd(),
      outputDir: options.outputDir
        ? resolveCliPath(options.outputDir)
        : undefined,
    });
  });

program
  .command('mobile-drift-check')
  .option('--manifest <path>', 'ownership manifest path', defaultManifestPath)
  .option('--batch <id>', 'upstream batch id')
  .option('--plan-dir <path>', 'persisted batch plan directory')
  .action((options: { manifest: string; batch?: string; planDir?: string }) => {
    const batch = options.batch ?? process.env.BATCH;
    const auditInput = batch
      ? {
          manifest: loadManifest(resolveCliPath(options.manifest)),
          auditScope: readPersistedBatchAuditScope(
            process.cwd(),
            options.planDir ? resolveCliPath(options.planDir) : undefined,
            batch,
          ),
        }
      : (() => {
          const context = buildPreflightContext(options.manifest);
          return {
            manifest: context.manifest,
            auditScope: {
              batch: undefined,
              upstreamTouchedFiles: context.upstreamRange.files,
            },
          };
        })();
    const result = runMobileDriftAudit(
      auditInput.manifest,
      auditInput.auditScope.upstreamTouchedFiles,
      repoRoot(),
    );
    console.log(`${result.ok ? 'OK' : 'ISSUE'}: ${result.title}`);
    for (const detail of result.details) console.log(`- ${detail}`);
    process.exitCode = result.ok ? 0 : 1;
  });

program
  .command('ci-invariants-check')
  .option('--manifest <path>', 'ownership manifest path', defaultManifestPath)
  .action((options: { manifest: string }) => {
    const results = runCiInvariantAudits(
      loadManifest(resolveCliPath(options.manifest)),
      repoRoot(),
    );
    for (const result of results) {
      console.log(`${result.ok ? 'OK' : 'ISSUE'}: ${result.title}`);
      for (const detail of result.details) console.log(`- ${detail}`);
    }
    process.exitCode = results.every((result) => result.ok) ? 0 : 1;
  });

program
  .command('fork-patches-check')
  .option('--manifest <path>', 'ownership manifest path', defaultManifestPath)
  .action((options: { manifest: string }) => {
    const results = runPatchAudits(
      loadManifest(resolveCliPath(options.manifest)),
      repoRoot(),
    );
    for (const result of results) {
      console.log(`${result.ok ? 'OK' : 'ISSUE'}: ${result.title}`);
      for (const detail of result.details) console.log(`- ${detail}`);
    }
    process.exitCode = results.every((result) => result.ok) ? 0 : 1;
  });

program
  .command('postrebase-audit')
  .option('--manifest <path>', 'ownership manifest path', defaultManifestPath)
  .option('--batch <id>', 'upstream batch id')
  .option('--plan-dir <path>', 'persisted batch plan directory')
  .option('--output-dir <path>', 'post-rebase audit output directory')
  .action(
    (options: {
      manifest: string;
      batch?: string;
      planDir?: string;
      outputDir?: string;
    }) => {
      const batch = options.batch ?? process.env.BATCH;
      const auditInput = batch
        ? {
            manifest: loadManifest(resolveCliPath(options.manifest)),
            auditScope: readPersistedBatchAuditScope(
              process.cwd(),
              options.planDir ? resolveCliPath(options.planDir) : undefined,
              batch,
            ),
          }
        : (() => {
            const context = buildPreflightContext(options.manifest);
            return {
              manifest: context.manifest,
              auditScope: {
                batch: undefined,
                upstreamTouchedFiles: context.upstreamRange.files,
              },
            };
          })();
      const results = runPostRebaseAudits(
        auditInput.manifest,
        auditInput.auditScope.upstreamTouchedFiles,
        repoRoot(),
      );
      for (const result of results) {
        console.log(`${result.ok ? 'OK' : 'ISSUE'}: ${result.title}`);
        for (const detail of result.details) console.log(`- ${detail}`);
      }
      if (batch || options.outputDir) {
        const outputDir = options.outputDir
          ? resolveCliPath(options.outputDir)
          : path.join(
              getGitPath(process.cwd(), 'upstream-preflight'),
              'batches',
            );
        const { markdownPath } = writePostRebaseAuditReport(outputDir, {
          date: new Date().toISOString().slice(0, 10),
          batch: auditInput.auditScope.batch,
          results,
          upstreamTouchedFiles: auditInput.auditScope.upstreamTouchedFiles,
        });
        console.log(`Wrote post-rebase audit report: ${markdownPath}`);
      }
      process.exitCode = results.every((result) => result.ok) ? 0 : 1;
    },
  );

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

program.parse(process.argv);
