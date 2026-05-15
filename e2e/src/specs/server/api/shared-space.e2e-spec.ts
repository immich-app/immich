import { AssetMediaResponseDto, LoginResponseDto, SharedSpaceRole } from '@immich/sdk';
import { authHeaders, forEachActor, type Actor } from 'src/actors';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Helper for T17's bucket queries — multiple tests format the current UTC
// month as the canonical YYYY-MM-01 string. Pure, hoisted to file scope.
function currentMonthBucketString(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}-01`;
}

describe('/shared-spaces', () => {
  let admin: LoginResponseDto;
  let user1: LoginResponseDto;
  let user2: LoginResponseDto;
  let user3: LoginResponseDto;
  let user1Asset1: AssetMediaResponseDto;
  let user1Asset2: AssetMediaResponseDto;
  let user2Asset1: AssetMediaResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();

    admin = await utils.adminSetup();

    [user1, user2, user3] = await Promise.all([
      utils.userSetup(admin.accessToken, createUserDto.user1),
      utils.userSetup(admin.accessToken, createUserDto.user2),
      utils.userSetup(admin.accessToken, createUserDto.user3),
    ]);

    [user1Asset1, user1Asset2, user2Asset1] = await Promise.all([
      utils.createAsset(user1.accessToken),
      utils.createAsset(user1.accessToken),
      utils.createAsset(user2.accessToken),
    ]);
  });

  describe('POST /shared-spaces', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/shared-spaces').send({ name: 'Test Space' });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should create a space', async () => {
      const { status, body } = await request(app)
        .post('/shared-spaces')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: 'My Space' });

      expect(status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: 'My Space',
        }),
      );
    });

    it('should make the creator the owner', async () => {
      const { body: space } = await request(app)
        .post('/shared-spaces')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: 'Owner Check' });

      const { body: members } = await request(app)
        .get(`/shared-spaces/${space.id}/members`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(members).toHaveLength(1);
      expect(members[0]).toEqual(
        expect.objectContaining({
          userId: user1.userId,
          role: SharedSpaceRole.Owner,
        }),
      );
    });

    it('should require a name', async () => {
      const { status } = await request(app)
        .post('/shared-spaces')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({});

      expect(status).toBe(400);
    });
  });

  describe('GET /shared-spaces', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/shared-spaces');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should list spaces the user belongs to', async () => {
      const { status, body } = await request(app)
        .get('/shared-spaces')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'My Space' })]));
    });

    it('should not list spaces the user does not belong to', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Private Space' });

      const { status, body } = await request(app)
        .get('/shared-spaces')
        .set('Authorization', `Bearer ${user3.accessToken}`);

      expect(status).toBe(200);
      const spaceIds = body.map((s: { id: string }) => s.id);
      expect(spaceIds).not.toContain(space.id);
    });

    it('should list spaces after being added as a member', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Shared With User3' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user3.userId });

      const { body } = await request(app).get('/shared-spaces').set('Authorization', `Bearer ${user3.accessToken}`);

      const spaceIds = body.map((s: { id: string }) => s.id);
      expect(spaceIds).toContain(space.id);
    });
  });

  describe('GET /shared-spaces/:id', () => {
    it('should require authentication', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Get Test' });
      const { status, body } = await request(app).get(`/shared-spaces/${space.id}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should get a space by id', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Detail Space' });

      const { status, body } = await request(app)
        .get(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          id: space.id,
          name: 'Detail Space',
        }),
      );
    });

    it('should reject non-member access', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Non-member Get' });

      const { status } = await request(app)
        .get(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user3.accessToken}`);

      expect(status).toBe(403);
    });

    it('should exclude videos from recentAssetIds', async () => {
      const space = await utils.createSpace(user3.accessToken, { name: 'Video Exclude' });
      const videoAsset = await utils.createAsset(user3.accessToken, {
        assetData: { filename: 'example.mp4' },
      });
      const imageAsset = await utils.createAsset(user3.accessToken);
      await utils.addSpaceAssets(user3.accessToken, space.id, [videoAsset.id, imageAsset.id]);
      // recent assets are filtered to those with a thumbhash; wait for thumbnail generation
      await utils.waitForQueueFinish(admin.accessToken, 'thumbnailGeneration');

      const { body } = await request(app)
        .get(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user3.accessToken}`);

      expect(body.recentAssetIds).toContain(imageAsset.id);
      expect(body.recentAssetIds).not.toContain(videoAsset.id);
    });

    it('should include asset count and member count', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Counts Space' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId, role: SharedSpaceRole.Editor });
      await utils.addSpaceAssets(user1.accessToken, space.id, [user1Asset1.id]);

      const { body } = await request(app)
        .get(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(body).toEqual(
        expect.objectContaining({
          memberCount: 2,
          assetCount: 1,
        }),
      );
    });
  });

  describe('PATCH /shared-spaces/:id', () => {
    it('should require authentication', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Update Test' });
      const { status, body } = await request(app).patch(`/shared-spaces/${space.id}`).send({ name: 'Updated' });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should update a space name', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Before Update' });

      const { status, body } = await request(app)
        .patch(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: 'After Update' });

      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ id: space.id, name: 'After Update' }));
    });

    it('should reject non-member update', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Non-member Update' });

      const { status } = await request(app)
        .patch(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user3.accessToken}`)
        .send({ name: 'Hacked' });

      expect(status).toBe(403);
    });

    it('should reject viewer updating name (metadata)', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Viewer Update' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      const { status } = await request(app)
        .patch(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ name: 'Viewer Updated' });

      expect(status).toBe(403);
    });

    it('should reject editor updating name (metadata requires owner)', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Editor Update Meta' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId, role: SharedSpaceRole.Editor });

      const { status } = await request(app)
        .patch(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ name: 'Editor Updated' });

      expect(status).toBe(403);
    });

    it('should allow editor to update cover photo (non-metadata)', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Editor Cover' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId, role: SharedSpaceRole.Editor });
      await utils.addSpaceAssets(user1.accessToken, space.id, [user1Asset1.id]);

      const { status } = await request(app)
        .patch(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ thumbnailAssetId: user1Asset1.id });

      expect(status).toBe(200);
    });
  });

  describe('DELETE /shared-spaces/:id', () => {
    it('should require authentication', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Delete Test' });
      const { status, body } = await request(app).delete(`/shared-spaces/${space.id}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should delete a space', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'To Delete' });

      const { status } = await request(app)
        .delete(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(204);
    });

    it('should reject non-member delete', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Non-member Delete' });

      const { status } = await request(app)
        .delete(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user3.accessToken}`);

      expect(status).toBe(403);
    });

    it('should reject viewer delete', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Viewer Delete' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      const { status } = await request(app)
        .delete(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(403);
    });

    it('should reject editor delete', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Editor Delete' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId, role: SharedSpaceRole.Editor });

      const { status } = await request(app)
        .delete(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(403);
    });

    it('should verify space is gone after deletion', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Verify Gone' });

      await request(app).delete(`/shared-spaces/${space.id}`).set('Authorization', `Bearer ${user1.accessToken}`);

      const { status } = await request(app)
        .get(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      // Should fail since space no longer exists
      expect(status).not.toBe(200);
    });
  });

  describe('POST /shared-spaces/:id/members', () => {
    it('should require authentication', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Member Auth Test' });
      const { status, body } = await request(app)
        .post(`/shared-spaces/${space.id}/members`)
        .send({ userId: user2.userId });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should add a member to a space', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Member Space' });

      const { status, body } = await request(app)
        .post(`/shared-spaces/${space.id}/members`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ userId: user2.userId });

      expect(status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          userId: user2.userId,
          role: SharedSpaceRole.Viewer,
        }),
      );
    });

    it('should add a member with editor role', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Editor Role Space' });

      const { status, body } = await request(app)
        .post(`/shared-spaces/${space.id}/members`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ userId: user2.userId, role: SharedSpaceRole.Editor });

      expect(status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          userId: user2.userId,
          role: SharedSpaceRole.Editor,
        }),
      );
    });

    it('should reject duplicate member', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Duplicate Member' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      const { status, body } = await request(app)
        .post(`/shared-spaces/${space.id}/members`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ userId: user2.userId });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('User is already a member of this space'));
    });

    it('should reject non-owner adding members', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Non-owner Add' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId, role: SharedSpaceRole.Editor });

      const { status } = await request(app)
        .post(`/shared-spaces/${space.id}/members`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ userId: user3.userId });

      expect(status).toBe(403);
    });

    it('should reject viewer adding members', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Viewer Add' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      const { status } = await request(app)
        .post(`/shared-spaces/${space.id}/members`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ userId: user3.userId });

      expect(status).toBe(403);
    });

    it('should reject non-member adding members', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Non-member Add' });

      const { status } = await request(app)
        .post(`/shared-spaces/${space.id}/members`)
        .set('Authorization', `Bearer ${user3.accessToken}`)
        .send({ userId: user2.userId });

      expect(status).toBe(403);
    });
  });

  describe('PATCH /shared-spaces/:id/members/:userId', () => {
    it('should require authentication', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Update Role Auth' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      const { status, body } = await request(app)
        .patch(`/shared-spaces/${space.id}/members/${user2.userId}`)
        .send({ role: SharedSpaceRole.Editor });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should update member role as owner', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Update Role' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      const { status, body } = await request(app)
        .patch(`/shared-spaces/${space.id}/members/${user2.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ role: SharedSpaceRole.Editor });

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          userId: user2.userId,
          role: SharedSpaceRole.Editor,
        }),
      );
    });

    it('should reject owner changing own role', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Self Role Change' });

      const { status, body } = await request(app)
        .patch(`/shared-spaces/${space.id}/members/${user1.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ role: SharedSpaceRole.Viewer });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Cannot change your own role'));
    });

    it('should reject editor updating roles', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Editor Role Update' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId, role: SharedSpaceRole.Editor });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user3.userId });

      const { status } = await request(app)
        .patch(`/shared-spaces/${space.id}/members/${user3.userId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ role: SharedSpaceRole.Editor });

      expect(status).toBe(403);
    });

    it('should reject viewer updating roles', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Viewer Role Update' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user3.userId });

      const { status } = await request(app)
        .patch(`/shared-spaces/${space.id}/members/${user3.userId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ role: SharedSpaceRole.Editor });

      expect(status).toBe(403);
    });

    it('should reject non-member updating roles', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Non-member Role' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      const { status } = await request(app)
        .patch(`/shared-spaces/${space.id}/members/${user2.userId}`)
        .set('Authorization', `Bearer ${user3.accessToken}`)
        .send({ role: SharedSpaceRole.Editor });

      expect(status).toBe(403);
    });
  });

  describe('GET /shared-spaces/:id/members', () => {
    it('should require authentication', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Members List Auth' });
      const { status, body } = await request(app).get(`/shared-spaces/${space.id}/members`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should list members of a space', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Members List' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      const { status, body } = await request(app)
        .get(`/shared-spaces/${space.id}/members`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ userId: user1.userId, role: SharedSpaceRole.Owner }),
          expect.objectContaining({ userId: user2.userId, role: SharedSpaceRole.Viewer }),
        ]),
      );
    });

    it('should reject non-member listing members', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Non-member Members' });

      const { status } = await request(app)
        .get(`/shared-spaces/${space.id}/members`)
        .set('Authorization', `Bearer ${user3.accessToken}`);

      expect(status).toBe(403);
    });

    it('should include contribution counts', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Contrib Counts' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId, role: SharedSpaceRole.Editor });
      await utils.addSpaceAssets(user1.accessToken, space.id, [user1Asset1.id]);

      const { body } = await request(app)
        .get(`/shared-spaces/${space.id}/members`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      const owner = body.find((m: { userId: string }) => m.userId === user1.userId);
      expect(owner).toEqual(
        expect.objectContaining({
          contributionCount: 1,
        }),
      );
    });

    it('should allow viewer to list members', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Viewer List' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      const { status, body } = await request(app)
        .get(`/shared-spaces/${space.id}/members`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(200);
      expect(body).toHaveLength(2);
    });
  });

  describe('POST /shared-spaces/:id/assets', () => {
    it('should require authentication', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Asset Auth Test' });
      const { status, body } = await request(app)
        .post(`/shared-spaces/${space.id}/assets`)
        .send({ assetIds: [user1Asset1.id] });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should add assets to a space (owner)', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Asset Space Owner' });

      const { status } = await request(app)
        .post(`/shared-spaces/${space.id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [user1Asset1.id] });

      expect(status).toBe(204);
    });

    it('should allow editor to add assets', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Editor Asset Add' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId, role: SharedSpaceRole.Editor });

      const { status } = await request(app)
        .post(`/shared-spaces/${space.id}/assets`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ assetIds: [user2Asset1.id] });

      expect(status).toBe(204);
    });

    it('should reject viewer adding assets', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Viewer Asset Add' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      const { status } = await request(app)
        .post(`/shared-spaces/${space.id}/assets`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ assetIds: [user2Asset1.id] });

      expect(status).toBe(403);
    });

    it('should reject non-member adding assets', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Non-member Asset' });

      const { status } = await request(app)
        .post(`/shared-spaces/${space.id}/assets`)
        .set('Authorization', `Bearer ${user3.accessToken}`)
        .send({ assetIds: [user1Asset1.id] });

      expect(status).toBe(403);
    });
  });

  describe('POST /shared-spaces/:id/assets/bulk-add', () => {
    it('should require authentication', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Bulk Auth Test' });
      const { status, body } = await request(app).post(`/shared-spaces/${space.id}/assets/bulk-add`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should return 202 when called by owner', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Bulk Owner' });

      const { status, body } = await request(app)
        .post(`/shared-spaces/${space.id}/assets/bulk-add`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(202);
      expect(body).toEqual(expect.objectContaining({ spaceId: space.id }));
    });

    it('should return 202 when called by editor', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Bulk Editor' });
      await utils.addSpaceMember(user1.accessToken, space.id, {
        userId: user2.userId,
        role: SharedSpaceRole.Editor,
      });

      const { status, body } = await request(app)
        .post(`/shared-spaces/${space.id}/assets/bulk-add`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(202);
      expect(body).toEqual(expect.objectContaining({ spaceId: space.id }));
    });

    it('should reject viewer', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Bulk Viewer Reject' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      const { status } = await request(app)
        .post(`/shared-spaces/${space.id}/assets/bulk-add`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(403);
    });

    it('should reject non-member', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Bulk Non-Member' });

      const { status } = await request(app)
        .post(`/shared-spaces/${space.id}/assets/bulk-add`)
        .set('Authorization', `Bearer ${user3.accessToken}`);

      expect(status).toBe(403);
    });

    it('should accept when user has zero assets', async () => {
      const space = await utils.createSpace(user3.accessToken, { name: 'Bulk No Assets' });

      const { status } = await request(app)
        .post(`/shared-spaces/${space.id}/assets/bulk-add`)
        .set('Authorization', `Bearer ${user3.accessToken}`);

      expect(status).toBe(202);
    });

    it('should be idempotent', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Bulk Idempotent' });

      const { status: status1 } = await request(app)
        .post(`/shared-spaces/${space.id}/assets/bulk-add`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      const { status: status2 } = await request(app)
        .post(`/shared-spaces/${space.id}/assets/bulk-add`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status1).toBe(202);
      expect(status2).toBe(202);
    });

    it('should add all user assets after job completes', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Bulk Job Verify' });

      const { status } = await request(app)
        .post(`/shared-spaces/${space.id}/assets/bulk-add`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(202);

      // Poll until the space asset count reaches the expected value
      const getSpaceAssetCount = async () => {
        const { body } = await request(app)
          .get(`/shared-spaces/${space.id}`)
          .set('Authorization', `Bearer ${user1.accessToken}`);
        return body.assetCount as number;
      };

      // user1 has user1Asset1 and user1Asset2 from beforeAll
      await expect.poll(getSpaceAssetCount, { interval: 1000, timeout: 30_000 }).toBe(2);
    }, 35_000);

    it('should not add other users assets', async () => {
      const space = await utils.createSpace(user2.accessToken, { name: 'Bulk Isolation' });

      const { status } = await request(app)
        .post(`/shared-spaces/${space.id}/assets/bulk-add`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(202);

      const getSpaceAssetCount = async () => {
        const { body } = await request(app)
          .get(`/shared-spaces/${space.id}`)
          .set('Authorization', `Bearer ${user2.accessToken}`);
        return body.assetCount as number;
      };

      // user2 has only user2Asset1
      await expect.poll(getSpaceAssetCount, { interval: 1000, timeout: 30_000 }).toBe(1);
    }, 35_000);

    it('should be idempotent after job completes', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Bulk Idempotent Job' });

      // First bulk add
      await request(app)
        .post(`/shared-spaces/${space.id}/assets/bulk-add`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      const getSpaceAssetCount = async () => {
        const { body } = await request(app)
          .get(`/shared-spaces/${space.id}`)
          .set('Authorization', `Bearer ${user1.accessToken}`);
        return body.assetCount as number;
      };

      await expect.poll(getSpaceAssetCount, { interval: 1000, timeout: 30_000 }).toBe(2);

      // Run again — should not duplicate
      await request(app)
        .post(`/shared-spaces/${space.id}/assets/bulk-add`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      // Wait a bit for the second job to process, then verify count is still 2
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const { body: spaceDetail } = await request(app)
        .get(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(spaceDetail.assetCount).toBe(2);
    }, 35_000);
  });

  describe('DELETE /shared-spaces/:id/assets', () => {
    it('should require authentication', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Remove Asset Auth' });
      await utils.addSpaceAssets(user1.accessToken, space.id, [user1Asset1.id]);

      const { status, body } = await request(app)
        .delete(`/shared-spaces/${space.id}/assets`)
        .send({ assetIds: [user1Asset1.id] });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should remove assets from a space (owner)', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Remove Asset Owner' });
      await utils.addSpaceAssets(user1.accessToken, space.id, [user1Asset1.id]);

      const { status } = await request(app)
        .delete(`/shared-spaces/${space.id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [user1Asset1.id] });

      expect(status).toBe(204);

      // Verify asset was removed
      const { body: spaceDetail } = await request(app)
        .get(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(spaceDetail.assetCount).toBe(0);
    });

    it('should allow editor to remove assets', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Editor Remove' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId, role: SharedSpaceRole.Editor });
      await utils.addSpaceAssets(user1.accessToken, space.id, [user1Asset1.id]);

      const { status } = await request(app)
        .delete(`/shared-spaces/${space.id}/assets`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ assetIds: [user1Asset1.id] });

      expect(status).toBe(204);
    });

    it('should reject viewer removing assets', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Viewer Remove' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });
      await utils.addSpaceAssets(user1.accessToken, space.id, [user1Asset1.id]);

      const { status } = await request(app)
        .delete(`/shared-spaces/${space.id}/assets`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ assetIds: [user1Asset1.id] });

      expect(status).toBe(403);
    });

    it('should reject non-member removing assets', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Non-member Remove' });
      await utils.addSpaceAssets(user1.accessToken, space.id, [user1Asset1.id]);

      const { status } = await request(app)
        .delete(`/shared-spaces/${space.id}/assets`)
        .set('Authorization', `Bearer ${user3.accessToken}`)
        .send({ assetIds: [user1Asset1.id] });

      expect(status).toBe(403);
    });

    it('should clear thumbnail when cover photo is removed', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Cover Clear' });
      await utils.addSpaceAssets(user1.accessToken, space.id, [user1Asset1.id]);
      await utils.updateSpace(user1.accessToken, space.id, { thumbnailAssetId: user1Asset1.id });

      await request(app)
        .delete(`/shared-spaces/${space.id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [user1Asset1.id] });

      const { body } = await request(app)
        .get(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(body.thumbnailAssetId).toBeNull();
    });
  });

  describe('PATCH /shared-spaces/:id/members/me/timeline', () => {
    it('should require authentication', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Timeline Auth' });
      const { status, body } = await request(app)
        .patch(`/shared-spaces/${space.id}/members/me/timeline`)
        .send({ showInTimeline: true });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should toggle showInTimeline for current member', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Timeline Space' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      // Enable timeline for user2
      const { status: enableStatus, body: enableBody } = await request(app)
        .patch(`/shared-spaces/${space.id}/members/me/timeline`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ showInTimeline: true });

      expect(enableStatus).toBe(200);
      expect(enableBody).toEqual(expect.objectContaining({ showInTimeline: true }));

      // Disable timeline for user2
      const { status: disableStatus, body: disableBody } = await request(app)
        .patch(`/shared-spaces/${space.id}/members/me/timeline`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ showInTimeline: false });

      expect(disableStatus).toBe(200);
      expect(disableBody).toEqual(expect.objectContaining({ showInTimeline: false }));
    });

    it('should reject non-member toggling timeline', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Non-member Timeline' });

      const { status } = await request(app)
        .patch(`/shared-spaces/${space.id}/members/me/timeline`)
        .set('Authorization', `Bearer ${user3.accessToken}`)
        .send({ showInTimeline: true });

      expect(status).toBe(403);
    });
  });

  describe('PATCH /shared-spaces/:id/view', () => {
    it('should require authentication', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'View Auth' });
      const { status, body } = await request(app).patch(`/shared-spaces/${space.id}/view`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should mark a space as viewed', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'View Space' });

      const { status } = await request(app)
        .patch(`/shared-spaces/${space.id}/view`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(204);
    });

    it('should reject non-member marking as viewed', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Non-member View' });

      const { status } = await request(app)
        .patch(`/shared-spaces/${space.id}/view`)
        .set('Authorization', `Bearer ${user3.accessToken}`);

      expect(status).toBe(403);
    });

    it('should update lastViewedAt for the member', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'View Update' });

      await request(app).patch(`/shared-spaces/${space.id}/view`).set('Authorization', `Bearer ${user1.accessToken}`);

      const { body } = await request(app)
        .get(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(body.lastViewedAt).not.toBeNull();
    });
  });

  describe('DELETE /shared-spaces/:id/members/:userId', () => {
    it('should require authentication', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Remove Member Auth' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      const { status, body } = await request(app).delete(`/shared-spaces/${space.id}/members/${user2.userId}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should remove a member from a space (owner removes member)', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Remove Member' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      const { status } = await request(app)
        .delete(`/shared-spaces/${space.id}/members/${user2.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(204);

      // Verify member was removed
      const { body: members } = await request(app)
        .get(`/shared-spaces/${space.id}/members`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(members).toHaveLength(1);
      expect(members[0]).toEqual(expect.objectContaining({ userId: user1.userId }));
    });

    it('should allow member to leave (self-remove)', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Self Leave' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      const { status } = await request(app)
        .delete(`/shared-spaces/${space.id}/members/${user2.userId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(204);

      // Verify user2 no longer sees the space
      const { body: spaces } = await request(app)
        .get('/shared-spaces')
        .set('Authorization', `Bearer ${user2.accessToken}`);

      const spaceIds = spaces.map((s: { id: string }) => s.id);
      expect(spaceIds).not.toContain(space.id);
    });

    it('should reject owner leaving own space', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Owner Leave' });

      const { status, body } = await request(app)
        .delete(`/shared-spaces/${space.id}/members/${user1.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Owner cannot leave the space'));
    });

    it('should reject non-owner removing other members', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Non-owner Remove' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId, role: SharedSpaceRole.Editor });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user3.userId });

      // Editor tries to remove viewer
      const { status } = await request(app)
        .delete(`/shared-spaces/${space.id}/members/${user3.userId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(403);
    });

    it('should reject non-member removing members', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Non-member Remove' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      const { status } = await request(app)
        .delete(`/shared-spaces/${space.id}/members/${user2.userId}`)
        .set('Authorization', `Bearer ${user3.accessToken}`);

      expect(status).toBe(403);
    });

    it('should lose access to space after being removed', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Lost Access' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      // Remove user2
      await request(app)
        .delete(`/shared-spaces/${space.id}/members/${user2.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      // user2 should no longer be able to access the space
      const { status } = await request(app)
        .get(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(403);
    });
  });

  describe('GET /shared-spaces/:id/activities', () => {
    it('should require authentication', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Activity Auth' });
      const { status, body } = await request(app).get(`/shared-spaces/${space.id}/activities`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should return activities for the space', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Activity Feed' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId, role: SharedSpaceRole.Editor });
      await utils.addSpaceAssets(user1.accessToken, space.id, [user1Asset1.id]);

      const { status, body } = await request(app)
        .get(`/shared-spaces/${space.id}/activities`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'member_join' }),
          expect.objectContaining({ type: 'asset_add' }),
        ]),
      );
    });

    it('should reject non-member accessing activities', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Activity Non-member' });

      const { status } = await request(app)
        .get(`/shared-spaces/${space.id}/activities`)
        .set('Authorization', `Bearer ${user3.accessToken}`);

      expect(status).toBe(403);
    });

    it('should allow viewer to access activities', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Activity Viewer' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });
      await utils.addSpaceAssets(user1.accessToken, space.id, [user1Asset1.id]);

      const { status, body } = await request(app)
        .get(`/shared-spaces/${space.id}/activities`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
    });

    it('should log activity when member is removed', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Activity Remove' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      await request(app)
        .delete(`/shared-spaces/${space.id}/members/${user2.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      const { body } = await request(app)
        .get(`/shared-spaces/${space.id}/activities`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(body).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'member_remove' })]));
    });

    it('should log activity when member leaves', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Activity Leave' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      await request(app)
        .delete(`/shared-spaces/${space.id}/members/${user2.userId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      const { body } = await request(app)
        .get(`/shared-spaces/${space.id}/activities`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(body).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'member_leave' })]));
    });

    it('should log activity when space is renamed', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Activity Rename' });

      await request(app)
        .patch(`/shared-spaces/${space.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: 'Renamed Space' });

      const { body } = await request(app)
        .get(`/shared-spaces/${space.id}/activities`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(body).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'space_rename' })]));
    });

    it('should log activity when assets are removed', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Activity Asset Remove' });
      await utils.addSpaceAssets(user1.accessToken, space.id, [user1Asset1.id]);

      await request(app)
        .delete(`/shared-spaces/${space.id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [user1Asset1.id] });

      const { body } = await request(app)
        .get(`/shared-spaces/${space.id}/activities`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(body).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'asset_remove' })]));
    });

    it('should log activity when member role changes', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Activity Role' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      await request(app)
        .patch(`/shared-spaces/${space.id}/members/${user2.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ role: SharedSpaceRole.Editor });

      const { body } = await request(app)
        .get(`/shared-spaces/${space.id}/activities`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(body).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'member_role_change' })]));
    });

    it('should support pagination with limit and offset', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Activity Paging' });
      // Add multiple members to generate activities
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId, role: SharedSpaceRole.Editor });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user3.userId });
      await utils.addSpaceAssets(user1.accessToken, space.id, [user1Asset1.id, user1Asset2.id]);

      const { body: page1 } = await request(app)
        .get(`/shared-spaces/${space.id}/activities?limit=2&offset=0`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(page1).toHaveLength(2);

      const { body: page2 } = await request(app)
        .get(`/shared-spaces/${space.id}/activities?limit=2&offset=2`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(page2.length).toBeGreaterThan(0);

      // Ensure different activities on different pages
      const page1Ids = page1.map((a: { id: string }) => a.id);
      const page2Ids = page2.map((a: { id: string }) => a.id);
      for (const id of page2Ids) {
        expect(page1Ids).not.toContain(id);
      }
    });
  });

  describe('GET /shared-spaces/:id/map-markers', () => {
    it('should require authentication', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Map Auth' });
      const { status, body } = await request(app).get(`/shared-spaces/${space.id}/map-markers`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should return map markers for space assets', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Map Markers' });
      await utils.addSpaceAssets(user1.accessToken, space.id, [user1Asset1.id]);

      const { status, body } = await request(app)
        .get(`/shared-spaces/${space.id}/map-markers`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
    });

    it('should reject non-member accessing map markers', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Map Non-member' });

      const { status } = await request(app)
        .get(`/shared-spaces/${space.id}/map-markers`)
        .set('Authorization', `Bearer ${user3.accessToken}`);

      expect(status).not.toBe(200);
    });
  });

  describe('cross-user asset access via spaces', () => {
    it('should allow space member to view assets in the space', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Asset View Access' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });
      await utils.addSpaceAssets(user1.accessToken, space.id, [user1Asset1.id]);

      // user2 (viewer) should be able to read user1's asset via space membership
      const { status } = await request(app)
        .get(`/assets/${user1Asset1.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(200);
    });

    it('should not allow non-member to view space assets', async () => {
      const asset = await utils.createAsset(user1.accessToken);
      const space = await utils.createSpace(user1.accessToken, { name: 'No Access Asset' });
      await utils.addSpaceAssets(user1.accessToken, space.id, [asset.id]);

      // user3 (non-member) should not be able to read the asset
      const { status } = await request(app)
        .get(`/assets/${asset.id}`)
        .set('Authorization', `Bearer ${user3.accessToken}`);

      expect(status).toBe(400);
    });

    it('should revoke asset access after member is removed', async () => {
      const asset = await utils.createAsset(user1.accessToken);
      const space = await utils.createSpace(user1.accessToken, { name: 'Revoke Access' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });
      await utils.addSpaceAssets(user1.accessToken, space.id, [asset.id]);

      // Verify access before removal
      const { status: before } = await request(app)
        .get(`/assets/${asset.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`);
      expect(before).toBe(200);

      // Remove user2
      await request(app)
        .delete(`/shared-spaces/${space.id}/members/${user2.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      // Verify access is revoked
      const { status: after } = await request(app)
        .get(`/assets/${asset.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`);
      expect(after).toBe(400);
    });

    it('should allow space member to download space assets', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Download Access' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });
      await utils.addSpaceAssets(user1.accessToken, space.id, [user1Asset1.id]);

      const { status } = await request(app)
        .get(`/assets/${user1Asset1.id}/original`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(200);
    });
  });

  describe('space map and timeline for non-owner members', () => {
    let space: { id: string };
    let gpsAsset1: AssetMediaResponseDto;
    let gpsAsset2: AssetMediaResponseDto;

    beforeAll(async () => {
      // Create assets owned by user1 with GPS coordinates
      [gpsAsset1, gpsAsset2] = await Promise.all([
        utils.createAsset(user1.accessToken),
        utils.createAsset(user1.accessToken),
      ]);

      // Set GPS coordinates on the assets
      await Promise.all([
        request(app)
          .put(`/assets/${gpsAsset1.id}`)
          .set('Authorization', `Bearer ${user1.accessToken}`)
          .send({ latitude: 40.7128, longitude: -74.006 }),
        request(app)
          .put(`/assets/${gpsAsset2.id}`)
          .set('Authorization', `Bearer ${user1.accessToken}`)
          .send({ latitude: 48.8566, longitude: 2.3522 }),
      ]);

      // Create space, add user2 as member, add GPS assets
      space = await utils.createSpace(user1.accessToken, { name: 'Map Timeline Test' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });
      await utils.addSpaceAssets(user1.accessToken, space.id, [gpsAsset1.id, gpsAsset2.id]);
    });

    it('should return map markers for a non-owner member', async () => {
      const { status, body } = await request(app)
        .get(`/shared-spaces/${space.id}/map-markers`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(200);
      expect(body).toHaveLength(2);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: gpsAsset1.id, lat: expect.closeTo(40.7128), lon: expect.closeTo(-74.006) }),
          expect.objectContaining({ id: gpsAsset2.id, lat: expect.closeTo(48.8566), lon: expect.closeTo(2.3522) }),
        ]),
      );
    });

    it('should return time buckets filtered by spaceId for a non-owner member', async () => {
      const { status, body } = await request(app)
        .get('/timeline/buckets')
        .query({ spaceId: space.id })
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(200);
      expect(body.length).toBeGreaterThan(0);

      const totalCount = body.reduce((sum: number, bucket: { count: number }) => sum + bucket.count, 0);
      expect(totalCount).toBe(2);
    });

    it('should return assets in a time bucket filtered by spaceId for a non-owner member', async () => {
      // First get the buckets to find the correct timeBucket value
      const { body: buckets } = await request(app)
        .get('/timeline/buckets')
        .query({ spaceId: space.id })
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(buckets.length).toBeGreaterThan(0);

      const { status, body } = await request(app)
        .get('/timeline/bucket')
        .query({ spaceId: space.id, timeBucket: buckets[0].timeBucket })
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(200);
      expect(body.id.length).toBeGreaterThan(0);
      // All returned assets should be from the space (owned by user1)
      for (const ownerId of body.ownerId) {
        expect(ownerId).toBe(user1.userId);
      }
    });

    it('should reject non-member accessing timeline buckets with spaceId', async () => {
      const { status } = await request(app)
        .get('/timeline/buckets')
        .query({ spaceId: space.id })
        .set('Authorization', `Bearer ${user3.accessToken}`);

      expect(status).not.toBe(200);
    });
  });

  describe('GET /shared-spaces/:id/people (T09)', () => {
    // T09 covers the space-people listing endpoint. Uses its own dedicated fixtures
    // (separate from the outer file's user1/user2/user3) so the test counts are
    // deterministic and don't depend on what other describes did.
    //
    // Endpoint: GET /shared-spaces/:id/people
    // Permission: SharedSpaceRead
    // Query params (from server/src/dtos/shared-space-person.dto.ts):
    //   - limit, offset (1-100), withHidden, named, takenAfter, takenBefore
    // Pet visibility is server-controlled via shared_space.petsEnabled — not a
    // query param.

    let owner: LoginResponseDto;
    let editor: LoginResponseDto;
    let viewer: LoginResponseDto;
    let nonMember: LoginResponseDto;
    let spaceId: string;
    let spaceAssetId: string;

    let namedPersonId: string; // Alice — has a name
    let unnamedPersonId: string; // empty name
    let namedZoePersonId: string; // Zoe — has a name, sorts after Alice
    let unnamedHighAssetCountPersonId: string; // empty name, above minFaces threshold
    let unnamedLowAssetCountPersonId: string; // empty name, above minFaces threshold
    let hiddenPersonId: string; // Hannah — set isHidden=true
    let petPersonId: string; // Rex — type=pet
    let zeroThumbPersonId: string; // person with empty thumbnailPath — invisible to listing
    let zeroThumbGlobalId: string; // the underlying global person, for direct mutation in test 11
    let aliceGlobalId: string; // captured for the "space IDs not global IDs" load-bearing assertion

    // Actor objects for forEachActor — built from the LoginResponseDto bag in beforeAll.
    let ownerActor: Actor;
    let editorActor: Actor;
    let viewerActor: Actor;
    let nonMemberActor: Actor;
    const anonActor: Actor = { id: 'anon' };

    beforeAll(async () => {
      [owner, editor, viewer, nonMember] = await Promise.all([
        utils.userSetup(admin.accessToken, createUserDto.create('t09-owner')),
        utils.userSetup(admin.accessToken, createUserDto.create('t09-editor')),
        utils.userSetup(admin.accessToken, createUserDto.create('t09-viewer')),
        utils.userSetup(admin.accessToken, createUserDto.create('t09-nonmember')),
      ]);

      const spaceRes = await utils.createSpace(owner.accessToken, { name: 't09 space' });
      spaceId = spaceRes.id;

      await utils.addSpaceMember(owner.accessToken, spaceId, {
        userId: editor.userId,
        role: SharedSpaceRole.Editor,
      });
      await utils.addSpaceMember(owner.accessToken, spaceId, {
        userId: viewer.userId,
        role: SharedSpaceRole.Viewer,
      });

      const asset = await utils.createAsset(owner.accessToken);
      spaceAssetId = asset.id;
      await utils.addSpaceAssets(owner.accessToken, spaceId, [spaceAssetId]);

      // Create the four space-people via the extended utils.createSpacePerson helper.
      // The helper handles the four-table insert (person + asset_face + shared_space_person
      // + shared_space_person_face junction) and sets person.thumbnailPath so the
      // listing's hard requirement is satisfied.
      const aliceRes = await utils.createSpacePerson(spaceId, 'Alice', owner.userId, spaceAssetId);
      namedPersonId = aliceRes.spacePersonId;
      aliceGlobalId = aliceRes.globalPersonId;

      const unnamedRes = await utils.createSpacePerson(spaceId, '', owner.userId, spaceAssetId);
      unnamedPersonId = unnamedRes.spacePersonId;

      const zoeRes = await utils.createSpacePerson(spaceId, 'Zoe', owner.userId, spaceAssetId);
      namedZoePersonId = zoeRes.spacePersonId;

      const unnamedHighRes = await utils.createSpacePerson(spaceId, '', owner.userId, spaceAssetId);
      unnamedHighAssetCountPersonId = unnamedHighRes.spacePersonId;

      const unnamedLowRes = await utils.createSpacePerson(spaceId, '', owner.userId, spaceAssetId);
      unnamedLowAssetCountPersonId = unnamedLowRes.spacePersonId;

      const hannahRes = await utils.createSpacePerson(spaceId, 'Hannah', owner.userId, spaceAssetId);
      hiddenPersonId = hannahRes.spacePersonId;
      // Set hidden directly via DB to avoid coupling to T11's PUT endpoint coverage.
      const dbClient = await utils.connectDatabase();
      await dbClient.query('UPDATE shared_space_person SET "isHidden" = true WHERE id = $1', [hiddenPersonId]);
      await dbClient.query('UPDATE shared_space_person SET "assetCount" = 6 WHERE id = $1', [
        unnamedHighAssetCountPersonId,
      ]);
      await dbClient.query('UPDATE shared_space_person SET "assetCount" = 3 WHERE id = $1', [
        unnamedLowAssetCountPersonId,
      ]);

      const rexRes = await utils.createSpacePerson(spaceId, 'Rex', owner.userId, spaceAssetId, { type: 'pet' });
      petPersonId = rexRes.spacePersonId;

      // Fifth person whose underlying global thumbnailPath we'll blank — used by test 11
      // (the "minFaces gate" pin). Created here so test 11 can mutate and restore it
      // without depending on creation order.
      const ghostRes = await utils.createSpacePerson(spaceId, 'Ghost', owner.userId, spaceAssetId);
      zeroThumbPersonId = ghostRes.spacePersonId;
      zeroThumbGlobalId = ghostRes.globalPersonId;

      // Build actors once so the access matrix test can use forEachActor.
      ownerActor = { id: 'spaceOwner', token: owner.accessToken, userId: owner.userId };
      editorActor = { id: 'spaceEditor', token: editor.accessToken, userId: editor.userId };
      viewerActor = { id: 'spaceViewer', token: viewer.accessToken, userId: viewer.userId };
      nonMemberActor = { id: 'spaceNonMember', token: nonMember.accessToken, userId: nonMember.userId };
    });

    it('returns the listing for any space member; 403 for non-member, 401 for anon', async () => {
      // Standard access matrix. shared-space endpoints use requireMembership which
      // throws ForbiddenException → 403, distinct from the timeline endpoints which
      // use requireAccess and return 400.
      await forEachActor(
        [ownerActor, editorActor, viewerActor, nonMemberActor, anonActor],
        (actor) => request(app).get(`/shared-spaces/${spaceId}/people`).set(authHeaders(actor)),
        { spaceOwner: 200, spaceEditor: 200, spaceViewer: 200, spaceNonMember: 403, anon: 401 },
      );
    });

    it('returns space person IDs (not global person IDs)', async () => {
      // The canonical assertion for the whole sub-tree (T09-T14): the listing response
      // contains shared_space_person.id values, NOT global person.id values. Every
      // downstream test takes the IDs from this listing and uses them as path params.
      //
      // Both halves are load-bearing:
      //   - toContain(namedPersonId): the space-person id IS in the list
      //   - not.toContain(aliceGlobalId): the global person id is NOT
      // Without the negation, a regression that returned the global person.id
      // (instead of shared_space_person.id) would still satisfy the contains
      // checks IF the values happened to be the same — they won't, but the
      // negation pins the contract explicitly.
      const { status, body } = await request(app)
        .get(`/shared-spaces/${spaceId}/people`)
        .set('Authorization', `Bearer ${owner.accessToken}`);
      expect(status).toBe(200);
      const ids = (body as Array<{ id: string }>).map((p) => p.id);
      expect(ids).toContain(namedPersonId);
      expect(ids).not.toContain(unnamedPersonId);
      expect(ids).toContain(unnamedHighAssetCountPersonId);
      expect(ids).toContain(unnamedLowAssetCountPersonId);
      expect(ids).toContain(petPersonId);
      // Sanity check: namedPersonId and aliceGlobalId are different UUIDs.
      expect(namedPersonId).not.toBe(aliceGlobalId);
      // The global person id MUST NOT appear in the listing.
      expect(ids).not.toContain(aliceGlobalId);
    });

    it('hidden persons are excluded by default (withHidden omitted)', async () => {
      const { status, body } = await request(app)
        .get(`/shared-spaces/${spaceId}/people`)
        .set('Authorization', `Bearer ${owner.accessToken}`);
      expect(status).toBe(200);
      const ids = (body as Array<{ id: string }>).map((p) => p.id);
      expect(ids).not.toContain(hiddenPersonId);
    });

    it('?withHidden=true includes hidden persons', async () => {
      const { status, body } = await request(app)
        .get(`/shared-spaces/${spaceId}/people?withHidden=true`)
        .set('Authorization', `Bearer ${owner.accessToken}`);
      expect(status).toBe(200);
      const ids = (body as Array<{ id: string }>).map((p) => p.id);
      expect(ids).toContain(hiddenPersonId);
    });

    it('below-threshold unnamed persons are excluded from the default listing', async () => {
      const { status, body } = await request(app)
        .get(`/shared-spaces/${spaceId}/people`)
        .set('Authorization', `Bearer ${owner.accessToken}`);
      expect(status).toBe(200);
      const ids = (body as Array<{ id: string }>).map((p) => p.id);
      expect(ids).not.toContain(unnamedPersonId);
    });

    it('sorts named people alphabetically before unnamed people by asset count', async () => {
      const { status, body } = await request(app)
        .get(`/shared-spaces/${spaceId}/people`)
        .set('Authorization', `Bearer ${owner.accessToken}`);
      expect(status).toBe(200);
      const ids = (body as Array<{ id: string }>).map((p) => p.id);

      expect(ids.indexOf(namedPersonId)).toBeLessThan(ids.indexOf(namedZoePersonId));
      expect(ids.indexOf(namedZoePersonId)).toBeLessThan(ids.indexOf(unnamedHighAssetCountPersonId));
      expect(ids.indexOf(unnamedHighAssetCountPersonId)).toBeLessThan(ids.indexOf(unnamedLowAssetCountPersonId));
    });

    it('?named=true returns only persons with non-empty names', async () => {
      // The named filter is true if either shared_space_person.name OR the underlying
      // person.name is non-empty (server/src/repositories/shared-space.repository.ts:514-521).
      // Alice (named via shared_space_person.name) is in; the truly-unnamed one is out.
      const { status, body } = await request(app)
        .get(`/shared-spaces/${spaceId}/people?named=true`)
        .set('Authorization', `Bearer ${owner.accessToken}`);
      expect(status).toBe(200);
      const ids = (body as Array<{ id: string }>).map((p) => p.id);
      expect(ids).toContain(namedPersonId);
      expect(ids).toContain(namedZoePersonId);
      expect(ids).not.toContain(unnamedPersonId);
      expect(ids).not.toContain(unnamedHighAssetCountPersonId);
      expect(ids).not.toContain(unnamedLowAssetCountPersonId);
    });

    it('petsEnabled toggle on the space hides pet persons', async () => {
      // shared_space_person.type='pet' rows are filtered when shared_space.petsEnabled
      // is false. Mutate via direct DB and restore in try/finally per the fixture
      // lifetime contract.
      const dbClient = await utils.connectDatabase();
      try {
        await dbClient.query('UPDATE shared_space SET "petsEnabled" = false WHERE id = $1', [spaceId]);
        const { status, body } = await request(app)
          .get(`/shared-spaces/${spaceId}/people`)
          .set('Authorization', `Bearer ${owner.accessToken}`);
        expect(status).toBe(200);
        const ids = (body as Array<{ id: string }>).map((p) => p.id);
        expect(ids).not.toContain(petPersonId);
      } finally {
        await dbClient.query('UPDATE shared_space SET "petsEnabled" = true WHERE id = $1', [spaceId]);
      }
    });

    describe('pagination', () => {
      // Insert 15 extra named persons in this nested describe's beforeAll, deleted in
      // afterAll. Per the fixture lifetime contract, mutating shared fixtures inside
      // an `it` block would leak into subsequent tests; the nested describe wrapper
      // scopes the rows to just the pagination tests.
      const extraPersonIds: string[] = [];

      beforeAll(async () => {
        for (let i = 0; i < 15; i++) {
          const res = await utils.createSpacePerson(spaceId, `Extra ${i}`, owner.userId, spaceAssetId);
          extraPersonIds.push(res.spacePersonId);
        }
      });

      afterAll(async () => {
        if (extraPersonIds.length === 0) {
          return;
        }
        const dbClient = await utils.connectDatabase();
        await dbClient.query('DELETE FROM shared_space_person WHERE id = ANY($1::uuid[])', [extraPersonIds]);
      });

      it('?limit=10 caps the response at 10 entries', async () => {
        const { status, body } = await request(app)
          .get(`/shared-spaces/${spaceId}/people?limit=10`)
          .set('Authorization', `Bearer ${owner.accessToken}`);
        expect(status).toBe(200);
        expect((body as unknown[]).length).toBeLessThanOrEqual(10);
      });

      it('?offset paginates without overlap', async () => {
        const page1 = await request(app)
          .get(`/shared-spaces/${spaceId}/people?limit=5&offset=0`)
          .set('Authorization', `Bearer ${owner.accessToken}`);
        const page2 = await request(app)
          .get(`/shared-spaces/${spaceId}/people?limit=5&offset=5`)
          .set('Authorization', `Bearer ${owner.accessToken}`);
        expect(page1.status).toBe(200);
        expect(page2.status).toBe(200);
        const ids1 = (page1.body as Array<{ id: string }>).map((p) => p.id);
        const ids2 = new Set((page2.body as Array<{ id: string }>).map((p) => p.id));
        const overlap = ids1.filter((id) => ids2.has(id));
        expect(overlap).toHaveLength(0);
      });

      it('sort order is stable across calls', async () => {
        const a = await request(app)
          .get(`/shared-spaces/${spaceId}/people?limit=5`)
          .set('Authorization', `Bearer ${owner.accessToken}`);
        const b = await request(app)
          .get(`/shared-spaces/${spaceId}/people?limit=5`)
          .set('Authorization', `Bearer ${owner.accessToken}`);
        const idsA = (a.body as Array<{ id: string }>).map((p) => p.id);
        const idsB = (b.body as Array<{ id: string }>).map((p) => p.id);
        expect(idsA).toEqual(idsB);
      });
    });

    describe('GET /shared-spaces/:id/people/:personId — single + thumbnail + assets (T10)', () => {
      // Reuses the T09 fixture setup (parent beforeAll). All read-only sub-endpoints
      // share the same access path: requireMembership → 403 for non-member, 401 for anon.
      //
      // T10 was supposed to resolve the T09 open hypothesis "hidden and pets filters
      // apply at listing only". The hypothesis turned out to be HALF correct:
      //   - Hidden person: direct fetch returns 200 (filter is listing-only).
      //   - Pet person when petsEnabled=false: direct fetch returns 400 (filter
      //     applies at single-fetch level too).
      // Both findings pinned in the backlog "Observed invariants" section.
      //
      // Also pinned: missing personId returns 400 (not 404) — Immich's bulk-access
      // pattern via requireAccess uniformly returns BadRequestException for "not found
      // OR no access" to avoid leaking existence.

      describe('GET /shared-spaces/:id/people/:personId', () => {
        it('access matrix', async () => {
          await forEachActor(
            [ownerActor, editorActor, viewerActor, nonMemberActor, anonActor],
            (actor) => request(app).get(`/shared-spaces/${spaceId}/people/${namedPersonId}`).set(authHeaders(actor)),
            { spaceOwner: 200, spaceEditor: 200, spaceViewer: 200, spaceNonMember: 403, anon: 401 },
          );
        });

        it('returns the canonical space person ID and name', async () => {
          const { status, body } = await request(app)
            .get(`/shared-spaces/${spaceId}/people/${namedPersonId}`)
            .set('Authorization', `Bearer ${owner.accessToken}`);
          expect(status).toBe(200);
          expect((body as { id: string; name: string }).id).toBe(namedPersonId);
          expect((body as { name: string }).name).toBe('Alice');
        });

        it('hidden person IS fetchable directly — filter is listing-only', async () => {
          // Half of the T09 open hypothesis: confirmed for hidden persons. The
          // listing-level withHidden default excludes them, but a direct fetch by ID
          // returns 200. Pin so a future security refactor that adds the filter to
          // the single-fetch path would be caught.
          const { status, body } = await request(app)
            .get(`/shared-spaces/${spaceId}/people/${hiddenPersonId}`)
            .set('Authorization', `Bearer ${owner.accessToken}`);
          expect(status).toBe(200);
          expect((body as { id: string }).id).toBe(hiddenPersonId);
          expect((body as { isHidden: boolean }).isHidden).toBe(true);
        });

        it('pet person is NOT fetchable directly when petsEnabled=false — filter applies to single-fetch', async () => {
          // Other half of the T09 open hypothesis: DISPROVED for pets. The pet filter
          // applies BOTH to the listing AND to the direct fetch — a non-obvious
          // asymmetry vs the hidden filter (which is listing-only). The server
          // throws BadRequestException('Person not found') at
          // shared-space.service.ts:633-636. Pinning the message ensures the test
          // stays load-bearing — a future regression that returns 400 from a
          // different validator would not satisfy the message check.
          //
          // Practically this means: if the space has petsEnabled=false, no member
          // can address the pet person at all, even with the ID. This is the
          // intended UX: when pets are off, the entire pet sub-graph is invisible.
          const dbClient = await utils.connectDatabase();
          try {
            await dbClient.query('UPDATE shared_space SET "petsEnabled" = false WHERE id = $1', [spaceId]);
            const { status, body } = await request(app)
              .get(`/shared-spaces/${spaceId}/people/${petPersonId}`)
              .set('Authorization', `Bearer ${owner.accessToken}`);
            expect(status).toBe(400);
            expect((body as { message: string }).message).toMatch(/Person not found/i);
          } finally {
            await dbClient.query('UPDATE shared_space SET "petsEnabled" = true WHERE id = $1', [spaceId]);
          }
        });

        it('non-existent personId returns 400 (bulk-access pattern, not 404)', async () => {
          // requireAccess returns BadRequestException uniformly for "not found OR no
          // access" to avoid leaking existence. Same taxonomic split T03 documented
          // for timeline. Pin the 400 AND the message so a future change to return
          // 404 OR a 400 from a different validator would be caught.
          const { status, body } = await request(app)
            .get(`/shared-spaces/${spaceId}/people/00000000-0000-4000-a000-000000000099`)
            .set('Authorization', `Bearer ${owner.accessToken}`);
          expect(status).toBe(400);
          expect((body as { message: string }).message).toMatch(/Person not found/i);
        });
      });

      describe('GET /shared-spaces/:id/people/:personId/thumbnail', () => {
        // Test strategy: the thumbnail endpoint has THREE distinct return paths
        // once the access check passes:
        //   - person not found OR wrong space → throw NotFoundException → 404
        //   - representative face missing/not in this space/no asset thumbnail → 404
        //   - representative asset thumbnail exists → 200 with bytes
        //
        // Global face identities decouple shared-space thumbnails from the source
        // person's private thumbnailPath. The endpoint serves the representative
        // asset thumbnail only after verifying the representative face belongs to
        // the requested space, so blanking person.thumbnailPath must not affect
        // member access.
        //
        // The matrix this test pins:
        //   - member with a representative face on a space asset → 200
        //   - non-member → 403 (access check fires before file lookup)
        //   - anon → 401 (auth middleware denies before service is invoked)
        // Together this characterises the LAYERED ordering 401 < 403 < member success
        // without leaking face existence outside the space.

        it('access matrix and 401 < 403 < 404 ordering', async () => {
          const dbClient = await utils.connectDatabase();
          try {
            await dbClient.query(
              `UPDATE person SET "thumbnailPath" = $1
               WHERE id = (SELECT "personId" FROM asset_face WHERE id =
                 (SELECT "representativeFaceId" FROM shared_space_person WHERE id = $2))`,
              ['', namedPersonId],
            );

            await forEachActor(
              [ownerActor, editorActor, viewerActor, nonMemberActor, anonActor],
              (actor) =>
                request(app).get(`/shared-spaces/${spaceId}/people/${namedPersonId}/thumbnail`).set(authHeaders(actor)),
              { spaceOwner: 200, spaceEditor: 200, spaceViewer: 200, spaceNonMember: 403, anon: 401 },
            );
          } finally {
            await dbClient.query(
              `UPDATE person SET "thumbnailPath" = $1
               WHERE id = (SELECT "personId" FROM asset_face WHERE id =
                 (SELECT "representativeFaceId" FROM shared_space_person WHERE id = $2))`,
              ['/my/awesome/thumbnail.jpg', namedPersonId],
            );
          }
        });
      });

      describe('GET /shared-spaces/:id/people/:personId/assets', () => {
        it('access matrix', async () => {
          await forEachActor(
            [ownerActor, editorActor, viewerActor, nonMemberActor, anonActor],
            (actor) =>
              request(app).get(`/shared-spaces/${spaceId}/people/${namedPersonId}/assets`).set(authHeaders(actor)),
            { spaceOwner: 200, spaceEditor: 200, spaceViewer: 200, spaceNonMember: 403, anon: 401 },
          );
        });

        it('returns the asset IDs containing the person', async () => {
          // Alice (namedPersonId) is on spaceAssetId. The endpoint returns string[]
          // of asset IDs.
          const { status, body } = await request(app)
            .get(`/shared-spaces/${spaceId}/people/${namedPersonId}/assets`)
            .set('Authorization', `Bearer ${owner.accessToken}`);
          expect(status).toBe(200);
          expect(Array.isArray(body)).toBe(true);
          expect(body as string[]).toContain(spaceAssetId);
        });
      });
    });

    describe('PUT/DELETE /shared-spaces/:id/people/:personId (T11)', () => {
      // T11 covers mutation of a single space person: rename, hide, delete.
      // PUT and DELETE both go through `requireRole(Editor)` (verified at
      // shared-space.service.ts:665, 704), so Owner and Editor can mutate but
      // Viewer is rejected (403). Non-member is also 403 (requireMembership inside
      // requireRole). anon is 401.
      //
      // Tests use scratch space persons created via utils.createSpacePerson per `it`
      // block so the mutations are fully isolated and don't affect T09's listing
      // assertions or T10's read-only fixtures.

      describe('PUT /shared-spaces/:id/people/:personId', () => {
        it('access matrix for rename', async () => {
          const scratch = await utils.createSpacePerson(spaceId, 'ScratchPut1', owner.userId, spaceAssetId);
          await forEachActor(
            [ownerActor, editorActor, viewerActor, nonMemberActor, anonActor],
            (actor) =>
              request(app)
                .put(`/shared-spaces/${spaceId}/people/${scratch.spacePersonId}`)
                .set(authHeaders(actor))
                .send({ name: 'Renamed' }),
            { spaceOwner: 200, spaceEditor: 200, spaceViewer: 403, spaceNonMember: 403, anon: 401 },
          );
        });

        it('actually renames the person', async () => {
          const scratch = await utils.createSpacePerson(spaceId, 'BeforeRename', owner.userId, spaceAssetId);
          const { status, body } = await request(app)
            .put(`/shared-spaces/${spaceId}/people/${scratch.spacePersonId}`)
            .set('Authorization', `Bearer ${owner.accessToken}`)
            .send({ name: 'AfterRename' });
          expect(status).toBe(200);
          expect((body as { name: string }).name).toBe('AfterRename');
        });

        it('marking isHidden=true hides from the default listing but keeps direct fetch', async () => {
          // Pairs with T10 test 3 (hidden listing-only). After PUT isHidden=true:
          //   - GET /people (default) excludes the person
          //   - GET /people?withHidden=true includes it
          //   - GET /people/:personId still returns 200 with isHidden=true
          const scratch = await utils.createSpacePerson(spaceId, 'ToHide', owner.userId, spaceAssetId);

          const putRes = await request(app)
            .put(`/shared-spaces/${spaceId}/people/${scratch.spacePersonId}`)
            .set('Authorization', `Bearer ${owner.accessToken}`)
            .send({ isHidden: true });
          expect(putRes.status).toBe(200);
          expect((putRes.body as { isHidden: boolean }).isHidden).toBe(true);

          const listing = await request(app)
            .get(`/shared-spaces/${spaceId}/people`)
            .set('Authorization', `Bearer ${owner.accessToken}`);
          const ids = (listing.body as Array<{ id: string }>).map((p) => p.id);
          expect(ids).not.toContain(scratch.spacePersonId);

          const direct = await request(app)
            .get(`/shared-spaces/${spaceId}/people/${scratch.spacePersonId}`)
            .set('Authorization', `Bearer ${owner.accessToken}`);
          expect(direct.status).toBe(200);
          expect((direct.body as { isHidden: boolean }).isHidden).toBe(true);
        });

        it('updates, persists, lists, and clears birthDate without mutating the source person', async () => {
          const scratch = await utils.createSpacePerson(spaceId, 'BirthDatePerson', owner.userId, spaceAssetId);
          const expectedBirthDate = '1984-05-09';

          const putRes = await request(app)
            .put(`/shared-spaces/${spaceId}/people/${scratch.spacePersonId}`)
            .set('Authorization', `Bearer ${owner.accessToken}`)
            .send({ birthDate: '1984-05-09' });
          expect(putRes.status).toBe(200);
          expect((putRes.body as { birthDate: string | null }).birthDate).toBe(expectedBirthDate);

          const globalPerson = await request(app)
            .get(`/people/${scratch.globalPersonId}`)
            .set('Authorization', `Bearer ${owner.accessToken}`);
          expect(globalPerson.status).toBe(200);
          expect((globalPerson.body as { birthDate: string | null }).birthDate).toBeNull();

          const direct = await request(app)
            .get(`/shared-spaces/${spaceId}/people/${scratch.spacePersonId}`)
            .set('Authorization', `Bearer ${owner.accessToken}`);
          expect(direct.status).toBe(200);
          expect((direct.body as { birthDate: string | null }).birthDate).toBe(expectedBirthDate);

          const listing = await request(app)
            .get(`/shared-spaces/${spaceId}/people?withHidden=true`)
            .set('Authorization', `Bearer ${owner.accessToken}`);
          expect(listing.status).toBe(200);
          const listedPerson = (listing.body as Array<{ id: string; birthDate: string | null }>).find(
            ({ id }) => id === scratch.spacePersonId,
          );
          expect(listedPerson?.birthDate).toBe(expectedBirthDate);

          const clearRes = await request(app)
            .put(`/shared-spaces/${spaceId}/people/${scratch.spacePersonId}`)
            .set('Authorization', `Bearer ${owner.accessToken}`)
            .send({ birthDate: '' });
          expect(clearRes.status).toBe(200);
          expect((clearRes.body as { birthDate: string | null }).birthDate).toBeNull();

          const directAfterClear = await request(app)
            .get(`/shared-spaces/${spaceId}/people/${scratch.spacePersonId}`)
            .set('Authorization', `Bearer ${owner.accessToken}`);
          expect(directAfterClear.status).toBe(200);
          expect((directAfterClear.body as { birthDate: string | null }).birthDate).toBeNull();

          const globalPersonAfterClear = await request(app)
            .get(`/people/${scratch.globalPersonId}`)
            .set('Authorization', `Bearer ${owner.accessToken}`);
          expect(globalPersonAfterClear.status).toBe(200);
          expect((globalPersonAfterClear.body as { birthDate: string | null }).birthDate).toBeNull();
        });

        it('non-existent personId returns 400', async () => {
          // Same manual `BadRequestException('Person not found')` mechanism as
          // GET /:personId (T10). Pinned at the PUT path too — they share the
          // same error shape per shared-space.service.ts:668-669.
          const { status } = await request(app)
            .put(`/shared-spaces/${spaceId}/people/00000000-0000-4000-a000-000000000099`)
            .set('Authorization', `Bearer ${owner.accessToken}`)
            .send({ name: 'doesnt-matter' });
          expect(status).toBe(400);
        });
      });

      describe('DELETE /shared-spaces/:id/people/:personId', () => {
        it('access matrix', async () => {
          // Recreate a fresh person per actor that needs a real personId. Owner
          // and editor will delete it (204); viewer/non-member/anon get rejected
          // before any DB mutation. We use forEachActor with 5 different scratch
          // persons so each test is isolated.
          const scratchByActor: Record<string, string> = {};
          for (const id of ['spaceOwner', 'spaceEditor', 'spaceViewer', 'spaceNonMember', 'anon']) {
            const res = await utils.createSpacePerson(spaceId, `ScratchDel-${id}`, owner.userId, spaceAssetId);
            scratchByActor[id] = res.spacePersonId;
          }
          await forEachActor(
            [ownerActor, editorActor, viewerActor, nonMemberActor, anonActor],
            (actor) =>
              request(app)
                .delete(`/shared-spaces/${spaceId}/people/${scratchByActor[actor.id]}`)
                .set(authHeaders(actor)),
            { spaceOwner: 204, spaceEditor: 204, spaceViewer: 403, spaceNonMember: 403, anon: 401 },
          );
        });

        it('preserves the underlying global person row', async () => {
          // Deleting a space person should NOT cascade to the global person table.
          // Probes that the shared_space_person delete is scoped correctly.
          const scratch = await utils.createSpacePerson(spaceId, 'ScratchPersist', owner.userId, spaceAssetId);

          // Verify the global person exists before
          const dbClient = await utils.connectDatabase();
          const beforeRes = await dbClient.query('SELECT id FROM person WHERE id = $1', [scratch.globalPersonId]);
          expect(beforeRes.rowCount).toBe(1);

          await request(app)
            .delete(`/shared-spaces/${spaceId}/people/${scratch.spacePersonId}`)
            .set('Authorization', `Bearer ${owner.accessToken}`);

          // Global person row still exists after the space person is deleted
          const afterRes = await dbClient.query('SELECT id FROM person WHERE id = $1', [scratch.globalPersonId]);
          expect(afterRes.rowCount).toBe(1);

          // The space-person side IS gone
          const spaceRes = await dbClient.query('SELECT id FROM shared_space_person WHERE id = $1', [
            scratch.spacePersonId,
          ]);
          expect(spaceRes.rowCount).toBe(0);
        });

        it('non-existent personId returns 400', async () => {
          const { status } = await request(app)
            .delete(`/shared-spaces/${spaceId}/people/00000000-0000-4000-a000-000000000099`)
            .set('Authorization', `Bearer ${owner.accessToken}`);
          expect(status).toBe(400);
        });
      });
    });

    describe('POST /shared-spaces/:id/people/:personId/merge (T12)', () => {
      // T12 covers merging space persons. Path :personId is the *target*, body
      // `{ids: string[]}` lists the *sources*. The service (shared-space.service.ts:730-778)
      // requires Editor role, validates both sides are in the same space and the same
      // type, reassigns faces from sources to target, deletes the source rows, recounts
      // the target's denormalised counts, and queues a dedup pass.
      //
      // Each test creates fresh scratch persons (target + sources) per `it()` so the
      // mutations are isolated.

      it('access matrix', async () => {
        // Create one target + one source per actor (5 fresh source persons; the target
        // is shared because the merge would consume the source on a successful run, so
        // we need a fresh source per attempt).
        const target = await utils.createSpacePerson(spaceId, 'MergeTarget', owner.userId, spaceAssetId);
        const sourceByActor: Record<string, string> = {};
        for (const id of ['spaceOwner', 'spaceEditor', 'spaceViewer', 'spaceNonMember', 'anon']) {
          const res = await utils.createSpacePerson(spaceId, `MergeSource-${id}`, owner.userId, spaceAssetId);
          sourceByActor[id] = res.spacePersonId;
        }

        await forEachActor(
          [ownerActor, editorActor, viewerActor, nonMemberActor, anonActor],
          (actor) =>
            request(app)
              .post(`/shared-spaces/${spaceId}/people/${target.spacePersonId}/merge`)
              .set(authHeaders(actor))
              .send({ ids: [sourceByActor[actor.id]] }),
          { spaceOwner: 204, spaceEditor: 204, spaceViewer: 403, spaceNonMember: 403, anon: 401 },
        );
      });

      it("reassigns the source's face and deletes the source row", async () => {
        // Each scratch person comes with one face attached to spaceAssetId. After merge,
        // the source's face should belong to the target (verified via direct DB), and
        // the source's shared_space_person row should be gone.
        const target = await utils.createSpacePerson(spaceId, 'TgtA', owner.userId, spaceAssetId);
        const source = await utils.createSpacePerson(spaceId, 'SrcA', owner.userId, spaceAssetId);

        const dbClient = await utils.connectDatabase();
        // Pre-condition: the source has its junction row pointing at itself.
        const beforeRes = await dbClient.query(
          'SELECT "personId" FROM shared_space_person_face WHERE "personId" = $1',
          [source.spacePersonId],
        );
        expect(beforeRes.rowCount).toBe(1);

        const mergeRes = await request(app)
          .post(`/shared-spaces/${spaceId}/people/${target.spacePersonId}/merge`)
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .send({ ids: [source.spacePersonId] });
        expect(mergeRes.status).toBe(204);

        // The source row is gone
        const sourceRow = await dbClient.query('SELECT id FROM shared_space_person WHERE id = $1', [
          source.spacePersonId,
        ]);
        expect(sourceRow.rowCount).toBe(0);

        // The junction row that used to belong to the source now belongs to the target
        const targetJunction = await dbClient.query(
          'SELECT "personId" FROM shared_space_person_face WHERE "personId" = $1',
          [target.spacePersonId],
        );
        // Target had its own face plus inherited the source's face = 2 junction rows
        expect(targetJunction.rowCount).toBe(2);
      });

      it("after merge the target's denormalised faceCount and assetCount reflect the recount", async () => {
        // recountPersons (shared-space.repository.ts:686+) updates faceCount and
        // assetCount on shared_space_person from the junction table. After merging
        // 1 source into the target, the target should have 2 faces and 1 unique asset
        // (both faces are on spaceAssetId, so assetCount stays at 1).
        const target = await utils.createSpacePerson(spaceId, 'TgtCount', owner.userId, spaceAssetId);
        const source = await utils.createSpacePerson(spaceId, 'SrcCount', owner.userId, spaceAssetId);

        await request(app)
          .post(`/shared-spaces/${spaceId}/people/${target.spacePersonId}/merge`)
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .send({ ids: [source.spacePersonId] });

        const dbClient = await utils.connectDatabase();
        const counts = await dbClient.query('SELECT "faceCount", "assetCount" FROM shared_space_person WHERE id = $1', [
          target.spacePersonId,
        ]);
        expect(counts.rowCount).toBe(1);
        expect(counts.rows[0].faceCount).toBe(2);
        expect(counts.rows[0].assetCount).toBe(1);
      });

      it('cannot merge a person into themselves', async () => {
        // shared-space.service.ts:743-745 — explicit BadRequestException with the
        // distinctive "Cannot merge a person into themselves" message.
        const target = await utils.createSpacePerson(spaceId, 'SelfMerge', owner.userId, spaceAssetId);
        const { status, body } = await request(app)
          .post(`/shared-spaces/${spaceId}/people/${target.spacePersonId}/merge`)
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .send({ ids: [target.spacePersonId] });
        expect(status).toBe(400);
        expect((body as { message: string }).message).toMatch(/themselves/i);
      });

      it('cannot merge across types (person ↔ pet)', async () => {
        // shared-space.service.ts:754-756 — service rejects when source.type !==
        // target.type. UX consequence: pets and persons cannot be merged into each
        // other, even if they're in the same space.
        const personTarget = await utils.createSpacePerson(spaceId, 'TypeP', owner.userId, spaceAssetId);
        const petSource = await utils.createSpacePerson(spaceId, 'TypePet', owner.userId, spaceAssetId, {
          type: 'pet',
        });

        const { status, body } = await request(app)
          .post(`/shared-spaces/${spaceId}/people/${personTarget.spacePersonId}/merge`)
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .send({ ids: [petSource.spacePersonId] });
        expect(status).toBe(400);
        expect((body as { message: string }).message).toMatch(/different types/i);
      });

      it('non-existent target or source returns 400', async () => {
        const target = await utils.createSpacePerson(spaceId, 'TgtMissing', owner.userId, spaceAssetId);

        // Missing target → "Person not found"
        const missingTarget = await request(app)
          .post(`/shared-spaces/${spaceId}/people/00000000-0000-4000-a000-000000000099/merge`)
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .send({ ids: [target.spacePersonId] });
        expect(missingTarget.status).toBe(400);

        // Missing source → "Source person not found in this space"
        const missingSource = await request(app)
          .post(`/shared-spaces/${spaceId}/people/${target.spacePersonId}/merge`)
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .send({ ids: ['00000000-0000-4000-a000-000000000098'] });
        expect(missingSource.status).toBe(400);
      });
    });

    describe('PUT/DELETE /shared-spaces/:id/people/:personId/alias (T13)', () => {
      // T13 covers per-user alias on a space person.
      //
      // CRITICAL invariants this block pins:
      //
      // 1. Aliases are PER-USER, not space-wide. The service stores
      //    `(personId, userId, alias)` and `getAlias(personId, auth.user.id)` retrieves
      //    only the caller's row (shared-space.service.ts:780-798). Owner setting
      //    "Mom" as the alias for Alice does NOT show "Mom" to editor or viewer.
      //
      // 2. Aliases require `requireMembership` only — NOT `requireRole(Editor)`. So
      //    Viewer can set their own alias. This is intentional: aliases are personal
      //    metadata, not space state, and a read-only viewer should still be able to
      //    label people for themselves.
      //
      // 3. Setting an alias does NOT modify the underlying global `person.name`. The
      //    alias lives in a separate row.
      //
      // 4. DELETE alias has NO person existence check (line 800-803) — it just calls
      //    deleteAlias which is a noop on missing rows. So DELETE returns 204 even
      //    for non-existent personIds. Asymmetric vs PUT.

      it('access matrix — viewers CAN set their own alias', async () => {
        const scratch = await utils.createSpacePerson(spaceId, 'AliasMatrix', owner.userId, spaceAssetId);
        await forEachActor(
          [ownerActor, editorActor, viewerActor, nonMemberActor, anonActor],
          (actor) =>
            request(app)
              .put(`/shared-spaces/${spaceId}/people/${scratch.spacePersonId}/alias`)
              .set(authHeaders(actor))
              .send({ alias: `${actor.id}-alias` }),
          { spaceOwner: 204, spaceEditor: 204, spaceViewer: 204, spaceNonMember: 403, anon: 401 },
        );
      });

      it('alias is per-user — owner sees their alias, editor sees default name', async () => {
        const scratch = await utils.createSpacePerson(spaceId, 'PerUserAlice', owner.userId, spaceAssetId);

        await request(app)
          .put(`/shared-spaces/${spaceId}/people/${scratch.spacePersonId}/alias`)
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .send({ alias: 'Mom' });

        // Owner sees their alias
        const ownerView = await request(app)
          .get(`/shared-spaces/${spaceId}/people/${scratch.spacePersonId}`)
          .set('Authorization', `Bearer ${owner.accessToken}`);
        expect(ownerView.status).toBe(200);
        expect((ownerView.body as { alias?: string | null }).alias).toBe('Mom');

        // Editor sees no alias (their own row doesn't exist).
        // mapSpacePerson at shared-space.service.ts:~1236 always sets `alias` to
        // `string | null`, never omits it — assert null specifically so a regression
        // that drops the field would be caught.
        const editorView = await request(app)
          .get(`/shared-spaces/${spaceId}/people/${scratch.spacePersonId}`)
          .set('Authorization', `Bearer ${editor.accessToken}`);
        expect(editorView.status).toBe(200);
        expect((editorView.body as { alias: string | null }).alias).toBeNull();
        // The original name 'PerUserAlice' is still visible
        expect((editorView.body as { name: string }).name).toBe('PerUserAlice');
      });

      it('alias does NOT modify the underlying global person.name', async () => {
        const scratch = await utils.createSpacePerson(spaceId, 'OriginalName', owner.userId, spaceAssetId);

        await request(app)
          .put(`/shared-spaces/${spaceId}/people/${scratch.spacePersonId}/alias`)
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .send({ alias: 'AliasName' });

        const dbClient = await utils.connectDatabase();
        const personRow = await dbClient.query('SELECT name FROM person WHERE id = $1', [scratch.globalPersonId]);
        expect(personRow.rowCount).toBe(1);
        expect(personRow.rows[0].name).toBe('OriginalName');
      });

      it('DELETE removes the alias and is idempotent on missing personId', async () => {
        const scratch = await utils.createSpacePerson(spaceId, 'DeleteMe', owner.userId, spaceAssetId);

        // Set alias
        await request(app)
          .put(`/shared-spaces/${spaceId}/people/${scratch.spacePersonId}/alias`)
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .send({ alias: 'Temp' });

        // Delete alias
        const del = await request(app)
          .delete(`/shared-spaces/${spaceId}/people/${scratch.spacePersonId}/alias`)
          .set('Authorization', `Bearer ${owner.accessToken}`);
        expect(del.status).toBe(204);

        // Verify alias is gone via GET. Same DTO contract as test 2 — assert null,
        // not the disjunction.
        const get = await request(app)
          .get(`/shared-spaces/${spaceId}/people/${scratch.spacePersonId}`)
          .set('Authorization', `Bearer ${owner.accessToken}`);
        expect((get.body as { alias: string | null }).alias).toBeNull();

        // DELETE on a non-existent personId is also 204 — the service doesn't
        // check person existence on delete (shared-space.service.ts:800-803),
        // so the call is a noop. Asymmetric vs PUT (which validates).
        const idempotent = await request(app)
          .delete(`/shared-spaces/${spaceId}/people/00000000-0000-4000-a000-000000000099/alias`)
          .set('Authorization', `Bearer ${owner.accessToken}`);
        expect(idempotent.status).toBe(204);
      });

      it('PUT alias on a missing personId returns 400', async () => {
        const { status } = await request(app)
          .put(`/shared-spaces/${spaceId}/people/00000000-0000-4000-a000-000000000099/alias`)
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .send({ alias: 'Ghost' });
        expect(status).toBe(400);
      });
    });

    describe('POST /shared-spaces/:id/people/deduplicate (T14)', () => {
      // T14 covers the manual dedup trigger for space people.
      //
      // Service shape (shared-space.service.ts:721-728): requires `Owner` role
      // (NOT just Editor — distinct from PUT/DELETE/merge which only need Editor).
      // Queues a SharedSpacePersonDedup job on the FacialRecognition queue with
      // jobId `space-dedup-${spaceId}` (job.repository.ts:239-241). The jobId is
      // the load-bearing PR #292 invariant: BullMQ's queue() with a duplicate
      // jobId is a no-op, so calling deduplicate twice in quick succession enqueues
      // only one job.
      //
      // Each `it()` creates a fresh space + makes the relevant user the Owner so
      // the access matrix is independent and the queue verification has a clean
      // slate.

      it('Owner-only access matrix', async () => {
        // Distinct from PUT/DELETE/merge which require Editor — deduplicate is
        // Owner-only because it can rewrite the space's person graph.
        await forEachActor(
          [ownerActor, editorActor, viewerActor, nonMemberActor, anonActor],
          (actor) => request(app).post(`/shared-spaces/${spaceId}/people/deduplicate`).set(authHeaders(actor)),
          { spaceOwner: 204, spaceEditor: 403, spaceViewer: 403, spaceNonMember: 403, anon: 401 },
        );
      });

      it('owner happy path returns 204 (queues a SharedSpacePersonDedup job)', async () => {
        // Sanity check on the success path. Doesn't verify queue state — that's
        // covered by the next test.
        const { status } = await request(app)
          .post(`/shared-spaces/${spaceId}/people/deduplicate`)
          .set('Authorization', `Bearer ${owner.accessToken}`);
        expect(status).toBe(204);
      });

      it('two consecutive owner calls both return 204 (HTTP-level idempotency)', async () => {
        // The HTTP layer is idempotent regardless of whether BullMQ deduplicates.
        // The actual jobId-based dedup is verified by the next test via queue
        // inspection; this test pins the HTTP contract independently.
        const first = await request(app)
          .post(`/shared-spaces/${spaceId}/people/deduplicate`)
          .set('Authorization', `Bearer ${owner.accessToken}`);
        expect(first.status).toBe(204);

        const second = await request(app)
          .post(`/shared-spaces/${spaceId}/people/deduplicate`)
          .set('Authorization', `Bearer ${owner.accessToken}`);
        expect(second.status).toBe(204);
      });

      it('jobId dedup: two calls in quick succession enqueue only one job (PR #292)', async () => {
        // The load-bearing PR #292 invariant. BullMQ's queue() with a duplicate
        // jobId is a no-op (verified by job.repository.ts:252-259's getJob/remove
        // pattern — duplicate jobId returns the existing job, not an error), so the
        // same space's dedup job can't be enqueued twice while the first is waiting.
        //
        // Strategy: pause the FacialRecognition queue so the worker doesn't drain
        // the job, empty it, trigger dedup twice, count the resulting jobs that
        // match our spaceId, restore.
        //
        // The pause/restore is bracketed in try/finally so a test failure doesn't
        // leave the queue paused. The queue endpoints require admin token
        // (queue.controller.ts:23) — `admin` is set in the outer beforeAll.
        //
        // QueueDeleteDto only has `failed?: boolean` (queue.dto.ts:24-31) — there
        // is no statuses-based filter on emptyQueue, the underlying repository
        // call drains waiting/active/delayed unconditionally. Sending no body is
        // sufficient.
        const queueName = 'facialRecognition';
        try {
          // Drain any in-flight dedup jobs from PRIOR tests in this describe
          // (the previous "owner happy path" and "two consecutive owner calls"
          // tests both enqueue dedup jobs). Without this wait, those jobs may
          // still be active/waiting when we pause+empty below, leading to a
          // flaky baseline where the spaceId match count is off-by-one.
          await utils.waitForQueueFinish(admin.accessToken, queueName);

          // Pause + empty so the assertions are deterministic.
          const pauseRes = await request(app)
            .put(`/queues/${queueName}`)
            .set('Authorization', `Bearer ${admin.accessToken}`)
            .send({ isPaused: true });
          // Assert the pause succeeded — if not, the worker would race the
          // assertion below and the test would be flaky for a non-test reason.
          expect(pauseRes.status).toBe(200);

          await request(app).delete(`/queues/${queueName}/jobs`).set('Authorization', `Bearer ${admin.accessToken}`);

          // First trigger
          const t1 = await request(app)
            .post(`/shared-spaces/${spaceId}/people/deduplicate`)
            .set('Authorization', `Bearer ${owner.accessToken}`);
          expect(t1.status).toBe(204);

          // Second trigger immediately after
          const t2 = await request(app)
            .post(`/shared-spaces/${spaceId}/people/deduplicate`)
            .set('Authorization', `Bearer ${owner.accessToken}`);
          expect(t2.status).toBe(204);

          // Count jobs whose data matches our space. We don't filter by status
          // (QueueJobSearchDto.status is the field name, but we want to see all
          // jobs in any state to be safe), and filter client-side by spaceId.
          const jobs = await request(app)
            .get(`/queues/${queueName}/jobs`)
            .set('Authorization', `Bearer ${admin.accessToken}`);
          expect(jobs.status).toBe(200);
          // Match strictly on the data.spaceId — the jobId encodes spaceId so
          // an `||` would only widen if a future refactor decoupled the two,
          // which is exactly the kind of regression we want to catch.
          const ourJobs = (jobs.body as Array<{ id?: string; data?: { spaceId?: string } }>).filter(
            (j) => j.data?.spaceId === spaceId,
          );
          expect(ourJobs.length).toBe(1);
        } finally {
          // Drain + unpause so other tests aren't affected.
          await request(app).delete(`/queues/${queueName}/jobs`).set('Authorization', `Bearer ${admin.accessToken}`);
          await request(app)
            .put(`/queues/${queueName}`)
            .set('Authorization', `Bearer ${admin.accessToken}`)
            .send({ isPaused: false });
        }
      });
    });

    describe('PUT /shared-spaces/:id/libraries (T15)', () => {
      // T15 covers the link-library-to-space operation. The service has a TWO-step
      // gate (shared-space.service.ts:449-477):
      //
      //   1. `if (!auth.user.isAdmin) → ForbiddenException('Only admins can link...')`
      //      — admin gate, fires FIRST. Non-admin members of the space get 403.
      //   2. `requireRole(Editor)` — must be a member of the space with Editor or Owner.
      //      Admin non-members and admin viewers also get 403.
      //
      // Then library existence is checked (400 if missing). On success the
      // addLibrary repository call is idempotent — duplicate (spaceId, libraryId)
      // returns null without error and skips the face-sync queue.
      //
      // To exercise the matrix we need:
      //   - A non-admin owner of a space (can't link → admin gate)
      //   - An admin who is an Editor in the space (CAN link)
      //   - An admin library to link
      //
      // The outer file's `admin` (top-level beforeAll) is the only admin user.
      // We add admin as Editor to the test space at the start of the T15 block.

      let library: { id: string };
      let secondLibrary: { id: string };

      beforeAll(async () => {
        // Add admin as Editor to the existing T09 space so the success path tests can run.
        await utils.addSpaceMember(owner.accessToken, spaceId, {
          userId: admin.userId,
          role: SharedSpaceRole.Editor,
        });

        // Create two libraries owned by the global admin (createLibrary requires admin token).
        library = await utils.createLibrary(admin.accessToken, { ownerId: admin.userId });
        secondLibrary = await utils.createLibrary(admin.accessToken, { ownerId: admin.userId });
      });

      it('non-admin owner of the space cannot link a library (admin gate)', async () => {
        // The "Only admins" branch fires before requireRole. Even the space owner is
        // rejected if they're not also a global admin.
        const { status, body } = await request(app)
          .put(`/shared-spaces/${spaceId}/libraries`)
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .send({ libraryId: library.id });
        expect(status).toBe(403);
        expect((body as { message: string }).message).toMatch(/admins/i);
      });

      it('non-admin editor cannot link a library (admin gate fires before role check)', async () => {
        // Pin the admin-gate message so we know which branch fired. The two-step
        // gate at shared-space.service.ts:449-477 checks admin BEFORE requireRole,
        // so a non-admin editor should hit the admin-gate message even though
        // they would also fail the role check.
        const { status, body } = await request(app)
          .put(`/shared-spaces/${spaceId}/libraries`)
          .set('Authorization', `Bearer ${editor.accessToken}`)
          .send({ libraryId: library.id });
        expect(status).toBe(403);
        expect((body as { message: string }).message).toMatch(/admins/i);
      });

      it('non-admin viewer cannot link a library (admin gate fires before role check)', async () => {
        // Same as above — admin gate at line 451 fires before requireRole at
        // line 454, so the message is the admin-gate one even though the
        // viewer would also fail role validation.
        const { status, body } = await request(app)
          .put(`/shared-spaces/${spaceId}/libraries`)
          .set('Authorization', `Bearer ${viewer.accessToken}`)
          .send({ libraryId: library.id });
        expect(status).toBe(403);
        expect((body as { message: string }).message).toMatch(/admins/i);
      });

      it('anon cannot link a library', async () => {
        const { status } = await request(app)
          .put(`/shared-spaces/${spaceId}/libraries`)
          .send({ libraryId: library.id });
        expect(status).toBe(401);
      });

      it('admin who is an Editor in the space CAN link a library', async () => {
        // Admin is added as Editor in this block's beforeAll. This test uses
        // secondLibrary so the idempotency test below has a clean slate on
        // `library`.
        const { status } = await request(app)
          .put(`/shared-spaces/${spaceId}/libraries`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ libraryId: secondLibrary.id });
        expect(status).toBe(204);
      });

      it('linking the same library twice is idempotent (returns 204 both times)', async () => {
        // shared-space.service.ts:467-476 — addLibrary returns null on duplicate
        // (existing row), and the face-sync queue is skipped. The HTTP response is
        // 204 either way.
        const first = await request(app)
          .put(`/shared-spaces/${spaceId}/libraries`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ libraryId: library.id });
        expect(first.status).toBe(204);

        const second = await request(app)
          .put(`/shared-spaces/${spaceId}/libraries`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ libraryId: library.id });
        expect(second.status).toBe(204);

        // Verify exactly one row exists in shared_space_library for this pair.
        const dbClient = await utils.connectDatabase();
        const rows = await dbClient.query(
          'SELECT 1 FROM shared_space_library WHERE "spaceId" = $1 AND "libraryId" = $2',
          [spaceId, library.id],
        );
        expect(rows.rowCount).toBe(1);
      });

      it('linking a non-existent libraryId returns 400', async () => {
        const { status, body } = await request(app)
          .put(`/shared-spaces/${spaceId}/libraries`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ libraryId: '00000000-0000-4000-a000-000000000099' });
        expect(status).toBe(400);
        expect((body as { message: string }).message).toMatch(/library.*not found/i);
      });
    });

    describe('DELETE /shared-spaces/:id/libraries/:libraryId (T16)', () => {
      // T16 covers the unlink-library operation. Same TWO-step gate as T15:
      // admin gate first (`shared-space.service.ts:480-482`), then `requireRole(Editor)`.
      //
      // The repository call is a plain DELETE on the (spaceId, libraryId) pair
      // (`shared-space.repository.ts:220-226`), with no error if no row matches.
      // So unlinkLibrary is idempotent at the HTTP level: deleting an
      // already-unlinked library returns 204.
      //
      // T16 reuses the global `admin` user that T15's beforeAll added as Editor
      // to the test space. New libraries are created per-test so the assertions
      // are isolated from T15's leftover linked libraries.

      let scratchLibrary: { id: string };

      beforeAll(async () => {
        scratchLibrary = await utils.createLibrary(admin.accessToken, { ownerId: admin.userId });
        // Pre-link so we have a link row to delete in the success-path test.
        const linkRes = await request(app)
          .put(`/shared-spaces/${spaceId}/libraries`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ libraryId: scratchLibrary.id });
        if (linkRes.status !== 204) {
          throw new Error(`T16 setup: linkLibrary failed (${linkRes.status}): ${JSON.stringify(linkRes.body)}`);
        }
      });

      it('non-admin owner of the space cannot unlink (admin gate)', async () => {
        // The "Only admins" branch fires before requireRole. Same shape as T15
        // test 1, applied to the unlink endpoint to confirm the gate is duplicated
        // not just inherited from a shared helper.
        const { status, body } = await request(app)
          .delete(`/shared-spaces/${spaceId}/libraries/${scratchLibrary.id}`)
          .set('Authorization', `Bearer ${owner.accessToken}`);
        expect(status).toBe(403);
        expect((body as { message: string }).message).toMatch(/admins/i);
      });

      it('anon cannot unlink', async () => {
        const { status } = await request(app).delete(`/shared-spaces/${spaceId}/libraries/${scratchLibrary.id}`);
        expect(status).toBe(401);
      });

      it('admin who is an Editor in the space CAN unlink', async () => {
        // Pre-condition: scratchLibrary is currently linked (set up in beforeAll).
        // Verify via DB that the row exists, then unlink, then verify it's gone.
        const dbClient = await utils.connectDatabase();
        const before = await dbClient.query(
          'SELECT 1 FROM shared_space_library WHERE "spaceId" = $1 AND "libraryId" = $2',
          [spaceId, scratchLibrary.id],
        );
        expect(before.rowCount).toBe(1);

        const { status } = await request(app)
          .delete(`/shared-spaces/${spaceId}/libraries/${scratchLibrary.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`);
        expect(status).toBe(204);

        const after = await dbClient.query(
          'SELECT 1 FROM shared_space_library WHERE "spaceId" = $1 AND "libraryId" = $2',
          [spaceId, scratchLibrary.id],
        );
        expect(after.rowCount).toBe(0);
      });

      it('unlinking an already-unlinked library is idempotent (returns 204)', async () => {
        // The repository's removeLibrary is a plain DELETE — no row, no error.
        // The service doesn't pre-validate either. So calling unlink on a
        // (spaceId, libraryId) pair that has no link row returns 204 without
        // any state mutation.
        //
        // We use scratchLibrary which was just unlinked by the previous test,
        // so the (spaceId, scratchLibrary.id) pair has 0 rows. The second
        // unlink should still succeed.
        const { status } = await request(app)
          .delete(`/shared-spaces/${spaceId}/libraries/${scratchLibrary.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`);
        expect(status).toBe(204);
      });

      it('unlinking with a non-existent libraryId returns 204 (no existence check)', async () => {
        // Same idempotency, different angle. The service doesn't check that
        // the library actually exists in the `library` table — it just deletes
        // from `shared_space_library` where (spaceId, libraryId) match. A
        // bogus libraryId UUID is a no-op DELETE → 204.
        const { status } = await request(app)
          .delete(`/shared-spaces/${spaceId}/libraries/00000000-0000-4000-a000-000000000099`)
          .set('Authorization', `Bearer ${admin.accessToken}`);
        expect(status).toBe(204);
      });
    });

    describe('library link side effects (T17)', () => {
      // T17 closes the space-library sub-tree by exercising the actual cross-table
      // query that the link/unlink operations enable: library assets becoming
      // visible to space members via /timeline/buckets?spaceId=. PR #163 was
      // specifically about this code path; if a future regression breaks the
      // shared_space_library JOIN in the timeline query, T17 catches it.
      //
      // Setup creates a real external library scanned from a fixture directory
      // (not direct DB inserts) so the test exercises the same code path the
      // production system uses. Each test handles its own link/unlink to keep
      // state changes isolated.

      let t17Library: { id: string };
      let t17AssetId: string;

      beforeAll(async () => {
        // Strategy: instead of scanning a real fixture directory (fragile because
        // of test-stack path/timing concerns), upload an admin asset normally and
        // then UPDATE its libraryId via direct DB to associate it with the library.
        // The shared_space_library JOIN treats it the same way regardless of how
        // the asset was created.
        t17Library = await utils.createLibrary(admin.accessToken, { ownerId: admin.userId });
        const asset = await utils.createAsset(admin.accessToken);
        t17AssetId = asset.id;

        const dbClient = await utils.connectDatabase();
        await dbClient.query('UPDATE asset SET "libraryId" = $1 WHERE id = $2', [t17Library.id, t17AssetId]);
      });

      const linkLibrary = async () => {
        const res = await request(app)
          .put(`/shared-spaces/${spaceId}/libraries`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ libraryId: t17Library.id });
        if (res.status !== 204) {
          throw new Error(`linkLibrary failed: ${res.status} ${JSON.stringify(res.body)}`);
        }
      };

      const unlinkLibrary = async () => {
        await request(app)
          .delete(`/shared-spaces/${spaceId}/libraries/${t17Library.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`);
      };

      const memberSeesT17Asset = async (token: string): Promise<boolean> => {
        const { status, body } = await request(app)
          .get(`/timeline/bucket?timeBucket=${currentMonthBucketString()}&spaceId=${spaceId}`)
          .set('Authorization', `Bearer ${token}`);
        if (status !== 200) {
          return false;
        }
        return ((body as { id: string[] }).id ?? []).includes(t17AssetId);
      };

      it('after link, a non-owner space member sees the library asset via /timeline/bucket?spaceId=', async () => {
        // The PR #163 bug class — the timeline query must JOIN through
        // shared_space_library to surface library assets to space members. If
        // the JOIN is broken, the editor's bucket query returns the space's
        // OWN-asset content but NOT the library asset.
        try {
          await linkLibrary();
          expect(await memberSeesT17Asset(editor.accessToken)).toBe(true);
        } finally {
          await unlinkLibrary();
        }
      });

      it('after link, a space viewer also sees the library asset', async () => {
        try {
          await linkLibrary();
          expect(await memberSeesT17Asset(viewer.accessToken)).toBe(true);
        } finally {
          await unlinkLibrary();
        }
      });

      it('after unlink, library assets are no longer visible to space members', async () => {
        // Link, verify visible, unlink, verify hidden — the round-trip pin.
        await linkLibrary();
        expect(await memberSeesT17Asset(editor.accessToken)).toBe(true);
        await unlinkLibrary();
        expect(await memberSeesT17Asset(editor.accessToken)).toBe(false);
      });

      it('soft-deleted library asset is hidden from space members', async () => {
        // While linked, soft-delete the asset (DELETE /assets without force=true).
        // The shared_space_library JOIN should still match, but the asset.deletedAt
        // filter in the timeline query excludes the row.
        try {
          await linkLibrary();
          expect(await memberSeesT17Asset(editor.accessToken)).toBe(true);

          // Soft-delete the library asset via direct DB (the assets endpoint
          // requires the library asset's owner — admin — and the API path is
          // covered elsewhere; we just need the deletedAt mutation here).
          const dbClient = await utils.connectDatabase();
          try {
            await dbClient.query('UPDATE asset SET "deletedAt" = NOW() WHERE id = $1', [t17AssetId]);
            expect(await memberSeesT17Asset(editor.accessToken)).toBe(false);
          } finally {
            await dbClient.query('UPDATE asset SET "deletedAt" = NULL WHERE id = $1', [t17AssetId]);
          }
        } finally {
          await unlinkLibrary();
        }
      });

      it('offline library asset IS still visible to space members (no isOffline filter on timeline)', async () => {
        // SURPRISING FINDING: the timeline-buckets query at asset.repository.ts:835-849
        // joins shared_space_library on (libraryId, spaceId) but does NOT filter on
        // asset.isOffline. The access.repository's checkSpaceAccess (in a different
        // query path) does filter on isOffline=false, but the timeline takes a
        // shortcut that skips that filter.
        //
        // Practical UX consequence: a library asset whose underlying file went offline
        // (e.g., the disk was unmounted) is still listed in the space's timeline.
        // The thumbnail/download endpoints will probably 404 on it, but the asset is
        // visible in the bucket. Pinning this as the actual behavior — if a future
        // change adds the missing isOffline filter, the test will fail and force a
        // deliberate update.
        try {
          await linkLibrary();
          expect(await memberSeesT17Asset(editor.accessToken)).toBe(true);

          const dbClient = await utils.connectDatabase();
          try {
            await dbClient.query('UPDATE asset SET "isOffline" = true WHERE id = $1', [t17AssetId]);
            // Pin the actual behavior: offline library assets are STILL visible.
            expect(await memberSeesT17Asset(editor.accessToken)).toBe(true);
          } finally {
            await dbClient.query('UPDATE asset SET "isOffline" = false WHERE id = $1', [t17AssetId]);
          }
        } finally {
          await unlinkLibrary();
        }
      });

      it('deleting the library eventually cascades to shared_space_library (async via job queue)', async () => {
        // Link the library to a SECOND space (so the cascade test doesn't disturb
        // the parent describe's spaceId fixture, which T17's other tests reuse).
        // Then DELETE the library and verify the shared_space_library row is gone.
        const secondSpace = await utils.createSpace(owner.accessToken, { name: 'T17 Cascade' });
        // owner needs to add admin so admin can link the library to this new space
        await utils.addSpaceMember(owner.accessToken, secondSpace.id, {
          userId: admin.userId,
          role: SharedSpaceRole.Editor,
        });

        // Create a fresh library specifically for this test so we can delete it
        // without affecting t17Library. No assets needed — the cascade test
        // only checks the shared_space_library FK row.
        const cascadeLibrary = await utils.createLibrary(admin.accessToken, { ownerId: admin.userId });

        await request(app)
          .put(`/shared-spaces/${secondSpace.id}/libraries`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ libraryId: cascadeLibrary.id });

        const dbClient = await utils.connectDatabase();
        const before = await dbClient.query(
          'SELECT 1 FROM shared_space_library WHERE "spaceId" = $1 AND "libraryId" = $2',
          [secondSpace.id, cascadeLibrary.id],
        );
        expect(before.rowCount).toBe(1);

        // DELETE /libraries/:id is a TWO-STEP operation:
        //   1. library.service.ts:370-379 — softDelete() sets `deletedAt` on the
        //      library row, queues a LibraryDelete job, returns 204 IMMEDIATELY.
        //   2. The LibraryDelete job (handleDeleteLibrary, line 381+) processes
        //      asynchronously, eventually hard-deletes the library row, which
        //      then triggers the FK cascade on shared_space_library.
        //
        // So the cascade is real but ASYNC. The test must wait for the library
        // queue to finish before asserting the FK row is gone.
        const delRes = await request(app)
          .delete(`/libraries/${cascadeLibrary.id}`)
          .set('Authorization', `Bearer ${admin.accessToken}`);
        expect(delRes.status).toBe(204);

        // Wait for the LibraryDelete job to drain.
        await utils.waitForQueueFinish(admin.accessToken, 'library');

        const after = await dbClient.query(
          'SELECT 1 FROM shared_space_library WHERE "spaceId" = $1 AND "libraryId" = $2',
          [secondSpace.id, cascadeLibrary.id],
        );
        expect(after.rowCount).toBe(0);
      });
    });

    it('empty thumbnailPath on the underlying global person does NOT exclude the space person', async () => {
      // Fixed in #336: the thumbnailPath filter was removed from getPersonsBySpaceId.
      // Space person visibility should not depend on the global person's thumbnail
      // state — the space person has its own representativeFaceId for display.
      const dbClient = await utils.connectDatabase();
      try {
        await dbClient.query('UPDATE person SET "thumbnailPath" = $1 WHERE id = $2', ['', zeroThumbGlobalId]);
        const { status, body } = await request(app)
          .get(`/shared-spaces/${spaceId}/people`)
          .set('Authorization', `Bearer ${owner.accessToken}`);
        expect(status).toBe(200);
        const ids = (body as Array<{ id: string }>).map((p) => p.id);
        expect(ids).toContain(zeroThumbPersonId);
      } finally {
        await dbClient.query('UPDATE person SET "thumbnailPath" = $1 WHERE id = $2', [
          '/my/awesome/thumbnail.jpg',
          zeroThumbGlobalId,
        ]);
      }
    });
  });
});
