# Shared Spaces (Phase 1) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Shared Spaces — virtual libraries where multiple users can contribute, browse, search, and view photos together — to the Immich server, web, and mobile apps.

**Architecture:** Three new database tables (`shared_space`, `shared_space_member`, `shared_space_asset`) with reference-based linking (zero storage duplication). New NestJS service/controller/repository following existing patterns (Partner feature as reference). Web UI adds a "Spaces" sidebar entry with list and detail pages. Mobile adds a "Spaces" entry to the Library tab.

**Tech Stack:** NestJS 11 + Kysely (server), SvelteKit + Svelte 5 runes (web), Flutter + Riverpod (mobile), PostgreSQL, OpenAPI codegen.

---

## Task 1: Database Schema — Table Definitions

**Files:**

- Create: `server/src/schema/tables/shared-space.table.ts`
- Create: `server/src/schema/tables/shared-space-member.table.ts`
- Create: `server/src/schema/tables/shared-space-asset.table.ts`
- Modify: `server/src/schema/index.ts` (register tables)

**Step 1: Create the shared_space table definition**

Create `server/src/schema/tables/shared-space.table.ts`:

```typescript
import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedUuidV7Column,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { CreateIdColumn, UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { UserTable } from 'src/schema/tables/user.table';

@Table('shared_space')
@UpdatedAtTrigger('shared_space_updatedAt')
export class SharedSpaceTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE' })
  createdById!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @CreateIdColumn({ index: true })
  createId!: Generated<string>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
```

**Step 2: Create the shared_space_member table definition**

Create `server/src/schema/tables/shared-space-member.table.ts`:

```typescript
import { Column, CreateDateColumn, ForeignKeyColumn, Generated, Table, Timestamp } from '@immich/sql-tools';
import { SharedSpaceTable } from 'src/schema/tables/shared-space.table';
import { UserTable } from 'src/schema/tables/user.table';

@Table('shared_space_member')
export class SharedSpaceMemberTable {
  @ForeignKeyColumn(() => SharedSpaceTable, { onDelete: 'CASCADE', primary: true })
  spaceId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', primary: true })
  userId!: string;

  @Column({ type: 'character varying', default: "'viewer'" })
  role!: Generated<string>;

  @CreateDateColumn()
  joinedAt!: Generated<Timestamp>;
}
```

**Step 3: Create the shared_space_asset table definition**

Create `server/src/schema/tables/shared-space-asset.table.ts`:

```typescript
import { CreateDateColumn, ForeignKeyColumn, Generated, Table, Timestamp } from '@immich/sql-tools';
import { AssetTable } from 'src/schema/tables/asset.table';
import { SharedSpaceTable } from 'src/schema/tables/shared-space.table';
import { UserTable } from 'src/schema/tables/user.table';

@Table('shared_space_asset')
export class SharedSpaceAssetTable {
  @ForeignKeyColumn(() => SharedSpaceTable, { onDelete: 'CASCADE', primary: true })
  spaceId!: string;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', primary: true })
  assetId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'SET NULL', nullable: true })
  addedById!: string | null;

  @CreateDateColumn()
  addedAt!: Generated<Timestamp>;
}
```

**Step 4: Register tables in schema index**

Edit `server/src/schema/index.ts`:

- Add imports for `SharedSpaceTable`, `SharedSpaceMemberTable`, `SharedSpaceAssetTable`
- Add them to the `tables` array in `ImmichDatabase`
- Add entries to the `DB` interface

**Step 5: Commit**

```bash
git add server/src/schema/tables/shared-space.table.ts server/src/schema/tables/shared-space-member.table.ts server/src/schema/tables/shared-space-asset.table.ts server/src/schema/index.ts
git commit -m "feat(server): add shared space table definitions"
```

---

## Task 2: Database Migration

**Files:**

- Create: `server/src/schema/migrations/{timestamp}-CreateSharedSpaceTables.ts`

**Step 1: Create migration file**

Use the next available timestamp. Create `server/src/schema/migrations/1772240000000-CreateSharedSpaceTables.ts`:

```typescript
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE "shared_space" (
      "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
      "name" text NOT NULL,
      "description" text,
      "createdById" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
      "createId" uuid NOT NULL DEFAULT immich_uuid_v7(),
      "updateId" uuid NOT NULL DEFAULT immich_uuid_v7()
    );
  `.execute(db);

  await sql`ALTER TABLE "shared_space" ADD CONSTRAINT "shared_space_pkey" PRIMARY KEY ("id")`.execute(db);
  await sql`CREATE INDEX "IDX_shared_space_createdById" ON "shared_space" ("createdById")`.execute(db);
  await sql`CREATE INDEX "IDX_shared_space_createId" ON "shared_space" ("createId")`.execute(db);
  await sql`CREATE INDEX "IDX_shared_space_updateId" ON "shared_space" ("updateId")`.execute(db);

  await sql`
    CREATE TABLE "shared_space_member" (
      "spaceId" uuid NOT NULL REFERENCES "shared_space"("id") ON DELETE CASCADE,
      "userId" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "role" character varying NOT NULL DEFAULT 'viewer',
      "joinedAt" timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT "shared_space_member_pkey" PRIMARY KEY ("spaceId", "userId")
    );
  `.execute(db);

  await sql`CREATE INDEX "IDX_shared_space_member_userId" ON "shared_space_member" ("userId")`.execute(db);

  await sql`
    CREATE TABLE "shared_space_asset" (
      "spaceId" uuid NOT NULL REFERENCES "shared_space"("id") ON DELETE CASCADE,
      "assetId" uuid NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
      "addedById" uuid REFERENCES "user"("id") ON DELETE SET NULL,
      "addedAt" timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT "shared_space_asset_pkey" PRIMARY KEY ("spaceId", "assetId")
    );
  `.execute(db);

  await sql`CREATE INDEX "IDX_shared_space_asset_assetId" ON "shared_space_asset" ("assetId")`.execute(db);

  -- Trigger for updatedAt
  await sql`
    CREATE TRIGGER "shared_space_updatedAt"
    BEFORE UPDATE ON "shared_space"
    FOR EACH ROW EXECUTE FUNCTION updated_at();
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER IF EXISTS "shared_space_updatedAt" ON "shared_space"`.execute(db);
  await sql`DROP TABLE IF EXISTS "shared_space_asset"`.execute(db);
  await sql`DROP TABLE IF EXISTS "shared_space_member"`.execute(db);
  await sql`DROP TABLE IF EXISTS "shared_space"`.execute(db);
}
```

**Step 2: Run migration to verify**

```bash
cd server && pnpm migrations:run
```

Expected: Migration applies without errors.

**Step 3: Commit**

```bash
git add server/src/schema/migrations/
git commit -m "feat(server): add shared space database migration"
```

---

## Task 3: Enums, Types, and Permission Registration

**Files:**

- Modify: `server/src/enum.ts` (add Permission entries, ApiTag, SharedSpaceRole enum)
- Modify: `server/src/database.ts` (add entity types)

**Step 1: Add SharedSpaceRole enum and permissions to enum.ts**

Add to `server/src/enum.ts`:

After line ~289 (after PartnerDelete), add:

```typescript
  SharedSpaceCreate = 'sharedSpace.create',
  SharedSpaceRead = 'sharedSpace.read',
  SharedSpaceUpdate = 'sharedSpace.update',
  SharedSpaceDelete = 'sharedSpace.delete',
  SharedSpaceMemberCreate = 'sharedSpace.member.create',
  SharedSpaceMemberUpdate = 'sharedSpace.member.update',
  SharedSpaceMemberDelete = 'sharedSpace.member.delete',
  SharedSpaceAssetCreate = 'sharedSpace.asset.create',
  SharedSpaceAssetRead = 'sharedSpace.asset.read',
  SharedSpaceAssetDelete = 'sharedSpace.asset.delete',
