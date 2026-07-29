import { Kysely } from 'kysely';
import { AssetVisibility } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { StackRepository } from 'src/repositories/stack.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(StackRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(StackRepository.name, () => {
  describe('autoStackRawPair', () => {
    it.each(['RAF', 'RAW', 'CR3'])('should stack a .%s file under its matching JPEG', async (extension) => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const capturedAt = new Date('2026-07-18T22:26:06.000Z');
      const [{ asset: jpeg }, { asset: raw }] = await Promise.all([
        ctx.newAsset({
          ownerId: user.id,
          originalFileName: 'IMG_1234.JPG',
          originalPath: '/upload/one.jpg',
          fileCreatedAt: capturedAt,
          localDateTime: capturedAt,
        }),
        ctx.newAsset({
          ownerId: user.id,
          originalFileName: `IMG_1234.${extension}`,
          originalPath: '/upload/two.raw',
          fileCreatedAt: capturedAt,
          localDateTime: capturedAt,
        }),
      ]);
      await Promise.all([
        ctx.newExif({ assetId: jpeg.id, make: 'FUJIFILM', model: 'X-T5' }),
        ctx.newExif({ assetId: raw.id, make: 'FUJIFILM', model: 'X-T5' }),
      ]);

      const stackId = await sut.autoStackRawPair(raw.id);

      expect(stackId).toBeDefined();
      await expect(
        ctx.database.selectFrom('stack').selectAll().where('id', '=', stackId!).executeTakeFirstOrThrow(),
      ).resolves.toEqual(expect.objectContaining({ id: stackId, ownerId: user.id, primaryAssetId: jpeg.id }));
      await expect(
        ctx.database
          .selectFrom('asset')
          .select(['id', 'stackId'])
          .where('id', 'in', [jpeg.id, raw.id])
          .orderBy('id')
          .execute(),
      ).resolves.toEqual([
        { id: [jpeg.id, raw.id].sort()[0], stackId },
        { id: [jpeg.id, raw.id].sort()[1], stackId },
      ]);
    });

    it('should create only one stack when both metadata events run concurrently', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const capturedAt = new Date('2026-07-18T22:26:06.000Z');
      const [{ asset: jpeg }, { asset: raw }] = await Promise.all([
        ctx.newAsset({
          ownerId: user.id,
          originalFileName: 'DSCF0001.jpeg',
          originalPath: '/upload/one.jpg',
          fileCreatedAt: capturedAt,
          localDateTime: capturedAt,
        }),
        ctx.newAsset({
          ownerId: user.id,
          originalFileName: 'DSCF0001.raf',
          originalPath: '/upload/two.raf',
          fileCreatedAt: capturedAt,
          localDateTime: capturedAt,
        }),
      ]);
      await Promise.all([
        ctx.newExif({ assetId: jpeg.id, make: 'FUJIFILM', model: 'X-T5' }),
        ctx.newExif({ assetId: raw.id, make: 'FUJIFILM', model: 'X-T5' }),
      ]);

      const results = await Promise.all([sut.autoStackRawPair(jpeg.id), sut.autoStackRawPair(raw.id)]);
      const stackIds = results.filter((id) => id !== undefined);

      expect(stackIds).toHaveLength(1);
      await expect(
        ctx.database.selectFrom('stack').select('id').where('ownerId', '=', user.id).execute(),
      ).resolves.toEqual([{ id: stackIds[0] }]);
    });

    it('should leave existing manual stacks unchanged', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const capturedAt = new Date('2026-07-18T22:26:06.000Z');
      const [{ asset: jpeg }, { asset: raw }, { asset: other }] = await Promise.all([
        ctx.newAsset({
          ownerId: user.id,
          originalFileName: 'IMG_1234.JPG',
          fileCreatedAt: capturedAt,
          localDateTime: capturedAt,
        }),
        ctx.newAsset({
          ownerId: user.id,
          originalFileName: 'IMG_1234.RAF',
          fileCreatedAt: capturedAt,
          localDateTime: capturedAt,
        }),
        ctx.newAsset({ ownerId: user.id, originalFileName: 'other.jpg' }),
      ]);
      await Promise.all([
        ctx.newExif({ assetId: jpeg.id, make: 'FUJIFILM', model: 'X-T5' }),
        ctx.newExif({ assetId: raw.id, make: 'FUJIFILM', model: 'X-T5' }),
      ]);
      const { result: manualStack } = await ctx.newStack({ ownerId: user.id }, [jpeg.id, other.id]);

      await expect(sut.autoStackRawPair(raw.id)).resolves.toBeUndefined();
      await expect(
        ctx.database.selectFrom('stack').select('id').where('ownerId', '=', user.id).execute(),
      ).resolves.toEqual([{ id: manualStack.id }]);
    });

    it.each([
      {
        name: 'different basenames',
        jpeg: { originalFileName: 'IMG_1235.JPG' },
        raw: {},
        jpegExif: {},
        rawExif: {},
      },
      {
        name: 'different capture times',
        jpeg: { fileCreatedAt: new Date('2026-07-18T22:26:07.000Z') },
        raw: {},
        jpegExif: {},
        rawExif: {},
      },
      {
        name: 'different camera models',
        jpeg: {},
        raw: {},
        jpegExif: { model: 'X-T4' },
        rawExif: {},
      },
      {
        name: 'different visibility',
        jpeg: { visibility: AssetVisibility.Archive },
        raw: {},
        jpegExif: {},
        rawExif: {},
      },
    ])('should not stack assets with $name', async ({ jpeg, raw, jpegExif, rawExif }) => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const capturedAt = new Date('2026-07-18T22:26:06.000Z');
      const [{ asset: jpegAsset }, { asset: rawAsset }] = await Promise.all([
        ctx.newAsset({
          ownerId: user.id,
          originalFileName: 'IMG_1234.JPG',
          fileCreatedAt: capturedAt,
          localDateTime: capturedAt,
          ...jpeg,
        }),
        ctx.newAsset({
          ownerId: user.id,
          originalFileName: 'IMG_1234.RAF',
          fileCreatedAt: capturedAt,
          localDateTime: capturedAt,
          ...raw,
        }),
      ]);
      await Promise.all([
        ctx.newExif({ assetId: jpegAsset.id, make: 'FUJIFILM', model: 'X-T5', ...jpegExif }),
        ctx.newExif({ assetId: rawAsset.id, make: 'FUJIFILM', model: 'X-T5', ...rawExif }),
      ]);

      await expect(sut.autoStackRawPair(rawAsset.id)).resolves.toBeUndefined();
      await expect(
        ctx.database.selectFrom('stack').select('id').where('ownerId', '=', user.id).execute(),
      ).resolves.toEqual([]);
    });

    it('should not stack external-library assets from different directories', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const library = await ctx.database
        .insertInto('library')
        .values({
          ownerId: user.id,
          name: 'Photos',
          importPaths: ['/photos'],
          exclusionPatterns: [],
        })
        .returning('id')
        .executeTakeFirstOrThrow();
      const capturedAt = new Date('2026-07-18T22:26:06.000Z');
      const [{ asset: jpeg }, { asset: raw }] = await Promise.all([
        ctx.newAsset({
          ownerId: user.id,
          libraryId: library.id,
          originalFileName: 'IMG_1234.JPG',
          originalPath: '/photos/jpeg/IMG_1234.JPG',
          fileCreatedAt: capturedAt,
          localDateTime: capturedAt,
        }),
        ctx.newAsset({
          ownerId: user.id,
          libraryId: library.id,
          originalFileName: 'IMG_1234.RAF',
          originalPath: '/photos/raw/IMG_1234.RAF',
          fileCreatedAt: capturedAt,
          localDateTime: capturedAt,
        }),
      ]);
      await Promise.all([
        ctx.newExif({ assetId: jpeg.id, make: 'FUJIFILM', model: 'X-T5' }),
        ctx.newExif({ assetId: raw.id, make: 'FUJIFILM', model: 'X-T5' }),
      ]);

      await expect(sut.autoStackRawPair(raw.id)).resolves.toBeUndefined();
      await expect(
        ctx.database.selectFrom('stack').select('id').where('ownerId', '=', user.id).execute(),
      ).resolves.toEqual([]);
    });
  });
});
