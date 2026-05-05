# Upstream Rebase Audits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the post-batch and preflight audits that protect fork-owned behavior during upstream rebases.

**Architecture:** Audits are small TypeScript modules that return `AuditResult[]`. The CLI exposes each audit as an operator command and feeds their results into the preflight report.

**Tech Stack:** TypeScript, Node.js `fs/path`, micromatch, Vitest, Makefile.

---

## File Structure

- Create: `tools/upstream-preflight/src/audits/mobile-drift.ts`
  - Detects shipped Gallery mobile Drift version collisions and local schema consistency.
- Create: `tools/upstream-preflight/src/audits/mobile-drift.spec.ts`
  - Covers current v23/v24 collision behavior.
- Create: `tools/upstream-preflight/src/audits/ci-invariants.ts`
  - Checks manifest-defined forbidden workflow patterns.
- Create: `tools/upstream-preflight/src/audits/ci-invariants.spec.ts`
  - Covers exceptions and forbidden patterns.
- Create: `tools/upstream-preflight/src/audits/patches.ts`
  - Checks patched dependency metadata and patch files.
- Create: `tools/upstream-preflight/src/audits/patches.spec.ts`
  - Covers expected patch presence and missing patch failures.
- Create: `tools/upstream-preflight/src/audits/post-rebase.ts`
  - Checks fork-owned file survival and Gallery migration count/filenames.
- Create: `tools/upstream-preflight/src/audits/post-rebase.spec.ts`
  - Covers missing fork files and migration count/filename checks.
- Modify: `tools/upstream-preflight/src/index.ts`
  - Wires audit commands and includes audit signals in preflight.

### Task 1: Mobile Drift Audit

**Files:**

- Create: `tools/upstream-preflight/src/audits/mobile-drift.ts`
- Create: `tools/upstream-preflight/src/audits/mobile-drift.spec.ts`
- Modify: `tools/upstream-preflight/src/index.ts`

- [x] **Step 1: Add mobile Drift tests**

Create `tools/upstream-preflight/src/audits/mobile-drift.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { analyzeMobileDriftFiles } from './mobile-drift';

describe('analyzeMobileDriftFiles', () => {
  it('flags shipped Gallery version collisions with incoming upstream versions', () => {
    const result = analyzeMobileDriftFiles({
      galleryOwnedVersions: [23, 24],
      galleryVersionsShipped: true,
      currentDbRepository: `
        int get schemaVersion => 24;
        from22To23: (m, v23) async {}
        from23To24: (m, v24) async {}
      `,
      currentSnapshots: ['drift_schema_v22.json', 'drift_schema_v23.json', 'drift_schema_v24.json'],
      upstreamTouchedFiles: [
        'mobile/lib/infrastructure/repositories/db.repository.dart',
        'mobile/drift_schemas/main/drift_schema_v23.json',
        'mobile/drift_schemas/main/drift_schema_v24.json',
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.details.join('\n')).toContain('Upstream touches shipped Gallery Drift version v23');
    expect(result.details.join('\n')).toContain('renumber incoming upstream migrations to v25/v26');
  });

  it('passes when shipped Gallery versions are untouched and callbacks exist', () => {
    const result = analyzeMobileDriftFiles({
      galleryOwnedVersions: [23, 24],
      galleryVersionsShipped: true,
      currentDbRepository: `
        int get schemaVersion => 24;
        from22To23: (m, v23) async {}
        from23To24: (m, v24) async {}
      `,
      currentSnapshots: ['drift_schema_v22.json', 'drift_schema_v23.json', 'drift_schema_v24.json'],
      upstreamTouchedFiles: [],
    });

    expect(result.ok).toBe(true);
  });

  it('flags duplicate snapshots, missing snapshots, and missing callback markers', () => {
    const result = analyzeMobileDriftFiles({
      galleryOwnedVersions: [23],
      galleryVersionsShipped: true,
      expectedGalleryCallbacks: { 23: ['shared_space_entity'] },
      currentDbRepository: `
        int get schemaVersion => 24;
        from22To23: (m, v23) async {}
      `,
      currentSnapshots: ['drift_schema_v22.json', 'drift_schema_v22.json', 'drift_schema_v24.json'],
      upstreamTouchedFiles: [],
    });

    expect(result.ok).toBe(false);
    expect(result.details.join('\n')).toContain('Duplicate Drift snapshot version v22');
    expect(result.details.join('\n')).toContain('Missing Drift snapshot v23');
    expect(result.details.join('\n')).toContain('from22To23 is missing Gallery marker shared_space_entity');
  });
});
```

- [x] **Step 2: Implement mobile Drift audit**

