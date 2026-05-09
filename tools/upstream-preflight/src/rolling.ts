import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  readPersistedBatchPlan,
  selectNextBatch,
  validatePersistedBatchPlan,
} from './batch';
import {
  cherryEquivalent,
  commitSubjects,
  currentBranch,
  getGitPath,
  hasGitOperationInProgress,
  isAncestor,
  isCleanWorktree,
  listCommits,
  revParse,
  runGit,
} from './git';
import type { BatchPlan } from './types';

const fullShaPattern = /^[0-9a-f]{40}$/;

export type RollingState = {
  version: 1;
  mode: 'rolling-upstream-rebase';
  branch: string;
  upstreamRef: string;
  upstreamTargetHead: string;
  forkRef: string;
  startedForkHead: string;
  integratedForkHead: string;
  startedAt: string;
  lastForkSyncAt?: string;
  activeForkSync?: {
    status: 'checks-failed';
    from: string;
    to: string;
    commits: string[];
    preSyncHead: string;
    lastCompletedBatch?: string;
  };
  appendHistory?: Array<{
    at: string;
    from: string;
    to: string;
    commits: string[];
    lastCompletedBatch?: string;
    checks: string[];
  }>;
  checkHistory?: Array<{
    at: string;
    phase: 'fork-sync' | 'final';
    commands: string[];
    ok: boolean;
  }>;
};

export type RollingCommandOptions = {
  repoPath: string;
  outputDir?: string;
  resume?: boolean;
  now?: () => string;
  write?: (message: string) => void;
  writeError?: (message: string) => void;
};

export type CheckResult = { ok: boolean; commands: string[]; output?: string };

export type ShellRunner = (
  command: string,
  cwd: string,
) => { status: number; stdout: string; stderr: string };

export type RollingSyncOptions = RollingCommandOptions & {
  continue?: boolean;
  fetchFork?: (repoPath: string, forkRef: string) => void;
  runChecks?: (context: { phase: 'fork-sync'; batch?: string }) => CheckResult;
  shellRunner?: ShellRunner;
};

export type RollingFinalCheckOptions = RollingCommandOptions & {
  fetchFork?: (repoPath: string, forkRef: string) => void;
  runChecks?: (context: { phase: 'final' }) => CheckResult;
  shellRunner?: ShellRunner;
};

export function rollingStatePath(repoPath: string, outputDir?: string): string {
  if (outputDir !== undefined) {
    return path.join(outputDir, 'rolling-state.json');
  }

  const gitPath = getGitPath(repoPath, 'upstream-preflight');
  const stateDir = path.isAbsolute(gitPath)
    ? gitPath
    : path.resolve(repoPath, gitPath);

  return path.join(stateDir, 'rolling-state.json');
}

