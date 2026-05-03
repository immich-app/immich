# Global Face Identities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add internal Face Identities so personal people and space people can dedupe across accessible spaces while preserving strict RBAC and scoped metadata boundaries.

**Architecture:** Keep `person` and `shared_space_person` as scoped profiles, and add an internal `face_identity` graph beneath them. Background jobs assign identities and link faces; request-time resolvers apply the viewer's accessible asset scope before grouping by identity, then expose only scoped profile ids, scoped filter tokens, names, thumbnails, and counts the viewer can access.

**Tech Stack:** NestJS, Kysely, `@immich/sql-tools` schema tables and migrations, BullMQ job handlers, Vitest small and medium tests, Svelte 5, generated OpenAPI SDK.

---

## Safety Notes

- Implement in TDD order. Every task starts with failing tests, verifies the expected failure, then adds the smallest code to pass.
- Commit after each task. The schema, matching, `/people`, filter panel, global search, and manual repair changes should be reviewable independently.
- Never expose `face_identity.id` in public DTOs, generated SDK models, URLs, logs visible to clients, or web route state.
- Metadata inheritance copies allowed fields into `shared_space_person`; it never reads another user's private `person` row at request time.
- Existing-space name and birth-date inheritance must not run in the schema migration. The setting lands first; inheritance happens only through matching/backfill jobs after the setting exists.
- No request-time vector matching. Embedding comparisons remain in recognition, space matching, or repair jobs.
- Permission tests must assert both presence and absence. A passing positive case is not enough for this feature.

## Execution Split

This file remains the umbrella roadmap. Execute the feature through smaller phase plans so schema risk, shared-space behavior, public API changes, web changes, and repair tooling can be reviewed independently. The split phase plans are authoritative for implementation-level tests and edge cases.

1. `2026-05-01-global-face-identities-01-schema-backfill-lifecycle.md`
   - Owns Ubiquitous Language updates, additive schema, migration, repository wiring, identity backfill, native recognition identity links, and identity lifecycle maintenance for face reassignment, personal person merge, face deletion, face unassignment, and recognition resets.
   - Exits with no public DTO or user-visible behavior change except internal identity persistence.
2. `2026-05-01-global-face-identities-02-space-matching-metadata.md`
   - Owns shared-space member metadata contribution settings, identity-first space-person matching, metadata inheritance into `shared_space_person`, conflict handling, source locks, and cross-owner identity merging when shared-space evidence proves sameness.
   - Exits when shared-space matching can fill Space Person name and birth date from source metadata without leaking private `person` rows or inheriting hidden, favorite, alias, or inaccessible thumbnail state.
3. `2026-05-01-global-face-identities-03-people-rbac-projection.md`
   - Owns the identity-grouped `/people` mode, accessible profile selection, counts, thumbnails, route targets, and the full permission matrix for personal plus timeline-enabled shared-space people.
4. `2026-05-01-global-face-identities-04-filter-panel-global-search.md`
   - Owns scoped person tokens in filter suggestions, timeline filters, single-space filters, global search people rows, global search previews, and token parsing compatibility.
5. `2026-05-01-global-face-identities-05-repair-performance-release.md`
   - Owns same-person merge/detach endpoints, owner/editor repair flows, generated SQL review, query plans, indexes, search-performance regression tests, and release checks.

Do not execute a later umbrella section directly until its split phase plan exists. When a concern spans phases, write the failing test in the phase where the first behavior becomes observable, then keep the end-to-end assertion in the later public API or web phase.

## Scoped Token Contract

Use scoped profile tokens for filters and global search instead of raw identity ids:

```ts
export type ScopedPersonToken = `person:${string}` | `space-person:${string}`;
```

- `person:<personId>` resolves only through the viewer's own `person` row; shared-space access must use a `space-person:<sharedSpacePersonId>` token.
- `space-person:<sharedSpacePersonId>` resolves through `shared_space_person`, membership in that space, and the current timeline/global request scope.
- Legacy bare UUIDs remain accepted on existing endpoints. In a single-space route they mean `spacePersonIds`; in a personal route they mean `personIds`.
- Identity-grouped suggestions should return `id: ScopedPersonToken` and `primaryProfile` metadata. The server resolves the token back to identity inside the current viewer scope before filtering assets.

## File Map

- Modify `docs/docs/developer/ubiquitous-language.md`
  - Add Face Identity, Identity-linked face, Scoped person profile, Metadata inheritance, Metadata contribution, Identity-grouped person, Scoped primary profile, and Scoped identity filter token.
- Create `server/src/schema/tables/face-identity.table.ts`
  - Defines the internal identity row and update trigger.
- Create `server/src/schema/tables/face-identity-face.table.ts`
  - Links one visible `asset_face` row to one identity.
- Modify `server/src/schema/tables/person.table.ts`
  - Add nullable `identityId`.
- Modify `server/src/schema/tables/shared-space-person.table.ts`
  - Add nullable `identityId` and field-source columns for inherited/manual `name` and `birthDate`.
- Modify `server/src/schema/tables/shared-space-member.table.ts`
  - Add `sharePersonMetadata boolean default true`.
- Modify `server/src/schema/index.ts`
  - Register identity tables and DB interface entries.
- Modify `server/src/database.ts`
  - Add identity fields to `Person`, `SharedSpacePerson`, and `SharedSpaceMember` types.
- Create `server/src/schema/migrations-gallery/1778400000000-AddFaceIdentities.ts`
  - Add tables, columns, constraints, indexes, and triggers. Do not copy existing names or birth dates.
- Create `server/src/repositories/face-identity.repository.ts`
  - Owns identity creation, face linking, chunked backfill, scoped token parsing, scoped profile resolution, merge, and detach persistence.
- Modify `server/src/services/base.service.ts`
  - Add `FaceIdentityRepository` to `BASE_SERVICE_DEPENDENCIES` and constructor dependencies.
- Modify `server/test/utils.ts` and `server/test/medium.factory.ts`
  - Add mocks and medium-test dependency wiring for `FaceIdentityRepository`.
- Modify `server/test/small.factory.ts` and `server/test/medium.factory.ts`
  - Add identity, identity-face, shared-space-person, and shared-space-person-face helpers.
- Create `server/test/medium/specs/repositories/face-identity.repository.spec.ts`
  - Tests constraints, backfill, token resolution, scoped grouping, merge, detach, and query-shape guardrails.
- Modify `server/src/services/person.service.ts`
  - Ensure native recognition creates/links identities before queuing shared-space matching.
  - Add identity backfill job handler.
  - Route `/people` through the identity-grouped resolver when `withSharedSpaces` is requested.
- Modify `server/src/services/person.service.spec.ts`
  - Unit tests for recognition identity linking, backfill job orchestration, and `/people` mode selection.
- Modify `server/src/repositories/person.repository.ts`
  - Add identity-aware personal profile lookup and paged accessible identity group hydration when the resolver reuses existing person mapping logic.
- Modify `server/src/services/shared-space.service.ts`
  - Match space people by `(spaceId, identityId)` and apply metadata inheritance.
  - Mark manual `name` and `birthDate` edits as manual source locks.
- Modify `server/src/repositories/shared-space.repository.ts`
  - Add identity-based space-person lookup/create helpers and metadata inheritance queries.
- Modify `server/src/services/shared-space.service.spec.ts`
  - Unit tests for identity-first matching, inheritance, opt-out, source locks, and no thumbnail leakage.
- Modify `server/test/medium/specs/repositories/shared-space-face-matching.spec.ts`
  - Medium tests proving matching waits for source identities and links only accessible space faces.
- Modify `server/test/medium/specs/services/people-identity-rbac.spec.ts`
  - Permission matrix tests for `/people`, filters, thumbnails, search, metadata, and counts.
- Modify `server/src/dtos/person.dto.ts`
  - Add `withSharedSpaces`, `primaryProfile`, and accessible count fields for identity-grouped people.
- Modify `server/src/controllers/person.controller.ts`
  - Add manual repair endpoints after the resolver is stable.
- Modify `server/src/dtos/search.dto.ts`
  - Accept scoped person tokens for identity-grouped filter and search contexts, keep legacy UUID compatibility.
- Modify `server/src/services/search.service.ts`
  - Resolve scoped person tokens against current auth before passing identity filters to the repository.
- Modify `server/src/repositories/search.repository.ts`
  - Group people suggestions by accessible identity and apply identity token filters without raw identity IDs in DTOs.
- Modify `server/src/controllers/search.controller.spec.ts`, `server/src/services/search.service.spec.ts`, and `server/src/repositories/search.repository.spec.ts`
  - Cover filter/global search token validation and DTO shape.
- Modify `web/src/lib/components/filter-panel/filter-panel.ts`
  - Treat `PersonOption.id` as a scoped person token.
- Modify `web/src/lib/utils/photos-filter-options.ts`, `web/src/lib/utils/map-filter-options.ts`, `web/src/lib/utils/album-filter-config.ts`, and route-specific filter config code
  - Pass scoped person tokens through global/timeline filters and keep single-space routes on `spacePersonIds`.
- Modify `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`
  - Use identity-grouped filter suggestions from timeline-enabled spaces.
- Modify `web/src/routes/(user)/people/+page.ts` and `web/src/routes/(user)/people/+page.svelte`
  - Load identity-grouped people and navigate via `primaryProfile`.