Create `tools/upstream-preflight/src/audits/mobile-drift.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';
import type { AuditResult, Manifest } from '../types';

export type MobileDriftInput = {
  galleryOwnedVersions: number[];
  galleryVersionsShipped: boolean;
  currentDbRepository: string;
  currentSnapshots: string[];
  upstreamTouchedFiles: string[];
  expectedGalleryCallbacks?: Record<number, string[]>;
};

export function analyzeMobileDriftFiles(input: MobileDriftInput): AuditResult {
  const details: string[] = [];
  const schemaVersionMatch = input.currentDbRepository.match(/schemaVersion\s*=>\s*(\d+)/);
  const schemaVersion = schemaVersionMatch ? Number(schemaVersionMatch[1]) : undefined;
  const snapshotVersions = input.currentSnapshots
    .map((file) => file.match(/drift_schema_v(\d+)\.json/)?.[1])
    .filter((value): value is string => Boolean(value))
    .map(Number)
    .sort((left, right) => left - right);
  const highestSnapshot = snapshotVersions.at(-1);
  const lowestSnapshot = snapshotVersions[0];
  const snapshotCounts = new Map<number, number>();
  for (const version of snapshotVersions) {
    snapshotCounts.set(version, (snapshotCounts.get(version) ?? 0) + 1);
  }

  if (schemaVersion === undefined) details.push('Could not read mobile schemaVersion');
  if (highestSnapshot !== undefined && schemaVersion !== highestSnapshot) {
    details.push(`schemaVersion ${String(schemaVersion)} does not match highest snapshot v${highestSnapshot}`);
  }
  for (const [version, count] of snapshotCounts.entries()) {
    if (count > 1) details.push(`Duplicate Drift snapshot version v${version}`);
  }
  for (let version = lowestSnapshot ?? 1; version <= (schemaVersion ?? 0); version++) {
    if (!snapshotCounts.has(version)) details.push(`Missing Drift snapshot v${version}`);
  }

  for (const version of input.galleryOwnedVersions) {
    const upstreamTouchesVersion = input.upstreamTouchedFiles.some((file) =>
      file.includes(`drift_schema_v${version}.json`),
    );
    if (input.galleryVersionsShipped && upstreamTouchesVersion) {
      details.push(
        `Upstream touches shipped Gallery Drift version v${version}; keep Gallery v23/v24 and renumber incoming upstream migrations to v25/v26`,
      );
    }

    const expectedMarkers = input.expectedGalleryCallbacks?.[version] ?? [];
    const callbackName = `from${version - 1}To${version}`;
    if (!input.currentDbRepository.includes(callbackName)) {
      details.push(`Missing migration callback ${callbackName}`);
    }
    const callbackStart = input.currentDbRepository.indexOf(callbackName);
    const callbackText =
      callbackStart >= 0
        ? input.currentDbRepository.slice(
            callbackStart,
            input.currentDbRepository.indexOf('from', callbackStart + callbackName.length) >= 0
              ? input.currentDbRepository.indexOf('from', callbackStart + callbackName.length)
              : undefined,
          )
        : '';
    for (const marker of expectedMarkers) {
      if (!callbackText.includes(marker)) {
        details.push(`${callbackName} is missing Gallery marker ${marker}`);
      }
    }
  }

  return {
    ok: details.length === 0,
    title: 'Mobile Drift Migration Check',
    details:
      details.length > 0 ? details : ['Mobile Drift schemaVersion, snapshots, and Gallery callbacks are consistent'],
  };
}

export function runMobileDriftAudit(
  manifest: Manifest,
  upstreamTouchedFiles: string[],
  cwd = process.cwd(),
): AuditResult {
  const ownedVersions = Object.values(manifest.features).flatMap(
    (feature) => feature.mobile?.drift_versions?.owned ?? [],
  );
  const expectedGalleryCallbacks = Object.assign(
    {},
    ...Object.values(manifest.features).map((feature) => feature.mobile?.drift_versions?.expected_callbacks ?? {}),
  ) as Record<number, string[]>;
  const shipped = Object.values(manifest.features).some((feature) => feature.mobile?.drift_versions?.shipped);
  const repositoryPath = path.join(cwd, 'mobile/lib/infrastructure/repositories/db.repository.dart');
  const snapshotsPath = path.join(cwd, 'mobile/drift_schemas/main');

  return analyzeMobileDriftFiles({
    galleryOwnedVersions: [...new Set(ownedVersions)],
    galleryVersionsShipped: shipped,
    currentDbRepository: fs.existsSync(repositoryPath) ? fs.readFileSync(repositoryPath, 'utf8') : '',
    currentSnapshots: fs.existsSync(snapshotsPath) ? fs.readdirSync(snapshotsPath) : [],
    upstreamTouchedFiles,
    expectedGalleryCallbacks,
  });
}
```

- [x] **Step 3: Wire mobile command**

