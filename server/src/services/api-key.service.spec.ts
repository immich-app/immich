import { BadRequestException } from '@nestjs/common';
import { Permission } from 'src/enum';
import { ApiKeyService } from 'src/services/api-key.service';
import { factory, newUuid } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

describe(ApiKeyService.name, () => {
  let sut: ApiKeyService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(ApiKeyService));
  });

  describe('create', () => {
    it('should create a new key', async () => {
      const auth = factory.auth();
      const apiKey = factory.apiKey({ userId: auth.user.id, permissions: [Permission.ALL] });
      const key = 'super-secret';

      mocks.crypto.newPassword.mockReturnValue(key);
      mocks.apiKey.create.mockResolvedValue(apiKey);

      await sut.create(auth, { name: apiKey.name, permissions: apiKey.permissions });

      expect(mocks.apiKey.create).toHaveBeenCalledWith({
        key: 'super-secret (hashed)',
        name: apiKey.name,
        permissions: apiKey.permissions,
        userId: apiKey.userId,
      });
      expect(mocks.crypto.newPassword).toHaveBeenCalled();
      expect(mocks.crypto.hashSha256).toHaveBeenCalled();
    });

    it('should not require a name', async () => {
      const auth = factory.auth();
      const apiKey = factory.apiKey({ userId: auth.user.id });
      const key = 'super-secret';

      mocks.crypto.newPassword.mockReturnValue(key);
      mocks.apiKey.create.mockResolvedValue(apiKey);

      await sut.create(auth, { permissions: [Permission.ALL] });

      expect(mocks.apiKey.create).toHaveBeenCalledWith({
        key: 'super-secret (hashed)',
        name: 'API Key',
        permissions: [Permission.ALL],
        userId: auth.user.id,
      });
      expect(mocks.crypto.newPassword).toHaveBeenCalled();
      expect(mocks.crypto.hashSha256).toHaveBeenCalled();
    });

    it('should throw an error if the api key does not have sufficient permissions', async () => {
      const auth = factory.auth({ apiKey: factory.authApiKey({ permissions: [Permission.ASSET_READ] }) });

      await expect(sut.create(auth, { permissions: [Permission.ASSET_UPDATE] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should throw an error if the key is not found', async () => {
      const id = newUuid();
      const auth = factory.auth();

      mocks.apiKey.getById.mockResolvedValue(void 0);

      await expect(sut.update(auth, id, { name: 'New Name' })).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.apiKey.update).not.toHaveBeenCalledWith(id);
    });

    it('should update a key', async () => {
      const auth = factory.auth();
      const apiKey = factory.apiKey({ userId: auth.user.id });
      const newName = 'New name';

      mocks.apiKey.getById.mockResolvedValue(apiKey);
      mocks.apiKey.update.mockResolvedValue(apiKey);

      await sut.update(auth, apiKey.id, { name: newName });

      expect(mocks.apiKey.update).toHaveBeenCalledWith(auth.user.id, apiKey.id, { name: newName });
    });
  });

  describe('delete', () => {
    it('should throw an error if the key is not found', async () => {
      const auth = factory.auth();
      const id = newUuid();

      mocks.apiKey.getById.mockResolvedValue(void 0);

      await expect(sut.delete(auth, id)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.apiKey.delete).not.toHaveBeenCalledWith(id);
    });

    it('should delete a key', async () => {
      const auth = factory.auth();
      const apiKey = factory.apiKey({ userId: auth.user.id });

      mocks.apiKey.getById.mockResolvedValue(apiKey);
      mocks.apiKey.delete.mockResolvedValue();

      await sut.delete(auth, apiKey.id);

      expect(mocks.apiKey.delete).toHaveBeenCalledWith(auth.user.id, apiKey.id);
    });
  });

  describe('getById', () => {
    it('should throw an error if the key is not found', async () => {
      const auth = factory.auth();
      const id = newUuid();

      mocks.apiKey.getById.mockResolvedValue(void 0);

      await expect(sut.getById(auth, id)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.apiKey.getById).toHaveBeenCalledWith(auth.user.id, id);
    });

    it('should get a key by id', async () => {
      const auth = factory.auth();
      const apiKey = factory.apiKey({ userId: auth.user.id });

      mocks.apiKey.getById.mockResolvedValue(apiKey);

      await sut.getById(auth, apiKey.id);

      expect(mocks.apiKey.getById).toHaveBeenCalledWith(auth.user.id, apiKey.id);
    });
  });

  describe('getAll', () => {
    it('should return all the keys for a user', async () => {
      const auth = factory.auth();
      const apiKey = factory.apiKey({ userId: auth.user.id });

      mocks.apiKey.getByUserId.mockResolvedValue([apiKey]);

      await expect(sut.getAll(auth)).resolves.toHaveLength(1);

      expect(mocks.apiKey.getByUserId).toHaveBeenCalledWith(auth.user.id);
    });
  });
});
