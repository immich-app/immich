import { APIKeyEntity } from '@app/infra/db/entities';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { authStub, userEntityStub, newCryptoRepositoryMock, newKeyRepositoryMock } from '../../test';
import { ICryptoRepository } from '../auth';
import { IKeyRepository } from './api-key.repository';
import { APIKeyService } from './api-key.service';

const adminKey = Object.freeze({
  id: 1,
  name: 'My Key',
  key: 'my-api-key (hashed)',
  userId: authStub.admin.id,
  user: userEntityStub.admin,
} as APIKeyEntity);

const token = Buffer.from('1:my-api-key', 'utf8').toString('base64');

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
      keyMock.create.mockResolvedValue(adminKey);

      await sut.create(authStub.admin, { name: 'Test Key' });

      expect(keyMock.create).toHaveBeenCalledWith({
        key: 'cmFuZG9tLWJ5dGVz (hashed)',
        name: 'Test Key',
        userId: authStub.admin.id,
      });
      expect(cryptoMock.randomBytes).toHaveBeenCalled();
      expect(cryptoMock.hash).toHaveBeenCalled();
    });

    it('should not require a name', async () => {
      keyMock.create.mockResolvedValue(adminKey);

      await sut.create(authStub.admin, {});

      expect(keyMock.create).toHaveBeenCalledWith({
        key: 'cmFuZG9tLWJ5dGVz (hashed)',
        name: 'API Key',
        userId: authStub.admin.id,
      });
      expect(cryptoMock.randomBytes).toHaveBeenCalled();
      expect(cryptoMock.hash).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should throw an error if the key is not found', async () => {
      keyMock.getById.mockResolvedValue(null);

      await expect(sut.update(authStub.admin, 1, { name: 'New Name' })).rejects.toBeInstanceOf(BadRequestException);

      expect(keyMock.update).not.toHaveBeenCalledWith(1);
    });

    it('should update a key', async () => {
      keyMock.getById.mockResolvedValue(adminKey);

      await sut.update(authStub.admin, 1, { name: 'New Name' });

      expect(keyMock.update).toHaveBeenCalledWith(authStub.admin.id, 1, { name: 'New Name' });
    });
  });

  describe('delete', () => {
    it('should throw an error if the key is not found', async () => {
      keyMock.getById.mockResolvedValue(null);

      await expect(sut.delete(authStub.admin, 1)).rejects.toBeInstanceOf(BadRequestException);

      expect(keyMock.delete).not.toHaveBeenCalledWith(1);
    });

    it('should delete a key', async () => {
      keyMock.getById.mockResolvedValue(adminKey);

      await sut.delete(authStub.admin, 1);

      expect(keyMock.delete).toHaveBeenCalledWith(authStub.admin.id, 1);
    });
  });

  describe('getById', () => {
    it('should throw an error if the key is not found', async () => {
      keyMock.getById.mockResolvedValue(null);

      await expect(sut.getById(authStub.admin, 1)).rejects.toBeInstanceOf(BadRequestException);

      expect(keyMock.getById).toHaveBeenCalledWith(authStub.admin.id, 1);
    });

    it('should get a key by id', async () => {
      keyMock.getById.mockResolvedValue(adminKey);

      await sut.getById(authStub.admin, 1);

      expect(keyMock.getById).toHaveBeenCalledWith(authStub.admin.id, 1);
    });
  });

  describe('getAll', () => {
    it('should return all the keys for a user', async () => {
      keyMock.getByUserId.mockResolvedValue([adminKey]);

      await expect(sut.getAll(authStub.admin)).resolves.toHaveLength(1);

      expect(keyMock.getByUserId).toHaveBeenCalledWith(authStub.admin.id);
    });
  });

  describe('validate', () => {
    it('should throw an error for an invalid id', async () => {
      keyMock.getKey.mockResolvedValue(null);

      await expect(sut.validate(token)).rejects.toBeInstanceOf(UnauthorizedException);

      expect(keyMock.getKey).toHaveBeenCalledWith(1);
      expect(cryptoMock.compareSync).not.toHaveBeenCalled();
    });

    it('should validate the token', async () => {
      keyMock.getKey.mockResolvedValue(adminKey);

      await expect(sut.validate(token)).resolves.toEqual(authStub.admin);

      expect(keyMock.getKey).toHaveBeenCalledWith(1);
      expect(cryptoMock.compareSync).toHaveBeenCalledWith('my-api-key', 'my-api-key (hashed)');
    });
  });
});