```

Add to `ApiTag` enum (after `SharedLinks`):

```typescript
  SharedSpaces = 'Shared Spaces',
```

Add new enum (after `ApiTag`):

```typescript
export enum SharedSpaceRole {
  Owner = 'owner',
  Editor = 'editor',
  Viewer = 'viewer',
}
```

**Step 2: Add entity types to database.ts**

Add to `server/src/database.ts`:

```typescript
export type SharedSpace = {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createId: string;
  updateId: string;
};

export type SharedSpaceMember = {
  spaceId: string;
  userId: string;
  role: string;
  joinedAt: Date;
};

export type SharedSpaceAsset = {
  spaceId: string;
  assetId: string;
  addedById: string | null;
  addedAt: Date;
};
```

**Step 3: Commit**

```bash
git add server/src/enum.ts server/src/database.ts
git commit -m "feat(server): add shared space enums and database types"
```

---

## Task 4: Repository

**Files:**

- Create: `server/src/repositories/shared-space.repository.ts`
- Modify: `server/src/repositories/index.ts` (register)

**Step 1: Write the failing test**

Create `server/src/services/shared-space.service.spec.ts` with a minimal test first (we'll expand it in Task 6):

```typescript
import { SharedSpaceService } from 'src/services/shared-space.service';
import { newTestService, ServiceMocks } from 'test/utils';

describe(SharedSpaceService.name, () => {
  let sut: SharedSpaceService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(SharedSpaceService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });
});
```

Run: `cd server && pnpm test -- --run src/services/shared-space.service.spec.ts`
Expected: FAIL (SharedSpaceService and repository don't exist yet)

**Step 2: Create the repository**

Create `server/src/repositories/shared-space.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { SharedSpaceTable } from 'src/schema/tables/shared-space.table';
import { SharedSpaceMemberTable } from 'src/schema/tables/shared-space-member.table';
import { SharedSpaceAssetTable } from 'src/schema/tables/shared-space-asset.table';

@Injectable()
export class SharedSpaceRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getById(id: string) {
    return this.db.selectFrom('shared_space').selectAll().where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAllByUserId(userId: string) {
    return this.db
      .selectFrom('shared_space')
      .innerJoin('shared_space_member', 'shared_space_member.spaceId', 'shared_space.id')
      .selectAll('shared_space')
      .where('shared_space_member.userId', '=', userId)
      .execute();
  }

  create(values: Insertable<SharedSpaceTable>) {
    return this.db.insertInto('shared_space').values(values).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, { name: 'Updated Space' }] })
  update(id: string, values: Updateable<SharedSpaceTable>) {
    return this.db
      .updateTable('shared_space')
      .set(values)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async remove(id: string) {
    await this.db.deleteFrom('shared_space').where('id', '=', id).execute();
  }

  // -- Members --

  @GenerateSql({ params: [DummyValue.UUID] })
  getMembers(spaceId: string) {
    return this.db
      .selectFrom('shared_space_member')
      .innerJoin('user', 'user.id', 'shared_space_member.userId')
      .selectAll('shared_space_member')
      .select(['user.name', 'user.email', 'user.profileImagePath', 'user.profileChangedAt'])
      .where('shared_space_member.spaceId', '=', spaceId)
      .where('user.deletedAt', 'is', null)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getMember(spaceId: string, userId: string) {
    return this.db
      .selectFrom('shared_space_member')
      .selectAll()
      .where('spaceId', '=', spaceId)
      .where('userId', '=', userId)
      .executeTakeFirst();
  }

  addMember(values: Insertable<SharedSpaceMemberTable>) {
    return this.db.insertInto('shared_space_member').values(values).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID, { role: 'editor' }] })
  updateMember(spaceId: string, userId: string, values: Updateable<SharedSpaceMemberTable>) {
    return this.db
      .updateTable('shared_space_member')
      .set(values)
      .where('spaceId', '=', spaceId)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async removeMember(spaceId: string, userId: string) {
    await this.db
      .deleteFrom('shared_space_member')
      .where('spaceId', '=', spaceId)
      .where('userId', '=', userId)
      .execute();
  }

  // -- Assets --

  @GenerateSql({ params: [DummyValue.UUID] })
  getAssetCount(spaceId: string) {
    return this.db
      .selectFrom('shared_space_asset')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('spaceId', '=', spaceId)
      .executeTakeFirstOrThrow();
  }

  addAssets(values: Insertable<SharedSpaceAssetTable>[]) {
    return this.db
      .insertInto('shared_space_asset')
      .values(values)
      .onConflict((oc) => oc.columns(['spaceId', 'assetId']).doNothing())
      .returningAll()
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async removeAssets(spaceId: string, assetIds: string[]) {
    await this.db
      .deleteFrom('shared_space_asset')
      .where('spaceId', '=', spaceId)
      .where('assetId', 'in', assetIds)
      .execute();
  }
}
```

**Step 3: Register repository**

Edit `server/src/repositories/index.ts`:

- Add `import { SharedSpaceRepository } from 'src/repositories/shared-space.repository';`
- Add `SharedSpaceRepository` to the `repositories` array (alphabetical order, after `SharedLinkAssetRepository`)

**Step 4: Register in BaseService**

Edit `server/src/services/base.service.ts`:

- Add `import { SharedSpaceRepository } from 'src/repositories/shared-space.repository';`
- Add `SharedSpaceRepository` to `BASE_SERVICE_DEPENDENCIES` array (after `SharedLinkAssetRepository`)
- Add `protected sharedSpaceRepository: SharedSpaceRepository,` to the constructor (after `sharedLinkAssetRepository`)

**Step 5: Commit**

```bash
git add server/src/repositories/shared-space.repository.ts server/src/repositories/index.ts server/src/services/base.service.ts
git commit -m "feat(server): add shared space repository"
```

---

## Task 5: DTOs

**Files:**

- Create: `server/src/dtos/shared-space.dto.ts`

**Step 1: Create DTOs**

Create `server/src/dtos/shared-space.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { SharedSpaceRole } from 'src/enum';
import { ValidateEnum, ValidateUUID } from 'src/validation';

// -- Space DTOs --

export class SharedSpaceCreateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({ description: 'Space name' })
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @ApiPropertyOptional({ description: 'Space description' })
  description?: string;
}

