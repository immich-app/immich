import {
  AlbumResponseDto,
  AssetMediaResponseDto,
  LoginResponseDto,
  SharedLinkResponseDto,
  SharedLinkType,
  createAlbum,
  deleteUserAdmin,
} from '@immich/sdk';
import { createUserDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, shareUrl, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/shared-links', () => {
  let admin: LoginResponseDto;
  let asset1: AssetMediaResponseDto;
  let asset2: AssetMediaResponseDto;
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
    await utils.resetDatabase();

    admin = await utils.adminSetup();

    [user1, user2] = await Promise.all([
      utils.userSetup(admin.accessToken, createUserDto.user1),
      utils.userSetup(admin.accessToken, createUserDto.user2),
    ]);

    [asset1, asset2] = await Promise.all([utils.createAsset(user1.accessToken), utils.createAsset(user1.accessToken)]);

    [album, deletedAlbum, metadataAlbum] = await Promise.all([
      createAlbum({ createAlbumDto: { albumName: 'album' } }, { headers: asBearerAuth(user1.accessToken) }),
      createAlbum({ createAlbumDto: { albumName: 'deleted album' } }, { headers: asBearerAuth(user2.accessToken) }),
      createAlbum(
        {
          createAlbumDto: {
            albumName: 'metadata album',
            assetIds: [asset1.id],
          },
        },
        { headers: asBearerAuth(user1.accessToken) },
      ),
    ]);

    [linkWithDeletedAlbum, linkWithAlbum, linkWithAssets, linkWithPassword, linkWithMetadata, linkWithoutMetadata] =
      await Promise.all([
        utils.createSharedLink(user2.accessToken, {
          type: SharedLinkType.Album,
          albumId: deletedAlbum.id,
        }),
        utils.createSharedLink(user1.accessToken, {
          type: SharedLinkType.Album,
          albumId: album.id,
        }),
        utils.createSharedLink(user1.accessToken, {
          type: SharedLinkType.Individual,
          assetIds: [asset1.id],
        }),
        utils.createSharedLink(user1.accessToken, {
          type: SharedLinkType.Album,
          albumId: album.id,
          password: 'foo',
        }),
        utils.createSharedLink(user1.accessToken, {
          type: SharedLinkType.Album,
          albumId: metadataAlbum.id,
          showMetadata: true,
        }),
        utils.createSharedLink(user1.accessToken, {
          type: SharedLinkType.Album,
          albumId: metadataAlbum.id,
          showMetadata: false,
        }),
      ]);

    await deleteUserAdmin({ id: user2.userId, userAdminDeleteDto: {} }, { headers: asBearerAuth(admin.accessToken) });
  });

  describe('GET /share/${key}', () => {
    it('should have correct asset count in meta tag for non-empty album', async () => {
      const resp = await request(shareUrl).get(`/${linkWithMetadata.key}`);
      expect(resp.status).toBe(200);
      expect(resp.header['content-type']).toContain('text/html');
      expect(resp.text).toContain(
        `<meta name="description" content="${metadataAlbum.assets.length} shared photos & videos" />`,
      );
    });

    it('should have correct asset count in meta tag for empty album', async () => {
      const resp = await request(shareUrl).get(`/${linkWithAlbum.key}`);
      expect(resp.status).toBe(200);
      expect(resp.header['content-type']).toContain('text/html');
      expect(resp.text).toContain(`<meta name="description" content="0 shared photos & videos" />`);
    });

    it('should have correct asset count in meta tag for shared asset', async () => {
      const resp = await request(shareUrl).get(`/${linkWithAssets.key}`);
      expect(resp.status).toBe(200);
      expect(resp.header['content-type']).toContain('text/html');
      expect(resp.text).toContain(`<meta name="description" content="1 shared photos & videos" />`);
    });
  });

  describe('GET /shared-links', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/shared-links');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should get all shared links created by user', async () => {
      const { status, body } = await request(app)
        .get('/shared-links')
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
      const { status, body } = await request(app)
        .get('/shared-links')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual([]);
    });
  });

  describe('GET /shared-links/me', () => {
    it('should not require admin authentication', async () => {
      const { status } = await request(app).get('/shared-links/me').set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(403);
    });

    it('should get data for correct shared link', async () => {
      const { status, body } = await request(app).get('/shared-links/me').query({ key: linkWithAlbum.key });

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          album,
          userId: user1.userId,
          type: SharedLinkType.Album,
        }),
      );
    });

    it('should return unauthorized for incorrect shared link', async () => {
      const { status, body } = await request(app)
        .get('/shared-links/me')
        .query({ key: linkWithAlbum.key + 'foo' });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.invalidShareKey);
    });

    it('should return unauthorized if target has been soft deleted', async () => {
      const { status, body } = await request(app).get('/shared-links/me').query({ key: linkWithDeletedAlbum.key });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.invalidShareKey);
    });

    it('should return unauthorized for password protected link', async () => {
      const { status, body } = await request(app).get('/shared-links/me').query({ key: linkWithPassword.key });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.invalidSharePassword);
    });

    it('should get data for correct password protected link', async () => {
      const { status, body } = await request(app)
        .get('/shared-links/me')
        .query({ key: linkWithPassword.key, password: 'foo' });

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          album,
          userId: user1.userId,
          type: SharedLinkType.Album,
        }),
      );
    });

    it('should return metadata for album shared link', async () => {
      const { status, body } = await request(app).get('/shared-links/me').query({ key: linkWithMetadata.key });

      expect(status).toBe(200);
      expect(body.assets).toHaveLength(1);
      expect(body.assets[0]).toEqual(
        expect.objectContaining({
          originalFileName: 'example.png',
          localDateTime: expect.any(String),
          fileCreatedAt: expect.any(String),
          exifInfo: expect.any(Object),
        }),
      );
      expect(body.album).toBeDefined();
    });

    it('should not return metadata for album shared link without metadata', async () => {
      const { status, body } = await request(app).get('/shared-links/me').query({ key: linkWithoutMetadata.key });

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

  describe('GET /shared-links/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/shared-links/${linkWithAlbum.id}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should get shared link by id', async () => {
      const { status, body } = await request(app)
        .get(`/shared-links/${linkWithAlbum.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          album,
          userId: user1.userId,
          type: SharedLinkType.Album,
        }),
      );
    });

    it('should not get shared link by id if user has not created the link or it does not exist', async () => {
      const { status, body } = await request(app)
        .get(`/shared-links/${linkWithAlbum.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'Shared link not found' }));
    });
  });

  describe('POST /shared-links', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .post('/shared-links')
        .send({ type: SharedLinkType.Album, albumId: uuidDto.notFound });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require a type and the correspondent asset/album id', async () => {
      const { status, body } = await request(app)
        .post('/shared-links')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should require an asset/album id', async () => {
      const { status, body } = await request(app)
        .post('/shared-links')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ type: SharedLinkType.Album });

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'Invalid albumId' }));
    });

    it('should require a valid asset id', async () => {
      const { status, body } = await request(app)
        .post('/shared-links')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ type: SharedLinkType.Individual, assetId: uuidDto.notFound });

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'Invalid assetIds' }));
    });

    it('should create a shared link', async () => {
      const { status, body } = await request(app)
        .post('/shared-links')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ type: SharedLinkType.Album, albumId: album.id });

      expect(status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          type: SharedLinkType.Album,
          userId: user1.userId,
        }),
      );
    });
  });

  describe('PATCH /shared-links/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .patch(`/shared-links/${linkWithAlbum.id}`)
        .send({ description: 'foo' });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should fail if invalid link', async () => {
      const { status, body } = await request(app)
        .patch(`/shared-links/${uuidDto.notFound}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ description: 'foo' });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should update shared link', async () => {
      const { status, body } = await request(app)
        .patch(`/shared-links/${linkWithAlbum.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ description: 'foo' });

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          type: SharedLinkType.Album,
          userId: user1.userId,
          description: 'foo',
        }),
      );
    });
  });

  describe('PUT /shared-links/:id/assets', () => {
    it('should not add assets to shared link (album)', async () => {
      const { status, body } = await request(app)
        .put(`/shared-links/${linkWithAlbum.id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset2.id] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Invalid shared link type'));
    });

    it('should add an assets to a shared link (individual)', async () => {
      const { status, body } = await request(app)
        .put(`/shared-links/${linkWithAssets.id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset2.id] });

      expect(body).toEqual([{ assetId: asset2.id, success: true }]);
      expect(status).toBe(200);
    });
  });

  describe('DELETE /shared-links/:id/assets', () => {
    it('should not remove assets from a shared link (album)', async () => {
      const { status, body } = await request(app)
        .delete(`/shared-links/${linkWithAlbum.id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset2.id] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Invalid shared link type'));
    });

    it('should remove assets from a shared link (individual)', async () => {
      const { status, body } = await request(app)
        .delete(`/shared-links/${linkWithAssets.id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset2.id] });

      expect(body).toEqual([{ assetId: asset2.id, success: true }]);
      expect(status).toBe(200);
    });
  });

  describe('DELETE /shared-links/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).delete(`/shared-links/${linkWithAlbum.id}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should fail if invalid link', async () => {
      const { status, body } = await request(app)
        .delete(`/shared-links/${uuidDto.notFound}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should delete a shared link', async () => {
      const { status } = await request(app)
        .delete(`/shared-links/${linkWithAlbum.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
    });
  });
});
