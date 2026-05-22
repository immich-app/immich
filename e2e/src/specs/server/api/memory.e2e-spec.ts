import {
  AssetMediaResponseDto,
  LoginResponseDto,
  MemoryResponseDto,
  MemoryType,
  createMemory,
  getMemory,
} from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/memories', () => {
  let admin: LoginResponseDto;
  let user: LoginResponseDto;
  let adminAsset: AssetMediaResponseDto;
  let userAsset1: AssetMediaResponseDto;
  let userMemory: MemoryResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();

    admin = await utils.adminSetup();
    user = await utils.userSetup(admin.accessToken, createUserDto.user1);
    [adminAsset, userAsset1] = await Promise.all([
      utils.createAsset(admin.accessToken),
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

  describe('GET /memories/:id', () => {
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
    it('should require access', async () => {
      const { status, body } = await request(app)
        .put(`/memories/${userMemory.id}/assets`)
        .send({ ids: [userAsset1.id] })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
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
    it('should require access', async () => {
      const { status, body } = await request(app)
        .delete(`/memories/${userMemory.id}/assets`)
        .send({ ids: [userAsset1.id] })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
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
