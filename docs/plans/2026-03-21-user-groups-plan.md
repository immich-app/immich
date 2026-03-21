# User Groups Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **REQUIRED:** Follow strict TDD — RED (failing test) → GREEN (minimal code) → REFACTOR. No production code without a failing test first.

**Goal:** Add personal user groups — named, color-coded user lists that act as a selection shortcut when sharing albums or inviting to Spaces.

**Architecture:** Two new DB tables (`user_group`, `user_group_member`), a new repository/service/controller following the SharedSpace pattern, a settings UI component, and group chips integrated into the existing `AlbumAddUsersModal` and `SpaceAddMemberModal`.

**Tech Stack:** NestJS + Kysely (server), SvelteKit + Svelte 5 runes (web), `@immich/ui` components, Vitest for tests.

**TDD approach:** Infrastructure tasks (schema, migration, enums, registration) come first as scaffolding — they have no behavior to test. Then all service logic follows strict RED-GREEN-REFACTOR. Each test must fail for the right reason before any implementation code is written.

---

### Task 1: Schema table definitions (infrastructure — no tests needed)

**Files:**

- Create: `server/src/schema/tables/user-group.table.ts`
- Create: `server/src/schema/tables/user-group-member.table.ts`

**Step 1: Create user_group table definition**

Create `server/src/schema/tables/user-group.table.ts`:

```typescript
import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger } from 'src/decorators';
import { UserTable } from 'src/schema/tables/user.table';

@Table('user_group')
@UpdatedAtTrigger('user_group_updatedAt')
export class UserGroupTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'character varying', length: 20, nullable: true })
  color!: string | null;

  @Column({ type: 'character varying', length: 20, default: "'manual'" })
  origin!: Generated<string>;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', nullable: false })
  createdById!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;
}
```

**Step 2: Create user_group_member table definition**

Create `server/src/schema/tables/user-group-member.table.ts`:

```typescript
import { CreateDateColumn, ForeignKeyColumn, Generated, Table, Timestamp } from '@immich/sql-tools';
import { UserGroupTable } from 'src/schema/tables/user-group.table';
import { UserTable } from 'src/schema/tables/user.table';

@Table('user_group_member')
export class UserGroupMemberTable {
  @ForeignKeyColumn(() => UserGroupTable, { onDelete: 'CASCADE', primary: true, index: false })
  groupId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', primary: true })
  userId!: string;

  @CreateDateColumn()
  addedAt!: Generated<Timestamp>;
}
```

**Step 3: Commit**

```bash
git add server/src/schema/tables/user-group.table.ts server/src/schema/tables/user-group-member.table.ts
git commit -m "feat(server): add user group schema table definitions"
```

---

### Task 2: Register tables, types, enums, migration (infrastructure — no tests needed)

**Files:**

- Modify: `server/src/schema/index.ts`
- Modify: `server/src/database.ts`
- Modify: `server/src/enum.ts`
- Create: `server/src/schema/migrations/1774300000000-CreateUserGroupTables.ts`

**Step 1: Register tables in schema index**

In `server/src/schema/index.ts`:

- Add imports (alphabetically near SharedSpace imports):

```typescript
import { UserGroupMemberTable } from 'src/schema/tables/user-group-member.table';
import { UserGroupTable } from 'src/schema/tables/user-group.table';
```

- Add to `tables` array (after `SharedSpacePersonAliasTable`):

```typescript
    UserGroupTable,
    UserGroupMemberTable,
```

- Add to `DB` interface (after `shared_space_person_alias`):

```typescript
user_group: UserGroupTable;
user_group_member: UserGroupMemberTable;
```

**Step 2: Add types to database.ts**

In `server/src/database.ts`, add after the `SharedSpacePersonAlias` type:

```typescript
export type UserGroup = {
  id: string;
  name: string;
  color: string | null;
  origin: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UserGroupMember = {
  groupId: string;
  userId: string;
  addedAt: Date;
};
```

**Step 3: Add Permission and ApiTag enums**

In `server/src/enum.ts`, add after `SharedSpaceAssetDelete` (around line 217):

```typescript
  UserGroupCreate = 'userGroup.create',
  UserGroupRead = 'userGroup.read',
  UserGroupUpdate = 'userGroup.update',
  UserGroupDelete = 'userGroup.delete',
```

In the `ApiTag` enum, add alphabetically:

```typescript
  UserGroups = 'User Groups',
```

**Step 4: Create migration**

Create `server/src/schema/migrations/1774300000000-CreateUserGroupTables.ts`:

```typescript
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE "user_group" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "name" text NOT NULL,
      "color" character varying(20),
      "origin" character varying(20) NOT NULL DEFAULT 'manual',
      "createdById" uuid NOT NULL,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT "user_group_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "user_group_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE CASCADE
    );
  `.execute(db);

  await sql`CREATE INDEX "user_group_createdById_idx" ON "user_group" ("createdById")`.execute(db);

  await sql`
    CREATE OR REPLACE TRIGGER "user_group_updatedAt"
      BEFORE UPDATE ON "user_group"
      FOR EACH ROW
      EXECUTE FUNCTION updated_at();
  `.execute(db);

  await sql`
    CREATE TABLE "user_group_member" (
      "groupId" uuid NOT NULL,
      "userId" uuid NOT NULL,
      "addedAt" timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT "user_group_member_pkey" PRIMARY KEY ("groupId", "userId"),
      CONSTRAINT "user_group_member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "user_group" ("id") ON DELETE CASCADE,
      CONSTRAINT "user_group_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE
    );
  `.execute(db);

  await sql`CREATE INDEX "user_group_member_userId_idx" ON "user_group_member" ("userId")`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE IF EXISTS "user_group_member"`.execute(db);
  await sql`DROP TRIGGER IF EXISTS "user_group_updatedAt" ON "user_group"`.execute(db);
  await sql`DROP TABLE IF EXISTS "user_group"`.execute(db);
}
```

**Step 5: Commit**

```bash
git add server/src/schema/index.ts server/src/database.ts server/src/enum.ts server/src/schema/migrations/1774300000000-CreateUserGroupTables.ts
git commit -m "feat(server): register user group tables, types, enums, and migration"
```

---

### Task 3: DTOs and repository (infrastructure — needed before tests can compile)

**Files:**

- Create: `server/src/dtos/user-group.dto.ts`
- Create: `server/src/repositories/user-group.repository.ts`
- Modify: `server/src/repositories/index.ts`
- Modify: `server/src/services/base.service.ts`

**Step 1: Create DTOs**

