import { BadRequestException } from '@nestjs/common';
import { StackService } from 'src/services/stack.service';
import { assetStub, stackStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { newTestService, ServiceMocks } from 'test/utils';

describe(StackService.name, () => {
  let sut: StackService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(StackService));
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('search', () => {
    it('should search stacks', async () => {
      mocks.stack.search.mockResolvedValue([stackStub('stack-id', [assetStub.image])]);

      await sut.search(authStub.admin, { primaryAssetId: assetStub.image.id });
      expect(mocks.stack.search).toHaveBeenCalledWith({
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

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalled();
      expect(mocks.stack.create).not.toHaveBeenCalled();
    });

    it('should create a stack', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id, assetStub.image1.id]));
      mocks.stack.create.mockResolvedValue(stackStub('stack-id', [assetStub.image, assetStub.image1]));
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

      expect(mocks.event.emit).toHaveBeenCalledWith('stack.create', {
        stackId: 'stack-id',
        userId: authStub.admin.user.id,
      });
      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should require stack.read permissions', async () => {
      await expect(sut.get(authStub.admin, 'stack-id')).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.access.stack.checkOwnerAccess).toHaveBeenCalled();
      expect(mocks.stack.getById).not.toHaveBeenCalled();
    });

    it('should fail if stack could not be found', async () => {
      mocks.access.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));

      await expect(sut.get(authStub.admin, 'stack-id')).rejects.toBeInstanceOf(Error);

      expect(mocks.access.stack.checkOwnerAccess).toHaveBeenCalled();
      expect(mocks.stack.getById).toHaveBeenCalledWith('stack-id');
    });

    it('should get stack', async () => {
      mocks.access.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));
      mocks.stack.getById.mockResolvedValue(stackStub('stack-id', [assetStub.image, assetStub.image1]));

      await expect(sut.get(authStub.admin, 'stack-id')).resolves.toEqual({
        id: 'stack-id',
        primaryAssetId: assetStub.image.id,
        assets: [
          expect.objectContaining({ id: assetStub.image.id }),
          expect.objectContaining({ id: assetStub.image1.id }),
        ],
      });
      expect(mocks.access.stack.checkOwnerAccess).toHaveBeenCalled();
      expect(mocks.stack.getById).toHaveBeenCalledWith('stack-id');
    });
  });

  describe('update', () => {
    it('should require stack.update permissions', async () => {
      await expect(sut.update(authStub.admin, 'stack-id', {})).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.stack.getById).not.toHaveBeenCalled();
      expect(mocks.stack.update).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it('should fail if stack could not be found', async () => {
      mocks.access.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));

      await expect(sut.update(authStub.admin, 'stack-id', {})).rejects.toBeInstanceOf(Error);

      expect(mocks.stack.getById).toHaveBeenCalledWith('stack-id');
      expect(mocks.stack.update).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it('should fail if the provided primary asset id is not in the stack', async () => {
      mocks.access.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));
      mocks.stack.getById.mockResolvedValue(stackStub('stack-id', [assetStub.image, assetStub.image1]));

      await expect(sut.update(authStub.admin, 'stack-id', { primaryAssetId: 'unknown-asset' })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.stack.getById).toHaveBeenCalledWith('stack-id');
      expect(mocks.stack.update).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it('should update stack', async () => {
      mocks.access.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));
      mocks.stack.getById.mockResolvedValue(stackStub('stack-id', [assetStub.image, assetStub.image1]));
      mocks.stack.update.mockResolvedValue(stackStub('stack-id', [assetStub.image, assetStub.image1]));

      await sut.update(authStub.admin, 'stack-id', { primaryAssetId: assetStub.image1.id });

      expect(mocks.stack.getById).toHaveBeenCalledWith('stack-id');
      expect(mocks.stack.update).toHaveBeenCalledWith('stack-id', {
        id: 'stack-id',
        primaryAssetId: assetStub.image1.id,
      });
      expect(mocks.event.emit).toHaveBeenCalledWith('stack.update', {
        stackId: 'stack-id',
        userId: authStub.admin.user.id,
      });
    });
  });

  describe('delete', () => {
    it('should require stack.delete permissions', async () => {
      await expect(sut.delete(authStub.admin, 'stack-id')).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.stack.delete).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it('should delete stack', async () => {
      mocks.access.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));
      mocks.stack.delete.mockResolvedValue();

      await sut.delete(authStub.admin, 'stack-id');

      expect(mocks.stack.delete).toHaveBeenCalledWith('stack-id');
      expect(mocks.event.emit).toHaveBeenCalledWith('stack.delete', {
        stackId: 'stack-id',
        userId: authStub.admin.user.id,
      });
    });
  });

  describe('deleteAll', () => {
    it('should require stack.delete permissions', async () => {
      await expect(sut.deleteAll(authStub.admin, { ids: ['stack-id'] })).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.stack.deleteAll).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it('should delete all stacks', async () => {
      mocks.access.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));
      mocks.stack.deleteAll.mockResolvedValue();

      await sut.deleteAll(authStub.admin, { ids: ['stack-id'] });

      expect(mocks.stack.deleteAll).toHaveBeenCalledWith(['stack-id']);
      expect(mocks.event.emit).toHaveBeenCalledWith('stacks.delete', {
        stackIds: ['stack-id'],
        userId: authStub.admin.user.id,
      });
    });
  });
});
