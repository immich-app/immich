import { LoginResponseDto, deleteUser, getUserById } from '@immich/sdk';
import { Socket } from 'socket.io-client';
import { createUserDto, userDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('/public-users', () => {
  let websocket: Socket;

  let admin: LoginResponseDto;
  let deletedUser: LoginResponseDto;
  let nonAdmin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });

    [websocket, deletedUser, nonAdmin] = await Promise.all([
      utils.connectWebsocket(admin.accessToken),
      utils.userSetup(admin.accessToken, createUserDto.user1),
      utils.userSetup(admin.accessToken, createUserDto.user2),
    ]);

    await deleteUser({ id: deletedUser.userId, deleteUserDto: {} }, { headers: asBearerAuth(admin.accessToken) });
  });

  afterAll(() => {
    utils.disconnectWebsocket(websocket);
  });

  describe('PUT /user', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/public-users`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    for (const key of Object.keys(userDto.admin)) {
      it(`should not allow null ${key}`, async () => {
        const { status, body } = await request(app)
          .put(`/public-users`)
          .set('Authorization', `Bearer ${admin.accessToken}`)
          .send({ ...userDto.admin, [key]: null });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest());
      });
    }

    it('should not allow a non-admin to become an admin', async () => {
      const { status, body } = await request(app)
        .put(`/public-users`)
        .send({ isAdmin: true, id: nonAdmin.userId })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.alreadyHasAdmin);
    });

    it('ignores updates to profileImagePath', async () => {
      const { status, body } = await request(app)
        .put(`/public-users`)
        .send({ id: admin.userId, profileImagePath: 'invalid.jpg' })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({ id: admin.userId, profileImagePath: '' });
    });

    it('should ignore updates to createdAt, updatedAt and deletedAt', async () => {
      const before = await getUserById({ id: admin.userId }, { headers: asBearerAuth(admin.accessToken) });

      const { status, body } = await request(app)
        .put(`/public-users`)
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
        .put(`/public-users`)
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
        .put(`/public-users`)
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