Create `server/src/dtos/user-group.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { UserAvatarColor } from 'src/enum';
import { ValidateEnum, ValidateUUID } from 'src/validation';

export class UserGroupCreateDto {
  @ApiProperty({ description: 'Group name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ValidateEnum({
    enum: UserAvatarColor,
    name: 'UserAvatarColor',
    description: 'Group color',
    optional: true,
  })
  color?: UserAvatarColor;
}

export class UserGroupUpdateDto {
  @ApiPropertyOptional({ description: 'Group name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ValidateEnum({
    enum: UserAvatarColor,
    name: 'UserAvatarColor',
    description: 'Group color',
    optional: true,
    nullable: true,
  })
  color?: UserAvatarColor | null;
}

export class UserGroupMemberSetDto {
  @ValidateUUID({ each: true, description: 'User IDs' })
  userIds!: string[];
}

export class UserGroupMemberResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'User name' })
  name!: string;

  @ApiProperty({ description: 'User email' })
  email!: string;

  @ApiPropertyOptional({ description: 'Profile image path' })
  profileImagePath?: string;

  @ApiPropertyOptional({ description: 'Avatar color' })
  avatarColor?: string;
}

export class UserGroupResponseDto {
  @ApiProperty({ description: 'Group ID' })
  id!: string;

  @ApiProperty({ description: 'Group name' })
  name!: string;

  @ApiPropertyOptional({ description: 'Group color', enum: UserAvatarColor })
  color?: UserAvatarColor | null;

  @ApiProperty({ description: 'Group origin (manual or oidc)' })
  origin!: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt!: string;

  @ApiProperty({ description: 'Members', type: [UserGroupMemberResponseDto] })
  members!: UserGroupMemberResponseDto[];
}
```

**Step 2: Create repository**

Create `server/src/repositories/user-group.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { UserGroupMemberTable } from 'src/schema/tables/user-group-member.table';
import { UserGroupTable } from 'src/schema/tables/user-group.table';

@Injectable()
export class UserGroupRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getById(id: string) {
    return this.db.selectFrom('user_group').selectAll().where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAllByUserId(userId: string) {
    return this.db
      .selectFrom('user_group')
      .selectAll()
      .where('createdById', '=', userId)
      .orderBy('name', 'asc')
      .execute();
  }

  create(values: Insertable<UserGroupTable>) {
    return this.db.insertInto('user_group').values(values).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, { name: 'Updated Group' }] })
  update(id: string, values: Updateable<UserGroupTable>) {
    return this.db.updateTable('user_group').set(values).where('id', '=', id).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async remove(id: string) {
    await this.db.deleteFrom('user_group').where('id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getMembers(groupId: string) {
    return this.db
      .selectFrom('user_group_member')
      .innerJoin('user', (join) =>
        join.onRef('user.id', '=', 'user_group_member.userId').on('user.deletedAt', 'is', null),
      )
      .where('user_group_member.groupId', '=', groupId)
      .select([
        'user_group_member.groupId',
        'user_group_member.userId',
        'user_group_member.addedAt',
        'user.name',
        'user.email',
        'user.profileImagePath',
        'user.profileChangedAt',
        'user.avatarColor',
      ])
      .execute();
  }

  async setMembers(groupId: string, userIds: string[]) {
    await this.db.deleteFrom('user_group_member').where('groupId', '=', groupId).execute();

    if (userIds.length === 0) {
      return;
    }

    await this.db
      .insertInto('user_group_member')
      .values(userIds.map((userId) => ({ groupId, userId })))
      .execute();
  }
}
```

**Step 3: Register repository**

In `server/src/repositories/index.ts`:

- Add import: `import { UserGroupRepository } from 'src/repositories/user-group.repository';`
- Add to `repositories` array (after `UserRepository`): `UserGroupRepository,`

**Step 4: Register in BaseService**

In `server/src/services/base.service.ts`:

- Add import: `import { UserGroupRepository } from 'src/repositories/user-group.repository';`
- Add `UserGroupRepository` to `BASE_SERVICE_DEPENDENCIES` array (after `UserRepository`)
- Add constructor parameter: `protected userGroupRepository: UserGroupRepository,` (after `protected userRepository: UserRepository,`)

**Step 5: Add test factories**

In `server/test/small.factory.ts`:

- Add `UserGroup, UserGroupMember` to imports from `src/database`
- Add factories:

```typescript
const userGroupFactory = (data: Partial<UserGroup> = {}): UserGroup => ({
  id: newUuid(),
  name: 'Test Group',
  color: null,
  origin: 'manual',
  createdById: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  ...data,
});

const userGroupMemberFactory = (data: Partial<UserGroupMember> = {}): UserGroupMember => ({
  groupId: newUuid(),
  userId: newUuid(),
  addedAt: newDate(),
  ...data,
});
```

- Add to `factory` export: `userGroup: userGroupFactory,` and `userGroupMember: userGroupMemberFactory,`

**Step 6: Commit**

```bash
git add server/src/dtos/user-group.dto.ts server/src/repositories/user-group.repository.ts server/src/repositories/index.ts server/src/services/base.service.ts server/test/small.factory.ts
git commit -m "feat(server): add user group DTOs, repository, and test factories"
```

---

### Task 4: RED — write failing test for `create`

**Files:**

- Create: `server/src/services/user-group.service.spec.ts`
- Create: `server/src/services/user-group.service.ts` (empty stub only — enough for imports to resolve)

**Step 1: Create minimal service stub (just enough for tests to import)**

Create `server/src/services/user-group.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class UserGroupService extends BaseService {}
```

Register it in `server/src/services/index.ts`:

- Add import: `import { UserGroupService } from 'src/services/user-group.service';`
- Add to `services` array (after `UserAdminService`): `UserGroupService,`

**Step 2: Write failing test for create**

Create `server/src/services/user-group.service.spec.ts`:

```typescript
import { UserAvatarColor } from 'src/enum';
import { UserGroupService } from 'src/services/user-group.service';
import { factory, newDate, newUuid } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

const makeGroup = (overrides: Record<string, unknown> = {}) => ({
  id: newUuid(),
  name: 'Family A',
  color: null as string | null,
  origin: 'manual',
  createdById: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  ...overrides,
});

const makeMember = (overrides: Record<string, unknown> = {}) => ({
  groupId: newUuid(),
  userId: newUuid(),
  addedAt: newDate(),
  name: 'Test User',
  email: 'test@example.com',
  profileImagePath: '',
  profileChangedAt: newDate(),
  avatarColor: null,
  ...overrides,
});

describe(UserGroupService.name, () => {
  let sut: UserGroupService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(UserGroupService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should create a group with name and default null color', async () => {
      const auth = factory.auth();
      const group = makeGroup({ createdById: auth.user.id });
      mocks.userGroup.create.mockResolvedValue(group);
      mocks.userGroup.getMembers.mockResolvedValue([]);

      const result = await sut.create(auth, { name: 'Family A' });

      expect(result.id).toBe(group.id);
      expect(result.name).toBe('Family A');
      expect(result.members).toEqual([]);
      expect(mocks.userGroup.create).toHaveBeenCalledWith({
        name: 'Family A',
        color: null,
        createdById: auth.user.id,
      });
    });

    it('should pass color when provided', async () => {
      const auth = factory.auth();
      const group = makeGroup({ createdById: auth.user.id, color: 'blue' });
      mocks.userGroup.create.mockResolvedValue(group);
      mocks.userGroup.getMembers.mockResolvedValue([]);

      await sut.create(auth, { name: 'Family A', color: UserAvatarColor.Blue });

      expect(mocks.userGroup.create).toHaveBeenCalledWith({
        name: 'Family A',
        color: 'blue',
        createdById: auth.user.id,
      });
    });
  });
});
```

**Step 3: Run test — verify RED**

Run: `cd server && pnpm test -- --run src/services/user-group.service.spec.ts`
Expected: FAIL — `sut.create is not a function` (service is empty stub).

**Step 4: Commit the failing test**

```bash
git add server/src/services/user-group.service.ts server/src/services/user-group.service.spec.ts server/src/services/index.ts
git commit -m "test(server): RED — failing test for user group create"
```

---

### Task 5: GREEN — implement `create`

**Files:**

- Modify: `server/src/services/user-group.service.ts`

**Step 1: Write minimal code to make create tests pass**

Replace `server/src/services/user-group.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto';
import { UserGroupCreateDto, UserGroupMemberResponseDto, UserGroupResponseDto } from 'src/dtos/user-group.dto';
import { UserAvatarColor } from 'src/enum';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class UserGroupService extends BaseService {
  async create(auth: AuthDto, dto: UserGroupCreateDto): Promise<UserGroupResponseDto> {
    const group = await this.userGroupRepository.create({
      name: dto.name,
      color: dto.color ?? null,
      createdById: auth.user.id,
    });

    return this.mapGroup(group, []);
  }

  private mapGroup(
    group: { id: string; name: string; color: string | null; origin: string; createdAt: unknown },
    members: Array<{
      userId: string;
      name: string;
      email: string;
      profileImagePath: string;
      avatarColor: string | null;
    }>,
  ): UserGroupResponseDto {
    return {
      id: group.id,
      name: group.name,
      color: (group.color as UserAvatarColor) ?? null,
      origin: group.origin,
      createdAt: group.createdAt as unknown as string,
      members: members.map((m) => this.mapMember(m)),
    };
  }

  private mapMember(member: {
    userId: string;
    name: string;
    email: string;
    profileImagePath: string;
    avatarColor: string | null;
  }): UserGroupMemberResponseDto {
    return {
      userId: member.userId,
      name: member.name,
      email: member.email,
      profileImagePath: member.profileImagePath,
      avatarColor: member.avatarColor ?? undefined,
    };
  }
}
```

**Step 2: Run test — verify GREEN**

Run: `cd server && pnpm test -- --run src/services/user-group.service.spec.ts`
Expected: PASS — both create tests green.

**Step 3: Commit**

```bash
git add server/src/services/user-group.service.ts
git commit -m "feat(server): GREEN — implement user group create"
```

---

### Task 6: RED — failing tests for `getAll` and `get`

**Files:**

- Modify: `server/src/services/user-group.service.spec.ts`

**Step 1: Add tests for getAll and get**

Append inside the `describe(UserGroupService.name)` block:

```typescript
describe('getAll', () => {
  it('should return groups with members for the current user', async () => {
    const auth = factory.auth();
    const group = makeGroup({ createdById: auth.user.id });
    const member = makeMember({ groupId: group.id });

    mocks.userGroup.getAllByUserId.mockResolvedValue([group]);
    mocks.userGroup.getMembers.mockResolvedValue([member]);

    const result = await sut.getAll(auth);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(group.id);
    expect(result[0].members).toHaveLength(1);
    expect(result[0].members[0].userId).toBe(member.userId);
    expect(mocks.userGroup.getAllByUserId).toHaveBeenCalledWith(auth.user.id);
  });

  it('should return empty array when user has no groups', async () => {
    const auth = factory.auth();
    mocks.userGroup.getAllByUserId.mockResolvedValue([]);

    const result = await sut.getAll(auth);
    expect(result).toEqual([]);
  });
});

describe('get', () => {
  it('should return group with members when user is owner', async () => {
    const auth = factory.auth();
    const group = makeGroup({ createdById: auth.user.id });
    mocks.userGroup.getById.mockResolvedValue(group);
    mocks.userGroup.getMembers.mockResolvedValue([]);

    const result = await sut.get(auth, group.id);
    expect(result.id).toBe(group.id);
  });

  it('should throw BadRequestException when group not found', async () => {
    const auth = factory.auth();
    mocks.userGroup.getById.mockResolvedValue(undefined);

    await expect(sut.get(auth, newUuid())).rejects.toThrow('User group not found');
  });

  it('should throw ForbiddenException when user is not the owner', async () => {
    const auth = factory.auth();
    const group = makeGroup({ createdById: newUuid() });
    mocks.userGroup.getById.mockResolvedValue(group);

    await expect(sut.get(auth, group.id)).rejects.toThrow('Not the owner of this group');
  });
});
```

**Step 2: Run test — verify RED**

Run: `cd server && pnpm test -- --run src/services/user-group.service.spec.ts`
Expected: FAIL — `sut.getAll is not a function`, `sut.get is not a function`.

**Step 3: Commit**

```bash
git add server/src/services/user-group.service.spec.ts
git commit -m "test(server): RED — failing tests for getAll and get"
```

---

### Task 7: GREEN — implement `getAll` and `get`

**Files:**

- Modify: `server/src/services/user-group.service.ts`

**Step 1: Add getAll, get, and requireOwnership**

Add these imports at the top:

```typescript
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
```

Add methods to the service class (after `create`, before `mapGroup`):

