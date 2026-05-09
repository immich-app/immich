import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createTempRepo } from '../test/fixtures';
import {
  planBatches,
  persistedBatchPlanPath,
  readPersistedBatchAuditScope,
  readPersistedBatchPlan,
  renderBatchMarkdown,
  renderNextBatchMarkdown,
  runNextBatchCommand,
  selectBatchAuditScope,
  selectNextBatch,
  validatePersistedBatchPlan,
  writeBatchPlanReports,
} from './batch';
import type {
  BatchPlan,
  BatchPlanMetadata,
  CheckEntry,
  ClassifiedCommit,
  Manifest,
  RiskLevel,
} from './types';

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

function commit(
  shortSha: string,
  risk: RiskLevel,
  reasons: string[] = [],
  files: string[] = [],
  requiredChecks = risk === 'high' ? ['mobile-drift-rebase-check'] : [],
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

describe('planBatches', () => {
  it('groups low risk commits up to the soft cap and isolates high risk commits', () => {
    const plan = planBatches(
      [
        commit('000000001', 'low'),
        commit('000000002', 'low'),
        commit('539a39ae4', 'high', ['Matches risk pattern mobile-drift']),
        commit('000000004', 'medium', [
          'Matches risk pattern openapi-generated',
        ]),
        commit('000000005', 'medium'),
      ],
      { metadata: metadata(), softCap: 10 },
    );

    expect(
      plan.batches.map((batch) => batch.commits.map((item) => item.shortSha)),
    ).toEqual([
      ['000000001', '000000002'],
      ['539a39ae4'],
      ['000000004'],
      ['000000005'],
    ]);
    expect(plan.batches[1].requiredChecks).toEqual([
      'mobile-drift-rebase-check',
    ]);
  });

  it('persists metadata and full upstream commit SHAs', () => {
    const planMetadata = metadata({
      generatedAt: '2026-05-05T06:00:00.000Z',
      softCap: 3,
    });
    const plan = planBatches([commit('539a39ae4', 'high')], {
      metadata: planMetadata,
      softCap: 3,
    });

    expect(plan.metadata).toEqual(planMetadata);
    expect(plan.metadata.generatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
    expect(plan.batches[0].tipSha).toBe(sha('539a39ae4'));
    expect(plan.batches[0].commits[0].sha).toBe(sha('539a39ae4'));
  });

  it('renders short SHAs in tables and full SHAs in commands', () => {
    const plan = planBatches([commit('539a39ae4', 'high')], {
      metadata: metadata(),
      softCap: 10,
      checks: checkCatalog(),
    });
    const markdown = renderBatchMarkdown(plan, checkCatalog());

    expect(markdown).toContain('| 01 | `539a39ae4` | 1 | HIGH | yes |');
    expect(markdown).toContain(`git rebase ${sha('539a39ae4')}`);
    expect(markdown).toContain('make mobile-drift-rebase-check BATCH=01');
  });

  it('splits cheap post-batch checks from expensive checkpoint checks', () => {
    const plan = planBatches(
      [
        commit(
          '111111111',
          'medium',
          ['openapi-generated'],
          [],
          ['cheap-check', 'expensive-check'],
        ),
        commit('222222222', 'low', [], [], ['cheap-check']),
      ],
      { metadata: metadata(), softCap: 10, checks: checkCatalog() },
    );

    expect(plan.batches[0]).toMatchObject({
      checkpoint: false,
      postBatchChecks: ['cheap-check'],
      checkpointChecks: [],
    });
    expect(plan.batches[1]).toMatchObject({
      checkpoint: true,
      postBatchChecks: ['cheap-check'],
      checkpointChecks: ['expensive-check'],
    });

    const markdown = renderBatchMarkdown(plan, checkCatalog());
    expect(markdown).toContain('make cheap-check');
    expect(markdown).toContain('make expensive-check');
    expect(markdown).toContain('git push origin HEAD:rebase/upstream-batch-02');
    expect(markdown).not.toContain(
      'git push origin HEAD:rebase/upstream-batch-01',
    );
  });

  it('checkpoints high-risk batches and resets low/medium cumulative counting', () => {
    const plan = planBatches(
      [
        commit('111111111', 'low'),
        commit('222222222', 'low'),
        commit('333333333', 'high', [], [], ['expensive-check']),
        commit('444444444', 'low'),
        commit('555555555', 'low'),
        commit('666666666', 'medium', ['openapi-generated']),
      ],
      { metadata: metadata(), softCap: 3, checks: checkCatalog() },
    );

    expect(plan.batches.map((batch) => batch.checkpoint)).toEqual([
      false,
      true,
      false,
      true,
    ]);
    expect(plan.batches[1].checkpointChecks).toEqual(['expensive-check']);
  });

  it('renders manifest check commands, missing-check fallbacks, and batch-scoped mobile Drift', () => {
    const plan = planBatches(
      [
        commit(
          '111111111',
          'high',
          [],
          [],
          ['cheap-check', 'missing-check', 'mobile-drift-rebase-check'],
        ),
      ],
      { metadata: metadata(), softCap: 10, checks: checkCatalog() },
    );
    const markdown = renderBatchMarkdown(plan, checkCatalog());
    const nextBatch = renderNextBatchMarkdown(
      { status: 'next', plan, batch: plan.batches[0], completedBatchCount: 0 },
      checkCatalog(),
    );

    expect(markdown).toContain('make cheap-check');
    expect(markdown).toContain('make missing-check');
    expect(markdown).toContain('make mobile-drift-rebase-check BATCH=01');
    expect(nextBatch).toContain('make mobile-drift-rebase-check BATCH=01');
  });
});

describe('batch plan reports', () => {
  it('writes Markdown and JSON reports idempotently', () => {
    const outputDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'gallery-batch-plan-'),
    );
    const plan = planBatches([commit('111111111', 'low')], {
      metadata: metadata(),
      softCap: 10,
    });

    const firstWrite = writeBatchPlanReports(plan, outputDir);
    const secondWrite = writeBatchPlanReports(plan, outputDir);

    expect(secondWrite).toEqual(firstWrite);
    expect(fs.readFileSync(firstWrite.markdownPath, 'utf8')).toContain(
      '| 01 | `111111111` |',
    );
    expect(JSON.parse(fs.readFileSync(firstWrite.jsonPath, 'utf8'))).toEqual(
      plan,
    );
  });

  it('can write under Git metadata without dirtying source status', () => {
    const repo = createTempRepo();
    repo.write('README.md', 'base');
    repo.commit('base commit');
    const plan = planBatches([commit('111111111', 'low')], {
      metadata: metadata(),
      softCap: 10,
    });
    const outputDir = path.dirname(persistedBatchPlanPath(repo.path));

    const paths = writeBatchPlanReports(plan, outputDir);

    expect(repo.path).not.toBe(process.cwd());
    expect(paths.markdownPath).toBe(path.join(outputDir, 'batch-plan.md'));
    expect(paths.jsonPath).toBe(persistedBatchPlanPath(repo.path));
    expect(readPersistedBatchPlan(repo.path)).toEqual(plan);
    expect(repo.git('status', '--short')).toBe('');
  });
});

