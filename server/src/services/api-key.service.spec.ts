import { BadRequestException } from '@nestjs/common';
import { Permission } from 'src/enum';
import { IKeyRepository } from 'src/interfaces/api-key.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { APIKeyService } from 'src/services/api-key.service';
import { keyStub } from 'test/fixtures/api-key.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(APIKeyService.name, () => {
  let sut: APIKeyService;

  let cryptoMock: Mocked<ICryptoRepository>;
  let keyMock: Mocked<IKeyRepository>;

  beforeEach(() => {
    ({ sut, cryptoMock, keyMock } = newTestService(APIKeyService));
  });

  describe('create', () => {
    it('should create a new key', async () => {
      keyMock.create.mockResolvedValue(keyStub.admin);
      await sut.create(authStub.admin, { name: 'Test Key', permissions: [Permission.ALL] });
      expect(keyMock.create).toHaveBeenCalledWith({
        key: 'cmFuZG9tLWJ5dGVz (hashed)',
        name: 'Test Key',
        permissions: [Permission.ALL],
        userId: authStub.admin.user.id,
      });
      expect(cryptoMock.newPassword).toHaveBeenCalled();
      expect(cryptoMock.hashSha256).toHaveBeenCalled();
    });

    it('should not require a name', async () => {
      keyMock.create.mockResolvedValue(keyStub.admin);

      await sut.create(authStub.admin, { permissions: [Permission.ALL] });

      expect(keyMock.create).toHaveBeenCalledWith({
        key: 'cmFuZG9tLWJ5dGVz (hashed)',
        name: 'API Key',
        permissions: [Permission.ALL],
        userId: authStub.admin.user.id,
      });
      expect(cryptoMock.newPassword).toHaveBeenCalled();
      expect(cryptoMock.hashSha256).toHaveBeenCalled();
    });

    it('should throw an error if the api key does not have sufficient permissions', async () => {
      await expect(
        sut.create(
          { ...authStub.admin, apiKey: { ...keyStub.admin, permissions: [] } },
          { permissions: [Permission.ASSET_READ] },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
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
      keyMock.update.mockResolvedValue(keyStub.admin);

      await sut.update(authStub.admin, 'random-guid', { name: 'New Name' });

      expect(keyMock.update).toHaveBeenCalledWith(authStub.admin.user.id, 'random-guid', { name: 'New Name' });
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

      expect(keyMock.delete).toHaveBeenCalledWith(authStub.admin.user.id, 'random-guid');
    });
  });

  describe('getById', () => {
    it('should throw an error if the key is not found', async () => {
      keyMock.getById.mockResolvedValue(null);

      await expect(sut.getById(authStub.admin, 'random-guid')).rejects.toBeInstanceOf(BadRequestException);

      expect(keyMock.getById).toHaveBeenCalledWith(authStub.admin.user.id, 'random-guid');
    });

    it('should get a key by id', async () => {
      keyMock.getById.mockResolvedValue(keyStub.admin);

      await sut.getById(authStub.admin, 'random-guid');

      expect(keyMock.getById).toHaveBeenCalledWith(authStub.admin.user.id, 'random-guid');
    });
  });

  describe('getAll', () => {
    it('should return all the keys for a user', async () => {
      keyMock.getByUserId.mockResolvedValue([keyStub.admin]);

      await expect(sut.getAll(authStub.admin)).resolves.toHaveLength(1);

      expect(keyMock.getByUserId).toHaveBeenCalledWith(authStub.admin.user.id);
    });
  });
});
