import { TagType } from '@app/infra/entities';
import { BadRequestException } from '@nestjs/common';
import { authStub, newTagRepositoryMock, tagResponseStub, tagStub } from '../../test';
import { ITagRepository } from './tag.repository';
import { TagService } from './tag.service';

describe(TagService.name, () => {
  let sut: TagService;
  let tagMock: jest.Mocked<ITagRepository>;

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
      expect(tagMock.getAll).toHaveBeenCalledWith(authStub.admin.id);
    });
  });

  describe('getById', () => {
    it('should throw an error for an invalid id', async () => {
      tagMock.getById.mockResolvedValue(null);
      await expect(sut.getById(authStub.admin, 'tag-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(tagMock.getById).toHaveBeenCalledWith(authStub.admin.id, 'tag-1');
    });

    it('should return a tag for a user', async () => {
      tagMock.getById.mockResolvedValue(tagStub.tag1);
      await expect(sut.getById(authStub.admin, 'tag-1')).resolves.toEqual(tagResponseStub.tag1);
      expect(tagMock.getById).toHaveBeenCalledWith(authStub.admin.id, 'tag-1');
    });
  });

  describe('create', () => {
    it('should create a new tag', async () => {
      tagMock.create.mockResolvedValue(tagStub.tag1);
      await expect(sut.create(authStub.admin, { name: 'tag-1', type: TagType.CUSTOM })).resolves.toEqual(
        tagResponseStub.tag1,
      );
      expect(tagMock.create).toHaveBeenCalledWith({
        userId: authStub.admin.id,
        name: 'tag-1',
        type: TagType.CUSTOM,
      });
    });
  });

  describe('update', () => {
    it('should throw an error for an invalid id', async () => {
      tagMock.getById.mockResolvedValue(null);
      await expect(sut.update(authStub.admin, 'tag-1', { name: 'tag-2' })).rejects.toBeInstanceOf(BadRequestException);
      expect(tagMock.getById).toHaveBeenCalledWith(authStub.admin.id, 'tag-1');
      expect(tagMock.remove).not.toHaveBeenCalled();
    });

    it('should update a tag', async () => {
      tagMock.getById.mockResolvedValue(tagStub.tag1);
      tagMock.update.mockResolvedValue(tagStub.tag1);
      await expect(sut.update(authStub.admin, 'tag-1', { name: 'tag-2' })).resolves.toEqual(tagResponseStub.tag1);
      expect(tagMock.getById).toHaveBeenCalledWith(authStub.admin.id, 'tag-1');
      expect(tagMock.update).toHaveBeenCalledWith({ id: 'tag-1', name: 'tag-2' });
    });
  });

  describe('remove', () => {
    it('should throw an error for an invalid id', async () => {
      tagMock.getById.mockResolvedValue(null);
      await expect(sut.remove(authStub.admin, 'tag-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(tagMock.getById).toHaveBeenCalledWith(authStub.admin.id, 'tag-1');
      expect(tagMock.remove).not.toHaveBeenCalled();
    });

    it('should remove a tag', async () => {
      tagMock.getById.mockResolvedValue(tagStub.tag1);
      await sut.remove(authStub.admin, 'tag-1');
      expect(tagMock.getById).toHaveBeenCalledWith(authStub.admin.id, 'tag-1');
      expect(tagMock.remove).toHaveBeenCalledWith(tagStub.tag1);
    });
  });
});
