import { Kysely } from 'kysely';
import { DB } from 'src/db';
import { AssetRepository } from 'src/repositories/asset.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { AssetService } from 'src/services/asset.service';
import { mediumFactory, newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

describe(AssetService.name, () => {
  let defaultDatabase: Kysely<DB>;
  let assetRepo: AssetRepository;
  let userRepo: UserRepository;

  const createSut = (db?: Kysely<DB>) => {
    return newMediumService(AssetService, {
      database: db || defaultDatabase,
      repos: {
        asset: 'real',
      },
    });
  };

  beforeAll(async () => {
    defaultDatabase = await getKyselyDB();

    assetRepo = new AssetRepository(defaultDatabase);
    userRepo = new UserRepository(defaultDatabase);
  });

  describe('getStatistics', () => {
    it('should return stats as numbers, not strings', async () => {
      const { sut } = createSut();

      const user = mediumFactory.userInsert();
      const asset = mediumFactory.assetInsert({ ownerId: user.id });

      await userRepo.create(user);
      await assetRepo.create(asset);
      await assetRepo.upsertExif({ assetId: asset.id, fileSizeInByte: 12_345 });

      const auth = factory.auth({ user: { id: user.id } });
      await expect(sut.getStatistics(auth, {})).resolves.toEqual({ images: 1, total: 1, videos: 0 });
    });
  });
});
