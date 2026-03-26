# Auto-Classification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Auto-tag and optionally auto-archive assets based on CLIP similarity to user-defined text prompts.

**Architecture:** Two new DB tables (`classification_category`, `classification_prompt_embedding`), a new `ClassificationService` extending `BaseService`, a `ClassificationRepository` for queries, a `ClassificationController` for CRUD API, and a new Settings UI section. Classification jobs chain after SmartSearch via `job.service.ts` `onDone`.

**Tech Stack:** NestJS, Kysely, PostgreSQL (pgvector), BullMQ, SvelteKit, @immich/ui

**Design doc:** `docs/plans/2026-03-26-auto-classification-design.md`

**Review fixes applied (round 1):** Fixed `Generated`/`InjectKysely`/`GenerateSql` import sources, added `JobItem` type union entries, added controller/queue registration, fixed `upsertAssetIds` call signature, fixed `@OnEvent` decorator syntax, used `NotFoundException` instead of generic `Error`, added `mapCategory` helper to reduce duplication, fixed N+1 query in `getCategories`.

**Review fixes applied (round 2):** Added repository/service index registration, fixed `ArgOf`/`OnEvent` import paths, fixed automock constructor args, added `@IsIn` validator on action field, added `@ArrayMinSize(1)` on prompts, added `@ApiProperty` to response DTO, added FK index on `categoryId`, added medium tests task, expanded unit/web test lists.

---

### Task 1: Schema — Table Definitions

**Files:**

- Create: `server/src/schema/tables/classification-category.table.ts`
- Create: `server/src/schema/tables/classification-prompt-embedding.table.ts`
- Modify: `server/src/schema/tables/asset-job-status.table.ts:22` (add `classifiedAt`)
- Modify: `server/src/schema/index.ts:92-162` (register tables in `ImmichDatabase.tables`)
- Modify: `server/src/schema/index.ts:194-294` (add to `DB` interface)

**Step 1: Create `classification-category.table.ts`**

Note: `Generated` is imported from `@immich/sql-tools` (not `kysely`) — this is the codebase convention for table definitions.

```typescript
import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  Unique,
  UpdateDateColumn,
  UpdatedAtTrigger,
  UpdateIdColumn,
} from '@immich/sql-tools';
import { TagTable } from 'src/schema/tables/tag.table';
import { UserTable } from 'src/schema/tables/user.table';

@Table('classification_category')
@UpdatedAtTrigger('classification_category_updatedAt')
@Unique({ columns: ['userId', 'name'] })
export class ClassificationCategoryTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => UserTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', index: false })
  userId!: string;

  @Column()
  name!: string;

  @Column({ type: 'real', default: 0.28 })
  similarity!: Generated<number>;

  @Column({ type: 'character varying', default: "'tag'" })
  action!: Generated<string>;

  @Column({ type: 'boolean', default: true })
  enabled!: Generated<boolean>;

  @ForeignKeyColumn(() => TagTable, { nullable: true, onDelete: 'SET NULL' })
  tagId!: string | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
```

**Step 2: Create `classification-prompt-embedding.table.ts`**

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
import { ClassificationCategoryTable } from 'src/schema/tables/classification-category.table';

@Table('classification_prompt_embedding')
export class ClassificationPromptEmbeddingTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => ClassificationCategoryTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  categoryId!: string;

  @Column({ type: 'text' })
  prompt!: string;

  @Column({ type: 'vector', length: 512, storage: 'external', synchronize: false })
  embedding!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;
}
```

**Step 3: Add `classifiedAt` to `asset-job-status.table.ts`**

After line 22 (`petsDetectedAt`), add:

```typescript
  @Column({ type: 'timestamp with time zone', nullable: true })
  classifiedAt!: Timestamp | null;
```

**Step 4: Register tables in `server/src/schema/index.ts`**

Import the two new table classes at the top of the file. Add them to both:

- The `tables` array (around line 92-162), alphabetically:

```typescript
    ClassificationCategoryTable,
    ClassificationPromptEmbeddingTable,
