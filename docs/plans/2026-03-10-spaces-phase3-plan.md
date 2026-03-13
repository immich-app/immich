# Spaces Phase 3: Activity Feed & New-Since-Last-Visit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a unified side panel (activity feed + members tabs) and a "new since last visit" timeline marker to the shared spaces web UI.

**Architecture:** New `shared_space_activity` table logs all space events. Existing service methods get inline activity logging. A new `GET /shared-spaces/:id/activities` endpoint serves the paginated feed. The existing `SpaceMembersPanel` is replaced by a tabbed `SpacePanel` with Activity (default) and Members tabs. The timeline gets a divider + background tint for new-since-last-visit assets.

**Tech Stack:** NestJS 11 + Kysely (server), SvelteKit + Svelte 5 runes + Tailwind CSS 4 (web), Vitest + @testing-library/svelte (tests), OpenAPI codegen.

**Methodology:** Strict TDD throughout — write failing test first, implement minimum code, verify green, refactor, commit.

---

## Task 1: Schema — `shared_space_activity` table definition

**Files:**

- Create: `server/src/schema/tables/shared-space-activity.table.ts`
- Modify: `server/src/schema/index.ts` (register table)

**Step 1: Create the table definition**

```typescript
// server/src/schema/tables/shared-space-activity.table.ts
import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedUuidV7Column,
  Table,
  Timestamp,
} from '@immich/sql-tools';
import { SharedSpaceTable } from 'src/schema/tables/shared-space.table';
import { UserTable } from 'src/schema/tables/user.table';

@Table('shared_space_activity')
export class SharedSpaceActivityTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @ForeignKeyColumn(() => SharedSpaceTable, { onDelete: 'CASCADE', index: false })
  spaceId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'SET NULL', nullable: true })
  userId!: string | null;

  @Column({ type: 'character varying', length: 30 })
  type!: string;

  @Column({ type: 'jsonb', default: "'{}'" })
  data!: Generated<Record<string, unknown>>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
```

**Step 2: Register in schema index**

In `server/src/schema/index.ts`, add the import and register the table alongside the other shared-space tables:

```typescript
import { SharedSpaceActivityTable } from 'src/schema/tables/shared-space-activity.table';
```

Add `SharedSpaceActivityTable` to the table array and add `shared_space_activity: SharedSpaceActivityTable` to the DB interface.

**Step 3: Commit**

```bash
git add server/src/schema/tables/shared-space-activity.table.ts server/src/schema/index.ts
git commit -m "feat: add shared_space_activity table definition"
```

---

## Task 2: Database migration

**Files:**

- Create: `server/src/schema/migrations/1772810000000-AddSharedSpaceActivityTable.ts`

**Step 1: Write the migration**

```typescript
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('shared_space_activity')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('spaceId', 'uuid', (col) => col.notNull().references('shared_space.id').onDelete('cascade'))
    .addColumn('userId', 'uuid', (col) => col.references('users.id').onDelete('set null'))
    .addColumn('type', 'varchar(30)', (col) => col.notNull())
    .addColumn('data', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('shared_space_activity_spaceId_createdAt_idx')
    .on('shared_space_activity')
    .columns(['spaceId', 'createdAt'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('shared_space_activity_spaceId_createdAt_idx').execute();
  await db.schema.dropTable('shared_space_activity').execute();
}
```

**Step 2: Commit**

```bash
git add server/src/schema/migrations/1772810000000-AddSharedSpaceActivityTable.ts
git commit -m "feat: add migration for shared_space_activity table"
```

---

## Task 3: Database types

**Files:**

- Modify: `server/src/database.ts`
- Modify: `server/src/enum.ts`

**Step 1: Add the enum for activity types**

In `server/src/enum.ts`, after `SharedSpaceRole`:

```typescript
export enum SharedSpaceActivityType {
  AssetAdd = 'asset_add',
  AssetRemove = 'asset_remove',
  MemberJoin = 'member_join',
  MemberLeave = 'member_leave',
  MemberRemove = 'member_remove',
  MemberRoleChange = 'member_role_change',
  CoverChange = 'cover_change',
  SpaceRename = 'space_rename',
  SpaceColorChange = 'space_color_change',
}
```

**Step 2: Add the type to `database.ts`**

After the `SharedSpaceAsset` type:

```typescript
export type SharedSpaceActivity = {
  id: string;
  spaceId: string;
  userId: string | null;
  type: string;
  data: Record<string, unknown>;
  createdAt: Date;
};
```

**Step 3: Commit**

```bash
git add server/src/database.ts server/src/enum.ts
git commit -m "feat: add SharedSpaceActivityType enum and database type"
```

---

## Task 4: DTOs for activity

**Files:**

- Modify: `server/src/dtos/shared-space.dto.ts`

**Step 1: Add activity response DTO and query DTO**

```typescript
export class SharedSpaceActivityQueryDto {
  @ApiPropertyOptional({ description: 'Number of items to return', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Number of items to skip', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export class SharedSpaceActivityResponseDto {
  @ApiProperty({ description: 'Activity ID' })
  id!: string;

  @ApiProperty({ description: 'Activity type' })
  type!: string;

  @ApiProperty({ description: 'Event-specific data' })
  data!: Record<string, unknown>;

  @ApiProperty({ description: 'When the event occurred' })
  createdAt!: string;

  @ApiPropertyOptional({ description: 'User ID who performed the action' })
  userId?: string | null;

  @ApiPropertyOptional({ description: 'User name' })
  userName?: string | null;

  @ApiPropertyOptional({ description: 'User email' })
  userEmail?: string | null;

  @ApiPropertyOptional({ description: 'User profile image path' })
  userProfileImagePath?: string | null;

  @ApiPropertyOptional({ description: 'User avatar color' })
  userAvatarColor?: string | null;
}
```

