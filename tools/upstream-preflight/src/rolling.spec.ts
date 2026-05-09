import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createTempRepo } from '../test/fixtures';
import { planBatches, writeBatchPlanReports } from './batch';
import { getGitPath } from './git';
import {
  assertNoActiveRollingSync,
  defaultFinalChecks,
  defaultForkSyncChecks,
  readRollingState,
  renderRollingStatus,
  rollingStatePath,
  runRollingFinalCheckCommand,
  runRollingStartCommand,
  runRollingStatusCommand,
  runRollingSyncForkMainCommand,
  validateRollingState,
  writeRollingState,
} from './rolling';
import type { RollingState } from './rolling';
import type { BatchPlan, ClassifiedCommit, RiskLevel } from './types';

describe('rolling state validation', () => {
  it('accepts a valid v1 rolling state', () => {
    expect(validateRollingState(validState(), 'state.json')).toEqual(
      validState(),
    );
  });

  it('rejects invalid shape with actionable errors', () => {
    expect(() => validateRollingState({ version: 2 }, 'state.json')).toThrow(
      'Invalid rolling state state.json: version must be 1',
    );
    expect(() =>
      validateRollingState(
        { ...validState(), upstreamTargetHead: 'abc' },
        'state.json',
      ),
    ).toThrow('upstreamTargetHead must be a full 40-character SHA');
    expect(() =>
      validateRollingState(
        { ...validState(), branch: undefined },
        'state.json',
      ),
    ).toThrow('branch is required');
    expect(() =>
      validateRollingState(
        { ...validState(), startedForkHead: undefined },
        'state.json',
      ),
    ).toThrow('startedForkHead must be a full 40-character SHA');
    expect(() =>
      validateRollingState(
        { ...validState(), startedAt: 'not-a-date' },
        'state.json',
      ),
    ).toThrow('startedAt must be an ISO timestamp');
    expect(() =>
      validateRollingState(
        {
          ...validState(),
          activeForkSync: {
            status: 'checks-failed',
            from: sha('222222222'),
            to: 'abc',
            commits: [],
            preSyncHead: sha('333333333'),
          },
        },
        'state.json',
      ),
    ).toThrow('activeForkSync.to must be a full 40-character SHA');
    expect(() =>
      validateRollingState(
        {
          ...validState(),
          activeForkSync: {
            status: 'checks-failed',
            from: sha('222222222'),
            to: sha('333333333'),
            commits: [],
          },
        },
        'state.json',
      ),
    ).toThrow('activeForkSync.preSyncHead must be a full 40-character SHA');
    expect(() =>
      validateRollingState(
        {
          ...validState(),
          activeForkSync: {
            status: 'checks-failed',
            from: sha('222222222'),
            to: sha('333333333'),
            commits: [],
            preSyncHead: sha('444444444'),
            lastCompletedBatch: '',
          },
        },
        'state.json',
      ),
    ).toThrow('activeForkSync.lastCompletedBatch is required');
  });

  it('reads and writes rolling state under git metadata', () => {
    const repo = createTempRepo();
    repo.write('README.md', 'base');
    repo.commit('base commit');
    const state = validState();

    const written = writeRollingState(repo.path, state);
    const read = readRollingState(repo.path);
    const expectedPath = path.join(
      repo.path,
      '.git',
      'upstream-preflight',
      'rolling-state.json',
    );

    expect(written).toBe(rollingStatePath(repo.path));
    expect(written).toBe(expectedPath);
    expect(path.isAbsolute(written)).toBe(true);
    expect(fs.existsSync(written)).toBe(true);
    expect(read).toEqual(state);
    expect(repo.git('status', '--short')).toBe('');
  });
});

describe('active rolling sync guard', () => {
  it('allows upstream batch selection when no rolling state exists', () => {
    const repo = createTempRepo();
    repo.write('README.md', 'base');
    repo.commit('base commit');
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rolling-plan-'));

    expect(() => assertNoActiveRollingSync(repo.path, outputDir)).not.toThrow();
  });

  it('allows upstream batch selection when rolling state has no active fork sync', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();

    writeRollingState(repo.path, validStateFromPlan(plan), outputDir);

    expect(() => assertNoActiveRollingSync(repo.path, outputDir)).not.toThrow();
  });

  it('blocks upstream batch selection while a fork sync waits for checks', () => {
    const { repo, outputDir, plan } = createRepoWithPlan({
      forkCommitsAfterStart: 1,
    });

    writeRollingState(
      repo.path,
      validStateFromPlan(plan, undefined, {
        activeForkSync: {
          status: 'checks-failed',
          from: plan.metadata.forkHead,
          to: repo.git('rev-parse', 'main'),
          commits: [repo.git('rev-parse', 'main')],
          preSyncHead: plan.metadata.forkHead,
        },
      }),
      outputDir,
    );

    expect(() => assertNoActiveRollingSync(repo.path, outputDir)).toThrow(
      'A fork sync is waiting for checks',
    );
  });

  it('blocks the next-batch CLI while a fork sync waits for checks', () => {
    const { repo, outputDir, plan } = createRepoWithPlan({
      forkCommitsAfterStart: 1,
    });
    writeRollingState(
      repo.path,
      validStateFromPlan(plan, undefined, {
        activeForkSync: {
          status: 'checks-failed',
          from: plan.metadata.forkHead,
          to: repo.git('rev-parse', 'main'),
          commits: [repo.git('rev-parse', 'main')],
          preSyncHead: plan.metadata.forkHead,
        },
      }),
      outputDir,
    );
    const manifestPath = path.join(outputDir, 'manifest.json');
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        metadata: {
          upstream_remote: 'upstream',
          upstream_branch: 'main',
          fork_remote: 'origin',
          fork_branch: 'main',
          last_verified_fork_head: plan.metadata.forkHead,
        },
        checks: {},
        features: {},
      }),
    );
    const packageDir = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '..',
    );

    const result = spawnSync(
      path.join(packageDir, 'node_modules', '.bin', 'tsx'),
      [
        path.join(packageDir, 'src', 'index.ts'),
        'next-batch',
        '--manifest',
        manifestPath,
        '--output-dir',
        outputDir,
      ],
      {
        cwd: repo.path,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('A fork sync is waiting for checks');
    expect(result.stdout).not.toContain('Next upstream batch');
  });
});