export function readRollingState(
  repoPath: string,
  outputDir?: string,
): RollingState {
  const statePath = rollingStatePath(repoPath, outputDir);
  if (!fs.existsSync(statePath)) {
    throw new Error(
      `Missing rolling state ${statePath}; run make upstream-rolling-start first.`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (error) {
    throw new Error(
      `Failed to parse rolling state ${statePath}: ${errorMessage(error)}`,
    );
  }

  return validateRollingState(parsed, statePath);
}

export function assertNoActiveRollingSync(
  repoPath: string,
  outputDir?: string,
): void {
  const statePath = rollingStatePath(repoPath, outputDir);
  if (!fs.existsSync(statePath)) return;

  const state = readRollingState(repoPath, outputDir);
  if (state.activeForkSync) {
    throw new Error(
      'A fork sync is waiting for checks; run make upstream-sync-fork-main ROLLING_CONTINUE=1 before selecting the next upstream batch.',
    );
  }
}

export function writeRollingState(
  repoPath: string,
  state: RollingState,
  outputDir?: string,
): string {
  const statePath = rollingStatePath(repoPath, outputDir);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(
    statePath,
    `${JSON.stringify(validateRollingState(state, 'rolling state'), null, 2)}\n`,
  );
  return statePath;
}

export function runRollingStartCommand(options: RollingCommandOptions): number {
  const write = options.write ?? console.log;
  const writeError = options.writeError ?? console.error;

  try {
    const branch = currentBranch(options.repoPath);
    if (branch.length === 0) {
      throw new Error(
        'Detached HEAD; check out a rebase branch before starting rolling rebase.',
      );
    }
    if (branch === 'main') {
      throw new Error('Refusing to start rolling rebase on main');
    }
    if (hasGitOperationInProgress(options.repoPath)) {
      throw new Error(
        'Git operation in progress; finish or abort it before starting or resuming rolling rebase.',
      );
    }

    if (options.resume) {
      const state = readRollingState(options.repoPath, options.outputDir);
      if (branch !== state.branch) {
        throw new Error(
          `Cannot resume rolling rebase on ${branch}; rolling state is for ${state.branch}. Check out ${state.branch} before resuming.`,
        );
      }
      write(`Resumed rolling upstream rebase on ${state.branch}`);
      return 0;
    }

    if (!isCleanWorktree(options.repoPath)) {
      throw new Error(
        'Worktree is dirty; commit or stash changes before starting rolling rebase.',
      );
    }

    const statePath = rollingStatePath(options.repoPath, options.outputDir);
    if (fs.existsSync(statePath) && !options.resume) {
      throw new Error(
        `Rolling state already exists at ${statePath}; pass --resume to reuse it.`,
      );
    }

    const plan = readPersistedBatchPlan(options.repoPath, options.outputDir);
    validatePersistedBatchPlan(plan, options.repoPath);

    const head = revParse(options.repoPath, 'HEAD');
    if (head !== plan.metadata.forkHead) {
      throw new Error(
        `HEAD ${head} does not match planned fork head ${plan.metadata.forkHead}; pass --resume only after verifying branch state.`,
      );
    }

    const state: RollingState = {
      version: 1,
      mode: 'rolling-upstream-rebase',
      branch,
      upstreamRef: plan.metadata.upstreamRef,
      upstreamTargetHead: plan.metadata.upstreamHead,
      forkRef: plan.metadata.forkRef,
      startedForkHead: plan.metadata.forkHead,
      integratedForkHead: plan.metadata.forkHead,
      startedAt: options.now?.() ?? new Date().toISOString(),
      appendHistory: [],
      checkHistory: [],
    };

    writeRollingState(options.repoPath, state, options.outputDir);
    write(`Started rolling upstream rebase on ${branch}`);
    return 0;
  } catch (error) {
    writeError(errorMessage(error));
    return 1;
  }
}

export function renderRollingStatus(
  options: Pick<RollingCommandOptions, 'repoPath' | 'outputDir'>,
): string {
  const state = readRollingState(options.repoPath, options.outputDir);
  const branch = currentBranch(options.repoPath);
  if (branch !== state.branch) {
    throw new Error(
      `Cannot render rolling status on ${branch || 'detached HEAD'}; rolling state is for ${state.branch}. Check out ${state.branch} before checking status.`,
    );
  }

  const plan = readPersistedBatchPlan(options.repoPath, options.outputDir);
  const warnings: string[] = [];
  try {
    validatePersistedBatchPlan(plan, options.repoPath);
  } catch (error) {
    warnings.push(`Warning: ${errorMessage(error)}`);
  }

  let completedBatchCount: number | undefined;
  try {
    const selection = selectNextBatch(plan, options.repoPath);
    completedBatchCount =
      selection.status === 'none' ? 0 : selection.completedBatchCount;
  } catch (error) {
    warnings.push(`Warning: ${errorMessage(error)}`);
  }
  const currentForkHead = revParse(options.repoPath, state.forkRef);
  const forkPendingStatus = isAncestor(
    options.repoPath,
    state.integratedForkHead,
    state.forkRef,
  )
    ? String(
        listCommits(
          options.repoPath,
          `${state.integratedForkHead}..${state.forkRef}`,
        ).length,
      )
    : 'unknown';
  if (forkPendingStatus === 'unknown') {
    warnings.push(
      `Warning: integrated fork head ${state.integratedForkHead} is not an ancestor of ${state.forkRef} (${currentForkHead}); pending fork commits cannot be counted.`,
    );
  }
  const completedBatchStatus =
    completedBatchCount === undefined
      ? 'unknown'
      : String(completedBatchCount).padStart(2, '0');
  const nextAction = state.activeForkSync
    ? 'run make upstream-sync-fork-main ROLLING_CONTINUE=1'
    : forkPendingStatus === 'unknown'
      ? 'inspect fork ref divergence before continuing'
      : forkPendingStatus !== '0' && forkPendingStatus !== 'unknown'
        ? 'run make upstream-sync-fork-main'
        : completedBatchCount === undefined
          ? 'inspect or regenerate the persisted batch plan before continuing'
          : 'run make upstream-next-batch';

  return [
    'Rolling upstream rebase status',
    ...warnings,
    `Branch: ${state.branch}`,
    `Upstream target: ${state.upstreamRef} (${shortSha(state.upstreamTargetHead)})`,
    `Completed upstream batches: ${completedBatchStatus} / ${String(plan.batches.length).padStart(2, '0')}`,
    `Integrated fork head: ${state.forkRef} @ ${shortSha(state.integratedForkHead)}`,
    `Current ${state.forkRef}: ${shortSha(currentForkHead)}`,
    `Fork commits pending: ${forkPendingStatus}`,
    `Next action: ${nextAction}`,
  ].join('\n');
}

export function runRollingStatusCommand(
  options: RollingCommandOptions,
): number {
  const write = options.write ?? console.log;
  const writeError = options.writeError ?? console.error;

  try {
    write(renderRollingStatus(options));
    return 0;
  } catch (error) {
    writeError(errorMessage(error));
    return 1;
  }
}

export function runRollingSyncForkMainCommand(
  options: RollingSyncOptions,
): number {
  const write = options.write ?? console.log;
  const writeError = options.writeError ?? console.error;

  try {
    if (hasGitOperationInProgress(options.repoPath)) {
      throw new Error(
        'Git operation in progress; finish or abort it before syncing fork commits.',
      );
    }
    if (!isCleanWorktree(options.repoPath)) {
      throw new Error(
        'Worktree is dirty; commit or stash changes before syncing fork commits.',
      );
    }

    const state = readRollingState(options.repoPath, options.outputDir);
    const branch = currentBranch(options.repoPath);
    if (branch !== state.branch) {
      throw new Error(
        `Cannot sync fork commits on ${branch || 'detached HEAD'}; rolling state is for ${state.branch}. Check out ${state.branch} before syncing.`,
      );
    }
    if (options.continue) {
      if (!state.activeForkSync) {
        throw new Error(
          'No active fork sync to continue; run make upstream-sync-fork-main without ROLLING_CONTINUE=1 to start a fork sync.',
        );
      }
      const head = revParse(options.repoPath, 'HEAD');
      if (!activeForkSyncIsApplied(options.repoPath, state.activeForkSync)) {
        throw new Error(
          `Cannot continue fork sync: current HEAD ${head} does not contain recorded fork sync target ${state.activeForkSync.to}. Restore or reapply the synced fork commits before continuing.`,
        );
      }
      const lastCompletedBatch = state.activeForkSync.lastCompletedBatch;

      return finishRollingForkSync(
        options,
        state,
        state.activeForkSync,
        lastCompletedBatch,
        write,
      );
    }

    if (state.activeForkSync) {
      throw new Error(
        'A fork sync is waiting for checks; rerun with continue to finish it.',
      );
    }

    const lastCompletedBatch = lastCompletedBatchFromPersistedPlan(options);

    (options.fetchFork ?? defaultFetchFork)(options.repoPath, state.forkRef);
    const currentForkHead = revParse(options.repoPath, state.forkRef);
    if (
      !isAncestor(options.repoPath, state.integratedForkHead, state.forkRef)
    ) {
      throw new Error(
        `Cannot sync fork commits: integrated fork head ${state.integratedForkHead} is not an ancestor of ${state.forkRef} (${currentForkHead}). Inspect fork ref divergence before continuing.`,
      );
    }

    const pendingCommits = listCommits(
      options.repoPath,
      `${state.integratedForkHead}..${state.forkRef}`,
    ).map((commit) => commit.sha);

    if (pendingCommits.length === 0) {
      write(`No fork commits pending from ${state.forkRef}`);
      return 0;
    }

    const preSyncHead = revParse(options.repoPath, 'HEAD');
    let appliedCommitCount = 0;
    try {
      for (const commit of pendingCommits) {
        runGit(options.repoPath, ['cherry-pick', '--ff', commit]);
        appliedCommitCount += 1;
      }
    } catch (error) {
      if (appliedCommitCount > 0) {
        runGit(options.repoPath, ['reset', '--hard', preSyncHead]);
      }
      throw error;
    }

    const to = revParse(options.repoPath, state.forkRef);
    const activeForkSync = {
      status: 'checks-failed' as const,
      from: state.integratedForkHead,
      to,
      commits: pendingCommits,
      preSyncHead,
      ...(lastCompletedBatch ? { lastCompletedBatch } : {}),
    };
    writeRollingState(
      options.repoPath,
      { ...state, activeForkSync },
      options.outputDir,
    );

    return finishRollingForkSync(
      options,
      state,
      activeForkSync,
      lastCompletedBatch,
      write,
    );
  } catch (error) {
    writeError(errorMessage(error));
    return 1;
  }
}

export function runRollingFinalCheckCommand(
  options: RollingFinalCheckOptions,
): number {
  const write = options.write ?? console.log;
  const writeError = options.writeError ?? console.error;

  try {
    const state = readRollingState(options.repoPath, options.outputDir);
    const branch = currentBranch(options.repoPath);
    if (branch !== state.branch) {
      throw new Error(
        `Cannot run rolling final check on ${branch || 'detached HEAD'}; rolling state is for ${state.branch}. Check out ${state.branch} before final accounting.`,
      );
    }

    const errors: string[] = [];
    (options.fetchFork ?? defaultFetchFork)(options.repoPath, state.forkRef);

    if (!isAncestor(options.repoPath, state.upstreamTargetHead, 'HEAD')) {
      errors.push(
        `HEAD does not include upstream target ${state.upstreamTargetHead}`,
      );
    }
    if (state.activeForkSync) {
      errors.push(
        'A fork sync is still active; run make upstream-sync-fork-main ROLLING_CONTINUE=1 first.',
      );
    }

    const currentForkHead = revParse(options.repoPath, state.forkRef);
    if (currentForkHead !== state.integratedForkHead) {
      errors.push(
        `${state.forkRef} has commits not included in integratedForkHead ${state.integratedForkHead}; run make upstream-sync-fork-main before final accounting.`,
      );
    }

    const plan = readPersistedBatchPlan(options.repoPath, options.outputDir);
    errors.push(...findMissingSubjectMatches(options.repoPath, plan, state));
    errors.push(...findPatchMismatches(options.repoPath, state));

    const checks = options.runChecks
      ? options.runChecks({ phase: 'final' })
      : runCommandList(
          defaultFinalChecks(),
          options.repoPath,
          options.shellRunner,
        );
    if (!checks.ok) {
      errors.push(
        `Final local checks failed.${checks.output ? `\n${checks.output}` : ''}`,
      );
    }

    writeRollingState(
      options.repoPath,
      appendCheckHistory(
        state,
        'final',
        checks,
        options.now?.() ?? new Date().toISOString(),
      ),
      options.outputDir,
    );

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }

    write('Rolling upstream rebase final check passed.');
    return 0;
  } catch (error) {
    writeError(errorMessage(error));
    return 1;
  }
}

function finishRollingForkSync(
  options: RollingSyncOptions,
  state: RollingState,
  activeForkSync: NonNullable<RollingState['activeForkSync']>,
  lastCompletedBatch: string | undefined,
  write: (message: string) => void,
): number {
  const checkedAt = options.now?.() ?? new Date().toISOString();
  const checkResult = options.runChecks
    ? options.runChecks({
        phase: 'fork-sync',
        ...(lastCompletedBatch ? { batch: lastCompletedBatch } : {}),
      })
    : runCommandList(
        defaultForkSyncChecks(lastCompletedBatch),
        options.repoPath,
        options.shellRunner,
      );
  const checkHistory = appendCheckHistory(
    state,
    'fork-sync',
    checkResult,
    checkedAt,
  ).checkHistory;

  if (!checkResult.ok) {
    writeRollingState(
      options.repoPath,
      { ...state, activeForkSync, checkHistory },
      options.outputDir,
    );
    throw new Error(
      `Fork sync checks failed. Rerun with continue after fixing issues.${checkResult.output ? `\n${checkResult.output}` : ''}`,
    );
  }

  writeRollingState(
    options.repoPath,
    {
      ...state,
      integratedForkHead: activeForkSync.to,
      activeForkSync: undefined,
      lastForkSyncAt: checkedAt,
      appendHistory: [
        ...(state.appendHistory ?? []),
        {
          at: checkedAt,
          from: activeForkSync.from,
          to: activeForkSync.to,
          commits: activeForkSync.commits,
          ...(lastCompletedBatch ? { lastCompletedBatch } : {}),
          checks: checkResult.commands,
        },
      ],
      checkHistory,
    },
    options.outputDir,
  );
  write(
    `Synced ${activeForkSync.commits.length} fork commits from ${state.forkRef}`,
  );
  return 0;
}

export function validateRollingState(
  value: unknown,
  source: string,
): RollingState {
  assertRecord(value, source);
  if (value.version !== 1) {
    throw new Error(`Invalid rolling state ${source}: version must be 1`);
  }
  if (value.mode !== 'rolling-upstream-rebase') {
    throw new Error(
      `Invalid rolling state ${source}: mode must be rolling-upstream-rebase`,
    );
  }

  for (const key of ['branch', 'upstreamRef', 'forkRef', 'startedAt']) {
    assertString(value[key], source, key);
  }
  for (const key of [
    'upstreamTargetHead',
    'startedForkHead',
    'integratedForkHead',
  ]) {
    assertFullSha(value[key], source, key);
  }
  assertIsoTimestamp(value.startedAt, source, 'startedAt');

  if (value.lastForkSyncAt !== undefined) {
    assertIsoTimestamp(value.lastForkSyncAt, source, 'lastForkSyncAt');
  }
  if (value.activeForkSync !== undefined) {
    validateActiveForkSync(value.activeForkSync, source);
  }
  if (value.appendHistory !== undefined) {
    validateAppendHistory(value.appendHistory, source);
  }
  if (value.checkHistory !== undefined) {
    validateCheckHistory(value.checkHistory, source);
  }

  return value as RollingState;
}

function validateActiveForkSync(value: unknown, source: string): void {
  assertRecord(value, `${source}: activeForkSync`);
  if (value.status !== 'checks-failed') {
    throw new Error(
      `Invalid rolling state ${source}: activeForkSync.status must be checks-failed`,
    );
  }
  for (const key of ['from', 'to', 'preSyncHead']) {
    assertFullSha(value[key], source, `activeForkSync.${key}`);
  }
  assertShaArray(value.commits, source, 'activeForkSync.commits');
  if (value.lastCompletedBatch !== undefined) {
    assertString(
      value.lastCompletedBatch,
      source,
      'activeForkSync.lastCompletedBatch',
    );
  }
}

function validateAppendHistory(value: unknown, source: string): void {
  if (!Array.isArray(value)) {
    throw new Error(
      `Invalid rolling state ${source}: appendHistory must be an array`,
    );
  }

  value.forEach((entry, index) => {
    const prefix = `appendHistory[${index}]`;
    assertRecord(entry, `${source}: ${prefix}`);
    assertIsoTimestamp(entry.at, source, `${prefix}.at`);
    for (const key of ['from', 'to']) {
      assertFullSha(entry[key], source, `${prefix}.${key}`);
    }
    assertShaArray(entry.commits, source, `${prefix}.commits`);
    if (entry.lastCompletedBatch !== undefined) {
      assertString(
        entry.lastCompletedBatch,
        source,
        `${prefix}.lastCompletedBatch`,
      );
    }
    assertStringArray(entry.checks, source, `${prefix}.checks`);
  });
}

function validateCheckHistory(value: unknown, source: string): void {
  if (!Array.isArray(value)) {
    throw new Error(
      `Invalid rolling state ${source}: checkHistory must be an array`,
    );
  }

  value.forEach((entry, index) => {
    const prefix = `checkHistory[${index}]`;
    assertRecord(entry, `${source}: ${prefix}`);
    assertIsoTimestamp(entry.at, source, `${prefix}.at`);
    if (entry.phase !== 'fork-sync' && entry.phase !== 'final') {
      throw new Error(
        `Invalid rolling state ${source}: ${prefix}.phase must be fork-sync or final`,
      );
    }
    assertStringArray(entry.commands, source, `${prefix}.commands`);
    if (typeof entry.ok !== 'boolean') {
      throw new Error(
        `Invalid rolling state ${source}: ${prefix}.ok must be a boolean`,
      );
    }
  });
}

function assertRecord(
  value: unknown,
  source: string,
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid rolling state ${source}: object is required`);
  }
}

function assertString(
  value: unknown,
  source: string,
  key: string,
): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid rolling state ${source}: ${key} is required`);
  }
}

