# People Sort Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make global and space people ordering consistently follow favorites first, named people alphabetically, and unnamed people by photo count descending without breaking pagination.

**Architecture:** Server queries define canonical paginated order. The web comparator mirrors that contract only for already-loaded rows after local edits. Tests are written first for comparator behavior, page rendering, and server pagination/order boundaries.

**Tech Stack:** TypeScript, Svelte 5, Vitest, NestJS, Kysely SQL, pnpm workspaces.

---

## File Map

- Modify `web/src/lib/utils/people-utils.ts`: add count-aware people management comparator and keep a compatibility export.
- Modify `web/src/lib/utils/people-utils.spec.ts`: pure comparator tests for named, unnamed, favorites, whitespace, missing counts, and tiebreaks.
- Modify `web/src/routes/(user)/people/+page.svelte`: use the renamed comparator.
- Modify `web/src/routes/(user)/people/people-page.spec.ts`: page-level coverage for favorite unnamed and unnamed count ordering.
- Modify `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`: use the renamed comparator.
- Modify `web/src/routes/(user)/spaces/[spaceId]/people/space-people-page.spec.ts`: page-level coverage for unnamed `assetCount` ordering and rename behavior.
- Modify `server/src/repositories/person.repository.ts`: make non-shared people SQL use trimmed name, count only for unnamed, and id tiebreak.
- Modify `server/src/repositories/face-identity.repository.ts`: make identity-aware people SQL include favorite ordering, trimmed names, count ordering for unnamed, and id tiebreak.
- Modify `server/src/repositories/shared-space.repository.ts`: ensure `withHidden` space people ordering puts visible before hidden, trims names, and keeps unnamed `assetCount` ordering.
- Modify `server/src/services/person.service.spec.ts`: service-level tests for non-shared and identity-aware ordering contracts where repository results are mocked.
- Modify `server/src/services/shared-space.service.spec.ts`: service-level tests that preserve repository order, aliases, hidden behavior, and unnamed count cases.
- Modify `e2e/src/specs/server/api/person.e2e-spec.ts`: API-level ordering and pagination coverage for real `/people` data.
- Modify `e2e/src/specs/server/api/shared-space.e2e-spec.ts`: API-level ordering coverage for real `/shared-spaces/:id/people` data.
- Generated SQL snapshots in `server/src/queries/*.sql` are updated by `pnpm --filter immich run sync:sql` after repository query changes.

## Task 1: Pure Web Comparator

**Files:**

- Modify: `web/src/lib/utils/people-utils.ts`
- Test: `web/src/lib/utils/people-utils.spec.ts`

- [ ] **Step 1: Write failing comparator tests**

Add tests to `web/src/lib/utils/people-utils.spec.ts` for the exported comparator. Use this shape:

