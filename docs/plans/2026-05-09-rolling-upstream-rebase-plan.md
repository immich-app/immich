# Rolling Upstream Rebase Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a stateful rolling upstream rebase mode so long-lived rebase branches can safely sync new `origin/main` commits between approved upstream batches.

**Architecture:** Extend the existing `@gallery/upstream-preflight` tooling with a new `rolling.ts` module that owns rolling state, command preconditions, fork-sync state transitions, final accounting, and status rendering. Keep batch planning as the source of truth for upstream progress, and change batch-scoped audits to read persisted `batch-plan.json` when `BATCH=NN` is provided.

**Tech Stack:** TypeScript, Commander, Vitest, Git CLI helpers, Make targets, markdown docs.

---

## Ground Rules

- Use TDD for every production behavior change.
- Do not edit production files before the failing test for that behavior exists and has been run.
- Keep each commit focused and small.
- Use the existing worktree: `/home/pierre/dev/gallery/.worktrees/rolling-upstream-rebase-design`.
- Run focused tests after each red/green slice; run the full upstream-preflight suite before the final commit.
- Preserve existing short-lived upstream rebase behavior.

## Task 1: Add Rolling State Validation Tests

**Files:**

- Create: `tools/upstream-preflight/src/rolling.spec.ts`
- Create later: `tools/upstream-preflight/src/rolling.ts`

**Step 1: Write the failing tests**

Create `tools/upstream-preflight/src/rolling.spec.ts` with validation-only tests first:

```ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createTempRepo } from '../test/fixtures';
import { readRollingState, rollingStatePath, validateRollingState, writeRollingState } from './rolling';
import type { RollingState } from './rolling';

describe('rolling state validation', () => {
  it('accepts a valid v1 rolling state', () => {
    expect(validateRollingState(validState(), 'state.json')).toEqual(validState());
  });

  it('rejects invalid shape with actionable errors', () => {
    expect(() => validateRollingState({ version: 2 }, 'state.json')).toThrow(
      'Invalid rolling state state.json: version must be 1',
    );
    expect(() => validateRollingState({ ...validState(), upstreamTargetHead: 'abc' }, 'state.json')).toThrow(
      'upstreamTargetHead must be a full 40-character SHA',
    );
    expect(() => validateRollingState({ ...validState(), startedAt: 'not-a-date' }, 'state.json')).toThrow(
      'startedAt must be an ISO timestamp',
    );
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
  });

  it('reads and writes rolling state under git metadata', () => {
    const repo = createTempRepo();
    repo.write('README.md', 'base');
    repo.commit('base commit');
    const state = validState();

    const written = writeRollingState(repo.path, state);
    const read = readRollingState(repo.path);

    expect(written).toBe(rollingStatePath(repo.path));
    expect(written).toContain('.git/upstream-preflight/rolling-state.json');
    expect(read).toEqual(state);
    expect(repo.git('status', '--short')).toBe('');
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

function sha(prefix: string): string {
  return `${prefix}${'0'.repeat(40 - prefix.length)}`;
}
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/rolling.spec.ts
```

Expected: FAIL because `./rolling` does not exist.

**Step 3: Implement minimal rolling state helpers**

Create `tools/upstream-preflight/src/rolling.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';
import { getGitPath } from './git';

const fullShaPattern = /^[0-9a-f]{40}$/i;

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

export function rollingStatePath(repoPath: string, outputDir?: string): string {
  return path.join(outputDir ?? getGitPath(repoPath, 'upstream-preflight'), 'rolling-state.json');
}

export function readRollingState(repoPath: string, outputDir?: string): RollingState {
  const statePath = rollingStatePath(repoPath, outputDir);
  if (!fs.existsSync(statePath)) {
    throw new Error(`Missing rolling state ${statePath}; run make upstream-rolling-start first.`);
  }

  return validateRollingState(JSON.parse(fs.readFileSync(statePath, 'utf8')), statePath);
}

export function writeRollingState(repoPath: string, state: RollingState, outputDir?: string): string {
  const statePath = rollingStatePath(repoPath, outputDir);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify(validateRollingState(state, 'rolling state'), null, 2)}\n`);
  return statePath;
}

export function validateRollingState(value: unknown, source: string): RollingState {
  assertRecord(value, source);
  if (value.version !== 1) throw new Error(`Invalid rolling state ${source}: version must be 1`);
  if (value.mode !== 'rolling-upstream-rebase') {
    throw new Error(`Invalid rolling state ${source}: mode must be rolling-upstream-rebase`);
  }

  for (const key of ['branch', 'upstreamRef', 'forkRef', 'startedAt']) {
    assertString(value[key], source, key);
  }
  for (const key of ['upstreamTargetHead', 'startedForkHead', 'integratedForkHead']) {
    assertFullSha(value[key], source, key);
  }
  assertIsoTimestamp(value.startedAt, source, 'startedAt');
  if (value.lastForkSyncAt !== undefined) {
    assertIsoTimestamp(value.lastForkSyncAt, source, 'lastForkSyncAt');
  }
  if (value.activeForkSync !== undefined) {
    const activeForkSync = value.activeForkSync;
    assertRecord(activeForkSync, `${source}: activeForkSync`);
    if (activeForkSync.status !== 'checks-failed') {
      throw new Error(`Invalid rolling state ${source}: activeForkSync.status must be checks-failed`);
    }
    for (const key of ['from', 'to', 'preSyncHead']) {
      assertFullSha(activeForkSync[key], source, `activeForkSync.${key}`);
    }
    assertStringArray(activeForkSync.commits, source, 'activeForkSync.commits');
    for (const commit of activeForkSync.commits) {
      assertFullSha(commit, source, 'activeForkSync.commits[]');
    }
  }

  return value as RollingState;
}

function assertRecord(value: unknown, source: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid rolling state ${source}: object is required`);
  }
}

function assertString(value: unknown, source: string, key: string): void {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid rolling state ${source}: ${key} is required`);
  }
}

function assertFullSha(value: unknown, source: string, key: string): void {
  if (typeof value !== 'string' || !fullShaPattern.test(value)) {
    throw new Error(`Invalid rolling state ${source}: ${key} must be a full 40-character SHA`);
  }
}

function assertIsoTimestamp(value: unknown, source: string, key: string): void {
  assertString(value, source, key);
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`Invalid rolling state ${source}: ${key} must be an ISO timestamp`);
  }
}

function assertStringArray(value: unknown, source: string, key: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`Invalid rolling state ${source}: ${key} must be an array of strings`);
  }
}
```

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/rolling.spec.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add tools/upstream-preflight/src/rolling.ts tools/upstream-preflight/src/rolling.spec.ts
git commit -m "test: add rolling rebase state validation"
```

## Task 2: Add Git Helper Tests And Implementation

**Files:**

- Modify: `tools/upstream-preflight/src/git.spec.ts`
- Modify: `tools/upstream-preflight/src/git.ts`

**Step 1: Write failing tests**

