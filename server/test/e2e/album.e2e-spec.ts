import { AlbumResponseDto, LoginResponseDto } from '@app/domain';
import { AlbumController } from '@app/immich';
import { AssetFileUploadResponseDto } from '@app/immich/api-v1/asset/response-dto/asset-file-upload-response.dto';
import { SharedLinkType } from '@app/infra/entities';
import { api } from '@test/api';
import { errorStub, userDto, uuidStub } from '@test/fixtures';
import { testApp } from '@test/test-utils';
import request from 'supertest';

const user1SharedUser = 'user1SharedUser';
const user1SharedLink = 'user1SharedLink';
const user1NotShared = 'user1NotShared';
const user2SharedUser = 'user2SharedUser';
const user2SharedLink = 'user2SharedLink';
const user2NotShared = 'user2NotShared';

describe(`${AlbumController.name} (e2e)`, () => {
  let server: any;
  let admin: LoginResponseDto;
  let user1: LoginResponseDto;
  let user1Asset: AssetFileUploadResponseDto;
  let user1Albums: AlbumResponseDto[];
  let user2: LoginResponseDto;
  let user2Albums: AlbumResponseDto[];

  beforeAll(async () => {
    [server] = await testApp.create();
  });

  afterAll(async () => {
    await testApp.teardown();
  });

  beforeEach(async () => {
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

    user1Asset = await api.assetApi.upload(server, user1.accessToken, 'example');

    const albums = await Promise.all([
      // user 1
      api.albumApi.create(server, user1.accessToken, {
        albumName: user1SharedUser,
        sharedWithUserIds: [user2.userId],
        assetIds: [user1Asset.id],
      }),
      api.albumApi.create(server, user1.accessToken, { albumName: user1SharedLink, assetIds: [user1Asset.id] }),
      api.albumApi.create(server, user1.accessToken, { albumName: user1NotShared, assetIds: [user1Asset.id] }),

      // user 2
      api.albumApi.create(server, user2.accessToken, {
        albumName: user2SharedUser,
        sharedWithUserIds: [user1.userId],
        assetIds: [user1Asset.id],
      }),
      api.albumApi.create(server, user2.accessToken, { albumName: user2SharedLink }),
      api.albumApi.create(server, user2.accessToken, { albumName: user2NotShared }),
    ]);

    user1Albums = albums.slice(0, 3);
    user2Albums = albums.slice(3);

    await Promise.all([
      // add shared link to user1SharedLink album
      api.sharedLinkApi.create(server, user1.accessToken, {
        type: SharedLinkType.ALBUM,
        albumId: user1Albums[1].id,
      }),

      // add shared link to user2SharedLink album
      api.sharedLinkApi.create(server, user2.accessToken, {
        type: SharedLinkType.ALBUM,
        albumId: user2Albums[1].id,
      }),
    ]);
  });

  describe('GET /album', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/album');
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should reject an invalid shared param', async () => {
      const { status, body } = await request(server)
        .get('/album?shared=invalid')
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toEqual(400);
      expect(body).toEqual(errorStub.badRequest(['shared must be a boolean value']));
    });

    it('should reject an invalid assetId param', async () => {
      const { status, body } = await request(server)
        .get('/album?assetId=invalid')
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toEqual(400);
      expect(body).toEqual(errorStub.badRequest(['assetId must be a UUID']));
    });

    it('should not return shared albums with a deleted owner', async () => {
      await api.userApi.delete(server, admin.accessToken, user1.userId);
      const { status, body } = await request(server)
        .get('/album?shared=true')
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ ownerId: user2.userId, albumName: user2SharedLink, shared: true }),
        ]),
      );
    });

    it('should return the album collection including owned and shared', async () => {
      const { status, body } = await request(server).get('/album').set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(3);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ ownerId: user1.userId, albumName: user1SharedUser, shared: true }),
          expect.objectContaining({ ownerId: user1.userId, albumName: user1SharedLink, shared: true }),
          expect.objectContaining({ ownerId: user1.userId, albumName: user1NotShared, shared: false }),
        ]),
      );
    });

    it('should return the album collection filtered by shared', async () => {
      const { status, body } = await request(server)
        .get('/album?shared=true')
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(3);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ ownerId: user1.userId, albumName: user1SharedUser, shared: true }),
          expect.objectContaining({ ownerId: user1.userId, albumName: user1SharedLink, shared: true }),
          expect.objectContaining({ ownerId: user2.userId, albumName: user2SharedUser, shared: true }),
        ]),
      );
    });

    it('should return the album collection filtered by NOT shared', async () => {
      const { status, body } = await request(server)
        .get('/album?shared=false')
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ ownerId: user1.userId, albumName: user1NotShared, shared: false }),
        ]),
      );
    });

    it('should return the album collection filtered by assetId', async () => {
      const asset = await api.assetApi.upload(server, user1.accessToken, 'example2');
      await api.albumApi.addAssets(server, user1.accessToken, user1Albums[0].id, { ids: [asset.id] });
      const { status, body } = await request(server)
        .get(`/album?assetId=${asset.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(1);
    });

    it('should return the album collection filtered by assetId and ignores shared=true', async () => {
      const { status, body } = await request(server)
        .get(`/album?shared=true&assetId=${user1Asset.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(4);
    });

    it('should return the album collection filtered by assetId and ignores shared=false', async () => {
      const { status, body } = await request(server)
        .get(`/album?shared=false&assetId=${user1Asset.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(4);
    });
  });

  describe('POST /album', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).post('/album').send({ albumName: 'New album' });
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should create an album', async () => {
      const body = await api.albumApi.create(server, user1.accessToken, { albumName: 'New album' });
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

  describe('GET /album/count', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/album/count');
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should return total count of albums the user has access to', async () => {
      const { status, body } = await request(server)
        .get('/album/count')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({ owned: 3, shared: 3, notShared: 1 });
    });
  });

  describe('GET /album/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get(`/album/${user1Albums[0].id}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should return album info for own album', async () => {
      const { status, body } = await request(server)
        .get(`/album/${user1Albums[0].id}?withoutAssets=false`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(user1Albums[0]);
    });

    it('should return album info for shared album', async () => {
      const { status, body } = await request(server)
        .get(`/album/${user2Albums[0].id}?withoutAssets=false`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(user2Albums[0]);
    });
  });

  describe('PUT /album/:id/assets', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).put(`/album/${user1Albums[0].id}/assets`);
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should be able to add own asset to own album', async () => {
      const asset = await api.assetApi.upload(server, user1.accessToken, 'example1');
      const { status, body } = await request(server)
        .put(`/album/${user1Albums[0].id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ ids: [asset.id] });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: asset.id, success: true })]);
    });

    it('should be able to add own asset to shared album', async () => {
      const asset = await api.assetApi.upload(server, user1.accessToken, 'example1');
      const { status, body } = await request(server)
        .put(`/album/${user2Albums[0].id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ ids: [asset.id] });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: asset.id, success: true })]);
    });
  });

  describe('PATCH /album/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server)
        .patch(`/album/${uuidStub.notFound}`)
        .send({ albumName: 'New album name' });
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should update an album', async () => {
      const album = await api.albumApi.create(server, user1.accessToken, { albumName: 'New album' });
      const { status, body } = await request(server)
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
      const { status, body } = await request(server)
        .delete(`/album/${user1Albums[0].id}/assets`)
        .send({ ids: [user1Asset.id] });

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should be able to remove own asset from own album', async () => {
      const { status, body } = await request(server)
        .delete(`/album/${user1Albums[0].id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ ids: [user1Asset.id] });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: user1Asset.id, success: true })]);
    });

    it('should be able to remove own asset from shared album', async () => {
      const { status, body } = await request(server)
        .delete(`/album/${user2Albums[0].id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ ids: [user1Asset.id] });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: user1Asset.id, success: true })]);
    });

    it('should not be able to remove foreign asset from own album', async () => {
      const { status, body } = await request(server)
        .delete(`/album/${user2Albums[0].id}/assets`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ ids: [user1Asset.id] });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: user1Asset.id, success: false, error: 'no_permission' })]);
    });

    it('should not be able to remove foreign asset from foreign album', async () => {
      const { status, body } = await request(server)
        .delete(`/album/${user1Albums[0].id}/assets`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ ids: [user1Asset.id] });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: user1Asset.id, success: false, error: 'no_permission' })]);
    });
  });

  describe('PUT :id/users', () => {
    let album: AlbumResponseDto;

    beforeEach(async () => {
      album = await api.albumApi.create(server, user1.accessToken, { albumName: 'testAlbum' });
    });

    it('should require authentication', async () => {
      const { status, body } = await request(server)
        .put(`/album/${user1Albums[0].id}/users`)
        .send({ sharedUserIds: [] });

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should be able to add user to own album', async () => {
      const { status, body } = await request(server)
        .put(`/album/${album.id}/users`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ sharedUserIds: [user2.userId] });

      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ sharedUsers: [expect.objectContaining({ id: user2.userId })] }));
    });

    it('should not be able to share album with owner', async () => {
      const { status, body } = await request(server)
        .put(`/album/${album.id}/users`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ sharedUserIds: [user1.userId] });

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest('Cannot be shared with owner'));
    });

    it('should not be able to add existing user to shared album', async () => {
      await request(server)
        .put(`/album/${album.id}/users`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ sharedUserIds: [user2.userId] });

      const { status, body } = await request(server)
        .put(`/album/${album.id}/users`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ sharedUserIds: [user2.userId] });

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest('User already added'));
    });
  });
});
