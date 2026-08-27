import { Kysely } from 'kysely';
import { BulkIdErrorReason, BulkIdResponseDto } from 'src/dtos/asset-ids.response.dto';
import { AssetStatus, AssetVisibility } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { ActivityRepository } from 'src/repositories/activity.repository';
import { AlbumUserRepository } from 'src/repositories/album-user.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { DuplicateRepository } from 'src/repositories/duplicate.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { DB } from 'src/schema';
import { DuplicateService } from 'src/services/duplicate.service';
import { clearConfigCache } from 'src/utils/config';
import { MediumTestContext, newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { sut, ctx } = newMediumService(DuplicateService, {
    database: db || defaultDatabase,
    real: [
      AccessRepository,
      ActivityRepository,
      AlbumRepository,
      AlbumUserRepository,
      AssetRepository,
      ConfigRepository,
      DuplicateRepository,
      SystemMetadataRepository,
      TagRepository,
    ],
    mock: [EventRepository, JobRepository, LoggingRepository],
  });

  ctx.getMock(EventRepository).emit.mockResolvedValue();
  ctx.getMock(JobRepository).queueAll.mockResolvedValue();

  return { sut, ctx };
};

const newDuplicateAsset = async (
  ctx: MediumTestContext,
  {
    ownerId,
    duplicateId,
    ...dto
  }: { ownerId: string; duplicateId?: string; isFavorite?: boolean; visibility?: AssetVisibility },
  exif: { rating?: number; description?: string; latitude?: number; longitude?: number; fileSizeInByte?: number } = {},
) => {
  const { asset } = await ctx.newAsset({ ownerId, duplicateId, ...dto });
  await ctx.newExif({ assetId: asset.id, fileSizeInByte: 1000, ...exif });
  return asset;
};

const newTag = async (ctx: MediumTestContext, userId: string, value: string) => {
  return ctx.get(TagRepository).create({ userId, value });
};

const newComment = async (
  ctx: MediumTestContext,
  dto: { albumId: string; assetId: string; userId: string; comment: string },
) => {
  return ctx.get(ActivityRepository).create({ ...dto, isLiked: false });
};

const newLike = async (ctx: MediumTestContext, dto: { albumId: string; assetId: string; userId: string }) => {
  return ctx.get(ActivityRepository).create({ ...dto, isLiked: true });
};

