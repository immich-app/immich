import {
  addAssetsToAlbum,
  AlbumResponseDto,
  AlbumUserRole,
  AssetFileUploadResponseDto,
  AssetOrder,
  deleteUser,
  getAlbumInfo,
  LoginResponseDto,
  SharedLinkType,
} from '@immich/sdk';
import { createUserDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const user1SharedEditorUser = 'user1SharedEditorUser';
const user1SharedViewerUser = 'user1SharedViewerUser';
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
    await utils.resetDatabase();

    admin = await utils.adminSetup();

    [user1, user2, user3] = await Promise.all([
      utils.userSetup(admin.accessToken, createUserDto.user1),
      utils.userSetup(admin.accessToken, createUserDto.user2),
      utils.userSetup(admin.accessToken, createUserDto.user3),
    ]);

    [user1Asset1, user1Asset2] = await Promise.all([
      utils.createAsset(user1.accessToken, { isFavorite: true }),
      utils.createAsset(user1.accessToken),
    ]);

    user1Albums = await Promise.all([
      utils.createAlbum(user1.accessToken, {
        albumName: user1SharedEditorUser,
        albumUsers: [{ userId: user2.userId, role: AlbumUserRole.Editor }],
        assetIds: [user1Asset1.id],
      }),
      utils.createAlbum(user1.accessToken, {
        albumName: user1SharedLink,
        assetIds: [user1Asset1.id],
      }),
      utils.createAlbum(user1.accessToken, {
        albumName: user1NotShared,
        assetIds: [user1Asset1.id, user1Asset2.id],
      }),
      utils.createAlbum(user1.accessToken, {
        albumName: user1SharedViewerUser,
        albumUsers: [{ userId: user2.userId, role: AlbumUserRole.Viewer }],
        assetIds: [user1Asset1.id],
      }),
    ]);

    user2Albums = await Promise.all([
      utils.createAlbum(user2.accessToken, {
        albumName: user2SharedUser,
        albumUsers: [
          { userId: user1.userId, role: AlbumUserRole.Editor },
          { userId: user3.userId, role: AlbumUserRole.Editor },
        ],
      }),
      utils.createAlbum(user2.accessToken, { albumName: user2SharedLink }),
      utils.createAlbum(user2.accessToken, { albumName: user2NotShared }),
    ]);

    await utils.createAlbum(user3.accessToken, {
      albumName: 'Deleted',
      albumUsers: [{ userId: user1.userId, role: AlbumUserRole.Editor }],
    });

    await addAssetsToAlbum(
      { id: user2Albums[0].id, bulkIdsDto: { ids: [user1Asset1.id] } },
      { headers: asBearerAuth(user1.accessToken) },
    );

    user2Albums[0] = await getAlbumInfo({ id: user2Albums[0].id }, { headers: asBearerAuth(user2.accessToken) });

    await Promise.all([
      // add shared link to user1SharedLink album
      utils.createSharedLink(user1.accessToken, {
        type: SharedLinkType.Album,
        albumId: user1Albums[1].id,
      }),
      // add shared link to user2SharedLink album
      utils.createSharedLink(user2.accessToken, {
        type: SharedLinkType.Album,
        albumId: user2Albums[1].id,
      }),
    ]);

    await deleteUser({ id: user3.userId, deleteUserDto: {} }, { headers: asBearerAuth(admin.accessToken) });
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
      expect(body).toHaveLength(4);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ownerId: user1.userId,
            albumName: user1SharedLink,
            shared: true,
          }),
          expect.objectContaining({
            ownerId: user1.userId,
            albumName: user1SharedEditorUser,
            shared: true,
          }),
          expect.objectContaining({
            ownerId: user1.userId,
            albumName: user1SharedViewerUser,
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
      expect(body).toHaveLength(4);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ownerId: user1.userId,
            albumName: user1SharedEditorUser,
            shared: true,
          }),
          expect.objectContaining({
            ownerId: user1.userId,
            albumName: user1SharedViewerUser,
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
      expect(body).toHaveLength(4);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ownerId: user1.userId,
            albumName: user1SharedEditorUser,
            shared: true,
          }),
          expect.objectContaining({
            ownerId: user1.userId,
            albumName: user1SharedViewerUser,
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
      expect(body).toHaveLength(5);
    });

    it('should return the album collection filtered by assetId and ignores shared=false', async () => {
      const { status, body } = await request(app)
        .get(`/album?shared=false&assetId=${user1Asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(5);
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

    it('should return album info for shared album (editor)', async () => {
      const { status, body } = await request(app)
        .get(`/album/${user2Albums[0].id}?withoutAssets=false`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({ id: user2Albums[0].id });
    });

    it('should return album info for shared album (viewer)', async () => {
      const { status, body } = await request(app)
        .get(`/album/${user1Albums[3].id}?withoutAssets=false`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({ id: user1Albums[3].id });
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
      expect(body).toEqual({ owned: 4, shared: 4, notShared: 1 });
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
        albumUsers: [],
        hasSharedLink: false,
        assets: [],
        assetCount: 0,
        owner: expect.objectContaining({ email: user1.userEmail }),
        isActivityEnabled: true,
        order: AssetOrder.Desc,
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
      const asset = await utils.createAsset(user1.accessToken);
      const { status, body } = await request(app)
        .put(`/album/${user1Albums[0].id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ ids: [asset.id] });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: asset.id, success: true })]);
    });

    it('should be able to add own asset to shared album', async () => {
      const asset = await utils.createAsset(user1.accessToken);
      const { status, body } = await request(app)
        .put(`/album/${user2Albums[0].id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ ids: [asset.id] });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: asset.id, success: true })]);
    });

    it('should not be able to add assets to album as a viewer', async () => {
      const asset = await utils.createAsset(user2.accessToken);
      const { status, body } = await request(app)
        .put(`/album/${user1Albums[3].id}/assets`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ ids: [asset.id] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Not found or no album.addAsset access'));
    });

    it('should add duplicate assets only once', async () => {
      const asset = await utils.createAsset(user1.accessToken);
      const { status, body } = await request(app)
        .put(`/album/${user1Albums[0].id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ ids: [asset.id, asset.id] });

      expect(status).toBe(200);
      expect(body).toEqual([
        expect.objectContaining({ id: asset.id, success: true }),
        expect.objectContaining({ id: asset.id, success: false, error: 'duplicate' }),
      ]);
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
      const album = await utils.createAlbum(user1.accessToken, {
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

    it('should not be able to update as a viewer', async () => {
      const { status, body } = await request(app)
        .patch(`/album/${user1Albums[3].id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ albumName: 'New album name' });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Not found or no album.update access'));
    });

    it('should not be able to update as an editor', async () => {
      const { status, body } = await request(app)
        .patch(`/album/${user1Albums[0].id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ albumName: 'New album name' });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Not found or no album.update access'));
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

    it('should not be able to remove assets from album as a viewer', async () => {
      const { status, body } = await request(app)
        .delete(`/album/${user1Albums[3].id}/assets`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ ids: [user1Asset1.id] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Not found or no album.removeAsset access'));
    });

    it('should remove duplicate assets only once', async () => {
      const { status, body } = await request(app)
        .delete(`/album/${user1Albums[1].id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ ids: [user1Asset1.id, user1Asset1.id] });

      expect(status).toBe(200);
      expect(body).toEqual([
        expect.objectContaining({ id: user1Asset1.id, success: true }),
        expect.objectContaining({ id: user1Asset1.id, success: false, error: 'not_found' }),
      ]);
    });
  });

  describe('PUT :id/users', () => {
    let album: AlbumResponseDto;

    beforeEach(async () => {
      album = await utils.createAlbum(user1.accessToken, {
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
        .send({ albumUsers: [{ userId: user2.userId, role: AlbumUserRole.Editor }] });

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
        .send({ albumUsers: [{ userId: user1.userId, role: AlbumUserRole.Editor }] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Cannot be shared with owner'));
    });

    it('should not be able to add existing user to shared album', async () => {
      await request(app)
        .put(`/album/${album.id}/users`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ albumUsers: [{ userId: user2.userId, role: AlbumUserRole.Editor }] });

      const { status, body } = await request(app)
        .put(`/album/${album.id}/users`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ albumUsers: [{ userId: user2.userId, role: AlbumUserRole.Editor }] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('User already added'));
    });
  });

  describe('PUT :id/user/:userId', () => {
    it('should allow the album owner to change the role of a shared user', async () => {
      const album = await utils.createAlbum(user1.accessToken, {
        albumName: 'testAlbum',
        albumUsers: [{ userId: user2.userId, role: AlbumUserRole.Viewer }],
      });

      expect(album.albumUsers[0].role).toEqual(AlbumUserRole.Viewer);

      const { status } = await request(app)
        .put(`/album/${album.id}/user/${user2.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ role: AlbumUserRole.Editor });

      expect(status).toBe(200);

      // Get album to verify the role change
      const { body } = await request(app).get(`/album/${album.id}`).set('Authorization', `Bearer ${user1.accessToken}`);
      expect(body).toEqual(
        expect.objectContaining({
          albumUsers: [expect.objectContaining({ role: AlbumUserRole.Editor })],
        }),
      );
    });

    it('should not allow a shared user to change the role of another shared user', async () => {
      const album = await utils.createAlbum(user1.accessToken, {
        albumName: 'testAlbum',
        albumUsers: [{ userId: user2.userId, role: AlbumUserRole.Viewer }],
      });

      expect(album.albumUsers[0].role).toEqual(AlbumUserRole.Viewer);

      const { status, body } = await request(app)
        .put(`/album/${album.id}/user/${user2.userId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ role: AlbumUserRole.Editor });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Not found or no album.share access'));
    });
  });
});