export class SharedSpaceUpdateDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  @ApiPropertyOptional({ description: 'Space name' })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @ApiPropertyOptional({ description: 'Space description' })
  description?: string;
}

export class SharedSpaceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description!: string | null;

  @ApiProperty()
  createdById!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional()
  memberCount?: number;

  @ApiPropertyOptional()
  assetCount?: number;
}

// -- Member DTOs --

export class SharedSpaceMemberCreateDto {
  @ValidateUUID({ description: 'User ID to add' })
  userId!: string;

  @ValidateEnum({ enum: SharedSpaceRole, name: 'SharedSpaceRole', description: 'Member role' })
  @IsOptional()
  role?: SharedSpaceRole;
}

export class SharedSpaceMemberUpdateDto {
  @ValidateEnum({ enum: SharedSpaceRole, name: 'SharedSpaceRole', description: 'Member role' })
  role!: SharedSpaceRole;
}

export class SharedSpaceMemberResponseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  role!: string;

  @ApiProperty()
  joinedAt!: Date;

  @ApiPropertyOptional()
  profileImagePath?: string;
}

// -- Asset DTOs --

export class SharedSpaceAssetAddDto {
  @ValidateUUID({ each: true, description: 'Asset IDs to add' })
  assetIds!: string[];
}

export class SharedSpaceAssetRemoveDto {
  @ValidateUUID({ each: true, description: 'Asset IDs to remove' })
  assetIds!: string[];
}
```

**Step 2: Commit**

```bash
git add server/src/dtos/shared-space.dto.ts
git commit -m "feat(server): add shared space DTOs"
```

---

## Task 6: Service

**Files:**

- Create: `server/src/services/shared-space.service.ts`
- Modify: `server/src/services/index.ts` (register)
- Create: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write service tests**

Create `server/src/services/shared-space.service.spec.ts`:

```typescript
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { SharedSpaceRole } from 'src/enum';
import { SharedSpaceService } from 'src/services/shared-space.service';
import { factory } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

