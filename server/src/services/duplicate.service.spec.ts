import { BulkIdErrorReason } from 'src/dtos/asset-ids.response.dto';
import { AssetType, AssetVisibility, JobName, JobStatus } from 'src/enum';
import { DuplicateService } from 'src/services/duplicate.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';
import { beforeEach, describe, expect, it, vitest } from 'vitest';

vitest.useFakeTimers();

const hasEmbedding = {
  id: 'asset-1',
  ownerId: 'user-id',
  stackId: null,
  type: AssetType.Image,
  duplicateId: null,
  embedding: '[1, 2, 3, 4]',
  visibility: AssetVisibility.Timeline,
};

const hasDupe = {
  ...hasEmbedding,
  id: 'asset-2',
  duplicateId: 'duplicate-id',
};

describe(DuplicateService.name, () => {
  let sut: DuplicateService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(DuplicateService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getDuplicates', () => {
    it('should get duplicates', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['duplicate-id']));
      mocks.duplicateRepository.cleanupSingletonGroups.mockResolvedValue();
      mocks.duplicateRepository.getAll.mockResolvedValue([
        {
          duplicateId: 'duplicate-id',
          assets: [assetStub.image, assetStub.image],
        },
      ]);
      await expect(sut.getDuplicates(authStub.admin)).resolves.toEqual([
        {
          duplicateId: 'duplicate-id',
          assets: [
            expect.objectContaining({ id: assetStub.image.id }),
            expect.objectContaining({ id: assetStub.image.id }),
          ],
          suggestedKeepAssetIds: [assetStub.image.id],
        },
      ]);
    });

    it('should return suggestedKeepAssetIds based on file size', async () => {
      const smallAsset = {
        ...assetStub.image,
        id: 'small-asset',
        exifInfo: { ...assetStub.image.exifInfo, fileSizeInByte: 1000 },
      };
      const largeAsset = {
        ...assetStub.image,
        id: 'large-asset',
        exifInfo: { ...assetStub.image.exifInfo, fileSizeInByte: 5000 },
      };
      mocks.duplicateRepository.cleanupSingletonGroups.mockResolvedValue();
      mocks.duplicateRepository.getAll.mockResolvedValue([
        {
          duplicateId: 'duplicate-id',
          assets: [smallAsset, largeAsset],
        },
      ]);
      const result = await sut.getDuplicates(authStub.admin);
      expect(result[0].suggestedKeepAssetIds).toEqual(['large-asset']);
    });
  });

  describe('handleQueueSearchDuplicates', () => {
    beforeEach(() => {
      mocks.systemMetadata.get.mockResolvedValue({
        machineLearning: {
          enabled: true,
          duplicateDetection: {
            enabled: true,
          },
        },
      });
    });

    it('should skip if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        machineLearning: {
          enabled: false,
          duplicateDetection: {
            enabled: true,
          },
        },
      });

      await expect(sut.handleQueueSearchDuplicates({})).resolves.toBe(JobStatus.Skipped);
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.get).toHaveBeenCalled();
    });

    it('should skip if duplicate detection is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        machineLearning: {
          enabled: true,
          duplicateDetection: {
            enabled: false,
          },
        },
      });

      await expect(sut.handleQueueSearchDuplicates({})).resolves.toBe(JobStatus.Skipped);
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.get).toHaveBeenCalled();
    });

    it('should queue missing assets', async () => {
      mocks.assetJob.streamForSearchDuplicates.mockReturnValue(makeStream([assetStub.image]));

      await sut.handleQueueSearchDuplicates({});

      expect(mocks.assetJob.streamForSearchDuplicates).toHaveBeenCalledWith(undefined);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetDetectDuplicates,
          data: { id: assetStub.image.id },
        },
      ]);
    });

    it('should queue all assets', async () => {
      mocks.assetJob.streamForSearchDuplicates.mockReturnValue(makeStream([assetStub.image]));

      await sut.handleQueueSearchDuplicates({ force: true });

      expect(mocks.assetJob.streamForSearchDuplicates).toHaveBeenCalledWith(true);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetDetectDuplicates,
          data: { id: assetStub.image.id },
        },
      ]);
    });
  });

  describe('resolve', () => {
    it('should handle mixed success and failure', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['group-1', 'group-2']));
      mocks.duplicateRepository.get.mockResolvedValueOnce(void 0);
      mocks.duplicateRepository.get.mockResolvedValueOnce({
        duplicateId: 'group-2',
        assets: [{ ...assetStub.image, id: 'asset-1' }],
      });

      await expect(
        sut.resolve(authStub.admin, {
          groups: [
            { duplicateId: 'group-1', keepAssetIds: [], trashAssetIds: [] },
            { duplicateId: 'group-2', keepAssetIds: ['asset-1'], trashAssetIds: [] },
          ],
        }),
      ).resolves.toEqual([
        { id: 'group-1', success: false, error: BulkIdErrorReason.NOT_FOUND },
        { id: 'group-2', success: true },
      ]);
    });

    it('should catch and report errors', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['group-1']));
      mocks.duplicateRepository.get.mockRejectedValue(new Error('Database error'));

      await expect(
        sut.resolve(authStub.admin, {
          groups: [{ duplicateId: 'group-1', keepAssetIds: [], trashAssetIds: [] }],
        }),
      ).resolves.toEqual([{ id: 'group-1', success: false, error: BulkIdErrorReason.UNKNOWN }]);
    });
  });

  describe('resolveGroup (via resolve)', () => {
    it('should fail if duplicate group not found', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['missing-id']));
      mocks.duplicateRepository.get.mockResolvedValue(void 0);

      await expect(
        sut.resolve(authStub.admin, {
          groups: [{ duplicateId: 'missing-id', keepAssetIds: [], trashAssetIds: [] }],
          settings: {
            syncAlbums: false,
            syncVisibility: false,
            syncFavorites: false,
            syncRating: false,
            syncDescription: false,
            syncLocation: false,
            syncTags: false,
          },
        }),
      ).resolves.toEqual([
        {
          id: 'missing-id',
          success: false,
          error: BulkIdErrorReason.NOT_FOUND,
        },
      ]);
    });

    it('should skip when keepAssetIds contains non-member', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['group-1']));
      mocks.duplicateRepository.get.mockResolvedValue({
        duplicateId: 'group-1',
        assets: [{ ...assetStub.image, id: 'asset-1' }],
      });

      await expect(
        sut.resolve(authStub.admin, {
          groups: [{ duplicateId: 'group-1', keepAssetIds: ['asset-999', 'asset-1'], trashAssetIds: [] }],
        }),
      ).resolves.toEqual([{ id: 'group-1', success: true }]);
    });

    it('should skip when trashAssetIds contains non-member', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['group-1']));
      mocks.duplicateRepository.get.mockResolvedValue({
        duplicateId: 'group-1',
        assets: [{ ...assetStub.image, id: 'asset-1' }],
      });

      await expect(
        sut.resolve(authStub.admin, {
          groups: [{ duplicateId: 'group-1', keepAssetIds: ['asset-1'], trashAssetIds: ['asset-999'] }],
        }),
      ).resolves.toEqual([{ id: 'group-1', success: true }]);
    });

    it('should fail if keepAssetIds and trashAssetIds overlap', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['group-1']));
      mocks.duplicateRepository.get.mockResolvedValue({
        duplicateId: 'group-1',
        assets: [
          { ...assetStub.image, id: 'asset-1' },
          { ...assetStub.image, id: 'asset-2' },
        ],
      });

      const result = await sut.resolve(authStub.admin, {
        groups: [{ duplicateId: 'group-1', keepAssetIds: ['asset-1'], trashAssetIds: ['asset-1'] }],
        settings: {
          syncAlbums: false,
          syncVisibility: false,
          syncFavorites: false,
          syncRating: false,
          syncDescription: false,
          syncLocation: false,
          syncTags: false,
        },
      });

      expect(result[0].success).toBe(false);
      expect(result[0].errorMessage).toContain('An asset cannot be in both keepAssetIds and trashAssetIds');
    });

    it('should fail if keepAssetIds and trashAssetIds do not cover all assets', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['group-1']));
      mocks.duplicateRepository.get.mockResolvedValue({
        duplicateId: 'group-1',
        assets: [
          { ...assetStub.image, id: 'asset-1' },
          { ...assetStub.image, id: 'asset-2' },
          { ...assetStub.image, id: 'asset-3' },
        ],
      });

      const result = await sut.resolve(authStub.admin, {
        groups: [{ duplicateId: 'group-1', keepAssetIds: ['asset-1'], trashAssetIds: ['asset-2'] }],
        settings: {
          syncAlbums: false,
          syncVisibility: false,
          syncFavorites: false,
          syncRating: false,
          syncDescription: false,
          syncLocation: false,
          syncTags: false,
        },
      });

      expect(result[0].success).toBe(false);
      expect(result[0].errorMessage).toContain('Every asset must be in either keepAssetIds or trashAssetIds');
    });

    it('should fail if partial trash without keepers', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['group-1']));
      mocks.duplicateRepository.get.mockResolvedValue({
        duplicateId: 'group-1',
        assets: [
          { ...assetStub.image, id: 'asset-1' },
          { ...assetStub.image, id: 'asset-2' },
        ],
      });

      const result = await sut.resolve(authStub.admin, {
        groups: [{ duplicateId: 'group-1', keepAssetIds: [], trashAssetIds: ['asset-1'] }],
        settings: {
          syncAlbums: false,
          syncVisibility: false,
          syncFavorites: false,
          syncRating: false,
          syncDescription: false,
          syncLocation: false,
          syncTags: false,
        },
      });

      expect(result[0].success).toBe(false);
      expect(result[0].errorMessage).toContain('Every asset must be in either keepAssetIds or trashAssetIds');
    });

    it('should sync merged tags to asset_exif.tags when syncTags is enabled', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['group-1']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-2']));
      mocks.access.tag.checkOwnerAccess.mockResolvedValue(new Set(['tag-1', 'tag-2']));
      mocks.duplicateRepository.get.mockResolvedValue({
        duplicateId: 'group-1',
        assets: [
          {
            ...assetStub.image,
            id: 'asset-1',
            tags: [{ id: 'tag-1', value: 'Work', createdAt: new Date(), updatedAt: new Date(), userId: 'user-1' }],
          },
          {
            ...assetStub.image,
            id: 'asset-2',
            tags: [{ id: 'tag-2', value: 'Travel', createdAt: new Date(), updatedAt: new Date(), userId: 'user-1' }],
          },
        ],
      });

      const result = await sut.resolve(authStub.admin, {
        groups: [{ duplicateId: 'group-1', keepAssetIds: ['asset-1'], trashAssetIds: ['asset-2'] }],
        settings: {
          syncAlbums: false,
          syncVisibility: false,
          syncFavorites: false,
          syncRating: false,
          syncDescription: false,
          syncLocation: false,
          syncTags: true,
        },
      });

      expect(result[0].success).toBe(true);

      // Verify tags were applied to tag_asset table
      expect(mocks.tag.replaceAssetTags).toHaveBeenCalledWith('asset-1', ['tag-1', 'tag-2']);

      // Verify merged tag values were written to asset_exif.tags so SidecarWrite preserves them
      expect(mocks.asset.updateAllExif).toHaveBeenCalledWith(['asset-1'], { tags: ['Work', 'Travel'] });

      // Verify SidecarWrite was queued (to write tags to sidecar)
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.SidecarWrite, data: { id: 'asset-1' } },
      ]);
    });

    // NOTE: The following integration-style tests are covered by E2E tests instead
    // to avoid complex mock setup. The validation and error-handling logic above
    // is thoroughly unit tested.
  });

  describe('handleSearchDuplicates', () => {
    beforeEach(() => {
      mocks.systemMetadata.get.mockResolvedValue({
        machineLearning: {
          enabled: true,
          duplicateDetection: {
            enabled: true,
          },
        },
      });
    });

    it('should skip if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        machineLearning: {
          enabled: false,
          duplicateDetection: {
            enabled: true,
          },
        },
      });
      const id = assetStub.livePhotoMotionAsset.id;

      const result = await sut.handleSearchDuplicates({ id });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.assetJob.getForSearchDuplicatesJob).not.toHaveBeenCalled();
    });

    it('should skip if duplicate detection is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        machineLearning: {
          enabled: true,
          duplicateDetection: {
            enabled: false,
          },
        },
      });
      const id = assetStub.livePhotoMotionAsset.id;

      const result = await sut.handleSearchDuplicates({ id });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.assetJob.getForSearchDuplicatesJob).not.toHaveBeenCalled();
    });

    it('should fail if asset is not found', async () => {
      mocks.assetJob.getForSearchDuplicatesJob.mockResolvedValue(void 0);

      const result = await sut.handleSearchDuplicates({ id: assetStub.image.id });

      expect(result).toBe(JobStatus.Failed);
      expect(mocks.logger.error).toHaveBeenCalledWith(`Asset ${assetStub.image.id} not found`);
    });

    it('should skip if asset is part of stack', async () => {
      const id = assetStub.primaryImage.id;
      mocks.assetJob.getForSearchDuplicatesJob.mockResolvedValue({ ...hasEmbedding, stackId: 'stack-id' });

      const result = await sut.handleSearchDuplicates({ id });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.logger.debug).toHaveBeenCalledWith(`Asset ${id} is part of a stack, skipping`);
    });

    it('should skip if asset is not visible', async () => {
      const id = assetStub.livePhotoMotionAsset.id;
      mocks.assetJob.getForSearchDuplicatesJob.mockResolvedValue({
        ...hasEmbedding,
        visibility: AssetVisibility.Hidden,
      });

      const result = await sut.handleSearchDuplicates({ id });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.logger.debug).toHaveBeenCalledWith(`Asset ${id} is not visible, skipping`);
    });

    it('should fail if asset is missing embedding', async () => {
      mocks.assetJob.getForSearchDuplicatesJob.mockResolvedValue({ ...hasEmbedding, embedding: null });

      const result = await sut.handleSearchDuplicates({ id: assetStub.image.id });

      expect(result).toBe(JobStatus.Failed);
      expect(mocks.logger.debug).toHaveBeenCalledWith(`Asset ${assetStub.image.id} is missing embedding`);
    });

    it('should search for duplicates and update asset with duplicateId', async () => {
      mocks.assetJob.getForSearchDuplicatesJob.mockResolvedValue(hasEmbedding);
      mocks.duplicateRepository.search.mockResolvedValue([
        { assetId: assetStub.image.id, distance: 0.01, duplicateId: null },
      ]);
      mocks.duplicateRepository.merge.mockResolvedValue();
      const expectedAssetIds = [assetStub.image.id, hasEmbedding.id];

      const result = await sut.handleSearchDuplicates({ id: hasEmbedding.id });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.duplicateRepository.search).toHaveBeenCalledWith({
        assetId: hasEmbedding.id,
        embedding: hasEmbedding.embedding,
        maxDistance: 0.01,
        type: hasEmbedding.type,
        userIds: [hasEmbedding.ownerId],
      });
      expect(mocks.duplicateRepository.merge).toHaveBeenCalledWith({
        assetIds: expectedAssetIds,
        targetId: expect.any(String),
        sourceIds: [],
      });
      expect(mocks.asset.upsertJobStatus).toHaveBeenCalledWith(
        ...expectedAssetIds.map((assetId) => ({ assetId, duplicatesDetectedAt: expect.any(Date) })),
      );
    });

    it('should use existing duplicate ID among matched duplicates', async () => {
      const duplicateId = hasDupe.duplicateId;
      mocks.assetJob.getForSearchDuplicatesJob.mockResolvedValue(hasEmbedding);
      mocks.duplicateRepository.search.mockResolvedValue([{ assetId: hasDupe.id, distance: 0.01, duplicateId }]);
      mocks.duplicateRepository.merge.mockResolvedValue();
      const expectedAssetIds = [hasEmbedding.id];

      const result = await sut.handleSearchDuplicates({ id: hasEmbedding.id });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.duplicateRepository.search).toHaveBeenCalledWith({
        assetId: hasEmbedding.id,
        embedding: hasEmbedding.embedding,
        maxDistance: 0.01,
        type: hasEmbedding.type,
        userIds: [hasEmbedding.ownerId],
      });
      expect(mocks.duplicateRepository.merge).toHaveBeenCalledWith({
        assetIds: expectedAssetIds,
        targetId: duplicateId,
        sourceIds: [],
      });
      expect(mocks.asset.upsertJobStatus).toHaveBeenCalledWith(
        ...expectedAssetIds.map((assetId) => ({ assetId, duplicatesDetectedAt: expect.any(Date) })),
      );
    });

    it('should remove duplicateId if no duplicates found and asset has duplicateId', async () => {
      mocks.assetJob.getForSearchDuplicatesJob.mockResolvedValue(hasDupe);
      mocks.duplicateRepository.search.mockResolvedValue([]);

      const result = await sut.handleSearchDuplicates({ id: hasDupe.id });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: hasDupe.id, duplicateId: null });
      expect(mocks.asset.upsertJobStatus).toHaveBeenCalledWith({
        assetId: hasDupe.id,
        duplicatesDetectedAt: expect.any(Date),
      });
    });
  });
});