Add necessary imports: `Type` from `class-transformer`, `IsInt`, `Min`, `Max` from `class-validator`.

**Step 2: Add `lastViewedAt` to `SharedSpaceResponseDto`**

Add this field to the existing DTO:

```typescript
  @ApiPropertyOptional({ description: 'When the current user last viewed this space' })
  lastViewedAt?: string | null;
```

**Step 3: Commit**

```bash
git add server/src/dtos/shared-space.dto.ts
git commit -m "feat: add activity DTOs and lastViewedAt to space response"
```

---

## Task 5: Repository — `logActivity` and `getActivities`

**Files:**

- Modify: `server/src/repositories/shared-space.repository.ts`

**Step 1: Write failing test for `logActivity`**

In `server/src/services/shared-space.service.spec.ts`, add a new describe block. But first we need the repository method. Since repository methods are auto-mocked in tests, we only need to verify the service calls them. The repository itself is tested via medium tests. Add the methods directly.

**Step 2: Add `logActivity` method**

```typescript
async logActivity(values: { spaceId: string; userId: string; type: string; data?: Record<string, unknown> }) {
  await this.db
    .insertInto('shared_space_activity')
    .values({
      spaceId: values.spaceId,
      userId: values.userId,
      type: values.type,
      data: JSON.stringify(values.data ?? {}),
    })
    .execute();
}
```

**Step 3: Add `getActivities` method**

```typescript
@GenerateSql({ params: [DummyValue.UUID, 50, 0] })
getActivities(spaceId: string, limit: number = 50, offset: number = 0) {
  return this.db
    .selectFrom('shared_space_activity')
    .leftJoin('users', 'users.id', 'shared_space_activity.userId')
    .select([
      'shared_space_activity.id',
      'shared_space_activity.type',
      'shared_space_activity.data',
      'shared_space_activity.createdAt',
      'shared_space_activity.userId',
      'users.name',
      'users.email',
      'users.profileImagePath',
      'users.avatarColor',
    ])
    .where('shared_space_activity.spaceId', '=', spaceId)
    .orderBy('shared_space_activity.createdAt', 'desc')
    .limit(limit)
    .offset(offset)
    .execute();
}
```

Add the import for `SharedSpaceActivityTable` at the top of the file.

**Step 4: Commit**

```bash
git add server/src/repositories/shared-space.repository.ts
git commit -m "feat: add logActivity and getActivities repository methods"
```

---

## Task 6: Test factory for activity

**Files:**

- Modify: `server/test/small.factory.ts`

**Step 1: Add activity factory**

After `sharedSpaceMemberFactory`:

```typescript
const sharedSpaceActivityFactory = (data: Partial<SharedSpaceActivity> = {}): SharedSpaceActivity => ({
  id: newUuid(),
  spaceId: newUuid(),
  userId: newUuid(),
  type: 'asset_add',
  data: {},
  createdAt: newDate(),
  ...data,
});
```

Export it in the factory object as `sharedSpaceActivity`.

Import `SharedSpaceActivity` from `src/database`.

**Step 2: Commit**

```bash
git add server/test/small.factory.ts
git commit -m "feat: add sharedSpaceActivity test factory"
```

---

## Task 7: Service tests — activity logging in `addAssets`

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write failing tests**

Add a new test in the `addAssets` describe block:

```typescript
it('should log activity when adding assets', async () => {
  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
  mocks.sharedSpace.addAssets.mockResolvedValue(void 0);
  mocks.sharedSpace.update.mockResolvedValue(factory.sharedSpace());
  mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

  await sut.addAssets(factory.auth(), 'space-1', { assetIds: ['a1', 'a2', 'a3'] });

  expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
    spaceId: 'space-1',
    userId: expect.any(String),
    type: SharedSpaceActivityType.AssetAdd,
    data: { count: 3, assetIds: ['a1', 'a2', 'a3'] },
  });
});
```

Import `SharedSpaceActivityType` from `src/enum`.

**Step 2: Run test to verify it fails**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: FAIL — `logActivity` not called.

**Step 3: Implement in service**

In `addAssets()`, after `this.sharedSpaceRepository.update(...)`:

```typescript
await this.sharedSpaceRepository.logActivity({
  spaceId,
  userId: auth.user.id,
  type: SharedSpaceActivityType.AssetAdd,
  data: { count: dto.assetIds.length, assetIds: dto.assetIds.slice(0, 4) },
});
```

Import `SharedSpaceActivityType` from `src/enum`.

**Step 4: Run test to verify it passes**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

**Step 5: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat: log activity on addAssets"
```

---

## Task 8: Service tests — activity logging in `removeAssets`

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts`
- Modify: `server/src/services/shared-space.service.ts`

**Step 1: Write failing test**

```typescript
it('should log activity when removing assets', async () => {
  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace());
  mocks.sharedSpace.removeAssets.mockResolvedValue(void 0);
  mocks.sharedSpace.getLastAssetAddedAt.mockResolvedValue(void 0);
  mocks.sharedSpace.update.mockResolvedValue(factory.sharedSpace());
  mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

  await sut.removeAssets(factory.auth(), 'space-1', { assetIds: ['a1', 'a2'] });

  expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
    spaceId: 'space-1',
    userId: expect.any(String),
    type: SharedSpaceActivityType.AssetRemove,
    data: { count: 2 },
  });
});
```

