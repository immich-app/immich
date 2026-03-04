import { BadRequestException } from '@nestjs/common';
import { MemoryType } from 'src/enum';
import { MemoryService } from 'src/services/memory.service';
import { OnThisDayData } from 'src/types';
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

  describe('onMemoriesCreate', () => {
    it('should generate memories for all users', async () => {
      const user = factory.user();
      mocks.user.getList.mockResolvedValue([user]);
      mocks.systemMetadata.get.mockResolvedValue(null);
      mocks.asset.getByDayOfYear.mockResolvedValue([]);

      await sut.onMemoriesCreate();

      expect(mocks.user.getList).toHaveBeenCalledWith({ withDeleted: false });
      expect(mocks.systemMetadata.set).toHaveBeenCalled();
    });

    it('should skip dates that have already been processed', async () => {
      const user = factory.user();
      mocks.user.getList.mockResolvedValue([user]);
      // Set lastOnThisDayDate to far in the future so all dates are skipped
      mocks.systemMetadata.get.mockResolvedValue({
        lastOnThisDayDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      await sut.onMemoriesCreate();

      // Should not create any memories since all dates were already processed
      expect(mocks.asset.getByDayOfYear).not.toHaveBeenCalled();
    });

    it('should create on-this-day memories when assets exist', async () => {
      const user = factory.user();
      const asset = factory.asset({ ownerId: user.id });
      mocks.user.getList.mockResolvedValue([user]);
      mocks.systemMetadata.get.mockResolvedValue(null);
      mocks.asset.getByDayOfYear.mockResolvedValue([{ year: 2023, assets: [asset] }]);
      mocks.memory.create.mockResolvedValue(factory.memory());

      await sut.onMemoriesCreate();

      expect(mocks.memory.create).toHaveBeenCalled();
    });

    it('should handle errors during memory creation gracefully', async () => {
      const user = factory.user();
      mocks.user.getList.mockResolvedValue([user]);
      mocks.systemMetadata.get.mockResolvedValue(null);
      mocks.asset.getByDayOfYear.mockRejectedValue(new Error('Database error'));

      // Should not throw; errors are caught internally
      await sut.onMemoriesCreate();

      // Should still update system metadata even on error
      expect(mocks.systemMetadata.set).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search memories', async () => {
      const [userId] = newUuids();
      const asset = factory.asset();
      const memory1 = factory.memory({ ownerId: userId, assets: [asset] });
      const memory2 = factory.memory({ ownerId: userId });

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

    it('should pass search dto to repository', async () => {
      const auth = factory.auth();
      const dto = { type: MemoryType.OnThisDay, isSaved: true };
      mocks.memory.search.mockResolvedValue([]);

      await sut.search(auth, dto);

      expect(mocks.memory.search).toHaveBeenCalledWith(auth.user.id, dto);
    });
  });

  describe('statistics', () => {
    it('should return memory statistics', async () => {
      const auth = factory.auth();
      const dto = { type: MemoryType.OnThisDay };
      const stats = { total: 5 };
      mocks.memory.statistics.mockResolvedValue(stats as any);

      const result = await sut.statistics(auth, dto);

      expect(result).toEqual(stats);
      expect(mocks.memory.statistics).toHaveBeenCalledWith(auth.user.id, dto);
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
      const memory = factory.memory({ ownerId: userId });

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
      const memory = factory.memory({ ownerId: userId });

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
      const asset = factory.asset({ id: assetId, ownerId: userId });
      const memory = factory.memory({ assets: [asset] });

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
      const memory = factory.memory();

      mocks.memory.create.mockResolvedValue(memory);

      await expect(
        sut.create(factory.auth(), {
          type: memory.type,
          data: memory.data as OnThisDayData,
          memoryAt: memory.memoryAt,
        }),
      ).resolves.toBeDefined();
    });

    it('should pass all optional fields when creating a memory', async () => {
      const userId = newUuid();
      const memory = factory.memory({ ownerId: userId });
      const showAt = new Date();
      const hideAt = new Date();
      const seenAt = new Date();

      mocks.memory.create.mockResolvedValue(memory);

      await sut.create(factory.auth({ user: { id: userId } }), {
        type: memory.type,
        data: memory.data as OnThisDayData,
        memoryAt: memory.memoryAt,
        isSaved: true,
        showAt,
        hideAt,
        seenAt,
      });

      expect(mocks.memory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: userId,
          isSaved: true,
          showAt,
          hideAt,
          seenAt,
        }),
        new Set(),
      );
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
      const memory = factory.memory();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.memory.update.mockResolvedValue(memory);

      await expect(sut.update(factory.auth(), memory.id, { isSaved: true })).resolves.toBeDefined();

      expect(mocks.memory.update).toHaveBeenCalledWith(memory.id, expect.objectContaining({ isSaved: true }));
    });

    it('should update a memory with seenAt', async () => {
      const memory = factory.memory();
      const seenAt = new Date();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.memory.update.mockResolvedValue(memory);

      await sut.update(factory.auth(), memory.id, { seenAt });

      expect(mocks.memory.update).toHaveBeenCalledWith(memory.id, expect.objectContaining({ seenAt }));
    });

    it('should update a memory with memoryAt', async () => {
      const memory = factory.memory();
      const memoryAt = new Date();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.memory.update.mockResolvedValue(memory);

      await sut.update(factory.auth(), memory.id, { memoryAt });

      expect(mocks.memory.update).toHaveBeenCalledWith(memory.id, expect.objectContaining({ memoryAt }));
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
      const memory = factory.memory();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.memory.get.mockResolvedValue(memory);
      mocks.memory.getAssetIds.mockResolvedValue(new Set());

      await expect(sut.addAssets(factory.auth(), memory.id, { ids: [assetId] })).resolves.toEqual([
        { error: 'no_permission', id: assetId, success: false },
      ]);

      expect(mocks.memory.addAssetIds).not.toHaveBeenCalled();
    });

    it('should skip assets already in the memory', async () => {
      const asset = factory.asset();
      const memory = factory.memory({ assets: [asset] });

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
      const memory = factory.memory();

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

    it('should update memory updatedAt when assets are successfully added', async () => {
      const assetId = newUuid();
      const memory = factory.memory();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.memory.get.mockResolvedValue(memory);
      mocks.memory.update.mockResolvedValue(memory);
      mocks.memory.getAssetIds.mockResolvedValue(new Set());
      mocks.memory.addAssetIds.mockResolvedValue();

      await sut.addAssets(factory.auth(), memory.id, { ids: [assetId] });

      expect(mocks.memory.update).toHaveBeenCalledWith(memory.id, { updatedAt: expect.any(Date) });
    });

    it('should not update memory updatedAt when no assets are successfully added', async () => {
      const asset = factory.asset();
      const memory = factory.memory({ assets: [asset] });

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.memory.get.mockResolvedValue(memory);
      mocks.memory.getAssetIds.mockResolvedValue(new Set([asset.id]));

      await sut.addAssets(factory.auth(), memory.id, { ids: [asset.id] });

      expect(mocks.memory.update).not.toHaveBeenCalled();
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
      const memory = factory.memory();
      const asset = factory.asset();

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

    it('should update memory updatedAt when assets are successfully removed', async () => {
      const memory = factory.memory();
      const asset = factory.asset();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.memory.getAssetIds.mockResolvedValue(new Set([asset.id]));
      mocks.memory.removeAssetIds.mockResolvedValue();
      mocks.memory.update.mockResolvedValue(memory);

      await sut.removeAssets(factory.auth(), memory.id, { ids: [asset.id] });

      expect(mocks.memory.update).toHaveBeenCalledWith(memory.id, expect.objectContaining({ updatedAt: expect.any(Date) }));
    });

    it('should not update memory updatedAt when no assets are successfully removed', async () => {
      const memory = factory.memory();

      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set([memory.id]));
      mocks.memory.getAssetIds.mockResolvedValue(new Set());

      await sut.removeAssets(factory.auth(), memory.id, { ids: ['not-found'] });

      expect(mocks.memory.update).not.toHaveBeenCalled();
    });
  });
});