// TODO: fix these tests

// const allDisabledSettings: DuplicateSyncSettingsDto = {
//   syncAlbums: false,
//   syncVisibility: false,
//   syncFavorites: false,
//   syncRating: false,
//   syncDescription: false,
//   syncLocation: false,
//   syncTags: false,
// };

// describe('duplicate-resolve utils', () => {
//   describe('getSyncedInfo', () => {
//     it('should return defaults for empty list', () => {
//       const result = getSyncedInfo([]);
//       expect(result).toEqual({
//         isFavorite: false,
//         visibility: undefined,
//         rating: 0,
//         description: null,
//         latitude: null,
//         longitude: null,
//         tagIds: [],
//       });
//     });

//     describe('isFavorite', () => {
//       it('should return false if no assets are favorite', () => {
//         const assets = [factory.asset({ isFavorite: false }), factory.asset({ isFavorite: false })];
//         expect(getSyncedInfo(assets).isFavorite).toBe(false);
//       });

//       it('should return true if any asset is favorite', () => {
//         const assets = [factory.asset({ isFavorite: false }), factory.asset({ isFavorite: true })];
//         expect(getSyncedInfo(assets).isFavorite).toBe(true);
//       });
//     });

//     describe('visibility', () => {
//       it('should return undefined if no special visibility', () => {
//         const assets = [factory.asset({ visibility: AssetVisibility.Timeline })];
//         expect(getSyncedInfo(assets).visibility).toBe(AssetVisibility.Timeline);
//       });