const expectSuccess = (results: BulkIdResponseDto[], duplicateId: string) => {
  expect(results).toEqual([{ id: duplicateId, success: true }]);
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

beforeEach(() => {
  clearConfigCache();
});

describe(DuplicateService.name, () => {
  describe('getDuplicates', () => {
    it('should return an empty list when the user has no duplicates', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });

      await expect(sut.getDuplicates(auth)).resolves.toEqual([]);
    });

    it('should return a duplicate group with a suggested keeper', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const duplicateId = factory.uuid();

      const small = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId }, { fileSizeInByte: 1000 });
      const large = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId }, { fileSizeInByte: 2000 });

      const auth = factory.auth({ user: { id: user.id } });
      const duplicates = await sut.getDuplicates(auth);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].duplicateId).toBe(duplicateId);
      expect(duplicates[0].assets.map(({ id }) => id).sort()).toEqual([small.id, large.id].sort());
      // largest file size wins
      expect(duplicates[0].suggestedKeepAssetIds).toEqual([large.id]);
    });

    it('should not return duplicates owned by someone else', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: other } = await ctx.newUser();
      const duplicateId = factory.uuid();

      await newDuplicateAsset(ctx, { ownerId: owner.id, duplicateId });
      await newDuplicateAsset(ctx, { ownerId: owner.id, duplicateId });

      const auth = factory.auth({ user: { id: other.id } });
      await expect(sut.getDuplicates(auth)).resolves.toEqual([]);
    });

    it('should clear the duplicateId of a singleton group', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const duplicateId = factory.uuid();

      const asset = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });

      const auth = factory.auth({ user: { id: user.id } });
      await expect(sut.getDuplicates(auth)).resolves.toEqual([]);

      await expect(ctx.get(AssetRepository).getById(asset.id)).resolves.toMatchObject({ duplicateId: null });
    });
  });

  describe('resolve', () => {
    it('should throw when the duplicate group does not exist', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user: { id: user.id } });

      await expect(
        sut.resolve(auth, { groups: [{ duplicateId: factory.uuid(), keepAssetIds: [], trashAssetIds: [] }] }),
      ).rejects.toThrow('Not found or no duplicate.delete access');
    });

    it('should throw when the duplicate group belongs to another user', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: other } = await ctx.newUser();
      const duplicateId = factory.uuid();

      const asset1 = await newDuplicateAsset(ctx, { ownerId: owner.id, duplicateId });
      const asset2 = await newDuplicateAsset(ctx, { ownerId: owner.id, duplicateId });

      const auth = factory.auth({ user: { id: other.id } });
      await expect(
        sut.resolve(auth, { groups: [{ duplicateId, keepAssetIds: [asset1.id], trashAssetIds: [asset2.id] }] }),
      ).rejects.toThrow('Not found or no duplicate.delete access');
    });

    it('should clear the duplicateId of the keeper and trash the rest', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const duplicateId = factory.uuid();

      const keeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
      const trashed = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });

      const auth = factory.auth({ user: { id: user.id } });
      await expect(
        sut.resolve(auth, { groups: [{ duplicateId, keepAssetIds: [keeper.id], trashAssetIds: [trashed.id] }] }),
      ).resolves.toEqual([{ id: duplicateId, success: true }]);

      const assetRepo = ctx.get(AssetRepository);
      await expect(assetRepo.getById(keeper.id)).resolves.toMatchObject({
        duplicateId: null,
        deletedAt: null,
      });
      await expect(assetRepo.getById(trashed.id)).resolves.toMatchObject({
        duplicateId: null,
        status: AssetStatus.Trashed,
      });
    });

    it('should emit AssetTrashAll for the trashed assets', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const duplicateId = factory.uuid();

      const keeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
      const trashed = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });

      const auth = factory.auth({ user: { id: user.id } });
      expectSuccess(
        await sut.resolve(auth, { groups: [{ duplicateId, keepAssetIds: [keeper.id], trashAssetIds: [trashed.id] }] }),
        duplicateId,
      );

      expect(ctx.getMock(EventRepository).emit).toHaveBeenCalledWith('AssetTrashAll', {
        assetIds: [trashed.id],
        userId: user.id,
      });
    });

    it('should fail when an asset is in both keepAssetIds and trashAssetIds', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const duplicateId = factory.uuid();

      const asset1 = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
      await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });

      const auth = factory.auth({ user: { id: user.id } });
      await expect(
        sut.resolve(auth, { groups: [{ duplicateId, keepAssetIds: [asset1.id], trashAssetIds: [asset1.id] }] }),
      ).resolves.toEqual([
        {
          id: duplicateId,
          success: false,
          error: BulkIdErrorReason.VALIDATION,
          errorMessage: 'An asset cannot be in both keepAssetIds and trashAssetIds',
        },
      ]);
    });

    it('should fail when the group is only partially covered', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const duplicateId = factory.uuid();

      const asset1 = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
      const asset2 = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
      await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });

      const auth = factory.auth({ user: { id: user.id } });
      await expect(
        sut.resolve(auth, { groups: [{ duplicateId, keepAssetIds: [asset1.id], trashAssetIds: [asset2.id] }] }),
      ).resolves.toEqual([
        {
          id: duplicateId,
          success: false,
          error: BulkIdErrorReason.VALIDATION,
          errorMessage: 'Every asset must be in either keepAssetIds or trashAssetIds',
        },
      ]);
    });

    it('should ignore ids that are not members of the group', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const duplicateId = factory.uuid();

      const asset1 = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
      await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
      const outsider = await newDuplicateAsset(ctx, { ownerId: user.id });

      // the outsider is filtered out, which leaves asset2 uncovered
      const auth = factory.auth({ user: { id: user.id } });
      await expect(
        sut.resolve(auth, { groups: [{ duplicateId, keepAssetIds: [asset1.id], trashAssetIds: [outsider.id] }] }),
      ).resolves.toEqual([
        {
          id: duplicateId,
          success: false,
          error: BulkIdErrorReason.VALIDATION,
          errorMessage: 'Every asset must be in either keepAssetIds or trashAssetIds',
        },
      ]);

      await expect(ctx.get(AssetRepository).getById(outsider.id)).resolves.toMatchObject({ deletedAt: null });
    });

    it('should trash every asset when no keepers are given', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const duplicateId = factory.uuid();

      const asset1 = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
      const asset2 = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });

      const auth = factory.auth({ user: { id: user.id } });
      await expect(
        sut.resolve(auth, {
          groups: [{ duplicateId, keepAssetIds: [], trashAssetIds: [asset1.id, asset2.id] }],
        }),
      ).resolves.toEqual([{ id: duplicateId, success: true }]);

      const assetRepo = ctx.get(AssetRepository);
      for (const { id } of [asset1, asset2]) {
        await expect(assetRepo.getById(id)).resolves.toMatchObject({
          duplicateId: null,
          status: AssetStatus.Trashed,
        });
      }
    });

    it('should fail without permission to delete an asset owned by someone else', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: other } = await ctx.newUser();
      const duplicateId = factory.uuid();

      const mine = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
      const theirs = await newDuplicateAsset(ctx, { ownerId: other.id, duplicateId });

      const auth = factory.auth({ user: { id: user.id } });
      await expect(
        sut.resolve(auth, { groups: [{ duplicateId, keepAssetIds: [mine.id], trashAssetIds: [theirs.id] }] }),
      ).resolves.toEqual([
        {
          id: duplicateId,
          success: false,
          error: BulkIdErrorReason.NO_PERMISSION,
          errorMessage: 'No permission to delete assets',
        },
      ]);

      await expect(ctx.get(AssetRepository).getById(theirs.id)).resolves.toMatchObject({ deletedAt: null });
    });

    it('should resolve several groups in one request', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const duplicateId1 = factory.uuid();
      const duplicateId2 = factory.uuid();

      const keeper1 = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId: duplicateId1 });
      const trashed1 = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId: duplicateId1 });
      const keeper2 = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId: duplicateId2 });
      const trashed2 = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId: duplicateId2 });

      const auth = factory.auth({ user: { id: user.id } });
      await expect(
        sut.resolve(auth, {
          groups: [
            { duplicateId: duplicateId1, keepAssetIds: [keeper1.id], trashAssetIds: [trashed1.id] },
            { duplicateId: duplicateId2, keepAssetIds: [keeper2.id], trashAssetIds: [trashed2.id] },
          ],
        }),
      ).resolves.toEqual([
        { id: duplicateId1, success: true },
        { id: duplicateId2, success: true },
      ]);

      const assetRepo = ctx.get(AssetRepository);
      await expect(assetRepo.getById(trashed1.id)).resolves.toMatchObject({ status: AssetStatus.Trashed });
      await expect(assetRepo.getById(trashed2.id)).resolves.toMatchObject({ status: AssetStatus.Trashed });
    });

    it('should report per-group failures without abandoning the valid groups', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const goodId = factory.uuid();
      const badId = factory.uuid();

      const keeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId: goodId });
      const trashed = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId: goodId });
      // the bad group exists (so access passes) but is left partially covered
      const badKeeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId: badId });
      await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId: badId });

      const auth = factory.auth({ user: { id: user.id } });
      const results = await sut.resolve(auth, {
        groups: [
          { duplicateId: goodId, keepAssetIds: [keeper.id], trashAssetIds: [trashed.id] },
          { duplicateId: badId, keepAssetIds: [badKeeper.id], trashAssetIds: [] },
        ],
      });

      expect(results).toEqual([
        { id: goodId, success: true },
        {
          id: badId,
          success: false,
          error: BulkIdErrorReason.VALIDATION,
          errorMessage: 'Every asset must be in either keepAssetIds or trashAssetIds',
        },
      ]);

      // the good group still went through
      await expect(ctx.get(AssetRepository).getById(trashed.id)).resolves.toMatchObject({
        status: AssetStatus.Trashed,
      });
    });

    describe('metadata merging', () => {
      it('should merge isFavorite into the keeper', async () => {
        const { sut, ctx } = setup();
        const { user } = await ctx.newUser();
        const duplicateId = factory.uuid();

        const keeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId, isFavorite: false });
        const trashed = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId, isFavorite: true });

        const auth = factory.auth({ user: { id: user.id } });
        expectSuccess(
          await sut.resolve(auth, {
            groups: [{ duplicateId, keepAssetIds: [keeper.id], trashAssetIds: [trashed.id] }],
          }),
          duplicateId,
        );

        await expect(ctx.get(AssetRepository).getById(keeper.id)).resolves.toMatchObject({
          isFavorite: true,
          duplicateId: null,
        });
      });

      it('should merge the most restrictive visibility into the keeper', async () => {
        const { sut, ctx } = setup();
        const { user } = await ctx.newUser();
        const duplicateId = factory.uuid();

        const keeperAsset = await newDuplicateAsset(ctx, {
          ownerId: user.id,
          duplicateId,
          visibility: AssetVisibility.Timeline,
        });
        const trashedAsset = await newDuplicateAsset(ctx, {
          ownerId: user.id,
          duplicateId,
          visibility: AssetVisibility.Archive,
        });

        const auth = factory.auth({ user: { id: user.id } });
        expectSuccess(
          await sut.resolve(auth, {
            groups: [{ duplicateId, keepAssetIds: [keeperAsset.id], trashAssetIds: [trashedAsset.id] }],
          }),
          duplicateId,
        );

        await expect(ctx.get(AssetRepository).getById(keeperAsset.id)).resolves.toMatchObject({
          visibility: AssetVisibility.Archive,
          duplicateId: null,
        });
      });

      it('should merge the highest rating into the keeper', async () => {
        const { sut, ctx } = setup();
        const { user } = await ctx.newUser();
        const duplicateId = factory.uuid();

        const keeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId }, { rating: 1 });
        const trashed = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId }, { rating: 5 });

        const auth = factory.auth({ user: { id: user.id } });
        expectSuccess(
          await sut.resolve(auth, {
            groups: [{ duplicateId, keepAssetIds: [keeper.id], trashAssetIds: [trashed.id] }],
          }),
          duplicateId,
        );

        const result = await ctx.get(AssetRepository).getById(keeper.id, { exifInfo: true });
        expect(result?.exifInfo).toMatchObject({ rating: 5 });
      });

      it('should merge distinct description lines into the keeper', async () => {
        const { sut, ctx } = setup();
        const { user } = await ctx.newUser();
        const duplicateId = factory.uuid();

        const keeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId }, { description: 'from keeper' });
        const trashed = await newDuplicateAsset(
          ctx,
          { ownerId: user.id, duplicateId },
          { description: 'from trashed' },
        );

        const auth = factory.auth({ user: { id: user.id } });
        expectSuccess(
          await sut.resolve(auth, {
            groups: [{ duplicateId, keepAssetIds: [keeper.id], trashAssetIds: [trashed.id] }],
          }),
          duplicateId,
        );

        const result = await ctx.get(AssetRepository).getById(keeper.id, { exifInfo: true });
        expect(result?.exifInfo?.description?.split('\n').sort()).toEqual(['from keeper', 'from trashed']);
      });

      it('should merge a location that both assets agree on', async () => {
        const { sut, ctx } = setup();
        const { user } = await ctx.newUser();
        const duplicateId = factory.uuid();

        const keeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const trashed = await newDuplicateAsset(
          ctx,
          { ownerId: user.id, duplicateId },
          { latitude: 40.7128, longitude: -74.006 },
        );

        const auth = factory.auth({ user: { id: user.id } });
        expectSuccess(
          await sut.resolve(auth, {
            groups: [{ duplicateId, keepAssetIds: [keeper.id], trashAssetIds: [trashed.id] }],
          }),
          duplicateId,
        );

        const result = await ctx.get(AssetRepository).getById(keeper.id, { exifInfo: true });
        expect(result?.exifInfo).toMatchObject({ latitude: 40.7128, longitude: -74.006 });
      });

      it('should not merge a location the assets disagree on', async () => {
        const { sut, ctx } = setup();
        const { user } = await ctx.newUser();
        const duplicateId = factory.uuid();

        const keeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId }, { latitude: 1, longitude: 1 });
        const trashed = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId }, { latitude: 2, longitude: 2 });

        const auth = factory.auth({ user: { id: user.id } });
        expectSuccess(
          await sut.resolve(auth, {
            groups: [{ duplicateId, keepAssetIds: [keeper.id], trashAssetIds: [trashed.id] }],
          }),
          duplicateId,
        );

        const result = await ctx.get(AssetRepository).getById(keeper.id, { exifInfo: true });
        expect(result?.exifInfo).toMatchObject({ latitude: 1, longitude: 1 });
      });

      it('should add the keeper to every album the group belonged to', async () => {
        const { sut, ctx } = setup();
        const { user } = await ctx.newUser();
        const duplicateId = factory.uuid();

        const keeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const trashed = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });

        const { album: album1 } = await ctx.newAlbum({ ownerId: user.id }, [keeper.id]);
        const { album: album2 } = await ctx.newAlbum({ ownerId: user.id }, [trashed.id]);

        const auth = factory.auth({ user: { id: user.id } });
        expectSuccess(
          await sut.resolve(auth, {
            groups: [{ duplicateId, keepAssetIds: [keeper.id], trashAssetIds: [trashed.id] }],
          }),
          duplicateId,
        );

        const albumRepo = ctx.get(AlbumRepository);
        await expect(albumRepo.getAssetIds(album1.id, [keeper.id])).resolves.toEqual(new Set([keeper.id]));
        await expect(albumRepo.getAssetIds(album2.id, [keeper.id])).resolves.toEqual(new Set([keeper.id]));
      });

      it('should merge the tags of the group onto the keeper', async () => {
        const { sut, ctx } = setup();
        const { user } = await ctx.newUser();
        const duplicateId = factory.uuid();

        const keeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const trashed = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });

        const tag1 = await newTag(ctx, user.id, 'tag1');
        const tag2 = await newTag(ctx, user.id, 'tag2');
        await ctx.newTagAsset({ tagIds: [tag1.id], assetIds: [keeper.id] });
        await ctx.newTagAsset({ tagIds: [tag2.id], assetIds: [trashed.id] });

        const auth = factory.auth({ user: { id: user.id } });
        expectSuccess(
          await sut.resolve(auth, {
            groups: [{ duplicateId, keepAssetIds: [keeper.id], trashAssetIds: [trashed.id] }],
          }),
          duplicateId,
        );

        const result = await ctx.get(AssetRepository).getById(keeper.id, { tags: true });
        expect(result?.tags?.map(({ id }) => id).sort()).toEqual([tag1.id, tag2.id].sort());
      });

      it('should not merge metadata when there is more than one keeper', async () => {
        const { sut, ctx } = setup();
        const { user } = await ctx.newUser();
        const duplicateId = factory.uuid();

        const keeper1 = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId, isFavorite: false });
        const keeper2 = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId, isFavorite: true });

        const auth = factory.auth({ user: { id: user.id } });
        await expect(
          sut.resolve(auth, {
            groups: [{ duplicateId, keepAssetIds: [keeper1.id, keeper2.id], trashAssetIds: [] }],
          }),
        ).resolves.toEqual([{ id: duplicateId, success: true }]);

        await expect(ctx.get(AssetRepository).getById(keeper1.id)).resolves.toMatchObject({
          isFavorite: false,
          duplicateId: null,
        });
      });
    });

    describe('activity merging', () => {
      it('should move a comment on a trashed duplicate onto the keeper', async () => {
        const { sut, ctx } = setup();
        const { user } = await ctx.newUser();
        const duplicateId = factory.uuid();

        const keeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const trashed = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const { album } = await ctx.newAlbum({ ownerId: user.id }, [trashed.id]);

        await newComment(ctx, { albumId: album.id, assetId: trashed.id, userId: user.id, comment: 'nice one' });

        const auth = factory.auth({ user: { id: user.id } });
        expectSuccess(
          await sut.resolve(auth, {
            groups: [{ duplicateId, keepAssetIds: [keeper.id], trashAssetIds: [trashed.id] }],
          }),
          duplicateId,
        );

        // activity search hides activities on trashed assets, so an unmoved comment reads as gone
        await expect(ctx.get(ActivityRepository).search({ albumId: album.id })).resolves.toEqual([
          expect.objectContaining({ assetId: keeper.id, comment: 'nice one', isLiked: false }),
        ]);
      });

      it('should move a comment left by another album member', async () => {
        const { sut, ctx } = setup();
        const { user } = await ctx.newUser();
        const { user: member } = await ctx.newUser();
        const duplicateId = factory.uuid();

        const keeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const trashed = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const { album } = await ctx.newAlbum({ ownerId: user.id }, [trashed.id]);
        await ctx.newAlbumUser({ albumId: album.id, userId: member.id });

        await newComment(ctx, { albumId: album.id, assetId: trashed.id, userId: member.id, comment: 'from a friend' });

        const auth = factory.auth({ user: { id: user.id } });
        expectSuccess(
          await sut.resolve(auth, {
            groups: [{ duplicateId, keepAssetIds: [keeper.id], trashAssetIds: [trashed.id] }],
          }),
          duplicateId,
        );

        await expect(ctx.get(ActivityRepository).search({ albumId: album.id })).resolves.toEqual([
          expect.objectContaining({ assetId: keeper.id, userId: member.id, comment: 'from a friend' }),
        ]);
      });

      it('should merge the comments of both copies onto the keeper', async () => {
        const { sut, ctx } = setup();
        const { user } = await ctx.newUser();
        const duplicateId = factory.uuid();

        const keeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const trashed = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const { album } = await ctx.newAlbum({ ownerId: user.id }, [keeper.id, trashed.id]);

        await newComment(ctx, { albumId: album.id, assetId: keeper.id, userId: user.id, comment: 'on the keeper' });
        await newComment(ctx, { albumId: album.id, assetId: trashed.id, userId: user.id, comment: 'on the trashed' });

        const auth = factory.auth({ user: { id: user.id } });
        expectSuccess(
          await sut.resolve(auth, {
            groups: [{ duplicateId, keepAssetIds: [keeper.id], trashAssetIds: [trashed.id] }],
          }),
          duplicateId,
        );

        // the keeper's own comment stays put and the trashed copy's comment joins it
        const activities = await ctx.get(ActivityRepository).search({ albumId: album.id });
        expect(activities.every(({ assetId }) => assetId === keeper.id)).toBe(true);
        expect(activities.map(({ comment }) => comment).sort()).toEqual(['on the keeper', 'on the trashed']);
      });

      it('should keep both comments when the copies carry the same text', async () => {
        const { sut, ctx } = setup();
        const { user } = await ctx.newUser();
        const duplicateId = factory.uuid();

        const keeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const trashed = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const { album } = await ctx.newAlbum({ ownerId: user.id }, [keeper.id, trashed.id]);

        await newComment(ctx, { albumId: album.id, assetId: keeper.id, userId: user.id, comment: 'same' });
        await newComment(ctx, { albumId: album.id, assetId: trashed.id, userId: user.id, comment: 'same' });

        const auth = factory.auth({ user: { id: user.id } });
        expectSuccess(
          await sut.resolve(auth, {
            groups: [{ duplicateId, keepAssetIds: [keeper.id], trashAssetIds: [trashed.id] }],
          }),
          duplicateId,
        );

        // two separate comments really did exist, so both are kept rather than silently collapsed
        const activities = await ctx.get(ActivityRepository).search({ albumId: album.id, assetId: keeper.id });
        expect(activities).toHaveLength(2);
        expect(activities.map(({ comment }) => comment)).toEqual(['same', 'same']);
      });

      it('should move a like on a trashed duplicate onto the keeper', async () => {
        const { sut, ctx } = setup();
        const { user } = await ctx.newUser();
        const duplicateId = factory.uuid();

        const keeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const trashed = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const { album } = await ctx.newAlbum({ ownerId: user.id }, [trashed.id]);

        await newLike(ctx, { albumId: album.id, assetId: trashed.id, userId: user.id });

        const auth = factory.auth({ user: { id: user.id } });
        expectSuccess(
          await sut.resolve(auth, {
            groups: [{ duplicateId, keepAssetIds: [keeper.id], trashAssetIds: [trashed.id] }],
          }),
          duplicateId,
        );

        await expect(ctx.get(ActivityRepository).search({ albumId: album.id })).resolves.toEqual([
          expect.objectContaining({ assetId: keeper.id, userId: user.id, isLiked: true }),
        ]);
      });

      it('should not violate the like constraint when both copies were liked by the same user', async () => {
        const { sut, ctx } = setup();
        const { user } = await ctx.newUser();
        const duplicateId = factory.uuid();

        const keeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const trashed = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const { album } = await ctx.newAlbum({ ownerId: user.id }, [keeper.id, trashed.id]);

        await newLike(ctx, { albumId: album.id, assetId: keeper.id, userId: user.id });
        await newLike(ctx, { albumId: album.id, assetId: trashed.id, userId: user.id });

        const auth = factory.auth({ user: { id: user.id } });
        expectSuccess(
          await sut.resolve(auth, {
            groups: [{ duplicateId, keepAssetIds: [keeper.id], trashAssetIds: [trashed.id] }],
          }),
          duplicateId,
        );

        await expect(
          ctx.get(ActivityRepository).search({ albumId: album.id, assetId: keeper.id, isLiked: true }),
        ).resolves.toHaveLength(1);
      });

      it('should move only one like when two trashed copies were liked by the same user', async () => {
        const { sut, ctx } = setup();
        const { user } = await ctx.newUser();
        const duplicateId = factory.uuid();

        const keeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const trashed1 = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const trashed2 = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const { album } = await ctx.newAlbum({ ownerId: user.id }, [trashed1.id, trashed2.id]);

        await newLike(ctx, { albumId: album.id, assetId: trashed1.id, userId: user.id });
        await newLike(ctx, { albumId: album.id, assetId: trashed2.id, userId: user.id });

        const auth = factory.auth({ user: { id: user.id } });
        expectSuccess(
          await sut.resolve(auth, {
            groups: [{ duplicateId, keepAssetIds: [keeper.id], trashAssetIds: [trashed1.id, trashed2.id] }],
          }),
          duplicateId,
        );

        await expect(
          ctx.get(ActivityRepository).search({ albumId: album.id, assetId: keeper.id, isLiked: true }),
        ).resolves.toHaveLength(1);
      });

      it('should leave an activity alone when the keeper is not a member of its album', async () => {
        const { ctx } = setup();
        const { user } = await ctx.newUser();

        const keeper = await newDuplicateAsset(ctx, { ownerId: user.id });
        const loser = await newDuplicateAsset(ctx, { ownerId: user.id });
        const { album } = await ctx.newAlbum({ ownerId: user.id }, [loser.id]);

        const comment = await newComment(ctx, {
          albumId: album.id,
          assetId: loser.id,
          userId: user.id,
          comment: 'unreachable if moved',
        });

        // the (albumId, assetId) foreign key would reject the move, so the row stays put
        const activityRepo = ctx.get(ActivityRepository);
        await expect(
          activityRepo.mergeAssetActivities({ sourceAssetIds: [loser.id], targetAssetId: keeper.id }),
        ).resolves.toBe(0);

        await expect(activityRepo.search({ albumId: album.id })).resolves.toEqual([
          expect.objectContaining({ id: comment.id, assetId: loser.id }),
        ]);
      });
    });

    describe('when trash is disabled', () => {
      it('should delete instead of trash', async () => {
        const { sut, ctx } = setup();
        const { user } = await ctx.newUser();
        const duplicateId = factory.uuid();

        const keeper = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });
        const trashed = await newDuplicateAsset(ctx, { ownerId: user.id, duplicateId });

        const config = await ctx.getConfig();
        await ctx.updateConfig({ ...config, trash: { ...config.trash, enabled: false } });
        clearConfigCache();

        const auth = factory.auth({ user: { id: user.id } });
        await expect(
          sut.resolve(auth, { groups: [{ duplicateId, keepAssetIds: [keeper.id], trashAssetIds: [trashed.id] }] }),
        ).resolves.toEqual([{ id: duplicateId, success: true }]);

        await expect(ctx.get(AssetRepository).getById(trashed.id)).resolves.toMatchObject({
          duplicateId: null,
          status: AssetStatus.Deleted,
        });

        expect(ctx.getMock(EventRepository).emit).toHaveBeenCalledWith('AssetDeleteAll', {
          assetIds: [trashed.id],
          userId: user.id,
        });
      });
    });
  });
});
