# Recent Trip Memory Curation Design

## Goal

Improve `recent_trip` memories so they feel curated instead of dumping a burst-heavy run of nearly identical photos.

The target behavior is:

- most trips show `6-8` photos
- longer trips can show up to `10`
- picks should cover the trip timeline instead of clustering around one moment
- photos taken within roughly the same moment should usually collapse to one representative
- the final memory should still read like a chronological trip recap

## Current Behavior

`server/src/services/memory-rules/recent-trip.rule.ts` currently:

- detects a trip candidate from recent location clusters
- fetches matching assets for the chosen place via `getMemoryAssetsForLocation`
- takes the returned asset IDs as-is
- returns them in the memory candidate without any curation

`server/src/repositories/asset.repository.ts` currently returns:

- only asset IDs
- ordered by `localDateTime asc`
- limited to `20`

That means the memory often shows:

- too many photos
- several nearly identical shots from one burst
- early-trip bias when a location has more than `20` qualifying assets

## Chosen Approach

Keep trip detection unchanged and add a deterministic curation pass after the trip location has already been chosen.

The curation pass should:

- operate entirely on the chosen trip asset pool
- collapse bursty adjacent shots using a `2` minute window
- favor coverage across trip days first
- fill extra slots with well-spaced moments across the full trip timeline
- return the final curated subset in chronological order

This keeps the behavioral change narrow:

- no change to home detection
- no change to trip qualification thresholds
- no change to cooldown behavior
- no change to other memory types

## Scope

### In Scope

- recent-trip asset curation in `server/src/services/memory-rules/recent-trip.rule.ts`
- expanding `getMemoryAssetsForLocation` so the rule can curate using timestamps
- adjusting the raw location asset pool so curation can cover the full trip timeline
- updating memory asset readback ordering so curated trip memories stay chronological when fetched back from the repository
- rule and medium test coverage for burst thinning, adaptive sizing, and chronological ordering

### Out of Scope

- visual similarity analysis
- favorites or rating-based selection
- randomization
- changing recent-trip qualification thresholds
- changing birthday or on-this-day memories
- UI or DTO changes

## Architecture

### Rule Boundary

`RecentTripMemoryRule` remains responsible for:

- detecting baseline home
- selecting the winning recent trip candidate
- enforcing same-place cooldown
- generating the final `recent_trip` memory candidate

The new responsibility added to the rule is a local curation step between:

1. `getMemoryAssetsForLocation(...)`
2. final `assetIds` assignment in the memory candidate

### Repository Boundary

`AssetRepository.getMemoryAssetsForLocation(...)` should change from returning only `{ id }` rows to returning:

- `id`
- `localDateTime`

The method should also stop using the current `limit 20` raw-pool cap.

Instead, it should return the full qualifying trip pool for the chosen location and time window, ordered by `localDateTime asc`.

Rationale:

- curation needs timestamps
- a hard `20`-asset cap biases selection toward the start of long burst-heavy trips
- this query only runs for one chosen trip candidate per owner per day, so a fuller pool is acceptable for this feature

`MemoryRepository.search(...)` and `getByIdBuilder(...)` should also stop ordering memory assets by `asset.fileCreatedAt` for this feature path.

They should order by `asset.localDateTime asc` instead.

Rationale:

- the trip rule now curates by capture timeline, not file import time
- if memory readback stays on `fileCreatedAt`, the UI can still display the curated subset in the wrong order
- ordering memory assets by `localDateTime asc` is a better fit for memory recap presentation in general

## Curation Pipeline

### Step 1: Build Burst Groups

Start from the trip asset pool ordered by `localDateTime asc`.

Create burst groups by scanning adjacent assets:

- if the gap from the previous asset is `<= 2` minutes, keep it in the same burst group
- if the gap is `> 2` minutes, start a new burst group

For v1, each burst group keeps exactly one representative asset:

- use the earliest asset in the burst group

This is intentionally simple and deterministic. It removes obvious repetition without introducing subjective quality scoring.

### Step 2: Group Burst Representatives By Day