```typescript
  async getAll(auth: AuthDto): Promise<UserGroupResponseDto[]> {
    const groups = await this.userGroupRepository.getAllByUserId(auth.user.id);

    const results: UserGroupResponseDto[] = [];
    for (const group of groups) {
      const members = await this.userGroupRepository.getMembers(group.id);
      results.push(this.mapGroup(group, members));
    }
    return results;
  }

  async get(auth: AuthDto, id: string): Promise<UserGroupResponseDto> {
    const group = await this.requireOwnership(auth, id);
    const members = await this.userGroupRepository.getMembers(id);
    return this.mapGroup(group, members);
  }

  private async requireOwnership(auth: AuthDto, groupId: string) {
    const group = await this.userGroupRepository.getById(groupId);
    if (!group) {
      throw new BadRequestException('User group not found');
    }
    if (group.createdById !== auth.user.id) {
      throw new ForbiddenException('Not the owner of this group');
    }
    return group;
  }
```

**Step 2: Run test — verify GREEN**

Run: `cd server && pnpm test -- --run src/services/user-group.service.spec.ts`
Expected: ALL PASS.

**Step 3: Commit**

```bash
git add server/src/services/user-group.service.ts
git commit -m "feat(server): GREEN — implement getAll and get with ownership check"
```

---

### Task 8: RED — failing tests for `update` and `remove`

**Files:**

- Modify: `server/src/services/user-group.service.spec.ts`

**Step 1: Add tests**

Append inside the `describe(UserGroupService.name)` block:

```typescript
describe('update', () => {
  it('should throw ForbiddenException when user is not the owner', async () => {
    const auth = factory.auth();
    const group = makeGroup({ createdById: newUuid() });
    mocks.userGroup.getById.mockResolvedValue(group);

    await expect(sut.update(auth, group.id, { name: 'New Name' })).rejects.toThrow('Not the owner of this group');
  });

  it('should update the group name', async () => {
    const auth = factory.auth();
    const group = makeGroup({ createdById: auth.user.id });
    const updated = { ...group, name: 'New Name' };
    mocks.userGroup.getById.mockResolvedValue(group);
    mocks.userGroup.update.mockResolvedValue(updated);
    mocks.userGroup.getMembers.mockResolvedValue([]);

    const result = await sut.update(auth, group.id, { name: 'New Name' });

    expect(result.name).toBe('New Name');
    expect(mocks.userGroup.update).toHaveBeenCalledWith(group.id, { name: 'New Name', color: undefined });
  });

  it('should update the group color', async () => {
    const auth = factory.auth();
    const group = makeGroup({ createdById: auth.user.id });
    const updated = { ...group, color: 'red' };
    mocks.userGroup.getById.mockResolvedValue(group);
    mocks.userGroup.update.mockResolvedValue(updated);
    mocks.userGroup.getMembers.mockResolvedValue([]);

    const result = await sut.update(auth, group.id, { color: UserAvatarColor.Red });

    expect(result.color).toBe('red');
  });
});

describe('remove', () => {
  it('should throw ForbiddenException when user is not the owner', async () => {
    const auth = factory.auth();
    const group = makeGroup({ createdById: newUuid() });
    mocks.userGroup.getById.mockResolvedValue(group);

    await expect(sut.remove(auth, group.id)).rejects.toThrow('Not the owner of this group');
  });

  it('should remove the group', async () => {
    const auth = factory.auth();
    const group = makeGroup({ createdById: auth.user.id });
    mocks.userGroup.getById.mockResolvedValue(group);

    await sut.remove(auth, group.id);

    expect(mocks.userGroup.remove).toHaveBeenCalledWith(group.id);
  });
});
```

**Step 2: Run test — verify RED**

Run: `cd server && pnpm test -- --run src/services/user-group.service.spec.ts`
Expected: FAIL — `sut.update is not a function`, `sut.remove is not a function`.

**Step 3: Commit**

```bash
git add server/src/services/user-group.service.spec.ts
git commit -m "test(server): RED — failing tests for update and remove"
```

---

### Task 9: GREEN — implement `update` and `remove`

**Files:**

- Modify: `server/src/services/user-group.service.ts`

**Step 1: Add update and remove methods**

Add import for `UserGroupUpdateDto` at the top. Add methods after `get`:

```typescript
  async update(auth: AuthDto, id: string, dto: UserGroupUpdateDto): Promise<UserGroupResponseDto> {
    await this.requireOwnership(auth, id);

    const group = await this.userGroupRepository.update(id, {
      name: dto.name,
      color: dto.color,
    });

    const members = await this.userGroupRepository.getMembers(id);
    return this.mapGroup(group, members);
  }

  async remove(auth: AuthDto, id: string): Promise<void> {
    await this.requireOwnership(auth, id);
    await this.userGroupRepository.remove(id);
  }
```

**Step 2: Run test — verify GREEN**

Run: `cd server && pnpm test -- --run src/services/user-group.service.spec.ts`
Expected: ALL PASS.

**Step 3: Commit**

```bash
git add server/src/services/user-group.service.ts
git commit -m "feat(server): GREEN — implement update and remove"
```

---

### Task 10: RED — failing test for `setMembers`

**Files:**

- Modify: `server/src/services/user-group.service.spec.ts`

**Step 1: Add test**

```typescript
describe('setMembers', () => {
  it('should throw ForbiddenException when user is not the owner', async () => {
    const auth = factory.auth();
    const group = makeGroup({ createdById: newUuid() });
    mocks.userGroup.getById.mockResolvedValue(group);

    await expect(sut.setMembers(auth, group.id, { userIds: [newUuid()] })).rejects.toThrow(
      'Not the owner of this group',
    );
  });

  it('should replace members and return updated list', async () => {
    const auth = factory.auth();
    const group = makeGroup({ createdById: auth.user.id });
    const userId = newUuid();
    const member = makeMember({ groupId: group.id, userId });

    mocks.userGroup.getById.mockResolvedValue(group);
    mocks.userGroup.setMembers.mockResolvedValue(undefined);
    mocks.userGroup.getMembers.mockResolvedValue([member]);

    const result = await sut.setMembers(auth, group.id, { userIds: [userId] });

    expect(mocks.userGroup.setMembers).toHaveBeenCalledWith(group.id, [userId]);
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe(userId);
  });

  it('should allow setting empty member list', async () => {
    const auth = factory.auth();
    const group = makeGroup({ createdById: auth.user.id });

    mocks.userGroup.getById.mockResolvedValue(group);
    mocks.userGroup.setMembers.mockResolvedValue(undefined);
    mocks.userGroup.getMembers.mockResolvedValue([]);

    const result = await sut.setMembers(auth, group.id, { userIds: [] });

    expect(mocks.userGroup.setMembers).toHaveBeenCalledWith(group.id, []);
    expect(result).toEqual([]);
  });
});
```

**Step 2: Run test — verify RED**

