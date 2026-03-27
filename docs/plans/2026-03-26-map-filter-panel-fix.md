# Map Filter Panel Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 4 bugs preventing People, Location, Tags, and Rating filters from working on the map view.

**Architecture:** Fix query param parsing in the DTO (Transform/Type decorators), wire missing location fields end-to-end, use existing `hasAnyPerson`/`withAnyTagId` OR-logic helpers via flags (`personMatchAny`/`tagMatchAny`) on `searchAssetBuilder`. All server changes are TDD with unit tests first.

**Tech Stack:** NestJS, Kysely, Svelte 5, oazapfts SDK generation, Vitest

---

### Task 1: Add OR-logic flags to `searchAssetBuilder`

**Files:**

- Modify: `server/src/utils/database.ts:376-380` (add flag conditionals)
- Modify: `server/src/repositories/search.repository.ts:91-97` (add flags to interfaces)
- Modify: `server/src/services/shared-space.service.ts:566-580` (pass flags)
- Test: `server/src/services/shared-space.service.spec.ts`

Note: `hasAnyPerson` already exists at `database.ts:174` and `withAnyTagId` already exists at `database.ts:280`. No new helpers needed.

**Step 1: Write failing tests for OR-logic passthrough**

Add to the `getFilteredMapMarkers` describe block in `server/src/services/shared-space.service.spec.ts`:

```typescript
it('should pass personMatchAny and tagMatchAny flags to repository', async () => {
  const auth = factory.auth();
  mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([]);

  await sut.getFilteredMapMarkers(auth, {
    personIds: ['person-1'],
    tagIds: ['tag-1'],
  });

  expect(mocks.sharedSpace.getFilteredMapMarkers).toHaveBeenCalledWith(
    expect.objectContaining({
      personIds: ['person-1'],
      tagIds: ['tag-1'],
      personMatchAny: true,
      tagMatchAny: true,
    }),
  );
});

it('should pass personMatchAny for space person IDs', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));
  mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([]);

  await sut.getFilteredMapMarkers(auth, { spaceId, personIds: ['person-1'] });

  expect(mocks.sharedSpace.getFilteredMapMarkers).toHaveBeenCalledWith(
    expect.objectContaining({
      spacePersonIds: ['person-1'],
      personMatchAny: true,
      tagMatchAny: true,
    }),
  );
});
```

**Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run src/services/shared-space.service.spec.ts --reporter=verbose 2>&1 | tail -30`
Expected: FAIL — `personMatchAny` and `tagMatchAny` not in the called args.

**Step 3: Add flag interfaces**

In `server/src/repositories/search.repository.ts`, add flags to `SearchPeopleOptions` and `SearchTagOptions`:

```typescript
export interface SearchPeopleOptions {
  personIds?: string[];
  personMatchAny?: boolean;
}

export interface SearchTagOptions {
  tagIds?: string[] | null;
  tagMatchAny?: boolean;
}
```

**Step 4: Wire flags in `searchAssetBuilder`**

In `server/src/utils/database.ts`, update the conditionals at lines 376 and 380:

```typescript
    .$if(!!options.tagIds && options.tagIds.length > 0, (qb) =>
      options.tagMatchAny ? withAnyTagId(qb, options.tagIds!) : hasTags(qb, options.tagIds!),
    )
    // ... (existing tagIds === null line stays unchanged)
    .$if(!!options.personIds && options.personIds.length > 0, (qb) =>
      options.personMatchAny ? hasAnyPerson(qb, options.personIds!) : hasPeople(qb, options.personIds!),
    )
```

**Step 5: Pass flags from service**

In `server/src/services/shared-space.service.ts:566-580`, add the flags to the repository call:

```typescript
const markers = await this.sharedSpaceRepository.getFilteredMapMarkers({
  userIds: dto.spaceId ? undefined : [auth.user.id],
  spaceId: dto.spaceId,
  personIds: dto.spaceId ? undefined : dto.personIds,
  spacePersonIds: dto.spaceId ? dto.personIds : undefined,
  tagIds: dto.tagIds,
  make: dto.make,
  model: dto.model,
  rating: dto.rating,
  type: dto.type === 'IMAGE' ? AssetType.Image : dto.type === 'VIDEO' ? AssetType.Video : undefined,
  takenAfter: dto.takenAfter,
  takenBefore: dto.takenBefore,
  isFavorite: dto.isFavorite,
  visibility: AssetVisibility.Timeline,
  personMatchAny: true,
  tagMatchAny: true,
});
```

**Step 6: Run tests to verify they pass**

Run: `cd server && npx vitest run src/services/shared-space.service.spec.ts --reporter=verbose 2>&1 | tail -30`
Expected: PASS

**Step 7: Commit**

```bash
git add server/src/utils/database.ts server/src/repositories/search.repository.ts server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "fix: add OR-logic flags for people/tags in map filter queries"
```

---

### Task 2: Fix DTO array parsing, rating type coercion, and add location fields

**Files:**

- Modify: `server/src/dtos/gallery-map.dto.ts`
- Create: `server/src/dtos/gallery-map.dto.spec.ts` (DTO validation tests)

**Step 1: Write failing DTO validation tests**

The `@Transform` and `@Type` decorators run in the NestJS validation pipe, not at the service layer. To get a true red-green TDD cycle, test directly with `plainToInstance`/`validateSync`.

Create `server/src/dtos/gallery-map.dto.spec.ts`:

```typescript
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { FilteredMapMarkerDto } from 'src/dtos/gallery-map.dto';

