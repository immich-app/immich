import { BadRequestException } from '@nestjs/common';
import { MemoryService } from 'src/services/memory.service';
import { OnThisDayData } from 'src/types';
import { AssetFactory } from 'test/factories/asset.factory';
import { MemoryFactory } from 'test/factories/memory.factory';
import { factory, newUuid, newUuids } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

describe(MemoryService.name, () => {
  let sut: MemoryService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(MemoryService));
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('onMemoryCleanup', () => {
    it('should clean up memories', async () => {
      mocks.memory.cleanup.mockResolvedValue([]);
      await sut.onMemoriesCleanup();
      expect(mocks.memory.cleanup).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search memories', async () => {
      const [userId] = newUuids();
      const asset = AssetFactory.create();
      const memory1 = MemoryFactory.from({ ownerId: userId }).asset(asset).build();
      const memory2 = MemoryFactory.create({ ownerId: userId });

      mocks.memory.search.mockResolvedValue([memory1, memory2]);

      await expect(sut.search(factory.auth({ user: { id: userId } }), {})).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: memory1.id, assets: [expect.objectContaining({ id: asset.id })] }),
          expect.objectContaining({ id: memory2.id, assets: [] }),
        ]),
      );
    });

    it('should map ', async () => {
      mocks.memory.search.mockResolvedValue([]);

      await expect(sut.search(factory.auth(), {})).resolves.toEqual([]);
    });
  });

  describe('get', () => {
    it('should throw an error when no access', async () => {
      await expect(sut.get(factory.auth(), 'not-found')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw an error when the memory is not found', async () => {
      const [memoryId] = newUuids();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memoryId]));
      mocks.memory.get.mockResolvedValue(void 0);

      await expect(sut.get(factory.auth(), memoryId)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should get a memory by id', async () => {
      const userId = newUuid();
      const memory = MemoryFactory.create({ ownerId: userId });

      mocks.memory.get.mockResolvedValue(memory);
      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));

      await expect(sut.get(factory.auth({ user: { id: userId } }), memory.id)).resolves.toMatchObject({
        id: memory.id,
      });

      expect(mocks.memory.get).toHaveBeenCalledWith(memory.id);
      expect(mocks.access.memory.checkOwnerAccess).toHaveBeenCalledWith(memory.ownerId, new Set([memory.id]));
    });
  });

  describe('create', () => {
    it('should skip assets the user does not have access to', async () => {
      const [assetId, userId] = newUuids();
      const memory = MemoryFactory.create({ ownerId: userId });

      mocks.memory.create.mockResolvedValue(memory);

      await expect(
        sut.create(factory.auth({ user: { id: userId } }), {
          type: memory.type,
          data: memory.data as OnThisDayData,
          memoryAt: memory.memoryAt,
          isSaved: memory.isSaved,
          assetIds: [assetId],
        }),
      ).resolves.toMatchObject({ assets: [] });

      expect(mocks.memory.create).toHaveBeenCalledWith(
        {
          type: memory.type,
          data: memory.data,
          ownerId: memory.ownerId,
          memoryAt: memory.memoryAt,
          isSaved: memory.isSaved,
        },
        new Set(),
      );
    });

    it('should create a memory', async () => {
      const [assetId, userId] = newUuids();
      const asset = AssetFactory.create({ id: assetId, ownerId: userId });
      const memory = MemoryFactory.from().asset(asset).build();

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.memory.create.mockResolvedValue(memory);

      await expect(
        sut.create(factory.auth({ user: { id: userId } }), {
          type: memory.type,
          data: memory.data as OnThisDayData,
          assetIds: memory.assets.map((asset) => asset.id),
          memoryAt: memory.memoryAt,
        }),
      ).resolves.toBeDefined();

      expect(mocks.memory.create).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: userId }),
        new Set([assetId]),
      );
    });

    it('should create a memory without assets', async () => {
      const memory = MemoryFactory.create();

      mocks.memory.create.mockResolvedValue(memory);

      await expect(
        sut.create(factory.auth(), {
          type: memory.type,
          data: memory.data as OnThisDayData,
          memoryAt: memory.memoryAt,
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('update', () => {
    it('should require access', async () => {
      await expect(sut.update(factory.auth(), 'not-found', { isSaved: true })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.memory.update).not.toHaveBeenCalled();
    });

    it('should update a memory', async () => {
      const memory = MemoryFactory.create();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.memory.update.mockResolvedValue(memory);

      await expect(sut.update(factory.auth(), memory.id, { isSaved: true })).resolves.toBeDefined();

      expect(mocks.memory.update).toHaveBeenCalledWith(memory.id, expect.objectContaining({ isSaved: true }));
    });
  });

  describe('remove', () => {
    it('should require access', async () => {
      await expect(sut.remove(factory.auth(), newUuid())).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.memory.delete).not.toHaveBeenCalled();
    });

    it('should delete a memory', async () => {
      const memoryId = newUuid();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memoryId]));
      mocks.memory.delete.mockResolvedValue();

      await expect(sut.remove(factory.auth(), memoryId)).resolves.toBeUndefined();

      expect(mocks.memory.delete).toHaveBeenCalledWith(memoryId);
    });
  });

  describe('addAssets', () => {
    it('should require memory access', async () => {
      const [memoryId, assetId] = newUuids();

      await expect(sut.addAssets(factory.auth(), memoryId, { ids: [assetId] })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.memory.addAssetIds).not.toHaveBeenCalled();
    });

    it('should require asset access', async () => {
      const assetId = newUuid();
      const memory = MemoryFactory.create();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.memory.get.mockResolvedValue(memory);
      mocks.memory.getAssetIds.mockResolvedValue(new Set());

      await expect(sut.addAssets(factory.auth(), memory.id, { ids: [assetId] })).resolves.toEqual([
        { error: 'no_permission', id: assetId, success: false },
      ]);

      expect(mocks.memory.addAssetIds).not.toHaveBeenCalled();
    });

    it('should skip assets already in the memory', async () => {
      const asset = AssetFactory.create();
      const memory = MemoryFactory.from().asset(asset).build();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.memory.get.mockResolvedValue(memory);
      mocks.memory.getAssetIds.mockResolvedValue(new Set([asset.id]));

      await expect(sut.addAssets(factory.auth(), memory.id, { ids: [asset.id] })).resolves.toEqual([
        { error: 'duplicate', id: asset.id, success: false },
      ]);

      expect(mocks.memory.addAssetIds).not.toHaveBeenCalled();
    });

    it('should add assets', async () => {
      const assetId = newUuid();
      const memory = MemoryFactory.create();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.memory.get.mockResolvedValue(memory);
      mocks.memory.update.mockResolvedValue(memory);
      mocks.memory.getAssetIds.mockResolvedValue(new Set());
      mocks.memory.addAssetIds.mockResolvedValue();

      await expect(sut.addAssets(factory.auth(), memory.id, { ids: [assetId] })).resolves.toEqual([
        { id: assetId, success: true },
      ]);

      expect(mocks.memory.addAssetIds).toHaveBeenCalledWith(memory.id, [assetId]);
    });
  });

  describe('removeAssets', () => {
    it('should require memory access', async () => {
      await expect(sut.removeAssets(factory.auth(), 'not-found', { ids: ['asset1'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.memory.removeAssetIds).not.toHaveBeenCalled();
    });

    it('should skip assets not in the memory', async () => {
      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set(['memory1']));
      mocks.memory.getAssetIds.mockResolvedValue(new Set());

      await expect(sut.removeAssets(factory.auth(), 'memory1', { ids: ['not-found'] })).resolves.toEqual([
        { error: 'not_found', id: 'not-found', success: false },
      ]);

      expect(mocks.memory.removeAssetIds).not.toHaveBeenCalled();
    });

    it('should remove assets', async () => {
      const memory = MemoryFactory.create();
      const asset = AssetFactory.create();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.memory.getAssetIds.mockResolvedValue(new Set([asset.id]));
      mocks.memory.removeAssetIds.mockResolvedValue();
      mocks.memory.update.mockResolvedValue(memory);

      await expect(sut.removeAssets(factory.auth(), memory.id, { ids: [asset.id] })).resolves.toEqual([
        { id: asset.id, success: true },
      ]);

      expect(mocks.memory.removeAssetIds).toHaveBeenCalledWith(memory.id, [asset.id]);
    });
  });
});
