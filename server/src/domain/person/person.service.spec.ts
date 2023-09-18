import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  IAccessRepositoryMock,
  assetStub,
  authStub,
  faceStub,
  newAccessRepositoryMock,
  newJobRepositoryMock,
  newPersonRepositoryMock,
  newStorageRepositoryMock,
  newSystemConfigRepositoryMock,
  personStub,
} from '@test';
import { BulkIdErrorReason } from '../asset';
import { IJobRepository, JobName } from '../job';
import { IStorageRepository } from '../storage';
import { ISystemConfigRepository } from '../system-config';
import { PersonResponseDto } from './person.dto';
import { IPersonRepository } from './person.repository';
import { PersonService } from './person.service';

const responseDto: PersonResponseDto = {
  id: 'person-1',
  name: 'Person 1',
  birthDate: null,
  thumbnailPath: '/path/to/thumbnail.jpg',
  isHidden: false,
};

describe(PersonService.name, () => {
  let accessMock: IAccessRepositoryMock;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let personMock: jest.Mocked<IPersonRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;
  let sut: PersonService;

  beforeEach(async () => {
    accessMock = newAccessRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    jobMock = newJobRepositoryMock();
    personMock = newPersonRepositoryMock();
    storageMock = newStorageRepositoryMock();
    sut = new PersonService(accessMock, personMock, configMock, storageMock, jobMock);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('getAll', () => {
    it('should get all people with thumbnails', async () => {
      personMock.getAllForUser.mockResolvedValue([personStub.withName, personStub.noThumbnail]);
      await expect(sut.getAll(authStub.admin, { withHidden: undefined })).resolves.toEqual({
        total: 1,
        visible: 1,
        people: [responseDto],
      });
      expect(personMock.getAllForUser).toHaveBeenCalledWith(authStub.admin.id, {
        minimumFaceCount: 1,
        withHidden: false,
      });
    });
    it('should get all visible people with thumbnails', async () => {
      personMock.getAllForUser.mockResolvedValue([personStub.withName, personStub.hidden]);
      await expect(sut.getAll(authStub.admin, { withHidden: false })).resolves.toEqual({
        total: 2,
        visible: 1,
        people: [responseDto],
      });
      expect(personMock.getAllForUser).toHaveBeenCalledWith(authStub.admin.id, {
        minimumFaceCount: 1,
        withHidden: false,
      });
    });
    it('should get all hidden and visible people with thumbnails', async () => {
      personMock.getAllForUser.mockResolvedValue([personStub.withName, personStub.hidden]);
      await expect(sut.getAll(authStub.admin, { withHidden: true })).resolves.toEqual({
        total: 2,
        visible: 1,
        people: [
          responseDto,
          {
            id: 'person-1',
            name: '',
            birthDate: null,
            thumbnailPath: '/path/to/thumbnail.jpg',
            isHidden: true,
          },
        ],
      });
      expect(personMock.getAllForUser).toHaveBeenCalledWith(authStub.admin.id, {
        minimumFaceCount: 1,
        withHidden: true,
      });
    });
  });

  describe('getById', () => {
    it('should require person.read permission', async () => {
      personMock.getById.mockResolvedValue(personStub.withName);
      accessMock.person.hasOwnerAccess.mockResolvedValue(false);
      await expect(sut.getById(authStub.admin, 'person-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });

    it('should throw a bad request when person is not found', async () => {
      personMock.getById.mockResolvedValue(null);
      accessMock.person.hasOwnerAccess.mockResolvedValue(true);
      await expect(sut.getById(authStub.admin, 'person-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });

    it('should get a person by id', async () => {
      personMock.getById.mockResolvedValue(personStub.withName);
      accessMock.person.hasOwnerAccess.mockResolvedValue(true);
      await expect(sut.getById(authStub.admin, 'person-1')).resolves.toEqual(responseDto);
      expect(personMock.getById).toHaveBeenCalledWith('person-1');
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });
  });

  describe('getThumbnail', () => {
    it('should require person.read permission', async () => {
      personMock.getById.mockResolvedValue(personStub.noName);
      accessMock.person.hasOwnerAccess.mockResolvedValue(false);
      await expect(sut.getThumbnail(authStub.admin, 'person-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(storageMock.createReadStream).not.toHaveBeenCalled();
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });

    it('should throw an error when personId is invalid', async () => {
      personMock.getById.mockResolvedValue(null);
      accessMock.person.hasOwnerAccess.mockResolvedValue(true);
      await expect(sut.getThumbnail(authStub.admin, 'person-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(storageMock.createReadStream).not.toHaveBeenCalled();
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });

    it('should throw an error when person has no thumbnail', async () => {
      personMock.getById.mockResolvedValue(personStub.noThumbnail);
      accessMock.person.hasOwnerAccess.mockResolvedValue(true);
      await expect(sut.getThumbnail(authStub.admin, 'person-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(storageMock.createReadStream).not.toHaveBeenCalled();
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });

    it('should serve the thumbnail', async () => {
      personMock.getById.mockResolvedValue(personStub.noName);
      accessMock.person.hasOwnerAccess.mockResolvedValue(true);
      await sut.getThumbnail(authStub.admin, 'person-1');
      expect(storageMock.createReadStream).toHaveBeenCalledWith('/path/to/thumbnail.jpg', 'image/jpeg');
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });
  });

  describe('getAssets', () => {
    it('should require person.read permission', async () => {
      personMock.getAssets.mockResolvedValue([assetStub.image, assetStub.video]);
      accessMock.person.hasOwnerAccess.mockResolvedValue(false);
      await expect(sut.getAssets(authStub.admin, 'person-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(personMock.getAssets).not.toHaveBeenCalled();
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });

    it("should return a person's assets", async () => {
      personMock.getAssets.mockResolvedValue([assetStub.image, assetStub.video]);
      accessMock.person.hasOwnerAccess.mockResolvedValue(true);
      await sut.getAssets(authStub.admin, 'person-1');
      expect(personMock.getAssets).toHaveBeenCalledWith('person-1');
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });
  });

  describe('update', () => {
    it('should require person.write permission', async () => {
      personMock.getById.mockResolvedValue(personStub.noName);
      accessMock.person.hasOwnerAccess.mockResolvedValue(false);
      await expect(sut.update(authStub.admin, 'person-1', { name: 'Person 1' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(personMock.update).not.toHaveBeenCalled();
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });

    it('should throw an error when personId is invalid', async () => {
      personMock.getById.mockResolvedValue(null);
      accessMock.person.hasOwnerAccess.mockResolvedValue(true);
      await expect(sut.update(authStub.admin, 'person-1', { name: 'Person 1' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(personMock.update).not.toHaveBeenCalled();
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });

    it("should update a person's name", async () => {
      personMock.getById.mockResolvedValue(personStub.noName);
      personMock.update.mockResolvedValue(personStub.withName);
      personMock.getAssets.mockResolvedValue([assetStub.image]);
      accessMock.person.hasOwnerAccess.mockResolvedValue(true);

      await expect(sut.update(authStub.admin, 'person-1', { name: 'Person 1' })).resolves.toEqual(responseDto);

      expect(personMock.getById).toHaveBeenCalledWith('person-1');
      expect(personMock.update).toHaveBeenCalledWith({ id: 'person-1', name: 'Person 1' });
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.SEARCH_INDEX_ASSET,
        data: { ids: [assetStub.image.id] },
      });
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });

    it("should update a person's date of birth", async () => {
      personMock.getById.mockResolvedValue(personStub.noBirthDate);
      personMock.update.mockResolvedValue(personStub.withBirthDate);
      personMock.getAssets.mockResolvedValue([assetStub.image]);
      accessMock.person.hasOwnerAccess.mockResolvedValue(true);

      await expect(sut.update(authStub.admin, 'person-1', { birthDate: new Date('1976-06-30') })).resolves.toEqual({
        id: 'person-1',
        name: 'Person 1',
        birthDate: new Date('1976-06-30'),
        thumbnailPath: '/path/to/thumbnail.jpg',
        isHidden: false,
      });

      expect(personMock.getById).toHaveBeenCalledWith('person-1');
      expect(personMock.update).toHaveBeenCalledWith({ id: 'person-1', birthDate: new Date('1976-06-30') });
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });

    it('should update a person visibility', async () => {
      personMock.getById.mockResolvedValue(personStub.hidden);
      personMock.update.mockResolvedValue(personStub.withName);
      personMock.getAssets.mockResolvedValue([assetStub.image]);
      accessMock.person.hasOwnerAccess.mockResolvedValue(true);

      await expect(sut.update(authStub.admin, 'person-1', { isHidden: false })).resolves.toEqual(responseDto);

      expect(personMock.getById).toHaveBeenCalledWith('person-1');
      expect(personMock.update).toHaveBeenCalledWith({ id: 'person-1', isHidden: false });
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.SEARCH_INDEX_ASSET,
        data: { ids: [assetStub.image.id] },
      });
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });

    it("should update a person's thumbnailPath", async () => {
      personMock.getById.mockResolvedValue(personStub.withName);
      personMock.getFaceById.mockResolvedValue(faceStub.face1);
      accessMock.person.hasOwnerAccess.mockResolvedValue(true);

      await expect(
        sut.update(authStub.admin, 'person-1', { featureFaceAssetId: faceStub.face1.assetId }),
      ).resolves.toEqual(responseDto);

      expect(personMock.getById).toHaveBeenCalledWith('person-1');
      expect(personMock.getFaceById).toHaveBeenCalledWith({
        assetId: faceStub.face1.assetId,
        personId: 'person-1',
      });
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.GENERATE_FACE_THUMBNAIL,
        data: {
          assetId: faceStub.face1.assetId,
          personId: 'person-1',
          boundingBox: {
            x1: faceStub.face1.boundingBoxX1,
            x2: faceStub.face1.boundingBoxX2,
            y1: faceStub.face1.boundingBoxY1,
            y2: faceStub.face1.boundingBoxY2,
          },
          imageHeight: faceStub.face1.imageHeight,
          imageWidth: faceStub.face1.imageWidth,
        },
      });
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });

    it('should throw an error when the face feature assetId is invalid', async () => {
      personMock.getById.mockResolvedValue(personStub.withName);
      accessMock.person.hasOwnerAccess.mockResolvedValue(true);

      await expect(sut.update(authStub.admin, 'person-1', { featureFaceAssetId: '-1' })).rejects.toThrow(
        BadRequestException,
      );
      expect(personMock.update).not.toHaveBeenCalled();
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });
  });

  describe('updateAll', () => {
    it('should throw an error when personId is invalid', async () => {
      personMock.getById.mockResolvedValue(null);
      accessMock.person.hasOwnerAccess.mockResolvedValue(true);

      await expect(
        sut.updatePeople(authStub.admin, { people: [{ id: 'person-1', name: 'Person 1' }] }),
      ).resolves.toEqual([{ error: BulkIdErrorReason.UNKNOWN, id: 'person-1', success: false }]);
      expect(personMock.update).not.toHaveBeenCalled();
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });
  });

  describe('handlePersonCleanup', () => {
    it('should delete people without faces', async () => {
      personMock.getAllWithoutFaces.mockResolvedValue([personStub.noName]);

      await sut.handlePersonCleanup();

      expect(personMock.delete).toHaveBeenCalledWith(personStub.noName);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_FILES,
        data: { files: ['/path/to/thumbnail.jpg'] },
      });
    });
  });

  describe('mergePerson', () => {
    it('should require person.write and person.merge permission', async () => {
      personMock.getById.mockResolvedValueOnce(personStub.primaryPerson);
      personMock.getById.mockResolvedValueOnce(personStub.mergePerson);
      personMock.prepareReassignFaces.mockResolvedValue([]);
      personMock.delete.mockResolvedValue(personStub.mergePerson);
      accessMock.person.hasOwnerAccess.mockResolvedValue(false);

      await expect(sut.mergePerson(authStub.admin, 'person-1', { ids: ['person-2'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(personMock.prepareReassignFaces).not.toHaveBeenCalled();

      expect(personMock.reassignFaces).not.toHaveBeenCalled();

      expect(personMock.delete).not.toHaveBeenCalled();
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });

    it('should merge two people', async () => {
      personMock.getById.mockResolvedValueOnce(personStub.primaryPerson);
      personMock.getById.mockResolvedValueOnce(personStub.mergePerson);
      personMock.prepareReassignFaces.mockResolvedValue([]);
      personMock.delete.mockResolvedValue(personStub.mergePerson);
      accessMock.person.hasOwnerAccess.mockResolvedValue(true);

      await expect(sut.mergePerson(authStub.admin, 'person-1', { ids: ['person-2'] })).resolves.toEqual([
        { id: 'person-2', success: true },
      ]);

      expect(personMock.prepareReassignFaces).toHaveBeenCalledWith({
        newPersonId: personStub.primaryPerson.id,
        oldPersonId: personStub.mergePerson.id,
      });

      expect(personMock.reassignFaces).toHaveBeenCalledWith({
        newPersonId: personStub.primaryPerson.id,
        oldPersonId: personStub.mergePerson.id,
      });

      expect(personMock.delete).toHaveBeenCalledWith(personStub.mergePerson);
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });

    it('should delete conflicting faces before merging', async () => {
      personMock.getById.mockResolvedValue(personStub.primaryPerson);
      personMock.getById.mockResolvedValue(personStub.mergePerson);
      personMock.prepareReassignFaces.mockResolvedValue([assetStub.image.id]);
      accessMock.person.hasOwnerAccess.mockResolvedValue(true);

      await expect(sut.mergePerson(authStub.admin, 'person-1', { ids: ['person-2'] })).resolves.toEqual([
        { id: 'person-2', success: true },
      ]);

      expect(personMock.prepareReassignFaces).toHaveBeenCalledWith({
        newPersonId: personStub.primaryPerson.id,
        oldPersonId: personStub.mergePerson.id,
      });

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.SEARCH_REMOVE_FACE,
        data: { assetId: assetStub.image.id, personId: personStub.mergePerson.id },
      });
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });

    it('should throw an error when the primary person is not found', async () => {
      personMock.getById.mockResolvedValue(null);
      accessMock.person.hasOwnerAccess.mockResolvedValue(true);

      await expect(sut.mergePerson(authStub.admin, 'person-1', { ids: ['person-2'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(personMock.delete).not.toHaveBeenCalled();
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });

    it('should handle invalid merge ids', async () => {
      personMock.getById.mockResolvedValueOnce(personStub.primaryPerson);
      personMock.getById.mockResolvedValueOnce(null);
      accessMock.person.hasOwnerAccess.mockResolvedValue(true);

      await expect(sut.mergePerson(authStub.admin, 'person-1', { ids: ['person-2'] })).resolves.toEqual([
        { id: 'person-2', success: false, error: BulkIdErrorReason.NOT_FOUND },
      ]);

      expect(personMock.prepareReassignFaces).not.toHaveBeenCalled();
      expect(personMock.reassignFaces).not.toHaveBeenCalled();
      expect(personMock.delete).not.toHaveBeenCalled();
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });

    it('should handle an error reassigning faces', async () => {
      personMock.getById.mockResolvedValue(personStub.primaryPerson);
      personMock.getById.mockResolvedValue(personStub.mergePerson);
      personMock.prepareReassignFaces.mockResolvedValue([assetStub.image.id]);
      personMock.reassignFaces.mockRejectedValue(new Error('update failed'));
      accessMock.person.hasOwnerAccess.mockResolvedValue(true);

      await expect(sut.mergePerson(authStub.admin, 'person-1', { ids: ['person-2'] })).resolves.toEqual([
        { id: 'person-2', success: false, error: BulkIdErrorReason.UNKNOWN },
      ]);

      expect(personMock.delete).not.toHaveBeenCalled();
      expect(accessMock.person.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'person-1');
    });
  });
});
