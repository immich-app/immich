# Fix Space Person Name and Thumbnail Data

## Problem

Space persons show broken thumbnails and empty names in both the space header strip and filter panel.

### Root Causes

1. **No name sync** — Space person names are copied once from the personal person at creation time. If the personal person is named later (the common flow), the space person keeps `name = ''` forever.
2. **Thumbnail race condition** — The `SharedSpacePersonThumbnail` job copies the thumbnail path from the personal person, but can run before the personal person's own thumbnail has been generated. Both are async jobs with no ordering guarantee.
3. **Stale thumbnail paths** — Even when a thumbnail was copied successfully, if the personal person's thumbnail is regenerated at a new path, the space person still references the old (possibly deleted) file.
4. **Filter panel uses gradient avatars** — The `people-filter.svelte` component renders gradient circles with initials instead of actual face thumbnails, despite having a `thumbnailPath` field available.

## Solution: Read-Through JOINs + Remove Stored Thumbnail

### 1. Repository Query Changes

Modify all person query methods to LEFT JOIN through `asset_face` → `person`:

- `getPersonsBySpaceId(spaceId)` — list query
- `getPersonsBySpaceIdWithTemporalFilter(spaceId, options)` — temporal-filtered list
- `getPersonById(id)` — single person (used by thumbnail endpoint)

```sql
SELECT ssp.*,
       p.name AS "personalName",
       p."thumbnailPath" AS "personalThumbnailPath"
FROM shared_space_person ssp
LEFT JOIN asset_face af ON af.id = ssp."representativeFaceId"
LEFT JOIN person p ON p.id = af."personId"
WHERE ssp."spaceId" = $1
```

### 2. Service Layer Changes

**`getSpacePeople()`:**

- Name resolution: `spacePerson.name || personalName || ''` — space person name is an override, personal person name is primary
- Thumbnail: `personalThumbnailPath` — always from the personal person
- Filter: skip persons where resolved thumbnail is empty (personal person has no thumbnail yet)

**`getSpacePersonThumbnail()`:**

- Use `personalThumbnailPath` from the JOINed `getPersonById()` result as the primary path
- Remove the fallback chain (it becomes the only path)

**`processSpaceFaceMatch()` (person creation):**

- Stop copying `name` at creation time — set `name: ''` (the field becomes override-only)
- Remove thumbnail job queue calls

**`mapSpacePerson()`:**

- `name` field uses resolved name (override || personal)
- `thumbnailPath` field uses personalThumbnailPath

### 3. Remove `thumbnailPath` Column

Database migration in `server/src/schema/migrations-gallery/`:

- Drop `thumbnailPath` from `shared_space_person`
- Clear all `name` values (existing values are stale copies, not intentional overrides — no UI exposes manual naming)

Schema/type changes:

- Remove from `SharedSpacePersonTable` schema
- Remove from `SharedSpacePerson` type in `database.ts`

### 4. Remove `SharedSpacePersonThumbnail` Job

- Delete handler `handleSharedSpacePersonThumbnail()`
- Remove queue calls from `processSpaceFaceMatch()` (person + pet paths)
- Remove `JobName.SharedSpacePersonThumbnail` from enum
- Remove job type from `types.ts`

### 5. Filter Panel Thumbnails

**`PersonOption` interface:**

- Rename `thumbnailPath` to `thumbnailUrl` — contains an API endpoint URL, not a filesystem path
- Optional; gradient circle fallback when absent

**`people-filter.svelte`:**

- When `thumbnailUrl` is set, render `<img>` (circular crop, same style as people strip)
- When absent, fall back to gradient circle with initial

**Filter providers construct URLs:**

- Space page: `/shared-spaces/{spaceId}/people/{personId}/thumbnail`
- Photos page: `/people/{personId}/thumbnail`

### 6. DTO

`SharedSpacePersonResponseDto.thumbnailPath` still returns a filesystem path string. URL construction happens in web providers. Mobile app is unaffected.

## Edge Cases

- Personal person has no name and no thumbnail → space person filtered out
- Space person has a name override AND personal person has a name → space override wins
- Representative face has no personId (below minFaces threshold) → LEFT JOIN returns NULL, person filtered out
- Representative face's personal person was deleted/merged → LEFT JOIN returns NULL, person filtered out
- Orphaned `SharedSpacePersonThumbnail` jobs in Redis → fail and sit in failed set, cleaned up by BullMQ retention

## Files Changed

### Server

- `server/src/repositories/shared-space.repository.ts` — Add JOINs to 3 query methods
- `server/src/services/shared-space.service.ts` — Use JOIN data, remove thumbnail job, update name resolution
- `server/src/schema/tables/shared-space-person.table.ts` — Remove thumbnailPath column
- `server/src/database.ts` — Remove thumbnailPath from type
- `server/src/enum.ts` — Remove SharedSpacePersonThumbnail from JobName
- `server/src/types.ts` — Remove job type definition
- `server/src/schema/migrations-gallery/` — New migration (drop column + clear names)

### Web

- `web/src/lib/components/filter-panel/filter-panel.ts` — Rename thumbnailPath to thumbnailUrl on PersonOption
- `web/src/lib/components/filter-panel/people-filter.svelte` — Render actual thumbnails
- `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte` — Pass thumbnail URLs
- `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte` — Pass thumbnail URLs