```

- The `DB` interface (around line 194-294):

```typescript
classification_category: ClassificationCategoryTable;
classification_prompt_embedding: ClassificationPromptEmbeddingTable;
```

**Step 5: Commit**

```
feat(server): add classification schema tables
```

---

### Task 2: Database Migration

**Files:**

- Create: `server/src/schema/migrations-gallery/1776000000000-AddClassificationTables.ts`

**Step 1: Create the migration file**

```typescript
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // classification_category table
  await sql`
    CREATE TABLE "classification_category" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      "userId" uuid NOT NULL REFERENCES "user"("id") ON UPDATE CASCADE ON DELETE CASCADE,
      "name" character varying NOT NULL,
      "similarity" real NOT NULL DEFAULT 0.28,
      "action" character varying NOT NULL DEFAULT 'tag',
      "enabled" boolean NOT NULL DEFAULT true,
      "tagId" uuid REFERENCES "tag"("id") ON DELETE SET NULL,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
      CONSTRAINT "UQ_classification_category_userId_name" UNIQUE ("userId", "name")
    )
  `.execute(db);

  await sql`
    CREATE INDEX "IDX_classification_category_updateId" ON "classification_category" ("updateId")
  `.execute(db);

  await sql`
    CREATE TRIGGER "classification_category_updatedAt"
    BEFORE UPDATE ON "classification_category"
    FOR EACH ROW EXECUTE FUNCTION updated_at('updatedAt')
  `.execute(db);

  // classification_prompt_embedding table
  await sql`
    CREATE TABLE "classification_prompt_embedding" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      "categoryId" uuid NOT NULL REFERENCES "classification_category"("id") ON UPDATE CASCADE ON DELETE CASCADE,
      "prompt" text NOT NULL,
      "embedding" vector(512) NOT NULL,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
    )
  `.execute(db);

  // Index on FK column (PostgreSQL does not auto-index FK columns)
  await sql`
    CREATE INDEX "IDX_classification_prompt_embedding_categoryId" ON "classification_prompt_embedding" ("categoryId")
  `.execute(db);

  // classifiedAt column on asset_job_status
  await sql`
    ALTER TABLE "asset_job_status" ADD "classifiedAt" timestamp with time zone
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_job_status" DROP COLUMN "classifiedAt"`.execute(db);
  await sql`DROP TABLE IF EXISTS "classification_prompt_embedding"`.execute(db);
  await sql`DROP TABLE IF EXISTS "classification_category"`.execute(db);
}
```

**Step 2: Verify migration compiles**

Run: `cd server && npx tsc --noEmit`

**Step 3: Commit**

```
feat(server): add classification database migration
```

---

### Task 3: Enums, Job Types, and Queue Registration

**Files:**

- Modify: `server/src/enum.ts:596-617` (add `QueueName.Classification`)
- Modify: `server/src/enum.ts:628-723` (add `JobName.AssetClassifyQueueAll` and `JobName.AssetClassify`)
- Modify: `server/src/enum.ts` (add `ApiTag.Classification`)
- Modify: `server/src/types.ts:337-457` (add `JobItem` union entries)

**Step 1: Add queue name**

In the `QueueName` enum (after `StorageBackendMigration`), add:

```typescript
  Classification = 'classification',
```

**Step 2: Add job names**

In the `JobName` enum (after `SharedSpaceBulkAddAssets`), add:

```typescript
  // Classification
  AssetClassifyQueueAll = 'AssetClassifyQueueAll',
  AssetClassify = 'AssetClassify',
```

**Step 3: Add API tag**

In the `ApiTag` enum, add:

```typescript
  Classification = 'Classification',
```

**Step 4: Add `JobItem` union entries in `server/src/types.ts`**

Before the closing semicolon of the `JobItem` type union (after the `SharedSpaceBulkAddAssets` entry around line 457), add:

```typescript
  // Classification
  | { name: JobName.AssetClassifyQueueAll; data: { userId?: string } }
  | { name: JobName.AssetClassify; data: IEntityJob }
```

Import `IEntityJob` is already in scope since it's used elsewhere in the file.

**Step 5: Commit**

```
feat(server): add classification enums, job types, and API tag
```

---

### Task 4: DTOs

**Files:**

- Create: `server/src/dtos/classification.dto.ts`

**Step 1: Create the DTO file**

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ClassificationCategoryCreateDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Category name' })
  name!: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  @ApiProperty({ description: 'Text prompts for CLIP matching', type: [String] })
  prompts!: string[];

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  @ApiPropertyOptional({ description: 'Similarity threshold (0-1, higher = stricter)', default: 0.28 })
  similarity?: number;

  @IsString()
  @IsIn(['tag', 'tag_and_archive'])
  @IsOptional()
  @ApiPropertyOptional({ description: 'Action on match', default: 'tag', enum: ['tag', 'tag_and_archive'] })
  action?: string;
}

export class ClassificationCategoryUpdateDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Category name' })
  name?: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  @IsOptional()
  @ApiPropertyOptional({ description: 'Text prompts for CLIP matching', type: [String] })
  prompts?: string[];

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  @ApiPropertyOptional({ description: 'Similarity threshold (0-1, higher = stricter)' })
  similarity?: number;

  @IsString()
  @IsIn(['tag', 'tag_and_archive'])
  @IsOptional()
  @ApiPropertyOptional({ description: 'Action on match', enum: ['tag', 'tag_and_archive'] })
  action?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Enable or disable category' })
  enabled?: boolean;
}

export class ClassificationCategoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: [String] })
  prompts!: string[];

  @ApiProperty()
  similarity!: number;

  @ApiProperty({ enum: ['tag', 'tag_and_archive'] })
  action!: string;

  @ApiProperty()
  enabled!: boolean;

  @ApiProperty({ nullable: true, type: String })
  tagId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
```