- Modify `web/src/lib/managers/global-search-manager.svelte.ts`
  - Search identity-grouped people, navigate via `primaryProfile`, and preview assets through the correct scoped filter.
- Modify `web/src/lib/components/global-search/rows/person-row.svelte` and `web/src/lib/components/global-search/previews/person-preview.svelte`
  - Render identity-grouped people without assuming `/people/:id` thumbnails.
- Add or modify web tests under `web/src/lib/components/filter-panel/__tests__/`, `web/src/lib/utils/__tests__/`, `web/src/routes/(user)/people/`, and `web/src/lib/components/global-search/__tests__/`.

---

### Task 1: Ubiquitous Language Update

**Files:**

- Modify: `docs/docs/developer/ubiquitous-language.md`
- Verify: `docs/docs/developer/ubiquitous-language.md`

- [ ] **Step 1: Run the failing term check**

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
rg -n "Face Identity|Identity-linked face|Scoped person profile|Metadata inheritance|Metadata contribution|Identity-grouped person|Scoped primary profile|Scoped identity filter token" docs/docs/developer/ubiquitous-language.md
```

Expected: FAIL or only partial matches. The document currently does not contain the full identity vocabulary.

- [ ] **Step 2: Update the language doc**

Edit `docs/docs/developer/ubiquitous-language.md`:

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

Also update the People and recognition, Search and filtering, Relationships, Recommended conversation patterns, Implementation anchors, and Flagged ambiguities sections so they distinguish Personal People, Space People, Face Identities, and identity-grouped people.

- [ ] **Step 3: Format and verify the docs**

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
pnpm --dir docs exec prettier --check ../docs/docs/developer/ubiquitous-language.md
rg -n "Face Identity|Scoped identity filter token|Identity-grouped person" docs/docs/developer/ubiquitous-language.md
```

Expected: PASS, with all new terms present.

- [ ] **Step 4: Commit**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
git add docs/docs/developer/ubiquitous-language.md
git commit -m "docs: define face identity language"
```

---

### Task 2: Identity Schema And Test Wiring

**Files:**

- Create: `server/src/schema/tables/face-identity.table.ts`
- Create: `server/src/schema/tables/face-identity-face.table.ts`
- Create: `server/src/schema/migrations-gallery/1778400000000-AddFaceIdentities.ts`
- Modify: `server/src/schema/tables/person.table.ts`
- Modify: `server/src/schema/tables/shared-space-person.table.ts`
- Modify: `server/src/schema/tables/shared-space-member.table.ts`
- Modify: `server/src/schema/index.ts`
- Modify: `server/src/database.ts`
- Create: `server/src/repositories/face-identity.repository.ts`
- Modify: `server/src/services/base.service.ts`
- Modify: `server/test/utils.ts`
- Modify: `server/test/medium.factory.ts`
- Modify: `server/test/small.factory.ts`
- Test: `server/test/medium/specs/repositories/face-identity.repository.spec.ts`

- [ ] **Step 1: Write the failing schema and repository tests**

Create `server/test/medium/specs/repositories/face-identity.repository.spec.ts`:

```ts
import { Kysely } from 'kysely';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { FaceIdentityRepository } from 'src/repositories/face-identity.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [FaceIdentityRepository],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(FaceIdentityRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(FaceIdentityRepository.name, () => {
  it('creates one identity for a person and links only visible active faces', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { asset: visibleAsset } = await ctx.newAsset({ ownerId: user.id });
    const { asset: deletedAsset } = await ctx.newAsset({ ownerId: user.id });
    const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', type: 'person' });
    const { result: visibleFace } = await ctx.newAssetFace({ assetId: visibleAsset.id, personId: person.id });
    await ctx.newAssetFace({ assetId: deletedAsset.id, personId: person.id, deletedAt: new Date() });
    await ctx.newAssetFace({ assetId: visibleAsset.id, personId: person.id, isVisible: false });

    const identityId = await sut.ensurePersonIdentity(person.id);
    const secondIdentityId = await sut.ensurePersonIdentity(person.id);

    const updatedPerson = await ctx.database
      .selectFrom('person')
      .select(['id', 'identityId'])
      .where('id', '=', person.id)
      .executeTakeFirstOrThrow();
    const links = await ctx.database
      .selectFrom('face_identity_face')
      .selectAll()
      .where('identityId', '=', identityId)
      .execute();

    expect(secondIdentityId).toBe(identityId);
    expect(updatedPerson.identityId).toBe(identityId);
    expect(links).toEqual([
      expect.objectContaining({
        identityId,
        assetFaceId: visibleFace.id,
        source: 'owner-person',
      }),
    ]);
  });

  it('enforces one current identity per asset face', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { person: first } = await ctx.newPerson({ ownerId: user.id });
    const { person: second } = await ctx.newPerson({ ownerId: user.id });
    const { result: face } = await ctx.newAssetFace({ assetId: asset.id, personId: first.id });

    const firstIdentityId = await sut.ensurePersonIdentity(first.id);
    const secondIdentityId = await sut.ensurePersonIdentity(second.id);

    await expect(sut.linkFace(secondIdentityId, face.id, 'manual')).rejects.toThrow();
    await expect(sut.linkFace(firstIdentityId, face.id, 'owner-person')).resolves.toBeDefined();
  });

  it('adds sharePersonMetadata=true for new shared-space members', async () => {
    const { ctx } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });

    const { result } = await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id });

    expect(result.sharePersonMetadata).toBe(true);
  });
});
```

- [ ] **Step 2: Run the failing schema test**

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test:medium -- test/medium/specs/repositories/face-identity.repository.spec.ts
```

Expected: FAIL with `Cannot find module 'src/repositories/face-identity.repository'`.

- [ ] **Step 3: Add schema table classes**

Create `server/src/schema/tables/face-identity.table.ts`:

```ts
import {
  Check,
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';

@Table('face_identity')
@UpdatedAtTrigger('face_identity_updatedAt')
@Check({ name: 'face_identity_type_chk', expression: `"type" IN ('person', 'pet')` })
export class FaceIdentityTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column({ type: 'character varying', default: 'person' })
  type!: Generated<string>;

  @ForeignKeyColumn(() => AssetFaceTable, { onDelete: 'SET NULL', nullable: true })
  representativeFaceId!: string | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
```

Create `server/src/schema/tables/face-identity-face.table.ts`:

```ts
import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Index,
  Table,
  Timestamp,
  Unique,
} from '@immich/sql-tools';
import { FaceIdentityTable } from 'src/schema/tables/face-identity.table';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';

@Table('face_identity_face')
@Unique({ columns: ['assetFaceId'] })
@Index({ name: 'face_identity_face_identityId_assetFaceId_idx', columns: ['identityId', 'assetFaceId'] })
export class FaceIdentityFaceTable {
  @ForeignKeyColumn(() => FaceIdentityTable, { onDelete: 'CASCADE', primary: true, index: false })
  identityId!: string;

  @ForeignKeyColumn(() => AssetFaceTable, { onDelete: 'CASCADE', primary: true })
  assetFaceId!: string;

  @Column({ type: 'character varying', default: 'owner-person' })
  source!: Generated<string>;

  @Column({ type: 'double precision', nullable: true })
  confidence!: number | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
```

- [ ] **Step 4: Add profile and member columns**

Update `person.table.ts` with:

```ts
  @ForeignKeyColumn(() => FaceIdentityTable, { onDelete: 'SET NULL', nullable: true })
  identityId!: string | null;
```

Update `shared-space-person.table.ts` with:

```ts
  @ForeignKeyColumn(() => FaceIdentityTable, { onDelete: 'SET NULL', nullable: true })
  identityId!: string | null;

  @Column({ type: 'character varying', default: 'none' })
  nameSource!: Generated<string>;

  @Column({ type: 'character varying', nullable: true })
  nameSourceProfileType!: string | null;

  @Column({ type: 'uuid', nullable: true })
  nameSourceProfileId!: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  nameSourceUpdatedAt!: Timestamp | null;

  @Column({ type: 'character varying', default: 'none' })
  birthDateSource!: Generated<string>;

  @Column({ type: 'character varying', nullable: true })
  birthDateSourceProfileType!: string | null;

  @Column({ type: 'uuid', nullable: true })
  birthDateSourceProfileId!: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  birthDateSourceUpdatedAt!: Timestamp | null;
```

Update `shared-space-member.table.ts` with:

```ts
  @Column({ type: 'boolean', default: true })
  sharePersonMetadata!: Generated<boolean>;
```

- [ ] **Step 5: Register DB types, migration, repository wiring, and test factories**

Add imports and table entries in `server/src/schema/index.ts`, type fields in `server/src/database.ts`, and test wiring for `FaceIdentityRepository` in `server/src/services/base.service.ts`, `server/test/utils.ts`, and `server/test/medium.factory.ts`.

Create `server/src/schema/migrations-gallery/1778400000000-AddFaceIdentities.ts` with these required operations:

```ts
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`CREATE TABLE "face_identity" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "type" character varying NOT NULL DEFAULT 'person',
    "representativeFaceId" uuid REFERENCES "asset_face" ("id") ON DELETE SET NULL,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now(),
    "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
    CONSTRAINT "face_identity_type_chk" CHECK ("type" IN ('person', 'pet'))
  )`.execute(db);

  await sql`CREATE TRIGGER "face_identity_updatedAt" BEFORE UPDATE ON "face_identity" FOR EACH ROW EXECUTE FUNCTION updated_at()`.execute(
    db,
  );
  await sql`CREATE INDEX "face_identity_updateId_idx" ON "face_identity" ("updateId")`.execute(db);

  await sql`CREATE TABLE "face_identity_face" (
    "identityId" uuid NOT NULL REFERENCES "face_identity" ("id") ON DELETE CASCADE,
    "assetFaceId" uuid NOT NULL REFERENCES "asset_face" ("id") ON DELETE CASCADE,
    "source" character varying NOT NULL DEFAULT 'owner-person',
    "confidence" double precision,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "face_identity_face_pkey" PRIMARY KEY ("identityId", "assetFaceId"),
    CONSTRAINT "face_identity_face_assetFaceId_key" UNIQUE ("assetFaceId")
  )`.execute(db);

  await sql`CREATE INDEX "face_identity_face_identityId_assetFaceId_idx" ON "face_identity_face" ("identityId", "assetFaceId")`.execute(
    db,
  );
  await sql`ALTER TABLE "person" ADD "identityId" uuid REFERENCES "face_identity" ("id") ON DELETE SET NULL`.execute(
    db,
  );
  await sql`CREATE INDEX "person_identityId_idx" ON "person" ("identityId")`.execute(db);

  await sql`ALTER TABLE "shared_space_person" ADD "identityId" uuid REFERENCES "face_identity" ("id") ON DELETE SET NULL`.execute(
    db,
  );
  await sql`ALTER TABLE "shared_space_person" ADD "nameSource" character varying NOT NULL DEFAULT 'none'`.execute(db);
  await sql`ALTER TABLE "shared_space_person" ADD "nameSourceProfileType" character varying`.execute(db);
  await sql`ALTER TABLE "shared_space_person" ADD "nameSourceProfileId" uuid`.execute(db);
  await sql`ALTER TABLE "shared_space_person" ADD "nameSourceUpdatedAt" timestamptz`.execute(db);
  await sql`ALTER TABLE "shared_space_person" ADD "birthDateSource" character varying NOT NULL DEFAULT 'none'`.execute(
    db,
  );
  await sql`ALTER TABLE "shared_space_person" ADD "birthDateSourceProfileType" character varying`.execute(db);
  await sql`ALTER TABLE "shared_space_person" ADD "birthDateSourceProfileId" uuid`.execute(db);
  await sql`ALTER TABLE "shared_space_person" ADD "birthDateSourceUpdatedAt" timestamptz`.execute(db);
  await sql`CREATE UNIQUE INDEX "shared_space_person_spaceId_identityId_key" ON "shared_space_person" ("spaceId", "identityId") WHERE "identityId" IS NOT NULL`.execute(
    db,
  );
  await sql`CREATE INDEX "shared_space_person_identityId_spaceId_idx" ON "shared_space_person" ("identityId", "spaceId")`.execute(
    db,
  );

  await sql`ALTER TABLE "shared_space_member" ADD "sharePersonMetadata" boolean NOT NULL DEFAULT true`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE "shared_space_member" DROP COLUMN "sharePersonMetadata"`.execute(db);
  await sql`DROP INDEX IF EXISTS "shared_space_person_identityId_spaceId_idx"`.execute(db);
  await sql`DROP INDEX IF EXISTS "shared_space_person_spaceId_identityId_key"`.execute(db);
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN "birthDateSourceUpdatedAt"`.execute(db);
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN "birthDateSourceProfileId"`.execute(db);
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN "birthDateSourceProfileType"`.execute(db);
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN "birthDateSource"`.execute(db);
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN "nameSourceUpdatedAt"`.execute(db);
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN "nameSourceProfileId"`.execute(db);
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN "nameSourceProfileType"`.execute(db);
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN "nameSource"`.execute(db);
  await sql`ALTER TABLE "shared_space_person" DROP COLUMN "identityId"`.execute(db);
  await sql`DROP INDEX IF EXISTS "person_identityId_idx"`.execute(db);
  await sql`ALTER TABLE "person" DROP COLUMN "identityId"`.execute(db);
  await sql`DROP TABLE IF EXISTS "face_identity_face"`.execute(db);
  await sql`DROP TRIGGER IF EXISTS "face_identity_updatedAt" ON "face_identity"`.execute(db);
  await sql`DROP TABLE IF EXISTS "face_identity"`.execute(db);
}
```

- [ ] **Step 6: Implement minimal identity repository methods**

Create `server/src/repositories/face-identity.repository.ts` with these exported types and method signatures:

```ts
export type FaceIdentityFaceSource = 'owner-person' | 'space-person' | 'ml' | 'manual' | 'import';
export type ScopedPersonToken = `person:${string}` | `space-person:${string}`;

export class FaceIdentityRepository {
  ensurePersonIdentity(personId: string): Promise<string>;
  linkFace(identityId: string, assetFaceId: string, source: FaceIdentityFaceSource, confidence?: number): Promise<void>;
  parseScopedPersonToken(token: string): { type: 'person' | 'space-person'; id: string } | null;
}
```

The first implementation should:

- use a transaction in `ensurePersonIdentity`;
- lock the `person` row with `for update`;
- return existing `person.identityId` when present;
- create one `face_identity` with `type` and `representativeFaceId` from the person;
- set `person.identityId`;
- link visible, non-deleted faces for that person with source `owner-person`;
- use `on conflict ("assetFaceId") do nothing` when linking the same face to the same identity.

- [ ] **Step 7: Run tests and schema checks**

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test:medium -- test/medium/specs/repositories/face-identity.repository.spec.ts
pnpm check
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
git add server/src/schema server/src/database.ts server/src/repositories/face-identity.repository.ts server/src/services/base.service.ts server/test
git commit -m "feat: add face identity schema"
```

---

### Task 3: Chunked Identity Backfill Job

**Files:**

- Modify: `server/src/enum.ts`
- Modify: `server/src/types.ts`
- Modify: `server/src/repositories/face-identity.repository.ts`
- Modify: `server/src/services/person.service.ts`
- Test: `server/src/services/person.service.spec.ts`
- Test: `server/test/medium/specs/repositories/face-identity.repository.spec.ts`

- [ ] **Step 1: Add failing repository backfill tests**

Append these tests to `server/test/medium/specs/repositories/face-identity.repository.spec.ts`:

```ts
it('backfills people and infers a space person identity when all linked faces share one identity', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id });
  const { asset } = await ctx.newAsset({ ownerId: user.id });
  const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice' });
  const { result: face } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  const spacePerson = await ctx.newSharedSpacePerson({ spaceId: space.id, representativeFaceId: face.id });
  await ctx.newSharedSpacePersonFace({ personId: spacePerson.id, assetFaceId: face.id });

  const result = await sut.backfillPage({ limit: 100 });

  const updatedSpacePerson = await ctx.database
    .selectFrom('shared_space_person')
    .select(['id', 'identityId'])
    .where('id', '=', spacePerson.id)
    .executeTakeFirstOrThrow();

  expect(result.peopleProcessed).toBe(1);
  expect(result.facesLinked).toBe(1);
  expect(result.spacePeopleLinked).toBe(1);
  expect(updatedSpacePerson.identityId).toEqual(expect.any(String));
});

it('does not infer a space person identity when linked faces disagree', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id });
  const { asset: firstAsset } = await ctx.newAsset({ ownerId: user.id });
  const { asset: secondAsset } = await ctx.newAsset({ ownerId: user.id });
  const { person: firstPerson } = await ctx.newPerson({ ownerId: user.id });
  const { person: secondPerson } = await ctx.newPerson({ ownerId: user.id });
  const { result: firstFace } = await ctx.newAssetFace({ assetId: firstAsset.id, personId: firstPerson.id });
  const { result: secondFace } = await ctx.newAssetFace({ assetId: secondAsset.id, personId: secondPerson.id });
  const spacePerson = await ctx.newSharedSpacePerson({ spaceId: space.id, representativeFaceId: firstFace.id });
  await ctx.newSharedSpacePersonFace({ personId: spacePerson.id, assetFaceId: firstFace.id });
  await ctx.newSharedSpacePersonFace({ personId: spacePerson.id, assetFaceId: secondFace.id });

  await sut.backfillPage({ limit: 100 });

  const updatedSpacePerson = await ctx.database
    .selectFrom('shared_space_person')
    .select(['identityId'])
    .where('id', '=', spacePerson.id)
    .executeTakeFirstOrThrow();

  expect(updatedSpacePerson.identityId).toBeNull();
});
```

- [ ] **Step 2: Run and verify failure**

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test:medium -- test/medium/specs/repositories/face-identity.repository.spec.ts
```

Expected: FAIL because `backfillPage`, `newSharedSpacePerson`, or `newSharedSpacePersonFace` is missing.

- [ ] **Step 3: Add backfill repository methods and medium helpers**

Add `newSharedSpacePerson` and `newSharedSpacePersonFace` helpers to `server/test/medium.factory.ts`.

Add these methods to `FaceIdentityRepository`:

```ts
type FaceIdentityBackfillPageOptions = {
  limit: number;
  afterPersonId?: string;
};

type FaceIdentityBackfillPageResult = {
  nextPersonId: string | null;
  peopleProcessed: number;
  facesLinked: number;
  spacePeopleLinked: number;
};

