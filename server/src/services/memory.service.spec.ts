import { BadRequestException } from '@nestjs/common';
import { MemoryType } from 'src/enum';
import { MemoryService } from 'src/services/memory.service';
import { authStub } from 'test/fixtures/auth.stub';
import { memoryStub } from 'test/fixtures/memory.stub';
import { userStub } from 'test/fixtures/user.stub';
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

  describe('search', () => {
    it('should search memories', async () => {
      mocks.memory.search.mockResolvedValue([memoryStub.memory1, memoryStub.empty]);
      await expect(sut.search(authStub.admin)).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'memory1', assets: expect.any(Array) }),
          expect.objectContaining({ id: 'memoryEmpty', assets: [] }),
        ]),
      );
    });

    it('should map ', async () => {
      await expect(sut.search(authStub.admin)).resolves.toEqual([]);
    });
  });

  describe('get', () => {
    it('should throw an error when no access', async () => {
      await expect(sut.get(authStub.admin, 'not-found')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw an error when the memory is not found', async () => {
      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set(['race-condition']));
      await expect(sut.get(authStub.admin, 'race-condition')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should get a memory by id', async () => {
      mocks.memory.get.mockResolvedValue(memoryStub.memory1);
      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set(['memory1']));
      await expect(sut.get(authStub.admin, 'memory1')).resolves.toMatchObject({ id: 'memory1' });
      expect(mocks.memory.get).toHaveBeenCalledWith('memory1');
      expect(mocks.access.memory.checkOwnerAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['memory1']));
    });
  });

  describe('create', () => {
    it('should skip assets the user does not have access to', async () => {
      mocks.memory.create.mockResolvedValue(memoryStub.empty);
      await expect(
        sut.create(authStub.admin, {
          type: MemoryType.ON_THIS_DAY,
          data: { year: 2024 },
          assetIds: ['not-mine'],
          memoryAt: new Date(2024),
        }),
      ).resolves.toMatchObject({ assets: [] });
      expect(mocks.memory.create).toHaveBeenCalledWith(
        {
          ownerId: 'admin_id',
          memoryAt: expect.any(Date),
          type: MemoryType.ON_THIS_DAY,
          isSaved: undefined,
          sendAt: undefined,
          data: { year: 2024 },
        },
        new Set(),
      );
    });

    it('should create a memory', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1']));
      mocks.memory.create.mockResolvedValue(memoryStub.memory1);
      await expect(
        sut.create(authStub.admin, {
          type: MemoryType.ON_THIS_DAY,
          data: { year: 2024 },
          assetIds: ['asset1'],
          memoryAt: new Date(2024, 0, 1),
        }),
      ).resolves.toBeDefined();
      expect(mocks.memory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: userStub.admin.id,
        }),
        new Set(['asset1']),
      );
    });

    it('should create a memory without assets', async () => {
      mocks.memory.create.mockResolvedValue(memoryStub.memory1);
      await expect(
        sut.create(authStub.admin, {
          type: MemoryType.ON_THIS_DAY,
          data: { year: 2024 },
          memoryAt: new Date(2024),
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('update', () => {
    it('should require access', async () => {
      await expect(sut.update(authStub.admin, 'not-found', { isSaved: true })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mocks.memory.update).not.toHaveBeenCalled();
    });

    it('should update a memory', async () => {
      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set(['memory1']));
      mocks.memory.update.mockResolvedValue(memoryStub.memory1);
      await expect(sut.update(authStub.admin, 'memory1', { isSaved: true })).resolves.toBeDefined();
      expect(mocks.memory.update).toHaveBeenCalledWith('memory1', expect.objectContaining({ isSaved: true }));
    });
  });

  describe('remove', () => {
    it('should require access', async () => {
      await expect(sut.remove(authStub.admin, 'not-found')).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.memory.delete).not.toHaveBeenCalled();
    });

    it('should delete a memory', async () => {
      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set(['memory1']));
      await expect(sut.remove(authStub.admin, 'memory1')).resolves.toBeUndefined();
      expect(mocks.memory.delete).toHaveBeenCalledWith('memory1');
    });
  });

  describe('addAssets', () => {
    it('should require memory access', async () => {
      await expect(sut.addAssets(authStub.admin, 'not-found', { ids: ['asset1'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mocks.memory.addAssetIds).not.toHaveBeenCalled();
    });

    it('should require asset access', async () => {
      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set(['memory1']));
      mocks.memory.get.mockResolvedValue(memoryStub.memory1);
      await expect(sut.addAssets(authStub.admin, 'memory1', { ids: ['not-found'] })).resolves.toEqual([
        { error: 'no_permission', id: 'not-found', success: false },
      ]);
      expect(mocks.memory.addAssetIds).not.toHaveBeenCalled();
    });

    it('should skip assets already in the memory', async () => {
      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set(['memory1']));
      mocks.memory.get.mockResolvedValue(memoryStub.memory1);
      mocks.memory.getAssetIds.mockResolvedValue(new Set(['asset1']));
      await expect(sut.addAssets(authStub.admin, 'memory1', { ids: ['asset1'] })).resolves.toEqual([
        { error: 'duplicate', id: 'asset1', success: false },
      ]);
      expect(mocks.memory.addAssetIds).not.toHaveBeenCalled();
    });

    it('should add assets', async () => {
      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set(['memory1']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1']));
      mocks.memory.get.mockResolvedValue(memoryStub.memory1);
      await expect(sut.addAssets(authStub.admin, 'memory1', { ids: ['asset1'] })).resolves.toEqual([
        { id: 'asset1', success: true },
      ]);
      expect(mocks.memory.addAssetIds).toHaveBeenCalledWith('memory1', ['asset1']);
    });
  });

  describe('removeAssets', () => {
    it('should require memory access', async () => {
      await expect(sut.removeAssets(authStub.admin, 'not-found', { ids: ['asset1'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mocks.memory.removeAssetIds).not.toHaveBeenCalled();
    });

    it('should skip assets not in the memory', async () => {
      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set(['memory1']));
      await expect(sut.removeAssets(authStub.admin, 'memory1', { ids: ['not-found'] })).resolves.toEqual([
        { error: 'not_found', id: 'not-found', success: false },
      ]);
      expect(mocks.memory.removeAssetIds).not.toHaveBeenCalled();
    });

    it('should remove assets', async () => {
      mocks.access.memory.checkOwnerAccess.mockResolvedValue(new Set(['memory1']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1']));
      mocks.memory.getAssetIds.mockResolvedValue(new Set(['asset1']));
      await expect(sut.removeAssets(authStub.admin, 'memory1', { ids: ['asset1'] })).resolves.toEqual([
        { id: 'asset1', success: true },
      ]);
      expect(mocks.memory.removeAssetIds).toHaveBeenCalledWith('memory1', ['asset1']);
    });
  });
});