```ts
import { sortPeopleForManagement } from './people-utils';

describe('sortPeopleForManagement', () => {
  const p = (overrides: {
    id: string;
    name?: string | null;
    isFavorite?: boolean;
    numberOfAssets?: number;
    assetCount?: number;
    isHidden?: boolean;
  }) => overrides;

  it('sorts favorites first, named people alphabetically, then unnamed by count descending', () => {
    const people = [
      p({ id: 'unnamed-low', name: '', numberOfAssets: 1 }),
      p({ id: 'named-z', name: 'Zoe', numberOfAssets: 99 }),
      p({ id: 'favorite-unnamed-high', name: '', isFavorite: true, numberOfAssets: 10 }),
      p({ id: 'named-a', name: 'Alice', numberOfAssets: 1 }),
      p({ id: 'unnamed-high', name: '', numberOfAssets: 50 }),
      p({ id: 'favorite-named', name: 'Beth', isFavorite: true, numberOfAssets: 1 }),
    ];

    expect(sortPeopleForManagement(people).map((person) => person.id)).toEqual([
      'favorite-named',
      'favorite-unnamed-high',
      'named-a',
      'named-z',
      'unnamed-high',
      'unnamed-low',
    ]);
  });

  it('treats whitespace-only names as unnamed and uses assetCount for space people', () => {
    const people = [
      p({ id: 'space-unnamed-low', name: '   ', assetCount: 2 }),
      p({ id: 'space-named', name: 'anna', assetCount: 1 }),
      p({ id: 'space-unnamed-high', name: '', assetCount: 9 }),
    ];

    expect(sortPeopleForManagement(people).map((person) => person.id)).toEqual([
      'space-named',
      'space-unnamed-high',
      'space-unnamed-low',
    ]);
  });

  it('uses case-insensitive names, missing counts as zero, and id as final tiebreak', () => {
    const people = [
      p({ id: 'unnamed-b', name: '', numberOfAssets: undefined }),
      p({ id: 'named-b', name: 'bob' }),
      p({ id: 'unnamed-a', name: '', numberOfAssets: 0 }),
      p({ id: 'named-a', name: 'Alice' }),
    ];

    expect(sortPeopleForManagement(people).map((person) => person.id)).toEqual([
      'named-a',
      'named-b',
      'unnamed-a',
      'unnamed-b',
    ]);
  });
});
```

- [ ] **Step 2: Run comparator tests and confirm failure**

Run:

```bash
pnpm --filter immich-web test -- src/lib/utils/people-utils.spec.ts --run
```

Expected: FAIL because `sortPeopleForManagement` is not exported or does not sort counts.

- [ ] **Step 3: Implement the comparator**

In `web/src/lib/utils/people-utils.ts`, replace the narrow sort type and comparator with:

```ts
export type SortablePerson = {
  id: string;
  name?: string | null;
  isFavorite?: boolean;
  isHidden?: boolean;
  numberOfAssets?: number | null;
  assetCount?: number | null;
};

const getSortablePersonName = (person: SortablePerson) => person.name?.trim() ?? '';
const getSortablePersonCount = (person: SortablePerson) => person.numberOfAssets ?? person.assetCount ?? 0;

export function comparePeopleForManagement(a: SortablePerson, b: SortablePerson): number {
  if (!!a.isHidden !== !!b.isHidden) {
    return a.isHidden ? 1 : -1;
  }

  if (!!a.isFavorite !== !!b.isFavorite) {
    return a.isFavorite ? -1 : 1;
  }

  const aName = getSortablePersonName(a);
  const bName = getSortablePersonName(b);
  const aHasName = aName.length > 0;
  const bHasName = bName.length > 0;
  if (aHasName !== bHasName) {
    return aHasName ? -1 : 1;
  }

  if (aHasName && bHasName) {
    const nameCompare = aName.localeCompare(bName, undefined, { sensitivity: 'base' });
    if (nameCompare !== 0) {
      return nameCompare;
    }
  }

  if (!aHasName && !bHasName) {
    const countCompare = getSortablePersonCount(b) - getSortablePersonCount(a);
    if (countCompare !== 0) {
      return countCompare;
    }
  }

  return a.id.localeCompare(b.id);
}

export function sortPeopleForManagement<T extends SortablePerson>(people: T[]): T[] {
  return [...people].sort(comparePeopleForManagement);
}

export const comparePeopleByFavoriteAndName = comparePeopleForManagement;
export const sortPeopleByFavoriteAndName = sortPeopleForManagement;
```

- [ ] **Step 4: Run comparator tests and confirm pass**

Run:

```bash
pnpm --filter immich-web test -- src/lib/utils/people-utils.spec.ts --run
```