Append tests to `tools/upstream-preflight/src/git.spec.ts`:

```ts
import {
  cherryEquivalent,
  commitSubjects,
  currentBranch,
  hasGitOperationInProgress,
  isCleanWorktree,
  listCommits,
} from './git';

it('reports branch, clean state, and in-progress git operations', () => {
  const repo = createTempRepo();
  repo.write('README.md', 'base');
  repo.commit('base commit');

  expect(currentBranch(repo.path)).toBe('main');
  expect(isCleanWorktree(repo.path)).toBe(true);
  repo.write('dirty.txt', 'dirty');
  expect(isCleanWorktree(repo.path)).toBe(false);
  expect(hasGitOperationInProgress(repo.path)).toBe(false);
});

it('lists commits and subjects in chronological order', () => {
  const repo = createTempRepo();
  repo.write('README.md', 'base');
  const base = repo.commit('base commit');
  repo.write('one.txt', 'one');
  const one = repo.commit('feat: one (#1)');
  repo.write('two.txt', 'two');
  const two = repo.commit('fix: two (#2)');

  expect(listCommits(repo.path, `${base}..HEAD`).map((commit) => commit.sha)).toEqual([one, two]);
  expect(commitSubjects(repo.path, `${base}..HEAD`)).toEqual([
    { sha: one, subject: 'feat: one (#1)' },
    { sha: two, subject: 'fix: two (#2)' },
  ]);
});

it('reports cherry-equivalent patches', () => {
  const repo = createTempRepo();
  repo.write('README.md', 'base');
  const base = repo.commit('base commit');
  repo.git('checkout', '-b', 'left');
  repo.write('feature.txt', 'same');
  repo.commit('feat: same patch');
  repo.git('checkout', '-b', 'right', base);
  repo.write('feature.txt', 'same');
  repo.commit('feat: rebased same patch');

  const result = cherryEquivalent(repo.path, 'left', 'right');
  expect(result.equivalent.length).toBe(1);
  expect(result.missing).toEqual([]);
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/git.spec.ts
```

Expected: FAIL because helper exports are missing.

**Step 3: Implement helpers**

Add to `tools/upstream-preflight/src/git.ts`:

```ts
export type CommitSubject = { sha: string; subject: string };
export type CherryEquivalentResult = {
  equivalent: string[];
  missing: string[];
  raw: string[];
};

export function currentBranch(cwd: string): string {
  return runGit(cwd, ['branch', '--show-current']);
}

export function isCleanWorktree(cwd: string): boolean {
  return runGit(cwd, ['status', '--porcelain']) === '';
}

export function hasGitOperationInProgress(cwd: string): boolean {
  return ['rebase-merge', 'rebase-apply', 'MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD'].some((gitPath) =>
    fs.existsSync(getGitPath(cwd, gitPath)),
  );
}

export function listCommits(cwd: string, range: string): GitCommit[] {
  return collectGitRange(cwd, range).commits;
}

export function commitSubjects(cwd: string, range: string): CommitSubject[] {
  return listCommits(cwd, range).map(({ sha, subject }) => ({ sha, subject }));
}

export function cherryEquivalent(cwd: string, upstream: string, head: string): CherryEquivalentResult {
  const raw = runGit(cwd, ['cherry', upstream, head])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    raw,
    equivalent: raw.filter((line) => line.startsWith('- ')).map((line) => line.slice(2)),
    missing: raw.filter((line) => line.startsWith('+ ')).map((line) => line.slice(2)),
  };
}
```

Add `import fs from "node:fs";` to `git.ts`.

**Step 4: Run focused tests**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/git.spec.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add tools/upstream-preflight/src/git.ts tools/upstream-preflight/src/git.spec.ts
git commit -m "test: add rolling rebase git helpers"
```

## Task 3: Pin Batch-Scoped Audit Scope To Persisted Plans

**Files:**

- Modify: `tools/upstream-preflight/src/batch.spec.ts`
- Modify: `tools/upstream-preflight/src/batch.ts`
- Modify later: `tools/upstream-preflight/src/index.ts`

**Step 1: Write failing test**

Add to `tools/upstream-preflight/src/batch.spec.ts`:

```ts
import { readPersistedBatchAuditScope } from './batch';

