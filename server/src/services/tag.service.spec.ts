import { BadRequestException } from '@nestjs/common';
import { BulkIdErrorReason } from 'src/dtos/asset-ids.response.dto';
import { JobStatus } from 'src/enum';
import { TagService } from 'src/services/tag.service';
import { authStub } from 'test/fixtures/auth.stub';
import { tagResponseStub, tagStub } from 'test/fixtures/tag.stub';
import { newTestService, ServiceMocks } from 'test/utils';

describe(TagService.name, () => {
  let sut: TagService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(TagService));

    mocks.access.tag.checkOwnerAccess.mockResolvedValue(new Set(['tag-1']));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all tags for a user', async () => {
      mocks.tag.getAll.mockResolvedValue([tagStub.tag]);
      await expect(sut.getAll(authStub.admin)).resolves.toEqual([tagResponseStub.tag1]);
      expect(mocks.tag.getAll).toHaveBeenCalledWith(authStub.admin.user.id);
    });
  });

  describe('get', () => {
    it('should throw an error for an invalid id', async () => {
      await expect(sut.get(authStub.admin, 'tag-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.tag.get).toHaveBeenCalledWith('tag-1');
    });

    it('should return a tag for a user', async () => {
      mocks.tag.get.mockResolvedValue(tagStub.tag);
      await expect(sut.get(authStub.admin, 'tag-1')).resolves.toEqual(tagResponseStub.tag1);
      expect(mocks.tag.get).toHaveBeenCalledWith('tag-1');
    });
  });

  describe('create', () => {
    it('should throw an error for no parent tag access', async () => {
      mocks.access.tag.checkOwnerAccess.mockResolvedValue(new Set());
      await expect(sut.create(authStub.admin, { name: 'tag', parentId: 'tag-parent' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mocks.tag.create).not.toHaveBeenCalled();
    });

    it('should create a tag with a parent', async () => {
      mocks.access.tag.checkOwnerAccess.mockResolvedValue(new Set(['tag-parent']));
      mocks.tag.create.mockResolvedValue(tagStub.tagCreate);
      mocks.tag.get.mockResolvedValueOnce(tagStub.parentUpsert);
      mocks.tag.get.mockResolvedValueOnce(tagStub.childUpsert);
      await expect(sut.create(authStub.admin, { name: 'tagA', parentId: 'tag-parent' })).resolves.toBeDefined();
      expect(mocks.tag.create).toHaveBeenCalledWith(expect.objectContaining({ value: 'Parent/tagA' }));
    });

    it('should handle invalid parent ids', async () => {
      mocks.access.tag.checkOwnerAccess.mockResolvedValue(new Set(['tag-parent']));
      await expect(sut.create(authStub.admin, { name: 'tagA', parentId: 'tag-parent' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mocks.tag.create).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should throw an error for a duplicate tag', async () => {
      mocks.tag.getByValue.mockResolvedValue(tagStub.tag);
      await expect(sut.create(authStub.admin, { name: 'tag-1' })).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.tag.getByValue).toHaveBeenCalledWith(authStub.admin.user.id, 'tag-1');
      expect(mocks.tag.create).not.toHaveBeenCalled();
    });

    it('should create a new tag', async () => {
      mocks.tag.create.mockResolvedValue(tagStub.tagCreate);
      await expect(sut.create(authStub.admin, { name: 'tag-1' })).resolves.toEqual(tagResponseStub.tag1);
      expect(mocks.tag.create).toHaveBeenCalledWith({
        userId: authStub.admin.user.id,
        value: 'tag-1',
      });
    });

    it('should create a new tag with optional color', async () => {
      mocks.tag.create.mockResolvedValue(tagStub.colorCreate);
      mocks.tag.getByValue.mockResolvedValue(void 0);

      await expect(sut.create(authStub.admin, { name: 'tag-1', color: '#000000' })).resolves.toEqual(
        tagResponseStub.color1,
      );

      expect(mocks.tag.create).toHaveBeenCalledWith({
        userId: authStub.admin.user.id,
        value: 'tag-1',
        color: '#000000',
      });
    });
  });

  describe('update', () => {
    it('should throw an error for no update permission', async () => {
      mocks.access.tag.checkOwnerAccess.mockResolvedValue(new Set());
      await expect(sut.update(authStub.admin, 'tag-1', { color: '#000000' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mocks.tag.update).not.toHaveBeenCalled();
    });

    it('should update a tag', async () => {
      mocks.access.tag.checkOwnerAccess.mockResolvedValue(new Set(['tag-1']));
      mocks.tag.update.mockResolvedValue(tagStub.colorCreate);
      await expect(sut.update(authStub.admin, 'tag-1', { color: '#000000' })).resolves.toEqual(tagResponseStub.color1);
      expect(mocks.tag.update).toHaveBeenCalledWith('tag-1', { color: '#000000' });
    });
  });

  describe('upsert', () => {
    it('should upsert a new tag', async () => {
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);
      await expect(sut.upsert(authStub.admin, { tags: ['Parent'] })).resolves.toBeDefined();
      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({
        value: 'Parent',
        userId: 'admin_id',
        parentId: undefined,
      });
    });

    it('should upsert a nested tag', async () => {
      mocks.tag.upsertValue.mockResolvedValueOnce(tagStub.parentUpsert);
      mocks.tag.upsertValue.mockResolvedValueOnce(tagStub.childUpsert);
      await expect(sut.upsert(authStub.admin, { tags: ['Parent/Child'] })).resolves.toBeDefined();
      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(1, {
        value: 'Parent',
        userId: 'admin_id',
        parentId: undefined,
      });
      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(2, {
        value: 'Parent/Child',
        userId: 'admin_id',
        parentId: 'tag-parent',
      });
    });

    it('should upsert a tag and ignore leading and trailing slashes', async () => {
      mocks.tag.upsertValue.mockResolvedValueOnce(tagStub.parentUpsert);
      mocks.tag.upsertValue.mockResolvedValueOnce(tagStub.childUpsert);
      await expect(sut.upsert(authStub.admin, { tags: ['/Parent/Child/'] })).resolves.toBeDefined();
      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(1, {
        value: 'Parent',
        userId: 'admin_id',
        parentId: undefined,
      });
      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(2, {
        value: 'Parent/Child',
        userId: 'admin_id',
        parentId: 'tag-parent',
      });
    });
  });

  describe('remove', () => {
    it('should throw an error for an invalid id', async () => {
      mocks.access.tag.checkOwnerAccess.mockResolvedValue(new Set());
      await expect(sut.remove(authStub.admin, 'tag-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.tag.delete).not.toHaveBeenCalled();
    });

    it('should remove a tag', async () => {
      mocks.tag.get.mockResolvedValue(tagStub.tag);
      mocks.tag.delete.mockResolvedValue();

      await sut.remove(authStub.admin, 'tag-1');
      expect(mocks.tag.delete).toHaveBeenCalledWith('tag-1');
    });
  });

  describe('bulkTagAssets', () => {
    it('should handle invalid requests', async () => {
      mocks.access.tag.checkOwnerAccess.mockResolvedValue(new Set());
      mocks.tag.upsertAssetIds.mockResolvedValue([]);
      await expect(sut.bulkTagAssets(authStub.admin, { tagIds: ['tag-1'], assetIds: ['asset-1'] })).resolves.toEqual({
        count: 0,
      });
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledWith([]);
    });

    it('should upsert records', async () => {
      mocks.access.tag.checkOwnerAccess.mockResolvedValue(new Set(['tag-1', 'tag-2']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2', 'asset-3']));
      mocks.tag.upsertAssetIds.mockResolvedValue([
        { tagsId: 'tag-1', assetsId: 'asset-1' },
        { tagsId: 'tag-1', assetsId: 'asset-2' },
        { tagsId: 'tag-1', assetsId: 'asset-3' },
        { tagsId: 'tag-2', assetsId: 'asset-1' },
        { tagsId: 'tag-2', assetsId: 'asset-2' },
        { tagsId: 'tag-2', assetsId: 'asset-3' },
      ]);
      await expect(
        sut.bulkTagAssets(authStub.admin, { tagIds: ['tag-1', 'tag-2'], assetIds: ['asset-1', 'asset-2', 'asset-3'] }),
      ).resolves.toEqual({
        count: 6,
      });
      expect(mocks.tag.upsertAssetIds).toHaveBeenCalledWith([
        { tagsId: 'tag-1', assetsId: 'asset-1' },
        { tagsId: 'tag-1', assetsId: 'asset-2' },
        { tagsId: 'tag-1', assetsId: 'asset-3' },
        { tagsId: 'tag-2', assetsId: 'asset-1' },
        { tagsId: 'tag-2', assetsId: 'asset-2' },
        { tagsId: 'tag-2', assetsId: 'asset-3' },
      ]);
    });
  });

  describe('addAssets', () => {
    it('should handle invalid ids', async () => {
      mocks.tag.getAssetIds.mockResolvedValue(new Set([]));
      await expect(sut.addAssets(authStub.admin, 'tag-1', { ids: ['asset-1'] })).resolves.toEqual([
        { id: 'asset-1', success: false, error: 'no_permission' },
      ]);
      expect(mocks.tag.getAssetIds).toHaveBeenCalledWith('tag-1', ['asset-1']);
      expect(mocks.tag.addAssetIds).not.toHaveBeenCalled();
    });

    it('should accept accept ids that are new and reject the rest', async () => {
      mocks.tag.get.mockResolvedValue(tagStub.tag);
      mocks.tag.getAssetIds.mockResolvedValue(new Set(['asset-1']));
      mocks.tag.addAssetIds.mockResolvedValue();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-2']));

      await expect(
        sut.addAssets(authStub.admin, 'tag-1', {
          ids: ['asset-1', 'asset-2'],
        }),
      ).resolves.toEqual([
        { id: 'asset-1', success: false, error: BulkIdErrorReason.DUPLICATE },
        { id: 'asset-2', success: true },
      ]);

      expect(mocks.tag.getAssetIds).toHaveBeenCalledWith('tag-1', ['asset-1', 'asset-2']);
      expect(mocks.tag.addAssetIds).toHaveBeenCalledWith('tag-1', ['asset-2']);
    });
  });

  describe('removeAssets', () => {
    it('should throw an error for an invalid id', async () => {
      mocks.tag.getAssetIds.mockResolvedValue(new Set());
      mocks.tag.removeAssetIds.mockResolvedValue();

      await expect(sut.removeAssets(authStub.admin, 'tag-1', { ids: ['asset-1'] })).resolves.toEqual([
        { id: 'asset-1', success: false, error: 'not_found' },
      ]);
    });

    it('should accept accept ids that are tagged and reject the rest', async () => {
      mocks.tag.get.mockResolvedValue(tagStub.tag);
      mocks.tag.getAssetIds.mockResolvedValue(new Set(['asset-1']));
      mocks.tag.removeAssetIds.mockResolvedValue();

      await expect(
        sut.removeAssets(authStub.admin, 'tag-1', {
          ids: ['asset-1', 'asset-2'],
        }),
      ).resolves.toEqual([
        { id: 'asset-1', success: true },
        { id: 'asset-2', success: false, error: BulkIdErrorReason.NOT_FOUND },
      ]);

      expect(mocks.tag.getAssetIds).toHaveBeenCalledWith('tag-1', ['asset-1', 'asset-2']);
      expect(mocks.tag.removeAssetIds).toHaveBeenCalledWith('tag-1', ['asset-1']);
    });
  });

  describe('handleTagCleanup', () => {
    it('should delete empty tags', async () => {
      mocks.tag.deleteEmptyTags.mockResolvedValue();

      await expect(sut.handleTagCleanup()).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.tag.deleteEmptyTags).toHaveBeenCalled();
    });
  });
});