Expected: PASS for the new comparator tests.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/utils/people-utils.ts web/src/lib/utils/people-utils.spec.ts
git commit -m "test: cover people management sorting"
```

## Task 2: Global and Space Page Sorting Tests

**Files:**

- Modify: `web/src/routes/(user)/people/+page.svelte`
- Test: `web/src/routes/(user)/people/people-page.spec.ts`
- Modify: `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`
- Test: `web/src/routes/(user)/spaces/[spaceId]/people/space-people-page.spec.ts`

- [ ] **Step 1: Write failing route tests**

In `web/src/routes/(user)/people/people-page.spec.ts`, update the existing ordering test to include multiple unnamed people and a favorite unnamed person:

```ts
it('renders favorites first, named people alphabetically, then unnamed people by photo count', () => {
  renderPage([
    makePerson({ id: 'unnamed-low', name: '', isFavorite: false, numberOfAssets: 1 }),
    makePerson({ id: 'named-z', name: 'Zoe', isFavorite: false, numberOfAssets: 99 }),
    makePerson({ id: 'favorite-unnamed', name: '', isFavorite: true, numberOfAssets: 7 }),
    makePerson({ id: 'named-a', name: 'Alice', isFavorite: false, numberOfAssets: 1 }),
    makePerson({ id: 'unnamed-high', name: '', isFavorite: false, numberOfAssets: 12 }),
    makePerson({ id: 'favorite-named', name: 'Anna', isFavorite: true, numberOfAssets: 1 }),
  ]);

  expect(screen.getAllByPlaceholderText('add_a_name').map((input) => (input as HTMLInputElement).value)).toEqual([
    'Anna',
    '',
    'Alice',
    'Zoe',
    '',
    '',
  ]);
});
```

In `web/src/routes/(user)/spaces/[spaceId]/people/space-people-page.spec.ts`, update the ordering test:

```ts
it('renders named people alphabetically before unnamed people sorted by asset count', () => {
  renderPage([
    makeSpacePerson({ id: 'space-person-unnamed-low', name: '', assetCount: 1 }),
    makeSpacePerson({ id: 'space-person-zoe', name: 'Zoe', assetCount: 99 }),
    makeSpacePerson({ id: 'space-person-unnamed-high', name: '', assetCount: 20 }),
    makeSpacePerson({ id: 'space-person-alice', name: 'Alice', assetCount: 1 }),
  ]);

  expect(screen.getAllByPlaceholderText('add_a_name').map((input) => (input as HTMLInputElement).value)).toEqual([
    'Alice',
    'Zoe',
    '',
    '',
  ]);
});
```

- [ ] **Step 2: Run route tests and confirm failure before page import changes**

Run:

```bash
pnpm --filter immich-web test -- src/routes/\(user\)/people/people-page.spec.ts src/routes/\(user\)/spaces/\[spaceId\]/people/space-people-page.spec.ts --run
```

Expected: FAIL if the page still uses old id-only unnamed ordering.

- [ ] **Step 3: Update page imports and usage**

In both page files, change:

```ts
import { sortPeopleByFavoriteAndName } from '$lib/utils/people-utils';
```

to:

```ts
import { sortPeopleForManagement } from '$lib/utils/people-utils';
```

In `web/src/routes/(user)/people/+page.svelte`, change:

```ts
let showPeople = $derived(sortPeopleByFavoriteAndName(searchName ? searchedPeopleLocal : visiblePeople));
```

to:

```ts
let showPeople = $derived(sortPeopleForManagement(searchName ? searchedPeopleLocal : visiblePeople));
```

In `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`, change:

```ts
const visiblePeople = $derived(sortPeopleByFavoriteAndName(people.filter((p) => !p.isHidden)));
```

to:

```ts
const visiblePeople = $derived(sortPeopleForManagement(people.filter((p) => !p.isHidden)));
```

- [ ] **Step 4: Run route tests and confirm pass**

Run:

```bash
pnpm --filter immich-web test -- src/routes/\(user\)/people/people-page.spec.ts src/routes/\(user\)/spaces/\[spaceId\]/people/space-people-page.spec.ts --run
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/routes/\(user\)/people/+page.svelte web/src/routes/\(user\)/people/people-page.spec.ts web/src/routes/\(user\)/spaces/\[spaceId\]/people/+page.svelte web/src/routes/\(user\)/spaces/\[spaceId\]/people/space-people-page.spec.ts
git commit -m "fix(web): sort unnamed people by photo count"
```

## Task 3: Server Non-Shared People Ordering

**Files:**

- Modify: `server/src/repositories/person.repository.ts`
- Test: `server/src/services/person.service.spec.ts`

- [ ] **Step 1: Add service-level ordering regression test**

In `server/src/services/person.service.spec.ts`, add or extend a `getAll` test that mocks repository output in the expected order and asserts the DTO preserves repository order and counts. The service should not re-sort:

```ts
it('should preserve non-shared repository order for favorites, named people, and unnamed count ordering', async () => {
  const auth = AuthFactory.create();
  const favorite = PersonFactory.create({ id: 'favorite', name: 'Anna', isFavorite: true });
  const named = PersonFactory.create({ id: 'named', name: 'Bob', isFavorite: false });
  const unnamedHigh = PersonFactory.create({ id: 'unnamed-high', name: '', isFavorite: false });
  const unnamedLow = PersonFactory.create({ id: 'unnamed-low', name: '', isFavorite: false });

  mocks.person.getAllForUser.mockResolvedValue({
    items: [favorite, named, unnamedHigh, unnamedLow],
    hasNextPage: false,
  });
  mocks.person.getNumberOfPeople.mockResolvedValue({ total: 4, hidden: 0 });

  const result = await sut.getAll(auth, { withHidden: false, page: 1, size: 10 });

  expect(result.people.map((person) => person.id)).toEqual(['favorite', 'named', 'unnamed-high', 'unnamed-low']);
});
```

- [ ] **Step 2: Run server person service tests**

Run:

```bash
pnpm --filter immich test -- src/services/person.service.spec.ts --run
```

Expected: PASS. This locks that service does not undo repository order.

- [ ] **Step 3: Update repository SQL order**

In `server/src/repositories/person.repository.ts`, update the non-closest ordering in `getAllForUser()` to trim names and only apply count ordering to unnamed rows:

```ts
.$if(!options?.closestFaceAssetId, (qb) =>
  qb
    .orderBy(sql`NULLIF(BTRIM(person.name), '') is null`, 'asc')
    .orderBy(sql`NULLIF(BTRIM(person.name), '')`, (om) => om.asc().nullsLast())
    .orderBy(sql`CASE WHEN NULLIF(BTRIM(person.name), '') IS NULL THEN COUNT("asset_face"."assetId") END`, (om) =>
      om.desc().nullsLast(),
    )
    .orderBy('person.id'),
)
```

Keep the existing `person.isHidden asc` and `person.isFavorite desc` before this block.

- [ ] **Step 4: Run server person tests**

Run:

```bash
pnpm --filter immich test -- src/services/person.service.spec.ts --run
```

Expected: PASS.

- [ ] **Step 5: Regenerate SQL snapshots**

Run:

```bash
pnpm --filter immich run sync:sql
```

Expected: `server/src/queries/person.repository.sql` contains the trimmed name ordering, unnamed count ordering, and `person.id` tiebreak for `getAllForUser`.

- [ ] **Step 6: Commit**

```bash
git add server/src/repositories/person.repository.ts server/src/services/person.service.spec.ts server/src/queries/person.repository.sql
git commit -m "fix(server): sort non-shared people by canonical order"
```

## Task 4: Server Identity-Aware Global People Ordering

**Files:**

- Modify: `server/src/repositories/face-identity.repository.ts`
- Test: `server/src/services/person.service.spec.ts`

- [ ] **Step 1: Add service tests for identity-aware path invocation**

In `server/src/services/person.service.spec.ts`, extend existing `withSharedSpaces` tests to include a returned order containing favorite, named, and unnamed people:

```ts
it('should preserve identity-aware people ordering returned by repository', async () => {
  const auth = AuthFactory.create();
  const response = {
    total: 4,
    hidden: 0,
    hasNextPage: false,
    people: [
      { id: 'favorite', name: 'Anna', isFavorite: true, numberOfAssets: 1 },
      { id: 'named', name: 'Bob', numberOfAssets: 20 },
      { id: 'unnamed-high', name: '', numberOfAssets: 50 },
      { id: 'unnamed-low', name: '', numberOfAssets: 1 },
    ],
  };

  (mocks.faceIdentity as any).getAccessiblePeople.mockResolvedValue(response);

  await expect(sut.getAll(auth, { withSharedSpaces: true, withHidden: false, page: 1, size: 10 })).resolves.toEqual(
    response,
  );
});
```

- [ ] **Step 2: Run service tests**

Run:

```bash
pnpm --filter immich test -- src/services/person.service.spec.ts --run
```

Expected: PASS. This confirms service pass-through before repository SQL changes.

- [ ] **Step 3: Update identity page SQL**

In `server/src/repositories/face-identity.repository.ts`, update `getAccessiblePeopleIdentityPage()`:

1. Include `person."isFavorite"` in the personal branch of `accessible_profiles`.
2. Include `NULL::boolean AS "isFavorite"` in the space-person branch.
3. In `best_profiles`, select `isFavorite`.
4. Order final rows by favorite first, named first, lower trimmed name, unnamed count desc, identity id.

The final `ORDER BY` should follow this shape:

```sql
ORDER BY
  COALESCE(best_profiles."isFavorite", false) DESC,
  NULLIF(BTRIM(best_profiles.name), '') IS NULL,
  lower(NULLIF(BTRIM(best_profiles.name), '')) ASC NULLS LAST,
  CASE
    WHEN NULLIF(BTRIM(best_profiles.name), '') IS NULL THEN identity_counts."visibleAssetCount"
  END DESC NULLS LAST,
  identity_counts."identityId"
