import {
  AssetMediaResponseDto,
  AssetMediaStatus,
  AssetResponseDto,
  AssetTypeEnum,
  AssetVisibility,
  getAssetInfo,
  getMyUser,
  LoginResponseDto,
  SharedLinkType,
  updateConfig,
} from '@immich/sdk';
import { exiftool } from 'exiftool-vendored';
import { DateTime } from 'luxon';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import sharp from 'sharp';
import { Socket } from 'socket.io-client';
import { createUserDto, uuidDto } from 'src/fixtures';
import { makeRandomImage } from 'src/generators';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, tempDir, TEN_TIMES, testAssetDir, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const locationAssetFilepath = `${testAssetDir}/metadata/gps-position/thompson-springs.jpg`;
const ratingAssetFilepath = `${testAssetDir}/metadata/rating/mongolels.jpg`;
const facesAssetDir = `${testAssetDir}/metadata/faces`;

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

const createTestImageWithExif = async (filename: string, exifData: Record<string, any>) => {
  // Generate unique color to ensure different checksums for each image
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);

  // Create a 100x100 solid color JPEG using Sharp
  const imageBytes = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: { r, g, b },
    },
  })
    .jpeg({ quality: 90 })
    .toBuffer();

  // Add random suffix to filename to avoid collisions
  const uniqueFilename = filename.replace('.jpg', `-${randomBytes(4).toString('hex')}.jpg`);
  const filepath = join(tempDir, uniqueFilename);
  await writeFile(filepath, imageBytes);

  // Filter out undefined values before writing EXIF
  const cleanExifData = Object.fromEntries(Object.entries(exifData).filter(([, value]) => value !== undefined));

  await exiftool.write(filepath, cleanExifData);

  // Re-read the image bytes after EXIF has been written
  const finalImageBytes = await readFile(filepath);

  return { filepath, imageBytes: finalImageBytes, filename: uniqueFilename };
};

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
      utils.createAsset(statsUser.accessToken, { visibility: AssetVisibility.Archive }),
      utils.createAsset(statsUser.accessToken, {
        visibility: AssetVisibility.Archive,
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
    it('should download the file', async () => {
      const response = await request(app)
        .get(`/assets/${user1Assets[0].id}/original`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toEqual('image/png');
    });
  });

  describe('GET /assets/:id', () => {
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

    describe('faces', () => {
      const metadataFaceTests = [
        {
          description: 'without orientation',
          filename: 'portrait.jpg',
        },
        {
          description: 'adjusting face regions to orientation',
          filename: 'portrait-orientation-6.jpg',
        },
      ];
      // should produce same resulting face region coordinates for any orientation
      const expectedFaces = [
        {
          name: 'Marie Curie',
          birthDate: null,
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
      ];

      it.each(metadataFaceTests)('should get the asset faces from $filename $description', async ({ filename }) => {
        const config = await utils.getSystemConfig(admin.accessToken);
        config.metadata.faces.import = true;
        await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });

        const facesAsset = await utils.createAsset(admin.accessToken, {
          assetData: {
            filename,
            bytes: await readFile(`${facesAssetDir}/${filename}`),
          },
        });

        await utils.waitForWebsocketEvent({ event: 'assetUpload', id: facesAsset.id });

        const { status, body } = await request(app)
          .get(`/assets/${facesAsset.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`);

        expect(status).toBe(200);
        expect(body.id).toEqual(facesAsset.id);
        expect(body.people).toMatchObject(expectedFaces);
      });
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
        const asset = await utils.createAsset(user1.accessToken, { visibility: AssetVisibility.Archive });

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
        .query({ visibility: AssetVisibility.Archive });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 1, videos: 1, total: 2 });
    });

    it('should return stats of all favored and archived assets', async () => {
      const { status, body } = await request(app)
        .get('/assets/statistics')
        .set('Authorization', `Bearer ${statsUser.accessToken}`)
        .query({ isFavorite: true, visibility: AssetVisibility.Archive });

      expect(status).toBe(200);
      expect(body).toEqual({ images: 0, videos: 1, total: 1 });
    });

    it('should return stats of all assets neither favored nor archived', async () => {
      const { status, body } = await request(app)
        .get('/assets/statistics')
        .set('Authorization', `Bearer ${statsUser.accessToken}`)
        .query({ isFavorite: false, visibility: AssetVisibility.Timeline });

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
  });

  describe('PUT /assets/:id', () => {
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
        .send({ visibility: AssetVisibility.Archive });
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
          dateTimeOriginal: '2023-11-20T01:11:00+00:00',
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

    it.skip('should update date time original when sidecar file contains DateTimeOriginal', async () => {
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
      expect(assetInfo.exifInfo?.dateTimeOriginal).toBe('2024-07-11T10:32:52+00:00');

      const { status, body } = await request(app)
        .put(`/assets/${id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ dateTimeOriginal: '2023-11-19T18:11:00.000-07:00' });

      expect(body).toMatchObject({
        id,
        exifInfo: expect.objectContaining({
          dateTimeOriginal: '2023-11-20T01:11:00+00:00',
        }),
      });
      expect(status).toEqual(200);
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

    it('should set the negative rating', async () => {
      const { status, body } = await request(app)
        .put(`/assets/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ rating: -1 });
      expect(body).toMatchObject({
        id: user1Assets[0].id,
        exifInfo: expect.objectContaining({
          rating: -1,
        }),
      });
      expect(status).toEqual(200);
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
    it('should throw an error when the id is not found', async () => {
      const { status, body } = await request(app)
        .delete(`/assets`)
        .send({ ids: [uuidDto.notFound] })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Not found or no asset.delete access'));
    });

    it('should move an asset to trash', async () => {
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

    it('should permanently delete an asset from trash', async () => {
      const { id: assetId } = await utils.createAsset(admin.accessToken);

      {
        const { status } = await request(app)
          .delete('/assets')
          .send({ ids: [assetId] })
          .set('Authorization', `Bearer ${admin.accessToken}`);
        expect(status).toBe(204);
      }

      const trashed = await utils.getAssetInfo(admin.accessToken, assetId);
      expect(trashed.isTrashed).toBe(true);

      {
        const { status } = await request(app)
          .delete('/assets')
          .send({ ids: [assetId], force: true })
          .set('Authorization', `Bearer ${admin.accessToken}`);
        expect(status).toBe(204);
      }

      await utils.waitForWebsocketEvent({ event: 'assetDelete', id: assetId });

      {
        const { status } = await request(app)
          .get(`/assets/${assetId}`)
          .set('Authorization', `Bearer ${admin.accessToken}`);
        expect(status).toBe(400);
      }
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
    it('should update date time original relatively', async () => {
      const { status, body } = await request(app)
        .put(`/assets/`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ ids: [user1Assets[0].id], dateTimeRelative: -1441 });

      expect(body).toEqual({});
      expect(status).toEqual(204);

      const result = await request(app)
        .get(`/assets/${user1Assets[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send();

      expect(result.body).toMatchObject({
        id: user1Assets[0].id,
        exifInfo: expect.objectContaining({
          dateTimeOriginal: '2023-11-19T01:10:00+00:00',
        }),
      });
    });
  });

  describe('POST /assets', () => {
    beforeAll(setupTests, 30_000);

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
          },
        },
      },
      {
        input: 'formats/jpg/el_torcal_rocks.jpg',
        expected: {
          type: AssetTypeEnum.Image,
          originalFileName: 'el_torcal_rocks.jpg',
          exifInfo: {
            dateTimeOriginal: '2012-08-05T11:39:59+00:00',
            exifImageWidth: 512,
            exifImageHeight: 341,
            focalLength: 75,
            iso: 200,
            fNumber: 11,
            exposureTime: '1/160',
            fileSizeInByte: 53_493,
            make: 'SONY',
            model: 'DSLR-A550',
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
            dateTimeOriginal: '2019-03-21T16:04:22.348+00:00',
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
            dateTimeOriginal: '2010-07-20T17:27:12+00:00',
            orientation: '1',
          },
        },
      },
      {
        input: 'formats/raw/Nikon/D700/philadelphia.nef',
        expected: {
          type: AssetTypeEnum.Image,
          originalFileName: 'philadelphia.nef',
          fileCreatedAt: '2016-09-22T21:10:29.060Z',
          exifInfo: {
            make: 'NIKON CORPORATION',
            model: 'NIKON D700',
            exposureTime: '1/400',
            fNumber: 11,
            focalLength: 85,
            iso: 200,
            fileSizeInByte: 15_856_335,
            dateTimeOriginal: '2016-09-22T21:10:29.06+00:00',
            orientation: '1',
            timeZone: 'UTC-4',
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
            dateTimeOriginal: '2018-05-10T08:42:37.842+00:00',
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
            lensModel: 'Sony E PZ 18-105mm F4 G OSS',
            fileSizeInByte: 25_001_984,
            dateTimeOriginal: '2016-09-27T10:51:44+00:00',
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
            lensModel: 'Zeiss Batis 25mm F2',
            fileSizeInByte: 49_512_448,
            dateTimeOriginal: '2016-01-08T14:08:01+00:00',
            orientation: '1',
          },
        },
      },
      {
        input: 'formats/raw/Canon/PowerShot_G12.CR2',
        expected: {
          type: AssetTypeEnum.Image,
          originalFileName: 'PowerShot_G12.CR2',
          fileCreatedAt: '2015-12-27T09:55:40.000Z',
          exifInfo: {
            make: 'Canon',
            model: 'Canon PowerShot G12',
            exifImageHeight: 2736,
            exifImageWidth: 3648,
            exposureTime: '1/1000',
            fNumber: 4,
            focalLength: 18.098,
            iso: 80,
            lensModel: null,
            fileSizeInByte: 11_113_617,
            dateTimeOriginal: '2015-12-27T09:55:40+00:00',
            latitude: null,
            longitude: null,
            orientation: '1',
          },
        },
      },
      {
        input: 'formats/raw/Fujifilm/X100V_compressed.RAF',
        expected: {
          type: AssetTypeEnum.Image,
          originalFileName: 'X100V_compressed.RAF',
          fileCreatedAt: '2024-10-12T21:01:01.000Z',
          exifInfo: {
            make: 'FUJIFILM',
            model: 'X100V',
            exifImageHeight: 4160,
            exifImageWidth: 6240,
            exposureTime: '1/4000',
            fNumber: 16,
            focalLength: 23,
            iso: 160,
            lensModel: null,
            fileSizeInByte: 13_551_312,
            dateTimeOriginal: '2024-10-12T21:01:01+00:00',
            latitude: null,
            longitude: null,
            orientation: '6',
          },
        },
      },
      {
        input: 'formats/raw/Ricoh/GR3/Ricoh_GR3-450.DNG',
        expected: {
          type: AssetTypeEnum.Image,
          originalFileName: 'Ricoh_GR3-450.DNG',
          fileCreatedAt: '2024-06-08T13:48:39.000Z',
          exifInfo: {
            dateTimeOriginal: '2024-06-08T13:48:39+00:00',
            exifImageHeight: 4064,
            exifImageWidth: 6112,
            exposureTime: '1/400',
            fNumber: 5,
            fileSizeInByte: 31_175_472,
            focalLength: 18.3,
            iso: 100,
            latitude: 36.613_24,
            lensModel: '18.3mm F2.8',
            longitude: -121.897_85,
            make: 'RICOH IMAGING COMPANY, LTD.',
            model: 'RICOH GR III',
            orientation: '1',
          },
        },
      },
    ];

    it.each(tests)(`should upload and generate a thumbnail for different file types`, async ({ input, expected }) => {
      const filepath = join(testAssetDir, input);
      const response = await utils.createAsset(admin.accessToken, {
        assetData: { bytes: await readFile(filepath), filename: basename(filepath) },
      });

      expect(response.status).toBe(AssetMediaStatus.Created);
      const id = response.id;
      // longer timeout as the thumbnail generation from full-size raw files can take a while
      await utils.waitForWebsocketEvent({ event: 'assetUpload', id });

      const asset = await utils.getAssetInfo(admin.accessToken, id);
      expect(asset.exifInfo).toBeDefined();
      expect(asset.exifInfo).toMatchObject(expected.exifInfo);
      expect(asset).toMatchObject(expected);
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

  describe('EXIF metadata extraction', () => {
    describe('Additional date tag extraction', () => {
      describe('Date-time vs time-only tag handling', () => {
        it('should fall back to file timestamps when only time-only tags are available', async () => {
          const { imageBytes, filename } = await createTestImageWithExif('time-only-fallback.jpg', {
            TimeCreated: '2023:11:15 14:30:00', // Time-only tag, should not be used for dateTimeOriginal
            // Exclude all date-time tags to force fallback to file timestamps
            SubSecDateTimeOriginal: undefined,
            DateTimeOriginal: undefined,
            SubSecCreateDate: undefined,
            SubSecMediaCreateDate: undefined,
            CreateDate: undefined,
            MediaCreateDate: undefined,
            CreationDate: undefined,
            DateTimeCreated: undefined,
            GPSDateTime: undefined,
            DateTimeUTC: undefined,
            SonyDateTime2: undefined,
            GPSDateStamp: undefined,
          });

          const oldDate = new Date('2020-01-01T00:00:00.000Z');
          const asset = await utils.createAsset(admin.accessToken, {
            assetData: {
              filename,
              bytes: imageBytes,
            },
            fileCreatedAt: oldDate.toISOString(),
            fileModifiedAt: oldDate.toISOString(),
          });

          await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset.id });

          const assetInfo = await getAssetInfo({ id: asset.id }, { headers: asBearerAuth(admin.accessToken) });

          expect(assetInfo.exifInfo?.dateTimeOriginal).toBeDefined();
          // Should fall back to file timestamps, which we set to 2020-01-01
          expect(new Date(assetInfo.exifInfo!.dateTimeOriginal!).getTime()).toBe(
            new Date('2020-01-01T00:00:00.000Z').getTime(),
          );
        });

        it('should prefer DateTimeOriginal over time-only tags', async () => {
          const { imageBytes, filename } = await createTestImageWithExif('datetime-over-time.jpg', {
            DateTimeOriginal: '2023:10:10 10:00:00', // Should be preferred
            TimeCreated: '2023:11:15 14:30:00', // Should be ignored (time-only)
          });

          const asset = await utils.createAsset(admin.accessToken, {
            assetData: {
              filename,
              bytes: imageBytes,
            },
          });

          await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset.id });

          const assetInfo = await getAssetInfo({ id: asset.id }, { headers: asBearerAuth(admin.accessToken) });

          expect(assetInfo.exifInfo?.dateTimeOriginal).toBeDefined();
          // Should use DateTimeOriginal, not TimeCreated
          expect(new Date(assetInfo.exifInfo!.dateTimeOriginal!).getTime()).toBe(
            new Date('2023-10-10T10:00:00.000Z').getTime(),
          );
        });
      });

      describe('GPSDateTime tag extraction', () => {
        it('should extract GPSDateTime with GPS coordinates', async () => {
          const { imageBytes, filename } = await createTestImageWithExif('gps-datetime.jpg', {
            GPSDateTime: '2023:11:15 12:30:00Z',
            GPSLatitude: 37.7749,
            GPSLongitude: -122.4194,
            // Exclude other date tags
            SubSecDateTimeOriginal: undefined,
            DateTimeOriginal: undefined,
            SubSecCreateDate: undefined,
            SubSecMediaCreateDate: undefined,
            CreateDate: undefined,
            MediaCreateDate: undefined,
            CreationDate: undefined,
            DateTimeCreated: undefined,
            TimeCreated: undefined,
          });

          const asset = await utils.createAsset(admin.accessToken, {
            assetData: {
              filename,
              bytes: imageBytes,
            },
          });

          await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset.id });

          const assetInfo = await getAssetInfo({ id: asset.id }, { headers: asBearerAuth(admin.accessToken) });

          expect(assetInfo.exifInfo?.dateTimeOriginal).toBeDefined();
          expect(assetInfo.exifInfo?.latitude).toBeCloseTo(37.7749, 4);
          expect(assetInfo.exifInfo?.longitude).toBeCloseTo(-122.4194, 4);
          expect(new Date(assetInfo.exifInfo!.dateTimeOriginal!).getTime()).toBe(
            new Date('2023-11-15T12:30:00.000Z').getTime(),
          );
        });
      });

      describe('CreateDate tag extraction', () => {
        it('should extract CreateDate when available', async () => {
          const { imageBytes, filename } = await createTestImageWithExif('create-date.jpg', {
            CreateDate: '2023:11:15 10:30:00',
            // Exclude other higher priority date tags
            SubSecDateTimeOriginal: undefined,
            DateTimeOriginal: undefined,
            SubSecCreateDate: undefined,
            SubSecMediaCreateDate: undefined,
            MediaCreateDate: undefined,
            CreationDate: undefined,
            DateTimeCreated: undefined,
            TimeCreated: undefined,
            GPSDateTime: undefined,
          });

          const asset = await utils.createAsset(admin.accessToken, {
            assetData: {
              filename,
              bytes: imageBytes,
            },
          });

          await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset.id });

          const assetInfo = await getAssetInfo({ id: asset.id }, { headers: asBearerAuth(admin.accessToken) });

          expect(assetInfo.exifInfo?.dateTimeOriginal).toBeDefined();
          expect(new Date(assetInfo.exifInfo!.dateTimeOriginal!).getTime()).toBe(
            new Date('2023-11-15T10:30:00.000Z').getTime(),
          );
        });
      });

      describe('GPSDateStamp tag extraction', () => {
        it('should fall back to file timestamps when only date-only tags are available', async () => {
          const { imageBytes, filename } = await createTestImageWithExif('gps-datestamp.jpg', {
            GPSDateStamp: '2023:11:15', // Date-only tag, should not be used for dateTimeOriginal
            // Note: NOT including GPSTimeStamp to avoid automatic GPSDateTime creation
            GPSLatitude: 51.5074,
            GPSLongitude: -0.1278,
            // Explicitly exclude all testable date-time tags to force fallback to file timestamps
            DateTimeOriginal: undefined,
            CreateDate: undefined,
            CreationDate: undefined,
            GPSDateTime: undefined,
          });

          const oldDate = new Date('2020-01-01T00:00:00.000Z');
          const asset = await utils.createAsset(admin.accessToken, {
            assetData: {
              filename,
              bytes: imageBytes,
            },
            fileCreatedAt: oldDate.toISOString(),
            fileModifiedAt: oldDate.toISOString(),
          });

          await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset.id });

          const assetInfo = await getAssetInfo({ id: asset.id }, { headers: asBearerAuth(admin.accessToken) });

          expect(assetInfo.exifInfo?.dateTimeOriginal).toBeDefined();
          expect(assetInfo.exifInfo?.latitude).toBeCloseTo(51.5074, 4);
          expect(assetInfo.exifInfo?.longitude).toBeCloseTo(-0.1278, 4);
          // Should fall back to file timestamps, which we set to 2020-01-01
          expect(new Date(assetInfo.exifInfo!.dateTimeOriginal!).getTime()).toBe(
            new Date('2020-01-01T00:00:00.000Z').getTime(),
          );
        });
      });

      /*
       * NOTE: The following EXIF date tags are NOT effectively usable with JPEG test files:
       *
       * NOT WRITABLE to JPEG:
       * - MediaCreateDate: Can be read from video files but not written to JPEG
       * - DateTimeCreated: Read-only tag in JPEG format
       * - DateTimeUTC: Cannot be written to JPEG files
       * - SonyDateTime2: Proprietary Sony tag, not writable to JPEG
       * - SubSecMediaCreateDate: Tag not defined for JPEG format
       * - SourceImageCreateTime: Non-standard insta360 tag, not writable to JPEG
       *
       * WRITABLE but NOT READABLE from JPEG:
       * - SubSecDateTimeOriginal: Can be written but not read back from JPEG
       * - SubSecCreateDate: Can be written but not read back from JPEG
       *
       * EFFECTIVELY TESTABLE TAGS (writable and readable):
       * - DateTimeOriginal ✓
       * - CreateDate ✓
       * - CreationDate ✓
       * - GPSDateTime ✓
       *
       * The metadata service correctly handles non-readable tags and will fall back to
       * file timestamps when only non-readable tags are present.
       */

      describe('Date tag priority order', () => {
        it('should respect the complete date tag priority order', async () => {
          // Test cases using only EFFECTIVELY TESTABLE tags (writable AND readable from JPEG)
          const testCases = [
            {
              name: 'DateTimeOriginal has highest priority among testable tags',
              exifData: {
                DateTimeOriginal: '2023:04:04 04:00:00', // TESTABLE - highest priority among readable tags
                CreateDate: '2023:05:05 05:00:00', // TESTABLE
                CreationDate: '2023:07:07 07:00:00', // TESTABLE
                GPSDateTime: '2023:10:10 10:00:00', // TESTABLE
              },
              expectedDate: '2023-04-04T04:00:00.000Z',
            },
            {
              name: 'CreationDate when DateTimeOriginal missing',
              exifData: {
                CreationDate: '2023:05:05 05:00:00', // TESTABLE
                CreateDate: '2023:07:07 07:00:00', // TESTABLE
                GPSDateTime: '2023:10:10 10:00:00', // TESTABLE
              },
              expectedDate: '2023-05-05T05:00:00.000Z',
            },
            {
              name: 'CreationDate when standard EXIF tags missing',
              exifData: {
                CreationDate: '2023:07:07 07:00:00', // TESTABLE
                GPSDateTime: '2023:10:10 10:00:00', // TESTABLE
              },
              expectedDate: '2023-07-07T07:00:00.000Z',
            },
            {
              name: 'GPSDateTime when no other testable date tags present',
              exifData: {
                GPSDateTime: '2023:10:10 10:00:00', // TESTABLE
                Make: 'SONY',
              },
              expectedDate: '2023-10-10T10:00:00.000Z',
            },
          ];

          for (const testCase of testCases) {
            const { imageBytes, filename } = await createTestImageWithExif(
              `${testCase.name.replaceAll(/\s+/g, '-').toLowerCase()}.jpg`,
              testCase.exifData,
            );

            const asset = await utils.createAsset(admin.accessToken, {
              assetData: {
                filename,
                bytes: imageBytes,
              },
            });

            await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset.id });

            const assetInfo = await getAssetInfo({ id: asset.id }, { headers: asBearerAuth(admin.accessToken) });

            expect(assetInfo.exifInfo?.dateTimeOriginal, `Failed for: ${testCase.name}`).toBeDefined();
            expect(
              new Date(assetInfo.exifInfo!.dateTimeOriginal!).getTime(),
              `Date mismatch for: ${testCase.name}`,
            ).toBe(new Date(testCase.expectedDate).getTime());
          }
        });
      });

      describe('Edge cases for date tag handling', () => {
        it('should fall back to file timestamps with GPSDateStamp alone', async () => {
          const { imageBytes, filename } = await createTestImageWithExif('gps-datestamp-only.jpg', {
            GPSDateStamp: '2023:08:08', // Date-only tag, should not be used for dateTimeOriginal
            // Intentionally no GPSTimeStamp
            // Exclude all other date tags
            SubSecDateTimeOriginal: undefined,
            DateTimeOriginal: undefined,
            SubSecCreateDate: undefined,
            SubSecMediaCreateDate: undefined,
            CreateDate: undefined,
            MediaCreateDate: undefined,
            CreationDate: undefined,
            DateTimeCreated: undefined,
            TimeCreated: undefined,
            GPSDateTime: undefined,
            DateTimeUTC: undefined,
          });

          const oldDate = new Date('2020-01-01T00:00:00.000Z');
          const asset = await utils.createAsset(admin.accessToken, {
            assetData: {
              filename,
              bytes: imageBytes,
            },
            fileCreatedAt: oldDate.toISOString(),
            fileModifiedAt: oldDate.toISOString(),
          });

          await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset.id });

          const assetInfo = await getAssetInfo({ id: asset.id }, { headers: asBearerAuth(admin.accessToken) });

          expect(assetInfo.exifInfo?.dateTimeOriginal).toBeDefined();
          // Should fall back to file timestamps, which we set to 2020-01-01
          expect(new Date(assetInfo.exifInfo!.dateTimeOriginal!).getTime()).toBe(
            new Date('2020-01-01T00:00:00.000Z').getTime(),
          );
        });

        it('should handle all testable date tags present to verify complete priority order', async () => {
          const { imageBytes, filename } = await createTestImageWithExif('all-testable-date-tags.jpg', {
            // All TESTABLE date tags to JPEG format (writable AND readable)
            DateTimeOriginal: '2023:04:04 04:00:00', // TESTABLE - highest priority among readable tags
            CreateDate: '2023:05:05 05:00:00', // TESTABLE
            CreationDate: '2023:07:07 07:00:00', // TESTABLE
            GPSDateTime: '2023:10:10 10:00:00', // TESTABLE
            // Note: Excluded non-testable tags:
            // SubSec tags: writable but not readable from JPEG
            // Non-writable tags: MediaCreateDate, DateTimeCreated, DateTimeUTC, SonyDateTime2, etc.
            // Time-only/date-only tags: already excluded from EXIF_DATE_TAGS
          });

          const asset = await utils.createAsset(admin.accessToken, {
            assetData: {
              filename,
              bytes: imageBytes,
            },
          });

          await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset.id });

          const assetInfo = await getAssetInfo({ id: asset.id }, { headers: asBearerAuth(admin.accessToken) });

          expect(assetInfo.exifInfo?.dateTimeOriginal).toBeDefined();
          // Should use DateTimeOriginal as it has the highest priority among testable tags
          expect(new Date(assetInfo.exifInfo!.dateTimeOriginal!).getTime()).toBe(
            new Date('2023-04-04T04:00:00.000Z').getTime(),
          );
        });

        it('should use CreationDate when SubSec tags are missing', async () => {
          const { imageBytes, filename } = await createTestImageWithExif('creation-date-priority.jpg', {
            CreationDate: '2023:07:07 07:00:00', // WRITABLE
            GPSDateTime: '2023:10:10 10:00:00', // WRITABLE
            // Note: DateTimeCreated, DateTimeUTC, SonyDateTime2 are NOT writable to JPEG
            // Note: TimeCreated and GPSDateStamp are excluded from EXIF_DATE_TAGS (time-only/date-only)
            // Exclude SubSec and standard EXIF tags
            SubSecDateTimeOriginal: undefined,
            DateTimeOriginal: undefined,
            SubSecCreateDate: undefined,
            CreateDate: undefined,
          });

          const asset = await utils.createAsset(admin.accessToken, {
            assetData: {
              filename,
              bytes: imageBytes,
            },
          });

          await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset.id });

          const assetInfo = await getAssetInfo({ id: asset.id }, { headers: asBearerAuth(admin.accessToken) });

          expect(assetInfo.exifInfo?.dateTimeOriginal).toBeDefined();
          // Should use CreationDate when available
          expect(new Date(assetInfo.exifInfo!.dateTimeOriginal!).getTime()).toBe(
            new Date('2023-07-07T07:00:00.000Z').getTime(),
          );
        });

        it('should skip invalid date formats and use next valid tag', async () => {
          const { imageBytes, filename } = await createTestImageWithExif('invalid-date-handling.jpg', {
            // Note: Testing invalid date handling with only WRITABLE tags
            GPSDateTime: '2023:10:10 10:00:00', // WRITABLE - Valid date
            CreationDate: '2023:13:13 13:00:00', // WRITABLE - Valid date
            // Note: TimeCreated excluded (time-only), DateTimeCreated not writable to JPEG
            // Exclude other date tags
            SubSecDateTimeOriginal: undefined,
            DateTimeOriginal: undefined,
            SubSecCreateDate: undefined,
            CreateDate: undefined,
          });

          const asset = await utils.createAsset(admin.accessToken, {
            assetData: {
              filename,
              bytes: imageBytes,
            },
          });

          await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset.id });

          const assetInfo = await getAssetInfo({ id: asset.id }, { headers: asBearerAuth(admin.accessToken) });

          expect(assetInfo.exifInfo?.dateTimeOriginal).toBeDefined();
          // Should skip invalid dates and use the first valid one (GPSDateTime)
          expect(new Date(assetInfo.exifInfo!.dateTimeOriginal!).getTime()).toBe(
            new Date('2023-10-10T10:00:00.000Z').getTime(),
          );
        });
      });
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
