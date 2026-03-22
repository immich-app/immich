# Fork Migration Compatibility Design

## Problem

When migrating from Immich v2.6.1 to Noodle Gallery, the server crashes with:

```
corrupted migrations: expected previously executed migration
1772609167000-UpdateOpusCodecName to be at index 62 but
1772230000000-CreateStorageMigrationLogTable was found in its place.
```

Gallery's fork migrations have timestamps that interleave with upstream Immich migrations.
Kysely's `Migrator` enforces strict ordering in production (`allowUnorderedMigrations: false`),
so inserting fork migrations before already-applied upstream migrations breaks the index check.

## Solution

**Composite MigrationProvider + `allowUnorderedMigrations: true`**

Two changes:

1. **Separate directories** — Move fork migrations from `server/src/schema/migrations/` to a new
   `server/src/schema/migrations-gallery/` directory. Upstream migrations stay untouched in
   `migrations/`. A `CompositeMigrationProvider` merges both folders into a single
   `Record<string, Migration>` for Kysely.

2. **Enable unordered migrations** — Set `allowUnorderedMigrations: true` unconditionally (not just
   in dev). This tells Kysely to run all pending migrations in alphabetical order without checking
   that they match the beginning of the already-applied list.

### Why this approach

- **No rebase maintenance** — During upstream rebases, `migrations/` is entirely replaced by
  upstream. Fork migrations in `migrations-gallery/` are never touched. No renumbering, no
  accumulating fixup logic.
- **Seamless for all user types** — Migration names are derived from filenames (not directories), so
  existing Gallery users see the same names and nothing re-runs. Immich migrants get fork migrations
  applied automatically. Fresh installs run everything in order.
- **Kysely-supported pattern** — `allowUnorderedMigrations` was designed for exactly this use case
  (multiple development streams with interleaved timestamps). Flyway has the same concept
  (`outOfOrder: true`).

### Alternatives considered

| Approach                        | Why not                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| Renumber fork migrations        | Ongoing rebase burden, compounding fixup logic for existing users |
| `allowUnorderedMigrations` only | Works but mixes fork/upstream files, causing rebase conflicts     |
| DAG-based migrations            | Kysely doesn't support it, massive implementation cost            |
| Hard fork cutoff                | Blocks pulling upstream improvements                              |

## Architecture

### Directory structure

```
server/src/schema/
  migrations/                    # upstream-only (replaced during rebases)
    1744910873969-InitialMigration.ts
    ...
    1773956345315-DuplicateSharedLinkAssets.ts
  migrations-gallery/            # fork-only (never touched by rebases)
    1772230000000-CreateStorageMigrationLogTable.ts
    1772240000000-CreateSharedSpaceTables.ts
    ...
    1774300000000-CreateUserGroupTables.ts
```

### CompositeMigrationProvider

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

### Migrator changes (database.repository.ts)

```typescript
private createMigrator(): Migrator {
  return new Migrator({
    db: this.db,
    migrationLockTableName: 'kysely_migrations_lock',
    allowUnorderedMigrations: true,  // was: this.configRepository.isDev()
    migrationTableName: 'kysely_migrations',
    provider: new CompositeMigrationProvider([
      join(__dirname, '..', 'schema/migrations'),
      join(__dirname, '..', 'schema/migrations-gallery'),
    ]),
  });
}
```

### CliService changes (cli.service.ts)

`schemaReport()` reads from both directories:

```typescript
const migrationFolders = [join(__dirname, '../schema/migrations'), join(__dirname, '../schema/migrations-gallery')];
const allFiles = (await Promise.all(migrationFolders.map((f) => this.storageRepository.readdir(f)))).flat();
```

## User impact

| User type             | What happens                                                              |
| --------------------- | ------------------------------------------------------------------------- |
| Existing Gallery user | All migrations already in DB with matching names. Nothing runs. Seamless. |
| Immich v2.6.1 migrant | Upstream migrations applied. Fork migrations pending, run automatically.  |
| Fresh install         | All migrations run in alphabetical (timestamp) order.                     |

## Testing strategy (TDD)

### Unit tests: CompositeMigrationProvider

1. Merges migrations from two folders into a single record
2. Handles empty fork folder (fresh upstream-only scenario)
3. Handles empty upstream folder (edge case)
4. Handles both folders empty
5. Deduplicates if same migration name exists in both folders (fork wins via Object.assign order)
6. Returns correct migration functions (up/down are callable)

### Unit tests: DatabaseRepository.createMigrator

7. `allowUnorderedMigrations` is always true (not gated by isDev)

### Unit tests: CliService.schemaReport

8. Reports migrations from both folders correctly
9. Marks fork migrations as "missing" for Immich-to-Gallery migration scenario
10. Marks all as "applied" for existing Gallery user scenario

### Integration-style edge cases

11. Upstream migration interleaved between fork migrations — no ordering error
12. Fork migration with timestamp before an already-applied upstream migration — runs correctly
13. Migration name collision between folders — deterministic behavior

### Error handling

14. Fork migrations folder doesn't exist — fails with clear error, not silent skip
15. Migration file has no `up` export — surfaces Kysely's error cleanly
16. Migration file has syntax error / fails to import — surfaces which file and folder

### Data integrity edge cases

17. Fork migration references a table/column from an upstream migration that sorts after it — the
    dependency ordering trap with allowUnorderedMigrations
18. Two fork migrations with identical timestamps (we have 1772810000000 twice!) — verify both load,
    one doesn't silently overwrite
19. Rollback (migrateDown) with interleaved migrations — rolls back last-applied, not
    last-by-timestamp

### Migration state edge cases

20. DB has migration name not in either folder (upstream removed migration during rebase) —
    schemaReport shows "deleted"
21. Same migration name in both folders with different implementations — Object.assign is
    deterministic, should be detected and warned
22. Partial migration failure mid-run — some applied, some not, then retry

### Operational edge cases

23. `migrations-gallery/` exists but is empty — valid during early fork stages
24. Concurrent server startup — lock table still works with composite provider

## Known issue to fix

Migration `1772810000000` is used by two files:

- `1772810000000-AddSharedSpaceActivityTable.ts`
- `1772810000000-AddThumbnailCropYToSharedSpace.ts`

One of these must be renumbered to avoid silent overwrite in the `Record<string, Migration>`.
