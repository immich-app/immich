# Space Person Data Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix space person names and thumbnails by reading through to the personal person via JOINs, removing the stale stored `thumbnailPath`, and rendering real face thumbnails in the filter panel.

**Architecture:** Replace one-time copy-on-create with live LEFT JOINs through `shared_space_person → asset_face → person`. Remove the `thumbnailPath` column and `SharedSpacePersonThumbnail` job. The space person `name` field becomes an override-only field (empty by default).

**Tech Stack:** NestJS + Kysely (server), Svelte 5 (web), Vitest (tests), PostgreSQL migrations

**Task ordering rationale:** Bottom-up approach — add JOINs first (backward compatible), update consumers, then remove old code last. This ensures every intermediate commit compiles and tests pass.

**Enriched type used throughout:** Repository queries return `SharedSpacePerson & { personalName: string | null; personalThumbnailPath: string | null }`. Tests mock this by spreading factory output: `{ ...factory.sharedSpacePerson({...}), personalName: 'Alice', personalThumbnailPath: '/path' }`.

---

### Task 1: Repository — Add JOINs for Personal Person Data

**Files:**

- Modify: `server/src/repositories/shared-space.repository.ts` — update 3 query methods

This is backward compatible — adds extra fields to query results without breaking existing consumers.

**Step 1: Update `getPersonsBySpaceId()`**

Replace the existing method (around line 467-473) with:

```typescript
@GenerateSql({ params: [DummyValue.UUID] })
getPersonsBySpaceId(spaceId: string) {
  return this.db
    .selectFrom('shared_space_person')
    .leftJoin('asset_face', 'asset_face.id', 'shared_space_person.representativeFaceId')
    .leftJoin('person', 'person.id', 'asset_face.personId')
    .selectAll('shared_space_person')
    .select(['person.name as personalName', 'person.thumbnailPath as personalThumbnailPath'])
    .where('shared_space_person.spaceId', '=', spaceId)
    .orderBy('shared_space_person.name', 'asc')
    .execute();
}
```

**Step 2: Update `getPersonsBySpaceIdWithTemporalFilter()`**

Replace the existing method (around line 476-496). Add the same JOINs and alias the inner `asset_face` to `af2` to avoid ambiguity:

```typescript
@GenerateSql({ params: [DummyValue.UUID, { takenAfter: DummyValue.DATE, takenBefore: DummyValue.DATE }] })
getPersonsBySpaceIdWithTemporalFilter(spaceId: string, options?: { takenAfter?: Date; takenBefore?: Date }) {
  return this.db
    .selectFrom('shared_space_person')
    .leftJoin('asset_face', 'asset_face.id', 'shared_space_person.representativeFaceId')
    .leftJoin('person', 'person.id', 'asset_face.personId')
    .selectAll('shared_space_person')
    .select(['person.name as personalName', 'person.thumbnailPath as personalThumbnailPath'])
    .where('shared_space_person.spaceId', '=', spaceId)
    .$if(!!options?.takenAfter || !!options?.takenBefore, (qb) =>
      qb.where((eb) =>
        eb.exists(
          eb
            .selectFrom('shared_space_person_face')
            .innerJoin('asset_face as af2', 'af2.id', 'shared_space_person_face.assetFaceId')
            .innerJoin('asset', 'asset.id', 'af2.assetId')
            .whereRef('shared_space_person_face.personId', '=', 'shared_space_person.id')
            .$if(!!options?.takenAfter, (qb2) => qb2.where('asset.fileCreatedAt', '>=', options!.takenAfter!))
            .$if(!!options?.takenBefore, (qb2) => qb2.where('asset.fileCreatedAt', '<', options!.takenBefore!)),
        ),
      ),
    )
    .orderBy('shared_space_person.name', 'asc')
    .execute();
}
```

**Step 3: Update `getPersonById()`**

Replace the existing method (around line 500-502):