//       it('should prioritize Locked over Archive and Timeline', () => {
//         const assets = [
//           factory.asset({ visibility: AssetVisibility.Timeline }),
//           factory.asset({ visibility: AssetVisibility.Archive }),
//           factory.asset({ visibility: AssetVisibility.Locked }),
//         ];
//         expect(getSyncedInfo(assets).visibility).toBe(AssetVisibility.Locked);
//       });

//       it('should prioritize Archive over Timeline', () => {
//         const assets = [
//           factory.asset({ visibility: AssetVisibility.Timeline }),
//           factory.asset({ visibility: AssetVisibility.Archive }),
//         ];
//         expect(getSyncedInfo(assets).visibility).toBe(AssetVisibility.Archive);
//       });

//       it('should use Hidden if no standard visibility but Hidden is present', () => {
//         const assets = [factory.asset({ visibility: AssetVisibility.Hidden })];
//         expect(getSyncedInfo(assets).visibility).toBe(AssetVisibility.Hidden);
//       });
//     });

//     describe('rating', () => {
//       it('should return 0 if no ratings', () => {
//         const assets = [factory.asset(), factory.asset()];
//         expect(getSyncedInfo(assets).rating).toBe(0);
//       });

//       it('should return max rating', () => {
//         const assets = [
//           { ...factory.asset(), exifInfo: factory.exif({ rating: 3 }) },
//           { ...factory.asset(), exifInfo: factory.exif({ rating: 5 }) },
//           { ...factory.asset(), exifInfo: factory.exif({ rating: 1 }) },
//         ];
//         expect(getSyncedInfo(assets).rating).toBe(5);
//       });
//     });