describe('rolling start', () => {
  it('refuses to start on main with a clear error', () => {
    const { repo, outputDir } = createRepoWithPlan();
    const errors: string[] = [];

    const exitCode = runRollingStartCommand({
      repoPath: repo.path,
      outputDir,
      now: () => '2026-05-09T08:00:00.000Z',
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain(
      'Refusing to start rolling rebase on main',
    );
  });

  it('writes rolling state from the persisted batch plan on a non-main rebase branch', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const branch = 'rebase/upstream-2026-05';
    const output: string[] = [];
    repo.git('checkout', '-b', branch);

    const exitCode = runRollingStartCommand({
      repoPath: repo.path,
      outputDir,
      now: () => '2026-05-09T08:00:00.000Z',
      write: (message) => output.push(message),
    });

    expect(exitCode).toBe(0);
    expect(output.join('\n')).toContain(
      `Started rolling upstream rebase on ${branch}`,
    );
    expect(readRollingState(repo.path, outputDir)).toEqual(
      validStateFromPlan(plan, branch, {
        startedAt: '2026-05-09T08:00:00.000Z',
      }),
    );
  });

  it('refuses to start with a dirty worktree', () => {
    const { repo, outputDir } = createRepoWithPlan();
    const errors: string[] = [];
    repo.git('checkout', '-b', 'rebase/upstream-2026-05');
    repo.write('dirty.txt', 'dirty');

    const exitCode = runRollingStartCommand({
      repoPath: repo.path,
      outputDir,
      now: () => '2026-05-09T08:00:00.000Z',
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('Worktree is dirty');
  });

  it('refuses to overwrite existing rolling state without resume', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const errors: string[] = [];
    repo.git('checkout', '-b', 'rebase/upstream-2026-05');
    writeRollingState(repo.path, validStateFromPlan(plan), outputDir);

    const exitCode = runRollingStartCommand({
      repoPath: repo.path,
      outputDir,
      now: () => '2026-05-09T08:00:00.000Z',
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('Rolling state already exists');
    expect(errors.join('\n')).toContain('pass --resume');
  });

  it('resumes existing rolling state without rewriting it', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const output: string[] = [];
    repo.git('checkout', '-b', 'rebase/upstream-2026-05');
    const state = validStateFromPlan(plan, undefined, {
      integratedForkHead: sha('333333333'),
      lastForkSyncAt: '2026-05-09T09:00:00.000Z',
      activeForkSync: {
        status: 'checks-failed',
        from: plan.metadata.forkHead,
        to: sha('333333333'),
        commits: [sha('444444444')],
        preSyncHead: sha('555555555'),
      },
      appendHistory: [
        {
          at: '2026-05-09T09:05:00.000Z',
          from: plan.metadata.forkHead,
          to: sha('333333333'),
          commits: [sha('444444444')],
          lastCompletedBatch: '02',
          checks: ['pnpm check'],
        },
      ],
      checkHistory: [
        {
          at: '2026-05-09T09:10:00.000Z',
          phase: 'fork-sync',
          commands: ['pnpm check'],
          ok: false,
        },
        {
          at: '2026-05-09T09:15:00.000Z',
          phase: 'final',
          commands: ['pnpm test'],
          ok: true,
        },
      ],
    });
    const statePath = rollingStatePath(repo.path, outputDir);
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, `${JSON.stringify(state)}\n`);
    const before = fs.readFileSync(statePath, 'utf8');

    const exitCode = runRollingStartCommand({
      repoPath: repo.path,
      outputDir,
      resume: true,
      now: () => '2026-05-09T10:00:00.000Z',
      write: (message) => output.push(message),
    });
    const resumedState = readRollingState(repo.path, outputDir);

    expect(exitCode).toBe(0);
    expect(output.join('\n')).toContain(
      'Resumed rolling upstream rebase on rebase/upstream-2026-05',
    );
    expect(fs.readFileSync(statePath, 'utf8')).toBe(before);
    expect(resumedState.integratedForkHead).toBe(state.integratedForkHead);
    expect(resumedState.activeForkSync).toEqual(state.activeForkSync);
    expect(resumedState.appendHistory).toEqual(state.appendHistory);
    expect(resumedState.checkHistory).toEqual(state.checkHistory);
  });

  it('refuses resume from a branch that does not match rolling state', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const errors: string[] = [];
    repo.git('checkout', '-b', 'rebase/upstream-2026-05');
    const state = validStateFromPlan(plan);
    const statePath = rollingStatePath(repo.path, outputDir);
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, `${JSON.stringify(state)}\n`);
    const before = fs.readFileSync(statePath, 'utf8');
    repo.git('checkout', '-b', 'rebase/upstream-2026-06');

    const exitCode = runRollingStartCommand({
      repoPath: repo.path,
      outputDir,
      resume: true,
      now: () => '2026-05-09T10:00:00.000Z',
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain(
      'Cannot resume rolling rebase on rebase/upstream-2026-06',
    );
    expect(errors.join('\n')).toContain(
      'rolling state is for rebase/upstream-2026-05',
    );
    expect(fs.readFileSync(statePath, 'utf8')).toBe(before);
    expect(readRollingState(repo.path, outputDir)).toEqual(state);
  });

  it('refuses resume when rolling state is missing instead of creating new state', () => {
    const { repo, outputDir } = createRepoWithPlan({
      forkCommitsAfterStart: 1,
    });
    const errors: string[] = [];
    repo.git('checkout', '-b', 'rebase/upstream-2026-05');
    const statePath = rollingStatePath(repo.path, outputDir);

    const exitCode = runRollingStartCommand({
      repoPath: repo.path,
      outputDir,
      resume: true,
      now: () => '2026-05-09T08:00:00.000Z',
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('Missing rolling state');
    expect(errors.join('\n')).toContain(
      'run make upstream-rolling-start first',
    );
    expect(fs.existsSync(statePath)).toBe(false);
  });

  it('refuses to start or resume while a git operation is in progress', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const errors: string[] = [];
    repo.git('checkout', '-b', 'rebase/upstream-2026-05');
    const state = validStateFromPlan(plan);
    writeRollingState(repo.path, state, outputDir);
    writeGitControlFile(repo.path, 'MERGE_HEAD', `${plan.metadata.forkHead}\n`);

    const exitCode = runRollingStartCommand({
      repoPath: repo.path,
      outputDir,
      resume: true,
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('Git operation in progress');
    expect(readRollingState(repo.path, outputDir)).toEqual(state);
  });

  it('refuses to start from a detached HEAD with a clear error', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const errors: string[] = [];
    repo.git('checkout', '--detach', plan.metadata.forkHead);

    const exitCode = runRollingStartCommand({
      repoPath: repo.path,
      outputDir,
      now: () => '2026-05-09T08:00:00.000Z',
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('Detached HEAD');
    expect(errors.join('\n')).toContain('rebase branch');
  });

  it('refuses to start when HEAD does not match the persisted fork head', () => {
    const { repo, outputDir, plan } = createRepoWithPlan({
      forkCommitsAfterStart: 1,
    });
    const errors: string[] = [];
    repo.git('checkout', '-b', 'rebase/upstream-2026-05');
    const head = repo.git('rev-parse', 'HEAD');

    const exitCode = runRollingStartCommand({
      repoPath: repo.path,
      outputDir,
      now: () => '2026-05-09T08:00:00.000Z',
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain(
      `HEAD ${head} does not match planned fork head ${plan.metadata.forkHead}`,
    );
  });
});

describe('rolling status', () => {
  it('renders completed upstream batches and pending fork commits', () => {
    const { repo, outputDir, plan } = createRepoWithPlan({
      forkCommitsAfterStart: 2,
    });
    const branch = 'rebase/upstream-2026-05';
    repo.git('checkout', '-b', branch, plan.batches[0].tipSha);
    writeRollingState(
      repo.path,
      validStateFromPlan(plan, branch, {
        integratedForkHead: plan.metadata.forkHead,
      }),
      outputDir,
    );

    const output = renderRollingStatus({ repoPath: repo.path, outputDir });

    expect(output).toContain(`Branch: ${branch}`);
    expect(output).toContain(
      `Upstream target: ${plan.metadata.upstreamRef} (${plan.metadata.upstreamHead.slice(0, 9)})`,
    );
    expect(output).toContain('Completed upstream batches: 01 / 01');
    expect(output).toContain(
      `Integrated fork head: main @ ${plan.metadata.forkHead.slice(0, 9)}`,
    );
    expect(output).toContain(
      `Current main: ${repo.git('rev-parse', 'main').slice(0, 9)}`,
    );
    expect(output).toContain('Fork commits pending: 2');
    expect(output).toContain('Next action:');
    expect(output).toContain('run make upstream-sync-fork-main');
  });

  it('writes status and returns success', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const output: string[] = [];
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.forkHead,
    );
    writeRollingState(repo.path, validStateFromPlan(plan), outputDir);

    const exitCode = runRollingStatusCommand({
      repoPath: repo.path,
      outputDir,
      write: (message) => output.push(message),
    });

    expect(exitCode).toBe(0);
    expect(output.join('\n')).toContain('Rolling upstream rebase status');
    expect(output.join('\n')).toContain('Completed upstream batches: 00 / 01');
  });

  it('refuses status from a branch that does not match rolling state without rewriting state', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const errors: string[] = [];
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.forkHead,
    );
    const state = validStateFromPlan(plan, 'rebase/upstream-2026-05');
    writeRollingState(repo.path, state, outputDir);
    const statePath = rollingStatePath(repo.path, outputDir);
    const before = fs.readFileSync(statePath, 'utf8');
    repo.git('checkout', '-b', 'rebase/upstream-2026-06');

    const exitCode = runRollingStatusCommand({
      repoPath: repo.path,
      outputDir,
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain(
      'Cannot render rolling status on rebase/upstream-2026-06',
    );
    expect(errors.join('\n')).toContain(
      'rolling state is for rebase/upstream-2026-05',
    );
    expect(fs.readFileSync(statePath, 'utf8')).toBe(before);
    expect(readRollingState(repo.path, outputDir)).toEqual(state);
  });

  it('renders status with a warning when the persisted plan is stale', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const output: string[] = [];
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.forkHead,
    );
    writeRollingState(repo.path, validStateFromPlan(plan), outputDir);
    repo.git('checkout', 'upstream');
    repo.write('upstream-new.txt', 'new upstream');
    repo.commit('upstream moved');
    repo.git('checkout', 'rebase/upstream-2026-05');

    const exitCode = runRollingStatusCommand({
      repoPath: repo.path,
      outputDir,
      write: (message) => output.push(message),
    });

    const status = output.join('\n');
    expect(exitCode).toBe(0);
    expect(status).toContain('Warning: Persisted batch plan is stale');
    expect(status).toContain(
      `Upstream target: ${plan.metadata.upstreamRef} (${plan.metadata.upstreamHead.slice(0, 9)})`,
    );
    expect(status).toContain('Completed upstream batches: 00 / 01');
  });

  it('renders status with unknown completed batches when a persisted batch tip is unusable', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const output: string[] = [];
    const prunedTip = sha('fffffffff');
    writeBatchPlanReports(
      {
        ...plan,
        batches: plan.batches.map((batch, index) =>
          index === 0 ? { ...batch, tipSha: prunedTip } : batch,
        ),
      },
      outputDir,
    );
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.forkHead,
    );
    writeRollingState(repo.path, validStateFromPlan(plan), outputDir);

    const exitCode = runRollingStatusCommand({
      repoPath: repo.path,
      outputDir,
      write: (message) => output.push(message),
    });

    const status = output.join('\n');
    expect(exitCode).toBe(0);
    expect(status).toContain('Warning: git merge-base --is-ancestor failed');
    expect(status).toContain(
      `Warning: git merge-base --is-ancestor failed for ${prunedTip}..HEAD`,
    );
    expect(status).toContain('Completed upstream batches: unknown / 01');
    expect(status).toContain(
      'Next action: inspect or regenerate the persisted batch plan before continuing',
    );
    expect(status).not.toContain('Next action: run make upstream-next-batch');
  });

  it('warns and reports unknown pending fork commits when the fork ref diverged', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.forkHead,
    );
    writeRollingState(repo.path, validStateFromPlan(plan), outputDir);
    repo.git('checkout', 'main');
    repo.git('reset', '--hard', plan.metadata.mergeBase);
    repo.write('fork-rewritten.txt', 'rewritten fork');
    const rewrittenForkHead = repo.commit('rewrite fork main');
    repo.git('checkout', 'rebase/upstream-2026-05');

    const output = renderRollingStatus({ repoPath: repo.path, outputDir });

    expect(output).toContain(
      `Warning: integrated fork head ${plan.metadata.forkHead} is not an ancestor of main (${rewrittenForkHead})`,
    );
    expect(output).toContain('Fork commits pending: unknown');
    expect(output).toContain(
      `Integrated fork head: main @ ${plan.metadata.forkHead.slice(0, 9)}`,
    );
    expect(output).toContain(`Current main: ${rewrittenForkHead.slice(0, 9)}`);
    expect(output).toContain(
      'Next action: inspect fork ref divergence before continuing',
    );
    expect(output).not.toContain('Next action: run make upstream-next-batch');
  });

  it('prioritizes active fork sync continuation over pending fork commits', () => {
    const { repo, outputDir, plan } = createRepoWithPlan({
      forkCommitsAfterStart: 1,
    });
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.forkHead,
    );
    writeRollingState(
      repo.path,
      validStateFromPlan(plan, undefined, {
        activeForkSync: {
          status: 'checks-failed',
          from: plan.metadata.forkHead,
          to: repo.git('rev-parse', 'main'),
          commits: [repo.git('rev-parse', 'main')],
          preSyncHead: plan.metadata.forkHead,
        },
      }),
      outputDir,
    );

    const output = renderRollingStatus({ repoPath: repo.path, outputDir });

    expect(output).toContain('Fork commits pending: 1');
    expect(output).toContain(
      'Next action: run make upstream-sync-fork-main ROLLING_CONTINUE=1',
    );
  });

  it('returns failure and writes an error when rolling state is missing', () => {
    const { repo, outputDir } = createRepoWithPlan();
    const errors: string[] = [];

    const exitCode = runRollingStatusCommand({
      repoPath: repo.path,
      outputDir,
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('Missing rolling state');
    expect(errors.join('\n')).toContain(
      'run make upstream-rolling-start first',
    );
  });

  it('exposes rolling status through the package CLI', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.forkHead,
    );
    writeRollingState(repo.path, validStateFromPlan(plan), outputDir);
    const packageDir = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '..',
    );

    const output = execFileSync(
      path.join(packageDir, 'node_modules', '.bin', 'tsx'),
      [
        path.join(packageDir, 'src', 'index.ts'),
        'rolling-status',
        '--output-dir',
        outputDir,
      ],
      {
        cwd: repo.path,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    expect(output).toContain('Rolling upstream rebase status');
    expect(output).toContain('Completed upstream batches: 00 / 01');
    expect(output).toContain('Next action: run make upstream-next-batch');
  });
});