```typescript
@GenerateSql({ params: [DummyValue.UUID] })
getPersonById(id: string) {
  return this.db
    .selectFrom('shared_space_person')
    .leftJoin('asset_face', 'asset_face.id', 'shared_space_person.representativeFaceId')
    .leftJoin('person', 'person.id', 'asset_face.personId')
    .selectAll('shared_space_person')
    .select(['person.name as personalName', 'person.thumbnailPath as personalThumbnailPath'])
    .where('shared_space_person.id', '=', id)
    .executeTakeFirst();
}
```

**Step 4: Run server tests to verify nothing breaks**

Run: `cd server && node_modules/.bin/vitest run src/services/shared-space.service.spec.ts 2>&1 | tail -30`

Expected: All existing tests still pass (extra fields are ignored by current consumers).

**Step 5: Commit**

```bash
git add server/src/repositories/shared-space.repository.ts
git commit -m "feat: add personal person JOINs to space person queries"
```

---

### Task 2: Service — TDD for `getSpacePeople()` Name and Thumbnail Resolution

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts` — add new tests, update existing tests
- Modify: `server/src/services/shared-space.service.ts` — update `getSpacePeople()` and `mapSpacePerson()`

**Step 1: Write failing test — resolves name from personal person**

In `shared-space.service.spec.ts`, find the `getSpacePeople` describe block (around line 2513). Add:

```typescript
it('should resolve name from personal person when space person has no name override', async () => {
  const person = factory.sharedSpacePerson({
    id: personId,
    name: '',
    thumbnailPath: '',
    representativeFaceId: faceId,
  });

  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ faceRecognitionEnabled: true }));
  mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
    { ...person, personalName: 'Alice', personalThumbnailPath: '/path/to/thumb.jpg' },
  ]);
  mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);
  mocks.sharedSpace.getPersonFaceCount.mockResolvedValue(3);
  mocks.sharedSpace.getPersonAssetCount.mockResolvedValue(2);

  const result = await sut.getSpacePeople(auth, spaceId);

  expect(result).toHaveLength(1);
  expect(result[0].name).toBe('Alice');
  expect(result[0].thumbnailPath).toBe('/path/to/thumb.jpg');
});
```

**Step 2: Write failing test — space person name overrides personal name**

```typescript
it('should use space person name as override when set', async () => {
  const person = factory.sharedSpacePerson({
    id: personId,
    name: 'Grandpa',
    thumbnailPath: '/path/to/thumb.jpg',
    representativeFaceId: faceId,
  });

  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ faceRecognitionEnabled: true }));
  mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
    { ...person, personalName: 'Hans', personalThumbnailPath: '/path/to/thumb.jpg' },
  ]);
  mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);
  mocks.sharedSpace.getPersonFaceCount.mockResolvedValue(3);
  mocks.sharedSpace.getPersonAssetCount.mockResolvedValue(2);

  const result = await sut.getSpacePeople(auth, spaceId);

  expect(result).toHaveLength(1);
  expect(result[0].name).toBe('Grandpa');
});
```

**Step 3: Write failing test — filters out persons with no thumbnail from personal person**

```typescript
it('should exclude persons with no thumbnail from personal person', async () => {
  const person = factory.sharedSpacePerson({
    id: personId,
    name: '',
    thumbnailPath: '',
    representativeFaceId: faceId,
  });

  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ faceRecognitionEnabled: true }));
  mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
    { ...person, personalName: 'Alice', personalThumbnailPath: '' },
  ]);
  mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

  const result = await sut.getSpacePeople(auth, spaceId);

  expect(result).toHaveLength(0);
});
```

**Step 4: Write failing test — filters out persons with null JOIN data (no linked personal person)**

```typescript
it('should exclude persons with null personal thumbnail (no linked personal person)', async () => {
  const person = factory.sharedSpacePerson({
    id: personId,
    name: '',
    thumbnailPath: '',
    representativeFaceId: null,
  });

  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ faceRecognitionEnabled: true }));
  mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
    { ...person, personalName: null, personalThumbnailPath: null },
  ]);
  mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

  const result = await sut.getSpacePeople(auth, spaceId);

  expect(result).toHaveLength(0);
});
```

**Step 5: Write failing test — space person name override with no personal person name**

```typescript
it('should use space person name override even when personal person has no name', async () => {
  const person = factory.sharedSpacePerson({
    id: personId,
    name: 'Custom Name',
    thumbnailPath: '',
    representativeFaceId: faceId,
  });

  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ faceRecognitionEnabled: true }));
  mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
    { ...person, personalName: '', personalThumbnailPath: '/path/to/thumb.jpg' },
  ]);
  mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);
  mocks.sharedSpace.getPersonFaceCount.mockResolvedValue(1);
  mocks.sharedSpace.getPersonAssetCount.mockResolvedValue(1);

  const result = await sut.getSpacePeople(auth, spaceId);

  expect(result).toHaveLength(1);
  expect(result[0].name).toBe('Custom Name');
});
```

**Step 6: Run tests to verify the new tests fail**

Run: `cd server && node_modules/.bin/vitest run src/services/shared-space.service.spec.ts 2>&1 | tail -30`

Expected: New tests fail because the service doesn't read `personalName`/`personalThumbnailPath`.

**Step 7: Update existing `getSpacePeople` tests to use enriched mock shape**

All existing tests that mock `getPersonsBySpaceId` or `getPersonsBySpaceIdWithTemporalFilter` need enriched mock data. This includes:

- "should return enriched person list" (~line 2533): Add `personalName`/`personalThumbnailPath` to mock
- "should sort people by asset count descending" (~line 2565): Same
- "should exclude people without thumbnails" (~line 2609): Change to test `personalThumbnailPath: ''` instead of `thumbnailPath: ''`
- "should filter out pets when petsEnabled is false" (~line 2639): Add enriched fields
- "should include pets when petsEnabled is true" (~line 2658): Add enriched fields
- "should filter people by temporal range" (~line 2677): Add enriched fields to temporal mock
- "should return all people when no temporal params" (~line 2708): Same
- "should exclude person with zero face assets" (~line 2733): Same

Pattern for each: change `factory.sharedSpacePerson({ ..., thumbnailPath: '/x' })` to `{ ...factory.sharedSpacePerson({ ... }), personalName: 'Name', personalThumbnailPath: '/x' }` in mock return values.

**Step 8: Implement `getSpacePeople()` changes**

In `shared-space.service.ts`, update `getSpacePeople()` (~line 569-589):

- Replace `if (!person.thumbnailPath) { continue; }` with `if (!person.personalThumbnailPath) { continue; }`

Update `mapSpacePerson()` (~line 1086) to accept the enriched type with optional new fields (optional so it also works for `getSpacePerson` and `updateSpacePerson` which will be updated in Task 4):

```typescript
private mapSpacePerson(
  person: SharedSpacePerson & { personalName?: string | null; personalThumbnailPath?: string | null },
  faceCount: number,
  assetCount: number,
  alias: string | null,
): SharedSpacePersonResponseDto {
  return {
    id: person.id,
    spaceId: person.spaceId,
    name: person.name || person.personalName || '',
    thumbnailPath: person.personalThumbnailPath || person.thumbnailPath || '',
    isHidden: person.isHidden,
    birthDate: person.birthDate,
    representativeFaceId: person.representativeFaceId,
    faceCount,
    assetCount,
    alias,
    createdAt: (person.createdAt as unknown as Date).toISOString(),
    updatedAt: (person.updatedAt as unknown as Date).toISOString(),
    type: person.type,
  };
}
```

Note: `person.thumbnailPath` is kept as a secondary fallback temporarily. It will be removed in Task 7 when the column is dropped.

**Step 9: Run tests to verify they pass**

Run: `cd server && node_modules/.bin/vitest run src/services/shared-space.service.spec.ts 2>&1 | tail -30`

Expected: All tests pass.

**Step 10: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat: resolve space person name and thumbnail from personal person via JOIN"
```