describe('FilteredMapMarkerDto', () => {
  function transform(plain: Record<string, unknown>): FilteredMapMarkerDto {
    return plainToInstance(FilteredMapMarkerDto, plain, { enableImplicitConversion: false });
  }

  describe('personIds', () => {
    it('should normalize a single string to an array', () => {
      const dto = transform({ personIds: '7e57d004-2b97-0e7a-b45f-5387367791cd' });
      expect(dto.personIds).toEqual(['7e57d004-2b97-0e7a-b45f-5387367791cd']);
    });

    it('should keep an array as-is', () => {
      const ids = ['7e57d004-2b97-0e7a-b45f-5387367791cd', '8e57d004-2b97-0e7a-b45f-5387367791cd'];
      const dto = transform({ personIds: ids });
      expect(dto.personIds).toEqual(ids);
    });

    it('should leave undefined when not provided and pass validation', () => {
      const dto = transform({});
      expect(dto.personIds).toBeUndefined();
      const errors = validateSync(dto);
      expect(errors.filter((e) => e.property === 'personIds')).toHaveLength(0);
    });
  });

  describe('tagIds', () => {
    it('should normalize a single string to an array', () => {
      const dto = transform({ tagIds: '7e57d004-2b97-0e7a-b45f-5387367791cd' });
      expect(dto.tagIds).toEqual(['7e57d004-2b97-0e7a-b45f-5387367791cd']);
    });

    it('should leave undefined when not provided and pass validation', () => {
      const dto = transform({});
      expect(dto.tagIds).toBeUndefined();
      const errors = validateSync(dto);
      expect(errors.filter((e) => e.property === 'tagIds')).toHaveLength(0);
    });
  });

  describe('rating', () => {
    it('should coerce string to number', () => {
      const dto = transform({ rating: '3' });
      expect(dto.rating).toBe(3);
      expect(typeof dto.rating).toBe('number');
    });

    it('should reject rating outside range', () => {
      const dto = transform({ rating: '6' });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'rating')).toBe(true);
    });

    it('should leave undefined when not provided', () => {
      const dto = transform({});
      expect(dto.rating).toBeUndefined();
    });
  });

  describe('city and country', () => {
    it('should accept city and country strings', () => {
      const dto = transform({ city: 'Paris', country: 'France' });
      expect(dto.city).toBe('Paris');
      expect(dto.country).toBe('France');
    });

    it('should leave undefined when not provided', () => {
      const dto = transform({});
      expect(dto.city).toBeUndefined();
      expect(dto.country).toBeUndefined();
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run src/dtos/gallery-map.dto.spec.ts --reporter=verbose 2>&1 | tail -30`
Expected: FAIL — single string not normalized to array, rating string not coerced, city/country properties not on class.

**Step 3: Fix the DTO**

Replace `server/src/dtos/gallery-map.dto.ts` contents:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, Max, Min } from 'class-validator';
import { Optional, ValidateBoolean, ValidateDate, ValidateUUID } from 'src/validation';

export enum MapMediaType {
  Image = 'IMAGE',
  Video = 'VIDEO',
}

export class FilteredMapMarkerDto {
  @ValidateUUID({ each: true, optional: true, description: 'Filter by person IDs' })
  @Transform(({ value }) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]), {
    toClassOnly: true,
  })
  personIds?: string[];

  @ValidateUUID({ each: true, optional: true, description: 'Filter by tag IDs' })
  @Transform(({ value }) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]), {
    toClassOnly: true,
  })
  tagIds?: string[];

  @ValidateUUID({ optional: true, description: 'Scope to a shared space' })
  spaceId?: string;

  @ApiProperty({ type: String, required: false, description: 'Camera make' })
  @Optional()
  make?: string;

  @ApiProperty({ type: String, required: false, description: 'Camera model' })
  @Optional()
  model?: string;

  @ApiProperty({ type: Number, required: false, description: 'Minimum star rating', minimum: 1, maximum: 5 })
  @Optional()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @ApiProperty({ enum: MapMediaType, required: false, description: 'Filter by media type' })
  @Optional()
  @IsEnum(MapMediaType)
  type?: MapMediaType;

  @ValidateDate({ optional: true, description: 'Filter assets taken after this date' })
  takenAfter?: Date;

  @ValidateDate({ optional: true, description: 'Filter assets taken before this date' })
  takenBefore?: Date;

  @ValidateBoolean({ optional: true, description: 'Filter by favorite status' })
  isFavorite?: boolean;

  @ApiProperty({ type: String, required: false, description: 'Filter by city' })
  @Optional()
  city?: string;

  @ApiProperty({ type: String, required: false, description: 'Filter by country' })
  @Optional()
  country?: string;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd server && npx vitest run src/dtos/gallery-map.dto.spec.ts --reporter=verbose 2>&1 | tail -30`
Expected: PASS

**Step 5: Commit**

```bash
git add server/src/dtos/gallery-map.dto.ts server/src/dtos/gallery-map.dto.spec.ts
git commit -m "fix: add Transform/Type decorators and location fields to map DTO"
```

---

### Task 3: Wire city/country through service layer

**Files:**

- Modify: `server/src/services/shared-space.service.ts:566-580`
- Test: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write failing test**

Add to `getFilteredMapMarkers` describe in `server/src/services/shared-space.service.spec.ts`:

```typescript
it('should pass city and country to repository', async () => {
  const auth = factory.auth();
  mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([]);

  await sut.getFilteredMapMarkers(auth, { city: 'Paris', country: 'France' });

  expect(mocks.sharedSpace.getFilteredMapMarkers).toHaveBeenCalledWith(
    expect.objectContaining({
      city: 'Paris',
      country: 'France',
    }),
  );
});

it('should pass all filters together to repository', async () => {
  const auth = factory.auth();
  mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([]);

  await sut.getFilteredMapMarkers(auth, {
    personIds: ['person-1'],
    tagIds: ['tag-1'],
    city: 'Paris',
    country: 'France',
    rating: 4,
    make: 'Canon',
  });

  expect(mocks.sharedSpace.getFilteredMapMarkers).toHaveBeenCalledWith(
    expect.objectContaining({
      personIds: ['person-1'],
      tagIds: ['tag-1'],
      city: 'Paris',
      country: 'France',
      rating: 4,
      make: 'Canon',
      personMatchAny: true,
      tagMatchAny: true,
    }),
  );
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run src/services/shared-space.service.spec.ts --reporter=verbose 2>&1 | tail -20`
Expected: FAIL — city/country not in the repository call args.

**Step 3: Add city/country to the service pass-through**

In `server/src/services/shared-space.service.ts`, update the `getFilteredMapMarkers` repository call. Add before `visibility: AssetVisibility.Timeline,`:

```typescript
      city: dto.city,
      country: dto.country,
```

**Step 4: Run tests to verify they pass**

Run: `cd server && npx vitest run src/services/shared-space.service.spec.ts --reporter=verbose 2>&1 | tail -20`
Expected: PASS

**Step 5: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "fix: wire city/country through service to map marker query"
```

---

### Task 4: Wire city/country in frontend API call

**Files:**

- Modify: `web/src/routes/(user)/map/[[photos=photos]]/[[assetId=id]]/+page.svelte:82-110`

**Step 1: Update the `$effect` to include city/country**

In `web/src/routes/(user)/map/[[photos=photos]]/[[assetId=id]]/+page.svelte`, line 83, add `city` and `country` to the destructuring:

```typescript
const { personIds, make, model, tagIds, rating, mediaType, isFavorite, city, country } = filters;
```

Then add to the `getFilteredMapMarkers` call (after the `isFavorite` line, around line 97):

```typescript
        ...(city && { city }),
        ...(country && { country }),
```

**Step 2: Verify web unit tests still pass**

Run: `cd web && npx vitest run src/lib/utils/__tests__/map-filter-config.spec.ts --reporter=verbose 2>&1 | tail -10`
Expected: PASS (no breakage)

**Step 3: Commit**

```bash
git add web/src/routes/\(user\)/map/\[\[photos=photos\]\]/\[\[assetId=id\]\]/+page.svelte
git commit -m "fix: send city/country filters in map marker API call"
```

---

### Task 5: Regenerate SDK and SQL, lint, final verification

**Files:**

- Regenerated: `open-api/typescript-sdk/src/fetch-client.ts`
- Regenerated: `open-api/dart/` (Dart client)
- Regenerated: `server/src/queries/shared.space.repository.sql`

**Step 1: Build server and regenerate OpenAPI spec**

Run: `cd server && pnpm build && pnpm sync:open-api`

**Step 2: Regenerate all OpenAPI clients (TypeScript + Dart)**

Run: `make open-api`

**Step 3: Regenerate SQL query docs**

Run: `make sql`

**Step 4: Run server lint and typecheck**

Run: `make lint-server`
Then: `make check-server`

**Step 5: Run web lint and typecheck**

Run: `make lint-web`
Then: `make check-web`

**Step 6: Run all server unit tests**

Run: `cd server && pnpm test -- --run`
Expected: PASS

**Step 7: Run all web unit tests**

Run: `cd web && pnpm test -- --run`
Expected: PASS

**Step 8: Commit generated files**

```bash
git add open-api/ server/src/queries/
git commit -m "chore: regenerate OpenAPI clients and SQL after map filter fixes"
```