**Step 2: Commit**

```
feat(server): add classification DTOs
```

---

### Task 5: Repository

**Files:**

- Create: `server/src/repositories/classification.repository.ts`

**Step 1: Create the repository**

Note: `InjectKysely` is imported from `nestjs-kysely` (not `@immich/sql-tools`). `GenerateSql` and `DummyValue` are imported from `src/decorators` (not `src/sql-tools/*`).

```typescript
import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { Insertable, Kysely, Updateable } from 'kysely';
import { DB } from 'src/schema';
import { ClassificationCategoryTable } from 'src/schema/tables/classification-category.table';
import { ClassificationPromptEmbeddingTable } from 'src/schema/tables/classification-prompt-embedding.table';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DummyValue, GenerateSql } from 'src/decorators';

@Injectable()
export class ClassificationRepository {
  constructor(
    @InjectKysely() private db: Kysely<DB>,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(ClassificationRepository.name);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getCategories(userId: string) {
    return this.db
      .selectFrom('classification_category')
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('name', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getCategoriesWithPrompts(userId: string) {
    return this.db
      .selectFrom('classification_category as c')
      .leftJoin('classification_prompt_embedding as p', 'p.categoryId', 'c.id')
      .select([
        'c.id',
        'c.name',
        'c.similarity',
        'c.action',
        'c.enabled',
        'c.tagId',
        'c.createdAt',
        'c.updatedAt',
        'p.prompt',
      ])
      .where('c.userId', '=', userId)
      .orderBy('c.name', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getCategory(id: string) {
    return this.db.selectFrom('classification_category').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async createCategory(values: Insertable<ClassificationCategoryTable>) {
    return this.db.insertInto('classification_category').values(values).returningAll().executeTakeFirstOrThrow();
  }

  async updateCategory(id: string, values: Updateable<ClassificationCategoryTable>) {
    return this.db
      .updateTable('classification_category')
      .set(values)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async deleteCategory(id: string) {
    await this.db.deleteFrom('classification_category').where('id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getPromptEmbeddings(categoryId: string) {
    return this.db
      .selectFrom('classification_prompt_embedding')
      .selectAll()
      .where('categoryId', '=', categoryId)
      .execute();
  }

  getAllCategories() {
    return this.db.selectFrom('classification_category').selectAll().execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getEnabledCategoriesWithEmbeddings(userId: string) {
    return this.db
      .selectFrom('classification_category as c')
      .innerJoin('classification_prompt_embedding as p', 'p.categoryId', 'c.id')
      .select([
        'c.id as categoryId',
        'c.name',
        'c.similarity',
        'c.action',
        'c.tagId',
        'p.id as promptId',
        'p.prompt',
        'p.embedding',
      ])
      .where('c.userId', '=', userId)
      .where('c.enabled', '=', true)
      .execute();
  }

  async upsertPromptEmbedding(values: Insertable<ClassificationPromptEmbeddingTable>) {
    return this.db
      .insertInto('classification_prompt_embedding')
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async deletePromptEmbeddingsByCategory(categoryId: string) {
    await this.db.deleteFrom('classification_prompt_embedding').where('categoryId', '=', categoryId).execute();
  }

  async resetClassifiedAt(userId: string) {
    await this.db
      .updateTable('asset_job_status')
      .set({ classifiedAt: null })
      .where('assetId', 'in', this.db.selectFrom('asset').select('id').where('ownerId', '=', userId))
      .execute();
  }

  async setClassifiedAt(assetId: string) {
    await this.db
      .updateTable('asset_job_status')
      .set({ classifiedAt: new Date().toISOString() })
      .where('assetId', '=', assetId)
      .execute();
  }

  streamUnclassifiedAssets(userId?: string) {
    let query = this.db
      .selectFrom('asset_job_status as ajs')
      .innerJoin('asset as a', 'a.id', 'ajs.assetId')
      .innerJoin('smart_search as ss', 'ss.assetId', 'a.id')
      .select(['a.id', 'a.ownerId'])
      .where('ajs.classifiedAt', 'is', null);

    if (userId) {
      query = query.where('a.ownerId', '=', userId);
    }

    return query.stream();
  }
}
```

**Step 2: Register in `server/src/repositories/index.ts`**

Add import and add `ClassificationRepository` to the `repositories` array (alphabetically after `ConfigRepository`). Without this, NestJS dependency injection will fail at startup.

```typescript
import { ClassificationRepository } from 'src/repositories/classification.repository';
```

**Step 3: Commit**

```
feat(server): add classification repository
```

---

### Task 6: Register Repository in BaseService

**Files:**

- Modify: `server/src/services/base.service.ts`
- Modify: `server/test/utils.ts`

**Step 1: Add to BaseService**

