import { BadRequestException } from '@nestjs/common';
import { JobName, JobStatus } from 'src/enum.js';
import { Resource } from 'src/resource-paths.js';
import { TrashService } from 'src/services/trash.service.js';
import { AuthFactory } from 'test/factories/auth.factory.js';
import { authStub } from 'test/fixtures/auth.stub.js';
import { newUuids } from 'test/small.factory.js';
import { ServiceMocks, expectResourceEvents, newTestService } from 'test/utils.js';

const visibilityPaths = [
  Resource.albums(),
  Resource.duplicates(),
  Resource.mapMarkers(),
  Resource.memories(),
  Resource.people(),
  Resource.search(),
  Resource.view(),
];

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
      expect(mocks.resource.send).not.toHaveBeenCalled();
    });

    it('should handle an empty list', async () => {
      await expect(sut.restoreAssets(authStub.user1, { ids: [] })).resolves.toEqual({ count: 0 });
      expect(mocks.access.asset.checkOwnerAccess).not.toHaveBeenCalled();
      expect(mocks.resource.send).not.toHaveBeenCalled();
    });

    it('should tell the owner about the restored assets', async () => {
      const auth = AuthFactory.create();
      const ids = newUuids();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(ids));
      mocks.trash.restoreAll.mockResolvedValue(ids.length);

      await sut.restoreAssets(auth, { ids });

      expectResourceEvents(mocks, { userIds: [auth.user.id], changed: [Resource.assets(), ...visibilityPaths] });
    });

    it('should restore a batch of assets', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1', 'asset2']));
      mocks.trash.restoreAll.mockResolvedValue(0);

      await sut.restoreAssets(authStub.user1, { ids: ['asset1', 'asset2'] });

      expect(mocks.trash.restoreAll).toHaveBeenCalledWith(['asset1', 'asset2']);
      expect(mocks.job.queue.mock.calls).toEqual([]);
      expect(mocks.resource.send).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('should handle an empty trash', async () => {
      mocks.trash.getDeletedIds.mockResolvedValue(makeAssetIdStream(0));
      mocks.trash.restore.mockResolvedValue(0);
      await expect(sut.restore(authStub.user1)).resolves.toEqual({ count: 0 });
      expect(mocks.trash.restore).toHaveBeenCalledWith('user-id');
      expect(mocks.resource.send).not.toHaveBeenCalled();
    });

    it('should tell the owner about the restored assets', async () => {
      const auth = AuthFactory.create();
      mocks.trash.restore.mockResolvedValue(2);

      await sut.restore(auth);

      expectResourceEvents(mocks, { userIds: [auth.user.id], changed: [Resource.assets(), ...visibilityPaths] });
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
      expect(mocks.resource.send).not.toHaveBeenCalled();
    });

    it('should tell the owner about the emptied trash', async () => {
      const auth = AuthFactory.create();
      mocks.trash.empty.mockResolvedValue(2);

      await sut.empty(auth);

      expectResourceEvents(mocks, { userIds: [auth.user.id], changed: [Resource.assets()] });
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
  });
});
