import { AssetRepository } from 'src/repositories/asset.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newAssetRepositoryMock = (): Mocked<RepositoryInterface<AssetRepository>> => {
  return {
    create: vitest.fn(),
    upsertExif: vitest.fn(),
    upsertJobStatus: vitest.fn(),
    getByDayOfYear: vitest.fn(),
    getByIds: vitest.fn().mockResolvedValue([]),
    getByIdsWithAllRelations: vitest.fn().mockResolvedValue([]),
    getByAlbumId: vitest.fn(),
    getByDeviceIds: vitest.fn(),
    getByUserId: vitest.fn(),
    getById: vitest.fn(),
    getWithout: vitest.fn(),
    getByChecksum: vitest.fn(),
    getByChecksums: vitest.fn(),
    getUploadAssetIdByChecksum: vitest.fn(),
    getRandom: vitest.fn(),
    getLastUpdatedAssetForAlbumId: vitest.fn(),
    getAll: vitest.fn().mockResolvedValue({ items: [], hasNextPage: false }),
    getAllByDeviceId: vitest.fn(),
    getLivePhotoCount: vitest.fn(),
    updateAll: vitest.fn(),
    updateDuplicates: vitest.fn(),
    getByLibraryIdAndOriginalPath: vitest.fn(),
    deleteAll: vitest.fn(),
    update: vitest.fn(),
    remove: vitest.fn(),
    findLivePhotoMatch: vitest.fn(),
    getStatistics: vitest.fn(),
    getTimeBucket: vitest.fn(),
    getTimeBuckets: vitest.fn(),
    getAssetIdByCity: vitest.fn(),
    getAllForUserFullSync: vitest.fn(),
    getChangedDeltaSync: vitest.fn(),
    getDuplicates: vitest.fn(),
    upsertFile: vitest.fn(),
    upsertFiles: vitest.fn(),
  };
};
