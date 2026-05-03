# Global Face Identities: Schema Backfill Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for every code task. Use superpowers:verification-before-completion before claiming this phase is done. This is phase 1 of the global face identities roadmap.

**Goal:** Add the internal Face Identity persistence layer, backfill existing personal people, link native recognition output to identities, and keep identity links correct when faces move, merge, reset, or disappear. This phase must not change public DTO behavior or expose identity ids.

**Architecture:** Add `face_identity` and `face_identity_face` beneath existing `person`, `shared_space_person`, and `asset_face` rows. `person.identityId` and `shared_space_person.identityId` are scoped profile links to the internal identity. `face_identity_face` links each visible active `asset_face` row to exactly one identity. Repository methods own identity creation, replacement, unlinking, backfill, and merge semantics so service code never hand-edits the graph.

**Tech Stack:** NestJS, Kysely, `@immich/sql-tools`, gallery migrations, BullMQ job handlers, Vitest small and medium tests, generated SQL snapshots.

---

## Scope

This phase owns these umbrella items:

- Task 1, Ubiquitous Language Update.
- Task 2, Identity Schema And Test Wiring.
- Task 3, Chunked Identity Backfill Job.
- Task 4, Native Recognition Creates Identity Links.
- The identity-link maintenance parts of Task 10 and Task 11 where stale or duplicate identity links would break later phases.

This phase intentionally does not add identity-grouped `/people`, filter panel tokens, global search results, manual repair endpoints, or metadata inheritance behavior. Those become observable in later split plans.

## File Map

- Modify `docs/docs/developer/ubiquitous-language.md`
  - Define Face Identity, Identity-linked face, Scoped person profile, Metadata inheritance, Metadata contribution, Identity-grouped person, Scoped primary profile, and Scoped identity filter token.
- Create `server/src/schema/tables/face-identity.table.ts`
  - Internal identity row with timestamps and update trigger.
- Create `server/src/schema/tables/face-identity-face.table.ts`
  - One active identity link per visible `asset_face` row.
- Modify `server/src/schema/tables/person.table.ts`
  - Add nullable `identityId` with index and foreign key.
- Modify `server/src/schema/tables/shared-space-person.table.ts`
  - Add nullable `identityId`, `nameSource`, `nameSourceProfileType`, `nameSourceProfileId`, `nameSourceUpdatedAt`, `birthDateSource`, `birthDateSourceProfileType`, `birthDateSourceProfileId`, and `birthDateSourceUpdatedAt`.
- Modify `server/src/schema/tables/shared-space-member.table.ts`
  - Add `sharePersonMetadata boolean default true`. Do not expose or use it until phase 2.
- Modify `server/src/schema/index.ts`
  - Register identity tables and DB interface entries.
- Modify `server/src/database.ts`
  - Add identity and metadata-source columns to generated DB types.
- Create `server/src/schema/migrations-gallery/1778400000000-AddFaceIdentities.ts`
  - Add tables, columns, constraints, indexes, and triggers. Do not copy names or birth dates in this migration.
- Create `server/src/repositories/face-identity.repository.ts`
  - Owns identity creation, face linking, face replacement, unlinking, merging, and backfill persistence.
- Modify `server/src/services/base.service.ts`
  - Add `FaceIdentityRepository` to base dependencies.
- Modify `server/test/utils.ts`, `server/test/medium.factory.ts`, and `server/test/small.factory.ts`
  - Add repository mocks and identity test helpers.
- Create `server/test/medium/specs/repositories/face-identity.repository.spec.ts`
  - Medium tests for constraints, idempotency, replacement, unlinking, merging, and backfill.
- Modify `server/src/services/person.service.ts`
  - Link identities during native recognition and call identity lifecycle methods during personal face operations.
- Modify `server/src/services/person.service.spec.ts`
  - Unit tests for job orchestration and lifecycle calls.
- Modify `server/src/repositories/person.repository.ts`
  - Add the minimal query support needed by backfill and lifecycle operations.

## TDD Rules

- Start each task by adding or updating tests and running the targeted test command to confirm the expected failure.
- Make only the smallest implementation needed for the current failing tests.
- Commit after each task when implementing the feature. The documentation split can be committed as one docs commit.
- Keep raw `face_identity.id` internal. It must not appear in response DTOs, generated SDK models, route params, user-facing logs, web stores, or public snapshots.
- Add or review indexes in the same task that introduces a query path. Performance issues from missing indexes are schema bugs in this phase.

