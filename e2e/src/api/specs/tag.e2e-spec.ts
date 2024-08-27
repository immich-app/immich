import {
  AssetMediaResponseDto,
  LoginResponseDto,
  Permission,
  TagCreateDto,
  createTag,
  getAllTags,
  tagAssets,
  upsertTags,
} from '@immich/sdk';
import { createUserDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const create = (accessToken: string, dto: TagCreateDto) =>
  createTag({ tagCreateDto: dto }, { headers: asBearerAuth(accessToken) });

const upsert = (accessToken: string, tags: string[]) =>
  upsertTags({ tagUpsertDto: { tags } }, { headers: asBearerAuth(accessToken) });

describe('/tags', () => {
  let admin: LoginResponseDto;
  let user: LoginResponseDto;
  let userAsset: AssetMediaResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();

    admin = await utils.adminSetup();
    user = await utils.userSetup(admin.accessToken, createUserDto.user1);
    userAsset = await utils.createAsset(user.accessToken);
  });

  beforeEach(async () => {
    await utils.resetDatabase(['tags']);
  });

  describe('POST /tags', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/tags').send({ name: 'TagA' });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should not work without permission', async () => {
      const { secret } = await utils.createApiKey(user.accessToken, [Permission.AssetRead]);
      const { status, body } = await request(app).post('/tags').set('x-api-key', secret).send({ name: 'TagA' });
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.missingPermission('tag.create'));
    });

    it('should work with tag.create', async () => {
      const { secret } = await utils.createApiKey(user.accessToken, [Permission.TagCreate]);
      const { status, body } = await request(app).post('/tags').set('x-api-key', secret).send({ name: 'TagA' });
      expect(body).toEqual({
        id: expect.any(String),
        name: 'TagA',
        value: 'TagA',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(status).toBe(201);
    });

    it('should create a tag', async () => {
      const { status, body } = await request(app)
        .post('/tags')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'TagA' });
      expect(body).toEqual({
        id: expect.any(String),
        name: 'TagA',
        value: 'TagA',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(status).toBe(201);
    });

    it('should create a nested tag', async () => {
      const parent = await create(admin.accessToken, { name: 'TagA' });

      const { status, body } = await request(app)
        .post('/tags')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'TagB', parentId: parent.id });
      expect(body).toEqual({
        id: expect.any(String),
        name: 'TagB',
        value: 'TagA/TagB',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(status).toBe(201);
    });
  });

  describe('GET /tags', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/tags');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should start off empty', async () => {
      const { status, body } = await request(app).get('/tags').set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toEqual([]);
      expect(status).toEqual(200);
    });

    it('should return a list of tags', async () => {
      const [tagA, tagB, tagC] = await Promise.all([
        create(admin.accessToken, { name: 'TagA' }),
        create(admin.accessToken, { name: 'TagB' }),
        create(admin.accessToken, { name: 'TagC' }),
      ]);
      const { status, body } = await request(app).get('/tags').set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toHaveLength(3);
      expect(body).toEqual([tagA, tagB, tagC]);
      expect(status).toEqual(200);
    });

    it('should return a nested tags', async () => {
      await upsert(admin.accessToken, ['TagA/TagB/TagC', 'TagD']);
      const { status, body } = await request(app).get('/tags').set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toHaveLength(4);
      expect(body).toEqual([
        expect.objectContaining({ name: 'TagA', value: 'TagA' }),
        expect.objectContaining({ name: 'TagB', value: 'TagA/TagB' }),
        expect.objectContaining({ name: 'TagC', value: 'TagA/TagB/TagC' }),
        expect.objectContaining({ name: 'TagD', value: 'TagD' }),
      ]);
      expect(status).toEqual(200);
    });
  });

  describe('PUT /tags', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/tags`).send({ name: 'TagA/TagB' });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should not work without permission', async () => {
      const { secret } = await utils.createApiKey(user.accessToken, [Permission.AssetRead]);
      const { status, body } = await request(app).put('/tags').set('x-api-key', secret).send({ name: 'TagA' });
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.missingPermission('tag.create'));
    });

    it('should upsert tags', async () => {
      const { status, body } = await request(app)
        .put(`/tags`)
        .send({ tags: ['TagA/TagB/TagC/TagD'] })
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ name: 'TagD', value: 'TagA/TagB/TagC/TagD' })]);
    });
  });

  describe('PUT /tags/assets', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/tags/assets`).send({ tagIds: [], assetIds: [] });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should not work without permission', async () => {
      const { secret } = await utils.createApiKey(user.accessToken, [Permission.AssetRead]);
      const { status, body } = await request(app)
        .put('/tags/assets')
        .set('x-api-key', secret)
        .send({ assetIds: [], tagIds: [] });
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.missingPermission('tag.asset'));
    });

    it('should skip assets that are not owned by the user', async () => {
      const [tagA, tagB, tagC, assetA, assetB] = await Promise.all([
        create(user.accessToken, { name: 'TagA' }),
        create(user.accessToken, { name: 'TagB' }),
        create(user.accessToken, { name: 'TagC' }),
        utils.createAsset(user.accessToken),
        utils.createAsset(admin.accessToken),
      ]);
      const { status, body } = await request(app)
        .put(`/tags/assets`)
        .send({ tagIds: [tagA.id, tagB.id, tagC.id], assetIds: [assetA.id, assetB.id] })
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({ count: 3 });
    });

    it('should skip tags that are not owned by the user', async () => {
      const [tagA, tagB, tagC, assetA, assetB] = await Promise.all([
        create(user.accessToken, { name: 'TagA' }),
        create(user.accessToken, { name: 'TagB' }),
        create(admin.accessToken, { name: 'TagC' }),
        utils.createAsset(user.accessToken),
        utils.createAsset(user.accessToken),
      ]);
      const { status, body } = await request(app)
        .put(`/tags/assets`)
        .send({ tagIds: [tagA.id, tagB.id, tagC.id], assetIds: [assetA.id, assetB.id] })
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({ count: 4 });
    });

    it('should bulk tag assets', async () => {
      const [tagA, tagB, tagC, assetA, assetB] = await Promise.all([
        create(user.accessToken, { name: 'TagA' }),
        create(user.accessToken, { name: 'TagB' }),
        create(user.accessToken, { name: 'TagC' }),
        utils.createAsset(user.accessToken),
        utils.createAsset(user.accessToken),
      ]);
      const { status, body } = await request(app)
        .put(`/tags/assets`)
        .send({ tagIds: [tagA.id, tagB.id, tagC.id], assetIds: [assetA.id, assetB.id] })
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({ count: 6 });
    });
  });

  describe('GET /tags/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/tags/${uuidDto.notFound}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require authorization', async () => {
      const tag = await create(user.accessToken, { name: 'TagA' });
      const { status, body } = await request(app)
        .get(`/tags/${tag.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(app)
        .get(`/tags/${uuidDto.invalid}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });

    it('should get tag details', async () => {
      const tag = await create(user.accessToken, { name: 'TagA' });
      const { status, body } = await request(app)
        .get(`/tags/${tag.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({
        id: expect.any(String),
        name: 'TagA',
        value: 'TagA',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should get nested tag details', async () => {
      const tagA = await create(user.accessToken, { name: 'TagA' });
      const tagB = await create(user.accessToken, { name: 'TagB', parentId: tagA.id });
      const tagC = await create(user.accessToken, { name: 'TagC', parentId: tagB.id });
      const tagD = await create(user.accessToken, { name: 'TagD', parentId: tagC.id });

      const { status, body } = await request(app)
        .get(`/tags/${tagD.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({
        id: expect.any(String),
        name: 'TagD',
        value: 'TagA/TagB/TagC/TagD',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('DELETE /tags/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).delete(`/tags/${uuidDto.notFound}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require authorization', async () => {
      const tag = await create(user.accessToken, { name: 'TagA' });
      const { status, body } = await request(app)
        .delete(`/tags/${tag.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
    });

    it('should require a valid uuid', async () => {
      const { status, body } = await request(app)
        .delete(`/tags/${uuidDto.invalid}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['id must be a UUID']));
    });

    it('should delete a tag', async () => {
      const tag = await create(user.accessToken, { name: 'TagA' });
      const { status } = await request(app)
        .delete(`/tags/${tag.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(204);
    });

    it('should delete a nested tag (root)', async () => {
      const tagA = await create(user.accessToken, { name: 'TagA' });
      await create(user.accessToken, { name: 'TagB', parentId: tagA.id });
      const { status } = await request(app)
        .delete(`/tags/${tagA.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(204);
      const tags = await getAllTags({ headers: asBearerAuth(user.accessToken) });
      expect(tags.length).toBe(0);
    });

    it('should delete a nested tag (leaf)', async () => {
      const tagA = await create(user.accessToken, { name: 'TagA' });
      const tagB = await create(user.accessToken, { name: 'TagB', parentId: tagA.id });
      const { status } = await request(app)
        .delete(`/tags/${tagB.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(204);
      const tags = await getAllTags({ headers: asBearerAuth(user.accessToken) });
      expect(tags.length).toBe(1);
      expect(tags[0]).toEqual(tagA);
    });
  });

  describe('PUT /tags/:id/assets', () => {
    it('should require authentication', async () => {
      const tagA = await create(user.accessToken, { name: 'TagA' });
      const { status, body } = await request(app).put(`/tags/${tagA.id}/assets`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should be able to tag own asset', async () => {
      const tagA = await create(user.accessToken, { name: 'TagA' });
      const { status, body } = await request(app)
        .put(`/tags/${tagA.id}/assets`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ ids: [userAsset.id] });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: userAsset.id, success: true })]);
    });

    it("should not be able to add assets to another user's tag", async () => {
      const tagA = await create(admin.accessToken, { name: 'TagA' });
      const { status, body } = await request(app)
        .put(`/tags/${tagA.id}/assets`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ ids: [userAsset.id] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Not found or no tag.asset access'));
    });

    it('should add duplicate assets only once', async () => {
      const tagA = await create(user.accessToken, { name: 'TagA' });
      const { status, body } = await request(app)
        .put(`/tags/${tagA.id}/assets`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ ids: [userAsset.id, userAsset.id] });

      console.log(body);
      expect(status).toBe(200);
      expect(body).toEqual([
        expect.objectContaining({ id: userAsset.id, success: true }),
        expect.objectContaining({ id: userAsset.id, success: false, error: 'duplicate' }),
      ]);
    });
  });

  describe('DELETE /tags/:id/assets', () => {
    it('should require authentication', async () => {
      const tagA = await create(admin.accessToken, { name: 'TagA' });
      const { status, body } = await request(app)
        .delete(`/tags/${tagA}/assets`)
        .send({ ids: [userAsset.id] });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require authorization', async () => {
      const tagA = await create(user.accessToken, { name: 'TagA' });
      await tagAssets(
        { id: tagA.id, bulkIdsDto: { ids: [userAsset.id] } },
        { headers: asBearerAuth(user.accessToken) },
      );
      const { status, body } = await request(app)
        .delete(`/tags/${tagA.id}/assets`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ ids: [userAsset.id] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
    });

    it('should be able to remove own asset from own tag', async () => {
      const tagA = await create(user.accessToken, { name: 'TagA' });
      await tagAssets(
        { id: tagA.id, bulkIdsDto: { ids: [userAsset.id] } },
        { headers: asBearerAuth(user.accessToken) },
      );
      const { status, body } = await request(app)
        .delete(`/tags/${tagA.id}/assets`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ ids: [userAsset.id] });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: userAsset.id, success: true })]);
    });

    it('should remove duplicate assets only once', async () => {
      const tagA = await create(user.accessToken, { name: 'TagA' });
      await tagAssets(
        { id: tagA.id, bulkIdsDto: { ids: [userAsset.id] } },
        { headers: asBearerAuth(user.accessToken) },
      );
      const { status, body } = await request(app)
        .delete(`/tags/${tagA.id}/assets`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ ids: [userAsset.id, userAsset.id] });

      expect(status).toBe(200);
      expect(body).toEqual([
        expect.objectContaining({ id: userAsset.id, success: true }),
        expect.objectContaining({ id: userAsset.id, success: false, error: 'not_found' }),
      ]);
    });
  });
});
