# Upstream Rebase Preflight And Batching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate upstream rebase risk reports and risk-aware batch plans from git state and `docs/fork/ownership.yml`.

**Architecture:** This phase adds git range collection, risk classification, Markdown report rendering, and batch partitioning. The CLI writes generated output under Git metadata and prints human-readable reports for operators.

**Tech Stack:** TypeScript, Node.js `child_process`, micromatch, commander, Vitest, Makefile.

---

## File Structure

- Create: `tools/upstream-preflight/test/fixtures.ts`
  - Temporary git repo fixture helpers.
- Create: `tools/upstream-preflight/src/git.ts`
  - Git command adapter and range collector.
- Create: `tools/upstream-preflight/src/git.spec.ts`
  - Git adapter coverage.
- Create: `tools/upstream-preflight/src/risk.ts`
  - Domain detection and commit classification.
- Create: `tools/upstream-preflight/src/risk.spec.ts`
  - Risk classification coverage.
- Create: `tools/upstream-preflight/src/batch.ts`
  - Risk-aware batch planner and batch command rendering.
- Create: `tools/upstream-preflight/src/batch.spec.ts`
  - Batch partitioning coverage.
- Create: `tools/upstream-preflight/src/report.ts`
  - Preflight Markdown renderer.
- Create: `tools/upstream-preflight/src/report.spec.ts`
  - Report rendering coverage.
- Modify: `tools/upstream-preflight/src/index.ts`
  - Wires real `preflight` and `batch-plan` commands.

### Task 1: Git Range Collection

**Files:**

- Create: `tools/upstream-preflight/test/fixtures.ts`
- Create: `tools/upstream-preflight/src/git.ts`
- Create: `tools/upstream-preflight/src/git.spec.ts`

- [x] **Step 1: Add git fixture helper**

Create `tools/upstream-preflight/test/fixtures.ts`:

```ts
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type TempRepo = {
  path: string;
  git: (...args: string[]) => string;
  write: (file: string, content: string) => void;
  commit: (message: string) => string;
};

export function createTempRepo(): TempRepo {
  const repoPath = fs.mkdtempSync(path.join(os.tmpdir(), 'gallery-upstream-preflight-'));
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: repoPath, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

  git('init', '-b', 'main');
  git('config', 'user.name', 'Test User');
  git('config', 'user.email', 'test@example.com');

  const write = (file: string, content: string) => {
    const fullPath = path.join(repoPath, file);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
  };

  const commit = (message: string) => {
    git('add', '.');
    git('commit', '-m', message);
    return git('rev-parse', 'HEAD');
  };

  return { path: repoPath, git, write, commit };
}
```

- [x] **Step 2: Add git adapter test**

Create `tools/upstream-preflight/src/git.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createTempRepo } from '../test/fixtures';
import { collectGitRange, getGitPath, getMergeBase } from './git';

describe('git range collection', () => {
  it('collects commits, files, shortstat, merge base, and git metadata paths', () => {
    const repo = createTempRepo();
    repo.write('README.md', 'base');
    const base = repo.commit('base commit');
    repo.git('checkout', '-b', 'upstream');
    repo.write('server/src/services/search.service.ts', 'upstream');
    const upstreamSha = repo.commit('refactor!: upstream search service');
    repo.git('checkout', 'main');
    repo.write('server/src/services/shared-space.service.ts', 'fork');
    repo.commit('feat: fork shared spaces');

    expect(getMergeBase(repo.path, 'main', 'upstream')).toBe(base);
    expect(getGitPath(repo.path, 'upstream-preflight/preflight.json')).toContain('upstream-preflight/preflight.json');

    const range = collectGitRange(repo.path, `${base}..upstream`);

    expect(range.commits).toEqual([
      {
        sha: upstreamSha,
        shortSha: upstreamSha.slice(0, 9),
        subject: 'refactor!: upstream search service',
        files: ['server/src/services/search.service.ts'],
      },
    ]);
    expect(range.files).toEqual(['server/src/services/search.service.ts']);
    expect(range.shortStat).toContain('1 file changed');
  });
});
```

- [x] **Step 3: Implement git adapter**

Create `tools/upstream-preflight/src/git.ts`:

