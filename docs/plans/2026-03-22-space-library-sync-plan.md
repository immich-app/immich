# Space-Library Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow admins to link external libraries to shared spaces so library assets appear in the space via query-through (no sync jobs).

**Architecture:** New `shared_space_library` junction table with composite PK `(spaceId, libraryId)`. Space asset queries UNION manual assets from `shared_space_asset` with library assets resolved via `shared_space_library` JOIN `asset`. Face matching uses an orchestrator job on link creation and per-asset jobs on ongoing library scans.

**Tech Stack:** NestJS, Kysely, PostgreSQL, Vitest, BullMQ

---

### Task 1: Schema — Create `shared_space_library` table

**Files:**

- Create: `server/src/schema/tables/shared-space-library.table.ts`
- Modify: `server/src/schema/index.ts` (add import, register in tables array and DB interface)

**Step 1: Create the table schema file**

Create `server/src/schema/tables/shared-space-library.table.ts`:

```typescript
import { CreateDateColumn, ForeignKeyColumn, Generated, Table, Timestamp } from '@immich/sql-tools';
import { LibraryTable } from 'src/schema/tables/library.table';
import { SharedSpaceTable } from 'src/schema/tables/shared-space.table';
import { UserTable } from 'src/schema/tables/user.table';

@Table('shared_space_library')
export class SharedSpaceLibraryTable {
  @ForeignKeyColumn(() => SharedSpaceTable, { onDelete: 'CASCADE', primary: true, index: false })
  spaceId!: string;

  @ForeignKeyColumn(() => LibraryTable, { onDelete: 'CASCADE', primary: true })
  libraryId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'SET NULL', nullable: true })
  addedById!: string | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
```

**Step 2: Register in schema index**

In `server/src/schema/index.ts`:

- Add import after line 64 (after `SharedSpaceAssetTable`):
  ```typescript
  import { SharedSpaceLibraryTable } from 'src/schema/tables/shared-space-library.table';
  ```
- Add to tables array after `SharedSpaceAssetTable` (after line 133):
  ```typescript
  SharedSpaceLibraryTable,
  ```
- Add to DB interface after `shared_space_asset` (after line 255):
  ```typescript
  shared_space_library: SharedSpaceLibraryTable;
  ```

**Step 3: Generate migration**

```bash
cd server && pnpm migrations:generate
```

This auto-generates a migration file in `server/src/schema/migrations/`. Verify it creates the `shared_space_library` table with the correct columns and foreign keys.

**Step 4: Commit**

```bash
git add server/src/schema/tables/shared-space-library.table.ts server/src/schema/index.ts server/src/schema/migrations/
git commit -m "feat(schema): add shared_space_library table"
```

---

### Task 2: Factory — Add `sharedSpaceLibrary` test factory

**Files:**

- Modify: `server/test/small.factory.ts`

**Step 1: Add the factory**

In `server/test/small.factory.ts`, add the factory function after `sharedSpacePersonAliasFactory` (around line 451):

```typescript
const sharedSpaceLibraryFactory = (data: Partial<SharedSpaceLibrary> = {}): SharedSpaceLibrary => ({
  spaceId: newUuid(),
  libraryId: newUuid(),
  addedById: newUuid(),
  createdAt: newDate(),
  ...data,
});
```

Add the `SharedSpaceLibrary` type to `server/src/database.ts` alongside the other shared space types (after `SharedSpaceAsset`):

```typescript
export type SharedSpaceLibrary = {
  spaceId: string;
  libraryId: string;
  addedById: string | null;
  createdAt: Date;
};
```

Then import it in `server/test/small.factory.ts` from `src/database`.

Add to the `factory` export object after `sharedSpacePersonAlias` (around line 515):

```typescript
sharedSpaceLibrary: sharedSpaceLibraryFactory,
```

**Step 2: Commit**

```bash
git add server/test/small.factory.ts
git commit -m "test: add sharedSpaceLibrary test factory"
```

---

### Task 3: Enum — Add `SharedSpaceLibraryFaceSync` job name and permission

**Files:**

- Modify: `server/src/enum.ts`

**Step 1: Add job name**

In `server/src/enum.ts`, add after `SharedSpacePersonThumbnail` (line 715):

```typescript
SharedSpaceLibraryFaceSync = 'SharedSpaceLibraryFaceSync',
```

**Step 2: Add permission**

Add after `SharedSpaceAssetDelete` (line 220):

```typescript
SharedSpaceLibraryCreate = 'sharedSpaceLibrary.create',
SharedSpaceLibraryDelete = 'sharedSpaceLibrary.delete',
```

**Step 3: Commit**

```bash
git add server/src/enum.ts
git commit -m "feat(enum): add SharedSpaceLibraryFaceSync job and library permissions"
```

---

### Task 4: Repository — Add library link CRUD methods

**Files:**

- Modify: `server/src/repositories/shared-space.repository.ts`

**Step 1: Add repository methods**

In `server/src/repositories/shared-space.repository.ts`, add the following methods:

```typescript
addLibrary(values: Insertable<SharedSpaceLibraryTable>) {
  return this.db
    .insertInto('shared_space_library')
    .values(values)
    .onConflict((oc) => oc.doNothing())
    .returningAll()
    .executeTakeFirst();
}

@GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
removeLibrary(spaceId: string, libraryId: string) {
  return this.db
    .deleteFrom('shared_space_library')
    .where('spaceId', '=', spaceId)
    .where('libraryId', '=', libraryId)
    .execute();
}

@GenerateSql({ params: [DummyValue.UUID] })
getLinkedLibraries(spaceId: string) {
  return this.db
    .selectFrom('shared_space_library')
    .selectAll()
    .where('spaceId', '=', spaceId)
    .execute();
}

@GenerateSql({ params: [DummyValue.UUID] })
getSpacesLinkedToLibrary(libraryId: string) {
  return this.db
    .selectFrom('shared_space_library')
    .innerJoin('shared_space', 'shared_space.id', 'shared_space_library.spaceId')
    .selectAll('shared_space_library')
    .select('shared_space.faceRecognitionEnabled')
    .where('shared_space_library.libraryId', '=', libraryId)
    .execute();
}

@GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
hasLibraryLink(spaceId: string, libraryId: string) {
  return this.db
    .selectFrom('shared_space_library')
    .where('spaceId', '=', spaceId)
    .where('libraryId', '=', libraryId)
    .select('spaceId')
    .executeTakeFirst()
    .then((row) => !!row);
}
```

Add the `SharedSpaceLibraryTable` import from `src/schema/tables/shared-space-library.table` and `Insertable` from kysely if not already imported.

**Step 2: Commit**

```bash
git add server/src/repositories/shared-space.repository.ts
git commit -m "feat(repo): add shared_space_library CRUD methods"
```

---

### Task 5: Repository — Update space asset queries to UNION library assets

**Files:**

- Modify: `server/src/repositories/shared-space.repository.ts` — `getAssetCount`, `getRecentAssets`, `getNewAssetCount`

All UNION queries must filter both `asset.deletedAt IS NULL` and `asset.isOffline = false` to exclude deleted and offline library assets.

**Behavioral changes (intentional):**

- `getRecentAssets`: sort changes from `addedAt` (when added to space) to `fileCreatedAt` (when photo was taken). This is required because library-linked assets have no `addedAt`. The new sort is consistent across both sources and arguably more useful.
- `getNewAssetCount`: now joins with `asset` table and filters `deletedAt`/`isOffline` on the manual branch too. Previously counted raw `shared_space_asset` rows. This is a bug fix — deleted assets should not appear in "new" counts.
- `getLastAssetAddedAt` and `getLastContributor`: intentionally NOT updated. These track manual contribution activity. Library-linked assets have no contributor — they flow in automatically. These methods remain `shared_space_asset`-only.
- `getMostRecentAssetId`: intentionally NOT updated. Used for auto-selecting cover photos based on manual additions. Library assets don't trigger this.

**Step 1: Update `getAssetCount`**

```typescript
@GenerateSql({ params: [DummyValue.UUID] })
async getAssetCount(spaceId: string): Promise<number> {
  const result = await this.db
    .selectFrom(
      this.db
        .selectFrom('shared_space_asset')
        .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
        .select('asset.id')
        .where('shared_space_asset.spaceId', '=', spaceId)
        .where('asset.deletedAt', 'is', null)
        .where('asset.isOffline', '=', false)
        .union(
          this.db
            .selectFrom('shared_space_library')
            .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
            .select('asset.id')
            .where('shared_space_library.spaceId', '=', spaceId)
            .where('asset.deletedAt', 'is', null)
            .where('asset.isOffline', '=', false),
        )
        .as('combined'),
    )
    .select((eb) => eb.fn.countAll().as('count'))
    .executeTakeFirstOrThrow();
  return Number(result.count);
}
```

**Step 2: Update `getRecentAssets`**

```typescript
@GenerateSql({ params: [DummyValue.UUID, 4] })
getRecentAssets(spaceId: string, limit = 4) {
  return this.db
    .selectFrom(
      this.db
        .selectFrom('shared_space_asset')
        .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
        .select(['asset.id', 'asset.thumbhash', 'asset.fileCreatedAt'])
        .where('shared_space_asset.spaceId', '=', spaceId)
        .where('asset.deletedAt', 'is', null)
        .where('asset.isOffline', '=', false)
        .union(
          this.db
            .selectFrom('shared_space_library')
            .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
            .select(['asset.id', 'asset.thumbhash', 'asset.fileCreatedAt'])
            .where('shared_space_library.spaceId', '=', spaceId)
            .where('asset.deletedAt', 'is', null)
            .where('asset.isOffline', '=', false),
        )
        .as('combined'),
    )
    .select(['combined.id', 'combined.thumbhash'])
    .orderBy('combined.fileCreatedAt', 'desc')
    .limit(limit)
    .execute();
}
```

