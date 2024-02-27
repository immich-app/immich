import {
  AssetFileUploadResponseDto,
  AssetResponseDto,
  LoginResponseDto,
  SharedLinkType,
} from '@immich/sdk';
import { DateTime } from 'luxon';
import { Socket } from 'socket.io-client';
import { createUserDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { apiUtils, app, dbUtils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

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
  let asset1: AssetFileUploadResponseDto;
  let asset2: AssetFileUploadResponseDto;
  let asset3: AssetFileUploadResponseDto;
  let asset4: AssetFileUploadResponseDto; // user2 asset
  let asset5: AssetFileUploadResponseDto;
  let asset6: AssetFileUploadResponseDto;
  let ws: Socket;

  beforeAll(async () => {
    apiUtils.setup();
    await dbUtils.reset();
    admin = await apiUtils.adminSetup({ onboarding: false });
    [user1, user2, userStats] = await Promise.all([
      apiUtils.userSetup(admin.accessToken, createUserDto.user1),
      apiUtils.userSetup(admin.accessToken, createUserDto.user2),
      apiUtils.userSetup(admin.accessToken, createUserDto.user3),
    ]);

    [asset1, asset2, asset3, asset4, asset5, asset6] = await Promise.all([
      apiUtils.createAsset(user1.accessToken),
      apiUtils.createAsset(user1.accessToken),
      apiUtils.createAsset(
        user1.accessToken,
        {
          isFavorite: true,
          isExternal: true,
          isReadOnly: true,
          fileCreatedAt: yesterday.toISO(),
          fileModifiedAt: yesterday.toISO(),
        },
        { filename: 'example.mp4' },
      ),
      apiUtils.createAsset(user2.accessToken),
      apiUtils.createAsset(user1.accessToken),
      apiUtils.createAsset(user1.accessToken),

      // stats
      apiUtils.createAsset(userStats.accessToken),
      apiUtils.createAsset(userStats.accessToken, { isFavorite: true }),
      apiUtils.createAsset(userStats.accessToken, { isArchived: true }),
      apiUtils.createAsset(
        userStats.accessToken,
        {
          isArchived: true,
          isFavorite: true,
        },
        { filename: 'example.mp4' },
      ),
    ]);

    const person1 = await apiUtils.createPerson(user1.accessToken, {
      name: 'Test Person',
    });
    await dbUtils.createFace({ assetId: asset1.id, personId: person1.id });
  });

  describe('GET /asset/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(
        `/asset/${uuidDto.notFound}`,
      );
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
        .get(`/asset/${asset4.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
    });

    it('should get the asset info', async () => {
      const { status, body } = await request(app)
        .get(`/asset/${asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({ id: asset1.id });
    });

    it('should work with a shared link', async () => {
      const sharedLink = await apiUtils.createSharedLink(user1.accessToken, {
        type: SharedLinkType.Individual,
        assetIds: [asset1.id],
      });

      const { status, body } = await request(app).get(
        `/asset/${asset1.id}?key=${sharedLink.key}`,
      );
      expect(status).toBe(200);
      expect(body).toMatchObject({ id: asset1.id });
    });

    it('should not send people data for shared links for un-authenticated users', async () => {
      const { status, body } = await request(app)
        .get(`/asset/${asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toEqual(200);
      expect(body).toMatchObject({
        id: asset1.id,
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
        assetIds: [asset1.id],
      });

      const data = await request(app).get(
        `/asset/${asset1.id}?key=${sharedLink.key}`,
      );
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

    it.each(Array(10))('should return 1 random assets', async () => {
      const { status, body } = await request(app)
        .get('/asset/random')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);

      const assets: AssetResponseDto[] = body;
      expect(assets.length).toBe(1);
      expect(assets[0].ownerId).toBe(user1.userId);
      //
      // assets owned by user2
      expect(assets[0].id).not.toBe(asset4.id);
      // assets owned by user1
      expect([asset1.id, asset2.id, asset3.id]).toContain(assets[0].id);
    });

    it.each(Array(10))('should return 2 random assets', async () => {
      const { status, body } = await request(app)
        .get('/asset/random?count=2')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);

      const assets: AssetResponseDto[] = body;
      expect(assets.length).toBe(2);

      for (const asset of assets) {
        expect(asset.ownerId).toBe(user1.userId);
        // assets owned by user1
        expect([asset1.id, asset2.id, asset3.id]).toContain(asset.id);
        // assets owned by user2
        expect(asset.id).not.toBe(asset4.id);
      }
    });

    it.each(Array(10))(
      'should return 1 asset if there are 10 assets in the database but user 2 only has 1',
      async () => {
        const { status, body } = await request(app)
          .get('/[]asset/random')
          .set('Authorization', `Bearer ${user2.accessToken}`);

        expect(status).toBe(200);
        expect(body).toEqual([expect.objectContaining({ id: asset4.id })]);
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
      const { status, body } = await request(app).put(
        `/asset/:${uuidDto.notFound}`,
      );
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
        .put(`/asset/${asset4.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
    });

    it('should favorite an asset', async () => {
      const before = await apiUtils.getAssetInfo(user1.accessToken, asset1.id);
      expect(before.isFavorite).toBe(false);

      const { status, body } = await request(app)
        .put(`/asset/${asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ isFavorite: true });
      expect(body).toMatchObject({ id: asset1.id, isFavorite: true });
      expect(status).toEqual(200);
    });

    it('should archive an asset', async () => {
      const before = await apiUtils.getAssetInfo(user1.accessToken, asset1.id);
      expect(before.isArchived).toBe(false);

      const { status, body } = await request(app)
        .put(`/asset/${asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ isArchived: true });
      expect(body).toMatchObject({ id: asset1.id, isArchived: true });
      expect(status).toEqual(200);
    });

    it('should update date time original', async () => {
      const { status, body } = await request(app)
        .put(`/asset/${asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ dateTimeOriginal: '2023-11-19T18:11:00.000-07:00' });

      expect(body).toMatchObject({
        id: asset1.id,
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
          .put(`/asset/${asset1.id}`)
          .send(test)
          .set('Authorization', `Bearer ${user1.accessToken}`);
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest());
      }
    });

    it('should update gps data', async () => {
      const { status, body } = await request(app)
        .put(`/asset/${asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ latitude: 12, longitude: 12 });

      expect(body).toMatchObject({
        id: asset1.id,
        exifInfo: expect.objectContaining({ latitude: 12, longitude: 12 }),
      });
      expect(status).toEqual(200);
    });

    it('should set the description', async () => {
      const { status, body } = await request(app)
        .put(`/asset/${asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ description: 'Test asset description' });
      expect(body).toMatchObject({
        id: asset1.id,
        exifInfo: expect.objectContaining({
          description: 'Test asset description',
        }),
      });
      expect(status).toEqual(200);
    });

    it('should return tagged people', async () => {
      const { status, body } = await request(app)
        .put(`/asset/${asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ isFavorite: true });
      expect(status).toEqual(200);
      expect(body).toMatchObject({
        id: asset1.id,
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
      expect(body).toEqual(
        errorDto.badRequest(['each value in ids must be a UUID']),
      );
    });

    it('should throw an error when the id is not found', async () => {
      const { status, body } = await request(app)
        .delete(`/asset`)
        .send({ ids: [uuidDto.notFound] })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.badRequest('Not found or no asset.delete access'),
      );
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
});
