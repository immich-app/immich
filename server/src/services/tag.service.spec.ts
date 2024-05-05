import { BadRequestException } from '@nestjs/common';
import { AssetIdErrorReason } from 'src/dtos/asset-ids.response.dto';
import { TagType } from 'src/entities/tag.entity';
import { ITagRepository } from 'src/interfaces/tag.interface';
import { TagService } from 'src/services/tag.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { tagResponseStub, tagStub } from 'test/fixtures/tag.stub';
import { newTagRepositoryMock } from 'test/repositories/tag.repository.mock';
import { Mocked } from 'vitest';

describe(TagService.name, () => {
  let sut: TagService;
  let tagMock: Mocked<ITagRepository>;

  beforeEach(() => {
    tagMock = newTagRepositoryMock();
    sut = new TagService(tagMock);
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

  describe('getById', () => {
    it('should throw an error for an invalid id', async () => {
      tagMock.getById.mockResolvedValue(null);
      await expect(sut.getById(authStub.admin, 'tag-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(tagMock.getById).toHaveBeenCalledWith(authStub.admin.user.id, 'tag-1');
    });

    it('should return a tag for a user', async () => {
      tagMock.getById.mockResolvedValue(tagStub.tag1);
      await expect(sut.getById(authStub.admin, 'tag-1')).resolves.toEqual(tagResponseStub.tag1);
      expect(tagMock.getById).toHaveBeenCalledWith(authStub.admin.user.id, 'tag-1');
    });
  });

  describe('create', () => {
    it('should throw an error for a duplicate tag', async () => {
      tagMock.hasName.mockResolvedValue(true);
      await expect(sut.create(authStub.admin, { name: 'tag-1', type: TagType.CUSTOM })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(tagMock.hasName).toHaveBeenCalledWith(authStub.admin.user.id, 'tag-1');
      expect(tagMock.create).not.toHaveBeenCalled();
    });

    it('should create a new tag', async () => {
      tagMock.create.mockResolvedValue(tagStub.tag1);
      await expect(sut.create(authStub.admin, { name: 'tag-1', type: TagType.CUSTOM })).resolves.toEqual(
        tagResponseStub.tag1,
      );
      expect(tagMock.create).toHaveBeenCalledWith({
        userId: authStub.admin.user.id,
        name: 'tag-1',
        type: TagType.CUSTOM,
      });
    });
  });

  describe('update', () => {
    it('should throw an error for an invalid id', async () => {
      tagMock.getById.mockResolvedValue(null);
      await expect(sut.update(authStub.admin, 'tag-1', { name: 'tag-2' })).rejects.toBeInstanceOf(BadRequestException);
      expect(tagMock.getById).toHaveBeenCalledWith(authStub.admin.user.id, 'tag-1');
      expect(tagMock.remove).not.toHaveBeenCalled();
    });

    it('should update a tag', async () => {
      tagMock.getById.mockResolvedValue(tagStub.tag1);
      tagMock.update.mockResolvedValue(tagStub.tag1);
      await expect(sut.update(authStub.admin, 'tag-1', { name: 'tag-2' })).resolves.toEqual(tagResponseStub.tag1);
      expect(tagMock.getById).toHaveBeenCalledWith(authStub.admin.user.id, 'tag-1');
      expect(tagMock.update).toHaveBeenCalledWith({ id: 'tag-1', name: 'tag-2' });
    });
  });

  describe('remove', () => {
    it('should throw an error for an invalid id', async () => {
      tagMock.getById.mockResolvedValue(null);
      await expect(sut.remove(authStub.admin, 'tag-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(tagMock.getById).toHaveBeenCalledWith(authStub.admin.user.id, 'tag-1');
      expect(tagMock.remove).not.toHaveBeenCalled();
    });

    it('should remove a tag', async () => {
      tagMock.getById.mockResolvedValue(tagStub.tag1);
      await sut.remove(authStub.admin, 'tag-1');
      expect(tagMock.getById).toHaveBeenCalledWith(authStub.admin.user.id, 'tag-1');
      expect(tagMock.remove).toHaveBeenCalledWith(tagStub.tag1);
    });
  });

  describe('getAssets', () => {
    it('should throw an error for an invalid id', async () => {
      tagMock.getById.mockResolvedValue(null);
      await expect(sut.remove(authStub.admin, 'tag-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(tagMock.getById).toHaveBeenCalledWith(authStub.admin.user.id, 'tag-1');
      expect(tagMock.remove).not.toHaveBeenCalled();
    });

    it('should get the assets for a tag', async () => {
      tagMock.getById.mockResolvedValue(tagStub.tag1);
      tagMock.getAssets.mockResolvedValue([assetStub.image]);
      await sut.getAssets(authStub.admin, 'tag-1');
      expect(tagMock.getById).toHaveBeenCalledWith(authStub.admin.user.id, 'tag-1');
      expect(tagMock.getAssets).toHaveBeenCalledWith(authStub.admin.user.id, 'tag-1');
    });
  });

  describe('addAssets', () => {
    it('should throw an error for an invalid id', async () => {
      tagMock.getById.mockResolvedValue(null);
      await expect(sut.addAssets(authStub.admin, 'tag-1', { assetIds: ['asset-1'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(tagMock.getById).toHaveBeenCalledWith(authStub.admin.user.id, 'tag-1');
      expect(tagMock.addAssets).not.toHaveBeenCalled();
    });

    it('should reject duplicate asset ids and accept new ones', async () => {
      tagMock.getById.mockResolvedValue(tagStub.tag1);
      tagMock.hasAsset.mockImplementation((userId, tagId, assetId) => Promise.resolve(assetId === 'asset-1'));

      await expect(
        sut.addAssets(authStub.admin, 'tag-1', {
          assetIds: ['asset-1', 'asset-2'],
        }),
      ).resolves.toEqual([
        { assetId: 'asset-1', success: false, error: AssetIdErrorReason.DUPLICATE },
        { assetId: 'asset-2', success: true },
      ]);

      expect(tagMock.getById).toHaveBeenCalledWith(authStub.admin.user.id, 'tag-1');
      expect(tagMock.hasAsset).toHaveBeenCalledTimes(2);
      expect(tagMock.addAssets).toHaveBeenCalledWith(authStub.admin.user.id, 'tag-1', ['asset-2']);
    });
  });

  describe('removeAssets', () => {
    it('should throw an error for an invalid id', async () => {
      tagMock.getById.mockResolvedValue(null);
      await expect(sut.removeAssets(authStub.admin, 'tag-1', { assetIds: ['asset-1'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(tagMock.getById).toHaveBeenCalledWith(authStub.admin.user.id, 'tag-1');
      expect(tagMock.removeAssets).not.toHaveBeenCalled();
    });

    it('should accept accept ids that are tagged and reject the rest', async () => {
      tagMock.getById.mockResolvedValue(tagStub.tag1);
      tagMock.hasAsset.mockImplementation((userId, tagId, assetId) => Promise.resolve(assetId === 'asset-1'));

      await expect(
        sut.removeAssets(authStub.admin, 'tag-1', {
          assetIds: ['asset-1', 'asset-2'],
        }),
      ).resolves.toEqual([
        { assetId: 'asset-1', success: true },
        { assetId: 'asset-2', success: false, error: AssetIdErrorReason.NOT_FOUND },
      ]);

      expect(tagMock.getById).toHaveBeenCalledWith(authStub.admin.user.id, 'tag-1');
      expect(tagMock.hasAsset).toHaveBeenCalledTimes(2);
      expect(tagMock.removeAssets).toHaveBeenCalledWith(authStub.admin.user.id, 'tag-1', ['asset-1']);
    });
  });
});