backfillPage(options: FaceIdentityBackfillPageOptions): Promise<FaceIdentityBackfillPageResult>;
inferSpacePersonIdentitiesForFaces(assetFaceIds: string[]): Promise<number>;
```

Implementation requirements:

- process `person` rows in deterministic `id asc` pages;
- call `ensurePersonIdentity` for each page row;
- link visible faces for each person;
- infer `shared_space_person.identityId` only when all linked visible faces have exactly one identity;
- leave mixed-identity space people unchanged for manual repair;
- never modify `shared_space_person.name`, `birthDate`, hidden, aliases, or thumbnails in this backfill.

- [ ] **Step 4: Add the migration job type**

Add to `server/src/enum.ts`:

```ts
FaceIdentityBackfill = 'FaceIdentityBackfill',
```

Add to the Migration union in `server/src/types.ts`:

```ts
export interface IFaceIdentityBackfillJob {
  afterPersonId?: string;
  limit?: number;
}
```

```ts
| { name: JobName.FaceIdentityBackfill; data: IFaceIdentityBackfillJob }
```

- [ ] **Step 5: Add failing service tests for job continuation**

Append to `server/src/services/person.service.spec.ts`:

```ts
describe('handleFaceIdentityBackfill', () => {
  it('queues the next page when backfill returns a cursor', async () => {
    mocks.faceIdentity.backfillPage.mockResolvedValue({
      nextPersonId: 'person-2',
      peopleProcessed: 1000,
      facesLinked: 1200,
      spacePeopleLinked: 50,
    });

    await sut.handleFaceIdentityBackfill({ limit: 1000 });

    expect(mocks.faceIdentity.backfillPage).toHaveBeenCalledWith({ limit: 1000, afterPersonId: undefined });
    expect(mocks.job.queue).toHaveBeenCalledWith({
      name: JobName.FaceIdentityBackfill,
      data: { limit: 1000, afterPersonId: 'person-2' },
    });
  });

  it('does not queue another page when backfill is complete', async () => {
    mocks.faceIdentity.backfillPage.mockResolvedValue({
      nextPersonId: null,
      peopleProcessed: 2,
      facesLinked: 3,
      spacePeopleLinked: 1,
    });

    await sut.handleFaceIdentityBackfill({});

    expect(mocks.job.queue).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Implement the job handler**

In `server/src/services/person.service.ts`:

```ts
@OnJob({ name: JobName.FaceIdentityBackfill, queue: QueueName.Migration })
async handleFaceIdentityBackfill({
  afterPersonId,
  limit = 1000,
}: JobOf<JobName.FaceIdentityBackfill>): Promise<JobStatus> {
  const result = await this.faceIdentityRepository.backfillPage({ limit, afterPersonId });

  if (result.nextPersonId) {
    await this.jobRepository.queue({
      name: JobName.FaceIdentityBackfill,
      data: { limit, afterPersonId: result.nextPersonId },
    });
  }

  return JobStatus.Success;
}
```

- [ ] **Step 7: Run tests**

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test -- src/services/person.service.spec.ts
pnpm test:medium -- test/medium/specs/repositories/face-identity.repository.spec.ts
pnpm check
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
git add server/src/enum.ts server/src/types.ts server/src/repositories/face-identity.repository.ts server/src/services/person.service.ts server/src/services/person.service.spec.ts server/test/medium.factory.ts server/test/medium/specs/repositories/face-identity.repository.spec.ts
git commit -m "feat: backfill face identities"
```

---

### Task 4: Native Recognition Creates Identity Links

**Files:**

- Modify: `server/src/services/person.service.ts`
- Test: `server/src/services/person.service.spec.ts`

- [ ] **Step 1: Add failing recognition tests**

Add tests in `server/src/services/person.service.spec.ts` under `handleRecognizeFaces`:

```ts
it('ensures and links identity when a face already has a person before shared-space matching', async () => {
  const face = factory.assetFace({ id: 'face-1', personId: 'person-1', assetId: 'asset-1' });
  mocks.person.getFaceForFacialRecognitionJob.mockResolvedValue({
    ...face,
    asset: factory.asset({ id: 'asset-1', ownerId: 'owner-1' }),
    faceSearch: { embedding: newEmbedding() },
  });
  mocks.sharedSpace.getSpaceIdsForAsset.mockResolvedValue([{ spaceId: 'space-1' }]);
  mocks.faceIdentity.ensurePersonIdentity.mockResolvedValue('identity-1');
  mocks.faceIdentity.linkFace.mockResolvedValue(void 0);

  await sut.handleRecognizeFaces({ id: 'face-1' });

  expect(mocks.faceIdentity.ensurePersonIdentity).toHaveBeenCalledWith('person-1');
  expect(mocks.faceIdentity.linkFace).toHaveBeenCalledWith('identity-1', 'face-1', 'owner-person');
  expect(mocks.job.queue).toHaveBeenCalledWith({
    name: JobName.SharedSpaceFaceMatch,
    data: { spaceId: 'space-1', assetId: 'asset-1' },
  });
});

it('ensures and links identity after recognition assigns a person', async () => {
  const face = factory.assetFace({ id: 'face-1', personId: null, assetId: 'asset-1' });
  mocks.person.getFaceForFacialRecognitionJob.mockResolvedValue({
    ...face,
    asset: factory.asset({ id: 'asset-1', ownerId: 'owner-1' }),
    faceSearch: { embedding: newEmbedding() },
  });
  mocks.search.searchFaces.mockResolvedValue([{ id: 'face-2', personId: 'person-1', distance: 0.1 }]);
  mocks.person.reassignFaces.mockResolvedValue(1);
  mocks.sharedSpace.getSpaceIdsForAsset.mockResolvedValue([{ spaceId: 'space-1' }]);
  mocks.faceIdentity.ensurePersonIdentity.mockResolvedValue('identity-1');
  mocks.faceIdentity.linkFace.mockResolvedValue(void 0);

  await sut.handleRecognizeFaces({ id: 'face-1' });

  expect(mocks.person.reassignFaces).toHaveBeenCalledWith({ faceIds: ['face-1'], newPersonId: 'person-1' });
  expect(mocks.faceIdentity.ensurePersonIdentity).toHaveBeenCalledWith('person-1');
  expect(mocks.faceIdentity.linkFace).toHaveBeenCalledWith('identity-1', 'face-1', 'owner-person');
});
```

- [ ] **Step 2: Run and verify failure**

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test -- src/services/person.service.spec.ts -t "ensures and links identity"
```

Expected: FAIL because recognition does not call `faceIdentityRepository`.

- [ ] **Step 3: Implement identity linking in recognition**

In `PersonService.handleRecognizeFaces`, after every path that has a final `personId`, add:

```ts
const identityId = await this.faceIdentityRepository.ensurePersonIdentity(personId);
await this.faceIdentityRepository.linkFace(identityId, id, 'owner-person');
```

This must run before queuing `SharedSpaceFaceMatch`, including the early return where the face already has `personId`.

- [ ] **Step 4: Run tests**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test -- src/services/person.service.spec.ts
pnpm check
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
git add server/src/services/person.service.ts server/src/services/person.service.spec.ts
git commit -m "feat: link recognized faces to identities"
```

---

### Task 5: Shared-Space Matching Uses Identity And Inherits Metadata

**Files:**

- Modify: `server/src/repositories/shared-space.repository.ts`
- Modify: `server/src/services/shared-space.service.ts`
- Test: `server/src/services/shared-space.service.spec.ts`
- Test: `server/test/medium/specs/repositories/shared-space-face-matching.spec.ts`

- [ ] **Step 1: Add failing service tests**

Add tests to `server/src/services/shared-space.service.spec.ts` for `handleSharedSpaceFaceMatch`:

```ts
it('reuses a space person by identity instead of linked owner person id', async () => {
  mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
    { id: 'face-1', assetId: 'asset-1', personId: 'person-1', identityId: 'identity-1', embedding: newEmbedding() },
  ]);
  mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
  mocks.sharedSpace.findSpacePersonByIdentity.mockResolvedValue(factory.sharedSpacePerson({ id: 'space-person-1' }));

  await sut.handleSharedSpaceFaceMatch({ spaceId: 'space-1', assetId: 'asset-1' });

  expect(mocks.sharedSpace.findSpacePersonByIdentity).toHaveBeenCalledWith('space-1', 'identity-1');
  expect(mocks.sharedSpace.findSpacePersonByLinkedPersonId).not.toHaveBeenCalled();
  expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalledWith(
    [{ personId: 'space-person-1', assetFaceId: 'face-1' }],
    { skipRecount: true },
  );
});

it('creates an identity-backed space person and inherits allowed name and birth date', async () => {
  mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
    { id: 'face-1', assetId: 'asset-1', personId: 'person-1', identityId: 'identity-1', embedding: newEmbedding() },
  ]);
  mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
  mocks.sharedSpace.findSpacePersonByIdentity.mockResolvedValue(undefined);
  mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]);
  mocks.sharedSpace.createPerson.mockResolvedValue(factory.sharedSpacePerson({ id: 'space-person-1' }));

  await sut.handleSharedSpaceFaceMatch({ spaceId: 'space-1', assetId: 'asset-1' });

  expect(mocks.sharedSpace.createPerson).toHaveBeenCalledWith({
    spaceId: 'space-1',
    identityId: 'identity-1',
    name: '',
    representativeFaceId: 'face-1',
    type: 'person',
  });
  expect(mocks.sharedSpace.inheritPersonMetadata).toHaveBeenCalledWith({
    spaceId: 'space-1',
    sourcePersonId: 'person-1',
    targetSpacePersonId: 'space-person-1',
  });
});

