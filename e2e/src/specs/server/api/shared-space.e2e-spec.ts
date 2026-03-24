import { AssetMediaResponseDto, LoginResponseDto, SharedSpaceRole } from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

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
});
