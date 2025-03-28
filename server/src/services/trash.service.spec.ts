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
      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_TRASH_EMPTY, data: {} });
    });
  });

  describe('onAssetsDelete', () => {
    it('should queue the empty trash job', async () => {
      await expect(sut.onAssetsDelete()).resolves.toBeUndefined();
      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_TRASH_EMPTY, data: {} });
    });
  });

  describe('handleQueueEmptyTrash', () => {
    it('should queue asset delete jobs', async () => {
      mocks.trash.getDeletedIds.mockReturnValue(makeAssetIdStream(1));
      await expect(sut.handleQueueEmptyTrash()).resolves.toEqual(JobStatus.SUCCESS);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.ASSET_DELETION,
          data: { id: 'asset-1', deleteOnDisk: true },
        },
      ]);
    });
  });
});