describe('persisted batch plan validation', () => {
  it('reads and validates a current persisted plan', () => {
    const { repo, plan, outputDir } = createRepoWithPersistedPlan();

    const persisted = readPersistedBatchPlan(repo.path, outputDir);

    expect(persisted).toEqual(plan);
    expect(() =>
      validatePersistedBatchPlan(persisted, repo.path),
    ).not.toThrow();
  });

  it('fails clearly when the persisted plan is missing', () => {
    const repo = createTempRepo();
    repo.write('README.md', 'base');
    repo.commit('base commit');
    const outputDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'gallery-batch-plan-'),
    );

    expect(() => readPersistedBatchPlan(repo.path, outputDir)).toThrow(
      `Missing persisted batch plan ${path.join(outputDir, 'batch-plan.json')}; run make upstream-batch-plan first.`,
    );
  });

  it('fails clearly when the persisted plan JSON is corrupt', () => {
    const { repo, outputDir } = createRepoWithPersistedPlan();
    fs.writeFileSync(path.join(outputDir, 'batch-plan.json'), '{');

    expect(() => readPersistedBatchPlan(repo.path, outputDir)).toThrow(
      'Failed to parse persisted batch plan',
    );
  });

  it('fails clearly when required structure is missing', () => {
    const { repo, outputDir, commits } = createRepoWithPersistedPlan();
    fs.writeFileSync(
      path.join(outputDir, 'batch-plan.json'),
      JSON.stringify({
        metadata: metadata({
          upstreamRef: 'upstream',
          upstreamHead: commits[1].sha,
          forkRef: 'main',
          forkHead: commits[1].sha,
          manifestForkBaseline: commits[1].sha,
        }),
        batches: [
          {
            id: '01',
            tipSha: commits[0].sha,
            risk: 'low',
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
      'commits must contain at least one commit',
    );
  });

  it('rejects batch tips that are not full 40-character SHAs', () => {
    const { repo, outputDir, plan } = createRepoWithPersistedPlan();
    fs.writeFileSync(
      path.join(outputDir, 'batch-plan.json'),
      JSON.stringify({
        ...plan,
        batches: [{ ...plan.batches[0], tipSha: '123456789' }],
      }),
    );

    expect(() => readPersistedBatchPlan(repo.path, outputDir)).toThrow(
      'tipSha must be a full 40-character SHA',
    );
  });

  it.each([
    ['missing', undefined],
    ['malformed', ['mobile/drift_schemas/main/drift_schema_v23.json', 23]],
  ])('rejects persisted commits with %s files', (_label, files) => {
    const { repo, outputDir, plan } = createRepoWithPersistedPlan();
    const persistedPlan = JSON.parse(JSON.stringify(plan)) as {
      batches: Array<{ commits: Array<{ files?: unknown }> }>;
    };
    if (files === undefined) {
      delete persistedPlan.batches[0].commits[0].files;
    } else {
      persistedPlan.batches[0].commits[0].files = files;
    }
    fs.writeFileSync(
      path.join(outputDir, 'batch-plan.json'),
      JSON.stringify(persistedPlan),
    );

    expect(() => readPersistedBatchPlan(repo.path, outputDir)).toThrow(
      'commits[0].files must be an array of strings',
    );
  });

  it('rejects batch tips that are not ancestors of the persisted upstream head', () => {
    const { repo, plan } = createRepoWithPersistedPlan();
    repo.git('checkout', '-b', 'side', plan.metadata.mergeBase);
    repo.write('upstream/side.txt', 'side');
    const side = repo.commit('side commit');
    repo.git('checkout', 'main');
    const invalidPlan: BatchPlan = {
      ...plan,
      batches: [{ ...plan.batches[0], tipSha: side }],
    };

    expect(() => validatePersistedBatchPlan(invalidPlan, repo.path)).toThrow(
      `Persisted batch 01 tip ${side} is not an ancestor of upstream head ${plan.metadata.upstreamHead}. Run make upstream-batch-plan.`,
    );
  });

  it('rejects stale plans when the upstream ref moved', () => {
    const { repo, plan } = createRepoWithPersistedPlan();
    repo.git('checkout', 'upstream');
    repo.write('upstream/three.txt', 'three');
    const newUpstreamHead = repo.commit('upstream three');
    repo.git('checkout', 'main');

    expect(() => validatePersistedBatchPlan(plan, repo.path)).toThrow(
      `Persisted batch plan is stale: upstream is ${newUpstreamHead}, but batch-plan.json was generated for ${plan.metadata.upstreamHead}. Run make upstream-batch-plan.`,
    );
  });

  it('reads batch audit scope from the persisted plan after the upstream ref moved', () => {
    const { repo, outputDir, plan } = createRepoWithPersistedPlan();
    repo.git('checkout', 'upstream');
    repo.write('upstream/three.txt', 'three');
    repo.commit('upstream three');
    repo.git('checkout', 'main');

    expect(() => validatePersistedBatchPlan(plan, repo.path)).toThrow(
      'Persisted batch plan is stale',
    );
    expect(readPersistedBatchAuditScope(repo.path, outputDir, '02')).toEqual({
      batch: '02',
      upstreamTouchedFiles: plan.batches[1].commits.flatMap(
        (commit) => commit.files,
      ),
    });
  });
});

describe('upstream next batch', () => {
  it('reports no work when there are no incoming upstream commits', () => {
    const repo = createTempRepo();
    repo.write('README.md', 'base');
    const base = repo.commit('base commit');
    repo.git('branch', 'upstream', base);
    const plan: BatchPlan = {
      metadata: metadata({
        mergeBase: base,
        upstreamRef: 'upstream',
        upstreamHead: base,
        forkRef: 'main',
        forkHead: base,
        manifestForkBaseline: base,
      }),
      batches: [],
    };

    const output = renderNextBatchMarkdown(selectNextBatch(plan, repo.path));

    expect(output).toContain('No upstream batches are required');
    expect(output).not.toContain('git rebase');
  });

  it('prints batch 01 before the rebase starts', () => {
    const { repo, plan } = createRepoWithPersistedPlan({ upstreamCommits: 3 });

    const output = renderNextBatchMarkdown(selectNextBatch(plan, repo.path));

    expect(output).toContain('Next upstream batch: 01');
    expect(output).toContain(`Tip SHA: ${plan.batches[0].tipSha}`);
    expect(output).toContain(`git rebase ${plan.batches[0].tipSha}`);
  });

  it('prints the next batch after HEAD contains a middle batch tip', () => {
    const { repo, plan } = createRepoWithPersistedPlan({ upstreamCommits: 3 });
    repo.git('checkout', '-B', 'rebased', plan.batches[1].tipSha);
    repo.write('gallery/rebased.txt', 'fork');
    repo.commit('fork after batch 02');

    const output = renderNextBatchMarkdown(selectNextBatch(plan, repo.path));

    expect(output).toContain('Next upstream batch: 03');
    expect(output).toContain(`git rebase ${plan.batches[2].tipSha}`);
  });

  it('reports completion when the final batch tip is already included', () => {
    const { repo, plan, outputDir } = createRepoWithPersistedPlan({
      upstreamCommits: 3,
    });
    repo.git('checkout', '-B', 'rebased', plan.batches[2].tipSha);
    repo.write('gallery/rebased.txt', 'fork');
    repo.commit('fork after upstream head');
    const messages: string[] = [];

    const exitCode = runNextBatchCommand({
      repoPath: repo.path,
      outputDir,
      write: (message) => messages.push(message),
    });

    expect(exitCode).toBe(0);
    expect(messages.join('\n')).toContain('Upstream rebase already includes');
    expect(messages.join('\n')).not.toContain('git rebase');
  });

  it('exits non-zero for stale persisted plans', () => {
    const { repo, outputDir } = createRepoWithPersistedPlan();
    repo.git('checkout', 'upstream');
    repo.write('upstream/three.txt', 'three');
    repo.commit('upstream three');
    repo.git('checkout', 'main');
    const errors: string[] = [];

    const exitCode = runNextBatchCommand({
      repoPath: repo.path,
      outputDir,
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('Persisted batch plan is stale');
  });

  it('exits non-zero for missing persisted plans', () => {
    const repo = createTempRepo();
    repo.write('README.md', 'base');
    repo.commit('base commit');
    const errors: string[] = [];

    const exitCode = runNextBatchCommand({
      repoPath: repo.path,
      outputDir: fs.mkdtempSync(path.join(os.tmpdir(), 'gallery-batch-plan-')),
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('run make upstream-batch-plan first');
  });

  it('exits non-zero for corrupt or structurally invalid persisted plans', () => {
    const { repo, outputDir } = createRepoWithPersistedPlan();
    const errors: string[] = [];
    fs.writeFileSync(path.join(outputDir, 'batch-plan.json'), '{');

    const corruptExitCode = runNextBatchCommand({
      repoPath: repo.path,
      outputDir,
      writeError: (message) => errors.push(message),
    });

    fs.writeFileSync(
      path.join(outputDir, 'batch-plan.json'),
      JSON.stringify({ metadata: {}, batches: [] }),
    );
    const invalidExitCode = runNextBatchCommand({
      repoPath: repo.path,
      outputDir,
      writeError: (message) => errors.push(message),
    });

    expect(corruptExitCode).toBe(1);
    expect(invalidExitCode).toBe(1);
    expect(errors.join('\n')).toContain('Failed to parse persisted batch plan');
    expect(errors.join('\n')).toContain('metadata.generatedAt is required');
  });
});

describe('selectBatchAuditScope', () => {
  const batchPlan: BatchPlan = {
    metadata: metadata(),
    batches: [
      {
        id: '01',
        tipSha: sha('111111111'),
        commits: [
          commit(
            '111111111',
            'medium',
            [],
            [
              'server/src/queries/asset.job.repository.sql',
              'web/src/routes/+page.svelte',
            ],
          ),
        ],
        risk: 'medium',
        why: [],
        requiredChecks: [],
        postBatchChecks: [],
        checkpointChecks: [],
        checkpoint: false,
      },
      {
        id: '02',
        tipSha: sha('222222222'),
        commits: [
          commit(
            '222222222',
            'high',
            [],
            [
              'mobile/openapi/lib/api.dart',
              'open-api/immich-openapi-specs.json',
            ],
          ),
        ],
        risk: 'high',
        why: ['Matches risk pattern openapi-generated'],
        requiredChecks: ['mobile-drift-rebase-check'],
        postBatchChecks: ['mobile-drift-rebase-check'],
        checkpointChecks: [],
        checkpoint: true,
      },
    ],
  };

  const allUpstreamFiles = batchPlan.batches.flatMap((batch) =>
    batch.commits.flatMap((item) => item.files),
  );

  it('selects only the requested batch files for audit signals', () => {
    expect(
      selectBatchAuditScope({
        batch: '01',
        batchPlan,
        upstreamTouchedFiles: allUpstreamFiles,
      }),
    ).toEqual({
      batch: '01',
      upstreamTouchedFiles: [
        'server/src/queries/asset.job.repository.sql',
        'web/src/routes/+page.svelte',
      ],
    });
  });

  it('uses the full upstream file list when no batch is requested', () => {
    expect(
      selectBatchAuditScope({
        batchPlan,
        upstreamTouchedFiles: allUpstreamFiles,
      }).upstreamTouchedFiles,
    ).toEqual(allUpstreamFiles);
  });

  it('normalizes numeric batch ids and rejects unknown batches', () => {
    expect(
      selectBatchAuditScope({
        batch: '1',
        batchPlan,
        upstreamTouchedFiles: allUpstreamFiles,
      }).batch,
    ).toBe('01');

    expect(() =>
      selectBatchAuditScope({
        batch: '99',
        batchPlan,
        upstreamTouchedFiles: allUpstreamFiles,
      }),
    ).toThrow('Unknown upstream batch 99. Available batches: 01, 02');
  });
});

describe('batch-scoped audit CLI commands', () => {
  it('mobile-drift-check --batch reads persisted scope after refs move', () => {
    const { repo, outputDir, plan } = createRepoWithPersistedPlan();
    persistBatchFiles(plan, outputDir, '02', [
      'mobile/drift_schemas/main/drift_schema_v23.json',
    ]);
    repo.git('checkout', 'upstream');
    repo.write('upstream/three.txt', 'three');
    repo.commit('upstream three');
    repo.git('checkout', 'main');
    writeManifest(
      repo.path,
      manifestWithMissingRefs(repo.git('rev-parse', 'HEAD'), {
        features: {
          'mobile-drift': {
            title: 'Mobile Drift',
            risk: 'high',
            domains: ['mobile'],
            mobile: {
              drift_versions: {
                owned: [23],
                shipped: true,
                owner: 'gallery',
              },
            },
          },
        },
      }),
    );
    repo.write(
      'mobile/lib/infrastructure/repositories/db.repository.dart',
      `
        class GalleryDb {
          int get schemaVersion => 23;
          final migration = {
            from22To23: (m, v23) async {},
          };
        }
      `,
    );
    repo.write('mobile/drift_schemas/main/drift_schema_v22.json', '{}');
    repo.write('mobile/drift_schemas/main/drift_schema_v23.json', '{}');

    const result = runCli(repo.path, [
      'mobile-drift-check',
      '--manifest',
      'ownership.yml',
      '--batch',
      '02',
      '--plan-dir',
      outputDir,
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).not.toContain('ambiguous argument');
    expect(result.stdout).toContain('ISSUE: Mobile Drift Migration Check');
    expect(result.stdout).toContain(
      'Upstream touches shipped Gallery Drift version v23; keep Gallery v23 and renumber incoming upstream migrations to v24',
    );
  });

  it('postrebase-audit uses BATCH env fallback with persisted scope from plan-dir', () => {
    const { repo, outputDir: planDir, plan } = createRepoWithPersistedPlan();
    const reportDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'gallery-postrebase-audit-'),
    );
    const selectedFiles = [
      'open-api/typescript-sdk/index.ts',
      'server/src/schema/migrations/1770000000000-Upstream.ts',
    ];
    persistBatchFiles(plan, planDir, '02', selectedFiles);
    repo.git('checkout', 'upstream');
    repo.write('upstream/three.txt', 'three');
    repo.commit('upstream three');
    repo.git('checkout', 'main');
    writeManifest(
      repo.path,
      manifestWithMissingRefs(repo.git('rev-parse', 'HEAD'), {
        features: {
          'shared-spaces': {
            title: 'Shared Spaces',
            risk: 'high',
            domains: ['server'],
            owned_paths: ['server/src/services/shared-space.service.ts'],
            expected_symbols: {
              'server/src/schema/functions.ts': ['library_user'],
            },
            database: {
              migration_globs: [
                'server/src/schema/migrations-gallery/*SharedSpace*.ts',
              ],
              expected_migrations: [
                'server/src/schema/migrations-gallery/1770000000000-SharedSpace.ts',
              ],
            },
          },
        },
      }),
    );
    repo.write(
      'server/src/services/shared-space.service.ts',
      'export const sharedSpace = true;\n',
    );
    repo.write(
      'server/src/schema/functions.ts',
      'export const library_user = true;\n',
    );
    repo.write(
      'server/src/schema/migrations-gallery/1770000000000-SharedSpace.ts',
      'export class SharedSpace {}\n',
    );

    const result = runCli(
      repo.path,
      [
        'postrebase-audit',
        '--manifest',
        'ownership.yml',
        '--plan-dir',
        planDir,
        '--output-dir',
        reportDir,
      ],
      { BATCH: '02' },
    );
    const markdownPath = path.join(reportDir, 'batch-02-postrebase-audit.md');
    const jsonPath = path.join(reportDir, 'batch-02-postrebase-audit.json');
    const reportJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as {
      upstreamTouchedFiles: string[];
    };
    const reportMarkdown = fs.readFileSync(markdownPath, 'utf8');

    expect(result.status).toBe(1);
    expect(result.stderr).not.toContain('ambiguous argument');
    expect(result.stdout).toContain(
      `Wrote post-rebase audit report: ${markdownPath}`,
    );
    expect(fs.existsSync(markdownPath)).toBe(true);
    expect(fs.existsSync(jsonPath)).toBe(true);
    expect(
      fs.existsSync(path.join(planDir, 'batch-02-postrebase-audit.md')),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(planDir, 'batch-02-postrebase-audit.json')),
    ).toBe(false);
    expect(reportJson.upstreamTouchedFiles).toEqual(selectedFiles);
    expect(reportMarkdown).toContain('- `open-api/typescript-sdk/index.ts`');
    expect(reportMarkdown).toContain(
      '- `server/src/schema/migrations/1770000000000-Upstream.ts`',
    );
    expect(reportMarkdown).not.toContain(plan.batches[0].commits[0].files[0]);
  });
});

function createRepoWithPersistedPlan(
  options: { upstreamCommits?: number } = {},
) {
  const repo = createTempRepo();
  repo.write('README.md', 'base');
  const base = repo.commit('base commit');
  repo.git('checkout', '-b', 'upstream');

  const upstreamCommits: ClassifiedCommit[] = [];
  for (let index = 1; index <= (options.upstreamCommits ?? 2); index++) {
    repo.write(`upstream/${index}.txt`, `${index}`);
    const commitSha = repo.commit(`upstream ${index}`);
    upstreamCommits.push(
      classifiedCommit(commitSha, index === 2 ? 'high' : 'medium'),
    );
  }

  repo.git('checkout', 'main');
  repo.write('gallery/fork.txt', 'fork');
  const forkHead = repo.commit('fork commit');
  const upstreamHead = upstreamCommits.at(-1)?.sha ?? base;
  const plan = planBatches(upstreamCommits, {
    metadata: metadata({
      mergeBase: base,
      upstreamRef: 'upstream',
      upstreamHead,
      forkRef: 'main',
      forkHead,
      manifestForkBaseline: forkHead,
      softCap: 1,
    }),
    softCap: 1,
  });
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'gallery-batch-plan-'),
  );
  writeBatchPlanReports(plan, outputDir);

  return { repo, commits: upstreamCommits, plan, outputDir };
}

function persistBatchFiles(
  plan: BatchPlan,
  outputDir: string,
  batchId: string,
  files: string[],
) {
  const batch = plan.batches.find((candidate) => candidate.id === batchId);
  if (!batch) throw new Error(`Missing test batch ${batchId}`);
  batch.commits[0].files = files;
  writeBatchPlanReports(plan, outputDir);
}

function runCli(repoPath: string, args: string[], env: NodeJS.ProcessEnv = {}) {
  const result = spawnSync(
    'pnpm',
    [
      '--dir',
      packageRoot,
      'exec',
      'tsx',
      path.join(packageRoot, 'src/index.ts'),
      ...args,
    ],
    {
      cwd: repoPath,
      encoding: 'utf8',
      env: { ...process.env, ...env, INIT_CWD: repoPath },
    },
  );

  if (result.error) throw result.error;
  return result;
}

function writeManifest(repoPath: string, manifest: Manifest) {
  fs.writeFileSync(
    path.join(repoPath, 'ownership.yml'),
    manifestYaml(manifest),
  );
}

function manifestWithMissingRefs(
  lastVerifiedForkHead: string,
  overrides: Pick<Manifest, 'features'>,
): Manifest {
  return {
    version: 1,
    metadata: {
      upstream_remote: 'missing-upstream',
      upstream_branch: 'main',
      fork_remote: 'missing-origin',
      fork_branch: 'main',
      last_verified_fork_head: lastVerifiedForkHead,
    },
    features: overrides.features,
  };
}

function manifestYaml(manifest: Manifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
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
    reasons: risk === 'high' ? ['Matches risk pattern mobile-drift'] : [],
    requiredChecks: risk === 'high' ? ['mobile-drift-rebase-check'] : [],
  };
}

function metadata(
  overrides: Partial<BatchPlanMetadata> = {},
): BatchPlanMetadata {
  return {
    generatedAt: '2026-05-05T06:00:00.000Z',
    mergeBase: sha('aaaaaaaaa'),
    upstreamRef: 'upstream/main',
    upstreamHead: sha('bbbbbbbbb'),
    forkRef: 'origin/main',
    forkHead: sha('ccccccccc'),
    manifestForkBaseline: sha('ddddddddd'),
    softCap: 10,
    ...overrides,
  };
}

function checkCatalog(): Record<string, CheckEntry> {
  return {
    'cheap-check': {
      command: 'make cheap-check',
      phase: 'post-batch',
      cost: 'cheap',
    },
    'expensive-check': {
      command: 'make expensive-check',
      phase: 'post-batch',
      cost: 'expensive',
    },
    'mobile-drift-rebase-check': {
      command: 'make mobile-drift-rebase-check',
      phase: 'preflight-and-post-batch',
      cost: 'cheap',
    },
  };
}

function sha(prefix: string): string {
  return `${prefix}${'0'.repeat(40 - prefix.length)}`;
}