```ts
import { execFileSync } from 'node:child_process';
import type { GitCommit } from './types';

export type GitRange = {
  commits: GitCommit[];
  files: string[];
  shortStat: string;
};

export function runGit(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export function getMergeBase(cwd: string, left: string, right: string): string {
  return runGit(cwd, ['merge-base', left, right]);
}

export function getGitPath(cwd: string, relativePath: string): string {
  return runGit(cwd, ['rev-parse', '--git-path', relativePath]);
}

export function collectGitRange(cwd: string, range: string): GitRange {
  const shas = runGit(cwd, ['rev-list', '--reverse', range])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const commits = shas.map((sha) => {
    const subject = runGit(cwd, ['log', '-1', '--format=%s', sha]);
    const files = runGit(cwd, ['diff-tree', '--no-commit-id', '--name-only', '-r', '-M', sha])
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .sort();

    return { sha, shortSha: sha.slice(0, 9), subject, files };
  });

  const files = runGit(cwd, ['diff', '--name-only', range])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();

  return {
    commits,
    files,
    shortStat: runGit(cwd, ['diff', '--shortstat', range]),
  };
}
```

- [x] **Step 4: Verify and commit git adapter**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- git.spec.ts
pnpm --filter @gallery/upstream-preflight run check
git add tools/upstream-preflight/test/fixtures.ts tools/upstream-preflight/src/git.ts tools/upstream-preflight/src/git.spec.ts
git commit -m "feat: collect upstream git ranges"
```

Expected: tests pass, type check passes, and commit succeeds.

### Task 2: Risk Classification

**Files:**

- Create: `tools/upstream-preflight/src/risk.ts`
- Create: `tools/upstream-preflight/src/risk.spec.ts`

- [x] **Step 1: Add classifier tests**

Create `tools/upstream-preflight/src/risk.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { classifyCommit, detectDomain } from './risk';
import type { Manifest } from './types';

const manifest: Manifest = {
  version: 1,
  metadata: {
    upstream_remote: 'upstream',
    upstream_branch: 'main',
    fork_remote: 'origin',
    fork_branch: 'main',
    last_verified_fork_head: '919deb87a6477d5058e0fa7b3960d30de577b495',
  },
  features: {
    'shared-spaces': {
      title: 'Shared Spaces',
      risk: 'high',
      domains: ['server', 'database'],
      upstream_extension_paths: ['server/src/services/search.service.ts'],
      required_checks: ['e2e-rebase-smoke'],
    },
  },
  checks: {
    'e2e-rebase-smoke': {
      command: 'make e2e-rebase-smoke',
      phase: 'post-batch',
      required_for_risk: ['high'],
    },
    'storage-migration-tests': {
      command: 'make test-server',
      phase: 'post-batch',
      required_for_domains: ['server'],
    },
  },
  risk_patterns: [
    { id: 'breaking-refactor', risk: 'high', subject_regex: 'refactor!', notes: 'Breaking refactor' },
    { id: 'server-schema', risk: 'high', path_globs: ['server/src/schema/migrations/**'], notes: 'Schema change' },
  ],
};

describe('detectDomain', () => {
  it.each([
    ['server/src/services/search.service.ts', 'server'],
    ['web/src/routes/+layout.svelte', 'web'],
    ['mobile/lib/main.dart', 'mobile'],
    ['.github/workflows/test.yml', 'ci'],
    ['docs/docs/install.md', 'docs'],
    ['e2e/src/spec.ts', 'e2e'],
    ['machine-learning/pyproject.toml', 'ml'],
    ['package.json', 'config'],
  ])('maps %s to %s', (file, domain) => {
    expect(detectDomain(file)).toBe(domain);
  });
});

describe('classifyCommit', () => {
  it('raises risk for feature overlap and risk patterns', () => {
    const result = classifyCommit(
      {
        sha: 'abc123',
        shortSha: 'abc123',
        subject: 'refactor!: change search service',
        files: ['server/src/services/search.service.ts'],
      },
      manifest,
      ['server/src/services/search.service.ts'],
    );

    expect(result.risk).toBe('high');
    expect(result.features).toEqual(['shared-spaces']);
    expect(result.requiredChecks).toEqual(['e2e-rebase-smoke', 'storage-migration-tests']);
    expect(result.reasons).toContain('Touches shared-spaces upstream extension path');
    expect(result.reasons).toContain('Matches risk pattern breaking-refactor');
  });
});
```

- [x] **Step 2: Implement classifier**

Create `tools/upstream-preflight/src/risk.ts`:

```ts
import micromatch from 'micromatch';
import type { ClassifiedCommit, Domain, GitCommit, Manifest, RiskLevel } from './types';

