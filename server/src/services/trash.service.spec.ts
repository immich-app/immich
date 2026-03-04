import { BadRequestException } from '@nestjs/common';
import { JobName, JobStatus } from 'src/enum';
import { TrashService } from 'src/services/trash.service';
import { authStub } from 'test/fixtures/auth.stub';
import { newTestService, ServiceMocks } from 'test/utils';

async function* makeAssetIdStream(count: number): AsyncIterableIterator<{ id: string }> {
  for (let i = 0; i < count; i++) {
    await Promise.resolve();
    yield { id: `asset-${i + 1}` };
  }
}

describe(TrashService.name, () => {
  let sut: TrashService;
  let mocks: ServiceMocks;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  beforeEach(() => {
    ({ sut, mocks } = newTestService(TrashService));
  });

  describe('restoreAssets', () => {
    it('should require asset restore access for all ids', async () => {
      await expect(
        sut.restoreAssets(authStub.user1, {
          ids: ['asset-1'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should handle an empty list', async () => {
      await expect(sut.restoreAssets(authStub.user1, { ids: [] })).resolves.toEqual({ count: 0 });
      expect(mocks.access.asset.checkOwnerAccess).not.toHaveBeenCalled();
    });

    it('should restore a batch of assets', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1', 'asset2']));
      mocks.trash.restoreAll.mockResolvedValue(0);

      await sut.restoreAssets(authStub.user1, { ids: ['asset1', 'asset2'] });

      expect(mocks.trash.restoreAll).toHaveBeenCalledWith(['asset1', 'asset2']);
      expect(mocks.job.queue.mock.calls).toEqual([]);
    });
  });

  describe('restore', () => {
    it('should handle an empty trash', async () => {
      mocks.trash.getDeletedIds.mockResolvedValue(makeAssetIdStream(0));
      mocks.trash.restore.mockResolvedValue(0);
      await expect(sut.restore(authStub.user1)).resolves.toEqual({ count: 0 });
      expect(mocks.trash.restore).toHaveBeenCalledWith('user-id');
    });

    it('should restore', async () => {
      mocks.trash.getDeletedIds.mockResolvedValue(makeAssetIdStream(1));
      mocks.trash.restore.mockResolvedValue(1);
      await expect(sut.restore(authStub.user1)).resolves.toEqual({ count: 1 });
      expect(mocks.trash.restore).toHaveBeenCalledWith('user-id');
    });
  });

  describe('empty', () => {
    it('should handle an empty trash', async () => {
      mocks.trash.getDeletedIds.mockResolvedValue(makeAssetIdStream(0));
      mocks.trash.empty.mockResolvedValue(0);
      await expect(sut.empty(authStub.user1)).resolves.toEqual({ count: 0 });
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should empty the trash', async () => {
      mocks.trash.getDeletedIds.mockResolvedValue(makeAssetIdStream(1));
      mocks.trash.empty.mockResolvedValue(1);
      await expect(sut.empty(authStub.user1)).resolves.toEqual({ count: 1 });
      expect(mocks.trash.empty).toHaveBeenCalledWith('user-id');
      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.AssetEmptyTrash, data: {} });
    });
  });

  describe('onAssetsDelete', () => {
    it('should queue the empty trash job', async () => {
      await expect(sut.onAssetsDelete()).resolves.toBeUndefined();
      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.AssetEmptyTrash, data: {} });
    });
  });

  describe('handleQueueEmptyTrash', () => {
    it('should queue asset delete jobs', async () => {
      mocks.trash.getDeletedIds.mockReturnValue(makeAssetIdStream(1));
      await expect(sut.handleEmptyTrash()).resolves.toEqual(JobStatus.Success);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetDelete,
          data: { id: 'asset-1', deleteOnDisk: true },
        },
      ]);
    });

    it('should process assets in batches when count exceeds pagination size', async () => {
      // JOBS_ASSET_PAGINATION_SIZE is 1000, so we need more than 1000 items to trigger a batch flush
      const totalAssets = 1001;
      mocks.trash.getDeletedIds.mockReturnValue(makeAssetIdStream(totalAssets));

      await expect(sut.handleEmptyTrash()).resolves.toEqual(JobStatus.Success);

      // Should have been called twice: once for the first 1000, once for the remaining 1
      expect(mocks.job.queueAll).toHaveBeenCalledTimes(2);

      // First batch: 1000 assets
      const firstBatchCall = mocks.job.queueAll.mock.calls[0][0];
      expect(firstBatchCall).toHaveLength(1000);
      expect(firstBatchCall[0]).toEqual({
        name: JobName.AssetDelete,
        data: { id: 'asset-1', deleteOnDisk: true },
      });

      // Second batch: 1 remaining asset
      const secondBatchCall = mocks.job.queueAll.mock.calls[1][0];
      expect(secondBatchCall).toHaveLength(1);
      expect(secondBatchCall[0]).toEqual({
        name: JobName.AssetDelete,
        data: { id: 'asset-1001', deleteOnDisk: true },
      });
    });
  });
});
