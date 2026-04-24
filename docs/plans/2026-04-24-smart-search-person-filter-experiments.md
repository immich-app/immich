# Smart Search Person Filter Experiments

## Context

We investigated slow `searchSmart` requests when a single `personId` filter is applied on a large library.

The original production issue had two separate problems:

1. The inner smart-search query sometimes included a secondary tiebreaker and pushed Postgres off the `clip_index` ordered scan.
2. Even after restoring the ANN path, one-person filtered searches could still be slow on a large person cluster.

This document records the release-candidate experiments run against a real user dataset and the decision taken from those results.

## Dataset Notes

- The user tested against a large library with a single frequently-used person that matched roughly `50k` assets.
- Automatic library watching was later disabled because it was producing unrelated `EMFILE` / "too many open files" errors on the mounted library path.
- The final RC3 run was the cleanest environment because the watcher noise was removed.

## Experiments

| RC  | Image Tag                            | Commit      | Query Shape                                                                                    | Result                                                                                             |
| --- | ------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| RC1 | `fix-search-smart-person-filter-rc1` | `8b97cb2ea` | `clip_index` ordered scan with correlated `EXISTS` for `personIds`                             | Fixed the original bad grouped-face plan and gave the best overall baseline                        |
| RC2 | `fix-search-smart-person-filter-rc2` | `3f70fa8c7` | Runtime heuristic: exact `person_assets` subset-sort for one-person searches under a threshold | Helped some cases, but regressed others badly on large person clusters                             |
| RC3 | `fix-search-smart-person-filter-rc3` | `83d8570aa` | Lowered the heuristic threshold so this user fell back to ANN-first again                      | Reverted to the RC1-style path for this user, but performed worse than RC1 on the key `books` case |

## Representative Snippets

### RC1: ANN-first with correlated `EXISTS`

Representative SQL shape:

```sql
select to_json("asset_exif") as "exifInfo", "asset".*
from "asset"
inner join "asset_exif" on "asset"."id" = "asset_exif"."assetId"
inner join "smart_search" on "asset"."id" = "smart_search"."assetId"
where "asset"."visibility" = $1
  and "asset"."ownerId" = any($2::uuid[])
  and "asset"."deletedAt" is null
  and (smart_search.embedding <=> $3) <= $4
  and exists (
    select
    from "asset_face"
    where "asset_face"."assetId" = "asset"."id"
      and "asset_face"."deletedAt" is null
      and "asset_face"."isVisible" is true
      and "asset_face"."personId" = $5::uuid
  )
order by smart_search.embedding <=> $6
limit $7 offset $8
```

Representative implementation:

```ts
let baseQuery = searchAssetBuilder(kysely, {
  ...without(options, 'personIds', 'personMatchAny'),
  ratingIsMinimum: true,
})
  .selectAll('asset')
  .innerJoin('smart_search', 'asset.id', 'smart_search.assetId')
  .orderBy(sql`smart_search.embedding <=> ${options.embedding}`);

baseQuery = baseQuery.where((eb) =>
  eb.exists(
    eb
      .selectFrom('asset_face')
      .whereRef('asset_face.assetId', '=', 'asset.id')
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', 'is', true)
      .where('asset_face.personId', '=', asUuid(personId)),
  ),
);
```

### RC2: exact `person_assets` subset-sort

Representative SQL shape:

```sql
select to_json("asset_exif") as "exifInfo", "asset".*
from "asset"
inner join "asset_exif" on "asset"."id" = "asset_exif"."assetId"
inner join (
  select distinct "assetId"
  from "asset_face"
  where "asset_face"."personId" = $1::uuid
    and "asset_face"."deletedAt" is null
    and "asset_face"."isVisible" is true
) as "person_assets" on "person_assets"."assetId" = "asset"."id"
inner join "smart_search" on "asset"."id" = "smart_search"."assetId"
where "asset"."visibility" = $2
  and "asset"."ownerId" = any($3::uuid[])
  and "asset"."deletedAt" is null
  and (smart_search.embedding <=> $4) <= $5
order by smart_search.embedding <=> $6
limit $7 offset $8
```

Representative implementation:

```ts
export const PERSON_SUBSET_RUNTIME_COUNT_THRESHOLD = 75_000;

const strategy = personAssetCount <= PERSON_SUBSET_RUNTIME_COUNT_THRESHOLD ? 'personSubset' : 'annExists';
```

### RC3: lower the threshold and fall back to ANN

Representative implementation:

```ts
export const PERSON_SUBSET_RUNTIME_COUNT_THRESHOLD = 20_000;
```

This did not introduce a new query shape. It only changed which branch the runtime heuristic picked for the user dataset, sending the one-person case back to the RC1 ANN-first path.

## Outcome Summary

### RC1

- The person filter no longer forced the old grouped `asset_face` plan.
- Filtered smart search used `clip_index` plus correlated `EXISTS`.
- This was the safest and most generally-correct fix.

Observed tradeoff:

- Some one-person queries were still slow because the ANN scan had to walk deep into `clip_index` before enough results also matched the person filter.

### RC2

- Added a cheap runtime count heuristic for one-person searches.
- For users below the threshold, it materialized `person_assets` first and performed an exact distance sort on that subset.

Observed tradeoff:

- `books` improved substantially on the user dataset.
- `dress` also improved.
- `trees` regressed, and the plan showed that exact sorting across a `~50k`-asset person subset was still too expensive.
- This made the heuristic too unstable to ship as a general solution.

### RC3

- Lowered the threshold from `75_000` to `20_000` so this user's `~50k`-asset person would fall back to the ANN path again.

Observed tradeoff:

- The one-person filtered path returned to `clip_index + EXISTS`.
- The watcher noise was gone, so the run isolated search behavior better.
- Despite that cleaner setup, the filtered `books` query became the worst result of all three RCs.
- `clip_index` was also mostly cold in shared buffers during the run, which amplified the first-query latency.

## Query Comparison

The table below focuses on one-person filtered searches from the user runs.

| Query       |                 RC1 |                 RC2 |                  RC3 | Preferred              |
| ----------- | ------------------: | ------------------: | -------------------: | ---------------------- |
| `books`     | `9224ms`, `47` rows | `5073ms`, `83` rows | `11242ms`, `47` rows | RC2 on this query only |
| `mountains` |            `3561ms` |            `3689ms` |             `3810ms` | RC1                    |
| `trees`     |            `2483ms` |            `3944ms` |             `2597ms` | RC1                    |
| `dress`     |            `4254ms` |            `3135ms` |                  n/a | RC2 on this query only |
| `beach`     |      n/a one-person |            `3043ms` |             `1634ms` | RC3 on this query only |

These runs were not stable enough across queries to justify shipping the heuristic path.

## Decision

Keep the RC1 change only:

- keep `fix(search): keep smart search index path with person filters`

Discard the heuristic experiments:

- discard `perf(search): add runtime heuristic for one-person filters`
- discard `perf(search): lower one-person subset threshold`

Why this decision was taken:

- RC1 fixes the original planner regression and is the safest change to merge.
- RC2 helps some queries but is too inconsistent on large one-person clusters.
- RC3 does not improve the baseline enough to justify the extra complexity and was worse than RC1 on the user's key `books` case.

## Follow-up Direction

If person-filtered ANN search needs another optimization later, the next attempt should not be another static count-threshold switch.

More promising directions would be:

- adaptive ANN candidate widening with reranking
- a more selective hybrid strategy informed by actual post-filter candidate density, not just raw person asset count
- additional investigation into cache warmth and `clip_index` residency for first-hit latency
