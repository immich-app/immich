# Fork Migration Compatibility Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the Immich-to-Gallery migration crash by separating fork migrations into their own directory and using a composite migration provider with unordered migration support.

**Architecture:** A `CompositeMigrationProvider` merges two `FileMigrationProvider` instances (upstream `migrations/` + fork `migrations-gallery/`) into a single `Record<string, Migration>`. Kysely's `allowUnorderedMigrations: true` handles interleaved timestamps. See `docs/plans/2026-03-22-fork-migration-compatibility-design.md` for full design.

**Tech Stack:** Kysely (migration framework), Vitest (testing), NestJS (server framework)

---

### Task 1: Fix duplicate timestamp in fork migrations

The file `1772810000000-AddThumbnailCropYToSharedSpace.ts` shares a timestamp with
`1772810000000-AddSharedSpaceActivityTable.ts`. Since migration names are used as keys in
`Record<string, Migration>`, one will silently overwrite the other. Fix this before moving files.

**Files:**

- Rename: `server/src/schema/migrations/1772810000000-AddThumbnailCropYToSharedSpace.ts` to `server/src/schema/migrations/1772815000000-AddThumbnailCropYToSharedSpace.ts`

**Step 1: Verify the duplicate**

Run: `ls server/src/schema/migrations/1772810000000-*.ts`
Expected: Two files listed.

**Step 2: Rename the file**

```bash
git mv server/src/schema/migrations/1772810000000-AddThumbnailCropYToSharedSpace.ts \
       server/src/schema/migrations/1772815000000-AddThumbnailCropYToSharedSpace.ts
```

**Step 3: Verify no other references to the old name**

Run: `grep -r "1772810000000-AddThumbnailCropY" server/src/`
Expected: No matches.

**Step 4: Commit**

```bash
git add -A server/src/schema/migrations/
git commit -m "fix(server): rename duplicate timestamp migration 1772810000000-AddThumbnailCropY to 1772815000000"
```

---

### Task 2: Create CompositeMigrationProvider with tests (TDD)

Write the provider class and its test file. Tests first.

**Files:**

- Create: `server/src/schema/composite-migration-provider.ts`
- Create: `server/src/schema/composite-migration-provider.spec.ts`

**Step 1: Write the test file**

Create `server/src/schema/composite-migration-provider.spec.ts`:

```typescript
import { Migration } from 'kysely';
import { CompositeMigrationProvider } from 'src/schema/composite-migration-provider';

// Mock FileMigrationProvider to avoid filesystem access
vi.mock('kysely', async () => {
  const actual = await vi.importActual('kysely');
  return {
    ...actual,
    FileMigrationProvider: vi.fn(),
  };
});

import { FileMigrationProvider } from 'kysely';

const mockMigration = (name: string): Migration => ({
  up: vi.fn().mockResolvedValue(undefined),
  down: vi.fn().mockResolvedValue(undefined),
});

const setupMockProviders = (folders: Record<string, Record<string, Migration>>) => {
  const MockFMP = vi.mocked(FileMigrationProvider);
  MockFMP.mockImplementation((_props: any) => {
    // We need to track which folder this instance is for
    const instance = {
      getMigrations: vi.fn(),
    };
    return instance as any;
  });

  // We need a different approach: mock at the provider level
  MockFMP.mockReset();
  const folderList = Object.keys(folders);
  let callIndex = 0;
  MockFMP.mockImplementation(() => {
    const folder = folderList[callIndex++];
    return {
      getMigrations: vi.fn().mockResolvedValue(folders[folder] ?? {}),
    } as any;
  });
};

describe('CompositeMigrationProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Merges migrations from two folders
  it('should merge migrations from multiple folders into a single record', async () => {
    const upstreamMigrations = {
      '1744910873969-InitialMigration': mockMigration('initial'),
      '1772609167000-UpdateOpusCodecName': mockMigration('opus'),
    };
    const forkMigrations = {
      '1772230000000-CreateStorageMigrationLogTable': mockMigration('storage'),
      '1772240000000-CreateSharedSpaceTables': mockMigration('spaces'),
    };
    setupMockProviders({ upstream: upstreamMigrations, fork: forkMigrations });

    const provider = new CompositeMigrationProvider(['upstream', 'fork']);
    const result = await provider.getMigrations();

    expect(Object.keys(result)).toHaveLength(4);
    expect(result).toHaveProperty('1744910873969-InitialMigration');
    expect(result).toHaveProperty('1772609167000-UpdateOpusCodecName');
    expect(result).toHaveProperty('1772230000000-CreateStorageMigrationLogTable');
    expect(result).toHaveProperty('1772240000000-CreateSharedSpaceTables');
  });

  // Test 2: Empty fork folder
  it('should handle empty fork folder', async () => {
    const upstreamMigrations = {
      '1744910873969-InitialMigration': mockMigration('initial'),
    };
    setupMockProviders({ upstream: upstreamMigrations, fork: {} });

    const provider = new CompositeMigrationProvider(['upstream', 'fork']);
    const result = await provider.getMigrations();

    expect(Object.keys(result)).toHaveLength(1);
    expect(result).toHaveProperty('1744910873969-InitialMigration');
  });

  // Test 3: Empty upstream folder
  it('should handle empty upstream folder', async () => {
    const forkMigrations = {
      '1772230000000-CreateStorageMigrationLogTable': mockMigration('storage'),
    };
    setupMockProviders({ upstream: {}, fork: forkMigrations });

    const provider = new CompositeMigrationProvider(['upstream', 'fork']);
    const result = await provider.getMigrations();

    expect(Object.keys(result)).toHaveLength(1);
    expect(result).toHaveProperty('1772230000000-CreateStorageMigrationLogTable');
  });

  // Test 4: Both folders empty
  it('should handle both folders empty', async () => {
    setupMockProviders({ upstream: {}, fork: {} });

    const provider = new CompositeMigrationProvider(['upstream', 'fork']);
    const result = await provider.getMigrations();

    expect(Object.keys(result)).toHaveLength(0);
  });

  // Test 5: Duplicate migration name — last folder wins
  it('should use the last folder migration when names collide', async () => {
    const upstreamVersion = mockMigration('upstream-version');
    const forkVersion = mockMigration('fork-version');
    setupMockProviders({
      upstream: { 'same-name': upstreamVersion },
      fork: { 'same-name': forkVersion },
    });

    const provider = new CompositeMigrationProvider(['upstream', 'fork']);
    const result = await provider.getMigrations();

    expect(Object.keys(result)).toHaveLength(1);
    expect(result['same-name']).toBe(forkVersion);
  });

  // Test 6: Migration functions are callable
  it('should return migrations with callable up and down functions', async () => {
    const migration = mockMigration('test');
    setupMockProviders({ upstream: { 'test-migration': migration }, fork: {} });

    const provider = new CompositeMigrationProvider(['upstream', 'fork']);
    const result = await provider.getMigrations();

    expect(result['test-migration'].up).toBeTypeOf('function');
    expect(result['test-migration'].down).toBeTypeOf('function');
  });

  // Test 13: Interleaved timestamps merge correctly
  it('should merge interleaved timestamps from both folders', async () => {
    const upstream = {
      '100-first': mockMigration('1'),
      '300-third': mockMigration('3'),
      '500-fifth': mockMigration('5'),
    };
    const fork = {
      '200-second': mockMigration('2'),
      '400-fourth': mockMigration('4'),
    };
    setupMockProviders({ upstream, fork });

    const provider = new CompositeMigrationProvider(['upstream', 'fork']);
    const result = await provider.getMigrations();

    expect(Object.keys(result)).toHaveLength(5);
    // Kysely sorts by key, so alphabetical order gives correct interleaving
    const sorted = Object.keys(result).sort();
    expect(sorted).toEqual(['100-first', '200-second', '300-third', '400-fourth', '500-fifth']);
  });

  // Test 14: Folder doesn't exist — propagates error
  it('should propagate error when a folder does not exist', async () => {
    const MockFMP = vi.mocked(FileMigrationProvider);
    MockFMP.mockImplementation(() => {
      return {
        getMigrations: vi.fn().mockRejectedValue(new Error('ENOENT: no such file or directory')),
      } as any;
    });

    const provider = new CompositeMigrationProvider(['nonexistent']);
    await expect(provider.getMigrations()).rejects.toThrow('ENOENT');
  });

  // Test 23: Single folder with no migrations (empty directory)
  it('should work with a single folder', async () => {
    setupMockProviders({ only: {} });

    const provider = new CompositeMigrationProvider(['only']);
    const result = await provider.getMigrations();

    expect(Object.keys(result)).toHaveLength(0);
  });
});
```

