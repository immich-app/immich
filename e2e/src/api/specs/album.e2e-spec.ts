import {
  AlbumResponseDto,
  AssetFileUploadResponseDto,
  LoginResponseDto,
  SharedLinkType,
  deleteUser,
} from '@immich/sdk';
import { createUserDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { apiUtils, app, asBearerAuth, dbUtils } from 'src/utils';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const user1SharedUser = 'user1SharedUser';
const user1SharedLink = 'user1SharedLink';
const user1NotShared = 'user1NotShared';
const user2SharedUser = 'user2SharedUser';
const user2SharedLink = 'user2SharedLink';
const user2NotShared = 'user2NotShared';

describe('/album', () => {
  let admin: LoginResponseDto;
  let user1: LoginResponseDto;
  let user1Asset1: AssetFileUploadResponseDto;
  let user1Asset2: AssetFileUploadResponseDto;
  let user1Albums: AlbumResponseDto[];
  let user2: LoginResponseDto;
  let user2Albums: AlbumResponseDto[];
  let user3: LoginResponseDto; // deleted

  beforeAll(async () => {
    apiUtils.setup();
    await dbUtils.reset();

    admin = await apiUtils.adminSetup();

    [user1, user2, user3] = await Promise.all([
      apiUtils.userSetup(admin.accessToken, createUserDto.user1),
      apiUtils.userSetup(admin.accessToken, createUserDto.user2),
      apiUtils.userSetup(admin.accessToken, createUserDto.user3),
    ]);

    [user1Asset1, user1Asset2] = await Promise.all([
      apiUtils.createAsset(user1.accessToken, { isFavorite: true }),
      apiUtils.createAsset(user1.accessToken),
    ]);

    const albums = await Promise.all([
      // user 1
      apiUtils.createAlbum(user1.accessToken, {
        albumName: user1SharedUser,
        sharedWithUserIds: [user2.userId],
        assetIds: [user1Asset1.id],
      }),
      apiUtils.createAlbum(user1.accessToken, {
        albumName: user1SharedLink,
        assetIds: [user1Asset1.id],
      }),
      apiUtils.createAlbum(user1.accessToken, {
        albumName: user1NotShared,
        assetIds: [user1Asset1.id, user1Asset2.id],
      }),

      // user 2
      apiUtils.createAlbum(user2.accessToken, {
        albumName: user2SharedUser,
        sharedWithUserIds: [user1.userId],
        assetIds: [user1Asset1.id],
      }),
      apiUtils.createAlbum(user2.accessToken, { albumName: user2SharedLink }),
      apiUtils.createAlbum(user2.accessToken, { albumName: user2NotShared }),

      // user 3
      apiUtils.createAlbum(user3.accessToken, {
        albumName: 'Deleted',
        sharedWithUserIds: [user1.userId],
      }),
    ]);

    user1Albums = albums.slice(0, 3);
    user2Albums = albums.slice(3, 6);

    await Promise.all([
      // add shared link to user1SharedLink album
      apiUtils.createSharedLink(user1.accessToken, {
        type: SharedLinkType.Album,
        albumId: user1Albums[1].id,
      }),
      // add shared link to user2SharedLink album
      apiUtils.createSharedLink(user2.accessToken, {
        type: SharedLinkType.Album,
        albumId: user2Albums[1].id,
      }),
    ]);

    await deleteUser({ id: user3.userId }, { headers: asBearerAuth(admin.accessToken) });
  });

  describe('GET /album', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/album');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should reject an invalid shared param', async () => {
      const { status, body } = await request(app)
        .get('/album?shared=invalid')
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toEqual(400);
      expect(body).toEqual(errorDto.badRequest(['shared must be a boolean value']));
    });

    it('should reject an invalid assetId param', async () => {
      const { status, body } = await request(app)
        .get('/album?assetId=invalid')
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toEqual(400);
      expect(body).toEqual(errorDto.badRequest(['assetId must be a UUID']));
    });

    it("should not show other users' favorites", async () => {
      const { status, body } = await request(app)
        .get(`/album/${user1Albums[0].id}?withoutAssets=false`)
        .set('Authorization', `Bearer ${user2.accessToken}`);
      expect(status).toEqual(200);
      expect(body).toEqual({
        ...user1Albums[0],
        assets: [expect.objectContaining({ isFavorite: false })],
      });
    });

    it('should not return shared albums with a deleted owner', async () => {
      const { status, body } = await request(app)
        .get('/album?shared=true')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toHaveLength(3);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ownerId: user1.userId,
            albumName: user1SharedLink,
            shared: true,
          }),
          expect.objectContaining({
            ownerId: user1.userId,
            albumName: user1SharedUser,
            shared: true,
          }),
          expect.objectContaining({
            ownerId: user2.userId,
            albumName: user2SharedUser,
            shared: true,
          }),
        ]),
      );
    });

    it('should return the album collection including owned and shared', async () => {
      const { status, body } = await request(app).get('/album').set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(3);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ownerId: user1.userId,
            albumName: user1SharedUser,
            shared: true,
          }),
          expect.objectContaining({
            ownerId: user1.userId,
            albumName: user1SharedLink,
            shared: true,
          }),
          expect.objectContaining({
            ownerId: user1.userId,
            albumName: user1NotShared,
            shared: false,
          }),
        ]),
      );
    });

    it('should return the album collection filtered by shared', async () => {
      const { status, body } = await request(app)
        .get('/album?shared=true')
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(3);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ownerId: user1.userId,
            albumName: user1SharedUser,
            shared: true,
          }),
          expect.objectContaining({
            ownerId: user1.userId,
            albumName: user1SharedLink,
            shared: true,
          }),
          expect.objectContaining({
            ownerId: user2.userId,
            albumName: user2SharedUser,
            shared: true,
          }),
        ]),
      );
    });

    it('should return the album collection filtered by NOT shared', async () => {
      const { status, body } = await request(app)
        .get('/album?shared=false')
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ownerId: user1.userId,
            albumName: user1NotShared,
            shared: false,
          }),
        ]),
      );
    });

    it('should return the album collection filtered by assetId', async () => {
      const { status, body } = await request(app)
        .get(`/album?assetId=${user1Asset2.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(1);
    });

    it('should return the album collection filtered by assetId and ignores shared=true', async () => {
      const { status, body } = await request(app)
        .get(`/album?shared=true&assetId=${user1Asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(4);
    });

    it('should return the album collection filtered by assetId and ignores shared=false', async () => {
      const { status, body } = await request(app)
        .get(`/album?shared=false&assetId=${user1Asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(4);
    });
  });

  describe('GET /album/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/album/${user1Albums[0].id}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should return album info for own album', async () => {
      const { status, body } = await request(app)
        .get(`/album/${user1Albums[0].id}?withoutAssets=false`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({
        ...user1Albums[0],
        assets: [expect.objectContaining({ id: user1Albums[0].assets[0].id })],
      });
    });

    it('should return album info for shared album', async () => {
      const { status, body } = await request(app)
        .get(`/album/${user2Albums[0].id}?withoutAssets=false`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({
        ...user2Albums[0],
        assets: [expect.objectContaining({ id: user2Albums[0].assets[0].id })],
      });
    });

    it('should return album info with assets when withoutAssets is undefined', async () => {
      const { status, body } = await request(app)
        .get(`/album/${user1Albums[0].id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({
        ...user1Albums[0],
        assets: [expect.objectContaining({ id: user1Albums[0].assets[0].id })],
      });
    });

    it('should return album info without assets when withoutAssets is true', async () => {
      const { status, body } = await request(app)
        .get(`/album/${user1Albums[0].id}?withoutAssets=true`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({
        ...user1Albums[0],
        assets: [],
        assetCount: 1,
      });
    });
  });

  describe('GET /album/count', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/album/count');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should return total count of albums the user has access to', async () => {
      const { status, body } = await request(app)
        .get('/album/count')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({ owned: 3, shared: 3, notShared: 1 });
    });
  });

  describe('POST /album', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/album').send({ albumName: 'New album' });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should create an album', async () => {
      const { status, body } = await request(app)
        .post('/album')
        .send({ albumName: 'New album' })
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(201);
      expect(body).toEqual({
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        ownerId: user1.userId,
        albumName: 'New album',
        description: '',
        albumThumbnailAssetId: null,
        shared: false,
        sharedUsers: [],
        hasSharedLink: false,
        assets: [],
        assetCount: 0,
        owner: expect.objectContaining({ email: user1.userEmail }),
        isActivityEnabled: true,
      });
    });
  });

  describe('PUT /album/:id/assets', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/album/${user1Albums[0].id}/assets`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should be able to add own asset to own album', async () => {
      const asset = await apiUtils.createAsset(user1.accessToken);
      const { status, body } = await request(app)
        .put(`/album/${user1Albums[0].id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ ids: [asset.id] });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: asset.id, success: true })]);
    });

    it('should be able to add own asset to shared album', async () => {
      const asset = await apiUtils.createAsset(user1.accessToken);
      const { status, body } = await request(app)
        .put(`/album/${user2Albums[0].id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ ids: [asset.id] });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: asset.id, success: true })]);
    });
  });

  describe('PATCH /album/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .patch(`/album/${uuidDto.notFound}`)
        .send({ albumName: 'New album name' });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should update an album', async () => {
      const album = await apiUtils.createAlbum(user1.accessToken, {
        albumName: 'New album',
      });
      const { status, body } = await request(app)
        .patch(`/album/${album.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          albumName: 'New album name',
          description: 'An album description',
        });
      expect(status).toBe(200);
      expect(body).toEqual({
        ...album,
        updatedAt: expect.any(String),
        albumName: 'New album name',
        description: 'An album description',
      });
    });
  });

  describe('DELETE /album/:id/assets', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .delete(`/album/${user1Albums[0].id}/assets`)
        .send({ ids: [user1Asset1.id] });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should not be able to remove foreign asset from own album', async () => {
      const { status, body } = await request(app)
        .delete(`/album/${user2Albums[0].id}/assets`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ ids: [user1Asset1.id] });

      expect(status).toBe(200);
      expect(body).toEqual([
        expect.objectContaining({
          id: user1Asset1.id,
          success: false,
          error: 'no_permission',
        }),
      ]);
    });

    it('should not be able to remove foreign asset from foreign album', async () => {
      const { status, body } = await request(app)
        .delete(`/album/${user1Albums[0].id}/assets`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ ids: [user1Asset1.id] });

      expect(status).toBe(200);
      expect(body).toEqual([
        expect.objectContaining({
          id: user1Asset1.id,
          success: false,
          error: 'no_permission',
        }),
      ]);
    });

    it('should be able to remove own asset from own album', async () => {
      const { status, body } = await request(app)
        .delete(`/album/${user1Albums[0].id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ ids: [user1Asset1.id] });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: user1Asset1.id, success: true })]);
    });

    it('should be able to remove own asset from shared album', async () => {
      const { status, body } = await request(app)
        .delete(`/album/${user2Albums[0].id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ ids: [user1Asset1.id] });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: user1Asset1.id, success: true })]);
    });
  });

  describe('PUT :id/users', () => {
    let album: AlbumResponseDto;

    beforeEach(async () => {
      album = await apiUtils.createAlbum(user1.accessToken, {
        albumName: 'testAlbum',
      });
    });

    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/album/${user1Albums[0].id}/users`).send({ sharedUserIds: [] });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should be able to add user to own album', async () => {
      const { status, body } = await request(app)
        .put(`/album/${album.id}/users`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ sharedUserIds: [user2.userId] });

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          sharedUsers: [expect.objectContaining({ id: user2.userId })],
        }),
      );
    });

    it('should not be able to share album with owner', async () => {
      const { status, body } = await request(app)
        .put(`/album/${album.id}/users`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ sharedUserIds: [user1.userId] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Cannot be shared with owner'));
    });

    it('should not be able to add existing user to shared album', async () => {
      await request(app)
        .put(`/album/${album.id}/users`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ sharedUserIds: [user2.userId] });

      const { status, body } = await request(app)
        .put(`/album/${album.id}/users`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ sharedUserIds: [user2.userId] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('User already added'));
    });
  });
});
