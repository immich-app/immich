import {
  ActivityCreateDto,
  AlbumResponseDto,
  AlbumUserRole,
  AssetMediaResponseDto,
  LoginResponseDto,
  ReactionType,
  createActivity as create,
  createAlbum,
} from '@immich/sdk';
import { createUserDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('/activities', () => {
  let admin: LoginResponseDto;
  let nonOwner: LoginResponseDto;
  let asset: AssetMediaResponseDto;
  let album: AlbumResponseDto;

  const createActivity = (dto: ActivityCreateDto, accessToken?: string) =>
    create({ activityCreateDto: dto }, { headers: asBearerAuth(accessToken || admin.accessToken) });

  beforeAll(async () => {
    await utils.resetDatabase();

    admin = await utils.adminSetup();
    nonOwner = await utils.userSetup(admin.accessToken, createUserDto.user1);
    asset = await utils.createAsset(admin.accessToken);
    album = await createAlbum(
      {
        createAlbumDto: {
          albumName: 'Album 1',
          assetIds: [asset.id],
          albumUsers: [{ userId: nonOwner.userId, role: AlbumUserRole.Editor }],
        },
      },
      { headers: asBearerAuth(admin.accessToken) },
    );
  });

  beforeEach(async () => {
    await utils.resetDatabase(['activity']);
  });

  describe('GET /activities', () => {
    it('should start off empty', async () => {
      const { status, body } = await request(app)
        .get('/activities')
        .query({ albumId: album.id })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual([]);
      expect(status).toEqual(200);
    });

    it('should filter by album id', async () => {
      const album2 = await createAlbum(
        {
          createAlbumDto: {
            albumName: 'Album 2',
            assetIds: [asset.id],
          },
        },
        { headers: asBearerAuth(admin.accessToken) },
      );

      const [reaction] = await Promise.all([
        createActivity({ albumId: album.id, type: ReactionType.Like }),
        createActivity({ albumId: album2.id, type: ReactionType.Like }),
      ]);

      const { status, body } = await request(app)
        .get('/activities')
        .query({ albumId: album.id })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toEqual(200);
      expect(body.length).toBe(1);
      expect(body[0]).toEqual(reaction);
    });

    it('should filter by type=comment', async () => {
      const [reaction] = await Promise.all([
        createActivity({
          albumId: album.id,
          type: ReactionType.Comment,
          comment: 'comment',
        }),
        createActivity({ albumId: album.id, type: ReactionType.Like }),
      ]);

      const { status, body } = await request(app)
        .get('/activities')
        .query({ albumId: album.id, type: 'comment' })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toEqual(200);
      expect(body.length).toBe(1);
      expect(body[0]).toEqual(reaction);
    });

    it('should filter by type=like', async () => {
      const [reaction] = await Promise.all([
        createActivity({ albumId: album.id, type: ReactionType.Like }),
        createActivity({
          albumId: album.id,
          type: ReactionType.Comment,
          comment: 'comment',
        }),
      ]);

      const { status, body } = await request(app)
        .get('/activities')
        .query({ albumId: album.id, type: 'like' })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toEqual(200);
      expect(body.length).toBe(1);
      expect(body[0]).toEqual(reaction);
    });

    it('should filter by userId', async () => {
      const reaction = await createActivity({ albumId: album.id, type: ReactionType.Like });

      const response1 = await request(app)
        .get('/activities')
        .query({ albumId: album.id, userId: uuidDto.notFound })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response1.status).toEqual(200);
      expect(response1.body.length).toBe(0);

      const response2 = await request(app)
        .get('/activities')
        .query({ albumId: album.id, userId: admin.userId })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response2.status).toEqual(200);
      expect(response2.body.length).toBe(1);
      expect(response2.body[0]).toEqual(reaction);
    });

    it('should filter by assetId', async () => {
      const [reaction] = await Promise.all([
        createActivity({
          albumId: album.id,
          assetId: asset.id,
          type: ReactionType.Like,
        }),
        createActivity({ albumId: album.id, type: ReactionType.Like }),
      ]);

      const { status, body } = await request(app)
        .get('/activities')
        .query({ albumId: album.id, assetId: asset.id })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toEqual(200);
      expect(body.length).toBe(1);
      expect(body[0]).toEqual(reaction);
    });
  });

  describe('POST /activities', () => {
    it('should add a comment to an album', async () => {
      const { status, body } = await request(app)
        .post('/activities')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          albumId: album.id,
          type: 'comment',
          comment: 'This is my first comment',
        });
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
      const { status, body } = await request(app)
        .post('/activities')
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
      const reaction = await createActivity({ albumId: album.id, type: ReactionType.Like });
      const { status, body } = await request(app)
        .post('/activities')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ albumId: album.id, type: 'like' });
      expect(status).toEqual(200);
      expect(body).toEqual(reaction);
    });

    it('should not confuse an album like with an asset like', async () => {
      const reaction = await createActivity({
        albumId: album.id,
        assetId: asset.id,
        type: ReactionType.Like,
      });
      const { status, body } = await request(app)
        .post('/activities')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ albumId: album.id, type: 'like' });
      expect(status).toEqual(201);
      expect(body.id).not.toEqual(reaction.id);
    });

    it('should add a comment to an asset', async () => {
      const { status, body } = await request(app)
        .post('/activities')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          albumId: album.id,
          assetId: asset.id,
          type: 'comment',
          comment: 'This is my first comment',
        });
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
      const { status, body } = await request(app)
        .post('/activities')
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
      const reaction = await createActivity({
        albumId: album.id,
        assetId: asset.id,
        type: ReactionType.Like,
      });

      const { status, body } = await request(app)
        .post('/activities')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ albumId: album.id, assetId: asset.id, type: 'like' });
      expect(status).toEqual(200);
      expect(body).toEqual(reaction);
    });
  });

  describe('DELETE /activities/:id', () => {
    it('should remove a comment from an album', async () => {
      const reaction = await createActivity({
        albumId: album.id,
        type: ReactionType.Comment,
        comment: 'This is a test comment',
      });
      const { status } = await request(app)
        .delete(`/activities/${reaction.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toEqual(204);
    });

    it('should remove a like from an album', async () => {
      const reaction = await createActivity({
        albumId: album.id,
        type: ReactionType.Like,
      });
      const { status } = await request(app)
        .delete(`/activities/${reaction.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toEqual(204);
    });

    it('should let the owner remove a comment by another user', async () => {
      const reaction = await createActivity({
        albumId: album.id,
        type: ReactionType.Comment,
        comment: 'This is a test comment',
      });

      const { status } = await request(app)
        .delete(`/activities/${reaction.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toEqual(204);
    });

    it('should not let a user remove a comment by another user', async () => {
      const reaction = await createActivity({
        albumId: album.id,
        type: ReactionType.Comment,
        comment: 'This is a test comment',
      });

      const { status, body } = await request(app)
        .delete(`/activities/${reaction.id}`)
        .set('Authorization', `Bearer ${nonOwner.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Not found or no activity.delete access'));
    });

    it('should let a non-owner remove their own comment', async () => {
      const reaction = await createActivity(
        {
          albumId: album.id,
          type: ReactionType.Comment,
          comment: 'This is a test comment',
        },
        nonOwner.accessToken,
      );

      const { status } = await request(app)
        .delete(`/activities/${reaction.id}`)
        .set('Authorization', `Bearer ${nonOwner.accessToken}`);

      expect(status).toBe(204);
    });
  });
});