function assertFullSha(value: unknown, source: string, key: string): void {
  if (typeof value !== 'string' || !fullShaPattern.test(value)) {
    throw new Error(
      `Invalid rolling state ${source}: ${key} must be a full 40-character SHA`,
    );
  }
}

function assertIsoTimestamp(value: unknown, source: string, key: string): void {
  assertString(value, source, key);
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed) || new Date(parsed).toISOString() !== value) {
    throw new Error(
      `Invalid rolling state ${source}: ${key} must be an ISO timestamp`,
    );
  }
}

function assertShaArray(value: unknown, source: string, key: string): void {
  if (!Array.isArray(value)) {
    throw new Error(
      `Invalid rolling state ${source}: ${key} must be an array of SHAs`,
    );
  }
  value.forEach((item) => assertFullSha(item, source, `${key}[]`));
}

function assertStringArray(value: unknown, source: string, key: string): void {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(
      `Invalid rolling state ${source}: ${key} must be an array of strings`,
    );
  }
}

function shortSha(sha: string): string {
  return sha.slice(0, 9);
}

function defaultFetchFork(repoPath: string, forkRef: string): void {
  const [remote, ...branchParts] = forkRef.split('/');
  if (remote && branchParts.length > 0) {
    runGit(repoPath, ['fetch', '--no-tags', remote, branchParts.join('/')]);
  }
}

