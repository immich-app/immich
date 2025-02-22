import { BadRequestException } from '@nestjs/common';
import { Permission } from 'src/enum';
import { APIKeyService } from 'src/services/api-key.service';
import { keyStub } from 'test/fixtures/api-key.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { newTestService, ServiceMocks } from 'test/utils';

describe(APIKeyService.name, () => {
  let sut: APIKeyService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(APIKeyService));
  });

  describe('create', () => {
    it('should create a new key', async () => {
      mocks.apiKey.create.mockResolvedValue(keyStub.admin);
      await sut.create(authStub.admin, { name: 'Test Key', permissions: [Permission.ALL] });
      expect(mocks.apiKey.create).toHaveBeenCalledWith({
        key: 'cmFuZG9tLWJ5dGVz (hashed)',
        name: 'Test Key',
        permissions: [Permission.ALL],
        userId: authStub.admin.user.id,
      });
      expect(mocks.crypto.newPassword).toHaveBeenCalled();
      expect(mocks.crypto.hashSha256).toHaveBeenCalled();
    });

    it('should not require a name', async () => {
      mocks.apiKey.create.mockResolvedValue(keyStub.admin);

      await sut.create(authStub.admin, { permissions: [Permission.ALL] });

      expect(mocks.apiKey.create).toHaveBeenCalledWith({
        key: 'cmFuZG9tLWJ5dGVz (hashed)',
        name: 'API Key',
        permissions: [Permission.ALL],
        userId: authStub.admin.user.id,
      });
      expect(mocks.crypto.newPassword).toHaveBeenCalled();
      expect(mocks.crypto.hashSha256).toHaveBeenCalled();
    });

    it('should throw an error if the api key does not have sufficient permissions', async () => {
      await expect(
        sut.create({ ...authStub.admin, apiKey: keyStub.authKey }, { permissions: [Permission.ASSET_READ] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    it('should throw an error if the key is not found', async () => {
      await expect(sut.update(authStub.admin, 'random-guid', { name: 'New Name' })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.apiKey.update).not.toHaveBeenCalledWith('random-guid');
    });

    it('should update a key', async () => {
      mocks.apiKey.getById.mockResolvedValue(keyStub.admin);
      mocks.apiKey.update.mockResolvedValue(keyStub.admin);

      await sut.update(authStub.admin, 'random-guid', { name: 'New Name' });

      expect(mocks.apiKey.update).toHaveBeenCalledWith(authStub.admin.user.id, 'random-guid', { name: 'New Name' });
    });
  });

  describe('delete', () => {
    it('should throw an error if the key is not found', async () => {
      await expect(sut.delete(authStub.admin, 'random-guid')).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.apiKey.delete).not.toHaveBeenCalledWith('random-guid');
    });

    it('should delete a key', async () => {
      mocks.apiKey.getById.mockResolvedValue(keyStub.admin);

      await sut.delete(authStub.admin, 'random-guid');

      expect(mocks.apiKey.delete).toHaveBeenCalledWith(authStub.admin.user.id, 'random-guid');
    });
  });

  describe('getById', () => {
    it('should throw an error if the key is not found', async () => {
      await expect(sut.getById(authStub.admin, 'random-guid')).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.apiKey.getById).toHaveBeenCalledWith(authStub.admin.user.id, 'random-guid');
    });

    it('should get a key by id', async () => {
      mocks.apiKey.getById.mockResolvedValue(keyStub.admin);

      await sut.getById(authStub.admin, 'random-guid');

      expect(mocks.apiKey.getById).toHaveBeenCalledWith(authStub.admin.user.id, 'random-guid');
    });
  });

  describe('getAll', () => {
    it('should return all the keys for a user', async () => {
      mocks.apiKey.getByUserId.mockResolvedValue([keyStub.admin]);

      await expect(sut.getAll(authStub.admin)).resolves.toHaveLength(1);

      expect(mocks.apiKey.getByUserId).toHaveBeenCalledWith(authStub.admin.user.id);
    });
  });
});