describe('rolling fork sync', () => {
  it('uses deterministic default fork-sync checks', () => {
    expect(defaultForkSyncChecks()).toEqual([
      'make fork-ownership-coverage-check',
      'make ci-invariants-check',
      'make fork-patches-check',
    ]);
    expect(defaultForkSyncChecks('01')).toEqual([
      'make fork-ownership-coverage-check',
      'make ci-invariants-check',
      'make fork-patches-check',
      'make upstream-postrebase-audit BATCH=01',
    ]);
  });

  it('runs default fork-sync checks when no injected check runner is provided', () => {
    const { repo, outputDir, plan } = createRepoWithPlan({
      forkCommitsAfterStart: 1,
    });
    const commands: string[] = [];
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.upstreamHead,
    );
    writeRollingState(
      repo.path,
      validStateFromPlan(plan, 'rebase/upstream-2026-05', {
        integratedForkHead: plan.metadata.forkHead,
      }),
      outputDir,
    );

    const exitCode = runRollingSyncForkMainCommand({
      repoPath: repo.path,
      outputDir,
      fetchFork: () => undefined,
      shellRunner: (command) => {
        commands.push(command);
        return { status: 0, stdout: `${command} ok`, stderr: '' };
      },
    });

    expect(exitCode).toBe(0);
    expect(commands).toEqual(defaultForkSyncChecks('01'));
    expect(readRollingState(repo.path, outputDir).checkHistory).toContainEqual(
      expect.objectContaining({
        phase: 'fork-sync',
        commands: defaultForkSyncChecks('01'),
        ok: true,
      }),
    );
  });

  it('no-ops when no fork commits are pending', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const output: string[] = [];
    const state = validStateFromPlan(plan);
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.forkHead,
    );
    writeRollingState(repo.path, state, outputDir);

    const exitCode = runRollingSyncForkMainCommand({
      repoPath: repo.path,
      outputDir,
      fetchFork: () => undefined,
      write: (message) => output.push(message),
    });

    expect(exitCode).toBe(0);
    expect(output.join('\n')).toContain('No fork commits pending');
    expect(readRollingState(repo.path, outputDir)).toEqual(state);
  });

  it('cherry-picks pending fork commits, runs checks, and records sync history', () => {
    const { repo, outputDir, plan } = createRepoWithPlan({
      forkCommitsAfterStart: 2,
    });
    const output: string[] = [];
    const checkContexts: Array<{ phase: 'fork-sync'; batch?: string }> = [];
    const pendingCommits = repo
      .git('rev-list', '--reverse', `${plan.metadata.forkHead}..main`)
      .split('\n')
      .filter(Boolean);
    const forkHead = repo.git('rev-parse', 'main');
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.forkHead,
    );
    writeRollingState(repo.path, validStateFromPlan(plan), outputDir);

    const exitCode = runRollingSyncForkMainCommand({
      repoPath: repo.path,
      outputDir,
      now: () => '2026-05-09T11:00:00.000Z',
      fetchFork: () => undefined,
      runChecks: (context) => {
        checkContexts.push(context);
        return { ok: true, commands: ['pnpm check'], output: 'ok' };
      },
      write: (message) => output.push(message),
    });

    expect(exitCode).toBe(0);
    expect(repo.git('rev-parse', 'HEAD')).toBe(forkHead);
    expect(checkContexts).toEqual([{ phase: 'fork-sync' }]);
    expect(readRollingState(repo.path, outputDir)).toEqual(
      validStateFromPlan(plan, undefined, {
        integratedForkHead: forkHead,
        lastForkSyncAt: '2026-05-09T11:00:00.000Z',
        appendHistory: [
          {
            at: '2026-05-09T11:00:00.000Z',
            from: plan.metadata.forkHead,
            to: forkHead,
            commits: pendingCommits,
            checks: ['pnpm check'],
          },
        ],
        checkHistory: [
          {
            at: '2026-05-09T11:00:00.000Z',
            phase: 'fork-sync',
            commands: ['pnpm check'],
            ok: true,
          },
        ],
      }),
    );
    expect(output.join('\n')).toContain('Synced 2 fork commits');
  });

  it('leaves state unpromoted and recoverable when the first cherry-pick conflicts', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const errors: string[] = [];
    repo.write('fork.txt', 'fork version\n');
    const forkHead = repo.commit('feat: conflicting fork change (#2)');
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.forkHead,
    );
    repo.write('fork.txt', 'rebase branch version\n');
    const preSyncHead = repo.commit('prepare conflicting rebase branch');
    const state = validStateFromPlan(plan);
    writeRollingState(repo.path, state, outputDir);
    const statePath = rollingStatePath(repo.path, outputDir);
    const beforeState = fs.readFileSync(statePath, 'utf8');

    const exitCode = runRollingSyncForkMainCommand({
      repoPath: repo.path,
      outputDir,
      fetchFork: () => undefined,
      runChecks: () => {
        throw new Error('checks must not run after cherry-pick conflict');
      },
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('cherry-pick');
    expect(repo.git('rev-parse', 'HEAD')).toBe(preSyncHead);
    expect(repo.git('status', '--short')).toContain('UU fork.txt');
    expect(fs.readFileSync(statePath, 'utf8')).toBe(beforeState);
    expect(readRollingState(repo.path, outputDir)).toEqual(state);
    repo.git('cherry-pick', '--abort');
    expect(repo.git('rev-parse', 'HEAD')).toBe(preSyncHead);
    expect(repo.git('status', '--short')).toBe('');
    expect(repo.git('rev-parse', 'main')).toBe(forkHead);
  });

  it('keeps state unpromoted and recoverable when a later cherry-pick conflicts', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const errors: string[] = [];
    repo.write('fork-after-safe.txt', 'safe\n');
    const firstPendingCommit = repo.commit('feat: safe fork change (#2)');
    repo.write('fork.txt', 'fork version\n');
    const forkHead = repo.commit('feat: conflicting fork change (#3)');
    const pendingCommits = [firstPendingCommit, forkHead];
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.forkHead,
    );
    repo.write('fork.txt', 'rebase branch version\n');
    const preSyncHead = repo.commit('prepare conflicting rebase branch');
    const state = validStateFromPlan(plan);
    writeRollingState(repo.path, state, outputDir);

    const exitCode = runRollingSyncForkMainCommand({
      repoPath: repo.path,
      outputDir,
      fetchFork: () => undefined,
      runChecks: () => {
        throw new Error('checks must not run after cherry-pick conflict');
      },
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('cherry-pick');
    expect(repo.git('rev-parse', 'HEAD')).toBe(preSyncHead);
    expect(repo.git('status', '--short')).toBe('');
    expect(readRollingState(repo.path, outputDir)).toEqual(state);
    expect(
      repo.git('rev-list', '--reverse', `${state.integratedForkHead}..main`),
    ).toBe(pendingCommits.join('\n'));
  });

  it('records active fork sync and failed checks without promoting integrated fork head', () => {
    const { repo, outputDir, plan } = createRepoWithPlan({
      forkCommitsAfterStart: 1,
    });
    const errors: string[] = [];
    const pendingCommits = repo
      .git('rev-list', '--reverse', `${plan.metadata.forkHead}..main`)
      .split('\n')
      .filter(Boolean);
    const forkHead = repo.git('rev-parse', 'main');
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.forkHead,
    );
    writeRollingState(repo.path, validStateFromPlan(plan), outputDir);

    const exitCode = runRollingSyncForkMainCommand({
      repoPath: repo.path,
      outputDir,
      now: () => '2026-05-09T13:00:00.000Z',
      fetchFork: () => undefined,
      runChecks: () => ({
        ok: false,
        commands: ['pnpm check'],
        output: 'check failed',
      }),
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('Fork sync checks failed');
    expect(readRollingState(repo.path, outputDir)).toEqual(
      validStateFromPlan(plan, undefined, {
        activeForkSync: {
          status: 'checks-failed',
          from: plan.metadata.forkHead,
          to: forkHead,
          commits: pendingCommits,
          preSyncHead: plan.metadata.forkHead,
        },
        checkHistory: [
          {
            at: '2026-05-09T13:00:00.000Z',
            phase: 'fork-sync',
            commands: ['pnpm check'],
            ok: false,
          },
        ],
      }),
    );

    const retryErrors: string[] = [];
    const retryExitCode = runRollingSyncForkMainCommand({
      repoPath: repo.path,
      outputDir,
      fetchFork: () => undefined,
      writeError: (message) => retryErrors.push(message),
    });

    expect(retryExitCode).toBe(1);
    expect(retryErrors.join('\n')).toContain(
      'A fork sync is waiting for checks; rerun with continue',
    );
  });

  it('requires an active fork sync when continue is requested', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const errors: string[] = [];
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.forkHead,
    );
    writeRollingState(repo.path, validStateFromPlan(plan), outputDir);

    const exitCode = runRollingSyncForkMainCommand({
      repoPath: repo.path,
      outputDir,
      continue: true,
      fetchFork: () => {
        throw new Error('continue must not fetch or cherry-pick');
      },
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('No active fork sync to continue');
  });

  it('continues failed checks without cherry-picking and promotes after checks pass', () => {
    const { repo, outputDir, plan } = createRepoWithPlan({
      forkCommitsAfterStart: 1,
    });
    const output: string[] = [];
    const pendingCommits = repo
      .git('rev-list', '--reverse', `${plan.metadata.forkHead}..main`)
      .split('\n')
      .filter(Boolean);
    const forkHead = repo.git('rev-parse', 'main');
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.forkHead,
    );
    repo.git('cherry-pick', ...pendingCommits);
    const rebasedHead = repo.git('rev-parse', 'HEAD');
    writeRollingState(
      repo.path,
      validStateFromPlan(plan, undefined, {
        activeForkSync: {
          status: 'checks-failed',
          from: plan.metadata.forkHead,
          to: forkHead,
          commits: pendingCommits,
          preSyncHead: plan.metadata.forkHead,
        },
        checkHistory: [
          {
            at: '2026-05-09T13:00:00.000Z',
            phase: 'fork-sync',
            commands: ['pnpm check'],
            ok: false,
          },
        ],
      }),
      outputDir,
    );

    const exitCode = runRollingSyncForkMainCommand({
      repoPath: repo.path,
      outputDir,
      continue: true,
      now: () => '2026-05-09T14:00:00.000Z',
      fetchFork: () => {
        throw new Error('continue must not fetch or cherry-pick');
      },
      runChecks: () => ({ ok: true, commands: ['pnpm check'], output: 'ok' }),
      write: (message) => output.push(message),
    });

    expect(exitCode).toBe(0);
    expect(repo.git('rev-parse', 'HEAD')).toBe(rebasedHead);
    expect(readRollingState(repo.path, outputDir)).toEqual(
      validStateFromPlan(plan, undefined, {
        integratedForkHead: forkHead,
        lastForkSyncAt: '2026-05-09T14:00:00.000Z',
        appendHistory: [
          {
            at: '2026-05-09T14:00:00.000Z',
            from: plan.metadata.forkHead,
            to: forkHead,
            commits: pendingCommits,
            checks: ['pnpm check'],
          },
        ],
        checkHistory: [
          {
            at: '2026-05-09T13:00:00.000Z',
            phase: 'fork-sync',
            commands: ['pnpm check'],
            ok: false,
          },
          {
            at: '2026-05-09T14:00:00.000Z',
            phase: 'fork-sync',
            commands: ['pnpm check'],
            ok: true,
          },
        ],
      }),
    );
    expect(output.join('\n')).toContain('Synced 1 fork commits');
  });

  it('refuses continue after HEAD is reset before the active fork sync target', () => {
    const { repo, outputDir, plan } = createRepoWithPlan({
      forkCommitsAfterStart: 1,
    });
    const errors: string[] = [];
    const pendingCommits = repo
      .git('rev-list', '--reverse', `${plan.metadata.forkHead}..main`)
      .split('\n')
      .filter(Boolean);
    const forkHead = repo.git('rev-parse', 'main');
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.forkHead,
    );
    repo.git('cherry-pick', ...pendingCommits);
    const state = validStateFromPlan(plan, undefined, {
      activeForkSync: {
        status: 'checks-failed',
        from: plan.metadata.forkHead,
        to: forkHead,
        commits: pendingCommits,
        preSyncHead: plan.metadata.forkHead,
      },
      checkHistory: [
        {
          at: '2026-05-09T13:00:00.000Z',
          phase: 'fork-sync',
          commands: ['pnpm check'],
          ok: false,
        },
      ],
    });
    writeRollingState(repo.path, state, outputDir);
    const statePath = rollingStatePath(repo.path, outputDir);
    const beforeState = fs.readFileSync(statePath, 'utf8');
    repo.git('reset', '--hard', plan.metadata.forkHead);

    const exitCode = runRollingSyncForkMainCommand({
      repoPath: repo.path,
      outputDir,
      continue: true,
      runChecks: () => {
        throw new Error('checks must not run when HEAD lost sync commits');
      },
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('Cannot continue fork sync');
    expect(errors.join('\n')).toContain(
      `current HEAD ${plan.metadata.forkHead} does not contain recorded fork sync target ${forkHead}`,
    );
    expect(fs.readFileSync(statePath, 'utf8')).toBe(beforeState);
    expect(readRollingState(repo.path, outputDir)).toEqual(state);
  });

  it('continues after a fix commit on top of the active fork sync target', () => {
    const { repo, outputDir, plan } = createRepoWithPlan({
      forkCommitsAfterStart: 1,
    });
    const output: string[] = [];
    const pendingCommits = repo
      .git('rev-list', '--reverse', `${plan.metadata.forkHead}..main`)
      .split('\n')
      .filter(Boolean);
    const forkHead = repo.git('rev-parse', 'main');
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.forkHead,
    );
    repo.git('cherry-pick', ...pendingCommits);
    repo.write('fix.txt', 'follow-up fix\n');
    const fixHead = repo.commit('fix fork sync checks');
    writeRollingState(
      repo.path,
      validStateFromPlan(plan, undefined, {
        activeForkSync: {
          status: 'checks-failed',
          from: plan.metadata.forkHead,
          to: forkHead,
          commits: pendingCommits,
          preSyncHead: plan.metadata.forkHead,
        },
        checkHistory: [
          {
            at: '2026-05-09T13:00:00.000Z',
            phase: 'fork-sync',
            commands: ['pnpm check'],
            ok: false,
          },
        ],
      }),
      outputDir,
    );

    const exitCode = runRollingSyncForkMainCommand({
      repoPath: repo.path,
      outputDir,
      continue: true,
      now: () => '2026-05-09T14:00:00.000Z',
      runChecks: () => ({ ok: true, commands: ['pnpm check'], output: 'ok' }),
      write: (message) => output.push(message),
    });

    expect(exitCode).toBe(0);
    expect(repo.git('rev-parse', 'HEAD')).toBe(fixHead);
    expect(readRollingState(repo.path, outputDir).integratedForkHead).toBe(
      forkHead,
    );
    expect(output.join('\n')).toContain('Synced 1 fork commits');
  });

  it('refuses to sync a rewritten fork ref without mutating rolling state', () => {
    const { repo, outputDir, plan } = createRepoWithPlan({
      forkCommitsAfterStart: 1,
    });
    const errors: string[] = [];
    let checksRan = false;
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.forkHead,
    );
    const state = validStateFromPlan(plan);
    writeRollingState(repo.path, state, outputDir);
    const statePath = rollingStatePath(repo.path, outputDir);
    const beforeState = fs.readFileSync(statePath, 'utf8');
    const beforeHead = repo.git('rev-parse', 'HEAD');
    repo.git('checkout', 'main');
    repo.git('reset', '--hard', plan.metadata.mergeBase);
    repo.write('fork-rewritten.txt', 'rewritten fork');
    const rewrittenForkHead = repo.commit('rewrite fork main');
    repo.git('checkout', 'rebase/upstream-2026-05');

    const exitCode = runRollingSyncForkMainCommand({
      repoPath: repo.path,
      outputDir,
      fetchFork: () => undefined,
      runChecks: () => {
        checksRan = true;
        return { ok: true, commands: ['pnpm check'] };
      },
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain(
      `integrated fork head ${plan.metadata.forkHead} is not an ancestor of main (${rewrittenForkHead})`,
    );
    expect(errors.join('\n')).toContain('Inspect fork ref divergence');
    expect(repo.git('rev-parse', 'HEAD')).toBe(beforeHead);
    expect(checksRan).toBe(false);
    expect(fs.readFileSync(statePath, 'utf8')).toBe(beforeState);
    expect(readRollingState(repo.path, outputDir)).toEqual(state);
  });

  it('passes the last completed upstream batch to fork-sync checks and history', () => {
    const { repo, outputDir, plan } = createRepoWithPlan({
      forkCommitsAfterStart: 1,
      upstreamCommits: 2,
    });
    const checkContexts: Array<{ phase: 'fork-sync'; batch?: string }> = [];
    const pendingCommits = repo
      .git('rev-list', '--reverse', `${plan.metadata.forkHead}..main`)
      .split('\n')
      .filter(Boolean);
    const forkHead = repo.git('rev-parse', 'main');
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.batches[0].tipSha,
    );
    writeRollingState(repo.path, validStateFromPlan(plan), outputDir);

    const exitCode = runRollingSyncForkMainCommand({
      repoPath: repo.path,
      outputDir,
      now: () => '2026-05-09T12:00:00.000Z',
      fetchFork: () => undefined,
      runChecks: (context) => {
        checkContexts.push(context);
        return { ok: true, commands: ['pnpm check --batch 01'] };
      },
    });

    expect(exitCode).toBe(0);
    expect(checkContexts).toEqual([{ phase: 'fork-sync', batch: '01' }]);
    expect(readRollingState(repo.path, outputDir).appendHistory).toEqual([
      {
        at: '2026-05-09T12:00:00.000Z',
        from: plan.metadata.forkHead,
        to: forkHead,
        commits: pendingCommits,
        lastCompletedBatch: '01',
        checks: ['pnpm check --batch 01'],
      },
    ]);
  });

  it('preserves completed upstream batch context when continuing failed fork sync checks', () => {
    const { repo, outputDir, plan } = createRepoWithPlan({
      forkCommitsAfterStart: 1,
      upstreamCommits: 2,
    });
    const checkContexts: Array<{ phase: 'fork-sync'; batch?: string }> = [];
    const pendingCommits = repo
      .git('rev-list', '--reverse', `${plan.metadata.forkHead}..main`)
      .split('\n')
      .filter(Boolean);
    const forkHead = repo.git('rev-parse', 'main');
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.batches[0].tipSha,
    );
    writeRollingState(repo.path, validStateFromPlan(plan), outputDir);

    const failedExitCode = runRollingSyncForkMainCommand({
      repoPath: repo.path,
      outputDir,
      now: () => '2026-05-09T12:00:00.000Z',
      fetchFork: () => undefined,
      runChecks: (context) => {
        checkContexts.push(context);
        return {
          ok: false,
          commands: ['pnpm check --batch 01'],
          output: 'failed',
        };
      },
    });

    expect(failedExitCode).toBe(1);
    expect(checkContexts).toEqual([{ phase: 'fork-sync', batch: '01' }]);
    const failedState = readRollingState(repo.path, outputDir);
    expect(failedState.activeForkSync?.lastCompletedBatch).toBe('01');
    expect(failedState.appendHistory).toEqual([]);

    repo.git('cherry-pick', plan.batches[1].tipSha);

    const continueExitCode = runRollingSyncForkMainCommand({
      repoPath: repo.path,
      outputDir,
      continue: true,
      now: () => '2026-05-09T12:30:00.000Z',
      runChecks: (context) => {
        checkContexts.push(context);
        return {
          ok: true,
          commands: ['pnpm check --batch 01'],
          output: 'ok',
        };
      },
    });

    expect(continueExitCode).toBe(0);
    expect(checkContexts).toEqual([
      { phase: 'fork-sync', batch: '01' },
      { phase: 'fork-sync', batch: '01' },
    ]);
    expect(readRollingState(repo.path, outputDir).appendHistory).toEqual([
      {
        at: '2026-05-09T12:30:00.000Z',
        from: plan.metadata.forkHead,
        to: forkHead,
        commits: pendingCommits,
        lastCompletedBatch: '01',
        checks: ['pnpm check --batch 01'],
      },
    ]);
  });
});