describe(SharedSpaceService.name, () => {
  let sut: SharedSpaceService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(SharedSpaceService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should create a space and add the creator as owner', async () => {
      const user = factory.user();
      const auth = factory.auth({ user: { id: user.id } });
      const space = {
        id: 'space-1',
        name: 'Family',
        description: null,
        createdById: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        createId: 'c1',
        updateId: 'u1',
      };

      mocks.sharedSpace.create.mockResolvedValue(space);
      mocks.sharedSpace.addMember.mockResolvedValue({
        spaceId: space.id,
        userId: user.id,
        role: SharedSpaceRole.Owner,
        joinedAt: new Date(),
      });

      const result = await sut.create(auth, { name: 'Family' });

      expect(result.name).toBe('Family');
      expect(mocks.sharedSpace.create).toHaveBeenCalledWith({ name: 'Family', createdById: user.id });
      expect(mocks.sharedSpace.addMember).toHaveBeenCalledWith({
        spaceId: space.id,
        userId: user.id,
        role: SharedSpaceRole.Owner,
      });
    });
  });

  describe('getAll', () => {
    it('should return all spaces for the user', async () => {
      const user = factory.user();
      const auth = factory.auth({ user: { id: user.id } });

      mocks.sharedSpace.getAllByUserId.mockResolvedValue([]);

      const result = await sut.getAll(auth);
      expect(result).toEqual([]);
      expect(mocks.sharedSpace.getAllByUserId).toHaveBeenCalledWith(user.id);
    });
  });

  describe('get', () => {
    it('should throw if user is not a member', async () => {
      const user = factory.user();
      const auth = factory.auth({ user: { id: user.id } });

      mocks.sharedSpace.getMember.mockResolvedValue(void 0);

      await expect(sut.get(auth, 'space-1')).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should throw if user is not owner', async () => {
      const user = factory.user();
      const auth = factory.auth({ user: { id: user.id } });

      mocks.sharedSpace.getMember.mockResolvedValue({
        spaceId: 'space-1',
        userId: user.id,
        role: SharedSpaceRole.Editor,
        joinedAt: new Date(),
      });

      await expect(sut.remove(auth, 'space-1')).rejects.toThrow();
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: FAIL (SharedSpaceService doesn't exist yet)

**Step 3: Create the service**

Create `server/src/services/shared-space.service.ts`:

```typescript
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  SharedSpaceAssetAddDto,
  SharedSpaceAssetRemoveDto,
  SharedSpaceCreateDto,
  SharedSpaceMemberCreateDto,
  SharedSpaceMemberResponseDto,
  SharedSpaceMemberUpdateDto,
  SharedSpaceResponseDto,
  SharedSpaceUpdateDto,
} from 'src/dtos/shared-space.dto';
import { SharedSpaceRole } from 'src/enum';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class SharedSpaceService extends BaseService {
  async create(auth: AuthDto, dto: SharedSpaceCreateDto): Promise<SharedSpaceResponseDto> {
    const space = await this.sharedSpaceRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      createdById: auth.user.id,
    });

    await this.sharedSpaceRepository.addMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Owner,
    });

    return this.mapSpace(space);
  }

  async getAll(auth: AuthDto): Promise<SharedSpaceResponseDto[]> {
    const spaces = await this.sharedSpaceRepository.getAllByUserId(auth.user.id);
    return spaces.map((space) => this.mapSpace(space));
  }

  async get(auth: AuthDto, id: string): Promise<SharedSpaceResponseDto> {
    await this.requireMembership(auth, id);
    const space = await this.sharedSpaceRepository.getById(id);
    if (!space) {
      throw new NotFoundException('Space not found');
    }
    const { count: assetCount } = await this.sharedSpaceRepository.getAssetCount(id);
    const members = await this.sharedSpaceRepository.getMembers(id);
    return { ...this.mapSpace(space), memberCount: members.length, assetCount };
  }

  async update(auth: AuthDto, id: string, dto: SharedSpaceUpdateDto): Promise<SharedSpaceResponseDto> {
    await this.requireRole(auth, id, SharedSpaceRole.Owner);
    const space = await this.sharedSpaceRepository.update(id, dto);
    return this.mapSpace(space);
  }

  async remove(auth: AuthDto, id: string): Promise<void> {
    await this.requireRole(auth, id, SharedSpaceRole.Owner);
    await this.sharedSpaceRepository.remove(id);
  }

  // -- Members --

  async getMembers(auth: AuthDto, spaceId: string): Promise<SharedSpaceMemberResponseDto[]> {
    await this.requireMembership(auth, spaceId);
    const members = await this.sharedSpaceRepository.getMembers(spaceId);
    return members.map((m) => ({
      userId: m.userId,
      name: m.name,
      email: m.email,
      role: m.role,
      joinedAt: m.joinedAt,
      profileImagePath: m.profileImagePath,
    }));
  }

  async addMember(
    auth: AuthDto,
    spaceId: string,
    dto: SharedSpaceMemberCreateDto,
  ): Promise<SharedSpaceMemberResponseDto> {
    await this.requireRole(auth, spaceId, SharedSpaceRole.Owner);

    const existing = await this.sharedSpaceRepository.getMember(spaceId, dto.userId);
    if (existing) {
      throw new BadRequestException('User is already a member');
    }

    const member = await this.sharedSpaceRepository.addMember({
      spaceId,
      userId: dto.userId,
      role: dto.role ?? SharedSpaceRole.Viewer,
    });

    const members = await this.sharedSpaceRepository.getMembers(spaceId);
    const userInfo = members.find((m) => m.userId === dto.userId);

    return {
      userId: member.userId,
      name: userInfo?.name ?? '',
      email: userInfo?.email ?? '',
      role: member.role,
      joinedAt: member.joinedAt,
      profileImagePath: userInfo?.profileImagePath,
    };
  }

  async updateMember(
    auth: AuthDto,
    spaceId: string,
    userId: string,
    dto: SharedSpaceMemberUpdateDto,
  ): Promise<SharedSpaceMemberResponseDto> {
    await this.requireRole(auth, spaceId, SharedSpaceRole.Owner);

    if (userId === auth.user.id) {
      throw new BadRequestException('Cannot change your own role');
    }

    const member = await this.sharedSpaceRepository.updateMember(spaceId, userId, { role: dto.role });
    const members = await this.sharedSpaceRepository.getMembers(spaceId);
    const userInfo = members.find((m) => m.userId === userId);

    return {
      userId: member.userId,
      name: userInfo?.name ?? '',
      email: userInfo?.email ?? '',
      role: member.role,
      joinedAt: member.joinedAt,
      profileImagePath: userInfo?.profileImagePath,
    };
  }

  async removeMember(auth: AuthDto, spaceId: string, userId: string): Promise<void> {
    if (userId === auth.user.id) {
      // Users can always leave
      const member = await this.sharedSpaceRepository.getMember(spaceId, userId);
      if (!member) {
        throw new NotFoundException('Member not found');
      }
      if (member.role === SharedSpaceRole.Owner) {
        throw new BadRequestException('Owner cannot leave the space');
      }
      await this.sharedSpaceRepository.removeMember(spaceId, userId);
      return;
    }

    await this.requireRole(auth, spaceId, SharedSpaceRole.Owner);
    await this.sharedSpaceRepository.removeMember(spaceId, userId);
  }

  // -- Assets --

  async addAssets(auth: AuthDto, spaceId: string, dto: SharedSpaceAssetAddDto): Promise<void> {
    await this.requireRole(auth, spaceId, SharedSpaceRole.Editor);

    const values = dto.assetIds.map((assetId) => ({
      spaceId,
      assetId,
      addedById: auth.user.id,
    }));

    await this.sharedSpaceRepository.addAssets(values);
  }

  async removeAssets(auth: AuthDto, spaceId: string, dto: SharedSpaceAssetRemoveDto): Promise<void> {
    await this.requireRole(auth, spaceId, SharedSpaceRole.Editor);
    await this.sharedSpaceRepository.removeAssets(spaceId, dto.assetIds);
  }

  // -- Helpers --

  private async requireMembership(auth: AuthDto, spaceId: string): Promise<void> {
    const member = await this.sharedSpaceRepository.getMember(spaceId, auth.user.id);
    if (!member) {
      throw new ForbiddenException('Not a member of this space');
    }
  }

  private async requireRole(auth: AuthDto, spaceId: string, minimumRole: SharedSpaceRole): Promise<void> {
    const member = await this.sharedSpaceRepository.getMember(spaceId, auth.user.id);
    if (!member) {
      throw new ForbiddenException('Not a member of this space');
    }

    const roleHierarchy: Record<string, number> = {
      [SharedSpaceRole.Viewer]: 0,
      [SharedSpaceRole.Editor]: 1,
      [SharedSpaceRole.Owner]: 2,
    };

    if (roleHierarchy[member.role] < roleHierarchy[minimumRole]) {
      throw new ForbiddenException('Insufficient role');
    }
  }

  private mapSpace(space: {
    id: string;
    name: string;
    description: string | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  }): SharedSpaceResponseDto {
    return {
      id: space.id,
      name: space.name,
      description: space.description,
      createdById: space.createdById,
      createdAt: space.createdAt,
      updatedAt: space.updatedAt,
    };
  }
}
```

**Step 4: Register service**

Edit `server/src/services/index.ts`:

- Add `import { SharedSpaceService } from 'src/services/shared-space.service';`
- Add `SharedSpaceService` to the `services` array (after `SharedLinkService`)

**Step 5: Run tests**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts server/src/services/index.ts
git commit -m "feat(server): add shared space service with tests"
```

---

## Task 7: Controller

**Files:**

- Create: `server/src/controllers/shared-space.controller.ts`
- Modify: `server/src/controllers/index.ts` (register)

**Step 1: Create the controller**

Create `server/src/controllers/shared-space.controller.ts`:

```typescript
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  SharedSpaceAssetAddDto,
  SharedSpaceAssetRemoveDto,
  SharedSpaceCreateDto,
  SharedSpaceMemberCreateDto,
  SharedSpaceMemberResponseDto,
  SharedSpaceMemberUpdateDto,
  SharedSpaceResponseDto,
  SharedSpaceUpdateDto,
} from 'src/dtos/shared-space.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { SharedSpaceService } from 'src/services/shared-space.service';
import { UUIDParamDto } from 'src/validation';

class SpaceUserParamDto {
  @ValidateUUID()
  id!: string;

  @ValidateUUID()
  userId!: string;
}

@ApiTags(ApiTag.SharedSpaces)
@Controller('shared-spaces')
export class SharedSpaceController {
  constructor(private service: SharedSpaceService) {}

  @Post()
  @Authenticated({ permission: Permission.SharedSpaceCreate })
  @Endpoint({
    summary: 'Create a shared space',
    description: 'Create a new shared space for collaborative photo sharing.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  create(@Auth() auth: AuthDto, @Body() dto: SharedSpaceCreateDto): Promise<SharedSpaceResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  @Authenticated({ permission: Permission.SharedSpaceRead })
  @Endpoint({
    summary: 'List shared spaces',
    description: 'List all shared spaces the user is a member of.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  getAll(@Auth() auth: AuthDto): Promise<SharedSpaceResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.SharedSpaceRead })
  @Endpoint({
    summary: 'Get shared space',
    description: 'Get details of a shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  get(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<SharedSpaceResponseDto> {
    return this.service.get(auth, id);
  }

  @Patch(':id')
  @Authenticated({ permission: Permission.SharedSpaceUpdate })
  @Endpoint({
    summary: 'Update shared space',
    description: 'Update name or description of a shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  update(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: SharedSpaceUpdateDto,
  ): Promise<SharedSpaceResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.SharedSpaceDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete shared space',
    description: 'Delete a shared space (owner only).',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  remove(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  // -- Members --

  @Get(':id/members')
  @Authenticated({ permission: Permission.SharedSpaceRead })
  @Endpoint({
    summary: 'List space members',
    description: 'List all members of a shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  getMembers(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<SharedSpaceMemberResponseDto[]> {
    return this.service.getMembers(auth, id);
  }

  @Post(':id/members')
  @Authenticated({ permission: Permission.SharedSpaceMemberCreate })
  @Endpoint({
    summary: 'Add space member',
    description: 'Add a user to the shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  addMember(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: SharedSpaceMemberCreateDto,
  ): Promise<SharedSpaceMemberResponseDto> {
    return this.service.addMember(auth, id, dto);
  }

  @Patch(':id/members/:userId')
  @Authenticated({ permission: Permission.SharedSpaceMemberUpdate })
  @Endpoint({
    summary: 'Update space member',
    description: "Change a member's role in the shared space.",
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  updateMember(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: SharedSpaceMemberUpdateDto,
  ): Promise<SharedSpaceMemberResponseDto> {
    return this.service.updateMember(auth, id, userId, dto);
  }

  @Delete(':id/members/:userId')
  @Authenticated({ permission: Permission.SharedSpaceMemberDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Remove space member',
    description: 'Remove a member from the shared space, or leave the space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  removeMember(@Auth() auth: AuthDto, @Param('id') id: string, @Param('userId') userId: string): Promise<void> {
    return this.service.removeMember(auth, id, userId);
  }

  // -- Assets --

  @Post(':id/assets')
  @Authenticated({ permission: Permission.SharedSpaceAssetCreate })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Add assets to space',
    description: 'Link assets into the shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  addAssets(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto, @Body() dto: SharedSpaceAssetAddDto): Promise<void> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  @Authenticated({ permission: Permission.SharedSpaceAssetDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Remove assets from space',
    description: 'Unlink assets from the shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  removeAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: SharedSpaceAssetRemoveDto,
  ): Promise<void> {
    return this.service.removeAssets(auth, id, dto);
  }
}
```

**Step 2: Register controller**

Edit `server/src/controllers/index.ts`:

- Add `import { SharedSpaceController } from 'src/controllers/shared-space.controller';`
- Add `SharedSpaceController` to the `controllers` array (after `SharedLinkController`)

**Step 3: Build server and check for errors**

```bash
cd server && pnpm build
```

Expected: Clean build

**Step 4: Commit**

```bash
git add server/src/controllers/shared-space.controller.ts server/src/controllers/index.ts
git commit -m "feat(server): add shared space controller and API endpoints"
```

---

## Task 8: OpenAPI Regeneration

**Files:**

- Modified by codegen: `open-api/`, `web/src/lib/`, `mobile/openapi/`

**Step 1: Build server and regenerate OpenAPI specs**

```bash
cd server && pnpm build && pnpm sync:open-api
```

**Step 2: Regenerate TypeScript SDK**

```bash
make open-api-typescript
```

**Step 3: Regenerate Dart client**

```bash
make open-api-dart
```

**Step 4: Verify SDK contains new endpoints**

```bash
grep -r "SharedSpace\|shared-spaces\|sharedSpace" open-api/typescript-sdk/src/ | head -10
```

Expected: Generated types and functions for shared spaces

**Step 5: Commit**

```bash
git add open-api/ web/src/lib/
git commit -m "chore: regenerate OpenAPI specs for shared spaces"
```

---

## Task 9: Web UI — Routes and Navigation

**Files:**

- Modify: `web/src/lib/route.ts` (add route)
- Modify: `web/src/lib/components/shared-components/side-bar/user-sidebar.svelte` (add nav item)
- Create: `web/src/routes/(user)/spaces/+page.ts`
- Create: `web/src/routes/(user)/spaces/+page.svelte`
- Create: `web/src/routes/(user)/spaces/[spaceId]/+page.ts`
- Create: `web/src/routes/(user)/spaces/[spaceId]/+page.svelte`

**Step 1: Add route helper**

Edit `web/src/lib/route.ts`. After the `sharing` entry, add:

```typescript
  spaces: () => '/spaces',
  viewSpace: ({ id }: { id: string }) => `/spaces/${id}`,
```

**Step 2: Add sidebar navigation**

Edit `web/src/lib/components/shared-components/side-bar/user-sidebar.svelte`.

Add import for the spaces icon:

```typescript
import { mdiAccountGroup, mdiAccountGroupOutline } from '@mdi/js';
```

After the "Sharing" `NavbarItem`, add:

```svelte
  <NavbarItem
    title={$t('spaces')}
    href={Route.spaces()}
    icon={mdiAccountGroupOutline}
    activeIcon={mdiAccountGroup}
  />
```

**Step 3: Add i18n key**

Search for the i18n file and add `"spaces": "Spaces"` to the English locale. The i18n files are in `i18n/`. Add the key to `i18n/en.json`.

**Step 4: Create space list page load function**

Create `web/src/routes/(user)/spaces/+page.ts`:

```typescript
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getSharedSpaces } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  const spaces = await getSharedSpaces();
  const $t = await getFormatter();

  return {
    spaces,
    meta: {
      title: $t('spaces'),
    },
  };
}) satisfies PageLoad;
```

**Step 5: Create space list page**

Create `web/src/routes/(user)/spaces/+page.svelte`:

```svelte
<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import { Route } from '$lib/route';
  import { createSharedSpace, type SharedSpaceResponseDto } from '@immich/sdk';
  import { Button, modalManager } from '@immich/ui';
  import { mdiPlus } from '@mdi/js';
  import { goto } from '$app/navigation';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let spaces: SharedSpaceResponseDto[] = $state(data.spaces);

  const handleCreate = async () => {
    const name = await modalManager.showDialog({
      title: $t('create_space'),
      prompt: $t('create_space_description'),
      inputLabel: $t('name'),
    });

    if (!name || typeof name !== 'string') {
      return;
    }

    const space = await createSharedSpace({ sharedSpaceCreateDto: { name } });
    await goto(Route.viewSpace({ id: space.id }));
  };
</script>

<UserPageLayout title={data.meta.title}>
  {#snippet buttons()}
    <Button shape="round" size="small" leadingIcon={mdiPlus} onclick={handleCreate}>
      {$t('create_space')}
    </Button>
  {/snippet}

  {#if spaces.length === 0}
    <EmptyPlaceholder text={$t('no_spaces_message')} onClick={handleCreate} class="mt-10 mx-auto" />
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
      {#each spaces as space (space.id)}
        <a
          href={Route.viewSpace({ id: space.id })}
          class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-900 p-5 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
        >
          <h3 class="text-lg font-medium text-immich-fg dark:text-immich-dark-fg">{space.name}</h3>
          {#if space.description}
            <p class="text-sm text-immich-fg/75 dark:text-immich-dark-fg/75 mt-1">{space.description}</p>
          {/if}
          <div class="flex gap-4 mt-3 text-sm text-immich-fg/60 dark:text-immich-dark-fg/60">
            {#if space.memberCount != null}
              <span>{space.memberCount} {$t('members')}</span>
            {/if}
            {#if space.assetCount != null}
              <span>{space.assetCount} {$t('photos')}</span>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  {/if}
</UserPageLayout>
```

**Step 6: Create space detail page load function**

Create `web/src/routes/(user)/spaces/[spaceId]/+page.ts`:

```typescript
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getSharedSpace, getSharedSpaceMembers } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url, params }) => {
  await authenticate(url);
  const [space, members] = await Promise.all([
    getSharedSpace({ id: params.spaceId }),
    getSharedSpaceMembers({ id: params.spaceId }),
  ]);
  const $t = await getFormatter();

  return {
    space,
    members,
    meta: {
      title: space.name,
    },
  };
}) satisfies PageLoad;
```

**Step 7: Create space detail page**

Create `web/src/routes/(user)/spaces/[spaceId]/+page.svelte`:

```svelte
<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { Route } from '$lib/route';
  import {
    deleteSharedSpace,
    removeSharedSpaceMember,
    type SharedSpaceMemberResponseDto,
    type SharedSpaceResponseDto,
  } from '@immich/sdk';
  import { Button, IconButton, modalManager, Text } from '@immich/ui';
  import { mdiArrowLeft, mdiClose, mdiCog, mdiAccountPlus } from '@mdi/js';
  import { goto } from '$app/navigation';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let space: SharedSpaceResponseDto = $state(data.space);
  let members: SharedSpaceMemberResponseDto[] = $state(data.members);

  const handleDelete = async () => {
    const confirmed = await modalManager.showDialog({
      title: $t('delete_space'),
      prompt: $t('delete_space_confirmation', { values: { name: space.name } }),
    });

    if (!confirmed) {
      return;
    }

    await deleteSharedSpace({ id: space.id });
    await goto(Route.spaces());
  };
</script>

<UserPageLayout title={space.name}>
  {#snippet buttons()}
    <div class="flex gap-2">
      <Button shape="round" size="small" leadingIcon={mdiArrowLeft} href={Route.spaces()}>
        {$t('back')}
      </Button>
    </div>
  {/snippet}

  <div class="mt-4">
    {#if space.description}
      <p class="text-sm text-immich-fg/75 dark:text-immich-dark-fg/75 mb-4">{space.description}</p>
    {/if}

    <div class="flex gap-4 text-sm text-immich-fg/60 dark:text-immich-dark-fg/60 mb-6">
      <span>{space.assetCount ?? 0} {$t('photos')}</span>
      <span>{members.length} {$t('members')}</span>
    </div>

    <!-- Members section -->
    <section>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-medium">{$t('members')}</h2>
      </div>

      {#each members as member (member.userId)}
        <div class="flex items-center gap-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <UserAvatar user={{ name: member.name, email: member.email, profileImagePath: member.profileImagePath ?? '' }} size="md" />
          <div class="flex-1">
            <Text fontWeight="medium">{member.name}</Text>
            <Text size="tiny" color="muted">{member.email}</Text>
          </div>
          <span class="text-sm text-immich-fg/60 dark:text-immich-dark-fg/60 capitalize">{member.role}</span>
        </div>
      {/each}
    </section>
  </div>
</UserPageLayout>
```

**Step 8: Commit**

```bash
git add web/src/lib/route.ts web/src/lib/components/shared-components/side-bar/user-sidebar.svelte web/src/routes/\(user\)/spaces/ i18n/en.json
git commit -m "feat(web): add shared spaces pages and navigation"
```

---

## Task 10: Web UI — Build and Lint Check

**Step 1: Build web**

```bash
make build-sdk && make build-web
```

Expected: Clean build

**Step 2: Lint and format**

```bash
make lint-web && make format-web && make check-web
```

Expected: No errors

**Step 3: Fix any issues found**

Address lint/type/format errors.

**Step 4: Commit fixes if any**

```bash
git add -u
git commit -m "fix(web): address lint and type errors in shared spaces"
```

---

## Task 11: Mobile — Data Layer

**Files:**

- Create: `mobile/lib/infrastructure/entities/shared_space.entity.dart`
- Create: `mobile/lib/repositories/shared_space_api.repository.dart`
- Create: `mobile/lib/domain/services/shared_space.service.dart`
- Create: `mobile/lib/providers/shared_space.provider.dart`

**Step 1: Create Drift entity**

Create `mobile/lib/infrastructure/entities/shared_space.entity.dart`:

```dart
import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class SharedSpaceEntity extends Table with DriftDefaultsMixin {
  const SharedSpaceEntity();

  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get description => text().nullable()();
  TextColumn get createdById => text().references(UserEntity, #id, onDelete: KeyAction.cascade)();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class SharedSpaceMemberEntity extends Table with DriftDefaultsMixin {
  const SharedSpaceMemberEntity();

  TextColumn get spaceId => text().references(SharedSpaceEntity, #id, onDelete: KeyAction.cascade)();
  TextColumn get userId => text().references(UserEntity, #id, onDelete: KeyAction.cascade)();
  TextColumn get role => text().withDefault(const Constant('viewer'))();
  DateTimeColumn get joinedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {spaceId, userId};
}
```

**Step 2: Create API repository**

Create `mobile/lib/repositories/shared_space_api.repository.dart`:

```dart
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:openapi/api.dart';

final sharedSpaceApiRepositoryProvider = Provider(
  (ref) => SharedSpaceApiRepository(ref.watch(apiServiceProvider).sharedSpacesApi),
);

class SharedSpaceApiRepository extends ApiRepository {
  final SharedSpacesApi _api;

  SharedSpaceApiRepository(this._api);

  Future<List<SharedSpaceResponseDto>> getAll() async {
    final response = await checkNull(_api.getSharedSpaces());
    return response;
  }

  Future<SharedSpaceResponseDto> get(String id) async {
    return await checkNull(_api.getSharedSpace(id));
  }

  Future<SharedSpaceResponseDto> create(String name, {String? description}) async {
    return await checkNull(
      _api.createSharedSpace(SharedSpaceCreateDto(name: name, description: description)),
    );
  }

  Future<void> delete(String id) => _api.deleteSharedSpace(id);

  Future<List<SharedSpaceMemberResponseDto>> getMembers(String id) async {
    final response = await checkNull(_api.getSharedSpaceMembers(id));
    return response;
  }

  Future<SharedSpaceMemberResponseDto> addMember(String spaceId, String userId, {String? role}) async {
    return await checkNull(
      _api.addSharedSpaceMember(spaceId, SharedSpaceMemberCreateDto(userId: userId, role: role)),
    );
  }

  Future<void> removeMember(String spaceId, String userId) => _api.removeSharedSpaceMember(spaceId, userId);
}
```

**Step 3: Create provider**

Create `mobile/lib/providers/shared_space.provider.dart`:

```dart
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/repositories/shared_space_api.repository.dart';
import 'package:openapi/api.dart';

final sharedSpacesProvider = FutureProvider.autoDispose<List<SharedSpaceResponseDto>>((ref) async {
  return ref.watch(sharedSpaceApiRepositoryProvider).getAll();
});

final sharedSpaceProvider = FutureProvider.autoDispose.family<SharedSpaceResponseDto, String>((ref, id) async {
  return ref.watch(sharedSpaceApiRepositoryProvider).get(id);
});

final sharedSpaceMembersProvider = FutureProvider.autoDispose.family<List<SharedSpaceMemberResponseDto>, String>((ref, spaceId) async {
  return ref.watch(sharedSpaceApiRepositoryProvider).getMembers(spaceId);
});
```

**Step 4: Commit**

```bash
git add mobile/lib/infrastructure/entities/shared_space.entity.dart mobile/lib/repositories/shared_space_api.repository.dart mobile/lib/providers/shared_space.provider.dart
git commit -m "feat(mobile): add shared space data layer and providers"
```

---

## Task 12: Mobile — UI Pages

**Files:**

- Create: `mobile/lib/pages/library/spaces/spaces.page.dart`
- Create: `mobile/lib/pages/library/spaces/space_detail.page.dart`
- Modify: `mobile/lib/routing/router.dart` (add routes)
- Modify: `mobile/lib/pages/library/library.page.dart` (add navigation entry)

**Step 1: Create spaces list page**

Create `mobile/lib/pages/library/spaces/spaces.page.dart`:

```dart
import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/shared_space.provider.dart';
import 'package:immich_mobile/routing/router.dart';

@RoutePage()
class SpacesPage extends HookConsumerWidget {
  const SpacesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final spacesAsync = ref.watch(sharedSpacesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Spaces')),
      body: spacesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('Error: $error')),
        data: (spaces) {
          if (spaces.isEmpty) {
            return const Center(child: Text('No spaces yet'));
          }
          return ListView.builder(
            itemCount: spaces.length,
            itemBuilder: (context, index) {
              final space = spaces[index];
              return ListTile(
                title: Text(space.name),
                subtitle: space.description != null ? Text(space.description!) : null,
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.pushRoute(SpaceDetailRoute(spaceId: space.id)),
              );
            },
          );
        },
      ),
    );
  }
}
```

**Step 2: Create space detail page**

Create `mobile/lib/pages/library/spaces/space_detail.page.dart`:

```dart
import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/shared_space.provider.dart';

@RoutePage()
class SpaceDetailPage extends HookConsumerWidget {
  final String spaceId;

  const SpaceDetailPage({super.key, required this.spaceId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final spaceAsync = ref.watch(sharedSpaceProvider(spaceId));
    final membersAsync = ref.watch(sharedSpaceMembersProvider(spaceId));

    return Scaffold(
      appBar: AppBar(
        title: spaceAsync.when(
          data: (space) => Text(space.name),
          loading: () => const Text('Loading...'),
          error: (_, __) => const Text('Error'),
        ),
      ),
      body: spaceAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('Error: $error')),
        data: (space) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (space.description != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(space.description!, style: Theme.of(context).textTheme.bodyMedium),
                ),
              Text('Members', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              membersAsync.when(
                loading: () => const CircularProgressIndicator(),
                error: (error, _) => Text('Error: $error'),
                data: (members) => Column(
                  children: members.map((member) => ListTile(
                    title: Text(member.name),
                    subtitle: Text(member.email),
                    trailing: Text(member.role, style: Theme.of(context).textTheme.bodySmall),
                  )).toList(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

**Step 3: Register routes**

Edit `mobile/lib/routing/router.dart`:

- Add imports for `SpacesPage` and `SpaceDetailPage`
- Add routes in the route list:

```dart
CustomRoute(
  page: SpacesRoute.page,
  guards: [_authGuard, _duplicateGuard],
  transitionsBuilder: TransitionsBuilders.slideLeft,
),
AutoRoute(
  page: SpaceDetailRoute.page,
  guards: [_authGuard, _duplicateGuard],
),
```

**Step 4: Add to Library page**

Edit `mobile/lib/pages/library/library.page.dart`:

- Add a "Spaces" button/card in the Quick Access section that navigates to `SpacesRoute()`

**Step 5: Run code generation**

```bash
cd mobile && dart run build_runner build --delete-conflicting-outputs
```

**Step 6: Commit**

```bash
git add mobile/lib/pages/library/spaces/ mobile/lib/routing/ mobile/lib/pages/library/library.page.dart
git commit -m "feat(mobile): add shared spaces UI pages and navigation"
```

---

## Task 13: Server Tests — Full Coverage

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts` (expand tests)
- Modify: `server/test/small.factory.ts` (add factory)

**Step 1: Add factory methods**

Edit `server/test/small.factory.ts`. Add:

```typescript
const sharedSpaceFactory = (data: Partial<SharedSpace> = {}): SharedSpace => ({
  id: newUuid(),
  name: 'Test Space',
  description: null,
  createdById: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  createId: newUuid(),
  updateId: newUuid(),
  ...data,
});

const sharedSpaceMemberFactory = (data: Partial<SharedSpaceMember> = {}): SharedSpaceMember => ({
  spaceId: newUuid(),
  userId: newUuid(),
  role: 'viewer',
  joinedAt: newDate(),
  ...data,
});
```

Add `sharedSpace: sharedSpaceFactory` and `sharedSpaceMember: sharedSpaceMemberFactory` to the `factory` export object.

**Step 2: Expand service tests**

Add comprehensive tests to `server/src/services/shared-space.service.spec.ts` covering:

- `create`: creates space and adds creator as owner
- `getAll`: returns user's spaces
- `get`: returns space if member, throws if not
- `update`: allows owner, rejects non-owner
- `remove`: allows owner, rejects non-owner
- `addMember`: adds member, rejects duplicate
- `updateMember`: changes role, rejects self-update
- `removeMember`: owner can remove others, member can leave, owner cannot leave
- `addAssets`: requires editor role
- `removeAssets`: requires editor role

**Step 3: Run tests**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: All PASS

**Step 4: Commit**

```bash
git add server/src/services/shared-space.service.spec.ts server/test/small.factory.ts
git commit -m "test(server): add comprehensive shared space service tests"
```

---

## Task 14: Lint, Format, Type Check — Full Stack

**Step 1: Server checks**

```bash
make lint-server && make format-server && make check-server
```

**Step 2: Web checks**

```bash
make lint-web && make format-web && make check-web
```

**Step 3: Fix any issues**

Address all lint/format/type errors across both packages.

**Step 4: Run all server tests**

```bash
cd server && pnpm test -- --run
```

Expected: All tests pass including new shared space tests.

**Step 5: Commit fixes**

```bash
git add -u
git commit -m "fix: address lint and formatting issues in shared spaces"
```

---

## Task 15: Create PR

**Step 1: Push branch and create PR**

```bash
git push -u origin HEAD
gh pr create --title "feat: add shared spaces (Phase 1 — Family Sharing)" --label "changelog:feat" --body "$(cat <<'EOF'
## Summary
- Adds Shared Spaces — virtual libraries where multiple users can contribute, browse, and view photos together
- New database tables: shared_space, shared_space_member, shared_space_asset (reference-based, zero storage duplication)
- Full CRUD API with owner/editor/viewer role-based permissions
- Web UI: new Spaces section in sidebar, space list and detail pages
- Mobile: new Spaces entry in Library tab, list and detail screens
- Addresses upstream issue #12614 (Better Sharing — 828 reactions, feature-frozen upstream)

## Design doc
See docs/plans/2026-03-05-family-sharing-design.md

## Test plan
- [ ] Server unit tests pass (`cd server && pnpm test -- --run`)
- [ ] Server builds cleanly (`make build-server`)
- [ ] Web builds cleanly (`make build-web`)
- [ ] Lint passes (`make lint-all`)
- [ ] Type check passes (`make check-all`)
- [ ] Manual test: create space, invite member, add assets, verify member sees them
- [ ] Manual test: role enforcement (viewer can't add assets, non-owner can't delete space)
EOF
)"
```

**Step 2: Wait for CI**

```bash
gh pr checks <number> --watch
```

**Step 3: Fix any CI failures and push fixes**