Run: `cd server && pnpm test -- --run src/services/user-group.service.spec.ts`
Expected: FAIL — `sut.setMembers is not a function`.

**Step 3: Commit**

```bash
git add server/src/services/user-group.service.spec.ts
git commit -m "test(server): RED — failing tests for setMembers"
```

---

### Task 11: GREEN — implement `setMembers`

**Files:**

- Modify: `server/src/services/user-group.service.ts`

**Step 1: Add setMembers method**

Add import for `UserGroupMemberSetDto`. Add method after `remove`:

```typescript
  async setMembers(auth: AuthDto, id: string, dto: UserGroupMemberSetDto): Promise<UserGroupMemberResponseDto[]> {
    await this.requireOwnership(auth, id);
    await this.userGroupRepository.setMembers(id, dto.userIds);
    const members = await this.userGroupRepository.getMembers(id);
    return members.map((m) => this.mapMember(m));
  }
```

**Step 2: Run test — verify GREEN**

Run: `cd server && pnpm test -- --run src/services/user-group.service.spec.ts`
Expected: ALL PASS (all 12 tests).

**Step 3: REFACTOR — review the service**

Review the service for duplication. The `requireOwnership` pattern is clean. The `mapGroup`/`mapMember` helpers avoid repetition. No refactoring needed.

**Step 4: Commit**

```bash
git add server/src/services/user-group.service.ts
git commit -m "feat(server): GREEN — implement setMembers, all service tests pass"
```

---

### Task 12: Controller (infrastructure — delegates to tested service)

**Files:**

- Create: `server/src/controllers/user-group.controller.ts`
- Modify: `server/src/controllers/index.ts`

**Step 1: Create controller**

The controller is a thin delegation layer — all business logic is tested via the service tests. Controllers follow a mechanical pattern that doesn't benefit from TDD.

Create `server/src/controllers/user-group.controller.ts`:

```typescript
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  UserGroupCreateDto,
  UserGroupMemberResponseDto,
  UserGroupMemberSetDto,
  UserGroupResponseDto,
  UserGroupUpdateDto,
} from 'src/dtos/user-group.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { UserGroupService } from 'src/services/user-group.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.UserGroups)
@Controller('user-groups')
export class UserGroupController {
  constructor(private service: UserGroupService) {}

  @Post()
  @Authenticated({ permission: Permission.UserGroupCreate })
  @Endpoint({
    summary: 'Create a user group',
    description: 'Create a named group of users for quick selection when sharing.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  createGroup(@Auth() auth: AuthDto, @Body() dto: UserGroupCreateDto): Promise<UserGroupResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  @Authenticated({ permission: Permission.UserGroupRead })
  @Endpoint({
    summary: 'Get all user groups',
    description: 'Retrieve all user groups created by the current user.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  getAllGroups(@Auth() auth: AuthDto): Promise<UserGroupResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.UserGroupRead })
  @Endpoint({
    summary: 'Get a user group',
    description: 'Retrieve details of a specific user group.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  getGroup(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<UserGroupResponseDto> {
    return this.service.get(auth, id);
  }

  @Patch(':id')
  @Authenticated({ permission: Permission.UserGroupUpdate })
  @Endpoint({
    summary: 'Update a user group',
    description: 'Update the name or color of a user group.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  updateGroup(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UserGroupUpdateDto,
  ): Promise<UserGroupResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.UserGroupDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete a user group',
    description: 'Permanently delete a user group. Does not affect albums or spaces shared with group members.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  removeGroup(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  @Put(':id/members')
  @Authenticated({ permission: Permission.UserGroupUpdate })
  @Endpoint({
    summary: 'Set group members',
    description: 'Replace all members of a user group with the provided list.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  setMembers(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UserGroupMemberSetDto,
  ): Promise<UserGroupMemberResponseDto[]> {
    return this.service.setMembers(auth, id, dto);
  }
}
```

**Step 2: Register controller**

In `server/src/controllers/index.ts`:

- Add import: `import { UserGroupController } from 'src/controllers/user-group.controller';`
- Add to `controllers` array (after `UserAdminController`): `UserGroupController,`

**Step 3: Run all server tests to verify nothing broke**

Run: `cd server && pnpm test -- --run src/services/user-group.service.spec.ts`
Expected: ALL PASS.

**Step 4: Commit**

```bash
git add server/src/controllers/user-group.controller.ts server/src/controllers/index.ts
git commit -m "feat(server): add user group controller"
```

---

### Task 13: Regenerate OpenAPI specs and SDK

**Step 1: Build and regenerate**

Run: `cd server && pnpm build`
Then: `cd server && pnpm sync:open-api`
Then: `make open-api-typescript`

**Step 2: Verify SDK has new endpoints**

Run: `grep -r 'userGroup\|user-group\|UserGroup' open-api/typescript-sdk/src/ | head -20`
Expected: Generated functions like `createGroup`, `getAllGroups`, `setMembers`, etc.

**Step 3: Commit**

```bash
git add open-api/ server/src/queries/
git commit -m "chore: regenerate OpenAPI specs and SDK for user groups"
```

---

### Task 14: Frontend — i18n strings

**Files:**

- Modify: `web/src/lib/i18n/en.json`

**Step 1: Add i18n keys**

Find alphabetical position and add:

```json
"create_group": "Create group",
"delete_group": "Delete group",
"delete_group_description": "Delete group '{group}'? This won't affect any albums or spaces already shared with these users.",
"edit_group": "Edit group",
"group_member_count": "{count, plural, one {# member} other {# members}}",
"groups_empty_state": "Create groups to quickly select multiple people when sharing.",
"manage_user_groups": "Create and manage groups of users for quick sharing",
"user_groups": "User groups"
```

Error keys (inside `errors` object):

```json
"unable_to_create_group": "Unable to create group",
"unable_to_delete_group": "Unable to delete group",
"unable_to_load_groups": "Unable to load groups",
"unable_to_update_group": "Unable to update group"
```

**Step 2: Commit**

```bash
git add web/src/lib/i18n/
git commit -m "feat(web): add i18n strings for user groups"
```

---

### Task 15: Frontend — UserGroupModal component

**Files:**

- Create: `web/src/lib/modals/UserGroupModal.svelte`

**Step 1: Create the modal**