describe('rolling final check', () => {
  it('uses deterministic default final checks', () => {
    expect(defaultFinalChecks()).toEqual([
      'make fork-ownership-coverage-check',
      'make upstream-next-batch',
      'make upstream-postrebase-audit',
      'make ci-invariants-check',
      'make fork-patches-check',
      'pnpm --filter @gallery/upstream-preflight run test',
      'pnpm --filter @gallery/upstream-preflight run check',
      'pnpm --filter @gallery/upstream-preflight run format',
    ]);
  });

  it('runs default final checks when no injected check runner is provided', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const commands: string[] = [];
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.upstreamHead,
    );
    repo.git('cherry-pick', plan.metadata.forkHead);
    writeRollingState(
      repo.path,
      validStateFromPlan(plan, 'rebase/upstream-2026-05'),
      outputDir,
    );

    const exitCode = runRollingFinalCheckCommand({
      repoPath: repo.path,
      outputDir,
      fetchFork: () => undefined,
      shellRunner: (command) => {
        commands.push(command);
        return { status: 0, stdout: `${command} ok`, stderr: '' };
      },
    });

    expect(exitCode).toBe(0);
    expect(commands).toEqual(defaultFinalChecks());
    expect(readRollingState(repo.path, outputDir).checkHistory).toContainEqual(
      expect.objectContaining({
        phase: 'final',
        commands: defaultFinalChecks(),
        ok: true,
      }),
    );
  });

  it('blocks when the fork ref moved after the last fork sync', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const errors: string[] = [];
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.upstreamHead,
    );
    writeRollingState(
      repo.path,
      validStateFromPlan(plan, 'rebase/upstream-2026-05'),
      outputDir,
    );
    repo.git('checkout', 'main');
    repo.write('late.txt', 'late');
    repo.commit('feat: late fork (#3)');
    repo.git('checkout', 'rebase/upstream-2026-05');

    const exitCode = runRollingFinalCheckCommand({
      repoPath: repo.path,
      outputDir,
      fetchFork: () => undefined,
      runChecks: () => ({ ok: true, commands: [] }),
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain(
      `${plan.metadata.forkRef} has commits not included in integratedForkHead`,
    );
  });

  it('blocks while active fork sync exists', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const errors: string[] = [];
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.upstreamHead,
    );
    writeRollingState(
      repo.path,
      validStateFromPlan(plan, 'rebase/upstream-2026-05', {
        activeForkSync: {
          status: 'checks-failed',
          from: plan.metadata.forkHead,
          to: plan.metadata.forkHead,
          commits: [],
          preSyncHead: plan.metadata.forkHead,
        },
      }),
      outputDir,
    );

    const exitCode = runRollingFinalCheckCommand({
      repoPath: repo.path,
      outputDir,
      fetchFork: () => undefined,
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('A fork sync is still active');
  });

  it('reports missing fork commit subject and PR matches', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const errors: string[] = [];
    repo.git('checkout', 'main');
    repo.write('pr-44.txt', 'pr');
    const newForkHead = repo.commit('feat: important fork work (#44)');
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.upstreamHead,
    );
    writeRollingState(
      repo.path,
      validStateFromPlan(plan, 'rebase/upstream-2026-05', {
        integratedForkHead: newForkHead,
      }),
      outputDir,
    );

    const exitCode = runRollingFinalCheckCommand({
      repoPath: repo.path,
      outputDir,
      fetchFork: () => undefined,
      runChecks: () => ({ ok: true, commands: [] }),
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('#44');
  });

  it('reports patch-equivalence mismatches even when subjects match', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const errors: string[] = [];
    repo.git('checkout', 'main');
    repo.write('same-subject.txt', 'origin patch');
    const newForkHead = repo.commit('feat: same subject (#55)');
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.upstreamHead,
    );
    repo.write('fork.txt', 'fork');
    repo.commit('fork commit (#1)');
    repo.write('same-subject.txt', 'conflict resolved differently');
    repo.commit('feat: same subject (#55)');
    writeRollingState(
      repo.path,
      validStateFromPlan(plan, 'rebase/upstream-2026-05', {
        integratedForkHead: newForkHead,
      }),
      outputDir,
    );

    const exitCode = runRollingFinalCheckCommand({
      repoPath: repo.path,
      outputDir,
      fetchFork: () => undefined,
      runChecks: () => ({ ok: true, commands: [] }),
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('Patch-equivalence mismatch');
    expect(errors.join('\n')).toContain('#55');
  });

  it('accepts an equivalent fork commit when the PR number still matches after retitling', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const output: string[] = [];
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.upstreamHead,
    );
    repo.git('cherry-pick', plan.metadata.forkHead);
    repo.git('commit', '--amend', '-m', 'retitled fork work (#1)');
    writeRollingState(
      repo.path,
      validStateFromPlan(plan, 'rebase/upstream-2026-05'),
      outputDir,
    );

    const exitCode = runRollingFinalCheckCommand({
      repoPath: repo.path,
      outputDir,
      now: () => '2026-05-09T14:30:00.000Z',
      fetchFork: () => undefined,
      runChecks: () => ({ ok: true, commands: [] }),
      write: (message) => output.push(message),
    });

    expect(exitCode).toBe(0);
    expect(output.join('\n')).toContain(
      'Rolling upstream rebase final check passed',
    );
  });

  it('passes when upstream target and current fork head are fully accounted for', () => {
    const { repo, outputDir, plan } = createRepoWithPlan({
      forkCommitsAfterStart: 1,
    });
    const output: string[] = [];
    const forkHead = repo.git('rev-parse', 'main');
    const forkCommits = repo
      .git('rev-list', '--reverse', `${plan.metadata.upstreamHead}..main`)
      .split('\n')
      .filter(Boolean);
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.upstreamHead,
    );
    repo.git('cherry-pick', ...forkCommits);
    writeRollingState(
      repo.path,
      validStateFromPlan(plan, 'rebase/upstream-2026-05', {
        integratedForkHead: forkHead,
      }),
      outputDir,
    );

    const exitCode = runRollingFinalCheckCommand({
      repoPath: repo.path,
      outputDir,
      now: () => '2026-05-09T15:00:00.000Z',
      fetchFork: () => undefined,
      runChecks: () => ({ ok: true, commands: ['pnpm check'] }),
      write: (message) => output.push(message),
    });

    expect(exitCode).toBe(0);
    expect(output.join('\n')).toContain(
      'Rolling upstream rebase final check passed',
    );
    expect(readRollingState(repo.path, outputDir).checkHistory).toContainEqual({
      at: '2026-05-09T15:00:00.000Z',
      phase: 'final',
      commands: ['pnpm check'],
      ok: true,
    });
  });

  it('reports when HEAD is missing the upstream target', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const errors: string[] = [];
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.forkHead,
    );
    writeRollingState(repo.path, validStateFromPlan(plan), outputDir);

    const exitCode = runRollingFinalCheckCommand({
      repoPath: repo.path,
      outputDir,
      fetchFork: () => undefined,
      runChecks: () => ({ ok: true, commands: [] }),
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain(
      `HEAD does not include upstream target ${plan.metadata.upstreamHead}`,
    );
  });

  it('appends final check history when local checks fail', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    const errors: string[] = [];
    repo.git(
      'checkout',
      '-b',
      'rebase/upstream-2026-05',
      plan.metadata.upstreamHead,
    );
    writeRollingState(
      repo.path,
      validStateFromPlan(plan, 'rebase/upstream-2026-05'),
      outputDir,
    );

    const exitCode = runRollingFinalCheckCommand({
      repoPath: repo.path,
      outputDir,
      now: () => '2026-05-09T16:00:00.000Z',
      fetchFork: () => undefined,
      runChecks: () => ({
        ok: false,
        commands: ['pnpm check'],
        output: 'typecheck failed',
      }),
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('Final local checks failed');
    expect(errors.join('\n')).toContain('typecheck failed');
    expect(readRollingState(repo.path, outputDir).checkHistory).toContainEqual({
      at: '2026-05-09T16:00:00.000Z',
      phase: 'final',
      commands: ['pnpm check'],
      ok: false,
    });
  });
});

