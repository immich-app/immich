import { AuthController } from '@app/immich';
import { api } from '@test/api';
import { db } from '@test/db';
import {
  adminSignupStub,
  changePasswordStub,
  deviceStub,
  errorStub,
  loginResponseStub,
  loginStub,
  signupResponseStub,
  uuidStub,
} from '@test/fixtures';
import { testApp } from '@test/test-utils';
import request from 'supertest';

const firstName = 'Immich';
const lastName = 'Admin';
const password = 'Password123';
const email = 'admin@immich.app';

describe(`${AuthController.name} (e2e)`, () => {
  let server: any;
  let accessToken: string;

  beforeAll(async () => {
    await testApp.reset();
    [server] = await testApp.create();
  });

  afterAll(async () => {
    await testApp.teardown();
  });

  beforeEach(async () => {
    await db.reset();
    await api.authApi.adminSignUp(server);
    const response = await api.authApi.adminLogin(server);
    accessToken = response.accessToken;
  });

  describe('POST /auth/admin-sign-up', () => {
    beforeEach(async () => {
      await db.reset();
    });

    const invalid = [
      {
        should: 'require an email address',
        data: { firstName, lastName, password },
      },
      {
        should: 'require a password',
        data: { firstName, lastName, email },
      },
      {
        should: 'require a first name ',
        data: { lastName, email, password },
      },
      {
        should: 'require a last name ',
        data: { firstName, email, password },
      },
      {
        should: 'require a valid email',
        data: { firstName, lastName, email: 'immich', password },
      },
    ];

    for (const { should, data } of invalid) {
      it(`should ${should}`, async () => {
        const { status, body } = await request(server).post('/auth/admin-sign-up').send(data);
        expect(status).toEqual(400);
        expect(body).toEqual(errorStub.badRequest());
      });
    }

    it(`should sign up the admin`, async () => {
      await api.authApi.adminSignUp(server);
    });

    it('should sign up the admin with a local domain', async () => {
      const { status, body } = await request(server)
        .post('/auth/admin-sign-up')
        .send({ ...adminSignupStub, email: 'admin@local' });
      expect(status).toEqual(201);
      expect(body).toEqual({ ...signupResponseStub, email: 'admin@local' });
    });

    it('should transform email to lower case', async () => {
      const { status, body } = await request(server)
        .post('/auth/admin-sign-up')
        .send({ ...adminSignupStub, email: 'aDmIn@IMMICH.app' });
      expect(status).toEqual(201);
      expect(body).toEqual(signupResponseStub);
    });

    it('should not allow a second admin to sign up', async () => {
      await api.authApi.adminSignUp(server);

      const { status, body } = await request(server).post('/auth/admin-sign-up').send(adminSignupStub);

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.alreadyHasAdmin);
    });

    for (const key of Object.keys(adminSignupStub)) {
      it(`should not allow null ${key}`, async () => {
        const { status, body } = await request(server)
          .post('/auth/admin-sign-up')
          .send({ ...adminSignupStub, [key]: null });
        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest());
      });
    }
  });

  describe(`POST /auth/login`, () => {
    it('should reject an incorrect password', async () => {
      const { status, body } = await request(server).post('/auth/login').send({ email, password: 'incorrect' });
      expect(body).toEqual(errorStub.incorrectLogin);
      expect(status).toBe(401);
    });

    for (const key of Object.keys(loginStub.admin)) {
      it(`should not allow null ${key}`, async () => {
        const { status, body } = await request(server)
          .post('/auth/login')
          .send({ ...loginStub.admin, [key]: null });
        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest());
      });
    }

    it('should accept a correct password', async () => {
      const { status, body, headers } = await request(server).post('/auth/login').send({ email, password });
      expect(status).toBe(201);
      expect(body).toEqual(loginResponseStub.admin.response);

      const token = body.accessToken;
      expect(token).toBeDefined();

      const cookies = headers['set-cookie'];
      expect(cookies).toHaveLength(2);
      expect(cookies[0]).toEqual(`immich_access_token=${token}; HttpOnly; Path=/; Max-Age=34560000; SameSite=Lax;`);
      expect(cookies[1]).toEqual('immich_auth_type=password; HttpOnly; Path=/; Max-Age=34560000; SameSite=Lax;');
    });
  });

  describe('GET /auth/devices', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/auth/devices');
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should get a list of authorized devices', async () => {
      const { status, body } = await request(server).get('/auth/devices').set('Authorization', `Bearer ${accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual([deviceStub.current]);
    });
  });

  describe('DELETE /auth/devices', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).delete(`/auth/devices`);
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should logout all devices (except the current one)', async () => {
      for (let i = 0; i < 5; i++) {
        await api.authApi.adminLogin(server);
      }

      await expect(api.authApi.getAuthDevices(server, accessToken)).resolves.toHaveLength(6);

      const { status } = await request(server).delete(`/auth/devices`).set('Authorization', `Bearer ${accessToken}`);
      expect(status).toBe(204);

      await api.authApi.validateToken(server, accessToken);
    });
  });

  describe('DELETE /auth/devices/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).delete(`/auth/devices/${uuidStub.notFound}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should logout a device', async () => {
      const [device] = await api.authApi.getAuthDevices(server, accessToken);
      const { status } = await request(server)
        .delete(`/auth/devices/${device.id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(status).toBe(204);

      const response = await request(server).post('/auth/validateToken').set('Authorization', `Bearer ${accessToken}`);
      expect(response.body).toEqual(errorStub.invalidToken);
      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/validateToken', () => {
    it('should reject an invalid token', async () => {
      const { status, body } = await request(server).post(`/auth/validateToken`).set('Authorization', 'Bearer 123');
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.invalidToken);
    });

    it('should accept a valid token', async () => {
      const { status, body } = await request(server)
        .post(`/auth/validateToken`)
        .send({})
        .set('Authorization', `Bearer ${accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({ authStatus: true });
    });
  });

  describe('POST /auth/change-password', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).post(`/auth/change-password`).send(changePasswordStub);
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    for (const key of Object.keys(changePasswordStub)) {
      it(`should not allow null ${key}`, async () => {
        const { status, body } = await request(server)
          .post('/auth/change-password')
          .send({ ...changePasswordStub, [key]: null })
          .set('Authorization', `Bearer ${accessToken}`);
        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest());
      });
    }

    it('should require the current password', async () => {
      const { status, body } = await request(server)
        .post(`/auth/change-password`)
        .send({ ...changePasswordStub, password: 'wrong-password' })
        .set('Authorization', `Bearer ${accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorStub.wrongPassword);
    });

    it('should change the password', async () => {
      const { status } = await request(server)
        .post(`/auth/change-password`)
        .send(changePasswordStub)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(status).toBe(200);

      await api.authApi.login(server, { email: 'admin@immich.app', password: 'Password1234' });
    });
  });

  describe('POST /auth/logout', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).post(`/auth/logout`);
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should logout the user', async () => {
      const { status, body } = await request(server).post(`/auth/logout`).set('Authorization', `Bearer ${accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({ successful: true, redirectUri: '/auth/login?autoLaunch=0' });
    });
  });
});
