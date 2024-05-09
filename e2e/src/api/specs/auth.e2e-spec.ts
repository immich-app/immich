import { LoginResponseDto, login, signUpAdmin } from '@immich/sdk';
import { loginDto, signupDto } from 'src/fixtures';
import { errorDto, loginResponseDto, signupResponseDto } from 'src/responses';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

const { name, email, password } = signupDto.admin;

describe(`/auth/admin-sign-up`, () => {
  beforeEach(async () => {
    await utils.resetDatabase();
  });

  describe('POST /auth/admin-sign-up', () => {
    const invalid = [
      {
        should: 'require an email address',
        data: { name, password },
      },
      {
        should: 'require a password',
        data: { name, email },
      },
      {
        should: 'require a name',
        data: { email, password },
      },
      {
        should: 'require a valid email',
        data: { name, email: 'immich', password },
      },
    ];

    for (const { should, data } of invalid) {
      it(`should ${should}`, async () => {
        const { status, body } = await request(app).post('/auth/admin-sign-up').send(data);
        expect(status).toEqual(400);
        expect(body).toEqual(errorDto.badRequest());
      });
    }

    it(`should sign up the admin`, async () => {
      const { status, body } = await request(app).post('/auth/admin-sign-up').send(signupDto.admin);
      expect(status).toBe(201);
      expect(body).toEqual(signupResponseDto.admin);
    });

    it('should sign up the admin with a local domain', async () => {
      const { status, body } = await request(app)
        .post('/auth/admin-sign-up')
        .send({ ...signupDto.admin, email: 'admin@local' });
      expect(status).toEqual(201);
      expect(body).toEqual({
        ...signupResponseDto.admin,
        email: 'admin@local',
      });
    });

    it('should transform email to lower case', async () => {
      const { status, body } = await request(app)
        .post('/auth/admin-sign-up')
        .send({ ...signupDto.admin, email: 'aDmIn@IMMICH.cloud' });
      expect(status).toEqual(201);
      expect(body).toEqual(signupResponseDto.admin);
    });

    it('should not allow a second admin to sign up', async () => {
      await signUpAdmin({ signUpDto: signupDto.admin });

      const { status, body } = await request(app).post('/auth/admin-sign-up').send(signupDto.admin);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.alreadyHasAdmin);
    });
  });
});

describe('/auth/*', () => {
  let admin: LoginResponseDto;

  beforeEach(async () => {
    await utils.resetDatabase();
    await signUpAdmin({ signUpDto: signupDto.admin });
    admin = await login({ loginCredentialDto: loginDto.admin });
  });

  describe(`POST /auth/login`, () => {
    it('should reject an incorrect password', async () => {
      const { status, body } = await request(app).post('/auth/login').send({ email, password: 'incorrect' });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.incorrectLogin);
    });

    for (const key of Object.keys(loginDto.admin)) {
      it(`should not allow null ${key}`, async () => {
        const { status, body } = await request(app)
          .post('/auth/login')
          .send({ ...loginDto.admin, [key]: null });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest());
      });
    }

    it('should accept a correct password', async () => {
      const { status, body, headers } = await request(app).post('/auth/login').send({ email, password });
      expect(status).toBe(201);
      expect(body).toEqual(loginResponseDto.admin);

      const token = body.accessToken;
      expect(token).toBeDefined();

      const cookies = headers['set-cookie'];
      expect(cookies).toHaveLength(3);
      expect(cookies[0].split(';').map((item) => item.trim())).toEqual([
        `immich_access_token=${token}`,
        'Max-Age=34560000',
        'Path=/',
        expect.stringContaining('Expires='),
        'HttpOnly',
        'SameSite=Lax',
      ]);
      expect(cookies[1].split(';').map((item) => item.trim())).toEqual([
        'immich_auth_type=password',
        'Max-Age=34560000',
        'Path=/',
        expect.stringContaining('Expires='),
        'HttpOnly',
        'SameSite=Lax',
      ]);
      expect(cookies[2].split(';').map((item) => item.trim())).toEqual([
        'immich_is_authenticated=true',
        'Max-Age=34560000',
        'Path=/',
        expect.stringContaining('Expires='),
        'SameSite=Lax',
      ]);
    });
  });

  describe('POST /auth/validateToken', () => {
    it('should reject an invalid token', async () => {
      const { status, body } = await request(app).post(`/auth/validateToken`).set('Authorization', 'Bearer 123');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.invalidToken);
    });

    it('should accept a valid token', async () => {
      const { status, body } = await request(app)
        .post(`/auth/validateToken`)
        .send({})
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({ authStatus: true });
    });
  });

  describe('POST /auth/change-password', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .post(`/auth/change-password`)
        .send({ password, newPassword: 'Password1234' });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require the current password', async () => {
      const { status, body } = await request(app)
        .post(`/auth/change-password`)
        .send({ password: 'wrong-password', newPassword: 'Password1234' })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.wrongPassword);
    });

    it('should change the password', async () => {
      const { status } = await request(app)
        .post(`/auth/change-password`)
        .send({ password, newPassword: 'Password1234' })
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);

      await login({
        loginCredentialDto: {
          email: 'admin@immich.cloud',
          password: 'Password1234',
        },
      });
    });
  });

  describe('POST /auth/logout', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/auth/logout`);
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should logout the user', async () => {
      const { status, body } = await request(app)
        .post(`/auth/logout`)
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({
        successful: true,
        redirectUri: '/auth/login?autoLaunch=0',
      });
    });
  });
});