const riskRank: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };

export function detectDomain(file: string): Domain {
  if (file.startsWith('server/')) return 'server';
  if (file.startsWith('web/')) return 'web';
  if (file.startsWith('mobile/')) return 'mobile';
  if (file.startsWith('.github/')) return 'ci';
  if (file.startsWith('docs/')) return 'docs';
  if (file.startsWith('e2e/')) return 'e2e';
  if (file.startsWith('machine-learning/')) return 'ml';
  return 'config';
}

function maxRisk(left: RiskLevel, right: RiskLevel): RiskLevel {
  return riskRank[right] > riskRank[left] ? right : left;
}

function checkAppliesToCommit(checkRisk: RiskLevel, commitRisk: RiskLevel): boolean {
  return riskRank[commitRisk] >= riskRank[checkRisk];
}

export function classifyCommit(commit: GitCommit, manifest: Manifest, forkFiles: string[]): ClassifiedCommit {
  const domains = [...new Set(commit.files.map(detectDomain))].sort();
  const overlapFiles = commit.files.filter((file) => forkFiles.includes(file));
  const features = new Set<string>();
  const requiredChecks = new Set<string>();
  const reasons: string[] = [];
  let risk: RiskLevel = overlapFiles.length > 0 ? 'medium' : 'low';

  for (const [featureId, feature] of Object.entries(manifest.features)) {
    const ownedMatch = micromatch(commit.files, feature.owned_paths ?? []);
    const extensionMatch = micromatch(commit.files, feature.upstream_extension_paths ?? []);

    if (ownedMatch.length > 0 || extensionMatch.length > 0) {
      features.add(featureId);
      risk = maxRisk(risk, feature.risk);
      for (const check of feature.required_checks ?? []) requiredChecks.add(check);
    }

    if (ownedMatch.length > 0) reasons.push(`Touches ${featureId} owned path`);
    if (extensionMatch.length > 0) reasons.push(`Touches ${featureId} upstream extension path`);
  }

  for (const pattern of manifest.risk_patterns ?? []) {
    const subjectMatches = pattern.subject_regex ? new RegExp(pattern.subject_regex).test(commit.subject) : false;
    const pathMatches = pattern.path_globs ? micromatch(commit.files, pattern.path_globs).length > 0 : false;

    if (subjectMatches || pathMatches) {
      risk = maxRisk(risk, pattern.risk);
      reasons.push(`Matches risk pattern ${pattern.id}`);
    }
  }

  for (const [checkId, check] of Object.entries(manifest.checks ?? {})) {
    if (check.required_for_risk?.some((checkRisk) => checkAppliesToCommit(checkRisk, risk))) {
      requiredChecks.add(checkId);
    }
    if (check.required_for_domains?.some((domain) => domains.includes(domain))) {
      requiredChecks.add(checkId);
    }
  }

  return {
    ...commit,
    domains,
    overlapFiles,
    features: [...features].sort(),
    risk,
    reasons,
    requiredChecks: [...requiredChecks].sort(),
  };
}
```

- [x] **Step 3: Verify and commit classifier**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- risk.spec.ts
pnpm --filter @gallery/upstream-preflight run check
git add tools/upstream-preflight/src/risk.ts tools/upstream-preflight/src/risk.spec.ts
git commit -m "feat: classify upstream rebase risk"
```

Expected: tests pass, type check passes, and commit succeeds.

### Task 3: Batch Planner

**Files:**

- Create: `tools/upstream-preflight/src/batch.ts`
- Create: `tools/upstream-preflight/src/batch.spec.ts`

- [x] **Step 1: Add batch tests**