After burst collapse, group the remaining representatives by trip day using the same `localDateTime` day semantics already used by memory clustering.

Each day bucket is ordered chronologically.

### Step 3: Choose Target Size

The curated target size should be adaptive:

- if the burst-representative count is `<= 6`, keep them all
- if the trip has at least `5` distinct days or at least `18` burst representatives, target `10`
- if the trip has at least `4` distinct days or at least `12` burst representatives, target `8`
- otherwise target `7`

This yields:

- `6-8` photos for most trips
- `10` only for clearly longer trips

### Step 4: Day Coverage First

First pass selection should maximize trip-day coverage:

- if the number of distinct day buckets is less than or equal to the target, pick one representative from every day
- if the number of day buckets exceeds the target, sample day buckets evenly across the trip timeline so the first and last trip days can both appear

When selecting one representative for a day:

- choose the representative nearest the midpoint of that day's representatives
- if the day has an even number of representatives, use the earlier of the two middle representatives

This avoids bias toward just the earliest photo on a day while still remaining deterministic.

### Step 5: Fill Remaining Slots With Spaced Moments

If the first pass does not fill the target:

- flatten the remaining unselected burst representatives in chronological order
- select additional representatives evenly across that remaining timeline until the target is reached

This second pass allows larger trips to show multiple moments from a day without collapsing back into burst-heavy runs.

### Step 6: Return Chronological Order

After selection:

- sort the chosen representatives back into chronological order
- use their IDs for the memory candidate

The memory should read as a coherent trip recap rather than a scored gallery.

## Presentation And Ranking

This change does not alter:

- the memory title
- the memory subtitle
- the rule score formula
- the rule dedupe key
- trip qualification thresholds

It does intentionally alter memory asset ordering on readback from `fileCreatedAt asc` to `localDateTime asc` so the curated recap order survives through the repository layer.

The subtitle should still describe the full detected trip cluster, for example:

- `12 photos over 2 days`

even if the curated memory only shows `7` selected photos.

## Edge Cases

If burst collapsing leaves only a small number of representatives:

- return the smaller curated set
- do not pad with near-duplicate burst shots just to hit the target

If one day contains only bursty photos:

- that day can still contribute one representative

If a trip spans many days but each day has only one representative:

- the memory may return more than `6` and up to the adaptive target, still in chronological order

If the trip has fewer than `7` qualifying raw assets or fewer than `2` days:

- trip qualification should still fail exactly as it does today

## Testing

### Rule Tests

Add focused coverage in `server/src/services/memory-rules/recent-trip.rule.spec.ts` for:

1. `Burst-heavy trip is curated down`
   - a qualifying trip pool with many adjacent shots
   - curated output is smaller than the raw pool
   - output stays within the adaptive target

2. `Two-minute burst collapse`
   - assets within `2` minutes collapse to one representative
   - assets outside the burst window can both remain

3. `Chronological order is preserved`
   - selected asset IDs are returned in chronological order after curation

4. `Coverage across multiple trip days`
   - a burst-heavy first day and a lighter second day
   - curated output still includes both days

5. `Small well-spaced trip pool stays intact`
   - when the representative pool is already `<= 6`
   - the rule returns all representatives unchanged

6. `Long trip caps at ten while spanning the trip timeline`
   - more representative days than the target allows
   - curated output caps at `10`
   - first and last trip days can still appear

### Medium Tests

Add a real-DB regression in `server/test/medium/specs/services/memory.service.spec.ts`:

- seed a qualifying recent trip with:
  - one burst-heavy day
  - one lighter day
  - a valid home baseline
- assert the generated `recent_trip` memory:
  - is created successfully
  - contains fewer assets than the raw qualifying trip pool
  - includes both trip days
  - keeps the assets in chronological `localDateTime` order after readback

## Risks

The main tradeoff is that pure time-based burst thinning can still keep a suboptimal frame from a burst, because this design intentionally avoids visual scoring.

That is acceptable for v1 because:

- it solves the obvious repetition problem the user reported
- it stays lightweight and deterministic
- it creates a clean base for future quality signals like favorites, ratings, or visual similarity
