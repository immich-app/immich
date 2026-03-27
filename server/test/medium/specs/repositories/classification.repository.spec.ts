import { Kysely } from 'kysely';
import { ClassificationRepository } from 'src/repositories/classification.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(ClassificationRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(ClassificationRepository.name, () => {
  describe('getEnabledCategoriesWithEmbeddings', () => {
    it('should return categories with their prompt embeddings via JOIN', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const category = await sut.createCategory({
        userId: user.id,
        name: 'Animals',
        similarity: 0.3,
        action: 'tag',
        enabled: true,
      });

      const embedding = `[${Array.from({ length: 512 }, () => '0.01').join(',')}]`;
      await sut.upsertPromptEmbedding({
        categoryId: category.id,
        prompt: 'a photo of an animal',
        embedding,
      });

      const results = await sut.getEnabledCategoriesWithEmbeddings(user.id);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        categoryId: category.id,
        name: 'Animals',
        similarity: 0.3,
        action: 'tag',
        prompt: 'a photo of an animal',
      });
      expect(results[0].embedding).toBeDefined();
    });

    it('should not return disabled categories', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const category = await sut.createCategory({
        userId: user.id,
        name: 'Disabled',
        similarity: 0.3,
        action: 'tag',
        enabled: false,
      });

      const embedding = `[${Array.from({ length: 512 }, () => '0.01').join(',')}]`;
      await sut.upsertPromptEmbedding({
        categoryId: category.id,
        prompt: 'test',
        embedding,
      });

      const results = await sut.getEnabledCategoriesWithEmbeddings(user.id);
      expect(results).toHaveLength(0);
    });
  });

  describe('streamUnclassifiedAssets', () => {
    it('should return assets without classifiedAt', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      // Create job status with no classifiedAt
      await ctx.newJobStatus({ assetId: asset.id });

      // Insert smart_search entry so the JOIN succeeds
      const embedding = `[${Array.from({ length: 512 }, () => '0.01').join(',')}]`;
      await ctx.database.insertInto('smart_search').values({ assetId: asset.id, embedding }).execute();

      // Override classifiedAt to null (newJobStatus sets defaults)
      await ctx.database
        .updateTable('asset_job_status')
        .set({ classifiedAt: null })
        .where('assetId', '=', asset.id)
        .execute();

      const stream = sut.streamUnclassifiedAssets();
      const results: Array<{ id: string; ownerId: string }> = [];
      for await (const row of stream) {
        results.push(row);
      }

      const found = results.find((r) => r.id === asset.id);
      expect(found).toBeDefined();
      expect(found!.ownerId).toBe(user.id);
    });

    it('should filter by userId when provided', async () => {
      const { ctx, sut } = setup();
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();

      const { asset: asset1 } = await ctx.newAsset({ ownerId: user1.id });
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user2.id });

      const embedding = `[${Array.from({ length: 512 }, () => '0.01').join(',')}]`;
      for (const asset of [asset1, asset2]) {
        await ctx.newJobStatus({ assetId: asset.id });
        await ctx.database.insertInto('smart_search').values({ assetId: asset.id, embedding }).execute();
        await ctx.database
          .updateTable('asset_job_status')
          .set({ classifiedAt: null })
          .where('assetId', '=', asset.id)
          .execute();
      }

      const stream = sut.streamUnclassifiedAssets(user1.id);
      const results: Array<{ id: string; ownerId: string }> = [];
      for await (const row of stream) {
        results.push(row);
      }

      expect(results.some((r) => r.id === asset1.id)).toBe(true);
      expect(results.some((r) => r.id === asset2.id)).toBe(false);
    });
  });

  describe('resetClassifiedAt', () => {
    it('should clear classifiedAt for only the specified user', async () => {
      const { ctx, sut } = setup();
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();

      const { asset: asset1 } = await ctx.newAsset({ ownerId: user1.id });
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user2.id });

      const classifiedDate = new Date().toISOString();
      for (const asset of [asset1, asset2]) {
        await ctx.newJobStatus({ assetId: asset.id });
        await ctx.database
          .updateTable('asset_job_status')
          .set({ classifiedAt: classifiedDate })
          .where('assetId', '=', asset.id)
          .execute();
      }

      await sut.resetClassifiedAt(user1.id);

      const status1 = await ctx.database
        .selectFrom('asset_job_status')
        .select('classifiedAt')
        .where('assetId', '=', asset1.id)
        .executeTakeFirstOrThrow();

      const status2 = await ctx.database
        .selectFrom('asset_job_status')
        .select('classifiedAt')
        .where('assetId', '=', asset2.id)
        .executeTakeFirstOrThrow();

      expect(status1.classifiedAt).toBeNull();
      expect(status2.classifiedAt).not.toBeNull();
    });
  });

  describe('cascade deletes', () => {
    it('should cascade delete prompt embeddings when category is deleted', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const category = await sut.createCategory({
        userId: user.id,
        name: 'CascadeTest',
        similarity: 0.3,
        action: 'tag',
      });

      const embedding = `[${Array.from({ length: 512 }, () => '0.01').join(',')}]`;
      await sut.upsertPromptEmbedding({
        categoryId: category.id,
        prompt: 'test prompt',
        embedding,
      });

      const beforeDelete = await sut.getPromptEmbeddings(category.id);
      expect(beforeDelete).toHaveLength(1);

      await sut.deleteCategory(category.id);

      // Verify embeddings were cascade deleted via direct DB query
      const afterDelete = await ctx.database
        .selectFrom('classification_prompt_embedding')
        .selectAll()
        .where('categoryId', '=', category.id)
        .execute();
      expect(afterDelete).toHaveLength(0);
    });

    it('should cascade delete categories when user is deleted', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      await sut.createCategory({
        userId: user.id,
        name: 'UserCascadeTest',
        similarity: 0.3,
        action: 'tag',
      });

      const beforeDelete = await sut.getCategories(user.id);
      expect(beforeDelete).toHaveLength(1);

      // Delete user via DB
      await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();

      const afterDelete = await sut.getCategories(user.id);
      expect(afterDelete).toHaveLength(0);
    });
  });

  describe('setClassifiedAt', () => {
    it('should set classifiedAt on the correct asset', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      await ctx.newJobStatus({ assetId: asset.id });
      await ctx.database
        .updateTable('asset_job_status')
        .set({ classifiedAt: null })
        .where('assetId', '=', asset.id)
        .execute();

      await sut.setClassifiedAt(asset.id);

      const status = await ctx.database
        .selectFrom('asset_job_status')
        .select('classifiedAt')
        .where('assetId', '=', asset.id)
        .executeTakeFirstOrThrow();

      expect(status.classifiedAt).not.toBeNull();
    });
  });

  describe('unique constraint', () => {
    it('should not allow two categories with the same name for the same user', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      await sut.createCategory({
        userId: user.id,
        name: 'Duplicate',
        similarity: 0.3,
        action: 'tag',
      });

      await expect(
        sut.createCategory({
          userId: user.id,
          name: 'Duplicate',
          similarity: 0.5,
          action: 'tag',
        }),
      ).rejects.toThrow();
    });

    it('should allow same category name for different users', async () => {
      const { ctx, sut } = setup();
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();

      await sut.createCategory({
        userId: user1.id,
        name: 'SharedName',
        similarity: 0.3,
        action: 'tag',
      });

      const cat2 = await sut.createCategory({
        userId: user2.id,
        name: 'SharedName',
        similarity: 0.3,
        action: 'tag',
      });

      expect(cat2.name).toBe('SharedName');
    });
  });
});
