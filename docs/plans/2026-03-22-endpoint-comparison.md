# Discovery Page: Endpoint Strategy Comparison

## How the two endpoint families work today

### Endpoint Family A: Timeline (`/timeline`)

Two endpoints that work together to power the main photo grid:

**Step 1: `GET /timeline/buckets`** — "What months have photos, and how many?"

```
Request:  GET /timeline/buckets?personId=abc&isFavorite=true

Response: [
  { "timeBucket": "2020-08-01", "count": 614 },
  { "timeBucket": "2020-07-01", "count": 891 },
  { "timeBucket": "2020-06-01", "count": 523 },
  ...
]
```

Returns ~240 rows for a 20-year archive. Lightweight — just month labels and counts.
This gives the client the full time structure upfront, enabling virtual scrolling and
the scrubber.

**Step 2: `GET /timeline/bucket?timeBucket=2020-08-01`** — "Give me all photos for
August 2020"

```
Request:  GET /timeline/bucket?timeBucket=2020-08-01&personId=abc&isFavorite=true

Response: (single JSON object with columnar arrays)
{
  "id": ["uuid-1", "uuid-2", "uuid-3", ...],
  "fileCreatedAt": ["2020-08-28T...", "2020-08-24T...", ...],
  "thumbhash": ["abc...", "def...", ...],
  "isFavorite": [true, false, true, ...],
  "city": ["Munich", "Munich", null, ...],
  ...614 items total
}
```

Returns ALL photos for one month in a compact columnar format (arrays of values, not
array of objects). Loaded lazily as the user scrolls to that month.

**How they work together:**

```
┌─ Client (TimelineManager) ──────────────────────────────────┐
│                                                              │
│  1. On page load:                                            │
│     GET /timeline/buckets → [Aug: 614, Jul: 891, Jun: 523]  │
│                                                              │
│  2. Calculate virtual scroll height:                         │
│     Aug needs 614/7cols = 88 rows × 150px = 13,200px        │
│     Jul needs 891/7cols = 128 rows × 150px = 19,200px       │
│     Total scroll height = sum of all months                  │
│                                                              │
│  3. Render scrubber with all months                          │
│                                                              │
│  4. User sees viewport → load visible months:               │
│     GET /timeline/bucket?timeBucket=2020-08-01 → 614 photos │
│                                                              │
│  5. User scrolls down → load next month on demand:           │
│     GET /timeline/bucket?timeBucket=2020-07-01 → 891 photos │
│                                                              │
│  6. Months outside viewport are unloaded (virtual scroll)    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Filters supported today:** personId, albumId, spaceId, tagId, isFavorite,
isTrashed, visibility, withPartners, withSharedSpaces, bbox (geospatial), order
(asc/desc).

**Filters NOT supported:** city, country, state, camera make/model, rating,
originalFileName, description, OCR, date ranges, media type.

---

### Endpoint Family B: Search (`/search`)

One endpoint that returns a paginated flat list:

**`POST /search/metadata`** — "Find photos matching these criteria"

```
Request:  POST /search/metadata
{
  "city": "Munich",
  "make": "Canon",
  "rating": 3,
  "originalFileName": "vacation",
  "order": "desc",
  "page": 1,
  "size": 100
}

