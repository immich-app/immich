# Feature Research: Nested Albums

**Votes:** 165 (16th most requested)
**Status:** Not implemented
**Upstream Work:** None found
**Codebase Precedent:** Tags already implement self-referencing hierarchy

## Overview

Sub-albums / album hierarchy — organize albums into parent-child relationships. For example: "Vacations" → "2024 Italy" → "Rome", "Florence". Currently, all albums are flat with no nesting support.

## Current State in Immich

### Album Schema (Flat)

`server/src/schema/tables/album.table.ts`:

- `id`, `ownerId`, `albumName`, `description`
- `albumThumbnailAssetId`, `isActivityEnabled`, `order`
- `createdAt`, `updatedAt`, `deletedAt` (soft delete)
- **No `parentId` field — completely flat structure**

### Existing Hierarchy Pattern: Tags

The tag system already implements self-referencing hierarchy that could be directly replicated:

**Tag Table** (`server/src/schema/tables/tag.table.ts`):

- `parentId` — nullable FK to self, `ON DELETE CASCADE`
- `value` — path-based naming: `parent/child/grandchild`

**Tag Service** (`server/src/services/tag.service.ts`):

- Creation: `value = parent ? ${parent.value}/${dto.name} : dto.name`
- Duplicate path prevention per user
- Parent chain traversal

**TreeNode Utility** (`web/src/lib/utils/tree-utils.ts`):

- Already handles hierarchical display for folders and tags
- Supports collapsing, parent traversal, children enumeration
- Can be reused for nested album display

### Album List UI

**Web:**

- `albums-list.svelte` — grid/list display with grouping
- Existing groupBy options: None, Year, Owner
- Card-based layout with thumbnail, name, asset count

**Mobile:**

- Album list with search, sort, create
- Grid/list toggle
- No hierarchy support

## Proposed Implementation

### Schema Change

Add `parentId` column to album table:

```sql
ALTER TABLE album ADD COLUMN "parentId" uuid;
ALTER TABLE album ADD CONSTRAINT "album_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES album(id) ON DELETE SET NULL;
CREATE INDEX album_parentId_idx ON album ("parentId");
```

**Design choice: `ON DELETE SET NULL` vs `ON DELETE CASCADE`**

- Recommendation: `SET NULL` — deleting a parent album moves children to top level rather than deleting them. This is safer and less surprising for users.

### Backend Changes

**DTOs:**

- `CreateAlbumDto`: add `parentId?: string` (optional, validated as UUID)
- `UpdateAlbumDto`: add `parentId?: string | null` (set to null to move to top level)
- `AlbumResponseDto`: add `parentId`, `parentName` (denormalized for display)

**Service** (`album.service.ts`):

- `create()`: validate parent exists and is owned by same user
- `update()`: validate no circular references (A → B → A)
- `get()`: include parent info in response
- `getAll()`: support optional `parentId` filter (show children of X)

**Circular Reference Prevention:**

```typescript
async validateNoCircularReference(albumId: string, newParentId: string): Promise<void> {
  let current = newParentId;
  const visited = new Set<string>();
  while (current) {
    if (current === albumId) throw new BadRequestException('Circular reference');
    if (visited.has(current)) break;
    visited.add(current);
    const parent = await this.albumRepository.get(current);
    current = parent?.parentId;
  }
}
```

**Repository:**

- Add `parentId` to all album query select lists
- Optional: recursive CTE query for "all descendants" of an album
- Optional: breadcrumb query (all ancestors)

### Frontend Changes

**Web — Album List:**

- Add `AlbumGroupBy.Parent` grouping option
- Show parent breadcrumb on album cards when grouped by parent
- Alternatively: tree view using existing `TreeNode` utility
- "Move to album" context menu action

**Web — Album Detail:**

- Breadcrumb navigation: `Albums > Vacations > 2024 Italy > Rome`
- "Sub-albums" section showing child albums below asset grid
- "Move album" action in settings menu

**Web — Album Creation:**

- Optional "Parent album" dropdown in create dialog
- "Create sub-album" action from within a parent album

**Mobile:**

- Breadcrumb path in album header
- Sub-album list below assets
- "Parent album" picker in create/edit flow

### Query Patterns

