import { AlbumResponseDto, LoginResponseDto, ReactionType } from '@app/domain';
import { ActivityController } from '@app/immich';
import { AssetFileUploadResponseDto } from '@app/immich/api-v1/asset/response-dto/asset-file-upload-response.dto';
import { ActivityEntity } from '@app/infra/entities';
import { api } from '@test/api';
import { errorStub, userDto, uuidStub } from '@test/fixtures';
import { testApp } from '@test/test-utils';
import request from 'supertest';

describe(`${ActivityController.name} (e2e)`, () => {
  let server: any;
  let admin: LoginResponseDto;
  let asset: AssetFileUploadResponseDto;
  let album: AlbumResponseDto;
  let nonOwner: LoginResponseDto;

  beforeAll(async () => {
    [server] = await testApp.create();
    await testApp.reset();
    await api.authApi.adminSignUp(server);
    admin = await api.authApi.adminLogin(server);
    asset = await api.assetApi.upload(server, admin.accessToken, 'example');

    await api.userApi.create(server, admin.accessToken, userDto.user1);
    nonOwner = await api.authApi.login(server, userDto.user1);

    album = await api.albumApi.create(server, admin.accessToken, {
      albumName: 'Album 1',
      assetIds: [asset.id],
      sharedWithUserIds: [nonOwner.userId],
    });
  });

  afterAll(async () => {
    await testApp.teardown();
  });

  beforeEach(async () => {
    await testApp.reset({ entities: [ActivityEntity] });
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
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toEqual(400);
      expect(body).toEqual(errorStub.badRequest(expect.arrayContaining(['albumId must be a UUID'])));
    });

    it('should reject an invalid albumId', async () => {
      const { status, body } = await request(server)
        .get('/activity')
        .query({ albumId: uuidStub.invalid })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toEqual(400);
      expect(body).toEqual(errorStub.badRequest(expect.arrayContaining(['albumId must be a UUID'])));
    });

    it('should reject an invalid assetId', async () => {
      const { status, body } = await request(server)
        .get('/activity')
        .query({ albumId: uuidStub.notFound, assetId: uuidStub.invalid })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toEqual(400);
      expect(body).toEqual(errorStub.badRequest(expect.arrayContaining(['assetId must be a UUID'])));
    });

    it('should start off empty', async () => {
      const { status, body } = await request(server)
        .get('/activity')
        .query({ albumId: album.id })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual([]);
      expect(status).toEqual(200);
    });

    it('should filter by album id', async () => {
      const album2 = await api.albumApi.create(server, admin.accessToken, {
        albumName: 'Album 2',
        assetIds: [asset.id],
      });
      const [reaction] = await Promise.all([
        api.activityApi.create(server, admin.accessToken, {
          albumId: album.id,
          type: ReactionType.LIKE,
        }),
        api.activityApi.create(server, admin.accessToken, {
          albumId: album2.id,
          type: ReactionType.LIKE,
        }),
      ]);

      const { status, body } = await request(server)
        .get('/activity')
        .query({ albumId: album.id })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toEqual(200);
      expect(body.length).toBe(1);
      expect(body[0]).toEqual(reaction);
    });

    it('should filter by type=comment', async () => {
      const [reaction] = await Promise.all([
        api.activityApi.create(server, admin.accessToken, {
          albumId: album.id,
          type: ReactionType.COMMENT,
          comment: 'comment',
        }),
        api.activityApi.create(server, admin.accessToken, { albumId: album.id, type: ReactionType.LIKE }),
      ]);

      const { status, body } = await request(server)
        .get('/activity')
        .query({ albumId: album.id, type: 'comment' })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toEqual(200);
      expect(body.length).toBe(1);
      expect(body[0]).toEqual(reaction);
    });

    it('should filter by type=like', async () => {
      const [reaction] = await Promise.all([
        api.activityApi.create(server, admin.accessToken, { albumId: album.id, type: ReactionType.LIKE }),
        api.activityApi.create(server, admin.accessToken, {
          albumId: album.id,
          type: ReactionType.COMMENT,
          comment: 'comment',
        }),
      ]);

      const { status, body } = await request(server)
        .get('/activity')
        .query({ albumId: album.id, type: 'like' })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toEqual(200);
      expect(body.length).toBe(1);
      expect(body[0]).toEqual(reaction);
    });

    it('should filter by userId', async () => {
      const [reaction] = await Promise.all([
        api.activityApi.create(server, admin.accessToken, { albumId: album.id, type: ReactionType.LIKE }),
      ]);

      const response1 = await request(server)
        .get('/activity')
        .query({ albumId: album.id, userId: uuidStub.notFound })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response1.status).toEqual(200);
      expect(response1.body.length).toBe(0);

      const response2 = await request(server)
        .get('/activity')
        .query({ albumId: album.id, userId: admin.userId })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response2.status).toEqual(200);
      expect(response2.body.length).toBe(1);
      expect(response2.body[0]).toEqual(reaction);
    });

    it('should filter by assetId', async () => {
      const [reaction] = await Promise.all([
        api.activityApi.create(server, admin.accessToken, {
          albumId: album.id,
          assetId: asset.id,
          type: ReactionType.LIKE,
        }),
        api.activityApi.create(server, admin.accessToken, { albumId: album.id, type: ReactionType.LIKE }),
      ]);

      const { status, body } = await request(server)
        .get('/activity')
        .query({ albumId: album.id, assetId: asset.id })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toEqual(200);
      expect(body.length).toBe(1);
      expect(body[0]).toEqual(reaction);
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
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ albumId: uuidStub.invalid });
      expect(status).toEqual(400);
      expect(body).toEqual(errorStub.badRequest(expect.arrayContaining(['albumId must be a UUID'])));
    });

    it('should require a comment when type is comment', async () => {
      const { status, body } = await request(server)
        .post('/activity')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ albumId: uuidStub.notFound, type: 'comment', comment: null });
      expect(status).toEqual(400);
      expect(body).toEqual(errorStub.badRequest(['comment must be a string', 'comment should not be empty']));
    });

    it('should add a comment to an album', async () => {
      const { status, body } = await request(server)
        .post('/activity')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ albumId: album.id, type: 'comment', comment: 'This is my first comment' });
      expect(status).toEqual(201);
      expect(body).toEqual({
        id: expect.any(String),
        assetId: null,
        createdAt: expect.any(String),
        type: 'comment',
        comment: 'This is my first comment',
        user: expect.objectContaining({ email: admin.userEmail }),
      });
    });

    it('should add a like to an album', async () => {
      const { status, body } = await request(server)
        .post('/activity')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ albumId: album.id, type: 'like' });
      expect(status).toEqual(201);
      expect(body).toEqual({
        id: expect.any(String),
        assetId: null,
        createdAt: expect.any(String),
        type: 'like',
        comment: null,
        user: expect.objectContaining({ email: admin.userEmail }),
      });
    });

    it('should return a 200 for a duplicate like on the album', async () => {
      const reaction = await api.activityApi.create(server, admin.accessToken, {
        albumId: album.id,
        type: ReactionType.LIKE,
      });
      const { status, body } = await request(server)
        .post('/activity')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ albumId: album.id, type: 'like' });
      expect(status).toEqual(200);
      expect(body).toEqual(reaction);
    });

    it('should not confuse an album like with an asset like', async () => {
      const reaction = await api.activityApi.create(server, admin.accessToken, {
        albumId: album.id,
        assetId: asset.id,
        type: ReactionType.LIKE,
      });
      const { status, body } = await request(server)
        .post('/activity')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ albumId: album.id, type: 'like' });
      expect(status).toEqual(201);
      expect(body.id).not.toEqual(reaction.id);
    });

    it('should add a comment to an asset', async () => {
      const { status, body } = await request(server)
        .post('/activity')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ albumId: album.id, assetId: asset.id, type: 'comment', comment: 'This is my first comment' });
      expect(status).toEqual(201);
      expect(body).toEqual({
        id: expect.any(String),
        assetId: asset.id,
        createdAt: expect.any(String),
        type: 'comment',
        comment: 'This is my first comment',
        user: expect.objectContaining({ email: admin.userEmail }),
      });
    });

    it('should add a like to an asset', async () => {
      const { status, body } = await request(server)
        .post('/activity')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ albumId: album.id, assetId: asset.id, type: 'like' });
      expect(status).toEqual(201);
      expect(body).toEqual({
        id: expect.any(String),
        assetId: asset.id,
        createdAt: expect.any(String),
        type: 'like',
        comment: null,
        user: expect.objectContaining({ email: admin.userEmail }),
      });
    });

    it('should return a 200 for a duplicate like on an asset', async () => {
      const reaction = await api.activityApi.create(server, admin.accessToken, {
        albumId: album.id,
        assetId: asset.id,
        type: ReactionType.LIKE,
      });
      const { status, body } = await request(server)
        .post('/activity')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ albumId: album.id, assetId: asset.id, type: 'like' });
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
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest(['id must be a UUID']));
    });

    it('should remove a comment from an album', async () => {
      const reaction = await api.activityApi.create(server, admin.accessToken, {
        albumId: album.id,
        type: ReactionType.COMMENT,
        comment: 'This is a test comment',
      });
      const { status } = await request(server)
        .delete(`/activity/${reaction.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toEqual(204);
    });

    it('should remove a like from an album', async () => {
      const reaction = await api.activityApi.create(server, admin.accessToken, {
        albumId: album.id,
        type: ReactionType.LIKE,
      });
      const { status } = await request(server)
        .delete(`/activity/${reaction.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toEqual(204);
    });

    it('should let the owner remove a comment by another user', async () => {
      const reaction = await api.activityApi.create(server, nonOwner.accessToken, {
        albumId: album.id,
        type: ReactionType.COMMENT,
        comment: 'This is a test comment',
      });

      const { status } = await request(server)
        .delete(`/activity/${reaction.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toEqual(204);
    });

    it('should not let a user remove a comment by another user', async () => {
      const reaction = await api.activityApi.create(server, admin.accessToken, {
        albumId: album.id,
        type: ReactionType.COMMENT,
        comment: 'This is a test comment',
      });

      const { status, body } = await request(server)
        .delete(`/activity/${reaction.id}`)
        .set('Authorization', `Bearer ${nonOwner.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest('Not found or no activity.delete access'));
    });

    it('should let a non-owner remove their own comment', async () => {
      const reaction = await api.activityApi.create(server, nonOwner.accessToken, {
        albumId: album.id,
        type: ReactionType.COMMENT,
        comment: 'This is a test comment',
      });

      const { status } = await request(server)
        .delete(`/activity/${reaction.id}`)
        .set('Authorization', `Bearer ${nonOwner.accessToken}`);

      expect(status).toBe(204);
    });
  });
});
