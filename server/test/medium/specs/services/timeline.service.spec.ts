import { BadRequestException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { AssetMetadataKey, AssetType, AssetVisibility } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { DB } from 'src/schema';
import { TimelineService } from 'src/services/timeline.service';
import type { HiddenContentFilter } from 'src/utils/hidden-content';
import { upsertTags } from 'src/utils/tag';
import { newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(TimelineService, {
    database: db || defaultDatabase,
    real: [AssetRepository, AccessRepository, PartnerRepository, TagRepository],
    mock: [LoggingRepository],
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

describe(TimelineService.name, () => {
  describe('getTimeBuckets', () => {
    it('should get time buckets by month', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });
      const dates = [new Date('1970-01-01'), new Date('1970-02-10'), new Date('1970-02-11'), new Date('1970-02-11')];
      for (const localDateTime of dates) {
        const { asset } = await ctx.newAsset({ ownerId: user.id, localDateTime });
        await ctx.newExif({ assetId: asset.id, make: 'Canon' });
      }

      const response = sut.getTimeBuckets(auth, {});
      await expect(response).resolves.toEqual([
        { count: 3, timeBucket: '1970-02-01' },
        { count: 1, timeBucket: '1970-01-01' },
      ]);
    });

    it('should hide NSFW assets using private review state', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      const localDateTime = new Date('2020-01-15T12:00:00.000Z');

      const { asset: visible } = await ctx.newAsset({ ownerId: user.id, localDateTime });
      const { asset: unreviewedNsfw } = await ctx.newAsset({ ownerId: user.id, localDateTime });
      const { asset: markedSafe } = await ctx.newAsset({ ownerId: user.id, localDateTime });
      const { asset: markedNsfw } = await ctx.newAsset({ ownerId: user.id, localDateTime });
      const { asset: tagOnly } = await ctx.newAsset({ ownerId: user.id, localDateTime });

      for (const assetId of [visible.id, unreviewedNsfw.id, markedSafe.id, markedNsfw.id, tagOnly.id]) {
        await ctx.newExif({ assetId, make: 'Canon' });
      }

      await ctx.newMetadata({
        assetId: unreviewedNsfw.id,
        key: AssetMetadataKey.MlEnrichment,
        value: nsfwMetadata(true),
      });
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

      const [visibleNsfwTag] = await upsertTags(ctx.get(TagRepository), { userId: user.id, tags: ['nsfw'] });
      await ctx.newTagAsset({ tagIds: [visibleNsfwTag.id], assetIds: [tagOnly.id] });

      const hiddenAuth = { ...factory.auth({ user: { id: user.id } }), hideNsfwAssets: true };
      await expect(sut.getTimeBuckets(hiddenAuth, {})).resolves.toEqual([{ count: 3, timeBucket: '2020-01-01' }]);

      const hiddenBucket = JSON.parse(await sut.getTimeBucket(hiddenAuth, { timeBucket: '2020-01-01' }));
      expect(hiddenBucket.id).toEqual(expect.arrayContaining([visible.id, markedSafe.id, tagOnly.id]));
      expect(hiddenBucket.id).not.toEqual(expect.arrayContaining([unreviewedNsfw.id, markedNsfw.id]));

      await expect(sut.getTimeBuckets(factory.auth({ user: { id: user.id } }), {})).resolves.toEqual([
        { count: 5, timeBucket: '2020-01-01' },
      ]);
    });

    it('should return only configured tag, person, and NSFW assets when suppressedOnly is requested', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      const localDateTime = new Date('2020-01-15T12:00:00.000Z');

      const { asset: visible } = await ctx.newAsset({ ownerId: user.id, localDateTime });
      const { asset: tagSuppressed } = await ctx.newAsset({ ownerId: user.id, localDateTime });
      const { asset: faceSuppressed } = await ctx.newAsset({ ownerId: user.id, localDateTime });
      const { asset: nsfwSuppressed } = await ctx.newAsset({ ownerId: user.id, localDateTime });

      for (const assetId of [visible.id, tagSuppressed.id, faceSuppressed.id, nsfwSuppressed.id]) {
        await ctx.newExif({ assetId, make: 'Canon' });
      }

      const [tag] = await upsertTags(ctx.get(TagRepository), { userId: user.id, tags: ['medical'] });
      await ctx.newTagAsset({ tagIds: [tag.id], assetIds: [tagSuppressed.id] });

      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Private Person' });
      await ctx.newAssetFace({ assetId: faceSuppressed.id, personId: person.id });

      await ctx.newMetadata({
        assetId: nsfwSuppressed.id,
        key: AssetMetadataKey.MlEnrichment,
        value: nsfwMetadata(true),
      });

      const suppressedContent: HiddenContentFilter = {
        userId: user.id,
        includeNsfw: true,
        tagIds: [tag.id],
        personIds: [person.id],
        scope: 'owned',
      };
      const hiddenAuth = {
        ...factory.auth({ user: { id: user.id } }),
        hideNsfwAssets: true,
        hiddenContent: suppressedContent,
      };
      const elevatedAuth = {
        ...factory.auth({ user: { id: user.id } }),
        session: { id: factory.uuid(), hasElevatedPermission: true },
        suppressedContent,
      };

      await expect(sut.getTimeBuckets(hiddenAuth, {})).resolves.toEqual([{ count: 1, timeBucket: '2020-01-01' }]);

      const hiddenBucket = JSON.parse(await sut.getTimeBucket(hiddenAuth, { timeBucket: '2020-01-01' }));
      expect(hiddenBucket.id).toEqual([visible.id]);

      await expect(sut.getTimeBuckets(elevatedAuth, { suppressedOnly: true })).resolves.toEqual([
        { count: 3, timeBucket: '2020-01-01' },
      ]);

      const suppressedBucket = JSON.parse(
        await sut.getTimeBucket(elevatedAuth, { timeBucket: '2020-01-01', suppressedOnly: true }),
      );
      expect(suppressedBucket.id).toEqual(
        expect.arrayContaining([tagSuppressed.id, faceSuppressed.id, nsfwSuppressed.id]),
      );
      expect(suppressedBucket.id).not.toEqual(expect.arrayContaining([visible.id]));
    });

    it('should hide NSFW Live Photo motion IDs from hidden timeline buckets', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      const localDateTime = new Date('2020-01-15T12:00:00.000Z');

      const { asset: safeMotion } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });
      const { asset: nsfwMotion } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });
      const { asset: safePhoto } = await ctx.newAsset({
        ownerId: user.id,
        localDateTime,
        livePhotoVideoId: safeMotion.id,
      });
      const { asset: nsfwMotionPhoto } = await ctx.newAsset({
        ownerId: user.id,
        localDateTime,
        livePhotoVideoId: nsfwMotion.id,
      });

      for (const assetId of [safePhoto.id, nsfwMotionPhoto.id]) {
        await ctx.newExif({ assetId, make: 'Canon' });
      }
      await ctx.newMetadata({
        assetId: nsfwMotion.id,
        key: AssetMetadataKey.MlEnrichment,
        value: nsfwMetadata(true),
      });

      const hiddenAuth = { ...factory.auth({ user: { id: user.id } }), hideNsfwAssets: true };
      const hiddenBucket = JSON.parse(await sut.getTimeBucket(hiddenAuth, { timeBucket: '2020-01-01' }));
      expect(hiddenBucket.id).toEqual(expect.arrayContaining([safePhoto.id, nsfwMotionPhoto.id]));
      expect(
        Object.fromEntries(
          hiddenBucket.id.map((id: string, index: number) => [id, hiddenBucket.livePhotoVideoId[index]]),
        ),
      ).toEqual({
        [safePhoto.id]: safeMotion.id,
        [nsfwMotionPhoto.id]: null,
      });

      const visibleBucket = JSON.parse(
        await sut.getTimeBucket(factory.auth({ user: { id: user.id } }), { timeBucket: '2020-01-01' }),
      );
      expect(
        Object.fromEntries(
          visibleBucket.id.map((id: string, index: number) => [id, visibleBucket.livePhotoVideoId[index]]),
        ),
      ).toEqual({
        [safePhoto.id]: safeMotion.id,
        [nsfwMotionPhoto.id]: nsfwMotion.id,
      });
    });

    it('should return error if time bucket is requested with partners asset and archived', async () => {
      const { sut } = setup();
      const auth = factory.auth();
      const response1 = sut.getTimeBuckets(auth, { withPartners: true, visibility: AssetVisibility.Archive });
      await expect(response1).rejects.toBeInstanceOf(BadRequestException);
      await expect(response1).rejects.toThrow(
        'withPartners is only supported for non-archived, non-trashed, non-favorited assets',
      );

      const response2 = sut.getTimeBuckets(auth, { withPartners: true });
      await expect(response2).rejects.toBeInstanceOf(BadRequestException);
      await expect(response2).rejects.toThrow(
        'withPartners is only supported for non-archived, non-trashed, non-favorited assets',
      );
    });

    it('should return error if time bucket is requested with partners asset and favorite', async () => {
      const { sut } = setup();
      const auth = factory.auth();
      const response1 = sut.getTimeBuckets(auth, { withPartners: true, isFavorite: false });
      await expect(response1).rejects.toBeInstanceOf(BadRequestException);
      await expect(response1).rejects.toThrow(
        'withPartners is only supported for non-archived, non-trashed, non-favorited assets',
      );

      const response2 = sut.getTimeBuckets(auth, { withPartners: true, isFavorite: true });
      await expect(response2).rejects.toBeInstanceOf(BadRequestException);
      await expect(response2).rejects.toThrow(
        'withPartners is only supported for non-archived, non-trashed, non-favorited assets',
      );
    });

    it('should return error if time bucket is requested with partners asset and trash', async () => {
      const { sut } = setup();
      const auth = factory.auth();
      const response = sut.getTimeBuckets(auth, { withPartners: true, isTrashed: true });
      await expect(response).rejects.toBeInstanceOf(BadRequestException);
      await expect(response).rejects.toThrow(
        'withPartners is only supported for non-archived, non-trashed, non-favorited assets',
      );
    });

    it('should not allow access for unrelated shared links', async () => {
      const { sut } = setup();
      const auth = factory.auth({ sharedLink: {} });
      const response = sut.getTimeBuckets(auth, {});
      await expect(response).rejects.toBeInstanceOf(BadRequestException);
      await expect(response).rejects.toThrow('Not found or no timeline.read access');
    });
  });

  describe('getTimeBucket', () => {
    it('should return time bucket', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({
        ownerId: user.id,
        localDateTime: new Date('1970-02-12'),
        deletedAt: new Date(),
      });
      await ctx.newExif({ assetId: asset.id, make: 'Canon' });
      const auth = factory.auth({ user: { id: user.id } });
      const rawResponse = await sut.getTimeBucket(auth, { timeBucket: '1970-02-01', isTrashed: true });
      const response = JSON.parse(rawResponse);
      expect(response).toEqual(expect.objectContaining({ isTrashed: [true] }));
    });

    it('should handle a bucket without any assets', async () => {
      const { sut } = setup();
      const rawResponse = await sut.getTimeBucket(factory.auth(), { timeBucket: '1970-02-01' });
      const response = JSON.parse(rawResponse);
      expect(response).toEqual({
        city: [],
        country: [],
        duration: [],
        id: [],
        visibility: [],
        isFavorite: [],
        isImage: [],
        isTrashed: [],
        livePhotoVideoId: [],
        fileCreatedAt: [],
        localOffsetHours: [],
        ownerId: [],
        projectionType: [],
        ratio: [],
        status: [],
        thumbhash: [],
      });
    });

    it('should handle 5 digit years', async () => {
      const { sut } = setup();
      const rawResponse = await sut.getTimeBucket(factory.auth(), { timeBucket: '012345-01-01' });
      const response = JSON.parse(rawResponse);
      expect(response).toEqual(expect.objectContaining({ id: [] }));
    });

    it('should return time bucket in trash', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({
        ownerId: user.id,
        localDateTime: new Date('1970-02-12'),
        deletedAt: new Date(),
      });
      await ctx.newExif({ assetId: asset.id, make: 'Canon' });
      const auth = factory.auth({ user: { id: user.id } });
      const rawResponse = await sut.getTimeBucket(auth, { timeBucket: '1970-02-01', isTrashed: true });
      const response = JSON.parse(rawResponse);
      expect(response).toEqual(expect.objectContaining({ isTrashed: [true] }));
    });

    it('should return false for favorite status unless asset owner', async () => {
      const { sut, ctx } = setup();
      const [{ asset: asset1 }, { asset: asset2 }] = await Promise.all([
        ctx.newUser().then(async ({ user }) => {
          const result = await ctx.newAsset({
            ownerId: user.id,
            fileCreatedAt: new Date('1970-02-12'),
            localDateTime: new Date('1970-02-12'),
            isFavorite: true,
          });
          await ctx.newExif({ assetId: result.asset.id, make: 'Canon' });
          return result;
        }),
        ctx.newUser().then(async ({ user }) => {
          const result = await ctx.newAsset({
            ownerId: user.id,
            fileCreatedAt: new Date('1970-02-13'),
            localDateTime: new Date('1970-02-13'),
            isFavorite: true,
          });
          await ctx.newExif({ assetId: result.asset.id, make: 'Canon' });
          return result;
        }),
      ]);

      await Promise.all([
        ctx.newPartner({ sharedById: asset1.ownerId, sharedWithId: asset2.ownerId }),
        ctx.newPartner({ sharedById: asset2.ownerId, sharedWithId: asset1.ownerId }),
      ]);

      const auth1 = factory.auth({ user: { id: asset1.ownerId } });
      const rawResponse1 = await sut.getTimeBucket(auth1, {
        timeBucket: '1970-02-01',
        withPartners: true,
        visibility: AssetVisibility.Timeline,
      });
      const response1 = JSON.parse(rawResponse1);
      expect(response1).toEqual(expect.objectContaining({ id: [asset2.id, asset1.id], isFavorite: [false, true] }));

      const auth2 = factory.auth({ user: { id: asset2.ownerId } });
      const rawResponse2 = await sut.getTimeBucket(auth2, {
        timeBucket: '1970-02-01',
        withPartners: true,
        visibility: AssetVisibility.Timeline,
      });
      const response2 = JSON.parse(rawResponse2);
      expect(response2).toEqual(expect.objectContaining({ id: [asset2.id, asset1.id], isFavorite: [true, false] }));
    });
  });
});
