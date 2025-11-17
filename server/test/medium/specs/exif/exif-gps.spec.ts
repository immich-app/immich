import { Kysely } from 'kysely';
import { resolve } from 'node:path';
import { DB } from 'src/schema';
import { ExifTestContext } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let database: Kysely<DB>;

const setup = async (testAssetPath: string) => {
  const ctx = new ExifTestContext(database);

  const { user } = await ctx.newUser();
  const originalPath = resolve(`../e2e/test-assets/${testAssetPath}`);
  const { asset } = await ctx.newAsset({ ownerId: user.id, originalPath });

  return { ctx, sut: ctx.sut, asset };
};

beforeAll(async () => {
  database = await getKyselyDB();
});

describe('exif gps', () => {
  it('should handle empty strings', async () => {
    const { ctx, sut, asset } = await setup('metadata/gps-position/empty_gps.jpg');

    await sut.handleMetadataExtraction({ id: asset.id });

    await expect(ctx.getGps(asset.id)).resolves.toEqual({ latitude: null, longitude: null });
  });
});
