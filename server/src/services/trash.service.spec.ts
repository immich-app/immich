import { BadRequestException } from '@nestjs/common';
import { IJobRepository, JobName, JobStatus } from 'src/interfaces/job.interface';
import { ITrashRepository } from 'src/interfaces/trash.interface';
import { TrashService } from 'src/services/trash.service';
import { authStub } from 'test/fixtures/auth.stub';
import { IAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(TrashService.name, () => {
  let sut: TrashService;

  let accessMock: IAccessRepositoryMock;
  let jobMock: Mocked<IJobRepository>;
  let trashMock: Mocked<ITrashRepository>;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  beforeEach(() => {
    ({ sut, accessMock, jobMock, trashMock } = newTestService(TrashService));
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
      expect(accessMock.asset.checkOwnerAccess).not.toHaveBeenCalled();
    });

    it('should restore a batch of assets', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1', 'asset2']));

      await sut.restoreAssets(authStub.user1, { ids: ['asset1', 'asset2'] });

      expect(trashMock.restoreAll).toHaveBeenCalledWith(['asset1', 'asset2']);
      expect(jobMock.queue.mock.calls).toEqual([]);
    });
  });

  describe('restore', () => {
    it('should handle an empty trash', async () => {
      trashMock.getDeletedIds.mockResolvedValue({ items: [], hasNextPage: false });
      trashMock.restore.mockResolvedValue(0);
      await expect(sut.restore(authStub.user1)).resolves.toEqual({ count: 0 });
      expect(trashMock.restore).toHaveBeenCalledWith('user-id');
    });

    it('should restore', async () => {
      trashMock.getDeletedIds.mockResolvedValue({ items: ['asset-1'], hasNextPage: false });
      trashMock.restore.mockResolvedValue(1);
      await expect(sut.restore(authStub.user1)).resolves.toEqual({ count: 1 });
      expect(trashMock.restore).toHaveBeenCalledWith('user-id');
    });
  });

  describe('empty', () => {
    it('should handle an empty trash', async () => {
      trashMock.getDeletedIds.mockResolvedValue({ items: [], hasNextPage: false });
      trashMock.empty.mockResolvedValue(0);
      await expect(sut.empty(authStub.user1)).resolves.toEqual({ count: 0 });
      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should empty the trash', async () => {
      trashMock.getDeletedIds.mockResolvedValue({ items: ['asset-1'], hasNextPage: false });
      trashMock.empty.mockResolvedValue(1);
      await expect(sut.empty(authStub.user1)).resolves.toEqual({ count: 1 });
      expect(trashMock.empty).toHaveBeenCalledWith('user-id');
      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_TRASH_EMPTY, data: {} });
    });
  });

  describe('onAssetsDelete', () => {
    it('should queue the empty trash job', async () => {
      await expect(sut.onAssetsDelete()).resolves.toBeUndefined();
      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_TRASH_EMPTY, data: {} });
    });
  });

  describe('handleQueueEmptyTrash', () => {
    it('should queue asset delete jobs', async () => {
      trashMock.getDeletedIds.mockResolvedValue({ items: ['asset-1'], hasNextPage: false });
      await expect(sut.handleQueueEmptyTrash()).resolves.toEqual(JobStatus.SUCCESS);
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.ASSET_DELETION,
          data: { id: 'asset-1', deleteOnDisk: true },
        },
      ]);
    });
  });
});