**Step 2: Run test — verify FAIL**

**Step 3: Implement in `removeAssets()`**

After `this.sharedSpaceRepository.update(spaceId, updateData)`:

```typescript
await this.sharedSpaceRepository.logActivity({
  spaceId,
  userId: auth.user.id,
  type: SharedSpaceActivityType.AssetRemove,
  data: { count: dto.assetIds.length },
});
```

**Step 4: Run test — verify PASS**

**Step 5: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat: log activity on removeAssets"
```

---

## Task 9: Service tests — activity logging in `addMember`

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts`
- Modify: `server/src/services/shared-space.service.ts`

**Step 1: Write failing test**

```typescript
it('should log activity when adding a member', async () => {
  const auth = factory.auth();
  mocks.sharedSpace.getMember.mockResolvedValueOnce(makeMemberResult({ role: SharedSpaceRole.Owner }));
  mocks.sharedSpace.getMember.mockResolvedValueOnce(null); // not existing
  mocks.sharedSpace.addMember.mockResolvedValue(void 0);
  mocks.sharedSpace.getMember.mockResolvedValueOnce(
    makeMemberResult({ userId: 'new-user', role: SharedSpaceRole.Editor }),
  );
  mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

  await sut.addMember(auth, 'space-1', { userId: 'new-user', role: SharedSpaceRole.Editor });

  expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
    spaceId: 'space-1',
    userId: 'new-user',
    type: SharedSpaceActivityType.MemberJoin,
    data: { role: SharedSpaceRole.Editor, invitedById: auth.user.id },
  });
});
```

**Step 2: Run test — verify FAIL**

**Step 3: Implement in `addMember()`**

After `return this.mapMember(member)`, but before the return, add:

```typescript
await this.sharedSpaceRepository.logActivity({
  spaceId,
  userId: dto.userId,
  type: SharedSpaceActivityType.MemberJoin,
  data: { role, invitedById: auth.user.id },
});
```

**Step 4: Run test — verify PASS**

**Step 5: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat: log activity on addMember"
```

---

## Task 10: Service tests — activity logging in `removeMember` (self-leave and owner-remove)

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts`
- Modify: `server/src/services/shared-space.service.ts`

**Step 1: Write failing tests**

```typescript
it('should log member_leave when member leaves', async () => {
  const auth = factory.auth({ id: 'user-1' });
  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ userId: 'user-1', role: SharedSpaceRole.Editor }));
  mocks.sharedSpace.removeMember.mockResolvedValue(void 0);
  mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

  await sut.removeMember(auth, 'space-1', 'user-1');

  expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
    spaceId: 'space-1',
    userId: 'user-1',
    type: SharedSpaceActivityType.MemberLeave,
    data: {},
  });
});

it('should log member_remove when owner removes a member', async () => {
  const auth = factory.auth({ id: 'owner-1' });
  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ userId: 'owner-1', role: SharedSpaceRole.Owner }));
  mocks.sharedSpace.removeMember.mockResolvedValue(void 0);
  mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

  await sut.removeMember(auth, 'space-1', 'other-user');

  expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
    spaceId: 'space-1',
    userId: auth.user.id,
    type: SharedSpaceActivityType.MemberRemove,
    data: { removedUserId: 'other-user' },
  });
});
```

**Step 2: Run test — verify FAIL**

**Step 3: Implement in `removeMember()`**

For the self-leave case, after `this.sharedSpaceRepository.removeMember(spaceId, userId)`:

```typescript
await this.sharedSpaceRepository.logActivity({
  spaceId,
  userId,
  type: SharedSpaceActivityType.MemberLeave,
  data: {},
});
```

For the owner-remove case, after the second `this.sharedSpaceRepository.removeMember(spaceId, userId)`:

```typescript
await this.sharedSpaceRepository.logActivity({
  spaceId,
  userId: auth.user.id,
  type: SharedSpaceActivityType.MemberRemove,
  data: { removedUserId: userId },
});
```

**Step 4: Run test — verify PASS**

**Step 5: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat: log activity on removeMember (leave and remove)"
```

---

## Task 11: Service tests — activity logging in `updateMember` (role change)

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts`
- Modify: `server/src/services/shared-space.service.ts`

**Step 1: Write failing test**

```typescript
it('should log activity when changing a member role', async () => {
  const auth = factory.auth({ id: 'owner-1' });
  const targetMember = makeMemberResult({ userId: 'target-user', role: SharedSpaceRole.Viewer });
  mocks.sharedSpace.getMember.mockResolvedValueOnce(
    makeMemberResult({ userId: 'owner-1', role: SharedSpaceRole.Owner }),
  );
  mocks.sharedSpace.updateMember.mockResolvedValue(void 0);
  mocks.sharedSpace.getMember.mockResolvedValueOnce(
    makeMemberResult({ userId: 'target-user', role: SharedSpaceRole.Editor }),
  );
  mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

  // Need to get old role before update — read current member first
  // The implementation should fetch the old role before updating
  await sut.updateMember(auth, 'space-1', 'target-user', { role: SharedSpaceRole.Editor });

  expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
    spaceId: 'space-1',
    userId: auth.user.id,
    type: SharedSpaceActivityType.MemberRoleChange,
    data: { targetUserId: 'target-user', newRole: SharedSpaceRole.Editor },
  });
});
```

**Step 2: Run test — verify FAIL**

**Step 3: Implement in `updateMember()`**

After the existing `return this.mapMember(member)`, but before the return:

```typescript
await this.sharedSpaceRepository.logActivity({
  spaceId,
  userId: auth.user.id,
  type: SharedSpaceActivityType.MemberRoleChange,
  data: { targetUserId: userId, newRole: dto.role },
});
```

**Step 4: Run test — verify PASS**

**Step 5: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat: log activity on updateMember role change"
```

---

## Task 12: Service tests — activity logging in `update()` (rename, color, cover)

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts`
- Modify: `server/src/services/shared-space.service.ts`

**Step 1: Write failing tests**

```typescript
it('should log space_rename when name changes', async () => {
  const space = factory.sharedSpace({ name: 'Old Name' });
  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Owner }));
  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.update.mockResolvedValue({ ...space, name: 'New Name' });
  mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

  await sut.update(factory.auth(), space.id, { name: 'New Name' });

  expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
    spaceId: space.id,
    userId: expect.any(String),
    type: SharedSpaceActivityType.SpaceRename,
    data: { oldName: 'Old Name', newName: 'New Name' },
  });
});

it('should log space_color_change when color changes', async () => {
  const space = factory.sharedSpace({ color: 'primary' });
  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Owner }));
  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.update.mockResolvedValue({ ...space, color: 'blue' });
  mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

  await sut.update(factory.auth(), space.id, { color: UserAvatarColor.Blue });

  expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
    spaceId: space.id,
    userId: expect.any(String),
    type: SharedSpaceActivityType.SpaceColorChange,
    data: { oldColor: 'primary', newColor: UserAvatarColor.Blue },
  });
});

it('should log cover_change when thumbnailAssetId changes', async () => {
  const space = factory.sharedSpace({ thumbnailAssetId: null });
  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.update.mockResolvedValue({ ...space, thumbnailAssetId: 'asset-1' });
  mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

  await sut.update(factory.auth(), space.id, { thumbnailAssetId: 'asset-1' });

  expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
    spaceId: space.id,
    userId: expect.any(String),
    type: SharedSpaceActivityType.CoverChange,
    data: { assetId: 'asset-1' },
  });
});

it('should not log activity when update has no meaningful changes', async () => {
  const space = factory.sharedSpace({ description: null });
  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Owner }));
  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.update.mockResolvedValue(space);
  mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

  await sut.update(factory.auth(), space.id, { description: 'New desc' });

  expect(mocks.sharedSpace.logActivity).not.toHaveBeenCalled();
});
```

**Step 2: Run test — verify FAIL**

**Step 3: Implement in `update()`**

The `update()` method needs to fetch the current space before updating to detect changes. Modify it:

```typescript
async update(auth: AuthDto, id: string, dto: SharedSpaceUpdateDto): Promise<SharedSpaceResponseDto> {
  const isMetadataUpdate = dto.name !== undefined || dto.description !== undefined || dto.color !== undefined;
  const minimumRole = isMetadataUpdate ? SharedSpaceRole.Owner : SharedSpaceRole.Editor;
  await this.requireRole(auth, id, minimumRole);

  const existing = await this.sharedSpaceRepository.getById(id);
  const space = await this.sharedSpaceRepository.update(id, {
    name: dto.name,
    description: dto.description,
    thumbnailAssetId: dto.thumbnailAssetId,
    color: dto.color,
  });

  // Log activity for meaningful changes
  if (existing) {
    if (dto.name !== undefined && dto.name !== existing.name) {
      await this.sharedSpaceRepository.logActivity({
        spaceId: id,
        userId: auth.user.id,
        type: SharedSpaceActivityType.SpaceRename,
        data: { oldName: existing.name, newName: dto.name },
      });
    }
    if (dto.color !== undefined && dto.color !== existing.color) {
      await this.sharedSpaceRepository.logActivity({
        spaceId: id,
        userId: auth.user.id,
        type: SharedSpaceActivityType.SpaceColorChange,
        data: { oldColor: existing.color, newColor: dto.color },
      });
    }
    if (dto.thumbnailAssetId !== undefined && dto.thumbnailAssetId !== existing.thumbnailAssetId) {
      await this.sharedSpaceRepository.logActivity({
        spaceId: id,
        userId: auth.user.id,
        type: SharedSpaceActivityType.CoverChange,
        data: { assetId: dto.thumbnailAssetId },
      });
    }
  }

  return this.mapSpace(space);
}
```

**Step 4: Run test — verify PASS**