**Step 2: Run the test to verify it fails**

Run: `cd server && pnpm test -- --run src/schema/composite-migration-provider.spec.ts`
Expected: FAIL — module `src/schema/composite-migration-provider` not found.

**Step 3: Write the implementation**

Create `server/src/schema/composite-migration-provider.ts`:

```typescript
import { FileMigrationProvider, Migration, MigrationProvider } from 'kysely';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export class CompositeMigrationProvider implements MigrationProvider {
  private providers: FileMigrationProvider[];

  constructor(folders: string[]) {
    this.providers = folders.map(
      (folder) =>
        new FileMigrationProvider({
          fs: { readdir },
          path: { join },
          migrationFolder: folder,
        }),
    );
  }

  async getMigrations(): Promise<Record<string, Migration>> {
    const results = await Promise.all(this.providers.map((p) => p.getMigrations()));
    return Object.assign({}, ...results);
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd server && pnpm test -- --run src/schema/composite-migration-provider.spec.ts`
Expected: All 8 tests PASS.

**Step 5: Commit**

```bash
git add server/src/schema/composite-migration-provider.ts server/src/schema/composite-migration-provider.spec.ts
git commit -m "feat(server): add CompositeMigrationProvider for fork migration support"
```

---

### Task 3: Move fork migrations to migrations-gallery/

**Files:**

- Create directory: `server/src/schema/migrations-gallery/`
- Move: All fork migration files from `server/src/schema/migrations/` to `server/src/schema/migrations-gallery/`

**Step 1: Create the directory and move files**

```bash
mkdir -p server/src/schema/migrations-gallery

# Move all fork migrations (round timestamps ending in 000000, plus the renumbered one)
git mv server/src/schema/migrations/1772230000000-CreateStorageMigrationLogTable.ts server/src/schema/migrations-gallery/
git mv server/src/schema/migrations/1772240000000-CreateSharedSpaceTables.ts server/src/schema/migrations-gallery/
git mv server/src/schema/migrations/1772250000000-AddShowInTimelineToSharedSpaceMember.ts server/src/schema/migrations-gallery/
git mv server/src/schema/migrations/1772260000000-AddThumbnailAssetIdToSharedSpace.ts server/src/schema/migrations-gallery/
git mv server/src/schema/migrations/1772270000000-AddColorToSharedSpace.ts server/src/schema/migrations-gallery/
git mv server/src/schema/migrations/1772790000000-AddLastActivityAtToSharedSpace.ts server/src/schema/migrations-gallery/
git mv server/src/schema/migrations/1772800000000-AddLastViewedAtToSharedSpaceMember.ts server/src/schema/migrations-gallery/
git mv server/src/schema/migrations/1772810000000-AddSharedSpaceActivityTable.ts server/src/schema/migrations-gallery/
git mv server/src/schema/migrations/1772815000000-AddThumbnailCropYToSharedSpace.ts server/src/schema/migrations-gallery/
git mv server/src/schema/migrations/1772820000000-AddSharedSpaceFaceRecognition.ts server/src/schema/migrations-gallery/
git mv server/src/schema/migrations/1774300000000-CreateUserGroupTables.ts server/src/schema/migrations-gallery/
```

