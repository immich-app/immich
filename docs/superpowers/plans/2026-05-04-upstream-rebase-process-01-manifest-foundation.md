# Upstream Rebase Manifest Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the repo-owned upstream preflight package and the first full fork ownership manifest.

**Architecture:** This phase adds the TypeScript workspace package, Makefile entry points, shared manifest types, YAML parser, and seeded `docs/fork/ownership.yml`. Later phases consume these contracts without changing their public shape unless tests require it.

**Tech Stack:** TypeScript, commander, yaml, micromatch, Vitest, pnpm workspace, Makefile.

---

## File Structure

- Modify: `pnpm-workspace.yaml`
  - Adds `tools/upstream-preflight` to the workspace.
- Modify: `Makefile`
  - Adds stable operator targets for the CLI.
- Create: `tools/upstream-preflight/package.json`
  - Package metadata, scripts, dependencies.
- Create: `tools/upstream-preflight/tsconfig.json`
  - Strict TypeScript config that includes source, tests, and Vitest config.
- Create: `tools/upstream-preflight/vitest.config.ts`
  - Node test environment.
- Create: `tools/upstream-preflight/src/index.ts`
  - Initial commander CLI with scaffold commands.
- Create: `tools/upstream-preflight/src/types.ts`
  - Shared manifest, git, risk, batch, and audit types.
- Create: `tools/upstream-preflight/src/manifest.ts`
  - Manifest parser and loader.
- Create: `tools/upstream-preflight/src/manifest.spec.ts`
  - Parser coverage for all top-level manifest sections.
- Create: `tools/upstream-preflight/src/coverage.ts`
  - Fork diff coverage helper and CLI.
- Create: `tools/upstream-preflight/src/coverage.spec.ts`
  - Coverage checks for uncovered fork files and explicit migrations.
- Create: `docs/fork/ownership.yml`
  - Versioned fork ownership source of truth.

### Task 0: Current Fork Baseline

**Files:**

- Read: git remotes and fork diff

- [x] **Step 1: Refresh the local view of the fork**

Run:

```bash
git fetch origin main
git fetch upstream main
git status --short --branch
git rebase origin/main
git status --short --branch
git rev-parse origin/main
git rev-parse upstream/main
git diff --name-only upstream/main...origin/main | sort > /tmp/gallery-fork-files.txt
wc -l /tmp/gallery-fork-files.txt
git diff --shortstat upstream/main...origin/main
```

Expected at the time this plan was updated:

```text
## plan/upstream-rebase-process...origin/main [ahead N]
## plan/upstream-rebase-process...origin/main [ahead N]
919deb87a6477d5058e0fa7b3960d30de577b495
af39384efbe389740ab3b9df897291ab1e428535
2071 /tmp/gallery-fork-files.txt
 2071 files changed, 422347 insertions(+), 11594 deletions(-)
```

If `origin/main` has moved, use the new `git rev-parse origin/main` value for
`metadata.last_verified_fork_head` in Task 3. If either remote ref has moved,
regenerate `/tmp/gallery-fork-files.txt` before running the coverage check. Do
not leave a placeholder, `null`, or an older fork head in the committed
manifest.

### Task 1: Workspace Package Scaffold

**Files:**

- Modify: `pnpm-workspace.yaml`
- Modify: `Makefile`
- Create: `tools/upstream-preflight/package.json`
- Create: `tools/upstream-preflight/tsconfig.json`
- Create: `tools/upstream-preflight/vitest.config.ts`
- Create: `tools/upstream-preflight/src/index.ts`

- [x] **Step 1: Add workspace package**

Add this entry to `pnpm-workspace.yaml` under `packages`:

```yaml
- tools/upstream-preflight
```

- [x] **Step 2: Create package metadata**

Create `tools/upstream-preflight/package.json`:

```json
{
  "name": "@gallery/upstream-preflight",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "check": "tsc --noEmit",
    "format": "prettier --cache --check .",
    "format:fix": "prettier --cache --write --list-different .",
    "test": "vitest --run --passWithNoTests",
    "test:watch": "vitest",
    "preflight": "tsx src/index.ts preflight",
    "batch-plan": "tsx src/index.ts batch-plan",
    "postrebase-audit": "tsx src/index.ts postrebase-audit",
    "mobile-drift-check": "tsx src/index.ts mobile-drift-check",
    "ci-invariants-check": "tsx src/index.ts ci-invariants-check",
    "fork-patches-check": "tsx src/index.ts fork-patches-check"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "micromatch": "^4.0.8",
    "yaml": "^2.3.1"
  },
  "devDependencies": {
    "@types/micromatch": "^4.0.9",
    "@types/node": "^24.12.2",
    "prettier": "^3.7.4",
    "tsx": "^4.20.0",
    "typescript": "^6.0.0",
    "vitest": "^4.0.0"
  }
}
```

- [x] **Step 3: Create TypeScript config**

Create `tools/upstream-preflight/tsconfig.json`:

```json
{
  "compilerOptions": {
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "resolveJsonModule": true,
    "rootDir": ".",
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "target": "es2023",
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*.ts", "test/**/*.ts", "vitest.config.ts"]
}
```

- [x] **Step 4: Create Vitest config**

Create `tools/upstream-preflight/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
```

- [x] **Step 5: Create scaffold CLI**

Create `tools/upstream-preflight/src/index.ts`:

```ts
#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command()
  .name('gallery-upstream-preflight')
  .description('Gallery upstream rebase preflight and audit tooling');

for (const command of [
  'preflight',
  'batch-plan',
  'postrebase-audit',
  'mobile-drift-check',
  'ci-invariants-check',
  'fork-patches-check',
]) {
  program.command(command).action(() => {
    console.log(`${command} scaffold`);
  });
}

program.parse(process.argv);
```

- [x] **Step 6: Add Makefile targets**

Append this block near the existing rebase and e2e targets in `Makefile`:

```makefile
UPSTREAM_PREFLIGHT = pnpm --filter @gallery/upstream-preflight

.PHONY: upstream-preflight
upstream-preflight:
	$(UPSTREAM_PREFLIGHT) run preflight

.PHONY: upstream-batch-plan
upstream-batch-plan:
	$(UPSTREAM_PREFLIGHT) run batch-plan

.PHONY: upstream-postrebase-audit
upstream-postrebase-audit:
	$(UPSTREAM_PREFLIGHT) run postrebase-audit $(if $(BATCH),-- --batch $(BATCH),)

.PHONY: mobile-drift-rebase-check
mobile-drift-rebase-check:
	$(UPSTREAM_PREFLIGHT) run mobile-drift-check $(if $(BATCH),-- --batch $(BATCH),)

.PHONY: ci-invariants-check
ci-invariants-check:
	$(UPSTREAM_PREFLIGHT) run ci-invariants-check

.PHONY: fork-patches-check
fork-patches-check:
	$(UPSTREAM_PREFLIGHT) run fork-patches-check
```