---

### Task 3: Service — TDD for `getSpacePersonThumbnail()` Using JOIN Data

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts` — update thumbnail endpoint tests
- Modify: `server/src/services/shared-space.service.ts` — simplify `getSpacePersonThumbnail()`

**Step 1: Write failing test — serves thumbnail from personal person via JOIN, no fallback chain**

Find the `getSpacePersonThumbnail` describe block in the spec file (~line 2820). Add:

```typescript
it('should serve thumbnail from personal person via JOIN data without fallback chain', async () => {
  const person = factory.sharedSpacePerson({
    id: personId,
    spaceId,
    thumbnailPath: '',
    representativeFaceId: faceId,
  });

  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
  mocks.sharedSpace.getPersonById.mockResolvedValue({
    ...person,
    personalName: 'Alice',
    personalThumbnailPath: '/upload/thumbs/person.jpg',
  });

  await sut.getSpacePersonThumbnail(auth, spaceId, personId);

  expect(mocks.person.getFaceById).not.toHaveBeenCalled();
  expect(mocks.person.getById).not.toHaveBeenCalled();
});
```

**Step 2: Write failing test — throws when personal person has no thumbnail**

```typescript
it('should throw NotFoundException when personal person has no thumbnail', async () => {
  const person = factory.sharedSpacePerson({
    id: personId,
    spaceId,
    thumbnailPath: '',
    representativeFaceId: faceId,
  });

  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
  mocks.sharedSpace.getPersonById.mockResolvedValue({
    ...person,
    personalName: 'Alice',
    personalThumbnailPath: null,
  });

  await expect(sut.getSpacePersonThumbnail(auth, spaceId, personId)).rejects.toThrow('Not Found');
});
```

**Step 3: Run tests to verify new tests fail**

Run: `cd server && node_modules/.bin/vitest run src/services/shared-space.service.spec.ts -t "getSpacePersonThumbnail" 2>&1 | tail -20`

Expected: First test fails because current code still calls `getFaceById`/`getById` in the fallback chain.

**Step 4: Update existing thumbnail tests to use enriched mock shape**

All `getSpacePersonThumbnail` tests that mock `getPersonById` need enriched data:

- "should throw NotFoundException when person has no thumbnail" (~line 2834): Change `thumbnailPath: ''` to also add `personalThumbnailPath: null`
- "should fallback to personal person thumbnail" tests: Replace with the new JOIN-based behavior
- "should throw NotFoundException when person is in different space" (~line 2897): Add enriched fields

**Step 5: Implement simplified `getSpacePersonThumbnail()`**

Replace the method (~line 612-640) with:

```typescript
async getSpacePersonThumbnail(auth: AuthDto, spaceId: string, personId: string): Promise<ImmichMediaResponse> {
  await this.requireMembership(auth, spaceId);

  const person = await this.sharedSpaceRepository.getPersonById(personId);
  if (!person || person.spaceId !== spaceId) {
    throw new NotFoundException();
  }

  const thumbnailPath = person.personalThumbnailPath;
  if (!thumbnailPath) {
    throw new NotFoundException();
  }

  return this.serveFromBackend(thumbnailPath, mimeTypes.lookup(thumbnailPath), CacheControl.PrivateWithoutCache);
}
```

**Step 6: Run tests to verify they pass**

Run: `cd server && node_modules/.bin/vitest run src/services/shared-space.service.spec.ts -t "getSpacePersonThumbnail" 2>&1 | tail -20`

Expected: All tests pass.

**Step 7: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat: simplify space person thumbnail to use JOIN data"
```