export function defaultForkSyncChecks(batch?: string): string[] {
  return [
    'make fork-ownership-coverage-check',
    'make ci-invariants-check',
    'make fork-patches-check',
    ...(batch ? [`make upstream-postrebase-audit BATCH=${batch}`] : []),
  ];
}

export function defaultFinalChecks(): string[] {
  return [
    'make fork-ownership-coverage-check',
    'make upstream-next-batch',
    'make upstream-postrebase-audit',
    'make ci-invariants-check',
    'make fork-patches-check',
    'pnpm --filter @gallery/upstream-preflight run test',
    'pnpm --filter @gallery/upstream-preflight run check',
    'pnpm --filter @gallery/upstream-preflight run format',
  ];
}

function runCommandList(
  commands: string[],
  cwd: string,
  runner: ShellRunner = defaultShellRunner,
): CheckResult {
  const output: string[] = [];
  for (const command of commands) {
    const result = runner(command, cwd);
    output.push(result.stdout, result.stderr);
    if (result.status !== 0) {
      return {
        ok: false,
        commands,
        output: output.filter(Boolean).join('\n'),
      };
    }
  }

  return { ok: true, commands, output: output.filter(Boolean).join('\n') };
}

function defaultShellRunner(
  command: string,
  cwd: string,
): ReturnType<ShellRunner> {
  const result = spawnSync(command, {
    cwd,
    shell: true,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return {
    status: result.status ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function appendCheckHistory(
  state: RollingState,
  phase: 'fork-sync' | 'final',
  checkResult: CheckResult,
  checkedAt: string,
): RollingState {
  return {
    ...state,
    checkHistory: [
      ...(state.checkHistory ?? []),
      {
        at: checkedAt,
        phase,
        commands: checkResult.commands,
        ok: checkResult.ok,
      },
    ],
  };
}

function findMissingSubjectMatches(
  repoPath: string,
  plan: BatchPlan,
  state: RollingState,
): string[] {
  const forkSubjects = commitSubjects(
    repoPath,
    `${plan.metadata.mergeBase}..${state.forkRef}`,
  );
  const headSubjects = commitSubjects(
    repoPath,
    `${plan.metadata.mergeBase}..HEAD`,
  ).map((item) => item.subject);

  return forkSubjects
    .filter((item) => !hasSubjectOrPrMatch(item.subject, headSubjects))
    .map(
      (item) => `Missing fork commit subject in rebase branch: ${item.subject}`,
    );
}

function findPatchMismatches(repoPath: string, state: RollingState): string[] {
  const result = cherryEquivalent(repoPath, 'HEAD', state.forkRef);
  if (result.missing.length === 0) return [];

  const subjectsBySha = new Map(
    commitSubjects(
      repoPath,
      `${state.upstreamTargetHead}..${state.forkRef}`,
    ).map((item) => [item.sha, item.subject]),
  );

  return result.missing.map((sha) => {
    const subject = subjectsBySha.get(sha) ?? sha;
    return `Patch-equivalence mismatch for fork commit: ${subject}`;
  });
}

function normalizeSubject(subject: string): string {
  return subject.trim().replace(/\s+/g, ' ');
}

function hasSubjectOrPrMatch(subject: string, candidates: string[]): boolean {
  const normalizedSubject = normalizeSubject(subject);
  const prs = extractPrNumbers(subject);
  return candidates.some((candidate) => {
    if (normalizeSubject(candidate) === normalizedSubject) {
      return true;
    }
    if (prs.length === 0) {
      return false;
    }

    const candidatePrs = new Set(extractPrNumbers(candidate));
    return prs.some((pr) => candidatePrs.has(pr));
  });
}

function extractPrNumbers(subject: string): string[] {
  return Array.from(subject.matchAll(/\(#(\d+)\)/g), (match) => match[1]);
}

function activeForkSyncIsApplied(
  repoPath: string,
  activeForkSync: NonNullable<RollingState['activeForkSync']>,
): boolean {
  if (isAncestor(repoPath, activeForkSync.to, 'HEAD')) {
    return true;
  }

  const cherryOutput = runGit(repoPath, [
    'cherry',
    'HEAD',
    activeForkSync.to,
    activeForkSync.from,
  ]);
  const equivalenceBySha = new Map(
    cherryOutput
      .split('\n')
      .filter(Boolean)
      .map((line) => [line.slice(2), line.startsWith('- ')]),
  );

  return activeForkSync.commits.every(
    (commit) => equivalenceBySha.get(commit) === true,
  );
}

function lastCompletedBatchFromPersistedPlan(
  options: Pick<RollingSyncOptions, 'repoPath' | 'outputDir'>,
): string | undefined {
  const plan = readPersistedBatchPlan(options.repoPath, options.outputDir);
  validatePersistedBatchPlan(plan, options.repoPath);
  return lastCompletedBatchId(selectNextBatch(plan, options.repoPath));
}

function lastCompletedBatchId(
  selection: ReturnType<typeof selectNextBatch>,
): string | undefined {
  if (selection.status === 'none' || selection.completedBatchCount === 0) {
    return undefined;
  }

  return selection.plan.batches[selection.completedBatchCount - 1]?.id;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
