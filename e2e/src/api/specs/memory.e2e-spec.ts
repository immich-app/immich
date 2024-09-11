import {
  AssetMediaResponseDto,
  LoginResponseDto,
  MemoryResponseDto,
  MemoryType,
  createMemory,
  getMemory,
} from '@immich/sdk';
import { createUserDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/memories', () => {
  let admin: LoginResponseDto;
  let user: LoginResponseDto;
  let adminAsset: AssetMediaResponseDto;
  let userAsset1: AssetMediaResponseDto;
  let userAsset2: AssetMediaResponseDto;
  let userMemory: MemoryResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();

    admin = await utils.adminSetup();
    user = await utils.userSetup(admin.accessToken, createUserDto.user1);
    [adminAsset, userAsset1, userAsset2] = await Promise.all([
      utils.createAsset(admin.accessToken),
      utils.createAsset(user.accessToken),
      utils.createAsset(user.accessToken),
    ]);
    userMemory = await createMemory(
      {
        memoryCreateDto: {
          type: MemoryType.OnThisDay,
          memoryAt: new Date(2021).toISOString(),
          data: { year: 2021 },
          assetIds: [],
        },
      },
      { headers: asBearerAuth(user.accessToken) },
    );
  });

  describe('GET /memories', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/memories');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });
  });

  describe('POST /memories', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/memories');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should validate data when type is on this day', async () => {
      const { status, body } = await request(app)
        .post('/memories')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          type: 'on_this_day',
          data: {},
          memoryAt: new Date(2021).toISOString(),
        });

      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.badRequest(['data.year must be a positive number', 'data.year must be an integer number']),
      );
    });

    it('should create a new memory', async () => {
      const { status, body } = await request(app)
        .post('/memories')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          type: 'on_this_day',
          data: { year: 2021 },
          memoryAt: new Date(2021).toISOString(),
        });

      expect(status).toBe(201);
      expect(body).toEqual({
        id: expect.any(String),
        type: 'on_this_day',
        data: { year: 2021 },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
        seenAt: null,
        isSaved: false,
        memoryAt: expect.any(String),
        ownerId: user.userId,
        assets: [],
      });
    });

    it('should create a new memory (with assets)', async () => {
      const { status, body } = await request(app)
        .post('/memories')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          type: 'on_this_day',
          data: { year: 2021 },
          memoryAt: new Date(2021).toISOString(),
          assetIds: [userAsset1.id, userAsset2.id],
        });

      expect(status).toBe(201);
      expect(body).toMatchObject({
        id: expect.any(String),
        assets: expect.arrayContaining([
          expect.objectContaining({ id: userAsset1.id }),
          expect.objectContaining({ id: userAsset2.id }),
        ]),
      });
      expect(body.assets).toHaveLength(2);
    });

    it('should create a new memory and ignore assets the user does not have access to', async () => {
      const { status, body } = await request(app)
        .post('/memories')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          type: 'on_this_day',
          data: { year: 2021 },
          memoryAt: new Date(2021).toISOString(),
          assetIds: [userAsset1.id, adminAsset.id],
        });

      expect(status).toBe(201);
      expect(body).toMatchObject({
        id: expect.any(String),
        assets: [expect.objectContaining({ id: userAsset1.id })],
      });
      expect(body.assets).toHaveLength(1);
    });
  });

  describe('GET /memories/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/memories/${uuidDto.invalid}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(app)
        .get(`/memories/${uuidDto.invalid}`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });

    it('should require access', async () => {
      const { status, body } = await request(app)
        .get(`/memories/${userMemory.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
    });

    it('should get the memory', async () => {
      const { status, body } = await request(app)
        .get(`/memories/${userMemory.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({ id: userMemory.id });
    });
  });

  describe('PUT /memories/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/memories/${uuidDto.invalid}`).send({ isSaved: true });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(app)
        .put(`/memories/${uuidDto.invalid}`)
        .send({ isSaved: true })
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });

    it('should require access', async () => {
      const { status, body } = await request(app)
        .put(`/memories/${userMemory.id}`)
        .send({ isSaved: true })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
    });

    it('should update the memory', async () => {
      const before = await getMemory({ id: userMemory.id }, { headers: asBearerAuth(user.accessToken) });
      expect(before.isSaved).toBe(false);

      const { status, body } = await request(app)
        .put(`/memories/${userMemory.id}`)
        .send({ isSaved: true })
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({
        id: userMemory.id,
        isSaved: true,
      });
    });
  });

  describe('PUT /memories/:id/assets', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .put(`/memories/${userMemory.id}/assets`)
        .send({ ids: [userAsset1.id] });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(app)
        .put(`/memories/${uuidDto.invalid}/assets`)
        .send({ ids: [userAsset1.id] })
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });

    it('should require access', async () => {
      const { status, body } = await request(app)
        .put(`/memories/${userMemory.id}/assets`)
        .send({ ids: [userAsset1.id] })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
    });

    it('should require a valid asset id', async () => {
      const { status, body } = await request(app)
        .put(`/memories/${userMemory.id}/assets`)
        .send({ ids: [uuidDto.invalid] })
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['each value in ids must be a UUID']));
    });

    it('should require asset access', async () => {
      const { status, body } = await request(app)
        .put(`/memories/${userMemory.id}/assets`)
        .send({ ids: [adminAsset.id] })
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toEqual({
        id: adminAsset.id,
        success: false,
        error: 'no_permission',
      });
    });

    it('should add assets to the memory', async () => {
      const { status, body } = await request(app)
        .put(`/memories/${userMemory.id}/assets`)
        .send({ ids: [userAsset1.id] })
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toEqual({ id: userAsset1.id, success: true });
    });
  });

  describe('DELETE /memories/:id/assets', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .delete(`/memories/${userMemory.id}/assets`)
        .send({ ids: [userAsset1.id] });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(app)
        .delete(`/memories/${uuidDto.invalid}/assets`)
        .send({ ids: [userAsset1.id] })
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });

    it('should require access', async () => {
      const { status, body } = await request(app)
        .delete(`/memories/${userMemory.id}/assets`)
        .send({ ids: [userAsset1.id] })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
    });

    it('should require a valid asset id', async () => {
      const { status, body } = await request(app)
        .delete(`/memories/${userMemory.id}/assets`)
        .send({ ids: [uuidDto.invalid] })
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['each value in ids must be a UUID']));
    });

    it('should only remove assets in the memory', async () => {
      const { status, body } = await request(app)
        .delete(`/memories/${userMemory.id}/assets`)
        .send({ ids: [adminAsset.id] })
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toEqual({
        id: adminAsset.id,
        success: false,
        error: 'not_found',
      });
    });

    it('should remove assets from the memory', async () => {
      const { status, body } = await request(app)
        .delete(`/memories/${userMemory.id}/assets`)
        .send({ ids: [userAsset1.id] })
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toEqual({ id: userAsset1.id, success: true });
    });
  });

  describe('DELETE /memories/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).delete(`/memories/${uuidDto.invalid}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(app)
        .delete(`/memories/${uuidDto.invalid}`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });

    it('should require access', async () => {
      const { status, body } = await request(app)
        .delete(`/memories/${userMemory.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
    });

    it('should delete the memory', async () => {
      const { status } = await request(app)
        .delete(`/memories/${userMemory.id}`)
        .send({ isSaved: true })
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(204);
    });
  });
});
