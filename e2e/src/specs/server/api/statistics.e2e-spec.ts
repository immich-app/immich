import { LoginResponseDto } from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

type ExifSeed = {
  fileSizeInByte: number;
  make: string;
  model: string;
  lensModel: string;
  city: string;
  country: string;
};

const upsertExif = async (
  client: Awaited<ReturnType<typeof utils.connectDatabase>>,
  assetId: string,
  exif: ExifSeed,
) => {
  await client.query(
    `
      INSERT INTO "asset_exif" (
        "assetId",
        "fileSizeInByte",
        "make",
        "model",
        "lensModel",
        "city",
        "country"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT ("assetId") DO UPDATE SET
        "fileSizeInByte" = EXCLUDED."fileSizeInByte",
        "make" = EXCLUDED."make",
        "model" = EXCLUDED."model",
        "lensModel" = EXCLUDED."lensModel",
        "city" = EXCLUDED."city",
        "country" = EXCLUDED."country"
    `,
    [assetId, exif.fileSizeInByte, exif.make, exif.model, exif.lensModel, exif.city, exif.country],
  );
};

const createStatisticsAsset = async (
  accessToken: string,
  index: number,
  fileCreatedAt: Date,
  filename: string,
) => {
  return utils.createAsset(accessToken, {
    deviceAssetId: `statistics-${index}`,
    deviceId: 'statistics',
    fileCreatedAt: fileCreatedAt.toISOString(),
    fileModifiedAt: fileCreatedAt.toISOString(),
    assetData: { filename },
  });
};

