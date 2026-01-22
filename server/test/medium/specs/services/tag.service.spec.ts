import { Kysely } from 'kysely';
import { JobStatus } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { DB } from 'src/schema';
import { TagService } from 'src/services/tag.service';
import { upsertTags } from 'src/utils/tag';
import { newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(TagService, {
    database: db || defaultDatabase,
    real: [AssetRepository, TagRepository, AccessRepository],
    mock: [EventRepository, LoggingRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(TagService.name, () => {
  describe('addAssets', () => {
    it('should lock exif column', async () => {
      const { sut, ctx } = setup();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const [tag] = await upsertTags(ctx.get(TagRepository), { userId: user.id, tags: ['tag-1'] });
      const authDto = factory.auth({ user });

      await sut.addAssets(authDto, tag.id, { ids: [asset.id] });
      await expect(
        ctx.database
          .selectFrom('asset_exif')
          .select(['lockedProperties', 'tags'])
          .where('assetId', '=', asset.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({
        lockedProperties: ['tags'],
        tags: ['tag-1'],
      });
      await expect(ctx.get(TagRepository).getByValue(user.id, 'tag-1')).resolves.toEqual(
        expect.objectContaining({ id: tag.id }),
      );
      await expect(ctx.get(TagRepository).getAssetIds(tag.id, [asset.id])).resolves.toContain(asset.id);
    });
  });
  describe('deleteEmptyTags', () => {
    it('single tag exists, not connected to any assets, and is deleted', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const tagRepo = ctx.get(TagRepository);
      const [tag] = await upsertTags(tagRepo, { userId: user.id, tags: ['tag-1'] });

      await expect(tagRepo.getByValue(user.id, 'tag-1')).resolves.toEqual(expect.objectContaining({ id: tag.id }));
      await expect(sut.handleTagCleanup()).resolves.toBe(JobStatus.Success);
      await expect(tagRepo.getByValue(user.id, 'tag-1')).resolves.toBeUndefined();
    });

    it('single tag exists, connected to one asset, and is not deleted', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const tagRepo = ctx.get(TagRepository);
      const [tag] = await upsertTags(tagRepo, { userId: user.id, tags: ['tag-1'] });

      await ctx.newTagAsset({ tagIds: [tag.id], assetIds: [asset.id] });

      await expect(tagRepo.getByValue(user.id, 'tag-1')).resolves.toEqual(expect.objectContaining({ id: tag.id }));
      await expect(sut.handleTagCleanup()).resolves.toBe(JobStatus.Success);
      await expect(tagRepo.getByValue(user.id, 'tag-1')).resolves.toEqual(expect.objectContaining({ id: tag.id }));
    });

    it('hierarchical tag exists, and the parent is connected to an asset, and the child is deleted', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const tagRepo = ctx.get(TagRepository);
      const [parentTag, childTag] = await upsertTags(tagRepo, { userId: user.id, tags: ['parent', 'parent/child'] });

      await ctx.newTagAsset({ tagIds: [parentTag.id], assetIds: [asset.id] });

      await expect(tagRepo.getByValue(user.id, 'parent')).resolves.toEqual(
        expect.objectContaining({ id: parentTag.id }),
      );
      await expect(tagRepo.getByValue(user.id, 'parent/child')).resolves.toEqual(
        expect.objectContaining({ id: childTag.id }),
      );
      await expect(sut.handleTagCleanup()).resolves.toBe(JobStatus.Success);
      await expect(tagRepo.getByValue(user.id, 'parent')).resolves.toEqual(
        expect.objectContaining({ id: parentTag.id }),
      );
      await expect(tagRepo.getByValue(user.id, 'parent/child')).resolves.toBeUndefined();
    });

    it('hierarchical tag exists, and only the child is connected to an asset, and nothing is deleted', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const tagRepo = ctx.get(TagRepository);
      const [parentTag, childTag] = await upsertTags(tagRepo, { userId: user.id, tags: ['parent', 'parent/child'] });

      await ctx.newTagAsset({ tagIds: [childTag.id], assetIds: [asset.id] });

      await expect(tagRepo.getByValue(user.id, 'parent')).resolves.toEqual(
        expect.objectContaining({ id: parentTag.id }),
      );
      await expect(tagRepo.getByValue(user.id, 'parent/child')).resolves.toEqual(
        expect.objectContaining({ id: childTag.id }),
      );
      await expect(sut.handleTagCleanup()).resolves.toBe(JobStatus.Success);
      await expect(tagRepo.getByValue(user.id, 'parent')).resolves.toEqual(
        expect.objectContaining({ id: parentTag.id }),
      );
      await expect(tagRepo.getByValue(user.id, 'parent/child')).resolves.toEqual(
        expect.objectContaining({ id: childTag.id }),
      );
    });

    it('hierarchical tag exists, and neither parent nor child is connected to an asset, and both are deleted', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const tagRepo = ctx.get(TagRepository);
      const [parentTag, childTag] = await upsertTags(tagRepo, { userId: user.id, tags: ['parent', 'parent/child'] });

      await expect(tagRepo.getByValue(user.id, 'parent')).resolves.toEqual(
        expect.objectContaining({ id: parentTag.id }),
      );
      await expect(tagRepo.getByValue(user.id, 'parent/child')).resolves.toEqual(
        expect.objectContaining({ id: childTag.id }),
      );
      await expect(sut.handleTagCleanup()).resolves.toBe(JobStatus.Success);
      await expect(tagRepo.getByValue(user.id, 'parent/child')).resolves.toBeUndefined();
      await expect(tagRepo.getByValue(user.id, 'parent')).resolves.toBeUndefined();
    });
  });
});
