import { AppModule, AuthController } from '@app/immich';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { errorStub, loginResponseStub, signupResponseStub, signupStub } from '../fixtures';
import { api, db } from '../test-utils';

const firstName = 'Immich';
const lastName = 'Admin';
const password = 'Password123';
const email = 'admin@immich.app';

describe(`${AuthController.name} (e2e)`, () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await moduleFixture.createNestApplication().init();
    server = app.getHttpServer();
    await db.reset();
  });

  afterAll(async () => {
    await db.disconnect();
    await app.close();
  });

  describe('POST /auth/admin-sign-up', () => {
    beforeEach(async () => {
      await db.reset();
    });

    const invalid = [
      { should: 'require an email address', data: { firstName, lastName, password } },
      { should: 'require a password', data: { firstName, lastName, email } },
      { should: 'require a first name ', data: { lastName, email, password } },
      { should: 'require a last name ', data: { firstName, email, password } },
      { should: 'require a valid email', data: { firstName, lastName, email: 'immich', password } },
    ];

    for (const { should, data } of invalid) {
      it(`should ${should}`, async () => {
        const { status, body } = await request(server).post('/auth/admin-sign-up').send(data);
        expect(status).toEqual(400);
        expect(body).toEqual(errorStub.badRequest);
      });
    }

    it(`should sign up the admin`, async () => {
      await api.adminSignUp(server);
    });

    it('should sign up the admin with a local domain', async () => {
      const { status, body } = await request(server)
        .post('/auth/admin-sign-up')
        .send({ ...signupStub, email: 'admin@local' });
      expect(status).toEqual(201);
      expect(body).toEqual({ ...signupResponseStub, email: 'admin@local' });
    });

    it('should transform email to lower case', async () => {
      const { status, body } = await request(server)
        .post('/auth/admin-sign-up')
        .send({ ...signupStub, email: 'aDmIn@IMMICH.app' });
      expect(status).toEqual(201);
      expect(body).toEqual(signupResponseStub);
    });

    it('should not allow a second admin to sign up', async () => {
      await api.adminSignUp(server);

      const { status, body } = await request(server).post('/auth/admin-sign-up').send(signupStub);

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.alreadyHasAdmin);
    });
  });

  describe(`POST /auth/login`, () => {
    it('should reject an incorrect password', async () => {
      const { status, body } = await request(server).post('/auth/login').send({ email, password: 'incorrect' });
      expect(body).toEqual(errorStub.incorrectLogin);
      expect(status).toEqual(401);
    });

    it('should accept a correct password', async () => {
      const { status, body, headers } = await request(server).post('/auth/login').send({ email, password });
      expect(status).toEqual(201);
      expect(body).toEqual(loginResponseStub.admin.response);

      const token = body.accessToken;
      expect(token).toBeDefined();

      const cookies = headers['set-cookie'];
      expect(cookies).toHaveLength(2);
      expect(cookies[0]).toEqual(`immich_access_token=${token}; HttpOnly; Path=/; Max-Age=34560000; SameSite=Lax;`);
      expect(cookies[1]).toEqual('immich_auth_type=password; HttpOnly; Path=/; Max-Age=34560000; SameSite=Lax;');
    });
  });
});