Modify `tools/upstream-preflight/src/index.ts`:

```ts
import { runMobileDriftAudit } from './audits/mobile-drift';
import { selectBatchAuditScope } from './batch';
```

Replace the scaffold `mobile-drift-check` command with:

```ts
program
  .command('mobile-drift-check')
  .option('--manifest <path>', 'ownership manifest path', defaultManifestPath)
  .option('--batch <id>', 'upstream batch id')
  .action((options: { manifest: string; batch?: string }) => {
    const batch = options.batch ?? process.env.BATCH;
    const context = buildPreflightContext(options.manifest);
    const auditScope = selectBatchAuditScope({
      batch,
      batchPlan: context.batchPlan,
      upstreamTouchedFiles: context.upstreamRange.files,
    });
    const result = runMobileDriftAudit(context.manifest, auditScope.upstreamTouchedFiles);
    console.log(`${result.ok ? 'OK' : 'ISSUE'}: ${result.title}`);
    for (const detail of result.details) console.log(`- ${detail}`);
    process.exitCode = result.ok ? 0 : 1;
  });
```

Remove `mobile-drift-check` from the scaffold-command loop so the command is not registered twice.

- [x] **Step 4: Verify and commit mobile audit**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- mobile-drift.spec.ts
pnpm --filter @gallery/upstream-preflight run check
make mobile-drift-rebase-check
make mobile-drift-rebase-check BATCH=01
git add tools/upstream-preflight/src/audits/mobile-drift.ts tools/upstream-preflight/src/audits/mobile-drift.spec.ts tools/upstream-preflight/src/index.ts
git commit -m "feat: audit mobile drift rebase collisions"
```

Expected: tests and type check pass. On the current upstream backlog,
unbatched `make mobile-drift-rebase-check` exits non-zero and reports the
shipped v23/v24 collision. `make mobile-drift-rebase-check BATCH=01` passes
when batch 01 does not touch those shipped Drift versions.

Implementation note: the real Gallery callbacks use generated camelCase entity
names, so the manifest markers are `sharedSpaceEntity`,
`sharedSpaceAssetEntity`, `libraryEntity`, and `sharedSpaceLibraryEntity`.
The mobile Drift audit also verifies every `fromNToN+1` callback in the current
snapshot range, so an appended upstream migration cannot leave a callback gap.

### Task 2: CI Invariant And Patch Audits

**Files:**

- Create: `tools/upstream-preflight/src/audits/ci-invariants.ts`
- Create: `tools/upstream-preflight/src/audits/ci-invariants.spec.ts`
- Create: `tools/upstream-preflight/src/audits/patches.ts`
- Create: `tools/upstream-preflight/src/audits/patches.spec.ts`
- Modify: `tools/upstream-preflight/src/index.ts`

- [x] **Step 1: Add CI invariant tests**

Create `tools/upstream-preflight/src/audits/ci-invariants.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { checkCiInvariantText } from './ci-invariants';

describe('checkCiInvariantText', () => {
  it('flags forbidden patterns outside exceptions', () => {
    const result = checkCiInvariantText(
      {
        id: 'no-push-o-matic',
        title: 'No PUSH_O_MATIC',
        forbidden_patterns: ['PUSH_O_MATIC', 'create-workflow-token'],
        paths: ['.github/workflows/**/*.yml', '.github/workflows/**/*.yaml'],
        exceptions: ['.github/workflows/merge-translations.yml'],
      },
      [
        { path: '.github/workflows/test.yaml', text: 'uses: create-workflow-token\nsecret: PUSH_O_MATIC_APP_ID' },
        { path: '.github/workflows/merge-translations.yml', text: 'PUSH_O_MATIC_APP_ID' },
      ],
    );

    expect(result.ok).toBe(false);
    expect(result.details).toEqual([
      '.github/workflows/test.yaml contains forbidden pattern PUSH_O_MATIC',
      '.github/workflows/test.yaml contains forbidden pattern create-workflow-token',
    ]);
  });
});
```

- [x] **Step 2: Implement CI invariant audit**

Create `tools/upstream-preflight/src/audits/ci-invariants.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';
import micromatch from 'micromatch';
import type { AuditResult, CiInvariant, Manifest } from '../types';

export type TextFile = { path: string; text: string };

export function checkCiInvariantText(invariant: CiInvariant, files: TextFile[]): AuditResult {
  const details: string[] = [];
  const matchedFiles = files.filter((file) => micromatch.isMatch(file.path, invariant.paths, { dot: true }));

  for (const file of matchedFiles) {
    if (invariant.exceptions && micromatch.isMatch(file.path, invariant.exceptions, { dot: true })) continue;
    for (const pattern of invariant.forbidden_patterns) {
      if (file.text.includes(pattern)) {
        details.push(`${file.path} contains forbidden pattern ${pattern}`);
      }
    }
  }

  return {
    ok: details.length === 0,
    title: invariant.title,
    details: details.length > 0 ? details : [`${invariant.id} passed`],
  };
}