//     describe('description', () => {
//       it('should return null if no descriptions', () => {
//         expect(getSyncedInfo([factory.asset(), factory.asset()]).description).toBeNull();
//       });

//       it('should concatenate unique non-empty lines', () => {
//         const assets = [
//           { ...factory.asset(), exifInfo: factory.exif({ description: 'Line 1\nLine 2' }) },
//           { ...factory.asset(), exifInfo: factory.exif({ description: 'Line 2\nLine 3' }) },
//         ];
//         expect(getSyncedInfo(assets).description).toBe('Line 1\nLine 2\nLine 3');
//       });

//       it('should trim lines and skip empty', () => {
//         const assets = [
//           { ...factory.asset(), exifInfo: factory.exif({ description: '  Line 1  \n\n  Line 2  \n  ' }) },
//         ];
//         expect(getSyncedInfo(assets).description).toBe('Line 1\nLine 2');
//       });
//     });

//     describe('location', () => {
//       it('should return null if no location data', () => {
//         const assets = [
//           { ...factory.asset(), exifInfo: factory.exif() },
//           { ...factory.asset(), exifInfo: factory.exif() },
//         ];
//         const result = getSyncedInfo(assets);
//         expect(result.latitude).toBeNull();
//         expect(result.longitude).toBeNull();
//       });