```svelte
<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import LoadingSpinner from '$lib/components/shared-components/LoadingSpinner.svelte';
  import {
    searchUsers,
    type UserGroupResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { FormModal, ListButton, Stack, Text } from '@immich/ui';
  import { mdiAccountGroup } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteMap } from 'svelte/reactivity';

  type Props = {
    group?: UserGroupResponseDto;
    currentUserId: string;
    onClose: (result?: { name: string; color: string | null; userIds: string[] }) => void;
  };

  const { group, currentUserId, onClose }: Props = $props();

  let name = $state(group?.name ?? '');
  let color = $state<string | null>(group?.color ?? null);
  let users: UserResponseDto[] = $state([]);
  let loading = $state(true);
  let search = $state('');

  const selectedUsers = new SvelteMap<string, UserResponseDto>();

  const colors = [
    { value: null, label: 'None', class: 'bg-gray-300 dark:bg-gray-600' },
    { value: 'primary', label: 'Primary', class: 'bg-immich-primary' },
    { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
    { value: 'red', label: 'Red', class: 'bg-red-500' },
    { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
    { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
    { value: 'green', label: 'Green', class: 'bg-green-500' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
    { value: 'amber', label: 'Amber', class: 'bg-amber-500' },
  ];

  const filteredUsers = $derived(
    users
      .filter(({ id }) => id !== currentUserId)
      .filter(({ name, email }) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
      }),
  );

  const handleToggle = (user: UserResponseDto) => {
    if (selectedUsers.has(user.id)) {
      selectedUsers.delete(user.id);
    } else {
      selectedUsers.set(user.id, user);
    }
  };

  const onSubmit = () => {
    onClose({ name, color, userIds: [...selectedUsers.keys()] });
  };

  onMount(async () => {
    users = await searchUsers();

    if (group?.members) {
      for (const member of group.members) {
        const user = users.find((u) => u.id === member.userId);
        if (user) {
          selectedUsers.set(user.id, user);
        }
      }
    }

    loading = false;
  });
</script>

<FormModal
  icon={mdiAccountGroup}
  title={group ? $t('edit_group') : $t('create_group')}
  submitText={group ? $t('save') : $t('create')}
  cancelText={$t('cancel')}
  {onSubmit}
  disabled={!name.trim()}
  {onClose}
>
  <div class="flex flex-col gap-4">
    <div>
      <label for="group-name" class="text-sm font-medium text-immich-fg dark:text-immich-dark-fg">
        {$t('name')}
      </label>
      <input
        id="group-name"
        type="text"
        class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        maxlength="100"
        bind:value={name}
      />
    </div>

    <div>
      <label class="text-sm font-medium text-immich-fg dark:text-immich-dark-fg">{$t('color')}</label>
      <div class="mt-1 flex gap-2 flex-wrap">
        {#each colors as c}
          <button
            type="button"
            class="h-7 w-7 rounded-full border-2 transition-all {c.class}"
            class:border-immich-primary={color === c.value}
            class:border-transparent={color !== c.value}
            class:scale-110={color === c.value}
            onclick={() => (color = c.value)}
            aria-label={c.label}
          />
        {/each}
      </div>
    </div>

    <div>
      <label class="text-sm font-medium text-immich-fg dark:text-immich-dark-fg">{$t('members')}</label>
      {#if selectedUsers.size > 0}
        <div class="mt-1 mb-2 flex flex-wrap gap-1">
          {#each [...selectedUsers.values()] as user (user.id)}
            <button
              type="button"
              class="flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs"
              onclick={() => selectedUsers.delete(user.id)}
            >
              {user.name}
              <span class="text-gray-400">&times;</span>
            </button>
          {/each}
        </div>
      {/if}

      <input
        type="text"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        placeholder={$t('search')}
        bind:value={search}
      />
    </div>

    {#if loading}
      <div class="w-full flex place-items-center place-content-center p-4">
        <LoadingSpinner />
      </div>
    {:else}
      <div class="max-h-64 overflow-y-auto">
        <Stack>
          {#each filteredUsers as user (user.id)}
            <ListButton selected={selectedUsers.has(user.id)} onclick={() => handleToggle(user)}>
              <UserAvatar {user} size="md" />
              <div class="text-start grow">
                <Text fontWeight="medium">{user.name}</Text>
                <Text size="tiny" color="muted">{user.email}</Text>
              </div>
            </ListButton>
          {:else}
            <Text class="py-4">{$t('no_results')}</Text>
          {/each}
        </Stack>
      </div>
    {/if}
  </div>
</FormModal>
```

**Step 2: Commit**

```bash
git add web/src/lib/modals/UserGroupModal.svelte
git commit -m "feat(web): add UserGroupModal for create/edit groups"
```

---

### Task 16: Frontend — group settings component and registration

**Files:**

- Create: `web/src/lib/components/user-settings-page/group-settings.svelte`
- Modify: `web/src/lib/components/user-settings-page/user-settings-list.svelte`

**Step 1: Create group-settings.svelte**

