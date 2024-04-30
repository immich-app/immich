import {
  AssetFileUploadResponseDto,
  AssetResponseDto,
  AssetTypeEnum,
  LibraryResponseDto,
  LoginResponseDto,
  SharedLinkType,
  getAllLibraries,
  getAssetInfo,
  updateAssets,
} from '@immich/sdk';
import { exiftool } from 'exiftool-vendored';
import { DateTime } from 'luxon';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Socket } from 'socket.io-client';
import { createUserDto, uuidDto } from 'src/fixtures';
import { makeRandomImage } from 'src/generators';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, tempDir, testAssetDir, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const makeUploadDto = (options?: { omit: string }): Record<string, any> => {
  const dto: Record<string, any> = {
    deviceAssetId: 'example-image',
    deviceId: 'TEST',
    fileCreatedAt: new Date().toISOString(),
    fileModifiedAt: new Date().toISOString(),
    isFavorite: 'testing',
    duration: '0:00:00.000000',
  };

  const omit = options?.omit;
  if (omit) {
    delete dto[omit];
  }

  return dto;
};

const TEN_TIMES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const locationAssetFilepath = `${testAssetDir}/metadata/gps-position/thompson-springs.jpg`;

const readTags = async (bytes: Buffer, filename: string) => {
  const filepath = join(tempDir, filename);
  await writeFile(filepath, bytes);
  return exiftool.read(filepath);
};

const today = DateTime.fromObject({
  year: 2023,
  month: 11,
  day: 3,
}) as DateTime<true>;
const yesterday = today.minus({ days: 1 });

