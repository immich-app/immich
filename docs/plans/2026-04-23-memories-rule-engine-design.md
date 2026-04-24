# Memories Rule Engine Design

## Goal

Extend the existing Memories feature beyond "same day in prior years" while keeping the fork easy to maintain against upstream.

The first iteration should:

- preserve the current `on_this_day` behavior
- add a generic rule-based memory path
- ship exactly two rule-based memory types: `birthday` and `recent_trip`
- avoid new user/admin settings in v1
- keep future rule additions mostly server-side

## Existing Constraints

The current implementation is narrow on the server and rigid in presentation:

- nightly generation is orchestrated in `server/src/services/memory.service.ts`
- generated memories are stored in the existing `memory` table with generic fields: `type`, `data`, `memoryAt`, `showAt`, and `hideAt`
- the web and mobile clients currently assume an `on_this_day` shape and derive presentation from `data.year`

This means the server is already flexible enough to store more kinds of memories, but the API and clients should not gain one new rendering branch per rule.

## Chosen Approach

Use a small server-side rule registry rather than:

- adding every new rule directly into `MemoryService`
- making the system config-driven in v1
- allowing user-defined rules

The selected approach is:

- keep `on_this_day` as-is
- add one generic rule-based memory type
- define built-in rules in code
- have the server provide `title` and optional `subtitle` for display

This keeps the initial patch moderate while minimizing future fork maintenance.

## Scope

### In Scope

- add a generic rule-based memory type
- add server-owned `title` and `subtitle` support for memories
- implement the `birthday` rule
- implement the `recent_trip` rule
- supplement existing `on_this_day` memories with rule-based memories
- cap rule-based memories to at most `2` per user per day
- add dedupe protection for rule-based memories

### Out of Scope

- user-configurable rules
- per-rule user toggles
- per-rule admin toggles
- fully declarative/config-defined rules
- replacing or re-ranking `on_this_day`
- any new UI surface that separates rule memories visually from existing memories
- additional v1 rules such as `person_moment`

## Architecture

`MemoryService` remains the entrypoint for nightly memory generation. The existing `on_this_day` generation path stays intact.

Add a second generation path for rule-based memories:

1. fetch the users to process
2. run existing `on_this_day` generation
3. run a small registry of rule evaluators for the same user/date
4. collect rule candidates
5. remove duplicates
6. sort by score
7. cap to the allowed daily count
8. persist through the existing memory repository

`MemoryService` should only orchestrate this flow. Rule logic should live outside the service in:

- `server/src/services/memory-rules/`

Recommended structure:

- `memory-rule.interface.ts`
- `birthday.rule.ts`
- `recent-trip.rule.ts`
- shared helpers only where both rules actually need them

## Rule Interface

Each built-in rule should return a common candidate shape.

Example:

```ts
interface MemoryCandidate {
  type: MemoryType.Rule;
  ruleId: string;
  dedupeKey: string;
  title: string;
  subtitle?: string;
  score: number;
  assetIds: string[];
  memoryAt: string;
  showAt?: string;
  hideAt?: string;
  context?: Record<string, unknown>;
}

interface MemoryRule {
  id: string;
  evaluate(input: MemoryRuleContext): Promise<MemoryCandidate[]>;
}
```

`MemoryService` should not need to understand rule-specific logic beyond consuming `MemoryCandidate`.

## Data Model

Keep the existing `memory` table unchanged.

Add one new memory type:

- `on_this_day`
- `rule`

Rule-specific information lives in `memory.data`.

Example rule memory payload:

```json
{
  "ruleId": "birthday",
  "dedupeKey": "birthday:person-123:04-23",
  "title": "Happy birthday, Alice",
  "subtitle": "Photos from different years",
  "score": 0.92,
  "context": {
    "personId": "person-123"
  }
}
```

This avoids one enum expansion and one client rendering branch per future rule.

## API And Presentation

The server should own presentation for rule-based memories.

Add the following fields to memory responses:

- `title: string`
- `subtitle?: string`

Behavior:

- for `on_this_day`, the server can still derive title from `data.year`
- for `rule`, the server returns `title` and `subtitle` from the stored rule payload

Clients should render these fields directly instead of interpreting each rule.

This is the key maintenance decision: future rule additions should usually not require web/mobile code changes beyond generic rendering support.

## Rule Semantics

### Birthday

Trigger condition:

- a visible, named person has a `birthDate` whose month/day matches the target date

Selection behavior:

- gather strong photos for that person across multiple years
- prefer a retrospective mix rather than only recent assets
- skip people with too few good assets

Dedupe:

- one birthday memory per person per year

Priority:

- deterministic and high-confidence
- should generally outrank `recent_trip`

### Recent Trip

Trigger condition:

- there is a strong recent cluster of assets outside the user’s normal location

Heuristic:

- inspect the last `30` days
- infer a baseline "normal location" from the preceding `90` days
- detect a cluster in a different place

Confidence requirements:

- at least `7` assets
- at least `2` distinct days
- enough location confidence to produce a trustworthy place label

Location rules:

- prefer `country` as the primary signal
- use `city` only when the metadata is clean enough
- if baseline or trip confidence is weak, generate nothing

Dedupe:

- one trip memory per stable trip identity

## Ranking And Limits

Rule-based memories supplement `on_this_day`; they do not compete with or replace it.

Daily behavior:

- allow at most `2` rule-based memories per user per day
- use score ordering when more than two candidates survive filtering
- apply a `30` day cooldown for `recent_trip` on the same normalized place label

Recommended ranking:

- `birthday` above `recent_trip`
- stronger asset sets above weaker ones within the same rule

## Dedupe And State

Rule memories must be idempotent.

Each candidate gets a stable `dedupeKey`. Before creating a rule memory, the server checks whether the same owner already has a `rule` memory with the same:

- `ruleId`
- `dedupeKey`

This dedupe check is the primary duplicate-prevention mechanism and should protect retries, restarts, and backfills.

Lightweight generation state can still exist for efficiency, but correctness should not depend on it.

## Failure Handling

Generation should fail soft.

Rules are independent:

- if `recent_trip` errors, `birthday` and `on_this_day` should still run
- weak or missing data should result in no candidate, not an exception

Examples:

- no `birthDate` for a person: skip
- too few assets for a birthday memory: skip
- sparse or ambiguous GPS metadata: skip
- unclear home-location baseline: skip

Cleanup behavior should remain unchanged. Unsaved rule memories should expire under the same rules as existing unsaved memories.

## Testing

Testing should stay mostly server-side.

Add unit coverage for:

- birthday memory generation
- recent trip generation
- no-op when signals are too weak
- dedupe prevention
- daily rule-memory cap
- fail-soft behavior when one rule throws

Add a focused repository test if a new dedupe lookup helper is introduced.

Client changes should be minimal and generic:

- render `title`
- render optional `subtitle`
- avoid rule-specific client logic

## Why This Is Not Config-Driven In V1

A config-driven system is intentionally deferred.

Compared with the selected rule registry, a config-defined engine would also require:

- rule schema design
- validation and migration behavior
- defaults and override semantics
- config UI or API decisions
- more complicated testing around misconfiguration

That is materially more work and introduces a second product surface. It is not necessary to ship useful improvements in the first iteration.

## Future Evolution

If the first iteration proves useful, future work can add:

- more built-in rules such as `person_moment`
- user-level per-rule toggles
- admin-level enable/disable controls
- template-based rule customization

Fully arbitrary user-defined rules are explicitly not part of this design. That would be a separate product-scale feature with much higher complexity.

## Summary

The chosen design keeps the fork maintainable by:

- preserving the existing `on_this_day` path
- adding one generic rule-based memory type
- keeping built-in rules server-side
- using server-owned `title` and `subtitle`
- shipping only `birthday` and `recent_trip` in v1
- avoiding config-driven or user-defined rule systems for now

This gives the Memories feature room to grow without turning every new rule into a broad full-stack change.
