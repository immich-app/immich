import {
  AlbumResponseDto,
  AssetResponseDto,
  IAssetRepository,
  LoginResponseDto,
  SharedLinkResponseDto,
} from '@app/domain';
import { SharedLinkController } from '@app/immich';
import { SharedLinkType } from '@app/infra/entities';
import { INestApplication } from '@nestjs/common';
import { api } from '@test/api';
import { errorStub, userDto, uuidStub } from '@test/fixtures';
import { testApp } from '@test/test-utils';
import { DateTime } from 'luxon';
import request from 'supertest';

describe(`${SharedLinkController.name} (e2e)`, () => {
  let server: any;
  let admin: LoginResponseDto;
  let asset1: AssetResponseDto;
  let asset2: AssetResponseDto;
  let user1: LoginResponseDto;
  let user2: LoginResponseDto;
  let album: AlbumResponseDto;
  let metadataAlbum: AlbumResponseDto;
  let deletedAlbum: AlbumResponseDto;
  let linkWithDeletedAlbum: SharedLinkResponseDto;
  let linkWithPassword: SharedLinkResponseDto;
  let linkWithAlbum: SharedLinkResponseDto;
  let linkWithAssets: SharedLinkResponseDto;
  let linkWithMetadata: SharedLinkResponseDto;
  let linkWithoutMetadata: SharedLinkResponseDto;
  let app: INestApplication<any>;

  beforeAll(async () => {
    app = await testApp.create();
    server = app.getHttpServer();
    const assetRepository = app.get<IAssetRepository>(IAssetRepository);

    await testApp.reset();
    await api.authApi.adminSignUp(server);
    admin = await api.authApi.adminLogin(server);

    await Promise.all([
      api.userApi.create(server, admin.accessToken, userDto.user1),
      api.userApi.create(server, admin.accessToken, userDto.user2),
    ]);

    [user1, user2] = await Promise.all([
      api.authApi.login(server, userDto.user1),
      api.authApi.login(server, userDto.user2),
    ]);

    [asset1, asset2] = await Promise.all([
      api.assetApi.create(server, user1.accessToken),
      api.assetApi.create(server, user1.accessToken),
    ]);

    await assetRepository.upsertExif({
      assetId: asset1.id,
      longitude: -108.400968333333,
      latitude: 39.115,
      orientation: '1',
      dateTimeOriginal: DateTime.fromISO('2022-01-10T19:15:44.310Z').toJSDate(),
      timeZone: 'UTC-4',
      state: 'Mesa County, Colorado',
      country: 'United States of America',
    });

    [album, deletedAlbum, metadataAlbum] = await Promise.all([
      api.albumApi.create(server, user1.accessToken, { albumName: 'album' }),
      api.albumApi.create(server, user2.accessToken, { albumName: 'deleted album' }),
      api.albumApi.create(server, user1.accessToken, { albumName: 'metadata album', assetIds: [asset1.id] }),
    ]);

    [linkWithDeletedAlbum, linkWithAlbum, linkWithAssets, linkWithPassword, linkWithMetadata, linkWithoutMetadata] =
      await Promise.all([
        api.sharedLinkApi.create(server, user2.accessToken, {
          type: SharedLinkType.ALBUM,
          albumId: deletedAlbum.id,
        }),
        api.sharedLinkApi.create(server, user1.accessToken, {
          type: SharedLinkType.ALBUM,
          albumId: album.id,
        }),
        api.sharedLinkApi.create(server, user1.accessToken, {
          type: SharedLinkType.INDIVIDUAL,
          assetIds: [asset1.id],
        }),
        api.sharedLinkApi.create(server, user1.accessToken, {
          type: SharedLinkType.ALBUM,
          albumId: album.id,
          password: 'foo',
        }),
        api.sharedLinkApi.create(server, user1.accessToken, {
          type: SharedLinkType.ALBUM,
          albumId: metadataAlbum.id,
          showMetadata: true,
        }),
        api.sharedLinkApi.create(server, user1.accessToken, {
          type: SharedLinkType.ALBUM,
          albumId: metadataAlbum.id,
          showMetadata: false,
        }),
      ]);

    await api.userApi.delete(server, admin.accessToken, user2.userId);
  });

  afterAll(async () => {
    await testApp.teardown();
  });

  describe('GET /shared-link', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/shared-link');

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should get all shared links created by user', async () => {
      const { status, body } = await request(server)
        .get('/shared-link')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toHaveLength(5);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: linkWithAlbum.id }),
          expect.objectContaining({ id: linkWithAssets.id }),
          expect.objectContaining({ id: linkWithPassword.id }),
          expect.objectContaining({ id: linkWithMetadata.id }),
          expect.objectContaining({ id: linkWithoutMetadata.id }),
        ]),
      );
    });

    it('should not get shared links created by other users', async () => {
      const { status, body } = await request(server)
        .get('/shared-link')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual([]);
    });
  });

  describe('GET /shared-link/me', () => {
    it('should not require admin authentication', async () => {
      const { status } = await request(server)
        .get('/shared-link/me')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(403);
    });

    it('should get data for correct shared link', async () => {
      const { status, body } = await request(server).get('/shared-link/me').query({ key: linkWithAlbum.key });

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          album,
          userId: user1.userId,
          type: SharedLinkType.ALBUM,
        }),
      );
    });

    it('should return unauthorized for incorrect shared link', async () => {
      const { status, body } = await request(server)
        .get('/shared-link/me')
        .query({ key: linkWithAlbum.key + 'foo' });

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.invalidShareKey);
    });

    it('should return unauthorized if target has been soft deleted', async () => {
      const { status, body } = await request(server).get('/shared-link/me').query({ key: linkWithDeletedAlbum.key });

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.invalidShareKey);
    });

    it('should return unauthorized for password protected link', async () => {
      const { status, body } = await request(server).get('/shared-link/me').query({ key: linkWithPassword.key });

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.invalidSharePassword);
    });

    it('should get data for correct password protected link', async () => {
      const { status, body } = await request(server)
        .get('/shared-link/me')
        .query({ key: linkWithPassword.key, password: 'foo' });

      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ album, userId: user1.userId, type: SharedLinkType.ALBUM }));
    });

    it('should return metadata for album shared link', async () => {
      const { status, body } = await request(server).get('/shared-link/me').query({ key: linkWithMetadata.key });

      expect(status).toBe(200);
      expect(body.assets).toHaveLength(1);
      expect(body.assets[0]).toEqual(
        expect.objectContaining({
          originalFileName: 'example',
          localDateTime: expect.any(String),
          fileCreatedAt: expect.any(String),
          exifInfo: expect.objectContaining({
            longitude: -108.400968333333,
            latitude: 39.115,
            orientation: '1',
            dateTimeOriginal: expect.any(String),
            timeZone: 'UTC-4',
            state: 'Mesa County, Colorado',
            country: 'United States of America',
          }),
        }),
      );
      expect(body.album).toBeDefined();
    });

    it('should not return metadata for album shared link without metadata', async () => {
      const { status, body } = await request(server).get('/shared-link/me').query({ key: linkWithoutMetadata.key });

      expect(status).toBe(200);
      expect(body.assets).toHaveLength(1);
      expect(body.album).toBeDefined();

      const asset = body.assets[0];
      expect(asset).not.toHaveProperty('exifInfo');
      expect(asset).not.toHaveProperty('fileCreatedAt');
      expect(asset).not.toHaveProperty('originalFilename');
      expect(asset).not.toHaveProperty('originalPath');
    });
  });

  describe('GET /shared-link/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get(`/shared-link/${linkWithAlbum.id}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should get shared link by id', async () => {
      const { status, body } = await request(server)
        .get(`/shared-link/${linkWithAlbum.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ album, userId: user1.userId, type: SharedLinkType.ALBUM }));
    });

    it('should not get shared link by id if user has not created the link or it does not exist', async () => {
      const { status, body } = await request(server)
        .get(`/shared-link/${linkWithAlbum.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'Shared link not found' }));
    });
  });

  describe('POST /shared-link', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server)
        .post('/shared-link')
        .send({ type: SharedLinkType.ALBUM, albumId: uuidStub.notFound });

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should require a type and the correspondent asset/album id', async () => {
      const { status, body } = await request(server)
        .post('/shared-link')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest());
    });

    it('should require an asset/album id', async () => {
      const { status, body } = await request(server)
        .post('/shared-link')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ type: SharedLinkType.ALBUM });

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'Invalid albumId' }));
    });

    it('should require a valid asset id', async () => {
      const { status, body } = await request(server)
        .post('/shared-link')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ type: SharedLinkType.INDIVIDUAL, assetId: uuidStub.notFound });

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'Invalid assetIds' }));
    });

    it('should create a shared link', async () => {
      const { status, body } = await request(server)
        .post('/shared-link')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ type: SharedLinkType.ALBUM, albumId: album.id });

      expect(status).toBe(201);
      expect(body).toEqual(expect.objectContaining({ type: SharedLinkType.ALBUM, userId: user1.userId }));
    });
  });

  describe('PATCH /shared-link/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server)
        .patch(`/shared-link/${linkWithAlbum.id}`)
        .send({ description: 'foo' });

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should fail if invalid link', async () => {
      const { status, body } = await request(server)
        .patch(`/shared-link/${uuidStub.notFound}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ description: 'foo' });

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest());
    });

    it('should update shared link', async () => {
      const { status, body } = await request(server)
        .patch(`/shared-link/${linkWithAlbum.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ description: 'foo' });

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({ type: SharedLinkType.ALBUM, userId: user1.userId, description: 'foo' }),
      );
    });
  });

  describe('PUT /shared-link/:id/assets', () => {
    it('should not add assets to shared link (album)', async () => {
      const { status, body } = await request(server)
        .put(`/shared-link/${linkWithAlbum.id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset2.id] });

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest('Invalid shared link type'));
    });

    it('should add an assets to a shared link (individual)', async () => {
      const { status, body } = await request(server)
        .put(`/shared-link/${linkWithAssets.id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset2.id] });

      expect(body).toEqual([{ assetId: asset2.id, success: true }]);
      expect(status).toBe(200);
    });
  });

  describe('DELETE /shared-link/:id/assets', () => {
    it('should not remove assets from a shared link (album)', async () => {
      const { status, body } = await request(server)
        .delete(`/shared-link/${linkWithAlbum.id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset2.id] });

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest('Invalid shared link type'));
    });

    it('should remove assets from a shared link (individual)', async () => {
      const { status, body } = await request(server)
        .delete(`/shared-link/${linkWithAssets.id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset2.id] });

      expect(body).toEqual([{ assetId: asset2.id, success: true }]);
      expect(status).toBe(200);
    });
  });

  describe('DELETE /shared-link/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).delete(`/shared-link/${linkWithAlbum.id}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should fail if invalid link', async () => {
      const { status, body } = await request(server)
        .delete(`/shared-link/${uuidStub.notFound}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest());
    });

    it('should delete a shared link', async () => {
      const { status } = await request(server)
        .delete(`/shared-link/${linkWithAlbum.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
    });
  });
});
