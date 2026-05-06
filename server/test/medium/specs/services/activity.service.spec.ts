import { Kysely } from 'kysely';
import { ReactionType } from 'src/dtos/activity.dto';
import { AssetMetadataKey } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { ActivityRepository } from 'src/repositories/activity.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { DB } from 'src/schema';
import { ActivityService } from 'src/services/activity.service';
import { upsertTags } from 'src/utils/tag';
import { newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(ActivityService, {
    database: db || defaultDatabase,
    real: [AccessRepository, ActivityRepository, AlbumRepository, AssetRepository, TagRepository, UserRepository],
    mock: [LoggingRepository],
  });
};

const nsfwMetadata = (isNsfw: boolean) => ({
  nsfwDetection: {
    status: 'success',
    result: { isNsfw, score: isNsfw ? 0.95 : 0.05, labels: [] },
  },
});

describe(ActivityService.name, () => {
  beforeEach(async () => {
    defaultDatabase = await getKyselyDB();
  });

  describe('nsfw privacy', () => {
    it('filters hidden NSFW asset activity and statistics using private metadata only', async () => {
      const { sut, ctx } = setup();
      const activityRepository = ctx.get(ActivityRepository);
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });
      const { album } = await ctx.newAlbum({ ownerId: user.id });

      const { asset: safe } = await ctx.newAsset({ ownerId: user.id });
      const { asset: nsfw } = await ctx.newAsset({ ownerId: user.id });
      const { asset: tagOnly } = await ctx.newAsset({ ownerId: user.id });
      for (const asset of [safe, nsfw, tagOnly]) {
        await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
      }

      await ctx.newMetadata({
        assetId: nsfw.id,
        key: AssetMetadataKey.MlEnrichment,
        value: nsfwMetadata(true),
      });
      const [visibleNsfwTag] = await upsertTags(ctx.get(TagRepository), { userId: user.id, tags: ['nsfw'] });
      await ctx.newTagAsset({ tagIds: [visibleNsfwTag.id], assetIds: [tagOnly.id] });

      const [safeComment, nsfwComment, nsfwLike, tagOnlyComment, albumComment] = await Promise.all([
        activityRepository.create({
          albumId: album.id,
          userId: user.id,
          assetId: safe.id,
          comment: 'safe comment',
          isLiked: false,
        }),
        activityRepository.create({
          albumId: album.id,
          userId: user.id,
          assetId: nsfw.id,
          comment: 'hidden comment',
          isLiked: false,
        }),
        activityRepository.create({
          albumId: album.id,
          userId: user.id,
          assetId: nsfw.id,
          comment: null,
          isLiked: true,
        }),
        activityRepository.create({
          albumId: album.id,
          userId: user.id,
          assetId: tagOnly.id,
          comment: 'tag-only comment',
          isLiked: false,
        }),
        activityRepository.create({
          albumId: album.id,
          userId: user.id,
          assetId: null,
          comment: 'album comment',
          isLiked: false,
        }),
      ]);

      const hiddenAuth = { ...auth, hideNsfwAssets: true };
      const hiddenActivities = await sut.getAll(hiddenAuth, { albumId: album.id });
      expect(hiddenActivities.map(({ id }) => id)).toEqual(
        expect.arrayContaining([safeComment.id, tagOnlyComment.id, albumComment.id]),
      );
      expect(hiddenActivities.map(({ id }) => id)).not.toEqual(expect.arrayContaining([nsfwComment.id, nsfwLike.id]));
      await expect(sut.getStatistics(hiddenAuth, { albumId: album.id, assetId: nsfw.id })).resolves.toEqual({
        comments: 0,
        likes: 0,
      });
      await expect(sut.getStatistics(hiddenAuth, { albumId: album.id, assetId: tagOnly.id })).resolves.toEqual({
        comments: 1,
        likes: 0,
      });
      await expect(sut.getStatistics(hiddenAuth, { albumId: album.id })).resolves.toEqual({ comments: 3, likes: 0 });

      const elevatedActivities = await sut.getAll(auth, { albumId: album.id });
      expect(elevatedActivities.map(({ id }) => id)).toEqual(
        expect.arrayContaining([safeComment.id, nsfwComment.id, nsfwLike.id, tagOnlyComment.id, albumComment.id]),
      );
      await expect(sut.getStatistics(auth, { albumId: album.id })).resolves.toEqual({ comments: 4, likes: 1 });
    });

    it('denies hidden-mode activity mutations for hidden NSFW asset activity', async () => {
      const { sut, ctx } = setup();
      const activityRepository = ctx.get(ActivityRepository);
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });
      const { album } = await ctx.newAlbum({ ownerId: user.id });

      const { asset: nsfw } = await ctx.newAsset({ ownerId: user.id });
      const { asset: tagOnly } = await ctx.newAsset({ ownerId: user.id });
      await Promise.all([
        ctx.newAlbumAsset({ albumId: album.id, assetId: nsfw.id }),
        ctx.newAlbumAsset({ albumId: album.id, assetId: tagOnly.id }),
        ctx.newMetadata({
          assetId: nsfw.id,
          key: AssetMetadataKey.MlEnrichment,
          value: nsfwMetadata(true),
        }),
      ]);
      const [visibleNsfwTag] = await upsertTags(ctx.get(TagRepository), { userId: user.id, tags: ['nsfw'] });
      await ctx.newTagAsset({ tagIds: [visibleNsfwTag.id], assetIds: [tagOnly.id] });

      const nsfwComment = await activityRepository.create({
        albumId: album.id,
        userId: user.id,
        assetId: nsfw.id,
        comment: 'hidden comment',
        isLiked: false,
      });

      const hiddenAuth = { ...auth, hideNsfwAssets: true };
      await expect(
        sut.create(hiddenAuth, {
          albumId: album.id,
          assetId: nsfw.id,
          type: ReactionType.COMMENT,
          comment: 'new hidden comment',
        }),
      ).rejects.toThrow('Not found or no asset.read access');
      await expect(sut.delete(hiddenAuth, nsfwComment.id)).rejects.toThrow('Not found or no activity.delete access');

      await expect(
        sut.create(hiddenAuth, {
          albumId: album.id,
          assetId: tagOnly.id,
          type: ReactionType.COMMENT,
          comment: 'tag-only comment',
        }),
      ).resolves.toEqual(expect.objectContaining({ duplicate: false }));
      await expect(
        sut.create(hiddenAuth, {
          albumId: album.id,
          type: ReactionType.COMMENT,
          comment: 'album comment',
        }),
      ).resolves.toEqual(expect.objectContaining({ duplicate: false }));

      const remaining = await ctx.database
        .selectFrom('activity')
        .select('id')
        .where('id', '=', nsfwComment.id)
        .execute();
      expect(remaining).toHaveLength(1);
    });
  });
});