Response: {
  "assets": {
    "items": [
      {
        "id": "uuid-1",
        "fileCreatedAt": "2020-08-28T...",
        "originalFileName": "vacation_001.jpg",
        "exifInfo": {
          "city": "Munich",
          "make": "Canon",
          "model": "EOS 5D Mark IV",
          "rating": 5,
          ...
        },
        ...full AssetResponseDto
      },
      ...up to 100 items
    ],
    "nextPage": "2"    ← cursor for next page
  }
}
```

Returns individual asset objects with full metadata. Offset-paginated (page 1, 2, 3...).

**How it works:**

```
┌─ Client (Search Results Page) ─────────────────────────────┐
│                                                             │
│  1. User searches/filters:                                  │
│     POST /search/metadata { city: "Munich", page: 1 }      │
│     → 100 items + nextPage: "2"                             │
│                                                             │
│  2. Render flat grid (no month headers):                    │
│     ┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐                   │
│     │   ││   ││   ││   ││   ││   ││   │                   │
│     └───┘└───┘└───┘└───┘└───┘└───┘└───┘                   │
│     ┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐                   │
│     │   ││   ││   ││   ││   ││   ││   │                   │
│     └───┘└───┘└───┘└───┘└───┘└───┘└───┘                   │
│                                                             │
│  3. User scrolls to bottom → load next page:                │
│     POST /search/metadata { city: "Munich", page: 2 }      │
│     → 100 more items                                        │
│                                                             │
│  4. No virtual scrolling — all loaded pages stay in DOM     │
│  5. No scrubber — no upfront knowledge of total months      │
│  6. No jump-to-month — must scroll sequentially             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Filters supported:** Everything — city, country, state, make, model, lensModel,
rating, originalFileName, description, OCR, date ranges, personIds, tagIds, albumIds,
type (image/video), isFavorite, visibility, and more.

---

## The gap

```
                    Timeline endpoints         Search endpoint
                    ──────────────────         ───────────────
Filters:
  person            ✓                          ✓
  album             ✓                          ✓
  space             ✓                          ✓
  tag               ✓                          ✓
  favorite          ✓                          ✓
  visibility        ✓                          ✓
  geospatial        ✓                          ✗
  partners          ✓                          ✗
  ─── missing from timeline ──────────────────────────────
  city/country      ✗                          ✓
  camera make/model ✗                          ✓
  rating            ✗                          ✓
  filename search   ✗                          ✓
  description       ✗                          ✓
  OCR               ✗                          ✓
  date ranges       ✗                          ✓
  media type        ✗                          ✓

Scale:
  Virtual scroll    ✓ (knows total heights)    ✗ (sequential pages)
  Scrubber          ✓ (from bucket counts)     ✗ (no month data)
  Jump-to-month     ✓ (scroll to offset)       ✗ (must load pages)
  Month headers     ✓ (server-grouped)         ✗ (flat list)
  200k photos       ✓ (lazy month loading)     Slow (page-by-page)
```

---

## Option 1: Extend timeline endpoints with missing filters

**What changes:** Add the 6 missing filter parameters to `TimeBucketDto` and wire
them as WHERE clauses into the timeline CTE query.

**Server changes:**

```typescript
// time-bucket.dto.ts — add these optional fields:

@IsString()
@IsOptional()
city?: string;

@IsString()
@IsOptional()
country?: string;

@IsString()
@IsOptional()
make?: string;      // camera make

@IsString()
@IsOptional()
model?: string;     // camera model

@IsInt()
@IsOptional()
@Min(1) @Max(5)
rating?: number;    // minimum rating

@IsString()
@IsOptional()
originalFileName?: string;   // text search (ILIKE)

@IsEnum(AssetType)
@IsOptional()
type?: AssetType;   // IMAGE or VIDEO
```

```sql
-- In getTimeBuckets CTE, add WHERE clauses:

-- Existing:
WHERE "deletedAt" IS NULL
  AND "visibility" = 'timeline'
  AND ... (existing filters)

-- New (only when parameter provided):
  AND "asset_exif"."city" = $city
  AND "asset_exif"."country" = $country
  AND "asset_exif"."make" = $make
  AND "asset_exif"."model" = $model
  AND "asset_exif"."rating" >= $rating
  AND f_unaccent("asset"."originalFileName") ILIKE f_unaccent('%' || $query || '%')
  AND "asset"."type" = $type
```

Requires joining `asset_exif` in the CTE (currently not joined in bucket queries).

**Client architecture (unchanged):**