Three changes in `server/src/services/base.service.ts`:

1. Add import at top (alphabetically):

```typescript
import { ClassificationRepository } from 'src/repositories/classification.repository';
```

2. Add `ClassificationRepository` to the `BASE_SERVICE_DEPENDENCIES` array (alphabetically — after `ConfigRepository`, before `CronRepository`).

3. Add to the `BaseService` constructor (must be in the same position as the array — after `configRepository`, before `cronRepository`):

```typescript
    protected classificationRepository: ClassificationRepository,
```

**Step 2: Add to test utils**

Three changes in `server/test/utils.ts`:

1. Add import:

```typescript
import { ClassificationRepository } from 'src/repositories/classification.repository';
```

2. Add to the `ServiceOverrides` type (alphabetically after `config`):

```typescript
classification: ClassificationRepository;
```

3. Add to `getMocks` function (alphabetically after `config`):

```typescript
  classification: automock(ClassificationRepository, { args: [, loggerMock], strict: false }),
```

Note: The constructor calls `this.logger.setContext()`, so a logger mock must be provided via `args`. This matches the pattern used for `DatabaseRepository`, `CronRepository`, etc.

4. Add to the `newTestService` constructor invocation (same position as in `BASE_SERVICE_DEPENDENCIES`).

**CRITICAL:** The positional order in the constructor must match `BASE_SERVICE_DEPENDENCIES` exactly. Count the position where `ClassificationRepository` was inserted in the array and use the same position in all three places.

**Step 3: Commit**

```
feat(server): register classification repository in BaseService
```

---

### Task 7: Classification Service

**Files:**

- Create: `server/src/services/classification.service.ts`

**Step 1: Create the service**

Key differences from the previous draft:

- Uses `NotFoundException` (not generic `Error`) for proper HTTP 404 responses
- `mapCategory` helper reduces response-mapping duplication
- `getCategories` uses a JOIN query (no N+1)
- `upsertAssetIds` called with `[{ tagId, assetId }]` array (matching actual signature)
- `@OnEvent` uses correct PascalCase event name with `ArgOf<>` type
- `reEncodeAllPrompts` method defined inline

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent, OnJob } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  ClassificationCategoryCreateDto,
  ClassificationCategoryResponseDto,
  ClassificationCategoryUpdateDto,
} from 'src/dtos/classification.dto';
import { AssetVisibility, ImmichWorker, JobName, JobStatus, QueueName } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { upsertTags } from 'src/utils/tag';

@Injectable()
export class ClassificationService extends BaseService {
  // --- Helpers ---

