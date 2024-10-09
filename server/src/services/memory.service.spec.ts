import { BadRequestException } from '@nestjs/common';
import { MemoryType } from 'src/enum';
import { IMemoryRepository } from 'src/interfaces/memory.interface';
import { MemoryService } from 'src/services/memory.service';
import { authStub } from 'test/fixtures/auth.stub';
import { memoryStub } from 'test/fixtures/memory.stub';
import { userStub } from 'test/fixtures/user.stub';
import { IAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(MemoryService.name, () => {
  let sut: MemoryService;

  let accessMock: IAccessRepositoryMock;
  let memoryMock: Mocked<IMemoryRepository>;

  beforeEach(() => {
    ({ sut, accessMock, memoryMock } = newTestService(MemoryService));
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('search', () => {
    it('should search memories', async () => {
      memoryMock.search.mockResolvedValue([memoryStub.memory1, memoryStub.empty]);
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
      accessMock.memory.checkOwnerAccess.mockResolvedValue(new Set(['race-condition']));
      await expect(sut.get(authStub.admin, 'race-condition')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should get a memory by id', async () => {
      memoryMock.get.mockResolvedValue(memoryStub.memory1);
      accessMock.memory.checkOwnerAccess.mockResolvedValue(new Set(['memory1']));
      await expect(sut.get(authStub.admin, 'memory1')).resolves.toMatchObject({ id: 'memory1' });
      expect(memoryMock.get).toHaveBeenCalledWith('memory1');
      expect(accessMock.memory.checkOwnerAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['memory1']));
    });
  });

  describe('create', () => {
    it('should skip assets the user does not have access to', async () => {
      memoryMock.create.mockResolvedValue(memoryStub.empty);
      await expect(
        sut.create(authStub.admin, {
          type: MemoryType.ON_THIS_DAY,
          data: { year: 2024 },
          assetIds: ['not-mine'],
          memoryAt: new Date(2024),
        }),
      ).resolves.toMatchObject({ assets: [] });
      expect(memoryMock.create).toHaveBeenCalledWith(expect.objectContaining({ assets: [] }));
    });

    it('should create a memory', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1']));
      memoryMock.create.mockResolvedValue(memoryStub.memory1);
      await expect(
        sut.create(authStub.admin, {
          type: MemoryType.ON_THIS_DAY,
          data: { year: 2024 },
          assetIds: ['asset1'],
          memoryAt: new Date(2024),
        }),
      ).resolves.toBeDefined();
      expect(memoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: userStub.admin.id,
          assets: [{ id: 'asset1' }],
        }),
      );
    });

    it('should create a memory without assets', async () => {
      memoryMock.create.mockResolvedValue(memoryStub.memory1);
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
      expect(memoryMock.update).not.toHaveBeenCalled();
    });

    it('should update a memory', async () => {
      accessMock.memory.checkOwnerAccess.mockResolvedValue(new Set(['memory1']));
      memoryMock.update.mockResolvedValue(memoryStub.memory1);
      await expect(sut.update(authStub.admin, 'memory1', { isSaved: true })).resolves.toBeDefined();
      expect(memoryMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'memory1',
          isSaved: true,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should require access', async () => {
      await expect(sut.remove(authStub.admin, 'not-found')).rejects.toBeInstanceOf(BadRequestException);
      expect(memoryMock.delete).not.toHaveBeenCalled();
    });

    it('should delete a memory', async () => {
      accessMock.memory.checkOwnerAccess.mockResolvedValue(new Set(['memory1']));
      await expect(sut.remove(authStub.admin, 'memory1')).resolves.toBeUndefined();
      expect(memoryMock.delete).toHaveBeenCalledWith('memory1');
    });
  });

  describe('addAssets', () => {
    it('should require memory access', async () => {
      await expect(sut.addAssets(authStub.admin, 'not-found', { ids: ['asset1'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(memoryMock.addAssetIds).not.toHaveBeenCalled();
    });

    it('should require asset access', async () => {
      accessMock.memory.checkOwnerAccess.mockResolvedValue(new Set(['memory1']));
      memoryMock.get.mockResolvedValue(memoryStub.memory1);
      await expect(sut.addAssets(authStub.admin, 'memory1', { ids: ['not-found'] })).resolves.toEqual([
        { error: 'no_permission', id: 'not-found', success: false },
      ]);
      expect(memoryMock.addAssetIds).not.toHaveBeenCalled();
    });

    it('should skip assets already in the memory', async () => {
      accessMock.memory.checkOwnerAccess.mockResolvedValue(new Set(['memory1']));
      memoryMock.get.mockResolvedValue(memoryStub.memory1);
      memoryMock.getAssetIds.mockResolvedValue(new Set(['asset1']));
      await expect(sut.addAssets(authStub.admin, 'memory1', { ids: ['asset1'] })).resolves.toEqual([
        { error: 'duplicate', id: 'asset1', success: false },
      ]);
      expect(memoryMock.addAssetIds).not.toHaveBeenCalled();
    });

    it('should add assets', async () => {
      accessMock.memory.checkOwnerAccess.mockResolvedValue(new Set(['memory1']));
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1']));
      memoryMock.get.mockResolvedValue(memoryStub.memory1);
      await expect(sut.addAssets(authStub.admin, 'memory1', { ids: ['asset1'] })).resolves.toEqual([
        { id: 'asset1', success: true },
      ]);
      expect(memoryMock.addAssetIds).toHaveBeenCalledWith('memory1', ['asset1']);
    });
  });

  describe('removeAssets', () => {
    it('should require memory access', async () => {
      await expect(sut.removeAssets(authStub.admin, 'not-found', { ids: ['asset1'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(memoryMock.removeAssetIds).not.toHaveBeenCalled();
    });

    it('should skip assets not in the memory', async () => {
      accessMock.memory.checkOwnerAccess.mockResolvedValue(new Set(['memory1']));
      await expect(sut.removeAssets(authStub.admin, 'memory1', { ids: ['not-found'] })).resolves.toEqual([
        { error: 'not_found', id: 'not-found', success: false },
      ]);
      expect(memoryMock.removeAssetIds).not.toHaveBeenCalled();
    });

    it('should remove assets', async () => {
      accessMock.memory.checkOwnerAccess.mockResolvedValue(new Set(['memory1']));
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1']));
      memoryMock.getAssetIds.mockResolvedValue(new Set(['asset1']));
      await expect(sut.removeAssets(authStub.admin, 'memory1', { ids: ['asset1'] })).resolves.toEqual([
        { id: 'asset1', success: true },
      ]);
      expect(memoryMock.removeAssetIds).toHaveBeenCalledWith('memory1', ['asset1']);
    });
  });
});