**Step 5: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat: log activity on space update (rename, color, cover)"
```

---

## Task 13: Service — `getActivities` method with tests

**Files:**

- Modify: `server/src/services/shared-space.service.ts`
- Modify: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write failing tests**

```typescript
describe('getActivities', () => {
  it('should require membership', async () => {
    mocks.sharedSpace.getMember.mockResolvedValue(null);
    await expect(sut.getActivities(factory.auth(), 'space-1', {})).rejects.toThrow('Not a member');
  });

  it('should return mapped activities', async () => {
    mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult());
    mocks.sharedSpace.getActivities.mockResolvedValue([
      {
        id: 'act-1',
        type: 'asset_add',
        data: { count: 5 },
        createdAt: new Date('2026-03-10T12:00:00Z'),
        userId: 'user-1',
        name: 'Pierre',
        email: 'pierre@test.com',
        profileImagePath: '/path/to/img',
        avatarColor: 'primary',
      },
    ]);

    const result = await sut.getActivities(factory.auth(), 'space-1', {});

    expect(result).toEqual([
      {
        id: 'act-1',
        type: 'asset_add',
        data: { count: 5 },
        createdAt: '2026-03-10T12:00:00.000Z',
        userId: 'user-1',
        userName: 'Pierre',
        userEmail: 'pierre@test.com',
        userProfileImagePath: '/path/to/img',
        userAvatarColor: 'primary',
      },
    ]);
  });

  it('should pass limit and offset to repository', async () => {
    mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult());
    mocks.sharedSpace.getActivities.mockResolvedValue([]);

    await sut.getActivities(factory.auth(), 'space-1', { limit: 10, offset: 20 });

    expect(mocks.sharedSpace.getActivities).toHaveBeenCalledWith('space-1', 10, 20);
  });
});
```

**Step 2: Run test — verify FAIL**

**Step 3: Implement `getActivities` in service**

```typescript
async getActivities(
  auth: AuthDto,
  spaceId: string,
  query: { limit?: number; offset?: number },
): Promise<SharedSpaceActivityResponseDto[]> {
  await this.requireMembership(auth, spaceId);

  const activities = await this.sharedSpaceRepository.getActivities(
    spaceId,
    query.limit ?? 50,
    query.offset ?? 0,
  );

  return activities.map((a) => ({
    id: a.id,
    type: a.type,
    data: a.data as Record<string, unknown>,
    createdAt: (a.createdAt as unknown as Date).toISOString(),
    userId: a.userId,
    userName: a.name,
    userEmail: a.email,
    userProfileImagePath: a.profileImagePath,
    userAvatarColor: a.avatarColor,
  }));
}
```

Import `SharedSpaceActivityResponseDto` in the service imports.

**Step 4: Run test — verify PASS**

**Step 5: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat: add getActivities service method with tests"
```

---

## Task 14: Service — add `lastViewedAt` to space response

**Files:**

- Modify: `server/src/services/shared-space.service.ts`
- Modify: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write failing test**

```typescript
it('should include lastViewedAt in get response', async () => {
  const space = factory.sharedSpace();
  const viewedAt = new Date('2026-03-09T10:00:00Z');
  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ lastViewedAt: viewedAt }));
  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.getMembers.mockResolvedValue([]);
  mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
  mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);

  const result = await sut.get(factory.auth(), space.id);

  expect(result.lastViewedAt).toBe('2026-03-09T10:00:00.000Z');
});
```

**Step 2: Run test — verify FAIL**

**Step 3: Implement in `get()`**

In the `get()` method, the `requireMembership` call already returns the member. Use it:

```typescript
async get(auth: AuthDto, id: string): Promise<SharedSpaceResponseDto> {
  const membership = await this.requireMembership(auth, id);
  // ... existing code ...
  return {
    ...this.mapSpace(space),
    thumbnailAssetId,
    memberCount: members.length,
    assetCount,
    // ... existing fields ...
    lastViewedAt: membership.lastViewedAt ? membership.lastViewedAt.toISOString() : null,
  };
}
```

**Step 4: Run test — verify PASS**

**Step 5: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat: include lastViewedAt in space response"
```

---

## Task 15: Controller — `GET /shared-spaces/:id/activities`

**Files:**

- Modify: `server/src/controllers/shared-space.controller.ts`

**Step 1: Add the endpoint**

```typescript
@Get(':id/activities')
@Authenticated({ permission: Permission.SharedSpaceRead })
@Endpoint({ operationId: 'getSpaceActivities', summary: 'Get space activity feed' })
getSpaceActivities(
  @Auth() auth: AuthDto,
  @Param() { id }: UUIDParamDto,
  @Query() query: SharedSpaceActivityQueryDto,
): Promise<SharedSpaceActivityResponseDto[]> {
  return this.service.getActivities(auth, id, query);
}
```

Add `Query` to the NestJS imports. Add `SharedSpaceActivityQueryDto` and `SharedSpaceActivityResponseDto` to the DTO imports.

**Step 2: Commit**

```bash
git add server/src/controllers/shared-space.controller.ts
git commit -m "feat: add GET /shared-spaces/:id/activities endpoint"
```

---

## Task 16: OpenAPI regeneration

**Step 1: Build server and regenerate**

```bash
cd server && pnpm build
cd server && pnpm sync:open-api
make open-api
```

**Step 2: Verify generated TypeScript SDK includes new types**

Check that `open-api/typescript-sdk/` contains `getSpaceActivities`, `SharedSpaceActivityResponseDto`, and `SharedSpaceActivityQueryDto`.

**Step 3: Delete any `.rej` files**

```bash
find open-api/ -name "*.rej" -delete
```

**Step 4: Commit**

```bash
git add open-api/ server/src/queries/
git commit -m "chore: regenerate OpenAPI clients and SQL docs"
```

---

## Task 17: Web — `space-activity-feed.svelte` component (tests first)

**Files:**

- Create: `web/src/lib/components/spaces/space-activity-feed.spec.ts`
- Create: `web/src/lib/components/spaces/space-activity-feed.svelte`

**Step 1: Write failing tests**

```typescript
// web/src/lib/components/spaces/space-activity-feed.spec.ts
import TestWrapper from '$lib/components/TestWrapper.svelte';
import SpaceActivityFeed from '$lib/components/spaces/space-activity-feed.svelte';
import { render, screen } from '@testing-library/svelte';
import type { Component } from 'svelte';

function renderFeed(props: Record<string, unknown>) {
  return render(TestWrapper as Component<{ component: typeof SpaceActivityFeed; componentProps: typeof props }>, {
    component: SpaceActivityFeed,
    componentProps: props,
  });
}