Create `tools/upstream-preflight/src/batch.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { planBatches, renderBatchMarkdown, selectBatchAuditScope } from './batch';
import type { BatchPlan, ClassifiedCommit, RiskLevel } from './types';

function commit(shortSha: string, risk: RiskLevel, reasons: string[] = [], files: string[] = []): ClassifiedCommit {
  return {
    sha: `${shortSha}000000000000000000000000000000000000000`,
    shortSha,
    subject: `${risk} commit`,
    files,
    domains: [],
    overlapFiles: [],
    features: [],
    risk,
    reasons,
    requiredChecks: risk === 'high' ? ['mobile-drift-rebase-check'] : [],
  };
}

describe('planBatches', () => {
  it('groups low risk commits up to the soft cap and isolates high risk commits', () => {
    const plan = planBatches(
      [
        commit('000000001', 'low'),
        commit('000000002', 'low'),
        commit('539a39ae4', 'high', ['Matches risk pattern mobile-drift']),
        commit('000000004', 'medium', ['Matches risk pattern openapi-generated']),
        commit('000000005', 'medium'),
      ],
      10,
    );

    expect(plan.batches.map((batch) => batch.commits.map((item) => item.shortSha))).toEqual([
      ['000000001', '000000002'],
      ['539a39ae4'],
      ['000000004'],
      ['000000005'],
    ]);
    expect(plan.batches[1].requiredChecks).toEqual(['mobile-drift-rebase-check']);
  });

  it('renders operator commands in the batch table', () => {
    const markdown = renderBatchMarkdown(planBatches([commit('539a39ae4', 'high')], 10));

    expect(markdown).toContain('| 01 | `539a39ae4` | 1 | HIGH |');
    expect(markdown).toContain('git rebase 539a39ae4');
    expect(markdown).toContain('make mobile-drift-rebase-check BATCH=01');
  });
});

describe('selectBatchAuditScope', () => {
  const batchPlan: BatchPlan = {
    batches: [
      {
        id: '01',
        tipSha: '111111111',
        commits: [commit('111111111', 'medium', [], ['server/src/queries/asset.job.repository.sql'])],
        risk: 'medium',
        why: [],
        requiredChecks: [],
      },
      {
        id: '02',
        tipSha: '222222222',
        commits: [commit('222222222', 'high', [], ['mobile/openapi/lib/api.dart'])],
        risk: 'high',
        why: ['Matches risk pattern openapi-generated'],
        requiredChecks: ['mobile-drift-rebase-check'],
      },
    ],
  };

  it('selects only the requested batch files for audit signals', () => {
    expect(
      selectBatchAuditScope({
        batch: '01',
        batchPlan,
        upstreamTouchedFiles: ['server/src/queries/asset.job.repository.sql', 'mobile/openapi/lib/api.dart'],
      }),
    ).toEqual({ batch: '01', upstreamTouchedFiles: ['server/src/queries/asset.job.repository.sql'] });
  });
});
```

- [x] **Step 2: Implement batch planner**

Create `tools/upstream-preflight/src/batch.ts`:

```ts
import type { Batch, BatchPlan, ClassifiedCommit, RiskLevel } from './types';

const riskRank: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };

function batchRisk(commits: ClassifiedCommit[]): RiskLevel {
  return commits.reduce<RiskLevel>(
    (risk, commit) => (riskRank[commit.risk] > riskRank[risk] ? commit.risk : risk),
    'low',
  );
}

function makeBatch(index: number, commits: ClassifiedCommit[]): Batch {
  const requiredChecks = [...new Set(commits.flatMap((commit) => commit.requiredChecks))].sort();
  const why = [...new Set(commits.flatMap((commit) => commit.reasons))];
  const tip = commits.at(-1);

  if (!tip) {
    throw new Error('Cannot create an empty batch');
  }

  return {
    id: String(index).padStart(2, '0'),
    tipSha: tip.shortSha,
    commits,
    risk: batchRisk(commits),
    why,
    requiredChecks,
  };
}

function mustStartOwnBatch(commit: ClassifiedCommit): boolean {
  return (
    commit.risk === 'high' ||
    commit.features.length > 1 ||
    commit.reasons.some((reason) => reason.includes('openapi-generated'))
  );
}

export function planBatches(commits: ClassifiedCommit[], softCap = 10): BatchPlan {
  const batches: Batch[] = [];
  let current: ClassifiedCommit[] = [];

  const flush = () => {
    if (current.length > 0) {
      batches.push(makeBatch(batches.length + 1, current));
      current = [];
    }
  };

  for (const commit of commits) {
    if (mustStartOwnBatch(commit)) {
      flush();
      batches.push(makeBatch(batches.length + 1, [commit]));
      continue;
    }

    current.push(commit);
    if (current.length >= softCap) flush();
  }

  flush();
  return { batches };
}

export function selectBatchAuditScope(input: { batch?: string; batchPlan: BatchPlan; upstreamTouchedFiles: string[] }) {
  if (!input.batch) {
    return { upstreamTouchedFiles: input.upstreamTouchedFiles };
  }

  const requestedBatch = /^\d+$/.test(input.batch) ? input.batch.padStart(2, '0') : input.batch;
  const batch = input.batchPlan.batches.find((candidate) => candidate.id === requestedBatch);
  if (!batch) {
    const availableBatches = input.batchPlan.batches.map((candidate) => candidate.id).join(', ');
    throw new Error(`Unknown upstream batch ${input.batch}. Available batches: ${availableBatches || 'none'}`);
  }

  return {
    batch: batch.id,
    upstreamTouchedFiles: [...new Set(batch.commits.flatMap((commit) => commit.files))].sort(),
  };
}

export function renderBatchMarkdown(plan: BatchPlan): string {
  const rows = plan.batches
    .map(
      (batch) =>
        `| ${batch.id} | \`${batch.tipSha}\` | ${batch.commits.length} | ${batch.risk.toUpperCase()} | ${batch.why.join('; ') || '-'} | ${batch.requiredChecks.join(', ') || '-'} |`,
    )
    .join('\n');
  const commands = plan.batches
    .map(
      (batch) => `### Batch ${batch.id}

\`\`\`bash
git rebase ${batch.tipSha}
make upstream-postrebase-audit BATCH=${batch.id}
${batch.requiredChecks.map((check) => renderRequiredCheckCommand(check, batch.id)).join('\n')}
git push origin HEAD:rebase/upstream-batch-${batch.id} --force
\`\`\``,
    )
    .join('\n\n');

  return `| Batch | Tip SHA | Commits | Risk | Why | Required Checks |
| --- | --- | ---: | --- | --- | --- |
${rows || '| - | - | 0 | LOW | No incoming upstream commits | - |'}

## Batch Commands

${commands || 'No upstream batches are required.'}
`;
}

