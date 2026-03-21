import { LoginResponseDto, UserAvatarColor } from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/user-groups', () => {
  let admin: LoginResponseDto;
  let user1: LoginResponseDto;
  let user2: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();

    admin = await utils.adminSetup();

    [user1, user2] = await Promise.all([
      utils.userSetup(admin.accessToken, createUserDto.user1),
      utils.userSetup(admin.accessToken, createUserDto.user2),
    ]);
  });

  describe('POST /user-groups', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/user-groups').send({ name: 'Test Group' });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should create a group with name', async () => {
      const { status, body } = await request(app)
        .post('/user-groups')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: 'Family A' });

      expect(status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: 'Family A',
          origin: 'manual',
          members: [],
        }),
      );
    });

    it('should create a group with name and color', async () => {
      const { status, body } = await request(app)
        .post('/user-groups')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: 'Friends', color: UserAvatarColor.Blue });

      expect(status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          name: 'Friends',
          color: UserAvatarColor.Blue,
        }),
      );
    });

    it('should reject empty name', async () => {
      const { status } = await request(app)
        .post('/user-groups')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: '' });

      expect(status).toBe(400);
    });
  });

  describe('GET /user-groups', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/user-groups');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should list only groups owned by the current user', async () => {
      const { body: user1Groups } = await request(app)
        .get('/user-groups')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      const { body: user2Groups } = await request(app)
        .get('/user-groups')
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(user1Groups.length).toBeGreaterThanOrEqual(2);
      expect(user2Groups).toEqual([]);
    });
  });

  describe('GET /user-groups/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/user-groups/fd69a48e-5579-4bfc-b1ca-dc5e4e74c724');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should get a group with members', async () => {
      const { body: group } = await request(app)
        .post('/user-groups')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: 'Get Test' });

      await request(app)
        .put(`/user-groups/${group.id}/members`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ userIds: [user2.userId] });

      const { status, body } = await request(app)
        .get(`/user-groups/${group.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
      expect(body.name).toBe('Get Test');
      expect(body.members).toHaveLength(1);
      expect(body.members[0].userId).toBe(user2.userId);
    });

    it('should return 404 for non-existent group', async () => {
      const { status } = await request(app)
        .get('/user-groups/fd69a48e-5579-4bfc-b1ca-dc5e4e74c724')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(404);
    });

    it('should return 403 for non-owner', async () => {
      const { body: group } = await request(app)
        .post('/user-groups')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: 'Ownership Test' });

      const { status } = await request(app)
        .get(`/user-groups/${group.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(403);
    });
  });

  describe('PATCH /user-groups/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .patch('/user-groups/fd69a48e-5579-4bfc-b1ca-dc5e4e74c724')
        .send({ name: 'Updated' });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should update group name', async () => {
      const { body: group } = await request(app)
        .post('/user-groups')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: 'Before Update' });

      const { status, body } = await request(app)
        .patch(`/user-groups/${group.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: 'After Update' });

      expect(status).toBe(200);
      expect(body.name).toBe('After Update');
    });

    it('should update group color', async () => {
      const { body: group } = await request(app)
        .post('/user-groups')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: 'Color Test' });

      const { status, body } = await request(app)
        .patch(`/user-groups/${group.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ color: UserAvatarColor.Red });

      expect(status).toBe(200);
      expect(body.color).toBe(UserAvatarColor.Red);
    });

    it('should return 403 for non-owner', async () => {
      const { body: group } = await request(app)
        .post('/user-groups')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: 'No Touch' });

      const { status } = await request(app)
        .patch(`/user-groups/${group.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ name: 'Hacked' });

      expect(status).toBe(403);
    });
  });

  describe('DELETE /user-groups/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).delete('/user-groups/fd69a48e-5579-4bfc-b1ca-dc5e4e74c724');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should delete a group', async () => {
      const { body: group } = await request(app)
        .post('/user-groups')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: 'To Delete' });

      const { status } = await request(app)
        .delete(`/user-groups/${group.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(204);

      const { status: getStatus } = await request(app)
        .get(`/user-groups/${group.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(getStatus).toBe(404);
    });

    it('should return 403 for non-owner', async () => {
      const { body: group } = await request(app)
        .post('/user-groups')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: 'Protected' });

      const { status } = await request(app)
        .delete(`/user-groups/${group.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(status).toBe(403);
    });
  });

  describe('PUT /user-groups/:id/members', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .put('/user-groups/fd69a48e-5579-4bfc-b1ca-dc5e4e74c724/members')
        .send({ userIds: [] });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should set members', async () => {
      const { body: group } = await request(app)
        .post('/user-groups')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: 'Members Test' });

      const { status, body } = await request(app)
        .put(`/user-groups/${group.id}/members`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ userIds: [user2.userId] });

      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].userId).toBe(user2.userId);
    });

    it('should replace members on subsequent call', async () => {
      const { body: group } = await request(app)
        .post('/user-groups')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: 'Replace Test' });

      await request(app)
        .put(`/user-groups/${group.id}/members`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ userIds: [user2.userId] });

      const { status, body } = await request(app)
        .put(`/user-groups/${group.id}/members`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ userIds: [admin.userId] });

      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].userId).toBe(admin.userId);
    });

    it('should allow setting empty member list', async () => {
      const { body: group } = await request(app)
        .post('/user-groups')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: 'Empty Test' });

      await request(app)
        .put(`/user-groups/${group.id}/members`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ userIds: [user2.userId] });

      const { status, body } = await request(app)
        .put(`/user-groups/${group.id}/members`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ userIds: [] });

      expect(status).toBe(200);
      expect(body).toEqual([]);
    });

    it('should return 403 for non-owner', async () => {
      const { body: group } = await request(app)
        .post('/user-groups')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: 'No Members' });

      const { status } = await request(app)
        .put(`/user-groups/${group.id}/members`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ userIds: [user2.userId] });

      expect(status).toBe(403);
    });
  });
});