```svelte
<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import UserGroupModal from '$lib/modals/UserGroupModal.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import {
    createGroup,
    getAllGroups,
    removeGroup,
    setMembers,
    updateGroup,
    type UserGroupResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { Button, IconButton, modalManager, Text } from '@immich/ui';
  import { mdiDelete, mdiPencil } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    user: UserResponseDto;
  }

  let { user }: Props = $props();

  let groups: UserGroupResponseDto[] = $state([]);

  const colorClasses: Record<string, string> = {
    primary: 'bg-immich-primary',
    pink: 'bg-pink-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    gray: 'bg-gray-500',
    amber: 'bg-amber-500',
  };

  onMount(async () => {
    await refreshGroups();
  });

  const refreshGroups = async () => {
    try {
      groups = await getAllGroups();
    } catch (error) {
      handleError(error, $t('errors.unable_to_load_groups'));
    }
  };

  const handleCreate = async () => {
    const result = await modalManager.show(UserGroupModal, { currentUserId: user.id });
    if (!result) return;

    try {
      const group = await createGroup({ userGroupCreateDto: { name: result.name, color: result.color } });
      if (result.userIds.length > 0) {
        await setMembers({ id: group.id, userGroupMemberSetDto: { userIds: result.userIds } });
      }
      await refreshGroups();
    } catch (error) {
      handleError(error, $t('errors.unable_to_create_group'));
    }
  };

  const handleEdit = async (group: UserGroupResponseDto) => {
    const result = await modalManager.show(UserGroupModal, { group, currentUserId: user.id });
    if (!result) return;

    try {
      await updateGroup({ id: group.id, userGroupUpdateDto: { name: result.name, color: result.color } });
      await setMembers({ id: group.id, userGroupMemberSetDto: { userIds: result.userIds } });
      await refreshGroups();
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_group'));
    }
  };

  const handleDelete = async (group: UserGroupResponseDto) => {
    const isConfirmed = await modalManager.showDialog({
      title: $t('delete_group'),
      prompt: $t('delete_group_description', { values: { group: group.name } }),
    });

    if (!isConfirmed) return;

    try {
      await removeGroup({ id: group.id });
      await refreshGroups();
    } catch (error) {
      handleError(error, $t('errors.unable_to_delete_group'));
    }
  };
</script>

<section class="my-4">
  {#if groups.length > 0}
    {#each groups as group (group.id)}
      <div class="rounded-2xl border border-gray-200 dark:border-gray-800 mt-4 bg-slate-50 dark:bg-gray-900 p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            {#if group.color}
              <div class="h-3 w-3 rounded-full {colorClasses[group.color] ?? 'bg-gray-400'}"></div>
            {/if}
            <div>
              <Text fontWeight="medium">{group.name}</Text>
              <Text size="tiny" color="muted">
                {$t('group_member_count', { values: { count: group.members.length } })}
              </Text>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <div class="flex -space-x-2">
              {#each group.members.slice(0, 5) as member (member.userId)}
                <UserAvatar user={{ ...member, id: member.userId }} size="sm" />
              {/each}
              {#if group.members.length > 5}
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium"
                >
                  +{group.members.length - 5}
                </div>
              {/if}
            </div>

            <IconButton
              shape="round"
              color="secondary"
              variant="ghost"
              icon={mdiPencil}
              size="small"
              onclick={() => handleEdit(group)}
              aria-label={$t('edit')}
            />
            <IconButton
              shape="round"
              color="secondary"
              variant="ghost"
              icon={mdiDelete}
              size="small"
              onclick={() => handleDelete(group)}
              aria-label={$t('delete')}
            />
          </div>
        </div>
      </div>
    {/each}
  {:else}
    <Text class="py-4" color="muted">{$t('groups_empty_state')}</Text>
  {/if}

  <div class="flex justify-end mt-5">
    <Button shape="round" size="small" onclick={() => handleCreate()}>{$t('create_group')}</Button>
  </div>
</section>
```

**Step 2: Register in user settings list**

In `web/src/lib/components/user-settings-page/user-settings-list.svelte`:

- Add import: `import GroupSettings from './group-settings.svelte';`
- Add `mdiAccountMultipleOutline` to the `@mdi/js` import
- Add accordion after the partner-sharing section (after line 143):

```svelte
  <SettingAccordion
    icon={mdiAccountMultipleOutline}
    key="user-groups"
    title={$t('user_groups')}
    subtitle={$t('manage_user_groups')}
  >
    <GroupSettings user={$user} />
  </SettingAccordion>
```

**Step 3: Commit**

```bash
git add web/src/lib/components/user-settings-page/group-settings.svelte web/src/lib/components/user-settings-page/user-settings-list.svelte
git commit -m "feat(web): add group settings UI with create/edit/delete"
```

---

### Task 17: Frontend — group chips in sharing modals

**Files:**

- Modify: `web/src/lib/modals/AlbumAddUsersModal.svelte`
- Modify: `web/src/lib/modals/SpaceAddMemberModal.svelte`

The group chip logic is identical in both modals. The pattern:

1. Fetch groups alongside users in `onMount` (parallel)
2. Filter groups to only show those with at least one eligible member
3. Render colored pills above the user list
4. Clicking a pill toggles all eligible group members selected/deselected

**Step 1: Replace AlbumAddUsersModal.svelte**

```svelte
<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { handleAddUsersToAlbum } from '$lib/services/album.service';
  import {
    getAllGroups,
    searchUsers,
    type AlbumResponseDto,
    type UserGroupResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { FormModal, ListButton, Stack, Text } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import LoadingSpinner from '$lib/components/shared-components/LoadingSpinner.svelte';

  type Props = {
    album: AlbumResponseDto;
    onClose: () => void;
  };

  const { album, onClose }: Props = $props();

  let users: UserResponseDto[] = $state([]);
  let groups: UserGroupResponseDto[] = $state([]);
  const excludedUserIds = $derived([album.ownerId, ...album.albumUsers.map(({ user: { id } }) => id)]);
  const filteredUsers = $derived(users.filter(({ id }) => !excludedUserIds.includes(id)));
  const selectedUsers = new SvelteMap<string, UserResponseDto>();
  const activeGroupIds = new SvelteSet<string>();
  let loading = $state(true);

  const colorClasses: Record<string, string> = {
    primary: 'bg-immich-primary text-white',
    pink: 'bg-pink-500 text-white',
    red: 'bg-red-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white',
    orange: 'bg-orange-500 text-white',
    gray: 'bg-gray-500 text-white',
    amber: 'bg-amber-500 text-white',
  };

  const filteredGroups = $derived(
    groups.filter((g) => g.members.some((m) => !excludedUserIds.includes(m.userId))),
  );

  const handleToggle = (user: UserResponseDto) => {
    if (selectedUsers.has(user.id)) {
      selectedUsers.delete(user.id);
    } else {
      selectedUsers.set(user.id, user);
    }
  };

  const handleGroupToggle = (group: UserGroupResponseDto) => {
    if (activeGroupIds.has(group.id)) {
      activeGroupIds.delete(group.id);
      for (const member of group.members) {
        if (!excludedUserIds.includes(member.userId)) {
          selectedUsers.delete(member.userId);
        }
      }
    } else {
      activeGroupIds.add(group.id);
      for (const member of group.members) {
        if (!excludedUserIds.includes(member.userId)) {
          const user = users.find((u) => u.id === member.userId);
          if (user) {
            selectedUsers.set(user.id, user);
          }
        }
      }
    }
  };

  const onSubmit = async () => {
    const success = await handleAddUsersToAlbum(album, [...selectedUsers.values()]);
    if (success) {
      onClose();
    }
  };

  onMount(async () => {
    const [userList, groupList] = await Promise.all([searchUsers(), getAllGroups()]);
    users = userList;
    groups = groupList;
    loading = false;
  });
</script>

<FormModal
  title={$t('users')}
  submitText={$t('add')}
  cancelText={$t('back')}
  {onSubmit}
  disabled={selectedUsers.size === 0}
  {onClose}
>
  {#if loading}
    <div class="w-full flex place-items-center place-content-center">
      <LoadingSpinner />
    </div>
  {:else}
    {#if filteredGroups.length > 0}
      <div class="flex flex-wrap gap-2 mb-3">
        {#each filteredGroups as group (group.id)}
          <button
            type="button"
            class="rounded-full px-3 py-1 text-xs font-medium transition-all border {activeGroupIds.has(group.id)
              ? group.color
                ? colorClasses[group.color] ?? 'bg-gray-700 text-white'
                : 'bg-gray-700 text-white dark:bg-gray-200 dark:text-gray-800'
              : 'bg-transparent text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}"
            onclick={() => handleGroupToggle(group)}
          >
            {group.name}
            <span class="ml-1 opacity-75">{group.members.filter((m) => !excludedUserIds.includes(m.userId)).length}</span>
          </button>
        {/each}
      </div>
    {/if}
    <Stack>
      {#each filteredUsers as user (user.id)}
        <ListButton selected={selectedUsers.has(user.id)} onclick={() => handleToggle(user)}>
          <UserAvatar {user} size="md" />
          <div class="text-start grow">
            <Text fontWeight="medium">{user.name}</Text>
            <Text size="tiny" color="muted">{user.email}</Text>
          </div>
        </ListButton>
      {:else}
        <Text class="py-6">{$t('album_share_no_users')}</Text>
      {/each}
    </Stack>
  {/if}
</FormModal>
```