export function runCiInvariantAudits(manifest: Manifest, cwd = process.cwd()): AuditResult[] {
  const workflowRoot = path.join(cwd, '.github/workflows');
  const files = fs.existsSync(workflowRoot)
    ? fs
        .readdirSync(workflowRoot)
        .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
        .map((file) => ({
          path: `.github/workflows/${file}`,
          text: fs.readFileSync(path.join(workflowRoot, file), 'utf8'),
        }))
    : [];

  return (manifest.ci_invariants ?? []).map((invariant) => checkCiInvariantText(invariant, files));
}
```

- [x] **Step 3: Add patch audit tests**

Create `tools/upstream-preflight/src/audits/patches.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { checkPackagePatchText } from './patches';

const patch = {
  id: 'immich-ui-command-patch',
  package: '@immich/ui',
  version_source: 'pnpm-workspace.yaml',
  expected_patch: 'patches/@immich__ui@0.76.2.patch',
  required_check: 'fork-patches-check',
};

describe('checkPackagePatchText', () => {
  it('passes when pnpm-workspace points at the expected patch', () => {
    const result = checkPackagePatchText(
      patch,
      "patchedDependencies:\n  '@immich/ui@0.76.2': patches/@immich__ui@0.76.2.patch\n",
      ['patches/@immich__ui@0.76.2.patch'],
    );

    expect(result.ok).toBe(true);
  });

  it('fails when the expected patch file is missing', () => {
    const result = checkPackagePatchText(
      patch,
      "patchedDependencies:\n  '@immich/ui@0.76.2': patches/@immich__ui@0.76.2.patch\n",
      [],
    );

    expect(result.ok).toBe(false);
    expect(result.details).toEqual(['Missing patch file patches/@immich__ui@0.76.2.patch']);
  });
});
```

- [x] **Step 4: Implement patch audit**

Create `tools/upstream-preflight/src/audits/patches.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';
import type { AuditResult, Manifest, PackagePatch } from '../types';

export function checkPackagePatchText(
  patch: PackagePatch,
  sourceText: string,
  existingPatchFiles: string[],
): AuditResult {
  const details: string[] = [];

  if (!sourceText.includes(patch.expected_patch)) {
    details.push(`${patch.version_source} does not reference ${patch.expected_patch}`);
  }

  if (!existingPatchFiles.includes(patch.expected_patch)) {
    details.push(`Missing patch file ${patch.expected_patch}`);
  }

  return {
    ok: details.length === 0,
    title: `Patch check: ${patch.package}`,
    details: details.length > 0 ? details : [`${patch.package} patch metadata is consistent`],
  };
}

export function runPatchAudits(manifest: Manifest, cwd = process.cwd()): AuditResult[] {
  const patchRoot = path.join(cwd, 'patches');
  const patchFiles = fs.existsSync(patchRoot) ? fs.readdirSync(patchRoot).map((file) => `patches/${file}`) : [];

  return (manifest.patches ?? []).map((patch) => {
    const sourcePath = path.join(cwd, patch.version_source);
    const sourceText = fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf8') : '';
    return checkPackagePatchText(patch, sourceText, patchFiles);
  });
}
```

- [x] **Step 5: Wire CI and patch commands**

Modify `tools/upstream-preflight/src/index.ts`:

```ts
import { runCiInvariantAudits } from './audits/ci-invariants';
import { runPatchAudits } from './audits/patches';
```

Add these commands:

```ts
program
  .command('ci-invariants-check')
  .option('--manifest <path>', 'ownership manifest path', defaultManifestPath)
  .action((options: { manifest: string }) => {
    const results = runCiInvariantAudits(loadManifest(resolveCliPath(options.manifest)), repoRoot());
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
    const results = runPatchAudits(loadManifest(resolveCliPath(options.manifest)), repoRoot());
    for (const result of results) {
      console.log(`${result.ok ? 'OK' : 'ISSUE'}: ${result.title}`);
      for (const detail of result.details) console.log(`- ${detail}`);
    }
    process.exitCode = results.every((result) => result.ok) ? 0 : 1;
  });