  private mapCategory(
    category: {
      id: string;
      name: string;
      similarity: number;
      action: string;
      enabled: boolean;
      tagId: string | null;
      createdAt: unknown;
      updatedAt: unknown;
    },
    prompts: string[],
  ): ClassificationCategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      prompts,
      similarity: category.similarity,
      action: category.action,
      enabled: category.enabled,
      tagId: category.tagId,
      createdAt: String(category.createdAt),
      updatedAt: String(category.updatedAt),
    };
  }

  // --- CRUD ---

  async getCategories(auth: AuthDto): Promise<ClassificationCategoryResponseDto[]> {
    const rows = await this.classificationRepository.getCategoriesWithPrompts(auth.user.id);

    // Group by category
    const categoryMap = new Map<string, { category: (typeof rows)[0]; prompts: string[] }>();
    for (const row of rows) {
      if (!categoryMap.has(row.id)) {
        categoryMap.set(row.id, { category: row, prompts: [] });
      }
      if (row.prompt) {
        categoryMap.get(row.id)!.prompts.push(row.prompt);
      }
    }

    return [...categoryMap.values()].map(({ category, prompts }) => this.mapCategory(category, prompts));
  }

  async createCategory(
    auth: AuthDto,
    dto: ClassificationCategoryCreateDto,
  ): Promise<ClassificationCategoryResponseDto> {
    const { machineLearning } = await this.getConfig({ withCache: true });

    const category = await this.classificationRepository.createCategory({
      userId: auth.user.id,
      name: dto.name,
      similarity: dto.similarity,
      action: dto.action,
    });

    for (const prompt of dto.prompts) {
      const embedding = await this.machineLearningRepository.encodeText(prompt, {
        modelName: machineLearning.clip.modelName,
      });
      await this.classificationRepository.upsertPromptEmbedding({
        categoryId: category.id,
        prompt,
        embedding,
      });
    }

    return this.mapCategory(category, dto.prompts);
  }

  async updateCategory(
    auth: AuthDto,
    id: string,
    dto: ClassificationCategoryUpdateDto,
  ): Promise<ClassificationCategoryResponseDto> {
    const existing = await this.classificationRepository.getCategory(id);
    if (!existing || existing.userId !== auth.user.id) {
      throw new NotFoundException('Category not found');
    }

    const updateValues: Record<string, unknown> = {};
    if (dto.name !== void 0) {
      if (dto.name !== existing.name && existing.tagId) {
        await this.tagRepository.delete(existing.tagId);
        updateValues.tagId = null;
      }
      updateValues.name = dto.name;
    }
    if (dto.similarity !== void 0) {
      updateValues.similarity = dto.similarity;
    }
    if (dto.action !== void 0) {
      updateValues.action = dto.action;
    }
    if (dto.enabled !== void 0) {
      updateValues.enabled = dto.enabled;
    }

    const category = await this.classificationRepository.updateCategory(id, updateValues);

    if (dto.prompts !== void 0) {
      const { machineLearning } = await this.getConfig({ withCache: true });
      await this.classificationRepository.deletePromptEmbeddingsByCategory(id);
      for (const prompt of dto.prompts) {
        const embedding = await this.machineLearningRepository.encodeText(prompt, {
          modelName: machineLearning.clip.modelName,
        });
        await this.classificationRepository.upsertPromptEmbedding({
          categoryId: id,
          prompt,
          embedding,
        });
      }
    }

    const promptRows = await this.classificationRepository.getPromptEmbeddings(id);
    return this.mapCategory(
      category,
      promptRows.map((p) => p.prompt),
    );
  }

  async deleteCategory(auth: AuthDto, id: string): Promise<void> {
    const category = await this.classificationRepository.getCategory(id);
    if (!category || category.userId !== auth.user.id) {
      throw new NotFoundException('Category not found');
    }

    if (category.tagId) {
      await this.tagRepository.delete(category.tagId);
    }

    await this.classificationRepository.deleteCategory(id);
  }

  async scanLibrary(auth: AuthDto): Promise<void> {
    await this.classificationRepository.resetClassifiedAt(auth.user.id);
    await this.jobRepository.queue({
      name: JobName.AssetClassifyQueueAll,
      data: { userId: auth.user.id },
    });
  }

  // --- Events ---

  @OnEvent({ name: 'ConfigUpdate', workers: [ImmichWorker.Microservices], server: true })
  async onConfigUpdate({ oldConfig, newConfig }: ArgOf<'ConfigUpdate'>) {
    if (oldConfig.machineLearning.clip.modelName !== newConfig.machineLearning.clip.modelName) {
      this.logger.log('CLIP model changed, re-encoding classification prompt embeddings');
      await this.reEncodeAllPrompts(newConfig.machineLearning.clip.modelName);
      await this.jobRepository.queue({ name: JobName.AssetClassifyQueueAll, data: {} });
    }
  }

  private async reEncodeAllPrompts(modelName: string) {
    const categories = await this.classificationRepository.getAllCategories();
    for (const category of categories) {
      const prompts = await this.classificationRepository.getPromptEmbeddings(category.id);
      await this.classificationRepository.deletePromptEmbeddingsByCategory(category.id);
      for (const { prompt } of prompts) {
        const embedding = await this.machineLearningRepository.encodeText(prompt, { modelName });
        await this.classificationRepository.upsertPromptEmbedding({
          categoryId: category.id,
          prompt,
          embedding,
        });
      }
    }
  }

  // --- Jobs ---

  @OnJob({ name: JobName.AssetClassifyQueueAll, queue: QueueName.Classification })
  async handleClassifyQueueAll(data: { userId?: string }): Promise<JobStatus> {
    const stream = this.classificationRepository.streamUnclassifiedAssets(data.userId);

    let queue: Array<{ name: JobName.AssetClassify; data: { id: string } }> = [];
    for await (const asset of stream) {
      queue.push({ name: JobName.AssetClassify, data: { id: asset.id } });
      if (queue.length >= 1000) {
        await this.jobRepository.queueAll(queue);
        queue = [];
      }
    }

    await this.jobRepository.queueAll(queue);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetClassify, queue: QueueName.Classification })
  async handleClassify({ id }: { id: string }): Promise<JobStatus> {
    const asset = await this.assetRepository.getById(id);
    if (!asset) {
      return JobStatus.Failed;
    }

    const embedding = await this.searchRepository.getEmbedding(id);
    if (!embedding) {
      return JobStatus.Skipped;
    }

    const rows = await this.classificationRepository.getEnabledCategoriesWithEmbeddings(asset.ownerId);
    if (rows.length === 0) {
      await this.classificationRepository.setClassifiedAt(id);
      return JobStatus.Skipped;
    }

    // Group by category
    const categories = new Map<
      string,
      { name: string; similarity: number; action: string; tagId: string | null; embeddings: string[] }
    >();
    for (const row of rows) {
      if (!categories.has(row.categoryId)) {
        categories.set(row.categoryId, {
          name: row.name,
          similarity: row.similarity,
          action: row.action,
          tagId: row.tagId,
          embeddings: [],
        });
      }
      categories.get(row.categoryId)!.embeddings.push(row.embedding);
    }

    // Classify
    const assetEmbedding = this.parseEmbedding(embedding);
    let shouldArchive = false;

    for (const [categoryId, category] of categories) {
      let bestSimilarity = -1;
      for (const promptEmbedding of category.embeddings) {
        const similarity = this.cosineSimilarity(assetEmbedding, this.parseEmbedding(promptEmbedding));
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
        }
      }

      if (bestSimilarity >= category.similarity) {
        // Ensure Auto/{name} tag exists
        let tagId = category.tagId;
        if (!tagId) {
          const tags = await upsertTags(this.tagRepository, {
            userId: asset.ownerId,
            tags: [`Auto/${category.name}`],
          });
          tagId = tags[0].id;
          await this.classificationRepository.updateCategory(categoryId, { tagId });
        }

        // Apply tag (idempotent) — upsertAssetIds takes array of {tagId, assetId} objects
        await this.tagRepository.upsertAssetIds([{ tagId, assetId: id }]);

        if (category.action === 'tag_and_archive') {
          shouldArchive = true;
        }
      }
    }

    if (shouldArchive && asset.visibility === AssetVisibility.Timeline) {
      await this.assetRepository.updateAll([id], { visibility: AssetVisibility.Archive });
    }

    await this.classificationRepository.setClassifiedAt(id);
    return JobStatus.Success;
  }

  private parseEmbedding(raw: string): number[] {
    return raw.replace(/[[\]]/g, '').split(',').map(Number);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
```

**Step 2: Register in `server/src/services/index.ts`**

Add import and add `ClassificationService` to the `services` array (alphabetically). Without this, the `@OnEvent` and `@OnJob` decorators will never be discovered at boot time.

```typescript
import { ClassificationService } from 'src/services/classification.service';
```

**Step 3: Commit**

```
feat(server): add classification service with CRUD, events, and job handlers
```

---

### Task 8: Add `getEmbedding` to Search Repository

**Files:**

- Modify: `server/src/repositories/search.repository.ts`

**Step 1: Add method to retrieve an asset's CLIP embedding**

```typescript
  @GenerateSql({ params: [DummyValue.UUID] })
  getEmbedding(assetId: string) {
    return this.db
      .selectFrom('smart_search')
      .select('embedding')
      .where('assetId', '=', assetId)
      .executeTakeFirst()
      .then((row) => row?.embedding ?? null);
  }
```

**Step 2: Commit**

```
feat(server): add getEmbedding method to search repository
```

---

### Task 9: Chain Classification in Job Service + Queue Registration

**Files:**

- Modify: `server/src/services/job.service.ts:217-222`
- Modify: `server/src/services/queue.service.ts` (add `QueueName.Classification` case)

**Step 1: Chain classification after SmartSearch**

In `job.service.ts`, update the `SmartSearch` case in the `onDone` handler:

```typescript
      case JobName.SmartSearch: {
        if (item.data.source === 'upload') {
          await this.jobRepository.queue({ name: JobName.AssetDetectDuplicates, data: item.data });
        }
        await this.jobRepository.queue({ name: JobName.AssetClassify, data: { id: item.data.id } });
        break;
      }
```

**Step 2: Add queue command handler**

In `queue.service.ts`, find the `handleQueueCommand` switch statement and add a case for Classification (after `PetDetection` around line 251):

```typescript
      case QueueName.Classification: {
        return this.jobRepository.queue({ name: JobName.AssetClassifyQueueAll, data: {} });
      }
```

**Step 3: Commit**

```
feat(server): chain classification after SmartSearch and register queue
```

---

### Task 10: Controller + Registration

**Files:**

- Create: `server/src/controllers/classification.controller.ts`
- Modify: `server/src/controllers/index.ts` (register controller)

**Step 1: Create the controller**

Note: no `Permission` import — these endpoints are accessible to any authenticated user managing their own categories.

```typescript
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  ClassificationCategoryCreateDto,
  ClassificationCategoryResponseDto,
  ClassificationCategoryUpdateDto,
} from 'src/dtos/classification.dto';
import { ApiTag } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { ClassificationService } from 'src/services/classification.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Classification)
@Controller('classification/categories')
export class ClassificationController {
  constructor(private service: ClassificationService) {}