//       it('should return coordinates if all assets have same location', () => {
//         const assets = [
//           { ...factory.asset(), exifInfo: factory.exif({ latitude: 40.7128, longitude: -74.006 }) },
//           { ...factory.asset(), exifInfo: factory.exif({ latitude: 40.7128, longitude: -74.006 }) },
//         ];
//         const result = getSyncedInfo(assets);
//         expect(result.latitude).toBe(40.7128);
//         expect(result.longitude).toBe(-74.006);
//       });

//       it('should return null if locations differ', () => {
//         const assets = [
//           { ...factory.asset(), exifInfo: factory.exif({ latitude: 40.7128, longitude: -74.006 }) },
//           { ...factory.asset(), exifInfo: factory.exif({ latitude: 34.0522, longitude: -118.2437 }) },
//         ];
//         const result = getSyncedInfo(assets);
//         expect(result.latitude).toBeNull();
//         expect(result.longitude).toBeNull();
//       });

//       it('should ignore assets with missing location', () => {
//         const assets = [
//           { ...factory.asset(), exifInfo: factory.exif({ latitude: 40.7128, longitude: -74.006 }) },
//           { ...factory.asset(), exifInfo: factory.exif() },
//         ];
//         const result = getSyncedInfo(assets);
//         expect(result.latitude).toBe(40.7128);
//         expect(result.longitude).toBe(-74.006);
//       });
//     });