function renderRequiredCheckCommand(check: string, batchId: string): string {
  if (check === 'mobile-drift-rebase-check') {
    return `make ${check} BATCH=${batchId}`;
  }

  return `make ${check}`;
}
```

- [x] **Step 3: Verify and commit planner**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- batch.spec.ts
pnpm --filter @gallery/upstream-preflight run check
git add tools/upstream-preflight/src/batch.ts tools/upstream-preflight/src/batch.spec.ts
git commit -m "feat: plan upstream rebase batches"
```

Expected: tests pass, type check passes, and commit succeeds.

### Task 4: Report Renderer And CLI Wiring

**Files:**

- Create: `tools/upstream-preflight/src/report.ts`
- Create: `tools/upstream-preflight/src/report.spec.ts`
- Modify: `tools/upstream-preflight/src/index.ts`

- [x] **Step 1: Add report test**

Create `tools/upstream-preflight/src/report.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { renderPreflightMarkdown } from './report';
import type { ClassifiedCommit } from './types';

describe('renderPreflightMarkdown', () => {
  it('renders high-risk commits, batch plan, audits, and extension hotspots', () => {
    const commit: ClassifiedCommit = {
      sha: '539a39ae4abc',
      shortSha: '539a39ae4',
      subject: 'refactor(mobile): Migrate durationInSeconds to durationMs (#26615)',
      files: ['mobile/lib/infrastructure/repositories/db.repository.dart'],
      domains: ['mobile'],
      overlapFiles: ['mobile/lib/infrastructure/repositories/db.repository.dart'],
      features: ['mobile-app-and-branding'],
      risk: 'high',
      reasons: ['Matches risk pattern mobile-drift'],
      requiredChecks: ['mobile-drift-rebase-check'],
    };

    const markdown = renderPreflightMarkdown({
      date: '2026-05-04',
      mergeBase: 'f909648bc',
      upstreamShortStat: '852 files changed',
      forkShortStat: '2040 files changed',
      classifiedCommits: [commit],
      incomingCommits: [commit],
      forkFileCount: 2040,
      upstreamFileCount: 852,
      overlapFiles: ['mobile/lib/infrastructure/repositories/db.repository.dart'],
      domainOverlaps: [{ domain: 'mobile', files: ['mobile/lib/infrastructure/repositories/db.repository.dart'] }],
      featureOverlaps: [
        {
          feature: 'mobile-app-and-branding',
          commits: ['539a39ae4'],
          files: ['mobile/lib/infrastructure/repositories/db.repository.dart'],
        },
      ],
      dependencyChanges: ['pnpm-lock.yaml'],
      serverMigrationChanges: ['server/src/schema/migrations/1740000000000-Upstream.ts'],
      serverTableOverlaps: ['shared_spaces'],
      mobileDriftChanges: ['mobile/drift_schemas/main/drift_schema_v23.json'],
      ciWorkflowChanges: ['.github/workflows/test.yml'],
      broadRefactorHints: ['539a39ae4 touches 1 files and matches risk pattern mobile-drift'],
      batchMarkdown: '| Batch | Tip SHA | Commits | Risk | Why | Required Checks |',
      auditResults: [],
      extensionHotspots: [{ path: 'server/src/services/search.service.ts', hits: 4, features: ['shared-spaces'] }],
    });

    expect(markdown).toContain('# Upstream Preflight Report - 2026-05-04');
    expect(markdown).toContain('539a39ae4');
    expect(markdown).toContain('mobile-drift-rebase-check');
    expect(markdown).toContain('Fork Surface Reduction Signals');
    expect(markdown).toContain('server/src/services/search.service.ts');
    expect(markdown).toContain('Incoming Commit List');
    expect(markdown).toContain('Dependency And Lockfile Changes');
    expect(markdown).toContain('Server Migration Signals');
  });
});
```