```

- [ ] **Step 4: Regenerate SQL snapshots**

Run:

```bash
pnpm --filter immich run sync:sql
```

Expected: generated query SQL includes favorite ordering and unnamed count ordering for `getAccessiblePeopleIdentityPage`.

- [ ] **Step 5: Verify generated SQL coverage**

Run:

```bash
rg -n "getAccessiblePeopleIdentityPage|isFavorite|visibleAssetCount|ORDER BY" server/src/queries/face-identity.repository.sql
```

Expected: `server/src/queries/face-identity.repository.sql` contains the generated `getAccessiblePeopleIdentityPage` query with `isFavorite`, `visibleAssetCount`, and the final `ORDER BY` terms from Step 3.

- [ ] **Step 6: Run server tests**

Run:

```bash
pnpm --filter immich test -- src/services/person.service.spec.ts --run
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add server/src/repositories/face-identity.repository.ts server/src/services/person.service.spec.ts server/src/queries/face-identity.repository.sql
git commit -m "fix(server): sort identity people by canonical order"
```

## Task 5: Server Space People Ordering

**Files:**

- Modify: `server/src/repositories/shared-space.repository.ts`
- Test: `server/src/services/shared-space.service.spec.ts`

- [ ] **Step 1: Add service test for preserving space repository order with unnamed counts**

In `server/src/services/shared-space.service.spec.ts`, add a test in the `getSpacePeople` describe block:

```ts
it('should preserve space repository order for named people and unnamed asset counts', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
  const named = { id: 'named', spaceId, name: 'Alice', isHidden: false, faceCount: 1, assetCount: 1 };
  const unnamedHigh = { id: 'unnamed-high', spaceId, name: '', isHidden: false, faceCount: 1, assetCount: 20 };
  const unnamedLow = { id: 'unnamed-low', spaceId, name: '', isHidden: false, faceCount: 1, assetCount: 2 };

  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([named, unnamedHigh, unnamedLow]);
  mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

  const result = await sut.getSpacePeople(auth, spaceId);

  expect(result.map((person) => person.id)).toEqual(['named', 'unnamed-high', 'unnamed-low']);
});
```

- [ ] **Step 2: Run shared space service tests**

Run:

```bash
pnpm --filter immich test -- src/services/shared-space.service.spec.ts --run
```

Expected: PASS. This confirms service pass-through.

- [ ] **Step 3: Update shared space repository ordering**

In `server/src/repositories/shared-space.repository.ts`, make the order explicit:

```ts
.orderBy('shared_space_person.isHidden', 'asc')
.orderBy(sql`NULLIF(BTRIM(shared_space_person.name), '')`, (om) => om.asc().nullsLast())
.orderBy(
  sql`CASE WHEN NULLIF(BTRIM(shared_space_person.name), '') IS NULL THEN "shared_space_person"."assetCount" END`,
  (om) => om.desc().nullsLast(),
)
.orderBy('shared_space_person.id')
```

- [ ] **Step 4: Regenerate SQL snapshots**

Run:

```bash
pnpm --filter immich run sync:sql
```

Expected: shared-space repository SQL snapshots update with `isHidden`, trimmed name, unnamed `assetCount`, and id order.

- [ ] **Step 5: Run shared space tests**

Run:

```bash
pnpm --filter immich test -- src/services/shared-space.service.spec.ts --run
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/repositories/shared-space.repository.ts server/src/services/shared-space.service.spec.ts server/src/queries/shared-space.repository.sql
git commit -m "fix(server): sort space people by canonical order"
```

## Task 6: API-Level Ordering Coverage

**Files:**

- Test: `e2e/src/specs/server/api/person.e2e-spec.ts`
- Test: `e2e/src/specs/server/api/shared-space.e2e-spec.ts`

- [ ] **Step 1: Extend `/people` e2e ordering assertions**

In `e2e/src/specs/server/api/person.e2e-spec.ts`, extend the existing `GET /people` setup and ordering test so it proves the actual API order with multiple unnamed people and pagination boundaries. The current file already creates named, unnamed, and favorite people; keep that fixture style and assert ids, not only names:

```ts
it('should sort visible people by favorite, name, then unnamed asset count across pages', async () => {
  const firstPage = await request(app)
    .get('/people')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .query({ page: 1, size: 5 });

  expect(firstPage.status).toBe(200);
  expect(firstPage.body.hasNextPage).toBe(true);
  expect(firstPage.body.people.map((person: PersonResponseDto) => person.id)).toEqual([
    nameBillPersonFavourite.id,
    nameFreddyPersonFavourite.id,
    nameAlicePerson.id,
    nameBobPerson.id,
    nameCharliePerson.id,
  ]);

  const secondPage = await request(app)
    .get('/people')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .query({ page: 2, size: 5 });

  expect(secondPage.status).toBe(200);
  expect(secondPage.body.people.map((person: PersonResponseDto) => person.id)).toEqual([
    multipleAssetsPerson.id,
    visiblePerson.id,
    nameNullPerson4Assets.id,
    nameNullPerson3Assets.id,
  ]);
});
```

Expected current failure before server fixes: unnamed people are not reliably ordered by count after the client/server contract changes are asserted.

- [ ] **Step 2: Extend `/shared-spaces/:id/people` e2e ordering assertions**

In `e2e/src/specs/server/api/shared-space.e2e-spec.ts`, extend the `GET /shared-spaces/:id/people (T09)` describe block.

Add these fixture variables near the existing `namedPersonId` and `unnamedPersonId` declarations:

```ts
let namedZoePersonId: string;
let unnamedHighAssetCountPersonId: string;
let unnamedLowAssetCountPersonId: string;
```

Add these rows in the T09 `beforeAll` after `unnamedPersonId` is assigned:

```ts
const zoeRes = await utils.createSpacePerson(spaceId, 'Zoe', owner.userId, spaceAssetId);
namedZoePersonId = zoeRes.spacePersonId;

