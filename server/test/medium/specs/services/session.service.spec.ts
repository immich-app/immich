import { Kysely } from 'kysely';
import { CryptoRepository } from 'src/repositories/crypto.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { ResourceRepository } from 'src/repositories/resource.repository.js';
import { SessionRepository } from 'src/repositories/session.repository.js';
import { DB } from 'src/schema/index.js';
import { SessionService } from 'src/services/session.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { factory } from 'test/small.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

const setup = () => {
  return newMediumService(SessionService, {
    database: defaultDatabase,
    real: [CryptoRepository, SessionRepository],
    mock: [LoggingRepository, ResourceRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(SessionService.name, () => {
  describe('create', () => {
    it('should store missing device details as null and return empty strings', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { session } = await ctx.newSession({ userId: user.id });

      const created = await sut.create(factory.auth({ user, session }), {});

      expect(created).toEqual(expect.objectContaining({ deviceType: '', deviceOS: '' }));
      const sessions = await ctx.get(SessionRepository).getByUserId(user.id);
      expect(sessions.find(({ id }) => id === created.id)).toEqual(
        expect.objectContaining({ deviceType: null, deviceOS: null }),
      );
    });
  });
});