- [x] **Step 2: Implement report renderer**

Create `tools/upstream-preflight/src/report.ts`:

```ts
import type { AuditResult, ClassifiedCommit } from './types';

export type ExtensionHotspot = {
  path: string;
  hits: number;
  features: string[];
};

export type DomainOverlap = {
  domain: string;
  files: string[];
};

export type FeatureOverlap = {
  feature: string;
  commits: string[];
  files: string[];
};

export type PreflightReportInput = {
  date: string;
  mergeBase: string;
  upstreamShortStat: string;
  forkShortStat: string;
  classifiedCommits: ClassifiedCommit[];
  incomingCommits: ClassifiedCommit[];
  forkFileCount: number;
  upstreamFileCount: number;
  overlapFiles: string[];
  domainOverlaps: DomainOverlap[];
  featureOverlaps: FeatureOverlap[];
  dependencyChanges: string[];
  serverMigrationChanges: string[];
  serverTableOverlaps: string[];
  mobileDriftChanges: string[];
  ciWorkflowChanges: string[];
  broadRefactorHints: string[];
  batchMarkdown: string;
  auditResults: AuditResult[];
  extensionHotspots: ExtensionHotspot[];
};

export function renderPreflightMarkdown(input: PreflightReportInput): string {
  const highRiskRows = input.classifiedCommits
    .filter((commit) => commit.risk === 'high')
    .sort(
      (left, right) =>
        right.overlapFiles.length - left.overlapFiles.length || right.reasons.length - left.reasons.length,
    )
    .map(
      (commit) =>
        `| \`${commit.shortSha}\` | ${commit.subject} | ${commit.domains.join(', ')} | ${commit.features.join(', ') || '-'} | ${commit.requiredChecks.join(', ') || '-'} | ${commit.reasons.join('; ')} |`,
    )
    .join('\n');
  const auditRows = input.auditResults
    .map((audit) => `| ${audit.ok ? 'OK' : 'ISSUE'} | ${audit.title} | ${audit.details.join('<br>')} |`)
    .join('\n');
  const hotspotRows = input.extensionHotspots
    .map((hotspot) => `| \`${hotspot.path}\` | ${hotspot.hits} | ${hotspot.features.join(', ')} |`)
    .join('\n');
  const incomingRows = input.incomingCommits
    .map(
      (commit) =>
        `| \`${commit.shortSha}\` | ${commit.subject} | ${commit.domains.join(', ') || '-'} | ${commit.risk.toUpperCase()} |`,
    )
    .join('\n');
  const domainRows = input.domainOverlaps
    .map(
      (overlap) =>
        `| ${overlap.domain} | ${overlap.files.length} | ${overlap.files.map((file) => `\`${file}\``).join('<br>')} |`,
    )
    .join('\n');
  const featureRows = input.featureOverlaps
    .map(
      (overlap) =>
        `| ${overlap.feature} | ${overlap.commits.join(', ')} | ${overlap.files.map((file) => `\`${file}\``).join('<br>')} |`,
    )
    .join('\n');
  const listOrNone = (items: string[]) =>
    items.length > 0 ? items.map((item) => `- \`${item}\``).join('\n') : '- None';

  return `# Upstream Preflight Report - ${input.date}

## Summary

- **Merge base**: \`${input.mergeBase}\`
- **Incoming upstream files**: ${input.upstreamFileCount}
- **Incoming upstream commits**: ${input.incomingCommits.length}
- **Fork delta files**: ${input.forkFileCount}
- **Direct overlap files**: ${input.overlapFiles.length}
- **Incoming upstream diff**: ${input.upstreamShortStat || 'no changes'}
- **Fork diff**: ${input.forkShortStat || 'no changes'}

## High-Risk Commits

| SHA | Subject | Domains | Features | Required Checks | Reasons |
| --- | --- | --- | --- | --- | --- |
${highRiskRows || '| - | None | - | - | - | - |'}

## Incoming Commit List

| SHA | Subject | Domains | Risk |
| --- | --- | --- | --- |
${incomingRows || '| - | None | - | - |'}

## Overlap By Domain

| Domain | Files | Paths |
| --- | ---: | --- |
${domainRows || '| - | 0 | - |'}

## Overlap By Manifest Feature

| Feature | Commits | Files |
| --- | --- | --- |
${featureRows || '| - | - | - |'}

## Dependency And Lockfile Changes

${listOrNone(input.dependencyChanges)}

## Server Migration Signals

${listOrNone(input.serverMigrationChanges)}

## Server Table Overlap Signals

${listOrNone(input.serverTableOverlaps)}

## Mobile Drift Signals

${listOrNone(input.mobileDriftChanges)}

## CI Workflow Signals

${listOrNone(input.ciWorkflowChanges)}

## Broad Refactor Hints

${input.broadRefactorHints.length > 0 ? input.broadRefactorHints.map((hint) => `- ${hint}`).join('\n') : '- None'}

## Audit Signals

| Status | Check | Details |
| --- | --- | --- |
${auditRows || '| OK | No audit signals | - |'}

## Recommended Batch Plan

${input.batchMarkdown}

## Fork Surface Reduction Signals

| Upstream Extension Path | Incoming Touch Count | Features |
| --- | ---: | --- |
${hotspotRows || '| - | 0 | - |'}
`;
}
```

- [x] **Step 3: Wire CLI commands**

Replace `tools/upstream-preflight/src/index.ts` with:

```ts
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import micromatch from 'micromatch';
import { Command } from 'commander';
import { planBatches, renderBatchMarkdown } from './batch';
import { collectGitRange, getGitPath, getMergeBase } from './git';
import { defaultManifestPath, loadManifest } from './manifest';
import { renderPreflightMarkdown } from './report';
import { classifyCommit, detectDomain } from './risk';
import type { ClassifiedCommit, Manifest } from './types';

