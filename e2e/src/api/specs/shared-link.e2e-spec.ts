import {
  AlbumResponseDto,
  AssetResponseDto,
  LoginResponseDto,
  SharedLinkCreateDto,
  SharedLinkResponseDto,
  SharedLinkType,
  createSharedLink as create,
  createAlbum,
  deleteUser,
} from '@immich/sdk';
import { createUserDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { apiUtils, app, asBearerAuth, dbUtils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/shared-link', () => {
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

  beforeAll(async () => {
    apiUtils.setup();
    await dbUtils.reset();

    admin = await apiUtils.adminSetup();

    [user1, user2] = await Promise.all([
      apiUtils.userSetup(admin.accessToken, createUserDto.user1),
      apiUtils.userSetup(admin.accessToken, createUserDto.user2),
    ]);

    [asset1, asset2] = await Promise.all([
      apiUtils.createAsset(user1.accessToken),
      apiUtils.createAsset(user1.accessToken),
    ]);

    [album, deletedAlbum, metadataAlbum] = await Promise.all([
      createAlbum(
        { createAlbumDto: { albumName: 'album' } },
        { headers: asBearerAuth(user1.accessToken) }
      ),
      createAlbum(
        { createAlbumDto: { albumName: 'deleted album' } },
        { headers: asBearerAuth(user2.accessToken) }
      ),
      createAlbum(
        {
          createAlbumDto: {
            albumName: 'metadata album',
            assetIds: [asset1.id],
          },
        },
        { headers: asBearerAuth(user1.accessToken) }
      ),
    ]);

    [
      linkWithDeletedAlbum,
      linkWithAlbum,
      linkWithAssets,
      linkWithPassword,
      linkWithMetadata,
      linkWithoutMetadata,
    ] = await Promise.all([
      apiUtils.createSharedLink(user2.accessToken, {
        type: SharedLinkType.Album,
        albumId: deletedAlbum.id,
      }),
      apiUtils.createSharedLink(user1.accessToken, {
        type: SharedLinkType.Album,
        albumId: album.id,
      }),
      apiUtils.createSharedLink(user1.accessToken, {
        type: SharedLinkType.Individual,
        assetIds: [asset1.id],
      }),
      apiUtils.createSharedLink(user1.accessToken, {
        type: SharedLinkType.Album,
        albumId: album.id,
        password: 'foo',
      }),
      apiUtils.createSharedLink(user1.accessToken, {
        type: SharedLinkType.Album,
        albumId: metadataAlbum.id,
        showMetadata: true,
      }),
      apiUtils.createSharedLink(user1.accessToken, {
        type: SharedLinkType.Album,
        albumId: metadataAlbum.id,
        showMetadata: false,
      }),
    ]);

    await deleteUser(
      { id: user2.userId },
      { headers: asBearerAuth(admin.accessToken) }
    );
  });

  describe('GET /shared-link', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/shared-link');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should get all shared links created by user', async () => {
      const { status, body } = await request(app)
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
        ])
      );
    });

    it('should not get shared links created by other users', async () => {
      const { status, body } = await request(app)
        .get('/shared-link')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual([]);
    });
  });

  describe('GET /shared-link/me', () => {
    it('should not require admin authentication', async () => {
      const { status } = await request(app)
        .get('/shared-link/me')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(403);
    });

    it('should get data for correct shared link', async () => {
      const { status, body } = await request(app)
        .get('/shared-link/me')
        .query({ key: linkWithAlbum.key });

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          album,
          userId: user1.userId,
          type: SharedLinkType.Album,
        })
      );
    });

    it('should return unauthorized for incorrect shared link', async () => {
      const { status, body } = await request(app)
        .get('/shared-link/me')
        .query({ key: linkWithAlbum.key + 'foo' });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.invalidShareKey);
    });

    it('should return unauthorized if target has been soft deleted', async () => {
      const { status, body } = await request(app)
        .get('/shared-link/me')
        .query({ key: linkWithDeletedAlbum.key });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.invalidShareKey);
    });

    it('should return unauthorized for password protected link', async () => {
      const { status, body } = await request(app)
        .get('/shared-link/me')
        .query({ key: linkWithPassword.key });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.invalidSharePassword);
    });

    it('should get data for correct password protected link', async () => {
      const { status, body } = await request(app)
        .get('/shared-link/me')
        .query({ key: linkWithPassword.key, password: 'foo' });

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          album,
          userId: user1.userId,
          type: SharedLinkType.Album,
        })
      );
    });

    it('should return metadata for album shared link', async () => {
      const { status, body } = await request(app)
        .get('/shared-link/me')
        .query({ key: linkWithMetadata.key });

      expect(status).toBe(200);
      expect(body.assets).toHaveLength(1);
      expect(body.assets[0]).toEqual(
        expect.objectContaining({
          originalFileName: 'example',
          localDateTime: expect.any(String),
          fileCreatedAt: expect.any(String),
          exifInfo: expect.any(Object),
        })
      );
      expect(body.album).toBeDefined();
    });

    it('should not return metadata for album shared link without metadata', async () => {
      const { status, body } = await request(app)
        .get('/shared-link/me')
        .query({ key: linkWithoutMetadata.key });

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
      const { status, body } = await request(app).get(
        `/shared-link/${linkWithAlbum.id}`
      );

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should get shared link by id', async () => {
      const { status, body } = await request(app)
        .get(`/shared-link/${linkWithAlbum.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          album,
          userId: user1.userId,
          type: SharedLinkType.Album,
        })
      );
    });

    it('should not get shared link by id if user has not created the link or it does not exist', async () => {
      const { status, body } = await request(app)
        .get(`/shared-link/${linkWithAlbum.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(
        expect.objectContaining({ message: 'Shared link not found' })
      );
    });
  });

  describe('POST /shared-link', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .post('/shared-link')
        .send({ type: SharedLinkType.Album, albumId: uuidDto.notFound });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require a type and the correspondent asset/album id', async () => {
      const { status, body } = await request(app)
        .post('/shared-link')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should require an asset/album id', async () => {
      const { status, body } = await request(app)
        .post('/shared-link')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ type: SharedLinkType.Album });

      expect(status).toBe(400);
      expect(body).toEqual(
        expect.objectContaining({ message: 'Invalid albumId' })
      );
    });

    it('should require a valid asset id', async () => {
      const { status, body } = await request(app)
        .post('/shared-link')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ type: SharedLinkType.Individual, assetId: uuidDto.notFound });

      expect(status).toBe(400);
      expect(body).toEqual(
        expect.objectContaining({ message: 'Invalid assetIds' })
      );
    });

    it('should create a shared link', async () => {
      const { status, body } = await request(app)
        .post('/shared-link')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ type: SharedLinkType.Album, albumId: album.id });

      expect(status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          type: SharedLinkType.Album,
          userId: user1.userId,
        })
      );
    });
  });

  describe('PATCH /shared-link/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .patch(`/shared-link/${linkWithAlbum.id}`)
        .send({ description: 'foo' });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should fail if invalid link', async () => {
      const { status, body } = await request(app)
        .patch(`/shared-link/${uuidDto.notFound}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ description: 'foo' });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should update shared link', async () => {
      const { status, body } = await request(app)
        .patch(`/shared-link/${linkWithAlbum.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ description: 'foo' });

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          type: SharedLinkType.Album,
          userId: user1.userId,
          description: 'foo',
        })
      );
    });
  });

  describe('PUT /shared-link/:id/assets', () => {
    it('should not add assets to shared link (album)', async () => {
      const { status, body } = await request(app)
        .put(`/shared-link/${linkWithAlbum.id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset2.id] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Invalid shared link type'));
    });

    it('should add an assets to a shared link (individual)', async () => {
      const { status, body } = await request(app)
        .put(`/shared-link/${linkWithAssets.id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset2.id] });

      expect(body).toEqual([{ assetId: asset2.id, success: true }]);
      expect(status).toBe(200);
    });
  });

  describe('DELETE /shared-link/:id/assets', () => {
    it('should not remove assets from a shared link (album)', async () => {
      const { status, body } = await request(app)
        .delete(`/shared-link/${linkWithAlbum.id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset2.id] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Invalid shared link type'));
    });

    it('should remove assets from a shared link (individual)', async () => {
      const { status, body } = await request(app)
        .delete(`/shared-link/${linkWithAssets.id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset2.id] });

      expect(body).toEqual([{ assetId: asset2.id, success: true }]);
      expect(status).toBe(200);
    });
  });

  describe('DELETE /shared-link/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).delete(
        `/shared-link/${linkWithAlbum.id}`
      );

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should fail if invalid link', async () => {
      const { status, body } = await request(app)
        .delete(`/shared-link/${uuidDto.notFound}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should delete a shared link', async () => {
      const { status } = await request(app)
        .delete(`/shared-link/${linkWithAlbum.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
    });
  });
});