it('does not inherit metadata when the source member opted out', async () => {
  mocks.sharedSpace.getMetadataInheritanceSource.mockResolvedValue({
    allowed: false,
    sourcePerson: { name: 'Private Alice', birthDate: '1990-01-01' },
    targetSpacePerson: { name: '', birthDate: null, nameSource: 'none', birthDateSource: 'none' },
  });

  await expect(
    mocks.sharedSpace.inheritPersonMetadata({
      spaceId: 'space-1',
      sourcePersonId: 'person-1',
      targetSpacePersonId: 'space-person-1',
    }),
  ).resolves.toBeUndefined();
});
```

- [ ] **Step 2: Run and verify failure**

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test -- src/services/shared-space.service.spec.ts -t "identity"
```

Expected: FAIL because identity lookup and inheritance methods do not exist.

- [ ] **Step 3: Add repository methods**

Add to `SharedSpaceRepository`:

```ts
findSpacePersonByIdentity(spaceId: string, identityId: string): Promise<Selectable<SharedSpacePersonTable> | undefined>;
inheritPersonMetadata(input: {
  spaceId: string;
  sourcePersonId: string;
  targetSpacePersonId: string;
}): Promise<void>;
```

`getAssetFacesForMatching(assetId)` must select `person.identityId as identityId` by joining `person` on `asset_face.personId`.

`inheritPersonMetadata` requirements:

- source `person.ownerId` must be a member of the target space;
- `shared_space_member.sharePersonMetadata` must be true;
- copy `person.name` when target name is empty or `nameSource = 'inherited'`;
- copy `person.birthDate` when target birth date is empty or `birthDateSource = 'inherited'`;
- set `nameSource` and `birthDateSource` independently;
- never copy `isHidden`, `isFavorite`, aliases, private thumbnail paths, or private face assets;
- never set `representativeFaceId` to a face outside the target space.

- [ ] **Step 4: Update matching logic**

In `processSpaceFaceMatch`:

```ts
if (!face.personId || !face.identityId) {
  continue;
}

const existingSpacePerson = await this.sharedSpaceRepository.findSpacePersonByIdentity(spaceId, face.identityId);
```

When creating a new space person, pass `identityId`. After the face is assigned, call `inheritPersonMetadata`.

Keep embedding fallback only for cross-owner bridging. When embedding fallback finds a space person with a different identity, defer identity merge to Task 11 unless the repository can prove both rows are accessible and type-compatible.

- [ ] **Step 5: Mark manual edits as source locks**

In `updateSpacePerson`, when `dto.name` is present, include:

```ts
nameSource: 'manual',
nameSourceProfileType: 'space-person',
nameSourceProfileId: personId,
nameSourceUpdatedAt: new Date(),
```

When `dto.birthDate` is present, include:

```ts
birthDateSource: 'manual',
birthDateSourceProfileType: 'space-person',
birthDateSourceProfileId: personId,
birthDateSourceUpdatedAt: new Date(),
```

- [ ] **Step 6: Run tests**

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test -- src/services/shared-space.service.spec.ts
pnpm test:medium -- test/medium/specs/repositories/shared-space-face-matching.spec.ts
pnpm check
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
git add server/src/repositories/shared-space.repository.ts server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts server/test/medium/specs/repositories/shared-space-face-matching.spec.ts
git commit -m "feat: match space people by identity"
```

---

### Task 6: RBAC Permission Matrix Tests

**Files:**

- Create: `server/test/medium/specs/services/people-identity-rbac.spec.ts`
- Modify as needed: `server/src/repositories/face-identity.repository.ts`
- Modify as needed: `server/src/repositories/shared-space.repository.ts`

- [ ] **Step 1: Add the permission matrix fixture**

Create `server/test/medium/specs/services/people-identity-rbac.spec.ts` with helpers that build:

```ts
type MatrixFixture = {
  owner: AuthDto;
  spaceAOnly: AuthDto;
  bothSpaces: AuthDto;
  nonMember: AuthDto;
  optedOutOwner: AuthDto;
  spaceAId: string;
  spaceBId: string;
  aliceIdentityId: string;
  sourcePersonId: string;
  spaceAPersonId: string;
  spaceBPersonId: string;
};
```

Seed cases:

- source owner has `person.name = 'Alice Source'` and `birthDate = '1990-01-01'`;
- Space A and Space B each contain one asset face linked to the same identity;
- `spaceAOnly` is a member only of Space A;
- `bothSpaces` is a member of both spaces;
- `nonMember` is in neither space;
- `optedOutOwner` owns another named source person with `sharePersonMetadata = false`.

- [ ] **Step 2: Add failing assertions**

The spec must contain these tests:

```ts
it('allows source owner metadata to publish only into spaces where contribution is enabled', async () => {
  const fx = await setupMatrix();

  const spacePerson = await sharedSpaceRepository.getPersonById(fx.spaceAPersonId);

  expect(spacePerson?.name).toBe('Alice Source');
  expect(spacePerson?.birthDate).toBe('1990-01-01');
});

it('does not publish opted-out source names or birth dates', async () => {
  const fx = await setupMatrix({ optedOut: true });

  const spacePerson = await sharedSpaceRepository.getPersonById(fx.spaceAPersonId);

  expect(spacePerson?.name).toBe('');
  expect(spacePerson?.birthDate).toBeNull();
});

it('does not let a Space A only member infer Space B metadata, counts, thumbnails, suggestions, or search ranking', async () => {
  const fx = await setupMatrix();

  const people = await personService.getAll(fx.spaceAOnly, {
    withHidden: true,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  });
  const suggestions = await searchService.getFilterSuggestions(fx.spaceAOnly, { withSharedSpaces: true });

  expect(JSON.stringify(people)).not.toContain('Space B Private Name');
  expect(JSON.stringify(people)).not.toContain(fx.spaceBId);
  expect(JSON.stringify(suggestions)).not.toContain('Space B Private Name');
  expect(JSON.stringify(suggestions)).not.toContain(fx.spaceBId);
});

it('groups Space A and Space B into one person only for a member of both spaces', async () => {
  const fx = await setupMatrix();

  const people = await personService.getAll(fx.bothSpaces, {
    withHidden: true,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  });

  expect(people.people.filter((p) => p.name === 'Alice Source')).toHaveLength(1);
});

it('does not expose face_identity ids in public responses', async () => {
  const fx = await setupMatrix();

  const people = await personService.getAll(fx.bothSpaces, {
    withHidden: true,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  });
  const serialized = JSON.stringify(people);

  expect(serialized).not.toContain(fx.aliceIdentityId);
  expect(serialized).not.toContain('identityId');
});
```

- [ ] **Step 3: Run and verify failure**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test:medium -- test/medium/specs/services/people-identity-rbac.spec.ts
```

Expected: FAIL for the `/people`, filter, and search assertions until those surfaces land in Tasks 7-9. Do not commit failing assertions. For this task, keep only the metadata, opt-out, and no-public-identity assertions that are made green by Tasks 2-5; reintroduce the remaining assertions in the task that makes each surface pass.

- [ ] **Step 4: Commit only the tests that are green by this phase**

After Task 5, commit the metadata and opt-out assertions that pass. Leave `/people`, public DTO, filter, and search assertions for Tasks 7-10 where their implementation lands.

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
git add server/test/medium/specs/services/people-identity-rbac.spec.ts
git commit -m "test: cover face identity metadata rbac"
```

---

### Task 7: Unified People Resolver And API

**Files:**

- Modify: `server/src/dtos/person.dto.ts`
- Modify: `server/src/repositories/face-identity.repository.ts`
- Modify: `server/src/repositories/person.repository.ts`
- Modify: `server/src/services/person.service.ts`
- Modify: `server/src/controllers/person.controller.spec.ts`
- Modify: `server/src/services/person.service.spec.ts`
- Modify: `server/test/medium/specs/services/people-identity-rbac.spec.ts`
- Modify: `web/src/routes/(user)/people/+page.ts`
- Modify: `web/src/routes/(user)/people/+page.svelte`
- Test: `web/src/routes/(user)/people/people-page.spec.ts`

- [ ] **Step 1: Add failing DTO and service tests**

Add to `server/src/services/person.service.spec.ts`:

```ts
it('uses the identity resolver when withSharedSpaces is true', async () => {
  const auth = factory.auth();
  mocks.faceIdentity.getAccessiblePeople.mockResolvedValue({
    people: [
      {
        id: 'person-1',
        name: 'Alice',
        birthDate: '1990-01-01',
        thumbnailPath: '',
        isHidden: false,
        isFavorite: false,
        type: 'person',
        species: null,
        updatedAt: new Date().toISOString(),
        numberOfAssets: 2,
        primaryProfile: { type: 'user-person', id: 'person-1' },
        filterId: 'person:person-1',
      },
    ],
    total: 1,
    hidden: 0,
    hasNextPage: false,
  });

  const result = await sut.getAll(auth, { withHidden: true, withSharedSpaces: true, page: 1, size: 50 });

  expect(mocks.faceIdentity.getAccessiblePeople).toHaveBeenCalledWith(auth.user.id, {
    withHidden: true,
    page: 1,
    size: 50,
  });
  expect(result.people[0]).toMatchObject({
    id: 'person-1',
    primaryProfile: { type: 'user-person', id: 'person-1' },
    filterId: 'person:person-1',
  });
});
```

- [ ] **Step 2: Run and verify failure**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test -- src/services/person.service.spec.ts -t "withSharedSpaces"
```