```
┌─ Discovery Page ────────────────────────────────────────────┐
│                                                              │
│  ┌─ Filter Panel ─┐  ┌─ Photo Grid ─────────────────────┐  │
│  │                 │  │                                   │  │
│  │  [Timeline]     │  │  Uses TimelineManager (existing)  │  │
│  │  [People]       │  │                                   │  │
│  │  [Location]  ───┼──┼→ GET /timeline/buckets            │  │
│  │  [Camera]       │  │    ?personId=X                    │  │
│  │  [Rating]       │  │    &city=Munich      ← NEW       │  │
│  │  [Tags]         │  │    &make=Canon       ← NEW       │  │
│  │  [Media Type]   │  │    &rating=3         ← NEW       │  │
│  │                 │  │                                   │  │
│  │  Filters map    │  │  Then lazy-loads each month:      │  │
│  │  directly to    │  │  GET /timeline/bucket             │  │
│  │  TimeBucketDto  │  │    ?timeBucket=2020-08-01         │  │
│  │  parameters     │  │    &personId=X&city=Munich&...    │  │
│  │                 │  │                                   │  │
│  │  Text search    │  │  → Virtual scroll ✓               │  │
│  │  = filename     │  │  → Scrubber ✓                     │  │
│  │  ILIKE filter   │  │  → Month headers ✓                │  │
│  │                 │  │  → Jump-to-month ✓                │  │
│  └─────────────────┘  └───────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Pros:**

- Virtual scrolling works — handles 200k+ photos smoothly
- Month headers, scrubber, temporal picker all work natively
- Reuses the existing `TimelineManager` component (battle-tested)
- Text search (filename) is just another filter — consistent UX
- No new endpoints — same API contract, just more parameters

**Cons:**

- Modifies the timeline CTE query (upstream code, rebase risk)
- Need to add `asset_exif` JOIN to bucket queries (currently not joined)
- Text search is ILIKE only (filename/description) — no CLIP/smart search
- ~7 new WHERE clauses in an already complex CTE query
- Timeline endpoint becomes a superset of what it was — could surprise upstream

**Fork conflict surface:**

- `server/src/dtos/time-bucket.dto.ts` — adding fields (low conflict risk, additive)
- `server/src/repositories/asset.repository.ts` — modifying getTimeBuckets/getTimeBucket
  CTE (medium conflict risk — upstream touches this regularly)

---

## Option 2: Use search endpoint as sole data source

**What changes:** The Discovery page uses `POST /search/metadata` for all data.
Month grouping is done client-side. A separate lightweight call gets month counts
for the temporal picker.

**Server changes:**

- Add `sortBy` to `MetadataSearchDto` (already planned)
- Optionally: add a count-by-month aggregation endpoint, or reuse `/timeline/buckets`
  for temporal picker counts (but counts would be wrong when EXIF filters are active,
  since `/timeline/buckets` doesn't support those filters)

**Client architecture (new):**

```
┌─ Discovery Page ────────────────────────────────────────────┐
│                                                              │
│  ┌─ Filter Panel ─┐  ┌─ Photo Grid ─────────────────────┐  │
│  │                 │  │                                   │  │
│  │  [Timeline]     │  │  NEW component (not Timeline-     │  │
│  │  [People]       │  │  Manager — can't use it since     │  │
│  │  [Location]  ───┼──┼→ POST /search/metadata            │  │
│  │  [Camera]       │  │    { city: "Munich",              │  │
│  │  [Rating]       │  │      make: "Canon",               │  │
│  │  [Tags]         │  │      rating: 3,                   │  │
│  │  [Media Type]   │  │      page: 1, size: 200 }        │  │
│  │                 │  │                                   │  │
│  │  Filters map    │  │  Client groups by month:          │  │
│  │  to Metadata-   │  │    Aug 2020: [photo, photo, ...]  │  │
│  │  SearchDto      │  │    Jul 2020: [photo, photo, ...]  │  │
│  │                 │  │                                   │  │
│  │                 │  │  → Virtual scroll ✗ (pages only)  │  │
│  │  Temporal       │  │  → Scrubber ✗ (no bucket data)   │  │
│  │  picker needs   │  │  → Month headers ✓ (client-side)  │  │
│  │  separate call  │  │  → Jump-to-month ✗ (sequential)  │  │
│  │  for counts     │  │                                   │  │
│  └─────────────────┘  └───────────────────────────────────┘  │
│                                                              │
│  Problem: temporal picker counts ≠ actual results            │
│  when EXIF filters active (timeline/buckets doesn't          │
│  support city, make, rating filters)                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Pros:**

- All filters + text search work immediately — no server changes for filtering
- No modification to timeline code (zero fork conflict on query builder)
- Simpler server change (just `sortBy` addition)
- Smart/CLIP search possible in the future (same endpoint family)

**Cons:**

- No virtual scrolling — 200k photos means slow progressive loading
- No scrubber (doesn't know total month distribution upfront)
- Can't jump to a specific month (must scroll sequentially)
- Temporal picker counts are wrong when EXIF filters are active
  (would need a new count endpoint or extending timeline/buckets anyway)
- Must build a new grid component (can't reuse TimelineManager)
- Client-side month grouping breaks on page boundaries (page 1 ends mid-August,
  page 2 starts mid-August — two "August 2020" headers)
- Higher memory usage — loaded pages stay in DOM, can't unload

**Page boundary problem illustrated:**

```
  Page 1 (100 photos):                 Page 2 (100 photos):
  ┌─────────────────────┐              ┌─────────────────────┐
  │ August 2020         │              │ August 2020  ← dupe │
  │ ┌──┐┌──┐┌──┐┌──┐   │              │ ┌──┐┌──┐┌──┐       │
  │ │  ││  ││  ││  │   │              │ │  ││  ││  │       │
  │ └──┘└──┘└──┘└──┘   │              │ └──┘└──┘└──┘       │
  │ July 2020           │              │ July 2020    ← dupe │
  │ ┌──┐┌──┐            │              │ ┌──┐┌──┐┌──┐       │
  │ │  ││  │  ← cut off │              │ │  ││  ││  │       │
  │ └──┘└──┘            │              │ └──┘└──┘└──┘       │
  └─────────────────────┘              └─────────────────────┘

  You'd need to merge these client-side to avoid duplicate headers.
  Doable, but adds complexity.
```

**Fork conflict surface:**

- `server/src/dtos/search.dto.ts` — adding `sortBy` (low conflict risk)
- `server/src/repositories/search.repository.ts` — dynamic orderBy (low conflict risk)
- No timeline code touched ✓

---

## Side-by-side comparison

```
                              Option 1               Option 2
                              (Extend timeline)      (Use search)
                              ─────────────────      ─────────────

  200k photos                 ✓ smooth               ✗ slow pages
  Virtual scrolling           ✓ native               ✗ not possible
  Scrubber                    ✓ native               ✗ not possible
  Jump-to-month               ✓ native               ✗ sequential only
  Month headers               ✓ server-grouped       ~ client-side (page boundary issues)
  Temporal picker counts      ✓ accurate             ✗ inaccurate with EXIF filters

  All EXIF filters            ✓ after changes        ✓ already works
  Text search (filename)      ✓ after changes        ✓ already works
  Smart/CLIP search           ✗ different arch        ~ possible later

  Reuses TimelineManager      ✓ existing component   ✗ new grid component
  New server code             ~7 WHERE clauses       ~1 enum + orderBy
  Fork conflict risk          Medium (CTE changes)   Low (DTO only)
  New components to build     Filter panel only      Filter panel + grid component
```

## Recommendation

Option 1 (extend timeline) is the better product. The scale advantages — virtual
scrolling, scrubber, jump-to-month, accurate temporal picker — are fundamental to the
discovery experience described in the write-up. Without them, the page doesn't work
well for users with large archives, which is precisely the audience we're building for.

The fork conflict risk is real but manageable. The changes are additive (new optional
parameters, new WHERE clauses) rather than structural. The existing timeline behavior
is unchanged when the new parameters aren't provided.

Option 2 saves server work but shifts the complexity to the client (new grid component,
page-boundary merging, inaccurate counts) and produces a worse product at scale.
