import {
  LoginResponseDto,
  deleteUserAdmin,
  getMyUser,
  getUserAdmin,
  getUserPreferencesAdmin,
  login,
} from '@immich/sdk';
import { Socket } from 'socket.io-client';
import { createUserDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('/admin/users', () => {
  let websocket: Socket;

  let admin: LoginResponseDto;
  let nonAdmin: LoginResponseDto;
  let deletedUser: LoginResponseDto;
  let userToDelete: LoginResponseDto;
  let userToHardDelete: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });

    [websocket, nonAdmin, deletedUser, userToDelete, userToHardDelete] = await Promise.all([
      utils.connectWebsocket(admin.accessToken),
      utils.userSetup(admin.accessToken, createUserDto.user1),
      utils.userSetup(admin.accessToken, createUserDto.user2),
      utils.userSetup(admin.accessToken, createUserDto.user3),
      utils.userSetup(admin.accessToken, createUserDto.user4),
    ]);

    await deleteUserAdmin(
      { id: deletedUser.userId, userAdminDeleteDto: {} },
      { headers: asBearerAuth(admin.accessToken) },
    );
  });

  afterAll(() => {
    utils.disconnectWebsocket(websocket);
  });

  describe('GET /admin/users', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/admin/users`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require authorization', async () => {
      const { status, body } = await request(app)
        .get(`/admin/users`)
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

    it('should hide deleted users by default', async () => {
      const { status, body } = await request(app)
        .get(`/admin/users`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(4);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: admin.userEmail }),
          expect.objectContaining({ email: nonAdmin.userEmail }),
          expect.objectContaining({ email: userToDelete.userEmail }),
          expect.objectContaining({ email: userToHardDelete.userEmail }),
        ]),
      );
    });

    it('should include deleted users', async () => {
      const { status, body } = await request(app)
        .get(`/admin/users?withDeleted=true`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toHaveLength(5);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: admin.userEmail }),
          expect.objectContaining({ email: nonAdmin.userEmail }),
          expect.objectContaining({ email: userToDelete.userEmail }),
          expect.objectContaining({ email: userToHardDelete.userEmail }),
          expect.objectContaining({ email: deletedUser.userEmail }),
        ]),
      );
    });
  });

  describe('POST /admin/users', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/admin/users`).send(createUserDto.user1);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require authorization', async () => {
      const { status, body } = await request(app)
        .post(`/admin/users`)
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`)
        .send(createUserDto.user1);
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

    for (const key of ['password', 'email', 'name', 'quotaSizeInBytes', 'shouldChangePassword', 'notify']) {
      it(`should not allow null ${key}`, async () => {
        const { status, body } = await request(app)
          .post(`/admin/users`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ ...createUserDto.user1, [key]: null });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest());
      });
    }

    it('should ignore `isAdmin`', async () => {
      const { status, body } = await request(app)
        .post(`/admin/users`)
        .send({
          isAdmin: true,
          email: 'user5@immich.cloud',
          password: 'password123',
          name: 'Immich',
        })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toMatchObject({
        email: 'user5@immich.cloud',
        isAdmin: false,
        shouldChangePassword: true,
      });
      expect(status).toBe(201);
    });
  });

  describe('PUT /admin/users/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/admin/users/${uuidDto.notFound}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require authorization', async () => {
      const { status, body } = await request(app)
        .put(`/admin/users/${uuidDto.notFound}`)
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

    for (const key of ['password', 'email', 'name', 'shouldChangePassword']) {
      it(`should not allow null ${key}`, async () => {
        const { status, body } = await request(app)
          .put(`/admin/users/${uuidDto.notFound}`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ [key]: null });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest());
      });
    }

    it('should not allow a non-admin to become an admin', async () => {
      const { status, body } = await request(app)
        .put(`/admin/users/${nonAdmin.userId}`)
        .send({ isAdmin: true })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({ isAdmin: false });
    });

    it('ignores updates to profileImagePath', async () => {
      const { status, body } = await request(app)
        .put(`/admin/users/${admin.userId}`)
        .send({ profileImagePath: 'invalid.jpg' })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({ id: admin.userId, profileImagePath: '' });
    });

    it('should update first and last name', async () => {
      const before = await getUserAdmin({ id: admin.userId }, { headers: asBearerAuth(admin.accessToken) });

      const { status, body } = await request(app)
        .put(`/admin/users/${admin.userId}`)
        .send({ name: 'Name' })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({
        ...before,
        updatedAt: expect.any(String),
        name: 'Name',
      });
      expect(before.updatedAt).not.toEqual(body.updatedAt);
    });

    it('should update password', async () => {
      const { status, body } = await request(app)
        .put(`/admin/users/${nonAdmin.userId}`)
        .send({ password: 'super-secret' })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({ email: nonAdmin.userEmail });

      const token = await login({ loginCredentialDto: { email: nonAdmin.userEmail, password: 'super-secret' } });
      expect(token.accessToken).toBeDefined();

      const user = await getMyUser({ headers: asBearerAuth(token.accessToken) });
      expect(user).toMatchObject({ email: nonAdmin.userEmail });
    });
  });

  describe('PUT /admin/users/:id/preferences', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/admin/users/${userToDelete.userId}/preferences`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should update memories enabled', async () => {
      const before = await getUserPreferencesAdmin({ id: admin.userId }, { headers: asBearerAuth(admin.accessToken) });
      expect(before).toMatchObject({ memories: { enabled: true } });

      const { status, body } = await request(app)
        .put(`/admin/users/${admin.userId}/preferences`)
        .send({ memories: { enabled: false } })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({ memories: { enabled: false } });

      const after = await getUserPreferencesAdmin({ id: admin.userId }, { headers: asBearerAuth(admin.accessToken) });
      expect(after).toMatchObject({ memories: { enabled: false } });
    });

    it('should update the avatar color', async () => {
      const { status, body } = await request(app)
        .put(`/admin/users/${admin.userId}/preferences`)
        .send({ avatar: { color: 'orange' } })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({ avatar: { color: 'orange' }, memories: { enabled: false } });

      const after = await getUserPreferencesAdmin({ id: admin.userId }, { headers: asBearerAuth(admin.accessToken) });
      expect(after).toEqual({ avatar: { color: 'orange' }, memories: { enabled: false } });
    });
  });

  describe('DELETE /admin/users/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).delete(`/admin/users/${userToDelete.userId}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require authorization', async () => {
      const { status, body } = await request(app)
        .delete(`/admin/users/${userToDelete.userId}`)
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

    it('should delete user', async () => {
      const { status, body } = await request(app)
        .delete(`/admin/users/${userToDelete.userId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({
        id: userToDelete.userId,
        updatedAt: expect.any(String),
        deletedAt: expect.any(String),
      });
    });

    it('should hard delete a user', async () => {
      const { status, body } = await request(app)
        .delete(`/admin/users/${userToHardDelete.userId}`)
        .send({ force: true })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({
        id: userToHardDelete.userId,
        updatedAt: expect.any(String),
        deletedAt: expect.any(String),
      });

      await utils.waitForWebsocketEvent({ event: 'userDelete', id: userToHardDelete.userId, timeout: 5000 });
    });
  });

  describe('POST /admin/users/:id/restore', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/admin/users/${userToDelete.userId}/restore`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require authorization', async () => {
      const { status, body } = await request(app)
        .post(`/admin/users/${userToDelete.userId}/restore`)
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`);
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });
  });
});
