import { Kysely } from 'kysely';
import { Permission } from 'src/enum';
import { ApiKeyRepository } from 'src/repositories/api-key.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { ApiKeyService } from 'src/services/api-key.service';
import { newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(ApiKeyService, {
    database: db || defaultDatabase,
    real: [ApiKeyRepository, CryptoRepository],
    mock: [LoggingRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(ApiKeyService.name, () => {
  describe('getById', () => {
    it('should not return an api key of another user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();
      const { apiKey } = await sut.create(factory.auth({ user }), { permissions: [Permission.All] });

      await expect(sut.getById(factory.auth({ user: otherUser }), apiKey.id)).rejects.toThrow('API Key not found');
    });
  });

  describe('update', () => {
    it('should not update an api key of another user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();
      const { apiKey } = await sut.create(factory.auth({ user }), { permissions: [Permission.All] });

      await expect(sut.update(factory.auth({ user: otherUser }), apiKey.id, { name: 'new name' })).rejects.toThrow(
        'API Key not found',
      );
    });
  });

  describe('delete', () => {
    it('should not delete an api key of another user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();
      const { apiKey } = await sut.create(factory.auth({ user }), { permissions: [Permission.All] });

      await expect(sut.delete(factory.auth({ user: otherUser }), apiKey.id)).rejects.toThrow('API Key not found');
      await expect(sut.getById(factory.auth({ user }), apiKey.id)).resolves.toEqual(
        expect.objectContaining({ id: apiKey.id }),
      );
    });
  });

  describe('rotate', () => {
    it('should not rotate an api key of another user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();
      const { apiKey } = await sut.create(factory.auth({ user }), { permissions: [Permission.All] });

      await expect(sut.rotate(factory.auth({ user: otherUser }), apiKey.id)).rejects.toThrow('API Key not found');
    });

    it('should not rotate a key with permissions the caller does not have', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { apiKey } = await sut.create(factory.auth({ user }), { permissions: [Permission.All] });
      const auth = factory.auth({ user, apiKey: { permissions: [Permission.ApiKeyRotate] } });

      await expect(sut.rotate(auth, apiKey.id)).rejects.toThrow(
        'Cannot rotate an API Key with permissions you do not have',
      );
    });

    it('should replace the secret of an api key', async () => {
      const { sut, ctx } = setup();
      const apiKeyRepo = ctx.get(ApiKeyRepository);
      const crypto = ctx.get(CryptoRepository);
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });
      const { apiKey, secret } = await sut.create(auth, { permissions: [Permission.All] });

      const rotated = await sut.rotate(auth, apiKey.id);

      expect(rotated.secret).not.toEqual(secret);
      expect(rotated.apiKey).toEqual(
        expect.objectContaining({ id: apiKey.id, name: apiKey.name, permissions: [Permission.All] }),
      );
      await expect(apiKeyRepo.getKey(crypto.hashSha256(secret))).resolves.toBeUndefined();
      await expect(apiKeyRepo.getKey(crypto.hashSha256(rotated.secret))).resolves.toEqual(
        expect.objectContaining({ id: apiKey.id }),
      );
    });
  });
});