**Get albums with hierarchy info:**

```sql
SELECT a.*, parent.albumName as parentName
FROM album a
LEFT JOIN album parent ON a.parentId = parent.id
WHERE a.ownerId = $1 AND a.deletedAt IS NULL
ORDER BY COALESCE(parent.albumName, a.albumName), a.albumName
```

**Get all descendants (recursive CTE):**

```sql
WITH RECURSIVE descendants AS (
  SELECT id, albumName, parentId, 0 as depth
  FROM album WHERE id = $1
  UNION ALL
  SELECT a.id, a.albumName, a.parentId, d.depth + 1
  FROM album a INNER JOIN descendants d ON a.parentId = d.id
  WHERE d.depth < 10  -- max depth limit
)
SELECT * FROM descendants
```

**Breadcrumb path (ancestors):**

```sql
WITH RECURSIVE ancestors AS (
  SELECT id, albumName, parentId FROM album WHERE id = $1
  UNION ALL
  SELECT a.id, a.albumName, a.parentId
  FROM album a INNER JOIN ancestors an ON an.parentId = a.id
)
SELECT * FROM ancestors ORDER BY -- root first
```

## Design Decisions Needed

1. **Deletion behavior**: `CASCADE` (delete all children) or `SET NULL` (move to top)?
   - Recommendation: `SET NULL` — safer, less surprising

2. **Depth limit**: How deep can nesting go?
   - Recommendation: Max 10 levels (enforced in service layer)

3. **Cross-user nesting**: Can shared albums be nested under own albums?
   - Recommendation: No — only own albums can be nested. Shared albums appear flat.

4. **Asset inheritance**: Does viewing parent show descendant assets?
   - Recommendation: No by default. Parent shows only its direct assets. Add "Show all" toggle for recursive view.

5. **Shared album nesting**: If album is shared and has children, do shared users see children?
   - Recommendation: No — sharing is per-album, not hierarchical

6. **Sort order**: How to sort nested albums in flat list view?
   - Recommendation: Sort by full path (parent/child) for alphabetical grouping

## Effort Estimate

| Component                       | Effort       | Notes                                      |
| ------------------------------- | ------------ | ------------------------------------------ |
| Schema + migration              | Small        | 1 column, 1 FK, 1 index                    |
| DTOs + OpenAPI                  | Small        | Add field to 3 DTOs                        |
| Service (CRUD + validation)     | Medium       | Circular ref check, parent validation      |
| Repository queries              | Small-Medium | Parent join, optional recursive CTE        |
| Web album list (grouping)       | Medium       | New groupBy option, tree view              |
| Web album detail (breadcrumb)   | Small        | Breadcrumb component                       |
| Web create/edit (parent picker) | Small        | Dropdown component                         |
| Mobile                          | Medium       | Breadcrumb, sub-album list, parent picker  |
| Tests                           | Medium       | Circular ref, cascading, hierarchy queries |

**Total: Medium effort (~2 weeks)**

The tag hierarchy pattern is directly replicable, reducing design risk.

## Key Technical Challenges

1. **Circular reference prevention**: Must validate on every `update()` call with parent change
2. **Query performance**: Recursive CTEs can be slow for deep hierarchies — enforce depth limit
3. **UI complexity**: Displaying hierarchy in grid view is tricky. Tree view is natural but different from current album layout
4. **Mobile navigation**: Deep nesting creates long breadcrumbs on small screens
5. **API compatibility**: Adding `parentId` is backwards-compatible (nullable), but clients need to handle it for meaningful hierarchy display

## Key Files

- `server/src/schema/tables/album.table.ts` — Add `parentId` column
- `server/src/schema/migrations/` — New migration
- `server/src/database.ts` — Update album type
- `server/src/dtos/album.dto.ts` — Add to Create/Update/Response DTOs
- `server/src/services/album.service.ts` — Validation, circular ref check
- `server/src/repositories/album.repository.ts` — Query updates
- `web/src/lib/components/album-page/albums-list.svelte` — Hierarchy display
- `web/src/lib/utils/tree-utils.ts` — Reuse TreeNode for album tree
- `mobile/lib/pages/library/album/` — Mobile album UI
- Tag hierarchy reference: `server/src/schema/tables/tag.table.ts`
