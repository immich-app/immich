import {
  LoginResponseDto,
  UserResponseDto,
  createUser,
  deleteUser,
  getUserById,
} from '@immich/sdk';
import { createUserDto, userDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { apiUtils, app, asBearerAuth, dbUtils } from 'src/utils';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('/server-info', () => {
  let admin: LoginResponseDto;

  beforeAll(async () => {
    apiUtils.setup();
  });

  beforeEach(async () => {
    await dbUtils.reset();
    admin = await apiUtils.adminSetup({ onboarding: false });
  });

  describe('GET /user', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/user');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should start with the admin', async () => {
      const { status, body } = await request(app)
        .get('/user')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toEqual(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({ email: 'admin@immich.cloud' });
    });

    it('should hide deleted users', async () => {
      const user1 = await apiUtils.userSetup(
        admin.accessToken,
        createUserDto.user1
      );
      await deleteUser(
        { id: user1.userId },
        { headers: asBearerAuth(admin.accessToken) }
      );

      const { status, body } = await request(app)
        .get(`/user`)
        .query({ isAll: true })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({ email: 'admin@immich.cloud' });
    });

    it('should include deleted users', async () => {
      const user1 = await apiUtils.userSetup(
        admin.accessToken,
        createUserDto.user1
      );
      await deleteUser(
        { id: user1.userId },
        { headers: asBearerAuth(admin.accessToken) }
      );

      const { status, body } = await request(app)
        .get(`/user`)
        .query({ isAll: false })
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toHaveLength(2);
      expect(body[0]).toMatchObject({
        id: user1.userId,
        email: 'user1@immich.cloud',
        deletedAt: expect.any(String),
      });
      expect(body[1]).toMatchObject({
        id: admin.userId,
        email: 'admin@immich.cloud',
      });
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
      const { status, body } = await request(app)
        .get(`/user/me`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({
        id: admin.userId,
        email: 'admin@immich.cloud',
      });
    });
  });

  describe('POST /user', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .post(`/user`)
        .send(createUserDto.user1);
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
          email: 'user1@immich.cloud',
          password: 'Password123',
          name: 'Immich',
        })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(body).toMatchObject({
        email: 'user1@immich.cloud',
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
    let userToDelete: UserResponseDto;

    beforeEach(async () => {
      userToDelete = await createUser(
        { createUserDto: createUserDto.user1 },
        { headers: asBearerAuth(admin.accessToken) }
      );
    });

    it('should require authentication', async () => {
      const { status, body } = await request(app).delete(
        `/user/${userToDelete.id}`
      );
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should delete user', async () => {
      const { status, body } = await request(app)
        .delete(`/user/${userToDelete.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({
        ...userToDelete,
        updatedAt: expect.any(String),
        deletedAt: expect.any(String),
      });
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
      const user = await apiUtils.userSetup(
        admin.accessToken,
        createUserDto.user1
      );

      const { status, body } = await request(app)
        .put(`/user`)
        .send({ isAdmin: true, id: user.userId })
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
      const before = await getUserById(
        { id: admin.userId },
        { headers: asBearerAuth(admin.accessToken) }
      );

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
      const before = await getUserById(
        { id: admin.userId },
        { headers: asBearerAuth(admin.accessToken) }
      );

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
      const before = await getUserById(
        { id: admin.userId },
        { headers: asBearerAuth(admin.accessToken) }
      );
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
