import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AssetJobName, AssetStatsResponseDto } from 'src/dtos/asset.dto';
import { AssetEditAction, MirrorAxis } from 'src/dtos/editing.dto';
import { AssetFileType, AssetMetadataKey, AssetStatus, AssetType, AssetVisibility, JobName, JobStatus } from 'src/enum';
import { AssetStats } from 'src/repositories/asset.repository';
import { AssetService } from 'src/services/asset.service';
import { AssetFactory } from 'test/factories/asset.factory';
import { AuthFactory } from 'test/factories/auth.factory';
import { authStub } from 'test/fixtures/auth.stub';
import { factory, newUuid } from 'test/small.factory';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';

const stats: AssetStats = {
  [AssetType.Image]: 10,
  [AssetType.Video]: 23,
  [AssetType.Audio]: 0,
  [AssetType.Other]: 0,
};

const statResponse: AssetStatsResponseDto = {
  images: 10,
  videos: 23,
  total: 33,
};

describe(AssetService.name, () => {
  let sut: AssetService;
  let mocks: ServiceMocks;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  beforeEach(() => {
    ({ sut, mocks } = newTestService(AssetService));
  });

  describe('getStatistics', () => {
    it('should get the statistics for a user, excluding archived assets', async () => {
      const auth = AuthFactory.create();
      mocks.asset.getStatistics.mockResolvedValue(stats);
      await expect(sut.getStatistics(auth, { visibility: AssetVisibility.Timeline })).resolves.toEqual(statResponse);
      expect(mocks.asset.getStatistics).toHaveBeenCalledWith(auth.user.id, { visibility: AssetVisibility.Timeline });
    });

    it('should get the statistics for a user for archived assets', async () => {
      const auth = AuthFactory.create();
      mocks.asset.getStatistics.mockResolvedValue(stats);
      await expect(sut.getStatistics(auth, { visibility: AssetVisibility.Archive })).resolves.toEqual(statResponse);
      expect(mocks.asset.getStatistics).toHaveBeenCalledWith(auth.user.id, {
        visibility: AssetVisibility.Archive,
      });
    });

    it('should get the statistics for a user for favorite assets', async () => {
      const auth = AuthFactory.create();
      mocks.asset.getStatistics.mockResolvedValue(stats);
      await expect(sut.getStatistics(auth, { isFavorite: true })).resolves.toEqual(statResponse);
      expect(mocks.asset.getStatistics).toHaveBeenCalledWith(auth.user.id, { isFavorite: true });
    });

    it('should get the statistics for a user for all assets', async () => {
      const auth = AuthFactory.create();
      mocks.asset.getStatistics.mockResolvedValue(stats);
      await expect(sut.getStatistics(auth, {})).resolves.toEqual(statResponse);
      expect(mocks.asset.getStatistics).toHaveBeenCalledWith(auth.user.id, {});
    });

    it('should require elevated permission for locked assets', async () => {
      const auth = factory.auth({ user: {} });

      await expect(sut.getStatistics(auth, { visibility: AssetVisibility.Locked })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(mocks.asset.getStatistics).not.toHaveBeenCalled();
    });
  });

  describe('getRandom', () => {
    it('should get own random assets', async () => {
      mocks.partner.getAll.mockResolvedValue([]);
      mocks.asset.getRandom.mockResolvedValue([AssetFactory.create()]);

      await sut.getRandom(authStub.admin, 1);

      expect(mocks.asset.getRandom).toHaveBeenCalledWith([authStub.admin.user.id], 1);
    });

    it('should not include partner assets if not in timeline', async () => {
      const partner = factory.partner({ inTimeline: false });
      const auth = factory.auth({ user: { id: partner.sharedWithId } });

      mocks.asset.getRandom.mockResolvedValue([AssetFactory.create()]);
      mocks.partner.getAll.mockResolvedValue([partner]);

      await sut.getRandom(auth, 1);

      expect(mocks.asset.getRandom).toHaveBeenCalledWith([auth.user.id], 1);
    });

    it('should include partner assets if in timeline', async () => {
      const partner = factory.partner({ inTimeline: true });
      const auth = factory.auth({ user: { id: partner.sharedWithId } });

      mocks.asset.getRandom.mockResolvedValue([AssetFactory.create()]);
      mocks.partner.getAll.mockResolvedValue([partner]);

      await sut.getRandom(auth, 1);

      expect(mocks.asset.getRandom).toHaveBeenCalledWith([auth.user.id, partner.sharedById], 1);
    });
  });

  describe('get', () => {
    it('should allow owner access', async () => {
      const asset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getById.mockResolvedValue(asset);

      await sut.get(authStub.admin, asset.id);

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set([asset.id]),
        undefined,
      );
    });

    it('should allow shared link access', async () => {
      const asset = AssetFactory.create();
      mocks.access.asset.checkSharedLinkAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getById.mockResolvedValue(asset);

      await sut.get(authStub.adminSharedLink, asset.id);

      expect(mocks.access.asset.checkSharedLinkAccess).toHaveBeenCalledWith(
        authStub.adminSharedLink.sharedLink?.id,
        new Set([asset.id]),
      );
    });

    it('should strip metadata for shared link if exif is disabled', async () => {
      const asset = AssetFactory.from().exif({ description: 'foo' }).build();
      mocks.access.asset.checkSharedLinkAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getById.mockResolvedValue(asset);

      const result = await sut.get(
        { ...authStub.adminSharedLink, sharedLink: { ...authStub.adminSharedLink.sharedLink!, showExif: false } },
        asset.id,
      );

      expect(result).toEqual(expect.objectContaining({ hasMetadata: false }));
      expect(result).not.toHaveProperty('exifInfo');
      expect(mocks.access.asset.checkSharedLinkAccess).toHaveBeenCalledWith(
        authStub.adminSharedLink.sharedLink?.id,
        new Set([asset.id]),
      );
    });

    it('should delete owner from response for shared link with showExif', async () => {
      const asset = AssetFactory.from().exif({ description: 'foo' }).build();
      mocks.access.asset.checkSharedLinkAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getById.mockResolvedValue(asset);

      const result = await sut.get(
        { ...authStub.adminSharedLink, sharedLink: { ...authStub.adminSharedLink.sharedLink!, showExif: true } },
        asset.id,
      );

      expect(result).not.toHaveProperty('owner');
    });

    it('should clear people for non-owner access', async () => {
      const asset = AssetFactory.from().exif().build();
      mocks.access.asset.checkPartnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getById.mockResolvedValue(asset);

      const result = await sut.get(authStub.admin, asset.id);

      expect(result).toHaveProperty('people', []);
    });

    it('should allow partner sharing access', async () => {
      const asset = AssetFactory.create();
      mocks.access.asset.checkPartnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getById.mockResolvedValue(asset);

      await sut.get(authStub.admin, asset.id);

      expect(mocks.access.asset.checkPartnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set([asset.id]));
    });

    it('should allow shared album access', async () => {
      const asset = AssetFactory.create();
      mocks.access.asset.checkAlbumAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getById.mockResolvedValue(asset);

      await sut.get(authStub.admin, asset.id);

      expect(mocks.access.asset.checkAlbumAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set([asset.id]));
    });

    it('should throw an error for no access', async () => {
      await expect(sut.get(authStub.admin, AssetFactory.create().id)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.asset.getById).not.toHaveBeenCalled();
    });

    it('should throw an error for an invalid shared link', async () => {
      await expect(sut.get(authStub.adminSharedLink, AssetFactory.create().id)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.access.asset.checkOwnerAccess).not.toHaveBeenCalled();
      expect(mocks.asset.getById).not.toHaveBeenCalled();
    });

    it('should throw an error if the asset could not be found', async () => {
      const asset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));

      await expect(sut.get(authStub.admin, asset.id)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    it('should require asset write access for the id', async () => {
      await expect(
        sut.update(authStub.admin, 'asset-1', { visibility: AssetVisibility.Timeline }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should update the asset', async () => {
      const asset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.asset.update.mockResolvedValue(asset);

      await sut.update(authStub.admin, asset.id, { isFavorite: true });

      expect(mocks.asset.update).toHaveBeenCalledWith({ id: asset.id, isFavorite: true });
    });

    it('should update the exif description', async () => {
      const asset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.asset.update.mockResolvedValue(asset);

      await sut.update(authStub.admin, asset.id, { description: 'Test description' });

      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        { assetId: asset.id, description: 'Test description', lockedProperties: ['description'] },
        { lockedPropertiesBehavior: 'append' },
      );
    });

    it('should update the exif rating', async () => {
      const asset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getById.mockResolvedValueOnce(asset);
      mocks.asset.update.mockResolvedValueOnce(asset);

      await sut.update(authStub.admin, asset.id, { rating: 3 });

      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        {
          assetId: asset.id,
          rating: 3,
          lockedProperties: ['rating'],
        },
        { lockedPropertiesBehavior: 'append' },
      );
    });

    it('should fail linking a live video if the motion part could not be found', async () => {
      const auth = AuthFactory.create();
      const asset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));

      await expect(
        sut.update(auth, asset.id, {
          livePhotoVideoId: 'unknown',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.asset.update).not.toHaveBeenCalledWith({
        id: asset.id,
        livePhotoVideoId: 'unknown',
      });
      expect(mocks.asset.update).not.toHaveBeenCalledWith({
        id: 'unknown',
        visibility: AssetVisibility.Timeline,
      });
      expect(mocks.event.emit).not.toHaveBeenCalledWith('AssetShow', {
        assetId: 'unknown',
        userId: auth.user.id,
      });
    });

    it('should fail linking a live video if the motion part is not a video', async () => {
      const auth = AuthFactory.create();
      const motionAsset = AssetFactory.from().owner(auth.user).build();
      const asset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getById.mockResolvedValue(asset);

      await expect(
        sut.update(authStub.admin, asset.id, {
          livePhotoVideoId: motionAsset.id,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.asset.update).not.toHaveBeenCalledWith({
        id: asset.id,
        livePhotoVideoId: motionAsset.id,
      });
      expect(mocks.asset.update).not.toHaveBeenCalledWith({
        id: motionAsset.id,
        visibility: AssetVisibility.Timeline,
      });
      expect(mocks.event.emit).not.toHaveBeenCalledWith('AssetShow', {
        assetId: motionAsset.id,
        userId: auth.user.id,
      });
    });

    it('should fail linking a live video if the motion part has a different owner', async () => {
      const auth = AuthFactory.create();
      const motionAsset = AssetFactory.create({ type: AssetType.Video });
      const asset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getById.mockResolvedValue(motionAsset);

      await expect(
        sut.update(auth, asset.id, {
          livePhotoVideoId: motionAsset.id,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.asset.update).not.toHaveBeenCalledWith({
        id: asset.id,
        livePhotoVideoId: motionAsset.id,
      });
      expect(mocks.asset.update).not.toHaveBeenCalledWith({
        id: motionAsset.id,
        visibility: AssetVisibility.Timeline,
      });
      expect(mocks.event.emit).not.toHaveBeenCalledWith('AssetShow', {
        assetId: motionAsset.id,
        userId: auth.user.id,
      });
    });

    it('should link a live video', async () => {
      const motionAsset = AssetFactory.create({ type: AssetType.Video, visibility: AssetVisibility.Timeline });
      const stillAsset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([stillAsset.id]));
      mocks.asset.getById.mockResolvedValueOnce(motionAsset);
      mocks.asset.getById.mockResolvedValueOnce(stillAsset);
      mocks.asset.update.mockResolvedValue(stillAsset);
      const auth = AuthFactory.from(motionAsset.owner).build();

      await sut.update(auth, stillAsset.id, { livePhotoVideoId: motionAsset.id });

      expect(mocks.asset.update).toHaveBeenCalledWith({ id: motionAsset.id, visibility: AssetVisibility.Hidden });
      expect(mocks.event.emit).toHaveBeenCalledWith('AssetHide', { assetId: motionAsset.id, userId: auth.user.id });
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: stillAsset.id, livePhotoVideoId: motionAsset.id });
    });

    it('should throw an error if asset could not be found after update', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      await expect(sut.update(AuthFactory.create(), 'asset-1', { isFavorite: true })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should unlink a live video', async () => {
      const auth = AuthFactory.create();
      const motionAsset = AssetFactory.from({ type: AssetType.Video, visibility: AssetVisibility.Hidden })
        .owner(auth.user)
        .build();
      const asset = AssetFactory.create({ livePhotoVideoId: motionAsset.id });
      const unlinkedAsset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getById.mockResolvedValueOnce(asset);
      mocks.asset.getById.mockResolvedValueOnce(motionAsset);
      mocks.asset.update.mockResolvedValueOnce(unlinkedAsset);

      await sut.update(auth, asset.id, { livePhotoVideoId: null });

      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: asset.id,
        livePhotoVideoId: null,
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: motionAsset.id,
        visibility: asset.visibility,
      });
      expect(mocks.event.emit).toHaveBeenCalledWith('AssetShow', {
        assetId: motionAsset.id,
        userId: auth.user.id,
      });
    });

    it('should fail unlinking a live video if the asset could not be found', async () => {
      const asset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getById.mockResolvedValueOnce(void 0);

      await expect(sut.update(authStub.admin, asset.id, { livePhotoVideoId: null })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.asset.update).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it('should not call onBeforeUnlink when unlinking and asset has no livePhotoVideoId', async () => {
      const auth = AuthFactory.create();
      const asset = AssetFactory.create({ livePhotoVideoId: null });
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getById.mockResolvedValueOnce(asset);
      mocks.asset.update.mockResolvedValueOnce(asset);

      await sut.update(auth, asset.id, { livePhotoVideoId: null });

      expect(mocks.asset.update).toHaveBeenCalledWith({ id: asset.id, livePhotoVideoId: null });
    });

    it('should update latitude and longitude', async () => {
      const asset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.update.mockResolvedValue(asset);

      await sut.update(authStub.admin, asset.id, { latitude: 40.7128, longitude: -74.006 });

      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          assetId: asset.id,
          latitude: 40.7128,
          longitude: -74.006,
        }),
        { lockedPropertiesBehavior: 'append' },
      );
      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.SidecarWrite, data: { id: asset.id } });
    });
  });

  describe('updateAll', () => {
    it('should require asset write access for all ids', async () => {
      const auth = AuthFactory.create();
      await expect(sut.updateAll(auth, { ids: ['asset-1'] })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should update all assets', async () => {
      const auth = AuthFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2']));

      await sut.updateAll(auth, { ids: ['asset-1', 'asset-2'], visibility: AssetVisibility.Archive });

      expect(mocks.asset.updateAll).toHaveBeenCalledWith(['asset-1', 'asset-2'], {
        visibility: AssetVisibility.Archive,
      });
    });

    it('should not update Assets table if no relevant fields are provided', async () => {
      const auth = AuthFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.updateAll(auth, {
        ids: ['asset-1'],
        latitude: 0,
        longitude: 0,
        isFavorite: undefined,
        duplicateId: undefined,
        rating: undefined,
      });
      expect(mocks.asset.updateAll).not.toHaveBeenCalled();
    });

    it('should update Assets table if visibility field is provided', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.updateAll(authStub.admin, {
        ids: ['asset-1'],
        latitude: 0,
        longitude: 0,
        visibility: AssetVisibility.Archive,
        isFavorite: false,
        duplicateId: undefined,
        rating: undefined,
      });
      expect(mocks.asset.updateAll).toHaveBeenCalled();
      expect(mocks.asset.updateAllExif).toHaveBeenCalledWith(['asset-1'], { latitude: 0, longitude: 0 });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.SidecarWrite, data: { id: 'asset-1' } }]);
    });

    it('should update exif table if latitude field is provided', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      const dateTimeOriginal = new Date().toISOString();
      await sut.updateAll(authStub.admin, {
        ids: ['asset-1'],
        latitude: 30,
        longitude: 50,
        dateTimeOriginal,
        isFavorite: false,
        duplicateId: undefined,
        rating: undefined,
      });
      expect(mocks.asset.updateAll).toHaveBeenCalled();
      expect(mocks.asset.updateAllExif).toHaveBeenCalledWith(['asset-1'], {
        dateTimeOriginal,
        latitude: 30,
        longitude: 50,
      });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.SidecarWrite, data: { id: 'asset-1' } }]);
    });

    it('should update Assets table if duplicateId is provided as null', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.updateAll(authStub.admin, {
        ids: ['asset-1'],
        latitude: 0,
        longitude: 0,
        isFavorite: undefined,
        duplicateId: null,
        rating: undefined,
      });
      expect(mocks.asset.updateAll).toHaveBeenCalled();
    });

    it('should update exif table if dateTimeRelative and timeZone field is provided', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      const dateTimeRelative = 35;
      const timeZone = 'UTC+2';
      mocks.asset.updateDateTimeOriginal.mockResolvedValue([
        { assetId: 'asset-1', dateTimeOriginal: new Date('2020-02-25T04:41:00'), timeZone },
      ]);
      await sut.updateAll(authStub.admin, {
        ids: ['asset-1'],
        dateTimeRelative,
        timeZone,
      });
      expect(mocks.asset.updateDateTimeOriginal).toHaveBeenCalledWith(['asset-1'], dateTimeRelative, timeZone);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.SidecarWrite, data: { id: 'asset-1' } }]);
    });

    it('should remove assets from all albums when visibility is Locked', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.updateAll(authStub.admin, {
        ids: ['asset-1'],
        visibility: AssetVisibility.Locked,
      });

      expect(mocks.album.removeAssetsFromAll).toHaveBeenCalledWith(['asset-1']);
    });

    it('should not remove assets from albums when visibility is not Locked', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.updateAll(authStub.admin, {
        ids: ['asset-1'],
        visibility: AssetVisibility.Archive,
      });

      expect(mocks.album.removeAssetsFromAll).not.toHaveBeenCalled();
    });

    it('should not call updateAllExif when no exif fields are provided', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.updateAll(authStub.admin, {
        ids: ['asset-1'],
        isFavorite: true,
      });

      expect(mocks.asset.updateAllExif).not.toHaveBeenCalled();
    });

    it('should call updateDateTimeOriginal when dateTimeRelative is non-zero', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.updateAll(authStub.admin, {
        ids: ['asset-1'],
        dateTimeRelative: 10,
      });

      expect(mocks.asset.updateDateTimeOriginal).toHaveBeenCalledWith(['asset-1'], 10, undefined);
    });

    it('should call updateDateTimeOriginal when timeZone is provided', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.updateAll(authStub.admin, {
        ids: ['asset-1'],
        timeZone: 'America/New_York',
      });

      expect(mocks.asset.updateDateTimeOriginal).toHaveBeenCalledWith(['asset-1'], undefined, 'America/New_York');
    });
  });

  describe('deleteAll', () => {
    it('should require asset delete access for all ids', async () => {
      await expect(
        sut.deleteAll(authStub.user1, {
          ids: ['asset-1'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should force delete a batch of assets', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1', 'asset2']));

      await sut.deleteAll(authStub.user1, { ids: ['asset1', 'asset2'], force: true });

      expect(mocks.event.emit).toHaveBeenCalledWith('AssetDeleteAll', {
        assetIds: ['asset1', 'asset2'],
        userId: 'user-id',
      });
    });

    it('should soft delete a batch of assets', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1', 'asset2']));

      await sut.deleteAll(authStub.user1, { ids: ['asset1', 'asset2'], force: false });

      expect(mocks.asset.updateAll).toHaveBeenCalledWith(['asset1', 'asset2'], {
        deletedAt: expect.any(Date),
        status: AssetStatus.Trashed,
      });
      expect(mocks.job.queue.mock.calls).toEqual([]);
    });

    it('should set status to Deleted for force delete', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1']));

      await sut.deleteAll(authStub.user1, { ids: ['asset1'], force: true });

      expect(mocks.asset.updateAll).toHaveBeenCalledWith(['asset1'], {
        deletedAt: expect.any(Date),
        status: AssetStatus.Deleted,
      });
    });

    it('should emit AssetTrashAll for soft delete', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1']));

      await sut.deleteAll(authStub.user1, { ids: ['asset1'], force: false });

      expect(mocks.event.emit).toHaveBeenCalledWith('AssetTrashAll', {
        assetIds: ['asset1'],
        userId: authStub.user1.user.id,
      });
    });
  });

  describe('handleAssetDeletionCheck', () => {
    beforeAll(() => {
      vi.useFakeTimers();
    });

    afterAll(() => {
      vi.useRealTimers();
    });

    it('should immediately queue assets for deletion if trash is disabled', async () => {
      const asset = factory.asset({ isOffline: false });

      mocks.assetJob.streamForDeletedJob.mockReturnValue(makeStream([asset]));
      mocks.systemMetadata.get.mockResolvedValue({ trash: { enabled: false } });

      await expect(sut.handleAssetDeletionCheck()).resolves.toBe(JobStatus.Success);

      expect(mocks.assetJob.streamForDeletedJob).toHaveBeenCalledWith(new Date());
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.AssetDelete, data: { id: asset.id, deleteOnDisk: true } },
      ]);
    });

    it('should queue assets for deletion after trash duration', async () => {
      const asset = factory.asset({ isOffline: false });

      mocks.assetJob.streamForDeletedJob.mockReturnValue(makeStream([asset]));
      mocks.systemMetadata.get.mockResolvedValue({ trash: { enabled: true, days: 7 } });

      await expect(sut.handleAssetDeletionCheck()).resolves.toBe(JobStatus.Success);

      expect(mocks.assetJob.streamForDeletedJob).toHaveBeenCalledWith(DateTime.now().minus({ days: 7 }).toJSDate());
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.AssetDelete, data: { id: asset.id, deleteOnDisk: true } },
      ]);
    });

    it('should set deleteOnDisk to false for offline assets', async () => {
      const asset = factory.asset({ isOffline: true });

      mocks.assetJob.streamForDeletedJob.mockReturnValue(makeStream([asset]));
      mocks.systemMetadata.get.mockResolvedValue({ trash: { enabled: false } });

      await expect(sut.handleAssetDeletionCheck()).resolves.toBe(JobStatus.Success);

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.AssetDelete, data: { id: asset.id, deleteOnDisk: false } },
      ]);
    });

    it('should handle empty stream', async () => {
      mocks.assetJob.streamForDeletedJob.mockReturnValue(makeStream([]));
      mocks.systemMetadata.get.mockResolvedValue({ trash: { enabled: false } });

      await expect(sut.handleAssetDeletionCheck()).resolves.toBe(JobStatus.Success);

      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });
  });

  describe('handleAssetDeletion', () => {
    it('should clean up files', async () => {
      const asset = AssetFactory.from()
        .file({ type: AssetFileType.Thumbnail })
        .file({ type: AssetFileType.Preview })
        .file({ type: AssetFileType.FullSize })
        .file({ type: AssetFileType.Preview, isEdited: true })
        .file({ type: AssetFileType.Thumbnail, isEdited: true })
        .build();
      mocks.assetJob.getForAssetDeletion.mockResolvedValue(asset);

      await sut.handleAssetDeletion({ id: asset.id, deleteOnDisk: true });

      expect(mocks.job.queue.mock.calls).toEqual([
        [
          {
            name: JobName.FileDelete,
            data: {
              files: [...asset.files.map(({ path }) => path), asset.originalPath],
            },
          },
        ],
      ]);
      expect(mocks.asset.remove).toHaveBeenCalledWith(asset);
    });

    it('should delete the entire stack if deleted asset was the primary asset and the stack would only contain one asset afterwards', async () => {
      const asset = AssetFactory.from()
        .stack({}, (builder) => builder.asset())
        .build();
      mocks.stack.delete.mockResolvedValue();
      mocks.assetJob.getForAssetDeletion.mockResolvedValue({
        ...asset,
        // TODO the specific query filters out the primary asset from `stack.assets`. This should be in a mapper eventually
        stack: { ...asset.stack!, assets: asset.stack!.assets.filter(({ id }) => id !== asset.stack!.primaryAssetId) },
      });

      await sut.handleAssetDeletion({ id: asset.id, deleteOnDisk: true });

      expect(mocks.stack.delete).toHaveBeenCalledWith(asset.stackId);
    });

    it('should update stack primary asset when deleted asset is primary and stack has multiple assets', async () => {
      const otherAssetId1 = newUuid();
      const otherAssetId2 = newUuid();
      const asset = AssetFactory.from()
        .stack({}, (builder) => builder.asset().asset())
        .build();

      const stackAssets = [
        { id: otherAssetId1, ...AssetFactory.create({ id: otherAssetId1 }) },
        { id: otherAssetId2, ...AssetFactory.create({ id: otherAssetId2 }) },
      ];

      mocks.stack.update.mockResolvedValue(void 0 as any);
      mocks.assetJob.getForAssetDeletion.mockResolvedValue({
        ...asset,
        stack: {
          ...asset.stack!,
          primaryAssetId: asset.id,
          assets: stackAssets,
        },
      });

      await sut.handleAssetDeletion({ id: asset.id, deleteOnDisk: true });

      expect(mocks.stack.update).toHaveBeenCalledWith(asset.stack!.id, {
        id: asset.stack!.id,
        primaryAssetId: otherAssetId1,
      });
    });

    it('should delete a live photo', async () => {
      const motionAsset = AssetFactory.from({ type: AssetType.Video, visibility: AssetVisibility.Hidden }).build();
      const asset = AssetFactory.create({ livePhotoVideoId: motionAsset.id });
      mocks.assetJob.getForAssetDeletion.mockResolvedValue(asset);
      mocks.asset.getLivePhotoCount.mockResolvedValue(0);

      await sut.handleAssetDeletion({
        id: asset.id,
        deleteOnDisk: true,
      });

      expect(mocks.job.queue.mock.calls).toEqual([
        [{ name: JobName.AssetDelete, data: { id: motionAsset.id, deleteOnDisk: true } }],
        [{ name: JobName.FileDelete, data: { files: [asset.originalPath] } }],
      ]);
    });

    it('should not delete a live motion part if it is being used by another asset', async () => {
      const asset = AssetFactory.create({ livePhotoVideoId: newUuid() });
      mocks.asset.getLivePhotoCount.mockResolvedValue(2);
      mocks.assetJob.getForAssetDeletion.mockResolvedValue(asset);

      await sut.handleAssetDeletion({ id: asset.id, deleteOnDisk: true });

      expect(mocks.job.queue.mock.calls).toEqual([
        [{ name: JobName.FileDelete, data: { files: [`/data/library/IMG_${asset.id}.jpg`] } }],
      ]);
    });

    it('should update usage', async () => {
      const asset = AssetFactory.from().exif({ fileSizeInByte: 5000 }).build();
      mocks.assetJob.getForAssetDeletion.mockResolvedValue(asset);
      await sut.handleAssetDeletion({ id: asset.id, deleteOnDisk: true });
      expect(mocks.user.updateUsage).toHaveBeenCalledWith(asset.ownerId, -5000);
    });

    it('should fail if asset could not be found', async () => {
      mocks.assetJob.getForAssetDeletion.mockResolvedValue(void 0);
      await expect(sut.handleAssetDeletion({ id: AssetFactory.create().id, deleteOnDisk: true })).resolves.toBe(
        JobStatus.Failed,
      );
    });

    it('should not update usage for library assets', async () => {
      const asset = AssetFactory.from({ libraryId: newUuid() }).exif({ fileSizeInByte: 5000 }).build();
      mocks.assetJob.getForAssetDeletion.mockResolvedValue(asset);

      await sut.handleAssetDeletion({ id: asset.id, deleteOnDisk: true });

      expect(mocks.user.updateUsage).not.toHaveBeenCalled();
    });

    it('should not include sidecar and original in file delete when deleteOnDisk is false', async () => {
      const asset = AssetFactory.from()
        .file({ type: AssetFileType.Thumbnail })
        .file({ type: AssetFileType.Sidecar })
        .build();
      mocks.assetJob.getForAssetDeletion.mockResolvedValue(asset);

      await sut.handleAssetDeletion({ id: asset.id, deleteOnDisk: false });

      // Only the thumbnail file should be included, not the sidecar or original
      const fileDeleteCall = mocks.job.queue.mock.calls.find(
        ([call]) => call.name === JobName.FileDelete,
      );
      expect(fileDeleteCall).toBeDefined();
      const files = fileDeleteCall![0].data.files;
      expect(files).not.toContain(asset.originalPath);
    });

    it('should emit AssetDelete event', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForAssetDeletion.mockResolvedValue(asset);

      await sut.handleAssetDeletion({ id: asset.id, deleteOnDisk: true });

      expect(mocks.event.emit).toHaveBeenCalledWith('AssetDelete', {
        assetId: asset.id,
        userId: asset.ownerId,
      });
    });
  });

  describe('getMetadata', () => {
    it('should require asset read access', async () => {
      await expect(sut.getMetadata(authStub.admin, 'asset-1')).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.asset.getMetadata).not.toHaveBeenCalled();
    });

    it('should return metadata for an asset', async () => {
      const assetId = newUuid();
      const metadata = [{ key: 'test-key', value: { some: 'data' } }];
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.asset.getMetadata.mockResolvedValue(metadata as any);

      await expect(sut.getMetadata(authStub.admin, assetId)).resolves.toEqual(metadata);
      expect(mocks.asset.getMetadata).toHaveBeenCalledWith(assetId);
    });
  });

  describe('getMetadataByKey', () => {
    it('should require asset read access', async () => {
      await expect(sut.getMetadataByKey(authStub.admin, 'asset-1', 'some-key')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw if metadata key is not found', async () => {
      const assetId = newUuid();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.asset.getMetadataByKey.mockResolvedValue(void 0);

      await expect(sut.getMetadataByKey(authStub.admin, assetId, 'missing-key')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should return metadata for a given key', async () => {
      const assetId = newUuid();
      const metadata = { key: 'test-key', value: { some: 'data' } };
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.asset.getMetadataByKey.mockResolvedValue(metadata as any);

      await expect(sut.getMetadataByKey(authStub.admin, assetId, 'test-key')).resolves.toEqual(metadata);
      expect(mocks.asset.getMetadataByKey).toHaveBeenCalledWith(assetId, 'test-key');
    });
  });

  describe('deleteMetadataByKey', () => {
    it('should require asset update access', async () => {
      await expect(sut.deleteMetadataByKey(authStub.admin, 'asset-1', 'some-key')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should delete metadata by key', async () => {
      const assetId = newUuid();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));

      await sut.deleteMetadataByKey(authStub.admin, assetId, 'test-key');

      expect(mocks.asset.deleteMetadataByKey).toHaveBeenCalledWith(assetId, 'test-key');
    });
  });

  describe('deleteBulkMetadata', () => {
    it('should require asset update access', async () => {
      await expect(
        sut.deleteBulkMetadata(authStub.admin, { items: [{ assetId: 'asset-1', key: 'some-key' }] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should delete bulk metadata', async () => {
      const assetId = newUuid();
      const items = [{ assetId, key: 'test-key' }];
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));

      await sut.deleteBulkMetadata(authStub.admin, { items } as any);

      expect(mocks.asset.deleteBulkMetadata).toHaveBeenCalledWith(items);
    });
  });

  describe('getOcr', () => {
    it('should require asset read permission', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set());

      await expect(sut.getOcr(authStub.admin, 'asset-1')).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.ocr.getByAssetId).not.toHaveBeenCalled();
    });

    it('should return OCR data for an asset', async () => {
      const ocr1 = factory.assetOcr({ text: 'Hello World' });
      const ocr2 = factory.assetOcr({ text: 'Test Image' });
      const asset = AssetFactory.from().exif().build();

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.ocr.getByAssetId.mockResolvedValue([ocr1, ocr2]);
      mocks.asset.getForOcr.mockResolvedValue({ edits: [], ...asset.exifInfo });

      await expect(sut.getOcr(authStub.admin, asset.id)).resolves.toEqual([ocr1, ocr2]);

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set([asset.id]),
        undefined,
      );
      expect(mocks.ocr.getByAssetId).toHaveBeenCalledWith(asset.id);
    });

    it('should return empty array when no OCR data exists', async () => {
      const asset = AssetFactory.from().exif().build();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.ocr.getByAssetId.mockResolvedValue([]);
      mocks.asset.getForOcr.mockResolvedValue({ edits: [], ...asset.exifInfo });
      await expect(sut.getOcr(authStub.admin, asset.id)).resolves.toEqual([]);

      expect(mocks.ocr.getByAssetId).toHaveBeenCalledWith(asset.id);
    });

    it('should throw if asset is not found for OCR', async () => {
      const assetId = newUuid();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.ocr.getByAssetId.mockResolvedValue([]);
      mocks.asset.getForOcr.mockResolvedValue(void 0);

      await expect(sut.getOcr(authStub.admin, assetId)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('run', () => {
    it('should run the refresh faces job', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.REFRESH_FACES });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.AssetDetectFaces, data: { id: 'asset-1' } }]);
    });

    it('should run the refresh metadata job', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.REFRESH_METADATA });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.AssetExtractMetadata, data: { id: 'asset-1' } },
      ]);
    });

    it('should run the refresh thumbnails job', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.REGENERATE_THUMBNAIL });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.AssetGenerateThumbnails, data: { id: 'asset-1' } },
      ]);
    });

    it('should run the transcode video', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.TRANSCODE_VIDEO });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.AssetEncodeVideo, data: { id: 'asset-1' } }]);
    });

    it('should require asset update access', async () => {
      await expect(
        sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.REFRESH_FACES }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });

    it('should queue jobs for multiple assets', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2']));

      await sut.run(authStub.admin, { assetIds: ['asset-1', 'asset-2'], name: AssetJobName.REFRESH_FACES });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.AssetDetectFaces, data: { id: 'asset-1' } },
        { name: JobName.AssetDetectFaces, data: { id: 'asset-2' } },
      ]);
    });
  });

  describe('getUserAssetsByDeviceId', () => {
    it('get assets by device id', async () => {
      const assets = [AssetFactory.create(), AssetFactory.create()];

      mocks.asset.getAllByDeviceId.mockResolvedValue(assets.map((asset) => asset.deviceAssetId));

      const deviceId = 'device-id';
      const result = await sut.getUserAssetsByDeviceId(authStub.user1, deviceId);

      expect(result.length).toEqual(2);
      expect(result).toEqual(assets.map((asset) => asset.deviceAssetId));
    });
  });

  describe('upsertMetadata', () => {
    it('should throw a bad request exception if duplicate keys are sent', async () => {
      const asset = factory.asset();
      const items = [
        { key: AssetMetadataKey.MobileApp, value: { iCloudId: 'id1' } },
        { key: AssetMetadataKey.MobileApp, value: { iCloudId: 'id1' } },
      ];

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));

      await expect(sut.upsertMetadata(authStub.admin, asset.id, { items })).rejects.toThrowError(
        'Duplicate items are not allowed:',
      );

      expect(mocks.asset.upsertBulkMetadata).not.toHaveBeenCalled();
    });

    it('should upsert metadata with unique keys', async () => {
      const asset = factory.asset();
      const items = [{ key: AssetMetadataKey.MobileApp, value: { iCloudId: 'id1' } }];

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.upsertMetadata.mockResolvedValue(items as any);

      await expect(sut.upsertMetadata(authStub.admin, asset.id, { items })).resolves.toEqual(items);

      expect(mocks.asset.upsertMetadata).toHaveBeenCalledWith(asset.id, items);
    });
  });

  describe('upsertBulkMetadata', () => {
    it('should throw a bad request exception if duplicate keys are sent', async () => {
      const asset = factory.asset();
      const items = [
        { assetId: asset.id, key: AssetMetadataKey.MobileApp, value: { iCloudId: 'id1' } },
        { assetId: asset.id, key: AssetMetadataKey.MobileApp, value: { iCloudId: 'id1' } },
      ];

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));

      await expect(sut.upsertBulkMetadata(authStub.admin, { items })).rejects.toThrowError(
        'Duplicate items are not allowed:',
      );

      expect(mocks.asset.upsertBulkMetadata).not.toHaveBeenCalled();
    });

    it('should upsert bulk metadata with unique keys', async () => {
      const asset1 = factory.asset();
      const asset2 = factory.asset();
      const items = [
        { assetId: asset1.id, key: AssetMetadataKey.MobileApp, value: { iCloudId: 'id1' } },
        { assetId: asset2.id, key: AssetMetadataKey.MobileApp, value: { iCloudId: 'id2' } },
      ];

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset1.id, asset2.id]));
      mocks.asset.upsertBulkMetadata.mockResolvedValue(items as any);

      await expect(sut.upsertBulkMetadata(authStub.admin, { items })).resolves.toEqual(items);

      expect(mocks.asset.upsertBulkMetadata).toHaveBeenCalledWith(items);
    });
  });

  describe('copy', () => {
    it('should require asset copy access for both source and target', async () => {
      await expect(
        sut.copy(authStub.admin, { sourceId: 'source-1', targetId: 'target-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw if either asset does not exist', async () => {
      const sourceId = newUuid();
      const targetId = newUuid();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([sourceId, targetId]));
      mocks.asset.getForCopy.mockResolvedValueOnce(void 0);
      mocks.asset.getForCopy.mockResolvedValueOnce({ id: targetId, stackId: null, isFavorite: false, files: [], originalPath: '/data/target.jpg' });

      await expect(
        sut.copy(authStub.admin, { sourceId, targetId }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw if source and target are the same', async () => {
      const assetId = newUuid();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      const assetData = { id: assetId, stackId: null, isFavorite: false, files: [], originalPath: '/data/img.jpg' };
      mocks.asset.getForCopy.mockResolvedValueOnce(assetData);
      mocks.asset.getForCopy.mockResolvedValueOnce(assetData);

      await expect(
        sut.copy(authStub.admin, { sourceId: assetId, targetId: assetId }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should copy albums, shared links, favorite, and queue sidecar jobs', async () => {
      const sourceId = newUuid();
      const targetId = newUuid();
      const sourceAsset = { id: sourceId, stackId: null, isFavorite: true, files: [], originalPath: '/data/source.jpg' };
      const targetAsset = { id: targetId, stackId: null, isFavorite: false, files: [], originalPath: '/data/target.jpg' };

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([sourceId, targetId]));
      mocks.asset.getForCopy.mockResolvedValueOnce(sourceAsset);
      mocks.asset.getForCopy.mockResolvedValueOnce(targetAsset);
      mocks.sharedLinkAsset.copySharedLinks.mockResolvedValue(void 0 as any);

      await sut.copy(authStub.admin, { sourceId, targetId });

      expect(mocks.album.copyAlbums).toHaveBeenCalledWith({ sourceAssetId: sourceId, targetAssetId: targetId });
      expect(mocks.sharedLinkAsset.copySharedLinks).toHaveBeenCalledWith({ sourceAssetId: sourceId, targetAssetId: targetId });
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: targetId, isFavorite: true });
    });

    it('should skip albums copy when albums flag is false', async () => {
      const sourceId = newUuid();
      const targetId = newUuid();
      const sourceAsset = { id: sourceId, stackId: null, isFavorite: false, files: [], originalPath: '/data/source.jpg' };
      const targetAsset = { id: targetId, stackId: null, isFavorite: false, files: [], originalPath: '/data/target.jpg' };

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([sourceId, targetId]));
      mocks.asset.getForCopy.mockResolvedValueOnce(sourceAsset);
      mocks.asset.getForCopy.mockResolvedValueOnce(targetAsset);
      mocks.sharedLinkAsset.copySharedLinks.mockResolvedValue(void 0 as any);

      await sut.copy(authStub.admin, { sourceId, targetId, albums: false });

      expect(mocks.album.copyAlbums).not.toHaveBeenCalled();
    });

    it('should skip shared links copy when sharedLinks flag is false', async () => {
      const sourceId = newUuid();
      const targetId = newUuid();
      const sourceAsset = { id: sourceId, stackId: null, isFavorite: false, files: [], originalPath: '/data/source.jpg' };
      const targetAsset = { id: targetId, stackId: null, isFavorite: false, files: [], originalPath: '/data/target.jpg' };

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([sourceId, targetId]));
      mocks.asset.getForCopy.mockResolvedValueOnce(sourceAsset);
      mocks.asset.getForCopy.mockResolvedValueOnce(targetAsset);

      await sut.copy(authStub.admin, { sourceId, targetId, sharedLinks: false });

      expect(mocks.sharedLinkAsset.copySharedLinks).not.toHaveBeenCalled();
    });

    it('should skip favorite copy when favorite flag is false', async () => {
      const sourceId = newUuid();
      const targetId = newUuid();
      const sourceAsset = { id: sourceId, stackId: null, isFavorite: true, files: [], originalPath: '/data/source.jpg' };
      const targetAsset = { id: targetId, stackId: null, isFavorite: false, files: [], originalPath: '/data/target.jpg' };

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([sourceId, targetId]));
      mocks.asset.getForCopy.mockResolvedValueOnce(sourceAsset);
      mocks.asset.getForCopy.mockResolvedValueOnce(targetAsset);
      mocks.sharedLinkAsset.copySharedLinks.mockResolvedValue(void 0 as any);

      await sut.copy(authStub.admin, { sourceId, targetId, favorite: false });

      expect(mocks.asset.update).not.toHaveBeenCalledWith(expect.objectContaining({ isFavorite: true }));
    });
  });

  describe('getAssetEdits', () => {
    it('should require asset read access', async () => {
      await expect(sut.getAssetEdits(authStub.admin, 'asset-1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should return asset edits', async () => {
      const assetId = newUuid();
      const edits = [{ id: newUuid(), action: AssetEditAction.Rotate, parameters: { angle: 90 } }];
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.assetEdit.getAll.mockResolvedValue(edits as any);

      const result = await sut.getAssetEdits(authStub.admin, assetId);

      expect(result).toEqual({ assetId, edits });
      expect(mocks.assetEdit.getAll).toHaveBeenCalledWith(assetId);
    });
  });

  describe('editAsset', () => {
    it('should enforce crop first', async () => {
      await expect(
        sut.editAsset(authStub.admin, 'asset-1', {
          edits: [
            {
              action: AssetEditAction.Rotate,
              parameters: { angle: 90 },
            },
            {
              action: AssetEditAction.Crop,
              parameters: { x: 0, y: 0, width: 100, height: 100 },
            },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.assetEdit.replaceAll).not.toHaveBeenCalled();
    });

    it('should require asset edit create access', async () => {
      await expect(
        sut.editAsset(authStub.admin, 'asset-1', {
          edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw if asset is not found', async () => {
      const assetId = newUuid();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.asset.getForEdit.mockResolvedValue(void 0);

      await expect(
        sut.editAsset(authStub.admin, assetId, {
          edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw if asset is a video', async () => {
      const assetId = newUuid();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.asset.getForEdit.mockResolvedValue({
        type: AssetType.Video,
        livePhotoVideoId: null,
        originalPath: '/data/video.mp4',
        originalFileName: 'video.mp4',
        exifImageWidth: 1920,
        exifImageHeight: 1080,
        orientation: null,
        projectionType: null,
      });

      await expect(
        sut.editAsset(authStub.admin, assetId, {
          edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw if asset is a live photo', async () => {
      const assetId = newUuid();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.asset.getForEdit.mockResolvedValue({
        type: AssetType.Image,
        livePhotoVideoId: newUuid(),
        originalPath: '/data/image.jpg',
        originalFileName: 'image.jpg',
        exifImageWidth: 1920,
        exifImageHeight: 1080,
        orientation: null,
        projectionType: null,
      });

      await expect(
        sut.editAsset(authStub.admin, assetId, {
          edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw if asset is a panorama', async () => {
      const assetId = newUuid();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.asset.getForEdit.mockResolvedValue({
        type: AssetType.Image,
        livePhotoVideoId: null,
        originalPath: '/data/pano.jpg',
        originalFileName: 'pano.jpg',
        exifImageWidth: 1920,
        exifImageHeight: 1080,
        orientation: null,
        projectionType: 'EQUIRECTANGULAR',
      });

      await expect(
        sut.editAsset(authStub.admin, assetId, {
          edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw if asset is a GIF', async () => {
      const assetId = newUuid();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.asset.getForEdit.mockResolvedValue({
        type: AssetType.Image,
        livePhotoVideoId: null,
        originalPath: '/data/image.gif',
        originalFileName: 'image.gif',
        exifImageWidth: 1920,
        exifImageHeight: 1080,
        orientation: null,
        projectionType: null,
      });

      await expect(
        sut.editAsset(authStub.admin, assetId, {
          edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw if asset is an SVG', async () => {
      const assetId = newUuid();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.asset.getForEdit.mockResolvedValue({
        type: AssetType.Image,
        livePhotoVideoId: null,
        originalPath: '/data/image.svg',
        originalFileName: 'image.svg',
        exifImageWidth: 1920,
        exifImageHeight: 1080,
        orientation: null,
        projectionType: null,
      });

      await expect(
        sut.editAsset(authStub.admin, assetId, {
          edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw if asset dimensions are not available', async () => {
      const assetId = newUuid();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.asset.getForEdit.mockResolvedValue({
        type: AssetType.Image,
        livePhotoVideoId: null,
        originalPath: '/data/image.jpg',
        originalFileName: 'image.jpg',
        exifImageWidth: null,
        exifImageHeight: null,
        orientation: null,
        projectionType: null,
      });

      await expect(
        sut.editAsset(authStub.admin, assetId, {
          edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw if crop parameters are out of bounds', async () => {
      const assetId = newUuid();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.asset.getForEdit.mockResolvedValue({
        type: AssetType.Image,
        livePhotoVideoId: null,
        originalPath: '/data/image.jpg',
        originalFileName: 'image.jpg',
        exifImageWidth: 100,
        exifImageHeight: 100,
        orientation: null,
        projectionType: null,
      });

      await expect(
        sut.editAsset(authStub.admin, assetId, {
          edits: [{ action: AssetEditAction.Crop, parameters: { x: 50, y: 50, width: 100, height: 100 } }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should successfully edit an asset with a rotate action', async () => {
      const assetId = newUuid();
      const edits = [{ id: newUuid(), action: AssetEditAction.Rotate, parameters: { angle: 90 } }];
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.asset.getForEdit.mockResolvedValue({
        type: AssetType.Image,
        livePhotoVideoId: null,
        originalPath: '/data/image.jpg',
        originalFileName: 'image.jpg',
        exifImageWidth: 1920,
        exifImageHeight: 1080,
        orientation: null,
        projectionType: null,
      });
      mocks.assetEdit.replaceAll.mockResolvedValue(edits as any);

      const result = await sut.editAsset(authStub.admin, assetId, {
        edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }],
      });

      expect(result).toEqual({ assetId, edits });
      expect(mocks.assetEdit.replaceAll).toHaveBeenCalled();
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.AssetEditThumbnailGeneration,
        data: { id: assetId },
      });
    });

    it('should successfully edit an asset with crop as first action', async () => {
      const assetId = newUuid();
      const editActions = [
        { action: AssetEditAction.Crop, parameters: { x: 10, y: 10, width: 50, height: 50 } },
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      ];
      const returnedEdits = editActions.map((e) => ({ id: newUuid(), ...e }));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.asset.getForEdit.mockResolvedValue({
        type: AssetType.Image,
        livePhotoVideoId: null,
        originalPath: '/data/image.jpg',
        originalFileName: 'image.jpg',
        exifImageWidth: 100,
        exifImageHeight: 100,
        orientation: null,
        projectionType: null,
      });
      mocks.assetEdit.replaceAll.mockResolvedValue(returnedEdits as any);

      const result = await sut.editAsset(authStub.admin, assetId, { edits: editActions as any });

      expect(result).toEqual({ assetId, edits: returnedEdits });
    });
  });

  describe('removeAssetEdits', () => {
    it('should require asset edit delete access', async () => {
      await expect(sut.removeAssetEdits(authStub.admin, 'asset-1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw if asset is not found', async () => {
      const assetId = newUuid();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.asset.getById.mockResolvedValue(void 0);

      await expect(sut.removeAssetEdits(authStub.admin, assetId)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should remove asset edits and queue thumbnail generation', async () => {
      const asset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.assetEdit.replaceAll.mockResolvedValue([]);

      await sut.removeAssetEdits(authStub.admin, asset.id);

      expect(mocks.assetEdit.replaceAll).toHaveBeenCalledWith(asset.id, []);
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.AssetEditThumbnailGeneration,
        data: { id: asset.id },
      });
    });
  });
});
