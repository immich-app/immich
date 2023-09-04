import { LoginResponseDto } from '@app/domain';
import { AlbumController, AppModule } from '@app/immich';
import { SharedLinkType } from '@app/infra/entities';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { errorStub, uuidStub } from '../fixtures';
import { api, db } from '../test-utils';

const user1SharedUser = 'user1SharedUser';
const user1SharedLink = 'user1SharedLink';
const user1NotShared = 'user1NotShared';
const user2SharedUser = 'user2SharedUser';
const user2SharedLink = 'user2SharedLink';
const user2NotShared = 'user2NotShared';

describe(`${AlbumController.name} (e2e)`, () => {
  let app: INestApplication;
  let server: any;
  let user1: LoginResponseDto;
  let user2: LoginResponseDto;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await moduleFixture.createNestApplication().init();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await db.reset();
    await api.adminSignUp(server);
    const admin = await api.adminLogin(server);

    await api.userApi.create(server, admin.accessToken, {
      email: 'user1@immich.app',
      password: 'Password123',
      firstName: 'User 1',
      lastName: 'Test',
    });
    user1 = await api.login(server, { email: 'user1@immich.app', password: 'Password123' });

    await api.userApi.create(server, admin.accessToken, {
      email: 'user2@immich.app',
      password: 'Password123',
      firstName: 'User 2',
      lastName: 'Test',
    });
    user2 = await api.login(server, { email: 'user2@immich.app', password: 'Password123' });

    const user1Albums = await Promise.all([
      api.albumApi.create(server, user1.accessToken, {
        albumName: user1SharedUser,
        sharedWithUserIds: [user2.userId],
      }),
      api.albumApi.create(server, user1.accessToken, { albumName: user1SharedLink }),
      api.albumApi.create(server, user1.accessToken, { albumName: user1NotShared }),
    ]);

    // add shared link to user1SharedLink album
    await api.sharedLinkApi.create(server, user1.accessToken, {
      type: SharedLinkType.ALBUM,
      albumId: user1Albums[1].id,
    });

    const user2Albums = await Promise.all([
      api.albumApi.create(server, user2.accessToken, {
        albumName: user2SharedUser,
        sharedWithUserIds: [user1.userId],
      }),
      api.albumApi.create(server, user2.accessToken, { albumName: user2SharedLink }),
      api.albumApi.create(server, user2.accessToken, { albumName: user2NotShared }),
    ]);

    // add shared link to user2SharedLink album
    await api.sharedLinkApi.create(server, user2.accessToken, {
      type: SharedLinkType.ALBUM,
      albumId: user2Albums[1].id,
    });
  });

  afterAll(async () => {
    await db.disconnect();
    await app.close();
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
      expect(body).toEqual(errorStub.badRequest);
    });

    it('should reject an invalid assetId param', async () => {
      const { status, body } = await request(server)
        .get('/album?assetId=invalid')
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toEqual(400);
      expect(body).toEqual(errorStub.badRequest);
    });

    it('should return the album collection including owned and shared', async () => {
      const { status, body } = await request(server).get('/album').set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toEqual(200);
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
      expect(status).toEqual(200);
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
      expect(status).toEqual(200);
      expect(body).toHaveLength(1);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ ownerId: user1.userId, albumName: user1NotShared, shared: false }),
        ]),
      );
    });

    // TODO: Add asset to album and test if it returns correctly.
    it('should return the album collection filtered by assetId', async () => {
      const { status, body } = await request(server)
        .get('/album?assetId=ecb120db-45a2-4a65-9293-51476f0d8790')
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toEqual(200);
      expect(body).toHaveLength(0);
    });

    // TODO: Add asset to album and test if it returns correctly.
    it('should return the album collection filtered by assetId and ignores shared=true', async () => {
      const { status, body } = await request(server)
        .get('/album?shared=true&assetId=ecb120db-45a2-4a65-9293-51476f0d8790')
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toEqual(200);
      expect(body).toHaveLength(0);
    });

    // TODO: Add asset to album and test if it returns correctly.
    it('should return the album collection filtered by assetId and ignores shared=false', async () => {
      const { status, body } = await request(server)
        .get('/album?shared=false&assetId=ecb120db-45a2-4a65-9293-51476f0d8790')
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toEqual(200);
      expect(body).toHaveLength(0);
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
      });
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
});
