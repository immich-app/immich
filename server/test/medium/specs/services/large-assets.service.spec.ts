import { Kysely } from 'kysely';
import { DB } from 'src/db';
import { AssetRepository } from 'src/repositories/asset.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { LargeAssetsService } from 'src/services/large-assets.service';
import { mediumFactory, newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';
import { beforeEach, vitest } from 'vitest';

vitest.useFakeTimers();

describe(LargeAssetsService.name, () => {
  let sut: LargeAssetsService;
  let defaultDatabase: Kysely<DB>;
  let assetRepo: AssetRepository;
  let userRepo: UserRepository;

  const createSut = (db?: Kysely<DB>) => {
    return newMediumService(LargeAssetsService, {
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

  beforeEach(() => {
    ({ sut } = createSut());
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  it('should return assets', async () => {
    const user = mediumFactory.userInsert();
    await userRepo.create(user);

    const assets = [];
    const sizes = [12_334, 599, 123_456];

    for (let i = 0; i < sizes.length; i++) {
      const asset = mediumFactory.assetInsert({ ownerId: user.id });
      await assetRepo.create(asset);
      await assetRepo.upsertExif({ assetId: asset.id, fileSizeInByte: sizes[i] });

      assets.push(asset);
    }

    const auth = factory.auth({ user: { id: user.id } });

    await expect(sut.getLargeAssets(auth)).resolves.toEqual({
      assets: [
        expect.objectContaining({ id: assets[2].id }),
        expect.objectContaining({ id: assets[0].id }),
        expect.objectContaining({ id: assets[1].id }),
      ],
    });
  });
});
