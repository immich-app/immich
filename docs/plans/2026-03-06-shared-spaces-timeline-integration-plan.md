# Shared Spaces Timeline Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Merge shared space assets into a member's personal timeline, with a per-space `showInTimeline` toggle on the member row.

**Architecture:** Add `showInTimeline` boolean to `shared_space_member` (default `true`). Extend the timeline service to resolve enabled space IDs and pass them to the asset repository. The repository uses a UNION query to combine user-owned assets with space assets. The web frontend passes `withSharedSpaces: true` on the main photos timeline and renders a toggle in the space members modal.

**Tech Stack:** NestJS (Kysely), SvelteKit (Svelte 5 runes), `@immich/sdk`, Vitest

---

## Context & Key Files

### Server

- **Schema:** `server/src/schema/tables/shared-space-member.table.ts`
- **DTOs:** `server/src/dtos/shared-space.dto.ts`, `server/src/dtos/time-bucket.dto.ts`
- **Services:** `server/src/services/timeline.service.ts`, `server/src/services/shared-space.service.ts`
- **Repository:** `server/src/repositories/shared-space.repository.ts`, `server/src/repositories/asset.repository.ts`
- **Tests:** `server/src/services/timeline.service.spec.ts`, `server/src/services/shared-space.service.spec.ts`
- **Factory:** `server/test/small.factory.ts`

### Web

- **Photos page:** `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`
- **Members modal:** `web/src/lib/modals/SpaceMembersModal.svelte`
- **Members modal test:** `web/src/lib/modals/SpaceMembersModal.spec.ts`

### Reference patterns

- **Partner `inTimeline`:** `server/src/schema/tables/partner.table.ts` (line 44-45), `server/src/utils/asset.util.ts` (lines 111-139)
- **Partner settings toggle:** `web/src/lib/components/user-settings-page/partner-settings.svelte` (lines 185-190) — uses `SettingSwitch`
- **Existing `withPartners` validation:** `server/src/services/timeline.service.ts` (lines 71-82)

---

## Task 1: Add `showInTimeline` column to schema and create migration

**Files:**

- Modify: `server/src/schema/tables/shared-space-member.table.ts`
- Create: `server/src/schema/migrations/{timestamp}-AddShowInTimelineToSharedSpaceMember.ts`
- Modify: `server/test/small.factory.ts`

**Step 1: Add column to table definition**

In `server/src/schema/tables/shared-space-member.table.ts`, add after the `joinedAt` column (line 18):

```typescript
@Column({ type: 'boolean', default: true })
showInTimeline!: Generated<boolean>;
```

**Step 2: Generate migration**

Run from `server/`:

```bash
pnpm migrations:generate
```

This auto-generates a timestamped migration file. The migration should contain:

```typescript
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_space_member" ADD "showInTimeline" boolean NOT NULL DEFAULT true;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_space_member" DROP COLUMN "showInTimeline";`.execute(db);
}
```

If the auto-generated migration doesn't match, edit it to match the above.

**Step 3: Update test factory**

In `server/test/small.factory.ts`, find the `sharedSpaceMemberFactory` (around line 526) and add `showInTimeline`:

```typescript
const sharedSpaceMemberFactory = (data: Partial<SharedSpaceMember> = {}): SharedSpaceMember => ({
  spaceId: newUuid(),
  userId: newUuid(),
  role: SharedSpaceRole.Viewer,
  joinedAt: newDate(),
  showInTimeline: true,
  ...data,
});
```

**Step 4: Verify build**

```bash
cd server && pnpm build
```

**Step 5: Commit**

```bash
git add server/src/schema/tables/shared-space-member.table.ts server/src/schema/migrations/ server/test/small.factory.ts
git commit -m "feat: add showInTimeline column to shared_space_member"
```

---

## Task 2: Update DTOs and service for `showInTimeline`

**Files:**

- Modify: `server/src/dtos/shared-space.dto.ts`
- Modify: `server/src/services/shared-space.service.ts`
- Modify: `server/src/repositories/shared-space.repository.ts`

**Step 1: Write failing tests for updateMember with showInTimeline**

In `server/src/services/shared-space.service.spec.ts`, add a new test in the `updateMember` describe block (after the existing tests around line 341):

```typescript
it('should allow any member to toggle their own showInTimeline', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  const viewerMember = makeMemberResult({
    spaceId,
    userId: auth.user.id,
    role: SharedSpaceRole.Viewer,
    showInTimeline: true,
  });
  const updatedMember = makeMemberResult({
    spaceId,
    userId: auth.user.id,
    role: SharedSpaceRole.Viewer,
    showInTimeline: false,
  });

  mocks.sharedSpace.getMember
    .mockResolvedValueOnce(viewerMember) // requireMembership check
    .mockResolvedValueOnce(updatedMember); // fetch after update
  mocks.sharedSpace.updateMember.mockResolvedValue(
    factory.sharedSpaceMember({
      spaceId,
      userId: auth.user.id,
      showInTimeline: false,
    }),
  );

  const result = await sut.updateMemberTimeline(auth, spaceId, { showInTimeline: false });

  expect(result.showInTimeline).toBe(false);
  expect(mocks.sharedSpace.updateMember).toHaveBeenCalledWith(spaceId, auth.user.id, {
    showInTimeline: false,
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: FAIL — `sut.updateMemberTimeline` is not a function, `showInTimeline` missing from `makeMemberResult`.

**Step 3: Update `makeMemberResult` helper**

At the top of `shared-space.service.spec.ts`, update the helper (line 8-16):

```typescript
const makeMemberResult = (overrides: Record<string, unknown> = {}) => ({
  ...factory.sharedSpaceMember(),
  name: 'Test User',
  email: 'test@immich.cloud',
  profileImagePath: '',
  profileChangedAt: newDate(),
  avatarColor: null,
  showInTimeline: true,
  ...overrides,
});
```

**Step 4: Add `showInTimeline` to response DTO**

In `server/src/dtos/shared-space.dto.ts`, add to `SharedSpaceMemberResponseDto` (after line 103):

```typescript
@ApiProperty({ description: 'Show space assets in timeline' })
showInTimeline!: boolean;
```

**Step 5: Create update DTO for timeline toggle**

In `server/src/dtos/shared-space.dto.ts`, add a new DTO after `SharedSpaceMemberUpdateDto` (after line 78):

```typescript
export class SharedSpaceMemberTimelineDto {
  @ApiProperty({ description: 'Show space assets in personal timeline' })
  @IsNotEmpty()
  showInTimeline!: boolean;
}
```

You'll need to add `IsNotEmpty` to the imports at the top if not already present (it is — line 2).

**Step 6: Update repository `getMembers` and `getMember` to select `showInTimeline`**

In `server/src/repositories/shared-space.repository.ts`, update both `getMembers` (line 56-66) and `getMember` (line 79-89) select arrays to include the new column:

```typescript
.select([
  'shared_space_member.spaceId',
  'shared_space_member.userId',
  'shared_space_member.role',
  'shared_space_member.joinedAt',
  'shared_space_member.showInTimeline',
  'user.name',
  'user.email',
  'user.profileImagePath',
  'user.profileChangedAt',
  'user.avatarColor',
])
```

**Step 7: Update `mapMember` in service**

In `server/src/services/shared-space.service.ts`, update the `mapMember` method (lines 175-194). Add `showInTimeline` to the parameter type and the return object:

```typescript
private mapMember(member: {
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: unknown;
  profileImagePath: string;
  profileChangedAt: unknown;
  avatarColor: string | null;
  showInTimeline: boolean;
}): SharedSpaceMemberResponseDto {
  return {
    userId: member.userId,
    name: member.name,
    email: member.email,
    role: member.role,
    joinedAt: member.joinedAt as unknown as string,
    profileImagePath: member.profileImagePath,
    profileChangedAt: member.profileChangedAt as unknown as string,
    avatarColor: member.avatarColor ?? undefined,
    showInTimeline: member.showInTimeline,
  };
}
```

**Step 8: Add `updateMemberTimeline` method to service**

In `server/src/services/shared-space.service.ts`, add after the `updateMember` method (after line 129):

```typescript
async updateMemberTimeline(
  auth: AuthDto,
  spaceId: string,
  dto: SharedSpaceMemberTimelineDto,
): Promise<SharedSpaceMemberResponseDto> {
  await this.requireMembership(auth, spaceId);

  await this.sharedSpaceRepository.updateMember(spaceId, auth.user.id, {
    showInTimeline: dto.showInTimeline,
  });

  const member = await this.sharedSpaceRepository.getMember(spaceId, auth.user.id);
  if (!member) {
    throw new BadRequestException('Member not found');
  }

  return this.mapMember(member);
}
```

Add `SharedSpaceMemberTimelineDto` to the imports from `src/dtos/shared-space.dto`.

**Step 9: Add controller endpoint**

In `server/src/controllers/shared-space.controller.ts`, add after the existing `updateMember` endpoint:

```typescript
@Patch(':id/members/me/timeline')
@Authenticated({ permission: Permission.SharedSpaceRead })
@Endpoint({
  summary: 'Update timeline visibility for current member',
  description: "Toggle whether this space's assets appear in the current user's personal timeline.",
  history: new HistoryBuilder().added('v1').beta('v1'),
})
updateMemberTimeline(
  @Auth() auth: AuthDto,
  @Param('id') id: string,
  @Body() dto: SharedSpaceMemberTimelineDto,
): Promise<SharedSpaceMemberResponseDto> {
  return this.service.updateMemberTimeline(auth, id, dto);
}
```

Add `SharedSpaceMemberTimelineDto` to the imports from `src/dtos/shared-space.dto`.

**Step 10: Run tests**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: PASS

**Step 11: Verify build**

```bash
cd server && pnpm build
```

**Step 12: Commit**

```bash
git add server/src/dtos/shared-space.dto.ts server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts server/src/repositories/shared-space.repository.ts server/src/controllers/shared-space.controller.ts
git commit -m "feat: add showInTimeline to member DTOs and updateMemberTimeline endpoint"
```

---

## Task 3: Add `getSpaceIdsForTimeline` repository method

This method queries space IDs where the user is a member and `showInTimeline = true`.

**Files:**

- Modify: `server/src/repositories/shared-space.repository.ts`

**Step 1: Add the method**

In `server/src/repositories/shared-space.repository.ts`, add:

```typescript
@GenerateSql({ params: [DummyValue.UUID] })
getSpaceIdsForTimeline(userId: string) {
  return this.db
    .selectFrom('shared_space_member')
    .where('userId', '=', userId)
    .where('showInTimeline', '=', true)
    .select('spaceId')
    .execute();
}
```

**Step 2: Verify build**

```bash
cd server && pnpm build
```

**Step 3: Commit**

```bash
git add server/src/repositories/shared-space.repository.ts
git commit -m "feat: add getSpaceIdsForTimeline repository method"
```

---

## Task 4: Add `withSharedSpaces` to timeline DTO and service

**Files:**

- Modify: `server/src/dtos/time-bucket.dto.ts`
- Modify: `server/src/services/timeline.service.ts`
- Modify: `server/src/repositories/asset.repository.ts` (interface only)

**Step 1: Write failing tests**

In `server/src/services/timeline.service.spec.ts`, add a new describe block inside `getTimeBuckets` (after the existing `shared space access` block, around line 131):

```typescript
describe('withSharedSpaces', () => {
  it('should resolve space IDs and pass them as timelineSpaceIds', async () => {
    mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([{ spaceId: 'space-1' }, { spaceId: 'space-2' }]);
    mocks.asset.getTimeBuckets.mockResolvedValue([{ timeBucket: 'bucket', count: 1 }]);

    await sut.getTimeBuckets(authStub.admin, {
      withSharedSpaces: true,
      visibility: AssetVisibility.Timeline,
    });

    expect(mocks.sharedSpace.getSpaceIdsForTimeline).toHaveBeenCalledWith(authStub.admin.user.id);
    expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(
      expect.objectContaining({
        userIds: [authStub.admin.user.id],
        timelineSpaceIds: ['space-1', 'space-2'],
      }),
    );
  });

  it('should not pass timelineSpaceIds when user has no enabled spaces', async () => {
    mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([]);
    mocks.asset.getTimeBuckets.mockResolvedValue([{ timeBucket: 'bucket', count: 1 }]);

    await sut.getTimeBuckets(authStub.admin, {
      withSharedSpaces: true,
      visibility: AssetVisibility.Timeline,
    });

    const calledWith = mocks.asset.getTimeBuckets.mock.calls[0][0];
    expect(calledWith.timelineSpaceIds).toBeUndefined();
  });

  it('should throw when combined with archive visibility', async () => {
    await expect(
      sut.getTimeBuckets(authStub.admin, {
        withSharedSpaces: true,
        visibility: AssetVisibility.Archive,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw when combined with isFavorite', async () => {
    await expect(
      sut.getTimeBuckets(authStub.admin, {
        withSharedSpaces: true,
        isFavorite: true,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw when combined with isTrashed', async () => {
    await expect(
      sut.getTimeBuckets(authStub.admin, {
        withSharedSpaces: true,
        isTrashed: true,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw when combined with undefined visibility', async () => {
    await expect(
      sut.getTimeBuckets(authStub.admin, {
        withSharedSpaces: true,
        visibility: undefined,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd server && pnpm test -- --run src/services/timeline.service.spec.ts
```

Expected: FAIL — `withSharedSpaces` not recognized.

**Step 3: Add `withSharedSpaces` to timeline DTO**

In `server/src/dtos/time-bucket.dto.ts`, add after the `withPartners` field:

```typescript
@ValidateBoolean({ optional: true, description: 'Include assets from shared spaces where the user has timeline enabled' })
withSharedSpaces?: boolean;
```

**Step 4: Add `timelineSpaceIds` to `TimeBucketOptions`**

In `server/src/repositories/asset.repository.ts`, add to the `AssetBuilderOptions` interface (around line 70-90):

```typescript
timelineSpaceIds?: string[];
```

**Step 5: Update `buildTimeBucketOptions` in timeline service**

In `server/src/services/timeline.service.ts`, update `buildTimeBucketOptions` (lines 28-44). After the `withPartners` block, add space resolution:

```typescript
private async buildTimeBucketOptions(auth: AuthDto, dto: TimeBucketDto): Promise<TimeBucketOptions> {
  const { userId, ...options } = dto;
  let userIds: string[] | undefined = undefined;
  let timelineSpaceIds: string[] | undefined = undefined;

  if (userId) {
    userIds = [userId];
    if (dto.withPartners) {
      const partnerIds = await getMyPartnerIds({
        userId: auth.user.id,
        repository: this.partnerRepository,
        timelineEnabled: true,
      });
      userIds.push(...partnerIds);
    }

    if (dto.withSharedSpaces) {
      const spaceRows = await this.sharedSpaceRepository.getSpaceIdsForTimeline(auth.user.id);
      if (spaceRows.length > 0) {
        timelineSpaceIds = spaceRows.map((row) => row.spaceId);
      }
    }
  }

  return { ...options, userIds, timelineSpaceIds };
}
```

**Step 6: Add validation for `withSharedSpaces`**

In `server/src/services/timeline.service.ts`, in `timeBucketChecks` (after the `withPartners` validation block, around line 82), add:

```typescript
if (dto.withSharedSpaces) {
  const requestedArchived = dto.visibility === AssetVisibility.Archive || dto.visibility === undefined;
  const requestedFavorite = dto.isFavorite === true || dto.isFavorite === false;
  const requestedTrash = dto.isTrashed === true;

  if (requestedArchived || requestedFavorite || requestedTrash) {
    throw new BadRequestException(
      'withSharedSpaces is only supported for non-archived, non-trashed, non-favorited assets',
    );
  }
}
```

**Step 7: Run tests**

```bash
cd server && pnpm test -- --run src/services/timeline.service.spec.ts
```

Expected: PASS

**Step 8: Commit**

```bash
git add server/src/dtos/time-bucket.dto.ts server/src/services/timeline.service.ts server/src/services/timeline.service.spec.ts server/src/repositories/asset.repository.ts
git commit -m "feat: add withSharedSpaces to timeline DTO and service"
```

---

## Task 5: Implement UNION query in asset repository

This is the core query change. When `timelineSpaceIds` is present, the repository uses a UNION to combine user-owned assets with space assets.

**Files:**

- Modify: `server/src/repositories/asset.repository.ts`

**Step 1: Update `getTimeBuckets` method**

In `server/src/repositories/asset.repository.ts`, find the `getTimeBuckets` method (around line 690). The current CTE builds a single query. When `timelineSpaceIds` is present, we need to UNION two queries.

The key change is in the CTE definition. Currently the CTE does:

```typescript
.$if(!!options.userIds, (qb) => qb.where('asset.ownerId', '=', anyUuid(options.userIds!)))
```

Replace that line with:

```typescript
.$if(!!options.userIds && !options.timelineSpaceIds, (qb) =>
  qb.where('asset.ownerId', '=', anyUuid(options.userIds!)),
)
.$if(!!options.userIds && !!options.timelineSpaceIds, (qb) =>
  qb.where((eb) =>
    eb.or([
      eb('asset.ownerId', '=', anyUuid(options.userIds!)),
      eb.exists(
        eb
          .selectFrom('shared_space_asset')
          .whereRef('shared_space_asset.assetId', '=', 'asset.id')
          .where('shared_space_asset.spaceId', '=', anyUuid(options.timelineSpaceIds!)),
      ),
    ]),
  ),
)
```

**Important:** This applies the same pattern to BOTH `getTimeBuckets` AND `getTimeBucket`. The `getTimeBucket` method (around line 749) has a similar `userIds` filter line (around line 826):

```typescript
.$if(!!options.userIds, (qb) => qb.where('asset.ownerId', '=', anyUuid(options.userIds!)))
```

Apply the same replacement there.

**Note on UNION vs OR approach:** After deeper analysis, the OR+EXISTS approach inside a single CTE is actually the better fit here because:

1. Both `getTimeBuckets` and `getTimeBucket` already use CTEs with many conditional filters
2. A true UNION would require duplicating the entire CTE with all its conditional filters
3. PostgreSQL can optimize `OR EXISTS` with proper indexes on `shared_space_asset(spaceId, assetId)`
4. The `spaceId = ANY(...)` clause limits the EXISTS subquery to only the user's enabled spaces

The `shared_space_asset` table already has a composite primary key `(spaceId, assetId)` which provides the needed index.

**Step 2: Verify build**

```bash
cd server && pnpm build
```

**Step 3: Run existing timeline tests to ensure no regressions**

```bash
cd server && pnpm test -- --run src/services/timeline.service.spec.ts
```

Expected: PASS (all existing tests still pass)

**Step 4: Commit**

```bash
git add server/src/repositories/asset.repository.ts
git commit -m "feat: add timelineSpaceIds OR EXISTS clause to timeline queries"
```

---

## Task 6: Regenerate OpenAPI SDK and SQL docs

**Files:**

- Various generated files

**Step 1: Build server**

```bash
cd server && pnpm build
```

**Step 2: Regenerate OpenAPI specs**

```bash
cd server && pnpm sync:open-api
```

**Step 3: Regenerate TypeScript SDK**

```bash
make open-api-typescript
```

**Step 4: Regenerate Dart client**

```bash
make open-api-dart
```

**Step 5: Regenerate SQL docs**

```bash
make sql
```

**Step 6: Verify web build**

```bash
cd web && pnpm check
```

**Step 7: Commit all generated files**

```bash
git add open-api/ mobile/openapi/ server/src/queries/
git commit -m "chore: regenerate OpenAPI clients and SQL docs for timeline integration"
```

---

## Task 7: Update web frontend — photos page and members modal

**Files:**

- Modify: `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`
- Modify: `web/src/lib/modals/SpaceMembersModal.svelte`

**Step 1: Add `withSharedSpaces` to photos timeline options**

In `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`, update line 48:

```typescript
const options = { visibility: AssetVisibility.Timeline, withStacked: true, withPartners: true, withSharedSpaces: true };
```

**Step 2: Add timeline toggle to SpaceMembersModal**

In `web/src/lib/modals/SpaceMembersModal.svelte`:

First, add the needed imports. Update the SDK import (line 5-11) to include `updateMemberTimeline`:

```typescript
import {
  removeMember,
  SharedSpaceRole,
  updateMember,
  updateMemberTimeline,
  UserAvatarColor,
  type SharedSpaceMemberResponseDto,
} from '@immich/sdk';
```

Update the `@immich/ui` import (line 12) to include `Switch`:

```typescript
import { BasicModal, Button, Field, modalManager, Select, Switch, Text, type SelectOption } from '@immich/ui';
```

Add `user` store import:

```typescript
import { user } from '$lib/stores/user.store';
```

Add a handler function after `handleRoleChange` (around line 76):

```typescript
const handleTimelineToggle = async (member: SharedSpaceMemberResponseDto, showInTimeline: boolean) => {
  try {
    const updated = await updateMemberTimeline({
      id: spaceId,
      sharedSpaceMemberTimelineDto: { showInTimeline },
    });
    members = members.map((m) => (m.userId === updated.userId ? updated : m));
  } catch (error) {
    handleError(error, $t('unable_to_update_timeline_display_status'));
  }
};
```

Then update the template. In the `{#each members}` block, add a timeline toggle row for the current user. After the role display section (after line 116, before the closing `</div>` of each member row), add:

For the current user's row, add a timeline toggle. The cleanest approach is to add it inside the member row. Find the section where member info is displayed (around lines 92-117) and modify the current user's row.

After the role section (`{/if}` on line 116), add a conditional toggle for the current user:

```svelte
{#if member.userId === $user.id}
  <Switch
    checked={member.showInTimeline}
    onCheckedChange={(checked) => handleTimelineToggle(member, checked)}
  />
{/if}
```

**Step 3: Add i18n key if needed**

The `unable_to_update_timeline_display_status` key already exists in `i18n/en.json`. No changes needed.

**Step 4: Format**

```bash
cd web && pnpm format
```

**Step 5: Verify build**

```bash
cd web && pnpm check
```

**Step 6: Commit**

```bash
git add web/src/routes/\(user\)/photos/ web/src/lib/modals/SpaceMembersModal.svelte
git commit -m "feat(web): add withSharedSpaces to timeline and toggle in members modal"
```

---

## Task 8: Update web tests

**Files:**

- Modify: `web/src/lib/modals/SpaceMembersModal.spec.ts`

**Step 1: Update test member fixtures**

In `SpaceMembersModal.spec.ts`, update the member fixtures to include `showInTimeline`:

```typescript
const ownerMember: SharedSpaceMemberResponseDto = {
  userId: 'user-owner',
  name: 'Owner User',
  email: 'owner@test.com',
  role: Role.Owner,
  joinedAt: '2024-01-01T00:00:00.000Z',
  showInTimeline: true,
};

const editorMember: SharedSpaceMemberResponseDto = {
  userId: 'user-editor',
  name: 'Editor User',
  email: 'editor@test.com',
  role: Role.Editor,
  joinedAt: '2024-01-02T00:00:00.000Z',
  showInTimeline: true,
};

const viewerMember: SharedSpaceMemberResponseDto = {
  userId: 'user-viewer',
  name: 'Viewer User',
  email: 'viewer@test.com',
  role: Role.Viewer,
  joinedAt: '2024-01-03T00:00:00.000Z',
  showInTimeline: false,
};
```

**Step 2: Add test for timeline toggle rendering**

Add a new test that verifies the toggle appears for the current user. You'll need to mock the `user` store. Add after existing tests:

```typescript
it('should show timeline toggle for the current user', async () => {
  // Mock the user store to match ownerMember
  const { user: userStore } = await import('$lib/stores/user.store');
  userStore.set({ id: 'user-owner' } as any);

  render(SpaceMembersModal, {
    spaceId,
    members: [ownerMember, editorMember],
    isOwner: true,
    onClose,
  });

  // The Switch component renders a button with role="switch"
  const switches = screen.getAllByRole('switch');
  expect(switches.length).toBeGreaterThanOrEqual(1);
});
```

**Step 3: Run tests**

```bash
cd web && pnpm test -- --run src/lib/modals/SpaceMembersModal.spec.ts
```

Expected: PASS

**Step 4: Commit**

```bash
git add web/src/lib/modals/SpaceMembersModal.spec.ts
git commit -m "test(web): update SpaceMembersModal tests for showInTimeline"
```

---

## Task 9: Run full checks and format

**Step 1: Format all**

```bash
make format-server && make format-web
```

**Step 2: Lint all**

```bash
make lint-server && make lint-web
```

**Step 3: Type check**

```bash
make check-server && make check-web
```

**Step 4: Run all tests**

```bash
cd server && pnpm test -- --run
cd web && pnpm test -- --run
```

**Step 5: Fix any issues found, then commit**

```bash
git add -A
git commit -m "chore: fix formatting and lint issues"
```

---

## Task 10: Push and verify CI

**Step 1: Push**

```bash
git push
```

**Step 2: Monitor CI**

Use `/babysit` to monitor the PR and fix any CI failures.

---

## Verification Checklist

After implementation, verify:

1. A new space member gets `showInTimeline: true` by default
2. The `PATCH /shared-spaces/:id/members/me/timeline` endpoint toggles `showInTimeline`
3. The main photos timeline shows space assets when `showInTimeline` is true
4. Space assets disappear from the timeline when `showInTimeline` is toggled to false
5. The members modal shows a switch on the current user's row
6. The switch toggles timeline visibility via the API
7. `withSharedSpaces` throws when combined with archive/favorites/trash
8. All existing timeline tests still pass