**Step 2: Verify only upstream migrations remain in migrations/**

Run: `ls server/src/schema/migrations/ | grep -E '^177[0-9]{4}000000-'`
Expected: No output (no round-timestamp files remain).

**Step 3: Verify fork migrations are in migrations-gallery/**

Run: `ls server/src/schema/migrations-gallery/`
Expected: 11 files listed.

**Step 4: Commit**

```bash
git add -A server/src/schema/migrations/ server/src/schema/migrations-gallery/
git commit -m "refactor(server): move fork migrations to migrations-gallery directory"
```

---

### Task 4: Wire up CompositeMigrationProvider in DatabaseRepository (TDD)

**Files:**

- Modify: `server/src/repositories/database.repository.ts:528-541` (createMigrator method)
- Modify: `server/src/repositories/database.repository.ts:1-7` (imports)

**Step 1: Modify the createMigrator method**

In `server/src/repositories/database.repository.ts`, update the import to add `CompositeMigrationProvider`:

Replace the import line:

```typescript
import { FileMigrationProvider, Kysely, Migrator, sql, Transaction } from 'kysely';
```

With:

```typescript
import { Kysely, Migrator, sql, Transaction } from 'kysely';
```

And add:

```typescript
import { CompositeMigrationProvider } from 'src/schema/composite-migration-provider';
```

Then replace the `createMigrator` method:

```typescript
private createMigrator(): Migrator {
  return new Migrator({
    db: this.db,
    migrationLockTableName: 'kysely_migrations_lock',
    allowUnorderedMigrations: true,
    migrationTableName: 'kysely_migrations',
    provider: new CompositeMigrationProvider([
      // eslint-disable-next-line unicorn/prefer-module
      join(__dirname, '..', 'schema/migrations'),
      // eslint-disable-next-line unicorn/prefer-module
      join(__dirname, '..', 'schema/migrations-gallery'),
    ]),
  });
}
```

Also remove the `readdir` import from `node:fs/promises` if it's no longer used elsewhere in the file.

**Step 2: Verify the `readdir` import usage**

Run: `grep -n 'readdir' server/src/repositories/database.repository.ts`

If `readdir` is only used in `createMigrator`, remove it from the imports. The `join` import from `node:path` is still used in `createMigrator`, so keep it.

**Step 3: Run existing tests**

Run: `cd server && pnpm test -- --run src/services/cli.service.spec.ts`
Expected: PASS (existing tests should still work since they mock the database layer).

**Step 4: Commit**

```bash
git add server/src/repositories/database.repository.ts
git commit -m "feat(server): use CompositeMigrationProvider with allowUnorderedMigrations"
```

---

### Task 5: Update CliService.schemaReport to read both directories (TDD)

**Files:**

- Modify: `server/src/services/cli.service.ts:24-27`
- Modify: `server/src/services/cli.service.spec.ts`

**Step 1: Write new tests for dual-folder schemaReport**

Add these tests to the `schemaReport` describe block in `server/src/services/cli.service.spec.ts`:

```typescript
it('should read migrations from both upstream and gallery folders', async () => {
  // readdir is called twice (once per folder)
  mocks.storage.readdir.mockResolvedValueOnce(['upstream1.js']).mockResolvedValueOnce(['gallery1.js']);
  mocks.database.getMigrations.mockResolvedValue([
    { name: 'upstream1', timestamp: '2024-01-01' },
    { name: 'gallery1', timestamp: '2024-01-02' },
  ]);
  mocks.database.getSchemaDrift.mockResolvedValue({ items: [], asSql: () => [], asHuman: () => [] });

  const result = await sut.schemaReport();

  expect(mocks.storage.readdir).toHaveBeenCalledTimes(2);
  expect(result.migrations).toEqual(
    expect.arrayContaining([
      { name: 'gallery1', status: 'applied' },
      { name: 'upstream1', status: 'applied' },
    ]),
  );
});

// Test 9: Immich-to-Gallery migration scenario
it('should show fork migrations as missing for Immich-to-Gallery migration', async () => {
  mocks.storage.readdir.mockResolvedValueOnce(['upstream1.js']).mockResolvedValueOnce(['gallery1.js']);
  mocks.database.getMigrations.mockResolvedValue([
    { name: 'upstream1', timestamp: '2024-01-01' },
    // gallery1 NOT in DB — Immich migrant scenario
  ]);
  mocks.database.getSchemaDrift.mockResolvedValue({ items: [], asSql: () => [], asHuman: () => [] });

  const result = await sut.schemaReport();

  expect(result.migrations).toEqual(expect.arrayContaining([{ name: 'gallery1', status: 'missing' }]));
});

// Test 10: Existing Gallery user scenario
it('should show all migrations as applied for existing Gallery user', async () => {
  mocks.storage.readdir.mockResolvedValueOnce(['upstream1.js']).mockResolvedValueOnce(['gallery1.js']);
  mocks.database.getMigrations.mockResolvedValue([
    { name: 'upstream1', timestamp: '2024-01-01' },
    { name: 'gallery1', timestamp: '2024-01-02' },
  ]);
  mocks.database.getSchemaDrift.mockResolvedValue({ items: [], asSql: () => [], asHuman: () => [] });

  const result = await sut.schemaReport();

  const applied = result.migrations.filter((m) => m.status === 'applied');
  expect(applied.map((m) => m.name)).toContain('upstream1');
  expect(applied.map((m) => m.name)).toContain('gallery1');
});

// Test 20: DB has migration not in either folder
it('should show deleted status for migration in DB but not in any folder', async () => {
  mocks.storage.readdir.mockResolvedValueOnce(['upstream1.js']).mockResolvedValueOnce([]);
  mocks.database.getMigrations.mockResolvedValue([
    { name: 'upstream1', timestamp: '2024-01-01' },
    { name: 'removed_migration', timestamp: '2024-01-02' },
  ]);
  mocks.database.getSchemaDrift.mockResolvedValue({ items: [], asSql: () => [], asHuman: () => [] });

  const result = await sut.schemaReport();

  expect(result.migrations).toEqual(expect.arrayContaining([{ name: 'removed_migration', status: 'deleted' }]));
});
```

**Step 2: Run new tests to verify they fail**

Run: `cd server && pnpm test -- --run src/services/cli.service.spec.ts`
Expected: FAIL — `readdir` is only called once, second call returns undefined.

**Step 3: Update CliService.schemaReport**

In `server/src/services/cli.service.ts`, replace lines 24-27:

```typescript
async schemaReport(): Promise<SchemaReport> {
  // eslint-disable-next-line unicorn/prefer-module
  const migrationFolders = [
    join(__dirname, '../schema/migrations'),
    join(__dirname, '../schema/migrations-gallery'),
  ];
  const allFiles = (await Promise.all(migrationFolders.map((f) => this.storageRepository.readdir(f)))).flat();
  const files = allFiles.filter((file) => file.endsWith('.js')).map((file) => file.slice(0, -3));
```

**Step 4: Update existing tests**

Existing `schemaReport` tests only mock `readdir` once. Update them to mock it twice (once per folder). For existing tests, the second call can return an empty array:

In each existing test that calls `mocks.storage.readdir.mockResolvedValue(...)`, change to use `mockResolvedValueOnce` twice. For example:

```typescript
// Before:
mocks.storage.readdir.mockResolvedValue(['migration1.js', 'migration2.js']);

// After:
mocks.storage.readdir.mockResolvedValueOnce(['migration1.js', 'migration2.js']).mockResolvedValueOnce([]);
```

Apply this pattern to ALL existing schemaReport tests.

**Step 5: Run all tests to verify they pass**

Run: `cd server && pnpm test -- --run src/services/cli.service.spec.ts`
Expected: All tests PASS.

**Step 6: Commit**

```bash
git add server/src/services/cli.service.ts server/src/services/cli.service.spec.ts
git commit -m "feat(server): update schemaReport to read from both migration directories"
```

---

### Task 6: Lint, format, and type check

**Files:**

- All modified files

**Step 1: Run linter**

Run: `cd server && npx eslint --fix src/schema/composite-migration-provider.ts src/schema/composite-migration-provider.spec.ts src/repositories/database.repository.ts src/services/cli.service.ts src/services/cli.service.spec.ts`
Expected: No errors (or auto-fixed).

**Step 2: Run formatter**

Run: `cd server && npx prettier --write src/schema/composite-migration-provider.ts src/schema/composite-migration-provider.spec.ts src/repositories/database.repository.ts src/services/cli.service.ts src/services/cli.service.spec.ts`

**Step 3: Run type check**

Run: `make check-server`
Expected: No type errors.

**Step 4: Run full test suite**

Run: `cd server && pnpm test`
Expected: All tests PASS.

**Step 5: Commit if any lint/format changes**

```bash
git add -u server/src/
git commit -m "chore(server): lint and format migration provider changes"
```

---

### Task 7: Verify the fix end-to-end

Manually verify the migration ordering is correct by checking the combined migration list.

**Step 1: List all migration files in order**

```bash
(ls server/src/schema/migrations/ && ls server/src/schema/migrations-gallery/) | sort
```

Expected: All files listed, fork migrations interleaved with upstream migrations by timestamp. No duplicate timestamps.

**Step 2: Verify no fork migrations remain in upstream folder**

```bash
ls server/src/schema/migrations/ | grep -cE '^177[0-9]{4}000000-'
```

Expected: `0`

**Step 3: Verify fork migration count**

```bash
ls server/src/schema/migrations-gallery/ | wc -l
```

Expected: `11`

**Step 4: Run all server tests one final time**

Run: `cd server && pnpm test`
Expected: All PASS.
