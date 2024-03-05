import { BadRequestException } from '@nestjs/common';
import {
  IAccessRepositoryMock,
  assetStub,
  authStub,
  newAccessRepositoryMock,
  newAssetRepositoryMock,
  newCommunicationRepositoryMock,
  newJobRepositoryMock,
} from '@test';
import { JobName } from '..';
import { ClientEvent, IAssetRepository, ICommunicationRepository, IJobRepository } from '../repositories';
import { TrashService } from './trash.service';

describe(TrashService.name, () => {
  let sut: TrashService;
  let accessMock: IAccessRepositoryMock;
  let assetMock: jest.Mocked<IAssetRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let communicationMock: jest.Mocked<ICommunicationRepository>;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  beforeEach(() => {
    accessMock = newAccessRepositoryMock();
    assetMock = newAssetRepositoryMock();
    communicationMock = newCommunicationRepositoryMock();
    jobMock = newJobRepositoryMock();

    sut = new TrashService(accessMock, assetMock, jobMock, communicationMock);
  });

  describe('restoreAssets', () => {
    it('should require asset restore access for all ids', async () => {
      await expect(
        sut.restoreAssets(authStub.user1, {
          ids: ['asset-1'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should restore a batch of assets', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1', 'asset2']));

      await sut.restoreAssets(authStub.user1, { ids: ['asset1', 'asset2'] });

      expect(assetMock.restoreAll).toHaveBeenCalledWith(['asset1', 'asset2']);
      expect(jobMock.queue.mock.calls).toEqual([]);
    });
  });

  describe('restore', () => {
    it('should handle an empty trash', async () => {
      assetMock.getByUserId.mockResolvedValue({ items: [], hasNextPage: false });
      await expect(sut.restore(authStub.user1)).resolves.toBeUndefined();
      expect(assetMock.restoreAll).not.toHaveBeenCalled();
      expect(communicationMock.send).not.toHaveBeenCalled();
    });

    it('should restore and notify', async () => {
      assetMock.getByUserId.mockResolvedValue({ items: [assetStub.image], hasNextPage: false });
      await expect(sut.restore(authStub.user1)).resolves.toBeUndefined();
      expect(assetMock.restoreAll).toHaveBeenCalledWith([assetStub.image.id]);
      expect(communicationMock.send).toHaveBeenCalledWith(ClientEvent.ASSET_RESTORE, authStub.user1.user.id, [
        assetStub.image.id,
      ]);
    });
  });

  describe('empty', () => {
    it('should handle an empty trash', async () => {
      assetMock.getByUserId.mockResolvedValue({ items: [], hasNextPage: false });
      await expect(sut.empty(authStub.user1)).resolves.toBeUndefined();
      expect(jobMock.queueAll).toHaveBeenCalledWith([]);
    });

    it('should empty the trash', async () => {
      assetMock.getByUserId.mockResolvedValue({ items: [assetStub.image], hasNextPage: false });
      await expect(sut.empty(authStub.user1)).resolves.toBeUndefined();
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        { name: JobName.ASSET_DELETION, data: { id: assetStub.image.id } },
      ]);
    });
  });
});
