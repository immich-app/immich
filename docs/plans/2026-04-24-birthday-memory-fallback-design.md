# Birthday Memory Fallback Design

## Goal

Relax the birthday memory rule so a person can still receive a birthday memory when there is not enough multi-year history, while preserving the current retrospective behavior when that history exists.

This is motivated by the current live behavior on April 24, 2026:

- `Pierre` has a matching `birthDate`
- `Pierre` has exactly `4` visible face-linked timeline assets
- all `4` assets are from `2026`
- the current rule emits nothing because it requires `6+` assets across `2+` distinct years

The desired outcome is that Pierre should receive a birthday memory from those `4` qualifying photos.

## Current Behavior

Birthday memories are generated in `server/src/services/memory-rules/birthday.rule.ts`.

Today the rule:

- fetches people whose `birthDate` month/day matches the target date
- loads visible face-linked timeline assets for each person
- groups those assets by year
- keeps at most `2` assets per year
- requires both:
  - at least `6` selected assets total
  - at least `2` distinct years
- emits a candidate with:
  - title `Happy birthday, <name>`
  - subtitle `Photos from different years`

This makes the feature read as a birthday throwback, but it rejects people who only have recent qualifying photos.

## Chosen Approach

Keep one birthday rule with two eligibility paths:

1. `Throwback path`
   Preserve the current behavior when the person has enough qualifying assets across multiple years.
2. `Snapshot fallback path`
   If the throwback path does not qualify, allow a birthday memory from recent photos only.

The fallback path should:

- require at least `4` qualifying assets total
- not require multiple years
- keep the title `Happy birthday, <name>`
- use subtitle `Recent photos of <name>`

The fallback path only runs when the throwback path fails, so the multi-year retrospective memory remains the preferred form.

## Scope

### In Scope

- changing birthday-rule eligibility in `server/src/services/memory-rules/birthday.rule.ts`
- adding fallback birthday candidate generation for single-year photo sets
- slightly changing birthday-only asset selection so the fallback path can actually produce `4` same-year assets
- adjusting birthday rule scoring so:
  - multi-year throwback remains preferred
  - fallback birthday still outranks `recent_trip` on the same day
- adding focused server test coverage for both paths

### Out of Scope

- burst-thinning or near-duplicate filtering
- changes to repository queries
- changes to DTOs or API shape
- changes to web or mobile rendering
- changes to recent-trip behavior
- introducing a new memory type or rule id

## Rule Semantics

### Throwback Path

The current path remains the preferred birthday candidate.

Eligibility:

- month/day matches the target date
- selected asset pool yields at least `6` assets total
- selected asset pool spans at least `2` distinct years

Presentation:

- title `Happy birthday, <name>`
- subtitle `Photos from different years`

Scoring:

- keep this above the fallback path
- move birthday memories into a dedicated score band above the current `recent_trip` maximum so birthday wins without changing service orchestration

### Snapshot Fallback Path

This path runs only when the throwback path does not qualify.

Eligibility:

- month/day matches the target date
- at least `4` qualifying assets total after the existing asset selection logic
- no distinct-year requirement

Presentation:

- title `Happy birthday, <name>`
- subtitle `Recent photos of <name>`

Scoring:

- lower than the throwback path
- higher than the current `recent_trip` maximum so a birthday memory wins on that day

## Asset Selection

Do not change the repository query in this change.

That means:

- qualifying assets still come from `getMemoryAssetsForPerson`
- the throwback path still groups by year
- the throwback path still keeps at most `2` assets per year
- the fallback path does **not** reuse the `2`-per-year cap
- instead, the fallback path takes the `4` most recent qualifying assets overall
- the fallback path may therefore use multiple assets from the same year and same day

This is intentional for this change. Duplicate suppression and burst-thinning are a separate follow-up.

## Data And API Impact

No schema changes.

No API changes.

No UI changes.

The existing memory payload shape remains valid because the server already owns `title` and `subtitle`.

## Ranking

Birthday candidates should continue to outrank `recent_trip`.

Implementation requirement:

- multi-year throwback score stays above fallback birthday score
- fallback birthday score stays above the current `recent_trip` maximum produced by the current rule for the 30-day window

The exact numeric values can be chosen during implementation, but this ordering must be covered by tests.

## Testing

Add focused coverage in:

- `server/src/services/memory-rules/birthday.rule.spec.ts`
- `server/src/services/memory.service.spec.ts`
- `server/src/dtos/memory.dto.spec.ts` if needed to confirm display fields remain correct for fallback birthday memories

Required cases:

1. Single-year fallback qualifies
   - matching birthday
   - exactly `4` qualifying assets from one year
   - emits one birthday candidate
   - subtitle is `Recent photos of <name>`

2. Single-year fallback does not qualify below threshold
   - matching birthday
   - only `3` qualifying assets
   - emits no candidate

3. Multi-year throwback still wins
   - matching birthday
   - `6+` qualifying assets across `2+` years
   - emits the existing throwback variant only
   - subtitle remains `Photos from different years`

4. Ranking against recent trip
   - when a fallback birthday and a recent trip candidate exist on the same day
   - the birthday candidate should be selected ahead of the highest-scoring `recent_trip` case supported by the current formula

5. Live Pierre regression shape
   - `4` qualifying assets in one year only
   - birthday candidate is generated
   - all `4` assets are included despite the throwback path's `2`-per-year cap

## TDD Order

1. Add failing birthday-rule tests for the `4`-asset fallback and the `3`-asset rejection.
2. Add a service-level failing test proving fallback birthday outranks `recent_trip`.
3. Implement the minimal eligibility and scoring change in `birthday.rule.ts`.
4. Update any title/subtitle assertions needed for DTO or service tests.
5. Re-run focused server tests.

## Risks

The main product risk is that fallback birthday memories can be visually repetitive because this change does not thin burst shots.

That is acceptable for this task because:

- the user explicitly wants eligibility relaxed first
- the rule currently emits nothing for people like Pierre
- asset curation quality can be improved in a separate follow-up once the eligibility behavior is correct