```

Remove these two command names from the scaffold-command loop so they are not registered twice.

- [x] **Step 6: Verify and commit CI and patch audits**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- ci-invariants.spec.ts patches.spec.ts
pnpm --filter @gallery/upstream-preflight run check
make ci-invariants-check
make fork-patches-check
git add tools/upstream-preflight/src/audits/ci-invariants.ts tools/upstream-preflight/src/audits/ci-invariants.spec.ts tools/upstream-preflight/src/audits/patches.ts tools/upstream-preflight/src/audits/patches.spec.ts tools/upstream-preflight/src/index.ts docs/fork/ownership.yml docs/superpowers/specs/2026-05-04-upstream-rebase-process-design.md docs/superpowers/plans/2026-05-04-upstream-rebase-process-01-manifest-foundation.md docs/superpowers/plans/2026-05-04-upstream-rebase-process-03-audits.md
git commit -m "feat: audit rebase ci invariants and patches"
```

Expected: tests and type check pass. `make fork-patches-check` passes. If `make ci-invariants-check` exits non-zero, the output names the exact workflow and forbidden string that must be fixed or excepted in the manifest.

Implementation note: the real repo has `.yaml` workflow files. The upstream
preview label workflow is disabled in Gallery rather than excepted because it
depends on upstream `PUSH_O_MATIC` tokens. The
`gallery-revert-to-immich-validation.yml` workflow remains excepted from the
Gallery image-name invariant because it intentionally boots upstream Immich
images during revert validation. The docs-deploy invariant checks
`workflow_run:` so inert references to `github.event.workflow_run` in the
disabled upstream workflow do not false positive.

### Task 3: Post-Rebase Audit

**Files:**

- Create: `tools/upstream-preflight/src/audits/post-rebase.ts`
- Create: `tools/upstream-preflight/src/audits/post-rebase.spec.ts`
- Modify: `tools/upstream-preflight/src/index.ts`

- [x] **Step 1: Add post-rebase tests**

Create `tools/upstream-preflight/src/audits/post-rebase.spec.ts`:

```ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  auditExtensionSymbols,
  auditExpectedMigrations,
  auditForkOwnedFiles,
  auditGeneratedArtifactSignals,
  auditMigrationCount,
  auditMigrationGlobs,
  auditMigrationTimestampCollisions,
  writePostRebaseAuditReport,
} from './post-rebase';
import type { Manifest } from '../types';

const manifest: Manifest = {
  version: 1,
  metadata: {
    upstream_remote: 'upstream',
    upstream_branch: 'main',
    fork_remote: 'origin',
    fork_branch: 'main',
    last_verified_fork_head: '0000000000000000000000000000000000000000',
  },
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
        migration_globs: ['server/src/schema/migrations-gallery/*SharedSpace*.ts'],
        expected_migrations: ['server/src/schema/migrations-gallery/1770000000000-SharedSpace.ts'],
      },
    },
  },
};

describe('auditForkOwnedFiles', () => {
  it('fails when a literal owned file is missing', () => {
    const result = auditForkOwnedFiles(manifest, ['server/src/services/search.service.ts']);

    expect(result.ok).toBe(false);
    expect(result.details).toEqual(['Missing fork-owned file server/src/services/shared-space.service.ts']);
  });
});

describe('auditMigrationCount', () => {
  it('reports the gallery migration count', () => {
    const result = auditMigrationCount(
      ['1778400000000-AddFaceIdentities.ts', '1778500000000-AddSpacePersonRepresentativeFaceSource.ts'],
      [
        'server/src/schema/migrations-gallery/1778400000000-AddFaceIdentities.ts',
        'server/src/schema/migrations-gallery/1778500000000-AddSpacePersonRepresentativeFaceSource.ts',
      ],
    );

    expect(result.ok).toBe(true);
    expect(result.details).toEqual(['Gallery migration count: 2 (expected 2)']);
  });

  it('fails when the count differs from manifest expectations', () => {
    const result = auditMigrationCount(
      ['1778400000000-AddFaceIdentities.ts'],
      [
        'server/src/schema/migrations-gallery/1778400000000-AddFaceIdentities.ts',
        'server/src/schema/migrations-gallery/1778500000000-AddSpacePersonRepresentativeFaceSource.ts',
      ],
    );

    expect(result.ok).toBe(false);
    expect(result.details).toEqual(['Gallery migration count: 1 (expected 2)']);
  });
});

describe('auditExpectedMigrations', () => {
  it('fails when a manifest expected migration is missing', () => {
    const result = auditExpectedMigrations(manifest, ['server/src/schema/migrations-gallery/1770000000000-Other.ts']);

    expect(result.ok).toBe(false);
    expect(result.details).toEqual([
      'Missing expected Gallery migration server/src/schema/migrations-gallery/1770000000000-SharedSpace.ts',
    ]);
  });
});

describe('auditExtensionSymbols', () => {
  it('fails when an expected symbol is missing from an extension path', () => {
    const result = auditExtensionSymbols(manifest, {
      'server/src/schema/functions.ts': 'create trigger unrelated',
    });

    expect(result.ok).toBe(false);
    expect(result.details).toEqual(['server/src/schema/functions.ts is missing expected symbol library_user']);
  });
});

describe('auditMigrationGlobs', () => {
  it('fails when a manifest migration glob has no matching file', () => {
    const result = auditMigrationGlobs(manifest, ['server/src/schema/migrations-gallery/1770000000000-Other.ts']);

    expect(result.ok).toBe(false);
    expect(result.details).toEqual([
      'No Gallery migration matches server/src/schema/migrations-gallery/*SharedSpace*.ts',
    ]);
  });
});

describe('auditMigrationTimestampCollisions', () => {
  it('fails when upstream and Gallery migrations share a timestamp', () => {
    const result = auditMigrationTimestampCollisions(
      ['server/src/schema/migrations-gallery/1770000000000-SharedSpace.ts'],
      ['server/src/schema/migrations/1770000000000-Upstream.ts'],
    );

    expect(result.ok).toBe(false);
    expect(result.details).toEqual(['Migration timestamp collision: 1770000000000']);
  });
});

describe('auditGeneratedArtifactSignals', () => {
  it('reports generated artifacts touched by upstream', () => {
    const result = auditGeneratedArtifactSignals(['open-api/typescript-sdk/index.ts']);

    expect(result.ok).toBe(false);
    expect(result.details).toEqual(['Review regenerated artifact open-api/typescript-sdk/index.ts']);
  });
});

describe('post-rebase audit reports', () => {
  it('writes batch markdown and json reports under the output directory', () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gallery-audit-'));
    const paths = writePostRebaseAuditReport(outputDir, {
      date: '2026-05-04',
      batch: '07',
      results: [{ ok: true, title: 'Fork-Owned File Survival', details: ['All literal fork-owned files are present'] }],
      upstreamTouchedFiles: ['server/src/services/search.service.ts'],
    });

    expect(path.basename(paths.markdownPath)).toBe('batch-07-postrebase-audit.md');
    expect(path.basename(paths.jsonPath)).toBe('batch-07-postrebase-audit.json');
  });
});
```