**Step 2: Replace SpaceAddMemberModal.svelte**

```svelte
<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import {
    addMember,
    getAllGroups,
    searchUsers,
    type SharedSpaceMemberResponseDto,
    type UserGroupResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { FormModal, ListButton, Stack, Text } from '@immich/ui';
  import { mdiAccountPlus } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import LoadingSpinner from '$lib/components/shared-components/LoadingSpinner.svelte';

  type Props = {
    spaceId: string;
    existingMemberIds: string[];
    onClose: (added?: SharedSpaceMemberResponseDto[]) => void;
  };

  const { spaceId, existingMemberIds, onClose }: Props = $props();

  let users: UserResponseDto[] = $state([]);
  let groups: UserGroupResponseDto[] = $state([]);
  const filteredUsers = $derived(users.filter(({ id }) => !existingMemberIds.includes(id)));
  const selectedUsers = new SvelteMap<string, UserResponseDto>();
  const activeGroupIds = new SvelteSet<string>();
  let loading = $state(true);

  const colorClasses: Record<string, string> = {
    primary: 'bg-immich-primary text-white',
    pink: 'bg-pink-500 text-white',
    red: 'bg-red-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white',
    orange: 'bg-orange-500 text-white',
    gray: 'bg-gray-500 text-white',
    amber: 'bg-amber-500 text-white',
  };

  const filteredGroups = $derived(
    groups.filter((g) => g.members.some((m) => !existingMemberIds.includes(m.userId))),
  );

  const handleToggle = (user: UserResponseDto) => {
    if (selectedUsers.has(user.id)) {
      selectedUsers.delete(user.id);
    } else {
      selectedUsers.set(user.id, user);
    }
  };

  const handleGroupToggle = (group: UserGroupResponseDto) => {
    if (activeGroupIds.has(group.id)) {
      activeGroupIds.delete(group.id);
      for (const member of group.members) {
        if (!existingMemberIds.includes(member.userId)) {
          selectedUsers.delete(member.userId);
        }
      }
    } else {
      activeGroupIds.add(group.id);
      for (const member of group.members) {
        if (!existingMemberIds.includes(member.userId)) {
          const user = users.find((u) => u.id === member.userId);
          if (user) {
            selectedUsers.set(user.id, user);
          }
        }
      }
    }
  };

  const onSubmit = async () => {
    const added: SharedSpaceMemberResponseDto[] = [];
    for (const user of selectedUsers.values()) {
      const member = await addMember({
        id: spaceId,
        sharedSpaceMemberCreateDto: { userId: user.id },
      });
      added.push(member);
    }
    onClose(added);
  };

  onMount(async () => {
    const [userList, groupList] = await Promise.all([searchUsers(), getAllGroups()]);
    users = userList;
    groups = groupList;
    loading = false;
  });
</script>

<FormModal
  icon={mdiAccountPlus}
  title={$t('spaces_add_member')}
  submitText={$t('add')}
  cancelText={$t('back')}
  {onSubmit}
  disabled={selectedUsers.size === 0}
  {onClose}
>
  {#if loading}
    <div class="w-full flex place-items-center place-content-center p-4">
      <LoadingSpinner />
    </div>
  {:else}
    {#if filteredGroups.length > 0}
      <div class="flex flex-wrap gap-2 mb-3">
        {#each filteredGroups as group (group.id)}
          <button
            type="button"
            class="rounded-full px-3 py-1 text-xs font-medium transition-all border {activeGroupIds.has(group.id)
              ? group.color
                ? colorClasses[group.color] ?? 'bg-gray-700 text-white'
                : 'bg-gray-700 text-white dark:bg-gray-200 dark:text-gray-800'
              : 'bg-transparent text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}"
            onclick={() => handleGroupToggle(group)}
          >
            {group.name}
            <span class="ml-1 opacity-75">{group.members.filter((m) => !existingMemberIds.includes(m.userId)).length}</span>
          </button>
        {/each}
      </div>
    {/if}
    <Stack>
      {#each filteredUsers as user (user.id)}
        <ListButton selected={selectedUsers.has(user.id)} onclick={() => handleToggle(user)}>
          <UserAvatar {user} size="md" />
          <div class="text-start grow">
            <Text fontWeight="medium">{user.name}</Text>
            <Text size="tiny" color="muted">{user.email}</Text>
          </div>
        </ListButton>
      {:else}
        <Text class="py-6">{$t('spaces_no_users_to_add')}</Text>
      {/each}
    </Stack>
  {/if}
</FormModal>
```

**Step 3: Commit**

```bash
git add web/src/lib/modals/AlbumAddUsersModal.svelte web/src/lib/modals/SpaceAddMemberModal.svelte
git commit -m "feat(web): add group quick-select chips to album and space sharing modals"
```

---

### Task 18: Lint, type-check, and verify

**Step 1: Run server tests**

Run: `cd server && pnpm test -- --run src/services/user-group.service.spec.ts`
Expected: ALL 12 tests PASS.

**Step 2: Run server checks**

Run: `make check-server && make lint-server`
Expected: Clean.

**Step 3: Regenerate SQL queries**

Run: `make sql`

**Step 4: Run web checks**

Run: `make check-web && make lint-web`
Expected: Clean.

**Step 5: Build everything**

Run: `make build-server && make build-sdk && make build-web`
Expected: All three build successfully.

**Step 6: Run full test suites**

Run: `cd server && pnpm test`
Run: `cd web && pnpm test`
Expected: All pass.

**Step 7: Fix any issues and commit**

```bash
git add -A
git commit -m "chore: fix lint and type-check issues for user groups"
```
