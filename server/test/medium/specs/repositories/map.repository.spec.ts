import { Kysely } from 'kysely';
import { ConfigRepository } from 'src/repositories/config.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { MapRepository } from 'src/repositories/map.repository.js';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository.js';
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
  const sut = new MapRepository(
    new ConfigRepository(),
    new SystemMetadataRepository(ctx.database),
    ctx.get(LoggingRepository),
    ctx.database,
  );

  return { ctx, sut };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(MapRepository.name, () => {
  afterEach(async () => {
    const { ctx } = setup();
    await ctx.database.deleteFrom('favorite_location').execute();
  });

  it('should create and list favorite locations only for the requested user', async () => {
    const { ctx, sut } = setup();
    const [{ user: owner }, { user: otherUser }] = [await ctx.newUser(), await ctx.newUser()];
    const ownerLocation = await sut.createFavoriteLocation({
      userId: owner.id,
      name: 'Home',
      latitude: 42,
      longitude: 69,
    });
    await sut.createFavoriteLocation({
      userId: otherUser.id,
      name: 'Office',
      latitude: 40,
      longitude: -70,
    });

    await expect(sut.getFavoriteLocations(owner.id)).resolves.toEqual([ownerLocation]);
  });

  it('should not delete a favorite location owned by another user', async () => {
    const { ctx, sut } = setup();
    const [{ user: owner }, { user: otherUser }] = [await ctx.newUser(), await ctx.newUser()];
    const location = await sut.createFavoriteLocation({
      userId: owner.id,
      name: 'Home',
      latitude: 42,
      longitude: 69,
    });

    await expect(sut.deleteFavoriteLocation(location.id, otherUser.id)).resolves.toBe(false);
    await expect(sut.getFavoriteLocations(owner.id)).resolves.toEqual([location]);

    await expect(sut.deleteFavoriteLocation(location.id, owner.id)).resolves.toBe(true);
    await expect(sut.getFavoriteLocations(owner.id)).resolves.toEqual([]);
  });
});
