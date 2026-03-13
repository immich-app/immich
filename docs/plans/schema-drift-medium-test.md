# Schema Drift Medium Test

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a medium test that asserts zero schema drift after running all migrations, catching index/trigger naming mismatches at CI time instead of at runtime.

**Architecture:** A single medium test spec that boots the existing testcontainers Postgres (already set up by `globalSetup.ts`), calls `DatabaseRepository.getSchemaDrift()`, and asserts the result has zero items.

**Tech Stack:** Vitest, testcontainers (already configured), `@immich/sql-tools`

---

## Context

- **The bug this prevents:** Migration `1772240000000-CreateSharedSpaceTables.ts` used `IDX_shared_space_*` index names, but `@immich/sql-tools` `DefaultNamingStrategy` expects `{table}_{column}_idx`. This was only caught at runtime when the server booted against a real DB and logged schema drift warnings.
- **Medium test infrastructure:** Already exists at `server/test/medium/`. `globalSetup.ts` starts a testcontainers Postgres, runs all migrations, and exposes the connection via `process.env.IMMICH_TEST_POSTGRES_URL`. Tests use `getKyselyDB()` from `test/utils.ts` to get a DB handle.
- **Schema drift method:** `DatabaseRepository.getSchemaDrift()` in `server/src/repositories/database.repository.ts:291` — calls `schemaFromCode()` and `schemaFromDatabase()` from `@immich/sql-tools`, then `schemaDiff()` to compare.
- **Run medium tests:** `cd server && pnpm test:medium`

## Files

- **Create:** `server/test/medium/specs/schema-drift.spec.ts`

## Implementation

### Task 1: Create the test file

Create `server/test/medium/specs/schema-drift.spec.ts`:

```typescript
import { ConfigRepository } from 'src/repositories/config.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { getKyselyDB } from 'test/utils';

describe('schema drift', () => {
  it('should have zero drift after running all migrations', async () => {
    const db = await getKyselyDB();
    const logger = LoggingRepository.create();
    const configRepository = new ConfigRepository();
    const databaseRepository = new DatabaseRepository(db, logger, configRepository);

    const drift = await databaseRepository.getSchemaDrift();
    const humanReadable = drift.asHuman();

    expect(humanReadable).toEqual([]);
  });
});
```

**Key points:**

- No need to run migrations — `globalSetup.ts` already does that before any medium test runs.
- `getSchemaDrift()` compares the code-defined schema (`schemaFromCode`) against the actual database schema (`schemaFromDatabase`) and returns any differences.
- Asserting on `drift.asHuman()` gives clear failure messages showing exactly which indexes/triggers/columns are wrong.
- The test lives in `specs/` directly (not under `specs/services/` or `specs/repositories/`) since it's a cross-cutting concern.

### Task 2: Verify it passes

```bash
cd server && pnpm test:medium -- --run test/medium/specs/schema-drift.spec.ts
```

Expected: 1 test passing, zero drift items.

### Task 3: Commit

```bash
git add server/test/medium/specs/schema-drift.spec.ts
git commit -m "test: add medium test asserting zero schema drift after migrations"
```
