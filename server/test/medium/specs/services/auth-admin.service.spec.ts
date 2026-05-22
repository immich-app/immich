import { Kysely } from 'kysely';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { DB } from 'src/schema';
import { AuthAdminService } from 'src/services/auth-admin.service';
import { newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(AuthAdminService, {
    database: db || defaultDatabase,
    real: [UserRepository],
    mock: [LoggingRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AuthAdminService.name, () => {
  describe('unlinkAll', () => {
    it('should reset user.oauthId', async () => {
      const { sut, ctx } = setup();
      const userRepo = ctx.get(UserRepository);
      const { user } = await ctx.newUser({ oauthId: 'test-oauth-id' });
      const auth = factory.auth();

      await expect(sut.unlinkAll(auth)).resolves.toBeUndefined();
      await expect(userRepo.get(user.id, { withDeleted: true })).resolves.toEqual(
        expect.objectContaining({ oauthId: '' }),
      );
    });

    it('should reset a deleted user', async () => {
      const { sut, ctx } = setup();
      const userRepo = ctx.get(UserRepository);
      const { user } = await ctx.newUser({ oauthId: 'test-oauth-id', deletedAt: new Date() });
      const auth = factory.auth();

      await expect(sut.unlinkAll(auth)).resolves.toBeUndefined();
      await expect(userRepo.get(user.id, { withDeleted: true })).resolves.toEqual(
        expect.objectContaining({ oauthId: '' }),
      );
    });

    it('should reset multiple users', async () => {
      const { sut, ctx } = setup();
      const userRepo = ctx.get(UserRepository);
      const { user: user1 } = await ctx.newUser({ oauthId: '1' });
      const { user: user2 } = await ctx.newUser({ oauthId: '2', deletedAt: new Date() });
      const auth = factory.auth();

      await expect(sut.unlinkAll(auth)).resolves.toBeUndefined();
      await expect(userRepo.get(user1.id, { withDeleted: true })).resolves.toEqual(
        expect.objectContaining({ oauthId: '' }),
      );
      await expect(userRepo.get(user2.id, { withDeleted: true })).resolves.toEqual(
        expect.objectContaining({ oauthId: '' }),
      );
    });
  });
});