- [x] **Step 2: Implement post-rebase audit**

Create `tools/upstream-preflight/src/audits/post-rebase.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';
import micromatch from 'micromatch';
import type { AuditResult, Manifest } from '../types';

export function auditForkOwnedFiles(manifest: Manifest, currentFiles: string[]): AuditResult {
  const missing: string[] = [];

  for (const feature of Object.values(manifest.features)) {
    for (const file of feature.owned_paths ?? []) {
      if (file.includes('*')) continue;
      if (!currentFiles.includes(file)) {
        missing.push(`Missing fork-owned file ${file}`);
      }
    }
  }

  return {
    ok: missing.length === 0,
    title: 'Fork-Owned File Survival',
    details: missing.length > 0 ? missing : ['All literal fork-owned files are present'],
  };
}

export function auditMigrationCount(migrations: string[], expectedMigrations: string[] = []): AuditResult {
  const expectedCount = expectedMigrations.length;
  const details =
    expectedCount > 0
      ? [`Gallery migration count: ${migrations.length} (expected ${expectedCount})`]
      : [`Gallery migration count: ${migrations.length}`];

  return {
    ok: expectedCount === 0 || migrations.length === expectedCount,
    title: 'Gallery Migration Count',
    details,
  };
}

export function auditExpectedMigrations(manifest: Manifest, currentFiles: string[]): AuditResult {
  const expectedMigrations = [
    ...new Set(Object.values(manifest.features).flatMap((feature) => feature.database?.expected_migrations ?? [])),
  ].sort();
  const missing = expectedMigrations
    .filter((file) => !currentFiles.includes(file))
    .map((file) => `Missing expected Gallery migration ${file}`);

  return {
    ok: missing.length === 0,
    title: 'Gallery Migration Filename Survival',
    details: missing.length > 0 ? missing : ['All manifest expected migrations are present'],
  };
}

export function auditExtensionSymbols(manifest: Manifest, fileTextByPath: Record<string, string>): AuditResult {
  const details: string[] = [];

  for (const feature of Object.values(manifest.features)) {
    for (const [file, symbols] of Object.entries(feature.expected_symbols ?? {})) {
      const text = fileTextByPath[file] ?? '';
      for (const symbol of symbols) {
        if (!text.includes(symbol)) {
          details.push(`${file} is missing expected symbol ${symbol}`);
        }
      }
    }
  }

  return {
    ok: details.length === 0,
    title: 'Fork Extension Symbol Survival',
    details: details.length > 0 ? details : ['All manifest expected symbols are present'],
  };
}

export function auditMigrationGlobs(manifest: Manifest, currentFiles: string[]): AuditResult {
  const details: string[] = [];

  for (const feature of Object.values(manifest.features)) {
    for (const glob of feature.database?.migration_globs ?? []) {
      if (micromatch(currentFiles, glob).length === 0) {
        details.push(`No Gallery migration matches ${glob}`);
      }
    }
  }

  return {
    ok: details.length === 0,
    title: 'Gallery Migration Manifest Coverage',
    details: details.length > 0 ? details : ['All manifest migration globs match current files'],
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
    .filter((value): value is string => Boolean(value) && galleryTimestamps.has(value))
    .map((timestamp) => `Migration timestamp collision: ${timestamp}`);

  return {
    ok: details.length === 0,
    title: 'Migration Timestamp Collision Check',
    details:
      details.length > 0 ? [...new Set(details)] : ['No upstream migration timestamp collides with Gallery migrations'],
  };
}

export function auditGeneratedArtifactSignals(upstreamTouchedFiles: string[]): AuditResult {
  const generatedFiles = micromatch(upstreamTouchedFiles, [
    'open-api/**',
    'mobile/openapi/**',
    'server/src/queries/**/*.sql',
  ]);
  return {
    ok: generatedFiles.length === 0,
    title: 'Generated Artifact Review',
    details:
      generatedFiles.length > 0
        ? generatedFiles.map((file) => `Review regenerated artifact ${file}`)
        : ['No upstream generated artifact changes require review'],
  };
}

export function runPostRebaseAudits(
  manifest: Manifest,
  upstreamTouchedFiles: string[] = [],
  cwd = process.cwd(),
): AuditResult[] {
  const currentFiles = listFiles(cwd);
  const migrationRoot = path.join(cwd, 'server/src/schema/migrations-gallery');
  const migrations = fs.existsSync(migrationRoot)
    ? fs.readdirSync(migrationRoot).filter((file) => file.endsWith('.ts'))
    : [];
  const galleryMigrationPaths = migrations.map((file) => `server/src/schema/migrations-gallery/${file}`);
  const expectedMigrations = [
    ...new Set(Object.values(manifest.features).flatMap((feature) => feature.database?.expected_migrations ?? [])),
  ].sort();
  const textPaths = Object.values(manifest.features).flatMap((feature) => Object.keys(feature.expected_symbols ?? {}));
  const fileTextByPath = Object.fromEntries(
    textPaths.map((file) => {
      const fullPath = path.join(cwd, file);
      return [file, fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : ''];
    }),
  );
  const upstreamMigrations = micromatch(upstreamTouchedFiles, ['server/src/schema/migrations/**/*.ts']);

  return [
    auditForkOwnedFiles(manifest, currentFiles),
    auditExtensionSymbols(manifest, fileTextByPath),
    auditMigrationCount(migrations, expectedMigrations),
    auditExpectedMigrations(manifest, currentFiles),
    auditMigrationGlobs(manifest, currentFiles),
    auditMigrationTimestampCollisions(galleryMigrationPaths, upstreamMigrations),
    auditGeneratedArtifactSignals(upstreamTouchedFiles),
  ];
}

export function renderPostRebaseAuditMarkdown(input: {
  date: string;
  batch?: string;
  results: AuditResult[];
  upstreamTouchedFiles: string[];
}): string {
  const rows = input.results
    .map((result) => `| ${result.ok ? 'OK' : 'ISSUE'} | ${result.title} | ${result.details.join('<br>')} |`)
    .join('\n');
  const touchedFiles =
    input.upstreamTouchedFiles.length > 0
      ? input.upstreamTouchedFiles.map((file) => `- \`${file}\``).join('\n')
      : '- None';
  const title = input.batch ? `Upstream Post-Rebase Audit - Batch ${input.batch}` : 'Upstream Post-Rebase Audit';

  return `# ${title}

- **Date**: ${input.date}
- **Status**: ${input.results.every((result) => result.ok) ? 'OK' : 'ISSUE'}

## Audit Results

| Status | Check | Details |
| --- | --- | --- |
${rows || '| OK | No audit results | - |'}

## Upstream Touched Files

${touchedFiles}
`;
}

