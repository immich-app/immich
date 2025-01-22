import { BadRequestException } from '@nestjs/common';
import { IEventRepository } from 'src/interfaces/event.interface';
import { IStackRepository } from 'src/interfaces/stack.interface';
import { StackService } from 'src/services/stack.service';
import { assetStub, stackStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { IAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(StackService.name, () => {
  let sut: StackService;

  let accessMock: IAccessRepositoryMock;
  let eventMock: Mocked<IEventRepository>;
  let stackMock: Mocked<IStackRepository>;

  beforeEach(() => {
    ({ sut, accessMock, eventMock, stackMock } = newTestService(StackService));
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('search', () => {
    it('should search stacks', async () => {
      stackMock.search.mockResolvedValue([stackStub('stack-id', [assetStub.image])]);

      await sut.search(authStub.admin, { primaryAssetId: assetStub.image.id });
      expect(stackMock.search).toHaveBeenCalledWith({
        ownerId: authStub.admin.user.id,
        primaryAssetId: assetStub.image.id,
      });
    });
  });

  describe('create', () => {
    it('should require asset.update permissions', async () => {
      await expect(
        sut.create(authStub.admin, { assetIds: [assetStub.image.id, assetStub.image1.id] }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(accessMock.asset.checkOwnerAccess).toHaveBeenCalled();
      expect(stackMock.create).not.toHaveBeenCalled();
    });

    it('should create a stack', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id, assetStub.image1.id]));
      stackMock.create.mockResolvedValue(stackStub('stack-id', [assetStub.image, assetStub.image1]));
      await expect(
        sut.create(authStub.admin, { assetIds: [assetStub.image.id, assetStub.image1.id] }),
      ).resolves.toEqual({
        id: 'stack-id',
        primaryAssetId: assetStub.image.id,
        assets: [
          expect.objectContaining({ id: assetStub.image.id }),
          expect.objectContaining({ id: assetStub.image1.id }),
        ],
      });

      expect(eventMock.emit).toHaveBeenCalledWith('stack.create', {
        stackId: 'stack-id',
        userId: authStub.admin.user.id,
      });
      expect(accessMock.asset.checkOwnerAccess).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should require stack.read permissions', async () => {
      await expect(sut.get(authStub.admin, 'stack-id')).rejects.toBeInstanceOf(BadRequestException);

      expect(accessMock.stack.checkOwnerAccess).toHaveBeenCalled();
      expect(stackMock.getById).not.toHaveBeenCalled();
    });

    it('should fail if stack could not be found', async () => {
      accessMock.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));

      await expect(sut.get(authStub.admin, 'stack-id')).rejects.toBeInstanceOf(Error);

      expect(accessMock.stack.checkOwnerAccess).toHaveBeenCalled();
      expect(stackMock.getById).toHaveBeenCalledWith('stack-id');
    });

    it('should get stack', async () => {
      accessMock.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));
      stackMock.getById.mockResolvedValue(stackStub('stack-id', [assetStub.image, assetStub.image1]));

      await expect(sut.get(authStub.admin, 'stack-id')).resolves.toEqual({
        id: 'stack-id',
        primaryAssetId: assetStub.image.id,
        assets: [
          expect.objectContaining({ id: assetStub.image.id }),
          expect.objectContaining({ id: assetStub.image1.id }),
        ],
      });
      expect(accessMock.stack.checkOwnerAccess).toHaveBeenCalled();
      expect(stackMock.getById).toHaveBeenCalledWith('stack-id');
    });
  });

  describe('update', () => {
    it('should require stack.update permissions', async () => {
      await expect(sut.update(authStub.admin, 'stack-id', {})).rejects.toBeInstanceOf(BadRequestException);

      expect(stackMock.getById).not.toHaveBeenCalled();
      expect(stackMock.update).not.toHaveBeenCalled();
      expect(eventMock.emit).not.toHaveBeenCalled();
    });

    it('should fail if stack could not be found', async () => {
      accessMock.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));

      await expect(sut.update(authStub.admin, 'stack-id', {})).rejects.toBeInstanceOf(Error);

      expect(stackMock.getById).toHaveBeenCalledWith('stack-id');
      expect(stackMock.update).not.toHaveBeenCalled();
      expect(eventMock.emit).not.toHaveBeenCalled();
    });

    it('should fail if the provided primary asset id is not in the stack', async () => {
      accessMock.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));
      stackMock.getById.mockResolvedValue(stackStub('stack-id', [assetStub.image, assetStub.image1]));

      await expect(sut.update(authStub.admin, 'stack-id', { primaryAssetId: 'unknown-asset' })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(stackMock.getById).toHaveBeenCalledWith('stack-id');
      expect(stackMock.update).not.toHaveBeenCalled();
      expect(eventMock.emit).not.toHaveBeenCalled();
    });

    it('should update stack', async () => {
      accessMock.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));
      stackMock.getById.mockResolvedValue(stackStub('stack-id', [assetStub.image, assetStub.image1]));
      stackMock.update.mockResolvedValue(stackStub('stack-id', [assetStub.image, assetStub.image1]));

      await sut.update(authStub.admin, 'stack-id', { primaryAssetId: assetStub.image1.id });

      expect(stackMock.getById).toHaveBeenCalledWith('stack-id');
      expect(stackMock.update).toHaveBeenCalledWith('stack-id', {
        id: 'stack-id',
        primaryAssetId: assetStub.image1.id,
      });
      expect(eventMock.emit).toHaveBeenCalledWith('stack.update', {
        stackId: 'stack-id',
        userId: authStub.admin.user.id,
      });
    });
  });

  describe('delete', () => {
    it('should require stack.delete permissions', async () => {
      await expect(sut.delete(authStub.admin, 'stack-id')).rejects.toBeInstanceOf(BadRequestException);

      expect(stackMock.delete).not.toHaveBeenCalled();
      expect(eventMock.emit).not.toHaveBeenCalled();
    });

    it('should delete stack', async () => {
      accessMock.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));

      await sut.delete(authStub.admin, 'stack-id');

      expect(stackMock.delete).toHaveBeenCalledWith('stack-id');
      expect(eventMock.emit).toHaveBeenCalledWith('stack.delete', {
        stackId: 'stack-id',
        userId: authStub.admin.user.id,
      });
    });
  });

  describe('deleteAll', () => {
    it('should require stack.delete permissions', async () => {
      await expect(sut.deleteAll(authStub.admin, { ids: ['stack-id'] })).rejects.toBeInstanceOf(BadRequestException);

      expect(stackMock.deleteAll).not.toHaveBeenCalled();
      expect(eventMock.emit).not.toHaveBeenCalled();
    });

    it('should delete all stacks', async () => {
      accessMock.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));

      await sut.deleteAll(authStub.admin, { ids: ['stack-id'] });

      expect(stackMock.deleteAll).toHaveBeenCalledWith(['stack-id']);
      expect(eventMock.emit).toHaveBeenCalledWith('stacks.delete', {
        stackIds: ['stack-id'],
        userId: authStub.admin.user.id,
      });
    });
  });
});