---

### Task 4: Service — Fix `getSpacePerson()` and `updateSpacePerson()` for Enriched Type

**Files:**

- Modify: `server/src/services/shared-space.service.ts` — update both methods
- Modify: `server/src/services/shared-space.service.spec.ts` — update tests

**Step 1: Write failing test — `getSpacePerson` resolves name from personal person**

In the `getSpacePerson` describe block (~line 2762), add:

```typescript
it('should resolve name from personal person when no override', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  const personId = newUuid();
  const person = factory.sharedSpacePerson({ id: personId, spaceId, name: '' });
  const space = factory.sharedSpace({ id: spaceId });

  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
  mocks.sharedSpace.getPersonById.mockResolvedValue({
    ...person,
    personalName: 'Bob',
    personalThumbnailPath: '/thumb.jpg',
  });
  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.getPersonFaceCount.mockResolvedValue(10);
  mocks.sharedSpace.getPersonAssetCount.mockResolvedValue(7);
  mocks.sharedSpace.getAlias.mockResolvedValue(void 0);

  const result = await sut.getSpacePerson(auth, spaceId, personId);

  expect(result.name).toBe('Bob');
});
```

**Step 2: Write failing test — `updateSpacePerson` returns enriched data after update**

In the `updateSpacePerson` describe block (~line 2907), add:

```typescript
it('should return enriched person with personal name after update', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  const personId = newUuid();
  const person = factory.sharedSpacePerson({ id: personId, spaceId });
  const updatedPerson = factory.sharedSpacePerson({ id: personId, spaceId, isHidden: true });

  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
  mocks.sharedSpace.getPersonById
    .mockResolvedValueOnce(person)
    .mockResolvedValueOnce({ ...updatedPerson, personalName: 'Alice', personalThumbnailPath: '/thumb.jpg' });
  mocks.sharedSpace.updatePerson.mockResolvedValue(updatedPerson);
  mocks.sharedSpace.getPersonFaceCount.mockResolvedValue(5);
  mocks.sharedSpace.getPersonAssetCount.mockResolvedValue(3);
  mocks.sharedSpace.getAlias.mockResolvedValue(void 0);
  mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

  const result = await sut.updateSpacePerson(auth, spaceId, personId, { isHidden: true });

  expect(result.name).toBe('Alice');
  expect(result.thumbnailPath).toBe('/thumb.jpg');
});
```

**Step 3: Run tests to verify they fail**

Run: `cd server && node_modules/.bin/vitest run src/services/shared-space.service.spec.ts -t "should resolve name from personal person when no override|should return enriched person with personal name" 2>&1 | tail -20`

Expected: Fails because `getSpacePerson` and `updateSpacePerson` don't use enriched data yet.

**Step 4: Update existing tests**

- `getSpacePerson` "should return enriched person" (~line 2783): Add enriched fields to `getPersonById` mock
- `getSpacePerson` "should reject access to pet person" (~line 2806): Same
- `updateSpacePerson` "should update person name" (~line 2925): Mock `getPersonById` twice — first for the initial lookup, second for the re-fetch after update, with enriched fields. **All** `updateSpacePerson` tests that reach the `updatePerson` call need this double mock pattern (including "should allow representativeFaceId" at ~line 2964).

**Step 5: Implement fixes**

In `getSpacePerson()` (~line 592-610): The `getPersonById` call already returns enriched data from Task 1 JOINs. `mapSpacePerson` already accepts optional enriched fields from Task 2. So `getSpacePerson` should work without code changes — verify by running tests.

In `updateSpacePerson()` (~line 642-681): After `updatePerson()`, re-fetch via `getPersonById()` to get enriched data:

```typescript
// Replace line 680:
// return this.mapSpacePerson(updated, faceCount, assetCount, alias?.alias ?? null);
// With:
const enriched = await this.sharedSpaceRepository.getPersonById(personId);
if (!enriched) {
  throw new BadRequestException('Person not found');
}
return this.mapSpacePerson(enriched, faceCount, assetCount, alias?.alias ?? null);
```

Also update `deleteSpacePerson()` (~line 697) to use resolved name for the activity log:

```typescript
data: { personId, personName: person.name || person.personalName || '' },
```

**Step 6: Run tests to verify they pass**

Run: `cd server && node_modules/.bin/vitest run src/services/shared-space.service.spec.ts 2>&1 | tail -30`

Expected: All tests pass.

