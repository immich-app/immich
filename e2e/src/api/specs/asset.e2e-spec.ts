import {
  AssetMediaResponseDto,
  AssetMediaStatus,
  AssetResponseDto,
  AssetTypeEnum,
  LoginResponseDto,
  SharedLinkType,
  getAssetInfo,
  getConfig,
  getMyUser,
  updateConfig,
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
const ratingAssetFilepath = `${testAssetDir}/metadata/rating/mongolels.jpg`;
const facesAssetFilepath = `${testAssetDir}/metadata/faces/portrait.jpg`;

const getSystemConfig = (accessToken: string) => getConfig({ headers: asBearerAuth(accessToken) });

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

  let user1Assets: AssetMediaResponseDto[];
  let user2Assets: AssetMediaResponseDto[];
  let locationAsset: AssetMediaResponseDto;
  let ratingAsset: AssetMediaResponseDto;

  const setupTests = async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });

    [websocket, user1, user2, statsUser, quotaUser, timeBucketUser] = await Promise.all([
      utils.connectWebsocket(admin.accessToken),
      utils.userSetup(admin.accessToken, createUserDto.create('1')),
      utils.userSetup(admin.accessToken, createUserDto.create('2')),
      utils.userSetup(admin.accessToken, createUserDto.create('stats')),
      utils.userSetup(admin.accessToken, createUserDto.userQuota),
      utils.userSetup(admin.accessToken, createUserDto.create('time-bucket')),
    ]);

    await utils.createPartner(user1.accessToken, user2.userId);

    // asset location
    locationAsset = await utils.createAsset(admin.accessToken, {
      assetData: {
        filename: 'thompson-springs.jpg',
        bytes: await readFile(locationAssetFilepath),
      },
    });

    await utils.waitForWebsocketEvent({ event: 'assetUpload', id: locationAsset.id });

    // asset rating
    ratingAsset = await utils.createAsset(admin.accessToken, {
      assetData: {
        filename: 'mongolels.jpg',
        bytes: await readFile(ratingAssetFilepath),
      },
    });

    await utils.waitForWebsocketEvent({ event: 'assetUpload', id: ratingAsset.id });

    user1Assets = await Promise.all([
      utils.createAsset(user1.accessToken),
      utils.createAsset(user1.accessToken),
      utils.createAsset(user1.accessToken, {
        isFavorite: true,
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
      expect(asset.status).toBe(AssetMediaStatus.Created);
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

    const person1 = await utils.createPerson(user1.accessToken, {
      name: 'Test Person',
    });
    await utils.createFace({
      assetId: user1Assets[0].id,
      personId: person1.id,
    });
  };
  beforeAll(setupTests, 30_000);

  afterAll(() => {
    utils.disconnectWebsocket(websocket);
  });

  describe('GET /assets/:id/original', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/assets/${uuidDto.notFound}/original`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should download the file', async () => {
      const response = await request(app)
        .get(`/assets/${user1Assets[0].id}/original`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toEqual('image/png');
    });
  });

  describe('GET /assets/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/assets/${uuidDto.notFound}`);
      expect(body).toEqual(errorDto.unauthorized);
      expect(status).toBe(401);
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(app)
        .get(`/assets/${uuidDto.invalid}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });

    it('should require access', async () => {
      const { status, body } = await request(app)
        .get(`/assets/${user2Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
    });

    it('should get the asset info', async () => {
      const { status, body } = await request(app)
        .get(`/assets/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({ id: user1Assets[0].id });
    });

    it('should get the asset rating', async () => {
      await utils.waitForWebsocketEvent({
        event: 'assetUpload',
        id: ratingAsset.id,
      });

      const { status, body } = await request(app)
        .get(`/assets/${ratingAsset.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({
        id: ratingAsset.id,
        exifInfo: expect.objectContaining({ rating: 3 }),
      });
    });

    it('should get the asset faces', async () => {
      const config = await getSystemConfig(admin.accessToken);
      config.metadata.faces.import = true;
      await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });

      // asset faces
      const facesAsset = await utils.createAsset(admin.accessToken, {
        assetData: {
          filename: 'portrait.jpg',
          bytes: await readFile(facesAssetFilepath),
        },
      });

      await utils.waitForWebsocketEvent({ event: 'assetUpload', id: facesAsset.id });

      const { status, body } = await request(app)
        .get(`/assets/${facesAsset.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body.id).toEqual(facesAsset.id);
      expect(body.people).toMatchObject([
        {
          name: 'Marie Curie',
          birthDate: null,
          thumbnailPath: '',
          isHidden: false,
          faces: [
            {
              imageHeight: 700,
              imageWidth: 840,
              boundingBoxX1: 261,
              boundingBoxX2: 356,
              boundingBoxY1: 146,
              boundingBoxY2: 284,
              sourceType: 'exif',
            },
          ],
        },
        {
          name: 'Pierre Curie',
          birthDate: null,
          thumbnailPath: '',
          isHidden: false,
          faces: [
            {
              imageHeight: 700,
              imageWidth: 840,
              boundingBoxX1: 536,
              boundingBoxX2: 618,
              boundingBoxY1: 83,
              boundingBoxY2: 252,
              sourceType: 'exif',
            },
          ],
        },
      ]);
    });

    it('should work with a shared link', async () => {
      const sharedLink = await utils.createSharedLink(user1.accessToken, {
        type: SharedLinkType.Individual,
        assetIds: [user1Assets[0].id],
      });

      const { status, body } = await request(app).get(`/assets/${user1Assets[0].id}?key=${sharedLink.key}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({ id: user1Assets[0].id });
    });

    it('should not send people data for shared links for un-authenticated users', async () => {
      const { status, body } = await request(app)
        .get(`/assets/${user1Assets[0].id}`)
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

      const data = await request(app).get(`/assets/${user1Assets[0].id}?key=${sharedLink.key}`);
      expect(data.status).toBe(200);
      expect(data.body).toMatchObject({ people: [] });
    });

    describe('partner assets', () => {
      it('should get the asset info', async () => {
        const { status, body } = await request(app)
          .get(`/assets/${user1Assets[0].id}`)
          .set('Authorization', `Bearer ${user2.accessToken}`);
        expect(status).toBe(200);
        expect(body).toMatchObject({ id: user1Assets[0].id });
      });

      it('disallows viewing archived assets', async () => {
        const asset = await utils.createAsset(user1.accessToken, { isArchived: true });

        const { status } = await request(app)
          .get(`/assets/${asset.id}`)
          .set('Authorization', `Bearer ${user2.accessToken}`);
        expect(status).toBe(400);
      });

      it('disallows viewing trashed assets', async () => {
        const asset = await utils.createAsset(user1.accessToken);
        await utils.deleteAssets(user1.accessToken, [asset.id]);

        const { status } = await request(app)
          .get(`/assets/${asset.id}`)
          .set('Authorization', `Bearer ${user2.accessToken}`);
        expect(status).toBe(400);
      });
    });
  });

  describe('GET /assets/statistics', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/assets/statistics');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should return stats of all assets', async () => {
      const { status, body } = await request(app)
        .get('/assets/statistics')
        .set('Authorization', `Bearer ${statsUser.accessToken}`);

      expect(body).toEqual({ images: 3, videos: 1, total: 4 });
      expect(status).toBe(200);
    });

    it('should return stats of all favored assets', async () => {
      const { status, body } = await request(app)
        .get('/assets/statistics')
        .set('Authorization', `Bearer ${statsUser.accessToken}`)
        .query({ isFavorite: true });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 1, videos: 1, total: 2 });
    });

    it('should return stats of all archived assets', async () => {
      const { status, body } = await request(app)
        .get('/assets/statistics')
        .set('Authorization', `Bearer ${statsUser.accessToken}`)
        .query({ isArchived: true });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 1, videos: 1, total: 2 });
    });

    it('should return stats of all favored and archived assets', async () => {
      const { status, body } = await request(app)
        .get('/assets/statistics')
        .set('Authorization', `Bearer ${statsUser.accessToken}`)
        .query({ isFavorite: true, isArchived: true });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 0, videos: 1, total: 1 });
    });

    it('should return stats of all assets neither favored nor archived', async () => {
      const { status, body } = await request(app)
        .get('/assets/statistics')
        .set('Authorization', `Bearer ${statsUser.accessToken}`)
        .query({ isFavorite: false, isArchived: false });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 1, videos: 0, total: 1 });
    });
  });

  describe('GET /assets/random', () => {
    beforeAll(async () => {
      await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      await utils.waitForQueueFinish(admin.accessToken, 'thumbnailGeneration');
    });

    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/assets/random');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it.each(TEN_TIMES)('should return 1 random assets', async () => {
      const { status, body } = await request(app)
        .get('/assets/random')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);

      const assets: AssetResponseDto[] = body;
      expect(assets.length).toBe(1);
      expect(assets[0].ownerId).toBe(user1.userId);
    });

    it.each(TEN_TIMES)('should return 2 random assets', async () => {
      const { status, body } = await request(app)
        .get('/assets/random?count=2')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);

      const assets: AssetResponseDto[] = body;
      expect(assets.length).toBe(2);

      for (const asset of assets) {
        expect(asset.ownerId).toBe(user1.userId);
      }
    });

    it.skip('should return 1 asset if there are 10 assets in the database but user 2 only has 1', async () => {
      const { status, body } = await request(app)
        .get('/assets/random')
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: user2Assets[0].id })]);
    });

    it('should return error', async () => {
      const { status } = await request(app)
        .get('/assets/random?count=ABC')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(400);
    });
  });

  describe('PUT /assets/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/assets/:${uuidDto.notFound}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(app)
        .put(`/assets/${uuidDto.invalid}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });

    it('should require access', async () => {
      const { status, body } = await request(app)
        .put(`/assets/${user2Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
    });

    it('should favorite an asset', async () => {
      const before = await utils.getAssetInfo(user1.accessToken, user1Assets[0].id);
      expect(before.isFavorite).toBe(false);

      const { status, body } = await request(app)
        .put(`/assets/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ isFavorite: true });
      expect(body).toMatchObject({ id: user1Assets[0].id, isFavorite: true });
      expect(status).toEqual(200);
    });

    it('should archive an asset', async () => {
      const before = await utils.getAssetInfo(user1.accessToken, user1Assets[0].id);
      expect(before.isArchived).toBe(false);

      const { status, body } = await request(app)
        .put(`/assets/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ isArchived: true });
      expect(body).toMatchObject({ id: user1Assets[0].id, isArchived: true });
      expect(status).toEqual(200);
    });

    it('should update date time original', async () => {
      const { status, body } = await request(app)
        .put(`/assets/${user1Assets[0].id}`)
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

    it('should not allow linking two photos', async () => {
      const { status, body } = await request(app)
        .put(`/assets/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ livePhotoVideoId: user1Assets[1].id });

      expect(body).toEqual(errorDto.badRequest('Live photo video must be a video'));
      expect(status).toEqual(400);
    });

    it('should not allow linking a video owned by another user', async () => {
      const asset = await utils.createAsset(user2.accessToken, { assetData: { filename: 'example.mp4' } });
      const { status, body } = await request(app)
        .put(`/assets/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ livePhotoVideoId: asset.id });

      expect(body).toEqual(errorDto.badRequest('Live photo video does not belong to the user'));
      expect(status).toEqual(400);
    });

    it('should link a motion photo', async () => {
      const asset = await utils.createAsset(user1.accessToken, { assetData: { filename: 'example.mp4' } });
      const { status, body } = await request(app)
        .put(`/assets/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ livePhotoVideoId: asset.id });

      expect(status).toEqual(200);
      expect(body).toMatchObject({ id: user1Assets[0].id, livePhotoVideoId: asset.id });
    });

    it('should unlink a motion photo', async () => {
      const { status, body } = await request(app)
        .put(`/assets/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ livePhotoVideoId: null });

      expect(status).toEqual(200);
      expect(body).toMatchObject({ id: user1Assets[0].id, livePhotoVideoId: null });
    });

    it('should update date time original when sidecar file contains DateTimeOriginal', async () => {
      const sidecarData = `<?xpacket begin='?' id='W5M0MpCehiHzreSzNTczkc9d'?>
<x:xmpmeta xmlns:x='adobe:ns:meta/' x:xmptk='Image::ExifTool 12.40'>
<rdf:RDF xmlns:rdf='http://www.w3.org/1999/02/22-rdf-syntax-ns#'>
 <rdf:Description rdf:about=''
  xmlns:exif='http://ns.adobe.com/exif/1.0/'>
  <exif:ExifVersion>0220</exif:ExifVersion>  <exif:DateTimeOriginal>2024-07-11T10:32:52Z</exif:DateTimeOriginal>
  <exif:GPSVersionID>2.3.0.0</exif:GPSVersionID>
 </rdf:Description>
</rdf:RDF>
</x:xmpmeta>
<?xpacket end='w'?>`;

      const { id } = await utils.createAsset(user1.accessToken, {
        sidecarData: {
          bytes: Buffer.from(sidecarData),
          filename: 'example.xmp',
        },
      });
      await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');

      const assetInfo = await utils.getAssetInfo(user1.accessToken, id);
      expect(assetInfo.exifInfo?.dateTimeOriginal).toBe('2024-07-11T10:32:52.000Z');

      const { status, body } = await request(app)
        .put(`/assets/${id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ dateTimeOriginal: '2023-11-19T18:11:00.000-07:00' });

      expect(body).toMatchObject({
        id,
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
          .put(`/assets/${user1Assets[0].id}`)
          .send(test)
          .set('Authorization', `Bearer ${user1.accessToken}`);
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest());
      }
    });

    it('should update gps data', async () => {
      const { status, body } = await request(app)
        .put(`/assets/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ latitude: 12, longitude: 12 });

      expect(body).toMatchObject({
        id: user1Assets[0].id,
        exifInfo: expect.objectContaining({ latitude: 12, longitude: 12 }),
      });
      expect(status).toEqual(200);
    });

    it.skip('should geocode country from gps data in the middle of nowhere', async () => {
      const { status } = await request(app)
        .put(`/assets/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ latitude: 42, longitude: 69 });
      expect(status).toEqual(200);

      await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');

      const asset = await getAssetInfo({ id: user1Assets[0].id }, { headers: asBearerAuth(user1.accessToken) });
      expect(asset).toMatchObject({
        id: user1Assets[0].id,
        exifInfo: expect.objectContaining({ city: null, country: 'Kazakhstan' }),
      });
    });

    it('should set the description', async () => {
      const { status, body } = await request(app)
        .put(`/assets/${user1Assets[0].id}`)
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

    it('should set the rating', async () => {
      const { status, body } = await request(app)
        .put(`/assets/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ rating: 2 });
      expect(body).toMatchObject({
        id: user1Assets[0].id,
        exifInfo: expect.objectContaining({
          rating: 2,
        }),
      });
      expect(status).toEqual(200);
    });

    it('should reject invalid rating', async () => {
      for (const test of [{ rating: 7 }, { rating: 3.5 }, { rating: null }]) {
        const { status, body } = await request(app)
          .put(`/assets/${user1Assets[0].id}`)
          .send(test)
          .set('Authorization', `Bearer ${user1.accessToken}`);
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest());
      }
    });

    it('should return tagged people', async () => {
      const { status, body } = await request(app)
        .put(`/assets/${user1Assets[0].id}`)
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

  describe('DELETE /assets', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .delete(`/assets`)
        .send({ ids: [uuidDto.notFound] });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(app)
        .delete(`/assets`)
        .send({ ids: [uuidDto.invalid] })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['each value in ids must be a UUID']));
    });

    it('should throw an error when the id is not found', async () => {
      const { status, body } = await request(app)
        .delete(`/assets`)
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
        .delete('/assets')
        .send({ ids: [assetId] })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(204);

      const after = await utils.getAssetInfo(admin.accessToken, assetId);
      expect(after.isTrashed).toBe(true);
    });

    it('should clean up live photos', async () => {
      const { id: motionId } = await utils.createAsset(admin.accessToken, {
        assetData: { filename: 'test.mp4', bytes: makeRandomImage() },
      });
      const { id: photoId } = await utils.createAsset(admin.accessToken, { livePhotoVideoId: motionId });

      await utils.waitForWebsocketEvent({ event: 'assetUpload', id: photoId });
      await utils.waitForWebsocketEvent({ event: 'assetHidden', id: motionId });

      const asset = await utils.getAssetInfo(admin.accessToken, photoId);
      expect(asset.livePhotoVideoId).toBe(motionId);

      const { status } = await request(app)
        .delete('/assets')
        .send({ ids: [photoId], force: true })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(204);

      await utils.waitForWebsocketEvent({ event: 'assetDelete', id: photoId });
      await utils.waitForWebsocketEvent({ event: 'assetDelete', id: motionId });
    });

    it('should not delete a shared motion asset', async () => {
      const { id: motionId } = await utils.createAsset(admin.accessToken, {
        assetData: { filename: 'test.mp4', bytes: makeRandomImage() },
      });
      const { id: asset1 } = await utils.createAsset(admin.accessToken, { livePhotoVideoId: motionId });
      const { id: asset2 } = await utils.createAsset(admin.accessToken, { livePhotoVideoId: motionId });

      await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset1 });
      await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset2 });
      await utils.waitForWebsocketEvent({ event: 'assetHidden', id: motionId });

      const asset = await utils.getAssetInfo(admin.accessToken, asset1);
      expect(asset.livePhotoVideoId).toBe(motionId);

      const { status } = await request(app)
        .delete('/assets')
        .send({ ids: [asset1], force: true })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(204);

      await utils.waitForWebsocketEvent({ event: 'assetDelete', id: asset1 });
      await utils.waitForQueueFinish(admin.accessToken, 'backgroundTask');

      await expect(utils.getAssetInfo(admin.accessToken, motionId)).resolves.toMatchObject({ id: motionId });
      await expect(utils.getAssetInfo(admin.accessToken, asset2)).resolves.toMatchObject({
        id: asset2,
        livePhotoVideoId: motionId,
      });
    });
  });

  describe('GET /assets/:id/thumbnail', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/assets/${locationAsset.id}/thumbnail`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should not include gps data for webp thumbnails', async () => {
      await utils.waitForWebsocketEvent({
        event: 'assetUpload',
        id: locationAsset.id,
      });

      const { status, body, type } = await request(app)
        .get(`/assets/${locationAsset.id}/thumbnail?format=WEBP`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toBeDefined();
      expect(type).toBe('image/webp');

      const exifData = await readTags(body, 'thumbnail.webp');
      expect(exifData).not.toHaveProperty('GPSLongitude');
      expect(exifData).not.toHaveProperty('GPSLatitude');
    });

    it('should not include gps data for jpeg previews', async () => {
      const { status, body, type } = await request(app)
        .get(`/assets/${locationAsset.id}/thumbnail?size=preview`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toBeDefined();
      expect(type).toBe('image/jpeg');

      const exifData = await readTags(body, 'thumbnail.jpg');
      expect(exifData).not.toHaveProperty('GPSLongitude');
      expect(exifData).not.toHaveProperty('GPSLatitude');
    });
  });

  describe('GET /assets/:id/original', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/assets/${locationAsset.id}/original`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should download the original', async () => {
      const { status, body, type } = await request(app)
        .get(`/assets/${locationAsset.id}/original`)
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

  describe('PUT /assets', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put('/assets');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });
  });

  describe('POST /assets', () => {
    beforeAll(setupTests, 30_000);

    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/assets`);
      expect(body).toEqual(errorDto.unauthorized);
      expect(status).toBe(401);
    });

    it.each([
      { should: 'require `deviceAssetId`', dto: { ...makeUploadDto({ omit: 'deviceAssetId' }) } },
      { should: 'require `deviceId`', dto: { ...makeUploadDto({ omit: 'deviceId' }) } },
      { should: 'require `fileCreatedAt`', dto: { ...makeUploadDto({ omit: 'fileCreatedAt' }) } },
      { should: 'require `fileModifiedAt`', dto: { ...makeUploadDto({ omit: 'fileModifiedAt' }) } },
      { should: 'require `duration`', dto: { ...makeUploadDto({ omit: 'duration' }) } },
      { should: 'throw if `isFavorite` is not a boolean', dto: { ...makeUploadDto(), isFavorite: 'not-a-boolean' } },
      { should: 'throw if `isVisible` is not a boolean', dto: { ...makeUploadDto(), isVisible: 'not-a-boolean' } },
      { should: 'throw if `isArchived` is not a boolean', dto: { ...makeUploadDto(), isArchived: 'not-a-boolean' } },
    ])('should $should', async ({ dto }) => {
      const { status, body } = await request(app)
        .post('/assets')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .attach('assetData', makeRandomImage(), 'example.png')
        .field(dto);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    const tests = [
      {
        input: 'formats/avif/8bit-sRGB.avif',
        expected: {
          type: AssetTypeEnum.Image,
          originalFileName: '8bit-sRGB.avif',
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
          fileCreatedAt: '2016-01-08T14:08:01.000Z',
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
            dateTimeOriginal: '2016-01-08T14:08:01.000Z',
            latitude: null,
            longitude: null,
            orientation: '1',
          },
        },
      },
    ];

    it(`should upload and generate a thumbnail for different file types`, async () => {
      // upload in parallel
      const assets = await Promise.all(
        tests.map(async ({ input }) => {
          const filepath = join(testAssetDir, input);
          return utils.createAsset(admin.accessToken, {
            assetData: { bytes: await readFile(filepath), filename: basename(filepath) },
          });
        }),
      );

      for (const { id, status } of assets) {
        expect(status).toBe(AssetMediaStatus.Created);
        await utils.waitForWebsocketEvent({ event: 'assetUpload', id });
      }

      for (const [i, { id }] of assets.entries()) {
        const { expected } = tests[i];
        const asset = await utils.getAssetInfo(admin.accessToken, id);

        expect(asset.exifInfo).toBeDefined();
        expect(asset.exifInfo).toMatchObject(expected.exifInfo);
        expect(asset).toMatchObject(expected);
      }
    });

    it('should handle a duplicate', async () => {
      const filepath = 'formats/jpeg/el_torcal_rocks.jpeg';
      const { status } = await utils.createAsset(admin.accessToken, {
        assetData: {
          bytes: await readFile(join(testAssetDir, filepath)),
          filename: basename(filepath),
        },
      });

      expect(status).toBe(AssetMediaStatus.Duplicate);
    });

    it('should update the used quota', async () => {
      const { body, status } = await request(app)
        .post('/assets')
        .set('Authorization', `Bearer ${quotaUser.accessToken}`)
        .field('deviceAssetId', 'example-image')
        .field('deviceId', 'e2e')
        .field('fileCreatedAt', new Date().toISOString())
        .field('fileModifiedAt', new Date().toISOString())
        .attach('assetData', makeRandomImage(), 'example.jpg');

      expect(body).toEqual({ id: expect.any(String), status: AssetMediaStatus.Created });
      expect(status).toBe(201);

      const user = await getMyUser({ headers: asBearerAuth(quotaUser.accessToken) });

      expect(user).toEqual(expect.objectContaining({ quotaUsageInBytes: 70 }));
    });

    it('should not upload an asset if it would exceed the quota', async () => {
      const { body, status } = await request(app)
        .post('/assets')
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
    it.each([
      {
        filepath: 'formats/motionphoto/samsung-one-ui-5.jpg',
        checksum: 'fr14niqCq6N20HB8rJYEvpsUVtI=',
      },
      {
        filepath: 'formats/motionphoto/samsung-one-ui-6.jpg',
        checksum: 'lT9Uviw/FFJYCjfIxAGPTjzAmmw=',
      },
      {
        filepath: 'formats/motionphoto/samsung-one-ui-6.heic',
        checksum: '/ejgzywvgvzvVhUYVfvkLzFBAF0=',
      },
      {
        filepath: 'formats/motionphoto/pixel-6-pro.jpg',
        checksum: 'bFhLGbdK058PSk4FTfrSnoKWykc=',
      },
      {
        filepath: 'formats/motionphoto/pixel-8a.jpg',
        checksum: '7YdY+WF0h+CXHbiXpi0HiCMTTjs=',
      },
    ])(`should extract motionphoto video from $filepath`, async ({ filepath, checksum }) => {
      const response = await utils.createAsset(admin.accessToken, {
        assetData: {
          bytes: await readFile(join(testAssetDir, filepath)),
          filename: basename(filepath),
        },
      });

      await utils.waitForWebsocketEvent({ event: 'assetUpload', id: response.id });

      expect(response.status).toBe(AssetMediaStatus.Created);

      const asset = await utils.getAssetInfo(admin.accessToken, response.id);
      expect(asset.livePhotoVideoId).toBeDefined();

      const video = await utils.getAssetInfo(admin.accessToken, asset.livePhotoVideoId as string);
      expect(video.checksum).toStrictEqual(checksum);
    });
  });

  describe('POST /assets/exist', () => {
    it('ignores invalid deviceAssetIds', async () => {
      const response = await utils.checkExistingAssets(user1.accessToken, {
        deviceId: 'test-assets-exist',
        deviceAssetIds: ['invalid', 'INVALID'],
      });

      expect(response.existingIds).toHaveLength(0);
    });

    it('returns the IDs of existing assets', async () => {
      await utils.createAsset(user1.accessToken, {
        deviceId: 'test-assets-exist',
        deviceAssetId: 'test-asset-0',
      });

      const response = await utils.checkExistingAssets(user1.accessToken, {
        deviceId: 'test-assets-exist',
        deviceAssetIds: ['test-asset-0'],
      });

      expect(response.existingIds).toEqual(['test-asset-0']);
    });
  });
});