---

### Task 1: Update Ubiquitous Language

**Files:**

- Modify `docs/docs/developer/ubiquitous-language.md`

- [ ] **Step 1: Write the failing terminology check**

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
rg -n "Face Identity|Identity-linked face|Scoped person profile|Metadata inheritance|Metadata contribution|Identity-grouped person|Scoped primary profile|Scoped identity filter token" docs/docs/developer/ubiquitous-language.md
```

Expected: FAIL or partial matches because the vocabulary is incomplete.

- [ ] **Step 2: Add the new terms and update adjacent language**

Add the agreed terms:

```md
| **Face Identity** | The internal sameness key for one real person or pet across Personal People and Space People. | Global Person, universal person |
| **Identity-linked face** | A visible `asset_face` row linked to one Face Identity through `face_identity_face`. | Global face |
| **Scoped person profile** | A user-scoped `person` or space-scoped `shared_space_person` row that carries display metadata inside one permission boundary. | Person record |
| **Metadata inheritance** | Copying permitted fields, such as name and birth date, from a source scoped profile into a target Space Person. | Metadata sync |
| **Metadata contribution** | A Space member's setting-controlled ability to publish selected Personal Person fields into a Space Person. | Name sharing |
| **Identity-grouped person** | A `/people`, filter, or search result that represents one accessible Face Identity and is rendered only from accessible scoped profiles. | Global person row |
| **Scoped primary profile** | The accessible Personal Person or Space Person profile used as the navigation and thumbnail target for an identity-grouped person. | Primary person |
| **Scoped identity filter token** | An opaque profile-scoped filter value such as `person:<id>` or `space-person:<id>` that resolves to an accessible Face Identity without exposing `face_identity.id`. | Identity id |
```

Update the People and recognition, Search and filtering, Relationships, Recommended conversation patterns, Implementation anchors, and Flagged ambiguities sections so Personal People, Space People, Face Identities, and identity-grouped people have distinct meanings.

- [ ] **Step 3: Verify**

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
pnpm --dir docs exec prettier --check ../docs/docs/developer/ubiquitous-language.md
rg -n "Face Identity|Scoped identity filter token|Identity-grouped person" docs/docs/developer/ubiquitous-language.md
```

Expected: PASS.

---

### Task 2: Add Schema And Migration

**Files:**

- Create `server/src/schema/tables/face-identity.table.ts`
- Create `server/src/schema/tables/face-identity-face.table.ts`
- Modify `server/src/schema/tables/person.table.ts`
- Modify `server/src/schema/tables/shared-space-person.table.ts`
- Modify `server/src/schema/tables/shared-space-member.table.ts`
- Modify `server/src/schema/index.ts`
- Modify `server/src/database.ts`
- Create `server/src/schema/migrations-gallery/1778400000000-AddFaceIdentities.ts`

- [ ] **Step 1: Write failing medium migration tests**

Create the first cases in `server/test/medium/specs/repositories/face-identity.repository.spec.ts`:

```ts
it('enforces one identity per personal profile and one active identity per face', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const person = await ctx.newPerson({ ownerId: user.id });
  const asset = await ctx.newAsset({ ownerId: user.id });
  const face = await ctx.newFace({ assetId: asset.id, personId: person.id });

  const identity = await sut.ensurePersonIdentity(person.id);
  await sut.linkFace({ assetFaceId: face.id, identityId: identity.id, source: 'native-recognition' });

  await expect(
    sut.linkFace({ assetFaceId: face.id, identityId: identity.id, source: 'native-recognition' }),
  ).resolves.toEqual(expect.objectContaining({ assetFaceId: face.id, identityId: identity.id }));
});

it('does not backfill hidden or deleted faces as identity-linked faces', async () => {
  // Seed one visible face and one inactive face for the same person, then assert only the visible face is linked.
});
```

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
pnpm --dir server test:medium -- face-identity.repository
```

Expected: FAIL because the tables and repository do not exist.

- [ ] **Step 2: Add SQL-tools tables**

Create `FaceIdentityTable` with:

- `id uuid primary key default immich_uuid_v7()`.
- `type varchar not null default 'person'` with allowed values `person` and `pet`.
- `representativeFaceId uuid null references asset_face(id) on delete set null`.
- `createdAt timestamptz not null default now()`.
- `updatedAt timestamptz not null default now()`.
- `updateId uuid not null default immich_uuid_v7()`.
- update trigger matching existing timestamp conventions.

Create `FaceIdentityFaceTable` with:

- `identityId` foreign key to `face_identity(id)` with cascade delete.
- `assetFaceId` foreign key to `asset_face(id)` with cascade delete.
- `source` string, initially `owner-person`, `ml`, `backfill`, `shared-space-evidence`, `manual`, or `import`.
- `confidence` nullable float or numeric if the codebase already uses numeric confidence for recognition links.
- `createdAt` and `updatedAt`.
- primary key on `assetFaceId`.
- index on `identityId`.

Modify scoped profiles:

- `person.identityId uuid null references face_identity(id) on delete set null`.
- `shared_space_person.identityId uuid null references face_identity(id) on delete set null`.
- unique index on `person(ownerId, identityId)` where `identityId is not null`.
- unique index on `shared_space_person(spaceId, identityId)` where `identityId is not null`.

Add metadata-source columns to `shared_space_person` with defaults:

- `nameSource varchar not null default 'none'`.
- `nameSourceProfileType varchar null`.
- `nameSourceProfileId uuid null`.
- `nameSourceUpdatedAt timestamptz null`.
- `birthDateSource varchar not null default 'none'`.
- `birthDateSourceProfileType varchar null`.
- `birthDateSourceProfileId uuid null`.
- `birthDateSourceUpdatedAt timestamptz null`.

Add `shared_space_member.sharePersonMetadata boolean not null default true`.

- [ ] **Step 3: Add migration**

Create `1778400000000-AddFaceIdentities.ts` with additive `up()` and reverse `down()`.

Migration requirements:

- Create identity tables before foreign-key columns.
- Add indexes used by phase 1 queries:
  - `face_identity_face(identityId)`.
  - `face_identity(representativeFaceId) where representativeFaceId is not null`.
  - `person(identityId) where identityId is not null`.
  - `asset_face(personId) where personId is not null`.
  - `shared_space_person(spaceId, identityId) where identityId is not null`.
  - `shared_space_person(identityId, spaceId) where identityId is not null`.
- Do not copy `person.name`, `person.birthDate`, aliases, hidden state, favorite state, or thumbnails into any space row.
- Do not enqueue inheritance jobs.

- [ ] **Step 4: Wire DB types**

Update `server/src/schema/index.ts` and `server/src/database.ts`.

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
pnpm --dir server run migrations:generate
pnpm --dir server test:medium -- face-identity.repository
```

Expected after implementation: the schema exists and the initial repository tests now fail only on missing repository methods.

---

### Task 3: Implement FaceIdentityRepository

**Files:**

- Create `server/src/repositories/face-identity.repository.ts`
- Modify `server/src/services/base.service.ts`
- Modify `server/test/utils.ts`
- Modify `server/test/medium.factory.ts`
- Modify `server/test/small.factory.ts`
- Modify `server/test/medium/specs/repositories/face-identity.repository.spec.ts`

- [ ] **Step 1: Expand failing repository tests**

Add medium tests for:

- `ensurePersonIdentity(personId)` is idempotent and assigns `person.identityId`.
- `ensureSpacePersonIdentity(spacePersonId)` is idempotent and assigns `shared_space_person.identityId`.
- `linkFace({ assetFaceId, identityId, source, confidence })` is idempotent for the same identity.
- `replaceFaceIdentity({ assetFaceId, identityId, source, confidence })` moves a face from an old identity to a new identity.
- `unlinkFaces(assetFaceIds)` removes identity links for deleted, hidden, or unassigned faces.
- `mergeIdentities({ targetIdentityId, sourceIdentityIds, source })` moves `face_identity_face`, repoints non-conflicting `person.identityId` and `shared_space_person.identityId` rows, and reports scoped profile conflicts instead of violating duplicate `(ownerId, identityId)` or `(spaceId, identityId)` constraints.

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
pnpm --dir server test:medium -- face-identity.repository
```

Expected: FAIL on missing methods.

- [ ] **Step 2: Implement repository methods**

Implement these method shapes or their local-style equivalent:

```ts
ensurePersonIdentity(personId: string): Promise<{ id: string }>;
ensureSpacePersonIdentity(spacePersonId: string): Promise<{ id: string }>;
linkFace(input: { assetFaceId: string; identityId: string; source: string; confidence?: number | null }): Promise<void>;
replaceFaceIdentity(input: { assetFaceId: string; identityId: string; source: string; confidence?: number | null }): Promise<void>;
unlinkFaces(assetFaceIds: string[]): Promise<void>;
mergeIdentities(input: { targetIdentityId: string; sourceIdentityIds: string[]; source: string }): Promise<void>;
```

Implementation requirements:

- Wrap identity creation plus profile update in a transaction.
- Use `on conflict do nothing` for idempotent face linking.
- Use an update or upsert path for replacement so the old identity link cannot remain attached to the same `assetFaceId`.
- Reject or no-op empty arrays consistently with existing repository style.
- Deduplicate `sourceIdentityIds` before merge.
- During merge, resolve profile collisions deterministically:
  - callers that merge duplicate scoped profiles must consolidate those profile rows before merging identities;
  - if the same owner already has a target personal profile and a source personal profile still points at a source identity, return a conflict so the service can use the existing personal merge flow first;
  - if the same space already has a target Space Person and a source Space Person still points at a source identity, return a conflict so shared-space dedupe can move faces and merge rows before retrying;
  - never merge across incompatible person types.

- [ ] **Step 3: Wire dependency injection and tests**

Add `FaceIdentityRepository` to base service dependencies and test factories.

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
pnpm --dir server test:medium -- face-identity.repository
pnpm --dir server test -- person.service
```