  @Get()
  @Authenticated()
  @Endpoint({
    summary: 'Get classification categories',
    history: new HistoryBuilder().added('v1'),
  })
  getCategories(@Auth() auth: AuthDto): Promise<ClassificationCategoryResponseDto[]> {
    return this.service.getCategories(auth);
  }

  @Post()
  @Authenticated()
  @Endpoint({
    summary: 'Create a classification category',
    history: new HistoryBuilder().added('v1'),
  })
  createCategory(
    @Auth() auth: AuthDto,
    @Body() dto: ClassificationCategoryCreateDto,
  ): Promise<ClassificationCategoryResponseDto> {
    return this.service.createCategory(auth, dto);
  }

  @Put(':id')
  @Authenticated()
  @Endpoint({
    summary: 'Update a classification category',
    history: new HistoryBuilder().added('v1'),
  })
  updateCategory(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: ClassificationCategoryUpdateDto,
  ): Promise<ClassificationCategoryResponseDto> {
    return this.service.updateCategory(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete a classification category',
    history: new HistoryBuilder().added('v1'),
  })
  deleteCategory(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.deleteCategory(auth, id);
  }

  @Post('scan')
  @Authenticated()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Scan library for classification',
    history: new HistoryBuilder().added('v1'),
  })
  scanLibrary(@Auth() auth: AuthDto): Promise<void> {
    return this.service.scanLibrary(auth);
  }
}
```

**Step 2: Register in `server/src/controllers/index.ts`**

Add import:

```typescript
import { ClassificationController } from 'src/controllers/classification.controller';
```

Add to the `controllers` array (alphabetically, after `AuthAdminController`):

```typescript
  ClassificationController,