function validState(overrides: Partial<RollingState> = {}): RollingState {
  return {
    version: 1,
    mode: 'rolling-upstream-rebase',
    branch: 'rebase/upstream-2026-05',
    upstreamRef: 'upstream/main',
    upstreamTargetHead: sha('111111111'),
    forkRef: 'origin/main',
    startedForkHead: sha('222222222'),
    integratedForkHead: sha('222222222'),
    startedAt: '2026-05-09T07:30:00.000Z',
    appendHistory: [],
    checkHistory: [],
    ...overrides,
  };
}

function validStateFromPlan(
  plan: BatchPlan,
  branch = 'rebase/upstream-2026-05',
  overrides: Partial<RollingState> = {},
): RollingState {
  return validState({
    branch,
    upstreamRef: plan.metadata.upstreamRef,
    upstreamTargetHead: plan.metadata.upstreamHead,
    forkRef: plan.metadata.forkRef,
    startedForkHead: plan.metadata.forkHead,
    integratedForkHead: plan.metadata.forkHead,
    ...overrides,
  });
}

function createRepoWithPlan(
  options: { forkCommitsAfterStart?: number; upstreamCommits?: number } = {},
) {
  const repo = createTempRepo();
  repo.write('README.md', 'base');
  const base = repo.commit('base commit');
  repo.git('checkout', '-b', 'upstream');

  const upstreamCommits: ClassifiedCommit[] = [];
  for (let index = 1; index <= (options.upstreamCommits ?? 1); index++) {
    repo.write(`upstream-${index}.txt`, `upstream ${index}`);
    const commitSha = repo.commit(`upstream commit ${index}`);
    upstreamCommits.push(classifiedCommit(commitSha, 'low'));
  }

  repo.git('checkout', 'main');
  repo.write('fork.txt', 'fork');
  const forkHead = repo.commit('fork commit (#1)');

  const plan = planBatches(upstreamCommits, {
    metadata: {
      generatedAt: '2026-05-09T07:00:00.000Z',
      mergeBase: base,
      upstreamRef: 'upstream',
      upstreamHead: upstreamCommits.at(-1)?.sha ?? base,
      forkRef: 'main',
      forkHead,
      manifestForkBaseline: forkHead,
      softCap: 1,
    },
    softCap: 1,
  });

  for (let index = 1; index <= (options.forkCommitsAfterStart ?? 0); index++) {
    repo.write(`fork-after-${index}.txt`, `fork after ${index}`);
    repo.commit(`feat: fork after start ${index} (#${index + 1})`);
  }

  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rolling-plan-'));
  writeBatchPlanReports(plan, outputDir);
  return { repo, outputDir, plan };
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

function writeGitControlFile(
  repoPath: string,
  gitPath: string,
  content: string,
) {
  const metadataPath = getGitPath(repoPath, gitPath);
  const fullPath = path.isAbsolute(metadataPath)
    ? metadataPath
    : path.resolve(repoPath, metadataPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

function sha(prefix: string): string {
  return `${prefix}${'0'.repeat(40 - prefix.length)}`;
}
