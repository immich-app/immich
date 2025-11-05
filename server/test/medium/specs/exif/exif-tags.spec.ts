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

describe('exif tags', () => {
  it('should detect and regular tags', async () => {
    const { ctx, sut, asset } = await setup('metadata/tags/picasa.jpg');

    await sut.handleMetadataExtraction({ id: asset.id });

    await expect(ctx.getTags(asset.id)).resolves.toEqual([
      expect.objectContaining({ assetId: asset.id, value: 'Frost', parentId: null }),
      expect.objectContaining({ assetId: asset.id, value: 'Yard', parentId: null }),
    ]);
  });
});