export function writePostRebaseAuditReport(
  outputDir: string,
  input: { date: string; batch?: string; results: AuditResult[]; upstreamTouchedFiles: string[] },
) {
  fs.mkdirSync(outputDir, { recursive: true });
  const basename = input.batch ? `batch-${input.batch}-postrebase-audit` : `postrebase-audit-${input.date}`;
  const markdownPath = path.join(outputDir, `${basename}.md`);
  const jsonPath = path.join(outputDir, `${basename}.json`);

  fs.writeFileSync(markdownPath, renderPostRebaseAuditMarkdown(input));
  fs.writeFileSync(jsonPath, JSON.stringify({ ...input, ok: input.results.every((result) => result.ok) }, null, 2));

  return { markdownPath, jsonPath };
}

function listFiles(cwd: string): string[] {
  const files: string[] = [];
  const ignored = new Set(['.git', 'node_modules', '.svelte-kit', 'dist', 'build']);
  const ignoredGlobs = ['.claude/**', '.worktrees/**', 'docker/library/**'];

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
      const relativePath = path.relative(cwd, fullPath).replaceAll(path.sep, '/');
      if (micromatch.isMatch(relativePath, ignoredGlobs)) continue;
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
```

- [x] **Step 3: Wire post-rebase command**

Modify `tools/upstream-preflight/src/index.ts`:

```ts
import { runPostRebaseAudits, writePostRebaseAuditReport } from './audits/post-rebase';
import { selectBatchAuditScope } from './batch';
```

Add this command:

```ts
program
  .command('postrebase-audit')
  .option('--manifest <path>', 'ownership manifest path', defaultManifestPath)
  .option('--batch <id>', 'upstream batch id')
  .option('--output-dir <path>', 'post-rebase audit output directory')
  .action((options: { manifest: string; batch?: string; outputDir?: string }) => {
    const batch = options.batch ?? process.env.BATCH;
    const context = buildPreflightContext(options.manifest);
    const auditScope = selectBatchAuditScope({
      batch,
      batchPlan: context.batchPlan,
      upstreamTouchedFiles: context.upstreamRange.files,
    });
    const results = runPostRebaseAudits(context.manifest, auditScope.upstreamTouchedFiles, repoRoot());
    for (const result of results) {
      console.log(`${result.ok ? 'OK' : 'ISSUE'}: ${result.title}`);
      for (const detail of result.details) console.log(`- ${detail}`);
    }
    if (batch || options.outputDir) {
      const outputDir = options.outputDir
        ? resolveCliPath(options.outputDir)
        : path.join(getGitPath(process.cwd(), 'upstream-preflight'), 'batches');
      writePostRebaseAuditReport(outputDir, {
        date: new Date().toISOString().slice(0, 10),
        batch: auditScope.batch,
        results,
        upstreamTouchedFiles: auditScope.upstreamTouchedFiles,
      });
    }
    process.exitCode = results.every((result) => result.ok) ? 0 : 1;
  });
```

Remove `postrebase-audit` from the scaffold-command loop.

- [x] **Step 4: Verify and commit post-rebase audit**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- post-rebase.spec.ts
pnpm --filter @gallery/upstream-preflight run check
make upstream-postrebase-audit
make upstream-postrebase-audit BATCH=01
git add tools/upstream-preflight/src/audits/post-rebase.ts tools/upstream-preflight/src/audits/post-rebase.spec.ts tools/upstream-preflight/src/index.ts docs/superpowers/plans/2026-05-04-upstream-rebase-process-03-audits.md
git commit -m "feat: audit fork survival after upstream rebase"
```

Expected: tests and type check pass. The real audit prints fork-owned file
survival and Gallery migration count/filename checks. On the current upstream
backlog, `make upstream-postrebase-audit` exits non-zero only because upstream
touches generated OpenAPI/mobile client/SQL artifacts that require explicit
review after the affected batch. `make upstream-postrebase-audit BATCH=01`
also writes batch audit markdown and JSON under
`$(git rev-parse --git-path upstream-preflight)/batches/`, with generated
artifact and migration-collision signals limited to batch 01's planned commits.

### Task 4: Include Audits In Preflight

**Files:**

- Modify: `tools/upstream-preflight/src/index.ts`
- Modify: `tools/upstream-preflight/src/report.spec.ts`

- [x] **Step 1: Expand report test**

Modify `tools/upstream-preflight/src/report.spec.ts` so the existing render test passes this audit result:

```ts
auditResults: [
  {
    ok: false,
    title: 'Mobile Drift Migration Check',
    details: ['Upstream touches shipped Gallery Drift version v23'],
  },
],
```

Add this assertion:

```ts
expect(markdown).toContain('Mobile Drift Migration Check');
```

- [x] **Step 2: Feed audit signals into preflight**

In the `preflight` action inside `tools/upstream-preflight/src/index.ts`, replace `auditResults: []` with:

```ts
auditResults: [
  runMobileDriftAudit(context.manifest, context.upstreamRange.files, repoRoot()),
  ...runCiInvariantAudits(context.manifest, repoRoot()),
  ...runPatchAudits(context.manifest, repoRoot()),
],
```

- [x] **Step 3: Verify and commit integrated audits**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test
pnpm --filter @gallery/upstream-preflight run check
make upstream-preflight
git add tools/upstream-preflight/src/index.ts tools/upstream-preflight/src/report.spec.ts
git commit -m "feat: include audits in upstream preflight"
```

Expected: tests and type check pass. `make upstream-preflight` prints audit signals, high-risk commits, batch plan, and fork surface reduction signals.