const program = new Command()
  .name('gallery-upstream-preflight')
  .description('Gallery upstream rebase preflight and audit tooling');

function buildPreflightContext(manifestPath: string) {
  const manifest = loadManifest(manifestPath);
  const upstreamRef = `${manifest.metadata.upstream_remote}/${manifest.metadata.upstream_branch}`;
  const forkRef = manifest.metadata.fork_branch;
  const mergeBase = getMergeBase(process.cwd(), forkRef, upstreamRef);
  const upstreamRange = collectGitRange(process.cwd(), `${mergeBase}..${upstreamRef}`);
  const forkRange = collectGitRange(process.cwd(), `${mergeBase}..${forkRef}`);
  const classifiedCommits = upstreamRange.commits.map((commit) => classifyCommit(commit, manifest, forkRange.files));
  const overlapFiles = upstreamRange.files.filter((file) => forkRange.files.includes(file));
  const batchPlan = planBatches(classifiedCommits);
  const batchMarkdown = renderBatchMarkdown(batchPlan);

  return { manifest, mergeBase, upstreamRange, forkRange, classifiedCommits, overlapFiles, batchMarkdown };
}

function collectExtensionHotspots(manifest: Manifest, classifiedCommits: ClassifiedCommit[]) {
  const byPath = new Map<string, { path: string; hits: number; features: Set<string> }>();

  for (const [featureId, feature] of Object.entries(manifest.features)) {
    for (const extensionPath of feature.upstream_extension_paths ?? []) {
      const hits = classifiedCommits.filter((commit) => micromatch(commit.files, extensionPath)).length;
      if (hits === 0) continue;
      const existing = byPath.get(extensionPath) ?? { path: extensionPath, hits, features: new Set<string>() };
      existing.hits = Math.max(existing.hits, hits);
      existing.features.add(featureId);
      byPath.set(extensionPath, existing);
    }
  }

  return [...byPath.values()]
    .map((hotspot) => ({ path: hotspot.path, hits: hotspot.hits, features: [...hotspot.features].sort() }))
    .sort((left, right) => right.hits - left.hits)
    .slice(0, 20);
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

// Feature overlap reporting lives in signals.ts. It matches each commit's files
// against the feature surface and only reports feature-relevant paths.

function collectSignalFiles(files: string[], globs: string[]): string[] {
  return micromatch(files, globs).sort();
}

function collectServerTableOverlaps(manifest: Manifest, upstreamFiles: string[]) {
  const upstreamText = upstreamFiles.join('\n');
  const tables = Object.values(manifest.features).flatMap((feature) => feature.database?.tables ?? []);
  return [...new Set(tables)]
    .filter((table) => upstreamText.includes(table) || upstreamText.includes(table.replaceAll('_', '-')))
    .sort();
}

function collectBroadRefactorHints(commits: ClassifiedCommit[]): string[] {
  return commits
    .filter(
      (commit) => commit.files.length >= 25 || commit.reasons.some((reason) => reason.includes('breaking-refactor')),
    )
    .map((commit) => `${commit.shortSha} touches ${commit.files.length} files: ${commit.subject}`);
}

program
  .command('preflight')
  .option('--manifest <path>', 'ownership manifest path', defaultManifestPath)
  .option('--output-dir <path>', 'generated report directory')
  .action((options: { manifest: string; outputDir?: string }) => {
    const context = buildPreflightContext(options.manifest);
    const date = new Date().toISOString().slice(0, 10);
    const markdown = renderPreflightMarkdown({
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
      featureOverlaps: collectFeatureOverlaps(context.manifest, context.classifiedCommits),
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
      serverTableOverlaps: collectServerTableOverlaps(context.manifest, context.upstreamRange.files),
      mobileDriftChanges: collectSignalFiles(context.upstreamRange.files, [
        'mobile/lib/infrastructure/repositories/db.repository.dart',
        'mobile/drift_schemas/main/**',
      ]),
      ciWorkflowChanges: collectSignalFiles(context.upstreamRange.files, ['.github/workflows/**']),
      broadRefactorHints: collectBroadRefactorHints(context.classifiedCommits),
      batchMarkdown: context.batchMarkdown,
      auditResults: [],
      extensionHotspots: collectExtensionHotspots(context.manifest, context.classifiedCommits),
    });
    const outputDir = options.outputDir ?? getGitPath(process.cwd(), 'upstream-preflight');

    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, `preflight-${date}.md`), markdown);
    fs.writeFileSync(
      path.join(outputDir, 'preflight.json'),
      JSON.stringify({ mergeBase: context.mergeBase, classifiedCommits: context.classifiedCommits }, null, 2),
    );
    console.log(markdown);
  });