describe('/users/me/statistics', () => {
  let admin: LoginResponseDto;
  let emptyUser: LoginResponseDto;
  let statsUser: LoginResponseDto;

  beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });
    emptyUser = await utils.userSetup(admin.accessToken, createUserDto.user1);
    statsUser = await utils.userSetup(admin.accessToken, createUserDto.user2);

    const seeded = [
      {
        date: new Date(Date.UTC(2025, 0, 6, 8)),
        filename: 'statistics-1.jpg',
        exif: {
          fileSizeInByte: 100,
          make: 'Canon',
          model: 'EOS R',
          lensModel: 'RF 50mm',
          city: 'Austin',
          country: 'United States of America',
        },
      },
      {
        date: new Date(Date.UTC(2025, 0, 7, 9)),
        filename: 'statistics-2.jpg',
        exif: {
          fileSizeInByte: 200,
          make: 'Canon',
          model: 'EOS R',
          lensModel: 'RF 50mm',
          city: 'Austin',
          country: 'United States of America',
        },
      },
      {
        date: new Date(Date.UTC(2025, 1, 3, 10)),
        filename: 'statistics-3.jpg',
        exif: {
          fileSizeInByte: 300,
          make: 'Nikon',
          model: 'D850',
          lensModel: '24-70',
          city: 'Tokyo',
          country: 'Japan',
        },
      },
      {
        date: new Date(Date.UTC(2025, 1, 4, 11)),
        filename: 'statistics-4.mp4',
        exif: {
          fileSizeInByte: 400,
          make: 'Nikon',
          model: 'D850',
          lensModel: '24-70',
          city: 'Tokyo',
          country: 'Japan',
        },
      },
      {
        date: new Date(Date.UTC(2025, 2, 5, 12)),
        filename: 'statistics-5.jpg',
        exif: {
          fileSizeInByte: 500,
          make: 'Canon',
          model: 'EOS R',
          lensModel: 'RF 50mm',
          city: 'Austin',
          country: 'United States of America',
        },
      },
      {
        date: new Date(Date.UTC(2025, 2, 6, 13)),
        filename: 'statistics-6.jpg',
        exif: {
          fileSizeInByte: 600,
          make: 'Sony',
          model: 'A7',
          lensModel: '85mm',
          city: 'Berlin',
          country: 'Germany',
        },
      },
    ] as const;

    const createdAssets = await Promise.all(
      seeded.map((entry, index) => createStatisticsAsset(statsUser.accessToken, index, entry.date, entry.filename)),
    );

    await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction', 60_000);

    const client = await utils.connectDatabase();
    for (const [index, asset] of createdAssets.entries()) {
      await upsertExif(client, asset.id, seeded[index].exif);
    }

    const ada = await utils.createPerson(statsUser.accessToken, { name: 'Ada Lovelace' });
    const grace = await utils.createPerson(statsUser.accessToken, { name: 'Grace Hopper' });

    await utils.createFace({ assetId: createdAssets[0].id, personId: ada.id });
    await utils.createFace({ assetId: createdAssets[1].id, personId: ada.id });
    await utils.createFace({ assetId: createdAssets[2].id, personId: ada.id });
    await utils.createFace({ assetId: createdAssets[2].id, personId: grace.id });
    await utils.createFace({ assetId: createdAssets[3].id, personId: grace.id });
    await utils.createFace({ assetId: createdAssets[4].id, personId: ada.id });
    await utils.createFace({ assetId: createdAssets[5].id, personId: ada.id });

  }, 120_000);

  it('requires authentication', async () => {
    const { status, body } = await request(app).get('/users/me/statistics');

    expect(status).toBe(401);
    expect(body).toEqual(errorDto.unauthorized);
  });

  it('returns empty statistics for a new user', async () => {
    const { status, body } = await request(app)
      .get('/users/me/statistics')
      .set('Authorization', `Bearer ${emptyUser.accessToken}`);

    expect(status).toBe(200);
    expect(body).toEqual({
      monthly: [],
      temporalMatrix: [],
      topPeople: [],
      topCameras: [],
      topLenses: [],
      topCities: [],
      topCountries: [],
      storage: [],
      total: { photos: 0, videos: 0, storage: 0 },
    });
  });

  it('returns monthly and temporal statistics for seeded assets', async () => {
    const { status, body } = await request(app)
      .get('/users/me/statistics')
      .set('Authorization', `Bearer ${statsUser.accessToken}`);

    expect(status).toBe(200);
    expect(body.monthly).toEqual([
      { year: 2025, month: 1, count: 2 },
      { year: 2025, month: 2, count: 2 },
      { year: 2025, month: 3, count: 2 },
    ]);
    expect(body.temporalMatrix).toEqual([
      { dayOfWeek: 1, hour: 8, count: 1 },
      { dayOfWeek: 1, hour: 10, count: 1 },
      { dayOfWeek: 2, hour: 9, count: 1 },
      { dayOfWeek: 2, hour: 11, count: 1 },
      { dayOfWeek: 3, hour: 12, count: 1 },
      { dayOfWeek: 4, hour: 13, count: 1 },
    ]);
  });

  it('returns people and camera breakdowns for seeded assets', async () => {
    const { body } = await request(app)
      .get('/users/me/statistics')
      .set('Authorization', `Bearer ${statsUser.accessToken}`);

    expect(body.topPeople).toEqual([
      expect.objectContaining({ name: 'Ada Lovelace', count: 5 }),
      expect.objectContaining({ name: 'Grace Hopper', count: 2 }),
    ]);
    expect(body.topCameras).toEqual([
      { make: 'Canon', model: 'EOS R', count: 3 },
      { make: 'Nikon', model: 'D850', count: 2 },
      { make: 'Sony', model: 'A7', count: 1 },
    ]);
    expect(body.topLenses).toEqual([
      { lensModel: 'RF 50mm', count: 3 },
      { lensModel: '24-70', count: 2 },
      { lensModel: '85mm', count: 1 },
    ]);
    expect(body.topCities).toEqual([
      { city: 'Austin', count: 3 },
      { city: 'Tokyo', count: 2 },
      { city: 'Berlin', count: 1 },
    ]);
    expect(body.topCountries).toEqual([
      { country: 'United States of America', count: 3 },
      { country: 'Japan', count: 2 },
      { country: 'Germany', count: 1 },
    ]);
  });

  it('returns storage totals for seeded assets', async () => {
    const { body } = await request(app)
      .get('/users/me/statistics')
      .set('Authorization', `Bearer ${statsUser.accessToken}`);

    expect(body.storage).toEqual(
      expect.arrayContaining([
        { type: 'IMAGE', size: 1700, count: 5 },
        { type: 'VIDEO', size: 400, count: 1 },
      ]),
    );
    expect(body.total).toEqual({ photos: 5, videos: 1, storage: 2100 });
  });
});