it('reads batch audit scope from the persisted plan after refs move', () => {
  const { repo, outputDir, plan } = createRepoWithPersistedPlan({ upstreamCommits: 2 });
  repo.git('checkout', 'upstream');
  repo.write('future.txt', 'future');
  repo.commit('future upstream');
  repo.git('checkout', 'main');

  const scope = readPersistedBatchAuditScope(repo.path, outputDir, '01');

  expect(scope).toEqual({
    batch: '01',
    upstreamTouchedFiles: plan.batches[0].commits.flatMap((commit) => commit.files),
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/batch.spec.ts
```

Expected: FAIL because `readPersistedBatchAuditScope` does not exist.

**Step 3: Implement helper**

Add to `tools/upstream-preflight/src/batch.ts`:

```ts
export function readPersistedBatchAuditScope(
  repoPath: string,
  outputDir: string | undefined,
  batch: string,
): BatchAuditScope {
  const plan = readPersistedBatchPlan(repoPath, outputDir);
  return selectBatchAuditScope({
    batch,
    batchPlan: plan,
    upstreamTouchedFiles: [],
  });
}
```

Do not call `validatePersistedBatchPlan` here. Batch-scoped audit scope must
remain usable even when refs moved after the plan was approved. Shape validation
is still performed by `readPersistedBatchPlan`.

**Step 4: Run focused tests**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/batch.spec.ts
```

Expected: PASS.

**Step 5: Wire CLI batch-scoped audit commands**

Modify `tools/upstream-preflight/src/index.ts`:

- Import `readPersistedBatchAuditScope`.
- In `mobile-drift-check`, when `batch` is set:
  - load manifest
  - call `readPersistedBatchAuditScope`
  - run audit with `auditScope.upstreamTouchedFiles`
  - avoid `buildPreflightContext`
- In `postrebase-audit`, when `batch` is set:
  - load manifest
  - call `readPersistedBatchAuditScope`
  - run audit with `auditScope.upstreamTouchedFiles`
  - avoid `buildPreflightContext`
- Keep current behavior for unscoped commands.

Use this pattern:

```ts
const manifest = loadManifest(resolveCliPath(options.manifest));
const auditScope = batch
  ? readPersistedBatchAuditScope(process.cwd(), options.planDir ? resolveCliPath(options.planDir) : undefined, batch)
  : undefined;
```

For `mobile-drift-check`, add a `--plan-dir <path>` option so tests and
operators can point at an explicit persisted plan location when needed.

For `postrebase-audit`, do not reuse the existing `--output-dir <path>` option
for reading the batch plan. That option already means "where to write the audit
report". Add a separate `--plan-dir <path>` option for the persisted plan
location, and keep `--output-dir` exclusively for report output.

**Step 6: Run focused command tests**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/batch.spec.ts src/audits/mobile-drift.spec.ts src/audits/post-rebase.spec.ts
```

Expected: PASS.

**Step 7: Commit**

```bash
git add tools/upstream-preflight/src/batch.ts tools/upstream-preflight/src/batch.spec.ts tools/upstream-preflight/src/index.ts
git commit -m "fix: pin batch audit scope to persisted plans"
```

## Task 4: Add Rolling Start Tests And Command

**Files:**

- Modify: `tools/upstream-preflight/src/rolling.spec.ts`
- Modify: `tools/upstream-preflight/src/rolling.ts`

**Step 1: Write failing tests**

Add tests:

```ts
import { planBatches, writeBatchPlanReports } from './batch';
import { runRollingStartCommand } from './rolling';

describe('rolling start', () => {
  it('refuses to start on main', () => {
    const { repo, outputDir } = createRepoWithPlan();
    const errors: string[] = [];

    const exitCode = runRollingStartCommand({
      repoPath: repo.path,
      outputDir,
      now: () => '2026-05-09T08:00:00.000Z',
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('Refusing to start rolling rebase on main');
  });

  it('writes rolling state from the persisted batch plan', () => {
    const { repo, outputDir, plan } = createRepoWithPlan();
    repo.git('checkout', '-b', 'rebase/upstream-2026-05');

    const exitCode = runRollingStartCommand({
      repoPath: repo.path,
      outputDir,
      now: () => '2026-05-09T08:00:00.000Z',
    });

    expect(exitCode).toBe(0);
    expect(readRollingState(repo.path, outputDir)).toMatchObject({
      version: 1,
      branch: 'rebase/upstream-2026-05',
      upstreamRef: plan.metadata.upstreamRef,
      upstreamTargetHead: plan.metadata.upstreamHead,
      forkRef: plan.metadata.forkRef,
      startedForkHead: plan.metadata.forkHead,
      integratedForkHead: plan.metadata.forkHead,
    });
  });
});
```

Add these shared test helpers in `rolling.spec.ts`; later tasks rely on them, so
keep them in the first rolling test file instead of redefining them. Reuse or
copy a small `classifiedCommit()` helper from `batch.spec.ts`.

```ts
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

function createRepoWithPlan(options: { forkCommitsAfterStart?: number; upstreamCommits?: number } = {}) {
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
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/rolling.spec.ts
```

Expected: FAIL because `runRollingStartCommand` does not exist.

**Step 3: Implement minimal start command**

In `rolling.ts`, import:

```ts
import { currentBranch, isCleanWorktree, revParse } from './git';
import { readPersistedBatchPlan, validatePersistedBatchPlan } from './batch';
```

Add:

```ts
export type RollingCommandOptions = {
  repoPath: string;
  outputDir?: string;
  resume?: boolean;
  now?: () => string;
  write?: (message: string) => void;
  writeError?: (message: string) => void;
};

export function runRollingStartCommand(options: RollingCommandOptions): number {
  const write = options.write ?? console.log;
  const writeError = options.writeError ?? console.error;

  try {
    const branch = currentBranch(options.repoPath);
    if (branch === 'main') throw new Error('Refusing to start rolling rebase on main');
    if (!isCleanWorktree(options.repoPath))
      throw new Error('Worktree is dirty; commit or stash changes before starting rolling rebase.');

    const statePath = rollingStatePath(options.repoPath, options.outputDir);
    if (fs.existsSync(statePath) && !options.resume) {
      throw new Error(`Rolling state already exists at ${statePath}; pass --resume to reuse it.`);
    }

    const plan = readPersistedBatchPlan(options.repoPath, options.outputDir);
    validatePersistedBatchPlan(plan, options.repoPath);

    const head = revParse(options.repoPath, 'HEAD');
    if (head !== plan.metadata.forkHead && !options.resume) {
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
```

Add local `errorMessage()`.

**Step 4: Run focused tests**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/rolling.spec.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add tools/upstream-preflight/src/rolling.ts tools/upstream-preflight/src/rolling.spec.ts
git commit -m "feat: start rolling upstream rebase state"
```

## Task 5: Add Rolling Status Tests And Command

**Files:**

- Modify: `tools/upstream-preflight/src/rolling.spec.ts`
- Modify: `tools/upstream-preflight/src/rolling.ts`

**Step 1: Write failing tests**

Add:

```ts
import { renderRollingStatus, runRollingStatusCommand } from './rolling';

it('renders rolling status with completed batches and pending fork commits', () => {
  const { repo, outputDir, plan } = createRepoWithPlan({ forkCommitsAfterStart: 2 });
  repo.git('checkout', '-b', 'rebase/upstream-2026-05', plan.batches[0].tipSha);
  writeRollingState(
    repo.path,
    validState({
      branch: 'rebase/upstream-2026-05',
      upstreamRef: plan.metadata.upstreamRef,
      upstreamTargetHead: plan.metadata.upstreamHead,
      forkRef: plan.metadata.forkRef,
      startedForkHead: plan.metadata.forkHead,
      integratedForkHead: plan.metadata.forkHead,
    }),
    outputDir,
  );

  const output = renderRollingStatus({ repoPath: repo.path, outputDir });

  expect(output).toContain('Completed upstream batches: 01 / 01');
  expect(output).toContain('Fork commits pending: 2');
  expect(output).toContain('Next action:');
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/rolling.spec.ts
```

Expected: FAIL because status functions are missing.

**Step 3: Implement status**

Use existing `selectNextBatch()` against the persisted plan, and `listCommits()` for pending fork commits.

```ts
export function renderRollingStatus(options: Pick<RollingCommandOptions, 'repoPath' | 'outputDir'>): string {
  const state = readRollingState(options.repoPath, options.outputDir);
  const plan = readPersistedBatchPlan(options.repoPath, options.outputDir);
  const selection = selectNextBatch(plan, options.repoPath);
  const completed =
    selection.status === 'next'
      ? selection.completedBatchCount
      : selection.status === 'complete'
        ? selection.completedBatchCount
        : 0;
  const pendingForkCommits = listCommits(options.repoPath, `${state.integratedForkHead}..${state.forkRef}`);

  const nextAction = state.activeForkSync
    ? 'run make upstream-sync-fork-main ROLLING_CONTINUE=1'
    : pendingForkCommits.length > 0
      ? 'run make upstream-sync-fork-main'
      : 'run make upstream-next-batch';

  return [
    `Branch: ${state.branch}`,
    `Upstream target: ${state.upstreamRef} @ ${state.upstreamTargetHead.slice(0, 9)}`,
    `Completed upstream batches: ${String(completed).padStart(2, '0')} / ${String(plan.batches.length).padStart(2, '0')}`,
    `Integrated fork head: ${state.forkRef} @ ${state.integratedForkHead.slice(0, 9)}`,
    `Current ${state.forkRef}: ${revParse(options.repoPath, state.forkRef).slice(0, 9)}`,
    `Fork commits pending: ${pendingForkCommits.length}`,
    `Next action: ${nextAction}`,
  ].join('\n');
}

export function runRollingStatusCommand(options: RollingCommandOptions): number {
  try {
    (options.write ?? console.log)(renderRollingStatus(options));
    return 0;
  } catch (error) {
    (options.writeError ?? console.error)(errorMessage(error));
    return 1;
  }
}
```

**Step 4: Run focused tests**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/rolling.spec.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add tools/upstream-preflight/src/rolling.ts tools/upstream-preflight/src/rolling.spec.ts
git commit -m "feat: report rolling upstream rebase status"
```

## Task 6: Block Upstream Batch Selection During Failed Fork Sync

**Files:**

- Modify: `tools/upstream-preflight/src/rolling.spec.ts`
- Modify: `tools/upstream-preflight/src/rolling.ts`
- Modify later: `tools/upstream-preflight/src/index.ts`

**Step 1: Write failing tests**

Add:

```ts
import { assertNoActiveRollingSync } from './rolling';

it('allows upstream batch selection when no rolling state exists', () => {
  const repo = createTempRepo();
  repo.write('README.md', 'base');
  repo.commit('base commit');

  expect(() => assertNoActiveRollingSync(repo.path)).not.toThrow();
});

it('blocks upstream batch selection while a failed fork sync is active', () => {
  const { repo, outputDir, plan } = createRepoWithPlan();
  writeRollingState(
    repo.path,
    {
      ...validStateFromPlan(plan, 'rebase/upstream-2026-05'),
      activeForkSync: {
        status: 'checks-failed',
        from: plan.metadata.forkHead,
        to: plan.metadata.forkHead,
        commits: [],
        preSyncHead: plan.metadata.forkHead,
      },
    },
    outputDir,
  );

  expect(() => assertNoActiveRollingSync(repo.path, outputDir)).toThrow('A fork sync is waiting for checks');
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/rolling.spec.ts
```

Expected: FAIL because `assertNoActiveRollingSync` does not exist.

**Step 3: Implement guard helper**

Add to `tools/upstream-preflight/src/rolling.ts`:

```ts
export function assertNoActiveRollingSync(repoPath: string, outputDir?: string): void {
  const statePath = rollingStatePath(repoPath, outputDir);
  if (!fs.existsSync(statePath)) return;

  const state = readRollingState(repoPath, outputDir);
  if (state.activeForkSync) {
    throw new Error(
      'A fork sync is waiting for checks; run make upstream-sync-fork-main ROLLING_CONTINUE=1 before selecting the next upstream batch.',
    );
  }
}
```

**Step 4: Run focused tests**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/rolling.spec.ts
```

Expected: PASS.

**Step 5: Wire guard into `next-batch` CLI**

Modify `tools/upstream-preflight/src/index.ts`:

```ts
import { assertNoActiveRollingSync } from './rolling';
```

In the `next-batch` command action, call the guard before
`runNextBatchCommand()`:

```ts
try {
  assertNoActiveRollingSync(process.cwd(), options.outputDir ? resolveCliPath(options.outputDir) : undefined);
} catch (error) {
  console.error(errorMessage(error));
  process.exitCode = 1;
  return;
}
```

This preserves the existing short-lived flow because no rolling state file means
the guard is a no-op.

**Step 6: Run focused checks**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/rolling.spec.ts src/batch.spec.ts
pnpm --filter @gallery/upstream-preflight run check
```

Expected: PASS.

**Step 7: Commit**

```bash
git add tools/upstream-preflight/src/rolling.ts tools/upstream-preflight/src/rolling.spec.ts tools/upstream-preflight/src/index.ts
git commit -m "feat: block upstream batches during failed fork sync"
```

## Task 7: Add Fork Sync Happy Path And No-Op Tests

**Files:**

- Modify: `tools/upstream-preflight/src/rolling.spec.ts`
- Modify: `tools/upstream-preflight/src/rolling.ts`

**Step 1: Write failing tests**

Design `runRollingSyncForkMainCommand()` with injected command runners so tests do not have to run the full Make checks:

```ts
it('prints no-op when no fork commits are pending', () => {
  const { repo, outputDir, plan } = createRepoWithPlan();
  repo.git('checkout', '-b', 'rebase/upstream-2026-05', plan.metadata.forkHead);
  writeRollingState(repo.path, validStateFromPlan(plan, 'rebase/upstream-2026-05'), outputDir);
  const messages: string[] = [];

  const exitCode = runRollingSyncForkMainCommand({
    repoPath: repo.path,
    outputDir,
    runChecks: () => ({ ok: true, commands: [] }),
    write: (message) => messages.push(message),
  });

  expect(exitCode).toBe(0);
  expect(messages.join('\n')).toContain('No fork commits pending');
});

it('cherry-picks pending fork commits and updates integratedForkHead after checks pass', () => {
  const { repo, outputDir, plan } = createRepoWithPlan();
  repo.git('checkout', '-b', 'rebase/upstream-2026-05', plan.metadata.forkHead);
  writeRollingState(repo.path, validStateFromPlan(plan, 'rebase/upstream-2026-05'), outputDir);
  repo.git('checkout', 'main');
  repo.write('fork-two.txt', 'fork two');
  const newForkHead = repo.commit('feat: fork two (#2)');
  repo.git('checkout', 'rebase/upstream-2026-05');

  const exitCode = runRollingSyncForkMainCommand({
    repoPath: repo.path,
    outputDir,
    runChecks: () => ({ ok: true, commands: ['make fork-ownership-coverage-check'] }),
    now: () => '2026-05-09T09:00:00.000Z',
  });

  expect(exitCode).toBe(0);
  const state = readRollingState(repo.path, outputDir);
  expect(state.integratedForkHead).toBe(newForkHead);
  expect(state.activeForkSync).toBeUndefined();
  expect(state.appendHistory?.at(-1)).toMatchObject({
    from: plan.metadata.forkHead,
    to: newForkHead,
    commits: [newForkHead],
  });
});

it('passes the last completed upstream batch to fork-sync checks', () => {
  const { repo, outputDir, plan } = createRepoWithPlan();
  repo.git('checkout', '-b', 'rebase/upstream-2026-05', plan.batches[0].tipSha);
  writeRollingState(repo.path, validStateFromPlan(plan, 'rebase/upstream-2026-05'), outputDir);
  repo.git('checkout', 'main');
  repo.write('fork-two.txt', 'fork two');
  repo.commit('feat: fork two (#2)');
  repo.git('checkout', 'rebase/upstream-2026-05');
  const contexts: Array<{ phase: 'fork-sync'; batch?: string }> = [];

  const exitCode = runRollingSyncForkMainCommand({
    repoPath: repo.path,
    outputDir,
    runChecks: (context) => {
      contexts.push(context);
      return { ok: true, commands: [] };
    },
  });

  expect(exitCode).toBe(0);
  expect(contexts).toEqual([{ phase: 'fork-sync', batch: '01' }]);
  expect(readRollingState(repo.path, outputDir).appendHistory?.at(-1)).toMatchObject({
    lastCompletedBatch: '01',
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/rolling.spec.ts
```

Expected: FAIL because sync command is missing.

**Step 3: Implement minimal sync command**

Add types:

```ts
export type CheckResult = { ok: boolean; commands: string[]; output?: string };
export type RollingSyncOptions = RollingCommandOptions & {
  continue?: boolean;
  fetchFork?: (repoPath: string, forkRef: string) => void;
  runChecks?: (context: { phase: 'fork-sync'; batch?: string }) => CheckResult;
};
```

Implement:

```ts
export function runRollingSyncForkMainCommand(options: RollingSyncOptions): number {
  const write = options.write ?? console.log;
  const writeError = options.writeError ?? console.error;

  try {
    const state = readRollingState(options.repoPath, options.outputDir);
    const plan = readPersistedBatchPlan(options.repoPath, options.outputDir);
    assertCleanBoundary(options.repoPath);

    if (options.continue) return continueForkSync(options, state);
    if (state.activeForkSync) throw new Error('A fork sync is waiting for checks; rerun with --continue.');

    (options.fetchFork ?? fetchForkRef)(options.repoPath, state.forkRef);
    const pending = listCommits(options.repoPath, `${state.integratedForkHead}..${state.forkRef}`);
    if (pending.length === 0) {
      write(`No fork commits pending from ${state.forkRef}.`);
      return 0;
    }

    const preSyncHead = revParse(options.repoPath, 'HEAD');
    const lastCompletedBatch = lastCompletedBatchId(plan, options.repoPath);
    for (const commit of pending) {
      runGit(options.repoPath, ['cherry-pick', commit.sha]);
    }

    const activeState: RollingState = {
      ...state,
      activeForkSync: {
        status: 'checks-failed',
        from: state.integratedForkHead,
        to: revParse(options.repoPath, state.forkRef),
        commits: pending.map((commit) => commit.sha),
        preSyncHead,
      },
    };
    writeRollingState(options.repoPath, activeState, options.outputDir);

    return promoteForkSyncAfterChecks(options, activeState, lastCompletedBatch);
  } catch (error) {
    writeError(errorMessage(error));
    return 1;
  }
}
```

Use helper functions for `assertCleanBoundary()`, `continueForkSync()`, and
`promoteForkSyncAfterChecks()` to keep the command readable.

Initial `assertCleanBoundary()`:

```ts
function assertCleanBoundary(repoPath: string): void {
  if (!isCleanWorktree(repoPath)) throw new Error('Worktree is dirty; resolve it before syncing fork main.');
  if (hasGitOperationInProgress(repoPath))
    throw new Error('A git operation is in progress; resolve it before syncing fork main.');
}
```

Add `fetchForkRef()`:

```ts
function fetchForkRef(repoPath: string, forkRef: string): void {
  const [remote, branch] = forkRef.split('/');
  if (!remote || !branch) return;
  runGit(repoPath, ['fetch', remote, branch, '--no-tags']);
}
```

Initial `promoteForkSyncAfterChecks()`:

```ts
function promoteForkSyncAfterChecks(
  options: RollingSyncOptions,
  state: RollingState,
  lastCompletedBatch?: string,
): number {
  const checks = options.runChecks?.({ phase: 'fork-sync', batch: lastCompletedBatch }) ?? {
    ok: true,
    commands: defaultForkSyncChecks(lastCompletedBatch),
  };
  const checkedState = appendCheckHistory(state, 'fork-sync', checks);

  if (!checks.ok) {
    writeRollingState(options.repoPath, checkedState, options.outputDir);
    (options.writeError ?? console.error)('Fork sync checks failed; fix issues and rerun with --continue.');
    return 1;
  }

  const active = checkedState.activeForkSync;
  if (!active) throw new Error('No active fork sync to promote.');
  const promoted: RollingState = {
    ...checkedState,
    integratedForkHead: active.to,
    lastForkSyncAt: options.now?.() ?? new Date().toISOString(),
    activeForkSync: undefined,
    appendHistory: [
      ...(checkedState.appendHistory ?? []),
      {
        at: options.now?.() ?? new Date().toISOString(),
        from: active.from,
        to: active.to,
        commits: active.commits,
        lastCompletedBatch,
        checks: checks.commands,
      },
    ],
  };
  delete promoted.activeForkSync;
  writeRollingState(options.repoPath, promoted, options.outputDir);
  return 0;
}
```

Add `lastCompletedBatchId()`:

```ts
function lastCompletedBatchId(plan: BatchPlan, repoPath: string): string | undefined {
  const selection = selectNextBatch(plan, repoPath);
  if (selection.status === 'next' && selection.completedBatchCount > 0) {
    return plan.batches[selection.completedBatchCount - 1]?.id;
  }
  if (selection.status === 'complete' && selection.completedBatchCount > 0) {
    return plan.batches[selection.completedBatchCount - 1]?.id;
  }
  return undefined;
}
```

Add the initial unexported fork-sync check list helper used by the command. Task
11 will add focused tests for this helper and export it:

```ts
function defaultForkSyncChecks(batch?: string): string[] {
  return [
    'make fork-ownership-coverage-check',
    'make ci-invariants-check',
    'make fork-patches-check',
    ...(batch ? [`make upstream-postrebase-audit BATCH=${batch}`] : []),
  ];
}
```

**Step 4: Run focused tests**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/rolling.spec.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add tools/upstream-preflight/src/rolling.ts tools/upstream-preflight/src/rolling.spec.ts
git commit -m "feat: sync fork commits into rolling rebase"
```

## Task 8: Add Fork Sync Failure And Continue Mode Tests

**Files:**

- Modify: `tools/upstream-preflight/src/rolling.spec.ts`
- Modify: `tools/upstream-preflight/src/rolling.ts`

**Step 1: Write failing tests**

Add:

```ts
it('does not update integratedForkHead when cherry-pick conflicts', () => {
  const { repo, outputDir, plan } = createRepoWithPlan();
  repo.git('checkout', '-b', 'rebase/upstream-2026-05', plan.metadata.forkHead);
  repo.write('conflict.txt', 'branch');
  repo.commit('conflicting branch work');
  writeRollingState(repo.path, validStateFromPlan(plan, 'rebase/upstream-2026-05'), outputDir);
  repo.git('checkout', 'main');
  repo.write('conflict.txt', 'main');
  repo.commit('feat: conflicting fork');
  repo.git('checkout', 'rebase/upstream-2026-05');

  const exitCode = runRollingSyncForkMainCommand({
    repoPath: repo.path,
    outputDir,
    runChecks: () => ({ ok: true, commands: [] }),
  });

  expect(exitCode).toBe(1);
  expect(readRollingState(repo.path, outputDir).integratedForkHead).toBe(plan.metadata.forkHead);
});

it('records activeForkSync when checks fail and continue promotes after checks pass', () => {
  const { repo, outputDir, plan } = createRepoWithPlan();
  repo.git('checkout', '-b', 'rebase/upstream-2026-05', plan.metadata.forkHead);
  writeRollingState(repo.path, validStateFromPlan(plan, 'rebase/upstream-2026-05'), outputDir);
  repo.git('checkout', 'main');
  repo.write('fork-two.txt', 'fork two');
  const newForkHead = repo.commit('feat: fork two (#2)');
  repo.git('checkout', 'rebase/upstream-2026-05');

  const failed = runRollingSyncForkMainCommand({
    repoPath: repo.path,
    outputDir,
    runChecks: () => ({ ok: false, commands: ['make fork-ownership-coverage-check'] }),
  });

  expect(failed).toBe(1);
  expect(readRollingState(repo.path, outputDir)).toMatchObject({
    integratedForkHead: plan.metadata.forkHead,
    activeForkSync: { to: newForkHead },
  });

  const continued = runRollingSyncForkMainCommand({
    repoPath: repo.path,
    outputDir,
    continue: true,
    runChecks: () => ({ ok: true, commands: ['make fork-ownership-coverage-check'] }),
  });

  expect(continued).toBe(0);
  expect(readRollingState(repo.path, outputDir)).toMatchObject({
    integratedForkHead: newForkHead,
    activeForkSync: undefined,
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/rolling.spec.ts
```

Expected: FAIL on missing or incomplete failure behavior.

**Step 3: Implement failure and continue behavior**

Adjust `runRollingSyncForkMainCommand()`:

- Use `try/catch` around cherry-pick loop.
- Do not write `activeForkSync` until after all cherry-picks succeed.
- In continue mode, require `state.activeForkSync`.
- Do not cherry-pick in continue mode.

Add:

```ts
function continueForkSync(options: RollingSyncOptions, state: RollingState): number {
  if (!state.activeForkSync) {
    throw new Error('No failed fork sync is active; --continue is only valid after checks failed.');
  }
  const plan = readPersistedBatchPlan(options.repoPath, options.outputDir);
  return promoteForkSyncAfterChecks(options, state, lastCompletedBatchId(plan, options.repoPath));
}
```

**Step 4: Run focused tests**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/rolling.spec.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add tools/upstream-preflight/src/rolling.ts tools/upstream-preflight/src/rolling.spec.ts
git commit -m "feat: recover rolling fork sync after failed checks"
```

## Task 9: Add Final Accounting Tests And Command

**Files:**

- Modify: `tools/upstream-preflight/src/rolling.spec.ts`
- Modify: `tools/upstream-preflight/src/rolling.ts`

**Step 1: Write failing tests**

Add:

```ts
import { runRollingFinalCheckCommand } from './rolling';

it('final-check blocks when origin main moved after the last fork sync', () => {
  const { repo, outputDir, plan } = createRepoWithPlan();
  repo.git('checkout', '-b', 'rebase/upstream-2026-05', plan.metadata.upstreamHead);
  writeRollingState(repo.path, validStateFromPlan(plan, 'rebase/upstream-2026-05'), outputDir);
  repo.git('checkout', 'main');
  repo.write('late.txt', 'late');
  repo.commit('feat: late fork (#3)');
  repo.git('checkout', 'rebase/upstream-2026-05');
  const errors: string[] = [];

  const exitCode = runRollingFinalCheckCommand({
    repoPath: repo.path,
    outputDir,
    runChecks: () => ({ ok: true, commands: [] }),
    writeError: (message) => errors.push(message),
  });

  expect(exitCode).toBe(1);
  expect(errors.join('\n')).toContain(`${plan.metadata.forkRef} has commits not included in integratedForkHead`);
});

it('final-check blocks while active fork sync exists', () => {
  const { repo, outputDir, plan } = createRepoWithPlan();
  repo.git('checkout', '-b', 'rebase/upstream-2026-05', plan.metadata.upstreamHead);
  writeRollingState(
    repo.path,
    {
      ...validStateFromPlan(plan, 'rebase/upstream-2026-05'),
      activeForkSync: {
        status: 'checks-failed',
        from: plan.metadata.forkHead,
        to: plan.metadata.forkHead,
        commits: [],
        preSyncHead: plan.metadata.forkHead,
      },
    },
    outputDir,
  );

  expect(runRollingFinalCheckCommand({ repoPath: repo.path, outputDir })).toBe(1);
});

it('final-check reports missing PR/title matches', () => {
  const { repo, outputDir, plan } = createRepoWithPlan();
  repo.git('checkout', 'main');
  repo.write('pr-44.txt', 'pr');
  const newForkHead = repo.commit('feat: important fork work (#44)');
  repo.git('checkout', '-b', 'rebase/upstream-2026-05', plan.metadata.upstreamHead);
  writeRollingState(
    repo.path,
    {
      ...validStateFromPlan(plan, 'rebase/upstream-2026-05'),
      integratedForkHead: newForkHead,
    },
    outputDir,
  );
  const errors: string[] = [];

  const exitCode = runRollingFinalCheckCommand({
    repoPath: repo.path,
    outputDir,
    runChecks: () => ({ ok: true, commands: [] }),
    writeError: (message) => errors.push(message),
  });

  expect(exitCode).toBe(1);
  expect(errors.join('\n')).toContain('#44');
});

it('final-check reports patch-equivalence mismatches even when subjects match', () => {
  const { repo, outputDir, plan } = createRepoWithPlan();
  repo.git('checkout', 'main');
  repo.write('same-subject.txt', 'origin patch');
  const newForkHead = repo.commit('feat: same subject (#55)');
  repo.git('checkout', '-b', 'rebase/upstream-2026-05', plan.metadata.upstreamHead);
  repo.write('same-subject.txt', 'conflict resolved differently');
  repo.commit('feat: same subject (#55)');
  writeRollingState(
    repo.path,
    {
      ...validStateFromPlan(plan, 'rebase/upstream-2026-05'),
      integratedForkHead: newForkHead,
    },
    outputDir,
  );
  const errors: string[] = [];

  const exitCode = runRollingFinalCheckCommand({
    repoPath: repo.path,
    outputDir,
    runChecks: () => ({ ok: true, commands: [] }),
    writeError: (message) => errors.push(message),
  });

  expect(exitCode).toBe(1);
  expect(errors.join('\n')).toContain('Patch-equivalence mismatch');
  expect(errors.join('\n')).toContain('#55');
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/rolling.spec.ts
```

Expected: FAIL because final-check command is missing.

**Step 3: Implement final-check**

Add:

```ts
export type RollingFinalCheckOptions = RollingCommandOptions & {
  fetchFork?: (repoPath: string, forkRef: string) => void;
  runChecks?: (context: { phase: 'final' }) => CheckResult;
};

export function runRollingFinalCheckCommand(options: RollingFinalCheckOptions): number {
  const write = options.write ?? console.log;
  const writeError = options.writeError ?? console.error;

  try {
    const state = readRollingState(options.repoPath, options.outputDir);
    const plan = readPersistedBatchPlan(options.repoPath, options.outputDir);
    const errors: string[] = [];
    (options.fetchFork ?? fetchForkRef)(options.repoPath, state.forkRef);

    if (!isAncestor(options.repoPath, state.upstreamTargetHead, 'HEAD')) {
      errors.push(`HEAD does not include upstream target ${state.upstreamTargetHead}`);
    }
    if (state.activeForkSync) {
      errors.push('A fork sync is still active; run make upstream-sync-fork-main ROLLING_CONTINUE=1 first.');
    }
    const currentForkHead = revParse(options.repoPath, state.forkRef);
    if (currentForkHead !== state.integratedForkHead) {
      errors.push(`${state.forkRef} has commits not included in integratedForkHead ${state.integratedForkHead}`);
    }

    errors.push(...findMissingSubjectMatches(options.repoPath, plan, state));
    errors.push(...findPatchMismatches(options.repoPath, state));

    const checks = options.runChecks?.({ phase: 'final' }) ?? {
      ok: true,
      commands: defaultFinalChecks(),
    };
    if (!checks.ok) errors.push('Final local checks failed.');

    const checkedState = appendCheckHistory(state, 'final', checks);
    writeRollingState(options.repoPath, checkedState, options.outputDir);

    if (errors.length > 0) throw new Error(errors.join('\n'));

    write('Rolling upstream rebase final check passed.');
    return 0;
  } catch (error) {
    writeError(errorMessage(error));
    return 1;
  }
}
```

Implement `findMissingSubjectMatches()` simply first:

```ts
function findMissingSubjectMatches(repoPath: string, plan: BatchPlan, state: RollingState): string[] {
  const forkSubjects = commitSubjects(repoPath, `${plan.metadata.upstreamRef}..${state.forkRef}`);
  const headSubjects = new Set(
    commitSubjects(repoPath, `${plan.metadata.upstreamRef}..HEAD`).map((item) => normalizeSubject(item.subject)),
  );
  return forkSubjects
    .filter((item) => !headSubjects.has(normalizeSubject(item.subject)))
    .map((item) => `Missing fork commit subject in rebase branch: ${item.subject}`);
}
```

Use `normalizeSubject()` to trim whitespace and keep PR numbers intact.

Add `findPatchMismatches()`:

```ts
function findPatchMismatches(repoPath: string, state: RollingState): string[] {
  const result = cherryEquivalent(repoPath, 'HEAD', state.forkRef);
  if (result.missing.length === 0) return [];

  const subjectsBySha = new Map(
    commitSubjects(repoPath, `${state.upstreamRef}..${state.forkRef}`).map((item) => [item.sha, item.subject]),
  );

  return result.missing.map((sha) => {
    const subject = subjectsBySha.get(sha) ?? sha;
    return `Patch-equivalence mismatch for fork commit: ${subject}`;
  });
}
```

Import `cherryEquivalent` from `./git`.

Add the initial unexported final check list helper used by the command. Task 11
will add focused tests for this helper and export it:

```ts
function defaultFinalChecks(): string[] {
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
```

**Step 4: Run focused tests**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/rolling.spec.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add tools/upstream-preflight/src/rolling.ts tools/upstream-preflight/src/rolling.spec.ts
git commit -m "feat: verify rolling rebase final accounting"
```

## Task 10: Add CLI Commands And Package Scripts

**Files:**

- Create: `tools/upstream-preflight/src/cli-wiring.spec.ts`
- Modify: `tools/upstream-preflight/src/index.ts`
- Modify: `tools/upstream-preflight/package.json`
- Modify: `Makefile`

**Step 1: Write failing tests**

Create `tools/upstream-preflight/src/cli-wiring.spec.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('rolling rebase CLI wiring', () => {
  it('exposes rolling commands as package scripts', () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts).toMatchObject({
      'rolling-start': 'tsx src/index.ts rolling-start',
      'rolling-status': 'tsx src/index.ts rolling-status',
      'sync-fork-main': 'tsx src/index.ts sync-fork-main',
      'rolling-final-check': 'tsx src/index.ts rolling-final-check',
    });
  });

  it('exposes rolling commands as Make targets', () => {
    const makefile = fs.readFileSync(path.resolve(process.cwd(), '../../Makefile'), 'utf8');

    expect(makefile).toContain('.PHONY: upstream-rolling-start');
    expect(makefile).toContain('$(UPSTREAM_PREFLIGHT) run rolling-start');
    expect(makefile).toContain('.PHONY: upstream-rolling-status');
    expect(makefile).toContain('$(UPSTREAM_PREFLIGHT) run rolling-status');
    expect(makefile).toContain('.PHONY: upstream-sync-fork-main');
    expect(makefile).toContain('$(UPSTREAM_PREFLIGHT) run sync-fork-main');
    expect(makefile).toContain('.PHONY: upstream-rolling-final-check');
    expect(makefile).toContain('$(UPSTREAM_PREFLIGHT) run rolling-final-check');
  });
});
```

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/cli-wiring.spec.ts
```

Expected: FAIL because package scripts and Make targets are not wired yet.

**Step 2: Wire package scripts**

Modify `tools/upstream-preflight/package.json`:

```json
"rolling-start": "tsx src/index.ts rolling-start",
"rolling-status": "tsx src/index.ts rolling-status",
"sync-fork-main": "tsx src/index.ts sync-fork-main",
"rolling-final-check": "tsx src/index.ts rolling-final-check"
```

**Step 3: Wire Commander commands**

In `tools/upstream-preflight/src/index.ts`, import:

```ts
import {
  runRollingFinalCheckCommand,
  runRollingStartCommand,
  runRollingStatusCommand,
  runRollingSyncForkMainCommand,
} from './rolling';
```

Add commands:

```ts
program
  .command('rolling-start')
  .option('--output-dir <path>', 'rolling state and batch plan directory')
  .option('--resume', 'resume an existing rolling state')
  .action((options: { outputDir?: string; resume?: boolean }) => {
    process.exitCode = runRollingStartCommand({
      repoPath: process.cwd(),
      outputDir: options.outputDir ? resolveCliPath(options.outputDir) : undefined,
      resume: options.resume,
    });
  });

program
  .command('rolling-status')
  .option('--output-dir <path>', 'rolling state and batch plan directory')
  .action((options: { outputDir?: string }) => {
    process.exitCode = runRollingStatusCommand({
      repoPath: process.cwd(),
      outputDir: options.outputDir ? resolveCliPath(options.outputDir) : undefined,
    });
  });

program
  .command('sync-fork-main')
  .option('--output-dir <path>', 'rolling state and batch plan directory')
  .option('--continue', 'continue a fork sync after checks failed')
  .action((options: { outputDir?: string; continue?: boolean }) => {
    process.exitCode = runRollingSyncForkMainCommand({
      repoPath: process.cwd(),
      outputDir: options.outputDir ? resolveCliPath(options.outputDir) : undefined,
      continue: options.continue,
    });
  });

program
  .command('rolling-final-check')
  .option('--output-dir <path>', 'rolling state and batch plan directory')
  .action((options: { outputDir?: string }) => {
    process.exitCode = runRollingFinalCheckCommand({
      repoPath: process.cwd(),
      outputDir: options.outputDir ? resolveCliPath(options.outputDir) : undefined,
    });
  });
```

**Step 4: Wire Make targets**

Modify `Makefile` after `upstream-next-batch`:

```make
.PHONY: upstream-rolling-start
upstream-rolling-start:
	$(UPSTREAM_PREFLIGHT) run rolling-start $(if $(ROLLING_RESUME),-- --resume,)

.PHONY: upstream-rolling-status
upstream-rolling-status:
	$(UPSTREAM_PREFLIGHT) run rolling-status

.PHONY: upstream-sync-fork-main
upstream-sync-fork-main:
	$(UPSTREAM_PREFLIGHT) run sync-fork-main $(if $(ROLLING_CONTINUE),-- --continue,)

.PHONY: upstream-rolling-final-check
upstream-rolling-final-check:
	$(UPSTREAM_PREFLIGHT) run rolling-final-check
```

**Step 5: Run targeted checks**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run check
pnpm --filter @gallery/upstream-preflight exec vitest --run src/rolling.spec.ts src/cli-wiring.spec.ts
```

Expected: PASS.

**Step 6: Commit**

```bash
git add Makefile tools/upstream-preflight/package.json tools/upstream-preflight/src/index.ts tools/upstream-preflight/src/cli-wiring.spec.ts
git commit -m "feat: expose rolling rebase commands"
```

## Task 11: Run Real Check Commands From Rolling Module

**Files:**

- Modify: `tools/upstream-preflight/src/rolling.spec.ts`
- Modify: `tools/upstream-preflight/src/rolling.ts`

**Step 1: Write failing tests**

Add tests that default checks are surfaced when no injected runner is provided:

```ts
it('uses deterministic default fork-sync checks', () => {
  expect(defaultForkSyncChecks()).toEqual([
    'make fork-ownership-coverage-check',
    'make ci-invariants-check',
    'make fork-patches-check',
  ]);
  expect(defaultForkSyncChecks('01')).toContain('make upstream-postrebase-audit BATCH=01');
});

it('uses deterministic default final checks', () => {
  expect(defaultFinalChecks()).toContain('make upstream-next-batch');
  expect(defaultFinalChecks()).toContain('pnpm --filter @gallery/upstream-preflight run test');
});
```

Export `defaultForkSyncChecks()` and `defaultFinalChecks()` for tests.

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/rolling.spec.ts
```

Expected: FAIL because defaults are missing or not exported.

**Step 3: Implement default check execution**

Change the existing unexported default check helpers to exported functions:

```ts
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
```

Add a shell runner using `spawnSync`:

```ts
type ShellRunner = (command: string, cwd: string) => { status: number; stdout: string; stderr: string };

function runCommandList(commands: string[], cwd: string, runner: ShellRunner = defaultShellRunner): CheckResult {
  const output: string[] = [];
  for (const command of commands) {
    const result = runner(command, cwd);
    output.push(result.stdout, result.stderr);
    if (result.status !== 0) {
      return { ok: false, commands, output: output.filter(Boolean).join('\n') };
    }
  }
  return { ok: true, commands, output: output.filter(Boolean).join('\n') };
}

function defaultShellRunner(command: string, cwd: string) {
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
```

Keep `runChecks` injection for unit tests. Use the default command list only
when no injection is passed. Update `promoteForkSyncAfterChecks()` and
`runRollingFinalCheckCommand()` so their default branches call `runCommandList()`
instead of returning `{ ok: true, commands: ... }`.

**Step 4: Run focused tests**

Run:

```bash
pnpm --filter @gallery/upstream-preflight exec vitest --run src/rolling.spec.ts
pnpm --filter @gallery/upstream-preflight run check
```

Expected: PASS.

**Step 5: Commit**

```bash
git add tools/upstream-preflight/src/rolling.ts tools/upstream-preflight/src/rolling.spec.ts
git commit -m "feat: run rolling rebase verification checks"
```

## Task 12: Update Upstream Rebase Process Documentation

**Files:**

- Modify: `docs/docs/developer/upstream-rebase-process.md`

**Step 1: Write the docs change**

Add a section after "Rebase Mechanics":

````md
## Rolling Rebase Branches

Use rolling mode when an upstream sync is expected to live long enough that
Gallery PRs will continue landing on `origin/main`.

Start from a separate worktree and run the normal readiness flow:

```bash
make upstream-rebase-ready
make upstream-rolling-start
```

Continue upstream batches with `make upstream-next-batch`. Sync new Gallery
commits only between clean batch boundaries:

```bash
make upstream-sync-fork-main
```

Never merge `origin/main` into the rolling branch. The sync command cherry-picks
the range from the stored `integratedForkHead` to the current fork ref, then runs
the fork checks and the last completed batch audit.

If checks fail after cherry-picking succeeds, fix the branch and continue:

```bash
make upstream-sync-fork-main ROLLING_CONTINUE=1
```

Before any final force-push, run:

```bash
make upstream-rolling-final-check
```

If `upstream/main` moves while rolling mode is active, keep working toward the
approved `upstreamTargetHead`. Do not regenerate completed batches silently.
````

Also update the final push section to mention:

```md
If the branch has rolling state, `make upstream-rolling-final-check` must pass
before using the `push-rebase` skill.
```

**Step 2: Run docs sanity check**

Run:

```bash
rg -n "Rolling Rebase Branches|upstream-rolling-final-check|ROLLING_CONTINUE" docs/docs/developer/upstream-rebase-process.md
```

Expected: all three terms are present.

**Step 3: Commit**

```bash
git add docs/docs/developer/upstream-rebase-process.md
git commit -m "docs: document rolling upstream rebase process"
```

## Task 13: Final Verification

**Files:**

- No new files unless checks require fixes.

**Step 1: Run focused upstream-preflight checks**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test
pnpm --filter @gallery/upstream-preflight run check
pnpm --filter @gallery/upstream-preflight run format
```

Expected: all pass.

**Step 2: Run repository-level smoke checks for new Make targets**

Run:

```bash
make upstream-rolling-status
```

Expected: if no rolling state exists, command exits non-zero with a clear
message:

```text
Missing rolling state ...; run make upstream-rolling-start first.
```

This is an acceptable smoke result.

**Step 3: Review git history**

Run:

```bash
git log --oneline --max-count=12
git status --short --branch
```

Expected:

- commits are small and ordered by task
- worktree is clean

**Step 4: Final summary**

Summarize:

- files changed
- commands run and results
- any skipped checks with reasons
- follow-up risks, especially final push-rebase integration if not fully automated