**Step 7: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat: fix getSpacePerson and updateSpacePerson for enriched type"
```

---

### Task 5: Remove `SharedSpacePersonThumbnail` Job and Name Copying

**Files:**

- Modify: `server/src/services/shared-space.service.ts` — remove handler + queue calls + name copying
- Modify: `server/src/services/shared-space.service.spec.ts` — remove/update tests
- Modify: `server/src/enum.ts` — remove enum value
- Modify: `server/src/types.ts` — remove job type

**Step 1: Remove handler `handleSharedSpacePersonThumbnail()`**

Delete the entire method (~line 896-921) from `shared-space.service.ts`.

**Step 2: Remove queue calls in `processSpaceFaceMatch()`**

Remove the two `jobRepository.queue({ name: JobName.SharedSpacePersonThumbnail, ... })` calls (~lines 962-965 and 1006-1009).

**Step 3: Stop copying name at creation time**

In `processSpaceFaceMatch()`, replace the name lookup (~lines 949-953):

```typescript
let name = '';
const personalPerson = await this.personRepository.getById(face.personId);
if (personalPerson?.name) {
  name = personalPerson.name;
}
```

with:

```typescript
const name = '';
```

Do the same for the pet face creation path (~lines 993-997). Remove the `personRepository.getById` calls entirely.

**Step 4: Remove enum value**

In `server/src/enum.ts` (~line 718), remove:

```typescript
SharedSpacePersonThumbnail = 'SharedSpacePersonThumbnail',
```

**Step 5: Remove job type**

In `server/src/types.ts` (~line 453), remove:

```typescript
| { name: JobName.SharedSpacePersonThumbnail; data: IEntityJob }
```

**Step 6: Update tests**

- Delete the entire `handleSharedSpacePersonThumbnail` describe block (~lines 2453-2511)
- In `handleSharedSpaceFaceMatch` tests: remove assertions that `JobName.SharedSpacePersonThumbnail` was queued (~lines 2185-2188 and similar)
- "should copy personal person name when creating space person" (~line 2267): Update to expect `name: ''` always (no longer copies)
- "should use empty name when personal person has no name" (~line 2321): Should still pass (already expects empty)

**Step 7: Run tests**

Run: `cd server && node_modules/.bin/vitest run src/services/shared-space.service.spec.ts 2>&1 | tail -30`

Expected: All tests pass.

**Step 8: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts server/src/enum.ts server/src/types.ts
git commit -m "refactor: remove SharedSpacePersonThumbnail job and name copying"
```

---

### Task 6: Remove `thumbnailPath` from Schema, Types, and Factory

**Files:**

- Modify: `server/src/schema/tables/shared-space-person.table.ts` — remove column
- Modify: `server/src/database.ts` — remove from type
- Modify: `server/test/small.factory.ts` — remove from factory
- Modify: `server/src/services/shared-space.service.ts` — remove `thumbnailPath` fallback from `mapSpacePerson`
- Modify: `server/src/services/shared-space.service.spec.ts` — remove all `thumbnailPath` references in mocks

**Step 1: Remove `thumbnailPath` from table schema**

In `server/src/schema/tables/shared-space-person.table.ts`, remove:

```typescript
@Column({ default: '', type: 'character varying' })
thumbnailPath!: Generated<string>;
```

**Step 2: Remove `thumbnailPath` from database type**

In `server/src/database.ts`, remove `thumbnailPath: string;` from the `SharedSpacePerson` type (~line 368).

**Step 3: Remove `thumbnailPath` from factory**

In `server/test/small.factory.ts`, remove `thumbnailPath: '',` from the `sharedSpacePersonFactory` (~line 433).

**Step 4: Update `mapSpacePerson` — remove `thumbnailPath` fallback**

In `mapSpacePerson()`, change:

```typescript
thumbnailPath: person.personalThumbnailPath || person.thumbnailPath || '',
```

to:

```typescript
thumbnailPath: person.personalThumbnailPath || '',
```

**Step 5: Fix all remaining `thumbnailPath` references in tests**

Search for `thumbnailPath` in `shared-space.service.spec.ts` and remove all instances from `factory.sharedSpacePerson({...})` calls. The compiler will guide you — any `thumbnailPath` in a `SharedSpacePerson` context is now invalid.

**Step 6: Run tests to verify everything compiles and passes**

Run: `cd server && node_modules/.bin/vitest run src/services/shared-space.service.spec.ts 2>&1 | tail -30`

Expected: All tests pass.

**Step 7: Commit**

```bash
git add server/src/schema/tables/shared-space-person.table.ts server/src/database.ts server/test/small.factory.ts server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "refactor: remove thumbnailPath from SharedSpacePerson schema and type"
```

