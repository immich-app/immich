import { AlbumResponseDto, LoginResponseDto, ReactionType } from '@app/domain';
import { ActivityController } from '@app/immich';
import { AssetFileUploadResponseDto } from '@app/immich/api-v1/asset/response-dto/asset-file-upload-response.dto';
import { api } from '@test/api';
import { db } from '@test/db';
import { errorStub, uuidStub } from '@test/fixtures';
import { testApp } from '@test/test-utils';
import request from 'supertest';

const users = [
  {
    email: 'user1@immich.app',
    password: 'Password123',
    firstName: 'User 1',
    lastName: 'Test',
  },
  {
    email: 'user2@immich.app',
    password: 'Password123',
    firstName: 'User 2',
    lastName: 'Test',
  },
];

describe(`${ActivityController.name} (e2e)`, () => {
  let server: any;
  let admin: LoginResponseDto;
  let user1: LoginResponseDto;
  let user1Asset: AssetFileUploadResponseDto;
  let user2: LoginResponseDto;
  let album: AlbumResponseDto;

  beforeAll(async () => {
    [server] = await testApp.create();
  });

  afterAll(async () => {
    await testApp.teardown();
  });

  beforeEach(async () => {
    await db.reset();
    await api.authApi.adminSignUp(server);
    admin = await api.authApi.adminLogin(server);

    await Promise.all(users.map((user) => api.userApi.create(server, admin.accessToken, user)));
    [user1, user2] = await Promise.all(
      users.map((user) => api.authApi.login(server, { email: user.email, password: user.password })),
    );

    user1Asset = await api.assetApi.upload(server, user1.accessToken, 'example');
    album = await api.albumApi.create(server, user1.accessToken, {
      albumName: 'Activity Album',
      sharedWithUserIds: [user2.userId],
      assetIds: [user1Asset.id],
    });
  });

  describe('GET /activity', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/activity');
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should require an albumId', async () => {
      const { status, body } = await request(server)
        .get('/activity')
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toEqual(400);
      expect(body).toEqual(errorStub.badRequest(expect.arrayContaining(['albumId must be a UUID'])));
    });

    it('should reject an invalid albumId', async () => {
      const { status, body } = await request(server)
        .get('/activity')
        .query({ albumId: uuidStub.invalid })
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toEqual(400);
      expect(body).toEqual(errorStub.badRequest(expect.arrayContaining(['albumId must be a UUID'])));
    });

    it('should reject an invalid assetId', async () => {
      const { status, body } = await request(server)
        .get('/activity')
        .query({ albumId: uuidStub.notFound, assetId: uuidStub.invalid })
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toEqual(400);
      expect(body).toEqual(errorStub.badRequest(expect.arrayContaining(['assetId must be a UUID'])));
    });

    it('should start off empty', async () => {
      const { status, body } = await request(server)
        .get('/activity')
        .query({ albumId: album.id })
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(body).toEqual([]);
      expect(status).toEqual(200);
    });
  });

  describe('POST /activity', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).post('/activity');
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should require an albumId', async () => {
      const { status, body } = await request(server)
        .post('/activity')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ albumId: uuidStub.invalid });
      expect(status).toEqual(400);
      expect(body).toEqual(errorStub.badRequest(expect.arrayContaining(['albumId must be a UUID'])));
    });

    it('should require a comment when type is comment', async () => {
      const { status, body } = await request(server)
        .post('/activity')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ albumId: uuidStub.notFound, type: 'comment', comment: null });
      expect(status).toEqual(400);
      expect(body).toEqual(errorStub.badRequest(['comment must be a string', 'comment should not be empty']));
    });

    it('should add a comment to an album', async () => {
      const { status, body } = await request(server)
        .post('/activity')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ albumId: album.id, type: 'comment', comment: 'This is my first comment' });
      expect(status).toEqual(201);
      expect(body).toEqual({
        id: expect.any(String),
        assetId: null,
        createdAt: expect.any(String),
        type: 'comment',
        comment: 'This is my first comment',
        user: expect.objectContaining({ email: user1.userEmail }),
      });
    });

    it('should add a like to an album', async () => {
      const { status, body } = await request(server)
        .post('/activity')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ albumId: album.id, type: 'like' });
      expect(status).toEqual(201);
      expect(body).toEqual({
        id: expect.any(String),
        assetId: null,
        createdAt: expect.any(String),
        type: 'like',
        comment: null,
        user: expect.objectContaining({ email: user1.userEmail }),
      });
    });

    it('should return a 200 for a duplicate like', async () => {
      const reaction = await api.activityApi.create(server, user1.accessToken, {
        albumId: album.id,
        type: ReactionType.LIKE,
      });
      const { status, body } = await request(server)
        .post('/activity')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ albumId: album.id, type: 'like' });
      expect(status).toEqual(200);
      expect(body).toEqual(reaction);
    });
  });

  describe('DELETE /activity/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).delete(`/activity/${uuidStub.notFound}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(server)
        .delete(`/activity/${uuidStub.invalid}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest('invalid uuid'));
    });

    it('should remove a comment from an album', async () => {
      const reaction = await api.activityApi.create(server, user1.accessToken, {
        albumId: album.id,
        type: ReactionType.COMMENT,
        comment: 'This is a test comment',
      });
      const { status } = await request(server)
        .delete(`/activity/${reaction.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toEqual(204);
    });

    it('should remove a like from an album', async () => {
      const reaction = await api.activityApi.create(server, user1.accessToken, {
        albumId: album.id,
        type: ReactionType.LIKE,
      });
      const { status } = await request(server)
        .delete(`/activity/${reaction.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);
      expect(status).toEqual(204);
    });
  });
});