program
  .command('batch-plan')
  .option('--manifest <path>', 'ownership manifest path', defaultManifestPath)
  .action((options: { manifest: string }) => {
    console.log(buildPreflightContext(options.manifest).batchMarkdown);
  });

for (const command of ['postrebase-audit', 'mobile-drift-check', 'ci-invariants-check', 'fork-patches-check']) {
  program.command(command).action(() => {
    console.log(`${command} scaffold`);
  });
}

program.parse(process.argv);
```

- [x] **Step 4: Verify real reports and commit**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- report.spec.ts git.spec.ts risk.spec.ts batch.spec.ts
pnpm --filter @gallery/upstream-preflight run check
make upstream-preflight
make upstream-batch-plan
test -f "$(git rev-parse --git-path upstream-preflight/preflight.json)"
git status --short
git add tools/upstream-preflight/src/report.ts tools/upstream-preflight/src/report.spec.ts tools/upstream-preflight/src/index.ts
git commit -m "feat: generate upstream preflight and batch reports"
```

Expected: tests pass, type check passes, reports print Markdown, generated JSON exists under Git metadata, source status only shows intentional files before commit, and commit succeeds.

Implementation note: feature overlap reporting uses a helper in
`tools/upstream-preflight/src/signals.ts` and reports only files that match the
feature's owned, extension, mobile, database, symbol, or generated-artifact
surface, independent of whether the risk classifier attached the feature ID to
the commit. It must not add every file from a commit just because one file
matched the feature.
