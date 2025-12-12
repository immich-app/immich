import { Kysely } from 'kysely';
import { DateTime } from 'luxon';
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

describe('exif date time', () => {
  it('should prioritize DateTimeOriginal', async () => {
    const { ctx, sut, asset } = await setup('metadata/dates/date-priority-test.jpg');

    await sut.handleMetadataExtraction({ id: asset.id });

    await expect(ctx.getDates(asset.id)).resolves.toEqual({
      timeZone: null,
      dateTimeOriginal: DateTime.fromISO('2023-02-02T02:00:00.000Z').toJSDate(),
      localDateTime: DateTime.fromISO('2023-02-02T02:00:00.000Z').toJSDate(),
      fileCreatedAt: DateTime.fromISO('2023-02-02T02:00:00.000Z').toJSDate(),
    });
  });

  it('should extract GPSDateTime with GPS coordinates ', async () => {
    const { ctx, sut, asset } = await setup('metadata/dates/gps-datetime.jpg');

    await sut.handleMetadataExtraction({ id: asset.id });

    await expect(ctx.getDates(asset.id)).resolves.toEqual({
      timeZone: 'America/Los_Angeles',
      dateTimeOriginal: DateTime.fromISO('2023-11-15T12:30:00.000Z').toJSDate(),
      localDateTime: DateTime.fromISO('2023-11-15T04:30:00.000Z').toJSDate(),
      fileCreatedAt: DateTime.fromISO('2023-11-15T12:30:00.000Z').toJSDate(),
    });
  });

  it('should ignore the TimeCreated tag', async () => {
    const { ctx, sut, asset } = await setup('metadata/dates/time-created.jpg');

    await sut.handleMetadataExtraction({ id: asset.id });

    const stats = ctx.getMockStats();

    await expect(ctx.getDates(asset.id)).resolves.toEqual({
      timeZone: null,
      dateTimeOriginal: stats.mtime,
      localDateTime: stats.mtime,
      fileCreatedAt: stats.mtime,
    });
  });
});