```

**Step 3: Commit**

```
feat(server): add classification controller with registration
```

---

### Task 11: Unit Tests — Classification Service

**Files:**

- Create: `server/src/services/classification.service.spec.ts`

**Step 1: Write tests**

Use the `newTestService(ClassificationService)` factory from `server/test/utils.ts`. Tests to write:

**Job handler tests:**

1. `handleClassify` returns `Failed` when asset not found
2. `handleClassify` returns `Skipped` when no CLIP embedding exists
3. `handleClassify` returns `Skipped` when user has no enabled categories
4. `handleClassify` tags asset when similarity exceeds threshold
5. `handleClassify` does NOT tag when similarity is below threshold
6. `handleClassify` archives when action is `tag_and_archive` and asset visibility is Timeline
7. `handleClassify` does NOT archive when asset is already archived
8. `handleClassify` creates `Auto/{name}` tag when tagId is null
9. `handleClassify` handles multiple categories matching the same asset
10. `handleClassifyQueueAll` streams unclassified assets and queues jobs in batches

**CRUD tests:**

11. `createCategory` encodes prompts via ML service and stores embeddings
12. `updateCategory` throws `NotFoundException` for non-existent category
13. `updateCategory` throws `NotFoundException` for category owned by different user
14. `updateCategory` re-encodes prompts when prompts change
15. `updateCategory` does NOT re-encode when only name/similarity/action change
16. `updateCategory` deletes old tag when name changes
17. `deleteCategory` deletes associated tag
18. `deleteCategory` throws `NotFoundException` for non-existent category
19. `getCategories` returns categories with prompts grouped correctly
20. `scanLibrary` resets classifiedAt and queues AssetClassifyQueueAll

**Event tests:**

21. `onConfigUpdate` re-encodes all prompts when CLIP model changes
22. `onConfigUpdate` does nothing when CLIP model unchanged
23. `onConfigUpdate` skips if no categories exist

**Cosine similarity / edge case tests:**

24. `cosineSimilarity` returns 1.0 for identical vectors
25. `cosineSimilarity` returns 0.0 for orthogonal vectors
26. `handleClassify` handles malformed embedding gracefully (NaN similarity < threshold)
27. `handleClassifyQueueAll` flushes exactly at 1000 boundary

**Step 2: Run tests**

Run: `cd server && pnpm test -- --run src/services/classification.service.spec.ts`

**Step 3: Commit**

```
test(server): add classification service unit tests
```

---

### Task 12: OpenAPI Generation

**Files:**

- Regenerate: OpenAPI spec and TypeScript SDK

**Step 1: Build and regenerate**

```bash
cd server && pnpm build
cd server && pnpm sync:open-api
make open-api-typescript
```

**Step 2: Verify the generated SDK includes the new endpoints**

Check that `getClassificationCategories`, `createClassificationCategory`,
`updateClassificationCategory`, `deleteClassificationCategory`, and
`scanClassificationLibrary` are present in the generated SDK.

**Step 3: Commit**

```
chore: regenerate OpenAPI spec for classification endpoints
```

---

### Task 13: Web — Settings UI Component

**Files:**

- Create: `web/src/lib/components/user-settings-page/classification-settings.svelte`
- Modify: `web/src/lib/components/user-settings-page/user-settings-list.svelte`

**Step 1: Create the classification settings component**

Build a Svelte 5 component using runes (`$state`, `$effect`, `$props`) that:

- Loads categories via the generated SDK (`getClassificationCategories`)
- Renders a list of category cards showing name, prompt count, similarity label, action badge, enabled toggle
- Has an edit form for creating/editing categories with:
  - Name text input
  - Multi-line textarea for prompts (one per line)
  - Similarity slider (range 0.15-0.45, labels: Loose/Normal/Strict, default 0.28)
  - Action dropdown (Tag only / Tag and archive)
  - Save/Cancel buttons
- "Add Category" button
- "Scan Library" button that calls `scanClassificationLibrary` and shows a toast
- Uses `notificationController` for success/error feedback
- Uses `@immich/ui` components where appropriate (Button, etc.)
- Uses Gallery's design tokens (`bg-light`, `dark:` prefix) not hardcoded colors

**Step 2: Add to `user-settings-list.svelte`**

Import the component and add a new `SettingAccordion`:

```svelte
<script>
  import ClassificationSettings from '$lib/components/user-settings-page/classification-settings.svelte';
  // Add to existing imports:
  import { mdiMagnifyScan } from '@mdi/js';