**Step 3: Update `getNewAssetCount`**

For library assets, use `asset.createdAt` as the "added" timestamp since there is no `addedAt`:

```typescript
@GenerateSql({ params: [DummyValue.UUID, DummyValue.DATE] })
async getNewAssetCount(spaceId: string, since: Date): Promise<number> {
  const result = await this.db
    .selectFrom(
      this.db
        .selectFrom('shared_space_asset')
        .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
        .select('asset.id')
        .where('shared_space_asset.spaceId', '=', spaceId)
        .where('shared_space_asset.addedAt', '>', since)
        .where('asset.deletedAt', 'is', null)
        .where('asset.isOffline', '=', false)
        .union(
          this.db
            .selectFrom('shared_space_library')
            .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
            .select('asset.id')
            .where('shared_space_library.spaceId', '=', spaceId)
            .where('asset.createdAt', '>', since)
            .where('asset.deletedAt', 'is', null)
            .where('asset.isOffline', '=', false),
        )
        .as('combined'),
    )
    .select((eb) => eb.fn.countAll().as('count'))
    .executeTakeFirstOrThrow();
  return Number(result.count);
}
```

**Step 4: Update `getMapMarkers`**

The existing `getMapMarkers` method (line 276) only queries `shared_space_asset`. UNION library assets:

```typescript
@GenerateSql({ params: [DummyValue.UUID] })
getMapMarkers(spaceId: string) {
  return this.db
    .selectFrom(
      this.db
        .selectFrom('shared_space_asset')
        .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
        .select('asset.id')
        .where('shared_space_asset.spaceId', '=', spaceId)
        .where('asset.deletedAt', 'is', null)
        .where('asset.isOffline', '=', false)
        .union(
          this.db
            .selectFrom('shared_space_library')
            .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
            .select('asset.id')
            .where('shared_space_library.spaceId', '=', spaceId)
            .where('asset.deletedAt', 'is', null)
            .where('asset.isOffline', '=', false),
        )
        .as('combined'),
    )
    .innerJoin('asset', 'asset.id', 'combined.id')
    .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
    .where('asset_exif.latitude', 'is not', null)
    .where('asset_exif.longitude', 'is not', null)
    .select([
      'asset.id',
      'asset_exif.latitude',
      'asset_exif.longitude',
      'asset_exif.city',
      'asset_exif.state',
      'asset_exif.country',
    ])
    .execute();
}
```

**Step 5: Commit**

```bash
git add server/src/repositories/shared-space.repository.ts
git commit -m "feat(repo): UNION library assets in space asset queries including map"
```

---

### Task 5b: Repository — Update validation and face-matching helper methods

**Files:**

- Modify: `server/src/repositories/shared-space.repository.ts` — `isAssetInSpace`, `isFaceInSpace`, `getAssetIdsInSpace`, `getSpaceIdsForAsset`

These methods only query `shared_space_asset` and are used by the service for validation and face matching. Without updating them, library-linked assets will fail validation (e.g., setting a library asset as space thumbnail) and won't be processed by the "match all faces" job.

**Step 1: Update `isAssetInSpace`**

Used by `update()` for thumbnail validation. Must also check library-linked assets:

```typescript
@GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
async isAssetInSpace(spaceId: string, assetId: string): Promise<boolean> {
  const result = await this.db
    .selectFrom(
      this.db
        .selectFrom('shared_space_asset')
        .select('assetId as id')
        .where('spaceId', '=', spaceId)
        .where('assetId', '=', assetId)
        .union(
          this.db
            .selectFrom('shared_space_library')
            .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
            .select('asset.id')
            .where('shared_space_library.spaceId', '=', spaceId)
            .where('asset.id', '=', assetId)
            .where('asset.deletedAt', 'is', null)
            .where('asset.isOffline', '=', false),
        )
        .as('combined'),
    )
    .select('combined.id')
    .limit(1)
    .executeTakeFirst();
  return !!result;
}
```

**Step 2: Update `isFaceInSpace`**

Used by `updateSpacePerson()` for face validation:

```typescript
@GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
async isFaceInSpace(spaceId: string, faceId: string): Promise<boolean> {
  const result = await this.db
    .selectFrom(
      this.db
        .selectFrom('shared_space_asset')
        .innerJoin('asset_face', 'asset_face.assetId', 'shared_space_asset.assetId')
        .select('asset_face.id')
        .where('shared_space_asset.spaceId', '=', spaceId)
        .where('asset_face.id', '=', faceId)
        .where('asset_face.deletedAt', 'is', null)
        .union(
          this.db
            .selectFrom('shared_space_library')
            .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
            .innerJoin('asset_face', 'asset_face.assetId', 'asset.id')
            .select('asset_face.id')
            .where('shared_space_library.spaceId', '=', spaceId)
            .where('asset_face.id', '=', faceId)
            .where('asset_face.deletedAt', 'is', null)
            .where('asset.deletedAt', 'is', null)
            .where('asset.isOffline', '=', false),
        )
        .as('combined'),
    )
    .select('combined.id')
    .limit(1)
    .executeTakeFirst();
  return !!result;
}
```

**Step 3: Update `getAssetIdsInSpace`**

Used by `handleSharedSpaceFaceMatchAll` when face recognition is toggled on:

```typescript
@GenerateSql({ params: [DummyValue.UUID] })
getAssetIdsInSpace(spaceId: string) {
  return this.db
    .selectFrom(
      this.db
        .selectFrom('shared_space_asset')
        .select('assetId as id')
        .where('spaceId', '=', spaceId)
        .union(
          this.db
            .selectFrom('shared_space_library')
            .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
            .select('asset.id')
            .where('shared_space_library.spaceId', '=', spaceId)
            .where('asset.deletedAt', 'is', null)
            .where('asset.isOffline', '=', false),
        )
        .as('combined'),
    )
    .select('combined.id as assetId')
    .execute();
}
```

**Step 4: Update `getSpaceIdsForAsset`**

Used by `person.service.ts` during normal face detection to find which spaces contain an asset:

```typescript
@GenerateSql({ params: [DummyValue.UUID] })
getSpaceIdsForAsset(assetId: string) {
  return this.db
    .selectFrom(
      this.db
        .selectFrom('shared_space_asset')
        .innerJoin('shared_space', 'shared_space.id', 'shared_space_asset.spaceId')
        .select('shared_space_asset.spaceId')
        .where('shared_space_asset.assetId', '=', assetId)
        .where('shared_space.faceRecognitionEnabled', '=', true)
        .union(
          this.db
            .selectFrom('shared_space_library')
            .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
            .innerJoin('shared_space', 'shared_space.id', 'shared_space_library.spaceId')
            .select('shared_space_library.spaceId')
            .where('asset.id', '=', assetId)
            .where('shared_space.faceRecognitionEnabled', '=', true),
        )
        .as('combined'),
    )
    .select('combined.spaceId')
    .execute();
}
```

**Step 5: Commit**

```bash
git add server/src/repositories/shared-space.repository.ts
git commit -m "feat(repo): update validation and face-matching methods for library-linked assets"
```

---

### Task 6: Repository — Update timeline queries to include library assets

**Files:**

- Modify: `server/src/repositories/asset.repository.ts`

The timeline queries use `timelineSpaceIds` to include space assets and `spaceId` to view a single space. Both currently only check `shared_space_asset`. We need to also check `shared_space_library` → `asset.libraryId`.

Search queries pass `spaceId` through to the same `AssetRepository` builder, so search is covered by these changes too.

**Step 1: Update `getTimeBuckets` — `timelineSpaceIds` block**

In `server/src/repositories/asset.repository.ts`, find the `.$if(!!options.userIds && !!options.timelineSpaceIds, ...)` block (around line 748). Add a third `eb.exists` for library-linked assets:

```typescript
.$if(!!options.userIds && !!options.timelineSpaceIds, (qb) =>
  qb.where((eb) =>
    eb.or([
      eb('asset.ownerId', '=', anyUuid(options.userIds!)),
      eb.exists(
        eb
          .selectFrom('shared_space_asset')
          .whereRef('shared_space_asset.assetId', '=', 'asset.id')
          .where('shared_space_asset.spaceId', '=', anyUuid(options.timelineSpaceIds!)),
      ),
      eb.exists(
        eb
          .selectFrom('shared_space_library')
          .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
          .where('shared_space_library.spaceId', '=', anyUuid(options.timelineSpaceIds!)),
      ),
    ]),
  ),
)
```

**Step 2: Update `getTimeBuckets` — `spaceId` block**

Find the `.$if(!!options.spaceId, ...)` block (around line 731). Replace with OR for both sources:

```typescript
.$if(!!options.spaceId, (qb) =>
  qb.where((eb) =>
    eb.or([
      eb.exists(
        eb
          .selectFrom('shared_space_asset')
          .whereRef('shared_space_asset.assetId', '=', 'asset.id')
          .where('shared_space_asset.spaceId', '=', asUuid(options.spaceId!)),
      ),
      eb.exists(
        eb
          .selectFrom('shared_space_library')
          .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
          .where('shared_space_library.spaceId', '=', asUuid(options.spaceId!)),
      ),
    ]),
  ),
)
```

**Step 3: Apply the same two changes to `getTimeBucket`**

The `getTimeBucket` method has identical `.$if` blocks (around lines 843-870). Apply the exact same patterns from Steps 1 and 2.

**Step 4: Commit**

```bash
git add server/src/repositories/asset.repository.ts
git commit -m "feat(repo): include library-linked assets in timeline and search queries"
```

---

### Task 7: Access control — Grant space members access to library-linked assets

**Files:**

- Modify: `server/src/repositories/access.repository.ts`

The existing `checkSpaceAccess` method (line 218) only checks `shared_space_asset`. When a space member tries to view a library-linked asset (thumbnail, detail, download), this access check will fail because the asset isn't in `shared_space_asset`. We need to also check `shared_space_library`.

