import { LoginResponseDto } from '@app/domain';
import { AppModule, UserController } from '@app/immich';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { errorStub, userSignupStub, userStub } from '../fixtures';
import { api, db } from '../test-utils';

describe(`${UserController.name}`, () => {
  let app: INestApplication;
  let server: any;
  let loginResponse: LoginResponseDto;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await moduleFixture.createNestApplication().init();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await db.reset();
    await api.adminSignUp(server);
    loginResponse = await api.adminLogin(server);
    accessToken = loginResponse.accessToken;
  });

  afterAll(async () => {
    await db.disconnect();
    await app.close();
  });

  describe('GET /user', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/user');
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should start with the admin', async () => {
      const { status, body } = await request(server).get('/user').set('Authorization', `Bearer ${accessToken}`);
      expect(status).toEqual(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({ email: 'admin@immich.app' });
    });

    it('should hide deleted users', async () => {
      const user1 = await api.userApi.create(server, accessToken, {
        email: `user1@immich.app`,
        password: 'Password123',
        firstName: `User 1`,
        lastName: 'Test',
      });

      await api.userApi.delete(server, accessToken, user1.id);

      const { status, body } = await request(server)
        .get(`/user`)
        .query({ isAll: true })
        .set('Authorization', `Bearer ${accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({ email: 'admin@immich.app' });
    });

    it('should include deleted users', async () => {
      const user1 = await api.userApi.create(server, accessToken, {
        email: `user1@immich.app`,
        password: 'Password123',
        firstName: `User 1`,
        lastName: 'Test',
      });

      await api.userApi.delete(server, accessToken, user1.id);

      const { status, body } = await request(server)
        .get(`/user`)
        .query({ isAll: false })
        .set('Authorization', `Bearer ${accessToken}`);
      expect(status).toBe(200);
      expect(body).toHaveLength(2);
      expect(body[0]).toMatchObject({ id: user1.id, email: 'user1@immich.app', deletedAt: expect.any(String) });
      expect(body[1]).toMatchObject({ id: loginResponse.userId, email: 'admin@immich.app' });
    });
  });

  describe('GET /user/info/:id', () => {
    it('should require authentication', async () => {
      const { status } = await request(server).get(`/user/info/${loginResponse.userId}`);
      expect(status).toEqual(401);
    });

    it('should get the user info', async () => {
      const { status, body } = await request(server)
        .get(`/user/info/${loginResponse.userId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({ id: loginResponse.userId, email: 'admin@immich.app' });
    });
  });

  describe('GET /user/me', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get(`/user/me`);
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should get my info', async () => {
      const { status, body } = await request(server).get(`/user/me`).set('Authorization', `Bearer ${accessToken}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({ id: loginResponse.userId, email: 'admin@immich.app' });
    });
  });

  describe('POST /user', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).post(`/user`).send(userSignupStub);
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    for (const key of Object.keys(userSignupStub)) {
      it(`should not allow null ${key}`, async () => {
        const { status, body } = await request(server)
          .post(`/user`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ ...userSignupStub, [key]: null });
        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest);
      });
    }

    it('should ignore `isAdmin`', async () => {
      const { status, body } = await request(server)
        .post(`/user`)
        .send({
          isAdmin: true,
          email: 'user1@immich.app',
          password: 'Password123',
          firstName: 'Immich',
          lastName: 'User',
        })
        .set('Authorization', `Bearer ${accessToken}`);
      expect(body).toMatchObject({
        email: 'user1@immich.app',
        isAdmin: false,
        shouldChangePassword: true,
      });
      expect(status).toBe(201);
    });

    it('should create a user without memories enabled', async () => {
      const { status, body } = await request(server)
        .post(`/user`)
        .send({
          email: 'no-memories@immich.app',
          password: 'Password123',
          firstName: 'No Memories',
          lastName: 'User',
          memoriesEnabled: false,
        })
        .set('Authorization', `Bearer ${accessToken}`);
      expect(body).toMatchObject({
        email: 'no-memories@immich.app',
        memoriesEnabled: false,
      });
      expect(status).toBe(201);
    });
  });

  describe('PUT /user', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).put(`/user`);
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    for (const key of Object.keys(userStub.admin)) {
      it(`should not allow null ${key}`, async () => {
        const { status, body } = await request(server)
          .put(`/user`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ ...userStub.admin, [key]: null });
        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest);
      });
    }

    it('should not allow a non-admin to become an admin', async () => {
      const user = await api.userApi.create(server, accessToken, {
        email: 'user1@immich.app',
        password: 'Password123',
        firstName: 'Immich',
        lastName: 'User',
      });

      const { status, body } = await request(server)
        .put(`/user`)
        .send({ isAdmin: true, id: user.id })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.alreadyHasAdmin);
    });

    it('ignores updates to profileImagePath', async () => {
      const user = await api.userApi.update(server, accessToken, {
        id: loginResponse.userId,
        profileImagePath: 'invalid.jpg',
      } as any);

      expect(user).toMatchObject({ id: loginResponse.userId, profileImagePath: '' });
    });

    it('should ignore updates to createdAt, updatedAt and deletedAt', async () => {
      const before = await api.userApi.get(server, accessToken, loginResponse.userId);
      const after = await api.userApi.update(server, accessToken, {
        id: loginResponse.userId,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        deletedAt: '2023-01-01T00:00:00.000Z',
      } as any);

      expect(after).toStrictEqual(before);
    });

    it('should update first and last name', async () => {
      const before = await api.userApi.get(server, accessToken, loginResponse.userId);
      const after = await api.userApi.update(server, accessToken, {
        id: before.id,
        firstName: 'First Name',
        lastName: 'Last Name',
      });

      expect(after).toMatchObject({
        ...before,
        updatedAt: expect.anything(),
        firstName: 'First Name',
        lastName: 'Last Name',
      });
      expect(before.updatedAt).not.toEqual(after.updatedAt);
    });

    it('should update memories enabled', async () => {
      const before = await api.userApi.get(server, accessToken, loginResponse.userId);
      const after = await api.userApi.update(server, accessToken, {
        id: before.id,
        memoriesEnabled: false,
      });

      expect(after).toMatchObject({
        ...before,
        updatedAt: expect.anything(),
        memoriesEnabled: false,
      });
      expect(before.updatedAt).not.toEqual(after.updatedAt);
    });
  });

  describe('GET /user/count', () => {
    it('should not require authentication', async () => {
      const { status, body } = await request(server).get(`/user/count`);
      expect(status).toBe(200);
      expect(body).toEqual({ userCount: 1 });
    });

    it('should start with just the admin', async () => {
      const { status, body } = await request(server).get(`/user/count`).set('Authorization', `Bearer ${accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({ userCount: 1 });
    });

    it('should return the total user count', async () => {
      for (let i = 0; i < 5; i++) {
        await api.userApi.create(server, accessToken, {
          email: `user${i + 1}@immich.app`,
          password: 'Password123',
          firstName: `User ${i + 1}`,
          lastName: 'Test',
        });
      }
      const { status, body } = await request(server).get(`/user/count`).set('Authorization', `Bearer ${accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({ userCount: 6 });
    });
  });
});
