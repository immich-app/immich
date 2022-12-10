import { ITagRepository, Tag, TagType } from '@app/common';
import { BadRequestException } from '@nestjs/common';
import { TagCreateDto, TagService, TagUpdateDto } from './tag.service';

describe('TagService', () => {
  let sut: TagService;
  let repositoryMock: jest.Mocked<ITagRepository>;

  beforeAll(() => {
    repositoryMock = {
      create: jest.fn(),
      getByName: jest.fn(),
      getById: jest.fn(),
      getByIds: jest.fn(),
      getAll: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
    };

    sut = new TagService(repositoryMock);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should create a tag', async () => {
      const request: TagCreateDto = {
        userId: 'user-1',
        name: 'new-tag',
        type: TagType.OBJECT,
      };

      const response: Tag = {
        id: 'new-tag',
        userId: 'user-1',
        name: 'new-tag',
        type: TagType.OBJECT,
      };

      repositoryMock.create.mockResolvedValue(response);

      await expect(sut.create(request)).resolves.toEqual(response);
      expect(repositoryMock.create).toHaveBeenCalled();
    });

    it('should throw an error for a duplicate tag', async () => {
      const request: TagCreateDto = {
        userId: 'user-1',
        name: 'existing-tag',
        type: TagType.OBJECT,
      };

      const response: Tag = {
        id: 'existing-tag',
        userId: 'user-1',
        name: 'existing-tag',
        type: TagType.OBJECT,
      };

      repositoryMock.getByName.mockResolvedValue(response);

      await expect(sut.create(request)).rejects.toBeInstanceOf(BadRequestException);
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a tag', async () => {
      const request: TagUpdateDto = {
        id: 'tag-1',
        userId: 'user-1',
        name: 'new-name',
        renameTagId: 'new-tag-id',
      };

      const response: Tag = {
        id: 'tag-1',
        type: TagType.OBJECT,
        userId: 'user-1',
        name: 'new-name',
        renameTagId: 'new-tag-id',
      };

      repositoryMock.getById.mockResolvedValue(response);
      repositoryMock.update.mockResolvedValue(response);

      await expect(sut.update(request)).resolves.toEqual(response);
      expect(repositoryMock.getById).toHaveBeenCalled();
      expect(repositoryMock.update).toHaveBeenCalled();
    });

    it('should use existing properties', async () => {
      const request: TagUpdateDto = {
        id: 'tag-1',
        userId: 'user-1',
      };

      const response: Tag = {
        id: 'tag-1',
        type: TagType.OBJECT,
        userId: 'user-1',
        name: 'new-name',
        renameTagId: 'new-tag-id',
      };

      repositoryMock.getById.mockResolvedValue(response);
      repositoryMock.update.mockResolvedValue(response);

      await expect(sut.update(request)).resolves.toEqual(response);
      expect(repositoryMock.getById).toHaveBeenCalled();
      expect(repositoryMock.update).toHaveBeenCalled();
    });

    it('should throw an error when the tag does not exist', async () => {
      const request: TagUpdateDto = {
        id: 'missing-tag',
        userId: 'user-1',
      };

      repositoryMock.getById.mockResolvedValue(null);

      await expect(sut.update(request)).rejects.toBeInstanceOf(BadRequestException);
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should find a tag', async () => {
      const response: Tag = {
        id: 'tag-123',
        type: TagType.CUSTOM,
        name: 'custom',
        userId: 'user-123',
      };

      repositoryMock.getById.mockResolvedValue(response);

      await expect(sut.findOne('user-123', 'tag-123')).resolves.toEqual(response);
      expect(repositoryMock.getById).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should find all the tags for a user', async () => {
      const response: Tag[] = [
        {
          id: 'tag-1',
          type: TagType.CUSTOM,
          name: 'custom',
          userId: 'user-1',
        },
        {
          id: 'tag-2',
          type: TagType.CUSTOM,
          name: 'custom',
          userId: 'user-1',
        },
      ];

      repositoryMock.getAll.mockResolvedValue(response);

      await expect(sut.findAll('user-1')).resolves.toEqual(response);
      expect(repositoryMock.getAll).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a tag', async () => {
      const response: Tag = {
        id: 'tag-1',
        type: TagType.CUSTOM,
        name: 'custom',
        userId: 'user-1',
      };

      repositoryMock.getById.mockResolvedValue(response);

      await sut.remove('user-1', 'tag-1');
      expect(repositoryMock.remove).toHaveBeenCalled();
    });

    it('should throw an error when the tag does not exist', async () => {
      repositoryMock.getById.mockResolvedValue(null);

      await expect(sut.remove('user-1', 'tag-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(repositoryMock.remove).not.toHaveBeenCalled();
    });
  });
});
