import { Kysely } from 'kysely';
import { AssetMetadataKey, JobStatus } from 'src/enum';
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

const nsfwMetadata = (isNsfw: boolean, review?: { action: string; isNsfw: boolean }) => ({
  nsfwDetection: {
    status: 'success',
    result: { isNsfw, score: isNsfw ? 0.95 : 0.05, labels: { explicit: isNsfw ? 0.95 : 0.05 } },
    ...(review ? { review } : {}),
  },
});

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(TagService.name, () => {
  describe('nsfw privacy', () => {
    it('should hide tags that only point to NSFW assets while hide mode is active', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      const { asset: safe } = await ctx.newAsset({ ownerId: user.id });
      const { asset: nsfw } = await ctx.newAsset({ ownerId: user.id });
      const { asset: markedSafe } = await ctx.newAsset({ ownerId: user.id });
      const { asset: markedNsfw } = await ctx.newAsset({ ownerId: user.id });

      await ctx.newMetadata({ assetId: nsfw.id, key: AssetMetadataKey.MlEnrichment, value: nsfwMetadata(true) });
      await ctx.newMetadata({
        assetId: markedSafe.id,
        key: AssetMetadataKey.MlEnrichment,
        value: nsfwMetadata(true, { action: 'marked-safe', isNsfw: false }),
      });
      await ctx.newMetadata({
        assetId: markedNsfw.id,
        key: AssetMetadataKey.MlEnrichment,
        value: nsfwMetadata(false, { action: 'marked-nsfw', isNsfw: true }),
      });

      const [emptyTag, hiddenTag, hiddenParentTag, hiddenChildTag, mixedTag, reviewNsfwTag, reviewSafeTag, safeTag] =
        await upsertTags(ctx.get(TagRepository), {
          userId: user.id,
          tags: [
            'empty',
            'hidden',
            'hidden-parent',
            'hidden-parent/child',
            'mixed',
            'review-nsfw',
            'review-safe',
            'safe',
          ],
        });

      await ctx.newTagAsset({ tagIds: [safeTag.id], assetIds: [safe.id] });
      await ctx.newTagAsset({ tagIds: [hiddenTag.id, hiddenChildTag.id], assetIds: [nsfw.id] });
      await ctx.newTagAsset({ tagIds: [mixedTag.id], assetIds: [safe.id, nsfw.id] });
      await ctx.newTagAsset({ tagIds: [reviewSafeTag.id], assetIds: [markedSafe.id] });
      await ctx.newTagAsset({ tagIds: [reviewNsfwTag.id], assetIds: [markedNsfw.id] });

      const auth = factory.auth({ user });
      const hiddenAuth = { ...auth, hideNsfwAssets: true };

      const tags = await sut.getAll(auth);
      const values = tags.map((tag) => tag.value);
      expect(values).toEqual([
        'empty',
        'hidden',
        'hidden-parent',
        'hidden-parent/child',
        'mixed',
        'review-nsfw',
        'review-safe',
        'safe',
      ]);

      const hiddenTags = await sut.getAll(hiddenAuth);
      const hiddenValues = hiddenTags.map((tag) => tag.value);
      expect(hiddenValues).toEqual(['empty', 'mixed', 'review-safe', 'safe']);

      await expect(sut.get(hiddenAuth, emptyTag.id)).resolves.toEqual(expect.objectContaining({ id: emptyTag.id }));
      await expect(sut.get(hiddenAuth, safeTag.id)).resolves.toEqual(expect.objectContaining({ id: safeTag.id }));
      await expect(sut.get(hiddenAuth, hiddenTag.id)).rejects.toThrow('Not found or no tag.read access');
      await expect(sut.get(hiddenAuth, hiddenParentTag.id)).rejects.toThrow('Not found or no tag.read access');
      await expect(sut.get(hiddenAuth, hiddenChildTag.id)).rejects.toThrow('Not found or no tag.read access');
      await expect(sut.get(hiddenAuth, reviewNsfwTag.id)).rejects.toThrow('Not found or no tag.read access');
      await expect(sut.get(auth, hiddenTag.id)).resolves.toEqual(expect.objectContaining({ id: hiddenTag.id }));
    });
  });

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
