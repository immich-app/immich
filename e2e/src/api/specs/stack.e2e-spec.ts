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

    // it('should require a valid parent id', async () => {
    //   const { status, body } = await request(app)
    //     .put('/assets')
    //     .set('Authorization', `Bearer ${user1.accessToken}`)
    //     .send({ stackParentId: uuidDto.invalid, ids: [stackAssets[0].id] });

    //   expect(status).toBe(400);
    //   expect(body).toEqual(errorDto.badRequest(['stackParentId must be a UUID']));
    // });
  });

  // it('should require access to the parent', async () => {
  //   const { status, body } = await request(app)
  //     .put('/assets')
  //     .set('Authorization', `Bearer ${user1.accessToken}`)
  //     .send({ stackParentId: stackAssets[3].id, ids: [user1Assets[0].id] });

  //   expect(status).toBe(400);
  //   expect(body).toEqual(errorDto.noPermission);
  // });

  // it('should add stack children', async () => {
  //   const { status } = await request(app)
  //     .put('/assets')
  //     .set('Authorization', `Bearer ${stackUser.accessToken}`)
  //     .send({ stackParentId: stackAssets[0].id, ids: [stackAssets[3].id] });

  //   expect(status).toBe(204);

  //   const asset = await getAssetInfo({ id: stackAssets[0].id }, { headers: asBearerAuth(stackUser.accessToken) });
  //   expect(asset.stack).not.toBeUndefined();
  //   expect(asset.stack).toEqual(expect.arrayContaining([expect.objectContaining({ id: stackAssets[3].id })]));
  // });

  // it('should remove stack children', async () => {
  //   const { status } = await request(app)
  //     .put('/assets')
  //     .set('Authorization', `Bearer ${stackUser.accessToken}`)
  //     .send({ removeParent: true, ids: [stackAssets[1].id] });

  //   expect(status).toBe(204);

  //   const asset = await getAssetInfo({ id: stackAssets[0].id }, { headers: asBearerAuth(stackUser.accessToken) });
  //   expect(asset.stack).not.toBeUndefined();
  //   expect(asset.stack).toEqual(
  //     expect.arrayContaining([
  //       expect.objectContaining({ id: stackAssets[2].id }),
  //       expect.objectContaining({ id: stackAssets[3].id }),
  //     ]),
  //   );
  // });

  // it('should remove all stack children', async () => {
  //   const { status } = await request(app)
  //     .put('/assets')
  //     .set('Authorization', `Bearer ${stackUser.accessToken}`)
  //     .send({ removeParent: true, ids: [stackAssets[2].id, stackAssets[3].id] });

  //   expect(status).toBe(204);

  //   const asset = await getAssetInfo({ id: stackAssets[0].id }, { headers: asBearerAuth(stackUser.accessToken) });
  //   expect(asset.stack).toBeUndefined();
  // });

  // it('should merge stack children', async () => {
  //   // create stack after previous test removed stack children
  //   await updateAssets(
  //     { assetBulkUpdateDto: { stackParentId: stackAssets[0].id, ids: [stackAssets[1].id, stackAssets[2].id] } },
  //     { headers: asBearerAuth(stackUser.accessToken) },
  //   );

  //   const { status } = await request(app)
  //     .put('/assets')
  //     .set('Authorization', `Bearer ${stackUser.accessToken}`)
  //     .send({ stackParentId: stackAssets[3].id, ids: [stackAssets[0].id] });

  //   expect(status).toBe(204);

  //   const asset = await getAssetInfo({ id: stackAssets[3].id }, { headers: asBearerAuth(stackUser.accessToken) });
  //   expect(asset.stack).not.toBeUndefined();
  //   expect(asset.stack).toEqual(
  //     expect.arrayContaining([
  //       expect.objectContaining({ id: stackAssets[0].id }),
  //       expect.objectContaining({ id: stackAssets[1].id }),
  //       expect.objectContaining({ id: stackAssets[2].id }),
  //     ]),
  //   );
  // });
});
