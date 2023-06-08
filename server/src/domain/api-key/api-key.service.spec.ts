import { BadRequestException } from '@nestjs/common';
import { authStub, keyStub, newCryptoRepositoryMock, newKeyRepositoryMock } from '@test';
import { ICryptoRepository } from '../crypto';
import { IKeyRepository } from './api-key.repository';
import { APIKeyService } from './api-key.service';

describe(APIKeyService.name, () => {
  let sut: APIKeyService;
  let keyMock: jest.Mocked<IKeyRepository>;
  let cryptoMock: jest.Mocked<ICryptoRepository>;

  beforeEach(async () => {
    cryptoMock = newCryptoRepositoryMock();
    keyMock = newKeyRepositoryMock();
    sut = new APIKeyService(cryptoMock, keyMock);
  });

  describe('create', () => {
    it('should create a new key', async () => {
      keyMock.create.mockResolvedValue(keyStub.admin);
      await sut.create(authStub.admin, { name: 'Test Key' });
      expect(keyMock.create).toHaveBeenCalledWith({
        key: 'cmFuZG9tLWJ5dGVz (hashed)',
        name: 'Test Key',
        userId: authStub.admin.id,
      });
      expect(cryptoMock.randomBytes).toHaveBeenCalled();
      expect(cryptoMock.hashSha256).toHaveBeenCalled();
    });

    it('should not require a name', async () => {
      keyMock.create.mockResolvedValue(keyStub.admin);

      await sut.create(authStub.admin, {});

      expect(keyMock.create).toHaveBeenCalledWith({
        key: 'cmFuZG9tLWJ5dGVz (hashed)',
        name: 'API Key',
        userId: authStub.admin.id,
      });
      expect(cryptoMock.randomBytes).toHaveBeenCalled();
      expect(cryptoMock.hashSha256).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should throw an error if the key is not found', async () => {
      keyMock.getById.mockResolvedValue(null);

      await expect(sut.update(authStub.admin, 'random-guid', { name: 'New Name' })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(keyMock.update).not.toHaveBeenCalledWith('random-guid');
    });

    it('should update a key', async () => {
      keyMock.getById.mockResolvedValue(keyStub.admin);

      await sut.update(authStub.admin, 'random-guid', { name: 'New Name' });

      expect(keyMock.update).toHaveBeenCalledWith(authStub.admin.id, 'random-guid', { name: 'New Name' });
    });
  });

  describe('delete', () => {
    it('should throw an error if the key is not found', async () => {
      keyMock.getById.mockResolvedValue(null);

      await expect(sut.delete(authStub.admin, 'random-guid')).rejects.toBeInstanceOf(BadRequestException);

      expect(keyMock.delete).not.toHaveBeenCalledWith('random-guid');
    });

    it('should delete a key', async () => {
      keyMock.getById.mockResolvedValue(keyStub.admin);

      await sut.delete(authStub.admin, 'random-guid');

      expect(keyMock.delete).toHaveBeenCalledWith(authStub.admin.id, 'random-guid');
    });
  });

  describe('getById', () => {
    it('should throw an error if the key is not found', async () => {
      keyMock.getById.mockResolvedValue(null);

      await expect(sut.getById(authStub.admin, 'random-guid')).rejects.toBeInstanceOf(BadRequestException);

      expect(keyMock.getById).toHaveBeenCalledWith(authStub.admin.id, 'random-guid');
    });

    it('should get a key by id', async () => {
      keyMock.getById.mockResolvedValue(keyStub.admin);

      await sut.getById(authStub.admin, 'random-guid');

      expect(keyMock.getById).toHaveBeenCalledWith(authStub.admin.id, 'random-guid');
    });
  });

  describe('getAll', () => {
    it('should return all the keys for a user', async () => {
      keyMock.getByUserId.mockResolvedValue([keyStub.admin]);

      await expect(sut.getAll(authStub.admin)).resolves.toHaveLength(1);

      expect(keyMock.getByUserId).toHaveBeenCalledWith(authStub.admin.id);
    });
  });
});