Expected: FAIL because `withSharedSpaces` and `getAccessiblePeople` are not implemented.

- [ ] **Step 3: Extend DTOs without exposing identity ids**

Update `PersonSearchSchema`:

```ts
withSharedSpaces: stringToBool.optional().describe('Include identity-grouped people from timeline-enabled shared spaces'),
```

Extend `PersonResponseSchema`:

```ts
primaryProfile: z
  .object({
    type: z.enum(['user-person', 'space-person']),
    id: z.string(),
    spaceId: z.string().optional(),
  })
  .optional(),
filterId: z.string().optional().describe('Scoped identity filter token'),
numberOfAssets: z.number().optional().describe('Accessible asset count for this grouped person'),
```

- [ ] **Step 4: Implement paged accessible identity grouping**

Add to `FaceIdentityRepository`:

```ts
getAccessiblePeople(
  userId: string,
  options: { withHidden: boolean; page: number; size: number },
): Promise<PeopleResponseDto>;
```

Query requirements:

- build accessible asset scope from owned timeline assets plus `shared_space_member.showInTimeline = true` spaces;
- join visible `asset_face` to `face_identity_face`;
- group by `identityId` after the accessible asset scope is applied;
- page identity ids first with `limit size + 1`;
- hydrate only that page with accessible personal and space profiles;
- display metadata priority is own `person`, own alias on accessible space profile, best accessible `shared_space_person`, then unnamed fallback;
- counts come from distinct accessible assets only;
- primary profile is own `person` when available, otherwise best accessible `shared_space_person`;
- `filterId` is `person:<id>` or `space-person:<id>` based on the primary profile.

- [ ] **Step 5: Wire `PersonService.getAll`**

In `PersonService.getAll`, keep current behavior when `withSharedSpaces` is false. When true, call `faceIdentityRepository.getAccessiblePeople`.

- [ ] **Step 6: Add web `/people` tests and implementation**

In `web/src/routes/(user)/people/people-page.spec.ts`, add:

```ts
it('requests identity-grouped people and routes space-primary people to the space person page', async () => {
  sdkMock.getAllPeople.mockResolvedValue({
    total: 1,
    hidden: 0,
    hasNextPage: false,
    people: [
      {
        id: 'space-person-1',
        name: 'Alice',
        birthDate: null,
        thumbnailPath: '',
        isHidden: false,
        type: 'person',
        primaryProfile: { type: 'space-person', id: 'space-person-1', spaceId: 'space-1' },
        filterId: 'space-person:space-person-1',
      },
    ],
  });

  renderPeoplePage();

  await screen.findByText('Alice');
  expect(sdkMock.getAllPeople).toHaveBeenCalledWith({ withHidden: true, withSharedSpaces: true });
  expect(screen.getByRole('link', { name: /Alice/i })).toHaveAttribute('href', '/spaces/space-1/people/space-person-1');
});
```

Update `+page.ts`:

```ts
const people = await getAllPeople({ withHidden: true, withSharedSpaces: true });
```

Update `+page.svelte` route/thumbnail helpers to use `person.primaryProfile`:

```ts
const getPersonHref = (person: PersonResponseDto) =>
  person.primaryProfile?.type === 'space-person' && person.primaryProfile.spaceId
    ? `/spaces/${person.primaryProfile.spaceId}/people/${person.primaryProfile.id}`
    : Route.viewPerson(person, { previousRoute: Route.people() });
```

- [ ] **Step 7: Run focused tests**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test -- src/services/person.service.spec.ts src/controllers/person.controller.spec.ts
pnpm test:medium -- test/medium/specs/services/people-identity-rbac.spec.ts
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/web
pnpm test -- src/routes/\(user\)/people/people-page.spec.ts
```

Expected: PASS.

- [ ] **Step 8: Sync OpenAPI/SDK and run checks**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm build
pnpm sync:open-api
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
pnpm --dir server check
pnpm --dir web check:typescript
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
git add server web open-api
git commit -m "feat: group people by accessible identity"
```

---

### Task 8: Filter Panel Identity Support

**Files:**

- Modify: `server/src/dtos/search.dto.ts`
- Modify: `server/src/services/search.service.ts`
- Modify: `server/src/repositories/search.repository.ts`
- Modify: `server/src/repositories/face-identity.repository.ts`
- Modify: `server/src/services/search.service.spec.ts`
- Modify: `server/src/repositories/search.repository.spec.ts`
- Modify: `server/test/medium/specs/services/people-identity-rbac.spec.ts`
- Modify: `web/src/lib/components/filter-panel/filter-panel.ts`
- Modify: `web/src/lib/utils/photos-filter-options.ts`
- Modify: `web/src/lib/utils/map-filter-options.ts`
- Modify: `web/src/lib/utils/album-filter-config.ts`
- Modify: `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`
- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- Test: `web/src/lib/components/filter-panel/__tests__/unified-suggestions.spec.ts`
- Test: `web/src/lib/utils/__tests__/photos-filter-options.spec.ts`
- Test: `web/src/lib/utils/__tests__/space-search.spec.ts`

- [ ] **Step 1: Add failing server filter tests**

In `server/src/services/search.service.spec.ts`:

```ts
it('resolves scoped person tokens before global filter suggestions', async () => {
  const auth = factory.auth();
  mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([{ spaceId: 'space-1' }]);
  mocks.faceIdentity.resolveScopedPersonTokens.mockResolvedValue({
    identityIds: ['identity-1'],
    legacyPersonIds: [],
    legacySpacePersonIds: [],
    hasInaccessibleToken: false,
  });
  mocks.search.getFilterSuggestions.mockResolvedValue({
    countries: [],
    cameraMakes: [],
    tags: [],
    people: [],
    ratings: [],
    mediaTypes: [],
    hasUnnamedPeople: false,
  });

  await sut.getFilterSuggestions(auth, { withSharedSpaces: true, personIds: ['space-person:space-person-1'] });

  expect(mocks.faceIdentity.resolveScopedPersonTokens).toHaveBeenCalledWith({
    userId: auth.user.id,
    tokens: ['space-person:space-person-1'],
    scope: expect.objectContaining({ withSharedSpaces: true }),
  });
  expect(mocks.search.getFilterSuggestions).toHaveBeenCalledWith(
    expect.any(Array),
    expect.objectContaining({ identityIds: ['identity-1'] }),
  );
});
```

- [ ] **Step 2: Run and verify failure**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test -- src/services/search.service.spec.ts -t "scoped person tokens"
```

Expected: FAIL because token resolution and `identityIds` search options are missing.

- [ ] **Step 3: Extend filter DTOs and search options**

Relax `personIds` validation for search/filter DTOs that receive filter-panel values:

```ts
const PersonFilterTokenSchema = z.string().min(1).describe('Personal person ID or scoped identity filter token');
```

Keep `spacePersonIds` as UUIDs for single-space routes.

Add `identityIds?: string[]` to repository-only options. This field never appears in public DTOs.

- [ ] **Step 4: Implement token resolution**

Add to `FaceIdentityRepository`:

```ts
resolveScopedPersonTokens(input: {
  userId: string;
  tokens: string[];
  scope: { withSharedSpaces?: boolean; spaceId?: string; timelineSpaceIds?: string[] };
}): Promise<{
  identityIds: string[];
  legacyPersonIds: string[];
  legacySpacePersonIds: string[];
  hasInaccessibleToken: boolean;
}>;
```

Requirements:

- `person:<id>` requires the user to own the person; shared-space access must use `space-person:<sharedSpacePersonId>`;
- `space-person:<id>` requires space membership and, in global/timeline contexts, the space must be included in the current request scope;
- scoped tokens are rejected in single-space contexts, where callers must use `spacePersonIds`;
- bare UUIDs remain in `legacyPersonIds` and keep the existing personal-scope checks;
- no token resolves to an inaccessible identity;
- well-formed but inaccessible tokens set `hasInaccessibleToken = true`;
- malformed tokens are rejected by DTO validation before repository resolution.

- [ ] **Step 5: Update search repository filtering and suggestions**

In `SearchRepository.buildFilteredAssetIds`, when `identityIds` is present, filter assets by visible faces linked through `face_identity_face`:

```ts
eb.exists(
  eb
    .selectFrom('asset_face')
    .innerJoin('face_identity_face', 'face_identity_face.assetFaceId', 'asset_face.id')
    .whereRef('asset_face.assetId', '=', 'asset.id')
    .where('asset_face.deletedAt', 'is', null)
    .where('asset_face.isVisible', 'is', true)
    .where('face_identity_face.identityId', '=', anyUuid(options.identityIds!)),
);
```

For global/timeline `getFilteredPeople`, return one option per accessible identity with:

```ts
{
  id: (primaryProfileToken, name, thumbnailProfile);
}
```

Do not include identity ids in the returned object.

- [ ] **Step 6: Update web filter mapping**

When `getFilterSuggestions` returns people, map `person.id` directly as the `PersonOption.id` token. If the DTO includes `thumbnailUrl`, use it. Otherwise, keep existing route-specific thumbnail URL generation:

```ts
people: response.people.map((person) => ({
  id: person.id,
  name: person.name,
  thumbnailUrl: person.thumbnailUrl ?? createUrl(`/people/${person.id}/thumbnail`),
})),
```

For single-space pages, keep sending `spacePersonIds` to asset search. For Photos and global Map pages with shared spaces enabled, send scoped tokens through `personIds`.

- [ ] **Step 7: Add web tests**

In `web/src/lib/utils/__tests__/photos-filter-options.spec.ts`:

```ts
it('passes scoped person tokens through global personIds', () => {
  const filters = { ...createFilterState(), personIds: ['space-person:space-person-1'] };

  const options = toPhotosFilterOptions(filters);

  expect(options.personIds).toEqual(['space-person:space-person-1']);
  expect(options.spacePersonIds).toBeUndefined();
});
```

In `web/src/lib/utils/__tests__/space-search.spec.ts`:

```ts
it('keeps single-space people as spacePersonIds', () => {
  const result = buildSpaceSearchParams({
    spaceId: 'space-1',
    filters: { ...baseFilters, personIds: ['space-person-1'] },
    includeSharedSpaces: false,
  });

  expect(result.spacePersonIds).toEqual(['space-person-1']);
  expect(result.personIds).toBeUndefined();
});
```

- [ ] **Step 8: Run tests**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test -- src/services/search.service.spec.ts src/repositories/search.repository.spec.ts
pnpm test:medium -- test/medium/specs/services/people-identity-rbac.spec.ts
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/web
pnpm test -- src/lib/components/filter-panel/__tests__/unified-suggestions.spec.ts src/lib/utils/__tests__/photos-filter-options.spec.ts src/lib/utils/__tests__/space-search.spec.ts
```