- [x] **Step 7: Install and verify scaffold**

Run:

```bash
pnpm install --no-frozen-lockfile
make upstream-preflight
make upstream-batch-plan
pnpm --filter @gallery/upstream-preflight run check
pnpm --filter @gallery/upstream-preflight run test
```

Expected: Make targets print scaffold output, TypeScript check passes, and Vitest exits 0 with no tests.

- [x] **Step 8: Commit scaffold**

Run:

```bash
git add pnpm-workspace.yaml Makefile tools/upstream-preflight pnpm-lock.yaml
git commit -m "chore: scaffold upstream preflight tooling"
```

### Task 2: Manifest Types, Parser, And Coverage Helpers

**Files:**

- Modify: `tools/upstream-preflight/package.json`
- Modify: `Makefile`
- Create: `tools/upstream-preflight/src/types.ts`
- Create: `tools/upstream-preflight/src/manifest.ts`
- Create: `tools/upstream-preflight/src/manifest.spec.ts`
- Create: `tools/upstream-preflight/src/coverage.ts`
- Create: `tools/upstream-preflight/src/coverage.spec.ts`

- [x] **Step 1: Add shared types**

Create `tools/upstream-preflight/src/types.ts`:

```ts
export type RiskLevel = 'low' | 'medium' | 'high';
export type Domain = 'server' | 'web' | 'mobile' | 'database' | 'ci' | 'docs' | 'e2e' | 'ml' | 'config';

export type Manifest = {
  version: 1;
  metadata: {
    upstream_remote: string;
    upstream_branch: string;
    fork_remote: string;
    fork_branch: string;
    last_verified_fork_head: string;
  };
  features: Record<string, FeatureEntry>;
  checks?: Record<string, CheckEntry>;
  ci_invariants?: CiInvariant[];
  patches?: PackagePatch[];
  risk_patterns?: RiskPattern[];
  coverage_ignore?: string[];
};

export type FeatureEntry = {
  title: string;
  aliases?: string[];
  risk: RiskLevel;
  domains: Domain[];
  owned_paths?: string[];
  upstream_extension_paths?: string[];
  optional_paths?: string[];
  expected_symbols?: Record<string, string[]>;
  generated_artifacts?: string[];
  database?: {
    tables?: string[];
    migration_globs?: string[];
    expected_migrations?: string[];
  };
  mobile?: {
    drift_versions?: {
      owned: number[];
      shipped: boolean;
      owner: 'gallery';
      expected_callbacks?: Record<number, string[]>;
    };
    paths?: string[];
  };
  required_checks?: string[];
};

export type CheckEntry = {
  command: string;
  phase: 'preflight' | 'post-batch' | 'preflight-and-post-batch' | 'final';
  required_for_risk?: RiskLevel[];
  required_for_domains?: Domain[];
};

export type CiInvariant = {
  id: string;
  title: string;
  forbidden_patterns: string[];
  paths: string[];
  exceptions?: string[];
};

export type PackagePatch = {
  id: string;
  package: string;
  version_source: string;
  expected_patch: string;
  required_check: string;
};

export type RiskPattern = {
  id: string;
  risk: RiskLevel;
  subject_regex?: string;
  path_globs?: string[];
  notes: string;
};

export type GitCommit = {
  sha: string;
  shortSha: string;
  subject: string;
  files: string[];
};

export type ClassifiedCommit = GitCommit & {
  domains: Domain[];
  overlapFiles: string[];
  features: string[];
  risk: RiskLevel;
  reasons: string[];
  requiredChecks: string[];
};

export type BatchPlan = { batches: Batch[] };

export type Batch = {
  id: string;
  tipSha: string;
  commits: ClassifiedCommit[];
  risk: RiskLevel;
  why: string[];
  requiredChecks: string[];
};

export type AuditResult = {
  ok: boolean;
  title: string;
  details: string[];
};
```

- [x] **Step 2: Write parser test**

Create `tools/upstream-preflight/src/manifest.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseManifest } from './manifest';

const validManifest = `
version: 1
metadata:
  upstream_remote: upstream
  upstream_branch: main
  fork_remote: origin
  fork_branch: main
  last_verified_fork_head: 919deb87a6477d5058e0fa7b3960d30de577b495
features:
  shared-spaces:
    title: Shared Spaces
    aliases: [mobile-shared-space-drift-sync]
    risk: high
    domains: [server, web, mobile, database, e2e]
    owned_paths: [server/src/services/shared-space.service.ts]
    upstream_extension_paths: [server/src/services/search.service.ts]
    database:
      migration_globs: [server/src/schema/migrations-gallery/*SharedSpace*.ts]
      expected_migrations:
        - server/src/schema/migrations-gallery/1772230000000-CreateStorageMigrationLogTable.ts
    mobile:
      drift_versions:
        owned: [23, 24]
        shipped: true
        owner: gallery
    required_checks: [mobile-drift-rebase-check]
checks:
  mobile-drift-rebase-check:
    command: make mobile-drift-rebase-check
    phase: preflight-and-post-batch
ci_invariants:
  - id: no-push-o-matic
    title: No PUSH_O_MATIC
    forbidden_patterns: [PUSH_O_MATIC]
    paths: [.github/workflows/**/*.yml, .github/workflows/**/*.yaml]
patches:
  - id: immich-ui-command-patch
    package: '@immich/ui'
    version_source: pnpm-workspace.yaml
    expected_patch: patches/@immich__ui@0.76.2.patch
    required_check: mobile-drift-rebase-check
risk_patterns:
  - id: breaking-refactor
    risk: high
    subject_regex: 'refactor!'
    notes: Breaking upstream refactor
