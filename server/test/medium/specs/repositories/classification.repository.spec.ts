import { Kysely } from 'kysely';
import { AssetVisibility, SourceType } from 'src/enum';
import { ClassificationRepository } from 'src/repositories/classification.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { upsertTags } from 'src/utils/tag';
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
  describe('streamUnclassifiedAssets', () => {
    it('should return assets without classifiedAt', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      await ctx.newJobStatus({ assetId: asset.id });

      const embedding = `[${Array.from({ length: 512 }, () => '0.01').join(',')}]`;
      await ctx.database.insertInto('smart_search').values({ assetId: asset.id, embedding }).execute();

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
  });

  describe('resetClassifiedAt', () => {
    it('should clear classifiedAt for all assets', async () => {
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

      await sut.resetClassifiedAt();

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
      expect(status2.classifiedAt).toBeNull();
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

  describe('getFaceSummary', () => {
    it('should return false booleans for an asset without assigned faces', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      await ctx.newAssetFace({ assetId: asset.id, personId: null });

      await expect(sut.getFaceSummary(asset.id)).resolves.toEqual({
        hasAssignedFace: false,
        hasNamedPerson: false,
        hasNamedVisiblePerson: false,
      });
    });

    it('should detect assigned, named, and visible named human faces', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', isHidden: false, type: 'person' });

      await ctx.newAssetFace({ assetId: asset.id, personId: person.id });

      await expect(sut.getFaceSummary(asset.id)).resolves.toEqual({
        hasAssignedFace: true,
        hasNamedPerson: true,
        hasNamedVisiblePerson: true,
      });
    });

    it('should detect hidden named people but exclude them from visible named people', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', isHidden: true, type: 'person' });

      await ctx.newAssetFace({ assetId: asset.id, personId: person.id });

      await expect(sut.getFaceSummary(asset.id)).resolves.toEqual({
        hasAssignedFace: true,
        hasNamedPerson: true,
        hasNamedVisiblePerson: false,
      });
    });

    it('should treat assigned unnamed people as assigned but not named', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { person } = await ctx.newPerson({ ownerId: user.id, name: '   ', isHidden: false, type: 'person' });

      await ctx.newAssetFace({ assetId: asset.id, personId: person.id });

      await expect(sut.getFaceSummary(asset.id)).resolves.toEqual({
        hasAssignedFace: true,
        hasNamedPerson: false,
        hasNamedVisiblePerson: false,
      });
    });

    it('should ignore invisible deleted and pet rows', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', type: 'person' });
      const { person: pet } = await ctx.newPerson({ ownerId: user.id, name: 'Spot', type: 'pet', species: 'dog' });

      await ctx.newAssetFace({ assetId: asset.id, personId: person.id, isVisible: false });
      await ctx.newAssetFace({ assetId: asset.id, personId: person.id, deletedAt: new Date() });
      await ctx.newAssetFace({ assetId: asset.id, personId: pet.id, sourceType: SourceType.MachineLearning });

      await expect(sut.getFaceSummary(asset.id)).resolves.toEqual({
        hasAssignedFace: false,
        hasNamedPerson: false,
        hasNamedVisiblePerson: false,
      });
    });
  });

  describe('removeAutoTagAssignments', () => {
    it('should delete tag_asset rows for Auto/{name} tags and unarchive affected assets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });

      const tagRepo = ctx.get(TagRepository);
      const [tag] = await upsertTags(tagRepo, { userId: user.id, tags: ['Auto/Screenshots'] });
      await ctx.newTagAsset({ tagIds: [tag.id], assetIds: [asset1.id, asset2.id] });

      // Archive asset1
      await ctx.database
        .updateTable('asset')
        .set({ visibility: AssetVisibility.Archive })
        .where('id', '=', asset1.id)
        .execute();

      await sut.removeAutoTagAssignments('Screenshots');

      // Verify tag_asset rows are gone
      const tagAssets = await ctx.database.selectFrom('tag_asset').selectAll().where('tagId', '=', tag.id).execute();
      expect(tagAssets).toHaveLength(0);

      // Verify asset1 is unarchived
      const a1 = await ctx.database
        .selectFrom('asset')
        .select('visibility')
        .where('id', '=', asset1.id)
        .executeTakeFirstOrThrow();
      expect(a1.visibility).toBe(AssetVisibility.Timeline);

      // Verify asset2 stayed at timeline
      const a2 = await ctx.database
        .selectFrom('asset')
        .select('visibility')
        .where('id', '=', asset2.id)
        .executeTakeFirstOrThrow();
      expect(a2.visibility).toBe(AssetVisibility.Timeline);
    });

    it('should not affect other tags', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      const tagRepo = ctx.get(TagRepository);
      const [autoTag] = await upsertTags(tagRepo, { userId: user.id, tags: ['Auto/Screenshots'] });
      const [vacationTag] = await upsertTags(tagRepo, { userId: user.id, tags: ['vacation'] });
      await ctx.newTagAsset({ tagIds: [autoTag.id, vacationTag.id], assetIds: [asset.id] });

      await sut.removeAutoTagAssignments('Screenshots');

      // Auto tag_asset removed
      const autoTagAssets = await ctx.database
        .selectFrom('tag_asset')
        .selectAll()
        .where('tagId', '=', autoTag.id)
        .execute();
      expect(autoTagAssets).toHaveLength(0);

      // Vacation tag_asset untouched
      const vacationTagAssets = await ctx.database
        .selectFrom('tag_asset')
        .selectAll()
        .where('tagId', '=', vacationTag.id)
        .execute();
      expect(vacationTagAssets).toHaveLength(1);
    });

    it('should be a no-op when no matching tags exist', async () => {
      const { sut } = setup();

      // Should not throw
      await expect(sut.removeAutoTagAssignments('NonExistent')).resolves.not.toThrow();
    });
  });
});
