import { Kysely } from 'kysely';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { UserRepository } from 'src/repositories/user.repository.js';
import { DB } from 'src/schema/index.js';
import { BaseService } from 'src/services/base.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

const setup = () => {
  const { ctx } = newMediumService(BaseService, {
    database: defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(UserRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(UserRepository.name, () => {
  describe('getAdminIds', () => {
    it('should return every admin that is not deleted', async () => {
      const { ctx, sut } = setup();
      const { user: admin1 } = await ctx.newUser({ isAdmin: true });
      const { user: admin2 } = await ctx.newUser({ isAdmin: true });
      await ctx.newUser({ isAdmin: false });
      await ctx.newUser({ isAdmin: true, deletedAt: new Date() });

      const adminIds = await sut.getAdminIds();

      expect(adminIds.toSorted()).toEqual([admin1.id, admin2.id].toSorted());
    });
  });
});