const makeActivity = (overrides: Record<string, unknown> = {}) => ({
  id: 'act-1',
  type: 'asset_add',
  data: { count: 5, assetIds: ['a1', 'a2'] },
  createdAt: new Date().toISOString(),
  userId: 'u1',
  userName: 'Pierre',
  userEmail: 'pierre@test.com',
  userProfileImagePath: null,
  userAvatarColor: 'primary',
  ...overrides,
});

describe('SpaceActivityFeed', () => {
  it('should show empty state when no activities', () => {
    renderFeed({ activities: [], spaceColor: 'primary', onLoadMore: vi.fn(), hasMore: false });
    expect(screen.getByTestId('activity-empty-state')).toBeInTheDocument();
  });

  it('should render asset_add event with thumbnail strip', () => {
    const activities = [makeActivity({ type: 'asset_add', data: { count: 5, assetIds: ['a1', 'a2'] } })];
    renderFeed({ activities, spaceColor: 'primary', onLoadMore: vi.fn(), hasMore: false });
    expect(screen.getByTestId('activity-item-act-1')).toBeInTheDocument();
    expect(screen.getByTestId('activity-item-act-1')).toHaveTextContent('Pierre');
    expect(screen.getByTestId('activity-item-act-1')).toHaveTextContent('5');
  });

  it('should render member_join event with medium styling', () => {
    const activities = [makeActivity({ id: 'act-2', type: 'member_join', data: { role: 'editor' } })];
    renderFeed({ activities, spaceColor: 'primary', onLoadMore: vi.fn(), hasMore: false });
    expect(screen.getByTestId('activity-item-act-2')).toBeInTheDocument();
  });

  it('should render space_rename event with compact styling', () => {
    const activities = [makeActivity({ id: 'act-3', type: 'space_rename', data: { oldName: 'Old', newName: 'New' } })];
    renderFeed({ activities, spaceColor: 'primary', onLoadMore: vi.fn(), hasMore: false });
    expect(screen.getByTestId('activity-item-act-3')).toBeInTheDocument();
  });

  it('should show day headers', () => {
    const today = new Date().toISOString();
    const activities = [makeActivity({ createdAt: today })];
    renderFeed({ activities, spaceColor: 'primary', onLoadMore: vi.fn(), hasMore: false });
    expect(screen.getByTestId('day-header-0')).toBeInTheDocument();
  });

  it('should show load more button when hasMore is true', () => {
    renderFeed({ activities: [makeActivity()], spaceColor: 'primary', onLoadMore: vi.fn(), hasMore: true });
    expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
  });

  it('should NOT show load more button when hasMore is false', () => {
    renderFeed({ activities: [makeActivity()], spaceColor: 'primary', onLoadMore: vi.fn(), hasMore: false });
    expect(screen.queryByTestId('load-more-button')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test — verify FAIL** (component doesn't exist)

```bash
cd web && pnpm test -- --run src/lib/components/spaces/space-activity-feed.spec.ts
```

**Step 3: Implement the component**

Create `web/src/lib/components/spaces/space-activity-feed.svelte`. The component receives `activities`, `spaceColor`, `onLoadMore`, `hasMore` props. It groups activities by day, renders three visual tiers (high/medium/low impact), shows thumbnail strips for asset_add events, and includes a load more button.

Key implementation details:

- Group by day using `toLocaleDateString()`, display as "Today", "Yesterday", or date string
- High-impact events (`asset_add`, `asset_remove`): full card with avatar + optional thumbnail strip (32x32 rounded-md images)
- Medium events (`member_join`, `member_leave`, `member_remove`, `member_role_change`): row with avatar and 2px left border accent
- Low-impact events (`cover_change`, `space_rename`, `space_color_change`): compact single line with dot
- Stagger animation: `animation-delay` of `30ms * index` on items (max 8)
- `data-testid` attributes for all testable elements

**Step 4: Run test — verify PASS**

**Step 5: Commit**

```bash
git add web/src/lib/components/spaces/space-activity-feed.svelte web/src/lib/components/spaces/space-activity-feed.spec.ts
git commit -m "feat: add SpaceActivityFeed component with tests"
```

---

## Task 18: Web — unified `space-panel.svelte` component (tests first)

**Files:**

- Create: `web/src/lib/components/spaces/space-panel.spec.ts`
- Create: `web/src/lib/components/spaces/space-panel.svelte`

**Step 1: Write failing tests**

```typescript
// web/src/lib/components/spaces/space-panel.spec.ts
import TestWrapper from '$lib/components/TestWrapper.svelte';
import SpacePanel from '$lib/components/spaces/space-panel.svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import type { Component } from 'svelte';

function renderPanel(props: Record<string, unknown>) {
  return render(TestWrapper as Component<{ component: typeof SpacePanel; componentProps: typeof props }>, {
    component: SpacePanel,
    componentProps: props,
  });
}

// Reuse makeSpace and makeMember from space-members-panel.spec.ts pattern

describe('SpacePanel', () => {
  const defaultProps = {
    space: makeSpace(),
    members: [makeMember({ userId: 'u1', name: 'Alice', role: 'owner' })],
    activities: [],
    currentUserId: 'u1',
    isOwner: true,
    open: true,
    onClose: vi.fn(),
    onMembersChanged: vi.fn(),
    onLoadMoreActivities: vi.fn(),
    hasMoreActivities: false,
  };

  it('should show Activity tab as active by default', () => {
    renderPanel(defaultProps);
    const activityTab = screen.getByTestId('tab-activity');
    expect(activityTab.className).toContain('bg-');
  });

  it('should switch to Members tab on click', async () => {
    renderPanel(defaultProps);
    const membersTab = screen.getByTestId('tab-members');
    await fireEvent.click(membersTab);
    expect(screen.getByTestId('member-list')).toBeInTheDocument();
  });

  it('should show segmented control with space color', () => {
    renderPanel(defaultProps);
    expect(screen.getByTestId('tab-switcher')).toBeInTheDocument();
  });

  it('should have translate-x-full when closed', () => {
    renderPanel({ ...defaultProps, open: false });
    const panel = screen.getByTestId('space-panel');
    expect(panel.className).toContain('translate-x-full');
  });

  it('should call onClose on Escape', async () => {
    const onClose = vi.fn();
    renderPanel({ ...defaultProps, onClose });
    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('should show backdrop with blur on mobile when open', () => {
    renderPanel(defaultProps);
    const backdrop = screen.getByTestId('panel-backdrop');
    expect(backdrop.className).toContain('backdrop-blur');
  });
});
```

**Step 2: Run test — verify FAIL**

**Step 3: Implement the component**

Create `web/src/lib/components/spaces/space-panel.svelte`. This replaces `space-members-panel.svelte`. Key structure:

- Segmented control header: two buttons (Activity / Members), active one gets space color background
- `$state` for `activeTab: 'activity' | 'members'` (default: `'activity'`)
- Activity tab renders `SpaceActivityFeed`
- Members tab renders the existing member list (extracted from `space-members-panel.svelte`)
- Same slide-out behavior: `translate-x-full` / `translate-x-0`, Escape to close, backdrop on mobile
- Backdrop uses `bg-black/20 backdrop-blur-[2px]`

**Step 4: Run test — verify PASS**

**Step 5: Commit**

```bash
git add web/src/lib/components/spaces/space-panel.svelte web/src/lib/components/spaces/space-panel.spec.ts
git commit -m "feat: add unified SpacePanel component with tabs"
```

---

## Task 19: Web — `space-new-assets-divider.svelte` (tests first)

**Files:**

- Create: `web/src/lib/components/spaces/space-new-assets-divider.spec.ts`
- Create: `web/src/lib/components/spaces/space-new-assets-divider.svelte`

**Step 1: Write failing tests**

```typescript
// web/src/lib/components/spaces/space-new-assets-divider.spec.ts
import TestWrapper from '$lib/components/TestWrapper.svelte';
import SpaceNewAssetsDivider from '$lib/components/spaces/space-new-assets-divider.svelte';
import { render, screen } from '@testing-library/svelte';
import type { Component } from 'svelte';

function renderDivider(props: Record<string, unknown>) {
  return render(TestWrapper as Component<{ component: typeof SpaceNewAssetsDivider; componentProps: typeof props }>, {
    component: SpaceNewAssetsDivider,
    componentProps: props,
  });
}

describe('SpaceNewAssetsDivider', () => {
  it('should render pill with correct count', () => {
    renderDivider({ newAssetCount: 8, lastViewedAt: '2026-03-08T10:00:00Z', spaceColor: 'primary' });
    expect(screen.getByTestId('new-assets-divider')).toHaveTextContent('8 new');
  });

  it('should render formatted date', () => {
    renderDivider({ newAssetCount: 3, lastViewedAt: '2026-03-08T10:00:00Z', spaceColor: 'primary' });
    expect(screen.getByTestId('new-assets-divider')).toHaveTextContent('Mar 8');
  });

  it('should not render when newAssetCount is 0', () => {
    renderDivider({ newAssetCount: 0, lastViewedAt: '2026-03-08T10:00:00Z', spaceColor: 'primary' });
    expect(screen.queryByTestId('new-assets-divider')).not.toBeInTheDocument();
  });

  it('should have sticky positioning', () => {
    renderDivider({ newAssetCount: 5, lastViewedAt: '2026-03-08T10:00:00Z', spaceColor: 'primary' });
    const divider = screen.getByTestId('new-assets-divider');
    expect(divider.className).toContain('sticky');
  });

  it('should use space color for pill background', () => {
    renderDivider({ newAssetCount: 5, lastViewedAt: '2026-03-08T10:00:00Z', spaceColor: 'blue' });
    expect(screen.getByTestId('new-assets-pill')).toBeInTheDocument();
  });
});
```

**Step 2: Run test — verify FAIL**

**Step 3: Implement the component**

Create `web/src/lib/components/spaces/space-new-assets-divider.svelte`:

- Props: `newAssetCount`, `lastViewedAt`, `spaceColor`
- Renders nothing if `newAssetCount === 0`
- Horizontal rule with centered pill: `{count} new · since {formatted date}`
- Pill uses space color background from the `gradientClasses` map (same pattern as `space-card.svelte`)
- `position: sticky; top: 0; z-index: 10`
- Entry animation: `scale-95 → scale-100` with `transition duration-300` after 300ms delay

**Step 4: Run test — verify PASS**

**Step 5: Commit**

```bash
git add web/src/lib/components/spaces/space-new-assets-divider.svelte web/src/lib/components/spaces/space-new-assets-divider.spec.ts
git commit -m "feat: add SpaceNewAssetsDivider component with tests"
```

---

## Task 20: Web — integrate into space detail page

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Replace SpaceMembersPanel with SpacePanel**

1. Replace `import SpaceMembersPanel` with `import SpacePanel`
2. Add activity state: `let activities = $state([])`, `let hasMoreActivities = $state(false)`
3. Add `loadActivities()` function that calls `getSpaceActivities({ id: spaceId })` from `@immich/sdk`
4. Add `loadMoreActivities()` that increments offset and appends
5. Load activities on mount (inside the existing `$effect` or `onMount`)
6. Replace `<SpaceMembersPanel>` with `<SpacePanel>` passing activities, members, and callbacks
7. Rename `membersPanelOpen` to `panelOpen`
8. Add `SpaceNewAssetsDivider` above the timeline when `space.newAssetCount > 0`
9. Add new-asset tint wrapper: a `div` with `bg-{spaceColor}/5 border-l-2 border-{spaceColor}/30` around the timeline section when new assets exist, with a fade-in transition after 300ms

**Step 2: Update i18n keys**

Add to `i18n/en.json`:

- `spaces_activity`: `"Activity"`
- `spaces_load_more`: `"Load more"`
- `spaces_new_photos_since`: `"{count} new · since {date}"`
- `spaces_all_new`: `"All photos are new since your first visit"`
- `spaces_activity_empty`: `"This space just got started"`
- `spaces_activity_empty_description`: `"Add photos and invite members to see activity here."`
- `spaces_added_photos`: `"Added {count} photos"`
- `spaces_removed_photos`: `"Removed {count} photos"`
- `spaces_joined_as`: `"Joined as {role}"`
- `spaces_left_space`: `"Left the space"`
- `spaces_was_removed`: `"Was removed from the space"`
- `spaces_changed_role`: `"Changed {name}'s role to {role}"`
- `spaces_set_cover`: `"Set a new cover photo"`
- `spaces_renamed`: `"Renamed from \"{oldName}\" to \"{newName}\""`
- `spaces_changed_color`: `"Changed space color"`

**Step 3: Run all web tests**

```bash
cd web && pnpm test -- --run
```

**Step 4: Commit**

```bash
git add web/src/routes/ web/src/lib/components/spaces/ i18n/en.json
git commit -m "feat: integrate SpacePanel and new-assets divider into space detail page"
```

---

## Task 21: Remove old `SpaceMembersPanel`

**Files:**

- Delete: `web/src/lib/components/spaces/space-members-panel.svelte`
- Delete: `web/src/lib/components/spaces/space-members-panel.spec.ts`

Only delete after verifying all references have been updated in Task 20.

**Step 1: Verify no remaining imports**

```bash
cd web && grep -r "space-members-panel\|SpaceMembersPanel" src/
```

Should return nothing.

**Step 2: Delete files and commit**

```bash
git rm web/src/lib/components/spaces/space-members-panel.svelte web/src/lib/components/spaces/space-members-panel.spec.ts
git commit -m "refactor: remove old SpaceMembersPanel (replaced by SpacePanel)"
```

---

## Task 22: Regenerate SQL docs

**Step 1: Run SQL generation**

```bash
cd server && pnpm sync:sql
```

Or if that's not available, update `server/src/queries/shared.space.repository.sql` manually with the new `logActivity` and `getActivities` queries.

**Step 2: Commit**

```bash
git add server/src/queries/
git commit -m "chore: update generated SQL docs"
```

---

## Task 23: Lint, format, typecheck

**Step 1: Run all checks**

```bash
make lint-server && make lint-web
make format-server && make format-web
make check-server && make check-web
pnpm --filter=immich-i18n format:fix
```

**Step 2: Fix any issues found**

**Step 3: Run all tests**

```bash
cd server && pnpm test -- --run
cd web && pnpm test -- --run
```

**Step 4: Commit any fixes**

```bash
git add -A && git commit -m "fix: lint, format, and typecheck fixes"
```

---

## Task 24: E2E tests

**Files:**

- Create: `e2e/src/specs/web/spaces-p3.e2e-spec.ts`

**Step 1: Write E2E tests**

Tests covering:

1. **Activity feed**: Create space → add assets → open panel → verify "Added N photos" event visible
2. **Tab switching**: Open panel → verify Activity tab active → click Members → verify member list visible
3. **New-since-last-visit**: User A adds assets → User B visits space → User A adds more → User B revisits → verify divider with correct count

Use existing E2E helpers: `createSpace`, `addSpaceAssets`, `addSpaceMember` from previous E2E utils.

**Step 2: Run E2E tests locally if possible, or commit for CI**

```bash
cd e2e && pnpm test:web -- --grep "spaces-p3"
```

**Step 3: Commit**

```bash
git add e2e/
git commit -m "test: add E2E tests for activity feed and new-since-last-visit"
```

---

## Summary

| Task | Description                                      | Type    |
| ---- | ------------------------------------------------ | ------- |
| 1    | Schema: `shared_space_activity` table definition | Server  |
| 2    | Database migration                               | Server  |
| 3    | Database types + enum                            | Server  |
| 4    | DTOs for activity                                | Server  |
| 5    | Repository: `logActivity` + `getActivities`      | Server  |
| 6    | Test factory for activity                        | Server  |
| 7-12 | Service: activity logging in all methods (TDD)   | Server  |
| 13   | Service: `getActivities` method (TDD)            | Server  |
| 14   | Service: `lastViewedAt` in response (TDD)        | Server  |
| 15   | Controller: GET endpoint                         | Server  |
| 16   | OpenAPI regeneration                             | Codegen |
| 17   | Web: `SpaceActivityFeed` component (TDD)         | Web     |
| 18   | Web: `SpacePanel` unified component (TDD)        | Web     |
| 19   | Web: `SpaceNewAssetsDivider` component (TDD)     | Web     |
| 20   | Web: integration into detail page + i18n         | Web     |
| 21   | Web: remove old `SpaceMembersPanel`              | Web     |
| 22   | SQL docs regeneration                            | Codegen |
| 23   | Lint, format, typecheck                          | QA      |
| 24   | E2E tests                                        | Test    |