const unnamedHighRes = await utils.createSpacePerson(spaceId, '', owner.userId, spaceAssetId);
unnamedHighAssetCountPersonId = unnamedHighRes.spacePersonId;

const unnamedLowRes = await utils.createSpacePerson(spaceId, '', owner.userId, spaceAssetId);
unnamedLowAssetCountPersonId = unnamedLowRes.spacePersonId;

const dbClientForCounts = await utils.connectDatabase();
await dbClientForCounts.query('UPDATE shared_space_person SET "assetCount" = 6 WHERE id = $1', [
  unnamedHighAssetCountPersonId,
]);
await dbClientForCounts.query('UPDATE shared_space_person SET "assetCount" = 3 WHERE id = $1', [
  unnamedLowAssetCountPersonId,
]);
```

Add this test in T09:

```ts
it('orders named space people alphabetically before unnamed people by asset count', async () => {
  const { status, body } = await request(app).get(`/shared-spaces/${spaceId}/people`).set(authHeaders(owner));

  expect(status).toBe(200);
  const ordered = body.map((person: { id: string }) => person.id);
  expect(ordered.indexOf(namedPersonId)).toBeLessThan(ordered.indexOf(namedZoePersonId));
  expect(ordered.indexOf(namedZoePersonId)).toBeLessThan(ordered.indexOf(unnamedHighAssetCountPersonId));
  expect(ordered.indexOf(unnamedHighAssetCountPersonId)).toBeLessThan(ordered.indexOf(unnamedLowAssetCountPersonId));
});
```

- [ ] **Step 3: Run API e2e tests and confirm failure before server query fixes**

Run:

```bash
pnpm --filter immich-e2e test -- src/specs/server/api/person.e2e-spec.ts src/specs/server/api/shared-space.e2e-spec.ts
```

Expected: FAIL on the new ordering assertions before repository ordering changes are complete.

- [ ] **Step 4: Run API e2e tests and confirm pass after server query fixes**

Run the same command after Tasks 3, 4, and 5 are implemented:

```bash
pnpm --filter immich-e2e test -- src/specs/server/api/person.e2e-spec.ts src/specs/server/api/shared-space.e2e-spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add e2e/src/specs/server/api/person.e2e-spec.ts e2e/src/specs/server/api/shared-space.e2e-spec.ts
git commit -m "test(e2e): cover people sort order"
```

## Task 7: Final Verification

**Files:**

- Verify all files changed in prior tasks.

- [ ] **Step 1: Run focused web tests**

Run:

```bash
pnpm --filter immich-web test -- src/lib/utils/people-utils.spec.ts src/routes/\(user\)/people/people-page.spec.ts src/routes/\(user\)/spaces/\[spaceId\]/people/space-people-page.spec.ts --run
```

Expected: PASS.

- [ ] **Step 2: Run focused server tests**

Run:

```bash
pnpm --filter immich test -- src/services/person.service.spec.ts src/services/shared-space.service.spec.ts --run
```

Expected: PASS.

- [ ] **Step 3: Run focused API e2e tests**

Run:

```bash
pnpm --filter immich-e2e test -- src/specs/server/api/person.e2e-spec.ts src/specs/server/api/shared-space.e2e-spec.ts
```

Expected: PASS.

- [ ] **Step 4: Run type checks for touched packages**

Run:

```bash
pnpm --filter immich-web run check:typescript
pnpm --filter immich run check
pnpm --filter immich-e2e run check
```

Expected: PASS.

- [ ] **Step 5: Review final diff**

Run:

```bash
git diff --stat main..HEAD
git diff main..HEAD -- web/src/lib/utils/people-utils.ts server/src/repositories/person.repository.ts server/src/repositories/face-identity.repository.ts server/src/repositories/shared-space.repository.ts
```

Expected: diff only covers sorting contract, tests, generated SQL snapshots, spec, and this plan.

- [ ] **Step 6: Confirm clean final status**

```bash
git status --short
```

Expected: no uncommitted changes after the final implementation commit.
