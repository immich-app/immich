import { AssetRepository } from 'src/repositories/asset.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newAssetRepositoryMock = (): Mocked<RepositoryInterface<AssetRepository>> => {
  return {
    create: vitest.fn(),
    createAll: vitest.fn(),
    upsertExif: vitest.fn(),
    updateAllExif: vitest.fn(),
    upsertJobStatus: vitest.fn(),
    getByDayOfYear: vitest.fn(),
    getByIds: vitest.fn().mockResolvedValue([]),
    getByIdsWithAllRelations: vitest.fn().mockResolvedValue([]),
    getByAlbumId: vitest.fn(),
    getByChecksum: vitest.fn(),
    getByChecksums: vitest.fn(),
    getByDeviceIds: vitest.fn(),
    getById: vitest.fn(),
    getByLibraryIdAndOriginalPath: vitest.fn(),
    getLikeOriginalPath: vitest.fn(),
    getByUserId: vitest.fn(),
    getChangedDeltaSync: vitest.fn(),
    getDuplicates: vitest.fn(),
    getLastUpdatedAssetForAlbumId: vitest.fn(),
    getLibraryAssetCount: vitest.fn(),
    getLivePhotoCount: vitest.fn(),
    getRandom: vitest.fn(),
    getStatistics: vitest.fn(),
    getTimeBucket: vitest.fn(),
    getTimeBuckets: vitest.fn(),
    getUploadAssetIdByChecksum: vitest.fn(),
    getWithout: vitest.fn(),
    remove: vitest.fn(),
    update: vitest.fn(),
    updateAll: vitest.fn(),
    updateByLibraryId: vitest.fn(),
    updateDuplicates: vitest.fn(),
    streamStorageTemplateAssets: vitest.fn(),
    getStorageTemplateAsset: vitest.fn(),
    streamDeletedAssets: vitest.fn(),
  };
};
