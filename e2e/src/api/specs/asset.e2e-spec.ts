import {
  AssetFileUploadResponseDto,
  AssetResponseDto,
  AssetTypeEnum,
  LoginResponseDto,
  SharedLinkType,
} from '@immich/sdk';
import { exiftool } from 'exiftool-vendored';
import { DateTime } from 'luxon';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Socket } from 'socket.io-client';
import { createUserDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { apiUtils, app, dbUtils, fileUtils, tempDir, testAssetDir, wsUtils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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
  let user1: LoginResponseDto;
  let user2: LoginResponseDto;
  let userStats: LoginResponseDto;
  let user1Assets: AssetFileUploadResponseDto[];
  let user2Assets: AssetFileUploadResponseDto[];
  let assetLocation: AssetFileUploadResponseDto;
  let ws: Socket;

  beforeAll(async () => {
    apiUtils.setup();
    await dbUtils.reset();
    admin = await apiUtils.adminSetup({ onboarding: false });

    [ws, user1, user2, userStats] = await Promise.all([
      wsUtils.connect(admin.accessToken),
      apiUtils.userSetup(admin.accessToken, createUserDto.user1),
      apiUtils.userSetup(admin.accessToken, createUserDto.user2),
      apiUtils.userSetup(admin.accessToken, createUserDto.user3),
    ]);

    // asset location
    assetLocation = await apiUtils.createAsset(admin.accessToken, {
      assetData: {
        filename: 'thompson-springs.jpg',
        bytes: await readFile(locationAssetFilepath),
      },
    });

    await wsUtils.waitForEvent({ event: 'upload', assetId: assetLocation.id });

    user1Assets = await Promise.all([
      apiUtils.createAsset(user1.accessToken),
      apiUtils.createAsset(user1.accessToken),
      apiUtils.createAsset(user1.accessToken, {
        isFavorite: true,
        isReadOnly: true,
        fileCreatedAt: yesterday.toISO(),
        fileModifiedAt: yesterday.toISO(),
        assetData: { filename: 'example.mp4' },
      }),
      apiUtils.createAsset(user1.accessToken),
      apiUtils.createAsset(user1.accessToken),
    ]);

    user2Assets = await Promise.all([apiUtils.createAsset(user2.accessToken)]);

    for (const asset of [...user1Assets, ...user2Assets]) {
      expect(asset.duplicate).toBe(false);
    }

    await Promise.all([
      // stats
      apiUtils.createAsset(userStats.accessToken),
      apiUtils.createAsset(userStats.accessToken, { isFavorite: true }),
      apiUtils.createAsset(userStats.accessToken, { isArchived: true }),
      apiUtils.createAsset(userStats.accessToken, {
        isArchived: true,
        isFavorite: true,
        assetData: { filename: 'example.mp4' },
      }),
    ]);

    const person1 = await apiUtils.createPerson(user1.accessToken, {
      name: 'Test Person',
    });
    await dbUtils.createFace({
      assetId: user1Assets[0].id,
      personId: person1.id,
    });
  }, 30_000);

  afterAll(() => {
    wsUtils.disconnect(ws);
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
      const sharedLink = await apiUtils.createSharedLink(user1.accessToken, {
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

      const sharedLink = await apiUtils.createSharedLink(user1.accessToken, {
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
        .set('Authorization', `Bearer ${userStats.accessToken}`);

      expect(body).toEqual({ images: 3, videos: 1, total: 4 });
      expect(status).toBe(200);
    });

    it('should return stats of all favored assets', async () => {
      const { status, body } = await request(app)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${userStats.accessToken}`)
        .query({ isFavorite: true });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 1, videos: 1, total: 2 });
    });

    it('should return stats of all archived assets', async () => {
      const { status, body } = await request(app)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${userStats.accessToken}`)
        .query({ isArchived: true });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 1, videos: 1, total: 2 });
    });

    it('should return stats of all favored and archived assets', async () => {
      const { status, body } = await request(app)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${userStats.accessToken}`)
        .query({ isFavorite: true, isArchived: true });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 0, videos: 1, total: 1 });
    });

    it('should return stats of all assets neither favored nor archived', async () => {
      const { status, body } = await request(app)
        .get('/asset/statistics')
        .set('Authorization', `Bearer ${userStats.accessToken}`)
        .query({ isFavorite: false, isArchived: false });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 1, videos: 0, total: 1 });
    });
  });

  describe('GET /asset/random', () => {
    beforeAll(async () => {
      await Promise.all([
        apiUtils.createAsset(user1.accessToken),
        apiUtils.createAsset(user1.accessToken),
        apiUtils.createAsset(user1.accessToken),
        apiUtils.createAsset(user1.accessToken),
        apiUtils.createAsset(user1.accessToken),
        apiUtils.createAsset(user1.accessToken),
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
      const before = await apiUtils.getAssetInfo(user1.accessToken, user1Assets[0].id);
      expect(before.isFavorite).toBe(false);

      const { status, body } = await request(app)
        .put(`/asset/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ isFavorite: true });
      expect(body).toMatchObject({ id: user1Assets[0].id, isFavorite: true });
      expect(status).toEqual(200);
    });

    it('should archive an asset', async () => {
      const before = await apiUtils.getAssetInfo(user1.accessToken, user1Assets[0].id);
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
      const { id: assetId } = await apiUtils.createAsset(admin.accessToken);

      const before = await apiUtils.getAssetInfo(admin.accessToken, assetId);
      expect(before.isTrashed).toBe(false);

      const { status } = await request(app)
        .delete('/asset')
        .send({ ids: [assetId] })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(204);

      const after = await apiUtils.getAssetInfo(admin.accessToken, assetId);
      expect(after.isTrashed).toBe(true);
    });
  });

  describe('POST /asset/upload', () => {
    const tests = [
      {
        input: 'formats/jpg/el_torcal_rocks.jpg',
        expected: {
          type: AssetTypeEnum.Image,
          originalFileName: 'el_torcal_rocks',
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
        input: 'formats/heic/IMG_2682.heic',
        expected: {
          type: AssetTypeEnum.Image,
          originalFileName: 'IMG_2682',
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
          originalFileName: 'density_plot',
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
          originalFileName: 'glarus',
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
          originalFileName: 'philadelphia',
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
    ];

    for (const { input, expected } of tests) {
      it(`should generate a thumbnail for ${input}`, async () => {
        const filepath = join(testAssetDir, input);
        const { id, duplicate } = await apiUtils.createAsset(admin.accessToken, {
          assetData: { bytes: await readFile(filepath), filename: basename(filepath) },
        });

        expect(duplicate).toBe(false);

        await wsUtils.waitForEvent({ event: 'upload', assetId: id });

        const asset = await apiUtils.getAssetInfo(admin.accessToken, id);

        expect(asset.exifInfo).toBeDefined();
        expect(asset.exifInfo).toMatchObject(expected.exifInfo);
        expect(asset).toMatchObject(expected);
      });
    }

    it('should handle a duplicate', async () => {
      const filepath = 'formats/jpeg/el_torcal_rocks.jpeg';
      const { duplicate } = await apiUtils.createAsset(admin.accessToken, {
        assetData: {
          bytes: await readFile(join(testAssetDir, filepath)),
          filename: basename(filepath),
        },
      });

      expect(duplicate).toBe(true);
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
        const response = await apiUtils.createAsset(admin.accessToken, {
          assetData: {
            bytes: await readFile(join(testAssetDir, filepath)),
            filename: basename(filepath),
          },
        });

        await wsUtils.waitForEvent({ event: 'upload', assetId: response.id });

        expect(response.duplicate).toBe(false);

        const asset = await apiUtils.getAssetInfo(admin.accessToken, response.id);
        expect(asset.livePhotoVideoId).toBeDefined();

        const video = await apiUtils.getAssetInfo(admin.accessToken, asset.livePhotoVideoId as string);
        expect(video.checksum).toStrictEqual(checksum);
      });
    }
  });

  describe('GET /asset/thumbnail/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/asset/thumbnail/${assetLocation.id}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should not include gps data for webp thumbnails', async () => {
      const { status, body, type } = await request(app)
        .get(`/asset/thumbnail/${assetLocation.id}?format=WEBP`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      await wsUtils.waitForEvent({
        event: 'upload',
        assetId: assetLocation.id,
      });

      expect(status).toBe(200);
      expect(body).toBeDefined();
      expect(type).toBe('image/webp');

      const exifData = await readTags(body, 'thumbnail.webp');
      expect(exifData).not.toHaveProperty('GPSLongitude');
      expect(exifData).not.toHaveProperty('GPSLatitude');
    });

    it('should not include gps data for jpeg thumbnails', async () => {
      const { status, body, type } = await request(app)
        .get(`/asset/thumbnail/${assetLocation.id}?format=JPEG`)
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
      const { status, body } = await request(app).get(`/asset/thumbnail/${assetLocation.id}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should download the original', async () => {
      const { status, body, type } = await request(app)
        .get(`/asset/file/${assetLocation.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toBeDefined();
      expect(type).toBe('image/jpeg');

      const asset = await apiUtils.getAssetInfo(admin.accessToken, assetLocation.id);

      const original = await readFile(locationAssetFilepath);
      const originalChecksum = fileUtils.sha1(original);
      const downloadChecksum = fileUtils.sha1(body);

      expect(originalChecksum).toBe(downloadChecksum);
      expect(downloadChecksum).toBe(asset.checksum);
    });
  });
});