---

### Task 7: Database Migration

**Files:**

- Create: `server/src/schema/migrations-gallery/1775100000000-DropSpacePersonThumbnailPath.ts`

**Step 1: Write the migration**

```typescript
import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Clear stale name copies (these were copied from personal person at creation,
  // not intentional overrides — no UI exposes manual naming)
  await db.updateTable('shared_space_person').set({ name: '' }).execute();

  await db.schema.alterTable('shared_space_person').dropColumn('thumbnailPath').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('shared_space_person')
    .addColumn('thumbnailPath', 'character varying', (col) => col.defaultTo('').notNull())
    .execute();
}
```

**Step 2: Commit**

```bash
git add server/src/schema/migrations-gallery/1775100000000-DropSpacePersonThumbnailPath.ts
git commit -m "feat: add migration to drop thumbnailPath from shared_space_person"
```

---

### Task 8: Web — TDD for Filter Panel Thumbnails

**Files:**

- Modify: `web/src/lib/components/filter-panel/filter-panel.ts` — rename `thumbnailPath` to `thumbnailUrl`
- Modify: `web/src/lib/components/filter-panel/people-filter.svelte` — render `<img>` thumbnails
- Modify: `web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts` — add thumbnail tests

**Step 1: Write failing test — renders thumbnail image when URL provided**

In `filter-sections.spec.ts`, find the PeopleFilter describe block (~line 18). Add:

```typescript
it('should render thumbnail images when thumbnailUrl is provided', async () => {
  const people: PersonOption[] = [
    { id: '1', name: 'Alice', thumbnailUrl: '/shared-spaces/s1/people/1/thumbnail' },
    { id: '2', name: 'Bob', thumbnailUrl: '/shared-spaces/s1/people/2/thumbnail' },
  ];

  const { getAllByRole } = render(PeopleFilter, {
    props: { people, selectedIds: [], onSelectionChange: vi.fn() },
  });

  const images = getAllByRole('img');
  expect(images).toHaveLength(2);
  expect(images[0]).toHaveAttribute('src', '/shared-spaces/s1/people/1/thumbnail');
  expect(images[1]).toHaveAttribute('src', '/shared-spaces/s1/people/2/thumbnail');
});
```

**Step 2: Write failing test — falls back to gradient when no URL**

```typescript
it('should render gradient avatar when thumbnailUrl is not provided', async () => {
  const people: PersonOption[] = [{ id: '1', name: 'Alice' }];

  const { queryByRole, getByText } = render(PeopleFilter, {
    props: { people, selectedIds: [], onSelectionChange: vi.fn() },
  });

  expect(queryByRole('img')).toBeNull();
  expect(getByText('A')).toBeTruthy();
});
```

**Step 3: Run tests to verify they fail**

Run: `cd web && node_modules/.bin/vitest run src/lib/components/filter-panel/__tests__/filter-sections.spec.ts 2>&1 | tail -20`

Expected: Fails because `thumbnailUrl` doesn't exist on `PersonOption` and no `<img>` is rendered.

**Step 4: Update `PersonOption` interface**

In `filter-panel.ts`, change `thumbnailPath?: string` to `thumbnailUrl?: string`:

```typescript
export interface PersonOption {
  id: string;
  name: string;
  thumbnailUrl?: string;
}
```

**Step 5: Update `people-filter.svelte` — render thumbnails**

Replace the avatar div in the main people list (~lines 140-146) with:

```svelte
<!-- Avatar -->
{#if person.thumbnailUrl}
  <img
    src={person.thumbnailUrl}
    alt={person.name}
    class="h-5 w-5 flex-shrink-0 rounded-full object-cover"
  />
{:else}
  <div
    class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
    style="background: {getAvatarGradient(person.name)}"
  >
    {getInitial(person.name)}
  </div>
{/if}
```

The orphaned people section (~lines 104-109) keeps the gradient avatar since orphaned people are constructed from bare IDs and never have a `thumbnailUrl`.

**Step 6: Run tests to verify they pass**

Run: `cd web && node_modules/.bin/vitest run src/lib/components/filter-panel/__tests__/filter-sections.spec.ts 2>&1 | tail -20`