coverage_ignore:
  - docs/superpowers/**
`;

describe('parseManifest', () => {
  it('loads all manifest sections', () => {
    const manifest = parseManifest(validManifest);

    expect(manifest.features['shared-spaces'].aliases).toEqual(['mobile-shared-space-drift-sync']);
    expect(manifest.features['shared-spaces'].mobile?.drift_versions?.owned).toEqual([23, 24]);
    expect(manifest.features['shared-spaces'].database?.expected_migrations).toEqual([
      'server/src/schema/migrations-gallery/1772230000000-CreateStorageMigrationLogTable.ts',
    ]);
    expect(manifest.checks?.['mobile-drift-rebase-check'].command).toBe('make mobile-drift-rebase-check');
    expect(manifest.ci_invariants?.[0].id).toBe('no-push-o-matic');
    expect(manifest.patches?.[0].expected_patch).toBe('patches/@immich__ui@0.76.2.patch');
    expect(manifest.risk_patterns?.[0].id).toBe('breaking-refactor');
    expect(manifest.coverage_ignore).toEqual(['docs/superpowers/**']);
  });

  it('throws a useful error for unsupported versions', () => {
    expect(() => parseManifest('version: 2')).toThrow('Unsupported ownership manifest version: 2');
  });

  it('rejects invalid enum values', () => {
    expect(() => parseManifest(validManifest.replace('risk: high', 'risk: severe'))).toThrow(
      'Invalid risk for feature shared-spaces: severe',
    );
    expect(() =>
      parseManifest(validManifest.replace('domains: [server, web, mobile, database, e2e]', 'domains: [api]')),
    ).toThrow('Invalid domain for feature shared-spaces: api');
  });

  it('rejects duplicate aliases and missing checks', () => {
    expect(() =>
      parseManifest(validManifest.replace('aliases: [mobile-shared-space-drift-sync]', 'aliases: [shared-spaces]')),
    ).toThrow('Duplicate feature alias: shared-spaces');
    expect(() =>
      parseManifest(
        validManifest.replace('required_checks: [mobile-drift-rebase-check]', 'required_checks: [missing-check]'),
      ),
    ).toThrow('Feature shared-spaces references unknown check: missing-check');
  });

  it('rejects invalid patch and migration entries', () => {
    expect(() =>
      parseManifest(validManifest.replace('expected_patch: patches/@immich__ui@0.76.2.patch', 'expected_patch: 12')),
    ).toThrow('Patch immich-ui-command-patch must define expected_patch');
    expect(() =>
      parseManifest(
        validManifest.replace(
          '1772230000000-CreateStorageMigrationLogTable.ts',
          '1772230000000-CreateStorageMigrationLogTable.sql',
        ),
      ),
    ).toThrow('Expected migration for feature shared-spaces must be a TypeScript file');
  });
});
```

- [x] **Step 3: Implement parser**

Create `tools/upstream-preflight/src/manifest.ts`:

```ts
import fs from 'node:fs';
import YAML from 'yaml';
import type { CheckEntry, Domain, Manifest, RiskLevel } from './types';

export const defaultManifestPath = 'docs/fork/ownership.yml';

const validRisks = new Set<RiskLevel>(['low', 'medium', 'high']);
const validDomains = new Set<Domain>(['server', 'web', 'mobile', 'database', 'ci', 'docs', 'e2e', 'ml', 'config']);
const validCheckPhases = new Set<CheckEntry['phase']>(['preflight', 'post-batch', 'preflight-and-post-batch', 'final']);

export function parseManifest(source: string): Manifest {
  const value = YAML.parse(source) as unknown;
  const root = assertRecord(value, 'Ownership manifest must be a YAML object');

  if (root.version !== 1) {
    throw new Error(`Unsupported ownership manifest version: ${String(root.version)}`);
  }

  const metadata = assertRecord(root.metadata, 'Ownership manifest is missing metadata');
  for (const field of ['upstream_remote', 'upstream_branch', 'fork_remote', 'fork_branch', 'last_verified_fork_head']) {
    assertString(metadata[field], `Ownership manifest metadata must define ${field}`);
  }
  if (!/^[0-9a-f]{40}$/.test(metadata.last_verified_fork_head as string)) {
    throw new Error('Ownership manifest metadata last_verified_fork_head must be a full commit SHA');
  }

  const checks =
    root.checks === undefined ? undefined : assertRecord(root.checks, 'Ownership manifest checks must be a map');
  const checkIds = new Set(Object.keys(checks ?? {}));
  validateChecks(checks);

  const features = assertRecord(root.features, 'Ownership manifest must define features');
  if (Object.keys(features).length === 0) {
    throw new Error('Ownership manifest must define at least one feature');
  }
  validateFeatures(features, checkIds);

  validateCiInvariants(root.ci_invariants);
  validatePatches(root.patches, checkIds);
  validateRiskPatterns(root.risk_patterns);
  optionalStringArray(root.coverage_ignore, 'coverage_ignore');

  return root as Manifest;
}

function validateChecks(checks: Record<string, unknown> | undefined) {
  for (const [id, rawCheck] of Object.entries(checks ?? {})) {
    const check = assertRecord(rawCheck, `Check ${id} must be an object`);
    assertString(check.command, `Check ${id} must define command`);
    const phase = assertString(check.phase, `Check ${id} must define phase`);
    if (!validCheckPhases.has(phase as CheckEntry['phase'])) {
      throw new Error(`Invalid phase for check ${id}: ${phase}`);
    }
    validateRiskArray(check.required_for_risk, `Check ${id} required_for_risk`);
    validateOptionalDomainArray(check.required_for_domains, `Check ${id} required_for_domains`);
  }
}

function validateFeatures(features: Record<string, unknown>, checkIds: Set<string>) {
  const aliases = new Set(Object.keys(features));

  for (const [id, rawFeature] of Object.entries(features)) {
    const feature = assertRecord(rawFeature, `Feature ${id} must be an object`);
    assertString(feature.title, `Feature ${id} must define title`);

    const risk = assertString(feature.risk, `Feature ${id} must define risk`);
    if (!validRisks.has(risk as RiskLevel)) {
      throw new Error(`Invalid risk for feature ${id}: ${risk}`);
    }

    validateDomainArray(feature.domains, `Feature ${id} domains`);
    optionalStringArray(feature.owned_paths, `Feature ${id} owned_paths`);
    optionalStringArray(feature.upstream_extension_paths, `Feature ${id} upstream_extension_paths`);
    optionalStringArray(feature.optional_paths, `Feature ${id} optional_paths`);
    optionalStringArray(feature.generated_artifacts, `Feature ${id} generated_artifacts`);

    for (const alias of optionalStringArray(feature.aliases, `Feature ${id} aliases`) ?? []) {
      if (aliases.has(alias)) {
        throw new Error(`Duplicate feature alias: ${alias}`);
      }
      aliases.add(alias);
    }

    for (const checkId of optionalStringArray(feature.required_checks, `Feature ${id} required_checks`) ?? []) {
      if (!checkIds.has(checkId)) {
        throw new Error(`Feature ${id} references unknown check: ${checkId}`);
      }
    }

    const symbols = optionalRecord(feature.expected_symbols, `Feature ${id} expected_symbols`);
    for (const [path, expectedSymbols] of Object.entries(symbols ?? {})) {
      optionalStringArray(expectedSymbols, `Feature ${id} expected_symbols for ${path}`);
    }

    validateDatabase(feature.database, id);
    validateMobile(feature.mobile, id);
  }
}

function validateDatabase(value: unknown, featureId: string) {
  const database = optionalRecord(value, `Feature ${featureId} database`);
  if (!database) {
    return;
  }

  optionalStringArray(database.tables, `Feature ${featureId} database tables`);
  optionalStringArray(database.migration_globs, `Feature ${featureId} database migration_globs`);

  const migrations =
    optionalStringArray(database.expected_migrations, `Feature ${featureId} expected_migrations`) ?? [];
  const seen = new Set<string>();
  for (const migration of migrations) {
    if (!migration.endsWith('.ts')) {
      throw new Error(`Expected migration for feature ${featureId} must be a TypeScript file: ${migration}`);
    }
    if (seen.has(migration)) {
      throw new Error(`Duplicate expected migration for feature ${featureId}: ${migration}`);
    }
    seen.add(migration);
  }
}

function validateMobile(value: unknown, featureId: string) {
  const mobile = optionalRecord(value, `Feature ${featureId} mobile`);
  if (!mobile) {
    return;
  }

  optionalStringArray(mobile.paths, `Feature ${featureId} mobile paths`);
  const driftVersions = optionalRecord(mobile.drift_versions, `Feature ${featureId} mobile drift_versions`);
  if (!driftVersions) {
    return;
  }

  if (!Array.isArray(driftVersions.owned) || !driftVersions.owned.every((version) => Number.isInteger(version))) {
    throw new Error(`Feature ${featureId} mobile drift_versions owned must be integer versions`);
  }
  if (driftVersions.shipped !== true && driftVersions.shipped !== false) {
    throw new Error(`Feature ${featureId} mobile drift_versions shipped must be boolean`);
  }
  if (driftVersions.owner !== 'gallery') {
    throw new Error(`Feature ${featureId} mobile drift_versions owner must be gallery`);
  }
  const callbacks = optionalRecord(driftVersions.expected_callbacks, `Feature ${featureId} expected_callbacks`);
  for (const [version, names] of Object.entries(callbacks ?? {})) {
    optionalStringArray(names, `Feature ${featureId} expected_callbacks for ${version}`);
  }
}

function validateCiInvariants(value: unknown) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    throw new Error('ci_invariants must be an array');
  }
  for (const rawInvariant of value) {
    const invariant = assertRecord(rawInvariant, 'CI invariant must be an object');
    const id = assertString(invariant.id, 'CI invariant must define id');
    assertString(invariant.title, `CI invariant ${id} must define title`);
    stringArray(invariant.forbidden_patterns, `CI invariant ${id} forbidden_patterns`);
    stringArray(invariant.paths, `CI invariant ${id} paths`);
    optionalStringArray(invariant.exceptions, `CI invariant ${id} exceptions`);
  }
}

function validatePatches(value: unknown, checkIds: Set<string>) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    throw new Error('patches must be an array');
  }
  for (const rawPatch of value) {
    const patch = assertRecord(rawPatch, 'Patch must be an object');
    const id = assertString(patch.id, 'Patch must define id');
    assertString(patch.package, `Patch ${id} must define package`);
    assertString(patch.version_source, `Patch ${id} must define version_source`);
    assertString(patch.expected_patch, `Patch ${id} must define expected_patch`);
    const requiredCheck = assertString(patch.required_check, `Patch ${id} must define required_check`);
    if (!checkIds.has(requiredCheck)) {
      throw new Error(`Patch ${id} references unknown check: ${requiredCheck}`);
    }
  }
}

function validateRiskPatterns(value: unknown) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    throw new Error('risk_patterns must be an array');
  }
  for (const rawPattern of value) {
    const pattern = assertRecord(rawPattern, 'Risk pattern must be an object');
    const id = assertString(pattern.id, 'Risk pattern must define id');
    const risk = assertString(pattern.risk, `Risk pattern ${id} must define risk`);
    if (!validRisks.has(risk as RiskLevel)) {
      throw new Error(`Invalid risk for pattern ${id}: ${risk}`);
    }
    if (pattern.subject_regex !== undefined) {
      assertString(pattern.subject_regex, `Risk pattern ${id} subject_regex must be a string`);
    }
    optionalStringArray(pattern.path_globs, `Risk pattern ${id} path_globs`);
    if (pattern.subject_regex === undefined && pattern.path_globs === undefined) {
      throw new Error(`Risk pattern ${id} must define subject_regex or path_globs`);
    }
    assertString(pattern.notes, `Risk pattern ${id} must define notes`);
  }
}

function validateRiskArray(value: unknown, message: string) {
  for (const risk of optionalStringArray(value, message) ?? []) {
    if (!validRisks.has(risk as RiskLevel)) {
      throw new Error(`Invalid risk in ${message}: ${risk}`);
    }
  }
}

function validateDomainArray(value: unknown, message: string) {
  const domains = stringArray(value, message);
  if (domains.length === 0) {
    throw new Error(`${message} must define at least one domain`);
  }
  validateDomainValues(domains, message);
}

function validateOptionalDomainArray(value: unknown, message: string) {
  validateDomainValues(optionalStringArray(value, message) ?? [], message);
}

function validateDomainValues(domains: string[], message: string) {
  for (const domain of domains) {
    if (!validDomains.has(domain as Domain)) {
      const owner = message.replace(' domains', '').replace(/^Feature /, 'feature ');
      throw new Error(`Invalid domain for ${owner}: ${domain}`);
    }
  }
}

function stringArray(value: unknown, message: string): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`${message} must be a string array`);
  }
  return value;
}

function optionalStringArray(value: unknown, message: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  return stringArray(value, message);
}

function optionalRecord(value: unknown, message: string): Record<string, unknown> | undefined {
  if (value === undefined) {
    return undefined;
  }
  return assertRecord(value, message);
}

function assertRecord(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(message);
  }
  return value as Record<string, unknown>;
}

function assertString(value: unknown, message: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(message);
  }
  return value;
}

export function loadManifest(path = defaultManifestPath): Manifest {
  return parseManifest(fs.readFileSync(path, 'utf8'));
}
```

- [x] **Step 4: Add fork diff coverage helper**

Create `tools/upstream-preflight/src/coverage.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import micromatch from 'micromatch';
import { defaultManifestPath, loadManifest } from './manifest';
import type { FeatureEntry, Manifest } from './types';

const micromatchOptions = { dot: true };

export function manifestCoverageGlobs(manifest: Manifest): string[] {
  const globs = new Set<string>();

  for (const feature of Object.values(manifest.features)) {
    for (const glob of featureCoverageGlobs(feature)) {
      globs.add(glob);
    }
  }

  for (const invariant of manifest.ci_invariants ?? []) {
    for (const glob of invariant.paths) {
      globs.add(glob);
    }
    for (const exception of invariant.exceptions ?? []) {
      globs.add(exception);
    }
  }

  for (const patch of manifest.patches ?? []) {
    globs.add(patch.expected_patch);
    globs.add(patch.version_source);
  }

  return [...globs].sort();
}

export function findUncoveredFiles(files: string[], manifest: Manifest): string[] {
  const coverageGlobs = manifestCoverageGlobs(manifest);
  const ignoreGlobs = manifest.coverage_ignore ?? [];

  return files
    .filter((file) => !micromatch.isMatch(file, ignoreGlobs, micromatchOptions))
    .filter((file) => !micromatch.isMatch(file, coverageGlobs, micromatchOptions));
}

export function validateManifestForkHead(manifest: Manifest, expectedHead: string | undefined): string[] {
  if (!expectedHead) {
    return [];
  }

  if (manifest.metadata.last_verified_fork_head === expectedHead) {
    return [];
  }

  return [
    `Ownership manifest last_verified_fork_head ${manifest.metadata.last_verified_fork_head} does not match ${expectedHead}`,
  ];
}

export function runCoverageCli(argv = process.argv.slice(2)) {
  const options = parseCoverageArgs(argv);
  const { fileListPath, manifestPath, expectedHead } = options;
  if (!fileListPath) {
    throw new Error('Usage: tsx src/coverage.ts <fork-file-list> [manifest-path] [--expected-head <sha>]');
  }

  const manifest = loadManifest(resolveCliPath(manifestPath));
  const files = fs.readFileSync(resolveCliPath(fileListPath), 'utf8').split(/\r?\n/).filter(Boolean);
  const uncovered = findUncoveredFiles(files, manifest);
  const headErrors = validateManifestForkHead(manifest, expectedHead);

  if (uncovered.length > 0 || headErrors.length > 0) {
    for (const error of headErrors) {
      console.error(error);
    }
    if (uncovered.length > 0) {
      console.error(`Ownership manifest does not cover ${uncovered.length} fork files:`);
      for (const file of uncovered) {
        console.error(file);
      }
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Ownership manifest covers ${files.length} fork files`);
}

function resolveCliPath(inputPath: string) {
  return path.resolve(process.env.INIT_CWD ?? process.cwd(), inputPath);
}

function parseCoverageArgs(argv: string[]) {
  const args = argv[0] === '--' ? argv.slice(1) : argv;
  const positional: string[] = [];
  let expectedHead: string | undefined;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--expected-head') {
      if (!args[index + 1]) {
        throw new Error('--expected-head requires a commit SHA');
      }
      expectedHead = args[index + 1];
      index++;
      continue;
    }
    positional.push(arg);
  }

  return {
    fileListPath: positional[0],
    manifestPath: positional[1] ?? defaultManifestPath,
    expectedHead,
  };
}

function featureCoverageGlobs(feature: FeatureEntry): string[] {
  return [
    ...(feature.owned_paths ?? []),
    ...(feature.upstream_extension_paths ?? []),
    ...(feature.optional_paths ?? []),
    ...Object.keys(feature.expected_symbols ?? {}),
    ...(feature.generated_artifacts ?? []),
    ...(feature.database?.migration_globs ?? []),
    ...(feature.database?.expected_migrations ?? []),
    ...(feature.mobile?.paths ?? []),
  ];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCoverageCli();
}
```

- [x] **Step 5: Write coverage tests**

Create `tools/upstream-preflight/src/coverage.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { findUncoveredFiles, manifestCoverageGlobs, runCoverageCli, validateManifestForkHead } from './coverage';
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
      owned_paths: ['server/src/services/shared-space.service.ts'],
      database: {
        migration_globs: ['server/src/schema/migrations-gallery/*SharedSpace*.ts'],
        expected_migrations: ['server/src/schema/migrations-gallery/1772230000000-CreateStorageMigrationLogTable.ts'],
      },
    },
  },
  coverage_ignore: ['docs/superpowers/**'],
};

describe('fork ownership coverage', () => {
  it('reports files not covered by ownership globs', () => {
    expect(
      findUncoveredFiles(
        [
          'server/src/services/shared-space.service.ts',
          'server/src/schema/migrations-gallery/1772250000000-AddShowInTimelineToSharedSpaceMember.ts',
          'docs/superpowers/plans/scratch.md',
          'web/src/routes/(user)/photos/+page.svelte',
        ],
        manifest,
      ),
    ).toEqual(['web/src/routes/(user)/photos/+page.svelte']);
  });

  it('includes explicit expected migrations in coverage globs', () => {
    expect(manifestCoverageGlobs(manifest)).toContain(
      'server/src/schema/migrations-gallery/1772230000000-CreateStorageMigrationLogTable.ts',
    );
  });

  it('reports a stale manifest fork head', () => {
    expect(validateManifestForkHead(manifest, '0000000000000000000000000000000000000000')).toEqual([
      'Ownership manifest last_verified_fork_head 919deb87a6477d5058e0fa7b3960d30de577b495 does not match 0000000000000000000000000000000000000000',
    ]);
  });

  it('requires a value for the expected manifest fork head', () => {
    expect(() => runCoverageCli(['files.txt', '--expected-head'])).toThrow('--expected-head requires a commit SHA');
  });
});
```

- [x] **Step 6: Wire coverage script and Make target**

Add this script to `tools/upstream-preflight/package.json`:

```json
"coverage": "tsx src/coverage.ts"
```

Add this target near the other upstream preflight targets in `Makefile`:

```makefile
.PHONY: fork-ownership-coverage-check
fork-ownership-coverage-check:
	git diff --name-only upstream/main...origin/main | sort > /tmp/gallery-fork-files.txt
	$(UPSTREAM_PREFLIGHT) run coverage -- /tmp/gallery-fork-files.txt docs/fork/ownership.yml --expected-head "$$(git rev-parse origin/main)"
```

- [x] **Step 7: Verify parser and coverage helper**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- manifest.spec.ts coverage.spec.ts
pnpm --filter @gallery/upstream-preflight run check
```

Expected: both commands pass.

### Task 3: Seed Ownership Manifest

**Files:**

- Create: `docs/fork/ownership.yml`

- [x] **Step 1: Create manifest seed**

Create `docs/fork/ownership.yml`:

```yaml
version: 1

metadata:
  upstream_remote: upstream
  upstream_branch: main
  fork_remote: origin
  fork_branch: main
  last_verified_fork_head: 919deb87a6477d5058e0fa7b3960d30de577b495

coverage_ignore:
  - docs/superpowers/**

features:
  shared-spaces:
    title: Shared Spaces And Space Identity
    aliases:
      - mobile-spaces
      - mobile-shared-space-drift-sync
      - space-library-linking
      - bulk-add-to-spaces
      - space-activity-logging
      - collapsible-space-hero
      - space-person-dedup
      - duplicate-space-membership-sync
      - library-user-denormalization
      - global-face-identities
      - representative-face-source
    risk: high
    domains: [server, web, mobile, database, e2e]
    owned_paths:
      - server/src/services/shared-space.service.ts
      - server/src/controllers/shared-space.controller.ts
      - server/src/repositories/shared-space.repository.ts
      - server/src/dtos/shared-space*.dto.ts
      - server/src/schema/tables/shared-space*.ts
      - server/src/schema/tables/library-user.table.ts
      - server/src/queries/shared.space.repository.sql
      - web/src/routes/(user)/spaces/**
      - web/src/lib/components/spaces/**
      - mobile/lib/pages/library/spaces/**
      - mobile/lib/infrastructure/entities/shared_space*
      - mobile/lib/infrastructure/entities/library*
    upstream_extension_paths:
      - server/src/services/search.service.ts
      - server/src/repositories/search.repository.ts
      - server/src/repositories/sync.repository.ts
      - server/src/schema/functions.ts
      - web/src/routes/(user)/photos/**
      - web/src/routes/(user)/map/**
      - mobile/lib/domain/services/sync_stream.service.dart
      - mobile/lib/infrastructure/entities/merged_asset.drift
    database:
      tables:
        [
          shared_spaces,
          shared_space_members,
          shared_space_assets,
          shared_space_persons,
          shared_space_libraries,
          library_user,
        ]
      migration_globs:
        - server/src/schema/migrations-gallery/*SharedSpace*.ts
        - server/src/schema/migrations-gallery/*Space*.ts
        - server/src/schema/migrations-gallery/*Library*.ts
    mobile:
      drift_versions:
        owned: [23, 24]
        shipped: true
        owner: gallery
        expected_callbacks:
          23: [sharedSpaceEntity, sharedSpaceAssetEntity]
          24: [libraryEntity, sharedSpaceLibraryEntity]
      paths:
        - mobile/lib/infrastructure/repositories/db.repository.dart
        - mobile/drift_schemas/main/drift_schema_v23.json
        - mobile/drift_schemas/main/drift_schema_v24.json
    required_checks: [e2e-rebase-smoke, mobile-drift-rebase-check]

  storage-and-media:
    title: Storage Migration, Direct S3 Delivery, Import, And Media Edits
    aliases:
      - storage-migration
      - direct-s3-media-delivery
      - google-photos-import
      - google-takeout-zip-on-demand
      - image-editing
      - checksum-tombstone
      - switch-back-to-immich
    risk: high
    domains: [server, web, database, ci, e2e]
    owned_paths:
      - server/src/services/storage-migration.service.ts
      - server/src/controllers/storage-migration.controller.ts
      - server/src/backends/s3-storage.backend.ts
      - web/src/routes/admin/storage-migration/**
      - web/src/lib/components/import/**
      - web/src/lib/managers/import-manager.svelte.ts
      - web/src/lib/utils/google-takeout-*.ts
      - scripts/revert-to-immich.sql
      - .github/workflows/storage-migration*.yml
      - .github/workflows/gallery-revert-to-immich-validation.yml
    upstream_extension_paths:
      - server/src/services/media.service.ts
      - server/src/services/metadata.service.ts
      - server/src/services/auth.service.ts
      - server/src/services/user.service.ts
      - server/Dockerfile
      - e2e/docker-compose.yml
    database:
      tables: [storage_migration_log, asset_duplicate_checksums]
      migration_globs:
        - server/src/schema/migrations-gallery/*Storage*.ts
        - server/src/schema/migrations-gallery/*DuplicateChecksum*.ts
    required_checks: [storage-migration-tests, storage-migration-e2e]

  search-map-and-ui:
    title: Search, Filters, Maps, Command Palette, Memories, And Support UI
    aliases:
      - support-ui
      - global-search-command-palette
      - gallery-map-shared-photos
      - filter-panel
      - smart-search-main-timeline
      - space-search-sorting
      - dynamic-filter-suggestions
      - typed-search-filters
      - rule-based-memories
      - historic-memories
    risk: high
    domains: [server, web, mobile, e2e]
    owned_paths:
      - web/src/lib/components/filter-panel/**
      - web/src/lib/components/global-search/**
      - web/src/lib/managers/global-search*.ts
      - web/src/lib/managers/command*.ts
      - web/src/lib/utils/typed-search/**
      - web/src/lib/components/shared-components/side-bar/purchase-info.svelte
      - web/src/lib/components/shared-components/purchasing/purchase-content.svelte
      - server/src/controllers/gallery-map.controller.ts
      - server/src/dtos/gallery-map.dto.ts
      - mobile/lib/providers/map/map_marker.provider.dart
      - mobile/lib/services/map.service.dart
    upstream_extension_paths:
      - server/src/controllers/search.controller.ts
      - server/src/services/search.service.ts
      - server/src/repositories/search.repository.ts
      - server/src/dtos/search.dto.ts
      - server/src/queries/search.repository.sql
      - web/src/routes/(user)/photos/**
      - web/src/routes/(user)/map/**
      - web/src/routes/(user)/albums/**
      - web/src/routes/(user)/memories/**
      - patches/@immich__ui@*.patch
    required_checks: [e2e-rebase-smoke, fork-patches-check]

  ml-classification-and-observability:
    title: ML, Classification, Duplicates, Config Caching, And Metrics
    aliases:
      - pet-detection
      - auto-classification
      - video-duplicate-detection
      - clip-relevance-threshold
      - system-config-caching
      - prometheus-metrics
    risk: high
    domains: [server, ml, database]
    owned_paths:
      - machine-learning/immich_ml/models/pet_detection/**
      - server/src/services/pet-detection.service.ts
      - server/src/services/classification.service.ts
      - server/src/services/duplicate.service.ts
      - server/src/repositories/duplicate.repository.ts
    upstream_extension_paths:
      - server/src/config.ts
      - server/src/dtos/system-config.dto.ts
      - server/src/dtos/model-config.dto.ts
      - server/src/repositories/search.repository.ts
      - machine-learning/pyproject.toml
      - machine-learning/immich_ml/main.py
    database:
      tables: [person, shared_spaces, system_config, asset_duplicate_checksums]
      migration_globs:
        - server/src/schema/migrations-gallery/*Pet*.ts
        - server/src/schema/migrations-gallery/*Classification*.ts
        - server/src/schema/migrations-gallery/*Duplicate*.ts
    required_checks: [ci-invariants-check]

  mobile-app-and-branding:
    title: Mobile App, Branding, Deep Links, And Release Signing
    aliases:
      - mobile-photos-filter-sheet
      - mobile-map-markers
      - mobile-bottom-nav-design
      - mobile-deeplink-oauth-branding
      - mobile-ios-purpose-strings
      - mobile-release-signing
      - open-in-app-deeplink
      - branding
    risk: high
    domains: [mobile, web, ci, config]
    owned_paths:
      - mobile/lib/providers/photos_filter/**
      - mobile/lib/presentation/pages/photos_filter/**
      - mobile/lib/presentation/widgets/filter_sheet/**
      - mobile/lib/providers/gallery_nav/**
      - mobile/lib/presentation/widgets/gallery_nav/**
      - mobile/ios/Runner/Info.plist
      - branding/**
      - design/gallery-*
      - web/static/gallery-*
      - .github/actions/apply-branding/**
    upstream_extension_paths:
      - mobile/lib/routing/router.dart
      - mobile/lib/routing/router.gr.dart
      - mobile/lib/services/action.service.dart
      - mobile/lib/providers/websocket.provider.dart
      - web/src/routes/+layout.svelte
    required_checks: [mobile-drift-rebase-check, ci-invariants-check]

  release-ci-and-infrastructure:
    title: Release, CI, Infrastructure Detachment, Schema Functions, And Logging
    aliases:
      - user-groups
      - infrastructure-detachment
      - release-version-publishing
      - rc-build-workflow
      - split-mobile-server-release
      - environment-tagged-user-agent
      - fork-migration-compatibility
      - schema-functions
      - structured-json-logging
      - upstream-rebase-tooling
    risk: high
    domains: [ci, server, web, mobile, docs, config, database]
    owned_paths:
      - server/src/services/user-group.service.ts
      - server/src/controllers/user-group.controller.ts
      - server/src/schema/tables/user-group*.ts
      - web/src/lib/components/users/**
      - .github/workflows/gallery-*.yml
      - .github/workflows/storage-migration*.yml
      - .github/workflows/docs-build.yml
      - .github/workflows/docs-deploy.yml
      - server/src/schema/migrations-gallery/**
      - tools/upstream-preflight/**
    upstream_extension_paths:
      - .github/workflows/**
      - server/Dockerfile
      - web/Dockerfile
      - machine-learning/Dockerfile
      - docker/**
      - server/src/config.ts
      - server/src/utils/fetch.ts
      - server/src/schema/functions.ts
      - server/helmet.json
      - README.md
    database:
      tables: [user_groups, user_group_members]
      migration_globs:
        - server/src/schema/migrations-gallery/*.ts
      expected_migrations:
        - server/src/schema/migrations-gallery/1772230000000-CreateStorageMigrationLogTable.ts
        - server/src/schema/migrations-gallery/1772240000000-CreateSharedSpaceTables.ts
        - server/src/schema/migrations-gallery/1772250000000-AddShowInTimelineToSharedSpaceMember.ts
        - server/src/schema/migrations-gallery/1772260000000-AddThumbnailAssetIdToSharedSpace.ts
        - server/src/schema/migrations-gallery/1772270000000-AddColorToSharedSpace.ts
        - server/src/schema/migrations-gallery/1772782339000-AddPetDetectionColumns.ts
        - server/src/schema/migrations-gallery/1772790000000-AddLastActivityAtToSharedSpace.ts
        - server/src/schema/migrations-gallery/1772800000000-AddLastViewedAtToSharedSpaceMember.ts
        - server/src/schema/migrations-gallery/1772810000000-AddSharedSpaceActivityTable.ts
        - server/src/schema/migrations-gallery/1772815000000-AddThumbnailCropYToSharedSpace.ts
        - server/src/schema/migrations-gallery/1772820000000-AddSharedSpaceFaceRecognition.ts
        - server/src/schema/migrations-gallery/1773846750001-AddPersonNameTrigramIndex.ts
        - server/src/schema/migrations-gallery/1774215658876-AddSharedSpaceLibraryTable.ts
        - server/src/schema/migrations-gallery/1774300000000-CreateUserGroupTables.ts
        - server/src/schema/migrations-gallery/1775000000000-AddPetsEnabledToSharedSpace.ts
        - server/src/schema/migrations-gallery/1775100000000-AddAssetDuplicateChecksum.ts
        - server/src/schema/migrations-gallery/1775100000000-DropSpacePersonThumbnailPath.ts
        - server/src/schema/migrations-gallery/1776000000000-AddClassificationTables.ts
        - server/src/schema/migrations-gallery/1777000000000-AddSpacePersonCounts.ts
        - server/src/schema/migrations-gallery/1777000000000-AdminScopedClassification.ts
        - server/src/schema/migrations-gallery/1778000000000-MoveClassificationToConfig.ts
        - server/src/schema/migrations-gallery/1778100000000-SharedSpaceAuditTables.ts
        - server/src/schema/migrations-gallery/1778110000000-AddSharedSpaceMemberSyncColumns.ts
        - server/src/schema/migrations-gallery/1778120000000-AddSharedSpaceAssetSyncColumns.ts
        - server/src/schema/migrations-gallery/1778200000000-LibraryAuditTables.ts
        - server/src/schema/migrations-gallery/1778210000000-AddLibrarySyncColumns.ts
        - server/src/schema/migrations-gallery/1778300000000-AddLibraryUserTable.ts
        - server/src/schema/migrations-gallery/1778400000000-AddFaceIdentities.ts
        - server/src/schema/migrations-gallery/1778500000000-AddSpacePersonRepresentativeFaceSource.ts
    required_checks: [ci-invariants-check, fork-patches-check]

checks:
  e2e-rebase-smoke:
    command: make e2e-rebase-smoke
    phase: post-batch
    required_for_risk: [high]
  mobile-drift-rebase-check:
    command: make mobile-drift-rebase-check
    phase: preflight-and-post-batch
    required_for_domains: [mobile, database]
  ci-invariants-check:
    command: make ci-invariants-check
    phase: preflight-and-post-batch
    required_for_domains: [ci]
  fork-patches-check:
    command: make fork-patches-check
    phase: preflight-and-post-batch
    required_for_domains: [web, ci]
  storage-migration-tests:
    command: make test-server
    phase: post-batch
    required_for_domains: [server, database]
  storage-migration-e2e:
    command: make e2e-rebase-smoke
    phase: post-batch
    required_for_domains: [e2e]

ci_invariants:
  - id: no-push-o-matic
    title: No upstream PUSH_O_MATIC token dependency
    forbidden_patterns: [PUSH_O_MATIC, create-workflow-token]
    paths: [.github/workflows/**/*.yml, .github/workflows/**/*.yaml]
    exceptions:
      - .github/workflows/merge-translations.yml
  - id: gallery-release-image-names
    title: Gallery release workflows publish Gallery images
    forbidden_patterns:
      - ghcr.io/immich-app/immich-server
      - ghcr.io/immich-app/immich-web
      - ghcr.io/immich-app/immich-machine-learning
    paths: [.github/workflows/gallery-*.yml]
    exceptions: [.github/workflows/gallery-revert-to-immich-validation.yml]
  - id: gallery-docs-deploy-disabled-upstream
    title: Upstream docs deploy stays workflow_dispatch only
    forbidden_patterns: ['workflow_run:']
    paths: [.github/workflows/docs-deploy.yml]
    exceptions: []

