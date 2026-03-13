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
  let user1Asset1: AssetMediaResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();

    admin = await utils.adminSetup();

    [user1, user2] = await Promise.all([
      utils.userSetup(admin.accessToken, createUserDto.user1),
      utils.userSetup(admin.accessToken, createUserDto.user2),
    ]);

    user1Asset1 = await utils.createAsset(user1.accessToken);
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

    it('should add assets to a space', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Asset Space' });

      const { status } = await request(app)
        .post(`/shared-spaces/${space.id}/assets`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ assetIds: [user1Asset1.id] });

      expect(status).toBe(204);
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
  });

  describe('DELETE /shared-spaces/:id/members/:userId', () => {
    it('should require authentication', async () => {
      const space = await utils.createSpace(user1.accessToken, { name: 'Remove Member Auth' });
      await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

      const { status, body } = await request(app).delete(`/shared-spaces/${space.id}/members/${user2.userId}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should remove a member from a space', async () => {
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
  });
});
