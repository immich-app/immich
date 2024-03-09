import { LoginResponseDto, deleteUser, getUserById } from '@immich/sdk';
import { Socket } from 'socket.io-client';
import { createUserDto, userDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('/user', () => {
  let websocket: Socket;

  let admin: LoginResponseDto;
  let deletedUser: LoginResponseDto;
  let userToDelete: LoginResponseDto;
  let userToHardDelete: LoginResponseDto;
  let nonAdmin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });

    [websocket, deletedUser, nonAdmin, userToDelete, userToHardDelete] = await Promise.all([
      utils.connectWebsocket(admin.accessToken),
      utils.userSetup(admin.accessToken, createUserDto.user1),
      utils.userSetup(admin.accessToken, createUserDto.user2),
      utils.userSetup(admin.accessToken, createUserDto.user3),
      utils.userSetup(admin.accessToken, createUserDto.user4),
    ]);

    await deleteUser({ id: deletedUser.userId, deleteUserDto: {} }, { headers: asBearerAuth(admin.accessToken) });
  });

  afterAll(() => {
    utils.disconnectWebsocket(websocket);
  });

  describe('GET /user', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/user');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should get users', async () => {
      const { status, body } = await request(app).get('/user').set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toEqual(200);
      expect(body).toHaveLength(5);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: 'admin@immich.cloud' }),
          expect.objectContaining({ email: 'user1@immich.cloud' }),
          expect.objectContaining({ email: 'user2@immich.cloud' }),
          expect.objectContaining({ email: 'user3@immich.cloud' }),
          expect.objectContaining({ email: 'user4@immich.cloud' }),
        ]),
      );
    });

    it('should hide deleted users', async () => {
      const { status, body } = await request(app)
        .get(`/user`)
        .query({ isAll: true })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(4);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: 'admin@immich.cloud' }),
          expect.objectContaining({ email: 'user2@immich.cloud' }),
          expect.objectContaining({ email: 'user3@immich.cloud' }),
          expect.objectContaining({ email: 'user4@immich.cloud' }),
        ]),
      );
    });

    it('should include deleted users', async () => {
      const { status, body } = await request(app)
        .get(`/user`)
        .query({ isAll: false })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toHaveLength(5);
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: 'admin@immich.cloud' }),
          expect.objectContaining({ email: 'user1@immich.cloud' }),
          expect.objectContaining({ email: 'user2@immich.cloud' }),
          expect.objectContaining({ email: 'user3@immich.cloud' }),
          expect.objectContaining({ email: 'user4@immich.cloud' }),
        ]),
      );
    });
  });

  describe('GET /user/info/:id', () => {
    it('should require authentication', async () => {
      const { status } = await request(app).get(`/user/info/${admin.userId}`);
      expect(status).toEqual(401);
    });

    it('should get the user info', async () => {
      const { status, body } = await request(app)
        .get(`/user/info/${admin.userId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({
        id: admin.userId,
        email: 'admin@immich.cloud',
      });
    });
  });

  describe('GET /user/me', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/user/me`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should get my info', async () => {
      const { status, body } = await request(app).get(`/user/me`).set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({
        id: admin.userId,
        email: 'admin@immich.cloud',
      });
    });
  });

  describe('POST /user', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/user`).send(createUserDto.user1);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    for (const key of Object.keys(createUserDto.user1)) {
      it(`should not allow null ${key}`, async () => {
        const { status, body } = await request(app)
          .post(`/user`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ ...createUserDto.user1, [key]: null });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest());
      });
    }

    it('should ignore `isAdmin`', async () => {
      const { status, body } = await request(app)
        .post(`/user`)
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

    it('should create a user without memories enabled', async () => {
      const { status, body } = await request(app)
        .post(`/user`)
        .send({
          email: 'no-memories@immich.cloud',
          password: 'Password123',
          name: 'No Memories',
          memoriesEnabled: false,
        })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toMatchObject({
        email: 'no-memories@immich.cloud',
        memoriesEnabled: false,
      });
      expect(status).toBe(201);
    });
  });

  describe('DELETE /user/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).delete(`/user/${userToDelete.userId}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should delete user', async () => {
      const { status, body } = await request(app)
        .delete(`/user/${userToDelete.userId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({
        id: userToDelete.userId,
        updatedAt: expect.any(String),
        deletedAt: expect.any(String),
      });
    });

    it('should hard delete user', async () => {
      const { status, body } = await request(app)
        .delete(`/user/${userToHardDelete.userId}`)
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

  describe('PUT /user', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/user`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    for (const key of Object.keys(userDto.admin)) {
      it(`should not allow null ${key}`, async () => {
        const { status, body } = await request(app)
          .put(`/user`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ ...userDto.admin, [key]: null });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest());
      });
    }

    it('should not allow a non-admin to become an admin', async () => {
      const { status, body } = await request(app)
        .put(`/user`)
        .send({ isAdmin: true, id: nonAdmin.userId })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.alreadyHasAdmin);
    });

    it('ignores updates to profileImagePath', async () => {
      const { status, body } = await request(app)
        .put(`/user`)
        .send({ id: admin.userId, profileImagePath: 'invalid.jpg' })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({ id: admin.userId, profileImagePath: '' });
    });

    it('should ignore updates to createdAt, updatedAt and deletedAt', async () => {
      const before = await getUserById({ id: admin.userId }, { headers: asBearerAuth(admin.accessToken) });

      const { status, body } = await request(app)
        .put(`/user`)
        .send({
          id: admin.userId,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          deletedAt: '2023-01-01T00:00:00.000Z',
        })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toStrictEqual(before);
    });

    it('should update first and last name', async () => {
      const before = await getUserById({ id: admin.userId }, { headers: asBearerAuth(admin.accessToken) });

      const { status, body } = await request(app)
        .put(`/user`)
        .send({
          id: admin.userId,
          name: 'Name',
        })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({
        ...before,
        updatedAt: expect.any(String),
        name: 'Name',
      });
      expect(before.updatedAt).not.toEqual(body.updatedAt);
    });

    it('should update memories enabled', async () => {
      const before = await getUserById({ id: admin.userId }, { headers: asBearerAuth(admin.accessToken) });
      const { status, body } = await request(app)
        .put(`/user`)
        .send({
          id: admin.userId,
          memoriesEnabled: false,
        })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({
        ...before,
        updatedAt: expect.anything(),
        memoriesEnabled: false,
      });
      expect(before.updatedAt).not.toEqual(body.updatedAt);
    });
  });
});