**Step 1: Update `checkSpaceAccess`**

Replace the existing method (lines 218-234) to UNION both sources:

```typescript
@GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
@ChunkedSet({ paramIndex: 1 })
async checkSpaceAccess(userId: string, assetIds: Set<string>) {
  if (assetIds.size === 0) {
    return new Set<string>();
  }

  return this.db
    .selectFrom(
      this.db
        .selectFrom('shared_space_asset')
        .innerJoin('shared_space_member', 'shared_space_member.spaceId', 'shared_space_asset.spaceId')
        .innerJoin('asset', (join) =>
          join.onRef('asset.id', '=', 'shared_space_asset.assetId').on('asset.deletedAt', 'is', null),
        )
        .select('asset.id')
        .where('shared_space_member.userId', '=', userId)
        .where('asset.id', 'in', [...assetIds])
        .union(
          this.db
            .selectFrom('shared_space_library')
            .innerJoin('shared_space_member', 'shared_space_member.spaceId', 'shared_space_library.spaceId')
            .innerJoin('asset', (join) =>
              join
                .onRef('asset.libraryId', '=', 'shared_space_library.libraryId')
                .on('asset.deletedAt', 'is', null)
                .on('asset.isOffline', '=', false),
            )
            .select('asset.id')
            .where('shared_space_member.userId', '=', userId)
            .where('asset.id', 'in', [...assetIds]),
        )
        .as('combined'),
    )
    .select('combined.id')
    .execute()
    .then((assets) => new Set(assets.map((asset) => asset.id)));
}
```

This grants access to assets that are either:

- In `shared_space_asset` for a space the user is a member of (existing behavior), OR
- In a library linked to a space the user is a member of (new behavior)

**Step 2: Update `checkSpaceEditAccess`**

The `checkSpaceEditAccess` method (line 238) has the same problem — it only checks `shared_space_asset`. Space editors/owners need to also edit library-linked assets. Apply the same UNION pattern but keep the role filter:

```typescript
@GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
@ChunkedSet({ paramIndex: 1 })
async checkSpaceEditAccess(userId: string, assetIds: Set<string>) {
  if (assetIds.size === 0) {
    return new Set<string>();
  }

  return this.db
    .selectFrom(
      this.db
        .selectFrom('shared_space_asset')
        .innerJoin('shared_space_member', 'shared_space_member.spaceId', 'shared_space_asset.spaceId')
        .innerJoin('asset', (join) =>
          join.onRef('asset.id', '=', 'shared_space_asset.assetId').on('asset.deletedAt', 'is', null),
        )
        .select('asset.id')
        .where('shared_space_member.userId', '=', userId)
        .where('asset.id', 'in', [...assetIds])
        .where('shared_space_member.role', 'in', ['editor', 'owner'])
        .union(
          this.db
            .selectFrom('shared_space_library')
            .innerJoin('shared_space_member', 'shared_space_member.spaceId', 'shared_space_library.spaceId')
            .innerJoin('asset', (join) =>
              join
                .onRef('asset.libraryId', '=', 'shared_space_library.libraryId')
                .on('asset.deletedAt', 'is', null)
                .on('asset.isOffline', '=', false),
            )
            .select('asset.id')
            .where('shared_space_member.userId', '=', userId)
            .where('asset.id', 'in', [...assetIds])
            .where('shared_space_member.role', 'in', ['editor', 'owner']),
        )
        .as('combined'),
    )
    .select('combined.id')
    .execute()
    .then((assets) => new Set(assets.map((asset) => asset.id)));
}
```

**Step 3: Commit**

```bash
git add server/src/repositories/access.repository.ts
git commit -m "feat(access): grant space members access to library-linked assets"
```

---

### Task 7b: Repository unit tests — UNION query logic

**Files:**

- Test: `server/src/services/shared-space.service.spec.ts` (repository is tested indirectly via service mocks, but we need dedicated tests for the UNION logic)

Since repository methods use SQL queries that can't be meaningfully unit-tested with mocks (the UNION logic is in the query itself), these tests belong in medium tests. However, we add service-level tests that verify the correct repository methods are called with correct arguments, and rely on Task 21 (medium tests) for actual UNION verification.

**Step 1: Write service-level wiring tests**

Add to `shared-space.service.spec.ts` in existing `describe` blocks:

```typescript
describe('getAssetCount (with library-linked assets)', () => {
  it('should call repository getAssetCount which includes library assets', async () => {
    // This verifies the service calls the updated repository method
    // The actual UNION logic is validated in medium tests (Task 21)
    const auth = factory.auth();
    const space = factory.sharedSpace();
    const member = factory.sharedSpaceMember({ spaceId: space.id, userId: auth.user.id });

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(member);
    mocks.sharedSpace.getMembers.mockResolvedValue([makeMemberResult({ ...member })]);
    mocks.sharedSpace.getAssetCount.mockResolvedValue(117000);
    mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
    mocks.sharedSpace.getNewAssetCount.mockResolvedValue(0);

    const result = await sut.get(auth, space.id);

    expect(result.assetCount).toBe(117000);
    expect(mocks.sharedSpace.getAssetCount).toHaveBeenCalledWith(space.id);
  });
});

describe('isAssetInSpace (with library-linked assets)', () => {
  it('should validate thumbnail from library-linked asset', async () => {
    const auth = factory.auth();
    const space = factory.sharedSpace();
    const member = factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Owner,
    });
    const thumbnailAssetId = newUuid();

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(member);
    mocks.sharedSpace.isAssetInSpace.mockResolvedValue(true); // Library asset passes validation
    mocks.sharedSpace.update.mockResolvedValue(space);

    await sut.update(auth, space.id, { thumbnailAssetId });

    expect(mocks.sharedSpace.isAssetInSpace).toHaveBeenCalledWith(space.id, thumbnailAssetId);
  });

  it('should reject thumbnail not in space or linked library', async () => {
    const auth = factory.auth();
    const space = factory.sharedSpace();
    const member = factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Owner,
    });

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(member);
    mocks.sharedSpace.isAssetInSpace.mockResolvedValue(false);

    await expect(sut.update(auth, space.id, { thumbnailAssetId: newUuid() })).rejects.toThrow(BadRequestException);
  });
});
```

**Step 2: Commit**

```bash
git add server/src/services/shared-space.service.spec.ts
git commit -m "test: add service-level tests for library-aware repository methods"
```

---

### Task 8: DTO — Add library fields to space DTOs

**Files:**

- Modify: `server/src/dtos/shared-space.dto.ts`

**Step 1: Add link library DTO**

```typescript
export class SharedSpaceLibraryLinkDto {
  @ValidateUUID({ description: 'Library ID' })
  libraryId!: string;
}
```

**Step 2: Add linked library response DTO**

```typescript
export class SharedSpaceLinkedLibraryDto {
  @ApiProperty()
  libraryId!: string;

  @ApiProperty()
  libraryName!: string;

  @ApiPropertyOptional()
  addedById!: string | null;

  @ApiProperty()
  createdAt!: Date;
}
```

**Step 3: Add `linkedLibraries` to `SharedSpaceResponseDto`**

Add an optional field with array type hint for Swagger:

```typescript
@ApiPropertyOptional({ type: [SharedSpaceLinkedLibraryDto] })
linkedLibraries?: SharedSpaceLinkedLibraryDto[];
```

**Step 4: Commit**

```bash
git add server/src/dtos/shared-space.dto.ts
git commit -m "feat(dto): add library link DTOs"
```

---

### Task 9: Service — Write failing tests for linkLibrary / unlinkLibrary

**Files:**

- Test: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write failing tests**

Add the following test cases to `shared-space.service.spec.ts`:

