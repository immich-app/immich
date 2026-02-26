import { BadRequestException } from '@nestjs/common';
import { StackService } from 'src/services/stack.service';
import { AssetFactory } from 'test/factories/asset.factory';
import { AuthFactory } from 'test/factories/auth.factory';
import { StackFactory } from 'test/factories/stack.factory';
import { authStub } from 'test/fixtures/auth.stub';
import { newUuid } from 'test/small.factory';
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
      const auth = AuthFactory.create();
      const asset = AssetFactory.create();
      const stack = StackFactory.from().primaryAsset(asset).build();
      mocks.stack.search.mockResolvedValue([stack]);

      await sut.search(auth, { primaryAssetId: asset.id });
      expect(mocks.stack.search).toHaveBeenCalledWith({
        ownerId: auth.user.id,
        primaryAssetId: asset.id,
      });
    });
  });

  describe('create', () => {
    it('should require asset.update permissions', async () => {
      const auth = AuthFactory.create();
      const [primaryAsset, asset] = [AssetFactory.create(), AssetFactory.create()];

      await expect(sut.create(auth, { assetIds: [primaryAsset.id, asset.id] })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalled();
      expect(mocks.stack.create).not.toHaveBeenCalled();
    });

    it('should create a stack', async () => {
      const auth = AuthFactory.create();
      const [primaryAsset, asset] = [AssetFactory.create(), AssetFactory.create()];
      const stack = StackFactory.from().primaryAsset(primaryAsset).asset(asset).build();

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([primaryAsset.id, asset.id]));
      mocks.stack.create.mockResolvedValue(stack);

      await expect(sut.create(auth, { assetIds: [primaryAsset.id, asset.id] })).resolves.toEqual({
        id: stack.id,
        primaryAssetId: primaryAsset.id,
        assets: [expect.objectContaining({ id: primaryAsset.id }), expect.objectContaining({ id: asset.id })],
      });

      expect(mocks.event.emit).toHaveBeenCalledWith('StackCreate', {
        stackId: stack.id,
        userId: auth.user.id,
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
      const auth = AuthFactory.create();
      const [primaryAsset, asset] = [AssetFactory.create(), AssetFactory.create()];
      const stack = StackFactory.from().primaryAsset(primaryAsset).asset(asset).build();

      mocks.access.stack.checkOwnerAccess.mockResolvedValue(new Set([stack.id]));
      mocks.stack.getById.mockResolvedValue(stack);

      await expect(sut.get(auth, stack.id)).resolves.toEqual({
        id: stack.id,
        primaryAssetId: primaryAsset.id,
        assets: [expect.objectContaining({ id: primaryAsset.id }), expect.objectContaining({ id: asset.id })],
      });
      expect(mocks.access.stack.checkOwnerAccess).toHaveBeenCalled();
      expect(mocks.stack.getById).toHaveBeenCalledWith(stack.id);
    });
  });

  describe('update', () => {
    it('should require stack.update permissions', async () => {
      await expect(sut.update(AuthFactory.create(), 'stack-id', {})).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.stack.getById).not.toHaveBeenCalled();
      expect(mocks.stack.update).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it('should fail if stack could not be found', async () => {
      mocks.access.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));

      await expect(sut.update(AuthFactory.create(), 'stack-id', {})).rejects.toBeInstanceOf(Error);

      expect(mocks.stack.getById).toHaveBeenCalledWith('stack-id');
      expect(mocks.stack.update).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it('should fail if the provided primary asset id is not in the stack', async () => {
      const auth = AuthFactory.create();
      const stack = StackFactory.from().primaryAsset().asset().build();

      mocks.access.stack.checkOwnerAccess.mockResolvedValue(new Set([stack.id]));
      mocks.stack.getById.mockResolvedValue(stack);

      await expect(sut.update(auth, stack.id, { primaryAssetId: 'unknown-asset' })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.stack.getById).toHaveBeenCalledWith(stack.id);
      expect(mocks.stack.update).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it('should update stack', async () => {
      const auth = AuthFactory.create();
      const [primaryAsset, asset] = [AssetFactory.create(), AssetFactory.create()];
      const stack = StackFactory.from().primaryAsset(primaryAsset).asset(asset).build();

      mocks.access.stack.checkOwnerAccess.mockResolvedValue(new Set([stack.id]));
      mocks.stack.getById.mockResolvedValue(stack);
      mocks.stack.update.mockResolvedValue(stack);

      await sut.update(auth, stack.id, { primaryAssetId: asset.id });

      expect(mocks.stack.getById).toHaveBeenCalledWith(stack.id);
      expect(mocks.stack.update).toHaveBeenCalledWith(stack.id, {
        id: stack.id,
        primaryAssetId: asset.id,
      });
      expect(mocks.event.emit).toHaveBeenCalledWith('StackUpdate', {
        stackId: stack.id,
        userId: auth.user.id,
      });
    });
  });

  describe('delete', () => {
    it('should require stack.delete permissions', async () => {
      await expect(sut.delete(AuthFactory.create(), 'stack-id')).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.stack.delete).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it('should delete stack', async () => {
      const auth = AuthFactory.create();

      mocks.access.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));
      mocks.stack.delete.mockResolvedValue();

      await sut.delete(auth, 'stack-id');

      expect(mocks.stack.delete).toHaveBeenCalledWith('stack-id');
      expect(mocks.event.emit).toHaveBeenCalledWith('StackDelete', {
        stackId: 'stack-id',
        userId: auth.user.id,
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
      expect(mocks.event.emit).toHaveBeenCalledWith('StackDeleteAll', {
        stackIds: ['stack-id'],
        userId: authStub.admin.user.id,
      });
    });
  });

  describe('removeAsset', () => {
    it('should require stack.update permissions', async () => {
      await expect(sut.removeAsset(authStub.admin, { id: 'stack-id', assetId: 'asset-id' })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.stack.getForAssetRemoval).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it('should fail if the asset is not in the stack', async () => {
      mocks.access.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));
      mocks.stack.getForAssetRemoval.mockResolvedValue({ id: null, primaryAssetId: null });

      await expect(sut.removeAsset(authStub.admin, { id: 'stack-id', assetId: newUuid() })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.asset.update).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it('should fail if the assetId is the primaryAssetId', async () => {
      const asset = AssetFactory.create();
      mocks.access.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));
      mocks.stack.getForAssetRemoval.mockResolvedValue({ id: 'stack-id', primaryAssetId: asset.id });

      await expect(sut.removeAsset(authStub.admin, { id: 'stack-id', assetId: asset.id })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.asset.update).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it("should update the asset to nullify it's stack-id", async () => {
      const [primaryAsset, asset] = [AssetFactory.create(), AssetFactory.create()];
      mocks.access.stack.checkOwnerAccess.mockResolvedValue(new Set(['stack-id']));
      mocks.stack.getForAssetRemoval.mockResolvedValue({ id: 'stack-id', primaryAssetId: primaryAsset.id });

      await sut.removeAsset(authStub.admin, { id: 'stack-id', assetId: asset.id });

      expect(mocks.asset.update).toHaveBeenCalledWith({ id: asset.id, stackId: null });
      expect(mocks.event.emit).toHaveBeenCalledWith('StackUpdate', {
        stackId: 'stack-id',
        userId: authStub.admin.user.id,
      });
    });
  });
});
