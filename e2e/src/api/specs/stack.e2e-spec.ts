import { AssetMediaResponseDto, LoginResponseDto, searchStacks } from '@immich/sdk';
import { createUserDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/stacks', () => {
  let admin: LoginResponseDto;
  let user1: LoginResponseDto;
  let user2: LoginResponseDto;
  let asset: AssetMediaResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();

    admin = await utils.adminSetup();

    [user1, user2] = await Promise.all([
      utils.userSetup(admin.accessToken, createUserDto.user1),
      utils.userSetup(admin.accessToken, createUserDto.user2),
    ]);

    asset = await utils.createAsset(user1.accessToken);
  });

  describe('POST /stacks', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .post('/stacks')
        .send({ assetIds: [asset.id] });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require at least two assets', async () => {
      const { status, body } = await request(app)
        .post('/stacks')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset.id] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(app)
        .post('/stacks')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [uuidDto.invalid, uuidDto.invalid] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should require access', async () => {
      const user2Asset = await utils.createAsset(user2.accessToken);
      const { status, body } = await request(app)
        .post('/stacks')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset.id, user2Asset.id] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
    });

    it('should create a stack', async () => {
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      const { status, body } = await request(app)
        .post('/stacks')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset1.id, asset2.id] });

      expect(status).toBe(201);
      expect(body).toEqual({
        id: expect.any(String),
        primaryAssetId: asset1.id,
        assets: [expect.objectContaining({ id: asset1.id }), expect.objectContaining({ id: asset2.id })],
      });
    });

    it('should merge an existing stack', async () => {
      const [asset1, asset2, asset3] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      const response1 = await request(app)
        .post('/stacks')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset1.id, asset2.id] });

      expect(response1.status).toBe(201);

      const stacksBefore = await searchStacks({}, { headers: asBearerAuth(user1.accessToken) });

      const { status, body } = await request(app)
        .post('/stacks')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [asset1.id, asset3.id] });

      expect(status).toBe(201);
      expect(body).toEqual({
        id: expect.any(String),
        primaryAssetId: asset1.id,
        assets: expect.arrayContaining([
          expect.objectContaining({ id: asset1.id }),
          expect.objectContaining({ id: asset2.id }),
          expect.objectContaining({ id: asset3.id }),
        ]),
      });

      const stacksAfter = await searchStacks({}, { headers: asBearerAuth(user1.accessToken) });
      expect(stacksAfter.length).toBe(stacksBefore.length);
    });
  });

  describe('GET /assets/:id', () => {
    it('should include stack details for the primary asset', async () => {
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      await utils.createStack(user1.accessToken, [asset1.id, asset2.id]);

      const { status, body } = await request(app)
        .get(`/assets/${asset1.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          id: asset1.id,
          stack: {
            id: expect.any(String),
            assetCount: 2,
            primaryAssetId: asset1.id,
          },
        }),
      );
    });

    it('should include stack details for a non-primary asset', async () => {
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      await utils.createStack(user1.accessToken, [asset1.id, asset2.id]);

      const { status, body } = await request(app)
        .get(`/assets/${asset2.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          id: asset2.id,
          stack: {
            id: expect.any(String),
            assetCount: 2,
            primaryAssetId: asset1.id,
          },
        }),
      );
    });
  });

  describe('GET /stacks/:id', () => {
    it('should include exifInfo in stack assets', async () => {
      const [asset1, asset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      const stack = await utils.createStack(user1.accessToken, [asset1.id, asset2.id]);

      const { status, body } = await request(app)
        .get(`/stacks/${stack.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          id: stack.id,
          primaryAssetId: asset1.id,
          assets: expect.arrayContaining([
            expect.objectContaining({ id: asset1.id, exifInfo: expect.any(Object) }),
            expect.objectContaining({ id: asset2.id, exifInfo: expect.any(Object) }),
          ]),
        }),
      );
    });
  });
});