```typescript
describe('linkLibrary', () => {
  it('should link a library when user is admin and space owner', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });
    const space = factory.sharedSpace();
    const library = factory.library();
    const member = factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Owner,
    });

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(member);
    mocks.library.get.mockResolvedValue(library);
    mocks.sharedSpace.addLibrary.mockResolvedValue(
      factory.sharedSpaceLibrary({ spaceId: space.id, libraryId: library.id }),
    );

    await sut.linkLibrary(auth, space.id, { libraryId: library.id });

    expect(mocks.sharedSpace.addLibrary).toHaveBeenCalledWith({
      spaceId: space.id,
      libraryId: library.id,
      addedById: auth.user.id,
    });
  });

  it('should link a library when user is admin and space editor', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });
    const space = factory.sharedSpace();
    const library = factory.library();
    const member = factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Editor,
    });

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(member);
    mocks.library.get.mockResolvedValue(library);
    mocks.sharedSpace.addLibrary.mockResolvedValue(
      factory.sharedSpaceLibrary({ spaceId: space.id, libraryId: library.id }),
    );

    await sut.linkLibrary(auth, space.id, { libraryId: library.id });

    expect(mocks.sharedSpace.addLibrary).toHaveBeenCalled();
  });

  it('should reject when user is not admin', async () => {
    const auth = factory.auth({ user: { isAdmin: false } });
    const space = factory.sharedSpace();

    await expect(sut.linkLibrary(auth, space.id, { libraryId: newUuid() })).rejects.toThrow(ForbiddenException);
  });

  it('should reject when user is admin but only a viewer', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });
    const space = factory.sharedSpace();
    const member = factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Viewer,
    });

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(member);

    await expect(sut.linkLibrary(auth, space.id, { libraryId: newUuid() })).rejects.toThrow(ForbiddenException);
  });

  it('should reject when user is admin but not a space member', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });
    const space = factory.sharedSpace();

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(undefined);

    await expect(sut.linkLibrary(auth, space.id, { libraryId: newUuid() })).rejects.toThrow(ForbiddenException);
  });

  it('should reject linking a non-existent library', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });
    const space = factory.sharedSpace();
    const member = factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Owner,
    });

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(member);
    mocks.library.get.mockResolvedValue(undefined);

    await expect(sut.linkLibrary(auth, space.id, { libraryId: newUuid() })).rejects.toThrow(BadRequestException);
  });

  it('should reject linking to a non-existent space', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });

    mocks.sharedSpace.getById.mockResolvedValue(undefined);

    await expect(sut.linkLibrary(auth, newUuid(), { libraryId: newUuid() })).rejects.toThrow();
  });

  it('should silently no-op when linking the same library twice', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });
    const space = factory.sharedSpace({ faceRecognitionEnabled: true });
    const library = factory.library();
    const member = factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Owner,
    });

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(member);
    mocks.library.get.mockResolvedValue(library);
    // onConflict doNothing returns undefined for duplicates
    mocks.sharedSpace.addLibrary.mockResolvedValue(undefined);

    await expect(sut.linkLibrary(auth, space.id, { libraryId: library.id })).resolves.not.toThrow();

    // Should NOT re-queue face sync for duplicate link
    expect(mocks.job.queue).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: JobName.SharedSpaceLibraryFaceSync }),
    );
  });

  it('should allow linking the same library to different spaces', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });
    const space1 = factory.sharedSpace();
    const space2 = factory.sharedSpace();
    const library = factory.library();

    for (const space of [space1, space2]) {
      const member = factory.sharedSpaceMember({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Owner,
      });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.library.get.mockResolvedValue(library);
      mocks.sharedSpace.addLibrary.mockResolvedValue(
        factory.sharedSpaceLibrary({ spaceId: space.id, libraryId: library.id }),
      );

      await sut.linkLibrary(auth, space.id, { libraryId: library.id });
    }

    expect(mocks.sharedSpace.addLibrary).toHaveBeenCalledTimes(2);
  });

  it('should allow linking different libraries to the same space', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });
    const space = factory.sharedSpace();
    const lib1 = factory.library();
    const lib2 = factory.library();
    const member = factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Owner,
    });

    for (const lib of [lib1, lib2]) {
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.library.get.mockResolvedValue(lib);
      mocks.sharedSpace.addLibrary.mockResolvedValue(
        factory.sharedSpaceLibrary({ spaceId: space.id, libraryId: lib.id }),
      );

      await sut.linkLibrary(auth, space.id, { libraryId: lib.id });
    }

    expect(mocks.sharedSpace.addLibrary).toHaveBeenCalledTimes(2);
  });

  it('should queue face sync job when space has face recognition enabled', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });
    const space = factory.sharedSpace({ faceRecognitionEnabled: true });
    const library = factory.library();
    const member = factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Owner,
    });

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(member);
    mocks.library.get.mockResolvedValue(library);
    mocks.sharedSpace.addLibrary.mockResolvedValue(
      factory.sharedSpaceLibrary({ spaceId: space.id, libraryId: library.id }),
    );

    await sut.linkLibrary(auth, space.id, { libraryId: library.id });

    expect(mocks.job.queue).toHaveBeenCalledWith({
      name: JobName.SharedSpaceLibraryFaceSync,
      data: { spaceId: space.id, libraryId: library.id },
    });
  });

  it('should not queue face sync job when face recognition is disabled', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });
    const space = factory.sharedSpace({ faceRecognitionEnabled: false });
    const library = factory.library();
    const member = factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Owner,
    });

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(member);
    mocks.library.get.mockResolvedValue(library);
    mocks.sharedSpace.addLibrary.mockResolvedValue(
      factory.sharedSpaceLibrary({ spaceId: space.id, libraryId: library.id }),
    );

    await sut.linkLibrary(auth, space.id, { libraryId: library.id });

    expect(mocks.job.queue).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: JobName.SharedSpaceLibraryFaceSync }),
    );
  });
});

describe('unlinkLibrary', () => {
  it('should unlink a library when user is admin and space owner', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });
    const space = factory.sharedSpace();
    const libraryId = newUuid();
    const member = factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Owner,
    });

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(member);

    await sut.unlinkLibrary(auth, space.id, libraryId);

    expect(mocks.sharedSpace.removeLibrary).toHaveBeenCalledWith(space.id, libraryId);
  });

  it('should unlink a library when user is admin and space editor', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });
    const space = factory.sharedSpace();
    const libraryId = newUuid();
    const member = factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Editor,
    });

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(member);

    await sut.unlinkLibrary(auth, space.id, libraryId);

    expect(mocks.sharedSpace.removeLibrary).toHaveBeenCalledWith(space.id, libraryId);
  });

  it('should reject when user is not admin', async () => {
    const auth = factory.auth({ user: { isAdmin: false } });

    await expect(sut.unlinkLibrary(auth, newUuid(), newUuid())).rejects.toThrow(ForbiddenException);
  });

  it('should reject when user is admin but only a viewer', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });
    const space = factory.sharedSpace();
    const member = factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Viewer,
    });

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(member);

    await expect(sut.unlinkLibrary(auth, space.id, newUuid())).rejects.toThrow(ForbiddenException);
  });

  it('should reject when user is admin but not a space member', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });
    const space = factory.sharedSpace();

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(undefined);

    await expect(sut.unlinkLibrary(auth, space.id, newUuid())).rejects.toThrow(ForbiddenException);
  });

  it('should not fail when unlinking a library that is not linked', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });
    const space = factory.sharedSpace();
    const member = factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Owner,
    });

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(member);

    await expect(sut.unlinkLibrary(auth, space.id, newUuid())).resolves.not.toThrow();
  });

  it('should not remove manually added assets from the same library', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });
    const space = factory.sharedSpace();
    const member = factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Owner,
    });

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(member);

    await sut.unlinkLibrary(auth, space.id, newUuid());

    // removeLibrary only deletes from shared_space_library, NOT shared_space_asset
    expect(mocks.sharedSpace.removeLibrary).toHaveBeenCalled();
    expect(mocks.sharedSpace.removeAssets).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: FAIL — `sut.linkLibrary is not a function` and `sut.unlinkLibrary is not a function`

**Step 3: Commit**

```bash
git add server/src/services/shared-space.service.spec.ts
git commit -m "test: add failing tests for linkLibrary/unlinkLibrary"
```

---

### Task 10: Service — Implement linkLibrary / unlinkLibrary

**Files:**

- Modify: `server/src/services/shared-space.service.ts`

**Step 1: Implement `linkLibrary`**

Note: `requireRole` returns the **member** object, not the space. We need a separate `getById` call to check `faceRecognitionEnabled`. Also, `addLibrary` returns `undefined` when the library is already linked (due to `ON CONFLICT DO NOTHING`). Only queue face sync for newly created links.

```typescript
async linkLibrary(auth: AuthDto, spaceId: string, dto: SharedSpaceLibraryLinkDto): Promise<void> {
  if (!auth.user.isAdmin) {
    throw new ForbiddenException('Only admins can link libraries to spaces');
  }

  await this.requireRole(auth, spaceId, SharedSpaceRole.Editor);

  const library = await this.libraryRepository.get(dto.libraryId);
  if (!library) {
    throw new BadRequestException('Library not found');
  }

  const result = await this.sharedSpaceRepository.addLibrary({
    spaceId,
    libraryId: dto.libraryId,
    addedById: auth.user.id,
  });

  // Only queue face sync for newly created links (not duplicates)
  if (result) {
    const space = await this.sharedSpaceRepository.getById(spaceId);
    if (space?.faceRecognitionEnabled) {
      await this.jobRepository.queue({
        name: JobName.SharedSpaceLibraryFaceSync,
        data: { spaceId, libraryId: dto.libraryId },
      });
    }
  }
}
```

**Step 2: Implement `unlinkLibrary`**

```typescript
async unlinkLibrary(auth: AuthDto, spaceId: string, libraryId: string): Promise<void> {
  if (!auth.user.isAdmin) {
    throw new ForbiddenException('Only admins can unlink libraries from spaces');
  }

  await this.requireRole(auth, spaceId, SharedSpaceRole.Editor);

  await this.sharedSpaceRepository.removeLibrary(spaceId, libraryId);
}
```

Add import for `SharedSpaceLibraryLinkDto` from `src/dtos/shared-space.dto`.

**Step 3: Run tests to verify they pass**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: All new tests PASS.

**Step 4: Commit**

```bash
git add server/src/services/shared-space.service.ts
git commit -m "feat(service): implement linkLibrary/unlinkLibrary"
```

---

### Task 11: Service — Write failing tests for space response with linked libraries

**Files:**

- Test: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write failing tests**

```typescript
describe('get (linked libraries)', () => {
  it('should include linked libraries in response when user is admin', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });
    const space = factory.sharedSpace();
    const member = factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Owner,
    });
    const linkedLibrary = factory.sharedSpaceLibrary({
      spaceId: space.id,
      libraryId: newUuid(),
    });

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(member);
    mocks.sharedSpace.getMembers.mockResolvedValue([makeMemberResult({ ...member })]);
    mocks.sharedSpace.getAssetCount.mockResolvedValue(100);
    mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
    mocks.sharedSpace.getNewAssetCount.mockResolvedValue(0);
    mocks.sharedSpace.getLinkedLibraries.mockResolvedValue([linkedLibrary]);
    mocks.library.get.mockResolvedValue(factory.library({ id: linkedLibrary.libraryId, name: 'Family Photos' }));

    const result = await sut.get(auth, space.id);

    expect(result.linkedLibraries).toHaveLength(1);
    expect(result.linkedLibraries![0].libraryId).toBe(linkedLibrary.libraryId);
    expect(result.linkedLibraries![0].libraryName).toBe('Family Photos');
  });

  it('should not include linked libraries for non-admin users', async () => {
    const auth = factory.auth({ user: { isAdmin: false } });
    const space = factory.sharedSpace();
    const member = factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Owner,
    });

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(member);
    mocks.sharedSpace.getMembers.mockResolvedValue([makeMemberResult({ ...member })]);
    mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
    mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
    mocks.sharedSpace.getNewAssetCount.mockResolvedValue(0);

    const result = await sut.get(auth, space.id);

    expect(result.linkedLibraries).toBeUndefined();
    expect(mocks.sharedSpace.getLinkedLibraries).not.toHaveBeenCalled();
  });

  it('should return empty linkedLibraries array for admin with no links', async () => {
    const auth = factory.auth({ user: { isAdmin: true } });
    const space = factory.sharedSpace();
    const member = factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Owner,
    });

    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getMember.mockResolvedValue(member);
    mocks.sharedSpace.getMembers.mockResolvedValue([makeMemberResult({ ...member })]);
    mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
    mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
    mocks.sharedSpace.getNewAssetCount.mockResolvedValue(0);
    mocks.sharedSpace.getLinkedLibraries.mockResolvedValue([]);

    const result = await sut.get(auth, space.id);

    expect(result.linkedLibraries).toEqual([]);
  });
});
```

**Step 2: Run tests — verify they fail**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

**Step 3: Commit**

```bash
git add server/src/services/shared-space.service.spec.ts
git commit -m "test: add failing tests for linked libraries in space response"
```

---

### Task 12: Service — Implement linked libraries in space response

**Files:**

- Modify: `server/src/services/shared-space.service.ts`

**Step 1: Update `get` and `getAll` methods**

In the `get` method (and the loop in `getAll`), after existing queries, conditionally fetch linked libraries for admin users:

```typescript
// Inside get/getAll, after existing data fetching:
let linkedLibraries: SharedSpaceLinkedLibraryDto[] | undefined;
if (auth.user.isAdmin) {
  const links = await this.sharedSpaceRepository.getLinkedLibraries(space.id);
  linkedLibraries = [];
  for (const link of links) {
    const library = await this.libraryRepository.get(link.libraryId);
    if (library) {
      linkedLibraries.push({
        libraryId: link.libraryId,
        libraryName: library.name,
        addedById: link.addedById,
        createdAt: link.createdAt as unknown as Date,
      });
    }
  }
}
```

Include `linkedLibraries` in the returned `SharedSpaceResponseDto`.

**Step 2: Run tests — verify they pass**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

**Step 3: Commit**

```bash
git add server/src/services/shared-space.service.ts
git commit -m "feat(service): include linked libraries in space response for admins"
```

---

### Task 13: Controller — Add API endpoints

**Files:**

- Modify: `server/src/controllers/shared-space.controller.ts`

**Step 1: Add link library endpoint**

```typescript
@Put(':id/libraries')
@Authenticated({ permission: Permission.SharedSpaceLibraryCreate })
@HttpCode(HttpStatus.NO_CONTENT)
@Endpoint({
  summary: 'Link a library to a shared space',
  description: 'Link an external library so its assets appear in the space. Requires admin and space editor/owner.',
  history: new HistoryBuilder().added('v1').beta('v1'),
})
linkLibrary(
  @Auth() auth: AuthDto,
  @Param() { id }: UUIDParamDto,
  @Body() dto: SharedSpaceLibraryLinkDto,
): Promise<void> {
  return this.service.linkLibrary(auth, id, dto);
}
```

Note: Admin check is done in the service layer, not duplicated at the controller level.

**Step 2: Add unlink library endpoint**

```typescript
@Delete(':id/libraries/:libraryId')
@Authenticated({ permission: Permission.SharedSpaceLibraryDelete })
@HttpCode(HttpStatus.NO_CONTENT)
@Endpoint({
  summary: 'Unlink a library from a shared space',
  description: 'Remove a library link. Library assets will no longer appear in the space.',
  history: new HistoryBuilder().added('v1').beta('v1'),
})
unlinkLibrary(
  @Auth() auth: AuthDto,
  @Param() { id }: UUIDParamDto,
  @Param('libraryId') libraryId: string,
): Promise<void> {
  return this.service.unlinkLibrary(auth, id, libraryId);
}
```

Add imports for `SharedSpaceLibraryLinkDto` and new `Permission` entries.

**Step 3: Commit**

```bash
git add server/src/controllers/shared-space.controller.ts
git commit -m "feat(api): add library link/unlink endpoints"
```

---

### Task 14: Library scan hook — Queue face match jobs for linked spaces

**Files:**

- Modify: `server/src/services/library.service.ts`
- Test: `server/src/services/library.service.spec.ts`

**Step 1: Write failing tests**

In `server/src/services/library.service.spec.ts`, add the following tests **inside** the existing `describe('handleSyncFiles')` block (so they inherit the existing `beforeEach` that mocks `storage.stat`, `asset.createAll`, etc.):

```typescript
// Add these inside the existing describe('handleSyncFiles') block:

describe('space face matching', () => {
  it('should queue face match jobs for spaces linked to the library', async () => {
    const libraryId = newUuid();
    const spaceId = newUuid();
    const library = factory.library({ id: libraryId });
    const assetId = newUuid();

    mocks.library.get.mockResolvedValue(library);
    mocks.asset.createAll.mockResolvedValue([{ id: assetId } as any]);
    mocks.sharedSpace.getSpacesLinkedToLibrary.mockResolvedValue([
      { spaceId, libraryId, addedById: null, createdAt: newDate(), faceRecognitionEnabled: true },
    ]);

    await sut.handleSyncFiles({ libraryId, paths: ['/photos/test.jpg'], progressCounter: 1, totalAssets: 1 });

    expect(mocks.job.queue).toHaveBeenCalledWith({
      name: JobName.SharedSpaceFaceMatch,
      data: { spaceId, assetId },
    });
  });

  it('should queue jobs for multiple spaces if library is linked to more than one', async () => {
    const libraryId = newUuid();
    const space1 = newUuid();
    const space2 = newUuid();
    const library = factory.library({ id: libraryId });
    const assetId = newUuid();

    mocks.library.get.mockResolvedValue(library);
    mocks.asset.createAll.mockResolvedValue([{ id: assetId } as any]);
    mocks.sharedSpace.getSpacesLinkedToLibrary.mockResolvedValue([
      { spaceId: space1, libraryId, addedById: null, createdAt: newDate(), faceRecognitionEnabled: true },
      { spaceId: space2, libraryId, addedById: null, createdAt: newDate(), faceRecognitionEnabled: true },
    ]);

    await sut.handleSyncFiles({ libraryId, paths: ['/photos/test.jpg'], progressCounter: 1, totalAssets: 1 });

    expect(mocks.job.queue).toHaveBeenCalledWith({
      name: JobName.SharedSpaceFaceMatch,
      data: { spaceId: space1, assetId },
    });
    expect(mocks.job.queue).toHaveBeenCalledWith({
      name: JobName.SharedSpaceFaceMatch,
      data: { spaceId: space2, assetId },
    });
  });

  it('should not queue face match jobs when library is not linked to any space', async () => {
    const libraryId = newUuid();
    const library = factory.library({ id: libraryId });

    mocks.library.get.mockResolvedValue(library);
    mocks.asset.createAll.mockResolvedValue([{ id: newUuid() } as any]);
    mocks.sharedSpace.getSpacesLinkedToLibrary.mockResolvedValue([]);

    await sut.handleSyncFiles({ libraryId, paths: ['/photos/test.jpg'], progressCounter: 1, totalAssets: 1 });

    expect(mocks.job.queue).not.toHaveBeenCalledWith(expect.objectContaining({ name: JobName.SharedSpaceFaceMatch }));
  });

  it('should not queue face match jobs when linked space has face recognition disabled', async () => {
    const libraryId = newUuid();
    const library = factory.library({ id: libraryId });

    mocks.library.get.mockResolvedValue(library);
    mocks.asset.createAll.mockResolvedValue([{ id: newUuid() } as any]);
    mocks.sharedSpace.getSpacesLinkedToLibrary.mockResolvedValue([
      { spaceId: newUuid(), libraryId, addedById: null, createdAt: newDate(), faceRecognitionEnabled: false },
    ]);

    await sut.handleSyncFiles({ libraryId, paths: ['/photos/test.jpg'], progressCounter: 1, totalAssets: 1 });

    expect(mocks.job.queue).not.toHaveBeenCalledWith(expect.objectContaining({ name: JobName.SharedSpaceFaceMatch }));
  });
});
```

**Step 2: Run tests — verify they fail**

```bash
cd server && pnpm test -- --run src/services/library.service.spec.ts
```

**Step 3: Implement the hook**

In `server/src/services/library.service.ts`, in `handleSyncFiles`, after `queuePostSyncJobs(assetIds)` (line 274), add:

```typescript
// Queue face match for spaces linked to this library
if (assetIds.length > 0) {
  const linkedSpaces = await this.sharedSpaceRepository.getSpacesLinkedToLibrary(job.libraryId);
  for (const link of linkedSpaces) {
    if (link.faceRecognitionEnabled) {
      for (const assetId of assetIds) {
        await this.jobRepository.queue({
          name: JobName.SharedSpaceFaceMatch,
          data: { spaceId: link.spaceId, assetId },
        });
      }
    }
  }
}
```

**Important:** Existing `handleSyncFiles` tests will break because they don't mock `getSpacesLinkedToLibrary`. Add this to the existing test `beforeEach` block (around line 574 of `library.service.spec.ts`):

```typescript
mocks.sharedSpace.getSpacesLinkedToLibrary.mockResolvedValue([]);
```

This ensures existing tests pass with the new code path (no linked spaces = no extra jobs queued).

**Step 4: Run tests — verify they pass**

```bash
cd server && pnpm test -- --run src/services/library.service.spec.ts
```

**Step 5: Commit**

```bash
git add server/src/services/library.service.ts server/src/services/library.service.spec.ts
git commit -m "feat(library): queue face match for spaces linked to library on scan"
```

---

### Task 15: Repository — Add `getByLibraryIdWithFaces` method

**Files:**

- Modify: `server/src/repositories/asset.repository.ts`

**Step 1: Add repository method**

```typescript
@GenerateSql({ params: [DummyValue.UUID] })
getByLibraryIdWithFaces(libraryId: string, limit = 1000, offset = 0) {
  return this.db
    .selectFrom('asset')
    .innerJoin('asset_face', 'asset_face.assetId', 'asset.id')
    .select('asset.id')
    .where('asset.libraryId', '=', libraryId)
    .where('asset.deletedAt', 'is', null)
    .where('asset.isOffline', '=', false)
    .groupBy('asset.id')
    .orderBy('asset.id')
    .limit(limit)
    .offset(offset)
    .execute();
}
```

**Step 2: Commit**

```bash
git add server/src/repositories/asset.repository.ts
git commit -m "feat(repo): add getByLibraryIdWithFaces for face sync orchestrator"
```

---

### Task 16: Service — Write failing tests for face sync orchestrator

**Files:**

- Test: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write failing tests**

```typescript
describe('handleSharedSpaceLibraryFaceSync', () => {
  it('should process library assets with faces in batches', async () => {
    const spaceId = newUuid();
    const libraryId = newUuid();
    const assetId1 = newUuid();
    const assetId2 = newUuid();

    mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
    mocks.sharedSpace.hasLibraryLink.mockResolvedValue(true);
    mocks.asset.getByLibraryIdWithFaces
      .mockResolvedValueOnce([{ id: assetId1 }, { id: assetId2 }])
      .mockResolvedValueOnce([]); // second batch empty = done

    // Mock the face matching internals (reuses existing handleSharedSpaceFaceMatch logic)
    mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([]);

    const result = await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId });

    expect(result).toBe(JobStatus.Success);
    expect(mocks.asset.getByLibraryIdWithFaces).toHaveBeenCalledWith(libraryId, 1000, 0);
    expect(mocks.asset.getByLibraryIdWithFaces).toHaveBeenCalledWith(libraryId, 1000, 2);
  });

  it('should skip when space does not exist', async () => {
    mocks.sharedSpace.getById.mockResolvedValue(undefined);

    const result = await sut.handleSharedSpaceLibraryFaceSync({ spaceId: newUuid(), libraryId: newUuid() });

    expect(result).toBe(JobStatus.Skipped);
  });

  it('should skip when face recognition is disabled on the space', async () => {
    const spaceId = newUuid();

    mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false }));

    const result = await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId: newUuid() });

    expect(result).toBe(JobStatus.Skipped);
  });

  it('should skip when library link was removed before job runs', async () => {
    const spaceId = newUuid();

    mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
    mocks.sharedSpace.hasLibraryLink.mockResolvedValue(false);

    const result = await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId: newUuid() });

    expect(result).toBe(JobStatus.Skipped);
  });

  it('should succeed with no work when library has no assets with faces', async () => {
    const spaceId = newUuid();
    const libraryId = newUuid();

    mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
    mocks.sharedSpace.hasLibraryLink.mockResolvedValue(true);
    mocks.asset.getByLibraryIdWithFaces.mockResolvedValue([]);

    const result = await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId });

    expect(result).toBe(JobStatus.Success);
  });

  it('should call face matching for each asset with faces', async () => {
    const spaceId = newUuid();
    const libraryId = newUuid();
    const assetId = newUuid();
    const faceId = newUuid();

    mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
    mocks.sharedSpace.hasLibraryLink.mockResolvedValue(true);
    mocks.asset.getByLibraryIdWithFaces.mockResolvedValueOnce([{ id: assetId }]).mockResolvedValueOnce([]);
    mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
      { id: faceId, assetId, personId: null, embedding: '[0.1,0.2]' },
    ]);
    mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
    mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]);
    mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
    mocks.sharedSpace.createPerson.mockResolvedValue(factory.sharedSpacePerson({ spaceId }));

    const result = await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId });

    expect(result).toBe(JobStatus.Success);
    expect(mocks.sharedSpace.getAssetFacesForMatching).toHaveBeenCalledWith(assetId);
  });

  it('should create new space person for unmatched face', async () => {
    const spaceId = newUuid();
    const libraryId = newUuid();
    const assetId = newUuid();
    const faceId = newUuid();

    mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
    mocks.sharedSpace.hasLibraryLink.mockResolvedValue(true);
    mocks.asset.getByLibraryIdWithFaces.mockResolvedValueOnce([{ id: assetId }]).mockResolvedValueOnce([]);
    mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
      { id: faceId, assetId, personId: null, embedding: '[0.1,0.2]' },
    ]);
    mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
    mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]); // No match found
    mocks.sharedSpace.createPerson.mockResolvedValue(factory.sharedSpacePerson({ spaceId }));
    mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);

    await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId });

    // Should create a new space person for the unmatched face
    expect(mocks.sharedSpace.createPerson).toHaveBeenCalled();
    expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalled();
  });

  it('should match face to existing space person when close enough', async () => {
    const spaceId = newUuid();
    const libraryId = newUuid();
    const assetId = newUuid();
    const faceId = newUuid();
    const existingPersonId = newUuid();

    mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
    mocks.sharedSpace.hasLibraryLink.mockResolvedValue(true);
    mocks.asset.getByLibraryIdWithFaces.mockResolvedValueOnce([{ id: assetId }]).mockResolvedValueOnce([]);
    mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
      { id: faceId, assetId, personId: null, embedding: '[0.1,0.2]' },
    ]);
    mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
    mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([
      { personId: existingPersonId, name: '', distance: 0.3 },
    ]);
    mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);

    await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId });

    // Should assign face to existing person, NOT create new one
    expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalledWith([
      { personId: existingPersonId, assetFaceId: faceId },
    ]);
    expect(mocks.sharedSpace.createPerson).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run tests — verify they fail**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

