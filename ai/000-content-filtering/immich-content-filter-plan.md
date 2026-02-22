# Immich Semantic Content Filter — Implementation Plan

## Goal

Implement a text-based semantic content filter for Immich's smart search. Users type
a constraint like "animal" or "food" alongside their search query, and results must
satisfy **both**:

- **Ranking**: "sunset on beach" — what the user is looking for
- **Filter**: "animal" — what kind of content must be present

Both terms get encoded via the existing CLIP text encoder. The main ANN search
retrieves candidates ranked by the primary query, then each candidate is **exactly
scored** against the filter embedding and rejected if below a similarity threshold.

No new ML models. No new tables. Reuses everything already in place.

---

## Research Context

This feature implements a specific variant of **Filtered Approximate Nearest Neighbor
Search (FANNS)** — the term the database research community has converged on (see
Chronis et al., VLDB 2025: "Filtered Vector Search: State-of-the-Art and Research
Opportunities"). The distinguishing characteristic is that the filter predicate is
itself a vector similarity computation against a second query embedding in the same
space, rather than a structured metadata attribute. No current vector database handles
this as a first-class primitive.

The architecture follows the **retrieve-then-rerank** pattern validated across
production systems:

- **Qdrant** implements this via its prefetch API (v1.10+): a first stage retrieves
  candidates, then a second stage rescores or filters them
- **Milvus** supports multi-vector queries through `hybrid_search()` with RRF or
  weighted ranking
- **pgvector v0.8.0+** supports iterative HNSW scan (`hnsw.iterative_scan =
  'relaxed_order'`), which continues expanding the search until LIMIT is satisfied
  even when WHERE clauses reject many candidates
- **VectorChord v0.4+** provides native prefiltering with bit-vector scans and
  VBASE "relaxed monotonicity" for efficient filtered search

The critical insight: this is architecturally identical to how Immich's existing
metadata filters (city, date, camera model) already work as post-filters on the
ANN index scan. The content filter is simply one more post-filter — except it checks
semantic distance instead of a metadata column.

### Why NOT intersection of two ANN queries

Intersecting two independent ANN top-K result sets causes catastrophic recall loss.
The expected intersection size follows: **E[|A ∩ B|] = K²/N**. For K=2000 and
N=50,000: only ~80 items overlap — and far fewer when the queries span orthogonal
semantic axes ("sunset" vs "animal"). ANN approximation compounds this: if each
query achieves 95% recall independently, intersection recall drops to ≤90%, and
empirically much worse for uncorrelated queries. The Filtered-DiskANN paper
(Gollapudi et al., WWW 2023) documents this "recall cliff" phenomenon. **Do not
implement the intersection approach.**

---

## The Query Strategy

When `filterEmbedding` is present, the repository adds a WHERE clause that computes
exact cosine distance against the content filter embedding for each candidate the
ANN index returns. The ANN index still drives retrieval via the ranking query.
Candidates failing the filter threshold are skipped and the scan continues.

### Architecture diagram

```
  ┌─────────────────────┐     ┌─────────────────────┐
  │  CLIP encode         │     │  CLIP encode         │
  │  "sunset on beach"   │     │  "a photo of a       │
  │  → query_embedding   │     │   animal"             │
  │                      │     │  → filter_embedding   │
  └──────────┬──────────┘     └──────────┬──────────┘
             │                           │
             ▼                           │
  ┌─────────────────────┐               │
  │  RETRIEVE            │               │
  │  ANN index scan      │               │
  │  ORDER BY <=>        │               │
  │  query_embedding     │               │
  │  LIMIT effective_lim │               │
  │  → ranked candidates │               │
  └──────────┬──────────┘               │
             │                           │
             ▼                           ▼
  ┌──────────────────────────────────────────────────┐
  │  POST-FILTER                                      │
  │  For each candidate from ANN scan:                │
  │    compute exact cosine distance to filter_emb    │
  │    reject if distance > threshold                 │
  │    also apply all metadata filters (dates, etc.)  │
  │  Return survivors ranked by query distance        │
  └──────────────────────────────────────────────────┘
```

### Raw SQL equivalent

```sql
SET LOCAL vchordrq.probes = 4;

SELECT asset.*
FROM asset
INNER JOIN smart_search ON asset.id = smart_search."assetId"
-- All standard metadata filters from searchAssetBuilder:
WHERE asset.visibility = 'timeline'
  AND asset."ownerId" = ANY($1)
  AND asset."deletedAt" IS NULL
  -- ... dates, location, tags, people, etc.
  -- CONTENT FILTER: exact distance computation against filter embedding
  AND smart_search.embedding <=> $2 <= 0.70   -- filter_embedding ("a photo of a animal")
-- ANN index orders by main query distance
ORDER BY smart_search.embedding <=> $3         -- query_embedding ("sunset on beach")
LIMIT 101
OFFSET 0;
```

### How PostgreSQL executes this

1. The VectorChord ANN index scans `smart_search` in order of distance to the
   query embedding ("sunset on beach"). This is the RETRIEVE phase.
2. For each candidate the index returns, PostgreSQL evaluates ALL WHERE clauses —
   including the cosine distance to the filter embedding AND all metadata filters
   from `searchAssetBuilder`.
3. Candidates that fail any filter are skipped, and the index scan continues.
4. Once enough passing candidates fill the LIMIT, the scan stops.

### Why this is efficient

- One ANN index scan (~1-5ms for 50k photos)
- Filter distance is a single vector dot product per candidate (~microseconds)
- For broad filters like "animal" (matching ~20% of a typical library), the scan
  examines ~5x candidates to fill the page — trivial overhead
- For narrow filters like "penguin", more candidates are examined, but this is
  bounded by the index scan cost, same as a narrow city or date filter
- Total overhead for a 50k library: ~2-10ms depending on filter selectivity

### Distance threshold

**VectorChord `<=>` operator** returns cosine distance (0 = identical, 2 = opposite).
CLIP cosine similarities for meaningful image-text matches occupy a narrow band:

| Relationship                        | Cosine Similarity | Cosine Distance |
|-------------------------------------|-------------------|-----------------|
| Strong match (image closely matches text) | 0.30 – 0.45  | 0.55 – 0.70    |
| Weak but related match              | 0.20 – 0.30      | 0.70 – 0.80    |
| Unrelated pairs                     | 0.10 – 0.20      | 0.80 – 0.90    |
| LAION-400M curation threshold       | ≥ 0.30           | ≤ 0.70         |
| LAION-5B curation threshold (EN)    | ≥ 0.28           | ≤ 0.72         |
| DataComp optimal (ViT-B/32)         | ≥ 0.281          | ≤ 0.719        |
| DataComp optimal (ViT-L/14)         | ≥ 0.243          | ≤ 0.757        |

Sources: Roboflow CLIP deployment docs; Schuhmann et al. "LAION-5B" (NeurIPS 2022);
Gadre et al. "DataComp" (NeurIPS 2023); Udandarao et al. "Who's in and who's out?"
(arXiv 2024).

**Default threshold: `0.70` cosine distance** (similarity ≥ 0.30). This aligns with
LAION-400M's human-validated curation threshold. Model-specific defaults should be
used when the CLIP model is known:

```typescript
const DEFAULT_FILTER_THRESHOLDS: Record<string, number> = {
  'ViT-B-32__openai': 0.70,
  'ViT-B-16__openai': 0.70,
  'ViT-L-14__openai': 0.72,
  'XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k': 0.74,
};
const filterDistanceThreshold =
  DEFAULT_FILTER_THRESHOLDS[machineLearning.clip.modelName] ?? 0.70;
```

### Oversampling for selective filters

When a content filter is active, the query should oversample to compensate for
candidates rejected by the filter threshold. Without this, very selective filters
(e.g., "penguin" matching 3 photos) may cause the ANN scan to terminate before
finding enough passing candidates.

```typescript
const effectiveLimit = options.filterEmbedding
  ? Math.min(pagination.size * 10, 5000)
  : pagination.size + 1;
```

This matches the oversampling strategy documented in Qdrant's prefetch API and
Pinecone's filtered search guidance.

---

## Changes by Layer

### 1. DTO — `server/src/dtos/search.dto.ts`

Add `contentFilter` field to `SmartSearchDto`:

```typescript
export class SmartSearchDto extends BaseSearchWithResultsDto {
  @ValidateString({ optional: true, trim: true, description: 'Natural language search query' })
  query?: string;

  @ValidateUUID({ optional: true, description: 'Asset ID to use as search reference' })
  queryAssetId?: string;

  // *** NEW ***
  @ValidateString({
    optional: true,
    trim: true,
    description: 'Content type filter — results must match this concept (e.g. "animal", "food", "vehicle")',
  })
  contentFilter?: string;

  @ApiPropertyOptional({ description: 'Search language code' })
  @IsString()
  @IsNotEmpty()
  @Optional()
  language?: string;

  @ApiPropertyOptional({ type: 'number', description: 'Page number', minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @Optional()
  page?: number;
}
```

### 2. Search options — `server/src/repositories/search.repository.ts`

Add `filterEmbedding` and `filterDistanceThreshold` to `SmartSearchOptions`:

```typescript
export type SmartSearchOptions = SearchDateOptions &
  SearchEmbeddingOptions &
  SearchExifOptions &
  SearchOneToOneRelationOptions &
  SearchStatusOptions &
  SearchUserIdOptions &
  SearchPeopleOptions &
  SearchTagOptions &
  SearchOcrOptions & {
    filterEmbedding?: string;           // *** NEW ***
    filterDistanceThreshold?: number;   // *** NEW ***
  };
```

### 3. Search service — `server/src/services/search.service.ts`

Encode the content filter text using a CLIP prompt template and pass both embeddings
to the repository. The prompt template `"a photo of a ${concept}"` improves zero-shot
accuracy by ~5% (Radford et al., ICML 2021: "Learning Transferable Visual Models
From Natural Language Supervision"). Even the presence or absence of the article "a"
causes ~5% accuracy swings on some benchmarks (Zhou et al., CoOp, 2021).

```typescript
// Model-specific distance thresholds calibrated from LAION/DataComp benchmarks
const DEFAULT_FILTER_THRESHOLDS: Record<string, number> = {
  'ViT-B-32__openai': 0.70,
  'ViT-B-16__openai': 0.70,
  'ViT-L-14__openai': 0.72,
  'XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k': 0.74,
};

async searchSmart(auth: AuthDto, dto: SmartSearchDto): Promise<SearchResponseDto> {
  if (dto.visibility === AssetVisibility.Locked) {
    requireElevatedPermission(auth);
  }

  const { machineLearning } = await this.getConfig({ withCache: false });
  if (!isSmartSearchEnabled(machineLearning)) {
    throw new BadRequestException('Smart search is not enabled');
  }

  const userIds = this.getUserIdsToSearch(auth);

  // Encode main query — existing logic, unchanged
  let embedding;
  if (dto.query) {
    const key = machineLearning.clip.modelName + dto.query + dto.language;
    embedding = this.embeddingCache.get(key);
    if (!embedding) {
      embedding = await this.machineLearningRepository.encodeText(dto.query, {
        modelName: machineLearning.clip.modelName,
        language: dto.language,
      });
      this.embeddingCache.set(key, embedding);
    }
  } else if (dto.queryAssetId) {
    await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [dto.queryAssetId] });
    const getEmbeddingResponse = await this.searchRepository.getEmbedding(dto.queryAssetId);
    const assetEmbedding = getEmbeddingResponse?.embedding;
    if (!assetEmbedding) {
      throw new BadRequestException(`Asset ${dto.queryAssetId} has no embedding`);
    }
    embedding = assetEmbedding;
  } else {
    throw new BadRequestException('Either `query` or `queryAssetId` must be set');
  }

  // *** NEW: Encode content filter if provided ***
  let filterEmbedding: string | undefined;
  let filterDistanceThreshold: number | undefined;
  if (dto.contentFilter) {
    const filterPrompt = `a photo of a ${dto.contentFilter}`;
    const filterKey = machineLearning.clip.modelName + 'filter:' + filterPrompt + dto.language;
    filterEmbedding = this.embeddingCache.get(filterKey);
    if (!filterEmbedding) {
      filterEmbedding = await this.machineLearningRepository.encodeText(filterPrompt, {
        modelName: machineLearning.clip.modelName,
        language: dto.language,
      });
      this.embeddingCache.set(filterKey, filterEmbedding);
    }
    filterDistanceThreshold =
      DEFAULT_FILTER_THRESHOLDS[machineLearning.clip.modelName] ?? 0.70;
  }

  const page = dto.page ?? 1;
  const size = dto.size || 100;
  const { hasNextPage, items } = await this.searchRepository.searchSmart(
    { page, size },
    { ...dto, userIds: await userIds, embedding, filterEmbedding, filterDistanceThreshold },
  );

  return this.mapResponse(items, hasNextPage ? (page + 1).toString() : null, { auth });
}
```

### 4. Search repository — `server/src/repositories/search.repository.ts`

This is the core change. When `filterEmbedding` is provided, a single additional
`WHERE` clause adds an exact cosine distance check. This integrates with the existing
`searchAssetBuilder` chain using the `$if` pattern already used throughout the codebase.

An oversampling multiplier ensures enough candidates survive the filter intersection:

```typescript
@GenerateSql({
  params: [
    { page: 1, size: 200 },
    {
      takenAfter: DummyValue.DATE,
      embedding: DummyValue.VECTOR,
      lensModel: DummyValue.STRING,
      withStacked: true,
      isFavorite: true,
      userIds: [DummyValue.UUID],
    },
  ],
})
searchSmart(pagination: SearchPaginationOptions, options: SmartSearchOptions) {
  if (!isValidInteger(pagination.size, { min: 1, max: 1000 })) {
    throw new Error(`Invalid value for 'size': ${pagination.size}`);
  }

  return this.db.transaction().execute(async (trx) => {
    await sql`set local vchordrq.probes = ${sql.lit(probes[VectorIndex.Clip])}`.execute(trx);

    // Oversample when content filter is active to compensate for filtered-out candidates
    const effectiveLimit = options.filterEmbedding
      ? Math.min(pagination.size * 10, 5000)
      : pagination.size + 1;

    const items = await searchAssetBuilder(trx, options)
      .selectAll('asset')
      .innerJoin('smart_search', 'asset.id', 'smart_search.assetId')
      // *** NEW: Content filter — exact cosine distance threshold ***
      .$if(!!options.filterEmbedding, (qb) =>
        qb.where(
          sql`smart_search.embedding <=> ${options.filterEmbedding!}`,
          '<=',
          sql.lit(options.filterDistanceThreshold ?? 0.70),
        ),
      )
      .orderBy(sql`smart_search.embedding <=> ${options.embedding}`)
      .limit(effectiveLimit)
      .offset((pagination.page - 1) * pagination.size)
      .execute();

    // Trim oversampled results back to requested page size
    return paginationHelper(items.slice(0, pagination.size + 1), pagination.size);
  });
}
```

**What happens at query time:**

- **No content filter**: `$if(false, ...)` is a no-op and `effectiveLimit` is
  `pagination.size + 1`. Identical to the current behavior. Zero overhead.
- **With content filter**: Adds one `WHERE` clause. The ANN index scan still
  drives the `ORDER BY`. Each candidate row gets one extra cosine distance
  computation (~1μs). Candidates failing the threshold are skipped and the
  scan continues. The oversampled LIMIT ensures enough candidates survive.

### 5. Frontend — Search filter type and modal

**`web/src/lib/modals/SearchFilterModal.svelte`** — Add to SearchFilter type:

```typescript
export type SearchFilter = {
  query: string;
  contentFilter?: string;     // *** NEW ***
  ocr?: string;
  queryType: 'smart' | 'metadata' | 'description' | 'ocr';
  personIds: SvelteSet<string>;
  tagIds: SvelteSet<string> | null;
  location: SearchLocationFilter;
  camera: SearchCameraFilter;
  date: SearchDateFilter;
  display: SearchDisplayFilters;
  mediaType: MediaType;
  rating?: number;
};
```

Wire into the filter state initialization (around line 77):

```typescript
let filter: SearchFilter = $state({
  query,
  contentFilter: 'contentFilter' in searchQuery ? searchQuery.contentFilter : undefined,  // *** NEW ***
  ocr: searchQuery.ocr,
  // ... rest unchanged
});
```

Wire into the `resetForm()` function:

```typescript
const resetForm = () => {
  filter = {
    query: '',
    contentFilter: undefined,  // *** NEW ***
    ocr: undefined,
    // ... rest unchanged
  };
};
```

Wire into the `search()` function's payload builder (around line 146):

```typescript
let payload: SmartSearchDto | MetadataSearchDto = {
  query: filter.queryType === 'smart' ? query : undefined,
  contentFilter: filter.queryType === 'smart' ? (filter.contentFilter || undefined) : undefined,  // *** NEW ***
  ocr: filter.queryType === 'ocr' ? query : undefined,
  // ... rest unchanged
};
```

### 6. Frontend — New filter section component

**`web/src/lib/components/shared-components/search-bar/search-content-section.svelte`**

Follows the exact pattern of existing search section components (see
`search-ratings-section.svelte` and `search-text-section.svelte`):

```svelte
<script lang="ts">
  import { Field, Input, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    contentFilter: string | undefined;
  }

  let { contentFilter = $bindable() }: Props = $props();

  // CLIP cannot handle negation — embeddings for "a dog" and "no dog" are nearly
  // identical (Alhamoud et al., CVPR 2025: "VLMs Do Not Understand Negation")
  const hasNegation = $derived(
    contentFilter?.match(/\b(not|no|without|except|excluding)\b/i)
  );
</script>

<section>
  <Text class="mb-2" fontWeight="medium">{$t('content_type')}</Text>

  <Field label={$t('content_type')}>
    <Input
      type="text"
      placeholder={$t('content_filter_placeholder')}
      bind:value={contentFilter}
    />
  </Field>

  {#if hasNegation}
    <Text class="mt-1 text-xs text-orange-600 dark:text-orange-400">
      {$t('content_filter_negation_warning')}
    </Text>
  {:else}
    <Text class="mt-1 text-xs text-gray-500 dark:text-gray-400">
      {$t('content_filter_description')}
    </Text>
  {/if}
</section>
```

Drop it into the modal between existing sections. Only shown when query type is
"smart" (CLIP search), since the feature requires embeddings:

```svelte
<!-- In SearchFilterModal.svelte, inside the form -->

<!-- PEOPLE -->
<SearchPeopleSection bind:selectedPeople={filter.personIds} />

<!-- TEXT -->
<SearchTextSection bind:query={filter.query} bind:queryType={filter.queryType} />

<!-- CONTENT FILTER — only for smart search -->
{#if filter.queryType === 'smart'}
  <SearchContentSection bind:contentFilter={filter.contentFilter} />
{/if}

<!-- TAGS -->
<SearchTagsSection bind:selectedTags={filter.tagIds} />
```

### 7. i18n strings

Add to the translation files:

```json
{
  "content_type": "Content type",
  "content_filter_placeholder": "e.g. animal, food, vehicle, building...",
  "content_filter_description": "Filter results to photos matching this concept. Uses the same AI model as smart search.",
  "content_filter_negation_warning": "Negation (\"not\", \"without\") doesn't work reliably. Try describing what you want to see instead."
}
```

### 8. Search results chip display

In `web/src/routes/(user)/search/[[photos=photos]]/[[assetId=id]]/+page.svelte`,
update the `SearchTerms` type and `getHumanReadableSearchKey`:

```typescript
type SearchTerms = MetadataSearchDto & Pick<SmartSearchDto, 'query' | 'queryAssetId' | 'contentFilter'>;

function getHumanReadableSearchKey(key: keyof SearchTerms): string {
  const keyMap: Partial<Record<keyof SearchTerms, string>> = {
    // ... existing entries
    contentFilter: $t('content_type'),   // *** NEW ***
  };
  return keyMap[key] || key;
}
```

---

## What the user experience looks like

1. User clicks the filter icon (tune button) → SearchFilterModal opens
2. Types "sunset" in the search query field (smart search mode)
3. A new "Content type" field appears below (only in smart search mode)
4. Types "animal" in the Content type field
5. Clicks Search
6. Results show photos of animals in sunset-like settings
7. Two filter chips appear at top: "Context: sunset" and "Content type: animal"

**What works well:**
- Moderately specific categories: "dog", "car", "pizza", "beach" — CLIP's sweet spot
- Broad binary categories: "animal", "food", "building" — good discrimination
- Scene descriptors: "indoor", "outdoor", "night", "snowy" — effective

**What works less well:**
- Very fine-grained categories: specific car models, bird species — outside CLIP's
  reliable range (see Radford et al. 2021 on fine-grained classification limits)
- Abstract or subjective concepts: "beautiful", "interesting" — unreliable
- Negation: "not a dog" — CLIP collapses affirmative and negated statements into
  similar embeddings (Alhamoud et al., CVPR 2025). The UI warns against this.

---

## Edge cases and considerations

**No content filter provided**: The `.$if(false, ...)` branch produces identical
SQL to the current implementation. Zero overhead for users who don't use the feature.

**Content filter without query**: Currently requires either `query` or `queryAssetId`.
Could support content-filter-only by using `filterEmbedding` as the ranking
embedding too. Design decision for the PR discussion:

```typescript
// Option: if no query but filter provided, use filter as both rank and filter
if (!dto.query && !dto.queryAssetId && dto.contentFilter) {
  embedding = filterEmbedding;
}
```

**Very selective filters returning few results**: If a user searches "sunset" with
filter "penguin" and only 2 photos match, they'll see 2 results instead of the
requested 100. This is correct behavior — same as searching with a narrow date
range or specific city. The UI already handles partial result pages.

**Filter too broad**: A filter like "photo" matches almost everything (cosine
distance < 0.70 for most photos). This effectively becomes a no-op, which is
fine — the results just show "sunset" photos ranked normally.

**Threshold edge cases**: Some photos will be borderline (distance ≈ 0.70). The
model-specific threshold defaults are calibrated from LAION/DataComp benchmarks
but individual results will vary. Start with defaults and tune based on feedback.

**Performance for large libraries (100k+)**: The ANN scan + post-filter pattern
is the same mechanism used by existing metadata filters. For personal libraries
this stays well under 100ms. The oversampling multiplier (10x, capped at 5000)
ensures enough candidates survive without excessive scan cost.

---

## Future Enhancements (Out of Scope for v1)

### Prompt Ensembling for Broad Categories

The original CLIP paper showed that ensembling across multiple prompt templates
improved ImageNet zero-shot accuracy by ~3.5% over a single template. The CHiLS
paper (Novack et al., ICML 2023: "Zero-Shot Image Classification with Hierarchical
Label Sets") demonstrated that decomposing coarse categories into hierarchical
subclasses further improves accuracy at no training cost.

For a user query like "animal," averaging embeddings for "a photo of a dog,"
"a photo of a cat," "a photo of a bird," etc. would improve filter recall. The
current architecture supports this — `filterEmbedding` is just a vector, so an
averaged ensemble embedding drops in with zero changes to the repository layer.

A minimal implementation would ensemble across 7 templates from the CLIP paper:

```typescript
const FILTER_TEMPLATES = [
  'a photo of a {}',
  'a photo of the {}',
  'a good photo of a {}',
  'a photo of many {}',
  'a close-up photo of a {}',
  'a photo of a large {}',
  'a photo of a small {}',
];
// Encode each, then average and normalize the resulting vectors
```

For hierarchical decomposition (CHiLS approach), subclasses could be generated
via a static taxonomy or LLM-generated descriptions (CuPL approach, Pratt et al.
2023). This is more complex and should be explored after v1 ships.

### Reciprocal Rank Fusion as Alternative to Hard Thresholding

The hardest UX problem with the current approach is that any fixed distance
threshold is wrong for some queries. "Animal" at 0.70 works well; "penguin" at
0.70 may miss photos where the penguin is small in the frame.

Reciprocal Rank Fusion (Cormack, Clarke, and Büttcher, SIGIR 2009) eliminates
threshold sensitivity by combining rank positions rather than raw scores:

```
RRF_score(d) = 1/(k + rank_by_query) + 1/(k + rank_by_filter)
```

where k=60 is a smoothing constant. This changes the semantics from "must contain
X" (hard filter) to "prefer results containing X" (soft boost). RRF is natively
supported by Qdrant, Milvus, Elasticsearch, and can be implemented in PostgreSQL
via CTEs.

For Immich, RRF would require:
1. Running ANN search for both query and filter embeddings (two index scans)
2. Computing RRF scores in a CTE
3. Sorting by fused score

This is more expensive than the single-scan threshold approach but avoids both
the threshold sensitivity problem and the intersection recall loss (since RRF
operates on union, not intersection). Consider this as a "boost mode" toggle
alongside the existing "filter mode."

### Multiple Content Filters

Allow comma-separated concepts like "animal, outdoor" by encoding each and adding
multiple `WHERE distance <=` clauses. Each adds one more dot product per candidate.

### Negative Content Filter

"NOT food" — filter out photos matching a concept. Flip the inequality:
`WHERE distance > threshold`. Same mechanism, inverted. Note: this is different
from CLIP negation (which doesn't work). This uses positive CLIP matching and
inverts the SQL predicate.

### Adaptive Threshold

If the initial query returns fewer results than requested, automatically widen
the threshold and retry. This handles edge cases where the default threshold is
too strict for a particular concept.

---

## Files Changed (Summary)

```
server/src/dtos/search.dto.ts                            — add contentFilter field
server/src/repositories/search.repository.ts              — add types + $if clause + oversampling
server/src/services/search.service.ts                     — encode filter text, model-aware threshold
web/src/lib/modals/SearchFilterModal.svelte               — add to filter type + state + payload
web/src/lib/components/.../search-content-section.svelte  — new component (~30 lines, with negation warning)
web/src/routes/(user)/search/.../+page.svelte             — chip display (2 lines)
i18n translation files                                    — 4 new strings
```

No changes to: ML sidecar, database schema, migrations, ingest pipeline, or
existing CLIP models. Everything reuses existing infrastructure.

---

## Key References

- Radford et al. "Learning Transferable Visual Models From Natural Language
  Supervision" (ICML 2021) — CLIP paper, prompt template evaluation
- Novack et al. "CHiLS: Zero-Shot Image Classification with Hierarchical Label
  Sets" (ICML 2023) — hierarchical decomposition for zero-shot CLIP
- Zhou et al. "Learning to Prompt for Vision-Language Models" (CoOp, IJCV 2022)
  — prompt sensitivity analysis
- Alhamoud et al. "Vision-Language Models Do Not Understand Negation" (CVPR 2025)
  — negation limitation proof
- Gollapudi et al. "Filtered-DiskANN" (WWW 2023) — filtered ANN recall cliff
- Chronis et al. "Filtered Vector Search: State-of-the-Art" (VLDB 2025) — taxonomy
  of filtered vector search strategies
- Patel et al. "ACORN: Predicate-Agnostic Search" (SIGMOD 2024) — HNSW modifications
  for filtered search
- Cormack et al. "Reciprocal Rank Fusion" (SIGIR 2009) — RRF algorithm
- Schuhmann et al. "LAION-5B" (NeurIPS 2022) — cosine similarity thresholds
- Gadre et al. "DataComp" (NeurIPS 2023) — model-specific threshold calibration