describe('/asset', () => {
  let admin: LoginResponseDto;
  let websocket: Socket;

  let user1: LoginResponseDto;
  let user2: LoginResponseDto;
  let timeBucketUser: LoginResponseDto;
  let quotaUser: LoginResponseDto;
  let statsUser: LoginResponseDto;
  let stackUser: LoginResponseDto;

  let user1Assets: AssetFileUploadResponseDto[];
  let user2Assets: AssetFileUploadResponseDto[];
  let stackAssets: AssetFileUploadResponseDto[];
  let locationAsset: AssetFileUploadResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });

    [websocket, user1, user2, statsUser, quotaUser, timeBucketUser, stackUser] = await Promise.all([
      utils.connectWebsocket(admin.accessToken),
      utils.userSetup(admin.accessToken, createUserDto.create('1')),
      utils.userSetup(admin.accessToken, createUserDto.create('2')),
      utils.userSetup(admin.accessToken, createUserDto.create('stats')),
      utils.userSetup(admin.accessToken, createUserDto.userQuota),
      utils.userSetup(admin.accessToken, createUserDto.create('time-bucket')),
      utils.userSetup(admin.accessToken, createUserDto.create('stack')),
    ]);

    // asset location
    locationAsset = await utils.createAsset(admin.accessToken, {
      assetData: {
        filename: 'thompson-springs.jpg',
        bytes: await readFile(locationAssetFilepath),
      },
    });

    await utils.waitForWebsocketEvent({ event: 'assetUpload', id: locationAsset.id });

    user1Assets = await Promise.all([
      utils.createAsset(user1.accessToken),
      utils.createAsset(user1.accessToken),
      utils.createAsset(user1.accessToken, {
        isFavorite: true,
        isReadOnly: true,
        fileCreatedAt: yesterday.toISO(),
        fileModifiedAt: yesterday.toISO(),
        assetData: { filename: 'example.mp4' },
      }),
      utils.createAsset(user1.accessToken),
      utils.createAsset(user1.accessToken),
    ]);

    user2Assets = [await utils.createAsset(user2.accessToken)];

    await Promise.all([
      utils.createAsset(timeBucketUser.accessToken, { fileCreatedAt: new Date('1970-01-01').toISOString() }),
      utils.createAsset(timeBucketUser.accessToken, { fileCreatedAt: new Date('1970-02-10').toISOString() }),
      utils.createAsset(timeBucketUser.accessToken, { fileCreatedAt: new Date('1970-02-11').toISOString() }),
      utils.createAsset(timeBucketUser.accessToken, { fileCreatedAt: new Date('1970-02-11').toISOString() }),
    ]);

    for (const asset of [...user1Assets, ...user2Assets]) {
      expect(asset.duplicate).toBe(false);
    }

    await Promise.all([
      // stats
      utils.createAsset(statsUser.accessToken),
      utils.createAsset(statsUser.accessToken, { isFavorite: true }),
      utils.createAsset(statsUser.accessToken, { isArchived: true }),
      utils.createAsset(statsUser.accessToken, {
        isArchived: true,
        isFavorite: true,
        assetData: { filename: 'example.mp4' },
      }),
    ]);

    // stacks
    stackAssets = await Promise.all([
      utils.createAsset(stackUser.accessToken),
      utils.createAsset(stackUser.accessToken),
      utils.createAsset(stackUser.accessToken),
      utils.createAsset(stackUser.accessToken),
      utils.createAsset(stackUser.accessToken),
    ]);

    await updateAssets(
      { assetBulkUpdateDto: { stackParentId: stackAssets[0].id, ids: [stackAssets[1].id, stackAssets[2].id] } },
      { headers: asBearerAuth(stackUser.accessToken) },
    );

    const person1 = await utils.createPerson(user1.accessToken, {
      name: 'Test Person',
    });
    await utils.createFace({
      assetId: user1Assets[0].id,
      personId: person1.id,
    });
  }, 30_000);

  afterAll(() => {
    utils.disconnectWebsocket(websocket);
  });

  describe('GET /asset/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/asset/${uuidDto.notFound}`);
      expect(body).toEqual(errorDto.unauthorized);
      expect(status).toBe(401);
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(app)
        .get(`/asset/${uuidDto.invalid}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });

    it('should require access', async () => {
      const { status, body } = await request(app)
        .get(`/asset/${user2Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
    });

    it('should get the asset info', async () => {
      const { status, body } = await request(app)
        .get(`/asset/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({ id: user1Assets[0].id });
    });

    it('should work with a shared link', async () => {
      const sharedLink = await utils.createSharedLink(user1.accessToken, {
        type: SharedLinkType.Individual,
        assetIds: [user1Assets[0].id],
      });

      const { status, body } = await request(app).get(`/asset/${user1Assets[0].id}?key=${sharedLink.key}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({ id: user1Assets[0].id });
    });

    it('should not send people data for shared links for un-authenticated users', async () => {
      const { status, body } = await request(app)
        .get(`/asset/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toEqual(200);
      expect(body).toMatchObject({
        id: user1Assets[0].id,
        isFavorite: false,
        people: [
          {
            birthDate: null,
            id: expect.any(String),
            isHidden: false,
            name: 'Test Person',
            thumbnailPath: '/my/awesome/thumbnail.jpg',
          },
        ],
      });

      const sharedLink = await utils.createSharedLink(user1.accessToken, {
        type: SharedLinkType.Individual,
        assetIds: [user1Assets[0].id],
      });

      const data = await request(app).get(`/asset/${user1Assets[0].id}?key=${sharedLink.key}`);
      expect(data.status).toBe(200);
      expect(data.body).toMatchObject({ people: [] });
    });
  });

  describe('GET /asset/statistics', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/asset/statistics');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should return stats of all assets', async () => {
      const { status, body } = await request(app)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${statsUser.accessToken}`);

      expect(body).toEqual({ images: 3, videos: 1, total: 4 });
      expect(status).toBe(200);
    });

    it('should return stats of all favored assets', async () => {
      const { status, body } = await request(app)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${statsUser.accessToken}`)
        .query({ isFavorite: true });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 1, videos: 1, total: 2 });
    });

    it('should return stats of all archived assets', async () => {
      const { status, body } = await request(app)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${statsUser.accessToken}`)
        .query({ isArchived: true });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 1, videos: 1, total: 2 });
    });

    it('should return stats of all favored and archived assets', async () => {
      const { status, body } = await request(app)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${statsUser.accessToken}`)
        .query({ isFavorite: true, isArchived: true });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 0, videos: 1, total: 1 });
    });

    it('should return stats of all assets neither favored nor archived', async () => {
      const { status, body } = await request(app)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${statsUser.accessToken}`)
        .query({ isFavorite: false, isArchived: false });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 1, videos: 0, total: 1 });
    });
  });

  describe('GET /asset/random', () => {
    beforeAll(async () => {
      await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);
    });

    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/asset/random');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it.each(TEN_TIMES)('should return 1 random assets', async () => {
      const { status, body } = await request(app)
        .get('/asset/random')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);

      const assets: AssetResponseDto[] = body;
      expect(assets.length).toBe(1);
      expect(assets[0].ownerId).toBe(user1.userId);
    });

    it.each(TEN_TIMES)('should return 2 random assets', async () => {
      const { status, body } = await request(app)
        .get('/asset/random?count=2')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);

      const assets: AssetResponseDto[] = body;
      expect(assets.length).toBe(2);

      for (const asset of assets) {
        expect(asset.ownerId).toBe(user1.userId);
      }
    });

    it.each(TEN_TIMES)(
      'should return 1 asset if there are 10 assets in the database but user 2 only has 1',
      async () => {
        const { status, body } = await request(app)
          .get('/asset/random')
          .set('Authorization', `Bearer ${user2.accessToken}`);

        expect(status).toBe(200);
        expect(body).toEqual([expect.objectContaining({ id: user2Assets[0].id })]);
      },
    );

    it('should return error', async () => {
      const { status } = await request(app)
        .get('/asset/random?count=ABC')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(400);
    });
  });

  describe('PUT /asset/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/asset/:${uuidDto.notFound}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(app)
        .put(`/asset/${uuidDto.invalid}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });

    it('should require access', async () => {
      const { status, body } = await request(app)
        .put(`/asset/${user2Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
    });

    it('should favorite an asset', async () => {
      const before = await utils.getAssetInfo(user1.accessToken, user1Assets[0].id);
      expect(before.isFavorite).toBe(false);

      const { status, body } = await request(app)
        .put(`/asset/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ isFavorite: true });
      expect(body).toMatchObject({ id: user1Assets[0].id, isFavorite: true });
      expect(status).toEqual(200);
    });

    it('should archive an asset', async () => {
      const before = await utils.getAssetInfo(user1.accessToken, user1Assets[0].id);
      expect(before.isArchived).toBe(false);

      const { status, body } = await request(app)
        .put(`/asset/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ isArchived: true });
      expect(body).toMatchObject({ id: user1Assets[0].id, isArchived: true });
      expect(status).toEqual(200);
    });

    it('should update date time original', async () => {
      const { status, body } = await request(app)
        .put(`/asset/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ dateTimeOriginal: '2023-11-19T18:11:00.000-07:00' });

      expect(body).toMatchObject({
        id: user1Assets[0].id,
        exifInfo: expect.objectContaining({
          dateTimeOriginal: '2023-11-20T01:11:00.000Z',
        }),
      });
      expect(status).toEqual(200);
    });

    it('should reject invalid gps coordinates', async () => {
      for (const test of [
        { latitude: 12 },
        { longitude: 12 },
        { latitude: 12, longitude: 'abc' },
        { latitude: 'abc', longitude: 12 },
        { latitude: null, longitude: 12 },
        { latitude: 12, longitude: null },
        { latitude: 91, longitude: 12 },
        { latitude: -91, longitude: 12 },
        { latitude: 12, longitude: -181 },
        { latitude: 12, longitude: 181 },
      ]) {
        const { status, body } = await request(app)
          .put(`/asset/${user1Assets[0].id}`)
          .send(test)
          .set('Authorization', `Bearer ${user1.accessToken}`);
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest());
      }
    });

    it('should update gps data', async () => {
      const { status, body } = await request(app)
        .put(`/asset/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ latitude: 12, longitude: 12 });

      expect(body).toMatchObject({
        id: user1Assets[0].id,
        exifInfo: expect.objectContaining({ latitude: 12, longitude: 12 }),
      });
      expect(status).toEqual(200);
    });

    it('should set the description', async () => {
      const { status, body } = await request(app)
        .put(`/asset/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ description: 'Test asset description' });
      expect(body).toMatchObject({
        id: user1Assets[0].id,
        exifInfo: expect.objectContaining({
          description: 'Test asset description',
        }),
      });
      expect(status).toEqual(200);
    });

    it('should return tagged people', async () => {
      const { status, body } = await request(app)
        .put(`/asset/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ isFavorite: true });
      expect(status).toEqual(200);
      expect(body).toMatchObject({
        id: user1Assets[0].id,
        isFavorite: true,
        people: [
          {
            birthDate: null,
            id: expect.any(String),
            isHidden: false,
            name: 'Test Person',
            thumbnailPath: '/my/awesome/thumbnail.jpg',
          },
        ],
      });
    });
  });

  describe('DELETE /asset', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .delete(`/asset`)
        .send({ ids: [uuidDto.notFound] });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(app)
        .delete(`/asset`)
        .send({ ids: [uuidDto.invalid] })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['each value in ids must be a UUID']));
    });

    it('should throw an error when the id is not found', async () => {
      const { status, body } = await request(app)
        .delete(`/asset`)
        .send({ ids: [uuidDto.notFound] })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Not found or no asset.delete access'));
    });

    it('should move an asset to the trash', async () => {
      const { id: assetId } = await utils.createAsset(admin.accessToken);

      const before = await utils.getAssetInfo(admin.accessToken, assetId);
      expect(before.isTrashed).toBe(false);

      const { status } = await request(app)
        .delete('/asset')
        .send({ ids: [assetId] })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(204);

      const after = await utils.getAssetInfo(admin.accessToken, assetId);
      expect(after.isTrashed).toBe(true);
    });
  });

  describe('POST /asset/upload', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/asset/upload`);
      expect(body).toEqual(errorDto.unauthorized);
      expect(status).toBe(401);
    });

    const invalid = [
      { should: 'require `deviceAssetId`', dto: { ...makeUploadDto({ omit: 'deviceAssetId' }) } },
      { should: 'require `deviceId`', dto: { ...makeUploadDto({ omit: 'deviceId' }) } },
      { should: 'require `fileCreatedAt`', dto: { ...makeUploadDto({ omit: 'fileCreatedAt' }) } },
      { should: 'require `fileModifiedAt`', dto: { ...makeUploadDto({ omit: 'fileModifiedAt' }) } },
      { should: 'require `duration`', dto: { ...makeUploadDto({ omit: 'duration' }) } },
      { should: 'throw if `isFavorite` is not a boolean', dto: { ...makeUploadDto(), isFavorite: 'not-a-boolean' } },
      { should: 'throw if `isVisible` is not a boolean', dto: { ...makeUploadDto(), isVisible: 'not-a-boolean' } },
      { should: 'throw if `isArchived` is not a boolean', dto: { ...makeUploadDto(), isArchived: 'not-a-boolean' } },
    ];

    for (const { should, dto } of invalid) {
      it(`should ${should}`, async () => {
        const { status, body } = await request(app)
          .post('/asset/upload')
          .set('Authorization', `Bearer ${user1.accessToken}`)
          .attach('assetData', makeRandomImage(), 'example.png')
          .field(dto);
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest());
      });
    }

    const tests = [
      {
        input: 'formats/avif/8bit-sRGB.avif',
        expected: {
          type: AssetTypeEnum.Image,
          originalFileName: '8bit-sRGB.avif',
          resized: true,
          exifInfo: {
            description: '',
            exifImageHeight: 1080,
            exifImageWidth: 1617,
            fileSizeInByte: 862_424,
            latitude: null,
            longitude: null,
          },
        },
      },
      {
        input: 'formats/jpg/el_torcal_rocks.jpg',
        expected: {
          type: AssetTypeEnum.Image,
          originalFileName: 'el_torcal_rocks.jpg',
          resized: true,
          exifInfo: {
            dateTimeOriginal: '2012-08-05T11:39:59.000Z',
            exifImageWidth: 512,
            exifImageHeight: 341,
            latitude: null,
            longitude: null,
            focalLength: 75,
            iso: 200,
            fNumber: 11,
            exposureTime: '1/160',
            fileSizeInByte: 53_493,
            make: 'SONY',
            model: 'DSLR-A550',
            orientation: null,
            description: 'SONY DSC',
          },
        },
      },
      {
        input: 'formats/jxl/8bit-sRGB.jxl',
        expected: {
          type: AssetTypeEnum.Image,
          originalFileName: '8bit-sRGB.jxl',
          resized: true,
          exifInfo: {
            description: '',
            exifImageHeight: 1080,
            exifImageWidth: 1440,
            fileSizeInByte: 1_780_777,
            latitude: null,
            longitude: null,
          },
        },
      },
      {
        input: 'formats/heic/IMG_2682.heic',
        expected: {
          type: AssetTypeEnum.Image,
          originalFileName: 'IMG_2682.heic',
          resized: true,
          fileCreatedAt: '2019-03-21T16:04:22.348Z',
          exifInfo: {
            dateTimeOriginal: '2019-03-21T16:04:22.348Z',
            exifImageWidth: 4032,
            exifImageHeight: 3024,
            latitude: 41.2203,
            longitude: -96.071_625,
            make: 'Apple',
            model: 'iPhone 7',
            lensModel: 'iPhone 7 back camera 3.99mm f/1.8',
            fileSizeInByte: 880_703,
            exposureTime: '1/887',
            iso: 20,
            focalLength: 3.99,
            fNumber: 1.8,
            timeZone: 'America/Chicago',
          },
        },
      },
      {
        input: 'formats/png/density_plot.png',
        expected: {
          type: AssetTypeEnum.Image,
          originalFileName: 'density_plot.png',
          resized: true,
          exifInfo: {
            exifImageWidth: 800,
            exifImageHeight: 800,
            latitude: null,
            longitude: null,
            fileSizeInByte: 25_408,
          },
        },
      },
      {
        input: 'formats/raw/Nikon/D80/glarus.nef',
        expected: {
          type: AssetTypeEnum.Image,
          originalFileName: 'glarus.nef',
          resized: true,
          fileCreatedAt: '2010-07-20T17:27:12.000Z',
          exifInfo: {
            make: 'NIKON CORPORATION',
            model: 'NIKON D80',
            exposureTime: '1/200',
            fNumber: 10,
            focalLength: 18,
            iso: 100,
            fileSizeInByte: 9_057_784,
            dateTimeOriginal: '2010-07-20T17:27:12.000Z',
            latitude: null,
            longitude: null,
            orientation: '1',
          },
        },
      },
      {
        input: 'formats/raw/Nikon/D700/philadelphia.nef',
        expected: {
          type: AssetTypeEnum.Image,
          originalFileName: 'philadelphia.nef',
          resized: true,
          fileCreatedAt: '2016-09-22T22:10:29.060Z',
          exifInfo: {
            make: 'NIKON CORPORATION',
            model: 'NIKON D700',
            exposureTime: '1/400',
            fNumber: 11,
            focalLength: 85,
            iso: 200,
            fileSizeInByte: 15_856_335,
            dateTimeOriginal: '2016-09-22T22:10:29.060Z',
            latitude: null,
            longitude: null,
            orientation: '1',
            timeZone: 'UTC-5',
          },
        },
      },
      {
        input: 'formats/raw/Panasonic/DMC-GH4/4_3.rw2',
        expected: {
          type: AssetTypeEnum.Image,
          originalFileName: '4_3.rw2',
          resized: true,
          fileCreatedAt: '2018-05-10T08:42:37.842Z',
          exifInfo: {
            make: 'Panasonic',
            model: 'DMC-GH4',
            exifImageHeight: 3456,
            exifImageWidth: 4608,
            exposureTime: '1/100',
            fNumber: 3.2,
            focalLength: 35,
            iso: 400,
            fileSizeInByte: 19_587_072,
            dateTimeOriginal: '2018-05-10T08:42:37.842Z',
            latitude: null,
            longitude: null,
            orientation: '1',
          },
        },
      },
      {
        input: 'formats/raw/Sony/ILCE-6300/12bit-compressed-(3_2).arw',
        expected: {
          type: AssetTypeEnum.Image,
          originalFileName: '12bit-compressed-(3_2).arw',
          resized: true,
          fileCreatedAt: '2016-09-27T10:51:44.000Z',
          exifInfo: {
            make: 'SONY',
            model: 'ILCE-6300',
            exifImageHeight: 4024,
            exifImageWidth: 6048,
            exposureTime: '1/320',
            fNumber: 8,
            focalLength: 97,
            iso: 100,
            lensModel: 'E PZ 18-105mm F4 G OSS',
            fileSizeInByte: 25_001_984,
            dateTimeOriginal: '2016-09-27T10:51:44.000Z',
            latitude: null,
            longitude: null,
            orientation: '1',
          },
        },
      },
      {
        input: 'formats/raw/Sony/ILCE-7M2/14bit-uncompressed-(3_2).arw',
        expected: {
          type: AssetTypeEnum.Image,
          originalFileName: '14bit-uncompressed-(3_2).arw',
          resized: true,
          fileCreatedAt: '2016-01-08T15:08:01.000Z',
          exifInfo: {
            make: 'SONY',
            model: 'ILCE-7M2',
            exifImageHeight: 4024,
            exifImageWidth: 6048,
            exposureTime: '1.3',
            fNumber: 22,
            focalLength: 25,
            iso: 100,
            lensModel: 'E 25mm F2',
            fileSizeInByte: 49_512_448,
            dateTimeOriginal: '2016-01-08T15:08:01.000Z',
            latitude: null,
            longitude: null,
            orientation: '1',
          },
        },
      },
    ];

    for (const { input, expected } of tests) {
      it(`should upload and generate a thumbnail for ${input}`, async () => {
        const filepath = join(testAssetDir, input);
        const { id, duplicate } = await utils.createAsset(admin.accessToken, {
          assetData: { bytes: await readFile(filepath), filename: basename(filepath) },
        });

        expect(duplicate).toBe(false);

        await utils.waitForWebsocketEvent({ event: 'assetUpload', id: id });

        const asset = await utils.getAssetInfo(admin.accessToken, id);

        expect(asset.exifInfo).toBeDefined();
        expect(asset.exifInfo).toMatchObject(expected.exifInfo);
        expect(asset).toMatchObject(expected);
      });
    }

    it('should handle a duplicate', async () => {
      const filepath = 'formats/jpeg/el_torcal_rocks.jpeg';
      const { duplicate } = await utils.createAsset(admin.accessToken, {
        assetData: {
          bytes: await readFile(join(testAssetDir, filepath)),
          filename: basename(filepath),
        },
      });

      expect(duplicate).toBe(true);
    });

    it("should not upload to another user's library", async () => {
      const libraries = await getAllLibraries({}, { headers: asBearerAuth(admin.accessToken) });
      const library = libraries.find((library) => library.ownerId === user1.userId) as LibraryResponseDto;

      const { body, status } = await request(app)
        .post('/asset/upload')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .field('libraryId', library.id)
        .field('deviceAssetId', 'example-image')
        .field('deviceId', 'e2e')
        .field('fileCreatedAt', new Date().toISOString())
        .field('fileModifiedAt', new Date().toISOString())
        .field('duration', '0:00:00.000000')
        .attach('assetData', makeRandomImage(), 'example.png');

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Not found or no asset.upload access'));
    });

    it('should update the used quota', async () => {
      const { body, status } = await request(app)
        .post('/asset/upload')
        .set('Authorization', `Bearer ${quotaUser.accessToken}`)
        .field('deviceAssetId', 'example-image')
        .field('deviceId', 'e2e')
        .field('fileCreatedAt', new Date().toISOString())
        .field('fileModifiedAt', new Date().toISOString())
        .attach('assetData', makeRandomImage(), 'example.jpg');

      expect(body).toEqual({ id: expect.any(String), duplicate: false });
      expect(status).toBe(201);

      const { body: user } = await request(app).get('/user/me').set('Authorization', `Bearer ${quotaUser.accessToken}`);

      expect(user).toEqual(expect.objectContaining({ quotaUsageInBytes: 70 }));
    });

    it('should not upload an asset if it would exceed the quota', async () => {
      const { body, status } = await request(app)
        .post('/asset/upload')
        .set('Authorization', `Bearer ${quotaUser.accessToken}`)
        .field('deviceAssetId', 'example-image')
        .field('deviceId', 'e2e')
        .field('fileCreatedAt', new Date().toISOString())
        .field('fileModifiedAt', new Date().toISOString())
        .attach('assetData', randomBytes(2014), 'example.jpg');

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Quota has been exceeded!'));
    });

    // These hashes were created by copying the image files to a Samsung phone,
    // exporting the video from Samsung's stock Gallery app, and hashing them locally.
    // This ensures that immich+exiftool are extracting the videos the same way Samsung does.
    // DO NOT assume immich+exiftool are doing things correctly and just copy whatever hash it gives
    // into the test here.
    const motionTests = [
      {
        filepath: 'formats/motionphoto/Samsung One UI 5.jpg',
        checksum: 'fr14niqCq6N20HB8rJYEvpsUVtI=',
      },
      {
        filepath: 'formats/motionphoto/Samsung One UI 6.jpg',
        checksum: 'lT9Uviw/FFJYCjfIxAGPTjzAmmw=',
      },
      {
        filepath: 'formats/motionphoto/Samsung One UI 6.heic',
        checksum: '/ejgzywvgvzvVhUYVfvkLzFBAF0=',
      },
    ];

    for (const { filepath, checksum } of motionTests) {
      it(`should extract motionphoto video from ${filepath}`, async () => {
        const response = await utils.createAsset(admin.accessToken, {
          assetData: {
            bytes: await readFile(join(testAssetDir, filepath)),
            filename: basename(filepath),
          },
        });

        await utils.waitForWebsocketEvent({ event: 'assetUpload', id: response.id });

        expect(response.duplicate).toBe(false);

        const asset = await utils.getAssetInfo(admin.accessToken, response.id);
        expect(asset.livePhotoVideoId).toBeDefined();

        const video = await utils.getAssetInfo(admin.accessToken, asset.livePhotoVideoId as string);
        expect(video.checksum).toStrictEqual(checksum);
      });
    }
  });

  describe('GET /asset/thumbnail/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/asset/thumbnail/${locationAsset.id}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should not include gps data for webp thumbnails', async () => {
      await utils.waitForWebsocketEvent({
        event: 'assetUpload',
        id: locationAsset.id,
      });

      const { status, body, type } = await request(app)
        .get(`/asset/thumbnail/${locationAsset.id}?format=WEBP`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toBeDefined();
      expect(type).toBe('image/webp');

      const exifData = await readTags(body, 'thumbnail.webp');
      expect(exifData).not.toHaveProperty('GPSLongitude');
      expect(exifData).not.toHaveProperty('GPSLatitude');
    });

    it('should not include gps data for jpeg thumbnails', async () => {
      const { status, body, type } = await request(app)
        .get(`/asset/thumbnail/${locationAsset.id}?format=JPEG`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toBeDefined();
      expect(type).toBe('image/jpeg');

      const exifData = await readTags(body, 'thumbnail.jpg');
      expect(exifData).not.toHaveProperty('GPSLongitude');
      expect(exifData).not.toHaveProperty('GPSLatitude');
    });
  });

  describe('GET /asset/file/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/asset/thumbnail/${locationAsset.id}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should download the original', async () => {
      const { status, body, type } = await request(app)
        .get(`/asset/file/${locationAsset.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toBeDefined();
      expect(type).toBe('image/jpeg');

      const asset = await utils.getAssetInfo(admin.accessToken, locationAsset.id);

      const original = await readFile(locationAssetFilepath);
      const originalChecksum = utils.sha1(original);
      const downloadChecksum = utils.sha1(body);

      expect(originalChecksum).toBe(downloadChecksum);
      expect(downloadChecksum).toBe(asset.checksum);
    });
  });

  describe('GET /asset/map-marker', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/asset/map-marker');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    // TODO archive one of these assets
    it('should get map markers for all non-archived assets', async () => {
      const { status, body } = await request(app)
        .get('/asset/map-marker')
        .query({ isArchived: false })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toHaveLength(2);
      expect(body).toEqual([
        {
          city: 'Palisade',
          country: 'United States of America',
          id: expect.any(String),
          lat: expect.closeTo(39.115),
          lon: expect.closeTo(-108.400_968),
          state: 'Colorado',
        },
        {
          city: 'Ralston',
          country: 'United States of America',
          id: expect.any(String),
          lat: expect.closeTo(41.2203),
          lon: expect.closeTo(-96.071_625),
          state: 'Nebraska',
        },
      ]);
    });

    // TODO archive one of these assets
    it('should get all map markers', async () => {
      const { status, body } = await request(app)
        .get('/asset/map-marker')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual([
        {
          city: 'Palisade',
          country: 'United States of America',
          id: expect.any(String),
          lat: expect.closeTo(39.115),
          lon: expect.closeTo(-108.400_968),
          state: 'Colorado',
        },
        {
          city: 'Ralston',
          country: 'United States of America',
          id: expect.any(String),
          lat: expect.closeTo(41.2203),
          lon: expect.closeTo(-96.071_625),
          state: 'Nebraska',
        },
      ]);
    });
  });

  describe('GET /asset', () => {
    it('should return stack data', async () => {
      const { status, body } = await request(app).get('/asset').set('Authorization', `Bearer ${stackUser.accessToken}`);

      const stack = body.find((asset: AssetResponseDto) => asset.id === stackAssets[0].id);

      expect(status).toBe(200);
      expect(stack).toEqual(
        expect.objectContaining({
          stackCount: 3,
          stack:
            // Response includes children at the root level
            expect.arrayContaining([
              expect.objectContaining({ id: stackAssets[1].id }),
              expect.objectContaining({ id: stackAssets[2].id }),
            ]),
        }),
      );
    });
  });

  describe('PUT /asset', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put('/asset');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require a valid parent id', async () => {
      const { status, body } = await request(app)
        .put('/asset')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ stackParentId: uuidDto.invalid, ids: [stackAssets[0].id] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['stackParentId must be a UUID']));
    });

    it('should require access to the parent', async () => {
      const { status, body } = await request(app)
        .put('/asset')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ stackParentId: stackAssets[3].id, ids: [user1Assets[0].id] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
    });

    it('should add stack children', async () => {
      const { status } = await request(app)
        .put('/asset')
        .set('Authorization', `Bearer ${stackUser.accessToken}`)
        .send({ stackParentId: stackAssets[0].id, ids: [stackAssets[3].id] });

      expect(status).toBe(204);

      const asset = await getAssetInfo({ id: stackAssets[0].id }, { headers: asBearerAuth(stackUser.accessToken) });
      expect(asset.stack).not.toBeUndefined();
      expect(asset.stack).toEqual(expect.arrayContaining([expect.objectContaining({ id: stackAssets[3].id })]));
    });

    it('should remove stack children', async () => {
      const { status } = await request(app)
        .put('/asset')
        .set('Authorization', `Bearer ${stackUser.accessToken}`)
        .send({ removeParent: true, ids: [stackAssets[1].id] });

      expect(status).toBe(204);

      const asset = await getAssetInfo({ id: stackAssets[0].id }, { headers: asBearerAuth(stackUser.accessToken) });
      expect(asset.stack).not.toBeUndefined();
      expect(asset.stack).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: stackAssets[2].id }),
          expect.objectContaining({ id: stackAssets[3].id }),
        ]),
      );
    });

    it('should remove all stack children', async () => {
      const { status } = await request(app)
        .put('/asset')
        .set('Authorization', `Bearer ${stackUser.accessToken}`)
        .send({ removeParent: true, ids: [stackAssets[2].id, stackAssets[3].id] });

      expect(status).toBe(204);

      const asset = await getAssetInfo({ id: stackAssets[0].id }, { headers: asBearerAuth(stackUser.accessToken) });
      expect(asset.stack).toBeUndefined();
    });

    it('should merge stack children', async () => {
      // create stack after previous test removed stack children
      await updateAssets(
        { assetBulkUpdateDto: { stackParentId: stackAssets[0].id, ids: [stackAssets[1].id, stackAssets[2].id] } },
        { headers: asBearerAuth(stackUser.accessToken) },
      );

      const { status } = await request(app)
        .put('/asset')
        .set('Authorization', `Bearer ${stackUser.accessToken}`)
        .send({ stackParentId: stackAssets[3].id, ids: [stackAssets[0].id] });

      expect(status).toBe(204);

      const asset = await getAssetInfo({ id: stackAssets[3].id }, { headers: asBearerAuth(stackUser.accessToken) });
      expect(asset.stack).not.toBeUndefined();
      expect(asset.stack).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: stackAssets[0].id }),
          expect.objectContaining({ id: stackAssets[1].id }),
          expect.objectContaining({ id: stackAssets[2].id }),
        ]),
      );
    });
  });

  describe('PUT /asset/stack/parent', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put('/asset/stack/parent');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(app)
        .put('/asset/stack/parent')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ oldParentId: uuidDto.invalid, newParentId: uuidDto.invalid });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should require access', async () => {
      const { status, body } = await request(app)
        .put('/asset/stack/parent')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ oldParentId: stackAssets[3].id, newParentId: stackAssets[0].id });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
    });

    it('should make old parent child of new parent', async () => {
      const { status } = await request(app)
        .put('/asset/stack/parent')
        .set('Authorization', `Bearer ${stackUser.accessToken}`)
        .send({ oldParentId: stackAssets[3].id, newParentId: stackAssets[0].id });

      expect(status).toBe(200);

      const asset = await getAssetInfo({ id: stackAssets[0].id }, { headers: asBearerAuth(stackUser.accessToken) });

      // new parent
      expect(asset.stack).not.toBeUndefined();
      expect(asset.stack).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: stackAssets[1].id }),
          expect.objectContaining({ id: stackAssets[2].id }),
          expect.objectContaining({ id: stackAssets[3].id }),
        ]),
      );
    });
  });
});