//     describe('tagIds', () => {
//       it('should return empty array if no tags', () => {
//         const assets = [
//           { ...factory.asset(), tags: [] },
//           { ...factory.asset(), tags: [] },
//         ];
//         expect(getSyncedInfo(assets).tagIds).toEqual([]);
//       });

//       it('should collect unique tag IDs from all assets', () => {
//         const assets = [
//           {
//             ...factory.asset(),
//             tags: [factory.tag({ id: 'tag-1', value: 'tag-1' })],
//           },
//           {
//             ...factory.asset(),
//             tags: [factory.tag({ id: 'tag-1', value: 'tag-1' }), factory.tag({ id: 'tag-2', value: 'tag-2' })],
//           },
//         ];
//         const result = getSyncedInfo(assets);
//         expect(result.tagIds).toHaveLength(2);
//         expect(result.tagIds).toContain('tag-1');
//         expect(result.tagIds).toContain('tag-2');
//       });
//     });
//   });

//   describe('computeResolvePolicy', () => {
//     it('should always set duplicateId to null in assetBulkUpdate', () => {
//       const assets = [factory.asset(), factory.asset()];
//       const policy = getSyncMergeResult(assets, ['1'], allDisabledSettings);
//       expect(policy.assetBulkUpdate.duplicateId).toBeNull();
//     });

//     it('should set ids to idsToKeep', () => {
//       const assets = [factory.asset(), factory.asset()];
//       const policy = getSyncMergeResult(assets, ['1', '2'], allDisabledSettings);
//       expect(policy.assetBulkUpdate.ids).toEqual(['1', '2']);
//     });

//     it('should not set sync fields when all settings disabled', () => {
//       const assets = [
//         {
//           ...factory.asset({
//             isFavorite: true,
//             visibility: AssetVisibility.Archive,
//           }),
//           exifInfo: factory.exif({ rating: 5, description: 'test' }),
//         },
//       ];
//       const policy = getSyncMergeResult(assets, ['1'], allDisabledSettings);

//       expect(policy.assetBulkUpdate.isFavorite).toBeUndefined();
//       expect(policy.assetBulkUpdate.visibility).toBeUndefined();
//       expect(policy.assetBulkUpdate.rating).toBeUndefined();
//       expect(policy.assetBulkUpdate.description).toBeUndefined();
//       expect(policy.mergedAlbumIds).toEqual([]);
//       expect(policy.mergedTagIds).toEqual([]);
//     });

//     it('should set isFavorite when syncFavorites enabled', () => {
//       const assets = [{ ...factory.asset({ isFavorite: true }) }, { ...factory.asset({ isFavorite: false }) }];
//       const settings = { ...allDisabledSettings, syncFavorites: true };
//       const policy = getSyncMergeResult(assets, ['1'], settings);
//       expect(policy.assetBulkUpdate.isFavorite).toBe(true);
//     });