Expected: repository tests pass; service tests compile with the new dependency mocked.

---

### Task 4: Add Chunked Identity Backfill

**Files:**

- Modify `server/src/repositories/face-identity.repository.ts`
- Modify `server/src/services/person.service.ts`
- Modify `server/src/services/person.service.spec.ts`
- Modify `server/src/types.ts`
- Modify queue enum or job registration files if the local queue pattern requires it

- [ ] **Step 1: Write failing backfill tests**

Add repository medium tests:

- A person with visible faces gets one identity and all visible faces are linked to it.
- A person with no visible faces still gets `person.identityId` so later recognition can link into it.
- Hidden, deleted, or inactive faces are not linked.
- A second backfill run is idempotent and does not change identity ids.
- Backfill pages by stable person id or created order and returns a cursor for the next chunk.
- Existing `shared_space_person` rows infer `identityId` from their linked `shared_space_person_face.assetFaceId -> face_identity_face.identityId` values.
- Existing `shared_space_person` rows with conflicting linked identities are left unchanged and reported for phase 2 dedupe instead of silently choosing one.

Add service unit tests:

- `JobName.FaceIdentityBackfill` calls the repository with configured chunk size.
- The handler requeues itself when the repository returns a next cursor.
- The handler does not enqueue metadata inheritance or shared-space matching.

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
pnpm --dir server test:medium -- face-identity.repository
pnpm --dir server test -- person.service
```

Expected: FAIL.

- [ ] **Step 2: Implement chunked backfill**

Add a repository method:

```ts
backfillPersonalIdentities(input: { cursor?: string; limit: number }): Promise<{ processed: number; nextCursor?: string }>;
backfillSpacePersonIdentities(input: {
  cursor?: string;
  limit: number;
}): Promise<{ processed: number; nextCursor?: string; conflictCount: number }>;
```

Backfill algorithm:

1. Page `person` rows by stable id or created order.
2. Ensure `person.identityId`.
3. Link visible active `asset_face` rows for that `person.id`.
4. Skip asset faces whose asset is deleted, trashed beyond the active visibility rules, or otherwise excluded by existing face-recognition queries.
5. Return `nextCursor` only when another page exists.

Space-person identity backfill algorithm:

1. Page existing `shared_space_person` rows by stable id or created order.
2. Load visible linked faces through `shared_space_person_face`.
3. Join those faces to `face_identity_face`.
4. If all linked faces resolve to one identity, set `shared_space_person.identityId` to that identity.
5. If linked faces resolve to more than one identity, leave `shared_space_person.identityId` null and increment `conflictCount`.
6. Do not copy names, birth dates, aliases, hidden state, favorite state, or thumbnails.

Service requirements:

- Add a distinct job name or use the existing recognition-maintenance queue if that is the local convention.
- Keep the job restartable and idempotent.
- Log counts internally without logging raw identity ids.

- [ ] **Step 3: Verify generated SQL and indexes**

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
pnpm --dir server run migrations:generate
pnpm --dir server test:medium -- face-identity.repository
```

Review generated SQL for:

- no full-table scan on `face_identity_face` by `identityId`;
- no full-table scan on `asset_face.personId` during each page;
- no public output containing `face_identity.id`.

---

### Task 5: Link Native Recognition To Identities

**Files:**