Expected: All tests pass.

**Step 7: Update existing tests that use `thumbnailPath` on `PersonOption`**

Search the test file for any existing references to `thumbnailPath` in `PersonOption` objects and rename to `thumbnailUrl`.

**Step 8: Commit**

```bash
git add web/src/lib/components/filter-panel/filter-panel.ts web/src/lib/components/filter-panel/people-filter.svelte web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
git commit -m "feat: render face thumbnails in filter panel people section"
```

---

### Task 9: Web — Update Filter Providers to Pass Thumbnail URLs

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte` — space filter provider
- Modify: `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte` — photos filter provider

**Step 1: Update space page filter provider**

In the space page `+page.svelte` (~line 166-176), first add the import for `createUrl`:

```typescript
import { createUrl } from '$lib/utils';
```

Then update the people provider to construct thumbnail URLs:

```typescript
people: async (context?: FilterContext) => {
  const people = await getSpacePeople({
    id: space.id,
    takenAfter: context?.takenAfter,
    takenBefore: context?.takenBefore,
  });
  for (const p of people) {
    personNames.set(p.id, p.name || 'Unknown');
  }
  return people.map((p) => ({
    id: p.id,
    name: p.name || 'Unknown',
    thumbnailUrl: p.thumbnailPath
      ? createUrl(`/shared-spaces/${space.id}/people/${p.id}/thumbnail`, { updatedAt: p.updatedAt })
      : undefined,
  }));
},
```

**Step 2: Update photos page filter provider**

In the photos page `+page.svelte` (~line 72-80), update:

```typescript
people: async () => {
  const response = await getAllPeople({ withHidden: false });
  for (const p of response.people) {
    personNames.set(p.id, p.name || 'Unknown');
  }
  return response.people
    .filter((p) => p.thumbnailPath)
    .map((p) => ({
      id: p.id,
      name: p.name || 'Unknown',
      thumbnailUrl: `/people/${p.id}/thumbnail`,
    }));
},
```

**Step 3: Run web tests**

Run: `cd web && node_modules/.bin/vitest run 2>&1 | tail -20`

Expected: All tests pass.

**Step 4: Commit**

```bash
git add web/src/routes/\(user\)/spaces/\[spaceId\]/\[\[photos=photos\]\]/\[\[assetId=id\]\]/+page.svelte web/src/routes/\(user\)/photos/\[\[assetId=id\]\]/+page.svelte
git commit -m "feat: pass thumbnail URLs to filter panel people providers"
```

---

### Task 10: Lint, Type Check, and Final Verification

**Step 1: Run server type check**

Run: `cd server && node_modules/.bin/tsc --noEmit 2>&1 | tail -20`

Fix any issues.

**Step 2: Run server lint**

Run: `cd server && node_modules/.bin/eslint --fix 'src/**/*.ts' 2>&1 | tail -20`

Fix any issues.

**Step 3: Run web type check**

Run: `cd web && node_modules/.bin/svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -40`

Fix any issues.

**Step 4: Format**

Run: `cd server && npx prettier --write 'src/**/*.ts' 'test/**/*.ts'`
Run: `cd web && npx prettier --write 'src/**/*.svelte' 'src/**/*.ts'`

**Step 5: Run all server tests**

Run: `cd server && node_modules/.bin/vitest run 2>&1 | tail -30`

Expected: All tests pass.

**Step 6: Run all web tests**

Run: `cd web && node_modules/.bin/vitest run 2>&1 | tail -30`

Expected: All tests pass.

**Step 7: Verify no stale references**

- Grep for `SharedSpacePersonThumbnail` — should not appear except in migration file
- Grep for `thumbnailPath` in `shared-space-person.table.ts` — should not exist
- Grep for `thumbnailPath` in `filter-panel.ts` — should not exist (replaced by `thumbnailUrl`)
- Grep for `thumbnailPath` in `small.factory.ts` near `sharedSpacePerson` — should not exist

**Step 8: Commit any fixes**

```bash
git add -A && git commit -m "chore: lint and format fixes"
```