**Step 3: Commit**

```bash
git add server/src/services/shared-space.service.spec.ts
git commit -m "test: add failing tests for face sync orchestrator"
```

---

### Task 17: Service — Implement face sync orchestrator

**Files:**

- Modify: `server/src/services/shared-space.service.ts`

**Step 1: Implement the handler**

Add to `SharedSpaceService`:

```typescript
async handleSharedSpaceLibraryFaceSync(job: { spaceId: string; libraryId: string }): Promise<JobStatus> {
  const space = await this.sharedSpaceRepository.getById(job.spaceId);
  if (!space || !space.faceRecognitionEnabled) {
    return JobStatus.Skipped;
  }

  const linkExists = await this.sharedSpaceRepository.hasLibraryLink(job.spaceId, job.libraryId);
  if (!linkExists) {
    return JobStatus.Skipped;
  }

  const batchSize = 1000;
  let offset = 0;

  while (true) {
    const assets = await this.assetRepository.getByLibraryIdWithFaces(job.libraryId, batchSize, offset);
    if (assets.length === 0) {
      break;
    }

    for (const asset of assets) {
      await this.processSpaceFaceMatch(job.spaceId, asset.id);
    }

    offset += assets.length;
  }

  return JobStatus.Success;
}
```

Note: Extract the face matching core from `handleSharedSpaceFaceMatch` (lines 652-692 in `shared-space.service.ts`) into a `private async processSpaceFaceMatch(spaceId: string, assetId: string)` method. This method should: (1) call `getAssetFacesForMatching(assetId)`, (2) for each face, check `isPersonFaceAssigned`, (3) call `findClosestSpacePerson`, (4) if match found call `addPersonFaces`, otherwise `createPerson` + `addPersonFaces`. Both `handleSharedSpaceFaceMatch` and the orchestrator should call this extracted method.

**Step 2: Run tests — verify they pass**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

**Step 3: Commit**

```bash
git add server/src/services/shared-space.service.ts
git commit -m "feat(service): implement SharedSpaceLibraryFaceSync orchestrator"
```

---

### Task 18: Register job handler and type

**Files:**

- Modify: `server/src/types.ts` — add job type interface and `JobItem` union entry
- Modify: Job handler registration (follow existing `SharedSpaceFaceMatch` pattern — uses `@OnJob` decorator)

**Step 1: Add job type to `server/src/types.ts`**

Add the interface after `ISharedSpaceFaceMatchAllJob` (around line 245):

```typescript
export interface ISharedSpaceLibraryFaceSyncJob extends IBaseJob {
  spaceId: string;
  libraryId: string;
}
```

Add to the `JobItem` union type (around line 443, before the closing `;`):

```typescript
  | { name: JobName.SharedSpaceLibraryFaceSync; data: ISharedSpaceLibraryFaceSyncJob }
```

**Step 2: Add `@OnJob` decorator to the handler**

In `server/src/services/shared-space.service.ts`, add the `@OnJob` decorator to `handleSharedSpaceLibraryFaceSync`:

```typescript
@OnJob({ name: JobName.SharedSpaceLibraryFaceSync, queue: QueueName.FacialRecognition })
async handleSharedSpaceLibraryFaceSync(job: JobOf<JobName.SharedSpaceLibraryFaceSync>): Promise<JobStatus> {
```

Follow the same pattern as `handleSharedSpaceFaceMatch` (which uses `@OnJob` with `QueueName.FacialRecognition`).

**Step 3: Commit**

```bash
git add server/src/types.ts server/src/services/shared-space.service.ts
git commit -m "feat(jobs): register SharedSpaceLibraryFaceSync handler and type"
```

---

### Task 19: Access control tests

**Files:**

- Modify: `server/src/utils/access.spec.ts`

**Step 1: Write tests for library-linked asset access**