- Modify `server/src/services/person.service.ts`
- Modify `server/src/services/person.service.spec.ts`
- Modify `server/src/repositories/face-identity.repository.ts`
  - Reuse the phase 1 identity replacement helper from the recognition path.

- [ ] **Step 1: Write failing service tests**

Add tests around the native recognition path:

- When recognition creates or updates a personal `person`, `ensurePersonIdentity(person.id)` is called before linking faces.
- Each visible `asset_face` linked to the recognized person calls `replaceFaceIdentity` with source `native-recognition`.
- Shared-space face matching is queued only after the source identity exists.
- Recognition does not create `shared_space_person` metadata or copy names in this phase.

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
pnpm --dir server test -- person.service
```

Expected: FAIL.

- [ ] **Step 2: Implement the recognition path**

Update the code path that persists native recognition results:

1. Ensure the personal person identity.
2. Replace identity links for the affected asset faces.
3. Queue shared-space matching with enough information for phase 2 to match by identity.

If recognition may run before person assignment is final, link only after final `asset_face.personId` is persisted.

- [ ] **Step 3: Verify**

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
pnpm --dir server test -- person.service
pnpm --dir server test:medium -- face-identity.repository
```

Expected: PASS.

---

### Task 6: Maintain Identity Links Across Face Lifecycle Operations

**Files:**

- Modify `server/src/services/person.service.ts`
- Modify `server/src/services/person.service.spec.ts`
- Modify `server/src/repositories/person.repository.ts`
- Modify `server/src/repositories/face-identity.repository.ts`
- Modify `server/test/medium/specs/repositories/face-identity.repository.spec.ts`

- [ ] **Step 1: Write failing lifecycle tests**

Add unit and medium tests for:

- `reassignFaces` moves every reassigned `asset_face` from the old identity to the new person's identity.
- `unassignFaces` or equivalent detach behavior removes `face_identity_face` rows for those faces.
- Personal person merge moves source identity faces to the target identity, updates profile identity links where safe, and leaves no source face attached to the old identity.
- Face deletion cascades or explicitly unlinks identity links.
- Recognition reset removes identity links for reset faces and can be repaired by a later backfill run.
- Invisible or hidden faces are not returned by backfill and do not stay linked after lifecycle operations that hide them.

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
pnpm --dir server test -- person.service
pnpm --dir server test:medium -- face-identity.repository
```

Expected: FAIL.

- [ ] **Step 2: Call repository lifecycle methods from service code**

Update personal face operations:

- After assigning a face to a different person, call `ensurePersonIdentity(targetPersonId)` and `replaceFaceIdentity`.
- After unassigning or deleting faces, call `unlinkFaces`.
- After merging personal people, call `mergeIdentities` and then rely on the existing personal merge behavior to remove or retain source profiles.
- After recognition reset, unlink affected faces and leave profiles with `identityId` intact unless existing reset behavior deletes those profiles.

Do not update shared-space metadata or public people results in this phase.

- [ ] **Step 3: Guard against stale links in the repository**

Add repository checks where needed:

- `replaceFaceIdentity` must remove the old identity association for an `assetFaceId`.
- `mergeIdentities` must leave no `face_identity_face` rows for source identities.
- `unlinkFaces` must be safe to call for ids that are already unlinked.

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
pnpm --dir server test -- person.service
pnpm --dir server test:medium -- face-identity.repository
```

Expected: PASS.

---

### Task 7: Phase Verification

**Files:**

- All files touched in this phase

- [ ] **Step 1: Run focused verification**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
pnpm --dir server test -- person.service
pnpm --dir server test:medium -- face-identity.repository
pnpm --dir server run migrations:generate
pnpm --dir docs exec prettier --check ../docs/docs/developer/ubiquitous-language.md
git diff --check
```

- [ ] **Step 2: Run leak scan**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
rg -n "identityId|face_identity|faceIdentity" web/src server/src/dtos server/src/controllers server/src/schema/generated
```

Expected:

- Internal server repository, schema, migration, and tests may contain identity terms.
- Public DTOs, generated web SDK types, web routes, and controller response payloads must not expose raw `face_identity.id`.

- [ ] **Step 3: Commit phase 1 implementation**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
git status --short
git add docs/docs/developer/ubiquitous-language.md server/src server/test
git commit -m "feat: add face identity schema and lifecycle links"
```

Phase 1 is complete when the additive schema, personal and shared-space identity backfill, native recognition links, and lifecycle maintenance tests are green without any public identity surface.