Expected: PASS.

- [ ] **Step 9: Sync SDK and commit**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm build
pnpm sync:open-api
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
git add server web open-api
git commit -m "feat: filter by scoped face identity"
```

---

### Task 9: Global Search People Support

**Files:**

- Modify: `server/src/dtos/search.dto.ts`
- Modify: `server/src/services/search.service.ts`
- Modify: `server/src/repositories/face-identity.repository.ts`
- Modify: `server/src/repositories/person.repository.ts`
- Modify: `server/src/controllers/search.controller.spec.ts`
- Modify: `server/src/services/search.service.spec.ts`
- Modify: `server/test/medium/specs/services/people-identity-rbac.spec.ts`
- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`
- Modify: `web/src/lib/components/global-search/rows/person-row.svelte`
- Modify: `web/src/lib/components/global-search/previews/person-preview.svelte`
- Test: `web/src/lib/components/global-search/__tests__/global-search.spec.ts`
- Test: `web/src/lib/components/global-search/__tests__/person-row.spec.ts`
- Test: `web/src/lib/components/global-search/__tests__/person-preview.spec.ts`

- [ ] **Step 1: Add failing search service tests**

In `server/src/services/search.service.spec.ts`:

```ts
it('searches identity-grouped people when withSharedSpaces is true', async () => {
  const auth = factory.auth();
  mocks.faceIdentity.searchAccessiblePeople.mockResolvedValue([
    {
      id: 'space-person-1',
      name: 'Alice',
      birthDate: null,
      thumbnailPath: '',
      isHidden: false,
      type: 'person',
      species: null,
      primaryProfile: { type: 'space-person', id: 'space-person-1', spaceId: 'space-1' },
      filterId: 'space-person:space-person-1',
    },
  ]);

  const result = await sut.searchPerson(auth, { name: 'ali', withHidden: false, withSharedSpaces: true });

  expect(mocks.faceIdentity.searchAccessiblePeople).toHaveBeenCalledWith(auth.user.id, {
    name: 'ali',
    withHidden: false,
    limit: 50,
  });
  expect(result).toHaveLength(1);
  expect(JSON.stringify(result)).not.toContain('identityId');
});
```

- [ ] **Step 2: Run and verify failure**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test -- src/services/search.service.spec.ts -t "identity-grouped people"
```

Expected: FAIL because `SearchPeopleDto.withSharedSpaces` and `searchAccessiblePeople` are missing.

- [ ] **Step 3: Implement access-scoped people search**

Extend `SearchPeopleSchema`:

```ts
withSharedSpaces: stringToBool.optional().describe('Search identity-grouped people from timeline-enabled shared spaces'),
```

Add `FaceIdentityRepository.searchAccessiblePeople(userId, { name, withHidden, limit })`.

Requirements:

- search only names and aliases from accessible scoped profiles;
- do not rank by inaccessible names;
- do not include inaccessible space names, ids, thumbnails, or counts;
- return at most `limit`;
- use same `primaryProfile` and `filterId` shape as `/people`.

- [ ] **Step 4: Update web global search**

In `global-search-manager.svelte.ts`, call:

```ts
const results = await searchPerson({ name: query, withHidden: false, withSharedSpaces: true }, { signal });
```

Update activation:

```ts
const href =
  p.primaryProfile?.type === 'space-person' && p.primaryProfile.spaceId
    ? `/spaces/${p.primaryProfile.spaceId}/people/${p.primaryProfile.id}`
    : Route.viewPerson({ id: p.primaryProfile?.id ?? p.id });
void goto(href);
```

Update `person-preview.svelte`:

```ts
const searchDto =
  person.primaryProfile?.type === 'space-person' && person.primaryProfile.spaceId
    ? { spaceId: person.primaryProfile.spaceId, spacePersonIds: [person.primaryProfile.id], size: 4 }
    : { personIds: [person.filterId ?? person.id], size: 4 };
```

- [ ] **Step 5: Add web tests**

Add assertions that:

- `searchPerson` is called with `withSharedSpaces: true`;
- a space-primary person navigates to `/spaces/:spaceId/people/:personId`;
- preview searches use `spacePersonIds` for space-primary people;
- row thumbnail does not assume `/people/:id/thumbnail` when `primaryProfile.type = 'space-person'`.

- [ ] **Step 6: Run tests and checks**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test -- src/services/search.service.spec.ts src/controllers/search.controller.spec.ts
pnpm test:medium -- test/medium/specs/services/people-identity-rbac.spec.ts
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/web
pnpm test -- src/lib/components/global-search/__tests__/global-search.spec.ts src/lib/components/global-search/__tests__/person-row.spec.ts src/lib/components/global-search/__tests__/person-preview.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Sync SDK and commit**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm build
pnpm sync:open-api
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
git add server web open-api
git commit -m "feat: search people by accessible identity"
```

---

### Task 10: Manual Same-Person Repair And Detach

**Files:**

- Modify: `server/src/dtos/person.dto.ts`
- Modify: `server/src/controllers/person.controller.ts`
- Modify: `server/src/services/person.service.ts`
- Modify: `server/src/repositories/face-identity.repository.ts`
- Modify: `server/src/controllers/person.controller.spec.ts`
- Modify: `server/src/services/person.service.spec.ts`
- Modify: `server/test/medium/specs/repositories/face-identity.repository.spec.ts`

- [ ] **Step 1: Add failing repository merge and detach tests**

In `server/test/medium/specs/repositories/face-identity.repository.spec.ts`:

```ts
it('merges non-conflicting identities by moving face links without merging scoped metadata', async () => {
  const { ctx, sut } = setup();
  const fx = await setupRepairablePersonalAndSpaceIdentities(ctx);

  await sut.mergeIdentities({
    targetIdentityId: fx.spaceIdentityId,
    sourceIdentityIds: [fx.personalIdentityId],
    source: 'manual',
  });

  const personalProfile = await ctx.database
    .selectFrom('person')
    .select(['name', 'birthDate', 'identityId'])
    .where('id', '=', fx.personalPerson.id)
    .executeTakeFirstOrThrow();

  expect(personalProfile.name).toBe(fx.personalPerson.name);
  expect(personalProfile.birthDate).toEqual(fx.personalPerson.birthDate);
  expect(personalProfile.identityId).toBe(fx.spaceIdentityId);
});

it('detaches a scoped space profile into a fresh identity without touching inaccessible profiles', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id });
  const { person } = await ctx.newPerson({ ownerId: user.id });
  const identityId = await sut.ensurePersonIdentity(person.id);
  const spacePerson = await ctx.newSharedSpacePerson({ spaceId: space.id, identityId });

  const newIdentityId = await sut.detachScopedProfile({ type: 'space-person', id: spacePerson.id });

  const updated = await ctx.database
    .selectFrom('shared_space_person')
    .select(['identityId'])
    .where('id', '=', spacePerson.id)
    .executeTakeFirstOrThrow();

  expect(newIdentityId).not.toBe(identityId);
  expect(updated.identityId).toBe(newIdentityId);
});

it('rejects detach when selected profile faces also back non-repairable profiles', async () => {
  const { sut } = setup();
  const fx = await setupSpacePersonBackedByAnotherUsersAssetFaces();

  const resolved = await sut.resolveDetachRef(fx.spaceEditor.id, {
    type: 'space-person',
    id: fx.spacePerson.id,
    spaceId: fx.space.id,
  });

  expect(resolved.accessible).toBe(true);
  expect(resolved.allBackingFacesRepairable).toBe(false);
});
```

- [ ] **Step 2: Add failing service permission tests**

In `server/src/services/person.service.spec.ts`:

```ts
it('rejects same-person repair for inaccessible scoped profiles', async () => {
  const auth = factory.auth();
  mocks.faceIdentity.resolveRepairRefs.mockResolvedValue({ accessible: false, reason: 'not-found-or-no-access' });

  await expect(
    sut.mergeScopedPeople(auth, {
      target: { type: 'space-person', id: 'space-person-1', spaceId: 'space-1' },
      sources: [{ type: 'space-person', id: 'space-person-2', spaceId: 'space-2' }],
    }),
  ).rejects.toThrow(BadRequestException);
});

it('merges same-person repair only after access and type compatibility checks', async () => {
  const auth = factory.auth();
  mocks.faceIdentity.resolveRepairRefs.mockResolvedValue({
    accessible: true,
    targetIdentityId: 'identity-1',
    sourceIdentityIds: ['identity-2'],
    type: 'person',
  });
  mocks.faceIdentity.mergeIdentities.mockResolvedValue(void 0);

  await sut.mergeScopedPeople(auth, {
    target: { type: 'person', id: 'person-1' },
    sources: [{ type: 'space-person', id: 'space-person-1', spaceId: 'space-1' }],
  });

  expect(mocks.faceIdentity.mergeIdentities).toHaveBeenCalledWith({
    targetIdentityId: 'identity-1',
    sourceIdentityIds: ['identity-2'],
    source: 'manual',
  });
});
```

- [ ] **Step 3: Run and verify failure**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test -- src/services/person.service.spec.ts -t "same-person repair"
pnpm test:medium -- test/medium/specs/repositories/face-identity.repository.spec.ts -t "merges identities|detaches"
```

Expected: FAIL because repair DTOs and repository methods are missing.

- [ ] **Step 4: Add DTOs and endpoints**

In `person.dto.ts` add:

```ts
const ScopedPersonProfileRefSchema = z.object({
  type: z.enum(['person', 'space-person']),
  id: z.uuidv4(),
  spaceId: z.uuidv4().optional(),
});

const MergeScopedPeopleSchema = z.object({
  target: ScopedPersonProfileRefSchema,
  sources: z.array(ScopedPersonProfileRefSchema).min(1),
});

const DetachScopedPersonSchema = z.object({
  profile: ScopedPersonProfileRefSchema,
});
```

In `PersonController` add:

```ts
@Post('same-person')
@Authenticated({ permission: Permission.PersonMerge })
mergeScopedPeople(@Auth() auth: AuthDto, @Body() dto: MergeScopedPeopleDto): Promise<void> {
  return this.service.mergeScopedPeople(auth, dto);
}

@Post('detach-profile')
@Authenticated({ permission: Permission.PersonMerge })
detachScopedPerson(@Auth() auth: AuthDto, @Body() dto: DetachScopedPersonDto): Promise<void> {
  return this.service.detachScopedPerson(auth, dto);
}
```

- [ ] **Step 5: Implement repair access rules**

In `PersonService.mergeScopedPeople` and `detachScopedPerson`:

- personal `person` refs require owner access;
- `space-person` refs require membership and owner/editor role in that space;
- all refs must resolve to identities;
- all identities must be type-compatible;
- same-person merge requires every attached scoped profile on the involved identities to be repairable by the actor;
- detach requires every backing face that would move to belong only to repairable profiles;
- hidden, favorite, aliases, names, and birth dates remain scoped profile fields and are not merged into other profiles;
- merged public responses still do not include identity ids.

- [ ] **Step 6: Run tests and sync SDK**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test -- src/services/person.service.spec.ts src/controllers/person.controller.spec.ts
pnpm test:medium -- test/medium/specs/repositories/face-identity.repository.spec.ts
pnpm build
pnpm sync:open-api
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
git add server open-api
git commit -m "feat: repair face identity links"
```

---

### Task 11: Search Performance And Query-Shape Guardrails

**Files:**

- Modify: `server/src/repositories/face-identity.repository.ts`
- Modify: `server/src/repositories/search.repository.ts`
- Modify: `server/test/medium/specs/repositories/face-identity.repository.spec.ts`
- Modify: `server/src/repositories/search.repository.spec.ts`

- [ ] **Step 1: Add failing query-shape tests**

Add tests that call repository methods with `@GenerateSql` coverage and assert the generated SQL shape. Define a local helper that reads generated SQL snapshots and fails loudly when snapshots are missing:

```ts
it('pages identity ids before hydrating people rows', async () => {
  const sql = await collectGeneratedIdentitySql('FaceIdentityRepository.getAccessiblePeopleIdentityPage');

  expect(sql).toContain('limit');
  expect(sql).toContain('face_identity_face');
  expect(sql).toContain('shared_space_member');
  expect(sql.indexOf('shared_space_member')).toBeLessThan(sql.indexOf('group by'));
});

it('does not use vector similarity in request-time people/filter/search queries', async () => {
  const sql = [
    await collectGeneratedIdentitySql('FaceIdentityRepository.getAccessiblePeopleIdentityPage'),
    await collectGeneratedIdentitySql('SearchRepository.getFilteredPeople'),
    await collectGeneratedIdentitySql('FaceIdentityRepository.searchAccessiblePeople'),
  ].join('\n');

  expect(sql).not.toContain('<=>');
  expect(sql).not.toContain('face_search.embedding');
});

function collectGeneratedIdentitySql(snapshotName: string): string {
  if (!existsSync(sqlSnapshotDirectory)) {
    throw new Error('Generated SQL snapshots are missing; run pnpm --dir server build && pnpm --dir server sync:sql');
  }
  return readGeneratedSqlSnapshot(snapshotName);
}
```

If generated-SQL helpers are awkward for private methods, expose small repository methods for query generation:

```ts
getAccessiblePeopleIdentityPage(userId: string, options: { limit: number; offset: number; withHidden: boolean });
hydrateAccessiblePeople(userId: string, identityIds: string[]);
```

- [ ] **Step 2: Run and verify failure**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test -- src/repositories/search.repository.spec.ts
pnpm test:medium -- test/medium/specs/repositories/face-identity.repository.spec.ts -t "query-shape"
```

Expected: FAIL until query methods have explicit generated SQL coverage.

- [ ] **Step 3: Add repository guardrails**

Ensure request-time methods follow this shape:

```text
accessible assets
  -> visible asset_face rows
  -> face_identity_face
  -> page identity ids
  -> hydrate scoped profiles for page only
```

Indexes required by query plans:

- `face_identity_face_assetFaceId_key`
- `face_identity_face_identityId_assetFaceId_idx`
- `person_identityId_idx`
- `shared_space_person_spaceId_identityId_key`
- `shared_space_person_identityId_spaceId_idx`
- existing `asset_face_personId_assetId_notDeleted_isVisible_idx`
- existing shared-space asset/library membership indexes

- [ ] **Step 4: Run local EXPLAIN on representative data**

After seeding a dev database with at least 20,000 people and several overlapping spaces, run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
DB_URL="${DB_URL:-postgres://postgres:postgres@localhost:5432/immich}" pnpm migrations:run
DB_URL="${DB_URL:-postgres://postgres:postgres@localhost:5432/immich}" pnpm test:medium -- test/medium/specs/repositories/face-identity.repository.spec.ts -t "query-shape"
```

Then capture `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)` for:

- identity-grouped `/people` page identity-id query;
- filter suggestions people query;
- global search people query;
- identity token asset-filter query.

Expected:

- no vector operators;
- no unbounded full hydration of all identities;
- filters apply accessible asset scope before identity grouping;
- pagination limit appears in the identity-id page query.

- [ ] **Step 5: Run checks and commit**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test -- src/repositories/search.repository.spec.ts
pnpm test:medium -- test/medium/specs/repositories/face-identity.repository.spec.ts
pnpm check
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
git add server
git commit -m "test: guard face identity query shape"
```

---

### Task 12: Full Regression And Release Checks

**Files:**

- Verify all files changed in prior tasks.
- No new source files unless a check reveals a concrete missing fix.

- [ ] **Step 1: Run backend focused suites**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/server
pnpm test -- src/services/person.service.spec.ts src/services/shared-space.service.spec.ts src/services/search.service.spec.ts src/controllers/person.controller.spec.ts src/controllers/search.controller.spec.ts
pnpm test:medium -- test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/repositories/shared-space-face-matching.spec.ts test/medium/specs/services/people-identity-rbac.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run frontend focused suites**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design/web
pnpm test -- src/routes/\(user\)/people/people-page.spec.ts src/lib/components/filter-panel/__tests__/unified-suggestions.spec.ts src/lib/utils/__tests__/photos-filter-options.spec.ts src/lib/utils/__tests__/space-search.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts src/lib/components/global-search/__tests__/person-row.spec.ts src/lib/components/global-search/__tests__/person-preview.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Run code checks**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
pnpm --dir server check:code
pnpm --dir web check:code
pnpm --dir docs exec prettier --check ../docs/docs/developer/ubiquitous-language.md ../docs/superpowers/specs/2026-05-01-global-face-identities-design.md ../docs/superpowers/plans/2026-05-01-global-face-identities.md
git diff --check
```

Expected: PASS.

- [ ] **Step 4: Verify public DTO leakage**

Run:

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
rg -n "identityId|face_identity" open-api web/src server/src/dtos server/src/controllers
```

Expected:

- no `face_identity.id` exposure in OpenAPI models;
- no public DTO field named `identityId`;
- server internals may reference `identityId` in repositories and schema only.

- [ ] **Step 5: Final commit if verification edits were needed**

```bash
cd /home/pierre/dev/gallery/.worktrees/global-face-identities-design
git status --short
git add server web open-api docs
git commit -m "test: verify global face identities"
```

Skip this commit if `git status --short` is clean.
