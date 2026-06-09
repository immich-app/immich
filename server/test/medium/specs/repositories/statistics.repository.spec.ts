import { Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { AssetType, AssetVisibility } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { StatisticsRepository } from 'src/repositories/statistics.repository';
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

  return { ctx, sut: new StatisticsRepository(ctx.database) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(StatisticsRepository.name, () => {
  it('should return empty results for an empty library', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();

    await expect(sut.getMonthlyCounts(user.id)).resolves.toEqual([]);
    await expect(sut.getTemporalMatrix(user.id)).resolves.toEqual([]);
    await expect(sut.getTopPeople(user.id)).resolves.toEqual([]);
    await expect(sut.getTopCameras(user.id)).resolves.toEqual([]);
    await expect(sut.getTopLenses(user.id)).resolves.toEqual([]);
    await expect(sut.getTopCities(user.id)).resolves.toEqual([]);
    await expect(sut.getTopCountries(user.id)).resolves.toEqual([]);
    await expect(sut.getStorageByType(user.id)).resolves.toEqual([]);
  });

  it('should aggregate per-user data and ignore other users and assets without exif', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { user: otherUser } = await ctx.newUser();

    const { asset: januaryImage } = await ctx.newAsset({
      ownerId: user.id,
      type: AssetType.Image,
      fileCreatedAt: DateTime.fromISO('2026-01-05T10:00:00.000Z').toJSDate(),
    });
    const { asset: januaryVideo } = await ctx.newAsset({
      ownerId: user.id,
      type: AssetType.Video,
      fileCreatedAt: DateTime.fromISO('2026-01-05T11:00:00.000Z').toJSDate(),
    });
    // February image intentionally has no exif row: it must still be counted for
    // monthly/temporal/storage aggregates, but never appear in camera/lens/location stats.
    await ctx.newAsset({
      ownerId: user.id,
      type: AssetType.Image,
      fileCreatedAt: DateTime.fromISO('2026-02-10T12:00:00.000Z').toJSDate(),
    });
    const { asset: otherUsersImage } = await ctx.newAsset({
      ownerId: otherUser.id,
      type: AssetType.Image,
      fileCreatedAt: DateTime.fromISO('2026-01-05T10:00:00.000Z').toJSDate(),
    });

    const { person } = await ctx.newPerson({ ownerId: user.id });

    await Promise.all([
      ctx.newExif({
        assetId: januaryImage.id,
        fileSizeInByte: 100,
        make: 'Canon',
        model: 'EOS R',
        lensModel: 'RF 50mm',
        city: 'Austin',
        country: 'United States of America',
      }),
      ctx.newExif({
        assetId: januaryVideo.id,
        fileSizeInByte: 200,
        make: 'Canon',
        model: 'EOS R',
        lensModel: 'RF 50mm',
        city: 'Austin',
        country: 'United States of America',
      }),
      ctx.newExif({
        assetId: otherUsersImage.id,
        fileSizeInByte: 400,
        make: 'Sony',
        model: 'Alpha 7',
        lensModel: 'FE 24-70mm',
        city: 'Berlin',
        country: 'Germany',
      }),
      ctx.newAssetFace({ assetId: januaryImage.id, personId: person.id }),
      ctx.newAssetFace({ assetId: januaryVideo.id, personId: person.id }),
    ]);

    const monthly = await sut.getMonthlyCounts(user.id);
    expect(
      monthly.map((row) => ({ year: Number(row.year), month: Number(row.month), count: Number(row.count) })),
    ).toEqual([
      { year: 2026, month: 1, count: 2 },
      { year: 2026, month: 2, count: 1 },
    ]);

    const temporalMatrix = await sut.getTemporalMatrix(user.id);
    expect(temporalMatrix).toHaveLength(3);
    expect(temporalMatrix.map((row) => Number(row.count))).toEqual([1, 1, 1]);

    const topPeople = await sut.getTopPeople(user.id);
    expect(topPeople).toHaveLength(1);
    expect(topPeople[0].id).toBe(person.id);
    expect(Number(topPeople[0].count)).toBe(2);

    const topCameras = await sut.getTopCameras(user.id);
    expect(topCameras.map((row) => ({ make: row.make, model: row.model, count: Number(row.count) }))).toEqual([
      { make: 'Canon', model: 'EOS R', count: 2 },
    ]);

    const topLenses = await sut.getTopLenses(user.id);
    expect(topLenses.map((row) => ({ lensModel: row.lensModel, count: Number(row.count) }))).toEqual([
      { lensModel: 'RF 50mm', count: 2 },
    ]);

    const topCities = await sut.getTopCities(user.id);
    expect(topCities.map((row) => ({ city: row.city, count: Number(row.count) }))).toEqual([
      { city: 'Austin', count: 2 },
    ]);

    const topCountries = await sut.getTopCountries(user.id);
    expect(topCountries.map((row) => ({ country: row.country, count: Number(row.count) }))).toEqual([
      { country: 'United States of America', count: 2 },
    ]);

    const storage = await sut.getStorageByType(user.id);
    expect(storage.map((row) => ({ type: row.type, size: Number(row.size), count: Number(row.count) }))).toEqual(
      expect.arrayContaining([
        { type: AssetType.Image, size: 100, count: 2 },
        { type: AssetType.Video, size: 200, count: 1 },
      ]),
    );

    // the other user's library must never leak into these results
    expect(topCameras).not.toEqual(expect.arrayContaining([expect.objectContaining({ make: 'Sony' })]));
    expect(topLenses).not.toEqual(expect.arrayContaining([expect.objectContaining({ lensModel: 'FE 24-70mm' })]));
    expect(topCities).not.toEqual(expect.arrayContaining([expect.objectContaining({ city: 'Berlin' })]));
    expect(topCountries).not.toEqual(expect.arrayContaining([expect.objectContaining({ country: 'Germany' })]));
  });

  it('should treat a missing exif file size as zero in storage stats', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();

    const { asset: withExif } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Image });
    // second image has no exif row -> contributes 0 bytes but is still counted
    await ctx.newAsset({ ownerId: user.id, type: AssetType.Image });

    await ctx.newExif({ assetId: withExif.id, fileSizeInByte: 50 });

    const storage = await sut.getStorageByType(user.id);

    expect(storage.map((row) => ({ type: row.type, size: Number(row.size), count: Number(row.count) }))).toEqual([
      { type: AssetType.Image, size: 50, count: 2 },
    ]);
  });

  it('should only count visible, non-deleted faces on timeline assets for topPeople', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { person } = await ctx.newPerson({ ownerId: user.id });

    const { asset: counted } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
    const { asset: deletedFaceAsset } = await ctx.newAsset({
      ownerId: user.id,
      visibility: AssetVisibility.Timeline,
    });
    const { asset: archiveAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Archive });
    const { asset: notVisibleFace } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });

    await ctx.newAssetFace({ assetId: counted.id, personId: person.id, isVisible: true, deletedAt: null });
    await ctx.newAssetFace({
      assetId: deletedFaceAsset.id,
      personId: person.id,
      isVisible: true,
      deletedAt: new Date(),
    });
    await ctx.newAssetFace({ assetId: archiveAsset.id, personId: person.id, isVisible: true, deletedAt: null });
    await ctx.newAssetFace({ assetId: notVisibleFace.id, personId: person.id, isVisible: false, deletedAt: null });

    const topPeople = await sut.getTopPeople(user.id);

    expect(topPeople).toHaveLength(1);
    expect(topPeople[0].id).toBe(person.id);
    expect(Number(topPeople[0].count)).toBe(1);
  });

  it('should exclude null camera/lens/city/country values and order by count', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();

    // Canon x3
    for (let i = 0; i < 3; i++) {
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({
        assetId: asset.id,
        fileSizeInByte: 10,
        make: 'Canon',
        model: 'EOS R',
        lensModel: 'RF 50mm',
        city: 'Austin',
        country: 'USA',
      });
    }

    // Nikon x2
    for (let i = 0; i < 2; i++) {
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({
        assetId: asset.id,
        fileSizeInByte: 20,
        make: 'Nikon',
        model: 'D850',
        lensModel: '24-70',
        city: 'Tokyo',
        country: 'Japan',
      });
    }

    // Sony x1 with null lens/city/country
    const { asset: sony } = await ctx.newAsset({ ownerId: user.id });
    await ctx.newExif({
      assetId: sony.id,
      fileSizeInByte: 30,
      make: 'Sony',
      model: 'A7',
      lensModel: null,
      city: null,
      country: null,
    });

    // null camera (must be excluded from every breakdown)
    const { asset: nullCam } = await ctx.newAsset({ ownerId: user.id });
    await ctx.newExif({
      assetId: nullCam.id,
      fileSizeInByte: 40,
      make: null,
      model: null,
      lensModel: null,
      city: null,
      country: null,
    });

    const topCameras = await sut.getTopCameras(user.id);
    expect(topCameras.map((row) => ({ make: row.make, model: row.model, count: Number(row.count) }))).toEqual([
      { make: 'Canon', model: 'EOS R', count: 3 },
      { make: 'Nikon', model: 'D850', count: 2 },
      { make: 'Sony', model: 'A7', count: 1 },
    ]);

    const topLenses = await sut.getTopLenses(user.id);
    expect(topLenses.map((row) => ({ lensModel: row.lensModel, count: Number(row.count) }))).toEqual(
      expect.arrayContaining([
        { lensModel: 'RF 50mm', count: 3 },
        { lensModel: '24-70', count: 2 },
      ]),
    );
    expect(topLenses).not.toEqual(expect.arrayContaining([expect.objectContaining({ lensModel: null })]));

    const topCities = await sut.getTopCities(user.id);
    expect(topCities.map((row) => ({ city: row.city, count: Number(row.count) }))).toEqual(
      expect.arrayContaining([
        { city: 'Austin', count: 3 },
        { city: 'Tokyo', count: 2 },
      ]),
    );

    const topCountries = await sut.getTopCountries(user.id);
    expect(topCountries.map((row) => ({ country: row.country, count: Number(row.count) }))).toEqual(
      expect.arrayContaining([
        { country: 'USA', count: 3 },
        { country: 'Japan', count: 2 },
      ]),
    );
  });
});