patches:
  - id: immich-ui-command-patch
    package: '@immich/ui'
    version_source: pnpm-workspace.yaml
    expected_patch: patches/@immich__ui@0.76.2.patch
    required_check: fork-patches-check

risk_patterns:
  - id: breaking-refactor
    risk: high
    subject_regex: '(!:|refactor!)'
    notes: Breaking upstream refactor
  - id: mobile-drift
    risk: high
    path_globs:
      - mobile/lib/infrastructure/repositories/db.repository.dart
      - mobile/drift_schemas/main/**
    notes: Mobile Drift schema change
  - id: server-migration
    risk: high
    path_globs:
      - server/src/schema/migrations/**
      - server/src/schema/tables/**
    notes: Server schema change
  - id: openapi-generated
    risk: medium
    path_globs:
      - open-api/**
      - mobile/openapi/**
    notes: OpenAPI shape or generated client change
```

- [x] **Step 2: Verify required fork inventory strings are covered**

Run:

```bash
for id in shared-spaces storage-migration direct-s3-media-delivery pet-detection user-groups google-photos-import google-takeout-zip-on-demand image-editing auto-classification video-duplicate-detection clip-relevance-threshold support-ui global-search-command-palette gallery-map-shared-photos filter-panel smart-search-main-timeline space-library-linking bulk-add-to-spaces space-activity-logging collapsible-space-hero space-search-sorting dynamic-filter-suggestions space-person-dedup checksum-tombstone duplicate-space-membership-sync library-user-denormalization infrastructure-detachment release-version-publishing rc-build-workflow split-mobile-server-release switch-back-to-immich open-in-app-deeplink environment-tagged-user-agent system-config-caching global-face-identities representative-face-source typed-search-filters rule-based-memories historic-memories prometheus-metrics mobile-spaces mobile-shared-space-drift-sync mobile-photos-filter-sheet mobile-map-markers mobile-bottom-nav-design mobile-deeplink-oauth-branding mobile-ios-purpose-strings mobile-release-signing branding fork-migration-compatibility schema-functions structured-json-logging upstream-rebase-tooling; do
  rg -q "$id" docs/fork/ownership.yml || { echo "missing manifest feature or alias: $id"; exit 1; }
done
```

Expected: no output and exit 0.

- [x] **Step 3: Verify explicit migration inventory and fork file coverage**

Run:

```bash
find server/src/schema/migrations-gallery -type f -name '*.ts' | sort > /tmp/gallery-migrations.txt
rg -n "server/src/schema/migrations-gallery/[0-9]+-.+\\.ts" docs/fork/ownership.yml | wc -l
diff -u /tmp/gallery-migrations.txt <(rg -o "server/src/schema/migrations-gallery/[0-9]+-[^ ]+\\.ts" docs/fork/ownership.yml | sort -u)
git diff --name-only upstream/main...origin/main | sort > /tmp/gallery-fork-files.txt
make fork-ownership-coverage-check
git diff --name-only upstream/main...HEAD | sort > /tmp/gallery-branch-fork-files.txt
pnpm --filter @gallery/upstream-preflight run coverage -- /tmp/gallery-branch-fork-files.txt docs/fork/ownership.yml
test "$(sed -n 's/^  last_verified_fork_head: //p' docs/fork/ownership.yml)" = "$(git rev-parse origin/main)"
```

Expected:

```text
29
Ownership manifest covers 2071 fork files
Ownership manifest covers 2107 fork files
```

The branch coverage count can move as this plan changes; it must include
`tools/upstream-preflight/**` and exit 0.

If either remote ref moved in Task 0, the fork file count can differ. The
required outcome is still zero uncovered fork files for both `origin/main` and
the current phase branch, plus an exact manifest head match with
`git rev-parse origin/main`; add missing ownership globs or intentional
`coverage_ignore` entries before committing.

- [x] **Step 4: Compare against local skill inventory**

Run:

```bash
rg -n "Fork-Specific Features Checklist|Core Features|Secondary Features|### Mobile|### Infrastructure" /home/pierre/.codex/skills/rebase-upstream-report/SKILL.md
git log --oneline --no-merges ddc8c44cd..HEAD
```

Expected: all feature families in the old skill inventory are represented as feature IDs or aliases in `docs/fork/ownership.yml`.

- [x] **Step 5: Verify manifest and commit**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- manifest.spec.ts coverage.spec.ts
pnpm --filter @gallery/upstream-preflight run check
make fork-ownership-coverage-check
git add Makefile docs/fork/ownership.yml tools/upstream-preflight/package.json tools/upstream-preflight/src/types.ts tools/upstream-preflight/src/manifest.ts tools/upstream-preflight/src/manifest.spec.ts tools/upstream-preflight/src/coverage.ts tools/upstream-preflight/src/coverage.spec.ts
git commit -m "feat: add fork ownership manifest"
```

Expected: tests pass, type check passes, coverage reports zero uncovered fork files, and commit succeeds.