</script>

<SettingAccordion
  icon={mdiMagnifyScan}
  key="auto-classification"
  title="Auto-Classification"
  subtitle="Automatically tag and archive photos by category"
>
  <ClassificationSettings />
</SettingAccordion>
```

**Step 3: Run web lint and type-check**

```bash
cd web && npx svelte-check --tsconfig ./tsconfig.json
```

**Step 4: Commit**

```
feat(web): add auto-classification settings UI
```

---

### Task 14: Web Unit Tests

**Files:**

- Create: `web/src/lib/components/user-settings-page/classification-settings.spec.ts`

**Step 1: Write tests**

Using `@testing-library/svelte` with `render` and `screen`:

1. Renders "Add Category" button in empty state
2. Renders "Scan Library" button
3. Opens create form when "Add Category" clicked
4. Displays category name and metadata when categories loaded (mock SDK)
5. Shows edit form when edit button clicked
6. Calls delete SDK method when delete confirmed
7. Similarity slider renders with default value (0.28)
8. Error notification shown when SDK call fails
9. Enabled toggle calls update SDK method
10. Create form validates non-empty name and prompts before save

**Step 2: Run tests**

Run: `cd web && pnpm test -- --run src/lib/components/user-settings-page/classification-settings.spec.ts`

**Step 3: Commit**

```
test(web): add classification settings component tests
```

---

### Task 15: SQL Generation and Final Checks

**Step 1: Run SQL generation**

```bash
make sql
```

**Step 2: Run all linters (sequentially, not parallel)**

```bash
make check-server
make lint-server
make check-web
make lint-web
```

**Step 3: Run server tests**

```bash
cd server && pnpm test
```

**Step 4: Run web tests**

```bash
cd web && pnpm test
```

**Step 5: Commit any generated file changes**

```
chore: regenerate SQL queries and fix lint issues
```

---

### Task 16: E2E Test (API)

**Files:**

- Create: `e2e/src/specs/api/classification.e2e-spec.ts`

**Step 1: Write API E2E tests**

Note: E2E tests may not have the ML service running. The `createCategory` endpoint calls
`encodeText` which requires the ML service. If ML is not available, either:

- Mock the ML response at the E2E level, or
- Test only the endpoints that don't require ML (get, delete, scan), or
- Skip prompt encoding in the test environment

Test the CRUD flow:

1. `GET /classification/categories` returns empty array for new user
2. `POST /classification/categories` creates a category (if ML available)
3. `GET /classification/categories` returns the created category
4. `PUT /classification/categories/:id` updates name and similarity
5. `DELETE /classification/categories/:id` returns 204
6. `GET /classification/categories` returns empty array after delete
7. `POST /classification/categories/scan` returns 204
8. Authorization: cannot access another user's categories (404 on update/delete)

Follow existing E2E patterns in `e2e/src/specs/api/` (setup with admin/user tokens, cleanup).

**Step 2: Run E2E tests**

```bash
cd e2e && pnpm test -- --run src/specs/api/classification.e2e-spec.ts
```

**Step 3: Commit**

```
test(e2e): add classification API e2e tests
```

---

### Task 17: Medium Tests — Repository

**Files:**

- Create: `server/src/repositories/classification.repository.spec.ts`

Medium tests use a real database via testcontainers. These catch SQL errors that unit tests with mocks cannot.

**Step 1: Write medium tests**

Follow existing medium test patterns in `server/src/repositories/`. Tests to write:

1. `getEnabledCategoriesWithEmbeddings` returns correct JOIN results
2. `streamUnclassifiedAssets` returns only assets without `classifiedAt`
3. `streamUnclassifiedAssets` with `userId` filter only returns that user's assets
4. `resetClassifiedAt` clears timestamps for the correct user only
5. Cascade delete: deleting a category cascades to prompt embeddings
6. Cascade delete: deleting a user cascades to categories
7. `setClassifiedAt` sets timestamp on correct asset
8. Unique constraint: cannot create two categories with same name for same user

**Step 2: Run medium tests**

```bash
cd server && pnpm test:medium -- --run src/repositories/classification.repository.spec.ts
```

**Step 3: Commit**

```
test(server): add classification repository medium tests
```