//     it('should set visibility when syncVisibility enabled', () => {
//       const assets = [
//         { ...factory.asset({ visibility: AssetVisibility.Archive }) },
//         { ...factory.asset({ visibility: AssetVisibility.Timeline }) },
//       ];
//       const settings = { ...allDisabledSettings, syncVisibility: true };
//       const policy = getSyncMergeResult(assets, ['1'], settings);
//       expect(policy.assetBulkUpdate.visibility).toBe(AssetVisibility.Archive);
//     });

//     it('should set rating when syncRating enabled', () => {
//       const assets = [
//         { ...factory.asset(), exifInfo: factory.exif({ rating: 3 }) },
//         { ...factory.asset(), exifInfo: factory.exif({ rating: 5 }) },
//       ];
//       const settings = { ...allDisabledSettings, syncRating: true };
//       const policy = getSyncMergeResult(assets, ['1'], settings);
//       expect(policy.assetBulkUpdate.rating).toBe(5);
//     });

//     it('should set description when syncDescription enabled and non-null', () => {
//       const assets = [{ ...factory.asset(), exifInfo: factory.exif({ description: 'Test description' }) }];
//       const settings = { ...allDisabledSettings, syncDescription: true };
//       const policy = getSyncMergeResult(assets, ['1'], settings);
//       expect(policy.assetBulkUpdate.description).toBe('Test description');
//     });

//     it('should not set description when null', () => {
//       const assets = [factory.asset()];
//       const settings = { ...allDisabledSettings, syncDescription: true };
//       const policy = getSyncMergeResult(assets, ['1'], settings);
//       expect(policy.assetBulkUpdate.description).toBeUndefined();
//     });

//     it('should set location when syncLocation enabled and coordinates match', () => {
//       const assets = [
//         { ...factory.asset(), exifInfo: factory.exif({ latitude: 40.7128, longitude: -74.006 }) },
//         { ...factory.asset(), exifInfo: factory.exif({ latitude: 40.7128, longitude: -74.006 }) },
//       ];
//       const settings = { ...allDisabledSettings, syncLocation: true };
//       const policy = getSyncMergeResult(assets, ['1'], settings);
//       expect(policy.assetBulkUpdate.latitude).toBe(40.7128);
//       expect(policy.assetBulkUpdate.longitude).toBe(-74.006);
//     });

//     it('should not set location when coordinates differ', () => {
//       const assets = [
//         { ...factory.asset(), exifInfo: factory.exif({ latitude: 40.7128, longitude: -74.006 }) },
//         { ...factory.asset(), exifInfo: factory.exif({ latitude: 34.0522, longitude: -118.2437 }) },
//       ];
//       const settings = { ...allDisabledSettings, syncLocation: true };
//       const policy = getSyncMergeResult(assets, ['1'], settings);
//       expect(policy.assetBulkUpdate.latitude).toBeUndefined();
//       expect(policy.assetBulkUpdate.longitude).toBeUndefined();
//     });

//     it('should return merged album IDs when syncAlbums enabled', () => {
//       const assets = [factory.asset(), factory.asset()];
//       const settings = { ...allDisabledSettings, syncAlbums: true };
//       const assetAlbumMap = new Map([
//         ['1', ['album-1', 'album-2']],
//         ['2', ['album-2', 'album-3']],
//       ]);
//       const policy = getSyncMergeResult(assets, ['1'], settings, assetAlbumMap);
//       expect(policy.mergedAlbumIds).toHaveLength(3);
//       expect(policy.mergedAlbumIds).toContain('album-1');
//       expect(policy.mergedAlbumIds).toContain('album-2');
//       expect(policy.mergedAlbumIds).toContain('album-3');
//     });

//     it('should return merged tag IDs when syncTags enabled', () => {
//       const assets = [
//         {
//           ...factory.asset({}),
//           tags: [factory.tag({ id: 'tag-1', value: 'tag-1' })],
//         },
//         {
//           ...factory.asset({}),
//           tags: [factory.tag({ id: 'tag-2', value: 'tag-2' })],
//         },
//       ];
//       const settings = { ...allDisabledSettings, syncTags: true };
//       const policy = getSyncMergeResult(assets, ['1'], settings);
//       expect(policy.mergedTagIds).toHaveLength(2);
//       expect(policy.mergedTagIds).toContain('tag-1');
//       expect(policy.mergedTagIds).toContain('tag-2');
//     });
//   });
// });
