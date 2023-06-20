import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  assetEntityStub,
  authStub,
  newJobRepositoryMock,
  newPersonRepositoryMock,
  newStorageRepositoryMock,
  personStub,
} from '@test';
import { IJobRepository, JobName } from '..';
import { IStorageRepository } from '../storage';
import { IPersonRepository } from './person.repository';
import { PersonService } from './person.service';
import { PersonResponseDto } from './response-dto';

const responseDto: PersonResponseDto = {
  id: 'person-1',
  name: 'Person 1',
  thumbnailPath: '/path/to/thumbnail',
};

describe(PersonService.name, () => {
  let sut: PersonService;
  let personMock: jest.Mocked<IPersonRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;
  let jobMock: jest.Mocked<IJobRepository>;

  beforeEach(async () => {
    personMock = newPersonRepositoryMock();
    storageMock = newStorageRepositoryMock();
    jobMock = newJobRepositoryMock();
    sut = new PersonService(personMock, storageMock, jobMock);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('getAll', () => {
    it('should get all people with thumbnails', async () => {
      personMock.getAll.mockResolvedValue([personStub.withName, personStub.noThumbnail]);
      await expect(sut.getAll(authStub.admin)).resolves.toEqual([responseDto]);
      expect(personMock.getAll).toHaveBeenCalledWith(authStub.admin.id, { minimumFaceCount: 1 });
    });
  });

  describe('getById', () => {
    it('should throw a bad request when person is not found', async () => {
      personMock.getById.mockResolvedValue(null);
      await expect(sut.getById(authStub.admin, 'person-1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should get a person by id', async () => {
      personMock.getById.mockResolvedValue(personStub.withName);
      await expect(sut.getById(authStub.admin, 'person-1')).resolves.toEqual(responseDto);
      expect(personMock.getById).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });
  });

  describe('getThumbnail', () => {
    it('should throw an error when personId is invalid', async () => {
      personMock.getById.mockResolvedValue(null);
      await expect(sut.getThumbnail(authStub.admin, 'person-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(storageMock.createReadStream).not.toHaveBeenCalled();
    });

    it('should throw an error when person has no thumbnail', async () => {
      personMock.getById.mockResolvedValue(personStub.noThumbnail);
      await expect(sut.getThumbnail(authStub.admin, 'person-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(storageMock.createReadStream).not.toHaveBeenCalled();
    });

    it('should serve the thumbnail', async () => {
      personMock.getById.mockResolvedValue(personStub.noName);
      await sut.getThumbnail(authStub.admin, 'person-1');
      expect(storageMock.createReadStream).toHaveBeenCalledWith('/path/to/thumbnail', 'image/jpeg');
    });
  });

  describe('getAssets', () => {
    it("should return a person's assets", async () => {
      personMock.getAssets.mockResolvedValue([assetEntityStub.image, assetEntityStub.video]);
      await sut.getAssets(authStub.admin, 'person-1');
      expect(personMock.getAssets).toHaveBeenCalledWith('admin_id', 'person-1');
    });
  });

  describe('update', () => {
    it('should throw an error when personId is invalid', async () => {
      personMock.getById.mockResolvedValue(null);
      await expect(sut.update(authStub.admin, 'person-1', { name: 'Person 1' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(personMock.update).not.toHaveBeenCalled();
    });

    it("should update a person's name", async () => {
      personMock.getById.mockResolvedValue(personStub.noName);
      personMock.update.mockResolvedValue(personStub.withName);
      personMock.getAssets.mockResolvedValue([assetEntityStub.image]);

      await expect(sut.update(authStub.admin, 'person-1', { name: 'Person 1' })).resolves.toEqual(responseDto);

      expect(personMock.getById).toHaveBeenCalledWith('admin_id', 'person-1');
      expect(personMock.update).toHaveBeenCalledWith({ id: 'person-1', name: 'Person 1' });
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.SEARCH_INDEX_ASSET,
        data: { ids: [assetEntityStub.image.id] },
      });
    });
  });

  describe('handlePersonCleanup', () => {
    it('should delete people without faces', async () => {
      personMock.getAllWithoutFaces.mockResolvedValue([personStub.noName]);

      await sut.handlePersonCleanup();

      expect(personMock.delete).toHaveBeenCalledWith(personStub.noName);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_FILES,
        data: { files: ['/path/to/thumbnail'] },
      });
    });
  });
});
