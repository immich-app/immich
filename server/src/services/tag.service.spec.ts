import { BadRequestException } from '@nestjs/common';
import { BulkIdErrorReason } from 'src/dtos/asset-ids.response.dto';
import { JobStatus } from 'src/interfaces/job.interface';
import { ITagRepository } from 'src/interfaces/tag.interface';
import { TagService } from 'src/services/tag.service';
import { authStub } from 'test/fixtures/auth.stub';
import { tagResponseStub, tagStub } from 'test/fixtures/tag.stub';
import { IAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(TagService.name, () => {
  let sut: TagService;

  let accessMock: IAccessRepositoryMock;
  let tagMock: Mocked<ITagRepository>;

  beforeEach(() => {
    ({ sut, accessMock, tagMock } = newTestService(TagService));

    accessMock.tag.checkOwnerAccess.mockResolvedValue(new Set(['tag-1']));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all tags for a user', async () => {
      tagMock.getAll.mockResolvedValue([tagStub.tag1]);
      await expect(sut.getAll(authStub.admin)).resolves.toEqual([tagResponseStub.tag1]);
      expect(tagMock.getAll).toHaveBeenCalledWith(authStub.admin.user.id);
    });
  });

  describe('get', () => {
    it('should throw an error for an invalid id', async () => {
      tagMock.get.mockResolvedValue(null);
      await expect(sut.get(authStub.admin, 'tag-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(tagMock.get).toHaveBeenCalledWith('tag-1');
    });

    it('should return a tag for a user', async () => {
      tagMock.get.mockResolvedValue(tagStub.tag1);
      await expect(sut.get(authStub.admin, 'tag-1')).resolves.toEqual(tagResponseStub.tag1);
      expect(tagMock.get).toHaveBeenCalledWith('tag-1');
    });
  });

  describe('create', () => {
    it('should throw an error for no parent tag access', async () => {
      accessMock.tag.checkOwnerAccess.mockResolvedValue(new Set());
      await expect(sut.create(authStub.admin, { name: 'tag', parentId: 'tag-parent' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(tagMock.create).not.toHaveBeenCalled();
    });

    it('should create a tag with a parent', async () => {
      accessMock.tag.checkOwnerAccess.mockResolvedValue(new Set(['tag-parent']));
      tagMock.create.mockResolvedValue(tagStub.tag1);
      tagMock.get.mockResolvedValueOnce(tagStub.parent);
      tagMock.get.mockResolvedValueOnce(tagStub.child);
      await expect(sut.create(authStub.admin, { name: 'tagA', parentId: 'tag-parent' })).resolves.toBeDefined();
      expect(tagMock.create).toHaveBeenCalledWith(expect.objectContaining({ value: 'Parent/tagA' }));
    });

    it('should handle invalid parent ids', async () => {
      accessMock.tag.checkOwnerAccess.mockResolvedValue(new Set(['tag-parent']));
      await expect(sut.create(authStub.admin, { name: 'tagA', parentId: 'tag-parent' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(tagMock.create).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should throw an error for a duplicate tag', async () => {
      tagMock.getByValue.mockResolvedValue(tagStub.tag1);
      await expect(sut.create(authStub.admin, { name: 'tag-1' })).rejects.toBeInstanceOf(BadRequestException);
      expect(tagMock.getByValue).toHaveBeenCalledWith(authStub.admin.user.id, 'tag-1');
      expect(tagMock.create).not.toHaveBeenCalled();
    });

    it('should create a new tag', async () => {
      tagMock.create.mockResolvedValue(tagStub.tag1);
      await expect(sut.create(authStub.admin, { name: 'tag-1' })).resolves.toEqual(tagResponseStub.tag1);
      expect(tagMock.create).toHaveBeenCalledWith({
        userId: authStub.admin.user.id,
        value: 'tag-1',
      });
    });
  });

  describe('update', () => {
    it('should throw an error for no update permission', async () => {
      accessMock.tag.checkOwnerAccess.mockResolvedValue(new Set());
      await expect(sut.update(authStub.admin, 'tag-1', { color: '#000000' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(tagMock.update).not.toHaveBeenCalled();
    });

    it('should update a tag', async () => {
      accessMock.tag.checkOwnerAccess.mockResolvedValue(new Set(['tag-1']));
      tagMock.update.mockResolvedValue(tagStub.color1);
      await expect(sut.update(authStub.admin, 'tag-1', { color: '#000000' })).resolves.toEqual(tagResponseStub.color1);
      expect(tagMock.update).toHaveBeenCalledWith({ id: 'tag-1', color: '#000000' });
    });
  });

  describe('upsert', () => {
    it('should upsert a new tag', async () => {
      tagMock.upsertValue.mockResolvedValue(tagStub.parent);
      await expect(sut.upsert(authStub.admin, { tags: ['Parent'] })).resolves.toBeDefined();
      expect(tagMock.upsertValue).toHaveBeenCalledWith({
        value: 'Parent',
        userId: 'admin_id',
        parentId: undefined,
      });
    });

    it('should upsert a nested tag', async () => {
      tagMock.getByValue.mockResolvedValueOnce(null);
      tagMock.upsertValue.mockResolvedValueOnce(tagStub.parent);
      tagMock.upsertValue.mockResolvedValueOnce(tagStub.child);
      await expect(sut.upsert(authStub.admin, { tags: ['Parent/Child'] })).resolves.toBeDefined();
      expect(tagMock.upsertValue).toHaveBeenNthCalledWith(1, {
        value: 'Parent',
        userId: 'admin_id',
        parent: undefined,
      });
      expect(tagMock.upsertValue).toHaveBeenNthCalledWith(2, {
        value: 'Parent/Child',
        userId: 'admin_id',
        parent: expect.objectContaining({ id: 'tag-parent' }),
      });
    });

    it('should upsert a tag and ignore leading and trailing slashes', async () => {
      tagMock.getByValue.mockResolvedValueOnce(null);
      tagMock.upsertValue.mockResolvedValueOnce(tagStub.parent);
      tagMock.upsertValue.mockResolvedValueOnce(tagStub.child);
      await expect(sut.upsert(authStub.admin, { tags: ['/Parent/Child/'] })).resolves.toBeDefined();
      expect(tagMock.upsertValue).toHaveBeenNthCalledWith(1, {
        value: 'Parent',
        userId: 'admin_id',
        parent: undefined,
      });
      expect(tagMock.upsertValue).toHaveBeenNthCalledWith(2, {
        value: 'Parent/Child',
        userId: 'admin_id',
        parent: expect.objectContaining({ id: 'tag-parent' }),
      });
    });
  });

  describe('remove', () => {
    it('should throw an error for an invalid id', async () => {
      accessMock.tag.checkOwnerAccess.mockResolvedValue(new Set());
      await expect(sut.remove(authStub.admin, 'tag-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(tagMock.delete).not.toHaveBeenCalled();
    });

    it('should remove a tag', async () => {
      tagMock.get.mockResolvedValue(tagStub.tag1);
      await sut.remove(authStub.admin, 'tag-1');
      expect(tagMock.delete).toHaveBeenCalledWith('tag-1');
    });
  });

  describe('bulkTagAssets', () => {
    it('should handle invalid requests', async () => {
      accessMock.tag.checkOwnerAccess.mockResolvedValue(new Set());
      tagMock.upsertAssetIds.mockResolvedValue([]);
      await expect(sut.bulkTagAssets(authStub.admin, { tagIds: ['tag-1'], assetIds: ['asset-1'] })).resolves.toEqual({
        count: 0,
      });
      expect(tagMock.upsertAssetIds).toHaveBeenCalledWith([]);
    });

    it('should upsert records', async () => {
      accessMock.tag.checkOwnerAccess.mockResolvedValue(new Set(['tag-1', 'tag-2']));
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2', 'asset-3']));
      tagMock.upsertAssetIds.mockResolvedValue([
        { tagId: 'tag-1', assetId: 'asset-1' },
        { tagId: 'tag-1', assetId: 'asset-2' },
        { tagId: 'tag-1', assetId: 'asset-3' },
        { tagId: 'tag-2', assetId: 'asset-1' },
        { tagId: 'tag-2', assetId: 'asset-2' },
        { tagId: 'tag-2', assetId: 'asset-3' },
      ]);
      await expect(
        sut.bulkTagAssets(authStub.admin, { tagIds: ['tag-1', 'tag-2'], assetIds: ['asset-1', 'asset-2', 'asset-3'] }),
      ).resolves.toEqual({
        count: 6,
      });
      expect(tagMock.upsertAssetIds).toHaveBeenCalledWith([
        { tagId: 'tag-1', assetId: 'asset-1' },
        { tagId: 'tag-1', assetId: 'asset-2' },
        { tagId: 'tag-1', assetId: 'asset-3' },
        { tagId: 'tag-2', assetId: 'asset-1' },
        { tagId: 'tag-2', assetId: 'asset-2' },
        { tagId: 'tag-2', assetId: 'asset-3' },
      ]);
    });
  });

  describe('addAssets', () => {
    it('should handle invalid ids', async () => {
      tagMock.get.mockResolvedValue(null);
      tagMock.getAssetIds.mockResolvedValue(new Set([]));
      await expect(sut.addAssets(authStub.admin, 'tag-1', { ids: ['asset-1'] })).resolves.toEqual([
        { id: 'asset-1', success: false, error: 'no_permission' },
      ]);
      expect(tagMock.getAssetIds).toHaveBeenCalledWith('tag-1', ['asset-1']);
      expect(tagMock.addAssetIds).not.toHaveBeenCalled();
    });

    it('should accept accept ids that are new and reject the rest', async () => {
      tagMock.get.mockResolvedValue(tagStub.tag1);
      tagMock.getAssetIds.mockResolvedValue(new Set(['asset-1']));
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-2']));

      await expect(
        sut.addAssets(authStub.admin, 'tag-1', {
          ids: ['asset-1', 'asset-2'],
        }),
      ).resolves.toEqual([
        { id: 'asset-1', success: false, error: BulkIdErrorReason.DUPLICATE },
        { id: 'asset-2', success: true },
      ]);

      expect(tagMock.getAssetIds).toHaveBeenCalledWith('tag-1', ['asset-1', 'asset-2']);
      expect(tagMock.addAssetIds).toHaveBeenCalledWith('tag-1', ['asset-2']);
    });
  });

  describe('removeAssets', () => {
    it('should throw an error for an invalid id', async () => {
      tagMock.get.mockResolvedValue(null);
      tagMock.getAssetIds.mockResolvedValue(new Set());
      await expect(sut.removeAssets(authStub.admin, 'tag-1', { ids: ['asset-1'] })).resolves.toEqual([
        { id: 'asset-1', success: false, error: 'not_found' },
      ]);
    });

    it('should accept accept ids that are tagged and reject the rest', async () => {
      tagMock.get.mockResolvedValue(tagStub.tag1);
      tagMock.getAssetIds.mockResolvedValue(new Set(['asset-1']));

      await expect(
        sut.removeAssets(authStub.admin, 'tag-1', {
          ids: ['asset-1', 'asset-2'],
        }),
      ).resolves.toEqual([
        { id: 'asset-1', success: true },
        { id: 'asset-2', success: false, error: BulkIdErrorReason.NOT_FOUND },
      ]);

      expect(tagMock.getAssetIds).toHaveBeenCalledWith('tag-1', ['asset-1', 'asset-2']);
      expect(tagMock.removeAssetIds).toHaveBeenCalledWith('tag-1', ['asset-1']);
    });
  });

  describe('handleTagCleanup', () => {
    it('should delete empty tags', async () => {
      await expect(sut.handleTagCleanup()).resolves.toBe(JobStatus.SUCCESS);
      expect(tagMock.deleteEmptyTags).toHaveBeenCalled();
    });
  });
});