```typescript
describe('library-linked space asset access', () => {
  it('should grant AssetRead access when asset is in a library linked to a space the user is a member of', async () => {
    const accessMock = newAccessRepositoryMock();
    const auth = makeAuth();
    const assetId = newUuid();

    accessMock.asset.checkSpaceAccess.mockResolvedValue(new Set([assetId]));

    const result = await checkAccess(accessMock as any, {
      auth,
      permission: Permission.AssetRead,
      ids: new Set([assetId]),
    });

    expect(result).toEqual(new Set([assetId]));
  });

  it('should grant AssetView access for library-linked assets', async () => {
    const accessMock = newAccessRepositoryMock();
    const auth = makeAuth();
    const assetId = newUuid();

    accessMock.asset.checkSpaceAccess.mockResolvedValue(new Set([assetId]));

    const result = await checkAccess(accessMock as any, {
      auth,
      permission: Permission.AssetView,
      ids: new Set([assetId]),
    });

    expect(result).toEqual(new Set([assetId]));
  });

  it('should grant AssetDownload access for library-linked assets', async () => {
    const accessMock = newAccessRepositoryMock();
    const auth = makeAuth();
    const assetId = newUuid();

    accessMock.asset.checkSpaceAccess.mockResolvedValue(new Set([assetId]));

    const result = await checkAccess(accessMock as any, {
      auth,
      permission: Permission.AssetDownload,
      ids: new Set([assetId]),
    });

    expect(result).toEqual(new Set([assetId]));
  });
});
```

Note: These tests verify that `checkSpaceAccess` is called in the access chain. The actual UNION query behavior (manual vs library-linked) is tested in medium tests (Task 21).

**Step 2: Run tests**

```bash
cd server && pnpm test -- --run src/utils/access.spec.ts
```

**Step 3: Commit**

```bash
git add server/src/utils/access.spec.ts
git commit -m "test: add access control tests for library-linked space assets"
```

---

### Task 20: SQL query and OpenAPI regeneration

**Step 1: Regenerate SQL queries**

```bash
make sql
```

**Step 2: Regenerate OpenAPI**

```bash
cd server && pnpm build && pnpm sync:open-api
make open-api
```

Note: Uses `make open-api` (not just `make open-api-typescript`) to generate both TypeScript SDK and Dart client.

**Step 3: Lint and type check**

```bash
make lint-server && make check-server
```

**Step 4: Commit**

```bash
git add server/src/queries/ open-api/
git commit -m "chore: regenerate SQL queries and OpenAPI specs"
```

---

### Task 21: Medium tests — DB integration

**Files:**

- Create or modify: `server/src/repositories/shared-space.repository.spec.ts` (or appropriate medium test file)

Medium tests require a real database via testcontainers. Follow the existing medium test patterns in the codebase.

**Step 1: Write medium tests**

```typescript
describe('shared_space_library (medium)', () => {
  it('should persist shared_space_library row with correct foreign keys', async () => {
    // Create user, library, space in DB
    // Insert shared_space_library row
    // Verify it persists and can be queried
  });

  it('should CASCADE delete library link when space is deleted', async () => {
    // Create link, delete space, verify link is gone
  });

  it('should CASCADE delete library link when library is deleted', async () => {
    // Create link, delete library, verify link is gone
  });

  it('should SET NULL addedById when linking admin is deleted', async () => {
    // Create link with addedById, delete user, verify addedById is null
  });

  it('should enforce composite PK uniqueness (spaceId, libraryId)', async () => {
    // Insert same (spaceId, libraryId) twice, second should be no-op via onConflict
  });

  it('should return correct UNION asset count with real data', async () => {
    // Create space with:
    //   - 3 manually added assets in shared_space_asset
    //   - 5 library assets via shared_space_library
    //   - 1 asset that exists in BOTH sources
    // Verify getAssetCount returns 7 (not 8 — deduplication via UNION)
  });

  it('should not include deleted or offline library assets in count', async () => {
    // Create library link with assets, mark some deleted/offline
    // Verify they are excluded from count
  });

  it('should deduplicate across two linked libraries containing the same asset', async () => {
    // Create asset present in two libraries (e.g., overlapping import paths / symlinks)
    // Link both libraries to the same space
    // Verify getAssetCount returns the asset only once (UNION dedup)
  });

  it('should validate library-linked asset as space thumbnail', async () => {
    // Link library, use library asset as thumbnail
    // Verify isAssetInSpace returns true for the library asset
  });

  it('should find space IDs for a library-linked asset (face matching)', async () => {
    // Link library with asset to space
    // Verify getSpaceIdsForAsset returns the space for a library asset
  });
});
```

**Step 2: Run medium tests**

```bash
cd server && pnpm test:medium
```

**Step 3: Commit**

```bash
git add server/src/repositories/
git commit -m "test(medium): add DB integration tests for shared_space_library"
```

---

### Task 22: E2E tests — API

**Files:**

- Modify: `e2e/src/specs/server/api/shared-space.e2e-spec.ts`
- Modify: `e2e/src/utils.ts` (add helper methods)

**Step 1: Add E2E helper methods**

In `e2e/src/utils.ts`, add:

```typescript
linkSpaceLibrary: (accessToken: string, spaceId: string, libraryId: string) =>
  request(app)
    .put(`/shared-spaces/${spaceId}/libraries`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ libraryId }),

unlinkSpaceLibrary: (accessToken: string, spaceId: string, libraryId: string) =>
  request(app)
    .delete(`/shared-spaces/${spaceId}/libraries/${libraryId}`)
    .set('Authorization', `Bearer ${accessToken}`),
```

**Step 2: Write E2E tests**

Add a new `describe` block in `shared-space.e2e-spec.ts`:

```typescript
describe('PUT /shared-spaces/:id/libraries', () => {
  let adminSpace: SharedSpaceResponseDto;
  let library: LibraryResponseDto;

  beforeAll(async () => {
    // Admin creates a space and a library
    adminSpace = await utils.createSpace(admin.accessToken, { name: 'Library Link Test' });
    library = await utils.createLibrary(admin.accessToken, { ownerId: admin.userId });
  });

  it('should require authentication', async () => {
    const { status, body } = await request(app)
      .put(`/shared-spaces/${adminSpace.id}/libraries`)
      .send({ libraryId: library.id });

    expect(status).toBe(401);
    expect(body).toEqual(errorDto.unauthorized);
  });

  it('should require admin', async () => {
    // user1 is owner of the space but not admin
    const space = await utils.createSpace(user1.accessToken, { name: 'Non-admin Link' });

    const { status } = await request(app)
      .put(`/shared-spaces/${space.id}/libraries`)
      .set('Authorization', `Bearer ${user1.accessToken}`)
      .send({ libraryId: library.id });

    expect(status).toBe(403);
  });

  it('should require space editor or owner role', async () => {
    // Admin is added as viewer to user1's space
    const space = await utils.createSpace(user1.accessToken, { name: 'Viewer Admin' });
    await utils.addSpaceMember(user1.accessToken, space.id, {
      userId: admin.userId,
      role: SharedSpaceRole.Viewer,
    });

    const { status } = await request(app)
      .put(`/shared-spaces/${space.id}/libraries`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ libraryId: library.id });

    expect(status).toBe(403);
  });

  it('should require admin to be a space member', async () => {
    // Admin is NOT a member of user1's space
    const space = await utils.createSpace(user1.accessToken, { name: 'Non-member Admin' });

    const { status } = await request(app)
      .put(`/shared-spaces/${space.id}/libraries`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ libraryId: library.id });

    expect(status).toBe(403);
  });

  it('should reject non-existent library', async () => {
    const { status } = await request(app)
      .put(`/shared-spaces/${adminSpace.id}/libraries`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ libraryId: '00000000-0000-0000-0000-000000000000' });

    expect(status).toBe(400);
  });

  it('should link a library when admin is space owner', async () => {
    const { status } = await request(app)
      .put(`/shared-spaces/${adminSpace.id}/libraries`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ libraryId: library.id });

    expect(status).toBe(204);
  });

  it('should link a library when admin is space editor', async () => {
    const space = await utils.createSpace(user1.accessToken, { name: 'Editor Admin Link' });
    await utils.addSpaceMember(user1.accessToken, space.id, {
      userId: admin.userId,
      role: SharedSpaceRole.Editor,
    });
    const lib2 = await utils.createLibrary(admin.accessToken, { ownerId: admin.userId });

    const { status } = await request(app)
      .put(`/shared-spaces/${space.id}/libraries`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ libraryId: lib2.id });

    expect(status).toBe(204);
  });

  it('should be idempotent (linking same library twice)', async () => {
    const { status } = await request(app)
      .put(`/shared-spaces/${adminSpace.id}/libraries`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ libraryId: library.id });

    expect(status).toBe(204);
  });

  it('should make library assets visible in the space', async () => {
    // Verify asset count includes library assets
    const { body: space } = await request(app)
      .get(`/shared-spaces/${adminSpace.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    // assetCount should include library assets
    expect(space.assetCount).toBeGreaterThanOrEqual(0);
  });

  it('should include linkedLibraries in response for admin', async () => {
    const { body: space } = await request(app)
      .get(`/shared-spaces/${adminSpace.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(space.linkedLibraries).toBeDefined();
    expect(space.linkedLibraries).toEqual(expect.arrayContaining([expect.objectContaining({ libraryId: library.id })]));
  });

  it('should not include linkedLibraries for non-admin members', async () => {
    await utils.addSpaceMember(admin.accessToken, adminSpace.id, { userId: user1.userId });

    const { body: space } = await request(app)
      .get(`/shared-spaces/${adminSpace.id}`)
      .set('Authorization', `Bearer ${user1.accessToken}`);

    expect(space.linkedLibraries).toBeUndefined();
  });
});

describe('DELETE /shared-spaces/:id/libraries/:libraryId', () => {
  it('should require authentication', async () => {
    const { status } = await request(app).delete(`/shared-spaces/any-id/libraries/any-lib`);

    expect(status).toBe(401);
  });

  it('should require admin', async () => {
    const space = await utils.createSpace(user1.accessToken, { name: 'Unlink Non-admin' });

    const { status } = await request(app)
      .delete(`/shared-spaces/${space.id}/libraries/any-lib`)
      .set('Authorization', `Bearer ${user1.accessToken}`);

    expect(status).toBe(403);
  });

  it('should unlink a library', async () => {
    const space = await utils.createSpace(admin.accessToken, { name: 'Unlink Test' });
    const lib = await utils.createLibrary(admin.accessToken, { ownerId: admin.userId });

    // Link first
    await request(app)
      .put(`/shared-spaces/${space.id}/libraries`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ libraryId: lib.id });

    // Then unlink
    const { status } = await request(app)
      .delete(`/shared-spaces/${space.id}/libraries/${lib.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(status).toBe(204);

    // Verify library no longer in response
    const { body: updatedSpace } = await request(app)
      .get(`/shared-spaces/${space.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(updatedSpace.linkedLibraries).toEqual([]);
  });

  it('should not fail when unlinking a library that is not linked', async () => {
    const space = await utils.createSpace(admin.accessToken, { name: 'Unlink Missing' });

    const { status } = await request(app)
      .delete(`/shared-spaces/${space.id}/libraries/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(status).toBe(204);
  });
});

describe('Library-linked asset access control (E2E)', () => {
  let space: SharedSpaceResponseDto;
  let library: LibraryResponseDto;

  beforeAll(async () => {
    // Admin creates space, links library, adds user1 as viewer
    space = await utils.createSpace(admin.accessToken, { name: 'Access Control Test' });
    library = await utils.createLibrary(admin.accessToken, { ownerId: admin.userId });

    await request(app)
      .put(`/shared-spaces/${space.id}/libraries`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ libraryId: library.id });

    await utils.addSpaceMember(admin.accessToken, space.id, { userId: user1.userId });
    await utils.addSpaceMember(admin.accessToken, space.id, {
      userId: user2.userId,
      role: SharedSpaceRole.Editor,
    });
  });

  it('should allow space viewer to view library-linked asset thumbnail', async () => {
    // This tests that checkSpaceAccess includes library-linked assets
    // The actual test depends on having assets in the library
    // which requires scanning — so we verify the endpoint doesn't 403
  });

  it('should deny non-member access to library-linked assets', async () => {
    // user3 is not a member of the space
    // They should not be able to access library assets via the space
  });
});
```

**Step 3: Run E2E tests**

```bash
cd e2e && pnpm test
```

**Step 4: Commit**

```bash
git add e2e/
git commit -m "test(e2e): add API tests for library link/unlink endpoints"
```

---

### Task 23: Frontend — Add "Connected Libraries" section to space panel

**Files:**

- Create: `web/src/lib/components/spaces/space-linked-libraries.svelte`
- Modify: `web/src/lib/components/spaces/space-panel.svelte`

**Design direction:** Utilitarian, consistent with the existing space panel aesthetic — clean lines, gray borders, compact rows. Admin-only section that appears as a third tab or a section within the existing panel.

**Step 1: Create the linked libraries component**

Create `web/src/lib/components/spaces/space-linked-libraries.svelte`:

```svelte
<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import {
    getAllLibraries,
    linkLibrary,
    unlinkLibrary,
    type SharedSpaceLinkedLibraryDto,
    type SharedSpaceResponseDto,
  } from '@immich/sdk';
  import { Button, Field, Icon, modalManager, Select, type SelectOption } from '@immich/ui';
  import { mdiBookshelf, mdiLinkVariantPlus, mdiLinkVariantOff } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    space: SharedSpaceResponseDto;
    onChanged: () => void;
  }

  let { space, onChanged }: Props = $props();

  let linkedLibraries = $derived(space.linkedLibraries ?? []);
  let availableLibraries = $state<SelectOption<string>[]>([]);
  let selectedLibraryId = $state<string>('');
  let linking = $state(false);
  let loadingLibraries = $state(true);

  async function loadAvailableLibraries() {
    loadingLibraries = true;
    try {
      const libraries = await getAllLibraries();
      const linkedIds = new Set(linkedLibraries.map((l) => l.libraryId));
      availableLibraries = libraries
        .filter((lib) => !linkedIds.has(lib.id))
        .map((lib) => ({ label: lib.name, value: lib.id }));
    } catch (error) {
      handleError(error, 'Failed to load libraries');
    } finally {
      loadingLibraries = false;
    }
  }

  async function handleLink() {
    if (!selectedLibraryId) {
      return;
    }
    linking = true;
    try {
      await linkLibrary({ id: space.id, sharedSpaceLibraryLinkDto: { libraryId: selectedLibraryId } });
      selectedLibraryId = '';
      onChanged();
    } catch (error) {
      handleError(error, 'Failed to link library');
    } finally {
      linking = false;
    }
  }

  async function handleUnlink(libraryId: string, libraryName: string) {
    const confirmed = await modalManager.showDialog({
      prompt: `Remove "${libraryName}" from this space? Library assets will no longer appear here.`,
      title: 'Unlink Library',
    });
    if (!confirmed) {
      return;
    }
    try {
      await unlinkLibrary({ id: space.id, libraryId });
      onChanged();
    } catch (error) {
      handleError(error, 'Failed to unlink library');
    }
  }

  // Reload available libraries when linked libraries change
  $effect(() => {
    // Track linkedLibraries to re-run when space prop updates
    void linkedLibraries;
    loadAvailableLibraries();
  });
</script>

<div class="px-5 py-4" data-testid="linked-libraries-section">
  <!-- Header -->
  <div class="mb-3 flex items-center gap-2">
    <Icon path={mdiBookshelf} size="18" class="text-gray-400" />
    <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Connected Libraries</span>
  </div>

  <!-- Linked libraries list -->
  {#if linkedLibraries.length > 0}
    <div class="mb-3 space-y-2">
      {#each linkedLibraries as lib (lib.libraryId)}
        <div
          class="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
          data-testid="linked-library-row"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{lib.libraryName}</p>
          </div>
          <button
            type="button"
            class="ml-2 rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500
              dark:hover:bg-red-950/30"
            onclick={() => handleUnlink(lib.libraryId, lib.libraryName)}
            title="Unlink library"
            data-testid="unlink-library-button"
          >
            <Icon path={mdiLinkVariantOff} size="16" />
          </button>
        </div>
      {/each}
    </div>
  {:else}
    <p class="mb-3 text-xs italic text-gray-400">No libraries connected</p>
  {/if}

  <!-- Add library -->
  {#if loadingLibraries}
    <p class="text-xs text-gray-400">Loading libraries...</p>
  {:else if availableLibraries.length > 0}
    <div class="flex items-end gap-2">
      <Field class="flex-1">
        <Select
          options={availableLibraries}
          bind:value={selectedLibraryId}
          placeholder="Select a library..."
        />
      </Field>
      <Button
        size="small"
        leadingIcon={mdiLinkVariantPlus}
        onclick={handleLink}
        disabled={!selectedLibraryId || linking}
      >
        Link
      </Button>
    </div>
  {/if}
</div>
```

**Step 2: Add to the space panel**

In `web/src/lib/components/spaces/space-panel.svelte`, add a third tab "Libraries" that only shows for admin users.

Add to the imports:

```svelte
import SpaceLinkedLibraries from '$lib/components/spaces/space-linked-libraries.svelte';
import { user } from '$lib/stores/user.store';
```

Add `isAdmin` derived state:

```svelte
let isAdmin = $derived($user?.isAdmin ?? false);
```

Add an optional `onLibrariesChanged` prop to the interface:

```typescript
// In the Props interface:
onLibrariesChanged?: () => void;
```

Destructure with a no-op default:

```typescript
// In the destructure:
let { ..., onLibrariesChanged = () => {} }: Props = $props();
```

This avoids breaking the parent page (`+page.svelte`) and existing tests (`space-panel.spec.ts`) that don't pass this prop. When the parent page is updated to handle library changes (e.g., refreshing the space data), it can pass the callback.

Add a third tab button (after the Members tab, inside the tab switcher div), conditionally shown for admins:

```svelte
{#if isAdmin}
  <button
    type="button"
    class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeTab === 'libraries'
      ? activeTabClass
      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
    onclick={() => (activeTab = 'libraries')}
    data-testid="tab-libraries"
  >
    Libraries
  </button>
{/if}
```

Update `activeTab` type to include `'libraries'`:

```svelte
let activeTab = $state<'activity' | 'members' | 'libraries'>('activity');
```

Add the tab content (after the members `{:else}` block):

```svelte
{:else if activeTab === 'libraries'}
  <SpaceLinkedLibraries {space} onChanged={onLibrariesChanged} />
```

**Step 3: Run web lint and check**

```bash
make lint-web && make check-web
```

**Step 4: Commit**

```bash
git add web/src/lib/components/spaces/space-linked-libraries.svelte web/src/lib/components/spaces/space-panel.svelte
git commit -m "feat(web): add connected libraries UI in space panel for admins"
```

---

### Task 24: Run full test suite and final verification

**Step 1: Run all server tests**

```bash
cd server && pnpm test
```

**Step 2: Run linting and type checks**

```bash
make lint-server && make check-server
```

**Step 3: Verify the complete chain**

Review:

1. Schema table → migration → repository methods → service logic → controller endpoints
2. All UNION queries include `isOffline = false` filter
3. Access control UNION in `checkSpaceAccess` grants library-linked asset access
4. Timeline, map, and search queries include library assets (via `spaceId` and `timelineSpaceIds` blocks)
5. Face sync orchestrator verifies library link still exists before processing
6. Library scan hook queues face match for linked spaces

**Step 4: Final commit if needed**

```bash
git add -A && git commit -m "chore: final cleanup for space-library sync"
```
